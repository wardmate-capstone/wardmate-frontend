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

  // Application table should be visible
  await expect(page.getByRole('table', { name: 'Bảng danh sách hồ sơ hành chính' })).toBeVisible();
  await expect(page.getByText('API danh sách hồ sơ cán bộ Một cửa sẽ được tích hợp sau.', { exact: false })).toBeVisible();

  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('Cổng cán bộ: Không hiển thị thao tác review khi chưa có API hồ sơ', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/officer');

  await expect(page.getByText('Không có hồ sơ nào cần xử lý gấp.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Review lại ngay' })).toHaveCount(0);
});

test('Cổng cán bộ: Tiếp nhận hồ sơ tại quầy và đối chiếu hồ sơ giấy', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/officer');

  // Open "Tiếp nhận tại quầy"
  await page.getByRole('button', { name: 'Tiếp nhận tại quầy' }).click();

  // Search screen and waiting list
  await expect(page.getByRole('heading', { name: 'Tìm kiếm hồ sơ đã duyệt tiền kiểm' })).toBeVisible();
  await expect(page.getByText('Không tìm thấy hồ sơ nào đang chờ tiếp nhận.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Bắt đầu đối chiếu giấy tờ' })).toHaveCount(0);
});
