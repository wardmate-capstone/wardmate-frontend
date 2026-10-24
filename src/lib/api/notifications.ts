import { HubConnectionBuilder, HubConnectionState, LogLevel, type HubConnection } from '@microsoft/signalr';
import { z } from 'zod';
import { authClient, refreshAssignedCategories } from '@/lib/api';
import { serviceUrls, servicePath } from '@/lib/api/serviceUrls';

// Hợp đồng TASK-25 (AnalyticsSystem NotificationHub). Gateway định tuyến hub tại /api/analytics-system;
// VITE_DOCUMENT_FORM_API_URL chính là địa chỉ gateway.
export const NOTIFICATION_HUB_URL = servicePath(serviceUrls.documentForm, '/api/analytics-system/hubs/notifications');

export const notificationDtoSchema = z.object({
  id: z.string(),
  applicationId: z.string().nullish(),
  title: z.string(),
  content: z.string(),
  type: z.string(),
  isRead: z.boolean(),
  actionUrl: z.string().nullish(),
  createdAt: z.string(),
});
export type NotificationDto = z.infer<typeof notificationDtoSchema>;

export function parseNotifications(value: unknown): NotificationDto[] {
  const parsed = z.array(notificationDtoSchema).safeParse(value);
  return parsed.success ? parsed.data : [];
}

export function createNotificationConnection(): HubConnection {
  return new HubConnectionBuilder()
    // Access token chỉ ở RAM; SignalR gửi qua query access_token khi dùng WebSocket.
    .withUrl(NOTIFICATION_HUB_URL, { accessTokenFactory: () => authClient.getAccessToken() ?? '' })
    .withAutomaticReconnect([0, 2_000, 10_000, 30_000])
    .configureLogging(LogLevel.None)
    .build();
}

/**
 * Hub đóng kết nối khi token hết hạn và không tự làm mới token. Gọi một API có xác thực để interceptor
 * refresh token (401 → refresh-token) trước khi kết nối lại.
 */
export async function ensureFreshAccessToken() {
  await refreshAssignedCategories();
}

export function isConnected(connection: HubConnection | null) {
  return connection?.state === HubConnectionState.Connected;
}
