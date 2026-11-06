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
    // S\u1eafp x\u1ebfp theo m\u00e3 t\u0103ng d\u1ea7n \u0111\u1ec3 danh s\u00e1ch \u1ed5n \u0111\u1ecbnh, d\u1ec5 d\u00f2
    const sorted = [...categories].sort((a, b) => a.id - b.id);
    if (!keyword) return sorted;
    return sorted.filter((category) =>
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="relative block w-full sm:max-w-md">
          <span className="sr-only">Tìm danh mục</span>
          <MagnifyingGlass size={18} aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tìm theo tên hoặc mô tả..."
            className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-red-700 focus:ring-2 focus:ring-red-100"
          />
        </label>
        <p className="text-sm text-slate-500" aria-live="polite">
          {search.trim()
            ? <><span className="font-semibold text-slate-900">{visibleCategories.length}</span> / {categories.length} danh mục</>
            : <><span className="font-semibold text-slate-900">{categories.length}</span> danh mục</>}
        </p>
        {canManage && <Button className="h-11 min-h-0 shrink-0 gap-1.5 px-4 sm:ml-auto" onClick={() => open(null)}>
          <Plus size={18} weight="bold" aria-hidden /> Thêm danh mục
        </Button>}
      </div>

      {/* Bảng danh mục */}
      <section className="admin-card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <caption className="sr-only">Danh sách danh mục thủ tục</caption>
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th scope="col" className="w-20 px-4 py-3">Mã</th>
                <th scope="col" className="px-4 py-3">Tên danh mục</th>
                <th scope="col" className="px-4 py-3">Mô tả</th>
                {canManage && <th scope="col" className="w-28 px-4 py-3 text-right"><span className="sr-only">Thao tác</span></th>}
              </tr>
            </thead>
            <tbody>
              {visibleCategories.map((cat) => (
                <tr key={cat.id} className="border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50/70">
                  <td className="px-4 py-3">
                    <span className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-xs font-semibold text-slate-500">#{cat.id}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-red-50 text-red-800">
                        <FolderSimple size={17} weight="duotone" aria-hidden />
                      </span>
                      <span className="font-semibold text-slate-900">{cat.categoryName}</span>
                    </div>
                  </td>
                  <td className="max-w-md px-4 py-3">
                    {cat.description
                      ? <p className="line-clamp-2 text-slate-600">{cat.description}</p>
                      : <p className="italic text-slate-400">Chưa có mô tả</p>}
                  </td>
                  {canManage && <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        aria-label="Chỉnh sửa"
                        title="Chỉnh sửa"
                        className="grid size-9 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-100"
                        onClick={() => open(cat)}
                      >
                        <PencilSimple size={18} aria-hidden />
                      </button>
                      <button
                        type="button"
                        aria-label="Xóa"
                        title="Xóa"
                        className="grid size-9 place-items-center rounded-lg text-slate-500 transition hover:bg-red-50 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-100"
                        onClick={() => {
                          setDeleting(cat);
                          setDeleteError('');
                        }}
                      >
                        <Trash size={18} aria-hidden />
                      </button>
                    </div>
                  </td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!categories.length && (
          <p className="py-12 text-center text-sm text-slate-500">Chưa có danh mục thủ tục.</p>
        )}
        {!!categories.length && !visibleCategories.length && (
          <p className="py-12 text-center text-sm text-slate-500">Không tìm thấy danh mục phù hợp.</p>
        )}
      </section>

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
