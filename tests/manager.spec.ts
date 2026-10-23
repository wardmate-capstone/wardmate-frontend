import { test, expect } from '@playwright/test';
import { mockWorkspaceAuth } from './fixtures/auth';
import { mockAnalytics } from './fixtures/analytics';
import { mockCatalog } from './fixtures/procedures';
test.beforeEach(async ({ page }) => { await mockWorkspaceAuth(page, ['MANAGER']); await mockCatalog(page); await mockAnalytics(page); });

test.describe('Phân hệ Quản lý Điều hành (Manager Workspace)', () => {
  test('Tổng quan là trang mặc định và không tràn ngang trên mobile', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/manager');

    await expect(page.getByRole('heading', { name: 'Tổng quan điều hành', exact: true })).toBeVisible();
    await expect(page.getByText('Kết quả tiền kiểm trong kỳ', { exact: false })).toBeVisible();

    await expect(page.getByRole('img', { name: 'Biểu đồ lượt hoạt động tiền kiểm', exact: true })).toBeVisible();
    await expect(page.getByRole('img', { name: 'Biểu đồ tình trạng hạn tiền kiểm', exact: true })).toBeVisible();
    await expect(page.getByRole('img', { name: 'Biểu đồ phân bố đánh giá', exact: true })).toBeVisible();
    // Kiểm tra không tràn ngang trên mobile
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath('manager-overview-mobile.png'), fullPage: true });
  });

  test('Danh bạ cán bộ: hiển thị theo phường, mở chi tiết và lưu lĩnh vực phụ trách', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/manager');

    // Chuyển sang Cán bộ Một cửa
    await page.locator('aside').getByRole('button', { name: /Cán bộ Một cửa/ }).click();

    await expect(page.getByRole('heading', { name: 'Quản lý Cán bộ Một cửa', exact: true })).toBeVisible();
    await expect(page.getByText('Nguyễn Văn An')).toBeVisible();
    await expect(page.getByText('Trần Thị Mai Hương')).toBeVisible();
    await expect(page.getByText('WARD_A').first()).toBeVisible();

    await page.getByRole('button', { name: 'Phân công lĩnh vực' }).first().click();
    await page.getByRole('checkbox', { name: 'Chứng thực' }).check();
    await page.getByRole('button', { name: 'Lưu phân công' }).click();

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
    await expect(page.getByText('Thống kê theo thủ tục', { exact: false })).toBeVisible();

    // 3. Thống kê lượt tra cứu
    await page.locator('aside').getByRole('button', { name: 'Thống kê lượt tra cứu' }).click();
    await expect(page.getByRole('heading', { name: 'Thống kê Lượt tra cứu', exact: true })).toBeVisible();
    await expect(page.getByText('API thống kê lưu lượng tra cứu sẽ được tích hợp sau.', { exact: false })).toBeVisible();

    // 4. Thống kê biểu mẫu
    await page.locator('aside').getByRole('button', { name: 'Thống kê biểu mẫu' }).click();
    await expect(page.getByRole('heading', { name: 'Thống kê Biểu mẫu & E-Form', exact: true })).toBeVisible();
    await expect(page.getByText('API thống kê biểu mẫu trực tuyến sẽ được tích hợp sau.', { exact: false })).toBeVisible();
  });

  test('Hiệu suất xử lý & Phản hồi người dân: Hiển thị dữ liệu API', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/manager');

    // Hiệu suất cán bộ
    await page.locator('aside').getByRole('button', { name: 'Hiệu suất cán bộ' }).click();
    await expect(page.getByRole('heading', { name: 'Đánh giá Hiệu suất Cán bộ', exact: true })).toBeVisible();
    await expect(page.getByText('Hiệu suất tiền kiểm theo cán bộ', { exact: false })).toBeVisible();

    // Báo cáo phản hồi người dân
    await page.locator('aside').getByRole('button', { name: /Báo cáo phản hồi/ }).click();
    await expect(page.getByRole('heading', { name: 'Báo cáo Phản hồi Người dân', exact: true })).toBeVisible();
    await expect(page.getByText('Hỗ trợ tận tình', { exact: false })).toBeVisible();

    // Mức độ hài lòng
    await page.locator('aside').getByRole('button', { name: 'Mức độ hài lòng' }).click();
    await expect(page.getByRole('heading', { name: 'Đánh giá Mức độ Hài lòng', exact: true })).toBeVisible();
    await expect(page.getByText('Hài lòng (4–5 sao): 100%', { exact: false })).toBeVisible();

    await expect(page.locator('aside').getByRole('button', { name: 'Báo cáo tổng hợp' })).toHaveCount(0);
    await expect(page.locator('aside').getByRole('button', { name: 'Cài đặt quyền' })).toHaveCount(0);
  });
});

 test('Tổng quan hiển thị dữ liệu ba API và điều hướng tới màn chi tiết', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 1000 }); await page.goto('/manager');
  await expect(page.getByRole('heading', { name: 'Tổng quan điều hành', exact: true })).toBeVisible();
  await expect(page.getByText('điểm trung bình', { exact: true })).toBeVisible();
  await expect(page.getByRole('table', { name: 'Dữ liệu lượt hoạt động tiền kiểm', includeHidden: true }).getByText('12', { exact: true })).toHaveText('12');
  await expect(page.getByText('Cần theo dõi:', { exact: false })).toBeVisible();
  await expect(page.getByRole('img', { name: 'Biểu đồ tình trạng hạn tiền kiểm', exact: true })).toBeVisible();
  await expect(page.getByRole('img', { name: 'Biểu đồ phân bố đánh giá', exact: true })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('manager-overview-desktop.png'), fullPage: true });
  await page.getByRole('button', { name: 'Chi tiết hồ sơ', exact: false }).click();
  await expect(page.getByRole('heading', { name: 'Thống kê Hồ sơ Hành chính', exact: true })).toBeVisible();
  await page.locator('aside').getByRole('button', { name: 'Tổng quan', exact: true }).click();
  await page.getByRole('button', { name: 'Xem phản hồi', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Báo cáo Phản hồi Người dân', exact: true })).toBeVisible();
 });

 test('Tổng quan giữ các khối độc lập khi API hài lòng lỗi và dùng chung kỳ lọc', async ({ page }) => {
  await page.route('**/api/v1/analytics/feedback/summary*', async route => {
    const { authReply } = await import('./fixtures/auth');
    return authReply(route, route.request().method() === 'OPTIONS' ? { status: 204 } : { status: 503, json: { title: 'Chưa tải được mức độ hài lòng.' } });
  });
  await page.goto('/manager');
  await expect(page.getByText('Chưa tải được mức độ hài lòng.', { exact: true })).toBeVisible();
  await expect(page.getByRole('table', { name: 'Dữ liệu lượt hoạt động tiền kiểm', includeHidden: true }).getByText('12', { exact: true })).toHaveText('12');
  const request = page.waitForRequest(req => req.url().includes('/analytics/trends?') && new URL(req.url()).searchParams.get('from') === '2024-01-01');
  await page.getByLabel('Từ ngày', { exact: true }).fill('2024-01-01'); await page.getByLabel('Đến ngày', { exact: true }).fill('2024-01-02');
  await page.getByRole('button', { name: 'Áp dụng', exact: true }).click();
  const captured = await request; expect(new URL(captured.url()).searchParams.get('to')).toBe('2024-01-02');
  await expect(page.getByRole('table', { name: 'Dữ liệu lượt hoạt động tiền kiểm', includeHidden: true }).getByText('12', { exact: true })).toHaveText('12');
 });

 test('Tổng quan: dữ liệu rỗng không vẽ tỷ lệ hoặc vòng tròn giả', async ({ page }) => {
  const state = await mockAnalytics(page); state.empty = true;
  await page.goto('/manager');
  await expect(page.getByText('Chưa có hoạt động tiền kiểm trong dữ liệu đã tổng hợp.', { exact: true })).toBeVisible();
  await expect(page.getByText('Chưa có hồ sơ sẵn sàng trong kỳ để phân tích hạn.', { exact: true })).toBeVisible();
  await expect(page.getByText('Chưa có đánh giá trong kỳ đã chọn.', { exact: true })).toBeVisible();
  await expect(page.getByRole('img', { name: 'Biểu đồ tình trạng hạn tiền kiểm', exact: true })).toHaveCount(0);
  await expect(page.getByRole('img', { name: 'Biểu đồ phân bố đánh giá', exact: true })).toHaveCount(0);
  await expect(page.getByText('Hài lòng (4–5 sao): Chưa đủ dữ liệu', { exact: true })).toBeVisible();
 });
