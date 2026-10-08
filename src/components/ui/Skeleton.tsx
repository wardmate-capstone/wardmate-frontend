import { cn } from '@/lib/utils';

export function Skeleton({ className }: { className?: string }) {
  return <span aria-hidden="true" className={cn('block animate-pulse rounded-md bg-slate-200/80', className)} />;
}

export function TableSkeletonRows({ columns, rows = 5 }: { columns: number; rows?: number }) {
  return Array.from({ length: rows }, (_, row) => (
    <tr key={row} aria-hidden="true">
      {Array.from({ length: columns }, (__, column) => (
        <td key={column}>
          <Skeleton className={cn('h-4', column === 0 ? 'w-32' : column === columns - 1 ? 'ml-auto w-20' : 'w-24')} />
        </td>
      ))}
    </tr>
  ));
}

export function TableSkeleton({ columns, rows = 5, className }: { columns: number; rows?: number; className?: string }) {
  return (
    <div role="status" aria-label="Đang tải danh sách" className={cn('admin-card admin-table-wrap overflow-hidden', className)}>
      <table>
        <tbody><TableSkeletonRows columns={columns} rows={rows} /></tbody>
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
