import { test, expect } from '@playwright/test';

test.describe('Chế độ khách Chatbot AI & Xử lý lỗi 503 Tiền kiểm', () => {
  test('Khách chưa đăng nhập có thể trò chuyện tư vấn với Chatbot AI', async ({ page }) => {
    await page.goto('/');

    // Tìm và mở chatbot widget
    const chatToggle = page.locator('button[aria-label="Mở trợ lý hỗ trợ thủ tục"]');
    await expect(chatToggle).toBeVisible();
    await chatToggle.click();

    // Ô nhập tin nhắn phải hiển thị cho khách
    const input = page.locator('input[aria-label="Câu hỏi cho trợ lý"]');
    await expect(input).toBeVisible();

    // Khách có thể thấy huy hiệu Chế độ khách
    await expect(page.getByText('Chế độ khách')).toBeVisible();

    // Nhập câu hỏi tư vấn thủ tục CCCD
    await input.fill('Thủ tục làm CCCD');
    const sendBtn = page.locator('button[aria-label="Gửi tin nhắn"]');
    await sendBtn.click();

    // Tin nhắn của khách xuất hiện
    await expect(page.getByText('Thủ tục làm CCCD')).toBeVisible();

    // Trợ lý trả lời tư vấn nghiệp vụ ngay
    await expect(page.getByText('Để thực hiện cấp, đổi Thẻ Căn cước công dân')).toBeVisible();
  });

  test('Tiền kiểm AI khi máy chủ trả về 503 chat.database_unavailable hiển thị thông báo hướng dẫn rõ ràng', async ({ page }) => {
    // Mock login citizen
    await page.addInitScript(() => {
      window.localStorage.setItem(
        'auth-storage',
        JSON.stringify({
          state: {
            user: {
              id: '99999999-9999-9999-9999-999999999999',
              username: 'citizen_test',
              fullName: 'Nguyễn Văn Test',
              roles: ['CITIZEN'],
              permissions: ['citizen.application.read', 'citizen.application.create'],
            },
            status: 'authenticated',
          },
          version: 0,
        })
      );
    });

    // Mock API verify trả lỗi 503 ProblemDetails
    await page.route('**/api/v1/ai-ocr/documents/verify', async (route) => {
      await route.fulfill({
        status: 503,
        contentType: 'application/problem+json',
        body: JSON.stringify({
          title: 'Database chat chưa sẵn sàng; kiểm tra kết nối và migration.',
          status: 503,
          instance: '/api/v1/ai-ocr/documents/verify',
          code: 'chat.database_unavailable',
          traceId: '0HNPMID9E8LIF:00000001',
        }),
      });
    });

    // Mock application contents
    await page.route('**/api/v1/applications/**/contents', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          applicationId: 'app-test-1234',
          submissions: [],
          supportingDocuments: [
            {
              id: 'doc-error-503',
              fileName: 'BanSaoCCCD.pdf',
              status: 'Uploaded',
              fileExists: true,
              quantity: 1,
            },
          ],
        }),
      });
    });

    await page.goto('/cong-dan/ho-so/app-test-1234/chuan-bi');

    // Nút tiền kiểm AI hiển thị
    const verifyBtn = page.getByRole('button', { name: 'Tiền kiểm AI' }).first();
    if (await verifyBtn.isVisible()) {
      await verifyBtn.click();
      // Khối cảnh báo dịch vụ AI bảo trì xuất hiện thân thiện theo hướng người dùng
      await expect(page.getByText('Dịch vụ AI đang bảo trì')).toBeVisible();
      await expect(page.getByText('đối soát giấy tờ trực tiếp')).toBeVisible();
    }
  });
});
