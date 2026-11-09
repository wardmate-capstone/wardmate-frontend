import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { analyticsApi, analyticsError, applyAnalyticsFieldErrors, dateRangeSchema, initialAnalyticsQuery, jobIdSchema, vietnamToday } from '@/lib/api/analytics';
import { useAuthStore } from '@/stores/authStore';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { AnalyticsStatus } from '@/components/analytics/AnalyticsFilters';

const stateNames: Record<string, string> = { Enqueued: 'Đã xếp hàng', Processing: 'Đang xử lý', Scheduled: 'Đã lên lịch', Succeeded: 'Hoàn tất', Failed: 'Thất bại', Deleted: 'Đã xóa', Awaiting: 'Đang chờ' };
const waitingStates = ['Enqueued', 'Processing', 'Scheduled', 'Awaiting'];
const displayDate = (date: string) => date.split('-').reverse().join('/');
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
    refetchInterval: query => !query.state.error && waitingStates.includes(query.state.data?.state ?? '') ? 3000 : false,
  });
  if (!user?.roles.includes('IT_ADMIN')) return <p role="alert">Bạn không có quyền quản lý tác vụ thống kê.</p>;
  async function rebuild() {
    if (!confirm || lock.current) return;
    lock.current = true;
    try {
      const result = await mutation.mutateAsync(confirm);
      if (useAuthStore.getState().user?.id !== user?.id) return;
      setJobId(result.jobId); setLookup(result.jobId); setLookupError(''); setConfirm(null);
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
  return <section className="admin-card max-w-4xl space-y-5 p-5 sm:p-6" aria-labelledby="analytics-update-title">
      <div className="space-y-2"><h2 id="analytics-update-title" className="text-lg font-bold">Cập nhật báo cáo theo khoảng ngày</h2><p className="text-sm leading-relaxed text-slate-600">Dùng khi báo cáo thiếu hoặc chưa có số liệu mới nhất từ hồ sơ tiền kiểm.</p></div>
      <form onSubmit={handleSubmit(setConfirm)} className="space-y-3">
        <div className="grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
          <Input label="Từ ngày" type="date" min="2000-01-01" max={vietnamToday()} {...register('from')} error={errors.from?.message} />
          <Input label="Đến ngày" type="date" min="2000-01-01" max={vietnamToday()} {...register('to')} error={errors.to?.message} />
          <Button type="submit" disabled={mutation.isPending} className="sm:col-span-2 lg:col-span-1 lg:mt-7">Cập nhật thống kê</Button>
        </div>
        <p className="text-xs text-slate-500">Tối đa 366 ngày, không chọn ngày tương lai · Giờ Việt Nam</p>
      </form>
      {mutation.error && <p role="alert" className="text-sm text-red-800">{analyticsError(mutation.error)} Nếu kết nối bị gián đoạn sau khi gửi, yêu cầu có thể đã được tạo. Liên hệ bộ phận vận hành để kiểm tra trước khi gửi lại nếu chưa nhận được mã tác vụ.</p>}
      {jobId && <>
        <AnalyticsStatus pending={status.isPending} error={status.error} retry={() => void status.refetch()} />
        {!status.isError && status.data && <div role="status" className="space-y-3 border-t border-slate-200 pt-5">
          <Badge variant={status.data.state === 'Succeeded' ? 'success' : status.data.state === 'Failed' ? 'danger' : 'info'}>Trạng thái: {stateNames[status.data.state] ?? `Chưa xác định (${status.data.state})`}</Badge>
          {status.data.state === 'Succeeded' && <p className="text-sm text-slate-700">Đã tổng hợp xong số liệu. Tải lại báo cáo để xem số liệu mới.</p>}
          {waitingStates.includes(status.data.state) && <p className="text-sm text-slate-700">Hệ thống đang xử lý. Kết quả sẽ tự cập nhật tại đây.</p>}
          {status.data.state === 'Failed' && <p className="text-sm text-red-800">Chưa cập nhật thành công. Gửi mã tác vụ cho bộ phận vận hành để kiểm tra trước khi tạo yêu cầu mới.</p>}
          {status.data.state === 'Deleted' && <p className="text-sm text-slate-700">Tác vụ đã bị xóa. Trạng thái này không xác nhận số liệu đã cập nhật xong.</p>}
          {!stateNames[status.data.state] && <p className="text-sm text-slate-700">Chưa xác định được kết quả. Bấm Kiểm tra trạng thái hoặc liên hệ bộ phận vận hành.</p>}
          <details><summary className="cursor-pointer rounded text-sm text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500">Chi tiết lần cập nhật</summary><div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0 space-y-1 text-sm text-slate-600"><p className="break-all">Mã tác vụ: <strong className="text-slate-800">{status.data.jobId}</strong></p><p>Tạo lúc: {new Date(status.data.createdAtUtc).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })} (giờ Việt Nam)</p></div>
            <Button variant="outline" size="small" loading={status.isFetching} onClick={() => void status.refetch()}>Kiểm tra trạng thái</Button>
          </div></details>
        </div>}
      </>}
      <details className="border-t border-slate-200 pt-4"><summary className="cursor-pointer rounded text-sm text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500">Tra cứu lần cập nhật cũ</summary>
        <p className="mb-4 mt-3 text-sm text-slate-600">Nhập mã tác vụ đã nhận để xem lại kết quả.</p>
        <form className="grid items-start gap-3 sm:max-w-lg sm:grid-cols-[minmax(0,1fr)_auto]" onSubmit={event => { event.preventDefault(); const parsed = jobIdSchema.safeParse(lookup.trim()); if (!parsed.success) { setLookupError(parsed.error.issues[0].message); return; } setLookupError(''); if (parsed.data === jobId) void status.refetch(); else setJobId(parsed.data); }}>
          <Input label="Mã tác vụ" inputMode="numeric" placeholder="Nhập mã đã nhận, ví dụ: 19" value={lookup} onChange={event => setLookup(event.target.value)} error={lookupError} />
          <Button type="submit" variant="outline" className="sm:mt-7">Tra cứu</Button>
        </form>
      </details>
    <Modal open={!!confirm} onOpenChange={open => { if (!open && !mutation.isPending) setConfirm(null); }} title="Xác nhận cập nhật thống kê" description={confirm ? `Từ ${displayDate(confirm.from)} đến ${displayDate(confirm.to)} (giờ Việt Nam).` : undefined}>
      <p className="text-sm leading-relaxed text-slate-600">Tổng hợp lại số liệu trong khoảng ngày đã chọn? Kết quả sẽ tự hiển thị trên trang này.</p>
      <div className="mt-5 flex flex-wrap justify-end gap-3"><Button variant="outline" disabled={mutation.isPending} onClick={() => setConfirm(null)}>Quay lại</Button><Button loading={mutation.isPending} onClick={() => void rebuild()}>Bắt đầu cập nhật</Button></div>
    </Modal>
  </section>;
}
