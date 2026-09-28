import { type FormEvent, useRef } from 'react';
import { ArrowRight, CaretLeft, CaretRight, House, MagnifyingGlass, X } from '@phosphor-icons/react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button, Input, Badge } from '@/components/ui';
import { mockPublicProcedures } from '@/data/mockPublicProcedures';

const categories = ['Tất cả', ...new Set(mockPublicProcedures.map((item) => item.category))];
const PAGE_SIZE = 5;

function normalizeVietnamese(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().trim().replace(/\s+/g, ' ');
}

export function ProceduresPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const resultsHeading = useRef<HTMLHeadingElement>(null);
  const query = searchParams.get('q') ?? '';
  const selectedCategory = categories.includes(searchParams.get('category') ?? '') ? searchParams.get('category')! : 'Tất cả';
  const words = normalizeVietnamese(query).split(' ').filter(Boolean);
  const filteredProcedures = mockPublicProcedures.filter((procedure) =>
    (selectedCategory === 'Tất cả' || procedure.category === selectedCategory) &&
    words.every((word) => normalizeVietnamese(procedure.title + ' ' + procedure.category).includes(word)),
  );
  const totalPages = Math.max(1, Math.ceil(filteredProcedures.length / PAGE_SIZE));
  const requestedPage = Number(searchParams.get('page') ?? 1);
  const currentPage = Number.isSafeInteger(requestedPage) ? Math.min(Math.max(requestedPage, 1), totalPages) : 1;
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const visibleProcedures = filteredProcedures.slice(startIndex, startIndex + PAGE_SIZE);
  const hasFilters = Boolean(query || selectedCategory !== 'Tất cả');

  function updateFilter(key: 'q' | 'category', value: string) {
    const next = new URLSearchParams(searchParams);
    if (value && value !== 'Tất cả') next.set(key, value);
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
              <Input id="procedures-search-input" type="search" value={query} onChange={(event) => updateFilter('q', event.target.value)} placeholder="Ví dụ: đăng ký khai sinh" className="min-h-14 pl-12 pr-12" />
              {query && <button type="button" onClick={() => updateFilter('q', '')} aria-label="Xóa nội dung tìm kiếm"><X size={19} aria-hidden="true" /></button>}
            </div>
            <Button type="submit">Tìm kiếm <ArrowRight size={18} aria-hidden="true" /></Button>
          </form>
        </div>
      </section>

      <section id="danh-sach-thu-tuc" className="procedures-directory" aria-labelledby="procedures-results-title">
        <aside className="procedures-filter" aria-label="Lọc theo lĩnh vực">
          <div className="procedures-filter-heading"><h2>Lĩnh vực</h2><span>{categories.length - 1} nhóm</span></div>
          <div className="procedures-filter-list">
            {categories.map((category) => {
              const count = category === 'Tất cả' ? mockPublicProcedures.length : mockPublicProcedures.filter((item) => item.category === category).length;
              return (
                <button key={category} type="button" className={selectedCategory === category ? 'is-selected' : ''} aria-pressed={selectedCategory === category} onClick={() => updateFilter('category', category)}>
                  <span>{category}</span><small>{count}</small>
                </button>
              );
            })}
          </div>
        </aside>

        <div className="procedures-results">
          <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
            <Badge variant="warning">Dữ liệu minh họa</Badge>
            <p className="mt-2">Danh mục dùng để trải nghiệm giao diện, chưa phải thông tin thủ tục chính thức. Cơ quan tiếp nhận và mức hỗ trợ sẽ được xác nhận khi có dữ liệu chính thức.</p>
          </div>
          <div className="procedures-results-heading">
            <div><p>Kết quả tra cứu</p><h2 ref={resultsHeading} tabIndex={-1} className="scroll-mt-36" id="procedures-results-title" aria-live="polite">{filteredProcedures.length} thủ tục phù hợp</h2></div>
            {hasFilters && <button type="button" onClick={clearFilters}>Xóa bộ lọc</button>}
          </div>
          {hasFilters && <div className="mt-3 flex flex-wrap gap-2" aria-label="Bộ lọc đang áp dụng">
            {query && <Button variant="outline" className="h-auto min-h-11 max-w-full px-3 text-left" onClick={() => updateFilter('q', '')} aria-label="Bỏ bộ lọc từ khóa"><span className="break-all">Từ khóa: {query}</span><X className="shrink-0" aria-hidden="true" /></Button>}
            {selectedCategory !== 'Tất cả' && <Button variant="outline" className="min-h-11 px-3" onClick={() => updateFilter('category', '')} aria-label="Bỏ bộ lọc lĩnh vực">{selectedCategory}<X aria-hidden="true" /></Button>}
          </div>}

          {filteredProcedures.length > 0 ? (
            <>
              <p className="mt-4 text-sm text-slate-600" role="status">Hiển thị {startIndex + 1}–{Math.min(startIndex + PAGE_SIZE, filteredProcedures.length)} / {filteredProcedures.length} thủ tục · Trang {currentPage}/{totalPages}</p>
              <ul className="procedures-list">
                {visibleProcedures.map((procedure, index) => (
                  <li key={procedure.id}>
                    <Link to={'/thu-tuc/' + procedure.id + (searchParams.size ? '?' + searchParams.toString() : '')} className="procedure-result-row" aria-label={'Xem ' + procedure.title}>
                      <span className="procedure-result-number">{String(startIndex + index + 1).padStart(2, '0')}</span>
                      <span className="procedure-result-copy"><small>{procedure.category}</small><strong>{procedure.title}</strong><span className="mt-1 block text-sm leading-6 text-slate-600">{procedure.description}</span></span>
                      <span className="procedure-result-action"><span className="hidden sm:inline">Xem hướng dẫn</span><ArrowRight size={18} aria-hidden="true" /></span>
                    </Link>
                  </li>
                ))}
              </ul>
              <nav aria-label="Phân trang thủ tục" className="mt-6 flex flex-wrap items-center justify-center gap-2">
                <Button variant="outline" className="min-h-11 px-3" disabled={currentPage === 1} onClick={() => changePage(currentPage - 1)} aria-label="Trang trước"><CaretLeft aria-hidden="true" /><span className="hidden sm:inline">Trước</span></Button>
                {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                  <Button key={page} variant={page === currentPage ? 'primary' : 'outline'} className="min-h-11 min-w-11 px-3" aria-label={'Trang ' + page} aria-current={page === currentPage ? 'page' : undefined} onClick={() => changePage(page)}>{page}</Button>
                ))}
                <Button variant="outline" className="min-h-11 px-3" disabled={currentPage === totalPages} onClick={() => changePage(currentPage + 1)} aria-label="Trang sau"><span className="hidden sm:inline">Sau</span><CaretRight aria-hidden="true" /></Button>
              </nav>
            </>
          ) : (
            <div className="procedures-empty" role="status">
              <span><MagnifyingGlass size={28} aria-hidden="true" /></span>
              <h2>Chưa tìm thấy thủ tục phù hợp</h2>
              <p>Thử dùng từ khóa ngắn hơn hoặc chọn lại lĩnh vực.</p>
              <button type="button" onClick={clearFilters}>Xem tất cả thủ tục</button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
