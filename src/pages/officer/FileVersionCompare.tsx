import { useMemo, useState } from 'react';
import { Badge, Button, ErrorAlert, Skeleton } from '@/components/ui';
import { DocumentFilePreview } from '@/components/documents/DocumentFilePreview';
import { useFileVersionDiff, useFileVersions } from '@/hooks/useDocumentForms';
import { documentFormApi, documentFormError, type FileVersionDto } from '@/lib/api/documentForms';

type ChangeKind = 'added' | 'removed' | 'replaced' | 'unchanged' | 'unknown';
type FileChange = { key: string; kind: ChangeKind; before?: FileVersionDto; after?: FileVersionDto };
type Group = { id: string; label: string; changes: FileChange[] };

const kindView: Record<ChangeKind, { label: string; variant: 'info' | 'warning' | 'danger' | 'neutral' }> = {
  added: { label: 'Mới', variant: 'info' },
  replaced: { label: 'Đã thay', variant: 'warning' },
  removed: { label: 'Đã xóa', variant: 'danger' },
  unchanged: { label: 'Không đổi', variant: 'neutral' },
  unknown: { label: 'Không xác định', variant: 'neutral' },
};

/**
 * DOC-FILEVER-01: ghép tệp của hai lần gửi theo từng mục giấy tờ.
 * Cùng sourceId → so sha256; tệp còn lại cùng mục + cùng loại → coi là bị thay; phần dư → mới / đã xóa.
 * sha256 rỗng (tệp không còn trong kho lúc ghi) → không xác định.
 */
export function pairFileVersions(before: FileVersionDto[], after: FileVersionDto[]): FileChange[] {
  const result: FileChange[] = [];
  const restBefore = [...before];
  const restAfter: FileVersionDto[] = [];
  for (const b of after) {
    const i = restBefore.findIndex(a => a.sourceId === b.sourceId);
    if (i >= 0) result.push(compare(restBefore.splice(i, 1)[0], b));
    else restAfter.push(b);
  }
  for (const b of [...restAfter]) {
    const i = restBefore.findIndex(a => a.checklistId === b.checklistId && a.sourceType === b.sourceType);
    if (i < 0) continue;
    result.push(compare(restBefore.splice(i, 1)[0], b));
    restAfter.splice(restAfter.indexOf(b), 1);
  }
  restAfter.forEach(b => result.push({ key: b.id, kind: 'added', after: b }));
  restBefore.forEach(a => result.push({ key: a.id, kind: 'removed', before: a }));
  return result;
}

function compare(before: FileVersionDto, after: FileVersionDto): FileChange {
  const kind: ChangeKind = !before.sha256 || !after.sha256 ? 'unknown' : before.sha256 === after.sha256 ? 'unchanged' : 'replaced';
  return { key: `${before.id}-${after.id}`, kind, before, after };
}

export function FileVersionCompare({
  applicationId,
  fromVersion,
  toVersion,
  checklists,
  onOpenDocuments,
}: {
  applicationId: string;
  fromVersion: number;
  toVersion: number;
  checklists: { id: string; title: string }[];
  onOpenDocuments: () => void;
}) {
  const before = useFileVersions(applicationId, fromVersion);
  const after = useFileVersions(applicationId, toVersion);
  const [showUnchanged, setShowUnchanged] = useState(false);
  // Chỉ mở một bản xem trước / một bảng so sánh tại một thời điểm cho đỡ rối
  const [preview, setPreview] = useState<FileVersionDto>();
  const [diffChecklist, setDiffChecklist] = useState<string>();

  const groups = useMemo<Group[]>(() => {
    if (!before.data || !after.data) return [];
    const changes = pairFileVersions(before.data, after.data);
    const order = checklists.map((x, i) => ({ ...x, label: `${i + 1}. ${x.title}` }));
    const byGroup = new Map<string, FileChange[]>();
    for (const change of changes) {
      const id = (change.after ?? change.before)?.checklistId ?? '';
      const key = order.some(x => x.id === id) ? id : 'other';
      byGroup.set(key, [...(byGroup.get(key) ?? []), change]);
    }
    return [
      ...order.filter(x => byGroup.has(x.id)).map(x => ({ id: x.id, label: x.label, changes: byGroup.get(x.id)! })),
      ...(byGroup.has('other') ? [{ id: 'other', label: 'Tệp khác', changes: byGroup.get('other')! }] : []),
    ];
  }, [before.data, after.data, checklists]);

  const all = groups.flatMap(g => g.changes);
  const counts = (['added', 'replaced', 'removed'] as const).map(kind => ({ kind, count: all.filter(x => x.kind === kind).length }));
  const changed = all.filter(x => x.kind !== 'unchanged').length;
  const visibleGroups = groups
    .map(g => ({ ...g, changes: showUnchanged ? g.changes : g.changes.filter(x => x.kind !== 'unchanged') }))
    .filter(g => g.changes.length);

  return (
    <div className="space-y-3 border-t border-slate-100 pt-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="font-bold text-slate-900">Tệp thay đổi</h4>
        {all.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            {counts.filter(x => x.count).map(x => (
              <Badge key={x.kind} variant={kindView[x.kind].variant} className="px-2 py-0.5 text-xs">
                {x.count} {kindView[x.kind].label.toLowerCase()}
              </Badge>
            ))}
            <label className="ml-1 inline-flex cursor-pointer items-center gap-1.5 text-slate-600">
              <input type="checkbox" checked={showUnchanged} onChange={e => setShowUnchanged(e.target.checked)} />
              Hiện tệp không đổi
            </label>
          </div>
        )}
      </div>

      {(before.isPending || after.isPending) && <Skeleton className="h-16 w-full rounded-xl" />}
      {(before.isError || after.isError) && (
        <ErrorAlert retryLabel="Thử lại" retrying={before.isFetching || after.isFetching} onRetry={() => { void before.refetch(); void after.refetch(); }}>
          {documentFormError(before.error || after.error)}
        </ErrorAlert>
      )}

      {before.isSuccess && after.isSuccess && (!before.data.length || !after.data.length) && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
          <p className="min-w-0 flex-1">
            Chưa có dữ liệu tệp của lần gửi {!before.data.length ? fromVersion : toVersion} nên chưa so sánh được tệp. Hệ thống chỉ lưu tệp cho các lần gửi từ 18/11/2026.
          </p>
          <Button size="small" variant="outline" className="bg-white" onClick={onOpenDocuments}>Xem tờ khai & giấy tờ</Button>
        </div>
      )}

      {before.isSuccess && after.isSuccess && before.data.length > 0 && after.data.length > 0 && !changed && !showUnchanged && (
        <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">Công dân không thay tệp nào giữa hai lần gửi.</p>
      )}

      {visibleGroups.map(group => (
        <div key={group.id} className="overflow-hidden rounded-xl border border-slate-200">
          <p className="border-b border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-800 wrap-break-word">{group.label}</p>
          <div className="divide-y divide-slate-100">
            {group.changes.map(change => {
              const file = change.after ?? change.before!;
              const canDiff = change.kind === 'replaced' && file.sourceType === 'SUBMISSION' && group.id !== 'other';
              return (
                <div key={change.key} className="space-y-2 px-3 py-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        {file.sourceType === 'SUBMISSION' ? 'Tờ khai' : 'Giấy tờ tải lên'}
                      </p>
                      <p className="break-all text-sm font-medium text-slate-800">
                        {change.kind === 'replaced' && change.before!.fileName !== change.after!.fileName
                          ? <>{change.before!.fileName} → {change.after!.fileName}</>
                          : file.fileName}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge variant={kindView[change.kind].variant} className="px-2 py-0.5 text-xs">{kindView[change.kind].label}</Badge>
                      {change.before && (
                        <Button size="small" variant={preview?.id === change.before.id ? 'primary' : 'outline'} onClick={() => setPreview(p => (p?.id === change.before!.id ? undefined : change.before))}>
                          Bản lần {fromVersion}
                        </Button>
                      )}
                      {change.after && change.kind !== 'unchanged' && (
                        <Button size="small" variant={preview?.id === change.after.id ? 'primary' : 'outline'} onClick={() => setPreview(p => (p?.id === change.after!.id ? undefined : change.after))}>
                          Bản lần {toVersion}
                        </Button>
                      )}
                      {canDiff && (
                        <Button size="small" variant={diffChecklist === group.id ? 'primary' : 'outline'} onClick={() => setDiffChecklist(id => (id === group.id ? undefined : group.id))}>
                          Xem thay đổi trong tờ khai
                        </Button>
                      )}
                    </div>
                  </div>
                  {canDiff && diffChecklist === group.id && (
                    <DocxDiff applicationId={applicationId} fromVersion={fromVersion} toVersion={toVersion} checklistId={group.id} />
                  )}
                  {[change.before, change.after].map(version => version && preview?.id === version.id && (
                    <div key={version.id} className="rounded-xl border border-slate-200 bg-slate-50/80 p-3">
                      <p className="mb-2 break-all text-xs font-semibold text-slate-700">
                        Lần gửi {version.applicationVersionNumber}: {version.fileName}
                      </p>
                      <DocumentFilePreview
                        fileId={`file-version-${version.id}`}
                        fileName={version.fileName}
                        load={signal => documentFormApi.downloadFileVersion(applicationId, version.id, signal)}
                      />
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

/** So sánh nội dung tờ khai Word của một mục: theo ô điền hoặc theo đoạn văn (BE quyết định). */
function DocxDiff({ applicationId, fromVersion, toVersion, checklistId }: { applicationId: string; fromVersion: number; toVersion: number; checklistId: string }) {
  const diff = useFileVersionDiff(applicationId, fromVersion, toVersion, checklistId);
  if (diff.isPending) return <Skeleton className="h-14 w-full rounded-xl" />;
  if (diff.isError) {
    return (
      <ErrorAlert retryLabel="Thử lại" retrying={diff.isFetching} onRetry={() => void diff.refetch()}>
        {documentFormError(diff.error)} Có thể mở hai bản để đối chiếu thủ công.
      </ErrorAlert>
    );
  }
  if (!diff.data.length) return <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">Nội dung chữ trong tờ khai không thay đổi (có thể chỉ khác định dạng hoặc hình ảnh).</p>;
  return (
    <div className="space-y-2">
      {diff.data.map(row => (
        <div key={row.fieldKey} className="rounded-lg border border-slate-200 p-3">
          <p className="text-sm font-semibold text-slate-800">{row.fieldLabel}</p>
          <div className="mt-1.5 grid gap-2 text-xs sm:grid-cols-2">
            <div className="rounded-lg bg-slate-50 p-2.5">
              <span className="font-semibold text-slate-500">Lần {fromVersion}:</span>
              <p className="mt-1 whitespace-pre-wrap break-words text-slate-700">{row.oldExists ? row.oldValue || '(trống)' : '(chưa có)'}</p>
            </div>
            <div className="rounded-lg bg-emerald-50/60 p-2.5">
              <span className="font-semibold text-emerald-700">Lần {toVersion}:</span>
              <p className="mt-1 whitespace-pre-wrap break-words text-emerald-900">{row.newExists ? row.newValue || '(trống)' : '(đã xóa)'}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
