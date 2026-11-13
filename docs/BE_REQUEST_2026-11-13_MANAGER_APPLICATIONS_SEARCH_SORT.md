# Đề nghị BE — Thêm `search` và `sort` cho danh sách điều phối hồ sơ

| | |
|---|---|
| Ngày | 13/11/2026 |
| Mức độ | **Trung bình**: hiện chạy được nhưng chậm dần khi số hồ sơ của phường tăng |
| API | `GET /api/v1/manager/applications` (Manager, policy `workflow.dispatch.read`) |
| Service cần sửa | **ApplicationWorkflow** |
| Service KHÔNG cần sửa | IAM, Catalog, Frontend (FE sẽ chuyển sang dùng tham số mới sau khi BE deploy) |
| Migration / SQL | Không bắt buộc. Nên có index nếu bảng `applications` lớn (xem mục 5) |

---

## 1. Hiện trạng

Trang **Điều phối hồ sơ** của Manager gọi `GET /api/v1/manager/applications?page=&pageSize=`. API này hiện:

- chỉ nhận `page` và `pageSize` (1–100);
- luôn sắp theo **`CreatedAt` tăng dần (cũ nhất trước)**;
- không có tham số tìm kiếm hoặc lọc.

Nguồn (`origin/main`):

- `src/Services/WardMate.Services.ApplicationWorkflow/WardMate.Services.ApplicationWorkflow.API/Controllers/ManagerDispatchController.cs`
  ```csharp
  [HttpGet]
  public Task<IActionResult> List(CancellationToken ct, [FromQuery] int page = 1, [FromQuery] int pageSize = 20) => ...
  ```
- `.../ApplicationWorkflow.Infrastructure/DispatchService.cs`, hàm `List`:
  ```csharp
  var items = await q.OrderBy(x => x.CreatedAt).ThenBy(x => x.Id).Skip((page - 1) * pageSize).Take(pageSize)
  ```

## 2. Vấn đề và cách FE đang tạm xử lý

Người dùng yêu cầu: **hồ sơ mới nhất lên đầu** và có **ô tìm kiếm** trên trang Điều phối.

FE đang tạm làm như sau (`src/lib/api/staffing.ts`):

| Nhu cầu | Cách FE làm tạm | Chi phí |
|---|---|---|
| Mới nhất lên đầu (`applicationsNewestFirst`) | Gọi trang 1 (100 mục) để biết `total`, tính khoảng cần xem, gọi thêm khối 100 mục chứa khoảng đó rồi đảo ngược | 1–3 request mỗi lần xem trang |
| Tìm kiếm (`searchApplications`) | Tải **toàn bộ** hồ sơ của phường (100 mục/request), lọc trên trình duyệt theo mã hồ sơ, tên thủ tục, tên cán bộ, rồi tự phân trang | ⌈tổng / 100⌉ request **mỗi lần đổi từ khóa hoặc đổi trang** |

Với vài chục đến vài trăm hồ sơ thì chấp nhận được. Khi một phường có hàng nghìn hồ sơ (gồm cả hồ sơ đã hủy, nháp…), mỗi lần tìm phải tải hàng chục request, chậm và tốn băng thông. Ngoài ra, nếu có hồ sơ được tạo giữa các request thì kết quả có thể lệch một mục.

## 3. Đề nghị hợp đồng API

Giữ nguyên route, method, quyền và cấu trúc response hiện tại. Chỉ **thêm tham số query, đều tùy chọn**. Nếu không truyền, hành vi giữ như cũ, để không phá client đang dùng.

```
GET /api/v1/manager/applications?page=1&pageSize=20&search=khai%20tu&sort=createdAt_desc
```

| Tham số | Kiểu | Mặc định | Ý nghĩa |
|---|---|---|---|
| `search` | string, tối đa 200 ký tự, trim | không lọc | Tìm **không phân biệt hoa thường và dấu tiếng Việt** trong `applicationCode`, `procedureTitle`, `assignedOfficerName`. Nhiều từ cách nhau bởi khoảng trắng thì **mỗi từ đều phải khớp** (AND) |
| `sort` | enum | `createdAt_asc` (như hiện nay) | `createdAt_desc` \| `createdAt_asc`. Luôn kèm `ThenBy(Id)` cùng chiều để phân trang ổn định |
| `status` *(nên có)* | string | không lọc | Lọc theo trạng thái Workflow, ví dụ `UNDER_REVIEW`, `SUBMITTED` |

Response giữ nguyên dạng hiện tại: `{ items, page, pageSize, total }`. `total` là **số hồ sơ sau khi lọc**.

Lỗi:

- `search` dài quá 200 ký tự hoặc `sort` / `status` không hợp lệ: **400** `dispatch.invalid_query` (ProblemDetails như các lỗi `dispatch.*` khác).
- Các mã còn lại giữ nguyên: 401/403 `dispatch.forbidden`, 400 `dispatch.invalid_page`.

### Ví dụ

```
GET /api/v1/manager/applications?page=1&pageSize=10&sort=createdAt_desc
GET /api/v1/manager/applications?page=1&pageSize=10&sort=createdAt_desc&search=HS-20261112
GET /api/v1/manager/applications?page=2&pageSize=10&sort=createdAt_desc&search=dang%20ky%20khai%20tu&status=UNDER_REVIEW
```

## 4. Gợi ý cài đặt (tham khảo)

Trong `DispatchService.List`:

```csharp
var q = Scope(actor).AsNoTracking();
if (!string.IsNullOrWhiteSpace(status)) q = q.Where(x => x.Status == status);
foreach (var word in Words(search))   // tách từ, đã bỏ dấu + lowercase
    q = q.Where(x => EF.Functions.ILike(
        Unaccent((x.ApplicationCode ?? "") + " " + x.ProcedureTitle + " " + (x.AssignedOfficerName ?? "")),
        "%" + word + "%"));
var total = await q.CountAsync(ct);
q = sort == "createdAt_desc" ? q.OrderByDescending(x => x.CreatedAt).ThenByDescending(x => x.Id)
                             : q.OrderBy(x => x.CreatedAt).ThenBy(x => x.Id);
```

- Bỏ dấu tiếng Việt: dùng extension `unaccent` của PostgreSQL (map hàm qua `HasDbFunction`). Nếu chưa muốn bật extension thì có thể lưu thêm cột chuẩn hóa sẵn (không dấu, chữ thường). Nhớ xử lý riêng `đ/Đ` → `d`, vì `unaccent` mặc định đã có nhưng cột tự chuẩn hóa thì cần làm tay.
- Escape `%` và `_` trong từ khóa trước khi đưa vào `ILIKE`.
- `assignedOfficerName` là snapshot đã lưu trong bảng, không cần gọi IAM.

## 5. Hiệu năng (khuyến nghị)

- Index cho sắp xếp và lọc theo phường: `(ward_code, created_at DESC, id DESC)`.
- Nếu dữ liệu lớn: index trigram (`pg_trgm`) trên cột/biểu thức tìm kiếm đã chuẩn hóa.

## 6. FE sẽ làm gì sau khi BE deploy

1. `staffing.ts`: thay `applicationsNewestFirst` và `searchApplications` bằng một hàm gọi thẳng API với `sort=createdAt_desc&search=...` (1 request mỗi trang).
2. Có thể thêm bộ lọc trạng thái trên trang Điều phối nếu BE hỗ trợ `status`.
3. Cập nhật test `tests/dispatch-order.spec.ts` để kiểm tra query gửi lên.

## 7. Nghiệm thu

1. Không truyền tham số mới: kết quả giống hệt hiện nay (cũ nhất trước).
2. `sort=createdAt_desc`: trang 1 là hồ sơ mới nhất; ghép các trang lại thì không trùng và không thiếu.
3. `search=khai tu` khớp "Thủ tục đăng ký khai tử"; `search=HS-20261112` khớp đúng các mã đó; `search=Phường 01` khớp hồ sơ do cán bộ có tên đó phụ trách.
4. `total` bằng số hồ sơ sau khi lọc; Manager phường khác không thấy hồ sơ phường này.
5. Từ khóa có `%` hoặc `_` không làm lọc sai.
6. Swagger hiển thị đủ tham số mới.
