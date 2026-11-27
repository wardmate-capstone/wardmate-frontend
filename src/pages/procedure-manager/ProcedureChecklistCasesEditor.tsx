import { useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { CaretDown, Plus, Sparkle, Trash, Warning } from '@phosphor-icons/react';
import { Button, Modal, toast } from '@/components/ui';
import { ProcedureDocumentsView, type DocumentForm, type DocumentItem } from '@/components/procedures/ProcedureDocumentsView';
import { ProcedureErrorsContext, ProcedureFieldPrefix } from '@/lib/procedureValidation';
import { caseKey, countItems, formForcedRequired, standaloneForms, groupByCase, nextCaseCode, requiresCaseChoice } from '@/lib/procedureCases';
import { checklistQuantityLabel } from '@/lib/procedureDisplay';
import { attachFormsToItem, caseFormConflicts, moveChecklistItem, removeCase, renameCase, uniqueChecklistId } from '@/lib/procedureCaseEdits';
import { COPY_TYPE_LABELS, FieldInput, getInputBoxClass, record, rows, SUBMISSION_TYPE_LABELS, type Field, type Row } from './ProcedureFieldInput';

const text = (value: unknown) => (value == null ? '' : String(value));
const hasErrorUnder = (errors: Record<string, string>, prefix: string) => Object.keys(errors).some(key => key.startsWith(prefix));

/** Bản đồ dữ liệu trình sửa → dữ liệu hiển thị cho công dân (dùng cho xem trước). */
export function previewData(value: Row) {
  const content = record(value.contentPayload);
  const checklist: DocumentItem[] = rows(value.checklistSchema).map((row, i) => ({
    ...(row as Partial<DocumentItem>),
    checklistId: text(row.checklistId) || `row-${i}`,
    itemName: text(row.itemName).trim() || '(Giấy tờ chưa đặt tên)',
    caseCode: caseKey(text(row.caseCode)),
    isMandatory: row.isMandatory !== false,
    quantity: typeof row.quantity === 'number' ? row.quantity : 1,
  }));
  const forms: DocumentForm[] = rows(value.formDefinitions).map(row => ({
    formCode: text(row.formCode),
    formName: text(row.formName) || text(row.formCode),
    caseCode: caseKey(text(row.caseCode)),
    isMandatory: row.isMandatory !== false,
    quantity: typeof row.quantity === 'number' ? row.quantity : 1,
  }));
  const cases = rows(content.cases).map(c => ({ caseCode: text(c.caseCode), caseName: text(c.caseName) }));
  return { checklist, forms, cases };
}

/** Xem trước như công dân thấy ở trang chi tiết thủ tục, trước khi lưu/công khai. */
export function ChecklistPreviewModal({ open, onOpenChange, value }: { open: boolean; onOpenChange: (open: boolean) => void; value: Row }) {
  const data = previewData(value);
  return (
    <Modal open={open} onOpenChange={onOpenChange} title="Xem trước thành phần hồ sơ" description="Cách công dân thấy giấy tờ chung và từng trường hợp ở trang chi tiết thủ tục. Dữ liệu chưa lưu cũng được hiển thị." className="sm:max-w-4xl">
      <div className="space-y-4">
        {requiresCaseChoice(data.cases) && (
          <p className="rounded-lg border border-sky-200 bg-sky-50 p-3 text-xs text-sky-950">
            Khi tạo hồ sơ, công dân chọn 1 trong {data.cases.length} trường hợp. Hồ sơ chỉ gồm giấy tờ chung và giấy tờ của trường hợp đã chọn.
          </p>
        )}
        <ProcedureDocumentsView
          {...data}
          showOrphans
          renderForms={forms => (forms.length ? <ul className="space-y-1">{forms.map(f => <li key={f.formCode} className="break-words">{f.formName}</li>)}</ul> : <span className="text-slate-400">—</span>)}
        />
      </div>
    </Modal>
  );
}

export function ProcedureChecklistCasesEditor({ value, onChange, extractionNotes = [] }: {
  value: Row;
  onChange: (value: Row) => void;
  /** Cảnh báo AI bóc tách liên quan giấy tờ/trường hợp (tiền tố `checklistSchema:` / `contentPayload.cases:`). */
  extractionNotes?: string[];
}) {
  const errors = useContext(ProcedureErrorsContext);
  const content = record(value.contentPayload);
  const cases = rows(content.cases);
  const checklist = rows(value.checklistSchema);
  const forms = rows(value.formDefinitions);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [deleteMode, setDeleteMode] = useState<'common' | 'delete'>('common');
  const [deleteForms, setDeleteForms] = useState(false);
  const [freshCase, setFreshCase] = useState<number | null>(null);
  const [moved, setMoved] = useState<number | null>(null);
  // Khóa ổn định cho từng giấy tờ/trường hợp: xóa một dòng không làm dòng sau "thừa hưởng" trạng thái mở/đóng
  const itemKeys = useStableKeys(checklist.length);
  const caseKeys = useStableKeys(cases.length);
  const plainItems = checklist.map(row => ({ checklistId: text(row.checklistId), itemName: text(row.itemName), caseCode: caseKey(text(row.caseCode)), isMandatory: row.isMandatory !== false, formCodes: Array.isArray(row.formCodes) ? (row.formCodes as unknown[]).map(text) : null }));
  const plainForms = forms.map(row => ({ formCode: text(row.formCode), formName: text(row.formName), caseCode: caseKey(text(row.caseCode)), isMandatory: row.isMandatory !== false }));
  const forced = formForcedRequired(plainItems, plainForms, cases.map(c => ({ caseCode: text(c.caseCode) })));
  // Biểu mẫu chưa gắn giấy tờ: Workflow sẽ tách thành mục riêng trong hồ sơ; trang công khai không hiện chúng
  const standalone = standaloneForms(plainItems, plainForms, cases.map(c => ({ caseCode: text(c.caseCode), caseName: text(c.caseName) })));

  // Sau khi chuyển giấy tờ sang nhóm khác: mở nhóm đích, cuộn tới và làm nổi giấy tờ vừa chuyển
  useEffect(() => {
    if (moved == null) return;
    const frame = requestAnimationFrame(() => {
      const card = document.getElementById(`checklist-card-${moved}`);
      // Mở cả thẻ giấy tờ (đang được sửa) lẫn trường hợp chứa nó
      for (let d = card?.closest('details'); d; d = d.parentElement?.closest('details')) d.open = true;
      card?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      card?.querySelector<HTMLElement>('summary')?.focus({ preventScroll: true });
    });
    const timer = window.setTimeout(() => setMoved(null), 2500);
    return () => { cancelAnimationFrame(frame); window.clearTimeout(timer); };
  }, [moved]);

  const indexed = checklist.map((row, index) => ({ row, index, caseCode: caseKey(text(row.caseCode)) }));
  const groups = groupByCase(indexed, cases.map(c => ({ caseCode: text(c.caseCode), caseName: text(c.caseName) })));
  const setChecklist = (next: Row[]) => onChange({ ...value, checklistSchema: next });
  const updateItem = (index: number, patch: Row) => {
    if (!('caseCode' in patch)) { setChecklist(checklist.map((row, i) => (i === index ? { ...row, ...patch } : row))); return; }
    const target = caseKey(text(patch.caseCode));
    const { item, droppedForms } = moveChecklistItem(checklist[index], target, forms);
    setChecklist(checklist.map((row, i) => (i === index ? item : row)));
    setMoved(itemKeys.keys[index]);
    const where = target ? `trường hợp “${caseLabels[target] ?? target}”` : 'Giấy tờ chung';
    if (droppedForms.length) toast.warning(`Đã chuyển giấy tờ sang ${where}. Bỏ liên kết biểu mẫu không áp dụng cho nhóm mới: ${droppedForms.join(', ')}.`);
    else toast.success(`Đã chuyển giấy tờ sang ${where}.`);
  };
  const removeItem = (index: number) => { itemKeys.remove([index]); setChecklist(checklist.filter((_, i) => i !== index)); };
  const addItem = (caseCode: string | null) => {
    itemKeys.append();
    setChecklist([
      ...checklist,
      { checklistId: uniqueChecklistId(checklist), caseCode, itemName: '', submissionType: 'NOP', documentCopyType: null, quantity: 1, quantityText: null, formCodes: null, note: null, isMandatory: true, conditionNote: null },
    ]);
  };
  const setCases = (next: Row[]) => onChange({ ...value, contentPayload: { ...content, cases: next } });
  const caseOptions = cases.map(c => text(c.caseCode)).filter(Boolean);
  const caseLabels = Object.fromEntries(cases.map(c => [text(c.caseCode), text(c.caseName) || text(c.caseCode)]));
  const noSpecificDocs = cases.length > 1 && ![...checklist, ...forms].some(row => caseKey(text(row.caseCode)) !== null);

  const renderItems = (items: typeof indexed) => (
    <div className="space-y-2">
      {items.map(({ row, index }) => (
        <DocumentCard
          key={itemKeys.keys[index]}
          cardId={`checklist-card-${itemKeys.keys[index]}`}
          highlight={moved === itemKeys.keys[index]}
          index={index}
          row={row}
          caseOptions={caseOptions}
          caseLabels={caseLabels}
          forms={forms}
          forcedBy={forced.get(text(row.checklistId))}
          hasError={hasErrorUnder(errors, `checklistSchema.${index}.`)}
          onChange={patch => updateItem(index, patch)}
          onRemove={() => removeItem(index)}
        />
      ))}
    </div>
  );

  const deletingCase = deleting == null ? null : cases[deleting];
  const deletingCode = text(deletingCase?.caseCode);
  const deletingDocs = deletingCase ? checklist.filter(row => caseKey(text(row.caseCode)) !== null && text(row.caseCode) === deletingCode).length : 0;
  const deletingForms = deletingCase ? forms.filter(row => caseKey(text(row.caseCode)) !== null && text(row.caseCode) === deletingCode).length : 0;
  const deletingMethods = deletingCase ? rows(content.submissionMethods).filter(row => text(row.caseCode) === deletingCode).length : 0;
  const conflicts = deleting == null ? [] : caseFormConflicts(value, deleting);
  const openDelete = (caseIndex: number) => { setDeleteMode('common'); setDeleteForms(caseFormConflicts(value, caseIndex).length > 0); setDeleting(caseIndex); };

  return (
    <div className="space-y-6">
      {extractionNotes.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          <p className="flex items-center gap-2 font-semibold"><Sparkle size={16} aria-hidden />AI gợi ý cần bạn kiểm tra với văn bản gốc</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-xs leading-relaxed">
            {extractionNotes.map((note, i) => <li key={i}>{note.replace(/^(checklistSchema|contentPayload\.cases):\s*/, '')}</li>)}
          </ul>
          <p className="mt-2 text-[11px] text-amber-800">Kết quả bóc tách chỉ là gợi ý. Bạn cần xác nhận giấy tờ chung, các trường hợp và giấy tờ của từng trường hợp trước khi xuất bản.</p>
        </div>
      )}

      {standalone.length > 0 && (
        <StandaloneFormsFix
          forms={standalone.map(x => ({ code: x.form.formCode, name: x.form.formName || x.form.formCode, where: x.caseNames.length && x.caseNames.length < cases.length ? x.caseNames.join('; ') : '' }))}
          documents={checklist.map((row, index) => ({ index, label: `${caseKey(text(row.caseCode)) ? caseLabels[text(row.caseCode)] ?? text(row.caseCode) : 'Giấy tờ chung'} · ${text(row.itemName).trim() || text(row.checklistId)}` }))}
          onAttach={(index, codes) => {
            onChange(attachFormsToItem(value, index, codes));
            toast.success(`Đã gắn ${codes.length} biểu mẫu vào giấy tờ “${text(checklist[index]?.itemName).trim() || text(checklist[index]?.checklistId)}”.`);
          }}
        />
      )}

      <Section
        title="A. Giấy tờ chung"
        meta={summary(groups.common.map(x => x.row))}
      >
        {groups.common.length ? renderItems(groups.common) : <Empty>Chưa có giấy tờ chung.</Empty>}
        <Button variant="outline" size="small" className="pm-edit-only" onClick={() => addItem(null)}>
          <Plus size={16} weight="bold" aria-hidden="true" />Thêm giấy tờ chung
        </Button>
      </Section>

      <Section
        title="B. Giấy tờ theo trường hợp"
        meta={cases.length ? `${cases.length} trường hợp` : undefined}
      >
        {noSpecificDocs && (
          <p className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
            <Warning size={16} className="mt-0.5 shrink-0" aria-hidden />
            Các trường hợp chưa có giấy tờ riêng: công dân chọn trường hợp nào cũng nộp cùng một danh mục.
          </p>
        )}
        {!cases.length && <Empty>Thủ tục chưa chia trường hợp.</Empty>}
        <div className="space-y-3">
          {cases.map((c, caseIndex) => {
            const code = text(c.caseCode);
            const group = groups.cases.find(g => g.caseCode === code && caseKey(code) !== null);
            const items = group?.items ?? [];
            const counts = countItems(items.map(x => x.row as { isMandatory?: boolean; submissionType?: string }));
            const prefix = `contentPayload.cases.${caseIndex}.`;
            const invalid = hasErrorUnder(errors, `${prefix}caseCode`) || hasErrorUnder(errors, `${prefix}caseName`) || items.some(x => hasErrorUnder(errors, `checklistSchema.${x.index}.`));
            return (
              <Accordion
                key={caseKeys.keys[caseIndex]}
                initiallyOpen={freshCase === caseIndex || cases.length === 1}
                className="rounded-xl border border-slate-200 bg-white"
                summary={
                  <>
                    <span className="grid size-7 shrink-0 place-items-center rounded-full bg-red-50 text-xs font-bold text-red-800">{caseIndex + 1}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block break-words text-sm font-semibold text-slate-900">{text(c.caseName).trim() || 'Trường hợp chưa đặt tên'}</span>
                      <span className="block text-xs text-slate-500">Mã {code || '—'} · {counts.total} giấy tờ riêng{counts.mandatory ? ` · ${counts.mandatory} bắt buộc` : ''}</span>
                    </span>
                    {invalid && <span className="shrink-0 rounded bg-red-100 px-1.5 py-0.5 text-xs font-semibold text-red-800">Có lỗi</span>}
                  </>
                }
              >
                <div className="space-y-4">
                  <ProcedureFieldPrefix.Provider value={prefix}>
                    <div className="grid gap-4 sm:grid-cols-[minmax(0,180px)_minmax(0,1fr)]">
                      <CaseCodeInput
                        path={`${prefix}caseCode`}
                        value={code}
                        taken={cases.filter((_, i) => i !== caseIndex).map(x => text(x.caseCode))}
                        onCommit={next => onChange(renameCase(value, caseIndex, next))}
                      />
                      <FieldInput
                        field={{ key: 'caseName', label: 'Tên trường hợp', required: true, kind: 'text', placeholder: 'VD: Đăng ký lần đầu' }}
                        value={c.caseName}
                        change={next => setCases(cases.map((row, i) => (i === caseIndex ? { ...row, caseName: next } : row)))}
                      />
                    </div>
                  </ProcedureFieldPrefix.Provider>
                  <div className="space-y-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-600">Giấy tờ riêng của trường hợp</p>
                    {items.length ? renderItems(items) : <Empty>Trường hợp này chưa có giấy tờ riêng (chỉ cần giấy tờ chung).</Empty>}
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
                    <Button variant="outline" size="small" className="pm-edit-only" disabled={!caseKey(code)} onClick={() => addItem(code)}>
                      <Plus size={16} weight="bold" aria-hidden="true" />Thêm giấy tờ cho trường hợp này
                    </Button>
                    <Button variant="dangerGhost" size="small" className="pm-edit-only" onClick={() => openDelete(caseIndex)}>
                      <Trash size={16} aria-hidden />Xóa trường hợp
                    </Button>
                  </div>
                </div>
              </Accordion>
            );
          })}
        </div>
        <Button
          variant="outline"
          size="small"
          className="pm-edit-only"
          onClick={() => {
            setFreshCase(cases.length);
            caseKeys.append();
            setCases([...cases, { caseCode: nextCaseCode(cases.map(x => ({ caseCode: text(x.caseCode) }))), caseName: '', steps: [] }]);
          }}
        >
          <Plus size={16} weight="bold" aria-hidden="true" />Thêm trường hợp
        </Button>
      </Section>

      {groups.orphans.length > 0 && (
        <Section title="Giấy tờ gắn trường hợp không tồn tại" hint="Chọn lại “Áp dụng cho” hoặc xóa các giấy tờ này.">
          {renderItems(groups.orphans)}
        </Section>
      )}

      <Modal
        open={deletingCase != null}
        onOpenChange={open => { if (!open) setDeleting(null); }}
        title={`Xóa trường hợp “${text(deletingCase?.caseName).trim() || deletingCode}”?`}
        description="Thay đổi chỉ áp dụng sau khi bạn lưu thủ tục. Hồ sơ đã tạo trước đó giữ nguyên danh mục giấy tờ."
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleting(null)}>Hủy</Button>
            <Button
              variant="danger"
              onClick={() => {
                if (deleting != null) {
                  const code = text(cases[deleting]?.caseCode);
                  if (deleteMode === 'delete') itemKeys.remove(checklist.flatMap((row, i) => (caseKey(text(row.caseCode)) !== null && text(row.caseCode) === code ? [i] : [])));
                  caseKeys.remove([deleting]);
                  onChange(removeCase(value, deleting, deleteMode, deleteForms ? 'delete' : 'common'));
                }
                setDeleting(null);
                setFreshCase(null);
              }}
            >
              Xóa trường hợp
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-sm text-slate-700">
          {deletingDocs > 0 ? (
            <fieldset className="space-y-2">
              <legend className="mb-1 font-semibold text-slate-900">Trường hợp có {deletingDocs} giấy tờ riêng:</legend>
              {([['common', `Chuyển ${deletingDocs} giấy tờ sang Giấy tờ chung`], ['delete', `Xóa luôn ${deletingDocs} giấy tờ này`]] as const).map(([mode, label]) => (
                <label key={mode} className="flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3">
                  <input type="radio" name="delete-case-mode" className="accent-red-700" checked={deleteMode === mode} onChange={() => setDeleteMode(mode)} />
                  {label}
                </label>
              ))}
            </fieldset>
          ) : <p>Trường hợp này không có giấy tờ riêng.</p>}
          {deletingForms > 0 && (
            <fieldset className="space-y-2">
              <legend className="mb-1 font-semibold text-slate-900">Trường hợp có {deletingForms} biểu mẫu riêng:</legend>
              {([[false, `Chuyển ${deletingForms} biểu mẫu thành áp dụng chung`], [true, `Xóa luôn ${deletingForms} biểu mẫu này`]] as const).map(([remove, label]) => (
                <label key={String(remove)} className="flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3">
                  <input type="radio" name="delete-case-forms" className="accent-red-700" checked={deleteForms === remove} onChange={() => setDeleteForms(remove)} />
                  {label}
                </label>
              ))}
              {conflicts.length > 0 && !deleteForms && (
                <p role="alert" className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-900">
                  <Warning size={15} className="mt-0.5 shrink-0" aria-hidden />
                  Mã biểu mẫu {conflicts.join(', ')} đã có ở biểu mẫu chung; chuyển về áp dụng chung sẽ bị trùng mã và không lưu được. Nên chọn xóa.
                </p>
              )}
            </fieldset>
          )}
          {deletingMethods > 0 && <p className="text-xs text-slate-600">{deletingMethods} cách nộp đang gắn trường hợp này sẽ chuyển thành áp dụng chung. Kiểm tra lại ở phần Thời hạn &amp; lệ phí.</p>}
          {rows(deletingCase?.steps).length > 0 && <p className="text-xs text-slate-600">{rows(deletingCase?.steps).length} bước thực hiện riêng của trường hợp cũng bị xóa.</p>}
        </div>
      </Modal>
    </div>
  );
}

function summary(items: Row[]) {
  if (!items.length) return undefined;
  const c = countItems(items as { isMandatory?: boolean; submissionType?: string }[]);
  return [`${c.total} giấy tờ`, c.mandatory ? `${c.mandatory} bắt buộc` : '', c.present ? `${c.present} xuất trình` : ''].filter(Boolean).join(' · ');
}

function Section({ title, hint, meta, children }: { title: string; hint?: string; meta?: string; children: ReactNode }) {
  return (
    <section className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/50 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-slate-900">{title}</h3>
          {hint && <p className="mt-0.5 text-xs text-slate-600">{hint}</p>}
        </div>
        {meta && <span className="shrink-0 rounded-full bg-white px-2.5 py-0.5 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">{meta}</span>}
      </div>
      {children}
    </section>
  );
}

const Empty = ({ children }: { children: ReactNode }) => (
  <p className="rounded-lg border border-dashed border-slate-300 bg-white p-3 text-center text-xs text-slate-500">{children}</p>
);

/** details/summary có trạng thái riêng: không tự đóng khi dữ liệu đổi; goToIssue mở được bằng cách đặt `open`. */
function Accordion({ id, summary: head, initiallyOpen, className, children }: { id?: string; summary: ReactNode; initiallyOpen: boolean; className?: string; children: ReactNode }) {
  const [open, setOpen] = useState(initiallyOpen);
  return (
    <details id={id} open={open} onToggle={e => setOpen(e.currentTarget.open)} className={className}>
      <summary className="flex min-h-12 cursor-pointer list-none items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-800 sm:px-4">
        {head}
        <CaretDown size={14} className={`shrink-0 text-slate-500 transition ${open ? "rotate-180" : ""}`} aria-hidden />
      </summary>
      <div className="border-t border-slate-100 p-3 sm:p-4">{children}</div>
    </details>
  );
}

/** Mã trường hợp chỉ đổi khi rời ô: tránh lúc đang gõ trùng mã trường hợp khác làm gộp nhầm giấy tờ. */
function CaseCodeInput({ path, value, taken, onCommit }: { path: string; value: string; taken: string[]; onCommit: (next: string) => void }) {
  const errors = useContext(ProcedureErrorsContext);
  const [draft, setDraft] = useState<string | null>(null);
  const [localError, setLocalError] = useState('');
  const error = localError || errors[path];
  const commit = () => {
    if (draft == null) return;
    const next = draft.trim();
    setDraft(null);
    if (next === value) { setLocalError(''); return; }
    if (!next) { setLocalError('Mã trường hợp không được để trống.'); return; }
    if (next.length > 100) { setLocalError('Mã trường hợp tối đa 100 ký tự.'); return; }
    if (taken.includes(next)) { setLocalError(`Mã “${next}” đã dùng cho trường hợp khác.`); return; }
    setLocalError('');
    onCommit(next);
  };
  return (
    <label data-field={path} className="grid gap-2 text-sm font-semibold">
      <span className="flex items-center gap-1 text-slate-900">Mã trường hợp<span className="font-bold text-red-600" title="Thông tin bắt buộc">*</span></span>
      <input
        aria-label="Mã trường hợp"
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${path}-error` : undefined}
        className={getInputBoxClass(Boolean(error))}
        value={draft ?? value}
        maxLength={100}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); commit(); } }}
      />
      {error && <span id={`${path}-error`} className="text-xs font-medium text-red-700">• {error}</span>}
    </label>
  );
}

const DOCUMENT_FIELDS = (formOptions: string[], formLabels: Record<string, string>): Field[] => [
  { key: 'checklistId', label: 'Mã giấy tờ', required: true, kind: 'text' },
  { key: 'itemName', label: 'Tên giấy tờ', required: true, rows: 3 },
  { key: 'submissionType', label: 'Hình thức', options: ['NOP', 'XUAT_TRINH'], optionLabels: SUBMISSION_TYPE_LABELS },
  { key: 'documentCopyType', label: 'Loại bản', options: ['ORIGINAL', 'CERTIFIED_COPY', 'REGULAR_COPY', 'OTHER'], optionLabels: COPY_TYPE_LABELS },
  { key: 'quantity', label: 'Số lượng', kind: 'number' },
  { key: 'quantityText', label: 'Số lượng ghi bằng chữ (nếu có)', kind: 'text', placeholder: 'VD: 01 bản chính và 01 bản sao' },
  { key: 'isMandatory', label: 'Bắt buộc khi áp dụng', kind: 'boolean' },
  { key: 'conditionNote', label: 'Điều kiện áp dụng / ghi chú', placeholder: 'Giấy tờ có điều kiện: chọn "Không" ở ô Bắt buộc và ghi điều kiện, VD: Trường hợp ủy quyền nộp thay' },
  {
    key: 'formCodes', label: 'Mẫu đơn, tờ khai kèm theo', kind: 'multi', options: formOptions, optionLabels: formLabels,
    hint: formOptions.length ? undefined : 'Chưa có biểu mẫu áp dụng. Thêm ở phần Biểu mẫu rồi quay lại chọn.',
  },
  { key: 'note', label: 'Ghi chú' },
];

function DocumentCard({ cardId, highlight, forcedBy, index, row, caseOptions, caseLabels, forms, hasError, onChange, onRemove }: {
  cardId: string;
  highlight: boolean;
  /** Tên biểu mẫu bắt buộc trùng mã giấy tờ khiến giấy tờ không bắt buộc thành bắt buộc khi tạo hồ sơ. */
  forcedBy?: string;
  index: number;
  row: Row;
  caseOptions: string[];
  caseLabels: Record<string, string>;
  forms: Row[];
  hasError: boolean;
  onChange: (patch: Row) => void;
  onRemove: () => void;
}) {
  const own = caseKey(text(row.caseCode));
  // Catalog chỉ cho gắn biểu mẫu chung hoặc cùng trường hợp với giấy tờ
  const applicableForms = forms.filter(form => { const fc = caseKey(text(form.caseCode)); return fc === null || fc === own; });
  const formOptions = applicableForms.map(form => text(form.formCode)).filter(Boolean);
  const formLabels = Object.fromEntries(applicableForms.map(form => [text(form.formCode), text(form.formName) || text(form.formCode)]));
  const name = text(row.itemName).trim();
  const mandatory = row.isMandatory !== false;
  const path = `checklistSchema.${index}.`;
  return (
    <ProcedureFieldPrefix.Provider value={path}>
      <Accordion
        id={cardId}
        initiallyOpen={!name}
        className={`rounded-xl border bg-white shadow-2xs transition-shadow ${highlight ? 'border-red-300 ring-4 ring-red-100' : 'border-slate-200'}`}
        summary={
          <span className="min-w-0 flex-1">
            <span className="block break-words text-sm font-semibold text-slate-900">{name || 'Giấy tờ chưa đặt tên'}</span>
            <span className="mt-1 flex flex-wrap gap-1 text-[11px]">
              <Chip tone={row.submissionType === 'XUAT_TRINH' ? 'sky' : 'slate'}>{row.submissionType === 'XUAT_TRINH' ? 'Xuất trình' : 'Nộp'}</Chip>
              <Chip tone={mandatory ? 'red' : 'slate'}>{mandatory ? 'Bắt buộc' : text(row.conditionNote).trim() ? 'Có điều kiện' : 'Không bắt buộc'}</Chip>
              <Chip tone="slate">{checklistQuantityLabel({ quantity: typeof row.quantity === 'number' ? row.quantity : 1, documentCopyType: text(row.documentCopyType) || null, copyRequirements: Array.isArray(row.copyRequirements) ? row.copyRequirements as { documentCopyType: string; quantity: number }[] : null, quantityText: text(row.quantityText) || null })}</Chip>
              {Array.isArray(row.formCodes) && row.formCodes.length > 1 && <Chip tone="slate">{row.formCodes.length} mẫu thay thế</Chip>}
              {forcedBy && <Chip tone="red">Sẽ thành bắt buộc</Chip>}
              {hasError && <Chip tone="error">Có lỗi</Chip>}
            </span>
          </span>
        }
      >
        <div className="space-y-4">
          {forcedBy && (
            <p role="status" className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-900">
              <Warning size={15} className="mt-0.5 shrink-0" aria-hidden />
              Giấy tờ đang để không bắt buộc nhưng khi tạo hồ sơ sẽ thành bắt buộc vì biểu mẫu bắt buộc “{forcedBy}” trùng mã giấy tờ. Hãy chọn biểu mẫu này ở ô “Mẫu đơn, tờ khai kèm theo” hoặc đặt biểu mẫu không bắt buộc.
            </p>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <label data-field={`${path}caseCode`} className="grid gap-2 text-sm font-semibold sm:col-span-2">
              <span className="text-slate-900">Áp dụng cho</span>
              <select
                aria-label="Áp dụng cho"
                className={getInputBoxClass(false)}
                value={own ?? ''}
                onChange={e => onChange({ caseCode: e.target.value || null })}
              >
                <option value="">Tất cả trường hợp (giấy tờ chung)</option>
                {caseOptions.map(code => <option key={code} value={code}>{caseLabels[code] ?? code} ({code})</option>)}
                {own && !caseOptions.includes(own) && <option value={own}>{own} (không tồn tại)</option>}
              </select>
            </label>
            {DOCUMENT_FIELDS(formOptions, formLabels).map(field => (
              <div key={field.key} className={field.rows || field.kind === 'multi' ? 'sm:col-span-2' : undefined}>
                <FieldInput field={field} value={row[field.key]} change={next => onChange({ [field.key]: next })} />
              </div>
            ))}
          </div>
          <Button size="small" variant="dangerGhost" className="pm-edit-only" onClick={onRemove}>
            <Trash size={14} aria-hidden />Xóa giấy tờ này
          </Button>
        </div>
      </Accordion>
    </ProcedureFieldPrefix.Provider>
  );
}

function Chip({ tone, children }: { tone: 'slate' | 'red' | 'sky' | 'error'; children: ReactNode }) {
  const cls = { slate: 'bg-slate-100 text-slate-700', red: 'bg-red-50 text-red-800', sky: 'bg-sky-50 text-sky-800', error: 'bg-red-100 font-semibold text-red-800' }[tone];
  return <span className={`inline-flex rounded px-1.5 py-0.5 font-medium ${cls}`}>{children}</span>;
}



/**
 * Khóa React ổn định cho danh sách không có id riêng. Thao tác thêm/xóa trong trình sửa cập nhật khóa tương ứng;
 * độ dài đổi từ bên ngoài (mở thủ tục khác, khôi phục phiên bản) thì cấp lại toàn bộ khóa.
 */
function useStableKeys(count: number) {
  const seq = useRef(0);
  const keys = useRef<number[]>([]);
  if (keys.current.length !== count) keys.current = Array.from({ length: count }, () => seq.current++);
  return {
    keys: keys.current,
    append: () => { keys.current = [...keys.current, seq.current++]; },
    remove: (indexes: number[]) => { keys.current = keys.current.filter((_, i) => !indexes.includes(i)); },
  };
}

/**
 * Sửa nhanh biểu mẫu chưa gắn giấy tờ: chọn các biểu mẫu (VD: 5 mẫu thay thế của "Tờ khai của đối tượng") và giấy tờ đích.
 * Biểu mẫu chuyển sang trường hợp của giấy tờ đích để trường hợp khác không bị đòi các mẫu này.
 */
function StandaloneFormsFix({ forms, documents, onAttach }: {
  forms: { code: string; name: string; where: string }[];
  documents: { index: number; label: string }[];
  onAttach: (index: number, codes: string[]) => void;
}) {
  const [picked, setPicked] = useState<string[] | null>(null);
  const [target, setTarget] = useState('');
  const selected = (picked ?? forms.map(f => f.code)).filter(code => forms.some(f => f.code === code));
  return (
    <section aria-labelledby="standalone-forms-title" className="space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
      <div>
        <h3 id="standalone-forms-title" className="flex items-center gap-2 font-semibold"><Warning size={16} aria-hidden />{forms.length} biểu mẫu chưa gắn với giấy tờ nào</h3>
        <p className="mt-1 text-xs leading-relaxed">Công dân không thấy các biểu mẫu này ở trang thủ tục, nhưng khi tạo hồ sơ hệ thống sẽ tách mỗi biểu mẫu thành một mục riêng. Nếu đây là các mẫu thay thế của một tờ khai, hãy gắn chúng vào giấy tờ đó.</p>
      </div>
      <fieldset className="space-y-1.5">
        <legend className="sr-only">Biểu mẫu cần gắn</legend>
        {forms.map(form => (
          <label key={form.code} className="flex min-h-9 cursor-pointer items-start gap-2 text-xs">
            <input
              type="checkbox"
              className="mt-0.5 accent-red-700"
              checked={selected.includes(form.code)}
              onChange={e => setPicked(e.target.checked ? [...selected, form.code] : selected.filter(c => c !== form.code))}
            />
            <span className="min-w-0 break-words">{form.name} <span className="text-amber-800">({form.code}{form.where ? ` · tách riêng ở: ${form.where}` : ''})</span></span>
          </label>
        ))}
      </fieldset>
      {documents.length ? (
        <div className="flex flex-wrap items-end gap-2">
          <label className="grid min-w-0 flex-1 basis-64 gap-1 text-xs font-semibold">
            Gắn vào giấy tờ
            <select aria-label="Gắn vào giấy tờ" className={getInputBoxClass(false)} value={target} onChange={e => setTarget(e.target.value)}>
              <option value="">Chọn giấy tờ</option>
              {documents.map(d => <option key={d.index} value={d.index}>{d.label}</option>)}
            </select>
          </label>
          <Button size="small" className="pm-edit-only" disabled={!target || !selected.length} onClick={() => { onAttach(Number(target), selected); setPicked(null); setTarget(''); }}>
            Gắn {selected.length} biểu mẫu
          </Button>
        </div>
      ) : <p className="text-xs">Chưa có giấy tờ nào. Hãy thêm giấy tờ (VD: "Tờ khai của đối tượng") rồi gắn biểu mẫu.</p>}
    </section>
  );
}
