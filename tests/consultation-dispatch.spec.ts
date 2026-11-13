import { test, expect, type Page } from '@playwright/test';
import { authReply, mockWorkspaceAuth } from './fixtures/auth';
import { mockCatalog } from './fixtures/procedures';
import { mockAnalytics } from './fixtures/analytics';

// Tham vấn do cán bộ phụ trách khởi tạo (STAFFING-01): Quản lý cán bộ điều phối và quyết định — chỉ kiểm thử bằng mock
const requesterId = '11111111-1111-4111-8111-111111111111';
const specialistId = '44444444-4444-4444-8444-444444444444';
const blockedId = '55555555-5555-4555-8555-555555555555';
const managerId = '66666666-6666-4666-8666-666666666666';
const applicationId = '22222222-2222-4222-8222-222222222222';
const pendingId = '33333333-3333-4333-8333-333333333333';
const answeredId = '77777777-7777-4777-8777-777777777777';
const base = { applicationId, requestedBy: requesterId, requestedByName: 'Cán bộ A', applicationVersion: 1, assignmentVersion: 3, applicationCode: 'HS-2026-009', createdAtUtc: '2026-11-12T01:00:00Z' };
const pending = { ...base, id: pendingId, specialistId: null, question: 'Nhờ đối chiếu thông tin hộ tịch trong giấy tờ đính kèm.', status: 'PENDING_DISPATCH', version: 0 };
const answered = (willingToTakeOver: boolean) => ({ ...base, id: answeredId, specialistId, specialistName: 'Cán bộ B', dispatchedBy: managerId, dispatchedAtUtc: '2026-11-12T02:00:00Z', question: 'Giấy khai sinh bản sao có hợp lệ không?', answer: 'Đã đối chiếu, bản sao hợp lệ.', willingToTakeOver, status: 'ANSWERED', version: 2 });

async function setup(page: Page, items: object[]) {
  const posts: { path: string; body: Record<string, unknown> }[] = [];
  const inboxQueries: string[] = [];
  await page.clock.setFixedTime(new Date('2026-11-12T03:00:00Z'));
  await mockWorkspaceAuth(page, ['MANAGER'], ['iam.profile.read', 'workflow.dispatch.read', 'workflow.dispatch.write', 'workflow.staffing.read', 'workflow.consultation.read']);
  await mockCatalog(page);
  await mockAnalytics(page);
  await page.route('**/api/v1/staffing/**', route => {
    const url = new URL(route.request().url());
    if (route.request().method() === 'OPTIONS') return authReply(route, { status: 204 });
    if (url.pathname.endsWith('/consultations')) { inboxQueries.push(url.search); return authReply(route, { json: { items, page: 1, pageSize: 20, total: items.length } }); }
    return authReply(route, { json: [] });
  });
  await page.route('**/api/v1/manager/applications?*', route => authReply(route, { json: { items: [], page: 1, pageSize: 20, total: 0 } }));
  await page.route(`**/api/v1/applications/${applicationId}/consultations**`, route => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if (request.method() === 'OPTIONS') return authReply(route, { status: 204 });
    if (path.endsWith('/specialist-candidates')) return authReply(route, { json: [
      { officerId: blockedId, fullName: 'Cán bộ C', assignedCategories: [1], eligible: false, blockingReasons: ['NO_ACTIVE_SHIFT', 'RESPOND_PERMISSION_MISSING'] },
      { officerId: specialistId, fullName: 'Cán bộ B', assignedCategories: [1], eligible: true, blockingReasons: [] },
    ] });
    if (request.method() === 'POST') {
      const body = request.postDataJSON() as Record<string, unknown>;
      posts.push({ path, body });
      return authReply(route, { json: path.endsWith('/dispatch') ? { ...pending, specialistId, specialistName: 'Cán bộ B', status: 'OPEN', version: 1 } : { ...items[0], status: 'CLOSED', version: 3, decision: body.decision, closeReason: body.text } });
    }
    return authReply(route, { json: items });
  });
  await page.goto('/manager');
  if ((page.viewportSize()?.width ?? 1440) < 1024) await page.getByRole('button', { name: 'Mở menu điều hướng', exact: true }).click();
  await page.locator('aside').getByRole('button', { name: 'Tham vấn chuyên môn', exact: true }).click();
  await expect(page.locator('.staff-workspace')).toBeVisible();
  return { posts, inboxQueries };
}

test('Quản lý cán bộ chọn cán bộ tư vấn cho yêu cầu đang chờ điều phối', async ({ page }) => {
  const { posts, inboxQueries } = await setup(page, [pending]);
  await expect(page.getByText(pending.question, { exact: true })).toBeVisible();
  expect(inboxQueries.some(q => q.includes('status=PENDING_DISPATCH'))).toBe(true);
  await expect(page.locator('.staff-consult-meta')).toContainText('Chờ chọn cán bộ');
  await page.getByRole('button', { name: 'Chọn cán bộ tư vấn', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('combobox', { name: 'Cán bộ tư vấn' }).click();
  await expect(dialog.getByRole('option', { name: /Cán bộ C/ })).toHaveAttribute('aria-disabled', 'true');
  await expect(dialog.getByRole('option', { name: /Cán bộ C/ })).toContainText('Không có ca làm hiện tại');
  await dialog.getByRole('option', { name: /Cán bộ B/ }).click();
  await dialog.getByRole('button', { name: 'Xác nhận', exact: true }).click();
  await expect.poll(() => posts.length).toBe(1);
  expect(posts[0]).toEqual({ path: `/api/v1/applications/${applicationId}/consultations/${pendingId}/dispatch`, body: { expectedVersion: 0, specialistId } });
});

test('Quản lý cán bộ từ chối yêu cầu chờ điều phối kèm lý do', async ({ page }) => {
  const { posts } = await setup(page, [pending]);
  await page.getByRole('button', { name: 'Từ chối yêu cầu', exact: true }).click();
  await page.getByRole('dialog').getByLabel('Lý do quyết định').fill('Hướng dẫn hiện tại đã đủ để xử lý.');
  await page.getByRole('dialog').getByRole('button', { name: 'Xác nhận', exact: true }).click();
  await expect.poll(() => posts.length).toBe(1);
  expect(posts[0].body).toEqual({ expectedVersion: 0, text: 'Hướng dẫn hiện tại đã đủ để xử lý.', decision: 'DECLINE_REQUEST' });
});

test('Chuyển hồ sơ cho cán bộ tư vấn khi người đó đồng ý nhận', async ({ page }) => {
  const { posts } = await setup(page, [answered(true)]);
  await expect(page.getByText('Cán bộ tư vấn sẵn sàng tiếp nhận hồ sơ.')).toBeVisible();
  await page.getByRole('button', { name: 'Chuyển hồ sơ cho cán bộ tư vấn', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('Người phụ trách hồ sơ sẽ chuyển sang Cán bộ B');
  await page.getByRole('dialog').getByLabel('Lý do quyết định').fill('B tiếp nhận để đối chiếu chuyên sâu.');
  await page.getByRole('dialog').getByRole('button', { name: 'Xác nhận', exact: true }).click();
  await expect.poll(() => posts.length).toBe(1);
  expect(posts[0].body).toEqual({ expectedVersion: 2, text: 'B tiếp nhận để đối chiếu chuyên sâu.', decision: 'TRANSFER_TO_SPECIALIST', expectedAssignmentVersion: 3 });
});

test('Cán bộ tư vấn chỉ góp ý thì chỉ được giữ cán bộ phụ trách', async ({ page }) => {
  const { posts } = await setup(page, [answered(false)]);
  await expect(page.getByText('Cán bộ tư vấn chỉ góp ý, không đề nghị nhận hồ sơ.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Chuyển hồ sơ cho cán bộ tư vấn', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Giữ cán bộ phụ trách', exact: true }).click();
  await page.getByRole('dialog').getByLabel('Lý do quyết định').fill('A tiếp tục xử lý theo góp ý của B.');
  await page.getByRole('dialog').getByRole('button', { name: 'Xác nhận', exact: true }).click();
  await expect.poll(() => posts.length).toBe(1);
  expect(posts[0].body).toEqual({ expectedVersion: 2, text: 'A tiếp tục xử lý theo góp ý của B.', decision: 'KEEP_ASSIGNEE' });
});

test('Hộp thư tham vấn không tràn ngang ở 360px', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await setup(page, [pending, answered(true)]);
  await expect(page.getByText(pending.question, { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
