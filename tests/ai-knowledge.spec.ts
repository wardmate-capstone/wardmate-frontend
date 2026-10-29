import { expect, test, type Page } from '@playwright/test';
import { mockWorkspaceAuth } from './fixtures/auth';
import { mockCatalog } from './fixtures/procedures';
import { mockAi, docId, revisionA } from './fixtures/aiKnowledge';

async function openKnowledge(page: Page, roles = ['PROCEDURE_MANAGER'], path = '/procedure-manager') {
  await mockWorkspaceAuth(page, roles);
  await mockCatalog(page);
  const ai = await mockAi(page);
  await page.goto(path);
  await page.locator('aside').getByRole('button', { name: 'Dữ liệu kiến thức AI', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Tình trạng sẵn sàng cho trợ lý AI' })).toBeVisible();
  return ai;
}

test('procedure manager sees index status and documents; procedure sources are not editable', async ({ page }) => {
  const ai = await openKnowledge(page);
  await expect(page.getByText('Tạo vector: Đang bật')).toBeVisible();
  await expect(page.getByText('Trả lời theo nguồn: Đang tắt')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Hỏi đáp khai sinh', exact: true })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'Lỗi tạo vector' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Sửa Đăng ký khai sinh từ API' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Dùng lại Đăng ký khai sinh từ API' })).toBeVisible();
  // Search is paid per call: never sent just by opening the screen.
  expect(ai.requests.some((r) => r.path.endsWith('/search'))).toBe(false);
});

test('menu is hidden without knowledge.manage', async ({ page }) => {
  await mockWorkspaceAuth(page, ['PROCEDURE_MANAGER'], ['iam.profile.read', 'procedure.read', 'procedure.update']);
  await mockCatalog(page);
  await page.goto('/procedure-manager');
  await expect(page.locator('aside').getByRole('button', { name: 'Danh sách thủ tục', exact: true })).toBeVisible();
  await expect(page.locator('aside').getByRole('button', { name: 'Dữ liệu kiến thức AI' })).toHaveCount(0);
});

test('create FAQ validates locally before posting', async ({ page }) => {
  const ai = await openKnowledge(page);
  await page.getByRole('button', { name: 'Thêm văn bản/FAQ' }).click();
  const dialog = page.getByRole('dialog', { name: 'Thêm văn bản hoặc hỏi đáp' });
  await dialog.getByLabel('Hỏi đáp (FAQ)').check();
  await dialog.getByRole('textbox', { name: 'Tiêu đề', exact: true }).fill('ab');
  await dialog.getByLabel('Nội dung').fill('ngắn');
  await dialog.getByRole('button', { name: 'Lưu tài liệu' }).click();
  await expect(dialog.getByText('Tiêu đề cần từ 3 ký tự.')).toBeVisible();
  await expect(dialog.getByText('Nội dung cần ít nhất 20 ký tự.')).toBeVisible();
  expect(ai.requests.some((r) => r.method === 'POST' && r.path.endsWith('/documents'))).toBe(false);

  await dialog.getByRole('textbox', { name: 'Tiêu đề', exact: true }).fill('Hỏi đáp kết hôn');
  await dialog.getByLabel('Nội dung').fill('Hỏi: Cần gì?\nĐáp: Mang tờ khai đăng ký kết hôn.');
  await dialog.getByRole('button', { name: 'Lưu tài liệu' }).click();
  await expect(dialog).toHaveCount(0);
  const post = ai.requests.find((r) => r.method === 'POST' && r.path.endsWith('/documents'));
  expect(post?.body).toEqual({ sourceType: 'FAQ', title: 'Hỏi đáp kết hôn', content: 'Hỏi: Cần gì?\nĐáp: Mang tờ khai đăng ký kết hôn.', procedureId: null });
  await expect(page.getByRole('button', { name: 'Hỏi đáp kết hôn', exact: true })).toBeVisible();
});

test('PDF over 10 MB is rejected in the browser', async ({ page }) => {
  const ai = await openKnowledge(page);
  await page.getByRole('button', { name: 'Tải PDF' }).click();
  const dialog = page.getByRole('dialog', { name: 'Tải PDF vào kho kiến thức' });
  await dialog.getByLabel('File PDF').setInputFiles({ name: 'lon.pdf', mimeType: 'application/pdf', buffer: Buffer.alloc(10 * 1024 * 1024 + 1) });
  await expect(dialog.getByText('Chỉ nhận file PDF tối đa 10 MB.')).toBeVisible();
  await dialog.getByRole('button', { name: 'Tải lên' }).click();
  await expect(dialog.getByText('Chọn file PDF cần tải lên.')).toBeVisible();
  expect(ai.requests.some((r) => r.path.endsWith('/documents/pdf'))).toBe(false);
});

test('edit conflict keeps the form and offers reload; deactivate sends the read revision', async ({ page }) => {
  const ai = await openKnowledge(page);
  ai.updateConflict = true;
  await page.getByRole('button', { name: 'Sửa Hỏi đáp khai sinh' }).click();
  const dialog = page.getByRole('dialog', { name: 'Sửa tài liệu' });
  const title = dialog.getByRole('textbox', { name: 'Tiêu đề', exact: true });
  await expect(title).toHaveValue('Hỏi đáp khai sinh');
  await title.fill('Tiêu đề đã sửa');
  await dialog.getByRole('button', { name: 'Lưu thay đổi' }).click();
  await expect(dialog.getByRole('alert')).toContainText('vừa được người khác cập nhật');
  await expect(dialog.getByRole('button', { name: 'Tải bản mới nhất' })).toBeVisible();
  await expect(title).toHaveValue('Tiêu đề đã sửa');
  expect(ai.requests.find((r) => r.method === 'PUT')?.body).toMatchObject({ expectedRevision: revisionA, title: 'Tiêu đề đã sửa', content: null });
  await dialog.getByRole('button', { name: 'Hủy' }).click();

  await page.getByRole('button', { name: 'Ngừng dùng Hỏi đáp khai sinh' }).click();
  const confirm = page.getByRole('dialog', { name: 'Ngừng dùng tài liệu' });
  await confirm.getByRole('button', { name: 'Ngừng dùng', exact: true }).click();
  await expect(confirm).toHaveCount(0);
  const activation = ai.requests.find((r) => r.path === `/api/v1/ai/knowledge/documents/${docId}/activation`);
  expect(activation?.body).toEqual({ expectedRevision: revisionA, isActive: false });
});

test('sync all warns when the catalog list was incomplete', async ({ page }) => {
  await openKnowledge(page);
  await page.getByRole('button', { name: 'Đồng bộ tất cả' }).click();
  const dialog = page.getByRole('dialog', { name: 'Đồng bộ tất cả thủ tục' });
  await dialog.getByRole('button', { name: 'Bắt đầu đồng bộ' }).click();
  await expect(dialog.getByText('Danh sách thủ tục lấy về chưa đầy đủ')).toBeVisible();
  await expect(dialog.getByText('1 thủ tục đồng bộ lỗi')).toBeVisible();
});

test('search test runs only when requested', async ({ page }) => {
  const ai = await openKnowledge(page);
  await page.getByLabel('Câu hỏi thử').fill('khai sinh cần gì');
  await page.getByRole('button', { name: 'Tìm thử' }).click();
  await expect(page.getByRole('list', { name: 'Kết quả tìm thử' })).toContainText('Độ khớp 0.77');
  const searches = ai.requests.filter((r) => r.path.endsWith('/search'));
  expect(searches).toHaveLength(1);
  expect(searches[0].body).toEqual({ query: 'khai sinh cần gì', topK: 5 });
});

test('IT admin opens the same knowledge screen from the admin workspace', async ({ page }) => {
  await openKnowledge(page, ['IT_ADMIN'], '/admin');
  await expect(page.getByRole('button', { name: 'Hỏi đáp khai sinh', exact: true })).toBeVisible();
  await expect(page.getByText('API quản lý nguồn tri thức và đồng bộ RAG sẽ được tích hợp sau')).toHaveCount(0);
});
