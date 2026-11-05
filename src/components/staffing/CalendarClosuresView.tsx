import { useEffect, useId, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axios from 'axios';
import { Badge, Button, Input, Modal, toast } from '@/components/ui';
import { calendarClosuresApi, closureInputSchema, closureReasonSchema, type CalendarClosure } from '@/lib/api/calendarClosures';
import { staffingError } from '@/lib/api/staffingError';
import { addCalendarDays, calendarDateText, canCancelClosure, validClosureRange, vietnamToday } from '@/lib/calendarRules';
import { StaffHeading, dateText, fieldClass, QueryState, useStaffAccess } from './shared';

function useVietnamToday() {
  const [today, setToday] = useState(vietnamToday);
  useEffect(() => {
    const refresh = () => setToday(vietnamToday());
    const timer = window.setInterval(refresh, 30000);
    window.addEventListener('focus', refresh);
    return () => { window.clearInterval(timer); window.removeEventListener('focus', refresh); };
  }, []);
  return today;
}

function ClosureForm({ item, national, canSubmit, onClose, onSaved }: { item?: CalendarClosure; national: boolean; canSubmit: boolean; onClose: () => void; onSaved: (date: string) => void }) {
  const today = useVietnamToday();
  const client = useQueryClient();
  const formId = useId();
  const [error, setError] = useState('');
  const [reviewRequired, setReviewRequired] = useState(false);
  const lock = useRef(false);
  const pendingFocus = useRef<'date' | 'reason' | null>(null);
  const form = useForm<{ date: string; reason: string }>({
    resolver: zodResolver(item ? z.object({ date: z.string(), reason: closureReasonSchema }) : closureInputSchema),
    defaultValues: { date: item?.date ?? today, reason: '' },
  });
  const busy = form.formState.isSubmitting;
  useEffect(() => {
    if (!busy && pendingFocus.current) { form.setFocus(pendingFocus.current); pendingFocus.current = null; }
  }, [busy, form]);
  const refresh = () => Promise.all(['staffing', 'workflow', 'analytics'].map(key => client.invalidateQueries({ queryKey: [key] })));
  const handle = form.handleSubmit(async values => {
    if (reviewRequired || lock.current) return;
    if (!canSubmit) { setError('Lịch hoặc quyền thao tác đã thay đổi. Đóng hộp thoại và kiểm tra lại dữ liệu.'); return; }
    if (item && !canCancelClosure(item.date, item.cancelled)) {
      setError('Ngày nghỉ đã bắt đầu hoặc đã hủy. Đóng hộp thoại và tải lại lịch.');
      setReviewRequired(true);
      await refresh();
      return;
    }
    setError('');
    lock.current = true;
    try {
      const result = item ? await calendarClosuresApi.cancel(item.id, values.reason) : await calendarClosuresApi.create(values, national);
      await refresh();
      toast.success(`${item ? 'Đã hủy ngày nghỉ' : 'Đã thêm ngày nghỉ'}; ${result.rescheduledApplications} hồ sơ được cập nhật hạn tiền kiểm.`);
      onSaved(result.closure.date);
      onClose();
    } catch (e) {
      const status = axios.isAxiosError(e) ? e.response?.status : undefined;
      const data = axios.isAxiosError(e) ? e.response?.data : undefined;
      if (status === 400 && data && typeof data === 'object') {
        const code = data.code ?? data.extensions?.code;
        if (code === 'staffing.invalid_date' && !item) { form.setError('date', { message: staffingError(e) }); pendingFocus.current = 'date'; }
        if (code === 'staffing.reason_required') { form.setError('reason', { message: 'Nhập lý do từ 1 đến 500 ký tự sau khi bỏ khoảng trắng.' }); pendingFocus.current = 'reason'; }
        if (data.errors && typeof data.errors === 'object') {
          for (const [key, messages] of Object.entries(data.errors)) {
            const name = key.replace(/^\$\./, '').toLowerCase();
            if ((name === 'date' || name === 'reason') && Array.isArray(messages) && typeof messages[0] === 'string') {
              form.setError(name, { message: messages[0] });
              pendingFocus.current ??= name;
            }
          }
        }
      }
      // A timeout, bad success payload or 5xx may occur after the server commits.
      const uncertain = status === undefined || status >= 500;
      if (status === 409 || status === 404 || status === 403 || uncertain) {
        setReviewRequired(true);
        await refresh();
      }
      setError(`${staffingError(e)}${status === 409 || status === 404 || status === 403 || uncertain ? ' Đóng hộp thoại và kiểm tra lại lịch trước khi thao tác tiếp.' : ''}`);
    } finally { lock.current = false; }
  });
  return <Modal open title={item ? 'Hủy ngày nghỉ' : national ? 'Thêm ngày lễ toàn quốc' : 'Thêm ngày nghỉ phường'}
    description={item ? `Ngày ${calendarDateText(item.date)} · ${item.wardCode === null ? 'Toàn quốc' : `Phường ${item.wardCode}`}` : national ? 'Ngày lễ áp dụng toàn quốc và có thể cập nhật hạn tiền kiểm của nhiều phường.' : 'Ngày đóng cửa áp dụng cho phường bạn quản lý.'}
    onOpenChange={open => { if (!open && !busy) onClose(); }}
    footer={<><Button variant="outline" disabled={busy} onClick={onClose}>Đóng</Button><Button type="submit" form={formId} loading={busy} disabled={reviewRequired || !canSubmit}>{item ? 'Xác nhận hủy' : 'Thêm ngày nghỉ'}</Button></>}>
    {item && <p className="mb-4 whitespace-pre-wrap break-words rounded-lg bg-slate-50 p-3 text-sm">Lý do đã khai báo: {item.reason}</p>}
    <form id={formId} onSubmit={e => void handle(e)} noValidate className="space-y-4">
      <fieldset disabled={busy || reviewRequired} className="grid min-w-0 gap-4">
        {!item && <Input label="Ngày nghỉ (giờ Việt Nam)" type="date" required min={today} max={addCalendarDays(today, 366)} {...form.register('date')} error={form.formState.errors.date?.message} />}
        <div className="grid gap-2"><label htmlFor={`${formId}-reason`} className="text-sm font-semibold">{item ? 'Lý do hủy' : 'Lý do nghỉ'} <span aria-hidden="true">*</span></label>
          <textarea id={`${formId}-reason`} rows={4} required className={fieldClass} {...form.register('reason')}
            aria-invalid={Boolean(form.formState.errors.reason)} aria-describedby={`${formId}-reason-hint${form.formState.errors.reason ? ` ${formId}-reason-error` : ''}`} />
          <p id={`${formId}-reason-hint`} className="text-sm text-slate-500">Từ 1 đến 500 ký tự sau khi bỏ khoảng trắng ở hai đầu.</p>
          {form.formState.errors.reason && <p id={`${formId}-reason-error`} role="alert" className="text-sm text-red-800">{form.formState.errors.reason.message}</p>}
        </div>
      </fieldset>
      <p className="text-sm text-slate-600">Hệ thống tính lại hạn tiền kiểm theo lịch làm việc. {item ? 'Hủy lịch không bảo đảm khôi phục đúng hạn ban đầu nếu thời gian hoặc trạng thái hồ sơ đã thay đổi.' : 'Nếu chọn hôm nay, lịch chỉ có hiệu lực từ thời điểm khai báo.'}</p>
      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      {!canSubmit && !busy && <p role="status" className="text-sm text-amber-900">Đang chờ lịch hợp lệ và quyền thao tác mới nhất. Nếu ngày nghỉ đã hủy hoặc đã bắt đầu, hãy đóng hộp thoại và xem lại lịch.</p>}
    </form>
  </Modal>;
}

export function CalendarClosuresView() {
  const { user, manager, officer, can } = useStaffAccess();
  const today = useVietnamToday();
  // The backend prioritizes national scope for a user with calendar.manage, including multi-role accounts.
  const national = Boolean(user?.roles.includes('IT_ADMIN') && can('workflow.calendar.manage'));
  const allowed = national || ((manager || officer) && can('workflow.staffing.read'));
  const manageWard = manager && can('workflow.staffing.manage');
  const context = JSON.stringify([user?.id, user?.wardId, national, allowed, manageWard]);
  const [from, setFrom] = useState(() => today.slice(0, 7) + '-01');
  const [to, setTo] = useState(() => addCalendarDays(today, 90));
  const [scope, setScope] = useState('all');
  const [status, setStatus] = useState('all');
  const [action, setAction] = useState<{ item?: CalendarClosure; context: string }>();
  const valid = validClosureRange(from, to);
  const query = useQuery({
    queryKey: ['staffing', user?.id, 'closures', national ? 'national' : user?.wardId, from, to],
    queryFn: ({ signal }) => calendarClosuresApi.list(from, to, signal),
    enabled: Boolean(user) && allowed && valid, retry: false,
    refetchOnWindowFocus: 'always', refetchOnReconnect: 'always',
  });
  if (!allowed) return <p role="alert">Bạn không có quyền xem lịch ngày nghỉ.</p>;
  // GET already scopes ward rows to the actor's ward; /users/me exposes wardId, not wardCode.
  const canCancel = (item: CalendarClosure) => canCancelClosure(item.date, item.cancelled, today) &&
    (item.wardCode === null ? national : manageWard && !national);
  const currentItem = action?.item && query.data?.find(item => item.id === action.item?.id);
  const rows = query.data?.filter(item => (scope === 'all' || (scope === 'national' ? item.wardCode === null : item.wardCode !== null)) &&
    (status === 'all' || (status === 'cancelled' ? item.cancelled : !item.cancelled))) ?? [];
  return <section className="staff-workspace" aria-label="Lịch ngày nghỉ">
    <StaffHeading title={national ? 'Lịch ngày lễ toàn quốc' : 'Lịch đóng cửa phường và ngày lễ'} description={`${national ? 'Phạm vi toàn quốc theo quyền quản lý lịch của tài khoản.' : 'Lịch toàn quốc và phường bạn đang công tác.'} Ngày và giờ hiển thị theo Việt Nam (UTC+07).`}>
      {(national || manageWard) && <Button onClick={() => setAction({ context })}>{national ? 'Thêm ngày lễ toàn quốc' : 'Thêm ngày nghỉ phường'}</Button>}
    </StaffHeading>
    <div className="staff-filter staff-filter-fields">
      <Input type="date" label="Từ ngày" value={from} onChange={e => setFrom(e.target.value)} containerClassName="min-w-0 flex-1 sm:flex-none" />
      <Input type="date" label="Đến ngày" value={to} onChange={e => setTo(e.target.value)} containerClassName="min-w-0 flex-1 sm:flex-none" />
      {!national && <label className="grid gap-2 text-sm font-semibold">Phạm vi<select className={fieldClass} value={scope} onChange={e => setScope(e.target.value)}><option value="all">Tất cả phạm vi</option><option value="ward">Phường của tôi</option><option value="national">Toàn quốc</option></select></label>}
      <label className="grid gap-2 text-sm font-semibold">Trạng thái<select className={fieldClass} value={status} onChange={e => setStatus(e.target.value)}><option value="all">Tất cả trạng thái</option><option value="active">Chưa hủy</option><option value="cancelled">Đã hủy</option></select></label>
      <Button variant="outline" disabled={!valid || query.isFetching} onClick={() => void query.refetch()}>{query.isFetching ? 'Đang tải…' : 'Làm mới'}</Button>
    </div>
    <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">Lịch đóng cửa dùng điều chỉnh hạn tiền kiểm nội bộ. Ca làm và phân công cán bộ được quản lý riêng. Lịch trùng toàn quốc và phường không làm lùi hạn hai lần.</p>
    {!valid ? <p role="alert" className="text-red-800">Chọn khoảng ngày hợp lệ, tối đa 400 ngày gồm cả hai đầu.</p> : <>
      <QueryState query={query} empty={!rows.length} />
      {!query.isError && !query.isPending && <div className="staff-grid">{rows.map(item => <article key={item.id} className="staff-card space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-bold"><time dateTime={item.date}>{calendarDateText(item.date)}</time></h3><div className="flex flex-wrap gap-2"><Badge variant={item.wardCode === null ? 'info' : 'neutral'}>{item.wardCode === null ? 'Toàn quốc' : `Phường ${item.wardCode}`}</Badge><Badge variant={item.cancelled ? 'neutral' : 'warning'}>{item.cancelled ? 'Đã hủy' : item.date < today ? 'Đã qua' : item.date === today ? 'Hôm nay' : 'Sắp tới'}</Badge></div></div>
        <p className="whitespace-pre-wrap break-words text-sm">{item.reason}</p>
        <details className="text-sm text-slate-600"><summary className="cursor-pointer py-1 font-medium">Chi tiết khai báo{item.cancelled ? ' và hủy' : ''}</summary><dl className="mt-2 grid gap-2 break-words">
          <div><dt>Hiệu lực từ</dt><dd>{dateText(item.effectiveFromUtc)}</dd></div><div><dt>Khai báo lúc</dt><dd>{dateText(item.createdAtUtc)}</dd></div><div><dt>Người khai báo (mã tài khoản)</dt><dd className="break-all">{item.createdBy}</dd></div>
          {item.cancelled && <><div><dt>Lý do hủy</dt><dd className="whitespace-pre-wrap">{item.cancellationReason || 'Không có thông tin'}</dd></div><div><dt>Hủy lúc</dt><dd>{item.cancelledAtUtc ? dateText(item.cancelledAtUtc) : 'Không có thông tin'}</dd></div><div><dt>Người hủy (mã tài khoản)</dt><dd className="break-all">{item.cancelledBy || 'Không có thông tin'}</dd></div></>}
        </dl></details>
        {canCancel(item) && <Button variant="outline" disabled={query.isFetching} onClick={() => setAction({ item, context })}>Hủy ngày nghỉ</Button>}
      </article>)}</div>}
    </>}
    {action?.context === context && (national || manageWard) && <ClosureForm item={currentItem || action.item} national={national}
      canSubmit={!action.item || Boolean(query.isSuccess && !query.isFetching && currentItem && canCancel(currentItem))}
      onClose={() => setAction(undefined)} onSaved={date => {
      setScope('all'); setStatus('all');
      if (!valid || date < from || date > to) { setFrom(date.slice(0, 7) + '-01'); setTo(addCalendarDays(date, 90)); }
    }} />}
  </section>;
}
