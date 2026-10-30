import { useState } from 'react';
import { Button, Modal } from '@/components/ui';
import { staffingApi, type DispatchApplication } from '@/lib/api/staffing';
import { ActionForm, dateText, Pager, QueryState, statusText, useStaffAccess, useStaffQuery } from './shared';
import { ConsultationPanel } from './ConsultationsView';

const reasons = { INITIAL_ASSIGNMENT: 'Giao hồ sơ lần đầu', OFFICER_LEAVE: 'Cán bộ nghỉ phép', WORKLOAD_BALANCE: 'Cân bằng công việc', SPECIALIST_REQUIRED: 'Yêu cầu chuyên môn' };
const blockers: Record<string, string> = { NO_ACTIVE_SHIFT: 'Không có ca làm hiện tại', APPROVED_LEAVE: 'Đang nghỉ phép', CATEGORY_MISMATCH: 'Không phụ trách lĩnh vực', WARD_MISMATCH: 'Khác phường', ROLE_MISMATCH: 'Sai vai trò', ACCOUNT_INACTIVE: 'Tài khoản bị khóa', ASSIGN_PERMISSION_MISSING: 'Thiếu quyền nhận hồ sơ', APPLICATION_OWNER: 'Là chủ hồ sơ' };
export function AssignDialog({ application, onClose, leave = false }: { application: DispatchApplication; onClose: () => void; leave?: boolean }) {
  const candidates = useStaffQuery(['candidates', application.id], signal => staffingApi.candidates(application.id, signal));
  return <ActionForm title={application.assignedOfficerId ? 'Chuyển cán bộ phụ trách' : 'Phân công cán bộ'} description={`Hồ sơ ${application.applicationCode || application.id}. BE xác minh lại điều kiện tại thời điểm lưu.`} onClose={onClose}
    fields={[
      { name: 'officerId', label: 'Cán bộ nhận hồ sơ', type: 'select', options: candidates.isError || candidates.isFetching ? [] : candidates.data?.map(c => ({ value: c.officerId, label: `${c.fullName || c.officerId} · ${c.activeApplicationCount} hồ sơ${c.blockingReasons.length ? ' · ' + c.blockingReasons.map(r => blockers[r] || r).join(', ') : ''}`, disabled: !c.eligible || c.officerId === application.assignedOfficerId })) },
      { name: 'reasonCode', label: 'Loại phân công', type: 'select', options: Object.entries(reasons).filter(([code]) => !leave || code === 'OFFICER_LEAVE').map(([value, label]) => ({ value, label })) },
      { name: 'reason', label: 'Lý do (lịch sử BE hiện lưu tối đa 500 ký tự gồm mã lý do)', type: 'textarea', max: 470 },
    ]}
    validate={v => candidates.isFetching || candidates.isError || !candidates.data?.some(c => c.officerId === v.officerId && c.eligible && c.officerId !== application.assignedOfficerId) ? 'Vui lòng tải lại và chọn cán bộ đủ điều kiện.' : undefined}
    submit={v => staffingApi.assign(application.id, { officerId: v.officerId, expectedAssignmentVersion: application.assignmentVersion, reasonCode: v.reasonCode, reason: v.reason })}>
    <QueryState query={candidates} empty={candidates.data?.length === 0} />
  </ActionForm>;
}
function AssignmentHistory({ application, onClose }: { application: DispatchApplication; onClose: () => void }) {
  const query = useStaffQuery(['assignments', application.id], signal => staffingApi.assignments(application.id, signal));
  return <Modal open onOpenChange={v => !v && onClose()} title="Lịch sử phân công" description={application.applicationCode || application.id}><QueryState query={query} empty={!query.data?.length} />{!query.isError && query.data?.map(row => <article key={row.id} className="mb-3 rounded-lg border p-3 text-sm"><strong>{reasons[row.reasonCode as keyof typeof reasons] || row.action}</strong><p>{row.reason}</p><p>Từ: {row.fromOfficerId || 'Chưa phân công'} → {row.toOfficerId}</p><p>Thực hiện: {row.actorId}</p><time>{dateText(row.createdAt)}</time></article>)}</Modal>;
}
export function DispatchView() {
  const { manager, can } = useStaffAccess();
  const [page, setPage] = useState(1);
  const [selection, setSelection] = useState<{ app: DispatchApplication; mode: 'assign' | 'history' | 'consult' }>();
  const query = useStaffQuery(['dispatch', page], signal => staffingApi.applications(page, signal), manager && can('workflow.dispatch.read'));
  if (!manager || !can('workflow.dispatch.read')) return <p role="alert">Bạn không có quyền xem điều phối hồ sơ.</p>;
  return <section className="space-y-4"><div className="flex flex-wrap justify-between gap-3"><p className="text-sm text-slate-600">Hồ sơ trong phường. Chỉ phân công khi cán bộ có ca làm và đủ điều kiện.</p><Button variant="outline" onClick={() => void query.refetch()}>Làm mới</Button></div>
    <QueryState query={query} empty={!query.data?.items.length} />
    {!query.isError && query.data?.items.map(app => <article key={app.id} className="admin-card space-y-3 p-4"><div><h2 className="font-bold">{app.applicationCode || app.id}</h2><p>{app.procedureTitle}</p><p className="text-sm text-slate-600">{statusText(app.status)} · {app.assignedOfficerId ? `Cán bộ: ${app.assignedOfficerId}` : 'Chưa phân công'}</p></div><div className="flex flex-wrap gap-2">
      {can('workflow.dispatch.write') && ['SUBMITTED', 'UNDER_REVIEW', 'NEED_REVISION', 'DOCUMENTS_READY'].includes(app.status) && <Button onClick={() => setSelection({ app, mode: 'assign' })}>{app.assignedOfficerId ? 'Chuyển cán bộ' : 'Phân công'}</Button>}
      <Button variant="outline" onClick={() => setSelection({ app, mode: 'history' })}>Lịch sử</Button>
      {can('workflow.consultation.read') && <Button variant="outline" onClick={() => setSelection({ app, mode: 'consult' })}>Tham vấn</Button>}
    </div></article>)}
    <Pager page={page} total={query.data?.total ?? 0} setPage={setPage} />
    {selection?.mode === 'assign' && <AssignDialog application={selection.app} onClose={() => setSelection(undefined)} />}
    {selection?.mode === 'history' && <AssignmentHistory application={selection.app} onClose={() => setSelection(undefined)} />}
    {selection?.mode === 'consult' && <Modal open onOpenChange={v => !v && setSelection(undefined)} title="Tham vấn theo hồ sơ" description={selection.app.applicationCode || selection.app.id}><ConsultationPanel application={query.data?.items.find(app => app.id === selection.app.id) ?? selection.app} /></Modal>}
  </section>;
}
