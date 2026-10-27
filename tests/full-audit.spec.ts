import { expect, test } from '@playwright/test';
import { authReply, mockWorkspaceAuth } from './fixtures/auth';
import { mockCatalog, procedureId } from './fixtures/procedures';
import { documentIds, mockDocumentWorkflow } from './fixtures/documentWorkflow';
import { normalizeProfileInput, validateProfile } from '../src/lib/profileSchema';
import { chatInputSchema } from '../src/lib/api/aiOcr';
import { mapSummaryDtoToCitizenDossier, mapSummaryDtoToOfficerApplication } from '../src/lib/api/workflowAdapters';

for (const signedIn of [false, true]) {
  test(`chat không bị header che, menu mobile nằm trên chat: ${signedIn ? 'đã đăng nhập' : 'khách'}`, async ({ page }) => {
    await mockCatalog(page);
    if (signedIn) await mockWorkspaceAuth(page, ['REGISTERED_CITIZEN']);
    else await page.route('**/api/v1/auth/refresh-token', route => authReply(route, { status: 401, json: { code: 'iam.invalid_token' } }));
    await page.goto('/');
    for (const viewport of [{ width: 1440, height: 600 }, { width: 1024, height: 500 }, { width: 320, height: 640 }]) {
      await page.setViewportSize(viewport);
      await page.evaluate(() => window.scrollTo(0, 100));
      await page.getByRole('button', { name: 'Mở trợ lý hỗ trợ thủ tục' }).click();
      const close = page.getByRole('button', { name: 'Đóng cửa sổ chat' });
      await expect(close).toBeVisible();
      await expect.poll(() => close.evaluate(button => {
        const rect = button.getBoundingClientRect();
        const hit = document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2);
        return button.contains(hit);
      })).toBe(true);
      if (viewport.width === 320) {
        const point = await close.evaluate(button => { const r = button.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
        await page.getByRole('button', { name: 'Mở menu', exact: true }).click();
        const menu = page.getByRole('dialog', { name: 'Danh mục', exact: true });
        await expect(menu).toBeVisible();
        await expect.poll(() => menu.evaluate((dialog, p) => dialog.contains(document.elementFromPoint(p.x, p.y)), point)).toBe(true);
        await page.keyboard.press('Escape');
        await expect(menu).toHaveCount(0);
      }
      await page.screenshot({ path: `test-results/chat-layer-${signedIn ? 'user' : 'guest'}-${viewport.width}.png` });
      await close.click();
      await expect(page.getByRole('region', { name: 'Cửa sổ hội thoại trợ lý ảo', exact: true })).toHaveCount(0);
    }
  });
}

test('khách chưa đăng nhập thấy và mở được chat, đăng nhập giữ trang quay lại', async ({ page }) => {
  await mockCatalog(page);
  await page.route('**/api/v1/auth/refresh-token', route => authReply(route, { status: 401, json: { code: 'iam.invalid_token' } }));
  const chatRequests: string[] = [];
  page.on('request', request => { if (request.url().includes('/ai/chat/')) chatRequests.push(request.url()); });
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto('/?source=guest#trang-chu');
  const trigger = page.getByRole('button', { name: 'Mở trợ lý hỗ trợ thủ tục' });
  await expect(trigger).toBeVisible();
  await trigger.click();
  const login = page.getByRole('link', { name: 'Đăng nhập để trò chuyện' });
  await expect(login).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Câu hỏi cho trợ lý' })).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/chat-guest-mobile.png' });
  await page.keyboard.press('Escape');
  await expect(trigger).toBeFocused();
  await trigger.click();
  await login.click();
  await expect(page).toHaveURL(/\/dang-nhap\?returnTo=/);
  expect(new URL(page.url()).searchParams.get('returnTo')).toBe('/?source=guest#trang-chu');
  expect(chatRequests).toHaveLength(0);
});

test('hồ sơ: tiếng Việt Unicode tổ hợp và số điện thoại có dấu phân cách', () => {
  const fullName = 'Nguyễn Văn An'.normalize('NFD');
  expect(validateProfile({ fullName, phoneNumber: '0912.345.678' }).isValid).toBe(true);
  expect(normalizeProfileInput({ fullName, phoneNumber: '0912.345.678' })).toMatchObject({ fullName: 'Nguyễn Văn An', phoneNumber: '0912345678' });
});

test('trạng thái lạ không trở thành bản nháp hoặc hồ sơ được phép nhận xử lý', () => {
  const summary = { id: documentIds.application, procedureId: documentIds.template, createdAt: '2026-10-27T00:00:00Z', status: 'FUTURE_STATE' };
  expect(mapSummaryDtoToCitizenDossier(summary).status).toBe('Chưa xác định trạng thái');
  expect(mapSummaryDtoToOfficerApplication(summary).status).toBe('UNKNOWN');
});

test('chat: bắt buộc phạm vi phường và chặn câu hỏi rỗng/quá dài, GUID rỗng', () => {
  for (const input of [
    { message: '   ', wardCode: 'WARD_A' },
    { message: 'a'.repeat(4001), wardCode: 'WARD_A' },
    { message: 'Câu hỏi', wardCode: '' },
    { message: 'Câu hỏi', wardCode: 'WARD_A', conversationId: '00000000-0000-0000-0000-000000000000' },
  ]) expect(chatInputSchema.safeParse(input).success).toBe(false);
});

test('chat mobile: chọn phường thật, giữ câu hỏi khi lỗi và xử lý clipboard bị từ chối', async ({ page }) => {
  await mockWorkspaceAuth(page, ['REGISTERED_CITIZEN']);
  await mockCatalog(page);
  await page.route('**/api/v1/wards', route => authReply(route, { json: [{ id: 'ward-b', code: 'WARD_B', name: 'Phường kiểm thử B' }] }));
  const bodies: Record<string, unknown>[] = [];
  await page.route('**/api/v1/ai/chat/completions', route => {
    if (route.request().method() === 'OPTIONS') return authReply(route, { status: 204 });
    bodies.push(route.request().postDataJSON());
    return bodies.length === 1
      ? authReply(route, { status: 503, json: { title: 'Tạm gián đoạn' } })
      : authReply(route, { json: { conversationId: '11111111-1111-4111-8111-111111111111', answer: 'Câu trả lời kiểm thử' } });
  });
  await page.addInitScript(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async () => { throw new Error('Denied'); } } }));
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto('/citizen');
  const trigger = page.getByRole('button', { name: 'Mở trợ lý hỗ trợ thủ tục' });
  await trigger.click();
  await page.getByRole('textbox', { name: 'Câu hỏi cho trợ lý' }).fill('Tôi cần chuẩn bị gì?');
  await expect(page.getByRole('button', { name: 'Gửi tin nhắn' })).toBeDisabled();
  await page.getByLabel('Phường/xã cần tư vấn').selectOption('WARD_B');
  await page.getByRole('button', { name: 'Gửi tin nhắn' }).click();
  await expect(page.getByRole('textbox', { name: 'Câu hỏi cho trợ lý' })).toHaveValue('Tôi cần chuẩn bị gì?');
  await page.getByRole('button', { name: 'Gửi tin nhắn' }).click();
  await expect(page.getByText('Câu trả lời kiểm thử', { exact: true })).toBeVisible();
  await expect(page.getByText('Tôi cần chuẩn bị gì?', { exact: true })).toHaveCount(1);
  expect(bodies).toHaveLength(2);
  expect(bodies.every(body => body.wardCode === 'WARD_B')).toBe(true);
  await page.getByTitle('Sao chép câu trả lời').last().click();
  await expect(page.getByText('Không thể sao chép. Vui lòng chọn văn bản và sao chép thủ công.')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/audit-chat-320.png' });
  await page.keyboard.press('Escape');
  await expect(trigger).toBeFocused();
});

test('thủ tục: danh sách khác rỗng không thay bằng dữ liệu cơ quan ghi cứng', async ({ page }) => {
  await mockWorkspaceAuth(page, ['REGISTERED_CITIZEN']);
  await mockCatalog(page);
  await page.route('**/api/v1/procedures?**', route => authReply(route, { json: { items: [], currentPage: 1, totalPages: 0, totalCount: 0, pageSize: 7, hasPrevious: false, hasNext: false } }));
  await page.goto(`/thu-tuc/${procedureId}`);
  await expect(page.getByText('Chưa có thủ tục khác trong danh mục.')).toBeVisible();
  await expect(page.getByText('UBND tỉnh Sơn La')).toHaveCount(0);
  await expect(page.getByText('Tìm kiếm nhiều nhất', { exact: true })).toHaveCount(0);
});

for (const withSubmission of [true, false]) {
  test(`xác nhận sẵn sàng 404 không gọi approve cũ: ${withSubmission ? 'DocumentForm' : 'Workflow'}`, async ({ page }) => {
    await mockWorkspaceAuth(page, ['FRONT_DESK_OFFICER']);
    const state = await mockDocumentWorkflow(page, 'officer', 'UNDER_REVIEW');
    if (!withSubmission) state.submissionStatus = '';
    await page.route('**/confirm-readiness', route => authReply(route, { status: 404, json: { code: 'application.not_found', title: 'Không tìm thấy hồ sơ.' } }));
    await page.goto('/officer');
    await expect(page.getByRole('heading', { name: /^Chào buổi/ })).toBeVisible();
    const paths: string[] = [];
    page.on('request', request => { if (request.method() === 'POST') paths.push(new URL(request.url()).pathname); });
    await page.evaluate(async ({ withSubmission, application, submission }) => {
      const modulePath = withSubmission ? '/src/lib/api/documentForms.ts' : '/src/lib/api/workflow.ts';
      const module = await import(modulePath);
      try {
        if (withSubmission) await module.documentFormApi.officerConfirmReadiness(submission);
        else await module.workflowApi.confirmReadiness(application);
      } catch { /* expected 404 */ }
    }, { withSubmission, application: documentIds.application, submission: documentIds.submission });
    expect(paths.filter(path => path.endsWith('/confirm-readiness'))).toHaveLength(1);
    expect(paths.some(path => path.endsWith('/approve'))).toBe(false);
  });
}

test('Admin: form hồ sơ chặn dữ liệu sai và không tự gán giới tính hoặc xác thực', async ({ page }) => {
  const state = await mockWorkspaceAuth(page, ['IT_ADMIN']);
  await page.route('**/api/v1/users/11111111-1111-1111-1111-111111111111/profile', route => authReply(route, { json: { fullName: 'Nguyễn Văn An' } }));
  await page.goto('/admin');
  await page.locator('aside').getByRole('button', { name: 'Người dùng hệ thống' }).click();
  await page.getByRole('button', { name: 'Xem chi tiết' }).click();
  await expect(page.getByText('Đã xác thực', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Chỉnh sửa hồ sơ' }).click();
  await expect(page.getByLabel('Giới tính', { exact: true })).toHaveValue('');
  await page.getByLabel('Họ và tên khai sinh').fill('   ');
  await page.getByRole('button', { name: 'Lưu thay đổi' }).click();
  await expect(page.getByRole('alert').getByText('Vui lòng nhập họ và tên.')).toBeVisible();
  await expect(page.getByLabel('Họ và tên khai sinh')).toBeFocused();
  expect(state.requests.filter(request => request.method === 'PUT' && request.path.endsWith('/profile'))).toHaveLength(0);
});

test('OCR: ảnh rỗng/sai định dạng xóa lựa chọn cũ; đóng lúc quét không nhận kết quả cũ', async ({ page }) => {
  await mockWorkspaceAuth(page, ['REGISTERED_CITIZEN']);
  let release!: () => void;
  const pending = new Promise<void>(resolve => { release = resolve; });
  let requested = false;
  let completed = false;
  await page.route('**/api/v1/ai-ocr/cccd/extract', async route => {
    if (route.request().method() === 'OPTIONS') return authReply(route, { status: 204 });
    requested = true;
    await pending;
    try { await authReply(route, { json: { fullName: 'Kết quả cũ không áp dụng' } }); } catch { /* request aborted */ }
    completed = true;
  });
  await page.goto('/citizen?section=profile');
  await page.getByRole('button', { name: 'Quét CCCD (AI OCR)' }).click();
  const dialog = page.getByRole('dialog', { name: 'Quét thông tin Căn cước công dân (AI OCR)' });
  const file = dialog.getByLabel('Ảnh CCCD mặt trước');
  const scan = dialog.getByRole('button', { name: 'Bắt đầu quét AI' });
  const image = { name: 'front.png', mimeType: 'image/png', buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6TqMAAAAASUVORK5CYII=', 'base64') };
  await file.setInputFiles({ ...image, buffer: Buffer.alloc(0) });
  await expect(dialog.getByRole('alert')).toContainText('không có nội dung');
  await expect(scan).toBeDisabled();
  await file.setInputFiles(image);
  await expect(scan).toBeEnabled();
  await file.setInputFiles({ name: 'wrong.pdf', mimeType: 'application/pdf', buffer: Buffer.from('PDF') });
  await expect(scan).toBeDisabled();
  await file.setInputFiles(image);
  await scan.click();
  await expect.poll(() => requested).toBe(true);
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await page.getByRole('button', { name: 'Quét CCCD (AI OCR)' }).click();
  release();
  await expect.poll(() => completed).toBe(true);
  await expect(scan).toBeDisabled();
  await expect(page.getByText('Kết quả cũ không áp dụng', { exact: true })).toHaveCount(0);
});
