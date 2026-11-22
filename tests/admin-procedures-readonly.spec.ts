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
    await expect(page.getByText(/Chế độ chỉ xem/)).toBeVisible();
    await expect(page.getByText(sampleProcedure.title, { exact: true })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Thao tác', exact: true })).toHaveCount(0);
    for (const name of ['Thêm thủ tục', 'Chi tiết', 'Chỉnh sửa', 'Khôi phục phiên bản này']) {
      await expect(page.getByRole('button', { name, exact: true })).toHaveCount(0);
    }
    await expect(page.getByTitle('Xem lịch sử phiên bản')).toHaveCount(0);
    await expect(page.getByTitle('Xem trang công khai của công dân')).toHaveCount(0);
    // Bộ lọc luôn hiện và lọc ngay khi gõ/chọn (không còn nút Tìm kiếm / Bộ lọc).
    await page.getByPlaceholder('Tìm kiếm theo tên hoặc mã thủ tục...').fill('khai sinh');
    await expect.poll(() => catalog.requests.some(request => request.query.get('keyword') === 'khai sinh')).toBe(true);
    await expect(page.getByText(sampleProcedure.title, { exact: true })).toBeVisible();
    await page.getByLabel('Trạng thái', { exact: true }).selectOption('false');
    await expect.poll(() => catalog.requests.some(request => request.query.get('isActive') === 'false')).toBe(true);
    await expect(page.getByLabel('Cấp thực hiện', { exact: true })).toHaveCount(0);
    await page.getByLabel('Sắp xếp', { exact: true }).selectOption('UpdatedAt_desc');
    await expect.poll(() => catalog.requests.some(request => request.query.get('sortBy') === 'UpdatedAt' && request.query.get('isAscending') === 'false')).toBe(true);
    await page.getByRole('button', { name: 'Xóa bộ lọc', exact: true }).click();
    await expect(page.getByText(sampleProcedure.title, { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Trước', exact: true })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Sau', exact: true })).toBeDisabled();
    expect(catalog.requests.every(request => request.method === 'GET' && [
      // /api/v1/procedures: trang Tổng quan Admin (mở đầu tiên) đếm số thủ tục đang áp dụng — chỉ đọc.
      '/api/v1/procedures', '/api/v1/procedures/categories', '/api/v1/procedure-manager/procedures',
    ].includes(request.path))).toBe(true);
    expect(catalog.requests.every(request => !request.query.has('levelOfImplementation'))).toBe(true);
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
