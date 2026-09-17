import { ArrowLeft, MagnifyingGlass as Search } from '@phosphor-icons/react';
import { m } from 'motion/react';
import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <section className="not-found-page" aria-labelledby="not-found-title">
      <div className="not-found-pattern" aria-hidden="true" />
      <div className="not-found-shell">
        <m.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="not-found-copy"
        >
          <p className="section-label">Lạc đường rồi</p>
          <p className="not-found-code" aria-hidden="true">404</p>
          <h1 id="not-found-title">Không tìm thấy trang bạn cần</h1>
          <p>
            Có thể đường dẫn đã thay đổi hoặc không còn tồn tại. Mời bạn quay về trang chủ để tiếp tục hành trình chuẩn bị hồ sơ.
          </p>
          <div className="not-found-actions">
            <Link to="/" className="not-found-primary">
              <ArrowLeft size={19} aria-hidden="true" />
              Về trang chủ
            </Link>
            <Link to="/#thu-tuc" className="not-found-secondary">
              <Search size={19} aria-hidden="true" />
              Tra cứu thủ tục
            </Link>
          </div>
        </m.div>

        <m.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.08 }}
          className="not-found-photo"
        >
          <img
            src="/van-mieu-quoc-tu-giam-1.jpg"
            alt="Khuê Văn Các tại Văn Miếu - Quốc Tử Giám"
          />
        </m.div>
      </div>
    </section>
  );
}
