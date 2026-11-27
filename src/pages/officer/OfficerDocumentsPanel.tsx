import { lazy, Suspense, useRef, useState, type ReactNode } from 'react';
import { displayDocumentFileName } from '@/lib/documentFileName';
import { formatDateTime } from '@/lib/dateFormat';
import { Badge, Button, ListSkeleton } from '@/components/ui';
import { useApplicationContents, useDocumentMutations, useOfficerSubmissions } from '@/hooks/useDocumentForms';
import { documentFormApi, documentFormError, submissionStatusLabel, validateDocumentFile } from '@/lib/api/documentForms';
import { DocumentFilePreview } from '@/components/documents/DocumentFilePreview';
import { DocumentAiVerificationCard } from '@/components/documents/DocumentAiVerificationCard';
import { toast } from '@/components/ui';
import { useAuthStore } from '@/stores/authStore';
import { ChatCircleDots, Warning } from '@phosphor-icons/react';

type Submission = NonNullable<ReturnType<typeof useOfficerSubmissions>['data']>[number];
type SupportingDocument = NonNullable<ReturnType<typeof useApplicationContents>['data']>['supportingDocuments'][number];

/** Một mục trong danh mục giấy tờ của thủ tục, dùng làm tiêu đề nhóm tệp */
export type DocumentChecklistGroup = {
  id: string;
  title: string;
  isRequired: boolean;
  completed: boolean;
  /** Giấy tờ chỉ xuất trình bản chính tại quầy (không gắn tờ khai): có thể hoàn tất mà không có tệp. */
  presentOnly?: boolean;
  meta?: string;
  /** Điều kiện áp dụng / lưu ý của mục */
  note?: string;
  /** Tên các mẫu đơn liên kết */
  forms?: string[];
};

const DocxOnlineEditor = lazy(() => import('@/components/documents/DocxOnlineEditor'));

function isSupportedAiDocument(fileName: string): boolean {
  const lower = fileName.toLowerCase();
  return lower.endsWith('.pdf') || lower.endsWith('.png') || lower.endsWith('.jpg') || lower.endsWith('.jpeg');
}

export function OfficerDocumentsPanel({
  applicationId,
  applicationNumber,
  editable,
  canVerify = false,
  onComment,
  referenceData,
  checklists = [],
  renderTargetComments,
  openCommentCount,
  updatedSince,
  previousVersion,
}: {
  applicationId: string;
  applicationNumber?: string;
  editable: boolean;
  canVerify?: boolean;
  onComment: (checklistId: string) => void;
  referenceData?: { label: string; value: string }[];
  checklists?: DocumentChecklistGroup[];
  /** Hiển thị nhận xét + ô nhập nhận xét ngay dưới tiêu đề mục giấy tờ */
  renderTargetComments?: (checklistId: string, title: string, composerOpen: boolean, closeComposer: () => void) => ReactNode;
  openCommentCount?: (checklistId: string) => number;
  /** Thời điểm công dân gửi lần trước; tờ khai gửi sau mốc này được gắn nhãn "Mới cập nhật" */
  updatedSince?: string;
  previousVersion?: number;
}) {
  const contents = useApplicationContents(applicationId);
  const submissions = useOfficerSubmissions(applicationId);
  const mutations = useDocumentMutations();
  const [selected, setSelected] = useState<{ id: string; name: string; form: boolean }>();
  // Mục giấy tờ đang mở ô nhập nhận xét tại chỗ
  const [commentingId, setCommentingId] = useState<string>();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [revision, setRevision] = useState(0);
  const lock = useRef(false);
  const user = useAuthStore(s => s.user);
  const [editing, setEditing] = useState<{ id: string; name: string }>();
  const [retryFiles, setRetryFiles] = useState<Record<string, File | undefined>>({});
  const documents = contents.data?.supportingDocuments ?? [];
  // Chỉ tờ khai có thời điểm gửi; giấy tờ tải lên chưa có ngày nên chưa đánh dấu được (đã ghi yêu cầu BE)
  const after = (time?: string | null) => Boolean(updatedSince && time && new Date(time).getTime() > new Date(updatedSince).getTime());
  // Tờ khai: so thời điểm công dân gửi (không dùng updatedAt vì cán bộ chú thích Word cũng làm đổi updatedAt)
  const isUpdated = (item: Submission) => after(item.submittedAt);
  // Giấy tờ tải lên: BE trả updatedAtUtc từ DOC-FILEVER-01 (cán bộ không sửa được giấy tờ)
  const isDocumentUpdated = (item: SupportingDocument) => after(item.updatedAtUtc ?? item.createdAtUtc);
  async function saveAnnotation(id: string, file: File) {
    if (lock.current || !editable) return;
    setSaved(prev => ({ ...prev, [id]: false }));
    setRetryFiles(prev => ({ ...prev, [id]: undefined }));
    const error = validateDocumentFile(file, true);
    if (error) { setErrors(prev => ({ ...prev, [id]: error })); return; }
    lock.current = true;
    setRetryFiles(prev => ({ ...prev, [id]: file }));
    setErrors(prev => ({ ...prev, [id]: '' }));
    try {
      await mutations.annotate.mutateAsync({ applicationId, submissionId: id, file });
      setRetryFiles(prev => ({ ...prev, [id]: undefined }));
      setRevision(x => x + 1);
      setSaved(prev => ({ ...prev, [id]: true }));
    } catch (err) { setErrors(prev => ({ ...prev, [id]: documentFormError(err) })); }
    finally { lock.current = false; }
  }
  function renderSubmission(item: Submission, groupComment: boolean) {
    const isSelected = selected?.id === item.id;
    const evidence = contents.data?.submissions.find(x => x.id === item.id);
    const canAnnotate = editable && item.applicationId === applicationId && Boolean(item.checklistId) && ['Submitted', 'RevisionRequested'].includes(item.status);
    return (
      <div key={item.id} className="space-y-3 rounded-xl border p-4 transition-colors">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Tờ khai</p>
            <h4 className="break-all font-semibold">{displayDocumentFileName(item.fileName)}</h4>
            {isUpdated(item) && (
              <Badge variant="info" className="mr-1.5">Mới cập nhật sau lần gửi {previousVersion}</Badge>
            )}
            <Badge variant={item.status === 'ReadyForDownload' ? 'success' : item.status === 'RevisionRequested' ? 'warning' : 'neutral'}>
              {submissionStatusLabel(item.status)}
            </Badge>
            {item.submittedAt && <p className="text-xs text-slate-500 mt-1">Ngày gửi: {formatDateTime(item.submittedAt)}</p>}
            {item.officerComment && <p className="whitespace-pre-wrap break-words text-sm mt-1">Ghi chú: {item.officerComment}</p>}
            <p className="text-sm mt-1">
              {(item.fileSizeBytes / 1024 / 1024).toFixed(2)} MB{evidence && !evidence.fileExists && ' · Không tìm thấy tệp'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              size="small"
              variant={isSelected ? 'primary' : 'outline'}
              onClick={() => setSelected(prev => (prev?.id === item.id ? undefined : { id: item.id, name: item.fileName, form: true }))}
            >
              {isSelected ? 'Đóng tờ khai' : 'Mở tờ khai'}
            </Button>
            {canAnnotate && (
              <Button
                size="small"
                variant="outline"
                className="gap-1.5 border-red-200 text-red-700 hover:bg-red-50"
                onClick={() => setEditing({ id: item.id, name: item.fileName })}
              >
                <ChatCircleDots size={16} aria-hidden="true" />
                <span>Chú thích & nhận xét Word</span>
              </Button>
            )}
            {item.checklistId && editable && !groupComment && (
              <Button size="small" variant="outline" onClick={() => onComment(item.checklistId!)}>
                Nhận xét mục giấy tờ
              </Button>
            )}
          </div>
        </div>
        {canAnnotate && (
          <label className="relative grid min-w-0 cursor-pointer gap-2 rounded-lg text-sm font-semibold focus-within:border-red-600 focus-within:ring-4 focus-within:ring-red-100">
            Tải lên tờ khai Word có ghi chú
            <span aria-hidden="true" className="flex min-h-12 min-w-0 items-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-2 font-normal text-slate-600">
              Chọn tệp .docx · tối đa 20 MB
            </span>
            <input
              disabled={mutations.annotate.isPending}
              type="file"
              accept=".docx"
              className="sr-only"
              aria-invalid={Boolean(errors[item.id])}
              aria-describedby={errors[item.id] ? `annotate-${item.id}` : undefined}
              onChange={async e => {
                const file = e.target.files?.[0];
                e.target.value = '';
                if (file) await saveAnnotation(item.id, file);
              }}
            />
          </label>
        )}
        {canAnnotate && retryFiles[item.id] && (
          <Button size="small" variant="outline" loading={mutations.annotate.isPending} onClick={() => void saveAnnotation(item.id, retryFiles[item.id]!)}>
            Thử lưu lại tờ khai: {retryFiles[item.id]!.name}
          </Button>
        )}
        {saved[item.id] && <p role="status" className="text-sm text-emerald-800">Đã lưu tờ khai có ghi chú.</p>}
        {errors[item.id] && <p id={`annotate-${item.id}`} role="status" className="text-sm">{errors[item.id]}</p>}

        {isSelected && (
          <div className="mt-3 space-y-3 rounded-xl border border-slate-200 bg-slate-50/80 p-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h5 className="break-all font-bold text-sm text-slate-800">Xem trước: {displayDocumentFileName(item.fileName)}</h5>
              <Button size="small" variant="ghost" onClick={() => setSelected(undefined)}>Đóng</Button>
            </div>
            <DocumentFilePreview
              key={`${item.id}-${revision}`}
              fileId={item.id}
              revision={`${revision}-${item.updatedAt ?? ''}`}
              fileName={item.fileName}
              load={signal => documentFormApi.officerDownloadSubmission(item.id, signal)}
            />
          </div>
        )}
      </div>
    );
  }
  function renderDocument(item: SupportingDocument, groupComment: boolean) {
    const isSelected = selected?.id === item.id;
    return (
      <div key={item.id} className="space-y-3 rounded-xl border p-4 transition-colors">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Giấy tờ tải lên</p>
            <h4 className="break-all font-semibold">{displayDocumentFileName(item.fileName)}</h4>
            {isDocumentUpdated(item) && (
              <Badge variant="info" className="mt-0.5">Mới cập nhật sau lần gửi {previousVersion}</Badge>
            )}
            <p className="text-sm text-slate-600">{item.quantity} bản{!item.fileExists && ' · Không tìm thấy tệp'}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              size="small"
              variant={isSelected ? 'primary' : 'outline'}
              onClick={() => setSelected(prev => (prev?.id === item.id ? undefined : { id: item.id, name: item.fileName, form: false }))}
            >
              {isSelected ? 'Đóng giấy tờ' : 'Mở giấy tờ'}
            </Button>
            {editable && item.checklistId && !groupComment && (
              <Button size="small" variant="outline" onClick={() => onComment(item.checklistId!)}>
                Nhận xét mục giấy tờ
              </Button>
            )}
          </div>
        </div>
        {canVerify && item.id && isSupportedAiDocument(item.fileName) && (
          <div className="pt-2 border-t border-slate-100">
            <DocumentAiVerificationCard
              applicationId={applicationId}
              documentId={item.id}
              fileName={item.fileName}
            />
          </div>
        )}

        {isSelected && (
          <div className="mt-3 space-y-3 rounded-xl border border-slate-200 bg-slate-50/80 p-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h5 className="break-all font-bold text-sm text-slate-800">Xem trước: {displayDocumentFileName(item.fileName)}</h5>
              <Button size="small" variant="ghost" onClick={() => setSelected(undefined)}>Đóng</Button>
            </div>
            <DocumentFilePreview
              key={`${item.id}-${revision}`}
              fileId={item.id}
              revision={`${revision}`}
              fileName={item.fileName}
              load={signal =>
                /\.(pdf|png|jpe?g)$/i.test(item.fileName)
                  ? documentFormApi.previewSupportingDocument(item.id, signal).catch(() => documentFormApi.downloadSupportingDocument(item.id, signal))
                  : documentFormApi.downloadSupportingDocument(item.id, signal)
              }
            />
          </div>
        )}
      </div>
    );
  }
  // Gom tờ khai và giấy tờ công dân đã nộp theo từng mục trong danh mục giấy tờ của thủ tục
  function renderGroups() {
    if (!submissions.data || !contents.data) return null;
    const ids = new Set(checklists.map(x => x.id));
    const others = {
      submissions: submissions.data.filter(x => !x.checklistId || !ids.has(x.checklistId)),
      documents: documents.filter(x => !x.checklistId || !ids.has(x.checklistId)),
    };
    return <>
      {checklists.map((group, index) => {
        const groupSubmissions = submissions.data!.filter(x => x.checklistId === group.id);
        const groupDocuments = documents.filter(x => x.checklistId === group.id);
        const empty = !groupSubmissions.length && !groupDocuments.length;
        const openCount = openCommentCount?.(group.id) ?? 0;
        const composing = commentingId === group.id;
        const commentsNode = renderTargetComments?.(group.id, group.title, composing, () => setCommentingId(undefined));
        return (
          <div key={group.id} id={`comment-target-${group.id}`} className={`scroll-mt-24 overflow-hidden rounded-2xl border bg-white ${openCount ? 'border-amber-300' : 'border-slate-200'}`}>
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3">
              <div className="flex min-w-0 flex-1 basis-full items-start gap-3 sm:basis-0">
                {/* Số thứ tự mục; màu xanh khi công dân đã hoàn tất mục */}
                <span
                  title={group.completed ? 'Công dân đã chuẩn bị' : 'Chưa hoàn tất'}
                  className={`mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg text-sm font-bold ${group.completed ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}
                >
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="wrap-break-word font-semibold text-slate-900">{group.title}</h4>
                    <Badge variant={group.isRequired ? 'danger' : 'neutral'} className="px-2 text-[10px]">
                      {group.isRequired ? 'Bắt buộc' : 'Tùy chọn'}
                    </Badge>
                    {openCount > 0 && (
                      <Badge variant="warning" className="px-2 text-[10px]">{openCount} nhận xét đang mở</Badge>
                    )}
                    {(groupSubmissions.some(isUpdated) || groupDocuments.some(isDocumentUpdated)) && (
                      <Badge variant="info" className="px-2 text-[10px]">Có tệp mới cập nhật</Badge>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {[group.meta, group.completed ? (group.presentOnly && empty ? 'Công dân xác nhận sẽ mang bản chính đến quầy (chưa có tệp)' : 'Công dân đã chuẩn bị') : 'Chưa hoàn tất', `${groupSubmissions.length + groupDocuments.length} tệp đã nộp`].filter(Boolean).join(' · ')}
                  </p>
                  {group.note && <p className="mt-1 whitespace-pre-line text-xs leading-relaxed text-slate-600">{group.note}</p>}
                  {(group.forms?.length ?? 0) > 0 && (
                    <p className="mt-1 text-xs text-slate-600">
                      <span className="font-semibold text-slate-700">Mẫu đơn:</span>
                      {group.forms!.join('; ')}
                    </p>
                  )}
                </div>
              </div>
              {editable && (
                <Button
                  size="small"
                  variant={composing ? 'primary' : 'outline'}
                  className={`gap-1.5 ${composing ? '' : 'bg-white'}`}
                  aria-expanded={renderTargetComments ? composing : undefined}
                  onClick={() => (renderTargetComments ? setCommentingId(composing ? undefined : group.id) : onComment(group.id))}
                >
                  <Warning size={14} aria-hidden="true" className={composing ? 'text-white' : 'text-amber-600'} />
                  Nhận xét
                </Button>
              )}
            </div>
            {commentsNode && (openCount > 0 || composing) && <div className="border-b border-slate-200 px-4 py-3">{commentsNode}</div>}
            <div className="space-y-3 p-4">
              {empty
                ? <p className="text-sm text-slate-500">Công dân chưa nộp tờ khai hoặc giấy tờ cho mục này.</p>
                : <>
                  {groupSubmissions.map(item => renderSubmission(item, true))}
                  {groupDocuments.map(item => renderDocument(item, true))}
                </>}
            </div>
          </div>
        );
      })}
      {(others.submissions.length > 0 || others.documents.length > 0) && (
        <div className="space-y-3">
          {checklists.length > 0 && <h4 className="pt-2 font-semibold text-slate-900">Tệp khác</h4>}
          {others.submissions.map(item => renderSubmission(item, false))}
          {others.documents.map(item => renderDocument(item, false))}
        </div>
      )}
    </>;
  }
  return <section className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h3 className="font-bold">Tờ khai và giấy tờ theo danh mục</h3>
      {checklists.some(x => x.isRequired) && (
        <span className="text-xs font-semibold text-slate-500">
          {checklists.filter(x => x.isRequired && x.completed).length}/{checklists.filter(x => x.isRequired).length} mục bắt buộc đã hoàn tất
        </span>
      )}
    </div>
    <p className="text-xs text-slate-500">{editable ? 'Bình luận Word hiện trong tờ khai, không thay cho nhận xét yêu cầu bổ sung.' : 'Chỉ xem và tải xuống.'}</p>
    {(contents.isPending || submissions.isPending) && <ListSkeleton rows={3} />}
    {(contents.isError || submissions.isError) && <div role="alert"><p>{documentFormError(contents.error || submissions.error)}</p><Button variant="outline" onClick={() => { void contents.refetch(); void submissions.refetch(); }}>Thử tải lại danh sách</Button></div>}
    {renderGroups()}
    {contents.isSuccess && submissions.isSuccess && !documents.length && !submissions.data.length && <p>Hồ sơ chưa có tệp đã lưu.</p>}
    {editing && (
      <Suspense
        fallback={
          <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-900/60 backdrop-blur-sm text-white" role="status" aria-label="Đang mở tờ khai">
            <div className="flex flex-col items-center gap-3 rounded-2xl bg-slate-800/90 px-6 py-5 shadow-2xl border border-slate-700">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
              <p className="text-sm font-medium">Đang mở tờ khai…</p>
            </div>
          </div>
        }
      >
        <DocxOnlineEditor
          sourceKey={`${applicationId}-${editing.id}`}
          title={editing.name}
          subtitle={applicationNumber ? `Hồ sơ ${applicationNumber}` : undefined}
          author={user?.profile?.fullName || user?.username || 'Cán bộ thụ lý'}
          referenceData={referenceData}
          commentable
          load={signal => documentFormApi.officerDownloadSubmission(editing.id, signal)}
          onSave={async file => {
            if (!editable) throw new Error('Hồ sơ không còn cho phép chỉnh sửa. Vui lòng tải lại trạng thái.');
            await mutations.annotate.mutateAsync({ applicationId, submissionId: editing.id, file });
            setRevision(value => value + 1);
            toast.success('Đã lưu tờ khai vào hồ sơ.');
          }}
          onClose={() => setEditing(undefined)}
        />
      </Suspense>
    )}
  </section>;
}
