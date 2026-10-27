# Hướng dẫn thực hiện và email tài khoản — 27/10/2026

## UI đã thay đổi

- Trang công khai mới `/huong-dan`: giới thiệu ngắn, chuẩn bị trước khi bắt đầu, mục lục và 6 bước từ tra cứu đến tải PDF/QR. Mỗi bước có việc cần làm và kết quả mong đợi; có hướng dẫn bổ sung hồ sơ, khôi phục mật khẩu và trường hợp chưa có QR.
- Menu desktop căn giữa, có trạng thái trang hiện tại. Link Hướng dẫn thực hiện ở desktop/mobile/footer mở trang mới. Anchor cũ `/#quy-trinh` vẫn tồn tại trên landing.
- Phần hướng dẫn phía dưới landing dùng chung dữ liệu 6 bước, có link đến đúng mục ở trang hướng dẫn. Phần JourneySteps phía trên vẫn là tóm tắt 4 giai đoạn tổng quát hiện có.
- Hồ sơ cá nhân công dân có trường **Email đăng ký**, lấy từ tài khoản hiện tại, cho xem/copy nhưng không chỉnh sửa. Khi sửa hồ sơ, email không bị thêm vào payload ProfileInput.

## Backend đã có quên mật khẩu bằng email chưa?

**Có implementation trong source IAM. Chưa xác minh việc gửi email trên Azure trong lượt này.**

| Bước | Hợp đồng đang có |
|---|---|
| Yêu cầu mã | `POST /api/v1/auth/password-otp/request` với `{emailOrUsername, channel: "EMAIL", purpose: "FORGOT_PASSWORD"}`; thành công trả 202 và thông báo chung |
| Xác minh và đổi mật khẩu | `POST /api/v1/auth/password-otp/verify-and-change` với `{emailOrUsername, otp, newPassword, confirmNewPassword, purpose: "FORGOT_PASSWORD"}`; thành công trả 200 |
| Địa chỉ nhận | Email đăng ký trong User, không phải địa chỉ tùy ý nhập vào hồ sơ cá nhân |
| OTP | 6 số ngẫu nhiên, hiệu lực 5 phút; tối đa 5 lần thử sai; gửi lại cách ít nhất 60 giây; mã mới vô hiệu mã cũ |
| Sau đổi mật khẩu | Cập nhật password hash/security stamp, thu hồi refresh token, đánh dấu OTP đã dùng; web xóa refresh cookie và yêu cầu đăng nhập lại |
| Điều kiện email | Email:Enabled và cấu hình SMTP Host/From/Username/Password phải đầy đủ; thiếu dịch vụ trả `iam.email_unavailable` (503) |

Các endpoint gửi mã trả thông báo chung để tránh tiết lộ tài khoản có tồn tại. Ngay cả kết quả 202 cũng không chứng minh thư đã được gửi/nhận: lỗi SMTP được xử lý bằng cách vô hiệu mã và giữ thông báo chung. Không suy diễn việc email đã được xác minh sau đăng ký từ sự tồn tại của luồng OTP quên mật khẩu.

Nguồn BE đã đọc, chỉ đọc source, không sửa hoặc chạy Git trong backend:

- [AuthController.cs](E:/wardmate-backend/src/Services/WardMate.Services.IAM/WardMate.Services.IAM.API/Controllers/AuthController.cs): route/request/response và xóa cookie.
- [PasswordOtpService.cs](E:/wardmate-backend/src/Services/WardMate.Services.IAM/WardMate.Services.IAM.Infrastructure/Security/PasswordOtpService.cs): gửi tới user.Email, hiệu lực/giới hạn mã và đổi mật khẩu/thu hồi phiên.
- [IamEmailSender.cs](E:/wardmate-backend/src/Services/WardMate.Services.IAM/WardMate.Services.IAM.Infrastructure/Security/IamEmailSender.cs): cấu hình và gửi SMTP.
- [AuthValidators.cs](E:/wardmate-backend/src/Services/WardMate.Services.IAM/WardMate.Services.IAM.Application/Validation/AuthValidators.cs): email bắt buộc, đúng định dạng, tối đa 255 ký tự khi đăng ký.

## Vì sao form hồ sơ trước đây không có email?

Email thuộc **User/tài khoản**, được nhập lúc đăng ký. `CurrentUserDto` có email, trả qua `/api/v1/users/me`. Form hồ sơ cá nhân trước đây chỉ lấy dữ liệu **UserProfile** nên không hiển thị email tài khoản.

[ProfileInput](E:/wardmate-backend/src/Services/WardMate.Services.IAM/WardMate.Services.IAM.Application/Profiles/ProfileRequests.cs) chỉ nhận fullName, identityNumber, phoneNumber, dateOfBirth, gender, permanentAddress, temporaryAddress; không nhận email. Vì vậy thêm email có thể sửa vào request profile sẽ không tạo ra chức năng đổi email thật. Lượt này hiển thị email tài khoản dạng chỉ đọc, không thêm endpoint hoặc thay đổi hợp đồng BE. Nếu muốn tự thay đổi email, cần một hợp đồng riêng có xác minh địa chỉ mới.

## File và cách kiểm tra

| File | Thay đổi |
|---|---|
| [GuidePage.tsx](../src/pages/public/GuidePage.tsx) | Trang hướng dẫn công khai mới, mục lục/anchor, nội dung hỗ trợ |
| [preparationGuide.ts](../src/data/preparationGuide.ts) | Dữ liệu 6 bước dùng chung cho landing và trang hướng dẫn |
| [App.tsx](../src/app/App.tsx) | Route `/huong-dan` |
| [MainLayout.tsx](../src/components/layout/MainLayout.tsx) | Căn giữa menu, active link, cập nhật đường dẫn menu/footer |
| [HomePage.tsx](../src/pages/public/HomePage.tsx) | Phần hướng dẫn 6 bước và link tới từng mục |
| [CitizenProfileView.tsx](../src/pages/citizen/views/CitizenProfileView.tsx) | Hiển thị email tài khoản dạng chỉ đọc |
| [guide-profile-email.spec.ts](../tests/guide-profile-email.spec.ts) | Kiểm tra menu giữa, điều hướng desktop/mobile, deep link, email và payload lưu |

Kiểm tra thủ công: từ trang chủ chọn Hướng dẫn thực hiện; thử từng link mục lục và khôi phục mật khẩu; thu viewport còn 320px. Sau đăng nhập công dân, mở Hồ sơ cá nhân và kiểm tra Email đăng ký; bật chế độ sửa, email vẫn chỉ đọc.

## Chốt giao diện và bàn giao commit

- Banner dùng `public/hero-architecture-bg.jpg`, cao tối thiểu 640px trên desktop, nội dung căn từ trên với padding 24–32px. Nền kem nối tiếp nội dung, không còn dải trắng ngắt bên dưới.
- Thanh menu cùng token đỏ `red-700` với nút Tìm kiếm; nút Đăng nhập đỏ đậm, giữ menu mobile trong viewport hẹp.
- Trang thủ tục bỏ khung viền đỏ, dùng header trải ngang sát menu, breadcrumb và tiêu đề H1 hiển thị; thêm gợi ý tìm kiếm, giữ bộ lọc/phân trang và phiên bản nhúng trong cổng công dân.
- Đợt này chia đúng 8 commit từ `d35365c`; 7 commit code/test đã push và xác minh remote ở `66e916c`. Tài liệu này cùng `PROGRESS.md` thuộc commit thứ 8; SHA cuối được đối chiếu bằng Git sau push. Log chẩn đoán sinh tự động không đưa lên Git.

## Kiểm tra cuối đã chạy — 27/10/2026

- `npm run typecheck`, `npm run lint`, `npm run build`, `git diff --check`: đạt. Build còn cảnh báo chunk lớn/annotation Zod và SignalR.
- Playwright: `guide-profile-email`, `landing`, `procedures-ui`, `auth-recovery`: **23/23 đạt**, API dùng mock, exit 0. Hai locator kiểm thử lĩnh vực được giới hạn trong bộ lọc để tránh trùng nút gợi ý. Không chạy lại toàn suite hoặc `full-audit` trong lượt chốt này.
- Chưa gửi OTP email thật, chưa nghiệm thu SMTP Azure; không sửa BE. Kết quả 31/31 của lượt phát triển trước không phải kết quả chạy lại sau các chỉnh UI cuối.
