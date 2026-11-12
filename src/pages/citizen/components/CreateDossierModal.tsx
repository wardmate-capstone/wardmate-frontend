import { useEffect, useRef, useState, type ReactNode } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, ListSelect, Modal, Skeleton } from "@/components/ui";
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
  return (
    <Modal
      open={open}
      onOpenChange={(next) => {
        if (!next && !busy && !lock.current) onClose();
      }}
      title="Chuẩn bị hồ sơ tiền kiểm mới"
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
              <Controller
                control={form.control}
                name="procedureId"
                render={({ field }) => (
                  <ListSelect
                    id="create-procedure"
                    value={field.value}
                    onChange={(next) => {
                      field.onChange(next);
                      onProcedureChange(next);
                    }}
                    onBlur={field.onBlur}
                    placeholder="Chọn thủ tục"
                    searchable
                    searchPlaceholder="Tìm theo tên thủ tục…"
                    options={procedures.map((x) => ({
                      value: x.id,
                      label: x.title,
                    }))}
                    disabled={disabled}
                    invalid={Boolean(errors.procedureId)}
                    describedBy="create-procedure-error"
                  />
                )}
              />
            </Field>

            {/* Thủ tục chỉ có một trường hợp: tự chọn ngầm, không hiển thị (nội dung thường rất dài) */}
            {cases.length > 1 && (
                <Field
                  id="create-case"
                  label="Trường hợp thực hiện"
                  error={errors.caseCode?.message}
                >
                  <Controller
                    control={form.control}
                    name="caseCode"
                    render={({ field }) => (
                      <ListSelect
                        id="create-case"
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        placeholder="Chọn trường hợp"
                        options={cases.map((x) => ({
                          value: x.caseCode,
                          label: x.caseName,
                        }))}
                        disabled={disabled}
                        invalid={Boolean(errors.caseCode)}
                        describedBy="create-case-error"
                      />
                    )}
                  />
                </Field>
            )}

            <Field
              id="create-ward"
              label="Phường/xã tiếp nhận"
              error={errors.wardCode?.message}
            >
              <Controller
                control={form.control}
                name="wardCode"
                render={({ field }) => (
                  <ListSelect
                    id="create-ward"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    placeholder="Chọn phường/xã"
                    // Chỉ hiện ô tìm kiếm khi danh sách phường dài
                    searchable={wards.length > 7}
                    searchPlaceholder="Tìm phường/xã…"
                    options={wards.map((x) => ({
                      value: x.code,
                      label: x.name,
                    }))}
                    disabled={disabled}
                    invalid={Boolean(errors.wardCode)}
                    describedBy="create-ward-error"
                  />
                )}
              />
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
