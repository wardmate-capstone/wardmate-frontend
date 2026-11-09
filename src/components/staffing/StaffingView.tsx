import { useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui';
import type { ScheduleSlot } from '@/lib/api/workSchedules';
import { StaffHeading, useStaffAccess } from './shared';
import { ScheduleListView } from './ScheduleListView';
import { MonthlyScheduleView } from './MonthlyScheduleView';
import { LeaveRequestsView } from './LeaveRequestsView';
import { RequestShiftChange, ShiftChangesView } from './ShiftChangesView';

function ScheduleWorkspace({ initialTab }: { initialTab: 'list' | 'month' | 'changes' }) {
  const { manager } = useStaffAccess();
  const [tab, setTab] = useState<'list' | 'month' | 'changes'>(initialTab === 'list' && !manager ? 'month' : initialTab);
  const [change, setChange] = useState<ScheduleSlot>();
  return <section className="staff-workspace"><StaffHeading title={manager ? 'Lịch ca làm của phường' : 'Lịch ca làm của tôi'} description={manager ? "Chọn cán bộ và tháng, bấm ngày để đặt giờ làm rồi công bố lịch. Thời gian theo giờ Việt Nam." : "Chọn tháng và bấm ngày để xem giờ làm. Bạn có thể xác nhận đã xem lịch hoặc đề nghị đổi giờ ca."} />
    <div className="staff-tabs" aria-label="Chế độ lịch làm việc">{([['month', manager ? 'Sắp xếp lịch tháng' : 'Lịch tháng'], ['list', 'Danh sách ca'], ['changes', 'Yêu cầu đổi ca']] as const).filter(([value]) => manager || value !== 'list').map(([value, label]) => <Button key={value} variant={tab === value ? 'primary' : 'outline'} aria-pressed={tab === value} onClick={() => setTab(value)}>{label}</Button>)}</div>
    {manager && tab === 'list' && <ScheduleListView />}
    <div hidden={tab !== 'month'}><MonthlyScheduleView onRequestChange={setChange} /></div>
    {tab === 'changes' && <ShiftChangesView />}{change && <RequestShiftChange slot={change} onClose={() => setChange(undefined)} />}
  </section>;
}

export function StaffingView({ mode }: { mode: 'shifts' | 'leaves' }) {
  const { user, can } = useStaffAccess();
  const [params] = useSearchParams();
  const location = useLocation();
  if (!user || !can('workflow.staffing.read')) return <p role="alert">Bạn không có quyền xem lịch làm và nghỉ phép.</p>;
  const key = [user.id, user.wardId, user.roles.slice().sort().join('|'), user.permissions.slice().sort().join('|'), location.key].join(':');
  const view = params.get('view');
  return mode === 'shifts' ? <ScheduleWorkspace key={key} initialTab={view === 'list' || view === 'changes' ? view : 'month'} /> : <LeaveRequestsView key={key} />;
}
