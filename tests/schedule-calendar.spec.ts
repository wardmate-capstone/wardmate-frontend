import { test, expect, type Page } from '@playwright/test';
import { mockWorkSchedules, scheduleIds as ids } from './fixtures/workSchedules';
import { authReply } from './fixtures/auth';

test.setTimeout(60000);
async function openCalendar(page: Page) {
  await page.goto('/manager?section=shifts');
  await page.getByRole('combobox', { name: '1. Chọn cán bộ', exact: true }).selectOption(ids.officer);
  await expect(page.getByRole('button', { name: /^Ngày 07\/11\/2026/ })).toBeVisible({ timeout: 15000 });
}
async function setHours(page: Page, date: string, start: string, end: string) {
  await page.getByRole('button', { name: new RegExp('^Ngày ' + date) }).click();
  const dialog = page.getByRole('dialog', { name: 'Giờ làm ngày ' + date, exact: true });
  await dialog.getByLabel('Từ giờ', { exact: true }).fill(start);
  await dialog.getByLabel('Đến giờ', { exact: true }).fill(end);
  await dialog.getByRole('button', { name: 'Áp dụng vào lịch', exact: true }).click();
  await expect(dialog).not.toBeVisible();
}
async function publishCalendar(page: Page) {
  await page.getByRole('button', { name: 'Xác nhận công bố lịch', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Công bố lịch tháng?', exact: true });
  await dialog.getByRole('checkbox', { name: 'Tôi đã kiểm tra giờ làm và các cán bộ có lịch thay đổi.' }).check();
  await dialog.getByRole('button', { name: 'Công bố lịch', exact: true }).click();
  return dialog;
}

test('Lịch mặc định đúng giờ cho mọi cán bộ, giữ sửa tay và bỏ lễ/nghỉ phép', async ({ page }) => {
  const state = await mockWorkSchedules(page, true);
  await page.route('**/api/v1/staffing/schedules/2026-11-01', route => authReply(route, { json: {
    month: '2026-11-01', slots: state.slots, baseFingerprint: state.fingerprint, draft: state.draft, confirmations: [],
    leaves: [{ id: ids.leave, officerId: ids.officer, startsAtUtc: '2026-11-12T00:30:00Z', endsAtUtc: '2026-11-12T04:30:00Z' }],
    closures: [{ id: ids.leave, closureDate: '2026-11-11', wardCode: 'P01' }],
  } }));
  await openCalendar(page);
  await setHours(page, '10/11/2026', '09:00', '12:00');
  await page.getByRole('button', { name: /^Ngày 07\/11\/2026/ }).click();
  const editor = page.getByRole('dialog', { name: 'Giờ làm ngày 07/11/2026', exact: true });
  await editor.getByRole('button', { name: 'Bỏ ca 1', exact: true }).click();
  await editor.getByRole('button', { name: 'Áp dụng vào lịch', exact: true }).click();
  await page.getByText('Tiện ích xếp lịch', { exact: true }).click();
  await page.getByRole('button', { name: 'Điền lịch mặc định cho tất cả cán bộ', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('ca mặc định');
  await expect(page.getByRole('button', { name: /^Ngày 09\/11\/2026/ })).toContainText('07:30');
  await expect(page.getByRole('button', { name: /^Ngày 09\/11\/2026/ })).toContainText('13:00');
  await expect(page.getByRole('button', { name: /^Ngày 14\/11\/2026/ })).toContainText('07:30');
  expect(state.requests.some(r => r.method === 'PUT' || r.path.endsWith('/publish'))).toBe(false);
  const defaults = page.getByRole('region', { name: 'Lịch mặc định cho tất cả cán bộ', exact: true });
  await defaults.screenshot({ path: 'test-results/default-schedule-desktop.png' });
  await page.setViewportSize({ width: 390, height: 1000 });
  await expect.poll(async () => (await defaults.boundingBox())!.x).toBeLessThan(32);
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await defaults.screenshot({ path: 'test-results/default-schedule-mobile.png' });
  await expect(await publishCalendar(page)).not.toBeVisible();
  for (const officerId of [ids.officer, ids.officer2]) {
    const monday = state.slots.filter(s => s.officerId === officerId && s.startsAt.startsWith('2026-11-09'));
    expect(monday.map(s => [s.startsAt, s.endsAt])).toEqual([
      ['2026-11-09T00:30:00.000Z', '2026-11-09T04:30:00.000Z'],
      ['2026-11-09T06:00:00.000Z', '2026-11-09T10:00:00.000Z'],
    ]);
    expect(state.slots.filter(s => s.officerId === officerId && s.startsAt.startsWith('2026-11-14'))).toHaveLength(1);
    expect(state.slots.some(s => s.officerId === officerId && (s.startsAt.startsWith('2026-11-11') || s.startsAt.startsWith('2026-11-15')))).toBe(false);
  }
  expect(state.slots.some(s => s.officerId === ids.officer && s.startsAt.startsWith('2026-11-07'))).toBe(false);
  expect(state.slots.filter(s => s.officerId === ids.officer && s.startsAt.startsWith('2026-11-10')).map(s => s.startsAt)).toEqual(['2026-11-10T02:00:00.000Z']);
  expect(state.slots.filter(s => s.officerId === ids.officer && s.startsAt.startsWith('2026-11-12')).map(s => s.startsAt)).toEqual(['2026-11-12T06:00:00.000Z']);
});

test('Chọn cán bộ trước tháng; sửa giờ và công bố giữ đủ lịch người khác', async ({ page }) => {
  const state = await mockWorkSchedules(page, true);
  const other = { ...state.slots[0], officerId: ids.officer2, shiftId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc' };
  state.slots.push(other);
  await page.goto('/manager?section=shifts');
  await expect(page.getByRole('combobox', { name: 'Tháng làm việc', exact: true })).toBeDisabled();
  await expect(page.getByText('Chọn cán bộ để xem và xếp lịch tháng.', { exact: true })).toBeVisible();
  await page.getByRole('combobox', { name: '1. Chọn cán bộ', exact: true }).selectOption(ids.officer);
  await expect(page.getByRole('button', { name: /^Ngày \d/ })).toHaveCount(30);
  await setHours(page, '07/11/2026', '09:00', '12:00');
  await expect(await publishCalendar(page)).not.toBeVisible();
  const save = state.requests.find(r => r.method === 'PUT' && r.path.endsWith('/draft'))!;
  expect((save.body as { slots: unknown[] }).slots).toHaveLength(2);
  expect((save.body as { slots: unknown[] }).slots).toContainEqual(other);
  expect(state.slots.find(s => s.officerId === ids.officer)?.startsAt).toBe('2026-11-07T02:00:00.000Z');
  expect(state.requests.find(r => r.path.endsWith('/publish'))?.body).toMatchObject({ allowClosure: false, revisionId: ids.monthly, expectedVersion: 1 });
});

test('Giờ sai, ca chồng nhau bị chặn; đổi cán bộ cảnh báo bỏ thay đổi', async ({ page }) => {
  const state = await mockWorkSchedules(page, true);
  await openCalendar(page);
  await page.getByRole('button', { name: /^Ngày 07\/11\/2026/ }).click();
  const dialog = page.getByRole('dialog', { name: 'Giờ làm ngày 07/11/2026', exact: true });
  await dialog.getByLabel('Đến giờ', { exact: true }).fill('07:00');
  await dialog.getByRole('button', { name: 'Áp dụng vào lịch', exact: true }).click();
  await expect(dialog.getByRole('alert')).toContainText('kết thúc phải sau');
  await dialog.getByLabel('Đến giờ', { exact: true }).fill('17:00');
  await dialog.getByRole('button', { name: 'Thêm ca trong ngày', exact: true }).click();
  await dialog.getByRole('button', { name: 'Áp dụng vào lịch', exact: true }).click();
  await expect(dialog.getByRole('alert')).toContainText('trùng giờ');
  await dialog.getByRole('button', { name: 'Bỏ ca 2', exact: true }).click();
  await dialog.getByRole('button', { name: 'Áp dụng vào lịch', exact: true }).click();
  await page.getByRole('combobox', { name: '1. Chọn cán bộ', exact: true }).selectOption(ids.officer2);
  await expect(page.getByRole('dialog', { name: 'Bỏ thay đổi chưa lưu?', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Tiếp tục chỉnh sửa', exact: true }).click();
  await expect(page.getByRole('combobox', { name: '1. Chọn cán bộ', exact: true })).toHaveValue(ids.officer);
  expect(state.requests.some(r => r.method !== 'GET')).toBe(false);
});

test('Xung đột lưu: giữ giờ và không công bố, không tự gửi lại', async ({ page }) => {
  const state = await mockWorkSchedules(page, true); state.conflict = true;
  await openCalendar(page);
  await setHours(page, '07/11/2026', '09:00', '12:00');
  const dialog = await publishCalendar(page);
  await expect(dialog.getByRole('alert')).toContainText('Ca hoặc lịch đã thay đổi');
  await expect(dialog.getByRole('button', { name: 'Công bố lịch', exact: true })).toBeDisabled();
  expect(state.requests.filter(r => r.path.endsWith('/draft'))).toHaveLength(1);
  expect(state.requests.some(r => r.path.endsWith('/publish'))).toBe(false);
});

test('Đã lưu nhưng lỗi công bố: thử lại đúng revision và không lưu thêm bản', async ({ page }) => {
  const state = await mockWorkSchedules(page, true);
  let fail = true;
  await page.route('**/api/v1/staffing/schedules/*/publish', async route => {
    if (fail) return authReply(route, { status: 503, json: { code: 'schedule.unavailable' } });
    await route.fallback();
  });
  await openCalendar(page); await setHours(page, '07/11/2026', '09:00', '12:00');
  const dialog = await publishCalendar(page);
  await expect(dialog.getByRole('alert')).toBeVisible();
  await dialog.getByRole('button', { name: 'Quay lại lịch', exact: true }).click();
  fail = false;
  await page.getByRole('button', { name: 'Kiểm tra và thử công bố lại', exact: true }).click();
  await expect.poll(() => state.draft).toBeNull();
  expect(state.requests.filter(r => r.path.endsWith('/draft'))).toHaveLength(1);
  expect(state.requests.find(r => r.path.endsWith('/publish'))?.body).toMatchObject({ revisionId: ids.monthly, expectedVersion: 1 });
});

test('Bản soạn cũ yêu cầu xác nhận trước khi lập lại từ lịch chính thức', async ({ page }) => {
  const state = await mockWorkSchedules(page, true);
  state.draft = { id: ids.monthly, month: '2026-11-01', status: 'DRAFT', version: 4, baseFingerprint: 'B'.repeat(64), actorId: ids.manager, reason: 'Bản cũ', publishedAtUtc: null, slots: state.slots };
  await openCalendar(page);
  await expect(page.getByRole('button', { name: 'Xác nhận công bố lịch', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Bắt đầu lại từ lịch chính thức', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('kể cả của cán bộ khác');
  await page.getByRole('button', { name: 'Dùng lịch chính thức', exact: true }).click();
  await setHours(page, '07/11/2026', '09:00', '12:00');
  await expect(await publishCalendar(page)).not.toBeVisible();
  expect(state.requests.find(r => r.method === 'PUT' && r.path.endsWith('/draft'))?.body).toMatchObject({ expectedVersion: 4, baseFingerprint: state.fingerprint });
});

test('Tiện ích giờ tuần, sao chép và lịch sử vẫn dùng API, chưa ghi lịch khi xem trước', async ({ page }) => {
  const state = await mockWorkSchedules(page, true);
  await openCalendar(page); await page.getByText('Tiện ích xếp lịch', { exact: true }).click();
  await expect(page.getByRole('button', { name: 'Sao chép vào ngày trống', exact: true })).toBeDisabled();
  await page.getByRole('combobox', { name: 'Tháng nguồn', exact: true }).selectOption('11');
  await expect(page.getByText('Chọn tháng nguồn khác tháng đang xem.', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Sao chép vào ngày trống', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Thiết lập giờ tuần', exact: true }).click();
  const week = page.getByRole('dialog', { name: 'Giờ làm lặp lại hằng tuần', exact: true });
  await week.getByRole('button', { name: 'Thêm giờ làm', exact: true }).click();
  await week.getByRole('combobox', { name: 'Cán bộ', exact: true }).selectOption(ids.officer);
  await week.getByRole('button', { name: 'Lưu thiết lập', exact: true }).click();
  await expect(week).not.toBeVisible();
  await page.getByRole('combobox', { name: 'Tháng nguồn', exact: true }).selectOption('10');
  await page.getByRole('button', { name: 'Sao chép vào ngày trống', exact: true }).click();
  await expect.poll(() => state.requests.some(r => r.path.endsWith('/preview'))).toBe(true);
  expect(state.requests.find(r => r.path.endsWith('/preview'))?.query).toBe('?copyFrom=2026-10-01');
  expect(state.requests.some(r => r.path.endsWith('/draft') || r.path.endsWith('/publish'))).toBe(false);
  await expect(page.getByRole('status')).toContainText('Không có ngày trống phù hợp để điền.');
  const tools = page.getByText('Tiện ích xếp lịch', { exact: true }).locator('..');
  await tools.screenshot({ path: 'test-results/schedule-tools-desktop.png' });
  await page.setViewportSize({ width: 390, height: 1000 });
  await expect.poll(async () => (await tools.boundingBox())!.x).toBeLessThan(32);
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await tools.screenshot({ path: 'test-results/schedule-tools-mobile.png' });
  await page.getByRole('button', { name: 'Lịch sử công bố', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Dữ liệu ban đầu', exact: true })).toBeVisible();
});

test('Điền lịch báo đúng số ngày, giữ ngày sửa tay và chưa lưu hoặc công bố', async ({ page }) => {
  const state = await mockWorkSchedules(page, true);
  await page.route('**/api/v1/staffing/schedules/*/preview*', route => authReply(route, { json: {
    month: '2026-11-01', baseFingerprint: state.fingerprint, conflicts: [], closures: [],
    slots: [8, 9].map(day => ({ ...state.slots[0], shiftId: `cccccccc-cccc-4ccc-8ccc-${String(day).padStart(12, '0')}`, startsAt: `2026-11-${String(day).padStart(2, '0')}T01:00:00Z`, endsAt: `2026-11-${String(day).padStart(2, '0')}T05:00:00Z` })),
  } }));
  await openCalendar(page);
  await setHours(page, '08/11/2026', '10:00', '12:00');
  await page.getByText('Tiện ích xếp lịch', { exact: true }).click();
  await page.getByRole('button', { name: 'Điền theo giờ tuần', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Đã điền giờ cho 1 ngày trống.');
  await expect(page.getByRole('button', { name: /^Ngày 08\/11\/2026/ })).toContainText('10:00');
  await expect(page.getByRole('button', { name: /^Ngày 09\/11\/2026/ })).toContainText('08:00');
  expect(state.requests.some(r => r.path.endsWith('/draft') || r.path.endsWith('/publish'))).toBe(false);
  expect(state.slots).toHaveLength(1);
});

test('Ngày lễ yêu cầu xác nhận ngoại lệ; nghỉ phép được duyệt chặn giờ trùng', async ({ page }) => {
  const state = await mockWorkSchedules(page, true);
  await page.route('**/api/v1/staffing/schedules/2026-11-01', route => authReply(route, { json: { month: '2026-11-01', slots: state.slots, baseFingerprint: state.fingerprint, draft: state.draft, leaves: [{ id: ids.leave, officerId: ids.officer, startsAtUtc: '2026-11-08T01:00:00Z', endsAtUtc: '2026-11-08T05:00:00Z' }], closures: [{ id: ids.leave, closureDate: '2026-11-07', wardCode: 'P01' }], confirmations: [] } }));
  await openCalendar(page);
  await page.getByRole('button', { name: /^Ngày 08\/11\/2026/ }).click();
  const hours = page.getByRole('dialog', { name: 'Giờ làm ngày 08/11/2026', exact: true });
  await hours.getByRole('button', { name: 'Áp dụng vào lịch', exact: true }).click();
  await expect(hours.getByRole('alert')).toContainText('nghỉ phép đã duyệt');
  await hours.getByRole('button', { name: 'Quay lại', exact: true }).click();
  await setHours(page, '07/11/2026', '09:00', '12:00');
  await page.getByRole('button', { name: 'Xác nhận công bố lịch', exact: true }).click();
  const confirm = page.getByRole('dialog', { name: 'Công bố lịch tháng?', exact: true });
  await confirm.getByRole('checkbox', { name: 'Tôi đã kiểm tra giờ làm và các cán bộ có lịch thay đổi.' }).check();
  await expect(confirm.getByRole('button', { name: 'Công bố lịch', exact: true })).toBeDisabled();
  await confirm.getByRole('checkbox', { name: 'Tôi xác nhận bố trí ca trong ngày nghỉ / lễ chung.' }).check();
  await confirm.getByRole('button', { name: 'Công bố lịch', exact: true }).click();
  await expect(confirm).not.toBeVisible();
  expect(state.requests.find(r => r.path.endsWith('/publish'))?.body).toMatchObject({ allowClosure: true });
});

test('Ca qua đêm hiển thị ngày sau và không tick nghỉ nhầm', async ({ page }) => {
  await mockWorkSchedules(page, true); await openCalendar(page);
  await page.getByRole('button', { name: /^Ngày 07\/11\/2026/ }).click();
  const dialog = page.getByRole('dialog', { name: 'Giờ làm ngày 07/11/2026', exact: true });
  await dialog.getByLabel('Từ giờ', { exact: true }).fill('22:00');
  await dialog.getByLabel('Đến giờ', { exact: true }).fill('06:00');
  await dialog.getByLabel('Kết thúc ngày hôm sau', { exact: true }).check();
  await dialog.getByRole('button', { name: 'Áp dụng vào lịch', exact: true }).click();
  await page.getByRole('button', { name: /^Ngày 08\/11\/2026/ }).click();
  const next = page.getByRole('dialog', { name: 'Giờ làm ngày 08/11/2026', exact: true });
  await next.getByLabel('Từ giờ', { exact: true }).fill('05:00');
  await next.getByRole('button', { name: 'Áp dụng vào lịch', exact: true }).click();
  await expect(next.getByRole('alert')).toContainText('trùng giờ');
});

test('Bản soạn người khác được giữ và xuất hiện trong xác nhận; thay đổi đồng thời chặn trước PUT', async ({ page }) => {
  const state = await mockWorkSchedules(page, true);
  const pending = { ...state.slots[0], officerId: ids.officer2, shiftId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc' };
  state.draft = { id: ids.monthly, month: '2026-11-01', status: 'DRAFT', version: 2, baseFingerprint: state.fingerprint, actorId: ids.manager, reason: 'Lịch đang soạn', publishedAtUtc: null, slots: [...state.slots, pending] };
  await openCalendar(page); await setHours(page, '07/11/2026', '09:00', '12:00');
  await page.getByRole('button', { name: 'Xác nhận công bố lịch', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Công bố lịch tháng?', exact: true });
  await expect(dialog).toContainText('Cán bộ thứ hai');
  await expect(dialog).toContainText('Giờ mới: 07/11/2026');
  state.fingerprint = 'B'.repeat(64);
  await dialog.getByRole('checkbox', { name: 'Tôi đã kiểm tra giờ làm và các cán bộ có lịch thay đổi.' }).check();
  await dialog.getByRole('button', { name: 'Công bố lịch', exact: true }).click();
  await expect(dialog.getByRole('alert')).toContainText('Người khác vừa sửa lịch tháng này');
  expect(state.requests.some(r => r.method === 'PUT' || r.path.endsWith('/publish'))).toBe(false);
});

for (const width of [1440, 390, 360]) test(`Bảng đủ ngày, công bố nằm dưới lịch và không tràn ngang ${width}px`, async ({ page }, info) => {
  await mockWorkSchedules(page, true); await page.setViewportSize({ width, height: 1000 });
  await openCalendar(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const grid = await page.getByLabel('Bảng lịch tháng', { exact: true }).boundingBox();
  const publish = await page.getByRole('region', { name: 'Công bố lịch', exact: true }).boundingBox();
  expect(publish!.y).toBeGreaterThan(grid!.y + grid!.height);
  await page.screenshot({ path: info.outputPath(`calendar-${width}.png`), fullPage: true });
  await page.getByRole('combobox', { name: 'Năm làm việc', exact: true }).selectOption('2028');
  await page.getByRole('combobox', { name: 'Tháng làm việc', exact: true }).selectOption('02');
  await expect(page.getByRole('button', { name: /^Ngày \d/ })).toHaveCount(29);
  await page.addStyleTag({ content: 'html { font-size: 200% !important; }' });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('Lấy lịch mới sử dụng response mới thay vì giữ bản cache cũ', async ({ page }) => {
  const state = await mockWorkSchedules(page, true); await openCalendar(page);
  state.slots[0].startsAt = '2026-11-07T03:00:00Z';
  state.fingerprint = 'B'.repeat(64);
  await page.getByRole('button', { name: 'Lấy lịch mới', exact: true }).click();
  await expect(page.getByRole('button', { name: /^Ngày 07\/11\/2026/ })).toContainText('10:00');
});

test('Lỗi đọc lại nền không làm mất giờ đang chỉnh hoặc trạng thái lỗi công bố', async ({ page }) => {
  const state = await mockWorkSchedules(page, true);
  let offline = false;
  await page.route('**/api/v1/staffing/schedules/2026-11-01', async route => offline ? route.abort() : route.fallback());
  await openCalendar(page); await setHours(page, '07/11/2026', '09:00', '12:00');
  offline = true;
  const dialog = await publishCalendar(page);
  await expect(dialog.getByRole('alert')).toBeVisible();
  await dialog.getByRole('button', { name: 'Quay lại lịch', exact: true }).click();
  await expect(page.getByRole('button', { name: /^Ngày 07\/11\/2026/ })).toContainText('09:00');
  await expect(page.getByRole('button', { name: 'Xác nhận công bố lịch', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Lấy lịch mới', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Bỏ thay đổi chưa lưu?', exact: true })).toBeVisible();
  expect(state.requests.some(r => r.method === 'PUT' || r.path.endsWith('/publish'))).toBe(false);
});

test('Ca từ tháng trước hiển thị và chặn trùng, không bị đưa vào payload tháng này', async ({ page }) => {
  const state = await mockWorkSchedules(page, true);
  const prior = { id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', officerId: ids.officer, wardCode: 'P01', startsAtUtc: '2026-11-30T15:00:00Z', endsAtUtc: '2026-12-01T02:00:00Z', version: 2 };
  await page.route('**/api/v1/staffing/shifts?*', route => authReply(route, { json: [prior] }));
  await page.route('**/api/v1/staffing/schedules/2026-12-01', route => authReply(route, { json: { month: '2026-12-01', slots: [], baseFingerprint: state.fingerprint, draft: null, leaves: [], closures: [], confirmations: [] } }));
  await openCalendar(page);
  await page.getByRole('combobox', { name: 'Tháng làm việc', exact: true }).selectOption('12');
  await page.getByRole('button', { name: /^Ngày 01\/12\/2026/ }).click();
  const dialog = page.getByRole('dialog', { name: 'Giờ làm ngày 01/12/2026', exact: true });
  await dialog.getByLabel('Từ giờ', { exact: true }).fill('08:00');
  await dialog.getByRole('button', { name: 'Áp dụng vào lịch', exact: true }).click();
  await expect(dialog.getByRole('alert')).toContainText('trùng giờ');
  await dialog.getByLabel('Từ giờ', { exact: true }).fill('10:00');
  await dialog.getByRole('button', { name: 'Áp dụng vào lịch', exact: true }).click();
  await page.getByRole('button', { name: 'Xác nhận công bố lịch', exact: true }).click();
  const confirm = page.getByRole('dialog', { name: 'Công bố lịch tháng?', exact: true });
  await expect(confirm).toContainText('01/12/2026');
  await expect(confirm).not.toContainText('30/11/2026');
  expect(state.requests.some(r => r.method === 'PUT')).toBe(false);
});

test('Frontdesk không xác nhận tháng chưa có ca', async ({ page }) => {
  const state = await mockWorkSchedules(page); state.slots = [];
  await page.goto('/officer?section=shifts');
  await expect(page.getByRole('button', { name: /^Ngày 07\/11\/2026/ })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Xác nhận đã xem lịch', exact: true })).toBeDisabled();
});

test('Công bố thành công nhưng tải lại lỗi vẫn cho phép lấy lịch mới', async ({ page }) => {
  const state = await mockWorkSchedules(page, true);
  let offline = false;
  await page.route('**/api/v1/staffing/schedules/2026-11-01', async route => offline ? route.abort() : route.fallback());
  await page.route('**/api/v1/staffing/schedules/2026-11-01/publish', route => {
    const revision = { ...state.draft!, version: Number(state.draft!.version) + 1, status: 'PUBLISHED', publishedAtUtc: '2026-11-06T02:00:00Z' };
    state.slots = state.draft!.slots as typeof state.slots; state.draft = null; offline = true;
    return authReply(route, { json: revision });
  });
  await openCalendar(page); await setHours(page, '07/11/2026', '09:00', '12:00');
  await expect(await publishCalendar(page)).not.toBeVisible();
  await expect(page.getByRole('button', { name: 'Lấy lịch mới', exact: true })).toBeEnabled();
  offline = false;
  await page.getByRole('button', { name: 'Lấy lịch mới', exact: true }).click();
  await expect(page.getByRole('button', { name: /^Ngày 07\/11\/2026/ })).toContainText('09:00');
});

test('Danh sách ca chọn cán bộ và tháng, không có lối tắt sửa/hủy ca chính thức', async ({ page }) => {
  const state = await mockWorkSchedules(page, true);
  state.slots.push({ ...state.slots[0], officerId: ids.officer2, shiftId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', startsAt: '2026-11-07T06:00:00Z', endsAt: '2026-11-07T09:00:00Z' });
  await page.goto('/manager?section=shifts&view=list');
  await expect(page.getByRole('combobox', { name: 'Tháng xem lịch', exact: true })).toBeDisabled();
  await page.getByRole('combobox', { name: 'Cán bộ xem lịch', exact: true }).selectOption(ids.officer);
  await expect(page.getByRole('table')).toContainText('08:00–12:00');
  await expect(page.getByRole('table')).not.toContainText('13:00–16:00');
  await page.getByRole('combobox', { name: 'Cán bộ xem lịch', exact: true }).selectOption(ids.officer2);
  await expect(page.getByRole('table')).toContainText('13:00–16:00');
  await expect(page.getByRole('table')).not.toContainText('08:00–12:00');
  await page.getByRole('combobox', { name: 'Tháng xem lịch', exact: true }).selectOption('12');
  await expect(page.getByRole('table')).toContainText('31/12/2026');
  await expect(page.getByRole('button', { name: 'Tạo ca làm', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Hủy ca', exact: true })).toHaveCount(0);
  expect(state.requests.some(r => r.path.endsWith('/schedules/2026-12-01'))).toBe(true);
});

for (const stage of ['draft', 'publish']) test(`Sửa và gửi lại được sau lỗi validation 400 ở bước ${stage}`, async ({ page }) => {
  const state = await mockWorkSchedules(page, true);
  let rejected = false;
  await page.route(`**/api/v1/staffing/schedules/2026-11-01/${stage}`, async route => {
    if (!rejected) {
      rejected = true;
      return authReply(route, { status: 400, json: { code: 'schedule.invalid_input', title: 'Kiểm tra ghi chú công bố.' } });
    }
    await route.fallback();
  });
  await openCalendar(page);
  await setHours(page, '07/11/2026', '09:00', '12:00');
  const dialog = await publishCalendar(page);
  await expect(dialog.getByRole('alert')).toBeVisible();
  await dialog.getByLabel('Ghi chú công bố').fill('Điều chỉnh ghi chú sau khi kiểm tra');
  await dialog.getByRole('button', { name: 'Công bố lịch', exact: true }).click();
  await expect(dialog).not.toBeVisible();
  expect(state.requests.findLast(r => r.path.endsWith('/publish'))?.body).toMatchObject({ reason: 'Điều chỉnh ghi chú sau khi kiểm tra' });
});

test('Ca đầu tháng sau chặn ca qua đêm cuối tháng trước', async ({ page }) => {
  await mockWorkSchedules(page, true);
  await page.route('**/api/v1/staffing/shifts?*', route => authReply(route, { json: [{ id: ids.shift, officerId: ids.officer, wardCode: 'P01', startsAtUtc: '2026-12-01T01:00:00Z', endsAtUtc: '2026-12-01T05:00:00Z', version: 1 }] }));
  await openCalendar(page);
  await page.getByRole('button', { name: /^Ngày 30\/11\/2026/ }).click();
  const dialog = page.getByRole('dialog', { name: 'Giờ làm ngày 30/11/2026', exact: true });
  await dialog.getByLabel('Từ giờ', { exact: true }).fill('22:00');
  await dialog.getByLabel('Đến giờ', { exact: true }).fill('09:00');
  await dialog.getByLabel('Kết thúc ngày hôm sau', { exact: true }).check();
  await dialog.getByRole('button', { name: 'Áp dụng vào lịch', exact: true }).click();
  await expect(dialog.getByRole('alert')).toContainText('trùng giờ');
});

test('Danh sách hiển thị ca qua đêm vào ngày hôm sau và ca từ tháng trước', async ({ page }) => {
  const state = await mockWorkSchedules(page, true);
  state.slots[0].startsAt = '2026-11-07T15:00:00Z';
  state.slots[0].endsAt = '2026-11-08T02:00:00Z';
  await page.route('**/api/v1/staffing/shifts?*', route => authReply(route, { json: [{ id: ids.monthly, officerId: ids.officer, wardCode: 'P01', startsAtUtc: '2026-10-31T15:00:00Z', endsAtUtc: '2026-11-01T02:00:00Z', version: 1 }] }));
  await page.goto('/manager?section=shifts&view=list');
  await page.getByRole('combobox', { name: 'Cán bộ xem lịch', exact: true }).selectOption(ids.officer);
  await expect(page.getByRole('row').filter({ has: page.getByRole('cell', { name: '01/11/2026', exact: true }) })).toContainText('22:00–09:00 (từ 31/10/2026)');
  await expect(page.getByRole('row').filter({ has: page.getByRole('cell', { name: '08/11/2026', exact: true }) })).toContainText('22:00–09:00 (từ 07/11/2026)');
});

