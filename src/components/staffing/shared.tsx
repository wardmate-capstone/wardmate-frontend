import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import axios from 'axios';
import { Badge, Button, ListSelect, Modal, toast, type ListSelectOption } from '@/components/ui';
import { CalendarBlank, Clock, Tray, ArrowsClockwise } from '@phosphor-icons/react';
import './staffing.css';
import { useAuthStore } from '@/stores/authStore';
import { staffingError } from '@/lib/api/staffingError';
import { getManagerOfficers } from '@/lib/api';
import { staffingFormSchema } from '@/lib/staffingValidation';
export { validatePeriod, vietnamIso } from '@/lib/staffingValidation';

export const fieldClass = 'w-full min-w-0 min-h-11 rounded-lg border border-slate-300 bg-white p-2.5 text-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700';
export const dateText = (value: string) => new Date(value).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
export const statusText = (value: string) => ({ PENDING: 'Chờ duyệt', APPROVED: 'Đã duyệt', REJECTED: 'Từ chối', CANCELLED: 'Đã hủy', OPEN: 'Chờ trả lời', ANSWERED: 'Đã trả lời', CLOSED: 'Đã đóng', SUBMITTED: 'Chờ tiền kiểm', UNDER_REVIEW: 'Đang kiểm tra', NEED_REVISION: 'Cần bổ sung', DOCUMENTS_READY: 'Giấy tờ sẵn sàng' }[value] || value);
export function StaffStatus({ value, label }: { value: string; label?: string }) {
  const variant = ['APPROVED', 'ANSWERED', 'ACTIVE'].includes(value) ? 'success' : ['PENDING', 'OPEN'].includes(value) ? 'warning' : value === 'REJECTED' ? 'danger' : 'neutral';
  return <Badge variant={variant}>{label || statusText(value)}</Badge>;
}
export function StaffHeading({ title, description, children }: { title: string; description: string; children?: ReactNode }) {
  return <div className="staff-heading"><div><h2>{title}</h2><p>{description}</p></div>{children && <div className="staff-actions">{children}</div>}</div>;
}
export function StaffPeriod({ start, end }: { start: string; end: string }) {
  const format = (value: string, time: boolean) => !Number.isFinite(Date.parse(value)) ? 'Không có thông tin' : new Intl.DateTimeFormat('vi-VN', time
    ? { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit' }
    : { timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(value));
  return <div className="staff-period">{[[start, 'Bắt đầu'], [end, 'Kết thúc']].map(([value, label]) => <div key={label}><span className="staff-meta">{label}</span><time dateTime={value}><span><Clock size={18} aria-hidden="true" />{format(value, true)}</span><span><CalendarBlank size={16} aria-hidden="true" />{format(value, false)}</span></time></div>)}</div>;
}
export function useStaffAccess() {
  const user = useAuthStore(s => s.user);
  const manager = user?.roles.includes('MANAGER') === true;
  const officer = user?.roles.includes('FRONT_DESK_OFFICER') === true && !manager;
  return { user, manager, officer, can: (permission: string) => user?.permissions.includes(permission) === true };
}
export function useStaffQuery<T>(key: readonly unknown[], fn: (signal: AbortSignal) => Promise<T>, enabled = true) {
  const { user } = useStaffAccess();
  return useQuery({ queryKey: ['staffing', user?.id, user?.wardId, user?.roles.slice().sort().join('|'), user?.permissions.slice().sort().join('|'), ...key], queryFn: ({ signal }) => fn(signal), enabled: Boolean(user) && enabled, retry: false, refetchOnMount: 'always' });
}
export function useStaffOperation() {
  const client = useQueryClient();
  const lock = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [review, setReview] = useState(false);
  const refresh = () => Promise.all(['staffing', 'workflow', 'document-form'].map(key => client.invalidateQueries({ queryKey: [key] })));
  const run = async <T,>(fn: () => Promise<T>, success?: (value: T) => void, replay = false, readOnly = false) => {
    if (lock.current || (review && !replay)) return;
    lock.current = true; setBusy(true); setError('');
    try {
      const result = await fn();
      if (!readOnly) await refresh(); setReview(false); success?.(result);
      if (!readOnly) toast.success('Đã lưu thay đổi.');
      return result;
    } catch (e) {
      const status = axios.isAxiosError(e) ? e.response?.status : undefined;
      const needsReview = status === undefined || [403, 404, 409, 422].includes(status) || status >= 500;
      setReview(needsReview); setError(staffingError(e));
      if (needsReview) await refresh();
    } finally { lock.current = false; setBusy(false); }
  };
  return { busy, error, review, run, refresh, reset: () => { setReview(false); setError(''); } };
}
export function OperationError({ operation }: { operation: { error: string; review: boolean } }) {
  return operation.error ? <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"><p>{operation.error}</p>{operation.review && <p className="mt-2">Đọc lại dữ liệu trước khi thao tác tiếp. Nội dung đang soạn được giữ lại.</p>}</div> : null;
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
  if (query.isPending) return <div role="status" className="staff-state"><ArrowsClockwise size={24} className="motion-safe:animate-spin" aria-hidden="true" /><p>Đang tải dữ liệu…</p></div>;
  if (query.isError) return <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800"><p>{staffingError(query.error)}</p><Button variant="outline" onClick={() => void query.refetch()}>Thử lại</Button></div>;
  return empty ? <div className="staff-state"><Tray size={32} aria-hidden="true" /><p className="font-semibold text-slate-700">Chưa có dữ liệu trong phạm vi đang xem.</p><p className="text-sm">Bạn có thể đổi bộ lọc hoặc làm mới để kiểm tra lại.</p></div> : null;
}
export function Pager({ page, total, setPage, pageSize = 20 }: { page: number; total: number; setPage: (page: number) => void; pageSize?: number }) {
  return <div className="staff-pager"><Button variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>Trước</Button><span>Trang {page} · {total} mục</span><Button variant="outline" disabled={page * pageSize >= total} onClick={() => setPage(page + 1)}>Sau</Button></div>;
}
// Danh sách trên 7 lựa chọn mới hiện ô tìm kiếm; ngắn hơn thì cuộn/nhìn là thấy
const SEARCH_THRESHOLD = 7;
// 'listbox': ô chọn tùy biến (ListSelect) cho lựa chọn cần nhiều dòng thông tin, danh sách nằm trong hộp thoại
type Field = { name: string; label: string; type?: 'text' | 'textarea' | 'datetime-local' | 'select' | 'listbox'; options?: ListSelectOption[]; max?: number; placeholder?: string };
export function ActionForm({ title, description, fields, validate, submit, onClose, children, defaultValues, inline = false, onDirtyChange }: {
  title: string; description?: string; fields: Field[]; validate?: (values: Record<string, string>) => string | undefined;
  submit: (values: Record<string, string>) => Promise<unknown>; onClose: () => void; children?: ReactNode; defaultValues?: Record<string, string>;
  inline?: boolean; onDirtyChange?: (dirty: boolean) => void;
}) {
  const formId = useId();
  const client = useQueryClient();
  const lock = useRef(false);
  const [error, setError] = useState('');
  const [conflict, setConflict] = useState(false);
  const pendingFocus = useRef<string | null>(null);
  const form = useForm<Record<string, string>>({ resolver: zodResolver(staffingFormSchema(fields)), defaultValues: defaultValues ?? Object.fromEntries(fields.map(f => [f.name, ''])) });
  const busy = form.formState.isSubmitting;
  const dirty = form.formState.isDirty;
  useEffect(() => { onDirtyChange?.(dirty || busy); }, [dirty, busy, onDirtyChange]);
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
      if (inline) form.reset(values);
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
      setError(`${staffingError(e)}${review ? ' Đóng hộp thoại và kiểm tra dữ liệu mới nhất trước khi thao tác lại.' : ''}`);
    } finally { lock.current = false; }
  });
  const content = <>{children}<form id={formId} onSubmit={e => void handle(e)} noValidate className={`grid gap-4 ${inline ? 'sm:grid-cols-2' : ''}`}>{fields.map(f => f.type === 'listbox' ? <div key={f.name} className={`grid gap-1 text-sm font-medium ${inline ? 'sm:col-span-2' : ''}`}>
      {/* Không bọc trong <label>: label chuyển cú bấm về nút làm danh sách mở lại khi chọn */}
      <label htmlFor={`${formId}-${f.name}`}>{f.label}<span className="sr-only"> (bắt buộc)</span></label>
      <Controller control={form.control} name={f.name} render={({ field }) => <ListSelect id={`${formId}-${f.name}`} value={field.value ?? ''} onChange={field.onChange} onBlur={field.onBlur} options={f.options ?? []} searchable={(f.options?.length ?? 0) > SEARCH_THRESHOLD} searchPlaceholder="Tìm theo tên…" placeholder={f.placeholder ?? 'Chọn…'} disabled={busy || conflict} invalid={Boolean(form.formState.errors[f.name])} describedBy={form.formState.errors[f.name] ? `${formId}-${f.name}-error` : undefined} />} />
      {form.formState.errors[f.name] && <span id={`${formId}-${f.name}-error`} role="alert" className="text-red-700">{form.formState.errors[f.name]?.message}</span>}
    </div> : <label key={f.name} className={`grid gap-1 text-sm font-medium ${inline && f.type === 'textarea' ? 'sm:col-span-2' : ''}`}>{f.label}<span className="sr-only"> (bắt buộc)</span>
      {f.type === 'textarea' ? <textarea rows={4} maxLength={f.max ?? 2000} className={fieldClass} disabled={busy || conflict} {...form.register(f.name)} aria-invalid={Boolean(form.formState.errors[f.name])} aria-describedby={form.formState.errors[f.name] ? `${formId}-${f.name}-error` : undefined} /> : f.type === 'select' ? <select className={fieldClass} disabled={busy || conflict} {...form.register(f.name)} aria-invalid={Boolean(form.formState.errors[f.name])} aria-describedby={form.formState.errors[f.name] ? `${formId}-${f.name}-error` : undefined}><option value="">Chọn…</option>{f.options?.map(o => <option key={o.value} value={o.value} disabled={o.disabled}>{o.label}</option>)}</select> : <input type={f.type ?? 'text'} className={fieldClass} disabled={busy || conflict} {...form.register(f.name)} aria-invalid={Boolean(form.formState.errors[f.name])} aria-describedby={form.formState.errors[f.name] ? `${formId}-${f.name}-error` : undefined} />}
      {form.formState.errors[f.name] && <span id={`${formId}-${f.name}-error`} role="alert" className="text-red-700">{form.formState.errors[f.name]?.message}</span>}</label>)}{error && <p role="alert" className={`rounded-lg bg-red-50 p-3 text-red-800 ${inline ? 'sm:col-span-2' : ''}`}>{error}</p>}</form></>;
  if (inline) return <div className="space-y-3">{content}<div className="flex flex-wrap items-center gap-3"><Button type="submit" form={formId} disabled={busy || conflict || !dirty}>{busy ? 'Đang lưu…' : 'Lưu thông tin nghỉ'}</Button><p className="text-sm text-slate-600" role="status">{dirty ? 'Có thay đổi chưa lưu. Lưu trước khi soạn Word.' : 'Thông tin đã lưu. Bạn có thể tiếp tục soạn Word.'}</p></div></div>;
  return <Modal open onOpenChange={open => !open && !busy && onClose()} title={title} description={description} footer={<><Button variant="outline" disabled={busy} onClick={onClose}>Đóng</Button><Button type="submit" form={formId} disabled={busy || conflict}>{busy ? 'Đang lưu…' : 'Xác nhận'}</Button></>}>
    {content}
  </Modal>;
}
