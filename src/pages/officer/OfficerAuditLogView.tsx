import React, { useState, useMemo } from 'react';
import { formatDateTime } from '@/lib/dateFormat';
import {
  ClockCounterClockwise,
} from '@phosphor-icons/react';
import { RefreshButton, TableSkeletonRows, SearchInput, Select, Pagination, EmptyState, ErrorAlert } from '@/components/ui';
import { useOfficerActivity } from '@/hooks/useWorkflow';
import { workflowError, type OfficerActivityAction, type OfficerActivityDto } from '@/lib/api/workflow';

const PAGE_SIZE = 10;

type Tone = 'info' | 'success' | 'warning' | 'danger';

// Nhãn nghiệp vụ theo action BE: ASSIGNMENT dùng CLAIM/RELEASE/ASSIGN/TRANSFER, STATUS dùng trạng thái đích.
// Mọi dòng đều là thao tác của chính người xem (BE lọc ChangedBy/ActorId), nên ASSIGN/TRANSFER là Manager giao/chuyển.
const ACTION_META: Record<string, { label: string; tone: Tone }> = {
  CLAIM: { label: 'Nhận xử lý hồ sơ', tone: 'info' },
  RELEASE: { label: 'Trả về hàng đợi', tone: 'warning' },
  ASSIGN: { label: 'Giao hồ sơ cho cán bộ', tone: 'info' },
  TRANSFER: { label: 'Chuyển cán bộ phụ trách', tone: 'info' },
  SUBMITTED: { label: 'Đưa về chờ tiền kiểm', tone: 'info' },
  // Khi nhận xử lý, BE ghi cả dòng ASSIGNMENT/CLAIM và dòng STATUS/UNDER_REVIEW.
  UNDER_REVIEW: { label: 'Chuyển sang đang kiểm tra', tone: 'info' },
  NEED_REVISION: { label: 'Yêu cầu bổ sung', tone: 'warning' },
  DOCUMENTS_READY: { label: 'Xác nhận giấy tờ sẵn sàng', tone: 'success' },
  OFFICIALLY_RECEIVED: { label: 'Tiếp nhận tại quầy', tone: 'success' },
  CANCELLED: { label: 'Hủy hồ sơ', tone: 'danger' },
};

const FILTER_OPTIONS: Array<{ value: '' | OfficerActivityAction; label: string }> = [
  { value: '', label: 'Mọi hành động' },
  { value: 'CLAIM', label: 'Nhận xử lý' },
  { value: 'RELEASE', label: 'Trả về hàng đợi' },
  { value: 'NEED_REVISION', label: 'Yêu cầu bổ sung' },
  { value: 'DOCUMENTS_READY', label: 'Giấy tờ sẵn sàng' },
  { value: 'OFFICIALLY_RECEIVED', label: 'Tiếp nhận tại quầy' },
];

function formatTime(value: string) {
  return formatDateTime(value);
}

function applicationNumber(item: OfficerActivityDto) {
  return item.applicationCode || `HS-${item.applicationId.slice(0, 8).toUpperCase()}`;
}

interface OfficerAuditLogViewProps {
  officerName: string;
  onOpenApplication?: (applicationId: string) => void;
}

export const OfficerAuditLogView: React.FC<OfficerAuditLogViewProps> = ({
  officerName,
  onOpenApplication,
}) => {
  const [page, setPage] = useState(1);
  const [action, setAction] = useState<'' | OfficerActivityAction>('');
  const [searchQuery, setSearchQuery] = useState('');
  const activity = useOfficerActivity({ page, pageSize: PAGE_SIZE, action: action || undefined });
  const total = activity.data?.total ?? 0;

  // Tìm nhanh trong trang đang xem; lọc hành động và phân trang do server xử lý.
  const rows = useMemo(() => {
    const items = activity.data?.items ?? [];
    const q = searchQuery.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) =>
      applicationNumber(item).toLowerCase().includes(q) ||
      (item.applicantName ?? '').toLowerCase().includes(q) ||
      (item.procedureTitle ?? '').toLowerCase().includes(q) ||
      (item.reason ?? '').toLowerCase().includes(q)
    );
  }, [activity.data, searchQuery]);

  return (
    <section aria-label="Nhật ký hoạt động của cán bộ" className="space-y-6">
      <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-xl bg-slate-100 text-slate-800">
              <ClockCounterClockwise size={24} weight="bold" />
            </span>
            <div>
              <h3 className="text-base font-bold text-slate-950">Lịch sử xử lý của tôi</h3>
              <p className="text-xs text-slate-500">Các thao tác trên hồ sơ trong phường hiện tại, mới nhất trước.</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <SearchInput
              containerClassName="w-full sm:w-64"
              aria-label="Tìm trong trang lịch sử"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClear={() => setSearchQuery('')}
              placeholder="Tìm mã hồ sơ, tên công dân..."
            />

            <Select
              aria-label="Lọc theo hành động"
              value={action}
              onChange={(e) => { setAction(e.target.value as '' | OfficerActivityAction); setPage(1); }}
            >
              {FILTER_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </Select>

            <RefreshButton loading={activity.isFetching} onClick={() => void activity.refetch()} />
          </div>
        </div>
      </header>

      {activity.isError && (
        <ErrorAlert retrying={activity.isFetching} onRetry={() => void activity.refetch()}>{workflowError(activity.error)}</ErrorAlert>
      )}

      {/* Semantic Audit Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
        <div className="admin-table-wrap">
          <table className="min-w-[800px]" aria-label="Lịch sử thao tác của cán bộ">
            <thead>
              <tr>
                <th>Thời gian</th>
                <th>Mã hồ sơ</th>
                <th>Công dân</th>
                <th>Hành động nghiệp vụ</th>
                <th>Chi tiết thao tác</th>
                <th className="text-right">Cán bộ thực hiện</th>
              </tr>
            </thead>
            <tbody>
              {activity.isPending ? (
                <TableSkeletonRows
                  columns={6}
                  rows={6}
                  cellClassName="px-4 py-3.5 first:pl-5 last:pr-5"
                  columnWidths={['w-28 font-mono', 'w-32 font-mono', 'w-24', 'w-32', 'w-64', 'ml-auto w-28']}
                  lastCellClassName="text-right"
                />
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <EmptyState title={searchQuery.trim() ? 'Không có thao tác phù hợp trong trang này.' : 'Chưa có thao tác nào được ghi nhận.'} />
                  </td>
                </tr>
              ) : (
                rows.map((item) => {
                  const meta = ACTION_META[item.action.toUpperCase()] ?? { label: item.action, tone: 'info' as Tone };
                  return (
                    <tr key={`${item.source}-${item.id}`} className="hover:bg-slate-50">
                      <td className="text-slate-500 whitespace-nowrap font-mono">
                        {formatTime(item.createdAt)}
                      </td>
                      <td className="font-mono font-bold text-slate-900">
                        {onOpenApplication ? (
                          <button
                            type="button"
                            onClick={() => onOpenApplication(item.applicationId)}
                            className="hover:text-red-700 hover:underline"
                          >
                            {applicationNumber(item)}
                          </button>
                        ) : (
                          applicationNumber(item)
                        )}
                      </td>
                      <td className="font-medium text-slate-800">
                        {item.applicantName?.trim() || 'Công dân'}
                      </td>
                      <td className="whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            meta.tone === 'success'
                              ? 'bg-emerald-100 text-emerald-800'
                              : meta.tone === 'warning'
                              ? 'bg-amber-100 text-amber-900'
                              : meta.tone === 'danger'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-blue-100 text-blue-900'
                          }`}
                        >
                          {meta.label}
                        </span>
                      </td>
                      <td className="text-slate-600 max-w-sm">
                        <span className="block">{item.procedureTitle || 'Thủ tục hành chính'}</span>
                        {item.reason && <span className="block text-slate-500">Lý do: {item.reason}</span>}
                      </td>
                      <td className="text-right font-semibold text-slate-800 whitespace-nowrap">
                        {officerName}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          className="border-t border-slate-100 px-4 py-3"
          label="Phân trang lịch sử xử lý"
          page={page}
          total={total}
          pageSize={PAGE_SIZE}
          unit="thao tác"
          // BE giới hạn page × pageSize ≤ 5000
          hasNext={page * PAGE_SIZE < Math.min(total, 5000)}
          disabled={activity.isFetching}
          onPageChange={(p) => setPage(Math.max(1, p))}
        />
      </div>
    </section>
  );
};
