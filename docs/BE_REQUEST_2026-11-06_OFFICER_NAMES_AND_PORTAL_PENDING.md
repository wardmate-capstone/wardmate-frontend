# Yêu cầu Backend: Hiển thị tên thay cho mã ID & các mục Portal còn tồn đọng

*Ngày tạo: 06/11/2026 · Cập nhật: 07/11/2026 (thêm BE-D, BE-E) · 09/11/2026 (BE và FE đã hoàn thành A–E; thêm BE-F mã QR, BE-G phân công/tham vấn) · Frontend gửi Backend*
*Đã đối chiếu mã nguồn `D:/wardmate-backend` tại thời điểm tạo file*
*Liên quan: `docs/PORTAL_REFINEMENT_TASKS_CHECKLIST.md` (mục 7, 10) và `docs/BE_REQUESTS_FIXES_IAM_PROCEDURE.md` (03/11)*

---

## Trạng thái 09/11/2026: ✅ Đã hoàn thành BE-A → BE-E · 🔴 BE-F mới (mã QR) · 🔴 BE-G mới (không phân công/tham vấn được)

- **Backend:** làm xong BE-A → BE-E trên nhánh `origin/kha` (`PROGRESS.md` mục `FE-REQ-1108`), đã chạy SQL và deploy lên Azure ngày 09/11 (`AZURE-ROLLOUT-1108`): `iam-20261108-01`, `workflow-20261108-01`, `analytics-20261108-01`.
- **FE đã kiểm tra trên Azure (09/11):** health của IAM, Workflow, Analytics, AIOCR đều trả 200; swagger đã có `fromOfficerName`/`toOfficerName`/`actorName` (Workflow), `applicationCode`/`procedureTitle`/`applicantName` (Analytics) và `PUT /api/v1/rbac/users/{userId}/role` (IAM). Trường tên của Tham vấn và Lịch ngày nghỉ không có trong swagger (API không khai báo kiểu trả về) nên cần kiểm tra khi test giao diện.
- **Frontend:** đã tích hợp toàn bộ, xem bảng "Việc FE" ở cuối file.
- **Còn lại phía vận hành:** chạy `docs/sql/workflow-applicant-name-backfill.sql` (backend) nếu chủ dự án đồng ý, để hồ sơ cũ có tên người dân. Nhánh `kha` chưa merge vào `main`/`deploy`.

---

## Tóm tắt

| # | Yêu cầu | Service | Ưu tiên | Cần migration DB | FE có thể tự làm trước? |
|:-:|---|---|:-:|:-:|---|
| **BE-A** | Trả kèm tên cán bộ trong lịch sử phân công hồ sơ | ApplicationWorkflow | 🟡 Trung bình | ✅ Có (3 cột) | Một phần: FE đã tự bỏ lệnh gọi gây 403 |
| **BE-B** | Tìm kiếm user theo `Username` (Checklist mục 10) | IAM | 🟡 Trung bình | ❌ Không | Một phần: FE bỏ tiền tố `@` |
| **BE-C** | Ràng buộc mỗi người dùng một vai trò & bảo vệ `IT_ADMIN` (Checklist mục 7) | IAM | 🔴 Cao | ❌ Không | Một phần: FE chuyển sang chọn 1 vai trò, nhưng chưa an toàn nếu BE không chặn |
| **BE-D** | Báo cáo phản hồi: trả mã hồ sơ, tên thủ tục, tên người dân; bổ sung tên người dân cho hồ sơ cũ | AnalyticsSystem + ApplicationWorkflow | 🟡 Trung bình | ✅ Có (snapshot) | Một phần: FE tự tra mã hồ sơ (N+1 request); **không** lấy được tên hồ sơ cũ |
| **BE-G** | `/manager/officers` không trả `permissions` → mọi Front Desk bị "Thiếu quyền nhận hồ sơ", **không phân công/chuyển cán bộ và không tạo tham vấn được** | IAM (hoặc Workflow) | 🔴 Cao (chặn luồng chính) | ❌ Không | Không: BE chặn cả lúc lưu |
| **BE-F** | Sinh mã QR cho **mọi** hồ sơ "Giấy tờ sẵn sàng", không phụ thuộc tờ khai DOCX/PDF | DocumentForm (+ Workflow) | 🔴 Cao | Tùy cách làm | Một phần: FE có nút "Tạo PDF và mã QR" khi có tờ khai sẵn sàng; hồ sơ không có tờ khai thì **không** có QR |
| **BE-E** | Tham vấn & Lịch ngày nghỉ: trả tên thay vì chỉ ID (hồ sơ, người được hỏi, người khai báo/hủy, phường) | ApplicationWorkflow | 🟢 Thấp | Tùy cách làm | Không: FE đang tạm hiện mã ID thô, chờ BE |

---

## BE-A. Trả kèm tên cán bộ trong lịch sử phân công hồ sơ

### Bối cảnh

- Khi đăng nhập bằng tài khoản **Front Desk**, trình duyệt gọi `GET /api/v1/manager/officers?pageSize=100` và nhận **403**.
- Nguyên nhân: API này yêu cầu quyền `iam.accounts.read` (`UserDirectoryController.cs:22`). Quyền này chỉ cấp cho `IT_ADMIN` và `MANAGER` (migration `20261007090139_DeployedFeaturePermissionCatalog.cs:22`). **Phân quyền này đúng, BE không cần đổi.**
- FE gọi API này để tra tên cán bộ từ `assignedOfficerId`. FE sẽ tự sửa để **chỉ gọi khi tài khoản có quyền `iam.accounts.read`**, nên lỗi 403 hết mà không cần BE.
- Front Desk chỉ thấy hồ sơ **chưa phân công** hoặc **của chính mình** (`ApplicationReviewStore.cs:18`). Vì vậy danh sách hồ sơ của họ không cần danh bạ cán bộ.

### Vấn đề còn lại cần BE

Khi Front Desk mở hồ sơ do Lãnh đạo **chuyển từ cán bộ khác sang**, mục **"Lịch sử phân công"** chỉ hiện mã, ví dụ `Cán bộ (3f2a9c1b)`, chứ không hiện tên. Lý do:

- `AssignmentHistoryDto` (`WorkflowContracts.cs:19`) chỉ có ID:
  ```csharp
  public sealed record AssignmentHistoryDto(Guid Id, string Action, Guid? FromOfficerId, Guid? ToOfficerId, Guid ActorId, string? Reason, DateTime CreatedAt);
  ```
- Mọi API IAM đổi ID ra tên đều cần `iam.accounts.read` hoặc role `MANAGER`: `/manager/officers`, `/accounts/{id}`, `/users/profiles`, `/admin/users`, `/manager/officers/{id}/assignment-context`. Front Desk không có quyền nào trong số này, nên **FE không thể tự lấy tên**.

Nghiệp vụ mong muốn: cán bộ đang phụ trách hồ sơ thấy được hồ sơ được chuyển **từ ai**, **ai chuyển** và **lý do**, nhưng **không** cần, và **không** được, xem toàn bộ danh bạ cán bộ.

### Thay đổi đề xuất (lưu tên tại thời điểm ghi lịch sử)

1. **Entity** `ApplicationAssignmentHistory.cs` (Domain): thêm 3 thuộc tính, cho phép null:
   ```csharp
   public string? FromOfficerName { get; set; }
   public string? ToOfficerName { get; set; }
   public string? ActorName { get; set; }
   ```
2. **Migration EF Core** cho `WorkflowDbContext`: thêm 3 cột `text NULL`. Kèm script SQL trong `docs/sql/workflow-*.sql`, vì Workflow trên Azure đang để `AutoMigrate = false`.
3. **Ghi tên khi chuyển**, sửa `AssignmentHandlers.Record` (`AssignmentRequests.cs:18`). Mọi luồng CLAIM / RELEASE / ASSIGN / TRANSFER đều đi qua hàm này:
   - `FromOfficerName = a.AssignedOfficerName`, tức tên người phụ trách trước khi đổi; đã có sẵn trên record.
   - `ToOfficerName = name`; tham số này đã được truyền vào.
   - `ActorName`: **thêm tham số mới** `actorName`. Cập nhật 3 chỗ gọi:
     - `ReviewHandlers.cs:39` (CLAIM) → `r.Actor.FullName`
     - `AssignmentRequests.cs:37` (RELEASE) → `r.Actor.FullName`
     - `DispatchService.cs:87` (ASSIGN/TRANSFER) → tên Lãnh đạo thực hiện (`actor.FullName`)
4. **DTO** `AssignmentHistoryDto` và chỗ map ở `WorkflowContracts.cs:48`: thêm 3 trường `FromOfficerName`, `ToOfficerName`, `ActorName`.
5. **Dữ liệu cũ:** các dòng có sẵn để `NULL`, FE sẽ tiếp tục hiện mã rút gọn. *(Tùy chọn: script backfill tên từ IAM.)*

### Tiêu chí nghiệm thu

- [ ] `GET` chi tiết hồ sơ (cán bộ) trả `assignmentHistory[]` có `fromOfficerName`, `toOfficerName`, `actorName` cho các thao tác mới.
- [ ] Một hồ sơ được TRANSFER từ cán bộ A sang Front Desk B: khi B mở hồ sơ, thấy tên A và tên Lãnh đạo thực hiện.
- [ ] Front Desk **vẫn** nhận 403 với `/api/v1/manager/officers`. Không mở thêm quyền danh bạ.
- [ ] Dữ liệu lịch sử cũ không lỗi; các trường tên trả về `null`.
- [ ] Test cho cả 4 luồng CLAIM / RELEASE / ASSIGN / TRANSFER.

### Triển khai Azure

Theo `docs/antigravity-azure-runbook.md` (repo backend):

1. Chạy script SQL thêm 3 cột lên DB Workflow trên Azure **trước** khi deploy image mới.
2. Build và deploy lại **riêng** Container App `wardmate-application-workflow` (runbook mục 3: `az acr build` rồi cập nhật revision).
3. Kiểm tra `GET {gateway}/api/application-workflow/health/ready` trả `200`.
4. IAM và các service khác **không** cần deploy lại cho mục này.

### Phía FE sau khi BE xong

- Thêm 3 trường vào `assignmentHistoryDtoSchema` (`src/lib/api/workflow.ts`).
- `mapAssignmentHistoryToTimelineItem` (`src/lib/api/workflowAdapters.ts`) ưu tiên tên do BE trả về, sau đó mới tra danh bạ hoặc hiện mã rút gọn.

---

## BE-B. Tìm kiếm user theo `Username` (Checklist mục 10)

### Hiện trạng (đã kiểm tra lại 06/11)

`UserDirectory.cs:24-28` (IAM Infrastructure) chỉ tìm theo `Email`, `Profile.FullName` và `Profile.IdentityNumber`:

```csharp
q = q.Where(x => EF.Functions.ILike(x.Email, pattern, "\\") || x.Profile != null &&
    (EF.Functions.ILike(x.Profile.FullName, pattern, "\\") || x.Profile.IdentityNumber != null && EF.Functions.ILike(x.Profile.IdentityNumber, pattern, "\\")));
```

→ Gõ username (ví dụ `frontdesk01`) trong màn Admin "Người dùng hệ thống" hoặc Manager "Cán bộ" trả về **0 kết quả**.

### Thay đổi đề xuất

- Thêm điều kiện `EF.Functions.ILike(x.Username, pattern, "\\")` vào biểu thức trên.
- Nếu `Search` bắt đầu bằng `@`, bỏ ký tự `@` trước khi tạo `pattern`. FE cũng sẽ tự bỏ, BE làm thêm để an toàn.

### Tiêu chí nghiệm thu

- [ ] `GET /api/v1/admin/users?search=frontdesk` và `GET /api/v1/manager/officers?search=frontdesk` trả về tài khoản có username chứa `frontdesk`.
- [ ] `search=@frontdesk` cho kết quả giống `search=frontdesk`.
- [ ] Ký tự `%`, `_`, `\` vẫn được escape như hiện tại.

Chi tiết gốc: `docs/BE_REQUESTS_FIXES_IAM_PROCEDURE.md` mục 1.

---

## BE-C. Ràng buộc một vai trò & bảo vệ `IT_ADMIN` (Checklist mục 7)

### Hiện trạng (đã kiểm tra lại 06/11)

`RbacCommandHandlers.cs:68-84`, xử lý `PUT/DELETE /api/v1/rbac/users/{userId}/roles/{roleId}`:

- Người gán là IT_ADMIN được **gán thêm bất kỳ vai trò nào**, kể cả khi người dùng đã có vai trò khác. Hệ quả là một tài khoản có thể đồng thời là `CITIZEN` + `FRONT_DESK_OFFICER`, hoặc `MANAGER` + `IT_ADMIN`.
- Không có gì chặn việc **gán mới** `IT_ADMIN` qua màn phân quyền nhân sự. Chỉ có chặn **thu hồi** IT_ADMIN cuối cùng (`iam.last_admin`).

FE sẽ chuyển modal sang **chọn 1 vai trò duy nhất** và ẩn `IT_ADMIN`. Nhưng nếu BE không chặn, gọi API trực tiếp vẫn tạo được tài khoản nhiều vai trò.

### Thay đổi đề xuất

1. **Một người dùng một vai trò:** khi Grant mà người dùng đang có vai trò khác, BE chọn một trong hai cách:
   - **(khuyến nghị)** thêm endpoint thay vai trò nguyên tử: `PUT /api/v1/rbac/users/{userId}/role` với body `{ roleId }`, thu hồi vai trò cũ và gán vai trò mới trong cùng transaction, ghi audit `role.replaced`; **hoặc**
   - trả `409` với mã ví dụ `iam.single_role_required` để FE biết phải thu hồi trước.
2. **Bảo vệ `IT_ADMIN`:** không cho gán `IT_ADMIN` qua luồng phân quyền nhân sự thông thường. Ví dụ trả `409 iam.admin_role_protected`, trừ khi có luồng riêng dành cho quản trị hệ thống.
3. Giữ nguyên kiểm tra `iam.last_admin` hiện có.

### Tiêu chí nghiệm thu

- [ ] Không thể tạo trạng thái một user có ≥ 2 vai trò qua API RBAC.
- [ ] Đổi vai trò Front Desk → Manager thành công trong 1 lệnh gọi; audit log ghi đủ vai trò cũ và mới.
- [ ] Gán `IT_ADMIN` qua luồng nhân sự bị từ chối với mã lỗi rõ ràng.
- [ ] Hợp đồng API (endpoint mới hoặc mã lỗi) được ghi vào `docs/api-guide.md` để FE tích hợp.

Chi tiết gốc: `docs/BE_REQUESTS_FIXES_IAM_PROCEDURE.md` mục 3.

---

## BE-D. Báo cáo phản hồi người dân: mã hồ sơ, tên thủ tục, tên người dân

### Hiện trạng (đã kiểm tra 07/11)

- Màn **Manager → Báo cáo phản hồi** gọi `GET /api/analytics-system/.../analytics/feedback`. Mỗi dòng chỉ có (`AnalyticsContracts.cs:45`):
  ```csharp
  public sealed record FeedbackDto(Guid Id, Guid ApplicationId, int Rating, string? Comment, DateTime CreatedAtUtc);
  ```
  Không có mã hồ sơ `HS-…`, tên thủ tục hay tên người dân.
- **FE đang tạm xử lý:** với mỗi phản hồi, FE gọi thêm `GET` chi tiết hồ sơ (Manager có `workflow.read`) để lấy `applicationCode`, `procedureTitle`, `applicantName`. Mỗi trang phát sinh thêm tối đa 20 request.
- **Tên người dân vẫn trống với hồ sơ cũ.** `ApplicationRecord.ApplicantName` chỉ được ghi lúc công dân bấm gửi (`ApplicationsController.cs:75`, lấy claim `officer_name` qua `SnapshotApplicantName`). Ví dụ hồ sơ `HS-20261024-00000036` có `applicantName = null`.
- **FE không có đường khác để lấy tên:** `GET /api/v1/users/{userId}/profile` bị `ManagementScope` (IAM, dòng 29 và 41) loại trừ tài khoản `REGISTERED_CITIZEN`, nên Manager gọi sẽ bị 403. **Không đề nghị mở quyền này.**

### Thay đổi đề xuất

1. **Bổ sung `ApplicantName` cho hồ sơ cũ (backfill)** trong Workflow: điền họ tên từ hồ sơ cá nhân IAM cho các bản ghi `applications` đã gửi mà `applicant_name IS NULL`. Chỉ chạy một lần, bằng script SQL hoặc job.
2. **Kiểm tra claim `officer_name` có trong token của công dân**, để hồ sơ gửi mới luôn lưu được tên. Nếu claim chỉ cấp cho cán bộ thì cần thêm cho `REGISTERED_CITIZEN` hoặc lấy tên từ IAM lúc gửi.
3. **(Khuyến nghị) Trả kèm thông tin hồ sơ trong `FeedbackDto`** để FE bỏ được N+1 request:
   - Lúc ghi đánh giá, `AnalyticsService` đã đọc hồ sơ qua `FeedbackApplication` (`AnalyticsContracts.cs:11`). Lưu thêm snapshot `ApplicationCode`, `ProcedureTitle`, `ApplicantName` vào `CitizenFeedback` (thêm cột + migration Analytics).
   - Mở rộng `FeedbackDto`: thêm `ApplicationCode`, `ProcedureTitle`, `ApplicantName` (cho phép null).
   - Phản hồi cũ: điền bù từ Workflow, hoặc để null (FE sẽ tự tra như hiện tại).

### Tiêu chí nghiệm thu

- [ ] Hồ sơ đã gửi trước đây hiện đúng họ tên người dân ở Báo cáo phản hồi và màn chi tiết hồ sơ của cán bộ.
- [ ] Hồ sơ công dân gửi mới luôn có `applicantName`.
- [ ] (Nếu làm mục 3) `GET .../analytics/feedback` trả `applicationCode`, `procedureTitle`, `applicantName` cho từng dòng.
- [ ] Manager vẫn **không** đọc được hồ sơ cá nhân của công dân qua IAM.

### Triển khai Azure

- Mục 1–2: chạy script điền bù trên DB Workflow; deploy lại `wardmate-application-workflow` nếu sửa code. Nếu sửa cách cấp claim thì deploy lại cả IAM.
- Mục 3: chạy migration cho DB Analytics (Analytics đang để `AutoMigrate` mặc định, kiểm tra runbook trước), rồi deploy lại `wardmate-analytics-system`.

### Phía FE sau khi BE xong

- Mục 3: thêm 3 trường vào `feedbackSchema` (`src/lib/api/analytics.ts`) và dùng trực tiếp, bỏ phần tra chi tiết hồ sơ trong `ManagerAnalyticsView.tsx`.

---

## BE-E. Tham vấn & Lịch ngày nghỉ: hiển thị tên thay cho mã ID

### Hiện trạng (đã kiểm tra 07/11)

FE đang phải hiện **mã ID thô** cho cán bộ và lãnh đạo, vì dữ liệu không có tên:

| Màn hình | Trường đang hiện ID | Nguồn |
|---|---|---|
| Tham vấn chuyên môn | "Hồ sơ (mã định danh)": `applicationId`; "Người được hỏi (mã tài khoản)": `specialistId` | `consultationSchema` (`src/lib/api/staffing.ts:13`), chỉ có `applicationId`, `specialistId`, `requestedBy` |
| Lịch ngày nghỉ | "Người khai báo (mã tài khoản)": `createdBy`; "Người hủy (mã tài khoản)": `cancelledBy`; "Phường `{wardCode}`" | `closureSchema` (`src/lib/api/calendarClosures.ts:8`) |

Front Desk không có quyền danh bạ (`iam.accounts.read`), nên FE không tự đổi ID ra tên được (cùng lý do với BE-A).

### Thay đổi đề xuất

1. **Tham vấn:** trả thêm `applicationCode`, `specialistName`, `requestedByName`. Nên lưu snapshot lúc tạo tham vấn, giống cách `AssignedOfficerName` đang làm.
2. **Lịch ngày nghỉ:** trả thêm `createdByName`, `cancelledByName` (snapshot lúc khai báo/hủy) và `wardName` bên cạnh `wardCode`.
3. Chỉ trả **họ tên**, không trả email hay số điện thoại.

### Tiêu chí nghiệm thu

- [ ] Front Desk và Manager xem Tham vấn thấy mã hồ sơ `HS-…` và tên người được hỏi, không còn GUID.
- [ ] Lịch ngày nghỉ hiện tên người khai báo/hủy và tên phường.
- [ ] Không mở thêm quyền đọc danh bạ cho Front Desk.

### Phía FE sau khi BE xong

- Thêm các trường mới vào `consultationSchema` và `closureSchema`, thay các dòng "(mã định danh)" / "(mã tài khoản)" bằng tên.

---

## BE-G. Không phân công / chuyển cán bộ / tham vấn được: thiếu `permissions` trong danh bạ cán bộ (mới 09/11)

### Hiện tượng (test trên Azure 09/11)

Manager mở **Phân công** hoặc **Chuyển cán bộ phụ trách** (ví dụ hồ sơ `HS-20261109-00000046`): **mọi** Front Desk trong phường đều bị khóa với lý do `ASSIGN_PERMISSION_MISSING` ("Thiếu quyền nhận hồ sơ"), kể cả cán bộ đang có ca. Tạo tham vấn cũng sẽ luôn trả 422 `consultation.specialist_ineligible` vì cùng nguyên nhân.

### Nguyên nhân (đã đối chiếu code `origin/kha`, `main`, `deploy`)

- Workflow lấy danh sách cán bộ qua `DispatchDirectory.Officers` → gọi IAM `GET /api/v1/manager/officers`, đọc vào `DispatchOfficer(..., string[]? Permissions = null)` (`DispatchContracts.cs:6`).
- Workflow kiểm tra quyền trên trường này:
  - `DispatchService.cs:32`: `officer.Permissions?.Contains("workflow.assign") != true` → `ASSIGN_PERMISSION_MISSING` (dùng cho cả `assignment-candidates` lẫn lúc lưu phân công, dòng 73).
  - `ConsultationService.cs:55`: `officer.Permissions?.Contains("workflow.consultation.respond") != true` → `specialist_ineligible`.
- Nhưng IAM **không bao giờ trả `permissions`** ở API này: `DirectoryUser(Id, Username, Email, FullName, IdentityNumber, IsActive, WardCode, Roles, AssignedCategories)` (`IAM.Application/Accounts/UserDirectory.cs:7`, projection ở `Infrastructure/Persistence/UserDirectory.cs:33`). → `Permissions` luôn `null` → kiểm tra luôn thất bại.
- Lịch sử: kiểm tra quyền được thêm ngày 29/10 (`e43cf14b` DispatchService, `060d9a83` ConsultationService — NguyenTrungNghia04); `DirectoryUser` (khanguyen, `d1b06011`, `b37c2587`) chưa từng có `Permissions`.

### Thay đổi đề xuất (chọn 1)

1. **(Khuyến nghị) IAM trả `permissions`** trong `GET /api/v1/manager/officers` (và `/admin/users` nếu dùng chung DTO): thêm `string[] Permissions` vào `DirectoryUser`, projection `x.UserRoles.SelectMany(ur => ur.Role.RolePermissions).Select(p => p.Permission.PermissionCode).Distinct()`. Chỉ trả mã quyền, không thêm thông tin cá nhân.
2. Hoặc Workflow coi `Permissions == null` là "không xác minh được quyền" và chỉ dựa vào vai trò `FRONT_DESK_OFFICER` (kém an toàn hơn nếu Admin gỡ quyền khỏi vai trò).

### Tiêu chí nghiệm thu

- [ ] `GET /manager/applications/{id}/assignment-candidates`: Front Desk cùng phường, đúng lĩnh vực, có ca đang diễn ra → `eligible: true`, không còn `ASSIGN_PERMISSION_MISSING`.
- [ ] Manager phân công / chuyển cán bộ thành công.
- [ ] Manager tạo tham vấn cho Front Desk đủ điều kiện → 201.
- [ ] Gỡ quyền `workflow.assign` khỏi một vai trò thì cán bộ đó vẫn bị chặn đúng.

### Triển khai Azure

- Phương án 1: deploy lại `wardmate-iam` (không migration). Phương án 2: deploy lại `wardmate-application-workflow`.

### Phía FE

- Không cần sửa. Modal Phân công đã hiện rõ lý do từng cán bộ (`src/components/staffing/DispatchView.tsx`).

---

## BE-F. Mã QR cho mọi hồ sơ "Giấy tờ sẵn sàng" (mới 09/11)

### Hiện trạng (đã kiểm tra code `origin/kha` và test trên Azure 09/11)

- Sau khi Front Desk xác nhận **Giấy tờ sẵn sàng** (Workflow `DOCUMENTS_READY`), công dân mở **Mã QR hồ sơ** → `GET /api/v1/applications/{id}/approved-qr` trả **404 `document.qr_not_found`**.
- Nguyên nhân: bản ghi `approved_qrs` **chỉ được tạo trong `GeneratePdfDocumentCommand`** (`POST /applications/{id}/generate-pdf`). API này cần một `UserSubmission` (tờ khai DOCX) ở trạng thái `ReadyForDownload` và có file trên Blob.
- Vì vậy các hồ sơ sau **không bao giờ có QR**:
  1. Thủ tục **không có tờ khai điện tử** (chỉ có giấy tờ tải lên) → `contents.submissions = []`. Ví dụ `HS-20261109-00000044` (Cấp bản sao Trích lục hộ tịch): `contents` trả 200, không có submission.
  2. Tờ khai còn `Draft` (công dân lưu nhưng chưa bấm xác nhận) → `ApplicationAccess` chỉ đồng bộ `Submitted → ReadyForDownload`, bỏ qua `Draft`.
  3. Công dân chưa bấm "Tạo PDF" trong chi tiết hồ sơ (QR không tự sinh khi Front Desk duyệt).
- Theo quy định nghiệp vụ: *"Mã QR chỉ được sinh sau khi cán bộ duyệt tiền kiểm, phục vụ tra cứu nhanh phiên bản hồ sơ đã tiền kiểm"* — tức QR gắn với **hồ sơ đã sẵn sàng**, không gắn với việc có tờ khai DOCX hay không.

### Thay đổi đề xuất

1. **Sinh QR theo hồ sơ, không theo PDF:** khi hồ sơ ở `DOCUMENTS_READY`/`OFFICIALLY_RECEIVED` và chưa có `approved_qrs`, `GET .../approved-qr` (sau bước `ApplicationAccess.Read(requireReady: true)` đã xác minh) **tự tạo** bản ghi QR rồi trả 200. Hoặc tạo ngay khi nhận sự kiện hồ sơ chuyển `DOCUMENTS_READY`.
   - `ApprovedQr.SubmissionId` hiện bắt buộc → cho phép null (migration) với hồ sơ không có tờ khai.
2. **Nội dung QR khi chưa có PDF:** `pdf-redirect` hiện cần GeneratedDocument; nếu chưa có PDF thì chuyển sang trang tra cứu công khai `/public/qr-lookup?applicationId=` (đã có) thay vì 404. Khi sau này tạo PDF, giữ nguyên QR (không đổi mã đã in).
3. (Tùy chọn) Đồng bộ thêm `Draft → ReadyForDownload` không được làm (Draft là chưa xác nhận) — chỉ cần mục 1 là đủ để có QR.

### Tiêu chí nghiệm thu

- [ ] Mọi hồ sơ `DOCUMENTS_READY` của công dân: `GET .../approved-qr` và `.../approved-qr/image` trả 200, kể cả hồ sơ không có tờ khai DOCX.
- [ ] Quét QR của hồ sơ chưa có PDF mở được trang tra cứu công khai; hồ sơ có PDF vẫn mở PDF như hiện tại.
- [ ] Hồ sơ chưa sẵn sàng vẫn trả 409 `document.application_not_ready`; người khác vẫn không xem được QR của hồ sơ không thuộc mình.

### Triển khai Azure

- Migration DocumentForm (nếu cho `submission_id` null) chạy trước, rồi deploy lại `wardmate-documentform`.

### Phía FE sau khi BE xong

- Bỏ khung "Hồ sơ chưa có mã QR" (`src/pages/citizen/views/CitizenQrCodeView.tsx`); QR hiện ngay khi mở.

---

## Việc FE (đã làm xong 09/11)

| Việc | File | Liên quan |
|---|---|---|
| ✅ Chỉ gọi `/manager/officers` khi có quyền `iam.accounts.read` (hết 403 với Front Desk) | `src/pages/officer/OfficerPage.tsx` | BE-A |
| ✅ Lịch sử phân công ưu tiên `fromOfficerName`/`toOfficerName`/`actorName`, sau đó mới tra danh bạ hoặc hiện mã rút gọn | `src/lib/api/workflow.ts`, `src/lib/api/workflowAdapters.ts`, `src/lib/api/staffing.ts`, `src/components/staffing/DispatchView.tsx` | BE-A |
| ✅ Bỏ tiền tố `@` trước khi gửi `search` | `src/pages/admin/AdminPage.tsx`, `src/pages/manager/ManagerPage.tsx` | BE-B |
| ✅ Modal phân quyền chọn 1 vai trò, ẩn `IT_ADMIN`, lưu bằng `PUT /rbac/users/{userId}/role`; tài khoản IT_ADMIN không đổi được tại đây | `src/lib/api/rbac.ts`, `src/pages/admin/AdminRbacViews.tsx` | BE-C |
| ✅ Báo cáo phản hồi dùng `applicationCode`/`procedureTitle`/`applicantName` của BE; chỉ tra chi tiết hồ sơ khi phản hồi cũ thiếu | `src/lib/api/analytics.ts`, `src/components/analytics/ManagerAnalyticsView.tsx` | BE-D |
| ✅ Tham vấn hiện mã hồ sơ, người hỏi, người được hỏi, người đóng; Lịch ngày nghỉ hiện tên phường, người khai báo/hủy | `src/lib/api/staffing.ts`, `src/lib/api/calendarClosures.ts`, `src/components/staffing/ConsultationsView.tsx`, `src/components/staffing/CalendarClosuresView.tsx`, `src/lib/personName.ts` | BE-E |
| ✅ Trang Mã QR: báo rõ hồ sơ chưa có QR, nút "Tạo PDF và mã QR" khi có tờ khai sẵn sàng, giải thích khi hồ sơ không có tờ khai | `src/pages/citizen/views/CitizenQrCodeView.tsx` | BE-F |

Dữ liệu cũ (trước 08/11) chưa có tên: FE hiện "Tài khoản xxxxxxxx" (8 ký tự đầu của mã) thay vì cả GUID.
