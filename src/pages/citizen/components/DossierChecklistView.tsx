import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { ChecklistItem, ProcedureCase } from '@/lib/procedureContent';
import { Button, Input, Modal, toast } from '@/components/ui';
import { useAuthStore } from '@/stores/authStore';
import { useApplicationContents, useDocumentMutations } from '@/hooks/useDocumentForms';
import { documentFormApi, documentFormError, documentQuantitySchema, downloadBlob, submissionStatusLabel, validateDocumentFile } from '@/lib/api/documentForms';
import { hasChecklistEvidence } from '@/lib/documentEvidence';
import { FormTemplateActions } from '@/components/forms/FormTemplateActions';
import { DocumentFilePreview } from '@/components/documents/DocumentFilePreview';

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
  useEffect(() => { onBusyChange?.(busy); }, [busy, onBusyChange]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [upload, setUpload] = useState<{ item: ChecklistItem; file: File }>();
  const [removing, setRemoving] = useState<{ id: string; name: string; item: ChecklistItem }>();
  const [preview, setPreview] = useState<{ id: string; name: string; form: boolean }>();
  const quantityForm = useForm<z.input<typeof quantitySchema>, unknown, z.output<typeof quantitySchema>>({ resolver: zodResolver(quantitySchema), defaultValues: { quantity: 1 } });
  const editable = dossierStatus === 'Bản nháp' || dossierStatus === 'Cần chỉnh sửa';
  const current = [...checklist].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  const ready = (item: ChecklistItem) => Boolean(contents.data && hasChecklistEvidence(item, contents.data));
  const required = current.filter(x => x.isMandatory);
  const readyCount = required.filter(ready).length;

  async function perform(item: ChecklistItem, action: () => Promise<void>) {
    if (lock.current) return;
    lock.current = true; setBusy(true); setErrors(prev => ({ ...prev, [item.checklistId]: '' }));
    try { await action(); }
    catch (error) { setErrors(prev => ({ ...prev, [item.checklistId]: error instanceof Error && !('isAxiosError' in error) ? error.message : documentFormError(error) })); await contents.refetch(); }
    finally { lock.current = false; setBusy(false); }
  }
  async function syncChecklist(item: ChecklistItem) {
    if (!applicationId) return;
    const fresh = await contents.refetch();
    if (!fresh.data || fresh.isError) throw new Error('Tệp đã lưu nhưng chưa kiểm tra được tài liệu. Vui lòng tải lại rồi đồng bộ checklist.');
    if (dossierStatus === 'Bản nháp' && onUpdateChecklistItem) {
      try { await onUpdateChecklistItem(item.checklistId, hasChecklistEvidence(item, fresh.data) ? 'COMPLETED' : 'PENDING'); }
      catch { throw new Error('Tệp đã lưu nhưng chưa đồng bộ checklist. Bấm “Đồng bộ checklist” để thử lại.'); }
    }
  }
  async function saveForm(item: ChecklistItem, file: File) {
    const message = validateDocumentFile(file, true);
    if (message) { setErrors(prev => ({ ...prev, [item.checklistId]: message })); return; }
    if (!applicationId || !user?.id || !item.formTemplateId) return;
    await perform(item, async () => {
      const existing = contents.data?.submissions.find(x => x.checklistId === item.checklistId);
      if (existing) await mutations.updateDraft.mutateAsync({ submissionId: existing.id, applicationId, applicantId: user.id, file });
      else await mutations.createDraft.mutateAsync({ templateId: item.formTemplateId!, applicationId, checklistId: item.checklistId, applicantId: user.id, file });
      toast.success('Đã lưu bản nháp. Chốt bản khai khi bạn đã kiểm tra xong.');
      await syncChecklist(item);
    });
  }
  async function finishForm(item: ChecklistItem, submissionId: string) {
    if (!applicationId || !user?.id) return;
    await perform(item, async () => {
      await mutations.submitDraft.mutateAsync({ submissionId, applicationId, applicantId: user.id });
      await syncChecklist(item); toast.success('Đã chốt bản khai. Hồ sơ chưa được gửi tiền kiểm.');
    });
  }
  async function download(id: string, isForm: boolean, name: string) {
    try { if (!user?.id) return; const result = isForm ? await documentFormApi.downloadSubmission(id, user.id) : await documentFormApi.downloadSupportingDocument(id); downloadBlob(result.blob, result.fileName === 'tai-lieu' ? name : result.fileName); }
    catch (error) { toast.error(documentFormError(error)); }
  }

  if (contents.isPending) return <p role="status">Đang tải tài liệu đã lưu…</p>;
  if (contents.isError) return <div role="alert"><p>{documentFormError(contents.error)}</p><Button variant="outline" onClick={() => void contents.refetch()}>Thử lại</Button></div>;
  return <div className="space-y-4" aria-busy={busy}>
    <p className="text-sm font-semibold">Đã lưu đủ tài liệu: {readyCount}/{required.length} mục bắt buộc. Tài liệu vẫn cần được cán bộ kiểm tra.</p>
    {!current.length && <p>Hồ sơ không có mục giấy tờ cần đính kèm.</p>}
    {current.map(item => {
      const submissions = contents.data?.submissions.filter(x => x.checklistId === item.checklistId) ?? [];
      const documents = contents.data?.supportingDocuments.filter(x => x.checklistId === item.checklistId) ?? [];
      return <section key={item.checklistId} id={`checklist-${item.checklistId}`} tabIndex={-1} className="space-y-3 rounded-xl border border-slate-200 p-4 focus:outline-red-700">
        <div className="flex flex-wrap items-start justify-between gap-2"><h4 className="font-bold text-slate-900">{item.itemName}</h4><span className={ready(item) ? 'text-sm text-emerald-800' : 'text-sm text-amber-800'}>{ready(item) ? 'Đã lưu đủ' : 'Chưa đủ tài liệu'}</span></div>
        <p className="text-sm text-slate-600">{item.isMandatory ? 'Bắt buộc' : 'Tùy chọn'} · {item.quantity} {copyLabels[item.documentCopyType] ?? 'bản'} · {item.submissionType === 'XUAT_TRINH' ? 'Xuất trình' : 'Nộp'}</p>
        {item.conditionNote && <p className="text-sm">{item.conditionNote}</p>}
        {submissions.map(x => <div key={x.id} className="flex flex-wrap items-center gap-3 text-sm"><button type="button" className="min-h-11 break-all text-left font-semibold text-red-800 underline" onClick={() => void download(x.id, true, x.fileName)}>{x.fileName}</button><span>{submissionStatusLabel(x.status)}{!x.fileExists && ' · Tệp không còn trong kho'}</span>{editable && x.fileExists && x.status === 'Draft' && <Button size="small" disabled={busy} onClick={() => void finishForm(item, x.id)}>Chốt bản khai</Button>}</div>)}
        {documents.map(x => <div key={x.id} className="flex flex-wrap items-center gap-3 text-sm"><button type="button" className="min-h-11 break-all text-left font-semibold text-red-800 underline" onClick={() => void download(x.id, false, x.fileName)}>{x.fileName}</button><span>{x.quantity} bản{x.fileExists ? '' : ' · Tệp không còn trong kho'}</span><Button size="small" variant="outline" onClick={() => setPreview({ id: x.id, name: x.fileName, form: false })}>Xem giấy tờ</Button>{editable && <Button variant="ghost" size="small" disabled={busy} onClick={() => setRemoving({ id: x.id, name: x.fileName, item })}>Xóa {x.fileName}</Button>}</div>)}
        <div className="flex flex-wrap items-center gap-3">
          {item.formTemplateId && <FormTemplateActions templateId={item.formTemplateId} name={item.itemName} />}
          {editable && <label className="grid min-w-0 gap-2 text-sm font-semibold text-slate-800">{item.formTemplateId ? (submissions.length ? 'Thay bản nháp DOCX' : 'Lưu bản nháp DOCX') : 'Đính kèm giấy tờ'}
            <input aria-describedby={errors[item.checklistId] ? `error-${item.checklistId}` : undefined} aria-invalid={Boolean(errors[item.checklistId])} className="min-h-11 w-full max-w-sm rounded-lg border p-2 text-sm" disabled={busy} type="file" accept={item.formTemplateId ? '.docx' : '.pdf,.jpg,.jpeg,.png,.doc,.docx'} onChange={e => { const file = e.target.files?.[0]; e.target.value = ''; if (!file) return; const error = validateDocumentFile(file, Boolean(item.formTemplateId)); if (error) { setErrors(prev => ({ ...prev, [item.checklistId]: error })); return; } if (item.formTemplateId) void saveForm(item, file); else { quantityForm.reset({ quantity: 1 }); setUpload({ item, file }); } }} />
          </label>}
          {editable && dossierStatus === 'Bản nháp' && <Button size="small" variant="outline" disabled={busy} onClick={() => void perform(item, () => syncChecklist(item))}>Đồng bộ checklist</Button>}
        </div>
        {errors[item.checklistId] && <p role="alert" id={`error-${item.checklistId}`} className="text-sm text-red-800">{errors[item.checklistId]}</p>}
      </section>;
    })}
    {!editable && <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">Tài liệu đang được khóa chỉnh sửa theo trạng thái hồ sơ.</p>}
    <p className="text-sm text-slate-600">Tệp được lưu vào hồ sơ tiền kiểm “{procedureName}”. Giấy tờ xuất trình cần mang bản giấy khi đến Bộ phận Một cửa.</p>
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
  </div>;
}
