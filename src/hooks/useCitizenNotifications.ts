import { useState, useCallback } from 'react';
import type { CitizenNotification } from '@/types/notification';

// Until a server notification contract is integrated, never present fixtures as account data.
export function useCitizenNotifications() {
  const [notifications, setNotifications] = useState<CitizenNotification[]>([]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isRead: true } : item))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
  }, []);

  const deleteNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const resetNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    resetNotifications,
  };
}
