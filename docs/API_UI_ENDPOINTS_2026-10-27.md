# Danh mục endpoint và UI — 27/10/2026

Nguồn: Swagger JSON đọc bằng GET từ 5 dịch vụ Azure do người dùng cung cấp; đối chiếu controller tại E:/wardmate-backend và code FE. Mỗi dòng là một HTTP operation. Đây là kiểm kê route và call-site, chưa xác minh nghiệp vụ có xác thực trên Azure. Cột bằng chứng ghi chuỗi module liên quan theo phân hệ; xem báo cáo chính cùng thư mục để biết giới hạn.

## iam

| HTTP | Endpoint | Trạng thái | Bằng chứng / lý do |
|---|---|---|---|
| GET | `/api/v1/accounts` | Không dùng trực tiếp | UI dùng /admin/users, /manager/officers và /users/me; không phải thiếu luồng |
| GET | `/api/v1/accounts/{userId}` | Đã nối UI | index.ts/rbac.ts → Auth/Profile/AdminPage/AdminRbacViews/ManagerPage/CreateDossierModal |
| PUT | `/api/v1/accounts/{userId}/status` | Đã nối UI | index.ts/rbac.ts → Auth/Profile/AdminPage/AdminRbacViews/ManagerPage/CreateDossierModal |
| GET | `/api/v1/users/profiles` | Không dùng trực tiếp | UI dùng /admin/users, /manager/officers và /users/me; không phải thiếu luồng |
| GET | `/api/v1/users/{userId}/profile` | Đã nối UI | index.ts/rbac.ts → Auth/Profile/AdminPage/AdminRbacViews/ManagerPage/CreateDossierModal |
| POST | `/api/v1/users/{userId}/profile` | Đã nối UI | index.ts/rbac.ts → Auth/Profile/AdminPage/AdminRbacViews/ManagerPage/CreateDossierModal |
| PUT | `/api/v1/users/{userId}/profile` | Đã nối UI | index.ts/rbac.ts → Auth/Profile/AdminPage/AdminRbacViews/ManagerPage/CreateDossierModal |
| DELETE | `/api/v1/users/{userId}/profile` | Có UI Manager, Admin chủ động không mở | ManagerPage.deleteAdminProfile; giữ quyết định Admin không có nút xóa |
| POST | `/api/v1/auth/password-otp/request` | Đã nối UI | index.ts/rbac.ts → Auth/Profile/AdminPage/AdminRbacViews/ManagerPage/CreateDossierModal |
| POST | `/api/v1/auth/password-otp/verify-and-change` | Đã nối UI | index.ts/rbac.ts → Auth/Profile/AdminPage/AdminRbacViews/ManagerPage/CreateDossierModal |
| POST | `/api/v1/auth/register` | Đã nối UI | index.ts/rbac.ts → Auth/Profile/AdminPage/AdminRbacViews/ManagerPage/CreateDossierModal |
| POST | `/api/v1/auth/login` | Đã nối UI | index.ts/rbac.ts → Auth/Profile/AdminPage/AdminRbacViews/ManagerPage/CreateDossierModal |
| POST | `/api/v1/auth/refresh-token` | Đã nối UI | index.ts/rbac.ts → Auth/Profile/AdminPage/AdminRbacViews/ManagerPage/CreateDossierModal |
| POST | `/api/v1/auth/revoke-token` | Đã nối UI | index.ts/rbac.ts → Auth/Profile/AdminPage/AdminRbacViews/ManagerPage/CreateDossierModal |
| GET | `/api/v1/users/me/profile` | Đã nối UI | index.ts/rbac.ts → Auth/Profile/AdminPage/AdminRbacViews/ManagerPage/CreateDossierModal |
| POST | `/api/v1/users/me/profile` | Đã nối UI | index.ts/rbac.ts → Auth/Profile/AdminPage/AdminRbacViews/ManagerPage/CreateDossierModal |
| PUT | `/api/v1/users/me/profile` | Đã nối UI | index.ts/rbac.ts → Auth/Profile/AdminPage/AdminRbacViews/ManagerPage/CreateDossierModal |
| DELETE | `/api/v1/users/me/profile` | Có client, chưa có UI | deleteMyProfile; chưa có quyết định mở thao tác tự xóa |
| GET | `/api/v1/rbac/roles` | Đã nối UI | index.ts/rbac.ts → Auth/Profile/AdminPage/AdminRbacViews/ManagerPage/CreateDossierModal |
| POST | `/api/v1/rbac/roles` | Đã nối UI | index.ts/rbac.ts → Auth/Profile/AdminPage/AdminRbacViews/ManagerPage/CreateDossierModal |
| GET | `/api/v1/rbac/roles/{roleId}` | Có client, không gọi riêng | rbac.ts → AdminRbacViews; UI lấy quyền từ danh sách role |
| PUT | `/api/v1/rbac/roles/{roleId}` | Đã nối UI | rbac.ts → AdminRbacViews; UI lấy quyền từ danh sách role |
| DELETE | `/api/v1/rbac/roles/{roleId}` | Đã nối UI | rbac.ts → AdminRbacViews; UI lấy quyền từ danh sách role |
| GET | `/api/v1/rbac/permissions` | Đã nối UI | index.ts/rbac.ts → Auth/Profile/AdminPage/AdminRbacViews/ManagerPage/CreateDossierModal |
| GET | `/api/v1/rbac/roles/{roleId}/permissions` | Không gọi riêng | Role DTO đã kèm permissions; UI dùng DTO và PUT/DELETE từng quyền |
| PUT | `/api/v1/rbac/roles/{roleId}/permissions/{permissionId}` | Đã nối UI | index.ts/rbac.ts → Auth/Profile/AdminPage/AdminRbacViews/ManagerPage/CreateDossierModal |
| DELETE | `/api/v1/rbac/roles/{roleId}/permissions/{permissionId}` | Đã nối UI | index.ts/rbac.ts → Auth/Profile/AdminPage/AdminRbacViews/ManagerPage/CreateDossierModal |
| GET | `/api/v1/rbac/users/{userId}/roles` | Đã nối UI | index.ts/rbac.ts → Auth/Profile/AdminPage/AdminRbacViews/ManagerPage/CreateDossierModal |
| PUT | `/api/v1/rbac/users/{userId}/roles/{roleId}` | Đã nối UI | index.ts/rbac.ts → Auth/Profile/AdminPage/AdminRbacViews/ManagerPage/CreateDossierModal |
| DELETE | `/api/v1/rbac/users/{userId}/roles/{roleId}` | Đã nối UI | index.ts/rbac.ts → Auth/Profile/AdminPage/AdminRbacViews/ManagerPage/CreateDossierModal |
| GET | `/api/v1/rbac/audit-logs` | Đã nối UI | index.ts/rbac.ts → Auth/Profile/AdminPage/AdminRbacViews/ManagerPage/CreateDossierModal |
| POST | `/api/v1/accounts/front-desk` | Đã nối UI | index.ts/rbac.ts → Auth/Profile/AdminPage/AdminRbacViews/ManagerPage/CreateDossierModal |
| POST | `/api/v1/accounts/manager` | Đã nối UI | index.ts/rbac.ts → Auth/Profile/AdminPage/AdminRbacViews/ManagerPage/CreateDossierModal |
| POST | `/api/v1/accounts/procedure-manager` | Đã nối UI | index.ts/rbac.ts → Auth/Profile/AdminPage/AdminRbacViews/ManagerPage/CreateDossierModal |
| GET | `/api/v1/accounts/wards` | Đã nối UI | index.ts/rbac.ts → Auth/Profile/AdminPage/AdminRbacViews/ManagerPage/CreateDossierModal |
| POST | `/api/v1/accounts/wards` | Đã nối UI | index.ts/rbac.ts → Auth/Profile/AdminPage/AdminRbacViews/ManagerPage/CreateDossierModal |
| PUT | `/api/v1/accounts/{userId}/ward` | Đã nối UI | index.ts/rbac.ts → Auth/Profile/AdminPage/AdminRbacViews/ManagerPage/CreateDossierModal |
| GET | `/api/v1/manager/officers/{userId}/assignment-context` | Nội bộ dịch vụ | Workflow/IAM dùng kiểm tra quyền; không gọi từ browser |
| GET | `/api/v1/manager/officers` | Đã nối UI | index.ts/rbac.ts → Auth/Profile/AdminPage/AdminRbacViews/ManagerPage/CreateDossierModal |
| GET | `/api/v1/admin/users` | Đã nối UI | index.ts/rbac.ts → Auth/Profile/AdminPage/AdminRbacViews/ManagerPage/CreateDossierModal |
| PUT | `/api/v1/manager/officers/{userId}/categories` | Đã nối UI | index.ts/rbac.ts → Auth/Profile/AdminPage/AdminRbacViews/ManagerPage/CreateDossierModal |
| GET | `/api/v1/users/access-context` | Nội bộ dịch vụ | Workflow/IAM dùng kiểm tra quyền; không gọi từ browser |
| GET | `/api/v1/wards` | Đã nối UI | index.ts/rbac.ts → Auth/Profile/AdminPage/AdminRbacViews/ManagerPage/CreateDossierModal |
| GET | `/api/v1/users/me/phone-verification` | Ngoài phạm vi đã chốt | Phone/SMS chưa bật theo quyết định trước |
| POST | `/api/v1/users/me/phone-verification/request` | Ngoài phạm vi đã chốt | Phone/SMS chưa bật theo quyết định trước |
| POST | `/api/v1/users/me/phone-verification/confirm` | Ngoài phạm vi đã chốt | Phone/SMS chưa bật theo quyết định trước |
| POST | `/api/v1/users/me/change-password` | Đã nối UI | index.ts/rbac.ts → Auth/Profile/AdminPage/AdminRbacViews/ManagerPage/CreateDossierModal |
| GET | `/api/v1/users` | Không dùng trực tiếp | UI dùng /admin/users, /manager/officers và /users/me; không phải thiếu luồng |
| GET | `/api/v1/users/me` | Đã nối UI | index.ts/rbac.ts → Auth/Profile/AdminPage/AdminRbacViews/ManagerPage/CreateDossierModal |
| GET | `/` | Hạ tầng | Health; không cần trang nghiệp vụ |

## catalog

| HTTP | Endpoint | Trạng thái | Bằng chứng / lý do |
|---|---|---|---|
| POST | `/api/v1/procedure-manager/categories` | Đã nối UI | procedures.ts → HomePage/ProceduresPage/ProcedureDetailPage/ProcedureManagerPage/ProcedureDraftWorkspace/ProcedureCategoriesView/ProcedureChecklistModal |
| PUT | `/api/v1/procedure-manager/categories/{id}` | Đã nối UI | procedures.ts → HomePage/ProceduresPage/ProcedureDetailPage/ProcedureManagerPage/ProcedureDraftWorkspace/ProcedureCategoriesView/ProcedureChecklistModal |
| DELETE | `/api/v1/procedure-manager/categories/{id}` | Đã nối UI | procedures.ts → HomePage/ProceduresPage/ProcedureDetailPage/ProcedureManagerPage/ProcedureDraftWorkspace/ProcedureCategoriesView/ProcedureChecklistModal |
| GET | `/api/v1/procedure-manager/document-forms` | Đã nối UI | procedures.ts → HomePage/ProceduresPage/ProcedureDetailPage/ProcedureManagerPage/ProcedureDraftWorkspace/ProcedureCategoriesView/ProcedureChecklistModal |
| POST | `/api/v1/procedure-manager/drafts/extract-preview` | Đã nối UI | procedures.ts → HomePage/ProceduresPage/ProcedureDetailPage/ProcedureManagerPage/ProcedureDraftWorkspace/ProcedureCategoriesView/ProcedureChecklistModal |
| GET | `/api/v1/procedure-manager/drafts` | Đã nối UI | procedures.ts → HomePage/ProceduresPage/ProcedureDetailPage/ProcedureManagerPage/ProcedureDraftWorkspace/ProcedureCategoriesView/ProcedureChecklistModal |
| POST | `/api/v1/procedure-manager/drafts` | Đã nối UI | procedures.ts → HomePage/ProceduresPage/ProcedureDetailPage/ProcedureManagerPage/ProcedureDraftWorkspace/ProcedureCategoriesView/ProcedureChecklistModal |
| GET | `/api/v1/procedure-manager/drafts/{id}` | Đã nối UI | procedures.ts → HomePage/ProceduresPage/ProcedureDetailPage/ProcedureManagerPage/ProcedureDraftWorkspace/ProcedureCategoriesView/ProcedureChecklistModal |
| PUT | `/api/v1/procedure-manager/drafts/{id}` | Đã nối UI | procedures.ts → HomePage/ProceduresPage/ProcedureDetailPage/ProcedureManagerPage/ProcedureDraftWorkspace/ProcedureCategoriesView/ProcedureChecklistModal |
| DELETE | `/api/v1/procedure-manager/drafts/{id}` | Đã nối UI | procedures.ts → HomePage/ProceduresPage/ProcedureDetailPage/ProcedureManagerPage/ProcedureDraftWorkspace/ProcedureCategoriesView/ProcedureChecklistModal |
| POST | `/api/v1/procedure-manager/drafts/{id}/retry` | Đã nối UI | procedures.ts → HomePage/ProceduresPage/ProcedureDetailPage/ProcedureManagerPage/ProcedureDraftWorkspace/ProcedureCategoriesView/ProcedureChecklistModal |
| POST | `/api/v1/procedure-manager/drafts/{id}/publish` | Đã nối UI | procedures.ts → HomePage/ProceduresPage/ProcedureDetailPage/ProcedureManagerPage/ProcedureDraftWorkspace/ProcedureCategoriesView/ProcedureChecklistModal |
| GET | `/api/v1/procedure-manager/drafts/{id}/source` | Đã nối UI | procedures.ts → HomePage/ProceduresPage/ProcedureDetailPage/ProcedureManagerPage/ProcedureDraftWorkspace/ProcedureCategoriesView/ProcedureChecklistModal |
| POST | `/api/v1/procedure-manager/procedures/publish` | Đã nối UI | procedures.ts → HomePage/ProceduresPage/ProcedureDetailPage/ProcedureManagerPage/ProcedureDraftWorkspace/ProcedureCategoriesView/ProcedureChecklistModal |
| GET | `/api/v1/procedure-manager/procedures` | Đã nối UI | procedures.ts → HomePage/ProceduresPage/ProcedureDetailPage/ProcedureManagerPage/ProcedureDraftWorkspace/ProcedureCategoriesView/ProcedureChecklistModal |
| POST | `/api/v1/procedure-manager/procedures` | Đã nối UI | procedures.ts → HomePage/ProceduresPage/ProcedureDetailPage/ProcedureManagerPage/ProcedureDraftWorkspace/ProcedureCategoriesView/ProcedureChecklistModal |
| GET | `/api/v1/procedure-manager/procedures/{id}` | Đã nối UI | procedures.ts → HomePage/ProceduresPage/ProcedureDetailPage/ProcedureManagerPage/ProcedureDraftWorkspace/ProcedureCategoriesView/ProcedureChecklistModal |
| PUT | `/api/v1/procedure-manager/procedures/{id}` | Đã nối UI | procedures.ts → HomePage/ProceduresPage/ProcedureDetailPage/ProcedureManagerPage/ProcedureDraftWorkspace/ProcedureCategoriesView/ProcedureChecklistModal |
| PATCH | `/api/v1/procedure-manager/procedures/{id}/status` | Đã nối UI | procedures.ts → HomePage/ProceduresPage/ProcedureDetailPage/ProcedureManagerPage/ProcedureDraftWorkspace/ProcedureCategoriesView/ProcedureChecklistModal |
| GET | `/api/v1/procedure-manager/procedures/{id}/versions` | Đã nối UI | procedures.ts → HomePage/ProceduresPage/ProcedureDetailPage/ProcedureManagerPage/ProcedureDraftWorkspace/ProcedureCategoriesView/ProcedureChecklistModal |
| POST | `/api/v1/procedure-manager/procedures/{id}/versions/{versionNumber}/rollback` | Đã nối UI | procedures.ts → HomePage/ProceduresPage/ProcedureDetailPage/ProcedureManagerPage/ProcedureDraftWorkspace/ProcedureCategoriesView/ProcedureChecklistModal |
| GET | `/api/v1/procedure-manager/procedures/{id}/versions/{versionId}/source` | Đã nối UI | procedures.ts → HomePage/ProceduresPage/ProcedureDetailPage/ProcedureManagerPage/ProcedureDraftWorkspace/ProcedureCategoriesView/ProcedureChecklistModal |
| PUT | `/api/v1/procedure-manager/procedures/{id}/checklist` | Đã nối UI | procedures.ts → HomePage/ProceduresPage/ProcedureDetailPage/ProcedureManagerPage/ProcedureDraftWorkspace/ProcedureCategoriesView/ProcedureChecklistModal |
| GET | `/api/v1/procedures/featured` | Đã nối UI | procedures.ts → HomePage/ProceduresPage/ProcedureDetailPage/ProcedureManagerPage/ProcedureDraftWorkspace/ProcedureCategoriesView/ProcedureChecklistModal |
| GET | `/api/v1/procedures/categories` | Đã nối UI | procedures.ts → HomePage/ProceduresPage/ProcedureDetailPage/ProcedureManagerPage/ProcedureDraftWorkspace/ProcedureCategoriesView/ProcedureChecklistModal |
| GET | `/api/v1/procedures` | Đã nối UI | procedures.ts → HomePage/ProceduresPage/ProcedureDetailPage/ProcedureManagerPage/ProcedureDraftWorkspace/ProcedureCategoriesView/ProcedureChecklistModal |
| GET | `/api/v1/procedures/{id}` | Đã nối UI | procedures.ts → HomePage/ProceduresPage/ProcedureDetailPage/ProcedureManagerPage/ProcedureDraftWorkspace/ProcedureCategoriesView/ProcedureChecklistModal |
| GET | `/api/v1/procedures/{id}/source` | Đã nối UI | procedures.ts → HomePage/ProceduresPage/ProcedureDetailPage/ProcedureManagerPage/ProcedureDraftWorkspace/ProcedureCategoriesView/ProcedureChecklistModal |
| GET | `/` | Hạ tầng | Health; không cần trang nghiệp vụ |

## workflow

| HTTP | Endpoint | Trạng thái | Bằng chứng / lý do |
|---|---|---|---|
| POST | `/api/v1/applications/{id}/resubmit` | Đã nối UI | workflow.ts → useWorkflow → CitizenPage/DossierDetail/OfficerPage/OfficerReviewWorkspace/ManagerApplicationsView |
| GET | `/api/v1/applications/{id}/comments` | Đã nối UI | workflow.ts → useWorkflow → CitizenPage/DossierDetail/OfficerPage/OfficerReviewWorkspace/ManagerApplicationsView |
| GET | `/api/v1/applications/{id}/versions` | Đã nối UI | workflow.ts → useWorkflow → CitizenPage/DossierDetail/OfficerPage/OfficerReviewWorkspace/ManagerApplicationsView |
| GET | `/api/v1/applications/{id}/diff` | Đã nối UI | workflow.ts → useWorkflow → CitizenPage/DossierDetail/OfficerPage/OfficerReviewWorkspace/ManagerApplicationsView |
| POST | `/api/v1/applications/{id}/cancel` | Đã nối UI | workflow.ts → useWorkflow → CitizenPage/DossierDetail/OfficerPage/OfficerReviewWorkspace/ManagerApplicationsView |
| GET | `/api/v1/applications` | Đã nối UI | workflow.ts → useWorkflow → CitizenPage/DossierDetail/OfficerPage/OfficerReviewWorkspace/ManagerApplicationsView |
| POST | `/api/v1/applications` | Đã nối UI | workflow.ts → useWorkflow → CitizenPage/DossierDetail/OfficerPage/OfficerReviewWorkspace/ManagerApplicationsView |
| GET | `/api/v1/applications/{id}` | Đã nối UI | workflow.ts → useWorkflow → CitizenPage/DossierDetail/OfficerPage/OfficerReviewWorkspace/ManagerApplicationsView |
| PATCH | `/api/v1/applications/{id}/checklists/{checklistId}` | Đã nối UI | workflow.ts → useWorkflow → CitizenPage/DossierDetail/OfficerPage/OfficerReviewWorkspace/ManagerApplicationsView |
| POST | `/api/v1/applications/{id}/submit` | Đã nối UI | workflow.ts → useWorkflow → CitizenPage/DossierDetail/OfficerPage/OfficerReviewWorkspace/ManagerApplicationsView |
| PUT | `/api/v1/manager/applications/{id}/assignee` | Đã nối UI | workflow.ts → useWorkflow → CitizenPage/DossierDetail/OfficerPage/OfficerReviewWorkspace/ManagerApplicationsView |
| GET | `/api/v1/officer/applications/{id}` | Đã nối UI | workflow.ts → useWorkflow → CitizenPage/DossierDetail/OfficerPage/OfficerReviewWorkspace/ManagerApplicationsView |
| GET | `/api/v1/officer/applications/pending` | Có client/hook, không dùng trong màn chính | Có client/hook; hàng đợi chính dùng officer applications |
| GET | `/api/v1/officer/applications` | Đã nối UI | workflow.ts → useWorkflow → CitizenPage/DossierDetail/OfficerPage/OfficerReviewWorkspace/ManagerApplicationsView |
| POST | `/api/v1/officer/applications/{id}/officially-received` | Có client, chủ động không mở UI | Giữ điểm dừng tiền kiểm; chưa mở tiếp nhận chính thức theo quyết định trước |
| POST | `/api/v1/officer/applications/{id}/release` | Đã nối UI | workflow.ts → useWorkflow → CitizenPage/DossierDetail/OfficerPage/OfficerReviewWorkspace/ManagerApplicationsView |
| POST | `/api/v1/officer/applications/{id}/assign` | Đã nối UI | workflow.ts → useWorkflow → CitizenPage/DossierDetail/OfficerPage/OfficerReviewWorkspace/ManagerApplicationsView |
| POST | `/api/v1/officer/applications/{id}/comments` | Đã nối UI | workflow.ts → useWorkflow → CitizenPage/DossierDetail/OfficerPage/OfficerReviewWorkspace/ManagerApplicationsView |
| POST | `/api/v1/officer/applications/{id}/confirm-readiness` | Đã nối UI | workflow.ts → useWorkflow → CitizenPage/DossierDetail/OfficerPage/OfficerReviewWorkspace/ManagerApplicationsView |
| POST | `/api/v1/officer/applications/{id}/request-revision` | Đã nối UI | workflow.ts → useWorkflow → CitizenPage/DossierDetail/OfficerPage/OfficerReviewWorkspace/ManagerApplicationsView |
| GET | `/` | Hạ tầng | Health; không cần trang nghiệp vụ |

## document

| HTTP | Endpoint | Trạng thái | Bằng chứng / lý do |
|---|---|---|---|
| GET | `/api/v1/applications/{applicationId}/contents` | Đã nối UI | documentForms.ts/formTemplates.ts → useDocumentForms/DossierChecklistView/DocxOnlineEditor/OfficerDocumentsPanel/GeneratedDocumentsPanel/CitizenQrCodeView/FormsView |
| GET | `/api/v1/citizen/submissions` | Đã nối UI | documentForms.ts/formTemplates.ts → useDocumentForms/DossierChecklistView/DocxOnlineEditor/OfficerDocumentsPanel/GeneratedDocumentsPanel/CitizenQrCodeView/FormsView |
| GET | `/api/v1/citizen/submissions/{submissionId}` | Đã nối UI | documentForms.ts/formTemplates.ts → useDocumentForms/DossierChecklistView/DocxOnlineEditor/OfficerDocumentsPanel/GeneratedDocumentsPanel/CitizenQrCodeView/FormsView |
| POST | `/api/v1/citizen/submissions/draft` | Đã nối UI | documentForms.ts/formTemplates.ts → useDocumentForms/DossierChecklistView/DocxOnlineEditor/OfficerDocumentsPanel/GeneratedDocumentsPanel/CitizenQrCodeView/FormsView |
| POST | `/api/v1/citizen/submissions/upload-filled-docx` | Đã nối UI | documentForms.ts/formTemplates.ts → useDocumentForms/DossierChecklistView/DocxOnlineEditor/OfficerDocumentsPanel/GeneratedDocumentsPanel/CitizenQrCodeView/FormsView |
| PUT | `/api/v1/citizen/submissions/{submissionId}/draft` | Đã nối UI | documentForms.ts/formTemplates.ts → useDocumentForms/DossierChecklistView/DocxOnlineEditor/OfficerDocumentsPanel/GeneratedDocumentsPanel/CitizenQrCodeView/FormsView |
| POST | `/api/v1/citizen/submissions/{submissionId}/submit` | Đã nối UI | documentForms.ts/formTemplates.ts → useDocumentForms/DossierChecklistView/DocxOnlineEditor/OfficerDocumentsPanel/GeneratedDocumentsPanel/CitizenQrCodeView/FormsView |
| GET | `/api/v1/citizen/submissions/{submissionId}/download-docx` | Đã nối UI | documentForms.ts/formTemplates.ts → useDocumentForms/DossierChecklistView/DocxOnlineEditor/OfficerDocumentsPanel/GeneratedDocumentsPanel/CitizenQrCodeView/FormsView |
| GET | `/api/v1/form-templates` | Đã nối UI | documentForms.ts/formTemplates.ts → useDocumentForms/DossierChecklistView/DocxOnlineEditor/OfficerDocumentsPanel/GeneratedDocumentsPanel/CitizenQrCodeView/FormsView |
| POST | `/api/v1/form-templates` | Đã nối UI | documentForms.ts/formTemplates.ts → useDocumentForms/DossierChecklistView/DocxOnlineEditor/OfficerDocumentsPanel/GeneratedDocumentsPanel/CitizenQrCodeView/FormsView |
| GET | `/api/v1/form-templates/{templateId}` | Đã nối UI | documentForms.ts/formTemplates.ts → useDocumentForms/DossierChecklistView/DocxOnlineEditor/OfficerDocumentsPanel/GeneratedDocumentsPanel/CitizenQrCodeView/FormsView |
| POST | `/api/v1/form-templates/{templateId}/upload-docx` | Đã nối UI | documentForms.ts/formTemplates.ts → useDocumentForms/DossierChecklistView/DocxOnlineEditor/OfficerDocumentsPanel/GeneratedDocumentsPanel/CitizenQrCodeView/FormsView |
| GET | `/api/v1/form-templates/{templateId}/download-docx` | Đã nối UI | documentForms.ts/formTemplates.ts → useDocumentForms/DossierChecklistView/DocxOnlineEditor/OfficerDocumentsPanel/GeneratedDocumentsPanel/CitizenQrCodeView/FormsView |
| POST | `/api/v1/applications/{applicationId}/generate-pdf` | Đã nối UI | documentForms.ts/formTemplates.ts → useDocumentForms/DossierChecklistView/DocxOnlineEditor/OfficerDocumentsPanel/GeneratedDocumentsPanel/CitizenQrCodeView/FormsView |
| GET | `/api/v1/applications/{applicationId}/generated-documents` | Đã nối UI | documentForms.ts/formTemplates.ts → useDocumentForms/DossierChecklistView/DocxOnlineEditor/OfficerDocumentsPanel/GeneratedDocumentsPanel/CitizenQrCodeView/FormsView |
| GET | `/api/v1/generated-documents/{documentId}/download` | Đã nối UI | documentForms.ts/formTemplates.ts → useDocumentForms/DossierChecklistView/DocxOnlineEditor/OfficerDocumentsPanel/GeneratedDocumentsPanel/CitizenQrCodeView/FormsView |
| GET | `/api/v1/applications/{applicationId}/approved-qr` | Đã nối UI | documentForms.ts/formTemplates.ts → useDocumentForms/DossierChecklistView/DocxOnlineEditor/OfficerDocumentsPanel/GeneratedDocumentsPanel/CitizenQrCodeView/FormsView |
| GET | `/api/v1/applications/{applicationId}/approved-qr/image` | Đã nối UI | documentForms.ts/formTemplates.ts → useDocumentForms/DossierChecklistView/DocxOnlineEditor/OfficerDocumentsPanel/GeneratedDocumentsPanel/CitizenQrCodeView/FormsView |
| GET | `/api/v1/officer/submissions/by-application/{applicationId}` | Đã nối UI | documentForms.ts/formTemplates.ts → useDocumentForms/DossierChecklistView/DocxOnlineEditor/OfficerDocumentsPanel/GeneratedDocumentsPanel/CitizenQrCodeView/FormsView |
| POST | `/api/v1/officer/submissions/{submissionId}/request-revision` | Đã nối UI | documentForms.ts/formTemplates.ts → useDocumentForms/DossierChecklistView/DocxOnlineEditor/OfficerDocumentsPanel/GeneratedDocumentsPanel/CitizenQrCodeView/FormsView |
| POST | `/api/v1/officer/submissions/{submissionId}/confirm-readiness` | Đã nối UI | documentForms.ts/formTemplates.ts → useDocumentForms/DossierChecklistView/DocxOnlineEditor/OfficerDocumentsPanel/GeneratedDocumentsPanel/CitizenQrCodeView/FormsView |
| PUT | `/api/v1/officer/submissions/{submissionId}/annotate-docx` | Đã nối UI | documentForms.ts/formTemplates.ts → useDocumentForms/DossierChecklistView/DocxOnlineEditor/OfficerDocumentsPanel/GeneratedDocumentsPanel/CitizenQrCodeView/FormsView |
| GET | `/api/v1/officer/submissions/{submissionId}/download-docx` | Đã nối UI | documentForms.ts/formTemplates.ts → useDocumentForms/DossierChecklistView/DocxOnlineEditor/OfficerDocumentsPanel/GeneratedDocumentsPanel/CitizenQrCodeView/FormsView |
| GET | `/api/v1/public/applications/{applicationId}/pdf-redirect` | Luồng công khai ngoài FE | URL QR/redirect do server phát hành; trình quét/camera mở trực tiếp |
| GET | `/api/v1/public/qr-lookup` | Luồng công khai ngoài FE | URL QR/redirect do server phát hành; trình quét/camera mở trực tiếp |
| GET | `/api/v1/public/qr-lookup/{token}` | Luồng công khai ngoài FE | URL QR/redirect do server phát hành; trình quét/camera mở trực tiếp |
| GET | `/api/v1/applications/{applicationId}/supporting-documents` | Đã nối UI | documentForms.ts/formTemplates.ts → useDocumentForms/DossierChecklistView/DocxOnlineEditor/OfficerDocumentsPanel/GeneratedDocumentsPanel/CitizenQrCodeView/FormsView |
| POST | `/api/v1/applications/{applicationId}/supporting-documents` | Đã nối UI | documentForms.ts/formTemplates.ts → useDocumentForms/DossierChecklistView/DocxOnlineEditor/OfficerDocumentsPanel/GeneratedDocumentsPanel/CitizenQrCodeView/FormsView |
| DELETE | `/api/v1/supporting-documents/{documentId}` | Đã nối UI | documentForms.ts/formTemplates.ts → useDocumentForms/DossierChecklistView/DocxOnlineEditor/OfficerDocumentsPanel/GeneratedDocumentsPanel/CitizenQrCodeView/FormsView |
| GET | `/api/v1/supporting-documents/{documentId}/download` | Đã nối UI | documentForms.ts/formTemplates.ts → useDocumentForms/DossierChecklistView/DocxOnlineEditor/OfficerDocumentsPanel/GeneratedDocumentsPanel/CitizenQrCodeView/FormsView |
| GET | `/api/v1/supporting-documents/{documentId}/preview` | Không gọi riêng | UI xem tệp từ API download qua blob; cân nhắc preview cho tệp lớn |
| GET | `/` | Hạ tầng | Health; không cần trang nghiệp vụ |

## analytics

| HTTP | Endpoint | Trạng thái | Bằng chứng / lý do |
|---|---|---|---|
| GET | `/api/v1/analytics/overview` | Đã nối UI | analytics.ts/useAnalytics → ManagerOverview/ManagerAnalyticsView/ManagerFeedback/AnalyticsJobsView/CitizenFeedback |
| GET | `/api/v1/analytics/trends` | Đã nối UI | analytics.ts/useAnalytics → ManagerOverview/ManagerAnalyticsView/ManagerFeedback/AnalyticsJobsView/CitizenFeedback |
| GET | `/api/v1/analytics/procedures` | Đã nối UI | analytics.ts/useAnalytics → ManagerOverview/ManagerAnalyticsView/ManagerFeedback/AnalyticsJobsView/CitizenFeedback |
| GET | `/api/v1/analytics/officers` | Đã nối UI | analytics.ts/useAnalytics → ManagerOverview/ManagerAnalyticsView/ManagerFeedback/AnalyticsJobsView/CitizenFeedback |
| GET | `/api/v1/analytics/feedback/summary` | Đã nối UI | analytics.ts/useAnalytics → ManagerOverview/ManagerAnalyticsView/ManagerFeedback/AnalyticsJobsView/CitizenFeedback |
| GET | `/api/v1/analytics/feedback` | Đã nối UI | analytics.ts/useAnalytics → ManagerOverview/ManagerAnalyticsView/ManagerFeedback/AnalyticsJobsView/CitizenFeedback |
| GET | `/api/v1/analytics/jobs/{jobId}` | Đã nối UI | analytics.ts/useAnalytics → ManagerOverview/ManagerAnalyticsView/ManagerFeedback/AnalyticsJobsView/CitizenFeedback |
| POST | `/api/v1/analytics/jobs/rebuild` | Đã nối UI | analytics.ts/useAnalytics → ManagerOverview/ManagerAnalyticsView/ManagerFeedback/AnalyticsJobsView/CitizenFeedback |
| GET | `/api/v1/citizen/feedback/{applicationId}` | Đã nối UI | analytics.ts/useAnalytics → ManagerOverview/ManagerAnalyticsView/ManagerFeedback/AnalyticsJobsView/CitizenFeedback |
| POST | `/api/v1/citizen/feedback/{applicationId}` | Đã nối UI | analytics.ts/useAnalytics → ManagerOverview/ManagerAnalyticsView/ManagerFeedback/AnalyticsJobsView/CitizenFeedback |
| GET | `/api/v1/admin/notification-deliveries` | Ngoài phạm vi đã chốt | Quản trị delivery/SMS chưa bật trên FE |
| GET | `/api/v1/admin/notification-deliveries/{id}` | Ngoài phạm vi đã chốt | Quản trị delivery/SMS chưa bật trên FE |
| GET | `/api/v1/admin/notification-deliveries/{id}/audit` | Ngoài phạm vi đã chốt | Quản trị delivery/SMS chưa bật trên FE |
| POST | `/api/v1/admin/notification-deliveries/{id}/replay` | Ngoài phạm vi đã chốt | Quản trị delivery/SMS chưa bật trên FE |
| POST | `/api/v1/admin/notification-deliveries/{id}/sms-reconciliation` | Ngoài phạm vi đã chốt | Quản trị delivery/SMS chưa bật trên FE |
| GET | `/` | Hạ tầng | Health; không cần trang nghiệp vụ |

## Ngoài REST Swagger của 5 dịch vụ

- SignalR đã nối tại `/api/analytics-system/hubs/notifications`: GetMyNotifications/GetUnreadCount/MarkAsRead/MarkAllAsRead và sự kiện realtime; xem `notifications.ts`, `useNotificationHub.ts`, `useCitizenNotifications.ts`.
- AIOCR (source local): POST `/api/v1/ai-ocr/cccd/extract` và POST `/api/v1/ai/chat/completions` đã nối. POST `/api/v1/ai-ocr/documents/verify` chưa có client/UI.
- Chat GET `/api/v1/ai/chat/sessions` và GET `/api/v1/ai/chat/sessions/{sessionId}/messages`: chưa nối lịch sử hội thoại. Hội thoại hiện chỉ ở RAM.
- KnowledgeController `/api/v1/ai/knowledge`: GET/POST documents; GET/PUT documents/{id}; GET documents/{id}/chunks; POST documents/pdf, documents/{id}/activation, documents/{id}/rechunk, documents/{id}/reindex, search, procedures/{procedureId}/sync, procedures/sync; GET index-status: chưa có client/UI, Admin/Procedure-manager hiện là placeholder. Chưa xác minh Swagger AIOCR riêng trong lượt kiểm kê này.

Số operation trong 5 Swagger (gồm health): IAM 50; Catalog 29; Workflow 21; DocumentForm 32; Analytics 16. Tổng 148.
