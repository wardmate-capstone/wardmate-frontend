import { useMemo, useState } from 'react';
import { formatDateTime } from '@/lib/dateFormat';
import { useQuery } from '@tanstack/react-query';
import { CaretDown, CaretUp, ClockCounterClockwise, Tray, UserSwitch, UserPlus, WarningCircle } from '@phosphor-icons/react';
import { Button, LIST_SEARCH_THRESHOLD, ListSelect, Modal, Pagination, RefreshButton, SearchInput, TableSkeletonRows, toast, type ListSelectOption, EmptyState, ErrorAlert } from '@/components/ui';
import { AssignDialog } from '@/components/staffing/DispatchView';
import { ApplicationStatusBadge } from '@/components/workflow/ApplicationStatusBadge';
import type { DispatchApplication } from '@/lib/api/staffing';
import { useOfficerApplications, useAssignmentSummary } from '@/hooks/useWorkflow';
import { useProcedureCategories } from '@/hooks/useProcedureCategories';
import { authErrorMessage, getManagerOfficers } from '@/lib/api';
import { workflowApi, workflowError, type ApplicationSummaryDto, type OfficerListInput } from '@/lib/api/workflow';
import { UNKNOWN_CATEGORY_LABEL, mapAssignmentHistoryToTimelineItem, type OfficerLookup } from '@/lib/api/workflowAdapters';
import { useAuthStore } from '@/stores/authStore';

const PAGE_SIZE = 20;
// Ô lọc trên thanh công cụ: gọn hơn ô chọn trong form
const filterTrigger = 'min-h-11 rounded-lg border-slate-200 py-2 text-xs font-semibold text-slate-700';
// Số cán bộ hiện sẵn trong bảng khối lượng trước khi bấm "Xem thêm"
const WORKLOAD_PREVIEW = 8;
// Bỏ dấu tiếng Việt để tìm "huong" vẫn ra "Hương"
const foldVietnamese = (text: string) =>
  text.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().trim();
const quickChip ='inline-flex min-h-10 items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-800 focus-visible:ring-offset-2';
const TRANSFERABLE = ['UNDER_REVIEW', 'NEED_REVISION', 'DOCUMENTS_READY'];
// Cùng nhóm trạng thái BE dùng để đếm activeCount trong assignment-summary.
const ACTIVE_STATUSES = 'SUBMITTED,UNDER_REVIEW,NEED_REVISION,DOCUMENTS_READY';

const STATUS_OPTIONS = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: ACTIVE_STATUSES, label: 'Đang xử lý (chưa xong)' },
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
  return formatDateTime(value);
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
      {detail.isError && <ErrorAlert>{workflowError(detail.error)}</ErrorAlert>}
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
  const [target, setTarget] = useState<DispatchApplication | null>(null);
  const canDispatch = useAuthStore(s => s.user?.permissions.includes('workflow.dispatch.read') && s.user?.permissions.includes('workflow.dispatch.write'));

  const filters: OfficerListInput = {
    page,
    pageSize: PAGE_SIZE,
    // BE tự loại bản nháp và hồ sơ chưa từng nộp khỏi danh sách cán bộ/Manager.
    status: status || undefined,
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

  // Số liệu tóm tắt từ một request assignment-summary; cán bộ vắng trong officers[] là 0 hồ sơ.
  const officerItems = useMemo(() => officers.data?.items.filter((o) => o.isActive) ?? [], [officers.data]);
  const summary = useAssignmentSummary();
  const unassignedCount = summary.data?.unassignedSubmitted;
  const overdueCount = summary.data?.overdue;
  const workload = useMemo(() => {
    const active = new Map((summary.data?.officers ?? []).map((o) => [o.officerId.toLowerCase(), o.activeCount]));
    return new Map(officerItems.map((o) => [o.id.toLowerCase(), summary.data ? active.get(o.id.toLowerCase()) ?? 0 : undefined]));
  }, [summary.data, officerItems]);

  // Bảng khối lượng: xếp người nhiều việc lên trước, mặc định chỉ hiện WORKLOAD_PREVIEW cán bộ,
  // phường đông cán bộ thì có thêm ô tìm theo tên. Cán bộ đang được chọn luôn được hiện.
  const [workloadQuery, setWorkloadQuery] = useState('');
  const [workloadExpanded, setWorkloadExpanded] = useState(false);
  const manyOfficers = officerItems.length > LIST_SEARCH_THRESHOLD;
  const sortedWorkload = useMemo(() => [...officerItems].sort((a, b) =>
    (workload.get(b.id.toLowerCase()) ?? -1) - (workload.get(a.id.toLowerCase()) ?? -1) ||
    (a.fullName?.trim() || a.username).localeCompare(b.fullName?.trim() || b.username, 'vi'),
  ), [officerItems, workload]);
  const workloadSearch = foldVietnamese(workloadQuery);
  const matchedWorkload = workloadSearch
    ? sortedWorkload.filter((o) => foldVietnamese(`${o.fullName ?? ''} ${o.username}`).includes(workloadSearch))
    : sortedWorkload;
  const collapsed = !workloadExpanded && !workloadSearch;
  const shownWorkload = collapsed
    ? matchedWorkload.filter((o, i) => i < WORKLOAD_PREVIEW || o.id === assignee)
    : matchedWorkload;
  const hiddenWorkloadCount = collapsed ? matchedWorkload.length - shownWorkload.length : 0;

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

  const openAssign = (item: ApplicationSummaryDto) => {
    if (typeof item.assignmentVersion !== 'number') {
      toast.error('Hồ sơ chưa có thông tin phiên bản phân công. Vui lòng làm mới danh sách.');
      return;
    }
    setTarget({
      id: item.id, applicationCode: item.applicationCode, procedureId: item.procedureId,
      procedureTitle: item.procedureTitle || 'Thủ tục hành chính', status: item.status || '',
      assignedOfficerId: item.assignedOfficerId, assignmentVersion: item.assignmentVersion,
      procedureCategoryId: item.categoryId,
    });
  };

  const resetPage = () => setPage(1);
  const unassignedActive = status === 'SUBMITTED' && assignee === 'unassigned';
  const hasFilter = Boolean(status || categoryId || assignee || overdue || code);
  const categoryOptions = useMemo<ListSelectOption[]>(() => [
    { value: '', label: 'Tất cả lĩnh vực' },
    ...(categories.data ?? []).map((c) => ({ value: String(c.id), label: c.categoryName })),
  ], [categories.data]);
  const officerOptions = useMemo<ListSelectOption[]>(() => [
    { value: '', label: 'Mọi cán bộ' },
    { value: 'unassigned', label: 'Chưa phân công' },
    ...officerItems.map((o) => ({ value: o.id, label: o.fullName?.trim() || o.username })),
  ], [officerItems]);
  const items = list.data?.items ?? [];
  const total = list.data?.total ?? 0;

  return (
    <div className="space-y-5">
      {officerItems.length > 0 && (
        <section aria-labelledby="workload-title" className="admin-card p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 id="workload-title" className="text-sm font-bold text-slate-900">
                Khối lượng đang xử lý theo cán bộ
                <span className="ml-1.5 font-normal text-slate-500">({officerItems.length} cán bộ)</span>
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">Hồ sơ Đang kiểm tra, Cần bổ sung, Giấy tờ sẵn sàng và hồ sơ công dân đã gửi lại. Bấm để lọc danh sách.</p>
            </div>
            {/* Phường đông cán bộ: thêm ô tìm theo tên để không phải dò cả dãy */}
            {manyOfficers && (
              <SearchInput
                containerClassName="w-full sm:w-64"
                aria-label="Tìm cán bộ trong bảng khối lượng"
                value={workloadQuery}
                onChange={(e) => setWorkloadQuery(e.target.value)}
                onClear={() => setWorkloadQuery('')}
                placeholder="Tìm theo tên cán bộ…"
              />
            )}
          </div>
          {shownWorkload.length === 0 && (
            <p className="mt-3 text-xs text-slate-500">Không tìm thấy cán bộ phù hợp với “{workloadQuery.trim()}”.</p>
          )}
          <ul className="mt-3 flex flex-wrap gap-2">
            {shownWorkload.map((o) => (
              <li key={o.id}>
                <button
                  type="button"
                  aria-pressed={assignee === o.id}
                  onClick={() => {
                    // Lọc đúng nhóm hồ sơ đang xử lý để số dòng khớp với con số trên chip.
                    const selecting = assignee !== o.id;
                    setAssignee(selecting ? o.id : '');
                    setStatus(selecting ? ACTIVE_STATUSES : '');
                    setOverdue(false);
                    resetPage();
                  }}
                  className={`inline-flex min-h-10 items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-800 focus-visible:ring-offset-2 ${assignee === o.id ? 'border-red-800 bg-red-50 text-red-900' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
                >
                  <span>{o.fullName?.trim() || o.username}</span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 font-mono text-slate-700">{workload.get(o.id.toLowerCase()) ?? (summary.isError ? '—' : '…')}</span>
                </button>
              </li>
            ))}
          </ul>
          {hiddenWorkloadCount > 0 && (
            <button
              type="button"
              onClick={() => setWorkloadExpanded(true)}
              className="mt-3 inline-flex min-h-10 items-center gap-1 px-1 text-xs font-semibold text-red-800 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-800 focus-visible:ring-offset-2"
            >
              Xem thêm {hiddenWorkloadCount} cán bộ
              <CaretDown size={14} aria-hidden="true" />
            </button>
          )}
          {workloadExpanded && !workloadQuery.trim() && sortedWorkload.length > WORKLOAD_PREVIEW && (
            <button
              type="button"
              onClick={() => setWorkloadExpanded(false)}
              className="mt-3 inline-flex min-h-10 items-center gap-1 px-1 text-xs font-semibold text-slate-600 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-800 focus-visible:ring-offset-2"
            >
              Thu gọn
              <CaretUp size={14} aria-hidden="true" />
            </button>
          )}
        </section>
      )}

      {/* overflow-visible: để danh sách của ô lọc nổi ra ngoài thẻ khi bảng ít dòng */}
      <section className="admin-card admin-table-card admin-content-card overflow-visible!">
        <div className="grid gap-3 border-b border-slate-100 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <form
            role="search"
            className="min-w-[220px] flex-1"
            onSubmit={(event) => { event.preventDefault(); setCode(codeInput.trim()); resetPage(); }}
          >
            <label htmlFor="manager-app-code" className="sr-only">Tìm theo mã hồ sơ</label>
            <SearchInput
              id="manager-app-code"
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value)}
              onClear={() => { setCodeInput(''); setCode(''); resetPage(); }}
              placeholder="Tìm theo mã hồ sơ..."
            />
            <button type="submit" className="sr-only">Tìm kiếm</button>
          </form>
          {/* Ô lọc dạng ListSelect: danh sách lĩnh vực/cán bộ dài hơn 7 mục sẽ tự có ô tìm kiếm */}
          <div className="w-full sm:w-44">
            <ListSelect id="manager-filter-status" ariaLabel="Lọc theo trạng thái" floating className={filterTrigger}
              value={status} onChange={(v) => { setStatus(v); resetPage(); }}
              options={STATUS_OPTIONS} placeholder="Tất cả trạng thái" />
          </div>
          <div className="w-full sm:w-52">
            <ListSelect id="manager-filter-category" ariaLabel="Lọc theo lĩnh vực" floating className={filterTrigger}
              value={categoryId ? String(categoryId) : ''} onChange={(v) => { setCategoryId(v ? Number(v) : null); resetPage(); }}
              options={categoryOptions} searchable={categoryOptions.length > LIST_SEARCH_THRESHOLD}
              searchPlaceholder="Tìm lĩnh vực…" placeholder="Tất cả lĩnh vực" loading={categories.isPending} />
          </div>
          <div className="w-full sm:w-52">
            <ListSelect id="manager-filter-assignee" ariaLabel="Lọc theo cán bộ phụ trách" floating className={filterTrigger}
              value={assignee} onChange={(v) => { setAssignee(v); resetPage(); }}
              options={officerOptions} searchable={officerOptions.length > LIST_SEARCH_THRESHOLD}
              searchPlaceholder="Tìm theo tên cán bộ…" placeholder="Mọi cán bộ" loading={officers.isPending} />
          </div>
          <RefreshButton loading={list.isFetching} onClick={() => void Promise.all([list.refetch(), officers.refetch(), summary.refetch()])} />
        </div>
        {/* Lọc nhanh thay cho 2 thẻ thống kê và ô tích "Chỉ quá hạn": bấm để bật/tắt, số đếm lấy từ assignment-summary */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Lọc nhanh:</span>
          <button
            type="button"
            aria-pressed={unassignedActive}
            onClick={() => {
              setStatus(unassignedActive ? '' : 'SUBMITTED');
              setAssignee(unassignedActive ? '' : 'unassigned');
              resetPage();
            }}
            className={`${quickChip} ${unassignedActive ? 'border-red-800 bg-red-50 text-red-900' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
          >
            <Tray size={16} aria-hidden="true" />
            <span>Chưa có người nhận</span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 font-mono text-slate-700">{unassignedCount ?? '—'}</span>
          </button>
          <button
            type="button"
            aria-pressed={overdue}
            onClick={() => { setOverdue(!overdue); resetPage(); }}
            className={`${quickChip} ${overdue ? 'border-red-800 bg-red-50 text-red-900' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
          >
            <WarningCircle size={16} aria-hidden="true" className={overdueCount ? 'text-red-700' : undefined} />
            <span>Quá hạn tiền kiểm</span>
            <span className={`rounded-full px-2 py-0.5 font-mono ${overdueCount ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-700'}`}>{overdueCount ?? '—'}</span>
          </button>
          {hasFilter && (
            <button
              type="button"
              onClick={() => { setStatus(''); setCategoryId(null); setAssignee(''); setOverdue(false); setCodeInput(''); setCode(''); resetPage(); }}
              className="inline-flex min-h-10 items-center px-2 text-xs font-semibold text-red-800 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-800 focus-visible:ring-offset-2"
            >
              Xóa bộ lọc
            </button>
          )}
        </div>
        </div>

        {list.isError && (
          <ErrorAlert className="mx-4 my-3" retrying={list.isFetching} onRetry={() => void list.refetch()}>{workflowError(list.error)}</ErrorAlert>
        )}
        {summary.isError && (
          <p role="alert" className="mx-4 my-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
            Chưa tải được số liệu phân công: {workflowError(summary.error)}
          </p>
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
                <TableSkeletonRows
                  columns={6}
                  rows={5}
                  columnWidths={['w-28 font-mono', 'w-60', 'w-24', 'w-28', 'w-36', 'ml-auto w-24']}
                  lastCellClassName="sticky right-0 z-10 bg-white text-right shadow-[-8px_0_12px_-12px_rgba(15,23,42,0.35)]"
                />
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6}><EmptyState title="Không có hồ sơ nào phù hợp với bộ lọc hiện tại." description={hasFilter ? 'Thử bỏ bớt điều kiện lọc hoặc bấm “Xóa bộ lọc”.' : undefined} /></td>
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
                    <td className="whitespace-nowrap"><ApplicationStatusBadge status={(item.status || '').toUpperCase() === 'SUBMITTED' && (item.resubmitCount ?? 0) > 0 ? 'RESUBMITTED' : item.status || ''} label={statusLabel(item)} /></td>
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
                      {canAssign && canDispatch && (
                        <Button size="small" className="gap-1.5" onClick={() => openAssign(item)}>
                          <UserPlus size={14} aria-hidden="true" /> Giao cán bộ
                        </Button>
                      )}
                      {canTransfer && canDispatch && (
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

        <Pagination
          className="border-t border-slate-100 px-4 py-3"
          label="Phân trang giám sát hồ sơ"
          page={page}
          total={total}
          pageSize={PAGE_SIZE}
          unit="hồ sơ"
          disabled={list.isFetching}
          onPageChange={(p) => setPage(Math.max(1, p))}
        />
      </section>

      <AssignmentHistoryModal item={historyItem} lookup={historyLookup} onClose={() => setHistoryItem(null)} />
      {target && <AssignDialog application={target} onClose={() => setTarget(null)} />}
    </div>
  );
}
