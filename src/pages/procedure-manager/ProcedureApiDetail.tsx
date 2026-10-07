import { useCallback, useRef, useState } from "react";
import { Button, Input, Modal } from "@/components/ui";
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
import { toast } from "@/components/ui/Toast";

export function ProcedureApiDetail({
  row,
  categories,
  onBack,
  onChange,
}: {
  row: ProcedureSummary;
  categories: Category[];
  onBack: () => void;
  onChange: (active: boolean) => void;
}) {
  const detail = useProcedureQuery(
    useCallback(
      (signal: AbortSignal) => procedureApi.managerDetail(row.id, signal),
      [row.id],
    ),
  );
  const versions = useProcedureQuery(
    useCallback(
      (signal: AbortSignal) => procedureApi.versions(row.id, signal),
      [row.id],
    ),
  );
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [date, setDate] = useState("");
  const [statusOpen, setStatusOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [rollback, setRollback] = useState<ProcedureVersion>();
  const [rollbackReason, setRollbackReason] = useState("");
  const [rollbackDecision, setRollbackDecision] = useState("");
  const [rollbackDate, setRollbackDate] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  async function run(action: () => Promise<void>) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      await action();
    } catch (e) {
      setError(procedureError(e));
    } finally {
      setBusy(false);
      lock.current = false;
    }
  }
  return (
    <div className="space-y-5">
      <Button variant="outline" onClick={onBack}>
        Về danh sách
      </Button>
      <div className="admin-card space-y-3 p-5">
        <h1 className="text-2xl font-bold">
          {detail.data?.title ?? row.title}
        </h1>
        <p>
          {row.procedureCode} · {row.categoryName} ·{" "}
          {row.isActive ? "Đang công khai" : "Ngừng công khai"}
        </p>
        <div className="flex flex-wrap gap-3">
          <Button
            disabled={!detail.data}
            onClick={() => {
              setEditing(structuredClone(detail.data!));
              setDate("");
              setError("");
            }}
          >
            Chỉnh sửa
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setStatusOpen(true);
              setError("");
            }}
          >
            {row.isActive ? "Ngừng công khai" : "Mở công khai"}
          </Button>
        </div>
      </div>
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
          />
          <PdfSource id={row.id} />
        </div>
      )}
      <section className="admin-card space-y-4 p-5">
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
              Nội dung là snapshot, không phải bản chỉnh sửa hiện tại.
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
              <Button
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
              </Button>
            </div>
          </details>
        ))}
      </section>
      <Modal
        open={!!rollback}
        onOpenChange={(open) => {
          if (!open && !busy) setRollback(undefined);
        }}
        title={`Khôi phục phiên bản ${rollback?.versionNumber ?? ''}`}
        description="Backend sẽ tạo một phiên bản mới từ bản lưu này; lịch sử cũ vẫn được giữ nguyên."
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
        open={!!editing}
        onOpenChange={(open) => {
          if (!open && !busy) setEditing(null);
        }}
        title="Chỉnh sửa thủ tục"
        className="sm:max-w-5xl"
        footer={
          <Button
            loading={busy}
            onClick={() =>
              void run(async () => {
                const input = validateProcedure(editing!);
                if (!date || !input.contentPayload.decisionNumber.trim())
                  throw new Error(
                    "Nhập ngày hiệu lực và số quyết định trước khi lưu.",
                  );
                await procedureApi.update(
                  row.id,
                  input,
                  input.contentPayload.decisionNumber,
                  date,
                );
                setEditing(null);
                detail.refresh();
                versions.refresh();
                onChange(!!row.isActive);
                toast.success("Đã cập nhật thủ tục và lưu phiên bản trước.");
              })
            }
          >
            Lưu thay đổi
          </Button>
        }
      >
        <ProcedureFeedback error={error} />
        {editing && (
          <ProcedureApiEditor
            value={editing}
            onChange={setEditing}
            categories={categories}
            disabled={busy}
          />
        )}
        <Input
          label="Ngày hiệu lực của thay đổi"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </Modal>
      <Modal
        open={statusOpen}
        onOpenChange={(open) => {
          if (!busy) setStatusOpen(open);
        }}
        title={
          row.isActive ? "Ngừng công khai thủ tục" : "Mở công khai thủ tục"
        }
        footer={
          <Button
            loading={busy}
            onClick={() =>
              void run(async () => {
                await procedureApi.status(row.id, !row.isActive, reason);
                setStatusOpen(false);
                onChange(!row.isActive);
                toast.success("Đã cập nhật trạng thái.");
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
    </div>
  );
}
