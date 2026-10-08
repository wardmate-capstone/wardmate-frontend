import { canAccessWorkspace, type WorkspaceId } from '@/lib/navigationAccess';

const authPaths = new Set(['/dang-nhap', '/dang-ky', '/quen-mat-khau', '/dat-lai-mat-khau']);
const roleHomes: Record<string, string> = {
  IT_ADMIN: '/admin',
  FRONT_DESK_OFFICER: '/officer',
  MANAGER: '/manager',
  PROCEDURE_MANAGER: '/procedure-manager',
  REGISTERED_CITIZEN: '/',
};

export function loginDestination(roles: string[], returnTo?: string | null, permissions: string[] = []): string {
  const destination = safeReturnTo(returnTo);
  if (destination !== '/') return destination;
  // Multiple roles keep the home page's workspace menu rather than guessing a primary role.
  if (roles.length === 1 && roleHomes[roles[0]]) return roleHomes[roles[0]];
  const permissionHomes: Array<[WorkspaceId, string]> = [['admin', '/admin'], ['procedure-manager', '/procedure-manager'], ['citizen', '/citizen']];
  const available = permissionHomes.filter(([workspace]) => canAccessWorkspace(workspace, [], permissions));
  return available.length === 1 ? available[0][1] : '/';
}

/**
 * Trả về trang làm việc quản trị chính đối với các vai trò công vụ chuyên trách.
 * Chỉ áp dụng cho IT_ADMIN, MANAGER, FRONT_DESK_OFFICER.
 * PROCEDURE_MANAGER và REGISTERED_CITIZEN không bị ép buộc rời khỏi cổng công khai.
 */
export function getManagementHome(roles: string[] = [], permissions: string[] = []): string | null {
  if (roles.includes('IT_ADMIN')) return '/admin';
  if (roles.includes('MANAGER')) return '/manager';
  if (roles.includes('FRONT_DESK_OFFICER')) return '/officer';
  if (canAccessWorkspace('admin', [], permissions)) return '/admin';
  if (canAccessWorkspace('procedure-manager', [], permissions)) return '/procedure-manager';
  return null;
}

/** Only allow a local path; reject external URLs and authentication loops. */
export function safeReturnTo(value: string | null | undefined): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || /[\\\r\n]/.test(value)) return '/';
  const parsed = new URL(value, 'https://wardmate.invalid');
  if (parsed.origin !== 'https://wardmate.invalid' || authPaths.has(parsed.pathname.replace(/\/$/, ''))) return '/';
  return parsed.pathname + parsed.search + parsed.hash;
}
export function sessionExpiredUrl(currentPath: string): string {
  const query = new URLSearchParams({ reason: 'session-expired', returnTo: safeReturnTo(currentPath) });
  return '/dang-nhap?' + query.toString();
}
export function redirectToLogin() {
  if (typeof window === 'undefined') return;
  if (window.location.pathname === '/dang-nhap') return;
  window.location.replace(sessionExpiredUrl(window.location.pathname + window.location.search + window.location.hash));
}
