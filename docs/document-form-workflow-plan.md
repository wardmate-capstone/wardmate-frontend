# Kế hoạch DocumentForm và ApplicationWorkflow

Ngày rà soát: 15/10/2026 (Asia/Saigon), cập nhật theo source BE mới pull. Trạng thái: đã triển khai toàn bộ phần FE mà hợp đồng backend hiện tại cho phép; các phần bị chặn được ghi tại `docs/DOCUMENT_FORM_BACKEND_GAPS.md`.

## 1. Nguồn và độ tin cậy

- Đã đọc OpenAPI đang chạy của [DocumentForm qua Gateway](https://wardmate-gateway.blackmeadow-a2f12767.japaneast.azurecontainerapps.io/api/document-form/swagger/v1/swagger.json) và [ApplicationWorkflow](https://wardmate-application-workflow.blackmeadow-a2f12767.japaneast.azurecontainerapps.io/swagger/v1/swagger.json) bằng HTTP GET. Chỉ đọc hợp đồng, chưa gọi thao tác ghi nghiệp vụ hoặc kiểm thử tài khoản thật.
- Đã đối chiếu controllers, DTO, handlers, validators và domain local tại `E:/wardmate-backend/src/Services/WardMate.Services.DocumentForm` và `E:/wardmate-backend/src/Services/WardMate.Services.ApplicationWorkflow`.
- **Source mới đã có các phần trước đây thiếu**: application contents, supporting/generated documents, officer submissions, liên kết ApplicationId/ChecklistId và toàn bộ metadata ChecklistDto. Bỏ yêu cầu chờ source để hiểu các luồng này. Đã đọc thêm `E:/wardmate-backend/docs/system-constraints.md` (WF-01..04, DOC-01..06) và đối chiếu trực tiếp controllers/handlers/security, không chỉ dựa vào tài liệu.
- Ràng buộc dưới đây là hành vi source mới đã đọc; chưa xác minh image/config/migration đang chạy trên Azure có đồng bộ source mới. OpenAPI thật đã được đọc ở lượt trước; lượt cập nhật này không gọi lại API Azure.
- Đã đọc PROGRESS, chuẩn UI/UX, FRONTEND_SETUP, design-system-and-auth, Procedure Management và Officer. Baseline frontend `6e62ab8`; lượt cập nhật giữ các thay đổi tài liệu đang có. Không chạy Git ở repository backend theo AGENTS.md của BE.

## 2. Phân chia trách nhiệm

| Thành phần | Trách nhiệm |
| --- | --- |
| ProcedureCatalog | Thủ tục, trường hợp, checklist cấu hình, danh sách phôi gắn thủ tục |
| DocumentForm | Phôi DOCX, bản khai cá nhân, file minh chứng, nội dung tài liệu của hồ sơ, tài liệu PDF |
| ApplicationWorkflow | Hồ sơ tiền kiểm, checklist của hồ sơ, phân công, nhận xét, gửi lại, lịch sử và quyết định tiền kiểm |

Chốt bản khai ở DocumentForm không đồng nghĩa gửi tiền kiểm. Quyết định tiền kiểm thuộc Workflow; endpoint approve/request-revision của DocumentForm hiện chuyển tiếp quyết định lên toàn bộ hồ sơ Workflow, không còn là quyết định độc lập cho một bản khai. Không tạo QR, tiếp nhận chính thức hoặc kết quả giải quyết từ một response lưu/chốt/xuất file.

## 3. Khoảng trống FE đã xác minh

1. `src/lib/api/formTemplates.ts`, `FormsView.tsx`, `ProcedureFormPicker.tsx` và `FormTemplateActions.tsx` đã có luồng kho/tạo/upload/xem/tải phôi. Tái sử dụng, không viết lại.
2. `FormDocxEditorModal.tsx` dùng contentEditable/execCommand; Lưu và Tải chỉ hiện toast. Chưa có import/export DOCX thật. `docx-preview` chỉ phục vụ xem, không phải editor DOCX.
3. `DossierChecklistView.tsx` tạo blob URL và lưu metadata/đánh dấu vào localStorage, chưa upload file lên DocumentForm. Reload không khôi phục được nội dung file từ blob URL cũ; đây chưa phải đính kèm trên server.
4. `CitizenPage.handleUpdateChecklistItem` gửi NOT_STARTED/IN_PROGRESS và tên file vào fileUrl, không phù hợp validator local yêu cầu PENDING/COMPLETED/REJECTED và URL HTTPS.
5. `workflow.ts` chưa giữ đủ metadata ChecklistDto Azure. Adapter công dân đang gán mặc định NOP/ORIGINAL/1, làm sai dữ liệu xuất trình, loại bản và số lượng.
6. Tạo hồ sơ chưa gửi caseCode; thủ tục nhiều trường hợp bị BE local từ chối. Chưa có hành động tạo hồ sơ từ trang chi tiết công khai tại vị trí khoanh đỏ trong ảnh.
7. Vite có proxy workflow; Vercel chưa có rewrite workflow, các request này rơi vào IAM. Vite cũng chưa có route cho citizen submissions/supporting/generated documents/application contents.
8. `VITE_WORKFLOW_API_URL` khác origin có thể bị chặn bởi bảo vệ origin trong JWT client chung; cần thống nhất proxy cùng origin thay vì bỏ bảo vệ.
9. `workflowError` chỉ tìm missingItems bên trong extensions; ASP.NET ProblemDetails local serialize trường này ở cấp đầu. Query workflow chưa đưa user ID vào key/chưa áp dụng đầy đủ enabled theo xác thực và quyền.
10. Không có endpoint xóa/resolve comment trong OpenAPI workflow đã đọc. Thông báo hiện tại gợi ý “xóa nhận xét trước khi duyệt” không có thao tác API tương ứng.
11. Trang chi tiết công khai đang có một số giá trị pháp lý/cơ quan/địa chỉ cố định hoặc fallback. Rà lại theo Catalog, hiển thị thiếu thông tin thay vì tự bổ sung dữ kiện pháp lý.

## 4. Hợp đồng API cần nối

Các đường dẫn dưới đây đều có prefix `/api/v1`. Phủ đủ 23 API nghiệp vụ DocumentForm và 16 API nghiệp vụ Workflow; mỗi service còn có `GET /` kỹ thuật, không cần UI. Các đoạn `/{id}` rút gọn kế thừa prefix nhóm tương ứng.

| Nhóm | Endpoint đã thấy trên Azure | Phần FE |
| --- | --- | --- |
| Phôi | GET/POST `/form-templates`; GET `/{templateId}`; POST `/{templateId}/upload-docx`; GET `/{templateId}/download-docx` | Giữ luồng đã có, kiểm tra lại quyền/lỗi/schema |
| Bản khai cá nhân | GET `/citizen/submissions`, GET `/{submissionId}` | Danh sách/metadata/mở lại; query applicantId theo danh tính thật |
| Lưu DOCX | POST `/citizen/submissions/draft`, PUT `/{submissionId}/draft` | Multipart; tạo có TemplateId, ApplicationId, ChecklistId, ApplicantId, File; cập nhật có ApplicantId, File |
| Chốt/tải bản khai | POST `/citizen/submissions/{submissionId}/submit`, GET `/{submissionId}/download-docx` | Chốt bản khai đã lưu; JSON applicantId khi chốt; query applicantId khi tải |
| Nội dung hồ sơ | GET `/applications/{applicationId}/contents` | Chỉ DocumentCitizen/chính chủ; gộp submissions/supportingDocuments theo checklistId; fileExists được kiểm tra trong Blob |
| Minh chứng | GET/POST `/applications/{applicationId}/supporting-documents`; DELETE `/supporting-documents/{documentId}`; GET `/{documentId}/download` | Multipart ChecklistId, SubmissionType, DocumentCopyType, Quantity, File; xem/tải/xóa file thật |
| PDF | POST `/applications/{applicationId}/generate-pdf`; GET `/{applicationId}/generated-documents`; GET `/generated-documents/{documentId}/download` | Multipart SubmissionId bắt buộc, DocumentType mặc định ORIGINAL_SUBMISSION; không gửi File; yêu cầu Workflow APPROVED và submission Approved |
| Cán bộ/bản khai | POST `/officer/submissions/{submissionId}/request-revision`, POST `/{submissionId}/approve`, PUT `/{submissionId}/annotate-docx`, GET `/{submissionId}/download-docx` | Hai POST quyết định chuyển tiếp Workflow; PUT chỉ thay DOCX, không tạo OPEN comment; GET cần đúng cán bộ thụ lý |
| Workflow công dân | POST/GET `/applications`; GET `/{id}`; PATCH `/{id}/checklists/{checklistId}`; POST `/{id}/submit`, `/{id}/resubmit` | Sửa DTO/validation, tạo nháp đúng trường hợp, gửi/gửi lại đúng phiên bản |
| Workflow cán bộ | GET `/officer/applications/pending`, GET `/{id}`; POST `/{id}/assign`, `/{id}/comments`, `/{id}/request-revision`, `/{id}/approve`, `/{id}/reject` | Dùng hooks có sẵn, kiểm tra quyền/phường/thụ lý/trạng thái |
| Theo dõi | GET `/applications/{id}/comments`, `/{id}/versions`, `/{id}/diff` | Nhận xét theo phiên bản, lịch sử, diff với fromVersion < toVersion |

Không tự bổ sung API cập nhật metadata/xóa phôi, cấu hình E-form JSON, sửa formData nháp, resolve comment hoặc QR khi hợp đồng hiện tại chưa có.

## 5. Validation và trạng thái

Các giới hạn sau đã xác nhận trong source mới pull. Triển khai FE theo hợp đồng này, sau đó kiểm thử tương thích deployment:

- Phôi: mã 1–50, tên 1–255 ký tự; trim, hiển thị lỗi trùng mã 409.
- DOCX: không rỗng, đúng .docx, tối đa 20 MiB. BE kiểm tra package/OpenXML, không macro; tối đa 5.000 ZIP entries và 100 MiB giải nén. FE không thay thế xác thực file của BE.
- Draft DOCX: template hoạt động và có file; ApplicantId trùng JWT sub; ApplicationId/ChecklistId bắt buộc, đúng hồ sơ. Mỗi cặp application/checklist chỉ có một submission chưa xóa; 409 document.draft_exists phải mở/cập nhật bản cũ, không tạo lặp. Bản legacy chưa liên kết trả document.legacy_unlinked, không tự gán.
- Lưu lại cho phép submission Draft/RevisionRequested; Submitted chỉ sửa khi controller đã xác minh Workflow cho sửa (DRAFT hoặc NEED_REVISION), sau lưu về Draft và phải chốt lại. Approved không được sửa. Workflow SUBMITTED/UNDER_REVIEW/APPROVED/REJECTED khóa ghi của công dân.
- Minh chứng: không rỗng, tối đa 20 MiB, đuôi .pdf/.jpg/.jpeg/.png/.doc/.docx. Quantity là Int32 > 0 (tối đa 2.147.483.647 theo kiểu dữ liệu); SubmissionType null/NOP/XUAT_TRINH; DocumentCopyType null/ORIGINAL/CERTIFIED_COPY/REGULAR_COPY. FE gửi metadata đúng checklist thay vì để null khi đã biết yêu cầu. Upload chỉ kiểm tra extension/độ dài khai báo ở handler, không mô tả là đã quét virus/kiểm định nội dung như DOCX chuyên biệt.
- Workflow: procedureId GUID hợp lệ; wardCode bắt buộc, tối đa 50, tồn tại trong IAM; caseCode tối đa 100, đúng trường hợp thủ tục; nhiều trường hợp phải chọn rõ.
- FormData là object JSON tối đa 65.536 byte UTF-8, không tính bằng số ký tự JavaScript.
- PATCH checklist: chỉ DRAFT; status PENDING/COMPLETED/REJECTED. Khi gửi lại: chỉ PENDING/COMPLETED, đủ đúng tập GUID checklist hiện có, không null/trùng/thêm/bớt; expectedVersionNumber > 0. DRAFT có currentVersionNumber = 0, không gán thành v1; snapshot đầu chỉ có sau gửi.
- FileUrl tối đa 500, HTTPS không chứa userinfo; không truyền tên file/blob URL. Quan hệ tài liệu dùng applicationId/checklistId mà API trả về; không suy đoán bằng tên.
- Note/lý do/nhận xét tối đa 4.000; nhận xét cần targetId tối đa 100, fieldLabel tối đa 255 và versionNumber > 0.
- FORM_FIELD dùng RFC 6901: escape ~ thành ~0, / thành ~1; xử lý nested object/array đúng snapshot. CHECKLIST_ITEM dùng GUID mục hồ sơ.
- Danh sách: page 1–1.000.000, pageSize 1–100; pending cán bộ chỉ filter SUBMITTED/UNDER_REVIEW, không gửi các nhãn UI hoặc trạng thái khác.
- Cán bộ đúng phường, đang thụ lý, không tự thẩm định hồ sơ của mình. Nhận xử lý là mutation nghiệp vụ; ưu tiên nút rõ ràng, không dùng mở trang như một thao tác ghi ngầm.
- Yêu cầu sửa cần ít nhất một OPEN comment ở phiên bản hiện tại. Duyệt chỉ UNDER_REVIEW và không còn OPEN ở phiên bản hiện tại. Chỉ BE quyết định chuyển trạng thái/resolve khi gửi lại.
- Luồng hồ sơ: DRAFT → SUBMITTED → UNDER_REVIEW → APPROVED/REJECTED hoặc NEED_REVISION → gửi lại → SUBMITTED. Khóa ghi theo trạng thái API; không dùng nhãn view model để quyết định nghiệp vụ.

### Quy tắc đối chiếu tài liệu liên service đã chốt

- `WorkflowRequests.cs`: lọc checklist/form dùng chung + đúng case; đối chiếu chính xác `formDefinitions.formCode == checklistSchema.checklistId` (Ordinal). Trùng mã thì gắn FormTemplateId, OR IsMandatory và lấy Quantity lớn hơn; không trùng thì BE thêm mục checklist từ form. FE không đoán theo tên và không tạo GUID checklist; dùng GUID từ ApplicationDto. Metadata thủ tục được chụp lúc tạo, thay Catalog không tự sửa hồ sơ cũ.
- `DocumentContentsClient.cs`: PATCH COMPLETED kiểm tra mục tương ứng; submit kiểm tra mọi mục bắt buộc hoặc đã COMPLETED; resubmit kiểm tra mục bắt buộc hoặc được payload đánh COMPLETED. Mục gắn template cần submission cùng checklist/template, trạng thái Submitted/Approved, fileExists=true; một submission đủ cho nhiều bản in. Không chấp nhận supporting document thay mẫu DOCX bắt buộc.
- Mục không gắn template cần tổng Quantity của supporting documents có file thật, đúng SubmissionType/DocumentCopyType (nếu checklist quy định) đủ số lượng yêu cầu. Source không miễn file cho XUAT_TRINH; UI vẫn giải thích cần mang bản giấy khi đến.
- Thiếu bằng chứng: 422 application.documents_incomplete kèm **missingChecklistIds**. Thiếu trạng thái hoàn tất bắt buộc: 422 application.checklist_incomplete kèm **missingItems**. Lỗi kết nối/response contents null, sai application, null item, ID rỗng/trùng: 503 application.documents_unavailable; không coi là checklist rỗng hợp lệ.
- Snapshot JSON có metadata checklist nhưng không đóng băng DOCX/minh chứng theo từng version. Nội dung file hiện tại không phải bằng chứng file đã nộp ở version cũ; UI lịch sử chỉ cam kết diff dữ liệu JSON, ghi rõ tài liệu đang xem là bản hiện tại nếu chưa có API file theo version.

### Quyền và quyết định đã xác minh

| Nhóm | Điều kiện source mới | Hệ quả FE |
| --- | --- | --- |
| Đọc kho/phôi | DocumentUser: REGISTERED_CITIZEN, FRONT_DESK_OFFICER, MANAGER, PROCEDURE_MANAGER hoặc IT_ADMIN | Khách cần đăng nhập để tải; không hứa tải ẩn danh |
| Tạo/upload phôi | DocumentManager yêu cầu role PROCEDURE_MANAGER, cộng DocumentUser | IT_ADMIN chỉ có permission không vượt role này; 403 không phải lỗi JWT hoặc tự động cần refresh |
| Citizen submissions / contents | DocumentCitizen + chính chủ; applicantId phải trùng sub ở submissions | Không dùng contents/list citizen cho workspace cán bộ |
| Ghi/xóa minh chứng | DocumentCitizen, chính chủ và Workflow DRAFT/NEED_REVISION | Khóa thao tác sau gửi, dùng API thay localStorage |
| Đọc minh chứng/PDF dùng chung | Ưu tiên kiểm tra chủ sở hữu; nếu 404 và có FRONT_DESK_OFFICER mới thử quyền thụ lý | Tài khoản vừa công dân vừa cán bộ vẫn đọc hồ sơ của mình qua nhánh chính chủ |
| Officer submissions | FRONT_DESK_OFFICER, đúng cán bộ thụ lý, khác chủ hồ sơ; Workflow xác minh phường | Annotate còn yêu cầu UNDER_REVIEW và submission Submitted/RevisionRequested; không đổi status |
| Workflow | Permission workflow.* tương ứng từng action; role/phường/quyền được lấy lại từ IAM mỗi request | UI dùng quyền hiện có nhưng BE quyết định cuối; IAM lỗi trả 503, không logout như hết phiên |

- DocumentForm POST approve/request-revision gọi `ApplicationAccess.Decide` chuyển tiếp Workflow, request-revision chuyển Comment thành reason. OfficerId có thể bỏ; nếu gửi phải trùng caller. Không gọi cả hai endpoint quyết định như hai bước riêng. Word annotation không tạo nhận xét OPEN: vẫn phải thêm comment Workflow trước yêu cầu sửa.
- PDF: application phải APPROVED; truy cập đồng bộ submission Submitted → Approved theo cán bộ duyệt. SubmissionId đúng application, chưa xóa và Approved là bắt buộc; không phải ApplicationId. File upload thay thế bị document.use_saved_docx. DocumentType mặc định ORIGINAL_SUBMISSION, trim/uppercase; source chưa có whitelist enum, không tự tạo danh mục pháp lý.
- Gotenberg chuyển DOCX đã lưu sang PDF, bỏ Word comments trên bản sao, giữ nguồn; mỗi lần xuất tạo bản ghi mới. Lỗi render/storage phải báo lỗi, không tạo PDF mẫu; cần cấu hình Gotenberg:Url và Blob ở BE.

### Khoảng trống BE còn ảnh hưởng UI

- Policy quản lý phôi chưa cho IT_ADMIN nếu không kèm PROCEDURE_MANAGER. FE phải phản ánh đúng policy; nếu muốn giữ quyền quản trị phôi cho Admin như UI hiện tại cần quyết định/sửa BE riêng, không bypass.
- Chưa thấy API cho cán bộ liệt kê submissions của hồ sơ: contents là chính chủ/DocumentCitizen; workflow DTO chỉ có formTemplateId, không có submissionId; các endpoint officer DOCX lại cần submissionId. Không nối list bằng applicantId của công dân. Cần BE cung cấp discovery có quyền thụ lý trước khi hoàn tất danh sách DOCX trong workspace cán bộ.
- File lịch sử chưa có hợp đồng bất biến theo version; chưa có API resolve/xóa comment, sửa formData DRAFT, QR hoặc tiếp nhận chính thức. Các class schema E-form trong source không tự tạo thành API HTTP cấu hình E-form.

### Điểm đối chiếu source

Đường dẫn dưới đây tương đối với `E:/wardmate-backend/src/Services/`:

| Quy tắc | Source đã đọc |
| --- | --- |
| Liên kết mã, metadata, tạo checklist | `WardMate.Services.ApplicationWorkflow/WardMate.Services.ApplicationWorkflow.Application/WorkflowRequests.cs`, `WorkflowContracts.cs` |
| Kiểm tra file, loại bản, số lượng | `WardMate.Services.ApplicationWorkflow/WardMate.Services.ApplicationWorkflow.API/DocumentContentsClient.cs`, `Controllers/ApplicationsController.cs`, `Controllers/ApplicationReviewController.cs` |
| Quyền/phường lấy lại từ IAM | `WardMate.Services.ApplicationWorkflow/WardMate.Services.ApplicationWorkflow.API/WorkflowAccessMiddleware.cs` |
| Quyền và trạng thái tài liệu | `WardMate.Services.DocumentForm/WardMate.Services.DocumentForm.API/Security/ApplicationAccess.cs`, `DocumentAuthentication.cs` |
| Sửa/chốt bản khai, quyết định và annotate | `WardMate.Services.DocumentForm/WardMate.Services.DocumentForm.API/Controllers/CitizenSubmissionsController.cs`, `OfficerSubmissionsController.cs`; Application `Commands/SaveDraftSubmissionCommand.cs`, `SaveOfficerAnnotatedDocxCommand.cs`; Domain `Entities/UserSubmission.cs` |
| Metadata/Blob contents và phạm vi chính chủ | `WardMate.Services.DocumentForm/WardMate.Services.DocumentForm.API/Controllers/ApplicationContentsController.cs`; Application `Queries/GetApplicationContentsQuery.cs` |
| Minh chứng | `WardMate.Services.DocumentForm/WardMate.Services.DocumentForm.Application/Commands/UploadSupportingDocumentCommand.cs`; API `Controllers/SupportingDocumentsController.cs` |
| PDF | `WardMate.Services.DocumentForm/WardMate.Services.DocumentForm.API/Controllers/GeneratedDocumentsController.cs`; Application `Commands/GeneratePdfDocumentCommand.cs`; Infrastructure `Pdf/GotenbergPdfRenderEngine.cs` |
| Unique bản khai còn hoạt động | `WardMate.Services.DocumentForm/WardMate.Services.DocumentForm.Infrastructure/Persistence/Configurations/UserSubmissionConfiguration.cs` |

## 6. Kế hoạch thực hiện theo thứ tự

### Bước 1 — Chốt hợp đồng và định tuyến (ưu tiên P0)

- Source/luật đã đọc ở mục 5: triển khai phần FE đã rõ ngay, không chờ lấy source thêm. Xác nhận version/config/migration deployment trước kiểm thử thật; ghi nhận riêng hai phụ thuộc BE: quyền quản lý phôi của IT_ADMIN và discovery submissionId cho cán bộ.
- Bổ sung routing đồng bộ Vite/Vercel: route DocumentForm cụ thể cho `/applications/:id/contents`, `supporting-documents`, `generate-pdf`, `generated-documents` phải đứng trước prefix `/applications` của workflow; thêm citizen/officer submissions và supporting/generated download routes. Các endpoint workflow còn lại đi workflow, auth đi IAM.
- Dùng JWT client chung với base URL từng service lấy từ env; giữ refresh HttpOnly tại IAM và chỉ cho gửi access token tới các origin được khai báo trong bốn biến cấu hình. Không chứa URL backend trong source/Vite/Vercel.
- Kết quả nghiệm thu: mỗi route đi đúng service trên local và cấu hình production, không bị IAM/SPA fallback; lỗi 401/403/404/409/413/422/503 phân biệt được.

### Bước 2 — Client DocumentForm và đồng bộ dữ liệu (P0)

- Thêm module API/DTO Zod và TanStack hooks cho submissions, contents, supporting/generated documents; giữ module phôi hiện có. Multipart để browser dựng boundary; binary có xử lý lỗi JSON/ProblemDetails.
- Bổ sung ChecklistDto Azure vào workflow.ts và adapters; giữ sortOrder, caseCode, submissionType, documentCopyType, quantity, conditionNote, formTemplateId; bỏ giá trị cố định NOP/ORIGINAL/1.
- Cache riêng theo user/application/checklist; query enable theo danh tính/quyền; AbortSignal; invalidate tài liệu/checklist/detail sau ghi, không dùng localStorage làm nguồn trạng thái file đã lưu.
- Chuẩn hóa ProblemDetails/errors/missingItems/missingChecklistIds/traceId (extensions serialize ở cấp đầu), lỗi theo trường/mục; không retry mutation tự động. Thêm xử lý draft_exists, legacy_unlinked, application_locked, template_mismatch, concurrent_edit/concurrent_update, workflow_decision_rejected, sync_unavailable. Ghi thất bại giữ dữ liệu nhập để thử lại.
- Nghiệm thu: schema đọc đúng DTO Azure, không mất metadata; upload/save lỗi không hiển thị hoàn tất.

### Bước 3 — Điểm bắt đầu từ chi tiết thủ tục (P1)

- Vùng khoanh đỏ ở header: đề xuất nút **Chuẩn bị hồ sơ**; mobile xuống hàng, không che tên thủ tục/PDF.
- Giữ procedureId/caseCode khi chuyển sang cổng công dân; khách qua đăng nhập bằng returnTo nội bộ an toàn. GET/mở trang không tự tạo nháp; tạo qua xác nhận của người dùng.
- Form tạo nháp bằng RHF/Zod: thủ tục thật, trường hợp khi có nhiều case, phường từ IAM; không tự chọn thủ tục đầu tiên khi lựa chọn sai/mất dữ liệu. Với phạm vi tiếp nhận chưa đủ thông tin thì giải thích và chưa bật gửi tiền kiểm.
- Trang quản lý thủ tục tái sử dụng ProcedureApiEditor/ProcedureFormPicker. Giải thích và cho chọn mục checklist để đặt formCode bằng checklistId qua formDefinitions của ProcedureInput hiện có; không đổi code template trong kho chung. Nếu formCode khác mọi checklist thì mô tả rõ BE sẽ thêm mục bản khai riêng. Kiểm tra case tương thích và trùng mã trước lưu, giữ validation Catalog, không thêm endpoint nối quan hệ mới.
- Nghiệm thu: chọn thủ tục nhiều case tạo đúng checklist; login giữ ngữ cảnh; không bịa cơ quan/địa chỉ/loại thủ tục.

### Bước 4 — File minh chứng và bản khai cá nhân (P1)

- Trong chi tiết hồ sơ, mỗi mục hiển thị đúng nộp/xuất trình, loại bản, số lượng, điều kiện và file đã lưu; upload/tải/xóa bằng DocumentForm, reload đọc lại server.
- Bổ sung danh sách/mở lại bản khai theo applicationId/checklistId/templateId, lưu nháp/chốt bản khai và trạng thái lưu. Chỉ báo thành công sau response thật.
- Luồng DOCX tối thiểu với dependency hiện có: tải phôi → sửa bằng Word → tải DOCX đã sửa lên → xem trước bằng DocxPreview → lưu/chốt. Tên nút phải phản ánh đúng thao tác upload, không trình bày contentEditable như editor DOCX hoàn chỉnh.
- Nếu cần sửa trực tiếp trên web: cần chọn engine DOCX có import/export thật và đánh giá bản quyền/hosting/độ giữ định dạng trước. Không chuyển HTML sang file đuôi .docx; không coi docx-preview là editor. Đây là nhánh mở rộng có quyết định riêng.
- Modal Radix, Toast Sonner, loading/khóa gửi trùng, báo dữ liệu chưa lưu; xem lỗi theo mục; bàn phím/mobile. Không tự công bố dữ liệu profile là xác thực VNeID.
- Với DRAFT: upload/lưu → chốt bản khai (nếu là mẫu) → PATCH COMPLETED → refetch. Nếu PATCH thất bại sau upload thì giữ file đã lưu và cho hoàn tất lại, không upload trùng. Xóa/thay tài liệu phải tải lại contents và đưa trạng thái chuẩn bị về đúng thực tế; không để tick cũ che file thiếu.
- Với NEED_REVISION: tải/sửa → PUT submission hiện có (Submitted có thể quay về Draft) → chốt lại → lưu checklist sửa trong form FE → POST resubmit đầy đủ. Không PATCH checklist vì endpoint đó chỉ cho DRAFT; refresh sẽ chưa lưu các lựa chọn checklist cục bộ nên cần cảnh báo dữ liệu chưa gửi.
- Nghiệm thu: file tồn tại thật sau F5; mở lại đúng bản cá nhân; phôi gốc giữ nguyên; file upload lỗi không làm checklist hoàn tất. Một application/checklist dùng lại submissionId cũ, không tạo bản thứ hai để đáp ứng quantity bản giấy.

### Bước 5 — Hoàn thiện cầu nối workflow (P1)

- Rà soát trước gửi: checklist bắt buộc + contents từ server; giải thích mục thiếu; không tự hoàn tất bằng tick local hoặc tên file. Giữ thông báo tiền kiểm và checkbox xác nhận hiểu trước thao tác gửi.
- Phân biệt chốt bản khai và gửi tiền kiểm hồ sơ bằng nhãn/nút rõ ràng. Không chain mutation hai service như một transaction đã thành công: nếu bước sau thất bại, giữ kết quả bước trước và cho thử lại đúng bước.
- NEED_REVISION: cho sửa đúng phần được phép; gửi đủ checklist/formData/expectedVersionNumber; conflict tải bản mới và giữ nội dung người dùng để đối chiếu, không ghi đè im lặng.
- Cán bộ quyết định hồ sơ bằng workflow API hiện có. Hai POST officer/submissions của DocumentForm là đường tương thích chuyển tiếp cùng quyết định; ghi rõ trong client/tài liệu, kiểm thử adapter nếu nối, không tạo thêm hai nút “duyệt bản khai”/“duyệt hồ sơ” và không gọi kép. Sau thành công invalidate cả workflow và document queries; đồng bộ Approved ở DocumentForm có thể xảy ra khi đọc/kiểm tra truy cập.
- Khi có nguồn submissionId hợp lệ cho cán bộ: nối tải/annotate bằng officer endpoint. Annotate cần UNDER_REVIEW + submission Submitted/RevisionRequested, không tạo OPEN comment; vẫn thêm nhận xét Workflow trước request-revision. Danh sách minh chứng qua supporting-documents có thể làm độc lập; phần liệt kê DOCX chờ BE discovery đã nêu ở mục 5.
- Dùng API versions/diff cho snapshot JSON; không trình bày file hiện tại là file của phiên bản cũ. Không tạo nút xóa/resolve comment chưa có API.
- Nghiệm thu: luồng nháp → gửi → nhận xử lý → yêu cầu sửa → sửa/gửi lại → nhận xử lý → duyệt hoặc từ chối; kiểm tra sai phường/chủ sở hữu/cán bộ, 409 và 422.

### Bước 6 — PDF và hồi quy (P2)

- Nối tạo/danh sách/tải PDF khi Workflow APPROVED: multipart SubmissionId + DocumentType=ORIGINAL_SUBMISSION, không có File. Refetch trạng thái sau đồng bộ; lỗi Gotenberg/Blob hiển thị thử lại. Phân biệt PDF nguồn thủ tục với PDF bản khai đã tiền kiểm; tên “PDF chính thức” trong BE không được biến thành kết quả giải quyết thủ tục trên UI.
- Chạy typecheck/lint/build; Playwright Edge tại cổng 4317 theo cấu hình hiện tại. Bộ mock: form-templates, procedure-manager, citizen file/submissions, workflow trạng thái/phiên bản/quyền, routing. Nếu sửa auth/core chạy thêm jwt-client/design-system/landing.
- Test có giá trị: nội dung binary DOCX thật, multipart đúng IDs, reload đọc lại, upload/save fail, thiếu file, cross-user, lỗi phiên bản, bảo vệ dữ liệu chưa lưu, keyboard/mobile. Bổ sung đúng/sai formCode–checklistId, mẫu bắt buộc không thay bằng minh chứng, tổng quantity/loại bản/hình thức, XUAT_TRINH vẫn cần bằng chứng, mục tùy chọn đã COMPLETED cũng phải có file, contents null/trùng, DRAFT version 0, draft_exists và sửa Submitted sau NEED_REVISION.
- Test quyền: IT_ADMIN thiếu PROCEDURE_MANAGER bị từ chối quản lý phôi; citizen contents không dùng cho officer; tài khoản hai role đọc hồ sơ của mình; IAM/Workflow/DocumentForm lỗi 503 giữ trạng thái chưa xác minh. Test quyết định qua DocumentForm không phát sinh quyết định thứ hai, annotation không thay thế OPEN comment; PDF trước duyệt/file thay thế bị chặn, render lỗi không trả file giả.
- Kiểm thử Azure có tài khoản/quyền hợp lệ trên hồ sơ thử nghiệm được phép: ghi riêng môi trường, kết quả và giới hạn. Mock qua không đồng nghĩa tích hợp thật qua.

## 7. Điều kiện cần giải quyết trước phần phụ thuộc

1. **Đã giải quyết bằng source mới**: liên kết formCode–checklistId, quy tắc kiểm tra bằng chứng, sửa/xóa tài liệu, đồng bộ quyết định và xuất PDF. Không tiếp tục liệt kê các phần này như thiếu hợp đồng.
2. **Cần phối hợp BE**: discovery submissionId cho cán bộ đúng phạm vi thụ lý; quyết định có mở quản lý phôi cho IT_ADMIN hay giữ role PROCEDURE_MANAGER. Không chặn các phần công dân/routing/DTO đã rõ.
3. **Giới hạn cần giữ trong UI**: file không có snapshot bất biến theo version; PDF DTO hiện không có SubmissionId để ánh xạ chắc chắn PDF về từng bản khai trong cùng hồ sơ, nên hiển thị danh sách ở cấp hồ sơ, không đoán theo DocumentType/tên. Chưa có API lưu formData DRAFT, resolve comment, QR hoặc tiếp nhận chính thức.
4. **Editor**: cần quyết định engine nếu chỉnh DOCX trực tiếp trên web; luồng Word tải về/tải lại triển khai được bằng stack hiện có.
5. **Trước xác nhận tích hợp thật**: kiểm tra config BE Services:ApplicationWorkflow:BaseUrl, Services:DocumentForm:BaseUrl, IAM/Catalog, Gotenberg:Url, Blob và migration liên kết/metadata; chỉ xác minh cấu hình cần thiết, không đưa secret vào FE/tài liệu. Source mới không chứng minh Azure đã deploy cùng bản.

## 8. Kết quả triển khai

Đã triển khai routing cùng origin, client/Zod/hooks DocumentForm, metadata Workflow, luồng tạo hồ sơ đúng case/phường, file minh chứng, bản khai DOCX, gửi/gửi lại, PDF sau duyệt và tệp minh chứng trong workspace cán bộ. Đã bỏ localStorage/blob URL làm nguồn dữ liệu hồ sơ và bỏ các thao tác lưu/xem giả.

Các endpoint DocumentForm và Workflow có thể gọi từ hợp đồng hiện tại đều đã có client hoặc UI tương ứng. Bốn endpoint officer submission đã có client nhưng chưa thể gắn đúng bản khai vào UI vì backend không cung cấp API discovery `submissionId` theo `applicationId`; không gọi đoán bằng applicantId. Các giới hạn còn lại và đề xuất API/DTO nằm trong `docs/DOCUMENT_FORM_BACKEND_GAPS.md`.

Kiểm tra local: typecheck, lint và production build đạt. Nhóm 5 test liên quan đã được cập nhật theo CTA/điều hướng mới; 4 ca đạt trong lượt gộp và ca selector breadcrumb cuối đạt khi chạy riêng sau sửa. Toàn bộ 143 ca đã chạy phần thân nhưng có 5 timeout do locator cũ/tải song song và tiến trình Playwright treo khi kết thúc; không ghi nhận là pass toàn bộ. Chưa kiểm thử mutation với tài khoản/quyền Azure thật, chưa commit/push/deploy.
