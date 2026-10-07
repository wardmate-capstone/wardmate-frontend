import { useState } from "react";
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
const fields: Field[] = [
  { key: "procedureCode", label: "Mã thủ tục" },
  { key: "title", label: "Tên thủ tục" },
  { key: "levelOfImplementation", label: "Cấp thực hiện" },
  { key: "targetAudience", label: "Đối tượng thực hiện" },
  { key: "issuingAuthority", label: "Cơ quan ban hành" },
  { key: "executingAgency", label: "Cơ quan thực hiện" },
  { key: "feeSummary", label: "Tóm tắt lệ phí" },
  { key: "processingTimeSummary", label: "Tóm tắt thời hạn" },
];
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

export function validateProcedure(value: Row): ProcedureInput {
  const parsed = procedureInputSchema.safeParse(value);
  if (!parsed.success)
    throw new Error(
      "Vui lòng kiểm tra các trường bắt buộc và định dạng:\n" +
        parsed.error.issues
          .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
          .join("\n"),
    );
  const content = parsed.data.contentPayload;
  if (
    content.submissionMethods.some(
      (method) =>
        !method.methodName.trim() ||
        method.feeAmount < 0 ||
        method.estimatedDays < 0,
    )
  )
    throw new Error(
      "Phương thức nộp phải có tên, lệ phí và thời gian không âm.",
    );
  if (
    content.cases.some(
      (item) =>
        !item.caseCode.trim() ||
        !item.caseName.trim() ||
        item.steps.some((step) => !step.stepName.trim() || step.stepOrder <= 0),
    )
  )
    throw new Error(
      "Trường hợp và bước thực hiện cần mã, tên và thứ tự hợp lệ.",
    );
  return parsed.data;
}

export function ProcedureApiEditor({
  value,
  onChange,
  categories,
  disabled = false,
}: {
  value: Row;
  onChange: (value: Row) => void;
  categories: Category[];
  disabled?: boolean;
}) {
  const [step, setStep] = useState(0);
  const content = record(value.contentPayload);
  const set = (key: string, next: unknown) =>
    onChange({ ...value, [key]: next });
  const setContent = (key: string, next: unknown) =>
    set("contentPayload", { ...content, [key]: next });
  const tabItems = [
    { label: "Thông tin chung", count: null },
    { label: "Thành phần hồ sơ", count: rows(value.checklistSchema).length },
    { label: "Quy trình", count: rows(content.cases).length },
    { label: "Thời hạn & lệ phí", count: rows(content.submissionMethods).length },
    { label: "Biểu mẫu", count: rows(value.formDefinitions).length },
    { label: "Căn cứ pháp lý", count: rows(content.legalReferences).length },
  ];
  return (
    <div className="min-w-0 space-y-5">
      <div
        className="flex flex-wrap items-center gap-1.5 rounded-2xl bg-slate-100/80 p-1.5 text-xs font-semibold"
        aria-label="Các phần nội dung thủ tục"
      >
        {tabItems.map((tab, index) => (
          <button
            type="button"
            key={tab.label}
            onClick={() => setStep(index)}
            aria-pressed={step === index}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 transition-all ${
              step === index
                ? "bg-white font-bold text-red-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
            }`}
          >
            <span>{tab.label}</span>
            {tab.count != null && tab.count > 0 && (
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                  step === index
                    ? "bg-red-100 text-red-800"
                    : "bg-slate-200 text-slate-700"
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>
      <fieldset disabled={disabled} className="min-w-0 space-y-5">
        {step === 0 && (
          <div className="grid gap-4 sm:grid-cols-2">
            {fields.map((field) => (
              <FieldInput
                key={field.key}
                field={field}
                value={value[field.key]}
                change={(next) => set(field.key, next)}
              />
            ))}
            <label className="grid gap-2 text-sm font-semibold">
              Danh mục
              <select
                aria-label="Danh mục"
                className={box}
                value={String(value.categoryId ?? "")}
                onChange={(e) =>
                  set(
                    "categoryId",
                    e.target.value ? Number(e.target.value) : null,
                  )
                }
              >
                <option value="">Chọn danh mục</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.categoryName}
                  </option>
                ))}
              </select>
            </label>
            <FieldInput
              field={{ key: "decisionNumber", label: "Số quyết định" }}
              value={content.decisionNumber}
              change={(next) => setContent("decisionNumber", next)}
            />
            <FieldInput
              field={{ key: "receivingAddress", label: "Địa chỉ tiếp nhận" }}
              value={content.receivingAddress}
              change={(next) => setContent("receivingAddress", next)}
            />
            <label className="grid gap-2 text-sm font-semibold">
              Kết quả (mỗi kết quả một dòng)
              <textarea
                className={box}
                value={
                  Array.isArray(content.results)
                    ? content.results.join("\n")
                    : ""
                }
                onChange={(e) =>
                  setContent(
                    "results",
                    e.target.value.split("\n").filter((line) => line.trim()),
                  )
                }
              />
            </label>
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
            <p className="text-sm text-slate-600">
              Chỉ tạo trường hợp nghiệp vụ đã đối soát. Nhóm “phải nộp / xuất
              trình / lưu ý” trong PDF không phải các lựa chọn loại trừ nhau.
            </p>
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
          <>
            <p className="text-sm text-slate-600">
              Liên kết ID biểu mẫu đã có từ dịch vụ Biểu mẫu. Không phải tải PDF
              mô tả thủ tục.
            </p>
            <RowEditor
              title="Biểu mẫu"
              value={value.formDefinitions}
              change={(next) =>
                set(
                  "formDefinitions",
                  next.map((row) => ({
                    ...row,
                    formTemplateId: row.formTemplateId || null,
                  })),
                )
              }
              fields={[
                { key: "formCode", label: "Mã biểu mẫu" },
                { key: "formName", label: "Tên biểu mẫu" },
                { key: "caseCode", label: "Mã trường hợp (nếu có)" },
                { key: "formTemplateId", label: "ID biểu mẫu đã có (nếu có)" },
                {
                  key: "formType",
                  label: "Loại biểu mẫu",
                  options: ["ONLINE_INTERACTIVE", "DOCX_TEMPLATE"],
                },
                { key: "quantity", label: "Số lượng", kind: "number" },
                { key: "isMandatory", label: "Bắt buộc", kind: "boolean" },
              ]}
            />
          </>
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
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
          <Button
            type="button"
            variant="outline"
            size="small"
            disabled={step === 0}
            onClick={() => setStep((s) => Math.max(0, s - 1))}
          >
            ← Phần trước ({tabItems[step - 1]?.label ?? ''})
          </Button>
          <span className="text-xs font-semibold text-slate-500">
            Phần {step + 1} / {tabItems.length}: {tabItems[step].label}
          </span>
          <Button
            type="button"
            variant="outline"
            size="small"
            disabled={step === tabItems.length - 1}
            onClick={() => setStep((s) => Math.min(tabItems.length - 1, s + 1))}
          >
            Phần tiếp theo ({tabItems[step + 1]?.label ?? ''}) →
          </Button>
        </div>
        <p className="text-sm text-slate-500">
          Thông tin chưa rõ cần được đối chiếu với nguồn. Không tự điền lệ phí,
          thời hạn hoặc giấy tờ mặc định.
        </p>
      </fieldset>
    </div>
  );
}
