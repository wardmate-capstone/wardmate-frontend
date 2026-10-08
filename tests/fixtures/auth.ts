import type { Page, Route } from '@playwright/test';

export function authReply(route: Route, options: Parameters<Route['fulfill']>[0]) {
  return route.fulfill({ ...options, headers: {
    'access-control-allow-origin': route.request().headers().origin || 'http://localhost:4317',
    'access-control-allow-credentials': 'true',
    'access-control-allow-headers': 'Content-Type, Authorization, X-CSRF-Protection',
    'access-control-allow-methods': 'GET, POST, PUT, DELETE, OPTIONS',
  } });
}

// Only for workspace UI tests; role-denial and session tests use their own IAM scenarios.
export async function mockWorkspaceAuth(page: Page, roles: string[], grantedPermissions?: string[]) {
  let profile = { fullName: 'Tài khoản kiểm thử' };
  const defaultPermissions = [
    'iam.profile.read', 'iam.profile.write',
    ...(roles.includes('IT_ADMIN') ? ['iam.manage', 'iam.accounts.read', 'iam.accounts.manage', 'iam.wards.read', 'iam.wards.manage', 'iam.rbac.manage', 'iam.audit.read'] : []),
    ...(roles.includes('PROCEDURE_MANAGER') || roles.includes('IT_ADMIN') ? ['procedure.read', 'procedure.create', 'procedure.update', 'procedure.publish', 'procedure.status', 'procedure.versions.read', 'procedure.rollback', 'procedure.source.read', 'procedure.categories.manage', 'procedure.drafts.read', 'procedure.drafts.upload', 'procedure.drafts.update', 'procedure.drafts.extract', 'procedure.drafts.publish', 'procedure.drafts.delete', 'document.templates.read', 'document.templates.manage'] : []),
    ...(roles.includes('REGISTERED_CITIZEN') ? ['document.submissions.read', 'document.submissions.write', 'document.submissions.submit', 'document.submissions.download'] : []),
  ];
  const userPermissions = grantedPermissions ?? defaultPermissions;
  const state = { requests: [] as Array<{ method: string; path: string; body: unknown }> };
  await page.route('http://localhost:5000/**', async route => {
    const path = new URL(route.request().url()).pathname;
    if (route.request().method() === 'OPTIONS') return authReply(route, { status: 204 });
    const method = route.request().method();
    state.requests.push({ method, path, body: route.request().headers()['content-type']?.includes('application/json') ? route.request().postDataJSON() : null });
    if (path.endsWith('/refresh-token')) return authReply(route, { json: {
      accessToken: 'ui-test-token', tokenType: 'Bearer', accessTokenExpiresAt: new Date(Date.now() + 3600000).toISOString(),
      refreshTokenExpiresAt: new Date(Date.now() + 86400000).toISOString(),
    } });
    if (path.endsWith('/users/me')) return authReply(route, { json: { id: 'ui-test', username: 'demo', email: 'demo@example.test', profile, roles, permissions: userPermissions } });
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
    if (/^\/api\/v1\/accounts\/[0-9a-f-]+$/.test(path) && method === 'GET') {
      const id = path.split('/').at(-1)!;
      return authReply(route, { json: { id, username: id.startsWith('bbbb') ? 'admin.audit' : 'nguyenvanan', email: 'audit@example.com', isActive: true, createdAt: '2026-01-01T00:00:00Z' } });
    }
    if (path === '/api/v1/users/profiles') {
      return authReply(route, {
        json: {
          items: [
            {
              userId: '11111111-1111-1111-1111-111111111111',
              fullName: 'Nguyễn Văn An',
              identityNumber: '001092008128',
              phoneNumber: '0912345678',
              dateOfBirth: '1992-05-14',
              gender: 'Nam',
              permanentAddress: 'Số 12 ngõ 45 phố Nguyễn Du, Phường Hàng Bài, Quận Hoàn Kiếm, Hà Nội',
              temporaryAddress: 'Số 88 đường Giải Phóng, Phường Phương Mai, Quận Đống Đa, Hà Nội',
            },
            {
              userId: '22222222-2222-2222-2222-222222222222',
              fullName: 'Trần Thị Mai Hương',
              identityNumber: '001088002341',
              phoneNumber: '0988776655',
              dateOfBirth: '1988-11-20',
              gender: 'Nữ',
              permanentAddress: 'Thôn Thượng, Xã Ninh Hiệp, Huyện Gia Lâm, Hà Nội',
              temporaryAddress: 'Căn 1204 Tòa R2 Royal City, 72A Nguyễn Trãi, Phường Thượng Đình, Quận Thanh Xuân, Hà Nội',
            },
          ],
          page: 1,
          pageSize: 20,
          total: 2,
        },
      });
    }
    const permissions = [
      { id: 8, permissionCode: 'iam.rbac.manage', permissionName: 'Quản trị vai trò và quyền toàn hệ thống', module: 'IAM' },
      { id: 16, permissionCode: 'procedure.rollback', permissionName: 'Khôi phục phiên bản thủ tục', module: 'ProcedureCatalog' },
      { id: 26, permissionCode: 'document.templates.manage', permissionName: 'Tạo biểu mẫu và tải DOCX gốc', module: 'DocumentForm' },
    ];
    const rbacRoles = [
      { id: 5, roleName: 'IT_ADMIN', description: 'Quản trị hệ thống', isSystem: true, permissions: [permissions[0]] },
      { id: 4, roleName: 'PROCEDURE_MANAGER', description: 'Quản lý thủ tục', isSystem: true, permissions: [permissions[1]] },
      { id: 6, roleName: 'CUSTOM_REVIEWER', description: 'Vai trò tùy chỉnh', isSystem: false, permissions: [] },
    ];
    if (path === '/api/v1/rbac/permissions') return authReply(route, { json: permissions });
    if (path === '/api/v1/rbac/roles' && method === 'GET') return authReply(route, { json: { items: rbacRoles, page: 1, pageSize: 20, total: rbacRoles.length } });
    if (path === '/api/v1/rbac/roles' && method === 'POST') return authReply(route, { status: 201, json: { id: 7, ...(route.request().postDataJSON() as object), isSystem: false, permissions: [] } });
    if (/\/api\/v1\/rbac\/roles\/\d+$/.test(path) && method === 'PUT') return authReply(route, { json: { id: Number(path.split('/').at(-1)), ...(route.request().postDataJSON() as object), isSystem: false, permissions: [] } });
    if (/\/api\/v1\/rbac\/roles\/\d+$/.test(path) && method === 'DELETE') return authReply(route, { status: 204 });
    if (path.includes('/api/v1/rbac/roles/') && path.includes('/permissions/') && ['PUT', 'DELETE'].includes(method)) return authReply(route, { status: 204 });
    if (path === '/api/v1/rbac/audit-logs') return authReply(route, { json: { items: [{ id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', actorUserId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', action: 'role.assigned', targetUserId: '11111111-1111-1111-1111-111111111111', roleId: 4, permissionId: null, details: '{}', createdAt: '2026-10-08T01:00:00Z' }], page: 1, pageSize: 20, total: 1 } });
    if (path.endsWith('/roles') && path.includes('/api/v1/rbac/users/')) return authReply(route, { json: [rbacRoles[1]] });
    if (path.includes('/api/v1/rbac/users/') && /\/roles\/\d+$/.test(path) && ['PUT', 'DELETE'].includes(method)) return authReply(route, { status: 204 });
    if (path === '/api/v1/users') return authReply(route, { json: { items: [{ id: '11111111-1111-1111-1111-111111111111', username: 'nguyenvanan', email: 'an@example.com', isActive: true, wardId: null, wardName: null, profile: { fullName: 'Nguyễn Văn An' }, roles: [{ id: 4, roleName: 'PROCEDURE_MANAGER' }] }], page: 1, pageSize: 20, total: 1 } });
    if (path === '/api/v1/accounts/wards') return authReply(route, { json: [] });
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
  return state;
}
