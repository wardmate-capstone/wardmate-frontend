import axios from 'axios';
import { z } from 'zod';
import { api } from './index';
import { servicePath, serviceUrls } from './serviceUrls';

export function vietnamToday() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}
// .NET Guid is not restricted to RFC UUID version/variant bits.
export const guidSchema = z.guid('ID phải là GUID hợp lệ.').refine(value => value !== '00000000-0000-0000-0000-000000000000', 'ID không được rỗng.');
const date = z.iso.date('Ngày không hợp lệ.');
export const dateRangeSchema = z.object({ from: date, to: date }).superRefine((value, ctx) => {
  if (value.from < '2000-01-01') ctx.addIssue({ code: 'custom', path: ['from'], message: 'Chọn ngày từ 01/01/2000.' });
  if (value.from > value.to) ctx.addIssue({ code: 'custom', path: ['to'], message: 'Ngày kết thúc phải từ ngày bắt đầu.' });
  if (value.to > vietnamToday()) ctx.addIssue({ code: 'custom', path: ['to'], message: 'Không chọn ngày trong tương lai.' });
  if ((Date.parse(value.to) - Date.parse(value.from)) / 86400000 >= 366) ctx.addIssue({ code: 'custom', path: ['to'], message: 'Chỉ chọn tối đa 366 ngày.' });
});
export const analyticsQuerySchema = dateRangeSchema.safeExtend({ procedureId: guidSchema.optional(), page: z.number().int().min(1).max(100000), pageSize: z.number().int().min(1).max(100) });
export type AnalyticsQuery = z.infer<typeof analyticsQuerySchema>;
export function initialAnalyticsQuery(): AnalyticsQuery {
  const to = vietnamToday();
  return { from: to.slice(0, 7) + '-01', to, page: 1, pageSize: 20 };
}
const count = z.number().int().nonnegative();
const rate = z.number().min(0).max(100).nullable();
const timestamp = z.iso.datetime({ offset: true });
export const totalsSchema = z.object({ receivedCount: count, readyCount: count, revisionRequestedCount: count, resubmittedCount: count, cancelledCount: count, legacyApprovedCount: count, legacyRejectedCount: count });
export const coverageSchema = z.object({ from: date, to: date, missingDates: z.array(date), oldestSourceAtUtc: timestamp.nullable(), latestRefreshAtUtc: timestamp.nullable(), timeZone: z.string() }).superRefine((value, ctx) => {
  if (value.from > value.to || value.missingDates.some(day => day < value.from || day > value.to) || new Set(value.missingDates).size !== value.missingDates.length) {
    ctx.addIssue({ code: 'custom', message: 'Khoảng ngày thiếu dữ liệu không hợp lệ.' });
  }
});
export const deadlinesSchema = z.object({ completedOnTime: count, completedLate: count, completedMissingDeadline: count, completedNotApplicable: count, completedSampleCount: count, openOverdue: count, openMissingDeadline: count, openNotApplicable: count, openPaused: count, asOfUtc: timestamp, onTimeRate: rate, lateRate: rate });
export const overviewSchema = z.object({ totals: totalsSchema, coverage: coverageSchema, onTimeRate: rate, lateRate: rate, timelinessStatus: z.string(), deadlines: deadlinesSchema.nullish() });
export const trendsSchema = z.object({ items: z.array(z.object({ date, totals: totalsSchema, deadlines: deadlinesSchema.nullish() })), coverage: coverageSchema, currentBacklog: deadlinesSchema.nullish() });
const procedureSchema = z.object({ procedureId: guidSchema, totals: totalsSchema, deadlines: deadlinesSchema.nullish() });
const officerSchema = z.object({ officerId: guidSchema, readyCount: count, revisionRequestedCount: count, durationSampleCount: count, averageElapsedMinutes: z.number().nonnegative().nullable(), deadlines: deadlinesSchema.nullish() });
export const feedbackInputSchema = z.object({ rating: z.number().int().min(1, 'Chọn từ 1 đến 5 sao.').max(5), comment: z.string().max(2000, 'Góp ý tối đa 2.000 ký tự.').transform(value => value.trim()) });
export type FeedbackInput = z.infer<typeof feedbackInputSchema>;
export const feedbackSchema = z.object({ id: guidSchema, applicationId: guidSchema, rating: z.number().int().min(1).max(5), comment: z.string().nullable(), createdAtUtc: timestamp });
export const feedbackSummarySchema = z.object({ totalCount: count, averageRating: z.number().min(1).max(5).nullable(), satisfactionRate: rate, ratingCounts: z.object({ '1': count, '2': count, '3': count, '4': count, '5': count }) });
function pageSchema<T extends z.ZodType>(item: T) {
  return z.object({ items: z.array(item), page: z.number().int().min(1).max(100000), pageSize: z.number().int().min(1).max(100), totalCount: count, coverage: coverageSchema.nullish(), unassignedDeadlines: deadlinesSchema.nullish() });
}
export const jobIdSchema = z.string().regex(/^[0-9]{1,30}$/, 'Mã job gồm 1–30 chữ số.');
export const jobSchema = z.object({ jobId: jobIdSchema, state: z.string().min(1), createdAtUtc: timestamp });
const path = (route: string) => servicePath(serviceUrls.analytics, '/api/v1/' + route);
async function read<T extends z.ZodType>(route: string, schema: T, query: AnalyticsQuery, signal?: AbortSignal): Promise<z.infer<T>> {
  const params = analyticsQuerySchema.parse(query);
  const data = (await api.get(path('analytics/' + route), { params, signal })).data;
  const parsed = schema.parse(data);
  // Reject a structurally valid response belonging to another period/page.
  if (data.coverage && (data.coverage.from !== params.from || data.coverage.to !== params.to)) {
    throw new Error('Kỳ thống kê trả về không khớp bộ lọc. Vui lòng tải lại.');
  }
  if ('page' in data && (data.page !== params.page || data.pageSize !== params.pageSize || data.items.length > params.pageSize || data.items.length > data.totalCount)) {
    throw new Error('Trang thống kê trả về không khớp yêu cầu. Vui lòng tải lại.');
  }
  if (route === 'trends') {
    const dates = data.items.map((item: { date: string }) => item.date);
    const expectedCount = (Date.parse(params.to) - Date.parse(params.from)) / 86400000 + 1;
    if (dates.length !== expectedCount || new Set(dates).size !== dates.length || dates.some((day: string) => day < params.from || day > params.to)) {
      throw new Error('Dữ liệu xu hướng thiếu hoặc trùng ngày. Vui lòng tải lại.');
    }
  }
  return parsed;
}
function checkFeedback(data: unknown, id: string) {
  const result = feedbackSchema.parse(data);
  if (result.applicationId.toLowerCase() !== id.toLowerCase()) throw new Error('Đánh giá trả về không khớp hồ sơ.');
  return result;
}
export const analyticsApi = {
  overview: (q: AnalyticsQuery, signal?: AbortSignal) => read('overview', overviewSchema, q, signal),
  trends: (q: AnalyticsQuery, signal?: AbortSignal) => read('trends', trendsSchema, q, signal),
  procedures: (q: AnalyticsQuery, signal?: AbortSignal) => read('procedures', pageSchema(procedureSchema), q, signal),
  officers: (q: AnalyticsQuery, signal?: AbortSignal) => read('officers', pageSchema(officerSchema), q, signal),
  summary: (q: AnalyticsQuery, signal?: AbortSignal) => read('feedback/summary', feedbackSummarySchema, q, signal),
  feedback: (q: AnalyticsQuery, signal?: AbortSignal) => read('feedback', pageSchema(feedbackSchema), q, signal),
  getFeedback: async (id: string, signal?: AbortSignal) => {
    guidSchema.parse(id);
    try { return checkFeedback((await api.get(path(`citizen/feedback/${id}`), { signal })).data, id); }
    catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404 && error.response.data?.code === 'feedback.not_found') return null;
      throw error;
    }
  },
  createFeedback: async (id: string, input: FeedbackInput) => {
    guidSchema.parse(id);
    const response = await api.post(path(`citizen/feedback/${id}`), feedbackInputSchema.parse(input));
    if (response.status !== 201) throw new Error('Chưa xác nhận được đánh giá đã lưu. Hãy tải lại trước khi thử gửi tiếp.');
    return checkFeedback(response.data, id);
  },
  rebuild: async (input: z.infer<typeof dateRangeSchema>) => {
    const response = await api.post(path('analytics/jobs/rebuild'), dateRangeSchema.parse(input));
    if (response.status !== 202) throw new Error('Chưa xác nhận được job đã xếp lịch. Không tự gửi lại; hãy kiểm tra mã job.');
    return z.object({ jobId: jobIdSchema }).parse(response.data);
  },
  job: async (id: string, signal?: AbortSignal) => {
    const result = jobSchema.parse((await api.get(path(`analytics/jobs/${jobIdSchema.parse(id)}`), { signal })).data);
    if (result.jobId !== id) throw new Error('Mã job trả về không khớp.');
    return result;
  },
};
export function analyticsError(error: unknown): string {
  if (error instanceof z.ZodError) return 'Dữ liệu không đúng định dạng hoặc giới hạn cho phép. Vui lòng kiểm tra và tải lại.';
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    return typeof data?.detail === 'string' ? data.detail : typeof data?.title === 'string' ? data.title : 'Chưa kết nối được dịch vụ thống kê. Vui lòng thử lại.';
  }
  return error instanceof Error ? error.message : 'Chưa thực hiện được thao tác.';
}
export function applyAnalyticsFieldErrors(error: unknown, setError: (field: string, message: string) => void) {
  if (!axios.isAxiosError(error)) return;
  const errors = error.response?.data?.errors;
  if (!errors || typeof errors !== 'object') return;
  for (const [key, value] of Object.entries(errors)) {
    const field = key.split('.').pop()?.toLowerCase();
    if (field && ['from', 'to', 'rating', 'comment'].includes(field)) setError(field, Array.isArray(value) ? value.join(' ') : String(value));
  }
}
