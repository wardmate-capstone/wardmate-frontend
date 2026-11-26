import { test, expect } from '@playwright/test';
import { authReply, mockWorkspaceAuth } from './fixtures/auth';
import { mockDocumentWorkflow, documentIds } from './fixtures/documentWorkflow';
import { parseDateText, isoToDisplay } from '../src/components/ui/DateField';
import { displayDocumentFileName } from '../src/lib/documentFileName';

// Kiểm tra theo bàn giao BE `fe-handoff-2026-11-26-ui-review.md` (FE-02, FE-10, FE-18, FE-19). API đều là giả lập.

test('FE-19: ô ngày đọc dd/mm/yyyy, tự chèn dấu "/", nhận ISO và loại ngày không có thật', () => {
  expect(parseDateText('01')).toEqual({ display: '01', iso: '' });
  expect(parseDateText('0111')).toEqual({ display: '01/11', iso: '' });
  expect(parseDateText('01112026')).toEqual({ display: '01/11/2026', iso: '2026-11-01' });
  expect(parseDateText('01/11/2026')).toEqual({ display: '01/11/2026', iso: '2026-11-01' });
  expect(parseDateText('2026-11-01')).toEqual({ display: '01/11/2026', iso: '2026-11-01' });
  expect(parseDateText('31/02/2026').iso).toBe('');
  expect(parseDateText('').iso).toBe('');
  expect(isoToDisplay('2026-02-09')).toBe('09/02/2026');
  expect(isoToDisplay('')).toBe('');
});

test('FE-10: tên tờ khai bỏ tiền tố mã lưu trữ và đuôi lặp', () => {
  expect(displayDocumentFileName('dccb6f4a41804d93882edac0fc08c60b_don-nhap-lan-1.docx.docx')).toBe('don-nhap-lan-1.docx');
  expect(displayDocumentFileName('dccb6f4a-4180-4d93-882e-dac0fc08c60b_to-khai.docx')).toBe('to-khai.docx');
  expect(displayDocumentFileName('giay-to.pdf')).toBe('giay-to.pdf');
  expect(displayDocumentFileName('')).toBe('Tờ khai chưa đặt tên');
});

test('FE-18: Tổng quan cán bộ không tràn ngang ở 375px', async ({ page }) => {
  await mockWorkspaceAuth(page, ['FRONT_DESK_OFFICER']);
  await mockDocumentWorkflow(page, 'officer', 'UNDER_REVIEW');
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/officer');
  await expect(page.getByRole('heading', { level: 1, name: 'Tổng quan', exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('FE-18: bảng hồ sơ cán bộ ở 1366px không phải cuộn ngang để thấy cột Trạng thái', async ({ page }) => {
  await mockWorkspaceAuth(page, ['FRONT_DESK_OFFICER']);
  await mockDocumentWorkflow(page, 'officer', 'UNDER_REVIEW');
  await page.setViewportSize({ width: 1366, height: 900 });
  await page.goto('/officer');
  await page.getByRole('button', { name: 'Tất cả hồ sơ', exact: true }).click();
  const table = page.getByRole('table', { name: 'Bảng danh sách hồ sơ hành chính' });
  await expect(table).toBeVisible();
  const fits = await table.evaluate(el => {
    const wrap = el.parentElement!;
    return { table: el.scrollWidth, wrap: wrap.clientWidth, page: document.documentElement.scrollWidth <= window.innerWidth };
  });
  expect(fits.page).toBe(true);
  expect(fits.table).toBeLessThanOrEqual(fits.wrap + 1);
});

test('FE-02: danh sách hồ sơ báo lỗi 503 kèm Thử lại thay cho khung chờ', async ({ page }) => {
  await mockWorkspaceAuth(page, ['FRONT_DESK_OFFICER']);
  await mockDocumentWorkflow(page, 'officer', 'UNDER_REVIEW');
  let calls = 0;
  let healthy = false;
  await page.route('**/officer/applications?*', route => {
    if (route.request().method() === 'OPTIONS') return authReply(route, { status: 204 });
    calls++;
    if (!healthy) return authReply(route, { status: 503, body: '' });
    return authReply(route, { json: { items: [{ id: documentIds.application, procedureId: documentIds.template, procedureTitle: 'Thủ tục kiểm thử', status: 'UNDER_REVIEW', createdAt: '2026-11-13T01:00:00Z', assignedOfficerId: documentIds.officer }], total: 1, page: 1, pageSize: 50 } });
  });
  await page.goto('/officer');
  await page.getByRole('button', { name: 'Tất cả hồ sơ', exact: true }).click();
  const table = page.getByRole('table', { name: 'Bảng danh sách hồ sơ hành chính' });
  await expect(table.getByRole('alert')).toContainText('Hệ thống đang khởi động', { timeout: 10_000 });
  await expect(page.getByText('Chưa tải được danh sách hồ sơ', { exact: true })).toBeVisible();
  expect(calls).toBeGreaterThanOrEqual(2); // lần đầu + 1 lần tự thử lại
  healthy = true;
  await table.getByRole('button', { name: 'Thử lại' }).click();
  await expect(table.getByText('Thủ tục kiểm thử')).toBeVisible();
});

test('FE-19: lọc ngày gửi nhập dd/mm/yyyy và gửi API theo ISO', async ({ page }) => {
  await mockWorkspaceAuth(page, ['FRONT_DESK_OFFICER']);
  await mockDocumentWorkflow(page, 'officer', 'UNDER_REVIEW');
  const queries: URLSearchParams[] = [];
  page.on('request', request => {
    const url = new URL(request.url());
    if (url.pathname.endsWith('/officer/applications')) queries.push(url.searchParams);
  });
  await page.setViewportSize({ width: 1366, height: 900 });
  await page.goto('/officer');
  await page.getByRole('button', { name: 'Tất cả hồ sơ', exact: true }).click();
  const from = page.getByLabel('Gửi từ', { exact: true });
  await from.pressSequentially('05112026');
  await expect(from).toHaveValue('05/11/2026');
  await expect.poll(() => queries.some(q => (q.get('submittedFrom') ?? q.get('SubmittedFrom') ?? '').startsWith('2026-11-0'))).toBe(true);
});
