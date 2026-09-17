import React from 'react';
import {
  Clock,
  CheckCircle,
  WarningCircle,
  ArrowClockwise,
  SealCheck,
  BuildingOffice,
  Checks,
  FileText,
  Prohibit,
} from '@phosphor-icons/react';
import type { ApplicationStatus } from '@/types/application';

interface ApplicationStatusBadgeProps {
  status: ApplicationStatus;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

interface StatusConfig {
  label: string;
  shortLabel: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
  dotClass: string;
  icon: typeof Clock;
  description: string;
}

export const STATUS_CONFIG: Record<ApplicationStatus, StatusConfig> = {
  DRAFT: {
    label: 'Bản nháp',
    shortLabel: 'Bản nháp',
    bgClass: 'bg-slate-100',
    textClass: 'text-slate-700',
    borderClass: 'border-slate-200',
    dotClass: 'bg-slate-400',
    icon: FileText,
    description: 'Hồ sơ đang chuẩn bị, chưa gửi cán bộ',
  },
  SUBMITTED_FOR_REVIEW: {
    label: 'Chờ kiểm tra',
    shortLabel: 'Chờ kiểm tra',
    bgClass: 'bg-sky-50',
    textClass: 'text-sky-800',
    borderClass: 'border-sky-200',
    dotClass: 'bg-sky-500',
    icon: Clock,
    description: 'Đã gửi hồ sơ điện tử, đang đợi cán bộ thụ lý',
  },
  UNDER_REVIEW: {
    label: 'Đang tiền kiểm',
    shortLabel: 'Đang tiền kiểm',
    bgClass: 'bg-indigo-50',
    textClass: 'text-indigo-800',
    borderClass: 'border-indigo-200',
    dotClass: 'bg-indigo-500 animate-pulse',
    icon: ArrowClockwise,
    description: 'Cán bộ Một cửa đang rà soát thông tin & tài liệu',
  },
  NEED_REVISION: {
    label: 'Cần bổ sung',
    shortLabel: 'Cần bổ sung',
    bgClass: 'bg-amber-50',
    textClass: 'text-amber-800',
    borderClass: 'border-amber-300',
    dotClass: 'bg-amber-500',
    icon: WarningCircle,
    description: 'Cán bộ đã phản hồi yêu cầu điều chỉnh thông tin hoặc tài liệu',
  },
  RESUBMITTED: {
    label: 'Đã gửi bổ sung',
    shortLabel: 'Gửi bổ sung',
    bgClass: 'bg-cyan-50',
    textClass: 'text-cyan-800',
    borderClass: 'border-cyan-200',
    dotClass: 'bg-cyan-500',
    icon: ArrowClockwise,
    description: 'Công dân đã cập nhật hồ sơ và gửi lại để kiểm tra',
  },
  APPROVED: {
    label: 'Đã duyệt tiền kiểm',
    shortLabel: 'Đã duyệt',
    bgClass: 'bg-emerald-50',
    textClass: 'text-emerald-800',
    borderClass: 'border-emerald-300',
    dotClass: 'bg-emerald-500',
    icon: SealCheck,
    description: 'Hồ sơ đạt yêu cầu, mã QR đã được tạo',
  },
  READY_TO_SUBMIT: {
    label: 'Sẵn sàng nộp',
    shortLabel: 'Sẵn sàng nộp',
    bgClass: 'bg-teal-50',
    textClass: 'text-teal-800',
    borderClass: 'border-teal-300',
    dotClass: 'bg-teal-500',
    icon: CheckCircle,
    description: 'Đã chuẩn bị hồ sơ giấy và mã QR sẵn sàng mang đến UBND',
  },
  OFFICIALLY_RECEIVED: {
    label: 'Đã tiếp nhận chính thức',
    shortLabel: 'Đã tiếp nhận',
    bgClass: 'bg-blue-50',
    textClass: 'text-blue-900 font-bold',
    borderClass: 'border-blue-300',
    dotClass: 'bg-blue-600',
    icon: BuildingOffice,
    description: 'Cán bộ đã đối chiếu hồ sơ giấy tại bộ phận Một cửa UBND',
  },
  COMPLETED: {
    label: 'Hoàn thành',
    shortLabel: 'Hoàn thành',
    bgClass: 'bg-emerald-100',
    textClass: 'text-emerald-900 font-bold',
    borderClass: 'border-emerald-400',
    dotClass: 'bg-emerald-600',
    icon: Checks,
    description: 'Thủ tục hành chính đã được xử lý và trả kết quả',
  },
  CANCELLED: {
    label: 'Đã hủy',
    shortLabel: 'Đã hủy',
    bgClass: 'bg-rose-50',
    textClass: 'text-rose-800',
    borderClass: 'border-rose-200',
    dotClass: 'bg-rose-400',
    icon: Prohibit,
    description: 'Hồ sơ đã bị hủy bởi công dân hoặc cán bộ',
  },
};

export const ApplicationStatusBadge: React.FC<ApplicationStatusBadgeProps> = ({
  status,
  size = 'md',
  showIcon = true,
  className = '',
}) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.DRAFT;
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 gap-1.5 min-h-[22px]',
    md: 'text-xs px-2.5 py-1 gap-1.5 min-h-[26px]',
    lg: 'text-sm px-3.5 py-1.5 gap-2 min-h-[32px]',
  }[size];

  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 16,
  }[size];

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-full border ${config.bgClass} ${config.textClass} ${config.borderClass} ${sizeClasses} ${className}`}
      title={config.description}
    >
      <span className={`size-1.5 rounded-full ${config.dotClass}`} aria-hidden="true" />
      {showIcon && <Icon size={iconSizes} weight="bold" aria-hidden="true" />}
      <span className="truncate">{config.label}</span>
    </span>
  );
};
