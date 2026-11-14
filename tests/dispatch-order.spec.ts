import { test, expect } from '@playwright/test';
import { authReply, mockWorkspaceAuth } from './fixtures/auth';
import { mockCatalog } from './fixtures/procedures';
import { mockAnalytics } from './fixtures/analytics';

// DISPATCH-SEARCH-01: server tìm (không dấu, mọi từ phải khớp), sắp xếp theo sort và lọc status; mock làm giống BE (23 hồ sơ)
const rows = Array.from({ length: 23 }, (_, i) => ({ id: `00000000-0000-4000-8000-${String(i + 1).padStart(12, '0')}`, applicationCode: `HS-${String(i + 1).padStart(3, '0')}`, procedureId: '00000000-0000-4000-8000-999999999999', procedureTitle: `Thủ tục số ${i + 1}`, status: i === 4 ? 'UNDER_REVIEW' : 'SUBMITTED', assignedOfficerId: null, assignmentVersion: 0 }));
const fold = (value: string) => value.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').toLowerCase();

test('Điều phối hồ sơ: mới nhất lên đầu, phân trang đúng và không lặp tiêu đề', async ({ page }) => {
  await mockWorkspaceAuth(page, ['MANAGER'], ['iam.profile.read', 'workflow.dispatch.read', 'workflow.dispatch.write']);
  await mockCatalog(page);
  await mockAnalytics(page);
  await page.route('**/api/v1/manager/officers?*', route => authReply(route, { json: { items: [], page: 1, pageSize: 100, total: 0 } }));
  const requests: URL[] = [];
  await page.route('**/api/v1/manager/applications?*', route => {
    const url = new URL(route.request().url());
    requests.push(url);
    const p = Number(url.searchParams.get('page')); const size = Number(url.searchParams.get('pageSize'));
    const words = fold(url.searchParams.get('search') ?? '').split(/\s+/).filter(Boolean);
    const status = url.searchParams.get('status')?.toUpperCase();
    let list = rows.filter(r => (!status || r.status === status) && words.every(w => fold(`${r.applicationCode} ${r.procedureTitle}`).includes(w)));
    if (url.searchParams.get('sort') === 'createdAt_desc') list = [...list].reverse();
    return authReply(route, { json: { items: list.slice((p - 1) * size, p * size), page: p, pageSize: size, total: list.length } });
  });
  await page.goto('/manager?section=dispatch');
  const table = page.getByRole('table');
  await expect(table.getByRole('row').nth(1)).toContainText('HS-023');
  await expect(table.getByRole('row').nth(10)).toContainText('HS-014');
  await expect(page.getByRole('heading', { name: 'Danh sách hồ sơ điều phối' })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Điều phối hồ sơ', level: 1 })).toBeVisible();
  await page.getByRole('button', { name: 'Trang sau', exact: true }).click();
  await page.getByRole('button', { name: 'Trang sau', exact: true }).click();
  await expect(page.getByRole('navigation', { name: 'Phân trang' })).toContainText('Trang 3/3 · 23 mục');
  await expect(table.getByRole('row')).toHaveCount(4);
  await expect(table.getByRole('row').nth(1)).toContainText('HS-003');
  await expect(table.getByRole('row').nth(3)).toContainText('HS-001');

  // Tìm không dấu vẫn khớp tên có dấu; kết quả mới nhất lên đầu và quay về trang 1
  await page.getByRole('searchbox', { name: 'Tìm hồ sơ điều phối' }).fill('thu tuc so 7');
  await expect(page.getByText('Tìm thấy 2 hồ sơ khớp “thu tuc so 7”.')).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Phân trang' })).toContainText('Trang 1/1 · 2 mục');
  await expect(table.getByRole('row').nth(1)).toContainText('HS-017');
  await expect(table.getByRole('row').nth(2)).toContainText('HS-007');
  await page.getByRole('searchbox', { name: 'Tìm hồ sơ điều phối' }).fill('HS-007');
  await expect(table.getByRole('row')).toHaveCount(2);
  await expect(table.getByRole('row').nth(1)).toContainText('Thủ tục số 7');
  await page.getByRole('searchbox', { name: 'Tìm hồ sơ điều phối' }).fill('không tồn tại');
  await expect(page.getByText('Không có hồ sơ nào khớp “không tồn tại”.', { exact: false })).toBeVisible();
  await page.getByRole('searchbox', { name: 'Tìm hồ sơ điều phối' }).fill('');
  await expect(table.getByRole('row').nth(1)).toContainText('HS-023');

  // Lọc trạng thái gửi lên server và quay về trang 1
  await page.getByLabel('Lọc theo trạng thái hồ sơ').selectOption('UNDER_REVIEW');
  await expect(table.getByRole('row')).toHaveCount(2);
  await expect(table.getByRole('row').nth(1)).toContainText('HS-005');

  // Mỗi trang chỉ một lần gọi, luôn kèm sort mới nhất trước; từ khóa gửi nguyên văn cho server
  expect(requests.every(url => url.searchParams.get('sort') === 'createdAt_desc')).toBe(true);
  expect(requests.every(url => Number(url.searchParams.get('pageSize')) <= 100)).toBe(true);
  expect(requests.some(url => url.searchParams.get('search') === 'thu tuc so 7')).toBe(true);
  expect(requests.at(-1)?.searchParams.get('status')).toBe('UNDER_REVIEW');
});
