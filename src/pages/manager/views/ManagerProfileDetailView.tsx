import React, { useState } from 'react';
import {
  ArrowLeft,
  IdentificationCard,
  MapPin,
  ShieldCheck,
  FileText,
  ClockCounterClockwise,
  PencilSimple,
  Printer,
  CheckCircle,
  Clock,
  WarningCircle,
  Files,
  DownloadSimple,
  Copy,
} from '@phosphor-icons/react';
import { ManagerProfileItem } from '../types';
import { toast } from '@/components/ui/Toast';

interface ManagerProfileDetailViewProps {
  profile: ManagerProfileItem;
  onBack: () => void;
  onEdit: (profile: ManagerProfileItem) => void;
}

type TabType = 'identity-residence' | 'dossier-history' | 'electronic-documents';

export const ManagerProfileDetailView: React.FC<ManagerProfileDetailViewProps> = ({
  profile,
  onBack,
  onEdit,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('identity-residence');

  function formatDate(d: string) {
    if (!d || !d.includes('-')) return d;
    const [y, m, day] = d.split('-');
    return `${day}/${m}/${y}`;
  }

  const handleCopyCCCD = () => {
    navigator.clipboard.writeText(profile.identityNumber);
    toast.success(`Đã sao chép số CCCD: ${profile.identityNumber}`);
  };

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white rounded-xl border border-slate-200">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-bold text-red-900 hover:text-red-950 px-3 py-2 rounded-lg bg-red-50 hover:bg-red-100 transition-colors"
        >
          <ArrowLeft size={16} /> Quay lại danh sách công dân
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
            onClick={() => toast.success(`Đã xuất phiếu trích lục thông tin công dân ${profile.fullName} (PDF).`)}
          >
            <Printer size={16} /> In phiếu thông tin
          </button>
          <button
            type="button"
            className="admin-primary-action text-xs"
            onClick={() => onEdit(profile)}
          >
            <PencilSimple size={16} /> Chỉnh sửa hồ sơ
          </button>
        </div>
      </div>

      {/* Citizen Overview Header Banner */}
      <div className="admin-card p-6 border-l-4 border-l-red-800">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="size-16 rounded-2xl bg-red-900 text-white font-extrabold text-xl flex items-center justify-center shrink-0 shadow-md">
              {profile.fullName
                .split(' ')
                .slice(-2)
                .map((part) => part[0])
                .join('')}
            </div>
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl font-bold text-slate-900">{profile.fullName}</h1>

                <span className="admin-status-badge is-success flex items-center gap-1">
                  <ShieldCheck size={14} /> Đã xác thực
                </span>
              </div>


            </div>
          </div>


        </div>
      </div>

      {/* Thanh điều hướng 3 Tab */}
      <div className="border-b border-slate-200 bg-white rounded-t-xl px-4 pt-2 shadow-2xs">
        <nav className="flex space-x-2 sm:space-x-4 overflow-x-auto" aria-label="Tabs chi tiết hồ sơ công dân">
          <button
            type="button"
            onClick={() => setActiveTab('identity-residence')}
            className={`flex items-center gap-2 py-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'identity-residence'
                ? 'border-red-800 text-red-900 bg-red-50/40 rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <IdentificationCard size={18} weight={activeTab === 'identity-residence' ? 'bold' : 'regular'} />
            <span>1. Thông tin cá nhân</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('dossier-history')}
            className={`flex items-center gap-2 py-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'dossier-history'
                ? 'border-red-800 text-red-900 bg-red-50/40 rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <ClockCounterClockwise size={18} weight={activeTab === 'dossier-history' ? 'bold' : 'regular'} />
            <span>2. Lịch sử Hồ sơ </span>
            <span className="ml-1 px-2 py-0.5 text-[11px] rounded-full bg-slate-100 text-slate-700 font-mono">
              {profile.dossierHistory?.length || 0}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('electronic-documents')}
            className={`flex items-center gap-2 py-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'electronic-documents'
                ? 'border-red-800 text-red-900 bg-red-50/40 rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <Files size={18} weight={activeTab === 'electronic-documents' ? 'bold' : 'regular'} />
            <span>3. Giấy tờ điện tử đã nộp</span>
            <span className="ml-1 px-2 py-0.5 text-[11px] rounded-full bg-slate-100 text-slate-700 font-mono">
              3
            </span>
          </button>
        </nav>
      </div>

      {/* TAB CONTENT 1: Thông tin Định danh & Nhân thân và Địa chỉ & Nơi cư trú */}
      {activeTab === 'identity-residence' && (
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Khối 1: Định danh & Nhân thân */}
            <section className="admin-card p-5 space-y-4">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <IdentificationCard size={18} className="text-red-800" />
                Thông tin Định danh & Nhân thân
              </h2>

              {/* Thẻ CCCD nổi bật dạng thẻ căn cước */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-red-50/90 to-amber-50/50 border border-red-200/90 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-red-800 uppercase tracking-wider">
                    Thẻ Căn cước công dân gắn chip / VNeID
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Số định danh cá nhân (CCCD):</span>
                    <span className="font-mono text-xl font-black text-red-950 tracking-wider">
                      {profile.identityNumber}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyCCCD}
                    className="px-2.5 py-1.5 rounded-lg bg-white border border-red-200 text-xs font-bold text-red-900 hover:bg-red-50 transition-colors shadow-2xs inline-flex items-center gap-1.5"
                  >
                    <Copy size={14} weight="bold" />
                    <span>Sao chép</span>
                  </button>
                </div>
              </div>

              <div className="space-y-3 text-xs pt-1">
                <div className="flex justify-between py-1.5 border-b border-slate-50">
                  <span className="text-slate-500">Họ và tên khai sinh</span>
                  <strong className="text-slate-900 text-sm">{profile.fullName}</strong>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-50">
                  <span className="text-slate-500">Ngày tháng năm sinh</span>
                  <span className="font-semibold text-slate-800">{formatDate(profile.dateOfBirth)}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-50">
                  <span className="text-slate-500">Giới tính</span>
                  <span className="font-semibold text-slate-800">{profile.gender}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-50">
                  <span className="text-slate-500">Dân tộc</span>
                  <span className="font-semibold text-slate-800">{profile.ethnicity || 'Kinh'}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-50">
                  <span className="text-slate-500">Quốc tịch</span>
                  <span className="font-semibold text-slate-800">Việt Nam</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-500">Số điện thoại liên hệ</span>
                  <span className="font-bold text-slate-900">{profile.phoneNumber}</span>
                </div>
              </div>
            </section>

            {/* Khối 2: Địa chỉ & Nơi cư trú */}
            <section className="admin-card p-5 space-y-4">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <MapPin size={18} className="text-red-800" />
                Địa chỉ & Nơi cư trú
              </h2>

              <div className="space-y-4 text-xs">
                <div>
                  <span className="text-slate-400 block mb-1 font-semibold uppercase text-[10px] tracking-wider">
                    Nơi thường trú (Hộ khẩu chính thức)
                  </span>
                  <p className="text-slate-800 font-medium bg-slate-50 p-3.5 rounded-xl border border-slate-100 leading-relaxed text-xs">
                    {profile.permanentAddress}
                  </p>
                </div>

                <div>
                  <span className="text-slate-400 block mb-1 font-semibold uppercase text-[10px] tracking-wider">
                    Nơi tạm trú / Nơi ở hiện tại
                  </span>
                  <p className="text-slate-800 font-medium bg-slate-50 p-3.5 rounded-xl border border-slate-100 leading-relaxed text-xs">
                    {profile.temporaryAddress}
                  </p>
                </div>


              </div>
            </section>
          </div>


        </div>
      )}

      {/* TAB CONTENT 2: Lịch sử Hồ sơ Thủ tục Hành chính tại Phường */}
      {activeTab === 'dossier-history' && (
        <div className="space-y-6">
          <section className="admin-card p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <ClockCounterClockwise size={18} className="text-red-800" />
                  Lịch sử Hồ sơ Thủ tục Hành chính tại Phường
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Toàn bộ các hồ sơ TTHC công dân đã thực hiện tại UBND Phường An Khánh
                </p>
              </div>
              <span className="admin-status-badge is-info">
                {profile.dossierHistory?.length || 0} hồ sơ đã phát sinh
              </span>
            </div>

            <div className="space-y-3">
              {profile.dossierHistory && profile.dossierHistory.length > 0 ? (
                profile.dossierHistory.map((dossier) => (
                  <div
                    key={dossier.code}
                    className="p-4 rounded-xl border border-slate-200 bg-white hover:border-red-200 hover:shadow-2xs transition-all space-y-2.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-xs font-bold text-red-900 bg-red-50 px-2.5 py-1 rounded border border-red-100">
                          {dossier.code}
                        </span>
                        <strong className="text-sm text-slate-900">{dossier.procedureName}</strong>
                      </div>
                      <span
                        className={`admin-status-badge ${
                          dossier.status === 'Đã hoàn thành'
                            ? 'is-success'
                            : dossier.status === 'Đang xử lý'
                            ? 'is-info'
                            : 'is-warning'
                        }`}
                      >
                        {dossier.status === 'Đã hoàn thành' && <CheckCircle size={13} className="mr-1 inline" />}
                        {dossier.status === 'Đang xử lý' && <Clock size={13} className="mr-1 inline" />}
                        {dossier.status === 'Cần bổ sung' && <WarningCircle size={13} className="mr-1 inline" />}
                        {dossier.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-slate-600 pt-1 border-t border-slate-100">
                      <div>
                        <span className="text-slate-400 block text-[11px]">Lĩnh vực:</span>
                        <span className="font-medium text-slate-800">{dossier.field}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Thời gian nộp:</span>
                        <span className="font-medium text-slate-800">{dossier.submittedAt}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Cán bộ thụ lý:</span>
                        <span className="font-medium text-slate-800">{dossier.officer}</span>
                      </div>
                      <div className="text-right sm:text-right">
                        <button
                          type="button"
                          onClick={() => toast.info(`Đang mở chi tiết hồ sơ ${dossier.code}`)}
                          className="text-xs font-bold text-red-800 hover:text-red-950 underline"
                        >
                          Xem hồ sơ điện tử
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 py-8 text-center">
                  Công dân chưa phát sinh giao dịch hồ sơ TTHC nào tại phường.
                </p>
              )}
            </div>
          </section>

          {/* Ghi chú của Cán bộ Tiếp nhận Một cửa */}
          <section className="admin-card p-5 space-y-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <FileText size={18} className="text-red-800" />
              Ghi chú của Cán bộ Tiếp nhận Một cửa
            </h2>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-lg bg-amber-50/70 border border-amber-200/70 text-amber-950 space-y-1">
                <div className="flex justify-between font-bold text-[11px] text-amber-800">
                  <span>Cán bộ: Nguyễn Minh Anh</span>
                  <span>28/09/2026 · 10:15</span>
                </div>
                <p className="leading-relaxed">
                  "Công dân đã hoàn thiện khai sinh qua tiền kiểm số WardMate, giấy tờ đầy đủ theo quy định. Đã cấp giấy khai sinh bản chính và 02 bản sao."
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-100 text-slate-700 space-y-1">
                <div className="flex justify-between font-bold text-[11px] text-slate-500">
                  <span>Cán bộ: Trần Quốc Bảo</span>
                  <span>20/04/2026 · 15:30</span>
                </div>
                <p className="leading-relaxed">
                  "Hai bên nam nữ đã ký Giấy chứng nhận kết hôn trực tiếp tại UBND phường. Hồ sơ lưu trữ điện tử đầy đủ."
                </p>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* TAB CONTENT 3: Giấy tờ điện tử đã nộp */}
      {activeTab === 'electronic-documents' && (
        <section className="admin-card p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Files size={18} className="text-red-800" />
                Giấy tờ điện tử đã nộp
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Các tệp đính kèm, ảnh chụp bản chính và bản số hóa công dân đã tải lên kho hồ sơ phường
              </p>
            </div>
            <button
              type="button"
              onClick={() => toast.success('Đang nén và tải về toàn bộ tệp đính kèm...')}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-red-900 bg-red-50 hover:bg-red-100 border border-red-200 px-3 py-1.5 rounded-lg transition-colors"
            >
              <DownloadSimple size={15} /> Tải toàn bộ tệp (.zip)
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                name: 'Bản quét Căn cước công dân (Mặt trước & sau)',
                type: 'PDF',
                size: '1.8 MB',
                date: '28/09/2026',
                status: 'Đã xác thực',
                desc: 'Ảnh scan chip CCCD, thông tin trùng khớp CSDLQG về dân cư',
              },
              {
                name: 'Giấy chứng sinh / Giấy khai sinh trích lục',
                type: 'PDF',
                size: '2.4 MB',
                date: '28/09/2026',
                status: 'Đã xác thực',
                desc: 'Bản số hóa từ Bệnh viện Phụ sản Hà Nội, có chữ ký số',
              },
              {
                name: 'Xác nhận thông tin về cư trú (Mẫu CT07)',
                type: 'PDF',
                size: '920 KB',
                date: '15/08/2026',
                status: 'Đã lưu trữ',
                desc: 'Xác nhận thường trú tại Tổ dân phố 04, Phường An Khánh',
              },
            ].map((doc) => (
              <div
                key={doc.name}
                className="flex flex-col justify-between p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-red-200 hover:shadow-2xs transition-all space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-100 text-red-900">
                      {doc.type}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                      <CheckCircle size={12} /> {doc.status}
                    </span>
                  </div>
                  <strong className="block text-xs font-bold text-slate-900 line-clamp-2">
                    {doc.name}
                  </strong>
                  <p className="text-[11px] text-slate-500 line-clamp-2">
                    {doc.desc}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span>{doc.size} · {doc.date}</span>
                  <button
                    type="button"
                    onClick={() => toast.success(`Đang tải tệp: ${doc.name}`)}
                    className="p-1.5 rounded-lg text-red-800 hover:bg-red-50 hover:text-red-950 transition-colors inline-flex items-center gap-1 font-semibold text-xs"
                    title="Tải tệp đính kèm"
                  >
                    <DownloadSimple size={15} /> Tải về
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
