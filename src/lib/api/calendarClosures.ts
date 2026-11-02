import { z } from 'zod';
import { api } from './index';
import { servicePath, serviceUrls } from './serviceUrls';
import { validClosureDate, validClosureRange } from '@/lib/calendarRules';

const date = z.iso.date({ error: 'Vui lòng chọn ngày hợp lệ.' });
const timestamp = z.iso.datetime();
export const closureSchema = z.object({
  id: z.string().uuid(), wardCode: z.string().nullable(), date,
  effectiveFromUtc: timestamp, reason: z.string(), createdBy: z.string().uuid(), createdAtUtc: timestamp,
  cancelled: z.boolean(), cancelledBy: z.string().uuid().nullable(),
  cancelledAtUtc: timestamp.nullable(), cancellationReason: z.string().nullable(),
});
const changeSchema = z.object({ closure: closureSchema, rescheduledApplications: z.number().int().nonnegative() });
export const closureReasonSchema = z.string().trim().min(1, 'Vui lòng nhập lý do.').max(500, 'Lý do tối đa 500 ký tự.');
export const closureInputSchema = z.object({
  date: date.refine(value => validClosureDate(value), 'Chọn ngày từ hôm nay đến 366 ngày tiếp theo (giờ Việt Nam).'),
  reason: closureReasonSchema,
});
export type CalendarClosure = z.infer<typeof closureSchema>;
export type ClosureChange = z.infer<typeof changeSchema>;
const root = '/api/v1/staffing/closures';
const path = (suffix = '') => servicePath(serviceUrls.workflow, root + suffix);

export const calendarClosuresApi = {
  async list(from: string, to: string, signal?: AbortSignal): Promise<CalendarClosure[]> {
    if (!validClosureRange(from, to)) throw new Error('Chọn khoảng ngày tăng dần, tối đa 400 ngày gồm cả hai đầu.');
    const rows = z.array(closureSchema).parse((await api.get(path(), { params: { from, to }, signal })).data);
    return z.array(closureSchema).refine(items => items.every(item => item.date >= from && item.date <= to) &&
      new Set(items.map(item => item.id)).size === items.length, 'Lịch trả về không khớp khoảng ngày.').parse(rows);
  },
  async create(input: z.input<typeof closureInputSchema>, national: boolean): Promise<ClosureChange> {
    const body = closureInputSchema.parse(input);
    const result = changeSchema.parse((await api.post(path(national ? '/national' : ''), body)).data);
    return changeSchema.refine(value => value.closure.date === body.date && !value.closure.cancelled &&
      (national ? value.closure.wardCode === null : value.closure.wardCode !== null), 'Ngày nghỉ trả về không khớp thao tác.').parse(result);
  },
  async cancel(id: string, reason: string): Promise<ClosureChange> {
    z.string().uuid().parse(id);
    const result = changeSchema.parse((await api.post(path(`/${id}/cancel`), { reason: closureReasonSchema.parse(reason) })).data);
    return changeSchema.refine(value => value.closure.id === id && value.closure.cancelled, 'Kết quả hủy không khớp ngày nghỉ.').parse(result);
  },
};
