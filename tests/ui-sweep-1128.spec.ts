import { expect, test, type Page } from '@playwright/test';
import { authReply, mockWorkspaceAuth } from './fixtures/auth';
import { mockCatalog } from './fixtures/procedures';

/**
 * Rà soát giao diện 28/11/2026: mở mọi mục menu của từng khu làm việc và các trang công khai ở 1440 px và 390 px,
 * chụp ảnh (test-results/ui-sweep/) và kiểm tra tự động: không tràn ngang trang, không phần tử nhìn thấy nào
 * vượt mép phải khung nhìn, không lỗi runtime. Dữ liệu là mock (đa số rỗng/lỗi) nên chỉ kiểm bố cục, không kiểm nghiệp vụ.
 */
const workspaces: { role: string; path: string; sections: string[] }[] = [
  { role: 'REGISTERED_CITIZEN', path: '/citizen', sections: ['dashboard', 'procedures', 'submissions', 'dossiers_all', 'dossiers_received', 'qr_code', 'notifications', 'feedback', 'profile'] },
  { role: 'FRONT_DESK_OFFICER', path: '/officer', sections: ['dashboard', 'apps-all', 'apps-received', 'shifts', 'closures', 'leaves', 'consultations', 'audit-log', 'notifications', 'profile'] },
  { role: 'MANAGER', path: '/manager', sections: ['overview', 'dispatch', 'applications', 'shifts', 'closures', 'leaves', 'consultations', 'stats-dossiers', 'stats-procedures', 'profiles', 'perf-officers', 'feedback-reports', 'satisfaction-level', 'profile'] },
  { role: 'PROCEDURE_MANAGER', path: '/procedure-manager', sections: ['dashboard', 'procedures', 'drafts', 'categories', 'forms', 'ai-knowledge', 'profile'] },
  { role: 'IT_ADMIN', path: '/admin', sections: ['overview', 'procedures', 'knowledge', 'accounts', 'users', 'wards', 'roles', 'integrations', 'audit', 'backup', 'notification-deliveries', 'system-settings', 'closures', 'analytics-jobs', 'profile'] },
];
const widths = [1440, 390];

/** Chờ phân hệ lazy tải xong và phiên khôi phục xong rồi mới đo/chụp. */
async function settle(page: Page) {
  await expect(page.getByText('Đang tải phân hệ làm việc', { exact: false })).toHaveCount(0, { timeout: 30_000 });
  await expect(page.getByText('Đang khôi phục phiên đăng nhập', { exact: false })).toHaveCount(0, { timeout: 30_000 });
  await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => undefined);
  await page.waitForTimeout(400);
}

async function layoutProblems(page: Page) {
  return page.evaluate(() => {
    const problems: string[] = [];
    if (document.documentElement.scrollWidth > innerWidth + 1) problems.push(`trang rộng ${document.documentElement.scrollWidth}px > ${innerWidth}px`);
    // Phần tử nhìn thấy vượt mép phải mà không nằm trong vùng cuộn ngang có chủ đích.
    const inScroller = (el: Element) => {
      for (let p = el.parentElement; p; p = p.parentElement) {
        const style = getComputedStyle(p);
        if (['auto', 'scroll', 'hidden', 'clip'].includes(style.overflowX)) return true;
      }
      return false;
    };
    for (const el of Array.from(document.querySelectorAll('main *'))) {
      const rect = el.getBoundingClientRect();
      if (!rect.width || !rect.height || rect.right <= innerWidth + 1) continue;
      const style = getComputedStyle(el);
      if (style.visibility === 'hidden' || style.position === 'fixed' || inScroller(el)) continue;
      problems.push(`${el.tagName.toLowerCase()}.${String(el.className).slice(0, 60)} vượt mép phải ${Math.round(rect.right)}px`);
      if (problems.length > 5) break;
    }
    return problems;
  });
}

for (const { role, path, sections } of workspaces) {
  for (const width of widths) {
    test(`rà soát ${role} ở ${width}px`, async ({ page }) => {
      test.setTimeout(420_000);
      await mockWorkspaceAuth(page, [role]);
      await mockCatalog(page);
      const errors: string[] = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.setViewportSize({ width, height: 900 });
      const report: string[] = [];
      for (const section of sections) {
        await page.goto(`${path}?section=${section}`);
        await settle(page);
        await expect(page.locator('main').first()).toBeVisible();
        const problems = await layoutProblems(page);
        if (problems.length) report.push(`${section}: ${problems.join('; ')}`);
        await page.screenshot({ path: `test-results/ui-sweep/${role}-${section}-${width}.png`, fullPage: true });
      }
      expect(errors, 'lỗi runtime').toEqual([]);
      expect(report, 'lỗi bố cục').toEqual([]);
    });
  }
}

test('rà soát trang công khai và đăng nhập ở 1440px và 390px', async ({ page }) => {
  test.setTimeout(420_000);
  await mockCatalog(page);
  await page.route('**/api/v1/auth/refresh-token', route => authReply(route, { status: 401, json: { code: 'auth.unauthorized' } }));
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  const report: string[] = [];
  for (const width of widths) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of ['/', '/thu-tuc', '/huong-dan', '/hoi-dap', '/dang-nhap', '/dang-ky', '/quen-mat-khau', '/khong-ton-tai']) {
      await page.goto(path);
      await settle(page);
      await expect(page.locator('main').first()).toBeVisible();
      const problems = await layoutProblems(page);
      if (problems.length) report.push(`${path}@${width}: ${problems.join('; ')}`);
      await page.screenshot({ path: `test-results/ui-sweep/public${path.replace(/\//g, '_') || '_home'}-${width}.png`, fullPage: true });
    }
  }
  expect(errors, 'lỗi runtime').toEqual([]);
  expect(report, 'lỗi bố cục').toEqual([]);
});
