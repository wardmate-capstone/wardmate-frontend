import { test, expect, type Page, type WebSocketRoute } from '@playwright/test';
import { authReply, mockWorkspaceAuth } from './fixtures/auth';

// Mock giao thức SignalR JSON (negotiate + WebSocket) của NotificationHub; không gọi BE thật.
const SEP = '\u001e';
const assigned = {
  id: 'nnnnnnnn-0000-4000-8000-000000000001', recipientUserId: 'ui-test', applicationId: 'aaaaaaaa-0000-4000-8000-000000000001',
  title: 'Hồ sơ được giao cho bạn', content: 'Hồ sơ HS-PC-01 có cập nhật. Vui lòng mở hồ sơ để xem chi tiết.',
  type: 'ASSIGNED_OFFICER', channel: 'IN_APP', isRead: false, readAt: null, actionUrl: null, createdAt: '2026-10-24T02:00:00Z',
};

async function mockHub(page: Page, options: { failNegotiate?: boolean } = {}) {
  const hub = { invocations: [] as Array<{ target: string; arguments: unknown[] }>, socket: null as WebSocketRoute | null };
  await page.route('**/api/analytics-system/hubs/notifications/negotiate*', route => options.failNegotiate
    ? authReply(route, { status: 401, json: { code: 'auth.unauthorized' } })
    : authReply(route, { json: {
      negotiateVersion: 1, connectionId: 'c1', connectionToken: 't1',
      availableTransports: [{ transport: 'WebSockets', transferFormats: ['Text', 'Binary'] }],
    } }));
  await page.routeWebSocket(/\/api\/analytics-system\/hubs\/notifications/, ws => {
    hub.socket = ws;
    ws.onMessage(raw => {
      for (const frame of String(raw).split(SEP).filter(Boolean)) {
        const message = JSON.parse(frame);
        if (message.protocol) { ws.send('{}' + SEP); continue; }
        if (message.type !== 1) continue;
        hub.invocations.push({ target: message.target, arguments: message.arguments });
        const result = message.target === 'GetNotifications' ? [assigned] : message.target === 'GetUnreadCount' ? 1 : null;
        ws.send(JSON.stringify({ type: 3, invocationId: message.invocationId, result }) + SEP);
      }
    });
  });
  return hub;
}

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await mockWorkspaceAuth(page, ['FRONT_DESK_OFFICER']);
});

test('cán bộ nhận thông báo thật, thấy thông báo mới đẩy về và đánh dấu đã đọc', async ({ page }) => {
  const hub = await mockHub(page);
  await page.goto('/officer');
  await expect(page.getByRole('button', { name: 'Thông báo ca trực, có 1 thông báo mới' })).toBeVisible();

  await page.getByRole('button', { name: 'Thông báo', exact: true }).click();
  const view = page.getByRole('region', { name: 'Danh sách thông báo ca trực' });
  await expect(view.getByText('Đang nhận thông báo mới tự động.')).toBeVisible();
  await expect(view.getByText('Hồ sơ được giao cho bạn')).toBeVisible();
  await expect(view.getByRole('button', { name: 'Mở hồ sơ' })).toBeVisible();

  hub.socket!.send(JSON.stringify({ type: 1, target: 'ReceiveNotification', arguments: [{
    ...assigned, id: 'nnnnnnnn-0000-4000-8000-000000000002', title: 'Có hồ sơ cần tiếp nhận', createdAt: '2026-10-24T03:00:00Z',
  }] }) + SEP);
  await expect(view.getByRole('listitem').first()).toContainText('Có hồ sơ cần tiếp nhận');

  await view.getByRole('button', { name: 'Đánh dấu đã đọc tất cả' }).click();
  await expect.poll(() => hub.invocations.filter(x => x.target === 'MarkRead').map(x => x.arguments[0]).sort())
    .toEqual(['nnnnnnnn-0000-4000-8000-000000000001', 'nnnnnnnn-0000-4000-8000-000000000002']);
  await expect(view.getByRole('button', { name: 'Đánh dấu đã đọc tất cả' })).toBeDisabled();
});

test('mất kết nối máy chủ thông báo thì báo rõ, không hiện dữ liệu giả', async ({ page }) => {
  await mockHub(page, { failNegotiate: true });
  await page.goto('/officer');
  await page.getByRole('button', { name: 'Thông báo', exact: true }).click();
  const view = page.getByRole('region', { name: 'Danh sách thông báo ca trực' });
  await expect(view.getByText('Mất kết nối máy chủ thông báo. Hệ thống sẽ tự thử lại.')).toBeVisible();
  await expect(view.getByText('Chưa có thông báo.')).toBeVisible();
  await expect(view.getByRole('button', { name: 'Đánh dấu đã đọc tất cả' })).toBeDisabled();
});
