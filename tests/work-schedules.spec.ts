import { test, expect, type Page } from '@playwright/test';
import JSZip from 'jszip';
import { mockWorkSchedules, scheduleIds as ids } from './fixtures/workSchedules';
import { authReply } from './fixtures/auth';

test.setTimeout(90000);
test('Nghỉ phép có nút tạo đơn rõ ràng từ cả hai danh sách và hướng dẫn khi trống', async ({ page }) => {
  const state = await mockWorkSchedules(page);
  await page.goto('/officer?section=leaves');
  await expect(page.getByRole('button', { name: 'Đơn đang soạn', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByText('Bạn chưa có đơn đang soạn', { exact: true })).toBeVisible();
  const create = page.getByRole('button', { name: 'Tạo đơn nghỉ phép', exact: true });
  await expect(create).toBeEnabled();
  await page.screenshot({ path: 'test-results/officer-leaves-desktop.png', fullPage: true });
  await page.getByRole('button', { name: 'Đơn đã gửi', exact: true }).click();
  await expect(page.getByText('Bạn chưa có đơn đã gửi trong khoảng ngày này', { exact: true })).toBeVisible();
  await create.click();
  await expect(page.getByRole('dialog', { name: 'Tạo đơn xin nghỉ', exact: true })).toBeVisible();
  expect(state.requests.some(r => r.method === 'POST')).toBe(false);
  await page.getByRole('dialog', { name: 'Tạo đơn xin nghỉ', exact: true }).getByRole('button', { name: 'Đóng hộp thoại', exact: true }).click();
  await page.setViewportSize({ width: 390, height: 1000 });
  await expect.poll(async () => (await page.getByRole('main').boundingBox())!.x).toBeLessThanOrEqual(1);
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expect(create).toBeVisible();
  await page.screenshot({ path: 'test-results/officer-leaves-mobile.png', fullPage: true });
});

async function createDraft(page: Page, submit = true) {
  await page.goto('/officer?section=leaves');
  await page.getByRole('button', { name: 'Tạo đơn nghỉ phép', exact: true }).click();
  const form = page.getByRole('dialog', { name: 'Tạo đơn xin nghỉ', exact: true });
  await form.getByLabel('Ngày nghỉ', { exact: true }).fill('2026-11-07');
  await form.getByLabel('Lý do nghỉ').fill('Nghỉ giải quyết việc gia đình');
  if (submit) await form.getByRole('button', { name: 'Tạo nháp Word', exact: true }).click();
}
async function openEditor(page: Page) {
  await page.getByRole('button', { name: 'Soạn / mở lại Word', exact: true }).click();
  const editor = page.getByRole('dialog', { name: 'Đơn xin nghỉ', exact: true });
  await expect(editor.getByRole('button', { name: 'Lưu nháp Word', exact: true })).toBeEnabled({ timeout: 45000 });
  return editor;
}

test('Tạo đơn theo ngày: đổi chế độ, đếm ngày lịch, đặt lại và gửi đúng giờ Việt Nam', async ({ page }) => {
  const state = await mockWorkSchedules(page);
  await createDraft(page, false);
  const form = page.getByRole('dialog', { name: 'Tạo đơn xin nghỉ', exact: true });
  await expect(form.getByRole('status')).toContainText('Tổng thời gian: 1 ngày lịch');
  await expect(form.locator('input[type="time"]')).toHaveCount(0);
  await form.getByRole('radio', { name: 'Nghỉ nhiều ngày', exact: true }).check();
  await form.getByLabel('Đến ngày', { exact: true }).fill('2026-11-06');
  await form.getByRole('button', { name: 'Tạo nháp Word', exact: true }).click();
  await expect(form.getByRole('alert')).toContainText('Thời gian kết thúc phải sau');
  expect(state.requests.some(r => r.method === 'POST')).toBe(false);
  await form.getByRole('button', { name: 'Đặt lại', exact: true }).click();
  await expect(form.getByRole('radio', { name: 'Nghỉ 1 ngày', exact: true })).toBeChecked();
  await expect(form.getByLabel('Ngày nghỉ', { exact: true })).toHaveValue('');
  await expect(form.getByLabel('Lý do nghỉ', { exact: true })).toHaveValue('');
  await form.getByRole('radio', { name: 'Nghỉ nhiều ngày', exact: true }).check();
  await form.getByLabel('Từ ngày', { exact: true }).fill('2026-11-07');
  await form.getByLabel('Đến ngày', { exact: true }).fill('2026-11-08');
  await form.getByLabel('Lý do nghỉ', { exact: true }).fill('Nghỉ giải quyết công việc cá nhân');
  await expect(form.getByRole('status')).toContainText('Tổng thời gian: 2 ngày lịch');
  await form.locator('form').evaluate(element => { element.parentElement!.scrollTop = 0; });
  await form.screenshot({ path: 'test-results/create-leave-dates-desktop.png' });
  await page.setViewportSize({ width: 390, height: 1000 });
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await form.screenshot({ path: 'test-results/create-leave-dates-mobile.png' });
  await form.getByRole('button', { name: 'Tạo nháp Word', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Nháp đơn xin nghỉ', exact: true })).toBeVisible();
  expect(state.requests.find(r => r.method === 'POST' && r.path.endsWith('/leave-drafts'))?.body).toMatchObject({ startsAt: '2026-11-06T17:00:00.000Z', endsAt: '2026-11-08T17:00:00.000Z' });
});

test('Word thật: tạo/sửa metadata, giữ nội dung khi upload lỗi, lưu và nộp đúng revision', async ({ page }) => {
  const state = await mockWorkSchedules(page);
  await createDraft(page);
  await expect(page.getByRole('dialog', { name: 'Nháp đơn xin nghỉ', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Nộp cho quản lý', exact: true })).toBeDisabled();
  const edit = page.getByRole('region', { name: 'Bước 1: Thông tin nghỉ', exact: true });
  await edit.getByLabel('Bắt đầu nghỉ (giờ Việt Nam)').fill('2026-11-08T08:00');
  await edit.getByLabel('Kết thúc nghỉ (giờ Việt Nam)').fill('2026-11-08T12:00');
  await edit.getByLabel('Lý do ngắn').fill('Nghỉ ca sáng để giải quyết việc gia đình');
  await expect(page.getByRole('button', { name: 'Soạn / mở lại Word', exact: true })).toBeDisabled();
  await edit.getByRole('button', { name: 'Lưu thông tin nghỉ', exact: true }).click();
  await expect(edit.getByRole('button', { name: 'Lưu thông tin nghỉ', exact: true })).toBeDisabled();
  expect(state.startsAtUtc).toBe('2026-11-08T01:00:00.000Z');
  expect(state.endsAtUtc).toBe('2026-11-08T05:00:00.000Z');
  const editor = await openEditor(page);
  await editor.getByRole('textbox', { name: 'Nội dung tài liệu' }).click({ position: { x: 180, y: 150 } });
  await page.keyboard.press('Control+End'); await page.keyboard.type(' NOI DUNG DON NGHI RIENG');
  state.uploadFail = true;
  await editor.getByRole('button', { name: 'Lưu và đóng', exact: true }).click();
  await expect(editor.getByRole('alert')).toContainText('Chưa đọc hoặc lưu được Word');
  await expect(editor).toBeVisible();
  expect(state.submitted).toBe(false);
  await expect(editor.getByText('Có thay đổi chưa lưu')).toBeVisible();
  state.uploadFail = false;
  await editor.getByRole('button', { name: 'Lưu nháp Word', exact: true }).click();
  await expect(editor.getByText('Đã lưu nháp, chưa nộp')).toBeVisible();
  await editor.getByRole('textbox', { name: 'Nội dung tài liệu' }).click({ position: { x: 180, y: 150 } });
  await page.keyboard.press('Control+End');
  await page.keyboard.type(' BAN CUOI');
  await editor.getByRole('button', { name: 'Lưu và đóng', exact: true }).click();
  await expect(editor).not.toBeVisible();
  expect(state.submitted).toBe(false);
  await expect(page.getByRole('button', { name: 'Nộp cho quản lý', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: 'Nộp cho quản lý', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Chi tiết nghỉ phép', exact: true })).toBeVisible();
  await expect.poll(() => state.submitted).toBe(true);
  const uploaded = await JSZip.loadAsync(state.submittedBytes!);
  expect(await uploaded.file('word/document.xml')!.async('string')).toContain('NOI DUNG DON NGHI RIENG');
  expect(await uploaded.file('word/document.xml')!.async('string')).toContain('BAN CUOI');
  const sent = state.requests.find(r => r.path.endsWith('/submit'))!;
  expect(sent.key).toMatch(/^[a-f\d-]{36}$/);
  expect(sent.body).toEqual({ expectedVersion: state.version, documentRevisionId: state.documentRevisionId, metadataVersion: state.metadataVersion });
  expect(state.requests.some(r => r.method === 'POST' && r.path === '/api/v1/staffing/leaves')).toBe(false);
  await page.getByRole('button', { name: 'Xem Word đã nộp', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Đơn nghỉ đã nộp — chỉ xem', exact: true }).getByRole('button', { name: 'Tải về (Word)', exact: true })).toBeEnabled();
  await expect(page.getByRole('button', { name: 'Lưu nháp Word', exact: true })).toHaveCount(0);
});

test('Mất response tạo nháp: gửi lại cùng key và body, không tạo nháp thứ hai', async ({ page }) => {
  const state = await mockWorkSchedules(page); state.createTimeout = true;
  await createDraft(page);
  const form = page.getByRole('dialog', { name: 'Tạo đơn xin nghỉ', exact: true });
  await expect(form.getByLabel('Lý do nghỉ')).toBeDisabled();
  await form.getByRole('button', { name: 'Gửi lại cùng yêu cầu', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Nháp đơn xin nghỉ', exact: true })).toBeVisible();
  const calls = state.requests.filter(r => r.method === 'POST' && r.path.endsWith('/leave-drafts'));
  expect(calls).toHaveLength(2); expect(calls[0].key).toBe(calls[1].key); expect(calls[0].body).toEqual(calls[1].body);
  expect(calls[0].body).toMatchObject({ startsAt: '2026-11-06T17:00:00.000Z', endsAt: '2026-11-07T17:00:00.000Z' });
});

test('Nháp sửa ngày trực tiếp: hướng dẫn theo bước, chặn bỏ thay đổi và không tràn mobile', async ({ page }) => {
  await mockWorkSchedules(page);
  await createDraft(page);
  const draft = page.getByRole('dialog', { name: 'Nháp đơn xin nghỉ', exact: true });
  await expect(draft.getByRole('region', { name: 'Bước 1: Thông tin nghỉ' })).toBeVisible();
  await draft.getByLabel('Kết thúc nghỉ (giờ Việt Nam)').fill('2026-11-08T12:00');
  await expect(draft.getByRole('button', { name: 'Soạn / mở lại Word' })).toBeDisabled();
  await expect(draft.getByRole('button', { name: 'Nộp cho quản lý' })).toBeDisabled();
  await draft.getByRole('button', { name: 'Đóng hộp thoại', exact: true }).click();
  const warning = page.getByRole('dialog', { name: 'Bỏ thay đổi chưa lưu?', exact: true });
  await expect(warning).toBeVisible();
  await warning.getByRole('button', { name: 'Tiếp tục chỉnh sửa' }).click();
  await expect(draft.getByLabel('Kết thúc nghỉ (giờ Việt Nam)')).toHaveValue('2026-11-08T12:00');
  await page.screenshot({ path: 'test-results/leave-draft-steps-desktop.png' });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(draft.getByLabel('Bắt đầu nghỉ (giờ Việt Nam)')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/leave-draft-steps-mobile.png' });
});

test('Word bắt buộc thiếu mẫu: chặn tạo và không chuyển sang nộp văn bản', async ({ page }) => {
  const state = await mockWorkSchedules(page); state.templateConfigured = false;
  await createDraft(page, false);
  await expect(page.getByText('Chưa có mẫu đơn Word. Vui lòng liên hệ quản trị viên.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Tạo nháp Word', exact: true })).toBeDisabled();
  expect(state.requests.filter(r => r.method === 'POST')).toHaveLength(0);
});

test('Nháp lưu trên server mở lại được, xem mẫu chung và xóa có xác nhận', async ({ page }) => {
  const state = await mockWorkSchedules(page); state.draftCreated = true;
  await page.goto('/officer?section=leaves');
  await page.getByRole('button', { name: 'Xem mẫu đơn nghỉ phép', exact: true }).click();
  const template = page.getByRole('dialog', { name: 'Mẫu đơn nghỉ chung — chỉ xem', exact: true });
  await expect(template.getByRole('button', { name: 'Tải về (Word)', exact: true })).toBeEnabled({ timeout: 45000 });
  await template.getByRole('button', { name: 'Đóng hộp thoại', exact: true }).click();
  await page.getByRole('button', { name: 'Tiếp tục soạn đơn', exact: true }).click();
  await page.getByRole('button', { name: 'Xóa nháp', exact: true }).click();
  await page.getByRole('dialog', { name: 'Xóa nháp đơn nghỉ?', exact: true }).getByRole('button', { name: 'Xóa nháp', exact: true }).click();
  await expect.poll(() => state.deleted).toBe(true);
  expect(state.requests.find(r => r.method === 'DELETE')?.path).toContain(ids.draft);
});

test('Chính sách cho phép đơn không Word: chỉ gửi sau khi đọc lại capability', async ({ page }) => {
  const state = await mockWorkSchedules(page); state.wordRequired = false;
  await createDraft(page, false);
  const form = page.getByRole('dialog', { name: 'Tạo đơn xin nghỉ', exact: true });
  await form.getByRole('checkbox', { name: 'Soạn đơn Word trực tiếp' }).uncheck();
  await form.getByRole('button', { name: 'Gửi đơn không kèm Word', exact: true }).click();
  await expect.poll(() => state.submitted).toBe(true);
  expect(state.requests.filter(r => r.method === 'GET' && r.path.endsWith('/capabilities')).length).toBeGreaterThanOrEqual(2);
  expect(state.requests.filter(r => r.method === 'POST' && r.path.endsWith('/leaves'))).toHaveLength(1);
});

test('Manager duyệt đề nghị đổi ca qua đúng ID yêu cầu, không gửi version giả', async ({ page }) => {
  const state = await mockWorkSchedules(page, true);
  state.changes.push({ id: ids.change, shiftId: ids.shift, officerId: ids.officer, wardCode: 'P01', originalStart: state.slots[0].startsAt, originalEnd: state.slots[0].endsAt, originalVersion: 3, proposedStart: '2026-11-07T02:00:00Z', proposedEnd: '2026-11-07T06:00:00Z', reason: 'Cần đổi giờ ca', status: 'PENDING', decidedBy: null, decidedAtUtc: null, decisionReason: null });
  await page.goto('/manager?section=shifts&view=changes');
  await page.getByRole('button', { name: 'Duyệt đổi ca', exact: true }).click();
  const form = page.getByRole('dialog', { name: 'Duyệt đổi giờ ca', exact: true });
  await form.getByLabel('Lý do quyết định').fill('Đồng ý đổi giờ theo đề nghị');
  await form.getByRole('button', { name: 'Xác nhận', exact: true }).click();
  await expect(form).not.toBeVisible();
  const request = state.requests.find(r => r.method === 'POST' && r.path.endsWith(`/shift-change-requests/${ids.change}/decision`));
  expect(request?.body).toEqual({ decision: 'APPROVED', reason: 'Đồng ý đổi giờ theo đề nghị' });
});

test('Detail trả sai ID không được mở thao tác quyết định', async ({ page }) => {
  const state = await mockWorkSchedules(page, true); state.submitted = true;
  await page.route(`**/api/v1/staffing/leaves/${ids.leave}`, route => authReply(route, { json: { leave: { id: ids.draft, officerId: ids.officer, wardCode: 'P01', startsAtUtc: state.startsAtUtc, endsAtUtc: state.endsAtUtc, reason: state.reason, status: 'PENDING', version: 0 }, hasSubmittedDocx: false, submittedRevisionId: null, sha256: null } }));
  await page.goto('/manager?section=leaves');
  await page.getByRole('button', { name: 'Chi tiết / lịch sử / bàn giao', exact: true }).click();
  await expect(page.getByRole('dialog').getByRole('alert')).toContainText('Phản hồi không khớp');
  await expect(page.getByRole('button', { name: 'Duyệt', exact: true })).toHaveCount(0);
});

test('Frontdesk xác nhận fingerprint cá nhân và gửi đổi giờ với version ca thật', async ({ page }) => {
  const state = await mockWorkSchedules(page);
  await page.goto('/officer?section=shifts&view=month');
  await page.getByRole('button', { name: 'Xác nhận đã xem lịch', exact: true }).click();
  await expect.poll(() => state.requests.some(r => r.path.endsWith('/confirm'))).toBe(true);
  expect(state.requests.find(r => r.path.endsWith('/confirm'))?.body).toEqual({ fingerprint: state.fingerprint });
  await expect(page.getByRole('button', { name: 'Xác nhận đã xem lịch', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: /^Ngày 07\/11\/2026/ }).click();
  await page.getByRole('button', { name: 'Đề nghị đổi giờ ca', exact: true }).click();
  const change = page.getByRole('dialog', { name: 'Đề nghị đổi giờ ca', exact: true });
  await change.getByLabel('Giờ bắt đầu đề xuất (Việt Nam)').fill('2026-11-07T09:00');
  await change.getByLabel('Giờ kết thúc đề xuất (Việt Nam)').fill('2026-11-07T13:00');
  await change.getByLabel('Lý do đổi ca').fill('Đổi giờ để giải quyết công việc');
  await change.getByRole('button', { name: 'Xác nhận', exact: true }).click();
  await expect(change).not.toBeVisible();
  expect(state.requests.find(r => r.method === 'POST' && r.path.endsWith('/shift-change-requests'))?.body).toMatchObject({ expectedVersion: 3, shiftId: ids.shift });
  expect(state.slots[0].startsAt).toBe('2026-11-07T01:00:00+00:00');
  await page.getByRole('button', { name: 'Yêu cầu đổi ca', exact: true }).click();
  await expect(page.getByText('Đổi giờ để giải quyết công việc', { exact: true })).toBeVisible();
});

test('Xác nhận đã xem ẩn sau tải lại, hiện lại khi lịch cá nhân thay đổi', async ({ page }) => {
  const state = await mockWorkSchedules(page);
  await page.goto('/officer?section=shifts&view=month');
  const confirm = page.getByRole('button', { name: 'Xác nhận đã xem lịch', exact: true });
  await confirm.click();
  await expect(confirm).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole('button', { name: /^Ngày 07\/11\/2026/ })).toBeVisible();
  await expect(confirm).toHaveCount(0);
  state.fingerprint = 'B'.repeat(64);
  state.slots[0].startsAt = '2026-11-07T02:00:00Z';
  await page.evaluate(async () => {
    const { queryClient } = await import('/src/lib/queryClient.ts');
    await queryClient.invalidateQueries({ queryKey: ['staffing'] });
  });
  await expect(page.getByRole('button', { name: /^Ngày 07\/11\/2026/ })).toContainText('09:00');
  await expect(confirm).toBeVisible();
  await confirm.click();
  await expect(confirm).toHaveCount(0);
  expect(state.requests.filter(r => r.path.endsWith('/confirm')).map(r => r.body)).toEqual([
    { fingerprint: 'A'.repeat(64) }, { fingerprint: 'B'.repeat(64) },
  ]);
});

test('Xác nhận đã xem thất bại vẫn giữ nút để kiểm tra lại lịch', async ({ page }) => {
  const state = await mockWorkSchedules(page); state.conflict = true;
  await page.goto('/officer?section=shifts&view=month');
  const confirm = page.getByRole('button', { name: 'Xác nhận đã xem lịch', exact: true });
  await confirm.click();
  await expect(page.getByRole('alert')).toBeVisible();
  await expect(confirm).toBeVisible();
  expect(Object.keys(state.receipts)).toHaveLength(0);
  expect(state.requests.filter(r => r.path.endsWith('/confirm'))).toHaveLength(1);
});

test('Manager đọc detail mới nhất, ca ảnh hưởng và quyết định nghỉ', async ({ page }) => {
  const state = await mockWorkSchedules(page, true); state.submitted = true;
  await page.goto('/manager?section=leaves');
  await expect(page.getByRole('heading', { name: 'Cán bộ kiểm thử', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: ids.officer, exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Chi tiết / lịch sử / bàn giao', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Ca bị ảnh hưởng', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Hồ sơ cần xem xét bàn giao', exact: true })).toBeVisible();
  await expect(page.getByRole('dialog', { name: 'Chi tiết nghỉ phép', exact: true })).toContainText('Cán bộ kiểm thử');
  await page.getByRole('button', { name: 'Duyệt', exact: true }).click();
  const decide = page.getByRole('dialog', { name: 'Đã duyệt đơn nghỉ phép', exact: true });
  await decide.getByLabel('Lý do quyết định').fill('Đồng ý theo kế hoạch nhân sự');
  await decide.getByRole('button', { name: 'Xác nhận', exact: true }).click();
  await expect.poll(() => state.status).toBe('APPROVED');
  expect(state.requests.filter(r => r.path === `/api/v1/staffing/leaves/${ids.leave}` && r.method === 'GET').length).toBeGreaterThanOrEqual(2);
  expect(state.requests.some(r => /assignments/.test(r.path) && r.method === 'POST')).toBe(false);
});

test('Tên cán bộ tải lỗi có thể thử lại, không hiển thị GUID thay tên', async ({ page }) => {
  const state = await mockWorkSchedules(page, true); state.submitted = true;
  let fail = true;
  await page.route('**/api/v1/manager/officers?*', async route => {
    if (fail) return authReply(route, { status: 503, json: { title: 'Danh sách nhân sự chưa sẵn sàng.' } });
    return route.fallback();
  });
  await page.goto('/manager?section=leaves');
  await expect(page.getByText('Chưa tải được tên cán bộ từ danh sách nhân sự.', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Chưa tìm thấy tên cán bộ', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: ids.officer, exact: true })).toHaveCount(0);
  fail = false;
  await page.getByRole('button', { name: 'Thử lại', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Cán bộ kiểm thử', exact: true })).toBeVisible();
});

test('Thông báo staffing mở đúng danh sách; Frontdesk không có nút quản lý lịch', async ({ page }) => {
  await mockWorkSchedules(page);
  await page.goto('/officer?section=shifts&view=month');
  await expect(page.getByRole('button', { name: /^Ngày 07\/11\/2026/ })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Mẫu lịch tuần', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Công bố nháp', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Danh sách ca', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Lịch tháng', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.goto('/officer?section=shifts&view=list');
  await expect(page.getByRole('button', { name: /^Ngày 07\/11\/2026/ })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Danh sách ca', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Yêu cầu đổi ca', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Yêu cầu đổi ca', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Lịch tháng', exact: true }).click();
  await expect(page.getByRole('button', { name: /^Ngày 07\/11\/2026/ })).toBeVisible();
  const urls = await page.evaluate(async () => {
    // Exercise the same resolver used by the bell and toast, with the actual v3 payload shape.
    const { resolveNotificationUrl } = await import('/src/lib/api/notifications.ts');
    const common = { type: 'SYSTEM_ALERT', title: 'Cập nhật lịch và nghỉ phép', actionUrl: null, applicationId: null };
    return [resolveNotificationUrl({ ...common, content: 'Có đơn nghỉ mới cần xem xét.' }, ['MANAGER']), resolveNotificationUrl({ ...common, content: 'Đề nghị đổi giờ ca đã có kết quả.' }, ['FRONT_DESK_OFFICER']), resolveNotificationUrl({ ...common, content: 'Lịch trực của bạn đã thay đổi.' }, ['FRONT_DESK_OFFICER'])];
  });
  expect(urls).toEqual(['/manager?section=leaves', '/officer?section=shifts&view=changes', '/officer?section=shifts&view=month']);
});

test('Đơn ngoài phạm vi: lỗi 403 không mở Word, tác động hoặc quyết định', async ({ page }) => {
  const state = await mockWorkSchedules(page, true); state.submitted = true;
  await page.route(`**/api/v1/staffing/leaves/${ids.leave}`, route => authReply(route, { status: 403, json: { code: 'staffing.forbidden' } }));
  await page.goto('/manager?section=leaves');
  await page.getByRole('button', { name: 'Chi tiết / lịch sử / bàn giao', exact: true }).click();
  await expect(page.getByRole('dialog').getByRole('alert')).toContainText('Bạn không có quyền');
  await expect(page.getByRole('button', { name: 'Duyệt', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Xem Word đã nộp', exact: true })).toHaveCount(0);
  expect(state.requests.some(r => r.path.endsWith('/shift-impact'))).toBe(false);
});
