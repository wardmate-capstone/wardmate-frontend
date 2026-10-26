import React, { useState, useId } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Lock,
  Eye,
  EyeSlash,
  CheckCircle,
  WarningCircle,
  ShieldCheck,
} from '@phosphor-icons/react';
import { Button } from '@/components/ui';
import { changePassword, authErrorMessage, iamErrorCode } from '@/lib/api';
import { toast } from '@/components/ui/Toast';
import { getPasswordChecks, PasswordMatchHint, PasswordStrength } from '@/components/auth/PasswordStrength';
import { ChangePasswordOtpForm } from './ChangePasswordOtpForm';

export interface AccountSecuritySectionProps {
  className?: string;
  onSuccess?: () => void;
}

export const AccountSecuritySection: React.FC<AccountSecuritySectionProps> = ({
  className = '',
  onSuccess,
}) => {
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  // Hai cách IAM hỗ trợ: nhập mật khẩu hiện tại, hoặc xác thực bằng OTP email (CHANGE_PASSWORD).
  const [method, setMethod] = useState<'password' | 'otp'>('password');

  const currentId = useId();
  const newId = useId();
  const confirmId = useId();

  // Cùng rule với IAM change-password: 8 ký tự, hoa, thường, số, ký tự đặc biệt.
  const checks = getPasswordChecks(newPassword);
  const isMatched = Boolean(confirmNewPassword && newPassword === confirmNewPassword);

  const isFormValid =
    currentPassword.length > 0 &&
    checks.passed === 5 &&
    new TextEncoder().encode(newPassword).length <= 72 &&
    isMatched;

  // Cả hai cách đều thu hồi phiên ở BE: báo thành công rồi chuyển về đăng nhập.
  const handleChanged = () => {
    setIsSuccess(true);
    toast.success('Đổi mật khẩu thành công! Vui lòng đăng nhập lại.');
    onSuccess?.();
    setTimeout(() => {
      navigate('/dang-nhap', { replace: true });
    }, 1500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || loading) return;

    setLoading(true);
    setErrorMessage(null);

    try {
      await changePassword({
        currentPassword,
        newPassword,
        confirmNewPassword,
      });

      handleChanged();
    } catch (err: unknown) {
      const code = iamErrorCode(err);
      if (code === 'iam.current_password_invalid') {
        setErrorMessage('Mật khẩu hiện tại không chính xác. Vui lòng kiểm tra lại.');
      } else if (code === 'iam.password_unchanged') {
        setErrorMessage('Mật khẩu mới không được trùng với mật khẩu hiện tại.');
      } else {
        setErrorMessage(authErrorMessage(err));
      }
    } finally {
      setLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className={`max-w-xl mx-auto admin-card p-8 sm:p-10 text-center space-y-5 shadow-sm rounded-2xl ${className}`}>
        <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200/80 shadow-2xs">
          <CheckCircle size={40} weight="fill" />
        </div>
        <div className="space-y-1.5 max-w-sm mx-auto">
          <h3 className="text-lg font-bold text-slate-900">Đổi mật khẩu thành công!</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Mật khẩu mới đã được áp dụng. Hệ thống đang tự động chuyển hướng bạn tới trang đăng nhập...
          </p>
        </div>
        <div className="pt-2">
          <Button
            variant="primary"
            size="small"
            onClick={() => navigate('/dang-nhap', { replace: true })}
            className="shadow-sm"
          >
            Đăng nhập ngay
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`max-w-xl mx-auto admin-card shadow-sm border border-slate-200/90 rounded-2xl overflow-hidden bg-white ${className}`}>
      {/* Header khu vực đổi mật khẩu */}
      <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3.5">
        <div className="size-10 rounded-xl bg-red-50 text-red-800 flex items-center justify-center shrink-0">
          <Lock size={20} weight="duotone" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-900 leading-tight">Đổi mật khẩu</h2>
          <p className="text-xs text-slate-500 mt-0.5">Bảo vệ an toàn cho tài khoản của bạn</p>
        </div>
      </div>

      <div className="px-6 sm:px-8 pt-5">
        <div role="radiogroup" aria-label="Cách xác thực khi đổi mật khẩu" className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1">
          {([
            ['password', 'Dùng mật khẩu hiện tại'],
            ['otp', 'Xác thực qua email'],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={method === value}
              onClick={() => { setMethod(value); setErrorMessage(null); }}
              className={`rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${method === value ? 'bg-white text-red-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {method === 'otp' ? <ChangePasswordOtpForm onSuccess={handleChanged} /> : (
      <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5" noValidate>
        {errorMessage && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50/80 p-3.5 text-rose-800 text-xs"
          >
            <WarningCircle size={18} className="shrink-0 mt-0.5 text-rose-600" weight="fill" />
            <span className="font-medium leading-relaxed">{errorMessage}</span>
          </div>
        )}

        {/* 1. Mật khẩu hiện tại */}
        <div className="space-y-1.5">
          <label htmlFor={currentId} className="block text-xs font-semibold text-slate-800">
            Mật khẩu hiện tại <span className="text-red-600">*</span>
          </label>
          <div className="relative">
            <input
              id={currentId}
              type={showCurrentPassword ? 'text' : 'password'}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Nhập mật khẩu hiện tại"
              disabled={loading}
              required
              className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-3.5 pr-10 text-xs text-slate-950 placeholder:text-slate-400 focus:border-red-600 focus:outline-none focus:ring-3 focus:ring-red-100/70 disabled:bg-slate-100 transition-all shadow-2xs"
            />
            <button
              type="button"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              tabIndex={-1}
              aria-label={showCurrentPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 hover:bg-slate-100/80 p-1 rounded-lg transition-colors"
            >
              {showCurrentPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {/* 2. Mật khẩu mới */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor={newId} className="block text-xs font-semibold text-slate-800">
              Mật khẩu mới <span className="text-red-600">*</span>
            </label>
          </div>

          <div className="relative">
            <input
              id={newId}
              type={showNewPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Nhập mật khẩu mới"
              disabled={loading}
              required
              className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-3.5 pr-10 text-xs text-slate-950 placeholder:text-slate-400 focus:border-red-600 focus:outline-none focus:ring-3 focus:ring-red-100/70 disabled:bg-slate-100 transition-all shadow-2xs"
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              tabIndex={-1}
              aria-label={showNewPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 hover:bg-slate-100/80 p-1 rounded-lg transition-colors"
            >
              {showNewPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <PasswordStrength value={newPassword} strict />
        </div>

        {/* 3. Xác nhận mật khẩu mới */}
        <div className="space-y-1.5">
          <label htmlFor={confirmId} className="block text-xs font-semibold text-slate-800">
            Xác nhận mật khẩu mới <span className="text-red-600">*</span>
          </label>
          <div className="relative">
            <input
              id={confirmId}
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              placeholder="Nhập lại mật khẩu mới"
              disabled={loading}
              required
              className={`w-full rounded-xl border bg-white py-2.5 pl-3.5 pr-10 text-xs text-slate-950 placeholder:text-slate-400 focus:outline-none focus:ring-3 disabled:bg-slate-100 transition-all shadow-2xs ${
                confirmNewPassword && !isMatched
                  ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-100/70'
                  : confirmNewPassword && isMatched
                  ? 'border-emerald-400 focus:border-emerald-500 focus:ring-emerald-100/70'
                  : 'border-slate-300 focus:border-red-600 focus:ring-red-100/70'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              tabIndex={-1}
              aria-label={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 hover:bg-slate-100/80 p-1 rounded-lg transition-colors"
            >
              {showConfirmPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <PasswordMatchHint password={newPassword} confirm={confirmNewPassword} />
        </div>

        {/* Thanh thao tác dưới cùng */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <ShieldCheck size={16} className="text-slate-400 shrink-0" weight="duotone" />
            <span>Hệ thống sẽ yêu cầu đăng nhập lại sau khi đổi</span>
          </div>

          <Button
            type="submit"
            variant="primary"
            loading={loading}
            disabled={!isFormValid}
            className="w-full sm:w-auto shadow-sm gap-2 px-5 py-2.5"
          >
            <Lock size={15} weight="bold" />
            <span>Lưu mật khẩu mới</span>
          </Button>
        </div>
      </form>
      )}
    </div>
  );
};
