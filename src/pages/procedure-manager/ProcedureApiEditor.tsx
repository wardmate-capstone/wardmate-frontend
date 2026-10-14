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
};
const box =
  "min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50/60 p-3 text-sm text-slate-900 transition focus:border-red-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-100";
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
  const errorText = error && <span id={path + '-error'} className="text-xs font-normal text-red-800">{error}</span>;
  if (field.kind === "boolean" || field.options)
    return (
      <label data-field={path} className="grid gap-2 text-sm font-semibold">
        {field.label}
        <select
          aria-label={field.label}
          aria-invalid={Boolean(error)} aria-describedby={error ? path + '-error' : undefined}
          className={box}
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
      {field.label}
      {field.kind ? (
        <input
          aria-label={field.label}
          className={box}
          type={field.kind}
          aria-invalid={Boolean(error)} aria-describedby={error ? path + '-error' : undefined}
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
          className={box}
          rows={2}
          aria-invalid={Boolean(error)} aria-describedby={error ? path + '-error' : undefined}
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
  validationError,
}: {
  value: Row;
  onChange: (value: Row) => void;
  categories: Category[];
  disabled?: boolean;
  initialStep?: number;
  onEditForms?: () => void;
  validationError?: ProcedureValidationError | null;
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
            {issues.some(issue => issue.step === index) && <span className="rounded bg-red-100 px-1 text-red-800">Có lỗi</span>}
          </button>
        ))}
      </div>
      {issues.length > 0 && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800"><p className="font-semibold">Cần kiểm tra {issues.length} thông tin:</p><ul>{issues.map(issue => <li key={issue.path}><button type="button" className="min-h-9 text-left underline" onClick={() => goToIssue(issue)}>{issue.label}: {issue.message}</button></li>)}</ul></div>}
      {/* Biểu mẫu tự ẩn điều khiển sửa khi disabled; vẫn cho phép xem/tải phôi. */}
      <fieldset disabled={disabled && step !== 4} className="min-w-0 space-y-5">
        {step === 0 && (
          <div className="space-y-5">
            {/* Nhóm 1: Định danh & Phân loại */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">Định danh thủ tục</h4>
              <div className="grid gap-4 sm:grid-cols-2">
                <FieldInput field={{ key: "procedureCode", label: "Mã thủ tục" }} value={value.procedureCode} change={(next) => set("procedureCode", next)} />
                <label data-field="categoryId" className="grid gap-2 text-sm font-semibold">
                  Danh mục
                  <select
                    aria-label="Danh mục"
                    aria-invalid={Boolean(errors.categoryId)} aria-describedby={errors.categoryId ? 'category-error' : undefined}
                    className={box}
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
                  {errors.categoryId && <span id="category-error" className="text-xs text-red-800">{errors.categoryId}</span>}
                </label>
              </div>
              <FieldInput field={{ key: "title", label: "Tên thủ tục" }} value={value.title} change={(next) => set("title", next)} />
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

            {/* Nhóm 3: Thời hạn, Lệ phí & Kết quả */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">Thời hạn, Lệ phí & Kết quả</h4>
              <div className="grid gap-4 sm:grid-cols-2">
                <FieldInput field={{ key: "feeSummary", label: "Tóm tắt lệ phí" }} value={value.feeSummary} change={(next) => set("feeSummary", next)} />
                <FieldInput field={{ key: "processingTimeSummary", label: "Tóm tắt thời hạn" }} value={value.processingTimeSummary} change={(next) => set("processingTimeSummary", next)} />
              </div>
              <label className="grid gap-2 text-sm font-semibold">
                Kết quả giải quyết (mỗi kết quả một dòng)
                <textarea
                  rows={2}
                  className={box}
                  value={Array.isArray(content.results) ? content.results.join("\n") : ""}
                  onChange={(e) => setContent("results", e.target.value.split("\n").filter((line) => line.trim()))}
                />
              </label>
            </div>
          </div>
        )}
        {step === 1 && (
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
              change={(next) =>
                set(
                  "formDefinitions",
                  next.map((row) => ({
                    ...row,
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
