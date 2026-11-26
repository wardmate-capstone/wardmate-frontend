import { test, expect, type Page } from '@playwright/test';
import { authReply, mockWorkspaceAuth } from './fixtures/auth';

const officer = '11111111-1111-4111-8111-111111111111';
const missing = '22222222-2222-4222-8222-222222222222';
const shift = (id: string, officerId: string, startsAtUtc: string, endsAtUtc: string, cancelled = false) => ({
  id, officerId, wardCode: 'P01', startsAtUtc, endsAtUtc,
  cancelledAtUtc: cancelled ? '2026-10-30T00:00:00Z' : null,
  cancellationReason: cancelled ? 'Điều chỉnh nhân sự' : null,
});
const morning = shift('33333333-3333-4333-8333-333333333333', officer, '2026-11-01T00:30:00Z', '2026-11-01T04:30:00Z');
const cancelled = shift('44444444-4444-4444-8444-444444444444', officer, '2026-11-02T06:00:00Z', '2026-11-02T10:00:00Z', true);
const overnight = shift('55555555-5555-4555-8555-555555555555', officer, '2026-10-31T16:00:00Z', '2026-10-31T19:00:00Z');

async function setup(page: Page, manage = true) {
  await page.clock.setFixedTime(new Date('2026-11-01T02:00:00Z'));
  await mockWorkspaceAuth(page, ['MANAGER'], ['iam.profile.read', 'workflow.staffing.read', ...(manage ? ['workflow.staffing.manage'] : [])]);
  await page.route('**/api/v1/manager/officers?*', route => authReply(route, { json: { items: [
    { id: officer, username: 'frontdesk', email: 'frontdesk@example.test', fullName: 'Nguyễn Văn An', isActive: true, roles: ['FRONT_DESK_OFFICER'], wardCode: 'P01', assignedCategories: [] },
    { id: '66666666-6666-4666-8666-666666666666', username: 'no.shift', email: 'empty@example.test', fullName: 'Trần Thị Bình', isActive: true, roles: ['FRONT_DESK_OFFICER'], wardCode: 'P01', assignedCategories: [] },
  ], page: 1, pageSize: 100, total: 2 } }));
  const requests: string[] = [];
  await page.route('**/api/v1/staffing/ward-shifts?*', route => {
    const url = new URL(route.request().url());
    requests.push(url.search);
    return authReply(route, { json: url.searchParams.get('month') === '10' ? [{ officerId: officer, shifts: [overnight] }] : [{ officerId: officer, shifts: [morning, cancelled] }] });
  });
  return requests;
}

test('Lịch toàn phường: mọi cán bộ, ca qua tháng UTC, ca hủy và tìm kiếm', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  const requests = await setup(page);
  await page.goto('/manager?section=shifts');
  const table = page.getByRole('table').filter({ hasText: 'Cán bộ Một cửa' });
  await expect(table).toContainText('Nguyễn Văn An');
  await expect(table).toContainText('Trần Thị Bình');
  await expect(table).toContainText('07:30–11:30');
  await expect(table).toContainText('23:00–02:00');
  await expect(table).toContainText('Từ 31/10/2026');
  expect(requests).toEqual(expect.arrayContaining(['?year=2026&month=11', '?year=2026&month=10']));
  await page.screenshot({ path: testInfo.outputPath('ward-schedule-desktop.png'), fullPage: true });
  // FE-14: tuần Thứ Hai–Chủ nhật; 01/11/2026 là Chủ nhật nên tuần đầu mượn 26–31/10 (hiện mờ, không có ca)
  await expect(page.getByText('26/10/2026 – 01/11/2026')).toBeVisible();
  await expect(table.locator('thead th').nth(1)).toContainText('26/10');
  await expect(table.locator('td.ward-roster-outside').first()).toBeVisible();
  await page.getByRole('searchbox', { name: 'Tìm cán bộ' }).fill('Nguyễn');
  await expect(table.getByRole('row')).toHaveCount(2);
  await page.getByRole('button', { name: 'Tuần sau', exact: true }).click();
  await expect(page.getByText('02/11/2026 – 08/11/2026')).toBeVisible();
  await expect(table).not.toContainText('07:30–11:30');
  await expect(table).toContainText('Điều chỉnh nhân sự');
  await page.getByLabel('Hiện ca đã hủy', { exact: true }).uncheck();
  await expect(table).not.toContainText('Điều chỉnh nhân sự');
});

test('Lịch toàn phường: đổi tháng/năm, lỗi API và thử lại', async ({ page }) => {
  await setup(page);
  let fail = true;
  await page.route('**/api/v1/staffing/ward-shifts?*', route => fail ? authReply(route, { status: 503, json: { code: 'staffing.iam_unavailable' } }) : route.fallback());
  await page.goto('/manager?section=shifts');
  await expect(page.locator('.ward-schedule').getByRole('alert')).toBeVisible();
  await expect(page.locator('.ward-roster')).toHaveCount(0);
  fail = false;
  await page.locator('.ward-schedule').getByRole('button', { name: 'Thử lại', exact: true }).click();
  await expect(page.locator('.ward-roster')).toBeVisible();
  const next = page.waitForRequest(r => r.url().includes('ward-shifts?year=2026&month=12'));
  await page.getByRole('combobox', { name: 'Tháng lịch toàn phường' }).selectOption('12');
  await next;
  await expect(page.getByText('30/11/2026 – 06/12/2026')).toBeVisible();
  // Ô năm chỉ có năm trước, năm nay, năm sau (không sổ 100 năm).
  await expect(page.getByRole('combobox', { name: 'Năm lịch toàn phường' }).locator('option')).toHaveCount(3);
  const year = page.waitForRequest(r => r.url().includes('ward-shifts?year=2027&month=12'));
  await page.getByRole('combobox', { name: 'Năm lịch toàn phường' }).selectOption('2027');
  await year;
});

test('Manager thiếu quyền manage không gọi ward-shifts', async ({ page }) => {
  const requests = await setup(page, false);
  await page.goto('/manager?section=shifts');
  await expect(page.getByText('Bạn cần quyền quản lý lịch để xem lịch toàn phường.')).toBeVisible();
  expect(requests).toEqual([]);
});

test('Response sai cấu trúc không hiển thị thành lịch trống', async ({ page }) => {
  await setup(page);
  await page.route('**/api/v1/staffing/ward-shifts?*', route => authReply(route, { json: [{ officerId: officer, shifts: [{ ...morning, officerId: missing }] }] }));
  await page.goto('/manager?section=shifts');
  await expect(page.locator('.ward-schedule').getByRole('alert')).toContainText('Dữ liệu ca làm không hợp lệ');
  await expect(page.locator('.ward-roster')).toHaveCount(0);
});

test('Bảng lịch trên mobile cuộn bên trong, giữ cột cán bộ', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await setup(page);
  await page.goto('/manager?section=shifts');
  await expect(page.locator('.ward-roster-table')).toContainText('Nguyễn Văn An');
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const scroll = page.locator('.ward-roster-scroll');
  await page.getByRole('rowheader').filter({ hasText: 'Nguyễn Văn An' }).scrollIntoViewIfNeeded();
  await scroll.evaluate(el => { el.scrollLeft = 350; });
  await expect(page.getByRole('rowheader').filter({ hasText: 'Nguyễn Văn An' })).toBeInViewport();
  await scroll.evaluate(el => { el.scrollLeft = 0; });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: testInfo.outputPath('ward-schedule-mobile.png'), fullPage: true });
  for (const width of [768, 360]) {
    await page.setViewportSize({ width, height: 1000 });
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.getByRole('rowheader').filter({ hasText: 'Nguyễn Văn An' }).scrollIntoViewIfNeeded();
    await scroll.evaluate(el => { el.scrollLeft = 350; });
    await expect(page.getByRole('rowheader').filter({ hasText: 'Nguyễn Văn An' })).toBeInViewport();
    await scroll.evaluate(el => { el.scrollLeft = 0; });
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: testInfo.outputPath(`ward-schedule-${width}.png`), fullPage: true });
  }
});

test('Manager chuyển chế độ lịch, giữ rõ lựa chọn và hướng dẫn xếp lịch', async ({ page }) => {
  await setup(page);
  await page.goto('/manager?section=shifts');
  const modes = page.getByRole('group', { name: 'Chế độ lịch làm việc' });
  await expect(modes.getByRole('button')).toHaveCount(4);
  await expect(modes.getByRole('button', { name: 'Lịch toàn phường', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await modes.getByRole('button', { name: 'Sắp xếp lịch tháng', exact: true }).click();
  await expect(page.getByRole('combobox', { name: '1. Chọn cán bộ', exact: true })).toBeVisible();
  await expect(page.getByText('Chọn cán bộ để xem và xếp lịch tháng.', { exact: true })).toBeVisible();
  await modes.getByRole('button', { name: 'Danh sách ca', exact: true }).click();
  await expect(page.getByRole('combobox', { name: 'Cán bộ xem lịch', exact: true })).toBeVisible();
  await modes.getByRole('button', { name: 'Lịch toàn phường', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Lịch làm việc toàn phường', exact: true })).toBeVisible();
});

test('Lịch toàn phường: chỉ cán bộ Frontdesk đang hoạt động, ẩn ca của tài khoản cũ', async ({ page }) => {
  await setup(page);
  const inactiveWithShift = '77777777-7777-4777-8777-777777777777';
  const fd = (id: string, fullName: string, isActive: boolean) => ({ id, username: id.slice(0, 8), email: `${id.slice(0, 8)}@example.test`, fullName, isActive, roles: ['FRONT_DESK_OFFICER'], wardCode: 'P01', assignedCategories: [] });
  await page.route('**/api/v1/manager/officers?*', route => authReply(route, { json: { items: [
    fd(officer, 'Nguyễn Văn An', true),
    fd('88888888-8888-4888-8888-888888888888', 'Lê Văn Cường', false),
    fd(inactiveWithShift, 'Phạm Thị Dung', false),
  ], page: 1, pageSize: 100, total: 3 } }));
  const orphanShift = shift('99999999-9999-4999-8999-999999999999', inactiveWithShift, '2026-11-01T06:00:00Z', '2026-11-01T10:00:00Z');
  await page.route('**/api/v1/staffing/ward-shifts?*', route => authReply(route, { json: new URL(route.request().url()).searchParams.get('month') === '10' ? [] : [
    { officerId: officer, shifts: [morning] },
    { officerId: inactiveWithShift, shifts: [orphanShift] },
    { officerId: missing, shifts: [shift('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', missing, '2026-11-05T01:00:00Z', '2026-11-05T12:00:00Z')] },
  ] }));
  await page.goto('/manager?section=shifts');
  const table = page.getByRole('table').filter({ hasText: 'Cán bộ Một cửa' });
  await expect(table).toContainText('Nguyễn Văn An');
  await expect(table.getByRole('rowheader')).toHaveCount(1);
  await expect(table).not.toContainText('Phạm Thị Dung');
  await expect(table).not.toContainText('Lê Văn Cường');
  await expect(table).not.toContainText(missing);
  await expect(page.getByText('1 cán bộ · Tháng 11/2026')).toBeVisible();
  await expect(page.locator('.ward-roster-orphans')).toHaveCount(0);
  await expect(page.getByText('mã 22222222')).toHaveCount(0);
});
