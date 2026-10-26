import type { ReactNode } from 'react';
import { Link, Navigate, Outlet, useLocation } from 'react-router-dom';
import { ArrowsClockwise, CloudWarning, House, ShieldWarning, SignIn } from '@phosphor-icons/react';
import { Button, buttonVariants } from '@/components/ui/Button';
import { BrandMark } from '@/components/brand/BrandMark';
import { BrandWordmark } from '@/components/brand/BrandWordmark';
import { restoreSession } from '@/lib/api';
import { safeReturnTo } from '@/lib/authRedirect';
import { useAuthStore } from '@/stores/authStore';
import { hasAnyPermission } from '@/lib/navigationAccess';

/** Khung chung cho các trạng thái chặn truy cập workspace (không có header của MainLayout). */
function SessionScreen({ children }: { children: ReactNode }) {
  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-[radial-gradient(ellipse_at_top,#fdecec_0%,#f8fafc_55%)] px-4 py-10">
      <Link to="/" className="mb-6 flex items-center gap-3" aria-label="WardMate - Trang chủ">
        <BrandMark size={48} />
        <BrandWordmark subtitle="Dịch vụ công xã - phường" />
      </Link>
      <div className="w-full max-w-[460px] rounded-3xl border border-slate-200/80 bg-white p-6 text-center shadow-[0_20px_50px_rgba(70,20,24,.08)] sm:p-8">
        {children}
      </div>
    </main>
  );
}

function ScreenIcon({ tone, children }: { tone: 'red' | 'amber'; children: ReactNode }) {
  const toneClass = tone === 'red' ? 'bg-red-50 text-red-800 ring-red-100' : 'bg-amber-50 text-amber-700 ring-amber-100';
  return <div className={`mx-auto mb-4 grid size-16 place-items-center rounded-2xl ring-8 ${toneClass}`} aria-hidden="true">{children}</div>;
}

export function ProtectedRoute({ roles, permissions = [] }: { roles: string[]; permissions?: string[] }) {
  const { status, user, error, expired } = useAuthStore();
  const location = useLocation();
  const returnTo = safeReturnTo(location.pathname + location.search + location.hash);
  const loginPath = '/dang-nhap?returnTo=' + encodeURIComponent(returnTo);

  if (status === 'restoring') return (
    <SessionScreen>
      <div role="status" className="flex flex-col items-center gap-3 py-4">
        <div className="size-10 animate-spin rounded-full border-3 border-red-100 border-t-red-800" aria-hidden="true" />
        <p className="text-sm font-semibold text-slate-700">Đang khôi phục phiên đăng nhập...</p>
        <p className="text-xs text-slate-500">Vui lòng chờ trong giây lát.</p>
      </div>
    </SessionScreen>
  );

  if (status === 'error') return (
    <SessionScreen>
      <ScreenIcon tone="red"><CloudWarning size={30} weight="duotone" /></ScreenIcon>
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-red-700">Phiên làm việc</p>
      <h1 className="mt-1 text-xl font-bold text-balance text-slate-950 sm:text-2xl">Chưa thể xác minh phiên đăng nhập</h1>
      <p role="alert" className="mt-3 text-sm leading-6 text-slate-600">{error}</p>
      <ul className="mt-4 space-y-1.5 rounded-xl border border-slate-200 bg-slate-50 p-3 text-left text-xs leading-5 text-slate-600">
        <li>• Kiểm tra kết nối mạng của bạn.</li>
        <li>• Máy chủ có thể đang khởi động lại, hãy thử lại sau ít giây.</li>
        <li>• Phiên của bạn vẫn được giữ nếu chưa hết hạn.</li>
      </ul>
      <div className="mt-6 grid gap-2.5">
        <Button size="large" className="w-full gap-2" onClick={() => void restoreSession()}>
          <ArrowsClockwise size={18} weight="bold" aria-hidden="true" /> Thử lại
        </Button>
        <div className="grid gap-2.5 sm:grid-cols-2">
          <Link to="/" className={buttonVariants({ variant: 'outline', className: 'w-full gap-1.5 whitespace-nowrap text-sm' })}>
            <House size={17} aria-hidden="true" /> Về trang chủ
          </Link>
          <Link to={loginPath} className={buttonVariants({ variant: 'outline', className: 'w-full gap-1.5 whitespace-nowrap text-sm' })}>
            <SignIn size={17} aria-hidden="true" /> Đăng nhập lại
          </Link>
        </div>
      </div>
    </SessionScreen>
  );

  if (status === 'anonymous') {
    return <Navigate to={loginPath + (expired ? '&reason=session-expired' : '')} replace />;
  }

  if (!user || (!user.roles.some(role => roles.includes(role)) && !hasAnyPermission(user.permissions, permissions))) return (
    <SessionScreen>
      <ScreenIcon tone="amber"><ShieldWarning size={30} weight="duotone" /></ScreenIcon>
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-amber-700">Không đủ quyền</p>
      <h1 className="mt-1 text-xl font-bold text-balance text-slate-950 sm:text-2xl">Bạn không có quyền truy cập trang này</h1>
      <p className="mt-3 text-sm leading-6 text-slate-600">
        Vui lòng sử dụng workspace phù hợp với vai trò được cấp cho tài khoản
        {user ? <> <strong className="text-slate-800">@{user.username}</strong></> : null}. Nếu cần thêm quyền, hãy liên hệ quản trị viên.
      </p>
      <div className="mt-6 grid gap-2.5">
        <Link to="/" className={buttonVariants({ size: 'large', className: 'w-full gap-2' })}>
          <House size={18} aria-hidden="true" /> Về trang làm việc của tôi
        </Link>
      </div>
    </SessionScreen>
  );

  return <Outlet />;
}
