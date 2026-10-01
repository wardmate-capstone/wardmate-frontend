import { FormEvent, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { m } from 'motion/react';
import { toast } from '@/components/ui/Toast';
import {
  ArrowLeft,
  CheckCircle,
  Eye,
  EyeSlash,
  IdentificationCard,
  LockKey,
  UserCircle,
} from '@phosphor-icons/react';
import { Button, Input } from '@/components/ui';
import { safeReturnTo } from '@/lib/authRedirect';
import { authErrorMessage, login, register } from '@/lib/api';

type AuthPageProps = { mode: 'login' | 'register' };

function PasswordField({ id, label, autoComplete }: { id: string; label: string; autoComplete: string }) {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <label className="auth-label" htmlFor={id}>{label}</label>
      <div className="relative">
        <LockKey className="auth-field-icon" size={20} aria-hidden="true" />
        <Input id={id} name={id} type={visible ? 'text' : 'password'} autoComplete={autoComplete} className="auth-input min-h-14 pl-12 pr-12" placeholder="Nhập mật khẩu" minLength={autoComplete === 'new-password' ? 8 : undefined} required />
        <button type="button" className="auth-password-toggle" onClick={() => setVisible((value) => !value)} aria-label={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}>
          {visible ? <EyeSlash size={20} aria-hidden="true" /> : <Eye size={20} aria-hidden="true" />}
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
  useEffect(() => { active.current = true; return () => { active.current = false; }; }, [mode]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending.current) return;
    const element = event.currentTarget;
    const form = new FormData(event.currentTarget);
    if (isRegister && form.get('password') !== form.get('confirm-password')) {
      toast.error('Mật khẩu xác nhận chưa khớp.');
      return;
    }
    const identity = String(form.get('identity') ?? '').trim();
    const fullName = String(form.get('full-name') ?? '').trim();
    const email = String(form.get('email') ?? '').trim();
    if (!identity || (isRegister && (!fullName || !email))) {
      toast.error('Vui lòng điền đầy đủ thông tin, không chỉ nhập khoảng trắng.');
      return;
    }
    pending.current = true;
    setSubmitting(true);
    try {
      const password = String(form.get('password') ?? '');
      if (isRegister) {
        await register({ username: identity, email, password, fullName });
        if (!active.current) return;
        element.reset();
        toast.success('Đăng ký thành công. Vui lòng đăng nhập.');
        navigate('/dang-nhap' + (returnTo !== '/' ? '?returnTo=' + encodeURIComponent(returnTo) : ''), { replace: true });
      } else {
        await login({ usernameOrEmail: identity, password });
        if (!active.current) return;
        element.reset();
        toast.success('Đăng nhập thành công.');
        navigate(returnTo, { replace: true });
      }
    } catch (error) {
      if (active.current) toast.error(authErrorMessage(error));
    } finally {
      pending.current = false;
      if (active.current) setSubmitting(false);
    }
  }

  return (
    <section className="auth-page">
      <div className="auth-shell">
        <m.aside initial={{ opacity: 0, x: -18 }} animate={{ opacity: 1, x: 0 }} className="auth-intro">
          <Link to="/" className="auth-back"><ArrowLeft size={18} aria-hidden="true" /> Về trang chủ</Link>
          <p className="section-label text-gold-300 before:bg-gold-400">WardMate · Hỗ trợ hồ sơ hành chính</p>
          <h1>{isRegister ? 'Tạo tài khoản của bạn' : 'Chào mừng bạn trở lại'}</h1>
          <p>{isRegister ? 'Lưu hồ sơ đang chuẩn bị, nhận góp ý tiền kiểm và theo dõi từng lần bổ sung trong một tài khoản.' : 'Tiếp tục chuẩn bị hồ sơ, xem góp ý tiền kiểm và quản lý các phiên bản đã lưu.'}</p>
          <ul className="auth-benefits">
            {['Thông tin được bảo vệ và sử dụng đúng mục đích.', 'Tiến độ hồ sơ được lưu tự động.', 'Chỉ nhận QR sau khi hồ sơ được duyệt tiền kiểm.'].map((item) => (
              <li key={item}><CheckCircle size={21} weight="fill" aria-hidden="true" />{item}</li>
            ))}
          </ul>
        </m.aside>

        <m.div key={mode} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="auth-form-panel">
          <div className="auth-form-heading">
            <div><p>{isRegister ? 'Bắt đầu sử dụng' : 'Tài khoản cá nhân'}</p><h2>{isRegister ? 'Đăng ký tài khoản' : 'Đăng nhập'}</h2></div>
          </div>

          {expired && <p role="status" className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để tiếp tục.</p>}

          <form className="mt-8 grid gap-5" onSubmit={handleSubmit}>
            {isRegister && (
              <div>
                <label className="auth-label" htmlFor="full-name">Họ và tên</label>
                <div className="relative"><UserCircle className="auth-field-icon" size={20} aria-hidden="true" /><Input id="full-name" name="full-name" className="auth-input min-h-14 pl-12" autoComplete="name" placeholder="Nguyễn Văn An" required /></div>
              </div>
            )}
            <div>
              <label className="auth-label" htmlFor="identity">{isRegister ? 'Tên đăng nhập' : 'Tên đăng nhập hoặc email'}</label>
              <div className="relative"><IdentificationCard className="auth-field-icon" size={20} aria-hidden="true" /><Input id="identity" name="identity" className="auth-input min-h-14 pl-12" autoComplete="username" placeholder={isRegister ? 'Nhập tên đăng nhập' : 'Nhập tên đăng nhập hoặc email'} required /></div>
            </div>
            {isRegister && (
              <div>
                <label className="auth-label" htmlFor="email">Email</label>
                <Input id="email" name="email" type="email" autoComplete="email" className="auth-input min-h-14" placeholder="Nhập email" required />
              </div>
            )}
            <PasswordField id="password" label="Mật khẩu" autoComplete={isRegister ? 'new-password' : 'current-password'} />
            {isRegister && <PasswordField id="confirm-password" label="Xác nhận mật khẩu" autoComplete="new-password" />}

            <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
              <label className="auth-checkbox"><input type="checkbox" name={isRegister ? 'terms' : 'remember'} required={isRegister} /> <span>{isRegister ? 'Tôi đồng ý với điều khoản sử dụng' : 'Ghi nhớ đăng nhập'}</span></label>
              {!isRegister && <Link to="/quen-mat-khau" className="font-semibold text-red-800 hover:underline">Quên mật khẩu?</Link>}
            </div>

            <Button type="submit" size="large" className="mt-1 w-full" loading={submitting}>{isRegister ? 'Tạo tài khoản' : 'Đăng nhập'}</Button>
          </form>

          <p className="auth-switch">
            {isRegister ? 'Đã có tài khoản?' : 'Chưa có tài khoản?'}{' '}
            <Link to={(isRegister ? '/dang-nhap' : '/dang-ky') + (returnTo !== '/' ? '?returnTo=' + encodeURIComponent(returnTo) : '')}>{isRegister ? 'Đăng nhập' : 'Đăng ký ngay'}</Link>
          </p>
        </m.div>
      </div>
    </section>
  );
}
