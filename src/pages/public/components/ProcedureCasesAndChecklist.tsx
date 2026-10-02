import { useState, useId } from 'react';
import {
  FileArrowDown,
  Info,
  CheckSquare,
  Square,
  Sparkle,
  WarningCircle,
  FolderOpen
} from '@phosphor-icons/react';
import type { ProcedureCase, ChecklistItem } from '@/lib/procedureContent';

interface ProcedureCasesAndChecklistProps {
  cases: ProcedureCase[];
  checklist: ChecklistItem[];
}

export function ProcedureCasesAndChecklist({
  cases,
  checklist,
}: ProcedureCasesAndChecklistProps) {
  const [selectedCaseCode, setSelectedCaseCode] = useState<string>(() => {
    return cases.length > 0 ? cases[0].caseCode : '';
  });

  // State lưu trữ các giấy tờ mà người dân đã tích chọn "Đã chuẩn bị"
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  const formId = useId();

  // Xác định Case đang chọn
  const activeCase = cases.find((c) => c.caseCode === selectedCaseCode) || cases[0];

  // Lọc checklist theo trường hợp: những item có caseCode trùng hoặc item áp dụng chung
  const currentChecklist = checklist.filter((item) => {
    if (!item.caseCode) return true;
    if (!selectedCaseCode) return true;
    return item.caseCode === selectedCaseCode;
  });

  // Tách checklist thành 2 nhóm chuẩn: Giấy tờ phải nộp & Giấy tờ phải xuất trình
  const nopItems = currentChecklist.filter((item) => item.submissionType === 'NOP');
  const xuatTrinhItems = currentChecklist.filter((item) => item.submissionType === 'XUAT_TRINH');

  // Tính toán tiến độ chuẩn bị hồ sơ
  const totalMandatory = currentChecklist.filter((item) => item.isMandatory).length;
  const checkedMandatory = currentChecklist.filter(
    (item) => item.isMandatory && checkedItems[item.checklistId]
  ).length;
  const progressPercent = totalMandatory > 0 ? Math.round((checkedMandatory / totalMandatory) * 100) : 0;

  const toggleCheck = (id: string) => {
    setCheckedItems((prev: Record<string, boolean>) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Render bảng danh mục giấy tờ theo phong cách chuẩn Cổng Dịch vụ công Quốc gia
  const renderDocumentTable = (items: ChecklistItem[]) => {
    if (items.length === 0) {

      return (
        <div className="py-4 text-center text-sm text-slate-500 italic bg-slate-50/50 rounded-lg border border-slate-200">
          Không có giấy tờ nào trong danh mục này.
        </div>
      );
    }

    return (
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-red-50 text-red-900 border-b border-red-100 font-bold text-xs uppercase tracking-wider">
              <th scope="col" className="w-12 py-3.5 px-3 text-center">Tự kiểm</th>
              <th scope="col" className="w-12 py-3.5 px-3 text-center">STT</th>
              <th scope="col" className="py-3.5 px-4 min-w-[240px]">Tên giấy tờ</th>
              <th scope="col" className="py-3.5 px-4 w-44 text-center">Mẫu đơn, tờ khai</th>
              <th scope="col" className="py-3.5 px-4 w-32 text-center">Số lượng</th>
              <th scope="col" className="py-3.5 px-4 w-36 text-center">Yêu cầu</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item, idx) => {
              const isChecked = !!checkedItems[item.checklistId];
              return (
                <tr
                  key={item.checklistId}
                  className={`transition-colors ${
                    isChecked ? 'bg-amber-50/20' : 'hover:bg-slate-50/80'
                  }`}
                >
                  {/* Cột 1: Checkbox tự kiểm tra */}
                  <td className="py-3.5 px-3 text-center align-middle">
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={isChecked}
                      onClick={() => toggleCheck(item.checklistId)}
                      aria-label={`Đánh dấu đã chuẩn bị ${item.itemName}`}
                      className="inline-grid size-8 place-items-center rounded text-red-700 hover:bg-red-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                    >
                      {isChecked ? (
                        <CheckSquare size={20} weight="fill" className="text-red-700" />
                      ) : (
                        <Square size={20} className="text-slate-400 hover:text-slate-600" />
                      )}
                    </button>
                  </td>

                  {/* Cột 2: Số thứ tự */}
                  <td className="py-3.5 px-3 text-center font-semibold text-slate-500 tabular-nums align-middle">
                    {idx + 1}
                  </td>

                  {/* Cột 3: Tên giấy tờ & Ghi chú điều kiện */}
                  <td className="py-3.5 px-4 align-middle">
                    <div className="space-y-1">
                      <p className={`font-semibold text-sm leading-6 ${isChecked ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                        {item.itemName}
                      </p>
                      {item.conditionNote && (
                        <p className="text-xs leading-5 text-slate-500 italic">
                          <span className="font-medium text-slate-600">Ghi chú:</span> {item.conditionNote}
                        </p>
                      )}
                    </div>
                  </td>

                  {/* Cột 4: Mẫu đơn, tờ khai tải về */}
                  <td className="py-3.5 px-4 text-center align-middle">
                    {item.templateUrl ? (
                      <a
                        href={item.templateUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-red-200 bg-red-50/60 px-3 py-1.5 text-xs font-bold text-red-800 shadow-xs hover:bg-red-100 hover:text-red-900 transition-colors"
                      >
                        <FileArrowDown size={16} weight="bold" />
                        <span>Mẫu {item.templateFormat || 'DOCX'}</span>
                      </a>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>

                  {/* Cột 5: Số lượng (Bản chính / Bản sao) */}
                  <td className="py-3.5 px-4 text-center align-middle">
                    <div className="inline-block text-xs text-slate-700">
                      <span className="font-bold text-sm text-slate-900">{item.quantity}</span>{' '}
                      {item.documentCopyType === 'ORIGINAL' && (
                        <span className="font-semibold text-blue-700">bản chính</span>
                      )}
                      {item.documentCopyType === 'CERTIFIED_COPY' && (
                        <span className="font-semibold text-purple-700">bản sao chứng thực</span>
                      )}
                      {item.documentCopyType === 'REGULAR_COPY' && (
                        <span className="text-slate-600">bản chụp</span>
                      )}
                    </div>
                  </td>

                  {/* Cột 6: Tính chất yêu cầu (Bắt buộc / Tùy chọn) */}
                  <td className="py-3.5 px-4 text-center align-middle">
                    {item.isMandatory ? (
                      <span className="inline-block rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-800">
                        Bắt buộc
                      </span>
                    ) : (
                      <span className="inline-block rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                        Tùy chọn
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <section
      id="thanh-phan-ho-so"
      aria-labelledby="cases-checklist-title"
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
              <h2 id="cases-checklist-title" className="!mb-0 !border-0 !p-0 text-xl font-bold text-red-950 sm:text-2xl">
                Thành phần hồ sơ
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Danh mục giấy tờ cần nộp và xuất trình theo từng trường hợp
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

        {/* Thanh Tự kiểm tra tiến độ hồ sơ (Interactive tool tiện ích) */}
        <div className="rounded-xl border border-slate-200 bg-gradient-to-r from-red-50/50 via-white to-amber-50/40 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
            <Sparkle size={18} weight="fill" className="text-amber-600 shrink-0" />
            <span>
              <strong>Tiện ích tự kiểm:</strong> Tích vào cột <span className="font-semibold text-red-800">"Tự kiểm"</span> ở từng dòng bảng để theo dõi tiến độ chuẩn bị của bạn.
            </span>
          </div>
          <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
            <span className="text-xs font-semibold text-slate-600">
              Đã chuẩn bị: <strong className="text-red-900 text-sm font-bold tabular-nums">{checkedMandatory} / {totalMandatory}</strong> giấy tờ bắt buộc
            </span>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-bold tabular-nums ${
                progressPercent === 100
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-900'
              }`}
            >
              {progressPercent}%
            </span>
          </div>
        </div>

        {/* BẢNG 1: GIẤY TỜ PHẢI NỘP */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <div className="flex items-center gap-2">
              <span className="grid size-6 place-items-center rounded bg-red-800 text-xs font-black text-white">
                1
              </span>
              <h3 className="text-base font-bold text-slate-900">
                Giấy tờ, tài liệu phải nộp
              </h3>
              <span className="text-xs font-normal text-slate-500">
                ({nopItems.length} loại giấy tờ)
              </span>
            </div>
            <span className="text-xs font-semibold text-slate-500">
              Cơ quan lưu giữ vào hồ sơ
            </span>
          </div>

          {renderDocumentTable(nopItems)}
        </div>

        {/* BẢNG 2: GIẤY TỜ PHẢI XUẤT TRÌNH */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <div className="flex items-center gap-2">
              <span className="grid size-6 place-items-center rounded bg-amber-600 text-xs font-black text-white">
                2
              </span>
              <h3 className="text-base font-bold text-slate-900">
                Giấy tờ phải xuất trình
              </h3>
              <span className="text-xs font-normal text-slate-500">
                ({xuatTrinhItems.length} loại giấy tờ)
              </span>
            </div>
            <span className="text-xs font-semibold text-slate-500">
              Đối chiếu xong trả lại người nộp
            </span>
          </div>

          {renderDocumentTable(xuatTrinhItems)}
        </div>


        {/* Ghi chú quy định số hóa / VNeID chân bảng */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs leading-6 text-slate-600 flex items-start gap-2.5">
          <WarningCircle size={18} weight="fill" className="shrink-0 text-amber-700 mt-0.5" />
          <div>
            <strong>Lưu ý chung: </strong>
            Trường hợp thông tin giấy tờ đã có trong Cơ sở dữ liệu quốc gia về dân cư hoặc đã được định danh điện tử qua ứng dụng <strong>VNeID Mức 2</strong>, công dân không phải nộp bản sao hay xuất trình bản giấy theo Đề án 06 của Chính phủ.
          </div>
        </div>
      </div>
    </section>
  );
}
