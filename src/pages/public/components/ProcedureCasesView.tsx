import { useState, useId } from 'react';
import {
  FolderOpen,
  Info
} from '@phosphor-icons/react';
import type { ProcedureCase } from '@/lib/procedureContent';

interface ProcedureCasesViewProps {
  cases: ProcedureCase[];
}

export function ProcedureCasesView({
  cases,
}: ProcedureCasesViewProps) {
  const [selectedCaseCode, setSelectedCaseCode] = useState<string>(() => {
    return cases.length > 0 ? cases[0].caseCode : '';
  });

  const formId = useId();

  // Xác định Case đang chọn
  const activeCase = cases.find((c) => c.caseCode === selectedCaseCode) || cases[0];

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
                Trường hợp & Quy trình thực hiện
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Các trường hợp áp dụng và các bước xử lý tương ứng
              </p>
            </div>
          </div>

          {/* Tiêu đề đã rõ ràng, không trùng lặp nút bắt đầu làm thủ tục */}
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
                  {activeCase.description || 'Áp dụng cho các trường hợp đủ điều kiện thực hiện theo quy định.'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Các bước thực hiện trong Case */}
        {activeCase && activeCase.steps && activeCase.steps.length > 0 && (
          <div className="space-y-3">
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
