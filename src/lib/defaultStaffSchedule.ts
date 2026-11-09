import type { ScheduleSlot } from '@/lib/api/workSchedules';
import { calendarDays, scheduleDay } from '@/lib/scheduleCalendar';
import { vietnamIso } from '@/lib/staffingValidation';

export const defaultWorkingHours = 'Thứ Hai–Thứ Sáu: 07:30–11:30 và 13:00–17:00. Thứ Bảy: 07:30–11:30.';

// Prepare real slots for the existing draft/publish API, never fabricate a published calendar.
export function defaultStaffSchedule(
  month: string, officerIds: string[], current: ScheduleSlot[],
  leaves: { officerId: string; startsAtUtc: string; endsAtUtc: string }[],
  closures: { closureDate: string }[],
  options: { now?: number; editedDays?: { officerId: string; day: string }[]; carry?: ScheduleSlot[] } = {},
): ScheduleSlot[] {
  const now = options.now ?? Date.now();
  const occupied = new Set(current.map(slot => `${slot.officerId}:${scheduleDay(slot.startsAt)}`));
  options.editedDays?.forEach(row => occupied.add(`${row.officerId}:${row.day}`));
  const closed = new Set(closures.map(row => row.closureDate));
  const result: ScheduleSlot[] = [];
  for (const day of calendarDays(month)) {
    const weekday = new Date(`${day}T12:00:00Z`).getUTCDay();
    if (!weekday || closed.has(day)) continue;
    const hours = weekday === 6 ? [['07:30', '11:30']] : [['07:30', '11:30'], ['13:00', '17:00']];
    for (const officerId of new Set(officerIds)) {
      if (occupied.has(`${officerId}:${day}`)) continue;
      for (const [start, end] of hours) {
        const startsAt = vietnamIso(`${day}T${start}`), endsAt = vietnamIso(`${day}T${end}`);
        if (Date.parse(startsAt) <= now || leaves.some(leave => leave.officerId === officerId && Date.parse(leave.startsAtUtc) < Date.parse(endsAt) && Date.parse(leave.endsAtUtc) > Date.parse(startsAt))) continue;
        if (options.carry?.some(slot => slot.officerId === officerId && Date.parse(slot.startsAt) < Date.parse(endsAt) && Date.parse(slot.endsAt) > Date.parse(startsAt))) continue;
        result.push({ shiftId: crypto.randomUUID(), officerId, startsAt, endsAt, shiftVersion: 0 });
      }
    }
  }
  if (current.length + result.length > 500) throw new Error('Lịch mặc định vượt giới hạn 500 ca/tháng của hệ thống. Chưa điền thêm ca; cần điều chỉnh giới hạn ở backend trước khi áp dụng cho toàn bộ cán bộ.');
  return result;
}
