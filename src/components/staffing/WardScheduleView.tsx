import { useState } from 'react';
import { getInitials } from '@/hooks/useUserProfile';
import { Button, RefreshButton } from '@/components/ui';
import { CaretLeft, CaretRight, CalendarBlank, MagnifyingGlass } from '@phosphor-icons/react';
import { staffingApi, type Shift } from '@/lib/api/staffing';
import { calendarDate, calendarDays, scheduleDay, scheduleTime } from '@/lib/scheduleCalendar';
import { vietnamLocal } from '@/lib/staffingValidation';
import { addCalendarDays } from '@/lib/calendarRules';
import { fieldClass, QueryState, useStaffAccess, useStaffDirectory, useStaffQuery } from './shared';

const dayStart = (day: string) => Date.parse(day + 'T00:00:00+07:00');
const weekday = new Intl.DateTimeFormat('vi-VN', { weekday: 'short', timeZone: 'Asia/Ho_Chi_Minh' });

/** Năm trước, năm nay, năm sau (không sổ 100 năm); giữ năm đang chọn nếu nằm ngoài khoảng. */
function scheduleYears(month: string): number[] {
  const y = Number(vietnamLocal(new Date().toISOString()).slice(0, 4));
  return [...new Set([y - 1, y, y + 1, Number(month.slice(0, 4))])].sort((a, b) => a - b);
}

/**
 * FE-14: tuần đủ 7 ngày Thứ Hai–Chủ nhật (như lịch cá nhân). Tuần đầu/cuối mượn ngày của tháng bên cạnh;
 * những ngày đó hiện mờ, không có ca (dữ liệu chỉ tải theo tháng đang xem).
 */
function mondayWeeks(days: string[]) {
  const lead = (new Date(days[0] + 'T12:00:00Z').getUTCDay() + 6) % 7;
  let cursor = addCalendarDays(days[0], -lead);
  const last = days[days.length - 1];
  const weeks: string[][] = [];
  while (cursor <= last) {
    const week: string[] = [];
    for (let i = 0; i < 7; i++) { week.push(cursor); cursor = addCalendarDays(cursor, 1); }
    weeks.push(week);
  }
  return weeks;
}
const weekOf = (days: string[], day: string) => Math.max(0, mondayWeeks(days).findIndex(w => w.includes(day)));

export function WardScheduleView() {
  const { manager, can } = useStaffAccess();
  const allowed = manager && can('workflow.staffing.manage');
  const [month, setMonth] = useState(() => vietnamLocal(new Date().toISOString()).slice(0, 7));
  const [week, setWeek] = useState(() => { const today = vietnamLocal(new Date().toISOString()); return weekOf(calendarDays(today.slice(0, 7) + '-01'), today.slice(0, 10)); });
  const [search, setSearch] = useState('');
  const [showCancelled, setShowCancelled] = useState(true);
  const directory = useStaffDirectory(allowed);
  const days = calendarDays(month + '-01');
  const weeks = mondayWeeks(days);
  const inMonth = (day: string) => day.slice(0, 7) === month;
  const visibleDays = weeks[week] ?? [];
  const query = useStaffQuery(['ward-shifts', month], async signal => {
    // API groups by UTC month. Vietnam's first seven hours belong to the previous UTC month.
    const first = new Date(dayStart(days[0]));
    const periods = [{ year: Number(month.slice(0, 4)), month: Number(month.slice(5, 7)) }];
    if (first.getUTCFullYear() >= 2000) periods.push({ year: first.getUTCFullYear(), month: first.getUTCMonth() + 1 });
    const results = await Promise.all(periods.map(p => staffingApi.wardShifts(p.year, p.month, signal)));
    const unique = new Map<string, Shift>();
    for (const groups of results) for (const group of groups) for (const shift of group.shifts) {
      if (group.officerId !== shift.officerId || !Number.isFinite(Date.parse(shift.startsAtUtc)) || !Number.isFinite(Date.parse(shift.endsAtUtc)) || Date.parse(shift.endsAtUtc) <= Date.parse(shift.startsAtUtc)) throw new Error('Dữ liệu ca làm không hợp lệ. Vui lòng tải lại.');
      unique.set(shift.id, shift);
    }
    const end = dayStart(days.at(-1)!) + 86400000;
    return [...unique.values()].filter(s => Date.parse(s.startsAtUtc) < end && Date.parse(s.endsAtUtc) > dayStart(days[0])).sort((a, b) => Date.parse(a.startsAtUtc) - Date.parse(b.startsAtUtc));
  }, allowed);
  if (!allowed) return <p role="alert">Bạn cần quyền quản lý lịch để xem lịch toàn phường.</p>;

  const shifts = (query.data ?? []).filter(s => showCancelled || !s.cancelledAtUtc);
  // Roster = active Frontdesk officers, same rule as "Sắp xếp lịch tháng" and the officer list.
  const officers = new Map((directory.data ?? []).filter(o => o.isActive && o.roles.includes('FRONT_DESK_OFFICER') && !o.roles.includes('MANAGER')).map(o => [o.id, { id: o.id, name: o.fullName || o.username, active: true }]));
  // Shifts left behind by accounts that were deleted, locked, re-roled or moved ward are hidden.
  // Only when the directory failed to load do we fall back to rows keyed by officer id.
  if (!directory.isSuccess) for (const s of shifts) if (!officers.has(s.officerId)) officers.set(s.officerId, { id: s.officerId, name: `Cán bộ ${s.officerId}`, active: true });
  const rows = [...officers.values()].filter(o => `${o.name} ${o.id}`.toLocaleLowerCase('vi').includes(search.trim().toLocaleLowerCase('vi'))).sort((a, b) => a.name.localeCompare(b.name, 'vi'));
  const changeMonth = (value: string) => { setMonth(value); setWeek(0); };
  const ready = query.isSuccess;

  return <div className="ward-schedule space-y-4">
    <div className="staff-filter ward-schedule-filter"><div className="schedule-controls">
      <label className="staff-field">Tháng lịch toàn phường<select className={fieldClass} value={month.slice(5, 7)} onChange={e => changeMonth(month.slice(0, 5) + e.target.value)}>{Array.from({ length: 12 }, (_, i) => <option key={i} value={String(i + 1).padStart(2, '0')}>Tháng {i + 1}</option>)}</select></label>
      <label className="staff-field">Năm lịch toàn phường<select className={fieldClass} value={month.slice(0, 4)} onChange={e => changeMonth(e.target.value + month.slice(4))}>{scheduleYears(month).map(y => <option key={y} value={y}>{y}</option>)}</select></label>
      <label className="staff-field ward-schedule-search">Tìm cán bộ<span><MagnifyingGlass size={17} aria-hidden="true" /><input type="search" className={fieldClass} value={search} onChange={e => setSearch(e.target.value)} placeholder="Tên hoặc mã cán bộ" /></span></label>
      <RefreshButton label="Làm mới lịch toàn phường" loading={query.isFetching || directory.isFetching} onClick={() => { void query.refetch(); void directory.refetch(); }} />
    </div><div className="ward-schedule-filter-note"><p>Lịch chính thức · Xếp hoặc sửa ca tại <strong>Sắp xếp lịch tháng</strong>.</p><label className="inline-flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={showCancelled} onChange={e => setShowCancelled(e.target.checked)} />Hiện ca đã hủy</label></div>
    </div>
    <QueryState query={directory} /><QueryState query={query} />
    {directory.isError && <p className="text-sm text-amber-800">Chưa tải được tên cán bộ. Lịch vẫn hiển thị theo mã cán bộ có ca.</p>}
    {ready && <section className="ward-roster" aria-label="Lịch làm việc toàn phường">
      <div className="ward-roster-toolbar"><div><h3>Lịch làm việc cán bộ Một cửa</h3><p>{rows.length} cán bộ · Tháng {Number(month.slice(5, 7))}/{month.slice(0, 4)} · Tuần {week + 1}/{weeks.length}</p></div><div className="ward-roster-navigation">
        <Button variant="outline" aria-label="Tuần trước" disabled={week === 0} onClick={() => setWeek(w => w - 1)}><CaretLeft aria-hidden="true" /></Button>
        <span className="ward-roster-period" aria-live="polite"><CalendarBlank size={18} aria-hidden="true" />{calendarDate(visibleDays[0])} – {calendarDate(visibleDays.at(-1)!)}</span>
        <Button variant="outline" aria-label="Tuần sau" disabled={week + 1 >= weeks.length} onClick={() => setWeek(w => w + 1)}><CaretRight aria-hidden="true" /></Button>
      </div></div>
      <div className="ward-roster-scroll" role="region" aria-label="Bảng lịch cán bộ, cuộn ngang để xem các ngày" tabIndex={0}><table className="ward-roster-table">
        <caption className="sr-only">Ca làm chính thức của cán bộ từ {calendarDate(visibleDays[0])} đến {calendarDate(visibleDays.at(-1)!)}, giờ Việt Nam</caption>
        <thead><tr><th scope="col">Cán bộ Một cửa</th>{visibleDays.map(day => <th scope="col" key={day} className={day === scheduleDay(new Date().toISOString()) ? 'ward-roster-today-heading' : !inMonth(day) ? 'ward-roster-outside' : undefined}><span>{weekday.format(new Date(dayStart(day)))}</span><strong>{day.slice(8)}/{day.slice(5, 7)}</strong>{day === scheduleDay(new Date().toISOString()) && <small>Hôm nay</small>}</th>)}</tr></thead>
        <tbody>{rows.map(o => {
          const visible = shifts.filter(s => s.officerId === o.id && Date.parse(s.startsAtUtc) < dayStart(visibleDays.at(-1)!) + 86400000 && Date.parse(s.endsAtUtc) > dayStart(visibleDays[0]));
          return <tr key={o.id}><th scope="row"><div className="ward-roster-person"><span className="ward-roster-avatar" aria-hidden="true">{getInitials(o.name)}</span><div><strong>{o.name}</strong><span>{visible.filter(s => !s.cancelledAtUtc).length} ca trong tuần{o.active ? '' : ' · Ngừng hoạt động'}</span></div></div></th>{visibleDays.map(day => !inMonth(day) ? <td key={day} className="ward-roster-outside"><span className="ward-roster-empty"><span aria-hidden="true">·</span><span className="sr-only">Ngoài tháng đang xem</span></span></td> : <td key={day} className={day === scheduleDay(new Date().toISOString()) ? 'ward-roster-today' : undefined}>{visible.filter(s => Date.parse(s.startsAtUtc) < dayStart(day) + 86400000 && Date.parse(s.endsAtUtc) > dayStart(day)).map(s => <div key={s.id} className={`ward-shift ${s.cancelledAtUtc ? 'ward-shift-cancelled' : Number(scheduleTime(s.startsAtUtc).slice(0, 2)) < 12 ? 'ward-shift-morning' : 'ward-shift-afternoon'}`}>
            <strong>{scheduleTime(s.startsAtUtc)}–{scheduleTime(s.endsAtUtc)}</strong><span>{s.cancelledAtUtc ? 'Đã hủy' : Number(scheduleTime(s.startsAtUtc).slice(0, 2)) < 12 ? 'Bắt đầu trước 12:00' : 'Bắt đầu từ 12:00'}</span>
            {scheduleDay(s.startsAtUtc) !== day && <small>Từ {calendarDate(scheduleDay(s.startsAtUtc))}</small>}
            {scheduleDay(s.endsAtUtc) !== day && <small>Đến {calendarDate(scheduleDay(s.endsAtUtc))}</small>}
            {s.cancelledAtUtc && s.cancellationReason && <small>{s.cancellationReason}</small>}
          </div>)}{!visible.some(s => Date.parse(s.startsAtUtc) < dayStart(day) + 86400000 && Date.parse(s.endsAtUtc) > dayStart(day)) && <span className="ward-roster-empty"><span aria-hidden="true">—</span><span className="sr-only">Chưa có ca</span></span>}</td>)}</tr>;
        })}</tbody>
      </table></div>
      {!rows.length && <p className="staff-state">{search ? 'Không tìm thấy cán bộ phù hợp.' : 'Chưa có cán bộ hoặc ca làm trong tháng này.'}</p>}
      <div className="ward-roster-legend"><span><i className="bg-teal-600" />Ca bắt đầu trước 12:00</span><span><i className="bg-violet-600" />Ca bắt đầu từ 12:00</span><span><i className="bg-slate-400" />Ca đã hủy</span><span>— Chưa có ca</span></div>
    </section>}
  </div>;
}
