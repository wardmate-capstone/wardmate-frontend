import React from 'react';
import {
  Hourglass,
  ClockCounterClockwise,
  WarningCircle,
  ArrowCounterClockwise,
  CheckCircle,
  FileText,
  Tray,
  ArrowRight,
  CaretRight,
  Lightning,
  Sparkle,
  TrendUp,
  UserCircle,
} from '@phosphor-icons/react';
import type { OfficerApplication, OfficerSection } from '@/types/officer';

interface OfficerDashboardViewProps {
  applications: OfficerApplication[];
  onSelectSection: (section: OfficerSection) => void;
  onOpenApplicationReview: (app: OfficerApplication) => void;
  onQuickPreview: (app: OfficerApplication) => void;
  onTakeApplication: (appId: string) => void;
}

export const OfficerDashboardView: React.FC<OfficerDashboardViewProps> = ({
  applications,
  onSelectSection,
  onOpenApplicationReview,
  onQuickPreview,
  onTakeApplication,
}) => {
  // Counts by status
  const pendingApps = applications.filter((a) => a.status === 'SUBMITTED_FOR_REVIEW');
  const reviewingApps = applications.filter((a) => a.status === 'UNDER_REVIEW');
  const needRevisionApps = applications.filter((a) => a.status === 'NEED_REVISION');
  const resubmittedApps = applications.filter((a) => a.status === 'RESUBMITTED');
  const approvedApps = applications.filter((a) => a.status === 'APPROVED');
  const readySubmitApps = applications.filter((a) => a.status === 'READY_TO_SUBMIT');

  const statCards = [
    {
      id: 'apps-pending' as OfficerSection,
      label: 'Chờ tiền kiểm',
      count: pendingApps.length,
      note: 'Cần tiếp nhận kiểm tra',
      icon: Hourglass,
      tone: 'amber',
      bgClass: 'bg-amber-50 text-amber-800 border-amber-200 hover:border-amber-300',
      badgeClass: 'bg-amber-100 text-amber-900',
    },
    {
      id: 'apps-reviewing' as OfficerSection,
      label: 'Đang kiểm tra',
      count: reviewingApps.length,
      note: 'Hồ sơ đang xử lý',
      icon: ClockCounterClockwise,
      tone: 'blue',
      bgClass: 'bg-blue-50 text-blue-800 border-blue-200 hover:border-blue-300',
      badgeClass: 'bg-blue-100 text-blue-900',
    },
    {
      id: 'apps-need-revision' as OfficerSection,
      label: 'Cần bổ sung',
      count: needRevisionApps.length,
      note: 'Chờ người dân chỉnh sửa',
      icon: WarningCircle,
      tone: 'rose',
      bgClass: 'bg-rose-50 text-rose-800 border-rose-200 hover:border-rose-300',
      badgeClass: 'bg-rose-100 text-rose-900',
    },
    {
      id: 'apps-resubmitted' as OfficerSection,
      label: 'Đã gửi lại',
      count: resubmittedApps.length,
      note: 'Người dân vừa cập nhật V2',
      icon: ArrowCounterClockwise,
      tone: 'purple',
      bgClass: 'bg-purple-50 text-purple-800 border-purple-200 hover:border-purple-300',
      badgeClass: 'bg-purple-100 text-purple-900 font-bold ring-2 ring-purple-300',
    },
    {
      id: 'apps-approved' as OfficerSection,
      label: 'Đã duyệt tiền kiểm',
      count: approvedApps.length,
      note: 'Hồ sơ đạt yêu cầu',
      icon: CheckCircle,
      tone: 'emerald',
      bgClass: 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:border-emerald-300',
      badgeClass: 'bg-emerald-100 text-emerald-900',
    },
    {
      id: 'apps-ready-submit' as OfficerSection,
      label: 'Chờ tiếp nhận',
      count: readySubmitApps.length,
      note: 'Sẵn sàng nộp tại quầy',
      icon: FileText,
      tone: 'teal',
      bgClass: 'bg-teal-50 text-teal-800 border-teal-200 hover:border-teal-300',
      badgeClass: 'bg-teal-100 text-teal-900',
    },
    {
      id: 'receipt-received' as OfficerSection,
      label: 'Đã tiếp nhận hôm nay',
      count: 20, // fixed benchmark metric from Officer.md
      note: 'Hồ sơ giấy đã hoàn tất',
      icon: Tray,
      tone: 'slate',
      bgClass: 'bg-slate-50 text-slate-800 border-slate-200 hover:border-slate-300',
      badgeClass: 'bg-slate-200 text-slate-900',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <section
        aria-label="Thông báo đầu ca trực"
        className="relative overflow-hidden rounded-2xl border border-red-200 bg-gradient-to-r from-red-900 via-red-800 to-red-950 p-6 text-white shadow-sm"
      >
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gold-300">
              <Sparkle size={16} aria-hidden="true" />
              <span>Ca làm việc sáng 21/09/2026 · Quầy Một cửa số 02</span>
            </div>
            <h2 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
              Chào buổi sáng, Cán bộ Lê Thu Hà
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-red-100/90 leading-6">
              Hệ thống ghi nhận <strong className="text-white underline decoration-gold-400">{resubmittedApps.length} hồ sơ</strong> người dân vừa bổ sung lại và <strong className="text-white underline decoration-gold-400">{pendingApps.length} hồ sơ mới</strong> đang chờ tiếp nhận tiền kiểm.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => onSelectSection('apps-resubmitted')}
              className="inline-flex items-center gap-2 rounded-xl bg-gold-400 px-4 py-2.5 text-sm font-bold text-red-950 shadow-sm hover:bg-gold-300 transition-transform active:scale-95"
            >
              <Lightning size={18} weight="fill" aria-hidden="true" />
              <span>Xử lý hồ sơ gửi lại</span>
            </button>
            <button
              type="button"
              onClick={() => onSelectSection('receipt-waiting')}
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/20 transition-colors"
            >
              <span>Tiếp nhận tại quầy</span>
              <ArrowRight size={16} aria-hidden="true" />
            </button>
          </div>
        </div>
      </section>

      {/* 7 KPI Stat Cards */}
      <section aria-labelledby="kpi-heading">
        <div className="flex items-center justify-between mb-4">
          <h2 id="kpi-heading" className="text-lg font-bold text-slate-900">
            Chỉ số phân luồng hồ sơ
          </h2>
          <span className="text-xs text-slate-500 font-medium">Bấm vào thẻ để lọc danh sách tương ứng</span>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <button
                key={card.id}
                type="button"
                onClick={() => onSelectSection(card.id)}
                className={`group flex flex-col justify-between rounded-xl border p-4 text-left transition-all hover:shadow-md hover:-translate-y-0.5 ${card.bgClass}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="grid size-9 place-items-center rounded-lg bg-white/80 shadow-2xs">
                    <Icon size={20} weight="bold" aria-hidden="true" />
                  </span>
                  <span className={`px-2 py-0.5 text-xs rounded-full border ${card.badgeClass}`}>
                    {card.count}
                  </span>
                </div>

                <div className="mt-4">
                  <span className="block text-2xl font-bold tracking-tight tabular-nums">
                    {card.count}
                  </span>
                  <strong className="block text-xs font-bold truncate mt-0.5">
                    {card.label}
                  </strong>
                  <span className="block text-[10px] text-slate-500 mt-1 truncate">
                    {card.note}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Two Column Layout: Urgent Items & Performance Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Priority queues (Resubmitted & Pending) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Resubmitted Section */}
          <section
            aria-labelledby="resubmitted-heading"
            className="rounded-2xl border border-purple-200 bg-white p-5 shadow-2xs"
          >
            <div className="flex items-center justify-between border-b border-purple-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="grid size-8 place-items-center rounded-lg bg-purple-100 text-purple-800 font-bold">
                  <ArrowCounterClockwise size={18} weight="bold" />
                </span>
                <div>
                  <h3 id="resubmitted-heading" className="text-base font-bold text-slate-900">
                    Hồ sơ vừa được người dân gửi lại ({resubmittedApps.length})
                  </h3>
                  <p className="text-xs text-slate-500">Ưu tiên tiền kiểm lại sau khi công dân đã sửa theo góp ý</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onSelectSection('apps-resubmitted')}
                className="text-xs font-bold text-purple-700 hover:underline inline-flex items-center gap-1"
              >
                <span>Xem tất cả</span>
                <CaretRight size={14} aria-hidden="true" />
              </button>
            </div>

            {resubmittedApps.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-500">Không có hồ sơ nào vừa gửi lại.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {resubmittedApps.map((app) => (
                  <li key={app.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-purple-50/50 p-2 rounded-xl transition-colors">
                    <div className="flex items-start gap-3 min-w-0">
                      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-purple-100 text-purple-800 text-xs font-bold">
                        V{app.currentVersion}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <strong className="text-sm font-bold text-purple-950 font-mono">
                            {app.applicationNumber}
                          </strong>
                          <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-purple-100 text-purple-900 border border-purple-200">
                            Người dân vừa cập nhật V2
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-slate-800 truncate mt-0.5">
                          {app.citizen.fullName} · {app.procedureName}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Gửi lại lúc: {app.submittedAt} · Phiên bản: V{app.currentVersion}
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

          {/* New Pending Applications Section */}
          <section
            aria-labelledby="pending-heading"
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="grid size-8 place-items-center rounded-lg bg-amber-100 text-amber-800 font-bold">
                  <Hourglass size={18} weight="bold" />
                </span>
                <div>
                  <h3 id="pending-heading" className="text-base font-bold text-slate-900">
                    Hồ sơ chờ tiếp nhận kiểm tra ({pendingApps.length})
                  </h3>
                  <p className="text-xs text-slate-500">Nhận xử lý để chuyển trạng thái Đang kiểm tra</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onSelectSection('apps-pending')}
                className="text-xs font-bold text-red-800 hover:underline inline-flex items-center gap-1"
              >
                <span>Xem tất cả</span>
                <CaretRight size={14} aria-hidden="true" />
              </button>
            </div>

            {pendingApps.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-500">Hiện không có hồ sơ mới chờ kiểm tra.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {pendingApps.map((app) => (
                  <li key={app.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 p-2 rounded-xl transition-colors">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <strong className="text-sm font-bold text-slate-900 font-mono">
                          {app.applicationNumber}
                        </strong>
                        {app.urgency === 'urgent' && (
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-red-100 text-red-800">
                            Cần gấp
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-semibold text-slate-800 truncate mt-0.5">
                        {app.citizen.fullName} · {app.procedureName}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Nộp lúc: {app.submittedAt}
                      </p>
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
                        onClick={() => onTakeApplication(app.id)}
                        className="px-3 py-1.5 rounded-lg bg-red-800 text-xs font-bold text-white hover:bg-red-900 shadow-2xs"
                      >
                        Nhận xử lý
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* Right 1 Col: Performance, Desk Info & Fast Links */}
        <div className="space-y-6">
          {/* Performance Card */}
          <section
            aria-labelledby="performance-heading"
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4"
          >
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <TrendUp size={20} className="text-emerald-700" weight="bold" />
              <h3 id="performance-heading" className="text-base font-bold text-slate-900">
                Hiệu suất ca làm việc
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
                <span className="block text-2xl font-bold text-slate-900 font-mono">14.2</span>
                <span className="block text-[11px] text-slate-500 font-medium">Phút / hồ sơ TB</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
                <span className="block text-2xl font-bold text-emerald-700 font-mono">94%</span>
                <span className="block text-[11px] text-slate-500 font-medium">Tỷ lệ đúng hẹn</span>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Số hồ sơ đã giải quyết hôm nay</span>
                <strong className="text-slate-900 font-bold">20 hồ sơ</strong>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-red-800 h-full w-[78%] rounded-full" />
              </div>
              <p className="text-[11px] text-slate-400 text-right">Đạt 78% chỉ tiêu ca trực (mục tiêu: 25)</p>
            </div>
          </section>

          {/* Ready for Official Receipt fast block */}
          <section
            aria-labelledby="desk-action-heading"
            className="rounded-2xl border border-teal-200 bg-teal-50/50 p-5 shadow-2xs space-y-3"
          >
            <div className="flex items-center gap-2">
              <FileText size={20} className="text-teal-800" weight="bold" />
              <h3 id="desk-action-heading" className="text-sm font-bold text-teal-950">
                Tiếp nhận hồ sơ trực tiếp
              </h3>
            </div>
            <p className="text-xs text-teal-800 leading-5">
              Khi người dân mang hồ sơ giấy đến quầy, sử dụng chức năng tra cứu để đối chiếu các bản chính và cấp biên nhận chính thức.
            </p>
            <button
              type="button"
              onClick={() => onSelectSection('receipt-waiting')}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-teal-800 px-4 py-2.5 text-xs font-bold text-white hover:bg-teal-900 transition-colors shadow-2xs"
            >
              <span>Mở quầy tiếp nhận hồ sơ</span>
              <ArrowRight size={14} aria-hidden="true" />
            </button>
          </section>

          {/* Desk Assigned Officer */}
          <section
            aria-labelledby="officer-duty-heading"
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-3"
          >
            <div className="flex items-center gap-2">
              <UserCircle size={20} className="text-slate-700" weight="bold" />
              <h3 id="officer-duty-heading" className="text-sm font-bold text-slate-900">
                Thông tin ca trực
              </h3>
            </div>
            <dl className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <dt className="text-slate-500">Cán bộ phụ trách:</dt>
                <dd className="font-bold text-slate-900">Lê Thu Hà</dd>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <dt className="text-slate-500">Vị trí làm việc:</dt>
                <dd className="font-semibold text-slate-800">Quầy Một cửa 02</dd>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <dt className="text-slate-500">Thời gian ca trực:</dt>
                <dd className="font-medium text-slate-800">07:30 - 11:30 | 13:30 - 17:00</dd>
              </div>
              <div className="flex justify-between py-1">
                <dt className="text-slate-500">Lĩnh vực thụ lý:</dt>
                <dd className="font-medium text-slate-800">Hộ tịch & Chứng thực</dd>
              </div>
            </dl>
          </section>
        </div>
      </div>
    </div>
  );
};
