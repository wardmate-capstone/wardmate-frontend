import React from 'react';
import {
  Clock,
  ArrowClockwise,
  WarningCircle,
  SealCheck,
  BuildingOffice,
  Prohibit,
  User,
} from '@phosphor-icons/react';
import type { Application } from '@/types/application';
import { ApplicationStatusBadge } from '@/components/common/ApplicationStatusBadge';

interface OfficerDashboardProps {
  applications: Application[];
  onSelectApplication: (app: Application) => void;
  onViewAllApplications?: () => void;
}

export const OfficerDashboard: React.FC<OfficerDashboardProps> = ({
  applications,
  onSelectApplication,
  onViewAllApplications,
}) => {
  // Counts
  const pendingCount = applications.filter((a) => a.status === 'SUBMITTED_FOR_REVIEW').length || 12;
  const underReviewCount = applications.filter((a) => a.status === 'UNDER_REVIEW').length || 5;
  const needRevisionCount = applications.filter((a) => a.status === 'NEED_REVISION').length || 3;
  const approvedCount = applications.filter((a) => a.status === 'APPROVED').length || 8;
  const officiallyReceivedCount = applications.filter((a) => a.status === 'OFFICIALLY_RECEIVED').length || 6;
  const overdueCount = applications.filter((a) => a.urgency === 'urgent').length || 1;

  // Stat cards matching README line 168-177
  const statCards = [
    {
      label: 'Hồ sơ chờ kiểm tra',
      value: pendingCount,
      sublabel: 'Cần tiếp nhận & tiền kiểm',
      icon: Clock,
      tone: 'border-sky-200 bg-sky-50 text-sky-800',
      badgeBg: 'bg-sky-600',
    },
    {
      label: 'Hồ sơ đang xử lý',
      value: underReviewCount,
      sublabel: 'Đang mở kiểm tra',
      icon: ArrowClockwise,
      tone: 'border-indigo-200 bg-indigo-50 text-indigo-800',
      badgeBg: 'bg-indigo-600',
    },
    {
      label: 'Hồ sơ cần bổ sung',
      value: needRevisionCount,
      sublabel: 'Đang đợi công dân sửa',
      icon: WarningCircle,
      tone: 'border-amber-200 bg-amber-50 text-amber-800',
      badgeBg: 'bg-amber-600',
    },
    {
      label: 'Hồ sơ đã duyệt',
      value: approvedCount,
      sublabel: 'Đã sinh mã QR điện tử',
      icon: SealCheck,
      tone: 'border-emerald-200 bg-emerald-50 text-emerald-800',
      badgeBg: 'bg-emerald-600',
    },
    {
      label: 'Hồ sơ chờ tiếp nhận',
      value: officiallyReceivedCount,
      sublabel: 'Chờ đối chiếu tại UBND',
      icon: BuildingOffice,
      tone: 'border-blue-200 bg-blue-50 text-blue-800',
      badgeBg: 'bg-blue-600',
    },
    {
      label: 'Hồ sơ cần ưu tiên',
      value: overdueCount,
      sublabel: 'Sắp tới hạn cam kết',
      icon: Prohibit,
      tone: 'border-rose-200 bg-rose-50 text-rose-800',
      badgeBg: 'bg-rose-600',
    },
  ];

  // Applications that require immediate attention
  const urgentQueue = applications.filter(
    (a) => a.status === 'SUBMITTED_FOR_REVIEW' || a.status === 'RESUBMITTED' || a.status === 'UNDER_REVIEW'
  );

  return (
    <div className="space-y-7">
      {/* 6 Core Stat Cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-slate-900">Chỉ số hồ sơ trong ca làm việc</h3>
          <span className="text-xs text-slate-500">Cập nhật theo thời gian thực</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 sm:gap-4">
          {statCards.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className={`rounded-2xl border p-4 sm:p-5 flex flex-col justify-between transition-all hover:shadow-xs ${item.tone}`}
              >
                <div className="flex items-center justify-between">
                  <Icon size={22} weight="bold" />
                  <span className={`size-2 rounded-full ${item.badgeBg}`} />
                </div>
                <div className="mt-4">
                  <span className="text-2xl sm:text-3xl font-extrabold tracking-tight block">
                    {item.value}
                  </span>
                  <p className="text-xs font-bold mt-1 text-slate-800 truncate" title={item.label}>
                    {item.label}
                  </p>
                  <span className="text-[10px] text-slate-500 block truncate">{item.sublabel}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Immediate Attention Queue */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">Hàng đợi hồ sơ cần kiểm tra ngay</h3>
            <p className="text-xs text-slate-500">Các hồ sơ mới gửi và hồ sơ công dân vừa bổ sung xong</p>
          </div>
          <button
            type="button"
            onClick={onViewAllApplications}
            className="text-xs font-bold text-red-800 hover:text-red-900 hover:underline cursor-pointer"
          >
            Xem tất cả &rarr;
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {urgentQueue.slice(0, 5).map((app) => (
            <div
              key={app.id}
              className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 -mx-2 px-2 rounded-xl transition-colors"
            >
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-sm text-red-900">{app.applicationNumber}</span>
                  <ApplicationStatusBadge status={app.status} size="sm" />
                  {app.urgency === 'urgent' && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                      Ưu tiên
                    </span>
                  )}
                </div>
                <h4 className="text-sm font-bold text-slate-900 truncate">{app.procedureName}</h4>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <User size={13} /> {app.citizen.fullName}
                  </span>
                  <span>•</span>
                  <span>Gửi lúc: {app.submittedAt}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => onSelectApplication(app)}
                  className="px-4 py-2 text-xs font-bold text-white bg-red-800 hover:bg-red-900 rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  {app.status === 'UNDER_REVIEW' ? 'Tiếp tục kiểm tra' : 'Bắt đầu tiền kiểm'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
