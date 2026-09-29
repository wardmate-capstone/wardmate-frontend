# Tiến độ và bàn giao WardMate

Cập nhật: 29/09/2026.
Mục đích: giúp phiên Codex mới tiếp tục đúng công việc và quyết định đã thống nhất.
Đọc cùng `../AGENTS.md`; luôn xác minh lại bằng code và Git trước khi hành động.

## FE-TASK-32 — Phân hệ Giao diện Cổng Dịch vụ Công dân (Citizen Workspace)

- Người dùng yêu cầu: Sao chép layout giao diện của Admin (`admin-layout`), tùy biến hệ thống thanh điều hướng (Sidebar) và các màn hình dành riêng cho người dân với cấu trúc phân cấp.
- Cấu trúc thanh điều hướng công dân đã triển khai tại `src/pages/citizen/CitizenPage.tsx`:
  - **Dashboard**: Thống kê số lượng hồ sơ (đang xử lý, cần bổ sung, đã duyệt, đã hoàn thành), biểu đồ diện tích Recharts phản ánh xu hướng nộp & tra cứu, tiện ích thao tác nhanh, hồ sơ gần đây và lưu ý khi đến Một cửa.
  - **Tra cứu thủ tục**: Bảng tra cứu thủ tục hành chính công dân theo từ khóa và phân loại lĩnh vực (Hộ tịch, Chứng thực, Địa chính), nút chuẩn bị hồ sơ.
  - **Hồ sơ của tôi** (Hỗ trợ mở rộng/thu gọn và badge đếm số lượng hồ sơ):
    - Tất cả hồ sơ
    - Bản nháp
    - Chờ tiền kiểm
    - Cần chỉnh sửa
    - Đã gửi lại
    - Đã duyệt
    - Đã hoàn thành
  - **Chuẩn bị hồ sơ** (Hỗ trợ mở rộng/thu gọn):
    - Checklist (Danh mục giấy tờ cần chuẩn bị theo thủ tục, phần trăm hoàn thiện, check/uncheck)
    - Giấy tờ đã tải lên (Kho tài liệu điện tử dùng chung: CCCD, giấy chứng sinh, xác nhận cư trú)
    - Biểu mẫu (Kho e-form, khai trực tuyến, tải mẫu Word/PDF)
    - PDF đã tạo (Bản in phiếu hẹn, hồ sơ điện tử có mã vạch / mã QR tiền kiểm)
  - **Thông báo**: Hộp thư thông báo tiến độ tiền kiểm từ cán bộ Một cửa, đánh dấu đã đọc.
  - **Mã QR hồ sơ**: Trình hiển thị mã QR hồ sơ điện tử để quét tại Ki-ốt lấy số thứ tự hoặc xuất trình cho cán bộ tiếp nhận.
  - **Đánh giá dịch vụ**: Tích hợp `CitizenFeedbackModal` và màn hình lịch sử khảo sát sự hài lòng của công dân.
  - **Hồ sơ cá nhân**: Quản lý thông tin định danh công dân VNeID Mức 2 (Họ tên, CCCD, Ngày sinh, Giới tính, SĐT, Email, Nơi thường trú).
  - **Đăng xuất**: Hộp thoại xác nhận đăng xuất an toàn với toast thông báo và điều hướng về `/dang-nhap`.
- Cấu hình Route trong `src/app/App.tsx`: Hỗ trợ cả 2 đường dẫn `/citizen/*` và `/cong-dan/*`.
- Export module tại `src/pages/citizen/index.ts`.
- Đã sửa lỗi layout thanh điều hướng: Bổ sung các class `.admin-nav-parent`, `.admin-subnav-tree`, `.admin-subnav-btn` và `shrink-0` cho khối user trong [src/styles/globals.css](file:///e:/wardmate-frontend/src/styles/globals.css) để các mục con phân cấp cây không bị dính chùm ngang, có đường kẻ dọc liên kết, thụt lề chuẩn, icon và badge riêng biệt.
- Đã sửa lỗi layout màn hình danh sách hồ sơ: Loại bỏ nút trùng lặp `+ Nộp hồ sơ mới` bị co hẹp chữ trong thanh toolbar, thay bằng dropdown chọn lĩnh vực và nút `Lọc` chuẩn admin; tối ưu hóa hiển thị ghi chú cán bộ (line-clamp-2) và khoảng cách các nút thao tác (`Đánh giá`, `Chỉnh sửa`, `Mã QR`).
- Đã kiểm tra ngày 30/09: `npm run typecheck`, `npm run lint` đạt 100%; Đã chụp ảnh xác minh thực tế trên trình duyệt (`citizen_all_records_verified_1790701740720.png`).

## FE-TASK-31 — Modal Đánh giá Mức độ Hài lòng Công dân (Feedback)

- Người dùng xác nhận phạm vi: chỉ làm giao diện đánh giá với mock data, chưa có backend API.
- Đã tạo `CitizenFeedbackModal` tại `src/components/feedback/CitizenFeedbackModal.tsx` và kiểu dữ liệu `src/types/feedback.ts`.
- Giao diện modal đánh giá:
  - Đánh giá từ 1 đến 5 sao có nhãn tương ứng (Rất không hài lòng -> Rất hài lòng), hỗ trợ hover preview, radio group chuẩn WCAG AA và bàn phím.
  - Danh sách tiêu chí chất lượng phục vụ đa chọn (Thủ tục rõ ràng, thời gian tiền kiểm nhanh, hướng dẫn dễ hiểu, giao diện trực quan,...).
  - Khung nhập góp ý chi tiết kèm đếm ký tự (tối đa 500 ký tự).
  - Xử lý submit với hiệu ứng loading và màn hình cảm ơn ghi nhận thành công.
  - Đóng modal an toàn bằng phím Escape, click outside hoặc nút "Để sau".
- Tích hợp vào `src/pages/ProfilePage.tsx`: hiển thị danh sách hồ sơ tiền kiểm gần đây và nút mở modal đánh giá dịch vụ cho hồ sơ đã hoàn thành.
- Kiểm tra ngày 28/09: `npm run typecheck`, `npm run lint`, `npm run build` đều đạt; 4/4 test trong `tests/feedback.spec.ts` đạt; toàn bộ test regression đạt.
- Phần chưa làm: API lưu trữ và thống kê đánh giá người dân lên server backend.

## FE-TASK-25 — Chuông Thông báo & Danh sách Thông báo Người dùng

- Người dùng xác nhận phạm vi: chỉ làm giao diện với mock data, chưa có backend API.
- Đã triển khai `NotificationBell` và `NotificationItem` tại `src/components/notifications/`, tích hợp trên Header desktop và mobile của `MainLayout.tsx`.
- Badge đếm số tin chưa đọc hiển thị trực quan (`unreadCount`), tự động ẩn khi số lượng = 0, có `aria-label` hỗ trợ screen reader.
- Dropdown/dialog danh sách thông báo:
  - Header: Tiêu đề "Thông báo", badge số tin mới, nút "Đã đọc tất cả".
  - Bộ lọc: Tab "Tất cả" và "Chưa đọc".
  - Danh sách tin: Thể hiện rõ loại thông báo (`need_revision`, `approved`, `submitted`, `reminder`), ngữ cảnh thủ tục/mã hồ sơ, thời gian định dạng tiếng Việt, trạng thái đọc/chưa đọc.
  - Thao tác: Đánh dấu đã đọc từng tin, đánh dấu tất cả đã đọc, xóa tin, điều hướng đến chi tiết hồ sơ (`/tai-khoan`).
  - Trạng thái rỗng: Hiển thị minh họa khi không có thông báo hoặc đã đọc hết.
  - Phím tắt & tương tác: Hỗ trợ phím Escape, click outside, bẫy focus.
- Mock data & State: `src/data/mockNotifications.ts` và hook `src/hooks/useCitizenNotifications.ts` đồng bộ qua `localStorage`.
- Dữ liệu chuẩn theo `UI_UX_DESIGN_STANDARD.md` mục 18.1 & 19 (hư cấu, minh họa, bám sát nghiệp vụ tiền kiểm).
- Kiểm tra ngày 28/09: `npm run typecheck`, `npm run lint`, `npm run build` đều đạt; 6/6 test trong `tests/notifications.spec.ts` đạt; toàn bộ test regression (`landing.spec.ts`, `procedure-detail.spec.ts`, `design-system.spec.ts`) đạt.
- Phần chưa làm: API thông báo thời gian thực (WebSocket/SSE/REST API backend), push notification, phân trang thông báo khi có số lượng lớn từ server.

## FE-TASK-08 — Chi tiết thủ tục và parser content_payload

- Người dùng xác nhận chưa có schema BE; cho phép dùng cấu trúc mẫu frontend. Chỉ giao diện/dữ liệu mẫu, không gọi API.
- Route mới `/thu-tuc/:procedureId`; ví dụ `/thu-tuc/demo-1`. Danh sách dùng link thật; quay về giữ query/lĩnh vực/trang. Menu công cộng giữ mục thủ tục active khi xem chi tiết.
- Trang có breadcrumb, tên/lĩnh vực/mã minh họa, mục lục, thông tin chung, bảng cách thức–thời hạn–lệ phí, bảng căn cứ pháp luật và cơ quan tiếp nhận.
- Mobile chuyển bảng thành từng khối có nhãn. Có trạng thái không tìm thấy mã, dữ liệu trống, JSON lỗi và lỗi một phần.
- `src/lib/procedureContent.ts` nhận object hoặc chuỗi JSON, kiểm tra schema v1 và kiểu dữ liệu; bỏ row sai, giữ phần đúng, chặn URL ngoài HTTP/HTTPS hoặc chứa credentials. React render text, không chèn HTML.
- `src/data/mockPublicProcedures.ts` bổ sung content_payload minh họa. Không lấy số liệu pháp lý từ mock quản trị; không bịa mức phí/thời hạn/căn cứ/cơ quan. Các phần chưa xác minh hiện chờ xác nhận.
- Tham khảo các mục từ kết quả tìm kiếm Cổng Dịch vụ công Quốc gia; mở trang trực tiếp timeout/503, chưa đối chiếu toàn bộ giao diện nguồn.
- Hợp đồng mẫu và cách nối BE: `docs/procedure-content-payload.md`. Cần BE cung cấp response thật trước khi coi parser này tương thích API.
- Kiểm tra 28/09: typecheck, build và lint đạt; build còn cảnh báo bundle lớn. 18 test (15 landing + 3 detail/parser) đạt.
- Đã xem ảnh chi tiết ở 1440/390px; kiểm tra không tràn ngang ở 1440/768/390/360px. Chưa kiểm tra zoom 200% hay screen reader thực tế.
- Ngày 28/09, người dùng yêu cầu chia FE-TASK-07 và FE-TASK-08 thành 2 commit theo hạng mục và push lên origin/main. Đối chiếu lịch sử Git và remote để xác định trạng thái đồng bộ; không coi yêu cầu này là quyền push cho task sau.
- Phần chưa làm: lấy API/dữ liệu chính thức, tải/lỗi mạng, biểu mẫu, chuẩn bị/gửi hồ sơ.

## FE-TASK-07 — Danh sách tra cứu thủ tục công cộng

- Phạm vi người dùng chốt: chỉ giao diện, chưa có BE/API; dùng dữ liệu minh họa tại `src/data/mockPublicProcedures.ts`.
- Đã hoàn thiện trang `/thu-tuc`: 15 mẫu thuộc 3 lĩnh vực, tìm từ khóa có/không dấu và không phân biệt hoa thường, lọc kết hợp, chip bộ lọc, xóa lọc và trạng thái không có kết quả.
- Phân trang 5 mục/trang; có số trang, Trước/Sau, tổng kết quả và khoảng đang xem. Đổi từ khóa/lĩnh vực về trang 1; giới hạn trang không hợp lệ.
- Từ khóa, lĩnh vực và trang nằm trên URL; hỗ trợ tải lại và Back/Forward. Chuyển trang đưa focus về tiêu đề kết quả, cuộn mượt và tôn trọng reduced-motion.
- Tái sử dụng Button/Input/Badge/Toast; không thêm dependency, không thay danh mục phổ biến của trang chủ.
- Giao diện ghi rõ dữ liệu minh họa. FE-TASK-08 đã thay nút thông báo bằng link đến trang chi tiết mẫu; giữ bộ lọc khi quay lại.
- Không thêm API giả, độ trễ tải giả, phân quyền hay backend. Loading/lỗi mạng và dữ liệu chính thức sẽ nối khi có API.
- Kiểm tra ngày 28/09: typecheck, lint, production build đạt; Vite vẫn cảnh báo bundle lớn. 15 test trong `tests/landing.spec.ts` đạt, gồm test mới cho phân trang/URL/lọc kết hợp/trang sai.
- Đã kiểm tra không tràn ngang ở 1440, 1024, 768, 390, 360px và từ khóa dài; xem ảnh desktop 1440/mobile 390. Chưa kiểm tra zoom trình duyệt 200%.
- Commit FE-TASK-07: `51a5b07` — danh sách, tìm kiếm, bộ lọc và phân trang. FE-TASK-08 được tách thành commit riêng, kèm tài liệu schema và bàn giao.
- Bước tiếp theo: người dùng duyệt giao diện; khi có API danh sách/category, thay nguồn mock và nối tìm kiếm/phân trang theo contract thực tế.

## Trạng thái nền tảng trước FE-TASK-07

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

Các kết quả dưới đây thuộc lượt triển khai core/auth ngày 26/09; kiểm tra riêng FE-TASK-07 được ghi ở đầu file:

- Production build đạt; có cảnh báo Vite về bundle lớn, chưa xử lý chia bundle.
- TypeScript và ESLint đạt; đã chạy lại sau chỉnh sửa cuối của Modal.
- 28 test riêng biệt đạt qua các lượt chạy: 10 JWT, 4 design-system, 14 landing.
- Đã xem ảnh mobile của form hết phiên và Modal; không thấy lỗi bố cục trong các ảnh đã kiểm tra.
- Không phải kiểm thử API thật, cũng không phải xác nhận toàn bộ test của mọi workspace đều đã chạy.
- Task tài liệu ngày 26/09 chỉ kiểm tra nội dung/đường dẫn/diff; không chạy lại build hay test ứng dụng.

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
