import { useCallback, useRef, useState } from "react";
import { Button, Input, Modal } from "@/components/ui";
import { ProcedureFeedback } from "@/components/ui/ProcedureFeedback";
import { useProcedureQuery } from "@/hooks/useProcedureQuery";
import {
  procedureApi,
  procedureError,
  type Category,
  type ProcedureSummary,
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
      (signal: AbortSignal) =>
        row.isActive
          ? procedureApi.detail(row.id, signal)
          : Promise.resolve(null),
      [row.id, row.isActive],
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
      {!row.isActive && (
        <p
          role="status"
          className="rounded-xl border border-amber-200 bg-amber-50 p-5"
        >
          Backend chưa cung cấp API chi tiết cho thủ tục ngừng công khai. Bạn
          vẫn có thể xem bản lưu và đổi trạng thái; chỉnh sửa sẽ được hỗ trợ khi
          BE bổ sung API.
        </p>
      )}
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
              <p className="mt-3 text-sm">
                PDF lịch sử: {version.pdfFileName}. Chưa có API cấp liên kết PDF
                lịch sử.
              </p>
            )}
          </details>
        ))}
      </section>
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
