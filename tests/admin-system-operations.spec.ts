import { expect, test } from '@playwright/test';
import { mockSystemOperations, operationId, backup } from './fixtures/systemOperations';
import { authReply } from './fixtures/auth';

test('health renders configured services, unknown/stale states, detail and UTC history filters', async ({ page }) => {
  const state = await mockSystemOperations(page); await page.goto('/admin');
  expect(state.requests).toHaveLength(0);
  await page.locator('aside').getByRole('button', { name: 'Giám sát dịch vụ' }).click();
  await expect(page.getByText('Chưa có kết quả kiểm tra.', { exact: true })).toBeVisible();
  await expect(page.getByText('Kết quả đã cũ, cần kiểm tra lại.')).toBeVisible();
  await expect(page.getByText(/01\/01\/1\b/)).toHaveCount(0);
  await page.getByRole('button', { name: 'Chi tiết dịch vụ iam', exact: true }).click();
  await expect(page.getByRole('dialog').getByText('45 ms', { exact: true })).toBeVisible();
  expect(state.requests.some(item => item.path.endsWith('/health/services/iam'))).toBe(true);
  await page.keyboard.press('Escape');
  await page.getByLabel('Dịch vụ (mã)', { exact: true }).fill(' iam ');
  await page.getByLabel('Từ ngày').fill('2026-11-03'); await page.getByLabel('Đến ngày').fill('2026-11-03');
  await page.getByRole('button', { name: 'Áp dụng' }).click();
  await expect.poll(() => state.requests.at(-1)?.query).toEqual({ service: 'iam', from: '2026-11-02T17:00:00.000Z', to: '2026-11-03T16:59:59.999Z', page: '1', pageSize: '20' });
});

test('health check accepts 202, refreshes later and does not claim completion', async ({ page }) => {
  const state = await mockSystemOperations(page); await page.goto('/admin');
  await page.locator('aside').getByRole('button', { name: 'Giám sát dịch vụ' }).click();
  await expect(page.getByRole('button', { name: 'Chi tiết dịch vụ iam', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Kiểm tra ngay', exact: true }).click();
  await expect(page.getByText(/Chưa có xác nhận hoàn tất riêng/)).toBeVisible();
  await expect.poll(() => state.requests.filter(item => item.path.endsWith('/health/services')).length, { timeout: 10000 }).toBe(2);
  expect(state.requests.filter(item => item.method === 'POST')).toHaveLength(1);
});

test('health rejects a wrong service response and non-202 queue result', async ({ page }) => {
  const state = await mockSystemOperations(page); state.wrongService = true; state.checkStatus = 200;
  await page.goto('/admin'); await page.locator('aside').getByRole('button', { name: 'Giám sát dịch vụ' }).click();
  await page.getByRole('button', { name: 'Chi tiết dịch vụ iam', exact: true }).click();
  await expect(page.getByRole('dialog').getByRole('alert')).toContainText('không đúng dịch vụ');
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Kiểm tra ngay', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Chưa xác nhận được yêu cầu');
  expect(state.requests.filter(item => item.method === 'POST')).toHaveLength(1);
});

test('backup creates a queued request, follows status and verifies file integrity without claiming a restore test', async ({ page }) => {
  const state = await mockSystemOperations(page); state.autoProgress = true;
  await page.goto('/admin'); await page.locator('aside').getByRole('button', { name: 'Sao lưu dữ liệu', exact: true }).click();
  await page.getByRole('button', { name: 'Tạo bản sao lưu', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Dịch vụ cần sao lưu').selectOption('iam');
  await dialog.getByLabel('Lý do sao lưu').fill('   ');
  await dialog.getByRole('button', { name: 'Xếp hàng sao lưu' }).click();
  await expect(dialog.getByText('Lý do cần ít nhất 3 ký tự.')).toBeVisible();
  expect(state.requests.filter(item => item.method === 'POST')).toHaveLength(0);
  await dialog.getByLabel('Lý do sao lưu').fill('  Sao lưu trước bảo trì  ');
  await dialog.getByRole('button', { name: 'Xếp hàng sao lưu' }).click();
  await expect(dialog.getByRole('heading', { name: 'Chi tiết bản sao lưu' })).toBeVisible();
  expect(state.requests.find(item => item.method === 'POST')?.body).toEqual({ serviceName: 'iam', reason: 'Sao lưu trước bảo trì' });
  await expect(dialog.getByRole('button', { name: 'Yêu cầu xác minh', exact: true })).toBeVisible({ timeout: 15000 });
  await dialog.getByRole('button', { name: 'Yêu cầu xác minh', exact: true }).click();
  await expect(dialog.getByText(/không thay thế việc thử khôi phục/).first()).toBeVisible();
  await dialog.getByRole('button', { name: 'Xác nhận yêu cầu', exact: true }).click();
  await expect(dialog.getByText('Đã xác minh tệp', { exact: true })).toBeVisible();
  await expect(dialog.getByText('Chưa có thông tin thử khôi phục', { exact: true })).toBeVisible();
  expect(state.requests.filter(item => item.path.endsWith('/verify'))).toHaveLength(1);

});

test('backup verify errors refresh server details and cannot turn into success', async ({ page }) => {
  const state = await mockSystemOperations(page); state.verifyError = 'system.backup_checksum_mismatch';
  await page.goto('/admin'); await page.locator('aside').getByRole('button', { name: 'Sao lưu dữ liệu', exact: true }).click();
  await page.getByRole('button', { name: 'Chi tiết bản sao lưu ' + operationId }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: 'Yêu cầu xác minh', exact: true }).click();
  await dialog.getByRole('button', { name: 'Xác nhận yêu cầu', exact: true }).click();
  await expect(dialog.getByRole('alert')).toContainText('Mã kiểm tra của tệp không khớp');
  await expect(dialog.getByText('system.backup_checksum_mismatch', { exact: true })).toBeVisible();
  await expect(dialog.getByText('Đã xác minh tệp', { exact: true })).toHaveCount(0);
  expect(state.requests.filter(item => item.path.endsWith('/verify'))).toHaveLength(1);
  await expect(dialog.getByRole('button', { name: 'Yêu cầu xác minh', exact: true })).toBeDisabled();
  state.verifyError = '';
  await dialog.getByRole('button', { name: 'Làm mới chi tiết', exact: true }).click();
  await expect(dialog.getByRole('button', { name: 'Yêu cầu xác minh', exact: true })).toBeEnabled();
  await dialog.getByRole('button', { name: 'Yêu cầu xác minh', exact: true }).click();
  await dialog.getByRole('button', { name: 'Xác nhận yêu cầu', exact: true }).click();
  await expect(dialog.getByText('Đã xác minh tệp', { exact: true })).toBeVisible();
  expect(state.requests.filter(item => item.path.endsWith('/verify'))).toHaveLength(2);
});

for (const code of ['system.backup_in_progress', 'system.backup_runner_unavailable']) {
  test(`backup ${code} preserves form without auto replaying POST`, async ({ page }) => {
    const state = await mockSystemOperations(page); state.createError = code;
    await page.goto('/admin'); await page.locator('aside').getByRole('button', { name: 'Sao lưu dữ liệu', exact: true }).click();
    await page.getByRole('button', { name: 'Tạo bản sao lưu', exact: true }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Dịch vụ cần sao lưu').selectOption('iam'); await dialog.getByLabel('Lý do sao lưu').fill('Lý do kiểm thử');
    await dialog.getByRole('button', { name: 'Xếp hàng sao lưu' }).click();
    await expect(dialog.getByRole('alert')).toBeVisible();
    await expect(dialog.getByLabel('Lý do sao lưu')).toHaveValue('Lý do kiểm thử');
    expect(state.requests.filter(item => item.method === 'POST')).toHaveLength(1);
  });
}

test('backup filtering validates dates, sends server params and rejects mismatched page and detail IDs', async ({ page }) => {
  const state = await mockSystemOperations(page);
  await page.goto('/admin'); await page.locator('aside').getByRole('button', { name: 'Sao lưu dữ liệu', exact: true }).click();
  await page.getByLabel('Từ ngày').fill('2026-11-03'); await page.getByLabel('Đến ngày').fill('2026-11-02');
  await page.getByRole('button', { name: 'Áp dụng' }).click();
  await expect(page.getByText('Ngày kết thúc phải từ ngày bắt đầu trở đi.')).toBeVisible();
  await page.getByLabel('Đến ngày').fill('2026-11-03'); await page.getByLabel('Trạng thái sao lưu').selectOption('Succeeded');
  await page.getByRole('button', { name: 'Áp dụng' }).click();
  await expect.poll(() => state.requests.at(-1)?.query.status).toBe('Succeeded');
  state.wrongId = true;
  await page.getByRole('button', { name: 'Chi tiết bản sao lưu ' + operationId }).click();
  await expect(page.getByRole('dialog').getByRole('alert')).toContainText('không đúng mục đã chọn');
  await page.keyboard.press('Escape'); state.pageMismatch = true;
  await page.getByRole('button', { name: 'Làm mới danh sách' }).click();
  await expect(page.getByRole('alert')).toContainText('không khớp yêu cầu');
});

for (const section of ['Giám sát dịch vụ', 'Sao lưu dữ liệu']) {
  test(`${section} handles disabled and permission errors without faking empty data`, async ({ page }) => {
    const state = await mockSystemOperations(page); state.error = section === 'Giám sát dịch vụ' ? 'system.health_disabled' : 'analytics.forbidden';
    await page.goto('/admin'); await page.locator('aside').getByRole('button', { name: section, exact: true }).click();
    await expect(page.getByRole('alert').first()).toBeVisible();
    state.error = ''; state.empty = true;
    await page.getByRole('button', { name: section === 'Giám sát dịch vụ' ? 'Làm mới trạng thái' : 'Làm mới danh sách' }).click();
    await expect(page.getByText(section === 'Giám sát dịch vụ' ? 'Chưa có dịch vụ được cấu hình giám sát.' : 'Không có bản sao lưu phù hợp.')).toBeVisible();
  });
}

test('operations schemas enforce boundaries and mobile detail stays inside viewport', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 }); await mockSystemOperations(page); await page.goto('/admin');
  const values = await page.evaluate(async () => {
    const m = await import('/src/lib/api/systemOperations.ts');
    return [2, 3, 500, 501].map(n => m.createBackupSchema.safeParse({ serviceName: 'iam', reason: 'a'.repeat(n) }).success);
  });
  expect(values).toEqual([false, true, true, false]);
  await page.getByRole('button', { name: 'Mở menu quản trị' }).click();
  await page.locator('aside').getByRole('button', { name: 'Sao lưu dữ liệu', exact: true }).click();
  await page.getByRole('button', { name: 'Chi tiết bản sao lưu ' + operationId }).click();
  await expect(page.getByRole('dialog').getByText('Mã SHA-256', { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/admin-backup-mobile.png' });
});

test('verify rejects contradictory metadata even when the server returns HTTP 200', async ({ page }) => {
  await mockSystemOperations(page);
  let patch: Record<string, unknown> = {};
  await page.route('**/api/v1/system/backups/*/verify', route => authReply(route, { json: { ...backup, status: 'Verified', verifiedAtUtc: '2026-11-04T08:00:00Z', ...patch } }));
  await page.goto('/admin');
  for (const value of [{ sha256: null }, { sizeBytes: null }, { sizeBytes: 0 }, { errorCode: 'checksum_mismatch' }, { verifiedAtUtc: null }, { verifiedAtUtc: '0001-01-01T00:00:00Z' }]) {
    patch = value;
    const error = await page.evaluate(async id => {
      const { systemOperationsApi } = await import('/src/lib/api/systemOperations.ts');
      try { await systemOperationsApi.verify(id); return null; }
      catch (error) { return error instanceof Error ? error.message : String(error); }
    }, operationId);
    expect(error).toContain('Kết quả xác minh thiếu thông tin');
  }
});

test('verify reads current status before posting and blocks a backup that became Failed', async ({ page }) => {
  const state = await mockSystemOperations(page);
  await page.goto('/admin'); await page.locator('aside').getByRole('button', { name: 'Sao lưu dữ liệu', exact: true }).click();
  await page.getByRole('button', { name: 'Chi tiết bản sao lưu ' + operationId }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: 'Yêu cầu xác minh', exact: true }).click();
  state.backup.status = 'Failed';
  await dialog.getByRole('button', { name: 'Xác nhận yêu cầu', exact: true }).click();
  await expect(dialog.getByRole('alert')).toContainText('chưa ở trạng thái có thể xác minh');
  expect(state.requests.filter(item => item.path.endsWith('/verify'))).toHaveLength(0);
});

test('failed re-verification clears the former verified state and renders the new backend errors', async ({ page }) => {
  const state = await mockSystemOperations(page);
  state.backup = { ...state.backup, status: 'Verified', verifiedAtUtc: '2026-11-03T08:01:00Z' };
  await page.goto('/admin'); await page.locator('aside').getByRole('button', { name: 'Sao lưu dữ liệu', exact: true }).click();
  await page.getByRole('button', { name: 'Chi tiết bản sao lưu ' + operationId }).click();
  const dialog = page.getByRole('dialog');
  for (const [code, message] of [
    ['system.backup_storage_unavailable', 'Kho lưu trữ sao lưu chưa sẵn sàng'],
    ['system.backup_verification_busy', 'đang xác minh hoặc dọn bản sao lưu'],
    ['system.backup_size_limit', 'vượt giới hạn xác minh'],
    ['system.backup_size_mismatch', 'Kích thước tệp không khớp'],
    ['system.backup_verifier_unavailable', 'chưa có công cụ pg_restore'],
    ['system.backup_verification_timeout', 'bị gián đoạn hoặc hết thời gian'],
    ['system.backup_verification_unavailable', 'chưa thể đọc hoặc xác minh tệp'],
  ]) {
    state.verifyError = code;
    await dialog.getByRole('button', { name: 'Yêu cầu xác minh', exact: true }).click();
    await dialog.getByRole('button', { name: 'Xác nhận yêu cầu', exact: true }).click();
    await expect(dialog.getByRole('alert')).toContainText(message);
    await expect(dialog.getByRole('button', { name: 'Yêu cầu xác minh', exact: true })).toBeDisabled();
    await expect(dialog.getByText('Đã xác minh tệp', { exact: true })).toHaveCount(0);
    if (code !== 'system.backup_verification_busy') await expect(dialog.getByText(code, { exact: true })).toBeVisible();
    await dialog.getByRole('button', { name: 'Làm mới chi tiết', exact: true }).click();
    await expect(dialog.getByRole('button', { name: 'Yêu cầu xác minh', exact: true })).toBeEnabled();
  }
  expect(state.requests.filter(item => item.path.endsWith('/verify'))).toHaveLength(7);
});
