import { useRef, useState } from 'react';
import { Button, toast } from '@/components/ui';
import { useApplicationContents, useDocumentMutations, useGeneratedDocuments } from '@/hooks/useDocumentForms';
import { documentFormApi, documentFormError, type GeneratedDocumentDto } from '@/lib/api/documentForms';
import { DocumentFilePreview } from '@/components/documents/DocumentFilePreview';

/** Mount only after Workflow confirms DOCUMENTS_READY. */
export function GeneratedDocumentsPanel({ applicationId }: { applicationId: string }) {
  const contents = useApplicationContents(applicationId);
  const generated = useGeneratedDocuments(applicationId);
  const mutations = useDocumentMutations();
  const [selected, setSelected] = useState<GeneratedDocumentDto>();
  const [error, setError] = useState('');
  const lock = useRef(false);
  const approved = contents.data?.submissions.filter(x => ['ReadyForDownload', 'Approved'].includes(x.status)) ?? [];
  const knownIds = new Set(contents.data?.submissions.map(x => x.id));
  const unmatched = generated.data?.filter(x => !x.submissionId || !knownIds.has(x.submissionId)) ?? [];
  function renderPdfs(items: GeneratedDocumentDto[]) {
    return items.length ? <ul className="space-y-2">{items.map(item => <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 text-sm"><span>PDF · {new Date(item.createdAtUtc).toLocaleString('vi-VN')}</span><Button variant="outline" size="small" onClick={() => setSelected(item)}>Xem và tải PDF</Button></li>)}</ul> : <p className="text-sm text-slate-600">Chưa có bản PDF.</p>;
  }
  return <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
    <h3 className="font-bold text-slate-900">Bản PDF sau tiền kiểm</h3>
    <p className="text-sm text-slate-600">PDF được tạo từ bản khai đã lưu và được xác nhận sẵn sàng. Không thay thế việc tiếp nhận hồ sơ chính thức.</p>
    {(contents.isPending || generated.isPending) && <p role="status">Đang tải tài liệu…</p>}
    {(contents.isError || generated.isError) && <div role="alert"><p>{documentFormError(contents.error || generated.error)}</p><Button variant="outline" onClick={() => { void contents.refetch(); void generated.refetch(); }}>Thử lại</Button></div>}
    {error && <p role="alert" className="text-sm text-red-800">{error}</p>}
    {approved.map(item => <div key={item.id} className="space-y-3 rounded-xl border p-4"><h4 className="break-all font-semibold">{item.fileName}</h4><Button size="small" disabled={!item.fileExists || mutations.generatePdf.isPending} loading={mutations.generatePdf.isPending && mutations.generatePdf.variables?.submissionId === item.id} onClick={async () => {
      if (lock.current) return; lock.current = true; setError('');
      try { await mutations.generatePdf.mutateAsync({ applicationId, submissionId: item.id }); toast.success('Đã tạo bản PDF sau tiền kiểm.'); }
      catch (err) { setError(documentFormError(err)); }
      finally { lock.current = false; }
    }}>Tạo PDF: {item.fileName}</Button>{!item.fileExists && <p role="alert">Không tìm thấy bản khai trong kho lưu trữ.</p>}{renderPdfs(generated.data?.filter(x => x.submissionId === item.id) ?? [])}</div>)}
    {contents.isSuccess && !approved.length && <p>Chưa có bản khai sẵn sàng để tạo PDF.</p>}
    {!!unmatched.length && <div className="space-y-2"><h4 className="font-semibold">PDF chưa xác định bản khai nguồn</h4>{renderPdfs(unmatched)}</div>}
    {selected && <div className="space-y-3"><h4 className="font-semibold">Bản PDF được chọn</h4><DocumentFilePreview key={selected.id} fileId={selected.id} fileName={`ban-khai-${selected.id}.pdf`} load={signal => documentFormApi.downloadGeneratedDocument(selected.id, signal)} /></div>}
  </section>;
}
