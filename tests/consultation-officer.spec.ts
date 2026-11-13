import { test, expect, type Page } from '@playwright/test';
import { authReply } from './fixtures/auth';
import { documentIds, mockDocumentWorkflow } from './fixtures/documentWorkflow';

// Phía cán bộ của tham vấn (STAFFING-01): A gửi yêu cầu, B trả lời và đề nghị nhận hồ sơ — chỉ kiểm thử bằng mock
const consultationId = '10000000-0000-4000-8000-000000000099';
const permissions = ['document.submissions.read', 'document.submissions.write', 'workflow.consultation.read', 'workflow.consultation.request', 'workflow.consultation.respond'];

async function setup(page: Page, initial: object[]) {
  await mockDocumentWorkflow(page, 'officer', 'UNDER_REVIEW');
  const state = { items: initial, posts: [] as { path: string; body: Record<string, unknown> }[] };
  await page.route('**/users/me', route => authReply(route, { json: { id: documentIds.officer, username: 'canbo', email: 'officer@example.test', roles: ['FRONT_DESK_OFFICER'], permissions, profile: { fullName: 'Cán bộ A' } } }));
  await page.route(`**/api/v1/applications/${documentIds.application}/consultations**`, route => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if (request.method() === 'OPTIONS') return authReply(route, { status: 204 });
    if (request.method() === 'POST') {
      const body = request.postDataJSON() as Record<string, unknown>;
      state.posts.push({ path, body });
      const created = path.endsWith('/requests')
        ? { id: consultationId, applicationId: documentIds.application, specialistId: null, requestedBy: documentIds.officer, applicationVersion: 1, assignmentVersion: 2, question: body.question, status: 'PENDING_DISPATCH', version: 0, createdAtUtc: '2026-10-17T01:00:00Z' }
        : { ...(state.items[0] as object), status: 'ANSWERED', answer: body.text, willingToTakeOver: body.willingToTakeOver, version: 2 };
      state.items = [created];
      return authReply(route, { json: created });
    }
    if (path.endsWith('/document-access')) return authReply(route, { json: { allowed: true, applicationId: documentIds.application, version: 1 } });
    return authReply(route, { json: state.items });
  });
  await page.goto('/officer');
  await page.getByRole('button', { name: 'Tất cả hồ sơ', exact: true }).click();
  await page.getByRole('button', { name: 'Tiếp tục', exact: true }).click();
  const workspace = page.getByRole('article', { name: 'Không gian làm việc tiền kiểm hồ sơ' });
  await workspace.getByRole('button', { name: 'Tham vấn chuyên môn', exact: true }).click();
  return state;
}

test('cán bộ phụ trách gửi yêu cầu tham vấn và thấy trạng thái chờ điều phối', async ({ page }) => {
  const state = await setup(page, []);
  await page.getByRole('button', { name: 'Yêu cầu tham vấn', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Nội dung cần tham vấn').fill('Nhờ đối chiếu thông tin hộ tịch.');
  await dialog.getByRole('button', { name: 'Xác nhận', exact: true }).click();
  await expect.poll(() => state.posts.length).toBe(1);
  expect(state.posts[0]).toEqual({ path: `/api/v1/applications/${documentIds.application}/consultations/requests`, body: { expectedAssignmentVersion: 2, question: 'Nhờ đối chiếu thông tin hộ tịch.' } });
  await expect(page.getByText('Đã gửi yêu cầu tham vấn, đang chờ Quản lý cán bộ chọn cán bộ tư vấn.', { exact: false })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Yêu cầu tham vấn', exact: true })).toHaveCount(0);
  await expect(page.getByText('Chờ chọn cán bộ', { exact: true })).toBeVisible();
});

test('cán bộ tư vấn trả lời và đề nghị tiếp nhận hồ sơ', async ({ page }) => {
  const open = { id: consultationId, applicationId: documentIds.application, specialistId: documentIds.officer, specialistName: 'Cán bộ B', requestedBy: documentIds.citizen, requestedByName: 'Cán bộ A', dispatchedBy: documentIds.template, applicationVersion: 1, assignmentVersion: 2, question: 'Giấy khai sinh có hợp lệ không?', status: 'OPEN', version: 1, createdAtUtc: '2026-10-17T01:00:00Z' };
  const state = await setup(page, [open]);
  await page.getByRole('button', { name: 'Trả lời', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByLabel('Đề nghị về hồ sơ')).toHaveValue('no');
  await dialog.getByLabel('Ý kiến chuyên môn').fill('Đã đối chiếu, tôi có thể tiếp tục xử lý.');
  await dialog.getByLabel('Đề nghị về hồ sơ').selectOption('yes');
  await dialog.getByRole('button', { name: 'Xác nhận', exact: true }).click();
  await expect.poll(() => state.posts.length).toBe(1);
  expect(state.posts[0].body).toEqual({ expectedVersion: 1, text: 'Đã đối chiếu, tôi có thể tiếp tục xử lý.', willingToTakeOver: true });
  await expect(page.getByText('Cán bộ tư vấn sẵn sàng tiếp nhận hồ sơ.')).toBeVisible();
});
