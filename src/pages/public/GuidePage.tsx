import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ArrowRight,
  CaretRight,
  Check,
  CheckCircle,
  Compass,
  EnvelopeSimple,
  Info,
  Question,
  ShieldCheck,
  Sparkle,
} from '@phosphor-icons/react';
import { buttonVariants } from '@/components/ui';
import { guideSteps } from '@/data/preparationGuide';

export function GuidePage() {
  const { hash } = useLocation();
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView({ block: 'start' });
    else window.scrollTo(0, 0);
  }, [hash]);

  return (
    <div className="bg-[#fbf9f5]">
      <section className="relative isolate flex min-h-[600px] flex-col justify-start overflow-hidden bg-[#fbf9f5] lg:min-h-[640px]">
        <img src="/hero-architecture-bg.jpg" alt="" aria-hidden="true" fetchPriority="high" className="pointer-events-none absolute inset-0 -z-20 h-full w-full object-cover object-right" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(251,249,245,0.98)_0%,rgba(251,249,245,0.92)_42%,rgba(251,249,245,0.2)_100%)] max-lg:bg-[linear-gradient(90deg,rgba(251,249,245,0.96),rgba(251,249,245,0.8))]" />
        <div className="mx-auto w-full max-w-[1240px] px-5 pt-6 pb-8 sm:px-8 sm:pt-8 sm:pb-12 lg:pb-16">
          <nav aria-label="Đường dẫn trang" className="mb-7 flex flex-wrap items-center gap-2 text-sm text-slate-500">
            <Link to="/" className="transition-colors hover:text-red-800">Trang chủ</Link>
            <CaretRight size={14} aria-hidden="true" />
            <span aria-current="page" className="font-semibold text-slate-800">Hướng dẫn thực hiện</span>
          </nav>
          <div className="grid items-start gap-8 lg:grid-cols-[1.4fr_1fr] lg:gap-16">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-red-200/80 bg-red-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-red-800">
                <Compass size={14} weight="fill" className="text-red-700" />
                <span>Hướng dẫn sử dụng WardMate</span>
              </div>
              <h1 className="mt-3.5 max-w-2xl text-3xl font-extrabold leading-tight tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">
                Chuẩn bị hồ sơ,<br className="hidden sm:block" /> rõ từng bước
              </h1>
              <p className="mt-5 max-w-xl text-base leading-8 text-slate-600">
                Từ tìm thủ tục đến nhận góp ý tiền kiểm và tải giấy tờ. Bạn có thể đọc hướng dẫn trước, đăng nhập khi muốn lưu và gửi hồ sơ.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link to="/thu-tuc" className={buttonVariants({ className: 'bg-red-800 hover:bg-red-900 text-white font-semibold shadow-xs' })}>
                  Tra cứu thủ tục <ArrowRight size={18} aria-hidden="true" />
                </Link>
                <Link to="/citizen?section=dossiers_all" className={buttonVariants({ variant: 'outline', className: 'border-slate-300 font-semibold text-slate-800 hover:bg-slate-50' })}>
                  Hồ sơ của tôi
                </Link>
              </div>
            </div>

            <aside aria-label="Chuẩn bị trước khi bắt đầu" className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs">
              <div className="flex items-center gap-2">
                <Sparkle size={18} weight="fill" className="text-amber-500" />
                <h2 className="text-base font-bold text-slate-900">Trước khi bắt đầu</h2>
              </div>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
                {[
                  'Email đăng ký có thể nhận thư để khôi phục mật khẩu khi cần.',
                  'Thông tin cá nhân và giấy tờ theo đúng trường hợp của bạn.',
                  'Ảnh hoặc bản quét rõ nét, đầy đủ nội dung và các góc giấy tờ.',
                ].map((text) => (
                  <li key={text} className="flex gap-2.5">
                    <Check size={18} weight="bold" className="mt-1 shrink-0 text-red-800" aria-hidden="true" />
                    <span>{text}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-5 flex items-start gap-2 border-t border-slate-100 pt-4 text-xs leading-5 text-slate-500">
                <Info size={16} className="mt-0.5 shrink-0 text-slate-400" />
                <span>Danh sách giấy tờ cụ thể nằm ở trang chi tiết thủ tục và trong hồ sơ của bạn.</span>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1240px] px-5 pb-8 sm:px-8 sm:pb-12">
        <div className="mb-8 flex items-start gap-3.5 rounded-2xl border border-amber-300/80 bg-amber-50/70 p-4 sm:p-5 text-sm leading-relaxed text-amber-950 shadow-2xs">
          <ShieldCheck size={24} weight="fill" className="mt-0.5 shrink-0 text-amber-700" aria-hidden="true" />
          <p>
            <strong>Tiền kiểm giúp bạn chuẩn bị giấy tờ.</strong> Việc tiếp nhận chính thức và giải quyết thủ tục được thực hiện tại cơ quan có thẩm quyền.
          </p>
        </div>

        <div className="grid items-start gap-7 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-10">
          <nav aria-label="Mục lục hướng dẫn" className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs lg:sticky lg:top-40">
            <div className="flex items-center justify-between px-2 pb-2 border-b border-slate-100">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">Các bước thực hiện</h2>
              <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-bold text-red-800">6 bước</span>
            </div>
            <ol className="mt-3 space-y-1">
              {guideSteps.map((step) => (
                <li key={step.id}>
                  <a
                    href={'#' + step.id}
                    className="group flex min-h-11 items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm font-semibold leading-6 text-slate-700 transition-all hover:bg-red-50 hover:text-red-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-100"
                  >
                    <span className="grid size-6 shrink-0 place-items-center rounded-md bg-slate-100 text-xs font-bold text-red-800 group-hover:bg-red-800 group-hover:text-white transition-colors">
                      {step.number}
                    </span>
                    <span className="truncate">{step.title}</span>
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <div className="min-w-0 space-y-6">
            {guideSteps.map(({ icon: Icon, ...step }) => (
              <section
                id={step.id}
                key={step.id}
                aria-labelledby={step.id + '-title'}
                className="scroll-mt-44 overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-3.5 border-b border-slate-100 p-5 sm:gap-4 sm:p-6 bg-slate-50/40">
                  <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-red-50 to-amber-50 border border-red-100/80 text-red-800 shadow-2xs">
                    <Icon size={26} weight="duotone" aria-hidden="true" />
                  </span>
                  <div>
                    <span className="inline-flex items-center rounded-full bg-red-100/70 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-red-900">
                      Bước {step.number}
                    </span>
                    <h2 id={step.id + '-title'} className="mt-1.5 text-lg font-bold leading-7 text-slate-950 sm:text-xl">
                      {step.title}
                    </h2>
                    <p className="mt-1 text-sm leading-relaxed text-slate-600">{step.description}</p>
                  </div>
                </div>

                <div className="p-5 sm:p-6">
                  <ul className="space-y-2.5">
                    {step.tasks.map((task) => (
                      <li key={task} className="flex items-start gap-3 rounded-xl bg-slate-50/60 border border-slate-100/80 p-3 text-sm leading-relaxed text-slate-700">
                        <Check size={17} weight="bold" className="mt-0.5 shrink-0 text-red-800" aria-hidden="true" />
                        <span>{task}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-amber-200/60 bg-amber-50/40 px-4 py-3.5 text-sm leading-relaxed text-slate-700">
                    <CheckCircle size={18} weight="fill" className="mt-0.5 shrink-0 text-amber-700" aria-hidden="true" />
                    <div>
                      <strong className="font-bold text-slate-900">Sau bước này: </strong>
                      <span>{step.outcome}</span>
                    </div>
                  </div>
                </div>
              </section>
            ))}

            <section aria-labelledby="guide-help" className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs">
              <div className="flex items-center gap-2">
                <Question size={22} className="text-red-800" />
                <h2 id="guide-help" className="text-lg font-bold text-slate-950">Khi cần hỗ trợ thêm</h2>
              </div>
              <details className="mt-4 border-b border-slate-100 pb-4">
                <summary className="cursor-pointer py-2 text-sm font-semibold text-slate-800 hover:text-red-800 transition-colors">
                  Tôi quên mật khẩu hoặc chưa nhận được email?
                </summary>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  Dùng email hoặc tên đăng nhập đã đăng ký tại trang quên mật khẩu. Kiểm tra cả thư rác, nhập mã 6 số trong 5 phút; đợi ít nhất 60 giây trước khi yêu cầu gửi lại.
                </p>
                <Link to="/quen-mat-khau" className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm font-bold text-red-800 hover:underline">
                  <EnvelopeSimple size={18} aria-hidden="true" /> Khôi phục mật khẩu <ArrowRight size={16} aria-hidden="true" />
                </Link>
              </details>
              <details className="mt-3">
                <summary className="cursor-pointer py-2 text-sm font-semibold text-slate-800 hover:text-red-800 transition-colors">
                  Giấy tờ đã sẵn sàng nhưng chưa có QR?
                </summary>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  Mở chi tiết hồ sơ, tạo PDF từ bản khai đã sẵn sàng rồi tải lại mã QR. Nếu tạo PDF thất bại, giữ hồ sơ và thử lại theo thông báo trên màn hình.
                </p>
              </details>
              <Link to="/hoi-dap" className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-bold text-red-800 hover:underline">
                Xem thêm câu hỏi thường gặp <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
