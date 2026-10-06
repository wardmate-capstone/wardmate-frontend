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
