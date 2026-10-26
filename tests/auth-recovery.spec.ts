import { expect, test, type Page } from '@playwright/test';
import { authReply, mockWorkspaceAuth } from './fixtures/auth';

type Captured = { path: string; body: unknown; csrf?: string };

async function mockRecovery(page: Page, verify: (attempt: number) => { status: number; json?: unknown }) {
  const requests: Captured[] = [];
  let attempts = 0;
  await page.route('http://localhost:5000/**', async route => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if (request.method() === 'OPTIONS') return authReply(route, { status: 204 });
    if (path.endsWith('/refresh-token')) return authReply(route, { status: 401, json: { code: 'iam.invalid_token' } });
    if (path === '/api/v1/auth/password-otp/request') {
      requests.push({ path, body: request.postDataJSON(), csrf: request.headers()['x-csrf-protection'] });
      return authReply(route, { status: 202, json: { message: 'Nếu tài khoản hợp lệ, mã OTP đã được gửi.' } });
    }
    if (path === '/api/v1/auth/password-otp/verify-and-change') {
      requests.push({ path, body: request.postDataJSON(), csrf: request.headers()['x-csrf-protection'] });
      return authReply(route, verify(++attempts));
    }
    return authReply(route, { status: 404 });
  });
  return requests;
}

test('quên mật khẩu gửi OTP email rồi đặt lại mật khẩu và về đăng nhập', async ({ page }) => {
  const requests = await mockRecovery(page, attempt => attempt === 1
    ? { status: 400, json: { status: 400, title: 'Mã OTP không hợp lệ hoặc đã hết hạn.', code: 'iam.otp_invalid' } }
    : { status: 200, json: { message: 'Đổi mật khẩu thành công. Vui lòng đăng nhập lại.' } });

  await page.goto('/dang-nhap');
  await page.getByRole('link', { name: 'Quên mật khẩu?' }).click();
  await expect(page).toHaveURL(/\/quen-mat-khau$/);
  await page.getByRole('button', { name: 'Gửi mã xác thực' }).click();
  await expect(page.getByText('Vui lòng nhập email hoặc tên đăng nhập.')).toBeVisible();

  await page.getByLabel('Email hoặc tên đăng nhập').fill('an@example.com');
  await page.getByRole('button', { name: 'Gửi mã xác thực' }).click();
  await expect(page.getByRole('status')).toContainText('Nếu tài khoản hợp lệ, mã OTP đã được gửi.');
  expect(requests[0]).toEqual({
    path: '/api/v1/auth/password-otp/request',
    body: { emailOrUsername: 'an@example.com', channel: 'EMAIL', purpose: 'FORGOT_PASSWORD' },
    csrf: '1',
  });
  await expect(page.getByRole('button', { name: /Gửi lại mã sau \d+s/ })).toBeDisabled();

  await page.getByLabel('Mã xác thực (6 chữ số)').fill('12345');
  await page.getByLabel('Mật khẩu mới', { exact: true }).fill('yeu');
  await page.getByLabel('Xác nhận mật khẩu mới').fill('khac');
  await page.getByRole('button', { name: 'Đặt lại mật khẩu' }).click();
  await expect(page.getByText('Mã xác thực gồm đúng 6 chữ số.')).toBeVisible();
  await expect(page.getByText('Mật khẩu phải có ít nhất 8 ký tự.')).toBeVisible();
  expect(requests).toHaveLength(1);

  await page.getByLabel('Mã xác thực (6 chữ số)').fill('123456');
  await page.getByLabel('Mật khẩu mới', { exact: true }).fill('MatKhau@2026');
  await page.getByLabel('Xác nhận mật khẩu mới').fill('MatKhau@2026');
  await page.getByRole('button', { name: 'Đặt lại mật khẩu' }).click();
  await expect(page.getByText('Mã xác thực không đúng hoặc đã hết hạn.')).toBeVisible();

  await page.getByRole('button', { name: 'Đặt lại mật khẩu' }).click();
  await expect(page).toHaveURL(/\/dang-nhap$/);
  await expect(page.getByText('Đổi mật khẩu thành công. Vui lòng đăng nhập lại.')).toBeVisible();
  expect(requests.at(-1)).toEqual({
    path: '/api/v1/auth/password-otp/verify-and-change',
    body: { emailOrUsername: 'an@example.com', otp: '123456', newPassword: 'MatKhau@2026', confirmNewPassword: 'MatKhau@2026', purpose: 'FORGOT_PASSWORD' },
    csrf: '1',
  });
});

test('gửi OTP quá nhiều lần hiện thông báo chờ và không chuyển bước', async ({ page }) => {
  await page.route('http://localhost:5000/**', async route => {
    const path = new URL(route.request().url()).pathname;
    if (route.request().method() === 'OPTIONS') return authReply(route, { status: 204 });
    if (path === '/api/v1/auth/password-otp/request') {
      return authReply(route, { status: 429, json: { status: 429, title: 'Quá nhiều yêu cầu OTP. Vui lòng đợi một phút.', code: 'iam.otp_rate_limited' } });
    }
    return authReply(route, { status: 401, json: {} });
  });
  await page.goto('/quen-mat-khau');
  await page.getByLabel('Email hoặc tên đăng nhập').fill('an');
  await page.getByRole('button', { name: 'Gửi mã xác thực' }).click();
  await expect(page.getByText('Bạn thao tác quá nhiều lần. Vui lòng chờ khoảng 1 phút rồi thử lại.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Quên mật khẩu' })).toBeVisible();
  await expect(page.locator('input[type=password]')).toHaveCount(0);
});

test('đặt lại mật khẩu không có tài khoản bắt đầu từ bước gửi mã', async ({ page }) => {
  await mockRecovery(page, () => ({ status: 200, json: {} }));
  await page.goto('/dat-lai-mat-khau');
  await expect(page.getByRole('heading', { name: 'Quên mật khẩu' })).toBeVisible();
  await expect(page.locator('input[type=password]')).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Về trang đăng nhập' })).toHaveAttribute('href', '/dang-nhap');
});

test('đổi mật khẩu khi đăng nhập bằng OTP email gửi kèm Bearer và purpose CHANGE_PASSWORD', async ({ page }) => {
  await mockWorkspaceAuth(page, ['IT_ADMIN']);
  const requests: Array<Captured & { auth?: string }> = [];
  await page.route('http://localhost:5000/api/v1/auth/password-otp/**', async route => {
    const request = route.request();
    if (request.method() === 'OPTIONS') return authReply(route, { status: 204 });
    const path = new URL(request.url()).pathname;
    requests.push({ path, body: request.postDataJSON(), auth: request.headers().authorization });
    return path.endsWith('/request')
      ? authReply(route, { status: 202, json: { message: 'Nếu tài khoản hợp lệ, mã OTP đã được gửi.' } })
      : authReply(route, { status: 200, json: { message: 'Đổi mật khẩu thành công. Vui lòng đăng nhập lại.' } });
  });

  await page.goto('/admin');
  await page.locator('aside').getByRole('button', { name: 'Hồ sơ cá nhân' }).click();
  await page.getByRole('button', { name: 'Đổi mật khẩu', exact: true }).click();
  await page.getByRole('radio', { name: 'Xác thực qua email' }).click();
  await page.getByRole('button', { name: 'Gửi mã xác thực qua email' }).click();
  await expect(page.getByRole('status')).toContainText('mã OTP đã được gửi');
  expect(requests[0]).toEqual({
    path: '/api/v1/auth/password-otp/request',
    body: { emailOrUsername: 'demo', channel: 'EMAIL', purpose: 'CHANGE_PASSWORD' },
    auth: 'Bearer ui-test-token',
  });

  await page.getByLabel('Mã xác thực (6 chữ số) *').fill('654321');
  await page.getByLabel('Mật khẩu mới *', { exact: true }).fill('MatKhau@2026');
  await page.getByLabel('Xác nhận mật khẩu mới *').fill('MatKhau@2025');
  await expect(page.getByText('Mật khẩu xác nhận chưa trùng khớp')).toBeVisible();
  await page.getByLabel('Xác nhận mật khẩu mới *').fill('MatKhau@2026');
  await expect(page.getByText('Mật khẩu xác nhận trùng khớp')).toBeVisible();
  await page.getByRole('button', { name: 'Đổi mật khẩu', exact: true }).last().click();
  await expect(page).toHaveURL(/\/dang-nhap/);
  expect(requests.at(-1)).toEqual({
    path: '/api/v1/auth/password-otp/verify-and-change',
    body: { emailOrUsername: 'demo', otp: '654321', newPassword: 'MatKhau@2026', confirmNewPassword: 'MatKhau@2026', purpose: 'CHANGE_PASSWORD' },
    auth: 'Bearer ui-test-token',
  });
});
