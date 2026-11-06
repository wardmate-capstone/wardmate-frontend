import { useState } from 'react';
import { Button } from '@/components/ui';
import { workScheduleApi } from '@/lib/api/workSchedules';
import { calendarDate, calendarDays, scheduleDay, scheduleTime } from '@/lib/scheduleCalendar';
import { vietnamLocal } from '@/lib/staffingValidation';
import { QueryState, fieldClass, useStaffAccess, useStaffDirectory, useStaffQuery } from './shared';

export function ScheduleListView() {
  const { manager, user } = useStaffAccess();
  const directory = useStaffDirectory(manager);
  const [officerId, setOfficer] = useState(manager ? '' : user!.id);
  const [month, setMonth] = useState(() => vietnamLocal(new Date().toISOString()).slice(0, 7));
  const query = useStaffQuery(['month-list', month], signal => workScheduleApi.month(month + '-01', signal), Boolean(officerId));
  const rows = query.data?.slots.filter(s => s.officerId === officerId) || [];
  const officers = directory.data?.filter(o => o.roles.includes('FRONT_DESK_OFFICER') && !o.roles.includes('MANAGER')) || [];
  return <div className="space-y-4"><div className="staff-filter"><div className="schedule-controls">
    {manager && <label className="staff-field">Cán bộ xem lịch<select className={fieldClass} value={officerId} disabled={directory.isPending || directory.isError} onChange={e => setOfficer(e.target.value)}><option value="">Chọn cán bộ</option>{officers.map(o => <option key={o.id} value={o.id}>{o.fullName || o.username}{o.isActive ? '' : ' (ngừng hoạt động)'}</option>)}</select></label>}
    <label className="staff-field">Tháng xem lịch<select className={fieldClass} disabled={!officerId} value={month.slice(5, 7)} onChange={e => setMonth(month.slice(0, 5) + e.target.value)}>{Array.from({ length: 12 }, (_, i) => <option key={i} value={String(i + 1).padStart(2, '0')}>Tháng {i + 1}</option>)}</select></label>
    <label className="staff-field">Năm xem lịch<select className={fieldClass} disabled={!officerId} value={month.slice(0, 4)} onChange={e => setMonth(e.target.value + month.slice(4))}>{Array.from({ length: 100 }, (_, i) => <option key={i} value={2000 + i}>{2000 + i}</option>)}</select></label>
    <Button variant="outline" disabled={!officerId || query.isFetching} onClick={() => void query.refetch()}>Làm mới danh sách</Button>
  </div><p className="staff-hint">Chỉ xem lịch của cán bộ đã chọn trong một tháng. Chỉnh sửa ca chưa bắt đầu tại Sắp xếp lịch tháng; công bố để áp dụng thay đổi.</p></div>
    {manager && <QueryState query={directory} />}
    {!officerId ? <div className="staff-state">Chọn cán bộ rồi chọn tháng để xem danh sách lịch.</div> : <><QueryState query={query} />{query.data && !query.isError && <section className="staff-card space-y-4"><h3>Lịch tháng {Number(month.slice(5, 7))}/{month.slice(0, 4)} · {manager ? officers.find(o => o.id === officerId)?.fullName || 'Cán bộ đã chọn' : 'Của tôi'}</h3><p className="text-sm">Lịch chính thức · Chỉ xem · {rows.length} ca làm · Giờ Việt Nam (24 giờ)</p>
      <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b border-slate-200"><th className="p-3">Ngày</th><th className="p-3">Loại ngày</th><th className="p-3">Giờ làm</th></tr></thead><tbody>{calendarDays(month + '-01').map(day => {
        const slots = rows.filter(s => scheduleDay(s.startsAt) === day);
        const holiday = query.data!.closures.some(c => c.closureDate === day);
        const fullLeave = query.data!.leaves.some(l => l.officerId === officerId && Date.parse(l.startsAtUtc) <= Date.parse(day + 'T00:00:00+07:00') && Date.parse(l.endsAtUtc) >= Date.parse(day + 'T00:00:00+07:00') + 86400000);
        const label = fullLeave ? 'Nghỉ phép đã duyệt' : holiday ? 'Nghỉ / lễ chung' : slots.length ? 'Có ca làm' : 'Chưa có ca';
        return <tr key={day} className={`border-b border-slate-100 ${holiday || fullLeave ? 'bg-rose-50' : slots.length ? 'bg-emerald-50' : ''}`}><td className="p-3 whitespace-nowrap">{calendarDate(day)}</td><td className="p-3">{label}</td><td className="p-3">{slots.length ? slots.map(s => <div key={s.shiftId} className="whitespace-nowrap">{scheduleTime(s.startsAt)}–{scheduleTime(s.endsAt)}{scheduleDay(s.endsAt) !== day ? ` (đến ${calendarDate(scheduleDay(s.endsAt))})` : ''}</div>) : holiday || fullLeave ? '—' : 'Chưa có ca'}</td></tr>;
      })}</tbody></table></div>
    </section>}</>}
  </div>;
}
