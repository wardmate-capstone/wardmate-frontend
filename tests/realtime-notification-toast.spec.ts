import { expect, test } from '@playwright/test';
import { authReply, mockWorkspaceAuth } from './fixtures/auth';
import { mockCatalog } from './fixtures/procedures';

const SEP = '\u001e';

test('thông báo mới kích hoạt Toast popup góc trên bên phải và cập nhật badge chuông realtime', async ({ page }) => {
  await mockCatalog(page);
  await mockWorkspaceAuth(page, ['REGISTERED_CITIZEN']);

  let connectionSocket: { send: (data: string) => void } | null = null;
  let initialLoaded = false;

  await page.route('**/api/analytics-system/hubs/notifications/negotiate*', (route) =>
    authReply(route, {
      json: {
        negotiateVersion: 1,
        connectionId: 'realtime-test',
        connectionToken: 'realtime-token',
        availableTransports: [{ transport: 'WebSockets', transferFormats: ['Text', 'Binary'] }],
      },
    })
  );

  await page.routeWebSocket(/\/api\/analytics-system\/hubs\/notifications/, (ws) => {
    connectionSocket = ws;
    ws.onMessage(async (raw) => {
      for (const frame of String(raw).split(SEP).filter(Boolean)) {
        const message = JSON.parse(frame);
        if (message.protocol) {
          ws.send('{}' + SEP);
          continue;
        }
        if (message.type !== 1) continue;
        if (message.target === 'GetNotifications') {
          ws.send(JSON.stringify({ type: 3, invocationId: message.invocationId, result: [] }) + SEP);
        } else if (message.target === 'GetUnreadCount') {
          ws.send(JSON.stringify({ type: 3, invocationId: message.invocationId, result: 0 }) + SEP);
          initialLoaded = true;
        }
      }
    });
  });

  await page.goto('/');

  // Chuông thông báo lúc đầu chưa có thông báo
  const bell = page.getByRole('button', { name: 'Thông báo', exact: true }).first();
  await expect(bell).toBeVisible();

  // Đợi WebSocket kết nối và hoàn tất tải dữ liệu ban đầu
  await expect.poll(() => Boolean(connectionSocket && initialLoaded)).toBe(true);

  // Giả lập backend bắn thông báo mới qua SignalR
  const newNotification = {
    id: 'notif-realtime-999',
    title: 'Hồ sơ đã được tiếp nhận tại quầy',
    content: 'Hồ sơ Đăng ký khai sinh HS-20261031-000041 đã được cán bộ Một cửa tiếp nhận.',
    type: 'DOCUMENTS_READY',
    isRead: false,
    applicationId: 'HS-20261031-000041',
    createdAt: new Date().toISOString(),
  };

  connectionSocket.send(
    JSON.stringify({
      type: 1,
      target: 'ReceiveNotification',
      arguments: [newNotification],
    }) + SEP
  );

  // 1. Kiểm tra Toast popup xuất hiện ở góc trên bên phải
  const toastPopup = page.getByText('Hồ sơ đã được tiếp nhận tại quầy');
  await expect(toastPopup).toBeVisible({ timeout: 5000 });
  await expect(page.getByText('Hồ sơ Đăng ký khai sinh HS-20261031-000041 đã được cán bộ Một cửa tiếp nhận.')).toBeVisible();

  // 2. Kiểm tra nút xem hồ sơ trong Toast
  const viewButton = page.getByRole('button', { name: 'Xem hồ sơ' });
  await expect(viewButton).toBeVisible();

  // 3. Kiểm tra badge số trên chuông nhảy số 1
  const updatedBell = page.getByRole('button', { name: /có 1 thông báo chưa đọc/ }).first();
  await expect(updatedBell).toBeVisible();
});
