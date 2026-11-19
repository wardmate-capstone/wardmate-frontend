import { useCallback } from 'react';
import { formatDate } from '@/lib/dateFormat';
import { Files, CaretRight } from '@phosphor-icons/react';
import { procedureApi, type DraftSummary, type ProcedureSummary } from '@/lib/api/procedures';
import { useProcedureQuery } from '@/hooks/useProcedureQuery';
import { ProcedureFeedback } from '@/components/ui/ProcedureFeedback';
import { ListSkeleton, EmptyState, Skeleton } from '@/components/ui';
import type { ProcedureNavSection } from '@/components/layout/RoleWorkspaceSidebars';

export interface ProcedureDashboardViewProps {
  stats?: { active: number; inactive: number };
  statsLoading?: boolean;
  categoriesCount?: number;
  /** Có quyền xem bản nháp (procedure.drafts.read) thì hiện ô "Bản nháp chờ đối soát". */
  canReadDrafts?: boolean;
  onNavigateSection: (section: ProcedureNavSection) => void;
  onSelectProcedure: (procedure: ProcedureSummary) => void;
}

const num = (value?: number) => (value === undefined ? '—' : value.toLocaleString('vi-VN'));
/** API bản nháp không trả tổng số: đọc tối đa 5 trang (50 bản nháp gần nhất) để đếm. */
const DRAFT_PAGES = 5;
const DRAFT_PAGE_SIZE = 10;

async function loadDrafts(signal: AbortSignal) {
  const items: DraftSummary[] = [];
  for (let page = 1; page <= DRAFT_PAGES; page++) {
    const rows = await procedureApi.drafts(page, signal);
    items.push(...rows);
    if (rows.length < DRAFT_PAGE_SIZE) return { items, capped: false };
  }
  return { items, capped: true };
}

/**
 * Tổng quan Quản lý thủ tục theo chuẩn khu làm việc (giống Tổng quan Admin/Manager):
 * dải chỉ số (kèm bản nháp chờ đối soát — việc cần làm thật), danh sách thủ tục gần đây dạng dòng.
 * Không có khối lối tắt trùng menu; nút "Thêm thủ tục" nằm ở tiêu đề trang.
 */
export function ProcedureDashboardView({
  stats,
  statsLoading = false,
  categoriesCount,
  canReadDrafts = false,
  onNavigateSection,
  onSelectProcedure,
}: ProcedureDashboardViewProps) {
  const recent = useProcedureQuery(
    useCallback(
      (signal: AbortSignal) =>
        procedureApi.list({ pageSize: 5, sortBy: 'UpdatedAt', isAscending: false }, true, signal),
      [],
    ),
  );
  const drafts = useProcedureQuery(
    useCallback((signal: AbortSignal) => (canReadDrafts ? loadDrafts(signal) : Promise.resolve(null)), [canReadDrafts]),
  );

  const totalCount = stats ? stats.active + stats.inactive : undefined;
  const activePercent = stats && totalCount ? Math.round((stats.active / totalCount) * 100) : null;
  const draftRows = drafts.data?.items ?? [];
  const needsReview = drafts.data ? draftRows.filter((row) => row.status === 'NeedsReview').length : undefined;
  const failed = draftRows.filter((row) => row.status === 'Failed').length;
  const draftHint = drafts.error
    ? 'Chưa tải được danh sách bản nháp'
    : failed > 0
      ? `${failed} bản đọc PDF thất bại`
      : drafts.data?.capped
        ? `Tính trong ${DRAFT_PAGES * DRAFT_PAGE_SIZE} bản nháp gần nhất`
        : needsReview
          ? 'Đối soát với PDF rồi xuất bản'
          : 'Không có bản nháp cần xử lý';

  const kpis: { label: string; value?: number; hint: string; section: ProcedureNavSection; loading: boolean }[] = [
    { label: 'Tổng số thủ tục', value: totalCount, hint: 'Gồm thủ tục đang công khai và đang ẩn', section: 'procedures', loading: statsLoading },
    { label: 'Đang công khai', value: stats?.active, hint: activePercent !== null ? `${activePercent}% tổng số thủ tục` : 'Người dân xem và nộp được', section: 'procedures', loading: statsLoading },
    { label: 'Đang ẩn', value: stats?.inactive, hint: stats?.inactive ? 'Cần rà soát hiệu lực' : 'Không có thủ tục ẩn', section: 'procedures', loading: statsLoading },
    { label: 'Lĩnh vực', value: categoriesCount, hint: 'Danh mục dùng để phân loại thủ tục', section: 'categories', loading: false },
  ];
  if (canReadDrafts) {
    kpis.push({ label: 'Bản nháp chờ đối soát', value: needsReview, hint: draftHint, section: 'drafts', loading: drafts.loading });
  }

  return (
    <div className="space-y-5">
      <section className={`admin-card kpi-strip${kpis.length === 5 ? ' is-5' : ''}`} aria-label="Các chỉ số tổng quan">
        <dl>
          {kpis.map(({ label, value, hint, section, loading }) => (
            <div key={label} className="is-link">
              <dt>{label}</dt>
              <dd className="kpi-value">
                {loading && value === undefined ? <Skeleton className="h-7 w-12 rounded" aria-label={`Đang tải số liệu ${label}`} /> : num(value)}
              </dd>
              <dd className="kpi-hint">{hint}</dd>
              <button type="button" className="kpi-cover" onClick={() => onNavigateSection(section)} aria-label={`Xem ${label.toLowerCase()}: ${num(value)}`} />
            </div>
          ))}
        </dl>
      </section>

      <section className="admin-card ws-panel min-w-0" aria-labelledby="pm-recent-title">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 id="pm-recent-title">Thủ tục cập nhật gần đây</h2>
            <p>5 thủ tục vừa được tạo hoặc sửa nội dung</p>
          </div>
          <button type="button" className="ws-link" onClick={() => onNavigateSection('procedures')}>
            Xem tất cả <CaretRight size={12} weight="bold" aria-hidden="true" />
          </button>
        </header>
        <div className="ws-panel-body">
          <ProcedureFeedback error={recent.error} retry={recent.refresh} />
          {recent.loading && <ListSkeleton rows={4} />}
          {!recent.loading && recent.data?.items.length === 0 && <EmptyState icon={Files} title="Chưa có thủ tục nào." />}
          {!recent.loading && !!recent.data?.items.length && (
            <ul>
              {recent.data.items.slice(0, 5).map((proc) => (
                <li key={proc.id} className="ws-row">
                  <div className="min-w-0">
                    <button
                      type="button"
                      onClick={() => onSelectProcedure(proc)}
                      className="block max-w-full truncate text-left text-[13px] font-semibold text-slate-900 hover:text-red-800 hover:underline"
                      title={proc.title}
                    >
                      {proc.title}
                    </button>
                    <p className="mt-0.5 truncate text-xs text-slate-500">
                      <span className="font-mono">{proc.procedureCode}</span>
                      {proc.categoryName ? ` · ${proc.categoryName}` : ''} · Cập nhật {formatDate(proc.updatedAt)}
                    </p>
                  </div>
                  <span className="ws-status shrink-0 whitespace-nowrap">
                    <span aria-hidden="true" className={`size-2 rounded-full ${proc.isActive ? 'bg-emerald-600' : 'bg-slate-400'}`} />
                    {proc.isActive ? 'Đang công khai' : 'Đang ẩn'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
