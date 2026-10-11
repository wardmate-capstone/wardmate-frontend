import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { useForm, type UseFormRegisterReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, registerSchema, type AuthFormValues } from '@/lib/authSchema';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { m } from 'motion/react';
import { toast } from '@/components/ui/Toast';
import {
  ArrowLeft,
  Eye,
  EyeSlash,
  IdentificationCard,
  LockKey,
  UserCircle,
} from '@phosphor-icons/react';
import { Button, Input } from '@/components/ui';
import { loginDestination, safeReturnTo } from '@/lib/authRedirect';
import { useAuthStore } from '@/stores/authStore';
import { authErrorMessage, login, register } from '@/lib/api';

import { Modal } from '@/components/ui/Modal';
import { Check, X as XIcon } from '@phosphor-icons/react';

type AuthPageProps = { mode: 'login' | 'register' };

function getPasswordStrength(val: string) {
  const hasMin = val.length >= 8;
  const hasUpper = /\p{Lu}/u.test(val);
  const hasLower = /\p{Ll}/u.test(val);
  const hasNumber = /\d/.test(val);
  const hasSpecial = /[\p{P}\p{S}]/u.test(val);
  const passed = [hasMin, hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;
  return { hasMin, hasUpper, hasLower, hasNumber, hasSpecial, passed };
}

function PasswordField({ id, label, autoComplete, field, error }: { id: string; label: string; autoComplete: string; field: UseFormRegisterReturn; error?: string }) {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <label className="auth-label" htmlFor={id}>{label}</label>
      <div className="relative">
        <LockKey className="auth-field-icon" size={20} aria-hidden="true" />
        <Input {...field} error={error} id={id} type={visible ? 'text' : 'password'} autoComplete={autoComplete} className="auth-input min-h-11 sm:min-h-12 pl-11 pr-11" placeholder="Nhập mật khẩu" required />
        <button type="button" className="auth-password-toggle" onClick={() => setVisible((value) => !value)} aria-label={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}>
          {visible ? <EyeSlash size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
        </button>
      </div>
    </div>
  );
}

export function AuthPage({ mode }: AuthPageProps) {
  const isRegister = mode === 'register';
  const [searchParams] = useSearchParams();
  const returnTo = safeReturnTo(searchParams.get('returnTo'));
  const expired = !isRegister && searchParams.get('reason') === 'session-expired';
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [termsModalOpen, setTermsModalOpen] = useState(false);
  const pending = useRef(false);
  const active = useRef(true);
  const { register: field, handleSubmit, reset, setError, watch, formState: { errors } } = useForm<AuthFormValues>({
    resolver: zodResolver(isRegister ? registerSchema : loginSchema),
    defaultValues: { identity: '', password: '', fullName: '', email: '', confirmPassword: '', terms: false },
  });
  const passwordValue = watch('password') || '';
  const pwdStrength = getPasswordStrength(passwordValue);
  useEffect(() => { active.current = true; return () => { active.current = false; }; }, [mode]);

  async function submit(values: AuthFormValues) {
    if (pending.current) return;
    const { identity, fullName, email, password } = values;
    pending.current = true;
    setSubmitting(true);
    try {
      if (isRegister) {
        await register({ username: identity, email, password, fullName });
        if (!active.current) return;
        reset();
        toast.success('Đăng ký thành công. Vui lòng đăng nhập.');
        navigate('/dang-nhap' + (returnTo !== '/' ? '?returnTo=' + encodeURIComponent(returnTo) : ''), { replace: true });
      } else {
        await login({ usernameOrEmail: identity, password });
        if (!active.current) return;
        reset();
        toast.success('Đăng nhập thành công.');
        const user = useAuthStore.getState().user;
        navigate(loginDestination(user?.roles ?? [], returnTo, user?.permissions ?? []), { replace: true });
      }
    } catch (error) {
      if (active.current) {
        const serverErrors: unknown = axios.isAxiosError(error) ? error.response?.data?.errors : null;
        const names: Record<string, keyof AuthFormValues> = { username: 'identity', usernameoremail: 'identity', fullname: 'fullName', email: 'email', password: 'password' };
        let mapped = false;
        if (serverErrors && typeof serverErrors === 'object') {
          for (const [key, messages] of Object.entries(serverErrors)) {
            const name = names[key.toLowerCase()];
            if (name && Array.isArray(messages) && typeof messages[0] === 'string') {
              setError(name, { type: 'server', message: messages[0] }, { shouldFocus: !mapped });
              mapped = true;
            }
          }
        }
        if (!mapped) toast.error(authErrorMessage(error));
      }
    } finally {
      pending.current = false;
      if (active.current) setSubmitting(false);
    }
  }

  return (
    <section className="auth-page flex min-h-[calc(100vh-135px)] items-center justify-center py-2 sm:py-4">
      <div className="w-full max-w-[480px]">
        {/* Nút quay lại trang chủ */}
        <div className="mb-2.5 flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs sm:text-sm font-semibold text-slate-600 hover:bg-white hover:text-red-800 transition-colors shadow-2xs"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            <span>Quay lại trang chủ</span>
          </Link>
       </div>

        {/* Khối Card Form đăng nhập / đăng ký duy nhất */}
        <m.div
          key={mode}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18 }}
          className="rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-7 shadow-[0_20px_50px_rgba(70,20,24,.07)]"
        >
          {/* Header của Form */}
          <div className="border-b border-slate-100 pb-4 text-center sm:text-left">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-red-700">
              {isRegister ? 'Bắt đầu sử dụng' : 'Cổng dịch vụ hành chính'}
            </p>
            <h1 className="mt-0.5 text-xl font-bold text-slate-950 sm:text-2xl">
              {isRegister ? 'Đăng ký tài khoản' : 'Đăng nhập'}
            </h1>
          </div>

          {expired && (
            <p
              role="status"
              className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs sm:text-sm text-amber-900"
            >
              Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để tiếp tục.
            </p>
          )}

          <form className="auth-form-fields mt-4 grid gap-3.5" noValidate onSubmit={handleSubmit(submit)}>
            {isRegister && (
              <div>
                <label className="auth-label" htmlFor="full-name">
                  Họ và tên
                </label>
                <div className="relative">
                  <UserCircle className="auth-field-icon" size={18} aria-hidden="true" />
                  <Input
                    {...field('fullName')}
                    error={errors.fullName?.message}
                    id="full-name"
                    className="auth-input min-h-11 sm:min-h-12 pl-11"
                    autoComplete="name"
                    placeholder="Nguyễn Văn An"
                    required
                  />
                </div>
              </div>
            )}
            <div>
              <label className="auth-label" htmlFor="identity">
                {isRegister ? 'Tên đăng nhập' : 'Tên đăng nhập hoặc email'}
              </label>
              <div className="relative">
                <IdentificationCard className="auth-field-icon" size={18} aria-hidden="true" />
                <Input
                  {...field('identity')}
                  error={errors.identity?.message}
                  id="identity"
                  className="auth-input min-h-11 sm:min-h-12 pl-11"
                  autoComplete="username"
                  placeholder={isRegister ? 'Nhập tên đăng nhập' : 'Nhập tên đăng nhập hoặc email'}
                  required
                />
              </div>
            </div>
            {isRegister && (
              <div>
                <label className="auth-label" htmlFor="email">
                  Email
                </label>
                <Input
                  {...field('email')}
                  error={errors.email?.message}
                  id="email"
                  type="email"
                  autoComplete="email"
                  className="auth-input min-h-11 sm:min-h-12"
                  placeholder="Nhập email"
                  required
                />
              </div>
            )}
            <PasswordField
              field={field('password')}
              error={errors.password?.message}
              id="password"
              label="Mật khẩu"
              autoComplete={isRegister ? 'new-password' : 'current-password'}
            />

            {/* Password strength indicator for registration */}
            {isRegister && passwordValue.length > 0 && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold">
                  <span className="text-slate-600">Độ mạnh mật khẩu:</span>
                  <span
                    className={
                      pwdStrength.passed <= 2
                        ? 'text-red-700'
                        : pwdStrength.passed <= 4
                        ? 'text-amber-700'
                        : 'text-emerald-700'
                    }
                  >
                    {pwdStrength.passed <= 2 ? 'Yếu' : pwdStrength.passed <= 4 ? 'Khá' : 'Mạnh'}
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-1 h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                  {[1, 2, 3, 4, 5].map((lvl) => (
                    <div
                      key={lvl}
                      className={`h-full transition-colors ${
                        pwdStrength.passed >= lvl
                          ? pwdStrength.passed <= 2
                            ? 'bg-red-600'
                            : pwdStrength.passed <= 4
                            ? 'bg-amber-500'
                            : 'bg-emerald-600'
                          : 'bg-transparent'
                      }`}
                    />
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px] text-slate-500">
                  <span className={`inline-flex items-center gap-1 ${pwdStrength.hasMin ? 'text-emerald-700 font-semibold' : ''}`}>
                    {pwdStrength.hasMin ? <Check size={12} weight="bold" /> : <XIcon size={12} />} Ít nhất 8 ký tự
                  </span>
                  <span className={`inline-flex items-center gap-1 ${pwdStrength.hasUpper ? 'text-emerald-700 font-semibold' : ''}`}>
                    {pwdStrength.hasUpper ? <Check size={12} weight="bold" /> : <XIcon size={12} />} Có chữ in hoa
                  </span>
                  <span className={`inline-flex items-center gap-1 ${pwdStrength.hasNumber ? 'text-emerald-700 font-semibold' : ''}`}>
                    {pwdStrength.hasNumber ? <Check size={12} weight="bold" /> : <XIcon size={12} />} Có chữ số
                  </span>
                  <span className={`inline-flex items-center gap-1 ${pwdStrength.hasSpecial ? 'text-emerald-700 font-semibold' : ''}`}>
                    {pwdStrength.hasSpecial ? <Check size={12} weight="bold" /> : <XIcon size={12} />} Ký tự đặc biệt (@#$...)
                  </span>
                </div>
              </div>
            )}

            {isRegister && (
              <PasswordField
              field={field('confirmPassword')}
              error={errors.confirmPassword?.message}
              id="confirm-password"
              label="Xác nhận mật khẩu"
              autoComplete="new-password"
              />
            )}

            <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5 text-xs sm:text-sm">
              <label className="auth-checkbox">
                <input
                  type="checkbox"
                  {...(isRegister ? field('terms') : { name: 'remember' })}
                  required={isRegister}
                  aria-invalid={!!errors.terms}
                  aria-describedby={errors.terms ? 'terms-error' : undefined}
                />
                <span>
                  {isRegister ? (
                    <>
                      Tôi đồng ý với{' '}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setTermsModalOpen(true);
                        }}
                        className="text-red-800 underline font-semibold hover:text-red-950"
                      >
                        điều khoản sử dụng
                      </button>
                    </>
                  ) : (
                    'Ghi nhớ đăng nhập'
                  )}
                </span>
              </label>
              {!isRegister && (
                <Link to="/quen-mat-khau" className="font-semibold text-red-800 hover:underline">
                  Quên mật khẩu?
                </Link>
              )}
            </div>

            {errors.terms && (
              <p id="terms-error" role="alert" className="text-xs text-red-800">
                {errors.terms.message}
              </p>
            )}

            <Button type="submit" size="large" className="mt-1 min-h-11 w-full" loading={submitting}>
              {submitting
                ? (isRegister ? 'Đang tạo tài khoản...' : 'Đang đăng nhập...')
                : (isRegister ? 'Tạo tài khoản' : 'Đăng nhập')}
            </Button>
          </form>

          <p className="auth-switch">
            {isRegister ? 'Đã có tài khoản?' : 'Chưa có tài khoản?'}{' '}
            <Link
              to={
                (isRegister ? '/dang-nhap' : '/dang-ky') +
                (returnTo !== '/' ? '?returnTo=' + encodeURIComponent(returnTo) : '')
              }
            >
              {isRegister ? 'Đăng nhập' : 'Đăng ký ngay'}
            </Link>
          </p>
        </m.div>
      </div>

      {/* Modal Điều khoản sử dụng dịch vụ */}
      <Modal
        open={termsModalOpen}
        onOpenChange={setTermsModalOpen}
        title="Điều khoản sử dụng dịch vụ WardMate"
      >
        <div className="space-y-3.5 text-xs sm:text-sm text-slate-700 max-h-[60vh] overflow-y-auto pr-1">
          <p className="font-semibold text-red-900 bg-red-50 p-3 rounded-xl border border-red-200">
            WardMate là Hệ thống Hỗ trợ Chuẩn bị và Tiền kiểm Hồ sơ Hành chính cấp Xã/Phường. Đây không phải cổng tiếp nhận hồ sơ chính thức của Nhà nước.
          </p>
          <div className="space-y-2">
            <h4 className="font-bold text-slate-900">1. Mục đích sử dụng:</h4>
            <p className="text-slate-600">
              Hệ thống cung cấp công cụ hướng dẫn công dân chuẩn bị đúng giấy tờ, kiểm tra trước thông tin kê khai điện tử nhằm giảm thiểu sai sót và số lần đi lại trước khi tới nộp tại Bộ phận Một cửa UBND cấp Xã/Phường.
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="font-bold text-slate-900">2. Ranh giới pháp lý & Tiền kiểm:</h4>
            <p className="text-slate-600">
              Việc hoàn tất chuẩn bị hồ sơ hoặc duyệt tiền kiểm trên WardMate <strong>không thay thế</strong> việc nộp hồ sơ giấy và đối chiếu gốc tại cơ quan tiếp nhận chính thức. Quyết định thụ lý chỉ được xác lập khi cán bộ tiếp nhận trực tiếp đối chiếu hồ sơ tại UBND.
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="font-bold text-slate-900">3. Bảo vệ dữ liệu cá nhân:</h4>
            <p className="text-slate-600">
              Thông tin định danh và tài liệu của công dân được bảo mật theo quy định pháp luật và chỉ sử dụng cho mục đích tiền kiểm thủ tục hành chính.
            </p>
          </div>
          <div className="pt-3 border-t border-slate-100 flex justify-end">
            <Button onClick={() => setTermsModalOpen(false)}>
              Đã hiểu và đóng
            </Button>
          </div>
        </div>
      </Modal>
    </section>
  );
}
