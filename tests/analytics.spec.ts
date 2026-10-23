import { test, expect } from '@playwright/test';
import { mockWorkspaceAuth } from './fixtures/auth';
import { mockCatalog } from './fixtures/procedures';
import { mockAnalytics } from './fixtures/analytics';

test('Manager: đủ sáu GET, phân trang và dữ liệu thiếu/null', async ({ page }) => {
  await mockWorkspaceAuth(page, ['MANAGER']); await mockCatalog(page); const state = await mockAnalytics(page);
  await page.goto('/manager');
  await expect(page.getByRole('heading', { name: 'Kết quả tiền kiểm trong kỳ' })).toBeVisible();
  await expect(page.getByText('Chưa đủ dữ liệu tổng hợp:').first()).toBeVisible();
  await expect(page.getByText('Chưa đủ dữ liệu', { exact: true }).first()).toBeVisible();
  await page.locator('aside').getByRole('button', { name: 'Thống kê thủ tục', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Thống kê theo thủ tục' })).toBeVisible();
  await page.getByRole('button', { name: 'Trang sau' }).click();
  await expect(page.getByText('Trang 2 · 21 kết quả')).toBeVisible();
  await page.locator('aside').getByRole('button', { name: 'Hiệu suất cán bộ', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Hiệu suất tiền kiểm theo cán bộ' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Hồ sơ chưa phân công cán bộ' })).toBeVisible();
  await page.locator('aside').getByRole('button', { name: 'Báo cáo phản hồi', exact: true }).click();
  await expect(page.getByText('Hỗ trợ tận tình')).toBeVisible();
  await page.locator('aside').getByRole('button', { name: 'Mức độ hài lòng', exact: true }).click();
  await expect(page.getByText(/Hài lòng \(4–5 sao\): 100%/)).toBeVisible();
  for (const route of ['overview', 'trends', 'procedures', 'officers', 'feedback', 'feedback/summary']) expect(state.requests.some(item => item.path.endsWith('/analytics/' + route))).toBe(true);
});

test('Manager: 403 và response sai cấu trúc không hiện số liệu giả', async ({ page }) => {
  await mockWorkspaceAuth(page, ['MANAGER']); await mockCatalog(page); const state = await mockAnalytics(page); state.fail = 'analytics.forbidden';
  await page.goto('/manager'); await expect(page.getByText('Không có phạm vi phường phù hợp.').first()).toBeVisible();
  await expect(page.getByRole('img', { name: 'Biểu đồ lượt hoạt động tiền kiểm', exact: true })).toHaveCount(0);
  state.fail = ''; state.malformed = true; await page.getByRole('button', { name: 'Thử lại', exact: true }).first().click();
  await expect(page.getByText(/Dữ liệu không đúng định dạng/).first()).toBeVisible();
});

test('Admin: xác nhận POST 202 rồi GET theo dõi job, validation ID', async ({ page }) => {
  await mockWorkspaceAuth(page, ['IT_ADMIN']); const state = await mockAnalytics(page);
  await page.goto('/admin'); await page.locator('aside').getByRole('button', { name: 'Job thống kê' }).click();
  await page.getByRole('button', { name: 'Tính lại thống kê', exact: true }).click();
  await page.getByRole('button', { name: 'Xác nhận xếp lịch' }).click();
  await expect(page.getByText('Trạng thái: Hoàn tất')).toBeVisible();
  expect(state.requests.filter(item => item.method === 'POST')).toHaveLength(1);
  expect(state.requests.some(item => item.path.endsWith('/jobs/123'))).toBe(true);
  await page.getByLabel('Mã job', { exact: true }).fill('abc'); await page.getByRole('button', { name: 'Tra cứu' }).click();
  await expect(page.getByText('Mã job gồm 1–30 chữ số.')).toBeVisible();
});

test('Admin: jobs_disabled giữ form và không báo hoàn tất', async ({ page }) => {
  await mockWorkspaceAuth(page, ['IT_ADMIN']); const state = await mockAnalytics(page); state.fail = 'analytics.jobs_disabled';
  await page.goto('/admin'); await page.locator('aside').getByRole('button', { name: 'Job thống kê' }).click();
  await page.getByRole('button', { name: 'Tính lại thống kê', exact: true }).click(); await page.getByRole('button', { name: 'Xác nhận xếp lịch' }).click();
  await expect(page.getByRole('alert')).toContainText('Chức năng chưa được bật.'); await expect(page.getByText('Trạng thái: Hoàn tất')).toHaveCount(0);
});

test('Schema: ngày biên, năm nhuận, rating, comment, page và giờ Việt Nam', async ({ page }) => {
  await mockWorkspaceAuth(page, ['MANAGER']); await mockAnalytics(page); await mockCatalog(page); await page.goto('/manager');
  const result = await page.evaluate(async () => {
    const m = await import('/src/lib/api/analytics.ts');
    return {
      leap: m.dateRangeSchema.safeParse({ from: '2024-01-01', to: '2024-12-31' }).success,
      long: m.dateRangeSchema.safeParse({ from: '2024-01-01', to: '2025-01-01' }).success,
      badDate: m.dateRangeSchema.safeParse({ from: '2025-02-29', to: '2025-03-01' }).success,
      reversed: m.dateRangeSchema.safeParse({ from: '2024-02-01', to: '2024-01-01' }).success,
      future: m.dateRangeSchema.safeParse({ from: '2099-01-01', to: '2099-01-02' }).success,
      ratings: [0, 1, 5, 6, 1.5].map(rating => m.feedbackInputSchema.safeParse({ rating, comment: '' }).success),
      lengths: [2000, 2001].map(length => m.feedbackInputSchema.safeParse({ rating: 5, comment: 'a'.repeat(length) }).success),
      page: [0, 1, 100001].map(page => m.analyticsQuerySchema.safeParse({ from: '2024-01-01', to: '2024-01-02', page, pageSize: 20 }).success),
    };
  });
  expect(result).toEqual({ leap: true, long: false, badDate: false, reversed: false, future: false, ratings: [false, true, true, false, false], lengths: [true, false], page: [false, true, false] });
});

test('Manager: đổi kỳ đưa trang về 1, từ chối khoảng ngày đảo ngược', async ({ page }) => {
  await mockWorkspaceAuth(page, ['MANAGER']); await mockCatalog(page); const state = await mockAnalytics(page);
  await page.goto('/manager'); await page.locator('aside').getByRole('button', { name: 'Thống kê thủ tục', exact: true }).click();
  await page.getByRole('button', { name: 'Trang sau' }).click(); await expect(page.getByText('Trang 2 · 21 kết quả')).toBeVisible();
  await page.getByLabel('Từ ngày', { exact: true }).fill('2024-01-01'); await page.getByLabel('Đến ngày', { exact: true }).fill('2024-12-31'); await page.getByRole('button', { name: 'Áp dụng' }).click();
  await expect(page.getByText('Trang 1 · 21 kết quả')).toBeVisible();
  expect(state.requests.some(item => item.query.get('from') === '2024-01-01' && item.query.get('to') === '2024-12-31' && item.query.get('page') === '1')).toBe(true);
  const before = state.requests.length;
  await page.getByLabel('Từ ngày', { exact: true }).fill('2025-01-01'); await page.getByRole('button', { name: 'Áp dụng' }).click();
  await expect(page.getByRole('alert')).toContainText('Ngày kết thúc phải từ ngày bắt đầu.'); expect(state.requests.length).toBe(before);
});

test('Admin: job còn xếp hàng không báo hoàn tất và cập nhật qua polling', async ({ page }) => {
  await mockWorkspaceAuth(page, ['IT_ADMIN']); const state = await mockAnalytics(page); state.jobState = 'Enqueued';
  await page.goto('/admin'); await page.locator('aside').getByRole('button', { name: 'Job thống kê' }).click();
  await page.getByRole('button', { name: 'Tính lại thống kê', exact: true }).click(); await page.getByRole('button', { name: 'Xác nhận xếp lịch' }).click();
  await expect(page.getByText('Trạng thái: Đã xếp hàng')).toBeVisible(); await expect(page.getByText('Trạng thái: Hoàn tất')).toHaveCount(0);
  state.jobState = 'Succeeded'; await expect(page.getByText('Trạng thái: Hoàn tất')).toBeVisible({ timeout: 10000 });
  expect(state.requests.filter(item => item.method === 'POST')).toHaveLength(1);
});

test('Manager: từ chối response sai kỳ, sai trang và xu hướng trùng ngày', async ({ page }) => {
  await mockWorkspaceAuth(page, ['MANAGER']); await mockCatalog(page); const state = await mockAnalytics(page); state.wrongPeriod = true;
  await page.goto('/manager'); await expect(page.getByText('Kỳ thống kê trả về không khớp bộ lọc. Vui lòng tải lại.').first()).toBeVisible();
  await expect(page.getByRole('img', { name: 'Biểu đồ lượt hoạt động tiền kiểm', exact: true })).toHaveCount(0);
  state.wrongPeriod = false; state.duplicateDay = true;
  await page.getByRole('button', { name: 'Làm mới dữ liệu' }).click();
  await expect(page.getByRole('heading', { name: 'Kết quả tiền kiểm trong kỳ' })).toBeVisible();
  await expect(page.getByText('Dữ liệu xu hướng thiếu hoặc trùng ngày. Vui lòng tải lại.')).toBeVisible();
  state.wrongPage = true;
  await page.locator('aside').getByRole('button', { name: 'Thống kê thủ tục', exact: true }).click();
  await expect(page.getByText('Trang thống kê trả về không khớp yêu cầu. Vui lòng tải lại.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Thống kê theo thủ tục' })).toHaveCount(0);
});

test('Validation: GUID .NET, GUID rỗng, pageSize và mã job tại biên', async ({ page }) => {
  await mockWorkspaceAuth(page, ['MANAGER']); await mockCatalog(page); await mockAnalytics(page); await page.goto('/manager');
  const result = await page.evaluate(async () => {
    const m = await import('/src/lib/api/analytics.ts');
    return {
      guid: ['10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'not-an-id'].map(id => m.guidSchema.safeParse(id).success),
      pageSize: [0, 1, 100, 101].map(pageSize => m.analyticsQuerySchema.safeParse({ from: '2024-01-01', to: '2024-01-01', page: 1, pageSize }).success),
      job: ['', '1', '1'.repeat(30), '1'.repeat(31), '１２３', '-1'].map(id => m.jobIdSchema.safeParse(id).success),
      coverage: m.coverageSchema.safeParse({ from: '2024-01-01', to: '2024-01-02', missingDates: ['2024-01-03'], oldestSourceAtUtc: null, latestRefreshAtUtc: null, timeZone: 'Asia/Ho_Chi_Minh' }).success,
    };
  });
  expect(result).toEqual({ guid: [true, false, false], pageSize: [false, true, true, false], job: [false, true, true, false, false, false], coverage: false });
});

test('Admin: lỗi ngày từ BE đóng xác nhận và focus đúng ô ngày', async ({ page }) => {
  await mockWorkspaceAuth(page, ['IT_ADMIN']); await mockAnalytics(page);
  await page.route('**/api/v1/analytics/jobs/rebuild', async route => {
    if (route.request().method() !== 'POST') return route.fallback();
    const { authReply } = await import('./fixtures/auth');
    return authReply(route, { status: 400, json: { title: 'Khoảng ngày chưa hợp lệ.', errors: { To: ['Kiểm tra lại ngày kết thúc.'] } } });
  });
  await page.goto('/admin'); await page.locator('aside').getByRole('button', { name: 'Job thống kê' }).click();
  await page.getByRole('button', { name: 'Tính lại thống kê', exact: true }).click(); await page.getByRole('button', { name: 'Xác nhận xếp lịch' }).click();
  await expect(page.getByRole('dialog', { name: 'Xác nhận tính lại thống kê' })).toHaveCount(0);
  await expect(page.getByText('Kiểm tra lại ngày kết thúc.', { exact: true })).toBeVisible();
  await expect(page.getByLabel('Đến ngày', { exact: true })).toBeFocused();
});
