import { expect, test } from '@playwright/test';
import { actorId, auditEvent, auditId, eventId, mockSystemAdministration } from './fixtures/systemAdministration';
import { authReply, mockWorkspaceAuth } from './fixtures/auth';

test('business audit filters on server, uses Vietnam UTC boundaries and resets pagination', async ({ page }) => {
  const state = await mockSystemAdministration(page);
  await page.goto('/admin');
  expect(state.requests).toHaveLength(0);
  await page.locator('aside').getByRole('button', { name: 'Nhật ký hoạt động' }).click();
  await expect(page.getByRole('tab', { name: 'Nghiệp vụ toàn hệ thống' })).toHaveAttribute('aria-selected', 'true');
  await page.getByRole('button', { name: 'Trang sau' }).click();
  await expect(page.getByText('Trang 2 / 2')).toBeVisible();
  await page.getByLabel('Nguồn phát sinh').selectOption('workflow');
  await page.getByLabel('Loại dữ liệu', { exact: true }).fill(' applications ');
  await page.getByLabel('Từ ngày').fill('2026-11-03');
  await page.getByLabel('Đến ngày').fill('2026-11-03');
  await page.getByText('Lọc theo người thực hiện và mã tra cứu').click();
  await page.getByLabel('Mã tài khoản người thực hiện').fill(actorId);
  await page.getByLabel('Mã tra cứu', { exact: true }).fill(' trace-audit-test ');
  await page.getByRole('button', { name: 'Áp dụng' }).click();
  await expect.poll(() => state.requests.at(-1)?.query).toEqual({ page: '1', pageSize: '20', source: 'workflow', entity: 'applications', actorId, traceId: 'trace-audit-test', from: '2026-11-02T17:00:00.000Z', to: '2026-11-03T16:59:59.999Z' });
  await page.getByRole('button', { name: 'Xóa bộ lọc' }).click();
  await expect.poll(() => state.requests.at(-1)?.query).toEqual({ page: '1', pageSize: '20' });
});

test('audit detail fetches selected ID, explains redaction, supports keyboard tabs and config audit detail', async ({ page }) => {
  const state = await mockSystemAdministration(page);
  await page.goto('/admin');
  await page.locator('aside').getByRole('button', { name: 'Nhật ký hoạt động' }).click();
  await page.getByRole('button', { name: `Chi tiết sự kiện ${eventId}`, exact: true }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByText('UNDER_REVIEW', { exact: false }).first()).toBeVisible();
  await expect(dialog.getByText('Không có thông tin người thực hiện')).toBeVisible();
  await expect(dialog.getByText('[Đã ẩn]: Dữ liệu nhạy cảm.')).toBeVisible();
  expect(state.requests.some(item => item.path.endsWith('/audit-events/' + eventId))).toBe(true);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: `Chi tiết sự kiện ${eventId}`, exact: true })).toBeFocused();
  await page.getByRole('tab', { name: 'Nghiệp vụ toàn hệ thống' }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tab', { name: 'Thay đổi cấu hình' })).toHaveAttribute('aria-selected', 'true');
  await page.getByRole('button', { name: `Chi tiết nhật ký ${auditId}` }).click();
  await expect(dialog.getByText('trace-setting-test')).toBeVisible();
  await expect(dialog.getByText('Không có thông tin', { exact: true })).toBeVisible();
  expect(state.requests.some(item => item.path.endsWith('/audit-logs/' + auditId))).toBe(true);
});

test('audit rejects reversed dates and invalid actor without sending filters', async ({ page }) => {
  const state = await mockSystemAdministration(page);
  await page.goto('/admin');
  await page.locator('aside').getByRole('button', { name: 'Nhật ký hoạt động' }).click();
  await expect(page.getByRole('button', { name: 'Trang sau' })).toBeEnabled();
  const count = state.requests.length;
  await page.getByLabel('Từ ngày').fill('2026-11-03');
  await page.getByLabel('Đến ngày').fill('2026-11-02');
  await page.getByRole('button', { name: 'Áp dụng' }).click();
  await expect(page.getByText('Ngày kết thúc phải từ ngày bắt đầu trở đi.')).toBeVisible();
  await page.getByLabel('Đến ngày').fill('2026-11-03');
  await page.getByText('Lọc theo người thực hiện và mã tra cứu').click();
  await page.getByLabel('Mã tài khoản người thực hiện').fill('not-a-guid');
  await page.getByRole('button', { name: 'Áp dụng' }).click();
  await expect(page.getByText('Nhập mã định danh GUID hợp lệ.')).toBeVisible();
  expect(state.requests.length).toBe(count);
});

for (const scenario of ['disabled', 'forbidden', 'invalid', 'page'] as const) {
  test(`audit ${scenario} errors are distinct from empty results and can retry`, async ({ page }) => {
    const state = await mockSystemAdministration(page);
    state.listError = scenario === 'disabled' ? 'system.administration_disabled' : scenario === 'forbidden' ? 'analytics.forbidden' : '';
    state.invalidResponse = scenario === 'invalid'; state.wrongPage = scenario === 'page';
    await page.goto('/admin');
    await page.locator('aside').getByRole('button', { name: 'Nhật ký hoạt động' }).click();
    await expect(page.getByRole('alert').filter({ hasText: /Chức năng quản trị|không có quyền|không hợp lệ|không khớp/ })).toBeVisible();
    await expect(page.getByText('Không có sự kiện phù hợp với bộ lọc.')).toHaveCount(0);
    state.listError = ''; state.invalidResponse = false; state.wrongPage = false; state.empty = true;
    await page.getByRole('button', { name: 'Thử lại', exact: true }).click();
    await expect(page.getByText('Không có sự kiện phù hợp với bộ lọc.')).toBeVisible();
  });
}

test('audit rejects detail with wrong event ID and handles not found', async ({ page }) => {
  const state = await mockSystemAdministration(page); state.wrongDetail = true;
  await page.goto('/admin');
  await page.locator('aside').getByRole('button', { name: 'Nhật ký hoạt động' }).click();
  await page.getByRole('button', { name: `Chi tiết sự kiện ${eventId}`, exact: true }).click();
  await expect(page.getByRole('dialog').getByRole('alert')).toContainText('không khớp');
  state.wrongDetail = false; state.detailError = true;
  await page.getByRole('dialog').getByRole('button', { name: 'Thử lại' }).click();
  await expect(page.getByRole('dialog').getByRole('alert')).toContainText('Không tìm thấy sự kiện');
});

test('new Analytics audit tabs do not require IAM audit permission and stay hidden for non-admin roles', async ({ page }) => {
  const state = await mockSystemAdministration(page, ['iam.profile.read']);
  await page.goto('/admin');
  await page.locator('aside').getByRole('button', { name: 'Nhật ký hoạt động' }).click();
  await expect(page.getByRole('tab', { name: 'Phân quyền', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Trang sau' })).toBeEnabled();
  const count = state.requests.length;
  await mockWorkspaceAuth(page, ['MANAGER']);
  await page.goto('/admin');
  // Existing Admin routing also permits delegated IAM permissions. New Analytics features remain role-only.
  await expect(page.getByRole('heading', { name: 'Tổng quan', exact: true })).toBeVisible();
  await expect(page.locator('aside').getByRole('button', { name: 'Nhật ký hoạt động' })).toHaveCount(0);
  await expect(page.locator('aside').getByRole('button', { name: 'Cấu hình hệ thống' })).toHaveCount(0);
  expect(state.requests.length).toBe(count);
});

test('audit screen and detail stay within mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await mockSystemAdministration(page);
  await page.goto('/admin');
  await page.getByRole('button', { name: 'Mở menu quản trị' }).click();
  await page.locator('aside').getByRole('button', { name: 'Nhật ký hoạt động' }).click();
  await page.getByRole('button', { name: `Chi tiết sự kiện ${eventId}`, exact: true }).click();
  await expect(page.getByRole('dialog').getByText('Trước thay đổi', { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/admin-system-audit-mobile.png' });
});

test('late detail response cannot replace another selected event', async ({ page }) => {
  await mockSystemAdministration(page);
  let release!: () => void;
  const barrier = new Promise<void>(resolve => { release = resolve; });
  await page.route('http://localhost:5000/api/analytics-system/api/v1/system/audit-events/' + eventId, async route => {
    await barrier;
    await authReply(route, { json: auditEvent });
  });
  await page.goto('/admin');
  await page.locator('aside').getByRole('button', { name: 'Nhật ký hoạt động' }).click();
  const firstRequest = page.waitForRequest(request => request.url().endsWith('/audit-events/' + eventId));
  try {
    await page.getByRole('button', { name: `Chi tiết sự kiện ${eventId}`, exact: true }).click();
    await firstRequest;
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: `Chi tiết sự kiện ${auditId}`, exact: true }).click();
    await expect(page.getByRole('dialog').getByText(auditId, { exact: true })).toBeVisible();
    release();
    await expect(page.getByRole('dialog').getByText(eventId, { exact: true })).toHaveCount(0);
  } finally { release(); }
});

test('changing identity clears private data and closes old audit detail', async ({ page }) => {
  const state = await mockSystemAdministration(page);
  await page.goto('/admin');
  await page.locator('aside').getByRole('button', { name: 'Nhật ký hoạt động' }).click();
  await page.getByRole('button', { name: `Chi tiết sự kiện ${eventId}`, exact: true }).click();
  await expect(page.getByRole('dialog').getByText(eventId, { exact: true })).toBeVisible();
  state.empty = true;
  await page.evaluate(async () => {
    const { useAuthStore } = await import('/src/stores/authStore.ts');
    const user = useAuthStore.getState().user!;
    useAuthStore.setState({ user: { ...user, id: 'another-test-admin' } });
  });
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByText('Không có sự kiện phù hợp với bộ lọc.')).toBeVisible();
  await expect(page.getByRole('button', { name: `Chi tiết sự kiện ${eventId}`, exact: true })).toHaveCount(0);
});
