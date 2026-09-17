import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gold-200',
  {
    variants: {
      variant: {
        primary: 'bg-red-700 text-white shadow-sm hover:-translate-y-0.5 hover:bg-red-800 hover:shadow-md',
        gold: 'bg-gold-500 text-red-950 shadow-sm hover:-translate-y-0.5 hover:bg-gold-400 hover:shadow-md',
        outline: 'border border-red-200 bg-white text-red-800 hover:-translate-y-0.5 hover:border-red-400 hover:bg-red-50',
        ghost: 'text-slate-700 hover:bg-slate-100 hover:text-red-800',
        light: 'bg-white text-red-800 shadow-sm hover:bg-amber-50',
      },
      size: {
        default: 'min-h-12 px-5',
        small: 'min-h-10 px-4 text-xs',
        large: 'min-h-14 px-7 text-base',
        icon: 'size-12 p-0',
      },
    },
    defaultVariants: { variant: 'primary', size: 'default' },
  },
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, type = 'button', ...props }, ref) => (
    <button ref={ref} type={type} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  ),
);

Button.displayName = 'Button';

export { buttonVariants };
