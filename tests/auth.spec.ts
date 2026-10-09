import { expect, test, type BrowserContext, type Page, type Route } from '@playwright/test';

// Browser-level mock contract, not proof of the real gateway/CORS configuration.
test.use({ baseURL: 'http://localhost:4317' });
const gateway = 'http://localhost:5000';
const tokenResponse = (accessToken = 'mock-access') => ({
  accessToken, tokenType: 'Bearer',
  accessTokenExpiresAt: new Date(Date.now() + 300_000).toISOString(),
  refreshTokenExpiresAt: new Date(Date.now() + 86_400_000).toISOString(),
});
const cookie = 'refreshToken=mock-refresh; HttpOnly; SameSite=Strict; Path=/api/v1/auth';
async function reply(route: Route, status: number, body?: unknown, setCookie?: string) {
  await route.fulfill({ status, headers: {
    'access-control-allow-origin': 'http://localhost:4317',
    'access-control-allow-credentials': 'true',
    'access-control-allow-headers': 'Content-Type, Authorization, X-CSRF-Protection',
    'access-control-allow-methods': 'GET, POST, OPTIONS',
    ...(setCookie ? { 'set-cookie': setCookie } : {}),
  }, ...(body === undefined ? {} : { contentType: 'application/json', body: JSON.stringify(body) }) });
}
async function mock(context: BrowserContext, handler: (route: Route) => Promise<void>) {
  await context.route(gateway + '/**', async (route) => {
    if (route.request().method() === 'OPTIONS') return reply(route, 204);
    const path = new URL(route.request().url()).pathname;
    if (path === '/api/v1/users/me') return reply(route, 200, {
      id: 'mock-user', username: 'demo', email: 'demo@example.test', profile: { fullName: 'Người Dùng Mẫu' },
      roles: ['REGISTERED_CITIZEN', 'FRONT_DESK_OFFICER'], permissions: ['profile.read'],
    });
    // Every app boot now restores the cookie before deciding whether a route is private.
    if (path.endsWith('/refresh-token') && !route.request().headers().cookie?.includes('refreshToken=')) return reply(route, 401);
    await handler(route);
  });
}
async function fillLogin(page: Page, password = 'mock-password') {
  await page.getByLabel('Tên đăng nhập hoặc email').fill('demo@example.test');
  await page.getByLabel('Mật khẩu', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
}
async function requestPrivate(page: Page) {
  return page.evaluate(async () => {
    const modulePath = '/src/lib/api/index.ts';
    const { api } = await import(modulePath);
    try { return (await api.get('/mock-private')).status; }
    catch { return 0; }
  });
}

test('register sends only required fields, preserves returnTo and never establishes a session', async ({ page, context }) => {
  const requests: string[] = [];
  await mock(context, async (route) => {
    requests.push(new URL(route.request().url()).pathname);
    expect(route.request().postDataJSON()).toEqual({ username: 'demo', email: 'demo@example.test', password: 'Mock-password', fullName: 'Người Dùng Mẫu' });
    expect(route.request().headers()['x-csrf-protection']).toBe('1');
    expect(route.request().headers().authorization).toBeUndefined();
    await reply(route, requests.length === 1 ? 400 : 201,
      requests.length === 1 ? { detail: 'Tên đăng nhập chưa đáp ứng yêu cầu.' } : { id: 'mock-user' });
  });
  await page.goto('/dang-ky?returnTo=%2Fcitizen');
  await page.getByLabel('Họ và tên').fill('Người Dùng Mẫu');
  await page.getByLabel('Tên đăng nhập', { exact: true }).fill('demo');
  await page.getByLabel('Email', { exact: true }).fill('demo@example.test');
  await page.getByLabel('Mật khẩu', { exact: true }).fill('Mock-password');
  await page.getByLabel('Xác nhận mật khẩu').fill('Mock-password');
  await page.getByText('Tôi đồng ý với điều khoản sử dụng').click();
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.evaluate(() => { (document.activeElement as HTMLElement)?.blur(); window.scrollTo({ top: 0, behavior: 'instant' }); });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: `test-results/auth-register-${width}.png`, fullPage: true });
  }
  await page.getByRole('button', { name: 'Tạo tài khoản' }).click();
  await expect(page.getByText('Tên đăng nhập chưa đáp ứng yêu cầu.')).toBeVisible();
  await expect(page.getByLabel('Tên đăng nhập', { exact: true })).toHaveValue('demo');
  await expect(page).toHaveURL(/\/dang-ky\?returnTo=%2Fcitizen$/);
  await page.getByRole('button', { name: 'Tạo tài khoản' }).click();
  await expect(page).toHaveURL(/\/dang-nhap\?returnTo=%2Fcitizen$/);
  expect(requests).toEqual(['/api/v1/auth/register', '/api/v1/auth/register']);
});

test('login uses HttpOnly cookie, RAM token and safe returnTo; reload recovers on authenticated request', async ({ page, context }) => {
  let refreshes = 0;
  await mock(context, async (route) => {
    const req = route.request();
    const path = new URL(req.url()).pathname;
    if (path === '/api/v1/auth/login') {
      expect(req.postDataJSON()).toEqual({ usernameOrEmail: 'demo@example.test', password: ' a ' });
      expect(req.headers()['x-csrf-protection']).toBe('1');
      return reply(route, 200, tokenResponse(), cookie);
    }
    if (path === '/api/v1/auth/refresh-token') {
      refreshes++;
      expect(req.postData()).toBeNull();
      expect(req.headers()['x-csrf-protection']).toBe('1');
      expect(req.headers().authorization).toBeUndefined();
      expect(req.headers().cookie).toContain('refreshToken=mock-refresh');
      return reply(route, 200, tokenResponse('mock-renewed'), cookie);
    }
    expect(path).toBe('/mock-private');
    return reply(route, req.headers().authorization ? 200 : 401, {});
  });
  await page.goto('/dang-nhap?returnTo=%2Fcitizen');
  await fillLogin(page, ' a ');
  await expect(page).toHaveURL(/\/citizen$/);
  expect(await requestPrivate(page)).toBe(200);
  expect(refreshes).toBe(0);
  expect((await context.cookies()).find((value) => value.name === 'refreshToken')?.httpOnly).toBe(true);
  expect(await page.evaluate(() => JSON.stringify([localStorage, sessionStorage]))).not.toMatch(/mock-access|mock-refresh/);
  await page.reload();
  expect(await requestPrivate(page)).toBe(200);
  expect(refreshes).toBe(1);
});

test('wrong password does not refresh; malformed success does not navigate', async ({ page, context }) => {
  let calls = 0;
  await mock(context, async (route) => {
    calls++;
    expect(new URL(route.request().url()).pathname).toBe('/api/v1/auth/login');
    await reply(route, calls === 1 ? 401 : 200, calls === 1 ? {} : { accessToken: '' });
  });
  await page.goto('/dang-nhap');
  await fillLogin(page);
  await expect(page.getByText('Thông tin đăng nhập không đúng hoặc phiên đã hết hạn.')).toBeVisible();
  await fillLogin(page);
  await expect(page.getByText('Phản hồi xác thực không hợp lệ. Vui lòng thử lại.')).toBeVisible();
  await expect(page).toHaveURL(/\/dang-nhap$/);
  expect(calls).toBe(2);
});

test('login prevents double submission and rejects external returnTo', async ({ page, context }) => {
  let complete!: () => void;
  const waiting = new Promise<void>((resolve) => { complete = resolve; });
  let calls = 0;
  await mock(context, async (route) => {
    calls++;
    await waiting;
    await reply(route, 200, tokenResponse(), cookie);
  });
  await page.goto('/dang-nhap?returnTo=https%3A%2F%2Fevil.test');
  await fillLogin(page);
  await expect(page.getByRole('button', { name: 'Đang đăng nhập...' })).toBeDisabled();
  await page.locator('form').evaluate((form: HTMLFormElement) => form.requestSubmit());
  const secondLogin = await page.evaluate(async () => {
    const path = '/src/lib/api/index.ts';
    const { login } = await import(path);
    try { await login({ usernameOrEmail: 'another-user', password: 'mock-password' }); return 'success'; }
    catch (error) { return error instanceof Error ? error.message : ''; }
  });
  expect(secondLogin).toBe('Đang đăng nhập. Vui lòng chờ hoàn tất.');
  complete();
  await expect(page).toHaveURL('http://localhost:4317/');
  expect(calls).toBe(1);
});

test('revoke retries expired access once, sends no body and clears the cookie/session', async ({ page, context }) => {
  const events: string[] = [];
  await mock(context, async (route) => {
    const req = route.request();
    const path = new URL(req.url()).pathname;
    if (!path.startsWith('/api/v1/auth/')) return reply(route, 404, {});
    events.push(path);
    if (path.endsWith('/login')) return reply(route, 200, tokenResponse(), cookie);
    expect(req.postData()).toBeNull();
    expect(req.headers()['x-csrf-protection']).toBe('1');
    expect(req.headers().cookie).toContain('refreshToken=mock-refresh');
    if (path.endsWith('/refresh-token')) return reply(route, 200, tokenResponse('mock-renewed'), cookie);
    expect(path).toBe('/api/v1/auth/revoke-token');
    if (req.headers().authorization === 'Bearer mock-access') return reply(route, 401, {});
    expect(req.headers().authorization).toBe('Bearer mock-renewed');
    return reply(route, 204, undefined, cookie + '; Max-Age=0');
  });
  await page.goto('/dang-nhap?returnTo=%2Fcitizen');
  await fillLogin(page);
  await expect(page).toHaveURL(/\/citizen$/);
  await page.getByRole('button', { name: 'Menu tài khoản', exact: true }).click();
  await page.getByRole('menuitem', { name: 'Đăng xuất', exact: true }).press('Enter');
  await expect(page).toHaveURL('http://localhost:4317/');
  expect(events).toEqual(['/api/v1/auth/login', '/api/v1/auth/revoke-token', '/api/v1/auth/refresh-token', '/api/v1/auth/revoke-token']);
  expect((await context.cookies()).some((value) => value.name === 'refreshToken')).toBe(false);
});

test('failed revoke keeps the page and permits retry without claiming logout success', async ({ page, context }) => {
  let revokes = 0;
  await mock(context, async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith('/login')) return reply(route, 200, tokenResponse(), cookie);
    if (!path.endsWith('/revoke-token')) return reply(route, 404, {});
    revokes++;
    return reply(route, revokes === 1 ? 503 : 204);
  });
  await page.goto('/dang-nhap?returnTo=%2Fofficer');
  await fillLogin(page);
  await expect(page).toHaveURL(/\/officer$/);
  const accountMenu = page.getByRole('button', { name: 'Menu tài khoản', exact: true });
  await expect(accountMenu).toContainText('Người Dùng Mẫu');
  await accountMenu.click();
  await page.getByRole('menuitem', { name: 'Đăng xuất', exact: true }).press('Enter');
  await expect(page.getByText(/Chưa xác nhận được việc thu hồi phiên/)).toBeVisible();
  await expect(page).toHaveURL(/\/officer$/);
  await expect.poll(() => page.evaluate(() => {
    const buttons = [...document.querySelectorAll<HTMLButtonElement>('button')];
    const logoutButton = buttons.find(button => button.getAttribute('role') === 'menuitem' && button.textContent?.trim() === 'Đăng xuất');
    if (logoutButton && !logoutButton.disabled) { logoutButton.click(); return true; }
    buttons.find(button => button.getAttribute('aria-label') === 'Menu tài khoản')?.click();
    return false;
  })).toBe(true);
  await expect(page).toHaveURL('http://localhost:4317/');
  expect(revokes).toBe(2);
});

test('403 CSRF and temporary refresh errors do not redirect; 401 expiry does', async ({ page, context }) => {
  let status = 403;
  await context.addCookies([{ name: 'refreshToken', value: 'mock-refresh', domain: 'localhost', path: '/api/v1/auth', httpOnly: true, sameSite: 'Strict' }]);
  await mock(context, async (route) => {
    if (route.request().url().endsWith('/refresh-token')) return reply(route, status, { code: 'iam.csrf_rejected' });
    return reply(route, 401, {});
  });
  await page.goto('/citizen');
  expect(await requestPrivate(page)).toBe(0);
  await expect(page).toHaveURL(/\/citizen$/);
  status = 503;
  expect(await requestPrivate(page)).toBe(0);
  await expect(page).toHaveURL(/\/citizen$/);
  status = 401;
  await requestPrivate(page).catch(() => {}); // Redirect can destroy the evaluation context.
  await expect(page).toHaveURL(/\/dang-nhap\?reason=session-expired&returnTo=%2Fcitizen$/);
});

test('two tabs serialize cookie rotation and share logout invalidation without storing tokens', async ({ page, context }) => {
  let active = 0;
  let maximum = 0;
  let refreshCookie = 'mock-refresh';
  let rotations = 0;
  await mock(context, async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith('/login')) return reply(route, 200, tokenResponse(), cookie);
    if (path.endsWith('/refresh-token')) {
      expect(route.request().headers().cookie).toContain('refreshToken=' + refreshCookie);
      active++;
      maximum = Math.max(maximum, active);
      await new Promise((resolve) => setTimeout(resolve, 80));
      refreshCookie = 'mock-refresh-' + ++rotations;
      await reply(route, 200, tokenResponse(), cookie.replace('mock-refresh', refreshCookie));
      active--;
      return;
    }
    if (path.endsWith('/revoke-token')) return reply(route, 204, undefined, cookie + '; Max-Age=0');
    return reply(route, route.request().headers().authorization ? 200 : 401, {});
  });
  await page.goto('/dang-nhap');
  await fillLogin(page);
  await expect(page).toHaveURL('http://localhost:4317/');
  const second = await context.newPage();
  await second.goto('http://localhost:4317/citizen');
  await page.reload();
  expect(await Promise.all([requestPrivate(page), requestPrivate(second)])).toEqual([200, 200]);
  expect(maximum).toBe(1);
  await second.getByRole('button', { name: 'Menu tài khoản', exact: true }).click();
  await second.getByRole('menuitem', { name: 'Đăng xuất', exact: true }).click();
  await expect(second).toHaveURL('http://localhost:4317/');
  await expect.poll(() => page.evaluate(async () => {
    const path = '/src/lib/api/index.ts';
    return (await import(path)).authClient.hasAccessToken();
  })).toBe(false);
  await second.close();
});
