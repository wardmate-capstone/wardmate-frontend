import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClockCounterClockwise, ArrowSquareOut } from '@phosphor-icons/react';
import { Button, TableSkeletonRows, SearchInput, Select } from '@/components/ui';

/** Cấp thực hiện theo danh mục Cổng DVC; BE lọc khớp đúng một cấp trong danh sách "Cấp tỉnh, Cấp xã" (không phân biệt hoa thường, dấu). */
const LEVELS = ['Cấp Xã', 'Cấp Tỉnh', 'Cấp Bộ'];
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
  onSelect?: (row: ProcedureSummary) => void;
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

  // Lọc ngay khi gõ (chờ 300 ms để không gọi API mỗi phím).
  useEffect(() => {
    const next = keyword.trim();
    if (next === search) return;
    const timer = window.setTimeout(() => { setSearch(next); setPage(1); }, 300);
    return () => window.clearTimeout(timer);
  }, [keyword, search]);

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


  return (
    <div className="space-y-4">
      {/* Thanh lọc luôn hiện, lọc ngay khi gõ/chọn (giống danh sách hồ sơ cán bộ); không còn nút Tìm kiếm / Bộ lọc thu gọn. */}
      <div className="admin-card space-y-3 p-4">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(0,2fr)_repeat(4,minmax(0,1fr))]">
          <div className="min-w-0 sm:col-span-2 xl:col-span-1">
            <label htmlFor="pm-search" className="mb-1.5 block text-xs font-medium text-slate-600">Tìm thủ tục</label>
            <SearchInput
              id="pm-search"
              aria-label="Tìm thủ tục theo tên hoặc mã"
              placeholder="Tìm kiếm theo tên hoặc mã thủ tục..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onClear={() => setKeyword('')}
            />
          </div>
          <div className="min-w-0">
            <label htmlFor="pm-category" className="mb-1.5 block text-xs font-medium text-slate-600">Lĩnh vực</label>
            <Select id="pm-category" value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }}>
              <option value="">Tất cả lĩnh vực</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.categoryName}</option>)}
            </Select>
          </div>
          <div className="min-w-0">
            <label htmlFor="pm-status" className="mb-1.5 block text-xs font-medium text-slate-600">Trạng thái</label>
            <Select id="pm-status" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
              <option value="">Tất cả trạng thái</option>
              <option value="true">Đang công khai</option>
              <option value="false">Đang ẩn</option>
            </Select>
          </div>
          <div className="min-w-0">
            <label htmlFor="pm-level" className="mb-1.5 block text-xs font-medium text-slate-600">Cấp thực hiện</label>
            <Select id="pm-level" value={level} onChange={(e) => { setLevel(e.target.value); setPage(1); }}>
              <option value="">Tất cả cấp</option>
              {LEVELS.map((value) => <option key={value} value={value}>{value}</option>)}
            </Select>
          </div>
          <div className="min-w-0">
            <label htmlFor="pm-sort" className="mb-1.5 block text-xs font-medium text-slate-600">Sắp xếp</label>
            <Select id="pm-sort" value={sortOption} onChange={(e) => { setSortOption(e.target.value); setPage(1); }}>
              <option value="Title_asc">Tên (A → Z)</option>
              <option value="Title_desc">Tên (Z → A)</option>
              <option value="ProcedureCode_asc">Mã thủ tục (A → Z)</option>
              <option value="ProcedureCode_desc">Mã thủ tục (Z → A)</option>
              <option value="UpdatedAt_desc">Mới cập nhật trước</option>
              <option value="UpdatedAt_asc">Cập nhật lâu nhất trước</option>
              <option value="CreatedAt_desc">Mới tạo trước</option>
              <option value="CreatedAt_asc">Tạo lâu nhất trước</option>
            </Select>
          </div>
        </div>
        {hasActiveFilters && (
          <div className="flex justify-end border-t border-slate-100 pt-3">
            <button type="button" onClick={handleResetFilters} className="text-xs font-semibold text-red-700 hover:underline">
              Xóa bộ lọc
            </button>
          </div>
        )}
      </div>

      <ProcedureFeedback error={result.error} retry={result.refresh} />


      {/* Procedure Table */}
      {!result.error && (
        <div className="admin-card overflow-hidden">
          <div className="admin-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Mã thủ tục</th>
                  <th>Tên thủ tục</th>
                  <th>Lĩnh vực</th>
                  <th>Trạng thái</th>
                  <th className="text-center">Bản lưu</th>
                  {onSelect && <th className="text-right">Thao tác</th>}
                </tr>
              </thead>
              <tbody>
                {result.loading ? (
                  <TableSkeletonRows
                    columns={onSelect ? 6 : 5}
                    rows={6}
                    cellClassName="px-4 py-3.5"
                    columnWidths={[
                      'w-28 font-mono',
                      'w-64',
                      'w-32',
                      'w-24',
                      'w-16 mx-auto',
                      onSelect ? 'ml-auto w-24' : undefined,
                    ]}
                    lastCellClassName={onSelect ? 'text-right' : undefined}
                  />
                ) : (
                  (result.data?.items ?? []).map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="font-mono text-xs font-semibold text-slate-700 whitespace-nowrap">
                      {row.procedureCode}
                    </td>
                    <td className="font-medium text-slate-900 max-w-md">
                      <p className="line-clamp-2">{row.title}</p>
                    </td>
                    <td className="text-slate-600 whitespace-nowrap">
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 font-medium">
                        {row.categoryName}
                      </span>
                    </td>
                    <td className="whitespace-nowrap">
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
                        {row.isActive ? 'Đang công khai' : 'Đang ẩn'}
                      </span>
                    </td>
                    <td className="text-center whitespace-nowrap">
                      {onViewVersions ? <button
                        type="button"
                        onClick={() => onViewVersions?.(row)}
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
                        title="Xem lịch sử phiên bản"
                        aria-label={`Xem ${row.versionCount ?? 0} bản lưu của ${row.title}`}
                      >
                        <ClockCounterClockwise size={14} className="text-slate-400" />
                        <span>{row.versionCount ?? 0}</span>
                      </button> : <span className="text-xs text-slate-600">{row.versionCount ?? 0}</span>}
                    </td>
                    {onSelect && <td className="text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button type="button" className="ws-row-btn" onClick={() => onSelect(row)}>
                          Chi tiết
                        </button>
                        {row.isActive && (
                          <Link
                            to={`/thu-tuc/${row.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center size-8 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-red-800 transition"
                            title="Xem trang công khai của công dân"
                            aria-label={`Mở trang công khai của ${row.title} trong thẻ mới`}
                          >
                            <ArrowSquareOut size={16} />
                          </Link>
                        )}
                      </div>
                    </td>}
                  </tr>
                )))}
              </tbody>
            </table>
          </div>

          {!result.loading && result.data && !result.data.items.length && (
            <div className="py-12 text-center text-[13px] text-slate-500">
              Không tìm thấy thủ tục nào phù hợp với bộ lọc hiện tại.
            </div>
          )}

          {/* Pagination */}
          {result.data && (
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
            </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
