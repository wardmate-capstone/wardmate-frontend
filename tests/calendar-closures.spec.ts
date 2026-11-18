import { test, expect } from '@playwright/test';
import { authReply, mockWorkspaceAuth } from './fixtures/auth';

const id = (n: number) => `3333333${n}-3333-4333-8333-333333333333`;
const closure = (n: number, date: string, wardCode: string | null, wardName: string | null) => ({
  id: id(n), wardCode, wardName, date, effectiveFromUtc: `${date}T00:00:00Z`, reason: `Ngày nghỉ ${n}`,
  createdBy: id(9), createdAtUtc: '2026-11-01T01:00:00Z', cancelled: false, cancelledBy: null, cancelledAtUtc: null, cancellationReason: null,
});

test('Lịch ngày nghỉ: bản ghi cũ thiếu tên phường hiện tên tra từ danh mục, không hiện mã', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-11-18T02:00:00Z'));
  await mockWorkspaceAuth(page, ['MANAGER'], ['iam.profile.read', 'workflow.staffing.read', 'workflow.staffing.manage']);
  await page.route('**/api/v1/wards', route => authReply(route, { json: [{ id: id(7), code: 'PHUONG_BEN_NGHE', name: 'Phường Bến Nghé' }] }));
  await page.route('**/api/v1/staffing/**', route => new URL(route.request().url()).pathname.endsWith('/closures')
    ? authReply(route, { json: [
      closure(1, '2026-11-05', 'PHUONG_BEN_NGHE', null), // tạo trước 08/11: không có snapshot tên
      closure(2, '2026-12-03', 'PHUONG_BEN_NGHE', 'Phường Bến Nghé'),
      closure(3, '2026-11-20', null, null),
      closure(4, '2026-12-10', 'PHUONG_KHAC', null), // không có trong danh mục: giữ mã
    ] })
    : authReply(route, { json: [] }));
  await page.goto('/manager?section=closures');
  const cards = page.locator('.closure-card');
  await expect(cards).toHaveCount(4);
  await expect(cards.filter({ hasText: 'Ngày nghỉ 1' })).toContainText('Phường Bến Nghé');
  await expect(cards.filter({ hasText: 'Ngày nghỉ 1' })).not.toContainText('PHUONG_BEN_NGHE');
  await expect(cards.filter({ hasText: 'Ngày nghỉ 2' })).toContainText('Phường Bến Nghé');
  await expect(cards.filter({ hasText: 'Ngày nghỉ 3' })).toContainText('Toàn quốc');
  await expect(cards.filter({ hasText: 'Ngày nghỉ 4' })).toContainText('Phường PHUONG_KHAC');
});
