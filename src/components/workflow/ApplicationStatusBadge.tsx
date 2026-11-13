import type { Icon } from '@phosphor-icons/react';
import {
  ArrowCounterClockwise,
  CheckCircle,
  ClockCounterClockwise,
  FileText,
  Hourglass,
  Prohibit,
  SealCheck,
  WarningCircle,
  XCircle,
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { workflowStatusLabel } from '@/lib/api/workflowAdapters';

type Tone = { label: string; className: string; icon?: Icon };

// Mỗi trạng thái hồ sơ cố định một màu ở mọi màn cán bộ/quản lý.
// Nhận cả mã của API (SUBMITTED) lẫn mã nội bộ màn cán bộ (SUBMITTED_FOR_REVIEW).
const TONES: Record<string, Tone> = {
  SUBMITTED: { label: 'Chờ tiền kiểm', className: 'border-amber-200 bg-amber-50 text-amber-800', icon: Hourglass },
  SUBMITTED_FOR_REVIEW: { label: 'Chờ tiền kiểm', className: 'border-amber-200 bg-amber-50 text-amber-800', icon: Hourglass },
  UNDER_REVIEW: { label: 'Đang kiểm tra', className: 'border-blue-200 bg-blue-50 text-blue-800', icon: ClockCounterClockwise },
  NEED_REVISION: { label: 'Cần bổ sung', className: 'border-rose-200 bg-rose-50 text-rose-800', icon: WarningCircle },
  RESUBMITTED: { label: 'Đã gửi lại', className: 'border-purple-300 bg-purple-50 text-purple-900', icon: ArrowCounterClockwise },
  DOCUMENTS_READY: { label: 'Giấy tờ sẵn sàng', className: 'border-emerald-200 bg-emerald-50 text-emerald-800', icon: CheckCircle },
  APPROVED: { label: 'Đã duyệt', className: 'border-emerald-200 bg-emerald-50 text-emerald-800', icon: CheckCircle },
  READY_TO_SUBMIT: { label: 'Chờ tiếp nhận', className: 'border-teal-200 bg-teal-50 text-teal-800', icon: FileText },
  OFFICIALLY_RECEIVED: { label: 'Đã tiếp nhận tại quầy', className: 'border-slate-200 bg-slate-100 text-slate-800', icon: SealCheck },
  REJECTED: { label: 'Đã từ chối', className: 'border-red-200 bg-red-50 text-red-800', icon: XCircle },
  CANCELLED: { label: 'Đã hủy', className: 'border-slate-200 bg-slate-100 text-slate-600', icon: Prohibit },
  DRAFT: { label: 'Bản nháp', className: 'border-slate-200 bg-slate-100 text-slate-600' },
};

/** Nhãn trạng thái hồ sơ dùng chung: màu + icon + chữ theo mã trạng thái */
export function ApplicationStatusBadge({ status, label, className }: {
  status: string;
  /** Ghi đè chữ hiển thị (ví dụ "Ưu tiên · Đã gửi lại"); màu vẫn theo trạng thái */
  label?: string;
  className?: string;
}) {
  const tone = TONES[(status || '').toUpperCase()];
  const IconComponent = tone?.icon;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold',
        tone?.className ?? 'border-slate-200 bg-slate-100 text-slate-700',
        className,
      )}
    >
      {IconComponent && <IconComponent size={14} weight="bold" aria-hidden="true" />}
      <span>{label || tone?.label || workflowStatusLabel(status)}</span>
    </span>
  );
}
