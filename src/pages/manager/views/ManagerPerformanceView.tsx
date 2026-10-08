import React from 'react';

interface ManagerPerformanceViewProps {
  section: 'perf-processing-time' | 'perf-completion-rate' | 'perf-supplement-rate' | 'perf-officers';
}

export const ManagerPerformanceView: React.FC<ManagerPerformanceViewProps> = ({ section }) => {
  return (
    <div className="space-y-6">
      {/* 1. THỜI GIAN XỬ LÝ */}
      {section === 'perf-processing-time' && (
        <div className="admin-card p-8">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-slate-500 font-medium">
              Chưa có dữ liệu thống kê thời gian giải quyết thủ tục hành chính.
            </p>
            <p className="mt-2 text-xs text-slate-400 italic">
              ⚠️ API thống kê thời gian xử lý thủ tục sẽ được tích hợp sau.
            </p>
          </div>
        </div>
      )}

      {/* 2. TỶ LỆ HOÀN THÀNH */}
      {section === 'perf-completion-rate' && (
        <div className="admin-card p-8">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-slate-500 font-medium">
              Chưa có dữ liệu tỷ lệ hoàn thành hồ sơ theo kỳ thống kê.
            </p>
            <p className="mt-2 text-xs text-slate-400 italic">
              ⚠️ API thống kê tỷ lệ hoàn thành hồ sơ sẽ được tích hợp sau.
            </p>
          </div>
        </div>
      )}

      {/* 3. TỶ LỆ CẦN BỔ SUNG */}
      {section === 'perf-supplement-rate' && (
        <div className="admin-card p-8">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-slate-500 font-medium">
              Chưa có dữ liệu phân tích nguyên nhân hồ sơ cần bổ sung.
            </p>
            <p className="mt-2 text-xs text-slate-400 italic">
              ⚠️ API thống kê tỷ lệ hồ sơ cần bổ sung sẽ được tích hợp sau.
            </p>
          </div>
        </div>
      )}

      {/* 4. HIỆU SUẤT CÁN BỘ */}
      {section === 'perf-officers' && (
        <div className="admin-card p-8">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-slate-500 font-medium">
              Chưa có dữ liệu bảng đánh giá hiệu suất cán bộ Một cửa.
            </p>
            <p className="mt-2 text-xs text-slate-400 italic">
              ⚠️ API đánh giá hiệu suất cán bộ sẽ được tích hợp sau.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
