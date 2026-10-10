import { useMemo, useRef, useState } from 'react';
import { FolderSimple, MagnifyingGlass, PencilSimple, Plus, Trash } from '@phosphor-icons/react';
import { Button, Input, Modal, ConfirmDeleteModal } from '@/components/ui';
import { ProcedureFeedback } from '@/components/ui/ProcedureFeedback';
import { toast } from '@/components/ui/Toast';
import { procedureApi, procedureError, type Category } from '@/lib/api/procedures';
import { useAuthStore } from '@/stores/authStore';

interface ProcedureCategoriesViewProps {
  categories: Category[];
  onChange: () => void;
}

export function ProcedureCategoriesView({ categories, onChange }: ProcedureCategoriesViewProps) {
  const canManage = useAuthStore((state) => state.user?.permissions.includes('procedure.categories.manage') ?? false);
  const [editing, setEditing] = useState<Category | null | undefined>();
  const [deleting, setDeleting] = useState<Category>();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [error, setError] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [search, setSearch] = useState('');
  const lock = useRef(false);
  const visibleCategories = useMemo(() => {
    const keyword = search.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    if (!keyword) return categories;
    return categories.filter((category) =>
      `${category.categoryName} ${category.description ?? ''}`
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .includes(keyword)
    );
  }, [categories, search]);

  const open = (category: Category | null) => {
    setEditing(category);
    setName(category?.categoryName ?? '');
    setDescription(category?.description ?? '');
    setError('');
  };

  const run = async (action: () => Promise<void>) => {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError('');
    try {
      await action();
    } catch (e) {
      setError(procedureError(e));
    } finally {
      setBusy(false);
      lock.current = false;
    }
  };

  const handleDelete = async () => {
    if (!deleting || deleteBusy) return;
    setDeleteBusy(true);
    setDeleteError('');
    try {
      await procedureApi.deleteCategory(deleting.id);
      setDeleting(undefined);
      onChange();
      toast.success('Đã xóa danh mục thành công.');
    } catch (e) {
      const msg = procedureError(e);
      setDeleteError(msg);
      toast.error(msg);
    } finally {
      setDeleteBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="relative block w-full sm:max-w-md">
          <span className="sr-only">Tìm danh mục</span>
          <MagnifyingGlass size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tìm danh mục..."
            className="min-h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-red-500 focus:ring-2 focus:ring-red-100"
          />
        </label>
        {canManage && <Button className="shrink-0" onClick={() => open(null)}>
          <Plus size={18} /> Thêm danh mục
        </Button>}
      </div>

      {/* Categories Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visibleCategories.map((cat) => (
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
            {canManage && <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <Button size="small" variant="outline" className="flex-1" onClick={() => open(cat)}>
                <PencilSimple size={15} /> Chỉnh sửa
              </Button>
              <Button
                size="small"
                variant="ghost"
                className="text-slate-600 hover:bg-red-50 hover:text-red-700"
                onClick={() => {
                  setDeleting(cat);
                  setDeleteError('');
                }}
              >
                <Trash size={15} /> Xóa
              </Button>
            </div>}
          </div>
        ))}

        {!categories.length && (
          <div className="col-span-full py-12 text-center text-sm text-slate-500 admin-card">
            Chưa có danh mục thủ tục.
          </div>
        )}
        {!!categories.length && !visibleCategories.length && (
          <div className="col-span-full py-12 text-center text-sm text-slate-500 admin-card">
            Không tìm thấy danh mục phù hợp.
          </div>
        )}
      </div>

      {/* Modal Thêm / Chỉnh sửa */}
      <Modal
        open={editing !== undefined}
        onOpenChange={(value) => {
          if (!value && !busy) setEditing(undefined);
        }}
        title={editing ? 'Chỉnh sửa danh mục' : 'Thêm danh mục'}
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => setEditing(undefined)}
            >
              Hủy
            </Button>
            <Button
              loading={busy}
              disabled={busy}
              onClick={() =>
                void run(async () => {
                  const input = {
                    categoryName: name.trim(),
                    description: description.trim() || null,
                  };
                  if (!input.categoryName) throw new Error('Tên danh mục không được để trống.');
                  if (editing) await procedureApi.updateCategory(editing.id, input);
                  else await procedureApi.createCategory(input);
                  setEditing(undefined);
                  onChange();
                  toast.success(editing ? 'Đã cập nhật danh mục.' : 'Đã thêm danh mục.');
                })
              }
            >
              Lưu danh mục
            </Button>
          </>
        }
      >
        <ProcedureFeedback error={error} />
        <div className="space-y-4">
          <Input
            label="Tên danh mục"
            value={name}
            disabled={busy}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            label="Mô tả"
            value={description}
            disabled={busy}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
      </Modal>

      {/* Modal Xác nhận Xóa */}
      <ConfirmDeleteModal
        open={!!deleting}
        onOpenChange={(value) => {
          if (!value && !deleteBusy) setDeleting(undefined);
        }}
        title="Xóa danh mục"
        itemName={deleting?.categoryName}
        description="Thao tác này sẽ xóa danh mục nếu không còn thủ tục nào liên kết."
        loading={deleteBusy}
        onConfirm={() => void handleDelete()}
      >
        <ProcedureFeedback error={deleteError} />
      </ConfirmDeleteModal>
    </div>
  );
}
