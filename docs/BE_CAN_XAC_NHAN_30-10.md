# Việc Backend cần xác nhận và làm tiếp

*Ngày 30/10/2026 · FE gửi BE · Đối chiếu source BE `main` = `5bad4e4` và kết quả gọi thử Azure ngày 30/10*

Thay cho file `BE_REQUESTS_PENDING.md` ngày 29/10. BE chỉ cần đọc file này.

**FE đã kiểm tra, không cần BE làm lại:**
- Workflow trên Azure đã có `GET /api/v1/officer/activity`, `GET /api/v1/manager/applications/assignment-summary`, `POST .../comments/{commentId}/withdraw` và các API staffing/dispatch. Gọi qua gateway không kèm token trả 401, không còn 404.
- `minReplicas = 1` đã đặt cho 5 app chính.
- Cache `access-context` ở Workflow: đã quyết định **không làm** (giữ quy tắc fail-closed).

---

## 1. IAM trên Azure đang chạy bản cũ (ưu tiên cao)

**Hiện tượng (gọi thử ngày 30/10):**
- `POST /api/v1/accounts/manager` và `POST /api/v1/accounts/procedure-manager` trả **405**. Swagger IAM trên Azure không có hai route này, trong khi code đã có từ commit `883e3a0`.
- Swagger IAM trên Azure vẫn còn 3 API `/api/v1/users/me/phone-verification[/request|/confirm]`, trong khi code đã gỡ ở SMS-REMOVE-01.

**Hệ quả có thể xảy ra:** hai migration IAM dưới đây có thể **chưa** được áp lên DB IAM Azure, nên tài khoản Manager có thể bị 403 khi chuyển hồ sơ hoặc vào màn staffing:
- `20261024010000_ManagerAssignmentPermission` (cấp quyền `workflow.assign.manage`);
- `20261029120000_ManagerStaffingPermissions` (cấp các quyền `workflow.dispatch.*`, `workflow.staffing.*`, `workflow.leave.*`, `workflow.consultation.*`).

**Cần làm:**
1. Build image IAM từ `main` mới nhất và deploy lên `wardmate-iam`. IAM tự chạy migration khi khởi động (`Database:AutoMigrate` mặc định `true`). Nếu trên Azure đã tắt cờ này thì phải chạy tay 2 migration trên.
2. Xóa các biến `Sms__*` còn sót trên Container App IAM và Analytics.

**Kiểm thử sau deploy:**
- `POST /api/v1/accounts/manager` không kèm token trả 401, không còn 405.
- Tài khoản Manager gọi `GET /api/v1/manager/applications/assignment-summary` và `GET /api/v1/staffing/shifts` đều trả 200.
- Bảng `__EFMigrationsHistory` của DB IAM có đủ 2 migration trên.

## 2. Bật thông báo (ưu tiên cao)

**Hiện trạng:** `RabbitMq__Enabled=false` trên Workflow và Analytics. Không tạo được RabbitMQ trên ACA Express (lỗi `ExpressEnvironmentFeatureNotSupported`) và trên ACI (lỗi `RequestDisallowedByAzure`). Vì vậy `GetNotifications` vẫn trả rỗng.

**Đề xuất:** dùng CloudAMQP gói Free (AMQPS cổng 5671). `RabbitTransport` đã hỗ trợ TLS qua `RabbitMq__UseTls`, nên không phải sửa code.

**Cần làm:**
1. Tạo instance CloudAMQP.
2. Trên **cả** `wardmate-application-workflow` và `wardmate-analytics-system`, đặt:
   - `RabbitMq__Enabled=true`
   - `RabbitMq__UseTls=true`
   - `RabbitMq__Host`, `RabbitMq__Port=5671`, `RabbitMq__VirtualHost`, `RabbitMq__UserName`, `RabbitMq__Password` (để mật khẩu trong secret).
3. Trên `wardmate-analytics-system`, đặt `Notifications__WorkersEnabled=true`.
4. Lưu ý: khi bật, toàn bộ sự kiện đang tồn trong `workflow_outbox` sẽ được gửi dồn một lượt.

**Kiểm thử:**
- Manager chuyển hồ sơ cho cán bộ B: B nhận `ReceiveNotification`.
- Bảng `workflow_outbox` không còn dòng `PublishedAt IS NULL` bị kẹt.
- Hub `/api/analytics-system/hubs/notifications` kết nối bằng WebSocket, không rơi xuống long polling. Lần đo ngày 30/10: `negotiate` mất 9,5 s.

Nếu BE không dùng được CloudAMQP, nhờ báo lại hướng thay thế và thời gian dự kiến.

## 3. Giảm độ trễ (trung bình)

**Số đo ngày 30/10 (sau khi đã đặt `minReplicas = 1`):**
- `GET /api/v1/wards` (IAM): 1,5 s
- Danh sách Workflow (không kèm token, trả 401): 1,7–1,9 s
- `GET /api/v1/officer/activity` (không kèm token, trả 401): 3,7 s

Các request trả 401 vẫn mất gần 2 s, nên FE nghi phần lớn thời gian nằm ở mạng hoặc vị trí database, không nằm ở logic xử lý.

**Cần làm:**
1. Kiểm tra vùng đặt DB Supabase. Nếu DB không ở gần `japaneast` thì đây có thể là nguyên nhân chính.
2. Bật Application Insights (hoặc OpenTelemetry) cho Workflow, DocumentForm, IAM và Gateway, để biết thời gian nằm ở DB, ở lời gọi giữa service hay ở mạng.
3. DocumentForm `ApplicationAccess.cs`: hiện chưa có cache. Đề xuất cache 15–30 s **chỉ cho thao tác đọc**, khóa `(userId, applicationId)`. Đánh đổi: khi hồ sơ được chuyển sang cán bộ khác, cán bộ cũ vẫn đọc được tài liệu thêm tối đa bằng TTL. Chờ chủ dự án quyết; nếu không chấp nhận thì bỏ qua.

## 4. Cần BE xác nhận

1. Tag image đang chạy của từng service. Ghi chép mới nhất FE có được:
   - Workflow: `workflow-20261029-02`
   - Gateway: `gateway-20261029-02`
   - DocumentForm: `staffing-20261029-02`
   - AIOCR: `aiocr-20261024-01`
   - **IAM: chưa rõ** (mốc gần nhất tìm thấy là `iam-20261022-03`)
   - **Analytics: chưa rõ** (mốc gần nhất tìm thấy là `analytics-20261023-01`). Bản đang chạy có commit `87cbbb0` (sự kiện `APPLICATION_ASSIGNED`) chưa?
2. Bảng `__EFMigrationsHistory` trên Azure đã có các migration sau chưa:
   - Workflow: `20261023173500_CategoryAssignment`, `20261029005650_ApplicantNameAndActivity`, `20261029010912_CommentWithdrawal`, `20261029161554_AddStaffingTablesOnly`
   - IAM: `20261024010000_ManagerAssignmentPermission`, `20261029120000_ManagerStaffingPermissions`
3. Workflow trên Azure đang dùng `Database:AutoMigrate` hay phải chạy SQL tay?

## 5. Tùy chọn

Backfill `applicant_name` cho hồ sơ cũ: viết script chạy một lần, đọc họ tên từ IAM theo `UserId`. Nếu không làm, FE vẫn hiển thị "Công dân" cho các hồ sơ này.

---

*Xong mục nào, BE ghi commit/image và ngày vào bảng dưới.*

| # | Xong (commit/image, ngày) |
|---|---|
| 1. IAM | |
| 2. Thông báo | |
| 3. Độ trễ | |
| 4. Xác nhận | |
| 5. Backfill | |
