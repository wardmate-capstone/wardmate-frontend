# WardMate — Hỗ trợ chuẩn bị hồ sơ hành chính

Landing page tiếng Việt cho Hệ thống Hỗ trợ Chuẩn bị và Hướng dẫn Thủ tục Hành chính cấp xã/phường.

Giao diện dùng bảng màu đỏ son, đỏ trầm, vàng và nền kem gợi không khí của một cổng dịch vụ công Việt Nam. Nội dung tập trung vào ba việc: giúp người dân tìm đúng thủ tục, hiểu quy trình tiền kiểm và bắt đầu chuẩn bị hồ sơ. Hệ thống không mô tả tiền kiểm như nộp hồ sơ chính thức; mã QR chỉ xuất hiện sau khi cán bộ duyệt tiền kiểm.

## Công nghệ

- React 19, TypeScript, Vite và Tailwind CSS 4.
- Radix UI Primitives cho menu mobile và FAQ có hỗ trợ bàn phím.
- Motion cho chuyển động nhẹ, tôn trọng thiết lập giảm chuyển động của người dùng.
- Embla Carousel cho khu vực thông báo có điều khiển rõ ràng.
- Class Variance Authority cho biến thể nút bấm; Sonner cho phản hồi thao tác.
- Lucide React cho icon hành chính thông thường.
- Be Vietnam Pro và Noto Serif với bộ ký tự tiếng Việt được đóng gói trong dự án.
- Playwright kiểm tra hành vi chính và responsive.

Landing page không dùng icon AI, robot, sparkle, não hoặc chatbot.

## Chạy dự án

```powershell
Set-Location D:\frontend
npm install
npm run dev
```

Mở địa chỉ do Vite hiển thị, thường là `http://localhost:5173`.

## Kiểm tra

```powershell
npm run typecheck
npm run lint
npm run build
npm run test:e2e
```

Bộ kiểm tra trình duyệt dùng Microsoft Edge đã cài trên Windows. Các trường hợp hiện có:

- Hiển thị nội dung chính và tìm kiếm tiếng Việt không dấu.
- Cảnh báo khi gửi ô tìm kiếm trống.
- FAQ và carousel có tên điều khiển phục vụ accessibility.
- Menu mobile mở/đóng đúng.
- Không tràn ngang tại 360px, 390px, 768px, 1024px và 1440px.

## Cấu trúc chính

```text
src/
  app/App.tsx                         Khung ứng dụng và cấu hình chuyển động
  components/home/NoticeCarousel.tsx Carousel thông báo
  components/layout/MainLayout.tsx  Header, menu mobile và footer
  components/ui/Button.tsx          Hệ biến thể nút bấm
  data/landing.ts                    Dữ liệu minh họa
  pages/HomePage.tsx                 Toàn bộ landing page
  styles/globals.css                 Token và style dùng chung
tests/landing.spec.ts                Kiểm tra giao diện
UI_UX_DESIGN_STANDARD.md             Chuẩn nghiệp vụ và UI/UX của dự án
```

## Lưu ý sản phẩm

- Nội dung thủ tục và cơ quan trên landing page hiện là dữ liệu minh họa.
- Không thêm lệ phí, thời hạn, căn cứ, địa chỉ hoặc số điện thoại khi chưa có nguồn được xác minh.
- Nút đăng nhập và xem chi tiết thủ tục hiện mới thể hiện UI; các trang nghiệp vụ sẽ được nối ở giai đoạn tiếp theo.
- Mọi màn hình mới phải tuân theo `UI_UX_DESIGN_STANDARD.md`.
