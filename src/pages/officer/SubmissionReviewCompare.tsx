import { useMemo, useState, type ReactNode } from 'react';
import { CaretDown, CaretRight, ChatCircleDots, CheckCircle, Question, Warning } from '@phosphor-icons/react';
import { Badge, Button, ErrorAlert, Modal, Skeleton } from '@/components/ui';
import { DocumentFilePreview } from '@/components/documents/DocumentFilePreview';
import { useFileVersionDiff, useFileVersions } from '@/hooks/useDocumentForms';
import { documentFormApi, documentFormError, type FileVersionDto } from '@/lib/api/documentForms';
import { diffFieldLabel, diffValueText, humanizeFieldName } from '@/lib/api/workflowAdapters';
import { displayDocumentFileName } from '@/lib/documentFileName';
import { formatDateTime } from '@/lib/dateFormat';
import type { CommentDto } from '@/lib/api/workflow';

// ---------------------------------------------------------------------------
// Ghép tệp giữa hai lần gửi (DOC-FILEVER-01)
// ---------------------------------------------------------------------------

type ChangeKind = 'added' | 'removed' | 'replaced' | 'unchanged' | 'unknown';
export type FileChange = { key: string; kind: ChangeKind; before?: FileVersionDto; after?: FileVersionDto };

/**
 * Cùng sourceId → so sha256; tệp còn lại cùng mục + cùng loại → coi là bị thay; phần dư → mới / đã xóa.
 * sha256 rỗng (tệp không còn trong kho lúc ghi) → không xác định.
 */
export function pairFileVersions(before: FileVersionDto[], after: FileVersionDto[]): FileChange[] {
  const result: FileChange[] = [];
  const restBefore = [...before];
  const restAfter: FileVersionDto[] = [];
  for (const b of after) {
    const i = restBefore.findIndex(a => a.sourceId === b.sourceId);
    if (i >= 0) result.push(compareFile(restBefore.splice(i, 1)[0], b));
    else restAfter.push(b);
  }
  for (const b of [...restAfter]) {
    const i = restBefore.findIndex(a => a.checklistId === b.checklistId && a.sourceType === b.sourceType);
    if (i < 0) continue;
    result.push(compareFile(restBefore.splice(i, 1)[0], b));
    restAfter.splice(restAfter.indexOf(b), 1);
  }
  restAfter.forEach(b => result.push({ key: b.id, kind: 'added', after: b }));
  restBefore.forEach(a => result.push({ key: a.id, kind: 'removed', before: a }));
  return result;
}

function compareFile(before: FileVersionDto, after: FileVersionDto): FileChange {
  const kind: ChangeKind = !before.sha256 || !after.sha256 ? 'unknown' : before.sha256 === after.sha256 ? 'unchanged' : 'replaced';
  return { key: `${before.id}-${after.id}`, kind, before, after };
}

const fileKindView: Record<ChangeKind, { label: string; variant: 'info' | 'warning' | 'danger' | 'neutral' }> = {
  added: { label: 'Tệp mới', variant: 'info' },
  replaced: { label: 'Đã thay tệp', variant: 'warning' },
  removed: { label: 'Đã xóa tệp', variant: 'danger' },
  unchanged: { label: 'Không đổi', variant: 'neutral' },
  unknown: { label: 'Không xác định', variant: 'neutral' },
};

// ---------------------------------------------------------------------------
// Kết luận theo mục
// ---------------------------------------------------------------------------

/** missing: có nhận xét nhưng không thấy thay đổi; unknown: có nhận xét nhưng thiếu dữ liệu tệp để kết luận. */
type Verdict = 'missing' | 'unknown' | 'changed' | 'other' | 'none';
const verdictOrder: Verdict[] = ['missing', 'unknown', 'changed', 'other', 'none'];

export type FieldChange = { fieldKey?: string | null; fieldLabel?: string | null; oldValue?: unknown; newValue?: unknown; oldExists: boolean; newExists: boolean };

type Card = {
  id: string;
  /** Mục nhận xét lại (checklist id hoặc khóa trường tờ khai); rỗng với nhóm "Khác" */
  targetId?: string;
  label: string;
  kind: 'checklist' | 'form' | 'other';
  comments: CommentDto[];
  files: FileChange[];
  fields: FieldChange[];
  verdict: Verdict;
};

export function SubmissionReviewCompare({
  applicationId,
  fromVersion,
  toVersion,
  versionNumbers,
  onChangeVersions,
  checklists,
  previousComments,
  fieldChanges,
  fieldChangesPending,
  fieldChangesError,
  renderTargetComments,
  canComment,
}: {
  applicationId: string;
  fromVersion: number;
  toVersion: number;
  versionNumbers: number[];
  onChangeVersions: (from: number, to: number) => void;
  checklists: { id: string; title: string }[];
  /** Nhận xét đã ghi ở lần gửi trước (fromVersion) */
  previousComments: { data?: CommentDto[]; isPending: boolean; isError: boolean; isFetching: boolean; error: unknown; refetch: () => unknown };
  /** Thay đổi thông tin kê khai và danh mục (snapshot Workflow) */
  fieldChanges?: FieldChange[];
  fieldChangesPending: boolean;
  fieldChangesError?: string;
  /** Ô nhận xét tại chỗ (dùng lại TargetComments) cho lần gửi hiện tại */
  renderTargetComments: (targetId: string, label: string, composerOpen: boolean, close: () => void) => ReactNode;
  canComment: boolean;
}) {
  const before = useFileVersions(applicationId, fromVersion);
  const after = useFileVersions(applicationId, toVersion);
  const [picking, setPicking] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [comparing, setComparing] = useState<FileChange>();
  const [composing, setComposing] = useState<string>();
  // Thẻ mở/đóng do người dùng chọn; chưa chọn thì theo mặc định (xem isOpen)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const filesReady = before.isSuccess && after.isSuccess;
  const hasFileData = filesReady && before.data.length > 0 && after.data.length > 0;

  const cards = useMemo<Card[]>(() => {
    const comments = (previousComments.data ?? []).filter(x => x.status !== 'WITHDRAWN');
    const files = hasFileData ? pairFileVersions(before.data!, after.data!).filter(x => x.kind !== 'unchanged') : [];
    const changes = fieldChanges ?? [];
    const ids = new Set(checklists.map(x => x.id));
    const checklistOf = (key?: string | null) => key?.startsWith('/checklists/') ? key.split('/')[2] : undefined;

    const verdict = (hasComments: boolean, hasChange: boolean, needsFiles: boolean): Verdict =>
      hasComments ? (hasChange ? 'changed' : needsFiles && !hasFileData ? 'unknown' : 'missing') : hasChange ? 'other' : 'none';

    const result: Card[] = checklists.map((item, index) => {
      const c = comments.filter(x => x.targetType === 'CHECKLIST_ITEM' && x.targetId === item.id);
      const f = files.filter(x => (x.after ?? x.before)?.checklistId === item.id);
      const s = changes.filter(x => checklistOf(x.fieldKey) === item.id);
      return { id: item.id, targetId: item.id, label: `${index + 1}. ${item.title}`, kind: 'checklist', comments: c, files: f, fields: s,
        verdict: verdict(c.length > 0, f.length + s.length > 0, true) };
    });

    // Thông tin người gửi: mỗi nhận xét xét riêng theo đúng trường của nó
    const formComments = comments.filter(x => x.targetType === 'FORM_FIELD');
    const formChanges = changes.filter(x => x.fieldKey?.startsWith('/formData'));
    if (formComments.length || formChanges.length) {
      const unresolved = formComments.some(x => !formChanges.some(f => f.fieldKey === x.targetId));
      result.push({ id: 'form', label: 'Thông tin người gửi', kind: 'form', comments: formComments, files: [], fields: formChanges,
        verdict: formComments.length ? (unresolved ? 'missing' : 'changed') : 'other' });
    }

    const otherFiles = files.filter(x => !ids.has((x.after ?? x.before)?.checklistId ?? ''));
    const otherFields = changes.filter(x => !x.fieldKey?.startsWith('/formData') && !ids.has(checklistOf(x.fieldKey) ?? ''));
    if (otherFiles.length || otherFields.length) {
      result.push({ id: 'other', label: 'Tệp và thông tin khác', kind: 'other', comments: [], files: otherFiles, fields: otherFields, verdict: 'other' });
    }
    return result.sort((a, b) => verdictOrder.indexOf(a.verdict) - verdictOrder.indexOf(b.verdict));
  }, [previousComments.data, before.data, after.data, hasFileData, fieldChanges, checklists]);

  const loading = previousComments.isPending || fieldChangesPending || before.isPending || after.isPending;
  const commented = cards.filter(x => x.comments.length);
  const fixed = commented.filter(x => x.verdict === 'changed').length;
  const missing = commented.filter(x => x.verdict === 'missing').length;
  const fileCount = cards.reduce((n, x) => n + x.files.length, 0);
  const formChanged = cards.some(x => x.kind === 'form' && x.fields.length);
  const shown = cards.filter(x => ['missing', 'unknown', 'changed'].includes(x.verdict));
  const otherCards = cards.filter(x => x.verdict === 'other');
  const noneCards = cards.filter(x => x.verdict === 'none');
  // Nhiều mục / nhiều thay đổi: chỉ mở sẵn thẻ cần chú ý để trang không dài
  const isOpen = (card: Card) => expanded[card.id] ?? (shown.length <= 3 || card.verdict === 'missing' || card.verdict === 'unknown');
  const toggleCard = (card: Card) => setExpanded(x => ({ ...x, [card.id]: !isOpen(card) }));
  const allOpen = shown.every(isOpen);
  const setAll = (open: boolean) => setExpanded(Object.fromEntries([...shown, ...otherCards].map(x => [x.id, open])));

  return (
    <div className="space-y-4">
      {/* Đầu trang: lần gửi đang so; chỉ cho đổi khi có từ 3 lần gửi */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900">
          Kiểm tra lần gửi lại
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">Lần {fromVersion} → {toVersion}</span>
        </h3>
        <div className="flex items-center gap-1">
          {shown.length > 1 && (
            <Button size="small" variant="ghost" className="text-xs" onClick={() => setAll(!allOpen)}>
              {allOpen ? 'Thu gọn tất cả' : 'Mở tất cả'}
            </Button>
          )}
          {versionNumbers.length > 2 && (
            <Button size="small" variant="ghost" className="gap-1 text-xs" aria-expanded={picking} onClick={() => setPicking(x => !x)}>
              Đổi lần so sánh <CaretDown size={14} aria-hidden="true" />
            </Button>
          )}
        </div>
      </div>
      {picking && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl bg-slate-50 p-3">
          {(['from', 'to'] as const).map(side => (
            <label key={side} className="grid gap-1 text-xs font-semibold text-slate-600">
              {side === 'from' ? 'Lần gửi trước' : 'Lần gửi sau'}
              <select
                className="min-h-10 rounded-lg border border-slate-300 bg-white px-2.5 text-sm"
                value={side === 'from' ? fromVersion : toVersion}
                onChange={e => side === 'from' ? onChangeVersions(Number(e.target.value), toVersion) : onChangeVersions(fromVersion, Number(e.target.value))}
              >
                {versionNumbers.map(n => <option key={n} value={n}>Lần gửi {n}</option>)}
              </select>
            </label>
          ))}
        </div>
      )}

      {fromVersion >= toVersion ? (
        <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">Chọn lần gửi sau lớn hơn lần gửi trước để so sánh.</p>
      ) : loading ? (
        <div role="status" aria-label="Đang so sánh" className="space-y-3">
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      ) : (
        <>
          {previousComments.isError && (
            <ErrorAlert retryLabel="Thử lại" retrying={previousComments.isFetching} onRetry={() => void previousComments.refetch()}>
              Chưa tải được nhận xét lần gửi {fromVersion}.
            </ErrorAlert>
          )}
          {fieldChangesError && <ErrorAlert>{fieldChangesError}</ErrorAlert>}
          {(before.isError || after.isError) && (
            <ErrorAlert retryLabel="Thử lại" retrying={before.isFetching || after.isFetching} onRetry={() => { void before.refetch(); void after.refetch(); }}>
              {documentFormError(before.error || after.error)}
            </ErrorAlert>
          )}

          {/* Tóm tắt */}
          <div role="status" className={`flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border px-4 py-3 text-sm ${missing ? 'border-amber-300 bg-amber-50 text-amber-900' : 'border-emerald-200 bg-emerald-50/60 text-emerald-900'}`}>
            {missing ? <Warning size={18} weight="fill" aria-hidden="true" className="text-amber-600" /> : <CheckCircle size={18} weight="fill" aria-hidden="true" className="text-emerald-600" />}
            <span className="font-semibold">
              {commented.length ? `${fixed}/${commented.length} mục có nhận xét đã có chỉnh sửa` : `Lần gửi ${fromVersion} không có nhận xét`}
            </span>
            <span className="text-slate-600" title={filesReady && !hasFileData ? 'Hệ thống chỉ lưu tệp cho các lần gửi từ 18/11/2026.' : undefined}>
              · {hasFileData ? `${fileCount} tệp thay đổi` : 'Chưa có dữ liệu tệp'}
            </span>
            <span className="text-slate-600">· Thông tin kê khai {formChanged ? 'có thay đổi' : 'không đổi'}</span>
          </div>

          {shown.map(card => (
            <ReviewCard
              key={card.id}
              card={card}
              applicationId={applicationId}
              fromVersion={fromVersion}
              toVersion={toVersion}
              canComment={canComment}
              open={isOpen(card)}
              onToggle={() => toggleCard(card)}
              composing={composing === card.targetId}
              onCompose={() => setComposing(card.targetId)}
              onCloseComposer={() => setComposing(undefined)}
              onCompare={setComparing}
              renderTargetComments={renderTargetComments}
            />
          ))}

          {otherCards.length > 0 && (
            <Collapsible
              open={Boolean(openGroups.other)}
              onToggle={() => setOpenGroups(x => ({ ...x, other: !x.other }))}
              label={`Thay đổi khác, không có nhận xét: ${otherCards.length}`}
            >
              {otherCards.map(card => (
                <ReviewCard
                  key={card.id}
                  card={card}
                  applicationId={applicationId}
                  fromVersion={fromVersion}
                  toVersion={toVersion}
                  canComment={canComment}
                  open={isOpen(card)}
                  onToggle={() => toggleCard(card)}
                  composing={composing === card.targetId}
                  onCompose={() => setComposing(card.targetId)}
                  onCloseComposer={() => setComposing(undefined)}
                  onCompare={setComparing}
                  renderTargetComments={renderTargetComments}
                />
              ))}
            </Collapsible>
          )}

          {noneCards.length > 0 && (
            <Collapsible
              open={Boolean(openGroups.none)}
              onToggle={() => setOpenGroups(x => ({ ...x, none: !x.none }))}
              label={`Mục không thay đổi: ${noneCards.length}`}
            >
              <ul className="space-y-1 text-sm text-slate-600">
                {noneCards.map(card => <li key={card.id} className="wrap-break-word">{card.label}</li>)}
              </ul>
            </Collapsible>
          )}
        </>
      )}

      {comparing && (
        <CompareFilesModal applicationId={applicationId} change={comparing} fromVersion={fromVersion} toVersion={toVersion} onClose={() => setComparing(undefined)} />
      )}
    </div>
  );
}

function Collapsible({ open, onToggle, label, children }: { open: boolean; onToggle: () => void; label: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200">
      <button type="button" aria-expanded={open} onClick={onToggle} className="flex min-h-11 w-full items-center gap-2 px-4 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50">
        {open ? <CaretDown size={16} aria-hidden="true" /> : <CaretRight size={16} aria-hidden="true" />}
        {label}
      </button>
      {open && <div className="space-y-3 border-t border-slate-200 p-3">{children}</div>}
    </div>
  );
}

const verdictView: Record<Verdict, { label: string; className: string; icon: ReactNode }> = {
  missing: { label: 'Chưa thấy sửa', className: 'border-amber-300', icon: <Warning size={14} weight="fill" aria-hidden="true" /> },
  unknown: { label: 'Chưa xác định', className: 'border-slate-300', icon: <Question size={14} aria-hidden="true" /> },
  changed: { label: 'Có chỉnh sửa', className: 'border-emerald-300', icon: <CheckCircle size={14} weight="fill" aria-hidden="true" /> },
  other: { label: 'Có thay đổi', className: 'border-slate-200', icon: null },
  none: { label: 'Không đổi', className: 'border-slate-200', icon: null },
};
const verdictBadge: Record<Verdict, 'warning' | 'neutral' | 'success' | 'info'> = { missing: 'warning', unknown: 'neutral', changed: 'success', other: 'info', none: 'neutral' };

function ReviewCard({
  card, applicationId, fromVersion, toVersion, open, onToggle, canComment, composing, onCompose, onCloseComposer, onCompare, renderTargetComments,
}: {
  card: Card; applicationId: string; fromVersion: number; toVersion: number; open: boolean; onToggle: () => void; canComment: boolean; composing: boolean;
  onCompose: () => void; onCloseComposer: () => void; onCompare: (change: FileChange) => void;
  renderTargetComments: (targetId: string, label: string, composerOpen: boolean, close: () => void) => ReactNode;
}) {
  const view = verdictView[card.verdict];
  const changedKeys = new Set(card.fields.map(x => x.fieldKey));
  // Tờ khai: BE so theo mục nên chỉ gọi một lần cho mỗi mục (dù mục có nhiều tệp)
  const hasDocxDiff = card.kind === 'checklist' && card.files.some(x => x.kind === 'replaced' && (x.after ?? x.before)?.sourceType === 'SUBMISSION');
  const summary = [
    card.comments.length && `${card.comments.length} nhận xét`,
    card.files.length && `${card.files.length} tệp`,
    card.fields.length && `${card.fields.length} thông tin`,
  ].filter(Boolean).join(' · ');
  return (
    <section className={`overflow-hidden rounded-2xl border bg-white ${view.className}`} aria-label={card.label}>
      <button
        type="button"
        aria-expanded={open}
        onClick={onToggle}
        className={`flex w-full flex-wrap items-center gap-2 bg-slate-50/70 px-4 py-3 text-left hover:bg-slate-100/70 ${open ? 'border-b border-slate-100' : ''}`}
      >
        {open ? <CaretDown size={16} aria-hidden="true" className="shrink-0 text-slate-500" /> : <CaretRight size={16} aria-hidden="true" className="shrink-0 text-slate-500" />}
        <span className="min-w-0 flex-1 font-semibold text-slate-900 wrap-break-word">{card.label}</span>
        {!open && summary && <span className="text-xs text-slate-500">{summary}</span>}
        <Badge
          variant={verdictBadge[card.verdict]}
          className="gap-1 px-2.5 py-0.5 text-xs"
          title={card.verdict === 'changed' ? 'Công dân đã thay đổi mục này; hãy đọc nội dung trước khi xác nhận.' : undefined}
        >
          {view.icon}{view.label}
        </Badge>
      </button>

      {open && <div className="space-y-3 p-4">
        {/* Nhận xét cán bộ đã ghi ở lần gửi trước */}
        {card.comments.length > 0 && (
          <div className="rounded-xl border-l-4 border-amber-400 bg-amber-50/60 px-3 py-2.5">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-amber-900">
              <ChatCircleDots size={15} weight="fill" aria-hidden="true" />
              Cán bộ yêu cầu sửa ở lần gửi {fromVersion}
            </p>
            <ul className="mt-1.5 space-y-2">
              {card.comments.map((comment, index) => {
                // Thông tin người gửi: mỗi nhận xét gắn với một trường cụ thể nên báo riêng trường đó đã đổi chưa
                const fieldOk = card.kind === 'form' ? changedKeys.has(comment.targetId) : undefined;
                return (
                  <li key={comment.id} className="text-sm">
                    <p className="whitespace-pre-wrap wrap-break-word text-slate-900">
                      {card.comments.length > 1 && <span className="mr-1 font-semibold">{index + 1}.</span>}
                      {card.kind === 'form' && comment.fieldLabel && <span className="font-semibold">{humanizeFieldName(comment.fieldLabel)}: </span>}
                      {comment.commentText}
                    </p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
                      {formatDateTime(comment.createdAt)}
                      {fieldOk !== undefined && (
                        <Badge variant={fieldOk ? 'success' : 'warning'} className="px-1.5 py-0 text-[11px]">
                          {fieldOk ? 'Đã đổi' : 'Chưa đổi'}
                        </Badge>
                      )}
                    </p>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
        {/* Đánh dấu rõ phần bên dưới là những gì công dân đã thay đổi ở lần gửi mới */}
        {card.comments.length > 0 && (card.files.length > 0 || card.fields.length > 0) && (
          <p className="text-xs font-semibold text-slate-600">Công dân đã thay đổi ở lần gửi {toVersion}:</p>
        )}

        {card.verdict === 'missing' && card.kind === 'checklist' && <p className="text-sm text-amber-800">Không có thay đổi.</p>}
        {card.verdict === 'unknown' && <p className="text-sm text-slate-600">Chưa có dữ liệu tệp, xem bản mới ở tab Tờ khai & giấy tờ.</p>}

        {/* Thay đổi thông tin kê khai / danh mục */}
        {card.fields.map((x, i) => (
          <DiffRows
            key={`${x.fieldKey}-${i}`}
            label={diffFieldLabel(x.fieldKey || '', x.fieldLabel)}
            before={x.oldExists ? diffValueText(x.oldValue, true, x.fieldKey || '') : undefined}
            after={x.newExists ? diffValueText(x.newValue, true, x.fieldKey || '') : undefined}
          />
        ))}

        {/* Tệp thay đổi */}
        {card.files.map(change => {
          const file = change.after ?? change.before!;
          return (
            <div key={change.key} className="rounded-xl border border-slate-200 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{file.sourceType === 'SUBMISSION' ? 'Tờ khai' : 'Giấy tờ tải lên'}</p>
                  <p className="text-sm font-medium text-slate-800 break-all" title={file.fileName}>{displayDocumentFileName(file.fileName)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={fileKindView[change.kind].variant} className="px-2 py-0.5 text-xs">{fileKindView[change.kind].label}</Badge>
                  <Button size="small" variant="outline" onClick={() => onCompare(change)}>
                    {change.before && change.after ? 'Mở 2 bản' : 'Mở tệp'}
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
        {hasDocxDiff && <DocxDiff applicationId={applicationId} fromVersion={fromVersion} toVersion={toVersion} checklistId={card.id} />}

        {/* Nhận xét lại cho lần gửi hiện tại */}
        {card.targetId && card.kind === 'checklist' && (
          <>
            {renderTargetComments(card.targetId, card.label, composing, onCloseComposer)}
            {canComment && !composing && (
              <Button size="small" variant="outline" className="gap-1.5" onClick={onCompose}>
                <Warning size={14} aria-hidden="true" className="text-amber-600" />
                Nhận xét lại mục này
              </Button>
            )}
          </>
        )}
      </div>}
    </section>
  );
}

/** Một dòng thay đổi dạng sửa bài: − bản cũ / + bản mới */
function DiffRows({ label, before, after }: { label: string; before?: string; after?: string }) {
  return (
    <div className="rounded-lg border border-slate-200 text-sm">
      <p className="border-b border-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">{label}</p>
      <div className="font-mono text-[13px] leading-relaxed">
        <p className="flex gap-2 bg-red-50/70 px-3 py-1 text-red-900">
          <span aria-hidden="true" className="select-none">−</span>
          <span className="sr-only">Lần trước: </span>
          <span className="min-w-0 whitespace-pre-wrap wrap-break-word">{before ?? '(chưa có)'}</span>
        </p>
        <p className="flex gap-2 bg-emerald-50/70 px-3 py-1 text-emerald-900">
          <span aria-hidden="true" className="select-none">+</span>
          <span className="sr-only">Lần này: </span>
          <span className="min-w-0 whitespace-pre-wrap wrap-break-word">{after ?? '(đã xóa)'}</span>
        </p>
      </div>
    </div>
  );
}

const DIFF_PREVIEW = 3;

/** Thay đổi nội dung tờ khai Word của một mục (BE so theo ô điền hoặc theo đoạn văn). */
function DocxDiff({ applicationId, fromVersion, toVersion, checklistId }: { applicationId: string; fromVersion: number; toVersion: number; checklistId: string }) {
  const diff = useFileVersionDiff(applicationId, fromVersion, toVersion, checklistId);
  const [all, setAll] = useState(false);
  if (diff.isPending) return <Skeleton className="h-14 w-full rounded-lg" />;
  if (diff.isError) {
    return (
      <ErrorAlert retryLabel="Thử lại" retrying={diff.isFetching} onRetry={() => void diff.refetch()}>
        {documentFormError(diff.error)}
      </ErrorAlert>
    );
  }
  if (!diff.data.length) return <p className="text-sm text-slate-600">Chữ trong tờ khai không đổi.</p>;
  const rows = all ? diff.data : diff.data.slice(0, DIFF_PREVIEW);
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-slate-600">Thay đổi trong tờ khai ({diff.data.length})</p>
      {/* Mở hết thì cuộn trong khung, trang không dài thêm */}
      <div className={`space-y-2 ${all ? 'max-h-96 overflow-y-auto overscroll-contain pr-1' : ''}`}>
      {rows.map(row => (
        <DiffRows
          key={row.fieldKey}
          label={row.fieldLabel}
          before={row.oldExists ? row.oldValue || '(trống)' : undefined}
          after={row.newExists ? row.newValue || '(trống)' : undefined}
        />
      ))}
      </div>
      {diff.data.length > DIFF_PREVIEW && (
        <Button size="small" variant="ghost" className="text-xs" onClick={() => setAll(x => !x)}>
          {all ? 'Thu gọn' : `Xem thêm ${diff.data.length - DIFF_PREVIEW} thay đổi`}
        </Button>
      )}
    </div>
  );
}

/** Mở hai bản của một tệp cạnh nhau (hoặc một bản nếu tệp mới / đã xóa). */
function CompareFilesModal({ applicationId, change, fromVersion, toVersion, onClose }: {
  applicationId: string; change: FileChange; fromVersion: number; toVersion: number; onClose: () => void;
}) {
  const sides = [
    change.before && { version: change.before, label: `Lần gửi ${fromVersion}` },
    change.after && { version: change.after, label: `Lần gửi ${toVersion}` },
  ].filter(Boolean) as { version: FileVersionDto; label: string }[];
  const name = displayDocumentFileName((change.after ?? change.before)!.fileName);
  return (
    <Modal
      open
      onOpenChange={open => { if (!open) onClose(); }}
      title={sides.length > 1 ? 'So sánh 2 bản' : 'Xem tệp'}
      description={name}
      className="sm:max-h-[92dvh] sm:max-w-7xl"
    >
      <div className={`grid gap-4 ${sides.length > 1 ? 'lg:grid-cols-2' : ''}`}>
        {sides.map(side => (
          <div key={side.version.id} className="min-w-0 space-y-2">
            <p className="text-sm font-semibold text-slate-800">{side.label}</p>
            <DocumentFilePreview
              fileId={`file-version-${side.version.id}`}
              fileName={side.version.fileName}
              load={signal => documentFormApi.downloadFileVersion(applicationId, side.version.id, signal)}
            />
          </div>
        ))}
      </div>
    </Modal>
  );
}
