import { FormEvent, useMemo, useState } from 'react';
import {
  ArrowRight,
  CaretRight,
  House,
  MagnifyingGlass,
  X,
} from '@phosphor-icons/react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { popularProcedures } from '@/data/landing';

const categories = ['Tất cả', 'Hộ tịch', 'Chứng thực', 'Chính sách xã hội'] as const;

function normalizeVietnamese(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();
}

export function ProceduresPage() {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<(typeof categories)[number]>('Tất cả');

  const filteredProcedures = useMemo(() => {
    const normalizedQuery = normalizeVietnamese(query.trim());
    return popularProcedures.filter((procedure) => {
      const matchesCategory = selectedCategory === 'Tất cả' || procedure.category === selectedCategory;
      const matchesQuery = !normalizedQuery || normalizeVietnamese(`${procedure.title} ${procedure.category}`).includes(normalizedQuery);
      return matchesCategory && matchesQuery;
    });
  }, [query, selectedCategory]);

  function clearFilters() {
    setQuery('');
    setSelectedCategory('Tất cả');
  }

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    document.querySelector('#danh-sach-thu-tuc')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
         </div>
          <form className="procedures-search" role="search" onSubmit={handleSearch}>
            <label htmlFor="procedures-search-input">Tên thủ tục hoặc nhu cầu của bạn</label>
            <div>
              <MagnifyingGlass size={22} aria-hidden="true" />
              <input id="procedures-search-input" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ví dụ: đăng ký khai sinh" />
              {query && <button type="button" onClick={() => setQuery('')} aria-label="Xóa nội dung tìm kiếm"><X size={19} aria-hidden="true" /></button>}
            </div>
            <button type="submit">Tìm kiếm <ArrowRight size={18} aria-hidden="true" /></button>
          </form>
        </div>
      </section>

      <section id="danh-sach-thu-tuc" className="procedures-directory" aria-labelledby="procedures-results-title">
        <aside className="procedures-filter" aria-label="Lọc theo lĩnh vực">
          <div className="procedures-filter-heading"><h2>Lĩnh vực</h2><span>{categories.length - 1} nhóm</span></div>
          <div className="procedures-filter-list">
            {categories.map((category) => {
              const count = category === 'Tất cả' ? popularProcedures.length : popularProcedures.filter((item) => item.category === category).length;
              return (
                <button key={category} type="button" className={selectedCategory === category ? 'is-selected' : ''} aria-pressed={selectedCategory === category} onClick={() => setSelectedCategory(category)}>
                  <span>{category}</span><small>{count}</small>
                </button>
              );
            })}
          </div>
        </aside>

        <div className="procedures-results">
          <div className="procedures-results-heading">
            <div><p>Kết quả tra cứu</p><h2 id="procedures-results-title" aria-live="polite">{filteredProcedures.length} thủ tục phù hợp</h2></div>
            {(query || selectedCategory !== 'Tất cả') && <button type="button" onClick={clearFilters}>Xóa bộ lọc</button>}
          </div>

          {filteredProcedures.length > 0 ? (
            <ul className="procedures-list">
              {filteredProcedures.map((procedure, index) => (
                <li key={procedure.title}>
                  <button type="button" className="procedure-result-row" onClick={() => toast.info(`Hướng dẫn “${procedure.title}” sẽ được mở ở trang chi tiết thủ tục.`)} aria-label={`Xem ${procedure.title}`}>
                    <span className="procedure-result-number">{String(index + 1).padStart(2, '0')}</span>
                    <span className="procedure-result-copy"><small>{procedure.category}</small><strong>{procedure.title}</strong></span>
                    <span className="procedure-result-action">Xem <ArrowRight size={17} aria-hidden="true" /></span>
                  </button>
                </li>
              ))}
            </ul>
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
