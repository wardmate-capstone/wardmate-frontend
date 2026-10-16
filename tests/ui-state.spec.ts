import { expect, test } from '@playwright/test';
import { authReply, mockWorkspaceAuth } from './fixtures/auth';
import { catalogReply, mockCatalog, procedureId, sampleProcedure } from './fixtures/procedures';

test('đổi thủ tục giữ phường đã chọn và không mở lại modal từ URL đã xử lý', async ({ page }) => {
  await mockWorkspaceAuth(page, ['REGISTERED_CITIZEN']);
  await mockCatalog(page);
  const secondId = '07000000-0000-0000-0000-000000000011';
  await page.route(`**/api/v1/procedures/${secondId}`, route => catalogReply(route, { json: { ...sampleProcedure, id: secondId, title: 'Thủ tục thứ hai' } }));
  await page.route('**/api/v1/wards', route => authReply(route, { json: [{ code: 'WARD_A', name: 'Phường A' }, { code: 'WARD_B', name: 'Phường B' }] }));
  await page.goto(`/citizen?procedureId=${procedureId}`);
  const modal = page.getByRole('dialog', { name: 'Chuẩn bị hồ sơ tiền kiểm mới' });
  await expect(modal).toBeVisible();
  await expect(modal.getByLabel('Phường/xã tiếp nhận')).toBeEnabled();
  await modal.getByLabel('Phường/xã tiếp nhận').selectOption('WARD_B');
  await modal.getByLabel('Thủ tục hành chính').selectOption(secondId);
  await expect(modal.getByLabel('Thủ tục hành chính')).toHaveValue(secondId);
  await expect(modal.getByLabel('Trường hợp thực hiện')).toBeEnabled();
  await expect(modal.getByLabel('Phường/xã tiếp nhận')).toHaveValue('WARD_B');
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Bỏ thay đổi', exact: true }).click();
  await expect(modal).toHaveCount(0);
  await page.getByRole('button', { name: 'Chuẩn bị hồ sơ mới', exact: true }).click();
  await expect(modal.getByLabel('Thủ tục hành chính')).toHaveValue(secondId);
});

test('danh sách hồ sơ có lỗi và thử lại, phân trang gọi đúng page', async ({ page }) => {
  await mockWorkspaceAuth(page, ['REGISTERED_CITIZEN']);
  await mockCatalog(page);
  let failed = true;
  const requestedPages: string[] = [];
  await page.route('**/api/v1/applications?*', route => {
    const current = new URL(route.request().url()).searchParams.get('page') ?? '1';
    requestedPages.push(current);
    return authReply(route, failed ? { status: 503, json: { title: 'Dịch vụ hồ sơ tạm ngưng.' } } : { json: { items: [], page: Number(current), pageSize: 50, total: 51 } });
  });
  await page.goto('/citizen?section=dossiers_all');
  const retry = page.getByRole('button', { name: 'Thử tải lại hồ sơ' });
  await expect(retry).toBeVisible();
  await expect(page.getByRole('button', { name: 'Trang sau' })).toHaveCount(0);
  failed = false;
  await retry.click();
  await page.getByRole('button', { name: 'Trang sau' }).click();
  await expect(page.getByText(/Trang 2 · 51 hồ sơ/)).toBeVisible();
  expect(requestedPages).toContain('2');
});

test('hồ sơ cán bộ chặn tên sai trước PUT và nút in gọi trình duyệt', async ({ page }) => {
  const auth = await mockWorkspaceAuth(page, ['FRONT_DESK_OFFICER']);
  await page.addInitScript(() => { window.print = () => { document.body.dataset.printed = 'true'; }; });
  await page.goto('/officer');
  await page.getByRole('button', { name: 'Hồ sơ cá nhân', exact: true }).click();
  await page.getByRole('button', { name: 'In phiếu thông tin' }).click();
  await expect(page.locator('body')).toHaveAttribute('data-printed', 'true');
  await page.getByRole('button', { name: 'Chỉnh sửa hồ sơ' }).click();
  const name = page.getByLabel('Họ và tên khai sinh');
  await name.fill('123');
  await page.getByRole('button', { name: 'Lưu thay đổi' }).click();
  await expect(name).toHaveAttribute('aria-invalid', 'true');
  expect(auth.requests.filter(request => request.method === 'PUT' && request.path.endsWith('/profile'))).toEqual([]);
});
