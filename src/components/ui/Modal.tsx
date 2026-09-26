import * as Dialog from '@radix-ui/react-dialog';
import { X } from '@phosphor-icons/react';
import { useId, useRef, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type ModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  trigger?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
};
export function Modal({ open, onOpenChange, title, description, trigger, children, footer, className }: ModalProps) {
  const descriptionId = useId();
  const previousFocus = useRef<HTMLElement | null>(null);
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      {trigger && <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>}
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[90] bg-slate-950/50" />
        <Dialog.Content aria-describedby={description ? descriptionId : undefined}
          onOpenAutoFocus={() => { previousFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null; }}
          onCloseAutoFocus={(event) => {
            if (!trigger && previousFocus.current?.isConnected) {
              event.preventDefault();
              previousFocus.current.focus();
            }
          }}
          className={cn('fixed inset-0 z-[91] flex max-h-dvh flex-col bg-white shadow-xl sm:inset-auto sm:left-1/2 sm:top-1/2 sm:max-h-[85dvh] sm:w-[calc(100%-3rem)] sm:max-w-xl sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-xl', className)}>
          <div className="border-b border-slate-200 p-6 pr-20">
            <Dialog.Title className="text-xl font-bold text-slate-900">{title}</Dialog.Title>
            {description && <Dialog.Description id={descriptionId} className="mt-2 text-sm text-slate-600">{description}</Dialog.Description>}
          </div>
          <Dialog.Close aria-label="Đóng hộp thoại" className="absolute right-4 top-4 grid size-12 place-items-center rounded-xl text-slate-600 hover:bg-slate-100"><X size={22} aria-hidden="true" /></Dialog.Close>
          <div className="min-h-0 flex-1 overflow-y-auto p-6">{children}</div>
          {footer && <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200 p-6">{footer}</div>}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
