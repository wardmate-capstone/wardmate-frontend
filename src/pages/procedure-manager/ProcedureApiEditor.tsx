import { useContext, useEffect, useRef, useState } from "react";
import { Eye, Plus } from '@phosphor-icons/react';
import { getProcedureIssues, ProcedureErrorsContext, ProcedureFieldPrefix, type ProcedureValidationError } from "@/lib/procedureValidation";
export { validateProcedure } from "@/lib/procedureValidation";
import { ProcedureFormPicker as FormDefinitionsEditor } from './ProcedureFormPicker';
import { QuickCategoryCreate, useMergedCategories } from './QuickCategoryCreate';
import { ChecklistPreviewModal, ProcedureChecklistCasesEditor } from './ProcedureChecklistCasesEditor';
import { Button } from "@/components/ui";
import {
  type Category,
} from "@/lib/api/procedures";

import { FEE_KIND_LABELS, FieldInput, getInputBoxClass, record, rows, TIME_UNIT_LABELS, type Field, type Row } from "./ProcedureFieldInput";
function RowEditor({
  prefix,
  title,
  value,
  fields: rowFields,
  change,
}: {
  prefix: string;
  title: string;
  value: unknown;
  fields: Field[];
  change: (value: Row[]) => void;
}) {
  const list = rows(value);
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-bold text-slate-900">{title}</h3>
      {!list.length && <p className="rounded-xl border border-dashed border-slate-300 bg-white p-3 text-center text-xs text-slate-500">Chưa có {title.toLowerCase()}.</p>}
      {list.map((row, index) => (
        <ProcedureFieldPrefix.Provider key={index} value={`${prefix}.${index}.`}><div
          className="space-y-3 rounded-xl border border-slate-200 bg-white p-4"
        >
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
            <span className="text-xs font-bold text-slate-600">{title} {index + 1}</span>
            <Button
              size="small"
              variant="dangerGhost"
              className="pm-edit-only min-h-9"
              onClick={() => change(list.filter((_, i) => i !== index))}
            >
              Xóa dòng {index + 1}
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {rowFields.map((field) => (
              <div key={field.key} className={field.rows && field.rows > 2 ? "sm:col-span-2" : undefined}><FieldInput
                field={field}
                value={row[field.key]}
                change={(next) =>
                  change(
                    list.map((item, i) =>
                      i === index ? { ...item, [field.key]: next } : item,
                    ),
                  )
                }
              /></div>
            ))}
          </div>
        </div></ProcedureFieldPrefix.Provider>
      ))}
      <Button
        variant="outline"
        size="small"
        className="pm-edit-only"
        onClick={() =>
          change([
            ...list,
            Object.fromEntries(
              rowFields.map((field) => [field.key, (field.kind && field.kind !== "text") || field.options ? null : ""]),
            ),
          ])
        }
      >
        <Plus size={16} weight="bold" aria-hidden="true" />
        Thêm {title.toLowerCase()}
      </Button>
    </section>
  );
}

/** Danh sách văn bản (cơ quan, cấp, từ khóa...): mỗi dòng một mục; rỗng → null */
function ListInput({ path, label, value, change, hint, rows: lineCount = 2 }: { path: string; label: string; value: unknown; change: (value: string[] | null) => void; hint?: string; rows?: number }) {
  const joined = Array.isArray(value) ? value.map(String).join("\n") : "";
  const [text, setText] = useState(joined);
  // Đồng bộ khi dữ liệu thay đổi từ bên ngoài (mở thủ tục khác, khôi phục phiên bản)
  useEffect(() => {
    setText((current) => (current.split("\n").map((s) => s.trim()).filter(Boolean).join("\n") === joined ? current : joined));
  }, [joined]);
  return (
    <label data-field={path} className="grid content-start gap-2 text-sm font-semibold">
      <span className="text-slate-900">{label}</span>
      <textarea
        aria-label={label}
        className={getInputBoxClass(false)}
        rows={lineCount}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          const items = e.target.value.split("\n").map((s) => s.trim()).filter(Boolean);
          change(items.length ? items : null);
        }}
      />
      <span className="text-xs font-normal text-slate-500">{hint ?? "Mỗi dòng một mục."}</span>
    </label>
  );
}

/** Cách thức nộp: thời hạn (số + đơn vị + ghi bằng chữ) và nhiều mức phí (BE-H B.1) */
function MethodsEditor({ value, cases, change }: { value: unknown; cases: string[]; change: (value: Row[]) => void }) {
  const list = rows(value);
  const errors = useContext(ProcedureErrorsContext);
  const update = (index: number, patch: Row) => change(list.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  return (
    <section className="space-y-4">
      {list.map((method, index) => {
        const base = `contentPayload.submissionMethods.${index}`;
        // Dữ liệu cũ chỉ có estimatedDays/feeAmount: hiển thị như một thời hạn/mức phí có cấu trúc
        const time = method.processingTime ? record(method.processingTime) : method.estimatedDays != null ? { value: method.estimatedDays, unit: "WORKING_DAY" } : {};
        const fees = Array.isArray(method.fees) ? method.fees : method.feeAmount != null ? [{ amount: method.feeAmount, unit: method.feeUnit || "VND" }] : [];
        const setTime = (patch: Row) => {
          const next = { ...time, ...patch };
          const empty = next.value == null && !String(next.text ?? "").trim();
          // BE tự suy ra estimatedDays từ processingTime khi đơn vị là ngày
          update(index, { processingTime: empty ? null : next, estimatedDays: null });
        };
        return (
          <ProcedureFieldPrefix.Provider key={index} value={`${base}.`}>
            <div className="space-y-4 rounded-xl border border-slate-200 p-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <FieldInput field={{ key: "methodName", label: "Hình thức nộp", required: true, kind: "text", hint: "VD: Trực tiếp, Trực tuyến, Qua bưu chính" }} value={method.methodName} change={(next) => update(index, { methodName: next })} />
                {/* Thủ tục không chia trường hợp thì không hiện ô chọn trường hợp (giá trị cũ vẫn giữ nguyên) */}
                {(cases.length > 0 || Boolean(method.caseCode)) && <FieldInput field={{ key: "caseCode", label: "Chỉ áp dụng cho trường hợp", options: cases, hint: "Để trống nếu áp dụng chung" }} value={method.caseCode} change={(next) => update(index, { caseCode: next })} />}
              </div>
              <fieldset className="space-y-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                <legend className="px-1 text-xs font-bold uppercase tracking-wider text-slate-600">Thời hạn giải quyết</legend>
                <div className="grid gap-4 sm:grid-cols-3">
                  <FieldInput field={{ key: "value", path: `${base}.processingTime.value`, label: "Số", kind: "number" }} value={time.value} change={(next) => setTime({ value: next })} />
                  <FieldInput field={{ key: "unit", path: `${base}.processingTime.unit`, label: "Đơn vị", options: Object.keys(TIME_UNIT_LABELS), optionLabels: TIME_UNIT_LABELS }} value={time.unit} change={(next) => setTime({ unit: next })} />
                  <FieldInput field={{ key: "text", path: `${base}.processingTime.text`, label: "Ghi bằng chữ (nếu có)", kind: "text", hint: "Ưu tiên hiển thị cho người dân" }} value={time.text} change={(next) => setTime({ text: String(next ?? "").trim() ? next : null })} />
                </div>
              </fieldset>
              <fieldset data-field={`${base}.fees`} className={`space-y-3 rounded-xl border bg-slate-50/60 p-3 ${errors[`${base}.fees`] ? "border-red-300" : "border-slate-100"}`}>
                <legend className="px-1 text-xs font-bold uppercase tracking-wider text-slate-600">Phí, lệ phí</legend>
                {errors[`${base}.fees`] && <p role="alert" className="text-xs font-medium text-red-700">• {errors[`${base}.fees`]}</p>}
                <RowEditor
                  prefix={`${base}.fees`}
                  title="Mức phí"
                  value={fees}
                  fields={[
                    { key: "description", label: "Áp dụng cho / mô tả", kind: "text" },
                    { key: "kind", label: "Loại", options: Object.keys(FEE_KIND_LABELS), optionLabels: FEE_KIND_LABELS },
                    { key: "amount", label: "Số tiền (0 = miễn phí)", kind: "number" },
                    { key: "percent", label: "Hoặc tỷ lệ %", kind: "number" },
                    { key: "unit", label: "Đơn vị", kind: "text" },
                    // C3: mức phí riêng của trường hợp (Catalog kiểm mã phải thuộc thủ tục)
                    ...(cases.length ? [{ key: "caseCode", label: "Chỉ áp dụng cho trường hợp", options: cases, hint: "Để trống nếu áp dụng chung" }] : []),
                  ]}
                  change={(next) => update(index, { fees: next.length ? next.map((fee) => ({ ...fee, unit: String(fee.unit ?? "").trim() || "VND" })) : null, feeAmount: null })}
                />
                <FieldInput field={{ key: "feeText", label: "Phí ghi bằng chữ (nếu không tách được thành các mức)", rows: 2 }} value={method.feeText} change={(next) => update(index, { feeText: String(next ?? "").trim() ? next : null })} />
              </fieldset>
              <FieldInput field={{ key: "note", label: "Mô tả / ghi chú", rows: 4 }} value={method.note} change={(next) => update(index, { note: next })} />
              <Button size="small" variant="ghost" onClick={() => change(list.filter((_, i) => i !== index))}>
                Xóa cách nộp {index + 1}
              </Button>
            </div>
          </ProcedureFieldPrefix.Provider>
        );
      })}
      <Button variant="outline" size="small" onClick={() => change([...list, { methodName: "", feeUnit: "VND", note: "" }])}>
        <Plus size={16} weight="bold" aria-hidden="true" />
        Thêm cách nộp
      </Button>
    </section>
  );
}

export const emptyProcedure = (): Row => ({
  procedureCode: "",
  categoryId: null,
  title: "",
  levelOfImplementation: "",
  targetAudience: "",
  feeSummary: "",
  processingTimeSummary: "",
  issuingAuthority: "",
  executingAgency: "",
  contentPayload: {
    decisionNumber: "",
    receivingAddress: "",
    submissionMethods: [],
    legalReferences: [],
    results: [],
    cases: [],
  },
  checklistSchema: [],
  formDefinitions: [],
});

export function ProcedureApiEditor({
  value,
  onChange,
  categories: baseCategories,
  disabled = false,
  initialStep = 0,
  onEditForms,
  onEditChecklist,
  validationError,
  onTemplateCreated,
  extractionNotes,
}: {
  value: Row;
  onChange: (value: Row) => void;
  categories: Category[];
  disabled?: boolean;
  initialStep?: number;
  onEditForms?: () => void;
  onEditChecklist?: () => void;
  validationError?: ProcedureValidationError | null;
  onTemplateCreated?: (newTemplate: { id: string; code: string; title: string }, updatedList: Row[]) => void | Promise<void>;
  /** Cảnh báo AI bóc tách về giấy tờ/trường hợp, hiện ở phần Thành phần hồ sơ. */
  extractionNotes?: string[];
}) {
  // Gộp thêm danh mục vừa tạo nhanh bằng nút "Tạo danh mục"
  const categories = useMergedCategories(baseCategories);
  const [step, setStep] = useState(initialStep);
  const root = useRef<HTMLDivElement>(null);
  const removedForms = useRef<Record<string, Row>>({});
  const [focusRequest, setFocusRequest] = useState<{ path: string } | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const stepButtons = useRef<(HTMLButtonElement | null)[]>([]);
  // Chuyển phần bằng thanh bước/nút dưới: về đầu nội dung để không phải cuộn ngược (goToIssue tự cuộn tới ô lỗi)
  const openStep = (next: number) => {
    setStep(next);
    requestAnimationFrame(() => root.current?.scrollIntoView({ block: "start", behavior: "smooth" }));
  };
  useEffect(() => {
    stepButtons.current[step]?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [step]);
  const issues = validationError ? getProcedureIssues(value) : [];
  type ProcedureIssueItem = (typeof issues)[number];
  if (validationError?.issues.some(issue => issue.path === 'contentPayload.decisionNumber') && !String(record(value.contentPayload).decisionNumber ?? '').trim() && !issues.some(issue => issue.path === 'contentPayload.decisionNumber')) {
    issues.push(validationError.issues.find(issue => issue.path === 'contentPayload.decisionNumber')!);
  }
  // Lỗi ngoài kiểm tra lưu (VD: điều kiện xuất bản bản nháp) chỉ còn hiện khi dữ liệu hiện tại vẫn thiếu
  for (const issue of validationError?.issues ?? []) {
    if (issue.recheck?.(value) && !issues.some(x => x.path === issue.path)) issues.push(issue);
  }
  const errors = Object.fromEntries(issues.map(issue => [issue.path, issue.message]));
  const goToIssue = (issue: ProcedureIssueItem) => {
    setStep(issue.step);
    setFocusRequest({ path: issue.path });
  };
  useEffect(() => {
    if (!focusRequest) return;
    const frame = requestAnimationFrame(() => {
      const wrapper = root.current?.querySelector<HTMLElement>(`[data-field="${focusRequest.path}"]`);
      // Mở mọi accordion chứa ô lỗi (trường hợp → giấy tờ)
      for (let details = wrapper?.closest('details'); details; details = details.parentElement?.closest('details')) details.open = true;
      const input = wrapper?.matches('input,select,textarea') ? wrapper : wrapper?.querySelector<HTMLElement>('input,select,textarea');
      (input ?? wrapper)?.focus(); wrapper?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    });
    return () => cancelAnimationFrame(frame);
  }, [focusRequest]);
  useEffect(() => {
    if (validationError?.issues[0]) goToIssue(validationError.issues[0]);
  }, [validationError]);
  const content = record(value.contentPayload);
  const set = (key: string, next: unknown) =>
    onChange({ ...value, [key]: next });
  const setContent = (key: string, next: unknown) =>
    set("contentPayload", { ...content, [key]: next });
  const setContentMany = (patch: Row) => set("contentPayload", { ...content, ...patch });
  const caseCodes = rows(content.cases).map((item) => String(item.caseCode ?? "")).filter(Boolean);
  // Kết quả: dùng resultDetails (kèm mã); dữ liệu cũ chỉ có results[] thì hiển thị thành các dòng tên
  const resultRows = Array.isArray(content.resultDetails) ? content.resultDetails : (Array.isArray(content.results) ? content.results : []).map((name) => ({ name, code: null }));
  const tabItems = [
    "Thông tin chung",
    "Thành phần hồ sơ",
    "Quy trình",
    "Thời hạn & lệ phí",
    "Biểu mẫu",
    "Căn cứ pháp lý",
    "Thông tin khác",
  ];
  return (
    <ProcedureErrorsContext.Provider value={errors}><div ref={root} className="min-w-0 space-y-5">
      <nav
        aria-label="Các phần nội dung thủ tục"
        // shadow trắng phía trên che phần đệm của vùng cuộn để nội dung không lộ phía trên thanh bước
        className="sticky top-0 z-20 -mx-1 border-b border-slate-200 bg-white px-1 pb-3 pt-1 shadow-[0_-1.5rem_0_0_#fff]"
      >
        <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <p className="text-sm text-slate-600">
            Phần <strong className="text-slate-900">{step + 1}/{tabItems.length}</strong>: <strong className="text-slate-900">{tabItems[step]}</strong>
          </p>
          {!disabled && <p className="hidden text-xs text-slate-500 sm:block"><span className="font-bold text-red-600">*</span> là thông tin bắt buộc · Chỉ nhập thông tin đã kiểm tra</p>}
        </div>
        <ol className="flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:thin]">
          {tabItems.map((label, index) => {
            const active = step === index;
            const hasIssue = issues.some(issue => issue.step === index);
            return (
              <li key={label} className="shrink-0">
                <button
                  type="button"
                  ref={(el) => { stepButtons.current[index] = el; }}
                  onClick={() => openStep(index)}
                  aria-pressed={active}
                  className={`inline-flex min-h-10 items-center gap-1.5 whitespace-nowrap rounded-lg border px-2.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-800 focus-visible:ring-offset-1 ${
                    active
                      ? "border-red-800 bg-red-800 text-white"
                      : hasIssue
                        ? "border-red-300 bg-red-50 text-red-900 hover:bg-red-100"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <span className={`grid size-5 place-items-center rounded-full text-[11px] ${active ? "bg-white/20" : "bg-slate-100 text-slate-600"}`}>{index + 1}</span>
                  <span>{label}</span>
                  {hasIssue && <span className={`rounded px-1 text-[11px] ${active ? "bg-white/20" : "bg-red-100 text-red-800"}`}>Có lỗi</span>}
                  {index === 1 && (extractionNotes?.length ?? 0) > 0 && <span className="rounded bg-amber-100 px-1 text-[11px] text-amber-900">AI cần kiểm tra</span>}
                </button>
              </li>
            );
          })}
        </ol>
      </nav>
      {issues.length > 0 && (
        <div className="rounded-2xl border border-red-200 bg-red-50/70 p-4 text-sm text-red-900 shadow-xs">
          <div className="flex items-center gap-2 font-bold text-red-800 mb-2">
            <span className="flex size-5 items-center justify-center rounded-full bg-red-200 text-xs font-bold text-red-900">!</span>
            <span>Cần kiểm tra và hoàn thiện {issues.length} mục thông tin:</span>
          </div>
          <ul className="grid gap-1.5 sm:grid-cols-2 text-xs">
            {issues.map((issue) => (
              <li key={issue.path}>
                <button
                  type="button"
                  className="group flex w-full items-start gap-1.5 rounded-lg p-1.5 text-left transition hover:bg-red-100/60"
                  onClick={() => goToIssue(issue)}
                  title={`Bấm để chuyển đến phần ${tabItems[issue.step]}`}
                >
                  <span className="mt-0.5 shrink-0 rounded bg-red-200/80 px-1.5 py-0.5 text-[10px] font-semibold text-red-800">
                    {tabItems[issue.step]}
                  </span>
                  <span className="min-w-0 flex-1 leading-snug">
                    <strong className="font-semibold text-red-950">{issue.label}:</strong>{" "}
                    <span className="text-red-800">{issue.message}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {step === 1 && (
        // Ngoài fieldset để vẫn xem trước được khi trình sửa đang khóa
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-sky-200 bg-sky-50/70 p-3">
          <p className="text-xs text-sky-950">Kiểm tra cách công dân thấy giấy tờ chung và từng trường hợp trước khi công khai.</p>
          <Button type="button" size="small" variant="outline" onClick={() => setPreviewOpen(true)}>
            <Eye size={16} aria-hidden />Xem trước như công dân
          </Button>
        </div>
      )}
      <ChecklistPreviewModal open={previewOpen} onOpenChange={setPreviewOpen} value={value} />
      {/* Biểu mẫu tự ẩn điều khiển sửa khi disabled; vẫn cho phép xem/tải phôi. */}
      <fieldset disabled={disabled && step !== 4} className="procedure-fields min-w-0 space-y-5">
        {step === 0 && (
          <div className="space-y-5">
            {/* Nhóm 1: Định danh — chỉ Mã, Danh mục, Tên là bắt buộc */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">Định danh thủ tục</h4>
              <div className="grid gap-4 sm:grid-cols-2">
                <FieldInput field={{ key: "procedureCode", label: "Mã thủ tục", required: true, kind: "text", placeholder: "VD: 1.001776" }} value={value.procedureCode} change={(next) => set("procedureCode", next)} />
                <div data-field="categoryId" className="grid content-start gap-2 text-sm font-semibold">
                  <span className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 text-slate-900">
                    <label htmlFor="procedure-category" className="flex items-center gap-1">
                      <span>Danh mục</span>
                      <span className="text-red-600 font-bold" title="Thông tin bắt buộc">*</span>
                    </label>
                    {/* Chưa có danh mục phù hợp: tạo nhanh tại chỗ, không phải rời bản nháp */}
                    {/* -my-1.5: nút không làm dòng nhãn cao hơn ô bên cạnh (ô lệch hàng) */}
                    {!disabled && <span className="-my-1.5"><QuickCategoryCreate onCreated={(category) => set("categoryId", category.id)} /></span>}
                  </span>
                  <select
                    id="procedure-category"
                    aria-label="Danh mục"
                    aria-invalid={Boolean(errors.categoryId)}
                    aria-describedby={errors.categoryId ? 'category-error' : undefined}
                    className={getInputBoxClass(Boolean(errors.categoryId))}
                    value={String(value.categoryId ?? "")}
                    onChange={(e) => set("categoryId", e.target.value ? Number(e.target.value) : null)}
                  >
                    <option value="">Chọn danh mục</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.categoryName}
                      </option>
                    ))}
                  </select>
                  {errors.categoryId && <span id="category-error" className="flex items-center gap-1 text-xs font-medium text-red-700"><span>•</span><span>{errors.categoryId}</span></span>}
                </div>
              </div>
              <FieldInput field={{ key: "title", label: "Tên thủ tục", required: true, placeholder: "Nhập đúng tên trên Cổng Dịch vụ công" }} value={value.title} change={(next) => set("title", next)} />
              <div className="grid gap-4 sm:grid-cols-2">
                <FieldInput field={{ key: "levelOfImplementation", label: "Cấp thực hiện", kind: "text", placeholder: "VD: Cấp Xã" }} value={value.levelOfImplementation} change={(next) => set("levelOfImplementation", next)} />
                <FieldInput field={{ key: "procedureType", path: "contentPayload.procedureType", label: "Loại thủ tục", kind: "text", placeholder: "VD: TTHC được luật giao cho địa phương quy định" }} value={content.procedureType} change={(next) => setContent("procedureType", String(next ?? "").trim() ? next : null)} />
              </div>
              <FieldInput field={{ key: "targetAudience", label: "Đối tượng thực hiện", placeholder: "VD: Công dân Việt Nam" }} value={value.targetAudience} change={(next) => set("targetAudience", next)} />
            </div>

            {/* Nhóm 2: Cơ quan & quyết định công bố */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">Cơ quan & quyết định công bố</h4>
              <div className="grid gap-4 sm:grid-cols-2">
                <FieldInput field={{ key: "issuingAuthority", label: "Cơ quan ban hành", kind: "text" }} value={value.issuingAuthority} change={(next) => set("issuingAuthority", next)} />
                <FieldInput field={{ key: "executingAgency", label: "Cơ quan thực hiện", kind: "text" }} value={value.executingAgency} change={(next) => set("executingAgency", next)} />
                <FieldInput field={{ key: "decisionNumber", path: "contentPayload.decisionNumber", label: "Số quyết định", kind: "text", placeholder: "VD: 123/QĐ-UBND" }} value={content.decisionNumber} change={(next) => setContent("decisionNumber", next)} />
                <FieldInput field={{ key: "receivingAddress", path: "contentPayload.receivingAddress", label: "Địa chỉ tiếp nhận", kind: "text" }} value={content.receivingAddress} change={(next) => setContent("receivingAddress", next)} />
              </div>
            </div>

            {/* Nhóm 3: Danh sách nhiều mục (tùy chọn) */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-4">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">Cơ quan, cấp và địa chỉ liên quan</h4>
                <p className="mt-1 text-xs text-slate-500">Không bắt buộc. Mỗi dòng một mục.</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <ListInput path="contentPayload.competentAuthorities" label="Cơ quan có thẩm quyền" value={content.competentAuthorities} change={(next) => setContent("competentAuthorities", next)} />
                <ListInput path="contentPayload.executingAgencies" label="Cơ quan thực hiện (nhiều cơ quan)" value={content.executingAgencies} change={(next) => setContent("executingAgencies", next)} />
                <ListInput path="contentPayload.authorizedAgencies" label="Cơ quan được ủy quyền" value={content.authorizedAgencies} change={(next) => setContent("authorizedAgencies", next)} />
                <ListInput path="contentPayload.coordinatingAgencies" label="Cơ quan phối hợp" value={content.coordinatingAgencies} change={(next) => setContent("coordinatingAgencies", next)} />
                <ListInput path="contentPayload.levels" label="Các cấp thực hiện" value={content.levels} change={(next) => setContent("levels", next)} hint="Để trống ô Cấp thực hiện thì hệ thống tự ghép." />
                <ListInput path="contentPayload.receivingAddresses" label="Các địa chỉ tiếp nhận khác" value={content.receivingAddresses} change={(next) => setContent("receivingAddresses", next)} />
              </div>
            </div>

            {/* Nhóm 2c: Yêu cầu, điều kiện & mô tả */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">Yêu cầu, điều kiện & mô tả</h4>
              <FieldInput field={{ key: "requirements", path: "contentPayload.requirements", label: "Yêu cầu, điều kiện thực hiện", rows: 4 }} value={content.requirements} change={(next) => setContent("requirements", String(next ?? "").trim() ? next : null)} />
              <FieldInput field={{ key: "description", path: "contentPayload.description", label: "Mô tả", rows: 3 }} value={content.description} change={(next) => setContent("description", String(next ?? "").trim() ? next : null)} />
              <ListInput path="contentPayload.keywords" label="Từ khóa" value={content.keywords} change={(next) => setContent("keywords", next)} hint="Mỗi dòng một từ khóa; dùng cho tìm kiếm thủ tục." />
            </div>

            {/* Nhóm 3: Thời hạn, Lệ phí & Kết quả */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">Thời hạn, Lệ phí & Kết quả</h4>
              <div className="grid gap-4 sm:grid-cols-2">
                <FieldInput field={{ key: "feeSummary", label: "Tóm tắt lệ phí", kind: "text", hint: "Để trống để hệ thống tự tóm tắt từ phần Thời hạn & lệ phí." }} value={value.feeSummary} change={(next) => set("feeSummary", next)} />
                <FieldInput field={{ key: "processingTimeSummary", label: "Tóm tắt thời hạn", kind: "text", hint: "Để trống để hệ thống tự tóm tắt từ phần Thời hạn & lệ phí." }} value={value.processingTimeSummary} change={(next) => set("processingTimeSummary", next)} />
              </div>
              <RowEditor
                prefix="contentPayload.resultDetails"
                title="Kết quả giải quyết"
                value={resultRows}
                fields={[
                  { key: "name", label: "Tên kết quả", kind: "text" },
                  { key: "code", label: "Mã kết quả (nếu có)", kind: "text" },
                  { key: "validity", label: "Thời hạn hiệu lực (nếu có)", kind: "text" },
                  { key: "note", label: "Ghi chú" },
                ]}
                change={(next) => {
                  // BE tự điền results = danh sách tên; gửi kèm để tương thích dữ liệu cũ
                  const cleaned = next.map((row) => ({ ...row, code: String(row.code ?? "").trim() || null, validity: String(row.validity ?? "").trim() || null, note: String(row.note ?? "").trim() || null }));
                  setContentMany({ resultDetails: cleaned.length ? cleaned : null, results: next.map((row) => String(row.name ?? "").trim()).filter(Boolean) });
                }}
              />
            </div>
          </div>
        )}
        {step === 1 && (
          <div className="space-y-4">
            {disabled && onEditChecklist && (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    Danh mục giấy tờ & thành phần hồ sơ quy định
                  </p>
                  <p className="text-xs text-slate-600">
                    Bạn có thể cập nhật riêng danh mục giấy tờ theo quyết định ban hành mới mà không làm thay đổi các phần khác của thủ tục.
                  </p>
                </div>
                <Button size="small" variant="outline" onClick={onEditChecklist}>
                  Cập nhật danh mục giấy tờ (Checklist)
                </Button>
              </div>
            )}
            <ProcedureChecklistCasesEditor value={value} onChange={onChange} extractionNotes={extractionNotes} />
          </div>
        )}
        {step === 2 && (
          <section className="space-y-5">
            <FieldInput
              field={{ key: "stepsText", path: "contentPayload.stepsText", label: "Trình tự thực hiện (dán nguyên văn)", rows: 8, hint: "Có thể dán nguyên văn \"Bước 1… Bước 2…\" từ Cổng DVC. Tách thành từng bước bên dưới là tuỳ chọn." }}
              value={content.stepsText}
              change={(next) => setContent("stepsText", String(next ?? "").trim() ? next : null)}
            />
            <RowEditor
              prefix="contentPayload.commonSteps"
              title="Bước chung"
              value={content.commonSteps}
              fields={[
                { key: "stepOrder", label: "Thứ tự", kind: "number" },
                { key: "stepName", label: "Tên bước", kind: "text" },
                { key: "executor", label: "Người/cơ quan thực hiện", kind: "text" },
                { key: "actionDetails", label: "Nội dung thực hiện", rows: 4 },
              ]}
              // Thứ tự để trống thì tự đánh số theo vị trí (BE yêu cầu số nguyên)
              change={(next) => setContent("commonSteps", next.length ? next.map((row, i) => ({ ...row, stepOrder: row.stepOrder ?? i + 1, executor: row.executor ?? "", actionDetails: row.actionDetails ?? "" })) : null)}
            />
            {/* Thêm/đổi tên/xóa trường hợp ở phần Thành phần hồ sơ; ở đây chỉ tách bước riêng (tùy chọn) */}
            {rows(content.cases).length > 0 ? rows(content.cases).map((item, index, cases) => (
              <div key={index} className="space-y-4 rounded-xl border p-4">
                <p className="text-sm font-semibold text-slate-900">Trường hợp {String(item.caseCode ?? "")}{String(item.caseName ?? "").trim() ? `: ${String(item.caseName)}` : ""}</p>
                <RowEditor
                  prefix={`contentPayload.cases.${index}.steps`}
                  title="Bước thực hiện riêng"
                  value={item.steps}
                  fields={[
                    { key: "stepOrder", label: "Thứ tự", kind: "number" },
                    { key: "stepName", label: "Tên bước", kind: "text" },
                    { key: "executor", label: "Người/cơ quan thực hiện", kind: "text" },
                    { key: "actionDetails", label: "Nội dung thực hiện" },
                  ]}
                  change={(next) => setContent("cases", cases.map((row, i) => (i === index ? { ...row, steps: next } : row)))}
                />
              </div>
            )) : (
              <p className="text-sm text-slate-600">Thủ tục chưa chia trường hợp.</p>
            )}
            <p className="text-xs text-slate-500">
              Thêm, đổi tên hoặc xóa trường hợp ở phần{" "}
              <button type="button" className="font-semibold text-red-800 underline underline-offset-2" onClick={() => setStep(1)}>2. Thành phần hồ sơ</button>.
            </p>
          </section>
        )}
        {step === 3 && (
          <MethodsEditor
            value={content.submissionMethods}
            cases={caseCodes}
            change={(next) => setContent("submissionMethods", next)}
          />
        )}
        {step === 4 && (
          <FormDefinitionsEditor
              removedForms={removedForms.current}
              onEdit={onEditForms}
              cases={rows(content.cases).map(item => ({ code: String(item.caseCode ?? ""), name: String(item.caseName ?? "") }))}
              value={value.formDefinitions}
              disabled={disabled}
              onTemplateCreated={onTemplateCreated}
              change={(next) =>
                set(
                  "formDefinitions",
                  next.map((row) => ({
                    ...row,
                    formType: row.formType === 'ONLINE_INTERACTIVE' ? 'ONLINE_INTERACTIVE' : 'DOCX_TEMPLATE',
                    formTemplateId: row.formTemplateId || null,
                  })),
                )
              }
            />
        )}
        {step === 5 && (
          <RowEditor
            prefix="contentPayload.legalReferences"
            title="Căn cứ pháp lý"
            value={content.legalReferences}
            change={(next) =>
              setContent(
                "legalReferences",
                next.map((row) => ({
                  ...row,
                  issueDate: row.issueDate || null,
                  authority: row.authority || null,
                })),
              )
            }
            // PROC-LEGAL-01: 4 cột Cổng DVC, không ô nào bắt buộc; mỗi dòng chỉ cần Số ký hiệu hoặc Trích yếu
            fields={[
              { key: "documentNumber", label: "Số ký hiệu", kind: "text" },
              { key: "documentName", label: "Trích yếu", rows: 3 },
              { key: "issueDate", label: "Ngày ban hành", kind: "date" },
              { key: "authority", label: "Cơ quan ban hành", kind: "text" },
            ]}
          />
        )}
        {step === 6 && (
          <section className="space-y-3">
            <p className="text-sm text-slate-600">
              Dùng cho nội dung không thuộc mục nào ở trên (lưu ý, thông tin liên hệ, hướng dẫn riêng của địa phương...). Hiển thị cho người dân theo đúng thứ tự.
            </p>
            <RowEditor
              prefix="contentPayload.additionalSections"
              title="Mục thông tin"
              value={content.additionalSections}
              fields={[
                { key: "title", label: "Tiêu đề mục", kind: "text" },
                { key: "content", label: "Nội dung", rows: 5 },
              ]}
              change={(next) => setContent("additionalSections", next.length ? next : null)}
            />
          </section>
        )}
      </fieldset>
      <div className="sticky bottom-0 z-20 -mx-1 flex items-center justify-between gap-3 border-t border-slate-200 bg-white px-1 py-3 shadow-[0_1.5rem_0_0_#fff]">
        <Button
          type="button"
          variant="outline"
          size="small"
          disabled={step === 0}
          onClick={() => openStep(Math.max(0, step - 1))}
        >
          ← Phần trước
        </Button>
        <span className="hidden min-w-0 truncate text-xs font-semibold text-slate-500 sm:block">
          {step < tabItems.length - 1 ? `Tiếp theo: ${tabItems[step + 1]}` : "Đây là phần cuối"}
        </span>
        <Button
          type="button"
          variant="outline"
          size="small"
          disabled={step === tabItems.length - 1}
          onClick={() => openStep(Math.min(tabItems.length - 1, step + 1))}
        >
          Phần tiếp theo →
        </Button>
      </div>
    </div></ProcedureErrorsContext.Provider>
  );
}
