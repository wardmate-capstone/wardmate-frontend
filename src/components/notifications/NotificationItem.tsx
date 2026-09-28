import React from 'react';
import { Link } from 'react-router-dom';
import {
  WarningCircle,
  CheckCircle,
  PaperPlaneTilt,
  Info,
  Clock,
  Check,
  Trash,
} from '@phosphor-icons/react';
import type { CitizenNotification } from '@/types/notification';
import { formatNotificationTime } from '@/lib/formatTime';

interface NotificationItemProps {
  notification: CitizenNotification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  onItemClick?: () => void;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onMarkAsRead,
  onDelete,
  onItemClick,
}) => {
  const {
    id,
    title,
    message,
    type,
    procedureName,
    applicationCode,
    createdAt,
    isRead,
    actionUrl,
    actionLabel,
  } = notification;

  const getTypeIcon = () => {
    switch (type) {
      case 'need_revision':
        return <WarningCircle size={20} className="text-amber-600 shrink-0" weight="fill" aria-hidden="true" />;
      case 'approved':
        return <CheckCircle size={20} className="text-emerald-600 shrink-0" weight="fill" aria-hidden="true" />;
      case 'submitted':
        return <PaperPlaneTilt size={20} className="text-blue-600 shrink-0" weight="fill" aria-hidden="true" />;
      case 'reminder':
        return <Clock size={20} className="text-purple-600 shrink-0" weight="fill" aria-hidden="true" />;
      case 'info':
      default:
        return <Info size={20} className="text-slate-600 shrink-0" weight="fill" aria-hidden="true" />;
    }
  };

  const handleClick = () => {
    if (!isRead) {
      onMarkAsRead(id);
    }
    if (onItemClick) {
      onItemClick();
    }
  };

  return (
    <div
      className={`group relative flex flex-col gap-2 p-3.5 transition-colors border-b border-slate-100 last:border-b-0 ${
        isRead ? 'bg-white hover:bg-slate-50/80' : 'bg-red-50/30 hover:bg-red-50/60'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5 min-w-0">
          <div className="mt-0.5">{getTypeIcon()}</div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5 mb-1">
              <h4 className={`text-sm leading-snug ${isRead ? 'font-medium text-slate-800' : 'font-bold text-slate-900'}`}>
                {title}
              </h4>
              {!isRead && (
                <span className="inline-block size-2 rounded-full bg-red-600 shrink-0" title="Chưa đọc" aria-label="Chưa đọc" />
              )}
            </div>

            {(procedureName || applicationCode) && (
              <div className="flex flex-wrap items-center gap-1.5 mb-1.5 text-xs">
                {procedureName && (
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 font-medium text-slate-700">
                    {procedureName}
                  </span>
                )}
                {applicationCode && (
                  <span className="rounded border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-[11px] text-slate-600">
                    {applicationCode}
                  </span>
                )}
              </div>
            )}

            <p className="text-xs leading-relaxed text-slate-600 line-clamp-2">
              {message}
            </p>

            <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] text-slate-400">
                {formatNotificationTime(createdAt)}
              </span>

              {actionUrl && (
                <Link
                  to={actionUrl}
                  onClick={handleClick}
                  className="text-xs font-semibold text-red-800 hover:text-red-900 hover:underline"
                >
                  {actionLabel || 'Xem chi tiết'} &rarr;
                </Link>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100">
          {!isRead && (
            <button
              type="button"
              onClick={() => onMarkAsRead(id)}
              className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
              title="Đánh dấu đã đọc"
              aria-label="Đánh dấu thông báo này là đã đọc"
            >
              <Check size={16} aria-hidden="true" />
            </button>
          )}
          <button
            type="button"
            onClick={() => onDelete(id)}
            className="rounded p-1 text-slate-400 hover:bg-red-100 hover:text-red-700"
            title="Xóa thông báo"
            aria-label="Xóa thông báo này"
          >
            <Trash size={16} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
};
