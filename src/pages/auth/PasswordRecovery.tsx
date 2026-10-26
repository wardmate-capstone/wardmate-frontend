import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, EnvelopeSimple, IdentificationCard, ShieldCheck } from '@phosphor-icons/react';
import { Button, Input } from '@/components/ui';
import { toast } from '@/components/ui/Toast';
import { authErrorMessage, iamErrorCode, requestPasswordOtp, resetPasswordWithOtp } from '@/lib/api';
import {
  forgotPasswordSchema, resetPasswordSchema, type ForgotPasswordValues, type ResetPasswordValues,
} from '@/lib/authSchema';
import { PasswordField } from './AuthPage';
import { PasswordMatchHint, PasswordStrength } from '@/components/auth/PasswordStrength';

const RESEND_SECONDS = 60;

/**
 * Quên mật khẩu qua OTP email (IAM password-otp, purpose FORGOT_PASSWORD).
 * Bước 1 gửi mã; bước 2 nhập mã + mật khẩu mới. Thông báo bước 1 không tiết lộ tài khoản có tồn tại hay không.
 */
export function PasswordRecovery({ initialIdentity = '' }: { initialIdentity?: string }) {
  const navigate = useNavigate();
  const [identity, setIdentity] = useState(initialIdentity.trim());
  const [notice, setNotice] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [resending, setResending] = useState(false);
  const active = useRef(true);
  useEffect(() => { active.current = true; return () => { active.current = false; }; }, []);
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(() => setCooldown(value => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  const requestForm = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { emailOrUsername: identity },
  });
  const resetForm = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { otp: '', newPassword: '', confirmNewPassword: '' },
  });

  async function sendOtp(emailOrUsername: string) {
    const { message } = await requestPasswordOtp(emailOrUsername);
    if (!active.current) return;
    setIdentity(emailOrUsername);
    setNotice(message);
    setCooldown(RESEND_SECONDS);
  }

  async function submitRequest({ emailOrUsername }: ForgotPasswordValues) {
    try {
      await sendOtp(emailOrUsername.trim());
    } catch (error) {
      if (active.current) toast.error(authErrorMessage(error));
    }
  }

  async function resend() {
    if (cooldown > 0 || resending) return;
    setResending(true);
    try {
      await sendOtp(identity);
      toast.success('Đã gửi lại yêu cầu mã xác thực.');
    } catch (error) {
      if (active.current) toast.error(authErrorMessage(error));
    } finally {
      if (active.current) setResending(false);
    }
  }

  async function submitReset(values: ResetPasswordValues) {
    try {
      const { message } = await resetPasswordWithOtp({ emailOrUsername: identity, ...values, otp: values.otp.trim() });
      if (!active.current) return;
      toast.success(message);
      navigate('/dang-nhap', { replace: true });
    } catch (error) {
      if (!active.current) return;
      if (iamErrorCode(error) === 'iam.otp_invalid') {
        resetForm.setError('otp', { type: 'server', message: authErrorMessage(error) }, { shouldFocus: true });
        return;
      }
      const serverErrors: unknown = axios.isAxiosError(error) ? error.response?.data?.errors : null;
      const names: Record<string, keyof ResetPasswordValues> = { otp: 'otp', newpassword: 'newPassword', confirmnewpassword: 'confirmNewPassword' };
      let mapped = false;
      if (serverErrors && typeof serverErrors === 'object') {
        for (const [key, messages] of Object.entries(serverErrors)) {
          const name = names[key.toLowerCase()];
          if (name && Array.isArray(messages) && typeof messages[0] === 'string') {
            resetForm.setError(name, { type: 'server', message: messages[0] }, { shouldFocus: !mapped });
            mapped = true;
          }
        }
      }
      if (!mapped) toast.error(authErrorMessage(error));
    }
  }

  const onResetStep = Boolean(identity) && Boolean(notice || initialIdentity);
  const { errors: requestErrors, isSubmitting: requesting } = requestForm.formState;
  const { errors: resetErrors, isSubmitting: resetting } = resetForm.formState;
  const newPassword = resetForm.watch('newPassword');
  const confirmNewPassword = resetForm.watch('confirmNewPassword');

  return (
    <section className="auth-page flex min-h-[calc(100vh-135px)] items-center justify-center py-2 sm:py-4">
      <div className="w-full max-w-[480px]">
        <div className="mb-2.5">
          <Link to="/dang-nhap" className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs sm:text-sm font-semibold text-slate-600 hover:bg-white hover:text-red-800 transition-colors shadow-2xs">
            <ArrowLeft size={16} aria-hidden="true" />
            <span>Về trang đăng nhập</span>
          </Link>
        </div>

        <div className="rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-7 shadow-[0_20px_50px_rgba(70,20,24,.07)]">
          <div className="border-b border-slate-100 pb-4 text-center sm:text-left">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-red-700">
              {onResetStep ? 'Bước 2/2' : 'Bước 1/2'}
            </p>
            <h1 className="mt-0.5 text-xl font-bold text-slate-950 sm:text-2xl">
              {onResetStep ? 'Đặt lại mật khẩu' : 'Quên mật khẩu'}
            </h1>
          </div>

          {!onResetStep ? (
            <form className="auth-form-fields mt-4 grid gap-3.5" noValidate onSubmit={requestForm.handleSubmit(submitRequest)}>
              <p className="text-xs sm:text-sm leading-6 text-slate-600">
                Nhập email hoặc tên đăng nhập của tài khoản. Hệ thống sẽ gửi mã xác thực gồm 6 chữ số tới email đã đăng ký.
              </p>
              <div>
                <label className="auth-label" htmlFor="recovery-identity">Email hoặc tên đăng nhập</label>
                <div className="relative">
                  <IdentificationCard className="auth-field-icon" size={18} aria-hidden="true" />
                  <Input
                    {...requestForm.register('emailOrUsername')}
                    error={requestErrors.emailOrUsername?.message}
                    id="recovery-identity"
                    className="auth-input min-h-11 sm:min-h-12 pl-11"
                    autoComplete="username"
                    placeholder="Nhập email hoặc tên đăng nhập"
                    required
                  />
                </div>
              </div>
              <Button type="submit" size="large" className="mt-1 min-h-11 w-full" loading={requesting}>
                {requesting ? 'Đang gửi mã...' : 'Gửi mã xác thực'}
              </Button>
            </form>
          ) : (
            <form className="auth-form-fields mt-4 grid gap-3.5" noValidate onSubmit={resetForm.handleSubmit(submitReset)}>
              <p role="status" className="flex items-start gap-2 rounded-xl border border-sky-200 bg-sky-50 p-3 text-xs sm:text-sm leading-6 text-sky-950">
                <EnvelopeSimple size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
                <span>{notice || 'Nhập mã xác thực đã được gửi tới email đăng ký của tài khoản.'}</span>
              </p>
              <div>
                <label className="auth-label" htmlFor="recovery-otp">Mã xác thực (6 chữ số)</label>
                <div className="relative">
                  <ShieldCheck className="auth-field-icon" size={18} aria-hidden="true" />
                  <Input
                    {...resetForm.register('otp')}
                    error={resetErrors.otp?.message}
                    id="recovery-otp"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    className="auth-input min-h-11 sm:min-h-12 pl-11 tracking-[0.3em]"
                    placeholder="••••••"
                    required
                  />
                </div>
              </div>
              <PasswordField
                field={resetForm.register('newPassword')}
                error={resetErrors.newPassword?.message}
                id="recovery-new-password"
                label="Mật khẩu mới"
                autoComplete="new-password"
              />
              <PasswordStrength value={newPassword} strict />
              <PasswordField
                field={resetForm.register('confirmNewPassword')}
                error={resetErrors.confirmNewPassword?.message}
                id="recovery-confirm-password"
                label="Xác nhận mật khẩu mới"
                autoComplete="new-password"
              />
              <PasswordMatchHint password={newPassword} confirm={confirmNewPassword} />
              <Button type="submit" size="large" className="mt-1 min-h-11 w-full" loading={resetting}>
                {resetting ? 'Đang đặt lại...' : 'Đặt lại mật khẩu'}
              </Button>
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm">
                <button
                  type="button"
                  className="font-semibold text-red-800 hover:underline disabled:cursor-not-allowed disabled:text-slate-400 disabled:no-underline"
                  disabled={cooldown > 0 || resending}
                  onClick={() => void resend()}
                >
                  {cooldown > 0 ? `Gửi lại mã sau ${cooldown}s` : resending ? 'Đang gửi lại...' : 'Gửi lại mã'}
                </button>
                <button
                  type="button"
                  className="font-semibold text-slate-600 hover:underline"
                  onClick={() => { setNotice(''); setIdentity(''); setCooldown(0); resetForm.reset(); requestForm.reset({ emailOrUsername: identity }); }}
                >
                  Đổi tài khoản
                </button>
              </div>
            </form>
          )}
          <p className="mt-4 text-[11px] leading-5 text-slate-500">
            Không chia sẻ mã xác thực cho bất kỳ ai, kể cả cán bộ hỗ trợ.
          </p>
        </div>
      </div>
    </section>
  );
}
