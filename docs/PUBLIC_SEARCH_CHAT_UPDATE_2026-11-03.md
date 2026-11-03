# Tìm kiếm công khai, lệ phí, PDF nguồn và chatbot — 03/11/2026

## Hành vi đã triển khai

- Trang chủ: Enter, nút Tìm kiếm và các từ khóa gợi ý đi đến `/thu-tuc?q=...`; giữ nguyên tiếng Việt qua URLSearchParams. Trang thủ tục đọc `q` và gọi API catalog với `keyword`. Từ khóa trống vẫn có hướng dẫn, không gửi tìm kiếm rỗng.
- Lệ phí: nội dung dài trong danh sách xuống dòng; bảng cách thức thực hiện giữ độ rộng đọc được và cuộn trong khung trên điện thoại. Số tiền định dạng tiếng Việt, VND/VNĐ/Đ hiển thị “đồng”; số 0 vẫn “Miễn phí”, không đổi giá trị API.
- Văn bản nguồn: một thẻ gọn dưới tên thủ tục, tên tệp tối đa hai dòng (title chứa đầy đủ), nút “Xem trước tệp”. Chỉ bấm mới gọi API source lấy URL có thời hạn. Modal dùng Radix chung, có mở tab mới, đóng Escape và trả focus; tái sử dụng PdfSource, giữ phóng to cho workspace quản lý.
- Chatbot: đặt tại MainLayout cho `/`, `/thu-tuc`, chi tiết thủ tục và alias `/thu-tuc-hanh-chinh/:id`, `/huong-dan`, `/hoi-dap`. Mỗi trang có một widget; giữ hội thoại khi điều hướng nội bộ. Chatbot trong workspace công dân vẫn hoạt động riêng.
- Logo: dùng BrandMark `/wardmate-mark.svg` của trang cho nút mở, đầu cửa sổ và avatar trợ lý.
- Khách chưa đăng nhập: localStorage phiên bản 2 gồm nội dung, conversationId, phường/xã, updatedAt/expiresAt; hạn **24 giờ kể từ tin nhắn cuối**. Reload không gia hạn; tin nhắn mới hoặc phản hồi mới gia hạn. Giữ tối đa 100 tin nhắn gần nhất trong bộ lưu trình duyệt. Hết hạn xóa nội dung và ID, dừng request đang chạy, yêu cầu tiếp theo bắt đầu hội thoại mới.
- Kiểm tra hết hạn khi khởi tạo, hết timer, tab được focus/hiển thị hoặc nhận thay đổi storage; nếu tab/trình duyệt đóng, việc dọn thực hiện khi mở lại. Đây là thời hạn lưu của FE trên trình duyệt, không thay chính sách lưu phía BE.
- Dữ liệu cũ chỉ chuyển đổi khi hợp lệ và còn trong 24 giờ theo timestamp thực; không gia hạn lại từ lúc chuyển đổi. Dữ liệu lỗi/quá hạn bị bỏ. Trình duyệt chặn storage vẫn chat trong RAM, không bảo đảm lưu qua reload. Chat đã đăng nhập không ghi tin riêng vào bộ lưu khách.

## File chính

`src/pages/public/HomePage.tsx`, `src/pages/public/ProcedureDetailPage.tsx`, `src/components/layout/MainLayout.tsx`, `src/components/ai/AiChatWidget.tsx`, `src/lib/guestChatStorage.ts`, `src/pages/procedure-manager/ProcedureDraftWorkspace.tsx`, `src/styles/globals.css`.

## Xác minh

- `npm run typecheck`, `npm run lint`: đạt.
- Playwright Edge: 49 ca khác nhau đạt qua hai lượt có chạy test: lượt đầu 45/47; hai lỗi fixture/assertion mới (nhãn menu sai và feeSummary mock vượt hợp đồng 255 ký tự) đã sửa. Lượt sau 10/10 đạt, gồm hai ca sửa và hai ca bổ sung (chat xác thực không lưu vào guest, đọc lịch sử chat); ca chuyển đổi dữ liệu cũ đã đạt lượt đầu. Các bộ liên quan: landing, procedures-ui, procedure-manager, public-search-chat và riêng ca lịch sử trong ai-verify-and-deliveries.
- Đã xem ảnh mock `test-results/public-source-preview-mobile.png`: modal không tràn ngang. PDF kiểm thử chỉ có header giả, ảnh không chứng minh render nội dung PDF thật. Ca lệ phí dùng nội dung dài hợp lệ, tên PDF dài và viewport 375px.
- `tests/full-audit.spec.ts` không thu thập được do import `chatInputSchema` không còn export trong API hiện tại; không sửa hợp đồng API hay tính ca đó là đạt. Cần cập nhật bộ test lịch sử này riêng.
- Chưa xác minh môi trường API thật hoặc deployment; không thay BE. Build và diff cuối được ghi tại `docs/PROGRESS.md` sau khi chạy xong.
