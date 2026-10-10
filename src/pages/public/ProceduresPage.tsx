import { type FormEvent, useEffect, useRef, useState } from 'react';
import { ArrowRight, CaretLeft, CaretRight, House, MagnifyingGlass, X } from '@phosphor-icons/react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button, Input, ListSkeleton } from '@/components/ui';
import { procedureError } from '@/lib/api/procedures';
import { useProcedureCategories, usePublicProcedureList } from '@/hooks/useProcedureCategories';
import { ProcedureFeedback } from '@/components/ui/ProcedureFeedback';

const PAGE_SIZE = 5;

export function ProceduresPage() {
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
    const next = new URLSearchParams(searchParams);
    if (value && value !== '0') next.set(key, value);
    else next.delete(key);
    next.delete('page');
    setSearchParams(next, { replace: key === 'q' });
  }

  function clearFilters() {
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
    focusResults();
  }

  return (
    <div className="procedures-page">
      <section className="procedures-hero" aria-labelledby="procedures-title">
        <div className="procedures-hero-pattern" aria-hidden="true" />
        <div className="procedures-hero-inner">
          <nav className="procedures-breadcrumb" aria-label="Đường dẫn">
            <Link to="/"><House size={16} aria-hidden="true" /> Trang chủ</Link>
            <CaretRight size={14} aria-hidden="true" />
            <span aria-current="page">Thủ tục hành chính</span>
          </nav>
          <div className="procedures-hero-copy">
            <p>Danh mục hướng dẫn</p>
            <h1 id="procedures-title">Thủ tục hành chính</h1>
            <span>Tìm thủ tục theo tên hoặc lĩnh vực để bắt đầu chuẩn bị hồ sơ. Không cần đăng nhập để tra cứu.</span>
          </div>
          <form className="procedures-search" role="search" onSubmit={handleSearch}>
            <label htmlFor="procedures-search-input">Tên thủ tục hoặc nhu cầu của bạn</label>
            <div>
              <MagnifyingGlass size={22} aria-hidden="true" />
              <Input id="procedures-search-input" type="search" value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="Ví dụ: đăng ký khai sinh" className="min-h-14 pl-12 pr-12" />
              {keyword && <button type="button" onClick={() => setKeyword('')} aria-label="Xóa nội dung tìm kiếm"><X size={19} aria-hidden="true" /></button>}
            </div>
            <Button type="submit">Tìm kiếm <ArrowRight size={18} aria-hidden="true" /></Button>
          </form>
        </div>
      </section>

      <section id="danh-sach-thu-tuc" className="procedures-directory" aria-labelledby="procedures-results-title">
        <aside className="procedures-filter" aria-label="Lọc theo lĩnh vực">
          <div className="procedures-filter-heading"><h2>Lĩnh vực</h2><span>{Math.max(0, categories.length - 1)} nhóm</span></div>
          <div className="procedures-filter-list">
            {categories.map((category) => {

              return (
                <button key={category.id} type="button" className={selectedCategory === String(category.id) ? 'is-selected' : ''} aria-pressed={selectedCategory === String(category.id)} onClick={() => updateFilter('category', String(category.id))}>
                  <span>{category.categoryName}</span>
                </button>
              );
            })}
          </div>
        </aside>

        <div className="procedures-results">
          <ProcedureFeedback error={(result.isError && procedureError(result.error)) || (categoryQuery.isError && procedureError(categoryQuery.error)) || ''} retry={() => { void result.refetch(); void categoryQuery.refetch(); }} />
          {(result.isPending || categoryQuery.isPending) && <ListSkeleton />}
          {!result.isPending && !categoryQuery.isPending && <div className="procedures-results-heading">
            <div><p>Kết quả tra cứu</p><h2 ref={resultsHeading} tabIndex={-1} className="scroll-mt-36" id="procedures-results-title" aria-live="polite">{totalCount} thủ tục phù hợp</h2></div>
            {hasFilters && <button type="button" onClick={clearFilters}>Xóa bộ lọc</button>}
          </div>}
          {!result.isPending && !categoryQuery.isPending && hasFilters && <div className="mt-3 flex flex-wrap gap-2" aria-label="Bộ lọc đang áp dụng">
            {query && <Button variant="outline" className="h-auto min-h-11 max-w-full px-3 text-left" onClick={() => updateFilter('q', '')} aria-label="Bỏ bộ lọc từ khóa"><span className="break-all">Từ khóa: {query}</span><X className="shrink-0" aria-hidden="true" /></Button>}
            {selectedCategory !== '0' && <Button variant="outline" className="min-h-11 px-3" onClick={() => updateFilter('category', '')} aria-label="Bỏ bộ lọc lĩnh vực">{categories.find(c => String(c.id) === selectedCategory)?.categoryName ?? 'Danh mục'}<X aria-hidden="true" /></Button>}
          </div>}

          {!result.isPending && !result.isError && visibleProcedures.length > 0 ? (
            <>
              <p className="mt-4 text-sm text-slate-600" role="status">Hiển thị {startIndex + 1}–{Math.min(startIndex + PAGE_SIZE, totalCount)} / {totalCount} thủ tục · Trang {currentPage}/{totalPages}</p>
              <ul className="procedures-list">
                {visibleProcedures.map((procedure, index) => (
                  <li key={procedure.id}>
                    <Link to={'/thu-tuc/' + procedure.id + (searchParams.size ? '?' + searchParams.toString() : '')} className="procedure-result-row" aria-label={'Xem ' + procedure.title}>
                      <span className="procedure-result-number">{String(startIndex + index + 1).padStart(2, '0')}</span>
                      <span className="procedure-result-copy"><small>{procedure.categoryName}</small><strong>{procedure.title}</strong><span className="mt-1 block text-sm leading-6 text-slate-600">{procedure.processingTimeSummary} · {procedure.feeSummary}</span></span>
                      <span className="procedure-result-action"><span className="hidden sm:inline">Xem hướng dẫn</span><ArrowRight size={18} aria-hidden="true" /></span>
                    </Link>
                  </li>
                ))}
              </ul>
              <nav aria-label="Phân trang thủ tục" className="mt-6 flex flex-wrap items-center justify-center gap-2">
                <Button variant="outline" className="min-h-11 px-3" disabled={!result.data?.hasPrevious} onClick={() => changePage(currentPage - 1)} aria-label="Trang trước"><CaretLeft aria-hidden="true" /><span className="hidden sm:inline">Trước</span></Button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, index) => Math.max(1, Math.min(currentPage - 2, totalPages - 4)) + index).map((page) => (
                  <Button key={page} variant={page === currentPage ? 'primary' : 'outline'} className="min-h-11 min-w-11 px-3" aria-label={'Trang ' + page} aria-current={page === currentPage ? 'page' : undefined} onClick={() => changePage(page)}>{page}</Button>
                ))}
                <Button variant="outline" className="min-h-11 px-3" disabled={!result.data?.hasNext} onClick={() => changePage(currentPage + 1)} aria-label="Trang sau"><span className="hidden sm:inline">Sau</span><CaretRight aria-hidden="true" /></Button>
              </nav>
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
