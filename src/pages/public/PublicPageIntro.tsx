import type { ReactNode } from 'react';
import { CaretRight } from '@phosphor-icons/react';
import { Link } from 'react-router-dom';
import '@/styles/public-pages.css';

export function PublicPageIntro({ id, label, title, description, children, aside }: {
  id: string;
  label: string;
  title: string;
  description: string;
  children?: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <section className="public-masthead" aria-labelledby={id}>
      <div className="public-shell">
        <nav aria-label="Đường dẫn trang" className="public-breadcrumb">
          <Link to="/">Trang chủ</Link>
          <CaretRight size={13} aria-hidden="true" />
          <span aria-current="page">{label}</span>
        </nav>
        <div className={aside ? 'public-masthead-grid' : undefined}>
          <div className="public-masthead-copy">
            <h1 id={id}>{title}</h1>
            <p>{description}</p>
            {children}
          </div>
          {aside}
        </div>
      </div>
    </section>
  );
}
