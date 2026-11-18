import { useState } from 'react';
import { RefreshButton } from '@/components/ui';
import { workScheduleApi } from '@/lib/api/workSchedules';
import { staffingApi } from '@/lib/api/staffing';
import { calendarDate, calendarDays, scheduleDay, scheduleTime } from '@/lib/scheduleCalendar';
import { vietnamIso, vietnamLocal } from '@/lib/staffingValidation';
import { QueryState, fieldClass, useStaffAccess, useStaffDirectory, useStaffQuery } from './shared';

const dayStart = (day: string) => Date.parse(day + 'T00:00:00+07:00');
const weekday = new Intl.DateTimeFormat('vi-VN', { weekday: 'long', timeZone: 'Asia/Ho_Chi_Minh' });
const hours = (ms: number) => (Math.round(ms / 360000) / 10).toLocaleString('vi-VN');

export function ScheduleListView() {
  const { manager, user } = useStaffAccess();
  const directory = useStaffDirectory(manager);
  const [officerId, setOfficer] = useState(manager ? '' : user!.id);
  const [month, setMonth] = useState(() => vietnamLocal(new Date().toISOString()).slice(0, 7));
  const [hideEmpty, setHideEmpty] = useState(false);
  const query = useStaffQuery(['month-list', month], async signal => {
    const start = vietnamIso(month + '-01T00:00');
    const [data, shifts] = await Promise.all([workScheduleApi.month(month + '-01', signal), staffingApi.shifts(start, vietnamIso(month + '-02T00:00'), signal)]);
    const carry = shifts.filter(s => !s.cancelledAtUtc && Date.parse(s.startsAtUtc) < Date.parse(start) && Date.parse(s.endsAtUtc) > Date.parse(start)).map(s => ({ shiftId: s.id, officerId: s.officerId, startsAt: s.startsAtUtc, endsAt: s.endsAtUtc }));
    return { ...data, slots: [...data.slots, ...carry] };
  }, Boolean(officerId));
  const rows = query.data?.slots.filter(s => s.officerId === officerId) || [];
  const officers = directory.data?.filter(o => o.roles.includes('FRONT_DESK_OFFICER') && !o.roles.includes('MANAGER')) || [];
  const selected = officers.find(o => o.id === officerId);
  const today = scheduleDay(new Date().toISOString());

  const days = query.data ? calendarDays(month + '-01').map(day => {
    const slots = rows.filter(s => Date.parse(s.startsAt) < dayStart(day) + 86400000 && Date.parse(s.endsAt) > dayStart(day)).sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt));
    const holiday = query.data.closures.some(c => c.closureDate === day);
    const fullLeave = query.data.leaves.some(l => l.officerId === officerId && Date.parse(l.startsAtUtc) <= dayStart(day) && Date.parse(l.endsAtUtc) >= dayStart(day) + 86400000);
    const status = fullLeave ? { label: 'Nghỉ phép đã duyệt', tone: 'is-off' } : holiday ? { label: 'Nghỉ / lễ chung', tone: 'is-off' } : slots.length ? { label: 'Có ca làm', tone: 'is-work' } : { label: 'Chưa có ca', tone: 'is-empty' };
    return { day, slots, off: holiday || fullLeave, status };
  }) : [];
  const visibleDays = hideEmpty ? days.filter(d => d.slots.length || d.off) : days;
  const stats = [
    { label: 'Ca làm', value: rows.length.toLocaleString('vi-VN') },
    { label: 'Ngày có ca', value: days.filter(d => d.slots.length).length.toLocaleString('vi-VN') },
    { label: 'Tổng giờ làm', value: `${hours(rows.reduce((sum, s) => sum + Date.parse(s.endsAt) - Date.parse(s.startsAt), 0))} giờ` },
    { label: 'Ngày nghỉ / lễ', value: days.filter(d => d.off).length.toLocaleString('vi-VN') },
  ];

  return <div className="schedule-list space-y-4"><div className="staff-filter"><div className="schedule-controls">
    {manager && <label className="staff-field">Cán bộ xem lịch<select className={fieldClass} value={officerId} disabled={directory.isPending || directory.isError} onChange={e => setOfficer(e.target.value)}><option value="">Chọn cán bộ</option>{officers.map(o => <option key={o.id} value={o.id}>{o.fullName || o.username}{o.fullName ? ` · ${o.username}` : ''}{o.isActive ? '' : ' (ngừng hoạt động)'}</option>)}</select></label>}
    <label className="staff-field">Tháng xem lịch<select className={fieldClass} disabled={!officerId} value={month.slice(5, 7)} onChange={e => setMonth(month.slice(0, 5) + e.target.value)}>{Array.from({ length: 12 }, (_, i) => <option key={i} value={String(i + 1).padStart(2, '0')}>Tháng {i + 1}</option>)}</select></label>
    <label className="staff-field">Năm xem lịch<select className={fieldClass} disabled={!officerId} value={month.slice(0, 4)} onChange={e => setMonth(e.target.value + month.slice(4))}>{Array.from({ length: 100 }, (_, i) => <option key={i} value={2000 + i}>{2000 + i}</option>)}</select></label>
    <RefreshButton label="Làm mới danh sách" loading={query.isFetching} disabled={!officerId} onClick={() => void query.refetch()} />
  </div><p className="staff-hint">Chỉ xem lịch của cán bộ đã chọn trong một tháng. Chỉnh sửa ca chưa bắt đầu tại Sắp xếp lịch tháng; công bố để áp dụng thay đổi.</p></div>
    {manager && <QueryState query={directory} />}
    {!officerId ? <div className="staff-state">Chọn cán bộ rồi chọn tháng để xem danh sách lịch.</div> : <><QueryState query={query} />{query.data && !query.isError && <section className="schedule-list-card" aria-label="Danh sách ca trong tháng">
      <header className="schedule-list-header">
        <div><h3>Lịch tháng {Number(month.slice(5, 7))}/{month.slice(0, 4)} · {manager ? selected?.fullName || selected?.username || 'Cán bộ đã chọn' : 'Của tôi'}</h3>
          <p>{manager && selected?.fullName ? `${selected.username} · ` : ''}Lịch chính thức · Chỉ xem · Giờ Việt Nam (24 giờ)</p></div>
        <label className="schedule-list-toggle"><input type="checkbox" checked={hideEmpty} onChange={e => setHideEmpty(e.target.checked)} />Ẩn ngày chưa có ca</label>
      </header>
      <dl className="schedule-list-stats">{stats.map(s => <div key={s.label}><dt>{s.label}</dt><dd>{s.value}</dd></div>)}</dl>
      <div className="schedule-list-scroll"><table className="schedule-list-table">
        <caption className="sr-only">Ca làm từng ngày trong tháng {Number(month.slice(5, 7))}/{month.slice(0, 4)}</caption>
        <thead><tr><th scope="col">Ngày</th><th scope="col">Thứ</th><th scope="col">Trạng thái</th><th scope="col">Ca làm</th></tr></thead>
        <tbody>{visibleDays.map(({ day, slots, off, status }) => <tr key={day} className={[off && 'is-off', day === today && 'is-today', new Date(day + 'T00:00:00Z').getUTCDay() === 0 && 'is-sunday'].filter(Boolean).join(' ') || undefined}>
          <td>{calendarDate(day)}<span className="schedule-list-mobile-weekday">{weekday.format(new Date(dayStart(day)))}{day === today && ' · Hôm nay'}</span></td>
          <td className="schedule-list-weekday">{weekday.format(new Date(dayStart(day)))}{day === today && <small>Hôm nay</small>}</td>
          <td><span className={`schedule-list-status ${status.tone}`}>{status.label}</span></td>
          <td>{slots.length ? <div className="schedule-list-shifts">{slots.map(s => <span key={s.shiftId} className={`schedule-list-shift ${Number(scheduleTime(s.startsAt).slice(0, 2)) < 12 ? 'is-morning' : 'is-afternoon'}`}>{scheduleTime(s.startsAt)}–{scheduleTime(s.endsAt)}{scheduleDay(s.startsAt) !== day ? ` (từ ${calendarDate(scheduleDay(s.startsAt))})` : scheduleDay(s.endsAt) !== day ? ` (đến ${calendarDate(scheduleDay(s.endsAt))})` : ''}</span>)}</div>
            : off ? <><span className="schedule-list-none" aria-hidden="true">—</span><span className="schedule-list-status is-off schedule-list-mobile-status">{status.label}</span></> : <span className="schedule-list-none" aria-label="Không có ca">—</span>}</td>
        </tr>)}</tbody>
      </table></div>
      {!visibleDays.length && <p className="staff-state">Tháng này chưa có ca làm hoặc ngày nghỉ.</p>}
    </section>}</>}
  </div>;
}
