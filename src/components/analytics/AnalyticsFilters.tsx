import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { analyticsQuerySchema, initialAnalyticsQuery, vietnamToday, coverageSchema, analyticsError, type AnalyticsQuery } from '@/lib/api/analytics';
import type { z } from 'zod';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { procedureApi } from '@/lib/api/procedures';

export function AnalyticsFilters({ value, onChange }: { value: AnalyticsQuery; onChange: (value: AnalyticsQuery) => void }) {
  const [search, setSearch] = useState('');
  const procedures = useQuery({ queryKey: ['analytics-procedure-options', search], queryFn: ({ signal }) => procedureApi.list({ keyword: search.trim() || undefined, pageNumber: 1, pageSize: 50 }, false, signal) });
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<AnalyticsQuery>({ resolver: zodResolver(analyticsQuerySchema), defaultValues: value });
  const selectedId = watch('procedureId');
  return <form onSubmit={handleSubmit(data => onChange({ ...data, page: 1 }))} className="admin-card grid items-start gap-4 p-4 sm:grid-cols-2 xl:grid-cols-4">
    <Input label="Từ ngày" type="date" min="2000-01-01" max={vietnamToday()} {...register('from')} error={errors.from?.message} />
    <Input label="Đến ngày" type="date" min="2000-01-01" max={vietnamToday()} {...register('to')} error={errors.to?.message} />
    <div className="space-y-2"><Input label="Tìm thủ tục" value={search} onChange={event => setSearch(event.target.value)} /><label className="block text-sm font-semibold">Thủ tục<select className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white p-3" {...register('procedureId', { setValueAs: value => value || undefined })}><option value="">Tất cả thủ tục</option>{selectedId && !procedures.data?.items.some(item => item.id === selectedId) && <option value={selectedId}>Thủ tục đang chọn</option>}{procedures.data?.items.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>{procedures.isError && <button type="button" className="text-sm text-red-800 underline" onClick={() => void procedures.refetch()}>Chưa tải được thủ tục. Thử lại</button>}{errors.procedureId && <p role="alert">Chọn thủ tục hợp lệ.</p>}</div>
    <div className="flex flex-wrap items-center gap-2"><Button type="submit">Áp dụng</Button>{['Tháng này', 'Quý này', 'Năm nay'].map((label, index) => <Button key={label} variant="outline" type="button" onClick={() => { const next = initialAnalyticsQuery(); const month = Number(next.to.slice(5, 7)); next.from = index === 2 ? next.to.slice(0, 4) + '-01-01' : index === 1 ? `${next.to.slice(0, 4)}-${String(Math.floor((month - 1) / 3) * 3 + 1).padStart(2, '0')}-01` : next.from; reset(next); onChange(next); }}>{label}</Button>)}</div>
  </form>;
}
export function AnalyticsStatus({ pending, error, retry }: { pending: boolean; error: unknown; retry: () => void }) {
  if (error) return <div role="alert" className="admin-card space-y-3 p-5"><p>{analyticsError(error)}</p><Button variant="outline" onClick={retry}>Thử lại</Button></div>;
  return pending ? <p role="status" className="p-5">Đang tải dữ liệu…</p> : null;
}
export function CoverageNotice({ data }: { data?: z.infer<typeof coverageSchema> | null }) {
  if (!data) return null;
  return <div className="text-sm text-slate-600" role="status">{data.missingDates.length > 0 && <p className="rounded-xl bg-amber-50 p-3 text-amber-900">Chưa đủ dữ liệu tổng hợp: thiếu {data.missingDates.length} ngày trong kỳ.</p>}<p className="mt-2">Cập nhật: {data.latestRefreshAtUtc ? new Date(data.latestRefreshAtUtc).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }) : 'Chưa có lần tổng hợp'} · Giờ Việt Nam</p></div>;
}
export function AnalyticsPagination({ page, total, size, onChange }: { page: number; total: number; size: number; onChange: (page: number) => void }) {
  return <nav aria-label="Phân trang thống kê" className="flex flex-wrap items-center gap-3 py-3"><Button variant="outline" disabled={page <= 1} onClick={() => onChange(page - 1)}>Trang trước</Button><span>Trang {page} · {total} kết quả</span><Button variant="outline" disabled={page >= 100000 || page * size >= total} onClick={() => onChange(page + 1)}>Trang sau</Button></nav>;
}
