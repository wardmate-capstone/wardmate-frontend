import React from 'react';
import {
  ArrowLeft,
  IdentificationCard,
  Phone,
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
} from '@phosphor-icons/react';
import { ManagerProfileItem } from '../types';
import { toast } from '@/components/ui/Toast';

interface ManagerProfileDetailViewProps {
  profile: ManagerProfileItem;
  onBack: () => void;
  onEdit: (profile: ManagerProfileItem) => void;
}

export const ManagerProfileDetailView: React.FC<ManagerProfileDetailViewProps> = ({
  profile,
  onBack,
  onEdit,
}) => {
  function formatDate(d: string) {
    if (!d || !d.includes('-')) return d;
    const [y, m, day] = d.split('-');
    return `${day}/${m}/${y}`;
  }

  const birthYear = profile.dateOfBirth.split('-')[0];
  const age = birthYear ? 2026 - parseInt(birthYear, 10) : '';

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
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl font-bold text-slate-900">{profile.fullName}</h1>
                <span
                  className={`admin-status-badge ${
                    profile.gender === 'Nam' ? 'is-info' : 'is-warning'
                  }`}
                >
                  {profile.gender} {age ? `· ${age} tuổi` : ''}
                </span>
                <span className="admin-status-badge is-success flex items-center gap-1">
                  <ShieldCheck size={14} /> VNeID Định danh Mức {profile.vneidLevel || 2}
                </span>
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-2 font-mono">
                Số định danh: <strong className="text-red-900 text-sm">{profile.identityNumber}</strong>
                <span className="text-slate-300">|</span>
                <Phone size={14} className="text-slate-400" /> {profile.phoneNumber}
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[11px] text-slate-400 block">Trạng thái CSDL Dân cư</span>
            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 mt-1">
              <CheckCircle size={14} /> Dữ liệu đã đồng bộ & xác thực
            </span>
          </div>
        </div>
      </div>

      {/* 2-Column Detail Layout */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Cột trái: Thông tin nhân thân & Nơi cư trú */}
        <div className="space-y-6 lg:col-span-5">
          {/* Thông tin căn cước & định danh */}
          <section className="admin-card p-5 space-y-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <IdentificationCard size={18} className="text-red-800" />
              Thông tin Định danh & Nhân thân
            </h2>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Mã định danh cá nhân / CCCD</span>
                <strong className="font-mono text-slate-900">{profile.identityNumber}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Ngày sinh</span>
                <span className="font-semibold text-slate-800">{formatDate(profile.dateOfBirth)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Giới tính</span>
                <span className="font-semibold text-slate-800">{profile.gender}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Dân tộc</span>
                <span className="font-semibold text-slate-800">{profile.ethnicity || 'Kinh'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Quốc tịch</span>
                <span className="font-semibold text-slate-800">Việt Nam</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Số điện thoại liên hệ</span>
                <span className="font-bold text-slate-900">{profile.phoneNumber}</span>
              </div>
            </div>
          </section>

          {/* Thông tin nơi cư trú */}
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
                <p className="text-slate-800 font-medium bg-slate-50 p-3 rounded-lg border border-slate-100 leading-relaxed">
                  {profile.permanentAddress}
                </p>
              </div>

              <div>
                <span className="text-slate-400 block mb-1 font-semibold uppercase text-[10px] tracking-wider">
                  Nơi tạm trú / Nơi ở hiện tại
                </span>
                <p className="text-slate-800 font-medium bg-slate-50 p-3 rounded-lg border border-slate-100 leading-relaxed">
                  {profile.temporaryAddress}
                </p>
              </div>
            </div>
          </section>

          {/* Giấy tờ điện tử trong kho cá nhân */}
          <section className="admin-card p-5 space-y-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Files size={18} className="text-red-800" />
              Giấy tờ điện tử đã nộp
            </h2>

            <div className="space-y-2 text-xs">
              {[
                { name: 'Bản quét Căn cước công dân (Mặt trước & sau)', size: '1.8 MB', date: '28/09/2026' },
                { name: 'Giấy chứng sinh / Giấy khai sinh trích lục', size: '2.4 MB', date: '28/09/2026' },
                { name: 'Xác nhận thông tin về cư trú (Mẫu CT07)', size: '920 KB', date: '15/08/2026' },
              ].map((doc) => (
                <div
                  key={doc.name}
                  className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 bg-slate-50/70 hover:bg-slate-50"
                >
                  <div className="min-w-0 pr-2">
                    <p className="font-semibold text-slate-800 truncate">{doc.name}</p>
                    <span className="text-[11px] text-slate-400">{doc.size} · Ngày nộp: {doc.date}</span>
                  </div>
                  <button
                    type="button"
                    className="p-1.5 text-slate-500 hover:text-red-800 rounded"
                    title="Tải tệp đính kèm"
                    onClick={() => toast.success(`Đang tải tệp: ${doc.name}`)}
                  >
                    <DownloadSimple size={16} />
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Cột phải: Lịch sử TTHC & Nhật ký xử lý */}
        <div className="space-y-6 lg:col-span-7">
          {/* Lịch sử giao dịch hồ sơ TTHC */}
          <section className="admin-card p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <ClockCounterClockwise size={18} className="text-red-800" />
                  Lịch sử Hồ sơ Thủ tục Hành chính tại Phường
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Các hồ sơ công dân đã nộp, tiền kiểm và nhận kết quả
                </p>
              </div>
              <span className="admin-status-badge is-info">
                {profile.dossierHistory?.length || 0} hồ sơ
              </span>
            </div>

            <div className="space-y-3">
              {profile.dossierHistory && profile.dossierHistory.length > 0 ? (
                profile.dossierHistory.map((dossier) => (
                  <div
                    key={dossier.code}
                    className="p-4 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-slate-50 transition-all space-y-2"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-red-900 bg-red-50 px-2 py-0.5 rounded border border-red-100">
                          {dossier.code}
                        </span>
                        <strong className="text-xs text-slate-900">{dossier.procedureName}</strong>
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

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] text-slate-500 pt-1">
                      <div>
                        <span className="text-slate-400 block">Lĩnh vực:</span>
                        <span className="font-medium text-slate-700">{dossier.field}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Thời gian nộp:</span>
                        <span className="font-medium text-slate-700">{dossier.submittedAt}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Cán bộ thụ lý:</span>
                        <span className="font-medium text-slate-700">{dossier.officer}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 py-6 text-center">
                  Công dân chưa phát sinh giao dịch hồ sơ TTHC nào tại phường.
                </p>
              )}
            </div>
          </section>

          {/* Ghi chú & Nhật ký hỗ trợ của cán bộ */}
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
      </div>
    </div>
  );
};
