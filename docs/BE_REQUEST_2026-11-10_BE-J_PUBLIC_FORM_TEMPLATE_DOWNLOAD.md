# BE-J — API công khai tải và xem trước phôi mẫu đơn, tờ khai (không cần đăng nhập)

| | |
|---|---|
| Ngày | 10/11/2026 |
| Service | **DocumentForm** (gateway **không cần sửa**) |
| Migration / SQL | Không |
| Mức độ | Trung bình: người dân chưa đăng nhập không tải và không xem được mẫu đơn ở trang thủ tục công khai |
| FE | **Đã code sẵn**, chỉ chờ API |
| **Trạng thái (11/11/2026)** | ✅ BE đã làm (nhánh `kha`, commit `68a508d`) và deploy `documentform-20261110-03`. FE kiểm trên Azure: tải ẩn danh 200 (DOCX hợp lệ), GUID không tồn tại 404, API chi tiết cũ vẫn 401. FE sửa thêm: đọc tên file từ `filename*` (UTF-8) để tên file tải về giữ đúng tiếng Việt |

---

## 1. Yêu cầu nghiệp vụ

Trang chi tiết thủ tục công khai (`/thu-tuc/{id}`) hiển thị bảng **"Thành phần hồ sơ"** giống Cổng DVC Quốc gia. Cột **"Mẫu đơn, tờ khai"** của mỗi giấy tờ có 2 nút:

| Nút | Ai dùng được |
|---|---|
| **Tải mẫu** (tải phôi `.docx` trống) | **Mọi người, không cần đăng nhập**, như Cổng DVC |
| **Xem** (xem trước nội dung) | **Mọi người, không cần đăng nhập** |

Vì sao xem trước cũng mở công khai (chủ dự án đã chốt):

- Xem trước trên FE thực chất là **tải file `.docx` rồi hiển thị trên trình duyệt** (thư viện `docx-preview`). Bắt đăng nhập để xem nhưng cho tải tự do thì không bảo vệ được gì: tải về mở bằng Word là xem được y hệt.
- Phôi mẫu trống là mẫu Nhà nước công bố, **không có dữ liệu cá nhân**. Cổng DVC Quốc gia cho mọi người xem và tải.
- **BE chỉ cần một API tải công khai** (mục 3). FE dùng chính API này cho cả Tải và Xem, không cần API xem trước riêng.

## 2. Hiện trạng

`src/Services/WardMate.Services.DocumentForm/WardMate.Services.DocumentForm.API/Controllers/FormTemplatesController.cs`:

- Cả controller gắn `[Authorize(Policy = "DocumentUser")]` (dòng 12).
- `GET /api/v1/form-templates/{templateId}` và `GET /api/v1/form-templates/{templateId}/download-docx` (dòng 134) đều **bắt đăng nhập**.

Kiểm tra trên Azure ngày 10/11/2026, không gửi token, với mẫu `d6b2620c-8b4c-4558-acc6-78a13c7ffc56` của một thủ tục đang công khai:

```
GET /api/v1/form-templates/d6b2620c-…                → 401
GET /api/v1/form-templates/d6b2620c-…/download-docx  → 401
```

Trên FE, khách bấm xem/tải mẫu đều không dùng được (trước đây hiện lỗi "Bạn cần đăng nhập bằng token hợp lệ.").

## 3. Đề nghị: API mới

```
GET /api/v1/public/form-templates/{templateId}/download-docx
[AllowAnonymous]
```

- **Gateway đã định tuyến sẵn** `/api/v1/public/{**catch-all}` sang `document-form` (route `document-public-v1` trong `src/Gateways/WardMate.YarpGateway/appsettings*.json`). Không cần sửa gateway.
- Đặt trong controller công khai riêng, ví dụ `PublicFormTemplatesController` route `api/v1/public/form-templates`, giống `QrLookupController`.
- Tái dùng `DownloadFormTemplateDocxQuery`, nhưng **thêm điều kiện cho bản công khai**:
  - mẫu tồn tại **và `IsActive = true`**. Handler hiện tại (`Application/Queries/DownloadFormTemplateDocxQuery.cs` dòng 35–36) **không kiểm tra `IsActive`**, nên bản công khai phải tự chặn;
  - có `FileDocxUrl`.
  - Không thoả thì trả **404** `document.template_not_found` (không phân biệt "đã ẩn" hay "không tồn tại", để khỏi lộ thông tin).
- **Giới hạn tần suất:** gắn `[EnableRateLimiting("public-qr")]` (30 lần/phút/IP, đã có trong `Program.cs`), hoặc tạo policy riêng `public-forms` (đề nghị 60/phút/IP). Vượt thì **429**, `Retry-After: 60`, `code` dạng `*.rate_limited`.
- Response giống API hiện tại: `File(stream, "application/vnd.openxmlformats-officedocument.wordprocessingml.document", fileName)`, có header `Content-Disposition` chứa tên file để FE đặt tên khi lưu.
- **Không** mở công khai `GET /api/v1/form-templates/{id}` (chi tiết) và các API quản trị khác. Chỉ mở đúng một API tải file của mẫu đang hoạt động; FE dùng nó cho cả Tải và Xem.

### Tuỳ chọn (nếu muốn chặt hơn)

Chỉ phục vụ mẫu đang được **một thủ tục công khai** tham chiếu (`formDefinitions[].formTemplateId` của thủ tục `isActive = true` ở Catalog). DocumentForm không giữ dữ liệu Catalog, nên phương án này cần gọi Catalog hoặc đồng bộ danh sách. Nếu thấy phức tạp, **chỉ kiểm `IsActive` của mẫu là đủ**: phôi mẫu trống không chứa dữ liệu cá nhân.

## 4. FE đã làm

- `src/lib/api/formTemplates.ts` → `downloadPublicFormTemplateDocx(templateId)` gọi đúng `GET /api/v1/public/form-templates/{templateId}/download-docx`, không gửi token.
- `src/components/forms/ProcedureFormLink.tsx`: khách bấm **Tải mẫu** hoặc **Xem** đều gọi API công khai; **Xem** hiển thị file tải về ngay trên trang. Người đã đăng nhập vẫn dùng API cũ có token.
- Khi API công khai trả **401/403/404** (chưa deploy, hoặc mẫu ẩn), FE hiện hộp "Cần đăng nhập" ngắn gọn kèm nút **Đăng nhập**, thay vì báo lỗi kỹ thuật. Gặp **429** thì báo "… quá nhiều lần. Vui lòng thử lại sau 1 phút."
- Mỗi lần **Xem** là một lần gọi API tải, nên tính chung vào giới hạn tần suất. Đề nghị policy `public-forms` **60 lần/phút/IP** để người dân xem vài mẫu liên tiếp không bị chặn.

## 5. Nghiệm thu

| # | Thao tác (không đăng nhập) | Kỳ vọng |
|---|---|---|
| 1 | `GET /api/v1/public/form-templates/{id mẫu đang hoạt động}/download-docx` | 200, file `.docx`, có `Content-Disposition` |
| 2 | Cùng API với mẫu đã tạm ngừng (`IsActive = false`) | 404 |
| 3 | Cùng API với GUID không tồn tại / mẫu chưa có file | 404 |
| 4 | Gọi quá giới hạn trong 1 phút từ một IP | 429, `Retry-After: 60` |
| 5 | `GET /api/v1/form-templates/{id}` không token | Vẫn 401 (không mở rộng phạm vi) |
| 6 | Trang `/thu-tuc/{id}` khi chưa đăng nhập, bấm **Tải mẫu** | Trình duyệt tải file về |
| 7 | Trang `/thu-tuc/{id}` khi chưa đăng nhập, bấm **Xem** | Cửa sổ xem trước hiển thị nội dung mẫu, không hỏi đăng nhập |

Báo lại FE kèm tag image sau khi deploy.
