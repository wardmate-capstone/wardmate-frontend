import { expect, test } from '@playwright/test';

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

test('FAQ và carousel có điều khiển truy cập được', async ({ page }) => {
  await page.goto('/#hoi-dap');
  const question = page.getByRole('button', { name: 'Khi nào hệ thống tạo mã QR?' });
  await question.click();
  await expect(page.getByText('Mã QR chỉ được tạo sau khi cán bộ duyệt tiền kiểm.')).toBeVisible();
  await expect(question).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByRole('button', { name: 'Nội dung tiếp theo' })).toBeVisible();
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
  for (const width of [360, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
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
  await page.getByLabel('Số điện thoại hoặc email').fill('an@example.com');
  await page.getByLabel('Mật khẩu', { exact: true }).fill('matkhau123');
  await page.getByLabel('Xác nhận mật khẩu').fill('khongkhop123');
  await page.getByText('Tôi đồng ý với điều khoản sử dụng').click();
  await page.getByRole('button', { name: 'Tạo tài khoản' }).click();
  await expect(page.getByText('Mật khẩu xác nhận chưa khớp.')).toBeVisible();
});
