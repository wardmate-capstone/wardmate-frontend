import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { m } from 'motion/react';
import {
  ArrowLeft,
  CheckCircle,
  Eye,
  EyeSlash,
  LockKey,
  ShieldCheck,
} from '@phosphor-icons/react';
import { Button, buttonVariants } from '@/components/ui/Button';

function NewPasswordField({ id, label }: { id: string; label: string }) {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <label className="auth-label" htmlFor={id}>{label}</label>
      <div className="relative">
        <LockKey className="auth-field-icon" size={20} aria-hidden="true" />
        <input
          id={id}
          name={id}
          type={visible ? 'text' : 'password'}
          autoComplete="new-password"
          className="auth-input pr-12"
          placeholder="Nhập mật khẩu"
          minLength={8}
          required
        />
        <button type="button" className="auth-password-toggle" onClick={() => setVisible((value) => !value)} aria-label={visible ? `Ẩn ${label.toLowerCase()}` : `Hiện ${label.toLowerCase()}`}>
          {visible ? <EyeSlash size={20} aria-hidden="true" /> : <Eye size={20} aria-hidden="true" />}
        </button>
      </div>
    </div>
  );
}

export function ResetPasswordPage() {
  const [error, setError] = useState('');
  const [completed, setCompleted] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const password = String(form.get('new-password') ?? '');
    const confirmation = String(form.get('confirm-new-password') ?? '');

    if (password.length < 8) {
      setError('Mật khẩu mới phải có ít nhất 8 ký tự.');
      return;
    }
    if (password !== confirmation) {
      setError('Mật khẩu xác nhận chưa khớp.');
      return;
    }

    setError('');
    setCompleted(true);
  }

  return (
    <section className="auth-page">
      <div className="auth-shell">
        <m.aside initial={{ opacity: 0, x: -18 }} animate={{ opacity: 1, x: 0 }} className="auth-intro">
          <Link to="/dang-nhap" className="auth-back"><ArrowLeft size={18} aria-hidden="true" /> Về trang đăng nhập</Link>
          <p className="section-label text-gold-300 before:bg-gold-400">WardMate · Bảo mật tài khoản</p>
          <h1>Tạo mật khẩu mới</h1>
          <p>Chọn mật khẩu mới để tiếp tục sử dụng tài khoản WardMate của bạn.</p>
          <ul className="auth-benefits">
            <li><ShieldCheck size={21} weight="fill" aria-hidden="true" />Sử dụng ít nhất 8 ký tự.</li>
            <li><LockKey size={21} weight="fill" aria-hidden="true" />Không dùng lại mật khẩu đã chia sẻ ở nơi khác.</li>
            <li><CheckCircle size={21} weight="fill" aria-hidden="true" />Hai trường mật khẩu phải trùng khớp.</li>
          </ul>
        </m.aside>

        <m.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="auth-form-panel">
          {completed ? (
            <div className="auth-recovery-success" aria-live="polite">
              <span><CheckCircle size={34} weight="fill" aria-hidden="true" /></span>
              <h2>Đặt lại mật khẩu thành công</h2>
              <p>Bạn có thể sử dụng mật khẩu mới để đăng nhập vào WardMate.</p>
              <div className="auth-recovery-actions">
                <Link to="/dang-nhap" className={buttonVariants({ size: 'large' })}>Đăng nhập ngay</Link>
              </div>
            </div>
          ) : (
            <>
              <div className="auth-form-heading">
                <div><p>Xác thực hoàn tất</p><h2>Đặt lại mật khẩu</h2></div>
              </div>
              <form className="mt-8 grid gap-5" onSubmit={handleSubmit} noValidate>
                <NewPasswordField id="new-password" label="Mật khẩu mới" />
                <NewPasswordField id="confirm-new-password" label="Xác nhận mật khẩu mới" />
                {error && <p className="auth-form-error" role="alert">{error}</p>}
                <Button type="submit" size="large" className="mt-1 w-full">Cập nhật mật khẩu</Button>
              </form>
            </>
          )}
        </m.div>
      </div>
    </section>
  );
}
