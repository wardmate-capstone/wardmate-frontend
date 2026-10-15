import { useRef, useState } from 'react';
import { CheckCircle, File, Trash, UploadSimple, WarningCircle } from '@phosphor-icons/react';
import type { ChecklistItem, ProcedureCase } from '@/lib/procedureContent';
import { Button, toast } from '@/components/ui';
import { useAuthStore } from '@/stores/authStore';
import { useApplicationContents, useDocumentMutations } from '@/hooks/useDocumentForms';
import { documentFormApi, documentFormError, downloadBlob, validateDocumentFile } from '@/lib/api/documentForms';
import { FormTemplateActions } from '@/components/forms/FormTemplateActions';

interface Props {
  procedureName: string; cases: ProcedureCase[]; checklist: ChecklistItem[];
  applicationId?: string; caseCode?: string; dossierStatus?: string;
  onUpdateChecklistItem?: (checklistId: string, status: 'PENDING' | 'COMPLETED') => Promise<void>;
}
const copyLabels: Record<string, string> = { ORIGINAL: 'bản chính', CERTIFIED_COPY: 'bản sao chứng thực', REGULAR_COPY: 'bản sao thường' };

export function DossierChecklistView({ procedureName, cases, checklist, applicationId, caseCode, dossierStatus, onUpdateChecklistItem }: Props) {
  const user = useAuthStore(s => s.user);
  const contents = useApplicationContents(applicationId, Boolean(user?.id));
  const mutations = useDocumentMutations();
  const supportingInputs = useRef<Record<string, HTMLInputElement | null>>({});
  const formInputs = useRef<Record<string, HTMLInputElement | null>>({});
  const [busyItem, setBusyItem] = useState<string>();
  const selectedCaseCode = caseCode ?? cases[0]?.caseCode ?? '';
  const current = checklist.filter(item => !item.caseCode || !selectedCaseCode || item.caseCode === selectedCaseCode)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  const editable = dossierStatus === 'Bản nháp' || dossierStatus === 'Cần chỉnh sửa';
  const contentsFor = (id: string) => ({
    submissions: contents.data?.submissions.filter(x => x.checklistId === id) ?? [],
    documents: contents.data?.supportingDocuments.filter(x => x.checklistId === id) ?? [],
  });
  const ready = (item: ChecklistItem) => {
    const data = contentsFor(item.checklistId);
    if (item.formTemplateId) return data.submissions.some(x => x.fileExists && ['Submitted', 'Approved'].includes(x.status) && x.templateId === item.formTemplateId);
    return data.documents.filter(x => x.fileExists && (!item.submissionType || x.submissionType === item.submissionType)
      && (!item.documentCopyType || x.documentCopyType === item.documentCopyType)).reduce((sum, x) => sum + x.quantity, 0) >= item.quantity;
  };
  const required = current.filter(x => x.isMandatory);
  const readyCount = required.filter(ready).length;
  const progress = required.length ? Math.round(readyCount * 100 / required.length) : 100;
  async function markCompleted(item: ChecklistItem) {
    if (dossierStatus === 'Bản nháp' && onUpdateChecklistItem) await onUpdateChecklistItem(item.checklistId, 'COMPLETED');
  }
  async function uploadSupporting(item: ChecklistItem, file?: File) {
    if (!file || !applicationId) return;
    const message = validateDocumentFile(file); if (message) return toast.error(message);
    setBusyItem(item.checklistId);
    try {
      await mutations.uploadSupporting.mutateAsync({ applicationId, checklistId: item.checklistId, submissionType: item.submissionType,
        documentCopyType: item.documentCopyType, quantity: item.quantity, file });
      await markCompleted(item); toast.success(`Đã lưu ${file.name} vào hồ sơ.`);
    } catch (error) { toast.error(documentFormError(error)); }
    finally { setBusyItem(undefined); if (supportingInputs.current[item.checklistId]) supportingInputs.current[item.checklistId]!.value = ''; }
  }
  async function saveForm(item: ChecklistItem, file?: File) {
    if (!file || !applicationId || !user?.id || !item.formTemplateId) return;
    const message = validateDocumentFile(file, true); if (message) return toast.error(message);
    setBusyItem(item.checklistId);
    try {
      const existing = contentsFor(item.checklistId).submissions[0];
      const saved = existing
        ? await mutations.updateDraft.mutateAsync({ submissionId: existing.id, applicationId, applicantId: user.id, file })
        : await mutations.createDraft.mutateAsync({ templateId: item.formTemplateId, applicationId, checklistId: item.checklistId, applicantId: user.id, file });
      await mutations.submitDraft.mutateAsync({ submissionId: saved.submissionId, applicationId, applicantId: user.id });
      await markCompleted(item); toast.success('Đã lưu và chốt bản khai trong hồ sơ tiền kiểm.');
    } catch (error) { toast.error(documentFormError(error)); }
    finally { setBusyItem(undefined); if (formInputs.current[item.checklistId]) formInputs.current[item.checklistId]!.value = ''; }
  }
  async function downloadDocument(id: string, fileName: string) {
    try { const result = await documentFormApi.downloadSupportingDocument(id); downloadBlob(result.blob, result.fileName || fileName); }
    catch (error) { toast.error(documentFormError(error)); }
  }
  async function downloadSubmission(id: string, fileName: string) {
    if (!user?.id) return;
    try { const result = await documentFormApi.downloadSubmission(id, user.id); downloadBlob(result.blob, result.fileName || fileName); }
    catch (error) { toast.error(documentFormError(error)); }
  }
  async function removeDocument(id: string) {
    if (!applicationId) return; setBusyItem(id);
    try { await mutations.deleteSupporting.mutateAsync({ documentId: id, applicationId }); toast.success('Đã xóa giấy tờ khỏi hồ sơ.'); }
    catch (error) { toast.error(documentFormError(error)); } finally { setBusyItem(undefined); }
  }
  function renderRows(items: ChecklistItem[]) {
    if (!items.length) return <p className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-center text-sm text-slate-500">Không có giấy tờ trong nhóm này.</p>;
    return <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white"><table className="min-w-[780px] w-full text-sm">
      <thead className="bg-slate-50 text-left text-xs uppercase text-slate-600"><tr><th className="p-3">Trạng thái</th><th className="p-3">Giấy tờ</th><th className="p-3">Yêu cầu</th><th className="p-3 text-right">Thao tác</th></tr></thead>
      <tbody className="divide-y divide-slate-100">{items.map(item => { const data = contentsFor(item.checklistId); const done = ready(item); const busy = busyItem === item.checklistId;
        return <tr key={item.checklistId} className={done ? 'bg-emerald-50/30' : ''}>
          <td className="p-3 align-top">{done ? <span className="inline-flex items-center gap-1 font-semibold text-emerald-700"><CheckCircle weight="fill" /> Đã lưu đủ</span> : <span className="text-amber-700">Chưa đủ tệp</span>}</td>
          <td className="p-3 align-top"><p className="font-semibold text-slate-900">{item.itemName}</p>{item.conditionNote && <p className="mt-1 text-xs text-slate-500">{item.conditionNote}</p>}
            <div className="mt-2 space-y-1">{data.submissions.map(x => <div key={x.id} className="flex items-center gap-2 text-xs"><File /><button className="font-semibold text-red-800 hover:underline" onClick={() => void downloadSubmission(x.id, x.fileName)}>{x.fileName}</button><span>· {x.status}</span></div>)}
              {data.documents.map(x => <div key={x.id} className="flex items-center gap-2 text-xs"><File /><button className="font-semibold text-red-800 hover:underline" onClick={() => void downloadDocument(x.id, x.fileName)}>{x.fileName}</button><span>· {x.quantity} bản</span>{editable && <button className="text-red-700" aria-label={`Xóa ${x.fileName}`} onClick={() => void removeDocument(x.id)}><Trash /></button>}</div>)}</div></td>
          <td className="p-3 align-top text-xs"><p>{item.quantity} {copyLabels[item.documentCopyType] ?? 'bản'}</p><p>{item.isMandatory ? 'Bắt buộc' : 'Tùy chọn'} · {item.submissionType === 'XUAT_TRINH' ? 'Xuất trình' : 'Nộp'}</p></td>
          <td className="p-3 align-top"><div className="flex justify-end gap-2 flex-wrap">{item.formTemplateId ? <><FormTemplateActions templateId={item.formTemplateId} name={item.itemName} />
            {editable && <><input hidden type="file" accept=".docx" ref={el => { formInputs.current[item.checklistId] = el; }} onChange={e => void saveForm(item, e.target.files?.[0])}/><Button size="small" loading={busy} onClick={() => formInputs.current[item.checklistId]?.click()}><UploadSimple /> {data.submissions.length ? 'Thay bản khai' : 'Tải bản khai đã điền'}</Button></>}</>
            : editable && <><input hidden type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" ref={el => { supportingInputs.current[item.checklistId] = el; }} onChange={e => void uploadSupporting(item, e.target.files?.[0])}/><Button size="small" loading={busy} onClick={() => supportingInputs.current[item.checklistId]?.click()}><UploadSimple /> Đính kèm</Button></>}</div></td>
        </tr>; })}</tbody></table></div>;
  }
  if (contents.isPending) return <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600">Đang tải tài liệu đã lưu…</div>;
  if (contents.isError) return <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"><p>{documentFormError(contents.error)}</p><Button className="mt-3" size="small" variant="outline" onClick={() => void contents.refetch()}>Thử lại</Button></div>;
  return <div className="space-y-5"><div className="rounded-xl border border-slate-200 bg-white p-4"><div className="flex justify-between text-xs"><span className="font-bold">Tiến độ tài liệu: {readyCount}/{required.length} mục bắt buộc</span><span>{progress}%</span></div><div className="mt-2 h-2 rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-600" style={{ width: `${progress}%` }} /></div></div>
    <section><h4 className="mb-2 font-bold text-slate-900">Giấy tờ phải nộp</h4>{renderRows(current.filter(x => x.submissionType !== 'XUAT_TRINH'))}</section>
    <section><h4 className="mb-2 font-bold text-slate-900">Giấy tờ phải xuất trình</h4>{renderRows(current.filter(x => x.submissionType === 'XUAT_TRINH'))}</section>
    {!editable && <div className="flex gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900"><WarningCircle className="shrink-0" /> Hồ sơ đang được xử lý nên tài liệu được khóa chỉnh sửa.</div>}
    <p className="text-xs text-slate-500">Tệp được lưu trong hồ sơ tiền kiểm “{procedureName}”. Giấy tờ xuất trình vẫn cần mang bản giấy khi đến Bộ phận Một cửa.</p></div>;
}
