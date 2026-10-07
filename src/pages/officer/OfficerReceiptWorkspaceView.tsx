import React, { useState, useMemo } from 'react';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useAuthStore } from '@/stores/authStore';
import {
  MagnifyingGlass,
  CheckSquare,
  CheckCircle,
  FilePdf,
  Printer,
  X,
  IdentificationBadge,
} from '@phosphor-icons/react';
import type { OfficerApplication, OfficialReceiptData } from '@/types/officer';

interface OfficerReceiptWorkspaceViewProps {
  applications: OfficerApplication[];
  activeSubTab: 'waiting' | 'received';
  onSelectSubTab: (tab: 'waiting' | 'received') => void;
  onConfirmReceipt: (appId: string, receiptData: OfficialReceiptData) => void;
  onViewApplication: (app: OfficerApplication) => void;
}

export const OfficerReceiptWorkspaceView: React.FC<OfficerReceiptWorkspaceViewProps> = ({
  applications,
  activeSubTab,
  onSelectSubTab,
  onConfirmReceipt,
  onViewApplication,
}) => {
  const { profile } = useUserProfile();
  const user = useAuthStore((state) => state.user);
  const officerName = profile?.fullName?.trim() || user?.username || 'Cán bộ Một cửa';
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedApp, setSelectedApp] = useState<OfficerApplication | null>(null);

  // Verification Checklist State
  const [paperChecks, setPaperChecks] = useState<Record<string, boolean>>({
    idCard: false,
    residenceDoc: false,
    printedForm: false,
    signatureVerified: false,
  });

  // Modal
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [receiptNumber, setReceiptNumber] = useState(`BN-2026-${Math.floor(10000 + Math.random() * 90000)}`);
  const [appointmentDate, setAppointmentDate] = useState('24/09/2026 15:30');

  // Applications in waiting for official receipt (READY_TO_SUBMIT or APPROVED)
  const waitingApps = useMemo(() => {
    return applications.filter(
      (a) => a.status === 'READY_TO_SUBMIT' || a.status === 'APPROVED'
    );
  }, [applications]);

  // Officially received applications
  const receivedApps = useMemo(() => {
    return applications.filter((a) => a.status === 'OFFICIALLY_RECEIVED');
  }, [applications]);

  // Filtered waiting list
  const filteredWaitingApps = useMemo(() => {
    if (!searchQuery.trim()) return waitingApps;
    const q = searchQuery.toLowerCase();
    return waitingApps.filter(
      (a) =>
        a.applicationNumber.toLowerCase().includes(q) ||
        a.citizen.fullName.toLowerCase().includes(q) ||
        a.citizen.citizenId.includes(q) ||
        a.citizen.phoneNumber.includes(q)
    );
  }, [waitingApps, searchQuery]);

  const allChecksPassed = Object.values(paperChecks).every(Boolean);

  const handleOpenReceiptProcess = (app: OfficerApplication) => {
    setSelectedApp(app);
    // Reset check state
    setPaperChecks({
      idCard: false,
      residenceDoc: false,
      printedForm: false,
      signatureVerified: false,
    });
    setReceiptNumber(`BN-2026-${Math.floor(10000 + Math.random() * 90000)}`);
  };

  const handleFinalConfirm = () => {
    if (!selectedApp) return;
    onConfirmReceipt(selectedApp.id, {
      receivedAt: '21/09/2026 10:15',
      receivedBy: `Cán bộ ${officerName}`,
      deskNumber: 'Quầy 02',
      receiptNumber,
      appointmentDate,
    });
    setShowConfirmModal(false);
    setSelectedApp(null);
    onSelectSubTab('received');
  };

  return (
    <section aria-label="Tiếp nhận hồ sơ chính thức tại quầy" className="space-y-6">
      {/* Sub-tab Switch */}
      <nav aria-label="Lựa chọn phân hệ tiếp nhận" className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          type="button"
          onClick={() => {
            onSelectSubTab('waiting');
            setSelectedApp(null);
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'waiting'
              ? 'bg-red-800 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <span>Chờ tiếp nhận ({waitingApps.length})</span>
        </button>

        <button
          type="button"
          onClick={() => {
            onSelectSubTab('received');
            setSelectedApp(null);
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'received'
              ? 'bg-red-800 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <span>Đã tiếp nhận ({receivedApps.length})</span>
        </button>
      </nav>

      {/* VIEW 1: CHỜ TIẾP NHẬN & ĐỐI CHIẾU HỒ SƠ GIẤY */}
      {activeSubTab === 'waiting' && (
        <div className="space-y-6">
          {/* If no application selected for check, show search & waiting queue */}
          {!selectedApp ? (
            <div className="space-y-6">
              {/* Search Bar - Note: No QR scan required per requirements */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-950">Tìm kiếm hồ sơ đã duyệt tiền kiểm</h3>
                    <p className="text-xs text-slate-500">
                      Khi công dân đến quầy, tra cứu theo Mã hồ sơ, CCCD, Số điện thoại hoặc Họ tên
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                    Sẵn sàng tiếp nhận tại quầy
                  </span>
                </div>

                <div className="relative">
                  <label htmlFor="receipt-search-input" className="sr-only">
                    Tìm kiếm hồ sơ đã duyệt
                  </label>
                  <MagnifyingGlass size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="receipt-search-input"
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Nhập mã hồ sơ (VD: HS-2026-00130), số CCCD, hoặc họ tên công dân..."
                    className="w-full rounded-xl border border-slate-300 bg-slate-50/50 py-3 pl-12 pr-10 text-sm text-slate-950 focus:border-red-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-red-100"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              </div>

              {/* Waiting List Results */}
              <div className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900">
                    Danh sách công dân đã duyệt tiền kiểm chờ nộp hồ sơ ({filteredWaitingApps.length})
                  </h4>
                  <span className="text-xs text-slate-400">Đối chiếu và cấp biên nhận tại quầy</span>
                </div>

                <ul className="divide-y divide-slate-100">
                  {filteredWaitingApps.length === 0 ? (
                    <li className="py-12 text-center text-sm text-slate-500">
                      Không tìm thấy hồ sơ nào đang chờ tiếp nhận.
                    </li>
                  ) : (
                    filteredWaitingApps.map((app) => (
                      <li
                        key={app.id}
                        className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors"
                      >
                        <div className="flex items-start gap-4 min-w-0">
                          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-teal-100 text-teal-800 font-mono font-bold text-xs">
                            {app.procedureCategory.slice(0, 2).toUpperCase()}
                          </span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <strong className="text-sm font-bold text-slate-950 font-mono">
                                {app.applicationNumber}
                              </strong>
                              <span className="px-2.5 py-0.5 text-[11px] font-bold rounded-full bg-emerald-100 text-emerald-900 border border-emerald-200">
                                Đã duyệt tiền kiểm (V{app.currentVersion})
                              </span>
                            </div>
                            <p className="text-xs font-semibold text-slate-800 mt-0.5">
                              {app.citizen.fullName} · CCCD: <span className="font-mono">{app.citizen.citizenId}</span> · SĐT: {app.citizen.phoneNumber}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5">
                              Thủ tục: <strong>{app.procedureName}</strong> · Đã duyệt lúc: {app.reviewedAt || app.submittedAt}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                          <button
                            type="button"
                            onClick={() => onViewApplication(app)}
                            className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            Xem hồ sơ
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenReceiptProcess(app)}
                            className="px-4 py-2 rounded-xl bg-teal-700 text-xs font-bold text-white hover:bg-teal-800 shadow-2xs flex items-center gap-1.5"
                          >
                            <CheckSquare size={16} weight="bold" />
                            <span>Bắt đầu đối chiếu giấy tờ</span>
                          </button>
                        </div>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            </div>
          ) : (
            /* COMPARISON WORKSPACE: Electronic Dossier vs Paper Dossier */
            <div className="space-y-6">
              {/* Back to search */}
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setSelectedApp(null)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-red-800"
                >
                  <X size={16} />
                  <span>Đổi hồ sơ khác</span>
                </button>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Đang đối chiếu tại quầy:</span>
                  <strong className="text-xs font-bold text-slate-900 font-mono">
                    {selectedApp.applicationNumber}
                  </strong>
                </div>
              </div>

              {/* Two Column Layout (Screen 23 in Officer.md) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column: Hồ sơ điện tử đã duyệt */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <FilePdf size={20} className="text-red-700" />
                      <h4 className="text-sm font-bold text-slate-900">Hồ sơ điện tử đã duyệt tiền kiểm</h4>
                    </div>
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Phiên bản V{selectedApp.currentVersion}
                    </span>
                  </div>

                  <dl className="space-y-2 text-xs">
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <dt className="text-slate-500">Người yêu cầu:</dt>
                      <dd className="font-bold text-slate-900">{selectedApp.citizen.fullName}</dd>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <dt className="text-slate-500">Số CCCD:</dt>
                      <dd className="font-mono font-bold text-slate-900">{selectedApp.citizen.citizenId}</dd>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <dt className="text-slate-500">Thủ tục:</dt>
                      <dd className="font-semibold text-slate-800">{selectedApp.procedureName}</dd>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <dt className="text-slate-500">Địa chỉ thường trú:</dt>
                      <dd className="text-right text-slate-800">{selectedApp.citizen.address}</dd>
                    </div>
                  </dl>

                  <div className="space-y-2 pt-2">
                    <span className="block text-xs font-bold text-slate-800">Tài liệu điện tử kèm theo:</span>
                    <ul className="space-y-1.5 text-xs text-slate-600">
                      {selectedApp.documents.map((d) => (
                        <li key={d.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                          <span>{d.name}</span>
                          <span className="text-emerald-700 font-semibold text-[11px]">✓ Đã duyệt tiền kiểm</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => onViewApplication(selectedApp)}
                      className="text-xs font-bold text-red-800 hover:underline inline-flex items-center gap-1"
                    >
                      <span>Mở toàn bộ hồ sơ điện tử để xem chi tiết</span>
                    </button>
                  </div>
                </div>

                {/* Right Column: Đối chiếu hồ sơ giấy (Officer Checklist) */}
                <div className="rounded-2xl border border-teal-200 bg-teal-50/40 p-5 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between border-b border-teal-100 pb-3">
                    <div className="flex items-center gap-2 text-teal-950 font-bold">
                      <IdentificationBadge size={20} />
                      <h4 className="text-sm font-bold">Đối chiếu hồ sơ giấy thực tế tại quầy</h4>
                    </div>
                    <span className="text-[11px] font-semibold text-teal-800">
                      Cán bộ trực tiếp kiểm tra
                    </span>
                  </div>

                  <p className="text-xs text-slate-600">
                    Kiểm tra các giấy tờ công dân mang đến quầy. Đánh dấu tích sau khi đối chiếu khớp với bản điện tử:
                  </p>

                  <ul className="space-y-3">
                    <li className="flex items-start gap-3 p-3 rounded-xl border border-teal-200 bg-white">
                      <input
                        type="checkbox"
                        id="chk-id-card"
                        checked={paperChecks.idCard}
                        onChange={(e) => setPaperChecks({ ...paperChecks, idCard: e.target.checked })}
                        className="mt-0.5 size-4 rounded text-teal-700 focus:ring-teal-600"
                      />
                      <label htmlFor="chk-id-card" className="text-xs cursor-pointer">
                        <strong className="block font-bold text-slate-900">Bản chính CCCD / Hộ chiếu khớp thông tin</strong>
                        <span className="text-slate-500">Đối chiếu trực tiếp khuôn mặt công dân và số định danh trên thẻ</span>
                      </label>
                    </li>

                    <li className="flex items-start gap-3 p-3 rounded-xl border border-teal-200 bg-white">
                      <input
                        type="checkbox"
                        id="chk-residence"
                        checked={paperChecks.residenceDoc}
                        onChange={(e) => setPaperChecks({ ...paperChecks, residenceDoc: e.target.checked })}
                        className="mt-0.5 size-4 rounded text-teal-700 focus:ring-teal-600"
                      />
                      <label htmlFor="chk-residence" className="text-xs cursor-pointer">
                        <strong className="block font-bold text-slate-900">Giấy tờ chứng minh / Hộ tịch bản gốc</strong>
                        <span className="text-slate-500">Kiểm tra con dấu đỏ, chữ ký công chứng hoặc xác nhận cư trú</span>
                      </label>
                    </li>

                    <li className="flex items-start gap-3 p-3 rounded-xl border border-teal-200 bg-white">
                      <input
                        type="checkbox"
                        id="chk-printed-form"
                        checked={paperChecks.printedForm}
                        onChange={(e) => setPaperChecks({ ...paperChecks, printedForm: e.target.checked })}
                        className="mt-0.5 size-4 rounded text-teal-700 focus:ring-teal-600"
                      />
                      <label htmlFor="chk-printed-form" className="text-xs cursor-pointer">
                        <strong className="block font-bold text-slate-900">Tờ khai in sẵn có chữ ký tươi</strong>
                        <span className="text-slate-500">Công dân ký tên xác nhận trực tiếp trước mặt cán bộ Một cửa</span>
                      </label>
                    </li>

                    <li className="flex items-start gap-3 p-3 rounded-xl border border-teal-200 bg-white">
                      <input
                        type="checkbox"
                        id="chk-sig-verified"
                        checked={paperChecks.signatureVerified}
                        onChange={(e) => setPaperChecks({ ...paperChecks, signatureVerified: e.target.checked })}
                        className="mt-0.5 size-4 rounded text-teal-700 focus:ring-teal-600"
                      />
                      <label htmlFor="chk-sig-verified" className="text-xs cursor-pointer">
                        <strong className="block font-bold text-slate-900">Hồ sơ giấy đầy đủ số lượng bản</strong>
                        <span className="text-slate-500">Đã đủ số lượng bản sao chứng thực hoặc bản chính lưu trữ</span>
                      </label>
                    </li>
                  </ul>

                  {/* Submit Official Receipt Button */}
                  <div className="pt-3">
                    <button
                      type="button"
                      disabled={!allChecksPassed}
                      onClick={() => setShowConfirmModal(true)}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-teal-800 py-3 text-sm font-bold text-white hover:bg-teal-900 disabled:opacity-40 disabled:cursor-not-allowed shadow-md transition-all"
                    >
                      <CheckCircle size={18} weight="bold" />
                      <span>Xác nhận tiếp nhận chính thức tại quầy</span>
                    </button>
                    {!allChecksPassed && (
                      <p className="text-[11px] text-slate-500 text-center mt-2">
                        Vui lòng đánh dấu đủ 4 tiêu chí đối chiếu để kích hoạt nút tiếp nhận
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: ĐÃ TIẾP NHẬN CHÍNH THỨC */}
      {activeSubTab === 'received' && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-900">
              Danh sách hồ sơ đã hoàn thành tiếp nhận tại quầy ({receivedApps.length})
            </h4>
            <span className="text-xs text-slate-500">Chế độ xem thông tin chỉ đọc</span>
          </div>

          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[840px] text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase text-slate-500">
                  <th className="px-5 py-3.5">Mã hồ sơ</th>
                  <th className="px-4 py-3.5">Công dân</th>
                  <th className="px-4 py-3.5">Thủ tục</th>
                  <th className="px-4 py-3.5">Số biên nhận</th>
                  <th className="px-4 py-3.5">Thời gian tiếp nhận</th>
                  <th className="px-4 py-3.5">Hẹn trả kết quả</th>
                  <th className="px-5 py-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {receivedApps.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-10 text-center text-slate-500">
                      Chưa có hồ sơ nào được tiếp nhận chính thức trong ca hôm nay.
                    </td>
                  </tr>
                ) : (
                  receivedApps.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3.5 font-mono font-bold text-slate-950">
                        {app.applicationNumber}
                      </td>
                      <td className="px-4 py-3.5">
                        <strong className="block font-bold text-slate-900">{app.citizen.fullName}</strong>
                        <span className="text-[11px] text-slate-500 font-mono">{app.citizen.citizenId}</span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-800 max-w-xs truncate">
                        {app.procedureName}
                      </td>
                      <td className="px-4 py-3.5 font-mono font-bold text-teal-800">
                        {app.officialReceipt?.receiptNumber || 'BN-2026-00892'}
                      </td>
                      <td className="px-4 py-3.5 text-slate-600">
                        {app.officialReceipt?.receivedAt || '21/09/2026 10:15'}
                      </td>
                      <td className="px-4 py-3.5 text-emerald-800 font-medium">
                        {app.officialReceipt?.appointmentDate || '24/09/2026 16:30'}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => onViewApplication(app)}
                            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            Chi tiết
                          </button>
                          <button
                            type="button"
                            className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                            title="In biên nhận hẹn trả"
                          >
                            <Printer size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL (Screen 24 in Officer.md) */}
      {showConfirmModal && selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-teal-800 font-bold">
                <CheckCircle size={22} weight="bold" />
                <h4 className="text-base font-bold">Xác nhận tiếp nhận hồ sơ chính thức</h4>
              </div>
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-5">
              Hồ sơ giấy của công dân <strong className="text-slate-900">{selectedApp.citizen.fullName}</strong> đã được kiểm tra và đối chiếu đầy đủ với hồ sơ điện tử.
            </p>

            <div className="rounded-xl border border-teal-200 bg-teal-50/50 p-4 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Mã hồ sơ tiếp nhận:</span>
                <strong className="font-mono text-slate-900">{selectedApp.applicationNumber}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Số biên nhận cấp ra:</span>
                <strong className="font-mono text-teal-900">{receiptNumber}</strong>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Thời gian hẹn trả kết quả:</span>
                <input
                  type="text"
                  value={appointmentDate}
                  onChange={(e) => setAppointmentDate(e.target.value)}
                  className="rounded border border-slate-300 px-2 py-0.5 text-xs font-bold text-slate-900 text-right"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleFinalConfirm}
                className="px-5 py-2 rounded-xl bg-teal-800 text-xs font-bold text-white hover:bg-teal-900 shadow-2xs"
              >
                Xác nhận & Cấp biên nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
