import { expect, test } from '@playwright/test';
import { authReply } from './fixtures/auth';
import { documentIds, mockDocumentWorkflow } from './fixtures/documentWorkflow';

const mockDossierAssistResponse = {
  applicationId: documentIds.application,
  analyzedAt: '2026-11-01T02:00:00Z',
  applicationStatus: 'UNDER_REVIEW',
  model: 'gemini-1.5-flash',
  overallAssessment: 'NEEDS_ATTENTION',
  summary: 'Tờ khai Word khớp số CCCD; chưa có giấy xác nhận cư trú CT07.',
  files: [
    {
      kind: 'SUBMISSION',
      id: documentIds.submission,
      checklistId: documentIds.checklist,
      checklistTitle: 'Tờ khai đăng ký',
      fileName: 'don_dang_ky_khai_tu.docx',
      analyzed: true,
      skipReason: null,
    },
    {
      kind: 'SUPPORTING_DOCUMENT',
      id: documentIds.supporting,
      checklistId: documentIds.checklist,
      checklistTitle: 'Căn cước công dân',
      fileName: 'cccd_mat_truoc.png',
      analyzed: true,
      skipReason: null,
    },
  ],
  extractedFields: [
    { name: 'Họ và tên người nộp', value: 'Nguyễn Văn A', source: 'don_dang_ky_khai_tu.docx' },
    { name: 'Số định danh CCCD', value: '079090001234', source: 'don_dang_ky_khai_tu.docx' },
  ],
  crossChecks: [
    {
      field: 'Số định danh CCCD',
      valueInForm: '079090001234',
      valueInDocument: '079090001234',
      sourceDocument: 'cccd_mat_truoc.png',
      result: 'MATCH',
      note: 'Trùng khớp 100% với ảnh CCCD.',
    },
    {
      field: 'Nơi cư trú',
      valueInForm: 'Số 12 Lê Lợi, Phường Bến Nghé, Quận 1',
      valueInDocument: null,
      sourceDocument: null,
      result: 'NOT_FOUND',
      note: 'Chưa có giấy xác nhận cư trú để đối soát.',
    },
  ],
  missingItems: ['Giấy xác nhận thông tin về cư trú (CT07)'],
  issues: ['Cần kiểm tra thẩm quyền đăng ký dựa trên nơi cư trú cuối cùng.'],
  suggestedComment: 'Đề nghị công dân bổ sung: Giấy xác nhận thông tin về cư trú (CT07) do Công an phường cấp theo quy định.',
  disclaimer: 'Kết quả do AI tạo để cán bộ tham khảo, không thay thế thẩm định pháp lý của cơ quan Một cửa.',
};

test.describe('Cán bộ thụ lý dùng Trợ lý AI kiểm tra hồ sơ (AI-OFFICER-ASSIST-01)', () => {
  test('hiển thị kết quả đối chiếu chéo, cảnh báo thiếu giấy tờ và nút chèn nhận xét gợi ý', async ({ page }) => {
    const state = await mockDocumentWorkflow(page, 'officer', 'UNDER_REVIEW');
    state.submissionStatus = 'Submitted';
    state.evidenceQuantity = 2;
    state.checklistStatus = 'COMPLETED';

    let assistCalled = false;

    await page.route(`**/api/v1/ai-ocr/applications/${documentIds.application}/dossier-assist`, (route) => {
      assistCalled = true;
      return authReply(route, { json: mockDossierAssistResponse });
    });

    await page.goto('/officer');
    await page.getByRole('button', { name: 'Tất cả hồ sơ', exact: true }).click();
    await page.getByRole('button', { name: 'Tiếp tục', exact: true }).click();

    // Chuyển sang tab "Bản khai & giấy tờ"
    const documentsTab = page.getByRole('button', { name: /Bản khai & giấy tờ/ });
    await expect(documentsTab).toBeVisible();
    await documentsTab.click();

    // Thấy thẻ Trợ lý AI kiểm tra hồ sơ
    await expect(page.getByText('Trợ lý AI kiểm tra hồ sơ Một cửa')).toBeVisible();
    const runBtn = page.getByRole('button', { name: 'Bắt đầu kiểm tra AI' });
    await expect(runBtn).toBeVisible();

    // Bấm nút kiểm tra AI
    await runBtn.click();
    await expect.poll(() => assistCalled).toBe(true);

    // Kiểm tra kết quả hiển thị
    await expect(page.getByText('Cần lưu ý kiểm tra đối soát')).toBeVisible();
    await expect(page.getByText('Tờ khai Word khớp số CCCD; chưa có giấy xác nhận cư trú CT07.')).toBeVisible();

    // Bảng đối chiếu chéo
    await expect(page.getByText('Bảng đối chiếu chéo thông tin')).toBeVisible();
    await expect(page.getByText('Trùng khớp 100% với ảnh CCCD.')).toBeVisible();
    await expect(page.getByText('Chưa có giấy xác nhận cư trú để đối soát.')).toBeVisible();

    // Giấy tờ còn thiếu
    await expect(page.getByText('Giấy tờ thành phần còn thiếu (1):')).toBeVisible();
    await expect(page.getByText('Giấy xác nhận thông tin về cư trú (CT07)', { exact: true })).toBeVisible();

    // Gợi ý nhận xét hành chính
    await expect(page.getByText('Gợi ý nhận xét hành chính cho Cán bộ Một cửa')).toBeVisible();
    const insertBtn = page.getByRole('button', { name: 'Chèn vào ô nhận xét' });
    await expect(insertBtn).toBeVisible();

    // Bấm chèn nhận xét vào form
    await insertBtn.click();

    // Kiểm tra đã tự động chuyển sang tab Nhận xét và điền nội dung gợi ý vào textarea
    await expect(page.getByRole('heading', { name: /Nhận xét trên phiên bản/ })).toBeVisible();
    const commentInput = page.getByLabel('Nội dung nhận xét');
    await expect(commentInput).toHaveValue(mockDossierAssistResponse.suggestedComment);
  });

  test('xử lý lỗi 429 ai.provider_busy và hiển thị đồng hồ đếm ngược Retry-After', async ({ page }) => {
    const state = await mockDocumentWorkflow(page, 'officer', 'UNDER_REVIEW');
    state.submissionStatus = 'Submitted';
    state.evidenceQuantity = 2;
    state.checklistStatus = 'COMPLETED';

    await page.route(`**/api/v1/ai-ocr/applications/${documentIds.application}/dossier-assist`, (route) => {
      return authReply(route, {
        status: 429,
        headers: { 'retry-after': '30' },
        json: {
          code: 'ai.provider_busy',
          title: 'Google Gemini đang bận hoặc quá tải hạn mức.',
          status: 429,
        },
      });
    });

    await page.goto('/officer');
    await page.getByRole('button', { name: 'Tất cả hồ sơ', exact: true }).click();
    await page.getByRole('button', { name: 'Tiếp tục', exact: true }).click();

    const documentsTab = page.getByRole('button', { name: /Bản khai & giấy tờ/ });
    await expect(documentsTab).toBeVisible();
    await documentsTab.click();

    const runBtn = page.getByRole('button', { name: 'Bắt đầu kiểm tra AI' });
    await expect(runBtn).toBeVisible();
    await runBtn.click();

    // Hiển thị đếm ngược thời gian chờ hạn mức
    await expect(page.getByText(/Chờ hạn mức:/)).toBeVisible();
  });
});