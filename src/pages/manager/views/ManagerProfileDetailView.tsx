import React, { useState, useMemo } from 'react';
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
  Copy,
  UserCircle,
  Buildings,
} from '@phosphor-icons/react';
import { ManagerProfileItem } from '../types';
import { toast } from '@/components/ui/Toast';

export interface ManagerProfileDetailViewProps {
  profile: ManagerProfileItem;
  onBack: () => void;
  onEdit?: (profile: ManagerProfileItem) => void;
  isFrontDesk?: boolean;
  backLabel?: string;
  accountInfo?: {
    username: string;
    email?: string;
    wardName?: string | null;
    roles?: Array<{ id: number | string; roleName: string }> | string[];
    isActive?: boolean;
  };
}

type TabType = 'identity-residence' | 'dossier-history' | 'electronic-documents';

export const ManagerProfileDetailView: React.FC<ManagerProfileDetailViewProps> = ({
  profile,
  onBack,
  onEdit,
  isFrontDesk = false,
  backLabel,
  accountInfo,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('identity-residence');

  function formatDate(d?: string | null) {
    if (!d || !d.includes('-')) return 'Chưa được cập nhật';
    const [y, m, day] = d.split('-');
    return `${day}/${m}/${y}`;
  }

  const handleCopyCCCD = () => {
    if (!profile.identityNumber || profile.identityNumber === 'Chưa cập nhật' || profile.identityNumber === 'Chưa được cập nhật') {
      toast.info('Chưa có thông tin số CCCD để sao chép.');
      return;
    }
    navigator.clipboard.writeText(profile.identityNumber);
    toast.success(`Đã sao chép số CCCD: ${profile.identityNumber}`);
  };

  const initials = (profile.fullName || profile.username || 'U')
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  const isStaffRole = useMemo(() => {
    if (isFrontDesk) return true;
    if (!accountInfo?.roles) return false;
    return accountInfo.roles.some((r) => {
      const name = typeof r === 'string' ? r : r.roleName;
      const upper = name.toUpperCase();
      return (
        upper.includes('FRONT_DESK') ||
        upper.includes('FRONTDESK') ||
        upper.includes('OFFICER') ||
        upper.includes('MANAGER') ||
        upper.includes('LÃNH ĐẠO') ||
        upper.includes('MỘT CỬA')
      );
    });
  }, [isFrontDesk, accountInfo?.roles]);

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white rounded-xl border border-slate-200">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-bold text-red-900 hover:text-red-950 px-3 py-2 rounded-lg bg-red-50 hover:bg-red-100 transition-colors"
        >
          <ArrowLeft size={16} /> {backLabel || (isFrontDesk ? 'Quay lại danh sách cán bộ Một cửa' : 'Quay lại danh sách người dùng')}
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
            onClick={() => toast.success(`Đã xuất phiếu trích lục thông tin ${profile.fullName} (PDF).`)}
          >
            <Printer size={16} /> In phiếu thông tin
          </button>
          {onEdit && (
            <button
              type="button"
              className="admin-primary-action text-xs"
              onClick={() => onEdit(profile)}
            >
              <PencilSimple size={16} /> Chỉnh sửa hồ sơ
            </button>
          )}
        </div>
      </div>

      {/* Citizen / User Overview Header Banner */}
      <div className="admin-card p-6 border-l-4 border-l-red-800">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="size-16 rounded-2xl bg-red-900 text-white font-extrabold text-xl flex items-center justify-center shrink-0 shadow-md">
              {initials}
            </div>
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl font-bold text-slate-900">{profile.fullName}</h1>

                <span className="admin-status-badge is-success flex items-center gap-1">
                  <ShieldCheck size={14} /> Đã xác thực
                </span>

                {accountInfo && (
                  <span
                    className={`admin-status-badge ${
                      accountInfo.isActive !== false ? 'is-success' : 'is-warning'
                    }`}
                  >
                    {accountInfo.isActive !== false ? 'Tài khoản hoạt động' : 'Tài khoản tạm khóa'}
                  </span>
                )}

                {/* Huy hiệu Đơn vị Phường: Chỉ hiển thị với cán bộ địa phương */}
                {accountInfo && isStaffRole && (
                  accountInfo.wardName ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-red-950 bg-red-50 rounded-lg border border-red-200 shadow-2xs">
                      <Buildings size={15} weight="duotone" className="text-red-800" />
                      <span>Đơn vị: {accountInfo.wardName}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs text-amber-700 bg-amber-50 rounded-lg border border-amber-200">
                      <Buildings size={14} className="text-amber-600" />
                      <span>Đơn vị: Chưa phân bổ</span>
                    </span>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Thanh điều hướng 3 Tab (chỉ hiển thị khi KHÔNG PHẢI front-desk) */}
      {!isFrontDesk && (
        <div className="border-b border-slate-200 bg-white rounded-t-xl px-4 pt-2 shadow-2xs">
          <nav className="flex space-x-2 sm:space-x-4 overflow-x-auto" aria-label="Tabs chi tiết hồ sơ">
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
                0
              </span>
            </button>
          </nav>
        </div>
      )}

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
                    {profile.identityNumber && profile.identityNumber !== 'Chưa cập nhật' && profile.identityNumber !== 'Chưa được cập nhật' ? (
                      <span className="font-mono text-xl font-black text-red-950 tracking-wider">
                        {profile.identityNumber}
                      </span>
                    ) : (
                      <span className="text-sm font-semibold text-slate-400 italic">
                        Chưa được cập nhật
                      </span>
                    )}
                  </div>
                  {profile.identityNumber && profile.identityNumber !== 'Chưa cập nhật' && profile.identityNumber !== 'Chưa được cập nhật' && (
                    <button
                      type="button"
                      onClick={handleCopyCCCD}
                      className="px-2.5 py-1.5 rounded-lg bg-white border border-red-200 text-xs font-bold text-red-900 hover:bg-red-50 transition-colors shadow-2xs inline-flex items-center gap-1.5"
                    >
                      <Copy size={14} weight="bold" />
                      <span>Sao chép</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-3 text-xs pt-1">
                <div className="flex justify-between py-1.5 border-b border-slate-50">
                  <span className="text-slate-500">Họ và tên khai sinh</span>
                  <strong className="text-slate-900 text-sm">
                    {profile.fullName && profile.fullName !== 'Chưa cập nhật' && profile.fullName !== 'Chưa được cập nhật' ? profile.fullName : 'Chưa được cập nhật'}
                  </strong>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-50">
                  <span className="text-slate-500">Ngày tháng năm sinh</span>
                  <span className="font-semibold text-slate-800">{formatDate(profile.dateOfBirth)}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-50">
                  <span className="text-slate-500">Giới tính</span>
                  <span className="font-semibold text-slate-800">
                    {profile.gender || 'Chưa được cập nhật'}
                  </span>
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
                  <span className="font-bold text-slate-900">
                    {profile.phoneNumber && profile.phoneNumber !== 'Chưa cập nhật' && profile.phoneNumber !== 'Chưa được cập nhật' ? profile.phoneNumber : 'Chưa được cập nhật'}
                  </span>
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
                    {profile.permanentAddress && profile.permanentAddress !== 'Chưa cập nhật' && profile.permanentAddress !== 'Chưa được cập nhật'
                      ? profile.permanentAddress
                      : <span className="text-slate-400 italic">Chưa được cập nhật</span>}
                  </p>
                </div>

                <div>
                  <span className="text-slate-400 block mb-1 font-semibold uppercase text-[10px] tracking-wider">
                    Nơi tạm trú / Nơi ở hiện tại
                  </span>
                  <p className="text-slate-800 font-medium bg-slate-50 p-3.5 rounded-xl border border-slate-100 leading-relaxed text-xs">
                    {profile.temporaryAddress && profile.temporaryAddress !== 'Chưa cập nhật' && profile.temporaryAddress !== 'Chưa được cập nhật'
                      ? profile.temporaryAddress
                      : <span className="text-slate-400 italic">Chưa được cập nhật</span>}
                  </p>
                </div>
              </div>
            </section>

            {accountInfo && (
              <section className="admin-card p-5 space-y-4 md:col-span-2">
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                  <UserCircle size={18} className="text-red-800" />
                  Thông tin Tài khoản & Quyền truy cập
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px] mb-1">Tên đăng nhập (Username):</span>
                    <strong className="text-slate-900 font-mono text-xs bg-slate-100 px-2 py-1 rounded border border-slate-200 inline-block">
                      @{accountInfo.username}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px] mb-1">Email liên hệ:</span>
                    {accountInfo.email ? (
                      <strong className="text-slate-900 font-mono text-xs block py-1">
                        {accountInfo.email}
                      </strong>
                    ) : (
                      <span className="text-slate-400 italic text-xs block py-1">Chưa được cập nhật</span>
                    )}
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px] mb-1">
                      {isStaffRole ? 'Đơn vị Phường công tác:' : 'Phạm vi quản trị:'}
                    </span>
                    {isStaffRole ? (
                      accountInfo.wardName ? (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-red-950 bg-red-50 border border-red-200 rounded-lg">
                          <Buildings size={15} weight="duotone" className="text-red-800" />
                          <span>{accountInfo.wardName}</span>
                        </div>
                      ) : (
                        <span className="text-amber-700 italic text-xs block py-1">Chưa phân bổ</span>
                      )
                    ) : (
                      <span className="text-slate-600 text-xs block py-1 font-medium">
                        Toàn hệ thống (Không áp dụng)
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px] mb-1">Vai trò tài khoản:</span>
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {accountInfo.roles && accountInfo.roles.length > 0 ? (
                        accountInfo.roles.map((r, idx) => {
                          const rName = typeof r === 'string' ? r : r.roleName;
                          const rKey = typeof r === 'string' ? idx : r.id;
                          return (
                            <span
                              key={rKey}
                              className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-red-50 text-red-900 border border-red-200"
                            >
                              {rName}
                            </span>
                          );
                        })
                      ) : (
                        <span className="text-slate-400 italic text-xs">Chưa được cập nhật</span>
                      )}
                    </div>
                  </div>
                </div>
              </section>
            )}
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

            <p className="text-xs text-slate-500 py-4 text-center italic">
              Chưa có ghi chú nghiệp vụ nào từ cán bộ tiếp nhận đối với hồ sơ này.
            </p>
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
                Các tệp đính kèm, ảnh chụp bản chính và bản số hóa công dân đã tải lên kho hồ sơ
              </p>
            </div>
          </div>

          <div className="p-8 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50 space-y-2">
            <Files size={32} className="mx-auto text-slate-400" />
            <p className="text-xs font-semibold text-slate-700">
              Chưa có tệp tài liệu số hóa nào được lưu trữ cho công dân này.
            </p>
            <p className="text-[11px] text-slate-500">
              Các tệp đính kèm và tài liệu điện tử sẽ tự động xuất hiện khi công dân nộp hồ sơ tiền kiểm hoặc hoàn tất thủ tục hành chính.
            </p>
          </div>
        </section>
      )}
    </div>
  );
};
