# Báo cáo kỹ thuật các vấn đề Backend cần kiểm tra và cấu hình trên Azure
**Ngày lập:** 30/10/2026  
**Dự án:** WardMate (Hệ thống Chuẩn bị & Tiền kiểm Hồ sơ Hành chính Phường/Xã)  
**Người gửi:** Đội ngũ Frontend  
**Gửi tới:** Đội ngũ Backend & Quản trị Hệ thống Cloud (Azure)

---

## 1. Tóm tắt các vấn đề cần xử lý trên Backend

| STT | Vấn đề | HTTP Status / Mã lỗi | Dịch vụ Backend liên quan | Mức độ ưu tiên |
|---|---|---|---|---|
| **1** | Database Chatbot AI chưa cấu hình hoặc chưa chạy migration trên Azure | HTTP 503 `chat.database_unavailable` | `WardMate.Services.AIOCR.API` | **Cao (P1)** |
| **2** | Tiền kiểm AI báo 404 "Giấy tờ không thuộc hồ sơ được phép truy cập" | HTTP 404 `ai.document_not_found` | `WardMate.Services.AIOCR` & `WardMate.Services.DocumentForm` | **Cao (P1)** |
| **3** | Chưa ghi nhận bản ghi phát thông báo trong bảng `notification_deliveries` | Trả về `total: 0` (Mã 200) | `WardMate.Services.AnalyticsSystem` (RabbitMQ) | **Trung bình (P2)** |

---

## 2. Chi tiết kỹ thuật từng vấn đề & Hướng dẫn khắc phục

### 🔴 VẤN ĐỀ 1: Database Chat AI chưa sẵn sàng (HTTP 503 `chat.database_unavailable`)

#### 1. Hiện tượng & Log lỗi thực tế
Khi gọi các endpoint của Chatbot AI và Tiền kiểm AI, máy chủ Azure trả về:
```json
{
  "title": "Database chat chưa sẵn sàng; kiểm tra kết nối và migration.",
  "status": 503,
  "instance": "/api/v1/ai/chat/completions",
  "code": "chat.database_unavailable",
  "traceId": "0HNPMJ0017BG5:00000001"
}
```

#### 2. Nguyên nhân mã nguồn Backend
* **Vị trí file:**
  * `AssistantController.cs` (dòng 9-11):
    ```csharp
    [ApiController, Authorize, EnableRateLimiting("assistant"), ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    public sealed class AssistantController(ICccdExtractionService cccd, IDocumentPreValidationService validator,
        IAuthorizedDocumentSource documents, IChatService chat) : ControllerBase
    ```
  * `ChatService.cs`: Inject `ChatDbContext`.
  * `AssistantExceptionHandler.cs`: Bắt ngoại lệ từ EF Core/Npgsql và quăng lỗi:
    ```csharp
    throw new AiFailure(503, "chat.database_unavailable", "Database chat chưa sẵn sàng; kiểm tra kết nối và migration.");
    ```
* **Nguyên nhân hạ tầng Azure:**
  1. Service `AIOCR` trên Azure App Service / Azure Container Apps chưa được cấu hình chuỗi kết nối PostgreSQL (thiếu biến môi trường `ConnectionStrings__ChatDb` hoặc `ConnectionStrings__DefaultConnection`).
  2. Database PostgreSQL trên Azure chưa được áp dụng migration EF Core để tạo bảng `chat_sessions` và `chat_messages`.
  3. **Lỗi phụ thuộc chéo trong code:** Vì `AssistantController` inject `IChatService chat` trong constructor, nên khi người dùng gọi endpoint **tiền kiểm giấy tờ** (`POST /api/v1/ai-ocr/documents/verify`), DI vẫn cố khởi tạo `ChatDbContext`. Do đó, khi DB chat chưa kết nối, tính năng tiền kiểm giấy tờ OCR cũng bị lỗi 503 lây lan!

#### 3. Hành động đề xuất cho đội ngũ Backend:
1. **Trên Azure:** Bổ sung connection string PostgreSQL cho service `AIOCR` và chạy migration:
   ```bash
   dotnet ef database update --project src/Services/WardMate.Services.AIOCR/WardMate.Services.AIOCR.Infrastructure --startup-project src/Services/WardMate.Services.AIOCR/WardMate.Services.AIOCR.API
   ```
2. **Trong mã nguồn:** Tách `AssistantController` thành 2 controller riêng biệt hoặc dùng Lazy Injection:
   * `ChatAssistantController`: Quản lý `/api/v1/ai/chat/*` (inject `IChatService`).
   * `DocumentOcrController`: Quản lý `/api/v1/ai-ocr/*` (chỉ inject `IDocumentPreValidationService` và `IAuthorizedDocumentSource`).  
   *(Giúp việc bảo trì hoặc sự cố DB Chat không làm tê liệt tính năng tiền kiểm OCR giấy tờ của cán bộ và công dân).*

---

### 🔴 VẤN ĐỀ 2: Tiền kiểm AI báo lỗi 404 `ai.document_not_found`

#### 1. Hiện tượng & Log lỗi thực tế
Khi công dân hoặc cán bộ yêu cầu tiền kiểm tra một giấy tờ vừa tải lên:
```json
{
  "title": "Giấy tờ không thuộc hồ sơ được phép truy cập.",
  "status": 404,
  "instance": "/api/v1/ai-ocr/documents/verify",
  "code": "ai.document_not_found",
  "traceId": "0HNPMJ0017BE2:00000001"
}
```

#### 2. Nguyên nhân mã nguồn Backend
* **Vị trí file:** `AuthorizedDocumentSource.cs` (dòng 12-21):
  ```csharp
  public async Task<ChecklistDocument> Download(Guid applicationId, Guid documentId, string bearer, CancellationToken ct)
  {
      if (!Uri.TryCreate(config["Services:DocumentForm:BaseUrl"], UriKind.Absolute, out var root) ...)
          throw new AiFailure(503, "ai.document_service_not_configured", "Chưa cấu hình DocumentForm.");

      // AIOCR gọi sang DocumentForm service
      using var list = Request(root, $"api/v1/applications/{applicationId}/supporting-documents", bearer);
      using var listed = await http.SendAsync(list, ct); Check(listed);
      var documents = await listed.Content.ReadFromJsonAsync<List<DocumentLink>>(cancellationToken: ct);
      
      // Kiểm tra sự tồn tại của documentId
      if (documents is null || !documents.Any(x => x.Id == documentId && x.ApplicationId == applicationId))
          throw new AiFailure(404, "ai.document_not_found", "Giấy tờ không thuộc hồ sơ được phép truy cập.");
  ```
* **Các khả năng gây lỗi 404:**
  1. **Cấu hình liên lạc nội bộ trên Azure:** Giá trị cấu hình `Services:DocumentForm:BaseUrl` trong service AIOCR có đang trỏ đúng URL nội bộ của DocumentForm trên Azure không? (Nếu trỏ sai hoặc bị timeout thì danh sách `documents` trả về rỗng).
  2. **Trường hợp kiểm tra bản khai (`submissions`):** Hiện tại `AuthorizedDocumentSource` chỉ gọi `api/v1/applications/{applicationId}/supporting-documents`. Nếu tệp cần kiểm tra là bản khai nộp (mẫu tờ khai DOCX nộp tại `submissions`), DocumentForm không trả về trong danh sách supporting documents, dẫn đến bị văng lỗi 404 `ai.document_not_found`.
  3. **Độ trễ commit:** Khi công dân vừa upload file, nếu DocumentForm service chưa commit transaction vào cơ sở dữ liệu mà request verify đã tới, request đọc từ AIOCR sẽ không thấy bản ghi.

#### 3. Hành động đề xuất cho đội ngũ Backend:
1. Kiểm tra biến môi trường `Services__DocumentForm__BaseUrl` trên Azure của service AIOCR.
2. Xác minh xem endpoint `GET api/v1/applications/{applicationId}/supporting-documents` khi được gọi bằng Bearer token của user có trả về đúng mảng các file đính kèm vừa tải lên không.
3. Nếu muốn hỗ trợ tiền kiểm cả bản khai nộp (`submissions`), bổ sung logic fallback gọi sang `api/v1/citizen/submissions/{submissionId}` hoặc `api/v1/officer/submissions/{submissionId}`.

---

### 🟡 VẤN ĐỀ 3: Broker RabbitMQ chưa ghi nhận sự kiện phát thông báo (`NotificationDeliveries`)

#### 1. Hiện tượng
Trang Quản trị phát thông báo (`/admin` -> Phát thông báo) kết nối thành công tới `GET /api/v1/admin/notification-deliveries` (Mã HTTP 200 OK), nhưng danh sách luôn trả về `total: 0` và mảng rỗng `items: []`.

#### 2. Nguyên nhân
* Cơ chế ghi nhận delivery vào bảng `notification_deliveries` của service `AnalyticsSystem` phụ thuộc vào các sự kiện nghiệp vụ (khi công dân nộp hồ sơ, cán bộ tiếp nhận, phê duyệt, v.v.) được bắn qua RabbitMQ Event Bus.
* Hiện tại trên Azure, broker RabbitMQ chưa được bật, hoặc các consumers chưa đăng ký lắng nghe routing key, nên chưa có sự kiện nào được ghi nhận vào cơ sở dữ liệu.

#### 3. Hành động đề xuất cho đội ngũ Backend:
1. Kích hoạt và kiểm tra kết nối RabbitMQ Broker trên môi trường Azure.
2. Kiểm tra xem sự kiện `ApplicationSubmittedEvent`, `ApplicationStatusChangedEvent` có được publish và consumer trong AnalyticsSystem có ghi nhận thành công bản ghi delivery không.

---

## 3. Các cải tiến và thống nhất nghiệp vụ phía Frontend (Đã hoàn tất)

1. **Về nút "Tiền kiểm AI" cho Công dân:**
   * **Thống nhất:** Nút `✨ Tiền kiểm AI` **chỉ hiển thị khi hồ sơ đang ở trạng thái Chuẩn bị / Chỉnh sửa (`editable === true`)**.
   * **Lý do:** Khi công dân đã chính thức nộp hồ sơ (`Submitted`, `Approved`, `Completed`), hồ sơ ở trạng thái chỉ đọc và công dân không thể thay thế file được nữa. Việc ẩn nút tiền kiểm sau khi nộp giúp giao diện gọn gàng, tránh gây hiểu lầm và tiết kiệm chi phí gọi mô hình AI.
2. **Về nút "Tiền kiểm AI" cho Cán bộ Một cửa (Officer):**
   * Cán bộ Một cửa khi thẩm định hồ sơ (`Submitted`, `UnderReview`) vẫn có nút `✨ Tiền kiểm AI` để rà soát chất lượng tệp và phát hiện sai sót trước khi phê duyệt.
3. **Cơ chế Fallback thông minh cho Chatbot AI:**
   * Frontend đã bổ sung cơ chế tự động chuyển sang chế độ hướng dẫn cẩm nang nghiệp vụ công chuẩn mực khi gặp lỗi 503 `chat.database_unavailable`, đảm bảo người dùng và cán bộ vẫn được hỗ trợ liên tục mà không gặp lỗi gián đoạn.

