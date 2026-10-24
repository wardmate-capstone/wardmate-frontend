import { test, expect } from '@playwright/test';
import { authReply, mockWorkspaceAuth } from './fixtures/auth';
import { mockDocumentWorkflow } from './fixtures/documentWorkflow';
test.beforeEach(async ({ page }) => mockWorkspaceAuth(page, ['FRONT_DESK_OFFICER']));

test('Cổng cán bộ: Dashboard hiển thị hiệu suất ca trực và không tràn ngang trên mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/officer');

  // Check header / title
  await expect(page.getByRole('heading', { name: /^Chào buổi (sáng|chiều|tối), Cán bộ .+$/ })).toBeVisible();

  // Check dashboard content rather than labels in the closed mobile sidebar.
  await expect(page.getByRole('region', { name: 'Tiến độ xử lý hồ sơ trong ca trực' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Hồ sơ ưu tiên xử lý ngay (0)' })).toBeVisible();
  await expect(page.getByRole('complementary')).toHaveCount(0);
  await expect(page.getByRole('region', { name: 'Chỉ số hiệu suất ca trực' })).toBeVisible();
  await expect(page.getByText('API chỉ số hiệu suất cán bộ sẽ được tích hợp sau.', { exact: false })).toBeVisible();

  // Check no QR Scan is present for officer
  await expect(page.getByText('Quét QR')).toHaveCount(0);

  // Check horizontal overflow on mobile
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('Cổng cán bộ: Mở menu điều hướng mobile và chuyển sang Quản lý hồ sơ', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/officer');

  // Open mobile menu
  await page.getByRole('button', { name: 'Mở menu điều hướng cán bộ' }).click();
  await expect(page.getByRole('complementary', { name: 'Thanh điều hướng Cán bộ Một cửa' })).toBeVisible();

  // Click on "Tất cả hồ sơ"
  await page.getByRole('button', { name: 'Tất cả hồ sơ' }).click();

  // Application table and pagination should be visible
  await expect(page.getByRole('table', { name: 'Bảng danh sách hồ sơ hành chính' })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Phân trang hàng đợi' })).toBeVisible();

  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('Cổng cán bộ: Không hiển thị thao tác review khi chưa có API hồ sơ', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/officer');

  await expect(page.getByText('Không có hồ sơ nào cần xử lý gấp.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Review lại ngay' })).toHaveCount(0);
});

// Màn "Tiếp nhận tại quầy" đã gỡ khỏi FE (chưa có hợp đồng tiếp nhận chính thức):
// hồ sơ Giấy tờ sẵn sàng không được có thao tác tiếp nhận/cấp biên nhận giả và không ghi gì lên BE.
test('Cổng cán bộ: Không cấp biên nhận hoặc tiếp nhận giả khi chưa có API', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  const state = await mockDocumentWorkflow(page, 'officer', 'DOCUMENTS_READY');
  await page.goto('/officer');
  await page.getByRole('button', { name: 'Tất cả hồ sơ', exact: true }).click();
  const row = page.getByRole('row').filter({ hasText: 'HS-TEST-01' });
  await expect(row.getByText('Giấy tờ sẵn sàng')).toBeVisible();
  await expect(page.getByRole('button', { name: /Tiếp nhận tại quầy|Cấp biên nhận|Xác nhận tiếp nhận/ })).toHaveCount(0);
  await row.getByRole('button', { name: 'Chi tiết' }).click();
  await expect(page.getByRole('article', { name: 'Không gian làm việc tiền kiểm hồ sơ' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Tiếp nhận tại quầy|Cấp biên nhận|Xác nhận tiếp nhận/ })).toHaveCount(0);
  await expect(page.getByText(/BN-2026-/)).toHaveCount(0);
  expect(state.writes).toHaveLength(0);
});

test('Cổng cán bộ: hồ sơ công dân gửi lại chỉ cho cán bộ phụ trách Review lại', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  const base = { procedureId: '0f0f0f0f-0000-4000-8000-000000000001', procedureTitle: 'Đăng ký khai sinh', status: 'SUBMITTED', createdAt: '2026-10-20T01:00:00Z', submittedAt: '2026-10-22T01:00:00Z', applicantName: 'Nguyễn Văn A' };
  const items = [
    { ...base, id: 'aaaaaaaa-0000-4000-8000-000000000001', applicationCode: 'HS-GUI-LAI', assignedOfficerId: 'ui-test' },
    { ...base, id: 'aaaaaaaa-0000-4000-8000-000000000002', applicationCode: 'HS-CUA-NGUOI-KHAC', assignedOfficerId: 'bbbbbbbb-0000-4000-8000-000000000009' },
    { ...base, id: 'aaaaaaaa-0000-4000-8000-000000000003', applicationCode: 'HS-MOI', assignedOfficerId: null },
  ];
  await page.route('**/api/v1/officer/applications?**', route => authReply(route, { json: { items, page: 1, pageSize: 50, total: items.length } }));
  const assigned: string[] = [];
  await page.route('**/api/v1/officer/applications/*/assign', route => {
    assigned.push(new URL(route.request().url()).pathname.split('/').at(-2)!);
    return authReply(route, { status: 409, json: { title: 'Hồ sơ không còn chờ tiếp nhận.', code: 'application.invalid_status' } });
  });

  await page.goto('/officer');
  await page.getByRole('button', { name: 'Tất cả hồ sơ' }).click();
  const table = page.getByRole('table', { name: 'Bảng danh sách hồ sơ hành chính' });
  const mine = table.getByRole('row').filter({ hasText: 'HS-GUI-LAI' });
  const other = table.getByRole('row').filter({ hasText: 'HS-CUA-NGUOI-KHAC' });
  const fresh = table.getByRole('row').filter({ hasText: 'HS-MOI' });

  await expect(mine.getByText('Đã gửi lại')).toBeVisible();
  await expect(mine.getByRole('button', { name: 'Nhận xử lý' })).toHaveCount(0);
  await expect(other.getByRole('button', { name: 'Review lại' })).toHaveCount(0);
  await expect(other.getByText('Chờ cán bộ phụ trách')).toBeVisible();
  await expect(fresh.getByRole('button', { name: 'Nhận xử lý' })).toBeVisible();

  await mine.getByRole('button', { name: 'Review lại' }).click();
  await expect.poll(() => assigned).toEqual(['aaaaaaaa-0000-4000-8000-000000000001']);
});
