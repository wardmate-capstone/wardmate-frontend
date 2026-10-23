import { useState } from 'react';
import { ArrowRight } from '@phosphor-icons/react';
import { Button } from '@/components/ui/Button';
import { AnalyticsFilters, AnalyticsStatus, CoverageNotice } from '@/components/analytics/AnalyticsFilters';
import { AnalyticsTrendChart } from '@/components/analytics/AnalyticsTrendChart';
import { OverviewCountChart } from '@/components/analytics/OverviewCountChart';
import { analyticsApi, initialAnalyticsQuery } from '@/lib/api/analytics';
import { useAnalytics } from '@/hooks/useAnalytics';
import type { ManagerSectionId } from '../types';

function formatMetric(value: number | null | undefined, suffix = '') {
  return value == null ? 'Chưa đủ dữ liệu' : value.toLocaleString('vi-VN', { maximumFractionDigits: 1 }) + suffix;
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
    { name: 'Gửi tiền kiểm', value: data.totals.receivedCount, color: '#991b1b' },
    { name: 'Sẵn sàng', value: data.totals.readyCount, color: '#047857' },
    { name: 'Yêu cầu bổ sung', value: data.totals.revisionRequestedCount, color: '#d97706' },
    { name: 'Gửi lại', value: data.totals.resubmittedCount, color: '#0369a1' },
    { name: 'Đã hủy', value: data.totals.cancelledCount, color: '#64748b' },
  ] : [];
  const completed = deadlines ? [
    { name: 'Đúng hạn', value: deadlines.completedOnTime, color: '#047857' },
    { name: 'Quá hạn', value: deadlines.completedLate, color: '#b91c1c' },
    { name: 'Chưa xác định hạn', value: deadlines.completedMissingDeadline, color: '#94a3b8' },
    { name: 'Không áp dụng hạn', value: deadlines.completedNotApplicable, color: '#d97706' },
  ] : [];

  return <div className="space-y-5">
    <AnalyticsFilters value={filters} onChange={setFilters} />
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-slate-600">Biểu đồ tổng hợp tình hình tiền kiểm và phản hồi người dân trong phường.</p>
      <Button variant="outline" loading={refreshing} onClick={() => {
        void overview.refetch(); void trends.refetch(); void summary.refetch();
      }}>Làm mới dữ liệu</Button>
    </div>

    <div className="grid min-w-0 gap-5 xl:grid-cols-2">
      <section className="admin-card min-w-0 space-y-4 p-5" aria-labelledby="overview-trends">
        <div><h2 id="overview-trends" className="font-bold text-slate-900">Xu hướng tiền kiểm theo ngày</h2><p className="mt-1 text-sm text-slate-500">Lượt gửi và giấy tờ sẵn sàng trong kỳ</p></div>
        <AnalyticsStatus pending={trends.isPending} error={trends.error} retry={() => void trends.refetch()} />
        {!trends.isError && trends.data && <><AnalyticsTrendChart data={trends.data} /><CoverageNotice data={trends.data.coverage} /></>}
      </section>

      <section className="admin-card min-w-0 space-y-4 p-5" aria-labelledby="overview-results">
        <div><h2 id="overview-results" className="font-bold text-slate-900">Kết quả tiền kiểm trong kỳ</h2><p className="mt-1 text-sm text-slate-500">So sánh số lượt theo hoạt động</p></div>
        <AnalyticsStatus pending={overview.isPending} error={overview.error} retry={() => void overview.refetch()} />
        {data && <>
          <OverviewCountChart title="Lượt hoạt động tiền kiểm" points={activities} emptyMessage="Chưa có hoạt động tiền kiểm trong dữ liệu đã tổng hợp." />
          <p className="text-xs leading-5 text-slate-500">Một hồ sơ có thể phát sinh nhiều hoạt động trong kỳ.</p>
          <CoverageNotice data={data.coverage} />
          <Button variant="ghost" onClick={() => onSelectSection('stats-dossiers')}>Chi tiết hồ sơ <ArrowRight size={16} aria-hidden="true" /></Button>
        </>}
      </section>

      <section className="admin-card min-w-0 space-y-4 p-5" aria-labelledby="overview-deadlines">
        <div><h2 id="overview-deadlines" className="font-bold text-slate-900">Hạn xử lý hồ sơ đã sẵn sàng</h2><p className="mt-1 text-sm text-slate-500">Phân bố hồ sơ hoàn tất tiền kiểm theo tình trạng hạn</p></div>
        <AnalyticsStatus pending={overview.isPending} error={overview.error} retry={() => void overview.refetch()} />
        {data && (deadlines ? <>
          <OverviewCountChart title="Tình trạng hạn tiền kiểm" variant="donut" points={completed} emptyMessage="Chưa có hồ sơ sẵn sàng trong kỳ để phân tích hạn." />
          <p className="text-sm text-slate-600">Đúng hạn: <strong>{formatMetric(data.onTimeRate, '%')}</strong> · {deadlines.completedSampleCount} mẫu có hạn xác định</p>
          <p className="text-sm text-slate-600">Đang tồn quá hạn: <strong>{deadlines.openOverdue}</strong> hồ sơ</p>
          {(deadlines.openMissingDeadline > 0 || deadlines.openPaused > 0) && <p role="status" className="rounded-xl bg-amber-50 p-3 text-sm leading-6 text-amber-950">Cần theo dõi: {deadlines.openMissingDeadline} hồ sơ đang tồn chưa có hạn xác định; {deadlines.openPaused} hồ sơ đang tạm dừng tính hạn.</p>}
        </> : <p role="status" className="py-12 text-center text-sm text-slate-500">Chưa có dữ liệu hạn tiền kiểm.</p>)}
      </section>

      <section className="admin-card min-w-0 space-y-4 p-5" aria-labelledby="overview-satisfaction">
        <div><h2 id="overview-satisfaction" className="font-bold text-slate-900">Mức độ hài lòng</h2><p className="mt-1 text-sm text-slate-500">Phân bố đánh giá của người dân từ 1 đến 5 sao</p></div>
        <AnalyticsStatus pending={summary.isPending} error={summary.error} retry={() => void summary.refetch()} />
        {feedback && <>
          <OverviewCountChart title="Phân bố đánh giá" points={Object.entries(feedback.ratingCounts).reverse().map(([star, value]) => ({ name: `${star} sao`, value, color: Number(star) >= 4 ? '#047857' : Number(star) === 3 ? '#d97706' : '#b91c1c' }))} emptyMessage="Chưa có đánh giá trong kỳ đã chọn." />
          <p className="text-sm text-slate-600"><strong>{formatMetric(feedback.averageRating, '/5')}</strong> <span>điểm trung bình</span> · {feedback.totalCount} đánh giá</p>
          <p className="text-sm text-slate-600">Hài lòng (4–5 sao): <strong>{formatMetric(feedback.satisfactionRate, '%')}</strong></p>
          <Button variant="ghost" onClick={() => onSelectSection('feedback-reports')}>Xem phản hồi <ArrowRight size={16} aria-hidden="true" /></Button>
        </>}
      </section>
    </div>

    <nav aria-label="Xem thống kê chi tiết" className="flex flex-wrap justify-end gap-2">
      <Button variant="ghost" onClick={() => onSelectSection('stats-procedures')}>Thống kê theo thủ tục <ArrowRight size={16} aria-hidden="true" /></Button>
      <Button variant="ghost" onClick={() => onSelectSection('perf-officers')}>Hiệu suất cán bộ <ArrowRight size={16} aria-hidden="true" /></Button>
    </nav>
  </div>;
}
