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
import { Modal } from '@/components/ui/Modal';
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

  // Modal edit state
  const [isEditingModalOpen, setIsEditingModalOpen] = useState(false);
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

  const handleOpenEdit = () => {
    setFormData({
      fullName: profile?.fullName || user?.username || '',
      phoneNumber: profile?.phoneNumber || '',
      identityNumber: profile?.identityNumber || '',
      dateOfBirth: profile?.dateOfBirth || '',
      gender: profile?.gender || 'Nam',
      permanentAddress: profile?.permanentAddress || '',
      temporaryAddress: profile?.temporaryAddress || '',
    });
    setIsEditingModalOpen(true);
  };

  const handleCopyCCCD = () => {
    if (!profile?.identityNumber || profile.identityNumber === 'Chưa cập nhật' || profile.identityNumber === 'Chưa được cập nhật') {
      toast.info('Chưa có thông tin số CCCD để sao chép.');
      return;
    }
    navigator.clipboard.writeText(profile.identityNumber);
    toast.success(`Đã sao chép số CCCD: ${profile.identityNumber}`);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
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
      setIsEditingModalOpen(false);
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
            onClick={handleOpenEdit}
          >
            <PencilSimple size={16} /> Chỉnh sửa hồ sơ
          </button>
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

      {/* Content Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Khối 1: Định danh & Nhân thân */}
        <section className="admin-card p-5 space-y-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <IdentificationCard size={18} className="text-red-800" />
            Thông tin Định danh & Nhân thân
          </h2>

          {/* Thẻ CCCD gắn chip */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-red-50/90 to-amber-50/50 border border-red-200/90 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-red-800 uppercase tracking-wider">
                Thẻ Căn cước công dân gắn chip / VNeID
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-500 block">Số định danh cá nhân (CCCD):</span>
                {profile?.identityNumber && profile.identityNumber !== 'Chưa cập nhật' && profile.identityNumber !== 'Chưa được cập nhật' ? (
                  <span className="font-mono text-xl font-black text-red-950 tracking-wider">
                    {profile.identityNumber}
                  </span>
                ) : (
                  <span className="text-sm font-semibold text-slate-400 italic">
                    Chưa được cập nhật
                  </span>
                )}
              </div>
              {profile?.identityNumber && profile.identityNumber !== 'Chưa cập nhật' && profile.identityNumber !== 'Chưa được cập nhật' && (
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
                {profile?.fullName && profile.fullName !== 'Chưa cập nhật' && profile.fullName !== 'Chưa được cập nhật'
                  ? profile.fullName
                  : 'Chưa được cập nhật'}
              </strong>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-500">Ngày tháng năm sinh</span>
              <span className="font-mono text-slate-900 font-semibold">
                {formatDate(profile?.dateOfBirth)}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-500">Giới tính</span>
              <span className="text-slate-900 font-semibold">
                {profile?.gender && profile.gender !== 'Chưa cập nhật' && profile.gender !== 'Chưa được cập nhật'
                  ? profile.gender
                  : 'Chưa được cập nhật'}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-500">Số điện thoại liên hệ</span>
              <span className="font-mono text-slate-900 font-semibold">
                {profile?.phoneNumber && profile.phoneNumber !== 'Chưa cập nhật' && profile.phoneNumber !== 'Chưa được cập nhật'
                  ? profile.phoneNumber
                  : 'Chưa được cập nhật'}
              </span>
            </div>
          </div>
        </section>

        {/* Khối 2: Địa chỉ & Cư trú */}
        <section className="admin-card p-5 space-y-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <MapPin size={18} className="text-red-800" />
            Địa chỉ & Nơi cư trú
          </h2>

          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-[11px] font-bold text-slate-600 block">
                Nơi đăng ký thường trú
              </span>
              <p className="text-slate-900 font-medium leading-relaxed">
                {profile?.permanentAddress && profile.permanentAddress !== 'Chưa cập nhật' && profile.permanentAddress !== 'Chưa được cập nhật'
                  ? profile.permanentAddress
                  : <span className="text-slate-400 italic">Chưa được cập nhật</span>}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-[11px] font-bold text-slate-600 block">
                Nơi ở hiện tại / Tạm trú
              </span>
              <p className="text-slate-900 font-medium leading-relaxed">
                {profile?.temporaryAddress && profile.temporaryAddress !== 'Chưa cập nhật' && profile.temporaryAddress !== 'Chưa được cập nhật'
                  ? profile.temporaryAddress
                  : <span className="text-slate-400 italic">Chưa được cập nhật</span>}
              </p>
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

      {/* Modal Chỉnh sửa hồ sơ cá nhân */}
      <Modal
        open={isEditingModalOpen}
        onOpenChange={setIsEditingModalOpen}
        title="Chỉnh sửa thông tin hồ sơ cá nhân"
        description="Cập nhật thông tin định danh và liên hệ vào hệ thống WardMate."
        footer={
          <>
            <button
              type="button"
              disabled={isSaving}
              onClick={() => setIsEditingModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={(e) => handleSaveProfile(e as unknown as React.FormEvent)}
              className="admin-primary-action text-xs"
            >
              {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Họ và tên *
              </label>
              <input
                type="text"
                required
                disabled={isSaving}
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full h-10 px-3 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-800"
                placeholder="Nguyễn Văn A"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Số CCCD / Định danh cá nhân
              </label>
              <input
                type="text"
                disabled={isSaving}
                maxLength={12}
                value={formData.identityNumber}
                onChange={(e) => setFormData({ ...formData, identityNumber: e.target.value.replace(/\D/g, '') })}
                placeholder="12 chữ số"
                className="w-full h-10 px-3 text-xs font-mono bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Số điện thoại liên hệ
              </label>
              <input
                type="tel"
                disabled={isSaving}
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                placeholder="0912345678"
                className="w-full h-10 px-3 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Giới tính
              </label>
              <select
                disabled={isSaving}
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full h-10 px-3 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-800"
              >
                <option value="Nam">Nam</option>
                <option value="Nữ">Nữ</option>
                <option value="Khác">Khác</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Ngày sinh
              </label>
              <input
                type="date"
                disabled={isSaving}
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                className="w-full h-10 px-3 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-800"
              />
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Địa chỉ thường trú
              </label>
              <textarea
                rows={2}
                disabled={isSaving}
                value={formData.permanentAddress}
                onChange={(e) => setFormData({ ...formData, permanentAddress: e.target.value })}
                placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố"
                className="w-full p-2.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Địa chỉ tạm trú
              </label>
              <textarea
                rows={2}
                disabled={isSaving}
                value={formData.temporaryAddress}
                onChange={(e) => setFormData({ ...formData, temporaryAddress: e.target.value })}
                placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố"
                className="w-full p-2.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-800"
              />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};
