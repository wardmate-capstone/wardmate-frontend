import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * L-02: mỗi trang có <title> riêng (tab trình duyệt, lịch sử, trình đọc màn hình), kể cả trang 404.
 * Chỉ dựa vào đường dẫn; trang chi tiết thủ tục dùng tên chung vì tên thủ tục tải sau.
 */
const BASE_TITLE = 'WardMate';
const exactTitles: Record<string, string> = {
  '/': 'Cổng Dịch vụ Tiền kiểm Hồ sơ Hành chính Cấp Xã/Phường',
  '/dang-nhap': 'Đăng nhập',
  '/dang-ky': 'Đăng ký tài khoản',
  '/quen-mat-khau': 'Quên mật khẩu',
  '/dat-lai-mat-khau': 'Đặt lại mật khẩu',
  '/hoi-dap': 'Hỏi đáp',
  '/huong-dan': 'Hướng dẫn thực hiện',
  '/thu-tuc': 'Thủ tục hành chính',
  '/admin': 'Quản trị hệ thống',
};
const prefixTitles: [RegExp, string][] = [
  [/^\/(citizen|cong-dan)(\/|$)/, 'Cổng công dân'],
  [/^\/(officer|can-bo)(\/|$)/, 'Cán bộ Một cửa'],
  [/^\/(manager|quan-ly)(\/|$)/, 'Quản lý điều hành'],
  [/^\/(procedure-manager|quan-ly-thu-tuc)(\/|$)/, 'Quản lý thủ tục'],
  [/^\/(thu-tuc|thu-tuc-hanh-chinh)\/[^/]+\/?$/, 'Chi tiết thủ tục'],
];

function routeTitle(pathname: string): string {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  const page = exactTitles[path] ?? prefixTitles.find(([pattern]) => pattern.test(path))?.[1] ?? 'Không tìm thấy trang';
  return path === '/' ? `${BASE_TITLE} — ${page}` : `${page} | ${BASE_TITLE}`;
}

export function RouteTitle() {
  const { pathname } = useLocation();
  useEffect(() => {
    document.title = routeTitle(pathname);
  }, [pathname]);
  return null;
}
