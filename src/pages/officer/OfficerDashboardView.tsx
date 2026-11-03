import React from 'react';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useAuthStore } from '@/stores/authStore';
import { getGreeting } from '@/lib/utils';
import { ListSkeleton } from '@/components/ui';
import {
  ArrowRight,
  CaretRight,
  Lightning,
  CheckCircle,
} from '@phosphor-icons/react';
import type { OfficerApplication, OfficerSection } from '@/types/officer';

interface OfficerDashboardViewProps {
  applications: OfficerApplication[];
  onSelectSection: (section: OfficerSection) => void;
  onOpenApplicationReview: (app: OfficerApplication) => void;
  onQuickPreview: (app: OfficerApplication) => void;
  isLoading?: boolean;
}

export const OfficerDashboardView: React.FC<OfficerDashboardViewProps> = ({
  applications,
  onSelectSection,
  onOpenApplicationReview,
  onQuickPreview,
  isLoading = false,
}) => {
  const { profile } = useUserProfile();
  const user = useAuthStore((state) => state.user);
  const officerName = profile?.fullName?.trim() || user?.username || 'Cán bộ Một cửa';

  // Hồ sơ gửi lại cần ưu tiên & hồ sơ có giấy tờ sẵn sàng
  // Chỉ cán bộ đang phụ trách mới nhận lại được hồ sơ công dân gửi lại.
  const resubmittedApps = applications.filter(
    (a) => a.status === 'RESUBMITTED' && Boolean(user?.id && a.assignedOfficerId?.toLowerCase() === user.id.toLowerCase())
  );
  const documentsReadyApps = applications.filter((a) => a.status === 'DOCUMENTS_READY');

  // Top hồ sơ gửi lại cần ưu tiên xem ngay (tối đa 2 hồ sơ để tổng quan không bị dài)
  const priorityResubmittedApps = resubmittedApps.slice(0, 2);

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          {getGreeting()}, Cán bộ {officerName}
        </h1>
      </div>

      {/* Hàng đợi ưu tiên và hồ sơ sẵn sàng */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hàng đợi ưu tiên */}
        <div className="lg:col-span-2 space-y-6">
          {/* Hàng đợi ưu tiên xử lý ngay (Gọn gàng, chỉ hiển thị top hồ sơ cần duyệt lại gấp) */}
          <section
            aria-labelledby="priority-action-heading"
            className="rounded-2xl border border-purple-200 bg-white p-5 shadow-2xs"
          >
            <div className="flex items-center justify-between border-b border-purple-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="grid size-8 place-items-center rounded-lg bg-purple-100 text-purple-800 font-bold">
                  <Lightning size={18} weight="fill" />
                </span>
                <div>
                  <h2 id="priority-action-heading" className="text-base font-bold text-slate-900">
                    Hồ sơ ưu tiên xử lý ngay ({resubmittedApps.length})
                  </h2>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onSelectSection('apps-resubmitted')}
                className="text-xs font-bold text-purple-700 hover:underline inline-flex items-center gap-1"
              >
                <span>Xem tất cả ({resubmittedApps.length})</span>
                <CaretRight size={14} aria-hidden="true" />
              </button>
            </div>

            {isLoading ? (
              <div className="py-2">
                <ListSkeleton rows={2} />
              </div>
            ) : priorityResubmittedApps.length === 0 ? (
              <p className="py-4 text-center text-xs text-slate-500">Không có hồ sơ nào cần xử lý gấp.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {priorityResubmittedApps.map((app) => (
                  <li key={app.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-purple-50/50 p-2 rounded-xl transition-colors">
                    <div className="flex items-start gap-3 min-w-0">
                      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-purple-100 text-purple-800 text-xs font-bold">
                        V{app.currentVersion}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <strong className="text-sm font-bold text-purple-950 font-mono">
                            {app.applicationNumber}
                          </strong>
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-purple-100 text-purple-900 border border-purple-200">
                            Công dân vừa bổ sung
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-slate-800 truncate mt-0.5">
                          {app.citizen.fullName} · {app.procedureName}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Nộp lại lúc: {app.submittedAt}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => onQuickPreview(app)}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Quick Preview
                      </button>
                      <button
                        type="button"
                        onClick={() => onOpenApplicationReview(app)}
                        className="px-3 py-1.5 rounded-lg bg-purple-700 text-xs font-bold text-white hover:bg-purple-800 shadow-2xs"
                      >
                        Review lại ngay
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* Cột 3 (1/3 width): Tổng quan các chức năng chính & Ca trực */}
        <div className="space-y-6">
          {/* Card Hồ sơ giấy tờ sẵn sàng nộp UBND */}
          <section
            aria-labelledby="desk-action-heading"
            className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50/70 to-teal-50/40 p-5 shadow-2xs space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="grid size-8 place-items-center rounded-lg bg-emerald-100 text-emerald-800">
                  <CheckCircle size={18} weight="bold" />
                </span>
                <h2 id="desk-action-heading" className="text-sm font-bold text-emerald-950">
                  Giấy tờ sẵn sàng nộp UBND
                </h2>
              </div>
              <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-emerald-100 text-emerald-900 border border-emerald-200">
                {isLoading ? '…' : documentsReadyApps.length} hồ sơ giấy tờ sẵn sàng
              </span>
            </div>
            <button
              type="button"
              onClick={() => onSelectSection('apps-approved')}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-800 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-900 transition-colors shadow-2xs"
            >
              <span>Xem danh sách hồ sơ sẵn sàng</span>
              <ArrowRight size={14} aria-hidden="true" />
            </button>
          </section>

        </div>
      </div>
    </div>
  );
};
