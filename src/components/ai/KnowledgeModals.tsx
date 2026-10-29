import { useEffect, useId, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { Badge, Button, Input, Modal, toast } from '@/components/ui';
import {
  aiError,
  aiErrorCode,
  knowledgeApi,
  KNOWLEDGE_PDF_MAX_BYTES,
  type KnowledgeDocumentSummary,
  type ProcedureSyncAllResult,
} from '@/lib/api/aiOcr';
import { procedureApi } from '@/lib/api/procedures';
import { useKnowledgeChunks, useKnowledgeDocument, useKnowledgeMutation } from '@/hooks/useAiKnowledge';

export const sourceTypeLabels: Record<string, string> = {
  PROCEDURE: 'Thủ tục (đồng bộ)',
  MANUAL_TEXT: 'Văn bản',
  FAQ: 'Hỏi đáp (FAQ)',
  PDF_FILE: 'PDF',
};

export const statusLabels: Record<string, { label: string; variant: 'neutral' | 'info' | 'success' | 'warning' | 'danger' }> = {
  CHUNKED: { label: 'Chờ tạo vector', variant: 'warning' },
  EMBEDDED: { label: 'Sẵn sàng tìm kiếm', variant: 'success' },
  EMBEDDING_FAILED: { label: 'Lỗi tạo vector', variant: 'danger' },
};

export function formatDateTime(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });
}

const fieldClass =
  'w-full rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-800 focus:border-red-600 focus:outline-none focus:ring-3 focus:ring-red-100 disabled:opacity-50';

function FormError({ message, onReload }: { message: string; onReload?: () => void }) {
  if (!message) return null;
  return (
    <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
      <p>{message}</p>
      {onReload && (
        <Button variant="outline" size="small" className="mt-2" onClick={onReload}>Tải bản mới nhất</Button>
      )}
    </div>
  );
}

/** Chỉ liệt kê thủ tục đang áp dụng (API công khai), khớp điều kiện BE cho procedureId. */
export function ProcedurePicker({ value, onChange, disabled, label = 'Gắn với thủ tục (tùy chọn)', required = false }: {
  value: string;
  onChange: (id: string) => void;
  disabled?: boolean;
  label?: string;
  required?: boolean;
}) {
  const id = useId();
  const [keyword, setKeyword] = useState('');
  const [debounced, setDebounced] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(keyword.trim()), 400);
    return () => clearTimeout(timer);
  }, [keyword]);
  const procedures = useQuery({
    queryKey: ['ai-knowledge-procedure-picker', debounced],
    queryFn: ({ signal }) => procedureApi.list({ keyword: debounced || undefined, pageNumber: 1, pageSize: 20 }, false, signal),
  });
  return (
    <div className="grid gap-2">
      <label htmlFor={id} className="text-sm font-semibold text-slate-800">{label}{required && <span aria-hidden="true"> *</span>}</label>
      <input
        type="search"
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        disabled={disabled}
        placeholder="Tìm theo tên thủ tục"
        aria-label="Tìm thủ tục"
        className={fieldClass}
      />
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} className={fieldClass}>
        <option value="">{required ? '— Chọn thủ tục —' : '— Không gắn thủ tục —'}</option>
        {procedures.data?.items.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
      </select>
      {procedures.isError && <p role="alert" className="text-xs text-red-700">Không tải được danh sách thủ tục.</p>}
    </div>
  );
}

const textSchema = z.object({
  sourceType: z.enum(['MANUAL_TEXT', 'FAQ']),
  title: z.string().trim().min(3, 'Tiêu đề cần từ 3 ký tự.').max(500, 'Tiêu đề tối đa 500 ký tự.'),
  content: z.string().trim().min(20, 'Nội dung cần ít nhất 20 ký tự.').max(200000, 'Nội dung tối đa 200.000 ký tự.'),
  procedureId: z.string(),
});
type TextForm = z.infer<typeof textSchema>;

export function KnowledgeCreateTextModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const formId = useId();
  const [error, setError] = useState('');
  const form = useForm<TextForm>({ resolver: zodResolver(textSchema), defaultValues: { sourceType: 'MANUAL_TEXT', title: '', content: '', procedureId: '' } });
  const create = useKnowledgeMutation(knowledgeApi.createText);
  const busy = create.isPending;
  const sourceType = form.watch('sourceType');

  useEffect(() => {
    if (open) {
      form.reset({ sourceType: 'MANUAL_TEXT', title: '', content: '', procedureId: '' });
      setError('');
    }
  }, [open, form]);

  const submit = form.handleSubmit(async (values) => {
    setError('');
    try {
      await create.mutateAsync({ ...values, title: values.title.trim(), procedureId: values.procedureId || null });
      toast.success('Đã thêm tài liệu vào kho kiến thức.');
      onOpenChange(false);
    } catch (err) {
      setError(aiError(err));
    }
  });
  const { errors } = form.formState;

  return (
    <Modal
      open={open}
      onOpenChange={(next) => !busy && onOpenChange(next)}
      title="Thêm văn bản hoặc hỏi đáp"
      description="Nội dung được chia thành các đoạn để trợ lý AI đọc. Bạn chịu trách nhiệm về tính chính xác của nguồn nhập tay."
      className="sm:max-w-2xl"
      footer={
        <>
          <Button variant="outline" disabled={busy} onClick={() => onOpenChange(false)}>Hủy</Button>
          <Button type="submit" form={formId} loading={busy}>Lưu tài liệu</Button>
        </>
      }
    >
      <form id={formId} noValidate onSubmit={(e) => void submit(e)} className="grid gap-4">
        <fieldset className="grid gap-2" disabled={busy}>
          <legend className="text-sm font-semibold text-slate-800">Loại nguồn</legend>
          <div className="flex flex-wrap gap-4 text-sm">
            <label className="flex items-center gap-2"><input type="radio" value="MANUAL_TEXT" {...form.register('sourceType')} /> Văn bản</label>
            <label className="flex items-center gap-2"><input type="radio" value="FAQ" {...form.register('sourceType')} /> Hỏi đáp (FAQ)</label>
          </div>
        </fieldset>
        <Input label="Tiêu đề" required maxLength={500} disabled={busy} error={errors.title?.message} {...form.register('title')} />
        <div className="grid gap-2">
          <label htmlFor={`${formId}-content`} className="text-sm font-semibold text-slate-800">Nội dung <span aria-hidden="true">*</span></label>
          <textarea
            id={`${formId}-content`}
            rows={10}
            disabled={busy}
            aria-invalid={Boolean(errors.content)}
            aria-describedby={`${formId}-content-hint`}
            placeholder={sourceType === 'FAQ' ? 'Hỏi: Cần mang gì?\nĐáp: Mang tờ khai và giấy chứng sinh.\n\nHỏi: Mất bao lâu?\nĐáp: Trong ngày làm việc.' : 'Nhập nội dung hướng dẫn. Dòng tiêu đề mục có thể bắt đầu bằng # hoặc kết thúc bằng dấu hai chấm.'}
            {...form.register('content')}
            className={fieldClass}
          />
          <p id={`${formId}-content-hint`} className="text-xs text-slate-500">
            {sourceType === 'FAQ' ? 'Mỗi cặp “Hỏi: … / Đáp: …” cách nhau một dòng trống.' : 'Từ 20 đến 200.000 ký tự.'}
          </p>
          {errors.content && <p role="alert" className="text-xs font-medium text-red-700">{errors.content.message}</p>}
        </div>
        <ProcedurePicker value={form.watch('procedureId')} onChange={(id) => form.setValue('procedureId', id)} disabled={busy} />
        <FormError message={error} />
      </form>
    </Modal>
  );
}

const editSchema = z.object({
  title: z.string().trim().min(3, 'Tiêu đề cần từ 3 ký tự.').max(500, 'Tiêu đề tối đa 500 ký tự.'),
  content: z.string(),
});

export function KnowledgeEditModal({ documentId, onClose }: { documentId: string | null; onClose: () => void }) {
  const formId = useId();
  const detail = useKnowledgeDocument(documentId ?? undefined);
  const update = useKnowledgeMutation(({ id, input }: { id: string; input: Parameters<typeof knowledgeApi.update>[1] }) => knowledgeApi.update(id, input));
  const [error, setError] = useState('');
  const [conflict, setConflict] = useState(false);
  // Revision of the version shown in the form; refetches after a failed save must not overwrite the user's edits.
  const [revision, setRevision] = useState<string | null>(null);
  const form = useForm<z.infer<typeof editSchema>>({ resolver: zodResolver(editSchema), defaultValues: { title: '', content: '' } });
  const doc = detail.data;
  const contentEditable = doc?.sourceType === 'MANUAL_TEXT' || doc?.sourceType === 'FAQ';
  const busy = update.isPending;

  useEffect(() => {
    if (!documentId) { setRevision(null); setError(''); setConflict(false); }
  }, [documentId]);
  useEffect(() => {
    // Wait for the fresh read so expectedRevision is not taken from an older cached copy.
    if (doc && revision === null && !detail.isFetching) {
      form.reset({ title: doc.title, content: doc.content });
      setRevision(doc.revision);
    }
  }, [doc, revision, form, detail.isFetching]);

  const reload = async () => {
    const fresh = await detail.refetch();
    if (fresh.data) {
      form.reset({ title: fresh.data.title, content: fresh.data.content });
      setRevision(fresh.data.revision);
      setError('');
      setConflict(false);
    }
  };

  const submit = form.handleSubmit(async (values) => {
    if (!doc || !revision) return;
    const content = values.content.trim();
    if (contentEditable && (content.length < 20 || content.length > 200000)) {
      form.setError('content', { message: 'Nội dung cần từ 20 đến 200.000 ký tự.' });
      return;
    }
    setError('');
    setConflict(false);
    try {
      await update.mutateAsync({
        id: doc.id,
        input: { expectedRevision: revision, title: values.title.trim(), content: contentEditable && content !== doc.content.trim() ? content : null },
      });
      toast.success('Đã lưu thay đổi.');
      onClose();
    } catch (err) {
      setConflict(aiErrorCode(err) === 'knowledge.revision_conflict');
      setError(aiError(err));
    }
  });
  const { errors } = form.formState;

  return (
    <Modal
      open={!!documentId}
      onOpenChange={(next) => !next && !busy && onClose()}
      title="Sửa tài liệu"
      description={doc?.sourceType === 'PDF_FILE' ? 'Tài liệu PDF chỉ đổi được tiêu đề. Muốn đổi nội dung, hãy tải PDF mới.' : 'Đổi nội dung sẽ chia đoạn lại và tạo lại vector.'}
      className="sm:max-w-2xl"
      footer={
        <>
          <Button variant="outline" disabled={busy} onClick={onClose}>Hủy</Button>
          <Button type="submit" form={formId} loading={busy} disabled={!doc || !revision}>Lưu thay đổi</Button>
        </>
      }
    >
      {detail.isPending ? (
        <p role="status" className="text-sm text-slate-600">Đang tải tài liệu…</p>
      ) : detail.isError && !doc ? (
        <FormError message={aiError(detail.error)} />
      ) : (
        <form id={formId} noValidate onSubmit={(e) => void submit(e)} className="grid gap-4">
          <Input label="Tiêu đề" required maxLength={500} disabled={busy} error={errors.title?.message} {...form.register('title')} />
          {contentEditable && (
            <div className="grid gap-2">
              <label htmlFor={`${formId}-content`} className="text-sm font-semibold text-slate-800">Nội dung</label>
              <textarea id={`${formId}-content`} rows={12} disabled={busy} aria-invalid={Boolean(errors.content)} {...form.register('content')} className={fieldClass} />
              {errors.content && <p role="alert" className="text-xs font-medium text-red-700">{errors.content.message}</p>}
            </div>
          )}
          <FormError message={error} onReload={conflict ? () => void reload() : undefined} />
        </form>
      )}
    </Modal>
  );
}

export function KnowledgePdfModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const formId = useId();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [procedureId, setProcedureId] = useState('');
  const [fileError, setFileError] = useState('');
  const [error, setError] = useState('');
  const upload = useKnowledgeMutation(knowledgeApi.uploadPdf);
  const busy = upload.isPending;

  useEffect(() => {
    if (open) { setFile(null); setTitle(''); setProcedureId(''); setFileError(''); setError(''); }
  }, [open]);

  const pickFile = (next: File | null) => {
    setError('');
    if (next && (!next.name.toLowerCase().endsWith('.pdf') || next.size > KNOWLEDGE_PDF_MAX_BYTES)) {
      setFile(null);
      setFileError('Chỉ nhận file PDF tối đa 10 MB.');
      return;
    }
    setFileError('');
    setFile(next);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!file) { setFileError('Chọn file PDF cần tải lên.'); return; }
    if (title.trim() && (title.trim().length < 3 || title.trim().length > 500)) { setError('Tiêu đề cần từ 3 đến 500 ký tự.'); return; }
    setError('');
    try {
      const doc = await upload.mutateAsync({ file, title, procedureId: procedureId || null });
      if (doc.warnings?.length) {
        toast.warning(`Đã tải PDF, nhưng có trang không đọc được chữ: ${doc.warnings.join('; ')}`);
      } else {
        toast.success('Đã tải PDF vào kho kiến thức.');
      }
      onOpenChange(false);
    } catch (err) {
      setError(aiError(err));
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={(next) => !busy && onOpenChange(next)}
      title="Tải PDF vào kho kiến thức"
      description="Chỉ đọc lớp chữ của PDF (1–100 trang, tối đa 10 MB). PDF scan chỉ có ảnh sẽ bị từ chối. Hệ thống không lưu file gốc."
      footer={
        <>
          <Button variant="outline" disabled={busy} onClick={() => onOpenChange(false)}>Hủy</Button>
          <Button type="submit" form={formId} loading={busy}>Tải lên</Button>
        </>
      }
    >
      <form id={formId} noValidate onSubmit={(e) => void submit(e)} className="grid gap-4">
        <div className="grid gap-2">
          <label htmlFor={`${formId}-file`} className="text-sm font-semibold text-slate-800">File PDF <span aria-hidden="true">*</span></label>
          <input id={`${formId}-file`} type="file" accept="application/pdf,.pdf" disabled={busy} onChange={(e) => pickFile(e.target.files?.[0] ?? null)} className="text-sm" aria-invalid={Boolean(fileError)} />
          {fileError && <p role="alert" className="text-xs font-medium text-red-700">{fileError}</p>}
        </div>
        <Input label="Tiêu đề (mặc định là tên file)" maxLength={500} disabled={busy} value={title} onChange={(e) => setTitle(e.target.value)} />
        <ProcedurePicker value={procedureId} onChange={setProcedureId} disabled={busy} />
        <FormError message={error} />
      </form>
    </Modal>
  );
}

export function KnowledgeDetailModal({ documentId, onClose }: { documentId: string | null; onClose: () => void }) {
  const [tab, setTab] = useState<'content' | 'chunks'>('content');
  const [chunkPage, setChunkPage] = useState(1);
  const detail = useKnowledgeDocument(documentId ?? undefined);
  const chunks = useKnowledgeChunks(tab === 'chunks' ? documentId ?? undefined : undefined, chunkPage);
  const doc = detail.data;
  const totalChunkPages = chunks.data ? Math.max(1, Math.ceil(chunks.data.totalCount / chunks.data.pageSize)) : 1;

  useEffect(() => { setTab('content'); setChunkPage(1); }, [documentId]);

  return (
    <Modal open={!!documentId} onOpenChange={(next) => !next && onClose()} title={doc?.title ?? 'Chi tiết tài liệu'} className="sm:max-w-3xl">
      {detail.isPending ? (
        <p role="status" className="text-sm text-slate-600">Đang tải tài liệu…</p>
      ) : detail.isError || !doc ? (
        <FormError message={aiError(detail.error)} />
      ) : (
        <div className="grid gap-4 text-sm">
          <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
            <div><dt className="text-xs text-slate-500">Loại nguồn</dt><dd className="font-semibold">{sourceTypeLabels[doc.sourceType] ?? doc.sourceType}</dd></div>
            <div><dt className="text-xs text-slate-500">Trạng thái</dt><dd className="flex flex-wrap gap-2"><Badge variant={statusLabels[doc.status]?.variant ?? 'neutral'}>{statusLabels[doc.status]?.label ?? doc.status}</Badge><Badge variant={doc.isActive ? 'success' : 'neutral'}>{doc.isActive ? 'Đang dùng' : 'Ngừng dùng'}</Badge></dd></div>
            <div><dt className="text-xs text-slate-500">Số đoạn</dt><dd className="font-semibold">{doc.chunkCount}</dd></div>
            <div><dt className="text-xs text-slate-500">Cập nhật</dt><dd className="font-semibold">{formatDateTime(doc.updatedAt)}</dd></div>
            {doc.sourceReference && <div className="sm:col-span-2"><dt className="text-xs text-slate-500">Nguồn</dt><dd className="break-all">{doc.sourceReference}</dd></div>}
            {doc.embeddedAt && <div><dt className="text-xs text-slate-500">Tạo vector lúc</dt><dd>{formatDateTime(doc.embeddedAt)}</dd></div>}
          </dl>
          {doc.warnings && doc.warnings.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-900">
              <p className="font-semibold">Cảnh báo khi đọc PDF</p>
              <ul className="mt-1 list-disc pl-5">{doc.warnings.map((w) => <li key={w}>{w}</li>)}</ul>
            </div>
          )}
          {doc.status === 'EMBEDDING_FAILED' && (
            <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-red-800">
              <p className="font-semibold">Tạo vector chưa thành công{doc.embeddingError ? ` (${doc.embeddingError})` : ''}.</p>
              <p className="mt-1">Đã thử {doc.embeddingAttempts ?? 0} lần{doc.nextEmbeddingAt ? `, lần thử tiếp theo lúc ${formatDateTime(doc.nextEmbeddingAt)}` : ''}. Có thể dùng “Tạo lại vector” để thử lại ngay.</p>
            </div>
          )}
          <div role="tablist" aria-label="Nội dung tài liệu" className="flex gap-2 border-b border-slate-200">
            {([['content', 'Nội dung'], ['chunks', 'Các đoạn trợ lý đọc được']] as const).map(([id, label]) => (
              <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id)}
                className={`-mb-px border-b-2 px-3 py-2 text-sm font-semibold ${tab === id ? 'border-red-700 text-red-800' : 'border-transparent text-slate-600 hover:text-red-800'}`}>
                {label}
              </button>
            ))}
          </div>
          {tab === 'content' ? (
            <pre className="max-h-[50vh] overflow-auto whitespace-pre-wrap break-words rounded-xl bg-slate-50 p-4 font-sans text-sm text-slate-800">{doc.content}</pre>
          ) : chunks.isPending ? (
            <p role="status" className="text-sm text-slate-600">Đang tải các đoạn…</p>
          ) : chunks.isError ? (
            <FormError message={aiError(chunks.error)} />
          ) : (
            <div className="grid gap-3">
              <ol className="grid gap-3">
                {chunks.data.items.map((chunk) => (
                  <li key={chunk.id} className="rounded-xl border border-slate-200 p-3">
                    <p className="text-xs font-semibold text-slate-500">Đoạn {chunk.chunkIndex + 1}{chunk.heading ? ` · ${chunk.heading}` : ''} · {chunk.charCount} ký tự</p>
                    <p className="mt-1 whitespace-pre-wrap break-words text-slate-800">{chunk.content}</p>
                  </li>
                ))}
              </ol>
              {totalChunkPages > 1 && (
                <div className="flex items-center justify-end gap-2">
                  <Button variant="outline" size="small" disabled={chunkPage <= 1} onClick={() => setChunkPage((p) => p - 1)}>Trang trước</Button>
                  <span className="text-xs text-slate-600">Trang {chunkPage}/{totalChunkPages}</span>
                  <Button variant="outline" size="small" disabled={chunkPage >= totalChunkPages} onClick={() => setChunkPage((p) => p + 1)}>Trang sau</Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

export type KnowledgeAction = 'activate' | 'deactivate' | 'rechunk' | 'reindex';
const actionCopy: Record<KnowledgeAction, { title: string; description: string; confirm: string; done: string }> = {
  deactivate: { title: 'Ngừng dùng tài liệu', description: 'Trợ lý AI sẽ không dùng tài liệu này nữa. Tài liệu vẫn được giữ lại và có thể dùng lại sau (không có xóa hẳn).', confirm: 'Ngừng dùng', done: 'Đã ngừng dùng tài liệu.' },
  activate: { title: 'Dùng lại tài liệu', description: 'Tài liệu sẽ được đưa lại vào kho để trợ lý AI sử dụng.', confirm: 'Dùng lại', done: 'Đã bật lại tài liệu.' },
  rechunk: { title: 'Chia đoạn lại', description: 'Chia lại nội dung đang lưu theo quy tắc chia đoạn hiện tại. Vector cũ sẽ được tạo lại.', confirm: 'Chia đoạn lại', done: 'Đã chia đoạn lại.' },
  reindex: { title: 'Tạo lại vector', description: 'Xóa vector hiện có và đưa tài liệu vào hàng chờ tạo lại, kể cả khi đã hết lượt thử. Việc tạo vector có tính phí.', confirm: 'Tạo lại vector', done: 'Đã đưa tài liệu vào hàng chờ tạo vector.' },
};

export function KnowledgeActionModal({ target, onClose }: { target: { action: KnowledgeAction; doc: KnowledgeDocumentSummary } | null; onClose: () => void }) {
  const [error, setError] = useState('');
  const run = useKnowledgeMutation(async ({ action, doc }: { action: KnowledgeAction; doc: KnowledgeDocumentSummary }) => {
    if (action === 'activate' || action === 'deactivate') return knowledgeApi.setActive(doc.id, { expectedRevision: doc.revision, isActive: action === 'activate' });
    return action === 'rechunk' ? knowledgeApi.rechunk(doc.id, doc.revision) : knowledgeApi.reindex(doc.id, doc.revision);
  });
  const busy = run.isPending;
  useEffect(() => { if (target) setError(''); }, [target]);
  if (!target) return null;
  const copy = actionCopy[target.action];

  const confirm = async () => {
    setError('');
    try {
      await run.mutateAsync(target);
      toast.success(copy.done);
      onClose();
    } catch (err) {
      const code = aiErrorCode(err);
      if (code === 'knowledge.no_change') { toast.info(aiError(err)); onClose(); return; }
      setError(code === 'knowledge.revision_conflict'
        ? 'Tài liệu vừa được người khác cập nhật. Danh sách đã được tải lại; hãy kiểm tra rồi thực hiện lại.'
        : aiError(err));
    }
  };

  return (
    <Modal
      open
      onOpenChange={(next) => !next && !busy && onClose()}
      title={copy.title}
      description={copy.description}
      footer={
        <>
          <Button variant="outline" disabled={busy} onClick={onClose}>Hủy</Button>
          <Button loading={busy} onClick={() => void confirm()}>{copy.confirm}</Button>
        </>
      }
    >
      <p className="text-sm text-slate-700">Tài liệu: <strong>{target.doc.title}</strong></p>
      <div className="mt-3"><FormError message={error} /></div>
    </Modal>
  );
}

const syncOutcomeMessages = {
  CREATED: 'Đã thêm thủ tục vào kho kiến thức.',
  UPDATED: 'Nội dung thủ tục đã thay đổi; đã chia đoạn lại.',
  UNCHANGED: 'Thủ tục không có thay đổi.',
  DEACTIVATED: 'Thủ tục đã ngừng áp dụng hoặc bị xóa trong danh mục; tài liệu đã được ngừng dùng. Hệ thống không tự bật lại khi thủ tục áp dụng lại.',
} as const;

export function ProcedureSyncModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [procedureId, setProcedureId] = useState('');
  const [error, setError] = useState('');
  const sync = useKnowledgeMutation(knowledgeApi.syncProcedure);
  const busy = sync.isPending;
  useEffect(() => { if (open) { setProcedureId(''); setError(''); } }, [open]);

  const run = async () => {
    if (!procedureId) { setError('Chọn thủ tục cần đồng bộ.'); return; }
    setError('');
    try {
      const result = await sync.mutateAsync(procedureId);
      (result.outcome === 'DEACTIVATED' ? toast.warning : toast.success)(syncOutcomeMessages[result.outcome]);
      onOpenChange(false);
    } catch (err) {
      setError(aiError(err));
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={(next) => !busy && onOpenChange(next)}
      title="Đồng bộ một thủ tục"
      description="Đọc nội dung thủ tục đang áp dụng trong danh mục và cập nhật vào kho kiến thức. Tài liệu thủ tục không sửa tay được."
      footer={
        <>
          <Button variant="outline" disabled={busy} onClick={() => onOpenChange(false)}>Hủy</Button>
          <Button loading={busy} onClick={() => void run()}>Đồng bộ</Button>
        </>
      }
    >
      <div className="grid gap-3">
        <ProcedurePicker value={procedureId} onChange={setProcedureId} disabled={busy} label="Thủ tục" required />
        <FormError message={error} />
      </div>
    </Modal>
  );
}

export function SyncAllModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [result, setResult] = useState<ProcedureSyncAllResult | null>(null);
  const [error, setError] = useState('');
  const sync = useKnowledgeMutation(knowledgeApi.syncAll);
  const busy = sync.isPending;
  useEffect(() => { if (open) { setResult(null); setError(''); } }, [open]);

  const run = async () => {
    setError('');
    try {
      setResult(await sync.mutateAsync());
    } catch (err) {
      setError(aiError(err));
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={(next) => !busy && onOpenChange(next)}
      title="Đồng bộ tất cả thủ tục"
      description="Đồng bộ toàn bộ thủ tục đang áp dụng (tối đa 1.000). Việc này có thể mất vài phút; không đóng trang trong lúc chạy."
      footer={result ? (
        <Button onClick={() => onOpenChange(false)}>Đóng</Button>
      ) : (
        <>
          <Button variant="outline" disabled={busy} onClick={() => onOpenChange(false)}>Hủy</Button>
          <Button loading={busy} onClick={() => void run()}>{busy ? 'Đang đồng bộ…' : 'Bắt đầu đồng bộ'}</Button>
        </>
      )}
    >
      {result ? (
        <div className="grid gap-3 text-sm">
          <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {([['Đã quét', result.scanned], ['Thêm mới', result.created], ['Cập nhật', result.updated], ['Không đổi', result.unchanged], ['Ngừng dùng', result.deactivated], ['Lỗi', result.failed]] as const).map(([label, value]) => (
              <div key={label} className="rounded-xl bg-slate-50 p-3"><dt className="text-xs text-slate-500">{label}</dt><dd className="text-lg font-bold">{value}</dd></div>
            ))}
          </dl>
          {!result.complete && (
            <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-900">
              Danh sách thủ tục lấy về chưa đầy đủ, nên hệ thống chưa ngừng dùng tài liệu của các thủ tục đã gỡ. Hãy đồng bộ lại sau.
            </p>
          )}
          {result.failedProcedureIds.length > 0 && (
            <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-red-800">
              {result.failedProcedureIds.length} thủ tục đồng bộ lỗi và đã được bỏ qua. Hãy chạy lại sau hoặc đồng bộ từng thủ tục.
            </p>
          )}
        </div>
      ) : (
        <FormError message={error} />
      )}
    </Modal>
  );
}
