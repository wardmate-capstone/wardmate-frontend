import { test, expect } from '@playwright/test';
import { mockWorkspaceAuth } from './fixtures/auth';
import { mockCatalog, sampleProcedure } from './fixtures/procedures';

test('không tự tạo hồ sơ mẫu khi dịch vụ hồ sơ chưa tích hợp', async ({ page }) => {
  await mockWorkspaceAuth(page, ['REGISTERED_CITIZEN']);
  await page.goto('/citizen?section=dossiers_draft');
  await expect(page.getByText('Không có hồ sơ nào ở trạng thái "Bản nháp".')).toBeVisible();
  await expect(page.getByRole('button', { name: /Chi tiết/i })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Nộp tiền kiểm ngay' })).toHaveCount(0);
  await expect(page.getByText('Đủ điều kiện nộp', { exact: false })).toHaveCount(0);
});

test('Catalog không tạo hồ sơ localStorage khi dịch vụ hồ sơ chưa tích hợp', async ({ page }) => {
  await mockWorkspaceAuth(page, ['REGISTERED_CITIZEN']);
  await mockCatalog(page);
  await page.goto(`/thu-tuc/${sampleProcedure.id}`);
  const before = await page.evaluate(() => JSON.stringify(localStorage));
  await page.getByRole('button', { name: 'Bắt đầu làm thủ tục', exact: true }).first().click();
  await expect(page.getByText('Chức năng tạo hồ sơ cần kết nối dịch vụ Hồ sơ công dân.', { exact: false })).toBeVisible();
  expect(await page.evaluate(() => JSON.stringify(localStorage))).toBe(before);
});
