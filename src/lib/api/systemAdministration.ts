import axios from 'axios';
import { z } from 'zod';
import { api } from './index';
import { servicePath, serviceUrls } from './serviceUrls';

export const settingKey = 'analytics.lookbackDays';
export const auditSources = {
  iam: 'Tài khoản và phân quyền', catalog: 'Danh mục thủ tục', workflow: 'Xử lý hồ sơ',
  documentform: 'Biểu mẫu và tài liệu', aiocr: 'Trợ lý AI', analytics: 'Thống kê', notifications: 'Thông báo',
} as const;
const guid = z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, 'Nhập mã định danh GUID hợp lệ.');
const timestamp = z.string().datetime({ offset: true });
const version = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
export const settingSchema = z.object({
  key: z.literal(settingKey), value: z.number().int().min(1).max(366), version,
  updatedBy: guid.nullable(), updatedAtUtc: timestamp.nullable(),
});
export type SystemSetting = z.infer<typeof settingSchema>;
export const settingFormSchema = z.object({
  value: z.string().trim().regex(/^\d+$/, 'Nhập số nguyên từ 1 đến 366.')
    .refine(value => Number(value) >= 1 && Number(value) <= 366, 'Số ngày phải từ 1 đến 366.'),
  reason: z.string().trim().min(3, 'Lý do cần ít nhất 3 ký tự.').max(500, 'Lý do tối đa 500 ký tự.'),
});
export const updateSettingSchema = z.object({ value: settingSchema.shape.value, expectedVersion: version, reason: settingFormSchema.shape.reason });
export type SettingForm = z.infer<typeof settingFormSchema>;
export type SettingUpdate = z.infer<typeof updateSettingSchema>;

export const dateInput = z.string().refine(value => !value || /^\d{4}-\d{2}-\d{2}$/.test(value)
  && value >= '0001-01-01' && value <= '9999-12-31'
  && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value, 'Ngày không hợp lệ.');
export const auditFilterSchema = z.object({
  from: dateInput, to: dateInput,
  source: z.union([z.literal(''), z.enum(['iam', 'catalog', 'workflow', 'documentform', 'aiocr', 'analytics', 'notifications'])]),
  entity: z.string().trim().max(100, 'Thực thể tối đa 100 ký tự.'),
  actorId: z.string().trim().pipe(z.union([z.literal(''), guid])), traceId: z.string().trim().max(128, 'Mã tra cứu tối đa 128 ký tự.'),
}).refine(value => !value.from || !value.to || value.from <= value.to, { path: ['to'], message: 'Ngày kết thúc phải từ ngày bắt đầu trở đi.' });
export type AuditFilters = z.infer<typeof auditFilterSchema>;
export const emptyAuditFilters: AuditFilters = { from: '', to: '', source: '', entity: '', actorId: '', traceId: '' };
export type AuditQuery = AuditFilters & { page: number; pageSize: number };
const pagingSchema = z.object({ page: z.number().int().min(1).max(100000), pageSize: z.number().int().min(1).max(100) });

export function auditParams(query: AuditQuery, business: boolean) {
  const filters = auditFilterSchema.parse(query);
  return {
    ...pagingSchema.parse(query),
    ...(filters.from ? { from: new Date(filters.from + 'T00:00:00.000+07:00').toISOString() } : {}),
    ...(filters.to ? { to: new Date(filters.to + 'T23:59:59.999+07:00').toISOString() } : {}),
    ...(business ? Object.fromEntries(['source', 'entity', 'actorId', 'traceId'].flatMap(key => {
      const value = filters[key as keyof AuditFilters];
      return value ? [[key, value]] : [];
    })) : {}),
  };
}

export const systemAuditSchema = z.object({
  id: guid, actorId: guid, action: z.string(), entityKey: z.string(), previousValue: z.number().int().nullable(),
  newValue: z.number().int(), version, reason: z.string(), clientIp: z.string().nullable(), traceId: z.string(), occurredAtUtc: timestamp,
});
const jsonObject = z.record(z.string(), z.unknown());
export const businessAuditSchema = z.object({
  eventId: guid, source: z.string().min(1), schema: z.string(), entity: z.string(), entityKey: jsonObject,
  action: z.string().min(1), before: jsonObject, after: jsonObject, actorId: guid.nullable(),
  clientIp: z.string().nullable(), traceId: z.string().nullable(), occurredAtUtc: timestamp,
});
export type SystemAudit = z.infer<typeof systemAuditSchema>;
export type BusinessAudit = z.infer<typeof businessAuditSchema>;
const path = (route: string) => servicePath(serviceUrls.analytics, '/api/v1/system/' + route);

async function list<T extends z.ZodType>(route: string, item: T, query: AuditQuery, business: boolean, signal?: AbortSignal) {
  const params = auditParams(query, business);
  const data = z.object({ items: z.array(item), ...pagingSchema.shape, totalCount: z.number().int().nonnegative() })
    .parse((await api.get(path(route), { params, signal })).data);
  if (data.page !== params.page || data.pageSize !== params.pageSize || data.items.length > params.pageSize
    || data.items.length > Math.max(0, data.totalCount - (data.page - 1) * data.pageSize)) {
    throw new Error('Trang nhật ký trả về không khớp yêu cầu. Vui lòng tải lại.');
  }
  return data;
}
async function detail<T extends z.ZodType>(route: string, id: string, schema: T, idKey: 'id' | 'eventId', signal?: AbortSignal): Promise<z.infer<T>> {
  guid.parse(id);
  const data = schema.parse((await api.get(path(route + '/' + encodeURIComponent(id)), { signal })).data);
  if ((data as Record<string, unknown>)[idKey] !== id) throw new Error('Nhật ký trả về không khớp mục đã chọn. Vui lòng tải lại.');
  return data;
}
export const systemAdministrationApi = {
  settings: async (signal?: AbortSignal) => z.array(settingSchema).parse((await api.get(path('settings'), { signal })).data),
  setting: async (signal?: AbortSignal) => settingSchema.parse((await api.get(path('settings/' + settingKey), { signal })).data),
  update: async (input: SettingUpdate) => {
    const request = updateSettingSchema.parse(input);
    const result = settingSchema.parse((await api.put(path('settings/' + settingKey), request)).data);
    if (result.value !== request.value || result.version !== request.expectedVersion + 1) throw new Error('Kết quả lưu không khớp yêu cầu. Hãy đọc lại cấu hình và lịch sử trước khi lưu tiếp.');
    return result;
  },
  audits: (query: AuditQuery, signal?: AbortSignal) => list('audit-logs', systemAuditSchema, query, false, signal),
  audit: (id: string, signal?: AbortSignal) => detail('audit-logs', id, systemAuditSchema, 'id', signal),
  events: (query: AuditQuery, signal?: AbortSignal) => list('audit-events', businessAuditSchema, query, true, signal),
  event: (id: string, signal?: AbortSignal) => detail('audit-events', id, businessAuditSchema, 'eventId', signal),
};

export function systemErrorCode(error: unknown): string | undefined {
  return axios.isAxiosError(error) && typeof error.response?.data?.code === 'string' ? error.response.data.code : undefined;
}
export function systemError(error: unknown) {
  const messages: Record<string, string> = {
    'system.administration_disabled': 'Chức năng quản trị hệ thống chưa được bật. Vui lòng liên hệ bộ phận vận hành.',
    'system.setting_conflict': 'Cấu hình đã được người khác cập nhật. Đọc lại phiên bản mới trước khi lưu.',
    'system.invalid_setting': 'Kiểm tra số ngày, phiên bản và lý do thay đổi.',
    'system.setting_not_found': 'Không tìm thấy tham số cấu hình.',
    'system.audit_not_found': 'Không tìm thấy nhật ký cấu hình.', 'audit.not_found': 'Không tìm thấy sự kiện nhật ký.',
    'system.invalid_query': 'Kiểm tra khoảng ngày và phân trang.', 'audit.invalid_query': 'Kiểm tra các điều kiện lọc nhật ký.',
    'analytics.forbidden': 'Bạn không có quyền quản trị hệ thống.',
    'analytics.iam_unavailable': 'Chưa thể xác minh quyền truy cập. Vui lòng thử lại sau.',
    'system.health_disabled': 'Chức năng giám sát dịch vụ chưa được bật.',
    'system.service_not_found': 'Dịch vụ này chưa được cấu hình giám sát.',
    'system.backups_disabled': 'Chức năng sao lưu chưa được bật.',
    'system.backup_runner_unavailable': 'Bộ xử lý sao lưu hoặc kho lưu trữ chưa được cấu hình.',
    'system.backup_target_not_found': 'Dịch vụ này chưa được cấu hình sao lưu.',
    'system.backup_not_found': 'Không tìm thấy bản sao lưu.',
    'system.backup_in_progress': 'Đang có bản sao lưu chờ hoặc đang xử lý. Vui lòng kiểm tra lại sau.',
    'system.invalid_backup': 'Kiểm tra mã dịch vụ và lý do sao lưu (3–500 ký tự).',
    'system.invalid_status': 'Trạng thái lọc sao lưu không hợp lệ.',
    'system.backup_failed': 'Không thể xác minh bản sao lưu đã thất bại.',
    'system.backup_missing_storage': 'Bản sao lưu chưa có tệp lưu trữ để xác minh.',
    'system.backup_file_missing': 'Không tìm thấy tệp sao lưu trong kho lưu trữ.',
    'system.backup_checksum_mismatch': 'Mã kiểm tra của tệp không khớp. Cần bộ phận vận hành kiểm tra bản sao lưu.',
    'system.backup_invalid_archive': 'Tệp sao lưu không đúng định dạng được hỗ trợ.',
    'system.backup_storage_unavailable': 'Kho lưu trữ sao lưu chưa sẵn sàng. Vui lòng liên hệ bộ phận vận hành.',
    'system.backup_verification_busy': 'Máy chủ đang xác minh hoặc dọn bản sao lưu. Vui lòng thử lại sau.',
    'system.backup_size_limit': 'Kích thước bản sao lưu vượt giới hạn xác minh hoặc thiếu thông tin kích thước.',
    'system.backup_size_mismatch': 'Kích thước tệp không khớp thông tin bản sao lưu. Cần bộ phận vận hành kiểm tra.',
    'system.backup_verifier_unavailable': 'Máy chủ chưa có công cụ pg_restore để kiểm tra tệp. Vui lòng liên hệ bộ phận vận hành.',
    'system.backup_verification_timeout': 'Xác minh bị gián đoạn hoặc hết thời gian. Làm mới chi tiết trước khi thử tiếp.',
    'system.backup_verification_unavailable': 'Máy chủ chưa thể đọc hoặc xác minh tệp sao lưu. Làm mới chi tiết trước khi thử tiếp.',
  };
  const code = systemErrorCode(error);
  if (code && messages[code]) return messages[code];
  if (error instanceof z.ZodError) return 'Dữ liệu trả về không hợp lệ. Vui lòng tải lại hoặc liên hệ bộ phận vận hành.';
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 403) return 'Bạn không có quyền truy cập dữ liệu này.';
    if (error.response?.status === 401) return 'Phiên đăng nhập không còn hợp lệ. Vui lòng đăng nhập lại.';
    if (error.response?.status === 404) return 'Không tìm thấy dữ liệu được yêu cầu.';
    return 'Chưa thể hoàn tất yêu cầu. Kiểm tra kết nối và thử lại.';
  }
  return error instanceof Error ? error.message : 'Chưa thể hoàn tất yêu cầu. Vui lòng thử lại.';
}
