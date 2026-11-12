import { useContext, useEffect, useRef, useState } from "react";
import { getProcedureIssues, ProcedureErrorsContext, ProcedureFieldPrefix, type ProcedureValidationError } from "@/lib/procedureValidation";
export { validateProcedure } from "@/lib/procedureValidation";
import { ProcedureFormPicker as FormDefinitionsEditor } from './ProcedureFormPicker';
import { QuickCategoryCreate, useMergedCategories } from './QuickCategoryCreate';
import { Button } from "@/components/ui";
import {
  type Category,
} from "@/lib/api/procedures";

type Row = Record<string, unknown>;
type Field = {
  key: string;
  path?: string;
  label: string;
  kind?: "number" | "boolean" | "date" | "multi";
  options?: string[];
  /** Nhãn hiển thị cho từng giá trị trong options */
  optionLabels?: Record<string, string>;
  required?: boolean;
  hint?: string;
  /** Số dòng của ô văn bản (mặc định 2) */
  rows?: number;
};
// Nhãn tiếng Việt cho các giá trị mã của BE
const COPY_TYPE_LABELS: Record<string, string> = { ORIGINAL: "Bản chính", CERTIFIED_COPY: "Bản sao chứng thực", REGULAR_COPY: "Bản sao / bản chụp", OTHER: "Loại khác (ghi rõ ở ô số lượng bằng chữ)" };
const SUBMISSION_TYPE_LABELS: Record<string, string> = { NOP: "Nộp", XUAT_TRINH: "Xuất trình" };
const TIME_UNIT_LABELS: Record<string, string> = { WORKING_DAY: "Ngày làm việc", DAY: "Ngày", HOUR: "Giờ", MINUTE: "Phút" };
const FEE_KIND_LABELS: Record<string, string> = { PHI: "Phí", LE_PHI: "Lệ phí" };
const getInputBoxClass = (hasError: boolean) =>
  `min-h-11 w-full rounded-xl border p-3 text-sm transition focus:bg-white focus:outline-none focus:ring-2 ${
    hasError
      ? "border-red-400 bg-red-50/40 text-slate-900 placeholder:text-red-300 focus:border-red-600 focus:ring-red-100"
      : "border-slate-200 bg-slate-50/60 text-slate-900 focus:border-slate-800 focus:ring-slate-100"
  }`;
const record = (value: unknown): Row =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Row)
    : {};
const rows = (value: unknown): Row[] =>
  Array.isArray(value) ? value.map(record) : [];
function FieldInput({
  field,
  value,
  change,
}: {
  field: Field;
  value: unknown;
  change: (value: unknown) => void;
}) {
  const errors = useContext(ProcedureErrorsContext);
  const prefix = useContext(ProcedureFieldPrefix);
  const path = field.path ?? prefix + field.key;
  const error = errors[path];
  const hasError = Boolean(error);
  const labelContent = (
    <span className="flex items-center gap-1 text-slate-900">
      <span>{field.label}</span>
      {field.required && (
        <span className="text-red-600 font-bold" title="Thông tin bắt buộc">*</span>
      )}
    </span>
  );
  const hintText = field.hint && !error && (
    <span className="text-xs font-normal text-slate-500">{field.hint}</span>
  );
  const errorText = error && (
    <span id={path + '-error'} className="flex items-center gap-1 text-xs font-medium text-red-700">
      <span>•</span>
      <span>{error}</span>
    </span>
  );
  if (field.kind === "multi") {
    const selected = Array.isArray(value) ? value.map(String) : [];
    const options = field.options ?? [];
    return (
      <fieldset data-field={path} className="grid gap-2 text-sm font-semibold">
        <legend className="mb-2">{labelContent}</legend>
        {options.length ? (
          <div className="flex flex-wrap gap-2">
            {options.map((option) => (
              <label key={option} className={`flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border px-3 text-xs font-medium ${selected.includes(option) ? "border-red-300 bg-red-50 text-red-900" : "border-slate-200 bg-white text-slate-700"}`}>
                <input
                  type="checkbox"
                  className="accent-red-700"
                  checked={selected.includes(option)}
                  onChange={(e) => {
                    const next = e.target.checked ? [...selected, option] : selected.filter((x) => x !== option);
                    change(next.length ? next : null);
                  }}
                />
                {field.optionLabels?.[option] ?? option}
              </label>
            ))}
          </div>
        ) : (
          <span className="text-xs font-normal text-slate-500">{field.hint ?? "Chưa có lựa chọn."}</span>
        )}
        {options.length > 0 && hintText}
        {errorText}
      </fieldset>
    );
  }
  if (field.kind === "boolean" || field.options)
    return (
      <label data-field={path} className="grid gap-2 text-sm font-semibold">
        {labelContent}
        <select
          aria-label={field.label}
          aria-invalid={hasError}
          aria-describedby={hasError ? path + '-error' : undefined}
          className={getInputBoxClass(hasError)}
          value={value == null ? "" : String(value)}
          onChange={(e) =>
            change(
              e.target.value === ""
                ? null
                : field.kind === "boolean"
                  ? e.target.value === "true"
                  : e.target.value,
            )
          }
        >
          <option value="">Chưa xác định</option>
          {(field.options ?? ["true", "false"]).map((option) => (
            <option key={option} value={option}>
              {option === "true" ? "Có" : option === "false" ? "Không" : field.optionLabels?.[option] ?? option}
            </option>
          ))}
        </select>
        {errorText}
      </label>
    );
  return (
    <label data-field={path} className="grid gap-2 text-sm font-semibold">
      {labelContent}
      {field.kind ? (
        <input
          aria-label={field.label}
          className={getInputBoxClass(hasError)}
          type={field.kind}
          aria-invalid={hasError}
          aria-describedby={hasError ? path + '-error' : undefined}
          min={field.key === 'quantity' ? 1 : ['feeAmount', 'estimatedDays'].includes(field.key) ? 0 : undefined}
          step={field.kind === "number" ? field.key === 'quantity' ? 1 : "any" : undefined}
          value={value == null ? "" : String(value)}
          onChange={(e) =>
            change(
              e.target.value === ""
                ? null
                : field.kind === "number"
                  ? Number(e.target.value)
                  : e.target.value,
            )
          }
        />
      ) : (
        <textarea
          aria-label={field.label}
          className={getInputBoxClass(hasError)}
          rows={field.rows ?? 2}
          aria-invalid={hasError}
          aria-describedby={hasError ? path + '-error' : undefined}
          value={value == null ? "" : String(value)}
          onChange={(e) => change(e.target.value)}
        />
      )}
      {hintText}
      {errorText}
    </label>
  );
}
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
    <section className="space-y-4">
      <h3 className="font-bold">{title}</h3>
      {list.map((row, index) => (
        <ProcedureFieldPrefix.Provider key={index} value={`${prefix}.${index}.`}><div
          className="space-y-3 rounded-xl border border-slate-200 p-4"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {rowFields.map((field) => (
              <FieldInput
                key={field.key}
                field={field}
                value={row[field.key]}
                change={(next) =>
                  change(
                    list.map((item, i) =>
                      i === index ? { ...item, [field.key]: next } : item,
                    ),
                  )
                }
              />
            ))}
          </div>
          <Button
            size="small"
            variant="ghost"
            onClick={() => change(list.filter((_, i) => i !== index))}
          >
            Xóa dòng {index + 1}
          </Button>
        </div></ProcedureFieldPrefix.Provider>
      ))}
      <Button
        variant="outline"
        size="small"
        onClick={() =>
          change([
            ...list,
            Object.fromEntries(
              rowFields.map((field) => [field.key, field.kind || field.options ? null : ""]),
            ),
          ])
        }
      >
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
    <label data-field={path} className="grid gap-2 text-sm font-semibold">
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
  const update = (index: number, patch: Row) => change(list.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  return (
    <section className="space-y-4">
      <p className="text-sm text-slate-600">
        Mỗi cách nộp có thời hạn và phí riêng. Văn bản gốc không tách được thành số (ví dụ "Theo quy định của Bộ Tài chính", "Không quá 15 phút") thì nhập nguyên văn vào ô <strong>ghi bằng chữ</strong>.
      </p>
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
                <FieldInput field={{ key: "methodName", label: "Hình thức nộp", required: true, hint: "VD: Trực tiếp, Trực tuyến, Qua bưu chính" }} value={method.methodName} change={(next) => update(index, { methodName: next })} />
                <FieldInput field={{ key: "caseCode", label: "Chỉ áp dụng cho trường hợp", options: cases, hint: "Để trống nếu áp dụng chung" }} value={method.caseCode} change={(next) => update(index, { caseCode: next })} />
              </div>
              <fieldset className="space-y-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                <legend className="px-1 text-xs font-bold uppercase tracking-wider text-slate-600">Thời hạn giải quyết</legend>
                <div className="grid gap-4 sm:grid-cols-3">
                  <FieldInput field={{ key: "value", path: `${base}.processingTime.value`, label: "Số", kind: "number" }} value={time.value} change={(next) => setTime({ value: next })} />
                  <FieldInput field={{ key: "unit", path: `${base}.processingTime.unit`, label: "Đơn vị", options: Object.keys(TIME_UNIT_LABELS), optionLabels: TIME_UNIT_LABELS }} value={time.unit} change={(next) => setTime({ unit: next })} />
                  <FieldInput field={{ key: "text", path: `${base}.processingTime.text`, label: "Ghi bằng chữ (nếu có)", hint: "Ưu tiên hiển thị cho người dân" }} value={time.text} change={(next) => setTime({ text: String(next ?? "").trim() ? next : null })} />
                </div>
              </fieldset>
              <fieldset className="space-y-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                <legend className="px-1 text-xs font-bold uppercase tracking-wider text-slate-600">Phí, lệ phí</legend>
                <RowEditor
                  prefix={`${base}.fees`}
                  title="Mức phí"
                  value={fees}
                  fields={[
                    { key: "description", label: "Áp dụng cho / mô tả" },
                    { key: "kind", label: "Loại", options: Object.keys(FEE_KIND_LABELS), optionLabels: FEE_KIND_LABELS },
                    { key: "amount", label: "Số tiền (0 = miễn phí)", kind: "number" },
                    { key: "percent", label: "Hoặc tỷ lệ %", kind: "number" },
                    { key: "unit", label: "Đơn vị" },
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
  warnings,
  onTemplateCreated,
}: {
  value: Row;
  onChange: (value: Row) => void;
  categories: Category[];
  disabled?: boolean;
  initialStep?: number;
  onEditForms?: () => void;
  onEditChecklist?: () => void;
  validationError?: ProcedureValidationError | null;
  warnings?: string[];
  onTemplateCreated?: (newTemplate: { id: string; code: string; title: string }, updatedList: Row[]) => void | Promise<void>;
}) {
  // Gộp thêm danh mục vừa tạo nhanh bằng nút "Tạo danh mục"
  const categories = useMergedCategories(baseCategories);
  const [step, setStep] = useState(initialStep);
  const root = useRef<HTMLDivElement>(null);
  const removedForms = useRef<Record<string, Row>>({});
  const [focusRequest, setFocusRequest] = useState<{ path: string } | null>(null);
  const issues = validationError ? getProcedureIssues(value) : [];
  if (validationError?.issues.some(issue => issue.path === 'contentPayload.decisionNumber') && !String(record(value.contentPayload).decisionNumber ?? '').trim() && !issues.some(issue => issue.path === 'contentPayload.decisionNumber')) {
    issues.push(validationError.issues.find(issue => issue.path === 'contentPayload.decisionNumber')!);
  }
  const errors = Object.fromEntries(issues.map(issue => [issue.path, issue.message]));
  const goToIssue = (issue: typeof issues[number]) => {
    setStep(issue.step);
    setFocusRequest({ path: issue.path });
  };
  useEffect(() => {
    if (!focusRequest) return;
    const frame = requestAnimationFrame(() => {
      const wrapper = root.current?.querySelector<HTMLElement>(`[data-field="${focusRequest.path}"]`);
      const details = wrapper?.closest('details');
      if (details) details.open = true;
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
  const formCodes = rows(value.formDefinitions).map((item) => String(item.formCode ?? "")).filter(Boolean);
  const formLabels = Object.fromEntries(rows(value.formDefinitions).map((item) => [String(item.formCode ?? ""), `${String(item.formName ?? "") || String(item.formCode ?? "")}`]));
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
      <div
        className="sticky top-0 z-10 -mx-1 flex flex-wrap items-center gap-1.5 rounded-2xl border border-slate-200/80 bg-white/95 p-1.5 text-xs font-semibold shadow-xs backdrop-blur-md"
        aria-label="Các phần nội dung thủ tục"
      >
        {tabItems.map((label, index) => (
          <button
            type="button"
            key={label}
            onClick={() => setStep(index)}
            aria-pressed={step === index}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 transition-all ${
              step === index
                ? "bg-red-800 font-bold text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <span className="flex size-4.5 items-center justify-center rounded-full bg-black/10 text-[10px]">
              {index + 1}
            </span>
            <span>{label}</span>
            {index === 4 && (warnings ?? []).some(w => /formDefinitions/i.test(w) || /tệp mẫu/i.test(w)) && (
              <span className="flex size-2 rounded-full bg-amber-400 ring-2 ring-white" title="Có lưu ý từ AI về biểu mẫu" />
            )}
            {issues.some(issue => issue.step === index) && <span className="rounded bg-red-100 px-1 text-red-800">Có lỗi</span>}
          </button>
        ))}
      </div>
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
      {/* Biểu mẫu tự ẩn điều khiển sửa khi disabled; vẫn cho phép xem/tải phôi. */}
      <fieldset disabled={disabled && step !== 4} className="min-w-0 space-y-5">
        {step === 0 && (
          <div className="space-y-5">
            {/* Nhóm 1: Định danh & Phân loại */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">Định danh thủ tục</h4>
              <div className="grid gap-4 sm:grid-cols-2">
                <FieldInput field={{ key: "procedureCode", label: "Mã thủ tục", required: true }} value={value.procedureCode} change={(next) => set("procedureCode", next)} />
                <div data-field="categoryId" className="grid gap-2 text-sm font-semibold">
                  <span className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 text-slate-900">
                    <label htmlFor="procedure-category" className="flex items-center gap-1">
                      <span>Danh mục</span>
                      <span className="text-red-600 font-bold" title="Thông tin bắt buộc">*</span>
                    </label>
                    {/* Chưa có danh mục phù hợp: tạo nhanh tại chỗ, không phải rời bản nháp */}
                    {!disabled && <QuickCategoryCreate onCreated={(category) => set("categoryId", category.id)} />}
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
              <FieldInput field={{ key: "title", label: "Tên thủ tục", required: true }} value={value.title} change={(next) => set("title", next)} />
              <div className="grid gap-4 sm:grid-cols-2">
                <FieldInput field={{ key: "levelOfImplementation", label: "Cấp thực hiện" }} value={value.levelOfImplementation} change={(next) => set("levelOfImplementation", next)} />
                <FieldInput field={{ key: "targetAudience", label: "Đối tượng thực hiện" }} value={value.targetAudience} change={(next) => set("targetAudience", next)} />
              </div>
            </div>

            {/* Nhóm 2: Cơ quan & Pháp lý ban hành */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">Cơ quan & Pháp lý ban hành</h4>
              <div className="grid gap-4 sm:grid-cols-2">
                <FieldInput field={{ key: "issuingAuthority", label: "Cơ quan ban hành" }} value={value.issuingAuthority} change={(next) => set("issuingAuthority", next)} />
                <FieldInput field={{ key: "executingAgency", label: "Cơ quan thực hiện" }} value={value.executingAgency} change={(next) => set("executingAgency", next)} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <FieldInput field={{ key: "decisionNumber", path: "contentPayload.decisionNumber", label: "Số quyết định" }} value={content.decisionNumber} change={(next) => setContent("decisionNumber", next)} />
                <FieldInput field={{ key: "receivingAddress", path: "contentPayload.receivingAddress", label: "Địa chỉ tiếp nhận" }} value={content.receivingAddress} change={(next) => setContent("receivingAddress", next)} />
              </div>
            </div>

            {/* Nhóm 2b: Phân loại & các cơ quan theo khung Cổng DVC (đều tuỳ chọn) */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">Phân loại & cơ quan liên quan</h4>
              <div className="grid gap-4 sm:grid-cols-2">
                <FieldInput field={{ key: "procedureType", path: "contentPayload.procedureType", label: "Loại thủ tục", hint: "VD: Loại khác, TTHC được luật giao cho địa phương quy định" }} value={content.procedureType} change={(next) => setContent("procedureType", String(next ?? "").trim() ? next : null)} />
                <ListInput path="contentPayload.levels" label="Các cấp thực hiện" value={content.levels} change={(next) => setContent("levels", next)} hint="Mỗi dòng một cấp. Để trống ô Cấp thực hiện thì hệ thống tự ghép." />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <ListInput path="contentPayload.competentAuthorities" label="Cơ quan có thẩm quyền" value={content.competentAuthorities} change={(next) => setContent("competentAuthorities", next)} />
                <ListInput path="contentPayload.executingAgencies" label="Cơ quan thực hiện (nhiều cơ quan)" value={content.executingAgencies} change={(next) => setContent("executingAgencies", next)} />
                <ListInput path="contentPayload.authorizedAgencies" label="Cơ quan được ủy quyền" value={content.authorizedAgencies} change={(next) => setContent("authorizedAgencies", next)} />
                <ListInput path="contentPayload.coordinatingAgencies" label="Cơ quan phối hợp" value={content.coordinatingAgencies} change={(next) => setContent("coordinatingAgencies", next)} />
              </div>
              <ListInput path="contentPayload.receivingAddresses" label="Các địa chỉ tiếp nhận khác" value={content.receivingAddresses} change={(next) => setContent("receivingAddresses", next)} />
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
                <FieldInput field={{ key: "feeSummary", label: "Tóm tắt lệ phí", hint: "Để trống để hệ thống tự tóm tắt từ phần Thời hạn & lệ phí." }} value={value.feeSummary} change={(next) => set("feeSummary", next)} />
                <FieldInput field={{ key: "processingTimeSummary", label: "Tóm tắt thời hạn", hint: "Để trống để hệ thống tự tóm tắt từ phần Thời hạn & lệ phí." }} value={value.processingTimeSummary} change={(next) => set("processingTimeSummary", next)} />
              </div>
              <RowEditor
                prefix="contentPayload.resultDetails"
                title="Kết quả giải quyết"
                value={resultRows}
                fields={[
                  { key: "name", label: "Tên kết quả" },
                  { key: "code", label: "Mã kết quả (nếu có)" },
                  { key: "validity", label: "Thời hạn hiệu lực (nếu có)" },
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
            <RowEditor
              prefix="checklistSchema"
              title="Giấy tờ"
              value={value.checklistSchema}
              change={(next) => set("checklistSchema", next)}
              fields={[
                { key: "checklistId", label: "Mã giấy tờ" },
                {
                  key: "caseCode",
                  label: "Mã trường hợp (trống = áp dụng chung)",
                  options: caseCodes,
                },
                { key: "itemName", label: "Tên giấy tờ", rows: 3 },
                {
                  key: "submissionType",
                  label: "Hình thức",
                  options: ["NOP", "XUAT_TRINH"],
                  optionLabels: SUBMISSION_TYPE_LABELS,
                },
                {
                  key: "documentCopyType",
                  label: "Loại bản",
                  options: ["ORIGINAL", "CERTIFIED_COPY", "REGULAR_COPY", "OTHER"],
                  optionLabels: COPY_TYPE_LABELS,
                  hint: "Để trống nếu giấy tờ cần nhiều loại bản",
                },
                { key: "quantity", label: "Số lượng", kind: "number" },
                { key: "quantityText", label: "Số lượng ghi bằng chữ (nếu có)", hint: "VD: 01 bản chính và 01 bản sao; 02 bộ" },
                {
                  key: "formCodes",
                  label: "Mẫu đơn, tờ khai kèm theo",
                  kind: "multi",
                  options: formCodes,
                  optionLabels: formLabels,
                  hint: formCodes.length ? "Chọn một hoặc nhiều mẫu ở tab Biểu mẫu" : "Chưa có biểu mẫu. Thêm ở tab Biểu mẫu rồi quay lại chọn.",
                },
                { key: "note", label: "Ghi chú" },
                {
                  key: "isMandatory",
                  label: "Bắt buộc khi áp dụng",
                  kind: "boolean",
                },
                { key: "conditionNote", label: "Điều kiện áp dụng / ghi chú" },
              ]}
            />
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
                { key: "stepName", label: "Tên bước" },
                { key: "executor", label: "Người/cơ quan thực hiện" },
                { key: "actionDetails", label: "Nội dung thực hiện", rows: 4 },
              ]}
              // Thứ tự để trống thì tự đánh số theo vị trí (BE yêu cầu số nguyên)
              change={(next) => setContent("commonSteps", next.length ? next.map((row, i) => ({ ...row, stepOrder: row.stepOrder ?? i + 1, executor: row.executor ?? "", actionDetails: row.actionDetails ?? "" })) : null)}
            />
            <p className="text-sm text-slate-600">Chỉ thêm trường hợp khi thủ tục chia trường hợp và đã kiểm tra với tài liệu gốc.</p>
            {rows(content.cases).map((item, index, cases) => (
              <div key={index} className="space-y-4 rounded-xl border p-4">
                {[
                  { key: "caseCode", label: "Mã trường hợp" },
                  { key: "caseName", label: "Tên trường hợp" },
                ].map((field) => (
                  <FieldInput
                    key={field.key}
                    field={field}
                    value={item[field.key]}
                    change={(next) =>
                      setContent(
                        "cases",
                        cases.map((row, i) =>
                          i === index ? { ...row, [field.key]: next } : row,
                        ),
                      )
                    }
                  />
                ))}
                <RowEditor
                  prefix={`contentPayload.cases.${index}.steps`}
                  title="Bước thực hiện"
                  value={item.steps}
                  fields={[
                    { key: "stepOrder", label: "Thứ tự", kind: "number" },
                    { key: "stepName", label: "Tên bước" },
                    { key: "executor", label: "Người/cơ quan thực hiện" },
                    { key: "actionDetails", label: "Nội dung thực hiện" },
                  ]}
                  change={(next) =>
                    setContent(
                      "cases",
                      cases.map((row, i) =>
                        i === index ? { ...row, steps: next } : row,
                      ),
                    )
                  }
                />
                <Button
                  variant="ghost"
                  onClick={() =>
                    setContent(
                      "cases",
                      cases.filter((_, i) => i !== index),
                    )
                  }
                >
                  Xóa trường hợp
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              onClick={() =>
                setContent("cases", [
                  ...rows(content.cases),
                  { caseCode: "", caseName: "", steps: [] },
                ])
              }
            >
              Thêm trường hợp
            </Button>
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
              warnings={warnings}
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
                })),
              )
            }
            // Theo Cổng DVC: chỉ cần Tên văn bản + Mã văn bản (ngày, cơ quan ban hành cũ vẫn được giữ nguyên)
            fields={[
              { key: "documentName", label: "Tên văn bản pháp lý", rows: 3 },
              { key: "documentNumber", label: "Mã văn bản" },
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
                { key: "title", label: "Tiêu đề mục" },
                { key: "content", label: "Nội dung", rows: 5 },
              ]}
              change={(next) => setContent("additionalSections", next.length ? next : null)}
            />
          </section>
        )}
      </fieldset>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
        <Button
          type="button"
          variant="outline"
          size="small"
          disabled={step === 0}
          onClick={() => setStep((s) => Math.max(0, s - 1))}
        >
          ← Phần trước ({tabItems[step - 1] ?? ''})
        </Button>
        <span className="text-xs font-semibold text-slate-500">
          Phần {step + 1} / {tabItems.length}: {tabItems[step]}
        </span>
        <Button
          type="button"
          variant="outline"
          size="small"
          disabled={step === tabItems.length - 1}
          onClick={() => setStep((s) => Math.min(tabItems.length - 1, s + 1))}
        >
          Phần tiếp theo ({tabItems[step + 1] ?? ''}) →
        </Button>
      </div>
      <p className="text-sm text-slate-500">Chỉ nhập thông tin đã kiểm tra.</p>
    </div></ProcedureErrorsContext.Provider>
  );
}
