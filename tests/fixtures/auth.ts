import type { Page, Route } from '@playwright/test';

export function authReply(route: Route, options: Parameters<Route['fulfill']>[0]) {
  return route.fulfill({ ...options, headers: {
    'access-control-allow-origin': route.request().headers().origin || 'http://localhost:4317',
    'access-control-allow-credentials': 'true',
    'access-control-allow-headers': 'Content-Type, Authorization, X-CSRF-Protection',
    'access-control-allow-methods': 'GET, POST, PUT, OPTIONS',
  } });
}

// Only for workspace UI tests; role-denial and session tests use their own IAM scenarios.
export async function mockWorkspaceAuth(page: Page, roles: string[]) {
  let profile = { fullName: 'Tài khoản kiểm thử' };
  await page.route('http://localhost:5000/**', async route => {
    const path = new URL(route.request().url()).pathname;
    if (route.request().method() === 'OPTIONS') return authReply(route, { status: 204 });
    if (path.endsWith('/refresh-token')) return authReply(route, { json: {
      accessToken: 'ui-test-token', tokenType: 'Bearer', accessTokenExpiresAt: new Date(Date.now() + 3600000).toISOString(),
      refreshTokenExpiresAt: new Date(Date.now() + 86400000).toISOString(),
    } });
    if (path.endsWith('/users/me')) return authReply(route, { json: { id: 'ui-test', username: 'demo', email: 'demo@example.test', profile, roles, permissions: ['profile.read'] } });
    if (path.endsWith('/users/me/profile')) {
      if (route.request().method() === 'PUT') profile = route.request().postDataJSON();
      return authReply(route, { json: profile });
    }
    return authReply(route, { status: 404 });
  });
}
