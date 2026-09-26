import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: ReactNode;
  hint?: string;
  error?: string;
  containerClassName?: string;
};
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ id, label, hint, error, className, containerClassName, 'aria-describedby': describedBy, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const description = [describedBy, hint && inputId + '-hint', error && inputId + '-error'].filter(Boolean).join(' ') || undefined;
    return (
      <div className={cn('grid gap-2', containerClassName)}>
        {label && <label htmlFor={inputId} className="text-sm font-semibold text-slate-800">{label}{props.required && <span aria-hidden="true"> *</span>}</label>}
        <input {...props} ref={ref} id={inputId} aria-describedby={description} aria-invalid={error ? true : props['aria-invalid']}
          className={cn('min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-950 placeholder:text-slate-400 focus:border-red-500 focus:outline-none focus:ring-4 focus:ring-red-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500', error && 'border-red-700', className)} />
        {hint && <p id={inputId + '-hint'} className="text-sm text-slate-600">{hint}</p>}
        {error && <p id={inputId + '-error'} role="alert" className="text-sm text-red-800">{error}</p>}
      </div>
    );
  },
);
Input.displayName = 'Input';
