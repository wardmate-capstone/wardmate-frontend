import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { MagnifyingGlass, Funnel, ClockCounterClockwise, ArrowSquareOut } from '@phosphor-icons/react';
import { Button, TableSkeleton } from '@/components/ui';
import { ProcedureFeedback } from '@/components/ui/ProcedureFeedback';
import { useProcedureQuery } from '@/hooks/useProcedureQuery';
import { procedureApi, type Category, type ProcedureSummary } from '@/lib/api/procedures';

export function ProcedureApiList({
  categories,
  onSelect,
  onViewVersions,
  revision = 0,
}: {
  categories: Category[];
  onSelect: (row: ProcedureSummary) => void;
  onViewVersions?: (row: ProcedureSummary) => void;
  revision?: number;
}) {
  const [keyword, setKeyword] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [level, setLevel] = useState('');
  const [page, setPage] = useState(1);
  const [sortOption, setSortOption] = useState('Title_asc');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const [sort, ascending] = sortOption.split('_');
  const isAscending = ascending === 'asc';

  const result = useProcedureQuery(
    useCallback(
      (signal: AbortSignal) => {
        void revision;
        return procedureApi.list(
          {
            keyword: search || undefined,
            categoryId: category ? Number(category) : undefined,
            isActive: status ? status === 'true' : undefined,
            levelOfImplementation: level || undefined,
            pageNumber: page,
            pageSize: 10,
            sortBy: sort,
            isAscending: isAscending,
          },
          true,
          signal
        );
      },
      [search, category, status, level, page, sort, isAscending, revision]
    )
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(keyword.trim());
    setPage(1);
  };

  const handleResetFilters = () => {
    setKeyword('');
    setSearch('');
    setCategory('');
    setStatus('');
    setLevel('');
    setSortOption('Title_asc');
    setPage(1);
  };

  const hasActiveFilters = Boolean(search || category || status || level || sortOption !== 'Title_asc');

  const selectClass =
    'h-10 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 text-xs text-slate-800 transition focus:border-red-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-100';

  return (
    <div className="space-y-4">
      {/* Search & Filter Toolbar */}
      <div className="admin-card p-4 space-y-3">
        <form onSubmit={handleSearch} className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
          {/* Main search input */}
          <div className="relative flex-1">
            <MagnifyingGlass
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên hoặc mã thủ tục..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-red-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-100"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button type="submit" size="small" className="min-h-11 px-5">
              Tìm kiếm
            </Button>
            <Button
              type="button"
              variant={showAdvancedFilters || hasActiveFilters ? 'primary' : 'outline'}
              size="small"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="min-h-11 flex items-center gap-1.5"
            >
              <Funnel size={16} />
              <span>Bộ lọc</span>
              {hasActiveFilters && (
                <span className="size-2 rounded-full bg-gold-400 ring-2 ring-white" />
              )}
            </Button>
          </div>
        </form>

        {/* Collapsible Advanced Filters */}
        {showAdvancedFilters && (
          <div className="pt-3 border-t border-slate-100 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 animate-in fade-in duration-150">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Lĩnh vực</label>
              <select
                className={selectClass}
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">Tất cả lĩnh vực</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.categoryName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Trạng thái công khai</label>
              <select
                className={selectClass}
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">Tất cả trạng thái</option>
                <option value="true">Đang công khai</option>
                <option value="false">Ngừng công khai</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Cấp thực hiện</label>
              <input
                type="text"
                placeholder="Ví dụ: Cấp Xã, Cấp Tỉnh..."
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 text-xs text-slate-800 focus:border-red-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-100"
                value={level}
                onChange={(e) => {
                  setLevel(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Sắp xếp theo</label>
              <select
                className={selectClass}
                value={sortOption}
                onChange={(e) => {
                  setSortOption(e.target.value);
                  setPage(1);
                }}
              >
                <option value="Title_asc">Tên (A → Z)</option>
                <option value="Title_desc">Tên (Z → A)</option>
                <option value="ProcedureCode_asc">Mã thủ tục (A → Z)</option>
                <option value="ProcedureCode_desc">Mã thủ tục (Z → A)</option>
                <option value="UpdatedAt_desc">Ngày cập nhật (Mới nhất)</option>
                <option value="UpdatedAt_asc">Ngày cập nhật (Cũ nhất)</option>
                <option value="CreatedAt_desc">Ngày tạo (Mới nhất)</option>
                <option value="CreatedAt_asc">Ngày tạo (Cũ nhất)</option>
                <option value="LevelOfImplementation_asc">Cấp thực hiện (A → Z)</option>
                <option value="LevelOfImplementation_desc">Cấp thực hiện (Z → A)</option>
              </select>
            </div>

            {hasActiveFilters && (
              <div className="sm:col-span-2 lg:col-span-4 flex justify-end">
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-xs text-slate-500 hover:text-red-800 underline transition"
                >
                  Xóa tất cả bộ lọc
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <ProcedureFeedback error={result.error} retry={result.refresh} />
      {result.loading && <TableSkeleton columns={6} />}

      {/* Procedure Table */}
      {result.data && (
        <div className="admin-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-600 border-b border-slate-200/80">
                <tr>
                  <th className="px-4 py-3.5">Mã thủ tục</th>
                  <th className="px-4 py-3.5">Tên thủ tục</th>
                  <th className="px-4 py-3.5">Lĩnh vực</th>
                  <th className="px-4 py-3.5">Trạng thái</th>
                  <th className="px-4 py-3.5 text-center">Bản lưu</th>
                  <th className="px-4 py-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {result.data.items.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3.5 font-mono text-xs font-bold text-red-900 whitespace-nowrap">
                      {row.procedureCode}
                    </td>
                    <td className="px-4 py-3.5 font-medium text-slate-900 max-w-md">
                      <p className="line-clamp-2">{row.title}</p>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-600 whitespace-nowrap">
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 font-medium">
                        {row.categoryName}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          row.isActive
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/50'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        <span
                          className={`size-1.5 rounded-full ${
                            row.isActive ? 'bg-emerald-500' : 'bg-slate-400'
                          }`}
                        />
                        {row.isActive ? 'Đang công khai' : 'Ngừng công khai'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onViewVersions?.(row)}
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
                        title="Xem lịch sử phiên bản"
                      >
                        <ClockCounterClockwise size={14} className="text-slate-400" />
                        <span>{row.versionCount ?? 0}</span>
                      </button>
                    </td>
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <Button size="small" variant="outline" onClick={() => onSelect(row)}>
                          Chi tiết
                        </Button>
                        {row.isActive && (
                          <Link
                            to={`/thu-tuc/${row.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center size-8 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-red-800 transition"
                            title="Xem trang công khai của công dân"
                          >
                            <ArrowSquareOut size={16} />
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!result.data.items.length && (
            <div className="py-12 text-center text-slate-500 text-sm">
              Không tìm thấy thủ tục nào phù hợp với bộ lọc hiện tại.
            </div>
          )}

          {/* Pagination */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 p-4 bg-slate-50/50">
            <span className="text-xs text-slate-600">
              Tổng số <strong>{result.data.totalCount}</strong> thủ tục · Trang{' '}
              <strong>{result.data.currentPage}</strong> / {Math.max(1, result.data.totalPages)}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="small"
                disabled={!result.data.hasPrevious}
                onClick={() => setPage((p) => p - 1)}
              >
                Trước
              </Button>
              <Button
                variant="outline"
                size="small"
                disabled={!result.data.hasNext}
                onClick={() => setPage((p) => p + 1)}
              >
                Sau
              </Button>
              <Button variant="ghost" size="small" onClick={result.refresh}>
                Làm mới
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
