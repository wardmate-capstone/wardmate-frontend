import { type FormEvent, useEffect, useRef, useState } from 'react';
import { ArrowRight, CaretLeft, CaretRight, Check, Clock, FileText, House, Info, MagnifyingGlass, SquaresFour, Wallet, X } from '@phosphor-icons/react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button, Input, Skeleton } from '@/components/ui';
import { procedureError } from '@/lib/api/procedures';
import { useProcedureCategories, usePublicProcedureList } from '@/hooks/useProcedureCategories';
import { ProcedureFeedback } from '@/components/ui/ProcedureFeedback';

const PAGE_SIZE = 5;

export function ProceduresPage({ embedded = false }: { embedded?: boolean }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const resultsHeading = useRef<HTMLHeadingElement>(null);
  const query = searchParams.get('q') ?? '';
  const [keyword, setKeyword] = useState(query);
  const categoryQuery = useProcedureCategories();
  const categories = [{ id: 0, categoryName: 'Tất cả' }, ...(categoryQuery.data ?? [])];
  const selectedCategory = searchParams.get('category') ?? '0';
  const requestedPage = Number(searchParams.get('page') ?? 1);
  const currentPage = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const result = usePublicProcedureList({
    keyword: query || undefined, categoryId: Number(selectedCategory) > 0 ? Number(selectedCategory) : undefined,
    pageNumber: currentPage, pageSize: PAGE_SIZE,
  }, true);
  const totalPages = result.data?.totalPages ?? 0;
  const totalCount = result.data?.totalCount ?? 0;
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const visibleProcedures = result.data?.items ?? [];
  const hasFilters = Boolean(query || selectedCategory !== '0');
  const isLoading = result.isPending;

  useEffect(() => {
    if (keyword === query) return;
    const timer = window.setTimeout(() => {
      setSearchParams((current) => {
        const next = new URLSearchParams(current);
        if (keyword) next.set('q', keyword);
        else next.delete('q');
        next.delete('page');
        return next;
      }, { replace: true });
    }, 300);
    return () => window.clearTimeout(timer);
  }, [keyword, query, setSearchParams]);

  useEffect(() => setKeyword(query), [query]);

  function updateFilter(key: 'q' | 'category', value: string) {
    if (key === 'q') setKeyword(value);
    const next = new URLSearchParams(searchParams);
    if (value && value !== '0') next.set(key, value);
    else next.delete(key);
    next.delete('page');
    setSearchParams(next, { replace: key === 'q' });
  }

  function clearFilters() {
    setKeyword('');
    const next = new URLSearchParams(searchParams);
    ['q', 'category', 'page'].forEach((key) => next.delete(key));
    setSearchParams(next);
  }

  function focusResults() {
    resultsHeading.current?.focus({ preventScroll: true });
    resultsHeading.current?.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
      block: 'start',
    });
  }

  function changePage(page: number) {
    const next = new URLSearchParams(searchParams);
    if (page === 1) next.delete('page');
    else next.set('page', String(page));
    setSearchParams(next);
    focusResults();
  }

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    updateFilter('q', keyword.trim());
    focusResults();
  }

  return (
    <div className="procedures-page">
      <section className={`procedures-hero${embedded ? ' procedures-hero-embedded' : ''}`} aria-labelledby={embedded ? undefined : 'procedures-title'} aria-label={embedded ? 'Tìm kiếm thủ tục' : undefined}>
        <div className="procedures-hero-inner">
          {!embedded && <><nav className="procedures-breadcrumb" aria-label="Đường dẫn">
            <Link to="/"><House size={16} aria-hidden="true" /> Trang chủ</Link>
            <CaretRight size={14} aria-hidden="true" />
            <span aria-current="page">Thủ tục hành chính</span>
          </nav>
          <div className="procedures-hero-copy">
            <p><FileText size={18} aria-hidden="true" /> Tra cứu & chuẩn bị hồ sơ</p>
            <h1 id="procedures-title">Thủ tục hành chính</h1>
            <span>Tìm đúng thủ tục, xem giấy tờ cần có và hướng dẫn thực hiện.</span>
          </div></>}
          <form className="procedures-search" role="search" onSubmit={handleSearch}>
            <label htmlFor="procedures-search-input">Tên thủ tục hoặc nhu cầu của bạn</label>
            <div>
              <MagnifyingGlass size={22} aria-hidden="true" />
              <Input id="procedures-search-input" type="search" value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="Ví dụ: đăng ký khai sinh, cấp bản sao…" aria-describedby="procedures-search-hint" className="min-h-14 pl-12 pr-12" />
              {keyword && <button type="button" onClick={() => setKeyword('')} aria-label="Xóa nội dung tìm kiếm"><X size={19} aria-hidden="true" /></button>}
            </div>
            <Button type="submit">Tìm kiếm <ArrowRight size={18} aria-hidden="true" /></Button>
          </form>
          <p id="procedures-search-hint" className="procedures-search-hint"><Info size={16} aria-hidden="true" /> Có thể nhập tiếng Việt có dấu hoặc không dấu.{!embedded && ' Không cần đăng nhập để tra cứu.'}</p>
        </div>
      </section>

      <section id="danh-sach-thu-tuc" className="procedures-directory" aria-labelledby="procedures-results-title">
        <aside className="procedures-filter" aria-label="Lọc theo lĩnh vực">
          <div className="procedures-filter-heading"><h2><SquaresFour size={19} aria-hidden="true" /> Lĩnh vực</h2>{!categoryQuery.isPending && !categoryQuery.isError && <span>{Math.max(0, categories.length - 1)} nhóm</span>}</div>
          <p className="procedures-filter-description">Chọn lĩnh vực bạn cần tìm</p>
          <div className="procedures-filter-list">
            {categoryQuery.isPending && <div role="status" aria-label="Đang tải lĩnh vực" className="space-y-3 p-3"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>}
            {!categoryQuery.isPending && categories.map((category) => {

              return (
                <button key={category.id} type="button" className={selectedCategory === String(category.id) ? 'is-selected' : ''} aria-pressed={selectedCategory === String(category.id)} onClick={() => updateFilter('category', String(category.id))}>
                  <span>{category.categoryName}</span>
                  {selectedCategory === String(category.id) && <Check size={18} aria-hidden="true" />}
                </button>
              );
            })}
          </div>
          <div className="procedures-filter-help"><Info size={20} aria-hidden="true" /><div><strong>Bắt đầu từ đâu?</strong><p>Chọn “Xem hướng dẫn” để biết thành phần hồ sơ, thời gian và lệ phí trước khi chuẩn bị.</p><Link to="/hoi-dap">Câu hỏi thường gặp <ArrowRight size={15} aria-hidden="true" /></Link></div></div>
        </aside>

        <div className="procedures-results">
          <ProcedureFeedback error={(result.isError && procedureError(result.error)) || (categoryQuery.isError && procedureError(categoryQuery.error)) || ''} retry={() => { void result.refetch(); void categoryQuery.refetch(); }} />
          <div className="procedures-results-heading">
            <div><p>Danh sách thủ tục</p><h2 ref={resultsHeading} tabIndex={-1} className="scroll-mt-36" id="procedures-results-title" aria-live="polite">{isLoading ? 'Đang tìm thủ tục…' : result.isError ? 'Chưa thể tải thủ tục' : `${totalCount} thủ tục phù hợp`}</h2></div>
            {hasFilters && <button type="button" onClick={clearFilters}>Xóa bộ lọc</button>}
          </div>
          {isLoading && <div className="procedures-list" role="status" aria-label="Đang tải danh sách">{Array.from({ length: 3 }, (_, index) => <div key={index} className="rounded-2xl border border-slate-200 bg-white p-5"><Skeleton className="h-5 w-24" /><Skeleton className="mt-4 h-6 w-3/4" /><Skeleton className="mt-4 h-4 w-1/2" /><Skeleton className="mt-5 h-4 w-2/3" /></div>)}</div>}
          {hasFilters && <div className="mt-4 flex flex-wrap gap-2" aria-label="Bộ lọc đang áp dụng">
            {query && <Button variant="outline" className="h-auto min-h-11 max-w-full px-3 text-left" onClick={() => updateFilter('q', '')} aria-label="Bỏ bộ lọc từ khóa"><span className="break-all">Từ khóa: {query}</span><X className="shrink-0" aria-hidden="true" /></Button>}
            {selectedCategory !== '0' && <Button variant="outline" className="min-h-11 px-3" onClick={() => updateFilter('category', '')} aria-label="Bỏ bộ lọc lĩnh vực">{categories.find(c => String(c.id) === selectedCategory)?.categoryName ?? 'Danh mục'}<X aria-hidden="true" /></Button>}
          </div>}

          {!result.isPending && !result.isError && visibleProcedures.length > 0 ? (
            <>
              <ul className="procedures-list">
                {visibleProcedures.map((procedure) => (
                  <li key={procedure.id}>
                    <Link to={'/thu-tuc/' + procedure.id + (searchParams.size ? '?' + searchParams.toString() : '')} className="procedure-result-row" aria-label={'Xem ' + procedure.title}>
                      <span className="procedure-result-copy"><span className="procedure-result-labels"><small>{procedure.categoryName}</small>{procedure.procedureCode && <span>Mã: {procedure.procedureCode}</span>}</span><strong>{procedure.title}</strong><span className="procedure-result-meta"><span><Clock size={18} aria-hidden="true" /><span>Thời gian: <b>{procedure.processingTimeSummary || 'Xem chi tiết'}</b></span></span><span><Wallet size={18} aria-hidden="true" /><span>Lệ phí: <b>{procedure.feeSummary || 'Xem chi tiết'}</b></span></span></span></span>
                      <span className="procedure-result-action">Xem hướng dẫn<ArrowRight size={18} aria-hidden="true" /></span>
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="procedures-pagination"><p role="status">Hiển thị {startIndex + 1}–{Math.min(startIndex + PAGE_SIZE, totalCount)} / {totalCount} thủ tục · Trang {currentPage}/{totalPages}</p><nav aria-label="Phân trang thủ tục" className="flex flex-wrap items-center gap-2">
                <Button variant="outline" className="min-h-11 px-3" disabled={!result.data?.hasPrevious} onClick={() => changePage(currentPage - 1)} aria-label="Trang trước"><CaretLeft aria-hidden="true" /><span className="hidden sm:inline">Trước</span></Button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, index) => Math.max(1, Math.min(currentPage - 2, totalPages - 4)) + index).map((page) => (
                  <Button key={page} variant={page === currentPage ? 'primary' : 'outline'} className="min-h-11 min-w-11 px-3" aria-label={'Trang ' + page} aria-current={page === currentPage ? 'page' : undefined} onClick={() => changePage(page)}>{page}</Button>
                ))}
                <Button variant="outline" className="min-h-11 px-3" disabled={!result.data?.hasNext} onClick={() => changePage(currentPage + 1)} aria-label="Trang sau"><span className="hidden sm:inline">Sau</span><CaretRight aria-hidden="true" /></Button>
              </nav></div>
            </>
          ) : !result.isPending && !result.isError ? (
            <div className="procedures-empty" role="status">
              <span><MagnifyingGlass size={28} aria-hidden="true" /></span>
              <h2>Chưa tìm thấy thủ tục phù hợp</h2>
              <p>Thử dùng từ khóa ngắn hơn hoặc chọn lại lĩnh vực.</p>
              <button type="button" onClick={clearFilters}>Xem tất cả thủ tục</button>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
