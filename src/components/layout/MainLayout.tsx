import * as Dialog from '@radix-ui/react-dialog';
import { Link, Outlet, useLocation } from 'react-router-dom';
import {
  Bars3Icon,
  XMarkIcon,
  UserCircleIcon,
  QuestionMarkCircleIcon,
  ShieldCheckIcon,
  ChevronRightIcon,
  LifebuoyIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
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
    <div className="flex min-h-screen flex-col bg-[#F8F7F4] text-[#1F2937]">
      <a href="#main" className="skip-link">
        Đến nội dung chính
      </a>

      {/* Top Gold-Red Ribbon */}
      <div className="h-1 bg-gradient-to-r from-[#8F1515] via-[#B91C1C] to-[#D4A017]" aria-hidden="true" />

      {/* Top Utility Bar (Phong cách Cổng Thông tin Chính phủ) */}
      <nav aria-label="Tiện ích hỗ trợ và ngôn ngữ" className="bg-[#8F1515] text-white">
        <div className="mx-auto flex min-h-10 max-w-[1240px] items-center justify-between gap-4 px-5 text-xs sm:px-8">
          <p className="flex items-center gap-2 font-medium text-red-100">
            <ShieldCheckIcon className="size-4 shrink-0 text-[#F5D76E]" aria-hidden="true" />
            <span>Hệ thống Hỗ trợ Chuẩn bị và Tiền kiểm Hồ sơ Hành chính Cấp Xã/Phường</span>
          </p>

          <div className="hidden items-center gap-5 md:flex">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 text-red-100/80 transition-colors hover:text-white"
              title="Chế độ tiếp cận hỗ trợ người già và thị lực kém"
            >
              <EyeIcon className="size-3.5 text-[#F5D76E]" aria-hidden="true" />
              <span>Tiếp cận (A11y)</span>
            </button>
            <span className="text-white/30" aria-hidden="true">|</span>
            <Link
              to="/hoi-dap"
              className="inline-flex items-center gap-1.5 text-red-100/80 transition-colors hover:text-white"
            >
              <QuestionMarkCircleIcon className="size-3.5 text-[#F5D76E]" aria-hidden="true" />
              <span>Hướng dẫn & Hỏi đáp</span>
            </Link>
            <span className="text-white/30" aria-hidden="true">|</span>
            <span className="font-semibold text-[#F5D76E]">Tiếng Việt</span>
          </div>
        </div>
      </nav>

      {/* Government Masthead & Main Navigation Container */}
      <header role="banner" className="sticky top-0 z-50 bg-white/98 shadow-sm backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-[1240px] items-center justify-between gap-6 px-5 sm:px-8">
          {/* Official Emblem & Portal Brand */}
          <Link to="/" className="flex min-w-0 items-center gap-3.5" aria-label="WardMate - Trang chủ">
            <BrandMark className="brand-mark" />
            <BrandWordmark subtitle="Cổng Hỗ trợ Hồ sơ Cấp Xã, Phường" />
          </Link>

          {/* Desktop User CTA */}
          <div className="hidden items-center gap-3 lg:flex">
            <Link
              to="/dang-nhap"
              className={buttonVariants({
                variant: 'outline',
                className: 'border-[#E5E7EB] text-[#8F1515] hover:border-[#B91C1C] hover:bg-red-50',
              })}
            >
              <UserCircleIcon className="size-5 text-[#8F1515]" aria-hidden="true" />
              <span>Đăng nhập</span>
            </Link>
          </div>

          {/* Mobile Menu Trigger */}
          <Dialog.Root>
            <Dialog.Trigger asChild>
              <button
                type="button"
                className="mobile-menu-button lg:hidden"
                aria-label="Mở menu"
              >
                <Bars3Icon className="size-6 text-[#8F1515]" aria-hidden="true" />
              </button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-[70] bg-slate-950/60 data-[state=open]:animate-in" />
              <Dialog.Content className="fixed right-0 top-0 z-[80] flex h-dvh w-[min(90vw,380px)] flex-col rounded-l-3xl bg-white p-6 shadow-2xl focus:outline-none">
                <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-5">
                  <Dialog.Title className="text-lg font-bold text-[#8F1515]">
                    Danh mục dịch vụ
                  </Dialog.Title>
                  <Dialog.Close asChild>
                    <button
                      type="button"
                      className="mobile-menu-button"
                      aria-label="Đóng menu"
                    >
                      <XMarkIcon className="size-6 text-[#8F1515]" aria-hidden="true" />
                    </button>
                  </Dialog.Close>
                </div>

                <nav aria-label="Điều hướng trên điện thoại" className="mt-5 grid">
                  {navigation.map((item) => (
                    <Dialog.Close asChild key={item.href}>
                      <Link to={item.href} className="mobile-nav-link">
                        <span>{item.label}</span>
                        <ChevronRightIcon className="size-4 text-slate-400" aria-hidden="true" />
                      </Link>
                    </Dialog.Close>
                  ))}
                </nav>

                <Dialog.Close asChild>
                  <Link
                    to="/dang-nhap"
                    className={buttonVariants({
                      className: 'mt-8 w-full bg-[#B91C1C] text-white hover:bg-[#8F1515]',
                    })}
                  >
                    <UserCircleIcon className="size-5" aria-hidden="true" />
                    <span>Đăng nhập</span>
                  </Link>
                </Dialog.Close>

                <aside className="mt-auto flex items-start gap-2 border-t border-[#E5E7EB] pt-5 text-xs leading-5 text-slate-500">
                  <LifebuoyIcon className="size-4 shrink-0 text-[#B91C1C]" aria-hidden="true" />
                  <p>Hệ thống tiền kiểm hồ sơ trước khi tới cơ quan nhà nước tiếp nhận chính thức.</p>
                </aside>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>

        {/* Primary Navigation Bar (Thanh điều hướng đỏ sẫm viền chỉ vàng) */}
        <nav
          aria-label="Điều hướng chính"
          className="hidden border-b-2 border-[#D4A017] bg-[#8F1515] text-white shadow-sm lg:block"
        >
          <div className="mx-auto flex max-w-[1240px] items-center px-8">
            {navigation.map((item) => {
              const isActive = item.href.startsWith('/#')
                ? false
                : location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`main-nav-link ${isActive ? 'is-active' : ''}`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      </header>

      {/* Main Content Landmark */}
      <main id="main" tabIndex={-1} className="flex-1 focus:outline-none">
        <Outlet />
      </main>

      {/* Official Government Portal Footer */}
      <footer role="contentinfo" className="border-t-4 border-[#D4A017] bg-[#570c0c] text-red-100">
        <div className="mx-auto grid max-w-[1240px] gap-10 px-5 py-12 sm:px-8 md:grid-cols-[1.5fr_1fr_1fr]">
          <section aria-labelledby="footer-about">
            <div className="flex items-center gap-3">
              <BrandMark className="footer-brand-mark" size={46} />
              <BrandWordmark subtitle="Chuẩn bị đúng · Giảm đi lại" inverse />
            </div>
            <p id="footer-about" className="mt-4 max-w-md text-sm leading-7 text-red-100/75">
              Cổng dịch vụ số hỗ trợ công dân tra cứu, hoàn thiện hồ sơ biểu mẫu và nhận góp ý tiền kiểm từ cán bộ Một cửa trước khi nộp chính thức tại UBND cấp xã, phường.
            </p>
          </section>

          <nav aria-label="Liên kết chân trang">
            <h2 className="text-base font-bold text-[#F5D76E]">Liên kết dịch vụ</h2>
            <ul className="mt-4 space-y-2.5 text-sm text-red-100/80">
              <li>
                <Link className="footer-link" to="/thu-tuc">
                  Tra cứu thủ tục
                </Link>
              </li>
              <li>
                <Link className="footer-link" to="/#quy-trinh">
                  Hướng dẫn thực hiện
                </Link>
              </li>
              <li>
                <Link className="footer-link" to="/hoi-dap">
                  Câu hỏi thường gặp
                </Link>
              </li>
            </ul>
          </nav>

          <section aria-labelledby="footer-scope">
            <h2 id="footer-scope" className="text-base font-bold text-[#F5D76E]">Phạm vi nghiệp vụ</h2>
            <p className="mt-4 text-sm leading-7 text-red-100/75">
              Hệ thống chỉ phục vụ chuẩn bị và tiền kiểm hồ sơ. Việc tiếp nhận và giải quyết chính thức chỉ thực hiện tại cơ quan có thẩm quyền theo quy định pháp luật.
            </p>
          </section>
        </div>

        <div className="border-t border-white/10 bg-[#410909]">
          <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-4 px-5 py-5 text-xs text-red-100/60 sm:px-8">
            <address className="not-italic">
              © 2026 WardMate — Cổng Hỗ trợ Chuẩn bị & Tiền kiểm Hồ sơ Hành chính Cấp Xã/Phường
            </address>
            <p className="text-[#F5D76E]/80">Tuân thủ chuẩn tiếp cận WCAG 2.2 AA</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
