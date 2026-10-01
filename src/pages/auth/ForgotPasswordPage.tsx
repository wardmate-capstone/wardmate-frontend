import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { m } from 'motion/react';
import {
  ArrowLeft,
  CheckCircle,
  EnvelopeSimple,
  IdentificationCard,
  LockKey,
  ShieldCheck,
} from '@phosphor-icons/react';
import { Button, buttonVariants } from '@/components/ui/Button';

export function ForgotPasswordPage() {
  const [submittedIdentity, setSubmittedIdentity] = useState('');

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSubmittedIdentity(String(form.get('identity') ?? '').trim());
  }

  return (
    <section className="auth-page">
      <div className="auth-shell">
        <m.aside initial={{ opacity: 0, x: -18 }} animate={{ opacity: 1, x: 0 }} className="auth-intro">
          <Link to="/dang-nhap" className="auth-back"><ArrowLeft size={18} aria-hidden="true" /> Về trang đăng nhập</Link>
          <p className="section-label text-gold-300 before:bg-gold-400">WardMate · Tài khoản cá nhân</p>
          <h1>Khôi phục quyền truy cập</h1>
          <p>Nhận hướng dẫn đặt lại mật khẩu qua thông tin liên hệ đã đăng ký với WardMate.</p>
          <ul className="auth-benefits">
            <li><ShieldCheck size={21} weight="fill" aria-hidden="true" />Thông tin tài khoản luôn được giữ riêng tư.</li>
            <li><EnvelopeSimple size={21} weight="fill" aria-hidden="true" />Liên kết khôi phục chỉ có hiệu lực trong thời gian giới hạn.</li>
            <li><LockKey size={21} weight="fill" aria-hidden="true" />Không chia sẻ mã hoặc liên kết đặt lại mật khẩu.</li>
          </ul>
        </m.aside>

        <m.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="auth-form-panel">
          {submittedIdentity ? (
            <div className="auth-recovery-success" aria-live="polite">
              <span><CheckCircle size={34} weight="fill" aria-hidden="true" /></span>
              <h2>Kiểm tra thông tin liên hệ</h2>
              <p>Nếu thông tin bạn vừa nhập khớp với một tài khoản, hướng dẫn đặt lại mật khẩu sẽ được gửi trong ít phút.</p>
              <div className="auth-recovery-actions">
                <Link to="/dat-lai-mat-khau" className={buttonVariants({ size: 'large' })}>Tiếp tục đặt mật khẩu</Link>
                <button type="button" onClick={() => setSubmittedIdentity('')}>Dùng thông tin khác</button>
              </div>
            </div>
          ) : (
            <>
              <div className="auth-form-heading">
                <div><p>Khôi phục tài khoản</p><h2>Quên mật khẩu</h2></div>
              </div>
              <form className="mt-8 grid gap-5" onSubmit={handleSubmit}>
                <div>
                  <label className="auth-label" htmlFor="recovery-identity">Số điện thoại hoặc email</label>
                  <div className="relative">
                    <IdentificationCard className="auth-field-icon" size={20} aria-hidden="true" />
                    <input id="recovery-identity" name="identity" className="auth-input" autoComplete="username" placeholder="Nhập số điện thoại hoặc email" required />
                  </div>
                </div>
                <p className="auth-recovery-note">Chúng tôi sẽ gửi hướng dẫn khôi phục nếu thông tin này khớp với tài khoản đã đăng ký.</p>
                <Button type="submit" size="large" className="w-full">Gửi hướng dẫn khôi phục</Button>
              </form>
              <p className="auth-switch">Đã nhớ mật khẩu? <Link to="/dang-nhap">Đăng nhập</Link></p>
            </>
          )}
        </m.div>
      </div>
    </section>
  );
}
