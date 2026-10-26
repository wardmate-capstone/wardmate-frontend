import type { ReactNode } from 'react';

/**
 * Token biểu đồ dùng chung cho phần thống kê.
 * Series: 2 slot đầu của bảng categorical đã chạy validator trên nền trắng của admin-card
 * (CVD ΔE 24.7, normal ΔE 33.6, tương phản ≥ 3:1). Status chỉ dùng cho trạng thái hạn, luôn kèm nhãn.
 */
export const chartColors = {
  series1: '#2a78d6',
  series2: '#eb6834',
  good: '#0ca30c',
  critical: '#d03b3b',
  neutral: '#a8a7a0',
  neutralLight: '#d6d5ce',
  grid: '#e1e0d9',
  axis: '#c3c2b7',
  muted: '#898781',
} as const;

export const axisTick = { fill: chartColors.muted, fontSize: 12 } as const;

export const numberVi = (value: number) => value.toLocaleString('vi-VN');

export function compactVi(value: number) {
  return Math.abs(value) >= 1000
    ? value.toLocaleString('vi-VN', { notation: 'compact', maximumFractionDigits: 1 })
    : value.toLocaleString('vi-VN');
}

type TooltipEntry = { name?: string | number; value?: unknown; color?: string; payload?: Record<string, unknown> };

/** Tooltip chung: nhãn ở trên, mỗi dòng có ô màu nhận diện, số dùng tabular-nums. */
export function ChartTooltip({ active, payload, label, labelFormatter, valueSuffix = '' }: {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string | number;
  labelFormatter?: (label: string) => string;
  valueSuffix?: string;
}) {
  if (!active || !payload?.length) return null;
  const heading = label != null && label !== '' ? (labelFormatter ? labelFormatter(String(label)) : String(label)) : undefined;
  return (
    <div className="min-w-40 rounded-xl border border-slate-200 bg-white/95 px-3 py-2.5 text-xs shadow-lg backdrop-blur">
      {heading && <p className="mb-1.5 font-semibold text-slate-900">{heading}</p>}
      <ul className="space-y-1">
        {payload.map((entry) => {
          const color = (entry.payload?.color as string | undefined) ?? entry.color;
          const value = typeof entry.value === 'number' ? numberVi(entry.value) + valueSuffix : 'Thiếu dữ liệu';
          return (
            <li key={String(entry.name)} className="flex items-center gap-2">
              <span aria-hidden="true" className="size-2.5 shrink-0 rounded-sm" style={{ backgroundColor: color }} />
              <span className="flex-1 text-slate-600">{entry.name}</span>
              <strong className="tabular-nums text-slate-900">{value}</strong>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Chú giải đặt phía trên biểu đồ; ô màu đi cùng chữ màu chữ (không tô chữ theo màu series). */
export function LegendKeys({ items, shape = 'line' }: { items: { label: string; color: string }[]; shape?: 'line' | 'square' }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-600" aria-label="Chú giải">
      {items.map((item) => (
        <li key={item.label} className="inline-flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className={shape === 'line' ? 'h-0.5 w-4 rounded-full' : 'size-2.5 rounded-sm'}
            style={{ backgroundColor: item.color }}
          />
          {item.label}
        </li>
      ))}
    </ul>
  );
}

/** Thẻ số liệu: nhãn · giá trị lớn · ghi chú phụ. */
export function StatTile({ label, value, hint, icon, tone = 'slate' }: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  tone?: 'slate' | 'blue' | 'green' | 'amber' | 'red';
}) {
  const toneClass = {
    slate: 'bg-slate-100 text-slate-600',
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
    red: 'bg-red-50 text-red-800',
  }[tone];
  return (
    <div className="admin-card flex min-w-0 items-start gap-3 p-4">
      {icon && <span aria-hidden="true" className={`grid size-10 shrink-0 place-items-center rounded-xl ${toneClass}`}>{icon}</span>}
      <div className="min-w-0">
        <dt className="text-xs font-medium text-slate-500">{label}</dt>
        <dd className="mt-1 text-2xl font-bold leading-tight text-slate-950">{value}</dd>
        {hint && <dd className="mt-0.5 text-xs text-slate-500">{hint}</dd>}
      </div>
    </div>
  );
}

/** Bảng dữ liệu thay thế cho biểu đồ (khả năng tiếp cận). */
export function ChartDataTable({ caption, columns, rows }: { caption: string; columns: string[]; rows: (string | number)[][] }) {
  return (
    <details className="group text-sm">
      <summary className="cursor-pointer select-none text-xs font-semibold text-slate-500 hover:text-red-800">Xem bảng dữ liệu</summary>
      <div className="mt-2 max-h-64 overflow-auto rounded-lg border border-slate-100">
        <table aria-label={caption} className="w-full text-left text-xs">
          <thead className="sticky top-0 bg-slate-50 text-slate-500">
            <tr>{columns.map((column, index) => <th key={column} className={`px-3 py-2 font-semibold ${index ? 'text-right' : ''}`}>{column}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={String(row[0])} className="border-t border-slate-100">
                {row.map((cell, index) => <td key={index} className={`px-3 py-1.5 ${index ? 'text-right tabular-nums' : ''}`}>{typeof cell === 'number' ? numberVi(cell) : cell}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
