/**
 * Định dạng ngày giờ dùng chung toàn hệ thống, luôn theo giờ Việt Nam (Asia/Ho_Chi_Minh)
 * để máy người dùng đặt sai múi giờ cũng không hiển thị lệch.
 *   formatDateTime → "12/11/2026 14:30"
 *   formatDate     → "12/11/2026"
 *   formatTime     → "14:30"
 * Giá trị trống hoặc không hợp lệ trả về `fallback` (mặc định "—").
 */
const TIME_ZONE = 'Asia/Ho_Chi_Minh';

const dateParts = new Intl.DateTimeFormat('vi-VN', { timeZone: TIME_ZONE, day: '2-digit', month: '2-digit', year: 'numeric' });
const timeParts = new Intl.DateTimeFormat('vi-VN', { timeZone: TIME_ZONE, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });

type DateInput = string | number | Date | null | undefined;

function toDate(value: DateInput): Date | null {
  if (value === null || value === undefined || value === '') return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function pick(format: Intl.DateTimeFormat, date: Date, types: Intl.DateTimeFormatPartTypes[]) {
  const parts = format.formatToParts(date);
  return types.map((type) => parts.find((p) => p.type === type)?.value ?? '');
}

/** "12/11/2026" */
export function formatDate(value: DateInput, fallback = '—'): string {
  const date = toDate(value);
  if (!date) return fallback;
  const [day, month, year] = pick(dateParts, date, ['day', 'month', 'year']);
  return `${day}/${month}/${year}`;
}

/** "14:30" */
export function formatTime(value: DateInput, fallback = '—'): string {
  const date = toDate(value);
  if (!date) return fallback;
  const [hour, minute] = pick(timeParts, date, ['hour', 'minute']);
  return `${hour}:${minute}`;
}

/** "12/11/2026 14:30" */
export function formatDateTime(value: DateInput, fallback = '—'): string {
  const date = toDate(value);
  if (!date) return fallback;
  return `${formatDate(date)} ${formatTime(date)}`;
}
