import { Link, Navigate, Outlet, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui';
import { restoreSession } from '@/lib/api';
import { safeReturnTo } from '@/lib/authRedirect';
import { useAuthStore } from '@/stores/authStore';

export function ProtectedRoute({ roles }: { roles: string[] }) {
  const { status, user, error, expired } = useAuthStore();
  const location = useLocation();
  if (status === 'restoring') return <p role="status" className="p-8 text-center">Đang khôi phục phiên đăng nhập...</p>;
  if (status === 'error') return <main className="mx-auto max-w-lg space-y-4 p-8">
    <h1 className="text-xl font-bold">Chưa thể xác minh phiên đăng nhập</h1>
    <p role="alert">{error}</p>
    <Button onClick={() => void restoreSession()}>Thử lại</Button>
    <Link to="/" className="block underline">Về trang chủ</Link>
  </main>;
  if (status === 'anonymous') {
    const returnTo = safeReturnTo(location.pathname + location.search + location.hash);
    return <Navigate to={'/dang-nhap?returnTo=' + encodeURIComponent(returnTo) + (expired ? '&reason=session-expired' : '')} replace />;
  }
  if (!user?.roles.some(role => roles.includes(role))) return <main className="mx-auto max-w-lg space-y-4 p-8">
    <h1 className="text-xl font-bold">Bạn không có quyền truy cập trang này</h1>
    <p>Vui lòng sử dụng workspace phù hợp với vai trò được cấp cho tài khoản.</p>
    <Link to="/" className="block underline">Về trang chủ</Link>
  </main>;
  return <Outlet />;
}
