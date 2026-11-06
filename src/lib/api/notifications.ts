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

/**
 * Chuyển đổi actionUrl từ thông báo sang route hợp lệ trong SPA frontend.
 * Tránh trường hợp Backend gửi URL REST như "/applications/{id}" hoặc "/api/v1/..." làm người dùng bị 404.
 */
export function resolveNotificationUrl(
  notification: { actionUrl?: string | null; applicationId?: string | null; title?: string; content?: string; type?: string },
  roles?: string[]
): string {
  const isOfficer = Boolean(roles?.some((r) => r.includes('OFFICER') || r.includes('FRONT_DESK')));
  const isManager = Boolean(roles?.some((r) => r.includes('MANAGER')));
  const appId = notification.applicationId;
  // Staffing v3 notifications currently carry no resource ID or actionUrl.
  // Route to the matching list; never interpret a staffing event as a citizen application.
  if (notification.type === 'SYSTEM_ALERT' && notification.title === 'Cập nhật lịch và nghỉ phép') {
    const home = isManager ? '/manager' : isOfficer ? '/officer' : '/citizen';
    if (!isManager && !isOfficer) return home;
    if (notification.content?.includes('đơn nghỉ')) return `${home}?section=leaves`;
    if (notification.content?.includes('đổi giờ ca')) return `${home}?section=shifts&view=changes`;
    return `${home}?section=shifts&view=month`;
  }

  // Nếu actionUrl là đường dẫn nội bộ hợp lệ của Frontend SPA
  if (
    notification.actionUrl &&
    (notification.actionUrl.startsWith('/citizen') ||
      notification.actionUrl.startsWith('/cong-dan') ||
      notification.actionUrl.startsWith('/officer') ||
      notification.actionUrl.startsWith('/can-bo') ||
      notification.actionUrl.startsWith('/manager') ||
      notification.actionUrl.startsWith('/quan-ly') ||
      notification.actionUrl.startsWith('/admin'))
  ) {
    return notification.actionUrl;
  }

  // Cán bộ: vào thẳng workspace thẩm định hồ sơ
  if (isOfficer && appId) {
    return `/officer?tab=workspace&applicationId=${encodeURIComponent(appId)}`;
  }

  // Quản lý: vào mục điều phối/giám sát
  if (isManager && appId) {
    return `/manager?section=applications`;
  }

  // Công dân hoặc người dùng chung: mở danh sách hồ sơ với dossierId
  if (appId) {
    return `/citizen?section=dossiers_all&dossierId=${encodeURIComponent(appId)}`;
  }

  return isOfficer ? '/officer' : isManager ? '/manager' : '/citizen';
}
