import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Input } from '@/components/ui';
import { ProcedureFeedback } from '@/components/ui/ProcedureFeedback';
import { useProcedureQuery } from '@/hooks/useProcedureQuery';
import { procedureApi, type Category, type ProcedureSummary } from '@/lib/api/procedures';

export function ProcedureApiList({ categories, onSelect, revision = 0 }: { categories: Category[]; onSelect: (row: ProcedureSummary) => void; revision?: number }) {
  const [keyword, setKeyword] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [level, setLevel] = useState('');
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState('Title');
  const [ascending, setAscending] = useState(true);
  const result = useProcedureQuery(useCallback((signal: AbortSignal) => {
    void revision;
    return procedureApi.list({ keyword: search || undefined, categoryId: category ? Number(category) : undefined, isActive: status ? status === 'true' : undefined, levelOfImplementation: level || undefined, pageNumber: page, pageSize: 10, sortBy: sort, isAscending: ascending }, true, signal);
  }, [search, category, status, level, page, sort, ascending, revision]));
  const selectClass = 'min-h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm';
  return <div className="space-y-5"><form className="admin-card flex flex-wrap items-end gap-3 p-4" onSubmit={e => { e.preventDefault(); setSearch(keyword.trim()); setPage(1); }}><Input label="Tìm tên hoặc mã thủ tục" value={keyword} onChange={e => setKeyword(e.target.value)} /><Button type="submit">Tìm kiếm</Button><label className="grid gap-2 text-sm">Danh mục<select className={selectClass} value={category} onChange={e => { setCategory(e.target.value); setPage(1); }}><option value="">Tất cả</option>{categories.map(c => <option key={c.id} value={c.id}>{c.categoryName}</option>)}</select></label><label className="grid gap-2 text-sm">Trạng thái<select className={selectClass} value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}><option value="">Tất cả</option><option value="true">Đang công khai</option><option value="false">Ngừng công khai</option></select></label><Input label="Cấp thực hiện" placeholder="Ví dụ: Cấp Xã" value={level} onChange={e => { setLevel(e.target.value); setPage(1); }} /><label className="grid gap-2 text-sm">Sắp xếp<select className={selectClass} value={sort} onChange={e => { setSort(e.target.value); setPage(1); }}>{[['Title', 'Tên'], ['ProcedureCode', 'Mã'], ['UpdatedAt', 'Ngày cập nhật'], ['CreatedAt', 'Ngày tạo'], ['LevelOfImplementation', 'Cấp thực hiện']].map(([key, title]) => <option key={key} value={key}>{title}</option>)}</select></label><Button variant="outline" onClick={() => { setAscending(!ascending); setPage(1); }}>{ascending ? 'Tăng dần' : 'Giảm dần'}</Button></form>
    <ProcedureFeedback loading={result.loading} error={result.error} retry={result.refresh} />{result.data && <><div className="admin-card overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr>{['Mã thủ tục', 'Tên thủ tục', 'Lĩnh vực', 'Trạng thái', 'Bản lưu', 'Thao tác'].map(text => <th key={text} className="p-4">{text}</th>)}</tr></thead><tbody>{result.data.items.map(row => <tr key={row.id} className="border-t"><td className="p-4">{row.procedureCode}</td><td className="min-w-56 p-4 font-semibold">{row.title}</td><td className="p-4">{row.categoryName}</td><td className="p-4">{row.isActive ? 'Đang công khai' : 'Ngừng công khai'}</td><td className="p-4">{row.versionCount ?? '—'}</td><td className="p-4"><Button size="small" variant="outline" onClick={() => onSelect(row)}>Chi tiết</Button>{row.isActive && <Link className="mt-2 block text-red-800 underline" to={`/thu-tuc/${row.id}`}>Xem công khai</Link>}</td></tr>)}</tbody></table>{!result.data.items.length && <p className="p-5">Không tìm thấy thủ tục phù hợp.</p>}</div><div className="flex flex-wrap items-center gap-3"><span>{result.data.totalCount} thủ tục · Trang {result.data.currentPage}/{Math.max(1, result.data.totalPages)}</span><Button variant="outline" disabled={!result.data.hasPrevious} onClick={() => setPage(p => p - 1)}>Trước</Button><Button variant="outline" disabled={!result.data.hasNext} onClick={() => setPage(p => p + 1)}>Sau</Button><Button variant="ghost" onClick={result.refresh}>Tải lại</Button></div></>}
  </div>;
}
