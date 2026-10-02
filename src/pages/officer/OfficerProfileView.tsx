import React, { useState, useEffect } from 'react';
import {
  BuildingOffice,
  ShieldCheck,
  IdentificationCard,
  PencilSimple,
} from '@phosphor-icons/react';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useAuthStore } from '@/stores/authStore';
import { updateMyProfile, authErrorMessage } from '@/lib/api';
import { toast } from '@/components/ui/Toast';

export const OfficerProfileView: React.FC = () => {
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
    <section aria-label="Hồ sơ cá nhân cán bộ" className="space-y-6 max-w-4xl">
      <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-5 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row items-center gap-5">
            <div className="size-20 rounded-2xl bg-red-800 text-white font-extrabold text-2xl grid place-items-center shadow-md shrink-0">
              {initials || 'CB'}
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-slate-950">
                {loading ? 'Đang tải...' : formData.fullName || user?.username || 'Cán bộ Một cửa'}
              </h3>
              <p className="text-xs font-semibold text-slate-600 font-mono">
                Tài khoản: {user?.username} ({user?.email || 'Chưa cập nhật email'})
              </p>
              <div className="flex items-center gap-2 text-xs text-slate-500 pt-1 justify-center sm:justify-start">
                <span className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  <ShieldCheck size={14} />
                  Đang trong ca trực
                </span>
                <span>·</span>
                <span>Vai trò: {user?.roles.join(', ') || 'FRONT_DESK_OFFICER'}</span>
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
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <PencilSimple size={16} />
            <span>{isEditing ? 'Hủy bỏ' : 'Chỉnh sửa'}</span>
          </button>
        </div>
      </header>

      {isEditing ? (
        <form onSubmit={handleSave} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
          <h4 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
            Cập nhật thông tin cán bộ
          </h4>

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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Work info */}
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <BuildingOffice size={20} className="text-red-800" />
              <h4 className="text-sm font-bold text-slate-900">Phân công quầy tiếp nhận</h4>
            </div>

            <dl className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <dt className="text-slate-500">Cơ quan:</dt>
                <dd className="font-bold text-slate-900">UBND Phường An Khánh, TP. Thủ Đức</dd>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <dt className="text-slate-500">Vị trí trực:</dt>
                <dd className="font-bold text-red-800">Quầy tiếp nhận Một cửa</dd>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <dt className="text-slate-500">Lĩnh vực phụ trách:</dt>
                <dd className="font-medium text-slate-800">Hộ tịch, Chứng thực & Hành chính</dd>
              </div>
              <div className="flex justify-between py-1">
                <dt className="text-slate-500">Lịch trực tuần:</dt>
                <dd className="font-medium text-slate-800">Thứ 2 đến Thứ 6 (Cả ngày)</dd>
              </div>
            </dl>
          </article>

          {/* Contact info */}
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <IdentificationCard size={20} className="text-slate-700" />
              <h4 className="text-sm font-bold text-slate-900">Thông tin liên hệ & Công vụ</h4>
            </div>

            <dl className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <dt className="text-slate-500">Email tài khoản:</dt>
                <dd className="font-medium text-slate-900 font-mono">{user?.email || 'Chưa liên kết'}</dd>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <dt className="text-slate-500">Số điện thoại:</dt>
                <dd className="font-mono text-slate-800">{formData.phoneNumber || 'Chưa cập nhật'}</dd>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <dt className="text-slate-500">Số CCCD:</dt>
                <dd className="font-mono text-slate-800">{formData.identityNumber || 'Chưa cập nhật'}</dd>
              </div>
              <div className="flex justify-between py-1">
                <dt className="text-slate-500">Địa chỉ thường trú:</dt>
                <dd className="text-slate-800 max-w-[200px] text-right truncate">
                  {formData.permanentAddress || 'Chưa cập nhật'}
                </dd>
              </div>
            </dl>
          </article>
        </div>
      )}
    </section>
  );
};

