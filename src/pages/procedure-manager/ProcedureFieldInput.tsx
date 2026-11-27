import { useContext } from "react";
import { ProcedureErrorsContext, ProcedureFieldPrefix } from "@/lib/procedureValidation";

// Ô nhập dùng chung của trình sửa thủ tục (tách khỏi ProcedureApiEditor để trình sửa thành phần hồ sơ dùng lại).
export type Row = Record<string, unknown>;
export type Field = {
  key: string;
  path?: string;
  label: string;
  /** text: ô một dòng cho trường ngắn (mã, số quyết định, cơ quan…); không đặt kind = ô nhiều dòng */
  kind?: "text" | "number" | "boolean" | "date" | "multi";
  placeholder?: string;
  options?: string[];
  /** Nhãn hiển thị cho từng giá trị trong options */
  optionLabels?: Record<string, string>;
  required?: boolean;
  hint?: string;
  /** Số dòng của ô văn bản (mặc định 2) */
  rows?: number;
};
// Nhãn tiếng Việt cho các giá trị mã của BE
export const COPY_TYPE_LABELS: Record<string, string> = { ORIGINAL: "Bản chính", CERTIFIED_COPY: "Bản sao chứng thực", REGULAR_COPY: "Bản sao / bản chụp", OTHER: "Loại khác (ghi rõ ở ô số lượng bằng chữ)" };
export const SUBMISSION_TYPE_LABELS: Record<string, string> = { NOP: "Nộp", XUAT_TRINH: "Xuất trình" };
export const TIME_UNIT_LABELS: Record<string, string> = { WORKING_DAY: "Ngày làm việc", DAY: "Ngày", HOUR: "Giờ", MINUTE: "Phút" };
export const FEE_KIND_LABELS: Record<string, string> = { PHI: "Phí", LE_PHI: "Lệ phí" };
export const getInputBoxClass = (hasError: boolean) =>
  // Khung chuẩn của ô nhập; ô lỗi viền đỏ + nền đỏ rất nhạt (trước đây focus ô thường màu xám đen, lệch toàn hệ thống)
  `min-h-11 w-full rounded-xl border p-3 text-sm text-slate-900 transition-colors focus:border-red-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-red-100 ${
    hasError
      ? "border-red-700 bg-red-50/40 placeholder:text-red-300"
      : "border-slate-300 bg-white placeholder:text-slate-400"
  }`;
export const record = (value: unknown): Row =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Row)
    : {};
export const rows = (value: unknown): Row[] =>
  Array.isArray(value) ? value.map(record) : [];
export function FieldInput({
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
      <fieldset data-field={path} className="grid content-start gap-2 text-sm font-semibold">
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
      <label data-field={path} className="grid content-start gap-2 text-sm font-semibold">
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
    <label data-field={path} className="grid content-start gap-2 text-sm font-semibold">
      {labelContent}
      {field.kind ? (
        <input
          aria-label={field.label}
          className={getInputBoxClass(hasError)}
          placeholder={field.placeholder}
          type={field.kind}
          aria-invalid={hasError}
          aria-describedby={hasError ? path + '-error' : undefined}
          min={field.key === 'quantity' ? 1 : ['feeAmount', 'estimatedDays'].includes(field.key) ? 0 : undefined}
          step={field.kind === "number" ? field.key === 'quantity' ? 1 : "any" : undefined}
          value={value == null ? "" : String(value)}
          onChange={(e) =>
            change(
              e.target.value === ""
                ? field.kind === "text" ? "" : null // ô một dòng giữ cách lưu như ô nhiều dòng cũ
                : field.kind === "number"
                  ? Number(e.target.value)
                  : e.target.value,
            )
          }
        />
      ) : (
        <textarea
          aria-label={field.label}
          className={`${getInputBoxClass(hasError)} resize-y`}
          placeholder={field.placeholder}
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
