import { useState } from 'react';
import { Button, Modal } from '@/components/ui';
import { staffingApi, type DispatchApplication, type Leave } from '@/lib/api/staffing';
import { workScheduleApi } from '@/lib/api/workSchedules';
import { validStaffingRange } from '@/lib/staffingValidation';
import { AssignDialog } from './DispatchView';
import { LeaveDraftsView, WordViewer } from './LeaveDraftsView';
import { ActionForm, dateText, fieldClass, QueryState, StaffHeading, StaffPeriod, StaffStatus, statusText, useStaffAccess, useStaffDirectory, useStaffQuery } from './shared';

function LeaveDetail({ id, name, onClose }: { id: string; name: (id: string) => string; onClose: () => void }) {
  const { manager, officer, user, can } = useStaffAccess();
  const query = useStaffQuery(['leave-detail', id], signal => workScheduleApi.leaveDetail(id, signal));
  const history = useStaffQuery(['leave-history', id], signal => staffingApi.leaveHistory(id, signal), query.isSuccess);
  const manage = manager && can('workflow.staffing.manage');
  const impact = useStaffQuery(['impact', id], signal => staffingApi.impact(id, signal), manage && query.isSuccess);
  const shifts = useStaffQuery(['shift-impact', id], signal => workScheduleApi.shiftImpact(id, signal), manage && query.isSuccess);
  const [assign, setAssign] = useState<DispatchApplication>();
  const [word, setWord] = useState(false);
  const [decision, setDecision] = useState<{ leave: Leave; value: string }>();
  const item = query.data?.leave;
  const current = query.isSuccess && query.isFetchedAfterMount && !query.isFetching;
  const canDecide = Boolean(current && item && manage && item.officerId !== user?.id && item.status === 'PENDING' && Date.parse(item.endsAtUtc) > Date.now());
  const canCancel = Boolean(current && item && Date.parse(item.endsAtUtc) > Date.now() && ((manage && ['PENDING', 'APPROVED'].includes(item.status)) || (officer && can('workflow.leave.request') && item.officerId === user?.id && item.status === 'PENDING')));
  return <Modal open title="Chi tiết nghỉ phép" className="sm:max-w-4xl" onOpenChange={v => !v && onClose()}>
    <div className="space-y-5"><Button variant="outline" disabled={query.isFetching} onClick={() => void query.refetch()}>Đọc lại đơn</Button><QueryState query={query} />
      {item && !query.isError && <><p className="text-sm text-slate-600">Cán bộ: <strong className="text-slate-900">{name(item.officerId)}</strong></p><StaffStatus value={item.status} /><StaffPeriod start={item.startsAtUtc} end={item.endsAtUtc} /><p className="staff-note">{item.reason}</p>{item.decisionReason && <p className="staff-note">Lý do quyết định: {item.decisionReason}</p>}
        {query.data?.hasSubmittedDocx ? <Button variant="outline" disabled={!current} onClick={() => setWord(true)}>Xem Word đã nộp</Button> : <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">Đơn này không kèm tệp Word.</p>}
        <div className="staff-actions">{canDecide && <><Button onClick={() => setDecision({ leave: item, value: 'APPROVED' })}>Duyệt</Button><Button variant="outline" onClick={() => setDecision({ leave: item, value: 'REJECTED' })}>Từ chối</Button></>}{canCancel && <Button variant="outline" onClick={() => setDecision({ leave: item, value: 'CANCELLED' })}>Hủy đơn</Button>}</div>
      </>}
      {manage && item && !query.isError && <><section className="space-y-3"><h3 className="font-bold">Ca bị ảnh hưởng</h3><p className="text-sm text-slate-600">Giữ nguyên ca gốc; thời gian nghỉ chỉ ảnh hưởng phần giao nhau.</p><QueryState query={shifts} empty={!shifts.data?.length} />{!shifts.isError && shifts.data?.map(row => <div key={row.shiftId} className="rounded-lg border border-slate-200 p-3 text-sm"><p>Ca gốc: {dateText(row.shiftStartsAtUtc)} — {dateText(row.shiftEndsAtUtc)}</p><p className="mt-2 font-semibold">Phần nghỉ: {dateText(row.overlapStartsAtUtc)} — {dateText(row.overlapEndsAtUtc)}</p></div>)}</section>
        <section className="space-y-3"><h3 className="font-bold">Hồ sơ cần xem xét bàn giao</h3><p className="text-sm text-slate-600">Hồ sơ cán bộ đang giữ, không phải dự báo theo ngày nghỉ. Duyệt nghỉ không tự chuyển hồ sơ.</p><QueryState query={impact} empty={!impact.data?.length} />{!impact.isError && impact.data?.map(app => <div key={app.id} className="rounded-lg border border-slate-200 p-3"><p className="break-words text-sm">{app.applicationCode || app.id} · {app.procedureTitle}</p>{can('workflow.dispatch.write') && <Button variant="outline" className="mt-3" onClick={() => setAssign(app)}>Bàn giao hồ sơ</Button>}</div>)}</section></>}
      {item && !query.isError && <section className="space-y-3"><h3 className="font-bold">Lịch sử quyết định</h3><QueryState query={history} empty={!history.data?.length} />{!history.isError && history.data?.map(row => <article key={row.id} className="rounded-lg border border-slate-200 p-3 text-sm"><p className="font-semibold">{statusText(row.fromStatus)} → {statusText(row.toStatus)}</p><p className="my-2 whitespace-pre-wrap break-words">{row.reason}</p><p className="break-all text-slate-500">Người quyết định: {row.actorId}</p><time>{dateText(row.createdAtUtc)}</time></article>)}</section>}
    </div>
    {assign && <AssignDialog application={assign} leave onClose={() => setAssign(undefined)} />}
    {word && query.data && !query.isError && <WordViewer title="Đơn nghỉ đã nộp — chỉ xem" load={async signal => { const latest = await workScheduleApi.leaveDetail(id, signal); if (!latest.hasSubmittedDocx || latest.submittedRevisionId !== query.data.submittedRevisionId) throw new Error('Tài liệu đã thay đổi. Đóng trình đọc và đọc lại đơn.'); return workScheduleApi.submittedDocx(id, latest.sha256, signal); }} onClose={() => setWord(false)} />}
    {decision && <ActionForm title={`${statusText(decision.value)} đơn nghỉ phép`} description="Quyết định áp dụng cho đơn đang xem. Duyệt nghỉ không tự chuyển hồ sơ." fields={[{ name: 'reason', label: 'Lý do quyết định', type: 'textarea' }]} submit={async v => {
      const latest = await workScheduleApi.leaveDetail(id);
      if (latest.leave.version !== decision.leave.version || latest.leave.status !== decision.leave.status) throw new Error('Đơn đã thay đổi. Đóng biểu mẫu và đọc lại đơn trước khi quyết định.');
      return staffingApi.decide(id, latest.leave.version, decision.value, v.reason);
    }} onClose={() => { setDecision(undefined); void query.refetch(); }} />}
  </Modal>;
}

export function LeaveRequestsView({ initialLeaveId }: { initialLeaveId?: string }) {
  const { manager, officer, can, user } = useStaffAccess();
  const today = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date());
  const [from, setFrom] = useState(today.slice(0, 7) + '-01');
  const [to, setTo] = useState(today.slice(0, 7) + '-' + new Date(Number(today.slice(0, 4)), Number(today.slice(5, 7)), 0).getDate());
  const [tab, setTab] = useState<'submitted' | 'drafts'>(officer && !initialLeaveId && can('workflow.leave.request') ? 'drafts' : 'submitted');
  const [createOpen, setCreateOpen] = useState(false);
  const [selected, setSelected] = useState(initialLeaveId);
  const valid = validStaffingRange(from, to);
  const query = useStaffQuery(['leaves', from, to], signal => staffingApi.leaves(new Date(`${from}T00:00:00+07:00`).toISOString(), new Date(`${to}T23:59:59.999+07:00`).toISOString(), signal), valid && can('workflow.staffing.read') && tab === 'submitted');
  const capabilities = useStaffQuery(['capabilities'], signal => workScheduleApi.capabilities(signal), officer && can('workflow.leave.request'));
  const directory = useStaffDirectory(manager);
  const name = (id: string) => {
    if (id === user?.id) return user.profile?.fullName?.trim() || user.username;
    const person = directory.data?.find(o => o.id.toLowerCase() === id.toLowerCase());
    return person?.fullName?.trim() || person?.username?.trim() || (directory.isPending ? 'Đang tải tên cán bộ…' : 'Chưa tìm thấy tên cán bộ');
  };
  if (!can('workflow.staffing.read')) return <p role="alert">Bạn không có quyền xem nghỉ phép.</p>;
  return <section className="staff-workspace"><StaffHeading title={manager ? 'Duyệt nghỉ phép' : 'Nghỉ phép của tôi'} description={manager ? 'Theo dõi đơn nghỉ, tài liệu Word và lịch sử. Kiểm tra hồ sơ cần bàn giao trước khi quyết định.' : 'Tạo đơn nghỉ phép mới, tiếp tục soạn đơn hoặc theo dõi kết quả duyệt.'}>
      {officer && can('workflow.leave.request') && <Button disabled={!capabilities.data || capabilities.isError} onClick={() => { setTab('drafts'); setCreateOpen(true); }}>Tạo đơn nghỉ phép</Button>}
    </StaffHeading>
    {officer && can('workflow.leave.request') && <><div className="staff-tabs" aria-label="Loại đơn nghỉ"><Button variant={tab === 'drafts' ? 'primary' : 'outline'} aria-pressed={tab === 'drafts'} onClick={() => setTab('drafts')}>Đơn đang soạn</Button><Button variant={tab === 'submitted' ? 'primary' : 'outline'} aria-pressed={tab === 'submitted'} onClick={() => setTab('submitted')}>Đơn đã gửi</Button></div><QueryState query={capabilities} /></>}
    {tab === 'drafts' && capabilities.data && !capabilities.isError && <LeaveDraftsView capabilities={capabilities.data} createOpen={createOpen} onCreateClose={() => setCreateOpen(false)} onSubmitted={id => { setTab('submitted'); setSelected(id); }} />}
    {tab === 'submitted' && <><div className="staff-filter"><div className="staff-filter-fields"><label>Từ ngày<input type="date" className={fieldClass} value={from} onChange={e => setFrom(e.target.value)} /></label><label>Đến ngày<input type="date" className={fieldClass} value={to} onChange={e => setTo(e.target.value)} /></label><Button variant="outline" disabled={!valid || query.isFetching} onClick={() => void query.refetch()}>Làm mới</Button></div><p className="staff-hint">Thời gian theo giờ Việt Nam. Xem tối đa 93 ngày.</p></div>
      {manager && directory.isError && <div className="space-y-2"><p className="text-sm text-slate-600">Chưa tải được tên cán bộ từ danh sách nhân sự.</p><QueryState query={directory} /></div>}
      {!valid ? <p role="alert" className="text-sm text-red-800">Chọn khoảng ngày tăng dần, tối đa 93 ngày.</p> : <><QueryState query={query} empty={manager && !query.data?.length} />{officer && query.isSuccess && !query.data.length && <div role="status" className="staff-state"><p className="font-semibold text-slate-800">Bạn chưa có đơn đã gửi trong khoảng ngày này</p><p>Đơn đã gửi cho quản lý sẽ xuất hiện tại đây. Chọn Đơn đang soạn để tiếp tục viết đơn.</p></div>}{!query.isError && <div className="staff-grid">{query.data?.map(item => <article key={item.id} className="staff-card"><div className="staff-card-heading"><div className="min-w-0"><span className="staff-meta">Cán bộ</span><h3>{name(item.officerId)}</h3></div><StaffStatus value={item.status} /></div><StaffPeriod start={item.startsAtUtc} end={item.endsAtUtc} /><p className="staff-note">{item.reason}</p><div className="staff-card-footer"><Button variant="outline" onClick={() => setSelected(item.id)}>{manager ? 'Chi tiết / lịch sử / bàn giao' : 'Xem đơn và kết quả duyệt'}</Button></div></article>)}</div>}</>}
    </>}
    {selected && <LeaveDetail key={selected} id={selected} name={name} onClose={() => setSelected(undefined)} />}
  </section>;
}
