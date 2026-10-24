# ĐẶC TẢ YÊU CẦU BACKEND: PHÂN CÔNG HỒ SƠ THEO LĨNH VỰC CHO CÁN BỘ MỘT CỬA

**Hợp đồng API đề xuất cho ApplicationWorkflow và IAM (.NET 8)**
_Ngày lập: 23/10/2026 | Người lập: Frontend Team | Trạng thái: BE đã triển khai 24/10/2026 (WORKFLOW-ASSIGN-01, IAM-CATEGORY-01, WORKFLOW-RESUBMIT-01); FE đã tích hợp, chưa kiểm thử với tài khoản thật_

> **Khác với đề xuất ban đầu (theo code BE thực tế):** summary/detail có `assignmentVersion`; Manager PUT assignee **bắt buộc** `expectedAssignmentVersion`, release gửi tùy chọn; lệch trả 409 `workflow.assignment_conflict`. Thêm 409 `workflow.snapshot_missing`, 503 `workflow.iam_unavailable`. Không backfill lĩnh vực hồ sơ cũ (giữ NULL). Không truyền `sort` thì BE tự xếp lĩnh vực của cán bộ lên trước. Gán lĩnh vực cán bộ có thêm 400 `iam.invalid_categories`, 503 `iam.catalog_unavailable`. Chi tiết: `D:/wardmate-backend/docs/api-guide.md` mục "Phân công hồ sơ theo lĩnh vực — 24/10/2026".

---

## 1. Bối cảnh

### 1.1. Hiện trạng (đã đối chiếu source `D:/wardmate-backend` ngày 23/10/2026)

Những gì **đã có**:

- **Lĩnh vực của cán bộ.** IAM lưu lĩnh vực trong cột `users.assigned_categories int[]`. MANAGER sửa giá trị này qua `PUT /api/v1/manager/officers/{userId}/categories` (`UserDirectoryController.cs:29`).
  - Tài liệu hiện tại (`docs/system-constraints.md` IAM-05, `docs/api-guide.md:2884`) ghi rõ trường này **chỉ để hiển thị và lọc**, không giới hạn hàng đợi.
- **Lĩnh vực của thủ tục.** Mỗi thủ tục có một lĩnh vực (`Procedure.CategoryId`). `GET /api/v1/procedures/{id}` trả về `categoryId` và `categoryName`.
- **Nhận xử lý.** Cán bộ tự nhận hồ sơ qua `POST /api/v1/officer/applications/{id}/assign`.
  - `ApplicationReviewStore.Mutate()` khóa dòng bằng `SELECT … FOR UPDATE`, nên hai cán bộ nhận cùng lúc thì chỉ một người thành công, người kia nhận 409.
  - Người phụ trách được giữ nguyên qua các lần công dân nộp lại.
- **Quyền của MANAGER.** MANAGER chỉ được đọc. Mọi thao tác ghi trên hồ sơ (assign, comment, revision, readiness, receipt) đều yêu cầu role FRONT_DESK_OFFICER và **không phải** MANAGER (`WorkflowSecurity.cs:55-62`).

Những gì **còn thiếu**:

1. `ApplicationRecord` không lưu lĩnh vực. `ProcedureSnapshot` (`WorkflowContracts.cs:39-40`) bỏ qua `categoryId`/`categoryName` khi tạo hồ sơ. Vì vậy FE đang ghi cứng nhãn "Hành chính cấp Xã/Phường".
2. Hàng đợi và danh sách không lọc được theo lĩnh vực. `access-context` cũng không trả về lĩnh vực của cán bộ.
3. Không có API để cán bộ trả lại hồ sơ đã nhận, và không có API để MANAGER giao hoặc chuyển hồ sơ.
4. `GET /officer/applications` không có bộ lọc "hồ sơ của tôi" hay "chưa phân công".
5. `ApplicationSummaryDto` thiếu tên cán bộ phụ trách và `resubmitCount`. Hệ quả: tab "Đã gửi lại" phía FE luôn rỗng, và FE phải gọi chi tiết cho từng dòng để lấy thông tin còn thiếu (N+1).

### 1.2. Quyết định nghiệp vụ (người dùng đã chốt ngày 23/10/2026)

| #   | Quyết định                                                                                                                                                                                                                                                                   |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | **Ưu tiên mềm theo lĩnh vực.** Mặc định cán bộ thấy trước hồ sơ thuộc lĩnh vực của mình, nhưng vẫn xem và nhận được hồ sơ lĩnh vực khác trong cùng phường. BE **không chặn** việc nhận hồ sơ khác lĩnh vực.                                                                  |
| D2  | **MANAGER giám sát và giao/chuyển hồ sơ.** MANAGER xem toàn bộ hồ sơ trong phường, giao hồ sơ chưa có người nhận, chuyển hồ sơ đang xử lý sang cán bộ khác (bắt buộc có lý do, có ghi lịch sử). MANAGER **không** tự duyệt, không yêu cầu bổ sung, không xác nhận tiếp nhận. |
| D3  | **Cán bộ được trả lại hồ sơ** khi hồ sơ còn `UNDER_REVIEW`, kèm lý do. Hồ sơ quay về `SUBMITTED` để người khác nhận.                                                                                                                                                         |
| D4  | **Cán bộ chưa được gán lĩnh vực nào** được coi là phụ trách mọi lĩnh vực.                                                                                                                                                                                                    |
| D5  | **Lĩnh vực của hồ sơ là snapshot** lấy tại thời điểm tạo hồ sơ. Đổi lĩnh vực của thủ tục sau đó không ảnh hưởng hồ sơ cũ.                                                                                                                                                    |
| D6  | PROCEDURE_MANAGER giữ nguyên vai trò: chỉ quản lý danh mục lĩnh vực và thủ tục, không phân công cán bộ.                                                                                                                                                                      |

---

## 2. Thay đổi dữ liệu (ApplicationWorkflow)

### 2.1. `ApplicationRecord`

| Cột mới                 | Kiểu                | Ghi chú                                           |
| ----------------------- | ------------------- | ------------------------------------------------- |
| `category_id`           | `int NULL`          | Snapshot từ Catalog khi tạo hồ sơ                 |
| `category_name`         | `varchar(255) NULL` | Snapshot, để hiển thị không cần gọi Catalog       |
| `assigned_officer_name` | `varchar(255) NULL` | Snapshot họ tên cán bộ lúc nhận, giao hoặc chuyển |
| `assigned_at`           | `timestamptz NULL`  | Thời điểm nhận, giao hoặc chuyển gần nhất         |

- Thêm index `(ward_code, category_id, status)`.
- **Ghi khi tạo hồ sơ:** mở rộng `ProcedureSnapshot` để đọc `categoryId` và `categoryName` (DTO chi tiết thủ tục đã có sẵn hai trường này), rồi gán vào hồ sơ trong `WorkflowRequests.cs` tại điểm tạo `ApplicationRecord`.
- **Backfill hồ sơ cũ:** chạy job một lần, gom theo `procedure_id` và gọi Catalog `GET /api/v1/procedures/{id}`. Thủ tục không còn tồn tại thì giữ `NULL`; FE sẽ hiển thị "Chưa xác định lĩnh vực".

### 2.2. Lịch sử phân công

Dùng lại bảng `ApplicationStatusHistory`, hoặc tạo bảng mới `application_assignment_history`. Mỗi lần nhận, trả, giao hoặc chuyển phải ghi các trường sau:
`application_id`, `action` (`CLAIM` | `RELEASE` | `ASSIGN` | `TRANSFER`), `from_officer_id`, `to_officer_id`, `actor_id`, `reason`, `created_at`.

Lịch sử này dùng cho timeline hồ sơ và cho trang chi tiết cán bộ phía Manager.

---

## 3. Thay đổi DTO

### 3.1. `ApplicationSummaryDto` và `ApplicationDto` — thêm trường

```json
{
  "categoryId": 3,
  "categoryName": "Hộ tịch",
  "assignedOfficerId": "0b9c…",
  "assignedOfficerName": "Trần Thị B",
  "assignedAt": "2026-10-23T08:15:00Z",
  "resubmitCount": 1
}
```

Mọi trường mới đều nullable để FE cũ không bị vỡ khi đọc.

### 3.2. `GET /api/v1/users/access-context` và `GET /api/v1/users/me` — thêm trường

```json
{ "assignedCategories": [3, 7] }
```

`WorkflowAccessMiddleware` đưa giá trị này vào claim (ví dụ `assigned_categories`) để query của Workflow dùng được, không phải gọi lại IAM.

---

## 4. Bộ lọc mới cho `GET /api/v1/officer/applications`

Các tham số đang có giữ nguyên: `status` (danh sách cách nhau bằng dấu phẩy), `procedureId`, `applicationCode`, `submittedFrom`, `submittedTo`, `page`, `pageSize`.

| Tham số mới   | Giá trị                                    | Hành vi                                                                                                                   |
| ------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| `categoryIds` | `3,7`                                      | Lọc theo lĩnh vực đã snapshot trên hồ sơ                                                                                  |
| `scope`       | `my-categories`                            | Lọc theo lĩnh vực của người gọi, lấy từ claim. **Danh sách rỗng thì không lọc (D4).** Với MANAGER thì bỏ qua tham số này. |
| `assignee`    | `me` \| `unassigned` \| `{officerId}`      | `me` là `AssignedOfficerId == actor.Id`. `{officerId}` chỉ dành cho MANAGER.                                              |
| `overdue`     | `true`                                     | Chỉ lấy hồ sơ có `DeadlineStatus` quá hạn                                                                                 |
| `sort`        | `submittedAt` \| `-submittedAt` \| `dueAt` | Mặc định giữ như hiện tại (`UpdatedAt` giảm dần)                                                                          |

**Phạm vi đọc** giữ như hiện tại: cùng `WardCode` và không trả hồ sơ do chính người gọi nộp.

**MANAGER** phải dùng được endpoint này và `GET /api/v1/officer/applications/{id}` để đọc toàn bộ hồ sơ trong phường. Hiện tại `workflow.queue.read` đã cho phép role MANAGER; cần kiểm tra thêm `workflow.read` và migration `ManagerWorkflowReadScope`, và bổ sung nếu còn thiếu.

---

## 5. Endpoint mới

### 5.1. Cán bộ trả lại hồ sơ

- **Route:** `POST /api/v1/officer/applications/{id}/release`
- **Policy:** `workflow.assign` (FRONT_DESK_OFFICER, không phải MANAGER)
- **Body:**
  ```json
  { "reason": "Hồ sơ thuộc lĩnh vực Đất đai, chuyển cán bộ phụ trách" }
  ```

**Quy tắc:**

1. `reason` bắt buộc, 5–500 ký tự. Sai thì trả 400 `workflow.validation`.
2. Hồ sơ phải ở trạng thái `UNDER_REVIEW` và `AssignedOfficerId == actor.Id`.
   - Không đúng người phụ trách: trả 403 `workflow.not_assignee`.
   - Sai trạng thái: trả 409 `workflow.invalid_status`.
3. Chạy trong `Mutate()` (có khóa dòng). Cập nhật `Status = SUBMITTED`, `AssignedOfficerId = NULL`, `AssignedOfficerName = NULL`, `AssignedAt = NULL`.
4. Comment đã tạo được **giữ nguyên**. Hạn xử lý (deadline) tiếp tục chạy, không reset.
5. Ghi lịch sử với `action = RELEASE` kèm lý do.

**Response 200:** `ReviewResultDto`, giống các thao tác review khác.

### 5.2. MANAGER giao hoặc chuyển hồ sơ

- **Route:** `PUT /api/v1/manager/applications/{id}/assignee`
- **Policy:** permission mới `workflow.assign.manage`, chỉ seed cho role `MANAGER`
- **Body:**
  ```json
  { "officerId": "0b9c…", "reason": "Cân bằng khối lượng, cán bộ A nghỉ phép" }
  ```

**Quy tắc:**

1. `reason` bắt buộc, 5–500 ký tự.
2. Hồ sơ phải cùng `WardCode` với MANAGER. Khác phường thì trả 404, theo cách che giấu đang dùng cho các endpoint đọc.
3. **Kiểm tra cán bộ đích:** đang hoạt động, có role `FRONT_DESK_OFFICER`, cùng phường, và không phải người nộp hồ sơ.
   - Kiểm tra qua IAM, chuyển tiếp token như `WorkflowDirectory` đang làm. Có thể gọi `GET /api/v1/manager/officers` rồi kiểm tra ID nằm trong kết quả, hoặc thêm một endpoint IAM nội bộ để tra một cán bộ.
   - Không hợp lệ thì trả 422 `workflow.invalid_assignee`.
   - Cán bộ đích chính là người đang phụ trách thì trả 409 `workflow.same_assignee`.
4. **Theo trạng thái hồ sơ:**
   - `SUBMITTED`, chưa có người phụ trách (giao mới): gán cán bộ và chuyển sang `UNDER_REVIEW`, giống khi cán bộ tự nhận.
   - `UNDER_REVIEW`, `NEED_REVISION` hoặc `DOCUMENTS_READY` (chuyển người): chỉ đổi `AssignedOfficerId`, **giữ nguyên trạng thái**.
   - `DRAFT`, `OFFICIALLY_RECEIVED` hoặc `CANCELLED`: trả 409 `workflow.invalid_status`.
5. Chạy trong `Mutate()` (có khóa dòng). Cập nhật `AssignedOfficerName` và `AssignedAt`, ghi lịch sử `ASSIGN` hoặc `TRANSFER`.
6. Phát event `APPLICATION_ASSIGNED` qua outbox hiện có. Notification gửi cho cán bộ mới, và cho cán bộ cũ nếu là chuyển người.

**Response 200:** `ReviewResultDto`.

### 5.3. Permission và migration

- Thêm `workflow.assign.manage` (nhãn: "Giao/chuyển hồ sơ cho cán bộ trong phường") vào `FeaturePermissions.cs`, và seed cho `MANAGER`.
- Không cấp các quyền review (comment, revision, readiness, receipt) cho MANAGER, theo D2.

---

## 6. Ngoài phạm vi, làm sau

- Thống kê analytics theo lĩnh vực: thêm chiều `category_id` vào `OfficerMetric` và các truy vấn analytics.
- Kiểm tra category ID có tồn tại khi gán lĩnh vực cho cán bộ; dọn ID mồ côi khi một lĩnh vực bị xóa.
- Ghi `rbac_audit_logs` khi gán lĩnh vực cho cán bộ (hiện thao tác này chưa có audit).
- Tự động hết hạn quyền nhận khi cán bộ giữ hồ sơ quá lâu mà không xử lý.

---

## 7. Kịch bản kiểm thử đề xuất cho Backend

1. Tạo hồ sơ cho một thủ tục thuộc lĩnh vực 3, rồi đọc summary: `categoryId = 3`.
2. Đổi lĩnh vực của thủ tục đó, rồi đọc lại hồ sơ cũ: vẫn là `3` (D5).
3. Cán bộ A được gán `[3]`:
   - Gọi `scope=my-categories` chỉ trả hồ sơ lĩnh vực 3.
   - Cán bộ A vẫn nhận được hồ sơ lĩnh vực 7 (D1).
4. Cán bộ C chưa được gán lĩnh vực nào: gọi `scope=my-categories` trả mọi lĩnh vực (D4).
5. Cán bộ A trả lại hồ sơ đang `UNDER_REVIEW`: hồ sơ về `SUBMITTED` và không còn người phụ trách; cán bộ B nhận được.
6. Cán bộ B gọi trả lại hồ sơ của cán bộ A: 403.
7. MANAGER giao hồ sơ `SUBMITTED` cho cán bộ A: hồ sơ chuyển `UNDER_REVIEW`, phụ trách là A.
8. MANAGER chuyển hồ sơ `NEED_REVISION` từ A sang B: trạng thái giữ nguyên, phụ trách là B, có lịch sử `TRANSFER`.
9. MANAGER giao hồ sơ cho cán bộ khác phường hoặc tài khoản đã khóa: 422.
10. MANAGER gọi `POST …/request-revision`: vẫn 403.
11. Cán bộ tự nhận và MANAGER giao cùng lúc: chỉ một thao tác thành công, thao tác còn lại nhận 409.
