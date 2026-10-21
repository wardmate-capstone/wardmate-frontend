import { expect, test } from '@playwright/test';
import { mockCatalog } from './fixtures/procedures';
import { mockWorkspaceAuth } from './fixtures/auth';

test('lookup keeps readable cards and filters within public and citizen layouts', async ({ page }) => {
  await mockWorkspaceAuth(page, ['REGISTERED_CITIZEN']);
  await mockCatalog(page);
  for (const path of ['/thu-tuc', '/citizen?section=procedures']) {
    await page.goto(path);
    await expect(page.locator('.procedures-list > li')).toHaveCount(5);
    if (path.includes('citizen')) {
      await expect(page.locator('#citizen-main h1')).toHaveCount(1);
      await expect(page.locator('#citizen-main h1')).toHaveText('Tra cứu thủ tục');
      await expect(page.locator('.procedures-breadcrumb')).toHaveCount(0);
      await expect(page.locator('.procedures-hero-copy')).toHaveCount(0);
    } else {
      await expect(page.getByRole('heading', { name: 'Thủ tục hành chính', exact: true })).toBeVisible();
      await expect(page.locator('.procedures-breadcrumb')).toBeVisible();
    }
    for (const width of [1440, 768, 390, 360]) {
      await page.setViewportSize({ width, height: 900 });
      if (path.includes('citizen')) {
        await expect(page.locator('.admin-workspace')).toHaveCSS('margin-left', width >= 1024 ? '268px' : '0px');
      }
      await expect(page.getByLabel('Tên thủ tục hoặc nhu cầu của bạn')).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      const card = page.locator('.procedure-result-row').first();
      await expect(card).toContainText('Thời gian: Trong ngày');
      await expect(card).toContainText('Lệ phí: Theo nội dung đối soát');
      await expect(card.getByText('Xem hướng dẫn')).toBeVisible();
      if (width === 1440 || width === 390) {
        await page.screenshot({ path: `test-results/procedures-${path.includes('citizen') ? 'citizen' : 'public'}-${width}.png`, fullPage: true, animations: 'disabled' });
      }
    }
  }
});

test('submit searches immediately, clear removes pending text and pagination keeps focus', async ({ page }) => {
  await mockCatalog(page);
  await page.goto('/thu-tuc?page=2');
  await expect(page.locator('.procedures-list > li')).toHaveCount(1);
  const search = page.getByLabel('Tên thủ tục hoặc nhu cầu của bạn');
  await search.fill('khai sinh');
  await search.press('Enter');
  await expect(page).toHaveURL(/q=khai\+sinh/);
  await expect(page).not.toHaveURL(/page=2/);
  await expect(page.locator('#procedures-results-title')).toBeFocused();
  await expect(page.locator('.procedures-list > li')).toHaveCount(5);
  await page.getByRole('button', { name: 'Trang sau', exact: true }).click();
  await expect(page.locator('.procedures-list > li')).toHaveCount(1);
  await expect(page.locator('#procedures-results-title')).toBeFocused();
  await search.fill('khai sinh đang nhập');
  await page.getByRole('button', { name: 'Xóa bộ lọc', exact: true }).click();
  await expect(search).toHaveValue('');
  await expect(page).toHaveURL('/thu-tuc');
  await expect(page.locator('.procedures-list > li')).toHaveCount(5);
  await page.getByRole('button', { name: 'Chứng thực', exact: true }).click();
  await expect(page.getByText('Chưa tìm thấy thủ tục phù hợp')).toBeVisible();
  await page.getByRole('button', { name: 'Xem tất cả thủ tục', exact: true }).click();
  await expect(page.locator('.procedures-list > li')).toHaveCount(5);
});
