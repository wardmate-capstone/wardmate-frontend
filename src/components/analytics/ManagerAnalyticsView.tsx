import { useState, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowsClockwise, Star } from '@phosphor-icons/react';
import { AnalyticsTrendChart } from './AnalyticsTrendChart';
import { OverviewCountChart } from './OverviewCountChart';
import { StatTile, chartColors, numberVi } from './chartKit';
import { useAnalytics } from '@/hooks/useAnalytics';
import { analyticsApi, initialAnalyticsQuery, type deadlinesSchema } from '@/lib/api/analytics';
import type { z } from 'zod';
import { AnalyticsFilters, AnalyticsPagination, AnalyticsStatus, CoverageNotice } from './AnalyticsFilters';
import { procedureApi } from '@/lib/api/procedures';
import { getManagerOfficers } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/Button';

const labels = { receivedCount: 'Lượt gửi tiền kiểm', readyCount: 'Giấy tờ sẵn sàng', revisionRequestedCount: 'Lượt yêu cầu bổ sung', resubmittedCount: 'Lượt gửi lại', cancelledCount: 'Hồ sơ đã hủy' } as const;
function metric(value: number | null | undefined, suffix = '') { return value == null ? 'Chưa đủ dữ liệu' : value.toLocaleString('vi-VN', { maximumFractionDigits: 2 }) + suffix; }

function Deadlines({ value, backlog = false }: { value?: z.infer<typeof deadlinesSchema> | null; backlog?: boolean }) {
  if (!value) return <p className="text-sm text-slate-500">Chưa có dữ liệu hạn tiền kiểm.</p>;
  // Ô số không chứa câu chữ: thiếu dữ liệu hiện "—" (lý do ở title).
  const rate = (v: number | null) => v == null ? '—' : metric(v, '%');
  const items: [string, ReactNode, string?][] = backlog ? [
    ['Đang tồn quá hạn', numberVi(value.openOverdue), value.openOverdue > 0 ? chartColors.critical : undefined],
    ['Đang tạm dừng tính hạn', numberVi(value.openPaused)],
    ['Đang tồn chưa có hạn', numberVi(value.openMissingDeadline)],
  ] : [
    ['Đúng hạn', rate(value.onTimeRate), chartColors.good],
    ['Quá hạn', rate(value.lateRate), chartColors.critical],
    ['Đang tồn quá hạn', numberVi(value.openOverdue), value.openOverdue > 0 ? chartColors.critical : undefined],
    ['Đang tạm dừng tính hạn', numberVi(value.openPaused)],
  ];
  return <dl className={`grid gap-3 sm:grid-cols-2 ${backlog ? 'xl:grid-cols-3' : 'xl:grid-cols-4'}`}>{items.map(([label, val, color]) => (
    <div key={label} className="rounded-xl border border-slate-200 bg-white p-3" title={val === '—' ? 'Chưa đủ dữ liệu' : undefined}>
      <dt className="flex items-center gap-1.5 text-xs text-slate-500">
        {color && <span aria-hidden="true" className="size-2 rounded-full" style={{ backgroundColor: color }} />}{label}
      </dt>
      <dd className="mt-1 text-lg font-bold tabular-nums text-slate-900">{val}</dd>
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
  const userId = useAuthStore(state => state.user?.id);
  const query = useQuery({ queryKey: ['analytics', userId, 'officer-directory'], queryFn: () => getManagerOfficers({ page: 1, pageSize: 100 }), retry: false });
  const officer = query.data?.items.find(item => item.id === id);
  return <span className="font-medium text-slate-900">{officer?.fullName || officer?.username || `Cán bộ ${id}`}</span>;
}

function Stars({ rating }: { rating: number }) {
  return <span className="inline-flex items-center gap-0.5" aria-label={`${rating}/5 sao`} role="img">
    {[1, 2, 3, 4, 5].map(i => <Star key={i} size={16} weight={i <= rating ? 'fill' : 'regular'} className={i <= rating ? 'text-amber-500' : 'text-slate-300'} aria-hidden="true" />)}
  </span>;
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
    <AnalyticsFilters value={filters} onChange={setFilters} />
    <div className="flex justify-end">
      <Button variant="outline" size="small" className="gap-1.5" loading={refreshing} onClick={() => { void current.refetch(); if (section === 'stats-dossiers') void trends.refetch(); }}>
        {!refreshing && <ArrowsClockwise size={15} aria-hidden="true" />} Làm mới dữ liệu
      </Button>
    </div>
    <AnalyticsStatus pending={current.isPending} error={current.error} retry={() => void current.refetch()} />

    {!current.isError && current.data && <>
      {overviewEnabled && overview.data && <Card title="Kết quả tiền kiểm trong kỳ">
        <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {Object.entries(labels).map(([key, label]) => <StatTile key={key} label={label} value={numberVi(overview.data!.totals[key as keyof typeof labels])} />)}
        </dl>
        <Deadlines value={overview.data.deadlines} />
        <CoverageNotice data={overview.data.coverage} />
      </Card>}

      {procedures && procedureRows.data && <Card title="Thống kê theo thủ tục">
        <div className="admin-table-wrap"><table>
          <thead><tr>
            <Th label="Thủ tục" />
            <Th label="Lượt gửi" hint="Số lượt công dân gửi tiền kiểm trong kỳ" />
            <Th label="Hồ sơ đã hoàn tất" hint="Số hồ sơ được cán bộ xác nhận giấy tờ sẵn sàng trong kỳ" />
            <Th label="Yêu cầu bổ sung" hint="Số lượt yêu cầu công dân bổ sung trong kỳ" />
            <Th label="Đúng hạn" hint="Tỷ lệ hồ sơ hoàn tất trước hạn, trên các hồ sơ có hạn xác định" />
            <Th className="text-right" label="Đang tồn quá hạn" hint="Hồ sơ chưa hoàn tất và đã quá hạn" />
          </tr></thead>
          <tbody>{procedureRows.data.items.map(row => <tr key={row.procedureId}>
            <td><ProcedureName id={row.procedureId} /></td>
            <td className="tabular-nums">{numberVi(row.totals.receivedCount)}</td>
            <td className="tabular-nums">{numberVi(row.totals.readyCount)}</td>
            <td className="tabular-nums">{numberVi(row.totals.revisionRequestedCount)}</td>
            <td className="tabular-nums">{metric(row.deadlines?.onTimeRate, '%')}</td>
            <td className="tabular-nums">{metric(row.deadlines?.openOverdue)}</td>
          </tr>)}</tbody>
        </table></div>
        <CoverageNotice data={procedureRows.data.coverage} />
      </Card>}

      {officers && officerRows.data && <Card title="Hiệu suất tiền kiểm theo cán bộ">
        <div className="admin-table-wrap"><table>
          <thead><tr>
            <Th label="Cán bộ" />
            <Th label="Hồ sơ đã hoàn tất" hint="Số hồ sơ cán bộ đã xác nhận giấy tờ sẵn sàng trong kỳ (mỗi hồ sơ tính một lần)" />
            <Th label="Yêu cầu bổ sung" hint="Số hồ sơ cán bộ đã yêu cầu công dân bổ sung trong kỳ" />
            <Th label="Thời gian xử lý TB" hint="Trung bình từ lúc công dân nộp lần đầu đến khi cán bộ xác nhận giấy tờ sẵn sàng" />
            <Th label="Đúng hạn" hint="Tỷ lệ hồ sơ hoàn tất trước hạn, trên các hồ sơ có hạn xác định" />
            <Th className="text-right" label="Đang tồn quá hạn" hint="Hồ sơ cán bộ đang phụ trách, chưa hoàn tất và đã quá hạn" />
          </tr></thead>
          <tbody>{officerRows.data.items.map(row => <tr key={row.officerId}>
            <td><OfficerName id={row.officerId} /></td>
            <td className="tabular-nums font-semibold text-slate-900">{numberVi(row.readyCount)}</td>
            <td className="tabular-nums">{numberVi(row.revisionRequestedCount)}</td>
            <td className="tabular-nums" title={row.averageElapsedMinutes == null ? undefined : `${metric(row.averageElapsedMinutes)} phút`}>{duration(row.averageElapsedMinutes)}</td>
            <td className="tabular-nums">{metric(row.deadlines?.onTimeRate, '%')}</td>
            <td className="tabular-nums">{metric(row.deadlines?.openOverdue)}</td>
          </tr>)}</tbody>
        </table></div>
        <h3 className="font-semibold text-slate-800">Hồ sơ chưa phân công cán bộ</h3>
        <Deadlines value={officerRows.data.unassignedDeadlines} />
        <CoverageNotice data={officerRows.data.coverage} />
      </Card>}

      {feedback && feedbackRows.data && <Card title="Phản hồi người dân">
        <div className="grid gap-3 lg:grid-cols-2">{feedbackRows.data.items.map(row => <article key={row.id} className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Stars rating={row.rating} />
            <time className="text-xs text-slate-500">{new Date(row.createdAtUtc).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}</time>
          </div>
          <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-slate-800">{row.comment || <span className="italic text-slate-400">Không có góp ý thêm.</span>}</p>
          <p className="mt-3 break-all font-mono text-[11px] text-slate-400">Hồ sơ: {row.applicationId}</p>
        </article>)}</div>
      </Card>}

      {summary && feedbackSummary.data && <Card title="Mức độ hài lòng">
        <dl className="grid gap-3 sm:grid-cols-3">
          <StatTile label="Tổng số đánh giá" value={numberVi(feedbackSummary.data.totalCount)} />
          <StatTile label="Điểm trung bình" value={metric(feedbackSummary.data.averageRating, '/5')} />
          <StatTile label="Tỷ lệ hài lòng" value={metric(feedbackSummary.data.satisfactionRate, '%')} hint="Đánh giá 4–5 sao" />
        </dl>
        <p className="text-sm text-slate-600">Hài lòng (4–5 sao): {metric(feedbackSummary.data.satisfactionRate, '%')}</p>
        <OverviewCountChart title="Phân bố đánh giá" points={Object.entries(feedbackSummary.data.ratingCounts).reverse().map(([star, value]) => ({ name: `${star} sao`, value }))} emptyMessage="Chưa có đánh giá trong kỳ đã chọn." />
      </Card>}

      {pageData && <>{pageData.items.length === 0 && <p role="status" className="rounded-xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-500">Không có dữ liệu trong kỳ đã chọn.</p>}<AnalyticsPagination page={pageData.page} size={pageData.pageSize} total={pageData.totalCount} onChange={page => setFilters(previous => ({ ...previous, page }))} /></>}
    </>}

    {section === 'stats-dossiers' && <Card title="Xu hướng tiền kiểm theo ngày">
      <AnalyticsStatus pending={trends.isPending} error={trends.error} retry={() => void trends.refetch()} />
      {!trends.isError && trends.data && <>
        <AnalyticsTrendChart data={trends.data} />
        <h3 className="font-semibold text-slate-800">Hồ sơ còn tồn tại thời điểm thống kê</h3>
        <Deadlines value={trends.data.currentBacklog} backlog />
      </>}
    </Card>}
  </div>;
}
