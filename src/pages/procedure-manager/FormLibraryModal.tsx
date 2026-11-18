import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Check, MagnifyingGlass } from '@phosphor-icons/react';
import { Button, EmptyState, ErrorAlert, ListSkeleton, Modal, Pagination } from '@/components/ui';
import { FormTemplateActions } from '@/components/forms/FormTemplateActions';
import { procedureApi, procedureError, type DocumentFormOption } from '@/lib/api/procedures';
import { useAuthStore } from '@/stores/authStore';

const PAGE_SIZE = 20;
type TypeFilter = 'ALL' | 'DOCX_TEMPLATE' | 'ONLINE_INTERACTIVE';
const typeFilters: { id: TypeFilter; label: string }[] = [
  { id: 'ALL', label: 'Tất cả' },
  { id: 'DOCX_TEMPLATE', label: 'Phôi Word' },
  { id: 'ONLINE_INTERACTIVE', label: 'Mẫu điện tử' },
];

/**
 * Kho biểu mẫu dạng bảng gọn trong hộp thoại: mỗi mẫu một dòng, chọn nhiều rồi thêm một lần.
 * Kho có nhiều mẫu vẫn không làm dài trang vì bảng cuộn trong hộp thoại, phân trang nằm cố định ở chân.
 */
export function FormLibraryModal({
  open,
  onOpenChange,
  isAttached,
  onAdd,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Mẫu đã gắn với thủ tục (hiện mờ, không chọn lại) */
  isAttached: (form: DocumentFormOption) => boolean;
  onAdd: (forms: DocumentFormOption[]) => void;
}) {
  const user = useAuthStore(state => state.user);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [type, setType] = useState<TypeFilter>('ALL');
  // Giữ lựa chọn khi đổi trang / đổi từ khóa
  const [picked, setPicked] = useState<Map<string, DocumentFormOption>>(new Map());

  useEffect(() => {
    if (!open) return;
    setPicked(new Map());
    setSearch('');
    setPage(1);
    setType('ALL');
  }, [open]);

  const query = useQuery({
    queryKey: ['procedure-document-forms', search.trim(), page],
    queryFn: async ({ signal }) => {
      if (search.trim()) await new Promise<void>((resolve, reject) => {
        const timer = window.setTimeout(resolve, 300);
        signal.addEventListener('abort', () => {
          window.clearTimeout(timer);
          reject(new DOMException('Aborted', 'AbortError'));
        }, { once: true });
      });
      return procedureApi.documentForms(search.trim(), page, PAGE_SIZE, signal);
    },
    enabled: Boolean(user && open),
  });

  // API chỉ lọc theo mã; lọc loại mẫu làm trên trang đang xem
  const rows = (query.data ?? []).filter(form => type === 'ALL' || form.formType === type);
  const toggle = (form: DocumentFormOption) => setPicked(current => {
    const next = new Map(current);
    if (next.has(form.id)) next.delete(form.id);
    else next.set(form.id, form);
    return next;
  });
  const add = () => {
    onAdd([...picked.values()]);
    onOpenChange(false);
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Chọn biểu mẫu từ kho"
      className="sm:max-h-[90dvh] sm:max-w-4xl"
      bodyClassName="p-0"
      footer={
        <div className="flex w-full flex-wrap items-center justify-between gap-3">
          {/* Kho không trả tổng số: còn trang sau khi trang hiện tại đủ PAGE_SIZE mẫu */}
          <Pagination
            label="Phân trang kho biểu mẫu"
            page={page}
            pageSize={PAGE_SIZE}
            hasNext={(query.data?.length ?? 0) >= PAGE_SIZE}
            onPageChange={setPage}
          />
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
            <Button disabled={!picked.size} onClick={add}>{picked.size ? `Thêm ${picked.size} mẫu` : 'Thêm mẫu'}</Button>
          </div>
        </div>
      }
    >
      <div className="sticky top-0 z-10 flex flex-wrap items-center gap-2 border-b border-slate-200 bg-white px-6 py-3">
        <label className="relative min-w-56 flex-1">
          <span className="sr-only">Tìm biểu mẫu theo mã</span>
          <MagnifyingGlass size={16} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            autoFocus
            value={search}
            onChange={event => { setSearch(event.target.value); setPage(1); }}
            placeholder="Tìm theo mã, ví dụ: DON_01"
            className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-100"
          />
        </label>
        <div role="radiogroup" aria-label="Loại biểu mẫu" className="inline-flex rounded-lg bg-slate-100 p-0.5">
          {typeFilters.map(item => (
            <button
              key={item.id}
              type="button"
              role="radio"
              aria-checked={type === item.id}
              onClick={() => setType(item.id)}
              className="min-h-9 rounded-md px-3 text-xs font-semibold text-slate-600 aria-checked:bg-white aria-checked:text-red-800 aria-checked:shadow-sm"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {query.isPending ? (
        <div className="p-6"><ListSkeleton rows={6} /></div>
      ) : query.isError ? (
        <div className="p-6">
          <ErrorAlert retryLabel="Thử lại" retrying={query.isFetching} onRetry={() => void query.refetch()}>{procedureError(query.error)}</ErrorAlert>
        </div>
      ) : rows.length === 0 ? (
        <EmptyState className="py-10" title="Không tìm thấy mẫu phù hợp." description={search ? 'Hãy thử mã khác.' : 'Trang này không có mẫu thuộc loại đã chọn.'} />
      ) : (
        <ul className="divide-y divide-slate-100" aria-label="Danh sách biểu mẫu">
          {rows.map(form => {
            const attached = isAttached(form);
            const checked = attached || picked.has(form.id);
            return (
              <li key={form.id} className={`flex items-center gap-3 px-6 py-2.5 ${attached ? 'bg-slate-50' : checked ? 'bg-red-50/60' : 'hover:bg-slate-50'}`}>
                <label className={`flex min-w-0 flex-1 items-center gap-3 ${attached ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                  <input
                    type="checkbox"
                    className="size-4 shrink-0 accent-red-700"
                    checked={checked}
                    disabled={attached}
                    onChange={() => toggle(form)}
                  />
                  <span className="w-28 shrink-0 truncate font-mono text-xs font-bold text-red-900" title={form.formCode}>{form.formCode}</span>
                  <span className="min-w-0 flex-1 truncate text-sm text-slate-900" title={form.formName}>{form.formName}</span>
                  <span className="hidden shrink-0 rounded bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 sm:inline">
                    {form.formType === 'ONLINE_INTERACTIVE' ? 'Điện tử' : 'Word'}
                  </span>
                  {attached && (
                    <span className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-emerald-700">
                      <Check size={14} weight="bold" aria-hidden="true" />Đã gắn
                    </span>
                  )}
                </label>
                <div className="shrink-0">
                  <FormTemplateActions templateId={form.id} name={form.formName} hasFile previewOnly />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Modal>
  );
}
