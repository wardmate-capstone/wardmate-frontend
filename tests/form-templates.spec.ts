import { test, expect, type Page } from '@playwright/test';
import { mockWorkspaceAuth, authReply } from './fixtures/auth';
import { mockCatalog, catalogReply, procedureId, formTemplateId, sampleProcedure } from './fixtures/procedures';
import { createPreviewDocx } from './fixtures/formTemplateDocx';

const original = { id: formTemplateId, code: 'BM-01', title: 'Tờ khai kiểm thử', fileDocxUrl: 'https://example.test/template.docx' as string | null, isActive: true, createdAtUtc: '2026-10-14T00:00:00Z', updatedAtUtc: null, onlineReady: true };
async function mockForms(page: Page) {
  const docx = await createPreviewDocx();
  const state = { item: { ...original }, reads: [] as URLSearchParams[], writes: [] as string[], forbidden: false, listError: false, conflict: false, uploadFailed: false, badDocx: false };
  await page.route('**/api/v1/form-templates**', async route => {
    const request = route.request();
    if (request.method() === 'OPTIONS') return authReply(route, { status: 204 });
    const url = new URL(request.url());
    if (state.forbidden) return authReply(route, { status: 403, json: { title: 'Forbidden' } });
    if (request.method() === 'POST') {
      state.writes.push(url.pathname);
      if (url.pathname.endsWith('upload-docx')) {
        expect(request.headers()['content-type']).toContain('multipart/form-data; boundary=');
        expect(request.postDataBuffer()?.toString()).toContain('name="file"');
        if (state.uploadFailed) return authReply(route, { status: 400, json: { message: 'Tệp DOCX không hợp lệ.' } });
        state.item.fileDocxUrl = original.fileDocxUrl;
        return authReply(route, { json: { templateId: state.item.id, blobUrl: state.item.fileDocxUrl } });
      }
      if (state.conflict) return authReply(route, { status: 409, json: { message: 'Duplicate' } });
      state.item = { ...original, ...request.postDataJSON(), fileDocxUrl: null };
      return authReply(route, { status: 201, json: state.item });
    }
    if (url.pathname.endsWith('download-docx')) return authReply(route, { body: state.badDocx ? Buffer.from('invalid-docx') : docx, contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', headers: { 'content-disposition': 'attachment; filename="mau.docx"' } });
    if (url.pathname.endsWith(formTemplateId)) return authReply(route, { json: state.item });
    state.reads.push(url.searchParams);
    if (state.listError) return authReply(route, { status: 403, json: { title: 'Forbidden' } });
    return authReply(route, { json: { items: [state.item], page: Number(url.searchParams.get('page')), pageSize: 10, totalCount: 11, totalPages: 2 } });
  });
  return state;
}
async function openWarehouse(page: Page, permissions?: string[]) {
  await mockWorkspaceAuth(page, ['PROCEDURE_MANAGER'], permissions);
  await mockCatalog(page);
  const state = await mockForms(page);
  await page.goto('/procedure-manager');
  await page.getByRole('button', { name: 'Danh sách biểu mẫu', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Kho biểu mẫu Word' })).toBeVisible();
  await expect(page.getByText('Tờ khai kiểm thử', { exact: true })).toBeVisible();
  return state;
}

test('manager creates and uploads a template, validates input and retries upload', async ({ page }) => {
  const state = await openWarehouse(page);
  await page.getByRole('button', { name: 'Thêm đơn', exact: true }).click();
  await page.getByRole('button', { name: 'Tạo biểu mẫu', exact: true }).click();
  await expect(page.getByText('Vui lòng nhập mã biểu mẫu.')).toBeVisible();
  expect(state.writes).toHaveLength(0);
  await page.getByRole('dialog').getByLabel('Mã biểu mẫu', { exact: false }).fill('mau_moi');
  await page.getByRole('dialog').getByLabel('Tên biểu mẫu', { exact: false }).fill('Biểu mẫu mới');
  await page.getByRole('button', { name: 'Tạo biểu mẫu', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('MAU_MOI');
  await dialog.getByRole('button', { name: 'Tải lên phôi Word', exact: true }).click();
  await expect(dialog.getByRole('alert')).toContainText('không rỗng');
  await dialog.getByLabel('Tệp Word', { exact: true }).setInputFiles({ name: 'mau.docx', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', buffer: Buffer.from('mock-upload') });
  state.uploadFailed = true;
  await dialog.getByRole('button', { name: 'Tải lên phôi Word', exact: true }).click();
  await expect(dialog.getByRole('alert')).toContainText('Tệp DOCX không hợp lệ');
  state.uploadFailed = false;
  await dialog.getByRole('button', { name: 'Tải lên phôi Word', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByText('Biểu mẫu mới', { exact: true })).toBeVisible();
  expect(state.writes).toHaveLength(3);
});

test('read permission permits viewing and downloading but hides writes', async ({ page }) => {
  const state = await openWarehouse(page, ['document.templates.read']);
  await expect(page.getByRole('button', { name: 'Thêm đơn', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Thay đổi' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Xem mẫu Tờ khai kiểm thử', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('Đã có phôi Word');
  await page.keyboard.press('Escape');
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Tải mẫu Tờ khai kiểm thử', exact: true }).click();
  expect((await download).suggestedFilename()).toMatch(/\.docx$/);
  expect(state.writes).toHaveLength(0);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator('.admin-workspace')).toHaveCSS('margin-left', '0px');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/form-templates-mobile.png', fullPage: true });
});

test('replacing a template requires confirmation and clears stale file selection', async ({ page }) => {
  const state = await openWarehouse(page);
  await page.getByRole('button', { name: 'Thay đổi' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Tệp Word', { exact: true }).setInputFiles({ name: 'mau.docx', mimeType: 'application/octet-stream', buffer: Buffer.from('mock') });
  await dialog.getByRole('button', { name: 'Tải lên phôi Word', exact: true }).click();
  await expect(dialog.getByRole('alert')).toContainText('xác nhận');
  expect(state.writes).toHaveLength(0);
  await page.keyboard.press('Escape');
  await page.getByRole('dialog', { name: 'Bỏ thay đổi chưa lưu?', exact: true }).getByRole('button', { name: 'Bỏ thay đổi', exact: true }).click();
  await page.getByRole('button', { name: 'Thay đổi' }).click();
  await expect(dialog.getByLabel('Tệp Word', { exact: true })).toHaveValue('');
  await dialog.getByLabel('Tệp Word', { exact: true }).setInputFiles({ name: 'mau.docx', mimeType: 'application/octet-stream', buffer: Buffer.from('mock') });
  await dialog.getByRole('checkbox').check();
  await dialog.getByRole('button', { name: 'Tải lên phôi Word', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  expect(state.writes).toHaveLength(1);
});

test('search from page two resets pagination, and server denial can retry', async ({ page }) => {
  const state = await openWarehouse(page);
  await page.getByRole('button', { name: 'Trang sau', exact: true }).click();
  await expect(page.getByText('11 biểu mẫu · Trang 2/2')).toBeVisible();
  await page.getByLabel('Tìm theo mã biểu mẫu').fill('BM');
  await page.getByRole('button', { name: 'Tìm kiếm', exact: true }).click();
  await expect.poll(() => state.reads.at(-1)?.get('searchCode')).toBe('BM');
  expect(state.reads.at(-1)?.get('page')).toBe('1');
  state.listError = true;
  await page.getByRole('button', { name: 'Làm mới', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Máy chủ từ chối');
  state.listError = false;
  await page.getByRole('button', { name: 'Thử lại', exact: true }).click();
  await expect(page.getByText('Tờ khai kiểm thử', { exact: true })).toBeVisible();
});

test('duplicate code keeps the create form open with an actionable error', async ({ page }) => {
  const state = await openWarehouse(page);
  state.conflict = true;
  await page.getByRole('button', { name: 'Thêm đơn', exact: true }).click();
  await page.getByRole('dialog').getByLabel('Mã biểu mẫu', { exact: false }).fill('BM-01');
  await page.getByRole('dialog').getByLabel('Tên biểu mẫu', { exact: false }).fill('Mẫu trùng mã');
  await page.getByRole('button', { name: 'Tạo biểu mẫu', exact: true }).click();
  await expect(page.getByRole('dialog').getByRole('alert')).toContainText('Mã biểu mẫu đã tồn tại');
  expect(state.writes).toHaveLength(1);
});

test('procedure editor previews a real linked template and saves the selected ID', async ({ page }) => {
  await mockWorkspaceAuth(page, ['PROCEDURE_MANAGER']);
  const catalog = await mockCatalog(page);
  await mockForms(page);
  await page.goto('/procedure-manager');
  await page.getByRole('button', { name: 'Danh sách thủ tục', exact: true }).click();
  await page.getByRole('button', { name: 'Chi tiết', exact: true }).first().click();
  await page.getByRole('button', { name: 'Chỉnh sửa', exact: true }).click();
  const editor = page.getByRole('dialog', { name: 'Chỉnh sửa thủ tục', exact: true });
  await editor.getByRole('button', { name: /5 Biểu mẫu/ }).click();
  await editor.getByRole('button', { name: 'Xem mẫu Tờ khai kiểm thử', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Biểu mẫu: Tờ khai kiểm thử', exact: true })).toContainText('Đã có phôi Word');
  await page.keyboard.press('Escape');
  await editor.getByRole('button', { name: 'BM-01 · Tờ khai kiểm thử', exact: true }).click();
  await editor.getByLabel('Ngày hiệu lực của thay đổi').fill('2026-10-14');
  await editor.getByRole('button', { name: 'Lưu thay đổi', exact: true }).click();
  await expect(editor).toHaveCount(0);
  const forms = catalog.requests.find(request => request.method === 'PUT')?.body?.formDefinitions;
  expect(forms).toEqual(expect.arrayContaining([expect.objectContaining({ formTemplateId })]));
});

test('anonymous procedure readers get a safe sign-in link without template API calls', async ({ page }) => {
  await mockWorkspaceAuth(page, []);
  await page.route('**/api/v1/auth/refresh-token', route => authReply(route, { status: 401, json: {} }));
  const catalog = await mockCatalog(page);
  catalog.detail.formDefinitions = [{ formTemplateId, formCode: 'BM-01', formName: 'Tờ khai kiểm thử', formType: 'DOCX_TEMPLATE', quantity: 1, isMandatory: true }];
  const state = await mockForms(page);
  await page.goto(`/thu-tuc/${procedureId}?category=1`);
  await expect(page.getByRole('link', { name: 'Đăng nhập để tải mẫu' })).toHaveAttribute('href', '/dang-nhap?' + new URLSearchParams({ returnTo: `/thu-tuc/${procedureId}?category=1` }));
  expect(state.reads).toHaveLength(0);
});

test('citizen downloads by linked ID; inactive and unlinked templates cannot download', async ({ page }) => {
  await mockWorkspaceAuth(page, ['REGISTERED_CITIZEN']);
  const catalog = await mockCatalog(page);
  catalog.detail.formDefinitions = [{ formTemplateId, formCode: 'BM-01', formName: 'Tờ khai kiểm thử', formType: 'DOCX_TEMPLATE', quantity: 1, isMandatory: true }, { formCode: 'BM-02', formName: 'Mẫu chưa liên kết', formType: 'DOCX_TEMPLATE', quantity: 1, isMandatory: false }];
  const state = await mockForms(page);
  await page.goto(`/thu-tuc/${procedureId}`);
  await expect(page.getByText('Chưa liên kết mẫu Word.')).toBeVisible();
  const downloading = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Tải mẫu Tờ khai kiểm thử', exact: true }).click();
  await downloading;
  state.item.isActive = false;
  await page.getByRole('button', { name: 'Tải mẫu Tờ khai kiểm thử', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('tạm ngừng');
});

test('admin sees aligned actions and an upload button instead of download for an empty template', async ({ page }) => {
  await mockWorkspaceAuth(page, ['IT_ADMIN']);
  await mockCatalog(page);
  const state = await mockForms(page);
  state.item.fileDocxUrl = null;
  await page.goto('/admin');
  await page.getByRole('complementary').getByRole('button', { name: 'Danh sách biểu mẫu', exact: true }).click();
  const row = page.getByRole('row').filter({ hasText: 'Tờ khai kiểm thử' });
  await expect(row.getByRole('button', { name: 'Xem mẫu Tờ khai kiểm thử', exact: true })).toBeDisabled();
  await expect(row.getByRole('button', { name: 'Tải mẫu Tờ khai kiểm thử', exact: true })).toHaveCount(0);
  await expect(row.getByRole('button', { name: 'Tải lên', exact: true })).toBeVisible();
  await row.getByRole('button', { name: 'Tải lên', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('Tải lên phôi');
  await page.keyboard.press('Escape');
  state.item.fileDocxUrl = original.fileDocxUrl;
  await page.getByRole('button', { name: 'Làm mới', exact: true }).click();
  await expect(row.getByRole('button', { name: 'Thay đổi', exact: true })).toBeVisible();
  await page.screenshot({ path: 'test-results/form-template-admin-actions.png', fullPage: true });
});

test('admin create preserves the server forbidden reason and trace without attempting upload', async ({ page }) => {
  await mockWorkspaceAuth(page, ['IT_ADMIN']);
  await mockCatalog(page);
  const state = await mockForms(page);
  await page.route('**/api/v1/form-templates', async route => {
    if (route.request().method() !== 'POST') return route.fallback();
    expect(route.request().headers().authorization).toBe('Bearer ui-test-token');
    return authReply(route, { status: 403, json: { code: 'auth.forbidden', title: 'Bạn không có quyền thực hiện thao tác này.', traceId: 'mock-trace' } });
  });
  await page.goto('/admin');
  await page.getByRole('complementary').getByRole('button', { name: 'Danh sách biểu mẫu', exact: true }).click();
  await page.getByRole('button', { name: 'Thêm đơn', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Mã biểu mẫu', { exact: false }).fill('MAU-MOI');
  await dialog.getByLabel('Tên biểu mẫu', { exact: false }).fill('Biểu mẫu mới');
  await dialog.getByRole('button', { name: 'Tạo biểu mẫu', exact: true }).click();
  await expect(dialog.getByRole('alert')).toContainText('Bạn không có quyền thực hiện thao tác này.');
  await expect(dialog.getByRole('alert')).toContainText('mock-trace');
  expect(state.writes).toHaveLength(0);
});

test('empty procedure opens the form picker directly and persists multiple forms for citizens', async ({ page }) => {
  await mockWorkspaceAuth(page, ['IT_ADMIN']);
  const catalog = await mockCatalog(page);
  catalog.detail.formDefinitions = [];
  await mockForms(page);
  const secondId = '07000000-0000-0000-0000-000000000006';
  await page.route('**/api/v1/form-templates?*', route => {
    if (route.request().method() === 'OPTIONS') return catalogReply(route, { status: 204 });
    return catalogReply(route, { json: { items: [
      { ...original, id: formTemplateId, code: 'BM-01', title: 'Mẫu thứ nhất' },
      { ...original, id: secondId, code: 'BM-02', title: 'Mẫu thứ hai' },
    ], page: 1, pageSize: 10, totalCount: 2, totalPages: 1 } });
  });
  await page.goto('/procedure-manager');
  await page.getByRole('button', { name: 'Danh sách thủ tục', exact: true }).click();
  await page.getByRole('button', { name: 'Chi tiết', exact: true }).first().click();
  await page.getByRole('button', { name: /5 Biểu mẫu/ }).click();
  await expect(page.getByText(/Thủ tục chưa được gắn biểu mẫu/)).toBeVisible();
  await page.getByRole('button', { name: 'Chọn biểu mẫu', exact: true }).click();
  const editor = page.getByRole('dialog', { name: 'Chỉnh sửa thủ tục', exact: true });
  await expect(editor.getByLabel('Tìm biểu mẫu theo mã')).toBeVisible();
  await editor.getByLabel('Tìm biểu mẫu theo mã').fill('BM');
  await editor.getByRole('button', { name: 'BM-01 · Mẫu thứ nhất', exact: true }).click();
  await editor.getByRole('button', { name: 'BM-02 · Mẫu thứ hai', exact: true }).click();
  await expect(editor.getByRole('button', { pressed: true }).filter({ hasText: 'Đã chọn' })).toHaveCount(2);
  await editor.getByLabel('Ngày hiệu lực của thay đổi').fill('2026-10-14');
  await page.screenshot({ path: 'test-results/procedure-multiple-form-picker.png', fullPage: true });
  await editor.getByRole('button', { name: 'Lưu thay đổi', exact: true }).click();
  await expect(editor).toHaveCount(0);
  expect(catalog.detail.formDefinitions).toHaveLength(2);
  await page.goto(`/thu-tuc/${procedureId}`);
  const forms = page.getByRole('region', { name: 'Biểu mẫu của thủ tục', exact: true });
  await expect(forms.getByText('BM-01 · Mẫu thứ nhất', { exact: true })).toBeVisible();
  await expect(forms.getByText('BM-02 · Mẫu thứ hai', { exact: true })).toBeVisible();
});

test('picker uses the warehouse despite catalog bridge failure, keeps selections across pages and searches by code', async ({ page }) => {
  await mockWorkspaceAuth(page, ['IT_ADMIN']);
  await mockCatalog(page);
  await page.route('**/api/v1/procedure-manager/document-forms?*', route => catalogReply(route, { status: 503, json: { title: 'Không thể lấy danh sách biểu mẫu.' } }));
  const requests: URLSearchParams[] = [];
  await page.route('**/api/v1/form-templates?*', route => {
    if (route.request().method() === 'OPTIONS') return catalogReply(route, { status: 204 });
    expect(route.request().headers().authorization).toBe('Bearer ui-test-token');
    const params = new URL(route.request().url()).searchParams;
    requests.push(params);
    const second = { ...original, id: '07000000-0000-0000-0000-000000000006', code: 'DON_02', title: 'Đơn thứ hai' };
    const missing = { ...original, id: '07000000-0000-0000-0000-000000000007', code: 'CHUA-TEP', title: 'Mẫu chưa có tệp', fileDocxUrl: null };
    return catalogReply(route, { json: { items: params.get('searchCode') ? [second] : params.get('page') === '2' ? [second] : [original, missing], page: Number(params.get('page')), pageSize: 10, totalCount: params.get('searchCode') ? 1 : 11, totalPages: params.get('searchCode') ? 1 : 2 } });
  });
  await page.goto('/procedure-manager');
  await page.getByRole('button', { name: 'Thêm thủ tục', exact: true }).click();
  const editor = page.getByRole('dialog');
  await editor.getByRole('button', { name: /5 Biểu mẫu/ }).click();
  await expect(editor.getByRole('button', { name: 'CHUA-TEP · Mẫu chưa có tệp', exact: true })).toBeDisabled();
  await editor.getByRole('button', { name: 'BM-01 · Tờ khai kiểm thử', exact: true }).click();
  await editor.getByRole('navigation', { name: 'Phân trang kho biểu mẫu' }).getByRole('button', { name: 'Sau', exact: true }).click();
  await editor.getByRole('button', { name: 'DON_02 · Đơn thứ hai', exact: true }).click();
  await expect(editor.getByText('(2 đã gắn)', { exact: true })).toBeVisible();
  await editor.getByLabel('Tìm biểu mẫu theo mã').fill('DON_02');
  await expect.poll(() => requests.at(-1)?.get('searchCode')).toBe('DON_02');
  expect(requests.at(-1)?.get('page')).toBe('1');
  expect(requests.at(-1)?.get('isActive')).toBe('true');
  await expect(editor.getByText('(2 đã gắn)', { exact: true })).toBeVisible();
  await editor.getByLabel('Tìm biểu mẫu theo mã').scrollIntoViewIfNeeded();
  await editor.locator('.overflow-y-auto').first().evaluate(element => { element.scrollTop = 0; });
  await page.screenshot({ path: 'test-results/warehouse-picker-search.png', fullPage: true });
});

test('view opens actual DOCX preview with a table, isolated styles and no external document viewer', async ({ page }) => {
  await openWarehouse(page);
  await expect(page.getByRole('button', { name: 'Upload biểu mẫu', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Xem mẫu Tờ khai kiểm thử', exact: true }).click();
  const preview = page.frameLocator('iframe[title="Nội dung biểu mẫu Word"]');
  await expect(preview.getByText('ĐƠN ĐỀ NGHỊ KIỂM THỬ', { exact: true })).toBeVisible();
  await expect(preview.getByRole('table')).toContainText('Giấy tờ kèm theo');
  await expect(page.getByRole('button', { name: 'Phóng to', exact: true })).toBeEnabled();
  await expect(preview.getByText('Liên kết trong mẫu')).not.toHaveAttribute('href');
  await expect(page.getByTitle('Nội dung biểu mẫu Word')).toHaveAttribute('sandbox', 'allow-same-origin');
  await page.screenshot({ path: 'test-results/form-docx-preview-desktop.png' });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(preview.getByText('ĐƠN ĐỀ NGHỊ KIỂM THỬ', { exact: true })).toBeVisible();
  await expect.poll(() => page.getByTitle('Nội dung biểu mẫu Word').evaluate(element => {
    const iframe = element as HTMLIFrameElement;
    const paper = iframe.contentDocument?.querySelector('section.docx')?.getBoundingClientRect();
    return Boolean(paper && paper.left >= -1 && paper.right <= iframe.clientWidth + 1);
  })).toBe(true);
  await page.screenshot({ path: 'test-results/form-docx-preview-mobile.png' });
  const paperWidth = () => page.getByTitle('Nội dung biểu mẫu Word').evaluate(element => (element as HTMLIFrameElement).contentDocument!.querySelector('section.docx')!.getBoundingClientRect().width);
  const fitted = await paperWidth();
  await page.getByRole('button', { name: 'Thu nhỏ', exact: true }).click();
  await expect.poll(paperWidth).toBeLessThan(fitted);
  const smaller = await paperWidth();
  await page.getByRole('button', { name: 'Phóng to', exact: true }).click();
  await expect.poll(paperWidth).toBeGreaterThan(smaller);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('invalid DOCX shows an honest preview failure and retains the download action', async ({ page }) => {
  const state = await openWarehouse(page);
  state.badDocx = true;
  await page.getByRole('button', { name: 'Xem mẫu Tờ khai kiểm thử', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('alert')).toContainText('Không thể xem trước tệp Word');
  await expect(dialog.getByRole('button', { name: 'Tải mẫu Word', exact: true })).toBeEnabled();
});

test('save validation rejects missing or invalid business values without inventing defaults', async ({ page }) => {
  await openWarehouse(page);
  const result = await page.evaluate(async payload => {
    const path = '/src/lib/procedureValidation.ts';
    const { validateProcedure, getProcedureIssues } = await import(path);
    const invalid: string[][] = [];
    for (const quantity of [null, 0, -1, 1.5]) {
      const value = structuredClone(payload);
      Object.assign(value.formDefinitions![0], { quantity });
      invalid.push(getProcedureIssues(value).map((issue: { path: string }) => issue.path));
    }
    for (const patch of [{ feeAmount: null }, { estimatedDays: null }, { feeAmount: -1 }, { estimatedDays: -1 }]) {
      const value = structuredClone(payload);
      Object.assign(value.contentPayload.submissionMethods[0], patch);
      invalid.push(getProcedureIssues(value).map((issue: { path: string }) => issue.path));
    }
    const missing = structuredClone(payload);
    missing.formDefinitions![0].formCode = '  ';
    missing.formDefinitions![0].formName = '';
    missing.levelOfImplementation = '   ';
    const duplicate = structuredClone(payload);
    duplicate.contentPayload.cases[1].caseCode = 'A';
    const valid = structuredClone(payload);
    valid.contentPayload.submissionMethods[0].estimatedDays = 0.5;
    valid.formDefinitions![0].formType = 'ONLINE_INTERACTIVE';
    const before = JSON.stringify(valid);
    const saved = validateProcedure(valid);
    return { invalid, missing: getProcedureIssues(missing), duplicate: getProcedureIssues(duplicate), saved, unchanged: before === JSON.stringify(valid) };
  }, sampleProcedure);
  expect(result.invalid.slice(0, 4).every(paths => paths.includes('formDefinitions.0.quantity'))).toBe(true);
  expect(result.invalid.slice(4).every(paths => paths.some(path => /feeAmount|estimatedDays/.test(path)))).toBe(true);
  expect(result.missing.map((issue: { path: string }) => issue.path)).toEqual(expect.arrayContaining(['formDefinitions.0.formCode', 'formDefinitions.0.formName', 'levelOfImplementation']));
  expect(result.duplicate.map((issue: { path: string }) => issue.path)).toContain('contentPayload.cases.1.caseCode');
  expect(result.saved.contentPayload.submissionMethods[0]).toMatchObject({ feeAmount: 0, estimatedDays: 0.5 });
  expect(result.saved.formDefinitions[0].formType).toBe('ONLINE_INTERACTIVE');
  expect(result.unchanged).toBe(true);
});

async function openLinkedEditor(page: Page) {
  await mockWorkspaceAuth(page, ['PROCEDURE_MANAGER']);
  const catalog = await mockCatalog(page);
  catalog.detail.formDefinitions = [{ formTemplateId, formCode: 'BM-01', formName: original.title, formType: 'DOCX_TEMPLATE', quantity: 2, caseCode: 'A', isMandatory: false }];
  await mockForms(page);
  await page.goto('/procedure-manager');
  await page.getByRole('button', { name: 'Danh sách thủ tục', exact: true }).click();
  await page.getByRole('button', { name: 'Chi tiết', exact: true }).first().click();
  await page.getByRole('button', { name: 'Chỉnh sửa', exact: true }).click();
  const editor = page.getByRole('dialog', { name: 'Chỉnh sửa thủ tục', exact: true });
  await editor.getByRole('button', { name: /5 Biểu mẫu/ }).click();
  return { catalog, editor };
}

test('selected catalog action is safe and reselecting restores quantity, case and requirement', async ({ page }) => {
  const { editor } = await openLinkedEditor(page);
  await expect(editor.getByRole('button', { name: 'BM-01 · Tờ khai kiểm thử', exact: true })).toBeDisabled();
  await editor.getByRole('button', { name: 'Bỏ mẫu Tờ khai kiểm thử', exact: true }).click();
  await editor.getByRole('button', { name: /1 Thông tin chung/ }).click();
  await editor.getByRole('button', { name: /5 Biểu mẫu/ }).click();
  await editor.getByRole('button', { name: 'BM-01 · Tờ khai kiểm thử', exact: true }).click();
  const selected = editor.getByRole('region', { name: 'Biểu mẫu đã gắn', exact: true });
  await selected.getByText('Thiết lập sử dụng mẫu', { exact: true }).click();
  await expect(selected.getByLabel('Số lượng', { exact: true })).toHaveValue('2');
  await expect(selected.getByLabel('Trường hợp áp dụng', { exact: true })).toHaveValue('A');
  await expect(selected.getByLabel('Yêu cầu', { exact: true })).toHaveValue('optional');
  await expect(selected.getByRole('combobox')).toHaveCount(2);
});

test('invalid quantity switches to forms, opens settings and focuses the offending input', async ({ page }) => {
  const { catalog, editor } = await openLinkedEditor(page);
  await editor.getByText('Thiết lập sử dụng mẫu', { exact: true }).click();
  await editor.getByLabel('Số lượng', { exact: true }).fill('1.5');
  await editor.getByLabel('Ngày hiệu lực của thay đổi').fill('2026-10-14');
  await editor.getByRole('button', { name: /1 Thông tin chung/ }).click();
  await editor.getByRole('button', { name: 'Lưu thay đổi', exact: true }).click();
  await expect(editor.getByLabel('Số lượng', { exact: true })).toBeFocused();
  await expect(editor.getByLabel('Số lượng', { exact: true })).toHaveAttribute('aria-invalid', 'true');
  expect(catalog.requests.filter(request => request.method === 'PUT')).toHaveLength(0);
  await editor.getByLabel('Số lượng', { exact: true }).fill('3');
  await editor.getByRole('button', { name: 'Lưu thay đổi', exact: true }).click();
  await expect(editor).toHaveCount(0);
  expect(catalog.requests.find(request => request.method === 'PUT')?.body?.formDefinitions).toEqual(expect.arrayContaining([expect.objectContaining({ quantity: 3, caseCode: 'A', isMandatory: false })]));
});

test('renaming a referenced case prevents save and requires choosing an existing case', async ({ page }) => {
  const { catalog, editor } = await openLinkedEditor(page);
  await editor.getByRole('button', { name: /3 Quy trình/ }).click();
  await editor.getByLabel('Mã trường hợp', { exact: true }).first().fill('A-NEW');
  await editor.getByLabel('Ngày hiệu lực của thay đổi').fill('2026-10-14');
  await editor.getByRole('button', { name: 'Lưu thay đổi', exact: true }).click();
  await expect(editor.getByRole('button', { name: /2 Thành phần hồ sơ/ })).toHaveAttribute('aria-pressed', 'true');
  await expect(editor.getByLabel('Mã trường hợp (trống = áp dụng chung)').nth(1)).toBeFocused();
  await editor.getByLabel('Mã trường hợp (trống = áp dụng chung)').nth(1).selectOption('A-NEW');
  await editor.getByRole('button', { name: /5 Biểu mẫu/ }).click();
  await editor.getByText('Thiết lập sử dụng mẫu', { exact: true }).click();
  await expect(editor.getByLabel('Trường hợp áp dụng', { exact: true })).toHaveAttribute('aria-invalid', 'true');
  await editor.getByLabel('Trường hợp áp dụng', { exact: true }).selectOption('A-NEW');
  await editor.getByRole('button', { name: 'Lưu thay đổi', exact: true }).click();
  await expect(editor).toHaveCount(0);
  expect(catalog.requests.find(request => request.method === 'PUT')?.body?.formDefinitions).toEqual(expect.arrayContaining([expect.objectContaining({ caseCode: 'A-NEW' })]));
});

test('escape requires an explicit choice before discarding an edited procedure', async ({ page }) => {
  const { editor } = await openLinkedEditor(page);
  await editor.getByText('Thiết lập sử dụng mẫu', { exact: true }).click();
  await editor.getByLabel('Số lượng', { exact: true }).fill('4');
  await page.keyboard.press('Escape');
  const confirm = page.getByRole('dialog', { name: 'Bỏ thay đổi chưa lưu?', exact: true });
  await expect(confirm).toBeVisible();
  await confirm.getByRole('button', { name: 'Tiếp tục chỉnh sửa', exact: true }).click();
  await expect(editor.getByLabel('Số lượng', { exact: true })).toHaveValue('4');
  await page.keyboard.press('Escape');
  await confirm.getByRole('button', { name: 'Bỏ thay đổi', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('button', { name: 'Chỉnh sửa', exact: true }).click();
  await editor.getByRole('button', { name: /5 Biểu mẫu/ }).click();
  await editor.getByText('Thiết lập sử dụng mẫu', { exact: true }).click();
  await expect(editor.getByLabel('Số lượng', { exact: true })).toHaveValue('2');
});

test('saving locks the procedure inputs and prevents closing or duplicate writes', async ({ page }) => {
  const { editor } = await openLinkedEditor(page);
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  let writes = 0;
  await page.route(`**/api/v1/procedure-manager/procedures/${procedureId}`, async route => {
    if (route.request().method() !== 'PUT') return route.fallback();
    writes++;
    await gate;
    return catalogReply(route, { json: { ...sampleProcedure, ...route.request().postDataJSON() } });
  });
  await editor.getByLabel('Ngày hiệu lực của thay đổi').fill('2026-10-14');
  await editor.getByRole('button', { name: 'Lưu thay đổi', exact: true }).click();
  await expect.poll(() => writes).toBe(1);
  await expect(editor.getByLabel('Ngày hiệu lực của thay đổi')).toBeDisabled();
  await expect(editor.getByRole('button', { name: 'Bỏ mẫu Tờ khai kiểm thử', exact: true })).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(editor).toBeVisible();
  await editor.getByRole('button', { name: 'Đóng hộp thoại', exact: true }).click();
  await expect(editor).toBeVisible();
  release();
  await expect(editor).toHaveCount(0);
  expect(writes).toBe(1);
});

test('new procedure shows Vietnamese field errors and asks before discarding entered data', async ({ page }) => {
  await mockWorkspaceAuth(page, ['PROCEDURE_MANAGER']);
  const catalog = await mockCatalog(page);
  await page.goto('/procedure-manager');
  await page.getByRole('button', { name: 'Thêm thủ tục', exact: true }).click();
  const editor = page.getByRole('dialog', { name: 'Thêm thủ tục', exact: true });
  await editor.getByRole('checkbox').check();
  await editor.getByRole('button', { name: 'Tạo thủ tục', exact: true }).click();
  await expect(editor.getByLabel('Mã thủ tục', { exact: true })).toBeFocused();
  await expect(editor.getByLabel('Mã thủ tục', { exact: true })).toHaveAttribute('aria-invalid', 'true');
  expect(catalog.requests.some(request => request.method === 'POST')).toBe(false);
  await editor.getByLabel('Mã thủ tục', { exact: true }).fill('NEW-01');
  await editor.getByRole('button', { name: 'Đóng hộp thoại', exact: true }).click();
  const confirm = page.getByRole('dialog', { name: 'Bỏ thay đổi chưa lưu?', exact: true });
  await expect(confirm).toBeVisible();
  await confirm.getByRole('button', { name: 'Tiếp tục chỉnh sửa', exact: true }).click();
  await expect(editor.getByLabel('Mã thủ tục', { exact: true })).toHaveValue('NEW-01');
});
