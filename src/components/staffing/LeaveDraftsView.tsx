import { lazy, Suspense, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQueryClient } from '@tanstack/react-query';
import { Button, Modal, toast } from '@/components/ui';
import { staffingApi } from '@/lib/api/staffing';
import { workScheduleApi, type LeaveCapabilities, type LeaveDraft } from '@/lib/api/workSchedules';
import { staffingError } from '@/lib/api/staffingError';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { leaveMetadataSchema, vietnamIso, vietnamLocal } from '@/lib/staffingValidation';
import { ActionForm, OperationError, Pager, QueryState, StaffPeriod, dateText, fieldClass, useStaffAccess, useStaffOperation, useStaffQuery, validatePeriod } from './shared';

const DocxEditor = lazy(() => import('@/components/documents/DocxOnlineEditor'));
const wordDialogClass = 'sm:inset-0 sm:left-0 sm:top-0 sm:max-w-none sm:w-full sm:max-h-dvh sm:translate-x-0 sm:translate-y-0';
export function WordViewer({ title, load, onClose }: { title: string; load: (signal: AbortSignal) => Promise<{ blob: Blob; fileName: string }>; onClose: () => void }) {
  const { user } = useStaffAccess();
  return <Modal open onOpenChange={v => !v && onClose()} title="Trình đọc Word" className={wordDialogClass}><Suspense fallback={<p role="status">Đang mở trình đọc Word…</p>}><DocxEditor sourceKey={title} title={title} readOnly author={user?.username || 'Cán bộ'} load={load} onClose={onClose} errorMessage={staffingError} /></Suspense></Modal>;
}
type Metadata = { startsAt: string; endsAt: string; reason: string };
const fullDayPeriod = (from: string, to: string) => ({
  startsAt: `${from}T00:00`,
  endsAt: new Date(Date.parse(`${to}T00:00:00Z`) + 86400000).toISOString().slice(0, 10) + 'T00:00',
});
const createLeaveSchema = z.object({
  range: z.enum(['single', 'multiple']), from: z.iso.date('Chọn ngày bắt đầu nghỉ.'), to: z.string(),
  reason: leaveMetadataSchema.shape.reason,
}).superRefine((v, ctx) => {
  if (v.range === 'multiple' && !z.iso.date().safeParse(v.to).success) {
    ctx.addIssue({ code: 'custom', path: ['to'], message: 'Chọn ngày kết thúc nghỉ.' }); return;
  }
  if (!z.iso.date().safeParse(v.from).success) return;
  const issue = validatePeriod(fullDayPeriod(v.from, v.range === 'single' ? v.from : v.to));
  if (issue) ctx.addIssue({ code: 'custom', path: [v.range === 'single' ? 'from' : 'to'], message: issue });
});
function CreateLeave({ capabilities, onClose, onCreated, onSubmitted }: { capabilities: LeaveCapabilities; onClose: () => void; onCreated: (id: string) => void; onSubmitted: (id: string) => void }) {
  const [word, setWord] = useState(capabilities.wordRequired || capabilities.templateConfigured);
  const operation = useStaffOperation();
  const template = useStaffQuery(['leave-template'], signal => workScheduleApi.template(signal), word && capabilities.templateConfigured);
  const request = useRef<{ body: Metadata & { templateVersionId?: string }; key: string; word: boolean } | null>(null);
  const form = useForm<z.infer<typeof createLeaveSchema>>({ resolver: zodResolver(createLeaveSchema), defaultValues: { range: 'single', from: '', to: '', reason: '' } });
  const range = form.watch('range'), from = form.watch('from'), to = range === 'single' ? from : form.watch('to');
  const days = z.iso.date().safeParse(from).success && z.iso.date().safeParse(to).success && to >= from ? Math.round((Date.parse(to + 'T00:00:00Z') - Date.parse(from + 'T00:00:00Z')) / 86400000) + 1 : 0;
  const locked = operation.busy || Boolean(request.current);
  const submit = form.handleSubmit(async values => {
    if (word && (!capabilities.templateConfigured || !template.data || template.isError)) return;
    const period = fullDayPeriod(values.from, values.range === 'single' ? values.from : values.to);
    request.current ??= { body: { startsAt: vietnamIso(period.startsAt), endsAt: vietnamIso(period.endsAt), reason: values.reason, ...(word ? { templateVersionId: template.data!.versionId } : {}) }, key: crypto.randomUUID(), word };
    const sent = request.current;
    await operation.run(async () => {
      if (sent.word) return { id: (await workScheduleApi.createDraft(sent.body as Metadata & { templateVersionId: string }, sent.key)).id, draft: true };
      // Legacy policy explicitly permits a text-only request; never use it when Word is required.
      const policy = await workScheduleApi.capabilities();
      if (policy.wordRequired) throw new Error('Đơn nghỉ cần kèm tệp Word. Vui lòng đóng biểu mẫu và tạo đơn Word.');
      return { id: (await staffingApi.requestLeave(sent.body)).id, draft: false };
    }, result => result.draft ? onCreated(result.id) : onSubmitted(result.id), sent.word);
  });
  return <Modal open title="Tạo đơn xin nghỉ" className="sm:max-w-3xl sm:rounded-2xl" description="Chọn thời gian nghỉ và lý do để tạo đơn Word." onOpenChange={v => !v && !operation.busy && onClose()} footer={<><Button variant="outline" disabled={locked} onClick={() => { form.reset(); setWord(capabilities.wordRequired || capabilities.templateConfigured); }}>Đặt lại</Button><Button disabled={operation.busy || (word && (!template.data || template.isError || !capabilities.templateConfigured)) || (!word && operation.review)} onClick={() => void submit()}>{operation.busy ? 'Đang lưu…' : request.current && operation.review && word ? 'Gửi lại cùng yêu cầu' : word ? 'Tạo nháp Word' : 'Gửi đơn không kèm Word'}</Button></>}>
    {word && !capabilities.templateConfigured && <p role="alert" className="mb-4 text-red-800">Chưa có mẫu đơn Word. Vui lòng liên hệ quản trị viên.</p>}
    {word && capabilities.templateConfigured && <QueryState query={template} />}
    <form onSubmit={e => void submit(e)} noValidate className="space-y-5"><fieldset disabled={locked} className="space-y-5">
      <fieldset className="space-y-3"><legend className="font-semibold text-slate-900">Thời gian nghỉ</legend><div className="flex flex-wrap gap-x-6 gap-y-2">{([['single', 'Nghỉ 1 ngày'], ['multiple', 'Nghỉ nhiều ngày']] as const).map(([value, label]) => <label key={value} className="flex min-h-11 cursor-pointer items-center gap-3 text-sm"><input type="radio" value={value} {...form.register('range')} className="size-4 accent-red-700" />{label}</label>)}</div></fieldset>
      <div className={`grid gap-4 ${range === 'multiple' ? 'sm:grid-cols-2' : ''}`}>
        <label className="staff-field">{range === 'single' ? 'Ngày nghỉ' : 'Từ ngày'}<input type="date" className={fieldClass} {...form.register('from')} aria-invalid={Boolean(form.formState.errors.from)} aria-describedby={form.formState.errors.from ? 'create-leave-from-error' : undefined} /></label>
        {range === 'multiple' && <label className="staff-field">Đến ngày<input type="date" className={fieldClass} {...form.register('to')} aria-invalid={Boolean(form.formState.errors.to)} aria-describedby={form.formState.errors.to ? 'create-leave-to-error' : undefined} /></label>}
      </div>
      <p className="text-xs text-slate-500">Nghỉ trọn các ngày đã chọn, theo giờ Việt Nam.</p>
      {!!days && <div role="status" className="space-y-1 rounded-xl bg-slate-50 p-3"><p className="text-sm font-semibold text-slate-900">Tổng thời gian: {days} ngày lịch</p><p className="text-xs text-slate-500">Tính cả ngày bắt đầu và kết thúc, chưa loại trừ cuối tuần hoặc ngày lễ. Không phải số ngày phép được trừ.</p></div>}
      <label className="staff-field">Lý do nghỉ<textarea rows={3} maxLength={2000} placeholder="Ví dụ: Giải quyết công việc cá nhân…" className={fieldClass} {...form.register('reason')} aria-invalid={Boolean(form.formState.errors.reason)} aria-describedby={form.formState.errors.reason ? 'create-leave-reason-error' : undefined} /></label>
      <label className="flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" checked={word} disabled={capabilities.wordRequired || locked} onChange={e => setWord(e.target.checked)} className="size-4 accent-red-700" />Soạn đơn Word trực tiếp</label>
    </fieldset>{Object.entries(form.formState.errors).map(([name, error]) => <p id={`create-leave-${name}-error`} key={name} role="alert" className="text-sm text-red-800">{error.message}</p>)}</form>
    <OperationError operation={operation} />
    {request.current && operation.error && <p className="mt-3 text-sm text-slate-600">Kiểm tra danh sách nháp/đơn nếu đóng cửa sổ này. Khi gửi lại, hệ thống dùng đúng nội dung của lần gửi trước.</p>}
  </Modal>;
}

function DraftWorkspace({ id, capabilities, onClose, onSubmitted }: { id: string; capabilities: LeaveCapabilities; onClose: () => void; onSubmitted: (id: string) => void }) {
  const { user } = useStaffAccess();
  const client = useQueryClient();
  const query = useStaffQuery(['leave-draft', id], signal => workScheduleApi.draft(id, signal));
  const [editor, setEditor] = useState(false);
  const [metadataDirty, setMetadataDirty] = useState(false);
  const [metadataReset, setMetadataReset] = useState(0);
  const [confirm, setConfirm] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [savedRevision, setSavedRevision] = useState<string>();
  const [savedMetadataVersion, setSavedMetadataVersion] = useState<number>();
  const [editorDraft, setEditorDraft] = useState<LeaveDraft>();
  const operation = useStaffOperation();
  const guard = useUnsavedChanges(metadataDirty, operation.busy || editor);
  const submitRequest = useRef<{ draft: LeaveDraft; key: string } | null>(null);
  const item = query.data;
  const update = (draft: LeaveDraft) => { client.setQueriesData({ queryKey: ['staffing', user?.id], predicate: q => q.queryKey.includes('leave-draft') && q.queryKey.includes(id) }, draft); };
  const replay = Boolean(submitRequest.current && operation.review);
  const submit = () => {
    if (!item) return;
    submitRequest.current ??= { draft: item, key: crypto.randomUUID() };
    const sent = submitRequest.current;
    void operation.run(() => workScheduleApi.submit(sent.draft, sent.key), receipt => onSubmitted(receipt.leaveId), true);
  };
  const reopen = async () => {
    const latest = await query.refetch();
    if (latest.data && !latest.isError) { operation.reset(); submitRequest.current = null; setSavedRevision(undefined); setMetadataReset(value => value + 1); }
  };
  const wordReady = Boolean(item && savedRevision && savedRevision === item.documentRevisionId && savedMetadataVersion === item.metadataVersion);
  return <Modal open title="Nháp đơn xin nghỉ" description="1. Thông tin nghỉ → 2. Soạn Word → 3. Nộp cho quản lý" className={editor ? wordDialogClass : 'sm:max-w-3xl'} onOpenChange={v => !v && guard.requestClose(onClose)}>
    <QueryState query={query} />
    {!query.isError && item && <div className="space-y-4">
      {item.submittedLeaveId ? <><StaffPeriod start={item.startsAtUtc} end={item.endsAtUtc} /><p>{item.reason}</p><p role="status">Nháp đã được nộp.</p><Button onClick={() => onSubmitted(item.submittedLeaveId!)}>Xem đơn đã nộp</Button></> : <>
        <section aria-label="Bước 1: Thông tin nghỉ" className="space-y-3 rounded-xl border border-slate-200 p-4">
          <h3 className="font-bold text-slate-900">1. Thông tin nghỉ</h3>
          <p className="text-sm text-slate-600">Bạn có thể sửa ngày giờ và lý do ngay bên dưới khi đơn chưa nộp. Thời gian này được dùng để tính lịch nghỉ.</p>
          <fieldset disabled={operation.busy || operation.review || query.isFetching}>
            <ActionForm inline key={`${item.metadataVersion}-${metadataReset}`} title="Thông tin nghỉ" onDirtyChange={setMetadataDirty} fields={[{ name: 'startsAt', label: 'Bắt đầu nghỉ (giờ Việt Nam)', type: 'datetime-local' }, { name: 'endsAt', label: 'Kết thúc nghỉ (giờ Việt Nam)', type: 'datetime-local' }, { name: 'reason', label: 'Lý do ngắn', type: 'textarea' }]} defaultValues={{ startsAt: vietnamLocal(item.startsAtUtc), endsAt: vietnamLocal(item.endsAtUtc), reason: item.reason }} validate={v => validatePeriod(v)} submit={async v => { const latest = await workScheduleApi.draft(id); if (latest.version !== item.version) throw new Error('Nháp đã thay đổi. Đọc lại trạng thái trước khi sửa.'); update(await workScheduleApi.editDraft(id, { startsAt: vietnamIso(v.startsAt), endsAt: vietnamIso(v.endsAt), reason: v.reason, expectedVersion: item.version })); setSavedRevision(undefined); }} onClose={() => {}} />
          </fieldset>
        </section>
        <section aria-label="Bước 2: Soạn Word" className="space-y-3 rounded-xl border border-slate-200 p-4">
          <h3 className="font-bold text-slate-900">2. Soạn Word</h3>
          <p className="text-sm text-slate-600">Kiểm tra nội dung Word khớp với ngày giờ ở bước 1, rồi bấm <strong>Lưu và đóng</strong>. Đơn chưa được gửi ở bước này.</p>
          <Button disabled={metadataDirty || operation.busy || operation.review || query.isFetching} onClick={() => { setEditorDraft(item); setSaveError(''); setEditor(true); }}>Soạn / mở lại Word</Button>
          {wordReady && !metadataDirty && <p role="status" className="text-sm font-medium text-emerald-800">Word đã lưu. Bạn có thể nộp đơn ở bước 3.</p>}
        </section>
        <section aria-label="Bước 3: Nộp đơn" className="space-y-3 rounded-xl border border-slate-200 p-4">
          <h3 className="font-bold text-slate-900">3. Nộp đơn</h3>
          <p className="text-sm text-slate-600">Bấm một lần để gửi bản Word đã lưu cho quản lý. Sau khi nộp, bạn không thể sửa đơn.</p>
          {!wordReady && <p className="text-sm text-amber-900">Hoàn tất và lưu Word ở bước 2 để mở nút nộp.</p>}
          <Button disabled={metadataDirty || operation.busy || query.isFetching || (operation.review && !replay) || (!replay && !wordReady)} onClick={submit}>{operation.busy ? 'Đang nộp…' : replay ? 'Kiểm tra / gửi lại lần nộp trước' : 'Nộp cho quản lý'}</Button>
        </section>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-3"><p className="text-xs text-slate-500">Lưu lần cuối: {dateText(item.updatedAtUtc)}</p><div className="flex gap-2"><Button size="small" variant="ghost" disabled={operation.busy || query.isFetching} onClick={() => guard.requestClose(() => void reopen())}>Đọc lại trạng thái</Button><Button size="small" variant="ghost" disabled={operation.busy || operation.review || query.isFetching || metadataDirty} onClick={() => setConfirm(true)}>Xóa nháp</Button></div></div>
      </>}
      <OperationError operation={operation} />{saveError && <p role="alert" className="text-sm text-red-800">{saveError}</p>}
    </div>}
    {editor && editorDraft && <Suspense fallback={<p role="status">Đang mở trình soạn Word…</p>}><DocxEditor sourceKey={`leave-${id}`} title="Đơn xin nghỉ" author={user?.username || 'Cán bộ'} subtitle="Bấm Lưu và đóng khi soạn xong, sau đó nộp đơn cho quản lý ở bước 3" saveLabel="Lưu nháp Word" savedLabel="Đã lưu nháp, chưa nộp" saveAndCloseLabel="Lưu và đóng" errorMessage={staffingError}
      referenceData={[{ label: 'Bắt đầu nghỉ', value: dateText(editorDraft.startsAtUtc) }, { label: 'Kết thúc nghỉ', value: dateText(editorDraft.endsAtUtc) }, { label: 'Lý do ngắn', value: editorDraft.reason }]}
      load={async signal => { const latest = await workScheduleApi.draft(id, signal); if (latest.version !== editorDraft.version || latest.submittedLeaveId) throw new Error('Nháp đã thay đổi. Quay lại và đọc lại trạng thái trước khi soạn.'); return workScheduleApi.draftDocx(id, signal); }}
      onSave={async file => {
        try { const result = await workScheduleApi.saveDocx(editorDraft, file, capabilities.maxDocxBytes); update(result); setEditorDraft(result); setSavedRevision(result.documentRevisionId ?? undefined); setSavedMetadataVersion(result.metadataVersion); setSaveError(''); toast.success('Đã lưu nháp Word. Bạn chưa nộp đơn.'); }
        catch (error) { setSavedRevision(undefined); setSaveError(staffingError(error)); throw error; }
      }} onClose={() => { setEditor(false); void query.refetch(); }} /></Suspense>}
    {guard.confirmation}
    {confirm && item && <Modal open title="Xóa nháp đơn nghỉ?" onOpenChange={v => !v && !operation.busy && setConfirm(false)} footer={<><Button variant="outline" disabled={operation.busy} onClick={() => setConfirm(false)}>Quay lại</Button><Button disabled={operation.busy} onClick={() => void operation.run(() => workScheduleApi.deleteDraft(id, item.version), onClose)}>{operation.busy ? 'Đang xử lý…' : 'Xóa nháp'}</Button></>}><p>Nháp chưa nộp và nội dung Word riêng sẽ không còn trong danh sách.</p><OperationError operation={operation} /></Modal>}
  </Modal>;
}

export function LeaveDraftsView({ capabilities, createOpen, onCreateClose, onSubmitted }: { capabilities: LeaveCapabilities; createOpen: boolean; onCreateClose: () => void; onSubmitted: (id: string) => void }) {
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string>();
  const [templateOpen, setTemplateOpen] = useState(false);
  const template = useStaffQuery(['leave-template'], signal => workScheduleApi.template(signal), templateOpen);
  const query = useStaffQuery(['leave-drafts', page], signal => workScheduleApi.drafts(page, signal));
  return <div className="space-y-4"><div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-slate-600">Các đơn đang soạn chưa được gửi cho quản lý.</p><div className="staff-actions"><Button size="small" variant="outline" disabled={!capabilities.templateConfigured} onClick={() => setTemplateOpen(true)}>Xem mẫu đơn nghỉ phép</Button><Button size="small" variant="outline" disabled={query.isFetching} onClick={() => void query.refetch()}>Tải lại danh sách</Button></div></div>
    <QueryState query={query} />
    {query.isSuccess && !query.data.items.length && <div role="status" className="staff-state"><p className="font-semibold text-slate-800">Bạn chưa có đơn đang soạn</p><p>Bấm Tạo đơn nghỉ phép ở đầu trang để chọn thời gian nghỉ và bắt đầu viết đơn.</p></div>}
    {!query.isError && <div className="staff-grid">{query.data?.items.map(item => <article key={item.id} className="staff-card"><div className="staff-card-heading"><h3>Đơn nghỉ phép đang soạn</h3><span className="staff-meta">Chưa gửi</span></div><StaffPeriod start={item.startsAtUtc} end={item.endsAtUtc} /><p className="staff-note">{item.reason}</p><div className="staff-card-footer"><Button onClick={() => setSelected(item.id)}>Tiếp tục soạn đơn</Button></div></article>)}</div>}
    {query.data && (page > 1 || query.data.total > query.data.pageSize) && <Pager page={page} total={query.data.total} setPage={setPage} pageSize={query.data.pageSize} />}
    {createOpen && <CreateLeave capabilities={capabilities} onClose={onCreateClose} onCreated={id => { onCreateClose(); setSelected(id); }} onSubmitted={id => { onCreateClose(); onSubmitted(id); }} />}
    {selected && <DraftWorkspace key={selected} id={selected} capabilities={capabilities} onClose={() => setSelected(undefined)} onSubmitted={id => { setSelected(undefined); onSubmitted(id); }} />}
    {templateOpen && <Modal open title="Mẫu đơn nghỉ chung" onOpenChange={v => !v && setTemplateOpen(false)}><QueryState query={template} />{!template.isError && template.data && <WordViewer title="Mẫu đơn nghỉ chung — chỉ xem" load={signal => workScheduleApi.templateDocx(template.data.versionId, template.data.sha256, signal)} onClose={() => setTemplateOpen(false)} />}</Modal>}
  </div>;
}
