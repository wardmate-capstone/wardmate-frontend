import { expect, test } from '@playwright/test';
import { authReply, mockWorkspaceAuth } from './fixtures/auth';

const ward = { id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', code: 'WARD_A', name: 'Phường A' };

test('admin tạo tài khoản Quản lý với phường bắt buộc', async ({ page }) => {
  const state = await mockWorkspaceAuth(page, ['IT_ADMIN']);
  // Route đăng ký sau được ưu tiên; phần còn lại rơi về fixture chung.
  await page.route('http://localhost:5000/**', async route => {
    const path = new URL(route.request().url()).pathname;
    if (path === '/api/v1/accounts/wards') return authReply(route, { json: [ward] });
    if (path === '/api/v1/accounts/manager' && route.request().method() === 'POST') {
      state.requests.push({ method: 'POST', path, body: route.request().postDataJSON() });
      return authReply(route, { status: 201, json: { id: '33333333-3333-3333-3333-333333333333', username: 'lanh.dao', email: 'ld@example.com', isActive: true, wardId: ward.id, roles: [{ id: 3, roleName: 'MANAGER' }] } });
    }
    return route.fallback();
  });

  await page.goto('/admin');
  await page.locator('aside').getByRole('button', { name: 'Người dùng hệ thống' }).click();
  await page.getByRole('button', { name: 'Tạo tài khoản cán bộ' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Vai trò *').selectOption('MANAGER');
  await dialog.getByLabel('Họ và tên *').fill('Lê Văn Đạo');
  await dialog.getByLabel('Tên đăng nhập *').fill('lanh.dao');
  await dialog.getByLabel('Email công vụ *').fill('ld@example.com');
  await dialog.getByLabel(/Mật khẩu khởi tạo/).fill('MatKhau@2026');
  await dialog.getByRole('button', { name: 'Tạo tài khoản' }).click();
  await expect(dialog.getByText('Vui lòng chọn phường/xã công tác.')).toBeVisible();

  await dialog.getByLabel('Phường / Xã công tác *').selectOption(ward.id);
  await dialog.getByRole('button', { name: 'Tạo tài khoản' }).click();
  await expect(dialog).toBeHidden();
  expect(state.requests.find(request => request.path === '/api/v1/accounts/manager')?.body).toEqual({
    username: 'lanh.dao', email: 'ld@example.com', password: 'MatKhau@2026', fullName: 'Lê Văn Đạo', wardId: ward.id,
  });
});

test('admin lọc vai trò bằng tham số server', async ({ page }) => {
  await mockWorkspaceAuth(page, ['IT_ADMIN']);
  await page.goto('/admin');
  await page.locator('aside').getByRole('button', { name: 'Người dùng hệ thống' }).click();
  await expect(page.getByText('Nguyễn Văn An')).toBeVisible();
  const filtered = page.waitForRequest(request => {
    const url = new URL(request.url());
    return url.pathname === '/api/v1/admin/users' && url.searchParams.get('role') === 'PROCEDURE_MANAGER';
  });
  await page.getByLabel('Lọc theo vai trò').selectOption('PROCEDURE_MANAGER');
  await filtered;
});

test('admin sửa hồ sơ người dùng và tạo mới khi hồ sơ chưa tồn tại', async ({ page }) => {
  const state = await mockWorkspaceAuth(page, ['IT_ADMIN']);
  await page.route('http://localhost:5000/api/v1/users/11111111-1111-1111-1111-111111111111/profile', async route => {
    const method = route.request().method();
    if (method === 'PUT') {
      state.requests.push({ method, path: '/profile', body: route.request().postDataJSON() });
      return authReply(route, { status: 404, json: { status: 404, title: 'Không tìm thấy hồ sơ người dùng.', code: 'iam.profile_not_found' } });
    }
    if (method === 'POST') {
      const body = route.request().postDataJSON();
      state.requests.push({ method, path: '/profile', body });
      return authReply(route, { status: 201, json: body });
    }
    return route.fallback();
  });

  await page.goto('/admin');
  await page.locator('aside').getByRole('button', { name: 'Người dùng hệ thống' }).click();
  await page.getByRole('button', { name: 'Xem chi tiết' }).click();
  await page.getByRole('button', { name: 'Chỉnh sửa hồ sơ' }).click();
  await page.getByRole('button', { name: 'Lưu thay đổi' }).click();
  await expect.poll(() => state.requests.filter(request => request.path === '/profile').map(request => request.method)).toEqual(['PUT', 'POST']);
  expect(state.requests.find(request => request.method === 'POST' && request.path === '/profile')?.body).toMatchObject({ fullName: 'Nguyễn Văn An' });
});

test('trang phường đếm nhân sự theo từng phường bằng tham số wardCode', async ({ page }) => {
  await mockWorkspaceAuth(page, ['IT_ADMIN']);
  await page.route('http://localhost:5000/api/v1/accounts/wards', route => authReply(route, { json: [ward, { id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', code: 'WARD_B', name: 'Phường B' }] }));
  const wardCodes: string[] = [];
  page.on('request', request => {
    const url = new URL(request.url());
    if (url.pathname === '/api/v1/admin/users' && url.searchParams.get('wardCode')) wardCodes.push(url.searchParams.get('wardCode')!);
  });
  await page.goto('/admin');
  await page.locator('aside').getByRole('button', { name: 'Đơn vị Phường / Xã' }).click();
  await expect(page.getByRole('row', { name: /Phường B/ })).toContainText('1 nhân sự trực thuộc');
  expect(wardCodes.sort()).toEqual(['WARD_A', 'WARD_B']);
});

test('nhật ký hiện nhãn tiếng Việt cho thao tác tạo tài khoản Lãnh đạo và Quản lý thủ tục', async ({ page }) => {
  await mockWorkspaceAuth(page, ['IT_ADMIN']);
  await page.route('http://localhost:5000/api/v1/rbac/audit-logs**', route => authReply(route, { json: { items: [
    { id: 'aaaaaaaa-0000-0000-0000-000000000001', actorUserId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', action: 'account.manager_created', targetUserId: '11111111-1111-1111-1111-111111111111', roleId: 3, permissionId: null, details: JSON.stringify({ wardId: ward.id }), createdAt: '2026-10-26T01:00:00Z' },
    { id: 'aaaaaaaa-0000-0000-0000-000000000002', actorUserId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', action: 'account.procedure_manager_created', targetUserId: '22222222-2222-2222-2222-222222222222', roleId: 4, permissionId: null, details: JSON.stringify({ wardId: null }), createdAt: '2026-10-26T02:00:00Z' },
  ], page: 1, pageSize: 20, total: 2 } }));
  await page.goto('/admin');
  await page.locator('aside').getByRole('button', { name: 'Nhật ký hoạt động' }).click();
  await expect(page.getByRole('cell', { name: /^Tạo tài khoản Lãnh đạo UBND$/ })).toBeVisible();
  await expect(page.getByRole('cell', { name: /^Tạo tài khoản Quản lý thủ tục$/ })).toBeVisible();
  await expect(page.getByText('account.manager_created', { exact: true })).toHaveCount(0);
});
