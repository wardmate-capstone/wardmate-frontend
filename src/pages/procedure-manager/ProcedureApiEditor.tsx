import { useContext, useEffect, useRef, useState } from "react";
import { getProcedureIssues, ProcedureErrorsContext, ProcedureFieldPrefix, type ProcedureValidationError } from "@/lib/procedureValidation";
export { validateProcedure } from "@/lib/procedureValidation";
import { ProcedureFormPicker as FormDefinitionsEditor } from './ProcedureFormPicker';
import { Button } from "@/components/ui";
import {
  type Category,
} from "@/lib/api/procedures";

type Row = Record<string, unknown>;
type Field = {
  key: string;
  path?: string;
  label: string;
  kind?: "number" | "boolean" | "date";
  options?: string[];
  required?: boolean;
};
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
  const errorText = error && (
    <span id={path + '-error'} className="flex items-center gap-1 text-xs font-medium text-red-700">
      <span>•</span>
      <span>{error}</span>
    </span>
  );
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
              {option === "true" ? "Có" : option === "false" ? "Không" : option}
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
          rows={2}
          aria-invalid={hasError}
          aria-describedby={hasError ? path + '-error' : undefined}
          value={value == null ? "" : String(value)}
          onChange={(e) => change(e.target.value)}
        />
      )}
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
              rowFields.map((field) => [field.key, field.kind ? null : ""]),
            ),
          ])
        }
      >
        Thêm {title.toLowerCase()}
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
  categories,
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
  const tabItems = [
    "Thông tin chung",
    "Thành phần hồ sơ",
    "Quy trình",
    "Thời hạn & lệ phí",
    "Biểu mẫu",
    "Căn cứ pháp lý",
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
                <label data-field="categoryId" className="grid gap-2 text-sm font-semibold">
                  <span className="flex items-center gap-1 text-slate-900">
                    <span>Danh mục</span>
                    <span className="text-red-600 font-bold" title="Thông tin bắt buộc">*</span>
                  </span>
                  <select
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
                </label>
              </div>
              <FieldInput field={{ key: "title", label: "Tên thủ tục", required: true }} value={value.title} change={(next) => set("title", next)} />
              <div className="grid gap-4 sm:grid-cols-2">
                <FieldInput field={{ key: "levelOfImplementation", label: "Cấp thực hiện", required: true }} value={value.levelOfImplementation} change={(next) => set("levelOfImplementation", next)} />
                <FieldInput field={{ key: "targetAudience", label: "Đối tượng thực hiện", required: true }} value={value.targetAudience} change={(next) => set("targetAudience", next)} />
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

            {/* Nhóm 3: Thời hạn, Lệ phí & Kết quả */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">Thời hạn, Lệ phí & Kết quả</h4>
              <div className="grid gap-4 sm:grid-cols-2">
                <FieldInput field={{ key: "feeSummary", label: "Tóm tắt lệ phí", required: true }} value={value.feeSummary} change={(next) => set("feeSummary", next)} />
                <FieldInput field={{ key: "processingTimeSummary", label: "Tóm tắt thời hạn", required: true }} value={value.processingTimeSummary} change={(next) => set("processingTimeSummary", next)} />
              </div>
              <label className="grid gap-2 text-sm font-semibold">
                <span className="flex items-center gap-1 text-slate-900">
                  <span>Kết quả giải quyết (mỗi kết quả một dòng)</span>
                  <span className="text-red-600 font-bold" title="Thông tin bắt buộc">*</span>
                </span>
                <textarea
                  rows={2}
                  className={getInputBoxClass(Boolean(errors['contentPayload.results.0']))}
                  value={Array.isArray(content.results) ? content.results.join("\n") : ""}
                  onChange={(e) => setContent("results", e.target.value.split("\n").filter((line) => line.trim()))}
                />
                {errors['contentPayload.results.0'] && (
                  <span className="flex items-center gap-1 text-xs font-medium text-red-700">
                    <span>•</span><span>{errors['contentPayload.results.0']}</span>
                  </span>
                )}
              </label>
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
                  options: rows(content.cases).map(item => String(item.caseCode ?? '')).filter(Boolean),
                },
                { key: "itemName", label: "Tên giấy tờ" },
                {
                  key: "submissionType",
                  label: "Hình thức",
                  options: ["NOP", "XUAT_TRINH"],
                },
                {
                  key: "documentCopyType",
                  label: "Loại bản",
                  options: ["ORIGINAL", "CERTIFIED_COPY", "REGULAR_COPY"],
                },
                { key: "quantity", label: "Số lượng", kind: "number" },
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
            <p className="text-sm text-slate-600">Chỉ thêm trường hợp đã kiểm tra với tài liệu gốc.</p>
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
          <RowEditor
            prefix="contentPayload.submissionMethods"
            title="Phương thức nộp"
            value={content.submissionMethods}
            change={(next) => setContent("submissionMethods", next)}
            fields={[
              { key: "methodName", label: "Hình thức nộp" },
              { key: "feeAmount", label: "Lệ phí", kind: "number" },
              { key: "feeUnit", label: "Đơn vị lệ phí" },
              {
                key: "estimatedDays",
                label: "Thời hạn (ngày)",
                kind: "number",
              },
              { key: "note", label: "Điều kiện / ghi chú" },
            ]}
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
            fields={[
              { key: "documentNumber", label: "Số hiệu" },
              { key: "documentName", label: "Tên văn bản" },
              { key: "issueDate", label: "Ngày ban hành", kind: "date" },
              { key: "authority", label: "Cơ quan ban hành" },
            ]}
          />
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
