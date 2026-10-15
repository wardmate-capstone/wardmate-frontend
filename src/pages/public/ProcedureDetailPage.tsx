import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  CaretRight,
  FilePdf,
  House,
} from '@phosphor-icons/react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { buttonVariants } from '@/components/ui';
import { procedureError, type ProcedureSummary } from '@/lib/api/procedures';
import { usePublicProcedureDetail, usePublicProcedureList } from '@/hooks/useProcedureCategories';
import { ProcedureFeedback } from '@/components/ui/ProcedureFeedback';
import { PdfSource } from '@/pages/procedure-manager/ProcedureDraftWorkspace';
import { FormTemplateActions } from '@/components/forms/FormTemplateActions';

export function ProcedureDetailPage() {
  const { procedureId } = useParams();
  const location = useLocation();
  const search = location.search;
  const result = usePublicProcedureDetail(procedureId);
  const procedure = result.data;
  const heading = useRef<HTMLHeadingElement>(null);
  const listUrl = '/thu-tuc' + search;

  // Danh sách thủ tục tìm kiếm nhiều nhất (dùng TanStack Query cache an toàn)
  const popularQuery = usePublicProcedureList({ pageSize: 7 });

  // State chọn trường hợp nếu thủ tục có nhiều case
  const [selectedCaseIdx, setSelectedCaseIdx] = useState(0);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    heading.current?.focus({ preventScroll: true });
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
  const activeCase = cases[selectedCaseIdx] || cases[0];
  const checklist = procedure.checklistSchema || [];
  const forms = (procedure.formDefinitions || []).filter(form => !form.caseCode || !activeCase || form.caseCode === activeCase.caseCode);

  // Lọc checklist theo trường hợp
  const currentChecklist = checklist.filter((item) => {
    if (!item.caseCode) return true;
    if (!activeCase) return true;
    return item.caseCode === activeCase.caseCode;
  });

  const nopItems = currentChecklist.filter((item) => item.submissionType === 'NOP');
  const xuatTrinhItems = currentChecklist.filter((item) => item.submissionType === 'XUAT_TRINH');

  const getCopyTypeLabel = (type: string) => {
    switch (type) {
      case 'ORIGINAL':
        return 'bản chính';
      case 'CERTIFIED_COPY':
        return 'bản sao chứng thực';
      case 'REGULAR_COPY':
        return 'bản sao thường';
      default:
        return 'bản';
    }
  };

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
              className="text-xl sm:text-2xl md:text-[26px] font-bold text-slate-900 leading-snug tracking-tight"
            >
              {procedure.title}
            </h1>
            <Link
              to={`/cong-dan?section=dossiers_all&procedureId=${encodeURIComponent(procedure.id)}${activeCase?.caseCode ? `&caseCode=${encodeURIComponent(activeCase.caseCode)}` : ''}`}
              className={buttonVariants({ variant: 'primary' })}
            >
              Chuẩn bị hồ sơ
            </Link>
          </div>

          {/* PDF Source Icon under Title */}
          {procedure.originalPdfUrl ? (
            <a
              href={procedure.originalPdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2.5 inline-flex items-center gap-2 text-red-600 hover:text-red-700 group transition-colors"
              title="Xem tệp PDF công bố gốc"
            >
              <FilePdf size={32} weight="fill" className="text-red-600 group-hover:scale-105 transition-transform" />
              <span className="text-xs font-semibold underline text-slate-600 group-hover:text-red-700">
                {procedure.pdfFileName || 'Tệp văn bản công bố thủ tục (PDF)'}
              </span>
            </a>
          ) : (
            <div className="mt-2.5 inline-flex items-center gap-1.5 text-slate-500 text-xs">
              <FilePdf size={28} weight="fill" className="text-red-600" />
              <span>Văn bản điện tử trích lục</span>
            </div>
          )}
        </div>

        {/* 2-Column Split: Left Column (70%) & Right Column (30%) */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
          {/* CỘT TRÁI: Nội dung chi tiết thủ tục (8/12 cột = ~67%) */}
          <div className="lg:col-span-8 space-y-6">
            {/* 1. BẢNG THÔNG TIN CHUNG (Grid table kẻ viền xám theo mẫu Cổng DVCQG) */}
            <div className="overflow-hidden rounded-md border border-slate-300 bg-white shadow-2xs">
              <table className="w-full border-collapse text-xs sm:text-sm">
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
                      {procedure.levelOfImplementation}
                    </td>
                    <td className="bg-[#f8fafc] p-2.5 font-semibold text-slate-700 border-r border-slate-200">
                      Loại thủ tục
                    </td>
                    <td className="p-2.5 text-slate-900">
                      TTHC không được luật giao cho địa phương quy định
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
                      {procedure.targetAudience}
                    </td>
                  </tr>

                  {/* Hàng 5: Cơ quan có thẩm quyền & Địa chỉ tiếp nhận */}
                  <tr className="border-b border-slate-200">
                    <td className="bg-[#f8fafc] p-2.5 font-semibold text-slate-700 border-r border-slate-200">
                      Cơ quan có thẩm quyền
                    </td>
                    <td className="p-2.5 text-slate-900 border-r border-slate-200">
                      {procedure.issuingAuthority || procedure.executingAgency || 'Ủy ban nhân dân cấp xã/phường'}
                    </td>
                    <td className="bg-[#f8fafc] p-2.5 font-semibold text-slate-700 border-r border-slate-200">
                      Địa chỉ tiếp nhận HS
                    </td>
                    <td className="p-2.5 text-slate-900">
                      {payload.receivingAddress || 'Bộ phận một cửa UBND cấp xã/phường'}
                    </td>
                  </tr>

                  {/* Hàng 6: Cơ quan được ủy quyền & Cơ quan phối hợp */}
                  <tr>
                    <td className="bg-[#f8fafc] p-2.5 font-semibold text-slate-700 border-r border-slate-200">
                      Cơ quan được ủy quyền
                    </td>
                    <td className="p-2.5 text-slate-900 border-r border-slate-200">
                      {procedure.executingAgency || 'Không có thông tin'}
                    </td>
                    <td className="bg-[#f8fafc] p-2.5 font-semibold text-slate-700 border-r border-slate-200">
                      Cơ quan phối hợp
                    </td>
                    <td className="p-2.5 text-slate-900">
                      Không có thông tin
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
                Trình Tự Thực Hiện
              </h2>

              {cases.length > 1 && (
                <div className="flex flex-wrap gap-1.5 border-b border-slate-200 pb-2">
                  {cases.map((c, idx) => (
                    <button
                      key={c.caseCode || idx}
                      type="button"
                      onClick={() => setSelectedCaseIdx(idx)}
                      className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                        selectedCaseIdx === idx
                          ? 'bg-red-800 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {c.caseName || `Trường hợp ${idx + 1}`}
                    </button>
                  ))}
                </div>
              )}

              <div className="rounded-md border border-slate-200 bg-white p-4 sm:p-5 text-xs sm:text-sm leading-relaxed text-slate-800 space-y-4">
                {activeCase?.steps && activeCase.steps.length > 0 ? (
                  activeCase.steps.map((step) => (
                    <div key={step.stepOrder} className="space-y-1">
                      <p className="font-semibold text-slate-900">
                        {step.stepOrder}. {step.stepName}
                        {step.executor && (
                          <span className="text-slate-500 font-normal"> ({step.executor})</span>
                        )}
                      </p>
                      <p className="whitespace-pre-line text-slate-700 pl-4 border-l-2 border-slate-200">
                        {step.actionDetails}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="whitespace-pre-line">
                    - Người yêu cầu nộp hồ sơ trực tiếp tại Bộ phận Một cửa UBND cấp xã/phường hoặc nộp trực tuyến qua Cổng Dịch vụ công.
                    {'\n'}- Cán bộ tiếp nhận kiểm tra tính đầy đủ, hợp lệ của thành phần hồ sơ và cấp giấy tiếp nhận/hẹn trả kết quả.
                    {'\n'}- Cơ quan có thẩm quyền xử lý, thẩm tra và ban hành kết quả theo quy định.
                  </p>
                )}
              </div>
            </section>

            {/* 4. CÁCH THỨC THỰC HIỆN (Bảng 4 cột chuẩn Cổng DVCQG) */}
            <section className="space-y-3">
              <h2 className="text-base sm:text-lg font-bold text-[#b91c1c]">
                Cách Thức Thực Hiện
              </h2>

              <div className="overflow-x-auto rounded-md border border-slate-200 bg-white shadow-2xs">
                <table className="w-full border-collapse text-left text-xs sm:text-sm">
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
                          </td>
                          <td className="p-2.5 border-r border-slate-200 text-slate-700">
                            {method.estimatedDays && method.estimatedDays > 0
                              ? `${method.estimatedDays} ngày làm việc`
                              : procedure.processingTimeSummary || 'Trong ngày'}
                          </td>
                          <td className="p-2.5 border-r border-slate-200 text-slate-700">
                            {method.feeAmount === 0
                              ? 'Miễn phí'
                              : `${method.feeAmount.toLocaleString('vi-VN')} ${method.feeUnit}`}
                          </td>
                          <td className="p-2.5 text-slate-600">
                            {method.note || ''}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="p-4 text-center text-slate-500">
                          {procedure.processingTimeSummary} · {procedure.feeSummary}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {/* 5. THÀNH PHẦN HỒ SƠ (Bảng phân chia Giấy tờ phải nộp & Giấy tờ phải xuất trình) */}
            <section className="space-y-4">
              <h2 className="text-base sm:text-lg font-bold text-[#b91c1c]">
                Thành phần hồ sơ
              </h2>

              {/* Bảng Giấy tờ phải nộp */}
              {forms.length > 0 && <section aria-label="Biểu mẫu của thủ tục" className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
                <h3 className="font-bold">Biểu mẫu, tờ khai</h3>
                <p className="text-sm text-slate-600">Tải phôi trống để chuẩn bị hồ sơ. Tải hoặc điền mẫu chưa phải gửi hồ sơ tiền kiểm.</p>
                {forms.map((form, index) => <div key={`${form.formTemplateId ?? form.formCode}-${index}`} className="space-y-2 border-t border-slate-100 pt-3">
                  <p className="font-semibold">{form.formCode} · {form.formName}</p>
                  <p className="text-sm text-slate-600">{form.quantity} bản · {form.isMandatory ? 'Bắt buộc' : 'Theo nhu cầu'}</p>
                  <FormTemplateActions templateId={form.formTemplateId} name={form.formName} />
                </div>)}
              </section>}
              <div className="space-y-2">
                <p className="text-xs sm:text-sm font-semibold text-slate-800 italic">
                  * Giấy tờ phải nộp:
                </p>

                <div className="overflow-x-auto rounded-md border border-slate-200 bg-white shadow-2xs">
                  <table className="w-full border-collapse text-left text-xs sm:text-sm">
                    <thead>
                      <tr className="bg-[#eaeff5] text-slate-800 font-semibold border-b-2 border-[#ca5116]">
                        <th scope="col" className="p-2.5 border-r border-slate-200 w-1/2">Tên giấy tờ</th>
                        <th scope="col" className="p-2.5 border-r border-slate-200 w-1/4 text-center">Mẫu đơn, tờ khai</th>
                        <th scope="col" className="p-2.5 w-1/4 text-center">Số lượng</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {nopItems.length > 0 ? (
                        nopItems.map((item, idx) => {
                          return (
                            <tr key={item.checklistId || idx} className="hover:bg-slate-50/70">
                              <td className="p-2.5 border-r border-slate-200">
                                <p className="font-medium text-slate-900">{item.itemName}</p>
                                {item.conditionNote && (
                                  <p className="mt-1 text-xs text-slate-500 italic">
                                    Ghi chú: {item.conditionNote}
                                  </p>
                                )}
                              </td>
                              <td className="p-2.5 border-r border-slate-200 text-center text-slate-600">
                                <span className="text-slate-400">—</span>
                              </td>
                              <td className="p-2.5 text-center text-slate-800 font-medium">
                                {item.quantity} {getCopyTypeLabel(item.documentCopyType)}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={3} className="p-3 text-center text-slate-500">
                            Không yêu cầu thêm giấy tờ nộp kèm ngoài tờ khai chính.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Bảng Giấy tờ phải xuất trình */}
              <div className="space-y-2 pt-2">
                <p className="text-xs sm:text-sm font-semibold text-slate-800 italic">
                  * Giấy tờ phải xuất trình:
                </p>

                <div className="overflow-x-auto rounded-md border border-slate-200 bg-white shadow-2xs">
                  <table className="w-full border-collapse text-left text-xs sm:text-sm">
                    <thead>
                      <tr className="bg-[#eaeff5] text-slate-800 font-semibold border-b-2 border-[#ca5116]">
                        <th scope="col" className="p-2.5 border-r border-slate-200 w-1/2">Tên giấy tờ</th>
                        <th scope="col" className="p-2.5 border-r border-slate-200 w-1/4 text-center">Mẫu đơn, tờ khai</th>
                        <th scope="col" className="p-2.5 w-1/4 text-center">Số lượng</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {xuatTrinhItems.length > 0 ? (
                        xuatTrinhItems.map((item, idx) => (
                          <tr key={item.checklistId || idx} className="hover:bg-slate-50/70">
                            <td className="p-2.5 border-r border-slate-200">
                              <p className="font-medium text-slate-900">{item.itemName}</p>
                              {item.conditionNote && (
                                <p className="mt-1 text-xs text-slate-500 italic">
                                  Ghi chú: {item.conditionNote}
                                </p>
                              )}
                            </td>
                            <td className="p-2.5 border-r border-slate-200 text-center text-slate-400">
                              —
                            </td>
                            <td className="p-2.5 text-center text-slate-800 font-medium">
                              {item.quantity} {getCopyTypeLabel(item.documentCopyType)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td className="p-2.5 border-r border-slate-200">
                            Thẻ Căn cước công dân / Thẻ căn cước hoặc Hộ chiếu còn giá trị sử dụng
                          </td>
                          <td className="p-2.5 border-r border-slate-200 text-center text-slate-400">
                            —
                          </td>
                          <td className="p-2.5 text-center text-slate-800 font-medium">
                            1 bản chính
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            {/* 6. CĂN CỨ PHÁP LÝ */}
            {payload.legalReferences && payload.legalReferences.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-base sm:text-lg font-bold text-[#b91c1c]">
                  Căn cứ pháp lý
                </h2>

                <div className="overflow-x-auto rounded-md border border-slate-200 bg-white shadow-2xs">
                  <table className="w-full border-collapse text-left text-xs sm:text-sm">
                    <thead>
                      <tr className="bg-[#eaeff5] text-slate-800 font-semibold border-b-2 border-[#ca5116]">
                        <th scope="col" className="p-2.5 border-r border-slate-200 w-3/4">Tên văn bản pháp lý</th>
                        <th scope="col" className="p-2.5 w-1/4">Mã văn bản</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {payload.legalReferences.map((ref, idx) => (
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

            {/* 7. KẾT QUẢ THỰC HIỆN */}
            {payload.results && payload.results.length > 0 && (
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

            {/* 8. PDF NGUỒN CÔNG BỐ */}
            {procedure.pdfFileName && (
              <section className="space-y-2">
                <h2 className="text-base sm:text-lg font-bold text-[#b91c1c]">
                  Tệp văn bản nguồn công bố
                </h2>
                <div className="rounded-md border border-slate-200 bg-white p-4 shadow-2xs">
                  <div className="flex items-center justify-between gap-4 mb-3">
                    <span className="text-xs font-semibold text-slate-700 truncate">
                      {procedure.pdfFileName}
                    </span>
                  </div>
                  <div className="h-[450px] w-full rounded border border-slate-200 overflow-hidden">
                    <PdfSource id={procedure.id} />
                  </div>
                </div>
              </section>
            )}
          </div>

          {/* CỘT PHẢI: SIDEBAR TIỆN ÍCH (4/12 cột = ~33%) */}
          <aside className="lg:col-span-4 space-y-5 lg:sticky lg:top-20">

            {/* CARD 2: TÌM KIẾM NHIỀU NHẤT */}
            <div className="rounded-lg border border-slate-300 bg-white shadow-xs overflow-hidden">
              <div className="bg-[#f8fafc] px-4 py-2.5 border-b border-slate-200">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Tìm kiếm nhiều nhất
                </h3>
              </div>

              <div className="divide-y divide-slate-100">
                {popularQuery.data?.items && popularQuery.data.items.length > 0 ? (
                  popularQuery.data.items.slice(0, 7).map((item: ProcedureSummary) => (
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
                  // Fallback các thủ tục phổ biến theo mẫu DVCQG
                  [
                    { title: 'Hỗ trợ phát triển sản xuất cộng đồng.', org: 'UBND tỉnh Sơn La' },
                    { title: 'Hưởng trợ cấp thất nghiệp (Cấp tỉnh)', org: 'Bộ Nội vụ' },
                    { title: 'Cấp Phiếu lý lịch tư pháp cho công dân Việt Nam, người nước ngoài...', org: 'Bộ Công an' },
                    { title: 'Thông báo hàng tháng về việc tìm kiếm việc làm (Cấp tỉnh)', org: 'Bộ Nội vụ' },
                    { title: 'Đăng ký biến động quyền sử dụng đất, quyền sở hữu tài sản gắn liền...', org: 'UBND tỉnh Gia Lai' },
                    { title: 'Cung cấp thông tin, dữ liệu đất đai', org: 'Bộ Nông nghiệp và Môi trường' },
                    { title: 'Thủ tục Chứng thực bản sao từ bản chính các giấy tờ, văn bản...', org: 'Bộ Ngoại giao' },
                  ].map((mock, idx) => (
                    <div key={idx} className="flex items-start gap-2 p-3 text-xs sm:text-[13px]">
                      <CaretRight size={14} className="text-red-700 mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-800 line-clamp-2 leading-snug">
                          {mock.title}
                        </p>
                        <p className="mt-0.5 text-[11px] text-slate-500">{mock.org}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
