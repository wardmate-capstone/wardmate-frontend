import { useState, useMemo } from 'react';
import { personName } from '@/lib/personName';
import { Button, Modal } from '@/components/ui';
import { staffingApi, type DispatchApplication } from '@/lib/api/staffing';
import { getManagerOfficers } from '@/lib/api';
import { ActionForm, StaffHeading, dateText, Pager, QueryState, statusText, useStaffAccess, useStaffQuery } from './shared';
import { ConsultationPanel } from './ConsultationsView';
import { ReleaseApplicationModal } from '@/components/workflow/AssignmentModals';
import { useManagerReleaseMutation } from '@/hooks/useWorkflow';
import { workflowApi } from '@/lib/api/workflow';
import { toast } from '@/components/ui/Toast';
import {
  FileText,
  User,
  UserSwitch,
  UserPlus,
  UserMinus,
  ClockCounterClockwise,
  ChatCircleText,
  CheckCircle,
  Clock,
  WarningCircle,
  ArrowsClockwise,
  X,
} from '@phosphor-icons/react';

const reasons = { INITIAL_ASSIGNMENT: 'Giao hồ sơ lần đầu', OFFICER_LEAVE: 'Cán bộ nghỉ phép', WORKLOAD_BALANCE: 'Cân bằng công việc', SPECIALIST_REQUIRED: 'Yêu cầu chuyên môn' };
// Tên tiếng Việt cho mã hành động trong lịch sử phân công
const historyActions: Record<string, string> = { CLAIM: 'Cán bộ tự nhận xử lý', RELEASE: 'Trả hồ sơ về hàng đợi', ASSIGN: 'Phân công cán bộ', TRANSFER: 'Chuyển cán bộ phụ trách' };
const blockers: Record<string, string> = { NO_ACTIVE_SHIFT: 'Không có ca làm hiện tại', APPROVED_LEAVE: 'Đang nghỉ phép', CATEGORY_MISMATCH: 'Không phụ trách lĩnh vực', WARD_MISMATCH: 'Khác phường', ROLE_MISMATCH: 'Sai vai trò', ACCOUNT_INACTIVE: 'Tài khoản bị khóa', ASSIGN_PERMISSION_MISSING: 'Thiếu quyền nhận hồ sơ', APPLICATION_OWNER: 'Là chủ hồ sơ' };

export function AssignDialog({ application, onClose, leave = false }: { application: DispatchApplication; onClose: () => void; leave?: boolean }) {
  const candidates = useStaffQuery(['candidates', application.id], signal => staffingApi.candidates(application.id, signal));
  const ready = !candidates.isFetching && !candidates.isError && !!candidates.data;
  const list = candidates.data ?? [];
  const noneEligible = ready && list.length > 0 && !list.some(c => c.eligible);
  // Lý do chưa đủ điều kiện chỉ hiện ngay trong từng dòng của ô chọn (không lặp ở khung riêng)
  const note = (c: (typeof list)[number]) => !c.eligible ? ' · ' + (c.blockingReasons.map(r => blockers[r] || r).join(', ') || 'Chưa đủ điều kiện') : c.officerId === application.assignedOfficerId ? ' · Đang phụ trách' : '';
  return <ActionForm title={application.assignedOfficerId ? 'Chuyển cán bộ phụ trách' : 'Phân công cán bộ'} description={`Hồ sơ ${application.applicationCode || application.id}. Hệ thống sẽ kiểm tra ca trực và điều kiện của cán bộ khi lưu.`} onClose={onClose}
    fields={[
      { name: 'officerId', label: 'Cán bộ nhận hồ sơ', type: 'select', options: ready ? list.map(c => ({ value: c.officerId, label: `${c.fullName || 'Cán bộ chưa có tên'} · ${c.activeApplicationCount} hồ sơ${note(c)}`, disabled: !c.eligible || c.officerId === application.assignedOfficerId })) : [] },
      { name: 'reasonCode', label: 'Loại phân công', type: 'select', options: Object.entries(reasons).filter(([code]) => !leave || code === 'OFFICER_LEAVE').map(([value, label]) => ({ value, label })) },
      { name: 'reason', label: 'Lý do phân công (tối đa 470 ký tự)', type: 'textarea', max: 470 },
    ]}
    validate={v => candidates.isFetching || candidates.isError || !candidates.data?.some(c => c.officerId === v.officerId && c.eligible && c.officerId !== application.assignedOfficerId) ? 'Vui lòng tải lại và chọn cán bộ đủ điều kiện.' : undefined}
    submit={v => staffingApi.assign(application.id, { officerId: v.officerId, expectedAssignmentVersion: application.assignmentVersion, reasonCode: v.reasonCode, reason: v.reason })}>
    {/* Đang tải: chỉ hiện một dòng gọn thay cho khung lớn */}
    {candidates.isFetching && !candidates.isError && <p role="status" className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2.5 text-sm text-slate-600">
      <ArrowsClockwise size={16} className="shrink-0 motion-safe:animate-spin" aria-hidden="true" />Đang tải danh sách cán bộ…
    </p>}
    {!candidates.isFetching && <QueryState query={candidates} empty={candidates.data?.length === 0} />}
    {/* Không còn cán bộ nào chọn được: một dòng gợi ý ngắn, lý do chi tiết xem trong ô chọn */}
    {noneEligible && <p className="flex items-start gap-2 text-sm text-amber-800">
      <WarningCircle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
      <span>Chưa có cán bộ đủ điều kiện. Kiểm tra ca trực hoặc giao lĩnh vực cho cán bộ tại <strong>Cán bộ Một cửa</strong>.</span>
    </p>}
  </ActionForm>;
}

function AssignmentHistory({ application, onClose }: { application: DispatchApplication; onClose: () => void }) {
  const query = useStaffQuery(['assignments', application.id], signal => staffingApi.assignments(application.id, signal));
  return <Modal open onOpenChange={v => !v && onClose()} title="Lịch sử phân công" description={application.applicationCode || application.id}><QueryState query={query} empty={!query.data?.length} />{!query.isError && query.data?.map(row => <article key={row.id} className="mb-3 space-y-1 rounded-lg border p-3 text-sm">
    <strong className="block">{reasons[row.reasonCode as keyof typeof reasons] || historyActions[row.action] || row.action}</strong>
    {row.reason && <p>{row.reason}</p>}
    {/* Ghi rõ bằng chữ thay cho mũi tên "Từ … → …" */}
    <p><span className="text-slate-500">Cán bộ trước:</span> {row.fromOfficerId ? personName(row.fromOfficerId, row.fromOfficerName) : 'Chưa có (hồ sơ chưa được phân công)'}</p>
    <p><span className="text-slate-500">Cán bộ nhận:</span> {personName(row.toOfficerId, row.toOfficerName)}</p>
    <p><span className="text-slate-500">Người thực hiện:</span> {personName(row.actorId, row.actorName)}</p>
    <p><span className="text-slate-500">Thời gian:</span> <time>{dateText(row.createdAt)}</time></p>
  </article>)}</Modal>;
}

// Mỗi trang điều phối hiển thị 10 hồ sơ
const DISPATCH_PAGE_SIZE = 10;

export function DispatchView({ focusApplicationId }: { focusApplicationId?: string | null } = {}) {
  const { manager, can } = useStaffAccess();
  // Mở từ thông báo (ví dụ "Hồ sơ nộp lại chưa có cán bộ thụ lý"): hiện riêng hồ sơ đó để Manager xử lý ngay
  const [dismissedFocus, setDismissedFocus] = useState<string | null>(null);
  const focusId = focusApplicationId && focusApplicationId !== dismissedFocus ? focusApplicationId : null;
  const focusQuery = useStaffQuery(['dispatch-focus', focusId], signal => workflowApi.getOfficerApplication(focusId!, signal), Boolean(manager && focusId));
  const focusApp: DispatchApplication | null = focusQuery.data ? {
    id: focusQuery.data.id,
    applicationCode: focusQuery.data.applicationCode,
    procedureId: focusQuery.data.procedureId,
    procedureTitle: focusQuery.data.procedureTitle ?? '',
    status: focusQuery.data.status,
    assignedOfficerId: focusQuery.data.assignedOfficerId,
    // Thiếu phiên bản thì gửi 0: BE trả 409 và Manager tải lại, không ghi đè phân công mới hơn
    assignmentVersion: focusQuery.data.assignmentVersion ?? 0,
    procedureCategoryId: focusQuery.data.categoryId,
  } : null;
  const [page, setPage] = useState(1);
  const [selection, setSelection] = useState<{ app: DispatchApplication; mode: 'assign' | 'history' | 'consult' | 'release' }>();
  const releaseMutation = useManagerReleaseMutation();
  const query = useStaffQuery(['dispatch', page], signal => staffingApi.applications(page, signal, DISPATCH_PAGE_SIZE), manager && can('workflow.dispatch.read'));

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
    <section className="staff-workspace">
      <StaffHeading title="Danh sách hồ sơ điều phối" description="Hồ sơ trong phường. Chỉ phân công khi cán bộ có ca làm và đủ điều kiện.">
        <Button
          variant="outline"
          disabled={query.isFetching}
          onClick={() => void query.refetch()}
          className="gap-2 font-semibold"
        >
          <ArrowsClockwise size={18} aria-hidden="true" className={query.isFetching ? 'motion-safe:animate-spin' : ''} />
          <span>{query.isFetching ? 'Đang cập nhật...' : 'Làm mới'}</span>
        </Button>
      </StaffHeading>

      {focusId && (
        <div role="region" aria-label="Hồ sơ từ thông báo" className="mb-4 rounded-2xl border border-amber-200 bg-amber-50/60 p-4">
          <div className="flex items-start justify-between gap-3">
            <p className="text-xs font-bold uppercase tracking-wider text-amber-900">Hồ sơ từ thông báo</p>
            <button type="button" aria-label="Đóng" onClick={() => setDismissedFocus(focusId)} className="grid size-9 place-items-center rounded-lg text-slate-500 hover:bg-white hover:text-slate-900">
              <X size={16} aria-hidden />
            </button>
          </div>
          {focusQuery.isPending ? (
            <p role="status" className="text-sm text-slate-600">Đang tải hồ sơ…</p>
          ) : focusQuery.isError || !focusApp ? (
            <p role="alert" className="text-sm text-red-800">Không mở được hồ sơ này (có thể đã ngoài phạm vi phường). Vui lòng tìm trong danh sách bên dưới.</p>
          ) : (
            <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold text-slate-900 [overflow-wrap:anywhere]">{focusApp.procedureTitle || 'Thủ tục hành chính'}</p>
                <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                  <span className="font-mono">{focusApp.applicationCode || `HS-${focusApp.id.slice(0, 8).toUpperCase()}`}</span>
                  {renderStatusBadge(focusApp.status)}
                  <span>{focusApp.assignedOfficerId ? `Cán bộ: ${formatOfficer(focusApp.assignedOfficerId)}` : 'Chưa có cán bộ thụ lý'}</span>
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {can('workflow.dispatch.write') && ['SUBMITTED', 'UNDER_REVIEW', 'NEED_REVISION', 'DOCUMENTS_READY'].includes(focusApp.status) && (
                  <Button size="small" variant={focusApp.assignedOfficerId ? 'outline' : 'primary'} className="gap-1.5 font-semibold" onClick={() => setSelection({ app: focusApp, mode: 'assign' })}>
                    {focusApp.assignedOfficerId ? <UserSwitch size={15} weight="bold" aria-hidden /> : <UserPlus size={15} weight="bold" aria-hidden />}
                    {focusApp.assignedOfficerId ? 'Chuyển cán bộ' : 'Phân công'}
                  </Button>
                )}
                {can('workflow.assign.manage') && focusApp.status === 'NEED_REVISION' && focusApp.assignedOfficerId && (
                  <Button size="small" variant="outline" className="gap-1.5 font-semibold" onClick={() => setSelection({ app: focusApp, mode: 'release' })}>
                    <UserMinus size={15} weight="bold" aria-hidden />Gỡ cán bộ
                  </Button>
                )}
                <Button size="small" variant="ghost" className="gap-1.5" onClick={() => setSelection({ app: focusApp, mode: 'history' })}>
                  <ClockCounterClockwise size={15} aria-hidden />Lịch sử
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      <QueryState query={query} empty={!query.data?.items.length} />

      {!query.isError && !query.isPending && !!query.data?.items.length && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <caption className="sr-only">Danh sách hồ sơ điều phối</caption>
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th scope="col" className="px-4 py-3">Hồ sơ</th>
                  <th scope="col" className="px-4 py-3">Trạng thái</th>
                  <th scope="col" className="px-4 py-3">Cán bộ phụ trách</th>
                  <th scope="col" className="px-4 py-3 text-right"><span className="sr-only">Thao tác</span></th>
                </tr>
              </thead>
              <tbody>
                {query.data.items.map(app => {
                  const canAssign = can('workflow.dispatch.write') && ['SUBMITTED', 'UNDER_REVIEW', 'NEED_REVISION', 'DOCUMENTS_READY'].includes(app.status);
                  // WF-ASSIGN-REL-01: gỡ cán bộ vắng khỏi hồ sơ đang chờ người dân bổ sung để hồ sơ không bị kẹt khi nộp lại
                  const canRelease = can('workflow.assign.manage') && app.status === 'NEED_REVISION' && Boolean(app.assignedOfficerId);
                  return (
                    <tr key={app.id} className="border-b border-slate-100 align-middle transition-colors last:border-0 hover:bg-slate-50/70">
                      <td className="max-w-md px-4 py-3">
                        <p className="truncate font-semibold text-slate-900">{app.procedureTitle || 'Thủ tục hành chính'}</p>
                        <p className="mt-0.5 font-mono text-xs text-slate-500">{app.applicationCode || `HS-${app.id.slice(0, 8).toUpperCase()}`}</p>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">{renderStatusBadge(app.status)}</td>
                      <td className="px-4 py-3">
                        {app.assignedOfficerId ? (
                          <span className="inline-flex items-center gap-2 text-slate-800">
                            <span className="grid size-7 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-500"><User size={14} aria-hidden /></span>
                            <span className="font-medium [overflow-wrap:anywhere]">{formatOfficer(app.assignedOfficerId)}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800">Chưa phân công</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {canAssign && (
                            <Button
                              size="small"
                              variant={app.assignedOfficerId ? 'outline' : 'primary'}
                              onClick={() => setSelection({ app, mode: 'assign' })}
                              className="mr-1 gap-1.5 whitespace-nowrap font-semibold"
                            >
                              {app.assignedOfficerId ? <UserSwitch size={15} weight="bold" aria-hidden /> : <UserPlus size={15} weight="bold" aria-hidden />}
                              <span>{app.assignedOfficerId ? 'Chuyển cán bộ' : 'Phân công'}</span>
                            </Button>
                          )}
                          {canRelease && (
                            <Button
                              size="small"
                              variant="outline"
                              onClick={() => setSelection({ app, mode: 'release' })}
                              className="mr-1 gap-1.5 whitespace-nowrap font-semibold"
                              title="Gỡ cán bộ khỏi hồ sơ đang chờ bổ sung"
                            >
                              <UserMinus size={15} weight="bold" aria-hidden />
                              <span>Gỡ cán bộ</span>
                            </Button>
                          )}
                          <button
                            type="button"
                            aria-label="Lịch sử"
                            title="Lịch sử phân công"
                            onClick={() => setSelection({ app, mode: 'history' })}
                            className="grid size-9 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-100"
                          >
                            <ClockCounterClockwise size={18} aria-hidden />
                          </button>
                          {can('workflow.consultation.read') && (
                            <button
                              type="button"
                              aria-label="Tham vấn"
                              title="Tham vấn theo hồ sơ"
                              onClick={() => setSelection({ app, mode: 'consult' })}
                              className="grid size-9 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-100"
                            >
                              <ChatCircleText size={18} aria-hidden />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Pager page={page} total={query.data?.total ?? 0} setPage={setPage} pageSize={DISPATCH_PAGE_SIZE} />
      {selection?.mode === 'assign' && <AssignDialog application={selection.app} onClose={() => setSelection(undefined)} />}
      {selection?.mode === 'history' && <AssignmentHistory application={selection.app} onClose={() => setSelection(undefined)} />}
      {selection?.mode === 'release' && (
        <ReleaseApplicationModal
          open
          variant="manager"
          onOpenChange={open => { if (!open) setSelection(undefined); }}
          applicationNumber={selection.app.applicationCode || `HS-${selection.app.id.slice(0, 8).toUpperCase()}`}
          onConfirm={async reason => {
            // Gửi assignmentVersion vừa tải để BE trả 409 nếu phân công vừa đổi
            await releaseMutation.mutateAsync({ id: selection.app.id, input: { reason, expectedAssignmentVersion: selection.app.assignmentVersion } });
            toast.success(`Đã gỡ cán bộ khỏi hồ sơ ${selection.app.applicationCode || ''}. Khi người dân nộp lại, hồ sơ vào hàng chờ chung.`.replace('  ', ' '));
            setSelection(undefined);
          }}
        />
      )}
      {selection?.mode === 'consult' && <Modal open onOpenChange={v => !v && setSelection(undefined)} title="Tham vấn theo hồ sơ" description={selection.app.applicationCode || selection.app.id}><ConsultationPanel application={query.data?.items.find(app => app.id === selection.app.id) ?? selection.app} /></Modal>}
    </section>
  );
}
