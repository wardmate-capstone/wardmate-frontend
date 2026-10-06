import { FolderSimple, Info } from '@phosphor-icons/react';
import { type Category } from '@/lib/api/procedures';

interface ProcedureCategoriesViewProps {
  categories: Category[];
}

export function ProcedureCategoriesView({ categories }: ProcedureCategoriesViewProps) {
  return (
    <div className="space-y-5">
      {/* Header & Notice */}
      <div className="admin-card p-5 space-y-2 border-l-4 border-l-amber-500">
        <div className="flex items-start gap-3">
          <Info size={20} className="text-amber-600 shrink-0 mt-0.5" weight="fill" />
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-slate-900">Danh mục lĩnh vực thủ tục hành chính</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Dữ liệu được đồng bộ trực tiếp từ hệ thống Backend Catalog. Hiện tại Backend chỉ cung cấp API tra cứu danh mục, các thao tác thêm, sửa hoặc xóa danh mục sẽ được cập nhật khi có phiên bản API mới.
            </p>
          </div>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="admin-card p-5 space-y-3 transition-all hover:border-red-200 hover:shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div className="grid size-10 place-items-center rounded-xl bg-red-50 text-red-800">
                <FolderSimple size={22} weight="duotone" />
              </div>
              <span className="font-mono text-xs font-bold text-slate-400">
                #{cat.id}
              </span>
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-slate-900 line-clamp-1">{cat.categoryName}</h3>
              <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                {cat.description || 'Chưa có mô tả chi tiết cho lĩnh vực này.'}
              </p>
            </div>
          </div>
        ))}

        {!categories.length && (
          <div className="col-span-full py-12 text-center text-sm text-slate-500 admin-card">
            Chưa có danh mục nào được ghi nhận trên máy chủ.
          </div>
        )}
      </div>
    </div>
  );
}
