import { expect, test } from '@playwright/test';
import { authReply, mockWorkspaceAuth } from './fixtures/auth';
import { mockCatalog } from './fixtures/procedures';

const workspaces = [
  ['REGISTERED_CITIZEN', '/citizen'], ['FRONT_DESK_OFFICER', '/officer'],
  ['MANAGER', '/manager'], ['PROCEDURE_MANAGER', '/procedure-manager'], ['IT_ADMIN', '/admin'],
] as const;

for (const [role, path] of workspaces) {
  test(`${role}: reflow, menu mobile giữ focus và Escape trả về trigger`, async ({ page }) => {
    await mockWorkspaceAuth(page, [role]);
    await mockCatalog(page);
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(path);
    for (const width of [1440, 720, 320]) {
      await page.setViewportSize({ width, height: 900 });
      await expect(page.locator('main').first()).toBeVisible();
      if (width < 1024) {
        await expect.poll(() => page.locator('main').first().evaluate(el => el.getBoundingClientRect().width)).toBeGreaterThan(width - 65);
        await expect(page.getByRole('complementary')).toHaveCount(0);
        const trigger = page.getByRole('button', { name: /^Mở menu/ }).first();
        await trigger.click();
        const dialog = page.getByRole('dialog', { name: /Điều hướng/ });
        await expect(dialog).toBeVisible();
        for (let i = 0; i < 15; i++) {
          await page.keyboard.press('Tab');
          expect(await dialog.evaluate(el => el.contains(document.activeElement))).toBe(true);
        }
        await page.keyboard.press('Escape');
        await expect(dialog).toHaveCount(0);
        await expect(trigger).toBeFocused();
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
    await page.screenshot({ path: `test-results/ui-audit-${role}-320.png`, fullPage: true });
    expect(errors).toEqual([]);
  });
}

test('trang công khai và auth không tràn ngang ở 320px, không lỗi runtime', async ({ page }) => {
  await mockCatalog(page);
  await page.route('**/api/v1/auth/refresh-token', route => authReply(route, { status: 401, json: { code: 'auth.unauthorized' } }));
  await page.setViewportSize({ width: 320, height: 800 });
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  for (const path of ['/', '/thu-tuc', '/hoi-dap', '/dang-nhap', '/dang-ky', '/quen-mat-khau', '/dat-lai-mat-khau', '/khong-ton-tai']) {
    await page.goto(path);
    await expect(page.locator('main')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), path).toBe(true);
  }
  expect(errors).toEqual([]);
});

test('clipboard bị từ chối không báo thành công hoặc lộ CCCD trong toast', async ({ page }) => {
  await mockWorkspaceAuth(page, ['REGISTERED_CITIZEN']);
  await mockCatalog(page);
  await page.route('**/api/v1/users/me', route => authReply(route, { json: { id: 'ui-test', username: 'demo', roles: ['REGISTERED_CITIZEN'], permissions: ['document.submissions.read'], profile: { fullName: 'Người kiểm thử', identityNumber: '001099999999' } } }));
  await page.addInitScript(() => { Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async () => { throw new Error('Permission denied'); } } }); });
  await page.goto('/citizen?section=profile');
  await page.getByRole('button', { name: /Sao chép/ }).click();
  await expect(page.getByText('Không thể sao chép. Vui lòng chọn văn bản và sao chép thủ công.')).toBeVisible();
  await expect(page.getByText(/Đã sao chép/)).toHaveCount(0);
});
