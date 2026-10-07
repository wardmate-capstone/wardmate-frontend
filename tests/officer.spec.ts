import { test, expect } from '@playwright/test';
import { mockWorkspaceAuth } from './fixtures/auth';
test.beforeEach(async ({ page }) => mockWorkspaceAuth(page, ['FRONT_DESK_OFFICER']));

test('Cổng cán bộ: Dashboard hiển thị hiệu suất ca trực và không tràn ngang trên mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/officer');

  // Check header / title
  await expect(page.getByRole('heading', { name: /^Chào buổi (sáng|chiều|tối), Cán bộ .+$/ })).toBeVisible();

  // Check stat cards exist
  await expect(page.getByText('Chờ tiền kiểm').first()).toBeVisible();
  await expect(page.getByText('Đang kiểm tra').first()).toBeVisible();
  await expect(page.getByText('Cần bổ sung').first()).toBeVisible();
  await expect(page.getByText('Đã gửi lại').first()).toBeVisible();
  await expect(page.getByText('Đã duyệt tiền kiểm').first()).toBeVisible();
  await expect(page.getByText('Chờ tiếp nhận').first()).toBeVisible();
  await expect(page.getByRole('region', { name: 'Chỉ số hiệu suất ca trực' })).toBeVisible();
  await expect(page.getByText('Số hồ sơ đã giải quyết hôm nay')).toBeVisible();

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

  // Application table should be visible
  await expect(page.getByRole('table', { name: 'Bảng danh sách hồ sơ hành chính' })).toBeVisible();
  await expect(page.getByText('HS-2026-00125')).toBeVisible();

  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('Cổng cán bộ: Mở Application Review Workspace và kiểm tra các tab nghiệp vụ', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/officer');

  // Go to resubmitted queue or click directly
  await page.getByRole('button', { name: 'Review lại ngay' }).first().click();

  // Review workspace header
  await expect(page.getByText('HS-2026-00128').first()).toBeVisible();
  await expect(page.getByText('Vũ Quốc Trung').first()).toBeVisible();

  // Tabs exist
  await expect(page.getByRole('button', { name: 'Thông tin người dân' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Điều kiện thủ tục' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Checklist thành phần' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Giấy tờ đính kèm/ })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Tờ khai E-form' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Xem trước PDF' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Comment trực tiếp/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /Phiên bản & So sánh/ })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Timeline sự kiện' })).toBeVisible();

  // Test switching to Versions tab
  await page.getByRole('button', { name: /Phiên bản & So sánh/ }).click();
  await expect(page.getByText('Lịch sử phiên bản & Đối chiếu thay đổi')).toBeVisible();
  await expect(page.getByText('Phiên bản V1 (cũ)')).toBeVisible();
  await expect(page.getByText('Phiên bản V2 (mới nộp lại)')).toBeVisible();

  // Action buttons
  await expect(page.getByRole('button', { name: /Yêu cầu bổ sung/ }).first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Duyệt tiền kiểm' }).first()).toBeVisible();
});

test('Cổng cán bộ: Tiếp nhận hồ sơ tại quầy và đối chiếu hồ sơ giấy', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/officer');

  // Open "Tiếp nhận tại quầy"
  await page.getByRole('button', { name: 'Tiếp nhận tại quầy' }).click();

  // Search screen and waiting list
  await expect(page.getByRole('heading', { name: 'Tìm kiếm hồ sơ đã duyệt tiền kiểm' })).toBeVisible();
  await expect(page.getByText('HS-2026-00130')).toBeVisible();

  // Start paper comparison
  await page.getByRole('button', { name: 'Bắt đầu đối chiếu giấy tờ' }).first().click();

  // Comparison columns
  await expect(page.getByRole('heading', { name: 'Hồ sơ điện tử đã duyệt tiền kiểm' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Đối chiếu hồ sơ giấy thực tế tại quầy' })).toBeVisible();

  // Submit button initially disabled until all 4 criteria ticked
  const confirmBtn = page.getByRole('button', { name: 'Xác nhận tiếp nhận chính thức tại quầy' });
  await expect(confirmBtn).toBeDisabled();

  // Check all 4 checkboxes
  await page.locator('#chk-id-card').check();
  await page.locator('#chk-residence').check();
  await page.locator('#chk-printed-form').check();
  await page.locator('#chk-sig-verified').check();

  // Now enabled
  await expect(confirmBtn).toBeEnabled();
});
