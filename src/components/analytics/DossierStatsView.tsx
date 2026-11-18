import type { ReactNode } from 'react';
import type { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from '@phosphor-icons/react';
import { EmptyState } from '@/components/ui';
import { formatDateTime } from '@/lib/dateFormat';
import type { deadlinesSchema, overviewSchema, trendsSchema } from '@/lib/api/analytics';
import { AnalyticsTrendChart } from './AnalyticsTrendChart';
import { AnalyticsStatus, CoverageNotice } from './AnalyticsFilters';
import { chartColors, numberVi } from './chartKit';

type Deadlines = z.infer<typeof deadlinesSchema>;
type TrendsQuery = { data?: z.infer<typeof trendsSchema>; isPending: boolean; isError: boolean; error: unknown; refetch: () => unknown };

const percent = (value: number | null | undefined) => value == null ? '—' : `${value.toLocaleString('vi-VN', { maximumFractionDigits: 1 })}%`;

/** Một dòng trong thẻ hạn: chấm màu (kèm nhãn chữ, không dùng màu đơn lẻ), số lượng, tỷ lệ nếu có. */
function Row({ label, value, share, color }: { label: string; value: number; share?: string; color?: string }) {
  return <div className="dossier-row">
    <dt>{color ? <span aria-hidden="true" className="dossier-dot" style={{ backgroundColor: color }} /> : <span aria-hidden="true" className="dossier-dot is-empty" />}{label}</dt>
    <dd><strong>{numberVi(value)}</strong>{share !== undefined && <span aria-hidden={share === '' || undefined}>{share}</span>}</dd>
  </div>;
}

function Panel({ title, subtitle, children, footer }: { title: string; subtitle: ReactNode; children: ReactNode; footer?: ReactNode }) {
  return <section className="admin-card dossier-panel">
    <header><h2>{title}</h2><p>{subtitle}</p></header>
    <div className="dossier-panel-body">{children}</div>
    {footer && <footer>{footer}</footer>}
  </section>;
}

/**
 * Màn Thống kê hồ sơ: 4 chỉ số chính → xu hướng theo ngày → hạn của hồ sơ đã hoàn tất và hồ sơ đang tồn.
 * Mỗi số liệu chỉ hiện một lần; chỉ dùng dữ liệu API overview/trends sẵn có.
 */
export function DossierStatsView({ overview, trends }: { overview: z.infer<typeof overviewSchema>; trends: TrendsQuery }) {
  const navigate = useNavigate();
  const { totals } = overview;
  const deadlines: Deadlines | null | undefined = overview.deadlines;
  const backlog: Deadlines | null | undefined = trends.data?.currentBacklog ?? overview.deadlines;
  const onTime = deadlines?.onTimeRate ?? overview.onTimeRate;

  const kpis: { label: string; value: string; hint?: string }[] = [
    { label: 'Lượt gửi tiền kiểm', value: numberVi(totals.receivedCount), hint: `Gồm ${numberVi(totals.resubmittedCount)} lượt gửi lại` },
    { label: 'Giấy tờ sẵn sàng', value: numberVi(totals.readyCount), hint: `${numberVi(totals.cancelledCount)} hồ sơ đã hủy` },
    { label: 'Lượt yêu cầu bổ sung', value: numberVi(totals.revisionRequestedCount) },
    {
      label: 'Tỷ lệ đúng hạn', value: percent(onTime),
      hint: onTime == null ? 'Chưa có hồ sơ hoàn tất có hạn trong kỳ' : deadlines ? `Trên ${numberVi(deadlines.completedSampleCount)} hồ sơ có hạn` : undefined,
    },
  ];

  return <div className="dossier-stats">
    <CoverageNotice data={overview.coverage} />

    <section className="admin-card dossier-kpis" aria-label="Chỉ số chính trong kỳ">
      <dl>{kpis.map(item => <div key={item.label}>
        <dt>{item.label}</dt>
        <dd className="dossier-kpi-value">{item.value}</dd>
        {item.hint && <dd className="dossier-kpi-hint">{item.hint}</dd>}
      </div>)}</dl>
    </section>

    <section className="admin-card dossier-panel">
      <header><h2>Xu hướng tiền kiểm theo ngày</h2><p>Lượt gửi, giấy tờ sẵn sàng và yêu cầu bổ sung trong kỳ đã chọn</p></header>
      <div className="dossier-panel-body">
        <AnalyticsStatus pending={trends.isPending} error={trends.error} retry={() => void trends.refetch()} />
        {!trends.isError && trends.data && <AnalyticsTrendChart data={trends.data} withRevision />}
      </div>
    </section>

    <div className="dossier-panels">
      <Panel title="Hạn xử lý của hồ sơ đã hoàn tất" subtitle="Hồ sơ được xác nhận giấy tờ sẵn sàng trong kỳ">
        {deadlines ? <dl>
          <Row label="Đúng hạn" value={deadlines.completedOnTime} share={percent(deadlines.onTimeRate)} color={chartColors.good} />
          <Row label="Quá hạn" value={deadlines.completedLate} share={percent(deadlines.lateRate)} color={chartColors.critical} />
          <Row label="Chưa xác định hạn" value={deadlines.completedMissingDeadline} share="" color={chartColors.neutral} />
          <Row label="Không áp dụng hạn" value={deadlines.completedNotApplicable} share="" />
        </dl> : <EmptyState title="Chưa có dữ liệu hạn tiền kiểm trong kỳ." />}
      </Panel>

      <Panel
        title="Hồ sơ đang tồn"
        subtitle={backlog ? `Tại thời điểm tổng hợp ${formatDateTime(backlog.asOfUtc)} (giờ VN)` : 'Chưa có lần tổng hợp'}
        footer={<button type="button" className="dossier-link" onClick={() => navigate('/manager?section=applications')}>Giám sát hồ sơ <ArrowRight size={14} aria-hidden="true" /></button>}
      >
        {backlog ? <dl>
          <Row label="Quá hạn" value={backlog.openOverdue} color={backlog.openOverdue > 0 ? chartColors.critical : undefined} />
          <Row label="Tạm dừng tính hạn" value={backlog.openPaused} />
          <Row label="Chưa có hạn" value={backlog.openMissingDeadline} color={backlog.openMissingDeadline > 0 ? chartColors.neutral : undefined} />
        </dl> : <EmptyState title="Chưa có dữ liệu hồ sơ đang tồn." />}
      </Panel>
    </div>
  </div>;
}
