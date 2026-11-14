import axios from 'axios';
import { z } from 'zod';
import { api, authErrorMessage } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';

/**
 * Ảnh đại diện (IAM, PROFILE-AVATAR-01).
 * Ảnh cần Bearer token nên không dùng thẳng <img src>: tải bằng axios (có token) rồi tạo object URL.
 * URL có tham số `v` đổi mỗi lần đổi ảnh, nên có thể cache theo URL mà không lo ảnh cũ.
 */

/** Định dạng ảnh server nhận; HEIC/HEIF là ảnh chụp từ iPhone */
export const AVATAR_ACCEPT = 'image/jpeg,image/png,image/webp,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.heic,.heif';
export const AVATAR_MAX_BYTES = 10 * 1024 * 1024;
export function avatarErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (['iam.avatar_too_large', 'iam.image_unsupported', 'iam.image_unreadable'].includes(data?.code) && typeof data?.title === 'string' && data.title.trim()) return data.title;
  }
  return authErrorMessage(error);
}

const avatarPathSchema = z.string().regex(/^\/api\/v1\/users\/[A-Za-z0-9/-]+(?:\?v=[A-Za-z0-9._-]+)?$/);
const avatarResultSchema = z.object({ avatarUrl: avatarPathSchema, updatedAt: z.string().optional() });
let avatarSession = 0;
function captureAvatarSession() {
  const expected = avatarSession;
  const owner = useAuthStore.getState().user?.id;
  if (!owner || useAuthStore.getState().status !== 'authenticated') throw new axios.CanceledError('Phiên đăng nhập đã thay đổi.');
  return () => {
    if (expected !== avatarSession || useAuthStore.getState().status !== 'authenticated' || useAuthStore.getState().user?.id !== owner) throw new axios.CanceledError('Phiên đăng nhập đã thay đổi.');
  };
}

/** Kiểm tra nhanh phía trình duyệt trước khi gửi; server vẫn kiểm tra lại */
export function validateAvatarFile(file: File): string | undefined {
  if (file.size === 0) return 'Tệp ảnh rỗng. Vui lòng chọn ảnh khác.';
  if (file.size > AVATAR_MAX_BYTES) return 'Ảnh lớn hơn 10 MB. Vui lòng chọn ảnh nhỏ hơn.';
  const name = file.name.toLowerCase();
  const okType = /^image\/(jpeg|png|webp|heic|heif)$/.test(file.type);
  const okExt = /\.(jpe?g|png|webp|heic|heif)$/.test(name);
  // Một số trình duyệt không nhận diện MIME của HEIC (type rỗng) nên chấp nhận theo đuôi tệp
  if (!okType && !okExt) return 'Định dạng ảnh chưa hỗ trợ. Vui lòng chọn ảnh JPEG, PNG, WebP hoặc HEIC.';
  return undefined;
}

function setMyAvatarUrl(avatarUrl: string | null) {
  const user = useAuthStore.getState().user;
  if (user) useAuthStore.setState({ user: { ...user, avatarUrl } });
}

/** Tải lên hoặc đổi ảnh đại diện của chính mình; server tự cắt vuông 512×512 và xóa thông tin GPS */
export async function uploadMyAvatar(file: File): Promise<string> {
  const assertCurrent = captureAvatarSession();
  const invalid = validateAvatarFile(file);
  if (invalid) throw new Error(invalid);
  const form = new FormData();
  form.append('file', file);
  const { data, status } = await api.put('/api/v1/users/me/avatar', form);
  assertCurrent();
  if (status !== 200) throw new Error('Chưa xác nhận được ảnh đã lưu. Vui lòng tải lại hồ sơ.');
  const parsed = avatarResultSchema.parse(data);
  setMyAvatarUrl(parsed.avatarUrl);
  return parsed.avatarUrl;
}

/** Xóa ảnh đại diện, quay về chữ cái đầu (server luôn trả 204) */
export async function deleteMyAvatar(): Promise<void> {
  const assertCurrent = captureAvatarSession();
  const response = await api.delete('/api/v1/users/me/avatar');
  assertCurrent();
  if (response.status !== 204) throw new Error('Chưa xác nhận được ảnh đã xóa. Vui lòng tải lại hồ sơ.');
  setMyAvatarUrl(null);
}

// Bộ nhớ đệm object URL theo đường dẫn ảnh, dùng chung cho mọi nơi hiển thị trong phiên
const cache = new Map<string, Promise<string | null>>();

/** Tải ảnh theo đường dẫn; 404 (chưa có ảnh / không được xem) trả null để hiện ảnh mặc định */
export function loadAvatarObjectUrl(url: string): Promise<string | null> {
  avatarPathSchema.parse(url);
  const assertCurrent = captureAvatarSession();
  const hit = cache.get(url);
  if (hit) return hit;
  const pending = api
    .get<Blob>(url, { responseType: 'blob' })
    .then(({ data }) => {
      assertCurrent();
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(data.type.split(';')[0]) || data.size > AVATAR_MAX_BYTES) throw new Error('Ảnh đại diện chưa hợp lệ.');
      return URL.createObjectURL(data);
    })
    .catch((error: unknown) => {
      cache.delete(url);
      if (axios.isAxiosError(error) && error.response?.status === 404) return null;
      throw error;
    });
  cache.set(url, pending);
  return pending;
}

/** Giải phóng bộ nhớ ảnh khi đăng xuất hoặc đổi tài khoản */
export function clearAvatarCache() {
  for (const pending of cache.values()) {
    void pending.then((objectUrl) => objectUrl && URL.revokeObjectURL(objectUrl)).catch(() => undefined);
  }
  cache.clear();
}

// Đổi tài khoản hoặc đăng xuất: bỏ ảnh của người trước khỏi bộ nhớ
useAuthStore.subscribe((state, prev) => {
  if (state.user?.id !== prev.user?.id || state.status !== prev.status) { avatarSession++; clearAvatarCache(); }
});
