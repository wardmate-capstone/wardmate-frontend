import { useState } from 'react';
import { personName } from '@/lib/personName';
import { useQuery } from '@tanstack/react-query';
import { Button, Modal, RefreshButton } from '@/components/ui';
import { staffingApi, type Consultation, type ConsultationDecision, type DispatchApplication } from '@/lib/api/staffing';
import { officerBlockers } from '@/lib/api/staffingError';
import { documentFormApi } from '@/lib/api/documentForms';
import { DocumentFilePreview } from '@/components/documents/DocumentFilePreview';
import { ActionForm, StaffHeading, StaffStatus, dateText, fieldClass, Pager, QueryState, useStaffAccess, useStaffDirectory, useStaffQuery } from './shared';

function ConsultationDocuments({ applicationId }: { applicationId: string }) {
  const { user } = useStaffAccess();
  const access = useQuery({ queryKey: ['staffing', user?.id, 'document-access', applicationId], queryFn: ({ signal }) => staffingApi.documentAccess(applicationId, signal), enabled: Boolean(user), retry: false, refetchInterval: 15000, refetchOnWindowFocus: 'always', refetchOnReconnect: 'always' });
  const contents = useStaffQuery(['contents', applicationId, access.data?.version], signal => documentFormApi.getContents(applicationId, signal), access.isSuccess && access.data.allowed && access.isFetchedAfterMount);
  const [selected, setSelected] = useState<{ id: string; fileName: string; form: boolean; version: number }>();
  return <section className="space-y-3"><h3 className="font-bold">Tài liệu chỉ đọc</h3><p className="text-sm text-slate-600">Hồ sơ ở chế độ tham khảo chuyên môn. Bạn có thể xem chi tiết nhưng không chỉnh sửa thay cán bộ phụ trách.</p><QueryState query={access} />
    {access.isSuccess && !access.data.allowed && <p role="alert">Bạn không còn quyền xem tài liệu.</p>}
    {access.isSuccess && access.data.allowed && access.isFetchedAfterMount && <><p className="text-sm text-amber-800">Nếu tệp bị từ chối truy cập, vui lòng liên hệ quản trị viên để kiểm tra quyền xem.</p><QueryState query={contents} />{!contents.isError && contents.data && [...contents.data.submissions.map(d => ({ ...d, form: true })), ...contents.data.supportingDocuments.map(d => ({ ...d, form: false }))].map(d => <div key={d.id} className="rounded-lg border p-3"><Button variant="outline" disabled={!d.fileExists} onClick={() => setSelected({ ...d, version: access.data.version })}>{d.fileName}{!d.fileExists ? ' (tệp không khả dụng)' : ''}</Button></div>)}
      {selected && selected.version === access.data.version && <DocumentFilePreview key={`${selected.id}-${selected.version}`} fileId={selected.id} fileName={selected.fileName} revision={`consultation-${applicationId}-${selected.version}`} accessDeniedMessage={selected.form ? 'API tải tờ khai Word hiện chỉ cho cán bộ phụ trách hồ sơ truy cập, chưa hỗ trợ chuyên viên tham vấn. Vui lòng nhờ cán bộ phụ trách kiểm tra tài liệu hoặc báo quản trị viên để xử lý quyền trên dịch vụ tài liệu.' : 'Dịch vụ tài liệu từ chối quyền xem giấy tờ này. Vui lòng báo quản trị viên kiểm tra quyền tham vấn.'} load={async signal => {
        const latest = await staffingApi.documentAccess(applicationId, signal);
        if (!latest.allowed || latest.version !== access.data.version) { setSelected(undefined); throw new Error('Quyền hoặc phiên bản tài liệu đã thay đổi. Vui lòng tải lại.'); }
        return selected.form ? documentFormApi.officerDownloadSubmission(selected.id, signal) : documentFormApi.downloadSupportingDocument(selected.id, signal);
      }} />}
    </>}
  </section>;
}
// Ngữ cảnh hồ sơ cán bộ phụ trách đang mở: dùng để gửi yêu cầu tham vấn (STAFFING-01)
type RequestContext = { status?: string | null; assignedOfficerId?: string | null; assignmentVersion?: number | null };
export function ApplicationConsultations({ applicationId, context }: { applicationId: string; context?: RequestContext }) {
  const { user, officer, can } = useStaffAccess();
  const query = useStaffQuery(['consultations', applicationId], signal => staffingApi.consultations(applicationId, signal), can('workflow.consultation.read'));
  const [request, setRequest] = useState(false);
  if (!can('workflow.consultation.read')) return <p role="alert">Bạn không có quyền xem tham vấn.</p>;
  // Chỉ cán bộ đang phụ trách hồ sơ đang kiểm tra mới được yêu cầu; mỗi lượt phân công chỉ có một yêu cầu chờ điều phối
  const assignmentVersion = context?.assignmentVersion;
  const assignee = officer && can('workflow.consultation.request') && context?.assignedOfficerId === user?.id && context?.status === 'UNDER_REVIEW' && typeof assignmentVersion === 'number';
  const pending = query.data?.find(item => item.status === 'PENDING_DISPATCH' && item.assignmentVersion === assignmentVersion);
  return <section className="space-y-3"><h3 className="font-bold">Tham vấn chuyên môn</h3>
    <div className="flex flex-wrap gap-2"><RefreshButton loading={query.isFetching} onClick={() => void query.refetch()} />
      {assignee && query.isSuccess && !pending && <Button onClick={() => setRequest(true)}>Yêu cầu tham vấn</Button>}</div>
    {assignee && pending && <p role="note" className="rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-sm leading-6 text-amber-900">Đã gửi yêu cầu tham vấn, đang chờ Quản lý cán bộ chọn cán bộ tư vấn. Bạn vẫn là người phụ trách hồ sơ.</p>}
    <QueryState query={query} empty={!query.data?.length} />{!query.isError && <ConsultationCards items={query.data ?? []} />}
    {request && assignee && <ActionForm title="Yêu cầu tham vấn chuyên môn" description="Quản lý cán bộ sẽ chọn cán bộ cùng lĩnh vực để góp ý. Bạn vẫn phụ trách hồ sơ cho đến khi Quản lý cán bộ quyết định khác." fields={[{ name: 'question', label: 'Nội dung cần tham vấn', type: 'textarea', max: 4000 }]}
      submit={v => staffingApi.requestConsultation(applicationId, { expectedAssignmentVersion: assignmentVersion as number, question: v.question })} onClose={() => setRequest(false)} />}
  </section>;
}
const decisionText: Record<string, string> = { DECLINE_REQUEST: 'Từ chối yêu cầu', KEEP_ASSIGNEE: 'Giữ cán bộ đang phụ trách', TRANSFER_TO_SPECIALIST: 'Chuyển hồ sơ cho cán bộ tư vấn' };
type CardAction = { item: Consultation; kind: 'answer' | 'close' | 'dispatch' | ConsultationDecision };
// Đọc lại tham vấn ngay trước khi gửi để không ghi đè thao tác vừa xảy ra ở tab/người khác
async function latestOf(item: Consultation) {
  const latest = (await staffingApi.consultations(item.applicationId)).find(row => row.id === item.id);
  if (!latest || latest.version !== item.version || latest.status !== item.status) throw new Error('Tham vấn đã thay đổi. Đóng biểu mẫu và tải lại trước khi gửi.');
  return latest;
}
function DispatchDialog({ item, onClose }: { item: Consultation; onClose: () => void }) {
  const candidates = useStaffQuery(['specialist-candidates', item.applicationId], signal => staffingApi.specialistCandidates(item.applicationId, signal));
  const ready = !candidates.isFetching && !candidates.isError && !!candidates.data;
  const options = [...(candidates.data ?? [])].sort((a, b) => Number(b.eligible) - Number(a.eligible)).map(c => ({
    value: c.officerId, label: c.fullName || 'Cán bộ chưa cập nhật tên', disabled: !c.eligible,
    group: c.eligible ? 'Có thể tư vấn' : 'Chưa đủ điều kiện',
    description: c.eligible ? 'Đủ quyền, đúng lĩnh vực và đang trong ca' : c.blockingReasons.map(r => officerBlockers[r] || r).join(' · ') || 'Chưa đủ điều kiện',
  }));
  return <ActionForm title="Chọn cán bộ tư vấn" description={`Hồ sơ ${item.applicationCode || item.applicationId}. Người được chọn chỉ góp ý; cán bộ đang phụ trách không thay đổi.`} onClose={onClose}
    fields={[{ name: 'specialistId', label: 'Cán bộ tư vấn', type: 'listbox', placeholder: 'Chọn cán bộ', options: ready ? options : [] }]}
    validate={() => !ready ? 'Danh sách cán bộ chưa tải xong. Vui lòng thử lại.' : undefined}
    submit={async v => staffingApi.dispatchConsultation(await latestOf(item), v.specialistId)}>
    <QueryState query={candidates} empty={ready && !options.length} />
    {ready && options.length > 0 && !options.some(o => !o.disabled) && <p role="note" className="rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-sm text-amber-900">Hiện chưa có cán bộ đủ điều kiện. Kiểm tra ca làm, lĩnh vực và quyền của cán bộ, hoặc từ chối yêu cầu kèm lý do.</p>}
  </ActionForm>;
}
function ConsultationCards({ items, onViewApplication }: { items: Consultation[]; onViewApplication?: (id: string) => void }) {
  const { user, manager, officer, can } = useStaffAccess();
  const [action, setAction] = useState<CardAction>();
  const [documents, setDocuments] = useState<string>();
  const dispatcher = manager && can('workflow.dispatch.write');
  const close = () => setAction(undefined);
  // Tham vấn do cán bộ yêu cầu (có dispatchedBy) chỉ chuyển được khi cán bộ tư vấn đồng ý nhận; tham vấn Quản lý cán bộ tự mở thì không cần
  const canTransfer = (item: Consultation) => item.willingToTakeOver === true || !item.dispatchedBy;
  const renderForm = ({ item, kind }: CardAction) => {
    if (kind === 'dispatch') return dispatcher ? <DispatchDialog item={item} onClose={close} /> : null;
    if (kind === 'answer') return officer && can('workflow.consultation.respond') && item.specialistId === user?.id ? <ActionForm title="Trả lời tham vấn" defaultValues={{ text: '', willing: 'no' }}
      fields={[{ name: 'text', label: 'Ý kiến chuyên môn', type: 'textarea', max: 4000 }, { name: 'willing', label: 'Đề nghị về hồ sơ', type: 'select', options: [{ value: 'no', label: 'Chỉ góp ý, không nhận hồ sơ' }, { value: 'yes', label: 'Tôi sẵn sàng tiếp nhận hồ sơ' }] }]}
      submit={async v => staffingApi.answer(await latestOf(item), v.text, v.willing === 'yes')} onClose={close} /> : null;
    if (!dispatcher) return null;
    const description = kind === 'TRANSFER_TO_SPECIALIST' ? `Người phụ trách hồ sơ sẽ chuyển sang ${item.specialistId ? personName(item.specialistId, item.specialistName) : 'cán bộ tư vấn'}. Hệ thống kiểm tra lại ca làm, quyền và lĩnh vực khi lưu và ghi vào lịch sử phân công.`
      : kind === 'KEEP_ASSIGNEE' ? 'Cán bộ đang phụ trách tiếp tục xử lý hồ sơ theo góp ý đã nhận.'
      : kind === 'DECLINE_REQUEST' ? 'Yêu cầu sẽ đóng mà không giao cho cán bộ tư vấn. Người gửi sẽ thấy lý do.' : undefined;
    return <ActionForm title={kind === 'close' ? 'Đóng tham vấn' : decisionText[kind]} description={description} fields={[{ name: 'text', label: kind === 'close' ? 'Lý do đóng' : 'Lý do quyết định', type: 'textarea', max: 4000 }]}
      submit={async v => {
        const latest = await latestOf(item);
        // Chuyển hồ sơ: BE yêu cầu revision phân công của hồ sơ trùng với revision lúc mở tham vấn
        return kind === 'close' ? staffingApi.close(latest, v.text) : staffingApi.close(latest, v.text, kind, latest.assignmentVersion);
      }} onClose={close} />;
  };
  return <div className="grid min-w-0 gap-4">{items.map(item => <article key={item.id} className="staff-card"><div className="staff-card-heading"><StaffStatus value={item.status} /><time dateTime={item.createdAtUtc} className="text-sm text-slate-500">{dateText(item.createdAtUtc)}</time></div>
    <div className="staff-note"><span className="staff-meta">Câu hỏi tham vấn</span><h3 className="!font-semibold">{item.question}</h3></div>
    {item.answer && <div className="staff-note rounded-lg border border-emerald-100 bg-emerald-50 p-4"><span className="staff-meta">Ý kiến chuyên môn</span><p>{item.answer}</p>{item.dispatchedBy && <p className="mt-2 text-sm font-medium text-emerald-900">{item.willingToTakeOver ? 'Cán bộ tư vấn sẵn sàng tiếp nhận hồ sơ.' : 'Cán bộ tư vấn chỉ góp ý, không đề nghị nhận hồ sơ.'}</p>}</div>}
    {item.decision && <div className="staff-note"><span className="staff-meta">Quyết định</span><p className="font-semibold">{decisionText[item.decision] || item.decision}</p></div>}
    {item.closeReason && <div className="staff-note"><span className="staff-meta">{item.decision ? 'Lý do quyết định' : 'Lý do đóng'}</span><p>{item.closeReason}</p></div>}
    <dl className="staff-consult-meta"><div><dt>Hồ sơ</dt><dd>{item.applicationCode || <span title={item.applicationId}>Chưa có mã hồ sơ</span>}</dd></div><div><dt>Người hỏi</dt><dd>{personName(item.requestedBy, item.requestedByName)}</dd></div><div><dt>Người được hỏi</dt><dd>{item.specialistId ? personName(item.specialistId, item.specialistName) : 'Chờ chọn cán bộ'}</dd></div>{item.status === 'CLOSED' && item.closedByName && <div><dt>Người đóng</dt><dd>{item.closedByName}</dd></div>}</dl>
    {dispatcher && item.status === 'ANSWERED' && !canTransfer(item) && <p role="note" className="text-sm text-slate-600">Cán bộ tư vấn chưa đồng ý nhận hồ sơ nên chỉ có thể giữ cán bộ đang phụ trách.</p>}
    <div className="staff-card-footer">
    {onViewApplication && <Button variant="outline" onClick={() => onViewApplication(item.applicationId)}>Xem tham vấn cùng hồ sơ</Button>}
    {officer && item.specialistId === user?.id && item.status === 'OPEN' && can('workflow.consultation.respond') && <Button onClick={() => setAction({ item, kind: 'answer' })}>Trả lời</Button>}
    {dispatcher && item.status === 'PENDING_DISPATCH' && <><Button onClick={() => setAction({ item, kind: 'dispatch' })}>Chọn cán bộ tư vấn</Button><Button variant="outline" onClick={() => setAction({ item, kind: 'DECLINE_REQUEST' })}>Từ chối yêu cầu</Button></>}
    {dispatcher && item.status === 'OPEN' && <Button variant="outline" onClick={() => setAction({ item, kind: 'close' })}>Đóng tham vấn</Button>}
    {dispatcher && item.status === 'ANSWERED' && <><Button variant="outline" onClick={() => setAction({ item, kind: 'KEEP_ASSIGNEE' })}>Giữ cán bộ phụ trách</Button>{canTransfer(item) && <Button onClick={() => setAction({ item, kind: 'TRANSFER_TO_SPECIALIST' })}>Chuyển hồ sơ cho cán bộ tư vấn</Button>}</>}
    {officer && item.specialistId === user?.id && item.status !== 'CLOSED' && can('workflow.consultation.respond') && <Button variant="outline" onClick={() => setDocuments(item.applicationId)}>Xem tài liệu</Button>}
  </div></article>)}
    {action && renderForm(action)}
    {documents && officer && can('workflow.consultation.respond') && <Modal open onOpenChange={open => !open && setDocuments(undefined)} title="Tài liệu tham vấn" className="sm:max-w-4xl"><ConsultationDocuments applicationId={documents} /></Modal>}
  </div>;
}
export function ConsultationPanel({ application }: { application: DispatchApplication }) {
  const { manager, can } = useStaffAccess();
  const query = useStaffQuery(['consultations', application.id], signal => staffingApi.consultations(application.id, signal));
  const [create, setCreate] = useState(false);
  const directory = useStaffDirectory(create && manager);
  return <section className="space-y-3"><RefreshButton label="Làm mới tham vấn" loading={query.isFetching} onClick={() => void query.refetch()} />
    {manager && can('workflow.dispatch.write') && application.status === 'UNDER_REVIEW' && application.assignedOfficerId && <Button onClick={() => setCreate(true)}>Gửi yêu cầu tham vấn</Button>}
    {/* Backend chỉ cho tham vấn hồ sơ đang kiểm tra và đã có cán bộ phụ trách: giải thích khi chưa đủ điều kiện */}
    {manager && can('workflow.dispatch.write') && (application.status !== 'UNDER_REVIEW' || !application.assignedOfficerId) && <p role="note" className="rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-sm leading-6 text-amber-900">
      Chỉ gửi được yêu cầu tham vấn khi hồ sơ <strong>đang kiểm tra</strong> và <strong>đã có cán bộ phụ trách</strong>.
      {!application.assignedOfficerId ? ' Hồ sơ này chưa được phân công: đóng hộp thoại và bấm "Phân công" cho một cán bộ trước.' : ' Hồ sơ này không còn ở bước kiểm tra nên không tạo tham vấn mới được.'}
    </p>}
    <QueryState query={query} empty={!query.data?.length} />{!query.isError && <ConsultationCards items={query.data ?? []} />}
    {create && <ActionForm title="Gửi yêu cầu tham vấn" description="Hệ thống sẽ chuyển yêu cầu đến chuyên viên cùng lĩnh vực đang trong ca trực để hỗ trợ giải đáp." fields={[
      { name: 'specialistId', label: 'Chuyên viên', type: 'listbox', placeholder: 'Chọn chuyên viên', options: directory.isError || directory.isFetching ? [] : directory.data?.filter(o => o.isActive && o.roles.includes('FRONT_DESK_OFFICER') && !o.roles.includes('MANAGER') && o.id !== application.assignedOfficerId && (!application.procedureCategoryId || o.assignedCategories.includes(application.procedureCategoryId))).map(o => ({ value: o.id, label: o.fullName || o.username })) },
      { name: 'question', label: 'Câu hỏi', type: 'textarea', max: 4000 },
    ]} validate={v => directory.isFetching || directory.isError || !directory.data?.some(o => o.id === v.specialistId) ? 'Danh sách cán bộ chưa tải xong. Vui lòng thử lại.' : undefined} submit={v => staffingApi.createConsultation(application.id, { specialistId: v.specialistId, expectedAssignmentVersion: application.assignmentVersion, question: v.question })} onClose={() => setCreate(false)}><QueryState query={directory} /></ActionForm>}
  </section>;
}
const inboxFilters = [{ value: '', label: 'Tất cả trạng thái' }, { value: 'PENDING_DISPATCH', label: 'Chờ điều phối' }, { value: 'OPEN', label: 'Chờ trả lời' }, { value: 'ANSWERED', label: 'Đã trả lời' }, { value: 'CLOSED', label: 'Đã đóng' }];
export function ConsultationsView() {
  const { manager, can } = useStaffAccess();
  const [page, setPage] = useState(1);
  // Quản lý cán bộ mở hộp thư thấy ngay các yêu cầu đang chờ điều phối
  const [status, setStatus] = useState(manager ? 'PENDING_DISPATCH' : '');
  const query = useStaffQuery(['inbox', status, page], signal => staffingApi.inbox(page, signal, status), can('workflow.consultation.read'));
  const [applicationId, setApplicationId] = useState<string>();
  const byApplication = useStaffQuery(['consultations', applicationId], signal => staffingApi.consultations(applicationId!, signal), Boolean(applicationId) && can('workflow.consultation.read'));
  if (!can('workflow.consultation.read')) return <p role="alert">Bạn không có quyền xem tham vấn.</p>;
  return <section className="staff-workspace"><StaffHeading title="Hộp thư tham vấn chuyên môn" description="Quản lý cán bộ xem và điều phối tham vấn trong phường; cán bộ xem tham vấn mình đã gửi hoặc được giao.">
    <label className="grid gap-1 text-sm font-medium">Trạng thái<select className={fieldClass} value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>{inboxFilters.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}</select></label>
    <RefreshButton loading={query.isFetching} onClick={() => void query.refetch()} /></StaffHeading><QueryState query={query} empty={!query.data?.items.length} />{!query.isError && !query.isPending && <ConsultationCards items={query.data?.items ?? []} onViewApplication={setApplicationId} />}<Pager page={page} total={query.data?.total ?? 0} setPage={setPage} />
    {applicationId && <Modal open onOpenChange={v => !v && setApplicationId(undefined)} title="Tham vấn theo hồ sơ"><QueryState query={byApplication} empty={!byApplication.data?.length} />{!byApplication.isError && <ConsultationCards items={byApplication.data ?? []} />}</Modal>}
  </section>;
}
