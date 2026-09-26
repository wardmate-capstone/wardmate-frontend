# Hướng dẫn làm việc trong WardMate

## Bắt đầu mỗi phiên

1. Đọc `docs/PROGRESS.md` để biết trạng thái bàn giao, quyết định đã chốt và việc còn chờ.
2. Kiểm tra `git status --short --branch`, lịch sử commit gần nhất và mã nguồn liên quan trước khi sửa.
3. Đối chiếu ghi chú với code hiện tại. Ghi chú là ảnh chụp trạng thái, không phải bằng chứng rằng test vẫn đạt hoặc API đã có.
4. Khi làm UI, đọc `UI_UX_DESIGN_STANDARD.md`. Khi làm core/auth, đọc `docs/design-system-and-auth.md`. Đọc `Officer.md` hoặc `Procedure Management.md` nếu công việc thuộc các workspace đó.
5. Tiếp tục theo yêu cầu mới nhất của người dùng; không tự thực hiện mọi mục trong danh sách chờ.

## Cách phối hợp với người dùng

- Trao đổi bằng tiếng Việt, rõ ràng và ngắn gọn. Nội dung giao diện dùng tiếng Việt có dấu.
- Người dùng muốn agent trực tiếp làm phần việc đã rõ, chọn phương án hợp lý cho dự án và trải nghiệm người dùng.
- Nếu còn mơ hồ ảnh hưởng đến nghiệp vụ, phạm vi hoặc hợp đồng API, hỏi trước khi thực hiện phần phụ thuộc; vẫn làm phần độc lập đã rõ.
- Không hỏi lại điều người dùng đã quyết định. Không tự bịa endpoint, response, token, dữ liệu thật hoặc kết quả kiểm thử.
- Báo kết quả bằng những gì đã làm, đã kiểm tra và giới hạn còn lại. Phân biệt “đã làm”, “đã kiểm thử bằng mock” và “đã tích hợp thật”.

## Nguyên tắc triển khai

- Đọc và lần theo luồng thực tế trước khi sửa. Ưu tiên tái sử dụng code, tính năng nền tảng và dependency đã cài.
- Viết giải pháp nhỏ nhất đáp ứng đủ yêu cầu; tránh abstraction, dependency hoặc refactor toàn dự án không cần thiết.
- Không cắt validation, xử lý lỗi, bảo mật hoặc accessibility để giảm số dòng.
- Giữ phong cách UI hiện tại. Ưu tiên component tại `src/components/ui`; không tạo bản sao chỉ khác tên.
- Dùng Modal dựa trên Radix và Toast chung dựa trên Sonner khi phù hợp.
- Giữ nguyên thay đổi chưa commit của người dùng. Không reset, ghi đè hoặc dọn file ngoài phạm vi task.
- Không lưu mật khẩu, token, API key hay dữ liệu cá nhân vào hướng dẫn, ghi chú hoặc commit.

## Bối cảnh và quyết định kỹ thuật

- Stack hiện tại: React, TypeScript, Vite, Tailwind CSS; dùng npm và `package-lock.json`.
- Alias import: `@/` trỏ tới `src/`.
- Dự án hỗ trợ chuẩn bị và tiền kiểm hồ sơ hành chính; không đồng nhất tiền kiểm với tiếp nhận chính thức.
- Backend auth chưa được cung cấp tại mốc bàn giao trong `docs/PROGRESS.md`. Chỉ đổi nhận định này khi có bằng chứng mới.
- HTTP client: `src/lib/api/index.ts`; logic refresh: `src/lib/api/createJwtClient.ts`.
- Không tự đặt hợp đồng API hoặc chọn nơi lưu refresh token khi chưa có thông tin backend.
- Khi phiên không còn hợp lệ: về `/dang-nhap`, giải thích hết phiên và giữ `returnTo` nội bộ an toàn. Điều hướng sau đăng nhập cần thành công thật.
- “Ghi nhớ đăng nhập”, khôi phục phiên sau reload và auth thật còn chờ backend; không mô tả là đã hoàn tất.
- Ponytail là công cụ cá nhân đã cài trên máy người dùng, không phải dependency frontend. Không giả định máy khác có plugin hoặc hooks đã được chấp thuận.

## Kiểm tra và Git

- Chọn kiểm tra phù hợp thay đổi: `npm run typecheck`, `npm run lint`, `npm run build`.
- Thay đổi auth/core: chạy các test liên quan trong `tests/jwt-client.spec.ts`, `tests/design-system.spec.ts`, `tests/landing.spec.ts`.
- Playwright hiện dùng Microsoft Edge và Vite ở cổng 4317; kiểm tra cấu hình thực tế nếu môi trường thay đổi.
- Với tài liệu thuần túy: kiểm tra nội dung, đường dẫn và diff; không cần chạy lại toàn bộ test.
- Không báo kết quả test cũ như vừa chạy. Ghi rõ kiểm tra chưa chạy hoặc không chạy được.
- Khi người dùng yêu cầu chia commit/push: nhóm theo hạng mục, vừa đủ, không tách quá nhỏ. Commit có tiêu đề rõ và phần mô tả hành vi, lý do, validation, giới hạn.
- Trước push: kiểm tra remote, nhánh, các commit sẽ gửi và trạng thái đồng bộ; không force push nếu chưa được yêu cầu rõ.
- Yêu cầu push của một task không mặc nhiên áp dụng cho mọi task sau.

## Cập nhật bàn giao

Sau một task thay đổi code, cấu hình hoặc quyết định dự án, cập nhật `docs/PROGRESS.md` trước khi kết thúc:
- Ngày, phạm vi và trạng thái thực tế.
- Việc đã làm, file/commit liên quan; chỉ ghi đã push khi đã xác minh.
- Kiểm tra đã chạy, kết quả và giới hạn.
- Việc còn chờ, thông tin cần người dùng cung cấp và bước tiếp theo.
- Chỉ giữ thông tin hữu ích để tiếp tục; thay trạng thái cũ đã lỗi thời, không chép toàn bộ hội thoại.

Không cần cập nhật ghi chú cho mỗi câu hỏi giải thích không làm thay đổi dự án. Khi mất ngữ cảnh, đọc lại hai file này thay vì suy đoán lịch sử.
