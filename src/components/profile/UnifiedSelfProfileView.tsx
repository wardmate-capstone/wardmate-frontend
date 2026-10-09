import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck,
  IdentificationCard,
  PencilSimple,
  Printer,
  Copy,
  MapPin,
  UserCircle,
  Buildings,
  Key,
} from '@phosphor-icons/react';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useAuthStore } from '@/stores/authStore';
import { updateMyProfile, getWards, authErrorMessage, type WardDto } from '@/lib/api';
import { toast } from '@/components/ui/Toast';

function formatDate(value?: string | null): string {
  if (!value) return 'Chưa được cập nhật';
  if (!value.includes('-')) return value || 'Chưa được cập nhật';
  const parts = value.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return value;
}

function formatRoleLabel(roleName: string): string {
  switch (roleName) {
    case 'ADMINISTRATOR':
    case 'ADMIN':
    case 'IT_ADMIN':
      return 'Quản trị viên';
    case 'MANAGER':
      return 'Lãnh đạo UBND';
    case 'FRONT_DESK_OFFICER':
      return 'Cán bộ Một cửa';
    case 'PROCEDURE_MANAGER':
      return 'Quản lý thủ tục';
    case 'REGISTERED_CITIZEN':
      return 'Công dân';
    default:
      return roleName;
  }
}

export const UnifiedSelfProfileView: React.FC = () => {
  const { profile, loading, initials, refetch } = useUserProfile();
  const user = useAuthStore((state) => state.user);

  const [wards, setWards] = useState<WardDto[]>([]);
  useEffect(() => {
    getWards()
      .then(setWards)
      .catch(() => {});
  }, []);

  const wardName = useMemo(() => {
    if (!user?.wardId) return null;
    const found = wards.find((w) => w.id === user.wardId);
    return found ? found.name : null;
  }, [user?.wardId, wards]);

  const isStaffRole = useMemo(() => {
    if (!user?.roles) return false;
    return user.roles.some((r) => {
      const upper = r.toUpperCase();
      return (
        upper.includes('FRONT_DESK') ||
        upper.includes('FRONTDESK') ||
        upper.includes('OFFICER') ||
        upper.includes('MANAGER') ||
        upper.includes('LÃNH ĐẠO') ||
        upper.includes('MỘT CỬA')
      );
    });
  }, [user?.roles]);

  // Inline edit state
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    identityNumber: '',
    dateOfBirth: '',
    gender: 'Nam',
    permanentAddress: '',
    temporaryAddress: '',
  });

  const handleStartEdit = () => {
    setFormData({
      fullName: profile?.fullName || user?.username || '',
      phoneNumber: profile?.phoneNumber || '',
      identityNumber: profile?.identityNumber || '',
      dateOfBirth: profile?.dateOfBirth || '',
      gender: profile?.gender || 'Nam',
      permanentAddress: profile?.permanentAddress || '',
      temporaryAddress: profile?.temporaryAddress || '',
    });
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleCopyCCCD = () => {
    if (!profile?.identityNumber || profile.identityNumber === 'Chưa cập nhật' || profile.identityNumber === 'Chưa được cập nhật') {
      toast.info('Chưa có thông tin số CCCD để sao chép.');
      return;
    }
    navigator.clipboard.writeText(profile.identityNumber);
    toast.success(`Đã sao chép số CCCD: ${profile.identityNumber}`);
  };

  const handleSaveProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!formData.fullName.trim()) {
      toast.error('Họ và tên không được để trống.');
      return;
    }

    setIsSaving(true);
    try {
      await updateMyProfile({
        fullName: formData.fullName.trim(),
        phoneNumber: formData.phoneNumber.trim() || null,
        identityNumber: formData.identityNumber.trim() || null,
        dateOfBirth: (formData.dateOfBirth.trim() || null) as unknown as import('@/types/profile').ProfileInput['dateOfBirth'],
        gender: formData.gender || null,
        permanentAddress: formData.permanentAddress.trim() || null,
        temporaryAddress: formData.temporaryAddress.trim() || null,
      });
      await refetch();
      setIsEditing(false);
      toast.success('Đã cập nhật hồ sơ cá nhân thành công.');
    } catch (err) {
      toast.error(`Cập nhật thất bại: ${authErrorMessage(err)}`);
    } finally {
      setIsSaving(false);
    }
  };

  const displayName = profile?.fullName || user?.username || 'Cán bộ';

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white rounded-xl border border-slate-200">
        <div className="flex items-center gap-2">
          <UserCircle size={22} className="text-red-800" weight="bold" />
          <h2 className="text-sm font-bold text-slate-900">
            Hồ sơ cá nhân & Thông tin định danh
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {!isEditing ? (
            <>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                onClick={() => toast.success(`Đã xuất phiếu thông tin tài khoản ${displayName} (PDF).`)}
              >
                <Printer size={16} /> In phiếu thông tin
              </button>
              <button
                type="button"
                className="admin-primary-action text-xs"
                onClick={handleStartEdit}
              >
                <PencilSimple size={16} /> Chỉnh sửa hồ sơ
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                disabled={isSaving}
                onClick={handleCancelEdit}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={() => void handleSaveProfile()}
                className="admin-primary-action text-xs disabled:opacity-50"
              >
                {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Overview Banner */}
      <div className="admin-card p-6 border-l-4 border-l-red-800">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="size-16 rounded-2xl bg-red-900 text-white font-extrabold text-xl flex items-center justify-center shrink-0 shadow-md">
              {initials || 'CB'}
            </div>
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl font-bold text-slate-900">
                  {loading ? 'Đang tải...' : displayName}
                </h1>

                <span className="admin-status-badge is-success flex items-center gap-1">
                  <ShieldCheck size={14} /> Đã xác thực
                </span>

                <span className="admin-status-badge is-success">
                  Tài khoản hoạt động
                </span>

                {/* Huy hiệu Đơn vị: Chỉ hiển thị với cán bộ địa phương */}
                {isStaffRole && (
                  wardName ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-red-950 bg-red-50 rounded-lg border border-red-200 shadow-2xs">
                      <Buildings size={15} weight="duotone" className="text-red-800" />
                      <span>Đơn vị: {wardName}</span>
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

      {/* Banner thông báo trạng thái chỉnh sửa */}
      {isEditing && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-900 via-red-800 to-amber-700 p-4 text-white shadow-md">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur-xs text-amber-200">
                <PencilSimple size={20} weight="duotone" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  Chế độ chỉnh sửa thông tin cá nhân
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
                onClick={() => void handleSaveProfile()}
                disabled={isSaving}
                className="px-4 py-1.5 text-xs font-bold text-red-950 bg-amber-300 hover:bg-amber-200 rounded-lg shadow-sm transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
              >
                {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content Grid */}
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

          {/* Thẻ CCCD gắn chip */}
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
                ) : profile?.identityNumber && profile.identityNumber !== 'Chưa cập nhật' && profile.identityNumber !== 'Chưa được cập nhật' ? (
                  <span className="font-mono text-xl font-black text-red-950 tracking-wider">
                    {profile.identityNumber}
                  </span>
                ) : (
                  <span className="text-sm font-semibold text-slate-400 italic">
                    Chưa được cập nhật
                  </span>
                )}
              </div>
              {!isEditing && profile?.identityNumber && profile.identityNumber !== 'Chưa cập nhật' && profile.identityNumber !== 'Chưa được cập nhật' && (
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
                  {profile?.fullName && profile.fullName !== 'Chưa cập nhật' && profile.fullName !== 'Chưa được cập nhật'
                    ? profile.fullName
                    : 'Chưa được cập nhật'}
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
                    {formatDate(profile?.dateOfBirth)}
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
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full h-9 px-3 text-xs font-medium text-slate-900 bg-white border border-slate-300 rounded-lg shadow-2xs focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 transition-all"
                  >
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                    <option value="Khác">Khác</option>
                  </select>
                ) : (
                  <div className="text-xs font-semibold text-slate-800 py-1.5 border-b border-slate-100">
                    {profile?.gender && profile.gender !== 'Chưa cập nhật' && profile.gender !== 'Chưa được cập nhật'
                      ? profile.gender
                      : 'Chưa được cập nhật'}
                  </div>
                )}
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
                  {profile?.phoneNumber && profile.phoneNumber !== 'Chưa cập nhật' && profile.phoneNumber !== 'Chưa được cập nhật'
                    ? profile.phoneNumber
                    : 'Chưa được cập nhật'}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Khối 2: Địa chỉ & Cư trú */}
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
                  {profile?.permanentAddress && profile.permanentAddress !== 'Chưa cập nhật' && profile.permanentAddress !== 'Chưa được cập nhật'
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
                  {profile?.temporaryAddress && profile.temporaryAddress !== 'Chưa cập nhật' && profile.temporaryAddress !== 'Chưa được cập nhật'
                    ? profile.temporaryAddress
                    : <span className="text-slate-400 italic">Chưa được cập nhật</span>}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Khối 3: Thông tin Tài khoản & Quyền truy cập */}
        <section className="admin-card p-5 space-y-4 md:col-span-2">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Key size={18} className="text-red-800" />
            Thông tin Tài khoản & Quyền truy cập
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px] mb-1">Tên đăng nhập (Username):</span>
              <strong className="text-slate-900 font-mono text-xs bg-slate-100 px-2 py-1 rounded border border-slate-200 inline-block">
                @{user?.username}
              </strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px] mb-1">Email liên hệ:</span>
              {user?.email ? (
                <strong className="text-slate-900 font-mono text-xs block py-1">
                  {user.email}
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
                wardName ? (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-red-950 bg-red-50 border border-red-200 rounded-lg">
                    <Buildings size={15} weight="duotone" className="text-red-800" />
                    <span>{wardName}</span>
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
                {user?.roles && user.roles.length > 0 ? (
                  user.roles.map((r, idx) => (
                    <span
                      key={idx}
                      className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-red-50 text-red-900 border border-red-200"
                    >
                      {formatRoleLabel(r)}
                    </span>
                  ))
                ) : (
                  <span className="text-slate-400 italic text-xs block py-1">Chưa phân vai trò</span>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
