import { expect, test } from '@playwright/test';
import { mockWorkspaceAuth } from './fixtures/auth';
import { mockCatalog } from './fixtures/procedures';

test('manager receives IAM audit directly in the current sidebar', async ({ page }) => {
  await mockWorkspaceAuth(page, ['MANAGER'], ['iam.profile.read', 'iam.audit.read']);
  await page.goto('/manager');
  await page.getByRole('button', { name: 'Nhật ký hoạt động' }).click();
  await expect(page.getByText('Theo dõi chi tiết các thao tác phân quyền')).toBeVisible();
  await expect(page.getByText('Không gian làm việc')).toHaveCount(0);
});

test('role keeps placeholder menu items that do not have API permissions yet', async ({ page }) => {
  await mockWorkspaceAuth(page, ['PROCEDURE_MANAGER']);
  await page.goto('/procedure-manager');
  await expect(page.getByRole('button', { name: 'Thành phần hồ sơ' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Dữ liệu kiến thức AI' })).toBeVisible();
});

test('admin does not show a duplicate procedure item and unsupported features explain their status', async ({ page }) => {
  await mockWorkspaceAuth(page, ['IT_ADMIN']);
  const catalog = await mockCatalog(page);
  await page.goto('/admin');
  await expect(page.locator('aside').getByRole('button', { name: 'Danh sách thủ tục', exact: true })).toHaveCount(1);
  await page.locator('aside').getByRole('button', { name: 'Danh sách thủ tục', exact: true }).click();
  await expect(page.getByText('Đăng ký khai sinh từ API')).toBeVisible();
  expect(catalog.requests.some(request => request.path === '/api/v1/procedure-manager/procedures')).toBe(true);
  await page.locator('aside').getByRole('button', { name: 'Lịch sử phiên bản' }).click();
  await expect(page.getByText('Backend chưa có API lịch sử phiên bản tổng hợp.')).toBeVisible();
});

test('granted features without an integrated admin API show a clear notice', async ({ page }) => {
  await mockWorkspaceAuth(page, ['IT_ADMIN'], ['document.templates.read', 'document.submissions.read']);
  await page.goto('/admin');
  await page.locator('aside').getByRole('button', { name: 'Biểu mẫu điện tử' }).click();
  await expect(page.getByText('Chưa có màn quản lý kho biểu mẫu độc lập kết nối API DocumentForm.')).toBeVisible();
  await page.locator('aside').getByRole('button', { name: 'Đơn điện tử của tôi' }).click();
  await expect(page.getByText('Chưa có API danh sách đơn điện tử dành cho màn quản trị.')).toBeVisible();
});

test('granted feature panel covers the workspace after the background is scrolled', async ({ page }) => {
  await mockWorkspaceAuth(page, ['IT_ADMIN']);
  await mockCatalog(page);
  await page.goto('/admin');
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.locator('aside').getByRole('button', { name: 'PDF & bản nháp' }).click();
  const panel = page.locator('[data-permission-feature-panel]');
  await expect(panel).toBeVisible();
  await expect(page.getByRole('button', { name: 'Đóng chức năng' })).toHaveCount(0);
  expect(await panel.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return { belowTopbar: Math.abs(rect.top - 72) < 1, coversBottom: Math.abs(rect.bottom - window.innerHeight) < 1 };
  })).toEqual({ belowTopbar: true, coversBottom: true });
  await expect.poll(() => page.evaluate(() => document.body.style.overflow)).toBe('hidden');
  await expect.poll(() => page.evaluate(() => document.documentElement.style.overflow)).toBe('hidden');
  expect(await page.evaluate(() => {
    const panel = document.querySelector('[data-permission-feature-panel]');
    return panel?.contains(document.elementFromPoint(window.innerWidth - 20, 80));
  })).toBe(true);
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
