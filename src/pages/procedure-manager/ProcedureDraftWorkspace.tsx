import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button, Input } from '@/components/ui';
import { ProcedureFeedback } from '@/components/ui/ProcedureFeedback';
import { procedureApi, procedureError, type Category, type ProcedureDraft, type Extraction } from '@/lib/api/procedures';
import { useProcedureQuery } from '@/hooks/useProcedureQuery';
import { ProcedureApiEditor, validateProcedure } from './ProcedureApiEditor';
import { toast } from '@/components/ui/Toast';

const labels: Record<string, string> = { Queued: 'Chờ đọc PDF', Processing: 'Đang đọc PDF', NeedsReview: 'Cần đối soát', Failed: 'Đọc PDF thất bại', Published: 'Đã xuất bản' };
export function PdfSource({ id, draft = false }: { id: string; draft?: boolean }) {
  const [source, setSource] = useState<{ url: string; expires: number }>();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => { setSource(undefined); setError(''); }, [id, draft]);
  useEffect(() => {
    if (!source) return;
    const timeout = window.setTimeout(() => setSource(undefined), Math.max(0, source.expires - Date.now()));
    return () => window.clearTimeout(timeout);
  }, [source]);
  return <section className="space-y-3"><Button variant="outline" loading={busy} onClick={async () => {
    setBusy(true); setError('');
    try { const result = await procedureApi.source(id, draft); setSource({ url: result.url, expires: Date.now() + result.expiresInSeconds * 1000 }); }
    catch (e) { setError(procedureError(e)); } finally { setBusy(false); }
  }}>{source ? 'Làm mới liên kết PDF' : 'Xem PDF nguồn'}</Button><ProcedureFeedback error={error} />{source && <><a className="block text-sm font-semibold text-red-800 underline" href={source.url} target="_blank" rel="noopener noreferrer">Mở PDF trong tab mới (liên kết có thời hạn)</a><iframe title="PDF nguồn thủ tục" src={source.url} referrerPolicy="no-referrer" className="h-[65vh] w-full rounded-xl border" /></>}</section>;
}

export function ProcedureDraftWorkspace({ categories, onPublished, onPendingChange }: { categories: Category[]; onPublished: () => void; onPendingChange: (pending: boolean) => void }) {
  const [params, setParams] = useSearchParams();
  const id = params.get('draft');
  const [page, setPage] = useState(1);
  const list = useProcedureQuery(useCallback((signal: AbortSignal) => procedureApi.drafts(page, signal), [page]));
  const [draft, setDraft] = useState<ProcedureDraft>();
  const [payload, setPayload] = useState<Record<string, unknown>>({});
  const [preview, setPreview] = useState<Extraction>();
  const [file, setFile] = useState<File>();
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [reload, setReload] = useState(0);
  const previewController = useRef<AbortController | null>(null);
  const lock = useRef(false);
  useEffect(() => { onPendingChange(dirty || busy); return () => onPendingChange(false); }, [dirty, busy, onPendingChange]);
  useEffect(() => () => previewController.current?.abort(), []);
  useEffect(() => {
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    setDraft(undefined); setError(''); setConfirmed(false); setDirty(false);
    if (!id) { setLoading(false); return () => controller.abort(); }
    setLoading(true);
    const load = async () => {
      try {
        const next = await procedureApi.draft(id, controller.signal);
        if (controller.signal.aborted) return;
        setDraft(next); setPayload(next.payload); setLoading(false);
        if (['Queued', 'Processing'].includes(next.status)) timer = setTimeout(load, 4000);
      } catch (e) { if (!controller.signal.aborted) { setError(procedureError(e)); setLoading(false); } }
    };
    void load();
    return () => { controller.abort(); clearTimeout(timer); };
  }, [id, reload]);
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
  const select = (next?: string) => { const query = new URLSearchParams(params); if (next) query.set('draft', next); else query.delete('draft'); setParams(query); };
  const run = async (action: () => Promise<void>) => {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError('');
    try { await action(); } catch (e) { setError(procedureError(e)); } finally { lock.current = false; setBusy(false); }
  };
  const editable = draft && ['NeedsReview', 'Failed'].includes(draft.status);
  return <div className="space-y-5"><h1 className="text-2xl font-bold">PDF và bản nháp thủ tục</h1><ProcedureFeedback error={error} />
    {!id ? <><section className="admin-card space-y-4 p-5"><Input label="PDF mô tả thủ tục (tối đa 20 MB)" type="file" accept=".pdf,application/pdf" disabled={busy} onChange={e => { setFile(e.target.files?.[0]); setPreview(undefined); }} /><div className="flex flex-wrap gap-3"><Button disabled={!file} loading={busy} onClick={() => void run(async () => { const result = await procedureApi.upload(file!); select(result.id); list.refresh(); toast.success('Đã lưu PDF và tạo bản nháp.'); })}>Tải lên và tạo bản nháp</Button><Button variant="outline" disabled={!file || busy} onClick={() => void run(async () => { previewController.current = new AbortController(); setPreview(await procedureApi.preview(file!, previewController.current.signal)); })}>Đọc thử PDF (không lưu)</Button>{busy && previewController.current && <Button variant="ghost" onClick={() => previewController.current?.abort()}>Dừng đọc thử</Button>}</div><p className="text-sm text-slate-600">Nếu upload mất kết nối, kiểm tra danh sách trước khi tải lại để tránh tạo trùng bản nháp.</p>{preview && <section className="space-y-3"><h2 className="font-bold">Kết quả đọc thử — chưa lưu bản nháp</h2>{preview.warnings.map((text, i) => <p key={i} className="text-sm text-amber-900">{text}</p>)}<pre className="max-h-80 overflow-auto whitespace-pre-wrap rounded-lg bg-slate-50 p-4 text-sm">{preview.extractedText}</pre><ProcedureApiEditor value={preview.payload} onChange={() => {}} categories={categories} disabled /></section>}</section>
    <ProcedureFeedback loading={list.loading} error={list.error} retry={list.refresh} /><div className="admin-card overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr><th className="p-4">PDF</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody>{list.data?.map(row => <tr key={row.id} className="border-t"><td className="p-4">{row.pdfFileName}</td><td>{labels[row.status]}</td><td><Button size="small" variant="outline" onClick={() => select(row.id)}>Mở bản nháp</Button></td></tr>)}</tbody></table>{list.data?.length === 0 && <p className="p-5">Chưa có bản nháp trên trang này.</p>}</div><div className="flex items-center gap-3"><Button variant="outline" disabled={page === 1 || list.loading} onClick={() => setPage(value => value - 1)}>Trước</Button><span>Trang {page}</span><Button variant="outline" disabled={list.loading || (list.data?.length ?? 0) < 10} onClick={() => setPage(value => value + 1)}>Sau</Button><Button variant="ghost" onClick={list.refresh}>Tải lại danh sách</Button></div></> : <>
      <Button variant="outline" disabled={busy || dirty} onClick={() => select()}>Về danh sách bản nháp</Button>{dirty && <p className="text-sm text-amber-900">Có thay đổi chưa lưu. Hãy lưu trước khi rời bản nháp.</p>}<ProcedureFeedback loading={loading} />{!draft && !loading && <Button variant="outline" onClick={() => setReload(v => v + 1)}>Tải lại bản nháp</Button>}
      {draft && <><div className="admin-card space-y-3 p-5"><h2 className="font-bold">{draft.pdfFileName} · {labels[draft.status]}</h2>{draft.warnings.map((text, i) => <p key={i} className="text-sm text-amber-900">{text}</p>)}{draft.failureCode && <p>Không đọc được PDF. Bạn có thể nhập tay hoặc thử đọc lại.</p>}<p className="text-sm text-slate-600">Đối soát mọi nội dung trước khi xuất bản. Các lưu ý chung chưa có trường lưu riêng; giữ PDF gốc và báo bổ sung hợp đồng khi nội dung chưa biểu diễn đầy đủ.</p></div>
      <div className="grid items-start gap-5 xl:grid-cols-2"><PdfSource key={draft.id} id={draft.id} draft /><div className="admin-card min-w-0 space-y-5 p-5"><ProcedureApiEditor value={payload} onChange={next => { setPayload(next); setDirty(true); setConfirmed(false); }} categories={categories} disabled={!editable || busy} />{editable && <div className="sticky bottom-2 z-20 space-y-3 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur-sm"><label className="flex items-center gap-3 text-sm font-medium"><input type="checkbox" checked={confirmed} disabled={busy} onChange={e => setConfirmed(e.target.checked)} />Tôi đã đối soát nội dung với PDF gốc và xác nhận đủ thông tin để xuất bản.</label><div className="flex flex-wrap gap-3"><Button variant="outline" loading={busy} onClick={() => void run(async () => { const next = await procedureApi.saveDraft(draft.id, draft.revision, payload); setDraft(next); setPayload(next.payload); setDirty(false); toast.success('Đã lưu bản nháp.'); })}>Lưu bản nháp</Button><Button disabled={!confirmed || busy} onClick={() => void run(async () => {
        validateProcedure(payload);
        const saved = await procedureApi.saveDraft(draft.id, draft.revision, payload);
        setDraft(saved); setPayload(saved.payload); setDirty(false);
        try { await procedureApi.publishDraft(saved.id, saved.revision); }
        catch (e) { const latest = await procedureApi.draft(saved.id).catch(() => undefined); if (latest?.status !== 'Published') throw e; }
        toast.success('Đã xuất bản thủ tục.'); setReload(v => v + 1); onPublished();
      })}>Xác nhận xuất bản</Button>{draft.status === 'Failed' && <Button disabled={busy || dirty} variant="outline" onClick={() => void run(async () => { await procedureApi.retryDraft(draft.id, draft.revision); setReload(v => v + 1); })}>Thử đọc lại PDF</Button>}</div></div>}{error && <p className="text-sm">Nếu dữ liệu đã thay đổi, giữ nội dung đang nhập để đối chiếu. Tải lại sẽ bỏ phần chưa lưu.</p>}<Button variant="ghost" disabled={busy || dirty} onClick={() => setReload(v => v + 1)}>Tải trạng thái mới nhất</Button>{dirty && <Button variant="ghost" disabled={busy} onClick={() => { setPayload(draft.payload); setDirty(false); setConfirmed(false); }}>Bỏ các thay đổi chưa lưu</Button>}</div></div><details className="admin-card p-5"><summary className="cursor-pointer font-semibold">Văn bản trích xuất</summary><pre className="mt-4 whitespace-pre-wrap break-words text-sm">{draft.extractedText || 'Chưa có văn bản trích xuất.'}</pre></details></>}
    </>}
  </div>;
}
