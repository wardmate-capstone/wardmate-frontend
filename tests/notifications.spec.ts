import { expect, test } from '@playwright/test';
import { mockCatalog } from './fixtures/procedures';
import { authReply, mockWorkspaceAuth } from './fixtures/auth';

test.beforeEach(async ({ page }) => {
  await mockCatalog(page);
  await page.route('**/api/v1/auth/refresh-token', route => authReply(route, { status: 401, json: { code: 'auth.unauthorized' } }));
});

test('không trình bày thông báo mẫu cũ trong storage như dữ liệu người dùng', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('wardmate_citizen_notifications_v1', JSON.stringify([{ id: 'old', title: 'Thông báo riêng cũ', isRead: false }])));
  await page.goto('/');
  await page.getByRole('button', { name: 'Thông báo', exact: true }).click();
  const panel = page.getByRole('dialog', { name: 'Danh sách thông báo' });
  await expect(panel.getByText('Không có thông báo nào')).toBeVisible();
  await expect(panel.getByText('Chưa kết nối thông báo.')).toBeVisible();
  await expect(panel.getByText('Thông báo riêng cũ')).toHaveCount(0);
  await expect(panel.getByRole('button', { name: 'Dữ liệu mẫu' })).toHaveCount(0);
  await expect(panel.getByRole('link', { name: 'Đăng nhập để xem hồ sơ' })).toHaveAttribute('href', /dang-nhap\?returnTo=/);
});

test('bảng thông báo vừa màn hình 320/390px và Escape trả focus', async ({ page }) => {
  for (const width of [320, 390, 1440]) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto('/');
    const trigger = page.getByRole('button', { name: 'Thông báo', exact: true });
    await trigger.click();
    const panel = page.getByRole('dialog', { name: 'Danh sách thông báo' });
    await expect(panel).toBeVisible();
    const rect = await panel.boundingBox();
    expect(rect!.x).toBeGreaterThanOrEqual(0);
    expect(rect!.x + rect!.width).toBeLessThanOrEqual(width);
    await page.keyboard.press('Escape');
    await expect(panel).toHaveCount(0);
    await expect(trigger).toBeFocused();
  }
});

test('liên kết hồ sơ trong thông báo đi tới route hợp lệ của công dân', async ({ page }) => {
  await mockWorkspaceAuth(page, ['REGISTERED_CITIZEN']);
  await page.goto('/');
  await page.getByRole('button', { name: 'Thông báo', exact: true }).click();
  await page.getByRole('link', { name: 'Mở phân hệ của tôi' }).click();
  await expect(page).toHaveURL(/\/citizen\?section=dossiers_all$/);
  await expect(page.getByRole('heading', { name: 'Không tìm thấy trang bạn cần' })).toHaveCount(0);
});
