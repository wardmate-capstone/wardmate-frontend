import { ProcedureFeedback } from '@/components/ui/ProcedureFeedback';
import { useProcedureCategories } from '@/hooks/useProcedureCategories';
import { procedureError } from '@/lib/api/procedures';
import { ProcedureApiList } from '@/pages/procedure-manager/ProcedureApiList';

export function AdminProceduresView() {
  const categories = useProcedureCategories();

  return (
    <div className="space-y-5">
      <div className="admin-page-heading">
        <div>
          <h1>Danh sách thủ tục hành chính</h1>
          <p>Danh mục thủ tục đang có trên hệ thống. Chế độ chỉ xem; chỉnh sửa tại phân hệ Quản lý thủ tục.</p>
        </div>
      </div>
      <ProcedureFeedback
        error={categories.error ? procedureError(categories.error) : undefined}
        retry={() => { void categories.refetch(); }}
      />
      <ProcedureApiList categories={categories.data ?? []} />
    </div>
  );
}
