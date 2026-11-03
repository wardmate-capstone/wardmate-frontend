# Hoàn thiện API Analytics còn thiếu — 03/11/2026

Phạm vi: FE, theo yêu cầu mới của người dùng. Đã đọc source BE, FE và Swagger JSON đang chạy; Swagger có 29 thao tác nghiệp vụ và GET `/` nhận diện dịch vụ. TASK-34 trước đó đã gắn 7/7; lần này hoàn thiện 9 thao tác còn thiếu và sửa lệch nghiệp vụ ở màn liên quan. Không sửa BE, không gọi mutation production để thử.

Trạng thái thực hiện: đã gắn đủ 9 thao tác và sửa nghiệp vụ notification; toàn bộ 29/29 thao tác nghiệp vụ có luồng gọi. Typecheck/lint/build đạt; proxy 45/45; 52 ca chính + 9 hồi quy IAM + 1 ca notification cũ đã đạt qua các lượt chạy. Chi tiết kết quả và giới hạn thật tại `PROGRESS.md`, bản đồ API tại `ANALYTICS_API_COVERAGE_2026-11-03.md`, yêu cầu BE tại `BE_REQUEST_BACKUP_VERIFICATION_2026-11-03.md`.

## Quyết định đã chốt

- Người dùng chọn **chỉ làm FE**, chuyển lỗi xác minh sao lưu cho đội BE trước nghiệm thu Verify. Source `SystemBackups.Verify` có thể trả Verified khi không có Blob client/file local nhưng RunnerProvisioned=true; nhánh kiểm tra định dạng chỉ chạy với stream seek được. Worker cũng có thể ghi Succeeded khi thiếu Blob client rồi xóa file tạm. FE không thể xác minh file private hoặc sửa các bảo đảm này.
- UI vẫn gắn API Verify theo yêu cầu đủ lời gọi; hiển thị rõ kết quả là trạng thái máy chủ, không bảo đảm file toàn vẹn/khôi phục được. Có cảnh báo trước thao tác và phần thông tin hạn chế. Không thêm nút khôi phục/tải file vì không có API.

## Nghiệp vụ và bản đồ API → UI

| API | Mục đích và vị trí |
|---|---|
| GET `/api/v1/system/health/services` | Menu Dịch vụ tích hợp → Giám sát dịch vụ: thẻ trạng thái mới nhất của các targets thật, không hardcode số lượng |
| GET `/api/v1/system/health/services/{serviceName}` | Modal chi tiết một dịch vụ; xác minh tên trả về đúng dịch vụ chọn |
| POST `/api/v1/system/health/check-now` | Nút Kiểm tra ngay; 202 `{requestId,status:Queued}` chỉ xác nhận xếp hàng; làm mới sau 3 giây, không tuyên bố hoàn tất vì chưa có API tra requestId |
| GET `/api/v1/system/health/history` | Bảng lịch sử có bộ lọc service/ngày và phân trang server |
| GET `/api/v1/system/backups` | Menu Sao lưu dữ liệu: lọc service/trạng thái/ngày, phân trang server |
| POST `/api/v1/system/backups` | Form mã dịch vụ + lý do; 202 trả bản ghi Queued, mở chi tiết và theo dõi bằng GET; không báo sao lưu xong |
| GET `/api/v1/system/backups/{id}` | Modal chi tiết: trạng thái, kích thước, hash, các mốc thời gian và lỗi; theo dõi có giới hạn khi Queued/Running, dừng khi lỗi/trạng thái kết thúc/không xác định |
| POST `/api/v1/system/backups/{id}/verify` | Xác nhận yêu cầu kiểm tra bản Succeeded/Verified theo source; đọc lại trước thao tác, không tự retry; lỗi cũng làm mới vì BE có thể đã lưu errorCode |
| GET `/api/v1/admin/notification-deliveries/{id}` | Modal lượt phát thông báo đọc chi tiết mới từ server, không dùng dòng danh sách như dữ liệu mới nhất; đồng thời lịch sử phân trang riêng |

GET `/` là endpoint nhận diện service, không phải dữ liệu nghiệp vụ cần dựng màn hoặc gửi JWT tới gốc URL; không đưa vào chỉ tiêu 29 API nghiệp vụ.

## Quy tắc giao diện, validation và quyền

- Các API mới dùng client JWT, serviceUrls.analytics, TanStack Query và cache RAM theo user; không đổi auth core. Health/backup cần IT_ADMIN. Notification admin cần IT_ADMIN + `notifications.deliveries.read`, thao tác gửi lại thêm `.manage` đúng controller.
- Health: Healthy/Degraded/Unhealthy/Unknown có chữ và badge; Unknown/not_checked với Guid.Empty, thời điểm năm 0001 và responseTime=0 được trình bày “Chưa có kết quả”, không in năm 0001 hay coi là 0ms thực đo. Kết quả stale ghi rõ đã cũ; không tính SLA từ ảnh chụp này.
- Service health lấy từ targets trong response. Backup hiện chưa có API liệt kê targets: ô nhập mã dịch vụ theo cấu hình, gợi ý tên thường dùng/lịch sử chứ không coi danh sách gợi ý là danh sách đã provision. Service chưa có target trả 404 riêng.
- Create backup: service trim bắt buộc ≤64 ký tự; reason trim 3–500 ký tự. 409 báo đang có backup Queued/Running; 503 phân biệt chức năng tắt/runner chưa có. POST không tự retry; khi mất kết nối giữ form và yêu cầu kiểm tra danh sách trước khi chủ động thử lại.
- Lọc ngày theo Việt Nam → ISO UTC có Z; from≤to; page 1..100000, pageSize 1..100. Không áp giới hạn 366 ngày báo cáo sang lịch sử vận hành. Kiểm tra response/ID/trang/nullable/status chưa biết; unknown status không kích hoạt mutation.
- Notification: mặc định là nhóm Dead/Blocked/Unknown/Dispatching, không ghi “Tất cả”. Bỏ filter Failed không được BE hỗ trợ, thêm Blocked/Sandbox. Gửi lại chỉ Dead/Blocked và kênh khác SMS, reason trim 5–500 không ký tự điều khiển + acknowledgeDuplicateRisk=true + expectedRevision mới nhất; 202 là xếp lịch. Modal lỗi không hiển thị audit/dữ liệu dòng cũ. Dùng RHF/Zod cho form mới/sửa.
- Cả ba màn có loading/skeleton, rỗng/lỗi riêng, retry, bàn phím/focus Radix, layout mobile không tràn trang. Không render dữ liệu API bằng HTML. Hiển thị múi giờ Việt Nam và giải thích trạng thái đang chờ.

## Thứ tự triển khai và file

1. `src/lib/api/systemOperations.ts`: DTO/schema/adapter 8 method health/backup và lỗi tiếng Việt; tái sử dụng validation ngày/phân trang.
2. `src/pages/admin/SystemOperationsShared.tsx`, `ServiceHealthView.tsx`, `SystemBackupsView.tsx`: bộ lọc dùng RHF/Zod, bảng/thẻ, modal và mutations.
3. `src/pages/admin/AdminPage.tsx`: thay 2 placeholder bằng màn thật, giữ menu/luồng hiện có và tách theo danh tính.
4. `src/lib/api/notificationAdmin.ts`, `src/pages/admin/NotificationDeliveriesView.tsx`: gắn detail, đồng bộ validation/status/quyền và xử lý audit lỗi/race. Tái sử dụng API/query/components nền tảng.
5. `tests/fixtures/systemOperations.ts`, `tests/admin-system-operations.spec.ts`, `tests/admin-notification-deliveries.spec.ts`: mock đủ 9 method, trạng thái202,validation,lỗi,race,quyền,polling,mobile. Điều chỉnh fixture test cũ bị hợp đồng sai. `tests/api-proxy-check.mjs`: thêm 9 tuyến còn thiếu, không đổi target.
6. `docs/FRONTEND_SETUP.md`, `docs/PROGRESS.md`, tài liệu này: bảng kiểm 29/29, kết quả thực chạy và phần cần BE.

## Kiểm tra và nghiệm thu

- `npm run typecheck`, `npm run lint`, `npm run build`, `node tests/api-proxy-check.mjs`.
- Playwright mới + hồi quy TASK-34/notification/analytics liên quan; Edge, Vite4317 theo config hiện tại. Không báo test cũ như kết quả phiên này.
- Kiểm tra định tuyến và nơi gọi của 29 thao tác nghiệp vụ trong Swagger mới nhất; có adapter chưa đủ, cần có luồng UI gọi được. Các endpoint nội bộ/SignalR không thuộc Swagger này.
- Các ca chính: Unknown/stale health, service detail/history đúng tên/query, check-now202 không coi là complete; backup create/detail/status/verify đúngID,403/409/503, giữform và không retry POST, từ chối mutation trạng thái không hợp lệ; notification detail mới/audit phân trang/replay đúngrevision/quyền; đổi danh tính và response đến trễ không lộ dữ liệu cũ.
- Mock/proxy không xác minh Azure/migrations/runner/Blob. Cần phiên IT_ADMIN hợp lệ và BE đã provision targets để nghiệm thu thật. Verify chưa nghiệm thu bảo đảm toàn vẹn trước khi BE sửa và deploy lỗi đã nêu.
