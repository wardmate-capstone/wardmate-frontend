import React, { useState, useEffect } from 'react';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useAuthStore } from '@/stores/authStore';
import { updateMyProfile, authErrorMessage } from '@/lib/api';
import { toast } from '@/components/ui/Toast';

export const ManagerProfileView: React.FC = () => {
  const { profile, loading, initials, refetch } = useUserProfile();
  const user = useAuthStore((state) => state.user);

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
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="admin-card p-6">
        <div className="flex flex-wrap items-center gap-5 border-b border-slate-100 pb-6">
          <div className="size-20 rounded-full bg-red-900 text-white font-extrabold text-2xl flex items-center justify-center shrink-0 shadow-lg">
            {initials || 'QL'}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-slate-900">
                {loading ? 'Đang tải...' : formData.fullName || user?.username || 'Cán bộ Quản lý'}
              </h2>
              <span className="admin-status-badge is-danger">Lãnh đạo phê duyệt</span>
            </div>
            <p className="text-xs text-slate-600 font-semibold font-mono">
              Tài khoản: {user?.username} ({user?.email || 'Chưa cập nhật email'})
            </p>
            <p className="text-xs text-slate-400">
              Vai trò: {user?.roles.join(', ') || 'MANAGER'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="mt-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Họ và tên *
              </label>
              <input
                type="text"
                required
                disabled={!isEditing || isSaving}
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full h-10 px-3 text-xs bg-slate-50 disabled:bg-slate-100 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Số CCCD / Định danh cá nhân
              </label>
              <input
                type="text"
                disabled={!isEditing || isSaving}
                maxLength={12}
                value={formData.identityNumber}
                onChange={(e) => setFormData({ ...formData, identityNumber: e.target.value.replace(/\D/g, '') })}
                placeholder="Gồm 12 chữ số"
                className="w-full h-10 px-3 text-xs font-mono bg-slate-50 disabled:bg-slate-100 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Số điện thoại liên hệ
              </label>
              <input
                type="tel"
                disabled={!isEditing || isSaving}
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                placeholder="0912345678"
                className="w-full h-10 px-3 text-xs bg-slate-50 disabled:bg-slate-100 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Giới tính
              </label>
              <select
                disabled={!isEditing || isSaving}
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full h-10 px-3 text-xs bg-slate-50 disabled:bg-slate-100 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-800"
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
                disabled={!isEditing || isSaving}
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                className="w-full h-10 px-3 text-xs bg-slate-50 disabled:bg-slate-100 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Email tài khoản
              </label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full h-10 px-3 text-xs bg-slate-100 border border-slate-200 rounded-lg text-slate-500 font-mono"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nơi thường trú
              </label>
              <input
                type="text"
                disabled={!isEditing || isSaving}
                value={formData.permanentAddress}
                onChange={(e) => setFormData({ ...formData, permanentAddress: e.target.value })}
                placeholder="Địa chỉ thường trú"
                className="w-full h-10 px-3 text-xs bg-slate-50 disabled:bg-slate-100 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-800"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nơi tạm trú / Nơi ở hiện tại
              </label>
              <input
                type="text"
                disabled={!isEditing || isSaving}
                value={formData.temporaryAddress}
                onChange={(e) => setFormData({ ...formData, temporaryAddress: e.target.value })}
                placeholder="Địa chỉ cư trú thực tế"
                className="w-full h-10 px-3 text-xs bg-slate-50 disabled:bg-slate-100 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-800"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            {isEditing ? (
              <>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={handleCancel}
                  className="px-4 py-2 text-xs font-bold text-slate-600 rounded-lg border border-slate-200 hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="admin-primary-action text-xs disabled:opacity-50"
                >
                  {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="admin-primary-action text-xs"
              >
                Chỉnh sửa thông tin
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

