import * as Dialog from '@radix-ui/react-dialog';
import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import {
  BookOpen,
  CaretRight as ChevronRight,
  ChatsTeardrop,
  CheckCircle,
  Clock,
  Files,
  Headset as Headphones,
  House,
  List as Menu,
  Question as CircleHelp,
  ShieldCheck,
  UserCircle as UserRound,
  X,
} from '@phosphor-icons/react';
import { BrandMark } from '@/components/brand/BrandMark';
import { BrandWordmark } from '@/components/brand/BrandWordmark';
import { buttonVariants } from '@/components/ui/Button';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { UserDropdown } from '@/components/layout/UserDropdown';
import { useAuthState } from '@/hooks/useAuthState';
import { useAuthStore } from '@/stores/authStore';
import { getManagementHome } from '@/lib/authRedirect';

const navigation = [
  { href: '/', label: 'Trang chủ', icon: House },
  { href: '/thu-tuc', label: 'Thủ tục hành chính', icon: Files },
  { href: '/huong-dan', label: 'Hướng dẫn thực hiện', icon: BookOpen },
  { href: '/hoi-dap', label: 'Hỏi đáp', icon: ChatsTeardrop },
];

export function MainLayout() {
  const location = useLocation();
  const { isAuthenticated } = useAuthState();
  const user = useAuthStore((state) => state.user);
  const logoTarget = getManagementHome(user?.roles, user?.permissions) ?? '/';
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const hideFooter = ['/quen-mat-khau', '/dat-lai-mat-khau'].includes(location.pathname);

  return (
    <div className="min-h-screen bg-white">
      <a href="#main" className="skip-link">Đến nội dung chính</a>

      {/* Dải gradient quốc gia trang trọng */}
      <div className="h-1 bg-gradient-to-r from-red-950 via-red-700 to-amber-500" />

      {/* Thanh tiện ích cổng thông tin quốc gia */}
      <div className="border-b border-red-900/40 bg-[#3b0d10] text-red-50">
        <div className="mx-auto flex min-h-10 max-w-[1240px] items-center justify-between gap-4 px-5 text-xs sm:px-8">
          <p className="flex items-center gap-2 font-medium leading-5">
            <ShieldCheck size={16} weight="fill" className="text-amber-400 shrink-0" aria-hidden="true" />
            <span>Hỗ trợ chuẩn bị và tiền kiểm thủ tục hành chính cấp xã - phường</span>
          </p>
          <div className="hidden items-center gap-5 md:flex">
            <span className="flex items-center gap-1.5 text-red-200/75">
              <Clock size={13} aria-hidden="true" />
              <span>Thứ 2 - Thứ 6: 07:30 - 17:00</span>
            </span>
            <span className="text-red-800/80" aria-hidden="true">|</span>
            <Link to="/hoi-dap" className="utility-link transition-colors hover:text-amber-300">
              <CircleHelp size={15} aria-hidden="true" /> Hướng dẫn & Trợ giúp
            </Link>
          </div>
        </div>
      </div>

      {/* Header chính: Thương hiệu và Tiện ích người dùng */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/98 shadow-[0_4px_20px_-4px_rgba(60,15,20,0.06)] backdrop-blur-md">
        <div className="mx-auto flex h-[82px] max-w-[1240px] items-center justify-between gap-4 px-5 sm:px-8">
          <div className="flex min-w-0 items-center gap-4">
            <Link to={logoTarget} className="group flex min-w-0 items-center gap-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 rounded-xl" aria-label="WardMate - Trang chủ">
              <BrandMark className="brand-mark transition-transform duration-200 group-hover:scale-105" size={54} />
              <BrandWordmark subtitle="Dịch vụ công xã - phường" />
            </Link>
            <div className="hidden xl:flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50/70 px-3 py-1 text-[11px] font-semibold text-amber-900 shadow-2xs">
              <CheckCircle size={14} weight="fill" className="text-amber-600" />
              <span>Cổng tiền kiểm điện tử</span>
            </div>
          </div>

          <div className="hidden items-center gap-3.5 lg:flex">
            <NotificationBell />
            {isAuthenticated ? (
              <UserDropdown />
            ) : (
              <Link to="/dang-nhap" className={buttonVariants({ variant: 'primary', className: 'rounded-xl bg-red-800 font-semibold text-white hover:bg-red-900 shadow-xs' })}>
                <UserRound size={18} aria-hidden="true" /> Đăng nhập
              </Link>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-2 lg:hidden">
            <NotificationBell isMobileDrawer />
            <Dialog.Root open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <Dialog.Trigger asChild><button type="button" className="mobile-menu-button" aria-label="Mở menu"><Menu size={24} aria-hidden="true" /></button></Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-[70] bg-slate-950/50 backdrop-blur-xs data-[state=open]:animate-in" />
                <Dialog.Content aria-describedby={undefined} className="fixed right-0 top-0 z-[80] flex h-dvh w-[min(90vw,380px)] flex-col overflow-y-auto rounded-l-3xl bg-white p-6 shadow-2xl focus:outline-none">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-5">
                    <Dialog.Title className="text-xl font-bold text-red-950">Danh mục</Dialog.Title>
                    <Dialog.Close asChild><button type="button" className="mobile-menu-button" aria-label="Đóng menu"><X size={22} aria-hidden="true" /></button></Dialog.Close>
                  </div>
                  <nav aria-label="Điều hướng trên điện thoại" className="mt-5 grid space-y-1">
                    {navigation.map((item) => {
                      const Icon = item.icon;
                      const isActive = item.href.startsWith('/#') ? false : (location.pathname === item.href || (item.href === '/thu-tuc' && location.pathname.startsWith('/thu-tuc/')));
                      return (
                        <Dialog.Close asChild key={item.href}>
                          <Link to={item.href} className={`mobile-nav-link flex items-center justify-between rounded-xl px-3 py-3.5 transition-colors ${isActive ? 'bg-red-50 text-red-900 font-bold' : 'text-slate-800 hover:bg-slate-50'}`}>
                            <span className="flex items-center gap-3">
                              <Icon size={20} className={isActive ? 'text-red-800' : 'text-slate-500'} aria-hidden="true" />
                              <span>{item.label}</span>
                            </span>
                            <ChevronRight size={18} className="text-slate-400" aria-hidden="true" />
                          </Link>
                        </Dialog.Close>
                      );
                    })}
                  </nav>
                  {isAuthenticated ? (
                    <UserDropdown isMobileDrawer onItemClick={() => setMobileMenuOpen(false)} />
                  ) : (
                    <Dialog.Close asChild>
                      <Link to="/dang-nhap" className={buttonVariants({ className: 'mt-8 w-full rounded-xl bg-red-800 hover:bg-red-900 text-white font-semibold shadow-sm' })}>
                        <UserRound size={18} aria-hidden="true" /> Đăng nhập
                      </Link>
                    </Dialog.Close>
                  )}
                  <div className="mt-auto border-t border-slate-200 pt-5">
                    <p className="flex items-start gap-2 text-xs leading-5 text-slate-500">
                      <Headphones className="mt-0.5 shrink-0 text-red-800" size={17} aria-hidden="true" />
                      <span>Hệ thống hỗ trợ trực tuyến chuẩn bị hồ sơ hành chính cấp xã - phường.</span>
                    </p>
                  </div>
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
          </div>
        </div>

        {/* Thanh Menu điều hướng chính: Sang trọng, uy tín, căn giữa hoàn hảo */}
        <nav aria-label="Điều hướng chính" className="hidden border-t border-red-800 bg-red-800 text-white shadow-md lg:block">
          <div className="mx-auto flex max-w-[1240px] items-center justify-center px-8">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = item.href.startsWith('/#') ? false : (location.pathname === item.href || (item.href === '/thu-tuc' && location.pathname.startsWith('/thu-tuc/')));
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={`main-nav-link ${isActive ? 'is-active' : ''}`}
                >
                  <Icon size={17} weight={isActive ? 'bold' : 'regular'} className={isActive ? 'text-amber-300' : 'text-white/70'} aria-hidden="true" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </header>

      <main id="main" tabIndex={-1}><Outlet /></main>

      {!hideFooter && (
        <footer className="bg-red-950 text-red-100">
          <div className="mx-auto grid max-w-[1240px] gap-10 px-5 py-12 sm:px-8 md:grid-cols-[1.5fr_1fr_1fr]">
            <div><div className="flex items-center gap-3"><BrandMark className="footer-brand-mark" size={46} /><BrandWordmark subtitle="Chuẩn bị đúng · Giảm đi lại" inverse /></div><p className="mt-5 max-w-lg text-sm leading-7 text-red-100/65">Đồng hành cùng người dân trong quá trình tra cứu, chuẩn bị và tiền kiểm hồ sơ trước khi đến cơ quan tiếp nhận.</p></div>
            <div><h2 className="font-bold text-white">Liên kết</h2><ul className="mt-4 space-y-2 text-sm text-red-100/65"><li><Link className="footer-link" to="/thu-tuc">Tra cứu thủ tục</Link></li><li><Link className="footer-link" to="/huong-dan">Hướng dẫn thực hiện</Link></li><li><Link className="footer-link" to="/hoi-dap">Câu hỏi thường gặp</Link></li><li><Link className="footer-link" to="/officer">Cổng Cán bộ Một cửa</Link></li></ul></div>
            <div><h2 className="font-bold text-white">Phạm vi dịch vụ</h2><p className="mt-4 text-sm leading-7 text-red-100/65">Hệ thống hỗ trợ tiền kiểm. Hồ sơ chính thức được tiếp nhận tại cơ quan có thẩm quyền.</p></div>
          </div>
          <div className="border-t border-white/10"><div className="mx-auto flex max-w-[1240px] flex-wrap justify-between gap-3 px-5 py-5 text-xs text-red-100/45 sm:px-8"><span>© 2026 WardMate</span></div></div>
        </footer>
      )}
    </div>
  );
}
