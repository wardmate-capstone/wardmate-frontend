import React, { useState, useId } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeSlash, Lock, CheckCircle, WarningCircle } from '@phosphor-icons/react';
import { Modal, Button } from '@/components/ui';
import { changePassword, authErrorMessage } from '@/lib/api';
import { toast } from '@/components/ui/Toast';

export interface ChangePasswordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  open,
  onOpenChange,
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
  const [success, setSuccess] = useState(false);

  const currentId = useId();
  const newId = useId();
  const confirmId = useId();

  // Password rules validation
  const hasMinLength = newPassword.length >= 8;
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasLower = /[a-z]/.test(newPassword);
  const hasDigit = /[0-9]/.test(newPassword);
  const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);
  const isMatched = Boolean(confirmNewPassword && newPassword === confirmNewPassword);

  const isFormValid =
    currentPassword.length > 0 &&
    hasMinLength &&
    hasUpper &&
    hasLower &&
    hasDigit &&
    hasSpecial &&
    isMatched;

  const resetForm = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setErrorMessage(null);
    setSuccess(false);
  };

  const handleClose = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm();
    }
    onOpenChange(newOpen);
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

      setSuccess(true);
      toast.success('Đổi mật khẩu thành công! Toàn bộ phiên làm việc cũ đã được thu hồi bảo mật.');

      // Automatically redirect after brief display
      setTimeout(() => {
        handleClose(false);
        navigate('/dang-nhap', { replace: true });
      }, 1500);
    } catch (err: unknown) {
      const msg = authErrorMessage(err);
      if (msg.includes('iam.current_password_invalid')) {
        setErrorMessage('Mật khẩu hiện tại không chính xác. Vui lòng kiểm tra lại.');
      } else if (msg.includes('iam.password_unchanged')) {
        setErrorMessage('Mật khẩu mới không được trùng với mật khẩu hiện tại.');
      } else {
        setErrorMessage(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={handleClose}
      title="Đổi mật khẩu tài khoản"
      description="Cập nhật mật khẩu để bảo vệ thông tin và tài khoản của bạn."
      className="sm:max-w-md"
    >
      {success ? (
        <div className="py-6 text-center space-y-4">
          <div className="mx-auto grid size-14 place-items-center rounded-full bg-emerald-100 text-emerald-600">
            <CheckCircle size={36} weight="fill" />
          </div>
          <div className="space-y-1">
            <h4 className="text-base font-bold text-slate-900">Đổi mật khẩu thành công!</h4>
            <p className="text-xs text-slate-600">
              Các phiên đăng nhập cũ đã được thu hồi vì lý do an toàn. Hệ thống đang chuyển bạn tới trang đăng nhập...
            </p>
          </div>
          <Button
            variant="primary"
            size="small"
            onClick={() => {
              handleClose(false);
              navigate('/dang-nhap', { replace: true });
            }}
          >
            Đăng nhập lại ngay
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 text-xs" noValidate>
          {errorMessage && (
            <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3 text-red-800">
              <WarningCircle size={18} className="shrink-0 mt-0.5 text-red-600" weight="fill" />
              <div className="text-xs font-medium leading-relaxed whitespace-pre-line">{errorMessage}</div>
            </div>
          )}

          {/* Mật khẩu hiện tại */}
          <div className="space-y-1.5">
            <label htmlFor={currentId} className="block font-semibold text-slate-800">
              Mật khẩu hiện tại <span className="text-red-600">*</span>
            </label>
            <div className="relative">
              <input
                id={currentId}
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Nhập mật khẩu đang sử dụng"
                disabled={loading}
                required
                className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-3.5 pr-10 text-xs text-slate-950 placeholder:text-slate-400 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-100 disabled:bg-slate-100"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                tabIndex={-1}
                aria-label={showCurrentPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showCurrentPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Mật khẩu mới */}
          <div className="space-y-1.5">
            <label htmlFor={newId} className="block font-semibold text-slate-800">
              Mật khẩu mới <span className="text-red-600">*</span>
            </label>
            <div className="relative">
              <input
                id={newId}
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Tối thiểu 8 ký tự, gồm hoa, thường, số, ký tự đặc biệt"
                disabled={loading}
                required
                className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-3.5 pr-10 text-xs text-slate-950 placeholder:text-slate-400 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-100 disabled:bg-slate-100"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                tabIndex={-1}
                aria-label={showNewPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showNewPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* Checklist độ mạnh mật khẩu */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 space-y-1.5">
              <span className="block font-semibold text-slate-700 text-[11px]">Yêu cầu mật khẩu mới:</span>
              <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                <div className={`flex items-center gap-1.5 ${hasMinLength ? 'text-emerald-700 font-semibold' : 'text-slate-500'}`}>
                  <span className={`size-1.5 rounded-full ${hasMinLength ? 'bg-emerald-600' : 'bg-slate-300'}`} />
                  Tối thiểu 8 ký tự
                </div>
                <div className={`flex items-center gap-1.5 ${hasUpper && hasLower ? 'text-emerald-700 font-semibold' : 'text-slate-500'}`}>
                  <span className={`size-1.5 rounded-full ${hasUpper && hasLower ? 'bg-emerald-600' : 'bg-slate-300'}`} />
                  Chữ hoa & chữ thường
                </div>
                <div className={`flex items-center gap-1.5 ${hasDigit ? 'text-emerald-700 font-semibold' : 'text-slate-500'}`}>
                  <span className={`size-1.5 rounded-full ${hasDigit ? 'bg-emerald-600' : 'bg-slate-300'}`} />
                  Ít nhất 1 số (0-9)
                </div>
                <div className={`flex items-center gap-1.5 ${hasSpecial ? 'text-emerald-700 font-semibold' : 'text-slate-500'}`}>
                  <span className={`size-1.5 rounded-full ${hasSpecial ? 'bg-emerald-600' : 'bg-slate-300'}`} />
                  Ít nhất 1 ký tự đặc biệt
                </div>
              </div>
            </div>
          </div>

          {/* Xác nhận mật khẩu mới */}
          <div className="space-y-1.5">
            <label htmlFor={confirmId} className="block font-semibold text-slate-800">
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
                className={`w-full rounded-xl border bg-white py-2.5 pl-3.5 pr-10 text-xs text-slate-950 placeholder:text-slate-400 focus:outline-none focus:ring-2 disabled:bg-slate-100 ${
                  confirmNewPassword && !isMatched
                    ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
                    : 'border-slate-300 focus:border-red-500 focus:ring-red-100'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                tabIndex={-1}
                aria-label={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showConfirmPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {confirmNewPassword && !isMatched && (
              <p className="text-[11px] font-medium text-red-600">Mật khẩu xác nhận không khớp.</p>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="small"
              disabled={loading}
              onClick={() => handleClose(false)}
            >
              Hủy bỏ
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="small"
              loading={loading}
              disabled={!isFormValid}
              className="gap-1.5"
            >
              <Lock size={15} weight="bold" />
              <span>Đổi mật khẩu</span>
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};
