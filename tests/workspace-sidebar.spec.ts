import { expect, test } from '@playwright/test';
import { mockWorkspaceAuth } from './fixtures/auth';
import { mockCatalog } from './fixtures/procedures';

test('manager sidebar does not restore the removed permission feature menu', async ({ page }) => {
  await mockWorkspaceAuth(page, ['MANAGER'], ['iam.profile.read', 'iam.audit.read']);
  await page.goto('/manager');
  await expect(page.locator('aside').getByRole('button', { name: 'Nhật ký hoạt động' })).toHaveCount(0);
  await expect(page.locator('aside').getByText('Chức năng được cấp')).toHaveCount(0);
});

test('role keeps placeholder menu items that do not have API permissions yet', async ({ page }) => {
  await mockWorkspaceAuth(page, ['PROCEDURE_MANAGER']);
  await page.goto('/procedure-manager');
  await expect(page.getByRole('button', { name: 'Thành phần hồ sơ' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Dữ liệu kiến thức AI' })).toBeVisible();
});

test('admin does not show duplicate or removed permission feature items', async ({ page }) => {
  await mockWorkspaceAuth(page, ['IT_ADMIN']);
  const catalog = await mockCatalog(page);
  await page.goto('/admin');
  await expect(page.locator('aside').getByRole('button', { name: 'Danh sách thủ tục', exact: true })).toHaveCount(1);
  await page.locator('aside').getByRole('button', { name: 'Danh sách thủ tục', exact: true }).click();
  await expect(page.getByText('Đăng ký khai sinh từ API')).toBeVisible();
  expect(catalog.requests.some(request => request.path === '/api/v1/procedure-manager/procedures')).toBe(true);
  await expect(page.locator('aside').getByRole('button', { name: 'Lịch sử phiên bản' })).toHaveCount(0);
});

test('granted features without a role navigation entry stay hidden', async ({ page }) => {
  await mockWorkspaceAuth(page, ['IT_ADMIN'], ['document.templates.read', 'document.submissions.read']);
  await page.goto('/admin');
  await expect(page.locator('aside').getByRole('button', { name: 'Biểu mẫu điện tử' })).toHaveCount(0);
  await expect(page.locator('aside').getByRole('button', { name: 'Đơn điện tử của tôi' })).toHaveCount(0);
});

test('removed permission feature panel does not open from the sidebar', async ({ page }) => {
  await mockWorkspaceAuth(page, ['IT_ADMIN']);
  await mockCatalog(page);
  await page.goto('/admin');
  await expect(page.locator('aside').getByRole('button', { name: 'PDF & bản nháp' })).toHaveCount(0);
  await expect(page.locator('[data-permission-feature-panel]')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Thu gọn thanh điều hướng' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Thông báo' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Menu tài khoản' })).toBeVisible();
});

test('admin sidebar restores the pre-unification navigation row height', async ({ page }) => {
  await mockWorkspaceAuth(page, ['IT_ADMIN']);
  await page.goto('/admin');
  await expect(page.locator('aside .admin-nav-section > button').first()).toBeVisible();
  const heights = await page.locator('aside .admin-nav-section > button').evaluateAll((buttons) =>
    buttons.map((button) => button.getBoundingClientRect().height)
  );
  expect(heights.length).toBeGreaterThan(10);
  expect(Math.max(...heights)).toBeLessThanOrEqual(44);
});
