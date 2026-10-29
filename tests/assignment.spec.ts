import { test, expect, type Page } from '@playwright/test';
import { authReply, mockWorkspaceAuth } from './fixtures/auth';
import { documentIds, mockDocumentWorkflow } from './fixtures/documentWorkflow';

// Phân công theo lĩnh vực (WORKFLOW-ASSIGN-01) — kiểm thử bằng mock, không gọi BE thật.
const OFFICER_A = '11111111-1111-1111-1111-111111111111';
const OFFICER_B = '22222222-2222-2222-2222-222222222222';
const time = '2026-10-20T01:00:00Z';
const summary = (id: string, code: string, extra: Record<string, unknown> = {}) => ({
  id, applicationCode: code, procedureId: '0f0f0f0f-0000-4000-8000-000000000001', procedureTitle: 'Đăng ký khai sinh',
  status: 'SUBMITTED', createdAt: time, submittedAt: time, applicantName: 'Nguyễn Văn A', assignedOfficerId: null,
  categoryId: 1, categoryName: 'Hộ tịch', resubmitCount: 0, assignmentVersion: 0, ...extra,
});
const detail = (id: string, extra: Record<string, unknown> = {}) => ({
  id, applicationCode: 'HS-PC-01', userId: documentIds.citizen, procedureId: '0f0f0f0f-0000-4000-8000-000000000001',
  procedureTitle: 'Đăng ký khai sinh', status: 'UNDER_REVIEW', formData: {}, createdAt: time, updatedAt: time,
  resubmitCount: 0, currentVersionNumber: 1, ...extra,
});

/** Ghi lại query của danh sách hồ sơ để kiểm tra bộ lọc gửi lên server. */
async function mockOfficerList(page: Page, items: (url: URL) => unknown[]) {
  const urls: URL[] = [];
  await page.route('**/api/v1/officer/applications?**', route => {
    const url = new URL(route.request().url());
    urls.push(url);
    const list = items(url);
    return authReply(route, { json: { items: list, page: 1, pageSize: 50, total: list.length } });
  });
  return urls;
}

test.describe('Cán bộ: hàng đợi theo lĩnh vực', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await mockWorkspaceAuth(page, ['FRONT_DESK_OFFICER']);
    await page.route('**/api/v1/users/me', route => authReply(route, { json: {
      id: 'ui-test', username: 'demo', email: 'demo@example.test', profile: { fullName: 'Cán bộ thử' },
      roles: ['FRONT_DESK_OFFICER'], permissions: ['iam.profile.read', 'iam.profile.write'], assignedCategories: [1],
    } }));
  });

  test('tab gửi đúng bộ lọc, không xin bản nháp và có hướng dẫn khi lĩnh vực trống', async ({ page }) => {
    const urls = await mockOfficerList(page, url => (url.searchParams.get('Scope') === 'my-categories' ? [] : [summary('aaaaaaaa-0000-4000-8000-000000000001', 'HS-PHUONG')]));
    await page.goto('/officer');
    await page.getByRole('button', { name: 'Tất cả hồ sơ', exact: true }).click();

    await expect(page.getByRole('tab', { name: 'Lĩnh vực của tôi' })).toHaveAttribute('aria-selected', 'true');
    await expect.poll(() => urls.at(-1)?.searchParams.get('Scope')).toBe('my-categories');
    // BE tự loại bản nháp (WORKFLOW-FE-1026) nên FE không gửi Status mặc định nữa.
    expect(urls.at(-1)?.searchParams.has('Status')).toBe(false);

    await expect(page.getByText('Không có hồ sơ mới trong lĩnh vực của bạn.')).toBeVisible();
    await page.getByRole('button', { name: 'Xem hồ sơ toàn phường' }).click();
    await expect(page.getByRole('tab', { name: 'Toàn phường' })).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByRole('row').filter({ hasText: 'HS-PHUONG' })).toBeVisible();

    await page.getByRole('tab', { name: 'Đang xử lý của tôi' }).click();
    await expect.poll(() => urls.at(-1)?.searchParams.get('Assignee')).toBe('me');
  });

  test('nhận hồ sơ ngoài lĩnh vực phải xác nhận và báo lỗi khi đã có người nhận', async ({ page }) => {
    await mockOfficerList(page, () => [summary('aaaaaaaa-0000-4000-8000-000000000002', 'HS-DAT-DAI', { categoryId: 2, categoryName: 'Chứng thực' })]);
    const assigned: string[] = [];
    await page.route('**/api/v1/officer/applications/*/assign', route => {
      assigned.push(route.request().url());
      return authReply(route, { status: 409, json: { title: 'Conflict', code: 'application.invalid_status' } });
    });
    await page.goto('/officer');
    await page.getByRole('button', { name: 'Tất cả hồ sơ', exact: true }).click();
    await page.getByRole('tab', { name: 'Toàn phường' }).click();

    const row = page.getByRole('row').filter({ hasText: 'HS-DAT-DAI' });
    await expect(row.getByText('Ngoài lĩnh vực')).toBeVisible();
    await row.getByRole('button', { name: 'Nhận xử lý' }).click();
    const confirm = page.getByRole('dialog', { name: 'Nhận hồ sơ ngoài lĩnh vực?' });
    await confirm.getByRole('button', { name: 'Để cán bộ khác nhận' }).click();
    await expect(confirm).toHaveCount(0);
    expect(assigned).toHaveLength(0);

    await row.getByRole('button', { name: 'Nhận xử lý' }).click();
    await page.getByRole('dialog', { name: 'Nhận hồ sơ ngoài lĩnh vực?' }).getByRole('button', { name: 'Vẫn nhận xử lý' }).click();
    await expect.poll(() => assigned.length).toBe(1);
    await expect(page.getByText('Trạng thái hiện tại của hồ sơ không cho phép thực hiện thao tác này.')).toBeVisible();
  });
});

test('Cán bộ: trả hồ sơ về hàng đợi cần lý do 5–500 ký tự', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await mockDocumentWorkflow(page, 'officer', 'UNDER_REVIEW');
  const bodies: Array<Record<string, unknown>> = [];
  await page.route('**/api/v1/officer/applications/*/release', route => {
    bodies.push(route.request().postDataJSON());
    return authReply(route, { json: { application: detail(documentIds.application, { status: 'SUBMITTED', assignedOfficerId: null }), assignedOfficerId: null, resubmitCount: 0, currentVersionNumber: 1 } });
  });
  await page.goto('/officer');
  await page.getByRole('button', { name: 'Tất cả hồ sơ', exact: true }).click();
  await page.getByRole('button', { name: 'Tiếp tục', exact: true }).click();
  const workspace = page.getByRole('article', { name: 'Không gian làm việc tiền kiểm hồ sơ' });
  await expect(workspace).toBeVisible();

  await workspace.getByRole('button', { name: 'Trả về hàng đợi' }).click();
  const modal = page.getByRole('dialog', { name: 'Trả hồ sơ về hàng đợi' });
  await modal.getByLabel('Lý do trả hồ sơ').fill('abc');
  await modal.getByRole('button', { name: 'Trả về hàng đợi' }).click();
  await expect(modal.getByRole('alert')).toBeVisible();
  expect(bodies).toHaveLength(0);

  await modal.getByLabel('Lý do trả hồ sơ').fill('Hồ sơ thuộc lĩnh vực khác');
  await modal.getByRole('button', { name: 'Trả về hàng đợi' }).click();
  await expect.poll(() => bodies.length).toBe(1);
  expect(bodies[0]).toMatchObject({ reason: 'Hồ sơ thuộc lĩnh vực khác' });
  await expect(workspace).toHaveCount(0);
});

test.describe('Manager: giám sát, giao/chuyển và lịch sử phân công', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await mockWorkspaceAuth(page, ['MANAGER'], [
      'iam.profile.read', 'iam.profile.write', 'iam.accounts.read', 'iam.accounts.manage', 'iam.wards.read',
      'workflow.queue.read', 'workflow.read', 'workflow.assign.manage',
    ]);
  });

  test('giao hồ sơ chưa phân công: lý do bắt buộc, gửi assignmentVersion và báo xung đột 409', async ({ page }) => {
    await mockOfficerList(page, () => [summary('aaaaaaaa-0000-4000-8000-000000000003', 'HS-CHUA-GIAO', { assignmentVersion: 3 })]);
    const bodies: Array<Record<string, unknown>> = [];
    await page.route('**/api/v1/manager/applications/*/assignee', route => {
      bodies.push(route.request().postDataJSON());
      return authReply(route, { status: 409, json: { title: 'Conflict', code: 'workflow.assignment_conflict' } });
    });
    await page.goto('/manager');
    await page.getByRole('button', { name: 'Giám sát hồ sơ' }).click();

    const row = page.getByRole('row').filter({ hasText: 'HS-CHUA-GIAO' });
    await row.getByRole('button', { name: 'Giao cán bộ' }).click();
    const modal = page.getByRole('dialog', { name: 'Giao hồ sơ cho cán bộ' });
    // Cán bộ đúng lĩnh vực (Hộ tịch) đứng đầu danh sách.
    await expect(modal.getByLabel('Cán bộ nhận hồ sơ').locator('option').nth(1)).toContainText('Nguyễn Văn An · Đúng lĩnh vực');

    await modal.getByRole('button', { name: 'Giao hồ sơ' }).click();
    await expect(modal.getByText('Chọn cán bộ nhận hồ sơ.')).toBeVisible();
    expect(bodies).toHaveLength(0);

    await modal.getByLabel('Cán bộ nhận hồ sơ').selectOption(OFFICER_A);
    await modal.getByLabel('Lý do').fill('Đúng lĩnh vực phụ trách');
    await modal.getByRole('button', { name: 'Giao hồ sơ' }).click();
    await expect.poll(() => bodies.length).toBe(1);
    expect(bodies[0]).toEqual({ officerId: OFFICER_A, reason: 'Đúng lĩnh vực phụ trách', expectedAssignmentVersion: 3 });
    await expect(modal.getByText('Phân công hồ sơ vừa thay đổi bởi thao tác khác.', { exact: false })).toBeVisible();
  });

  test('chuyển cán bộ không liệt kê người đang phụ trách; xem được lịch sử phân công', async ({ page }) => {
    const id = 'aaaaaaaa-0000-4000-8000-000000000004';
    await mockOfficerList(page, () => [summary(id, 'HS-DANG-XU-LY', { status: 'UNDER_REVIEW', assignedOfficerId: OFFICER_A, assignmentVersion: 2 })]);
    await page.route(`**/api/v1/officer/applications/${id}`, route => authReply(route, { json: detail(id, {
      assignedOfficerId: OFFICER_A,
      assignmentHistory: [
        { id: 'h1', action: 'CLAIM', fromOfficerId: null, toOfficerId: OFFICER_B, actorId: OFFICER_B, reason: null, createdAt: '2026-10-20T02:00:00Z' },
        { id: 'h2', action: 'TRANSFER', fromOfficerId: OFFICER_B, toOfficerId: OFFICER_A, actorId: 'ui-test', reason: 'Cân bằng công việc', createdAt: '2026-10-20T03:00:00Z' },
      ],
    }) }));
    await page.goto('/manager');
    await page.getByRole('button', { name: 'Giám sát hồ sơ' }).click();

    const row = page.getByRole('row').filter({ hasText: 'HS-DANG-XU-LY' });
    await row.getByRole('button', { name: 'Chuyển cán bộ' }).click();
    const modal = page.getByRole('dialog', { name: 'Chuyển cán bộ phụ trách' });
    const select = modal.getByLabel('Cán bộ nhận hồ sơ');
    await expect(select.locator(`option[value="${OFFICER_A}"]`)).toHaveCount(0);
    await expect(select.locator(`option[value="${OFFICER_B}"]`)).toHaveCount(1);
    await modal.getByRole('button', { name: 'Hủy' }).click();

    await row.getByRole('button', { name: 'Xem lịch sử phân công hồ sơ HS-DANG-XU-LY' }).click();
    const history = page.getByRole('dialog', { name: 'Lịch sử phân công' });
    await expect(history.getByRole('listitem')).toHaveCount(2);
    await expect(history.getByRole('listitem').first()).toContainText('Lý do: Cân bằng công việc');
  });

  test('số liệu giám sát lấy từ assignment-summary, không gọi danh sách pageSize=1', async ({ page }) => {
    const urls = await mockOfficerList(page, () => []);
    await page.route('**/api/v1/manager/applications/assignment-summary', route => authReply(route, { json: {
      unassignedSubmitted: 4, overdue: 2, officers: [{ officerId: OFFICER_A, activeCount: 3, overdueCount: 1 }],
    } }));
    await page.goto('/manager');
    await page.getByRole('button', { name: 'Giám sát hồ sơ' }).click();

    await expect(page.getByRole('button', { name: /Chờ tiền kiểm, chưa có người nhận\s*4/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Đang quá hạn tiền kiểm\s*2/ })).toBeVisible();
    const workload = page.getByRole('region', { name: 'Khối lượng đang xử lý theo cán bộ' });
    // Cán bộ không có trong officers[] được hiểu là 0.
    await expect(workload.getByRole('button', { name: /Nguyễn Văn An\s*3/ })).toBeVisible();
    await expect(workload.getByRole('button', { name: /Trần Thị Mai Hương\s*0/ })).toBeVisible();
    expect(urls.some(url => url.searchParams.get('PageSize') === '1')).toBe(false);
    expect(urls.every(url => !url.searchParams.has('Status'))).toBe(true);

    // Bấm chip chỉ lọc hồ sơ đang xử lý của cán bộ đó, khớp với số trên chip.
    await workload.getByRole('button', { name: /Nguyễn Văn An/ }).click();
    await expect.poll(() => urls.at(-1)?.searchParams.get('Assignee')).toBe(OFFICER_A);
    expect(urls.at(-1)?.searchParams.get('Status')).toBe('SUBMITTED,UNDER_REVIEW,NEED_REVISION,DOCUMENTS_READY');
    await expect(page.getByLabel('Lọc theo trạng thái')).toHaveValue('SUBMITTED,UNDER_REVIEW,NEED_REVISION,DOCUMENTS_READY');
  });
});

test('Cán bộ: lịch sử xử lý lấy từ server và lọc hành động ở server', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await mockWorkspaceAuth(page, ['FRONT_DESK_OFFICER']);
  await mockOfficerList(page, () => []);
  const urls: URL[] = [];
  await page.route('**/api/v1/officer/activity?**', route => {
    const url = new URL(route.request().url());
    urls.push(url);
    const items = url.searchParams.get('action') === 'NEED_REVISION'
      ? [{ id: 'a2', source: 'STATUS', action: 'NEED_REVISION', applicationId: 'aaaaaaaa-0000-4000-8000-000000000005', applicationCode: 'HS-LS-02',
          procedureTitle: 'Thủ tục đăng ký khai tử', applicantName: 'Nguyễn Đức Anh', reason: 'Thiếu chữ ký', createdAt: '2026-10-24T11:29:00Z' }]
      : [{ id: 'a1', source: 'ASSIGNMENT', action: 'CLAIM', applicationId: 'aaaaaaaa-0000-4000-8000-000000000006', applicationCode: 'HS-LS-01',
          procedureTitle: 'Đăng ký khai sinh', applicantName: null, reason: null, createdAt: '2026-10-24T10:00:00Z' }];
    return authReply(route, { json: { items, page: 1, pageSize: 20, total: items.length } });
  });
  await page.goto('/officer');
  await page.getByRole('button', { name: 'Lịch sử xử lý', exact: true }).click();

  const table = page.getByRole('table', { name: 'Lịch sử thao tác của cán bộ' });
  const claim = table.getByRole('row').filter({ hasText: 'HS-LS-01' });
  await expect(claim).toContainText('Nhận xử lý hồ sơ');
  await expect(claim).toContainText('Công dân');
  // Danh sách không còn CCCD nên ô tìm kiếm không hứa tìm theo CCCD.
  await page.getByRole('button', { name: 'Tất cả hồ sơ', exact: true }).click();
  await expect(page.getByPlaceholder('Tìm mã hồ sơ, họ tên người dân...')).toBeVisible();
  await page.getByRole('button', { name: 'Lịch sử xử lý', exact: true }).click();
  expect(urls[0]?.searchParams.get('pageSize')).toBe('20');

  await page.getByLabel('Lọc theo hành động').selectOption('NEED_REVISION');
  await expect.poll(() => urls.at(-1)?.searchParams.get('action')).toBe('NEED_REVISION');
  const revision = table.getByRole('row').filter({ hasText: 'HS-LS-02' });
  await expect(revision).toContainText('Nguyễn Đức Anh');
  await expect(revision).toContainText('Lý do: Thiếu chữ ký');
});
