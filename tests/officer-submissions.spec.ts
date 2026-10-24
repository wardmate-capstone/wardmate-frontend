import { test, expect, type Page } from '@playwright/test';
import { authReply } from './fixtures/auth';
import { documentIds, mockDocumentWorkflow } from './fixtures/documentWorkflow';

async function openReview(page: Page) {
  await page.goto('/officer');
  await page.getByRole('button', { name: 'Tất cả hồ sơ', exact: true }).click();
  await page.getByRole('button', { name: 'Tiếp tục', exact: true }).click();
  await expect(page.getByRole('article', { name: 'Không gian làm việc tiền kiểm hồ sơ' })).toBeVisible();
}

test('chọn đúng submission; chỉ một quyết định, PDF và khóa sửa theo trạng thái mới', async ({ page }) => {
  const state = await mockDocumentWorkflow(page, 'officer', 'UNDER_REVIEW');
  state.submissionStatus = 'Submitted'; state.checklistStatus = 'COMPLETED'; state.evidenceQuantity = 2;
  const secondId = '10000000-0000-4000-8000-000000000099';
  await page.route('**/officer/submissions/by-application/*', async route => {
    return authReply(route, { json: [documentIds.submission, secondId].map((id, i) => ({
      id, applicationId: documentIds.application, checklistId: documentIds.checklist,
      templateId: documentIds.template, applicantId: documentIds.citizen,
      fileName: i ? 'ban-khai-thu-hai.docx' : 'to-khai.docx', fileSizeBytes: 2048,
      status: state.submissionStatus, createdAt: '2026-10-17T01:00:00Z',
    })) });
  });
  await openReview(page);
  await expect(page.getByRole('button', { name: 'Từ chối tiền kiểm', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Xác nhận giấy tờ sẵn sàng', exact: true }).click();
  const modal = page.getByRole('dialog', { name: 'Xác nhận giấy tờ sẵn sàng', exact: true });
  await modal.getByLabel('Bản khai đang kiểm tra').selectOption(secondId);
  await modal.getByRole('button', { name: 'Xác nhận quyết định' }).click();
  await expect(modal).toHaveCount(0);
  expect(state.writes.filter(x => x.path.endsWith('/confirm-readiness')).map(x => x.path)).toEqual([`/api/v1/officer/submissions/${secondId}/confirm-readiness`]);
  expect(state.writes.some(x => x.path.endsWith('/approve'))).toBe(false);
  await expect(page.getByRole('button', { name: 'Xác nhận giấy tờ sẵn sàng', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Bản khai & giấy tờ', exact: true }).click();
  await expect(page.getByLabel('Tải lại DOCX có ghi chú')).toHaveCount(0);
  await page.screenshot({ path: 'test-results/officer-submissions-desktop.png', fullPage: true });
  await page.getByRole('button', { name: 'PDF sau tiền kiểm', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Tạo PDF: to-khai.docx', exact: true })).toBeEnabled();
});

test('hồ sơ không có đơn DOCX dùng Workflow, không tạo submissionId giả', async ({ page }) => {
  const state = await mockDocumentWorkflow(page, 'officer', 'UNDER_REVIEW');
  state.withoutForm = true; state.evidenceQuantity = 2;
  await openReview(page);
  await page.getByRole('button', { name: 'Xác nhận giấy tờ sẵn sàng', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('Hồ sơ không có bản khai điện tử');
  await page.getByRole('button', { name: 'Xác nhận quyết định' }).click();
  await expect.poll(() => state.status).toBe('DOCUMENTS_READY');
  expect(state.writes.map(x => x.path)).toEqual([`/api/v1/officer/applications/${documentIds.application}/confirm-readiness`]);
});

for (const status of [403, 409, 503]) {
  test(`quyết định lỗi ${status} giữ modal/lý do, đọc lại trạng thái trước khi thử`, async ({ page }) => {
    const state = await mockDocumentWorkflow(page, 'officer', 'UNDER_REVIEW');
    state.submissionStatus = 'Submitted'; state.checklistStatus = 'COMPLETED'; state.evidenceQuantity = 2;
    state.comments.push({ id: documentIds.evidence, versionNumber: 1, applicationVersionId: documentIds.supporting, targetType: 'CHECKLIST_ITEM', targetId: documentIds.checklist, fieldLabel: 'Tờ khai', commentText: 'Sửa nội dung', officerId: documentIds.officer, status: 'OPEN', createdAt: '2026-10-17T01:00:00Z', updatedAt: '2026-10-17T01:00:00Z' });
    let calls = 0;
    await page.route('**/officer/submissions/*/request-revision', route => {
      if (route.request().method() === 'OPTIONS') return authReply(route, { status: 204 });
      calls++;
      return authReply(route, { status, json: { code: status === 503 ? 'document.workflow_unavailable' : 'document.workflow_review_failed' } });
    });
    await openReview(page);
    await page.getByRole('button', { name: 'Yêu cầu bổ sung', exact: true }).click();
    const modal = page.getByRole('dialog', { name: 'Yêu cầu bổ sung hồ sơ' });
    await modal.getByLabel('Lý do').fill('Vui lòng sửa lại nội dung');
    await modal.getByRole('button', { name: 'Xác nhận quyết định' }).click();
    await expect(modal.getByRole('alert')).toContainText('Trạng thái đã được tải lại');
    await expect(modal.getByLabel('Lý do')).toHaveValue('Vui lòng sửa lại nội dung');
    expect(calls).toBe(1);
    expect(state.status).toBe('UNDER_REVIEW');
    expect(state.reads.filter(x => x.includes('/by-application/')).length).toBeGreaterThan(1);
    expect(state.writes).toHaveLength(0);
  });
}

test('annotate lỗi giữ file để thử lại; không đổi trạng thái và không quyết định hồ sơ', async ({ page }) => {
  const state = await mockDocumentWorkflow(page, 'officer', 'UNDER_REVIEW');
  state.submissionStatus = 'Submitted';
  let fail = true;
  await page.route('**/officer/submissions/*/annotate-docx', route => {
    if (route.request().method() === 'OPTIONS') return authReply(route, { status: 204 });
    return fail ? authReply(route, { status: 503, json: { code: 'document.blob_upload_failed' } }) : route.fallback();
  });
  await openReview(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Bản khai & giấy tờ', exact: true }).click();
  await page.getByLabel('Tải lại DOCX có ghi chú').setInputFiles({ name: 'ghi-chu.docx', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', buffer: Buffer.from('annotated-docx') });
  await expect(page.getByText('Kho lưu trữ chưa thể lưu tệp Word.', { exact: false })).toBeVisible();
  fail = false;
  await page.getByRole('button', { name: 'Thử lưu lại DOCX: ghi-chu.docx' }).click();
  await expect(page.getByText('Đã lưu bản khai có ghi chú.', { exact: false })).toBeVisible();
  await expect(page.getByLabel('Tải lại DOCX có ghi chú')).not.toHaveAttribute('aria-invalid', 'true');
  expect(state.writes).toHaveLength(1);
  expect(state.writes[0].body).toContain('annotated-docx');
  expect(state.status).toBe('UNDER_REVIEW');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.evaluate(() => scrollTo(0, 0));
  await page.screenshot({ path: 'test-results/officer-submissions-mobile.png', fullPage: true });
});

test('nhận xét chưa lưu chặn quyết định; có thể xóa nội dung và kiểm tra lại', async ({ page }) => {
  const state = await mockDocumentWorkflow(page, 'officer', 'UNDER_REVIEW');
  state.submissionStatus = 'Submitted'; state.checklistStatus = 'COMPLETED'; state.evidenceQuantity = 2;
  await openReview(page);
  await page.getByRole('button', { name: /^Nhận xét \(/ }).click();
  await page.getByLabel('Mục cần nhận xét').selectOption(documentIds.checklist);
  await page.getByLabel('Nội dung nhận xét').fill('Nhận xét chưa lưu');
  await page.getByRole('button', { name: 'Xác nhận giấy tờ sẵn sàng', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('alert').filter({ hasText: 'Bạn có nhận xét chưa lưu' })).toBeVisible();
  expect(state.writes).toHaveLength(0);
  await page.getByRole('button', { name: 'Xóa nội dung đang nhập' }).click();
  await page.getByRole('button', { name: 'Xác nhận giấy tờ sẵn sàng', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('Lần nộp đang kiểm tra: 1');
});

test('phiên bản quyết định cố định đến khi đóng modal; không quyết định phiên bản mới bằng lý do cũ', async ({ page }) => {
  const state = await mockDocumentWorkflow(page, 'officer', 'UNDER_REVIEW');
  state.submissionStatus = 'Submitted'; state.checklistStatus = 'COMPLETED'; state.evidenceQuantity = 2;
  await openReview(page);
  await page.getByRole('button', { name: 'Xác nhận giấy tờ sẵn sàng', exact: true }).click();
  const modal = page.getByRole('dialog');
  state.version = 2;
  for (let i = 0; i < 2; i++) {
    await modal.getByRole('button', { name: 'Xác nhận quyết định' }).click();
    await expect(modal.getByRole('alert')).toContainText('Hồ sơ hoặc quyền thụ lý đã thay đổi');
  }
  await expect(modal).toContainText('Lần nộp đang kiểm tra: 1');
  expect(state.writes).toHaveLength(0);
  await modal.getByRole('button', { name: 'Đóng hộp thoại' }).click();
  await page.getByRole('button', { name: 'Xác nhận giấy tờ sẵn sàng', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('Lần nộp đang kiểm tra: 2');
});

test('đơn biến mất khi xác nhận không chuyển sang Workflow để quyết định thay', async ({ page }) => {
  const state = await mockDocumentWorkflow(page, 'officer', 'UNDER_REVIEW');
  state.submissionStatus = 'Submitted'; state.checklistStatus = 'COMPLETED'; state.evidenceQuantity = 2;
  await openReview(page);
  await page.getByRole('button', { name: 'Xác nhận giấy tờ sẵn sàng', exact: true }).click();
  state.submissionStatus = '';
  await page.getByRole('button', { name: 'Xác nhận quyết định' }).click();
  await expect(page.getByRole('dialog').getByRole('alert')).toContainText('Danh sách bản khai đã thay đổi');
  expect(state.writes).toHaveLength(0);
});

for (const malformed of [true, false]) {
  test(`phản hồi quyết định ${malformed ? 'sai cấu trúc' : 'sai submissionId'} không báo thành công`, async ({ page }) => {
    const state = await mockDocumentWorkflow(page, 'officer', 'UNDER_REVIEW');
    state.submissionStatus = 'Submitted'; state.checklistStatus = 'COMPLETED'; state.evidenceQuantity = 2;
    let calls = 0;
    await page.route('**/officer/submissions/*/confirm-readiness', route => {
      if (route.request().method() === 'OPTIONS') return authReply(route, { status: 204 });
      calls++;
      return authReply(route, { json: malformed ? { message: 'ok' } : { submissionId: documentIds.evidence, message: 'ok' } });
    });
    await openReview(page);
    await page.getByRole('button', { name: 'Xác nhận giấy tờ sẵn sàng', exact: true }).click();
    await page.getByRole('button', { name: 'Xác nhận quyết định' }).click();
    await expect(page.getByRole('dialog').getByRole('alert')).toContainText('Trạng thái đã được tải lại');
    await expect(page.getByText(/đã được xác nhận giấy tờ sẵn sàng\./)).toHaveCount(0);
    expect(state.status).toBe('UNDER_REVIEW');
    expect(calls).toBe(1);
  });
}

test('kết quả chưa đồng bộ sau 503: đọc lại trạng thái đã lưu, không gửi quyết định lần hai', async ({ page }) => {
  const state = await mockDocumentWorkflow(page, 'officer', 'UNDER_REVIEW');
  state.submissionStatus = 'Submitted'; state.checklistStatus = 'COMPLETED'; state.evidenceQuantity = 2;
  let calls = 0;
  await page.route('**/officer/submissions/*/confirm-readiness', route => {
    if (route.request().method() === 'OPTIONS') return authReply(route, { status: 204 });
    calls++; state.status = 'DOCUMENTS_READY'; state.submissionStatus = 'ReadyForDownload';
    return authReply(route, { status: 503, json: { code: 'document.sync_unavailable' } });
  });
  await openReview(page);
  await page.getByRole('button', { name: 'Xác nhận giấy tờ sẵn sàng', exact: true }).click();
  await page.getByRole('button', { name: 'Xác nhận quyết định' }).click();
  await expect(page.getByRole('dialog').getByRole('alert')).toContainText('Trạng thái đã được tải lại');
  await expect(page.getByRole('button', { name: 'Xác nhận quyết định' })).toBeDisabled();
  expect(calls).toBe(1);
});

test('chọn file không hợp lệ xóa file thử lại và thông báo thành công cũ', async ({ page }) => {
  const state = await mockDocumentWorkflow(page, 'officer', 'UNDER_REVIEW');
  state.submissionStatus = 'Submitted';
  let fail = true;
  await page.route('**/officer/submissions/*/annotate-docx', route => {
    if (route.request().method() === 'OPTIONS') return authReply(route, { status: 204 });
    return fail ? authReply(route, { status: 503, json: { code: 'document.blob_upload_failed' } }) : route.fallback();
  });
  await openReview(page);
  await page.getByRole('button', { name: 'Bản khai & giấy tờ', exact: true }).click();
  const input = page.getByLabel('Tải lại DOCX có ghi chú');
  const valid = { name: 'ghi-chu.docx', mimeType: 'application/octet-stream', buffer: Buffer.from('docx') };
  await input.setInputFiles(valid);
  await expect(page.getByRole('button', { name: 'Thử lưu lại DOCX: ghi-chu.docx' })).toBeEnabled();
  await input.setInputFiles({ ...valid, name: 'sai.pdf' });
  await expect(page.getByText('Vui lòng chọn tệp DOCX.')).toBeVisible();
  await expect(page.getByRole('button', { name: /^Thử lưu lại DOCX/ })).toHaveCount(0);
  fail = false;
  await input.setInputFiles(valid);
  await expect(page.getByText('Đã lưu bản khai có ghi chú.', { exact: false })).toBeVisible();
  await input.setInputFiles({ ...valid, buffer: Buffer.alloc(0) });
  await expect(page.getByText('Tệp đã chọn không có nội dung.')).toBeVisible();
  await expect(page.getByText('Đã lưu bản khai có ghi chú.', { exact: false })).toHaveCount(0);
  expect(state.writes).toHaveLength(1);
});

test('lý do chỉ có khoảng trắng bị chặn; trim trước khi gửi', async ({ page }) => {
  const state = await mockDocumentWorkflow(page, 'officer', 'UNDER_REVIEW');
  state.submissionStatus = 'Submitted';
  state.comments.push({ id: documentIds.evidence, versionNumber: 1, applicationVersionId: documentIds.supporting, targetType: 'CHECKLIST_ITEM', targetId: documentIds.checklist, fieldLabel: 'Tờ khai', commentText: 'Sửa nội dung', officerId: documentIds.officer, status: 'OPEN', createdAt: '2026-10-17T01:00:00Z', updatedAt: '2026-10-17T01:00:00Z' });
  await openReview(page);
  await page.getByRole('button', { name: 'Yêu cầu bổ sung', exact: true }).click();
  const modal = page.getByRole('dialog');
  await modal.getByLabel('Lý do').fill('   ');
  await modal.getByRole('button', { name: 'Xác nhận quyết định' }).click();
  await expect(modal.getByRole('alert')).toContainText('Nhập lý do');
  await expect(modal.getByLabel('Lý do')).toBeFocused();
  expect(state.writes).toHaveLength(0);
  await modal.getByLabel('Lý do').fill('  Cập nhật bản khai  ');
  await modal.getByRole('button', { name: 'Xác nhận quyết định' }).click();
  await expect.poll(() => state.status).toBe('NEED_REVISION');
  expect(JSON.parse(state.writes[0].body)).toEqual({ comment: 'Cập nhật bản khai' });
});
