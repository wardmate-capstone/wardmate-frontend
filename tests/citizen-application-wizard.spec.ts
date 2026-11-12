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

test('yêu cầu bắt buộc chọn phường/xã khi tạo hồ sơ và truyền wardCode lên server', async ({ page }) => {
  await mockWorkspaceAuth(page, ['REGISTERED_CITIZEN']);
  await mockCatalog(page);

  // Mock API wards
  await page.route('**/api/v1/wards', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { code: 'WARD_A', name: 'Phường Ba Đình' },
        { code: 'WARD_B', name: 'Phường Cống Vị' },
      ]),
    })
  );

  let createdPayload: Record<string, unknown> | null = null;
  await page.route('**/api/v1/applications', route => {
    if (route.request().method() === 'POST') {
      createdPayload = route.request().postDataJSON() as Record<string, unknown>;
      return route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'app-new-01',
          applicationCode: 'HS-20261105-00000001',
          userId: 'ui-test',
          procedureId: sampleProcedure.id,
          procedureTitle: sampleProcedure.title,
          caseCode: 'A',
          status: 'DRAFT',
          formData: {},
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          resubmitCount: 0,
          currentVersionNumber: 0,
          wardCode: createdPayload.wardCode,
        }),
      });
    }
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ items: [], page: 1, pageSize: 50, total: 0 }),
    });
  });

  await page.goto(`/citizen?procedureId=${sampleProcedure.id}&caseCode=A`);

  // Modal tạo hồ sơ mở lên
  await expect(page.getByRole('dialog', { name: 'Chuẩn bị hồ sơ tiền kiểm mới' })).toBeVisible();

  // Đợi danh sách thủ tục và phường tải xong vào dropdown
  const procedureSelect = page.locator('#create-procedure');
  await procedureSelect.click();
  await page.locator('#create-procedure-listbox [role="option"]', { hasText: sampleProcedure.title }).click();
  await expect(procedureSelect).toHaveAttribute('data-value', sampleProcedure.id);

  const wardSelect = page.locator('#create-ward');
  await expect(wardSelect).toBeEnabled();

  // Kiểm tra dropdown Phường/xã tiếp nhận: mặc định là chưa chọn (rỗng)
  await expect(wardSelect).toHaveAttribute('data-value', '');

  // Bấm Tạo hồ sơ nháp khi chưa chọn phường
  await page.getByRole('button', { name: 'Tạo hồ sơ nháp' }).click();

  // Kiểm tra thông báo lỗi validation hiển thị
  await expect(page.locator('#create-ward-error')).toContainText('Phải chọn phường/xã tiếp nhận.');
  expect(createdPayload).toBeNull(); // Chưa có request gửi lên

  // Chọn phường WARD_A
  await wardSelect.click();
  await page.locator('#create-ward-listbox [role="option"]', { hasText: 'Phường A' }).click();

  // Bấm Tạo hồ sơ nháp
  await page.getByRole('button', { name: 'Tạo hồ sơ nháp' }).click();

  // Kiểm tra request đã gửi thành công kèm wardCode
  await expect.poll(() => createdPayload).not.toBeNull();
  expect(createdPayload?.wardCode).toBe('WARD_A');
  expect(createdPayload?.procedureId).toBe(sampleProcedure.id);
});
