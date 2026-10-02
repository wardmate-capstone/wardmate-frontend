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

type AuthPageProps = { mode: 'login' | 'register' };

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
  const pending = useRef(false);
  const active = useRef(true);
  const { register: field, handleSubmit, reset, setError, formState: { errors } } = useForm<AuthFormValues>({
    resolver: zodResolver(isRegister ? registerSchema : loginSchema),
    defaultValues: { identity: '', password: '', fullName: '', email: '', confirmPassword: '', terms: false },
  });
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
        navigate(loginDestination(useAuthStore.getState().user?.roles ?? [], returnTo), { replace: true });
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
                <span>{isRegister ? 'Tôi đồng ý với điều khoản sử dụng' : 'Ghi nhớ đăng nhập'}</span>
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
    </section>
  );
}
