import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button, Modal } from '@/components/ui';
import { staffingApi, type Consultation, type DispatchApplication } from '@/lib/api/staffing';
import { documentFormApi } from '@/lib/api/documentForms';
import { DocumentFilePreview } from '@/components/documents/DocumentFilePreview';
import { ActionForm, dateText, Pager, QueryState, statusText, useStaffAccess, useStaffDirectory, useStaffQuery } from './shared';

function ConsultationDocuments({ applicationId }: { applicationId: string }) {
  const { user } = useStaffAccess();
  const access = useQuery({ queryKey: ['staffing', user?.id, 'document-access', applicationId], queryFn: ({ signal }) => staffingApi.documentAccess(applicationId, signal), enabled: Boolean(user), retry: false, refetchInterval: 15000 });
  const contents = useStaffQuery(['contents', applicationId], signal => documentFormApi.getContents(applicationId, signal), access.isSuccess && access.data.allowed);
  const [selected, setSelected] = useState<{ id: string; fileName: string; form: boolean }>();
  return <section className="space-y-3"><h3 className="font-bold">Tài liệu chỉ đọc</h3><p className="text-sm text-slate-600">Quyền xem được BE kiểm tra lại mỗi lần tải. Không chỉnh sửa hoặc xác nhận thay cán bộ phụ trách.</p><QueryState query={access} />
    {access.isSuccess && !access.data.allowed && <p role="alert">Bạn không còn quyền xem tài liệu.</p>}
    {access.isSuccess && access.data.allowed && access.isFetchedAfterMount && <><p className="text-sm text-amber-800">Nếu tệp bị từ chối truy cập, vui lòng liên hệ quản trị viên để kiểm tra quyền xem.</p><QueryState query={contents} />{!contents.isError && contents.data && [...contents.data.submissions.map(d => ({ ...d, form: true })), ...contents.data.supportingDocuments.map(d => ({ ...d, form: false }))].map(d => <div key={d.id} className="rounded-lg border p-3"><Button variant="outline" disabled={!d.fileExists} onClick={() => setSelected(d)}>{d.fileName}{!d.fileExists ? ' (tệp không khả dụng)' : ''}</Button></div>)}
      {selected && <DocumentFilePreview key={selected.id} fileId={selected.id} fileName={selected.fileName} revision={String(access.data.version)} load={async signal => {
        const latest = await staffingApi.documentAccess(applicationId, signal);
        if (!latest.allowed || latest.version !== access.data.version) { setSelected(undefined); throw new Error('Quyền hoặc phiên bản tài liệu đã thay đổi. Vui lòng tải lại.'); }
        return selected.form ? documentFormApi.officerDownloadSubmission(selected.id, signal) : documentFormApi.downloadSupportingDocument(selected.id, signal);
      }} />}
    </>}
  </section>;
}
export function ApplicationConsultations({ applicationId }: { applicationId: string }) {
  const { can } = useStaffAccess();
  const query = useStaffQuery(['consultations', applicationId], signal => staffingApi.consultations(applicationId, signal), can('workflow.consultation.read'));
  if (!can('workflow.consultation.read')) return <p role="alert">Bạn không có quyền xem tham vấn.</p>;
  return <section className="space-y-3"><h3 className="font-bold">Tham vấn chuyên môn</h3><Button variant="outline" onClick={() => void query.refetch()}>Làm mới</Button><QueryState query={query} empty={!query.data?.length} />{!query.isError && <ConsultationCards items={query.data ?? []} />}</section>;
}
function ConsultationCards({ items }: { items: Consultation[] }) {
  const { user, manager, officer, can } = useStaffAccess();
  const [action, setAction] = useState<{ item: Consultation; close: boolean }>();
  const [documents, setDocuments] = useState<string>();
  return <div className="space-y-3">{items.map(item => <article key={item.id} className="rounded-xl border bg-white p-4 text-sm space-y-2"><div className="flex flex-wrap justify-between gap-2"><strong>{statusText(item.status)}</strong><time>{dateText(item.createdAtUtc)}</time></div><p className="break-all text-slate-500">Hồ sơ: {item.applicationId}</p><p className="whitespace-pre-wrap break-words">Câu hỏi: {item.question}</p>{item.answer && <p className="whitespace-pre-wrap break-words">Ý kiến: {item.answer}</p>}{item.closeReason && <p className="whitespace-pre-wrap break-words">Lý do đóng: {item.closeReason}</p>}<p className="break-all text-slate-500">Người được hỏi: {item.specialistId}</p><div className="flex flex-wrap gap-2">
    {officer && item.specialistId === user?.id && item.status === 'OPEN' && can('workflow.consultation.respond') && <Button onClick={() => setAction({ item, close: false })}>Trả lời</Button>}
    {manager && item.status !== 'CLOSED' && can('workflow.dispatch.write') && <Button variant="outline" onClick={() => setAction({ item, close: true })}>Đóng tham vấn</Button>}
    {officer && item.specialistId === user?.id && item.status !== 'CLOSED' && can('workflow.consultation.respond') && <Button variant="outline" onClick={() => setDocuments(item.applicationId)}>Xem tài liệu</Button>}
  </div></article>)}
    {action && <ActionForm title={action.close ? 'Đóng tham vấn' : 'Trả lời tham vấn'} fields={[{ name: 'text', label: action.close ? 'Lý do đóng' : 'Ý kiến chuyên môn', type: 'textarea', max: 4000 }]} submit={v => action.close ? staffingApi.close(action.item, v.text) : staffingApi.answer(action.item, v.text)} onClose={() => setAction(undefined)} />}
    {documents && <Modal open onOpenChange={open => !open && setDocuments(undefined)} title="Tài liệu tham vấn" className="sm:max-w-4xl"><ConsultationDocuments applicationId={documents} /></Modal>}
  </div>;
}
export function ConsultationPanel({ application }: { application: DispatchApplication }) {
  const { manager, can } = useStaffAccess();
  const query = useStaffQuery(['consultations', application.id], signal => staffingApi.consultations(application.id, signal));
  const [create, setCreate] = useState(false);
  const directory = useStaffDirectory(create && manager);
  return <section className="space-y-3"><Button variant="outline" onClick={() => void query.refetch()}>Làm mới tham vấn</Button>
    {manager && can('workflow.dispatch.write') && application.status === 'UNDER_REVIEW' && application.assignedOfficerId && <Button onClick={() => setCreate(true)}>Gửi yêu cầu tham vấn</Button>}
    <QueryState query={query} empty={!query.data?.length} />{!query.isError && <ConsultationCards items={query.data ?? []} />}
    {create && <ActionForm title="Gửi yêu cầu tham vấn" description="BE kiểm tra chuyên viên cùng phường/lĩnh vực, có quyền trả lời, có ca làm và không nghỉ phép." fields={[
      { name: 'specialistId', label: 'Chuyên viên', type: 'select', options: directory.isError ? [] : directory.data?.filter(o => o.isActive && o.roles.includes('FRONT_DESK_OFFICER') && !o.roles.includes('MANAGER') && o.id !== application.assignedOfficerId && Boolean(application.procedureCategoryId && o.assignedCategories.includes(application.procedureCategoryId))).map(o => ({ value: o.id, label: o.fullName || o.username })) },
      { name: 'question', label: 'Câu hỏi', type: 'textarea', max: 4000 },
    ]} validate={v => directory.isFetching || directory.isError || !directory.data?.some(o => o.id === v.specialistId) ? 'Danh sách cán bộ chưa tải xong. Vui lòng thử lại.' : undefined} submit={v => staffingApi.createConsultation(application.id, { specialistId: v.specialistId, expectedAssignmentVersion: application.assignmentVersion, question: v.question })} onClose={() => setCreate(false)}><QueryState query={directory} /></ActionForm>}
  </section>;
}
export function ConsultationsView() {
  const { can } = useStaffAccess();
  const [page, setPage] = useState(1);
  const query = useStaffQuery(['inbox', page], signal => staffingApi.inbox(page, signal), can('workflow.consultation.read'));
  const [applicationId, setApplicationId] = useState<string>();
  const byApplication = useStaffQuery(['consultations', applicationId], signal => staffingApi.consultations(applicationId!, signal), Boolean(applicationId) && can('workflow.consultation.read'));
  if (!can('workflow.consultation.read')) return <p role="alert">Bạn không có quyền xem tham vấn.</p>;
  return <section className="space-y-4"><h2 className="text-lg font-bold">Hộp thư tham vấn chuyên môn</h2><p className="text-sm text-slate-600">Lãnh đạo xem tham vấn trong phường; cán bộ xem tham vấn được gửi cho mình.</p><Button variant="outline" onClick={() => void query.refetch()}>Làm mới</Button><QueryState query={query} empty={!query.data?.items.length} />{!query.isError && <><ConsultationCards items={query.data?.items ?? []} />{query.data?.items.map(item => <Button key={item.id} variant="outline" onClick={() => setApplicationId(item.applicationId)}>Xem các tham vấn hồ sơ {item.applicationId}</Button>)}</>}<Pager page={page} total={query.data?.total ?? 0} setPage={setPage} />
    {applicationId && <Modal open onOpenChange={v => !v && setApplicationId(undefined)} title="Tham vấn theo hồ sơ"><QueryState query={byApplication} empty={!byApplication.data?.length} />{!byApplication.isError && <ConsultationCards items={byApplication.data ?? []} />}</Modal>}
  </section>;
}
