import { lazy, Suspense, useRef, useState } from 'react';
import { Badge, Button } from '@/components/ui';
import { useApplicationContents, useDocumentMutations, useOfficerSubmissions } from '@/hooks/useDocumentForms';
import { documentFormApi, documentFormError, submissionStatusLabel, validateDocumentFile } from '@/lib/api/documentForms';
import { DocumentFilePreview } from '@/components/documents/DocumentFilePreview';
import { Modal, toast } from '@/components/ui';
import { useAuthStore } from '@/stores/authStore';

const DocxOnlineEditor = lazy(() => import('@/components/documents/DocxOnlineEditor'));

export function OfficerDocumentsPanel({ applicationId, editable, onComment }: { applicationId: string; editable: boolean; onComment: (checklistId: string) => void }) {
  const contents = useApplicationContents(applicationId);
  const submissions = useOfficerSubmissions(applicationId);
  const mutations = useDocumentMutations();
  const [selected, setSelected] = useState<{ id: string; name: string; form: boolean }>();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [revision, setRevision] = useState(0);
  const lock = useRef(false);
  const user = useAuthStore(s => s.user);
  const [editing, setEditing] = useState<{ id: string; name: string }>();
  const [retryFiles, setRetryFiles] = useState<Record<string, File | undefined>>({});
  const documents = contents.data?.supportingDocuments ?? [];
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
  return <section className="space-y-4">
    <h3 className="font-bold">Bản khai và giấy tờ đã lưu</h3>
    <p className="text-sm text-slate-600">{editable ? 'Có thể chỉnh sửa DOCX trực tuyến.' : 'Hồ sơ hiện chỉ được xem và tải xuống.'} Để thêm hoặc đọc đầy đủ bình luận Word, tải bản khai và mở bằng Word rồi tải lại. Bình luận Word chưa phải nhận xét yêu cầu bổ sung của hồ sơ.</p>
    {(contents.isPending || submissions.isPending) && <p role="status">Đang tải danh sách tài liệu…</p>}
    {(contents.isError || submissions.isError) && <div role="alert"><p>{documentFormError(contents.error || submissions.error)}</p><Button variant="outline" onClick={() => { void contents.refetch(); void submissions.refetch(); }}>Thử tải lại danh sách</Button></div>}
    {submissions.data?.map(item => {
      const evidence = contents.data?.submissions.find(x => x.id === item.id);
      const canAnnotate = editable && item.applicationId === applicationId && Boolean(item.checklistId) && ['Submitted', 'RevisionRequested'].includes(item.status);
      return <div key={item.id} className="space-y-3 rounded-xl border p-4"><h4 className="break-all font-semibold">{item.fileName}</h4><Badge variant={item.status === 'ReadyForDownload' ? 'success' : item.status === 'RevisionRequested' ? 'warning' : 'neutral'}>{submissionStatusLabel(item.status)}</Badge>{item.submittedAt && <p className="text-xs text-slate-500">Ngày gửi: {new Date(item.submittedAt).toLocaleString('vi-VN')}</p>}{item.officerComment && <p className="whitespace-pre-wrap break-words text-sm">Ghi chú: {item.officerComment}</p>}<p className="text-sm"> {(item.fileSizeBytes / 1024 / 1024).toFixed(2)} MiB{evidence && !evidence.fileExists && ' · Không tìm thấy tệp trong kho'}</p><div className="flex flex-wrap gap-3"><Button size="small" variant="outline" onClick={() => setSelected({ id: item.id, name: item.fileName, form: true })}>Mở bản khai</Button>{item.checklistId && editable && <Button size="small" variant="outline" onClick={() => onComment(item.checklistId!)}>Nhận xét mục giấy tờ</Button>}</div>{canAnnotate && <label className="relative grid min-w-0 cursor-pointer gap-2 rounded-lg text-sm font-semibold focus-within:ring-2 focus-within:ring-red-700 focus-within:ring-offset-2">Tải lại DOCX có ghi chú<span aria-hidden="true" className="flex min-h-12 min-w-0 items-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-2 font-normal text-slate-600">Chọn tệp DOCX · Tối đa 20 MiB</span><input disabled={mutations.annotate.isPending} type="file" accept=".docx" className="sr-only" aria-invalid={Boolean(errors[item.id])} aria-describedby={errors[item.id] ? `annotate-${item.id}` : undefined} onChange={async e => {
        const file = e.target.files?.[0]; e.target.value = ''; if (file) await saveAnnotation(item.id, file);
      }} /></label>}{canAnnotate && retryFiles[item.id] && <Button size="small" variant="outline" loading={mutations.annotate.isPending} onClick={() => void saveAnnotation(item.id, retryFiles[item.id]!)}>Thử lưu lại DOCX: {retryFiles[item.id]!.name}</Button>}{saved[item.id] && <p role="status" className="text-sm text-emerald-800">Đã lưu bản khai có ghi chú. Thêm nhận xét vào hồ sơ trước khi yêu cầu bổ sung.</p>}{errors[item.id] && <p id={`annotate-${item.id}`} role="status" className="text-sm">{errors[item.id]}</p>}</div>;
    })}
    {documents.map(item => <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4"><div className="min-w-0"><h4 className="break-all font-semibold">{item.fileName}</h4><p className="text-sm">{item.quantity} bản{!item.fileExists && ' · Không tìm thấy tệp trong kho'}</p></div><div className="flex flex-wrap gap-2"><Button size="small" variant="outline" onClick={() => setSelected({ id: item.id, name: item.fileName, form: false })}>Mở giấy tờ</Button>{editable && item.checklistId && <Button size="small" variant="outline" onClick={() => onComment(item.checklistId!)}>Nhận xét mục giấy tờ</Button>}</div></div>)}
    {contents.isSuccess && submissions.isSuccess && !documents.length && !submissions.data.length && <p>Hồ sơ chưa có tệp đã lưu.</p>}
    {selected && <div className="space-y-3 rounded-xl border bg-slate-50 p-4"><h4 className="break-all font-bold">{selected.name}</h4><DocumentFilePreview key={`${selected.id}-${revision}`} fileId={selected.id} revision={`${revision}-${submissions.data?.find(x => x.id === selected.id)?.updatedAt ?? ''}`} fileName={selected.name} load={signal => selected.form ? documentFormApi.officerDownloadSubmission(selected.id, signal) : documentFormApi.downloadSupportingDocument(selected.id, signal)} /></div>}
    {submissions.data?.filter(item => editable && item.applicationId === applicationId && item.checklistId && ['Submitted', 'RevisionRequested'].includes(item.status)).map(item => <Button key={item.id} variant="outline" size="small" onClick={() => setEditing({ id: item.id, name: item.fileName })}>Chỉnh sửa trực tuyến: {item.fileName}</Button>)}
    {editing && <Suspense fallback={<Modal open onOpenChange={open => { if (!open) setEditing(undefined); }} title="Mở bản khai trực tuyến"><p role="status">Đang tải trình soạn thảo…</p></Modal>}><DocxOnlineEditor
      sourceKey={`${applicationId}-${editing.id}`} title={editing.name} author={user?.profile?.fullName || user?.username || 'Cán bộ'}
      load={signal => documentFormApi.officerDownloadSubmission(editing.id, signal)}
      onSave={async file => {
        if (!editable) throw new Error('Hồ sơ không còn cho phép chỉnh sửa. Vui lòng tải lại trạng thái.');
        await mutations.annotate.mutateAsync({ applicationId, submissionId: editing.id, file });
        setRevision(value => value + 1); toast.success('Đã lưu bản DOCX vào hồ sơ.');
      }} onClose={() => setEditing(undefined)}
    /></Suspense>}
  </section>;
}
