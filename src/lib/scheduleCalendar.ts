import type { ScheduleDayOff, ScheduleSlot } from './api/workSchedules';
import { vietnamLocal } from './staffingValidation';

export const scheduleDay = (value: string) => vietnamLocal(value).slice(0, 10);
export const scheduleTime = (value: string) => new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(value));
export const calendarDate = (value: string) => value.split('-').reverse().join('/');
export const sameDaysOff = (a: ScheduleDayOff[], b: ScheduleDayOff[]) => JSON.stringify(a.map(d => `${d.officerId}:${d.date}`).sort()) === JSON.stringify(b.map(d => `${d.officerId}:${d.date}`).sort());
export function calendarDays(month: string) {
  const year = Number(month.slice(0, 4)), index = Number(month.slice(5, 7)) - 1;
  return Array.from({ length: new Date(Date.UTC(year, index + 1, 0)).getUTCDate() }, (_, i) => `${month.slice(0, 7)}-${String(i + 1).padStart(2, '0')}`);
}
export function sameSchedule(a: ScheduleSlot[], b: ScheduleSlot[]) {
  const encode = (rows: ScheduleSlot[]) => JSON.stringify(rows.map(s => [s.shiftId, s.officerId, Date.parse(s.startsAt), Date.parse(s.endsAt)]).sort((x, y) => String(x[0]).localeCompare(String(y[0]))));
  return encode(a) === encode(b);
}
/** Replace only the selected employee's days; the API still receives the complete ward schedule. */
export function replaceScheduleDays(all: ScheduleSlot[], officerId: string, changes: Map<string, ScheduleSlot[]>, now = Date.now()) {
  if (all.some(s => s.officerId === officerId && changes.has(scheduleDay(s.startsAt)) && Date.parse(s.startsAt) <= now)) throw new Error('Ngày này có ca đã bắt đầu. Lịch đã qua được giữ để xem lại.');
  return [...all.filter(s => s.officerId !== officerId || !changes.has(scheduleDay(s.startsAt))), ...Array.from(changes.values()).flat()].sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt));
}
