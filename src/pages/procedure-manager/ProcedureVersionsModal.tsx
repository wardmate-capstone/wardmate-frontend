import { useCallback, useRef, useState } from 'react';
import { Modal, Button, Input } from '@/components/ui';
import { ProcedureFeedback } from '@/components/ui/ProcedureFeedback';
import { useProcedureQuery } from '@/hooks/useProcedureQuery';
import { procedureApi, procedureError, type Category, type ProcedureSummary, type ProcedureVersion } from '@/lib/api/procedures';
import { ProcedureApiEditor } from './ProcedureApiEditor';
import { PdfSource } from './ProcedureDraftWorkspace';
import { toast } from '@/components/ui/Toast';

interface ProcedureVersionsModalProps {
  procedure: ProcedureSummary | null;
  categories: Category[];
  onClose: () => void;
  onChanged: () => void;
}

export function ProcedureVersionsModal({ procedure, categories, onClose, onChanged }: ProcedureVersionsModalProps) {
  const [rollback, setRollback] = useState<ProcedureVersion>();
  const [reason, setReason] = useState('');
  const [decisionNumber, setDecisionNumber] = useState('');
  const [effectiveDate, setEffectiveDate] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const versions = useProcedureQuery(
    useCallback(
      (signal: AbortSignal) => (procedure ? procedureApi.versions(procedure.id, signal) : Promise.resolve([])),
      [procedure]
    )
  );

  return (
    <Modal
      open={!!procedure}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={`Lịch sử phiên bản: ${procedure?.title ?? ''}`}
      description={`Mã thủ tục: ${procedure?.procedureCode ?? ''} · Tổng số bản lưu đã ghi nhận`}
      className="sm:max-w-4xl"
      footer={<Button variant="outline" onClick={onClose}>Đóng</Button>}
    >
      <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
        <ProcedureFeedback loading={versions.loading} error={versions.error} retry={versions.refresh} />

        {versions.data?.length === 0 && !versions.loading && (
          <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
            Chưa có bản lưu phiên bản nào cho thủ tục này. Các phiên bản sẽ tự động được tạo khi có chỉnh sửa hoặc xuất bản lại.
          </p>
        )}

        {versions.data?.map((version) => (
          <details key={version.id} className="rounded-xl border border-slate-200 bg-white p-4 transition-all">
            <summary className="cursor-pointer font-semibold text-slate-900 select-none">
              Phiên bản {version.versionNumber} · {version.decisionNumber ? `QĐ: ${version.decisionNumber}` : 'Chưa có số quyết định'} · Ngày hiệu lực: {version.effectiveDate}
            </summary>
            <div className="mt-3 space-y-3 pt-3 border-t border-slate-100 text-sm">
              <p className="text-xs text-slate-500">
                Thời điểm ghi nhận bản lưu: {new Date(version.createdAt).toLocaleString('vi-VN')}
              </p>
              <ProcedureApiEditor
                value={version.snapshotData}
                categories={categories}
                onChange={() => {}}
                disabled
              />
              {version.pdfFileName && (
                <div><p className="mb-2 text-xs italic text-slate-600">Tệp PDF đính kèm: {version.pdfFileName}</p><PdfSource id={procedure!.id} versionId={version.id} /></div>
              )}
              <Button size="small" variant="outline" onClick={() => { setRollback(version); setReason(''); setDecisionNumber(''); setEffectiveDate(''); setError(''); }}>Khôi phục phiên bản này</Button>
            </div>
          </details>
        ))}
      </div>
      <Modal open={!!rollback} onOpenChange={open => { if (!open && !busy) setRollback(undefined); }} title={`Khôi phục phiên bản ${rollback?.versionNumber ?? ''}`} description="Backend sẽ tạo một phiên bản mới từ bản lưu này; lịch sử cũ vẫn được giữ nguyên." footer={<Button loading={busy} onClick={async () => { if (lock.current || !procedure || !rollback) return; lock.current = true; setBusy(true); setError(''); try { if (!reason.trim() || !decisionNumber.trim() || !effectiveDate) throw new Error('Nhập đủ lý do, số quyết định và ngày hiệu lực.'); await procedureApi.rollback(procedure.id, rollback.versionNumber, { reason: reason.trim(), decisionNumber: decisionNumber.trim(), effectiveDate }); setRollback(undefined); versions.refresh(); onChanged(); toast.success('Đã khôi phục nội dung và tạo phiên bản mới.'); } catch (e) { setError(procedureError(e)); } finally { setBusy(false); lock.current = false; } }}>Xác nhận khôi phục</Button>}>
        <ProcedureFeedback error={error} /><div className="space-y-4"><Input label="Lý do khôi phục" value={reason} disabled={busy} onChange={e => setReason(e.target.value)} /><Input label="Số quyết định" value={decisionNumber} disabled={busy} onChange={e => setDecisionNumber(e.target.value)} /><Input label="Ngày hiệu lực" type="date" value={effectiveDate} disabled={busy} onChange={e => setEffectiveDate(e.target.value)} /></div>
      </Modal>
    </Modal>
  );
}
