# API backend còn thiếu cho luồng Document Form và Workflow

Cập nhật: 15/10/2026. Nội dung này được đối chiếu với source backend hiện có tại `E:\wardmate-backend`, không suy đoán từ Swagger.

## 1. Cán bộ chưa thể tìm `submissionId` của bản khai theo hồ sơ

Các API cán bộ của Document Form đều cần `submissionId`:

- `GET /api/v1/officer/submissions/{submissionId}/download`
- `POST /api/v1/officer/submissions/{submissionId}/comments`
- `POST /api/v1/officer/submissions/{submissionId}/request-revision`
- `POST /api/v1/officer/submissions/{submissionId}/approve`

Nhưng backend chưa có API cho cán bộ liệt kê các bản khai thuộc một `applicationId`. API `GET /api/v1/applications/{applicationId}/contents` chỉ cho chủ hồ sơ có role `DocumentCitizen`, nên không thể dùng trong workspace cán bộ.

Đề nghị bổ sung:

```http
GET /api/v1/officer/applications/{applicationId}/submissions
```

Response tối thiểu cần có: `id`, `applicationId`, `checklistId`, `templateId`, `fileName`, `fileSizeBytes`, `status`, `officerComment`, `submittedAt`, `reviewedAt`, `fileExists`.

Khi có endpoint này, FE sẽ nối các thao tác xem/tải bản khai, ghi chú, yêu cầu sửa và duyệt ngay trên từng checklist. Hiện FE đã khai báo đầy đủ client cho bốn API thao tác phía trên nhưng không thể hiển thị đúng bản khai cho cán bộ khi chưa có API khám phá ID.

## 2. DTO PDF không chỉ ra bản khai nguồn

`GeneratedDocumentDto` hiện có `id`, `applicationId`, `documentType`, `pdfBlobUrl`, `createdAtUtc` nhưng không có `submissionId` hoặc `templateId`. Khi một hồ sơ có nhiều tờ khai, FE không thể biết PDF nào tương ứng với tờ khai nào.

Đề nghị thêm ít nhất `submissionId`, và nên thêm `templateId` cùng `fileName` vào:

- response `POST /api/v1/applications/{applicationId}/generate-pdf`
- response `GET /api/v1/applications/{applicationId}/generated-documents`

## 3. Phân quyền Document Manager chưa thống nhất với workspace quản trị

Các endpoint quản lý mẫu yêu cầu role `PROCEDURE_MANAGER`. Nếu tài khoản `IT_ADMIN` không đồng thời có role này thì màn quản trị mẫu sẽ nhận 403 dù UI cho phép quản trị viên truy cập.

Đề nghị thống nhất một trong hai cách:

- cho policy Document Manager chấp nhận `PROCEDURE_MANAGER` hoặc `IT_ADMIN`; hoặc
- bảo đảm IAM luôn gán thêm `PROCEDURE_MANAGER` cho tài khoản quản trị cần quản lý mẫu.

## 4. Tệp chưa được đóng băng theo phiên bản Workflow

Workflow lưu snapshot dữ liệu/checklist khi nộp và gửi lại, nhưng tệp Document Form và supporting document vẫn được tra theo `applicationId`. Backend chưa có quan hệ phiên bản rõ ràng để cán bộ xem lại đúng bộ tệp của phiên bản cũ.

Đề nghị lưu `workflowVersion`/`applicationVersionId` trên submission và supporting document, hoặc tạo snapshot liên kết các ID tệp khi Workflow tạo phiên bản.

## 5. Chưa có API cập nhật `formData` của hồ sơ DRAFT

Workflow cho tạo hồ sơ với `formData`, nhưng chưa có endpoint cập nhật dữ liệu khai chung khi hồ sơ còn DRAFT. Nếu các trường hồ sơ chung được cho phép sửa sau khi tạo, cần endpoint ví dụ:

```http
PATCH /api/v1/applications/{applicationId}
```

với optimistic concurrency hoặc version phù hợp.

## 6. Chưa có vòng đời xử lý bình luận chi tiết

Backend cho tạo và đọc comment nhưng chưa có API đánh dấu `RESOLVED`, mở lại hoặc xóa comment. UI chỉ có thể hiển thị trạng thái do backend trả về.

Đề nghị bổ sung endpoint đổi trạng thái comment, kèm kiểm tra quyền theo chủ hồ sơ/cán bộ phụ trách.

## 7. QR và tiếp nhận chính thức chưa có hợp đồng API

Các màn “Mã QR hồ sơ” và “Tiếp nhận tại quầy” hiện không có endpoint backend để phát hành/xác thực QR hoặc ghi nhận tiếp nhận chính thức. Đây là nghiệp vụ khác với kết quả tiền kiểm `APPROVED`.

Cần chốt hợp đồng riêng nếu giữ hai chức năng này. FE không nên tự chuyển `APPROVED` thành đã tiếp nhận chính thức.

