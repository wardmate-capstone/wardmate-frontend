import { expect, test, type Page } from '@playwright/test';
import { loginSchema, registerSchema } from '../src/lib/authSchema';
import { authReply } from './fixtures/auth';
import { loginDestination } from '../src/lib/authRedirect';

test.use({ baseURL: 'http://localhost:4317' });
const tokens = { accessToken: 'session-test', tokenType: 'Bearer', accessTokenExpiresAt: new Date(Date.now() + 3600_000).toISOString(), refreshTokenExpiresAt: new Date(Date.now() + 86400_000).toISOString() };
const user = (roles: string[]) => ({ id: 'test-user', username: 'test', email: 'test@example.test', profile: { fullName: 'Tài khoản kiểm thử' }, roles, permissions: ['profile.read'] });
async function iam(page: Page, roles: string[], refreshStatus = 200) {
  await page.route('http://localhost:5000/**', async route => {
    const path = new URL(route.request().url()).pathname;
    if (route.request().method() === 'OPTIONS') return authReply(route, { status: 204 });
    if (path.endsWith('/refresh-token')) return authReply(route, { status: refreshStatus, json: tokens });
    if (path.endsWith('/users/me')) return authReply(route, { json: user(roles) });
    return authReply(route, { status: 404 });
  });
}

test('Zod follows IAM rules, UTF-8 password ceiling and confirmation', () => {
  const input = { identity: 'demo', password: 'Mật-khẩu', fullName: 'Người Dùng', email: 'demo@example.test', confirmPassword: 'Mật-khẩu', terms: true };
  expect(registerSchema.safeParse(input).success).toBe(true);
  for (const invalid of [{ identity: 'tên sai' }, { password: 'lowercase!' }, { password: 'UPPERCASE' }, { password: 'A!' + 'á'.repeat(36) }, { confirmPassword: 'khác' }, { terms: false }, { fullName: ' ' }]) {
    expect(registerSchema.safeParse({ ...input, ...invalid }).success).toBe(false);
  }
  expect(loginSchema.safeParse({ ...input, password: ' a ' }).success).toBe(true);
});

test('login defaults to the IAM role workspace and preserves safe returnTo', () => {
  for (const [role, destination] of Object.entries({
    IT_ADMIN: '/admin', FRONT_DESK_OFFICER: '/officer', MANAGER: '/manager',
    PROCEDURE_MANAGER: '/procedure-manager', REGISTERED_CITIZEN: '/',
  })) {
    expect(loginDestination([role])).toBe(destination);
    expect(loginDestination([role], 'https://example.test')).toBe(destination);
  }
  expect(loginDestination(['IT_ADMIN'], '/procedure-manager?tab=versions#history')).toBe('/procedure-manager?tab=versions#history');
  expect(loginDestination(['IT_ADMIN', 'MANAGER'])).toBe('/');
  expect(loginDestination([])).toBe('/');
});

test('anonymous deep link preserves query and hash through login', async ({ page }) => {
  await iam(page, [], 401);
  await page.goto('/citizen/ho-so?filter=pending#detail');
  await expect(page).toHaveURL(/\/dang-nhap\?returnTo=/);
  expect(new URL(page.url()).searchParams.get('returnTo')).toBe('/citizen/ho-so?filter=pending#detail');
});

for (const [role, paths] of [
  ['REGISTERED_CITIZEN', ['/citizen', '/cong-dan']],
  ['FRONT_DESK_OFFICER', ['/officer', '/can-bo']],
  ['MANAGER', ['/manager', '/quan-ly']],
  ['PROCEDURE_MANAGER', ['/procedure-manager', '/quan-ly-thu-tuc']],
  ['IT_ADMIN', ['/admin', '/procedure-manager']],
] as const) {
  test(`${role} can open its workspaces after restore`, async ({ page }) => {
    await iam(page, [role]);
    for (const path of paths) {
      await page.goto(path);
      await expect(page.getByText('Đang khôi phục phiên đăng nhập...')).toBeHidden();
      await expect(page.getByText('Bạn không có quyền truy cập trang này')).toBeHidden();
      await expect(page.locator('main')).toBeVisible();
      expect(new URL(page.url()).pathname).toBe(path);
    }
  });
}

test('citizen cannot open admin; IT_ADMIN is not implicitly an officer', async ({ page }) => {
  await iam(page, ['REGISTERED_CITIZEN']);
  await page.goto('/admin');
  await expect(page.getByRole('heading', { name: 'Bạn không có quyền truy cập trang này' })).toBeVisible();
  await page.unrouteAll();
  await iam(page, ['IT_ADMIN']);
  await page.goto('/officer');
  await expect(page.getByRole('heading', { name: 'Bạn không có quyền truy cập trang này' })).toBeVisible();
});

test('bootstrap waits for IAM and keeps a retryable error on 503', async ({ page }) => {
  await iam(page, ['REGISTERED_CITIZEN'], 503);
  await page.goto('/citizen');
  await expect(page.getByRole('heading', { name: 'Chưa thể xác minh phiên đăng nhập' })).toBeVisible();
  expect(new URL(page.url()).pathname).toBe('/citizen');
  await page.unrouteAll();
  await iam(page, ['REGISTERED_CITIZEN']);
  await page.getByRole('button', { name: 'Thử lại' }).click();
  await expect(page.getByRole('heading', { name: 'Chưa thể xác minh phiên đăng nhập' })).toBeHidden();
  await expect(page.locator('main')).toBeVisible();
});

test('late bootstrap cannot overwrite a newly logged in account', async ({ page }) => {
  let release!: () => void;
  const waiting = new Promise<void>(resolve => { release = resolve; });
  let started = false;
  await page.route('http://localhost:5000/**', async route => {
    const path = new URL(route.request().url()).pathname;
    if (route.request().method() === 'OPTIONS') return authReply(route, { status: 204 });
    if (path.endsWith('/refresh-token')) { started = true; await waiting; return authReply(route, { json: { ...tokens, accessToken: 'old-session' } }); }
    if (path.endsWith('/login')) return authReply(route, { json: tokens });
    return authReply(route, { json: user(['REGISTERED_CITIZEN']) });
  });
  await page.goto('/dang-nhap');
  await expect.poll(() => started).toBe(true);
  await page.getByLabel('Tên đăng nhập hoặc email').fill('new-user');
  await page.getByLabel('Mật khẩu', { exact: true }).fill('password');
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  release();
  await expect(page).toHaveURL('http://localhost:4317/');
  await expect(page.getByRole('button', { name: 'Menu tài khoản', exact: true })).toBeVisible();
});

test('server validation is attached to the matching form field', async ({ page }) => {
  await iam(page, [], 401);
  await page.route('http://localhost:5000/api/v1/auth/register', route => authReply(route, { status: 400, json: { errors: { Username: ['Tên đăng nhập không được chấp nhận.'] } } }));
  await page.goto('/dang-ky');
  await page.getByLabel('Họ và tên').fill('Người Kiểm Thử');
  await page.getByLabel('Tên đăng nhập', { exact: true }).fill('demo');
  await page.getByLabel('Email', { exact: true }).fill('demo@example.test');
  await page.getByLabel('Mật khẩu', { exact: true }).fill('Password!');
  await page.getByLabel('Xác nhận mật khẩu').fill('Password!');
  await page.getByLabel('Tôi đồng ý với điều khoản sử dụng').check();
  await page.getByRole('button', { name: 'Tạo tài khoản' }).click();
  await expect(page.getByLabel('Tên đăng nhập', { exact: true })).toHaveAttribute('aria-invalid', 'true');
  await expect(page.getByLabel('Tên đăng nhập', { exact: true })).toHaveAccessibleDescription('Tên đăng nhập không được chấp nhận.');
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/auth-validation-mobile.png', fullPage: true });
});

test('IT_ADMIN menu exposes both approved workspaces, not officer access', async ({ page }) => {
  await iam(page, ['IT_ADMIN']);
  await page.goto('/');
  const accountMenu = page.getByRole('button', { name: 'Menu tài khoản', exact: true });
  await expect(accountMenu).toContainText('Tài khoản kiểm thử');
  await accountMenu.click();
  await expect(page.getByRole('menu', { name: 'Tùy chọn người dùng' })).toBeVisible();
  await expect(page.getByRole('menuitem', { name: /Quản trị hệ thống/ })).toHaveAttribute('href', '/admin');
  await expect(page.getByRole('menuitem', { name: /Quản lý thủ tục/ })).toHaveAttribute('href', '/procedure-manager');
  await expect(page.getByRole('menuitem', { name: /Cổng cán bộ/ })).toHaveCount(0);
});

test('shared dropdown keeps a failed logout retryable and replaces its error toast on success', async ({ page }) => {
  await iam(page, ['REGISTERED_CITIZEN']);
  let requests = 0;
  await page.route('http://localhost:5000/api/v1/auth/revoke-token', route => {
    if (route.request().method() === 'OPTIONS') return authReply(route, { status: 204 });
    return authReply(route, { status: ++requests === 1 ? 503 : 204 });
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Menu tài khoản', exact: true }).click();
  await page.getByRole('menuitem', { name: 'Đăng xuất', exact: true }).press('Enter');
  await expect(page.getByText(/Chưa xác nhận được việc thu hồi phiên/)).toBeVisible();
  await expect(page.getByRole('menuitem', { name: 'Đăng xuất', exact: true })).toBeEnabled();
  await page.getByRole('menuitem', { name: 'Đăng xuất', exact: true }).press('Enter');
  await expect(page.getByText('Đã đăng xuất.', { exact: true })).toBeVisible();
  await expect(page.locator('[data-sonner-toast]')).toHaveCount(1);
  await expect(page.getByRole('menu')).toHaveCount(0);
});

test('citizen menu switches between landing and its workspace, including the Vietnamese alias', async ({ page }) => {
  await iam(page, ['REGISTERED_CITIZEN']);
  await page.goto('/');
  await page.getByRole('button', { name: 'Menu tài khoản', exact: true }).click();
  await expect(page.getByRole('menuitem', { name: /Về trang chủ/ })).toHaveCount(0);
  await page.getByRole('menuitem', { name: /Cổng dịch vụ công dân/ }).click();
  await expect(page).toHaveURL(/\/citizen$/);
  await expect(page.getByRole('heading', { name: 'Tổng quan công dân' })).toBeVisible();
  const citizenAccountMenu = page.getByRole('button', { name: 'Menu tài khoản', exact: true });
  await expect(citizenAccountMenu).toContainText('Tài khoản kiểm thử');
  await citizenAccountMenu.click();
  await expect(page.getByRole('menu', { name: 'Tùy chọn người dùng' })).toBeVisible();
  await expect(page.getByRole('menuitem', { name: /Cổng dịch vụ công dân/ })).toHaveCount(0);
  await page.getByRole('menuitem', { name: /Về trang chủ/ }).click();
  await expect(page).toHaveURL('http://localhost:4317/');
  await page.goto('/cong-dan');
  await expect(page.getByRole('heading', { name: 'Tổng quan công dân' })).toBeVisible();
  await expect(citizenAccountMenu).toContainText('Tài khoản kiểm thử');
  await citizenAccountMenu.click();
  await expect(page.getByRole('menuitem', { name: /Về trang chủ/ })).toBeVisible();
  await expect(page.getByRole('menuitem', { name: /Cổng dịch vụ công dân/ })).toHaveCount(0);
});

for (const [role, path] of [
  ['REGISTERED_CITIZEN', '/citizen'], ['IT_ADMIN', '/admin'],
  ['FRONT_DESK_OFFICER', '/officer'], ['MANAGER', '/manager'],
  ['PROCEDURE_MANAGER', '/procedure-manager'],
]) {
  test(`${role} uses the shared account dropdown and one confirmed logout toast`, async ({ page }) => {
    await iam(page, [role]);
    let complete!: () => void;
    const pending = new Promise<void>(resolve => { complete = resolve; });
    await page.route('http://localhost:5000/api/v1/auth/revoke-token', async route => {
      if (route.request().method() === 'OPTIONS') return authReply(route, { status: 204 });
      expect(route.request().headers().authorization).toBe('Bearer session-test');
      expect(route.request().postData()).toBeNull();
      await pending;
      await authReply(route, { status: 204 });
    });
    await page.goto(path);
    await page.getByRole('button', { name: 'Menu tài khoản', exact: true }).click();
    await expect(page.getByRole('menu', { name: 'Tùy chọn người dùng' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: /Về trang chủ/ })).toHaveCount(role === 'REGISTERED_CITIZEN' ? 1 : 0);
    await expect(page.locator(`[role="menuitem"][href="${path}"]`)).toHaveCount(0);
    await expect(page.locator('aside .admin-sidebar-user')).toHaveCount(0);
    await expect(page.locator('aside').getByRole('button', { name: /Đăng xuất/ })).toHaveCount(0);
    if (role === 'IT_ADMIN') await expect(page.getByRole('menuitem', { name: /Quản lý thủ tục/ })).toBeVisible();
    await expect(page.locator('[data-sonner-toast]')).toHaveCount(0);
    await page.getByRole('menuitem', { name: 'Đăng xuất', exact: true }).press('Enter');
    await expect(page.getByRole('menuitem', { name: 'Đang đăng xuất...' })).toBeDisabled();
    await expect(page.getByText('Đã đăng xuất.', { exact: true })).toHaveCount(0);
    complete();
    await expect(page).toHaveURL('http://localhost:4317/');
    await expect(page.getByText('Đã đăng xuất.', { exact: true })).toBeVisible();
    await expect(page.locator('[data-sonner-toast]')).toHaveCount(1);
  });
}
