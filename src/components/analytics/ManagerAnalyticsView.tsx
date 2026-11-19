import { useState, type ReactNode } from 'react';
import { formatDateTime } from '@/lib/dateFormat';
import { useQuery } from '@tanstack/react-query';
import { Star } from '@phosphor-icons/react';
import { RefreshButton, EmptyState } from '@/components/ui';
import { DossierStatsView } from './DossierStatsView';
import { OverviewCountChart } from './OverviewCountChart';
import { StatTile, chartColors, numberVi } from './chartKit';
import { useAnalytics } from '@/hooks/useAnalytics';
import { analyticsApi, initialAnalyticsQuery, type deadlinesSchema, type feedbackSchema } from '@/lib/api/analytics';
import { workflowApi } from '@/lib/api/workflow';
import type { z } from 'zod';
import { AnalyticsFilters, AnalyticsPagination, AnalyticsStatus, CoverageNotice } from './AnalyticsFilters';
import { procedureApi } from '@/lib/api/procedures';
import { getManagerOfficers } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

function metric(value: number | null | undefined, suffix = '') { return value == null ? 'Chưa đủ dữ liệu' : value.toLocaleString('vi-VN', { maximumFractionDigits: 2 }) + suffix; }
/** Ô số trong bảng/ô chỉ số: thiếu dữ liệu hiện "—" (lý do ở title, trình đọc màn hình đọc đủ), không in câu chữ vào chỗ số (L27). */
function cell(value: number | null | undefined, suffix = '') {
  return value == null ? <abbr className="text-slate-400 no-underline" title="Chưa đủ dữ liệu">—</abbr> : metric(value, suffix);
}
function EmptyRow({ columns }: { columns: number }) {
  return <tr><td colSpan={columns} className="py-8 text-center text-[13px] text-slate-500">Không có dữ liệu trong kỳ đã chọn.</td></tr>;
}

function Deadlines({ value }: { value?: z.infer<typeof deadlinesSchema> | null }) {
  if (!value) return <EmptyState title="Chưa có dữ liệu hạn tiền kiểm." />;
  // Ô số không chứa câu chữ: thiếu dữ liệu hiện "—" (lý do ở title).
  const rate = (v: number | null) => v == null ? '—' : metric(v, '%');
  const items: [string, ReactNode, string?][] = [
    ['Đúng hạn', rate(value.onTimeRate), chartColors.good],
    ['Quá hạn', rate(value.lateRate), chartColors.critical],
    ['Đang tồn quá hạn', numberVi(value.openOverdue), value.openOverdue > 0 ? chartColors.critical : undefined],
    ['Đang tạm dừng tính hạn', numberVi(value.openPaused)],
  ];
  return <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{items.map(([label, val, color]) => (
    <div key={label} className="stat-tile rounded-xl border border-slate-200 bg-white p-3" title={val === '—' ? 'Chưa đủ dữ liệu' : undefined}>
      <dt className="flex items-center gap-1.5 text-xs text-slate-500">
        {color && <span aria-hidden="true" className="size-2 rounded-full" style={{ backgroundColor: color }} />}{label}
      </dt>
      <dd className="stat-tile-value mt-1 text-lg font-bold tabular-nums text-slate-900">{val}</dd>
    </div>
  ))}</dl>;
}

/** Thời gian xử lý dễ đọc: "17 giờ 39 phút", "10 phút", "2 ngày 3 giờ". */
function duration(minutes: number | null | undefined) {
  if (minutes == null) return 'Chưa đủ dữ liệu';
  const total = Math.round(minutes);
  if (total < 1) return 'Dưới 1 phút';
  const days = Math.floor(total / 1440), hours = Math.floor(total % 1440 / 60), mins = total % 60;
  if (days) return hours ? `${days} ngày ${hours} giờ` : `${days} ngày`;
  if (hours) return mins ? `${hours} giờ ${mins} phút` : `${hours} giờ`;
  return `${mins} phút`;
}

/** Tiêu đề cột kèm giải thích khi rê chuột / đọc màn hình. */
function Th({ label, hint, className }: { label: string; hint?: string; className?: string }) {
  return <th title={hint} scope="col" className={className}>{hint ? <span className="cursor-help underline decoration-dotted decoration-slate-300 underline-offset-4">{label}<span className="sr-only"> ({hint})</span></span> : label}</th>;
}


function ProcedureName({ id }: { id: string }) {
  const query = useQuery({ queryKey: ['procedure-name', id], queryFn: ({ signal }) => procedureApi.detail(id, signal), retry: false });
  return <span className="font-medium text-slate-900">{query.data?.title ?? `Thủ tục ${id}`}</span>;
}
function OfficerName({ id }: { id: string }) {
  const user = useAuthStore(state => state.user);
  const query = useQuery({ queryKey: ['analytics', user?.id, 'officer-directory'], enabled: !!user?.roles.includes('MANAGER') && user.permissions.includes('iam.accounts.read'), queryFn: async () => {
    const first = await getManagerOfficers({ page: 1, pageSize: 100 });
    const items = [...first.items];
    for (let page = 2; items.length < first.total; page++) {
      const next = await getManagerOfficers({ page, pageSize: 100 });
      if (!next.items.length) throw new Error('Danh sách cán bộ chưa đầy đủ. Vui lòng tải lại.');
      items.push(...next.items);
    }
    return items;
  }, retry: false });
  const officer = query.data?.find(item => item.id.toLowerCase() === id.toLowerCase());
  return <span className="font-medium text-slate-900">{officer?.fullName?.trim() || officer?.username || 'Chưa có tên cán bộ'}</span>;
}

function Stars({ rating }: { rating: number }) {
  return <span className="inline-flex items-center gap-0.5" aria-label={`${rating}/5 sao`} role="img">
    {[1, 2, 3, 4, 5].map(i => <Star key={i} size={16} weight={i <= rating ? 'fill' : 'regular'} className={i <= rating ? 'text-amber-500' : 'text-slate-300'} aria-hidden="true" />)}
  </span>;
}

const RATING_LABELS = ['Rất không hài lòng', 'Không hài lòng', 'Bình thường', 'Hài lòng', 'Rất hài lòng'];

type FeedbackRow = z.infer<typeof feedbackSchema>;

// Phản hồi từ 08/11 có sẵn mã hồ sơ, tên thủ tục, tên người dân (BE-D).
// Phản hồi cũ trả null: khi đó mới tra chi tiết hồ sơ của Manager để bổ sung.
function useFeedbackRef(row: FeedbackRow) {
  const userId = useAuthStore(state => state.user?.id);
  const complete = Boolean(row.applicationCode && row.procedureTitle && row.applicantName);
  const query = useQuery({
    queryKey: ['workflow', 'application', row.applicationId, 'feedback-ref', userId],
    queryFn: ({ signal }) => workflowApi.getOfficerApplication(row.applicationId, signal),
    enabled: !complete,
    staleTime: 10 * 60_000,
    retry: false,
  });
  return {
    pending: !complete && query.isPending,
    found: Boolean(row.applicationCode || query.data),
    code: row.applicationCode || query.data?.applicationCode,
    title: row.procedureTitle || query.data?.procedureTitle,
    name: row.applicantName || query.data?.applicantName,
  };
}

function FeedbackCitizen({ row }: { row: FeedbackRow }) {
  const ref = useFeedbackRef(row);
  if (ref.pending) return <span className="inline-block h-4 w-28 animate-pulse rounded bg-slate-100" aria-label="Đang tải tên người dân" />;
  return ref.name
    ? <span className="font-medium text-slate-900">{ref.name}</span>
    : <span className="italic text-slate-400" title="Người dân chưa khai báo thông tin cá nhân">Không có tên trong hồ sơ</span>;
}

function FeedbackApplication({ row }: { row: FeedbackRow }) {
  const ref = useFeedbackRef(row);
  if (ref.pending) return <span className="inline-block h-4 w-40 animate-pulse rounded bg-slate-100" aria-label="Đang tải mã hồ sơ" />;
  if (!ref.found) return <span className="text-sm italic text-slate-400" title={row.applicationId}>Hồ sơ không còn trong phạm vi xem</span>;
  return <span className="block min-w-0">
    <span className="block font-mono text-xs font-semibold text-slate-900">{ref.code || 'Chưa có mã hồ sơ'}</span>
    <span className="mt-0.5 block truncate text-sm text-slate-600">{ref.title || 'Thủ tục hành chính'}</span>
  </span>;
}

function feedbackTime(value: string) {
  return formatDateTime(value);
}

function FeedbackTable({ rows, total }: { rows: z.infer<typeof feedbackSchema>[]; total: number }) {
  const [reading, setReading] = useState<z.infer<typeof feedbackSchema> | null>(null);
  const average = rows.length ? rows.reduce((sum, row) => sum + row.rating, 0) / rows.length : null;
  return <section className="admin-card min-w-0 overflow-hidden">
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-4">
      <h2 className="font-bold text-slate-900">Phản hồi người dân</h2>
      <p className="text-[13px] text-slate-500">
        <span className="font-semibold text-slate-900">{numberVi(total)}</span> phản hồi
        {average != null && <> · Trung bình trang này <span className="font-semibold text-slate-900">{average.toLocaleString('vi-VN', { maximumFractionDigits: 1 })}</span> <Star size={13} weight="fill" className="inline -translate-y-px text-amber-500" aria-hidden="true" /></>}
      </p>
    </div>
    {rows.length === 0 && <EmptyState title="Chưa có phản hồi nào trong kỳ đã chọn." description="Thử chọn khoảng ngày rộng hơn." />}
    {rows.length > 0 && <div className="admin-table-wrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-800 focus-visible:ring-offset-2" tabIndex={0} role="region" aria-label="Bảng phản hồi người dân"><table className="mgr-stack min-w-[900px]">
      <caption className="sr-only">Danh sách phản hồi người dân</caption>
      <thead><tr>
        <th scope="col" className="w-36">Thời gian</th>
        <th scope="col" className="w-44">Người dân</th>
        <th scope="col" className="w-72">Hồ sơ</th>
        <th scope="col" className="w-44">Đánh giá</th>
        <th scope="col">Góp ý</th>
      </tr></thead>
      <tbody>{rows.map(row => <tr key={row.id} className="border-b border-slate-100 align-top last:border-0 hover:bg-slate-50/70">
        <td className="whitespace-nowrap text-slate-600" data-label="Thời gian">{feedbackTime(row.createdAtUtc)}</td>
        <td data-label="Người dân"><FeedbackCitizen row={row} /></td>
        <td className="max-w-72" data-label="Hồ sơ"><FeedbackApplication row={row} /></td>
        <td data-label="Đánh giá"><Stars rating={row.rating} /><span className="mt-1 block text-xs text-slate-500">{RATING_LABELS[row.rating - 1]}</span></td>
        <td className="min-w-48 text-left" data-label="Góp ý">{row.comment
          ? row.comment.length > 160
            ? <div className="space-y-2"><p className="line-clamp-2 break-words text-slate-700">{row.comment.slice(0, 120)}…</p><Button size="small" variant="outline" onClick={() => setReading(row)}>Xem đầy đủ góp ý</Button></div>
            : <p className="whitespace-pre-wrap break-words text-slate-800">{row.comment}</p>
          : <span className="italic text-slate-400">Không có góp ý thêm.</span>}</td>
      </tr>)}</tbody>
    </table></div>}
    {reading && <Modal open title="Góp ý của người dân" description={reading.applicationCode?.trim() || undefined} onOpenChange={open => !open && setReading(null)}><div className="space-y-4 text-sm">{reading.applicantName?.trim() && <p className="font-semibold">{reading.applicantName}</p>}<Stars rating={reading.rating} /><p className="whitespace-pre-wrap break-words leading-relaxed text-slate-700">{reading.comment}</p></div></Modal>}
  </section>;
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return <section className="admin-card min-w-0 space-y-4 p-5"><h2 className="font-bold text-slate-900">{title}</h2>{children}</section>;
}

export function ManagerAnalyticsView({ section }: { section: string }) {
  const [filters, setFilters] = useState(initialAnalyticsQuery);
  const procedures = section === 'stats-procedures';
  const officers = section === 'perf-officers';
  const feedback = section === 'feedback-reports';
  const summary = section === 'satisfaction-level';
  const overviewEnabled = !procedures && !officers && !feedback && !summary;
  const overview = useAnalytics('overview', analyticsApi.overview, filters, overviewEnabled);
  const trends = useAnalytics('trends', analyticsApi.trends, filters, section === 'stats-dossiers');
  const procedureRows = useAnalytics('procedures', analyticsApi.procedures, filters, procedures);
  const officerRows = useAnalytics('officers', analyticsApi.officers, filters, officers);
  const feedbackRows = useAnalytics('feedback', analyticsApi.feedback, filters, feedback);
  const feedbackSummary = useAnalytics('summary', analyticsApi.summary, filters, summary);
  const current = procedures ? procedureRows : officers ? officerRows : feedback ? feedbackRows : summary ? feedbackSummary : overview;
  const pageData = procedures ? procedureRows.data : officers ? officerRows.data : feedback ? feedbackRows.data : undefined;
  const refreshing = current.isFetching || (section === 'stats-dossiers' && trends.isFetching);

  return <div className="space-y-5">
    <div className="mgr-period-filter"><AnalyticsFilters value={filters} onChange={setFilters} actions={
      <RefreshButton label="Làm mới dữ liệu" loading={refreshing} onClick={() => { void current.refetch(); if (section === 'stats-dossiers') void trends.refetch(); }} />
    } /></div>
    <AnalyticsStatus pending={current.isPending} error={current.error} retry={() => void current.refetch()} />

    {!current.isError && current.data && <>
      {overviewEnabled && overview.data && <DossierStatsView overview={overview.data} trends={trends} />}

      {procedures && procedureRows.data && <Card title="Thống kê theo thủ tục">
        <div className="admin-table-wrap"><table>
          <thead><tr>
            <Th label="Thủ tục" />
            <Th label="Lượt gửi" hint="Số lượt công dân gửi tiền kiểm trong kỳ" />
            <Th label="Giấy tờ sẵn sàng" hint="Số hồ sơ được cán bộ xác nhận giấy tờ sẵn sàng trong kỳ" />
            <Th label="Yêu cầu bổ sung" hint="Số lượt yêu cầu công dân bổ sung trong kỳ" />
            <Th label="Đúng hạn" hint="Tỷ lệ hồ sơ hoàn tất trước hạn, trên các hồ sơ có hạn xác định" />
            <Th className="text-right" label="Đang tồn quá hạn" hint="Hồ sơ chưa hoàn tất và đã quá hạn" />
          </tr></thead>
          <tbody>{procedureRows.data.items.length === 0 && <EmptyRow columns={6} />}{procedureRows.data.items.map(row => <tr key={row.procedureId}>
            <td><ProcedureName id={row.procedureId} /></td>
            <td className="tabular-nums">{numberVi(row.totals.receivedCount)}</td>
            <td className="tabular-nums">{numberVi(row.totals.readyCount)}</td>
            <td className="tabular-nums">{numberVi(row.totals.revisionRequestedCount)}</td>
            <td className="tabular-nums">{cell(row.deadlines?.onTimeRate, '%')}</td>
            <td className="tabular-nums">{cell(row.deadlines?.openOverdue)}</td>
          </tr>)}</tbody>
        </table></div>
        <CoverageNotice data={procedureRows.data.coverage} />
      </Card>}

      {officers && officerRows.data && <Card title="Hiệu suất tiền kiểm theo cán bộ">
        <div className="admin-table-wrap"><table>
          <thead><tr>
            <Th label="Cán bộ" />
            <Th label="Giấy tờ sẵn sàng" hint="Số hồ sơ cán bộ đã xác nhận giấy tờ sẵn sàng trong kỳ (mỗi hồ sơ tính một lần)" />
            <Th label="Yêu cầu bổ sung" hint="Số hồ sơ cán bộ đã yêu cầu công dân bổ sung trong kỳ" />
            <Th label="Thời gian xử lý TB" hint="Trung bình từ lúc công dân nộp lần đầu đến khi cán bộ xác nhận giấy tờ sẵn sàng" />
            <Th label="Đúng hạn" hint="Tỷ lệ hồ sơ hoàn tất trước hạn, trên các hồ sơ có hạn xác định" />
            <Th className="text-right" label="Đang tồn quá hạn" hint="Hồ sơ cán bộ đang phụ trách, chưa hoàn tất và đã quá hạn" />
          </tr></thead>
          <tbody>{officerRows.data.items.length === 0 && <EmptyRow columns={6} />}{officerRows.data.items.map(row => <tr key={row.officerId}>
            <td><OfficerName id={row.officerId} /></td>
            <td className="tabular-nums font-semibold text-slate-900">{numberVi(row.readyCount)}</td>
            <td className="tabular-nums">{numberVi(row.revisionRequestedCount)}</td>
            <td className="tabular-nums" title={row.averageElapsedMinutes == null ? undefined : `${metric(row.averageElapsedMinutes)} phút`}>{duration(row.averageElapsedMinutes)}</td>
            <td className="tabular-nums">{cell(row.deadlines?.onTimeRate, '%')}</td>
            <td className="tabular-nums">{cell(row.deadlines?.openOverdue)}</td>
          </tr>)}</tbody>
        </table></div>
        <h3 className="font-semibold text-slate-800">Hồ sơ chưa phân công cán bộ</h3>
        <Deadlines value={officerRows.data.unassignedDeadlines} />
        <CoverageNotice data={officerRows.data.coverage} />
      </Card>}

      {feedback && feedbackRows.data && <FeedbackTable rows={feedbackRows.data.items} total={feedbackRows.data.totalCount} />}

      {summary && feedbackSummary.data && <Card title="Mức độ hài lòng">
        <dl className="grid gap-3 sm:grid-cols-3">
          <StatTile label="Tổng số đánh giá" value={numberVi(feedbackSummary.data.totalCount)} />
          <StatTile label="Điểm trung bình" value={cell(feedbackSummary.data.averageRating, '/5')} hint={feedbackSummary.data.averageRating == null ? 'Chưa có đánh giá trong kỳ' : 'Thang điểm 1–5 sao'} />
          <StatTile label="Tỷ lệ hài lòng" value={cell(feedbackSummary.data.satisfactionRate, '%')} hint={feedbackSummary.data.satisfactionRate == null ? 'Chưa có đánh giá trong kỳ' : 'Đánh giá 4–5 sao'} />
        </dl>
        <OverviewCountChart title="Phân bố đánh giá" points={Object.entries(feedbackSummary.data.ratingCounts).reverse().map(([star, value]) => ({ name: `${star} sao`, value }))} emptyMessage="Chưa có đánh giá trong kỳ đã chọn." />
      </Card>}

      {pageData && <><AnalyticsPagination page={pageData.page} size={pageData.pageSize} total={pageData.totalCount} onChange={page => setFilters(previous => ({ ...previous, page }))} /></>}
    </>}
  </div>;
}
