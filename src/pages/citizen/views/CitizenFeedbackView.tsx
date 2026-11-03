import type { CitizenDossier } from '../types';
import { AnalyticsPagination } from '@/components/analytics/AnalyticsFilters';
import { Button } from '@/components/ui/Button';
import { ListSkeleton } from '@/components/ui/Skeleton';

export function CitizenFeedbackView({ dossiers, onOpenFeedback, loading, error, onRetry, page, total, onPageChange }: { dossiers: CitizenDossier[]; onOpenFeedback: (procedure: string, code?: string) => void; loading: boolean; error: boolean; onRetry: () => void; page: number; total: number; onPageChange: (page: number) => void }) {
  const eligible = dossiers.filter(item => item.id && ['Giấy tờ sẵn sàng', 'Đã tiếp nhận tại quầy'].includes(item.status));
  return <div className="admin-card space-y-5 p-5"><h2 className="font-bold">Đánh giá hỗ trợ tiền kiểm theo hồ sơ</h2><p className="text-sm text-slate-600">Mỗi hồ sơ đánh giá một lần khi giấy tờ đã sẵn sàng. Chọn hồ sơ để xem đánh giá đã gửi hoặc viết đánh giá mới.</p>
    {loading ? <div className="py-2"><ListSkeleton rows={3} /></div> : error ? <div role="alert"><p>Chưa tải được danh sách hồ sơ.</p><Button onClick={onRetry}>Thử lại</Button></div> : eligible.length === 0 ? <p role="status">Chưa có hồ sơ đủ điều kiện đánh giá trong danh sách đã tải.</p> : <ul className="space-y-3">{eligible.map(item => <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-4"><div><p className="font-semibold">{item.procedureName}</p><p className="text-sm text-slate-600">{item.code}</p></div><Button variant="outline" onClick={() => onOpenFeedback(item.procedureName, item.code)}>Xem / gửi đánh giá</Button></li>)}</ul>}
    <AnalyticsPagination page={page} size={50} total={total} onChange={onPageChange} /><p className="text-sm text-slate-500">Hiển thị danh sách đánh giá theo các hồ sơ bạn đã hoàn tất tiền kiểm.</p>
  </div>;
}
