import { useId, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Input, toast } from '@/components/ui';
import { auditFilterSchema, auditSources, emptyAuditFilters, systemError, type AuditFilters } from '@/lib/api/systemAdministration';

export function auditTime(value: string | null) {
  return value ? new Date(value).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour12: false }) : 'Chưa có thông tin';
}
export function SystemRequestStatus({ pending, error, retry, fetching = false }: { pending: boolean; error: unknown; retry: () => void; fetching?: boolean }) {
  if (pending) return <p role="status" className="p-5 text-sm text-slate-600">Đang tải dữ liệu…</p>;
  if (error) return <div role="alert" className="space-y-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900"><p>{systemError(error)}</p><Button variant="outline" onClick={retry}>Thử lại</Button></div>;
  return fetching ? <p role="status" className="text-sm text-slate-600">Đang làm mới dữ liệu…</p> : null;
}
export function AuditFilterForm({ business = false, onApply }: { business?: boolean; onApply: (filters: AuditFilters) => void }) {
  const sourceId = useId();
  const form = useForm<AuditFilters>({ resolver: zodResolver(auditFilterSchema), defaultValues: emptyAuditFilters });
  const { errors } = form.formState;
  return <form noValidate onSubmit={form.handleSubmit(onApply)} className="space-y-4 border-b border-slate-200 pb-5">
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {business && <><div className="grid content-start gap-2"><label htmlFor={sourceId} className="text-sm font-semibold">Nguồn phát sinh</label><select id={sourceId} {...form.register('source')} className="min-h-12 rounded-xl border border-slate-300 bg-white px-3 text-base"><option value="">Tất cả nguồn</option>{Object.entries(auditSources).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></div>
        <Input label="Loại dữ liệu" hint="Nhập đúng tên loại dữ liệu cần tra cứu" {...form.register('entity')} error={errors.entity?.message} /></>}
      <Input label="Từ ngày" type="date" {...form.register('from')} error={errors.from?.message} />
      <Input label="Đến ngày" type="date" {...form.register('to')} error={errors.to?.message} />
    </div>
    {business && <details className="rounded-xl border border-slate-200 p-3" open={!!errors.actorId || !!errors.traceId}><summary className="cursor-pointer text-sm font-semibold">Lọc theo người thực hiện và mã tra cứu</summary><div className="mt-4 grid gap-4 sm:grid-cols-2"><Input label="Mã tài khoản người thực hiện" hint="Sao chép mã tài khoản từ trang Người dùng hệ thống." {...form.register('actorId')} error={errors.actorId?.message} /><Input label="Mã tra cứu" hint="Mã yêu cầu cần đối chiếu; khớp chính xác." {...form.register('traceId')} error={errors.traceId?.message} /></div></details>}
    <div className="flex flex-wrap gap-3"><Button type="submit">Áp dụng</Button><Button variant="outline" onClick={() => { form.reset(emptyAuditFilters); onApply({ ...emptyAuditFilters }); }}>Xóa bộ lọc</Button></div>
    <p className="text-sm text-slate-600">Khoảng ngày tính theo giờ Việt Nam. Bỏ trống để tra cứu mọi thời điểm.</p>
  </form>;
}
export function AuditPagination({ page, pageSize, total, busy, onPage, onSize }: { page: number; pageSize: number; total: number; busy: boolean; onPage: (page: number) => void; onSize: (size: number) => void }) {
  const id = useId();
  const pages = Math.max(1, Math.ceil(total / pageSize));
  return <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-4 text-sm">
    <p role="status">Trang {page} / {pages} · Tổng {total.toLocaleString('vi-VN')} bản ghi</p>
    <div className="flex flex-wrap items-center gap-3"><label htmlFor={id}>Số dòng</label><select id={id} value={pageSize} disabled={busy} onChange={event => onSize(Number(event.target.value))} className="min-h-10 rounded-lg border px-3">{[20, 50, 100].map(size => <option key={size}>{size}</option>)}</select>
      <Button variant="outline" size="small" disabled={busy || page <= 1} onClick={() => onPage(page - 1)}>Trang trước</Button><Button variant="outline" size="small" disabled={busy || page >= pages || page >= 100000} onClick={() => onPage(page + 1)}>Trang sau</Button></div>
  </div>;
}
export function AuditMetadata({ children }: { children: ReactNode }) {
  return <dl className="grid gap-3 break-words text-sm [&_dt]:font-semibold [&_dt]:text-slate-600 [&_dd]:mt-1 [&_dd]:break-all">{children}</dl>;
}
export function JsonAuditBlock({ title, value }: { title: string; value: unknown }) {
  return <section className="min-w-0 space-y-2"><h3 className="font-semibold">{title}</h3><pre className="max-h-80 overflow-auto rounded-xl bg-slate-950 p-4 text-sm text-slate-100">{JSON.stringify(value, null, 2)}</pre></section>;
}
export async function copyAudit(value: unknown) {
  try { await navigator.clipboard.writeText(JSON.stringify(value, null, 2)); toast.success('Đã sao chép dữ liệu.'); }
  catch { toast.error('Chưa thể sao chép. Bạn có thể chọn và sao chép văn bản trong phần dữ liệu.'); }
}
