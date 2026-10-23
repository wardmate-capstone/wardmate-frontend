import { useForm } from 'react-hook-form';
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
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { procedureApi } from '@/lib/api/procedures';
import {
  CalendarBlank,
  MagnifyingGlass,
  FunnelSimple,
  ArrowsClockwise,
  CheckCircle,
  FileText,
} from '@phosphor-icons/react';

export function AnalyticsFilters({
  value,
  onChange,
}: {
  value: AnalyticsQuery;
  onChange: (value: AnalyticsQuery) => void;
}) {
  const [search, setSearch] = useState('');
  const [activePeriod, setActivePeriod] = useState<string>('Tháng này');
  const procedures = useQuery({
    queryKey: ['analytics-procedure-options', search],
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

  return (
    <div className="admin-card overflow-hidden border border-slate-200/80 bg-white shadow-sm transition-all hover:shadow-md">
      {/* Header bar của Card Bộ lọc */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 via-white to-slate-50/50 px-5 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-red-50 text-red-700">
            <FunnelSimple size={18} weight="bold" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">Bộ lọc & Phạm vi thời gian</h3>
            <p className="text-xs text-slate-500">Tùy chỉnh khoảng thời gian và tiêu chí thống kê số liệu</p>
          </div>
        </div>

        {/* Nút chọn nhanh kỳ báo cáo */}
        <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-100/70 p-1">
          {['Tháng này', 'Quý này', 'Năm nay'].map((label, index) => {
            const isActive = activePeriod === label;
            return (
              <button
                key={label}
                type="button"
                onClick={() => setQuickPeriod(label, index)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-150 ${
                  isActive
                    ? 'bg-white text-red-800 shadow-sm ring-1 ring-slate-200/50'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Form bộ lọc chi tiết */}
      <form
        onSubmit={handleSubmit((data) => {
          setActivePeriod('');
          onChange({ ...data, page: 1 });
        })}
        className="p-5"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-12 lg:items-end">
          {/* Từ ngày */}
          <div className="space-y-1.5 lg:col-span-3">
            <label htmlFor="analytics-filter-from" className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-600">
              <CalendarBlank size={15} className="text-slate-400" />
              <span>Từ ngày</span>
            </label>
            <div className="relative">
              <input
                id="analytics-filter-from"
                type="date"
                min="2000-01-01"
                max={vietnamToday()}
                {...register('from')}
                className={`h-11 w-full rounded-xl border bg-slate-50/40 px-3.5 py-2 text-sm text-slate-800 transition-all focus:border-red-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-red-100 ${
                  errors.from ? 'border-red-500 bg-red-50/30' : 'border-slate-200 hover:border-slate-300'
                }`}
              />
            </div>
            {errors.from && (
              <p role="alert" className="text-xs font-medium text-red-600">
                {errors.from.message}
              </p>
            )}
          </div>

          {/* Đến ngày */}
          <div className="space-y-1.5 lg:col-span-3">
            <label htmlFor="analytics-filter-to" className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-600">
              <CalendarBlank size={15} className="text-slate-400" />
              <span>Đến ngày</span>
            </label>
            <div className="relative">
              <input
                id="analytics-filter-to"
                type="date"
                min="2000-01-01"
                max={vietnamToday()}
                {...register('to')}
                className={`h-11 w-full rounded-xl border bg-slate-50/40 px-3.5 py-2 text-sm text-slate-800 transition-all focus:border-red-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-red-100 ${
                  errors.to ? 'border-red-500 bg-red-50/30' : 'border-slate-200 hover:border-slate-300'
                }`}
              />
            </div>
            {errors.to && (
              <p role="alert" className="text-xs font-medium text-red-600">
                {errors.to.message}
              </p>
            )}
          </div>

          {/* Tìm & Chọn thủ tục */}
          <div className="space-y-1.5 sm:col-span-2 lg:col-span-4">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-600">
                <FileText size={15} className="text-slate-400" />
                <span>Thủ tục áp dụng</span>
              </label>
              {selectedId && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                  <CheckCircle size={12} weight="fill" />
                  Đã lọc thủ tục
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div className="relative">
                <MagnifyingGlass
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  placeholder="Gõ để lọc..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/40 pl-9 pr-3 text-sm text-slate-800 placeholder:text-slate-400 transition-all focus:border-red-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-red-100 hover:border-slate-300"
                />
              </div>

              <select
                className="h-11 w-full truncate rounded-xl border border-slate-200 bg-slate-50/40 px-3 text-sm text-slate-800 transition-all focus:border-red-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-red-100 hover:border-slate-300"
                {...register('procedureId', {
                  setValueAs: (val) => val || undefined,
                })}
              >
                <option value="">Tất cả thủ tục</option>
                {selectedId &&
                  !procedures.data?.items.some((item) => item.id === selectedId) && (
                    <option value={selectedId}>Thủ tục đang chọn</option>
                  )}
                {procedures.data?.items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title}
                  </option>
                ))}
              </select>
            </div>

            {procedures.isError && (
              <button
                type="button"
                className="inline-flex items-center gap-1 text-xs text-red-600 hover:underline"
                onClick={() => void procedures.refetch()}
              >
                <ArrowsClockwise size={12} /> Chưa tải được danh sách. Thử lại
              </button>
            )}
            {errors.procedureId && (
              <p role="alert" className="text-xs font-medium text-red-600">
                Chọn thủ tục hợp lệ.
              </p>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 sm:col-span-2 lg:col-span-2">
            <Button
              type="submit"
              className="h-11 w-full shadow-sm hover:shadow-md"
            >
              Áp dụng
            </Button>
          </div>
        </div>
      </form>
    </div>
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
        Cập nhật: {data.latestRefreshAtUtc ? new Date(data.latestRefreshAtUtc).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }) : 'Chưa có lần tổng hợp'} (Giờ VN)
      </span>
    </div>
  );
}

export function AnalyticsPagination({ page, total, size, onChange }: { page: number; total: number; size: number; onChange: (page: number) => void }) {
  return (
    <nav aria-label="Phân trang thống kê" className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
      <span className="text-xs text-slate-500">
        Trang {page} · {total} kết quả
      </span>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="small" disabled={page <= 1} onClick={() => onChange(page - 1)}>
          Trang trước
        </Button>
        <Button variant="outline" size="small" disabled={page >= 100000 || page * size >= total} onClick={() => onChange(page + 1)}>
          Trang sau
        </Button>
      </div>
    </nav>
  );
}
