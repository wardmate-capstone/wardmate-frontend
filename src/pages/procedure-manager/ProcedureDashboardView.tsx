import { useCallback } from 'react';
import {
  Files,
  Prohibit,
  CheckCircle,
  Folders,
  FileArrowUp,
  FileText,
  ArrowRight,
  CaretRight,
  CalendarBlank,
  Tag,
  Plus,
} from '@phosphor-icons/react';
import { procedureApi, type ProcedureSummary } from '@/lib/api/procedures';
import { useProcedureQuery } from '@/hooks/useProcedureQuery';
import { ProcedureFeedback } from '@/components/ui/ProcedureFeedback';
import { ListSkeleton, EmptyState } from '@/components/ui';
import type { ProcedureNavSection } from '@/components/layout/RoleWorkspaceSidebars';

export interface ProcedureDashboardViewProps {
  stats?: { active: number; inactive: number };
  statsLoading?: boolean;
  categoriesCount?: number;
  canCreate?: boolean;
  onCreateProcedure?: () => void;
  onNavigateSection: (section: ProcedureNavSection) => void;
  onSelectProcedure: (procedure: ProcedureSummary) => void;
}

export function ProcedureDashboardView({
  stats,
  statsLoading = false,
  categoriesCount,
  canCreate = false,
  onCreateProcedure,
  onNavigateSection,
  onSelectProcedure,
}: ProcedureDashboardViewProps) {
  const recent = useProcedureQuery(
    useCallback(
      (signal: AbortSignal) =>
        procedureApi.list({ pageSize: 3, sortBy: 'UpdatedAt', isAscending: false }, true, signal),
      [],
    ),
  );

  const totalCount = stats ? stats.active + stats.inactive : undefined;
  const activePercent =
    stats && totalCount && totalCount > 0 ? Math.round((stats.active / totalCount) * 100) : null;

  const statCards = [
    {
      label: 'Tổng thủ tục quản lý',
      value: totalCount,
      subtext: totalCount !== undefined ? `${totalCount} thủ tục trong hệ thống` : undefined,
      icon: Files,
      color: 'bg-slate-100 text-slate-800 border-slate-200',
      open: () => onNavigateSection('procedures'),
    },
    {
      label: 'Đang công khai',
      value: stats?.active,
      subtext: activePercent !== null ? `${activePercent}% hoạt động` : undefined,
      icon: CheckCircle,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      open: () => onNavigateSection('procedures'),
    },
    {
      label: 'Tạm ngừng công khai',
      value: stats?.inactive,
      subtext: stats?.inactive && stats.inactive > 0 ? 'Cần rà soát hiệu lực' : '0 thủ tục',
      icon: Prohibit,
      color: 'bg-rose-50 text-rose-700 border-rose-200',
      open: () => onNavigateSection('procedures'),
    },
    {
      label: 'Lĩnh vực hành chính',
      value: categoriesCount,
      subtext: categoriesCount !== undefined ? `${categoriesCount} danh mục lĩnh vực` : undefined,
      icon: Folders,
      color: 'bg-sky-50 text-sky-700 border-sky-200',
      open: () => onNavigateSection('categories'),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Hàng 4 thẻ chỉ số tổng quan */}
      <section aria-label="Các chỉ số tổng quan" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map(({ label, value, subtext, icon: Icon, color, open }) => (
          <button
            key={label}
            type="button"
            onClick={open}
            className="group relative flex flex-col justify-between rounded-xl border border-slate-200/80 bg-white p-5 text-left shadow-[0_4px_14px_rgba(15,23,42,.035)] transition-all hover:-translate-y-0.5 hover:border-red-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-red-600/30"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-bold text-slate-500 group-hover:text-slate-800 transition-colors">
                {label}
              </span>
              <div className={`grid size-10 place-items-center rounded-xl border ${color} transition-transform group-hover:scale-105`}>
                <Icon size={20} weight="duotone" />
              </div>
            </div>

            <div className="mt-4">
              {statsLoading && value === undefined ? (
                <div className="h-8 w-20 animate-pulse rounded-lg bg-slate-200/70" />
              ) : (
                <p className="text-3xl font-extrabold tracking-tight text-slate-950">
                  {value ?? '—'}
                </p>
              )}
              {subtext && (
                <p className="mt-1 text-xs font-medium text-slate-400 group-hover:text-slate-600 transition-colors">
                  {subtext}
                </p>
              )}
            </div>
          </button>
        ))}
      </section>

      {/* Bố cục 2 cột: Thủ tục gần đây & Thao tác nhanh */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Cột chính: Thủ tục cập nhật gần đây */}
        <section className="admin-card min-w-0 p-5 sm:p-6 lg:col-span-8">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-950">Thủ tục cập nhật gần đây</h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Các quy trình vừa được ban hành hoặc cập nhật nội dung
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateSection('procedures')}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200/90 bg-white px-3 py-1.5 text-xs font-bold text-red-800 shadow-sm transition-all hover:border-red-300 hover:bg-red-50/50"
            >
              Xem tất cả
              <ArrowRight size={14} weight="bold" />
            </button>
          </div>

          <ProcedureFeedback error={recent.error} retry={recent.refresh} />

          {recent.loading && (
            <div className="mt-4">
              <ListSkeleton rows={4} />
            </div>
          )}

          {!recent.loading && recent.data?.items.length === 0 && (
            <EmptyState icon={Files} title="Chưa có dữ liệu thủ tục nào." />
          )}

          {!recent.loading && recent.data && recent.data.items.length > 0 && (
            <div className="mt-4 space-y-3">
              {recent.data.items.slice(0, 3).map((proc) => (
                <button
                  type="button"
                  key={proc.id}
                  onClick={() => onSelectProcedure(proc)}
                  className="group block w-full rounded-xl border border-slate-200/80 bg-white p-4 text-left transition-all hover:border-red-200 hover:bg-red-50/20 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-red-600/30"
                >
                  {/* Dòng 1: Mã thủ tục, Huy hiệu trạng thái và Danh mục */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-100 px-2.5 py-0.5 font-mono text-xs font-bold text-slate-700">
                        {proc.procedureCode}
                      </span>
                      {proc.isActive ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                          <span className="size-1.5 rounded-full bg-emerald-600 animate-pulse" />
                          Đang công khai
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-800">
                          <span className="size-1.5 rounded-full bg-rose-500" />
                          Ngừng công khai
                        </span>
                      )}
                    </div>
                    {proc.categoryName && (
                      <span className="inline-flex items-center gap-1 rounded border border-slate-100 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                        <Tag size={12} weight="bold" />
                        {proc.categoryName}
                      </span>
                    )}
                  </div>

                  {/* Dòng 2: Tên thủ tục */}
                  <h3 className="mt-2.5 text-sm font-bold text-slate-900 line-clamp-2 transition-colors group-hover:text-red-900">
                    {proc.title}
                  </h3>

                  {/* Dòng 3: Footer metadata */}
                  <div className="mt-3 flex items-center justify-between border-t border-slate-100/90 pt-2.5 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1.5 text-slate-400">
                      <CalendarBlank size={13} weight="bold" />
                      Cập nhật: {new Date(proc.updatedAt).toLocaleDateString('vi-VN')}
                    </span>
                    <span className="inline-flex items-center gap-1 font-semibold text-slate-500 transition-colors group-hover:text-red-800">
                      Xem chi tiết
                      <CaretRight
                        size={14}
                        weight="bold"
                        className="transition-transform group-hover:translate-x-0.5"
                      />
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Cột phụ: Lối tắt thao tác nhanh & Lưu ý nghiệp vụ */}
        <div className="space-y-4 lg:col-span-4">
          {/* Khối Thao tác nhanh */}
          <section className="admin-card p-5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Thao tác nhanh
            </h2>
            <div className="mt-3 space-y-2">
              {canCreate && onCreateProcedure && (
                <button
                  type="button"
                  onClick={onCreateProcedure}
                  className="flex w-full items-center justify-between gap-3 rounded-lg bg-red-800 px-3.5 py-2.5 text-left text-xs font-bold text-white shadow-sm transition-colors hover:bg-red-700"
                >
                  <span className="inline-flex items-center gap-2">
                    <Plus size={16} weight="bold" aria-hidden="true" />
                    Thêm thủ tục mới
                  </span>
                  <CaretRight size={14} weight="bold" />
                </button>
              )}
              <button
                type="button"
                onClick={() => onNavigateSection('drafts')}
                className="flex w-full items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-left text-xs font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50"
              >
                <span className="inline-flex items-center gap-2">
                  <FileArrowUp size={16} weight="duotone" className="text-red-700" />
                  PDF & bản nháp bóc tách
                </span>
                <CaretRight size={14} className="text-slate-400" />
              </button>
              <button
                type="button"
                onClick={() => onNavigateSection('categories')}
                className="flex w-full items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-left text-xs font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50"
              >
                <span className="inline-flex items-center gap-2">
                  <Folders size={16} weight="duotone" className="text-amber-700" />
                  Danh mục lĩnh vực
                </span>
                <CaretRight size={14} className="text-slate-400" />
              </button>
              <button
                type="button"
                onClick={() => onNavigateSection('forms')}
                className="flex w-full items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-left text-xs font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50"
              >
                <span className="inline-flex items-center gap-2">
                  <FileText size={16} weight="duotone" className="text-blue-700" />
                  Danh sách biểu mẫu
                </span>
                <CaretRight size={14} className="text-slate-400" />
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
