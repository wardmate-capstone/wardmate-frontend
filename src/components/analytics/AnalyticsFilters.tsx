import { useForm } from 'react-hook-form';
import { formatDateTime } from '@/lib/dateFormat';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  analyticsQuerySchema,
  initialAnalyticsQuery,
  vietnamToday,
  coverageSchema,
  analyticsError,
  type AnalyticsQuery,
} from '@/lib/api/analytics';
import type { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Pagination } from '@/components/ui';
import { useState, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { procedureApi } from '@/lib/api/procedures';
import { MagnifyingGlass, ArrowsClockwise, CheckCircle } from '@phosphor-icons/react';

export function AnalyticsFilters({
  value,
  onChange,
  actions,
  showProcedure = false,
}: {
  value: AnalyticsQuery;
  onChange: (value: AnalyticsQuery) => void;
  /** Nút phụ hiển thị cùng hàng chọn kỳ (ví dụ Làm mới dữ liệu) */
  actions?: ReactNode;
  /** Hiện ô lọc theo thủ tục (mặc định ẩn ở các trang thống kê của Manager) */
  showProcedure?: boolean;
}) {
  const [search, setSearch] = useState('');
  const [activePeriod, setActivePeriod] = useState<string>('Tháng này');
  const procedures = useQuery({
    queryKey: ['analytics-procedure-options', search],
    enabled: showProcedure,
    queryFn: ({ signal }) =>
      procedureApi.list(
        { keyword: search.trim() || undefined, pageNumber: 1, pageSize: 50 },
        false,
        signal,
      ),
  });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<AnalyticsQuery>({
    resolver: zodResolver(analyticsQuerySchema),
    defaultValues: value,
  });

  const selectedId = watch('procedureId');

  const setQuickPeriod = (label: string, index: number) => {
    setActivePeriod(label);
    const next = initialAnalyticsQuery();
    const month = Number(next.to.slice(5, 7));
    if (index === 2) {
      // Năm nay
      next.from = next.to.slice(0, 4) + '-01-01';
    } else if (index === 1) {
      // Quý này
      next.from = `${next.to.slice(0, 4)}-${String(
        Math.floor((month - 1) / 3) * 3 + 1,
      ).padStart(2, '0')}-01`;
    } else {
      // Tháng này: đầu tháng của ngày kết thúc
      next.from = `${next.to.slice(0, 7)}-01`;
    }
    reset(next);
    onChange(next);
  };

  const fieldClass = (invalid?: boolean) => `h-10 w-full rounded-lg border bg-white px-3 text-sm text-slate-800 transition focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-100 ${invalid ? 'border-red-500' : 'border-slate-300 hover:border-slate-400'}`;
  const labelClass = 'mb-1.5 block text-xs font-semibold text-slate-600';

  return (
    <form
      onSubmit={handleSubmit((data) => {
        setActivePeriod('');
        onChange({ ...data, page: 1 });
      })}
      className="admin-card space-y-4 p-4 sm:p-5"
    >
      {/* Chọn nhanh kỳ báo cáo + thao tác phụ (làm mới) */}
      <div className="flex flex-wrap items-center gap-3">
        <div role="group" aria-label="Chọn nhanh kỳ báo cáo" className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
          {['Tháng này', 'Quý này', 'Năm nay'].map((label, index) => (
            <button
              key={label}
              type="button"
              aria-pressed={activePeriod === label}
              onClick={() => setQuickPeriod(label, index)}
              className={`h-8 rounded-md px-3 text-xs font-semibold transition ${activePeriod === label ? 'bg-white text-red-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
              {label}
            </button>
          ))}
        </div>
        {actions && <div className="ml-auto flex items-center gap-2">{actions}</div>}
      </div>

      {/* Bộ lọc chi tiết trên một hàng */}
      <div className={`grid items-start gap-3 sm:grid-cols-2 ${showProcedure ? 'lg:grid-cols-[repeat(2,minmax(0,160px))_minmax(0,1fr)_auto]' : 'lg:grid-cols-[repeat(2,minmax(0,180px))_auto] lg:justify-start'}`}>
        <div>
          <label htmlFor="analytics-filter-from" className={labelClass}>Từ ngày</label>
          <input id="analytics-filter-from" type="date" min="2000-01-01" max={vietnamToday()} {...register('from', { onChange: () => setActivePeriod('') })} aria-invalid={!!errors.from} aria-describedby={errors.from ? 'analytics-filter-from-error' : undefined} className={fieldClass(!!errors.from)} />
          {errors.from && <p id="analytics-filter-from-error" role="alert" className="mt-1 text-xs font-medium text-red-600">{errors.from.message}</p>}
        </div>
        <div>
          <label htmlFor="analytics-filter-to" className={labelClass}>Đến ngày</label>
          <input id="analytics-filter-to" type="date" min="2000-01-01" max={vietnamToday()} {...register('to', { onChange: () => setActivePeriod('') })} aria-invalid={!!errors.to} aria-describedby={errors.to ? 'analytics-filter-to-error' : undefined} className={fieldClass(!!errors.to)} />
          {errors.to && <p id="analytics-filter-to-error" role="alert" className="mt-1 text-xs font-medium text-red-600">{errors.to.message}</p>}
        </div>
        {showProcedure && (
        <div className="sm:col-span-2 lg:col-span-1">
          <label htmlFor="analytics-filter-procedure" className={labelClass}>Thủ tục</label>
          {/* Ô tìm và ô chọn gộp thành một khối: gõ để thu hẹp danh sách thủ tục */}
          <div className="flex rounded-lg border border-slate-300 bg-white transition focus-within:border-red-600 focus-within:ring-4 focus-within:ring-red-100">
            <div className="relative w-40 shrink-0 border-r border-slate-200">
              <MagnifyingGlass size={15} aria-hidden className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                aria-label="Tìm thủ tục"
                placeholder="Tìm thủ tục…"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="h-10 w-full rounded-l-lg bg-transparent pl-8 pr-2 text-sm outline-none placeholder:text-slate-400"
              />
            </div>
            <select
              id="analytics-filter-procedure"
              className="h-10 min-w-0 flex-1 truncate rounded-r-lg bg-transparent px-2 text-sm text-slate-800 outline-none"
              {...register('procedureId', { setValueAs: (val) => val || undefined })}
            >
              <option value="">Tất cả thủ tục</option>
              {selectedId && !procedures.data?.items.some((item) => item.id === selectedId) && <option value={selectedId}>Thủ tục đang chọn</option>}
              {procedures.data?.items.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
            </select>
          </div>
          {procedures.isError && (
            <button type="button" className="mt-1 inline-flex items-center gap-1 text-xs text-red-600 hover:underline" onClick={() => void procedures.refetch()}>
              <ArrowsClockwise size={12} /> Chưa tải được danh sách thủ tục. Thử lại
            </button>
          )}
          {errors.procedureId && <p role="alert" className="mt-1 text-xs font-medium text-red-600">Chọn thủ tục hợp lệ.</p>}
        </div>
        )}
        <Button type="submit" className="h-10 min-h-0 px-5 sm:col-span-2 lg:col-span-1 lg:mt-[22px]">Áp dụng</Button>
      </div>
    </form>
  );
}
export function AnalyticsStatus({ pending, error, retry }: { pending: boolean; error: unknown; retry: () => void }) {
  if (error) {
    return (
      <div
        role="alert"
        className="admin-card flex flex-col items-center justify-center gap-3 border-red-200 bg-red-50/40 p-6 text-center"
      >
        <p className="text-sm font-medium text-red-800">{analyticsError(error)}</p>
        <Button variant="outline" size="small" onClick={retry}>
          Thử lại
        </Button>
      </div>
    );
  }
  return pending ? (
    <div
      role="status"
      className="admin-card flex items-center justify-center gap-2.5 p-8 text-sm text-slate-500"
    >
      <span className="size-4 animate-spin rounded-full border-2 border-red-700 border-r-transparent" />
      <span>Đang tải và tổng hợp dữ liệu thống kê...</span>
    </div>
  ) : null;
}

export function CoverageNotice({ data }: { data?: z.infer<typeof coverageSchema> | null }) {
  if (!data) return null;
  return (
    <div className="flex flex-col gap-2 pt-2 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between" role="status">
      {data.missingDates.length > 0 ? (
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1 font-medium text-amber-800 ring-1 ring-amber-200/60">
          Chưa đủ dữ liệu tổng hợp: thiếu {data.missingDates.length} ngày trong kỳ.
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 text-emerald-700">
          <CheckCircle size={14} weight="fill" /> Dữ liệu tổng hợp đầy đủ
        </span>
      )}
      <span>
        Cập nhật: {data.latestRefreshAtUtc ? formatDateTime(data.latestRefreshAtUtc) : 'Chưa có lần tổng hợp'} (Giờ VN)
      </span>
    </div>
  );
}

export function AnalyticsPagination({ page, total, size, onChange }: { page: number; total: number; size: number; onChange: (page: number) => void }) {
  // Chỉ có một trang thì không cần thanh chuyển trang
  if (page <= 1 && total <= size) return null;
  return (
    <Pagination
      className="border-t border-slate-100 pt-4"
      label="Phân trang thống kê"
      page={page}
      total={total}
      pageSize={size}
      unit="kết quả"
      hasNext={page < 100000 && page * size < total}
      onPageChange={onChange}
    />
  );
}
