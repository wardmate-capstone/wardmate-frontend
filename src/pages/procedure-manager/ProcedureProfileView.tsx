import React, { useState, useEffect } from 'react';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useAuthStore } from '@/stores/authStore';
import { updateMyProfile, authErrorMessage } from '@/lib/api';
import { toast } from '@/components/ui/Toast';
import { PencilSimple } from '@phosphor-icons/react';

export const ProcedureProfileView: React.FC = () => {
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
      toast.success('Đã cập nhật hồ sơ cán bộ thành công.');
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
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-[-.02em] text-slate-950 sm:text-3xl">
          HỒ SƠ CÁ NHÂN & PHÂN QUYỀN
        </h1>
      </div>

      <div className="admin-card p-6 sm:p-8 max-w-3xl space-y-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-4">
            <div className="grid size-16 place-items-center rounded-xl bg-gradient-to-br from-red-800 to-red-950 text-xl font-bold text-white shadow-md shrink-0">
              {initials || 'CB'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-950">
                  {loading ? 'Đang tải...' : formData.fullName || user?.username || 'Cán bộ Quản lý Thủ tục'}
                </h3>
                <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">
                  Đang hoạt động
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                Tài khoản: {user?.username} ({user?.email || 'Chưa cập nhật email'})
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={isSaving}
            onClick={() => {
              if (isEditing) handleCancel();
              else setIsEditing(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <PencilSimple size={16} />
            <span>{isEditing ? 'Hủy bỏ' : 'Chỉnh sửa'}</span>
          </button>
        </div>

        {isEditing ? (
          <form onSubmit={handleSave} className="space-y-4">
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
                  className="w-full h-10 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Số CCCD / Mã định danh
                </label>
                <input
                  type="text"
                  maxLength={12}
                  disabled={isSaving}
                  value={formData.identityNumber}
                  onChange={(e) => setFormData({ ...formData, identityNumber: e.target.value.replace(/\D/g, '') })}
                  placeholder="Gồm 12 chữ số"
                  className="w-full h-10 px-3 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Số điện thoại
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
                  Ngày sinh
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
                  Nơi thường trú
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
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
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
                {isSaving ? 'Đang lưu...' : 'Lưu thông tin'}
              </button>
            </div>
          </form>
        ) : (
          <div className="divide-y divide-slate-100 rounded-xl border border-slate-100 bg-slate-50/60 p-4 text-xs space-y-3">
            <div className="flex items-center justify-between pt-2">
              <span className="text-slate-500">Đơn vị công tác:</span>
              <span className="font-bold text-slate-900">UBND Phường An Khánh, TP. Thủ Đức</span>
            </div>
            <div className="flex items-center justify-between pt-2">
              <span className="text-slate-500">Hộp thư tài khoản:</span>
              <span className="font-mono text-slate-900">{user?.email || 'Chưa cập nhật'}</span>
            </div>
            <div className="flex items-center justify-between pt-2">
              <span className="text-slate-500">Số điện thoại liên hệ:</span>
              <span className="font-mono text-slate-900">{formData.phoneNumber || 'Chưa cập nhật'}</span>
            </div>
            <div className="flex items-center justify-between pt-2">
              <span className="text-slate-500">Số CCCD / Mã định danh:</span>
              <span className="font-mono text-slate-900">{formData.identityNumber || 'Chưa cập nhật'}</span>
            </div>
            <div className="flex items-center justify-between pt-2">
              <span className="text-slate-500">Địa chỉ thường trú:</span>
              <span className="text-slate-800 max-w-[280px] text-right truncate">{formData.permanentAddress || 'Chưa cập nhật'}</span>
            </div>
            <div className="flex items-center justify-between pt-2">
              <span className="text-slate-500">Vai trò hệ thống:</span>
              <span className="font-bold text-purple-900">{user?.roles.join(', ') || 'PROCEDURE_MANAGER'}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

