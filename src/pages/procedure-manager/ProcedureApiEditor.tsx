import { useEffect, useState } from "react";
import { Button } from "@/components/ui";
import { ProcedureFeedback } from '@/components/ui/ProcedureFeedback';
import {
  procedureApi,
  procedureError,
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

function FormDefinitionsEditor({ value, change, disabled }: { value: unknown; change: (value: Row[]) => void; disabled: boolean }) {
  const list = rows(value);
  const [search, setSearch] = useState('');
  const [options, setOptions] = useState<Awaited<ReturnType<typeof procedureApi.documentForms>>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    if (disabled) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true); setError('');
      try { setOptions(await procedureApi.documentForms(search.trim(), controller.signal)); }
      catch (e) { if (!controller.signal.aborted) setError(procedureError(e)); }
      finally { if (!controller.signal.aborted) setLoading(false); }
    }, 300);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [search, disabled]);
  return <section className="space-y-4">
    <h3 className="font-bold">Biểu mẫu</h3>
    {!disabled && <label className="grid gap-2 text-sm font-semibold">Tìm biểu mẫu theo mã<input className={box} value={search} onChange={e => setSearch(e.target.value)} /></label>}
    <ProcedureFeedback loading={loading} error={error} />
    {!disabled && <div className="flex flex-wrap gap-2">{options.map(option => <Button key={option.id} size="small" variant="outline" disabled={list.some(row => row.formTemplateId === option.id)} onClick={() => change([...list, { formTemplateId: option.id, formCode: option.formCode, formName: option.formName, formType: option.formType, caseCode: null, quantity: 1, isMandatory: true }])}>{option.formCode} · {option.formName}</Button>)}</div>}
    {list.map((row, index) => <div key={index} className="space-y-3 rounded-xl border border-slate-200 p-4"><p className="font-semibold">{String(row.formCode)} · {String(row.formName)}</p>{!disabled && <><div className="grid gap-4 sm:grid-cols-2"><FieldInput field={{ key: 'caseCode', label: 'Mã trường hợp (nếu có)' }} value={row.caseCode} change={next => change(list.map((item, i) => i === index ? { ...item, caseCode: next || null } : item))} /><FieldInput field={{ key: 'quantity', label: 'Số lượng', kind: 'number' }} value={row.quantity} change={next => change(list.map((item, i) => i === index ? { ...item, quantity: next } : item))} /><FieldInput field={{ key: 'isMandatory', label: 'Bắt buộc', kind: 'boolean' }} value={row.isMandatory} change={next => change(list.map((item, i) => i === index ? { ...item, isMandatory: next } : item))} /></div><Button size="small" variant="ghost" onClick={() => change(list.filter((_, i) => i !== index))}>Bỏ biểu mẫu</Button></>}</div>)}
    {!loading && !error && options.length === 0 && <p className="text-sm text-slate-500">Không tìm thấy biểu mẫu phù hợp.</p>}
  </section>;
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

const requiredFieldLabels: Record<string, string> = {
  procedureCode: "Mã thủ tục",
  categoryId: "Danh mục",
  title: "Tên thủ tục (tối thiểu 10 ký tự)",
  levelOfImplementation: "Cấp thực hiện",
  targetAudience: "Đối tượng thực hiện",
  feeSummary: "Tóm tắt lệ phí",
  processingTimeSummary: "Tóm tắt thời hạn",
  "contentPayload.decisionNumber": "Số quyết định",
  "contentPayload.receivingAddress": "Địa chỉ tiếp nhận",
};

export function validateProcedure(value: Row): ProcedureInput {
  const parsed = procedureInputSchema.safeParse(value);
  if (!parsed.success)
    throw new Error(
      "Chưa thể xuất bản. Vui lòng nhập đủ các trường bắt buộc trong mục Thông tin chung:\n• " +
        [...new Set(parsed.error.issues.map((issue) => {
          const path = issue.path.join(".");
          return requiredFieldLabels[path] ?? path;
        }))].join("\n• "),
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
        className="flex flex-wrap items-center gap-1.5 rounded-2xl bg-slate-100/80 p-1.5 text-xs font-semibold"
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
                ? "bg-white font-bold text-red-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
            }`}
          >
            <span>{label}</span>
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
