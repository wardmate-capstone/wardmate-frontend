import { useMemo, useState } from 'react';
import { useQueries, useQuery } from '@tanstack/react-query';
import { ArrowsClockwise, ClockCounterClockwise, MagnifyingGlass, UserSwitch, UserPlus } from '@phosphor-icons/react';
import { Button, Modal, TableSkeletonRows, toast } from '@/components/ui';
import { AssignOfficerModal, type AssignTarget, type AssignableOfficer } from '@/components/workflow/AssignmentModals';
import { useOfficerApplications, useManagerAssigneeMutation } from '@/hooks/useWorkflow';
import { useProcedureCategories } from '@/hooks/useProcedureCategories';
import { authErrorMessage, getManagerOfficers } from '@/lib/api';
import { workflowApi, workflowError, OFFICER_VISIBLE_STATUSES, type ApplicationSummaryDto, type OfficerListInput } from '@/lib/api/workflow';
import { UNKNOWN_CATEGORY_LABEL, mapAssignmentHistoryToTimelineItem, type OfficerLookup } from '@/lib/api/workflowAdapters';
import { useAuthStore } from '@/stores/authStore';

const PAGE_SIZE = 20;
// Trạng thái còn đang xử lý; dùng để đếm khối lượng của từng cán bộ.
const ACTIVE_STATUSES = 'UNDER_REVIEW,NEED_REVISION,DOCUMENTS_READY';
const TRANSFERABLE = ['UNDER_REVIEW', 'NEED_REVISION', 'DOCUMENTS_READY'];

const STATUS_OPTIONS = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'SUBMITTED', label: 'Chờ tiền kiểm' },
  { value: 'UNDER_REVIEW', label: 'Đang kiểm tra' },
  { value: 'NEED_REVISION', label: 'Cần bổ sung' },
  { value: 'DOCUMENTS_READY', label: 'Giấy tờ sẵn sàng' },
  { value: 'OFFICIALLY_RECEIVED', label: 'Đã tiếp nhận tại quầy' },
];

function statusLabel(item: ApplicationSummaryDto): string {
  switch ((item.status || '').toUpperCase()) {
    case 'SUBMITTED': return (item.resubmitCount ?? 0) > 0 ? 'Đã gửi lại' : 'Chờ tiền kiểm';
    case 'UNDER_REVIEW': return 'Đang kiểm tra';
    case 'NEED_REVISION': return 'Cần bổ sung';
    case 'DOCUMENTS_READY': return 'Giấy tờ sẵn sàng';
    case 'OFFICIALLY_RECEIVED': return 'Đã tiếp nhận tại quầy';
    case 'CANCELLED': return 'Đã hủy';
    case 'DRAFT': return 'Bản nháp';
    default: return item.status || '—';
  }
}

function formatDate(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function isOverdue(item: ApplicationSummaryDto) {
  return Boolean(item.dueAtUtc && Date.parse(item.dueAtUtc) < Date.now() && ['SUBMITTED', 'UNDER_REVIEW', 'NEED_REVISION'].includes(item.status || ''));
}

// Lịch sử phân công lấy từ chi tiết hồ sơ (MANAGER có workflow.read); lý do là dữ liệu nội bộ, công dân không thấy.
function AssignmentHistoryModal({ item, lookup, onClose }: { item: ApplicationSummaryDto | null; lookup: OfficerLookup; onClose: () => void }) {
  const detail = useQuery({
    queryKey: ['workflow', 'application', item?.id, 'manager-assignment-history'],
    queryFn: ({ signal }) => workflowApi.getOfficerApplication(item!.id, signal),
    enabled: Boolean(item),
  });
  const rows = (detail.data?.assignmentHistory ?? []).map((h) => mapAssignmentHistoryToTimelineItem(h, lookup)).reverse();
  return (
    <Modal
      open={Boolean(item)}
      onOpenChange={(open) => !open && onClose()}
      title="Lịch sử phân công"
      description={item ? `Hồ sơ ${item.applicationCode || item.id.slice(0, 8)} · ${item.procedureTitle || 'Thủ tục'}` : undefined}
      footer={<Button variant="outline" onClick={onClose}>Đóng</Button>}
    >
      {detail.isPending && <p className="text-sm text-slate-500">Đang tải lịch sử…</p>}
      {detail.isError && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{workflowError(detail.error)}</p>}
      {detail.isSuccess && rows.length === 0 && <p className="text-sm text-slate-500">Hồ sơ chưa có thay đổi phân công nào.</p>}
      {rows.length > 0 && (
        <ol className="grid gap-3">
          {rows.map((row) => (
            <li key={row.id} className="rounded-xl border border-slate-200 bg-white p-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <strong className="text-sm text-slate-900">{row.title}</strong>
                <span className="text-xs text-slate-500">{row.time}</span>
              </div>
              <p className="mt-1 text-xs text-slate-600">Thực hiện: {row.actor}</p>
              {row.description && <p className="mt-1 text-xs text-slate-700">{row.description}</p>}
            </li>
          ))}
        </ol>
      )}
    </Modal>
  );
}

export function ManagerApplicationsView() {
  const userId = useAuthStore((s) => s.user?.id);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [assignee, setAssignee] = useState('');
  const [overdue, setOverdue] = useState(false);
  const [codeInput, setCodeInput] = useState('');
  const [code, setCode] = useState('');
  const [historyItem, setHistoryItem] = useState<ApplicationSummaryDto | null>(null);
  const [target, setTarget] = useState<(AssignTarget & { id: string; version: number }) | null>(null);

  const filters: OfficerListInput = {
    page,
    pageSize: PAGE_SIZE,
    status: status || OFFICER_VISIBLE_STATUSES,
    categoryIds: categoryId ? [categoryId] : undefined,
    assignee: assignee || undefined,
    overdue: overdue || undefined,
    applicationCode: code || undefined,
  };
  const list = useOfficerApplications(filters);
  const categories = useProcedureCategories();
  const officers = useQuery({
    queryKey: ['iam', 'manager', 'officers', 'assignable', userId],
    queryFn: () => getManagerOfficers({ pageSize: 100 }),
    enabled: Boolean(userId),
    staleTime: 60_000,
  });

  // Số liệu tóm tắt: dùng total của các truy vấn pageSize=1 (BE chưa có API thống kê phân công riêng).
  const officerItems = useMemo(() => officers.data?.items.filter((o) => o.isActive) ?? [], [officers.data]);
  const countFilters: OfficerListInput[] = [
    { page: 1, pageSize: 1, status: 'SUBMITTED', assignee: 'unassigned' },
    { page: 1, pageSize: 1, overdue: true },
    ...officerItems.map((o) => ({ page: 1, pageSize: 1, status: ACTIVE_STATUSES, assignee: o.id })),
  ];
  const counts = useQueries({
    queries: countFilters.map((f) => ({
      queryKey: ['workflow', 'officer', 'applications', userId, f],
      queryFn: ({ signal }: { signal: AbortSignal }) => workflowApi.listOfficerApplications(f, signal),
      enabled: Boolean(userId),
    })),
  });
  const unassignedCount = counts[0]?.data?.total;
  const overdueCount = counts[1]?.data?.total;
  const workload = new Map(officerItems.map((o, index) => [o.id.toLowerCase(), counts[index + 2]?.data?.total]));

  const username = useAuthStore((st) => st.user?.username);
  const historyLookup = useMemo<OfficerLookup>(() => ({
    currentOfficer: { id: userId, name: username ? `${username} (bạn)` : 'Bạn' },
    directory: Object.fromEntries((officers.data?.items ?? []).map((o) => [o.id.toLowerCase(), o.fullName?.trim() || o.username])),
  }), [officers.data, userId, username]);
  const officerName = (id?: string | null, snapshot?: string | null) => {
    if (snapshot?.trim()) return snapshot.trim();
    if (!id) return 'Chưa phân công';
    const found = officers.data?.items.find((o) => o.id.toLowerCase() === id.toLowerCase());
    return found?.fullName?.trim() || found?.username || `Cán bộ (${id.slice(0, 8)})`;
  };

  const assignable: AssignableOfficer[] = officerItems.map((o) => ({
    id: o.id,
    name: o.fullName?.trim() || o.username,
    categoryIds: o.assignedCategories ?? [],
    activeCount: workload.get(o.id.toLowerCase()),
  }));

  const assignMutation = useManagerAssigneeMutation();
  const handleAssign = async (officerId: string, reason: string) => {
    if (!target) return;
    await assignMutation.mutateAsync({ id: target.id, input: { officerId, reason, expectedAssignmentVersion: target.version } });
    toast.success(`${target.isTransfer ? 'Đã chuyển' : 'Đã giao'} hồ sơ ${target.applicationNumber} cho ${officerName(officerId)}.`);
    setTarget(null);
  };

  const openAssign = (item: ApplicationSummaryDto) => {
    if (typeof item.assignmentVersion !== 'number') {
      toast.error('Hồ sơ chưa có thông tin phiên bản phân công. Vui lòng làm mới danh sách.');
      return;
    }
    setTarget({
      id: item.id,
      version: item.assignmentVersion,
      applicationNumber: item.applicationCode || `HS-${item.id.slice(0, 8).toUpperCase()}`,
      categoryId: item.categoryId ?? null,
      categoryName: item.categoryName?.trim() || UNKNOWN_CATEGORY_LABEL,
      assignedOfficerId: item.assignedOfficerId,
      assignedOfficerName: item.assignedOfficerId ? officerName(item.assignedOfficerId, item.assignedOfficerName) : undefined,
      isTransfer: Boolean(item.assignedOfficerId),
    });
  };

  const resetPage = () => setPage(1);
  const items = list.data?.items ?? [];
  const total = list.data?.total ?? 0;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => { setStatus('SUBMITTED'); setAssignee('unassigned'); setOverdue(false); resetPage(); }}
          className="admin-card p-4 text-left transition hover:border-red-200 focus:outline-none focus:ring-2 focus:ring-red-800"
        >
          <span className="text-xs font-semibold text-slate-500">Chờ tiền kiểm, chưa có người nhận</span>
          <strong className="mt-1 block text-2xl text-slate-900">{unassignedCount ?? '—'}</strong>
        </button>
        <button
          type="button"
          onClick={() => { setOverdue(true); setStatus(''); setAssignee(''); resetPage(); }}
          className="admin-card p-4 text-left transition hover:border-red-200 focus:outline-none focus:ring-2 focus:ring-red-800"
        >
          <span className="text-xs font-semibold text-slate-500">Đang quá hạn tiền kiểm</span>
          <strong className={`mt-1 block text-2xl ${overdueCount ? 'text-red-800' : 'text-slate-900'}`}>{overdueCount ?? '—'}</strong>
        </button>
      </div>

      {officerItems.length > 0 && (
        <section aria-labelledby="workload-title" className="admin-card p-4">
          <h2 id="workload-title" className="text-sm font-bold text-slate-900">Khối lượng đang xử lý theo cán bộ</h2>
          <p className="mt-0.5 text-xs text-slate-500">Hồ sơ Đang kiểm tra, Cần bổ sung và Giấy tờ sẵn sàng. Bấm để lọc danh sách.</p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {officerItems.map((o) => (
              <li key={o.id}>
                <button
                  type="button"
                  aria-pressed={assignee === o.id}
                  onClick={() => { setAssignee(assignee === o.id ? '' : o.id); setStatus(''); resetPage(); }}
                  className={`inline-flex min-h-10 items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-red-800 ${assignee === o.id ? 'border-red-800 bg-red-50 text-red-900' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
                >
                  <span>{o.fullName?.trim() || o.username}</span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 font-mono text-slate-700">{workload.get(o.id.toLowerCase()) ?? '…'}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="admin-card admin-table-card admin-content-card">
        <div className="admin-toolbar flex flex-wrap items-center gap-2 border-b border-slate-100 p-4">
          <form
            className="relative min-w-[220px] flex-1"
            onSubmit={(event) => { event.preventDefault(); setCode(codeInput.trim()); resetPage(); }}
          >
            <label htmlFor="manager-app-code" className="sr-only">Tìm theo mã hồ sơ</label>
            <input
              id="manager-app-code"
              type="search"
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value)}
              placeholder="Tìm theo mã hồ sơ..."
              className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-4 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-800"
            />
            <MagnifyingGlass size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <button type="submit" className="sr-only">Tìm kiếm</button>
          </form>
          <select aria-label="Lọc theo trạng thái" value={status} onChange={(e) => { setStatus(e.target.value); resetPage(); }} className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-800">
            {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <select aria-label="Lọc theo lĩnh vực" value={categoryId ?? ''} onChange={(e) => { setCategoryId(e.target.value ? Number(e.target.value) : null); resetPage(); }} className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-800">
            <option value="">Tất cả lĩnh vực</option>
            {(categories.data ?? []).map((c) => <option key={c.id} value={c.id}>{c.categoryName}</option>)}
          </select>
          <select aria-label="Lọc theo cán bộ phụ trách" value={assignee} onChange={(e) => { setAssignee(e.target.value); resetPage(); }} className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-800">
            <option value="">Mọi cán bộ</option>
            <option value="unassigned">Chưa phân công</option>
            {officerItems.map((o) => <option key={o.id} value={o.id}>{o.fullName?.trim() || o.username}</option>)}
          </select>
          <label className="inline-flex min-h-11 items-center gap-2 px-1 text-xs font-semibold text-slate-700">
            <input type="checkbox" checked={overdue} onChange={(e) => { setOverdue(e.target.checked); resetPage(); }} className="size-4 accent-red-700" />
            Chỉ quá hạn
          </label>
          <button
            type="button"
            onClick={() => void Promise.all([list.refetch(), officers.refetch(), ...counts.map((c) => c.refetch())])}
            disabled={list.isFetching}
            className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
          >
            <ArrowsClockwise size={16} className={list.isFetching ? 'animate-spin text-red-800' : ''} aria-hidden="true" />
            <span>{list.isFetching ? 'Đang tải...' : 'Làm mới'}</span>
          </button>
        </div>

        {list.isError && (
          <div role="alert" className="mx-4 my-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-xs text-red-900">
            <p>{workflowError(list.error)}</p>
            <Button size="small" variant="outline" onClick={() => void list.refetch()}>Thử lại</Button>
          </div>
        )}
        {officers.isError && (
          <p role="alert" className="mx-4 my-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
            Chưa tải được danh sách cán bộ: {authErrorMessage(officers.error)}
          </p>
        )}

        <div className="admin-table-wrap">
          <table className="min-w-[900px]" aria-label="Bảng giám sát hồ sơ toàn phường">
            <thead>
              <tr>
                <th className="whitespace-nowrap">Mã hồ sơ</th>
                <th className="min-w-[240px]">Thủ tục & lĩnh vực</th>
                <th className="whitespace-nowrap">Ngày gửi</th>
                <th className="whitespace-nowrap">Trạng thái</th>
                <th className="min-w-[160px]">Cán bộ phụ trách</th>
                <th className="sticky right-0 z-10 whitespace-nowrap bg-slate-50 text-right shadow-[-8px_0_12px_-12px_rgba(15,23,42,0.35)]">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {list.isPending ? (
                <TableSkeletonRows columns={6} rows={5} />
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-xs text-slate-500">Không có hồ sơ nào phù hợp với bộ lọc hiện tại.</td>
                </tr>
              ) : items.map((item) => {
                const canAssign = item.status === 'SUBMITTED' && !item.assignedOfficerId;
                const canTransfer = TRANSFERABLE.includes(item.status || '') && Boolean(item.assignedOfficerId);
                return (
                  <tr key={item.id}>
                    <td className="whitespace-nowrap font-mono text-xs font-bold text-slate-900">{item.applicationCode || `HS-${item.id.slice(0, 8).toUpperCase()}`}</td>
                    <td>
                      <span className="block text-xs font-semibold text-slate-900">{item.procedureTitle || 'Thủ tục hành chính'}</span>
                      <span className="block text-[11px] text-slate-500">{item.categoryName?.trim() || UNKNOWN_CATEGORY_LABEL}</span>
                    </td>
                    <td className="whitespace-nowrap text-xs text-slate-600">
                      <div>{formatDate(item.submittedAt || item.createdAt)}</div>
                      {isOverdue(item) && <span className="mt-1 inline-flex rounded border border-red-200 bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-800">Quá hạn</span>}
                    </td>
                    <td className="whitespace-nowrap text-xs font-semibold text-slate-700">{statusLabel(item)}</td>
                    <td className="text-xs">
                      {item.assignedOfficerId
                        ? <span className="font-semibold text-slate-800">{officerName(item.assignedOfficerId, item.assignedOfficerName)}</span>
                        : <span className="italic text-slate-400">Chưa phân công</span>}
                    </td>
                    {/* Cột thao tác ghim phải; Lịch sử chỉ còn biểu tượng để dòng không bị chật */}
                    <td className="sticky right-0 z-10 whitespace-nowrap bg-white text-right shadow-[-8px_0_12px_-12px_rgba(15,23,42,0.35)]">
                      <div className="flex items-center justify-end gap-1.5">
                      <Button
                        size="small"
                        variant="ghost"
                        className="min-h-10 min-w-10 px-2"
                        onClick={() => setHistoryItem(item)}
                        aria-label={`Xem lịch sử phân công hồ sơ ${item.applicationCode || item.id.slice(0, 8)}`}
                        title="Lịch sử phân công"
                      >
                        <ClockCounterClockwise size={16} aria-hidden="true" />
                      </Button>
                      {canAssign && (
                        <Button size="small" className="gap-1.5" onClick={() => openAssign(item)}>
                          <UserPlus size={14} aria-hidden="true" /> Giao cán bộ
                        </Button>
                      )}
                      {canTransfer && (
                        <Button size="small" variant="outline" className="gap-1.5" onClick={() => openAssign(item)}>
                          <UserSwitch size={14} aria-hidden="true" /> Chuyển cán bộ
                        </Button>
                      )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <nav aria-label="Phân trang giám sát hồ sơ" className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 text-xs text-slate-600">
          <span>Trang <strong className="text-slate-900">{page}</strong> · <strong className="text-slate-900">{total}</strong> hồ sơ</span>
          <div className="flex items-center gap-2">
            <Button size="small" variant="outline" disabled={page <= 1 || list.isFetching} onClick={() => setPage((p) => Math.max(1, p - 1))}>Trang trước</Button>
            <Button size="small" variant="outline" disabled={list.isFetching || page * PAGE_SIZE >= total} onClick={() => setPage((p) => p + 1)}>Trang sau</Button>
          </div>
        </nav>
      </section>

      <AssignmentHistoryModal item={historyItem} lookup={historyLookup} onClose={() => setHistoryItem(null)} />
      <AssignOfficerModal
        open={Boolean(target)}
        onOpenChange={(open) => !open && setTarget(null)}
        target={target}
        officers={assignable}
        officersError={officers.isError ? authErrorMessage(officers.error) : undefined}
        onConfirm={handleAssign}
      />
    </div>
  );
}
