import { test, expect } from '@playwright/test';

test.describe('Citizen Satisfaction Feedback Modal (FE-TASK-31)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tai-khoan');
  });

  test('displays application list and feedback trigger button on account page', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const section = page.getByRole('region', { name: 'Hồ sơ tiền kiểm gần đây' });
    await expect(section).toBeVisible();

    const feedbackBtn = section.getByRole('button', { name: 'Đánh giá dịch vụ' });
    await expect(feedbackBtn).toBeVisible();
  });

  test('opens feedback modal with star rating, criteria and comment fields', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const feedbackBtn = page.getByRole('button', { name: 'Đánh giá dịch vụ' });
    await feedbackBtn.click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('heading', { name: 'Đánh giá trải nghiệm dịch vụ' })).toBeVisible();

    // Submit button is disabled initially when 0 stars selected
    const submitBtn = dialog.getByRole('button', { name: 'Gửi đánh giá' });
    await expect(submitBtn).toBeDisabled();

    // Select 5 stars
    const star5Btn = dialog.getByRole('radio', { name: /5 sao - Rất hài lòng/ });
    await star5Btn.click();
    await expect(dialog.getByText('Rất hài lòng')).toBeVisible();
    await expect(submitBtn).toBeEnabled();

    // Toggle criteria aspects
    const aspectBtn = dialog.getByRole('button', { name: 'Thời gian tiền kiểm nhanh chóng' });
    await aspectBtn.click();
    await expect(aspectBtn).toHaveAttribute('aria-pressed', 'true');

    // Type comment
    const textarea = dialog.locator('#feedback-comment');
    await textarea.fill('Cán bộ hướng dẫn rất tận tình và chu đáo.');
    await expect(dialog.getByText(/\d+\/500/)).toBeVisible();

    // Submit feedback
    await submitBtn.click();

    // Verify modal closes and single toast notification appears
    await expect(dialog).not.toBeVisible();
    await expect(page.getByText(/Cảm ơn bạn đã đánh giá 5 sao/)).toBeVisible();
  });

  test('can close modal via "Để sau" button and keyboard Escape', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const feedbackBtn = page.getByRole('button', { name: 'Đánh giá dịch vụ' });
    await feedbackBtn.click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // Close on Escape
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();

    // Reopen and close on "Để sau"
    await feedbackBtn.click();
    await expect(dialog).toBeVisible();
    const closeBtn = dialog.getByRole('button', { name: 'Để sau' });
    await closeBtn.click();
    await expect(dialog).not.toBeVisible();
  });

  test('fits mobile viewport without overflow', async ({ page }) => {
    for (const width of [390, 360]) {
      await page.setViewportSize({ width, height: 800 });
      const feedbackBtn = page.getByRole('button', { name: 'Đánh giá dịch vụ' });
      await feedbackBtn.click();

      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();

      const noOverflow = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
      expect(noOverflow).toBe(true);

      await page.keyboard.press('Escape');
    }
  });
});
