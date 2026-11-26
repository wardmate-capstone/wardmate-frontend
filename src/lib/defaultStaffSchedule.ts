import type { ScheduleSlot } from '@/lib/api/workSchedules';
import { calendarDays, scheduleDay } from '@/lib/scheduleCalendar';
import { vietnamIso } from '@/lib/staffingValidation';

// Giờ đi làm mặc định của cán bộ Một cửa: Thứ Hai–Thứ Sáu 07:30–17:00, không làm Thứ Bảy.
// Cố ý KHÁC khung tính hạn tiền kiểm của BE (WF-05: 45 giờ, 07:30–16:30, cấu hình ReviewDeadline ở Workflow).
// BE không đọc lịch ca khi tính hạn, nên đổi giờ ở đây không làm thay đổi hạn hồ sơ. Không sửa cho "khớp" hai bên.
export const defaultWorkingHours = 'Thứ Hai–Thứ Sáu: 07:30–17:00.';
const DEFAULT_HOURS: [string, string][] = [['07:30', '17:00']];

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
    if (!weekday || weekday === 6 || closed.has(day)) continue;
    const hours = DEFAULT_HOURS;
    for (const officerId of new Set(officerIds)) {
      if (occupied.has(`${officerId}:${day}`)) continue;
      for (const [start, end] of hours) {
        const startsAt = vietnamIso(`${day}T${start}`), endsAt = vietnamIso(`${day}T${end}`);
        if (Date.parse(startsAt) <= now) continue;
        if (options.carry?.some(slot => slot.officerId === officerId && Date.parse(slot.startsAt) < Date.parse(endsAt) && Date.parse(slot.endsAt) > Date.parse(startsAt))) continue;
        // Ca liền 07:30–17:00: nghỉ phép nửa buổi chỉ cắt phần trùng, giữ phần còn lại (tối thiểu 1 giờ).
        let segments: [number, number][] = [[Date.parse(startsAt), Date.parse(endsAt)]];
        for (const leave of leaves.filter(row => row.officerId === officerId)) {
          const ls = Date.parse(leave.startsAtUtc), le = Date.parse(leave.endsAtUtc);
          segments = segments.flatMap(([s, e]): [number, number][] => ls >= e || le <= s ? [[s, e]] : [[s, Math.min(ls, e)], [Math.max(le, s), e]]);
        }
        for (const [s, e] of segments.filter(([s, e]) => e - s >= 3_600_000)) {
          result.push({ shiftId: crypto.randomUUID(), officerId, startsAt: new Date(s).toISOString(), endsAt: new Date(e).toISOString(), shiftVersion: 0 });
        }
      }
    }
  }
  if (current.length + result.length > 500) throw new Error('Lịch mặc định vượt giới hạn 500 ca/tháng của hệ thống. Chưa điền thêm ca; cần nhờ bộ phận kỹ thuật nâng giới hạn trước khi áp dụng cho toàn bộ cán bộ.');
  return result;
}
