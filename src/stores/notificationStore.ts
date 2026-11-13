import { create } from 'zustand';
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
const RESTART_DELAYS = [5_000, 15_000, 30_000, 60_000];

function mergeById(incoming: NotificationDto[], current: NotificationDto[]) {
  const seen = new Set<string>();
  return [...incoming, ...current]
    .filter((n) => (seen.has(n.id) ? false : (seen.add(n.id), true)))
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

interface NotificationStore {
  items: NotificationDto[];
  unreadCount: number;
  status: NotificationConnectionStatus;
  connection: HubConnection | null;
  
  onNotificationReceived?: (notification: NotificationDto) => void;
  setOnNotificationReceived: (cb?: (notification: NotificationDto) => void) => void;

  connect: () => void;
  disconnect: () => void;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  deleteNotification: (id: string) => void;
  
  simulateNotification: (data: Partial<NotificationDto>) => void;
}

let activeConnection: HubConnection | null = null;
let restartTimer: number | undefined;
let isDisposed = false;
let restartAttempt = 0;
let bulkMarkingDepth = 0;

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  items: [],
  unreadCount: 0,
  status: 'offline',
  connection: null,
  onNotificationReceived: undefined,

  setOnNotificationReceived: (cb) => {
    set({ onNotificationReceived: cb });
  },

  connect: () => {
    if (activeConnection && isConnected(activeConnection)) {
      return;
    }

    isDisposed = false;
    window.clearTimeout(restartTimer);
    set({ status: 'connecting' });

    const connection = createNotificationConnection();
    activeConnection = connection;
    set({ connection });

    const loadInitialData = async () => {
      const [list, count] = await Promise.all([
        connection.invoke('GetNotifications', 1, PAGE_SIZE),
        connection.invoke<number>('GetUnreadCount'),
      ]);
      if (isDisposed) return;
      const parsed = parseNotifications(list);
      set({
        items: parsed,
        unreadCount: typeof count === 'number' ? count : parsed.filter((x) => !x.isRead).length,
      });
    };

    const start = async () => {
      if (isDisposed) return;
      window.clearTimeout(restartTimer);
      set({ status: 'connecting' });

      try {
        if (restartAttempt > 0) {
          await ensureFreshAccessToken();
        }
        if (!isConnected(connection)) {
          await connection.start();
        }
        restartAttempt = 0;
        if (isDisposed) return;

        await loadInitialData();
        if (!isDisposed) {
          set({ status: 'connected' });
        }
      } catch {
        if (isDisposed) return;
        set({ status: 'offline' });
        const delay = RESTART_DELAYS[Math.min(restartAttempt, RESTART_DELAYS.length - 1)];
        restartAttempt += 1;
        restartTimer = window.setTimeout(() => void start(), delay);
      }
    };

    // Bộ nhớ đệm chống trùng sự kiện trong vòng 4 giây (de-duplication)
    // Tránh trường hợp Backend SignalR broadcast vào nhiều group (User + Ward + Role) khiến Client nhận nhiều toast trùng nhau
    const recentEvents = new Map<string, number>();

    connection.on('ReceiveNotification', (value: unknown) => {
      const parsed = notificationDtoSchema.safeParse(value);
      if (parsed.success) {
        const incoming = parsed.data;
        const now = Date.now();
        for (const [key, time] of recentEvents.entries()) {
          if (now - time > 10_000) recentEvents.delete(key);
        }

        const dedupKey = `${incoming.id}_${incoming.applicationId || ''}_${incoming.title}`;
        const isDuplicate = recentEvents.has(dedupKey);
        recentEvents.set(dedupKey, now);

        set((state) => ({
          items: mergeById([incoming], state.items),
          unreadCount: incoming.isRead || isDuplicate ? state.unreadCount : state.unreadCount + 1,
        }));

        if (!isDuplicate) {
          const cb = get().onNotificationReceived;
          if (cb) {
            cb(incoming);
          }
        }
      }
    });

    connection.on('UpdateUnreadCount', (value: unknown) => {
      // Đang đánh dấu tất cả: bỏ qua số đếm trung gian, sẽ đối chiếu một lần khi xong
      if (bulkMarkingDepth > 0) return;
      if (typeof value === 'number') {
        set({ unreadCount: value });
      }
    });

    connection.onreconnecting(() => {
      if (!isDisposed) set({ status: 'connecting' });
    });

    connection.onreconnected(() => {
      if (isDisposed) return;
      void start();
    });

    connection.onclose(() => {
      if (isDisposed) return;
      set({ status: 'offline' });
      restartAttempt = Math.max(restartAttempt, 1);
      restartTimer = window.setTimeout(() => void start(), RESTART_DELAYS[0]);
    });

    void start();
  },

  disconnect: () => {
    isDisposed = true;
    window.clearTimeout(restartTimer);
    if (activeConnection) {
      void activeConnection.stop();
      activeConnection = null;
    }
    set({
      connection: null,
      status: 'offline',
      items: [],
      unreadCount: 0,
    });
  },

  markRead: async (id: string) => {
    const conn = activeConnection;
    if (!conn || !isConnected(conn)) throw new Error('Chưa kết nối máy chủ thông báo.');
    await conn.invoke('MarkRead', id);
    set((state) => ({
      items: state.items.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      unreadCount: Math.max(0, state.unreadCount - 1),
    }));
    await conn.invoke<number>('GetUnreadCount').then((count) => {
      if (typeof count === 'number') set({ unreadCount: count });
    }).catch(() => undefined);
  },

  markAllRead: async () => {
    const conn = activeConnection;
    if (!conn || !isConnected(conn)) throw new Error('Chưa kết nối máy chủ thông báo.');
    const { items, unreadCount } = get();
    // Còn thông báo chưa đọc ở trang chưa tải về thì chuông vẫn > 0 dù danh sách đang hiển thị đã đọc hết
    if (unreadCount <= 0 && !items.some((n) => !n.isRead)) return;
    // NOTIFY-READALL-01: một lệnh MarkAllRead(before) thay cho vòng lặp MarkRead từng thông báo.
    // `before` = thời điểm của thông báo mới nhất đang hiển thị (danh sách xếp mới nhất trước), để
    // thông báo đến sau lúc bấm vẫn chưa đọc và không phụ thuộc đồng hồ máy người dùng bị lệch.
    const before = items[0]?.createdAt ?? new Date().toISOString();
    const cutoff = Date.parse(before);
    const previous = items;
    bulkMarkingDepth += 1;
    // Cập nhật lạc quan: đánh dấu các mục đang hiển thị có createdAt <= before
    set((state) => ({
      items: state.items.map((n) => (!n.isRead && Date.parse(n.createdAt) <= cutoff ? { ...n, isRead: true } : n)),
    }));
    try {
      await conn.invoke<number>('MarkAllRead', before);
    } catch (error) {
      // Hoàn lại trạng thái cũ nếu server chưa đánh dấu được
      set({ items: previous });
      throw error instanceof Error ? error : new Error('Chưa đánh dấu được thông báo. Vui lòng thử lại.');
    } finally {
      bulkMarkingDepth -= 1;
    }
    // Server đã phát UpdateUnreadCount; đối chiếu lại một lần cho chắc (thông báo mới đến sau `before` vẫn được đếm)
    await conn.invoke<number>('GetUnreadCount').then((count) => {
      if (typeof count === 'number') set({ unreadCount: count });
    }).catch(() => undefined);
  },

  deleteNotification: (id: string) => {
    set((state) => {
      const target = state.items.find((x) => x.id === id);
      const wasUnread = target ? !target.isRead : false;
      return {
        items: state.items.filter((x) => x.id !== id),
        unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
      };
    });
  },

  simulateNotification: (data: Partial<NotificationDto>) => {
    const fakeNotification: NotificationDto = {
      id: data.id ?? `sim-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: data.title ?? 'Cập nhật tiến độ hồ sơ',
      content: data.content ?? 'Hồ sơ của bạn đã được tiếp nhận tại bộ phận Một cửa.',
      type: data.type ?? 'STATUS_CHANGED',
      isRead: false,
      applicationId: data.applicationId ?? 'HS-20261031-000041',
      actionUrl: data.actionUrl ?? (data.applicationId ? `/citizen?section=dossiers_all&dossierId=${data.applicationId}` : undefined),
      createdAt: new Date().toISOString(),
    };

    set((state) => ({
      items: mergeById([fakeNotification], state.items),
      unreadCount: state.unreadCount + 1,
    }));

    const cb = get().onNotificationReceived;
    if (cb) {
      cb(fakeNotification);
    }
  },
}));
