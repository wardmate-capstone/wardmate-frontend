import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { ChecklistItem, ProcedureCase } from '@/lib/procedureContent';
import { Badge, Button, ChecklistSkeleton, Input, Modal, toast } from '@/components/ui';
import { CheckCircle, FileDoc, Paperclip, PencilSimple, UploadSimple, DownloadSimple, ArrowClockwise, CaretDown } from '@phosphor-icons/react';
import { useAuthStore } from '@/stores/authStore';
import { useApplicationContents, useDocumentMutations } from '@/hooks/useDocumentForms';
import { documentFormApi, documentFormError, documentQuantitySchema, downloadBlob, submissionStatusLabel, validateDocumentFile } from '@/lib/api/documentForms';
import { hasChecklistEvidence } from '@/lib/documentEvidence';
import { FormTemplateActions } from '@/components/forms/FormTemplateActions';
import { DocumentFilePreview } from '@/components/documents/DocumentFilePreview';
import { downloadFormTemplateDocx } from '@/lib/api/formTemplates';

const DocxOnlineEditor = lazy(() => import('@/components/documents/DocxOnlineEditor'));

interface Props {
  procedureName: string; cases: ProcedureCase[]; checklist: ChecklistItem[];
  applicationId?: string; caseCode?: string; dossierStatus?: string;
  onUpdateChecklistItem?: (checklistId: string, status: 'PENDING' | 'COMPLETED') => Promise<void>;
  onBusyChange?: (busy: boolean) => void;
}
const copyLabels: Record<string, string> = { ORIGINAL: 'bản chính', CERTIFIED_COPY: 'bản sao chứng thực', REGULAR_COPY: 'bản sao thường' };
const quantitySchema = z.object({ quantity: documentQuantitySchema });

export function DossierChecklistView({ procedureName, checklist, applicationId, dossierStatus, onUpdateChecklistItem, onBusyChange }: Props) {
  const user = useAuthStore(s => s.user);
  const contents = useApplicationContents(applicationId);
  const mutations = useDocumentMutations();
  const lock = useRef(false);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<{ item: ChecklistItem; submissionId?: string; readOnly: boolean }>();
  useEffect(() => { onBusyChange?.(busy || Boolean(editing)); }, [busy, editing, onBusyChange]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [upload, setUpload] = useState<{ item: ChecklistItem; file: File }>();
  const [removing, setRemoving] = useState<{ id: string; name: string; item: ChecklistItem }>();
  const [preview, setPreview] = useState<{ id: string; name: string; form: boolean }>();
  const quantityForm = useForm<z.input<typeof quantitySchema>, unknown, z.output<typeof quantitySchema>>({ resolver: zodResolver(quantitySchema), defaultValues: { quantity: 1 } });
  const editable = dossierStatus === 'Bản nháp' || dossierStatus === 'Cần chỉnh sửa';
  const current = [...checklist].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  const ready = (item: ChecklistItem) => Boolean(contents.data && hasChecklistEvidence(item, contents.data));

  async function perform(item: ChecklistItem, action: () => Promise<void>, rethrow = false) {
    if (lock.current) { if (rethrow) throw new Error('Một thao tác tài liệu khác đang được lưu. Vui lòng chờ rồi thử lại.'); return; }
    lock.current = true; setBusy(true); setErrors(prev => ({ ...prev, [item.checklistId]: '' }));
    try { await action(); }
    catch (error) { setErrors(prev => ({ ...prev, [item.checklistId]: error instanceof Error && !('isAxiosError' in error) ? error.message : documentFormError(error) })); await contents.refetch(); if (rethrow) throw error; }
    finally { lock.current = false; setBusy(false); }
  }
  async function syncChecklist(item: ChecklistItem) {
    if (!applicationId) return;
    const fresh = await contents.refetch();
    if (!fresh.data || fresh.isError) throw new Error('Tệp đã lưu nhưng chưa kiểm tra được giấy tờ. Bấm “Kiểm tra lại giấy tờ” để thử lại.');
    if (dossierStatus === 'Bản nháp' && onUpdateChecklistItem) {
      try { await onUpdateChecklistItem(item.checklistId, hasChecklistEvidence(item, fresh.data) ? 'COMPLETED' : 'PENDING'); }
      catch { throw new Error('Tệp đã lưu nhưng chưa cập nhật trạng thái giấy tờ. Bấm “Kiểm tra lại giấy tờ” để thử lại.'); }
    }
  }
  async function saveForm(item: ChecklistItem, file: File, rethrow = false) {
    const message = validateDocumentFile(file, true);
    if (message) { setErrors(prev => ({ ...prev, [item.checklistId]: message })); if (rethrow) throw new Error(message); return; }
    if (!applicationId || !user?.id || !item.formTemplateId) { if (rethrow) throw new Error('Chưa xác định được hồ sơ hoặc biểu mẫu. Vui lòng tải lại.'); return; }
    await perform(item, async () => {
      const existing = contents.data?.submissions.find(x => x.checklistId === item.checklistId);
      if (existing) await mutations.updateDraft.mutateAsync({ submissionId: existing.id, applicationId, applicantId: user.id, file });
      else await mutations.createDraft.mutateAsync({ templateId: item.formTemplateId!, applicationId, checklistId: item.checklistId, applicantId: user.id, file });
      toast.success('Đã lưu bản nháp. Hãy kiểm tra nội dung và xác nhận bản khai.');
      await syncChecklist(item);
    }, rethrow);
  }
  async function finishForm(item: ChecklistItem, submissionId: string) {
    if (!applicationId || !user?.id) return;
    await perform(item, async () => {
      await mutations.submitDraft.mutateAsync({ submissionId, applicationId, applicantId: user.id });
      await syncChecklist(item); toast.success('Đã xác nhận bản khai. Bạn có thể gửi hồ sơ khi đã đủ giấy tờ.');
    });
  }
  async function download(id: string, isForm: boolean, name: string) {
    try { if (!user?.id) return; const result = isForm ? await documentFormApi.downloadSubmission(id, user.id) : await documentFormApi.downloadSupportingDocument(id); downloadBlob(result.blob, result.fileName === 'tai-lieu' ? name : result.fileName); }
    catch (error) { toast.error(documentFormError(error)); }
  }

  if (contents.isPending) return <ChecklistSkeleton count={Math.max(2, current.length || 3)} />;
  if (contents.isError) return <div role="alert"><p>{documentFormError(contents.error)}</p><Button variant="outline" onClick={() => void contents.refetch()}>Thử lại</Button></div>;
  return <div className="space-y-4 [&_button]:min-h-11" aria-busy={busy}>
    {!current.length && <p>Hồ sơ không có mục giấy tờ cần đính kèm.</p>}
    {current.map((item, index) => {
      const submissions = contents.data?.submissions.filter(x => x.checklistId === item.checklistId) ?? [];
      const documents = contents.data?.supportingDocuments.filter(x => x.checklistId === item.checklistId) ?? [];
      const complete = ready(item);
      const needsConfirmation = submissions.some(x => x.status === 'Draft' && x.fileExists);
      const fileInput = (
        <label className={`flex min-h-14 min-w-0 cursor-pointer items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-white px-3.5 py-2.5 transition hover:border-slate-400 hover:bg-slate-50 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-red-700 ${busy ? 'pointer-events-none opacity-50' : ''}`}>
          <UploadSimple size={20} className="shrink-0 text-slate-500" aria-hidden />
          <span className="min-w-0">
            <span className="block text-xs font-semibold text-slate-800">{item.formTemplateId ? 'Tải lên tệp Word đã điền' : 'Chọn tệp đính kèm'}</span>
            <span className="block text-[11px] text-slate-400">{item.formTemplateId ? 'Tệp .docx (tối đa 20 MiB)' : 'PDF, JPG/PNG hoặc Word · Tối đa 20 MiB'}</span>
          </span>
          <input
            aria-label={item.formTemplateId ? (submissions.length ? 'Thay tệp Word đã điền' : 'Tải lên tệp Word đã điền') : 'Đính kèm giấy tờ'}
            aria-describedby={errors[item.checklistId] ? `error-${item.checklistId}` : undefined}
            aria-invalid={Boolean(errors[item.checklistId])}
            className="sr-only"
            disabled={busy}
            type="file"
            accept={item.formTemplateId ? '.docx' : '.pdf,.jpg,.jpeg,.png,.doc,.docx'}
            onChange={e => {
              const file = e.target.files?.[0];
              e.target.value = '';
              if (!file) return;
              const error = validateDocumentFile(file, Boolean(item.formTemplateId));
              if (error) { setErrors(prev => ({ ...prev, [item.checklistId]: error })); return; }
              if (item.formTemplateId) void saveForm(item, file);
              else { quantityForm.reset({ quantity: 1 }); setUpload({ item, file }); }
            }}
          />
        </label>
      );

      return (
        <section key={item.checklistId} id={`checklist-${item.checklistId}`} tabIndex={-1} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs focus:outline-2 focus:outline-offset-2 focus:outline-red-700">
          <div className="space-y-3 p-4 sm:p-5">
            {/* Header info */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <span className={`grid size-9 shrink-0 place-items-center rounded-xl ${complete ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                  {complete ? <CheckCircle size={20} aria-hidden /> : item.formTemplateId ? <FileDoc size={20} aria-hidden /> : <Paperclip size={20} aria-hidden />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <span className="text-[11px] font-semibold text-slate-400">Mục {String(index + 1).padStart(2, '0')}</span>
                    <span className={`text-[11px] font-semibold ${item.isMandatory ? 'text-red-800' : 'text-slate-400'}`}>
                      {item.isMandatory ? 'Bắt buộc' : 'Không bắt buộc'}
                    </span>
                  </div>
                  <h4 className="mt-0.5 break-words text-sm sm:text-base font-bold text-slate-900 leading-snug">{item.itemName}</h4>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {item.quantity} {copyLabels[item.documentCopyType] ?? 'bản'} · {item.submissionType === 'XUAT_TRINH' ? 'Xuất trình khi đến quầy' : 'Nộp theo yêu cầu'}
                  </p>
                </div>
              </div>
              <Badge variant={complete ? 'success' : needsConfirmation ? 'warning' : 'neutral'} className="px-2.5 py-0.5 text-[11px] shrink-0">
                {complete ? 'Đã hoàn tất' : needsConfirmation ? 'Cần xác nhận bản khai' : 'Chưa hoàn tất'}
              </Badge>
            </div>

            {item.conditionNote && (
              <p className="rounded-lg bg-slate-50 px-3 py-1.5 text-xs text-slate-600 leading-relaxed">
                {item.conditionNote}
              </p>
            )}

            {/* Action Bar for Form Template (When no submission yet) */}
            {item.formTemplateId && applicationId && !submissions.length && (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-100 bg-red-50/50 p-3 sm:px-4">
                <span className="text-xs font-semibold text-red-950">Mẫu tờ khai điện tử có sẵn trên hệ thống</span>
                <Button
                  size="small"
                  className="shrink-0 gap-1.5"
                  variant="primary"
                  disabled={busy}
                  onClick={() => setEditing({ item, submissionId: undefined, readOnly: !editable })}
                >
                  <PencilSimple size={15} aria-hidden />
                  <span>{editable ? 'Điền trực tuyến' : 'Xem bản khai trực tuyến'}</span>
                </Button>
              </div>
            )}

            {/* Submissions list */}
            {submissions.map(x => (
              <div key={x.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/40 p-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <FileDoc size={20} className="shrink-0 text-red-700" aria-hidden />
                  <div className="min-w-0">
                    <button
                      type="button"
                      title="Tải bản khai đã lưu"
                      className="inline-flex items-center gap-1.5 break-all text-left text-xs sm:text-sm font-semibold text-slate-800 underline decoration-slate-300 underline-offset-4 hover:text-red-800"
                      onClick={() => void download(x.id, true, x.fileName)}
                    >
                      <span>{x.fileName}</span>
                      <DownloadSimple size={14} className="shrink-0 text-slate-400" aria-hidden />
                    </button>
                    <p className="text-[11px] text-slate-500">
                      {x.status === 'Draft' ? 'Đã lưu bản nháp' : x.status === 'Submitted' ? 'Đã xác nhận' : submissionStatusLabel(x.status)}
                      {!x.fileExists && ' · Không tìm thấy tệp'}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    size="small"
                    variant="outline"
                    disabled={busy}
                    onClick={() => setEditing({ item, submissionId: x.id, readOnly: !editable || ['Approved', 'ReadyForDownload'].includes(x.status ?? '') })}
                  >
                    <PencilSimple size={14} aria-hidden />
                    <span>{editable && !['Approved', 'ReadyForDownload'].includes(x.status ?? '') ? 'Chỉnh sửa trực tuyến' : 'Xem bản khai trực tuyến'}</span>
                  </Button>
                  {editable && x.fileExists && x.status === 'Draft' && (
                    <Button
                      size="small"
                      variant="primary"
                      disabled={busy}
                      onClick={() => void finishForm(item, x.id)}
                    >
                      <CheckCircle size={14} aria-hidden />
                      <span>Xác nhận bản khai</span>
                    </Button>
                  )}
                </div>
              </div>
            ))}

            {/* Supporting documents list */}
            {documents.map(x => (
              <div key={x.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/40 p-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Paperclip size={18} className="shrink-0 text-slate-500" aria-hidden />
                  <div className="min-w-0">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 break-all text-left text-xs sm:text-sm font-semibold text-slate-800 underline decoration-slate-300 underline-offset-4 hover:text-red-700"
                      onClick={() => void download(x.id, false, x.fileName)}
                    >
                      <span>{x.fileName}</span>
                      <DownloadSimple size={14} className="shrink-0 text-slate-400" aria-hidden />
                    </button>
                    <p className="text-[11px] text-slate-500">{x.quantity} bản{x.fileExists ? ' · Đã tải lên' : ' · Không tìm thấy tệp'}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button size="small" variant="outline" onClick={() => setPreview({ id: x.id, name: x.fileName, form: false })}>
                    Xem giấy tờ
                  </Button>
                  {editable && (
                    <Button variant="ghost" size="small" className="text-slate-400 hover:text-red-700 text-xs" disabled={busy} onClick={() => setRemoving({ id: x.id, name: x.fileName, item })}>
                      Xóa {x.fileName}
                    </Button>
                  )}
                </div>
              </div>
            ))}

            {/* Upload for non-form items */}
            {!item.formTemplateId && editable && fileInput}

            {/* Error notifications */}
            {errors[item.checklistId] && (
              <div className="space-y-2 rounded-xl border border-red-200 bg-red-50 p-3">
                <p role="alert" id={`error-${item.checklistId}`} className="text-xs text-red-800">{errors[item.checklistId]}</p>
                {errors[item.checklistId].includes('Kiểm tra lại giấy tờ') && (
                  <Button size="small" variant="outline" disabled={busy} onClick={() => void perform(item, () => syncChecklist(item))}>
                    <ArrowClockwise size={14} aria-hidden />Kiểm tra lại giấy tờ
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Collapsible drawers for Form Templates */}
          {item.formTemplateId && (
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 bg-slate-50/40 px-4 sm:px-5 py-1 text-xs">
              <details className="group py-0.5">
                <summary className="flex min-h-8 cursor-pointer list-none items-center gap-1 font-medium text-slate-600 hover:text-slate-900 focus-visible:outline-red-700">
                  <span>Xem hoặc tải mẫu trống</span>
                  <CaretDown size={13} className="transition group-open:rotate-180" aria-hidden />
                </summary>
                <div className="pt-2 pb-2">
                  <FormTemplateActions templateId={item.formTemplateId} name={item.itemName} />
                </div>
              </details>
              {editable && (
                <details className="group py-0.5" open={Boolean(errors[item.checklistId]) || undefined}>
                  <summary className="flex min-h-8 cursor-pointer list-none items-center gap-1 font-medium text-slate-600 hover:text-slate-900 focus-visible:outline-red-700">
                    <span>Đã điền bằng Word? Tải tệp lên</span>
                    <CaretDown size={13} className="transition group-open:rotate-180" aria-hidden />
                  </summary>
                  <div className="pt-2 pb-2">
                    {fileInput}
                  </div>
                </details>
              )}
            </div>
          )}
        </section>
      );
    })}
    {!editable && <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">Tài liệu đang được khóa chỉnh sửa theo trạng thái hồ sơ.</p>}
    {current.some(item => item.submissionType === 'XUAT_TRINH') && <p className="text-xs leading-relaxed text-slate-500">Hồ sơ “{procedureName}” có giấy tờ cần xuất trình. Hãy mang bản giấy khi đến Bộ phận Một cửa.</p>}
    <Modal open={Boolean(upload)} onOpenChange={open => { if (!open && !busy) setUpload(undefined); }} title="Khai số bản trong tệp" description="Nhập số bản giấy tờ thực tế được thể hiện trong tệp, không phải số trang.">
      <form className="space-y-4" onSubmit={quantityForm.handleSubmit(async ({ quantity }) => {
        if (!upload || !applicationId) return;
        const selected = upload;
        await perform(selected.item, async () => {
          await mutations.uploadSupporting.mutateAsync({ applicationId, checklistId: selected.item.checklistId, submissionType: selected.item.submissionType, documentCopyType: selected.item.documentCopyType, quantity, file: selected.file });
          setUpload(undefined); await syncChecklist(selected.item); toast.success('Đã lưu giấy tờ vào hồ sơ.');
        });
      })} noValidate><p className="break-all text-sm">{upload?.file.name}</p><Input label="Số bản thực tế" type="number" min={1} max={2147483647} required disabled={busy} {...quantityForm.register('quantity')} error={quantityForm.formState.errors.quantity?.message} />{upload && errors[upload.item.checklistId] && <p role="alert" className="text-sm text-red-800">{errors[upload.item.checklistId]}</p>}<Button type="submit" loading={busy}>Lưu giấy tờ</Button></form>
    </Modal>
    <Modal open={Boolean(removing)} onOpenChange={open => { if (!open && !busy) setRemoving(undefined); }} title="Xóa giấy tờ khỏi hồ sơ" description="Sau khi xóa, bạn có thể cần đính kèm lại để hồ sơ đủ giấy tờ."><p className="mb-4 break-all">{removing?.name}</p>{removing && errors[removing.item.checklistId] && <p role="alert" className="mb-4 text-sm text-red-800">{errors[removing.item.checklistId]}</p>}<Button loading={busy} onClick={() => { if (!removing || !applicationId) return; const selected = removing; void perform(selected.item, async () => { await mutations.deleteSupporting.mutateAsync({ documentId: selected.id, applicationId }); setRemoving(undefined); await syncChecklist(selected.item); toast.success('Đã xóa giấy tờ.'); }); }}>Xác nhận xóa</Button></Modal>
    <Modal open={Boolean(preview)} onOpenChange={open => { if (!open) setPreview(undefined); }} title="Xem giấy tờ đã lưu" className="sm:max-w-4xl">{preview && <DocumentFilePreview key={preview.id} fileId={preview.id} fileName={preview.name} load={signal => documentFormApi.downloadSupportingDocument(preview.id, signal)} />}</Modal>
    {editing && user && (
      <Suspense
        fallback={
          <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-900/60 backdrop-blur-sm text-white" role="status" aria-label="Đang mở DOCX Studio">
            <div className="flex flex-col items-center gap-3 rounded-2xl bg-slate-800/90 px-6 py-5 shadow-2xl border border-slate-700">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
              <p className="text-sm font-medium">Đang khởi tạo WardMate DOCX Studio…</p>
            </div>
          </div>
        }
      >
        <DocxOnlineEditor
          sourceKey={`${applicationId}-${editing.item.checklistId}-${editing.submissionId ?? 'new'}`}
          title={editing.item.itemName}
          subtitle={`Thủ tục: ${procedureName}`}
          author={user.profile?.fullName || user.username}
          readOnly={editing.readOnly}
          load={async signal => {
            if (!editing.submissionId) return downloadFormTemplateDocx(editing.item.formTemplateId!, signal);
            const metadata = await documentFormApi.getSubmission(editing.submissionId, user.id, signal);
            if (metadata.applicationId !== applicationId || metadata.checklistId !== editing.item.checklistId) throw new Error('Bản khai không thuộc mục giấy tờ hiện tại.');
            return documentFormApi.downloadSubmission(editing.submissionId, user.id, signal);
          }}
          onSave={file => saveForm(editing.item, file, true)}
          onClose={() => setEditing(undefined)}
        />
      </Suspense>
    )}
  </div>;
}
