import { useRef, useState } from 'react';
import { Camera, CircleNotch, Trash } from '@phosphor-icons/react';
import { ConfirmDeleteModal, UserAvatar, toast } from '@/components/ui';
import { authErrorMessage } from '@/lib/api';
import { AVATAR_ACCEPT, deleteMyAvatar, uploadMyAvatar, validateAvatarFile } from '@/lib/api/avatar';
import { useAuthStore } from '@/stores/authStore';

/**
 * Ảnh đại diện của chính mình trên trang hồ sơ (PROFILE-AVATAR-01): bấm ảnh để chọn ảnh mới,
 * nút nhỏ bên dưới để xóa. Server tự xoay, cắt vuông và xóa thông tin GPS nên không cần màn cắt ảnh.
 */
export function AvatarEditor({ initials, className }: { initials: string; className?: string }) {
  const avatarUrl = useAuthStore((state) => state.user?.avatarUrl ?? null);
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<'upload' | 'delete' | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const pick = () => input.current?.click();

  const onFile = async (file: File | undefined) => {
    if (input.current) input.current.value = '';
    if (!file) return;
    const invalid = validateAvatarFile(file);
    if (invalid) {
      toast.error(invalid);
      return;
    }
    setBusy('upload');
    try {
      await uploadMyAvatar(file);
      toast.success('Đã cập nhật ảnh đại diện.');
    } catch (error) {
      toast.error(authErrorMessage(error));
    } finally {
      setBusy(null);
    }
  };

  const remove = async () => {
    setBusy('delete');
    try {
      await deleteMyAvatar();
      setConfirmOpen(false);
      toast.success('Đã xóa ảnh đại diện.');
    } catch (error) {
      toast.error(authErrorMessage(error));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex shrink-0 flex-col items-center gap-1.5">
      <button
        type="button"
        onClick={pick}
        disabled={busy !== null}
        title={avatarUrl ? 'Đổi ảnh đại diện' : 'Thêm ảnh đại diện'}
        aria-label={avatarUrl ? 'Đổi ảnh đại diện' : 'Thêm ảnh đại diện'}
        className="group relative rounded-2xl disabled:cursor-wait focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-800 focus-visible:ring-offset-2"
      >
        <UserAvatar
          url={avatarUrl}
          initials={initials}
          className={className ?? 'size-16 rounded-2xl bg-red-900 text-xl font-extrabold text-white shadow-md'}
        />
        {/* Lớp phủ gợi ý bấm để đổi ảnh; luôn hiện biểu tượng máy ảnh nhỏ ở góc */}
        <span className="absolute inset-0 grid place-items-center rounded-2xl bg-slate-900/45 text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
          {busy === 'upload' ? <CircleNotch size={22} className="animate-spin" aria-hidden="true" /> : <Camera size={22} weight="bold" aria-hidden="true" />}
        </span>
        <span className="absolute -bottom-1 -right-1 grid size-6 place-items-center rounded-full border-2 border-white bg-red-700 text-white shadow-sm" aria-hidden="true">
          {busy === 'upload' ? <CircleNotch size={12} className="animate-spin" /> : <Camera size={12} weight="bold" />}
        </span>
      </button>
      <input ref={input} type="file" accept={AVATAR_ACCEPT} className="sr-only" tabIndex={-1} aria-hidden="true" onChange={(e) => void onFile(e.target.files?.[0])} />
      {avatarUrl && (
        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          disabled={busy !== null}
          className="inline-flex min-h-8 items-center gap-1 rounded-md px-1.5 text-[11px] font-semibold text-slate-500 transition-colors hover:bg-red-50 hover:text-red-800 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-800 focus-visible:ring-offset-2"
        >
          <Trash size={12} aria-hidden="true" /> Xóa ảnh
        </button>
      )}
      <ConfirmDeleteModal
        open={confirmOpen}
        onOpenChange={(open) => busy === null && setConfirmOpen(open)}
        title="Xóa ảnh đại diện"
        description="Ảnh đại diện sẽ được thay bằng chữ cái đầu của tên. Bạn có thể tải ảnh mới bất cứ lúc nào."
        confirmLabel="Xóa ảnh"
        loading={busy === 'delete'}
        onConfirm={remove}
      />
    </div>
  );
}
