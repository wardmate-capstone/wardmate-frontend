import { test, expect } from '@playwright/test';
import { mockWorkspaceAuth } from './fixtures/auth';
import { catalogReply, mockCatalog, sampleProcedure } from './fixtures/procedures';

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
  // WF-CASE-01: nút chung không chọn sẵn trường hợp đầu tiên (người dân tự chọn khi tạo hồ sơ)
  await expect(page.getByRole('link', { name: 'Chuẩn bị hồ sơ', exact: true })).not.toHaveAttribute('href', /caseCode=/);
  // Nút trong từng trường hợp mang đúng mã trường hợp
  const caseA = page.locator('section', { has: page.getByRole('heading', { name: 'Thành phần hồ sơ', exact: true }) }).locator('details', { hasText: 'Trường hợp A' });
  await caseA.locator('summary').click();
  await caseA.getByRole('link', { name: 'Chuẩn bị hồ sơ cho trường hợp này' }).click();
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

test('Chuẩn bị hồ sơ chọn sẵn đúng thủ tục trên URL khi danh sách thủ tục đã có trong cache (L05)', async ({ page }) => {
  await mockWorkspaceAuth(page, ['REGISTERED_CITIZEN']);
  await mockCatalog(page);
  const id = '07000000-0000-0000-0000-000000000011';
  await page.route(`**/api/v1/procedures/${id}`, route => catalogReply(route, { json: { ...sampleProcedure, id, title: 'Thủ tục API số 2' } }));
  await page.goto('/citizen');
  await expect(page.locator('main')).toBeVisible();
  await page.evaluate(path => { history.pushState({}, '', path); dispatchEvent(new PopStateEvent('popstate')); }, `/thu-tuc/${id}`);
  await page.getByRole('link', { name: 'Chuẩn bị hồ sơ', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.locator('#create-procedure')).toHaveText(/Thủ tục API số 2/);
});

test('WF-CASE-01: thủ tục nhiều trường hợp bắt buộc chọn trường hợp, xem trước đúng giấy tờ và gửi caseCode', async ({ page }) => {
  await mockWorkspaceAuth(page, ['REGISTERED_CITIZEN']);
  await mockCatalog(page);
  await page.route('**/api/v1/wards', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([{ code: 'WARD_A', name: 'Phường A' }]) }));
  let createdPayload: Record<string, unknown> | null = null;
  await page.route('**/api/v1/applications', route => {
    if (route.request().method() !== 'POST') return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: [], page: 1, pageSize: 50, total: 0 }) });
    createdPayload = route.request().postDataJSON() as Record<string, unknown>;
    return route.fulfill({ status: 400, contentType: 'application/problem+json', body: JSON.stringify({ code: 'application.invalid_case', title: 'Vui lòng chọn đúng trường hợp của thủ tục.' }) });
  });

  await page.goto(`/citizen?procedureId=${sampleProcedure.id}`);
  const dialog = page.getByRole('dialog', { name: 'Chuẩn bị hồ sơ tiền kiểm mới' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('radio')).toHaveCount(2);
  await page.locator('#create-ward').click();
  await page.locator('#create-ward-listbox [role="option"]', { hasText: 'Phường A' }).click();

  // Chưa chọn trường hợp → chặn ở FE, không gửi request
  await dialog.getByRole('button', { name: 'Tạo hồ sơ nháp' }).click();
  await expect(dialog.getByText('Chọn trường hợp thực hiện thủ tục.')).toBeVisible();
  expect(createdPayload).toBeNull();

  // Chọn TH-B: chỉ thấy giấy tờ chung + giấy tờ của B, không thấy giấy tờ của A
  await dialog.getByRole('radio', { name: /Trường hợp B/ }).check();
  const preview = dialog.getByRole('region', { name: 'Giấy tờ cần chuẩn bị' });
  await expect(preview.getByText('Giấy tờ dùng chung')).toBeVisible();
  await expect(preview.getByText('Giấy tờ trường hợp B')).toBeVisible();
  await expect(preview.getByText('Giấy chứng sinh')).toHaveCount(0);

  // BE trả invalid_case (VD: thủ tục vừa đổi trường hợp) → báo chọn lại, không đóng hộp thoại
  await dialog.getByRole('button', { name: 'Tạo hồ sơ nháp' }).click();
  await expect.poll(() => createdPayload?.caseCode).toBe('B');
  await expect(dialog.getByText('Trường hợp đã chọn không còn hợp lệ. Vui lòng chọn lại.')).toBeVisible();
  await expect(dialog).toBeVisible();
});
