import { expect, test, type Page } from '@playwright/test';
import { mockWorkspaceAuth } from './fixtures/auth';
import { mockCatalog, procedureId } from './fixtures/procedures';
import { mockDocumentWorkflow } from './fixtures/documentWorkflow';
import { mockWorkSchedules } from './fixtures/workSchedules';

/**
 * Rà soát giao diện chi tiết 28/11/2026: màn có dữ liệu mock, form và hộp thoại chính (ô nhập, nút thao tác).
 * Chụp ảnh vào test-results/ui-sweep-detail/ ở 1440 px và 390 px; kiểm tra tự động: không tràn ngang trang,
 * hộp thoại không vượt khung nhìn, không lỗi runtime. Mỗi bước độc lập để một màn lỗi không chặn màn khác.
 */
const widths = [1440, 390] as const;

async function settle(page: Page) {
  await expect(page.getByText('Đang tải phân hệ làm việc', { exact: false })).toHaveCount(0, { timeout: 30_000 });
  await expect(page.getByText('Đang khôi phục phiên đăng nhập', { exact: false })).toHaveCount(0, { timeout: 30_000 });
  await page.waitForLoadState('networkidle', { timeout: 8_000 }).catch(() => undefined);
  await page.waitForTimeout(350);
}

async function check(page: Page, name: string, width: number, report: string[]) {
  await settle(page);
  const problems = await page.evaluate(() => {
    const out: string[] = [];
    if (document.documentElement.scrollWidth > innerWidth + 1) out.push(`trang rộng ${document.documentElement.scrollWidth}px`);
    for (const dialog of Array.from(document.querySelectorAll('[role="dialog"]'))) {
      const r = dialog.getBoundingClientRect();
      if (r.width && (r.left < -1 || r.right > innerWidth + 1)) out.push(`hộp thoại vượt khung (${Math.round(r.left)}–${Math.round(r.right)})`);
      // Ô nhập/nút trong hộp thoại bị cắt mép phải mà hộp thoại không cuộn ngang.
      for (const el of Array.from(dialog.querySelectorAll('input, select, textarea, button'))) {
        const e = el.getBoundingClientRect();
        if (e.width && e.right > r.right + 1) { out.push(`${el.tagName.toLowerCase()} "${(el as HTMLElement).innerText?.slice(0, 30) || (el as HTMLInputElement).name || ''}" vượt mép hộp thoại`); break; }
      }
    }
    return out;
  });
  if (problems.length) report.push(`${name}@${width}: ${problems.join('; ')}`);
  await page.screenshot({ path: `test-results/ui-sweep-detail/${name}-${width}.png`, fullPage: true });
}

async function step(name: string, report: string[], run: () => Promise<void>) {
  try { await run(); } catch (error) { report.push(`${name}: không mở được (${String(error).split('\n')[0].slice(0, 160)})`); }
}

for (const width of widths) {
  test(`chi tiết công dân ở ${width}px`, async ({ page }) => {
    test.setTimeout(300_000);
    const report: string[] = []; const errors: string[] = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.setViewportSize({ width, height: 900 });
    await mockDocumentWorkflow(page, 'citizen', 'DRAFT');
    await step('citizen-detail-draft', report, async () => {
      await page.goto('/citizen?section=dossiers_all');
      await settle(page);
      await page.getByRole('button', { name: 'Chi tiết', exact: true }).first().click();
      await check(page, 'citizen-detail-draft', width, report);
    });
    await step('citizen-create-dossier', report, async () => {
      await page.goto('/citizen?section=dossiers_all');
      await settle(page);
      await page.getByRole('button', { name: 'Nộp hồ sơ mới' }).first().click();
      await expect(page.getByRole('dialog')).toBeVisible();
      await check(page, 'citizen-create-dossier', width, report);
    });
    await step('citizen-profile-edit', report, async () => {
      await page.goto('/citizen?section=profile');
      await settle(page);
      await page.getByRole('button', { name: /Chỉnh sửa/ }).first().click();
      await check(page, 'citizen-profile-edit', width, report);
    });
    expect(errors, 'lỗi runtime').toEqual([]);
    expect(report, 'lỗi bố cục').toEqual([]);
  });

  test(`chi tiết công dân giấy tờ sẵn sàng / đã tiếp nhận ở ${width}px`, async ({ page }) => {
    test.setTimeout(300_000);
    const report: string[] = []; const errors: string[] = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.setViewportSize({ width, height: 900 });
    const state = await mockDocumentWorkflow(page, 'citizen', 'DOCUMENTS_READY');
    (state as { qr?: boolean }).qr = true;
    await step('citizen-detail-ready', report, async () => {
      await page.goto('/citizen?section=dossiers_all');
      await settle(page);
      await page.getByRole('button', { name: 'Chi tiết', exact: true }).first().click();
      await check(page, 'citizen-detail-ready', width, report);
    });
    state.status = 'OFFICIALLY_RECEIVED';
    await step('citizen-detail-received', report, async () => {
      await page.goto('/citizen?section=dossiers_all');
      await settle(page);
      await page.getByRole('button', { name: 'Chi tiết', exact: true }).first().click();
      await check(page, 'citizen-detail-received', width, report);
    });
    expect(errors, 'lỗi runtime').toEqual([]);
    expect(report, 'lỗi bố cục').toEqual([]);
  });

  test(`workspace cán bộ ở ${width}px`, async ({ page }) => {
    test.setTimeout(300_000);
    const report: string[] = []; const errors: string[] = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.setViewportSize({ width, height: 900 });
    await mockDocumentWorkflow(page, 'officer', 'UNDER_REVIEW');
    await step('officer-workspace', report, async () => {
      await page.goto('/officer?section=apps-all');
      await settle(page);
      await page.getByRole('button', { name: 'Tiếp tục', exact: true }).first().click();
      await check(page, 'officer-workspace-sender', width, report);
      for (const [tab, name] of [['Tờ khai & giấy tờ', 'documents'], ['Nhận xét', 'comments'], ['Lịch sử', 'history']] as const) {
        await step(`officer-tab-${name}`, report, async () => {
          await page.getByRole('button', { name: tab, exact: true }).first().click();
          await check(page, `officer-workspace-${name}`, width, report);
        });
      }
      await step('officer-decision', report, async () => {
        await page.getByRole('button', { name: 'Trả về hàng đợi', exact: true }).first().click({ timeout: 10_000 });
        await expect(page.getByRole('dialog')).toBeVisible();
        await check(page, 'officer-release-dialog', width, report);
        await page.keyboard.press('Escape');
      });
    });
    expect(errors, 'lỗi runtime').toEqual([]);
    expect(report, 'lỗi bố cục').toEqual([]);
  });

  test(`lịch, nghỉ phép ở ${width}px`, async ({ page }) => {
    test.setTimeout(300_000);
    const report: string[] = []; const errors: string[] = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.setViewportSize({ width, height: 900 });
    await mockWorkSchedules(page);
    await step('officer-shifts', report, async () => {
      await page.goto('/officer?section=shifts&view=month');
      await check(page, 'officer-shifts-month', width, report);
    });
    await step('officer-shift-change', report, async () => {
      await page.getByRole('button', { name: 'Yêu cầu đổi ca', exact: true }).click({ timeout: 10_000 });
      await check(page, 'officer-shift-requests', width, report);
    });
    await step('officer-leave-create', report, async () => {
      await page.goto('/officer?section=leaves');
      await settle(page);
      await page.getByRole('button', { name: 'Tạo đơn nghỉ phép', exact: true }).click({ timeout: 10_000 });
      await expect(page.getByRole('dialog')).toBeVisible();
      await check(page, 'officer-leave-create', width, report);
    });
    expect(errors, 'lỗi runtime').toEqual([]);
    expect(report, 'lỗi bố cục').toEqual([]);
  });

  test(`quản lý thủ tục và trang công khai ở ${width}px`, async ({ page }) => {
    test.setTimeout(300_000);
    const report: string[] = []; const errors: string[] = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.setViewportSize({ width, height: 900 });
    await mockWorkspaceAuth(page, ['PROCEDURE_MANAGER']);
    await mockCatalog(page);
    await step('pm-procedure-detail', report, async () => {
      await page.goto('/procedure-manager?section=procedures');
      await settle(page);
      await page.getByRole('button', { name: 'Chi tiết', exact: true }).first().click();
      await check(page, 'pm-procedure-detail', width, report);
    });
    await step('pm-procedure-edit', report, async () => {
      await page.getByRole('button', { name: 'Chỉnh sửa', exact: true }).click();
      await expect(page.getByRole('dialog')).toBeVisible();
      await check(page, 'pm-procedure-edit', width, report);
      await page.keyboard.press('Escape');
    });
    await step('pm-procedure-create', report, async () => {
      await page.goto('/procedure-manager?section=procedures');
      await settle(page);
      await page.getByRole('button', { name: 'Thêm thủ tục' }).first().click();
      await expect(page.getByRole('dialog')).toBeVisible();
      await check(page, 'pm-procedure-create', width, report);
    });
    await step('pm-draft-open', report, async () => {
      await page.goto('/procedure-manager?section=drafts');
      await settle(page);
      await page.getByRole('button', { name: 'Mở bản nháp', exact: true }).first().click();
      await check(page, 'pm-draft-open', width, report);
    });
    await step('public-procedure-detail', report, async () => {
      await page.goto(`/thu-tuc/${procedureId}`);
      await check(page, 'public-procedure-detail', width, report);
    });
    expect(errors, 'lỗi runtime').toEqual([]);
    expect(report, 'lỗi bố cục').toEqual([]);
  });

  test(`quản lý và quản trị (hộp thoại) ở ${width}px`, async ({ page }) => {
    test.setTimeout(300_000);
    const report: string[] = []; const errors: string[] = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.setViewportSize({ width, height: 900 });
    await mockWorkspaceAuth(page, ['MANAGER', 'IT_ADMIN']);
    await mockCatalog(page);
    await step('manager-assign-category', report, async () => {
      await page.goto('/manager?section=profiles');
      await settle(page);
      await page.getByRole('button', { name: /Phân công lĩnh vực/ }).first().click();
      await expect(page.getByRole('dialog')).toBeVisible();
      await check(page, 'manager-assign-category', width, report);
      await page.keyboard.press('Escape');
    });
    await step('manager-create-officer', report, async () => {
      await page.getByRole('button', { name: /Thêm Cán bộ Một cửa/ }).first().click();
      await expect(page.getByRole('dialog')).toBeVisible();
      await check(page, 'manager-create-officer', width, report);
      await page.keyboard.press('Escape');
    });
    await step('admin-create-staff', report, async () => {
      await page.goto('/admin?section=accounts');
      await settle(page);
      await page.getByRole('button', { name: /Thêm cán bộ mới/ }).first().click();
      await expect(page.getByRole('dialog')).toBeVisible();
      await check(page, 'admin-create-staff', width, report);
    });
    expect(errors, 'lỗi runtime').toEqual([]);
    expect(report, 'lỗi bố cục').toEqual([]);
  });
}
