# Điều tra lỗi 500 khi tải hoặc thay phôi Word

Ngày điều tra: 16/10/2026 (Asia/Saigon).

## Cập nhật sau bản sửa BE và xử lý FE — 16/10/2026

- Đã đối chiếu lại source `UploadFormTemplateDocxCommand.cs`, `FormTemplatesController.cs` và `DocumentFormErrors.cs` tại `E:/wardmate-backend`. Handler hiện bắt exception upload Blob (trừ hủy thao tác), trả `document.blob_upload_failed`. Controller hiện chuyển lỗi này thành **400 `{code,message}`**, không phải 503. Multipart field `file`, endpoint và DTO thành công `{templateId,blobUrl}` giữ nguyên.
- Khi `SaveChangesAsync` thất bại, BE thử xóa blob mới rồi ném lại exception; nhánh này vẫn có thể trả **500 ProblemDetails**. Việc bắt exception không chứng minh cấu hình/kết nối Storage đã được khôi phục hoặc bản BE mới đã triển khai trên Azure.
- FE tại `src/lib/api/formTemplates.ts` đã có ánh xạ mã lỗi Blob từ trước. Lượt này làm rõ thông báo lỗi kho lưu trữ, hướng dẫn liên hệ quản trị viên nếu lặp lại; không hiển thị exception Storage từ `message`. Lỗi 5xx được chuyển thành thông báo tiếng Việt về kết quả chưa xác nhận, hướng dẫn tải lại dữ liệu trước khi thử lại và kèm `traceId` nếu response có.
- Luồng `FormsView.tsx` giữ nguyên tệp và xác nhận thay phôi khi upload lỗi, chỉ đóng modal/báo thành công/invalidate cache khi POST thành công. Bổ sung hồi quy trong `tests/form-templates.spec.ts` cho cả tải mới và thay phôi, với lỗi Blob theo BE hiện tại và 500 theo response đã báo.
- Kết quả kiểm tra lượt sửa FE được ghi tại `docs/PROGRESS.md`. Chưa gọi mutation production hoặc xác minh lại trace gốc trên Azure. Các phần dưới là bằng chứng tại thời điểm điều tra **trước bản sửa BE**, không phải mô tả handler hiện tại.

## Hiện tượng

Request thất bại:

```text
POST /api/v1/form-templates/e254056e-984b-4cb6-9647-e284daf94166/upload-docx
HTTP 500
traceId: 00-8bd42c0e86d2d1e420c8036bf5dd59fe-331b61724d9dc270-00
title: Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.
```

Cả thao tác **Tải lên** lần đầu và **Thay đổi** đều gọi cùng endpoint và cùng command backend. FE giữ file sau lỗi để người dùng thử lại; FE không tự báo thành công.

## Kết luận hiện tại

Lỗi nằm trong DocumentForm backend hoặc hạ tầng của service, không phải lỗi hiển thị của FE. Khả năng cao nhất là DocumentForm không ghi được Azure Blob Storage do một trong các nguyên nhân sau:

1. Secret/env `AzureBlob__ConnectionString` của revision đang chạy bị thiếu, sai hoặc chứa key Storage đã hết hiệu lực.
2. Storage firewall/private endpoint/DNS chặn Container App truy cập tài khoản Storage.
3. Credential không có quyền tạo container hoặc ghi blob vào container `form-templates`.
4. Container cấu hình sai tên. Backend tự gọi `CreateIfNotExistsAsync`, nên quyền chỉ ghi blob nhưng không có quyền tạo container cũng có thể gây lỗi nếu container chưa tồn tại.

Chưa thể khẳng định nguyên nhân con nào trong bốn mục trên vì máy hiện tại không có Azure CLI và response production cố ý không trả exception nội bộ. Cần tra log Container App bằng trace ở trên để kết luận chính xác.

Khả năng thứ hai, thấp hơn, là blob đã upload nhưng `SaveChangesAsync` thất bại khi cập nhật `form_templates.file_docx_url`/`updated_by` trong PostgreSQL. Nếu log chứa `DbUpdateException` hoặc `PostgresException` thì kiểm tra database/migration thay vì Storage.

## Bằng chứng từ source

### FE gửi request đúng hợp đồng

`src/lib/api/formTemplates.ts`:

- Dùng `FormData`.
- Field multipart tên `file`.
- Không tự dựng boundary; browser/Axios dựng `Content-Type` phù hợp.
- URL đúng `/api/v1/form-templates/{templateId}/upload-docx` và Vite chuyển route này tới DocumentForm.

Ảnh Network cho thấy request đã tới backend và backend trả RFC 9110 ProblemDetails. Đây không phải lỗi proxy Vite hoặc lỗi CORS.

### Những trường hợp không phù hợp với HTTP 500 này

`FormTemplatesController.UploadDocx` và `DocxUpload.ReadAsync` quy định:

| Trường hợp | Response dự kiến |
| --- | --- |
| Không có file hoặc file rỗng | 400 |
| Sai đuôi `.docx` | 400 |
| File lớn hơn 20 MiB | 400 |
| DOCX hỏng, macro hoặc package không hợp lệ | 400 |
| Sai `templateId` | 404 |
| Không có role `PROCEDURE_MANAGER` | 403 |
| Không đăng nhập/token sai | 401 |

Request thực tế trả 500, vì vậy đã đi qua các lớp route/quyền/model binding và rơi vào exception chưa được command chuyển thành lỗi nghiệp vụ.

### Điểm có thể ném exception 500

`UploadFormTemplateDocxCommandHandler` thực hiện theo thứ tự:

1. Đọc và kiểm tra cấu trúc DOCX.
2. Đọc template từ PostgreSQL.
3. Tạo đường dẫn blob mới dạng `form-templates/{code}/{guid}_{fileName}`.
4. Gọi `IBlobStorageClient.UploadAsync`.
5. Cập nhật `FileDocxUrl` rồi gọi `SaveChangesAsync`.

`AzureBlobStorageClient.UploadAsync` gọi:

```text
container.CreateIfNotExistsAsync(...)
client.UploadAsync(...)
```

Hai lệnh này không có `try/catch` trong command upload template. `SaveChangesAsync` cũng không có `try/catch`. Exception đi thẳng tới global exception middleware và được đổi thành đúng response 500 chung mà trình duyệt nhận được.

Container mặc định là `form-templates`. Blob path cũng bắt đầu bằng `form-templates/`, tạo cấu trúc lặp `form-templates/form-templates/...` trong URL. Cấu trúc này không làm upload lỗi, nhưng nên được chuẩn hóa sau khi khắc phục sự cố.

## Cách xác nhận chính xác trên Azure

Trong Azure Portal:

1. Mở **Container Apps** → `wardmate-documentform` → **Log stream** hoặc **Logs**.
2. Chọn revision đang nhận traffic và khoảng thời gian ngay lúc upload lỗi.
3. Tìm một trong các giá trị:

```text
8bd42c0e86d2d1e420c8036bf5dd59fe
331b61724d9dc270
e254056e-984b-4cb6-9647-e284daf94166
```

4. Ghi lại `Exception type`, Azure `ErrorCode`, HTTP status của Storage và host Storage; không chép connection string/key vào tài liệu.

Đọc kết quả theo bảng sau:

| Log/exception | Nguyên nhân | Cách xử lý |
| --- | --- | --- |
| `FormatException`, `ArgumentNullException`, “connection string” | Secret/env Blob thiếu hoặc sai | Kiểm tra env `AzureBlob__ConnectionString` có `secretref`, secret tồn tại và revision mới nhận đúng secret |
| `AuthenticationFailed`, `AuthorizationPermissionMismatch`, HTTP 403 từ Blob | Key/SAS/role không hợp lệ hoặc thiếu quyền | Đổi secret đúng key; nếu dùng identity thì cấp `Storage Blob Data Contributor` và source phải khởi tạo client bằng identity |
| `ResourceNotFound`, `ContainerNotFound` | Sai account/container hoặc container chưa tồn tại | Tạo private container `form-templates`, xác nhận `AzureBlob__ContainerName=form-templates` |
| `RequestFailedException` kèm timeout/DNS/network | Firewall/private endpoint/DNS | Cho phép mạng từ Container Apps Environment hoặc cấu hình private DNS/endpoint đúng |
| `DbUpdateException`, `PostgresException` | Blob có thể đã ghi nhưng DB cập nhật URL thất bại | Kiểm tra kết nối DB, schema `form_templates`, migration và chiều dài/constraint của trường |

## Kiểm tra cấu hình an toàn

Không in giá trị secret. Chỉ kiểm tra tên env và secret reference:

```powershell
az containerapp show -g rg-wardmate-prod -n wardmate-documentform `
  --query "properties.template.containers[0].env[?name=='AzureBlob__ConnectionString' || name=='AzureBlob__ContainerName'].{name:name,secretRef:secretRef,value:value}" -o table

az containerapp secret list -g rg-wardmate-prod -n wardmate-documentform `
  --query "[].name" -o table

az containerapp revision list -g rg-wardmate-prod -n wardmate-documentform `
  --query "[].{name:name,active:properties.active,traffic:properties.trafficWeight,created:properties.createdTime}" -o table
```

Máy điều tra hiện tại không cài lệnh `az`, nên các lệnh trên chưa được chạy.

## Retest sau khi sửa hạ tầng

1. Dùng một DOCX hợp lệ, nhỏ hơn 20 MiB, upload vào template chưa có file.
2. Kỳ vọng HTTP 200 với `{templateId, blobUrl}`; reload danh sách thấy **Đã có DOCX**.
3. Tải mẫu xuống và mở bằng Word để xác minh bytes.
4. Chọn **Thay đổi**, xác nhận thay phôi và upload file khác.
5. Kỳ vọng HTTP 200, tải lại phải nhận file mới.
6. Kiểm tra Blob container có blob mới và DB `file_docx_url` trỏ đúng URL.
7. Kiểm tra log không còn `RequestFailedException`/`DbUpdateException`.

## Khuyến nghị sửa backend sau khi khôi phục dịch vụ

- Bắt `RequestFailedException` quanh upload Blob, log `ErrorCode`, status và trace; trả lỗi phụ thuộc có mã ổn định như `document.blob_upload_failed` thay vì 500 chung.
- Bắt `DbUpdateException`; nếu DB lưu thất bại sau upload thì xóa blob mới để tránh file mồ côi.
- Thêm startup/readiness check cho Blob container. `/health` hiện chỉ chứng minh process sống, không chứng minh DB/Blob sẵn sàng.
- Validate cấu hình Blob khi khởi động để revision lỗi không nhận traffic.
- Thêm `[RequestSizeLimit(21 * 1024 * 1024)]` cho endpoint để giới hạn HTTP khớp validation 20 MiB.
- Không ghi connection string, account key, SAS hoặc nội dung cá nhân vào log.

## Phạm vi xác minh

- Đã đọc FE upload, Vite proxy, controller, DOCX validator, command handler, Blob client, entity/EF configuration và lịch sử deploy local.
- File `E:/môtảapi.docx` là DOCX/ZIP hợp lệ và có kích thước 27.481 byte, nhưng đây không phải file `business-plan-template.docx` trong ảnh nên không dùng nó để kết luận file người dùng đã tải lên hợp lệ.
- Chưa truy cập được log Azure theo trace; chưa gọi mutation production và chưa thay đổi FE/BE/hạ tầng.
