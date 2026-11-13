import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-800 focus-visible:ring-offset-2',
  {
    variants: {
      variant: {
        primary: 'bg-red-700 text-white shadow-sm hover:-translate-y-0.5 hover:bg-red-800 hover:shadow-md',
        gold: 'bg-gold-500 text-red-950 shadow-sm hover:-translate-y-0.5 hover:bg-gold-400 hover:shadow-md',
        outline: 'border border-red-200 bg-white text-red-800 hover:-translate-y-0.5 hover:border-red-400 hover:bg-red-50',
        ghost: 'text-slate-700 hover:bg-slate-100 hover:text-red-800',
        light: 'bg-white text-red-800 shadow-sm hover:bg-amber-50',
        // Hành động không hoàn tác (xóa, hủy hồ sơ, hủy xuất bản…):
        // danger = nút xác nhận cuối cùng trong hộp thoại; dangerOutline = nút mở hành động; dangerGhost = thao tác nhỏ trong dòng
        danger: 'bg-red-700 text-white shadow-sm hover:bg-red-800',
        dangerOutline: 'border border-red-300 bg-white text-red-700 hover:border-red-400 hover:bg-red-50',
        dangerGhost: 'text-red-700 hover:bg-red-50 hover:text-red-800',
      },
      size: {
        default: 'min-h-12 px-5',
        small: 'min-h-10 px-4 text-xs',
        large: 'min-h-14 px-7 text-base',
        icon: 'size-12 p-0',
        // Nút trên thanh công cụ/đầu trang: cao 44px, cùng hàng với ô tìm kiếm, ô lọc, nút Làm mới
        toolbar: 'h-11 min-h-11 gap-1.5 rounded-lg px-4 text-xs hover:translate-y-0',
      },
    },
    defaultVariants: { variant: 'primary', size: 'default' },
  },
);

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants> & { loading?: boolean };

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, type = 'button', loading = false, disabled, children, ...props }, ref) => (
    <button ref={ref} type={type} className={cn(buttonVariants({ variant, size }), className)} {...props} disabled={disabled || loading} aria-busy={loading || props['aria-busy']}>
      {loading && <span aria-hidden="true" className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent" />}
      {children}
    </button>
  ),
);

Button.displayName = 'Button';

export { buttonVariants };
