import { useRef, useState } from 'react';
import { useIsMutating, useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Input, Modal } from '@/components/ui';
import { useAuthStore } from '@/stores/authStore';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { useAddCommentMutation, useApplicationComments, useApplicationDiff, useApplicationVersions } from '@/hooks/useWorkflow';
import { formDataFields } from '@/lib/api/workflowAdapters';
import { workflowApi, workflowError } from '@/lib/api/workflow';
import { OfficerDocumentsPanel } from './OfficerDocumentsPanel';
import { GeneratedDocumentsPanel } from '@/pages/citizen/components/GeneratedDocumentsPanel';
import type { OfficerApplication, OfficerReviewComment } from '@/types/officer';

interface Props {
  application: OfficerApplication; onBack: () => void;
  onRequestRevision: (id: string, reason: string, issues: string[]) => Promise<void>;
  onApproveApplication: (id: string) => Promise<void>;
  onRejectApplication?: (id: string, reason: string) => Promise<void>;
  onUpdateComments?: (id: string, comments: OfficerReviewComment[]) => void;
}
const commentSchema = z.object({ targetId: z.string().min(1, 'Chọn mục cần nhận xét.').max(100, 'Mã mục tối đa 100 ký tự.'), commentText: z.string().trim().min(1, 'Nhập nội dung nhận xét.').max(4000, 'Nhận xét tối đa 4.000 ký tự.') });
const reasonSchema = z.object({ reason: z.string().trim().min(1, 'Nhập lý do.').max(4000, 'Lý do tối đa 4.000 ký tự.') });
type Tab = 'info' | 'documents' | 'comments' | 'versions' | 'timeline' | 'pdf';

export function OfficerReviewWorkspaceView({ application, onBack, onRequestRevision, onApproveApplication, onRejectApplication }: Props) {
  const user = useAuthStore(s => s.user);
  const detail = useQuery({ queryKey: ['workflow', 'application', application.id, 'officer', user?.id], queryFn: ({ signal }) => workflowApi.getOfficerApplication(application.id, signal), enabled: Boolean(user?.id) });
  const version = detail.data?.currentVersionNumber ?? application.currentVersion;
  const comments = useApplicationComments(application.id, version);
  const versions = useApplicationVersions(application.id);
  const [from, setFrom] = useState(1);
  const [to, setTo] = useState(application.currentVersion);
  const diff = useApplicationDiff(application.id, from, to);
  const addComment = useAddCommentMutation();
  const writing = useIsMutating() > 0;
  const [tab, setTab] = useState<Tab>('info');
  const [decision, setDecision] = useState<'approve' | 'revision' | 'reject'>();
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');
  const [commentError, setCommentError] = useState('');
  const decisionLock = useRef(false);
  const commentLock = useRef(false);
  const commentForm = useForm<z.infer<typeof commentSchema>>({ resolver: zodResolver(commentSchema), defaultValues: { targetId: '', commentText: '' } });
  const reasonForm = useForm<z.infer<typeof reasonSchema>>({ resolver: zodResolver(reasonSchema), defaultValues: { reason: '' } });
  const guard = useUnsavedChanges(commentForm.formState.isDirty || Boolean(decision && reasonForm.formState.isDirty), busy || addComment.isPending);
  const editable = !writing && detail.isSuccess && detail.data.status === 'UNDER_REVIEW' && detail.data.assignedOfficerId === user?.id && detail.data.userId !== user?.id;
  const openComments = comments.data?.filter(x => x.status === 'OPEN' && x.versionNumber === version) ?? [];
  const checklists = detail.data?.checklists ?? [];
  // Targets are taken from the current snapshot, never invented from visible labels.
  const fields = detail.data ? formDataFields(detail.data.formData) : application.eformFields;
  const targets = [...checklists.map(x => ({ id: x.id, label: x.title || x.code || 'Giấy tờ', type: 'CHECKLIST_ITEM' as const })), ...fields.map(x => ({ id: x.key, label: x.label, type: 'FORM_FIELD' as const }))];
  const tabs: { id: Tab; label: string }[] = [{ id: 'info', label: 'Thông tin & checklist' }, { id: 'documents', label: 'Bản khai & giấy tờ' }, { id: 'comments', label: `Nhận xét (${openComments.length} đang mở)` }, { id: 'versions', label: 'Phiên bản & so sánh' }, { id: 'timeline', label: 'Lịch sử' }, { id: 'pdf', label: 'PDF sau tiền kiểm' }];
  function openDecision(next: 'approve' | 'revision' | 'reject') { setActionError(''); reasonForm.reset({ reason: '' }); setDecision(next); }
  async function confirmDecision() {
    if (decisionLock.current || !decision || !editable) return;
    if (decision !== 'approve' && !await reasonForm.trigger()) return;
    decisionLock.current = true; setBusy(true); setActionError('');
    try {
      const latest = await comments.refetch();
      if (latest.isError) throw latest.error;
      const open = latest.data?.filter(x => x.status === 'OPEN' && x.versionNumber === version) ?? [];
      if (decision === 'approve' && open.length) { setActionError('Còn nhận xét OPEN ở phiên bản hiện tại. Cần yêu cầu công dân sửa trước khi duyệt.'); return; }
      if (decision === 'revision' && !open.length) { setActionError('Cần ít nhất một nhận xét OPEN đã lưu trên phiên bản hiện tại.'); return; }
      if (decision === 'approve') await onApproveApplication(application.id);
      else if (decision === 'revision') await onRequestRevision(application.id, reasonForm.getValues('reason').trim(), open.map(x => x.commentText || ''));
      else if (onRejectApplication) await onRejectApplication(application.id, reasonForm.getValues('reason').trim());
      setDecision(undefined);
    } catch (error) {
      await detail.refetch(); await comments.refetch();
      setActionError(`${workflowError(error)} Trạng thái đã được tải lại; hãy kiểm tra trước khi thử lại.`);
    } finally { decisionLock.current = false; setBusy(false); }
  }
  return <article aria-label="Không gian làm việc tiền kiểm hồ sơ" className="space-y-5 pb-12">
    <header className="space-y-4 rounded-2xl border bg-white p-5"><Button variant="outline" disabled={busy} onClick={() => guard.requestClose(onBack)}>Quay lại danh sách hồ sơ</Button><h2 className="break-all text-xl font-bold">{application.applicationNumber} · {application.procedureName}</h2><p className="text-sm">Phiên bản {version} · {detail.data?.status === 'APPROVED' ? 'Đã duyệt tiền kiểm' : detail.data?.status === 'UNDER_REVIEW' ? 'Đang kiểm tra' : 'Xem trạng thái hồ sơ'}</p>
      {detail.isError && <div role="alert"><p>{workflowError(detail.error)}</p><Button variant="outline" onClick={() => void detail.refetch()}>Tải lại hồ sơ</Button></div>}
      <div className="flex flex-wrap gap-2"><Button disabled={!editable || busy || !comments.isSuccess} onClick={() => openDecision('approve')}>Duyệt tiền kiểm</Button><Button variant="outline" disabled={!editable || busy || !comments.isSuccess} onClick={() => openDecision('revision')}>Yêu cầu bổ sung</Button><Button variant="outline" disabled={!editable || busy || !onRejectApplication} onClick={() => openDecision('reject')}>Từ chối tiền kiểm</Button></div>
      <nav aria-label="Nội dung kiểm tra" className="flex flex-wrap gap-2">{tabs.map(x => <Button key={x.id} variant={tab === x.id ? 'primary' : 'ghost'} size="small" aria-current={tab === x.id ? 'page' : undefined} onClick={() => setTab(x.id)}>{x.label}</Button>)}</nav>
    </header>
    <section className="space-y-4 rounded-2xl border bg-white p-5">
      {tab === 'info' && <><h3 className="font-bold">Thông tin người nộp</h3><dl className="grid gap-3 sm:grid-cols-2">{fields.map(x => <div key={x.key} className="min-w-0 rounded-xl bg-slate-50 p-3"><dt className="text-sm text-slate-600">{x.label}</dt><dd className="break-words font-semibold">{x.value || 'Chưa có thông tin'}</dd></div>)}</dl><p className="text-sm text-slate-600">Thông tin kê khai chưa phải xác minh danh tính hay xác nhận đủ điều kiện pháp lý.</p><h3 className="font-bold">Checklist hồ sơ</h3>{checklists.map(x => <div key={x.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border p-3"><div><p className="font-semibold">{x.title || x.code}</p><p className="text-sm">{x.isRequired ? 'Bắt buộc' : 'Tùy chọn'} · {x.quantity} bản · {x.status === 'COMPLETED' ? 'Công dân đã chuẩn bị' : 'Chưa hoàn tất'}</p></div><Button size="small" variant="outline" disabled={!editable} onClick={() => { commentForm.setValue('targetId', x.id); setTab('comments'); }}>Nhận xét</Button></div>)}</>}
      {tab === 'documents' && <OfficerDocumentsPanel applicationId={application.id} editable={editable && !busy} onComment={id => { commentForm.setValue('targetId', id); setTab('comments'); }} />}
      {tab === 'comments' && <><h3 className="font-bold">Nhận xét trên phiên bản {version}</h3>{comments.isPending && <p role="status">Đang tải nhận xét…</p>}{comments.isError && <div role="alert"><p>{workflowError(comments.error)}</p><Button onClick={() => void comments.refetch()}>Thử lại nhận xét</Button></div>}{comments.data?.map(x => <div key={x.id} className="space-y-2 rounded-xl border p-3"><p className="font-semibold">{x.fieldLabel} · {x.status === 'OPEN' ? 'Cần chỉnh sửa' : 'Đã xử lý'}</p><p className="whitespace-pre-wrap break-words text-sm">{x.commentText}</p><p className="text-xs text-slate-500">{new Date(x.createdAt).toLocaleString('vi-VN')}</p></div>)}{comments.isSuccess && !comments.data.length && <p>Chưa có nhận xét trên phiên bản này.</p>}
        <form className="space-y-3 border-t pt-4" noValidate onSubmit={commentForm.handleSubmit(async values => {
          if (commentLock.current || !editable) return;
          const target = targets.find(x => x.id === values.targetId);
          if (!target) { commentForm.setError('targetId', { message: 'Mục không còn trong hồ sơ hiện tại.' }); return; }
          commentLock.current = true; setCommentError('');
          try { await addComment.mutateAsync({ id: application.id, input: { versionNumber: version, targetType: target.type, targetId: target.id, fieldLabel: target.label, commentText: values.commentText } }); commentForm.reset({ targetId: '', commentText: '' }); }
          catch (error) { setCommentError(workflowError(error)); }
          finally { commentLock.current = false; }
        })}><label className="grid gap-2 text-sm font-semibold" htmlFor="comment-target">Mục cần nhận xét<select id="comment-target" className="min-h-12 rounded-xl border p-3" disabled={!editable || addComment.isPending} aria-invalid={Boolean(commentForm.formState.errors.targetId)} aria-describedby="comment-target-error" {...commentForm.register('targetId')}><option value="">Chọn mục</option>{targets.map(x => <option key={x.id} value={x.id}>{x.label}</option>)}</select></label><p id="comment-target-error" role="alert" className="text-sm text-red-800">{commentForm.formState.errors.targetId?.message}</p><Input label="Nội dung nhận xét" maxLength={4000} required disabled={!editable || addComment.isPending} {...commentForm.register('commentText')} error={commentForm.formState.errors.commentText?.message} />{commentError && <p role="alert" className="text-sm text-red-800">{commentError}</p>}<Button type="submit" loading={addComment.isPending} disabled={!editable}>Lưu nhận xét vào hồ sơ</Button></form><p className="text-sm text-slate-600">Nhận xét cũ được xử lý khi công dân gửi lại hồ sơ. Chưa hỗ trợ xóa hoặc đổi trạng thái nhận xét thủ công.</p></>}
      {tab === 'versions' && <><h3 className="font-bold">Phiên bản và so sánh dữ liệu</h3><p className="text-sm text-slate-600">So sánh dữ liệu JSON đã chụp; chưa hỗ trợ xem lại tệp nhị phân theo phiên bản cũ.</p>{versions.isError && <p role="alert">{workflowError(versions.error)}</p>}<div className="flex flex-wrap gap-3">{(['from', 'to'] as const).map(side => <label key={side} className="grid gap-2 text-sm">{side === 'from' ? 'Phiên bản nguồn' : 'Phiên bản đích'}<select className="min-h-11 rounded-lg border p-2" value={side === 'from' ? from : to} onChange={e => side === 'from' ? setFrom(Number(e.target.value)) : setTo(Number(e.target.value))}>{versions.data?.map(x => <option key={x.id} value={x.versionNumber}>v{x.versionNumber}</option>)}</select></label>)}</div>{from >= to ? <p>Chọn phiên bản đích lớn hơn phiên bản nguồn.</p> : diff.isPending ? <p role="status">Đang so sánh…</p> : diff.isError ? <p role="alert">{workflowError(diff.error)}</p> : <div className="space-y-3">{diff.data?.map((x, i) => <div key={i} className="rounded-xl border p-3"><p className="font-semibold">{x.fieldLabel || x.fieldKey} · {x.hasChanged ? 'Đã thay đổi' : 'Không đổi'}</p><p className="break-all text-sm">Trước: {JSON.stringify(x.oldValue)}</p><p className="break-all text-sm">Sau: {JSON.stringify(x.newValue)}</p></div>)}</div>}</>}
      {tab === 'timeline' && <><h3 className="font-bold">Lịch sử trạng thái</h3>{detail.data?.history?.map(x => <div key={x.id} className="rounded-xl border p-3"><p className="font-semibold">{x.fromStatus || 'Khởi tạo'} → {x.toStatus}</p><p className="text-sm">{x.reason}</p><time className="text-xs text-slate-600">{new Date(x.createdAt).toLocaleString('vi-VN')}</time></div>)}</>}
      {tab === 'pdf' && (detail.data?.status === 'APPROVED' ? <GeneratedDocumentsPanel applicationId={application.id} /> : <p>PDF sau tiền kiểm chỉ được tạo khi hồ sơ đã duyệt. Mở tab “Bản khai & giấy tờ” để xem DOCX hiện tại.</p>)}
    </section>
    <Modal open={Boolean(decision)} onOpenChange={open => { if (!open && !busy) guard.requestClose(() => setDecision(undefined)); }} title={decision === 'approve' ? 'Duyệt tiền kiểm toàn bộ hồ sơ' : decision === 'revision' ? 'Yêu cầu bổ sung hồ sơ' : 'Từ chối tiền kiểm'} description="Quyết định áp dụng cho toàn bộ hồ sơ. Duyệt tiền kiểm chưa phải tiếp nhận hồ sơ chính thức.">
      <div className="space-y-4">{decision !== 'approve' && <Input label="Lý do" required maxLength={4000} disabled={busy} {...reasonForm.register('reason')} error={reasonForm.formState.errors.reason?.message} />}{actionError && <p role="alert" className="text-sm text-red-800">{actionError}</p>}<Button loading={busy} disabled={!editable || !comments.isSuccess} onClick={() => void confirmDecision()}>Xác nhận quyết định</Button></div>
    </Modal>
    {guard.confirmation}
  </article>;
}
