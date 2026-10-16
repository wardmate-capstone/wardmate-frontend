# Khoảng trống hợp đồng DocumentForm và Workflow

Cập nhật: **16/10/2026 (Asia/Saigon)**. Đối chiếu source `E:/wardmate-backend` và OpenAPI DocumentForm Azure trong lượt này. Kế hoạch hiện hành: [document-form-integration-plan-2026-10-16.md](document-form-integration-plan-2026-10-16.md).

## 1. Đã có BE; không còn bị chặn thiếu API

| Hạng mục từng thiếu | Hợp đồng hiện tại | FE đã triển khai local |
| --- | --- | --- |
| Cán bộ tìm submissionId | GET `/api/v1/officer/submissions/by-application/{applicationId}` trả array UserSubmissionSummaryDto | Đã nối client/hook/UI, dùng id làm submissionId |
| Cán bộ đọc contents | GET `/api/v1/applications/{applicationId}/contents`, DocumentUser + ApplicationAccess.Read | Đã đọc theo quyền, kết hợp summary với fileExists; binary tải khi chọn |
| PDF liên kết bản khai | GeneratedDocumentDto có submissionId nullable; GET generated-documents nhận query submissionId | Đã thêm schema/param/key và nhóm PDF; nguồn cũ null tách riêng |
| QR metadata/ảnh | GET `/api/v1/applications/{applicationId}/approved-qr` và `/approved-qr/image` | Đã thêm proxy/client/UI PNG thật và trạng thái chưa có QR |

Endpoint thao tác cán bộ chính xác là `download-docx` và PUT `annotate-docx` multipart File, không phải `/download` hay `/comments`. Word comments và comments Workflow là hai nguồn riêng.

## 2. QR chưa bảo đảm có ngay sau duyệt

- HTTP hiện tại: OfficerSubmissionsController → ApplicationAccess.Decide → Workflow quyết định → Check đồng bộ submission Approved; FE cũng duyệt qua Workflow.
- ApproveSubmissionCommandHandler có tạo QR nhưng không tìm thấy caller trong source HTTP hiện tại. GET QR chỉ đọc ApprovedQrs, không tạo.
- GeneratePdfDocumentCommand tạo QR còn thiếu trước render, nên hồ sơ APPROVED chưa tạo PDF có thể chưa có QR. Hồ sơ không có DOCX chưa có đường tạo bằng generate-pdf.
- BE cần đưa tạo QR vào luồng đang chạy, xác định hồ sơ không có DOCX, đồng thời/thất bại và linkage version. FE trước mắt hiển thị chưa có QR; không tự POST khi mở trang.

## 3. QR chưa có hợp đồng tra cứu công khai và phiên bản

- ApprovedQrService mặc định mã hóa Gateway `/api/v1/applications/{applicationId}`; GET hồ sơ yêu cầu xác thực. Chưa thấy endpoint công khai riêng để xác minh QR.
- DTO có id/applicationId/submissionId/qrCodeValue/generatedAt, chưa workflowVersion. Một QR theo application không tự chứng minh snapshot tài liệu nào đã duyệt.
- Cần chốt trang đích, quyền, dữ liệu tối thiểu công khai, version và lifecycle. Không gọi QR là giấy hẹn hoặc phiếu tiếp nhận chính thức.

## 4. Danh sách cán bộ ngoài pending

ApplicationReviewStore.Pending chỉ trả SUBMITTED/UNDER_REVIEW trong phường, chưa giao hoặc giao cho người hiện tại; validator chỉ nhận hai filter status này. FE đang dùng nguồn đó cho cả cần bổ sung/đã duyệt nên refetch làm hồ sơ rời queue; cache cục bộ không thay API lịch sử đầy đủ.

Cần hợp đồng danh sách/tra cứu rộng hơn với phân quyền, trạng thái, phân trang/tổng số. Chưa tự đặt route/response mới. Trước mắt UI chỉ cam kết queue được cung cấp.

## 5. Quyền quản lý phôi IT_ADMIN

BE DocumentManager yêu cầu PROCEDURE_MANAGER. IT_ADMIN trong DocumentUser không tự có quyền ghi. FormsView dùng permission document.templates.manage để hiện nút nên có thể bị 403.

FE có thể chặn ghi theo role hiện có ngay. Nếu muốn IT_ADMIN ghi, cần quyết định sửa policy BE hoặc cấp thêm role ở IAM; FE không tự mở quyền.

## 6. Snapshot nhị phân theo version

Workflow có snapshot JSON/checklist; DocumentForm tra file hiện tại theo applicationId. Chưa có hợp đồng đọc bộ blob bất biến của v1/v2. Cần snapshot liên kết file/version trước khi cam kết xem lại/so sánh file lịch sử. Diff JSON vẫn dùng được với nhãn chính xác.

## 7. formData DRAFT và comment thủ công

- Chưa có API sửa formData chung khi DRAFT. Không cho sửa rồi báo lưu thành công nếu không có đường ghi; resubmit vẫn nhận formData cho NEED_REVISION theo hợp đồng đã có.
- Chưa có API xóa/resolve/reopen comment thủ công. **Đã có** tự chuyển OPEN version cũ thành RESOLVED khi resubmit thành công trong ReviewHandlers; FE giữ status/version, không xóa local hoặc gợi ý xóa để duyệt.

## 8. Tiếp nhận chính thức và editor trình duyệt

- Chưa thấy hợp đồng ghi nhận tiếp nhận tại quầy; không dùng APPROVED/QR thay thế.
- Có docx-preview để xem, chưa có engine Word nhập/xuất DOCX bảo toàn comment. Tải/sửa bằng Word/upload triển khai được ngay; editor web cần chốt engine/hạ tầng/license riêng.

## 9. Giới hạn xác minh

Đã GET OpenAPI và đọc source; chưa kiểm thử quyền thực tế, migration, Blob/Gotenberg, QR scan hoặc mutation Azure bằng tài khoản thử nghiệm. Các bước trong `E:/môtảapi.docx` là đầu vào kế hoạch, không phải kết quả đã chạy. Status theo implementation: chưa APPROVED có nhánh 409; sai phạm vi có thể 404 thay vì luôn 403.
