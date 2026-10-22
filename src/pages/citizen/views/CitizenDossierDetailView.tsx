import { useState } from 'react';
import { useIsMutating } from '@tanstack/react-query';
import { Badge, Button, Modal, Skeleton } from '@/components/ui';
import { useApplicationContents } from '@/hooks/useDocumentForms';
import { hasChecklistEvidence } from '@/lib/documentEvidence';
import { workflowError } from '@/lib/api/workflow';
import { ArrowLeft, ArrowRight, CheckCircle, ChatText, FileText, Buildings, CalendarBlank, Clock, PaperPlaneTilt, ShieldCheck, Trash } from '@phosphor-icons/react';
import { DossierChecklistView } from '../components/DossierChecklistView';
import { GeneratedDocumentsPanel } from '../components/GeneratedDocumentsPanel';
import type { CitizenDossier } from '../types';
import { useApplicationComments, useCancelApplicationMutation } from '@/hooks/useWorkflow';
import { toast } from '@/components/ui/Toast';

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
  const cancelMutation = useCancelApplicationMutation();
  const comments = commentsQuery.data ?? [];
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [documentBusy, setDocumentBusy] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [sendError, setSendError] = useState('');
  const contents = useApplicationContents(dossier.id);
  const mutating = useIsMutating() > 0 || documentBusy;
  const preparing = ['Bản nháp', 'Cần chỉnh sửa'].includes(dossier.status);
  const revising = dossier.status === 'Cần chỉnh sửa';
  const approved = dossier.status === 'Giấy tờ sẵn sàng' || dossier.status === 'Đã duyệt' || dossier.status === 'Đã hoàn thành';
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
    <div className="flex items-center justify-between gap-3">
      <Button variant="ghost" className="-ml-3 gap-2 px-3 text-slate-600" onClick={onBack}><ArrowLeft size={18} aria-hidden />Quay lại danh sách</Button>
    </div>
    <section aria-label="Thông tin hồ sơ" className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs">
      <div className="p-5 sm:p-6">
        <div className="mb-2.5 flex flex-wrap items-center gap-2.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Hồ sơ tiền kiểm</span>
          <Badge variant={approved ? 'success' : revising ? 'warning' : dossier.status === 'Đã từ chối' ? 'danger' : 'neutral'} className="text-xs">
            {statusLabel}
          </Badge>
          {(dossier.currentVersion ?? 0) > 0 && <span className="text-xs text-slate-400">v{dossier.currentVersion}</span>}
        </div>
        <h2 className="max-w-4xl break-words text-xl font-bold leading-snug tracking-tight text-slate-950 sm:text-2xl">
          {dossier.procedureName}
        </h2>
        <p className="mt-1 text-xs text-slate-500 font-medium">
          {dossier.field}
        </p>

        <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 sm:grid-cols-4 text-xs">
          {[
            { label: 'Mã hồ sơ', value: dossier.code, icon: FileText },
            { label: 'Đơn vị phụ trách', value: wardName || (dossier.wardCode ? 'Chưa tải được tên đơn vị' : 'Chưa có thông tin'), icon: Buildings },
            { label: 'Ngày tạo', value: dossier.createdAt, icon: CalendarBlank },
            { label: 'Cập nhật', value: dossier.updatedAt, icon: Clock },
          ].map(item => (
            <div key={item.label} className="flex min-w-0 items-start gap-2">
              <item.icon size={16} className="mt-0.5 shrink-0 text-slate-400" aria-hidden />
              <div className="min-w-0">
                <dt className="text-[11px] text-slate-400">{item.label}</dt>
                <dd className="mt-0.5 break-words font-semibold text-slate-800">{item.value}</dd>
              </div>
            </div>
          ))}
        </dl>
      </div>

      <ol aria-label="Các bước tiền kiểm" className="grid grid-cols-3 border-t border-slate-200 bg-slate-50/60 px-3 py-3 sm:px-6">
        {['Chuẩn bị giấy tờ', 'Gửi tiền kiểm', 'Nhận phản hồi'].map((label, index) => (
          <li key={label} aria-current={currentStep === index ? 'step' : undefined} className="flex flex-col items-center gap-1.5 text-center text-xs sm:flex-row sm:justify-center sm:text-xs">
            <span className={`grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-bold ${index < currentStep ? 'bg-emerald-100 text-emerald-800' : index === currentStep ? 'bg-red-800 text-white' : 'border border-slate-200 bg-white text-slate-400'}`}>
              {index < currentStep ? <CheckCircle size={15} weight="bold" aria-hidden /> : index + 1}
            </span>
            <span className={index === currentStep ? 'font-semibold text-slate-900' : 'text-slate-500'}>{label}</span>
          </li>
        ))}
      </ol>
      {contents.isSuccess && dossier.checklist !== undefined && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-5 py-2.5 text-xs xl:hidden">
          <span className="text-slate-600">Giấy tờ bắt buộc: <strong className="text-slate-900">{readyCount}/{required.length}</strong></span>
          <a href="#dossier-next-step" className="inline-flex min-h-11 items-center gap-1 font-semibold text-red-800 underline underline-offset-4">Xem bước tiếp theo<ArrowRight size={14} aria-hidden /></a>
        </div>
      )}
    </section>

    <div className="grid min-w-0 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
      <div className="min-w-0 space-y-4">
        {revising && (
          <section aria-label="Yêu cầu bổ sung" className="space-y-3 rounded-2xl border border-amber-200 bg-amber-50/50 p-4 sm:p-5">
            <div className="flex items-start gap-2.5">
              <ChatText size={20} className="shrink-0 text-amber-700 mt-0.5" aria-hidden />
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Ý kiến của cán bộ cần hoàn thiện</h3>
                <p className="mt-0.5 text-xs text-slate-600">Sửa lại các mục bên dưới theo hướng dẫn rồi gửi lại hồ sơ.</p>
              </div>
            </div>
            {commentsQuery.isError ? (
              <div role="alert" className="space-y-2"><p className="text-xs text-red-800">Chưa tải được ý kiến của cán bộ.</p><Button variant="outline" size="small" onClick={() => void commentsQuery.refetch()}>Tải lại ý kiến</Button></div>
            ) : commentsQuery.isPending ? (
              <div role="status" aria-label="Đang tải ý kiến cán bộ" className="space-y-2">
                <Skeleton className="h-16 w-full rounded-xl bg-amber-100/60" />
              </div>
            ) : !openComments.length ? (
              <p className="text-xs text-slate-600">Vui lòng xem ghi chú và kiểm tra lại giấy tờ trước khi gửi lại.</p>
            ) : (
              openComments.map((comment, index) => (
                <article key={comment.id} className="space-y-1.5 rounded-xl border border-amber-200 bg-white p-3.5 text-xs">
                  <p className="font-semibold text-slate-900">{index + 1}. {comment.fieldLabel || (comment.targetType === 'FORM_FIELD' ? 'Thông tin kê khai' : 'Giấy tờ đính kèm')}</p>
                  <p className="whitespace-pre-wrap break-words leading-relaxed text-slate-700">{comment.commentText || 'Chưa có nội dung hướng dẫn.'}</p>
                  <div className="flex items-center justify-between pt-1 text-slate-400 text-[11px]">
                    <span>{new Date(comment.createdAt).toLocaleDateString('vi-VN')}</span>
                    {comment.targetType === 'CHECKLIST_ITEM' && comment.targetId && (
                      <Button variant="ghost" size="small" className="-mr-2 text-red-800 text-xs" onClick={() => goToPaper(comment.targetId)}>
                        Đến mục cần sửa<ArrowRight size={14} aria-hidden />
                      </Button>
                    )}
                  </div>
                </article>
              ))
            )}
            {!!resolvedComments.length && <p className="text-xs text-slate-500">{resolvedComments.length} ý kiến trước đó đã xử lý xong.</p>}
          </section>
        )}

        {dossier.officerNote && (
          <section className="rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="flex items-center gap-2 text-xs font-bold text-slate-900">
              <ChatText size={16} aria-hidden />{dossier.status === 'Đã từ chối' ? 'Lý do từ chối' : 'Ghi chú của cán bộ'}
            </h3>
            <p className="mt-1.5 whitespace-pre-wrap break-words text-xs leading-relaxed text-slate-600">{dossier.officerNote}</p>
            {dossier.officerName && <p className="mt-2 text-[11px] text-slate-400">Cán bộ: {dossier.officerName}</p>}
          </section>
        )}

        <section aria-labelledby="dossier-papers-title" className="min-w-0 rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/60 px-5 py-3.5">
            <div className="flex items-center gap-2.5">
              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-red-50 text-red-800">
                <FileText size={18} aria-hidden />
              </span>
              <div>
                <h3 id="dossier-papers-title" className="text-base font-bold text-slate-900">Giấy tờ và biểu mẫu</h3>
                <p className="text-[11px] text-slate-500">Chuẩn bị đầy đủ theo danh mục bên dưới</p>
              </div>
            </div>
            {contents.data && (
              <span className="rounded-full bg-slate-200/70 px-2.5 py-0.5 text-xs font-bold text-slate-700">
                {readyCount}/{required.length} hoàn tất
              </span>
            )}
          </div>
          <div className="p-4 sm:p-5">
            {dossier.checklist === undefined ? (
              <p role="status" className="text-sm text-slate-600">Chưa tải được danh sách giấy tờ. Vui lòng quay lại danh sách và mở lại hồ sơ.</p>
            ) : (
              <DossierChecklistView
                procedureName={dossier.procedureName}
                cases={dossier.cases || []}
                checklist={dossier.checklist}
                applicationId={dossier.id}
                caseCode={dossier.caseCode}
                dossierStatus={dossier.status}
                onUpdateChecklistItem={onUpdateChecklistItem}
                onBusyChange={setDocumentBusy}
              />
            )}
          </div>
        </section>

        {dossier.id && approved && <GeneratedDocumentsPanel applicationId={dossier.id} />}

        {/* Legal notice - sleek and compact */}
        <div className="flex items-center gap-2.5 rounded-xl border border-slate-200/80 bg-slate-50/80 px-4 py-3 text-xs text-slate-600">
          <ShieldCheck size={18} className="shrink-0 text-slate-500" aria-hidden />
          <span>Tiền kiểm giúp rà soát giấy tờ trước khi nộp. Kết quả tiền kiểm <strong className="font-semibold text-slate-700">không thay thế tiếp nhận hồ sơ chính thức</strong> tại UBND cấp xã/phường.</span>
        </div>
      </div>

      {/* Right Column: Progress & Action */}
      <aside id="dossier-next-step" tabIndex={-1} aria-label="Tiến độ và bước tiếp theo" className="scroll-mt-24 space-y-3 focus:outline-red-700 xl:sticky xl:top-24">
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs">
          <div className="border-b border-slate-100 px-5 py-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{preparing ? 'Tiến độ hoàn thiện' : 'Trạng thái hồ sơ'}</p>
            <h3 className="mt-1 text-base font-bold text-slate-900">{preparing ? 'Hoàn thiện hồ sơ' : statusLabel}</h3>
            {dossier.dueAtUtc && dossier.status !== 'Giấy tờ sẵn sàng' && dossier.status !== 'Đã tiếp nhận tại quầy' && (
              <div className="mt-2.5 rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-xs">
                <span className="block text-[11px] font-semibold text-slate-500">Hạn tiền kiểm (45h làm việc):</span>
                <strong className="text-slate-900 block mt-0.5">
                  {new Date(dossier.dueAtUtc).toLocaleString('vi-VN')}
                </strong>
              </div>
            )}
          </div>
          <div className="space-y-4 p-5">
            {contents.isPending ? (
              <div role="status" aria-label="Đang kiểm tra tiến độ giấy tờ" className="space-y-3 py-1">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3.5 w-28" />
                  <Skeleton className="h-4 w-10" />
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
              </div>
            ) : contents.isError ? (
              <div role="alert" className="space-y-2">
                <p className="text-xs text-red-800">Chưa kiểm tra được giấy tờ đã lưu.</p>
                <Button variant="outline" size="small" onClick={() => void contents.refetch()}>Kiểm tra lại</Button>
              </div>
            ) : dossier.checklist === undefined ? (
              <p className="text-xs text-slate-500">Cần tải danh sách giấy tờ trước khi gửi.</p>
            ) : (
              <>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-600">Giấy tờ bắt buộc</span>
                  <span className="text-lg font-bold tabular-nums text-slate-900">
                    {readyCount}<span className="text-xs font-normal text-slate-400">/{required.length}</span>
                  </span>
                </div>
                {!!required.length && (
                  <div role="progressbar" aria-label="Giấy tờ bắt buộc đã hoàn tất" aria-valuemin={0} aria-valuemax={required.length} aria-valuenow={readyCount} className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className={`h-full rounded-full transition-[width] ${missing.length ? 'bg-amber-600' : 'bg-emerald-600'}`} style={{ width: `${(readyCount / required.length) * 100}%` }} />
                  </div>
                )}
                {preparing && !!missing.length ? (
                  <div className="space-y-1.5 pt-1">
                    <p className="text-xs font-medium text-slate-600">Còn {missing.length} mục cần bổ sung:</p>
                    <ul className="space-y-1">
                      {missing.map(item => (
                        <li key={item.checklistId}>
                          <button
                            type="button"
                            className="flex min-h-9 w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-red-700 transition-colors"
                            onClick={() => goToPaper(item.checklistId)}
                          >
                            <span className="truncate">{item.itemName}</span>
                            <ArrowRight size={13} className="shrink-0 text-slate-400" aria-hidden />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : preparing ? (
                  <p className="flex items-center gap-2 text-xs font-semibold text-emerald-800 pt-1">
                    <CheckCircle size={16} className="shrink-0" aria-hidden />
                    Đã đủ giấy tờ bắt buộc!
                  </p>
                ) : (
                  <p className="text-xs leading-relaxed text-slate-600">
                    {approved ? 'Vui lòng chuẩn bị giấy tờ bản giấy khi đến nộp tại Bộ phận Một cửa.' : dossier.status === 'Đã từ chối' ? 'Xem lý do cán bộ từ chối để thực hiện lại.' : 'Hồ sơ đang được cán bộ kiểm tra; giấy tờ đã khóa chỉnh sửa.'}
                  </p>
                )}
              </>
            )}

            {preparing && (
              <div className="space-y-2 border-t border-slate-100 pt-4">
                <Button className="w-full gap-2" loading={submitting} disabled={!canSend} onClick={openConfirm}>
                  <PaperPlaneTilt size={16} aria-hidden />
                  <span>{revising ? 'Gửi lại hồ sơ đã sửa' : 'Gửi hồ sơ tiền kiểm'}</span>
                </Button>
                <Button
                  variant="outline"
                  className="w-full gap-2 border-rose-200 text-rose-700 hover:bg-rose-50 hover:text-rose-800"
                  disabled={submitting || mutating || cancelMutation.isPending}
                  onClick={() => setCancelModalOpen(true)}
                >
                  <Trash size={16} aria-hidden />
                  <span>Hủy hồ sơ tiền kiểm</span>
                </Button>
                <p className="text-[11px] text-center text-slate-400">
                  {documentBusy ? 'Lưu bản khai đang mở trước khi gửi.' : missing.length ? 'Cần đủ giấy tờ để gửi kiểm tra.' : 'Gửi để cán bộ rà soát hồ sơ.'}
                </p>
              </div>
            )}
          </div>
        </section>
      </aside>
    </div>
    <Modal open={confirmOpen} onOpenChange={open => { if (!submitting && !mutating) setConfirmOpen(open); }} title={revising ? 'Xác nhận gửi lại hồ sơ' : 'Xác nhận gửi tiền kiểm'} description="Kiểm tra tài liệu trước khi gửi. Sau khi gửi, tài liệu sẽ được khóa chỉnh sửa.">
      <div className="space-y-4">{contents.isPending && <Skeleton className="h-4 w-48" role="status" aria-label="Đang kiểm tra giấy tờ" />}{contents.isError && <p role="alert">Chưa tải được giấy tờ. Vui lòng thử lại.</p>}{!!missing.length && <p role="alert">Còn {missing.length} mục bắt buộc chưa đủ giấy tờ. Đóng hộp thoại để bổ sung.</p>}<label className="flex gap-3 text-sm leading-relaxed"><input type="checkbox" checked={acknowledged} disabled={submitting} onChange={e => setAcknowledged(e.target.checked)} className="mt-0.5 size-5 shrink-0 accent-red-800" />Tôi đã kiểm tra thông tin và hiểu rằng đây là yêu cầu tiền kiểm, chưa phải nộp hồ sơ hành chính chính thức.</label>{sendError && <p role="alert" className="text-sm text-red-800">{sendError}</p>}<Button loading={submitting} disabled={!acknowledged || !canSend} onClick={async () => { setSendError(''); try { if (revising) await onResubmitPrecheck?.(); else await onSubmitPrecheck(); setConfirmOpen(false); } catch (error) { setSendError(workflowError(error)); await contents.refetch(); } }}>Xác nhận gửi</Button></div>
    </Modal>
    <Modal
      open={cancelModalOpen}
      onOpenChange={open => { if (!cancelMutation.isPending) setCancelModalOpen(open); }}
      title="Xác nhận hủy hồ sơ tiền kiểm"
      description="Hành động này sẽ hủy yêu cầu tiền kiểm của hồ sơ. Hồ sơ đã hủy sẽ được lưu trữ và không thể gửi đi tiếp."
    >
      <div className="space-y-4 text-xs">
        <p className="text-slate-600 leading-relaxed">
          Bạn có chắc chắn muốn hủy hồ sơ <strong>{dossier.code}</strong> ({dossier.procedureName}) không?
        </p>
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <Button
            variant="outline"
            size="small"
            disabled={cancelMutation.isPending}
            onClick={() => setCancelModalOpen(false)}
          >
            Quay lại
          </Button>
          <Button
            variant="outline"
            size="small"
            className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 font-semibold"
            loading={cancelMutation.isPending}
            onClick={async () => {
              if (!dossier.id) return;
              try {
                await cancelMutation.mutateAsync(dossier.id);
                toast.success('Đã hủy hồ sơ tiền kiểm thành công.');
                setCancelModalOpen(false);
                onBack();
              } catch (err) {
                toast.error(workflowError(err));
              }
            }}
          >
            Đồng ý hủy hồ sơ
          </Button>
        </div>
      </div>
    </Modal>
  </div>;
}
