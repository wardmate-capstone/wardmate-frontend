import { expect, test, type Page } from '@playwright/test';
import { authReply, mockWorkspaceAuth } from './fixtures/auth';
import { documentIds, mockDocumentWorkflow } from './fixtures/documentWorkflow';

const SEP = '\u001e';
const notice = {
  id: '11111111-1111-4111-8111-111111111111', title: 'Hồ sơ cần bổ sung giấy tờ',
  content: 'Vui lòng kiểm tra nhận xét và bổ sung giấy tờ trước khi gửi lại hồ sơ.',
  applicationId: documentIds.application, type: 'NEED_REVISION', isRead: false,
  actionUrl: 'https://example.invalid/untrusted', createdAt: '2026-10-27T02:00:00Z',
};

async function mockHub(page: Page, options: { empty?: boolean; offline?: boolean; listError?: boolean; hold?: boolean } = {}) {
  const state = { items: options.empty ? [] : [{ ...notice }, { ...notice, id: '22222222-2222-4222-8222-222222222222', title: 'Đã nhận hồ sơ tiền kiểm', isRead: true }], failRead: false, marks: [] as string[], release: () => {} };
  const gate = new Promise<void>(resolve => { state.release = resolve; });
  await page.route('**/api/analytics-system/hubs/notifications/negotiate*', route => options.offline
    ? authReply(route, { status: 503 })
    : authReply(route, { json: { negotiateVersion: 1, connectionId: 'citizen-test', connectionToken: 'citizen-token', availableTransports: [{ transport: 'WebSockets', transferFormats: ['Text', 'Binary'] }] } }));
  await page.routeWebSocket(/\/api\/analytics-system\/hubs\/notifications/, ws => ws.onMessage(async raw => {
    for (const frame of String(raw).split(SEP).filter(Boolean)) {
      const message = JSON.parse(frame);
      if (message.protocol) { ws.send('{}' + SEP); continue; }
      if (message.type !== 1) continue;
      if (message.target === 'GetNotifications' && options.hold) await gate;
      if ((message.target === 'GetNotifications' && options.listError) || (message.target === 'MarkRead' && state.failRead)) {
        ws.send(JSON.stringify({ type: 3, invocationId: message.invocationId, error: 'Tạm gián đoạn' }) + SEP);
        continue;
      }
      if (message.target === 'MarkRead') {
        state.marks.push(message.arguments[0]);
        state.items = state.items.map(item => item.id === message.arguments[0] ? { ...item, isRead: true } : item);
      }
      const result = message.target === 'GetNotifications' ? state.items : message.target === 'GetUnreadCount' ? state.items.filter(item => !item.isRead).length : null;
      ws.send(JSON.stringify({ type: 3, invocationId: message.invocationId, result }) + SEP);
    }
  }));
  return state;
}

test('hộp thư có loading và empty rõ ràng, nút đọc tất cả bị khóa khi không có dữ liệu', async ({ page }) => {
  await mockWorkspaceAuth(page, ['REGISTERED_CITIZEN']);
  const hub = await mockHub(page, { empty: true, hold: true });
  await page.goto('/citizen?section=notifications');
  const inbox = page.getByRole('region', { name: 'Hộp thư thông báo' });
  await expect(inbox.getByText('Đang lấy thông báo của bạn')).toBeVisible();
  await expect(inbox.getByText('Bạn chưa có thông báo', { exact: true })).toHaveCount(0);
  hub.release();
  await expect(inbox.getByText('Bạn chưa có thông báo', { exact: true })).toBeVisible();
  await expect(inbox.getByRole('button', { name: 'Đánh dấu tất cả đã đọc' })).toBeDisabled();
  await page.screenshot({ path: 'test-results/citizen-notifications-empty.png', fullPage: true });
});

test('danh sách responsive, lỗi đánh dấu giữ chưa đọc, thử lại cập nhật và mở đúng hồ sơ', async ({ page }) => {
  await mockWorkspaceAuth(page, ['REGISTERED_CITIZEN']);
  await mockDocumentWorkflow(page, 'citizen', 'NEED_REVISION');
  const hub = await mockHub(page);
  await page.goto('/citizen?section=notifications');
  const inbox = page.getByRole('region', { name: 'Hộp thư thông báo' });
  await expect(inbox.getByRole('listitem')).toHaveCount(2);
  for (const width of [1440, 720, 320]) {
    await page.setViewportSize({ width, height: 900 });
    if (width < 1024) await expect.poll(() => page.locator('main').first().evaluate(el => el.getBoundingClientRect().width)).toBeGreaterThan(width - 40);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: `test-results/citizen-notifications-${width}.png`, fullPage: true });
  }
  await inbox.getByRole('button', { name: 'Chưa đọc (1)', exact: true }).click();
  await expect(inbox.getByRole('listitem')).toHaveCount(1);
  hub.failRead = true;
  await inbox.getByRole('button', { name: 'Đánh dấu tất cả đã đọc' }).click();
  await expect(inbox.getByRole('alert')).toContainText('Chưa đánh dấu được');
  await expect(inbox.getByRole('button', { name: 'Chưa đọc (1)', exact: true })).toBeVisible();
  hub.failRead = false;
  await inbox.getByRole('button', { name: 'Đánh dấu tất cả đã đọc' }).click();
  await expect(inbox.getByText('Bạn đã đọc hết thông báo trong danh sách')).toBeVisible();
  expect(hub.marks).toEqual([notice.id]);
  await inbox.getByRole('button', { name: 'Xem tất cả thông báo' }).click();
  await inbox.getByRole('listitem').first().getByRole('button', { name: 'Mở hồ sơ' }).click();
  await expect(page).toHaveURL(/section=dossier_detail/);
  await expect(page.getByRole('heading', { name: 'Chi tiết hồ sơ', exact: true })).toBeVisible();
});

for (const listError of [false, true]) {
  test(`không hiện rỗng giả khi ${listError ? 'tải danh sách lỗi' : 'mất kết nối'}`, async ({ page }) => {
    await mockWorkspaceAuth(page, ['REGISTERED_CITIZEN']);
    await mockHub(page, { offline: !listError, listError });
    await page.goto('/citizen?section=notifications');
    const inbox = page.getByRole('region', { name: 'Hộp thư thông báo' });
    await expect(inbox.getByText('Chưa tải được thông báo', { exact: true })).toBeVisible();
    await expect(inbox.getByText('Bạn chưa có thông báo', { exact: true })).toHaveCount(0);
    await expect(inbox.getByRole('button', { name: 'Đánh dấu tất cả đã đọc' })).toBeDisabled();
  });
}
