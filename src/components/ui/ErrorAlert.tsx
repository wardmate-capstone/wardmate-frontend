import type { ReactNode } from 'react';
import { ArrowsClockwise, WarningCircle } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

export type ErrorAlertProps = {
  children: ReactNode;
  /** Có truyền thì hiện nút "Thử lại" bên phải */
  onRetry?: () => void;
  retryLabel?: string;
  retrying?: boolean;
  className?: string;
};

/** Khung báo lỗi dùng chung: viền + nền đỏ nhạt, icon cảnh báo, nút Thử lại tùy chọn */
export function ErrorAlert({ children, onRetry, retryLabel = 'Thử lại', retrying = false, className }: ErrorAlertProps) {
  return (
    <div role="alert" className={cn('flex flex-wrap items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800', className)}>
      <WarningCircle size={20} weight="fill" aria-hidden="true" className="mt-px shrink-0 text-red-600" />
      <div className="min-w-0 flex-1 leading-6">{children}</div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          disabled={retrying}
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 text-xs font-semibold text-red-800 transition-colors hover:bg-red-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-800 disabled:opacity-60"
        >
          <ArrowsClockwise size={14} aria-hidden="true" className={retrying ? 'motion-safe:animate-spin' : undefined} />
          {retryLabel}
        </button>
      )}
    </div>
  );
}
