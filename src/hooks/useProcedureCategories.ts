import { useQuery } from '@tanstack/react-query';
import { procedureApi, type ProcedureQuery } from '@/lib/api/procedures';

// Dùng hợp đồng Catalog và validation có sẵn; chuyển tiếp signal để hủy request.
export function useProcedureCategories() {
  return useQuery({
    queryKey: ['procedures', 'categories'],
    queryFn: ({ signal }) => procedureApi.categories(signal),
    staleTime: 5 * 60_000,
  });
}

function delayForSearch(signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const timer = window.setTimeout(resolve, 350);
    signal.addEventListener('abort', () => {
      window.clearTimeout(timer);
      reject(new DOMException('Aborted', 'AbortError'));
    }, { once: true });
  });
}

/** Danh mục công khai: key chứa đủ bộ lọc để cache không lẫn kết quả giữa các trang. */
export function usePublicProcedureList(query: ProcedureQuery, debounce = false) {
  const normalized = {
    keyword: query.keyword?.trim() || undefined,
    categoryId: query.categoryId,
    pageNumber: query.pageNumber ?? 1,
    pageSize: query.pageSize,
  };
  return useQuery({
    queryKey: ['procedures', 'public', 'list', normalized],
    queryFn: async ({ signal }) => {
      if (debounce && normalized.keyword) await delayForSearch(signal);
      return procedureApi.list(normalized, false, signal);
    },
  });
}

export function usePublicProcedureDetail(id?: string) {
  return useQuery({
    queryKey: ['procedures', 'public', 'detail', id],
    queryFn: ({ signal }) => procedureApi.detail(id!, signal),
    enabled: Boolean(id),
  });
}

export function useFeaturedProcedures() {
  return useQuery({
    queryKey: ['procedures', 'public', 'featured'],
    queryFn: ({ signal }) => procedureApi.featured(signal),
    staleTime: 5 * 60_000,
  });
}

/** Rút tên thủ tục còn tối đa 5 từ để làm nút gợi ý; vẫn đủ để ô tìm kiếm khớp thủ tục. */
export function shortProcedureLabel(title: string, maxWords = 5) {
  const words = title.trim().split(/\s+/);
  return words.length > maxWords ? words.slice(0, maxWords).join(' ') : title.trim();
}

/**
 * FE-06: gợi ý tìm kiếm/câu hỏi lấy từ thủ tục nổi bật đang công khai (API featured), không cố định trong code,
 * để không trỏ tới thủ tục đã ẩn. Chưa tải xong hoặc lỗi thì trả mảng rỗng (ẩn gợi ý).
 */
export function useProcedureSuggestions(limit = 5) {
  const featured = useFeaturedProcedures();
  return (featured.data ?? []).slice(0, limit).map(item => ({ id: item.id, title: item.title, label: shortProcedureLabel(item.title) }));
}
