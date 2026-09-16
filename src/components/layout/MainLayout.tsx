import * as Dialog from '@radix-ui/react-dialog';
import { Link, Outlet } from 'react-router-dom';
import {
  PersonArmsSpread as Accessibility,
  Buildings as Landmark,
  CaretRight as ChevronRight,
  Headset as Headphones,
  List as Menu,
  MagnifyingGlass as Search,
  Question as CircleHelp,
  ShieldCheck,
  UserCircle as UserRound,
  X,
} from '@phosphor-icons/react';
import { buttonVariants } from '@/components/ui/Button';

const navigation = [
  { href: '#trang-chu', label: 'Trang chủ' },
  { href: '#thu-tuc', label: 'Thủ tục hành chính' },
  { href: '#quy-trinh', label: 'Hướng dẫn thực hiện' },
  { href: '#tien-ich', label: 'Tiện ích' },
  { href: '#hoi-dap', label: 'Hỏi đáp' },
];

export function MainLayout() {
  return (
    <div className="min-h-screen bg-white">
      <a href="#main" className="skip-link">Đến nội dung chính</a>

      <div className="h-1 bg-gradient-to-r from-red-900 via-red-700 to-gold-500" />
      <div className="bg-red-950 text-red-50">
        <div className="mx-auto flex min-h-10 max-w-[1240px] items-center justify-between gap-4 px-5 text-xs sm:px-8">
          <p className="flex items-center gap-2 leading-5">
            <ShieldCheck size={15} aria-hidden="true" />
            Hỗ trợ chuẩn bị và tiền kiểm hồ sơ hành chính cấp xã, phường
          </p>
          <div className="hidden items-center gap-5 md:flex">
            <a href="#hoi-dap" className="utility-link"><CircleHelp size={15} aria-hidden="true" /> Hướng dẫn</a>
            <button type="button" className="utility-link"><Accessibility size={15} aria-hidden="true" /> Hỗ trợ tiếp cận</button>
          </div>
        </div>
      </div>

      <header className="sticky top-0 z-50 border-b border-red-100 bg-white/95 shadow-[0_3px_18px_rgba(70,16,20,.06)] backdrop-blur-lg">
        <div className="mx-auto flex h-[82px] max-w-[1240px] items-center justify-between gap-6 px-5 sm:px-8">
          <Link to="/" className="flex min-w-0 items-center gap-3" aria-label="Cổng hỗ trợ hành chính - Trang chủ">
            <span className="brand-mark"><Landmark size={25} strokeWidth={1.8} aria-hidden="true" /></span>
            <span className="min-w-0">
              <strong className="block truncate font-serif text-xl font-bold uppercase tracking-[0.03em] text-red-900 sm:text-[1.4rem]">Cổng hỗ trợ hành chính</strong>
              <span className="mt-1 block text-[10px] font-bold uppercase tracking-[0.18em] text-gold-700">Cấp xã, phường · Phục vụ người dân</span>
            </span>
          </Link>

          <div className="hidden items-center gap-2 lg:flex">
            <a href="#thu-tuc" className="header-icon-link" aria-label="Tra cứu thủ tục"><Search size={19} aria-hidden="true" /></a>
            <Link to="/dang-nhap" className={buttonVariants({ variant: 'outline' })}><UserRound size={18} aria-hidden="true" /> Đăng nhập</Link>
          </div>

          <Dialog.Root>
            <Dialog.Trigger asChild>
              <button type="button" className="mobile-menu-button lg:hidden" aria-label="Mở menu"><Menu size={24} aria-hidden="true" /></button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-[70] bg-slate-950/50 data-[state=open]:animate-in" />
              <Dialog.Content className="fixed right-0 top-0 z-[80] flex h-dvh w-[min(90vw,380px)] flex-col rounded-l-3xl bg-white p-6 shadow-2xl focus:outline-none">
                <div className="flex items-center justify-between border-b border-slate-200 pb-5">
                  <Dialog.Title className="font-serif text-xl font-bold text-red-900">Danh mục</Dialog.Title>
                  <Dialog.Close asChild><button type="button" className="mobile-menu-button" aria-label="Đóng menu"><X size={22} aria-hidden="true" /></button></Dialog.Close>
                </div>
                <nav aria-label="Điều hướng trên điện thoại" className="mt-5 grid">
                  {navigation.map((item) => (
                    <Dialog.Close asChild key={item.href}>
                      <a href={item.href} className="mobile-nav-link">{item.label}<ChevronRight size={18} aria-hidden="true" /></a>
                    </Dialog.Close>
                  ))}
                </nav>
                <Dialog.Close asChild><Link to="/dang-nhap" className={buttonVariants({ className: 'mt-8 w-full' })}><UserRound size={18} aria-hidden="true" /> Đăng nhập</Link></Dialog.Close>
                <p className="mt-auto flex items-start gap-2 border-t border-slate-200 pt-5 text-sm leading-6 text-slate-500"><Headphones className="mt-0.5" size={18} aria-hidden="true" /> Thông tin hỗ trợ sẽ được cập nhật sau khi xác minh.</p>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>

        <nav aria-label="Điều hướng chính" className="hidden border-t border-red-100 bg-red-800 text-white lg:block">
          <div className="mx-auto flex max-w-[1240px] items-center px-8">
            {navigation.map((item, index) => <a key={item.href} href={item.href} className={`main-nav-link ${index === 0 ? 'is-active' : ''}`}>{item.label}</a>)}
            <a href="#thu-tuc" className="ml-auto flex min-h-12 items-center gap-2 border-x border-white/15 px-5 text-sm font-semibold hover:bg-red-900"><Search size={17} aria-hidden="true" /> Tra cứu nhanh</a>
          </div>
        </nav>
      </header>

      <main id="main" tabIndex={-1}><Outlet /></main>

      <footer className="bg-[#26090d] text-red-100">
        <div className="mx-auto grid max-w-[1240px] gap-10 px-5 py-12 sm:px-8 md:grid-cols-[1.5fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-full border border-gold-500/50 bg-red-900 text-gold-400"><Landmark size={22} aria-hidden="true" /></span><strong className="font-serif text-xl uppercase text-white">Cổng hỗ trợ hành chính</strong></div>
            <p className="mt-5 max-w-lg text-sm leading-7 text-red-100/65">Đồng hành cùng người dân trong quá trình tra cứu, chuẩn bị và tiền kiểm hồ sơ trước khi đến cơ quan tiếp nhận.</p>
          </div>
          <div><h2 className="font-bold text-white">Liên kết</h2><ul className="mt-4 space-y-2 text-sm text-red-100/65"><li><a className="footer-link" href="#thu-tuc">Tra cứu thủ tục</a></li><li><a className="footer-link" href="#quy-trinh">Hướng dẫn thực hiện</a></li><li><a className="footer-link" href="#hoi-dap">Câu hỏi thường gặp</a></li></ul></div>
          <div><h2 className="font-bold text-white">Phạm vi dịch vụ</h2><p className="mt-4 text-sm leading-7 text-red-100/65">Hệ thống hỗ trợ tiền kiểm. Hồ sơ chính thức được tiếp nhận tại cơ quan có thẩm quyền.</p></div>
        </div>
        <div className="border-t border-white/10"><div className="mx-auto flex max-w-[1240px] flex-wrap justify-between gap-3 px-5 py-5 text-xs text-red-100/45 sm:px-8"><span>© 2026 Cổng hỗ trợ hành chính</span></div></div>
      </footer>
    </div>
  );
}
