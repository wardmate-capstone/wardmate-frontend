import { test, expect } from '@playwright/test';
import { getProcedureIssues } from '../src/lib/procedureValidation';
import { hasFourColumnLegal, legalIssueDate } from '../src/lib/procedureDisplay';

// PROC-LEGAL-01 (BE 23/11/2026): căn cứ pháp lý 4 cột, cả 4 trường đều có thể null
const base = {
  procedureCode: 'TEST-LEGAL', categoryId: 1, title: 'Thủ tục kiểm thử căn cứ pháp lý',
  contentPayload: { submissionMethods: [], results: [], cases: [], legalReferences: [] as Record<string, string | null>[] },
};
const legalIssues = (legalReferences: Record<string, string | null>[]) =>
  getProcedureIssues({ ...base, contentPayload: { ...base.contentPayload, legalReferences } }).filter(issue => issue.path.startsWith('contentPayload.legalReferences'));

test('legal reference needs số ký hiệu or trích yếu, other columns may be empty', () => {
  expect(legalIssues([{ documentNumber: '59/2020/QH14', documentName: 'Luật Doanh nghiệp', issueDate: '2020-06-17', authority: 'Quốc hội' }])).toEqual([]);
  expect(legalIssues([{ documentNumber: '59/2020/QH14', documentName: null, issueDate: null, authority: null }])).toEqual([]);
  expect(legalIssues([{ documentNumber: '', documentName: 'Luật Doanh nghiệp', issueDate: null, authority: null }])).toEqual([]);
  const missing = legalIssues([{ documentNumber: ' ', documentName: '', issueDate: null, authority: 'Quốc hội' }]);
  expect(missing).toHaveLength(1);
  expect(missing[0].message).toBe('Nhập số ký hiệu hoặc trích yếu của văn bản.');
  expect(legalIssues([{ documentNumber: 'x'.repeat(256), documentName: null, issueDate: null, authority: null }])[0].message).toBe('Nhập tối đa 255 ký tự.');
});

test('four-column layout only when some row has issue date or authority; dates show dd-MM-yyyy', () => {
  expect(hasFourColumnLegal([{ documentNumber: 'A', documentName: 'B', issueDate: null, authority: '' }])).toBe(false);
  expect(hasFourColumnLegal([{ documentNumber: 'A' }, { documentName: 'B', authority: 'Chính phủ' }])).toBe(true);
  expect(hasFourColumnLegal([{ documentNumber: 'A', issueDate: '2019-11-29' }])).toBe(true);
  expect(legalIssueDate('2019-11-29')).toBe('29-11-2019');
  expect(legalIssueDate(null)).toBe('');
});

test('public detail switches between 2-column and 4-column legal table', async ({ page }) => {
  const { mockCatalog, procedureId } = await import('./fixtures/procedures');
  const state = await mockCatalog(page);
  await page.goto(`/thu-tuc/${procedureId}`);
  const legal = page.locator('section').filter({ has: page.getByRole('heading', { name: 'Căn cứ pháp lý' }) });
  await expect(legal.getByRole('columnheader', { name: 'Tên văn bản pháp lý' })).toBeVisible();
  await expect(legal.getByRole('columnheader', { name: 'Cơ quan ban hành' })).toHaveCount(0);

  state.detail.contentPayload.legalReferences = [
    { documentNumber: '01/2021/NĐ-CP', documentName: 'Nghị định về đăng ký doanh nghiệp', issueDate: '2021-01-04', authority: 'Chính phủ' },
    { documentNumber: '59/2020/QH14', documentName: null, issueDate: null, authority: null },
  ];
  await page.reload();
  for (const name of ['Số ký hiệu', 'Trích yếu', 'Ngày ban hành', 'Cơ quan ban hành'])
    await expect(legal.getByRole('columnheader', { name })).toBeVisible();
  await expect(legal.getByRole('cell', { name: '04-01-2021' })).toBeVisible();
  await expect(legal.getByRole('cell', { name: 'Chính phủ' })).toBeVisible();
  await expect(legal.getByRole('row')).toHaveCount(3);
});
