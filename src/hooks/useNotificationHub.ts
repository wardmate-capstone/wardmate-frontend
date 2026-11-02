import { useEffect } from 'react';
import { useNotificationStore, type NotificationConnectionStatus } from '@/stores/notificationStore';

export type { NotificationConnectionStatus };

/**
 * Hook truy cập thông báo thời gian thực: Đồng bộ tập trung qua useNotificationStore.
 * Hỗ trợ tương thích ngược toàn diện cho CitizenPage, OfficerPage và các views.
 */
export function useNotificationHub(enabled: boolean) {
  const { items, unreadCount, status, markRead, markAllRead, connect } = useNotificationStore();

  useEffect(() => {
    if (enabled) {
      connect();
    }
  }, [enabled, connect]);

  return { items, unreadCount, status, markRead, markAllRead };
}
