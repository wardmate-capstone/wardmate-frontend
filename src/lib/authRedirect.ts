const authPaths = new Set(['/dang-nhap', '/dang-ky', '/quen-mat-khau', '/dat-lai-mat-khau']);
const roleHomes: Record<string, string> = {
  IT_ADMIN: '/admin',
  FRONT_DESK_OFFICER: '/officer',
  MANAGER: '/manager',
  PROCEDURE_MANAGER: '/procedure-manager',
  REGISTERED_CITIZEN: '/',
};

export function loginDestination(roles: string[], returnTo?: string | null): string {
  const destination = safeReturnTo(returnTo);
  if (destination !== '/') return destination;
  // Multiple roles keep the home page's workspace menu rather than guessing a primary role.
  return roles.length === 1 ? roleHomes[roles[0]] ?? '/' : '/';
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
