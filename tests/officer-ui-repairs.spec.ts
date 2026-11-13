import { test, expect } from '@playwright/test';
import { authReply, mockWorkspaceAuth } from './fixtures/auth';
import { mockDocumentWorkflow, documentIds } from './fixtures/documentWorkflow';
import { accountRoleLabel } from '../src/lib/personName';
import { compareSubmissionSnapshots, diffValueText, diffFieldLabel, formDataFields } from '../src/lib/api/workflowAdapters';

test('nhãn trường tiếng Việt và so sánh giữ số, boolean, null, thêm/xóa, đường dẫn JSON', () => {
  const before = { formData: { identityNumber: '', procedureCode: 'TT01', nested: { 'a/b': 0 }, removed: null }, checklists: [{ id: 'item', title: 'Đơn', quantity: 1, note: null }] };
  const after = { formData: { identityNumber: '012345678901', procedureCode: 'TT01', nested: { 'a/b': false }, added: null }, checklists: [{ id: 'item', title: 'Đơn', quantity: 2, note: 'Đã bổ sung' }] };
  const changes = compareSubmissionSnapshots(JSON.stringify(before), after)!;
  expect(changes).toHaveLength(6);
  expect(changes.some(item => item.fieldKey.endsWith('procedureCode'))).toBe(false);
  expect(changes.find(item => item.fieldKey === '/formData/nested/a~1b')).toMatchObject({ oldValue: 0, newValue: false });
  expect(diffValueText(null, false, '')).toBe('Chưa có mục này trong lần gửi');
  expect(diffValueText(null, true, '')).toBe('Chưa có dữ liệu');
  expect(accountRoleLabel('MANAGER')).toBe('Quản lý cán bộ');
  expect(diffValueText(false, true, '')).toBe('Không');
  expect(diffValueText(0, true, '')).toBe('0');
  expect(diffFieldLabel('/checklists/item/quantity', 'Đơn', 'Đơn')).toBe('Đơn — Số lượng');
  expect(formDataFields({ procedureCode: 'TT01', identityNumber: '', procedureTitle: 'Thủ tục' }).map(item => item.label)).toEqual(['Mã thủ tục', 'Số định danh cá nhân / CCCD', 'Tên thủ tục']);
  expect(compareSubmissionSnapshots(before, before)).toEqual([]);
  expect(compareSubmissionSnapshots('{}', after)).toBeUndefined();
});

test('so sánh hai lần gửi hiện giá trị bản chụp và phân biệt thuộc tính cùng giấy tờ', async ({ page }, testInfo) => {
  const state = await mockDocumentWorkflow(page, 'officer', 'UNDER_REVIEW');
  state.version = 2;
  const snapshots = [1, 2].map(quantity => ({ formData: { procedureCode: 'TT01', identityNumber: quantity === 1 ? '' : '012345678901' }, checklists: [{ id: documentIds.checklist, title: 'Đơn kiểm thử', quantity }] }));
  await page.route('**/applications/*/versions', route => authReply(route, { json: snapshots.map((snapshotData, i) => ({ id: `${documentIds.application}-${i}`, versionNumber: i + 1, submittedBy: documentIds.citizen, submittedAt: '2026-11-13T01:00:00Z', snapshotData: JSON.stringify(snapshotData) })) }));
  await page.goto('/officer');
  await page.getByRole('button', { name: 'Tất cả hồ sơ', exact: true }).click();
  await page.getByRole('button', { name: 'Tiếp tục', exact: true }).click();
  await page.getByRole('button', { name: 'So sánh các lần gửi', exact: true }).click();
  await expect(page.getByText('Số định danh cá nhân / CCCD', { exact: true })).toBeVisible();
  await expect(page.getByText('012345678901', { exact: true })).toBeVisible();
  await expect(page.getByText('Chưa có dữ liệu', { exact: true })).toBeVisible();
  await expect(page.getByText(/— Số lượng$/)).toBeVisible();
  await expect(page.getByText('null', { exact: true })).toHaveCount(0);
  await page.screenshot({ path: testInfo.outputPath('so-sanh-hai-lan-gui.png'), fullPage: true });
  await page.getByLabel('Lần gửi sau').selectOption('1');
  await expect(page.getByText('Chọn phiên bản đích lớn hơn phiên bản nguồn để so sánh.')).toBeVisible();
});

test('bộ chọn tên thủ tục dài xuống dòng và không tràn ngang ở màn hình nhỏ', async ({ page }, testInfo) => {
  await mockDocumentWorkflow(page, 'officer', 'UNDER_REVIEW');
  const title = '(Đà Nẵng) Đăng ký, cấp Giấy chứng nhận đối với thửa đất có diện tích tăng thêm do thay đổi ranh giới so với Giấy chứng nhận đã cấp theo quy định';
  await page.route('**/officer/applications?*', route => authReply(route, { json: { items: [{ id: documentIds.application, procedureId: documentIds.template, procedureTitle: title, status: 'UNDER_REVIEW', createdAt: '2026-11-13T01:00:00Z', assignedOfficerId: documentIds.officer }], total: 1, page: 1, pageSize: 50 } }));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/officer?tab=all');
  await page.getByRole('button', { name: 'Mở menu điều hướng cán bộ', exact: true }).click();
  await page.getByRole('button', { name: 'Tất cả hồ sơ', exact: true }).click();
  await page.getByRole('combobox', { name: 'Lọc theo thủ tục' }).click();
  await expect(page.getByRole('listbox')).toBeVisible();
  await expect(page.getByRole('option', { name: title, exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 });
    for (const id of ['filter-submitted-from', 'filter-submitted-to']) {
      expect(await page.locator(`#${id}`).evaluate(input => {
        const bounds = input.getBoundingClientRect(), container = input.closest('fieldset')!.getBoundingClientRect();
        return bounds.left >= container.left && bounds.right <= container.right + 1;
      })).toBe(true);
    }
  }
  await page.screenshot({ path: testInfo.outputPath('bo-loc-thu-tuc-mobile.png'), fullPage: true });
  await page.keyboard.press('Escape');
  await expect(page.getByRole('listbox')).toHaveCount(0);
});

test('danh bạ cán bộ lấy tên phường thay mã nội bộ', async ({ page }) => {
  await mockWorkspaceAuth(page, ['MANAGER']);
  await page.goto('/manager');
  await page.locator('aside').getByRole('button', { name: 'Cán bộ Một cửa', exact: true }).click();
  await expect(page.getByRole('table').getByText('Phường A', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('WARD_A', { exact: true })).toHaveCount(0);
});

test('tham vấn xem giấy tờ chỉ đọc và giải thích khi API tải Word trả 403', async ({ page }) => {
  const state = await mockDocumentWorkflow(page, 'officer', 'UNDER_REVIEW');
  state.submissionStatus = 'Submitted'; state.evidenceQuantity = 2;
  await page.route('**/users/me', route => authReply(route, { json: { id: documentIds.officer, username: 'chuyenvien', roles: ['FRONT_DESK_OFFICER'], permissions: ['workflow.consultation.read', 'workflow.consultation.respond'], profile: { fullName: 'Chuyên viên' } } }));
  const consultation = { id: documentIds.evidence, applicationId: documentIds.application, specialistId: documentIds.officer, requestedBy: documentIds.citizen, applicationVersion: 1, assignmentVersion: 1, question: 'Nhờ kiểm tra giấy tờ', status: 'OPEN', version: 1, createdAtUtc: '2026-11-13T01:00:00Z' };
  await page.route('**/staffing/consultations?*', route => authReply(route, { json: { items: [consultation], total: 1, page: 1, pageSize: 20 } }));
  await page.route('**/consultations/document-access', route => authReply(route, { json: { applicationId: documentIds.application, allowed: true, version: 1 } }));
  await page.route('**/officer/submissions/*/download-docx', route => route.request().method() === 'OPTIONS' ? authReply(route, { status: 204 }) : authReply(route, { status: 403, json: { title: 'Hồ sơ không thuộc người đăng nhập.' } }));
  await page.goto('/officer?section=consultations');
  await page.getByRole('button', { name: 'Xem tài liệu', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Tài liệu tham vấn', exact: true });
  await dialog.getByRole('button', { name: 'giay-to.pdf', exact: true }).click();
  await expect(dialog.getByRole('button', { name: 'Tải xuống giay-to.pdf' })).toBeVisible();
  await dialog.getByRole('button', { name: 'to-khai.docx', exact: true }).click();
  await expect(dialog.getByRole('alert')).toContainText('chưa hỗ trợ chuyên viên tham vấn');
  await expect(dialog.getByText('Hồ sơ không thuộc người đăng nhập.', { exact: true })).toHaveCount(0);
  expect(state.writes).toEqual([]);
});
