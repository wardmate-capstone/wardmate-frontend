import { ProcedureFeedback } from '@/components/ui/ProcedureFeedback';
import { useProcedureCategories } from '@/hooks/useProcedureCategories';
import { procedureError } from '@/lib/api/procedures';
import { ProcedureApiList } from '@/pages/procedure-manager/ProcedureApiList';

export function AdminProceduresView() {
  const categories = useProcedureCategories();

  return (
    <div className="space-y-5">
      <div className="admin-page-heading">
        <h1>Danh sách Thủ tục Hành chính</h1>
        <p className="mt-2 text-sm text-slate-600">Chỉ xem danh sách thủ tục.</p>
      </div>
      <ProcedureFeedback
        error={categories.error ? procedureError(categories.error) : undefined}
        retry={() => { void categories.refetch(); }}
      />
      <ProcedureApiList categories={categories.data ?? []} />
    </div>
  );
}
