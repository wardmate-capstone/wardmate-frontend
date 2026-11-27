import { useState, useRef, useEffect, type ReactNode } from 'react';
import { CaretDown, Info, Plus, Trash, Warning } from '@phosphor-icons/react';
import { Button, Input, Modal, toast } from '@/components/ui';
import { procedureApi, procedureError, type ChecklistUpdateInput } from '@/lib/api/procedures';
import { validateChecklistItems, ProcedureValidationError } from '@/lib/procedureValidation';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { groupByCase } from '@/lib/procedureCases';
import { checklistQuantityLabel } from '@/lib/procedureDisplay';
import axios from 'axios';

type CopyType = 'ORIGINAL' | 'CERTIFIED_COPY' | 'REGULAR_COPY' | 'OTHER';
type ChecklistRow = {
  checklistId: string;
  caseCode?: string | null;
  itemName: string;
  submissionType: 'NOP' | 'XUAT_TRINH';
  // null khi giấy tờ cần nhiều loại bản (copyRequirements)
  documentCopyType: CopyType | null;
  quantity: number;
  conditionNote?: string | null;
  isMandatory: boolean;
  // Giữ nguyên các trường modal không sửa (BE-H, PROC-02a) để lưu không làm mất dữ liệu
  copyRequirements?: { documentCopyType: CopyType; quantity: number }[] | null;
  quantityText?: string | null;
  note?: string | null;
  formCodes?: string[] | null;
};
const COPY_TYPES: CopyType[] = ['ORIGINAL', 'CERTIFIED_COPY', 'REGULAR_COPY', 'OTHER'];
const copyLabel = (t: CopyType) => ({ ORIGINAL: 'bản chính', CERTIFIED_COPY: 'bản sao chứng thực', REGULAR_COPY: 'bản chụp', OTHER: 'bản khác' })[t];

// Ô nhập và ô chọn cùng chiều cao để các hàng thẳng nhau
const controlClass = (invalid: boolean) =>
  `h-11 w-full rounded-xl border bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-red-600 focus:outline-none focus:ring-4 focus:ring-red-100 disabled:bg-slate-50 ${invalid ? 'border-red-700 bg-red-50/40' : 'border-slate-300'}`;

/** Ngày hôm nay theo giờ máy (UTC+07 ở Việt Nam); toISOString() bị lùi một ngày trước 07:00. */
function localToday() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

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
  // Mốc so sánh "chưa lưu" là dữ liệu đã chuẩn hóa lúc mở, không phải dữ liệu thô (tránh luôn báo có thay đổi)
  const [baseline, setBaseline] = useState('[]');
  const [decisionNumber, setDecisionNumber] = useState('');
  const [effectiveDate, setEffectiveDate] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isConflict, setIsConflict] = useState(false);
  // Giấy tờ vừa thêm mở sẵn để nhập ngay
  const [opened, setOpened] = useState<Set<number>>(new Set());
  const lock = useRef(false);
  const body = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      const cloned = (Array.isArray(initialItems) ? initialItems : []).map((raw) => {
        const item = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
        const copies = Array.isArray(item.copyRequirements) ? (item.copyRequirements as ChecklistRow['copyRequirements']) : null;
        return {
          // Giữ mọi trường khác của dòng (copyRequirements, quantityText, note, formCodes...)
          ...(item as Partial<ChecklistRow>),
          copyRequirements: copies,
          checklistId: String(item.checklistId ?? ''),
          caseCode: item.caseCode ? String(item.caseCode) : null,
          itemName: String(item.itemName ?? ''),
          submissionType: (item.submissionType === 'XUAT_TRINH' ? 'XUAT_TRINH' : 'NOP') as 'NOP' | 'XUAT_TRINH',
          // Không tự đổi loại bản trống thành "bản chính": người dân sẽ bị đòi đúng loại bản khi nộp
          documentCopyType: COPY_TYPES.includes(item.documentCopyType as CopyType) ? (item.documentCopyType as CopyType) : null,
          quantity: typeof item.quantity === 'number' && item.quantity > 0 ? item.quantity : 1,
          conditionNote: item.conditionNote ? String(item.conditionNote) : null,
          isMandatory: item.isMandatory !== false,
        };
      });
      setItems(cloned);
      setBaseline(JSON.stringify(cloned));
      setDecisionNumber(currentDecisionNumber ?? '');
      setEffectiveDate(localToday());
      setError('');
      setFieldErrors({});
      setOpened(new Set());
      setIsConflict(false);
    }
  }, [open, initialItems, currentDecisionNumber]);

  const isDirty = open && (
    JSON.stringify(items) !== baseline ||
    decisionNumber !== (currentDecisionNumber ?? '')
  );
  const guard = useUnsavedChanges(isDirty, busy);

  // WF-CASE-01: hiển thị theo nhóm Giấy tờ chung → từng trường hợp; thứ tự lưu giữ nguyên
  const validCases = cases.filter(c => c.caseCode);
  const grouped = groupByCase(items.map((row, index) => ({ row, index, caseCode: row.caseCode })), validCases);
  const sections = [
    { key: 'common', caseCode: null as string | null, title: 'Giấy tờ chung', hint: 'Áp dụng cho mọi trường hợp.', items: grouped.common },
    ...grouped.cases.map(g => ({ key: g.caseCode, caseCode: g.caseCode as string | null, title: `Trường hợp: ${g.caseName}`, hint: 'Chỉ áp dụng khi công dân chọn trường hợp này.', items: g.items })),
    ...(grouped.orphans.length ? [{ key: 'orphan', caseCode: null as string | null, title: 'Gắn trường hợp không tồn tại', hint: 'Chọn lại “Trường hợp áp dụng” hoặc xóa các giấy tờ này.', items: grouped.orphans }] : []),
  ];

  const clearError = (path: string) => setFieldErrors(prev => {
    if (!(path in prev)) return prev;
    const next = { ...prev };
    delete next[path];
    return next;
  });
  const updateItem = (index: number, patch: Partial<ChecklistRow>) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
    Object.keys(patch).forEach(key => clearError(`checklistSchema.${index}.${key}`));
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
    // Lỗi theo vị trí không còn đúng sau khi xóa: kiểm tra lại khi lưu
    setFieldErrors({});
    setOpened(prev => new Set([...prev].filter(i => i !== index).map(i => (i > index ? i - 1 : i))));
  };

  const addItem = (caseCode: string | null) => {
    setItems((prev) => {
      const used = new Set(prev.map(x => x.checklistId));
      let n = prev.length + 1;
      while (used.has(`GIAY_TO_${n}`)) n += 1;
      setOpened(o => new Set([...o, prev.length]));
      return [
        ...prev,
        {
          checklistId: `GIAY_TO_${n}`,
          caseCode,
          itemName: '',
          submissionType: 'NOP',
          documentCopyType: 'ORIGINAL',
          quantity: 1,
          conditionNote: null,
          isMandatory: true,
        },
      ];
    });
  };

  // Mở và cuộn tới ô lỗi đầu tiên
  const focusFirstError = (paths: string[]) => {
    const first = paths[0];
    if (!first) return;
    const index = /^checklistSchema\.(\d+)\./.exec(first)?.[1];
    if (index != null) setOpened(prev => new Set([...prev, ...paths.map(p => Number(/^checklistSchema\.(\d+)\./.exec(p)?.[1])).filter(n => !Number.isNaN(n))]));
    requestAnimationFrame(() => {
      const el = body.current?.querySelector<HTMLElement>(`[data-field="${first}"]`);
      el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      el?.focus({ preventScroll: true });
    });
  };

  const handleSave = async () => {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError('');
    setFieldErrors({});
    setIsConflict(false);

    try {
      const headErrors: Record<string, string> = {};
      if (!decisionNumber.trim()) headErrors.decisionNumber = 'Vui lòng nhập số quyết định ban hành.';
      else if (decisionNumber.trim().length > 255) headErrors.decisionNumber = 'Số quyết định không được vượt quá 255 ký tự.';
      if (!effectiveDate.trim()) headErrors.effectiveDate = 'Vui lòng chọn ngày có hiệu lực.';
      if (Object.keys(headErrors).length) {
        setFieldErrors(headErrors);
        setError(`Còn ${Object.keys(headErrors).length} thông tin cần sửa. Các ô lỗi đã được đánh dấu đỏ.`);
        focusFirstError(Object.keys(headErrors));
        return;
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
        const map = Object.fromEntries(e.issues.map(issue => [issue.path, issue.message]));
        setFieldErrors(map);
        setError(`Còn ${e.issues.length} thông tin cần sửa. Các ô lỗi đã được đánh dấu đỏ.`);
        focusFirstError(e.issues.map(issue => issue.path));
      } else {
        setError(procedureError(e));
      }
    } finally {
      setBusy(false);
      lock.current = false;
    }
  };

  const mandatoryCount = items.filter(x => x.isMandatory).length;

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
        description="Sửa danh sách giấy tờ công dân cần nộp hoặc xuất trình theo quyết định mới. Khi lưu, hệ thống tạo phiên bản mới; hồ sơ đã tạo trước đó giữ nguyên danh mục cũ."
        className="sm:max-w-4xl"
        footer={
          <div className="flex w-full flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-slate-500">
              <strong className="text-slate-800">{items.length}</strong> giấy tờ · <strong className="text-slate-800">{mandatoryCount}</strong> bắt buộc · tối đa 500
              {isDirty && <span className="ml-2 rounded-full bg-amber-50 px-2 py-0.5 font-semibold text-amber-800 ring-1 ring-amber-200">Chưa lưu</span>}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" disabled={busy} onClick={() => guard.requestClose(() => onOpenChange(false))}>
                Hủy
              </Button>
              <Button loading={busy} onClick={handleSave}>
                Lưu danh mục giấy tờ
              </Button>
            </div>
          </div>
        }
      >
        <div ref={body} className="space-y-5">
          {isConflict ? (
            <div role="alert" className="flex flex-col gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-900">
              <p className="flex items-start gap-2 text-sm font-semibold"><Warning size={18} className="mt-0.5 shrink-0" aria-hidden />{error}</p>
              <div>
                <Button size="small" variant="outline" onClick={() => { onReload(); onOpenChange(false); }}>
                  Tải lại dữ liệu mới nhất
                </Button>
              </div>
            </div>
          ) : error ? (
            <p role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              <Warning size={18} className="mt-0.5 shrink-0" aria-hidden />{error}
            </p>
          ) : null}

          {/* Quyết định áp dụng */}
          <section className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">Quyết định áp dụng danh mục mới</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div data-field="decisionNumber">
                <Input
                  label="Số quyết định ban hành"
                  required
                  placeholder="VD: 123/QĐ-UBND"
                  value={decisionNumber}
                  maxLength={255}
                  error={fieldErrors.decisionNumber}
                  onChange={(e) => { setDecisionNumber(e.target.value); clearError('decisionNumber'); }}
                  disabled={busy}
                />
              </div>
              <div data-field="effectiveDate">
                <Input
                  label="Ngày có hiệu lực"
                  required
                  type="date"
                  value={effectiveDate}
                  error={fieldErrors.effectiveDate}
                  onChange={(e) => { setEffectiveDate(e.target.value); clearError('effectiveDate'); }}
                  disabled={busy}
                />
              </div>
            </div>
          </section>

          <p className="flex items-start gap-2 text-xs leading-relaxed text-slate-600">
            <Info size={16} className="mt-0.5 shrink-0 text-sky-700" aria-hidden />
            <span>Đây là danh sách <strong>giấy tờ</strong> (CCCD, giấy chứng sinh…). Mẫu đơn, tờ khai Word được gắn ở phần <strong>Biểu mẫu</strong> khi chỉnh sửa thủ tục.</span>
          </p>

          {items.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
              Chưa có giấy tờ nào trong danh mục.
            </div>
          )}

          {sections.map(section => (
            <section key={section.key} className="space-y-2.5" aria-labelledby={`checklist-section-${section.key}`}>
              <div className="flex flex-wrap items-end justify-between gap-2 border-b border-slate-200 pb-2">
                <div className="min-w-0">
                  <h3 id={`checklist-section-${section.key}`} className="break-words text-sm font-bold text-slate-900">
                    {section.title} <span className="font-semibold text-slate-500">({section.items.length})</span>
                  </h3>
                  <p className="text-xs text-slate-500">{section.hint}</p>
                </div>
                {section.key !== 'orphan' && (
                  <Button size="small" variant="outline" aria-label={`Thêm giấy tờ vào nhóm ${section.title}`} onClick={() => addItem(section.caseCode)} disabled={busy || items.length >= 500}>
                    <Plus size={14} weight="bold" aria-hidden />Thêm giấy tờ
                  </Button>
                )}
              </div>
              {!section.items.length && <p className="rounded-lg border border-dashed border-slate-300 p-3 text-center text-xs text-slate-500">Chưa có giấy tờ.</p>}
              {section.items.map(({ row, index }) => {
                const prefix = `checklistSchema.${index}.`;
                const err = (key: string) => fieldErrors[prefix + key];
                const hasError = Object.keys(fieldErrors).some(k => k.startsWith(prefix));
                const isOpen = opened.has(index) || hasError;
                return (
                  <details
                    key={index}
                    open={isOpen}
                    onToggle={e => {
                      const nowOpen = e.currentTarget.open;
                      if (nowOpen !== isOpen) setOpened(prev => { const next = new Set(prev); if (nowOpen) next.add(index); else next.delete(index); return next; });
                    }}
                    className={`rounded-xl border bg-white shadow-2xs ${hasError ? 'border-red-300' : 'border-slate-200'}`}
                  >
                    <summary className="flex min-h-12 cursor-pointer list-none items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-800 sm:px-4">
                      <span className="min-w-0 flex-1">
                        <span className="block break-words text-sm font-semibold text-slate-900">{row.itemName.trim() || 'Giấy tờ chưa đặt tên'}</span>
                        <span className="mt-1 flex flex-wrap gap-1 text-[11px]">
                          <Chip tone={row.submissionType === 'XUAT_TRINH' ? 'sky' : 'slate'}>{row.submissionType === 'XUAT_TRINH' ? 'Xuất trình' : 'Nộp'}</Chip>
                          <Chip tone={row.isMandatory ? 'red' : 'slate'}>{row.isMandatory ? 'Bắt buộc' : row.conditionNote ? 'Có điều kiện' : 'Không bắt buộc'}</Chip>
                          <Chip tone="slate">{checklistQuantityLabel(row)}</Chip>
                          <Chip tone="slate">Mã {row.checklistId || '—'}</Chip>
                          {hasError && <Chip tone="error">Có lỗi</Chip>}
                        </span>
                      </span>
                      <CaretDown size={14} className={`shrink-0 text-slate-500 transition ${isOpen ? 'rotate-180' : ''}`} aria-hidden />
                    </summary>
                    <div className="space-y-4 border-t border-slate-100 p-3 sm:p-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Tên giấy tờ" required error={err('itemName')} path={prefix + 'itemName'} className="sm:col-span-2">
                          <input className={controlClass(Boolean(err('itemName')))} placeholder="Tên giấy tờ theo quy định" value={row.itemName} onChange={(e) => updateItem(index, { itemName: e.target.value })} disabled={busy} aria-invalid={Boolean(err('itemName'))} />
                        </Field>
                        <Field label="Mã giấy tờ" required error={err('checklistId')} path={prefix + 'checklistId'} hint="Duy nhất trong thủ tục">
                          <input className={controlClass(Boolean(err('checklistId')))} value={row.checklistId} onChange={(e) => updateItem(index, { checklistId: e.target.value })} disabled={busy} aria-invalid={Boolean(err('checklistId'))} />
                        </Field>
                        <Field label="Trường hợp áp dụng" error={err('caseCode')} path={prefix + 'caseCode'}>
                          <select className={controlClass(Boolean(err('caseCode')))} value={row.caseCode ?? ''} onChange={(e) => updateItem(index, { caseCode: e.target.value || null })} disabled={busy} aria-invalid={Boolean(err('caseCode'))}>
                            <option value="">Tất cả trường hợp (giấy tờ chung)</option>
                            {validCases.map((c) => (
                              <option key={c.caseCode} value={c.caseCode ?? ''}>{c.caseName || c.caseCode} ({c.caseCode})</option>
                            ))}
                            {row.caseCode && !validCases.some(c => c.caseCode === row.caseCode) && <option value={row.caseCode}>{row.caseCode} (không tồn tại)</option>}
                          </select>
                        </Field>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <Field label="Hình thức" path={prefix + 'submissionType'}>
                          <select className={controlClass(false)} value={row.submissionType} onChange={(e) => updateItem(index, { submissionType: e.target.value as 'NOP' | 'XUAT_TRINH' })} disabled={busy}>
                            <option value="NOP">Nộp (bản giấy / tải lên)</option>
                            <option value="XUAT_TRINH">Xuất trình đối chiếu</option>
                          </select>
                        </Field>
                        <Field label="Loại bản" path={prefix + 'documentCopyType'}>
                          <select
                            className={controlClass(false)}
                            value={row.documentCopyType ?? ''}
                            onChange={(e) => updateItem(index, {
                              documentCopyType: (e.target.value || null) as CopyType | null,
                              // Chọn một loại bản cụ thể thay cho nhiều loại bản
                              ...(e.target.value ? { copyRequirements: null } : {}),
                            })}
                            disabled={busy}
                          >
                            {row.documentCopyType == null && (
                              <option value="">
                                {row.copyRequirements?.length ? `Nhiều loại bản: ${row.copyRequirements.map(c => `${c.quantity} ${copyLabel(c.documentCopyType)}`).join(' + ')}` : 'Không quy định'}
                              </option>
                            )}
                            <option value="ORIGINAL">Bản chính</option>
                            <option value="CERTIFIED_COPY">Bản sao chứng thực</option>
                            <option value="REGULAR_COPY">Bản chụp / photocopy</option>
                            <option value="OTHER">Loại khác</option>
                          </select>
                        </Field>
                        <Field label="Số lượng bản" required error={err('quantity')} path={prefix + 'quantity'}>
                          <input type="number" min={1} step={1} className={controlClass(Boolean(err('quantity')))} value={row.quantity} onChange={(e) => updateItem(index, { quantity: Math.max(1, Number(e.target.value)) })} disabled={busy} />
                        </Field>
                        <Field label="Yêu cầu" path={prefix + 'isMandatory'}>
                          <select className={controlClass(false)} value={String(row.isMandatory)} onChange={(e) => updateItem(index, { isMandatory: e.target.value === 'true' })} disabled={busy}>
                            <option value="true">Bắt buộc</option>
                            <option value="false">Không bắt buộc / có điều kiện</option>
                          </select>
                        </Field>
                      </div>
                      <Field label="Điều kiện áp dụng / ghi chú" path={prefix + 'conditionNote'} hint="Giấy tờ có điều kiện: chọn “Không bắt buộc” và ghi điều kiện ở đây.">
                        <textarea
                          rows={2}
                          className={`${controlClass(false)} h-auto min-h-16 resize-y py-2.5`}
                          placeholder="VD: Chỉ áp dụng khi ủy quyền nộp thay"
                          value={row.conditionNote ?? ''}
                          onChange={(e) => updateItem(index, { conditionNote: e.target.value || null })}
                          disabled={busy}
                        />
                      </Field>
                      <div className="flex justify-end border-t border-slate-100 pt-3">
                        <Button size="small" variant="dangerGhost" onClick={() => removeItem(index)} disabled={busy}>
                          <Trash size={14} aria-hidden />Xóa giấy tờ này
                        </Button>
                      </div>
                    </div>
                  </details>
                );
              })}
            </section>
          ))}
        </div>
      </Modal>
    </>
  );
}

/** Nhãn + ô + gợi ý/lỗi; dấu * nằm cùng dòng với nhãn. */
function Field({ label, required, error, hint, path, className, children }: { label: string; required?: boolean; error?: string; hint?: string; path: string; className?: string; children: ReactNode }) {
  return (
    <label data-field={path} className={`grid content-start gap-1.5 text-xs font-semibold text-slate-700 ${className ?? ''}`}>
      <span>{label}{required && <span className="ml-0.5 text-red-600" aria-hidden>*</span>}</span>
      {children}
      {error ? <span role="alert" className="text-xs font-medium text-red-700">{error}</span> : hint ? <span className="text-[11px] font-normal text-slate-500">{hint}</span> : null}
    </label>
  );
}

function Chip({ tone, children }: { tone: 'slate' | 'red' | 'sky' | 'error'; children: ReactNode }) {
  const cls = { slate: 'bg-slate-100 text-slate-700', red: 'bg-red-50 text-red-800', sky: 'bg-sky-50 text-sky-800', error: 'bg-red-100 font-semibold text-red-800' }[tone];
  return <span className={`inline-flex rounded px-1.5 py-0.5 font-medium ${cls}`}>{children}</span>;
}
