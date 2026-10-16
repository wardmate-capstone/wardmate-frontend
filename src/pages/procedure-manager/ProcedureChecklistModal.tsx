import { useState, useRef, useEffect } from 'react';
import { Button, Input, Modal, toast } from '@/components/ui';
import { ProcedureFeedback } from '@/components/ui/ProcedureFeedback';
import { procedureApi, procedureError, type ChecklistUpdateInput } from '@/lib/api/procedures';
import { validateChecklistItems, ProcedureValidationError } from '@/lib/procedureValidation';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import axios from 'axios';

type ChecklistRow = {
  checklistId: string;
  caseCode?: string | null;
  itemName: string;
  submissionType: 'NOP' | 'XUAT_TRINH';
  documentCopyType: 'ORIGINAL' | 'CERTIFIED_COPY' | 'REGULAR_COPY';
  quantity: number;
  conditionNote?: string | null;
  isMandatory: boolean;
};

const boxClass =
  'min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50/60 p-3 text-sm text-slate-900 transition focus:border-red-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-100';

export function ProcedureChecklistModal({
  open,
  onOpenChange,
  procedureId,
  expectedUpdatedAt,
  initialItems,
  cases,
  currentDecisionNumber,
  onSuccess,
  onReload,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  procedureId: string;
  expectedUpdatedAt: string;
  initialItems: unknown[];
  cases: Array<{ caseCode?: string | null; caseName?: string | null }>;
  currentDecisionNumber?: string | null;
  onSuccess: () => void;
  onReload: () => void;
}) {
  const [items, setItems] = useState<ChecklistRow[]>([]);
  const [decisionNumber, setDecisionNumber] = useState('');
  const [effectiveDate, setEffectiveDate] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [isConflict, setIsConflict] = useState(false);
  const lock = useRef(false);

  useEffect(() => {
    if (open) {
      const cloned = (Array.isArray(initialItems) ? initialItems : []).map((raw) => {
        const item = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
        return {
          checklistId: String(item.checklistId ?? ''),
          caseCode: item.caseCode ? String(item.caseCode) : null,
          itemName: String(item.itemName ?? ''),
          submissionType: (item.submissionType === 'XUAT_TRINH' ? 'XUAT_TRINH' : 'NOP') as 'NOP' | 'XUAT_TRINH',
          documentCopyType: (['CERTIFIED_COPY', 'REGULAR_COPY'].includes(String(item.documentCopyType))
            ? item.documentCopyType
            : 'ORIGINAL') as 'ORIGINAL' | 'CERTIFIED_COPY' | 'REGULAR_COPY',
          quantity: typeof item.quantity === 'number' && item.quantity > 0 ? item.quantity : 1,
          conditionNote: item.conditionNote ? String(item.conditionNote) : null,
          isMandatory: item.isMandatory !== false,
        };
      });
      setItems(cloned);
      setDecisionNumber(currentDecisionNumber ?? '');
      setEffectiveDate(new Date().toISOString().slice(0, 10));
      setError('');
      setIsConflict(false);
    }
  }, [open, initialItems, currentDecisionNumber]);

  const isDirty = open && (
    JSON.stringify(items) !== JSON.stringify(initialItems) ||
    decisionNumber !== (currentDecisionNumber ?? '')
  );
  const guard = useUnsavedChanges(isDirty, busy);

  const updateItem = (index: number, patch: Partial<ChecklistRow>) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      {
        checklistId: `GIAY_TO_${prev.length + 1}`,
        caseCode: null,
        itemName: '',
        submissionType: 'NOP',
        documentCopyType: 'ORIGINAL',
        quantity: 1,
        conditionNote: null,
        isMandatory: true,
      },
    ]);
  };

  const handleSave = async () => {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError('');
    setIsConflict(false);

    try {
      if (!decisionNumber.trim()) {
        throw new Error('Vui lòng nhập số quyết định ban hành.');
      }
      if (decisionNumber.trim().length > 100) {
        throw new Error('Số quyết định không được vượt quá 100 ký tự.');
      }
      if (!effectiveDate.trim()) {
        throw new Error('Vui lòng chọn ngày có hiệu lực.');
      }

      const validItems = validateChecklistItems(items, cases);

      const payload: ChecklistUpdateInput = {
        expectedUpdatedAt,
        decisionNumber: decisionNumber.trim(),
        effectiveDate: effectiveDate.trim(),
        items: validItems,
      };

      await procedureApi.updateChecklist(procedureId, payload);
      toast.success('Đã cập nhật danh mục giấy tờ và ghi nhận phiên bản mới thành công.');
      onSuccess();
      onOpenChange(false);
    } catch (e: unknown) {
      if (axios.isAxiosError(e)) {
        const status = e.response?.status;
        const code = (e.response?.data as Record<string, unknown>)?.code;
        if (status === 409 || code === 'procedure.concurrent_update') {
          setIsConflict(true);
          setError(
            'Thủ tục đã được cập nhật bởi một phiên làm việc khác. Phiên bản hiện tại trên màn hình đã cũ, vui lòng tải lại dữ liệu trước khi lưu.'
          );
          return;
        }
      }
      if (e instanceof ProcedureValidationError) {
        setError(e.message);
      } else {
        setError(procedureError(e));
      }
    } finally {
      setBusy(false);
      lock.current = false;
    }
  };

  return (
    <>
      {guard.confirmation}
      <Modal
        open={open}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            guard.requestClose(() => onOpenChange(false));
          } else {
            onOpenChange(true);
          }
        }}
        title="Cập nhật danh mục giấy tờ (Checklist)"
        description="Chỉnh sửa danh mục thành phần hồ sơ và giấy tờ theo quy định mới. Thao tác này sẽ tự động lưu một phiên bản lịch sử mới cho thủ tục."
        className="sm:max-w-5xl"
        footer={
          <div className="flex w-full flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-slate-500">
              Tổng số giấy tờ: <strong className="text-slate-800">{items.length}</strong> / tối đa 500
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                disabled={busy}
                onClick={() => guard.requestClose(() => onOpenChange(false))}
              >
                Hủy
              </Button>
              <Button loading={busy} onClick={handleSave}>
                Lưu danh mục giấy tờ
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-6">
          {isConflict && (
            <div className="flex flex-col gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-900">
              <div className="flex items-start gap-2">
                <span className="text-lg">⚠️</span>
                <p className="text-sm font-semibold">{error}</p>
              </div>
              <div>
                <Button
                  size="small"
                  variant="outline"
                  onClick={() => {
                    onReload();
                    onOpenChange(false);
                  }}
                >
                  Tải lại dữ liệu mới nhất
                </Button>
              </div>
            </div>
          )}

          {!isConflict && <ProcedureFeedback error={error} />}

          {/* Nhóm thông tin pháp lý ban hành */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Quyết định áp dụng danh mục giấy tờ mới
            </h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-semibold text-slate-800">
                Số quyết định ban hành <span className="text-red-600">*</span>
                <Input
                  placeholder="Ví dụ: 123/QĐ-UBND"
                  value={decisionNumber}
                  maxLength={100}
                  onChange={(e) => setDecisionNumber(e.target.value)}
                  disabled={busy}
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-slate-800">
                Ngày có hiệu lực <span className="text-red-600">*</span>
                <Input
                  type="date"
                  value={effectiveDate}
                  onChange={(e) => setEffectiveDate(e.target.value)}
                  disabled={busy}
                />
              </label>
            </div>
          </div>

          {/* Danh sách các giấy tờ (Checklist items) */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Danh mục giấy tờ hồ sơ</h3>
              <Button size="small" variant="outline" onClick={addItem} disabled={busy || items.length >= 500}>
                + Thêm giấy tờ
              </Button>
            </div>

            {items.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
                Chưa có giấy tờ nào trong danh mục. Nhấn <strong>+ Thêm giấy tờ</strong> để bắt đầu.
              </div>
            ) : (
              <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
                {items.map((row, index) => (
                  <div
                    key={index}
                    className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-2xs hover:border-slate-300 transition"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="text-xs font-bold text-red-800 bg-red-50 px-2.5 py-1 rounded-md">
                        Mục {index + 1}
                      </span>
                      <Button
                        size="small"
                        variant="ghost"
                        className="text-red-600 hover:bg-red-50 hover:text-red-800"
                        onClick={() => removeItem(index)}
                        disabled={busy}
                      >
                        Xóa mục này
                      </Button>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3">
                      <label className="grid gap-1.5 text-xs font-semibold text-slate-700">
                        Mã giấy tờ (Checklist ID) <span className="text-red-600">*</span>
                        <input
                          className={boxClass}
                          placeholder="Mã định danh (duy nhất)"
                          value={row.checklistId}
                          onChange={(e) => updateItem(index, { checklistId: e.target.value })}
                          disabled={busy}
                        />
                      </label>

                      <label className="grid gap-1.5 text-xs font-semibold text-slate-700">
                        Trường hợp áp dụng
                        <select
                          className={boxClass}
                          value={row.caseCode ?? ''}
                          onChange={(e) => updateItem(index, { caseCode: e.target.value || null })}
                          disabled={busy}
                        >
                          <option value="">Áp dụng chung cho mọi trường hợp</option>
                          {cases.map((c) => (
                            <option key={c.caseCode} value={c.caseCode ?? ''}>
                              {c.caseCode} - {c.caseName}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="grid gap-1.5 text-xs font-semibold text-slate-700">
                        Tên giấy tờ / thành phần <span className="text-red-600">*</span>
                        <input
                          className={boxClass}
                          placeholder="Tên giấy tờ theo quy định"
                          value={row.itemName}
                          onChange={(e) => updateItem(index, { itemName: e.target.value })}
                          disabled={busy}
                        />
                      </label>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-4">
                      <label className="grid gap-1.5 text-xs font-semibold text-slate-700">
                        Hình thức
                        <select
                          className={boxClass}
                          value={row.submissionType}
                          onChange={(e) =>
                            updateItem(index, {
                              submissionType: e.target.value as 'NOP' | 'XUAT_TRINH',
                            })
                          }
                          disabled={busy}
                        >
                          <option value="NOP">Nộp bản giấy / tải lên</option>
                          <option value="XUAT_TRINH">Xuất trình đối chiếu</option>
                        </select>
                      </label>

                      <label className="grid gap-1.5 text-xs font-semibold text-slate-700">
                        Loại bản giấy tờ
                        <select
                          className={boxClass}
                          value={row.documentCopyType}
                          onChange={(e) =>
                            updateItem(index, {
                              documentCopyType: e.target.value as 'ORIGINAL' | 'CERTIFIED_COPY' | 'REGULAR_COPY',
                            })
                          }
                          disabled={busy}
                        >
                          <option value="ORIGINAL">Bản chính (Gốc)</option>
                          <option value="CERTIFIED_COPY">Bản sao chứng thực</option>
                          <option value="REGULAR_COPY">Bản chụp / photocopy</option>
                        </select>
                      </label>

                      <label className="grid gap-1.5 text-xs font-semibold text-slate-700">
                        Số lượng bản <span className="text-red-600">*</span>
                        <input
                          type="number"
                          min={1}
                          step={1}
                          className={boxClass}
                          value={row.quantity}
                          onChange={(e) => updateItem(index, { quantity: Math.max(1, Number(e.target.value)) })}
                          disabled={busy}
                        />
                      </label>

                      <label className="grid gap-1.5 text-xs font-semibold text-slate-700">
                        Bắt buộc nộp
                        <select
                          className={boxClass}
                          value={String(row.isMandatory)}
                          onChange={(e) => updateItem(index, { isMandatory: e.target.value === 'true' })}
                          disabled={busy}
                        >
                          <option value="true">Bắt buộc</option>
                          <option value="false">Không bắt buộc</option>
                        </select>
                      </label>
                    </div>

                    <div>
                      <label className="grid gap-1.5 text-xs font-semibold text-slate-700">
                        Điều kiện áp dụng / Ghi chú hướng dẫn
                        <textarea
                          rows={2}
                          className={boxClass}
                          placeholder="Ví dụ: Chỉ áp dụng khi đương sự không có mặt tại địa phương..."
                          value={row.conditionNote ?? ''}
                          onChange={(e) => updateItem(index, { conditionNote: e.target.value || null })}
                          disabled={busy}
                        />
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </Modal>
    </>
  );
}
