import { createPortal } from 'react-dom';
import { useAuthStore } from '@/stores/authStore';
import { getManagementHome } from '@/lib/authRedirect';
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  Checks,
  BellSlash,
  ArrowSquareOut,
} from '@phosphor-icons/react';
import { useNotificationStore } from '@/stores/notificationStore';
import { toast } from '@/components/ui';
import type { CitizenNotification } from '@/types/notification';
import { resolveNotificationUrl } from '@/lib/api/notifications';
import { NotificationItem } from './NotificationItem';

interface NotificationBellProps {
  className?: string;
  isMobileDrawer?: boolean;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
  className = '',
  isMobileDrawer = false,
}) => {
  const {
    items,
    unreadCount,
    status,
    markRead,
    markAllRead,
    deleteNotification,
  } = useNotificationStore();

  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const user = useAuthStore(state => state.user);
  const destination = user ? getManagementHome(user.roles, user.permissions) ?? '/citizen?section=dossiers_all' : '/dang-nhap?returnTo=%2Fcitizen%3Fsection%3Ddossiers_all';

  // Map NotificationDto từ store sang định dạng CitizenNotification hiển thị
  const notifications: CitizenNotification[] = useMemo(() => {
    return items.map((n) => {
      const targetUrl = resolveNotificationUrl(n, user?.roles);
      const codeMatch = n.content.match(/HS-[A-Za-z0-9-]+/);
      const friendlyCode = codeMatch
        ? codeMatch[0]
        : (n.applicationId && !/^[0-9a-f]{8}-[0-9a-f]{4}/i.test(n.applicationId)
            ? n.applicationId
            : undefined);

      return {
        id: n.id,
        title: n.title,
        message: n.content,
        type: n.type.toLowerCase().includes('revision')
          ? 'need_revision'
          : n.type.toLowerCase().includes('approved') || n.title.toLowerCase().includes('sẵn sàng')
          ? 'approved'
          : n.type.toLowerCase().includes('submitted')
          ? 'submitted'
          : 'info',
        applicationCode: friendlyCode,
        createdAt: n.createdAt,
        isRead: n.isRead,
        actionUrl: targetUrl,
        actionLabel: 'Xem chi tiết',
      };
    });
  }, [items, user?.roles]);

  // Close on Escape or click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node) && !panelRef.current?.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    panelRef.current?.focus();
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const displayedNotifications = notifications.filter((item) =>
    filter === 'unread' ? !item.isRead : true
  );

  return (
    <div className={`relative inline-block ${className}`} ref={containerRef}>
      {/* Bell Trigger Button */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative grid size-10 place-items-center rounded-xl border border-red-100 bg-white text-slate-700 shadow-sm transition-all hover:border-red-200 hover:bg-red-50/50 hover:text-red-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-800 focus-visible:ring-offset-2"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label={
          unreadCount > 0
            ? `Thông báo, có ${unreadCount} thông báo chưa đọc`
            : 'Thông báo'
        }
      >
        <Bell size={20} weight={unreadCount > 0 ? 'fill' : 'regular'} className={unreadCount > 0 ? 'text-red-800' : 'text-slate-600'} aria-hidden="true" />
        {unreadCount > 0 && (
          <span
            className="absolute -top-1 -right-1 grid min-w-5 h-5 place-items-center rounded-full bg-red-600 px-1 text-[11px] font-bold text-white shadow ring-2 ring-white animate-in zoom-in-50"
            aria-hidden="true"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown Panel */}
      {isOpen && createPortal(
        <div
          role="dialog"
          aria-label="Danh sách thông báo"
          ref={panelRef} tabIndex={-1}
          style={{ top: Math.min((buttonRef.current?.getBoundingClientRect().bottom ?? 80) + 8, window.innerHeight - 200), right: Math.min(Math.max(12, window.innerWidth - (buttonRef.current?.getBoundingClientRect().right ?? window.innerWidth - 12)), Math.max(12, window.innerWidth - Math.min(window.innerWidth - 24, isMobileDrawer ? 360 : 420) - 12)), width: 'calc(100vw - 24px)', maxWidth: isMobileDrawer ? 360 : 420, maxHeight: 'calc(100dvh - 150px)' }}
          className="fixed z-[100] flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl outline-none ring-1 ring-black/5"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 bg-slate-50/50 rounded-t-2xl">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">Thông báo</h3>
              {unreadCount > 0 && (
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-800">
                  {unreadCount} mới
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => void markAllRead().catch((error: unknown) => toast.error(error instanceof Error ? error.message : 'Chưa đánh dấu được thông báo. Vui lòng thử lại.'))}
                className="flex items-center gap-1 text-xs font-semibold text-red-800 hover:text-red-950 hover:underline"
                title="Đánh dấu tất cả là đã đọc"
              >
                <Checks size={16} aria-hidden="true" />
                <span>Đã đọc tất cả</span>
              </button>
            )}
          </div>

          {/* Filter tabs */}
          <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-2 text-xs bg-white">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`rounded-lg px-3 py-1.5 font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-red-800 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
              aria-pressed={filter === 'all'}
            >
              Tất cả ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('unread')}
              className={`rounded-lg px-3 py-1.5 font-medium transition-colors ${
                filter === 'unread'
                  ? 'bg-red-800 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
              aria-pressed={filter === 'unread'}
            >
              Chưa đọc ({unreadCount})
            </button>
          </div>

          {/* Notifications List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100">
            {displayedNotifications.length > 0 ? (
              displayedNotifications.map((notif) => (
                <NotificationItem
                  key={notif.id}
                  notification={notif}
                  onMarkAsRead={(id) => void markRead(id)}
                  onDelete={(id) => deleteNotification(id)}
                  onItemClick={() => setIsOpen(false)}
                />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center text-slate-500">
                <div className="grid size-12 place-items-center rounded-full bg-slate-100 text-slate-400 mb-3">
                  <BellSlash size={24} aria-hidden="true" />
                </div>
                <p className="text-sm font-semibold text-slate-700">
                  {filter === 'unread'
                    ? 'Bạn đã đọc hết thông báo'
                    : 'Không có thông báo nào'}
                </p>
                <p className="mt-1 text-xs text-slate-400 max-w-[240px]">
                  {filter === 'unread'
                    ? 'Hiện tại không còn thông báo chưa đọc.'
                    : 'Các cập nhật về tiến độ tiền kiểm hồ sơ sẽ xuất hiện tại đây theo thời gian thực.'}
                </p>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-2.5 bg-slate-50/50 rounded-b-2xl text-xs text-slate-500">
            <div className="flex items-center gap-1.5">
              <span className={`size-2 rounded-full ${status === 'connected' ? 'bg-emerald-500' : status === 'connecting' ? 'bg-amber-400 animate-pulse' : 'bg-slate-300'}`} />
              <span className="text-[11px]">{status === 'connected' ? 'Đã kết nối thông báo.' : status === 'connecting' ? 'Đang kết nối thông báo...' : 'Chưa kết nối thông báo.'}</span>
            </div>

            <Link
              to={destination}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-1 font-medium text-red-800 hover:text-red-950 hover:underline"
            >
              <span>{user ? 'Mở phân hệ của tôi' : 'Đăng nhập để xem hồ sơ'}</span>
              <ArrowSquareOut size={14} aria-hidden="true" />
            </Link>
          </div>
        </div>
      , document.body)}
    </div>
  );
};
