# Yêu cầu Backend: Tên cán bộ trong lịch sử phân công & các mục Portal còn tồn đọng

*Ngày tạo: 06/11/2026 · Frontend gửi Backend*
*Đã đối chiếu mã nguồn `D:/wardmate-backend` tại thời điểm tạo file*
*Liên quan: `docs/PORTAL_REFINEMENT_TASKS_CHECKLIST.md` (mục 7, 10) và `docs/BE_REQUESTS_FIXES_IAM_PROCEDURE.md` (03/11)*

---

## Tóm tắt

| # | Yêu cầu | Service | Ưu tiên | Cần migration DB | FE có thể tự làm trước? |
|:-:|---|---|:-:|:-:|---|
| **BE-A** | Trả kèm tên cán bộ trong lịch sử phân công hồ sơ | ApplicationWorkflow | 🟡 Trung bình | ✅ Có (3 cột) | Một phần: FE đã tự bỏ lệnh gọi gây 403 |
| **BE-B** | Tìm kiếm user theo `Username` (Checklist mục 10) | IAM | 🟡 Trung bình | ❌ Không | Một phần: FE bỏ tiền tố `@` |
| **BE-C** | Ràng buộc mỗi người dùng một vai trò & bảo vệ `IT_ADMIN` (Checklist mục 7) | IAM | 🔴 Cao | ❌ Không | Một phần: FE chuyển sang chọn 1 vai trò, nhưng chưa an toàn nếu BE không chặn |

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

## Việc FE làm song song (không chờ BE)

| Việc | File | Liên quan |
|---|---|---|
| Chỉ gọi `/manager/officers` khi có quyền `iam.accounts.read` (hết 403 với Front Desk) | `src/pages/officer/OfficerPage.tsx` | BE-A |
| Bỏ tiền tố `@` trước khi gửi `search` | `src/pages/admin/AdminPage.tsx` | BE-B |
| Modal phân quyền chọn 1 vai trò, ẩn `IT_ADMIN` | `src/pages/admin/AdminRbacViews.tsx` | BE-C |
