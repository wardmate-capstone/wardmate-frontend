import React, { useState } from 'react';
import {
  ChartLineUp,
  Clock,
  ThumbsUp,
  ArrowRight,
  ShieldCheck,
  CalendarBlank,
  MagnifyingGlass,
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
import type { TimeFilterRange } from '@/types/application';
import {
  KPI_DATA,
  TREND_CHART_DATA,
  PROCEDURE_STATS,
  OFFICER_PERFORMANCE,
} from '@/data/mockManagerData';

interface ManagerDashboardProps {
  onNavigateTab: (tabId: string) => void;
}

export const ManagerDashboard: React.FC<ManagerDashboardProps> = ({ onNavigateTab }) => {
  const [period, setPeriod] = useState<TimeFilterRange>('week');
  const kpi = KPI_DATA[period];
  const chartData = TREND_CHART_DATA[period];

  const periods: Array<{ id: TimeFilterRange; label: string }> = [
    { id: 'day', label: 'Hôm nay' },
    { id: 'week', label: 'Tuần này' },
    { id: 'month', label: 'Tháng này' },
    { id: 'year', label: 'Năm 2026' },
  ];

  return (
    <div className="space-y-6">
      {/* Time Filter & Executive Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <CalendarBlank size={20} className="text-red-800" />
          <span className="text-xs font-bold text-slate-700">Kỳ báo cáo thống kê:</span>
        </div>

        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200">
          {periods.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPeriod(p.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                period === p.id
                  ? 'bg-white text-red-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* 6 Core Executive KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5 sm:gap-4">
        {/* 1. Search Queries Volume */}
        <div className="p-4 sm:p-5 rounded-2xl border border-violet-200 bg-violet-50/50 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-violet-800 uppercase tracking-wider truncate">Lượt tra cứu</span>
            <span className="p-1.5 rounded-xl bg-violet-100 text-violet-800">
              <MagnifyingGlass size={18} weight="bold" />
            </span>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {kpi.searchQueriesCount.toLocaleString('vi-VN')}
            </span>
            <p className="text-[11px] text-violet-700 mt-1 font-medium truncate">Tra cứu thủ tục</p>
          </div>
        </div>

        {/* 2. Total Applications */}
        <div className="p-4 sm:p-5 rounded-2xl border border-sky-200 bg-sky-50/50 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-sky-800 uppercase tracking-wider truncate">Hồ sơ tiếp nhận</span>
            <span className="p-1.5 rounded-xl bg-sky-100 text-sky-800">
              <ChartLineUp size={18} weight="bold" />
            </span>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {kpi.totalApplications.toLocaleString('vi-VN')}
            </span>
            <p className="text-[11px] text-sky-700 mt-1 font-medium truncate">Nộp tiền kiểm</p>
          </div>
        </div>

        {/* 3. First-time pass rate */}
        <div className="p-4 sm:p-5 rounded-2xl border border-emerald-200 bg-emerald-50/50 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider truncate">Duyệt lần đầu</span>
            <span className="p-1.5 rounded-xl bg-emerald-100 text-emerald-800">
              <ShieldCheck size={18} weight="bold" />
            </span>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-800 tracking-tight">
              {kpi.firstTimePassRate}%
            </span>
            <p className="text-[11px] text-emerald-700 mt-1 font-medium truncate">Đạt chuẩn ngay</p>
          </div>
        </div>

        {/* 4. Revision rate */}
        <div className="p-4 sm:p-5 rounded-2xl border border-amber-200 bg-amber-50/50 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider truncate">Cần bổ sung</span>
            <span className="p-1.5 rounded-xl bg-amber-100 text-amber-800">
              <Clock size={18} weight="bold" />
            </span>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-amber-900 tracking-tight">
              {kpi.revisionRate}%
            </span>
            <p className="text-[11px] text-amber-700 mt-1 font-medium truncate">Đã hướng dẫn sửa</p>
          </div>
        </div>

        {/* 5. Processing time */}
        <div className="p-4 sm:p-5 rounded-2xl border border-indigo-200 bg-indigo-50/50 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-indigo-800 uppercase tracking-wider truncate">Thời gian xử lý</span>
            <span className="p-1.5 rounded-xl bg-indigo-100 text-indigo-800">
              <Clock size={18} weight="bold" />
            </span>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-indigo-950 tracking-tight">
              {kpi.avgProcessingTimeMinutes} <small className="text-xs font-bold text-slate-500">phút</small>
            </span>
            <p className="text-[11px] text-indigo-700 mt-1 font-medium truncate">Nhanh hơn 45%</p>
          </div>
        </div>

        {/* 6. CSAT */}
        <div className="p-4 sm:p-5 rounded-2xl border border-gold-300 bg-gold-50/60 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider truncate">Độ hài lòng</span>
            <span className="p-1.5 rounded-xl bg-gold-200 text-amber-950">
              <ThumbsUp size={18} weight="bold" />
            </span>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-amber-950 tracking-tight">
              {kpi.satisfactionScore} <small className="text-xs font-bold text-slate-500">/ 5</small>
            </span>
            <p className="text-[11px] text-amber-800 mt-1 font-medium truncate">98.4% Rất hài lòng</p>
          </div>
        </div>
      </div>

      {/* Main Trends Visual Chart */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Xu hướng tiếp nhận, duyệt và yêu cầu bổ sung hồ sơ ({periods.find((p) => p.id === period)?.label.toLowerCase()})
            </h3>
            <p className="text-xs text-slate-500">
              Số lượng hồ sơ gửi vào hệ thống, số hồ sơ được duyệt cấp mã QR và số hồ sơ cần công dân bổ sung
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-bold">
            <span className="flex items-center gap-1.5 text-slate-700">
              <span className="size-3 rounded-full bg-red-800" /> Tiếp nhận
            </span>
            <span className="flex items-center gap-1.5 text-slate-700">
              <span className="size-3 rounded-full bg-emerald-600" /> Đã duyệt
            </span>
            <span className="flex items-center gap-1.5 text-slate-700">
              <span className="size-3 rounded-full bg-amber-500" /> Cần bổ sung
            </span>
          </div>
        </div>

        <div className="h-80 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorSubmitted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#991d18" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#991d18" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorApproved" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#059669" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorRevision" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#d97706" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#d97706" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="period" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderRadius: 12,
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
                  fontSize: 12,
                }}
              />
              <Area type="monotone" dataKey="submitted" name="Hồ sơ tiếp nhận" stroke="#991d18" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSubmitted)" />
              <Area type="monotone" dataKey="approved" name="Đã duyệt cấp QR" stroke="#059669" strokeWidth={2.5} fillOpacity={1} fill="url(#colorApproved)" />
              <Area type="monotone" dataKey="revision" name="Cần bổ sung" stroke="#d97706" strokeWidth={2} fillOpacity={1} fill="url(#colorRevision)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Two Column Section: Top Procedures & Top Officers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Procedures */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">Thủ tục phát sinh hồ sơ nhiều nhất</h3>
              <p className="text-xs text-slate-500">Các thủ tục công dân nộp tiền kiểm thường xuyên</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('procedures')}
              className="text-xs font-bold text-red-800 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Xem chi tiết</span>
              <ArrowRight size={14} />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {PROCEDURE_STATS.slice(0, 4).map((proc) => (
              <div key={proc.code} className="py-3 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] font-bold text-slate-500">{proc.code}</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                      {proc.category}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 truncate mt-0.5">{proc.name}</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Thời gian xử lý TB: <strong>{proc.avgProcessingTime} phút</strong>
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-sm font-extrabold text-slate-900">{proc.totalApplications}</span>
                  <span className="text-xs text-slate-400 block">hồ sơ</span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                    {proc.approvalRate}% đạt
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Officer Performance Spotlight */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">Năng suất cán bộ Một cửa</h3>
              <p className="text-xs text-slate-500">Số lượng hồ sơ đã duyệt và thời gian xử lý</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('officers')}
              className="text-xs font-bold text-red-800 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Xem bảng xếp hạng</span>
              <ArrowRight size={14} />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {OFFICER_PERFORMANCE.map((off) => (
              <div key={off.id} className="py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="grid size-9 place-items-center rounded-full bg-red-800 text-white font-bold text-xs shrink-0 shadow-xs">
                    {off.avatar}
                  </span>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 truncate">{off.officerName}</h4>
                    <p className="text-[11px] text-slate-500 truncate">{off.desk}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-right shrink-0">
                  <div>
                    <span className="text-xs font-bold text-slate-900">{off.totalReviewed}</span>
                    <span className="text-[10px] text-slate-400 block">hồ sơ</span>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-emerald-700">{off.onTimeRate}%</span>
                    <span className="text-[10px] text-slate-400 block">đúng hạn</span>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-amber-900">★ {off.rating}</span>
                    <span className="text-[10px] text-slate-400 block">hài lòng</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
