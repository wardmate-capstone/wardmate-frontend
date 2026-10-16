import { Link } from 'react-router-dom';
import { LockKey } from '@phosphor-icons/react';
import { buttonVariants } from '@/components/ui/Button';

/** No recovery API is integrated; never collect a password or claim it was changed. */
export function RecoveryUnavailable({ reset = false }: { reset?: boolean }) {
  return <section className="auth-page">
    <div className="mx-auto w-full max-w-lg space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <LockKey size={32} className="text-red-800" aria-hidden />
      <h1 className="text-2xl font-bold text-slate-950">{reset ? 'Đặt lại mật khẩu' : 'Khôi phục quyền truy cập'}</h1>
      <p role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">Tính năng khôi phục mật khẩu chưa khả dụng. Chưa có yêu cầu khôi phục nào được gửi và mật khẩu của bạn chưa thay đổi.</p>
      <p className="text-sm leading-6 text-slate-600">Quay lại đăng nhập nếu bạn nhớ mật khẩu. Không gửi mật khẩu hoặc mã xác thực qua nội dung hỏi đáp.</p>
      <Link to="/dang-nhap" className={buttonVariants({ className: 'w-full' })}>Về trang đăng nhập</Link>
      <Link to="/hoi-dap" className="block min-h-11 py-2 text-center text-sm font-semibold text-red-800 underline">Xem hướng dẫn hỗ trợ</Link>
    </div>
  </section>;
}
