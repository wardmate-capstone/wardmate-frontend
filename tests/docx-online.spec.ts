import { test, expect, type Page, type Route } from '@playwright/test';
import JSZip from 'jszip';
import { documentIds, mockDocumentWorkflow } from './fixtures/documentWorkflow';
import { createPreviewDocx } from './fixtures/formTemplateDocx';
import { authReply } from './fixtures/auth';

function uploadedDocx(route: Route) {
  const request = route.request();
  const body = request.postDataBuffer()!;
  const boundary = request.headers()['content-type'].split('boundary=')[1];
  const field = body.indexOf(Buffer.from('name="File"'));
  const start = body.indexOf(Buffer.from('\r\n\r\n'), field) + 4;
  const end = body.indexOf(Buffer.from(`\r\n--${boundary}`), start);
  expect(field).toBeGreaterThan(0);
  return body.subarray(start, end);
}
async function setup(page: Page, actor: 'citizen' | 'officer' = 'citizen') {
  const state = await mockDocumentWorkflow(page, actor, actor === 'citizen' ? 'DRAFT' : 'UNDER_REVIEW');
  if (actor === 'officer') state.submissionStatus = 'Submitted';
  let bytes = await createPreviewDocx();
  if (actor === 'officer') {
    const zip = await JSZip.loadAsync(bytes);
    const xml = await zip.file('word/document.xml')!.async('string');
    zip.file('word/document.xml', xml.replace('<w:r>', '<w:commentRangeStart w:id="1"/><w:r>').replace('</w:r>', '</w:r><w:commentRangeEnd w:id="1"/><w:r><w:commentReference w:id="1"/></w:r>'));
    zip.file('word/comments.xml', '<?xml version="1.0"?><w:comments xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:comment w:id="1" w:author="Can bo" w:date="2026-10-16T01:00:00Z"><w:p><w:r><w:t>GHI CHU WORD CAN GIU</w:t></w:r></w:p></w:comment></w:comments>');
    zip.file('[Content_Types].xml', (await zip.file('[Content_Types].xml')!.async('string')).replace('</Types>', '<Override PartName="/word/comments.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.comments+xml"/></Types>'));
    zip.file('word/_rels/document.xml.rels', (await zip.file('word/_rels/document.xml.rels')!.async('string')).replace('</Relationships>', '<Relationship Id="rIdComments" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/comments" Target="comments.xml"/></Relationships>'));
    bytes = await zip.generateAsync({ type: 'nodebuffer' });
  }
  const files: Buffer[] = [];
  let fail = false;
  await page.route('**/api/v1/form-templates/**/download-docx', route => authReply(route, { body: bytes, contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }));
  await page.route('**/api/v1/citizen/submissions/**', async route => {
    const path = new URL(route.request().url()).pathname;
    if (route.request().method() === 'GET') {
      if (path.endsWith('download-docx')) return authReply(route, { body: bytes, contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      return authReply(route, { json: { id: documentIds.submission, templateId: documentIds.template, applicationId: documentIds.application, checklistId: documentIds.checklist, applicantId: documentIds.citizen, fileName: 'to-khai.docx', fileSizeBytes: bytes.length, status: state.submissionStatus, createdAt: '2026-10-16T01:00:00Z' } });
    }
    if (path.endsWith('/draft')) {
      if (fail) return authReply(route, { status: 503, json: { code: 'document.blob_upload_failed', message: 'internal-storage-exception' } });
      bytes = uploadedDocx(route); files.push(bytes);
    }
    return route.fallback();
  });
  await page.route('**/api/v1/officer/submissions/**', async route => {
    if (route.request().url().endsWith('download-docx')) return authReply(route, { body: bytes, contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    if (route.request().url().endsWith('annotate-docx') && route.request().method() === 'PUT') { bytes = uploadedDocx(route); files.push(bytes); }
    return route.fallback();
  });
  if (actor === 'citizen') {
    await page.goto('/citizen?section=dossiers_all');
    await page.getByRole('button', { name: 'Chi tiết', exact: true }).click();
    await page.locator(`#checklist-${documentIds.checklist}`).getByRole('button', { name: 'Điền trực tuyến', exact: true }).click();
  } else {
    await page.goto('/officer');
    await page.getByRole('button', { name: 'Tất cả hồ sơ', exact: true }).click();
    await page.getByRole('button', { name: 'Tiếp tục', exact: true }).click();
    await page.getByRole('button', { name: 'Bản khai & giấy tờ', exact: true }).click();
    await page.getByRole('button', { name: 'Chỉnh sửa trực tuyến: to-khai.docx', exact: true }).click();
  }
  const editor = page.getByRole('dialog').filter({ has: page.getByRole('toolbar', { name: 'Định dạng văn bản' }) });
  await expect(editor.getByRole('button', { name: 'Lưu vào hồ sơ', exact: true })).toBeEnabled({ timeout: 30000 });
  return { state, editor, files, setFail: (value: boolean) => { fail = value; } };
}

test('editor loads real DOCX, saves edited bytes and reopens the same draft', async ({ page }) => {
  const { editor, files, state, setFail } = await setup(page);
  const content = editor.getByRole('textbox', { name: 'Nội dung tài liệu' });
  await content.click({ position: { x: 180, y: 150 } });
  await page.keyboard.press('Control+End');
  await editor.getByRole('button', { name: 'In nghiêng', exact: true }).click();
  await page.keyboard.type(' NOI DUNG TRUC TUYEN');
  await expect(editor.getByRole('status').filter({ hasText: 'Có thay đổi chưa lưu' })).toBeVisible();
  setFail(true);
  await editor.getByRole('button', { name: 'Lưu vào hồ sơ', exact: true }).click();
  await expect(editor.getByRole('alert')).toContainText('Kho lưu trữ');
  await expect(editor.getByRole('status').filter({ hasText: 'Có thay đổi chưa lưu' })).toBeVisible();
  setFail(false);
  await editor.getByRole('button', { name: 'Lưu vào hồ sơ', exact: true }).click();
  await expect(editor.getByRole('status').filter({ hasText: 'Đã lưu vào hồ sơ' })).toBeVisible();
  expect(files).toHaveLength(1);
  const zip = await JSZip.loadAsync(files[0]);
  const xml = await zip.file('word/document.xml')!.async('string');
  expect(xml).toContain('NOI DUNG TRUC TUYEN');
  expect(xml).toContain('Giấy tờ kèm theo');
  expect(xml).toContain('<w:tbl');
  expect(xml).toContain('<w:i');
  expect(state.writes.filter(x => /submissions\/.+\/submit$/.test(x.path))).toHaveLength(0);
  await editor.getByRole('button', { name: 'Đóng hộp thoại', exact: true }).click();
  await page.getByRole('button', { name: 'Chỉnh sửa trực tuyến', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Lưu vào hồ sơ', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: 'Lưu vào hồ sơ', exact: true }).click();
  await expect.poll(() => files.length).toBe(2);
  expect(state.writes.filter(x => x.path === '/api/v1/citizen/submissions/draft')).toHaveLength(1);
  expect(state.writes.filter(x => x.path.endsWith(`/${documentIds.submission}/draft`))).toHaveLength(1);
  await page.screenshot({ path: 'test-results/docx-online-desktop.png' });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole('button', { name: 'Lưu vào hồ sơ', exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/docx-online-mobile.png' });
});

test('officer online DOCX saves through annotate without deciding the dossier', async ({ page }) => {
  const { editor, files, state } = await setup(page, 'officer');
  await editor.getByRole('button', { name: 'Lưu vào hồ sơ', exact: true }).click();
  await expect(editor.getByRole('status').filter({ hasText: 'Đã lưu vào hồ sơ' })).toBeVisible();
  expect(files).toHaveLength(1);
  const zip = await JSZip.loadAsync(files[0]);
  expect(await zip.file('word/document.xml')!.async('string')).toContain('ĐƠN ĐỀ NGHỊ KIỂM THỬ');
  expect(await zip.file('word/comments.xml')!.async('string')).toContain('GHI CHU WORD CAN GIU');
  expect(await zip.file('word/document.xml')!.async('string')).toContain('commentRangeStart');
  expect(state.writes.filter(x => x.path.endsWith('/annotate-docx'))).toHaveLength(1);
  expect(state.writes.filter(x => /approve|confirm-readiness|request-revision/.test(x.path))).toHaveLength(0);
  expect(state.status).toBe('UNDER_REVIEW');
});

test('citizen submission list filters and paginates without linking legacy records to an invented dossier', async ({ page }) => {
  await mockDocumentWorkflow(page);
  const reads: URLSearchParams[] = [];
  await page.route('**/api/v1/citizen/submissions?*', route => {
    const query = new URL(route.request().url()).searchParams;
    reads.push(query);
    return authReply(route, { json: { items: [{ id: documentIds.submission, templateId: documentIds.template, applicantId: documentIds.citizen, applicationId: null, checklistId: null, fileName: 'ban-khai-cu.docx', fileSizeBytes: 1234, status: 'Draft', createdAt: '2026-10-16T01:00:00Z' }], page: Number(query.get('page')), pageSize: 20, totalCount: 21, totalPages: 2 } });
  });
  await page.goto('/citizen?section=submissions');
  await expect(page.getByRole('heading', { name: 'Bản khai của tôi', exact: true, level: 2 })).toBeVisible();
  await expect(page.getByText('Bản khai cũ chưa liên kết hồ sơ.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Mở hồ sơ liên quan', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Bản khai sau', exact: true }).click();
  await expect.poll(() => reads.at(-1)?.get('page')).toBe('2');
  await page.getByLabel('Trạng thái bản khai').selectOption('Draft');
  await expect.poll(() => reads.at(-1)?.get('status')).toBe('Draft');
  expect(reads.at(-1)?.get('page')).toBe('1');
  expect(reads.at(-1)?.get('applicantId')).toBe(documentIds.citizen);
});

test('submitted citizen dossier opens the online document for viewing without save controls', async ({ page }) => {
  const state = await mockDocumentWorkflow(page, 'citizen', 'SUBMITTED');
  state.submissionStatus = 'Submitted';
  await page.route(`**/api/v1/citizen/submissions/${documentIds.submission}?*`, route => authReply(route, { json: { id: documentIds.submission, templateId: documentIds.template, applicantId: documentIds.citizen, applicationId: documentIds.application, checklistId: documentIds.checklist, status: 'Submitted', fileName: 'to-khai.docx', fileSizeBytes: 1234, createdAt: '2026-10-16T01:00:00Z' } }));
  await page.goto('/citizen?section=dossiers_all');
  await page.getByRole('button', { name: 'Chi tiết', exact: true }).click();
  await page.getByRole('button', { name: 'Xem bản khai trực tuyến', exact: true }).click();
  const editor = page.getByRole('dialog', { name: 'Tờ khai thử nghiệm', exact: true });
  await expect(editor.getByRole('button', { name: 'Tải DOCX', exact: true })).toBeEnabled({ timeout: 30000 });
  await expect(editor.getByRole('button', { name: 'Lưu vào hồ sơ', exact: true })).toHaveCount(0);
  await expect(editor.getByRole('toolbar')).toHaveCount(0);
  await expect(page.getByLabel('Thay tệp Word đã điền')).toHaveCount(0);
  expect(state.writes).toHaveLength(0);
});
