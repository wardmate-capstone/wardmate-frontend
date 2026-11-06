import { test, expect } from '@playwright/test';
import { mockWorkspaceAuth } from './fixtures/auth';
import { mockCatalog, sampleProcedure } from './fixtures/procedures';

test.describe('FE-07: Liên kết mẫu đơn DOCX ở màn sửa thủ tục nhập tay (KB-04 #7, #12)', () => {
  test('Sửa thủ tục nhập tay: chọn mẫu từ document-forms, lưu PUT giữ nguyên checklist và gửi đủ formDefinitions', async ({ page }) => {
    await mockWorkspaceAuth(page, ['PROCEDURE_MANAGER']);
    const state = await mockCatalog(page);

    // Chuẩn bị thủ tục mẫu có sẵn checklist 2 mục và formDefinitions rỗng
    state.detail = {
      ...sampleProcedure,
      checklistSchema: [
        {
          checklistId: 'GT_01',
          itemName: 'Bản sao CCCD của người yêu cầu',
          submissionType: 'NOP',
          documentCopyType: 'CERTIFIED_COPY',
          quantity: 1,
          conditionNote: null,
          isMandatory: true,
          caseCode: null,
        },
        {
          checklistId: 'GT_02',
          itemName: 'Giấy chứng sinh bản gốc',
          submissionType: 'XUAT_TRINH',
          documentCopyType: 'ORIGINAL',
          quantity: 1,
          conditionNote: null,
          isMandatory: true,
          caseCode: null,
        },
      ],
      formDefinitions: [],
    };

    // Mock API document-forms trả về mẫu KB04 Tờ khai
    const kb04TemplateId = '11111111-2222-3333-4444-555555555555';
    await page.route('**/api/v1/procedure-manager/document-forms*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: kb04TemplateId,
            formCode: 'KB04',
            formName: 'KB04 Tờ khai',
            formType: 'DOCX_TEMPLATE',
          },
        ]),
      });
    });

    await page.goto('/procedure-manager');
    await page.getByRole('button', { name: 'Danh sách thủ tục', exact: true }).click();
    await page.getByRole('button', { name: 'Chi tiết', exact: true }).first().click();

    // Bấm Chỉnh sửa
    await page.getByRole('button', { name: 'Chỉnh sửa', exact: true }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // Chuyển sang Tab 5: Biểu mẫu
    await dialog.getByRole('button', { name: /Biểu mẫu/ }).click();

    // Xác nhận thấy mẫu KB04 Tờ khai từ kho document-forms
    await expect(dialog.getByText('KB04', { exact: true })).toBeVisible();
    await expect(dialog.getByText('KB04 Tờ khai')).toBeVisible();

    // Bấm chọn mẫu (nút có aria-label format: Mã · Tên)
    const chooseBtn = dialog.getByRole('button', { name: 'KB04 · KB04 Tờ khai' });
    await chooseBtn.click();

    // Mẫu đã được thêm vào vùng "Biểu mẫu đã gắn"
    await expect(dialog.getByRole('region', { name: 'Biểu mẫu đã gắn' }).getByText('KB04 Tờ khai', { exact: true })).toBeVisible();

    // Điền ngày hiệu lực
    const dateInput = dialog.getByLabel('Ngày hiệu lực của thay đổi');
    await dateInput.fill('2026-11-06');

    // Bấm Lưu thay đổi
    await dialog.getByRole('button', { name: 'Lưu thay đổi' }).click();
    await expect(dialog).toHaveCount(0);

    // Xác nhận request PUT gửi lên backend
    const putRequest = state.requests.find(r => r.method === 'PUT' && r.path.includes('/procedures/'));
    expect(putRequest).toBeDefined();

    // 1. checklistSchema vẫn giữ nguyên 2 mục ban đầu (không bị mất mục nào)
    expect(putRequest?.body?.checklistSchema).toHaveLength(2);
    expect(putRequest?.body?.checklistSchema[0].checklistId).toBe('GT_01');
    expect(putRequest?.body?.checklistSchema[1].checklistId).toBe('GT_02');

    // 2. formDefinitions có đúng mẫu vừa chọn với đầy đủ thuộc tính chuẩn Backend
    expect(putRequest?.body?.formDefinitions).toHaveLength(1);
    expect(putRequest?.body?.formDefinitions[0]).toMatchObject({
      formTemplateId: kb04TemplateId,
      formCode: 'KB04',
      formName: 'KB04 Tờ khai',
      formType: 'DOCX_TEMPLATE',
      quantity: 1,
      isMandatory: true,
      caseCode: null,
    });
  });

  test('ProcedureChecklistModal hiển thị thông báo hướng dẫn phân biệt giấy tờ và biểu mẫu DOCX', async ({ page }) => {
    await mockWorkspaceAuth(page, ['PROCEDURE_MANAGER']);
    await mockCatalog(page);

    await page.goto('/procedure-manager');
    await page.getByRole('button', { name: 'Danh sách thủ tục', exact: true }).click();
    await page.getByRole('button', { name: 'Chi tiết', exact: true }).first().click();

    // Bấm "Cập nhật giấy tờ (Checklist)"
    await page.getByRole('button', { name: 'Cập nhật giấy tờ (Checklist)', exact: true }).click();
    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible();

    // Kiểm tra dòng hướng dẫn rõ ràng
    await expect(modal.getByText('Lưu ý phân biệt Giấy tờ đính kèm và Biểu mẫu:')).toBeVisible();
    await expect(modal.getByText(/Mẫu đơn, tờ khai điện tử \(phôi Word DOCX\) được liên kết tại mục/)).toBeVisible();
  });
});

