import { useCallback } from 'react';
import { Modal, Button } from '@/components/ui';
import { ProcedureFeedback } from '@/components/ui/ProcedureFeedback';
import { useProcedureQuery } from '@/hooks/useProcedureQuery';
import { procedureApi, type Category, type ProcedureSummary } from '@/lib/api/procedures';
import { ProcedureApiEditor } from './ProcedureApiEditor';

interface ProcedureVersionsModalProps {
  procedure: ProcedureSummary | null;
  categories: Category[];
  onClose: () => void;
}

export function ProcedureVersionsModal({ procedure, categories, onClose }: ProcedureVersionsModalProps) {
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
                <p className="text-xs text-slate-600 italic">
                  Tệp PDF đính kèm của phiên bản: {version.pdfFileName}
                </p>
              )}
            </div>
          </details>
        ))}
      </div>
    </Modal>
  );
}
