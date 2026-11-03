import { z } from 'zod';
import { api } from './index';
import { servicePath, serviceUrls } from './serviceUrls';
import { auditParams, dateInput, emptyAuditFilters } from './systemAdministration';

const guid = z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, 'Mã định danh không hợp lệ.');
const timestamp = z.string().datetime({ offset: true });
const safeCount = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
export const serviceNameSchema = z.string().trim().min(1, 'Nhập mã dịch vụ.').max(64, 'Mã dịch vụ tối đa 64 ký tự.');
export const backupStates = { Queued: 'Chờ xử lý', Running: 'Đang sao lưu', Succeeded: 'Đã sao lưu', Failed: 'Thất bại', Verified: 'Máy chủ ghi nhận đã xác minh' } as const;
export const healthStates = { Healthy: 'Hoạt động tốt', Degraded: 'Cần theo dõi', Unhealthy: 'Gặp sự cố', Unknown: 'Chưa xác định' } as const;
export const operationsFilterSchema = z.object({
  service: z.string().trim().max(64, 'Mã dịch vụ tối đa 64 ký tự.'), from: dateInput, to: dateInput,
  status: z.union([z.literal(''), z.enum(['Queued', 'Running', 'Succeeded', 'Failed', 'Verified'])]),
}).refine(value => !value.from || !value.to || value.from <= value.to, { path: ['to'], message: 'Ngày kết thúc phải từ ngày bắt đầu trở đi.' });
export type OperationsFilters = z.infer<typeof operationsFilterSchema>;
export const emptyOperationsFilters: OperationsFilters = { service: '', from: '', to: '', status: '' };
export type OperationsQuery = OperationsFilters & { page: number; pageSize: number };
export const createBackupSchema = z.object({ serviceName: serviceNameSchema, reason: z.string().trim().min(3, 'Lý do cần ít nhất 3 ký tự.').max(500, 'Lý do tối đa 500 ký tự.') });
export type CreateBackup = z.infer<typeof createBackupSchema>;
export const healthSchema = z.object({
  id: guid, serviceName: serviceNameSchema, status: z.string().min(1), httpStatus: z.number().int().min(100).max(599).nullable(),
  responseTimeMs: safeCount, errorCode: z.string().nullable(), checkedAtUtc: timestamp,
});
export type HealthObservation = z.infer<typeof healthSchema>;
export const backupSchema = z.object({
  id: guid, serviceName: serviceNameSchema, status: z.string().min(1), sizeBytes: safeCount.nullable(),
  sha256: z.string().regex(/^[0-9a-f]{64}$/i).nullable(), requestedBy: guid.nullable(), reason: z.string(),
  createdAtUtc: timestamp, startedAtUtc: timestamp.nullable(), completedAtUtc: timestamp.nullable(),
  verifiedAtUtc: timestamp.nullable(), restoreTestedAtUtc: timestamp.nullable(), errorCode: z.string().nullable(),
});
export type Backup = z.infer<typeof backupSchema>;
const path = (route: string) => servicePath(serviceUrls.analytics, '/api/v1/system/' + route);
function params(query: OperationsQuery, backup: boolean) {
  const filters = operationsFilterSchema.parse(query);
  return { ...auditParams({ ...emptyAuditFilters, ...query }, false), ...(filters.service ? { service: filters.service } : {}), ...(backup && filters.status ? { status: filters.status } : {}) };
}
async function list<T extends z.ZodType>(route: string, schema: T, query: OperationsQuery, backup: boolean, signal?: AbortSignal) {
  const filters = params(query, backup);
  const result = z.object({ items: z.array(schema), page: z.number().int().positive(), pageSize: z.number().int().positive(), totalCount: safeCount }).parse((await api.get(path(route), { params: filters, signal })).data);
  if (result.page !== query.page || result.pageSize !== query.pageSize || result.items.length > query.pageSize
    || result.items.length > Math.max(0, result.totalCount - (query.page - 1) * query.pageSize)) throw new Error('Trang dữ liệu trả về không khớp yêu cầu. Vui lòng tải lại.');
  return result;
}
export const systemOperationsApi = {
  services: async (signal?: AbortSignal) => {
    const result = z.array(healthSchema).parse((await api.get(path('health/services'), { signal })).data);
    if (new Set(result.map(item => item.serviceName)).size !== result.length) throw new Error('Danh sách dịch vụ bị trùng. Vui lòng tải lại.');
    return result;
  },
  service: async (service: string, signal?: AbortSignal) => {
    const name = serviceNameSchema.parse(service);
    const result = healthSchema.parse((await api.get(path('health/services/' + encodeURIComponent(name)), { signal })).data);
    if (result.serviceName !== name) throw new Error('Kết quả trả về không đúng dịch vụ đã chọn.');
    return result;
  },
  checkNow: async () => {
    const response = await api.post(path('health/check-now'));
    if (response.status !== 202) throw new Error('Chưa xác nhận được yêu cầu đã xếp hàng. Kiểm tra lại trạng thái trước khi gửi tiếp.');
    return z.object({ requestId: guid, status: z.literal('Queued') }).parse(response.data);
  },
  history: (query: OperationsQuery, signal?: AbortSignal) => list('health/history', healthSchema, query, false, signal),
  backups: (query: OperationsQuery, signal?: AbortSignal) => list('backups', backupSchema, query, true, signal),
  backup: async (id: string, signal?: AbortSignal) => {
    guid.parse(id);
    const result = backupSchema.parse((await api.get(path('backups/' + encodeURIComponent(id)), { signal })).data);
    if (result.id !== id) throw new Error('Bản sao lưu trả về không đúng mục đã chọn.');
    return result;
  },
  create: async (input: CreateBackup) => {
    const request = createBackupSchema.parse(input);
    const response = await api.post(path('backups'), request);
    if (response.status !== 202) throw new Error('Chưa xác nhận được yêu cầu sao lưu đã xếp hàng. Kiểm tra danh sách trước khi gửi lại.');
    const result = backupSchema.parse(response.data);
    if (result.serviceName !== request.serviceName || result.status !== 'Queued') throw new Error('Kết quả xếp hàng sao lưu không khớp. Kiểm tra danh sách trước khi gửi lại.');
    return result;
  },
  verify: async (id: string) => {
    guid.parse(id);
    const response = await api.post(path('backups/' + encodeURIComponent(id) + '/verify'));
    if (response.status !== 200) throw new Error('Chưa xác nhận được kết quả kiểm tra. Vui lòng tải lại bản sao lưu.');
    const result = backupSchema.parse(response.data);
    if (result.id !== id || result.status !== 'Verified' || !result.verifiedAtUtc) throw new Error('Kết quả xác minh không khớp yêu cầu. Vui lòng tải lại.');
    return result;
  },
};
