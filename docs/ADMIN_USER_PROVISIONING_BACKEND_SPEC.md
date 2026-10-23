# ĐẶC TẢ YÊU CẦU BACKEND (IAM): KHỞI TẠO TÀI KHOẢN CÁN BỘ HỆ THỐNG
**Tài liệu yêu cầu kỹ thuật & hợp đồng API dành cho Backend IAM (.NET 8 Clean Architecture)**  
*Ngày lập: 23/10/2026 | Người lập: Frontend Team / IT Admin Module*

---

## 1. Bối cảnh & Lý do thay đổi nghiệp vụ (Business Context & Rationale)

### 1.1. Hiện trạng & Vấn đề tồn tại
1. **Công dân (`REGISTERED_CITIZEN`)**: Đã hoạt động chuẩn. Công dân tự đăng ký qua `POST /api/v1/auth/register`, hệ thống tự động gán duy nhất vai trò `REGISTERED_CITIZEN`.
2. **Cán bộ Một cửa (`FRONT_DESK_OFFICER`)**: Đã hoạt động chuẩn. Lãnh đạo UBND Phường (`MANAGER`) đã có endpoint chuyên biệt `POST /api/v1/accounts/front-desk` để tạo tài khoản cán bộ một cửa gắn liền với địa bàn phường công tác (`WardId`).
3. **Bất cập ở phía Quản trị viên (`IT_ADMIN`)**:
   - Hiện tại **chưa có endpoint tạo trực tiếp tài khoản cán bộ quản trị** cho vai trò:
     - `PROCEDURE_MANAGER` (Cán bộ quản lý danh mục thủ tục hành chính & biểu mẫu).
     - `MANAGER` (Lãnh đạo UBND cấp Xã/Phường).
   - Quản trị viên đang phải thực hiện theo luồng tạm: Tài khoản phải được đăng ký trước (dưới dạng công dân), sau đó Admin dùng API phân vai trò RBAC thô `PUT /api/v1/rbac/users/{userId}/roles/{roleId}` để gán thêm role.
   - **Rủi ro nghiệp vụ**:
     - Sai lệch bản chất tài khoản công vụ: Công dân vãng lai bị biến thành cán bộ công quyền.
     - Tài khoản `MANAGER` bị gán vai trò nhưng không có `WardId`, dẫn tới tài khoản bị "mồ côi", không xem được hồ sơ và không quản lý được cán bộ một cửa thuộc địa bàn phường.
     - Một tài khoản vừa mang vai trò công dân nộp hồ sơ, vừa mang vai trò cán bộ duyệt hồ sơ, vi phạm nguyên tắc kiểm soát xung đột quyền lợi (Separation of Concerns).

### 1.2. Quyết định nghiệp vụ mới
- **Admin không dùng API phân vai trò (`/api/v1/rbac/users/{userId}/roles/{roleId}`) cho người dùng thông thường nữa.**
- Tài khoản cán bộ bắt buộc phải được **khởi tạo có chủ đích (Provisioned)** với vai trò xác định ngay từ thời điểm tạo mới:
  - `MANAGER`: Do **IT_ADMIN** tạo mới, bắt buộc gán đơn vị công tác (`WardId`).
  - `PROCEDURE_MANAGER`: Do **IT_ADMIN** tạo mới (quản lý danh mục thủ tục tập trung).
  - `FRONT_DESK_OFFICER`: Giữ nguyên do **MANAGER** tạo qua `/api/v1/accounts/front-desk`.
  - `REGISTERED_CITIZEN`: Giữ nguyên do công dân tự đăng ký qua `/api/v1/auth/register`.

---

## 2. Đặc tả API yêu cầu Backend triển khai

Nhằm đồng nhất với API đã có `POST /api/v1/accounts/front-desk` tại `StaffAdministrationController`, Backend triển khai 2 endpoint chuyên biệt dưới đây (hoặc gom chung theo Option B ở mục 2.3).

### 2.1. API Tạo Lãnh đạo UBND Xã/Phường (`MANAGER`)

- **Route:** `POST /api/v1/accounts/manager`
- **Controller đề xuất:** `StaffAdministrationController`
- **Quyền yêu cầu (Authorization):** 
  - Token JWT hợp lệ của `IT_ADMIN`.
  - Policy: `AccountManagementRequirement.Policy` và `iam.accounts.manage` (hoặc kiểm tra `rbac.IsAdministrator(actorId)`).
- **Request Headers:**
  - `Authorization: Bearer <accessToken>`
  - `Content-Type: application/json`

#### Request Body (`CreateManagerInput`):
```json
{
  "username": "manager_binhthanh",
  "email": "manager.binhthanh@wardmate.vn",
  "password": "Password@123",
  "fullName": "Nguyễn Văn Quản Lý",
  "wardId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
}
```

#### Quy tắc ràng buộc & Xử lý (Business Rules):
1. **`wardId` là BẮT BUỘC**:
   - Phải kiểm tra tồn tại trong bảng `wards`.
   - Nếu không tìm thấy: Trả về HTTP 404 với ProblemDetails `iam.ward_not_found` (*"Không tìm thấy phường công tác hợp lệ"*).
2. **`username` & `email`**:
   - Duy nhất trong toàn hệ thống.
   - Nếu đã tồn tại: Trả về HTTP 409 với ProblemDetails `AuthErrors.DuplicateAccount` (*"Tên đăng nhập hoặc email đã được sử dụng"*).
3. **`password`**:
   - Tuân thủ tiêu chuẩn mật khẩu hiện tại (tối thiểu 8 ký tự, gồm chữ hoa, chữ thường, chữ số, ký tự đặc biệt).
4. **`fullName`**:
   - Bắt buộc, tối đa 255 ký tự. Tự động lưu vào `user_profiles.full_name`.
5. **Gán vai trò duy nhất**:
   - Gán `role_id` của role hệ thống `MANAGER`.
6. **Transaction & Audit**:
   - Chạy trong `rbac.Exclusive` (PostgreSQL transaction advisory lock).
   - Ghi bản ghi vào `rbac_audit_logs`:
     - `action`: `"account.manager_created"`
     - `target_user_id`: ID của user vừa tạo
     - `role_id`: ID của role `MANAGER`
     - `details`: `{"wardId": "..."}`

#### Response Thành công: `201 Created`
- Header: `Location: /api/v1/accounts/{newUserId}`
- Body (`ManagedUserDto`):
```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "username": "manager_binhthanh",
  "email": "manager.binhthanh@wardmate.vn",
  "isActive": true,
  "wardId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "wardName": "Phường 25, Quận Bình Thạnh",
  "profile": {
    "fullName": "Nguyễn Văn Quản Lý",
    "identityNumber": null,
    "phoneNumber": null,
    "dateOfBirth": null,
    "gender": null,
    "permanentAddress": null,
    "temporaryAddress": null
  },
  "roles": [
    {
      "id": 3,
      "roleName": "MANAGER"
    }
  ]
}
```

---

### 2.2. API Tạo Cán bộ Quản lý Thủ tục & Biểu mẫu (`PROCEDURE_MANAGER`)

- **Route:** `POST /api/v1/accounts/procedure-manager`
- **Controller đề xuất:** `StaffAdministrationController`
- **Quyền yêu cầu (Authorization):** 
  - Token JWT hợp lệ của `IT_ADMIN`.
  - Policy: `AccountManagementRequirement.Policy` và `iam.accounts.manage`.
- **Request Headers:**
  - `Authorization: Bearer <accessToken>`
  - `Content-Type: application/json`

#### Request Body (`CreateProcedureManagerInput`):
```json
{
  "username": "proc_manager_01",
  "email": "proc.manager@wardmate.vn",
  "password": "Password@123",
  "fullName": "Trần Thị Thủ Tục",
  "wardId": null
}
```

#### Quy tắc ràng buộc & Xử lý (Business Rules):
1. **`wardId` là TÙY CHỌN (Nullable)**:
   - Cán bộ quản lý thủ tục có thể quản lý danh mục toàn hệ thống hoặc cấp quận/huyện, không bắt buộc gắn với một xã/phường cụ thể.
   - Nếu client truyền `wardId` khác null: Vẫn kiểm tra hợp lệ trong bảng `wards`.
2. **`username`, `email`, `password`, `fullName`**:
   - Tương tự như quy tắc tạo cán bộ ở mục 2.1.
3. **Gán vai trò duy nhất**:
   - Gán `role_id` của role hệ thống `PROCEDURE_MANAGER`.
4. **Transaction & Audit**:
   - Chạy trong `rbac.Exclusive`.
   - Ghi bản ghi vào `rbac_audit_logs`:
     - `action`: `"account.procedure_manager_created"`
     - `target_user_id`: ID của user vừa tạo
     - `role_id`: ID của role `PROCEDURE_MANAGER`
     - `details`: `{"wardId": null}`

#### Response Thành công: `201 Created`
- Header: `Location: /api/v1/accounts/{newUserId}`
- Body (`ManagedUserDto`):
```json
{
  "id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
  "username": "proc_manager_01",
  "email": "proc.manager@wardmate.vn",
  "isActive": true,
  "wardId": null,
  "wardName": null,
  "profile": {
    "fullName": "Trần Thị Thủ Tục"
  },
  "roles": [
    {
      "id": 4,
      "roleName": "PROCEDURE_MANAGER"
    }
  ]
}
```

---

### 2.3. Phương án thay thế (Option B - Endpoint gom chung)
Nếu đội Backend muốn giảm thiểu số lượng route, có thể mở rộng một endpoint tổng quát:
- **Route:** `POST /api/v1/accounts/staff`
- **Request Body:**
```json
{
  "username": "manager_quan1",
  "email": "manager.q1@wardmate.vn",
  "password": "Password@123",
  "fullName": "Lê Văn Lãnh Đạo",
  "role": "MANAGER",
  "wardId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
}
```
- **Validation:**
  - `role` chỉ chấp nhận: `"MANAGER"` hoặc `"PROCEDURE_MANAGER"`.
  - Nếu `role === "MANAGER"`: Bắt buộc `wardId` không được null.
  - Nếu `role === "PROCEDURE_MANAGER"`: `wardId` có thể null.

*(Frontend khuyến nghị **Option A (2.1 & 2.2)** vì tính tường minh, nhất quán 100% với endpoint `POST /api/v1/accounts/front-desk` hiện có trong `StaffAdministrationController`).*

---

## 3. Bảng tổng hợp mã lỗi (ProblemDetails)

Backend trả về ProblemDetails theo chuẩn RFC 7807 tiếng Việt hiện hành:

| Mã HTTP | Mã lỗi (`code`) | Mô tả / Nguyên nhân | Cách khắc phục từ client |
|:---:|:---|:---|:---|
| **400** | `validation_failed` | Thiếu trường bắt buộc, mật khẩu không đủ độ phức tạp, hoặc định dạng email sai. | Sửa lại thông tin theo trường lỗi chi tiết. |
| **400** | `iam.ward_required` | Tạo `MANAGER` nhưng không truyền `wardId`. | Chọn đơn vị Phường/Xã công tác. |
| **401** | `iam.unauthorized` | Token hết hạn hoặc không có quyền truy cập. | Đăng nhập lại với tài khoản IT_ADMIN. |
| **403** | `iam.forbidden` | Người gọi không phải là IT_ADMIN có quyền `iam.accounts.manage`. | Kiểm tra lại phân quyền của actor. |
| **404** | `iam.ward_not_found` | `wardId` truyền vào không tồn tại trong DB. | Tải lại danh sách phường từ `GET /api/v1/accounts/wards`. |
| **409** | `iam.duplicate_account` | Tên đăng nhập hoặc email đã tồn tại trong hệ thống. | Đổi username hoặc email khác. |

---

## 4. Tác động & Kế hoạch cập nhật phía Frontend

Sau khi Backend hoàn thiện và cung cấp endpoint trên:

1. **Giao diện Quản trị Người dùng (`AdminPage` - tab "Người dùng hệ thống")**:
   - **Xóa bỏ nút "Phân vai trò"**: Không còn gọi `PUT /api/v1/rbac/users/{userId}/roles/{roleId}` để phân quyền người dùng thông thường.
   - **Thêm nút "Tạo tài khoản cán bộ"** trên thanh toolbar:
     - Mở Modal tạo cán bộ với form nhập liệu:
       - Tên đăng nhập (`username`)
       - Họ và tên cán bộ (`fullName`)
       - Email công vụ (`email`)
       - Mật khẩu khởi tạo (`password`)
       - Vai trò cán bộ: Lựa chọn `MANAGER` (Lãnh đạo UBND phường) hoặc `PROCEDURE_MANAGER` (Cán bộ quản lý thủ tục).
       - Đơn vị Phường/Xã công tác: Dropdown chọn phường (bắt buộc khi chọn `MANAGER`, tự động ẩn/tùy chọn khi chọn `PROCEDURE_MANAGER`).
2. **Luồng phân vai trò RBAC (`/api/v1/rbac/*`)**:
   - Giữ nguyên trong mã nguồn backend cho quản trị vai trò nâng cao/hệ thống, nhưng tách biệt hoàn toàn khỏi luồng vận hành người dùng thông thường.

---

## 5. Kịch bản kiểm thử mẫu (Acceptance Criteria / Test Scenarios)

1. **TC-01 (Tạo Manager thành công):**
   - Đăng nhập `IT_ADMIN`.
   - Gửi request `POST /api/v1/accounts/manager` với thông tin hợp lệ và `wardId` tồn tại.
   - **Kỳ vọng:** Trả về 201 Created, `user.wardId` đúng giá trị, role là `MANAGER`, có bản ghi trong `rbac_audit_logs`.

2. **TC-02 (Tạo Manager thất bại do thiếu hoặc sai WardId):**
   - Gửi request `POST /api/v1/accounts/manager` với `wardId = null` hoặc GUID không tồn tại.
   - **Kỳ vọng:** Trả về 400 hoặc 404 `iam.ward_not_found`, không tạo user trong DB.

3. **TC-03 (Tạo Procedure Manager thành công):**
   - Gửi request `POST /api/v1/accounts/procedure-manager` với `wardId = null`.
   - **Kỳ vọng:** Trả về 201 Created, role là `PROCEDURE_MANAGER`.

4. **TC-04 (Bảo vệ trùng lặp tài khoản):**
   - Gửi request tạo với `username` hoặc `email` đã tồn tại của một công dân.
   - **Kỳ vọng:** Trả về 409 Conflict (`AuthErrors.DuplicateAccount`).

5. **TC-05 (Chặn trái quyền):**
   - Dùng token của `FRONT_DESK_OFFICER` hoặc `REGISTERED_CITIZEN` gọi các endpoint trên.
   - **Kỳ vọng:** Trả về 403 Forbidden.

---
*Tài liệu này được gửi trực tiếp cho đội Backend để cập nhật các handlers, validators và controller tương ứng.*
