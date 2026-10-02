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
    if (path === '/api/v1/accounts') {
      return authReply(route, {
        json: {
          items: [
            { id: '11111111-1111-1111-1111-111111111111', username: 'nguyenvanan', email: 'an.nguyen@example.com', isActive: true, createdAt: '2026-01-01T00:00:00Z' },
            { id: '22222222-2222-2222-2222-222222222222', username: 'tranthimaihuong', email: 'huong.tran@example.com', isActive: true, createdAt: '2026-01-02T00:00:00Z' },
          ],
          page: 1,
          pageSize: 20,
          total: 2,
        },
      });
    }
    if (path.includes('/api/v1/users/') && path.endsWith('/profile')) {
      const parts = path.split('/');
      const userId = parts[parts.indexOf('users') + 1];
      if (userId === '11111111-1111-1111-1111-111111111111') {
        return authReply(route, {
          json: {
            fullName: 'Nguyễn Văn An',
            identityNumber: '001092008128',
            phoneNumber: '0912345678',
            dateOfBirth: '1992-05-14',
            gender: 'Nam',
            permanentAddress: 'Số 12 ngõ 45 phố Nguyễn Du, Phường Hàng Bài, Quận Hoàn Kiếm, Hà Nội',
            temporaryAddress: 'Số 88 đường Giải Phóng, Phường Phương Mai, Quận Đống Đa, Hà Nội',
          },
        });
      }
      if (userId === '22222222-2222-2222-2222-222222222222') {
        return authReply(route, {
          json: {
            fullName: 'Trần Thị Mai Hương',
            identityNumber: '001088002341',
            phoneNumber: '0988776655',
            dateOfBirth: '1988-11-20',
            gender: 'Nữ',
            permanentAddress: 'Thôn Thượng, Xã Ninh Hiệp, Huyện Gia Lâm, Hà Nội',
            temporaryAddress: 'Căn 1204 Tòa R2 Royal City, 72A Nguyễn Trãi, Phường Thượng Đình, Quận Thanh Xuân, Hà Nội',
          },
        });
      }
      return authReply(route, {
        json: {
          fullName: 'Công dân',
          identityNumber: '001099999999',
          phoneNumber: '0900000000',
          dateOfBirth: '1990-01-01',
          gender: 'Nam',
          permanentAddress: 'Hà Nội',
          temporaryAddress: null,
        },
      });
    }
    return authReply(route, { status: 404 });
  });
}
