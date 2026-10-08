import React, { useState } from 'react';
import { DownloadSimple } from '@phosphor-icons/react';
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
            onClick={() => toast.info('Chức năng xuất báo cáo sẽ khả dụng khi kết nối API.')}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-red-900"
          >
            <DownloadSimple size={16} /> Xuất Excel
          </button>
        </div>
      </div>

      {/* 1. THỐNG KÊ HỒ SƠ */}
      {section === 'stats-dossiers' && (
        <div className="admin-card p-8">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-slate-500 font-medium">
              Chưa có dữ liệu thống kê tiếp nhận và giải quyết hồ sơ.
            </p>
            <p className="mt-2 text-xs text-slate-400 italic">
              ⚠️ API thống kê hồ sơ hệ thống sẽ được tích hợp sau.
            </p>
          </div>
        </div>
      )}

      {/* 2. THỐNG KÊ THỦ TỤC */}
      {section === 'stats-procedures' && (
        <div className="admin-card p-8">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-slate-500 font-medium">
              Chưa có dữ liệu thống kê theo danh mục thủ tục hành chính.
            </p>
            <p className="mt-2 text-xs text-slate-400 italic">
              ⚠️ API thống kê thủ tục hành chính sẽ được tích hợp sau.
            </p>
          </div>
        </div>
      )}

      {/* 3. THỐNG KÊ LƯỢT TRA CỨU */}
      {section === 'stats-searches' && (
        <div className="admin-card p-8">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-slate-500 font-medium">
              Chưa có dữ liệu thống kê lượt tra cứu và từ khóa tìm kiếm.
            </p>
            <p className="mt-2 text-xs text-slate-400 italic">
              ⚠️ API thống kê lưu lượng tra cứu sẽ được tích hợp sau.
            </p>
          </div>
        </div>
      )}

      {/* 4. THỐNG KÊ BIỂU MẪU */}
      {section === 'stats-forms' && (
        <div className="admin-card p-8">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-slate-500 font-medium">
              Chưa có dữ liệu thống kê khai thác biểu mẫu và tờ khai trực tuyến.
            </p>
            <p className="mt-2 text-xs text-slate-400 italic">
              ⚠️ API thống kê biểu mẫu trực tuyến sẽ được tích hợp sau.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
