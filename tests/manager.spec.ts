import { test, expect } from '@playwright/test';
import { mockWorkspaceAuth } from './fixtures/auth';
test.beforeEach(async ({ page }) => mockWorkspaceAuth(page, ['MANAGER']));

test.describe('Phân hệ Quản lý Điều hành (Manager Workspace)', () => {
  test('Thống kê hồ sơ là trang mặc định và không tràn ngang trên mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/manager');

    await expect(page.getByRole('heading', { name: 'Thống kê Hồ sơ Hành chính', exact: true })).toBeVisible();
    await expect(page.getByText('API thống kê hồ sơ hệ thống sẽ được tích hợp sau.', { exact: false })).toBeVisible();

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
    await expect(page.getByText('API thống kê thủ tục hành chính sẽ được tích hợp sau.', { exact: false })).toBeVisible();

    // 3. Thống kê lượt tra cứu
    await page.locator('aside').getByRole('button', { name: 'Thống kê lượt tra cứu' }).click();
    await expect(page.getByRole('heading', { name: 'Thống kê Lượt tra cứu', exact: true })).toBeVisible();
    await expect(page.getByText('API thống kê lưu lượng tra cứu sẽ được tích hợp sau.', { exact: false })).toBeVisible();

    // 4. Thống kê biểu mẫu
    await page.locator('aside').getByRole('button', { name: 'Thống kê biểu mẫu' }).click();
    await expect(page.getByRole('heading', { name: 'Thống kê Biểu mẫu & E-Form', exact: true })).toBeVisible();
    await expect(page.getByText('API thống kê biểu mẫu trực tuyến sẽ được tích hợp sau.', { exact: false })).toBeVisible();
  });

  test('Hiệu suất xử lý & Phản hồi người dân: Hiển thị đúng trạng thái chờ API', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/manager');

    // Hiệu suất cán bộ
    await page.locator('aside').getByRole('button', { name: 'Hiệu suất cán bộ' }).click();
    await expect(page.getByRole('heading', { name: 'Đánh giá Hiệu suất Cán bộ', exact: true })).toBeVisible();
    await expect(page.getByText('API đánh giá hiệu suất cán bộ sẽ được tích hợp sau.', { exact: false })).toBeVisible();

    // Báo cáo phản hồi người dân
    await page.locator('aside').getByRole('button', { name: /Báo cáo phản hồi/ }).click();
    await expect(page.getByRole('heading', { name: 'Báo cáo Phản hồi Người dân', exact: true })).toBeVisible();
    await expect(page.getByText('API tiếp nhận ý kiến đóng góp & phản ánh của công dân sẽ được tích hợp sau.', { exact: false })).toBeVisible();

    // Mức độ hài lòng
    await page.locator('aside').getByRole('button', { name: 'Mức độ hài lòng' }).click();
    await expect(page.getByRole('heading', { name: 'Đánh giá Mức độ Hài lòng', exact: true })).toBeVisible();
    await expect(page.getByText('API thống kê chỉ số mức độ hài lòng của công dân sẽ được tích hợp sau.', { exact: false })).toBeVisible();

    await expect(page.locator('aside').getByRole('button', { name: 'Báo cáo tổng hợp' })).toHaveCount(0);
    await expect(page.locator('aside').getByRole('button', { name: 'Cài đặt quyền' })).toHaveCount(0);
  });
});
