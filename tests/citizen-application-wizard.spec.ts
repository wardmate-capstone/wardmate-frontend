import { test, expect } from '@playwright/test';
import { mockWorkspaceAuth } from './fixtures/auth';

test.describe('Citizen Preparation & Dossier Checklist (FE-TASK-09, 14, 15)', () => {
  test.beforeEach(async ({ page }) => {
    await mockWorkspaceAuth(page, ['REGISTERED_CITIZEN']);
  });

  test('chuẩn bị hồ sơ trực tiếp trên checklist: tải mẫu, soạn online autofill, đính kèm tệp và nộp tiền kiểm', async ({ page }) => {
    // 1. Mở Cổng công dân trực tiếp tới hồ sơ bản nháp
    await page.goto('/citizen?section=dossiers_draft');
    await expect(page.locator('h1')).toContainText('Hồ sơ bản nháp');

    // 2. Bấm vào nút "Chi tiết" ở hồ sơ bản nháp
    const detailBtn = page.getByRole('button', { name: /Chi tiết/i }).first();
    await detailBtn.click();

    // 3. Xác nhận hiển thị màn hình Chi tiết hồ sơ & Checklist chuẩn bị
    await expect(page.locator('h1')).toContainText('Chi tiết hồ sơ & Checklist chuẩn bị');
    await expect(page.getByText('Danh mục giấy tờ & biểu mẫu')).toBeVisible();

    // 4. Kiểm tra nút "Soạn online" trên dòng biểu mẫu
    const editOnlineBtn = page.getByRole('button', { name: /Soạn online/i }).first();
    await expect(editOnlineBtn).toBeVisible();
    await editOnlineBtn.click();

    // Mở Modal Soạn thảo A4
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText('CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM')).toBeVisible();

    // Bấm nút "Tự động điền từ Hồ sơ cá nhân / VNeID"
    const autoFillBtn = page.getByRole('button', { name: /Tự động điền từ Hồ sơ cá nhân \/ VNeID/i });
    await expect(autoFillBtn).toBeVisible();
    await autoFillBtn.click();

    // Lưu văn bản và đóng modal
    await page.getByRole('button', { name: /Lưu văn bản/i }).click();
    await page.getByTitle('Đóng trình soạn thảo').click();
    await expect(page.getByRole('dialog')).not.toBeVisible();

    // 5. Kiểm tra đính kèm tệp trực tiếp trên từng dòng giấy tờ
    const attachBtn = page.getByRole('button', { name: /Đính kèm tệp/i }).first();
    await expect(attachBtn).toBeVisible();

    // Giả lập upload file
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles({
      name: 'ban_chup_cccd.png',
      mimeType: 'image/png',
      buffer: Buffer.from('test-cccd-content'),
    });

    // Xác nhận file đã xuất hiện và dòng checklist tự động có badge file
    await expect(page.getByText('ban_chup_cccd.png')).toBeVisible();

    // 6. Bấm "Nộp tiền kiểm ngay"
    const submitBtn = page.getByRole('button', { name: /Nộp tiền kiểm ngay/i }).first();
    await expect(submitBtn).toBeVisible();
    await submitBtn.click();

    // Kiểm tra hồ sơ được cập nhật trạng thái "Chờ tiền kiểm"
    await expect(page.getByText('Chờ tiền kiểm').first()).toBeVisible();
  });
});
