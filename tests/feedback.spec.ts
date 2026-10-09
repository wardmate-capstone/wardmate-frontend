import { test, expect } from '@playwright/test';
import { mockWorkspaceAuth } from './fixtures/auth';

test.describe('Citizen Satisfaction Feedback Modal (FE-TASK-31)', () => {
  test.beforeEach(async ({ page }) => {
    await mockWorkspaceAuth(page, ['REGISTERED_CITIZEN']);
    await page.goto('/citizen?section=feedback');
  });

  test('displays feedback history notice and trigger button', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await expect(page.getByText('API lịch sử đánh giá dịch vụ sẽ được tích hợp sau.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Gửi đánh giá mới' })).toBeVisible();
  });

  test('opens feedback modal with star rating, criteria and comment fields', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const feedbackBtn = page.getByRole('button', { name: 'Gửi đánh giá mới' });
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
    await expect(page.getByText(/Cảm ơn bạn đã đánh giá dịch vụ 5 sao/)).toBeVisible();
  });

  test('can close modal via "Để sau" button and keyboard Escape', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const feedbackBtn = page.getByRole('button', { name: 'Gửi đánh giá mới' });
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
      const feedbackBtn = page.getByRole('button', { name: 'Gửi đánh giá mới' });
      await feedbackBtn.click();

      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();

      const noOverflow = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
      expect(noOverflow).toBe(true);

      await page.keyboard.press('Escape');
    }
  });
});
