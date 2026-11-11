# BE-G — Danh bạ cán bộ IAM thiếu `permissions` nên không phân công / tham vấn được

| | |
|---|---|
| Ngày | 09/11/2026 |
| Mức độ | **Cao (chặn nghiệp vụ)**: Manager không phân công/chuyển cán bộ được, không mở tham vấn chuyên môn được |
| Service cần sửa | **IAM** (`wardmate-iam`) |
| Service KHÔNG cần sửa | ApplicationWorkflow, Frontend |
| Migration / SQL | **Không cần** |

---

## 1. Triệu chứng

1. Manager vào **Điều phối → Phân công / Chuyển cán bộ**: **mọi** cán bộ Front Desk đều không chọn được, kể cả người đang có ca làm, đúng phường, đúng lĩnh vực.
   - `GET /api/v1/manager/applications/{id}/assignment-candidates` trả về từng cán bộ với `eligible: false`, trong `blockers` luôn có `"ASSIGN_PERMISSION_MISSING"`.
   - `POST /api/v1/manager/applications/{id}/assignments` trả về **422 `officer_ineligible`**.
2. Mở **Tham vấn chuyên môn** cho hồ sơ đang xử lý:
   - `POST /api/v1/applications/{applicationId}/consultations` trả về **422 `specialist_ineligible`** ("Cần cán bộ khác đủ quyền, cùng phường/lĩnh vực và có lịch làm, không nghỉ.") với mọi cán bộ được chọn.

Cách tạm thời đang dùng: Front Desk tự nhận hồ sơ (self-claim không đi qua danh bạ). Phân công từ Manager và tham vấn vẫn bị chặn hoàn toàn.

## 2. Nguyên nhân gốc

Workflow lấy danh sách cán bộ từ IAM, sau đó kiểm tra **quyền** của từng người. Response của IAM lại **không có trường `permissions`**, nên phép kiểm tra luôn thất bại.

**Bên Workflow:**

- `src/Services/WardMate.Services.ApplicationWorkflow/WardMate.Services.ApplicationWorkflow.Infrastructure/DispatchDirectory.cs`: gọi `GET api/v1/manager/officers?page={n}&pageSize=100` rồi deserialize thành `DispatchOfficer`.
- `.../ApplicationWorkflow.Application/DispatchContracts.cs:6`:
  ```csharp
  public sealed record DispatchOfficer(Guid Id, string? FullName, bool IsActive, string? WardCode,
      string[] Roles, int[] AssignedCategories, string[]? Permissions = null);
  ```
  IAM không trả `permissions`, nên `Permissions` **luôn null**.
- `.../ApplicationWorkflow.Infrastructure/DispatchService.cs:32`:
  ```csharp
  officer.Permissions?.Contains("workflow.assign") != true ? "ASSIGN_PERMISSION_MISSING" : null,
  ```
  Với `null`, biểu thức `null != true` cho kết quả **true**, nên mọi cán bộ đều bị gắn `ASSIGN_PERMISSION_MISSING`. Cùng hàm `Reasons()` này còn được dùng khi assign (khoảng dòng 73), nên request assign trả về 422.
- `.../ApplicationWorkflow.Infrastructure/ConsultationService.cs:55`:
  ```csharp
  officer.Permissions?.Contains("workflow.consultation.respond") != true
  ```
  Lỗi tương tự, dẫn tới 422 `specialist_ineligible`.

**Bên IAM (chỗ thiếu):**

- `src/Services/WardMate.Services.IAM/WardMate.Services.IAM.Application/Accounts/UserDirectory.cs:8-9`: record `DirectoryUser` **không có** trường `Permissions`.
- `src/Services/WardMate.Services.IAM/WardMate.Services.IAM.Infrastructure/Persistence/UserDirectory.cs:32-34`: projection của `List()` chỉ lấy `Roles` và `AssignedCategories`.

**Dữ liệu DB đã đúng.** Vai trò `FRONT_DESK_OFFICER` đã được cấp đủ quyền:

- `workflow.assign`: migration `20261009095945_OfficerDirectoryCategories`;
- `workflow.consultation.respond`: migration `20261029120000_ManagerStaffingPermissions`, hoặc `docs/sql/iam-staffing-permissions.sql`.

Vì vậy **chạy SQL không sửa được lỗi này**: dữ liệu đã đúng, chỉ có API không trả nó ra.

Lịch sử: danh bạ được tạo ở `d1b0601` và `b37c258`. Phần kiểm tra `Permissions` trong Workflow được thêm sau, ở `e43cf14b` và `060d9a83`, nhưng IAM chưa được cập nhật theo.

## 3. Yêu cầu sửa (chỉ IAM, 2 chỗ)

### 3.1. Thêm `Permissions` vào `DirectoryUser`

File: `src/Services/WardMate.Services.IAM/WardMate.Services.IAM.Application/Accounts/UserDirectory.cs`

```diff
 public sealed record DirectoryUser(Guid Id, string Username, string Email, string? FullName, string? IdentityNumber,
-    bool IsActive, string? WardCode, string[] Roles, int[] AssignedCategories);
+    bool IsActive, string? WardCode, string[] Roles, int[] AssignedCategories, string[] Permissions);
```

### 3.2. Lấy mã quyền trong projection của `List()`

File: `src/Services/WardMate.Services.IAM/WardMate.Services.IAM.Infrastructure/Persistence/UserDirectory.cs`

```diff
         var items = await q.OrderBy(x => x.Username).ThenBy(x => x.Id).Skip((f.Page - 1) * f.PageSize).Take(f.PageSize)
             .Select(x => new DirectoryUser(x.Id, x.Username, x.Email, x.Profile == null ? null : x.Profile.FullName,
                 x.Profile == null ? null : x.Profile.IdentityNumber, x.IsActive, x.Ward == null ? null : x.Ward.Code,
-                x.UserRoles.Select(ur => ur.Role.RoleName).ToArray(), x.AssignedCategories)).ToArrayAsync(ct);
+                x.UserRoles.Select(ur => ur.Role.RoleName).ToArray(), x.AssignedCategories,
+                x.UserRoles.SelectMany(ur => ur.Role.RolePermissions).Select(rp => rp.Permission.PermissionCode).Distinct().ToArray()))
+            .ToArrayAsync(ct);
```

Cách lấy quyền này giống hàm `Access()` trong cùng file (khoảng dòng 59–64) và `IdentityDtos.cs:19`, vốn đang chạy đúng trên production. EF Core sẽ dịch thành subquery, không cần `Include`.

### 3.3. Những thứ KHÔNG cần đổi

- `new DirectoryUser(...)` chỉ được tạo **duy nhất** ở `Infrastructure/Persistence/UserDirectory.cs`; không có test hay chỗ nào khác dựng record này. Thêm tham số không làm vỡ build.
- Workflow `DispatchOfficer` đã có `string[]? Permissions`, và `ReadFromJsonAsync` mặc định dùng camelCase nên tự map `permissions` vào. **Không cần sửa và không cần deploy lại Workflow.**
- Frontend: schema Zod bỏ qua trường thừa, nên không ảnh hưởng.

### 3.4. Phạm vi ảnh hưởng

- Response của `GET /api/v1/manager/officers` và `GET /api/v1/admin/users` (dùng chung `DirectoryUser`) sẽ có thêm `"permissions": ["workflow.assign", ...]`.
- Đây chỉ là danh sách mã quyền, không thêm dữ liệu cá nhân. Hai endpoint vẫn giữ policy `iam.accounts.read` và phạm vi phường hiện tại.

## 4. Phương án thay thế (không khuyến nghị)

Có thể bỏ điều kiện `officer.Permissions?.Contains(...) != true` ở `DispatchService.cs:32` và `ConsultationService.cs:55`, chỉ dựa vào role `FRONT_DESK_OFFICER`. Cách này **kém an toàn**: nếu Admin gỡ quyền `workflow.assign` khỏi một vai trò thì cán bộ vẫn được phân công. Ngoài ra nó còn bỏ qua ý đồ của commit `e43cf14b` và `060d9a83`.

## 5. Triển khai

1. `dotnet build WardMate.sln -c Release`
2. Build image và deploy lại **riêng** Container App `wardmate-iam`.
3. Không cần migration, không chạy SQL, không restart Workflow. Workflow gọi IAM ở mỗi request nên nhận dữ liệu mới ngay.

## 6. Tiêu chí nghiệm thu

| # | Kiểm tra | Kết quả mong đợi |
|---|---|---|
| 1 | Gọi `GET /api/v1/manager/officers` bằng token Manager | Mỗi item có `permissions`; với FD có `workflow.assign` và `workflow.consultation.respond` |
| 2 | Gọi `GET /api/v1/manager/applications/{id}/assignment-candidates` | Không còn `ASSIGN_PERMISSION_MISSING` với FD đúng phường; FD có ca hiện tại + đúng lĩnh vực ⇒ `eligible: true` |
| 3 | Manager phân công hồ sơ `SUBMITTED` cho FD đủ điều kiện | 200, hồ sơ chuyển `UNDER_REVIEW`, lịch sử phân công ghi tên |
| 4 | Manager chuyển cán bộ (reassign) | 200 |
| 5 | Mở tham vấn cho hồ sơ `UNDER_REVIEW` với FD khác đủ điều kiện | 200/201, không còn 422 `specialist_ineligible` |
| 6 | Admin gỡ `workflow.assign` khỏi vai trò FD, rồi xem lại candidates | Hiện lại `ASSIGN_PERMISSION_MISSING` (chứng minh kiểm tra quyền vẫn hoạt động) |
| 7 | FD không có ca hiện tại | Vẫn bị chặn bởi `NO_ACTIVE_SHIFT` / `officer_unavailable` (lý do thật, không phải lỗi quyền) |

Đề nghị thêm 1 unit test cho `UserDirectory.List`: kiểm tra `Permissions` của user FD chứa `workflow.assign`.
