import React from 'react';
import {
  DownloadSimple,
  Printer,
  Eye,
  Plus,
} from '@phosphor-icons/react';
import { mockReportTemplates } from '../mockData';
import { toast } from '@/components/ui/Toast';

export const ManagerReportsView: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white rounded-xl border border-slate-200">
        <div>
          <h2 className="text-sm font-bold text-slate-900">
            Hệ thống Báo cáo Tổng hợp & Thống kê TTHC
          </h2>
          <p className="text-xs text-slate-500">
            Biểu mẫu báo cáo theo quy chuẩn của Văn phòng Chính phủ và UBND Thành phố
          </p>
        </div>

        <button
          type="button"
          className="admin-primary-action"
          onClick={() => toast.success('Đang khởi tạo báo cáo tùy biến mới.')}
        >
          <Plus size={18} weight="bold" />
          <span>Tạo báo cáo mới</span>
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {mockReportTemplates.map((report) => (
          <div
            key={report.id}
            className="admin-card p-5 flex flex-col justify-between hover:shadow-md transition-shadow"
          >
            <div>
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-mono text-red-900 font-bold bg-red-50 px-2 py-0.5 rounded">
                  {report.id}
                </span>
                <span className="admin-status-badge is-info">{report.type}</span>
              </div>

              <h3 className="text-sm font-bold text-slate-900 mb-2 leading-snug">
                {report.title}
              </h3>

              <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 mb-4 bg-slate-50 p-3 rounded-lg">
                <div>
                  <span className="block text-[11px] text-slate-400">Kỳ báo cáo</span>
                  <strong className="text-slate-800">{report.period}</strong>
                </div>
                <div>
                  <span className="block text-[11px] text-slate-400">Dữ liệu hồ sơ</span>
                  <strong className="text-slate-800">{report.dossiersCount} hồ sơ</strong>
                </div>
                <div>
                  <span className="block text-[11px] text-slate-400">Đơn vị lập</span>
                  <span className="text-slate-700">{report.author}</span>
                </div>
                <div>
                  <span className="block text-[11px] text-slate-400">Ngày kết xuất</span>
                  <span className="text-slate-700">{report.createdAt}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 rounded-lg border border-slate-200 hover:bg-slate-50"
                onClick={() => toast.info(`Đang mở bản xem trước của ${report.id}...`)}
              >
                <Eye size={15} /> Xem trước
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 rounded-lg border border-slate-200 hover:bg-slate-50"
                onClick={() => toast.success(`Đang tải tệp PDF: ${report.title}.pdf`)}
              >
                <Printer size={15} /> Xuất PDF
              </button>
              <button
                type="button"
                className="admin-primary-action text-xs"
                onClick={() => toast.success(`Đang tải tệp Excel: ${report.title}.xlsx`)}
              >
                <DownloadSimple size={15} /> Tải Excel
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
