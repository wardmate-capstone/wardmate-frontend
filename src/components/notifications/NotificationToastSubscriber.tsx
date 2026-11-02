import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/Toast';
import { useAuthStore } from '@/stores/authStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { type NotificationDto, resolveNotificationUrl } from '@/lib/api/notifications';
import { Bell, ArrowRight, X } from '@phosphor-icons/react';

export const NotificationToastSubscriber: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const authStatus = useAuthStore((state) => state.status);
  const { connect, disconnect, setOnNotificationReceived, markRead } = useNotificationStore();

  useEffect(() => {
    if (authStatus === 'authenticated' && user?.id) {
      connect();
    } else if (authStatus === 'anonymous' || !user) {
      disconnect();
    }

    return () => {
      // Khi unmount subscriber
    };
  }, [authStatus, user?.id, connect, disconnect]);

  useEffect(() => {
    setOnNotificationReceived((notification: NotificationDto) => {
      // Hiển thị Toast nổi ở góc trên bên phải
      toast.custom(
        (t) => (
          <div className="flex w-full max-w-sm flex-col gap-2 rounded-2xl border border-red-200/80 bg-white p-4 shadow-xl ring-1 ring-black/5 transition-all">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="grid size-8 shrink-0 place-items-center rounded-xl bg-red-100 text-red-800">
                  <Bell size={18} weight="fill" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 leading-tight">
                    {notification.title}
                  </h4>
                  <span className="text-[10px] text-slate-400">
                    Vừa xong • WardMate
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => toast.dismiss(t)}
                className="grid size-6 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                aria-label="Đóng thông báo"
              >
                <X size={14} />
              </button>
            </div>

            <p className="line-clamp-2 text-xs text-slate-600 leading-relaxed pl-1">
              {notification.content}
            </p>

            <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  toast.dismiss(t);
                  void markRead(notification.id);
                  const targetUrl = resolveNotificationUrl(notification, user?.roles);
                  navigate(targetUrl);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-red-800 px-3 py-1.5 text-xs font-medium text-white shadow-xs hover:bg-red-900 active:scale-95 transition"
              >
                <span>Xem hồ sơ</span>
                <ArrowRight size={13} weight="bold" />
              </button>
            </div>
          </div>
        ),
        {
          duration: 6000,
          position: 'top-right',
        }
      );
    });

    return () => {
      setOnNotificationReceived(undefined);
    };
  }, [setOnNotificationReceived, markRead, navigate, user?.roles]);

  return null;
};

