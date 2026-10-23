import { test, expect, type Page } from '@playwright/test';
import { mockDocumentWorkflow } from './fixtures/documentWorkflow';
import { mockAnalytics } from './fixtures/analytics';
async function setup(page: Page) {
  await mockDocumentWorkflow(page, 'citizen', 'DOCUMENTS_READY');
  const state = await mockAnalytics(page);
  await page.goto('/citizen?section=feedback');
  return state;
}
async function open(page: Page) {
  await page.getByRole('button', { name: 'Xem / gửi đánh giá' }).click();
  await expect(page.getByRole('button', { name: 'Gửi đánh giá', exact: true })).toBeVisible();
}

test('Công dân: GET trước POST, lưu 2.000 ký tự và chỉ payload được BE hỗ trợ', async ({ page }) => {
  const state = await setup(page); await open(page);
  await expect(page.getByRole('button', { name: 'Gửi đánh giá', exact: true })).toBeDisabled();
  await page.getByRole('radio', { name: '5 sao', exact: true }).check();
  await page.getByRole('textbox', { name: 'Góp ý bổ sung' }).fill('a'.repeat(2000));
  await expect(page.getByText('2000/2000 ký tự')).toBeVisible();
  await page.getByRole('button', { name: 'Gửi đánh giá', exact: true }).click();
  await expect(page.getByText('Đánh giá đã được ghi nhận: 5/5 sao')).toBeVisible();
  expect(state.postCount).toBe(1);
  const write = state.requests.find(item => item.method === 'POST');
  expect(write?.body).toEqual({ rating: 5, comment: 'a'.repeat(2000) });
});

test('Công dân: 409 tải lại đánh giá đã tồn tại', async ({ page }) => {
  const state = await setup(page); state.conflict = true; await open(page);
  await page.getByRole('radio', { name: '5 sao', exact: true }).check(); await page.getByRole('button', { name: 'Gửi đánh giá', exact: true }).click();
  await expect(page.getByText('Đánh giá đã được ghi nhận: 5/5 sao')).toBeVisible(); expect(state.postCount).toBe(1);
});

test('Công dân: response sai hồ sơ không báo đã lưu', async ({ page }) => {
  const state = await setup(page); state.wrongApplication = true; await open(page);
  await page.getByRole('radio', { name: '5 sao', exact: true }).check(); await page.getByRole('textbox', { name: 'Góp ý bổ sung' }).fill('Giữ nội dung');
  await page.getByRole('button', { name: 'Gửi đánh giá', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('không khớp hồ sơ');
  await expect(page.getByText('Đánh giá đã được ghi nhận: 5/5 sao')).toHaveCount(0);
  await expect(page.getByRole('textbox', { name: 'Góp ý bổ sung' })).toHaveValue('Giữ nội dung');
});

test('Công dân: Escape xác nhận bỏ dữ liệu, modal vừa mobile', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 }); await setup(page); await open(page);
  await page.getByRole('radio', { name: '4 sao', exact: true }).check(); await page.keyboard.press('Escape');
  await expect(page.getByRole('heading', { name: 'Bỏ thay đổi chưa lưu?' })).toBeVisible();
  await page.getByRole('button', { name: 'Tiếp tục chỉnh sửa' }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('Công dân: hồ sơ bản nháp chưa được đánh giá', async ({ page }) => {
  await mockDocumentWorkflow(page, 'citizen', 'DRAFT'); const state = await mockAnalytics(page); await page.goto('/citizen?section=feedback');
  await expect(page.getByText('Chưa có hồ sơ đủ điều kiện đánh giá trong danh sách đã tải.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Xem / gửi đánh giá' })).toHaveCount(0); expect(state.postCount).toBe(0);
});

test('Công dân: GET 404 không đúng mã không được coi là chưa đánh giá', async ({ page }) => {
  await mockDocumentWorkflow(page, 'citizen', 'DOCUMENTS_READY');
  await page.route('**/api/v1/citizen/feedback/*', async route => {
    const { authReply } = await import('./fixtures/auth');
    return authReply(route, route.request().method() === 'OPTIONS' ? { status: 204 } : { status: 404, json: { code: 'feedback.application_not_found', title: 'Không tìm thấy hồ sơ trong phạm vi của bạn.' } });
  });
  await page.goto('/citizen?section=feedback'); await page.getByRole('button', { name: 'Xem / gửi đánh giá' }).click();
  await expect(page.getByRole('alert')).toContainText('Không tìm thấy hồ sơ trong phạm vi của bạn.'); await expect(page.getByRole('button', { name: 'Gửi đánh giá', exact: true })).toHaveCount(0);
});

test('Công dân: 409 chưa sẵn sàng giữ góp ý và khóa gửi lại', async ({ page }) => {
  await setup(page);
  await page.route('**/api/v1/citizen/feedback/*', async route => {
    if (route.request().method() !== 'POST') return route.fallback();
    const { authReply } = await import('./fixtures/auth');
    return authReply(route, { status: 409, json: { code: 'feedback.not_ready', title: 'Hồ sơ chưa đủ điều kiện đánh giá.' } });
  });
  await open(page); await page.getByRole('radio', { name: '5 sao', exact: true }).check(); await page.getByRole('textbox', { name: 'Góp ý bổ sung' }).fill('Giữ góp ý');
  await page.getByRole('button', { name: 'Gửi đánh giá', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Hồ sơ chưa đủ điều kiện đánh giá.');
  await expect(page.getByRole('textbox', { name: 'Góp ý bổ sung' })).toHaveValue('Giữ góp ý');
  await expect(page.getByRole('button', { name: 'Gửi đánh giá', exact: true })).toBeDisabled();
});

test('Công dân: lỗi validation BE gắn đúng trường và đưa focus để sửa', async ({ page }) => {
  await setup(page);
  await page.route('**/api/v1/citizen/feedback/*', async route => {
    if (route.request().method() !== 'POST') return route.fallback();
    const { authReply } = await import('./fixtures/auth');
    return authReply(route, { status: 400, json: { title: 'Thông tin đánh giá chưa hợp lệ.', errors: { Comment: ['Vui lòng kiểm tra nội dung góp ý.'] } } });
  });
  await open(page); await page.getByRole('radio', { name: '5 sao', exact: true }).check(); await page.getByRole('textbox', { name: 'Góp ý bổ sung' }).fill('Nội dung cần giữ');
  await page.getByRole('button', { name: 'Gửi đánh giá', exact: true }).click();
  await expect(page.getByText('Vui lòng kiểm tra nội dung góp ý.', { exact: true })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Góp ý bổ sung' })).toBeFocused();
  await expect(page.getByRole('textbox', { name: 'Góp ý bổ sung' })).toHaveValue('Nội dung cần giữ');
});
