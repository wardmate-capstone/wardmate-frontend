import { useRef, useState } from 'react';
import { Button } from '@/components/ui';
import { useApplicationContents, useDocumentMutations, useOfficerSubmissions } from '@/hooks/useDocumentForms';
import { documentFormApi, documentFormError, submissionStatusLabel, validateDocumentFile } from '@/lib/api/documentForms';
import { DocumentFilePreview } from '@/components/documents/DocumentFilePreview';

export function OfficerDocumentsPanel({ applicationId, editable, onComment }: { applicationId: string; editable: boolean; onComment: (checklistId: string) => void }) {
  const contents = useApplicationContents(applicationId);
  const submissions = useOfficerSubmissions(applicationId);
  const mutations = useDocumentMutations();
  const [selected, setSelected] = useState<{ id: string; name: string; form: boolean }>();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [revision, setRevision] = useState(0);
  const lock = useRef(false);
  const documents = contents.data?.supportingDocuments ?? [];
  return <section className="space-y-4">
    <h3 className="font-bold">Bản khai và giấy tờ đã lưu</h3>
    <p className="text-sm text-slate-600">Để ghi chú Word: tải bản khai, thêm bình luận trong Word rồi tải lại DOCX. Ghi chú trong Word chưa phải nhận xét yêu cầu bổ sung của hồ sơ.</p>
    {(contents.isPending || submissions.isPending) && <p role="status">Đang tải danh sách tài liệu…</p>}
    {(contents.isError || submissions.isError) && <div role="alert"><p>{documentFormError(contents.error || submissions.error)}</p><Button variant="outline" onClick={() => { void contents.refetch(); void submissions.refetch(); }}>Thử tải lại danh sách</Button></div>}
    {submissions.data?.map(item => {
      const evidence = contents.data?.submissions.find(x => x.id === item.id);
      return <div key={item.id} className="space-y-3 rounded-xl border p-4"><h4 className="break-all font-semibold">{item.fileName}</h4><p className="text-sm">{submissionStatusLabel(item.status)} · {(item.fileSizeBytes / 1024 / 1024).toFixed(2)} MiB{evidence && !evidence.fileExists && ' · Không tìm thấy tệp trong kho'}</p><div className="flex flex-wrap gap-3"><Button size="small" variant="outline" onClick={() => setSelected({ id: item.id, name: item.fileName, form: true })}>Mở bản khai</Button>{item.checklistId && editable && <Button size="small" variant="outline" onClick={() => onComment(item.checklistId!)}>Nhận xét mục giấy tờ</Button>}</div>{editable && item.applicationId === applicationId && item.checklistId && <label className="grid gap-2 text-sm font-semibold">Tải lại DOCX có ghi chú<input disabled={mutations.annotate.isPending} type="file" accept=".docx" className="min-h-11 max-w-full rounded-lg border p-2" aria-invalid={Boolean(errors[item.id])} aria-describedby={errors[item.id] ? `annotate-${item.id}` : undefined} onChange={async e => {
        const file = e.target.files?.[0]; e.target.value = ''; if (!file || lock.current) return;
        const error = validateDocumentFile(file, true); if (error) { setErrors(prev => ({ ...prev, [item.id]: error })); return; }
        lock.current = true; setErrors(prev => ({ ...prev, [item.id]: '' }));
        try { await mutations.annotate.mutateAsync({ applicationId, submissionId: item.id, file }); setRevision(x => x + 1); setErrors(prev => ({ ...prev, [item.id]: 'Đã lưu bản khai có ghi chú. Thêm nhận xét vào hồ sơ trước khi yêu cầu bổ sung.' })); }
        catch (err) { setErrors(prev => ({ ...prev, [item.id]: documentFormError(err) })); }
        finally { lock.current = false; }
      }} /></label>}{errors[item.id] && <p id={`annotate-${item.id}`} role="status" className="text-sm">{errors[item.id]}</p>}</div>;
    })}
    {documents.map(item => <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4"><div className="min-w-0"><h4 className="break-all font-semibold">{item.fileName}</h4><p className="text-sm">{item.quantity} bản{!item.fileExists && ' · Không tìm thấy tệp trong kho'}</p></div><div className="flex flex-wrap gap-2"><Button size="small" variant="outline" onClick={() => setSelected({ id: item.id, name: item.fileName, form: false })}>Mở giấy tờ</Button>{editable && item.checklistId && <Button size="small" variant="outline" onClick={() => onComment(item.checklistId!)}>Nhận xét mục giấy tờ</Button>}</div></div>)}
    {contents.isSuccess && submissions.isSuccess && !documents.length && !submissions.data.length && <p>Hồ sơ chưa có tệp đã lưu.</p>}
    {selected && <div className="space-y-3 rounded-xl border bg-slate-50 p-4"><h4 className="break-all font-bold">{selected.name}</h4><DocumentFilePreview key={`${selected.id}-${revision}`} fileId={selected.id} revision={`${revision}-${submissions.data?.find(x => x.id === selected.id)?.updatedAt ?? ''}`} fileName={selected.name} load={signal => selected.form ? documentFormApi.officerDownloadSubmission(selected.id, signal) : documentFormApi.downloadSupportingDocument(selected.id, signal)} /></div>}
  </section>;
}
