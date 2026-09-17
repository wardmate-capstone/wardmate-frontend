import React, { useState } from 'react';
import {
  QrCode,
  X,
  BuildingOffice,
  FileText,
  User,
  IdentificationCard,
} from '@phosphor-icons/react';
import type { Application } from '@/types/application';
import { ApplicationStatusBadge } from '@/components/common/ApplicationStatusBadge';
import { toast } from 'sonner';

interface OfficerScanQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  applications: Application[];
  onConfirmReceipt: (applicationId: string, receiptData: { deskNumber: string; receiptNumber: string }) => void;
}

export const OfficerScanQrModal: React.FC<OfficerScanQrModalProps> = ({
  isOpen,
  onClose,
  applications,
  onConfirmReceipt,
}) => {
  const [searchCode, setSearchCode] = useState('HS-2026-00128');
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [verifiedDocs, setVerifiedDocs] = useState(false);
  const [deskNumber, setDeskNumber] = useState('Quầy 01 - Tiếp nhận Hộ tịch');

  if (!isOpen) return null;

  const handleScan = () => {
    const found = applications.find(
      (a) =>
        a.applicationNumber.toLowerCase() === searchCode.trim().toLowerCase() ||
        a.id.toLowerCase() === searchCode.trim().toLowerCase()
    );
    if (found) {
      setSelectedApp(found);
      setVerifiedDocs(false);
      toast.success(`Đã nhận diện mã QR hồ sơ: ${found.applicationNumber}`);
    } else {
      toast.error('Không tìm thấy hồ sơ tương ứng với mã quét!');
    }
  };

  const handleConfirm = () => {
    if (!selectedApp) return;
    if (!verifiedDocs) {
      toast.warning('Vui lòng tích xác nhận đã đối chiếu giấy tờ gốc tại quầy!');
      return;
    }
    const receiptNumber = `TN-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    onConfirmReceipt(selectedApp.id, {
      deskNumber,
      receiptNumber,
    });
    toast.success(`Đã tiếp nhận chính thức hồ sơ ${selectedApp.applicationNumber}. Giấy hẹn: ${receiptNumber}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-red-900 text-white">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-gold-400 text-red-950 shadow-xs">
              <QrCode size={22} weight="bold" />
            </span>
            <div>
              <h2 className="text-base font-bold">Quét Mã QR & Tiếp Nhận Tại Quầy</h2>
              <p className="text-xs text-red-100/80">Đối chiếu hồ sơ giấy và xác nhận tiếp nhận chính thức tại UBND</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-white/80 hover:bg-white/10 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Scanner Simulation Input */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <label className="block text-xs font-bold text-slate-700">
              Quét mã QR từ điện thoại/giấy hẹn của công dân (hoặc nhập mã hồ sơ):
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchCode}
                  onChange={(e) => setSearchCode(e.target.value)}
                  placeholder="Ví dụ: HS-2026-00128..."
                  className="w-full h-11 px-4 text-sm font-semibold rounded-xl border border-slate-300 bg-white focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-100"
                />
              </div>
              <button
                type="button"
                onClick={handleScan}
                className="inline-flex items-center gap-2 px-5 h-11 rounded-xl bg-red-800 hover:bg-red-900 text-white text-sm font-bold shadow-xs cursor-pointer"
              >
                <QrCode size={18} />
                <span>Quét mã</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              Gợi ý thử: <code className="px-1.5 py-0.5 rounded bg-slate-200 font-mono text-red-800">HS-2026-00128</code> (Đã duyệt tiền kiểm) hoặc <code className="px-1.5 py-0.5 rounded bg-slate-200 font-mono text-red-800">HS-2026-00131</code>
            </p>
          </div>

          {/* Scanned Result */}
          {selectedApp ? (
            <div className="space-y-4 rounded-xl border border-slate-200 p-5 bg-white shadow-xs">
              <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Kết quả nhận diện</span>
                  <h3 className="text-lg font-bold text-slate-900 mt-0.5">{selectedApp.procedureName}</h3>
                  <p className="text-xs font-mono font-bold text-red-800 mt-0.5">{selectedApp.applicationNumber}</p>
                </div>
                <ApplicationStatusBadge status={selectedApp.status} size="md" />
              </div>

              {/* Citizen Details */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="flex items-center gap-2 text-slate-700">
                  <User size={16} className="text-slate-400" />
                  <span>Công dân: <strong>{selectedApp.citizen.fullName}</strong></span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <IdentificationCard size={16} className="text-slate-400" />
                  <span>Số CCCD: <strong>{selectedApp.citizen.citizenId}</strong></span>
                </div>
              </div>

              {/* Check against physical items */}
              <div className="p-3.5 rounded-lg bg-amber-50/70 border border-amber-200 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-amber-900">
                  <FileText size={16} />
                  <span>Thành phần hồ sơ giấy cần đối chiếu:</span>
                </div>
                <ul className="space-y-1 pl-5 list-disc text-slate-700">
                  {selectedApp.checklist.map((item) => (
                    <li key={item.id}>
                      <span className="font-medium">{item.name}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Desk selection & verification checkbox */}
              <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Quầy thực hiện tiếp nhận:</label>
                  <select
                    value={deskNumber}
                    onChange={(e) => setDeskNumber(e.target.value)}
                    className="w-full h-10 px-3 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-red-600"
                  >
                    <option value="Quầy 01 - Tiếp nhận Hộ tịch">Quầy 01 - Tiếp nhận Hộ tịch</option>
                    <option value="Quầy 02 - Hộ tịch & Chứng thực">Quầy 02 - Hộ tịch & Chứng thực</option>
                    <option value="Quầy 03 - Chứng thực bản sao & Chữ ký">Quầy 03 - Chứng thực bản sao & Chữ ký</option>
                  </select>
                </div>

                <label className="flex items-start gap-2.5 p-3 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors">
                  <input
                    type="checkbox"
                    checked={verifiedDocs}
                    onChange={(e) => setVerifiedDocs(e.target.checked)}
                    className="mt-0.5 size-4 accent-red-800 rounded"
                  />
                  <span className="text-xs text-slate-800 font-medium">
                    Tôi xác nhận công dân đã xuất trình đầy đủ các giấy tờ bản gốc / bản chính hợp lệ, trùng khớp 100% với dữ liệu tiền kiểm điện tử.
                  </span>
                </label>
              </div>
            </div>
          ) : (
            <div className="py-10 text-center text-slate-400">
              <QrCode size={48} className="mx-auto text-slate-300 mb-3" />
              <p className="text-sm font-medium">Chưa có mã QR nào được quét</p>
              <p className="text-xs text-slate-400 mt-1">Bấm nút "Quét mã" phía trên để mô phỏng nhận diện mã QR</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-200 transition-colors"
          >
            Đóng
          </button>
          {selectedApp && (
            <button
              type="button"
              onClick={handleConfirm}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <BuildingOffice size={16} weight="bold" />
              <span>Xác nhận Tiếp nhận chính thức</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
