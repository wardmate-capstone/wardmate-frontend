import * as Dialog from '@radix-ui/react-dialog';
import { Link, Outlet, useLocation } from 'react-router-dom';
import {
  CaretRight as ChevronRight,
  Headset as Headphones,
  List as Menu,
  Question as CircleHelp,
  ShieldCheck,
  UserCircle as UserRound,
  X,
} from '@phosphor-icons/react';
import { BrandMark } from '@/components/brand/BrandMark';
import { BrandWordmark } from '@/components/brand/BrandWordmark';
import { buttonVariants } from '@/components/ui/Button';

const navigation = [
  { href: '/', label: 'Trang chủ' },
  { href: '/thu-tuc', label: 'Thủ tục hành chính' },
  { href: '/#quy-trinh', label: 'Hướng dẫn thực hiện' },
  { href: '/hoi-dap', label: 'Hỏi đáp' },
];

export function MainLayout() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-white">
      <a href="#main" className="skip-link">Đến nội dung chính</a>

      <div className="h-1 bg-gradient-to-r from-red-900 via-red-700 to-gold-500" />
      <div className="bg-red-950 text-red-50">
        <div className="mx-auto flex min-h-10 max-w-[1240px] items-center justify-between gap-4 px-5 text-xs sm:px-8">
          <p className="flex items-center gap-2 leading-5"><ShieldCheck size={15} aria-hidden="true" /> Hỗ trợ chuẩn bị và tiền kiểm hồ sơ hành chính cấp xã, phường</p>
          <div className="hidden items-center gap-5 md:flex">
            <Link to="/hoi-dap" className="utility-link"><CircleHelp size={15} aria-hidden="true" /> Hướng dẫn & Trợ giúp</Link>
          </div>
        </div>
      </div>

      <header className="sticky top-0 z-50 border-b border-red-100 bg-white/95 shadow-[0_3px_18px_rgba(70,16,20,.06)] backdrop-blur-lg">
        <div className="mx-auto flex h-[82px] max-w-[1240px] items-center justify-between gap-6 px-5 sm:px-8">
          <Link to="/" className="flex min-w-0 items-center gap-3" aria-label="WardMate - Trang chủ">
            <BrandMark className="brand-mark" />
            <BrandWordmark subtitle="Hỗ trợ hồ sơ cấp xã, phường" />
          </Link>
          <div className="hidden items-center gap-2 lg:flex">
            <Link to="/dang-nhap" className={buttonVariants({ variant: 'outline' })}><UserRound size={18} aria-hidden="true" /> Đăng nhập</Link>
          </div>

          <Dialog.Root>
            <Dialog.Trigger asChild><button type="button" className="mobile-menu-button lg:hidden" aria-label="Mở menu"><Menu size={24} aria-hidden="true" /></button></Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-[70] bg-slate-950/50 data-[state=open]:animate-in" />
              <Dialog.Content className="fixed right-0 top-0 z-[80] flex h-dvh w-[min(90vw,380px)] flex-col rounded-l-3xl bg-white p-6 shadow-2xl focus:outline-none">
                <div className="flex items-center justify-between border-b border-slate-200 pb-5">
                  <Dialog.Title className="text-xl font-bold text-red-900">Danh mục</Dialog.Title>
                  <Dialog.Close asChild><button type="button" className="mobile-menu-button" aria-label="Đóng menu"><X size={22} aria-hidden="true" /></button></Dialog.Close>
                </div>
                <nav aria-label="Điều hướng trên điện thoại" className="mt-5 grid">
                  {navigation.map((item) => <Dialog.Close asChild key={item.href}><Link to={item.href} className="mobile-nav-link">{item.label}<ChevronRight size={18} aria-hidden="true" /></Link></Dialog.Close>)}
                </nav>
                <Dialog.Close asChild><Link to="/dang-nhap" className={buttonVariants({ className: 'mt-8 w-full' })}><UserRound size={18} aria-hidden="true" /> Đăng nhập</Link></Dialog.Close>
                <p className="mt-auto flex items-start gap-2 border-t border-slate-200 pt-5 text-sm leading-6 text-slate-500"><Headphones className="mt-0.5" size={18} aria-hidden="true" /> Thông tin hỗ trợ sẽ được cập nhật sau khi xác minh.</p>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>

        <nav aria-label="Điều hướng chính" className="hidden border-t border-red-100 bg-red-800 text-white lg:block">
          <div className="mx-auto flex max-w-[1240px] items-center px-8">
            {navigation.map((item) => {
              const isActive = item.href.startsWith('/#') ? false : (location.pathname === item.href || (item.href === '/thu-tuc' && location.pathname.startsWith('/thu-tuc/')));
              return <Link key={item.href} to={item.href} className={`main-nav-link ${isActive ? 'is-active' : ''}`}>{item.label}</Link>;
            })}
          </div>
        </nav>
      </header>

      <main id="main" tabIndex={-1}><Outlet /></main>

      <footer className="bg-red-950 text-red-100">
        <div className="mx-auto grid max-w-[1240px] gap-10 px-5 py-12 sm:px-8 md:grid-cols-[1.5fr_1fr_1fr]">
          <div><div className="flex items-center gap-3"><BrandMark className="footer-brand-mark" size={46} /><BrandWordmark subtitle="Chuẩn bị đúng · Giảm đi lại" inverse /></div><p className="mt-5 max-w-lg text-sm leading-7 text-red-100/65">Đồng hành cùng người dân trong quá trình tra cứu, chuẩn bị và tiền kiểm hồ sơ trước khi đến cơ quan tiếp nhận.</p></div>
          <div><h2 className="font-bold text-white">Liên kết</h2><ul className="mt-4 space-y-2 text-sm text-red-100/65"><li><Link className="footer-link" to="/thu-tuc">Tra cứu thủ tục</Link></li><li><Link className="footer-link" to="/#quy-trinh">Hướng dẫn thực hiện</Link></li><li><Link className="footer-link" to="/hoi-dap">Câu hỏi thường gặp</Link></li><li><Link className="footer-link" to="/officer">Cổng Cán bộ Một cửa</Link></li></ul></div>
          <div><h2 className="font-bold text-white">Phạm vi dịch vụ</h2><p className="mt-4 text-sm leading-7 text-red-100/65">Hệ thống hỗ trợ tiền kiểm. Hồ sơ chính thức được tiếp nhận tại cơ quan có thẩm quyền.</p></div>
        </div>
        <div className="border-t border-white/10"><div className="mx-auto flex max-w-[1240px] flex-wrap justify-between gap-3 px-5 py-5 text-xs text-red-100/45 sm:px-8"><span>© 2026 WardMate</span></div></div>
      </footer>
    </div>
  );
}
