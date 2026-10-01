import React, { useState } from 'react';
import {
  DownloadSimple,
} from '@phosphor-icons/react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  mockMonthlyTrends,
  mockSectorDistribution,
  mockTopProcedures,
  mockSearchTraffic,
  mockTopKeywords,
  mockFormStats,
} from '../mockData';
import { toast } from '@/components/ui/Toast';

interface ManagerSystemStatsViewProps {
  section: 'stats-dossiers' | 'stats-procedures' | 'stats-searches' | 'stats-forms';
}

export const ManagerSystemStatsView: React.FC<ManagerSystemStatsViewProps> = ({ section }) => {
  const [timeRange, setTimeRange] = useState<'month' | 'quarter' | 'year'>('month');

  return (
    <div className="space-y-6">
      {/* Sub Header & Time Range Filter */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white rounded-xl border border-slate-200">
        <span className="text-sm font-semibold text-slate-700">Kỳ thống kê</span>

        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setTimeRange('month')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                timeRange === 'month' ? 'bg-white shadow text-red-900 font-bold' : 'text-slate-600'
              }`}
            >
              Tháng này
            </button>
            <button
              type="button"
              onClick={() => setTimeRange('quarter')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                timeRange === 'quarter' ? 'bg-white shadow text-red-900 font-bold' : 'text-slate-600'
              }`}
            >
              Quý này
            </button>
            <button
              type="button"
              onClick={() => setTimeRange('year')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                timeRange === 'year' ? 'bg-white shadow text-red-900 font-bold' : 'text-slate-600'
              }`}
            >
              Năm 2026
            </button>
          </div>

          <button
            type="button"
            onClick={() => toast.success('Đã xuất báo cáo số liệu dạng bảng tính Excel.')}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-red-900"
          >
            <DownloadSimple size={16} /> Xuất Excel
          </button>
        </div>
      </div>

      {/* 1. THỐNG KÊ HỒ SƠ */}
      {section === 'stats-dossiers' && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-4">
            <div className="admin-card p-4">
              <span className="text-xs text-slate-500 block">Tổng tiếp nhận</span>
              <strong className="text-xl text-slate-900 block mt-1">1.428</strong>
              <small className="text-emerald-700 font-semibold">+12.5% so với tháng 8</small>
            </div>
            <div className="admin-card p-4">
              <span className="text-xs text-slate-500 block">Đã giải quyết đúng hạn</span>
              <strong className="text-xl text-emerald-700 block mt-1">1.392</strong>
              <small className="text-slate-500">Đạt tỷ lệ 98.6%</small>
            </div>
            <div className="admin-card p-4">
              <span className="text-xs text-slate-500 block">Đang giải quyết trong hạn</span>
              <strong className="text-xl text-blue-700 block mt-1">32</strong>
            </div>
            <div className="admin-card p-4">
              <span className="text-xs text-slate-500 block">Trễ hạn / Quá hạn</span>
              <strong className="text-xl text-red-700 block mt-1">4</strong>
              <small className="text-red-700 font-semibold">Chiếm 0.28%</small>
            </div>
          </div>

          <div className="admin-card p-5">
            <h3 className="text-sm font-bold text-slate-900 mb-4">
              Tiếp nhận và giải quyết theo tháng
            </h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockMonthlyTrends}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="tiepNhan" stroke="#991D18" fill="#991D18" fillOpacity={0.15} name="Tổng tiếp nhận" />
                  <Area type="monotone" dataKey="hoanThanh" stroke="#059669" fill="#059669" fillOpacity={0.15} name="Đã giải quyết" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="admin-card p-5">
            <h3 className="text-sm font-bold text-slate-900 mb-3">
              Hồ sơ theo lĩnh vực
            </h3>
            <div className="admin-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Lĩnh vực hành chính</th>
                    <th className="text-center">Hồ sơ tiếp nhận</th>
                    <th className="text-center">Tỷ lệ cơ cấu</th>
                    <th className="text-center">Đúng hạn</th>
                    <th className="text-center">Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {mockSectorDistribution.map((sec) => (
                    <tr key={sec.name}>
                      <td className="font-semibold text-xs text-slate-800">{sec.name}</td>
                      <td className="text-center font-bold text-xs">{sec.count}</td>
                      <td className="text-center text-xs">{sec.percentage}%</td>
                      <td className="text-center text-xs font-bold text-emerald-700">99.2%</td>
                      <td className="text-center">
                        <span className="admin-status-badge is-success">Ổn định</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. THỐNG KÊ THỦ TỤC */}
      {section === 'stats-procedures' && (
        <div className="space-y-6">
          <div className="admin-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Danh mục TTHC phát sinh hồ sơ</h3>
              </div>
            </div>

            <div className="admin-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Mã TTHC</th>
                    <th>Tên thủ tục hành chính</th>
                    <th>Lĩnh vực</th>
                    <th className="text-center">Số lượng</th>
                    <th className="text-center">Thời gian TB</th>
                    <th className="text-center">Nộp trực tuyến</th>
                    <th className="text-center">Đúng hạn</th>
                  </tr>
                </thead>
                <tbody>
                  {mockTopProcedures.map((proc) => (
                    <tr key={proc.id}>
                      <td className="font-mono text-xs font-bold text-red-900">{proc.id}</td>
                      <td className="text-xs font-semibold text-slate-900">{proc.name}</td>
                      <td className="text-xs text-slate-600">{proc.field}</td>
                      <td className="text-center font-bold text-xs text-slate-900">{proc.total}</td>
                      <td className="text-center text-xs text-blue-800 font-semibold">{proc.avgTime}</td>
                      <td className="text-center text-xs font-bold text-emerald-800">{proc.onlinePercent}</td>
                      <td className="text-center">
                        <span className="admin-status-badge is-success">{proc.onTimeRate}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. THỐNG KÊ LƯỢT TRA CỨU */}
      {section === 'stats-searches' && (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-12">
            <div className="admin-card p-5 lg:col-span-8">
              <h3 className="text-sm font-bold text-slate-900 mb-1">
                Lưu lượng Tra cứu Thủ tục qua Cổng theo Khung giờ
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Giúp bố trí nhân lực hỗ trợ trực tuyến và ki-ốt tiếp nhận phù hợp
              </p>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={mockSearchTraffic}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="hour" tick={{ fontSize: 11, fill: '#64748b' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                    <Tooltip />
                    <Bar dataKey="visits" fill="#991D18" radius={[4, 4, 0, 0]} name="Lượt tra cứu" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="admin-card p-5 lg:col-span-4">
              <h3 className="text-sm font-bold text-slate-900 mb-1">
                Top Từ khóa Người dân Tìm kiếm
              </h3>
              <div className="space-y-3">
                {mockTopKeywords.map((kw, i) => (
                  <div key={kw.keyword} className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-slate-50">
                    <span className="font-semibold text-slate-800">
                      <span className="text-slate-400 mr-2 font-mono">{i + 1}.</span>
                      {kw.keyword}
                    </span>
                    <div className="text-right">
                      <strong className="text-slate-900 block">{kw.count}</strong>
                      <span className="text-[10px] text-emerald-700 font-bold">{kw.trend}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. THỐNG KÊ BIỂU MẪU */}
      {section === 'stats-forms' && (
        <div className="space-y-6">
          <div className="admin-card p-5">
            <h3 className="text-sm font-bold text-slate-900 mb-1">
              Thống kê Khai thác Biểu mẫu & Tờ khai Trực tuyến
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Số lượt tải file Word/PDF và số lượt công dân dùng E-Form điền trực tuyến
            </p>

            <div className="admin-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Mã biểu mẫu</th>
                    <th>Tên biểu mẫu giấy tờ</th>
                    <th className="text-center">Lượt tải về</th>
                    <th className="text-center">Điền E-Form</th>
                    <th>Cập nhật gần nhất</th>
                    <th className="text-center">Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {mockFormStats.map((f) => (
                    <tr key={f.code}>
                      <td className="font-mono text-xs font-bold text-red-900">{f.code}</td>
                      <td className="text-xs font-semibold text-slate-900">{f.title}</td>
                      <td className="text-center font-bold text-xs">{f.downloads.toLocaleString()}</td>
                      <td className="text-center font-bold text-xs text-blue-700">{f.onlineFills.toLocaleString()}</td>
                      <td className="text-xs text-slate-500">{f.updated}</td>
                      <td className="text-center">
                        <span className={`admin-status-badge ${f.status === 'Chuẩn hóa' ? 'is-success' : 'is-warning'}`}>
                          {f.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
