import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import axios from 'axios';
import { Button, Modal, toast } from '@/components/ui';
import { useAuthStore } from '@/stores/authStore';
import { staffingError } from '@/lib/api/staffingError';
import { getManagerOfficers } from '@/lib/api';
import { staffingFormSchema } from '@/lib/staffingValidation';
export { validatePeriod, vietnamIso } from '@/lib/staffingValidation';

export const fieldClass = 'w-full min-w-0 rounded-lg border border-slate-300 bg-white p-2.5 text-sm';
export const dateText = (value: string) => new Date(value).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
export const statusText = (value: string) => ({ PENDING: 'Chờ duyệt', APPROVED: 'Đã duyệt', REJECTED: 'Từ chối', CANCELLED: 'Đã hủy', OPEN: 'Chờ trả lời', ANSWERED: 'Đã trả lời', CLOSED: 'Đã đóng', SUBMITTED: 'Chờ tiền kiểm', UNDER_REVIEW: 'Đang kiểm tra', NEED_REVISION: 'Cần bổ sung', DOCUMENTS_READY: 'Giấy tờ sẵn sàng' }[value] || value);
export function useStaffAccess() {
  const user = useAuthStore(s => s.user);
  const manager = user?.roles.includes('MANAGER') === true;
  const officer = user?.roles.includes('FRONT_DESK_OFFICER') === true && !manager;
  return { user, manager, officer, can: (permission: string) => user?.permissions.includes(permission) === true };
}
export function useStaffQuery<T>(key: readonly unknown[], fn: (signal: AbortSignal) => Promise<T>, enabled = true) {
  const { user } = useStaffAccess();
  return useQuery({ queryKey: ['staffing', user?.id, ...key], queryFn: ({ signal }) => fn(signal), enabled: Boolean(user) && enabled, retry: false });
}
export function useStaffDirectory(enabled: boolean) {
  return useStaffQuery(['directory'], async () => {
    const first = await getManagerOfficers({ page: 1, pageSize: 100 });
    const items = [...first.items];
    for (let p = 2; items.length < first.total; p++) {
      const next = await getManagerOfficers({ page: p, pageSize: 100 });
      if (!next.items.length) throw new Error('Danh sách cán bộ chưa đầy đủ. Vui lòng tải lại.');
      items.push(...next.items);
    }
    return items;
  }, enabled);
}
export function QueryState({ query, empty }: { query: { isPending: boolean; isError: boolean; error: unknown; refetch: () => unknown }; empty?: boolean }) {
  if (query.isPending) return <p role="status">Đang tải dữ liệu…</p>;
  if (query.isError) return <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800"><p>{staffingError(query.error)}</p><Button variant="outline" onClick={() => void query.refetch()}>Thử lại</Button></div>;
  return empty ? <p className="py-6 text-sm text-slate-500">Chưa có dữ liệu trong phạm vi đang xem.</p> : null;
}
export function Pager({ page, total, setPage }: { page: number; total: number; setPage: (page: number) => void }) {
  return <div className="flex flex-wrap items-center gap-3"><Button variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>Trước</Button><span>Trang {page} · {total} mục</span><Button variant="outline" disabled={page * 20 >= total} onClick={() => setPage(page + 1)}>Sau</Button></div>;
}
type Field = { name: string; label: string; type?: 'text' | 'textarea' | 'datetime-local' | 'select'; options?: { value: string; label: string; disabled?: boolean }[]; max?: number };
export function ActionForm({ title, description, fields, validate, submit, onClose, children }: {
  title: string; description?: string; fields: Field[]; validate?: (values: Record<string, string>) => string | undefined;
  submit: (values: Record<string, string>) => Promise<unknown>; onClose: () => void; children?: ReactNode;
}) {
  const formId = useId();
  const client = useQueryClient();
  const lock = useRef(false);
  const [error, setError] = useState('');
  const [conflict, setConflict] = useState(false);
  const pendingFocus = useRef<string | null>(null);
  const form = useForm<Record<string, string>>({ resolver: zodResolver(staffingFormSchema(fields)), defaultValues: Object.fromEntries(fields.map(f => [f.name, ''])) });
  const busy = form.formState.isSubmitting;
  useEffect(() => {
    if (!busy && pendingFocus.current) { form.setFocus(pendingFocus.current); pendingFocus.current = null; }
  }, [busy, form]);
  const handle = form.handleSubmit(async values => {
    if (lock.current || conflict) return;
    const message = validate?.(values);
    if (message) { setError(message); return; }
    lock.current = true;
    setError('');
    try {
      await submit(values);
      await Promise.all(['staffing', 'workflow', 'document-form'].map(key => client.invalidateQueries({ queryKey: [key] })));
      toast.success('Đã lưu thay đổi.');
      onClose();
    } catch (e) {
      const status = axios.isAxiosError(e) ? e.response?.status : undefined;
      if (status === 400 && axios.isAxiosError(e)) {
        const errors: unknown = e.response?.data?.errors;
        if (errors && typeof errors === 'object') {
          for (const [key, messages] of Object.entries(errors)) {
            const name = fields.find(f => f.name.toLowerCase() === key.replace(/^\$\./, '').toLowerCase())?.name;
            if (name && Array.isArray(messages) && typeof messages[0] === 'string') {
              form.setError(name, { message: messages[0] });
              pendingFocus.current ??= name;
            }
          }
        }
      }
      const uncertain = status === undefined || status >= 500;
      const review = [403, 404, 409, 422].includes(status ?? 0) || uncertain;
      if (review) {
        setConflict(true);
        await Promise.all(['staffing', 'workflow', 'document-form'].map(key => client.invalidateQueries({ queryKey: [key] })));
      }
      setError(status === 409 ? 'Dữ liệu hoặc trạng thái đã thay đổi/trùng lịch. Đã tải lại dữ liệu; đóng hộp thoại và kiểm tra trước khi thao tác lại.' : `${staffingError(e)}${review ? ' Đóng hộp thoại và kiểm tra dữ liệu mới nhất trước khi thao tác lại.' : ''}`);
    } finally { lock.current = false; }
  });
  return <Modal open onOpenChange={open => !open && !busy && onClose()} title={title} description={description} footer={<><Button variant="outline" disabled={busy} onClick={onClose}>Đóng</Button><Button type="submit" form={formId} disabled={busy || conflict}>{busy ? 'Đang lưu…' : 'Xác nhận'}</Button></>}>
    {children}<form id={formId} onSubmit={e => void handle(e)} noValidate className="grid gap-4">{fields.map(f => <label key={f.name} className="grid gap-1 text-sm font-medium">{f.label}<span className="sr-only"> (bắt buộc)</span>
      {f.type === 'textarea' ? <textarea rows={4} maxLength={f.max ?? 2000} className={fieldClass} disabled={busy || conflict} {...form.register(f.name)} aria-invalid={Boolean(form.formState.errors[f.name])} aria-describedby={form.formState.errors[f.name] ? `${formId}-${f.name}-error` : undefined} /> : f.type === 'select' ? <select className={fieldClass} disabled={busy || conflict} {...form.register(f.name)} aria-invalid={Boolean(form.formState.errors[f.name])} aria-describedby={form.formState.errors[f.name] ? `${formId}-${f.name}-error` : undefined}><option value="">Chọn…</option>{f.options?.map(o => <option key={o.value} value={o.value} disabled={o.disabled}>{o.label}</option>)}</select> : <input type={f.type ?? 'text'} className={fieldClass} disabled={busy || conflict} {...form.register(f.name)} aria-invalid={Boolean(form.formState.errors[f.name])} aria-describedby={form.formState.errors[f.name] ? `${formId}-${f.name}-error` : undefined} />}
      {form.formState.errors[f.name] && <span id={`${formId}-${f.name}-error`} role="alert" className="text-red-700">{form.formState.errors[f.name]?.message}</span>}</label>)}{error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-800">{error}</p>}</form>
  </Modal>;
}
