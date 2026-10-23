import { Bar, BarChart, Cell, Label, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export type OverviewChartPoint = { name: string; value: number; color: string };

export function OverviewCountChart({ title, points, variant = 'bar', emptyMessage }: {
  title: string;
  points: OverviewChartPoint[];
  variant?: 'bar' | 'donut';
  emptyMessage: string;
}) {
  const total = points.reduce((sum, point) => sum + point.value, 0);
  return <>
    {total === 0 ? <p role="status" className="flex min-h-56 items-center justify-center text-center text-sm text-slate-500">{emptyMessage}</p> : <>
      <div className="h-64 min-w-0" role="img" aria-label={`Biểu đồ ${title.toLowerCase()}`}>
        <ResponsiveContainer width="100%" height="100%">
          {variant === 'donut' ? <PieChart>
            <Tooltip />
            <Pie data={points} dataKey="value" nameKey="name" innerRadius={58} outerRadius={92} paddingAngle={2} isAnimationActive={false}>
              {points.map(point => <Cell key={point.name} fill={point.color} />)}
              <Label position="center" value={total.toLocaleString('vi-VN')} className="fill-slate-900 text-2xl font-bold" />
            </Pie>
          </PieChart> : <BarChart data={points} layout="vertical" margin={{ top: 8, right: 25, left: 0, bottom: 8 }}>
            <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
            <YAxis type="category" dataKey="name" width={112} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
            <Tooltip cursor={{ fill: '#f8fafc' }} />
            <Bar dataKey="value" name="Số lượng" maxBarSize={28} radius={[0, 5, 5, 0]} isAnimationActive={false}>
              {points.map(point => <Cell key={point.name} fill={point.color} />)}
            </Bar>
          </BarChart>}
        </ResponsiveContainer>
      </div>
      {variant === 'donut' && <ul className="grid gap-2 text-sm sm:grid-cols-2">{points.map(point => <li key={point.name} className="flex items-center gap-2">
        <span aria-hidden="true" className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: point.color }} />
        <span className="min-w-0 flex-1 text-slate-600">{point.name}</span><strong>{point.value}</strong>
      </li>)}</ul>}
    </>}
    <details className="text-sm">
      <summary className="cursor-pointer font-medium text-red-800">Xem bảng dữ liệu</summary>
      <table aria-label={`Dữ liệu ${title.toLowerCase()}`} className="mt-3 w-full text-left">
        <thead><tr><th className="p-2">Nội dung</th><th className="p-2 text-right">Số lượng</th></tr></thead>
        <tbody>{points.map(point => <tr key={point.name} className="border-t border-slate-100"><td className="p-2">{point.name}</td><td className="p-2 text-right">{point.value.toLocaleString('vi-VN')}</td></tr>)}</tbody>
      </table>
    </details>
  </>;
}
