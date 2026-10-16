import { useState } from 'react';
import { useIsMutating } from '@tanstack/react-query';
import { Badge, Button, Modal } from '@/components/ui';
import { useApplicationContents } from '@/hooks/useDocumentForms';
import { hasChecklistEvidence } from '@/lib/documentEvidence';
import { workflowError } from '@/lib/api/workflow';
import { ArrowLeft, ArrowRight, CheckCircle, Info, ChatText, FileText, Buildings, CalendarBlank, Clock, PaperPlaneTilt, ShieldCheck } from '@phosphor-icons/react';
import { DossierChecklistView } from '../components/DossierChecklistView';
import { GeneratedDocumentsPanel } from '../components/GeneratedDocumentsPanel';
import type { CitizenDossier } from '../types';
import { useApplicationComments } from '@/hooks/useWorkflow';

interface Props {
  dossier: CitizenDossier; wardName?: string; onBack: () => void;
  onSubmitPrecheck: () => Promise<void>; onResubmitPrecheck?: () => Promise<void>;
  onUpdateChecklistItem?: (checklistId: string, status: 'PENDING' | 'COMPLETED') => Promise<void>;
  submitting?: boolean;
}
function goToPaper(id?: string | null) {
  if (!id) return;
  const element = document.getElementById(`checklist-${id}`);
  element?.focus({ preventScroll: true }); element?.scrollIntoView({ block: 'center', behavior: 'smooth' });
}

export function CitizenDossierDetailView({ dossier, wardName, onBack, onSubmitPrecheck, onResubmitPrecheck, onUpdateChecklistItem, submitting = false }: Props) {
  const commentsQuery = useApplicationComments(dossier.id, dossier.currentVersion);
  const comments = commentsQuery.data ?? [];
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [documentBusy, setDocumentBusy] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [sendError, setSendError] = useState('');
  const contents = useApplicationContents(dossier.id);
  const mutating = useIsMutating() > 0 || documentBusy;
  const preparing = ['Bản nháp', 'Cần chỉnh sửa'].includes(dossier.status);
  const revising = dossier.status === 'Cần chỉnh sửa';
  const approved = dossier.status === 'Đã duyệt' || dossier.status === 'Đã hoàn thành';
  const required = (dossier.checklist ?? []).filter(item => item.isMandatory);
  const missing = contents.data ? required.filter(item => !hasChecklistEvidence(item, contents.data!)) : [];
  const readyCount = required.length - missing.length;
  const canSend = preparing && (!revising || Boolean(onResubmitPrecheck)) && dossier.checklist !== undefined && contents.isSuccess && !missing.length && !mutating && !submitting;
  const openConfirm = () => { setAcknowledged(false); setSendError(''); setConfirmOpen(true); };
  const openComments = comments.filter(comment => comment.status === 'OPEN');
  const resolvedComments = comments.filter(comment => comment.status === 'RESOLVED');
  const statusLabel = dossier.status === 'Đã duyệt' ? 'Đã duyệt tiền kiểm' : revising ? 'Cần bổ sung' : dossier.status;
  const currentStep = preparing ? 0 : approved || dossier.status === 'Đã từ chối' ? 2 : 1;

  return <div className="min-w-0 space-y-5 pb-8 [&_button]:min-h-11">
    <Button variant="ghost" className="-ml-3 gap-2 px-3 text-slate-600" onClick={onBack}><ArrowLeft size={18} aria-hidden />Quay lại danh sách</Button>
    <section aria-label="Thông tin hồ sơ" className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="p-5 sm:p-7">
        <div className="mb-3 flex flex-wrap items-center gap-3"><span className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Hồ sơ tiền kiểm</span><Badge variant={approved ? 'success' : revising ? 'warning' : dossier.status === 'Đã từ chối' ? 'danger' : 'neutral'} className="text-xs">{statusLabel}</Badge>{(dossier.currentVersion ?? 0) > 0 && <span className="text-xs text-slate-500">Phiên bản {dossier.currentVersion}</span>}</div>
        <h2 className="max-w-4xl break-words text-2xl font-bold leading-snug tracking-tight text-slate-950 sm:text-3xl">{dossier.procedureName}</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">{dossier.field} · Chuẩn bị giấy tờ để cán bộ kiểm tra trước.</p>
        <dl className="mt-6 grid grid-cols-2 gap-x-4 gap-y-5 border-t border-slate-100 pt-5 xl:grid-cols-4">
          {[
            { label: 'Mã hồ sơ', value: dossier.code, icon: FileText },
            { label: 'Đơn vị phụ trách', value: wardName || (dossier.wardCode ? 'Chưa tải được tên đơn vị' : 'Chưa có thông tin'), icon: Buildings },
            { label: 'Ngày tạo', value: dossier.createdAt, icon: CalendarBlank },
            { label: 'Cập nhật gần nhất', value: dossier.updatedAt, icon: Clock },
          ].map(item => <div key={item.label} className="flex min-w-0 items-start gap-2.5"><item.icon size={18} className="mt-0.5 shrink-0 text-slate-400" aria-hidden /><div className="min-w-0"><dt className="text-xs text-slate-500">{item.label}</dt><dd className="mt-1 break-words text-sm font-semibold text-slate-800">{item.value}</dd></div></div>)}
        </dl>
      </div>
      <ol aria-label="Các bước tiền kiểm" className="grid grid-cols-3 border-t border-slate-200 bg-slate-50/80 px-3 py-4 sm:px-7">
        {['Chuẩn bị giấy tờ', 'Gửi tiền kiểm', 'Nhận phản hồi'].map((label, index) => <li key={label} aria-current={currentStep === index ? 'step' : undefined} className="flex flex-col items-center gap-2 text-center text-xs sm:flex-row sm:justify-center sm:text-sm"><span className={`grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold ${index < currentStep ? 'bg-emerald-100 text-emerald-800' : index === currentStep ? 'bg-red-800 text-white' : 'border border-slate-200 bg-white text-slate-400'}`}>{index < currentStep ? <CheckCircle size={18} weight="bold" aria-hidden /> : index + 1}</span><span className={index === currentStep ? 'font-semibold text-slate-900' : 'text-slate-500'}>{label}</span></li>)}
      </ol>
      {contents.isSuccess && dossier.checklist !== undefined && <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-5 py-3 text-xs xl:hidden"><span className="text-slate-600">Giấy tờ bắt buộc: <strong className="text-slate-900">{readyCount}/{required.length}</strong></span><a href="#dossier-next-step" className="inline-flex min-h-11 items-center gap-1 font-semibold text-red-800 underline underline-offset-4">Xem bước tiếp theo<ArrowRight size={14} aria-hidden /></a></div>}
    </section>
    <div className="grid min-w-0 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
      <div className="min-w-0 space-y-5">
        {revising && <section aria-label="Yêu cầu bổ sung" className="space-y-4 rounded-2xl border border-amber-200 bg-amber-50/50 p-5 sm:p-6">
          <div className="flex items-start gap-3"><ChatText size={22} className="shrink-0 text-amber-700" aria-hidden /><div><h3 className="font-bold text-slate-900">Nội dung cần bổ sung</h3><p className="mt-1 text-sm text-slate-600">Đọc ý kiến của cán bộ, sửa các mục bên dưới rồi gửi lại hồ sơ.</p></div></div>
          {commentsQuery.isError ? <div role="alert" className="space-y-2"><p className="text-sm text-red-800">Chưa tải được ý kiến của cán bộ.</p><Button variant="outline" size="small" onClick={() => void commentsQuery.refetch()}>Tải lại ý kiến</Button></div> : commentsQuery.isPending ? <p role="status" className="text-sm text-slate-600">Đang tải ý kiến của cán bộ…</p> : !openComments.length ? <p className="text-sm text-slate-600">Vui lòng xem ghi chú của cán bộ và kiểm tra lại giấy tờ trước khi gửi lại.</p> : openComments.map((comment, index) => <article key={comment.id} className="space-y-2 rounded-xl border border-amber-200 bg-white p-4"><p className="text-sm font-semibold text-slate-900">{index + 1}. {comment.fieldLabel || (comment.targetType === 'FORM_FIELD' ? 'Thông tin đã kê khai' : 'Giấy tờ đính kèm')}</p><p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-700">{comment.commentText || 'Chưa có nội dung hướng dẫn.'}</p><p className="text-xs text-slate-500">{new Date(comment.createdAt).toLocaleString('vi-VN')}</p>{comment.targetType === 'CHECKLIST_ITEM' && comment.targetId && <Button variant="ghost" size="small" className="-ml-3 text-red-800" onClick={() => goToPaper(comment.targetId)}>Đến mục cần chỉnh sửa<ArrowRight size={16} aria-hidden /></Button>}</article>)}
          {!!resolvedComments.length && <p className="text-sm text-slate-600">{resolvedComments.length} ý kiến trước đó đã được xử lý.</p>}
        </section>}
        {dossier.officerNote && <section className="rounded-2xl border border-slate-200 bg-white p-5"><h3 className="flex items-center gap-2 text-sm font-bold text-slate-900"><ChatText size={18} aria-hidden />{dossier.status === 'Đã từ chối' ? 'Lý do từ chối' : 'Ghi chú của cán bộ'}</h3><p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-600">{dossier.officerNote}</p>{dossier.officerName && <p className="mt-3 text-xs text-slate-500">Cán bộ phụ trách: {dossier.officerName}</p>}</section>}
        <section aria-labelledby="dossier-papers-title" className="min-w-0 rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-start gap-3 border-b border-slate-100 p-5 sm:p-6"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-red-50 text-red-800"><FileText size={22} aria-hidden /></span><div><h3 id="dossier-papers-title" className="text-lg font-bold text-slate-900">Giấy tờ và biểu mẫu</h3><p className="mt-1 text-sm leading-relaxed text-slate-500">{preparing ? 'Chuẩn bị từng mục bên dưới. Với bản khai trực tuyến, hãy lưu và xác nhận sau khi kiểm tra nội dung.' : 'Xem lại các bản khai và giấy tờ đã lưu trong hồ sơ.'}</p></div></div>
          <div className="p-4 sm:p-6">{dossier.checklist === undefined ? <p role="status" className="text-sm text-slate-600">Chưa tải được danh sách giấy tờ. Vui lòng quay lại danh sách và mở lại hồ sơ.</p> : <DossierChecklistView procedureName={dossier.procedureName} cases={dossier.cases || []} checklist={dossier.checklist} applicationId={dossier.id} caseCode={dossier.caseCode} dossierStatus={dossier.status} onUpdateChecklistItem={onUpdateChecklistItem} onBusyChange={setDocumentBusy} />}</div>
        </section>
        {dossier.id && dossier.status === 'Đã duyệt' && <GeneratedDocumentsPanel applicationId={dossier.id} />}
        <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-4"><ShieldCheck size={20} className="mt-0.5 shrink-0 text-slate-500" aria-hidden /><div className="text-sm leading-relaxed text-slate-600"><p className="font-semibold text-slate-800">Về tiền kiểm hồ sơ</p><p className="mt-1">Cán bộ kiểm tra trước giấy tờ và thông tin bạn đã chuẩn bị. Kết quả tiền kiểm <strong className="font-semibold">không thay thế việc tiếp nhận hồ sơ chính thức</strong> tại Bộ phận Một cửa.</p></div></div>
      </div>
      <aside id="dossier-next-step" tabIndex={-1} aria-label="Tiến độ và bước tiếp theo" className="scroll-mt-24 space-y-4 focus:outline-red-700 xl:sticky xl:top-24">
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5"><p className="text-xs font-bold uppercase tracking-wider text-slate-500">{preparing ? 'Việc cần làm' : 'Trạng thái hồ sơ'}</p><h3 className="mt-2 text-lg font-bold text-slate-900">{preparing ? 'Hoàn thiện hồ sơ' : statusLabel}</h3></div>
          <div className="space-y-4 p-5">
            {contents.isPending ? <p role="status" className="text-sm text-slate-500">Đang kiểm tra giấy tờ…</p> : contents.isError ? <div role="alert" className="space-y-2"><p className="text-sm text-red-800">Chưa kiểm tra được giấy tờ đã lưu.</p><Button variant="outline" size="small" onClick={() => void contents.refetch()}>Kiểm tra lại</Button></div> : dossier.checklist === undefined ? <p className="text-sm text-slate-500">Cần tải danh sách giấy tờ trước khi gửi.</p> : <>
              <div className="flex items-baseline justify-between gap-2"><span className="text-sm text-slate-600">Giấy tờ bắt buộc</span><span className="text-xl font-bold tabular-nums text-slate-900">{readyCount}<span className="text-sm font-normal text-slate-400"> / {required.length}</span></span></div>
              {!!required.length && <div role="progressbar" aria-label="Giấy tờ bắt buộc đã hoàn tất" aria-valuemin={0} aria-valuemax={required.length} aria-valuenow={readyCount} className="h-2 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full transition-[width] ${missing.length ? 'bg-red-800' : 'bg-emerald-600'}`} style={{ width: `${readyCount / required.length * 100}%` }} /></div>}
              {preparing && !!missing.length ? <><p className="text-sm leading-relaxed text-slate-600">Còn {missing.length} mục cần hoàn tất trước khi gửi:</p><ul className="space-y-1">{missing.map(item => <li key={item.checklistId}><button type="button" className="flex min-h-11 w-full items-start gap-2 rounded-lg px-2 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 focus-visible:outline-red-700" onClick={() => goToPaper(item.checklistId)}><span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-amber-500" /><span className="min-w-0 flex-1 break-words">{item.itemName}</span><ArrowRight size={16} className="mt-0.5 shrink-0 text-slate-400" aria-hidden /></button></li>)}</ul></> : preparing ? <p className="flex items-start gap-2 text-sm leading-relaxed text-emerald-800"><CheckCircle size={18} className="mt-0.5 shrink-0" aria-hidden />Đã đủ giấy tờ bắt buộc. Bạn có thể gửi để cán bộ kiểm tra.</p> : <p className="text-sm leading-relaxed text-slate-600">{approved ? 'Hồ sơ đã được duyệt tiền kiểm. Vui lòng chuẩn bị giấy tờ bản giấy khi đến Bộ phận Một cửa.' : dossier.status === 'Đã từ chối' ? 'Vui lòng xem lý do của cán bộ. Nếu cần, liên hệ đơn vị phụ trách để được hướng dẫn.' : 'Hồ sơ đã được gửi đến cán bộ để kiểm tra. Giấy tờ đang được khóa chỉnh sửa; mã QR chưa được cấp ở bước này.'}</p>}
            </>}
            {preparing && <div className="space-y-3 border-t border-slate-100 pt-4"><Button className="w-full gap-2" loading={submitting} disabled={!canSend} onClick={openConfirm}><PaperPlaneTilt size={18} aria-hidden />{revising ? 'Gửi lại hồ sơ đã sửa' : 'Gửi hồ sơ tiền kiểm'}</Button><p className="text-xs leading-relaxed text-slate-500">{documentBusy ? 'Hãy lưu và đóng bản khai đang mở trước khi gửi.' : mutating || submitting ? 'Vui lòng chờ thao tác hiện tại hoàn tất.' : missing.length ? 'Hoàn tất các mục còn thiếu để mở nút gửi hồ sơ.' : 'Sau khi gửi, bạn chỉ có thể sửa khi cán bộ yêu cầu bổ sung.'}</p></div>}
          </div>
        </section>
        {preparing && <div className="flex items-start gap-2.5 px-2 text-xs leading-relaxed text-slate-500"><Info size={17} className="mt-0.5 shrink-0" aria-hidden /><p>Bản khai và giấy tờ được lưu khi bạn thực hiện thao tác lưu hoặc tải lên. Bạn có thể quay lại hồ sơ để tiếp tục chuẩn bị.</p></div>}
      </aside>
    </div>
    <Modal open={confirmOpen} onOpenChange={open => { if (!submitting && !mutating) setConfirmOpen(open); }} title={revising ? 'Xác nhận gửi lại hồ sơ' : 'Xác nhận gửi tiền kiểm'} description="Kiểm tra tài liệu trước khi gửi. Sau khi gửi, tài liệu sẽ được khóa chỉnh sửa.">
      <div className="space-y-4">{contents.isPending && <p role="status">Đang kiểm tra giấy tờ…</p>}{contents.isError && <p role="alert">Chưa tải được giấy tờ. Vui lòng thử lại.</p>}{!!missing.length && <p role="alert">Còn {missing.length} mục bắt buộc chưa đủ giấy tờ. Đóng hộp thoại để bổ sung.</p>}<label className="flex gap-3 text-sm leading-relaxed"><input type="checkbox" checked={acknowledged} disabled={submitting} onChange={e => setAcknowledged(e.target.checked)} className="mt-0.5 size-5 shrink-0 accent-red-800" />Tôi đã kiểm tra thông tin và hiểu rằng đây là yêu cầu tiền kiểm, chưa phải nộp hồ sơ hành chính chính thức.</label>{sendError && <p role="alert" className="text-sm text-red-800">{sendError}</p>}<Button loading={submitting} disabled={!acknowledged || !canSend} onClick={async () => { setSendError(''); try { if (revising) await onResubmitPrecheck?.(); else await onSubmitPrecheck(); setConfirmOpen(false); } catch (error) { setSendError(workflowError(error)); await contents.refetch(); } }}>Xác nhận gửi</Button></div>
    </Modal>
  </div>;
}
