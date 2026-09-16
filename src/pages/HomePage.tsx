import { FormEvent, useMemo, useState } from 'react';
import * as Accordion from '@radix-ui/react-accordion';
import { m } from 'motion/react';
import { toast } from 'sonner';
import {
  ArrowRight,
  Buildings as Landmark,
  CaretDown as ChevronDown,
  ClipboardText as ClipboardList,
  ClockCounterClockwise as FileClock,
  FileMagnifyingGlass as FileSearch,
  FolderOpen,
  MapPin,
  NotePencil as FilePenLine,
  QrCode,
  SealCheck as BadgeCheck,
  ShieldCheck,
  MagnifyingGlass as Search,
} from '@phosphor-icons/react';
import { Button } from '@/components/ui/Button';
import { faq, popularProcedures, preparationSteps, serviceGroups } from '@/data/landing';

function normalizeVietnamese(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();
}

const reveal = {
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.18 },
  transition: { duration: 0.45 },
};

export function HomePage() {
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');

  const searchResults = useMemo(() => {
    if (!submittedQuery) return popularProcedures;
    const normalized = normalizeVietnamese(submittedQuery);
    return popularProcedures.filter((item) => normalizeVietnamese(`${item.title} ${item.category}`).includes(normalized));
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
      <section id="trang-chu" className="relative scroll-mt-36 overflow-hidden bg-red-900 text-white">
        <div className="national-pattern" aria-hidden="true" />
        <div className="mx-auto grid min-h-[590px] max-w-[1240px] items-center gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[1.08fr_.92fr] lg:py-20">
          <m.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="relative z-10">
            <div className="inline-flex items-center gap-2 border-l-2 border-gold-400 pl-3 text-xs font-bold uppercase tracking-[0.18em] text-gold-300">
              Phục vụ người dân · Công khai · Minh bạch
            </div>
            <h1 className="mt-6 max-w-3xl font-serif text-[2.65rem] font-bold leading-[1.12] tracking-[-0.025em] sm:text-[3.8rem]">
              Chuẩn bị hồ sơ đúng ngay từ đầu
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-red-50/85">
              Tra cứu thủ tục, chuẩn bị giấy tờ và nhận hướng dẫn tiền kiểm trước khi đến cơ quan có thẩm quyền.
            </p>

            <form className="hero-search-box mt-9" role="search" onSubmit={handleSearch}>
              <label htmlFor="landing-search" className="mb-3 block text-sm font-bold text-slate-900">Tra cứu thủ tục hành chính</label>
              <div className="flex flex-col gap-3 md:flex-row">
                <div className="relative min-w-0 flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={21} aria-hidden="true" />
                  <input id="landing-search" value={query} onChange={(event) => setQuery(event.target.value)} className="hero-search-input" placeholder="Nhập tên thủ tục hoặc nhu cầu của bạn" />
                </div>
                <Button type="submit" variant="primary" size="large">Tìm kiếm <ArrowRight size={18} aria-hidden="true" /></Button>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span>Gợi ý:</span>
                {['Khai sinh', 'Kết hôn', 'Chứng thực bản sao'].map((suggestion) => (
                  <button key={suggestion} type="button" className="hero-suggestion" onClick={() => { setQuery(suggestion); setSubmittedQuery(suggestion); setTimeout(() => document.querySelector('#ket-qua-tra-cuu')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 0); }}>{suggestion}</button>
                ))}
              </div>
            </form>
          </m.div>

          <m.div initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.55, delay: 0.1 }} className="relative z-10 mx-auto w-full max-w-[500px]">
            <div className="hero-journey-card">
              <div className="flex items-center gap-3 border-b border-white/15 pb-5">
                <span className="grid size-11 place-items-center rounded-full bg-gold-400 text-red-950"><Landmark size={22} aria-hidden="true" /></span>
                <div><p className="text-xs font-bold uppercase tracking-[0.14em] text-gold-300">Hành trình hồ sơ</p><h2 className="mt-1 text-lg font-bold">Rõ từng bước, đúng từng việc</h2></div>
              </div>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {[
                  { label: 'Tìm đúng thủ tục', icon: FileSearch },
                  { label: 'Chuẩn bị giấy tờ', icon: ClipboardList },
                  { label: 'Nhận góp ý tiền kiểm', icon: ShieldCheck },
                  { label: 'Nhận QR sau khi duyệt', icon: QrCode },
                ].map(({ label, icon: Icon }, index) => (
                  <div key={label} className="journey-step">
                    <div className="flex items-center justify-between"><Icon className="text-gold-300" size={22} aria-hidden="true" /><span className="text-xs font-bold text-white/35">0{index + 1}</span></div>
                    <strong className="mt-4 text-sm leading-6">{label}</strong>
                  </div>
                ))}
              </div>
              <div className="mt-5 flex gap-3 bg-gold-400 px-4 py-3 text-sm leading-6 text-red-950"><ShieldCheck className="mt-0.5 shrink-0" size={20} aria-hidden="true" /><span><strong>QR chỉ có sau khi duyệt tiền kiểm.</strong> Việc tiếp nhận chính thức được thực hiện trực tiếp tại cơ quan.</span></div>
            </div>
          </m.div>
        </div>
      </section>

      <section id="tien-ich" className="relative z-20 -mt-1 scroll-mt-36 border-b border-red-100 bg-white shadow-[0_8px_24px_rgba(72,18,23,.08)]" aria-label="Tiện ích nhanh">
        <div className="mx-auto grid max-w-[1240px] divide-y divide-red-100 px-5 sm:grid-cols-2 sm:divide-x sm:divide-y-0 sm:px-8 lg:grid-cols-4">
          {[
            { label: 'Chuẩn bị hồ sơ mới', detail: 'Bắt đầu theo từng bước', icon: FilePenLine },
            { label: 'Theo dõi tiền kiểm', detail: 'Xem trạng thái hồ sơ', icon: FileClock },
            { label: 'Hồ sơ cần bổ sung', detail: 'Đọc góp ý của cán bộ', icon: FolderOpen },
            { label: 'Mã QR đã được duyệt', detail: 'Chuẩn bị đến cơ quan', icon: QrCode },
          ].map(({ label, detail, icon: Icon }) => (
            <button key={label} type="button" onClick={() => demoNotice(label)} className="quick-action group">
              <span className="quick-action-icon"><Icon size={22} strokeWidth={1.8} aria-hidden="true" /></span>
              <span className="text-left"><strong className="block text-sm text-slate-950 group-hover:text-red-800">{label}</strong><span className="mt-1 block text-xs text-slate-500">{detail}</span></span>
              <ArrowRight className="ml-auto text-red-300 transition-transform group-hover:translate-x-1 group-hover:text-red-700" size={17} aria-hidden="true" />
            </button>
          ))}
        </div>
      </section>

      <section id="thu-tuc" className="section-container scroll-mt-36">
        <m.div {...reveal} className="section-title-row">
          <div><p className="section-label">Thông tin và dịch vụ</p><h2>Lĩnh vực thủ tục hành chính</h2><p>Chọn lĩnh vực gần nhất với nhu cầu của bạn để xem hướng dẫn phù hợp.</p></div>
          <Button variant="outline" className="hidden sm:inline-flex">Xem tất cả lĩnh vực <ArrowRight size={17} aria-hidden="true" /></Button>
        </m.div>
        <div className="service-grid">
          {serviceGroups.map(({ icon: Icon, ...group }, index) => (
            <m.button {...reveal} transition={{ duration: 0.35, delay: index * 0.04 }} key={group.label} type="button" onClick={() => { setQuery(group.label); setSubmittedQuery(group.label); }} className="service-group group">
              <span className="service-icon"><Icon size={25} strokeWidth={1.7} aria-hidden="true" /></span>
              <span className="service-content"><strong>{group.label}</strong><span>{group.description}</span></span>
              <span className="service-meta"><small>{group.count}</small><ChevronDown className="-rotate-90" size={18} aria-hidden="true" /></span>
            </m.button>
          ))}
        </div>

        <div id="ket-qua-tra-cuu" className="mt-14 scroll-mt-52 border-t border-slate-200 pt-10">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div><p className="section-label">Được quan tâm</p><h2 className="mt-2 font-serif text-3xl font-bold text-slate-950">Thủ tục phổ biến</h2></div>
            {submittedQuery && <button type="button" onClick={() => { setQuery(''); setSubmittedQuery(''); }} className="min-h-11 self-start text-sm font-bold text-red-800 underline decoration-red-200 underline-offset-4 sm:self-auto">Xóa từ khóa “{submittedQuery}”</button>}
          </div>
          {searchResults.length > 0 ? (
            <div className="procedure-list">
              {searchResults.map((procedure, index) => (
                <button key={procedure.title} type="button" onClick={() => demoNotice(procedure.title)} className="procedure-row group" aria-label={`Xem hướng dẫn ${procedure.title}`}>
                  <span className="procedure-index">{String(index + 1).padStart(2, '0')}</span>
                  <span className="procedure-content"><span>{procedure.category}</span><strong>{procedure.title}</strong></span>
                  <span className="procedure-link"><span>Xem hướng dẫn</span><ArrowRight size={18} aria-hidden="true" /></span>
                </button>
              ))}
            </div>
          ) : (
            <div className="mt-7 border border-dashed border-red-200 bg-red-50/50 px-5 py-12 text-center"><FileSearch className="mx-auto text-red-400" size={34} aria-hidden="true" /><h3 className="mt-4 text-lg font-bold text-slate-950">Chưa tìm thấy thủ tục phù hợp</h3><p className="mx-auto mt-2 max-w-md text-sm leading-7 text-slate-600">Thử dùng từ khóa ngắn hơn như “khai sinh”, “kết hôn” hoặc chọn một lĩnh vực phía trên.</p></div>
          )}
        </div>
      </section>

      <section id="quy-trinh" className="scroll-mt-36 bg-[#f8f5ef] py-20 sm:py-24">
        <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
          <m.div {...reveal} className="mx-auto max-w-3xl text-center"><p className="section-label justify-center">Quy trình chuẩn bị</p><h2 className="mt-3 font-serif text-3xl font-bold text-slate-950 sm:text-4xl">Bốn bước để hồ sơ sẵn sàng</h2><p className="mt-5 text-base leading-8 text-slate-600 sm:text-lg">Mỗi bước đều có hướng dẫn, trạng thái lưu và hành động tiếp theo rõ ràng.</p></m.div>
          <div className="relative mt-12 grid gap-5 lg:grid-cols-4">
            <div className="absolute left-[12.5%] right-[12.5%] top-9 hidden h-px bg-red-200 lg:block" aria-hidden="true" />
            {preparationSteps.map(({ icon: Icon, ...step }, index) => (
              <m.article {...reveal} transition={{ duration: 0.4, delay: index * 0.07 }} key={step.number} className="process-card">
                <div className="relative z-10 flex items-center justify-between"><span className="process-icon"><Icon size={23} strokeWidth={1.8} aria-hidden="true" /></span><span className="font-serif text-3xl font-bold text-red-100">{step.number}</span></div>
                <h3 className="mt-6 text-lg font-bold text-slate-950">{step.title}</h3><p className="mt-3 text-sm leading-7 text-slate-600">{step.description}</p>
              </m.article>
            ))}
          </div>
          <div className="mt-8 flex items-start gap-3 border-l-4 border-gold-500 bg-white p-5 text-sm leading-7 text-slate-600 shadow-sm"><BadgeCheck className="mt-0.5 shrink-0 text-red-700" size={21} aria-hidden="true" /><p><strong className="text-slate-950">Lưu ý:</strong> Mã QR xác định phiên bản đã duyệt tiền kiểm; QR không phải giấy hẹn, số thứ tự hoặc kết quả giải quyết thủ tục.</p></div>
        </div>
      </section>

      <section id="hoi-dap" className="section-container scroll-mt-36">
        <div className="grid gap-12 lg:grid-cols-[.72fr_1.28fr] lg:gap-20">
          <m.div {...reveal}><p className="section-label">Giải đáp nhanh</p><h2 className="mt-3 font-serif text-3xl font-bold text-slate-950 sm:text-4xl">Câu hỏi thường gặp</h2><p className="mt-5 text-lg leading-8 text-slate-600">Hiểu đúng tiền kiểm và những việc cần làm trước khi bắt đầu.</p><div className="mt-8 border-l-4 border-gold-500 bg-red-900 p-6 text-white"><MapPin size={23} className="text-gold-300" aria-hidden="true" /><h3 className="mt-5 text-lg font-bold">Chưa biết chọn thủ tục nào?</h3><p className="mt-3 text-sm leading-7 text-red-50/75">Tra cứu bằng nhu cầu của bạn. Bạn chưa cần đăng nhập để đọc hướng dẫn.</p><a href="#trang-chu" className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-bold text-gold-300">Quay lại ô tra cứu <ArrowRight size={17} aria-hidden="true" /></a></div></m.div>
          <Accordion.Root type="single" collapsible className="divide-y divide-slate-200 border-y border-slate-200">
            {faq.map((item, index) => (
              <Accordion.Item value={`faq-${index}`} key={item.question}>
                <Accordion.Header><Accordion.Trigger className="faq-trigger group"><span>{item.question}</span><ChevronDown className="shrink-0 text-red-400 transition-transform group-data-[state=open]:rotate-180" size={21} aria-hidden="true" /></Accordion.Trigger></Accordion.Header>
                <Accordion.Content className="faq-content"><p>{item.answer}</p></Accordion.Content>
              </Accordion.Item>
            ))}
          </Accordion.Root>
        </div>
      </section>

      <section className="px-5 pb-20 sm:px-8 sm:pb-24">
        <div className="cta-card">
          <div className="cta-pattern" aria-hidden="true" />
          <div className="relative z-10 max-w-2xl"><p className="text-xs font-bold uppercase tracking-[0.16em] text-gold-300">Bắt đầu ngay hôm nay</p><h2 className="mt-3 font-serif text-3xl font-bold sm:text-4xl">Tìm thủ tục bạn cần chuẩn bị</h2><p className="mt-4 text-base leading-7 text-red-50/80">Xem hướng dẫn công khai trước, đăng nhập khi bạn muốn lưu và gửi hồ sơ tiền kiểm.</p></div>
          <a href="#trang-chu" className="relative z-10 mt-7 inline-flex min-h-14 shrink-0 items-center gap-2 bg-gold-400 px-7 text-base font-bold text-red-950 hover:bg-gold-300 lg:mt-0">Tra cứu thủ tục <ArrowRight size={18} aria-hidden="true" /></a>
        </div>
      </section>
    </>
  );
}
