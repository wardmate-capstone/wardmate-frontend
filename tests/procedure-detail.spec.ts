import { test, expect } from '@playwright/test';
import { parseProcedureContent } from '../src/lib/procedureContent';

test('content parser handles objects, JSON, missing data and unsafe fields', () => {
  const valid = {
    schemaVersion: 1, overview: 'Nội dung mẫu',
    methods: [{ method: 'Trực tiếp', fee: 'Chờ xác nhận', processingTime: 'Chờ xác nhận' }],
    legalBases: [{ number: 'MẪU', title: 'Văn bản minh họa', url: 'https://example.org/document' }],
    receivingAgencies: [{ name: 'Cơ quan minh họa', address: 'Địa chỉ mẫu' }],
  };
  expect(parseProcedureContent(valid)).toEqual(parseProcedureContent(JSON.stringify(valid)));
  expect(parseProcedureContent(valid).status).toBe('ready');
  for (const value of [null, undefined, '', { schemaVersion: 1 }]) expect(parseProcedureContent(value).status).toBe('empty');
  for (const value of ['{broken', 'null', '[]', 12, [], {}, { schemaVersion: 2 }]) expect(parseProcedureContent(value).status).toBe('invalid');
  const partial = parseProcedureContent({
    schemaVersion: 1, overview: { bad: true },
    methods: [null, 'bad', {}, { method: 'Hợp lệ', fee: 0, processingTime: false }],
    legalBases: [{ title: '<script>alert(1)</script>', url: 'javascript:alert(1)' }],
    receivingAgencies: [{ name: 'Mẫu', url: 'https://user:password@example.org' }],
  });
  expect(partial.status).toBe('partial');
  expect(partial.content.methods).toEqual([{ method: 'Hợp lệ', fee: '', processingTime: '', notes: '' }]);
  expect(partial.content.legalBases[0].url).toBe('');
  expect(partial.content.receivingAgencies[0].url).toBe('');
  expect(partial.content.legalBases[0].title).toBe('<script>alert(1)</script>');
  for (const url of ['data:text/html,test', '//example.org', '/relative', 'not a url']) {
    expect(parseProcedureContent({ schemaVersion: 1, legalBases: [{ title: 'Mẫu', url }] }).content.legalBases[0].url).toBe('');
  }
});

test('detail page preserves list filters, reloads directly and fits mobile', async ({ page }) => {
  await page.goto('/thu-tuc?category=' + encodeURIComponent('Hộ tịch') + '&page=2');
  await page.getByRole('link', { name: 'Xem Đăng ký lại kết hôn', exact: true }).click();
  await expect(page).toHaveURL(/thu-tuc\/demo-8\?/);
  await expect(page.getByRole('heading', { name: 'Đăng ký lại kết hôn', exact: true })).toBeFocused();
  for (const name of ['Thông tin chung', 'Thời hạn và lệ phí', 'Căn cứ pháp luật', 'Cơ quan tiếp nhận']) {
    await expect(page.getByRole('heading', { name, exact: true })).toBeVisible();
  }
  await expect(page.getByText('Dữ liệu minh họa', { exact: true })).toBeVisible();
  await expect(page.locator('#thoi-han-le-phi tbody tr')).toHaveCount(3);
  await page.getByRole('link', { name: 'Quay lại danh sách', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Trang 2/2');
  await expect(page.getByRole('complementary', { name: 'Lọc theo lĩnh vực' }).getByRole('button', { name: /Hộ tịch/ })).toHaveAttribute('aria-pressed', 'true');
  await page.goto('/thu-tuc/demo-1');
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Đăng ký khai sinh', exact: true })).toBeVisible();
  for (const width of [1440, 768, 390, 360]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    if (width === 1440 || width === 390) await page.screenshot({ path: 'test-results/detail-' + width + '.png', fullPage: true });
  }
  await page.goto('/thu-tuc/not-found');
  await expect(page.getByRole('heading', { name: 'Không tìm thấy thủ tục' })).toBeVisible();
  await page.getByRole('link', { name: 'Quay lại danh sách' }).click();
  await expect(page).toHaveURL(/\/thu-tuc$/);
});

test('detail renders empty, invalid and partial payloads without executing markup', async ({ page }) => {
  let payload: unknown = null;
  await page.route('**/src/data/mockPublicProcedures.ts*', (route) => route.fulfill({
    contentType: 'application/javascript',
    body: 'export const mockPublicProcedures = ' + JSON.stringify([{
      id: 'demo-1', title: 'Thủ tục minh họa', category: 'Hộ tịch', content_payload: payload,
    }]) + ';',
  }));
  await page.goto('/thu-tuc/demo-1');
  await expect(page.getByRole('status')).toContainText('Nội dung chi tiết đang được cập nhật');
  payload = '{invalid';
  await page.reload();
  await expect(page.getByRole('alert')).toContainText('dữ liệu không hợp lệ');
  payload = {
    schemaVersion: 1, methods: false,
    legalBases: [
      { title: '<img src=x onerror=alert(1)>', url: 'javascript:alert(1)' },
      { title: 'Văn bản minh họa', number: 'MẪU', url: 'https://example.org/document' },
    ],
    receivingAgencies: [{ name: 'Cơ quan minh họa', address: 'Chưa có địa chỉ thật', url: 'https://example.org' }],
  };
  await page.reload();
  await expect(page.getByRole('status')).toContainText('Một phần nội dung');
  await expect(page.locator('#can-cu-phap-luat img')).toHaveCount(0);
  await expect(page.locator('#can-cu-phap-luat')).toContainText('<img src=x onerror=alert(1)>');
  await expect(page.getByRole('link', { name: /Xem văn bản/ })).toHaveAttribute('href', 'https://example.org/document');
  await expect(page.locator('#co-quan-tiep-nhan')).toContainText('Cơ quan minh họa');
});
