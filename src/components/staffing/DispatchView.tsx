import { useState, useMemo } from 'react';
import { Button, Modal } from '@/components/ui';
import { staffingApi, type DispatchApplication } from '@/lib/api/staffing';
import { getManagerOfficers } from '@/lib/api';
import { ActionForm, dateText, Pager, QueryState, statusText, useStaffAccess, useStaffQuery } from './shared';
import { ConsultationPanel } from './ConsultationsView';
import {
  FileText,
  User,
  UserSwitch,
  UserPlus,
  ClockCounterClockwise,
  ChatCircleText,
  CheckCircle,
  Clock,
  WarningCircle,
  ArrowsClockwise,
} from '@phosphor-icons/react';

const reasons = { INITIAL_ASSIGNMENT: 'Giao hồ sơ lần đầu', OFFICER_LEAVE: 'Cán bộ nghỉ phép', WORKLOAD_BALANCE: 'Cân bằng công việc', SPECIALIST_REQUIRED: 'Yêu cầu chuyên môn' };
const blockers: Record<string, string> = { NO_ACTIVE_SHIFT: 'Không có ca làm hiện tại', APPROVED_LEAVE: 'Đang nghỉ phép', CATEGORY_MISMATCH: 'Không phụ trách lĩnh vực', WARD_MISMATCH: 'Khác phường', ROLE_MISMATCH: 'Sai vai trò', ACCOUNT_INACTIVE: 'Tài khoản bị khóa', ASSIGN_PERMISSION_MISSING: 'Thiếu quyền nhận hồ sơ', APPLICATION_OWNER: 'Là chủ hồ sơ' };

export function AssignDialog({ application, onClose, leave = false }: { application: DispatchApplication; onClose: () => void; leave?: boolean }) {
  const candidates = useStaffQuery(['candidates', application.id], signal => staffingApi.candidates(application.id, signal));
  return <ActionForm title={application.assignedOfficerId ? 'Chuyển cán bộ phụ trách' : 'Phân công cán bộ'} description={`Hồ sơ ${application.applicationCode || application.id}. Hệ thống sẽ kiểm tra ca trực và điều kiện của cán bộ khi lưu.`} onClose={onClose}
    fields={[
      { name: 'officerId', label: 'Cán bộ nhận hồ sơ', type: 'select', options: candidates.isError || candidates.isFetching ? [] : candidates.data?.map(c => ({ value: c.officerId, label: `${c.fullName || c.officerId} · ${c.activeApplicationCount} hồ sơ${c.blockingReasons.length ? ' · ' + c.blockingReasons.map(r => blockers[r] || r).join(', ') : ''}`, disabled: !c.eligible || c.officerId === application.assignedOfficerId })) },
      { name: 'reasonCode', label: 'Loại phân công', type: 'select', options: Object.entries(reasons).filter(([code]) => !leave || code === 'OFFICER_LEAVE').map(([value, label]) => ({ value, label })) },
      { name: 'reason', label: 'Lý do phân công (tối đa 470 ký tự)', type: 'textarea', max: 470 },
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

  // Nạp danh bạ cán bộ để ánh xạ GUID sang Tên đầy đủ
  const officersQuery = useStaffQuery(['managerOfficersDirectory'], () => getManagerOfficers({ pageSize: 100 }), manager);
  const officerDir = useMemo(() => {
    const map = new Map<string, string>();
    officersQuery.data?.items?.forEach(o => {
      if (o.id) map.set(o.id.toLowerCase(), o.fullName?.trim() || o.username);
    });
    return map;
  }, [officersQuery.data]);

  const formatOfficer = (id?: string | null) => {
    if (!id) return null;
    return officerDir.get(id.toLowerCase()) || `Cán bộ (${id.slice(0, 8)})`;
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'DOCUMENTS_READY':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle size={14} weight="fill" />
            <span>Giấy tờ sẵn sàng</span>
          </span>
        );
      case 'UNDER_REVIEW':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200">
            <Clock size={14} weight="fill" />
            <span>Đang kiểm tra</span>
          </span>
        );
      case 'SUBMITTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            <FileText size={14} weight="fill" />
            <span>Chờ tiền kiểm</span>
          </span>
        );
      case 'NEED_REVISION':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200">
            <WarningCircle size={14} weight="fill" />
            <span>Cần bổ sung</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
            <span>{statusText(status)}</span>
          </span>
        );
    }
  };

  if (!manager || !can('workflow.dispatch.read')) return <p role="alert">Bạn không có quyền xem điều phối hồ sơ.</p>;

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
        <div>
          <h2 className="text-base font-bold text-slate-900">Danh sách hồ sơ điều phối</h2>
          <p className="text-xs text-slate-500">Hồ sơ trong phường. Chỉ phân công khi cán bộ có ca làm và đủ điều kiện.</p>
        </div>
        <Button
          variant="outline"
          size="small"
          onClick={() => void query.refetch()}
          className="gap-1.5 text-xs font-semibold"
        >
          <ArrowsClockwise size={14} className={query.isFetching ? 'animate-spin' : ''} />
          <span>{query.isFetching ? 'Đang cập nhật...' : 'Làm mới'}</span>
        </Button>
      </div>

      <QueryState query={query} empty={!query.data?.items.length} />

      {!query.isError && (
        <div className="grid gap-3">
          {query.data?.items.map(app => (
            <article
              key={app.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:border-slate-300 hover:shadow-sm space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 font-mono text-xs font-bold text-slate-800 border border-slate-200">
                      <FileText size={14} className="text-slate-500" />
                      <span>{app.applicationCode || `HS-${app.id.slice(0, 8).toUpperCase()}`}</span>
                    </span>
                    {renderStatusBadge(app.status)}
                  </div>
                  <h3 className="text-base font-bold text-slate-900 leading-snug">
                    {app.procedureTitle || 'Thủ tục hành chính'}
                  </h3>
                </div>

                <div className="flex items-center shrink-0">
                  <div className="flex items-center gap-1.5 rounded-xl bg-slate-50 border border-slate-200/80 px-3 py-1.5 text-xs">
                    <User size={15} className="text-slate-500" />
                    <span className="text-slate-500">Cán bộ phụ trách:</span>
                    {app.assignedOfficerId ? (
                      <span className="font-semibold text-slate-900">{formatOfficer(app.assignedOfficerId)}</span>
                    ) : (
                      <span className="font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                        Chưa phân công
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
                <span className="text-[11px] text-slate-400">
                  Phiên bản phân công: v{app.assignmentVersion}
                </span>

                <div className="flex flex-wrap items-center gap-2">
                  {can('workflow.dispatch.write') && ['SUBMITTED', 'UNDER_REVIEW', 'NEED_REVISION', 'DOCUMENTS_READY'].includes(app.status) && (
                    <Button
                      size="small"
                      onClick={() => setSelection({ app, mode: 'assign' })}
                      className="gap-1.5 bg-red-800 hover:bg-red-900 text-white shadow-xs font-semibold"
                    >
                      {app.assignedOfficerId ? (
                        <>
                          <UserSwitch size={15} weight="bold" />
                          <span>Chuyển cán bộ</span>
                        </>
                      ) : (
                        <>
                          <UserPlus size={15} weight="bold" />
                          <span>Phân công</span>
                        </>
                      )}
                    </Button>
                  )}
                  <Button
                    size="small"
                    variant="outline"
                    onClick={() => setSelection({ app, mode: 'history' })}
                    className="gap-1.5 font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <ClockCounterClockwise size={15} />
                    <span>Lịch sử</span>
                  </Button>
                  {can('workflow.consultation.read') && (
                    <Button
                      size="small"
                      variant="outline"
                      onClick={() => setSelection({ app, mode: 'consult' })}
                      className="gap-1.5 font-medium text-slate-700 hover:bg-slate-50"
                    >
                      <ChatCircleText size={15} />
                      <span>Tham vấn</span>
                    </Button>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <Pager page={page} total={query.data?.total ?? 0} setPage={setPage} />
      {selection?.mode === 'assign' && <AssignDialog application={selection.app} onClose={() => setSelection(undefined)} />}
      {selection?.mode === 'history' && <AssignmentHistory application={selection.app} onClose={() => setSelection(undefined)} />}
      {selection?.mode === 'consult' && <Modal open onOpenChange={v => !v && setSelection(undefined)} title="Tham vấn theo hồ sơ" description={selection.app.applicationCode || selection.app.id}><ConsultationPanel application={query.data?.items.find(app => app.id === selection.app.id) ?? selection.app} /></Modal>}
    </section>
  );
}
