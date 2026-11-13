import { forwardRef, type InputHTMLAttributes } from 'react';
import { MagnifyingGlass, X } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

export type SearchInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> & {
  /** Có truyền thì hiện nút ✕ để xóa nhanh từ khóa khi ô đang có chữ */
  onClear?: () => void;
  /** Lớp cho khung bao ngoài (độ rộng, flex) */
  containerClassName?: string;
};

/**
 * Ô tìm kiếm dùng chung toàn hệ thống: icon kính lúp bên trái, nền xám nhạt,
 * chuyển nền trắng + viền đỏ khi đang gõ. Ô không có <label> hiển thị thì
 * placeholder được dùng làm tên cho trình đọc màn hình.
 */
export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(function SearchInput(
  { onClear, containerClassName, className, placeholder, value, ...props },
  ref,
) {
  const hasValue = typeof value === 'string' ? value.length > 0 : Boolean(value);
  const showClear = Boolean(onClear) && hasValue;
  return (
    <div className={cn('relative min-w-0', containerClassName)}>
      <MagnifyingGlass size={18} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
      <input
        ref={ref}
        type="search"
        value={value}
        placeholder={placeholder}
        aria-label={props.id || props['aria-label'] || props['aria-labelledby'] ? props['aria-label'] : placeholder}
        autoComplete="off"
        {...props}
        className={cn(
          'h-11 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 text-xs text-slate-900 transition-colors placeholder:text-slate-400',
          'focus:bg-white focus:border-red-600 focus:outline-none focus:ring-4 focus:ring-red-100 disabled:cursor-not-allowed disabled:opacity-60',
          // Ẩn nút xóa mặc định của trình duyệt để dùng nút ✕ thống nhất
          '[&::-webkit-search-cancel-button]:appearance-none',
          showClear ? 'pr-10' : 'pr-4',
          className,
        )}
      />
      {showClear && (
        <button
          type="button"
          onClick={onClear}
          aria-label="Xóa từ khóa tìm kiếm"
          title="Xóa từ khóa"
          className="absolute right-1.5 top-1/2 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-800 focus-visible:ring-offset-2"
        >
          <X size={14} weight="bold" aria-hidden="true" />
        </button>
      )}
    </div>
  );
});
