import { expect, test } from '@playwright/test';
import { mockSystemAdministration } from './fixtures/systemAdministration';

test('settings reads fresh detail, validates form, saves snapshot and opens config history', async ({ page }) => {
  const state = await mockSystemAdministration(page);
  await page.goto('/admin');
  await page.locator('aside').getByRole('button', { name: 'Cấu hình hệ thống' }).click();
  await expect(page.getByText('Đang dùng giá trị mặc định')).toBeVisible();
  state.setting.value = 10; state.setting.version = 2;
  await page.getByRole('button', { name: 'Chỉnh sửa', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByLabel('Số ngày mới')).toHaveValue('10');
  for (const value of ['', '0', '367', '1.5']) {
    await dialog.getByLabel('Số ngày mới').fill(value);
    await dialog.getByLabel('Lý do thay đổi').fill('Lý do kiểm thử');
    await dialog.getByRole('button', { name: 'Lưu thay đổi' }).click();
    await expect(dialog.getByLabel('Số ngày mới')).toHaveAttribute('aria-invalid', 'true');
  }
  await dialog.getByLabel('Số ngày mới').fill('14');
  await dialog.getByLabel('Lý do thay đổi').fill('   ');
  await dialog.getByRole('button', { name: 'Lưu thay đổi' }).click();
  await expect(dialog.getByText('Lý do cần ít nhất 3 ký tự.')).toBeVisible();
  expect(state.requests.filter(item => item.method === 'PUT')).toHaveLength(0);
  await dialog.getByLabel('Lý do thay đổi').fill('  Điều chỉnh kỳ tổng hợp  ');
  await dialog.getByRole('button', { name: 'Lưu thay đổi' }).click();
  await expect(dialog).toHaveCount(0);
  expect(state.requests.find(item => item.method === 'PUT')?.body).toEqual({ value: 14, expectedVersion: 2, reason: 'Điều chỉnh kỳ tổng hợp' });
  await expect(page.getByRole('cell', { name: '14 ngày', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Xem lịch sử thay đổi' }).click();
  await expect(page.getByRole('tab', { name: 'Thay đổi cấu hình' })).toHaveAttribute('aria-selected', 'true');
});

test('settings conflict preserves draft and requires explicit reload and resubmit', async ({ page }) => {
  const state = await mockSystemAdministration(page); state.conflict = true;
  await page.goto('/admin');
  await page.locator('aside').getByRole('button', { name: 'Cấu hình hệ thống' }).click();
  await page.getByRole('button', { name: 'Chỉnh sửa', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Số ngày mới').fill('14');
  await dialog.getByLabel('Lý do thay đổi').fill('Nội dung nháp cần giữ');
  await dialog.getByRole('button', { name: 'Lưu thay đổi' }).click();
  await expect(dialog.getByText('Cấu hình đã được người khác cập nhật.', { exact: false })).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Lưu thay đổi' })).toBeDisabled();
  await dialog.getByRole('button', { name: 'Đọc lại cấu hình' }).click();
  await expect(dialog.getByText('21 ngày', { exact: true })).toBeVisible();
  await expect(dialog.getByLabel('Số ngày mới')).toHaveValue('14');
  await expect(dialog.getByLabel('Lý do thay đổi')).toHaveValue('Nội dung nháp cần giữ');
  expect(state.requests.filter(item => item.method === 'PUT')).toHaveLength(1);
  state.conflict = false;
  await dialog.getByRole('button', { name: 'Lưu thay đổi' }).click();
  await expect(dialog).toHaveCount(0);
  expect(state.requests.filter(item => item.method === 'PUT').at(-1)?.body).toEqual({ value: 14, expectedVersion: 1, reason: 'Nội dung nháp cần giữ' });
});

test('server validation stays in form and focuses field; uncertain save never retries automatically', async ({ page }) => {
  const state = await mockSystemAdministration(page); state.validationError = true;
  await page.goto('/admin');
  await page.locator('aside').getByRole('button', { name: 'Cấu hình hệ thống' }).click();
  await page.getByRole('button', { name: 'Chỉnh sửa', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Lý do thay đổi').fill('Lý do kiểm thử');
  await dialog.getByRole('button', { name: 'Lưu thay đổi' }).click();
  await expect(dialog.getByText('Lý do cần rõ nội dung điều chỉnh.')).toBeVisible();
  await expect(dialog.getByLabel('Lý do thay đổi')).toBeFocused();
  state.validationError = false; state.failAfterSave = true;
  await dialog.getByLabel('Lý do thay đổi').fill('Lý do kiểm thử đầy đủ');
  await dialog.getByRole('button', { name: 'Lưu thay đổi' }).click();
  await expect(dialog.getByRole('button', { name: 'Đọc lại cấu hình' })).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Lưu thay đổi' })).toBeDisabled();
  expect(state.requests.filter(item => item.method === 'PUT')).toHaveLength(2);
  await dialog.getByRole('button', { name: 'Đọc lại cấu hình' }).click();
  await expect(dialog.getByText(/Phiên bản 1/)).toBeVisible();
  await expect(dialog.getByLabel('Lý do thay đổi')).toHaveValue('Lý do kiểm thử đầy đủ');
  expect(state.requests.filter(item => item.method === 'PUT')).toHaveLength(2);
});

test('settings schema boundaries and audit query lengths match contract', async ({ page }) => {
  await mockSystemAdministration(page); await page.goto('/admin');
  const result = await page.evaluate(async () => {
    const m = await import('/src/lib/api/systemAdministration.ts');
    return {
      values: ['1', '366', '0', '367', '', '1.1'].map(value => m.settingFormSchema.safeParse({ value, reason: 'Lý do' }).success),
      reasons: [2, 3, 500, 501].map(n => m.settingFormSchema.safeParse({ value: '1', reason: 'a'.repeat(n) }).success),
      lengths: [100, 101].map(n => m.auditFilterSchema.safeParse({ ...m.emptyAuditFilters, entity: 'e'.repeat(n) }).success),
      traces: [128, 129].map(n => m.auditFilterSchema.safeParse({ ...m.emptyAuditFilters, traceId: 'a'.repeat(n) }).success),
      invalidDate: m.auditFilterSchema.safeParse({ ...m.emptyAuditFilters, from: '2026-02-30' }).success,
      oversizedVersion: m.updateSettingSchema.safeParse({ value: 1, reason: 'abc', expectedVersion: Number.MAX_SAFE_INTEGER + 1 }).success,
    };
  });
  expect(result).toEqual({ values: [true, true, false, false, false, false], reasons: [false, true, true, false], lengths: [true, false], traces: [true, false], invalidDate: false, oversizedVersion: false });
});
