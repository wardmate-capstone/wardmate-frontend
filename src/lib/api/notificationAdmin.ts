import axios from 'axios';
import { z } from 'zod';
import { api } from './index';
import { servicePath, serviceUrls } from './serviceUrls';

const analyticsPath = (path: string) => servicePath(serviceUrls.analytics, path);

export const deliveryAdminDtoSchema = z.object({
  id: z.string(),
  notificationId: z.string(),
  channel: z.string(),
  state: z.string(),
  attempts: z.number().int().nonnegative(),
  nextAttemptAt: z.string(),
  errorCode: z.string().nullish(),
  sentAt: z.string().nullish(),
  provider: z.string().nullish(),
  externalMessageId: z.string().nullish(),
  isSandbox: z.boolean().nullish(),
  revision: z.string(),
  updatedAt: z.string(),
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
  id: z.string(),
  actorId: z.string(),
  action: z.string(),
  beforeState: z.string(),
  afterState: z.string(),
  beforeAttempts: z.number().int().nonnegative(),
  beforeRevision: z.string(),
  afterRevision: z.string(),
  reason: z.string(),
  reference: z.string().nullish(),
  beforeMessageId: z.string().nullish(),
  afterMessageId: z.string().nullish(),
  createdAt: z.string(),
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
    const params: Record<string, unknown> = {
      page: query.page ?? 1,
      pageSize: query.pageSize ?? 20,
    };
    if (query.state) params.state = query.state;
    if (query.channel) params.channel = query.channel;
    if (query.notificationId) params.notificationId = query.notificationId;
    if (query.externalMessageId) params.externalMessageId = query.externalMessageId;

    const response = await api.get(analyticsPath(basePath), { params, signal });
    return deliveryPageSchema.parse(response.data);
  },

  get: async (id: string, signal?: AbortSignal): Promise<DeliveryAdminDto> => {
    const response = await api.get(analyticsPath(`${basePath}/${encodeURIComponent(id)}`), { signal });
    return deliveryAdminDtoSchema.parse(response.data);
  },

  audit: async (id: string, page = 1, pageSize = 20, signal?: AbortSignal): Promise<DeliveryAuditDto[]> => {
    const response = await api.get(analyticsPath(`${basePath}/${encodeURIComponent(id)}/audit`), {
      params: { page, pageSize },
      signal,
    });
    return z.array(deliveryAuditDtoSchema).parse(response.data);
  },

  replay: async (id: string, input: DeliveryReplayInput): Promise<DeliveryAdminDto> => {
    const response = await api.post(analyticsPath(`${basePath}/${encodeURIComponent(id)}/replay`), input);
    return deliveryAdminDtoSchema.parse(response.data);
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

