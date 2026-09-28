import { test, expect } from '@playwright/test';

test.describe('Citizen Header Notification Bell & Dropdown', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test to ensure predictable mock state
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('displays notification bell with unread count badge on desktop header', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const bellBtn = page.getByRole('button', { name: /Thông báo, có \d+ thông báo chưa đọc/ }).first();
    await expect(bellBtn).toBeVisible();

    // Initial unread count is 2
    await expect(bellBtn).toContainText('2');
  });

  test('opens and closes dropdown via click and keyboard Escape', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const bellBtn = page.getByRole('button', { name: /Thông báo, có \d+ thông báo chưa đọc/ }).first();

    // Open dropdown
    await bellBtn.click();
    const dialog = page.getByRole('dialog', { name: 'Danh sách thông báo' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('heading', { name: 'Thông báo', exact: true })).toBeVisible();

    // Close on Escape
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
    await expect(bellBtn).toBeFocused();

    // Open and close via click outside
    await bellBtn.click();
    await expect(dialog).toBeVisible();
    await page.locator('main').click({ position: { x: 50, y: 50 } });
    await expect(dialog).not.toBeVisible();
  });

  test('filters notifications by All and Unread tabs', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const bellBtn = page.getByRole('button', { name: /Thông báo, có \d+ thông báo chưa đọc/ }).first();
    await bellBtn.click();

    const dialog = page.getByRole('dialog', { name: 'Danh sách thông báo' });
    const allTab = dialog.getByRole('button', { name: /Tất cả \(\d+\)/ });
    const unreadTab = dialog.getByRole('button', { name: /Chưa đọc \(\d+\)/ });

    await expect(allTab).toHaveAttribute('aria-pressed', 'true');
    await expect(dialog.getByText('Hồ sơ cần bổ sung giấy tờ')).toBeVisible();
    await expect(dialog.getByText('Lưu ý khi đến cơ quan tiếp nhận')).toBeVisible();

    // Switch to Unread tab
    await unreadTab.click();
    await expect(unreadTab).toHaveAttribute('aria-pressed', 'true');
    await expect(dialog.getByText('Hồ sơ cần bổ sung giấy tờ')).toBeVisible();
    await expect(dialog.getByText('Hồ sơ đã được duyệt tiền kiểm')).toBeVisible();
    // Read notification should not be visible in unread tab
    await expect(dialog.getByText('Lưu ý khi đến cơ quan tiếp nhận')).not.toBeVisible();
  });

  test('marks single item as read and decrements unread badge', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const bellBtn = page.getByRole('button', { name: /Thông báo, có 2 thông báo chưa đọc/ }).first();
    await bellBtn.click();

    const dialog = page.getByRole('dialog', { name: 'Danh sách thông báo' });
    // Click mark as read button on the first notification
    const markReadBtn = dialog.getByRole('button', { name: 'Đánh dấu thông báo này là đã đọc' }).first();
    await markReadBtn.click();

    // Now unread count should be 1
    const updatedBellBtn = page.getByRole('button', { name: /Thông báo, có 1 thông báo chưa đọc/ }).first();
    await expect(updatedBellBtn).toBeVisible();
    await expect(updatedBellBtn).toContainText('1');
  });

  test('marks all as read and clears unread badge', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const bellBtn = page.getByRole('button', { name: /Thông báo, có \d+ thông báo chưa đọc/ }).first();
    await bellBtn.click();

    const dialog = page.getByRole('dialog', { name: 'Danh sách thông báo' });
    const markAllBtn = dialog.getByRole('button', { name: 'Đã đọc tất cả' });
    await markAllBtn.click();

    // Mark all button disappears and unread badge disappears
    await expect(markAllBtn).not.toBeVisible();
    const cleanBellBtn = page.getByRole('button', { name: 'Thông báo', exact: true }).first();
    await expect(cleanBellBtn).toBeVisible();

    // Switch to Unread tab should show empty state
    const unreadTab = dialog.getByRole('button', { name: /Chưa đọc \(0\)/ });
    await unreadTab.click();
    await expect(dialog.getByText('Bạn đã đọc hết thông báo')).toBeVisible();
  });

  test('mobile responsive behavior and no overflow', async ({ page }) => {
    for (const width of [390, 360]) {
      await page.setViewportSize({ width, height: 800 });
      const mobileBell = page.getByRole('button', { name: /Thông báo/ }).first();
      await expect(mobileBell).toBeVisible();

      await mobileBell.click();
      const dialog = page.getByRole('dialog', { name: 'Danh sách thông báo' });
      await expect(dialog).toBeVisible();

      // Check no horizontal scrollbar
      const noOverflow = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
      expect(noOverflow).toBe(true);

      await page.keyboard.press('Escape');
    }
  });
});
