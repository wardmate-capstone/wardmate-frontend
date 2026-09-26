import { cva, type VariantProps } from 'class-variance-authority';
import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

const badgeVariants = cva('inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold', {
  variants: { variant: {
    neutral: 'bg-slate-100 text-slate-700',
    info: 'bg-blue-50 text-blue-800',
    success: 'bg-emerald-50 text-emerald-800',
    warning: 'bg-amber-50 text-amber-900',
    danger: 'bg-red-50 text-red-800',
  } },
  defaultVariants: { variant: 'neutral' },
});
export type BadgeProps = HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>;
export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
