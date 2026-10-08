import { useState } from 'react';
import { DownloadSimple, Printer, QrCode } from '@phosphor-icons/react';
import { BrandMark } from '@/components/brand/BrandMark';
import { toast } from '@/components/ui/Toast';
import type { CitizenDossier } from '../types';
import { getStatusBadgeClass } from '../types';

interface CitizenQrCodeViewProps {
  dossiers: CitizenDossier[];
}

export function CitizenQrCodeView({ dossiers }: CitizenQrCodeViewProps) {
  const [selectedCode, setSelectedCode] = useState(dossiers[0]?.code || '');
  const activeDossier = dossiers.find((d) => d.code === selectedCode) || dossiers[0];

  if (!activeDossier) {
    return (
      <section className="admin-card admin-content-card p-12 text-center text-slate-500">
        <QrCode size={48} className="mx-auto text-slate-300 mb-3" />
        <h3 className="text-base font-bold text-slate-800">Chưa có mã QR hồ sơ</h3>
        <p className="text-xs text-slate-400 mt-1 italic">
          ⚠️ API mã QR hồ sơ điện tử sẽ được tích hợp sau.
        </p>
      </section>
    );
  }

  return (
    <div className="admin-split-view admin-content-card">
      {/* Khối hiển thị QR Code */}
      <section className="admin-card p-6 flex flex-col items-center text-center">
        <span className="admin-status-badge is-success mb-3">Mã hợp lệ tiền kiểm</span>
        <h2 className="text-lg font-bold text-slate-950">{activeDossier.procedureName}</h2>
        <p className="text-xs text-slate-500 mt-1">
          Mã tra cứu: <span className="font-mono font-bold text-slate-800">{activeDossier.code}</span>
        </p>

        {/* Khung QR minh họa sắc nét */}
        <div className="my-6 rounded-2xl border-4 border-slate-900 bg-white p-5 shadow-lg">
          <div className="relative size-48 sm:size-56 grid place-items-center bg-slate-950 text-white rounded-lg p-3">
            <QrCode size={190} weight="regular" />
            <div className="absolute inset-0 grid place-items-center pointer-events-none">
              <div className="size-10 rounded-lg bg-red-800 border-2 border-white grid place-items-center shadow-md">
                <BrandMark size={22} className="text-white" />
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-md text-xs text-slate-600 space-y-1">
          <p>Xuất trình mã này cho cán bộ Bộ phận Một cửa hoặc quét tại ki-ốt tiếp nhận.</p>
          <p className="text-[11px] text-slate-400">Thời gian tạo mã: {activeDossier.updatedAt}</p>
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            className="admin-primary-action"
            onClick={() => toast.success('Đã tải hình ảnh mã QR về điện thoại')}
          >
            <DownloadSimple size={17} weight="bold" /> Tải ảnh mã QR
          </button>
          <button
            type="button"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 hover:bg-slate-50"
            onClick={() => toast.info('Đang kết nối máy in')}
          >
            <Printer size={17} /> In phiếu hẹn
          </button>
        </div>
      </section>

      {/* Danh sách chọn hồ sơ xem mã QR */}
      <aside className="admin-card p-5">
        <h3 className="text-sm font-bold text-slate-950 mb-3">Chọn hồ sơ xem mã QR</h3>
        <div className="space-y-2">
          {dossiers.map((d) => (
            <button
              key={d.code}
              type="button"
              onClick={() => setSelectedCode(d.code)}
              className={`w-full text-left p-3 rounded-xl border transition-all ${
                selectedCode === d.code
                  ? 'border-red-600 bg-red-50/50 shadow-sm'
                  : 'border-slate-200 bg-white hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <strong className="text-xs font-mono font-bold text-slate-900">{d.code}</strong>
                <span className={`admin-status-badge ${getStatusBadgeClass(d.status)}`}>{d.status}</span>
              </div>
              <p className="mt-1 text-xs font-semibold text-slate-800 line-clamp-1">{d.procedureName}</p>
            </button>
          ))}
        </div>
      </aside>
    </div>
  );
}
