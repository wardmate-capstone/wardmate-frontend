import { useState, type ReactNode } from 'react';
import { ArrowRight, CalendarBlank, CheckCircle, ClockCountdown, IdentificationCard, ListChecks, PaperPlaneTilt, Smiley, UsersThree } from '@phosphor-icons/react';
import { RefreshButton, EmptyState } from '@/components/ui';
import { AnalyticsFilters, AnalyticsStatus, CoverageNotice } from '@/components/analytics/AnalyticsFilters';
import { AnalyticsTrendChart } from '@/components/analytics/AnalyticsTrendChart';
import { OverviewCountChart } from '@/components/analytics/OverviewCountChart';
import { chartColors, numberVi } from '@/components/analytics/chartKit';
import { analyticsApi, initialAnalyticsQuery } from '@/lib/api/analytics';
import { useAnalytics } from '@/hooks/useAnalytics';
import type { ManagerSectionId } from '../types';
import { useAuthStore } from '@/stores/authStore';
import { canAccessItem } from '@/lib/navigationAccess';
import './manager-overview.css';

function formatMetric(value: number | null | undefined, suffix = '') {
  return value == null ? 'Chưa đủ dữ liệu' : value.toLocaleString('vi-VN', { maximumFractionDigits: 1 }) + suffix;
}
// Ô số lớn không chứa câu chữ: thiếu dữ liệu thì hiện gạch ngang, lý do nằm ở dòng phụ.
const bigMetric = (value: number | null | undefined, suffix = '') => value == null ? '—' : formatMetric(value, suffix);

function ChartCard({ id, title, subtitle, action, className = '', children }: {
  id: string; title: string; subtitle: string; action?: ReactNode; className?: string; children: ReactNode;
}) {
  return (
    <section className={`manager-overview-panel ${className}`} aria-labelledby={id}>
      <header className="manager-overview-panel-heading">
        <div>
          <h2 id={id} className="font-bold text-slate-900">{title}</h2>
          <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
        </div>
        {action}
      </header>
      <div className="manager-overview-panel-body">{children}</div>
    </section>
  );
}

function LinkButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} className="manager-overview-link">
      {children} <ArrowRight size={14} aria-hidden="true" />
    </button>
  );
}

export function ManagerOverviewView({ onSelectSection }: { onSelectSection: (section: ManagerSectionId) => void }) {
  const user = useAuthStore(state => state.user);
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
  const shortcuts = [
    { section: 'dispatch' as const, label: 'Điều phối hồ sơ', hint: 'Phân công và chuyển cán bộ', icon: ListChecks, permissions: ['workflow.dispatch.read'] },
    { section: 'shifts' as const, label: 'Lịch ca làm', hint: 'Xem lịch và bố trí ca trực', icon: CalendarBlank, permissions: ['workflow.staffing.read'] },
    { section: 'leaves' as const, label: 'Duyệt nghỉ phép', hint: 'Xem đơn và quyết định nghỉ', icon: IdentificationCard, permissions: ['workflow.staffing.read'] },
    { section: 'consultations' as const, label: 'Tham vấn chuyên môn', hint: 'Theo dõi trao đổi về hồ sơ', icon: UsersThree, permissions: ['workflow.consultation.read'] },
  ].filter(item => canAccessItem(user?.roles ?? [], user?.permissions ?? [], item.permissions));
  const metrics = [
    { label: 'Lượt gửi tiền kiểm', value: data ? numberVi(data.totals.receivedCount) : '—', hint: data ? `${numberVi(data.totals.resubmittedCount)} lượt gửi lại` : 'Chưa có số liệu', icon: PaperPlaneTilt },
    { label: 'Giấy tờ sẵn sàng', value: data ? numberVi(data.totals.readyCount) : '—', hint: data ? `${numberVi(data.totals.revisionRequestedCount)} lượt yêu cầu bổ sung` : 'Chưa có số liệu', icon: CheckCircle },
    { label: 'Tỷ lệ đúng hạn', value: bigMetric(data?.onTimeRate, '%'), hint: data?.onTimeRate == null ? 'Chưa đủ dữ liệu' : 'Tính trên hồ sơ đã xác nhận giấy tờ sẵn sàng', icon: ClockCountdown },
    { label: 'Hài lòng (4–5 sao)', value: bigMetric(feedback?.satisfactionRate, '%'), hint: feedback ? `${numberVi(feedback.totalCount)} đánh giá của người dân` : 'Chưa có số liệu', icon: Smiley },
  ];

  return <div className="manager-overview">
    <div className="manager-overview-filter mgr-period-filter">
      <AnalyticsFilters value={filters} onChange={setFilters} actions={<RefreshButton label="Làm mới dữ liệu" loading={refreshing} onClick={() => {
        void overview.refetch(); void trends.refetch(); void summary.refetch();
      }} />} />
    </div>

    <section aria-label="Chỉ số trong kỳ" aria-busy={overview.isPending || summary.isPending}>
      <dl className="manager-overview-metrics">{metrics.map(({ label, value, hint, icon: Icon }) => <div className="manager-overview-metric" key={label}>
        <dt><span>{label}</span><Icon size={18} aria-hidden="true" /></dt>
        <dd className="manager-overview-metric-value">{value}</dd>
        <dd className="manager-overview-metric-hint">{hint}</dd>
      </div>)}</dl>
    </section>
    <AnalyticsStatus pending={overview.isPending} error={overview.error} retry={() => void overview.refetch()} />

    <div className="manager-overview-primary">
      <ChartCard id="overview-trends" title="Xu hướng tiền kiểm theo ngày" subtitle="Lượt gửi và giấy tờ sẵn sàng trong kỳ đã chọn"
        action={<LinkButton onClick={() => onSelectSection('stats-dossiers')}>Chi tiết hồ sơ</LinkButton>}>
        <AnalyticsStatus pending={trends.isPending} error={trends.error} retry={() => void trends.refetch()} />
        {!trends.isError && trends.data && <><AnalyticsTrendChart data={trends.data} /><CoverageNotice data={trends.data.coverage} /></>}
      </ChartCard>

      <aside className="manager-overview-rail" aria-label="Điều hành nhanh">
        <ChartCard id="overview-attention" title="Cần theo dõi" subtitle="Tình trạng tồn tại thời điểm tổng hợp">
          {deadlines ? <>
            <dl className="manager-overview-watch">
              <div className={deadlines.openOverdue > 0 ? 'is-overdue' : ''}><dt><span className="manager-overview-dot" />Đang tồn quá hạn</dt><dd>{numberVi(deadlines.openOverdue)}</dd></div>
              <div><dt>Chưa xác định hạn</dt><dd>{numberVi(deadlines.openMissingDeadline)}</dd></div>
              <div><dt>Tạm dừng tính hạn</dt><dd>{numberVi(deadlines.openPaused)}</dd></div>
            </dl>
            <p className="manager-overview-asof">Tổng hợp lúc {new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(deadlines.asOfUtc))} (giờ VN)</p>
            <LinkButton onClick={() => onSelectSection('applications')}>Giám sát hồ sơ</LinkButton>
          </> : <p className="text-sm text-slate-500">{overview.isPending ? 'Đang tải tình trạng hồ sơ…' : 'Chưa có dữ liệu hạn tiền kiểm.'}</p>}
        </ChartCard>
        {shortcuts.length > 0 && <section className="manager-overview-panel" aria-labelledby="overview-shortcuts">
          <header className="manager-overview-panel-heading"><h2 id="overview-shortcuts" className="font-bold text-slate-900">Công việc điều hành</h2></header>
          <div className="manager-overview-shortcuts">{shortcuts.map(({ section, label, hint, icon: Icon }) => <button type="button" key={section} title={hint} onClick={() => onSelectSection(section)}>
            <Icon size={20} aria-hidden="true" /><span><strong>{label}</strong></span><ArrowRight size={16} aria-hidden="true" />
          </button>)}</div>
        </section>}
      </aside>
    </div>

    <div className="manager-overview-secondary">
      <ChartCard id="overview-results" title="Kết quả tiền kiểm trong kỳ" subtitle="Số lượt theo từng hoạt động"
        action={<LinkButton onClick={() => onSelectSection('stats-procedures')}>Theo thủ tục</LinkButton>}>
        {data ? <>
          <OverviewCountChart title="Lượt hoạt động tiền kiểm" points={activities} emptyMessage="Chưa có hoạt động tiền kiểm trong dữ liệu đã tổng hợp." />
        </> : <EmptyState title="Chưa có số liệu để hiển thị." />}
      </ChartCard>

      <ChartCard id="overview-deadlines" title="Hạn xử lý hồ sơ đã sẵn sàng" subtitle="Hồ sơ đã xác nhận giấy tờ sẵn sàng (chưa phải phê duyệt)"
        action={<LinkButton onClick={() => onSelectSection('perf-officers')}>Hiệu suất cán bộ</LinkButton>}>
        {data && (deadlines ? <>
          <OverviewCountChart title="Tình trạng hạn tiền kiểm" variant="donut" points={completed}
            center={data.onTimeRate == null ? { value: '—', caption: 'Chưa đủ dữ liệu' } : { value: formatMetric(data.onTimeRate, '%'), caption: `đúng hạn · ${numberVi(deadlines.completedSampleCount)} mẫu` }}
            emptyMessage="Chưa có hồ sơ sẵn sàng trong kỳ để phân tích hạn." />
          {(deadlines.openMissingDeadline > 0 || deadlines.openPaused > 0) && <p role="status" className="rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-950">Cần theo dõi: {deadlines.openMissingDeadline} hồ sơ đang tồn chưa có hạn xác định; {deadlines.openPaused} hồ sơ đang tạm dừng tính hạn.</p>}
        </> : <EmptyState title="Chưa có dữ liệu hạn tiền kiểm." />)}
        {!data && <EmptyState title="Chưa có số liệu để hiển thị." />}
      </ChartCard>

    </div>
      <ChartCard id="overview-satisfaction" title="Mức độ hài lòng" subtitle="Đánh giá của người dân trong kỳ đã chọn"
        action={<LinkButton onClick={() => onSelectSection('feedback-reports')}>Xem phản hồi</LinkButton>}>
        <AnalyticsStatus pending={summary.isPending} error={summary.error} retry={() => void summary.refetch()} />
        {feedback && <div className="manager-overview-feedback">
          <div>
            <p className="text-4xl font-bold text-slate-950">{bigMetric(feedback.averageRating, '/5')}</p>
            <p className="mt-1 text-sm text-slate-500"><span>điểm trung bình</span> · {numberVi(feedback.totalCount)} đánh giá</p>
            <p className="mt-3 text-sm text-slate-600">Hài lòng (4–5 sao): <strong>{formatMetric(feedback.satisfactionRate, '%')}</strong></p>
          </div>
          {feedback.totalCount > 0 ? <dl className="manager-overview-ratings" aria-label="Phân bố đánh giá">{Object.entries(feedback.ratingCounts).reverse().map(([star, value]) => <div key={star}>
            <dt>{star} sao</dt><dd><span className="manager-overview-rating-track" aria-hidden="true"><span style={{ width: `${value / feedback.totalCount * 100}%` }} /></span><span>{numberVi(value)}<span className="sr-only"> đánh giá</span></span></dd>
          </div>)}</dl> : <EmptyState title="Chưa có đánh giá trong kỳ đã chọn." />}
        </div>}
      </ChartCard>
  </div>;
}
