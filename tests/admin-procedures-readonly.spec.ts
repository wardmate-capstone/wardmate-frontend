import { expect, test } from '@playwright/test';
import { mockWorkspaceAuth } from './fixtures/auth';
import { mockCatalog, draftId, sampleProcedure } from './fixtures/procedures';

for (const roles of [['IT_ADMIN'], ['IT_ADMIN', 'PROCEDURE_MANAGER']]) {
  test(`Admin chỉ có danh sách thủ tục: ${roles.join('+')}`, async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    await mockWorkspaceAuth(page, roles);
    const catalog = await mockCatalog(page);
    await page.goto('/admin');
    await page.locator('aside').getByRole('button', { name: 'Danh sách thủ tục', exact: true }).click();
    await expect(page.getByText('Chỉ xem danh sách thủ tục.', { exact: true })).toBeVisible();
    await expect(page.getByText(sampleProcedure.title, { exact: true })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Thao tác', exact: true })).toHaveCount(0);
    for (const name of ['Thêm thủ tục', 'Chi tiết', 'Chỉnh sửa', 'Khôi phục phiên bản này']) {
      await expect(page.getByRole('button', { name, exact: true })).toHaveCount(0);
    }
    await expect(page.getByTitle('Xem lịch sử phiên bản')).toHaveCount(0);
    await expect(page.getByTitle('Xem trang công khai của công dân')).toHaveCount(0);
    await page.getByPlaceholder('Tìm kiếm theo tên hoặc mã thủ tục...').fill('khai sinh');
    await page.getByRole('button', { name: 'Tìm kiếm', exact: true }).click();
    await expect.poll(() => catalog.requests.some(request => request.query.get('keyword') === 'khai sinh')).toBe(true);
    await expect(page.getByText(sampleProcedure.title, { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Bộ lọc', exact: true }).click();
    await page.getByRole('combobox').nth(1).selectOption('false');
    await expect.poll(() => catalog.requests.some(request => request.query.get('isActive') === 'false')).toBe(true);
    await page.getByRole('button', { name: 'Xóa tất cả bộ lọc', exact: true }).click();
    await expect(page.getByText(sampleProcedure.title, { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Trước', exact: true })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Sau', exact: true })).toBeDisabled();
    expect(catalog.requests.every(request => request.method === 'GET' && [
      '/api/v1/procedures/categories', '/api/v1/procedure-manager/procedures',
    ].includes(request.path))).toBe(true);
    expect(pageErrors).toEqual([]);
  });
}

test('Admin không mở chi tiết hoặc bản nháp qua tham số URL', async ({ page }) => {
  await mockWorkspaceAuth(page, ['IT_ADMIN', 'PROCEDURE_MANAGER']);
  const catalog = await mockCatalog(page);
  await page.goto(`/admin?section=drafts&draft=${draftId}`);
  await page.locator('aside').getByRole('button', { name: 'Danh sách thủ tục', exact: true }).click();
  await expect(page.getByText(sampleProcedure.title, { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Chi tiết', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Thêm thủ tục', exact: true })).toHaveCount(0);
  expect(catalog.requests.some(request => request.path.includes('/drafts'))).toBe(false);
  expect(catalog.requests.filter(request => request.method !== 'GET')).toEqual([]);
});
