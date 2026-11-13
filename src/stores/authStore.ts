import { create } from 'zustand';
import type { UserProfileDto } from '@/types/profile';

export type CurrentUser = {
  id: string;
  username: string;
  email: string;
  profile: UserProfileDto | null;
  roles: string[];
  permissions: string[];
  wardId?: string | null;
  /** Lĩnh vực được Manager gán cho cán bộ; rỗng nghĩa là phụ trách mọi lĩnh vực (ưu tiên mềm, không phải phân quyền). */
  assignedCategories?: number[];
  /** Đường dẫn ảnh đại diện (tương đối, cần Bearer token); null = chưa có ảnh, hiện chữ cái đầu */
  avatarUrl?: string | null;
};

// Session metadata only; refresh cookies stay HttpOnly and access tokens stay in the client RAM.
export const useAuthStore = create<{
  status: 'restoring' | 'authenticated' | 'anonymous' | 'error';
  user: CurrentUser | null;
  error: string | null;
  expired: boolean;
}>(() => ({ status: 'restoring', user: null, error: null, expired: false }));
