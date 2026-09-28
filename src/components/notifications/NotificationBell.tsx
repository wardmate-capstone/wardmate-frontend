import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  Checks,
  BellSlash,
  ArrowSquareOut,
  ArrowCounterClockwise,
} from '@phosphor-icons/react';
import { useCitizenNotifications } from '@/hooks/useCitizenNotifications';
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
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    resetNotifications,
  } = useCitizenNotifications();

  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

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
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

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
        className="relative grid size-10 place-items-center rounded-xl border border-red-100 bg-white text-slate-700 shadow-sm transition-all hover:border-red-200 hover:bg-red-50/50 hover:text-red-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-800"
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
            className="absolute -top-1 -right-1 grid min-w-5 h-5 place-items-center rounded-full bg-red-600 px-1 text-[11px] font-bold text-white shadow ring-2 ring-white"
            aria-hidden="true"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown Panel */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Danh sách thông báo"
          className={`absolute z-[100] flex flex-col rounded-2xl border border-slate-200 bg-white shadow-xl ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-150 ${
            isMobileDrawer
              ? 'right-0 w-[min(90vw,360px)] top-12'
              : 'right-0 top-12 w-[380px] sm:w-[420px]'
          }`}
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
                onClick={markAllAsRead}
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
                  onMarkAsRead={markAsRead}
                  onDelete={deleteNotification}
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
                    ? 'Tất cả các thông báo cập nhật hồ sơ đã được xử lý.'
                    : 'Các cập nhật về tiến độ tiền kiểm hồ sơ sẽ xuất hiện tại đây.'}
                </p>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-2.5 bg-slate-50/50 rounded-b-2xl text-xs text-slate-500">
            <button
              type="button"
              onClick={resetNotifications}
              className="flex items-center gap-1 text-slate-500 hover:text-slate-800 transition-colors"
              title="Khôi phục dữ liệu thông báo mẫu"
            >
              <ArrowCounterClockwise size={14} aria-hidden="true" />
              <span>Dữ liệu mẫu</span>
            </button>

            <Link
              to="/tai-khoan"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-1 font-medium text-red-800 hover:text-red-950 hover:underline"
            >
              <span>Hồ sơ của tôi</span>
              <ArrowSquareOut size={14} aria-hidden="true" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
