import { useCallback, useRef, useState } from "react";
import { z } from 'zod';
import { ArrowArcLeft, ArrowLeft, Eye, EyeSlash, Info, PencilSimple } from "@phosphor-icons/react";
import { Badge, Button, ConfirmDeleteModal, Input, Modal } from "@/components/ui";
import { ProcedureFeedback } from "@/components/ui/ProcedureFeedback";
import { useProcedureQuery } from "@/hooks/useProcedureQuery";
import {
  procedureApi,
  procedureError,
  type Category,
  type ProcedureSummary,
  type ProcedureVersion,
} from "@/lib/api/procedures";
import { ProcedureApiEditor, validateProcedure } from "./ProcedureApiEditor";
import { PdfSource } from "./ProcedureDraftWorkspace";
import { ProcedureChecklistModal } from "./ProcedureChecklistModal";
import { toast } from "@/components/ui/Toast";
import { useAuthStore } from "@/stores/authStore";
import { ProcedureValidationError, procedureIssue } from '@/lib/procedureValidation';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';

const effectiveDateSchema = z.string().min(1, 'Vui lòng nhập ngày hiệu lực của thay đổi.')
  .pipe(z.iso.date('Ngày hiệu lực không hợp lệ. Vui lòng chọn ngày đầy đủ.'));

export function ProcedureApiDetail({
  row,
  categories,
  onBack,
  onChange,
  onUnpublished,
  readOnly = false,
}: {
  row: ProcedureSummary;
  categories: Category[];
  onBack: () => void;
  onChange: (active: boolean) => void;
  /** Hủy xuất bản thành công (thủ tục đã bị xóa): trang cha đưa về danh sách bản nháp */
  onUnpublished?: () => void;
  readOnly?: boolean;
}) {
  const permissions = useAuthStore((state) => state.user?.permissions ?? []);
  const can = (permission: string) => permissions.includes(permission) && (!readOnly || permission === 'procedure.versions.read');
  const detail = useProcedureQuery(
    useCallback(
      (signal: AbortSignal) => procedureApi.managerDetail(row.id, signal),
      [row.id],
    ),
  );
  const versions = useProcedureQuery(
    useCallback(
      (signal: AbortSignal) => can("procedure.versions.read") ? procedureApi.versions(row.id, signal) : Promise.resolve([]),
      [row.id, permissions, readOnly],
    ),
  );
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [editingStep, setEditingStep] = useState(0);
  const [checklistOpen, setChecklistOpen] = useState(false);
  const [date, setDate] = useState("");
  const [statusOpen, setStatusOpen] = useState(false);
  const [unpublishOpen, setUnpublishOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [rollback, setRollback] = useState<ProcedureVersion>();
  const [rollbackReason, setRollbackReason] = useState("");
  const [rollbackDecision, setRollbackDecision] = useState("");
  const [rollbackDate, setRollbackDate] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const [validationError, setValidationError] = useState<ProcedureValidationError | null>(null);
  const [dateError, setDateError] = useState('');
  const dateInput = useRef<HTMLInputElement>(null);
  const active = detail.data?.isActive ?? row.isActive;
  // PROC-UNPUBLISH-01: chỉ thủ tục chưa từng công khai và đang ẩn mới hủy xuất bản được
  const neverPublic = !!detail.data && !detail.data.firstPublishedAt;
  const canUnpublish = neverPublic && !detail.data?.isActive;
  const guard = useUnsavedChanges(Boolean(editing && (date || JSON.stringify(editing) !== JSON.stringify(detail.data))), busy);
  async function run(action: () => Promise<void>) {
    if (readOnly || lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    setValidationError(null);
    try {
      await action();
    } catch (e) {
      if (e instanceof ProcedureValidationError) {
        setValidationError(e);
        setError("");
      } else {
        setError(procedureError(e));
      }
    } finally {
      setBusy(false);
      lock.current = false;
    }
  }
  return (
    <div className="space-y-5">
      {guard.confirmation}
      <Button variant="ghost" className="-ml-3 px-3" onClick={onBack}>
        <ArrowLeft size={18} aria-hidden="true" />
        Về danh sách
      </Button>
      <header className="admin-card flex flex-col gap-5 p-5 sm:p-6 xl:flex-row xl:items-center xl:justify-between xl:gap-8">
        <div className="min-w-0 space-y-3">
          <h1 className="break-words text-xl font-bold leading-snug tracking-tight text-slate-950 sm:text-2xl">
            {detail.data?.title ?? row.title}
          </h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-600">
            <span className="min-w-0 break-words">Mã thủ tục: <strong className="font-semibold text-slate-800">{row.procedureCode}</strong></span>
            <span className="min-w-0 break-words">Lĩnh vực: <span className="font-medium text-slate-800">{row.categoryName}</span></span>
            <Badge variant={active ? "success" : "neutral"} className="max-w-full">
              {active ? <Eye size={16} className="shrink-0" aria-hidden="true" /> : <EyeSlash size={16} className="shrink-0" aria-hidden="true" />}
              {active ? "Đang công khai" : canUnpublish ? "Đã xuất bản, chưa công khai" : "Đang ẩn"}
            </Badge>
          </div>
        </div>
        {(can("procedure.update") || can("procedure.status") || (canUnpublish && can("procedure.publish"))) && <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row xl:shrink-0 xl:border-t-0 xl:pt-0">
          {can("procedure.update") && <Button
            disabled={!detail.data}
            onClick={() => {
              setEditingStep(0);
              setValidationError(null); setDateError('');
              setEditing(structuredClone(detail.data!));
              setDate("");
              setError("");
            }}
          >
            <PencilSimple size={18} aria-hidden="true" />
            Chỉnh sửa
          </Button>}
          {can("procedure.update") && <Button
            variant="outline"
            disabled={!detail.data}
            onClick={() => setChecklistOpen(true)}
          >
            Cập nhật giấy tờ (Checklist)
          </Button>}
          {can("procedure.status") && <Button
            variant="outline"
            onClick={() => {
              setStatusOpen(true);
              setError("");
            }}
          >
            {active ? <EyeSlash size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
            {active ? "Ngừng công khai" : "Mở công khai"}
          </Button>}
          {canUnpublish && can("procedure.publish") && <Button
            variant="outline"
            className="border-red-200 text-red-700 hover:bg-red-50"
            onClick={() => {
              setUnpublishOpen(true);
              setError("");
            }}
          >
            <ArrowArcLeft size={18} aria-hidden="true" />
            Hủy xuất bản
          </Button>}
        </div>}
      </header>
      {canUnpublish && !readOnly && <div role="note" className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
        <Info size={20} className="mt-0.5 shrink-0" aria-hidden="true" />
        <p>
          Thủ tục đã xuất bản nhưng <strong>chưa công khai</strong>, người dân chưa thấy.
          Bấm <strong>"Mở công khai"</strong> khi đã sẵn sàng. Nếu xuất bản nhầm, bấm <strong>"Hủy xuất bản"</strong> để xóa thủ tục và đưa bản nháp về chờ đối soát.
        </p>
      </div>}
      <ProcedureFeedback
        loading={detail.loading}
        error={detail.error}
        retry={detail.refresh}
      />
      {detail.data && (
        <div className="admin-card space-y-5 p-5">
          <ProcedureApiEditor
            value={detail.data}
            onChange={() => {}}
            categories={categories}
            disabled
            onEditForms={can('procedure.update') ? () => {
              setEditingStep(4);
              setValidationError(null); setDateError('');
              setEditing(structuredClone(detail.data!));
              setDate('');
              setError('');
            } : undefined}
            onEditChecklist={can('procedure.update') ? () => {
              setChecklistOpen(true);
            } : undefined}
          />
          <PdfSource
            id={row.id}
            manager
            uploadable={can('procedure.update')}
            onUploaded={() => { detail.refresh(); versions.refresh(); }}
          />
        </div>
      )}
      {can("procedure.versions.read") && <section className="admin-card space-y-4 p-5">
        <h2 className="text-xl font-bold">Lịch sử phiên bản</h2>
        <ProcedureFeedback
          loading={versions.loading}
          error={versions.error}
          retry={versions.refresh}
        />
        {versions.data?.length === 0 && <p>Chưa có bản lưu.</p>}
        {versions.data?.map((version) => (
          <details key={version.id} className="rounded-xl border p-4">
            <summary className="cursor-pointer font-semibold">
              Bản lưu {version.versionNumber} ·{" "}
              {version.decisionNumber || "Chưa có số quyết định"} ·{" "}
              {version.effectiveDate}
            </summary>
            <p className="my-3 text-sm text-slate-600">
              Ngày lưu: {new Date(version.createdAt).toLocaleString("vi-VN")}.
              Đây là nội dung đã lưu ở phiên bản này.
            </p>
            <ProcedureApiEditor
              value={version.snapshotData}
              categories={categories}
              onChange={() => {}}
              disabled
            />
            {version.pdfFileName && (
              <div className="mt-3"><p className="mb-2 text-sm">PDF lịch sử: {version.pdfFileName}</p><PdfSource id={row.id} versionId={version.id} /></div>
            )}
            <div className="mt-3 pt-3 border-t border-slate-100">
              {can("procedure.rollback") && <Button
                size="small"
                variant="outline"
                onClick={() => {
                  setRollback(version);
                  setRollbackReason('');
                  setRollbackDecision('');
                  setRollbackDate('');
                  setError('');
                }}
              >
                Khôi phục phiên bản này
              </Button>}
            </div>
          </details>
        ))}
      </section>}
      <Modal
        open={!readOnly && !!rollback}
        onOpenChange={(open) => {
          if (!open && !busy) setRollback(undefined);
        }}
        title={`Khôi phục phiên bản ${rollback?.versionNumber ?? ''}`}
        description="Nội dung của phiên bản này sẽ được khôi phục thành bản mới. Các phiên bản cũ vẫn được giữ lại."
        footer={
          <>
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => setRollback(undefined)}
            >
              Hủy
            </Button>
            <Button
              loading={busy}
              onClick={() =>
                void run(async () => {
                  if (!rollback) return;
                  if (!rollbackReason.trim() || !rollbackDecision.trim() || !rollbackDate) {
                    throw new Error('Nhập đủ lý do, số quyết định và ngày hiệu lực.');
                  }
                  await procedureApi.rollback(row.id, rollback.versionNumber, {
                    reason: rollbackReason.trim(),
                    decisionNumber: rollbackDecision.trim(),
                    effectiveDate: rollbackDate,
                  });
                  setRollback(undefined);
                  detail.refresh();
                  versions.refresh();
                  onChange(!!row.isActive);
                  toast.success('Đã khôi phục nội dung và tạo phiên bản mới.');
                })
              }
            >
              Xác nhận khôi phục
            </Button>
          </>
        }
      >
        <ProcedureFeedback error={error} />
        <div className="space-y-4">
          <Input
            label="Lý do khôi phục"
            value={rollbackReason}
            disabled={busy}
            onChange={(e) => setRollbackReason(e.target.value)}
          />
          <Input
            label="Số quyết định"
            value={rollbackDecision}
            disabled={busy}
            onChange={(e) => setRollbackDecision(e.target.value)}
          />
          <Input
            label="Ngày hiệu lực"
            type="date"
            value={rollbackDate}
            disabled={busy}
            onChange={(e) => setRollbackDate(e.target.value)}
          />
        </div>
      </Modal>
      <Modal
        open={!readOnly && !!editing}
        onOpenChange={(open) => {
          if (!open) guard.requestClose(() => setEditing(null));
        }}
        title="Chỉnh sửa thủ tục"
        className="sm:max-w-5xl"
        footer={
          <Button
            loading={busy}
            onClick={() => {
              const checkedDate = effectiveDateSchema.safeParse(date);
              if (!checkedDate.success) {
                setDateError(checkedDate.error.issues[0].message);
                dateInput.current?.focus();
                dateInput.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
                return;
              }
              void run(async () => {
                const input = validateProcedure(editing!);
                const decisionNumber = input.contentPayload.decisionNumber?.trim() ?? '';
                if (!decisionNumber) throw new ProcedureValidationError([procedureIssue('contentPayload.decisionNumber', 'Vui lòng nhập số quyết định trước khi lưu.')]);
                // input giữ nguyên originalPdfUrl/pdfFileName của thủ tục để không mất liên kết PDF gốc
                await procedureApi.update(
                  row.id,
                  input,
                  decisionNumber,
                  checkedDate.data,
                );
                setEditing(null);
                detail.refresh();
                versions.refresh();
                onChange(!!row.isActive);
                toast.success("Đã cập nhật thủ tục và lưu phiên bản trước.");
              });
            }}
          >
            Lưu thay đổi
          </Button>
        }
      >
        <ProcedureFeedback error={error} />
        {editing && (
          <ProcedureApiEditor
            value={editing}
            initialStep={editingStep}
            validationError={validationError}
            onChange={setEditing}
            categories={categories}
            disabled={busy}
          />
        )}
        <Input
          label="Ngày hiệu lực của thay đổi"
          required
          hint="Bắt buộc nhập ngày hiệu lực trước khi lưu thay đổi."
          ref={dateInput} error={dateError} disabled={busy}
          type="date"
          value={date}
          onChange={(e) => { setDate(e.target.value); setDateError(''); }}
          onBlur={() => {
            const result = effectiveDateSchema.safeParse(date);
            setDateError(result.success ? '' : result.error.issues[0].message);
          }}
        />
      </Modal>
      <Modal
        open={!readOnly && statusOpen}
        onOpenChange={(open) => {
          if (!busy) setStatusOpen(open);
        }}
        title={
          active ? "Ngừng công khai thủ tục" : "Mở công khai thủ tục"
        }
        description={
          active
            ? "Người dân sẽ không thấy thủ tục này nữa. Có thể mở công khai lại bất cứ lúc nào."
            : neverPublic
              ? "Đây là lần công khai đầu tiên. Sau khi công khai sẽ không hủy xuất bản được nữa, chỉ có thể ngừng công khai."
              : "Người dân sẽ thấy lại thủ tục này trên cổng tra cứu."
        }
        footer={
          <Button
            loading={busy}
            onClick={() =>
              void run(async () => {
                await procedureApi.status(row.id, !active, reason);
                setStatusOpen(false);
                onChange(!active);
                // Tải lại để cập nhật firstPublishedAt (ẩn nút "Hủy xuất bản" sau lần công khai đầu)
                detail.refresh();
                toast.success(active ? "Đã ngừng công khai thủ tục." : "Đã công khai thủ tục.");
              })
            }
          >
            Xác nhận
          </Button>
        }
      >
        <Input
          label="Lý do (không bắt buộc)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <ProcedureFeedback error={error} />
      </Modal>
      <ConfirmDeleteModal
        open={!readOnly && unpublishOpen}
        onOpenChange={(open) => { if (!busy) setUnpublishOpen(open); }}
        title="Hủy xuất bản thủ tục"
        itemName={detail.data?.title ?? row.title}
        description="Thủ tục và lịch sử phiên bản của nó sẽ bị xóa hẳn. Bản nháp PDF tạo ra thủ tục này quay về trạng thái chờ đối soát để bạn sửa, xuất bản lại hoặc xóa."
        warningNote="Không thể hoàn tác thao tác này."
        confirmLabel="Hủy xuất bản"
        loading={busy}
        onConfirm={() =>
          void run(async () => {
            try {
              await procedureApi.unpublish(row.id);
            } catch (e) {
              // 409 procedure.already_public: thủ tục vừa được công khai ở nơi khác → tải lại để ẩn nút
              detail.refresh();
              throw e;
            }
            setUnpublishOpen(false);
            toast.success("Đã hủy xuất bản. Bản nháp đã quay về trạng thái chờ đối soát.");
            if (onUnpublished) onUnpublished(); else onBack();
          })
        }
      >
        <ProcedureFeedback error={error} />
      </ConfirmDeleteModal>
      {!readOnly && detail.data && (
        <ProcedureChecklistModal
          open={checklistOpen}
          onOpenChange={setChecklistOpen}
          procedureId={row.id}
          expectedUpdatedAt={detail.data.updatedAt}
          initialItems={detail.data.checklistSchema ?? []}
          cases={detail.data.contentPayload.cases ?? []}
          currentDecisionNumber={detail.data.contentPayload.decisionNumber}
          onSuccess={() => {
            detail.refresh();
            versions.refresh();
            onChange(!!row.isActive);
          }}
          onReload={() => {
            detail.refresh();
            versions.refresh();
          }}
        />
      )}
    </div>
  );
}
