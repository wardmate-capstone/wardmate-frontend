const authPaths = new Set(['/dang-nhap', '/dang-ky', '/quen-mat-khau', '/dat-lai-mat-khau']);
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
