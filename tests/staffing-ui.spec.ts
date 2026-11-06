import { test, expect, type Page } from '@playwright/test';
import { authReply, mockWorkspaceAuth } from './fixtures/auth';
import { mockCatalog } from './fixtures/procedures';
import { mockAnalytics } from './fixtures/analytics';

const officerId = '11111111-1111-4111-8111-111111111111';
const applicationId = '22222222-2222-4222-8222-222222222222';
const itemId = '33333333-3333-4333-8333-333333333333';
const period = { startsAtUtc: '2026-11-07T00:00:00Z', endsAtUtc: '2026-11-07T10:00:00Z' };
const consultation = { id: itemId, applicationId, specialistId: officerId, requestedBy: officerId, applicationVersion: 1, assignmentVersion: 1, question: 'Cần đối chiếu thành phần hồ sơ nào trước khi tiền kiểm?', answer: 'Đối chiếu giấy tờ theo danh mục thủ tục.', status: 'ANSWERED', version: 1, createdAtUtc: '2026-11-05T01:00:00Z' };

async function setup(page: Page) {
  await page.clock.setFixedTime(new Date('2026-11-05T02:00:00Z'));
  await mockWorkspaceAuth(page, ['MANAGER'], ['iam.profile.read', 'workflow.dispatch.read', 'workflow.dispatch.write', 'workflow.staffing.read', 'workflow.staffing.manage', 'workflow.consultation.read']);
  await mockCatalog(page);
  await mockAnalytics(page);
  await page.route('**/api/v1/manager/officers?*', route => authReply(route, { json: {
    items: [{ id: officerId, username: 'canbo.kiemthu', email: 'officer@example.test', fullName: 'Cán bộ kiểm thử', isActive: true, wardCode: 'WARD_A', roles: ['FRONT_DESK_OFFICER'], assignedCategories: [1] }], page: 1, pageSize: 100, total: 1,
  } }));
  await page.route('**/api/v1/staffing/**', route => {
    const path = new URL(route.request().url()).pathname;
    if (route.request().method() === 'OPTIONS') return authReply(route, { status: 204 });
    if (/\/schedules\/\d{4}-\d{2}-01$/.test(path)) return authReply(route, { json: { month: path.split('/').at(-1), slots: [{ shiftId: itemId, officerId, startsAt: period.startsAtUtc, endsAt: period.endsAtUtc, shiftVersion: 1 }], baseFingerprint: 'A'.repeat(64), draft: null, leaves: [], closures: [], confirmations: [] } });
    if (path.endsWith('/shifts')) return authReply(route, { json: [{ id: itemId, officerId, wardCode: 'WARD_A', ...period }] });
    if (path.endsWith('/leaves')) return authReply(route, { json: [{ id: itemId, officerId, wardCode: 'WARD_A', ...period, reason: 'Nghỉ giải quyết việc gia đình.', status: 'PENDING', version: 1 }] });
    if (path.endsWith('/closures')) return authReply(route, { json: [{ id: itemId, wardCode: 'WARD_A', date: '2026-11-07', effectiveFromUtc: period.startsAtUtc, reason: 'Bảo trì trụ sở làm việc.', createdBy: officerId, createdAtUtc: '2026-11-05T01:00:00Z', cancelled: false, cancelledBy: null, cancelledAtUtc: null, cancellationReason: null }] });
    if (path.endsWith('/consultations')) return authReply(route, { json: { items: [consultation], page: 1, pageSize: 20, total: 1 } });
    return authReply(route, { status: 404 });
  });
  await page.route('**/api/v1/manager/applications?*', route => authReply(route, { json: { items: [{ id: applicationId, applicationCode: 'HS-2026-001', procedureId: itemId, procedureTitle: 'Chứng thực bản sao từ bản chính', status: 'SUBMITTED', assignedOfficerId: null, assignmentVersion: 0 }], page: 1, pageSize: 20, total: 1 } }));
  await page.route(`**/api/v1/applications/${applicationId}/consultations`, route => authReply(route, { json: [consultation] }));
  await page.goto('/manager');
}

async function navigate(page: Page, name: string) {
  if ((page.viewportSize()?.width ?? 1440) < 1024) await page.getByRole('button', { name: 'Mở menu điều hướng', exact: true }).click();
  await page.locator('aside').getByRole('button', { name, exact: true }).click();
  await expect(page.locator('.staff-workspace')).toBeVisible();
  if (name === 'Lịch ca làm') { await page.getByRole('button', { name: 'Danh sách ca', exact: true }).click(); await page.getByRole('combobox', { name: 'Cán bộ xem lịch', exact: true }).selectOption(officerId); }
}

for (const width of [1440, 768, 390, 360]) {
  test(`Năm màn điều hành hiển thị dữ liệu và không tràn ngang ở ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 1000 });
    await setup(page);
    for (const [name, content] of [
      ['Điều phối hồ sơ', 'HS-2026-001'],
      ['Lịch ca làm', '07:00–17:00'],
      ['Lịch ngày nghỉ', 'Bảo trì trụ sở làm việc.'],
      ['Duyệt nghỉ phép', 'Nghỉ giải quyết việc gia đình.'],
      ['Tham vấn chuyên môn', consultation.question],
    ]) {
      await navigate(page, name);
      await expect(page.locator('.staff-workspace').getByText(content, { exact: true })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      if (name === 'Lịch ca làm') {
        await expect(page.getByRole('table')).toContainText('07:00–17:00');
        await expect(page.getByRole('button', { name: 'Tạo ca làm', exact: true })).toHaveCount(0);
        await expect(page.getByRole('button', { name: 'Hủy ca', exact: true })).toHaveCount(0);
        await page.screenshot({ path: testInfo.outputPath('shift-list.png'), fullPage: true });
      }
      if (name === 'Tham vấn chuyên môn') {
        await page.getByRole('button', { name: 'Xem tham vấn cùng hồ sơ' }).click();
        await expect(page.getByRole('dialog').getByText(consultation.question, { exact: true })).toBeVisible();
      }
    }
  });
}

test('Danh sách tháng: lỗi đọc, thử lại và chọn năm/tháng', async ({ page }) => {
  await setup(page);
  let fail = true;
  await page.route('**/api/v1/staffing/schedules/*', async route => {
    if (fail) return authReply(route, { status: 503, json: { code: 'schedule.unavailable' } });
    return route.fallback();
  });
  await navigate(page, 'Lịch ca làm');
  await expect(page.locator('.staff-workspace').getByRole('alert')).toBeVisible();
  fail = false;
  await page.getByRole('button', { name: 'Thử lại', exact: true }).click();
  await expect(page.getByRole('table')).toContainText('07:00–17:00');
  await page.getByRole('combobox', { name: 'Tháng xem lịch', exact: true }).selectOption('12');
  await expect(page.getByRole('table')).toContainText('31/12/2026');
});
