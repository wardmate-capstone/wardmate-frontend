import { expect, test } from '@playwright/test';
import { mockWorkspaceAuth } from './fixtures/auth';

test('hiển thị thông điệp chính và tìm kiếm tiếng Việt không dấu', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Chuẩn bị hồ sơ đúng ngay từ đầu' })).toBeVisible();
  await page.getByLabel('Tra cứu thủ tục hành chính').fill('khai sinh');
  await page.getByRole('button', { name: 'Tìm kiếm' }).click();
  await expect(page.getByRole('button', { name: /Đăng ký khai sinh/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /Đăng ký kết hôn/ })).toHaveCount(0);
});

test('ô tìm kiếm trống có thông báo hướng dẫn', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Tìm kiếm' }).click();
  await expect(page.getByText('Vui lòng nhập tên thủ tục hoặc nhu cầu cần giải quyết.')).toBeVisible();
});

test('menu mobile mở, đóng và không tràn ngang', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Mở menu' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Điều hướng trên điện thoại' })).toBeVisible();
  await page.getByRole('button', { name: 'Đóng menu' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('không tràn ngang ở các cỡ màn hình chính', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  for (const width of [360, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await expect.poll(
      () => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      { message: `viewport ${width}px` },
    ).toBe(true);
  }
});

test('điều hướng đến đăng nhập và chuyển sang đăng ký', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Đăng nhập' }).click();
  await expect(page).toHaveURL(/\/dang-nhap$/);
  await expect(page.getByRole('heading', { name: 'Đăng nhập' })).toBeVisible();
  await page.getByRole('link', { name: 'Đăng ký ngay' }).click();
  await expect(page).toHaveURL(/\/dang-ky$/);
  await expect(page.getByRole('heading', { name: 'Đăng ký tài khoản' })).toBeVisible();
});

test('đăng ký kiểm tra mật khẩu xác nhận', async ({ page }) => {
  await page.goto('/dang-ky');
  await page.getByLabel('Họ và tên').fill('Nguyễn Văn An');
  await page.getByLabel('Tên đăng nhập', { exact: true }).fill('nguyenvanan');
  await page.getByLabel('Email', { exact: true }).fill('an@example.com');
  await page.getByLabel('Mật khẩu', { exact: true }).fill('matkhau123');
  await page.getByLabel('Xác nhận mật khẩu').fill('khongkhop123');
  await page.getByText('Tôi đồng ý với điều khoản sử dụng').click();
  await page.getByRole('button', { name: 'Tạo tài khoản' }).click();
  await expect(page.getByText('Mật khẩu xác nhận chưa khớp.')).toBeVisible();
});

test('quên mật khẩu gửi hướng dẫn khôi phục và quay lại đăng nhập', async ({ page }) => {
  await page.goto('/dang-nhap');
  await page.getByRole('link', { name: 'Quên mật khẩu?' }).click();
  await expect(page).toHaveURL(/\/quen-mat-khau$/);
  await expect(page.getByRole('heading', { name: 'Quên mật khẩu' })).toBeVisible();

  await page.getByLabel('Số điện thoại hoặc email').fill('an@example.com');
  await page.getByRole('button', { name: 'Gửi hướng dẫn khôi phục' }).click();
  await expect(page.getByRole('heading', { name: 'Kiểm tra thông tin liên hệ' })).toBeVisible();
  await page.getByRole('link', { name: 'Tiếp tục đặt mật khẩu' }).click();
  await expect(page).toHaveURL(/\/dat-lai-mat-khau$/);
});

test('đặt lại mật khẩu kiểm tra xác nhận và hiển thị trạng thái hoàn tất', async ({ page }) => {
  await page.goto('/dat-lai-mat-khau');
  await page.getByLabel('Mật khẩu mới', { exact: true }).fill('matkhau123');
  await page.getByLabel('Xác nhận mật khẩu mới', { exact: true }).fill('khongkhop123');
  await page.getByRole('button', { name: 'Cập nhật mật khẩu' }).click();
  await expect(page.getByRole('alert')).toHaveText('Mật khẩu xác nhận chưa khớp.');

  await page.getByLabel('Xác nhận mật khẩu mới', { exact: true }).fill('matkhau123');
  await page.getByRole('button', { name: 'Cập nhật mật khẩu' }).click();
  await expect(page.getByRole('heading', { name: 'Đặt lại mật khẩu thành công' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Đăng nhập ngay' })).toHaveAttribute('href', '/dang-nhap');
});

test('trang không tìm thấy có lối quay về rõ ràng và không tràn ngang', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/duong-dan-khong-ton-tai');
  await expect(page.getByRole('heading', { name: 'Không tìm thấy trang bạn cần' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Về trang chủ' })).toHaveAttribute('href', '/');
  await expect(page.locator('#main').getByRole('link', { name: 'Tra cứu thủ tục' })).toHaveAttribute('href', '/#thu-tuc');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('trang hỏi đáp mở câu trả lời và gửi thắc mắc', async ({ page }) => {
  await page.goto('/hoi-dap');
  await expect(page.getByRole('heading', { name: 'Câu hỏi thường gặp' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Khi nào hệ thống tạo mã QR?' })).toBeVisible();
  await page.getByRole('button', { name: 'Khi nào hệ thống tạo mã QR?' }).click();
  await expect(page.getByText('Mã QR chỉ được tạo sau khi cán bộ duyệt tiền kiểm.')).toBeVisible();

  await page.getByLabel('Chủ đề').selectOption('ho-so');
  await page.getByLabel('Câu hỏi của bạn').fill('Tôi cần bổ sung tài liệu như thế nào?');
  await page.getByRole('button', { name: 'Gửi câu hỏi' }).click();
  await expect(page.getByRole('heading', { name: 'Cảm ơn bạn đã gửi thắc mắc' })).toBeVisible();
});

test('trang hồ sơ cho phép chỉnh sửa và lưu thông tin cá nhân', async ({ page }) => {
  await mockWorkspaceAuth(page, ['REGISTERED_CITIZEN']);
  await page.goto('/citizen');
  await page.getByRole('button', { name: 'Hồ sơ cá nhân', exact: true }).click();
  await page.getByRole('button', { name: 'Chỉnh sửa thông tin' }).click();
  await page.locator('form input[type="text"]').first().fill('Nguyễn Minh Anh Mẫu');
  await page.locator('form button[type="submit"]').click();
  await expect(page.getByText('Nguyễn Minh Anh Mẫu').first()).toBeVisible();
  await expect(page.getByText('Đã cập nhật thông tin hồ sơ thành công.')).toBeVisible();
});

test('trang thủ tục hỗ trợ tìm kiếm không dấu, lọc lĩnh vực và trạng thái rỗng', async ({ page }) => {
  await page.goto('/thu-tuc');
  await expect(page.getByRole('heading', { name: 'Thủ tục hành chính' })).toBeVisible();

  await page.getByLabel('Tên thủ tục hoặc nhu cầu của bạn').fill('khai sinh');
  await expect(page.getByRole('link', { name: /Xem Đăng ký khai sinh/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /Xem Đăng ký kết hôn/ })).toHaveCount(0);

  await page.getByRole('button', { name: /Chứng thực/ }).click();
  await expect(page.getByText('Chưa tìm thấy thủ tục phù hợp')).toBeVisible();
  await page.getByRole('button', { name: 'Xem tất cả thủ tục' }).click();
  await expect(page.getByText('15 thủ tục phù hợp')).toBeVisible();
});

test('trang quản trị hiển thị tổng quan và menu mobile không tràn ngang', async ({ page }) => {
  await mockWorkspaceAuth(page, ['IT_ADMIN']);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/admin');

  await expect(page.getByRole('heading', { name: 'Trung tâm quản trị' })).toBeVisible();
  await expect(page.getByText('Thủ tục đang áp dụng', { exact: false }).first()).toBeVisible();
  await page.getByRole('button', { name: 'Mở menu quản trị' }).click();
  await expect(page.getByRole('complementary', { name: 'Điều hướng quản trị' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('sidebar quản trị có thể thu gọn trên desktop', async ({ page }) => {
  await mockWorkspaceAuth(page, ['IT_ADMIN']);
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/admin');

  await page.getByRole('button', { name: 'Thu gọn thanh điều hướng' }).click();
  await expect(page.getByRole('button', { name: 'Mở rộng thanh điều hướng' })).toBeVisible();
  await expect.poll(() => page.locator('#admin-sidebar').evaluate((element) => element.getBoundingClientRect().width)).toBe(84);
  await page.getByRole('button', { name: 'Mở rộng thanh điều hướng' }).click();
  await expect.poll(() => page.locator('#admin-sidebar').evaluate((element) => element.getBoundingClientRect().width)).toBe(268);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('public procedures paginate, preserve URL state and fit mobile', async ({ page }) => {
  await page.goto('/thu-tuc');
  const rows = page.locator('.procedures-list > li');
  const pagination = page.getByRole('navigation', { name: 'Phân trang thủ tục' });
  await expect(rows).toHaveCount(5);
  await expect(pagination.getByRole('button', { name: 'Trang trước', exact: true })).toBeDisabled();
  await pagination.getByRole('button', { name: 'Trang 2', exact: true }).click();
  await expect(page).toHaveURL(/page=2/);
  await expect(page.getByRole('status')).toContainText('6–10 / 15');
  await expect(page.getByRole('heading', { name: '15 thủ tục phù hợp' })).toBeFocused();
  await expect(page.getByRole('link', { name: 'Xem Đăng ký khai tử', exact: true })).toBeVisible();
  await pagination.getByRole('button', { name: 'Trang sau', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('11–15 / 15');
  await expect(pagination.getByRole('button', { name: 'Trang sau', exact: true })).toBeDisabled();
  await page.goBack();
  await expect(pagination.getByRole('button', { name: 'Trang 2', exact: true })).toHaveAttribute('aria-current', 'page');

  const search = page.getByLabel('Tên thủ tục hoặc nhu cầu của bạn');
  await search.fill('  DANG   KY  ');
  await expect(page.getByRole('status')).toContainText('Trang 1/');
  await expect(rows).toHaveCount(5);
  await page.reload();
  await expect(search).toHaveValue('  DANG   KY  ');
  await page.getByRole('complementary', { name: 'Lọc theo lĩnh vực' }).getByRole('button', { name: /Chứng thực/ }).click();
  await expect(page.getByText('Chưa tìm thấy thủ tục phù hợp')).toBeVisible();
  await expect(pagination).toHaveCount(0);
  await page.getByRole('button', { name: 'Bỏ bộ lọc từ khóa' }).click();
  await expect(rows).toHaveCount(4);
  await expect(page.getByRole('status')).toContainText('1–4 / 4');
  await page.getByRole('button', { name: 'Xóa bộ lọc', exact: true }).click();
  await expect(page.getByRole('heading', { name: '15 thủ tục phù hợp' })).toBeVisible();

  await page.goto('/thu-tuc?page=999');
  await expect(page.getByRole('status')).toContainText('Trang 3/3');
  await page.goto('/thu-tuc?page=invalid&category=unknown');
  await expect(page.getByRole('status')).toContainText('Trang 1/3');
  for (const width of [1440, 1024, 768, 390, 360]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    if (width === 1440 || width === 390) {
      await page.screenshot({ path: 'test-results/procedures-' + width + '.png', fullPage: true });
    }
  }
  await search.fill('a'.repeat(150));
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('chi tiết thủ tục hiển thị tab các trường hợp, danh mục giấy tờ cần chuẩn bị và nút tải mẫu', async ({ page }) => {
  // Đi vào thủ tục Đăng ký khai sinh (demo-1)
  await page.goto('/thu-tuc/demo-1');
  await expect(page.getByRole('heading', { name: 'Đăng ký khai sinh', level: 1 })).toBeVisible();

  // Kiểm tra mục lục bên trái có link Thành phần hồ sơ & Quy trình
  const menuLink = page.getByRole('link', { name: 'Thành phần hồ sơ & Quy trình' });
  await expect(menuLink).toBeVisible();

  // Kiểm tra khối Cases & Checklist
  const casesSection = page.locator('#thanh-phan-ho-so');
  await expect(casesSection).toBeVisible();
  await expect(casesSection.getByRole('heading', { name: /Thành phần hồ sơ theo trường hợp/ })).toBeVisible();

  // Tab trường hợp mặc định là Đăng ký khai sinh đúng hạn
  const tabDungHan = page.getByRole('tab', { name: /Đăng ký khai sinh đúng hạn/ });
  await expect(tabDungHan).toHaveAttribute('aria-selected', 'true');

  // Kiểm tra hiển thị danh mục giấy tờ cần chuẩn bị (không có checkbox)
  await expect(casesSection.getByRole('heading', { name: /Giấy tờ, tài liệu cần chuẩn bị/ })).toBeVisible();
  await expect(casesSection.getByRole('heading', { name: /Giấy tờ, tài liệu phải nộp/ })).toBeVisible();
  await expect(casesSection.getByText('Tờ khai đăng ký khai sinh (theo mẫu)')).toBeVisible();
  await expect(casesSection.getByText('Giấy chứng sinh do cơ sở y tế cấp')).toBeVisible();

  // Đảm bảo không có checkbox ở view công khai này
  await expect(casesSection.getByRole('checkbox')).toHaveCount(0);

  // Kiểm tra có nút Tải mẫu
  await expect(casesSection.getByRole('button', { name: 'Tải mẫu' }).first()).toBeVisible();

  // Kiểm tra có nút Bắt đầu làm thủ tục
  const startButton = page.getByRole('button', { name: /Bắt đầu làm thủ tục/ }).first();
  await expect(startButton).toBeVisible();

  // Chuyển sang Tab tình huống khác (Quá hạn)
  const tabQuaHan = page.getByRole('tab', { name: /Đăng ký khai sinh quá hạn/ });
  await tabQuaHan.click();
  await expect(tabQuaHan).toHaveAttribute('aria-selected', 'true');
  await expect(casesSection.getByText('Tờ khai đăng ký khai sinh quá hạn')).toBeVisible();

  // Kiểm tra responsive không bị tràn ngang
  for (const width of [1440, 768, 390]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});
