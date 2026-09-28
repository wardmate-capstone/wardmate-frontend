import { useState, useEffect, useCallback } from 'react';
import type { CitizenNotification } from '@/types/notification';
import { INITIAL_MOCK_NOTIFICATIONS } from '@/data/mockNotifications';

const STORAGE_KEY = 'wardmate_citizen_notifications_v1';

export function useCitizenNotifications() {
  const [notifications, setNotifications] = useState<CitizenNotification[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch {
      // Fallback on storage errors
    }
    return INITIAL_MOCK_NOTIFICATIONS;
  });

  // Keep localStorage updated
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
    } catch {
      // Ignore write errors
    }
  }, [notifications]);

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
    setNotifications(INITIAL_MOCK_NOTIFICATIONS);
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
