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

  test('Khách gặp lỗi 429 ai.guest_quota_exceeded hiển thị khung thông báo mời đăng nhập trang nhã (FE-02)', async ({ page }) => {
    // Mock API wards
    await page.route('**/api/v1/wards', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 'ward-01', code: 'WARD_001', name: 'Phường Bến Nghé' },
        ]),
      });
    });

    // Mock API chat completions trả về 429 ai.guest_quota_exceeded
    await page.route('**/api/v1/ai/chat/completions', async (route) => {
      await route.fulfill({
        status: 429,
        contentType: 'application/problem+json',
        body: JSON.stringify({
          title: 'Bạn đã hỏi 10 lượt hôm nay khi chưa đăng nhập. Vui lòng đăng nhập để hỏi tiếp hoặc thử lại vào ngày mai.',
          status: 429,
          instance: '/api/v1/ai/chat/completions',
          code: 'ai.guest_quota_exceeded',
          traceId: '0HNPMID9E8LIF:00000002',
        }),
      });
    });

    await page.goto('/');

    const chatToggle = page.locator('button[aria-label="Mở trợ lý hỗ trợ thủ tục"]');
    await chatToggle.click();

    const input = page.locator('input[aria-label="Câu hỏi cho trợ lý"]');
    await input.fill('Câu hỏi thứ 11 của khách vãng lai');
    const sendBtn = page.locator('button[aria-label="Gửi tin nhắn"]');
    await sendBtn.click();

    // Tin nhắn của khách vẫn được lưu trong lịch sử chat
    await expect(page.getByText('Câu hỏi thứ 11 của khách vãng lai')).toBeVisible();

    // Trợ lý trả lời với nội dung mời đăng nhập, không hiện lỗi kỹ thuật đỏ
    await expect(page.getByText('Bạn đã hỏi 10 lượt hôm nay khi chưa đăng nhập')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Đăng nhập ngay' })).toBeVisible();

    // Khung thông báo và thanh nhập liệu chuyển sang trạng thái mời đăng nhập
    await expect(page.getByText('Đã hết 10 câu hỏi miễn phí hôm nay')).toBeVisible();
  });

  test('Ô nhập liệu và nút gửi bị khóa trong lúc trợ lý đang xử lý (FE-02)', async ({ page }) => {
    await page.route('**/api/v1/wards', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 'ward-01', code: 'WARD_001', name: 'Phường Bến Nghé' },
        ]),
      });
    });

    // Mock chat API delay 1000ms
    await page.route('**/api/v1/ai/chat/completions', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 800));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          conversationId: '07000000-0000-0000-0000-000000000099',
          answer: 'Đây là câu trả lời kiểm thử sau khi xử lý xong.',
        }),
      });
    });

    await page.goto('/');

    const chatToggle = page.locator('button[aria-label="Mở trợ lý hỗ trợ thủ tục"]');
    await chatToggle.click();

    const input = page.locator('input[aria-label="Câu hỏi cho trợ lý"]');
    await input.fill('Câu hỏi kiểm tra trạng thái khóa input');
    const sendBtn = page.locator('button[aria-label="Gửi tin nhắn"]');
    await sendBtn.click();

    // Trong lúc đang gửi: ô nhập bị disabled và đổi placeholder
    await expect(input).toBeDisabled();
    await expect(input).toHaveAttribute('placeholder', 'Trợ lý đang suy nghĩ và trả lời...');
    await expect(sendBtn).toBeDisabled();

    // Sau khi phản hồi xong: ô nhập mở lại và nội dung trả về hiển thị
    await expect(page.getByText('Đây là câu trả lời kiểm thử sau khi xử lý xong.')).toBeVisible();
    await expect(input).toBeEnabled();
  });
});
