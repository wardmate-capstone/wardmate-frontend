import React from 'react';
import {
  Bell,
  ArrowCounterClockwise,
  Hourglass,
  Clock,
  Check,
} from '@phosphor-icons/react';
import type { OfficerNotification } from '@/types/officer';

interface OfficerNotificationViewProps {
  notifications: OfficerNotification[];
  onMarkAllAsRead: () => void;
  onSelectApplication?: (appNumber: string) => void;
}

export const OfficerNotificationView: React.FC<OfficerNotificationViewProps> = ({
  notifications,
  onMarkAllAsRead,
  onSelectApplication,
}) => {
  return (
    <section aria-label="Danh sách thông báo ca trực" className="space-y-6">
      <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-xl bg-red-50 text-red-800">
            <Bell size={24} weight="bold" />
          </span>
          <div>
            <h3 className="text-base font-bold text-slate-950">Thông báo ca làm việc</h3>
            <p className="text-xs text-slate-500">Cập nhật theo thời gian thực về các hồ sơ được công dân nộp và gửi lại</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onMarkAllAsRead}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50"
        >
          <Check size={14} weight="bold" />
          <span>Đánh dấu đã đọc tất cả</span>
        </button>
      </header>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
        {notifications.length === 0 ? (
          <div className="p-10 text-center text-slate-500">
            <p className="font-semibold text-slate-700">Chưa có thông báo mới.</p>
            <p className="text-xs text-slate-400 mt-1 italic">⚠️ API thông báo cán bộ Một cửa sẽ được tích hợp sau.</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {notifications.map((n) => (
            <li
              key={n.id}
              className={`p-5 flex items-start gap-4 transition-colors ${
                !n.isRead ? 'bg-red-50/20' : 'hover:bg-slate-50'
              }`}
            >
              <span
                className={`grid size-10 shrink-0 place-items-center rounded-xl ${
                  n.type === 'resubmitted'
                    ? 'bg-purple-100 text-purple-800'
                    : n.type === 'new_pending'
                    ? 'bg-amber-100 text-amber-900'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                {n.type === 'resubmitted' ? (
                  <ArrowCounterClockwise size={20} weight="bold" />
                ) : n.type === 'new_pending' ? (
                  <Hourglass size={20} weight="bold" />
                ) : (
                  <Clock size={20} />
                )}
              </span>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <strong className="text-sm font-bold text-slate-900">{n.title}</strong>
                  <span className="text-[11px] text-slate-400">{n.time}</span>
                </div>
                <p className="text-xs text-slate-600 mt-1 leading-5">{n.message}</p>
                {n.applicationNumber && (
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={() => onSelectApplication?.(n.applicationNumber!)}
                      className="text-xs font-bold text-red-800 hover:underline inline-flex items-center gap-1"
                    >
                      <span>Mở hồ sơ {n.applicationNumber}</span>
                      <span>→</span>
                    </button>
                  </div>
                )}
              </div>

              {!n.isRead && (
                <span className="size-2.5 rounded-full bg-red-600 mt-2 shrink-0" title="Chưa đọc" />
              )}
            </li>
          ))}
          </ul>
        )}
      </div>
    </section>
  );
};
