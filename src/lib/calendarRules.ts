// Calendar dates are Vietnam civil dates, never browser-local timestamps.
export function vietnamToday(now = new Date()): string {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' }).format(now);
}

export function validCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value.startsWith('0000-')) return false;
  const stamp = Date.parse(`${value}T00:00:00Z`);
  return Number.isFinite(stamp) && new Date(stamp).toISOString().slice(0, 10) === value;
}

export function addCalendarDays(value: string, days: number): string {
  return new Date(Date.parse(`${value}T00:00:00Z`) + days * 86400000).toISOString().slice(0, 10);
}

export function validClosureRange(from: string, to: string): boolean {
  return validCalendarDate(from) && validCalendarDate(to) && to >= from &&
    Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`) <= 399 * 86400000;
}

export function validClosureDate(date: string, today = vietnamToday()): boolean {
  return validCalendarDate(date) && date >= today && date <= addCalendarDays(today, 366);
}

export function canCancelClosure(date: string, cancelled: boolean, today = vietnamToday()): boolean {
  return !cancelled && validCalendarDate(date) && date > today;
}

export function calendarDateText(date: string): string {
  return date.split('-').reverse().join('/');
}
