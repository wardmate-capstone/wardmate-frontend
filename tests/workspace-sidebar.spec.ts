import { expect, test } from '@playwright/test';
import { mockWorkspaceAuth } from './fixtures/auth';

test('manager receives IAM audit directly in the current sidebar', async ({ page }) => {
  await mockWorkspaceAuth(page, ['MANAGER'], ['iam.profile.read', 'iam.audit.read']);
  await page.goto('/manager');
  await page.getByRole('button', { name: 'Nhật ký hoạt động' }).click();
  await expect(page.getByText('Theo dõi chi tiết các thao tác phân quyền')).toBeVisible();
  await expect(page.getByText('Không gian làm việc')).toHaveCount(0);
});

test('role keeps placeholder menu items that do not have API permissions yet', async ({ page }) => {
  await mockWorkspaceAuth(page, ['PROCEDURE_MANAGER']);
  await page.goto('/procedure-manager');
  await expect(page.getByRole('button', { name: 'Thành phần hồ sơ' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Dữ liệu kiến thức AI' })).toBeVisible();
});
