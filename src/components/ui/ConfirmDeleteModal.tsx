import type { ReactNode } from 'react';
import { Trash } from '@phosphor-icons/react';
import { Modal } from './Modal';
import { Button } from './Button';

export interface ConfirmDeleteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  itemName?: string;
  description?: string;
  warningNote?: string;
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
  confirmLabel?: string;
  children?: ReactNode;
}

export function ConfirmDeleteModal({
  open,
  onOpenChange,
  title = 'Xác nhận xóa',
  itemName,
  description,
  warningNote,
  loading = false,
  onConfirm,
  confirmLabel = 'Xác nhận xóa',
  children,
}: ConfirmDeleteModalProps) {
  return (
    <Modal
      open={open}
      onOpenChange={(next) => {
        if (!loading) onOpenChange(next);
      }}
      title={title}
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            disabled={loading}
            onClick={() => onOpenChange(false)}
          >
            Hủy bỏ
          </Button>
          <Button
            type="button"
            loading={loading}
            disabled={loading}
            className="bg-red-700 text-white hover:bg-red-800"
            onClick={onConfirm}
          >
            <Trash size={18} weight="bold" />
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <p className="text-sm text-slate-700">
          Bạn có chắc chắn muốn xóa{' '}
          {itemName ? <strong className="font-semibold text-slate-900">“{itemName}”</strong> : 'mục này'}?
        </p>

        {description && (
          <p className="text-xs text-slate-500 leading-relaxed">
            {description}
          </p>
        )}

        {warningNote && (
          <p className="text-xs font-medium text-amber-700">
            {warningNote}
          </p>
        )}

        {children}
      </div>
    </Modal>
  );
}
