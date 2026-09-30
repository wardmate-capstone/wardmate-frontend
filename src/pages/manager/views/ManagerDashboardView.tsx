import React from 'react';
import {
  Files,
  CheckCircle,
  Clock,
  ThumbsUp,
  ArrowUpRight,
  ArrowRight,
} from '@phosphor-icons/react';
import {
  AreaChart,
  Area,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  mockMonthlyTrends,
  mockSectorDistribution,
  mockTopProcedures,
  mockCitizenFeedbacks,
} from '../mockData';
import { ManagerSectionId } from '../types';

interface ManagerDashboardViewProps {
  onNavigateSection: (section: ManagerSectionId) => void;
}

export const ManagerDashboardView: React.FC<ManagerDashboardViewProps> = ({
  onNavigateSection,
}) => {
  return (
    <div className="space-y-6">
      {/* 4 Metric Cards */}
      <section className="admin-metric-grid" aria-label="Chỉ số điều hành nhanh">
        <button
          type="button"
          onClick={() => onNavigateSection('stats-dossiers')}
          className="admin-metric-card text-left cursor-pointer transition-all hover:border-red-300 hover:shadow-md"
        >
          <div className="admin-metric-icon">
            <Files size={24} className="text-red-900" />
          </div>
          <div className="admin-metric-content">
            <span>Tổng hồ sơ tiếp nhận (T9)</span>
            <strong>1.428</strong>
            <small className="text-emerald-700 font-semibold flex items-center gap-1">
              <ArrowUpRight size={14} /> +12.5% so với tháng trước
            </small>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigateSection('perf-completion-rate')}
          className="admin-metric-card text-left cursor-pointer transition-all hover:border-red-300 hover:shadow-md"
        >
          <div className="admin-metric-icon">
            <CheckCircle size={24} className="text-emerald-700" />
          </div>
          <div className="admin-metric-content">
            <span>Tỷ lệ giải quyết đúng hạn</span>
            <strong>98.6%</strong>
            <small className="text-emerald-700 font-semibold flex items-center gap-1">
              <ArrowUpRight size={14} /> Đạt mục tiêu đề ra (≥98%)
            </small>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigateSection('perf-processing-time')}
          className="admin-metric-card text-left cursor-pointer transition-all hover:border-red-300 hover:shadow-md"
        >
          <div className="admin-metric-icon">
            <Clock size={24} className="text-blue-700" />
          </div>
          <div className="admin-metric-content">
            <span>Thời gian xử lý trung bình</span>
            <strong>1.8 ngày</strong>
            <small className="text-blue-700 font-semibold">
              Rút ngắn 35% so với quy định
            </small>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigateSection('satisfaction-level')}
          className="admin-metric-card text-left cursor-pointer transition-all hover:border-red-300 hover:shadow-md"
        >
          <div className="admin-metric-icon">
            <ThumbsUp size={24} className="text-amber-600" />
          </div>
          <div className="admin-metric-content">
            <span>Mức độ hài lòng người dân</span>
            <strong>99.1%</strong>
            <small className="text-emerald-700 font-semibold">
              1.240 lượt đánh giá tích cực
            </small>
          </div>
        </button>
      </section>

      {/* Main Charts Section */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Biểu đồ xu hướng giải quyết hồ sơ */}
        <section className="admin-card p-5 lg:col-span-8">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Xu hướng Tiếp nhận & Giải quyết Hồ sơ 6 tháng gần nhất
              </h2>
              <p className="text-xs text-slate-500">
                So sánh số lượng hồ sơ tiếp nhận và số lượng giải quyết đúng hạn
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="size-3 rounded-full bg-red-800" /> Tiếp nhận
              </span>
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="size-3 rounded-full bg-emerald-600" /> Đúng hạn
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockMonthlyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="managerGradTiepNhan" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#991D18" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#991D18" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="managerGradDungHan" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" tickLine={false} axisLine={{ stroke: '#e2e8f0' }} tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tickLine={false} axisLine={{ stroke: '#e2e8f0' }} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="tiepNhan" stroke="#991D18" strokeWidth={2.5} fillOpacity={1} fill="url(#managerGradTiepNhan)" name="Tiếp nhận" />
                <Area type="monotone" dataKey="dungHan" stroke="#059669" strokeWidth={2.5} fillOpacity={1} fill="url(#managerGradDungHan)" name="Đúng hạn" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Phân bổ theo lĩnh vực */}
        <section className="admin-card p-5 lg:col-span-4 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 mb-1">
              Phân bổ theo Lĩnh vực
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Cơ cấu hồ sơ hành chính phát sinh trong tháng 9/2026
            </p>

            <div className="space-y-3">
              {mockSectorDistribution.map((sec) => (
                <div key={sec.name} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-700">{sec.name}</span>
                    <span className="font-bold text-slate-900">
                      {sec.count} ({sec.percentage}%)
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${sec.percentage}%`, backgroundColor: sec.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigateSection('stats-procedures')}
            className="mt-5 inline-flex items-center justify-center gap-1.5 text-xs font-bold text-red-800 hover:text-red-950 pt-3 border-t border-slate-100"
          >
            Xem thống kê chi tiết theo thủ tục <ArrowRight size={14} />
          </button>
        </section>
      </div>

      {/* Top thủ tục và Phản hồi mới nhất */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Bảng Top thủ tục */}
        <section className="admin-card p-5 lg:col-span-7">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Top Thủ tục phát sinh nhiều nhất</h2>
              <p className="text-xs text-slate-500">Thủ tục trọng tâm cần theo dõi tiến độ và chất lượng phục vụ</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateSection('stats-procedures')}
              className="text-xs font-bold text-red-800 hover:underline"
            >
              Xem tất cả
            </button>
          </div>

          <div className="admin-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Mã & Tên thủ tục</th>
                  <th>Lĩnh vực</th>
                  <th className="text-center">Số lượng</th>
                  <th className="text-center">Tỷ lệ đúng hạn</th>
                </tr>
              </thead>
              <tbody>
                {mockTopProcedures.slice(0, 4).map((proc) => (
                  <tr key={proc.id}>
                    <td>
                      <p className="font-bold text-slate-900 text-xs">{proc.name}</p>
                      <small className="text-[11px] font-mono text-slate-500">{proc.id}</small>
                    </td>
                    <td>
                      <span className="text-xs text-slate-600">{proc.field}</span>
                    </td>
                    <td className="text-center font-bold text-xs text-slate-900">
                      {proc.total}
                    </td>
                    <td className="text-center">
                      <span className="admin-status-badge is-success">
                        {proc.onTimeRate}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Ý kiến phản ánh người dân mới nhất */}
        <section className="admin-card p-5 lg:col-span-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Ý kiến phản hồi gần đây</h2>
              <p className="text-xs text-slate-500">Đánh giá thực tế từ người dân khi hoàn thành hồ sơ</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateSection('feedback-reports')}
              className="text-xs font-bold text-red-800 hover:underline"
            >
              Xem tất cả
            </button>
          </div>

          <div className="space-y-3">
            {mockCitizenFeedbacks.slice(0, 3).map((fb) => (
              <div
                key={fb.id}
                className="p-3 rounded-lg border border-slate-100 bg-slate-50/70 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-slate-800">{fb.citizenName}</span>
                  <span className="text-amber-500 font-bold">
                    {'★'.repeat(fb.rating)}
                  </span>
                </div>
                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  "{fb.comment}"
                </p>
                <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                  <span>{fb.procedure}</span>
                  <span>{fb.date}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
