# Yêu cầu bổ sung API - Phân hệ Procedure Catalog (Dành cho Backend)

> **Người gửi:** Frontend Team  
> **Dành cho:** Backend Team (`WardMate.Services.ProcedureCatalog`)  
> **Ngày lập:** 06/10/2026  
> **Mục tiêu:** Hoàn thiện luồng nghiệp vụ quản lý thủ tục hành chính, giải quyết các điểm nghẽn trải nghiệm người dùng (UX bottlenecks) và hỗ trợ tích hợp liền mạch giữa Frontend và Backend.

---

## 1. Tổng quan hiện trạng

Frontend đã hoàn tất tích hợp và kiểm thử 100% các API hiện có từ Backend (`ProceduresController`, `ProcedureManagerController`, `ProcedureDraftsController`, `ProcedureSourcesController`). 

Tuy nhiên, trong quá trình chạy thực tế theo quy trình nghiệp vụ cán bộ một cửa và quản trị thủ tục, **hệ thống đang gặp một số điểm nghẽn lớn** do thiếu các endpoint bổ trợ dưới đây.

---

## 2. Danh sách API đề xuất bổ sung (Xếp theo mức độ ưu tiên)

### 🔥 ƯU TIÊN P0: Cấp thiết - Giải quyết nghẽn luồng xử lý chính

#### 1. API Lấy chi tiết thủ tục dành cho Quản lý (Hỗ trợ cả thủ tục đã ngừng công khai)
- **Vấn đề hiện tại:**
  - `GET /api/v1/procedures/{id}` (công khai) chặn cứng `if (!procedure.IsActive) return 404;`.
  - Khi cán bộ chuyển một thủ tục sang trạng thái **Ngừng công khai** (`isActive = false`) để cập nhật nội dung, cán bộ bấm vào xem chi tiết để sửa thì nhận về lỗi `404 Not Found`. Cán bộ không thể xem hoặc cập nhật thủ tục này trừ khi phải mở công khai trở lại.
- **Đề xuất endpoint:**
  - **Method / Route:** `GET /api/v1/procedure-manager/procedures/{id}`
  - **Phân quyền:** Yêu cầu Authorization Policy `ProcedureManager`.
  - **Response (200 OK):** `ProcedureDetailDto` (trả về dữ liệu chi tiết đầy đủ bất kể `IsActive` là `true` hay `false`).
  - **Mã lỗi:** `404` chỉ khi `id` không tồn tại trong DB.

#### 2. API Xóa / Hủy bản nháp PDF (Draft Discard / Delete)
- **Vấn đề hiện tại:**
  - Nhóm API Draft (`/api/v1/procedure-manager/drafts`) chỉ có: Tải lên, Sửa payload, Thử lại, và Xuất bản.
  - Khi cán bộ tải nhầm file PDF lỗi, file không đúng mẫu, hoặc OCR ra kết quả sai lệch không dùng được, bản nháp đó bị kẹt vĩnh viễn trong danh sách ở trạng thái `Failed` hoặc `NeedsReview` mà không có cách nào xóa/loại bỏ.
- **Đề xuất endpoint:**
  - **Method / Route:** `DELETE /api/v1/procedure-manager/drafts/{id}`
  - **Phân quyền:** `ProcedureManager`.
  - **Hành vi xử lý:**
    - Xóa bản ghi trong bảng `ProcedureDrafts`.
    - Dọn dẹp file PDF tương ứng trên Azure Blob Storage (`BlobName`).
  - **Response:** `204 NoContent` hoặc `200 OK`.

---

### ⚡ ƯU TIÊN P1: Cần thiết - Hoàn chỉnh quản trị danh mục & lịch sử phiên bản

#### 3. Quản lý Danh mục Thủ tục (Category CRUD)
- **Vấn đề hiện tại:**
  - Backend hiện chỉ có `GET /api/v1/procedures/categories`.
  - Menu **Danh mục** trên giao diện chỉ hiển thị danh sách tĩnh. Cán bộ không thể thêm lĩnh vực mới (ví dụ: Hộ tịch, Đất đai, Môi trường, Giao thông...) hoặc sửa tên/mô tả danh mục.
- **Đề xuất endpoints:**
  - `POST /api/v1/procedure-manager/categories`:
    - **Body:** `{ "categoryName": string, "description"?: string }`
    - **Response:** `201 Created` kèm `ProcedureCategoryDto`.
  - `PUT /api/v1/procedure-manager/categories/{id}`:
    - **Body:** `{ "categoryName": string, "description"?: string }`
    - **Response:** `200 OK`.
  - `DELETE /api/v1/procedure-manager/categories/{id}`:
    - **Ràng buộc:** Kiểm tra nếu đã có thủ tục liên kết với danh mục này thì chặn và trả về lỗi `409 Conflict` (kèm thông báo "Không thể xóa danh mục đang có thủ tục liên kết"). Nếu không có thì cho phép xóa.

#### 4. Khôi phục phiên bản lịch sử (Rollback / Restore Version)
- **Vấn đề hiện tại:**
  - Backend đã lưu trữ các bản ghi lịch sử trong `ProcedureVersions` (`snapshotData`).
  - Khi thủ tục sửa đổi bị sai sót pháp lý cần quay lại phiên bản trước, cán bộ phải copy tay từng trường dữ liệu cũ vào form cập nhật rất dễ sai sót.
- **Đề xuất endpoint:**
  - **Method / Route:** `POST /api/v1/procedure-manager/procedures/{id}/versions/{versionNumber}/rollback`
  - **Body (nếu cần):** `{ "reason": string, "decisionNumber": string, "effectiveDate": string }`
  - **Hành vi xử lý:**
    - Lấy `snapshotData` của phiên bản chỉ định đè lại nội dung của `Procedure`.
    - Tự động tạo một bản ghi `ProcedureVersion` mới đánh dấu hành động khôi phục này.
  - **Response:** `200 OK` trả về `ProcedureDetailDto`.

---

### 💡 ƯU TIÊN P2: Tối ưu hóa trải nghiệm & Tích hợp liên dịch vụ

#### 5. API Tra cứu Biểu mẫu liên kết (`DocumentForm`)
- **Vấn đề hiện tại:**
  - Khi cấu hình thủ tục ở phần **Biểu mẫu** (`formDefinitions`), trường `formTemplateId` yêu cầu điền GUID của template. Cán bộ không có danh sách để chọn mà phải nhập tay GUID.
- **Đề xuất:**
  - Cung cấp API (hoặc qua Gateway) `GET /api/v1/procedure-manager/document-forms` trả về danh sách rút gọn:
    `[{ "id": "guid", "formCode": "string", "formName": "string", "formType": "string" }]`
  - Giúp Frontend hiển thị Dropdown / Combobox để cán bộ chọn biểu mẫu nhanh chóng.

#### 6. API Lấy link đọc PDF lịch sử (Version Source SAS URL)
- **Vấn đề hiện tại:**
  - Hiện tại chỉ có API lấy SAS URL của bản hiện tại (`/api/v1/procedures/{id}/source`) hoặc bản nháp (`/api/v1/procedure-manager/drafts/{id}/source`).
  - Trong lịch sử phiên bản (`ProcedureVersion`), có trường `pdfFileName` nhưng chưa có API sinh link đọc tệp PDF tương ứng của phiên bản cũ.
- **Đề xuất:**
  - `GET /api/v1/procedure-manager/procedures/{id}/versions/{versionId}/source` trả về `{ "url": string, "expiresInSeconds": number }`.

---

## 3. Bảng tổng hợp gửi Backend

| Mức độ | Method | Endpoint đề xuất | Mô tả chức năng | Ghi chú |
|---|---|---|---|---|
| 🔥 **P0** | `GET` | `/api/v1/procedure-manager/procedures/{id}` | Lấy chi tiết thủ tục cho cán bộ quản trị | Cần thiết để sửa thủ tục khi đang inactive |
| 🔥 **P0** | `DELETE` | `/api/v1/procedure-manager/drafts/{id}` | Xóa bản nháp trích xuất PDF | Dọn dẹp bản nháp rác/lỗi và xóa blob |
| ⚡ **P1** | `POST` | `/api/v1/procedure-manager/categories` | Thêm mới danh mục thủ tục | CRUD danh mục |
| ⚡ **P1** | `PUT` | `/api/v1/procedure-manager/categories/{id}` | Cập nhật danh mục thủ tục | CRUD danh mục |
| ⚡ **P1** | `DELETE` | `/api/v1/procedure-manager/categories/{id}` | Xóa danh mục thủ tục | Kiểm tra ràng buộc thủ tục thuộc danh mục |
| ⚡ **P1** | `POST` | `/api/v1/procedure-manager/procedures/{id}/versions/{versionNumber}/rollback` | Khôi phục thủ tục về phiên bản cũ | Tự động sinh version mới ghi nhận rollback |
| 💡 **P2** | `GET` | `/api/v1/procedure-manager/document-forms` | Danh sách biểu mẫu DOCX/Online | Phục vụ dropdown chọn form đính kèm |
| 💡 **P2** | `GET` | `/api/v1/procedure-manager/procedures/{id}/versions/{versionId}/source` | Lấy link SAS PDF của phiên bản cũ | Xem lại file PDF văn bản ban hành lịch sử |

---

*Nếu Backend cần thêm thông tin chi tiết về Request/Response DTO hoặc kịch bản sử dụng từ phía UI, vui lòng trao đổi lại để Frontend Team phối hợp!*
