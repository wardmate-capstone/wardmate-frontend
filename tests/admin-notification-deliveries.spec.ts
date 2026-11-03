import { expect, test, type Page } from '@playwright/test';
import { authReply, mockWorkspaceAuth } from './fixtures/auth';

const id = 'dddddddd-0000-0000-0000-000000000001';
const freshRevision = 'dddddddd-0000-0000-0000-000000000003';
const delivery = { id, notificationId: 'dddddddd-0000-0000-0000-000000000002', channel: 'EMAIL', state: 'Dead', attempts: 3, nextAttemptAt: '2026-11-03T08:00:00Z', errorCode: null, sentAt: null, provider: 'SMTP', externalMessageId: null, isSandbox: false, revision: 'dddddddd-0000-0000-0000-000000000004', updatedAt: '2026-11-03T08:00:00Z', providerRequestId: 'provider-test' };
async function setup(page: Page, manage = true, read = true) {
  await mockWorkspaceAuth(page, ['IT_ADMIN'], read ? ['notifications.deliveries.read', ...(manage ? ['notifications.deliveries.manage'] : [])] : []);
  const state = { requests: [] as { path: string; method: string; query: Record<string, string>; body: unknown }[], conflict: false, wrongId: false, auditError: false, fullAudit: false, detailState: 'Blocked', listState: 'Dead' };
  await page.route('http://localhost:5000/api/v1/admin/notification-deliveries**', async route => {
    const request = route.request(); if (request.method() === 'OPTIONS') return authReply(route, { status: 204 });
    const url = new URL(request.url()), path = url.pathname, method = request.method();
    state.requests.push({ path, method, query: Object.fromEntries(url.searchParams), body: request.postData() ? request.postDataJSON() : null });
    if (path.endsWith('/replay')) {
      if (state.conflict) return authReply(route, { status: 409, json: { code: 'notifications.revision_conflict', title: 'Lượt phát đã thay đổi. Đọc lại trước khi gửi tiếp.' } });
      state.detailState = 'Pending'; return authReply(route, { status: 202, json: { ...delivery, state: 'Pending', revision: freshRevision } });
    }
    if (path.endsWith('/audit')) {
      if (state.auditError) return authReply(route, { status: 503, json: {} });
      const page = Number(url.searchParams.get('page') || 1);
      return authReply(route, { json: Array.from({ length: state.fullAudit && page === 1 ? 20 : 1 }, (_, n) => ({ id: `eeeeeeee-0000-0000-0000-${String(page * 100 + n).padStart(12, '0')}`, actorId: id, action: 'REPLAY', beforeState: 'Dead', afterState: 'Pending', beforeAttempts: 3, beforeRevision: delivery.revision, afterRevision: freshRevision, reason: 'Gửi lại theo yêu cầu kiểm thử', reference: null, beforeMessageId: null, afterMessageId: null, createdAt: '2026-11-03T08:00:00Z' })) });
    }
    if (path.endsWith('/' + id)) return authReply(route, { json: { ...delivery, id: state.wrongId ? freshRevision : id, state: state.detailState, attempts: 5, revision: freshRevision } });
    return authReply(route, { json: { items: [{ ...delivery, state: state.listState }], page: Number(url.searchParams.get('page') || 1), pageSize: 15, total: 1 } });
  });
  await page.goto('/admin'); await page.locator('aside').getByRole('button', { name: 'Phát thông báo', exact: true }).click();
  return state;
}

test('delivery detail uses GET detail, fresh data and paginated audit', async ({ page }) => {
  const state = await setup(page); state.fullAudit = true;
  await expect(page.getByRole('cell', { name: 'Ngừng thử', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Chi tiết lượt phát ' + id }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByText('Bị chặn', { exact: true })).toBeVisible();
  await expect(dialog.getByText(freshRevision, { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Lịch sử sau' }).click();
  await expect(page.getByText('Trang lịch sử 2')).toBeVisible();
  expect(state.requests.some(item => item.path.endsWith('/' + id))).toBe(true);
  expect(state.requests.some(item => item.path.endsWith('/audit') && item.query.page === '2')).toBe(true);
});

test('delivery replay enforces reason and acknowledgment, uses fresh revision and accepts 202', async ({ page }) => {
  const state = await setup(page);
  await page.getByRole('button', { name: 'Replay', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('button', { name: 'Xác nhận gửi lại' })).toBeEnabled();
  await dialog.getByLabel('Lý do gửi lại').fill('abc');
  await dialog.getByRole('button', { name: 'Xác nhận gửi lại' }).click();
  await expect(dialog.getByText('Lý do cần ít nhất 5 ký tự.')).toBeVisible();
  await dialog.getByLabel('Lý do gửi lại').fill('  Người nhận chưa nhận được thư  ');
  await dialog.getByRole('button', { name: 'Xác nhận gửi lại' }).click();
  await expect(dialog.getByText('Cần xác nhận rủi ro gửi trùng.')).toBeVisible();
  expect(state.requests.filter(item => item.method === 'POST')).toHaveLength(0);
  await dialog.getByRole('checkbox').check();
  await dialog.getByRole('button', { name: 'Xác nhận gửi lại' }).click();
  await expect(dialog).toHaveCount(0);
  expect(state.requests.find(item => item.method === 'POST')?.body).toEqual({ reason: 'Người nhận chưa nhận được thư', acknowledgeDuplicateRisk: true, expectedRevision: freshRevision });
});

test('delivery conflict preserves reason, locks send until explicit reload and does not retry', async ({ page }) => {
  const state = await setup(page); state.conflict = true;
  await page.getByRole('button', { name: 'Replay', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Lý do gửi lại').fill('Nội dung cần giữ lại'); await dialog.getByRole('checkbox').check();
  await dialog.getByRole('button', { name: 'Xác nhận gửi lại' }).click();
  await expect(dialog.getByRole('button', { name: 'Xác nhận gửi lại' })).toBeDisabled();
  await expect(dialog.getByLabel('Lý do gửi lại')).toHaveValue('Nội dung cần giữ lại');
  expect(state.requests.filter(item => item.method === 'POST')).toHaveLength(1);
  await dialog.getByRole('button', { name: 'Đọc lại lượt phát' }).click();
  await expect(dialog.getByRole('button', { name: 'Xác nhận gửi lại' })).toBeEnabled();
  expect(state.requests.filter(item => item.method === 'POST')).toHaveLength(1);
});

test('delivery filters match supported states, send notification/provider IDs and reject invalid fields', async ({ page }) => {
  const state = await setup(page);
  await expect(page.getByLabel('Trạng thái lượt phát').locator('option[value="Failed"]')).toHaveCount(0);
  await page.getByLabel('Trạng thái lượt phát').selectOption('Sandbox');
  await page.getByLabel('Mã thông báo', { exact: true }).fill('not-guid');
  await page.getByRole('button', { name: 'Áp dụng' }).click();
  await expect(page.getByText('Mã định danh không hợp lệ.')).toBeVisible();
  await page.getByLabel('Mã thông báo', { exact: true }).fill(delivery.notificationId);
  await page.getByLabel('Mã tin nhắn nhà cung cấp').fill('test_id-123');
  await page.getByRole('button', { name: 'Áp dụng' }).click();
  await expect.poll(() => state.requests.at(-1)?.query).toEqual({ page: '1', pageSize: '15', state: 'Sandbox', notificationId: delivery.notificationId, externalMessageId: 'test_id-123' });
});

test('delivery errors never display old detail as fresh data or fake empty audit', async ({ page }) => {
  const state = await setup(page); state.wrongId = true; state.auditError = true;
  await page.getByRole('button', { name: 'Chi tiết lượt phát ' + id }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('alert').filter({ hasText: 'không khớp' })).toBeVisible();
  await expect(dialog.getByText('Bị chặn', { exact: true })).toHaveCount(0);
  await expect(dialog.getByText('Chưa có bản ghi trên trang này.')).toHaveCount(0);
});

test('read-only notification permission hides replay; missing read never calls API', async ({ page }) => {
  await setup(page, false);
  await expect(page.getByRole('cell', { name: 'Ngừng thử', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Replay', exact: true })).toHaveCount(0);
  const state = await setup(page, false, false);
  await expect(page.getByRole('alert')).toContainText('quyền đọc lịch sử');
  expect(state.requests).toHaveLength(0);
});

test('delivery schemas reject control chars and enforce replay reason length', async ({ page }) => {
  await setup(page);
  const result = await page.evaluate(async () => {
    const m = await import('/src/lib/api/notificationAdmin.ts');
    return { lengths: [4, 5, 500, 501].map(n => m.deliveryReplaySchema.safeParse({ reason: 'a'.repeat(n), acknowledgeDuplicateRisk: true }).success), control: m.deliveryReplaySchema.safeParse({ reason: 'abc\ndef', acknowledgeDuplicateRisk: true }).success };
  });
  expect(result).toEqual({ lengths: [false, true, true, false], control: false });
});
