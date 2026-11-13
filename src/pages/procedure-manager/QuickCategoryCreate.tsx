import { useState, useSyncExternalStore } from 'react';
import { Plus } from '@phosphor-icons/react';
import { Button, Input, Modal } from '@/components/ui';
import { ProcedureFeedback } from '@/components/ui/ProcedureFeedback';
import { toast } from '@/components/ui/Toast';
import { procedureApi, procedureError, type Category } from '@/lib/api/procedures';
import { useAuthStore } from '@/stores/authStore';

/**
 * Danh mục vừa tạo nhanh trong phiên làm việc.
 * Danh sách danh mục được trang cha tải một lần; giữ thêm ở đây để form soạn thủ tục mở lại
 * (bản nháp khác, hộp chỉnh sửa) vẫn thấy danh mục mới mà không cần tải lại trang.
 */
let created: Category[] = [];
const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };
const addCreated = (category: Category) => {
  created = [...created.filter(c => c.id !== category.id), category];
  listeners.forEach(listener => listener());
};

/** Gộp danh mục từ trang cha với danh mục vừa tạo nhanh (không trùng id) */
export function useMergedCategories(categories: Category[]) {
  const extra = useSyncExternalStore(subscribe, () => created);
  return [...categories, ...extra.filter(c => !categories.some(x => x.id === c.id))];
}

/** Nút "Tạo danh mục" đặt cạnh ô chọn danh mục; chỉ hiện khi có quyền quản lý danh mục */
export function QuickCategoryCreate({ onCreated, disabled }: { onCreated: (category: Category) => void; disabled?: boolean }) {
  const canManage = useAuthStore(state => state.user?.permissions.includes('procedure.categories.manage') ?? false);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  if (!canManage) return null;

  const submit = async () => {
    const categoryName = name.trim();
    if (!categoryName) { setError('Tên danh mục không được để trống.'); return; }
    setBusy(true);
    setError('');
    try {
      const category = await procedureApi.createCategory({ categoryName, description: description.trim() || null });
      addCreated(category);
      onCreated(category);
      setOpen(false);
      toast.success(`Đã tạo danh mục "${category.categoryName}" và chọn cho thủ tục.`);
    } catch (e) {
      setError(procedureError(e));
    } finally {
      setBusy(false);
    }
  };

  return <>
    <button
      type="button"
      disabled={disabled}
      onClick={() => { setName(''); setDescription(''); setError(''); setOpen(true); }}
      className="inline-flex min-h-8 items-center gap-1 rounded-md px-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 hover:text-red-800 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-800 focus-visible:ring-offset-2"
    >
      <Plus size={14} weight="bold" aria-hidden="true" />
      Tạo danh mục
    </button>
    <Modal
      open={open}
      onOpenChange={next => { if (!busy) setOpen(next); }}
      title="Tạo danh mục mới"
      description="Danh mục mới được thêm vào danh sách chung và chọn ngay cho thủ tục đang soạn."
      footer={<>
        <Button variant="outline" disabled={busy} onClick={() => setOpen(false)}>Hủy</Button>
        <Button loading={busy} onClick={() => void submit()}>Tạo và chọn</Button>
      </>}
    >
      {/* form riêng để Enter gửi mà không gửi form soạn thủ tục bên ngoài */}
      <form className="space-y-4" noValidate onSubmit={event => { event.preventDefault(); event.stopPropagation(); void submit(); }}>
        <Input label="Tên danh mục" required autoFocus maxLength={255} placeholder="Ví dụ: Bảo hiểm xã hội" value={name} disabled={busy} onChange={event => { setName(event.target.value); setError(''); }} />
        <Input label="Mô tả (không bắt buộc)" maxLength={1000} value={description} disabled={busy} onChange={event => setDescription(event.target.value)} />
        <ProcedureFeedback error={error} />
      </form>
    </Modal>
  </>;
}
