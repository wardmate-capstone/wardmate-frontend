import { test, expect } from '@playwright/test';
import { authReply, mockWorkspaceAuth } from './fixtures/auth';
import { mockCatalog } from './fixtures/procedures';
import { mockAi, sessionId } from './fixtures/aiKnowledge';

test('avatar validates files, sends authenticated multipart and recovers from missing image', async ({ page }) => {
  let uploads = 0;
  await page.route('**/api/v1/users/**', async route => {
    const request = route.request();
    expect(request.headers().authorization).toBe('Bearer fixture-token');
    if (request.method() === 'PUT') {
      uploads++;
      expect(request.postDataBuffer()?.toString()).toContain('name="file"');
      if (uploads === 1) return route.fulfill({ status: 422, json: { code: 'iam.image_unreadable', title: 'Ảnh bị hỏng. Hãy chọn ảnh khác từ thư viện.' } });
      return route.fulfill({ json: { avatarUrl: '/api/v1/users/11111111-1111-1111-1111-111111111111/avatar?v=2', updatedAt: new Date().toISOString() } });
    }
    if (request.method() === 'DELETE') return route.fulfill({ status: 204 });
    return route.fulfill({ status: 404 });
  });
  await page.goto('/tests/fixtures/mobile-handoff.html');
  const picker = page.locator('input[type=file]');
  await picker.setInputFiles({ name: 'bad.txt', mimeType: 'text/plain', buffer: Buffer.from('bad') });
  await expect(page.getByText(/Định dạng ảnh chưa hỗ trợ/)).toBeVisible();
  expect(uploads).toBe(0);
  await picker.setInputFiles({ name: 'phone.heic', mimeType: 'image/heic', buffer: Buffer.from('fixture') });
  await expect(page.getByText('Ảnh bị hỏng. Hãy chọn ảnh khác từ thư viện.')).toBeVisible();
  await picker.setInputFiles({ name: 'phone.heic', mimeType: 'image/heic', buffer: Buffer.from('fixture') });
  await expect(page.getByText('Đã cập nhật ảnh đại diện.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Đổi ảnh đại diện', exact: true })).toBeVisible();
  expect(uploads).toBe(2);
  await page.getByRole('button', { name: 'Xóa ảnh', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Xóa ảnh', exact: true }).click();
  await expect(page.getByText('Đã xóa ảnh đại diện.')).toBeVisible();
});

test('avatar discards a response after account switch and validates before transport', async ({ page }) => {
  await page.goto('/tests/fixtures/mobile-handoff.html');
  const result = await page.evaluate(async () => {
    const avatarPath = '/src/lib/api/avatar.ts', clientPath = '/src/lib/api/index.ts', storePath = '/src/stores/authStore.ts';
    const avatar = await import(avatarPath), { api } = await import(clientPath), { useAuthStore } = await import(storePath);
    let requests = 0;
    api.defaults.adapter = async (config: unknown) => {
      requests++;
      useAuthStore.setState({ user: { ...useAuthStore.getState().user, id: '33333333-3333-3333-3333-333333333333', avatarUrl: null } });
      return { config, status: 200, headers: {}, data: { avatarUrl: '/api/v1/users/11111111-1111-1111-1111-111111111111/avatar?v=2' } };
    };
    let invalid = false, stale = false;
    try { await avatar.uploadMyAvatar(new File([], 'empty.png', { type: 'image/png' })); } catch { invalid = true; }
    try { await avatar.uploadMyAvatar(new File(['fixture'], 'photo.png', { type: 'image/png' })); } catch { stale = true; }
    return { invalid, stale, requests, avatarUrl: useAuthStore.getState().user.avatarUrl };
  });
  expect(result).toEqual({ invalid: true, stale: true, requests: 1, avatarUrl: null });
});

test('chat feedback preserves reason/comment, handles API failure and fits 360px', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  const bodies: unknown[] = [];
  await page.route('**/api/v1/ai/chat/messages/*/feedback', async route => {
    bodies.push(route.request().postDataJSON());
    if (bodies.length === 1) return route.fulfill({ status: 400, json: { code: 'chat.invalid_feedback', title: 'Đánh giá chưa hợp lệ.' } });
    return route.fulfill({ status: 204 });
  });
  await page.goto('/tests/fixtures/mobile-handoff.html');
  const up = page.getByRole('button', { name: 'Câu trả lời hữu ích', exact: true });
  expect((await up.boundingBox())?.height).toBeGreaterThanOrEqual(44);
  await page.getByRole('button', { name: 'Câu trả lời chưa đúng', exact: true }).click();
  await page.getByRole('radio', { name: 'Sai thông tin', exact: true }).click();
  await page.getByRole('textbox', { name: 'Góp ý thêm', exact: true }).fill('Lệ phí cần cập nhật');
  await page.getByRole('button', { name: 'Gửi góp ý', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Đánh giá chưa hợp lệ');
  await page.getByRole('button', { name: 'Gửi góp ý', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Cảm ơn');
  expect(bodies).toEqual(Array(2).fill({ helpful: false, reason: 'WRONG_INFO', comment: 'Lệ phí cần cập nhật' }));
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('feedback service rejects invalid ID/comment and requires HTTP 204', async ({ page }) => {
  await page.goto('/tests/fixtures/mobile-handoff.html');
  const result = await page.evaluate(async () => {
    const servicePath = '/src/lib/api/aiOcr.ts', clientPath = '/src/lib/api/index.ts';
    const { aiOcrApi } = await import(servicePath), { api } = await import(clientPath);
    let requests = 0;
    api.defaults.adapter = async (config: unknown) => { requests++; return { config, status: 200, headers: {}, data: {} }; };
    const id = '22222222-2222-2222-2222-222222222222';
    let invalidId = false, invalidComment = false, unconfirmed = false;
    try { await aiOcrApi.chatFeedback('bad', { helpful: true }); } catch { invalidId = true; }
    try { await aiOcrApi.chatFeedback(id, { helpful: false, comment: 'x'.repeat(1001) }); } catch { invalidComment = true; }
    try { await aiOcrApi.chatFeedback(id, { helpful: true }); } catch { unconfirmed = true; }
    return { requests, invalidId, invalidComment, unconfirmed };
  });
  expect(result).toEqual({ requests: 1, invalidId: true, invalidComment: true, unconfirmed: true });
});

test('guest widget sends exact clarification with conversation ID and restores feedback on reload', async ({ page }) => {
  await mockWorkspaceAuth(page, ['REGISTERED_CITIZEN']);
  await mockCatalog(page);
  const ai = await mockAi(page);
  ai.chatReply = { ...ai.chatReply, messageId: '22222222-2222-2222-2222-222222222222', needsClarification: true, suggestedQuestions: ['Đăng ký lần đầu'] };
  await page.route('**/auth/refresh-token', route => authReply(route, { status: 401, json: {} }));
  await page.route('**/ai/chat/messages/*/feedback', route => authReply(route, { status: 204 }));
  await page.goto('/');
  await page.getByRole('button', { name: 'Mở trợ lý hỗ trợ thủ tục', exact: true }).click();
  await page.getByLabel('Câu hỏi cho trợ lý', { exact: true }).fill('Làm giấy khai sinh');
  await page.getByRole('button', { name: 'Gửi tin nhắn', exact: true }).click();
  await expect(page.getByText('Chọn trường hợp của bạn:', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Đăng ký lần đầu', exact: true }).click();
  await expect.poll(() => ai.requests.filter(item => item.path.endsWith('/completions')).length).toBe(2);
  expect(ai.requests.filter(item => item.path.endsWith('/completions'))[1].body).toMatchObject({ message: 'Đăng ký lần đầu', conversationId: sessionId });
  await page.getByRole('button', { name: 'Câu trả lời hữu ích', exact: true }).last().click();
  await expect(page.getByRole('button', { name: 'Câu trả lời hữu ích', exact: true }).last()).toHaveAttribute('aria-pressed', 'true');
  await page.reload();
  await page.getByRole('button', { name: 'Mở trợ lý hỗ trợ thủ tục', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Câu trả lời hữu ích', exact: true }).last()).toHaveAttribute('aria-pressed', 'true');
});

test('procedure manager feedback tab filters negative feedback and wraps long comments at 360px', async ({ page }) => {
  await mockWorkspaceAuth(page, ['PROCEDURE_MANAGER']); await mockCatalog(page); await mockAi(page);
  let helpful: string | null = null;
  await page.route('**/ai/knowledge/chat-feedback?**', route => {
    helpful = new URL(route.request().url()).searchParams.get('helpful');
    return authReply(route, { json: { items: [{ messageId: '22222222-2222-2222-2222-222222222222', sessionId, question: 'Câu hỏi cần xem xét', answer: 'Câu trả lời kiểm thử', grounded: false, needsClarification: true, helpful: false, reason: 'WRONG_INFO', comment: 'NoSpace'.repeat(100), ratedAt: new Date().toISOString() }], pageNumber: 1, pageSize: 20, totalCount: 1 } });
  });
  await page.goto('/procedure-manager');
  await page.locator('aside').getByRole('button', { name: 'Dữ liệu kiến thức AI', exact: true }).click();
  await page.getByRole('tab', { name: 'Đánh giá chatbot', exact: true }).click();
  await expect(page.getByText('Câu hỏi cần xem xét', { exact: true })).toBeVisible(); expect(helpful).toBe('false');
  await page.getByLabel('Lọc đánh giá', { exact: true }).selectOption('all');
  await expect.poll(() => helpful).toBe(null);
  await page.setViewportSize({ width: 360, height: 740 });
  const comment = page.locator('blockquote').filter({ hasText: 'NoSpace' });
  await expect(comment).toBeVisible();
  expect(await comment.evaluate(node => node.scrollWidth <= node.clientWidth)).toBe(true);
});
