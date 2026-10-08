import { test, expect } from '@playwright/test';
import { mockWorkspaceAuth } from './fixtures/auth';
test.beforeEach(async ({ page }) => mockWorkspaceAuth(page, ['MANAGER']));

test.describe('Phân hệ Quản lý Điều hành (Manager Workspace)', () => {
  test('Thống kê hồ sơ (trang mặc định): Hiển thị đầy đủ các chỉ số, biểu đồ và không tràn ngang trên mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/manager');

    // Heading mặc định là Thống kê Hồ sơ Hành chính
    await expect(page.getByRole('heading', { name: 'Thống kê Hồ sơ Hành chính', exact: true })).toBeVisible();

    // 4 metric cards trong Thống kê hồ sơ
    await expect(page.getByText('Tổng tiếp nhận')).toBeVisible();
    await expect(page.getByText('Đã giải quyết đúng hạn')).toBeVisible();

    // Kiểm tra không tràn ngang trên mobile
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });

  test('Hồ sơ công dân: Hiển thị danh sách và chuyển sang Trang Chi tiết Hồ sơ công dân', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/manager');

    // Chuyển sang Cán bộ Một cửa
    await page.locator('aside').getByRole('button', { name: /Cán bộ Một cửa/ }).click();

    await expect(page.getByRole('heading', { name: 'Quản lý Cán bộ Một cửa', exact: true })).toBeVisible();
    await expect(page.getByText('Nguyễn Văn An')).toBeVisible();
    await expect(page.getByText('Trần Thị Mai Hương')).toBeVisible();

    // Mở TRANG CHI TIẾT hồ sơ cán bộ
    await page.getByRole('button', { name: 'Xem chi tiết' }).first().click();

    // Kiểm tra các phần trên Trang chi tiết
    await expect(page.getByRole('heading', { name: 'Nguyễn Văn An' })).toBeVisible();
    await expect(page.getByText('Thông tin Định danh & Nhân thân')).toBeVisible();
    await expect(page.getByText('001092008128').first()).toBeVisible();

    // Quay lại danh sách
    await page.getByRole('button', { name: /Quay lại danh sách/ }).click();
    await expect(page.getByRole('heading', { name: 'Quản lý Cán bộ Một cửa', exact: true })).toBeVisible();
  });

  test('Thống kê hệ thống: Chuyển đổi mượt mà giữa các mục thống kê', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/manager');

    // 1. Thống kê hồ sơ
    await page.locator('aside').getByRole('button', { name: 'Thống kê hồ sơ' }).click();
    await expect(page.getByRole('heading', { name: 'Thống kê Hồ sơ Hành chính', exact: true })).toBeVisible();

    // 2. Thống kê thủ tục
    await page.locator('aside').getByRole('button', { name: 'Thống kê thủ tục' }).click();
    await expect(page.getByRole('heading', { name: 'Thống kê Thủ tục Hành chính', exact: true })).toBeVisible();
    await expect(page.getByText('Đăng ký kết hôn').first()).toBeVisible();

    // 3. Thống kê lượt tra cứu
    await page.locator('aside').getByRole('button', { name: 'Thống kê lượt tra cứu' }).click();
    await expect(page.getByRole('heading', { name: 'Thống kê Lượt tra cứu', exact: true })).toBeVisible();
    await expect(page.getByText('Top Từ khóa Người dân Tìm kiếm')).toBeVisible();

    // 4. Thống kê biểu mẫu
    await page.locator('aside').getByRole('button', { name: 'Thống kê biểu mẫu' }).click();
    await expect(page.getByRole('heading', { name: 'Thống kê Biểu mẫu & E-Form', exact: true })).toBeVisible();
    await expect(page.getByText('BM-HT-01')).toBeVisible();
  });

  test('Hiệu suất xử lý & Phản hồi người dân: Hiển thị đầy đủ báo cáo', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/manager');

    // Hiệu suất cán bộ
    await page.locator('aside').getByRole('button', { name: 'Hiệu suất cán bộ' }).click();
    await expect(page.getByRole('heading', { name: 'Đánh giá Hiệu suất Cán bộ', exact: true })).toBeVisible();
    await expect(page.getByText('Trần Quốc Bảo')).toBeVisible();

    // Báo cáo phản hồi người dân
    await page.locator('aside').getByRole('button', { name: /Báo cáo phản hồi/ }).click();
    await expect(page.getByRole('heading', { name: 'Báo cáo Phản hồi Người dân', exact: true })).toBeVisible();
    await expect(page.getByText('Nguyễn Hoàng Nam')).toBeVisible();

    // Mức độ hài lòng
    await page.locator('aside').getByRole('button', { name: 'Mức độ hài lòng' }).click();
    await expect(page.getByRole('heading', { name: 'Đánh giá Mức độ Hài lòng', exact: true })).toBeVisible();
    await expect(page.getByText('Khảo sát Chi tiết theo 4 Tiêu chí Chuẩn')).toBeVisible();

    await expect(page.locator('aside').getByRole('button', { name: 'Báo cáo tổng hợp' })).toHaveCount(0);
    await expect(page.locator('aside').getByRole('button', { name: 'Cài đặt quyền' })).toHaveCount(0);
  });
});
