import '@/styles/public-pages.css';
import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  CaretRight,
  FilePdf,
  House,
} from '@phosphor-icons/react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { Button, Modal, buttonVariants } from '@/components/ui';
import { procedureError, type ProcedureSummary } from '@/lib/api/procedures';
import { usePublicProcedureDetail, usePublicProcedureList } from '@/hooks/useProcedureCategories';
import { ProcedureFeedback } from '@/components/ui/ProcedureFeedback';
import { PdfSource } from '@/pages/procedure-manager/ProcedureDraftWorkspace';
import { ProcedureFormLink } from '@/components/forms/ProcedureFormLink';
import { hasFourColumnLegal, legalIssueDate, methodFeeLabel, methodTimeLabel } from '@/lib/procedureDisplay';
import { ProcedureDocumentsView } from '@/components/procedures/ProcedureDocumentsView';
import { caseDisplayName, requiresCaseChoice } from '@/lib/procedureCases';

export function ProcedureDetailPage() {
  const { procedureId } = useParams();
  const location = useLocation();
  const search = location.search;
  const result = usePublicProcedureDetail(procedureId);
  const procedure = result.data;
  const heading = useRef<HTMLHeadingElement>(null);
  const [sourceOpen, setSourceOpen] = useState(false);
  const listUrl = '/thu-tuc' + search;

  // Catalog trả danh sách công khai, không có số liệu xếp hạng lượt tìm kiếm.
  const popularQuery = usePublicProcedureList({ pageSize: 7 });


  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    heading.current?.focus({ preventScroll: true });
    setSourceOpen(false);
  }, [procedureId, procedure?.id]);

  if (result.isPending || result.isError) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <ProcedureFeedback
          loading={result.isPending}
          error={result.isError ? procedureError(result.error) : ''}
          retry={() => {
            void result.refetch();
          }}
        />
        <Link to={listUrl} className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-red-700 hover:underline">
          <ArrowLeft size={16} /> Quay lại danh mục thủ tục
        </Link>
      </div>
    );
  }

  if (!procedure) {
    return (
      <section className="mx-auto max-w-3xl px-5 py-16 text-center">
        <h1 ref={heading} tabIndex={-1} className="text-2xl font-bold text-slate-900">
          Không tìm thấy thủ tục
        </h1>
        <p className="my-5 text-slate-600">
          Thủ tục này chưa có trong danh mục đang công khai hoặc đã ngừng cung cấp.
        </p>
        <Link to={listUrl} className={buttonVariants({ variant: 'outline' })}>
          <ArrowLeft aria-hidden="true" /> Quay lại danh sách
        </Link>
      </section>
    );
  }

  const payload = procedure.contentPayload;
  const cases = payload.cases || [];
  // BE-H: danh sách cơ quan/địa chỉ có thể nhiều mục; ghép thành một dòng để hiển thị trong bảng thông tin chung
  const joinList = (...lists: (string[] | string | null | undefined)[]) => lists.flat().map(x => x?.trim()).filter(Boolean).join('; ');
  // 1 trường hợp: bước của trường hợp nối sau bước chung; nhiều trường hợp: mỗi trường hợp một accordion (chỉ khi có bước riêng)
  const sharedSteps = [...(payload.commonSteps ?? []), ...(cases.length === 1 ? cases[0].steps : [])];
  const caseSteps = cases.length > 1 && cases.some(c => c.steps.length) ? cases : [];
  const checklist = procedure.checklistSchema || [];
  const allForms = procedure.formDefinitions || [];
  // WF-CASE-01: từ 2 trường hợp người dân phải tự chọn ở bước tạo hồ sơ; không chọn sẵn trường hợp đầu tiên.
  const prepareUrl = (caseCode?: string) =>
    `/cong-dan?section=dossiers_all&procedureId=${encodeURIComponent(procedure.id)}${caseCode ? `&caseCode=${encodeURIComponent(caseCode)}` : ''}`;
  const methodCaseName = (code?: string | null) => caseDisplayName(code, cases);


  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 antialiased pb-16">
      {/* Breadcrumbs Navigation */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-[1240px] px-4 py-3 sm:px-6">
          <nav aria-label="Đường dẫn" className="flex flex-wrap items-center gap-1.5 text-xs sm:text-sm text-slate-600">
            <Link to="/" className="inline-flex items-center gap-1 hover:text-red-700">
              <House size={14} /> Trang chủ
            </Link>
            <CaretRight size={12} className="text-slate-400" />
            <Link to={listUrl} className="hover:text-red-700">
              Thủ tục hành chính
            </Link>
            <CaretRight size={12} className="text-slate-400" />
            <span aria-current="page" className="font-semibold text-slate-800 line-clamp-1">
              Chi tiết thủ tục
            </span>
          </nav>
        </div>
      </div>

      {/* Main Container 2 Columns */}
      <main className="mx-auto max-w-[1240px] px-4 py-6 sm:px-6">
        {/* Title Area */}
        <div className="mb-4">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <h1
              ref={heading}
              tabIndex={-1}
              // Tên thủ tục có thể rất dài: cho xuống dòng tự nhiên, không cắt chữ.
              className="min-w-0 flex-1 break-wordstext-xl sm:text-2xl md:text-[26px] font-bold text-slate-900 leading-snug tracking-tight"
            >
              {procedure.title}
            </h1>
            <Link
              to={prepareUrl()}
              className={`${buttonVariants({ variant: 'primary' })} shrink-0 self-start whitespace-nowrap`}
            >
              Chuẩn bị hồ sơ
            </Link>
          </div>
        </div>

        {(procedure.pdfFileName || procedure.originalPdfUrl) && <section aria-label="Văn bản nguồn công bố" className="mb-6 flex min-w-0 flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex min-w-0 flex-1 items-center gap-3"><FilePdf size={28} weight="fill" className="shrink-0 text-red-700" /><div className="min-w-0"><h2 className="text-sm font-semibold text-slate-900">Văn bản nguồn công bố</h2><p title={procedure.pdfFileName || undefined} className="mt-1 line-clamp-2 break-all text-sm text-slate-600">{procedure.pdfFileName || 'Tệp công bố thủ tục (PDF)'}</p></div></div>
          <Button variant="outline" onClick={() => setSourceOpen(true)}>Xem trước tệp</Button>
          <Modal open={sourceOpen} onOpenChange={setSourceOpen} title="Xem trước văn bản nguồn" description="Tệp PDF công bố thủ tục. Có thể mở trong tab mới để xem rộng hơn." className="sm:max-w-6xl" bodyClassName="p-0"><div className="h-[70dvh] min-h-64 min-w-0">{sourceOpen && <PdfSource id={procedure.id} allowFullscreen={false} />}</div></Modal>
        </section>}

        {/* 2-Column Split: Left Column (70%) & Right Column (30%) */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
          {/* CỘT TRÁI: Nội dung chi tiết thủ tục (8/12 cột = ~67%) */}
          <div className="min-w-0 lg:col-span-8 space-y-6">
            {/* 1. BẢNG THÔNG TIN CHUNG (Grid table kẻ viền xám theo mẫu Cổng DVCQG) */}
            <div className="overflow-hidden rounded-md border border-slate-300 bg-white shadow-2xs">
              <table aria-label="Thông tin chung của thủ tục" className="procedure-info-table w-full border-collapse text-xs sm:text-sm">
                <tbody>
                  {/* Hàng 1: Tên thủ tục */}
                  <tr className="border-b border-slate-200">
                    <td className="w-[140px] sm:w-[170px] bg-[#f8fafc] p-2.5 font-semibold text-slate-700 border-r border-slate-200 align-top">
                      Tên thủ tục
                    </td>
                    <td colSpan={3} className="p-2.5 font-medium text-slate-900">
                      {procedure.title}
                    </td>
                  </tr>

                  {/* Hàng 2: Mã thủ tục & Số quyết định */}
                  <tr className="border-b border-slate-200">
                    <td className="bg-[#f8fafc] p-2.5 font-semibold text-slate-700 border-r border-slate-200">
                      Mã thủ tục
                    </td>
                    <td className="p-2.5 text-slate-900 border-r border-slate-200 w-1/3">
                      {procedure.procedureCode}
                    </td>
                    <td className="bg-[#f8fafc] p-2.5 font-semibold text-slate-700 border-r border-slate-200 w-[140px] sm:w-[150px]">
                      Số quyết định
                    </td>
                    <td className="p-2.5 text-slate-900">
                      {payload.decisionNumber || 'Chưa cập nhật'}
                    </td>
                  </tr>

                  {/* Hàng 3: Cấp thực hiện & Loại thủ tục */}
                  <tr className="border-b border-slate-200">
                    <td className="bg-[#f8fafc] p-2.5 font-semibold text-slate-700 border-r border-slate-200">
                      Cấp thực hiện
                    </td>
                    <td className="p-2.5 text-slate-900 border-r border-slate-200">
                      {procedure.levelOfImplementation || joinList(payload.levels) || 'Chưa cập nhật'}
                    </td>
                    <td className="bg-[#f8fafc] p-2.5 font-semibold text-slate-700 border-r border-slate-200">
                      Loại thủ tục
                    </td>
                    <td className="p-2.5 text-slate-900">
                      {payload.procedureType || 'Chưa cập nhật'}
                    </td>
                  </tr>

                  {/* Hàng 4: Lĩnh vực & Đối tượng thực hiện */}
                  <tr className="border-b border-slate-200">
                    <td className="bg-[#f8fafc] p-2.5 font-semibold text-slate-700 border-r border-slate-200">
                      Lĩnh vực
                    </td>
                    <td className="p-2.5 text-slate-900 border-r border-slate-200">
                      {procedure.categoryName}
                    </td>
                    <td className="bg-[#f8fafc] p-2.5 font-semibold text-slate-700 border-r border-slate-200">
                      Đối tượng thực hiện
                    </td>
                    <td className="p-2.5 text-slate-900">
                      {procedure.targetAudience || 'Chưa cập nhật'}
                    </td>
                  </tr>

                  {/* Hàng 5: Cơ quan có thẩm quyền & Địa chỉ tiếp nhận */}
                  <tr className="border-b border-slate-200">
                    <td className="bg-[#f8fafc] p-2.5 font-semibold text-slate-700 border-r border-slate-200">
                      Cơ quan có thẩm quyền
                    </td>
                    <td className="p-2.5 text-slate-900 border-r border-slate-200">
                      {joinList(payload.competentAuthorities) || procedure.issuingAuthority || procedure.executingAgency || 'Ủy ban nhân dân cấp xã/phường'}
                    </td>
                    <td className="bg-[#f8fafc] p-2.5 font-semibold text-slate-700 border-r border-slate-200">
                      Địa chỉ tiếp nhận HS
                    </td>
                    <td className="p-2.5 text-slate-900">
                      {joinList(payload.receivingAddress, payload.receivingAddresses) || 'Bộ phận một cửa UBND cấp xã/phường'}
                    </td>
                  </tr>

                  {/* Hàng 6: Cơ quan được ủy quyền & Cơ quan phối hợp */}
                  <tr>
                    <td className="bg-[#f8fafc] p-2.5 font-semibold text-slate-700 border-r border-slate-200">
                      Cơ quan được ủy quyền
                    </td>
                    <td className="p-2.5 text-slate-900 border-r border-slate-200">
                      {joinList(payload.authorizedAgencies) || 'Không có thông tin'}
                    </td>
                    <td className="bg-[#f8fafc] p-2.5 font-semibold text-slate-700 border-r border-slate-200">
                      Cơ quan phối hợp
                    </td>
                    <td className="p-2.5 text-slate-900">
                      {joinList(payload.coordinatingAgencies) || 'Không có thông tin'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 2. THỦ TỤC HÀNH CHÍNH LIÊN QUAN */}
            <div>
              <h2 className="text-sm font-bold text-[#b91c1c] mb-1">
                Thủ tục hành chính liên quan
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">Không có thông tin</p>
            </div>

            {/* 3. TRÌNH TỰ THỰC HIỆN */}
            <section className="space-y-3">
              <h2 className="text-base sm:text-lg font-bold text-[#b91c1c]">
                Trình tự thực hiện
              </h2>

              {/* WF-CASE-01: bước chung luôn hiện; bước riêng của từng trường hợp xem bằng accordion như Thành phần hồ sơ */}
              <div className="rounded-md border border-slate-200 bg-white p-4 sm:p-5 text-xs sm:text-sm leading-relaxed text-slate-800 space-y-4">
                {sharedSteps.length > 0 && <StepList steps={sharedSteps} />}
                {caseSteps.length > 0 && (
                  <div className="space-y-2">
                    {caseSteps.map(c => (
                      <details key={c.caseCode} className="group rounded-md border border-slate-200">
                        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 font-semibold text-slate-900 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-red-800">
                          <span className="min-w-0 break-words">Bước riêng: {c.caseName}</span>
                          <CaretRight size={14} className="shrink-0 text-slate-500 transition group-open:rotate-90" aria-hidden />
                        </summary>
                        <div className="border-t border-slate-100 p-3">
                          {c.steps.length ? <StepList steps={c.steps} /> : <p className="text-slate-500">Thực hiện theo các bước chung.</p>}
                        </div>
                      </details>
                    ))}
                  </div>
                )}
                {payload.stepsText?.trim() && (sharedSteps.length > 0 || caseSteps.length > 0 ? (
                  // FE-08: các bước có cấu trúc là bản tóm tắt; văn bản trình tự đầy đủ mở bằng "Xem đầy đủ"
                  <details className="group border-t border-slate-100 pt-3">
                    <summary className="cursor-pointer rounded font-semibold text-red-800 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-800 focus-visible:ring-offset-2">
                      <span className="group-open:hidden">Xem đầy đủ trình tự thực hiện</span>
                      <span className="hidden group-open:inline">Thu gọn</span>
                    </summary>
                    <p className="mt-2 whitespace-pre-line">{payload.stepsText}</p>
                  </details>
                ) : <p className="whitespace-pre-line">{payload.stepsText}</p>)}
                {!sharedSteps.length && !caseSteps.length && !payload.stepsText?.trim() && (
                  <p className="text-slate-500">Thủ tục chưa cập nhật trình tự thực hiện.</p>
                )}
              </div>
            </section>

            {/* 4. CÁCH THỨC THỰC HIỆN (Bảng 4 cột chuẩn Cổng DVCQG) */}
            <section className="space-y-3">
              <h2 className="text-base sm:text-lg font-bold text-[#b91c1c]">
                Cách thức thực hiện
              </h2>

              <div className="overflow-x-auto rounded-md border border-slate-200 bg-white shadow-2xs">
                <table aria-label="Cách thức thực hiện và lệ phí" className="w-full min-w-[560px] table-fixed border-collapse text-left text-xs sm:text-sm [&_td]:align-top [&_td]:whitespace-normal [&_td]:break-words [&_td]:[overflow-wrap:anywhere]">
                  <thead>
                    <tr className="bg-[#eaeff5] text-slate-800 font-semibold border-b-2 border-[#ca5116]">
                      <th scope="col" className="p-2.5 border-r border-slate-200 w-1/4">Hình thức nộp</th>
                      <th scope="col" className="p-2.5 border-r border-slate-200 w-1/4">Thời gian</th>
                      <th scope="col" className="p-2.5 border-r border-slate-200 w-1/4">Phí, lệ phí</th>
                      <th scope="col" className="p-2.5 w-1/4">Mô tả</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {payload.submissionMethods.length > 0 ? (
                      payload.submissionMethods.map((method, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/70">
                          <td className="p-2.5 border-r border-slate-200 font-medium text-slate-900">
                            {method.methodName}
                            {methodCaseName(method.caseCode) && (
                              <span className="mt-0.5 block text-xs font-normal text-slate-500">Áp dụng: {methodCaseName(method.caseCode)}</span>
                            )}
                          </td>
                          <td className="p-2.5 border-r border-slate-200 text-slate-700">
                            {methodTimeLabel(method) || procedure.processingTimeSummary || 'Chưa cập nhật'}
                          </td>
                          <td className="p-2.5 border-r border-slate-200 text-slate-700">
                            {methodFeeLabel(method) || procedure.feeSummary || 'Chưa cập nhật'}
                          </td>
                          <td className="p-2.5 text-slate-600">
                            {method.note || ''}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="p-4 text-center text-slate-500">
                          {[procedure.processingTimeSummary, procedure.feeSummary].filter(Boolean).join(' · ') || 'Chưa cập nhật thời hạn và lệ phí'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {/* 5. THÀNH PHẦN HỒ SƠ: giấy tờ xuất trình, nộp chung và từng trường hợp (WF-CASE-01) */}
            <section className="space-y-4">
              <h2 className="text-base sm:text-lg font-bold text-[#b91c1c]">
                Thành phần hồ sơ
              </h2>
              {allForms.length > 0 && (
                <p className="text-xs text-slate-500">
                  Bấm <strong>Tải mẫu</strong> để tải phôi trống về máy hoặc <strong>Xem</strong> để xem trước nội dung. Tải hoặc điền mẫu chưa phải là gửi hồ sơ tiền kiểm.
                </p>
              )}
              <ProcedureDocumentsView
                checklist={checklist}
                forms={allForms}
                cases={cases}
                renderForms={formsOfItem => <FormCell formsOfItem={formsOfItem} />}
                caseAction={requiresCaseChoice(cases) ? caseCode => (
                  <Link to={prepareUrl(caseCode)} className={`${buttonVariants({ variant: 'outline', size: 'small' })} w-full sm:w-auto`}>
                    Chuẩn bị hồ sơ cho trường hợp này
                  </Link>
                ) : undefined}
              />
            </section>

            {/* 6. CĂN CỨ PHÁP LÝ */}
            {payload.legalReferences && payload.legalReferences.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-base sm:text-lg font-bold text-[#b91c1c]">
                  Căn cứ pháp lý
                </h2>

                <div className="overflow-x-auto rounded-md border border-slate-200 bg-white shadow-2xs">
                  <table className="w-full border-collapse text-left text-xs sm:text-sm">
                    {/* PROC-LEGAL-01: có ngày/cơ quan ban hành → bảng 4 cột Cổng DVC; không thì giữ 2 cột như cũ */}
                    <thead>
                      {hasFourColumnLegal(payload.legalReferences) ? (
                        <tr className="bg-[#eaeff5] text-slate-800 font-semibold border-b-2 border-[#ca5116]">
                          <th scope="col" className="p-2.5 border-r border-slate-200">Số ký hiệu</th>
                          <th scope="col" className="p-2.5 border-r border-slate-200">Trích yếu</th>
                          <th scope="col" className="p-2.5 border-r border-slate-200 whitespace-nowrap">Ngày ban hành</th>
                          <th scope="col" className="p-2.5 whitespace-nowrap min-w-[140px]">Cơ quan ban hành</th>
                        </tr>
                      ) : (
                        <tr className="bg-[#eaeff5] text-slate-800 font-semibold border-b-2 border-[#ca5116]">
                          <th scope="col" className="p-2.5 border-r border-slate-200 w-3/4">Tên văn bản pháp lý</th>
                          <th scope="col" className="p-2.5 w-1/4">Mã văn bản</th>
                        </tr>
                      )}
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {payload.legalReferences.map((ref, idx) => hasFourColumnLegal(payload.legalReferences) ? (
                        <tr key={idx} className="hover:bg-slate-50/70">
                          <td className="p-2.5 border-r border-slate-200 font-medium text-slate-900">{ref.documentNumber}</td>
                          <td className="p-2.5 border-r border-slate-200 text-slate-800 leading-relaxed">{ref.documentName}</td>
                          <td className="p-2.5 border-r border-slate-200 text-slate-800 whitespace-nowrap">{legalIssueDate(ref.issueDate)}</td>
                          <td className="p-2.5 text-slate-800 whitespace-nowrap">{ref.authority}</td>
                        </tr>
                      ) : (
                        <tr key={idx} className="hover:bg-slate-50/70">
                          <td className="p-2.5 border-r border-slate-200 text-slate-800 leading-relaxed">
                            {ref.documentName}
                          </td>
                          <td className="p-2.5 font-medium text-slate-900 whitespace-nowrap">
                            {ref.documentNumber}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* CƠ QUAN THỰC HIỆN */}
            {joinList(payload.executingAgencies, procedure.executingAgency) && (
              <section className="space-y-2">
                <h2 className="text-base sm:text-lg font-bold text-[#b91c1c]">Cơ quan thực hiện</h2>
                <p className="rounded-md border border-slate-200 bg-white p-4 text-xs sm:text-sm text-slate-800">
                  {joinList(payload.executingAgencies, procedure.executingAgency)}
                </p>
              </section>
            )}

            {/* YÊU CẦU, ĐIỀU KIỆN THỰC HIỆN */}
            {payload.requirements && (
              <section className="space-y-2">
                <h2 className="text-base sm:text-lg font-bold text-[#b91c1c]">Yêu cầu, điều kiện thực hiện</h2>
                <p className="whitespace-pre-line rounded-md border border-slate-200 bg-white p-4 text-xs sm:text-sm leading-relaxed text-slate-800">
                  {payload.requirements}
                </p>
              </section>
            )}

            {/* 7. KẾT QUẢ THỰC HIỆN (kèm mã kết quả nếu có) */}
            {payload.resultDetails && payload.resultDetails.length > 0 ? (
              <section className="space-y-2">
                <h2 className="text-base sm:text-lg font-bold text-[#b91c1c]">Kết quả thực hiện</h2>
                <div className="rounded-md border border-slate-200 bg-white p-4 text-xs sm:text-sm text-slate-800 space-y-2">
                  {payload.resultDetails.map((res, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="text-red-700 font-bold">•</span>
                      <div className="min-w-0">
                        <p>{res.name}</p>
                        {(res.code || res.validity || res.note) && (
                          <p className="mt-0.5 text-slate-500">
                            {[res.code && `Mã: ${res.code}`, res.validity && `Hiệu lực: ${res.validity}`, res.note].filter(Boolean).join(' · ')}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ) : payload.results && payload.results.length > 0 && (
              <section className="space-y-2">
                <h2 className="text-base sm:text-lg font-bold text-[#b91c1c]">
                  Kết quả thực hiện
                </h2>
                <div className="rounded-md border border-slate-200 bg-white p-4 text-xs sm:text-sm text-slate-800 space-y-1.5">
                  {payload.results.map((res, idx) => (
                    <p key={idx} className="flex items-start gap-2">
                      <span className="text-red-700 font-bold">•</span>
                      <span>{res}</span>
                    </p>
                  ))}
                </div>
              </section>
            )}

            {/* MÔ TẢ */}
            {payload.description && (
              <section className="space-y-2">
                <h2 className="text-base sm:text-lg font-bold text-[#b91c1c]">Mô tả</h2>
                <p className="whitespace-pre-line rounded-md border border-slate-200 bg-white p-4 text-xs sm:text-sm leading-relaxed text-slate-800">{payload.description}</p>
              </section>
            )}

            {/* THÔNG TIN KHÁC (mục mở rộng, giữ đúng thứ tự) */}
            {payload.additionalSections?.map((section, idx) => (
              <section key={idx} className="space-y-2">
                <h2 className="text-base sm:text-lg font-bold text-[#b91c1c]">{section.title}</h2>
                <p className="whitespace-pre-line rounded-md border border-slate-200 bg-white p-4 text-xs sm:text-sm leading-relaxed text-slate-800">{section.content}</p>
              </section>
            ))}
          </div>

          {/* CỘT PHẢI: SIDEBAR TIỆN ÍCH (4/12 cột = ~33%) */}
          <aside className="lg:col-span-4 space-y-5 lg:sticky lg:top-20">

            {/* CARD 2: TÌM KIẾM NHIỀU NHẤT */}
            <div className="rounded-lg border border-slate-300 bg-white shadow-xs overflow-hidden">
              <div className="bg-[#f8fafc] px-4 py-2.5 border-b border-slate-200">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Thủ tục khác
                </h3>
              </div>

              <div className="divide-y divide-slate-100">
                {popularQuery.data?.items?.some(item => item.id !== procedure.id) ? (
                  popularQuery.data.items.filter(item => item.id !== procedure.id).slice(0, 7).map((item: ProcedureSummary) => (
                    <Link
                      key={item.id}
                      to={`/thu-tuc/${item.id}`}
                      className="group flex items-start gap-2 p-3 text-xs sm:text-[13px] hover:bg-slate-50 transition-colors"
                    >
                      <CaretRight size={14} className="text-red-700 mt-0.5 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-800 group-hover:text-red-800 line-clamp-2 leading-snug">
                          {item.title}
                        </p>
                        <p className="mt-0.5 text-[11px] text-slate-500">
                          {item.categoryName || item.levelOfImplementation}
                        </p>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="p-3 text-sm text-slate-600">
                    <ProcedureFeedback loading={popularQuery.isPending} error={popularQuery.isError ? procedureError(popularQuery.error) : ''} retry={() => void popularQuery.refetch()} />
                    {!popularQuery.isPending && !popularQuery.isError && <p>Chưa có thủ tục khác trong danh mục.</p>}
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

/** Ô "Mẫu đơn, tờ khai": mỗi mẫu một dòng có nút Tải mẫu / Xem; không có mẫu thì hiện gạch ngang */
function FormCell({ formsOfItem }: { formsOfItem: { formCode: string; formName: string; formTemplateId?: string | null }[] }) {
  if (!formsOfItem.length) return <span className="text-slate-400">—</span>;
  return (
    <div className="space-y-3">
      {formsOfItem.map((form, idx) => (
        <ProcedureFormLink key={`${form.formCode}-${idx}`} templateId={form.formTemplateId} name={form.formName || form.formCode} />
      ))}
    </div>
  );
}

/** Danh sách bước thực hiện (thứ tự, tên, người thực hiện, nội dung). */
function StepList({ steps }: { steps: { stepOrder: number; stepName: string; executor: string; actionDetails: string }[] }) {
  return (
    <div className="space-y-4">
      {steps.map((step, idx) => (
        <div key={idx} className="space-y-1">
          <p className="font-semibold text-slate-900">
            {step.stepOrder}. {step.stepName}
            {step.executor && <span className="font-normal text-slate-500"> ({step.executor})</span>}
          </p>
          {step.actionDetails && <p className="whitespace-pre-line border-l-2 border-slate-200 pl-4 text-slate-700">{step.actionDetails}</p>}
        </div>
      ))}
    </div>
  );
}
