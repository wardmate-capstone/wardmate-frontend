# Rà soát API DocumentForm và editor DOCX

Ngày: 16/10/2026 (Asia/Saigon).

## Nguồn đối chiếu và phạm vi

- Đã đọc `E:/Mô Tả API.docx` như tài liệu mô tả/kịch bản, không thực hiện các lệnh gọi mutation trong tài liệu.
- Đã GET Swagger init và OpenAPI qua [Gateway DocumentForm](https://wardmate-gateway.blackmeadow-a2f12767.japaneast.azurecontainerapps.io/api/document-form/swagger/index.html). Snapshot: [document-form-openapi-2026-10-16.json](document-form-openapi-2026-10-16.json).
- Đọc controllers, DTO, `ApplicationAccess`, handler lưu nháp, upload phôi và lưu DOCX cán bộ trong `E:/wardmate-backend/src/Services/WardMate.Services.DocumentForm`.
- Swagger có **26 thao tác nghiệp vụ**, cộng GET `/` kiểm tra service. Con số 23 trong DOCX không khớp danh sách hiện tại. Phạm vi rà soát là toàn bộ DocumentForm; không phải audit mọi service IAM/Catalog/Workflow.
- Tại FE: `src/lib/api/formTemplates.ts`, `src/lib/api/documentForms.ts`, `src/hooks/useDocumentForms.ts`, FormsView, checklist công dân, panel cán bộ, PDF và QR. Phân biệt có hàm client, có caller UI, kiểm thử mock và xác minh Azure thật.

## Ma trận đầy đủ

Các đường dẫn dưới đây đều có prefix `/api/v1`. “Trực tiếp” nghĩa là có caller từ giao diện; không có nghĩa đã kiểm thử mutation trên Azure.

| # | Method / route | Client FE | Điểm vào UI / kết luận |
| --- | --- | --- | --- |
| 1 | GET `/form-templates` | getFormTemplates | Trực tiếp: kho phôi, picker biểu mẫu thủ tục |
| 2 | POST `/form-templates` | createFormTemplate | Trực tiếp: tạo mã/tên phôi trong FormsView |
| 3 | GET `/form-templates/{templateId}` | getFormTemplateById | Trực tiếp: xem/tải mẫu qua FormTemplateActions |
| 4 | POST `/form-templates/{templateId}/upload-docx` | uploadFormTemplateDocx | Trực tiếp: tải mới/thay phôi, multipart `file` |
| 5 | GET `/form-templates/{templateId}/download-docx` | downloadFormTemplateDocx | Trực tiếp: xem/tải mẫu, mở nguồn để điền trực tuyến |
| 6 | GET `/citizen/submissions` | listSubmissions | **Bổ sung UI** Bản khai của tôi, lọc status, page/pageSize và applicantId từ phiên |
| 7 | GET `/citizen/submissions/{submissionId}` | getSubmission | **Bổ sung caller** kiểm tra metadata khi mở bản khai đã lưu trong editor |
| 8 | POST `/citizen/submissions/draft` | createDraft | Trực tiếp: upload/soạn mới; multipart TemplateId/ApplicationId/ChecklistId/ApplicantId/File |
| 9 | PUT `/citizen/submissions/{submissionId}/draft` | updateDraft | Trực tiếp: upload/soạn lại đúng submission; multipart ApplicantId/File |
| 10 | POST `/citizen/submissions/{submissionId}/submit` | submitDraft | Trực tiếp: Chốt bản khai. JSON applicantId; chưa gửi toàn bộ hồ sơ tiền kiểm |
| 11 | GET `/citizen/submissions/{submissionId}/download-docx` | downloadSubmission | Trực tiếp: tải bản khai, mở lại editor; query applicantId |
| 12 | GET `/officer/submissions/by-application/{applicationId}` | officerListSubmissions | Trực tiếp: discovery và metadata trong OfficerDocumentsPanel |
| 13 | GET `/officer/submissions/{submissionId}/download-docx` | officerDownloadSubmission | Trực tiếp: mở DOCX hiện tại/nguồn editor cán bộ |
| 14 | PUT `/officer/submissions/{submissionId}/annotate-docx` | officerAnnotateSubmission | Trực tiếp: tải lại Word có comment; **bổ sung** lưu file xuất từ editor online, không tự quyết định hồ sơ |
| 15 | POST `/officer/submissions/{submissionId}/request-revision` | officerRequestRevision | Có client, **không gọi riêng trong UI**. BE chuyển tới Workflow quyết định toàn hồ sơ; UI đã gọi Workflow sau kiểm tra nhận xét OPEN/version |
| 16 | POST `/officer/submissions/{submissionId}/approve` | officerApprove | Có client, **không gọi lặp sau Workflow approve**. BE cũng chuyển quyết định toàn hồ sơ, không phải duyệt riêng từng đơn |
| 17 | GET `/applications/{applicationId}/contents` | getContents | Trực tiếp: checklist công dân/cán bộ/PDF; gồm toàn bộ submissions và supportingDocuments, không phân trang |
| 18 | POST `/applications/{applicationId}/supporting-documents` | uploadSupportingDocument | Trực tiếp: upload giấy tờ, số bản thực tế; multipart ChecklistId/Quantity/SubmissionType/DocumentCopyType/File |
| 19 | GET `/applications/{applicationId}/supporting-documents` | listSupportingDocuments | Có client, UI hiện dùng supportingDocuments của **contents**. Không cần một màn danh sách trùng hoặc gọi thêm request để lấy cùng dữ liệu |
| 20 | DELETE `/supporting-documents/{documentId}` | deleteSupportingDocument | Trực tiếp: xác nhận xóa giấy tờ, kiểm tra lại contents/checklist |
| 21 | GET `/supporting-documents/{documentId}/download` | downloadSupportingDocument | Trực tiếp: xem/tải binary có xác thực |
| 22 | POST `/applications/{applicationId}/generate-pdf` | generatePdf | Trực tiếp: PDF sau tiền kiểm; multipart SubmissionId/DocumentType, dùng file server đã lưu |
| 23 | GET `/applications/{applicationId}/generated-documents` | listGeneratedDocuments | Trực tiếp: nhóm PDF theo submissionId; client/hook có filter query, dữ liệu legacy null được tách |
| 24 | GET `/generated-documents/{documentId}/download` | downloadGeneratedDocument | Trực tiếp: xem/tải PDF |
| 25 | GET `/applications/{applicationId}/approved-qr` | getApprovedQr | Trực tiếp: QR metadata, 404 chưa có QR không giả thành công |
| 26 | GET `/applications/{applicationId}/approved-qr/image` | downloadApprovedQr | Trực tiếp: hiển thị/tải PNG do server trả |

Kết quả: **23 thao tác có caller trực tiếp; 3 thao tác có luồng tương đương được chọn có chủ đích** (#15, #16, #19). Không thêm nút “duyệt đơn riêng” vì trái hành vi BE đang chạy.

## Những chỗ thiếu đã bổ sung

- Editor thực trong `src/components/documents/DocxOnlineEditor.tsx`, lazy load; dùng `@docx-editor.dev/react/core/fonts` 2.31.0, Apache-2.0. Các package tên cũ từng khảo sát đã gỡ khỏi dependency; không dùng bản deprecated hoặc gói Pro.
- Checklist công dân: Điền trực tuyến từ phôi hoặc Chỉnh sửa trực tuyến từ submission đã lưu. Mở bằng ID API, không mở trực tiếp URL Blob. Save lần đầu POST; các lần sau PUT. Lưu nháp không tự chốt hoặc gửi tiền kiểm. Khi hồ sơ khóa, editor chỉ xem.
- Cán bộ: Chỉnh sửa trực tuyến xuất DOCX qua PUT annotate-docx. Màn upload Word có comment và nhận xét Workflow vẫn được giữ riêng.
- Bản khai của tôi: danh sách toàn tài khoản, phân trang/lọc phía server; mở bản khai chỉ xem, mở hồ sơ liên quan để sửa. Bản legacy thiếu applicationId không bị tự gán liên kết.
- Thanh công cụ tiếng Việt: Trang đầu, Chèn, Bố trí; phông/cỡ chữ, đậm/nghiêng/gạch chân/gạch ngang, căn lề, danh sách, bảng 2×2, ngắt trang, hướng giấy, A4 và lề 2,54 cm. Có thu phóng, tải DOCX, Ctrl/Cmd+S lưu API và trạng thái chưa lưu/đã lưu. Lỗi giữ nội dung để thử lại; chỉ báo đã lưu sau API thành công.
- Tham khảo [EditDocx](https://editdocx.net/editor/): thanh công cụ phía trên, vùng giấy trắng/nền xám và thanh trạng thái. Trang live trong môi trường kiểm tra chỉ hiện shell Loading; không khẳng định đã sao chép mọi chi tiết giao diện/khả năng của sản phẩm tham chiếu.

## Quyết định và giới hạn

- Người dùng chọn **bản miễn phí để sửa DOCX; cán bộ thêm comment bằng Word rồi tải lại**. Không cài gói Pro hoặc yêu cầu license để dùng các phần đã triển khai.
- Engine miễn phí không cung cấp UI tạo/đọc đầy đủ Word comments/track changes. File có review content được nhắc mở bằng Word để đọc đầy đủ; DOCX export cần đối chiếu với Word cho mẫu thực tế. Kiểm thử giữ comment có sẵn được ghi trong PROGRESS, không đồng nhất với hỗ trợ comment online.
- Không cam kết layout mọi DOCX giống Word tuyệt đối. Font thay thế Word được đóng gói và tải từ cùng origin, không gửi nội dung tài liệu sang EditDocx hoặc dịch vụ editor khác.
- Vite build/dependency prebundle dùng target ES2022 do engine khởi tạo font shaping/WASM bằng top-level await. Cần trình duyệt hiện đại; kiểm thử hiện dùng Edge. Bundle editor lớn nhưng được tải khi mở editor; không gộp engine vào đường tải ban đầu.
- Không thấy lỗi route/multipart/ID cơ bản ở các API còn lại sau đối chiếu source. Vẫn có giới hạn BE: QR có thể chưa tồn tại ngay sau duyệt, chưa có tra cứu QR công khai/version, snapshot file lịch sử, API danh sách cán bộ ngoài pending. Xem [DOCUMENT_FORM_BACKEND_GAPS.md](DOCUMENT_FORM_BACKEND_GAPS.md).
- Đọc Swagger thành công không chứng minh mutation production, Blob, Gotenberg, phân quyền thật hoặc môi trường triển khai đã hoạt động. Chưa có tài khoản/dữ liệu thử nghiệm để xác minh Azure thật; không thực hiện mutation production/deploy.

## Kiểm tra

Kết quả cuối và các lượt lỗi/giới hạn runner được ghi trong `docs/PROGRESS.md`. Tests mới kiểm tra DOCX XML/binary thực với API mock, không thay nội dung bằng HTML rồi đổi đuôi thành .docx.
