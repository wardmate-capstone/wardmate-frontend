import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import type { z } from 'zod';
import type { trendsSchema } from '@/lib/api/analytics';

export function AnalyticsTrendChart({ data }: { data: z.infer<typeof trendsSchema> }) {
  const missing = new Set(data.coverage.missingDates);
  const points = data.items.map(row => ({
    date: row.date,
    received: missing.has(row.date) ? null : row.totals.receivedCount,
    ready: missing.has(row.date) ? null : row.totals.readyCount,
  }));

  return <>
    <div className="h-72 min-w-0" role="img" aria-label="Biểu đồ tiền kiểm theo ngày">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points} margin={{ left: -15, right: 10, top: 10 }}>
          <XAxis dataKey="date" tickFormatter={value => String(value).slice(5)} />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Legend />
          <Line dataKey="received" name="Lượt gửi tiền kiểm" stroke="#991b1b" strokeWidth={2} dot={false} isAnimationActive={false} />
          <Line dataKey="ready" name="Giấy tờ sẵn sàng" stroke="#047857" strokeWidth={2} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
    <details>
      <summary className="cursor-pointer text-sm font-medium text-red-800">Xem bảng dữ liệu theo ngày</summary>
      <div className="mt-3 max-h-64 overflow-auto">
        <table className="w-full text-left text-sm">
          <thead><tr><th className="p-2">Ngày</th><th className="p-2">Lượt gửi tiền kiểm</th><th className="p-2">Giấy tờ sẵn sàng</th></tr></thead>
          <tbody>{points.map(row => <tr key={row.date} className="border-t border-slate-100">
            <td className="p-2">{row.date}</td>
            <td className="p-2">{row.received ?? 'Thiếu dữ liệu'}</td>
            <td className="p-2">{row.ready ?? 'Thiếu dữ liệu'}</td>
          </tr>)}</tbody>
        </table>
      </div>
    </details>
  </>;
}
