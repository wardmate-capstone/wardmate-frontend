import { test, expect } from '@playwright/test';

test('core inputs, loading button, modal focus and toast work with keyboard', async ({ page }) => {
  await page.goto('/tests/fixtures/ui.html');
  const email = page.getByLabel('Email');
  await expect(email).toHaveAttribute('aria-invalid', 'true');
  await expect(email).toHaveAccessibleDescription('Địa chỉ nhận thông báo Vui lòng kiểm tra email.');
  await expect(page.getByRole('button', { name: 'Đang lưu' })).toBeDisabled();
  const trigger = page.getByRole('button', { name: 'Mở hộp thoại' });
  await trigger.click();
  const modal = page.getByRole('dialog', { name: 'Xác nhận thay đổi' });
  await expect(modal).toBeVisible();
  await expect(modal).toHaveAccessibleDescription('Kiểm tra thông tin trước khi tiếp tục.');
  for (let i = 0; i < 6; i++) {
    await page.keyboard.press('Tab');
    expect(await modal.evaluate((element) => element.contains(document.activeElement))).toBe(true);
  }
  await page.keyboard.press('Escape');
  await expect(modal).toBeHidden();
  await expect(trigger).toBeFocused();
  await page.getByRole('button', { name: 'Hiện thông báo' }).click();
  await expect(page.getByText('Đã lưu thay đổi.')).toBeVisible();
});

test('core modal fits narrow mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto('/tests/fixtures/ui.html');
  await page.getByRole('button', { name: 'Mở hộp thoại' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/core-modal-mobile.png' });
  await page.getByRole('button', { name: 'Đóng hộp thoại' }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
});

test('expired session explains re-login and keeps return path through registration', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/dang-nhap?reason=session-expired&returnTo=%2Ftai-khoan');
  await expect(page.getByRole('status')).toContainText('Phiên đăng nhập đã hết hạn.');
  await expect(page.getByRole('link', { name: 'Đăng ký ngay' })).toHaveAttribute('href', '/dang-ky?returnTo=%2Ftai-khoan');
  await expect(page.getByLabel('Tên đăng nhập hoặc email')).toBeVisible();
  await page.screenshot({ path: 'test-results/auth-core-mobile.png', fullPage: true });
});

test('programmatically opened modal returns focus to the prior element', async ({ page }) => {
  await page.goto('/tests/fixtures/ui.html');
  const button = page.getByRole('button', { name: 'Open controlled modal' });
  await button.click();
  await expect(page.getByRole('dialog', { name: 'Controlled modal' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(button).toBeFocused();
});
