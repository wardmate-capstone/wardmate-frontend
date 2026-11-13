import { ArrowsClockwise } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

export type RefreshButtonProps = {
  onClick: () => void;
  /** Đang tải lại: icon xoay, nút bị khóa để tránh bấm liên tục */
  loading?: boolean;
  disabled?: boolean;
  /**
   * Tên đầy đủ cho trình đọc màn hình và tooltip (vd: "Làm mới danh sách hồ sơ").
   * Chữ hiển thị luôn là "Làm mới" để mọi trang giống nhau.
   */
  label?: string;
  className?: string;
};

/**
 * Nút "Làm mới" dùng chung toàn hệ thống: viền xám, nền trắng, icon mũi tên xoay vòng.
 * Khi đang tải chỉ xoay icon, giữ nguyên chữ để nút không đổi độ rộng.
 */
export function RefreshButton({ onClick, loading = false, disabled = false, label, className }: RefreshButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      aria-label={label}
      title={label ?? 'Làm mới'}
      className={cn(
        'inline-flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 transition-colors',
        'hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-800 disabled:cursor-not-allowed disabled:opacity-60',
        className,
      )}
    >
      <ArrowsClockwise size={16} aria-hidden="true" className={loading ? 'motion-safe:animate-spin text-red-800' : 'text-slate-600'} />
      <span>Làm mới</span>
    </button>
  );
}
