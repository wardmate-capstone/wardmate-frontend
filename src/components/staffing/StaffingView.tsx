import { useState } from 'react';
import { Button, Modal } from '@/components/ui';
import { staffingApi, type Leave, type Shift, type DispatchApplication } from '@/lib/api/staffing';
import { AssignDialog } from './DispatchView';
import { validStaffingRange } from '@/lib/staffingValidation';
import { ActionForm, StaffHeading, StaffPeriod, StaffStatus, dateText, fieldClass, QueryState, statusText, useStaffAccess, useStaffDirectory, useStaffQuery, validatePeriod, vietnamIso } from './shared';

function LeaveDetail({ item, onClose }: { item: Leave; onClose: () => void }) {
  const { manager, can } = useStaffAccess();
  const history = useStaffQuery(['leave-history', item.id], signal => staffingApi.leaveHistory(item.id, signal));
  const impact = useStaffQuery(['impact', item.id], signal => staffingApi.impact(item.id, signal), manager && can('workflow.staffing.manage'));
  const [assign, setAssign] = useState<DispatchApplication>();
  return <Modal open onOpenChange={open => !open && onClose()} title="Chi tiết nghỉ phép" description={`${dateText(item.startsAtUtc)} — ${dateText(item.endsAtUtc)}`}><div className="space-y-4"><p>{item.reason}</p><p>{statusText(item.status)}{item.decisionReason ? ` · ${item.decisionReason}` : ''}</p>
    {manager && can('workflow.staffing.manage') && <section><h3 className="font-bold">Hồ sơ cần xem xét bàn giao</h3><p className="text-sm text-slate-600">Các hồ sơ đang xử lý cán bộ đang giữ; không phải dự báo theo ngày nghỉ.</p><QueryState query={impact} empty={!impact.data?.length} />{!impact.isError && impact.data?.map(app => <div key={app.id} className="my-2 rounded-lg border p-3"><p>{app.applicationCode || app.id} · {app.procedureTitle}</p>{can('workflow.dispatch.write') && <Button variant="outline" onClick={() => setAssign(app)}>Bàn giao hồ sơ</Button>}</div>)}</section>}
    <section><h3 className="font-bold">Lịch sử quyết định</h3><QueryState query={history} empty={!history.data?.length} />{!history.isError && history.data?.map(row => <article key={row.id} className="my-2 rounded-lg border p-3 text-sm"><p>{statusText(row.fromStatus)} → {statusText(row.toStatus)}</p><p>{row.reason}</p><p className="break-all">Người quyết định: {row.actorId}</p><time>{dateText(row.createdAtUtc)}</time></article>)}</section>
    {assign && <AssignDialog application={assign} leave onClose={() => setAssign(undefined)} />}
  </div></Modal>;
}
type Action = { type: 'shift' | 'leave' } | { type: 'cancel'; shift: Shift } | { type: 'decision'; leave: Leave; decision: string };
export function StaffingView({ mode }: { mode: 'shifts' | 'leaves' }) {
  const { manager, officer, user, can } = useStaffAccess();
  const today = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date());
  const [from, setFrom] = useState(today.slice(0, 7) + '-01');
  const [to, setTo] = useState(today.slice(0, 7) + '-' + new Date(Number(today.slice(0, 4)), Number(today.slice(5, 7)), 0).getDate());
  const [action, setAction] = useState<Action>();
  const [detail, setDetail] = useState<Leave>();
  const start = Date.parse(`${from}T00:00:00+07:00`);
  const end = Date.parse(`${to}T23:59:59.999+07:00`);
  const valid = validStaffingRange(from, to);
  const enabled = can('workflow.staffing.read') && valid;
  const shifts = useStaffQuery(['shifts', from, to], signal => staffingApi.shifts(new Date(start).toISOString(), new Date(end).toISOString(), signal), enabled && mode === 'shifts');
  const leaves = useStaffQuery(['leaves', from, to], signal => staffingApi.leaves(new Date(start).toISOString(), new Date(end).toISOString(), signal), enabled && mode === 'leaves');
  const directory = useStaffDirectory(manager);
  if (!can('workflow.staffing.read')) return <p role="alert">Bạn không có quyền xem lịch làm và nghỉ phép.</p>;
  const officerName = (id: string) => id === user?.id ? 'Bạn' : directory.data?.find(o => o.id === id)?.fullName || directory.data?.find(o => o.id === id)?.username || id;
  const periodFields = [{ name: 'startsAt', label: 'Bắt đầu (giờ Việt Nam)', type: 'datetime-local' as const }, { name: 'endsAt', label: 'Kết thúc (giờ Việt Nam)', type: 'datetime-local' as const }];
  return <section className="staff-workspace">
    <StaffHeading title={mode === 'shifts' ? manager ? 'Lịch ca làm của phường' : 'Lịch ca làm của tôi' : manager ? 'Duyệt nghỉ phép' : 'Nghỉ phép của tôi'} description={mode === 'shifts' ? 'Theo dõi thời gian làm việc và sắp xếp ca cho cán bộ.' : 'Theo dõi đơn nghỉ và kiểm tra hồ sơ cần bàn giao trước khi quyết định.'}>
      {mode === 'shifts' && manager && can('workflow.staffing.manage') && <Button onClick={() => setAction({ type: 'shift' })}>Tạo ca làm</Button>}
      {mode === 'leaves' && officer && can('workflow.leave.request') && <Button onClick={() => setAction({ type: 'leave' })}>Xin nghỉ phép</Button>}
    </StaffHeading>
    <div className="staff-filter"><div className="staff-filter-fields"><label>Từ ngày<input type="date" value={from} onChange={e => setFrom(e.target.value)} className={fieldClass} /></label><label>Đến ngày<input type="date" value={to} onChange={e => setTo(e.target.value)} className={fieldClass} /></label><Button variant="outline" disabled={!valid || (mode === 'shifts' ? shifts.isFetching : leaves.isFetching)} onClick={() => void (mode === 'shifts' ? shifts.refetch() : leaves.refetch())}>Làm mới</Button></div><p className="staff-hint">Giờ Việt Nam (UTC+07:00). Khoảng xem tối đa 93 ngày.</p></div>
    {!valid ? <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">Chọn khoảng ngày tăng dần, tối đa 93 ngày.</p> : mode === 'shifts' ? <><QueryState query={shifts} empty={!shifts.data?.length} />{!shifts.isError && !shifts.isPending && <div className="staff-grid">{shifts.data?.map(item => <article key={item.id} className="staff-card">
      <div className="staff-card-heading"><div className="min-w-0"><span className="staff-meta">Cán bộ</span><h3>{officerName(item.officerId)}</h3></div><StaffStatus value={item.cancelledAtUtc ? 'CANCELLED' : 'ACTIVE'} label={item.cancelledAtUtc ? 'Đã hủy' : 'Ca làm hoạt động'} /></div>
      <StaffPeriod start={item.startsAtUtc} end={item.endsAtUtc} />
      {item.cancelledAtUtc && item.cancellationReason && <p className="staff-note">Lý do hủy: {item.cancellationReason}</p>}
      {manager && can('workflow.staffing.manage') && !item.cancelledAtUtc && Date.parse(item.endsAtUtc) > Date.now() && <div className="staff-card-footer"><Button variant="outline" onClick={() => setAction({ type: 'cancel', shift: item })}>Hủy ca</Button></div>}
    </article>)}</div>}</> : <><QueryState query={leaves} empty={!leaves.data?.length} />{!leaves.isError && !leaves.isPending && <div className="staff-grid">{leaves.data?.map(item => <article key={item.id} className="staff-card">
      <div className="staff-card-heading"><div className="min-w-0"><span className="staff-meta">Cán bộ</span><h3>{officerName(item.officerId)}</h3></div><StaffStatus value={item.status} /></div>
      <StaffPeriod start={item.startsAtUtc} end={item.endsAtUtc} /><div className="staff-note"><span className="staff-meta">Lý do nghỉ</span><p>{item.reason}</p></div><div className="staff-card-footer"><Button variant="outline" onClick={() => setDetail(item)}>Chi tiết / lịch sử{manager ? ' / bàn giao' : ''}</Button>
      {Date.parse(item.endsAtUtc) > Date.now() && <>
        {manager && can('workflow.staffing.manage') && item.officerId !== user?.id && item.status === 'PENDING' && <><Button onClick={() => setAction({ type: 'decision', leave: item, decision: 'APPROVED' })}>Duyệt</Button><Button variant="outline" onClick={() => setAction({ type: 'decision', leave: item, decision: 'REJECTED' })}>Từ chối</Button></>}
        {((manager && can('workflow.staffing.manage') && ['PENDING', 'APPROVED'].includes(item.status)) || (officer && can('workflow.leave.request') && item.officerId === user?.id && item.status === 'PENDING')) && <Button variant="outline" onClick={() => setAction({ type: 'decision', leave: item, decision: 'CANCELLED' })}>Hủy đơn</Button>}
      </>}
    </div></article>)}</div>}</>}
    {detail && <LeaveDetail item={leaves.data?.find(l => l.id === detail.id) ?? detail} onClose={() => setDetail(undefined)} />}
    {action?.type === 'shift' && <ActionForm title="Tạo ca làm" description="Ca bắt đầu trong tương lai, tối đa 24 giờ và không trùng lịch/nghỉ đã duyệt." fields={[{ name: 'officerId', label: 'Cán bộ', type: 'select', options: directory.isError ? [] : directory.data?.filter(o => o.isActive && o.roles.includes('FRONT_DESK_OFFICER') && !o.roles.includes('MANAGER')).map(o => ({ value: o.id, label: o.fullName || o.username })) }, ...periodFields]} validate={v => directory.isFetching || directory.isError || !directory.data?.some(o => o.id === v.officerId) ? 'Vui lòng tải danh sách và chọn cán bộ.' : validatePeriod(v, true)} submit={v => staffingApi.createShift({ officerId: v.officerId, startsAt: vietnamIso(v.startsAt), endsAt: vietnamIso(v.endsAt) })} onClose={() => setAction(undefined)}><QueryState query={directory} /></ActionForm>}
    {action?.type === 'leave' && <ActionForm title="Gửi đơn xin nghỉ" fields={[...periodFields, { name: 'reason', label: 'Lý do nghỉ', type: 'textarea' }]} validate={v => validatePeriod(v)} submit={v => staffingApi.requestLeave({ startsAt: vietnamIso(v.startsAt), endsAt: vietnamIso(v.endsAt), reason: v.reason })} onClose={() => setAction(undefined)} />}
    {action?.type === 'cancel' && <ActionForm title="Hủy ca làm" fields={[{ name: 'reason', label: 'Lý do hủy', type: 'textarea' }]} submit={v => staffingApi.cancelShift(action.shift.id, v.reason)} onClose={() => setAction(undefined)} />}
    {action?.type === 'decision' && <ActionForm title={`${statusText(action.decision)} đơn nghỉ phép`} description="Kiểm tra hồ sơ cần bàn giao trước khi duyệt. Duyệt nghỉ không tự chuyển hồ sơ." fields={[{ name: 'reason', label: 'Lý do quyết định', type: 'textarea' }]} submit={v => staffingApi.decide(action.leave.id, action.leave.version, action.decision, v.reason)} onClose={() => setAction(undefined)} />}
  </section>;
}
