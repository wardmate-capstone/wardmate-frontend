import { useCallback } from 'react';
import { Files, FileDashed, Prohibit, WarningCircle, ArrowRight } from '@phosphor-icons/react';
import { procedureApi, type ProcedureSummary } from '@/lib/api/procedures';
import { useProcedureQuery } from '@/hooks/useProcedureQuery';
import { ProcedureFeedback } from '@/components/ui/ProcedureFeedback';
import { ListSkeleton } from '@/components/ui';
import type { ProcedureNavSection } from '@/components/layout/RoleWorkspaceSidebars';

interface ProcedureDashboardViewProps {
  stats?: { active: number; inactive: number };
  statsLoading?: boolean;
  onNavigateSection: (section: ProcedureNavSection) => void;
  onOpenDrafts: () => void;
  onSelectProcedure: (procedure: ProcedureSummary) => void;
}

export function ProcedureDashboardView({ stats, statsLoading = false, onNavigateSection, onOpenDrafts, onSelectProcedure }: ProcedureDashboardViewProps) {
  const recent = useProcedureQuery(useCallback((signal: AbortSignal) => procedureApi.list({ pageSize: 4, sortBy: 'UpdatedAt', isAscending: false }, true, signal), []));
  const cards = [
    { label: 'Đang công khai', value: stats?.active, icon: Files, color: 'bg-emerald-100 text-emerald-800', open: () => onNavigateSection('procedures') },
    { label: 'Bản nháp', icon: FileDashed, color: 'bg-amber-100 text-amber-800', open: onOpenDrafts },
    { label: 'Tạm ngừng', value: stats?.inactive, icon: Prohibit, color: 'bg-rose-100 text-rose-800', open: () => onNavigateSection('procedures') },
  ];
  return <div className="space-y-5">
    <section aria-label="Các chỉ số tổng quan" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {cards.map(({ label, value, icon: Icon, color, open }) => <button key={label} type="button" onClick={open} className="admin-stat-card cursor-pointer text-left hover:border-red-200">
        <div className="flex items-center justify-between"><small className="text-xs font-bold text-slate-500">{label}</small><div className={`grid size-9 place-items-center rounded-xl ${color}`}><Icon size={18} weight="duotone" /></div></div>
        {statsLoading && value === undefined ? (
          <div className="mt-3 h-9 w-24 animate-pulse rounded-lg bg-slate-200/70" />
        ) : (
          <p className={`mt-3 font-bold ${value === undefined ? 'text-sm text-slate-500' : 'text-3xl text-slate-950'}`}>{value ?? 'Chưa có dữ liệu'}</p>
        )}
      </button>)}
    </section>
    <section className="rounded-xl border border-amber-200 bg-amber-50/40 p-5">
      <h2 className="flex items-center gap-2.5 text-base font-bold text-slate-950"><WarningCircle size={24} className="text-amber-700" />Hạng mục cần chú ý hoàn thiện</h2>
      <div className="mt-5 grid gap-4 md:grid-cols-3">
        {['Thủ tục chưa có biểu mẫu', 'Biểu mẫu cần cập nhật', 'Chưa đủ giấy tờ'].map(label => <div key={label} className="rounded-xl border border-amber-200/80 bg-white p-4 shadow-sm"><h3 className="text-xs font-bold text-slate-800">{label}</h3><p className="mt-3 text-sm text-slate-500">Chưa có dữ liệu thống kê.</p></div>)}
      </div>
    </section>
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="admin-card min-w-0 p-6">
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-4"><h2 className="text-base font-bold">Thủ tục cập nhật gần đây</h2><button type="button" onClick={() => onNavigateSection('procedures')} className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-red-800 hover:underline">Xem tất cả<ArrowRight size={14} /></button></div>
        <ProcedureFeedback error={recent.error} retry={recent.refresh} />
        {recent.loading && <div className="mt-4"><ListSkeleton rows={4} /></div>}
        <div className="mt-4 divide-y divide-slate-100">{recent.data?.items.map(proc => <button type="button" key={proc.id} onClick={() => onSelectProcedure(proc)} className="block w-full py-3.5 text-left hover:bg-slate-50">
          <div className="flex flex-wrap gap-2 text-xs"><strong>{proc.procedureCode}</strong><span>{proc.isActive ? 'Đang công khai' : 'Ngừng công khai'}</span></div>
          <h3 className="mt-1 break-words text-sm font-bold">{proc.title}</h3><p className="mt-1 text-xs text-slate-500">{proc.categoryName} · {new Date(proc.updatedAt).toLocaleDateString('vi-VN')}</p>
        </button>)}</div>
        {recent.data?.items.length === 0 && <p className="mt-4 text-sm text-slate-500">Chưa có thủ tục.</p>}
      </section>
      <section className="space-y-6">{[{ title: 'Biểu mẫu cập nhật gần đây', section: 'forms' as const }, { title: 'Văn bản pháp lý làm căn cứ', section: 'legal-docs' as const }].map(item => <div key={item.title} className="admin-card p-6"><h2 className="border-b border-slate-100 pb-4 text-base font-bold">{item.title}</h2><p className="my-4 text-sm text-slate-500">Chưa có dữ liệu tổng hợp.</p><button type="button" onClick={() => onNavigateSection(item.section)} className="text-xs font-bold text-red-800 hover:underline">{item.section === 'forms' ? 'Xem kho mẫu' : 'Xem tất cả'}</button></div>)}</section>
    </div>
  </div>;
}
