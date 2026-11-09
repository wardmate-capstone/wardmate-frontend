# Đối chiếu toàn bộ Swagger Analytics với FE — cập nhật 09/11/2026

Nguồn: [Swagger Analytics](https://wardmate-analytics-system.blackmeadow-a2f12767.japaneast.azurecontainerapps.io/swagger/index.html), đặc tả `/swagger/v1/swagger.json` tải lại ngày 09/11/2026 và source BE tại `E:/wardmate-backend`. Đếm theo **method + path**: 29 thao tác nghiệp vụ (22 GET, 6 POST, 1 PUT); GET `/` chỉ nhận diện service. Giữ tên file cũ để không hỏng các liên kết bàn giao.

**Kết quả rà soát 09/11: 29/29 thao tác nghiệp vụ có adapter và nơi dùng trong UI/hook.** Chạy `node tests/analytics-api-coverage-check.mjs <đường-dẫn-swagger.json>` để đối chiếu tập method/path trong OpenAPI với từng adapter và consumer trong source FE. Script báo lỗi nếu Swagger thêm/bỏ API mà mapping chưa cập nhật, adapter bị bỏ hoặc không còn consumer. Đây là kiểm tra tĩnh; kiểm thử hành vi vẫn cần các suite liên quan và nghiệm thu tài khoản thật.

Các GET đã probe đủ 22/22 trên Analytics và 22/22 qua tuyến Gateway FE dùng: đều trả 401 không token, không có 404 ở các tuyến đã kiểm tra. Nhóm `/api/v1/system/*` dùng `/api/analytics-system` trước path; Analytics/jobs/feedback/notification admin giữ các tuyến ngắn đã probe hoạt động. Không thay base URL hàng loạt hoặc gọi mutation thật để đếm API.

Các path trong bảng đều có prefix `/api/v1/`.

| # | Method | Path sau prefix | UI gọi API |
|---|---|---|---|
| 1 | GET | `analytics/overview` | `ManagerOverviewView`, `ManagerAnalyticsView` |
| 2 | GET | `analytics/trends` | Tổng quan và thống kê hồ sơ Manager |
| 3 | GET | `analytics/procedures` | Thống kê thủ tục Manager |
| 4 | GET | `analytics/officers` | Hiệu suất cán bộ Manager |
| 5 | GET | `analytics/feedback/summary` | Tổng quan và phản hồi Manager |
| 6 | GET | `analytics/feedback` | Bảng phản hồi Manager |
| 7 | POST | `analytics/jobs/rebuild` | Admin → Cập nhật thống kê → chọn ngày, xác nhận |
| 8 | GET | `analytics/jobs/{jobId}` | Admin → tự theo dõi sau tạo hoặc tra cứu lần cũ |
| 9 | GET | `citizen/feedback/{applicationId}` | Công dân → mở modal đánh giá, kiểm tra đánh giá đã có |
| 10 | POST | `citizen/feedback/{applicationId}` | Công dân → gửi đánh giá đủ điều kiện |
| 11 | GET | `admin/notification-deliveries` | Admin → Phát thông báo → bộ lọc/phân trang |
| 12 | GET | `admin/notification-deliveries/{id}` | Chi tiết lượt phát và mở gửi lại để đọc revision mới nhất |
| 13 | GET | `admin/notification-deliveries/{id}/audit` | Lịch sử trong modal chi tiết, có trang trước/sau |
| 14 | POST | `admin/notification-deliveries/{id}/replay` | Gửi lại Dead/Blocked, có quyền manage và xác nhận rủi ro |
| 15 | GET | `system/settings` | Admin → Cấu hình hệ thống |
| 16 | GET | `system/settings/{key}` | Mở sửa cấu hình hoặc đọc lại sau conflict |
| 17 | PUT | `system/settings/{key}` | Lưu số ngày + lý do + expectedVersion |
| 18 | GET | `system/audit-logs` | Nhật ký hoạt động → Thay đổi cấu hình |
| 19 | GET | `system/audit-logs/{id}` | Modal chi tiết thay đổi cấu hình |
| 20 | GET | `system/audit-events` | Nhật ký hoạt động → Nghiệp vụ toàn hệ thống |
| 21 | GET | `system/audit-events/{id}` | Modal chi tiết sự kiện nghiệp vụ |
| 22 | GET | `system/health/services` | Admin → Giám sát dịch vụ → các thẻ targets thực |
| 23 | GET | `system/health/services/{serviceName}` | Modal chi tiết một dịch vụ |
| 24 | POST | `system/health/check-now` | Nút Kiểm tra ngay, 202 chỉ xếp hàng |
| 25 | GET | `system/health/history` | Bảng lịch sử với lọc ngày/service và phân trang |
| 26 | GET | `system/backups` | Admin → Sao lưu dữ liệu → danh sách/bộ lọc |
| 27 | POST | `system/backups` | Form tạo yêu cầu sao lưu, 202 Queued |
| 28 | GET | `system/backups/{id}` | Modal chi tiết và theo dõi Queued/Running có giới hạn |
| 29 | POST | `system/backups/{id}/verify` | Nút yêu cầu xác minh, đọc lại trạng thái trước khi gửi |

## Adapter và quyền

- `src/lib/api/analytics.ts`: 8 thao tác analytics/jobs và 2 thao tác citizen feedback; `src/hooks/useAnalytics.ts` và các view tương ứng đã gọi.
- `src/lib/api/systemAdministration.ts`: 7 thao tác TASK-34, hook `useSystemAdministration`.
- `src/lib/api/systemOperations.ts`: 8 thao tác health/backups, được gọi từ `ServiceHealthView` và `SystemBackupsView`.
- `src/lib/api/notificationAdmin.ts`: 4 thao tác notification admin, được gọi từ `NotificationDeliveriesView` và các modal con. Không còn hàm get chỉ được khai báo nhưng không dùng.
- Dùng client JWT và cấu hình Analytics sẵn có; không hardcode đường dẫn Swagger làm API base. Health/backups/TASK-34 cần IT_ADMIN. Notification admin còn cần quyền read, replay cần thêm manage; Manager và công dân giữ quyền/ngữ cảnh của từng API.
- GET `/` không có dữ liệu nghiệp vụ; không tạo nút UI gọi endpoint gốc chỉ để tăng số API. Các API nội bộ collector và SignalR không nằm trong danh sách Swagger này.

## Cập nhật dữ liệu và UX ngày 09/11

- `FeedbackDto` trên Swagger/BE đã có `applicationCode`, `procedureTitle`, `applicantName` nullable. Schema FE giữ các trường này; bảng phản hồi dùng trực tiếp dữ liệu Analytics khi có đủ, chỉ tra Workflow khi dữ liệu cũ thiếu. Góp ý dài mở bằng Xem đầy đủ góp ý, dùng được với bàn phím và cảm ứng, không chỉ dựa vào tooltip.
- Hiệu suất cán bộ đọc đủ các trang danh bạ, kiểm tra MANAGER + `iam.accounts.read` trước khi gọi API quản lý nhân sự; không dùng GUID thay tên khi không lấy được tên.
- Sao lưu cho chọn gợi ý hoặc nhập mã dịch vụ khác theo cấu hình BE. Gợi ý từ các bản sao lưu đang hiển thị và mã thường gặp không được coi là danh sách đã provision. BE xác minh target thực tế; không có API discovery nên không bịa target hoặc chặn mã hợp lệ chỉ vì thiếu trong dropdown.
- Các API admin còn lại giữ UI hiện có đã nối đầy đủ: lỗi không giả dữ liệu rỗng, chi tiết đọc mới, 202 chỉ là xếp hàng, mutation không tự retry, xung đột giữ nội dung/yêu cầu đọc lại.

## Những sai lệch đã xử lý phía FE

- Notification: default state không phải mọi trạng thái, chỉ nhóm cần xử lý; bỏ filter Failed, bổ sung Blocked/Sandbox; replay chỉ Dead/Blocked, không SMS, lý do trim 5–500 không ký tự điều khiển và bắt buộc acknowledgeDuplicateRisk. Gửi đúng revision từ chi tiết mới nhất, không tự retry sau lỗi; giữ lý do để đọc lại và quyết định gửi tiếp.
- Chi tiết lượt phát/audit tải độc lập; lỗi chi tiết không dùng lại dữ liệu dòng danh sách; lỗi audit không biến thành lịch sử rỗng thành công. Query keys có user/ID/trang và AbortSignal.
- Health hỗ trợ Unknown, not_checked, stale_observation; không hiển thị năm 0001/0ms giả là kết quả thực đo. 202 không được coi là quét hoàn tất; sau 3 giây đọc lại, đối chiếu checkedAtUtc.
- Backup: validate service/lý do/ngày/trang/ID/response; create202 là yêu cầu nền; theo dõi tối đa 20 lần, cách 3 giây khi Queued/Running, dừng khi kết thúc/lỗi/không xác định hoặc đóng modal. Verify đọc lại trạng thái, xác nhận hạn chế; lỗi cũng refetch vì BE có thể đã lưu errorCode.

## Giới hạn còn lại cần BE và môi trường thật

Không sửa BE trong lượt này. Source Verify hiện đã kiểm tra kích thước, SHA-256 và đọc archive bằng pg_restore; FE kiểm tra metadata Verified và lỗi tương ứng. Đây là xác minh tệp, chưa phải thử khôi phục dữ liệu; `RestoreTestedAtUtc=null` có thông báo riêng. Các phát hiện Verify ngày 03/11 trong tài liệu cũ là lịch sử, đã được cập nhật tại `BACKUP_VERIFY_COMPLETION_2026-11-04.md`. Chưa nghiệm thu runner/Blob/pg_restore trên Azure bằng phiên thật.

Swagger health/create backup còn mô tả response200 trong khi source trả202; adapter FE kiểm tra đúng202. Chưa có endpoint liệt kê backup targets, tra hoàn tất health theo requestId, tải file backup hoặc khôi phục. FE không bịa API hoặc danh sách targets đã provision.

Chưa có phiên MANAGER/IT_ADMIN/REGISTERED_CITIZEN thật để xác minh nghiệp vụ Azure. 401 chỉ xác nhận request tới lớp xác thực; không kết luận quyền, feature flags, migrations, worker hoặc dữ liệu đã sẵn sàng. Không đưa `/internal/audit/events` (HMAC giữa service), hub SignalR hoặc health probes vào UI nghiệp vụ để tăng số API. Các kết quả kiểm thử thực chạy được ghi trong `PROGRESS.md`, phân biệt mock với tích hợp môi trường thật.
