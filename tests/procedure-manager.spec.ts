import { test, expect } from '@playwright/test';
import { mockWorkspaceAuth } from './fixtures/auth';
import { mockCatalog, catalogReply, procedureId, draftId, savedRevision, sampleProcedure } from './fixtures/procedures';
import { contentFromApi } from '../src/lib/procedureContent';

test('mapping API preserves methods, common checklist, cases and literal legal text', () => {
  const result = contentFromApi(sampleProcedure);
  expect(result.methods[0]).toMatchObject({ method: 'Trực tiếp', processingTime: '1 ngày', notes: 'Áp dụng theo điều kiện nguồn' });
  expect(result.checklist).toHaveLength(3);
  expect(result.cases).toHaveLength(2);
  expect(result.legalBases[0].url).toBe('');
});

test('public uses API query and pagination, preserves URL and never sends JWT', async ({ page }) => {
  const state = await mockCatalog(page);
  await page.goto('/thu-tuc');
  await expect(page.locator('.procedures-list > li')).toHaveCount(5);
  await page.getByRole('button', { name: 'Trang sau', exact: true }).click();
  await expect(page).toHaveURL(/page=2/);
  await expect(page.locator('.procedures-list > li')).toHaveCount(1);
  await page.getByLabel('Tên thủ tục hoặc nhu cầu của bạn').fill('khai sinh');
  await expect(page).not.toHaveURL(/page=2/);
  await expect.poll(() => state.requests.some(r => r.query.get('keyword') === 'khai sinh' && r.query.get('pageNumber') === '1')).toBe(true);
  await page.getByRole('complementary', { name: 'Lọc theo lĩnh vực' }).getByRole('button', { name: 'Chứng thực' }).click();
  await expect(page.getByText('Chưa tìm thấy thủ tục phù hợp')).toBeVisible();
  expect(state.requests.filter(r => r.path.startsWith('/api/v1/procedures')).every(r => !r.authorization)).toBe(true);
});

test('public loading does not announce zero results before data arrives', async ({ page }) => {
  const state = await mockCatalog(page);
  state.categoryDelay = 700;
  state.procedureListDelay = 700;
  await page.goto('/thu-tuc');
  await expect(page.getByRole('status', { name: 'Đang tải danh sách' })).toBeVisible();
  await expect(page.getByText('0 thủ tục phù hợp')).toHaveCount(0);
  await expect(page.getByText('-1 nhóm')).toHaveCount(0);
  await expect(page.getByText('6 thủ tục phù hợp')).toBeVisible();
});

test('public detail supports case switching, no fake download, source and mobile', async ({ page }) => {
  await mockCatalog(page);
  await page.route('https://example.test/source.pdf', route => route.fulfill({ body: '%PDF-1.4', contentType: 'application/pdf' }));
  await page.goto(`/thu-tuc/${procedureId}?category=1`);
  await expect(page.getByRole('heading', { name: sampleProcedure.title, exact: true })).toBeFocused();
  await expect(page.getByText('Giấy chứng sinh', { exact: true })).toBeVisible();
  await page.getByRole('tab', { name: /Trường hợp B/ }).click();
  await expect(page.getByText('Giấy tờ trường hợp B', { exact: true })).toBeVisible();
  await expect(page.getByText('Giấy tờ dùng chung', { exact: true })).toBeVisible();
  await expect(page.locator('#thanh-phan-ho-so input[type=checkbox]')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Tải mẫu', exact: true })).toHaveCount(0);
  await expect(page.locator('#can-cu-phap-luat script')).toHaveCount(0);
  await page.getByRole('button', { name: 'Xem PDF nguồn' }).click();
  await expect(page.getByTitle('PDF nguồn thủ tục')).toHaveAttribute('src', 'https://example.test/source.pdf');
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: `test-results/procedure-api-detail-${width}.png`, fullPage: true });
  }
});

test('network error never falls back to mock and can retry', async ({ page }) => {
  const state = await mockCatalog(page); state.listError = true;
  await page.goto('/thu-tuc');
  await expect(page.getByRole('alert')).toContainText('Dịch vụ tạm thời');
  await expect(page.locator('.procedures-list > li')).toHaveCount(0);
  state.listError = false;
  await page.getByRole('button', { name: 'Thử lại' }).click();
  await expect(page.locator('.procedures-list > li')).toHaveCount(5);
});

test('manager edit preserves unseen nested data and uses PUT with effective date', async ({ page }) => {
  await mockWorkspaceAuth(page, ['PROCEDURE_MANAGER']); const state = await mockCatalog(page);
  await page.goto('/procedure-manager');
  await page.getByRole('button', { name: 'Danh sách thủ tục', exact: true }).click();
  await page.getByRole('button', { name: 'Chi tiết', exact: true }).first().click();
  await page.getByRole('button', { name: 'Chỉnh sửa', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Tên thủ tục', { exact: true }).fill('Tên thủ tục đã chỉnh sửa');
  await dialog.getByLabel('Ngày hiệu lực của thay đổi').fill('2026-10-06');
  await dialog.getByRole('button', { name: 'Lưu thay đổi' }).click();
  await expect(dialog).toHaveCount(0);
  const request = state.requests.find(r => r.method === 'PUT');
  expect(request?.body?.contentPayload).toEqual(sampleProcedure.contentPayload);
  expect(request?.body?.checklistSchema).toEqual(sampleProcedure.checklistSchema);
  expect(request?.body?.formDefinitions).toEqual(sampleProcedure.formDefinitions);
  expect(request?.body?.originalPdfUrl).toBe(sampleProcedure.originalPdfUrl);
  expect(request?.body?.effectiveDate).toBe('2026-10-06');
  expect(request?.authorization).toBe('Bearer ui-test-token');
});

test('inactive procedure uses manager detail and remains editable', async ({ page }) => {
  await mockWorkspaceAuth(page, ['IT_ADMIN']); const state = await mockCatalog(page); state.detail.isActive = false;
  await page.goto('/procedure-manager');
  await page.getByRole('button', { name: 'Danh sách thủ tục', exact: true }).click();
  await page.getByRole('button', { name: 'Chi tiết', exact: true }).first().click();
  await expect(page.getByRole('button', { name: 'Chỉnh sửa', exact: true })).toBeEnabled();
  expect(state.requests.some(r => r.path === `/api/v1/procedures/${procedureId}`)).toBe(false);
  expect(state.requests.some(r => r.path === `/api/v1/procedure-manager/procedures/${procedureId}`)).toBe(true);
  await page.getByRole('button', { name: 'Mở công khai', exact: true }).click();
  await page.getByRole('dialog').getByLabel('Lý do (không bắt buộc)').fill('Đã đối soát');
  await page.getByRole('dialog').getByRole('button', { name: 'Xác nhận', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Chỉnh sửa', exact: true })).toBeEnabled();
  expect(state.requests.find(r => r.method === 'PATCH')?.body).toEqual({ isActive: true, reason: 'Đã đối soát' });
});

test('manager administers categories through catalog API', async ({ page }) => {
  await mockWorkspaceAuth(page, ['PROCEDURE_MANAGER']); const state = await mockCatalog(page);
  await page.goto('/procedure-manager');
  await page.getByRole('button', { name: 'Danh mục thủ tục', exact: true }).click();
  const search = page.getByRole('searchbox', { name: 'Tìm danh mục' });
  await search.fill('chung thuc');
  await expect(page.getByText('Chứng thực', { exact: true })).toBeVisible();
  await expect(page.getByText('Hộ tịch', { exact: true })).toHaveCount(0);
  await search.fill('không tồn tại');
  await expect(page.getByText('Không tìm thấy danh mục phù hợp.')).toBeVisible();
  await search.fill('');
  await page.getByRole('button', { name: 'Thêm danh mục', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Tên danh mục').fill('Danh mục mới');
  await dialog.getByLabel('Mô tả').fill('Mô tả kiểm thử');
  await dialog.getByRole('button', { name: 'Lưu danh mục' }).click();
  await expect(dialog).toHaveCount(0);
  expect(state.requests.find(r => r.path === '/api/v1/procedure-manager/categories' && r.method === 'POST')?.body).toEqual({ categoryName: 'Danh mục mới', description: 'Mô tả kiểm thử' });
});

test('loading states never render empty category or draft content underneath skeletons', async ({ page }) => {
  await mockWorkspaceAuth(page, ['PROCEDURE_MANAGER']);
  const state = await mockCatalog(page);
  state.categoryDelay = 800;
  await page.goto('/procedure-manager');
  await page.getByRole('button', { name: 'Danh mục thủ tục', exact: true }).click();
  await expect(page.getByRole('status', { name: 'Đang tải danh sách' })).toHaveCount(1);
  await expect(page.getByText('Chưa có danh mục thủ tục.')).toHaveCount(0);
  await expect(page.getByRole('searchbox', { name: 'Tìm danh mục' })).toBeVisible();

  state.draftListDelay = 800;
  await page.getByRole('button', { name: 'PDF và bản nháp', exact: true }).click();
  await expect(page.getByRole('status', { name: 'Đang tải danh sách' })).toHaveCount(1);
  await expect(page.getByText('Bản nháp gần đây')).toHaveCount(0);
  await expect(page.getByText('Bản nháp gần đây')).toBeVisible();
});

test('manager deletes an unused draft through administration API', async ({ page }) => {
  await mockWorkspaceAuth(page, ['PROCEDURE_MANAGER']); const state = await mockCatalog(page);
  await page.goto('/procedure-manager?section=drafts');
  await expect(page.getByRole('button', { name: 'Làm mới danh sách' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Xóa', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Xác nhận xóa' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(state.requests.some(r => r.path.endsWith(`/drafts/${draftId}`) && r.method === 'DELETE')).toBe(true);
});

test('manager rolls back a version with required audit fields', async ({ page }) => {
  await mockWorkspaceAuth(page, ['PROCEDURE_MANAGER']); const state = await mockCatalog(page);
  await page.goto('/procedure-manager');
  await page.getByRole('button', { name: 'Danh sách thủ tục', exact: true }).click();
  await page.getByTitle('Xem lịch sử phiên bản').first().click();
  await page.getByText(/Phiên bản 1 · QĐ:/).click();
  await page.getByRole('button', { name: 'Xem PDF nguồn' }).click();
  await expect(page.getByTitle('PDF nguồn thủ tục')).toHaveAttribute('src', 'https://example.test/source.pdf');
  await page.getByRole('button', { name: 'Khôi phục phiên bản này' }).click();
  const rollback = page.getByRole('dialog').last();
  await rollback.getByLabel('Lý do khôi phục').fill('Khôi phục nội dung đúng');
  await rollback.getByLabel('Số quyết định').fill('QĐ-ROLLBACK');
  await rollback.getByLabel('Ngày hiệu lực').fill('2026-10-07');
  await rollback.getByRole('button', { name: 'Xác nhận khôi phục' }).click();
  await expect.poll(() => state.requests.find(r => r.path.endsWith('/versions/1/rollback'))?.body).toEqual({ reason: 'Khôi phục nội dung đúng', decisionNumber: 'QĐ-ROLLBACK', effectiveDate: '2026-10-07' });
});

test('procedure editor selects a real DocumentForm option instead of a manual id', async ({ page }) => {
  await mockWorkspaceAuth(page, ['PROCEDURE_MANAGER']); const state = await mockCatalog(page);
  await page.goto('/procedure-manager');
  await page.getByRole('button', { name: 'Thêm thủ tục', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: /Biểu mẫu/ }).click();
  await expect(page.getByRole('button', { name: 'BM-01 · Tờ khai điện tử' })).toBeVisible();
  await page.getByRole('button', { name: 'BM-01 · Tờ khai điện tử' }).click();
  await expect(page.getByRole('paragraph').filter({ hasText: 'BM-01 · Tờ khai điện tử' })).toBeVisible();
  expect(state.requests.some(r => r.path.endsWith('/document-forms'))).toBe(true);
});

test('manager create sends full reviewed form without invented defaults', async ({ page }) => {
  await mockWorkspaceAuth(page, ['PROCEDURE_MANAGER']); const state = await mockCatalog(page);
  await page.goto('/procedure-manager'); await page.getByRole('button', { name: 'Thêm thủ tục', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByLabel('Mã thủ tục', { exact: true })).toHaveValue('');
  for (const [label, value] of [['Mã thủ tục', 'TEST-NEW'], ['Tên thủ tục', 'Thủ tục mới từ API'], ['Cấp thực hiện', 'Cấp Xã'], ['Đối tượng thực hiện', 'Công dân'], ['Tóm tắt lệ phí', 'Theo quy định'], ['Tóm tắt thời hạn', 'Theo quy định']]) await dialog.getByLabel(label, { exact: true }).fill(value);
  await dialog.getByLabel('Danh mục', { exact: true }).selectOption('1');
  await dialog.getByRole('checkbox').check();
  await dialog.getByRole('button', { name: 'Tạo thủ tục' }).click();
  await expect(dialog).toHaveCount(0);
  const request = state.requests.find(r => r.method === 'POST');
  expect(request?.path).toBe('/api/v1/procedure-manager/procedures');
  expect(request?.body?.categoryId).toBe(1);
  expect(request?.body?.checklistSchema).toEqual([]);
});

test('PDF upload polls and publishes using saved revision; reload keeps server state', async ({ page }) => {
  await mockWorkspaceAuth(page, ['PROCEDURE_MANAGER']); const state = await mockCatalog(page); state.queued = true;
  await page.goto('/procedure-manager?section=drafts');
  await page.getByLabel('PDF mô tả thủ tục (tối đa 20 MB)').setInputFiles({ name: 'khai-sinh.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4 test') });
  await page.getByRole('button', { name: 'Tạo bản nháp và lưu PDF' }).click();
  await expect(page).toHaveURL(new RegExp(`draft=${draftId}`));
  await expect(page.getByRole('button', { name: 'Lưu bản nháp', exact: true })).toBeVisible({ timeout: 12000 });
  await page.getByRole('checkbox', { name: /Tôi đã kiểm tra nội dung/ }).check();
  await page.getByRole('button', { name: 'Xác nhận xuất bản' }).click();
  await expect(page.getByRole('heading', { name: /khai-sinh.pdf · Đã xuất bản/ })).toBeVisible();
  const calls = state.requests.filter(r => r.path.includes('/drafts/') && ['PUT', 'POST'].includes(r.method));
  expect(calls.map(r => r.method)).toEqual(['PUT', 'POST']);
  expect(calls[1].body).toEqual({ revision: savedRevision, confirmed: true });
  await page.reload();
  await expect(page.getByRole('heading', { name: /khai-sinh.pdf · Đã xuất bản/ })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Xác nhận xuất bản' })).toHaveCount(0);
});

test('draft publish explains missing required fields in Vietnamese and does not save', async ({ page }) => {
  await mockWorkspaceAuth(page, ['PROCEDURE_MANAGER']); const state = await mockCatalog(page);
  await page.goto(`/procedure-manager?draft=${draftId}`);
  await page.getByLabel('Mã thủ tục', { exact: true }).fill('');
  await page.getByRole('checkbox', { name: /Tôi đã kiểm tra nội dung/ }).check();
  await page.getByRole('button', { name: 'Xác nhận xuất bản' }).click();
  await expect(page.getByRole('alert')).toContainText('Mã thủ tục');
  await expect(page.getByRole('alert')).not.toContainText('procedureCode');
  expect(state.requests.some(r => r.method === 'PUT' && r.path.includes('/drafts/'))).toBe(false);
});

test('draft conflict preserves unsaved input and never publishes', async ({ page }) => {
  await mockWorkspaceAuth(page, ['PROCEDURE_MANAGER']); const state = await mockCatalog(page); state.conflict = true;
  await page.goto(`/procedure-manager?draft=${draftId}`);
  await page.getByLabel('Tên thủ tục', { exact: true }).fill('Nội dung chưa lưu cần giữ');
  await page.getByRole('checkbox', { name: /Tôi đã kiểm tra nội dung/ }).check();
  await page.getByRole('button', { name: 'Xác nhận xuất bản' }).click();
  await expect(page.getByRole('alert')).toContainText('Bản nháp đã thay đổi');
  await expect(page.getByLabel('Tên thủ tục', { exact: true })).toHaveValue('Nội dung chưa lưu cần giữ');
  expect(state.requests.some(r => r.path.endsWith('/publish'))).toBe(false);
});

test('publish response lost is reconciled with GET draft, not repeated', async ({ page }) => {
  await mockWorkspaceAuth(page, ['PROCEDURE_MANAGER']); const state = await mockCatalog(page); state.failPublishResponse = true;
  await page.goto(`/procedure-manager?draft=${draftId}`);
  await page.getByRole('checkbox', { name: /Tôi đã kiểm tra nội dung/ }).check();
  await page.getByRole('button', { name: 'Xác nhận xuất bản' }).click();
  await expect(page.getByRole('heading', { name: /Đã xuất bản/ })).toBeVisible();
  expect(state.requests.filter(r => r.path.endsWith('/publish'))).toHaveLength(1);
});

test('preview does not upload until requested, clears on return, and failed extraction offers retry', async ({ page }) => {
  await mockWorkspaceAuth(page, ['PROCEDURE_MANAGER']); const state = await mockCatalog(page);
  await page.goto('/procedure-manager?section=drafts');
  await page.getByRole('radio', { name: /Xem và nhận diện nội dung/ }).click();
  await page.getByLabel('PDF mô tả thủ tục (tối đa 20 MB)').setInputFiles({ name: 'khai-sinh.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4 test') });
  await page.getByRole('button', { name: 'Xem và nhận diện PDF' }).click();
  await expect(page.getByTitle('Tệp PDF đang xem')).toBeVisible();
  await page.getByRole('tab', { name: 'Văn bản nhận diện' }).click();
  await expect(page.getByText('Nội dung đọc thử từ PDF')).toBeVisible();
  expect(state.requests.filter(r => r.method === 'POST').map(r => r.path)).toEqual(['/api/v1/procedure-manager/drafts/extract-preview']);
  await page.getByRole('radio', { name: /Tạo bản nháp có PDF gốc/ }).click();
  await page.getByRole('button', { name: 'Tạo bản nháp và lưu PDF' }).click();
  await page.getByRole('button', { name: 'Về danh sách bản nháp' }).click();
  await expect(page.getByText('Nội dung đọc thử từ PDF')).toHaveCount(0);
  state.draftStatus = 'Failed'; await page.goto(`/procedure-manager?draft=${draftId}`);
  await page.getByRole('button', { name: 'Đọc lại PDF' }).click();
  await expect.poll(() => state.requests.some(r => r.path.endsWith('/retry'))).toBe(true);
});

test('preview publishes reviewed payload without uploading the source PDF', async ({ page }) => {
  await mockWorkspaceAuth(page, ['PROCEDURE_MANAGER']); const state = await mockCatalog(page);
  await page.goto('/procedure-manager?section=drafts');
  await page.getByRole('radio', { name: /Xem và nhận diện nội dung/ }).click();
  await page.getByLabel('PDF mô tả thủ tục (tối đa 20 MB)').setInputFiles({ name: 'khai-sinh.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4 test') });
  await page.getByRole('button', { name: 'Xem và nhận diện PDF' }).click();
  await page.getByRole('checkbox', { name: /Tôi đã kiểm tra nội dung/ }).check();
  await page.getByRole('button', { name: 'Công khai thủ tục' }).click();
  await expect(page.getByText('Kết quả nhận diện')).toHaveCount(0);
  const calls = state.requests.filter(r => r.method === 'POST');
  expect(calls.map(r => r.path)).toEqual(['/api/v1/procedure-manager/drafts/extract-preview', '/api/v1/procedure-manager/procedures/publish']);
});

test('403 is shown without fake data or redirect; unsupported features contain no mock', async ({ page }) => {
  await mockWorkspaceAuth(page, ['PROCEDURE_MANAGER']); await mockCatalog(page);
  await page.route('**/api/v1/procedure-manager/procedures?*', route => route.request().method() === 'OPTIONS' ? catalogReply(route, { status: 204 }) : catalogReply(route, { status: 403, json: { title: 'Bạn không có quyền quản lý thủ tục.' } }));
  await page.goto('/procedure-manager');
  await expect(page.getByRole('alert').first()).toContainText('không có quyền');
  await expect(page).toHaveURL(/procedure-manager/);
  await page.getByRole('button', { name: 'Dữ liệu kiến thức AI', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Chưa có kết nối cho chức năng này' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Đồng bộ lại' })).toHaveCount(0);
});

test('read-only procedure permission hides mutating actions and blocks draft workspace', async ({ page }) => {
  await mockWorkspaceAuth(page, ['PROCEDURE_MANAGER'], ['iam.profile.read', 'procedure.read']);
  const state = await mockCatalog(page);
  await page.goto('/procedure-manager?section=drafts');
  await expect(page.getByRole('heading', { name: 'Bạn chưa có quyền xem PDF và bản nháp' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Thêm thủ tục', exact: true })).toHaveCount(0);
  expect(state.requests.some((request) => request.path === '/api/v1/procedure-manager/drafts')).toBe(false);
});

test('manager and editor fit mobile and focus stays in modal', async ({ page }) => {
  await mockWorkspaceAuth(page, ['PROCEDURE_MANAGER']); await mockCatalog(page);
  await page.setViewportSize({ width: 390, height: 844 }); await page.goto('/procedure-manager');
  await expect(page.getByRole('heading', { name: 'Thủ tục cập nhật gần đây' })).toBeVisible();
  await expect(page.getByRole('table')).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/procedure-api-manager-mobile.png', fullPage: true });
  await page.getByRole('button', { name: 'Thêm thủ tục', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Tab');
  expect(await page.getByRole('dialog').evaluate(node => node.contains(document.activeElement))).toBe(true);
  await page.screenshot({ path: 'test-results/procedure-api-editor-mobile.png', fullPage: true });
  await page.keyboard.press('Escape'); await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('public search waits for a pause instead of requesting each keystroke', async ({ page }) => {
  const state = await mockCatalog(page);
  await page.goto('/thu-tuc');
  await expect(page.locator('.procedures-list > li')).toHaveCount(5);
  await page.getByLabel('Tên thủ tục hoặc nhu cầu của bạn').pressSequentially('khai sinh', { delay: 35 });
  await expect.poll(() => state.requests.filter(r => r.query.has('keyword')).length).toBe(1);
  expect(state.requests.filter(r => r.query.has('keyword'))[0].query.get('keyword')).toBe('khai sinh');
});

test('dashboard restores overview sections without a duplicate procedure table or fake metrics', async ({ page }) => {
  await mockWorkspaceAuth(page, ['PROCEDURE_MANAGER']);
  const state = await mockCatalog(page);
  await page.goto('/procedure-manager');
  await expect(page.getByRole('region', { name: 'Các chỉ số tổng quan' }).getByRole('button')).toHaveCount(3);
  await expect(page.getByRole('heading', { name: 'Hạng mục cần chú ý hoàn thiện' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Biểu mẫu cập nhật gần đây' })).toBeVisible();
  await expect(page.getByRole('table')).toHaveCount(0);
  await expect.poll(() => state.requests.some(r => r.query.get('sortBy') === 'UpdatedAt' && r.query.get('isAscending') === 'false')).toBe(true);
  await page.getByRole('button', { name: 'Danh sách thủ tục', exact: true }).click();
  await expect(page.getByRole('table')).toBeVisible();
});
