import { expect, test } from '@playwright/test';
import { mockWorkspaceAuth } from './fixtures/auth';

test('admin overview shows recent audit activity', async ({ page }) => {
  await mockWorkspaceAuth(page, ['IT_ADMIN']);
  const auditRequest = page.waitForRequest(request =>
    new URL(request.url()).pathname === '/api/v1/rbac/audit-logs'
      && new URL(request.url()).searchParams.get('pageSize') === '5'
  );
  await page.goto('/admin');
  await auditRequest;
  await expect(page.getByText('Gán vai trò: @nguyenvanan')).toBeVisible();
  await expect(page.getByText('Thực hiện bởi @admin.audit · Vai trò Quản lý thủ tục')).toBeVisible();
  await expect(page.getByText('Tài khoản nội bộ').locator('..').locator('..')).toContainText('1');
});

test('admin loads dynamic permission modules and changes one permission', async ({ page }) => {
  const state = await mockWorkspaceAuth(page, ['IT_ADMIN']);
  await page.goto('/admin');
  await page.locator('aside').getByRole('button', { name: 'Vai trò & quyền hạn' }).click();
  await expect(page.getByRole('button', { name: /CUSTOM_REVIEWER/ })).toBeVisible();
  await page.getByRole('button', { name: /Quản trị hệ thống IT_ADMIN/ }).click();
  await page.getByLabel('Lọc theo module').selectOption('DocumentForm');
  await page.getByRole('switch', { name: /Tạo biểu mẫu và tải DOCX gốc/ }).click();
  await expect.poll(() => state.requests.some(request => request.method === 'PUT' && request.path === '/api/v1/rbac/roles/5/permissions/26')).toBe(true);
});

test('admin creates a custom role and assigns a role to a user', async ({ page }) => {
  const state = await mockWorkspaceAuth(page, ['IT_ADMIN']);
  await page.goto('/admin');
  await page.locator('aside').getByRole('button', { name: 'Vai trò & quyền hạn' }).click();
  await page.getByRole('button', { name: 'Thêm vai trò' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Tên vai trò').fill('CUSTOM_CLERK');
  await dialog.getByLabel('Mô tả').fill('Vai trò kiểm thử');
  await dialog.getByRole('button', { name: 'Lưu vai trò' }).click();
  await expect.poll(() => state.requests.find(request => request.path === '/api/v1/rbac/roles' && request.method === 'POST')?.body).toEqual({ roleName: 'CUSTOM_CLERK', description: 'Vai trò kiểm thử' });

  await page.locator('aside').getByRole('button', { name: 'Người dùng hệ thống' }).click();
  await page.getByRole('button', { name: 'Phân vai trò' }).click();
  await page.getByRole('checkbox', { name: /Quản trị hệ thống IT_ADMIN/ }).click();
  await expect.poll(() => state.requests.some(request => request.method === 'PUT' && request.path.endsWith('/roles/5'))).toBe(true);
});

test('admin audit uses IAM data and does not invent IP addresses', async ({ page }) => {
  await mockWorkspaceAuth(page, ['IT_ADMIN']);
  await page.goto('/admin');
  await page.locator('aside').getByRole('button', { name: 'Nhật ký hoạt động' }).click();
  await expect(page.getByRole('cell', { name: /^Gán vai trò$/ })).toBeVisible();
  await expect(page.getByText('@admin.audit')).toBeVisible();
  await expect(page.getByText('@nguyenvanan')).toBeVisible();
  await expect(page.getByRole('columnheader', { name: /IP/i })).toHaveCount(0);
  await page.getByLabel('Tìm nhật ký').fill('admin.audit');
  await expect(page.getByRole('cell', { name: /^Gán vai trò$/ })).toBeVisible();
  await page.getByLabel('Tìm nhật ký').fill('không tồn tại');
  await expect(page.getByText('Không có nhật ký phù hợp trên trang này.')).toBeVisible();
  await page.getByRole('button', { name: 'Xóa lọc' }).click();
  await page.getByLabel('Lọc theo hành động').selectOption('role.assigned');
  await expect(page.getByRole('cell', { name: /^Gán vai trò$/ })).toBeVisible();
});
