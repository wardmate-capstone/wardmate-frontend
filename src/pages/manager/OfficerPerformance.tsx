import React from 'react';
import {
  Clock,
  Star,
  CheckCircle,
  WarningCircle,
  BuildingOffice,
} from '@phosphor-icons/react';
import { OFFICER_PERFORMANCE } from '@/data/mockManagerData';

export const OfficerPerformance: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Officer Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cán bộ trực tiếp nhận</span>
            <BuildingOffice size={20} className="text-red-800" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-slate-900">4 / 4 Cán bộ</span>
            <p className="text-xs text-emerald-700 mt-1 font-medium">100% quầy đang vận hành</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tỷ lệ đúng hạn toàn ca</span>
            <Clock size={20} className="text-emerald-700" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-emerald-700">97.2%</span>
            <p className="text-xs text-slate-500 mt-1">Đạt chỉ tiêu cam kết dịch vụ công</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Điểm hài lòng trung bình</span>
            <Star size={20} weight="fill" className="text-amber-500" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-amber-900">4.85 / 5.0</span>
            <p className="text-xs text-slate-500 mt-1">Được công dân bình chọn trực tiếp</p>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Bảng theo dõi hiệu suất cán bộ Một cửa</h3>
            <p className="text-xs text-slate-500">
              Đánh giá khối lượng công việc, tốc độ tiền kiểm và chất lượng phục vụ công dân
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-4">Cán bộ Một cửa</th>
                <th className="p-4">Quầy trực</th>
                <th className="p-4 text-center">Tổng hồ sơ rà soát</th>
                <th className="p-4 text-center">Hồ sơ đã duyệt</th>
                <th className="p-4 text-center">Yêu cầu bổ sung</th>
                <th className="p-4 text-center">Thời gian TB</th>
                <th className="p-4 text-center">Tỷ lệ đúng hạn</th>
                <th className="p-4 text-center">Đánh giá</th>
                <th className="p-4 text-center">Trạng thái ca</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {OFFICER_PERFORMANCE.map((off) => (
                <tr key={off.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <span className="grid size-9 place-items-center rounded-full bg-red-800 text-white font-bold text-xs shrink-0 shadow-xs">
                        {off.avatar}
                      </span>
                      <div>
                        <h4 className="font-bold text-slate-900">{off.officerName}</h4>
                        <span className="text-[10px] text-slate-400">ID: {off.id}</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 font-medium text-slate-700">{off.desk}</td>
                  <td className="p-4 text-center font-extrabold text-slate-900 text-sm">
                    {off.totalReviewed}
                  </td>
                  <td className="p-4 text-center">
                    <span className="inline-flex items-center gap-1 font-bold text-emerald-700">
                      <CheckCircle size={14} /> {off.approvedCount}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <span className="inline-flex items-center gap-1 font-bold text-amber-800">
                      <WarningCircle size={14} /> {off.revisionCount}
                    </span>
                  </td>
                  <td className="p-4 text-center font-bold text-slate-700">
                    {off.avgTimeMinutes} phút
                  </td>
                  <td className="p-4 text-center">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {off.onTimeRate}%
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200">
                      <Star size={13} weight="fill" className="text-amber-500" />
                      {off.rating}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        off.status === 'active'
                          ? 'bg-emerald-100 text-emerald-800'
                          : off.status === 'break'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <span className={`size-1.5 rounded-full ${off.status === 'active' ? 'bg-emerald-600' : 'bg-amber-600'}`} />
                      {off.status === 'active' ? 'Đang thụ lý' : 'Nghỉ giữa ca'}
                    </span>
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
