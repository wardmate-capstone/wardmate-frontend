import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { m } from 'motion/react';
import { toast } from 'sonner';
import {
  ArrowLeft,
  CheckCircle,
  Eye,
  EyeSlash,
  IdentificationCard,
  LockKey,
  UserCircle,
} from '@phosphor-icons/react';
import { Button } from '@/components/ui/Button';

type AuthPageProps = { mode: 'login' | 'register' };

function PasswordField({ id, label, autoComplete }: { id: string; label: string; autoComplete: string }) {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <label className="auth-label" htmlFor={id}>{label}</label>
      <div className="relative">
        <LockKey className="auth-field-icon" size={20} aria-hidden="true" />
        <input id={id} name={id} type={visible ? 'text' : 'password'} autoComplete={autoComplete} className="auth-input pr-12" placeholder="Nhập mật khẩu" minLength={8} required />
        <button type="button" className="auth-password-toggle" onClick={() => setVisible((value) => !value)} aria-label={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}>
          {visible ? <EyeSlash size={20} aria-hidden="true" /> : <Eye size={20} aria-hidden="true" />}
        </button>
      </div>
    </div>
  );
}

export function AuthPage({ mode }: AuthPageProps) {
  const isRegister = mode === 'register';

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    if (isRegister && form.get('password') !== form.get('confirm-password')) {
      toast.error('Mật khẩu xác nhận chưa khớp.');
      return;
    }
    toast.success(isRegister ? 'Thông tin đăng ký hợp lệ.' : 'Thông tin đăng nhập hợp lệ.');
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

          <form className="mt-8 grid gap-5" onSubmit={handleSubmit}>
            {isRegister && (
              <div>
                <label className="auth-label" htmlFor="full-name">Họ và tên</label>
                <div className="relative"><UserCircle className="auth-field-icon" size={20} aria-hidden="true" /><input id="full-name" name="full-name" className="auth-input" autoComplete="name" placeholder="Nguyễn Văn An" required /></div>
              </div>
            )}
            <div>
              <label className="auth-label" htmlFor="identity">Số điện thoại hoặc email</label>
              <div className="relative"><IdentificationCard className="auth-field-icon" size={20} aria-hidden="true" /><input id="identity" name="identity" className="auth-input" autoComplete="username" placeholder="Nhập số điện thoại hoặc email" required /></div>
            </div>
            <PasswordField id="password" label="Mật khẩu" autoComplete={isRegister ? 'new-password' : 'current-password'} />
            {isRegister && <PasswordField id="confirm-password" label="Xác nhận mật khẩu" autoComplete="new-password" />}

            <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
              <label className="auth-checkbox"><input type="checkbox" name={isRegister ? 'terms' : 'remember'} required={isRegister} /> <span>{isRegister ? 'Tôi đồng ý với điều khoản sử dụng' : 'Ghi nhớ đăng nhập'}</span></label>
              {!isRegister && <Link to="/quen-mat-khau" className="font-semibold text-red-800 hover:underline">Quên mật khẩu?</Link>}
            </div>

            <Button type="submit" size="large" className="mt-1 w-full">{isRegister ? 'Tạo tài khoản' : 'Đăng nhập'}</Button>
          </form>

          <p className="auth-switch">
            {isRegister ? 'Đã có tài khoản?' : 'Chưa có tài khoản?'}{' '}
            <Link to={isRegister ? '/dang-nhap' : '/dang-ky'}>{isRegister ? 'Đăng nhập' : 'Đăng ký ngay'}</Link>
          </p>
        </m.div>
      </div>
    </section>
  );
}
