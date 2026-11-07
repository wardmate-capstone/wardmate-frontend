import { lazy, Suspense, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
function CreateLeave({ capabilities, onClose, onCreated, onSubmitted }: { capabilities: LeaveCapabilities; onClose: () => void; onCreated: (id: string) => void; onSubmitted: (id: string) => void }) {
  const [word, setWord] = useState(capabilities.wordRequired || capabilities.templateConfigured);
  const operation = useStaffOperation();
  const template = useStaffQuery(['leave-template'], signal => workScheduleApi.template(signal), word && capabilities.templateConfigured);
  const request = useRef<{ body: Metadata & { templateVersionId?: string }; key: string; word: boolean } | null>(null);
  const form = useForm<Metadata>({ resolver: zodResolver(leaveMetadataSchema), defaultValues: { startsAt: '', endsAt: '', reason: '' } });
  const locked = operation.busy || Boolean(request.current);
  const submit = form.handleSubmit(async values => {
    if (word && (!capabilities.templateConfigured || !template.data || template.isError)) return;
    request.current ??= { body: { startsAt: vietnamIso(values.startsAt), endsAt: vietnamIso(values.endsAt), reason: values.reason, ...(word ? { templateVersionId: template.data!.versionId } : {}) }, key: crypto.randomUUID(), word };
    const sent = request.current;
    await operation.run(async () => {
      if (sent.word) return { id: (await workScheduleApi.createDraft(sent.body as Metadata & { templateVersionId: string }, sent.key)).id, draft: true };
      // Legacy policy explicitly permits a text-only request; never use it when Word is required.
      const policy = await workScheduleApi.capabilities();
      if (policy.wordRequired) throw new Error('Đơn nghỉ cần kèm tệp Word. Vui lòng đóng biểu mẫu và tạo đơn Word.');
      return { id: (await staffingApi.requestLeave(sent.body)).id, draft: false };
    }, result => result.draft ? onCreated(result.id) : onSubmitted(result.id), sent.word);
  });
  return <Modal open title="Tạo đơn xin nghỉ" description="Chọn thời gian nghỉ và lý do ngắn. Nội dung chi tiết được soạn trong bản Word riêng của bạn." onOpenChange={v => !v && !operation.busy && onClose()} footer={<><Button variant="outline" disabled={operation.busy} onClick={onClose}>Đóng</Button><Button disabled={operation.busy || (word && (!template.data || template.isError || !capabilities.templateConfigured)) || (!word && operation.review)} onClick={() => void submit()}>{operation.busy ? 'Đang lưu…' : request.current && operation.review && word ? 'Gửi lại cùng yêu cầu' : word ? 'Tạo nháp Word' : 'Gửi đơn không kèm Word'}</Button></>}>
    {!capabilities.wordRequired && <label className="mb-4 flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" checked={word} disabled={locked} onChange={e => setWord(e.target.checked)} />Soạn đơn Word trực tiếp</label>}
    {word && !capabilities.templateConfigured && <p role="alert" className="mb-4 text-red-800">Chưa có mẫu đơn Word. Vui lòng liên hệ quản trị viên.</p>}
    {word && capabilities.templateConfigured && <QueryState query={template} />}
    <form onSubmit={e => void submit(e)} noValidate className="space-y-4"><fieldset disabled={locked} className="space-y-4">
      <label className="staff-field">Bắt đầu nghỉ (giờ Việt Nam)<input type="datetime-local" className={fieldClass} {...form.register('startsAt')} aria-invalid={Boolean(form.formState.errors.startsAt)} /></label>
      <label className="staff-field">Kết thúc nghỉ (giờ Việt Nam)<input type="datetime-local" className={fieldClass} {...form.register('endsAt')} aria-invalid={Boolean(form.formState.errors.endsAt)} /></label>
      <label className="staff-field">Lý do ngắn<textarea rows={3} maxLength={2000} className={fieldClass} {...form.register('reason')} aria-invalid={Boolean(form.formState.errors.reason)} /></label>
    </fieldset>{Object.entries(form.formState.errors).map(([name, error]) => <p key={name} role="alert" className="text-sm text-red-800">{error.message}</p>)}</form>
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

export function LeaveDraftsView({ capabilities, onSubmitted }: { capabilities: LeaveCapabilities; onSubmitted: (id: string) => void }) {
  const [page, setPage] = useState(1);
  const [create, setCreate] = useState(false);
  const [selected, setSelected] = useState<string>();
  const [templateOpen, setTemplateOpen] = useState(false);
  const template = useStaffQuery(['leave-template'], signal => workScheduleApi.template(signal), templateOpen);
  const query = useStaffQuery(['leave-drafts', page], signal => workScheduleApi.drafts(page, signal));
  return <div className="space-y-4"><div className="staff-actions"><Button onClick={() => setCreate(true)}>Xin nghỉ phép</Button><Button variant="outline" disabled={!capabilities.templateConfigured} onClick={() => setTemplateOpen(true)}>Xem mẫu Word chung</Button><Button variant="outline" disabled={query.isFetching} onClick={() => void query.refetch()}>Làm mới nháp</Button></div>
    <QueryState query={query} empty={!query.data?.items.length} />{!query.isError && <div className="staff-grid">{query.data?.items.map(item => <article key={item.id} className="staff-card"><div className="staff-card-heading"><h3>Đơn nghỉ chưa nộp</h3><span className="staff-meta">Nháp riêng</span></div><StaffPeriod start={item.startsAtUtc} end={item.endsAtUtc} /><p className="staff-note">{item.reason}</p><div className="staff-card-footer"><Button variant="outline" onClick={() => setSelected(item.id)}>Mở nháp</Button></div></article>)}</div>}<Pager page={page} total={query.data?.total ?? 0} setPage={setPage} />
    {create && <CreateLeave capabilities={capabilities} onClose={() => setCreate(false)} onCreated={id => { setCreate(false); setSelected(id); }} onSubmitted={id => { setCreate(false); onSubmitted(id); }} />}
    {selected && <DraftWorkspace key={selected} id={selected} capabilities={capabilities} onClose={() => setSelected(undefined)} onSubmitted={id => { setSelected(undefined); onSubmitted(id); }} />}
    {templateOpen && <Modal open title="Mẫu đơn nghỉ chung" onOpenChange={v => !v && setTemplateOpen(false)}><QueryState query={template} />{!template.isError && template.data && <WordViewer title="Mẫu đơn nghỉ chung — chỉ xem" load={signal => workScheduleApi.templateDocx(template.data.versionId, template.data.sha256, signal)} onClose={() => setTemplateOpen(false)} />}</Modal>}
  </div>;
}
