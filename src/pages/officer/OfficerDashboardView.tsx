import React, { useState } from 'react';
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
  TrendUp,
  UserCircle,
  ChartBar,
  Lightning,
  Check,
} from '@phosphor-icons/react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { OfficerApplication, OfficerSection } from '@/types/officer';

interface OfficerDashboardViewProps {
  applications: OfficerApplication[];
  onSelectSection: (section: OfficerSection) => void;
  onOpenApplicationReview: (app: OfficerApplication) => void;
  onQuickPreview: (app: OfficerApplication) => void;
}

// Dữ liệu biểu đồ luồng xử lý hồ sơ trong ca trực theo khung giờ
const mockHourlyWorkload = [
  { time: '08:00', received: 4, reviewed: 3 },
  { time: '09:00', received: 7, reviewed: 6 },
  { time: '10:00', received: 9, reviewed: 8 },
  { time: '11:00', received: 5, reviewed: 5 },
  { time: '13:30', received: 6, reviewed: 4 },
  { time: '14:30', received: 8, reviewed: 7 },
  { time: '15:30', received: 6, reviewed: 5 },
  { time: '16:30', received: 3, reviewed: 3 },
];

export const OfficerDashboardView: React.FC<OfficerDashboardViewProps> = ({
  applications,
  onSelectSection,
  onOpenApplicationReview,
  onQuickPreview,
}) => {
  const [chartView, setChartView] = useState<'hourly' | 'summary'>('hourly');

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
      note: 'Chờ công dân hoàn thiện',
      icon: WarningCircle,
      tone: 'orange',
      bgClass: 'bg-orange-50 text-orange-800 border-orange-200 hover:border-orange-300',
      badgeClass: 'bg-orange-100 text-orange-900',
    },
    {
      id: 'apps-resubmitted' as OfficerSection,
      label: 'Đã gửi lại',
      count: resubmittedApps.length,
      note: 'Ưu tiên tiền kiểm lại V2',
      icon: ArrowCounterClockwise,
      tone: 'purple',
      bgClass: 'bg-purple-50 text-purple-800 border-purple-200 hover:border-purple-300',
      badgeClass: 'bg-purple-100 text-purple-900',
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

  const getGreeting = (): string => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      return 'Chào buổi sáng';
    }
    if (hour >= 12 && hour < 18) {
      return 'Chào buổi chiều';
    }
    return 'Chào buổi tối';
  };

  // Top hồ sơ gửi lại cần ưu tiên xem ngay (tối đa 2 hồ sơ để tổng quan không bị dài)
  const priorityResubmittedApps = resubmittedApps.slice(0, 2);

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          {getGreeting()}, Cán bộ Lê Thu Hà
        </h1>

      </div>

      {/* 7 KPI Stat Cards */}
      <section aria-label="Chỉ số phân luồng hồ sơ">
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

      {/* Main Grid: Biểu đồ luồng xử lý & Tổng quan chức năng chính */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cột 1 & 2 (2/3 width): Biểu đồ xử lý hồ sơ & Hàng đợi ưu tiên */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card Biểu đồ Recharts */}
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
                  <p className="text-xs text-slate-500">
                    Đối chiếu số lượng hồ sơ tiếp nhận vào quầy & số lượng đã hoàn thành tiền kiểm
                  </p>
                </div>
              </div>

              {/* Bộ chuyển đổi chế độ xem */}
              <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setChartView('hourly')}
                  className={`px-3 py-1 rounded-md transition-all ${
                    chartView === 'hourly'
                      ? 'bg-white shadow text-red-900 font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Theo giờ ca trực
                </button>
                <button
                  type="button"
                  onClick={() => setChartView('summary')}
                  className={`px-3 py-1 rounded-md transition-all ${
                    chartView === 'summary'
                      ? 'bg-white shadow text-red-900 font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Tóm tắt tỷ lệ
                </button>
              </div>
            </div>

            {chartView === 'hourly' ? (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={mockHourlyWorkload} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorReceived" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b0000" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#8b0000" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="colorReviewed" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#059669" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <Tooltip
                      formatter={(val: unknown, name: unknown) => [
                        `${Number(val ?? 0)} hồ sơ`,
                        String(name) === 'received' ? 'Hồ sơ vào quầy' : 'Đã duyệt / xử lý',
                      ]}
                      labelFormatter={(label) => `Khung giờ: ${label}`}
                      contentStyle={{
                        borderRadius: '0.75rem',
                        border: '1px solid #e2e8f0',
                        fontSize: '12px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="received"
                      name="received"
                      stroke="#8b0000"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorReceived)"
                    />
                    <Area
                      type="monotone"
                      dataKey="reviewed"
                      name="reviewed"
                      stroke="#059669"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorReviewed)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-xs text-slate-500 font-medium">Tổng hồ sơ nộp vào</span>
                  <strong className="block text-2xl font-bold text-slate-900 mt-1 font-mono">48 hồ sơ</strong>
                  <span className="text-[11px] text-emerald-700 font-semibold mt-1 inline-block">
                    ↑ 12% so với ca sáng hôm qua
                  </span>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-xs text-slate-500 font-medium">Đã xử lý & tiền kiểm</span>
                  <strong className="block text-2xl font-bold text-emerald-700 mt-1 font-mono">41 hồ sơ</strong>
                  <span className="text-[11px] text-slate-500 mt-1 inline-block">Đạt 85.4% tổng nộp</span>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-xs text-slate-500 font-medium">Hồ sơ tồn chờ giải quyết</span>
                  <strong className="block text-2xl font-bold text-amber-700 mt-1 font-mono">7 hồ sơ</strong>
                  <span className="text-[11px] text-amber-700 mt-1 inline-block">Đang trong hạn xử lý</span>
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-4 mt-3 pt-3 border-t border-slate-100 text-xs">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-full bg-red-800" />
                  <span className="text-slate-600">Hồ sơ vào quầy</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-full bg-emerald-600" />
                  <span className="text-slate-600">Đã duyệt / xử lý</span>
                </div>
              </div>
              <span className="text-[11px] text-slate-400">Cập nhật lúc {new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
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
                  <p className="text-xs text-slate-500">Ưu tiên tiền kiểm hồ sơ công dân đã sửa và nộp lại</p>
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
            <p className="text-xs text-teal-900 leading-relaxed">
              Đối chiếu trực tiếp bản chính với hồ sơ điện tử đã duyệt tiền kiểm và cấp Giấy tiếp nhận & hẹn trả kết quả chính thức.
            </p>
            <button
              type="button"
              onClick={() => onSelectSection('receipt-waiting')}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-teal-800 px-4 py-2.5 text-xs font-bold text-white hover:bg-teal-900 transition-colors shadow-2xs"
            >
              <span>Tiếp nhận tại quầy</span>
              <ArrowRight size={14} aria-hidden="true" />
            </button>
          </section>

          {/* Card Hiệu suất ca làm việc */}
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
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                Đạt chuẩn
              </span>
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
                <dd className="font-bold text-slate-900">Lê Thu Hà</dd>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <dt className="text-slate-500">Vị trí:</dt>
                <dd className="font-semibold text-slate-800">Quầy Một cửa 02</dd>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <dt className="text-slate-500">Lĩnh vực:</dt>
                <dd className="font-medium text-slate-800">Hộ tịch & Chứng thực</dd>
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
