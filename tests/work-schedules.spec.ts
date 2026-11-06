import { test, expect, type Page } from '@playwright/test';
import JSZip from 'jszip';
import { mockWorkSchedules, scheduleIds as ids } from './fixtures/workSchedules';
import { authReply } from './fixtures/auth';

test.setTimeout(90000);
async function createDraft(page: Page, submit = true) {
  await page.goto('/officer?section=leaves');
  await page.getByRole('button', { name: 'Nháp của tôi / Xin nghỉ', exact: true }).click();
  await page.getByRole('button', { name: 'Xin nghỉ phép', exact: true }).click();
  const form = page.getByRole('dialog', { name: 'Tạo đơn xin nghỉ', exact: true });
  await form.getByLabel('Bắt đầu nghỉ (giờ Việt Nam)').fill('2026-11-07T08:00');
  await form.getByLabel('Kết thúc nghỉ (giờ Việt Nam)').fill('2026-11-07T12:00');
  await form.getByLabel('Lý do ngắn').fill('Nghỉ giải quyết việc gia đình');
  if (submit) await form.getByRole('button', { name: 'Tạo nháp Word', exact: true }).click();
}
async function openEditor(page: Page) {
  await page.getByRole('button', { name: 'Soạn / mở lại Word', exact: true }).click();
  const editor = page.getByRole('dialog', { name: 'Đơn xin nghỉ', exact: true });
  await expect(editor.getByRole('button', { name: 'Lưu nháp Word', exact: true })).toBeEnabled({ timeout: 45000 });
  return editor;
}

test('Word thật: tạo/sửa metadata, giữ nội dung khi upload lỗi, lưu và nộp đúng revision', async ({ page }) => {
  const state = await mockWorkSchedules(page);
  await createDraft(page);
  await expect(page.getByRole('dialog', { name: 'Nháp đơn xin nghỉ', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Nộp cho quản lý', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Sửa thông tin nghỉ', exact: true }).click();
  const edit = page.getByRole('dialog', { name: 'Sửa thông tin nghỉ', exact: true });
  await edit.getByLabel('Lý do ngắn').fill('Nghỉ ca sáng để giải quyết việc gia đình');
  await edit.getByRole('button', { name: 'Xác nhận', exact: true }).click();
  await expect(edit).not.toBeVisible();
  const editor = await openEditor(page);
  await editor.getByRole('textbox', { name: 'Nội dung tài liệu' }).click({ position: { x: 180, y: 150 } });
  await page.keyboard.press('Control+End'); await page.keyboard.type(' NOI DUNG DON NGHI RIENG');
  state.uploadFail = true;
  await editor.getByRole('button', { name: 'Lưu nháp Word', exact: true }).click();
  await expect(editor.getByRole('alert')).toContainText('Chưa đọc hoặc lưu được Word');
  await expect(editor.getByText('Có thay đổi chưa lưu')).toBeVisible();
  state.uploadFail = false;
  await editor.getByRole('button', { name: 'Lưu nháp Word', exact: true }).click();
  await expect(editor.getByText('Đã lưu nháp, chưa nộp')).toBeVisible();
  await editor.getByRole('button', { name: 'Đóng hộp thoại', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Nộp cho quản lý', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: 'Nộp cho quản lý', exact: true }).click();
  await page.getByRole('button', { name: 'Xác nhận nộp', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Chi tiết nghỉ phép', exact: true })).toBeVisible();
  await expect.poll(() => state.submitted).toBe(true);
  const uploaded = await JSZip.loadAsync(state.submittedBytes!);
  expect(await uploaded.file('word/document.xml')!.async('string')).toContain('NOI DUNG DON NGHI RIENG');
  const sent = state.requests.find(r => r.path.endsWith('/submit'))!;
  expect(sent.key).toMatch(/^[a-f\d-]{36}$/);
  expect(sent.body).toEqual({ expectedVersion: state.version, documentRevisionId: state.documentRevisionId, metadataVersion: state.metadataVersion });
  expect(state.requests.some(r => r.method === 'POST' && r.path === '/api/v1/staffing/leaves')).toBe(false);
  await page.getByRole('button', { name: 'Xem Word đã nộp', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Đơn nghỉ đã nộp — chỉ xem', exact: true }).getByRole('button', { name: 'Tải DOCX', exact: true })).toBeEnabled();
  await expect(page.getByRole('button', { name: 'Lưu nháp Word', exact: true })).toHaveCount(0);
});

test('Mất response tạo nháp: gửi lại cùng key và body, không tạo nháp thứ hai', async ({ page }) => {
  const state = await mockWorkSchedules(page); state.createTimeout = true;
  await createDraft(page);
  const form = page.getByRole('dialog', { name: 'Tạo đơn xin nghỉ', exact: true });
  await expect(form.getByLabel('Lý do ngắn')).toBeDisabled();
  await form.getByRole('button', { name: 'Gửi lại cùng yêu cầu', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Nháp đơn xin nghỉ', exact: true })).toBeVisible();
  const calls = state.requests.filter(r => r.method === 'POST' && r.path.endsWith('/leave-drafts'));
  expect(calls).toHaveLength(2); expect(calls[0].key).toBe(calls[1].key); expect(calls[0].body).toEqual(calls[1].body);
});

test('Word bắt buộc thiếu mẫu: chặn tạo và không chuyển sang nộp văn bản', async ({ page }) => {
  const state = await mockWorkSchedules(page); state.templateConfigured = false;
  await createDraft(page, false);
  await expect(page.getByText('Mẫu Word chưa được cấu hình. Vui lòng liên hệ quản trị viên.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Tạo nháp Word', exact: true })).toBeDisabled();
  expect(state.requests.filter(r => r.method === 'POST')).toHaveLength(0);
});

test('Nháp lưu trên server mở lại được, xem mẫu chung và xóa có xác nhận', async ({ page }) => {
  const state = await mockWorkSchedules(page); state.draftCreated = true;
  await page.goto('/officer?section=leaves');
  await page.getByRole('button', { name: 'Nháp của tôi / Xin nghỉ', exact: true }).click();
  await page.getByRole('button', { name: 'Xem mẫu Word chung', exact: true }).click();
  const template = page.getByRole('dialog', { name: 'Mẫu đơn nghỉ chung — chỉ xem', exact: true });
  await expect(template.getByRole('button', { name: 'Tải DOCX', exact: true })).toBeEnabled({ timeout: 45000 });
  await template.getByRole('button', { name: 'Đóng hộp thoại', exact: true }).click();
  await page.getByRole('button', { name: 'Mở nháp', exact: true }).click();
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

test('Manager đọc detail mới nhất, ca ảnh hưởng và quyết định nghỉ', async ({ page }) => {
  const state = await mockWorkSchedules(page, true); state.submitted = true;
  await page.goto('/manager?section=leaves');
  await page.getByRole('button', { name: 'Chi tiết / lịch sử / bàn giao', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Ca bị ảnh hưởng', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Hồ sơ cần xem xét bàn giao', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Duyệt', exact: true }).click();
  const decide = page.getByRole('dialog', { name: 'Đã duyệt đơn nghỉ phép', exact: true });
  await decide.getByLabel('Lý do quyết định').fill('Đồng ý theo kế hoạch nhân sự');
  await decide.getByRole('button', { name: 'Xác nhận', exact: true }).click();
  await expect.poll(() => state.status).toBe('APPROVED');
  expect(state.requests.filter(r => r.path === `/api/v1/staffing/leaves/${ids.leave}` && r.method === 'GET').length).toBeGreaterThanOrEqual(2);
  expect(state.requests.some(r => /assignments/.test(r.path) && r.method === 'POST')).toBe(false);
});

test('Thông báo staffing mở đúng danh sách; Frontdesk không có nút quản lý lịch', async ({ page }) => {
  await mockWorkSchedules(page);
  await page.goto('/officer?section=shifts&view=month');
  await expect(page.getByRole('button', { name: /^Ngày 07\/11\/2026/ })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Mẫu lịch tuần', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Công bố nháp', exact: true })).toHaveCount(0);
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
