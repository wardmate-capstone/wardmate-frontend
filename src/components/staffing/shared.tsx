import { useId, useRef, useState, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axios from 'axios';
import { Button, Modal, toast } from '@/components/ui';
import { useAuthStore } from '@/stores/authStore';
import { workflowError } from '@/lib/api/workflow';
import { getManagerOfficers } from '@/lib/api';

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
  if (query.isError) return <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800"><p>{workflowError(query.error)}</p><Button variant="outline" onClick={() => void query.refetch()}>Thử lại</Button></div>;
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
  const shape = Object.fromEntries(fields.map(f => [f.name, z.string().trim().min(1, 'Vui lòng nhập thông tin.').max(f.max ?? 2000, `Tối đa ${f.max ?? 2000} ký tự.`)]));
  const form = useForm<Record<string, string>>({ resolver: zodResolver(z.object(shape)), defaultValues: Object.fromEntries(fields.map(f => [f.name, ''])) });
  const busy = form.formState.isSubmitting;
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
            const name = fields.find(f => f.name.toLowerCase() === key.toLowerCase())?.name;
            if (name && Array.isArray(messages) && typeof messages[0] === 'string') form.setError(name, { message: messages[0] });
          }
        }
      }
      if (status === 409 || status === 422) {
        await Promise.all(['staffing', 'workflow', 'document-form'].map(key => client.invalidateQueries({ queryKey: [key] })));
        setConflict(true);
      }
      setError(status === 409 ? 'Dữ liệu hoặc trạng thái đã thay đổi/trùng lịch. Đã tải lại dữ liệu; đóng hộp thoại và kiểm tra trước khi thao tác lại.' : workflowError(e));
    } finally { lock.current = false; }
  });
  return <Modal open onOpenChange={open => !open && !busy && onClose()} title={title} description={description} footer={<><Button variant="outline" disabled={busy} onClick={onClose}>Đóng</Button><Button type="submit" form={formId} disabled={busy || conflict}>{busy ? 'Đang lưu…' : 'Xác nhận'}</Button></>}>
    {children}<form id={formId} onSubmit={e => void handle(e)} noValidate className="grid gap-4">{fields.map(f => <label key={f.name} className="grid gap-1 text-sm font-medium">{f.label}<span className="sr-only"> (bắt buộc)</span>
      {f.type === 'textarea' ? <textarea rows={4} maxLength={f.max ?? 2000} className={fieldClass} disabled={busy || conflict} {...form.register(f.name)} aria-invalid={Boolean(form.formState.errors[f.name])} /> : f.type === 'select' ? <select className={fieldClass} disabled={busy || conflict} {...form.register(f.name)} aria-invalid={Boolean(form.formState.errors[f.name])}><option value="">Chọn…</option>{f.options?.map(o => <option key={o.value} value={o.value} disabled={o.disabled}>{o.label}</option>)}</select> : <input type={f.type ?? 'text'} className={fieldClass} disabled={busy || conflict} {...form.register(f.name)} aria-invalid={Boolean(form.formState.errors[f.name])} />}
      {form.formState.errors[f.name] && <span role="alert" className="text-red-700">{form.formState.errors[f.name]?.message}</span>}</label>)}{error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-800">{error}</p>}</form>
  </Modal>;
}
// Controls explicitly use Vietnam time even when the browser's timezone differs.
export const vietnamIso = (value: string) => new Date(`${value}+07:00`).toISOString();
export function validatePeriod(v: Record<string, string>, shift = false) {
  const start = Date.parse(`${v.startsAt}+07:00`), end = Date.parse(`${v.endsAt}+07:00`);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return 'Thời gian kết thúc phải sau thời gian bắt đầu.';
  if (end - start > (shift ? 1 : 93) * 86400000) return shift ? 'Ca làm tối đa 24 giờ.' : 'Khoảng nghỉ tối đa 93 ngày.';
  if (shift ? start < Date.now() : end <= Date.now()) return shift ? 'Ca làm phải bắt đầu trong tương lai.' : 'Khoảng nghỉ chưa được kết thúc.';
}
