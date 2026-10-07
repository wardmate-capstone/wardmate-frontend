import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck,
  IdentificationCard,
  PencilSimple,
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

function formatRoleName(role: string): string {
  switch (role) {
    case 'ADMINISTRATOR':
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
      return role;
  }
}

export const OfficerProfileView: React.FC = () => {
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

  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    identityNumber: '',
    dateOfBirth: '',
    gender: 'Nam',
    permanentAddress: '',
    temporaryAddress: '',
  });

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setFormData({
        fullName: profile.fullName || '',
        phoneNumber: profile.phoneNumber || '',
        identityNumber: profile.identityNumber || '',
        dateOfBirth: profile.dateOfBirth || '',
        gender: profile.gender || 'Nam',
        permanentAddress: profile.permanentAddress || '',
        temporaryAddress: profile.temporaryAddress || '',
      });
    } else if (user) {
      setFormData((prev) => ({
        ...prev,
        fullName: prev.fullName || user.username || '',
      }));
    }
  }, [profile, user]);

  const handleCopyCCCD = () => {
    if (!profile?.identityNumber) return;
    navigator.clipboard.writeText(profile.identityNumber);
    toast.success(`Đã sao chép số CCCD: ${profile.identityNumber}`);
  };

  const handleSave = async (e: React.FormEvent) => {
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
      setIsEditing(false);
      toast.success('Đã cập nhật hồ sơ cá nhân thành công.');
    } catch (err) {
      toast.error(`Cập nhật thất bại: ${authErrorMessage(err)}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        fullName: profile.fullName || '',
        phoneNumber: profile.phoneNumber || '',
        identityNumber: profile.identityNumber || '',
        dateOfBirth: profile.dateOfBirth || '',
        gender: profile.gender || 'Nam',
        permanentAddress: profile.permanentAddress || '',
        temporaryAddress: profile.temporaryAddress || '',
      });
    }
    setIsEditing(false);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Banner tổng quan hồ sơ cán bộ */}
      <div className="admin-card p-6 border-l-4 border-l-red-800">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-5 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row items-center gap-5">
            <div className="size-20 rounded-2xl bg-red-900 text-white font-extrabold text-2xl flex items-center justify-center shrink-0 shadow-md">
              {initials || 'CB'}
            </div>
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2.5 justify-center sm:justify-start">
                <h1 className="text-xl font-bold text-slate-900">
                  {loading ? 'Đang tải...' : profile?.fullName || user?.username || 'Cán bộ Một cửa'}
                </h1>

                <span className="admin-status-badge is-success flex items-center gap-1">
                  <ShieldCheck size={14} /> Đã xác thực
                </span>

                <span className="admin-status-badge is-info">
                  {user?.roles?.map(formatRoleName).join(', ') || 'Cán bộ Một cửa'}
                </span>
              </div>

              {/* Thông tin tài khoản & phường */}
              <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-500 font-mono justify-center sm:justify-start">
                <span>@{user?.username}</span>
                {user?.email && <span>· {user.email}</span>}
                {wardName ? (
                  <span className="font-sans font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    {wardName}
                  </span>
                ) : (
                  <span className="font-sans text-slate-400 italic bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                    Chưa được cập nhật
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              if (isEditing) handleCancel();
              else setIsEditing(true);
            }}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <PencilSimple size={16} />
            <span>{isEditing ? 'Hủy chỉnh sửa' : 'Chỉnh sửa hồ sơ'}</span>
          </button>
        </div>
      </div>

      {isEditing ? (
        <form onSubmit={handleSave} className="admin-card p-6 space-y-4">
          <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <PencilSimple size={18} className="text-red-800" />
            Cập nhật thông tin hồ sơ cán bộ
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Họ và tên khai sinh *
              </label>
              <input
                type="text"
                required
                disabled={isSaving}
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full h-10 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Số CCCD / Mã định danh cá nhân
              </label>
              <input
                type="text"
                maxLength={12}
                disabled={isSaving}
                value={formData.identityNumber}
                onChange={(e) => setFormData({ ...formData, identityNumber: e.target.value.replace(/\D/g, '') })}
                placeholder="12 chữ số"
                className="w-full h-10 px-3 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-800"
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
                className="w-full h-10 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-800"
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
                className="w-full h-10 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-800"
              >
                <option value="Nam">Nam</option>
                <option value="Nữ">Nữ</option>
                <option value="Khác">Khác</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Ngày tháng năm sinh
              </label>
              <input
                type="date"
                disabled={isSaving}
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                className="w-full h-10 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nơi thường trú (Hộ khẩu chính thức)
              </label>
              <input
                type="text"
                disabled={isSaving}
                value={formData.permanentAddress}
                onChange={(e) => setFormData({ ...formData, permanentAddress: e.target.value })}
                placeholder="Địa chỉ thường trú"
                className="w-full h-10 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-800"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nơi tạm trú / Nơi ở hiện tại
              </label>
              <input
                type="text"
                disabled={isSaving}
                value={formData.temporaryAddress}
                onChange={(e) => setFormData({ ...formData, temporaryAddress: e.target.value })}
                placeholder="Địa chỉ tạm trú hoặc nơi ở hiện nay"
                className="w-full h-10 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-800"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              disabled={isSaving}
              onClick={handleCancel}
              className="px-4 py-2 text-xs font-bold text-slate-600 rounded-lg border border-slate-200 hover:bg-slate-50"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="admin-primary-action text-xs disabled:opacity-50"
            >
              {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Khối 1: Định danh & Nhân thân (Dữ liệu API 06) */}
            <section className="admin-card p-5 space-y-4">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <IdentificationCard size={18} className="text-red-800" />
                Thông tin Định danh & Nhân thân
              </h2>

              {/* Thẻ CCCD nổi bật */}
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
                      {profile?.identityNumber || 'Chưa được cập nhật'}
                    </span>
                  </div>
                  {profile?.identityNumber && (
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
                  <strong className="text-slate-900 text-sm">{profile?.fullName || user?.username || 'Chưa được cập nhật'}</strong>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-50">
                  <span className="text-slate-500">Ngày tháng năm sinh</span>
                  <span className="font-semibold text-slate-800">{formatDate(profile?.dateOfBirth)}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-50">
                  <span className="text-slate-500">Giới tính</span>
                  <span className="font-semibold text-slate-800">{profile?.gender || 'Chưa được cập nhật'}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-500">Số điện thoại liên hệ</span>
                  <span className="font-bold text-slate-900">{profile?.phoneNumber || 'Chưa được cập nhật'}</span>
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
                    {profile?.permanentAddress || 'Chưa được cập nhật'}
                  </p>
                </div>

                <div>
                  <span className="text-slate-400 block mb-1 font-semibold uppercase text-[10px] tracking-wider">
                    Nơi tạm trú / Nơi ở hiện tại
                  </span>
                  <p className="text-slate-800 font-medium bg-slate-50 p-3.5 rounded-xl border border-slate-100 leading-relaxed text-xs">
                    {profile?.temporaryAddress || 'Chưa được cập nhật'}
                  </p>
                </div>
              </div>
            </section>

            {/* Khối 3: Thông tin Tài khoản & Quyền hạn công vụ (Dữ liệu API 05) */}
            <section className="admin-card p-5 space-y-4 md:col-span-2">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <UserCircle size={18} className="text-red-800" />
                Thông tin Tài khoản & Quyền hạn công vụ
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Tên đăng nhập (Username):</span>
                  <strong className="text-slate-900 font-mono">@{user?.username}</strong>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">Hộp thư điện tử:</span>
                  <strong className="text-slate-900">{user?.email || 'Chưa được cập nhật'}</strong>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px] flex items-center gap-1">
                    <Buildings size={13} className="text-red-800" /> Đơn vị Phường công tác:
                  </span>
                  <strong className="text-slate-900">
                    {wardName || 'Chưa được cập nhật'}
                  </strong>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px] flex items-center gap-1">
                    <Key size={13} className="text-red-800" /> Vai trò & Quyền hạn:
                  </span>
                  <div className="flex flex-wrap items-center gap-1 mt-0.5">
                    {user?.roles && user.roles.length > 0 ? (
                      user.roles.map((r) => (
                        <span
                          key={r}
                          className="inline-block px-1.5 py-0.5 rounded text-[11px] font-semibold bg-red-50 text-red-900 border border-red-200"
                        >
                          {formatRoleName(r)}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-400">Chưa được cập nhật</span>
                    )}
                    <span className="text-[11px] text-slate-500 ml-1">
                      ({user?.permissions?.length || 0} quyền nghiệp vụ)
                    </span>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      )}
    </div>
  );
};
