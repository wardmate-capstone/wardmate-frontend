import { useState, type ReactNode } from 'react';
import { ArrowRight, ArrowsClockwise, CheckCircle, ClockCountdown, PaperPlaneTilt, Smiley } from '@phosphor-icons/react';
import { Button } from '@/components/ui/Button';
import { AnalyticsFilters, AnalyticsStatus, CoverageNotice } from '@/components/analytics/AnalyticsFilters';
import { AnalyticsTrendChart } from '@/components/analytics/AnalyticsTrendChart';
import { OverviewCountChart } from '@/components/analytics/OverviewCountChart';
import { StatTile, chartColors, numberVi } from '@/components/analytics/chartKit';
import { analyticsApi, initialAnalyticsQuery } from '@/lib/api/analytics';
import { useAnalytics } from '@/hooks/useAnalytics';
import type { ManagerSectionId } from '../types';

function formatMetric(value: number | null | undefined, suffix = '') {
  return value == null ? 'Chưa đủ dữ liệu' : value.toLocaleString('vi-VN', { maximumFractionDigits: 1 }) + suffix;
}
// Ô số lớn không chứa câu chữ: thiếu dữ liệu thì hiện gạch ngang, lý do nằm ở dòng phụ.
const bigMetric = (value: number | null | undefined, suffix = '') => value == null ? '—' : formatMetric(value, suffix);

function ChartCard({ id, title, subtitle, action, className = '', children }: {
  id: string; title: string; subtitle: string; action?: ReactNode; className?: string; children: ReactNode;
}) {
  return (
    <section className={`admin-card min-w-0 space-y-4 p-5 ${className}`} aria-labelledby={id}>
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 id={id} className="font-bold text-slate-900">{title}</h2>
          <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}

function LinkButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-red-800 hover:bg-red-50">
      {children} <ArrowRight size={14} aria-hidden="true" />
    </button>
  );
}

export function ManagerOverviewView({ onSelectSection }: { onSelectSection: (section: ManagerSectionId) => void }) {
  const [filters, setFilters] = useState(initialAnalyticsQuery);
  const overview = useAnalytics('overview', analyticsApi.overview, filters);
  const trends = useAnalytics('trends', analyticsApi.trends, filters);
  const summary = useAnalytics('summary', analyticsApi.summary, filters);
  const refreshing = overview.isFetching || trends.isFetching || summary.isFetching;
  const data = !overview.isError ? overview.data : undefined;
  const feedback = !summary.isError ? summary.data : undefined;
  const deadlines = data?.deadlines;
  const activities = data ? [
    { name: 'Gửi tiền kiểm', value: data.totals.receivedCount },
    { name: 'Sẵn sàng', value: data.totals.readyCount },
    { name: 'Yêu cầu bổ sung', value: data.totals.revisionRequestedCount },
    { name: 'Gửi lại', value: data.totals.resubmittedCount },
    { name: 'Đã hủy', value: data.totals.cancelledCount },
  ] : [];
  // Màu trạng thái (luôn có nhãn + số kèm theo, không dựa riêng vào màu).
  const completed = deadlines ? [
    { name: 'Đúng hạn', value: deadlines.completedOnTime, color: chartColors.good },
    { name: 'Quá hạn', value: deadlines.completedLate, color: chartColors.critical },
    { name: 'Chưa xác định hạn', value: deadlines.completedMissingDeadline, color: chartColors.neutral },
    { name: 'Không áp dụng hạn', value: deadlines.completedNotApplicable, color: chartColors.neutralLight },
  ] : [];

  return <div className="space-y-5">
    <AnalyticsFilters value={filters} onChange={setFilters} />
    <div className="flex justify-end">
      <Button variant="outline" size="small" className="gap-1.5" loading={refreshing} onClick={() => {
        void overview.refetch(); void trends.refetch(); void summary.refetch();
      }}>{!refreshing && <ArrowsClockwise size={15} aria-hidden="true" />} Làm mới dữ liệu</Button>
    </div>

    {data && <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatTile tone="blue" icon={<PaperPlaneTilt size={20} weight="duotone" />} label="Lượt gửi tiền kiểm" value={numberVi(data.totals.receivedCount)} hint={`${numberVi(data.totals.resubmittedCount)} lượt gửi lại`} />
      <StatTile tone="green" icon={<CheckCircle size={20} weight="duotone" />} label="Giấy tờ sẵn sàng" value={numberVi(data.totals.readyCount)} hint={`${numberVi(data.totals.revisionRequestedCount)} lượt yêu cầu bổ sung`} />
      <StatTile tone="amber" icon={<ClockCountdown size={20} weight="duotone" />} label="Tỷ lệ đúng hạn" value={bigMetric(data.onTimeRate, '%')} hint={data.onTimeRate == null ? 'Chưa đủ dữ liệu' : deadlines ? `${numberVi(deadlines.openOverdue)} hồ sơ đang tồn quá hạn` : undefined} />
      <StatTile tone="red" icon={<Smiley size={20} weight="duotone" />} label="Hài lòng (4–5 sao)" value={feedback ? bigMetric(feedback.satisfactionRate, '%') : '—'} hint={feedback ? `${numberVi(feedback.totalCount)} đánh giá · TB ${formatMetric(feedback.averageRating, '/5')}` : undefined} />
    </dl>}

    <div className="grid min-w-0 gap-5 xl:grid-cols-2">
      <ChartCard id="overview-trends" className="xl:col-span-2" title="Xu hướng tiền kiểm theo ngày" subtitle="Lượt gửi và giấy tờ sẵn sàng"
        action={<LinkButton onClick={() => onSelectSection('stats-dossiers')}>Chi tiết hồ sơ</LinkButton>}>
        <AnalyticsStatus pending={trends.isPending} error={trends.error} retry={() => void trends.refetch()} />
        {!trends.isError && trends.data && <><AnalyticsTrendChart data={trends.data} /><CoverageNotice data={trends.data.coverage} /></>}
      </ChartCard>

      <ChartCard id="overview-results" title="Kết quả tiền kiểm trong kỳ" subtitle="Số lượt theo từng hoạt động"
        action={<LinkButton onClick={() => onSelectSection('stats-procedures')}>Theo thủ tục</LinkButton>}>
        <AnalyticsStatus pending={overview.isPending} error={overview.error} retry={() => void overview.refetch()} />
        {data && <>
          <OverviewCountChart title="Lượt hoạt động tiền kiểm" points={activities} emptyMessage="Chưa có hoạt động tiền kiểm trong dữ liệu đã tổng hợp." />
        </>}
      </ChartCard>

      <ChartCard id="overview-deadlines" title="Hạn xử lý hồ sơ đã sẵn sàng" subtitle="Hồ sơ đã hoàn tất tiền kiểm"
        action={<LinkButton onClick={() => onSelectSection('perf-officers')}>Hiệu suất cán bộ</LinkButton>}>
        <AnalyticsStatus pending={overview.isPending} error={overview.error} retry={() => void overview.refetch()} />
        {data && (deadlines ? <>
          <OverviewCountChart title="Tình trạng hạn tiền kiểm" variant="donut" points={completed}
            center={data.onTimeRate == null ? { value: '—', caption: 'Chưa đủ dữ liệu' } : { value: formatMetric(data.onTimeRate, '%'), caption: `đúng hạn · ${numberVi(deadlines.completedSampleCount)} mẫu` }}
            emptyMessage="Chưa có hồ sơ sẵn sàng trong kỳ để phân tích hạn." />
          {(deadlines.openMissingDeadline > 0 || deadlines.openPaused > 0) && <p role="status" className="rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-950">Cần theo dõi: {deadlines.openMissingDeadline} hồ sơ đang tồn chưa có hạn xác định; {deadlines.openPaused} hồ sơ đang tạm dừng tính hạn.</p>}
        </> : <p role="status" className="py-12 text-center text-sm text-slate-500">Chưa có dữ liệu hạn tiền kiểm.</p>)}
      </ChartCard>

      <ChartCard id="overview-satisfaction" className="xl:col-span-2" title="Mức độ hài lòng" subtitle="Đánh giá của người dân"
        action={<LinkButton onClick={() => onSelectSection('feedback-reports')}>Xem phản hồi</LinkButton>}>
        <AnalyticsStatus pending={summary.isPending} error={summary.error} retry={() => void summary.refetch()} />
        {feedback && <div className="grid items-center gap-6 lg:grid-cols-[220px_1fr]">
          <div className="text-center lg:text-left">
            <p className="text-4xl font-bold text-slate-950">{bigMetric(feedback.averageRating, '/5')}</p>
            <p className="mt-1 text-sm text-slate-500"><span>điểm trung bình</span> · {numberVi(feedback.totalCount)} đánh giá</p>
            <p className="mt-3 text-sm text-slate-600">Hài lòng (4–5 sao): <strong>{formatMetric(feedback.satisfactionRate, '%')}</strong></p>
          </div>
          <OverviewCountChart title="Phân bố đánh giá" points={Object.entries(feedback.ratingCounts).reverse().map(([star, value]) => ({ name: `${star} sao`, value }))} emptyMessage="Chưa có đánh giá trong kỳ đã chọn." />
        </div>}
      </ChartCard>
    </div>
  </div>;
}
