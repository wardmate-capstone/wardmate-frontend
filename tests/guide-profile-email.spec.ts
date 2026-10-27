import { expect, test } from '@playwright/test';
import { authReply, mockWorkspaceAuth } from './fixtures/auth';
import { mockCatalog } from './fixtures/procedures';

test('menu căn giữa và mở trang hướng dẫn có đủ sáu bước', async ({ page }) => {
  await mockCatalog(page);
  await page.route('**/api/v1/auth/refresh-token', route => authReply(route, { status: 401 }));
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  const nav = page.getByRole('navigation', { name: 'Điều hướng chính', exact: true });
  const links = nav.getByRole('link');
  const first = await links.first().boundingBox();
  const last = await links.last().boundingBox();
  expect(Math.abs((first!.x + last!.x + last!.width) / 2 - 720)).toBeLessThan(2);
  await nav.getByRole('link', { name: 'Hướng dẫn thực hiện' }).click();
  await expect(page).toHaveURL(/\/huong-dan$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(/Chuẩn bị hồ sơ,\s*rõ từng bước/);
  await expect(nav.getByRole('link', { name: 'Hướng dẫn thực hiện' })).toHaveAttribute('aria-current', 'page');
  await expect(page.getByRole('navigation', { name: 'Mục lục hướng dẫn' }).getByRole('link')).toHaveCount(6);
  await page.screenshot({ path: 'test-results/guide-desktop.png', fullPage: true });
  await page.goto('/huong-dan#pdf-qr');
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Tải PDF, QR và mang giấy tờ đến quầy', exact: true })).toBeVisible();
  await page.getByText('Tôi quên mật khẩu hoặc chưa nhận được email?', { exact: true }).click();
  await expect(page.getByRole('link', { name: 'Khôi phục mật khẩu' })).toHaveAttribute('href', '/quen-mat-khau');
});

test('hướng dẫn dùng được từ menu mobile, giữ bố cục 320px', async ({ page }) => {
  await mockCatalog(page);
  await page.route('**/api/v1/auth/refresh-token', route => authReply(route, { status: 401 }));
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Mở menu', exact: true }).click();
  await page.getByRole('dialog', { name: 'Danh mục' }).getByRole('link', { name: 'Hướng dẫn thực hiện' }).click();
  await expect(page).toHaveURL(/\/huong-dan$/);
  await expect(page.getByRole('dialog', { name: 'Danh mục' })).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/guide-mobile.png', fullPage: true });
  await page.getByRole('navigation', { name: 'Mục lục hướng dẫn' }).getByRole('link', { name: /03/ }).click();
  await expect(page).toHaveURL(/#chuan-bi$/);
  await expect(page.getByRole('heading', { name: 'Điền tờ khai và thêm giấy tờ', exact: true })).toBeVisible();
});

test('hồ sơ hiện email từ tài khoản, không gửi email vào API profile', async ({ page }) => {
  const state = await mockWorkspaceAuth(page, ['REGISTERED_CITIZEN']);
  await page.goto('/citizen?section=profile');
  const email = page.getByLabel('Email đăng ký', { exact: true });
  await expect(email).toHaveValue('demo@example.test');
  await expect(email).toHaveAttribute('readonly', '');
  await page.getByRole('button', { name: 'Chỉnh sửa hồ sơ', exact: true }).click();
  await expect(email).toHaveAttribute('readonly', '');
  await page.getByLabel('Họ và tên khai sinh', { exact: true }).fill('Nguyễn Văn Kiểm Thử');
  await page.getByRole('button', { name: 'Lưu thay đổi', exact: true }).click();
  await expect.poll(() => state.requests.filter(request => request.method === 'PUT' && request.path === '/api/v1/users/me/profile').length).toBe(1);
  const saved = state.requests.find(request => request.method === 'PUT' && request.path === '/api/v1/users/me/profile')!;
  expect(saved.body).not.toHaveProperty('email');
  await expect(email).toHaveValue('demo@example.test');
});
