# Yêu cầu Backend còn tồn đọng (bản gộp duy nhất)

*Cập nhật 29/10/2026 · Frontend Team gửi Backend · Đối chiếu source BE `main` = `15a7fee` (29/10)*

File này **thay thế** bản ngày 26/10. BE chỉ cần đọc file này.

**FE đã đối chiếu source, các mục này đã đúng yêu cầu, không cần sửa code:**
- Mục 2 cũ `applicantName` trong danh sách và chi tiết hồ sơ.
- Mục 3 cũ: danh sách cán bộ/Manager loại bản nháp và hồ sơ chưa từng nộp.
- Mục 4 cũ: `GET /api/v1/manager/applications/assignment-summary`.
- Mục 5 cũ: `GET /api/v1/officer/activity`, kèm route gateway `officer-activity-v1`.

FE đã bỏ workaround cho 4 mục trên trong source. FE **chỉ deploy sau khi BE xong mục 1 dưới đây**. Nếu FE lên trước thì danh sách hiện "Công dân" thay cho tên, bản nháp lọt vào hàng đợi, còn màn "Giám sát hồ sơ" và "Lịch sử xử lý" báo lỗi 404.

## Tóm tắt

| # | Việc | Service | Ưu tiên |
|---|---|---|---|
| 1 | Chạy migration và deploy các thay đổi ngày 29/10 | Workflow, Gateway | **Cao, chặn FE deploy** |
| 2 | Bật thông báo trên Azure (RabbitMQ + worker) | Hạ tầng, Workflow, Analytics | **Cao** |
| 3 | Giảm độ trễ (cache, hạ tầng) | Workflow, DocumentForm, IAM, hạ tầng | Trung bình |
| 4 | Xác nhận bản đang chạy trên Azure | Tất cả | Cần trước khi nghiệm thu |

---

## 1. Chạy migration và deploy thay đổi ngày 29/10

Theo `PROGRESS.md` của BE (WORKFLOW-FE-1026), code đã build đạt nhưng **chưa apply DB, chưa deploy**.

**Cần làm:**
1. Chạy `docs/sql/workflow-applicant-name-activity.sql` (migration `20261029005650_ApplicantNameAndActivity`) trên DB Workflow Azure. Script yêu cầu `CategoryAssignment` đã chạy trước. Image `15a7fee` có thêm `20261029010912_CommentWithdrawal` (`docs/sql/workflow-comment-withdrawal.sql`), nên chạy luôn trong cùng đợt.
2. Deploy image Workflow có commit `15a7fee` (hoặc mới hơn).
3. Deploy Gateway có commit `73a48a4`, gồm route `/api/v1/officer/activity` trong `appsettings.Production.json`.
4. Báo lại tag image và ngày deploy vào bảng "Xong" cuối file.

**Kiểm thử sau deploy:**
- `GET /api/v1/officer/applications` không gửi `status`: không có hồ sơ `DRAFT`. Có hồ sơ mới nộp thì kèm `applicantName`.
- `GET /api/v1/manager/applications/assignment-summary` bằng tài khoản Manager trả 200.
- `GET /api/v1/officer/activity?page=1&pageSize=20` bằng tài khoản cán bộ trả 200 qua gateway, không bị 404.

**Tùy chọn, không bắt buộc:** hồ sơ cũ có `applicantName = null` cho đến lần nộp lại. Nếu có cách backfill an toàn (ví dụ script một lần đọc họ tên từ IAM theo `UserId`), danh sách sẽ đỡ hiện "Công dân". Không làm được thì FE giữ nguyên cách hiển thị "Công dân".

## 2. Bật thông báo trên Azure

**Hiện tượng (test tay trên Azure ngày 24/10):**
- FE kết nối hub `/api/analytics-system/hubs/notifications` thành công.
- `GetNotifications` trả rỗng với tài khoản cán bộ, kể cả sau khi Manager chuyển hồ sơ cho cán bộ đó hoặc công dân nộp hồ sơ.

**Nguyên nhân theo code (vẫn đúng ở `15a7fee`):** luồng thông báo đã có (commit `87cbbb0`), nhưng các cờ bật **mặc định tắt**:
- `RabbitOptions.Enabled = false` (`WorkflowEvent.cs:9`);
- base `appsettings.json` của Workflow và Analytics không có mục `RabbitMq`;
- trong docker-compose, `RabbitMq__Enabled` và `Notifications__WorkersEnabled` đều lấy `${NOTIFICATIONS_ENABLED:-false}`.

**Cần làm:**
1. Có RabbitMQ trên Azure. Đặt `RabbitMq__Enabled=true` (kèm Host/Port/User/Password) cho **cả** `wardmate-application-workflow` và `wardmate-analytics-system`.
2. Đặt `Notifications__WorkersEnabled=true` cho `wardmate-analytics-system`.
3. Deploy image Analytics có commit `87cbbb0` (consumer Version 2, sự kiện `APPLICATION_ASSIGNED`).
4. Gateway YARP cho WebSocket upgrade ở route hub. Hiện SignalR đang rơi xuống long polling; vẫn chạy được nhưng chậm.

**Kiểm thử:**
- Manager chuyển hồ sơ cho cán bộ B: B nhận `ReceiveNotification`.
- Bảng outbox của Workflow không còn dòng `PublishedAt IS NULL` bị kẹt.

## 3. Giảm độ trễ

**Số đo (Azure, 24–26/10):**

| Request | Thời gian |
|---|---|
| `GET /applications/{id}/contents` (DocumentForm) | 3,9–6,2 s |
| `submit` / `resubmit` | 4–5,5 s |
| Danh sách / chi tiết Workflow | 2,2–2,8 s |
| IAM, cả endpoint đơn giản `GET /api/v1/wards` | 0,7–1 s |

**Cần làm:**
1. **Hạ tầng:** `minReplicas ≥ 1` cho `wardmate-application-workflow`, `wardmate-documentform`, `wardmate-iam` để tránh khởi động nguội. Kiểm tra vùng của database có gần `japaneast` không.
2. **Workflow `WorkflowAccessMiddleware.cs`:** vẫn gọi IAM `access-context` ở **mọi** request. Đề xuất cache theo token khoảng 30 giây.
   - BE ghi nhận đề xuất này trái quy tắc hiện tại "không cache, fail closed", đang chờ chủ dự án quyết định.
   - Đánh đổi: khóa tài khoản sẽ có hiệu lực chậm tối đa bằng TTL. Không chấp nhận được thì bỏ qua đề xuất này, chỉ làm phần hạ tầng.
3. **DocumentForm `ApplicationAccess.cs`:** mỗi lần kiểm tra quyền đều gọi sang Workflow. Đề xuất cache 15–30 giây **chỉ cho thao tác đọc**, khóa `(userId, applicationId)`.
4. Bật Application Insights cho các endpoint chậm nhất để biết thời gian nằm ở DB, ở lời gọi giữa service hay ở khởi động nguội.

## 4. Xác nhận bản đang chạy trên Azure

Nhờ BE xác nhận:
- Commit/image đang chạy của **IAM, Workflow, Analytics, DocumentForm, Gateway**.
- Đã apply các migration sau chưa:
  - `20261023173500_CategoryAssignment` (Workflow);
  - `20261024010000_ManagerAssignmentPermission` (IAM);
  - `20261029005650_ApplicantNameAndActivity` (Workflow, mục 1 ở trên);
  - `20261029010912_CommentWithdrawal` (Workflow, `docs/sql/workflow-comment-withdrawal.sql`). Migration này có timestamp sau migration của mục 1. Nếu deploy image `15a7fee` thì cần chạy cả hai.
- Endpoint tạo Manager / Procedure-manager (`POST /api/v1/accounts/manager`, `/procedure-manager`) đã có trên Azure chưa.

---
*Khi xong mục nào, BE ghi commit/image vào cột "Xong" bên dưới để FE deploy hoặc bỏ workaround tương ứng.*

| # | Xong (commit/image, ngày) |
|---|---|
| 1 | |
| 2 | |
| 3 | |
| 4 | |
