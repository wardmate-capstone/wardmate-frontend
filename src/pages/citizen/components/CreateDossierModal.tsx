import { useEffect, useRef, useState, type ReactNode } from "react";
import { CheckCircle } from "@phosphor-icons/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, Modal, Skeleton } from "@/components/ui";
import { workflowError } from "@/lib/api/workflow";

const schema = z.object({
  procedureId: z
    .string()
    .trim()
    .min(1, "Chọn thủ tục hợp lệ.")
    .regex(
      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/,
      "Chọn thủ tục hợp lệ.",
    ),
  wardCode: z.string().trim().min(1, "Phải chọn phường/xã tiếp nhận.").max(50),
  caseCode: z.string().max(100, "Mã trường hợp tối đa 100 ký tự."),
});
export type CreateDossierValues = z.infer<typeof schema>;

// Tên thủ tục có thể rất dài; danh sách chọn gốc của trình duyệt không xuống dòng nên rút gọn để không tràn màn hình
const LABEL_MAX = 90;
const shortLabel = (text: string) =>
  text.length > LABEL_MAX ? text.slice(0, LABEL_MAX - 1).trimEnd() + "…" : text;

export function CreateDossierModal({
  open,
  onClose,
  initial,
  procedures,
  wards,
  cases,
  loading,
  unavailable,
  onRetry,
  busy,
  onProcedureChange,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  initial: CreateDossierValues;
  procedures: { id: string; title: string }[];
  wards: { code: string; name: string }[];
  cases: { caseCode: string; caseName: string }[];
  loading: boolean;
  unavailable: boolean;
  onRetry: () => void;
  busy: boolean;
  onProcedureChange: (id: string) => void;
  onSubmit: (values: CreateDossierValues) => Promise<void>;
}) {
  const form = useForm<CreateDossierValues>({
    resolver: zodResolver(schema),
    defaultValues: initial,
  });
  const selectedTitle = procedures.find(
    (x) => x.id === form.watch("procedureId"),
  )?.title;
  const [error, setError] = useState("");
  const lock = useRef(false);
  const wasOpen = useRef(false);
  useEffect(() => {
    if (open && !wasOpen.current) {
      form.reset(initial);
      setError("");
    }
    wasOpen.current = open;
  }, [open, initial.procedureId, initial.wardCode, initial.caseCode, form]);
  useEffect(() => {
    if (!open || loading) return;
    if (!form.getValues("procedureId") && initial.procedureId)
      form.setValue("procedureId", initial.procedureId);
    if (!form.getValues("wardCode") && initial.wardCode)
      form.setValue("wardCode", initial.wardCode);
    const selected = form.getValues("caseCode");
    if (!cases.some((item) => item.caseCode === selected)) {
      const matchingDefault = cases.find(
        (item) => item.caseCode === initial.caseCode,
      );
      form.setValue(
        "caseCode",
        matchingDefault?.caseCode ??
          (cases.length === 1 ? cases[0].caseCode : ""),
      );
    }
  }, [
    open,
    loading,
    cases,
    initial.caseCode,
    initial.procedureId,
    initial.wardCode,
    form,
  ]);
  const errors = form.formState.errors;
  const disabled = busy || loading;
  const canSubmit =
    !loading && !unavailable && procedures.length > 0 && wards.length > 0;
  const onlyCase = cases.length === 1 ? cases[0] : undefined;
  return (
    <Modal
      open={open}
      onOpenChange={(next) => {
        if (!next && !busy && !lock.current) onClose();
      }}
      title="Chuẩn bị hồ sơ tiền kiểm mới"
      description="Chọn thủ tục và nơi tiếp nhận để tạo bản nháp. Bạn sẽ chuẩn bị giấy tờ ở bước tiếp theo."
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Hủy
          </Button>
          <Button
            type="submit"
            form="create-dossier-form"
            loading={busy}
            disabled={!canSubmit}
          >
            Tạo hồ sơ nháp
          </Button>
        </>
      }
    >
      <form
        id="create-dossier-form"
        className="space-y-5"
        noValidate
        onSubmit={form.handleSubmit(async (values) => {
          if (loading || unavailable || busy || lock.current) return;
          if (!procedures.some((x) => x.id === values.procedureId)) {
            form.setError("procedureId", {
              message: "Thủ tục không có trong danh mục hiện tại.",
            });
            return;
          }
          if (!wards.some((x) => x.code === values.wardCode)) {
            form.setError("wardCode", {
              message: "Phường/xã không có trong danh mục hiện tại.",
            });
            return;
          }
          if (
            cases.length &&
            !cases.some((x) => x.caseCode === values.caseCode)
          ) {
            form.setError("caseCode", {
              message: "Chọn trường hợp thực hiện thủ tục.",
            });
            return;
          }
          lock.current = true;
          setError("");
          try {
            await onSubmit(values);
          } catch (err) {
            setError(workflowError(err));
          } finally {
            lock.current = false;
          }
        })}
      >
        {unavailable && (
          <div
            role="alert"
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-800"
          >
            <span>Chưa tải được danh mục cần thiết để tạo hồ sơ.</span>
            <Button variant="outline" size="small" onClick={onRetry}>
              Thử tải lại
            </Button>
          </div>
        )}

        {loading ? (
          <div
            role="status"
            aria-label="Đang tải danh mục thủ tục và phường/xã"
            className="space-y-5"
          >
            {[0, 1, 2].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-36 rounded-md" />
                <Skeleton className="h-12 w-full rounded-xl" />
              </div>
            ))}
            <span className="sr-only">Đang tải danh mục…</span>
          </div>
        ) : (
          <>
            <Field
              id="create-procedure"
              label="Thủ tục hành chính"
              error={errors.procedureId?.message}
            >
              <select
                id="create-procedure"
                disabled={disabled}
                className={fieldClass(!!errors.procedureId)}
                {...form.register("procedureId", {
                  onChange: (e) => onProcedureChange(e.target.value),
                })}
                aria-invalid={Boolean(errors.procedureId)}
                aria-describedby="create-procedure-error"
              >
                <option value="">Chọn thủ tục</option>
                {procedures.map((x) => (
                  <option key={x.id} value={x.id} title={x.title}>
                    {shortLabel(x.title)}
                  </option>
                ))}
              </select>
              {/* Tên thủ tục dài bị cắt trong ô chọn: hiện đầy đủ bên dưới */}
              {selectedTitle && selectedTitle.length > 60 && (
                <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-600">
                  {selectedTitle}
                </p>
              )}
            </Field>

            {onlyCase ? (
              <div className="space-y-1.5">
                <p className="text-sm font-semibold text-slate-900">
                  Trường hợp thực hiện
                </p>
                <p className="flex gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm leading-5 text-slate-700">
                  <CheckCircle
                    size={16}
                    weight="fill"
                    className="mt-0.5 shrink-0 text-emerald-600"
                    aria-hidden="true"
                  />
                  <span>
                    {onlyCase.caseName}{" "}
                    <span className="text-slate-500">
                      (thủ tục chỉ có một trường hợp)
                    </span>
                  </span>
                </p>
              </div>
            ) : (
              cases.length > 1 && (
                <Field
                  id="create-case"
                  label="Trường hợp thực hiện"
                  error={errors.caseCode?.message}
                >
                  <select
                    id="create-case"
                    disabled={disabled}
                    className={fieldClass(!!errors.caseCode)}
                    {...form.register("caseCode")}
                    aria-invalid={Boolean(errors.caseCode)}
                    aria-describedby="create-case-error"
                  >
                    <option value="">Chọn trường hợp</option>
                    {cases.map((x) => (
                      <option
                        key={x.caseCode}
                        value={x.caseCode}
                        title={x.caseName}
                      >
                        {shortLabel(x.caseName)}
                      </option>
                    ))}
                  </select>
                </Field>
              )
            )}

            <Field
              id="create-ward"
              label="Phường/xã tiếp nhận"
              error={errors.wardCode?.message}
            >
              <select
                id="create-ward"
                disabled={disabled}
                className={fieldClass(!!errors.wardCode)}
                {...form.register("wardCode")}
                aria-invalid={Boolean(errors.wardCode)}
                aria-describedby="create-ward-error"
              >
                <option value="">Chọn phường/xã</option>
                {wards.map((x) => (
                  <option key={x.code} value={x.code}>
                    {x.name}
                  </option>
                ))}
              </select>
            </Field>

            {!unavailable && (!procedures.length || !wards.length) && (
              <p role="alert" className="text-sm text-red-800">
                Chưa tải được danh mục bắt buộc. Đóng và tải lại trang để thử
                lại.
              </p>
            )}
          </>
        )}
        {error && (
          <p
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-800"
          >
            {error}
          </p>
        )}
      </form>
    </Modal>
  );
}

const fieldClass = (invalid: boolean) =>
  `h-12 w-full min-w-0 truncate rounded-xl border bg-white pl-3.5 pr-9 text-sm text-slate-900 transition focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:bg-slate-50 ${invalid ? "border-red-500 focus:border-red-600 focus:ring-red-100" : "border-slate-300 hover:border-slate-400 focus:border-red-600 focus:ring-red-100"}`;

function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0 space-y-1.5">
      <label
        htmlFor={id}
        className="block text-sm font-semibold text-slate-900"
      >
        {label}{" "}
        <span className="text-red-600" aria-hidden="true">
          *
        </span>
      </label>
      {children}
      {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
      <p
        id={`${id}-error`}
        role="alert"
        className="text-xs font-medium text-red-700 empty:hidden"
      >
        {error}
      </p>
    </div>
  );
}
