import type React from 'react';
import { cn } from '@/lib/utils';

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return <span aria-hidden="true" className={cn('block animate-pulse rounded-md bg-slate-200/80', className)} {...props} />;
}

export interface TableSkeletonRowsProps {
  columns: number;
  rows?: number;
  cellClassName?: string;
  columnWidths?: (string | undefined)[];
  lastCellClassName?: string;
}

// cellClassName: bảng không nằm trong .admin-table-wrap cần tự thêm padding cho ô. Mặc định px-4 py-3.5 để tránh bẹp dòng.
export function TableSkeletonRows({
  columns,
  rows = 5,
  cellClassName = 'px-4 py-3.5',
  columnWidths,
  lastCellClassName,
}: TableSkeletonRowsProps) {
  return Array.from({ length: rows }, (_, row) => (
    <tr key={row} aria-hidden="true">
      {Array.from({ length: columns }, (__, column) => {
        const isFirst = column === 0;
        const isLast = column === columns - 1;

        // Ưu tiên độ rộng chỉ định nếu có
        const customWidth = columnWidths?.[column];
        const defaultWidth = isFirst
          ? 'w-32'
          : isLast
          ? 'ml-auto w-20'
          : columns > 4 && column === 2
          ? 'w-48'
          : 'w-24';

        const finalWidth = customWidth ?? defaultWidth;
        const tdClass = isLast && lastCellClassName ? cn(cellClassName, lastCellClassName) : cellClassName;

        return (
          <td key={column} className={tdClass}>
            <Skeleton className={cn('h-4', finalWidth)} />
          </td>
        );
      })}
    </tr>
  ));
}

export function TableSkeleton({
  columns,
  rows = 5,
  className,
  cellClassName,
  columnWidths,
}: {
  columns: number;
  rows?: number;
  className?: string;
  cellClassName?: string;
  columnWidths?: (string | undefined)[];
}) {
  return (
    <div role="status" aria-label="Đang tải danh sách" className={cn('admin-card admin-table-wrap overflow-hidden', className)}>
      <table>
        <tbody>
          <TableSkeletonRows columns={columns} rows={rows} cellClassName={cellClassName} columnWidths={columnWidths} />
        </tbody>
      </table>
    </div>
  );
}

export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div role="status" aria-label="Đang tải danh sách" className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white px-4">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="flex min-h-16 items-center gap-3 py-3" aria-hidden="true">
          <Skeleton className="size-9 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2"><Skeleton className="h-4 w-2/5" /><Skeleton className="h-3 w-3/5" /></div>
          <Skeleton className="h-8 w-20" />
        </div>
      ))}
    </div>
  );
}

export function CardGridSkeleton({ cards = 6 }: { cards?: number }) {
  return (
    <div role="status" aria-label="Đang tải danh sách" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: cards }, (_, index) => (
        <div key={index} className="rounded-xl border border-slate-200 bg-white p-5" aria-hidden="true">
          <Skeleton className="size-10 rounded-xl" />
          <Skeleton className="mt-5 h-4 w-2/3" />
          <Skeleton className="mt-3 h-3 w-full" />
          <Skeleton className="mt-2 h-3 w-4/5" />
        </div>
      ))}
    </div>
  );
}

export function StatGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <section role="status" aria-label="Đang tải chỉ số" className="admin-stat-grid">
      {Array.from({ length: count }, (_, index) => (
        <article key={index} className="admin-stat-card bg-slate-50/70" aria-hidden="true">
          <div>
            <Skeleton className="size-6 rounded-md" />
            <Skeleton className="mt-1 h-3 w-24" />
          </div>
          <Skeleton className="h-8 w-14" />
        </article>
      ))}
    </section>
  );
}

export function ChecklistSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div role="status" aria-label="Đang tải danh mục giấy tờ" className="space-y-3">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="flex min-h-20 flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4" aria-hidden="true">
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-2/5" />
            <Skeleton className="h-3 w-3/5" />
          </div>
          <Skeleton className="h-10 w-28 rounded-xl shrink-0" />
        </div>
      ))}
    </div>
  );
}
