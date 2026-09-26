# Tiến độ và bàn giao WardMate

Cập nhật: 26/09/2026.
Mục đích: giúp phiên Codex mới tiếp tục đúng công việc và quyết định đã thống nhất.
Đọc cùng `../AGENTS.md`; luôn xác minh lại bằng code và Git trước khi hành động.

## Trạng thái hiện tại

- Hạng mục đã triển khai: Design System Core và khung Axios interceptor JWT.
- Auth được kiểm thử bằng mock; chưa kết nối API thật vì người dùng chưa có hợp đồng backend.
- Ba commit triển khai đã push lên `origin/main`; lần kiểm tra trước khi tạo tài liệu này: local/remote đồng bộ, workspace sạch.
- Remote: `https://github.com/wardmate-capstone/wardmate-frontend.git`.
- Đã hoàn thiện `AGENTS.md` và ghi chú tiến độ. Người dùng yêu cầu đưa hai tài liệu lên GitHub trong một commit tài liệu; đối chiếu lịch sử Git và `origin/main` để xác định trạng thái đồng bộ hiện tại.

## Nhu cầu đã chốt với người dùng

- Làm trước phần không cần API; người dùng sẽ cung cấp backend sau.
- Agent chọn giải pháp phù hợp, tối ưu cho dự án; hỏi trước khi phần việc có điểm mơ hồ thực sự.
- Khi hết phiên, đưa về đăng nhập và giữ đích quay lại để tiếp tục công việc.
- Khi được yêu cầu push, chia commit theo nhóm vừa đủ và mô tả đầy đủ.
- Người dùng muốn làm việc trong Codex CLI và tiếp tục được sau khi đóng VS Code; cần ghi chú bền vững giữa các phiên.
- Không yêu cầu cài thêm memory server trong task này.

## Đã hoàn thành

| Hạng mục | Kết quả / vị trí |
| --- | --- |
| UI core | `src/components/ui/`: Button, Input, Modal, Badge, Toast và export chung |
| Button | Thêm loading, disabled khi loading và aria-busy; giữ variant/size hiện có |
| Input | Label, hint, error, aria-describedby/aria-invalid; áp dụng vào đăng nhập/đăng ký |
| Modal | Radix, focus trap, Escape, trả focus cả khi mở bằng code, bố cục mobile |
| Toast | Module dùng chung; chuyển Toaster và thông báo các trang sang module này |
| JWT client | `src/lib/api/createJwtClient.ts`: gắn Bearer, gom refresh đồng thời, retry tối đa một lần, xử lý 401 đến trễ |
| Quản lý phiên | Chặn kết quả refresh của phiên cũ sau logout/đổi phiên; request hủy không gửi lại |
| Lỗi refresh | 401/403 từ refresh hoặc retry vẫn 401 thì hết phiên; lỗi mạng/server giữ phiên để thử lại |
| Điều hướng | `src/lib/authRedirect.ts`: returnTo an toàn; AuthPage hiện lý do hết phiên |
| Cấu hình | `.env.example` để trống VITE_API_BASE_URL; không gọi endpoint giả |
| Tài liệu | `design-system-and-auth.md`: cách dùng core và nối backend |
| Ví dụ UI | `tests/fixtures/ui.html`, `tests/fixtures/ui.tsx`: dùng khi chạy Vite dev |

Các modal/badge nghiệp vụ cũ chưa được chuyển đồng loạt sang core. Không tự mở rộng phạm vi refactor.

## Commit đã push

- `f2a76a2` — `feat(ui): complete reusable design system core`
- `04f23a7` — `feat(auth): add configurable Axios JWT refresh interceptor`
- `607b7d8` — `feat(auth-ui): integrate core inputs and session-expiry guidance`

## Bằng chứng kiểm tra gần nhất

Các kết quả dưới đây thuộc lượt triển khai core/auth trước task tài liệu hiện tại:

- Production build đạt; có cảnh báo Vite về bundle lớn, chưa xử lý chia bundle.
- TypeScript và ESLint đạt; đã chạy lại sau chỉnh sửa cuối của Modal.
- 28 test riêng biệt đạt qua các lượt chạy: 10 JWT, 4 design-system, 14 landing.
- Đã xem ảnh mobile của form hết phiên và Modal; không thấy lỗi bố cục trong các ảnh đã kiểm tra.
- Không phải kiểm thử API thật, cũng không phải xác nhận toàn bộ test của mọi workspace đều đã chạy.
- Task tài liệu hiện tại chỉ kiểm tra nội dung/đường dẫn/diff; không chạy lại build hay test ứng dụng.

## Phần đang chờ backend

Cần người dùng cung cấp:
1. Base URL và endpoint login, refresh, logout.
2. Method, request/response mẫu và định dạng lỗi.
3. Refresh token dùng cookie HttpOnly hay JSON; quy tắc credentials/CORS và rotation.
4. Cách khôi phục phiên, thời hạn token và yêu cầu “Ghi nhớ đăng nhập”.
5. Thông tin user/role và quy tắc truy cập nếu task tiếp theo bao gồm phân quyền.

Khi có contract:
- Nối refresh adapter trong `src/lib/api/index.ts` bằng transport riêng.
- Nối login thật với `skipAuth: true`, kiểm tra response rồi đặt access token.
- Chỉ sau login thành công mới quay lại `safeReturnTo(...)`.
- Nối logout và khôi phục phiên theo contract; bổ sung test tích hợp tương ứng.
- Không đánh dấu route protection hoặc phân quyền là đã hoàn tất từ interceptor hiện có.

Giới hạn hiện tại:
- Access token chỉ nằm trong bộ nhớ, reload sẽ mất.
- Form đăng nhập/đăng ký chỉ kiểm tra dữ liệu và thông báo; chưa xác thực người dùng.
- returnTo đã được giữ, nhưng luồng quay lại sau login thật chưa nối.
- Chuyển trang khi hết phiên không bảo đảm giữ nội dung form chưa lưu.

## Công cụ cá nhân trên máy người dùng

- Ponytail 4.10.0 đã được xác minh installed/enabled qua Codex CLI ở phiên thiết lập.
- Ảnh người dùng từng gửi cho thấy 3 hooks chờ review. Đã hướng dẫn chấp thuận, chưa có bằng chứng xác nhận trạng thái Active sau đó.
- Không coi Ponytail là bộ nhớ hội thoại hoặc dependency của repository.
- CLI đã xác minh hỗ trợ `codex resume` và `codex resume --last`.
- Alias PowerShell từng hướng dẫn chỉ có hiệu lực trong terminal đó; chưa thiết lập alias bền vững.
- Không tự cài/chỉnh plugin hoặc profile cá nhân khi chỉ đang làm task frontend.

## Bắt đầu lần làm việc tiếp theo

1. Đọc yêu cầu mới, file này và `../AGENTS.md`; kiểm tra Git.
2. Nếu chưa có API và chưa có task mới, báo phần đang chờ; không tự dựng backend hay giả định hợp đồng.
3. Kiểm tra lịch sử Git trước khi tạo commit để không lặp lại công việc đã hoàn thành.
4. Sau công việc có thay đổi, cập nhật ghi chú cho đúng trạng thái mới; không tích lũy các mục đã lỗi thời.
