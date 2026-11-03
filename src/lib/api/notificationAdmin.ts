import axios from 'axios';
import { z } from 'zod';
import { api } from './index';
import { servicePath, serviceUrls } from './serviceUrls';

const analyticsPath = (path: string) => servicePath(serviceUrls.analytics, path);
const guid = z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, 'Mã định danh không hợp lệ.');
const timestamp = z.string().datetime({ offset: true });
export const deliveryStates = { Pending: 'Đang chờ phát', Dispatching: 'Đang điều phối gửi', Sent: 'Đã gửi thành công', Sandbox: 'Gửi thử nghiệm', Blocked: 'Bị chặn', Unknown: 'Không xác định', Dead: 'Ngừng thử', Suppressed: 'Đã hủy bỏ' } as const;
export const deliveryFilterSchema = z.object({
  state: z.union([z.literal(''), z.enum(['Pending', 'Dispatching', 'Sent', 'Sandbox', 'Blocked', 'Unknown', 'Dead', 'Suppressed'])]),
  channel: z.union([z.literal(''), z.enum(['IN_APP', 'EMAIL', 'SMS'])]),
  notificationId: z.string().trim().pipe(z.union([z.literal(''), guid])),
  externalMessageId: z.string().trim().refine(value => !value || /^[A-Za-z0-9_-]{1,100}$/.test(value), 'Mã nhà cung cấp gồm tối đa 100 chữ, số, dấu gạch ngang hoặc gạch dưới.'),
});
export type DeliveryFilters = z.infer<typeof deliveryFilterSchema>;
export const emptyDeliveryFilters: DeliveryFilters = { state: '', channel: '', notificationId: '', externalMessageId: '' };
export const deliveryReplaySchema = z.object({
  reason: z.string().trim().min(5, 'Lý do cần ít nhất 5 ký tự.').max(500, 'Lý do tối đa 500 ký tự.').refine(value => !Array.from(value).some(char => char.charCodeAt(0) < 32 || char.charCodeAt(0) >= 127 && char.charCodeAt(0) <= 159), 'Lý do không được chứa ký tự điều khiển hoặc xuống dòng.'),
  acknowledgeDuplicateRisk: z.boolean().refine(value => value, 'Cần xác nhận rủi ro gửi trùng.'),
});

export const deliveryAdminDtoSchema = z.object({
  id: guid,
  notificationId: guid,
  channel: z.string(),
  state: z.string(),
  attempts: z.number().int().nonnegative(),
  nextAttemptAt: timestamp,
  errorCode: z.string().nullish(),
  sentAt: timestamp.nullish(),
  provider: z.string().nullish(),
  externalMessageId: z.string().nullish(),
  isSandbox: z.boolean().nullish(),
  revision: guid,
  updatedAt: timestamp,
  providerRequestId: z.string(),
});
export type DeliveryAdminDto = z.infer<typeof deliveryAdminDtoSchema>;

export const deliveryPageSchema = z.object({
  items: z.array(deliveryAdminDtoSchema),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  total: z.number().int().nonnegative(),
});
export type DeliveryPage = z.infer<typeof deliveryPageSchema>;

export const deliveryAuditDtoSchema = z.object({
  id: guid,
  actorId: guid,
  action: z.string(),
  beforeState: z.string(),
  afterState: z.string(),
  beforeAttempts: z.number().int().nonnegative(),
  beforeRevision: guid,
  afterRevision: guid,
  reason: z.string(),
  reference: z.string().nullish(),
  beforeMessageId: z.string().nullish(),
  afterMessageId: z.string().nullish(),
  createdAt: timestamp,
});
export type DeliveryAuditDto = z.infer<typeof deliveryAuditDtoSchema>;

export interface DeliveryQuery {
  state?: string;
  channel?: string;
  notificationId?: string;
  externalMessageId?: string;
  page?: number;
  pageSize?: number;
}

export interface DeliveryReplayInput {
  expectedRevision: string;
  reason: string;
  acknowledgeDuplicateRisk: boolean;
}

const basePath = '/api/v1/admin/notification-deliveries';

export const notificationAdminApi = {
  list: async (query: DeliveryQuery = {}, signal?: AbortSignal): Promise<DeliveryPage> => {
    const filters = deliveryFilterSchema.parse({ ...emptyDeliveryFilters, ...query });
    z.object({ page: z.number().int().min(1).max(1000000), pageSize: z.number().int().min(1).max(100) }).parse({ page: query.page ?? 1, pageSize: query.pageSize ?? 20 });
    const params: Record<string, unknown> = {
      page: query.page ?? 1,
      pageSize: query.pageSize ?? 20,
    };
    for (const [key, value] of Object.entries(filters)) if (value) params[key] = value;

    const response = await api.get(analyticsPath(basePath), { params, signal });
    const result = deliveryPageSchema.parse(response.data);
    if (result.page !== params.page || result.pageSize !== params.pageSize || result.items.length > result.pageSize || result.items.length > Math.max(0, result.total - (result.page - 1) * result.pageSize)) throw new Error('Trang phát thông báo không khớp yêu cầu.');
    return result;
  },

  get: async (id: string, signal?: AbortSignal): Promise<DeliveryAdminDto> => {
    guid.parse(id);
    const response = await api.get(analyticsPath(`${basePath}/${encodeURIComponent(id)}`), { signal });
    const result = deliveryAdminDtoSchema.parse(response.data);
    if (result.id !== id) throw new Error('Chi tiết lượt phát không khớp mục đã chọn.');
    return result;
  },

  audit: async (id: string, page = 1, pageSize = 20, signal?: AbortSignal): Promise<DeliveryAuditDto[]> => {
    guid.parse(id);
    z.object({ page: z.number().int().min(1).max(1000000), pageSize: z.number().int().min(1).max(100) }).parse({ page, pageSize });
    const response = await api.get(analyticsPath(`${basePath}/${encodeURIComponent(id)}/audit`), {
      params: { page, pageSize },
      signal,
    });
    return z.array(deliveryAuditDtoSchema).parse(response.data);
  },

  replay: async (id: string, input: DeliveryReplayInput): Promise<DeliveryAdminDto> => {
    guid.parse(id); guid.parse(input.expectedRevision);
    const validated = deliveryReplaySchema.parse(input);
    const response = await api.post(analyticsPath(`${basePath}/${encodeURIComponent(id)}/replay`), { ...validated, expectedRevision: input.expectedRevision });
    const result = deliveryAdminDtoSchema.parse(response.data);
    if (response.status !== 202 || result.id !== id || result.state !== 'Pending') throw new Error('Chưa xác nhận được yêu cầu gửi lại đã xếp hàng. Hãy đọc lại chi tiết trước khi thử tiếp.');
    return result;
  },
};

export function notificationAdminError(error: unknown): string {
  if (error instanceof z.ZodError) {
    return 'Dữ liệu phát thông báo trả về từ máy chủ không đúng định dạng.';
  }
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const data = error.response?.data as { code?: string; title?: string; detail?: string };
    if (status === 403) return 'Bạn không có quyền quản trị phát thông báo.';
    if (status === 404) return 'Không tìm thấy lượt phát thông báo.';
    if (status === 409) return data?.title || 'Xung đột phiên bản delivery hoặc kênh đã bị đóng.';
    if (data?.title) return data.title;
  }
  return error instanceof Error ? error.message : 'Đã có lỗi xảy ra khi xử lý thông báo.';
}

