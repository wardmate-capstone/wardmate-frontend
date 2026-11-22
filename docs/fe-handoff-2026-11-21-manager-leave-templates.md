# Bàn giao Backend → Frontend: Tính năng Quản lý mẫu đơn xin nghỉ phép Word theo phường cho Manager

**Ngày tạo:** 21/11/2026  
**Người viết:** Backend Team  
**Mã task backend:** `LEAVE-TEMPLATE-01`  
**Trạng thái triển khai:** Đã kiểm thử Release (185/185 unit tests passed), đã tích hợp vào branch `kha` và đang chạy trên Azure mới.  
**Địa chỉ Gateway Backend:**  
`https://wardmate-gateway.bravetree-f6485744.japaneast.azurecontainerapps.io`

---

## 1. Bối cảnh & Mục đích thay đổi

- **Trước đây:** Hệ thống sử dụng một mẫu đơn xin nghỉ phép Word (.docx) cố định được cấu hình cứng trong hệ thống (`WorkSchedule:SharedLeaveTemplate`). Khi muốn thay đổi mẫu đơn nghỉ, lập trình viên/DevOps phải sửa biến môi trường trên server và restart service.
- **Bây giờ:** Hệ thống trao quyền cho **Manager của từng phường** có thể tự upload file mẫu Word mới cho phường của mình trực tiếp trên giao diện web.
  - Mỗi phường có thể có mẫu đơn riêng, do Manager phường đó quản lý.
  - Khi Manager upload mẫu mới, hệ thống tự động kích hoạt mẫu đó cho toàn bộ cán bộ trong phường.
  - Mẫu cũ của phường tự động lưu vào lịch sử (không bị xóa), các đơn nghỉ trước đó đã nộp hoặc đang nháp vẫn giữ nguyên vẹn nội dung.
  - Nếu một phường chưa từng upload mẫu riêng qua database, hệ thống tự động fallback sử dụng mẫu mặc định từ trước để đảm bảo tính liên tục, không gây lỗi.

---

## 2. Bảng tổng quan 5 APIs

| STT | Phương thức | Đường dẫn API | Vai trò gọi | Mô tả chức năng |
|---|---|---|---|---|
| 1 | `POST` | `/api/v1/staffing/leave-templates` | **Manager** | Tải lên file mẫu Word (.docx) mới cho phường |
| 2 | `GET` | `/api/v1/staffing/leave-templates` | **Manager** | Lấy danh sách lịch sử các mẫu Word đã tải lên của phường |
| 3 | `GET` | `/api/v1/staffing/leave-templates/current` | **Cán bộ & Manager** | Lấy thông tin (ID, SHA256) của mẫu đơn đang áp dụng |
| 4 | `GET` | `/api/v1/staffing/leave-templates/{id}/docx` | **Cán bộ & Manager** | Tải file Word mẫu binary (.docx) về máy |
| 5 | `GET` | `/api/v1/staffing/capabilities` | **Cán bộ & Manager** | Kiểm tra cấu hình hệ thống (bắt buộc nộp Word hay không, đã có mẫu chưa) |

---

## 3. Chi tiết từng API & Hợp đồng dữ liệu (Contracts)

### API 1: Manager tải lên mẫu đơn Word mới
- **Endpoint:** `POST /api/v1/staffing/leave-templates`
- **Quyền yêu cầu:** `Bearer Token` của tài khoản có role `MANAGER` và quyền `workflow.staffing.manage`.
- **Content-Type:** `multipart/form-data`
- **Request Body (Form Data):**
  - `file`: File upload (.docx).
- **Ràng buộc kiểm tra của Backend:**
  - Định dạng file bắt buộc có đuôi `.docx` (case-insensitive).
  - Dung lượng file tối đa **10 MiB** (`10 * 1024 * 1024 bytes`).
  - Cấu trúc file DOCX ZIP hợp lệ (tối đa 2.000 entry, dung lượng giải nén ≤ 64 MiB, có `word/document.xml`, không chứa Macro/VBA, không chứa liên kết ngoài `TargetMode="External"`).
- **Phản hồi thành công (HTTP 200 OK):**
  ```json
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "wardCode": "W01",
    "sha256": "3B4C5D6E7F8A...",
    "sizeBytes": 24560,
    "fileName": "don-xin-nghi-phep-2026.docx",
    "uploadedBy": "123e4567-e89b-12d3-a456-426614174000",
    "uploadedByName": "Nguyễn Văn Quản Lý",
    "uploadedAtUtc": "2026-11-21T14:30:00Z",
    "isActive": true
  }
  ```
- **Xử lý mã lỗi:**
  - `400`: Form không hợp lệ hoặc thiếu file.
  - `403` (`leave.forbidden`): Người gọi không phải Manager hoặc không có phường.
  - `413` (`leave.too_large`): File vượt quá 10 MiB.
  - `415` (`leave.invalid_docx`): File không phải định dạng DOCX hợp lệ hoặc chứa macro bị chặn.

---

### API 2: Manager xem lịch sử các mẫu đơn đã tải lên
- **Endpoint:** `GET /api/v1/staffing/leave-templates`
- **Quyền yêu cầu:** `Bearer Token` của tài khoản `MANAGER` (`workflow.staffing.manage`).
- **Phản hồi thành công (HTTP 200 OK):**
  Trả về mảng danh sách các mẫu, sắp xếp theo thời gian tải lên **mới nhất ở đầu**:
  ```json
  [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "wardCode": "W01",
      "sha256": "3B4C5D6E7F8A...",
      "sizeBytes": 24560,
      "fileName": "don-xin-nghi-phep-2026.docx",
      "uploadedBy": "123e4567-e89b-12d3-a456-426614174000",
      "uploadedByName": "Nguyễn Văn Quản Lý",
      "uploadedAtUtc": "2026-11-21T14:30:00Z",
      "isActive": true
    },
    {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "wardCode": "W01",
      "sha256": "9F8E7D6C5B4A...",
      "sizeBytes": 22100,
      "fileName": "don-nghi-mau-cu.docx",
      "uploadedBy": "123e4567-e89b-12d3-a456-426614174000",
      "uploadedByName": "Nguyễn Văn Quản Lý",
      "uploadedAtUtc": "2026-10-15T08:00:00Z",
      "isActive": false
    }
  ]
  ```

---

### API 3: Lấy thông tin mẫu đơn đang áp dụng hiện hành
- **Endpoint:** `GET /api/v1/staffing/leave-templates/current`
- **Quyền yêu cầu:** `Bearer Token` của Cán bộ hoặc Manager có quyền `workflow.staffing.read`.
- **Cơ chế xử lý của Backend:**
  1. Tìm bản ghi có `isActive = true` của phường người dùng trong bảng database.
  2. Nếu phường chưa upload mẫu trong database, tự động fallback đọc mẫu mặc định từ cấu hình hệ thống.
- **Phản hồi thành công (HTTP 200 OK):**
  ```json
  {
    "versionId": "550e8400-e29b-41d4-a716-446655440000",
    "sha256": "3B4C5D6E7F8A..."
  }
  ```
- **Xử lý mã lỗi:**
  - `503` (`leave.template_unavailable`): Phường chưa có mẫu nào và hệ thống cũng chưa có cấu hình mẫu chung. FE hiển thị thông báo: *"Phường chưa cấu hình mẫu đơn nghỉ phép. Vui lòng liên hệ quản lý."*

---

### API 4: Tải file Word mẫu binary (.docx)
- **Endpoint:** `GET /api/v1/staffing/leave-templates/{id}/docx`
- **Quyền yêu cầu:** `Bearer Token` của Cán bộ hoặc Manager (`workflow.staffing.read`).
- **Tham số:** `{id}` là `versionId` nhận được từ API số 3 (hoặc `id` từ danh sách API số 2).
- **Phản hồi thành công (HTTP 200 OK):**
  - `Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document`
  - `Content-Disposition: attachment; filename=don-nghi.docx`
  - Dữ liệu trả về là file nhị phân (Binary Stream/Blob).
- **Cách gọi trên Frontend (Axios / Fetch):**
  ```typescript
  const response = await axios.get(
    `${GATEWAY_URL}/api/v1/staffing/leave-templates/${templateId}/docx`,
    {
      headers: { Authorization: `Bearer ${token}` },
      responseType: 'blob'
    }
  );
  // Tạo blob URL để người dùng tải về máy:
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'don-nghi.docx');
  document.body.appendChild(link);
  link.click();
  link.remove();
  ```
- **Xử lý mã lỗi:**
  - `404` (`leave.not_found`): Không tìm thấy mẫu có ID này cho phường của người dùng.
  - `503` (`leave.storage_unavailable`): Kho lưu trữ tài liệu tạm thời chưa sẵn sàng.

---

### API 5: Kiểm tra trạng thái cấu hình mẫu đơn (Capabilities)
- **Endpoint:** `GET /api/v1/staffing/capabilities`
- **Quyền yêu cầu:** `Bearer Token` (`workflow.staffing.read`).
- **Phản hồi thành công (HTTP 200 OK):**
  ```json
  {
    "wordRequired": true,
    "templateConfigured": true,
    "maxDocxBytes": 10485760
  }
  ```
  - `templateConfigured`: `true` nếu phường đã có mẫu sẵn sàng (từ DB hoặc cấu hình chung), `false` nếu chưa có mẫu nào.
  - `wordRequired`: `true` nếu quy định phường bắt buộc nộp kèm file Word khi xin nghỉ.

---

## 4. Định nghĩa TypeScript Interface cho Frontend

```typescript
export interface WardLeaveTemplateView {
  id: string;
  wardCode: string;
  sha256: string;
  sizeBytes: number;
  fileName: string;
  uploadedBy: string;
  uploadedByName: string;
  uploadedAtUtc: string; // ISO 8601 UTC
  isActive: boolean;
}

export interface LeaveTemplateDescriptor {
  versionId: string;
  sha256: string;
}

export interface StaffingCapabilities {
  wordRequired: boolean;
  templateConfigured: boolean;
  maxDocxBytes: number;
}
```

---

## 5. Hướng dẫn thiết kế giao diện UI/UX cho Frontend

### Màn hình 1: Quản lý mẫu đơn nghỉ phép (Dành cho Manager)
- **Vị trí đề xuất:** Thêm một tab hoặc mục **"Mẫu đơn nghỉ phép"** trong phân hệ *Quản lý nhân sự / Lịch trực của Manager*.
- **Các thành phần giao diện cần có:**
  1. **Thẻ trạng thái mẫu hiện hành (Current Template Card):**
     - Hiển thị tên file đang áp dụng, người tải lên, ngày cập nhật.
     - Có nút **"Tải về xem thử"** (gọi API số 4).
     - Badge trạng thái: **"Đang áp dụng"** màu xanh.
  2. **Khu vực Tải lên mẫu mới (Upload Box):**
     - Hỗ trợ kéo thả (Drag & Drop) hoặc bấm chọn file `.docx`.
     - Chú thích rõ: *"Chỉ chấp nhận file Word (.docx), dung lượng tối đa 10 MB"*.
     - Nút bấm **"Tải lên mẫu mới"** $\rightarrow$ gọi API 1 (`POST /api/v1/staffing/leave-templates`).
     - Khi tải lên thành công: hiển thị thông báo Toast thành công và tự động tải lại danh sách lịch sử.
  3. **Bảng lịch sử phiên bản (Version History Table):**
     - Gọi API 2 (`GET /api/v1/staffing/leave-templates`).
     - Cột: Tên tệp, Dung lượng (format KB/MB), Người tải lên, Ngày tải lên, Trạng thái (badge *Đang áp dụng* nếu `isActive = true` hoặc *Đã lưu trữ* nếu `isActive = false`), Hành động (Nút Tải xuống file tương ứng).

### Màn hình 2: Tạo đơn xin nghỉ phép (Dành cho Cán bộ)
- Cán bộ vào màn hình xin nghỉ phép:
  - FE gọi `GET /api/v1/staffing/leave-templates/current` để lấy `versionId`.
  - Hiển thị nút bấm **"Tải mẫu đơn xin nghỉ phép của phường (.docx)"** để cán bộ tải file về điền.
  - Khi submit tạo đơn (`POST /api/v1/staffing/leave-drafts`), truyền `templateVersionId` đã lấy được.

---

## 6. Ghi chú kiểm thử nhanh (Testing Checklist cho FE)

- [ ] Manager upload file `.docx` hợp lệ $\rightarrow$ thành công, xuất hiện ở đầu bảng lịch sử với `isActive = true`.
- [ ] Manager upload file `.pdf` hoặc `.xlsx` $\rightarrow$ bị chặn ở client hoặc BE trả 415, hiển thị thông báo lỗi phù hợp.
- [ ] Manager upload file dung lượng > 10 MiB $\rightarrow$ bị chặn ở client hoặc BE trả 413.
- [ ] Manager tải xuống mẫu đơn từ bảng lịch sử $\rightarrow$ file `.docx` mở được bằng Microsoft Word bình thường.
- [ ] Cán bộ bấm tải mẫu đơn nghỉ $\rightarrow$ tải đúng file phiên bản mới nhất mà Manager vừa upload.
