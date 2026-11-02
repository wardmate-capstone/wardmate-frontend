# Hướng dẫn Cấu hình Azure DevOps & Bật Worker Thông báo (AnalyticsSystem)

**Ngày lập:** 31/10/2026  
**Dự án:** WardMate — Hệ thống Chuẩn bị & Tiền kiểm Hồ sơ Hành chính Phường/Xã  
**Gửi tới:** Đội ngũ Backend & Quản trị Hệ thống Cloud Azure (Anti / DevOps)  
**Mục tiêu:** Kích hoạt Worker ngầm để ghi nhận dữ liệu sự kiện hồ sơ vào bảng `notification_deliveries` trang Quản trị Admin.

---

## 1. Hiện trạng & Lý do cần cấu hình

* **Hiện tượng phía Giao diện Admin:**
  Trang **Quản trị phát thông báo** (`/admin/notifications`) kết nối API `GET /api/v1/admin/notification-deliveries` thành công (HTTP 200 OK), nhưng bảng luôn rỗng (`total: 0`), kể cả khi công dân vừa nộp hồ sơ mới hoặc cán bộ chuyển trạng thái hồ sơ.
* **Nguyên nhân kỹ thuật (Đã xác nhận trong tài liệu bàn giao `fe-handoff-2026-10-31.md` - Mục 2 & 5):**
  1. Service `AnalyticsSystem` trên Azure Container Apps hiện đang được cấu hình `minReplicas = 0` (chế độ tiết kiệm chi phí, container tự tắt hoàn toàn khi không có request HTTP).
  2. Worker tiêu thụ tin nhắn từ RabbitMQ (`CloudAMQP`) chưa được kích hoạt ngầm liên tục (`Notifications__WorkersEnabled=true`), dẫn đến khi sự kiện `WorkflowEvent` được bắn qua RabbitMQ, không có tiến trình nào lưu dữ liệu vào bảng cơ sở dữ liệu `notification_deliveries`.

---

## 2. Các bước cấu hình trên Azure (Dành cho DevOps / Backend)

Đội ngũ DevOps / Azure chỉ cần thực hiện 2 thao tác sau trên Azure Portal hoặc Azure CLI:

### Bước 1: Đặt `minReplicas = 1` cho Container App `AnalyticsSystem`
Để worker thông báo có thể lắng nghe RabbitMQ 24/7 mà không bị tắt khi rảnh:
```bash
az containerapp update \
  --name <tên-container-analytics-tren-azure> \
  --resource-group <tên-resource-group> \
  --min-replicas 1 \
  --max-replicas 3
```

### Bước 2: Bật Worker và kiểm tra biến môi trường
Đảm bảo các biến môi trường sau đã được cấu hình trong container `AnalyticsSystem`:
```env
Notifications__WorkersEnabled=true
ConnectionStrings__DefaultConnection=<chuỗi kết nối PostgreSQL>
EventBus__RabbitMQ__HostName=<CloudAMQP Hostname>
EventBus__RabbitMQ__UserName=<CloudAMQP Username>
EventBus__RabbitMQ__Password=<CloudAMQP Password>
```

---

## 3. Kịch bản Kiểm thử sau khi Cấu hình (Verification Steps)

1. **Thao tác tạo dữ liệu mới:**
   - Dùng tài khoản Công dân nộp một hồ sơ mới (hoặc dùng tài khoản Cán bộ tiếp nhận/đổi trạng thái một hồ sơ).
2. **Kiểm tra kết quả trên trang Quản trị Admin:**
   - Đăng nhập tài khoản Quản trị viên (`IT_ADMIN` / `WardMate Admin`).
   - Vào menu **Vận hành hệ thống** -> **Phát thông báo**.
   - Bảng sẽ lập tức hiển thị dòng bản ghi mới:
     + **Mã Delivery** (UUID).
     + **Kênh phát:** `IN_APP` hoặc `EMAIL`.
     + **Trạng thái:** `PENDING` / `DELIVERED` / `FAILED`.
     + **Thời gian cập nhật:** Giờ hiện tại.
     + **Thao tác:** Xem chi tiết kiểm toán và nút Gửi lại (Replay).

---

*Lưu ý: Chỉ những thao tác phát sinh sau khi Worker được kích hoạt mới tạo bản ghi thông báo; các thao tác trước đó khi worker tắt sẽ không có bản ghi hồi cứu.*

