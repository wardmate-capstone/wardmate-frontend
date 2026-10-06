import { useState, useId } from 'react';
import {
  FolderOpen,
  Info,
  Files,
  DownloadSimple
} from '@phosphor-icons/react';
import type { ProcedureCase, ChecklistItem } from '@/lib/procedureContent';

interface ProcedureCasesViewProps {
  cases: ProcedureCase[];
  checklist?: ChecklistItem[];
}

export function ProcedureCasesView({
  cases,
  checklist = [],
}: ProcedureCasesViewProps) {
  const [selectedCaseCode, setSelectedCaseCode] = useState<string>(() => {
    return cases.length > 0 ? cases[0].caseCode : '';
  });

  const formId = useId();

  // Xác định Case đang chọn
  const activeCase = cases.find((c) => c.caseCode === selectedCaseCode) || cases[0];

  // Lọc danh mục giấy tờ theo trường hợp (những item có caseCode trùng hoặc áp dụng chung)
  const currentChecklist = checklist.filter((item) => {
    if (!item.caseCode) return true;
    if (!activeCase) return true;
    return item.caseCode === activeCase.caseCode;
  });

  const nopItems = currentChecklist.filter((item) => item.submissionType === 'NOP');
  const xuatTrinhItems = currentChecklist.filter((item) => item.submissionType === 'XUAT_TRINH');

  const handleDownloadTemplate = (item: ChecklistItem) => {
    if (!item.templateUrl) return;
    const url = new URL(item.templateUrl);
    if (['https:', 'http:'].includes(url.protocol) && !url.username && !url.password) window.open(url.href, '_blank', 'noopener,noreferrer');
  };

  const renderDocumentList = (items: ChecklistItem[], title: string, badgeColor: string) => {
    if (items.length === 0) return null;

    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className={`inline-block size-2 rounded-full ${badgeColor}`} />
          <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
            {title} ({items.length})
          </h4>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-2xs">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider">
                <th scope="col" className="w-12 py-3 px-3 text-center">STT</th>
                <th scope="col" className="py-3 px-4 min-w-[240px]">Tên giấy tờ, tài liệu</th>
                <th scope="col" className="py-3 px-4 w-32 text-center">Số lượng</th>
                <th scope="col" className="py-3 px-4 w-28 text-center">Yêu cầu</th>
                <th scope="col" className="py-3 px-4 w-36 text-right">Mẫu văn bản</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item, idx) => {
                const isForm = !!item.templateUrl;

                return (
                  <tr key={item.checklistId} className="hover:bg-slate-50/70 transition-colors">
                    {/* STT */}
                    <td className="py-3 px-3 text-center font-semibold text-slate-500 tabular-nums align-middle">
                      {idx + 1}
                    </td>

                    {/* Tên giấy tờ & Ghi chú */}
                    <td className="py-3 px-4 align-middle">
                      <p className="font-semibold text-slate-900 text-sm leading-snug">
                        {item.itemName}
                      </p>
                      {item.conditionNote && (
                        <p className="mt-1 text-xs text-slate-500 italic">
                          <span className="font-medium text-slate-600">Ghi chú:</span> {item.conditionNote}
                        </p>
                      )}
                    </td>

                    {/* Số lượng */}
                    <td className="py-3 px-4 text-center align-middle">
                      <span className="font-bold text-slate-900">{item.quantity}</span>{' '}
                      {item.documentCopyType === 'ORIGINAL' && <span className="text-xs font-semibold text-blue-700">bản chính</span>}
                      {item.documentCopyType === 'CERTIFIED_COPY' && <span className="text-xs font-semibold text-purple-700">bản sao chứng thực</span>}
                      {item.documentCopyType === 'REGULAR_COPY' && <span className="text-xs text-slate-600">bản sao thường</span>}
                    </td>

                    {/* Yêu cầu */}
                    <td className="py-3 px-4 text-center align-middle">
                      {item.isMandatory ? (
                        <span className="inline-block rounded-full bg-red-100 px-2.5 py-0.5 text-[11px] font-bold text-red-800">
                          Bắt buộc
                        </span>
                      ) : (
                        <span className="inline-block rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-600">
                          Tùy chọn
                        </span>
                      )}
                    </td>

                    {/* Tải mẫu */}
                    <td className="py-3 px-4 text-right align-middle">
                      {isForm ? (
                        <button
                          type="button"
                          onClick={() => handleDownloadTemplate(item)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:border-red-200 hover:bg-red-50 hover:text-red-800 transition-colors"
                          title={`Tải mẫu văn bản: ${item.itemName}`}
                        >
                          <DownloadSimple size={14} weight="bold" />
                          <span>Tải mẫu</span>
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Không có mẫu</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <section
      id="thanh-phan-ho-so"
      aria-labelledby="cases-title"
      className="procedure-detail-section !p-0 overflow-hidden border border-slate-200 bg-white shadow-xs rounded-xl"
    >
      {/* Tiêu đề mục chuẩn DVC */}
      <div className="border-b border-slate-200 bg-gradient-to-r from-red-50/70 via-white to-gold-50/40 px-5 py-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-lg bg-red-800 text-white shadow-xs">
              <FolderOpen size={18} weight="bold" />
            </span>
            <div>
              <h2 id="cases-title" className="!mb-0 !border-0 !p-0 text-xl font-bold text-red-950 sm:text-2xl">
                Thành phần hồ sơ theo trường hợp
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Xem danh mục giấy tờ cần chuẩn bị và tải mẫu tờ khai theo từng tình huống
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs trường hợp (Cases) thiết kế dạng tab bar Cổng DVC trực quan */}
      {cases.length > 0 && (
        <div className="border-b border-slate-200 bg-slate-50/90 px-4 pt-3 sm:px-6">
          <div id={`${formId}-cases-label`} className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            Trường hợp áp dụng:
          </div>
          <div
            role="tablist"
            aria-labelledby={`${formId}-cases-label`}
            className="flex gap-2 overflow-x-auto pb-3 scrollbar-thin"
          >
            {cases.map((c, idx) => {
              const isSelected = activeCase?.caseCode === c.caseCode;
              return (
                <button
                  key={c.caseCode}
                  role="tab"
                  id={`tab-${c.caseCode}`}
                  aria-selected={isSelected}
                  aria-controls={`panel-${c.caseCode}`}
                  tabIndex={isSelected ? 0 : -1}
                  onClick={() => setSelectedCaseCode(c.caseCode)}
                  onKeyDown={event => {
                    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
                    event.preventDefault();
                    const next = event.key === 'Home' ? 0 : event.key === 'End' ? cases.length - 1 : (idx + (event.key === 'ArrowRight' ? 1 : -1) + cases.length) % cases.length;
                    setSelectedCaseCode(cases[next].caseCode);
                    document.getElementById(`tab-${cases[next].caseCode}`)?.focus();
                  }}
                  className={`inline-flex shrink-0 items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${
                    isSelected
                      ? 'bg-red-800 text-white shadow-sm ring-2 ring-red-800/20'
                      : 'border border-slate-200 bg-white text-slate-700 hover:border-red-200 hover:bg-red-50/40 hover:text-red-800'
                  }`}
                >
                  <span
                    className={`grid size-5 place-items-center rounded-full text-[11px] font-bold ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <span>{c.caseName}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="p-5 sm:p-6 space-y-6">
        {/* Banner thông tin chi tiết của trường hợp */}
        {activeCase && (
          <div
            id={`panel-${activeCase.caseCode}`}
            role="tabpanel"
            aria-labelledby={`tab-${activeCase.caseCode}`}
            className="rounded-xl border border-amber-200/80 bg-amber-50/60 p-4 text-sm"
          >
            <div className="flex items-start gap-2.5">
              <Info size={19} weight="fill" className="shrink-0 text-amber-700 mt-0.5" />
              <div>
                <strong className="font-semibold text-slate-900">Điều kiện trường hợp: </strong>
                <span className="text-slate-700 leading-relaxed">
                  {activeCase.description || activeCase.caseName}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Danh mục giấy tờ cần thiết (Checklist để người dân đọc & tải template, KHÔNG CÓ CHECKBOX) */}
        <div className="space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
            <Files size={20} className="text-red-800" weight="bold" />
            <h3 className="text-base font-bold text-slate-900">
              Giấy tờ, tài liệu cần chuẩn bị
            </h3>
          </div>

          {currentChecklist.length === 0 ? (
            <p className="text-sm italic text-slate-500 py-3">
              Chưa có danh mục giấy tờ cụ thể cho trường hợp này. Vui lòng theo dõi cập nhật chính thức.
            </p>
          ) : (
            <div className="space-y-6">
              {renderDocumentList(nopItems, 'Giấy tờ, tài liệu phải nộp', 'bg-red-700')}
              {renderDocumentList(xuatTrinhItems, 'Giấy tờ phải xuất trình', 'bg-blue-700')}
            </div>
          )}
        </div>

        {/* Các bước quy trình giải quyết trong Case */}
        {activeCase && activeCase.steps && activeCase.steps.length > 0 && (
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <h3 className="text-base font-bold text-slate-900">
              Quy trình giải quyết theo các bước
            </h3>
            <ol className="relative border-l border-slate-200 ml-3.5 space-y-5">
              {activeCase.steps.map((st) => (
                <li key={st.stepOrder} className="ml-6">
                  <span className="absolute -left-3.5 flex size-7 items-center justify-center rounded-full bg-red-100 ring-4 ring-white text-xs font-bold text-red-800">
                    {st.stepOrder}
                  </span>
                  <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h4 className="font-bold text-sm text-slate-900">{st.stepName}</h4>
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                        Thực hiện: {st.executor}
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                      {st.actionDetails}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        )}

      </div>
    </section>
  );
}
