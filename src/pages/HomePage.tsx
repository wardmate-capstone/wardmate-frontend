import { FormEvent, useMemo, useState } from 'react';
import { m } from 'motion/react';
import { toast } from 'sonner';
import {
  MagnifyingGlassIcon,
  ArrowRightIcon,
  ChevronDownIcon,
  DocumentMagnifyingGlassIcon,
  BuildingLibraryIcon,
  InformationCircleIcon,
  CalendarDaysIcon,
  UserIcon,
  BuildingOffice2Icon,
  MicrophoneIcon,
  XMarkIcon,
  StarIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { JourneySteps } from '@/components/home/JourneySteps';
import { popularProcedures, serviceGroups, faq } from '@/data/landing';

function normalizeVietnamese(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
}

const reveal = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.15 },
  transition: { duration: 0.45 },
};

export function HomePage() {
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'citizen' | 'business'>('citizen');

  const searchResults = useMemo(() => {
    if (!submittedQuery) return popularProcedures;
    const normalized = normalizeVietnamese(submittedQuery);
    return popularProcedures.filter((item) =>
      normalizeVietnamese(`${item.title} ${item.category}`).includes(normalized)
    );
  }, [submittedQuery]);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleaned = query.trim();
    if (!cleaned) {
      toast.warning('Vui lòng nhập tên thủ tục hoặc nhu cầu cần giải quyết.');
      return;
    }
    setSubmittedQuery(cleaned);
    document.querySelector('#ket-qua-tra-cuu')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function demoNotice(label: string) {
    toast.info(`${label} sẽ được kết nối ở màn hình chức năng tiếp theo.`);
  }

  return (
    <>
      {/* Hero & Central Search Section (Phần đầu trang phong cách Cổng Chính phủ hiện đại) */}
      <section
        id="trang-chu"
        aria-labelledby="hero-title"
        className="relative scroll-mt-28 overflow-hidden border-b border-[#E5E7EB] bg-gradient-to-r from-[#FFFDF9] via-[#FAF6EE] to-[#F5EEDC] py-12 sm:py-16 lg:py-20 text-[#1F2937]"
      >
        {/* Vietnamese Traditional Architecture (Khuê Văn Các) on the right side */}
        <div
          className="pointer-events-none absolute bottom-0 right-0 top-0 w-full select-none overflow-hidden sm:w-[58%] lg:w-[48%]"
          aria-hidden="true"
        >
          <img
            src="/hero-architecture-bg.jpg"
            alt=""
            role="presentation"
            className="size-full object-cover object-right opacity-25 mix-blend-multiply filter contrast-90 brightness-105"
          />
          {/* Subtle warm golden and cream overlays blending the landmark seamlessly into the background */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#FFFDF9] via-[#FFFDF9]/95 sm:via-[#FFFDF9]/85 lg:via-[#FFFDF9]/75 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#FAF6EE]/90 via-transparent to-[#FFFDF9]/70" />
          <div className="absolute inset-0 bg-[#F5D76E]/10 mix-blend-color" />
        </div>

        {/* Delicate national geometric texture */}
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(#D4A017_1px,transparent_1px)] [background-size:24px_24px] opacity-15"
          aria-hidden="true"
        ></div>

        <div className="relative z-10 mx-auto max-w-[1240px] px-5 sm:px-8">
          <m.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mx-auto max-w-[960px] text-center"
          >
            {/* National Emblem & Institutional Header */}
            <div className="flex flex-col items-center justify-center">
              <img
                src="/Quoc-Huy-Viet-Nam.webp"
                alt="Quốc huy nước Cộng hòa Xã hội Chủ nghĩa Việt Nam"
                className="size-20 sm:size-24 object-contain drop-shadow-[0_6px_16px_rgba(185,28,28,0.18)] transition-transform duration-300 hover:scale-105"
              />
              <p className="mt-3 text-xs sm:text-sm font-semibold tracking-widest text-[#8F1515] uppercase">
                Ủy ban Nhân dân Cấp Xã / Phường
              </p>
            </div>

            {/* Exactly one single <h1> per page with prominent Red Typography */}
            <h1
              id="hero-title"
              className="mt-2 text-3xl font-extrabold tracking-tight text-[#B91C1C] sm:text-4xl lg:text-5xl drop-shadow-2xs"
            >
              Chuẩn bị hồ sơ đúng ngay từ đầu
            </h1>

            <p className="mx-auto mt-2 max-w-2xl text-sm sm:text-base font-medium text-slate-600">
              The Official Administrative Pre-check Portal · Hướng dẫn biểu mẫu, tiền kiểm tài liệu trước khi đến cơ quan có thẩm quyền
            </p>

            {/* Main Central Wide Search Form (Semantic <search> + <form role="search">) */}
            <search className="mt-6 sm:mt-8">
              <form
                className="mx-auto max-w-[800px] rounded-2xl bg-white p-2 sm:p-2.5 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border-2 border-[#E5E7EB] hover:border-[#D4A017] focus-within:border-[#B91C1C] focus-within:ring-4 focus-within:ring-[#B91C1C]/15 transition-all duration-200"
                role="search"
                onSubmit={handleSearch}
              >
                <label
                  htmlFor="landing-search"
                  className="sr-only"
                >
                  Tra cứu thủ tục hành chính
                </label>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <div className="relative flex flex-1 items-center min-w-0">
                    <MagnifyingGlassIcon
                      className="absolute left-3.5 size-5 text-slate-400 pointer-events-none"
                      aria-hidden="true"
                    />
                    <input
                      id="landing-search"
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      className="w-full pl-11 pr-16 py-2.5 text-sm sm:text-base text-[#1F2937] placeholder:text-slate-400 bg-transparent focus:outline-none"
                      placeholder="Nhập tên thủ tục hoặc nhu cầu của bạn (VD: Khai sinh, Kết hôn...)"
                    />
                    <div className="absolute right-2 flex items-center gap-1 text-slate-400">
                      {query && (
                        <button
                          type="button"
                          onClick={() => setQuery('')}
                          className="p-1 hover:text-slate-600 rounded-full"
                          aria-label="Xóa từ khóa"
                        >
                          <XMarkIcon className="size-5" aria-hidden="true" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => demoNotice('Tính năng nhập bằng giọng nói')}
                        className="p-1 hover:text-[#B91C1C] rounded-full transition-colors"
                        title="Nhập bằng giọng nói"
                        aria-label="Nhập bằng giọng nói"
                      >
                        <MicrophoneIcon className="size-5" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                  <Button
                    type="submit"
                    variant="primary"
                    size="large"
                    className="w-full sm:w-auto bg-gradient-to-r from-[#B91C1C] to-[#8F1515] text-white hover:brightness-110 shadow-sm px-6 font-semibold shrink-0"
                  >
                    <span>Tìm kiếm</span>
                    <ArrowRightIcon className="size-4" aria-hidden="true" />
                  </Button>
                </div>
              </form>
            </search>

            {/* Hotwords / Gợi ý tìm kiếm phổ biến */}
            <nav aria-label="Gợi ý tra cứu" className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs sm:text-sm text-slate-600">
              <span className="font-semibold text-slate-700">Từ khóa phổ biến:</span>
              {['Khai sinh', 'Kết hôn', 'Chứng thực bản sao', 'Cư trú', 'Hộ kinh doanh', 'Đất đai'].map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  className="rounded-full bg-white/80 px-3 py-1 text-slate-700 hover:bg-[#B91C1C] hover:text-white border border-[#E5E7EB] hover:border-[#B91C1C] transition-colors shadow-2xs font-medium"
                  onClick={() => {
                    setQuery(suggestion);
                    setSubmittedQuery(suggestion);
                    setTimeout(() => {
                      document
                        .querySelector('#ket-qua-tra-cuu')
                        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }, 50);
                  }}
                >
                  {suggestion}
                </button>
              ))}
            </nav>

            {/* 3 Categories Columns matching Beijing municipal portal reference */}
            <div className="mt-10 grid grid-cols-1 gap-5 border-t border-[#E5E7EB]/80 pt-7 text-left md:grid-cols-3">
              {/* Column 1: Cá nhân */}
              <div className="min-w-0 rounded-2xl border border-[#E5E7EB] bg-white/80 p-5 shadow-2xs backdrop-blur-xs">
                <div className="mb-3.5 flex items-center gap-2 border-b-2 border-[#B91C1C] pb-2">
                  <UserIcon className="size-5 text-[#B91C1C]" aria-hidden="true" />
                  <h2 className="text-base font-bold text-[#1F2937]">Dịch vụ công dân</h2>
                </div>
                <ul className="grid grid-cols-1 gap-x-3 gap-y-2 text-sm min-[460px]:grid-cols-2">
                  {[
                    { name: 'Hộ tịch & Tư pháp', query: 'Hộ tịch' },
                    { name: 'Cư trú & Căn cước', query: 'Cư trú' },
                    { name: 'Việc làm & An sinh', query: 'An sinh' },
                    { name: 'Đất đai & Xây dựng', query: 'Đất đai' },
                    { name: 'Y tế & Giáo dục', query: 'Y tế' },
                    { name: 'Chứng thực bản sao', query: 'Chứng thực' },
                  ].map((item) => (
                    <li key={item.name} className="min-w-0">
                      <a
                        href="#thu-tuc"
                        onClick={(event) => {
                          event.preventDefault();
                          setQuery(item.query);
                          setSubmittedQuery(item.query);
                          setTimeout(() => {
                            document
                              .querySelector('#ket-qua-tra-cuu')
                              ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          }, 50);
                        }}
                        className="inline-block w-full truncate text-left text-slate-700 transition-colors hover:text-[#B91C1C] hover:underline"
                      >
                        {item.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Column 2: Doanh nghiệp */}
              <div className="min-w-0 rounded-2xl border border-[#E5E7EB] bg-white/80 p-5 shadow-2xs backdrop-blur-xs">
                <div className="mb-3.5 flex items-center gap-2 border-b-2 border-[#B91C1C] pb-2">
                  <BuildingOffice2Icon className="size-5 text-[#B91C1C]" aria-hidden="true" />
                  <h2 className="text-base font-bold text-[#1F2937]">Tổ chức & Doanh nghiệp</h2>
                </div>
                <ul className="grid grid-cols-1 gap-x-3 gap-y-2 text-sm min-[460px]:grid-cols-2">
                  {[
                    { name: 'Hộ kinh doanh', query: 'Hộ kinh doanh' },
                    { name: 'An toàn thực phẩm', query: 'An toàn thực phẩm' },
                    { name: 'Giấy phép xây dựng', query: 'Xây dựng' },
                    { name: 'Thuế & Lệ phí', query: 'Thuế' },
                    { name: 'Phòng cháy PCCC', query: 'Phòng cháy' },
                    { name: 'Môi trường đô thị', query: 'Môi trường' },
                  ].map((item) => (
                    <li key={item.name} className="min-w-0">
                      <a
                        href="#thu-tuc"
                        onClick={(event) => {
                          event.preventDefault();
                          setQuery(item.query);
                          setSubmittedQuery(item.query);
                          setTimeout(() => {
                            document
                              .querySelector('#ket-qua-tra-cuu')
                              ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          }, 50);
                        }}
                        className="inline-block w-full truncate text-left text-slate-700 transition-colors hover:text-[#B91C1C] hover:underline"
                      >
                        {item.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Column 3: Thủ tục quan tâm nhiều */}
              <div className="min-w-0 rounded-2xl border border-[#D4A017]/80 bg-white/80 p-5 shadow-2xs backdrop-blur-xs">
                <div className="mb-3.5 flex items-center gap-2 border-b-2 border-[#D4A017] pb-2">
                  <StarIcon className="size-5 text-[#D4A017]" aria-hidden="true" />
                  <h2 className="text-base font-bold text-[#1F2937]">Thủ tục quan tâm nhiều</h2>
                </div>
                <ul className="grid grid-cols-1 gap-x-3 gap-y-2 text-sm min-[460px]:grid-cols-2">
                  {[
                    { name: 'Đăng ký kết hôn', query: 'Đăng ký kết hôn' },
                    { name: 'Đăng ký khai sinh', query: 'Đăng ký khai sinh' },
                    { name: 'Xác nhận cư trú', query: 'Xác nhận thông tin về cư trú' },
                    { name: 'Chứng thực chữ ký', query: 'Chứng thực chữ ký' },
                    { name: 'Trích lục hộ tịch', query: 'Cấp bản sao trích lục hộ tịch' },
                    { name: 'Đổi thẻ BHYT', query: 'Bảo hiểm y tế' },
                  ].map((item) => (
                    <li key={item.name} className="min-w-0">
                      <a
                        href="#thu-tuc"
                        onClick={(event) => {
                          event.preventDefault();
                          setQuery(item.query);
                          setSubmittedQuery(item.query);
                          setTimeout(() => {
                            document
                              .querySelector('#ket-qua-tra-cuu')
                              ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          }, 50);
                        }}
                        className="inline-block w-full truncate text-left text-slate-700 transition-colors hover:text-[#B91C1C] hover:underline"
                      >
                        {item.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </m.div>
        </div>
      </section>

      {/* Focus Area & Fast Service Finder (Bố cục Tiêu điểm & Tra cứu nhanh tương tự beijing.gov.cn) */}
      <section
        aria-labelledby="focus-section-heading"
        className="border-b border-[#E5E7EB] bg-white py-12"
      >
        <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
          <h2 id="focus-section-heading" className="sr-only">
            Tiêu điểm hướng dẫn và tra cứu nhanh
          </h2>

          <div className="grid gap-8 lg:grid-cols-[1.3fr_0.9fr]">
            {/* Left Column: Focus News & Visual Guide */}
            <article className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-[#F8F7F4] shadow-sm">
              <figure className="relative h-64 overflow-hidden sm:h-72">
                <img
                  src="/van-mieu-quoc-tu-giam-1.jpg"
                  alt="Không gian hành chính công trang trọng và phục vụ nhân dân"
                  className="size-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                <figcaption className="absolute bottom-4 left-5 right-5 text-white">
                  <span className="inline-block rounded bg-[#B91C1C] px-2 py-0.5 text-xs font-semibold uppercase tracking-wider text-white">
                    Tiêu điểm dịch vụ công
                  </span>
                  <p className="mt-2 text-lg font-bold sm:text-xl">
                    Đổi mới quy trình tiếp nhận: Hỗ trợ tiền kiểm hồ sơ từ xa giúp giảm thiểu thời gian đi lại
                  </p>
                </figcaption>
              </figure>

              <div className="p-6">
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <CalendarDaysIcon className="size-4 text-[#B91C1C]" aria-hidden="true" />
                  <time dateTime="2026-09-17">Cập nhật: 17/09/2026</time>
                  <span>•</span>
                  <span>UBND Cấp Xã / Phường</span>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-700">
                  Người dân có thể tra cứu biểu mẫu chuẩn, kiểm tra các giấy tờ cần thiết và gửi bản chụp để cán bộ chuyên môn tiền kiểm trước khi nộp bản chính tại Bộ phận Một cửa.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <a
                    href="#quy-trinh"
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#B91C1C] hover:underline"
                  >
                    <span>Xem 4 bước tiền kiểm</span>
                    <ArrowRightIcon className="size-3.5" aria-hidden="true" />
                  </a>
                </div>
              </div>
            </article>

            {/* Right Column: Fast Service Finder (Tôi muốn tìm thủ tục - beijing.gov.cn 我要找政策) */}
            <aside
              aria-labelledby="quick-service-title"
              className="flex flex-col justify-between rounded-2xl border-2 border-[#D4A017]/30 bg-gradient-to-br from-white via-[#F8F7F4] to-red-50/20 p-6 shadow-sm"
            >
              <div>
                <div className="flex items-center gap-2 border-b border-[#E5E7EB] pb-4">
                  <BuildingLibraryIcon className="size-6 text-[#B91C1C]" aria-hidden="true" />
                  <h3 id="quick-service-title" className="text-lg font-bold text-[#8F1515]">
                    Tra cứu dịch vụ nhanh
                  </h3>
                </div>

                <p className="mt-3 text-xs leading-5 text-slate-600">
                  Chọn lĩnh vực bạn cần giải quyết để nhận hướng dẫn danh mục giấy tờ và biểu mẫu mới nhất:
                </p>

                <div className="mt-4 grid grid-cols-2 gap-2.5">
                  {serviceGroups.slice(0, 4).map(({ label, icon: Icon, count }) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => {
                        setQuery(label);
                        setSubmittedQuery(label);
                        setTimeout(() => {
                          document
                            .querySelector('#ket-qua-tra-cuu')
                            ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }, 0);
                      }}
                      className="group flex flex-col rounded-xl border border-[#E5E7EB] bg-white p-3 text-left transition-all hover:border-[#B91C1C] hover:shadow-sm"
                    >
                      <Icon className="size-5 text-[#B91C1C] transition-transform group-hover:scale-110" aria-hidden="true" />
                      <strong className="mt-2 text-xs font-bold text-[#1F2937] group-hover:text-[#B91C1C]">
                        {label}
                      </strong>
                      <small className="text-[10px] text-slate-500">{count}</small>
                    </button>
                  ))}
                </div>
              </div>

              {/* Pre-check notice banner */}
              <div className="mt-5 rounded-xl border border-[#D4A017]/40 bg-[#FFFDF5] p-3.5 text-xs leading-5 text-[#8F1515]">
                <div className="flex items-start gap-2">
                  <InformationCircleIcon className="size-4 shrink-0 text-[#D4A017]" aria-hidden="true" />
                  <p>
                    <strong>Lưu ý nghiệp vụ:</strong> Tiền kiểm là bước cán bộ hỗ trợ hoàn thiện hồ sơ. Cơ quan có thẩm quyền sẽ đối chiếu hồ sơ gốc khi bạn tới tiếp nhận trực tiếp.
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* Service Directory Section (Lĩnh vực Dịch vụ Công - Cá nhân & Tổ chức) */}
      <section id="thu-tuc" className="section-container scroll-mt-28" aria-labelledby="services-title">
        <div className="service-directory relative isolate overflow-hidden">
          <m.div {...reveal} className="section-title-row relative z-10">
            <div>
              <p className="section-label">Thông tin và dịch vụ</p>
              <h2 id="services-title">Lĩnh vực thủ tục hành chính</h2>
              <p>Chọn lĩnh vực gần nhất với nhu cầu của bạn để xem hướng dẫn thành phần hồ sơ và tờ khai.</p>
            </div>

            {/* Tab filter: Cá nhân vs Doanh nghiệp (Kiểu Beijing Gov) */}
            <div className="inline-flex rounded-xl border border-[#E5E7EB] bg-white p-1 shadow-sm">
              <button
                type="button"
                onClick={() => setActiveTab('citizen')}
                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all ${
                  activeTab === 'citizen'
                    ? 'bg-[#B91C1C] text-white shadow-sm'
                    : 'text-slate-600 hover:text-[#B91C1C]'
                }`}
              >
                <UserIcon className="size-4" aria-hidden="true" />
                <span>Dịch vụ công dân</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('business')}
                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all ${
                  activeTab === 'business'
                    ? 'bg-[#B91C1C] text-white shadow-sm'
                    : 'text-slate-600 hover:text-[#B91C1C]'
                }`}
              >
                <BuildingOffice2Icon className="size-4" aria-hidden="true" />
                <span>Tổ chức & Doanh nghiệp</span>
              </button>
            </div>
          </m.div>

          <div className="service-grid relative z-10" role="list">
            {serviceGroups.map(({ icon: Icon, ...group }, index) => (
              <m.button
                {...reveal}
                transition={{ duration: 0.35, delay: index * 0.04 }}
                key={group.label}
                type="button"
                onClick={() => {
                  setQuery(group.label);
                  setSubmittedQuery(group.label);
                  setTimeout(() => {
                    document
                      .querySelector('#ket-qua-tra-cuu')
                      ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }, 0);
                }}
                className="service-group group"
                role="listitem"
              >
                <span className="service-icon">
                  <Icon className="size-6 text-[#B91C1C] transition-colors group-hover:text-white" aria-hidden="true" />
                </span>
                <span className="service-content">
                  <strong>{group.label}</strong>
                  <span>{group.description}</span>
                </span>
                <span className="service-meta">
                  <small>{group.count}</small>
                  <ChevronDownIcon className="size-4 -rotate-90" aria-hidden="true" />
                </span>
              </m.button>
            ))}
          </div>
        </div>

        {/* Search Results & Popular Procedures Area */}
        <div id="ket-qua-tra-cuu" className="mt-14 scroll-mt-36 border-t border-[#E5E7EB] pt-10">
          <div className="relative z-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="section-label">Được quan tâm nhiều nhất</p>
              <h2 className="mt-2 text-2xl font-bold text-slate-950 sm:text-3xl">Thủ tục phổ biến</h2>
            </div>
            {submittedQuery && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setSubmittedQuery('');
                }}
                className="min-h-11 self-start text-sm font-bold text-[#B91C1C] underline decoration-red-200 underline-offset-4 sm:self-auto"
              >
                Xóa từ khóa “{submittedQuery}”
              </button>
            )}
          </div>

          {searchResults.length > 0 ? (
            <ol className="procedure-list relative z-10" role="list">
              {searchResults.map((procedure, index) => (
                <li key={procedure.title} role="listitem">
                  <button
                    type="button"
                    onClick={() => demoNotice(procedure.title)}
                    className="procedure-row group"
                    aria-label={`Xem hướng dẫn ${procedure.title}`}
                  >
                    <span className="procedure-index">{String(index + 1).padStart(2, '0')}</span>
                    <span className="procedure-content">
                      <span>{procedure.category}</span>
                      <strong>{procedure.title}</strong>
                    </span>
                    <span className="procedure-link">
                      <span>Xem hướng dẫn</span>
                      <ArrowRightIcon className="size-4 text-[#B91C1C]" aria-hidden="true" />
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          ) : (
            <div className="mt-7 border border-dashed border-[#B91C1C]/40 bg-red-50/40 px-5 py-12 text-center">
              <DocumentMagnifyingGlassIcon className="mx-auto size-10 text-[#B91C1C]" aria-hidden="true" />
              <h3 className="mt-4 text-lg font-bold text-slate-950">Chưa tìm thấy thủ tục phù hợp</h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
                Thử dùng từ khóa ngắn hơn như “khai sinh”, “kết hôn” hoặc bấm chọn lĩnh vực tương ứng ở bảng phía trên.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* 4-Step Preparation Journey Component */}
      <JourneySteps />

      {/* Frequently Asked Questions (Hỏi đáp thường gặp - beijing.gov.cn 大家都在問) */}
      <section
        id="hoi-dap"
        aria-labelledby="faq-section-heading"
        className="border-t border-[#E5E7EB] bg-[#F8F7F4] py-16 sm:py-20"
      >
        <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
          <header className="mx-auto max-w-2xl text-center">
            <p className="section-label justify-center">Giải đáp thắc mắc</p>
            <h2 id="faq-section-heading" className="mt-2 text-2xl font-bold text-slate-950 sm:text-3xl">
              Hiện tại người dân đang quan tâm gì?
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Các câu hỏi phổ biến nhất về quy trình tiền kiểm và cách chuẩn bị giấy tờ trước khi đến UBND xã/phường.
            </p>
          </header>

          <div className="mt-10 space-y-4">
            {faq.map((item, index) => (
              <details
                key={index}
                className="group rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm transition-all open:border-[#B91C1C]/40"
              >
                <summary className="flex cursor-pointer items-center justify-between gap-4 font-bold text-[#1F2937] hover:text-[#B91C1C]">
                  <span className="text-base leading-6">{item.question}</span>
                  <ChevronDownIcon className="size-5 shrink-0 text-slate-400 transition-transform group-open:rotate-180" aria-hidden="true" />
                </summary>
                <p className="mt-3 border-t border-slate-100 pt-3 text-sm leading-relaxed text-slate-600">
                  {item.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Citizen Call-to-action Banner */}
      <section className="px-5 pb-20 sm:px-8 sm:pb-24">
        <div className="cta-card">
          <div className="cta-pattern" aria-hidden="true" />
          <div className="relative z-10 max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#F5D76E]">Bắt đầu ngay hôm nay</p>
            <h2 className="mt-3 text-2xl font-bold sm:text-3xl">Tìm thủ tục bạn cần chuẩn bị</h2>
            <p className="mt-3 text-sm leading-relaxed text-red-50/85">
              Xem hướng dẫn công khai trước, đăng nhập khi bạn muốn lưu bản nháp và gửi hồ sơ để cán bộ tiền kiểm.
            </p>
          </div>
          <a
            href="#trang-chu"
            className="relative z-10 mt-6 inline-flex min-h-12 shrink-0 items-center gap-2 rounded-xl bg-[#F5D76E] px-6 text-sm font-bold text-[#8F1515] transition-all hover:bg-[#D4A017] hover:text-white lg:mt-0"
          >
            <span>Tra cứu thủ tục</span>
            <ArrowRightIcon className="size-4" aria-hidden="true" />
          </a>
        </div>
      </section>
    </>
  );
}

