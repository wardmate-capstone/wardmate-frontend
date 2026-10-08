import React from 'react';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useAuthStore } from '@/stores/authStore';
import { getGreeting } from '@/lib/utils';
import {
  FileText,
  ArrowRight,
  CaretRight,
  TrendUp,
  UserCircle,
  ChartBar,
  Lightning,
  Check,
} from '@phosphor-icons/react';
import type { OfficerApplication, OfficerSection } from '@/types/officer';

interface OfficerDashboardViewProps {
  applications: OfficerApplication[];
  onSelectSection: (section: OfficerSection) => void;
  onOpenApplicationReview: (app: OfficerApplication) => void;
  onQuickPreview: (app: OfficerApplication) => void;
}

export const OfficerDashboardView: React.FC<OfficerDashboardViewProps> = ({
  applications,
  onSelectSection,
  onOpenApplicationReview,
  onQuickPreview,
}) => {
  const { profile } = useUserProfile();
  const user = useAuthStore((state) => state.user);
  const officerName = profile?.fullName?.trim() || user?.username || 'Lê Thu Hà';

  // Hồ sơ gửi lại cần ưu tiên & hồ sơ chờ tiếp nhận
  const resubmittedApps = applications.filter((a) => a.status === 'RESUBMITTED');
  const readySubmitApps = applications.filter((a) => a.status === 'READY_TO_SUBMIT');

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

      {/* Main Grid: Biểu đồ luồng xử lý & Tổng quan chức năng chính */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cột 1 & 2 (2/3 width): Biểu đồ xử lý hồ sơ & Hàng đợi ưu tiên */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card Biểu đồ — API sẽ được tích hợp sau */}
          <section
            aria-labelledby="chart-heading"
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="grid size-8 place-items-center rounded-lg bg-red-50 text-red-800">
                  <ChartBar size={18} weight="bold" />
                </span>
                <div>
                  <h2 id="chart-heading" className="text-base font-bold text-slate-900">
                    Tiến độ xử lý hồ sơ trong ca trực
                  </h2>
                </div>
              </div>
            </div>

            {/* API thống kê luồng xử lý hồ sơ theo khung giờ sẽ được tích hợp sau */}
            <div className="flex items-center justify-center h-64 text-sm text-slate-400 italic">
              ⚠️ API thống kê tiến độ xử lý hồ sơ ca trực sẽ được tích hợp sau.
            </div>
          </section>

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
                  <h3 id="priority-action-heading" className="text-base font-bold text-slate-900">
                    Hồ sơ ưu tiên xử lý ngay ({resubmittedApps.length})
                  </h3>
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

            {priorityResubmittedApps.length === 0 ? (
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
                            Công dân vừa bổ sung V2
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
          {/* Card Tiếp nhận tại quầy (Chức năng cốt lõi của Officer) */}
          <section
            aria-labelledby="desk-action-heading"
            className="rounded-2xl border border-teal-200 bg-gradient-to-br from-teal-50/70 to-emerald-50/40 p-5 shadow-2xs space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="grid size-8 place-items-center rounded-lg bg-teal-100 text-teal-800">
                  <FileText size={18} weight="bold" />
                </span>
                <h3 id="desk-action-heading" className="text-sm font-bold text-teal-950">
                  Tiếp nhận hồ sơ tại quầy
                </h3>
              </div>
              <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-teal-100 text-teal-900 border border-teal-200">
                {readySubmitApps.length} chờ tiếp nhận
              </span>
            </div>
            <button
              type="button"
              onClick={() => onSelectSection('receipt-waiting')}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-teal-800 px-4 py-2.5 text-xs font-bold text-white hover:bg-teal-900 transition-colors shadow-2xs"
            >
              <span>Tiếp nhận tại quầy</span>
              <ArrowRight size={14} aria-hidden="true" />
            </button>
          </section>

          {/* Card Hiệu suất ca làm việc — API sẽ được tích hợp sau */}
          <section
            aria-labelledby="performance-heading"
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <TrendUp size={20} className="text-emerald-700" weight="bold" />
                <h3 id="performance-heading" className="text-sm font-bold text-slate-900">
                  Chỉ số hiệu suất ca trực
                </h3>
              </div>
            </div>
            <div className="flex items-center justify-center py-6 text-sm text-slate-400 italic">
              ⚠️ API chỉ số hiệu suất cán bộ sẽ được tích hợp sau.
            </div>
          </section>

          {/* Card Thông tin ca trực & Phân công */}
          <section
            aria-labelledby="officer-duty-heading"
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-3"
          >
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <UserCircle size={20} className="text-slate-700" weight="bold" />
              <h3 id="officer-duty-heading" className="text-sm font-bold text-slate-900">
                Thông tin quầy làm việc
              </h3>
            </div>
            <dl className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <dt className="text-slate-500">Cán bộ phụ trách:</dt>
                <dd className="font-bold text-slate-900">{officerName}</dd>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <dt className="text-slate-500">Vị trí:</dt>
                <dd className="font-semibold text-slate-800 italic text-slate-400">⚠️ API sẽ tích hợp sau</dd>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <dt className="text-slate-500">Lĩnh vực:</dt>
                <dd className="font-medium text-slate-400 italic">⚠️ API sẽ tích hợp sau</dd>
              </div>
              <div className="flex justify-between py-1">
                <dt className="text-slate-500">Trạng thái quầy:</dt>
                <dd className="font-semibold text-emerald-700 inline-flex items-center gap-1">
                  <Check size={12} weight="bold" /> Đang nhận tiếp dân
                </dd>
              </div>
            </dl>
          </section>
        </div>
      </div>
    </div>
  );
};
