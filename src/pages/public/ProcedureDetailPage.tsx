import { useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, ArrowRight, ArrowSquareOut, CaretRight, House, Sparkle } from '@phosphor-icons/react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Badge, buttonVariants } from '@/components/ui';
import { procedureApi } from '@/lib/api/procedures';
import { useProcedureQuery } from '@/hooks/useProcedureQuery';
import { ProcedureFeedback } from '@/components/ui/ProcedureFeedback';
import { PdfSource } from '@/pages/procedure-manager/ProcedureDraftWorkspace';
import { contentFromApi } from '@/lib/procedureContent';
import { useAuthStore } from '@/stores/authStore';
import { toast } from '@/components/ui/Toast';

import { ProcedureCasesView } from './components/ProcedureCasesView';

const pending = 'Thông tin cần được cơ quan tiếp nhận xác nhận.';
const sections = [
  ['tong-quan', 'Thông tin chung'],
  ['thanh-phan-ho-so', 'Thành phần hồ sơ & Quy trình'],
  ['thoi-han-le-phi', 'Thời hạn và lệ phí'],
  ['can-cu-phap-luat', 'Căn cứ pháp luật'],
  ['co-quan-tiep-nhan', 'Cơ quan tiếp nhận'],
];

export function ProcedureDetailPage() {
  const { procedureId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const search = location.search;
  const result = useProcedureQuery(useCallback((signal: AbortSignal) => procedureApi.detail(procedureId ?? '', signal), [procedureId]));
  const procedure = result.data;
  const heading = useRef<HTMLHeadingElement>(null);
  const listUrl = '/thu-tuc' + search;
  const content = procedure ? contentFromApi(procedure) : { overview: '', methods: [], legalBases: [], receivingAgencies: [], cases: [], checklist: [] };

  const authStatus = useAuthStore((state) => state.status);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    heading.current?.focus({ preventScroll: true });
  }, [procedureId, procedure?.id]);

  if (result.loading || result.error) return <div className="mx-auto max-w-4xl p-6"><ProcedureFeedback loading={result.loading} error={result.error} retry={result.refresh} /><Link to={listUrl}>Quay lại danh sách</Link></div>;
  if (!procedure) return (
    <section className="mx-auto max-w-3xl px-5 py-16 text-center">
      <h1 ref={heading} tabIndex={-1} className="text-2xl font-bold">Không tìm thấy thủ tục</h1>
      <p className="my-5 text-slate-600">Thủ tục này chưa có trong danh mục đang công khai. Bạn có thể quay lại để chọn thủ tục khác.</p>
      <Link to={listUrl} className={buttonVariants({ variant: 'outline' })}><ArrowLeft aria-hidden="true" />Quay lại danh sách</Link>
    </section>
  );

  const handleStartProcedure = () => {
    const returnTo = `${location.pathname}${location.search}`;

    if (authStatus !== 'authenticated') {
      toast.info('Vui lòng đăng nhập để bắt đầu chuẩn bị hồ sơ thủ tục.');
      navigate(`/dang-nhap?returnTo=${encodeURIComponent(returnTo)}`);
      return;
    }

    toast.info('Chức năng tạo hồ sơ cần kết nối dịch vụ Hồ sơ công dân. Bạn có thể tra cứu giấy tờ và quy trình bên dưới.');

  };

  return (
    <div className="bg-slate-50">
      <section className="border-b border-red-100 bg-white px-5 py-8 sm:px-8">
        <div className="mx-auto max-w-[1120px]">
          <nav aria-label="Đường dẫn" className="mb-5 flex flex-wrap items-center gap-2 text-sm text-slate-600">
            <Link to="/" className="inline-flex min-h-11 items-center gap-2 hover:text-red-800"><House aria-hidden="true" />Trang chủ</Link>
            <CaretRight aria-hidden="true" />
            <Link to={listUrl} className="inline-flex min-h-11 items-center hover:text-red-800">Thủ tục hành chính</Link>
            <CaretRight aria-hidden="true" /><span aria-current="page">Chi tiết thủ tục</span>
          </nav>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              <Badge>{procedure.categoryName}</Badge>

            </div>

            {/* Nút Bắt đầu làm thủ tục trên Banner Header */}
            <button
              type="button"
              onClick={handleStartProcedure}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-red-800 px-5 py-2.5 text-sm font-bold text-white shadow-md hover:bg-red-900 transition-all active:scale-[0.98]"
            >
              <Sparkle size={18} weight="fill" className="text-amber-300" />
              <span>Bắt đầu làm thủ tục</span>
              <ArrowRight size={16} weight="bold" />
            </button>
          </div>

          <h1 ref={heading} tabIndex={-1} className="mt-4 max-w-4xl break-words text-3xl font-bold leading-tight text-red-900 sm:text-4xl">{procedure.title}</h1>
          <p className="mt-3 text-sm text-slate-600">Mã thủ tục: {procedure.procedureCode} · {procedure.levelOfImplementation}</p>
          <p className="mt-5 max-w-4xl rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
            Tiền kiểm hồ sơ không thay thế việc tiếp nhận và giải quyết thủ tục chính thức.
          </p>
        </div>
      </section>

      <div className="mx-auto grid max-w-[1184px] items-start gap-6 px-5 py-8 sm:px-8 lg:grid-cols-[250px_minmax(0,1fr)]">
        <aside className="rounded-xl border border-slate-200 bg-white p-4 lg:sticky lg:top-36">
          <h2 className="mb-3 font-bold">Nội dung thủ tục</h2>
          <nav aria-label="Nội dung thủ tục" className="grid gap-1">
            {sections.map(([id, label]) => <a key={id} href={'#' + id} className="flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-slate-700 hover:bg-red-50 hover:text-red-800">{label}</a>)}
          </nav>

          <button
            type="button"
            onClick={handleStartProcedure}
            className="mt-4 flex w-full min-h-11 items-center justify-center gap-2 rounded-lg bg-red-800 px-3 py-2 text-xs font-bold text-white shadow-xs hover:bg-red-900 transition-colors"
          >
            <span>Bắt đầu làm thủ tục</span>
            <ArrowRight size={14} weight="bold" />
          </button>

          <Link to={listUrl} className="mt-3 flex min-h-11 items-center gap-2 border-t border-slate-200 pt-3 text-sm font-bold text-red-800"><ArrowLeft aria-hidden="true" />Quay lại danh sách</Link>
        </aside>

        <div className="min-w-0 space-y-6">
          <section id="tong-quan" aria-labelledby="overview-title" className="procedure-detail-section">
            <h2 id="overview-title">Thông tin chung</h2>
            <p className="whitespace-pre-line break-words">{content.overview || pending}</p>
            <dl className="mt-5 grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-2">
              <div><dt className="text-sm text-slate-500">Lĩnh vực</dt><dd className="mt-1 font-semibold">{procedure.categoryName}</dd></div>
              <div><dt className="text-sm text-slate-500">Phạm vi hỗ trợ</dt><dd className="mt-1">{procedure.levelOfImplementation}</dd></div>
            </dl>
          </section>

          {/* Khối Thành phần hồ sơ theo trường hợp (hiển thị checklist giấy tờ cần thiết để đọc và tải template, không checkbox) */}
          {(content.cases.length > 0 || content.checklist.length > 0) && (
            <ProcedureCasesView key={procedure.id} cases={content.cases} checklist={content.checklist} />
          )}

          <section id="thoi-han-le-phi" aria-labelledby="fees-title" className="procedure-detail-section">
            <h2 id="fees-title">Thời hạn và lệ phí</h2>
            <p className="mb-4 text-sm text-slate-600">{procedure.processingTimeSummary} · {procedure.feeSummary}</p>
            <table className="procedure-detail-table">
              <caption className="sr-only">Cách thức thực hiện, thời hạn giải quyết và phí, lệ phí</caption>
              <thead><tr><th scope="col">Cách thức thực hiện</th><th scope="col">Thời hạn giải quyết</th><th scope="col">Phí, lệ phí</th></tr></thead>
              <tbody>{content.methods.length ? content.methods.map((row, index) => <tr key={index}>
                <td data-label="Cách thức thực hiện">{row.method}</td>
                <td data-label="Thời hạn giải quyết">{row.processingTime || pending}</td>
                <td data-label="Phí, lệ phí">{row.fee || pending}{row.notes && <p className="mt-2 whitespace-pre-line text-sm text-slate-600">{row.notes}</p>}</td>
              </tr>) : <tr><td colSpan={3}>{pending}</td></tr>}</tbody>
            </table>
          </section>

          <section id="can-cu-phap-luat" aria-labelledby="legal-title" className="procedure-detail-section">
            <h2 id="legal-title">Căn cứ pháp luật</h2>
            <table className="procedure-detail-table">
              <caption className="sr-only">Văn bản làm căn cứ pháp luật</caption>
              <thead><tr><th scope="col">Số hiệu</th><th scope="col">Tên văn bản</th><th scope="col">Nguồn</th></tr></thead>
              <tbody>{content.legalBases.length ? content.legalBases.map((row, index) => <tr key={index}>
                <td data-label="Số hiệu">{row.number || 'Chưa cập nhật'}</td><td data-label="Tên văn bản">{row.title}</td>
                <td data-label="Nguồn">{row.url ? <a href={row.url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 font-semibold text-red-800 underline">Xem văn bản<span className="sr-only">: {row.title} (mở tab mới)</span><ArrowSquareOut aria-hidden="true" /></a> : 'Chưa có nguồn xác minh'}</td>
              </tr>) : <tr><td colSpan={3}>Chưa có văn bản pháp luật được xác minh cho thủ tục này.</td></tr>}</tbody>
            </table>
          </section>

          <section id="co-quan-tiep-nhan" aria-labelledby="agency-title" className="procedure-detail-section">
            <h2 id="agency-title">Cơ quan tiếp nhận</h2>
            {content.receivingAgencies.length ? <ul className="space-y-4">{content.receivingAgencies.map((agency, index) => <li key={index} className="rounded-xl border border-slate-200 p-4">
              <h3 className="break-words font-semibold">{agency.name}</h3><p className="mt-2 whitespace-pre-line break-words text-sm text-slate-600">{agency.address || pending}</p>
              {agency.url && <a href={agency.url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex min-h-11 items-center gap-2 font-semibold text-red-800 underline">Thông tin cơ quan<span className="sr-only">: {agency.name} (mở tab mới)</span><ArrowSquareOut aria-hidden="true" /></a>}
            </li>)}</ul> : <p>{pending}</p>}
          </section>

          <section className="procedure-detail-section"><h2>Kết quả và biểu mẫu</h2><ul className="list-inside list-disc">{procedure.contentPayload.results.map((text, index) => <li key={index}>{text}</li>)}</ul>{(procedure.formDefinitions ?? []).map((form, index) => <p className="mt-3" key={index}>{form.formCode} · {form.formName} · {form.quantity} bản{form.isMandatory ? ' · Bắt buộc khi áp dụng' : ''}</p>)}<p className="mt-3 text-sm text-slate-600">Tải và soạn biểu mẫu cần kết nối dịch vụ Biểu mẫu.</p></section>
          {procedure.pdfFileName && <section className="procedure-detail-section"><h2>PDF nguồn</h2><p className="mb-3">{procedure.pdfFileName}</p><PdfSource id={procedure.id} /></section>}
          {/* Banner CTA cuối trang */}
          <div className="rounded-xl border border-red-200 bg-white p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Sẵn sàng thực hiện thủ tục này?</h3>
              <p className="text-sm text-slate-600 mt-1">Bấm bắt đầu để xem danh mục checklist giấy tờ đầy đủ và tải/soạn thảo các tờ khai trực tuyến.</p>
            </div>
            <button
              type="button"
              onClick={handleStartProcedure}
              className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-red-800 px-6 py-2.5 text-sm font-bold text-white shadow-md hover:bg-red-900 transition-colors"
            >
              <span>Bắt đầu làm thủ tục</span>
              <ArrowRight size={16} weight="bold" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
