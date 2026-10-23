import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { analyticsApi, analyticsError, applyAnalyticsFieldErrors, dateRangeSchema, initialAnalyticsQuery, jobIdSchema, vietnamToday } from '@/lib/api/analytics';
import { useAuthStore } from '@/stores/authStore';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { AnalyticsStatus } from '@/components/analytics/AnalyticsFilters';

const stateNames: Record<string, string> = { Enqueued: 'Đã xếp hàng', Processing: 'Đang xử lý', Scheduled: 'Đã lên lịch', Succeeded: 'Hoàn tất', Failed: 'Thất bại', Deleted: 'Đã xóa', Awaiting: 'Đang chờ' };
export function AnalyticsJobsView() {
  const user = useAuthStore(state => state.user);
  const [confirm, setConfirm] = useState<{ from: string; to: string } | null>(null);
  const [jobId, setJobId] = useState('');
  const [lookup, setLookup] = useState('');
  const [lookupError, setLookupError] = useState('');
  const [pendingFocus, setPendingFocus] = useState<'from' | 'to' | null>(null);
  const lock = useRef(false);
  const { register, handleSubmit, setError, setFocus, formState: { errors } } = useForm<{ from: string; to: string }>({ resolver: zodResolver(dateRangeSchema), defaultValues: initialAnalyticsQuery() });
  const mutation = useMutation({ mutationFn: analyticsApi.rebuild, retry: false });
  useEffect(() => {
    if (!pendingFocus || confirm || mutation.isPending) return;
    // Radix first restores the trigger's focus when the confirmation closes.
    const timer = window.setTimeout(() => { setFocus(pendingFocus); setPendingFocus(null); }, 0);
    return () => window.clearTimeout(timer);
  }, [confirm, mutation.isPending, pendingFocus, setFocus]);
  const status = useQuery({ queryKey: ['analytics-job', user?.id, jobId], queryFn: ({ signal }) => analyticsApi.job(jobId, signal), enabled: !!jobId && !!user?.roles.includes('IT_ADMIN'), retry: false, staleTime: 0,
    refetchInterval: query => !query.state.error && ['Enqueued', 'Processing', 'Scheduled', 'Awaiting'].includes(query.state.data?.state ?? '') ? 3000 : false,
  });
  if (!user?.roles.includes('IT_ADMIN')) return <p role="alert">Bạn không có quyền quản lý job thống kê.</p>;
  async function rebuild() {
    if (!confirm || lock.current) return;
    lock.current = true;
    try {
      const result = await mutation.mutateAsync(confirm);
      if (useAuthStore.getState().user?.id !== user?.id) return;
      setJobId(result.jobId); setLookup(result.jobId); setConfirm(null);
    } catch (error) {
      let firstField: 'from' | 'to' | null = null;
      applyAnalyticsFieldErrors(error, (field, message) => {
        if (field !== 'from' && field !== 'to') return;
        setError(field, { message });
        firstField ??= field;
      });
      setPendingFocus(firstField);
      setConfirm(null);
    } finally { lock.current = false; }
  }
  return <div className="space-y-5"><section className="admin-card space-y-4 p-5"><h2 className="font-bold">Tính lại thống kê tiền kiểm</h2><p className="text-sm text-slate-600">Chọn tối đa 366 ngày. Thao tác được xử lý nền; xếp lịch thành công chưa có nghĩa dữ liệu đã tính xong.</p>
    <form onSubmit={handleSubmit(setConfirm)} className="grid gap-4 sm:grid-cols-2"><Input label="Từ ngày" type="date" min="2000-01-01" max={vietnamToday()} {...register('from')} error={errors.from?.message} /><Input label="Đến ngày" type="date" min="2000-01-01" max={vietnamToday()} {...register('to')} error={errors.to?.message} /><Button type="submit" disabled={mutation.isPending}>Tính lại thống kê</Button></form>
    {mutation.error && <p role="alert" className="text-red-800">{analyticsError(mutation.error)} Nếu kết nối bị gián đoạn sau khi gửi, job có thể đã được tạo. Hãy kiểm tra mã job trước khi gửi lại.</p>}
  </section><section className="admin-card space-y-4 p-5"><h2 className="font-bold">Theo dõi job</h2><form className="flex flex-wrap items-start gap-3" onSubmit={event => { event.preventDefault(); const parsed = jobIdSchema.safeParse(lookup.trim()); if (!parsed.success) { setLookupError(parsed.error.issues[0].message); return; } setLookupError(''); if (parsed.data === jobId) void status.refetch(); else setJobId(parsed.data); }}><Input label="Mã job" value={lookup} onChange={event => setLookup(event.target.value)} error={lookupError} /><Button type="submit" className="mt-7">Tra cứu</Button></form>
    {jobId && <><AnalyticsStatus pending={status.isPending} error={status.error} retry={() => void status.refetch()} />{!status.isError && status.data && <div role="status"><p>Mã job: {status.data.jobId}</p><p className="font-bold">Trạng thái: {stateNames[status.data.state] ?? `Chưa xác định (${status.data.state})`}</p><p>Tạo lúc: {new Date(status.data.createdAtUtc).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}</p>{status.data.state === 'Failed' && <p>Job thất bại. Kiểm tra dịch vụ nguồn và cấu hình trước khi tạo job mới.</p>}</div>}</>}
  </section><Modal open={!!confirm} onOpenChange={open => { if (!open && !mutation.isPending) setConfirm(null); }} title="Xác nhận tính lại thống kê" description={confirm ? `Từ ${confirm.from} đến ${confirm.to}.` : undefined}><p>Dữ liệu thống kê trong khoảng đã chọn sẽ được tổng hợp lại.</p><div className="mt-5 flex flex-wrap justify-end gap-3"><Button variant="outline" disabled={mutation.isPending} onClick={() => setConfirm(null)}>Quay lại</Button><Button loading={mutation.isPending} onClick={() => void rebuild()}>Xác nhận xếp lịch</Button></div></Modal></div>;
}
