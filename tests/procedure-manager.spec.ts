import { test, expect } from '@playwright/test';

test('Quản lý thủ tục: Dashboard hiển thị đầy đủ 6 chỉ số và không tràn ngang trên mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/procedure-manager');

  // Title / banner
  await expect(page.getByRole('heading', { name: 'Hệ thống Quản lý Thủ tục & Chuẩn hóa Biểu mẫu' })).toBeVisible();

  // 6 stat cards
  await expect(page.getByText('Đang công khai').first()).toBeVisible();
  await expect(page.getByText('Bản nháp').first()).toBeVisible();
  await expect(page.getByText('Tạm ngừng').first()).toBeVisible();
  await expect(page.getByText('Biểu mẫu').first()).toBeVisible();
  await expect(page.getByText('Cần cập nhật').first()).toBeVisible();
  await expect(page.getByText('Văn bản pháp lý').first()).toBeVisible();

  // Warning section
  await expect(page.getByText('Hạng mục cần chú ý hoàn thiện')).toBeVisible();

  // Check no horizontal overflow
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('Quản lý thủ tục: Điều hướng mobile và chuyển sang Danh sách thủ tục', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/procedure-manager');

  // Open mobile drawer
  await page.getByRole('button', { name: 'Mở menu điều hướng' }).click();
  await expect(page.getByRole('complementary', { name: 'Điều hướng Quản lý Thủ tục' })).toBeVisible();

  // Click on "Danh sách thủ tục"
  await page.getByRole('button', { name: 'Danh sách thủ tục' }).click();

  // Check table header
  await expect(page.getByRole('heading', { name: 'QUẢN LÝ THỦ TỤC HÀNH CHÍNH' })).toBeVisible();
  await expect(page.getByText('HT-01').first()).toBeVisible();
  await expect(page.getByText('Đăng ký kết hôn').first()).toBeVisible();

  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('Quản lý thủ tục: Mở Chi tiết thủ tục và kiểm tra các tab nghiệp vụ cùng Biểu mẫu Word/PDF', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/procedure-manager');

  const main = page.getByRole('main');

  // Click on procedure HT-01
  await page.locator('aside').getByRole('button', { name: 'Danh sách thủ tục' }).click();
  await main.getByRole('button', { name: 'Chi tiết' }).first().click();

  // Check Detail header
  await expect(main.getByRole('heading', { name: 'Đăng ký kết hôn' })).toBeVisible();
  await expect(main.getByText('Phiên bản V3')).toBeVisible();

  // 7 tabs
  await expect(main.getByRole('button', { name: 'Tổng quan' })).toBeVisible();
  await expect(main.getByRole('button', { name: 'Điều kiện thực hiện' })).toBeVisible();
  await expect(main.getByRole('button', { name: 'Thành phần hồ sơ' })).toBeVisible();
  await expect(main.getByRole('button', { name: 'Quy trình thực hiện' })).toBeVisible();
  await expect(main.getByRole('button', { name: 'Biểu mẫu Word/PDF' })).toBeVisible();
  await expect(main.getByRole('button', { name: 'Văn bản pháp lý' })).toBeVisible();
  await expect(main.getByRole('button', { name: 'Lịch sử thay đổi' })).toBeVisible();

  // Click tab "Thành phần hồ sơ"
  await main.getByRole('button', { name: 'Thành phần hồ sơ' }).click();
  await expect(main.getByText('Danh mục Thành phần Hồ sơ (Checklist Template)')).toBeVisible();
  await expect(main.getByText('Thẻ Căn cước / CCCD của cả hai bên nam, nữ')).toBeVisible();

  // Click tab "Biểu mẫu Word/PDF"
  await main.getByRole('button', { name: 'Biểu mẫu Word/PDF' }).click();
  await expect(main.getByText('Biểu mẫu Word & PDF chuẩn áp dụng')).toBeVisible();
  await expect(main.getByText('BM-HT-01')).toBeVisible();
  await expect(main.getByText('Tờ khai đăng ký kết hôn')).toBeVisible();
  await expect(main.getByRole('button', { name: 'Mở soạn thảo (Citizen Editor & PDF)' })).toBeVisible();

  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('Quản lý thủ tục: Mở Stepper Wizard 8 bước tạo thủ tục', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/procedure-manager');

  // Click "+ Thêm thủ tục" in header
  await page.getByRole('button', { name: 'Thêm thủ tục' }).first().click();

  // Stepper modal is visible
  await expect(page.getByRole('heading', { name: 'Tạo mới Thủ tục Hành chính (8 bước chuẩn)' })).toBeVisible();
  await expect(page.getByText('Bước 1/8: Thông tin chung')).toBeVisible();

  // Navigate to step 2
  await page.getByRole('button', { name: 'Tiếp tục' }).click();
  await expect(page.getByText('Bước 2/8: Điều kiện thực hiện')).toBeVisible();

  // Navigate to step 3
  await page.getByRole('button', { name: 'Tiếp tục' }).click();
  await expect(page.getByText('Bước 3/8: Thành phần hồ sơ')).toBeVisible();

  // Close modal
  await page.getByRole('button', { name: 'Lưu bản nháp' }).click();
  await expect(page.getByRole('heading', { name: 'Tạo mới Thủ tục Hành chính (8 bước chuẩn)' })).toHaveCount(0);
});

test('Quản lý thủ tục: Quản lý Biểu mẫu Word/PDF và Trải nghiệm Soạn thảo Công dân', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/procedure-manager');

  // Navigate to Biểu mẫu from sidebar using "Danh sách biểu mẫu"
  await page.locator('aside').getByRole('button', { name: /Danh sách biểu mẫu/ }).click();

  const main = page.getByRole('main');

  // Sub tabs & Header
  await expect(main.getByRole('heading', { name: /QUẢN LÝ BIỂU MẪU/ })).toBeVisible();
  await expect(main.getByRole('button', { name: 'Danh sách biểu mẫu', exact: true })).toBeVisible();
  await expect(main.getByRole('button', { name: '+ Upload biểu mẫu' })).toBeVisible();
  await expect(main.getByRole('button', { name: 'Phiên bản biểu mẫu' })).toBeVisible();
  await expect(main.getByRole('button', { name: 'Gắn vào thủ tục' })).toBeVisible();

  // Check form cards
  await expect(main.getByText('Tờ khai đăng ký kết hôn').first()).toBeVisible();
  await expect(main.getByText('Tờ khai đăng ký khai sinh').first()).toBeVisible();

  // Switch to Upload tab from view
  await main.getByRole('button', { name: '+ Upload biểu mẫu' }).click();
  await expect(main.getByRole('heading', { name: 'UPLOAD / TẠO MỚI BIỂU MẪU CHUẨN' })).toBeVisible();
  await expect(main.getByText('File Word (.doc/.docx) *')).toBeVisible();
  await expect(main.getByText('Chọn tệp Word')).toBeVisible();

  // Switch to Versions tab
  await main.getByRole('button', { name: 'Phiên bản biểu mẫu' }).click();
  await expect(main.getByText('Lịch sử các phiên bản')).toBeVisible();

  // Switch to Attach tab
  await main.getByRole('button', { name: 'Gắn vào thủ tục' }).click();
  await expect(main.getByRole('heading', { name: 'GẮN BIỂU MẪU VÀO THỦ TỤC HÀNH CHÍNH' })).toBeVisible();

  // Test sidebar direct subitem navigation to "Upload biểu mẫu"
  await page.locator('aside').getByRole('button', { name: 'Upload biểu mẫu' }).click();
  await expect(main.getByRole('heading', { name: 'UPLOAD / TẠO MỚI BIỂU MẪU CHUẨN' })).toBeVisible();

  // Back to list & open Citizen Form Fill modal
  await page.locator('aside').getByRole('button', { name: /Danh sách biểu mẫu/ }).click();
  const testCitizenBtn = main.getByRole('button', { name: 'Mở soạn thảo (Citizen Editor)' }).first();
  await testCitizenBtn.click();

  // Modal is opened
  await expect(page.getByText('CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM')).toBeVisible();
  await expect(page.getByText('Độc lập - Tự do - Hạnh phúc')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Lưu bản nháp' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Xuất PDF nộp tiền kiểm' })).toBeVisible();

  // Click Save Draft
  await page.getByRole('button', { name: 'Lưu bản nháp' }).click();
  await expect(page.getByText(/Đã lưu bản nháp.*thành công/)).toBeVisible();

  // Click Export PDF
  await page.getByRole('button', { name: 'Xuất PDF nộp tiền kiểm' }).click();
  await expect(page.getByText(/Đã xuất thành tệp PDF hoàn chỉnh/)).toBeVisible();

  // Close modal
  await page.getByRole('button', { name: 'Đóng cửa sổ soạn thảo' }).click();
  await expect(page.getByText('CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM')).toHaveCount(0);

  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('Quản lý thủ tục: Dữ liệu tri thức AI và kích hoạt đồng bộ RAG', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/procedure-manager');

  // Navigate to AI Knowledge
  await page.getByRole('button', { name: 'Dữ liệu kiến thức AI' }).click();

  await expect(page.getByRole('heading', { name: 'Cơ sở Dữ liệu Tri thức AI (WardMate Intelligence)' })).toBeVisible();
  await expect(page.getByText('Cơ sở dữ liệu Văn bản quy phạm pháp luật')).toBeVisible();

  // Trigger sync button
  const syncBtn = page.getByRole('button', { name: 'Đồng bộ lại' }).first();
  await expect(syncBtn).toBeVisible();
  await syncBtn.click();

  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

