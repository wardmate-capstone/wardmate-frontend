# Yêu cầu BE: hiệu năng danh sách hồ sơ, thống kê phân công và lịch sử thao tác cán bộ

*Ngày 24/10/2026 · Frontend Team · Áp dụng sau WORKFLOW-ASSIGN-01 (đã deploy Azure)*

Tài liệu gồm 6 mục, phát hiện khi kiểm tra trọn vòng đời hồ sơ trên môi trường Azure:

| # | Mục | Service | Mức độ |
|---|---|---|---|
| A | Thêm `applicantName` vào danh sách hồ sơ | ApplicationWorkflow | **Cao**: FE đang gọi tới 50 request mỗi trang |
| B | Loại bản nháp khỏi danh sách của cán bộ/Manager | ApplicationWorkflow | Trung bình |
| C | API thống kê phân công cho Manager | ApplicationWorkflow | Trung bình |
| D | API lịch sử thao tác của cán bộ | ApplicationWorkflow | Trung bình: màn "Lịch sử xử lý" đang không có dữ liệu thật |
| E | Độ trễ trên Azure (cấu hình và cache) | DocumentForm, ApplicationWorkflow, hạ tầng | Cao về trải nghiệm |
| F | Thông báo phân công không tới cán bộ (RabbitMQ/worker trên Azure) | Hạ tầng, ApplicationWorkflow, AnalyticsSystem | **Cao**: FE đã kết nối nhưng không nhận được thông báo nào |

FE giữ nguyên các workaround hiện tại cho đến khi BE deploy. Khi BE xong, FE chỉ cần bỏ workaround, không đổi luồng nghiệp vụ.

---

## A. Thêm `applicantName` vào `ApplicationSummaryDto`

### Vấn đề
`GET /api/v1/officer/applications` và `/pending` không trả tên người nộp. Để hiển thị cột "Người dân", FE phải gọi `GET /officer/applications/{id}` cho **từng dòng** rồi đọc tên từ `formData` (`src/pages/officer/OfficerPage.tsx`, đoạn "auto-enrich").

- Mỗi trang 50 hồ sơ sinh tối đa 50 request chi tiết. Trên Azure mỗi request mất khoảng 2 giây.
- Hồ sơ không lấy được tên từ `formData` sẽ bị gọi lại mỗi lần danh sách tải lại, kể cả tải định kỳ.

### Đề xuất
- Thêm cột `applicant_name` (nullable) vào `applications` và **lưu snapshot lúc công dân nộp** (`SUBMITTED`), lấy họ tên từ IAM profile hoặc claim `name` của token công dân. Cách này giống `AssignedOfficerName`.
- Thêm `string? ApplicantName = null` vào cuối `ApplicationSummaryDto`, rồi truyền giá trị ở:
  - `ApplicationReviewStore.cs`: `Pending` và `ListAll`;
  - `ApplicationStore.cs`: danh sách của công dân, nếu muốn dùng chung.
- Migration và backfill hồ sơ cũ: lấy từ IAM theo `UserId`. Nếu chưa backfill được thì để `null`; FE sẽ hiện "Công dân".
- **Không** đưa số CCCD hay số điện thoại vào summary (dữ liệu nhạy cảm, chỉ cần ở trang chi tiết).

### Response mong muốn
```json
{ "id": "…", "applicationCode": "HS-20261024-00000037", "status": "SUBMITTED", "applicantName": "Nguyễn Đức Anh" }
```

---

## B. Loại `DRAFT` khỏi danh sách của cán bộ và Manager

### Vấn đề
`ListAll` (`GET /api/v1/officer/applications`) trả **mọi** hồ sơ trong phường, kể cả bản nháp công dân chưa gửi. Cán bộ không có nghiệp vụ gì với bản nháp, và việc trả bản nháp còn lộ thông tin công dân chưa muốn nộp.

Hiện FE luôn gửi `Status=SUBMITTED,UNDER_REVIEW,NEED_REVISION,DOCUMENTS_READY,OFFICIALLY_RECEIVED,CANCELLED` để tránh trường hợp này. Vẫn còn một lỗ hổng: **bản nháp mà công dân tự hủy** (`CANCELLED`, chưa từng nộp) vẫn lọt vào danh sách.

### Đề xuất
Trong `ApplicationReviewStore.ListAll`, thêm điều kiện mặc định:
```csharp
q = q.Where(x => x.Status != ApplicationStates.Draft && x.SubmittedAt != null);
```
Điều kiện `SubmittedAt != null` loại luôn bản nháp đã hủy mà chưa từng nộp. Nếu `SubmittedAt` không phải mốc lần nộp đầu, dùng `FirstSubmittedAtUtc`.

---

## C. API thống kê phân công cho Manager

### Vấn đề
Màn "Giám sát hồ sơ" của Manager hiện các thẻ: số hồ sơ chưa phân công, số quá hạn, và số hồ sơ đang xử lý của từng cán bộ. FE đang lấy các số này bằng nhiều request `pageSize=1` rồi đọc `total`, tổng cộng **2 + số cán bộ** request. Một phường có 20 cán bộ thì mỗi lần mở là 22 request.

### Đề xuất
`GET /api/v1/manager/applications/assignment-summary`
- Quyền: `workflow.assign.manage` (hoặc `workflow.queue.read`), chỉ trong phường của Manager.
- Response 200:
```json
{
  "unassignedSubmitted": 4,
  "overdue": 2,
  "officers": [
    { "officerId": "…", "activeCount": 3, "overdueCount": 1 }
  ]
}
```
- `activeCount`: số hồ sơ ở `UNDER_REVIEW`, `NEED_REVISION` hoặc `DOCUMENTS_READY` có `AssignedOfficerId = officerId`.
- `overdue`: dùng cùng quy tắc với bộ lọc `Overdue=true` hiện có.
- Chỉ trả cán bộ có hồ sơ. FE ghép với danh sách từ `GET /manager/officers`; cán bộ không xuất hiện được hiểu là 0.
- Lỗi: 401, 403, 503 `workflow.iam_unavailable`, giống các API Manager khác.

---

## D. API lịch sử thao tác của cán bộ

### Vấn đề
Mục "Lịch sử xử lý" của cán bộ hiện chỉ ghi tạm trong bộ nhớ trình duyệt khi cán bộ thao tác, nên tải lại trang là mất. BE đã có đủ dữ liệu:
- `ApplicationStatusHistory`: có `ChangedBy`, `FromStatus`, `ToStatus`, `Reason`;
- `ApplicationAssignmentHistory`: có `ActorId`, `Action`, `Reason`.

Nhưng BE chưa có API trả danh sách thao tác theo cán bộ, chỉ trả theo từng hồ sơ.

### Đề xuất
`GET /api/v1/officer/activity?page=1&pageSize=20&from=&to=&action=`
- Quyền: `workflow.queue.read`. Chỉ trả thao tác có `ChangedBy`/`ActorId` = người gọi. Manager có thể truyền `officerId` để xem của cán bộ trong phường mình (tùy chọn).
- Gộp 2 nguồn trên, sắp xếp `createdAt` giảm dần, phân trang ở server.
- Response 200:
```json
{
  "items": [
    {
      "id": "…",
      "source": "STATUS",
      "action": "NEED_REVISION",
      "applicationId": "…",
      "applicationCode": "HS-20261024-00000035",
      "procedureTitle": "Thủ tục đăng ký khai tử",
      "applicantName": "Nguyễn Đức Anh",
      "reason": "Thiếu chữ ký",
      "createdAt": "2026-10-24T11:29:00Z"
    }
  ],
  "page": 1, "pageSize": 20, "total": 37
}
```
- `source`: `STATUS` hoặc `ASSIGNMENT`. `action`: `ToStatus` (với `STATUS`) hoặc `CLAIM`/`RELEASE`/`ASSIGN`/`TRANSFER` (với `ASSIGNMENT`).
- `applicantName` phụ thuộc mục A. Nếu A chưa xong thì có thể bỏ trường này.

---

## E. Độ trễ trên Azure

### Số đo khi test tay ngày 24/10/2026 (DevTools, qua Vite proxy local)

| Request | Thời gian |
|---|---|
| `GET /api/v1/applications/{id}/contents` (DocumentForm) | 3,9–6,2 s |
| `POST .../submit`, `POST .../resubmit` | 4–5,5 s |
| `GET /api/v1/officer/applications`, `GET /applications/{id}` (Workflow) | 2,2–2,8 s |
| `GET /users/me` (IAM) | khoảng 1 s |

Với độ trễ này, mỗi thao tác của người dùng phải chờ nhiều giây. FE đã tối ưu phía mình: đóng hộp thoại ngay khi BE trả thành công, không tải lại thừa, và bớt request khi nhận hồ sơ.

### Đề xuất
1. **Hạ tầng:** đặt `minReplicas ≥ 1` cho `wardmate-application-workflow`, `wardmate-documentform` và `wardmate-iam` để tránh khởi động nguội (cold start). Đồng thời kiểm tra vùng của database (Supabase) có gần `japaneast` không, vì mỗi request đều chạm DB.
2. **DocumentForm `ApplicationAccess`:** mỗi request (kể cả `GET contents`) gọi HTTP sang Workflow `GET /applications/{id}`, rồi Workflow lại gọi IAM `access-context`. Đề xuất:
   - cache kết quả xác minh **cho thao tác đọc** trong khoảng 15–30 giây, theo khóa `(userId, applicationId)`;
   - thao tác ghi vẫn xác minh trực tiếp.
3. **Workflow `WorkflowAccessMiddleware`:** gọi IAM `access-context` ở mọi request. Có thể cache theo token trong khoảng 30 giây.
   - FE đã tự tải lại lĩnh vực của cán bộ mỗi 60 giây, nên cache ngắn không ảnh hưởng nghiệp vụ.
   - Lưu ý: khóa hoặc thu hồi tài khoản sẽ có hiệu lực chậm tối đa bằng TTL. Nếu không chấp nhận được thì bỏ qua đề xuất này.
4. Nếu được, bật log thời gian xử lý (Application Insights) cho 3 endpoint chậm nhất ở bảng trên để xác định thời gian nằm ở DB, ở lời gọi giữa các service hay ở khởi động nguội.

---

## F. Thông báo phân công không tới cán bộ trên Azure (cần kiểm tra cấu hình)

### Hiện tượng (test tay ngày 24/10/2026)
- FE kết nối NotificationHub qua gateway thành công: `negotiate` và các request `…/hubs/notifications?id=…` trả 200, trạng thái "đã kết nối".
- `GetNotifications` trả **danh sách rỗng** với tài khoản cán bộ. Danh sách vẫn rỗng sau khi Manager **chuyển cán bộ** cho tài khoản đó, và không có `ReceiveNotification` nào được đẩy về.
- Danh sách rỗng hoàn toàn, kể cả các thông báo cũ như "Có hồ sơ cần tiếp nhận" khi công dân nộp hồ sơ trong phường. Vì vậy nghi vấn là chuỗi Workflow → RabbitMQ → Analytics **chưa chạy trên Azure**, chứ không riêng lỗi của sự kiện phân công.

### Chuỗi xử lý theo code
`WorkflowOutboxCapture` ghi outbox → `WorkflowOutboxWorker` publish lên RabbitMQ (dừng ngay nếu `RabbitMq:Enabled = false`) → Analytics `WorkflowNotificationConsumer` → `NotificationInboxWorker` tạo `Notification` → hub đẩy về FE.

### Nhờ BE kiểm tra
1. Azure đã có RabbitMQ chưa, và `RabbitMq__Enabled=true` (cùng Host, Port, mật khẩu) đã đặt cho **cả** `wardmate-application-workflow` và `wardmate-analytics-system` chưa.
2. `Notifications__WorkersEnabled` (inbox và delivery worker) đã bật trên `wardmate-analytics-system` chưa.
3. Image Analytics trên Azure đã gồm commit `87cbbb0` (24/10, định tuyến sự kiện `APPLICATION_ASSIGNED`) chưa. Ghi chú gần nhất trong PROGRESS của BE vẫn là `harden-20261017-01`.
4. Truy vấn chỉ đọc: bảng outbox của Workflow có dòng `PublishedAt IS NULL` hoặc có `LastError` không; `notification_inbox` có dòng `Pending` hoặc `Dead` không.
5. Phụ: DevTools cho thấy SignalR đang dùng long polling (`fetch`), chưa lên WebSocket. Nhờ kiểm tra gateway YARP có cho WebSocket upgrade ở route `/api/analytics-system/hubs/notifications` không. Thông báo vẫn chạy được với long polling, chỉ chậm và tốn request hơn.

---

## Không cần BE làm thêm

- **Thông báo realtime cho cán bộ:** hub `/api/analytics-system/hubs/notifications` trên gateway đã hoạt động (negotiate trả 401 khi không có token). FE đang tích hợp theo hợp đồng TASK-25 (`GetNotifications`, `GetUnreadCount`, `MarkRead`, `ReceiveNotification`, `UpdateUnreadCount`).
- Nhờ BE xác nhận giúp: gateway cho phép WebSocket upgrade và CORS cho origin FE production ở route này. Nếu chưa, SignalR sẽ tự chuyển sang Server-Sent Events hoặc long polling, chậm hơn nhưng vẫn chạy.
