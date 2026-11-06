import { test, expect } from '@playwright/test';
import { mockWorkspaceAuth } from './fixtures/auth';
import { mockCatalog, draftId, catalogReply } from './fixtures/procedures';

test.describe('FE-09: Tạo phôi & Tải DOCX trực tiếp trên màn bản nháp AI (KB-04)', () => {
  test('Tạo phôi và tải DOCX trực tiếp cho biểu mẫu chưa liên kết, tự động lưu bản nháp', async ({ page }) => {
    await mockWorkspaceAuth(page, ['PROCEDURE_MANAGER']);
    const state = await mockCatalog(page);

    // Cấu hình bản nháp có 1 biểu mẫu chưa có formTemplateId
    state.detail.formDefinitions = [
      {
        formCode: 'DON_01',
        formName: 'Đơn đăng ký khai sinh',
        formType: 'DOCX_TEMPLATE',
        quantity: 1,
        isMandatory: true,
        caseCode: null,
      },
    ];

    let createTemplateCalled = false;
    let uploadDocxCalled = false;

    // Mock API POST /api/v1/form-templates
    await page.route('**/api/v1/form-templates', route => {
      if (route.request().method() === 'OPTIONS') return catalogReply(route, { status: 204 });
      if (route.request().method() === 'POST') {
        createTemplateCalled = true;
        const postData = route.request().postDataJSON();
        expect(postData.code).toBe('DON_01');
        expect(postData.title).toBe('Đơn đăng ký khai sinh');
        return catalogReply(route, {
          status: 201,
          json: {
            id: '99000000-0000-0000-0000-000000000099',
            code: postData.code,
            title: postData.title,
            fileDocxUrl: null,
            isActive: true,
            createdAtUtc: '2026-11-06T00:00:00Z',
            onlineReady: false,
          },
        });
      }
      return route.continue();
    });

    // Mock API POST /api/v1/form-templates/*/upload-docx
    await page.route('**/api/v1/form-templates/*/upload-docx', route => {
      if (route.request().method() === 'OPTIONS') return catalogReply(route, { status: 204 });
      if (route.request().method() === 'POST') {
        uploadDocxCalled = true;
        return catalogReply(route, {
          status: 200,
          json: {
            templateId: '99000000-0000-0000-0000-000000000099',
            fileName: 'don_mau.docx',
            fileDocxUrl: 'https://example.test/files/don_mau.docx',
          },
        });
      }
      return route.continue();
    });

    // Truy cập trực tiếp vào bản nháp
    await page.goto(`/procedure-manager?section=drafts&draft=${draftId}`);

    // Chuyển sang Tab 5: Biểu mẫu
    await page.getByRole('button', { name: /Biểu mẫu/ }).click();

    // Xác nhận thấy biểu mẫu chưa gắn phôi Word
    await expect(page.getByText('Chưa gắn phôi Word')).toBeVisible();

    // Bấm nút "Tạo phôi & tải DOCX"
    const createDocxBtn = page.getByRole('button', { name: 'Tạo phôi & tải DOCX' });
    await expect(createDocxBtn).toBeVisible();
    await createDocxBtn.click();

    // Xác nhận Modal mở ra với mã và tên đã được điền sẵn
    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible();
    await expect(modal.getByText('Tạo phôi & Tải tệp DOCX trực tiếp')).toBeVisible();

    const codeInput = modal.locator('input[placeholder="VD: DON_01"]');
    await expect(codeInput).toHaveValue('DON_01');

    const titleInput = modal.locator('input[placeholder="VD: Đơn xin cấp bản sao trích lục"]');
    await expect(titleInput).toHaveValue('Đơn đăng ký khai sinh');

    // Đính kèm tệp word .docx mẫu
    const fileChooserInput = modal.locator('input[type="file"]');
    await fileChooserInput.setInputFiles({
      name: 'don_mau.docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      buffer: Buffer.from('mock docx content binary buffer'),
    });

    // Bấm "Tải lên & Liên kết"
    await modal.getByRole('button', { name: /Tải lên & Liên kết/i }).click();

    // Modal đóng
    await expect(modal).toHaveCount(0);

    // Xác nhận gọi cả 2 API
    expect(createTemplateCalled).toBe(true);
    expect(uploadDocxCalled).toBe(true);

    // Badge "Chưa gắn phôi Word" biến mất vì biểu mẫu đã có formTemplateId
    await expect(page.getByText('Chưa gắn phôi Word')).toHaveCount(0);

    // Bản nháp được tự động lưu với formDefinitions có formTemplateId
    const draftPut = state.requests.find(r => r.method === 'PUT' && r.path.includes('/drafts/'));
    expect(draftPut).toBeDefined();
    const formsInDraft = (draftPut?.body as { formDefinitions?: Array<{ formTemplateId?: string }> })?.formDefinitions;
    expect(formsInDraft?.[0]?.formTemplateId).toBe('99000000-0000-0000-0000-000000000099');
  });

  test('Hiển thị khối cảnh báo hổ phách khi AI phát hiện chênh lệch số lượng biểu mẫu', async ({ page }) => {
    await mockWorkspaceAuth(page, ['PROCEDURE_MANAGER']);
    const state = await mockCatalog(page);

    // Thêm cảnh báo formDefinitions từ backend AIOCR
    const warningText = 'formDefinitions: Văn bản nguồn có 2 tệp mẫu (.doc/.docx) nhưng chỉ bóc tách được 1 biểu mẫu; kiểm tra cột "Mẫu đơn, tờ khai" và bổ sung mẫu còn thiếu.';
    // Override route trả về draft có warning này
    await page.route(`**/api/v1/procedure-manager/drafts/${draftId}`, route => {
      if (route.request().method() === 'OPTIONS') return catalogReply(route, { status: 204 });
      return catalogReply(route, {
        status: 200,
        json: {
          id: draftId,
          status: 'NeedsReview',
          pdfFileName: 'khai-sinh.pdf',
          payload: state.detail,
          warnings: [warningText],
          extractedText: 'Văn bản PDF kiểm thử',
          revision: state.revision,
          createdAt: state.detail.createdAt,
          updatedAt: state.detail.updatedAt,
        },
      });
    });

    await page.goto(`/procedure-manager?section=drafts&draft=${draftId}`);

    // Chuyển sang Tab 5: Biểu mẫu
    await page.getByRole('button', { name: /Biểu mẫu/ }).click();

    // Xác nhận khối cảnh báo màu hổ phách xuất hiện
    const alertBox = page.getByRole('alert').filter({ hasText: 'Lưu ý đối soát biểu mẫu từ AI:' });
    await expect(alertBox).toBeVisible();
    await expect(alertBox).toContainText('Văn bản nguồn có 2 tệp mẫu (.doc/.docx) nhưng chỉ bóc tách được 1 biểu mẫu');
  });
});