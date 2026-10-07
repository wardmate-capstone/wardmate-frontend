import { useState, useEffect } from 'react';
import { NotePencil } from '@phosphor-icons/react';
import { toast } from '@/components/ui/Toast';
import axios from 'axios';
import { updateMyProfile, authErrorMessage } from '@/lib/api';
import type { UserProfileDto } from '@/types/profile';
import { validateProfile, type ProfileFieldErrors } from '@/lib/profileSchema';

interface CitizenProfileViewProps {
  initialProfile: UserProfileDto | null;
  loading: boolean;
  onProfileUpdated?: () => void;
}

export function CitizenProfileView({
  initialProfile,
  loading,
  onProfileUpdated,
}: CitizenProfileViewProps) {
  const [formData, setFormData] = useState({
    fullName: initialProfile?.fullName || '',
    identityNumber: initialProfile?.identityNumber || '',
    dateOfBirth: initialProfile?.dateOfBirth || '',
    gender: initialProfile?.gender || '',
    phoneNumber: initialProfile?.phoneNumber || '',
    permanentAddress: initialProfile?.permanentAddress || '',
    temporaryAddress: initialProfile?.temporaryAddress || '',
  });

  const [errors, setErrors] = useState<ProfileFieldErrors>({});
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initialProfile) {
      setFormData({
        fullName: initialProfile.fullName || '',
        identityNumber: initialProfile.identityNumber || '',
        dateOfBirth: initialProfile.dateOfBirth || '',
        gender: initialProfile.gender || '',
        phoneNumber: initialProfile.phoneNumber || '',
        permanentAddress: initialProfile.permanentAddress || '',
        temporaryAddress: initialProfile.temporaryAddress || '',
      });
      setErrors({});
    }
  }, [initialProfile]);

  function handleChange(field: keyof typeof formData, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  }

  function handleCancel() {
    if (initialProfile) {
      setFormData({
        fullName: initialProfile.fullName || '',
        identityNumber: initialProfile.identityNumber || '',
        dateOfBirth: initialProfile.dateOfBirth || '',
        gender: initialProfile.gender || '',
        phoneNumber: initialProfile.phoneNumber || '',
        permanentAddress: initialProfile.permanentAddress || '',
        temporaryAddress: initialProfile.temporaryAddress || '',
      });
    }
    setErrors({});
    setIsEditing(false);
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();

    // 1. Client-side validation chặt chẽ bằng Zod schema
    const validation = validateProfile(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      const firstErrorField = Object.keys(validation.errors)[0];
      if (firstErrorField) {
        document.getElementById(`profile-${firstErrorField}`)?.focus();
      }
      toast.error('Vui lòng kiểm tra lại các trường thông tin chưa hợp lệ.');
      return;
    }

    setSaving(true);
    try {
      // 2. Chuẩn hóa payload trước khi gửi lên API
      const normalizedPayload = {
        fullName: formData.fullName.trim().replace(/\s+/g, ' '),
        identityNumber: formData.identityNumber?.trim() || null,
        phoneNumber: formData.phoneNumber?.replace(/[\s.-]/g, '').trim() || null,
        dateOfBirth: formData.dateOfBirth?.trim() || null,
        gender: formData.gender?.trim() || null,
        permanentAddress: formData.permanentAddress?.trim() || null,
        temporaryAddress: formData.temporaryAddress?.trim() || null,
      };

      await updateMyProfile(normalizedPayload);
      toast.success('Đã cập nhật thông tin hồ sơ thành công.');
      setErrors({});
      setIsEditing(false);
      onProfileUpdated?.();
    } catch (error) {
      // 3. Xử lý lỗi server validation (ProblemDetails 400 errors) nếu có
      if (axios.isAxiosError(error) && error.response?.data?.errors) {
        const serverErrors = error.response.data.errors as Record<string, string[]>;
        const newErrors: ProfileFieldErrors = {};
        for (const [key, msgs] of Object.entries(serverErrors)) {
          const lower = key.toLowerCase();
          const msg = Array.isArray(msgs) ? msgs[0] : String(msgs);
          if (lower === 'fullname') newErrors.fullName = msg;
          else if (lower === 'identitynumber') newErrors.identityNumber = msg;
          else if (lower === 'phonenumber') newErrors.phoneNumber = msg;
          else if (lower === 'dateofbirth') newErrors.dateOfBirth = msg;
          else if (lower === 'gender') newErrors.gender = msg;
          else if (lower === 'permanentaddress') newErrors.permanentAddress = msg;
          else if (lower === 'temporaryaddress') newErrors.temporaryAddress = msg;
        }
        if (Object.keys(newErrors).length > 0) {
          setErrors(newErrors);
          const firstKey = Object.keys(newErrors)[0];
          document.getElementById(`profile-${firstKey}`)?.focus();
        }
      }
      toast.error(authErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  const initials = formData.fullName.trim()
    ? formData.fullName.trim().split(/\s+/).slice(-2).map((w) => w[0]).join('').toUpperCase()
    : 'CD';

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-5 admin-content-card">
      <section className="admin-card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-4">
            <span className="grid size-14 place-items-center rounded-2xl bg-red-800 text-lg font-bold text-white shadow-sm">
              {initials}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-950">
                  {loading ? 'Đang tải...' : formData.fullName || 'Công dân chưa cập nhật tên'}
                </h2>
                <span className="admin-status-badge is-success">Đã định danh điện tử</span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Số định danh cá nhân / CCCD: {formData.identityNumber || 'Chưa liên kết'}
              </p>
            </div>
          </div>

          <button
            type="button"
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 hover:bg-slate-50"
            onClick={() => {
              if (isEditing) {
                handleCancel();
              } else {
                setIsEditing(true);
              }
            }}
            disabled={saving}
          >
            <NotePencil size={16} /> {isEditing ? 'Hủy chỉnh sửa' : 'Chỉnh sửa thông tin'}
          </button>
        </div>

        <form onSubmit={handleSaveProfile} noValidate className="mt-6 grid gap-5 sm:grid-cols-2">
          {/* Họ và tên */}
          <div>
            <label htmlFor="profile-fullName" className="block text-xs font-bold text-slate-700">
              Họ và tên <span className="text-red-600">*</span>
            </label>
            <input
              id="profile-fullName"
              name="fullName"
              type="text"
              value={formData.fullName}
              disabled={!isEditing || saving}
              onChange={(e) => handleChange('fullName', e.target.value)}
              placeholder="Ví dụ: Nguyễn Văn An"
              maxLength={100}
              aria-invalid={!!errors.fullName}
              aria-describedby={errors.fullName ? 'profile-fullName-error' : undefined}
              className={`mt-1.5 h-11 w-full rounded-lg border px-3.5 text-xs font-medium text-slate-900 transition-colors disabled:opacity-75 focus:outline-none focus:ring-2 ${
                errors.fullName
                  ? 'border-red-500 bg-red-50/20 focus:border-red-600 focus:ring-red-500/20'
                  : 'border-slate-200 bg-slate-50 focus:bg-white focus:ring-red-500'
              }`}
              required
            />
            {errors.fullName && (
              <p id="profile-fullName-error" role="alert" className="mt-1.5 text-xs font-semibold text-red-600">
                {errors.fullName}
              </p>
            )}
          </div>

          {/* Số CCCD / Mã định danh */}
          <div>
            <label htmlFor="profile-identityNumber" className="block text-xs font-bold text-slate-700">
              Số CCCD / Mã định danh cá nhân
            </label>
            <input
              id="profile-identityNumber"
              name="identityNumber"
              type="text"
              value={formData.identityNumber}
              disabled={!isEditing || saving}
              onChange={(e) => handleChange('identityNumber', e.target.value)}
              placeholder="Gồm đúng 12 chữ số"
              maxLength={12}
              aria-invalid={!!errors.identityNumber}
              aria-describedby={errors.identityNumber ? 'profile-identityNumber-error' : undefined}
              className={`mt-1.5 h-11 w-full rounded-lg border px-3.5 text-xs font-medium text-slate-900 transition-colors disabled:opacity-75 focus:outline-none focus:ring-2 ${
                errors.identityNumber
                  ? 'border-red-500 bg-red-50/20 focus:border-red-600 focus:ring-red-500/20'
                  : 'border-slate-200 bg-slate-50 focus:bg-white focus:ring-red-500'
              }`}
            />
            {errors.identityNumber && (
              <p id="profile-identityNumber-error" role="alert" className="mt-1.5 text-xs font-semibold text-red-600">
                {errors.identityNumber}
              </p>
            )}
          </div>

          {/* Ngày sinh */}
          <div>
            <label htmlFor="profile-dateOfBirth" className="block text-xs font-bold text-slate-700">
              Ngày sinh (YYYY-MM-DD)
            </label>
            <input
              id="profile-dateOfBirth"
              name="dateOfBirth"
              type="date"
              value={formData.dateOfBirth}
              disabled={!isEditing || saving}
              onChange={(e) => handleChange('dateOfBirth', e.target.value)}
              max={todayStr}
              min="1900-01-01"
              aria-invalid={!!errors.dateOfBirth}
              aria-describedby={errors.dateOfBirth ? 'profile-dateOfBirth-error' : undefined}
              className={`mt-1.5 h-11 w-full rounded-lg border px-3.5 text-xs font-medium text-slate-900 transition-colors disabled:opacity-75 focus:outline-none focus:ring-2 ${
                errors.dateOfBirth
                  ? 'border-red-500 bg-red-50/20 focus:border-red-600 focus:ring-red-500/20'
                  : 'border-slate-200 bg-slate-50 focus:bg-white focus:ring-red-500'
              }`}
            />
            {errors.dateOfBirth && (
              <p id="profile-dateOfBirth-error" role="alert" className="mt-1.5 text-xs font-semibold text-red-600">
                {errors.dateOfBirth}
              </p>
            )}
          </div>

          {/* Giới tính */}
          <div>
            <label htmlFor="profile-gender" className="block text-xs font-bold text-slate-700">
              Giới tính
            </label>
            <select
              id="profile-gender"
              name="gender"
              value={formData.gender}
              disabled={!isEditing || saving}
              onChange={(e) => handleChange('gender', e.target.value)}
              aria-invalid={!!errors.gender}
              aria-describedby={errors.gender ? 'profile-gender-error' : undefined}
              className={`mt-1.5 h-11 w-full rounded-lg border px-3.5 text-xs font-medium text-slate-900 transition-colors disabled:opacity-75 focus:outline-none focus:ring-2 ${
                errors.gender
                  ? 'border-red-500 bg-red-50/20 focus:border-red-600 focus:ring-red-500/20'
                  : 'border-slate-200 bg-slate-50 focus:bg-white focus:ring-red-500'
              }`}
            >
              <option value="">Chọn giới tính</option>
              <option value="Nam">Nam</option>
              <option value="Nữ">Nữ</option>
              <option value="Khác">Khác</option>
            </select>
            {errors.gender && (
              <p id="profile-gender-error" role="alert" className="mt-1.5 text-xs font-semibold text-red-600">
                {errors.gender}
              </p>
            )}
          </div>

          {/* Số điện thoại liên hệ */}
          <div>
            <label htmlFor="profile-phoneNumber" className="block text-xs font-bold text-slate-700">
              Số điện thoại di động
            </label>
            <input
              id="profile-phoneNumber"
              name="phoneNumber"
              type="tel"
              value={formData.phoneNumber}
              disabled={!isEditing || saving}
              onChange={(e) => handleChange('phoneNumber', e.target.value)}
              placeholder="Ví dụ: 0912345678"
              maxLength={15}
              aria-invalid={!!errors.phoneNumber}
              aria-describedby={errors.phoneNumber ? 'profile-phoneNumber-error' : undefined}
              className={`mt-1.5 h-11 w-full rounded-lg border px-3.5 text-xs font-medium text-slate-900 transition-colors disabled:opacity-75 focus:outline-none focus:ring-2 ${
                errors.phoneNumber
                  ? 'border-red-500 bg-red-50/20 focus:border-red-600 focus:ring-red-500/20'
                  : 'border-slate-200 bg-slate-50 focus:bg-white focus:ring-red-500'
              }`}
            />
            {errors.phoneNumber && (
              <p id="profile-phoneNumber-error" role="alert" className="mt-1.5 text-xs font-semibold text-red-600">
                {errors.phoneNumber}
              </p>
            )}
          </div>

          {/* Địa chỉ tạm trú */}
          <div>
            <label htmlFor="profile-temporaryAddress" className="block text-xs font-bold text-slate-700">
              Địa chỉ tạm trú
            </label>
            <input
              id="profile-temporaryAddress"
              name="temporaryAddress"
              type="text"
              value={formData.temporaryAddress}
              disabled={!isEditing || saving}
              onChange={(e) => handleChange('temporaryAddress', e.target.value)}
              placeholder="Nhập địa chỉ tạm trú (nếu có)"
              maxLength={255}
              aria-invalid={!!errors.temporaryAddress}
              aria-describedby={errors.temporaryAddress ? 'profile-temporaryAddress-error' : undefined}
              className={`mt-1.5 h-11 w-full rounded-lg border px-3.5 text-xs font-medium text-slate-900 transition-colors disabled:opacity-75 focus:outline-none focus:ring-2 ${
                errors.temporaryAddress
                  ? 'border-red-500 bg-red-50/20 focus:border-red-600 focus:ring-red-500/20'
                  : 'border-slate-200 bg-slate-50 focus:bg-white focus:ring-red-500'
              }`}
            />
            {errors.temporaryAddress && (
              <p id="profile-temporaryAddress-error" role="alert" className="mt-1.5 text-xs font-semibold text-red-600">
                {errors.temporaryAddress}
              </p>
            )}
          </div>

          {/* Nơi thường trú */}
          <div className="sm:col-span-2">
            <label htmlFor="profile-permanentAddress" className="block text-xs font-bold text-slate-700">
              Nơi thường trú
            </label>
            <input
              id="profile-permanentAddress"
              name="permanentAddress"
              type="text"
              value={formData.permanentAddress}
              disabled={!isEditing || saving}
              onChange={(e) => handleChange('permanentAddress', e.target.value)}
              placeholder="Số nhà, tên đường, tổ/thôn, phường/xã, quận/huyện, tỉnh/thành phố"
              maxLength={255}
              aria-invalid={!!errors.permanentAddress}
              aria-describedby={errors.permanentAddress ? 'profile-permanentAddress-error' : undefined}
              className={`mt-1.5 h-11 w-full rounded-lg border px-3.5 text-xs font-medium text-slate-900 transition-colors disabled:opacity-75 focus:outline-none focus:ring-2 ${
                errors.permanentAddress
                  ? 'border-red-500 bg-red-50/20 focus:border-red-600 focus:ring-red-500/20'
                  : 'border-slate-200 bg-slate-50 focus:bg-white focus:ring-red-500'
              }`}
            />
            {errors.permanentAddress && (
              <p id="profile-permanentAddress-error" role="alert" className="mt-1.5 text-xs font-semibold text-red-600">
                {errors.permanentAddress}
              </p>
            )}
          </div>

          {isEditing && (
            <div className="sm:col-span-2 flex justify-end gap-3 mt-2">
              <button
                type="button"
                className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                onClick={handleCancel}
                disabled={saving}
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                className="rounded-lg bg-red-800 px-5 py-2 text-xs font-bold text-white hover:bg-red-900 shadow-sm disabled:opacity-60 transition-colors"
                disabled={saving}
              >
                {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          )}
        </form>
      </section>
    </div>
  );
}
