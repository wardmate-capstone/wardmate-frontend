# Đối chiếu toàn bộ Swagger Analytics với FE — 03/11/2026

Nguồn: [Swagger Analytics](https://wardmate-analytics-system.blackmeadow-a2f12767.japaneast.azurecontainerapps.io/swagger/index.html), đặc tả `/swagger/v1/swagger.json` đã tải trong phiên và source BE tại `E:/wardmate-backend`. Đếm theo **method + path**: 29 thao tác nghiệp vụ; GET `/` chỉ nhận diện service.

**Kết quả code: 29/29 thao tác nghiệp vụ có adapter và có luồng UI gọi được.** 9 thao tác còn thiếu ở lần rà soát trước đã được gắn. Đây là tích hợp code và kiểm thử mock/local proxy, chưa phải xác minh Azure với phiên IT_ADMIN thật.

Các path trong bảng đều có prefix `/api/v1/`.

| # | Method | Path sau prefix | UI gọi API |
|---|---|---|---|
| 1 | GET | `analytics/overview` | `ManagerOverviewView`, `ManagerAnalyticsView` |
| 2 | GET | `analytics/trends` | Tổng quan và thống kê hồ sơ Manager |
| 3 | GET | `analytics/procedures` | Thống kê thủ tục Manager |
| 4 | GET | `analytics/officers` | Hiệu suất cán bộ Manager |
| 5 | GET | `analytics/feedback/summary` | Tổng quan và phản hồi Manager |
| 6 | GET | `analytics/feedback` | Bảng phản hồi Manager |
| 7 | POST | `analytics/jobs/rebuild` | Admin → Job thống kê → xác nhận xếp lịch |
| 8 | GET | `analytics/jobs/{jobId}` | Admin → tra cứu/theo dõi job |
| 9 | GET | `citizen/feedback/{applicationId}` | Công dân → mở modal đánh giá, kiểm tra đánh giá đã có |
| 10 | POST | `citizen/feedback/{applicationId}` | Công dân → gửi đánh giá đủ điều kiện |
| 11 | GET | `admin/notification-deliveries` | Admin → Phát thông báo → bộ lọc/phân trang |
| 12 | GET | `admin/notification-deliveries/{id}` | Chi tiết lượt phát và mở gửi lại để đọc revision mới nhất (**mới gắn**) |
| 13 | GET | `admin/notification-deliveries/{id}/audit` | Lịch sử trong modal chi tiết, có trang trước/sau |
| 14 | POST | `admin/notification-deliveries/{id}/replay` | Gửi lại Dead/Blocked, có quyền manage và xác nhận rủi ro |
| 15 | GET | `system/settings` | Admin → Cấu hình hệ thống |
| 16 | GET | `system/settings/{key}` | Mở sửa cấu hình hoặc đọc lại sau conflict |
| 17 | PUT | `system/settings/{key}` | Lưu số ngày + lý do + expectedVersion |
| 18 | GET | `system/audit-logs` | Nhật ký hoạt động → Thay đổi cấu hình |
| 19 | GET | `system/audit-logs/{id}` | Modal chi tiết thay đổi cấu hình |
| 20 | GET | `system/audit-events` | Nhật ký hoạt động → Nghiệp vụ toàn hệ thống |
| 21 | GET | `system/audit-events/{id}` | Modal chi tiết sự kiện nghiệp vụ |
| 22 | GET | `system/health/services` | Admin → Giám sát dịch vụ → các thẻ targets thực (**mới**) |
| 23 | GET | `system/health/services/{serviceName}` | Modal chi tiết một dịch vụ (**mới**) |
| 24 | POST | `system/health/check-now` | Nút Kiểm tra ngay, 202 chỉ xếp hàng (**mới**) |
| 25 | GET | `system/health/history` | Bảng lịch sử với lọc ngày/service và phân trang (**mới**) |
| 26 | GET | `system/backups` | Admin → Sao lưu dữ liệu → danh sách/bộ lọc (**mới**) |
| 27 | POST | `system/backups` | Form tạo yêu cầu sao lưu, 202 Queued (**mới**) |
| 28 | GET | `system/backups/{id}` | Modal chi tiết và theo dõi Queued/Running có giới hạn (**mới**) |
| 29 | POST | `system/backups/{id}/verify` | Nút yêu cầu xác minh, đọc lại trạng thái trước khi gửi (**mới; còn giới hạn BE**) |

## Adapter và quyền

- `src/lib/api/analytics.ts`: 8 thao tác analytics/jobs và 2 thao tác citizen feedback; `src/hooks/useAnalytics.ts` và các view tương ứng đã gọi.
- `src/lib/api/systemAdministration.ts`: 7 thao tác TASK-34, hook `useSystemAdministration`.
- `src/lib/api/systemOperations.ts`: 8 thao tác health/backups, được gọi từ `ServiceHealthView` và `SystemBackupsView`.
- `src/lib/api/notificationAdmin.ts`: 4 thao tác notification admin, được gọi từ `NotificationDeliveriesView` và các modal con. Không còn hàm get chỉ được khai báo nhưng không dùng.
- Dùng client JWT và cấu hình Analytics sẵn có; không hardcode đường dẫn Swagger làm API base. Health/backups/TASK-34 cần IT_ADMIN. Notification admin còn cần quyền read, replay cần thêm manage; Manager và công dân giữ quyền/ngữ cảnh của từng API.
- GET `/` không có dữ liệu nghiệp vụ; không tạo nút UI gọi endpoint gốc chỉ để tăng số API. Các API nội bộ collector và SignalR không nằm trong danh sách Swagger này.

## Những sai lệch đã xử lý phía FE

- Notification: default state không phải mọi trạng thái, chỉ nhóm cần xử lý; bỏ filter Failed, bổ sung Blocked/Sandbox; replay chỉ Dead/Blocked, không SMS, lý do trim 5–500 không ký tự điều khiển và bắt buộc acknowledgeDuplicateRisk. Gửi đúng revision từ chi tiết mới nhất, không tự retry sau lỗi; giữ lý do để đọc lại và quyết định gửi tiếp.
- Chi tiết lượt phát/audit tải độc lập; lỗi chi tiết không dùng lại dữ liệu dòng danh sách; lỗi audit không biến thành lịch sử rỗng thành công. Query keys có user/ID/trang và AbortSignal.
- Health hỗ trợ Unknown, not_checked, stale_observation; không hiển thị năm 0001/0ms giả là kết quả thực đo. 202 không được coi là quét hoàn tất; sau 3 giây đọc lại, đối chiếu checkedAtUtc.
- Backup: validate service/lý do/ngày/trang/ID/response; create202 là yêu cầu nền; theo dõi tối đa 20 lần, cách 3 giây khi Queued/Running, dừng khi kết thúc/lỗi/không xác định hoặc đóng modal. Verify đọc lại trạng thái, xác nhận hạn chế; lỗi cũng refetch vì BE có thể đã lưu errorCode.

## Giới hạn còn lại cần BE và môi trường thật

Theo quyết định người dùng: **chỉ sửa FE**, chưa sửa BE. Xem `BE_REQUEST_BACKUP_VERIFICATION_2026-11-03.md` cho nhánh Verified khi chưa đọc file, kiểm tra header chưa đầy đủ và worker báo Succeeded khi thiếu Blob client. UI ghi “Máy chủ ghi nhận đã xác minh”, không tuyên bố tệp đã được bảo đảm toàn vẹn/khôi phục được; `RestoreTestedAtUtc=null` có thông báo riêng. Verify chưa được nghiệm thu bảo đảm phía BE.

Swagger health/create backup còn mô tả response200 trong khi source trả202; adapter FE kiểm tra đúng202. Chưa có endpoint liệt kê backup targets, tra hoàn tất health theo requestId, tải file backup hoặc khôi phục. FE không bịa API hoặc danh sách targets đã provision.

Chưa có phiên IT_ADMIN thật/targets/Blob để xác minh Azure. Các kết quả kiểm thử thực chạy được ghi trong `PROGRESS.md`, phân biệt mock với tích hợp môi trường thật.
