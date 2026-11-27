import { test, expect } from '@playwright/test';
import { mockWorkspaceAuth } from './fixtures/auth';
import { mockCatalog, catalogReply, procedureId, draftId, savedRevision, sampleProcedure } from './fixtures/procedures';
import { contentFromApi } from '../src/lib/procedureContent';

test('mapping API preserves methods, common checklist, cases and literal legal text', () => {
  const result = contentFromApi(sampleProcedure);
  expect(result.methods[0]).toMatchObject({ method: 'Trực tiếp', processingTime: '1 ngày làm việc', notes: 'Áp dụng theo điều kiện nguồn' });
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
  // WF-CASE-01: giấy tờ chung (xuất trình) luôn hiện; giấy tờ từng trường hợp nằm trong accordion riêng, không gộp checklist
  await expect(page.getByText('Giấy tờ xuất trình', { exact: true })).toBeVisible();
  await expect(page.getByText('Giấy tờ dùng chung', { exact: true })).toBeVisible();
  await expect(page.getByText('Giấy chứng sinh', { exact: true })).toBeHidden();
  const cases = page.locator('section', { has: page.getByRole('heading', { name: 'Thành phần hồ sơ', exact: true }) }).locator('details');
  await expect(cases).toHaveCount(2);
  // E2: bước riêng của trường hợp cũng là accordion (không còn tab)
  await expect(page.locator('summary', { hasText: 'Bước riêng: Trường hợp A' })).toBeVisible();
  await cases.filter({ hasText: 'Trường hợp A' }).locator('summary').click();
  await expect(page.getByText('Giấy chứng sinh', { exact: true })).toBeVisible();
  await expect(page.getByText('Giấy tờ trường hợp B', { exact: true })).toBeHidden();
  await cases.filter({ hasText: 'Trường hợp B' }).locator('summary').click();
  // Xem được mọi trường hợp cùng lúc trước khi tạo hồ sơ
  await expect(page.getByText('Giấy tờ trường hợp B', { exact: true })).toBeVisible();
  await expect(page.getByText('Giấy chứng sinh', { exact: true })).toBeVisible();
  await expect(cases.filter({ hasText: 'Trường hợp B' }).getByRole('link', { name: 'Chuẩn bị hồ sơ cho trường hợp này' })).toHaveAttribute('href', /caseCode=B/);
  await expect(page.locator('#thanh-phan-ho-so input[type=checkbox]')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Tải mẫu', exact: true })).toHaveCount(0);
  await expect(page.locator('#can-cu-phap-luat script')).toHaveCount(0);
  await expect(page.getByTitle('PDF nguồn thủ tục')).toHaveCount(0);
  await page.getByRole('button', { name: 'Xem trước tệp', exact: true }).click();
  await expect(page.getByTitle('PDF nguồn thủ tục')).toHaveAttribute('src', 'https://example.test/source.pdf');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
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
  await expect(page.getByRole('heading', { name: 'Bản nháp gần đây' })).toBeVisible();
  await expect(page.locator('[role="table"][aria-labelledby="recent-drafts-title"] [role="row"][aria-hidden="true"]').first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Mở bản nháp' }).first()).toBeVisible();
  await expect(page.locator('[role="table"][aria-labelledby="recent-drafts-title"] [role="row"][aria-hidden="true"]')).toHaveCount(0);
});

test('PDF upload and mixed draft rows stay aligned from desktop to mobile', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await mockWorkspaceAuth(page, ['PROCEDURE_MANAGER']);
  const state = await mockCatalog(page);
  state.detail.isActive = false;
  await page.route('**/api/v1/procedure-manager/drafts?*', route => {
    if (route.request().method() === 'OPTIONS') return catalogReply(route, { status: 204 });
    const timestamps = { createdAt: state.detail.createdAt, updatedAt: state.detail.updatedAt, revision: savedRevision };
    return catalogReply(route, { json: [
      { id: draftId, status: 'NeedsReview', pdfFileName: `${'thu-tuc-'.repeat(18)}.pdf`, ...timestamps },
      { id: procedureId, status: 'Published', pdfFileName: 'da-xuat-ban.pdf', ...timestamps, publishedProcedureId: procedureId },
      { id: savedRevision, status: 'Failed', pdfFileName: 'doc-that-bai.pdf', ...timestamps },
    ] });
  });

  await page.goto('/procedure-manager?section=drafts');
  const upload = page.getByRole('region', { name: 'Xử lý tệp PDF' });
  const list = page.getByRole('region', { name: 'Bản nháp gần đây' });
  const draftMode = upload.getByRole('radio', { name: 'Tạo bản nháp có PDF gốc' });
  const previewMode = upload.getByRole('radio', { name: 'Xem và nhận diện nội dung' });
  const fileInput = upload.getByLabel('PDF mô tả thủ tục (tối đa 20 MB)');

  await expect(draftMode).toBeChecked();
  await draftMode.focus();
  await draftMode.press('ArrowDown');
  await expect(previewMode).toBeChecked();
  await expect(upload.getByRole('button', { name: 'Xem và nhận diện PDF' })).toBeDisabled();
  await fileInput.setInputFiles({ name: `${'quyet-dinh-'.repeat(16)}.pdf`, mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4 test') });
  await expect(upload.getByRole('button', { name: 'Xem và nhận diện PDF' })).toBeEnabled();
  await draftMode.check();

  const unpublish = list.getByRole('button', { name: 'Hủy xuất bản' });
  await expect(unpublish).toBeVisible();
  const openButtons = list.getByRole('button', { name: 'Mở bản nháp' });
  const deleteButtons = list.getByRole('button', { name: /^Xóa bản nháp / });
  await expect(openButtons).toHaveCount(3);
  await expect(deleteButtons).toHaveCount(3);

  for (const width of [1805, 1024, 390, 320]) {
    await page.setViewportSize({ width, height: 954 });
    const uploadBox = (await upload.boundingBox())!;
    const listBox = (await list.boundingBox())!;
    expect(uploadBox.x).toBeCloseTo(listBox.x);
    expect(uploadBox.width).toBeCloseTo(listBox.width);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    const openBoxes = await Promise.all((await openButtons.all()).map(button => button.boundingBox()));
    const deleteBoxes = await Promise.all((await deleteButtons.all()).map(button => button.boundingBox()));
    const unpublishBox = (await unpublish.boundingBox())!;

    for (const [index, box] of openBoxes.entries()) {
      expect(box!.x).toBeCloseTo(openBoxes[0]!.x);
      expect(deleteBoxes[index]!.x, `Delete column at ${width}px`).toBeCloseTo(deleteBoxes[0]!.x);
      expect(deleteBoxes[index]!.x + deleteBoxes[index]!.width).toBeLessThan(listBox.x + listBox.width);
    }
    expect(openBoxes[1]!.x + openBoxes[1]!.width).toBeLessThan(unpublishBox.x);
    expect(unpublishBox.x + unpublishBox.width).toBeLessThan(deleteBoxes[1]!.x);

    const modeBox = (await draftMode.locator('..').boundingBox())!;
    const dropBox = (await fileInput.locator('..').boundingBox())!;
    if (width >= 1024) {
      expect(modeBox.y).toBeCloseTo(dropBox.y);
      expect(modeBox.x + modeBox.width).toBeLessThan(dropBox.x);
      const actionHeader = (await list.getByRole('columnheader', { name: 'Thao tác' }).boundingBox())!;
      expect(openBoxes[0]!.x, `Action header at ${width}px`).toBeCloseTo(actionHeader.x);
    } else {
      expect(modeBox.x).toBeCloseTo(dropBox.x);
      expect(modeBox.y + modeBox.height).toBeLessThan(dropBox.y);
      const publishedRow = list.getByRole('row').filter({ has: page.getByRole('button', { name: 'Hủy xuất bản' }) });
      await expect(publishedRow.getByRole('cell')).toHaveCount(3);
      const [fileCell, statusCell, actionCell] = await Promise.all((await publishedRow.getByRole('cell').all()).map(cell => cell.boundingBox()));
      expect(fileCell!.y + fileCell!.height).toBeLessThan(statusCell!.y);
      expect(statusCell!.y + statusCell!.height).toBeLessThan(actionCell!.y);
    }
  }

  await unpublish.click();
  await expect(page.getByRole('dialog', { name: 'Hủy xuất bản thủ tục' })).toBeVisible();
});

test('manager deletes an unused draft through administration API', async ({ page }) => {
  await mockWorkspaceAuth(page, ['PROCEDURE_MANAGER']); const state = await mockCatalog(page);
  await page.goto('/procedure-manager?section=drafts');
  await expect(page.getByRole('button', { name: 'Làm mới danh sách' })).toHaveCount(0);
  await page.getByRole('button', { name: /^Xóa bản nháp / }).first().click();
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
  await mockWorkspaceAuth(page, ['PROCEDURE_MANAGER']); await mockCatalog(page);
  let formRead = false;
  await page.route('**/api/v1/procedure-manager/document-forms*', route => {
    if (route.request().method() === 'OPTIONS') return catalogReply(route, { status: 204 });
    formRead = true;
    expect(route.request().headers().authorization).toBe('Bearer ui-test-token');
    return catalogReply(route, {
      json: [{
        id: '07000000-0000-0000-0000-000000000005',
        formCode: 'BM-01',
        formName: 'Tờ khai điện tử',
        formType: 'DOCX_TEMPLATE'
      }]
    });
  });
  await page.goto('/procedure-manager?section=procedures');
  await page.getByRole('button', { name: 'Thêm thủ tục', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: /Biểu mẫu/ }).click();
  // Bước Biểu mẫu chọn mẫu qua hộp thoại "Chọn biểu mẫu từ kho" (FormLibraryModal), không nhập mã tay.
  await page.getByRole('button', { name: 'Chọn từ kho' }).click();
  const library = page.getByRole('dialog', { name: 'Chọn biểu mẫu từ kho' });
  await library.getByRole('checkbox', { name: /BM-01/ }).check();
  await library.getByRole('button', { name: 'Thêm 1 mẫu', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Biểu mẫu đã gắn' }).getByText('Tờ khai điện tử', { exact: true })).toBeVisible();
  expect(formRead).toBe(true);
});

test('manager create sends full reviewed form without invented defaults', async ({ page }) => {
  await mockWorkspaceAuth(page, ['PROCEDURE_MANAGER']); const state = await mockCatalog(page);
  await page.goto('/procedure-manager?section=procedures'); await page.getByRole('button', { name: 'Thêm thủ tục', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByLabel('Mã thủ tục', { exact: true })).toHaveValue('');
  for (const [label, value] of [['Mã thủ tục', 'TEST-NEW'], ['Tên thủ tục', 'Thủ tục mới từ API'], ['Cấp thực hiện', 'Cấp Xã'], ['Đối tượng thực hiện', 'Công dân'], ['Tóm tắt lệ phí', 'Theo quy định'], ['Tóm tắt thời hạn', 'Theo quy định']]) await dialog.getByLabel(label, { exact: true }).fill(value);
  await dialog.getByLabel('Danh mục', { exact: true }).selectOption('1');
  await dialog.getByRole('checkbox').check();
  await dialog.getByRole('button', { name: 'Tạo và công khai' }).click();
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
  await page.getByRole('checkbox', { name: /Tôi đã đối soát kỹ thông tin/ }).check();
  await page.getByRole('button', { name: 'Xác nhận xuất bản' }).click();
  await expect(page.getByRole('row').filter({ hasText: 'khai-sinh.pdf' })).toContainText('Đã xuất bản');
  const calls = state.requests.filter(r => r.path.includes('/drafts/') && ['PUT', 'POST'].includes(r.method));
  expect(calls.map(r => r.method)).toEqual(['PUT', 'POST']);
  expect(calls[1].body).toEqual({ revision: savedRevision, confirmed: true });
  await page.reload();
  await expect(page.getByRole('row').filter({ hasText: 'khai-sinh.pdf' })).toContainText('Đã xuất bản');
  await expect(page.getByRole('button', { name: 'Xác nhận xuất bản' })).toHaveCount(0);
});

test('draft publish explains missing required fields in Vietnamese and does not save', async ({ page }) => {
  await mockWorkspaceAuth(page, ['PROCEDURE_MANAGER']); const state = await mockCatalog(page);
  await page.goto(`/procedure-manager?draft=${draftId}`);
  await page.getByLabel('Mã thủ tục', { exact: true }).fill('');
  await page.getByRole('checkbox', { name: /Tôi đã đối soát kỹ thông tin/ }).check();
  await page.getByRole('button', { name: 'Xác nhận xuất bản' }).click();
  await expect(page.getByRole('alert')).toContainText('Mã thủ tục');
  await expect(page.getByRole('alert')).not.toContainText('procedureCode');
  expect(state.requests.some(r => r.method === 'PUT' && r.path.includes('/drafts/'))).toBe(false);
});

test('draft conflict preserves unsaved input and never publishes', async ({ page }) => {
  await mockWorkspaceAuth(page, ['PROCEDURE_MANAGER']); const state = await mockCatalog(page); state.conflict = true;
  await page.goto(`/procedure-manager?draft=${draftId}`);
  await page.getByLabel('Tên thủ tục', { exact: true }).fill('Nội dung chưa lưu cần giữ');
  await page.getByRole('checkbox', { name: /Tôi đã đối soát kỹ thông tin/ }).check();
  await page.getByRole('button', { name: 'Xác nhận xuất bản' }).click();
  await expect(page.getByRole('alert')).toContainText('Bản nháp đã thay đổi');
  await expect(page.getByLabel('Tên thủ tục', { exact: true })).toHaveValue('Nội dung chưa lưu cần giữ');
  expect(state.requests.some(r => r.path.endsWith('/publish'))).toBe(false);
});

test('publish response lost is reconciled with GET draft, not repeated', async ({ page }) => {
  await mockWorkspaceAuth(page, ['PROCEDURE_MANAGER']); const state = await mockCatalog(page); state.failPublishResponse = true;
  await page.goto(`/procedure-manager?draft=${draftId}`);
  await page.getByRole('checkbox', { name: /Tôi đã đối soát kỹ thông tin/ }).check();
  await page.getByRole('button', { name: 'Xác nhận xuất bản' }).click();
  await expect.poll(() => state.draftStatus).toBe('Published');
  await expect(page).not.toHaveURL(new RegExp(`draft=${draftId}`));
  await page.goto(`/procedure-manager?draft=${draftId}`);
  await expect(page.getByRole('button', { name: 'Xác nhận xuất bản' })).toHaveCount(0);
  await expect(page.getByText('Đã xuất bản', { exact: true })).toBeVisible();
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
  await page.getByTitle('Quay lại danh sách bản nháp', { exact: true }).click();
  await expect(page.getByText('Nội dung đọc thử từ PDF')).toHaveCount(0);
  state.draftStatus = 'Failed'; await page.goto(`/procedure-manager?draft=${draftId}`);
  await page.getByRole('button', { name: 'Thử đọc lại PDF' }).click();
  await expect.poll(() => state.requests.some(r => r.path.endsWith('/retry'))).toBe(true);
});

test('preview publishes reviewed payload without uploading the source PDF', async ({ page }) => {
  await mockWorkspaceAuth(page, ['PROCEDURE_MANAGER']); const state = await mockCatalog(page);
  await page.goto('/procedure-manager?section=drafts');
  await page.getByRole('radio', { name: /Xem và nhận diện nội dung/ }).click();
  await page.getByLabel('PDF mô tả thủ tục (tối đa 20 MB)').setInputFiles({ name: 'khai-sinh.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4 test') });
  await page.getByRole('button', { name: 'Xem và nhận diện PDF' }).click();
  await page.getByRole('checkbox', { name: /Tôi đã kiểm tra nội dung/ }).check();
  await page.getByRole('button', { name: 'Xuất bản thủ tục' }).click();
  await expect(page.getByText('Kết quả nhận diện')).toHaveCount(0);
  const calls = state.requests.filter(r => r.method === 'POST');
  expect(calls.map(r => r.path)).toEqual(['/api/v1/procedure-manager/drafts/extract-preview', '/api/v1/procedure-manager/procedures/publish']);
});

test('403 is shown without fake data or redirect and unsupported navigation is hidden', async ({ page }) => {
  await mockWorkspaceAuth(page, ['PROCEDURE_MANAGER']); await mockCatalog(page);
  await page.route('**/api/v1/procedure-manager/procedures?*', route => route.request().method() === 'OPTIONS' ? catalogReply(route, { status: 204 }) : catalogReply(route, { status: 403, json: { title: 'Bạn không có quyền quản lý thủ tục.' } }));
  await page.goto('/procedure-manager');
  await expect(page.getByRole('alert').first()).toContainText('không có quyền');
  await expect(page).toHaveURL(/procedure-manager/);
  await expect(page.locator('aside').getByRole('button', { name: 'Văn bản pháp lý', exact: true })).toHaveCount(0);
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
  await page.setViewportSize({ width: 390, height: 844 }); await page.goto('/procedure-manager?section=procedures');
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

test('dashboard retains actual metrics and recent procedures without empty placeholder sections', async ({ page }) => {
  await mockWorkspaceAuth(page, ['PROCEDURE_MANAGER']);
  const state = await mockCatalog(page);
  await page.goto('/procedure-manager');
  // Nút chính "Thêm thủ tục" ở tiêu đề trang; không còn khối lối tắt trùng menu.
  await expect(page.getByRole('button', { name: 'Thêm thủ tục', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Lối tắt' })).toHaveCount(0);
  // 5 chỉ số: tổng, công khai, ẩn, lĩnh vực, bản nháp chờ đối soát (fixture có 1 bản NeedsReview).
  const kpis = page.getByRole('region', { name: 'Các chỉ số tổng quan' });
  await expect(kpis.getByRole('button')).toHaveCount(5);
  await expect(kpis.getByRole('button', { name: 'Xem bản nháp chờ đối soát: 1' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Hạng mục cần chú ý hoàn thiện' })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Biểu mẫu cập nhật gần đây' })).toHaveCount(0);
  await expect(page.getByRole('table')).toHaveCount(0);
  await expect.poll(() => state.requests.some(r => r.query.get('sortBy') === 'UpdatedAt' && r.query.get('isAscending') === 'false')).toBe(true);
  await page.getByRole('button', { name: 'Danh sách thủ tục', exact: true }).click();
  await expect(page.getByRole('table')).toBeVisible();
});

test('WF-CASE-01: giấy tờ chung, trường hợp (accordion), đổi mã, xóa trường hợp và xem trước như công dân', async ({ page }) => {
  await mockWorkspaceAuth(page, ['PROCEDURE_MANAGER']); const state = await mockCatalog(page);
  await page.goto('/procedure-manager?section=procedures'); await page.getByRole('button', { name: 'Thêm thủ tục', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Mã thủ tục', { exact: true }).fill('TEST-CASES');
  await dialog.getByLabel('Tên thủ tục', { exact: true }).fill('Thủ tục nhiều trường hợp');
  await dialog.getByLabel('Danh mục', { exact: true }).selectOption('1');
  await dialog.getByRole('button', { name: /Thành phần hồ sơ/ }).first().click();

  await dialog.getByRole('button', { name: 'Thêm giấy tờ chung' }).click();
  await dialog.getByLabel('Tên giấy tờ', { exact: true }).fill('Tờ khai chung');
  await dialog.getByRole('button', { name: 'Thêm trường hợp' }).click();
  await dialog.getByRole('button', { name: 'Thêm trường hợp' }).click();
  const caseOne = dialog.locator('details').filter({ hasText: /Mã TH-1/ });
  const caseTwo = dialog.locator('details').filter({ hasText: /Mã TH-2/ });
  await caseOne.getByLabel('Tên trường hợp', { exact: true }).fill('Đăng ký lần đầu');
  await caseTwo.getByLabel('Tên trường hợp', { exact: true }).fill('Đăng ký lại');
  await caseOne.getByRole('button', { name: 'Thêm giấy tờ cho trường hợp này' }).click();
  await caseOne.getByLabel('Tên giấy tờ', { exact: true }).fill('Giấy chứng sinh');
  await caseTwo.getByRole('button', { name: 'Thêm giấy tờ cho trường hợp này' }).click();
  await caseTwo.getByLabel('Tên giấy tờ', { exact: true }).fill('Đơn trình báo mất');
  await expect(caseOne.locator('summary').first()).toContainText('1 giấy tờ riêng');

  // Đổi mã khi rời ô: giấy tờ của trường hợp đi theo mã mới; mã trùng bị từ chối
  const code = caseOne.getByLabel('Mã trường hợp', { exact: true });
  await code.fill('TH-2'); await code.blur();
  await expect(caseOne.getByText('Mã “TH-2” đã dùng cho trường hợp khác.')).toBeVisible();
  await code.fill('LAN-DAU'); await code.blur();
  const caseFirst = dialog.locator('details').filter({ hasText: /Mã LAN-DAU/ });
  await expect(caseFirst.locator('summary').first()).toContainText('1 giấy tờ riêng');

  // Xem trước như công dân: giấy tờ chung + từng trường hợp riêng
  await dialog.getByRole('button', { name: 'Xem trước như công dân' }).click();
  const preview = page.getByRole('dialog', { name: 'Xem trước thành phần hồ sơ' });
  await expect(preview.getByText('Giấy tờ theo trường hợp (2)')).toBeVisible();
  await expect(preview.getByText('Khi tạo hồ sơ, công dân chọn 1 trong 2 trường hợp', { exact: false })).toBeVisible();
  await preview.getByRole('button', { name: 'Đóng hộp thoại' }).click();
  await expect(preview).toHaveCount(0);

  // Xóa trường hợp 2, chuyển giấy tờ của nó về giấy tờ chung
  await dialog.locator('details').filter({ hasText: /Mã TH-2/ }).getByRole('button', { name: 'Xóa trường hợp' }).click();
  const confirm = page.getByRole('dialog', { name: /Xóa trường hợp “Đăng ký lại”/ });
  await confirm.getByRole('radio', { name: /Chuyển 1 giấy tờ sang Giấy tờ chung/ }).check();
  await confirm.getByRole('button', { name: 'Xóa trường hợp' }).click();
  await expect(confirm).toHaveCount(0);

  // B3/B7: chuyển giấy tờ chung sang trường hợp → thông báo và giấy tờ nằm trong trường hợp đích
  const moving = dialog.locator('details', { hasText: 'Đơn trình báo mất' }).last();
  await moving.locator('summary').click();
  await moving.getByLabel('Áp dụng cho', { exact: true }).selectOption('LAN-DAU');
  await expect(page.getByText('Đã chuyển giấy tờ sang trường hợp “Đăng ký lần đầu”.')).toBeVisible();
  await expect(dialog.locator('details').filter({ hasText: /Mã LAN-DAU/ }).locator('summary').first()).toContainText('2 giấy tờ riêng');

  await dialog.getByRole('checkbox').check();
  await dialog.getByRole('button', { name: 'Tạo và công khai' }).click();
  await expect(dialog).toHaveCount(0);
  const body = state.requests.find(r => r.method === 'POST')?.body as { contentPayload: { cases: { caseCode: string; caseName: string }[] }; checklistSchema: { itemName: string; caseCode: string | null }[] };
  expect(body.contentPayload.cases.map(c => [c.caseCode, c.caseName])).toEqual([['LAN-DAU', 'Đăng ký lần đầu']]);
  expect(body.checklistSchema.map(x => [x.itemName, x.caseCode])).toEqual([['Tờ khai chung', null], ['Giấy chứng sinh', 'LAN-DAU'], ['Đơn trình báo mất', 'LAN-DAU']]);
});

test('WF-CASE-01: biểu mẫu chưa gắn giấy tờ không hiện thành dòng giấy tờ; Quản lý thủ tục gắn nhanh vào giấy tờ', async ({ page }) => {
  // Trang công khai: "Tờ khai từ API" (biểu mẫu không giấy tờ nào chọn) không còn hiện như một giấy tờ nộp chung
  await mockCatalog(page);
  await page.goto(`/thu-tuc/${procedureId}`);
  const docs = page.locator('section', { has: page.getByRole('heading', { name: 'Thành phần hồ sơ', exact: true }) });
  await expect(docs.getByText('Giấy tờ dùng chung', { exact: true })).toBeVisible();
  await expect(docs.getByText('Giấy tờ nộp chung', { exact: true })).toHaveCount(0);
  await expect(docs.locator('table').getByText('Tờ khai từ API')).toHaveCount(0);
  // Vẫn tải được để tham khảo, nhưng không phải dòng giấy tờ
  await expect(docs.getByText('Biểu mẫu khác để tham khảo', { exact: true })).toBeVisible();

  // Quản lý thủ tục: cảnh báo + gắn vào giấy tờ → cảnh báo biến mất, lưu gửi formCodes
  await mockWorkspaceAuth(page, ['PROCEDURE_MANAGER']); const state = await mockCatalog(page);
  await page.goto('/procedure-manager');
  await page.getByRole('button', { name: 'Danh sách thủ tục', exact: true }).click();
  await page.getByRole('button', { name: 'Chi tiết', exact: true }).first().click();
  await page.getByRole('button', { name: 'Chỉnh sửa', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: /Thành phần hồ sơ/ }).first().click();
  const fix = dialog.getByRole('region', { name: '1 biểu mẫu chưa gắn với giấy tờ nào' });
  await expect(fix).toBeVisible();
  await dialog.getByRole('button', { name: 'Xem trước như công dân' }).click();
  const preview = page.getByRole('dialog', { name: 'Xem trước thành phần hồ sơ' });
  await expect(preview.getByText('1 biểu mẫu chưa gắn với giấy tờ nào nên không hiển thị ở trên.')).toBeVisible();
  await preview.getByRole('button', { name: 'Đóng hộp thoại' }).click();
  await fix.getByLabel('Gắn vào giấy tờ').selectOption({ label: 'Trường hợp B · Giấy tờ trường hợp B' });
  await fix.getByRole('button', { name: 'Gắn 1 biểu mẫu' }).click();
  await expect(fix).toHaveCount(0);
  await expect(page.getByText('Đã gắn 1 biểu mẫu vào giấy tờ “Giấy tờ trường hợp B”.')).toBeVisible();
  expect(state.requests.filter(r => r.method === 'PUT')).toHaveLength(0);
});

test('xuất bản bản nháp thiếu số ngày/phí: chỉ rõ ô cần điền, không gửi lên BE; điền xong thì xuất bản được', async ({ page }) => {
  await mockWorkspaceAuth(page, ['PROCEDURE_MANAGER']); const state = await mockCatalog(page);
  // Như bản nháp AI thật: thời hạn chỉ có chữ, chưa có số ngày; phí chưa có số tiền
  state.detail.contentPayload.submissionMethods = [{ methodName: 'Trực tiếp', feeAmount: null, feeUnit: null, estimatedDays: null, processingTime: { value: null, unit: null, text: 'Theo quy định' } }];
  await page.goto(`/procedure-manager?draft=${draftId}`);
  await expect(page.getByRole('button', { name: 'Lưu bản nháp', exact: true })).toBeVisible({ timeout: 12000 });
  await page.getByRole('checkbox', { name: /Tôi đã đối soát kỹ thông tin/ }).check();
  await page.getByRole('button', { name: 'Xác nhận xuất bản' }).click();
  const summary = page.getByRole('alert').first();
  await expect(summary).toContainText('Cách nộp 1 (Trực tiếp) – Thời hạn giải quyết');
  await expect(summary).toContainText('Cách nộp 1 (Trực tiếp) – Phí, lệ phí');
  await expect(summary).not.toContainText('estimatedDays');
  await expect(summary).not.toContainText('submissionMethods');
  // Tự chuyển tới phần 4 và đánh dấu đúng ô
  await expect(page.getByRole('button', { name: /4 Thời hạn & lệ phí/ })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByText('Nhập số ngày ở ô “Số” và chọn đơn vị “Ngày” hoặc “Ngày làm việc”.').first()).toBeVisible();
  expect(state.requests.some(r => r.path.includes('/drafts/') && ['PUT', 'POST'].includes(r.method))).toBe(false);

  // Người dùng điền số ngày và mức phí → danh sách lỗi tự bớt, xuất bản gửi đúng số đã nhập
  await page.getByLabel('Số', { exact: true }).fill('5');
  await page.getByLabel('Đơn vị', { exact: true }).selectOption('WORKING_DAY');
  await expect(page.getByText('Nhập số ngày ở ô “Số” và chọn đơn vị “Ngày” hoặc “Ngày làm việc”.')).toHaveCount(0);
  await page.getByRole('button', { name: 'Thêm mức phí', exact: true }).click();
  await page.getByLabel('Số tiền (0 = miễn phí)', { exact: true }).fill('0');
  await page.getByRole('checkbox', { name: /Tôi đã đối soát kỹ thông tin/ }).check();
  await page.getByRole('button', { name: 'Xác nhận xuất bản' }).click();
  await expect.poll(() => state.requests.some(r => r.method === 'POST' && r.path.endsWith('/publish'))).toBe(true);
  const saved = state.requests.find(r => r.method === 'PUT' && r.path.includes('/drafts/'))?.body as { payload: { contentPayload: { submissionMethods: Record<string, unknown>[] } } };
  expect(saved.payload.contentPayload.submissionMethods[0]).toEqual(expect.objectContaining({ estimatedDays: 5, feeAmount: 0, feeUnit: 'VND' }));
});
