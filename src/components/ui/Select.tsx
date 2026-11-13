import { forwardRef, type SelectHTMLAttributes } from 'react';
import { CaretDown } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  /** Lớp cho khung bao ngoài (độ rộng, flex, col-span) */
  containerClassName?: string;
};

/**
 * Ô chọn dùng cho bộ lọc trên thanh công cụ: cao 44px, cùng kiểu với ô tìm kiếm
 * và nút Làm mới. Mũi tên vẽ bằng icon để mọi trình duyệt hiển thị giống nhau.
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { containerClassName, className, children, ...props },
  ref,
) {
  return (
    <div className={cn('relative min-w-0', containerClassName)}>
      <select
        ref={ref}
        {...props}
        className={cn(
          'h-11 w-full min-w-0 cursor-pointer appearance-none truncate rounded-lg border border-slate-200 bg-white pl-3 pr-9 text-xs font-semibold text-slate-700 transition-colors',
          'hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-800 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-60',
          className,
        )}
      >
        {children}
      </select>
      <CaretDown size={14} aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
    </div>
  );
});
