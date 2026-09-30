import { test, expect } from '@playwright/test';

test.describe('Phân hệ Quản lý Điều hành (Manager Workspace)', () => {
  test('Dashboard hiển thị đầy đủ các chỉ số KPI, biểu đồ và không tràn ngang trên mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/manager');

    // Heading
    await expect(page.getByRole('heading', { name: 'Tổng quan Điều hành', exact: true })).toBeVisible();

    // 4 metric cards
    await expect(page.getByText('Tổng hồ sơ tiếp nhận (T9)')).toBeVisible();
    await expect(page.getByText('Tỷ lệ giải quyết đúng hạn')).toBeVisible();
    await expect(page.getByText('Thời gian xử lý trung bình')).toBeVisible();
    await expect(page.getByText('Mức độ hài lòng người dân')).toBeVisible();

    // Biểu đồ & phân bổ
    await expect(page.getByText('Phân bổ theo Lĩnh vực')).toBeVisible();

    // Kiểm tra không tràn ngang
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });

  test('Hồ sơ công dân: Hiển thị giao diện chuẩn Admin, tìm kiếm và mở Modal chi tiết', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/manager');

    // Chuyển sang Hồ sơ công dân
    await page.locator('aside').getByRole('button', { name: 'Hồ sơ công dân' }).click();

    await expect(page.getByRole('heading', { name: 'Quản lý Hồ sơ Công dân', exact: true })).toBeVisible();
    await expect(page.getByText('Nguyễn Văn An')).toBeVisible();
    await expect(page.getByText('Trần Thị Mai Hương')).toBeVisible();

    // Mở modal xem chi tiết
    await page.getByRole('button', { name: 'Xem chi tiết' }).first().click();
    await expect(page.getByRole('heading', { name: 'Chi tiết hồ sơ công dân', exact: true })).toBeVisible();
    await expect(page.getByText('001092008128')).toBeVisible();

    // Đóng modal
    await page.getByRole('button', { name: 'Đóng', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Chi tiết hồ sơ công dân', exact: true })).toHaveCount(0);

    // Mở modal thêm hồ sơ mới
    await page.getByRole('button', { name: 'Thêm hồ sơ' }).click();
    await expect(page.getByRole('heading', { name: 'Thêm hồ sơ công dân mới', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Hủy bỏ' }).click();
    await expect(page.getByRole('heading', { name: 'Thêm hồ sơ công dân mới', exact: true })).toHaveCount(0);
  });

  test('Thống kê hệ thống: Chuyển đổi mượt mà giữa các mục thống kê', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/manager');

    // 1. Thống kê hồ sơ
    await page.locator('aside').getByRole('button', { name: 'Thống kê hồ sơ' }).click();
    await expect(page.getByRole('heading', { name: 'Thống kê Hồ sơ Hành chính', exact: true })).toBeVisible();
    await expect(page.getByText('Đã giải quyết đúng hạn')).toBeVisible();

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

    // Cài đặt quyền
    await page.locator('aside').getByRole('button', { name: 'Cài đặt quyền' }).click();
    await expect(page.getByRole('heading', { name: 'Cài đặt Phân quyền', exact: true })).toBeVisible();
    await expect(page.getByText('Lãnh đạo UBND (Chủ tịch / Phó Chủ tịch)')).toBeVisible();
  });
});
