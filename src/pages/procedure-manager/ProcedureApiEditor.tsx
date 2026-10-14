import { useState } from "react";
import { ProcedureFormPicker as FormDefinitionsEditor } from './ProcedureFormPicker';
import { Button } from "@/components/ui";
import {
  procedureInputSchema,
  type Category,
  type ProcedureInput,
} from "@/lib/api/procedures";

type Row = Record<string, unknown>;
type Field = {
  key: string;
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
  if (field.kind === "boolean" || field.options)
    return (
      <label className="grid gap-2 text-sm font-semibold">
        {field.label}
        <select
          aria-label={field.label}
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
      </label>
    );
  return (
    <label className="grid gap-2 text-sm font-semibold">
      {field.label}
      {field.kind ? (
        <input
          aria-label={field.label}
          className={box}
          type={field.kind}
          step={field.kind === "number" ? "any" : undefined}
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
          value={value == null ? "" : String(value)}
          onChange={(e) => change(e.target.value)}
        />
      )}
    </label>
  );
}
function RowEditor({
  title,
  value,
  fields: rowFields,
  change,
}: {
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
        <div
          key={index}
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
        </div>
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

function humanizeFieldPath(path: string): string {
  if (path === "procedureCode") return "Phần 1 [Thông tin chung]: Mã thủ tục";
  if (path === "categoryId") return "Phần 1 [Thông tin chung]: Danh mục thủ tục";
  if (path === "title") return "Phần 1 [Thông tin chung]: Tên thủ tục (tối thiểu 10 ký tự)";
  if (path === "levelOfImplementation") return "Phần 1 [Thông tin chung]: Cấp thực hiện";
  if (path === "targetAudience") return "Phần 1 [Thông tin chung]: Đối tượng thực hiện";
  if (path === "feeSummary") return "Phần 1 [Thông tin chung]: Tóm tắt lệ phí";
  if (path === "processingTimeSummary") return "Phần 1 [Thông tin chung]: Tóm tắt thời hạn";
  if (path === "contentPayload.decisionNumber") return "Phần 1 [Thông tin chung]: Số quyết định";
  if (path === "contentPayload.receivingAddress") return "Phần 1 [Thông tin chung]: Địa chỉ tiếp nhận";
  
  const subMethodMatch = /^contentPayload\.submissionMethods\.(\d+)\.(.+)$/.exec(path);
  if (subMethodMatch) {
    const idx = Number(subMethodMatch[1]) + 1;
    const subField = subMethodMatch[2];
    const subLabel = subField === "estimatedDays" ? "Thời hạn (ngày)" : subField === "methodName" ? "Hình thức nộp" : subField === "feeAmount" ? "Lệ phí" : subField;
    return `Phần 4 [Phương thức nộp] - dòng ${idx}: ${subLabel}`;
  }

  const formDefMatch = /^formDefinitions\.(\d+)\.(.+)$/.exec(path);
  if (formDefMatch) {
    const idx = Number(formDefMatch[1]) + 1;
    const subField = formDefMatch[2];
    const subLabel = subField === "formType" ? "Loại biểu mẫu" : subField === "formCode" ? "Mã biểu mẫu" : subField === "formName" ? "Tên biểu mẫu" : subField;
    return `Phần 5 [Biểu mẫu] - mục ${idx}: ${subLabel}`;
  }

  const checklistMatch = /^checklistSchema\.(\d+)\.(.+)$/.exec(path);
  if (checklistMatch) {
    const idx = Number(checklistMatch[1]) + 1;
    const subField = checklistMatch[2];
    const subLabel = subField === "itemName" ? "Tên giấy tờ" : subField === "checklistId" ? "Mã giấy tờ" : subField;
    return `Phần 2 [Giấy tờ] - dòng ${idx}: ${subLabel}`;
  }

  const caseMatch = /^contentPayload\.cases\.(\d+)\.(.+)$/.exec(path);
  if (caseMatch) {
    const idx = Number(caseMatch[1]) + 1;
    return `Phần 3 [Trình tự & Trường hợp] - trường hợp ${idx}: ${caseMatch[2]}`;
  }

  return path;
}

export function validateProcedure(value: Row): ProcedureInput {
  // Tự động chuẩn hóa dữ liệu bóc tách từ AI trước khi kiểm tra
  const normalized: Row = JSON.parse(JSON.stringify(value));

  // 1. Chuẩn hóa formDefinitions: tự động gán formType hợp lệ nếu bị thiếu/null do AI
  if (Array.isArray(normalized.formDefinitions)) {
    normalized.formDefinitions = normalized.formDefinitions.map((form: Row) => ({
      ...form,
      formType: form.formType === "DOCX_TEMPLATE" ? "DOCX_TEMPLATE" : "ONLINE_INTERACTIVE",
      quantity: typeof form.quantity === "number" && form.quantity > 0 ? form.quantity : 1,
      isMandatory: form.isMandatory !== false,
      formCode: String(form.formCode ?? "").trim() || "MAU-01",
      formName: String(form.formName ?? "").trim() || "Mẫu biểu khai",
    }));
  }

  // 2. Chuẩn hóa submissionMethods: tự động gán estimatedDays và feeAmount nếu AI không parse ra số
  const content = (normalized.contentPayload && typeof normalized.contentPayload === "object")
    ? { ...(normalized.contentPayload as Row) }
    : {};

  if (Array.isArray(content.submissionMethods)) {
    content.submissionMethods = content.submissionMethods.map((method: Row) => ({
      ...method,
      methodName: String(method.methodName ?? "").trim() || "Nộp trực tiếp",
      feeAmount: typeof method.feeAmount === "number" && !isNaN(method.feeAmount) ? method.feeAmount : 0,
      feeUnit: String(method.feeUnit ?? "VNĐ").trim() || "VNĐ",
      estimatedDays: typeof method.estimatedDays === "number" && !isNaN(method.estimatedDays) ? method.estimatedDays : 0,
    }));
    normalized.contentPayload = content;
  }

  // 3. Chuẩn hóa checklistSchema: đảm bảo quantity > 0
  if (Array.isArray(normalized.checklistSchema)) {
    normalized.checklistSchema = normalized.checklistSchema.map((item: Row, idx: number) => ({
      ...item,
      checklistId: String(item.checklistId ?? "").trim() || `GT-${idx + 1}`,
      itemName: String(item.itemName ?? "").trim() || `Giấy tờ ${idx + 1}`,
      submissionType: item.submissionType === "XUAT_TRINH" ? "XUAT_TRINH" : "NOP",
      documentCopyType: ["ORIGINAL", "CERTIFIED_COPY", "REGULAR_COPY"].includes(String(item.documentCopyType)) ? item.documentCopyType : "ORIGINAL",
      quantity: typeof item.quantity === "number" && item.quantity > 0 ? item.quantity : 1,
      isMandatory: item.isMandatory !== false,
    }));
  }

  const parsed = procedureInputSchema.safeParse(normalized);
  if (!parsed.success) {
    const errorDetails = [...new Set(parsed.error.issues.map((issue) => humanizeFieldPath(issue.path.join("."))))];
    throw new Error(
      "Chưa thể xuất bản. Vui lòng kiểm tra và bổ sung các trường sau:\n• " +
        errorDetails.join("\n• "),
    );
  }
  return parsed.data;
}

export function ProcedureApiEditor({
  value,
  onChange,
  categories,
  disabled = false,
  initialStep = 0,
  onEditForms,
}: {
  value: Row;
  onChange: (value: Row) => void;
  categories: Category[];
  disabled?: boolean;
  initialStep?: number;
  onEditForms?: () => void;
}) {
  const [step, setStep] = useState(initialStep);
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
    <div className="min-w-0 space-y-5">
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
          </button>
        ))}
      </div>
      {/* Biểu mẫu tự ẩn điều khiển sửa khi disabled; vẫn cho phép xem/tải phôi. */}
      <fieldset disabled={disabled && step !== 4} className="min-w-0 space-y-5">
        {step === 0 && (
          <div className="space-y-5">
            {/* Nhóm 1: Định danh & Phân loại */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">Định danh thủ tục</h4>
              <div className="grid gap-4 sm:grid-cols-2">
                <FieldInput field={{ key: "procedureCode", label: "Mã thủ tục" }} value={value.procedureCode} change={(next) => set("procedureCode", next)} />
                <label className="grid gap-2 text-sm font-semibold">
                  Danh mục
                  <select
                    aria-label="Danh mục"
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
                <FieldInput field={{ key: "decisionNumber", label: "Số quyết định" }} value={content.decisionNumber} change={(next) => setContent("decisionNumber", next)} />
                <FieldInput field={{ key: "receivingAddress", label: "Địa chỉ tiếp nhận" }} value={content.receivingAddress} change={(next) => setContent("receivingAddress", next)} />
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
            title="Giấy tờ"
            value={value.checklistSchema}
            change={(next) => set("checklistSchema", next)}
            fields={[
              { key: "checklistId", label: "Mã giấy tờ" },
              {
                key: "caseCode",
                label: "Mã trường hợp (trống = áp dụng chung)",
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
              onEdit={onEditForms}
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
    </div>
  );
}
