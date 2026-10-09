import { useState, useEffect } from 'react';
import {
  ShieldCheck,
  IdentificationCard,
  PencilSimple,
  Printer,
  Copy,
  MapPin,
  UserCircle,
} from '@phosphor-icons/react';
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

function formatDate(value?: string | null): string {
  if (!value) return 'Chưa được cập nhật';
  if (!value.includes('-')) return value || 'Chưa được cập nhật';
  const parts = value.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return value;
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

  const handleCopyCCCD = () => {
    if (!formData.identityNumber || formData.identityNumber === 'Chưa cập nhật' || formData.identityNumber === 'Chưa được cập nhật') {
      toast.info('Chưa có thông tin số CCCD để sao chép.');
      return;
    }
    navigator.clipboard.writeText(formData.identityNumber);
    toast.success(`Đã sao chép số CCCD: ${formData.identityNumber}`);
  };

  async function handleSaveProfile(e?: React.FormEvent) {
    if (e) e.preventDefault();

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
  const displayName = formData.fullName || 'Công dân chưa cập nhật tên';

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
                onClick={() => setIsEditing(true)}
              >
                <PencilSimple size={16} /> Chỉnh sửa hồ sơ
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                disabled={saving}
                onClick={handleCancel}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => void handleSaveProfile()}
                className="admin-primary-action text-xs disabled:opacity-50"
              >
                {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
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
              {initials}
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
                onClick={handleCancel}
                disabled={saving}
                className="px-3.5 py-1.5 text-xs font-semibold text-white/90 hover:text-white bg-white/10 hover:bg-white/20 rounded-lg transition-colors border border-white/20 disabled:opacity-50"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => void handleSaveProfile()}
                disabled={saving}
                className="px-4 py-1.5 text-xs font-bold text-red-950 bg-amber-300 hover:bg-amber-200 rounded-lg shadow-sm transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
              >
                {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
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
                      id="profile-identityNumber"
                      type="text"
                      maxLength={12}
                      value={formData.identityNumber}
                      onChange={(e) => handleChange('identityNumber', e.target.value.replace(/\D/g, ''))}
                      placeholder="Nhập 12 chữ số CCCD"
                      className={`w-full h-10 px-3.5 font-mono text-base font-bold tracking-widest text-red-950 bg-white border rounded-xl shadow-2xs focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 transition-all placeholder:text-slate-400 placeholder:font-normal placeholder:tracking-normal placeholder:text-xs ${
                        errors.identityNumber ? 'border-red-500 bg-red-50/20' : 'border-red-300'
                      }`}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-mono text-slate-400">
                      {formData.identityNumber?.length || 0}/12
                    </span>
                  </div>
                ) : formData.identityNumber && formData.identityNumber !== 'Chưa cập nhật' && formData.identityNumber !== 'Chưa được cập nhật' ? (
                  <span className="font-mono text-xl font-black text-red-950 tracking-wider">
                    {formData.identityNumber}
                  </span>
                ) : (
                  <span className="text-sm font-semibold text-slate-400 italic">
                    Chưa được cập nhật
                  </span>
                )}
                {errors.identityNumber && (
                  <p role="alert" className="mt-1 text-xs font-semibold text-red-600">
                    {errors.identityNumber}
                  </p>
                )}
              </div>
              {!isEditing && formData.identityNumber && formData.identityNumber !== 'Chưa cập nhật' && formData.identityNumber !== 'Chưa được cập nhật' && (
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
              <label htmlFor="profile-fullName" className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Họ và tên khai sinh <span className="text-red-600">*</span>
              </label>
              {isEditing ? (
                <>
                  <input
                    id="profile-fullName"
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => handleChange('fullName', e.target.value)}
                    placeholder="Ví dụ: NGUYỄN VĂN A"
                    className={`w-full h-9 px-3 text-xs font-bold text-slate-900 bg-white border rounded-lg shadow-2xs focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 transition-all ${
                      errors.fullName ? 'border-red-500 bg-red-50/20' : 'border-slate-300'
                    }`}
                  />
                  {errors.fullName && (
                    <p role="alert" className="mt-1 text-xs font-semibold text-red-600">
                      {errors.fullName}
                    </p>
                  )}
                </>
              ) : (
                <div className="text-sm font-bold text-slate-900 py-1 border-b border-slate-100">
                  {formData.fullName || 'Chưa được cập nhật'}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Ngày sinh */}
              <div>
                <label htmlFor="profile-dateOfBirth" className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                  Ngày sinh
                </label>
                {isEditing ? (
                  <>
                    <input
                      id="profile-dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth}
                      max={todayStr}
                      min="1900-01-01"
                      onChange={(e) => handleChange('dateOfBirth', e.target.value)}
                      className={`w-full h-9 px-3 text-xs font-medium text-slate-900 bg-white border rounded-lg shadow-2xs focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 transition-all ${
                        errors.dateOfBirth ? 'border-red-500 bg-red-50/20' : 'border-slate-300'
                      }`}
                    />
                    {errors.dateOfBirth && (
                      <p role="alert" className="mt-1 text-xs font-semibold text-red-600">
                        {errors.dateOfBirth}
                      </p>
                    )}
                  </>
                ) : (
                  <div className="text-xs font-semibold text-slate-800 py-1.5 border-b border-slate-100">
                    {formatDate(formData.dateOfBirth)}
                  </div>
                )}
              </div>

              {/* Giới tính */}
              <div>
                <label htmlFor="profile-gender" className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                  Giới tính
                </label>
                {isEditing ? (
                  <>
                    <select
                      id="profile-gender"
                      value={formData.gender}
                      onChange={(e) => handleChange('gender', e.target.value)}
                      className={`w-full h-9 px-3 text-xs font-medium text-slate-900 bg-white border rounded-lg shadow-2xs focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 transition-all ${
                        errors.gender ? 'border-red-500 bg-red-50/20' : 'border-slate-300'
                      }`}
                    >
                      <option value="">Chọn giới tính</option>
                      <option value="Nam">Nam</option>
                      <option value="Nữ">Nữ</option>
                      <option value="Khác">Khác</option>
                    </select>
                    {errors.gender && (
                      <p role="alert" className="mt-1 text-xs font-semibold text-red-600">
                        {errors.gender}
                      </p>
                    )}
                  </>
                ) : (
                  <div className="text-xs font-semibold text-slate-800 py-1.5 border-b border-slate-100">
                    {formData.gender || 'Chưa được cập nhật'}
                  </div>
                )}
              </div>
            </div>

            {/* SĐT */}
            <div>
              <label htmlFor="profile-phoneNumber" className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Số điện thoại liên hệ
              </label>
              {isEditing ? (
                <>
                  <input
                    id="profile-phoneNumber"
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => handleChange('phoneNumber', e.target.value)}
                    placeholder="Ví dụ: 0912345678"
                    className={`w-full h-9 px-3 text-xs font-medium text-slate-900 bg-white border rounded-lg shadow-2xs focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 transition-all ${
                      errors.phoneNumber ? 'border-red-500 bg-red-50/20' : 'border-slate-300'
                    }`}
                  />
                  {errors.phoneNumber && (
                    <p role="alert" className="mt-1 text-xs font-semibold text-red-600">
                      {errors.phoneNumber}
                    </p>
                  )}
                </>
              ) : (
                <div className="text-xs font-bold text-slate-900 py-1.5 border-b border-slate-100">
                  {formData.phoneNumber || 'Chưa được cập nhật'}
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
              <label htmlFor="profile-permanentAddress" className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
                Nơi thường trú (Hộ khẩu chính thức)
              </label>
              {isEditing ? (
                <>
                  <textarea
                    id="profile-permanentAddress"
                    rows={3}
                    value={formData.permanentAddress}
                    onChange={(e) => handleChange('permanentAddress', e.target.value)}
                    placeholder="Số nhà, ngõ/ngách, đường phố, thôn/tổ dân phố, phường/xã, quận/huyện, tỉnh/thành phố"
                    className={`w-full p-3 text-xs font-medium text-slate-900 bg-white border rounded-xl shadow-2xs focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 transition-all resize-none leading-relaxed placeholder:text-slate-400 ${
                      errors.permanentAddress ? 'border-red-500 bg-red-50/20' : 'border-slate-300'
                    }`}
                  />
                  {errors.permanentAddress && (
                    <p role="alert" className="mt-1 text-xs font-semibold text-red-600">
                      {errors.permanentAddress}
                    </p>
                  )}
                </>
              ) : (
                <p className="text-slate-800 font-medium bg-slate-50 p-3.5 rounded-xl border border-slate-100 leading-relaxed text-xs min-h-[72px]">
                  {formData.permanentAddress || <span className="text-slate-400 italic">Chưa được cập nhật</span>}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="profile-temporaryAddress" className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
                Nơi tạm trú / Nơi ở hiện tại
              </label>
              {isEditing ? (
                <>
                  <textarea
                    id="profile-temporaryAddress"
                    rows={3}
                    value={formData.temporaryAddress}
                    onChange={(e) => handleChange('temporaryAddress', e.target.value)}
                    placeholder="Địa chỉ đang sinh sống hoặc làm việc thực tế"
                    className={`w-full p-3 text-xs font-medium text-slate-900 bg-white border rounded-xl shadow-2xs focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 transition-all resize-none leading-relaxed placeholder:text-slate-400 ${
                      errors.temporaryAddress ? 'border-red-500 bg-red-50/20' : 'border-slate-300'
                    }`}
                  />
                  {errors.temporaryAddress && (
                    <p role="alert" className="mt-1 text-xs font-semibold text-red-600">
                      {errors.temporaryAddress}
                    </p>
                  )}
                </>
              ) : (
                <p className="text-slate-800 font-medium bg-slate-50 p-3.5 rounded-xl border border-slate-100 leading-relaxed text-xs min-h-[72px]">
                  {formData.temporaryAddress || <span className="text-slate-400 italic">Chưa được cập nhật</span>}
                </p>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
