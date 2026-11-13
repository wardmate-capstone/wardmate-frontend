import { useState } from 'react';
import { Button, RefreshButton } from '@/components/ui';
import { workScheduleApi, type ScheduleSlot, type ShiftChange } from '@/lib/api/workSchedules';
import { vietnamIso, vietnamLocal, validatePeriod } from '@/lib/staffingValidation';
import { ActionForm, Pager, QueryState, StaffPeriod, StaffStatus, useStaffAccess, useStaffDirectory, useStaffQuery } from './shared';

export function RequestShiftChange({ slot, onClose }: { slot: ScheduleSlot; onClose: () => void }) {
  return <ActionForm title="Đề nghị đổi giờ ca" description="Ca hiện tại vẫn có hiệu lực trong khi chờ quản lý duyệt. Chỉ thay đổi giờ của chính ca này." fields={[{ name: 'startsAt', label: 'Giờ bắt đầu đề xuất (Việt Nam)', type: 'datetime-local' }, { name: 'endsAt', label: 'Giờ kết thúc đề xuất (Việt Nam)', type: 'datetime-local' }, { name: 'reason', label: 'Lý do đổi ca', type: 'textarea' }]} defaultValues={{ startsAt: vietnamLocal(slot.startsAt), endsAt: vietnamLocal(slot.endsAt), reason: '' }} validate={v => validatePeriod(v, true) || (Date.parse(vietnamIso(v.startsAt)) === Date.parse(slot.startsAt) && Date.parse(vietnamIso(v.endsAt)) === Date.parse(slot.endsAt) ? 'Giờ đề xuất cần khác ca hiện tại.' : undefined)} submit={v => workScheduleApi.requestChange({ shiftId: slot.shiftId, expectedVersion: slot.shiftVersion, startsAt: vietnamIso(v.startsAt), endsAt: vietnamIso(v.endsAt), reason: v.reason })} onClose={onClose}><p className="mb-3 text-sm font-semibold">Ca hiện tại</p><StaffPeriod start={slot.startsAt} end={slot.endsAt} /></ActionForm>;
}
export function ShiftChangesView() {
  const { manager, can } = useStaffAccess();
  const [page, setPage] = useState(1);
  const [decision, setDecision] = useState<{ item: ShiftChange; value: 'APPROVED' | 'REJECTED' }>();
  const query = useStaffQuery(['shift-changes', page], signal => workScheduleApi.changes(page, signal));
  const directory = useStaffDirectory(manager);
  const name = (id: string) => directory.data?.find(o => o.id === id)?.fullName || directory.data?.find(o => o.id === id)?.username || (manager ? id : 'Bạn');
  return <div className="space-y-4"><p className="text-sm leading-6 text-slate-600">Yêu cầu đổi giờ chưa làm thay đổi ca chính thức. Quản lý kiểm tra và quyết định từng yêu cầu.</p><RefreshButton label="Làm mới yêu cầu đổi ca" loading={query.isFetching} onClick={() => void query.refetch()} /><QueryState query={query} empty={!query.data?.items.length} />
    {!query.isError && <div className="staff-grid">{query.data?.items.map(item => <article key={item.id} className="staff-card"><div className="staff-card-heading"><h3>{name(item.officerId)}</h3><StaffStatus value={item.status} /></div><p className="mt-3 text-sm font-semibold">Ca gốc</p><StaffPeriod start={item.originalStart} end={item.originalEnd} /><p className="text-sm font-semibold">Giờ đề xuất</p><StaffPeriod start={item.proposedStart} end={item.proposedEnd} /><p className="staff-note">{item.reason}</p>{item.decisionReason && <p className="staff-note">Lý do quyết định: {item.decisionReason}</p>}{manager && can('workflow.staffing.manage') && item.status === 'PENDING' && <div className="staff-card-footer"><Button disabled={query.isFetching} onClick={() => setDecision({ item, value: 'APPROVED' })}>Duyệt đổi ca</Button><Button variant="outline" disabled={query.isFetching} onClick={() => setDecision({ item, value: 'REJECTED' })}>Từ chối đổi ca</Button></div>}</article>)}</div>}
    <Pager page={page} total={query.data?.total ?? 0} setPage={setPage} />
    {decision && <ActionForm title={decision.value === 'APPROVED' ? 'Duyệt đổi giờ ca' : 'Từ chối đổi giờ ca'} fields={[{ name: 'reason', label: 'Lý do quyết định', type: 'textarea' }]} submit={v => workScheduleApi.decideChange(decision.item.id, decision.value, v.reason)} onClose={() => setDecision(undefined)}><StaffPeriod start={decision.item.proposedStart} end={decision.item.proposedEnd} /></ActionForm>}
  </div>;
}
