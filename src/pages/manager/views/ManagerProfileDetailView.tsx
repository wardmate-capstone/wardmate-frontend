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
  onSave?: (profile: ManagerProfileItem) => Promise<void>;
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
  onSave,
  isFrontDesk = false,
  backLabel,
  accountInfo,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('identity-residence');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<ManagerProfileItem>({ ...profile });

  function handleStartEdit() {
    setFormData({ ...profile });
    setIsEditing(true);
  }

  function handleCancelEdit() {
    setFormData({ ...profile });
    setIsEditing(false);
  }

  async function handleSubmitEdit() {
    if (!onSave) return;
    setIsSaving(true);
    try {
      await onSave(formData);
      setIsEditing(false);
    } catch {
      // lỗi đã xử lý ở parent bằng toast
    } finally {
      setIsSaving(false);
    }
  }

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
          {!isEditing && (
            <button
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
              onClick={() => toast.success(`Đã xuất phiếu trích lục thông tin ${profile.fullName} (PDF).`)}
            >
              <Printer size={16} /> In phiếu thông tin
            </button>
          )}
          {onSave && !isEditing && (
            <button
              type="button"
              className="admin-primary-action text-xs"
              onClick={handleStartEdit}
            >
              <PencilSimple size={16} /> Chỉnh sửa hồ sơ
            </button>
          )}
          {isEditing && (
            <>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50"
                onClick={handleCancelEdit}
                disabled={isSaving}
              >
                Hủy
              </button>
              <button
                type="button"
                className="admin-primary-action text-xs disabled:opacity-50"
                onClick={handleSubmitEdit}
                disabled={isSaving}
              >
                {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </>
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
          {isEditing && (
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-900 via-red-800 to-amber-700 p-4 text-white shadow-md">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur-xs text-amber-200">
                    <PencilSimple size={20} weight="duotone" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      Chế độ chỉnh sửa thông tin
                      <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full bg-amber-400 text-red-950">
                        Đang mở
                      </span>
                    </h4>
                    <p className="text-xs text-red-100/90 mt-0.5">
                      Cập nhật trực tiếp các trường bên dưới. Thay đổi chỉ được áp dụng khi bấm <strong>Lưu thay đổi</strong>.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    disabled={isSaving}
                    className="px-3.5 py-1.5 text-xs font-semibold text-white/90 hover:text-white bg-white/10 hover:bg-white/20 rounded-lg transition-colors border border-white/20 disabled:opacity-50"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmitEdit}
                    disabled={isSaving}
                    className="px-4 py-1.5 text-xs font-bold text-red-950 bg-amber-300 hover:bg-amber-200 rounded-lg shadow-sm transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                  >
                    {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="grid gap-6 md:grid-cols-2">
            {/* Khối 1: Định danh & Nhân thân */}
            <section
              className={`admin-card p-6 space-y-5 transition-all duration-200 ${
                isEditing ? 'ring-2 ring-red-800/20 border-red-200 shadow-sm' : ''
              }`}
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <IdentificationCard size={20} className="text-red-800" weight="duotone" />
                  Thông tin Định danh & Nhân thân
                </h2>
                {isEditing && (
                  <span className="text-[11px] font-semibold text-red-700 bg-red-50 px-2.5 py-0.5 rounded-full">
                    Được phép sửa
                  </span>
                )}
              </div>

              {/* Thẻ CCCD */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-red-50/90 via-amber-50/40 to-white border border-red-200/90 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-red-900 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck size={14} className="text-red-700" weight="fill" />
                    Thẻ Căn cước công dân gắn chip / VNeID
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1">
                    <span className="text-[11px] text-slate-500 block mb-1">Số định danh cá nhân (CCCD):</span>
                    {isEditing ? (
                      <div className="relative">
                        <input
                          type="text"
                          maxLength={12}
                          value={formData.identityNumber}
                          onChange={(e) => setFormData({ ...formData, identityNumber: e.target.value.replace(/\D/g, '') })}
                          placeholder="Nhập 12 chữ số CCCD"
                          className="w-full h-10 px-3.5 font-mono text-base font-bold tracking-widest text-red-950 bg-white border border-red-300 rounded-xl shadow-2xs focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 transition-all placeholder:text-slate-400 placeholder:font-normal placeholder:tracking-normal placeholder:text-xs"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-mono text-slate-400">
                          {formData.identityNumber?.length || 0}/12
                        </span>
                      </div>
                    ) : profile.identityNumber && profile.identityNumber !== 'Chưa cập nhật' && profile.identityNumber !== 'Chưa được cập nhật' ? (
                      <span className="font-mono text-xl font-black text-red-950 tracking-wider">
                        {profile.identityNumber}
                      </span>
                    ) : (
                      <span className="text-sm font-semibold text-slate-400 italic">Chưa được cập nhật</span>
                    )}
                  </div>
                  {!isEditing && profile.identityNumber && profile.identityNumber !== 'Chưa cập nhật' && profile.identityNumber !== 'Chưa được cập nhật' && (
                    <button
                      type="button"
                      onClick={handleCopyCCCD}
                      className="px-3 py-1.5 rounded-lg bg-white border border-red-200 text-xs font-bold text-red-900 hover:bg-red-50 transition-colors shadow-2xs inline-flex items-center gap-1.5"
                    >
                      <Copy size={14} weight="bold" />
                      <span>Sao chép</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-4 pt-1">
                {/* Họ tên */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                    Họ và tên khai sinh
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      placeholder="Ví dụ: NGUYỄN VĂN A"
                      className="w-full h-9 px-3 text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded-lg shadow-2xs focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 transition-all"
                    />
                  ) : (
                    <div className="text-sm font-bold text-slate-900 py-1 border-b border-slate-100">
                      {profile.fullName && profile.fullName !== 'Chưa cập nhật' && profile.fullName !== 'Chưa được cập nhật' ? profile.fullName : 'Chưa được cập nhật'}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Ngày sinh */}
                  <div>
                    <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                      Ngày sinh
                    </label>
                    {isEditing ? (
                      <input
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                        className="w-full h-9 px-3 text-xs font-medium text-slate-900 bg-white border border-slate-300 rounded-lg shadow-2xs focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 transition-all"
                      />
                    ) : (
                      <div className="text-xs font-semibold text-slate-800 py-1.5 border-b border-slate-100">
                        {formatDate(profile.dateOfBirth)}
                      </div>
                    )}
                  </div>

                  {/* Giới tính */}
                  <div>
                    <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                      Giới tính
                    </label>
                    {isEditing ? (
                      <select
                        value={formData.gender}
                        onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'Nam' | 'Nữ' | 'Khác' })}
                        className="w-full h-9 px-3 text-xs font-medium text-slate-900 bg-white border border-slate-300 rounded-lg shadow-2xs focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 transition-all"
                      >
                        <option value="Nam">Nam</option>
                        <option value="Nữ">Nữ</option>
                        <option value="Khác">Khác</option>
                      </select>
                    ) : (
                      <div className="text-xs font-semibold text-slate-800 py-1.5 border-b border-slate-100">
                        {profile.gender || 'Chưa được cập nhật'}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                      Dân tộc
                    </span>
                    <div className="text-xs font-semibold text-slate-800 py-1.5 border-b border-slate-100 bg-slate-50/50 px-2 rounded">
                      {profile.ethnicity || 'Kinh'}
                    </div>
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                      Quốc tịch
                    </span>
                    <div className="text-xs font-semibold text-slate-800 py-1.5 border-b border-slate-100 bg-slate-50/50 px-2 rounded">
                      Việt Nam
                    </div>
                  </div>
                </div>

                {/* SĐT */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                    Số điện thoại liên hệ
                  </label>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                      placeholder="Ví dụ: 0912345678"
                      className="w-full h-9 px-3 text-xs font-medium text-slate-900 bg-white border border-slate-300 rounded-lg shadow-2xs focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 transition-all"
                    />
                  ) : (
                    <div className="text-xs font-bold text-slate-900 py-1.5 border-b border-slate-100">
                      {profile.phoneNumber && profile.phoneNumber !== 'Chưa cập nhật' && profile.phoneNumber !== 'Chưa được cập nhật' ? profile.phoneNumber : 'Chưa được cập nhật'}
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Khối 2: Địa chỉ & Nơi cư trú */}
            <section
              className={`admin-card p-6 space-y-5 transition-all duration-200 ${
                isEditing ? 'ring-2 ring-red-800/20 border-red-200 shadow-sm' : ''
              }`}
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <MapPin size={20} className="text-red-800" weight="duotone" />
                  Địa chỉ & Nơi cư trú
                </h2>
                {isEditing && (
                  <span className="text-[11px] font-semibold text-red-700 bg-red-50 px-2.5 py-0.5 rounded-full">
                    Được phép sửa
                  </span>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
                    Nơi thường trú (Hộ khẩu chính thức)
                  </label>
                  {isEditing ? (
                    <textarea
                      rows={3}
                      value={formData.permanentAddress}
                      onChange={(e) => setFormData({ ...formData, permanentAddress: e.target.value })}
                      placeholder="Số nhà, ngõ/ngách, đường phố, thôn/tổ dân phố, phường/xã, quận/huyện, tỉnh/thành phố"
                      className="w-full p-3 text-xs font-medium text-slate-900 bg-white border border-slate-300 rounded-xl shadow-2xs focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 transition-all resize-none leading-relaxed placeholder:text-slate-400"
                    />
                  ) : (
                    <p className="text-slate-800 font-medium bg-slate-50 p-3.5 rounded-xl border border-slate-100 leading-relaxed text-xs min-h-[72px]">
                      {profile.permanentAddress && profile.permanentAddress !== 'Chưa cập nhật' && profile.permanentAddress !== 'Chưa được cập nhật'
                        ? profile.permanentAddress
                        : <span className="text-slate-400 italic">Chưa được cập nhật</span>}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
                    Nơi tạm trú / Nơi ở hiện tại
                  </label>
                  {isEditing ? (
                    <textarea
                      rows={3}
                      value={formData.temporaryAddress}
                      onChange={(e) => setFormData({ ...formData, temporaryAddress: e.target.value })}
                      placeholder="Địa chỉ đang sinh sống hoặc làm việc thực tế"
                      className="w-full p-3 text-xs font-medium text-slate-900 bg-white border border-slate-300 rounded-xl shadow-2xs focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 transition-all resize-none leading-relaxed placeholder:text-slate-400"
                    />
                  ) : (
                    <p className="text-slate-800 font-medium bg-slate-50 p-3.5 rounded-xl border border-slate-100 leading-relaxed text-xs min-h-[72px]">
                      {profile.temporaryAddress && profile.temporaryAddress !== 'Chưa cập nhật' && profile.temporaryAddress !== 'Chưa được cập nhật'
                        ? profile.temporaryAddress
                        : <span className="text-slate-400 italic">Chưa được cập nhật</span>}
                    </p>
                  )}
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
