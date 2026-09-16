import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return <div className="py-16 text-center"><p className="font-semibold text-brand">404</p><h1 className="mt-3 text-3xl font-bold">Không tìm thấy trang</h1><Link to="/" className="mt-6 inline-block text-brand underline">Về trang chủ</Link></div>;
}
