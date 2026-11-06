import { z } from 'zod';
import { validCalendarDate } from './calendarRules';

type FormField = { name: string; type?: string; max?: number; options?: readonly { value: string; disabled?: boolean }[] };

export function staffingFormSchema(fields: readonly FormField[]) {
  return z.object(Object.fromEntries(fields.map(field => [field.name,
    z.string().trim().min(1, 'Vui lòng nhập thông tin.').max(field.max ?? 2000, `Tối đa ${field.max ?? 2000} ký tự.`)
      .refine(value => field.type !== 'select' || Boolean(field.options?.some(option => option.value === value && !option.disabled)),
        'Lựa chọn không còn hợp lệ. Vui lòng chọn lại từ danh sách hiện tại.'),
  ])));
}

function vietnamDateTime(value: string): number {
  const match = /^(\d{4}-\d{2}-\d{2})T(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d{1,3})?)?$/.exec(value);
  return match && validCalendarDate(match[1]) ? Date.parse(`${value}+07:00`) : NaN;
}

export function vietnamIso(value: string): string {
  const timestamp = vietnamDateTime(value);
  if (!Number.isFinite(timestamp)) throw new Error('Ngày giờ không hợp lệ. Vui lòng chọn lại theo giờ Việt Nam.');
  return new Date(timestamp).toISOString();
}
export function vietnamLocal(value: string): string {
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? new Date(timestamp + 7 * 3600000).toISOString().slice(0, 16) : '';
}
export const leaveMetadataSchema = z.object({ startsAt: z.string(), endsAt: z.string(), reason: z.string().trim().min(1, 'Vui lòng nhập lý do.').max(2000, 'Lý do tối đa 2.000 ký tự.') })
  .superRefine((v, ctx) => { const issue = validatePeriod(v); if (issue) ctx.addIssue({ code: 'custom', path: ['endsAt'], message: issue }); });
export function validStaffingRange(from: string, to: string): boolean {
  return validCalendarDate(from) && validCalendarDate(to) && to >= from &&
    Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`) <= 92 * 86400000;
}

export function validatePeriod(values: Record<string, string>, shift = false, now = Date.now()): string | undefined {
  const start = vietnamDateTime(values.startsAt), end = vietnamDateTime(values.endsAt);
  if (!Number.isFinite(start) || !Number.isFinite(end)) return 'Ngày giờ không hợp lệ. Vui lòng chọn lại theo giờ Việt Nam.';
  if (end <= start) return 'Thời gian kết thúc phải sau thời gian bắt đầu.';
  if (end - start > (shift ? 1 : 93) * 86400000) return shift ? 'Ca làm tối đa 24 giờ.' : 'Khoảng nghỉ tối đa 93 ngày.';
  if (shift ? start < now : end <= now) return shift ? 'Ca làm phải bắt đầu trong tương lai.' : 'Khoảng nghỉ chưa được kết thúc.';
}
