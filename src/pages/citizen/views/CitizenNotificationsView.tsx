import { Bell } from '@phosphor-icons/react';
import type { citizenNotifications } from '../types';

interface CitizenNotificationsViewProps {
  notifications: typeof citizenNotifications;
  onMarkAllRead: () => void;
}

export function CitizenNotificationsView({
  notifications,
  onMarkAllRead,
}: CitizenNotificationsViewProps) {
  return (
    <section className="admin-card admin-content-card">
      <div className="admin-card-heading">
        <div>
          <h2>Hộp thư thông báo tiến độ</h2>
        </div>
        <button type="button" onClick={onMarkAllRead}>
          Đánh dấu đã đọc tất cả
        </button>
      </div>

      <div className="divide-y divide-slate-100">
        {notifications.map((item) => (
          <div
            key={item.id}
            className={`flex items-start gap-3.5 p-5 transition-colors ${item.read ? 'bg-white' : 'bg-red-50/30'}`}
          >
            <span
              className={`grid size-9 shrink-0 place-items-center rounded-full text-white ${
                item.type === 'success'
                  ? 'bg-emerald-600'
                  : item.type === 'warning'
                  ? 'bg-amber-500'
                  : 'bg-sky-600'
              }`}
            >
              <Bell size={18} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <strong className={`text-xs ${item.read ? 'text-slate-800' : 'text-slate-950 font-bold'}`}>
                  {item.title}
                </strong>
                <small className="text-[10px] text-slate-400 shrink-0">{item.time}</small>
              </div>
              <p className="mt-1 text-xs text-slate-600 leading-relaxed">{item.content}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
