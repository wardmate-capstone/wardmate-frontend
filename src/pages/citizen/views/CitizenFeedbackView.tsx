import { Star } from '@phosphor-icons/react';
import type { CitizenDossier } from '../types';
import { AnalyticsPagination } from '@/components/analytics/AnalyticsFilters';
import { Button } from '@/components/ui/Button';
import { ListSkeleton } from '@/components/ui/Skeleton';

const PAGE_SIZE = 50;

export function CitizenFeedbackView({ dossiers, onOpenFeedback, loading, error, onRetry, page, total, onPageChange }: { dossiers: CitizenDossier[]; onOpenFeedback: (procedure: string, code?: string) => void; loading: boolean; error: boolean; onRetry: () => void; page: number; total: number; onPageChange: (page: number) => void }) {
  // Chỉ hồ sơ đã được duyệt tiền kiểm mới được đánh giá
  const eligible = dossiers.filter(item => item.id && ['Giấy tờ sẵn sàng', 'Đã tiếp nhận tại quầy'].includes(item.status));
  return <section className="admin-card overflow-hidden">
    <header className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-4">
      <div>
        <h2 className="text-base font-bold text-slate-900">Hồ sơ có thể đánh giá</h2>
        <p className="mt-0.5 text-sm text-slate-500">Mỗi hồ sơ được đánh giá một lần, sau khi giấy tờ đã sẵn sàng.</p>
      </div>
      {!loading && !error && eligible.length > 0 && <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">{eligible.length} hồ sơ</span>}
    </header>

    {loading ? <div className="p-5"><ListSkeleton rows={3} /></div>
      : error ? <div role="alert" className="flex flex-col items-center gap-3 px-5 py-10 text-center text-sm text-slate-600"><p>Chưa tải được danh sách hồ sơ.</p><Button variant="outline" size="small" onClick={onRetry}>Thử lại</Button></div>
      : eligible.length === 0 ? <div role="status" className="flex flex-col items-center gap-2 px-5 py-12 text-center">
          <span className="grid size-12 place-items-center rounded-xl bg-slate-50 text-slate-400"><Star size={24} weight="duotone" aria-hidden /></span>
          <p className="text-sm text-slate-500">Chưa có hồ sơ đủ điều kiện đánh giá trong danh sách đã tải.</p>
        </div>
      : <ul className="divide-y divide-slate-100">
          {eligible.map(item => <li key={item.id} className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-slate-50/70">
            <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-gold-50 text-gold-700"><Star size={20} weight="duotone" aria-hidden /></span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-900">{item.procedureName}</p>
              <p className="mt-0.5 font-mono text-xs text-slate-500">{item.code}</p>
            </div>
            <Button variant="outline" size="small" className="shrink-0" onClick={() => onOpenFeedback(item.procedureName, item.code)}>Xem / gửi đánh giá</Button>
          </li>)}
        </ul>}

    {/* Chỉ hiện phân trang khi số hồ sơ vượt quá một trang tải */}
    {total > PAGE_SIZE && <div className="border-t border-slate-100 px-5 py-3"><AnalyticsPagination page={page} size={PAGE_SIZE} total={total} onChange={onPageChange} /></div>}
  </section>;
}
