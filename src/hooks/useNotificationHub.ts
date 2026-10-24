import { useCallback, useEffect, useRef, useState } from 'react';
import type { HubConnection } from '@microsoft/signalr';
import {
  createNotificationConnection,
  ensureFreshAccessToken,
  isConnected,
  notificationDtoSchema,
  parseNotifications,
  type NotificationDto,
} from '@/lib/api/notifications';

export type NotificationConnectionStatus = 'connecting' | 'connected' | 'offline';

const PAGE_SIZE = 50;
// Thử lại khi mất kết nối hẳn (ngoài automatic reconnect của SignalR), tăng dần để không dội máy chủ.
const RESTART_DELAYS = [5_000, 15_000, 30_000, 60_000];

function mergeById(incoming: NotificationDto[], current: NotificationDto[]) {
  const seen = new Set<string>();
  return [...incoming, ...current]
    .filter((n) => (seen.has(n.id) ? false : (seen.add(n.id), true)))
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

/** Thông báo realtime qua NotificationHub: tải danh sách, đếm chưa đọc, đánh dấu đã đọc. */
export function useNotificationHub(enabled: boolean) {
  const [items, setItems] = useState<NotificationDto[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [status, setStatus] = useState<NotificationConnectionStatus>('connecting');
  const connectionRef = useRef<HubConnection | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let disposed = false;
    let attempt = 0;
    let timer: number | undefined;
    const connection = createNotificationConnection();
    connectionRef.current = connection;

    const load = async () => {
      const [list, count] = await Promise.all([
        connection.invoke('GetNotifications', 1, PAGE_SIZE),
        connection.invoke<number>('GetUnreadCount'),
      ]);
      if (disposed) return;
      setItems(parseNotifications(list));
      setUnreadCount(typeof count === 'number' ? count : 0);
    };

    const start = async () => {
      if (disposed) return;
      setStatus('connecting');
      try {
        if (attempt > 0) await ensureFreshAccessToken();
        await connection.start();
        attempt = 0;
        if (disposed) return;
        setStatus('connected');
        await load();
      } catch {
        if (disposed) return;
        setStatus('offline');
        timer = window.setTimeout(() => void start(), RESTART_DELAYS[Math.min(attempt, RESTART_DELAYS.length - 1)]);
        attempt += 1;
      }
    };

    connection.on('ReceiveNotification', (value: unknown) => {
      const parsed = notificationDtoSchema.safeParse(value);
      if (parsed.success) setItems((prev) => mergeById([parsed.data], prev));
    });
    connection.on('UpdateUnreadCount', (value: unknown) => {
      if (typeof value === 'number') setUnreadCount(value);
    });
    connection.onreconnecting(() => !disposed && setStatus('connecting'));
    // Sau khi kết nối lại, tải lại để không sót thông báo phát ra lúc mất kết nối.
    connection.onreconnected(() => {
      if (disposed) return;
      setStatus('connected');
      void load().catch(() => undefined);
    });
    connection.onclose(() => {
      if (disposed) return;
      setStatus('offline');
      attempt = Math.max(attempt, 1);
      timer = window.setTimeout(() => void start(), RESTART_DELAYS[0]);
    });

    void start();
    return () => {
      disposed = true;
      window.clearTimeout(timer);
      connectionRef.current = null;
      void connection.stop();
    };
  }, [enabled]);

  const markRead = useCallback(async (id: string) => {
    const connection = connectionRef.current;
    if (!isConnected(connection)) return;
    await connection!.invoke('MarkRead', id);
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  }, []);

  // BE chưa có MarkAllRead: đánh dấu lần lượt các thông báo chưa đọc đang hiển thị.
  const markAllRead = useCallback(async () => {
    const connection = connectionRef.current;
    if (!isConnected(connection)) throw new Error('Chưa kết nối máy chủ thông báo.');
    const unread = items.filter((n) => !n.isRead).map((n) => n.id);
    const results = await Promise.allSettled(unread.map((id) => connection!.invoke('MarkRead', id)));
    const done = new Set(unread.filter((_, i) => results[i].status === 'fulfilled'));
    setItems((prev) => prev.map((n) => (done.has(n.id) ? { ...n, isRead: true } : n)));
    if (done.size < unread.length) throw new Error('Một số thông báo chưa đánh dấu được. Vui lòng thử lại.');
  }, [items]);

  return { items, unreadCount, status, markRead, markAllRead };
}
