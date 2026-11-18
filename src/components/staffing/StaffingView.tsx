import { useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui';
import { CalendarBlank, CalendarDots, ListBullets, ArrowsLeftRight, Clock } from '@phosphor-icons/react';
import type { ScheduleSlot } from '@/lib/api/workSchedules';
import { StaffHeading, useStaffAccess } from './shared';
import { ScheduleListView } from './ScheduleListView';
import { MonthlyScheduleView } from './MonthlyScheduleView';
import { WardScheduleView } from './WardScheduleView';
import { LeaveRequestsView } from './LeaveRequestsView';
import { RequestShiftChange, ShiftChangesView } from './ShiftChangesView';

function ScheduleWorkspace({ initialTab }: { initialTab: 'ward' | 'list' | 'month' | 'changes' }) {
  const { manager } = useStaffAccess();
  const [tab, setTab] = useState<'ward' | 'list' | 'month' | 'changes'>((initialTab === 'list' || initialTab === 'ward') && !manager ? 'month' : initialTab);
  const [change, setChange] = useState<ScheduleSlot>();
  return <section className={`staff-workspace ${manager ? 'manager-schedule-workspace' : ''}`}>
    {manager ? <p className="manager-schedule-intro">Theo dõi ca trực toàn phường, sắp xếp lịch và xử lý yêu cầu đổi ca.</p> : <StaffHeading title="Lịch ca làm của tôi" description="Chọn tháng và bấm ngày để xem giờ làm. Bạn có thể xác nhận đã xem lịch hoặc đề nghị đổi giờ ca." />}
    <div className={manager ? 'manager-schedule-navigation' : undefined}><div className="staff-tabs" role="group" aria-label="Chế độ lịch làm việc">{([['ward', 'Lịch toàn phường', CalendarBlank], ['month', manager ? 'Sắp xếp lịch tháng' : 'Lịch tháng', CalendarDots], ['list', 'Danh sách ca', ListBullets], ['changes', 'Yêu cầu đổi ca', ArrowsLeftRight]] as const).filter(([value]) => manager || (value !== 'list' && value !== 'ward')).map(([value, label, Icon]) => <Button key={value} variant={tab === value ? 'primary' : 'outline'} aria-pressed={tab === value} onClick={() => setTab(value)}>{manager && <Icon size={18} aria-hidden="true" />}{label}</Button>)}</div>{manager && <span className="manager-schedule-timezone"><Clock size={15} aria-hidden="true" />Giờ Việt Nam · 24 giờ</span>}</div>
    {manager && tab === 'ward' && <WardScheduleView />}
    {manager && tab === 'list' && <ScheduleListView />}
    <div hidden={tab !== 'month'} className={manager ? 'manager-schedule-month' : undefined}><MonthlyScheduleView onRequestChange={setChange} /></div>
    {tab === 'changes' && <ShiftChangesView />}{change && <RequestShiftChange slot={change} onClose={() => setChange(undefined)} />}
  </section>;
}

export function StaffingView({ mode }: { mode: 'shifts' | 'leaves' }) {
  const { user, manager, can } = useStaffAccess();
  const [params] = useSearchParams();
  const location = useLocation();
  if (!user || !can('workflow.staffing.read')) return <p role="alert">Bạn không có quyền xem lịch làm và nghỉ phép.</p>;
  const key = [user.id, user.wardId, user.roles.slice().sort().join('|'), user.permissions.slice().sort().join('|'), location.key].join(':');
  const view = params.get('view');
  return mode === 'shifts' ? <ScheduleWorkspace key={key} initialTab={view === 'list' || view === 'changes' || view === 'month' || view === 'ward' ? view : manager ? 'ward' : 'month'} /> : <LeaveRequestsView key={key} />;
}
