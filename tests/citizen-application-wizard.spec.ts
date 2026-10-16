import { test, expect } from '@playwright/test';
import { mockWorkspaceAuth } from './fixtures/auth';
import { mockCatalog, sampleProcedure } from './fixtures/procedures';

test('không tự tạo hồ sơ mẫu khi dịch vụ hồ sơ chưa tích hợp', async ({ page }) => {
  await mockWorkspaceAuth(page, ['REGISTERED_CITIZEN']);
  await page.goto('/citizen?section=dossiers_draft');
  await expect(page.getByText('Không có hồ sơ nào ở trạng thái "Bản nháp".')).toBeVisible();
  await expect(page.getByRole('button', { name: /Chi tiết/i })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Gửi hồ sơ tiền kiểm' })).toHaveCount(0);
  await expect(page.getByText('Đủ điều kiện nộp', { exact: false })).toHaveCount(0);
});

test('Catalog chuyển đúng ngữ cảnh thủ tục sang luồng chuẩn bị hồ sơ và không ghi localStorage', async ({ page }) => {
  await mockWorkspaceAuth(page, ['REGISTERED_CITIZEN']);
  await mockCatalog(page);
  await page.goto(`/thu-tuc/${sampleProcedure.id}`);
  const before = await page.evaluate(() => JSON.stringify(localStorage));
  await page.getByRole('link', { name: 'Chuẩn bị hồ sơ', exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`procedureId=${sampleProcedure.id}.*caseCode=A`));
  expect(await page.evaluate(() => JSON.stringify(localStorage))).toBe(before);
});
