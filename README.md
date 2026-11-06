# WardMate Frontend

React, TypeScript và Vite. Dùng npm cùng `package-lock.json`.

## Chạy local để kiểm tra API Azure

```powershell
npm ci
Copy-Item .env.example .env.development.local
npm run dev
```

Chỉ sao chép file env khi chưa có cấu hình local; không ghi đè cấu hình riêng đang dùng. Mở http://localhost:5173 và dùng tài khoản trên môi trường Azure tương ứng.

`.env.example` là mẫu, **Vite không tự nạp file này**. `.env.development.local` được Git ignore nên không đi kèm khi clone source. Mẫu hiện khai báo các origin Azure và `VITE_USE_API_PROXY=true`: trình duyệt gọi `/api` ở localhost, Vite chuyển request tới các service. Nếu Azure đã đổi địa chỉ, cập nhật các biến URL trong file local, chỉ dùng origin, không thêm `/swagger` hoặc `/api/v1`. Khởi động lại Vite sau khi đổi cấu hình. Không đặt mật khẩu/token/API key trong biến `VITE_*`.

Không cần chạy backend local khi dùng các URL Azure này. Giữ hostname `localhost`, không đổi qua lại với `127.0.0.1` trong cùng phiên đăng nhập.

## Khi đăng nhập không được

- POST `/api/v1/auth/login` trả 404 tại localhost: kiểm tra file env đã tạo và server đã nạp proxy.
- Login trả 401: kiểm tra thông báo/mã lỗi IAM và tài khoản đúng môi trường.
- Login trả 200 nhưng chưa vào workspace: kiểm tra tiếp GET `/api/v1/users/me`; FE cần danh tính, roles và permissions hợp lệ.
- Refresh trả 401 lúc vừa mở trang, chưa đăng nhập: không đủ để kết luận đăng nhập bị lỗi. Sau đăng nhập, kiểm tra cookie HttpOnly và khả năng giữ phiên khi tải lại.
- 403: đọc mã lỗi, phân biệt CSRF với thiếu quyền. 5xx/lỗi mạng: kiểm tra service Azure và log proxy.

Không gửi mật khẩu, token hoặc cookie khi chia sẻ lỗi. Có thể cung cấp đường dẫn request, HTTP status và mã lỗi đã che dữ liệu cá nhân.

## Kiểm tra và giới hạn

```powershell
npm run typecheck
npm run lint
npm run build
```

Trang chủ chạy được không xác nhận API hoặc đăng nhập hoạt động. API deploy phải khớp hợp đồng FE; xem `docs/PROGRESS.md` và `docs/design-system-and-auth.md`. Đặc biệt, lịch tháng có thay đổi hợp đồng được ghi trong `docs/SCHEDULE_API_CONTRACT_RCA_AND_FIX_2026-11-06.md`; cần đối chiếu bản Workflow đang deploy trước khi nghiệm thu.
