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
  for (const value of [null, undefined, '', {}, { schemaVersion: 1 }]) expect(parseProcedureContent(value).status).toBe('empty');
  for (const value of ['{broken', 'null', '[]', 12, [], { schemaVersion: 2 }]) expect(parseProcedureContent(value).status).toBe('invalid');
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


test('API detail shows 404 and invalid responses without mock fallback', async ({ page }) => {
  const { mockCatalog, catalogReply, procedureId } = await import('./fixtures/procedures');
  await mockCatalog(page);
  await page.goto('/thu-tuc/missing');
  await expect(page.getByRole('alert')).toContainText('Không tìm thấy thủ tục đang hoạt động');
  await page.getByRole('link', { name: 'Quay lại danh sách', exact: true }).click();
  await expect(page.locator('.procedures-list > li')).toHaveCount(5);
  await page.route(`**/api/v1/procedures/${procedureId}`, route => catalogReply(route, { json: { id: procedureId, contentPayload: false } }));
  await page.goto(`/thu-tuc/${procedureId}`);
  await expect(page.getByRole('alert')).toContainText('Một số thông tin chưa hợp lệ');
});

test('common checklist is visible even without cases and direct reload preserves filters', async ({ page }) => {
  const { mockCatalog, procedureId } = await import('./fixtures/procedures');
  const state = await mockCatalog(page);
  state.detail.contentPayload.cases = [];
  state.detail.checklistSchema = state.detail.checklistSchema?.filter(item => !item.caseCode);
  await page.goto(`/thu-tuc/${procedureId}?category=1&page=2`);
  await expect(page.getByText('Giấy tờ dùng chung', { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText('Giấy tờ dùng chung', { exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Quay lại danh sách', exact: true }).click();
  await expect(page).toHaveURL(/category=1&page=2/);
  await expect(page.locator('.procedures-list > li')).toHaveCount(1);
});
