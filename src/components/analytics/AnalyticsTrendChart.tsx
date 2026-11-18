import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { z } from 'zod';
import type { trendsSchema } from '@/lib/api/analytics';
import { ChartDataTable, ChartTooltip, LegendKeys, axisTick, chartColors, compactVi } from './chartKit';

const baseSeries = [
  { key: 'received', label: 'Lượt gửi tiền kiểm', color: chartColors.series1 },
  { key: 'ready', label: 'Giấy tờ sẵn sàng', color: chartColors.series2 },
] as const;
const revisionSeries = { key: 'revision', label: 'Yêu cầu bổ sung', color: chartColors.series3 } as const;

const dayMonth = (value: string) => `${value.slice(8, 10)}/${value.slice(5, 7)}`;
const fullDate = (value: string) => `${value.slice(8, 10)}/${value.slice(5, 7)}/${value.slice(0, 4)}`;

/** withRevision: thêm đường "Yêu cầu bổ sung" (màn Thống kê hồ sơ); Tổng quan giữ 2 đường. */
export function AnalyticsTrendChart({ data, withRevision = false }: { data: z.infer<typeof trendsSchema>; withRevision?: boolean }) {
  const series = withRevision ? [...baseSeries, revisionSeries] : baseSeries;
  const missing = new Set(data.coverage.missingDates);
  // Ngày thiếu dữ liệu để null: đường bị ngắt thay vì vẽ như 0.
  const points = data.items.map(row => ({
    date: row.date,
    received: missing.has(row.date) ? null : row.totals.receivedCount,
    ready: missing.has(row.date) ? null : row.totals.readyCount,
    revision: missing.has(row.date) ? null : row.totals.revisionRequestedCount,
  }));

  return <div className="space-y-3">
    <LegendKeys items={series.map(item => ({ label: item.label, color: item.color }))} />
    <div className="h-72 min-w-0" role="img" aria-label="Biểu đồ tiền kiểm theo ngày">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={points} margin={{ left: 0, right: 12, top: 8, bottom: 0 }}>
          <defs>
            {series.map(item => (
              <linearGradient key={item.key} id={`trend-${item.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={item.color} stopOpacity={0.14} />
                <stop offset="100%" stopColor={item.color} stopOpacity={0.01} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid vertical={false} stroke={chartColors.grid} />
          <XAxis dataKey="date" tickFormatter={dayMonth} tick={axisTick} tickLine={false} axisLine={{ stroke: chartColors.axis }} minTickGap={24} />
          <YAxis allowDecimals={false} tickFormatter={compactVi} tick={axisTick} tickLine={false} axisLine={false} width={40} />
          <Tooltip
            cursor={{ stroke: chartColors.axis, strokeWidth: 1 }}
            content={<ChartTooltip labelFormatter={fullDate} />}
          />
          {series.map(item => (
            <Area
              key={item.key}
              type="monotone"
              dataKey={item.key}
              name={item.label}
              stroke={item.color}
              strokeWidth={2}
              fill={`url(#trend-${item.key})`}
              dot={false}
              activeDot={{ r: 4.5, strokeWidth: 2, stroke: '#ffffff', fill: item.color }}
              isAnimationActive={false}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
    <ChartDataTable
      caption="Dữ liệu tiền kiểm theo ngày"
      columns={['Ngày', ...series.map(item => item.label)]}
      rows={points.map(row => [fullDate(row.date), ...series.map(item => row[item.key] ?? 'Thiếu dữ liệu')])}
    />
  </div>;
}
