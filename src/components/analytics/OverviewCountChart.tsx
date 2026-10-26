import { Bar, BarChart, CartesianGrid, Cell, LabelList, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartDataTable, ChartTooltip, axisTick, chartColors, compactVi, numberVi } from './chartKit';

/** `color` chỉ dùng cho donut (màu trạng thái). Biểu đồ cột là một độ đo nên dùng một màu. */
export type OverviewChartPoint = { name: string; value: number; color?: string };

export function OverviewCountChart({ title, points, variant = 'bar', emptyMessage, center }: {
  title: string;
  points: OverviewChartPoint[];
  variant?: 'bar' | 'donut';
  emptyMessage: string;
  /** Con số ở giữa donut; mặc định là tổng. */
  center?: { value: string; caption: string };
}) {
  const total = points.reduce((sum, point) => sum + point.value, 0);
  const label = `Biểu đồ ${title.toLowerCase()}`;
  const table = <ChartDataTable caption={`Dữ liệu ${title.toLowerCase()}`} columns={['Nội dung', 'Số lượng']} rows={points.map(point => [point.name, point.value])} />;

  if (total === 0) return <>
    <p role="status" className="flex min-h-56 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-4 text-center text-sm text-slate-500">{emptyMessage}</p>
    {table}
  </>;

  if (variant === 'donut') {
    const centerValue = center ?? { value: numberVi(total), caption: 'hồ sơ' };
    return <>
      <div className="grid items-center gap-4 sm:grid-cols-[minmax(0,220px)_1fr]">
        <div className="relative mx-auto h-52 w-full max-w-[220px]" role="img" aria-label={label}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip content={<ChartTooltip />} />
              <Pie data={points} dataKey="value" nameKey="name" innerRadius="68%" outerRadius="100%" paddingAngle={1.5} stroke="#ffffff" strokeWidth={2} startAngle={90} endAngle={-270} isAnimationActive={false}>
                {points.map(point => <Cell key={point.name} fill={point.color ?? chartColors.series1} />)}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-3xl font-bold leading-none text-slate-950">{centerValue.value}</span>
            <span className="mt-1 text-xs text-slate-500">{centerValue.caption}</span>
          </div>
        </div>
        <ul className="space-y-2 text-sm">
          {points.map(point => (
            <li key={point.name} className="flex items-center gap-2.5">
              <span aria-hidden="true" className="size-2.5 shrink-0 rounded-sm" style={{ backgroundColor: point.color ?? chartColors.series1 }} />
              <span className="min-w-0 flex-1 text-slate-600">{point.name}</span>
              <strong className="tabular-nums text-slate-900">{numberVi(point.value)}</strong>
              <span className="w-12 text-right text-xs tabular-nums text-slate-500">{Math.round(point.value / total * 100)}%</span>
            </li>
          ))}
        </ul>
      </div>
      {table}
    </>;
  }

  return <>
    <div className="min-w-0" style={{ height: Math.max(160, points.length * 44 + 24) }} role="img" aria-label={label}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={points} layout="vertical" margin={{ top: 4, right: 44, left: 0, bottom: 4 }} barCategoryGap="30%">
          <CartesianGrid horizontal={false} stroke={chartColors.grid} />
          <XAxis type="number" allowDecimals={false} tickFormatter={compactVi} tick={axisTick} tickLine={false} axisLine={false} />
          <YAxis type="category" dataKey="name" width={132} tick={{ ...axisTick, fill: '#52514e' }} tickLine={false} axisLine={{ stroke: chartColors.axis }} />
          <Tooltip cursor={{ fill: '#f1f5f9' }} content={<ChartTooltip />} />
          <Bar dataKey="value" name="Số lượng" fill={chartColors.series1} maxBarSize={24} radius={[0, 4, 4, 0]} isAnimationActive={false}>
            <LabelList dataKey="value" position="right" formatter={(value: unknown) => typeof value === 'number' ? numberVi(value) : ''} style={{ fill: '#0b0b0b', fontSize: 12, fontWeight: 600 }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
    {table}
  </>;
}
