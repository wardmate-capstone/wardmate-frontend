# BÁO CÁO RÀ SOÁT TOÀN DIỆN VÀ ĐẶC TẢ HỆ THỐNG API DỰ ÁN WARDMATE
**WardMate Full API Audit, Gap Analysis & Complete Specification Roadmap**

*Ngày lập báo cáo: 20/10/2026*  
*Phạm vi dự án:* Toàn bộ hệ thống WardMate bao gồm Backend (.NET 8 Clean Architecture Microservices), Web Frontend (React + Vite + TanStack Query), Mobile App (React Native Expo) và Gateway (YARP).  
*Các dịch vụ cốt lõi:* **IAM, Procedure Catalog, Application Workflow, Document & Form, AI & OCR.**  
*(Ghi chú: Dịch vụ AnalyticsSystem được loại trừ hoàn toàn, chưa cần triển khai trong giai đoạn hiện tại).*

---

## MỤC LỤC
1. [TỔNG QUAN HIỆN TRẠNG & KIẾN TRÚC HỆ THỐNG](#1-tổng-quan-hiện-trạng--kiến-trúc-hệ-thống)
2. [GIẢI ĐÁP ĐIỂM NGHẼN CÁN BỘ & API DANH SÁCH LỊCH SỬ HỒ SƠ](#2-giải-đáp-điểm-nghẽn-cán-bộ--api-danh-sách-lịch-sử-hồ-sơ)
3. [RÀ SOÁT CHI TIẾT TỪNG SERVICE: ĐÃ CÓ VS ĐANG THIẾU](#3-rà-soát-chi-tiết-từng-service-đã-có-vs-đang-thiếu)
   - [3.1. Dịch vụ IAM (Identity & Access Management)](#31-dịch-vụ-iam-identity--access-management)
   - [3.2. Dịch vụ Procedure Catalog (Danh mục & Dự thảo thủ tục)](#32-dịch-vụ-procedure-catalog-danh-mục--dự-thảo-thủ-tục)
   - [3.3. Dịch vụ Application Workflow (Quy trình tiền kiểm hồ sơ)](#33-dịch-vụ-application-workflow-quy-trình-tiền-kiểm-hồ-sơ)
   - [3.4. Dịch vụ Document & Form (Biểu mẫu, Tờ khai, Minh chứng, QR & PDF)](#34-dịch-vụ-document--form-biểu-mẫu-tờ-khai-minh-chứng-qr--pdf)
   - [3.5. Dịch vụ AI & OCR (Trí tuệ nhân tạo & Bóc tách văn bản)](#35-dịch-vụ-ai--ocr-trí-tuệ-nhân-tạo--bóc-tách-văn-bản)
4. [BẢNG TỔNG HỢP CÁC API CẦN BỔ SUNG ĐỂ HOÀN THIỆN TOÀN BỘ DỰ ÁN](#4-bảng-tổng-hợp-các-api-cần-bổ-sung-để-hoàn-thiện-toàn-bộ-dự-án)
5. [ĐẶC TẢ CHI TIẾT (CONTRACTS) CÁC API BỔ SUNG QUAN TRỌNG](#5-đặc-tả-chi-tiết-contracts-các-api-bổ-sung-quan-trọng)
6. [LỘ TRÌNH TRIỂN KHAI THEO MỨC ĐỘ ƯU TIÊN (P0 -> P1 -> P2)](#6-lộ-trình-triển-khai-theo-mức-độ-ưu-tiên-p0---p1---p2)

---

## 1. TỔNG QUAN HIỆN TRẠNG & KIẾN TRÚC HỆ THỐNG

### 1.1. Bản đồ Microservices & Ports
Hệ thống WardMate vận hành theo kiến trúc Microservices phân tán với database-per-service và kết nối qua YARP Gateway tại cổng trung tâm:

| Tên Dịch Vụ | Cổng Nội Bộ | Route Gateway Chính | Trạng Thái Triển Khai |
|:---|:---:|:---|:---|
| **YarpGateway** | `5000` | `/api/v1/*` | Đã cấu hình định tuyến đầy đủ |
| **WardMate.Services.IAM** | `5001` | `/api/v1/auth`, `/api/v1/users`, `/api/v1/rbac`, `/api/v1/manager`, `/api/v1/wards` | Hoàn thiện 85% |
| **WardMate.Services.ProcedureCatalog** | `5002` | `/api/v1/procedures`, `/api/v1/procedure-manager/*` | Hoàn thiện 90% |
| **WardMate.Services.ApplicationWorkflow** | `5003` | `/api/v1/applications`, `/api/v1/officer/applications` | Hoàn thiện 85% |
| **WardMate.Services.DocumentForm** | `5004` | `/api/v1/form-templates`, `/api/v1/citizen/*`, `/api/v1/officer/submissions/*`, `/api/v1/public/*` | Hoàn thiện 90% |
| **WardMate.Services.AIOCR** | `5005` | `/internal/v1/procedure-extractions` | Mới có 1 internal endpoint (Hoàn thiện 25%) |
| *WardMate.Services.AnalyticsSystem* | `5006` | `/hubs/notifications` | *Loại trừ (Chưa cần làm trong giai đoạn này)* |

### 1.2. Ranh giới nghiệp vụ cốt lõi (Bắt buộc tuân thủ)
- **Bản chất hệ thống:** Đây là hệ thống **chuẩn bị và tiền kiểm hồ sơ hành chính** cấp Xã/Phường, **không thay thế** cổng tiếp nhận và phê duyệt hành chính chính thức của Nhà nước.
- **Tiền kiểm đạt (`DOCUMENTS_READY`):** Khẳng định giấy tờ, tờ khai của công dân đã đầy đủ, đúng biểu mẫu, sẵn sàng để in/mang đến UBND Xã/Phường nộp chính thức.
- **Mã QR:** Chỉ được sinh sau khi hồ sơ đạt `DOCUMENTS_READY`, dùng để cán bộ Một cửa quét và đối soát nhanh với bản giấy tại quầy tiếp dân.

---

## 2. GIẢI ĐÁP ĐIỂM NGHẼN CÁN BỘ & API DANH SÁCH LỊCH SỬ HỒ SƠ

### 2.1. Nhận định từ người dùng
> *"Về phía Backend: Cần bổ sung thêm API danh sách lịch sử/tổng hợp cho Cán bộ (ví dụ: `GET /api/v1/officer/applications` hỗ trợ lọc theo trạng thái `DOCUMENTS_READY`, `NEED_REVISION`, `READY_TO_SUBMIT`...) thay vì chỉ có mỗi endpoint pending."*

### 2.2. Kết quả điều tra thực tế trong Codebase
Khi rà soát kỹ lưỡng toàn bộ mã nguồn Backend và Frontend:

1. **Phía Backend đã có sẵn endpoint này:**
   - Trong file `D:\wardmate-backend\src\Services\WardMate.Services.ApplicationWorkflow\WardMate.Services.ApplicationWorkflow.API\Controllers\ApplicationReviewController.cs`:
     ```csharp
     [HttpGet, ProducesResponseType<ApplicationPage>(200)]
     [Authorize(Policy = "workflow.queue.read")]
     public async Task<IActionResult> List([FromQuery] OfficerListInput input, CancellationToken ct) =>
         Ok(await sender.Send(new GetOfficerApplicationsPagedQuery(Actor, input), ct));
     ```
   - Trong `ApplicationReviewStore.cs`, hàm `ListAll` đã hỗ trợ đầy đủ các bộ lọc:
     + `status`: hỗ trợ truyền đơn lẻ hoặc chuỗi phân tách dấu phẩy (ví dụ: `status=DOCUMENTS_READY,NEED_REVISION,READY_TO_SUBMIT`).
     + `procedureId`: lọc theo mã thủ tục (Guid).
     + `applicationCode`: tìm kiếm theo mã hồ sơ.
     + `submittedFrom` / `submittedTo`: khoảng thời gian nộp.
     + `page`, `pageSize`: phân trang dữ liệu.
     + Phạm vi: Chỉ lọc các hồ sơ thuộc cùng `WardCode` của Cán bộ và loại trừ hồ sơ do chính Cán bộ nộp.
   - YARP Gateway đã định tuyến:
     `"officer-applications-root-v1": { "ClusterId": "application-workflow", "Match": { "Path": "/api/v1/officer/applications" } }`

2. **VẬY VÌ SAO BẠN THẤY THIẾU HOẶC KHÔNG DÙNG ĐƯỢC?**
   Có **2 nguyên nhân cốt lõi**:

   - **Nguyên nhân 1 (Phía Frontend chưa gọi — ĐÃ XỬ LÝ XONG):**
     * Trước đây, trong file `d:\frontend\src\lib\api\workflow.ts`, Frontend chỉ gọi `/api/v1/officer/applications/pending`.
     * **Trạng thái hiện tại:** Frontend đã bổ sung hàm `listOfficerApplications(filters)` và hook `useOfficerApplications(filters)` trong `useWorkflow.ts`, đồng thời tích hợp vào `OfficerPage.tsx` với cơ chế fallback tự động. Đã vượt qua `npm run typecheck`, Playwright test và `npm run build`.

   - **Nguyên nhân 2 (Lỗi logic phân quyền tại Backend `GET /api/v1/officer/applications/{id}`):**
     Tại dòng 36 của `ApplicationReviewController.cs`:
     ```csharp
     if (a is null || a.UserId == actor.Id || a.AssignedOfficerId != actor.Id || a.WardCode != actor.WardCode)
         return Respond(WorkflowResult<ApplicationDto>.Fail(404, "application.not_found", "Không tìm thấy hồ sơ đang được bạn thụ lý."));
     ```
     Điều kiện `a.AssignedOfficerId != actor.Id` khiến cho:
     * Cán bộ **không thể bấm xem chi tiết** các hồ sơ đã duyệt xong trong lịch sử phường nếu hồ sơ đó do cán bộ khác trong phường thụ lý, hoặc hồ sơ chưa phân công!
     * Bị trả về lỗi 404 mặc dù hồ sơ hiển thị trong danh sách chung của phường.

### 2.3. PHIẾU YÊU CẦU ĐIỀU CHỈNH GỬI TEAM BACKEND (TASK-BE-OFFICER-SCOPE, ASSIGNED-OFFICER-FIELD & MANAGER-ROLE)
> **Dành cho Lập trình viên Backend:** Vui lòng thực hiện cập nhật 3 mục nghiệp vụ dưới đây trong dịch vụ `WardMate.Services.ApplicationWorkflow`.

---

#### 📌 YÊU CẦU 1: CẬP NHẬT LOGIC KIỂM TRA QUYỀN TẠI ENDPOINT XEM CHI TIẾT HỒ SƠ (`GET /api/v1/officer/applications/{id}`)
- **Vị trí file:** `D:\wardmate-backend\src\Services\WardMate.Services.ApplicationWorkflow\WardMate.Services.ApplicationWorkflow.API\Controllers\ApplicationReviewController.cs`
- **Method cần sửa:** `public async Task<IActionResult> Detail(Guid id, [FromServices] IApplicationReviewStore store, CancellationToken ct)` (dòng 30-39).
- **Vấn đề gặp phải & Giải thích vì sao khi chính cán bộ đó thụ lý thì xem được nhưng người khác thì không:**
  * **Ranh giới theo Phường (`WardCode`):** Giữ nguyên 100%! Cán bộ Phường A **chỉ được phép xem và xử lý hồ sơ thuộc Phường A**, tuyệt đối không được xem hay can thiệp vào hồ sơ của Phường B (`a.WardCode == actor.WardCode`).
  * **Vấn đề giữa các Cán bộ trong CÙNG MỘT PHƯỜNG:**
    + Khi chính Cán bộ A bấm "Nhận xử lý" hồ sơ, trường `AssignedOfficerId` được gán bằng ID của Cán bộ A. Do đó Cán bộ A bấm vào xem chi tiết hồ sơ này thì điều kiện `a.AssignedOfficerId == actor.Id` thỏa mãn và xem được bình thường.
    + **NHƯNG:** Một phường có nhiều cán bộ Một cửa (Cán bộ A, Cán bộ B). Nếu Cán bộ B muốn xem hồ sơ do Cán bộ A đã thụ lý (để kiểm tra lịch sử, phối hợp bàn giao ca trực, hoặc tiếp nhận đối chiếu giấy tờ tại quầy một cửa), hoặc khi một hồ sơ mới gửi tới chưa phân công cho ai (`AssignedOfficerId == null`), thì bấm vào xem chi tiết sẽ bị Backend chặn lại và báo **404 Not Found** ("Không tìm thấy hồ sơ đang được bạn thụ lý").
- **Nguyên tắc nghiệp vụ chuẩn:**
  1. **Quyền xem (Read-only View):** Cho phép mọi Cán bộ Một cửa trong cùng một phường được xem chi tiết bất kỳ hồ sơ nào thuộc cùng `WardCode` của phường mình (ngoại trừ hồ sơ do chính cán bộ đó nộp với tư cách công dân `a.UserId != actor.Id`).
  2. **Quyền thay đổi trạng thái (Mutations):** Các hành động như Thẩm định (`confirm-readiness`), Yêu cầu sửa đổi (`request-revision`), Chú thích Word (`annotate-docx`) vẫn giữ nguyên kiểm tra `AssignedOfficerId == actor.Id` để đảm bảo đúng cán bộ được thụ lý mới được duyệt.

- **Đoạn mã C# đề xuất thay thế:**
```csharp
    [HttpGet("{id:guid}"), Authorize(Policy = "workflow.read"), ProducesResponseType<ApplicationDto>(200)]
    public async Task<IActionResult> Detail(Guid id, [FromServices] IApplicationReviewStore store, CancellationToken ct)
    {
        var actor = Actor;
        if (!actor.IsOfficer) return Forbid();
        var a = await store.Read(actor, id, ct);

        // Cho phép xem nếu thuộc cùng Phường và không phải hồ sơ của chính mình
        if (a is null || a.UserId == actor.Id || a.WardCode != actor.WardCode)
            return Respond(WorkflowResult<ApplicationDto>.Fail(404, "application.not_found", "Không tìm thấy hồ sơ trong phạm vi phường của bạn."));

        return Ok(ApplicationDto.From(a));
    }
```

---

#### 📌 YÊU CẦU 2: BỔ SUNG TRƯỜNG `AssignedOfficerId` VÀO `ApplicationSummaryDto` CỦA DANH SÁCH HỒ SƠ
- **Vấn đề gặp phải trên Frontend:** Trên bảng danh sách hồ sơ của Cán bộ (Table list), cột "Cán bộ phụ trách" hiện đang hiển thị `"Chưa phân công"` hoặc dấu `—` cho tất cả các dòng, kể cả hồ sơ đã được nhận xử lý hoặc đã duyệt xong!
- **Nguyên nhân Backend:**
  1. Trong file contract: `src/Services/WardMate.Services.ApplicationWorkflow/WardMate.Services.ApplicationWorkflow.Application/WorkflowContracts.cs` (dòng 34):
     ```csharp
     public sealed record ApplicationSummaryDto(Guid Id, string? ApplicationCode, Guid ProcedureId,
         string ProcedureTitle, string Status, DateTime CreatedAt, DateTime? SubmittedAt, string? WardCode = null);
     ```
     👉 DTO trả về cho danh sách hồ sơ **hoàn toàn không có trường `AssignedOfficerId`**!
  2. Trong file truy vấn: `src/Services/WardMate.Services.ApplicationWorkflow/WardMate.Services.ApplicationWorkflow.Infrastructure/ApplicationReviewStore.cs` (dòng 25 và dòng 64):
     Câu lệnh Linq `.Select(...)` không gán `x.AssignedOfficerId` vào DTO trả về.
- **Giải pháp đề xuất cho Backend:**
  1. Thêm `Guid? AssignedOfficerId = null` vào `ApplicationSummaryDto`:
     ```csharp
     public sealed record ApplicationSummaryDto(
         Guid Id,
         string? ApplicationCode,
         Guid ProcedureId,
         string ProcedureTitle,
         string Status,
         DateTime CreatedAt,
         DateTime? SubmittedAt,
         string? WardCode = null,
         Guid? AssignedOfficerId = null);
     ```
  2. Cập nhật câu lệnh `Select` trong `ApplicationReviewStore.cs` (hàm `ListAll` và hàm `Pending`):
     ```csharp
     .Select(x => new ApplicationSummaryDto(
         x.Id,
         x.ApplicationCode,
         x.ProcedureId,
         x.ProcedureTitle,
         x.Status,
         x.CreatedAt,
         x.SubmittedAt,
         x.WardCode,
         x.AssignedOfficerId))
     ```
  *(Lưu ý: Phía Frontend đã cập nhật sẵn Schema để tự động nhận `assignedOfficerId` ngay khi Backend trả về mà không cần chỉnh sửa gì thêm!)*

---

#### 📌 YÊU CẦU 3: BỔ SUNG QUYỀN GIÁM SÁT HỒ SƠ THEO PHƯỜNG CHO VAI TRÒ `MANAGER` (LÃNH ĐẠO / QUẢN LÝ PHƯỜNG)
- **Bản chất vai trò Manager trong hệ thống:**
  * Trong dịch vụ IAM (`ManagementScope.cs`), vai trò `MANAGER` là **Lãnh đạo / Cán bộ Quản lý của một Phường cụ thể** (`WardId` / `WardCode`), chịu trách nhiệm quản lý danh sách cán bộ và điều phối công việc trong Phường đó.
  * Manager **không phải là quản trị viên toàn quốc hay toàn thành phố**, mà có phạm vi quản lý giới hạn đúng theo `WardCode` của Phường mình phụ trách.
- **Vấn đề hiện tại trong `ApplicationWorkflow`:**
  * Hiện tại trong `ApplicationWorkflow`, các endpoint hồ sơ (`/api/v1/officer/applications`) chỉ kiểm tra vai trò `FRONT_DESK_OFFICER` (`User.IsInRole("FRONT_DESK_OFFICER")`).
  * Tài khoản có vai trò `MANAGER` khi đăng nhập vào hệ thống thì **hoàn toàn không có API nào để xem/giám sát hồ sơ** trong Phường mình phụ trách (gọi API sẽ bị `403 Forbidden`).
- **Giải pháp đề xuất cho Backend:**
  1. Cập nhật `ReviewActor` trong `ReviewControllerBase.cs`:
     ```csharp
     protected ReviewActor Actor => new(
         Guid.Parse(User.FindFirstValue("sub")!),
         User.IsInRole("FRONT_DESK_OFFICER") || User.IsInRole("MANAGER"),
         User.FindFirstValue("ward_code"));
     ```
  2. Bổ sung Role `MANAGER` vào các Authorization Policy đọc dữ liệu của Workflow:
     * Policy `workflow.queue.read`: cho phép cả `FRONT_DESK_OFFICER` và `MANAGER`.
     * Policy `workflow.read`: cho phép cả `FRONT_DESK_OFFICER` và `MANAGER`.
  3. **Ràng buộc:** Manager cũng chỉ xem được các hồ sơ có `WardCode == Manager.WardCode` (đúng theo địa bàn Phường do Manager đó phụ trách). Các thao tác can thiệp trực tiếp (như nhận hồ sơ, duyệt, yêu cầu sửa) vẫn chỉ dành cho cán bộ phụ trách.

---

## 3. RÀ SOÁT CHI TIẾT TỪNG SERVICE: ĐÃ CÓ VS ĐANG THIẾU

### 3.1. Dịch vụ IAM (Identity & Access Management)

#### Các API Hiện Đã Có:
- **Xác thực:**
  - `POST /api/v1/auth/register`: Đăng ký tài khoản công dân.
  - `POST /api/v1/auth/login`: Đăng nhập, ghi Cookie HttpOnly `refreshToken`, trả `accessToken`.
  - `POST /api/v1/auth/refresh-token`: Làm mới phiên qua Cookie HttpOnly.
  - `POST /api/v1/auth/revoke-token`: Đăng xuất, hủy refresh token.
- **Hồ sơ cá nhân:**
  - `GET /api/v1/users/me`: Lấy thông tin cá nhân hiện tại, vai trò, quyền hạn.
  - `GET /api/v1/profiles`: Lấy hồ sơ công dân (CCCD, họ tên, ngày sinh, địa chỉ thường trú).
  - `POST /api/v1/profiles`: Tạo hồ sơ công dân lần đầu.
  - `PUT /api/v1/profiles`: Cập nhật hồ sơ công dân.
- **Quản lý xã/phường & Cán bộ:**
  - `GET /api/v1/wards`: Danh sách phường xã (Public).
  - `POST /api/v1/admin/wards`: Quản trị viên thêm phường xã mới.
  - `POST /api/v1/admin/front-desk`: Tạo tài khoản cán bộ Một cửa.
  - `PUT /api/v1/admin/{userId}/ward`: Phân bổ cán bộ vào phường công tác.
  - `GET /api/v1/manager/officers`: Cán bộ quản lý xem danh sách cán bộ cấp dưới.
  - `PUT /api/v1/manager/officers/{userId}/categories`: Phân bổ lĩnh vực thủ tục cho cán bộ.
- **Phân quyền RBAC:**
  - CRUD Roles (`/api/v1/rbac/roles`), CRUD Role Permissions (`/api/v1/rbac/roles/{roleId}/permissions`), User Roles, và Nhật ký phân quyền (`/api/v1/rbac/audit-logs`).
  - Khóa/mở khóa tài khoản (`PUT /api/v1/accounts/{userId}/status`).

#### Các API Còn Thiếu / Cần Bổ Sung Ở IAM:
1. **API Đổi mật khẩu (`POST /api/v1/users/me/change-password` hoặc `PUT /api/v1/users/change-password`):**
   - *Hiện trạng:* Cả Frontend Web và Mobile đều có màn hình Đổi mật khẩu nhưng Backend IAM chưa có endpoint này.
   - *Mục đích:* Cho phép người dùng đang đăng nhập nhập mật khẩu cũ và đặt mật khẩu mới.
2. **API Quên & Đặt lại mật khẩu (`POST /api/v1/auth/forgot-password` & `POST /api/v1/auth/reset-password`):**
   - *Hiện trạng:* Chưa có cơ chế khôi phục mật khẩu khi người dùng quên tài khoản.
3. **API Hỗ trợ Xác thực cho Mobile App (Mobile Auth Bridge):**
   - *Hiện trạng:* `POST /api/v1/auth/login` hiện tại chỉ lưu refresh token vào trình duyệt qua HttpOnly Cookie. Trên Mobile App React Native Expo, lưu trữ an toàn yêu cầu `expo-secure-store`.
   - *Giải pháp:* Cần hỗ trợ trả `refreshToken` trong response JSON body khi có header `X-Client-Type: Mobile` hoặc tạo endpoint `POST /api/v1/auth/mobile/login` và `POST /api/v1/auth/mobile/refresh-token`.
4. **API Cập nhật ảnh đại diện (`POST /api/v1/users/me/avatar`):**
   - *Hiện trạng:* Người dùng chưa có API upload và lưu trữ URL ảnh đại diện cá nhân.

---

### 3.2. Dịch vụ Procedure Catalog (Danh mục & Dự thảo thủ tục)

#### Các API Hiện Đã Có:
- **Dành cho Công dân & Công chúng:**
  - `GET /api/v1/procedures/categories`: Danh mục lĩnh vực thủ tục hành chính.
  - `GET /api/v1/procedures`: Tra cứu, tìm kiếm thủ tục theo từ khóa, lĩnh vực, mức độ, có phân trang.
  - `GET /api/v1/procedures/{id}`: Chi tiết thủ tục (thành phần hồ sơ, căn cứ pháp lý, thời gian giải quyết, lệ phí, biểu mẫu và các trường hợp checklist case).
- **Dành cho Cán bộ Quản lý Thủ tục (Procedure Manager):**
  - CRUD Danh mục lĩnh vực (`/api/v1/procedure-manager/categories`).
  - Quản lý danh mục biểu mẫu (`/api/v1/procedure-manager/document-forms`).
  - Quản lý dự thảo thủ tục từ file PDF Quyết định công bố:
    + `POST /api/v1/procedure-manager/drafts/extract-preview`: Bóc tách thử nghiệm PDF.
    + `POST /api/v1/procedure-manager/drafts`: Tải lên PDF và tạo bản nháp.
    + `GET /api/v1/procedure-manager/drafts`: Danh sách bản nháp.
    + `GET /api/v1/procedure-manager/drafts/{id}`: Chi tiết bản nháp để đối soát.
    + `PUT /api/v1/procedure-manager/drafts/{id}`: Chỉnh sửa dự thảo.
    + `POST /api/v1/procedure-manager/drafts/{id}/publish`: Xuất bản dự thảo thành thủ tục chính thức.
  - Quản lý thủ tục chính thức:
    + CRUD thủ tục (`/api/v1/procedure-manager/procedures`).
    + Ẩn/Hiện thủ tục (`PATCH /api/v1/procedure-manager/procedures/{id}/status`).
    + Lịch sử phiên bản (`GET /api/v1/procedure-manager/procedures/{id}/versions`).
    + Rollback phiên bản (`POST /api/v1/procedure-manager/procedures/{id}/versions/{versionNumber}/rollback`).
    + Sửa đổi danh sách checklist theo case (`PUT /api/v1/procedure-manager/procedures/{id}/checklist`).

#### Các API Còn Thiếu / Cần Bổ Sung Ở Procedure Catalog:
1. **API Thủ tục nổi bật / Xem nhiều nhất (`GET /api/v1/procedures/featured`):**
   - *Hiện trạng:* Trang chủ Citizen Web và màn hình Home của Mobile App đều hiển thị "Thủ tục hành chính phổ biến" (Khai sinh, Kết hôn, Xác nhận độc thân...). Hiện Frontend đang phải fix cứng dữ liệu.
2. **API Gợi ý từ khóa tìm kiếm nhanh (`GET /api/v1/procedures/suggestions?q={keyword}`):**
   - *Hiện trạng:* Tìm kiếm tức thì khi người dân vừa gõ phím trên thanh tìm kiếm.
3. **API Ghi nhận lượt quan tâm / truy cập (`POST /api/v1/procedures/{id}/view`):**
   - *Hiện trạng:* Đếm số lượt người dân tra cứu thủ tục để phục vụ báo cáo thống kê mức độ quan tâm của nhân dân.

---

### 3.3. Dịch vụ Application Workflow (Quy trình tiền kiểm hồ sơ)

#### Các API Hiện Đã Có:
- **Dành cho Công dân:**
  - `POST /api/v1/applications`: Khởi tạo hồ sơ tiền kiểm (trạng thái `DRAFT`).
  - `GET /api/v1/applications`: Danh sách hồ sơ tiền kiểm của tôi (phân trang).
  - `GET /api/v1/applications/{id}`: Chi tiết hồ sơ (nếu khách vãng lai gọi sẽ tự điều hướng sang tra cứu mã QR).
  - `PATCH /api/v1/applications/{id}/checklists/{checklistId}`: Đánh dấu hoàn tất từng mục checklist hồ sơ.
  - `POST /api/v1/applications/{id}/submit`: Nộp hồ sơ tiền kiểm sang UBND phường (`SUBMITTED_FOR_REVIEW`).
  - `POST /api/v1/applications/{id}/resubmit`: Nộp lại hồ sơ sau khi bổ sung theo yêu cầu cán bộ.
  - `GET /api/v1/applications/{id}/comments`: Xem ý kiến trao đổi / hướng dẫn sửa đổi của cán bộ.
  - `GET /api/v1/applications/{id}/versions`: Lịch sử các phiên bản nộp hồ sơ.
  - `GET /api/v1/applications/{id}/diff`: Xem khác biệt giữa 2 phiên bản hồ sơ.
- **Dành cho Cán bộ Một cửa:**
  - `GET /api/v1/officer/applications/pending`: Danh sách hồ sơ đang chờ tiếp nhận.
  - `GET /api/v1/officer/applications`: Danh sách tổng hợp toàn bộ hồ sơ trong phường (đã viết ở BE, hỗ trợ lọc theo trạng thái, ngày nộp, từ khóa, phân trang).
  - `GET /api/v1/officer/applications/{id}`: Xem chi tiết hồ sơ cán bộ đang thụ lý.
  - `POST /api/v1/officer/applications/{id}/assign`: Cán bộ nhận thụ lý hồ sơ (chuyển sang `UNDER_REVIEW`).
  - `POST /api/v1/officer/applications/{id}/comments`: Thêm ghi chú/ý kiến thẩm định vào hồ sơ.
  - `POST /api/v1/officer/applications/{id}/request-revision`: Yêu cầu công dân chỉnh sửa hồ sơ (chuyển sang `NEED_REVISION`).
  - `POST /api/v1/officer/applications/{id}/confirm-readiness`: Xác nhận giấy tờ tiền kiểm hợp lệ, sẵn sàng mang tới nộp tại phường (chuyển sang `DOCUMENTS_READY`).

#### Các API Còn Thiếu / Cần Điều Chỉnh Ở Application Workflow:
1. **Frontend tích hợp gọi `GET /api/v1/officer/applications`:**
   - *Việc cần làm:* Khai báo hàm `listOfficerApplications` trong `workflow.ts`, tạo hook `useOfficerApplications` trong `useWorkflow.ts`, liên kết với bộ lọc của `OfficerPage.tsx`.
2. **Sửa đổi logic phân quyền `GET /api/v1/officer/applications/{id}` (Backend):**
   - *Việc cần làm:* Cho phép cán bộ cùng phường xem chi tiết bất kỳ hồ sơ nào trong phường ở chế độ chỉ đọc (Read-only), chỉ chặn khi cán bộ phường khác truy cập hoặc cán bộ cố tình thao tác duyệt/yêu cầu sửa hồ sơ mà mình không được phân công.
3. **API Hủy hồ sơ tiền kiểm phía Công dân (`POST /api/v1/applications/{id}/cancel`):**
   - *Hiện trạng:* Công dân khi nộp nhầm hoặc không còn nhu cầu cần nút "Hủy hồ sơ" (khi hồ sơ ở trạng thái `DRAFT` hoặc `NEED_REVISION`).
4. **API Tiếp nhận chính thức tại quầy Một cửa (`POST /api/v1/officer/applications/{id}/officially-received`):**
   - *Hiện trạng:* Trên màn hình `OfficerReceiptWorkspaceView.tsx`, cán bộ quét QR đối soát hồ sơ giấy và hồ sơ điện tử, sau đó cần bấm nút *"Xác nhận tiếp nhận chính thức tại quầy"* (cấp số biên nhận và ngày hẹn). Hiện nút này đang bị disabled vì thiếu API Backend.
5. **API Nhật ký dòng thời gian xử lý (`GET /api/v1/applications/{id}/timeline`):**
   - *Hiện trạng:* Hiển thị chi tiết từng bước (Tạo hồ sơ -> Nộp -> Cán bộ A tiếp nhận -> Yêu cầu sửa -> Công dân nộp lại -> Duyệt giấy tờ sẵn sàng -> Tiếp nhận tại quầy).

---

### 3.4. Dịch vụ Document & Form (Biểu mẫu, Tờ khai, Minh chứng, QR & PDF)

#### Các API Hiện Đã Có:
- **Biểu mẫu tờ khai (Form Templates):**
  - `GET /api/v1/form-templates`: Danh sách template mẫu đơn .docx.
  - `GET /api/v1/form-templates/{templateId}`: Chi tiết template và JSON Schema các trường dữ liệu.
  - `POST /api/v1/form-templates`: Tạo template mới.
  - `POST /api/v1/form-templates/{templateId}/upload-docx`: Upload file .docx gốc.
  - `GET /api/v1/form-templates/{templateId}/download-docx`: Tải file .docx gốc về máy.
- **Tờ khai điện tử công dân điền (Citizen Submissions):**
  - `GET /api/v1/citizen/submissions`: Danh sách các tờ khai công dân đã điền.
  - `GET /api/v1/citizen/submissions/{submissionId}`: Chi tiết bản khai.
  - `POST /api/v1/citizen/submissions/draft`: Lưu bản điền nháp (hỗ trợ merge JSON data vào Word).
  - `PUT /api/v1/citizen/submissions/{submissionId}/draft`: Cập nhật bản điền nháp.
  - `POST /api/v1/citizen/submissions/{submissionId}/submit`: Xác nhận hoàn thành tờ khai.
  - `GET /api/v1/citizen/submissions/{submissionId}/download-docx`: Tải tờ khai đã render Word về máy.
- **Cán bộ kiểm tra tờ khai (Officer Submissions):**
  - `GET /api/v1/officer/submissions/by-application/{applicationId}`: Danh sách tờ khai trong hồ sơ.
  - `GET /api/v1/officer/submissions/{submissionId}/download-docx`: Tải file Word tờ khai để kiểm tra.
  - `PUT /api/v1/officer/submissions/{submissionId}/annotate-docx`: Tải lên bản Word đã chèn chú thích (Word comments) hướng dẫn công dân sửa.
  - `POST /api/v1/officer/submissions/{submissionId}/request-revision`: Yêu cầu sửa tờ khai.
  - `POST /api/v1/officer/submissions/{submissionId}/confirm-readiness`: Xác nhận tờ khai hợp lệ.
- **Giấy tờ minh chứng đính kèm (Supporting Documents):**
  - `POST /api/v1/applications/{applicationId}/supporting-documents`: Tải lên giấy tờ minh chứng (PDF, PNG, JPG tối đa 10MB).
  - `GET /api/v1/applications/{applicationId}/supporting-documents`: Danh sách giấy tờ đính kèm.
  - `GET /api/v1/supporting-documents/{documentId}/download`: Tải file minh chứng.
  - `DELETE /api/v1/supporting-documents/{documentId}`: Xóa file minh chứng.
- **Kết xuất PDF, Mã QR & Tra cứu công khai:**
  - `POST /api/v1/applications/{applicationId}/generate-pdf`: Chuyển đổi toàn bộ hồ sơ sang bản PDF có gắn mã QR thẩm định.
  - `GET /api/v1/applications/{applicationId}/generated-documents`: Lấy danh sách tệp PDF đã xuất.
  - `GET /api/v1/generated-documents/{documentId}/download`: Tải tệp PDF kết xuất.
  - `GET /api/v1/applications/{applicationId}/approved-qr`: Lấy chuỗi mã QR xác thực.
  - `GET /api/v1/applications/{applicationId}/approved-qr/image`: Lấy ảnh QR Code (PNG).
  - `GET /api/v1/public/qr-lookup`: Tra cứu tính hợp lệ hồ sơ qua mã QR (Công khai không cần đăng nhập).

#### Các API Còn Thiếu / Cần Bổ Sung Ở Document & Form:
1. **API Tải lên file Word (.docx) đã điền sẵn từ máy tính (`POST /api/v1/citizen/submissions/upload-filled-docx`):**
   - *Hiện trạng:* Công dân tải file mẫu về, mở Microsoft Word trên máy tính điền xong và muốn tải thẳng file Word lên thay vì nhập vào form web. Hiện Backend mới chỉ có API nhận dữ liệu JSON draft.
2. **API Xem trước tài liệu trực tiếp trên trình duyệt (`GET /api/v1/supporting-documents/{documentId}/preview`):**
   - *Hiện trạng:* Hiện endpoint download trả header `Content-Disposition: attachment` buộc trình duyệt phải tải về máy. Cần hỗ trợ xem trực tiếp (`inline`) trong modal thẩm định của Cán bộ và Công dân.
3. **API Hợp nhất (Merge) toàn bộ file đính kèm thành 1 tệp duy nhất (`POST /api/v1/applications/{applicationId}/merge-dossier`):**
   - *Mục đích:* Giúp công dân in một lần toàn bộ bộ hồ sơ tiền kiểm đã được sắp xếp đúng thứ tự quy chuẩn.

---

### 3.5. Dịch vụ AI & OCR (Trí tuệ nhân tạo & Bóc tách văn bản)
> **ĐÁNH GIÁ ĐẶC BIỆT:** Đây là dịch vụ **thiếu nhiều nhất** trong hệ thống. Hiện tại dịch vụ `WardMate.Services.AIOCR` mới chỉ phục vụ bóc tách văn bản PDF quyết định công bố cho quản lý thủ tục, chưa có các tính năng AI/OCR dành cho công dân và cán bộ một cửa.

#### Các API Hiện Đã Có:
- `POST /internal/v1/procedure-extractions`: Nhận file PDF văn bản thủ tục từ Procedure Catalog, sử dụng Azure Document Intelligence / OpenAI để bóc tách các trường: tên thủ tục, thời gian, lệ phí, checklist. Yêu cầu mã xác thực dịch vụ nội bộ `X-Service-Key`.

#### Toàn Bộ Các API Cần Triển Khai Cho AI & OCR:
1. **API OCR Căn cước công dân (Citizen ID Card OCR):**
   - *Endpoint:* `POST /api/v1/ai-ocr/cccd/extract`
   - *Payload:* Multipart `frontImage` (Mặt trước CCCD), `backImage` (Mặt sau CCCD).
   - *Kết quả trả về:* JSON gồm: Số CCCD, Họ và tên, Ngày sinh, Giới tính, Quê quán, Nơi thường trú, Ngày cấp, Ngày hết hạn.
   - *Ý nghĩa:* Tự động điền tức thì vào Hồ sơ cá nhân (`Profile`) và tự động điền các trường họ tên/CCCD vào mọi tờ khai biểu mẫu, tránh sai sót chính tả.
2. **API Trợ lý ảo AI tư vấn thủ tục hành chính (AI Virtual Assistant / Q&A Chatbot):**
   - *Endpoint:* `POST /api/v1/ai/chat/completions`
   - *Payload:* `{ message: string, conversationId?: string, wardCode?: string }`
   - *Cơ chế hoạt động:* Ứng dụng RAG (Retrieval-Augmented Generation) truy vấn cơ sở dữ liệu `ProcedureCatalog` để trả lời các câu hỏi thường gặp của người dân: "Tôi muốn làm giấy khai sinh thì cần chuẩn bị gì?", "Thủ tục kết hôn có cần nộp sổ hộ khẩu không?", kèm đường link dẫn thẳng vào thủ tục tương ứng.
   - *Endpoint kèm theo:*
     + `GET /api/v1/ai/chat/sessions`: Danh sách các cuộc trò chuyện đã lưu.
     + `GET /api/v1/ai/chat/sessions/{sessionId}/messages`: Lịch sử tin nhắn.
3. **API Tiền kiểm chất lượng & Đối chiếu giấy tờ bằng AI (AI Document Pre-validation):**
   - *Endpoint:* `POST /api/v1/ai-ocr/documents/verify`
   - *Payload:* `{ applicationId: Guid, documentId: Guid, expectedType: string }`
   - *Chức năng thông minh:*
     + Kiểm tra chất lượng ảnh chụp: phát hiện ảnh mờ, mất góc, quá tối hoặc lóa sáng.
     + Nhận diện loại giấy tờ (Ví dụ: Yêu cầu nộp Giấy xác nhận tình trạng hôn nhân nhưng công dân lại upload nhầm Bằng lái xe).
     + Đối chiếu họ tên, số CCCD in trên giấy tờ với tờ khai xem có trùng khớp hay không và đưa ra cảnh báo sớm cho công dân trước khi bấm nộp.

---

## 4. BẢNG TỔNG HỢP CÁC API CẦN BỔ SUNG ĐỂ HOÀN THIỆN TOÀN BỘ DỰ ÁN (5 DỊCH VỤ CỐT LÕI)

| STT | Dịch Vụ | Phương Thức | Đường Dẫn Endpoint | Vai Trò (Actor) | Mức Độ Ưu Tiên | Mô Tả Nghiệp Vụ |
|:---:|:---|:---:|:---|:---:|:---:|:---|
| **1** | **Workflow** | `GET` | `/api/v1/officer/applications` | `FRONT_DESK_OFFICER` | **P0 (Khẩn cấp)** | **Kết nối Frontend** gọi API danh sách tổng hợp/lịch sử có lọc trạng thái. |
| **2** | **Workflow** | `GET` | `/api/v1/officer/applications/{id}` | `FRONT_DESK_OFFICER` | **P0 (Khẩn cấp)** | **Sửa logic Backend** cho phép cán bộ xem chi tiết hồ sơ trong phường (Read-only). |
| **3** | **IAM** | `POST` | `/api/v1/users/me/change-password` | Đã đăng nhập | **P0 (Khẩn cấp)** | Đổi mật khẩu tài khoản (yêu cầu mật khẩu cũ + mật khẩu mới). |
| **4** | **Workflow** | `POST` | `/api/v1/applications/{id}/cancel` | `CITIZEN` | **P1 (Quan trọng)** | Công dân hủy hồ sơ tiền kiểm khi ở trạng thái `DRAFT` hoặc `NEED_REVISION`. |
| **5** | **Workflow** | `POST` | `/api/v1/officer/applications/{id}/officially-received` | `FRONT_DESK_OFFICER` | **P1 (Quan trọng)** | Tiếp nhận chính thức tại quầy Một cửa sau khi quét QR đối soát. |
| **6** | **Document** | `POST` | `/api/v1/citizen/submissions/upload-filled-docx` | `CITIZEN` | **P1 (Quan trọng)** | Cho phép công dân tải file .docx đã điền sẵn từ Word máy tính lên hệ thống. |
| **7** | **IAM** | `POST` | `/api/v1/auth/mobile/login` | `AllowAnonymous` | **P1 (Quan trọng)** | Đăng nhập cho Mobile App trả `refreshToken` vào JSON body cho `expo-secure-store`. |
| **8** | **Catalog** | `GET` | `/api/v1/procedures/featured` | `Public` | **P1 (Quan trọng)** | Lấy danh sách thủ tục nổi bật, phổ biến hiển thị trang chủ. |
| **9** | **Document** | `GET` | `/api/v1/supporting-documents/{id}/preview` | Công dân / Cán bộ | **P1 (Quan trọng)** | Xem trước trực tiếp tài liệu đính kèm trên trình duyệt (inline). |
| **10** | **AI & OCR** | `POST` | `/api/v1/ai-ocr/cccd/extract` | Đã đăng nhập | **P2 (Nâng cấp)** | OCR 2 mặt Căn cước công dân tự động trích xuất thông tin điền form. |
| **11** | **AI & OCR** | `POST` | `/api/v1/ai/chat/completions` | `Public` / Công dân | **P2 (Nâng cấp)** | Trợ lý ảo AI hỏi đáp, tư vấn thủ tục hành chính tự động (RAG). |
| **12** | **AI & OCR** | `POST` | `/api/v1/ai-ocr/documents/verify` | Cán bộ / Công dân | **P2 (Nâng cấp)** | Tiền kiểm chất lượng ảnh, nhận diện loại giấy tờ và so khớp họ tên/CCCD. |

---

## 5. ĐẶC TẢ CHI TIẾT (CONTRACTS) CÁC API BỔ SUNG QUAN TRỌNG

### 5.1. Danh Sách Hồ Sơ Tổng Hợp Cán Bộ (Khai thác API đã có)
- **Phương thức & Endpoint:** `GET /api/v1/officer/applications`
- **Quyền truy cập:** Header `Authorization: Bearer {token}`, yêu cầu role `FRONT_DESK_OFFICER` (Policy: `workflow.queue.read`).
- **Query Parameters:**
  + `status` (string, tùy chọn): Ví dụ `DOCUMENTS_READY` hoặc danh sách `DOCUMENTS_READY,NEED_REVISION,UNDER_REVIEW`.
  + `procedureId` (guid, tùy chọn): Lọc theo thủ tục.
  + `applicationCode` (string, tùy chọn): Lọc theo mã hồ sơ (ví dụ `HS-20261020-001`).
  + `submittedFrom` / `submittedTo` (ISO 8601 DateTime, tùy chọn): Lọc theo khoảng ngày nộp.
  + `page` (int, mặc định 1): Số trang.
  + `pageSize` (int, mặc định 20, tối đa 100): Số bản ghi/trang.
- **Response `200 OK`:**
  ```json
  {
    "items": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "applicationCode": "HS-20261020-001",
        "procedureId": "7cb4a3e2-9011-4fa2-bf6d-312984920199",
        "procedureTitle": "Đăng ký khai sinh thường trú",
        "status": "DOCUMENTS_READY",
        "createdAt": "2026-10-20T08:30:00Z",
        "submittedAt": "2026-10-20T09:15:00Z",
        "wardCode": "PHUONG_BEN_NGHE"
      }
    ],
    "page": 1,
    "pageSize": 20,
    "totalCount": 42
  }
  ```

---

### 5.2. API Đổi Mật Khẩu Người Dùng
- **Phương thức & Endpoint:** `POST /api/v1/users/me/change-password`
- **Quyền truy cập:** Yêu cầu đăng nhập (`Authorize`).
- **Request Body:**
  ```json
  {
    "currentPassword": "Password123@",
    "newPassword": "NewSecurePassword456@",
    "confirmNewPassword": "NewSecurePassword456@"
  }
  ```
- **Ràng buộc:** Mật khẩu tối thiểu 8 ký tự, có chữ hoa, chữ thường, số và ký tự đặc biệt.
- **Phản hồi:**
  + `200 OK`: `{ "message": "Đổi mật khẩu thành công. Vui lòng đăng nhập lại trên các thiết bị khác." }`
  + `400 Bad Request`: Mật khẩu hiện tại không đúng hoặc mật khẩu mới trùng mật khẩu cũ.

---

### 5.3. API Xác Nhận Tiếp Nhận Chính Thức Tại Quầy Một Cửa
- **Phương thức & Endpoint:** `POST /api/v1/officer/applications/{id}/officially-received`
- **Quyền truy cập:** `FRONT_DESK_OFFICER` phụ trách hồ sơ.
- **Điều kiện tiên quyết:** Hồ sơ phải đang ở trạng thái `DOCUMENTS_READY`.
- **Request Body:**
  ```json
  {
    "paperDossierVerified": true,
    "notes": "Đã đối chiếu đầy đủ bản chính CCCD và giấy chứng sinh gốc.",
    "appointmentDate": "2026-10-23T16:00:00Z"
  }
  ```
- **Response `200 OK`:**
  ```json
  {
    "applicationId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "status": "OFFICIALLY_RECEIVED",
    "receiptNumber": "BN-2026-BNG-0891",
    "receivedAt": "2026-10-20T10:45:00Z",
    "appointmentDate": "2026-10-23T16:00:00Z",
    "message": "Đã tiếp nhận hồ sơ chính thức tại quầy Một cửa UBND Phường."
  }
  ```

---

### 5.4. API OCR Căn Cước Công Dân (AI & OCR)
- **Phương thức & Endpoint:** `POST /api/v1/ai-ocr/cccd/extract`
- **Content-Type:** `multipart/form-data`
- **Payload:**
  + `frontImage`: File ảnh mặt trước thẻ CCCD (JPG/PNG, tối đa 10MB).
  + `backImage`: File ảnh mặt sau thẻ CCCD (JPG/PNG, tối đa 10MB, tùy chọn).
- **Response `200 OK`:**
  ```json
  {
    "citizenId": "079098012345",
    "fullName": "NGUYỄN VĂN AN",
    "dateOfBirth": "1998-05-15",
    "gender": "Nam",
    "nationality": "Việt Nam",
    "placeOfOrigin": "Xã Tân An, Huyện Thanh Hà, Hải Dương",
    "placeOfResidence": "123 Đường Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh",
    "dateOfExpiry": "2038-05-15",
    "confidenceScore": 0.98,
    "warning": null
  }
  ```

---

### 5.5. API Trợ Lý Ảo AI Tư Vấn Thủ Tục Hành Chính (AI Q&A Assistant)
- **Phương thức & Endpoint:** `POST /api/v1/ai/chat/completions`
- **Request Body:**
  ```json
  {
    "conversationId": "uuid-phien-hoi-thoai-truoc-do-neu-co",
    "question": "Tôi muốn đăng ký kết hôn với người cùng phường thì cần mang theo những giấy tờ gì?",
    "wardCode": "PHUONG_BEN_NGHE"
  }
  ```
- **Response `200 OK`:**
  ```json
  {
    "conversationId": "f7d24a91-2a13-4011-8bb4-098e9102456b",
    "answer": "Để đăng ký kết hôn tại UBND Phường Bến Nghé, hai bạn cần chuẩn bị:\n1. Tờ khai đăng ký kết hôn (theo mẫu đính kèm).\n2. Xuất trình bản chính Căn cước công dân của cả hai người.\n3. Giấy xác nhận tình trạng hôn nhân (nếu trước đây có thời gian cư trú ở nơi khác).\nThời gian giải quyết: Trong ngày làm việc.\nLệ phí: Miễn lệ phí đối với công dân cư trú trên địa bàn.",
    "relatedProcedures": [
      {
        "id": "e4a29081-3312-4fb2-9e8c-89110294821a",
        "title": "Đăng ký kết hôn",
        "detailUrl": "/thu-tuc/e4a29081-3312-4fb2-9e8c-89110294821a"
      }
    ]
  }
  ```

---

## 6. LỘ TRÌNH TRIỂN KHAI THEO MỨC ĐỘ ƯU TIÊN (P0 -> P1 -> P2)

### GIAI ĐOẠN P0 (Ưu tiên số 1 - Khắc phục ngay các điểm nghẽn nghiệp vụ)
1. **Frontend tích hợp gọi `GET /api/v1/officer/applications`:**
   - Thêm `listOfficerApplications` vào `d:\frontend\src\lib\api\workflow.ts`.
   - Tạo hook `useOfficerApplications` trong `d:\frontend\src\hooks\useWorkflow.ts`.
   - Kết nối vào `OfficerPage.tsx` để Cán bộ lọc và xem hồ sơ theo đúng tab (Cần chỉnh sửa, Giấy tờ sẵn sàng, Toàn bộ lịch sử). *(Đã hoàn thành phía FE)*.
2. **Khắc phục lỗi 404 xem chi tiết hồ sơ cán bộ (`GET /api/v1/officer/applications/{id}`):**
   - Trong `ApplicationReviewController.cs` Backend, cho phép cán bộ xem chi tiết mọi hồ sơ trong cùng phường của mình ở chế độ đọc (`Read-only`).
3. **Bổ sung API Đổi mật khẩu (`POST /api/v1/users/me/change-password`):**
   - Hoàn thiện chức năng bảo mật cơ bản cho người dùng trong IAM.

### GIAI ĐOẠN P1 (Ưu tiên số 2 - Hoàn thiện trải nghiệm Một cửa và Mobile)
1. **API Tiếp nhận chính thức tại quầy (`POST /api/v1/officer/applications/{id}/officially-received`):**
   - Kích hoạt nút bấm trên `OfficerReceiptWorkspaceView.tsx`, hoàn tất vòng đời hồ sơ từ tiền kiểm sang tiếp nhận tại quầy.
2. **API Cho phép nộp file Word điền sẵn (`upload-filled-docx`):**
   - Bổ sung endpoint trong `CitizenSubmissionsController` cho công dân nộp file .docx đã chuẩn bị offline.
3. **Tối ưu cơ chế xác thực cho Mobile App:**
   - Cung cấp refresh token an toàn cho React Native qua `expo-secure-store`.
4. **API Hủy hồ sơ tiền kiểm (`POST /api/v1/applications/{id}/cancel`):**
   - Cho phép công dân chủ động thu hồi/hủy hồ sơ chuẩn bị nhầm.

### GIAI ĐOẠN P2 (Ưu tiên số 3 - Nâng tầm giải pháp với AI & OCR)
1. **Module OCR Căn cước công dân (Azure Document Intelligence / Tesseract + Regex):**
   - Cung cấp endpoint trích xuất CCCD tự động điền hồ sơ.
2. **Module Trợ lý ảo AI tư vấn thủ tục (RAG Chatbot):**
   - Xây dựng endpoint Q&A tích hợp semantic search trên danh mục thủ tục hành chính.
3. **Module Tiền kiểm giấy tờ bằng AI (AI Document Pre-validation):**
   - Đánh giá chất lượng ảnh giấy tờ và so khớp thông tin tự động.
