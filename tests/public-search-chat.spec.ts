import { expect, test, type Page } from '@playwright/test';
import { authReply, mockWorkspaceAuth } from './fixtures/auth';
import { mockCatalog, procedureId } from './fixtures/procedures';

const key = 'wardmate_guest_chat_v2';
const ttl = 24 * 60 * 60 * 1000;
const conversationId = '07000000-0000-0000-0000-000000000099';
async function publicMocks(page: Page) {
  const sends: Record<string, unknown>[] = [];
  await page.route('http://localhost:5000/**', route => {
    const request = route.request(); const path = new URL(request.url()).pathname;
    if (request.method() === 'OPTIONS') return authReply(route, { status: 204 });
    if (path.endsWith('/refresh-token')) return authReply(route, { status: 401, json: { code: 'auth.unauthorized' } });
    if (path.endsWith('/wards')) return authReply(route, { json: [
      { id: '07000000-0000-0000-0000-000000000097', code: 'WARD_A', name: 'Phường kiểm thử A' },
      { id: '07000000-0000-0000-0000-000000000098', code: 'WARD_B', name: 'Phường kiểm thử B' },
    ] });
    if (path.endsWith('/ai/chat/completions')) {
      sends.push(request.postDataJSON());
      return authReply(route, { json: { conversationId, answer: 'Câu trả lời từ API kiểm thử' } });
    }
    return authReply(route, { status: 404, json: { title: 'Không có dữ liệu kiểm thử' } });
  });
  const catalog = await mockCatalog(page);
  return { sends, catalog };
}
const toggle = (page: Page) => page.getByRole('button', { name: 'Mở trợ lý hỗ trợ thủ tục', exact: true });
const log = (page: Page) => page.getByRole('log', { name: 'Nội dung hội thoại' });
async function send(page: Page, text: string) {
  await page.getByLabel('Câu hỏi cho trợ lý', { exact: true }).fill(text);
  await page.getByRole('button', { name: 'Gửi tin nhắn', exact: true }).click();
  await expect(log(page).getByText('Câu trả lời từ API kiểm thử', { exact: true }).last()).toBeVisible();
}

test('home suggestions open procedure results with the same keyword and API filter', async ({ page }) => {
  const { catalog } = await publicMocks(page);
  await page.goto('/');
  await page.getByRole('button', { name: 'Khai sinh', exact: true }).click();
  await expect(page).toHaveURL('/thu-tuc?q=Khai+sinh');
  await expect(page.getByLabel('Tên thủ tục hoặc nhu cầu của bạn')).toHaveValue('Khai sinh');
  await expect(page.getByRole('link', { name: /Xem Đăng ký khai sinh/ })).toBeVisible();
  expect(catalog.requests.some(request => request.path === '/api/v1/procedures' && request.query.get('keyword') === 'Khai sinh')).toBe(true);
});

test('every public page and procedure detail has one assistant using the site logo', async ({ page }) => {
  await publicMocks(page);
  for (const path of ['/', '/thu-tuc', '/huong-dan', '/hoi-dap', `/thu-tuc/${procedureId}`, `/thu-tuc-hanh-chinh/${procedureId}`]) {
    await page.goto(path);
    await expect(toggle(page)).toHaveCount(1);
    await expect(toggle(page).locator('img')).toHaveAttribute('src', '/wardmate-mark.svg');
    await toggle(page).click();
    await expect(page.getByLabel('Cửa sổ hội thoại trợ lý ảo')).toBeVisible();
    await expect(page.getByLabel('Cửa sổ hội thoại trợ lý ảo').locator('img').first()).toHaveAttribute('src', '/wardmate-mark.svg');
  }
});

test('guest chat survives navigation and reload, retaining conversation and selected ward for 24h', async ({ page }) => {
  const { sends } = await publicMocks(page);
  await page.goto('/'); await toggle(page).click();
  await expect(page.getByLabel('Phường/xã cần tư vấn')).toBeEnabled();
  await page.getByLabel('Phường/xã cần tư vấn').selectOption('WARD_B');
  await send(page, 'Câu hỏi kiểm thử lưu trữ');
  const stored = await page.evaluate(key => JSON.parse(localStorage.getItem(key)!), key);
  expect(stored.expiresAt - stored.updatedAt).toBe(ttl);
  expect(stored.conversationId).toBe(conversationId);
  await page.getByRole('button', { name: 'Đóng cửa sổ chat', exact: true }).click();
  await page.getByRole('navigation', { name: 'Điều hướng chính' }).getByRole('link', { name: 'Hướng dẫn thực hiện', exact: true }).click();
  await toggle(page).click();
  await expect(log(page)).toContainText('Câu hỏi kiểm thử lưu trữ');
  await page.reload(); await toggle(page).click();
  await expect(log(page)).toContainText('Câu hỏi kiểm thử lưu trữ');
  await expect(page.getByLabel('Phường/xã cần tư vấn')).toHaveValue('WARD_B');
  expect((await page.evaluate(key => JSON.parse(localStorage.getItem(key)!), key)).expiresAt).toBe(stored.expiresAt);
  await send(page, 'Câu hỏi tiếp theo');
  expect(sends[0]).toMatchObject({ conversationId: null, wardCode: 'WARD_B' });
  expect(sends[1]).toMatchObject({ conversationId, wardCode: 'WARD_B' });
});

test('guest conversation expires while open and the next request starts a new conversation', async ({ page }) => {
  const { sends } = await publicMocks(page);
  await page.clock.install();
  await page.goto('/'); await toggle(page).click();
  await send(page, 'Tin nhắn sẽ hết hạn');
  await page.clock.fastForward(ttl + 1000);
  await expect(log(page)).not.toContainText('Tin nhắn sẽ hết hạn');
  expect(await page.evaluate(key => localStorage.getItem(key), key)).toBeNull();
  await send(page, 'Tin nhắn mới sau hết hạn');
  expect(sends[1].conversationId).toBeNull();
});

for (const scenario of ['expired', 'invalid'] as const) {
  test(`guest storage ${scenario} is removed before displaying chat`, async ({ page }) => {
    await publicMocks(page);
    await page.addInitScript(({ key, ttl, scenario }) => {
      const updatedAt = Date.now() - ttl - 1;
      localStorage.setItem(key, scenario === 'invalid' ? '{broken' : JSON.stringify({ version: 2, updatedAt, expiresAt: updatedAt + ttl, conversationId: 'expired-id', messages: [{ id: 'old', sender: 'user', text: 'Tin cũ không được hiện', timestamp: new Date(updatedAt).toISOString() }] }));
    }, { key, ttl, scenario });
    await page.goto('/hoi-dap'); await toggle(page).click();
    await expect(log(page)).not.toContainText('Tin cũ không được hiện');
    expect(await page.evaluate(key => localStorage.getItem(key), key)).toBeNull();
  });
}

test('recent legacy messages migrate without extending expiry, old legacy messages are discarded', async ({ page }) => {
  await publicMocks(page);
  await page.goto('/');
  const updatedAt = Date.now() - 3600000;
  await page.evaluate(updatedAt => {
    localStorage.setItem('wardmate_guest_chat_messages', JSON.stringify([{ id: 'old', sender: 'user', text: 'Tin nhắn phiên cũ', timestamp: new Date(updatedAt).toISOString() }]));
    localStorage.setItem('wardmate_guest_conv_id', 'legacy-id');
  }, updatedAt);
  await page.reload(); await toggle(page).click();
  await expect(log(page)).toContainText('Tin nhắn phiên cũ');
  const migrated = await page.evaluate(key => JSON.parse(localStorage.getItem(key)!), key);
  expect(migrated.expiresAt).toBe(updatedAt + ttl);
  expect(await page.evaluate(() => localStorage.getItem('wardmate_guest_chat_messages'))).toBeNull();
  await page.evaluate(({ key, ttl }) => {
    localStorage.removeItem(key);
    localStorage.setItem('wardmate_guest_chat_messages', JSON.stringify([{ id: 'old', sender: 'user', text: 'Tin quá hạn', timestamp: new Date(Date.now() - ttl - 1).toISOString() }]));
  }, { key, ttl });
  await page.reload(); await toggle(page).click();
  await expect(log(page)).not.toContainText('Tin quá hạn');
  expect(await page.evaluate(key => localStorage.getItem(key), key)).toBeNull();
});

test('blocked browser storage still allows guest chat', async ({ page }) => {
  await publicMocks(page);
  await page.addInitScript(() => {
    for (const method of ['getItem', 'setItem', 'removeItem']) Object.defineProperty(Storage.prototype, method, { value: () => { throw new DOMException('Blocked', 'SecurityError'); } });
  });
  await page.goto('/'); await toggle(page).click();
  await send(page, 'Trình duyệt chặn lưu trữ');
  await expect(log(page)).toContainText('Trình duyệt chặn lưu trữ');
});

test('long fees wrap on mobile; the source file opens only when requested', async ({ page }) => {
  const { catalog } = await publicMocks(page);
  catalog.detail.feeSummary = 'Lệ phí theo từng trường hợp '.repeat(8);
  catalog.detail.pdfFileName = 'van-ban-nguon-'.repeat(30) + '.pdf';
  catalog.detail.contentPayload.submissionMethods!.push({ methodName: 'Trực tuyến', estimatedDays: 2, feeAmount: 25000, feeUnit: 'VND', note: 'Ghi chú áp dụng '.repeat(30) });
  await page.route('https://example.test/source.pdf', route => route.fulfill({ body: '%PDF-1.4', contentType: 'application/pdf' }));
  await page.setViewportSize({ width: 375, height: 844 });
  await page.goto('/thu-tuc');
  await expect(page.locator('.procedures-list > li')).toHaveCount(5);
  await expect(page.locator('.procedure-result-row').first()).toContainText(catalog.detail.feeSummary);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.goto(`/thu-tuc/${procedureId}`);
  const table = page.getByRole('table', { name: 'Cách thức thực hiện và lệ phí' });
  await expect(table).toContainText('Miễn phí'); await expect(table).toContainText('25.000 đồng');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expect(page.getByTitle('PDF nguồn thủ tục')).toHaveCount(0);
  expect(catalog.requests.filter(request => request.path.endsWith('/source'))).toHaveLength(0);
  await page.getByRole('button', { name: 'Xem trước tệp', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByTitle('PDF nguồn thủ tục')).toHaveAttribute('src', 'https://example.test/source.pdf');
  await expect(page.getByRole('link', { name: 'Mở tab mới', exact: true })).toHaveAttribute('href', 'https://example.test/source.pdf');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/public-source-preview-mobile.png' });
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('authenticated chat never writes private messages into guest browser storage', async ({ page }) => {
  await mockWorkspaceAuth(page, ['REGISTERED_CITIZEN']);
  await mockCatalog(page);
  await page.route('**/api/v1/wards', route => authReply(route, { json: [{ id: 'ward-a', code: 'WARD_A', name: 'Phường kiểm thử A' }] }));
  await page.route('**/api/v1/ai/chat/completions', route => authReply(route, { json: { conversationId, answer: 'Câu trả lời từ API kiểm thử' } }));
  await page.goto('/citizen'); await toggle(page).click();
  await expect(page.getByLabel('Phường/xã cần tư vấn')).toBeEnabled();
  await page.getByLabel('Phường/xã cần tư vấn').selectOption('WARD_A');
  await send(page, 'Tin riêng của người đã đăng nhập');
  expect(await page.evaluate(key => localStorage.getItem(key), key)).toBeNull();
  expect(await page.evaluate(() => localStorage.getItem('wardmate_guest_chat_messages'))).toBeNull();
});
