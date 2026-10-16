import { test, expect, type Page } from '@playwright/test';
import { documentIds, mockDocumentWorkflow } from './fixtures/documentWorkflow';
import { authReply } from './fixtures/auth';

async function openDossier(page: Page) {
  const state = await mockDocumentWorkflow(page);
  await page.route('**/api/v1/wards', route => authReply(route, { json: [{ code: 'WARD_A', name: 'Phường thử nghiệm' }] }));
  await page.goto('/citizen?section=dossiers_all');
  await page.getByRole('button', { name: 'Chi tiết', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Giấy tờ và biểu mẫu', exact: true })).toBeVisible();
  return state;
}

test('dossier gives one clear next action and reflows across desktop, tablet and mobile', async ({ page }) => {
  const state = await openDossier(page);
  const summary = page.getByRole('complementary', { name: 'Tiến độ và bước tiếp theo' });
  await expect(summary.getByRole('button', { name: 'Gửi hồ sơ tiền kiểm', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Gửi hồ sơ tiền kiểm', exact: true })).toHaveCount(1);
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
  await expect(page.getByRole('region', { name: 'Thông tin hồ sơ' })).toContainText('Phường thử nghiệm');
  await expect(page.getByRole('button', { name: 'Điền trực tuyến', exact: true })).toBeEnabled();
  await expect(page.getByText('Đồng bộ checklist', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Nộp tiền kiểm ngay', { exact: true })).toHaveCount(0);
  await summary.getByRole('button', { name: 'Tờ khai thử nghiệm', exact: true }).click();
  await expect(page.locator(`#checklist-${documentIds.checklist}`)).toBeFocused();
  await page.locator(`#checklist-${documentIds.checklist}`).evaluate(element => (element as HTMLElement).blur());
  for (const width of [1440, 1920, 768, 390, 360]) {
    await page.setViewportSize({ width, height: 950 });
    await page.evaluate(() => scrollTo(0, 0));
    await expect.poll(() => page.locator('#citizen-main').evaluate(element => element.getBoundingClientRect().width)).toBeGreaterThan(300);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    if (width === 1440 || width === 390) await page.screenshot({ path: `test-results/citizen-dossier-redesign-${width}.png`, fullPage: true });
  }
  await page.setViewportSize({ width: 1440, height: 950 });
  await page.evaluate(() => scrollTo(0, 650));
  await expect.poll(() => summary.evaluate(element => element.getBoundingClientRect().top - document.querySelector('.admin-topbar')!.getBoundingClientRect().bottom)).toBeGreaterThanOrEqual(0);
  expect(state.writes).toHaveLength(0);
});

test('draft is not counted as complete until confirmed; file selection remains accessible', async ({ page }) => {
  await openDossier(page);
  const form = page.locator(`#checklist-${documentIds.checklist}`);
  await form.getByText('Đã điền bằng Word? Tải tệp lên', { exact: true }).click();
  const chooserPromise = page.waitForEvent('filechooser');
  await form.getByText('Tải lên tệp Word đã điền', { exact: true }).click();
  await (await chooserPromise).setFiles({ name: 'ban-khai.docx', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', buffer: Buffer.from('mock-docx-upload') });
  await expect(form.getByText('Cần xác nhận bản khai', { exact: true })).toBeVisible();
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
  await expect(page.getByRole('button', { name: 'Gửi hồ sơ tiền kiểm', exact: true })).toBeDisabled();
  await form.getByRole('button', { name: 'Xác nhận bản khai', exact: true }).click();
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '1');
  await expect(form.getByText('Đã hoàn tất', { exact: true })).toBeVisible();
  await page.locator(`#checklist-${documentIds.evidence}`).getByLabel('Đính kèm giấy tờ').setInputFiles({ name: 'giay-to.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-test') });
  const upload = page.getByRole('dialog', { name: 'Khai số bản trong tệp' });
  await upload.getByLabel('Số bản thực tế').fill('2');
  await upload.getByRole('button', { name: 'Lưu giấy tờ', exact: true }).click();
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '2');
  await expect(page.getByRole('button', { name: 'Gửi hồ sơ tiền kiểm', exact: true })).toBeEnabled();
});
