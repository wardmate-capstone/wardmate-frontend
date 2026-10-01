import React from 'react';
import {
  ArrowUpRight,
  Star,
  Info,
} from '@phosphor-icons/react';
import {
  mockOfficersPerformance,
  mockSupplementReasons,
  mockTopProcedures,
} from '../mockData';

interface ManagerPerformanceViewProps {
  section: 'perf-processing-time' | 'perf-completion-rate' | 'perf-supplement-rate' | 'perf-officers';
}

export const ManagerPerformanceView: React.FC<ManagerPerformanceViewProps> = ({ section }) => {
  return (
    <div className="space-y-6">
      {/* 1. THỜI GIAN XỬ LÝ */}
      {section === 'perf-processing-time' && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="admin-card p-4">
              <span className="text-xs text-slate-500 block">Thời gian xử lý trung bình</span>
              <strong className="text-xl text-slate-900 block mt-1">1.8 ngày</strong>
              <small className="text-emerald-700 font-semibold flex items-center gap-1">
                <ArrowUpRight size={14} /> Nhanh hơn 35% so với quy định
              </small>
            </div>
            <div className="admin-card p-4">
              <span className="text-xs text-slate-500 block">Hồ sơ giải quyết trước hạn</span>
              <strong className="text-xl text-blue-700 block mt-1">72.4%</strong>
              <small className="text-slate-500">1.034 hồ sơ trả kết quả sớm</small>
            </div>
            <div className="admin-card p-4">
              <span className="text-xs text-slate-500 block">Tiết kiệm thời gian cho dân</span>
              <strong className="text-xl text-emerald-700 block mt-1">~1.400 giờ</strong>
            </div>
          </div>

          <div className="admin-card p-5">
            <h3 className="text-sm font-bold text-slate-900 mb-1">
              So sánh Thời gian Xử lý Thực tế vs Quy định Pháp luật
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Dữ liệu đối chiếu theo Quyết định công bố TTHC của UBND Thành phố
            </p>

            <div className="admin-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Tên thủ tục hành chính</th>
                    <th className="text-center">Thời gian quy định</th>
                    <th className="text-center">Thực tế giải quyết</th>
                    <th className="text-center">Mức độ rút ngắn</th>
                    <th className="text-center">Đánh giá</th>
                  </tr>
                </thead>
                <tbody>
                  {mockTopProcedures.map((proc) => (
                    <tr key={proc.id}>
                      <td className="text-xs font-semibold text-slate-900">{proc.name}</td>
                      <td className="text-center text-xs text-slate-600">3 ngày làm việc</td>
                      <td className="text-center text-xs font-bold text-blue-800">{proc.avgTime}</td>
                      <td className="text-center text-xs font-bold text-emerald-700">-50% đến -70%</td>
                      <td className="text-center">
                        <span className="admin-status-badge is-success">Xuất sắc</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. TỶ LỆ HOÀN THÀNH */}
      {section === 'perf-completion-rate' && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-4">
            <div className="admin-card p-4">
              <span className="text-xs text-slate-500 block">Tỷ lệ hoàn thành chung</span>
              <strong className="text-xl text-emerald-700 block mt-1">98.6%</strong>
              <small className="text-slate-500">Mục tiêu năm: ≥ 98%</small>
            </div>
            <div className="admin-card p-4">
              <span className="text-xs text-slate-500 block">Trước hạn & Đúng hạn</span>
              <strong className="text-xl text-slate-900 block mt-1">1.392 HS</strong>
              <small className="text-emerald-700 font-semibold">97.5% tổng số</small>
            </div>
            <div className="admin-card p-4">
              <span className="text-xs text-slate-500 block">Công dân chủ động rút</span>
              <strong className="text-xl text-slate-700 block mt-1">11 HS</strong>
            </div>
            <div className="admin-card p-4">
              <span className="text-xs text-slate-500 block">Từ chối tiếp nhận (KĐK)</span>
              <strong className="text-xl text-slate-700 block mt-1">9 HS</strong>
            </div>
          </div>

          <div className="admin-card p-5">
            <h3 className="text-sm font-bold text-slate-900 mb-3">
              Chỉ số Giám sát Hoàn thành theo Nhóm Nghiệp vụ
            </h3>
            <div className="space-y-4">
              {[
                { name: 'Khối Hộ tịch (Khai sinh, Kết hôn, Khai tử)', rate: 99.6, total: 540 },
                { name: 'Khối Chứng thực (Bản sao, Chữ ký, Hợp đồng)', rate: 100, total: 420 },
                { name: 'Khối Lao động & Chính sách Xã hội', rate: 98.9, total: 145 },
                { name: 'Khối Địa chính & Đất đai', rate: 96.4, total: 215 },
                { name: 'Khối Xây dựng & Đô thị', rate: 97.2, total: 108 },
              ].map((item) => (
                <div key={item.name} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-800">{item.name}</span>
                    <span className="font-bold text-emerald-800">
                      {item.rate}% ({item.total} hồ sơ)
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-600"
                      style={{ width: `${item.rate}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. TỶ LỆ CẦN BỔ SUNG */}
      {section === 'perf-supplement-rate' && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl border border-amber-200 bg-amber-50 flex items-start gap-3">
            <Info size={22} className="text-amber-800 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 leading-relaxed">
              <strong className="block text-sm font-bold mb-1">
                Mục tiêu trọng tâm: Giảm tỷ lệ người dân phải đi lại nhiều lần
              </strong>
              Tỷ lệ hồ sơ cần bổ sung giấy tờ tháng này là <strong>14.7%</strong> (giảm 8.2% so với trước khi áp dụng tiền kiểm trực tuyến WardMate). Dưới đây là phân tích các nguyên nhân phổ biến nhất để tiếp tục hoàn thiện checklist hướng dẫn công dân.
            </div>
          </div>

          <div className="admin-card p-5">
            <h3 className="text-sm font-bold text-slate-900 mb-3">
              Phân tích Nguyên nhân Hồ sơ Chưa Hợp Lệ Cần Bổ Sung
            </h3>
            <div className="space-y-3">
              {mockSupplementReasons.map((item, idx) => (
                <div
                  key={item.reason}
                  className="p-3 rounded-lg border border-slate-100 bg-slate-50 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="size-6 rounded-full bg-red-100 text-red-900 font-bold text-xs flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-semibold text-slate-800">{item.reason}</span>
                  </div>
                  <div className="text-right">
                    <strong className="text-xs text-slate-900 block">{item.count} lượt</strong>
                    <small className="text-[11px] text-red-700 font-bold">{item.percentage}</small>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. HIỆU SUẤT CÁN BỘ */}
      {section === 'perf-officers' && (
        <div className="space-y-6">
          <div className="admin-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Bảng Đánh giá Hiệu suất Cán bộ Một cửa</h3>
              </div>
            </div>

            <div className="admin-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Họ và tên cán bộ</th>
                    <th>Vị trí công tác</th>
                    <th className="text-center">Tiếp nhận</th>
                    <th className="text-center">Đã xử lý</th>
                    <th className="text-center">Đúng hạn</th>
                    <th className="text-center">Thời gian TB</th>
                    <th className="text-center">Hài lòng</th>
                  </tr>
                </thead>
                <tbody>
                  {mockOfficersPerformance.map((officer) => (
                    <tr key={officer.id}>
                      <td>
                        <div className="flex items-center gap-2">
                          <span className="size-8 rounded-full bg-slate-100 text-slate-800 font-bold text-xs flex items-center justify-center">
                            {officer.name.split(' ').slice(-1)[0][0]}
                          </span>
                          <div>
                            <strong className="text-xs text-slate-900 block">{officer.name}</strong>
                            <small className="text-[11px] text-slate-400 font-mono">{officer.id}</small>
                          </div>
                        </div>
                      </td>
                      <td className="text-xs text-slate-700">{officer.role}</td>
                      <td className="text-center font-bold text-xs">{officer.received}</td>
                      <td className="text-center font-bold text-xs text-blue-700">{officer.completed}</td>
                      <td className="text-center">
                        <span className="admin-status-badge is-success">{officer.onTime}</span>
                      </td>
                      <td className="text-center text-xs text-slate-600 font-semibold">{officer.avgHours}</td>
                      <td className="text-center">
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600">
                          <Star size={14} weight="fill" /> {officer.rating}/5.0
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
