# Yêu cầu Backend còn tồn đọng (bản gộp duy nhất)

*Cập nhật 26/10/2026 · Frontend Team gửi Backend · Đối chiếu source BE `main` = `091b169` (24/10)*

File này **thay thế** các yêu cầu cũ. BE chỉ cần đọc file này.

**Các việc đã xong, không cần làm thêm:**
- Tạo tài khoản Manager / Procedure-manager.
- Phân công hồ sơ theo lĩnh vực:
  - field `categoryId/categoryName/assignedOfficer*/assignmentVersion`;
  - bộ lọc `categoryIds/scope/assignee/overdue/sort`;
  - trả hồ sơ, Manager giao/chuyển.
- `resubmitCount` trong danh sách.
- OTP quên mật khẩu / đổi mật khẩu.

## Tóm tắt

| # | Việc | Service | Ưu tiên | FE đang làm tạm |
|---|---|---|---|---|
| 1 | Bật thông báo trên Azure (RabbitMQ + worker) | Hạ tầng, Workflow, Analytics | **Cao** | Hub đã kết nối nhưng không nhận được thông báo |
| 2 | Thêm `applicantName` vào danh sách hồ sơ | ApplicationWorkflow | **Cao** | Gọi chi tiết từng dòng, tối đa 50 request mỗi trang |
| 3 | Loại bản nháp khỏi danh sách cán bộ/Manager | ApplicationWorkflow | Trung bình | Tự gửi `Status=…` |
| 4 | API thống kê phân công cho Manager | ApplicationWorkflow | Trung bình | 2 + số cán bộ request `pageSize=1` |
| 5 | API lịch sử thao tác của cán bộ | ApplicationWorkflow | Trung bình | Chỉ lưu tạm trên trình duyệt, tải lại là mất |
| 6 | Giảm độ trễ (cache, hạ tầng) | Workflow, DocumentForm, IAM, hạ tầng | Trung bình | Không làm được ở FE |
| 7 | Xác nhận bản đang chạy trên Azure | Tất cả | Cần trước khi nghiệm thu | — |

FE giữ nguyên workaround cho tới khi BE deploy. Khi BE xong, FE chỉ bỏ workaround, không đổi luồng nghiệp vụ.

---

## 1. Bật thông báo trên Azure

**Hiện tượng (test tay trên Azure ngày 24/10):**
- FE kết nối hub `/api/analytics-system/hubs/notifications` thành công.
- `GetNotifications` trả rỗng với tài khoản cán bộ, kể cả sau khi Manager chuyển hồ sơ cho cán bộ đó hoặc công dân nộp hồ sơ.

**Nguyên nhân theo code:** luồng thông báo đã có (commit `87cbbb0`), nhưng các cờ bật **mặc định tắt**:
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

## 2. `applicantName` trong danh sách hồ sơ

**Vấn đề:**
- `GET /api/v1/officer/applications` và `/pending` không có tên người nộp.
- FE phải gọi `GET /officer/applications/{id}` cho từng dòng để lấy tên. Trang 50 dòng có thể sinh 50 request, mỗi request khoảng 2 giây trên Azure.

**Cần làm:**
- Thêm cột `applicant_name` (nullable) vào `applications`. Lưu snapshot họ tên khi công dân nộp (`SUBMITTED`), lấy từ IAM profile hoặc claim `name`, giống cách lưu `AssignedOfficerName`.
- Thêm `string? ApplicantName = null` vào **cuối** `ApplicationSummaryDto` (`WorkflowContracts.cs:50-51`).
- Truyền giá trị ở `ApplicationReviewStore.Pending` (:43), `ListAll` (:99) và `ApplicationStore.List` (:25).
- Backfill hồ sơ cũ theo `UserId` nếu được; không được thì để `null` (FE hiện "Công dân").
- **Không** đưa CCCD hay số điện thoại vào summary.

**Response mong muốn:**
```json
{ "id": "…", "applicationCode": "HS-20261024-00000037", "status": "SUBMITTED", "applicantName": "Nguyễn Đức Anh" }
```

## 3. Loại bản nháp khỏi danh sách cán bộ/Manager

**Vấn đề:**
- `ListAll` (`ApplicationReviewStore.cs:51-52`) chỉ lọc theo phường và loại người gọi, nên trả cả `DRAFT` của công dân khác.
- FE chặn bằng cách tự gửi `Status=…`, nhưng bản nháp công dân tự hủy (`CANCELLED`, chưa từng nộp) vẫn lọt.

**Cần làm:** thêm điều kiện mặc định trong `ListAll`:
```csharp
q = q.Where(x => x.Status != ApplicationStates.Draft && x.SubmittedAt != null);
```
Nếu `SubmittedAt` không phải mốc nộp lần đầu thì dùng `FirstSubmittedAtUtc`.

**Kiểm thử:** công dân tạo nháp rồi tự hủy; cán bộ gọi danh sách không có `status` thì không thấy hồ sơ đó.

## 4. API thống kê phân công cho Manager

**Vấn đề:**
- Màn "Giám sát hồ sơ" cần 3 nhóm số: số hồ sơ chưa phân công, số quá hạn, và số hồ sơ đang xử lý của từng cán bộ.
- FE đang lấy bằng nhiều request `pageSize=1`. Phường có 20 cán bộ thì mỗi lần mở là 22 request.

**Cần làm:** `GET /api/v1/manager/applications/assignment-summary`
- Quyền: `workflow.assign.manage` (hoặc `workflow.queue.read`), chỉ trong phường của Manager.
- `activeCount` đếm hồ sơ `UNDER_REVIEW`, `NEED_REVISION`, `DOCUMENTS_READY` có `AssignedOfficerId = officerId`.
- `overdue` dùng cùng quy tắc với bộ lọc `Overdue=true` hiện có.
- Chỉ trả cán bộ có hồ sơ; cán bộ không có trong mảng thì FE hiểu là 0.
- Lỗi: 401, 403, 503 `workflow.iam_unavailable`.

**Response:**
```json
{ "unassignedSubmitted": 4, "overdue": 2, "officers": [ { "officerId": "…", "activeCount": 3, "overdueCount": 1 } ] }
```

## 5. API lịch sử thao tác của cán bộ

**Vấn đề:**
- BE đã có dữ liệu trong `ApplicationStatusHistory` (`ChangedBy`, `FromStatus`, `ToStatus`, `Reason`) và `ApplicationAssignmentHistory` (`ActorId`, `Action`, `Reason`).
- Nhưng chỉ trả theo từng hồ sơ, nên màn "Lịch sử xử lý" của cán bộ không có dữ liệu thật.

**Cần làm:** `GET /api/v1/officer/activity?page=1&pageSize=20&from=&to=&action=`
- Quyền: `workflow.queue.read`. Chỉ trả thao tác của người gọi. Manager có thể truyền `officerId` để xem cán bộ trong phường mình (tùy chọn).
- Gộp 2 nguồn trên, sắp `createdAt` giảm dần, phân trang ở server.
- `source`: `STATUS` | `ASSIGNMENT`.
- `action`: giá trị `ToStatus`, hoặc `CLAIM`/`RELEASE`/`ASSIGN`/`TRANSFER`.
- `applicantName` có sau khi làm mục 2; chưa có thì bỏ trường này.

**Response:**
```json
{
  "items": [
    { "id": "…", "source": "STATUS", "action": "NEED_REVISION", "applicationId": "…",
      "applicationCode": "HS-20261024-00000035", "procedureTitle": "Thủ tục đăng ký khai tử",
      "applicantName": "Nguyễn Đức Anh", "reason": "Thiếu chữ ký", "createdAt": "2026-10-24T11:29:00Z" }
  ],
  "page": 1, "pageSize": 20, "total": 37
}
```

## 6. Giảm độ trễ

**Số đo:**

| Request | Thời gian |
|---|---|
| `GET /applications/{id}/contents` (DocumentForm) | 3,9–6,2 s |
| `submit` / `resubmit` | 4–5,5 s |
| Danh sách / chi tiết Workflow | 2,2–2,8 s |
| IAM, cả endpoint đơn giản `GET /api/v1/wards` (đo ngày 26/10) | 0,7–1 s |

**Cần làm:**
1. **Hạ tầng:** `minReplicas ≥ 1` cho `wardmate-application-workflow`, `wardmate-documentform`, `wardmate-iam` để tránh khởi động nguội. Kiểm tra vùng của database có gần `japaneast` không.
2. **Workflow `WorkflowAccessMiddleware.cs:18`:** đang gọi IAM `access-context` ở **mọi** request. Đề xuất cache theo token khoảng 30 giây.
   - FE đã tự tải lại lĩnh vực mỗi 60 giây, nên cache ngắn không ảnh hưởng nghiệp vụ.
   - Đánh đổi: khóa tài khoản sẽ có hiệu lực chậm tối đa bằng TTL. Không chấp nhận được thì bỏ qua đề xuất này.
3. **DocumentForm `ApplicationAccess.cs:34-37`:** mỗi lần kiểm tra quyền đều gọi sang Workflow. Đề xuất cache 15–30 giây **chỉ cho thao tác đọc**, khóa `(userId, applicationId)`.
4. Bật Application Insights cho các endpoint chậm nhất để biết thời gian nằm ở DB, ở lời gọi giữa service hay ở khởi động nguội.

## 7. Xác nhận bản đang chạy trên Azure

- `PROGRESS.md` / `CLAUDE_HANDOFF.md` của BE ghi các tính năng 23–24/10 "chưa apply migration, chưa deploy". Image Workflow gần nhất ghi là `workflow-20261017-01`.
- Nhưng FE đã test được phân công trên Azure ngày 24/10.

Nhờ BE xác nhận:
- Commit/image đang chạy của **IAM, Workflow, Analytics, DocumentForm, Gateway**.
- Đã apply migration `20261023173500_CategoryAssignment` (Workflow) và `20261024010000_ManagerAssignmentPermission` (IAM) chưa.
- Endpoint tạo Manager / Procedure-manager (`POST /api/v1/accounts/manager`, `/procedure-manager`) đã có trên Azure chưa.

---
*Khi xong mục nào, BE ghi commit/image vào cột "Xong" bên dưới để FE bỏ workaround tương ứng.*

| # | Xong (commit/image, ngày) |
|---|---|
| 1 | |
| 2 | |
| 3 | |
| 4 | |
| 5 | |
| 6 | |
| 7 | |
