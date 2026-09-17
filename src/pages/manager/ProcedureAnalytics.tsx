import React, { useState } from 'react';
import {
  MagnifyingGlass,
  DownloadSimple,
  WarningCircle,
  Clock,
} from '@phosphor-icons/react';
import { PROCEDURE_STATS } from '@/data/mockManagerData';

export const ProcedureAnalytics: React.FC = () => {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const filteredProcedures = PROCEDURE_STATS.filter((proc) => {
    const matchCat = selectedCategory === 'ALL' || proc.category === selectedCategory;
    const q = query.trim().toLowerCase();
    const matchQ = !q || proc.code.toLowerCase().includes(q) || proc.name.toLowerCase().includes(q);
    return matchCat && matchQ;
  });

  return (
    <div className="space-y-6">
      {/* Search & Category Filter */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative flex-1 w-full max-w-md">
          <MagnifyingGlass size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm theo mã thủ tục, tên thủ tục..."
            className="w-full h-11 pl-10 pr-4 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-red-600 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">Lĩnh vực:</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="h-10 px-3 text-xs rounded-xl border border-slate-200 bg-white font-medium focus:outline-none focus:border-red-600"
          >
            <option value="ALL">Tất cả lĩnh vực</option>
            <option value="Hộ tịch">Hộ tịch</option>
            <option value="Chứng thực">Chứng thực</option>
          </select>
        </div>
      </div>

      {/* Procedures Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Báo cáo phân tích theo thủ tục hành chính</h3>
            <p className="text-xs text-slate-500">
              Thống kê số lượng hồ sơ, tỷ lệ đạt tiền kiểm, thời gian giải quyết và lỗi công dân thường gặp
            </p>
          </div>
          <span className="text-xs font-bold text-slate-500">{filteredProcedures.length} thủ tục</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-4">Mã & Tên thủ tục</th>
                <th className="p-4">Lĩnh vực</th>
                <th className="p-4 text-center">Hồ sơ đã nộp</th>
                <th className="p-4 text-center">Tỷ lệ đạt</th>
                <th className="p-4 text-center">Thời gian TB</th>
                <th className="p-4 text-center">Lượt tải mẫu</th>
                <th className="p-4">Lỗi sai / Vướng mắc phổ biến</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProcedures.map((proc) => (
                <tr key={proc.code} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 max-w-xs">
                    <span className="font-mono text-[11px] font-bold text-red-900">{proc.code}</span>
                    <h4 className="font-bold text-slate-900 mt-0.5">{proc.name}</h4>
                  </td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                      {proc.category}
                    </span>
                  </td>
                  <td className="p-4 text-center font-extrabold text-slate-900 text-sm">
                    {proc.totalApplications}
                  </td>
                  <td className="p-4 text-center">
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {proc.approvalRate}%
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <span className="flex items-center justify-center gap-1 text-slate-700 font-bold">
                      <Clock size={13} className="text-slate-400" />
                      {proc.avgProcessingTime} p
                    </span>
                  </td>
                  <td className="p-4 text-center font-bold text-slate-600">
                    <span className="inline-flex items-center gap-1">
                      <DownloadSimple size={13} className="text-slate-400" />
                      {proc.formDownloadCount}
                    </span>
                  </td>
                  <td className="p-4 max-w-xs">
                    <div className="flex items-start gap-1.5 p-2 rounded-lg bg-amber-50/80 border border-amber-200 text-amber-900 text-[11px]">
                      <WarningCircle size={15} className="shrink-0 text-amber-700 mt-0.5" />
                      <span>{proc.commonMistake}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
