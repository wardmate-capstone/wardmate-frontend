# Yêu cầu BE: AIOCR trên Azure không lên (503 "App port is not ready")

Ngày phát hiện: 24/10/2026. Người gửi: FE WardMate.
Mức độ: **cao**. Toàn bộ chức năng AI trên Azure đang lỗi, gồm cả chức năng cũ (chatbot, quét CCCD), không riêng TASK-28/29.

## 1. Hiện tượng

Gọi qua Gateway Azure (`https://wardmate-gateway.blackmeadow-a2f12767.japaneast.azurecontainerapps.io`), không gửi token. Thời điểm kiểm tra cuối: 2026-10-24 15:52 UTC.

| Request | Kết quả | Thời gian |
|---|---|---|
| `GET /health` (Gateway) | 200 `Healthy` | ~2,5 s |
| `POST /api/v1/ai/chat/completions` | **503** `{"error":"App port is not ready"}` | ~32 s |
| `POST /api/v1/ai-ocr/cccd/extract` | **503** `{"error":"App port is not ready"}` | ~31 s |
| `GET /api/v1/ai/knowledge/index-status` | **503** `{"error":"App port is not ready"}` | ~31 s |
| `GET /api/v1/ai/chat/sessions` | **503** `{"error":"App port is not ready"}` | ~31 s |

Đã kiểm tra lặp lại nhiều lần trong khoảng 1 giờ, kết quả giống nhau. Gateway và Procedure Catalog vẫn trả 200, nên mạng và Gateway bình thường.

**Kết luận:** Gateway không kết nối được tới container AIOCR. Container không mở được cổng ứng dụng: có thể app dừng ngay khi khởi động, khởi động lại liên tục, hoặc revision mới chưa sẵn sàng.

**Kỳ vọng sau khi sửa:** các request trên khi không có token phải trả **401**, chứng tỏ route tồn tại và app đang chạy.

Cách tái hiện:

```bash
G=https://wardmate-gateway.blackmeadow-a2f12767.japaneast.azurecontainerapps.io
curl -i --max-time 90 "$G/api/v1/ai/chat/sessions"
curl -i --max-time 90 "$G/api/v1/ai/knowledge/index-status"
```

## 2. Nguyên nhân nghi ngờ

FE không có quyền xem log Azure, nên các mục dưới đây là suy đoán từ source BE, **chưa xác nhận**. Các commit liên quan đều đã có trên `origin/main`, `origin/kha` và `origin/deploy`.

1. **Thiếu hoặc sai `Jwt:Key`.** Commit `0423359` (23/10, "require signing key at startup") khiến app dừng ngay khi khởi động nếu khóa ngắn hơn 32 byte. Xem `AIOCR.API/AssistantRegistration.cs:25-26`:
   `throw new InvalidOperationException("Cần khóa Jwt:Key ít nhất 32 byte, giống IAM.")`.
   - Trên Azure cần biến `Jwt__Key` có giá trị **giống IAM**, cùng `Jwt__Issuer` và `Jwt__Audience` khớp IAM. Mặc định trong code là `wardmate` và `wardmate-client`.
2. **`Database:AutoMigrate=true` nhưng thiếu `ConnectionStrings__AiOcrDatabase`.** Khi đó app dừng ngay khi khởi động (`AIOCR.API/Program.cs:24-26`). Nếu có chuỗi kết nối mà migration lỗi (ví dụ DB chưa sẵn sàng), app cũng dừng.
3. **Thiếu migration TASK-28/29.** Nếu không bật AutoMigrate thì cần chạy tay theo đúng thứ tự `docs/api-guide.md`:
   - `docs/sql/iam-knowledge-permission.sql` trên DB IAM.
   - `docs/sql/aiocr-knowledge-base.sql`, rồi `docs/sql/aiocr-knowledge-retrieval.sql` trên DB AIOCR.
   - Thiếu các bước này thường làm API lỗi 503 `knowledge.database_unavailable` chứ không chặn app khởi động. Tuy vậy, worker `KnowledgeIndexingWorker` mới cũng cần được kiểm tra trong log.
4. **Cấu hình mới của TASK-28/29:** `Services__ProcedureCatalog__BaseUrl` và `Iam__BaseUrl` phải trỏ đúng URL Azure, không dùng `localhost` hay tên service của Compose.
5. **Cấu hình ingress hoặc target port** của Container App không khớp cổng app lắng nghe. Compose dùng 8080.

## 3. Đề nghị BE kiểm tra

1. Azure Portal → Container App AIOCR → **Revisions**: revision đang active có trạng thái Running/Healthy không, và số lần restart.
2. **Log stream / Console logs** của revision đó: tìm exception lúc khởi động, ví dụ `InvalidOperationException` (Jwt:Key, AutoMigrate), lỗi kết nối Npgsql, lỗi migration.
3. Đối chiếu biến môi trường của Container App: `Jwt__Key`, `Jwt__Issuer`, `Jwt__Audience`, `ConnectionStrings__AiOcrDatabase`, `Database__AutoMigrate`, `Iam__BaseUrl`, `Services__ProcedureCatalog__BaseUrl`, `Gemini__Key`, và hai công tắc `Knowledge__EmbeddingEnabled` / `Knowledge__RagEnabled` (giữ `false` cho tới khi nhập tài liệu xong).
4. Xác nhận đã chạy 3 file SQL ở mục 2.3. Xác nhận Gateway Azure đã có route `/api/v1/ai/knowledge/{**catch-all}` → `ai-ocr` (`appsettings.Production.json`).
5. Sau khi app lên: gọi lại các lệnh ở mục 1, kỳ vọng nhận **401**. Báo FE để FE kiểm tra với tài khoản thật.

## 4. Ảnh hưởng và trạng thái FE

- **Hiện tại trên Azure:** chatbot, quét CCCD và màn "Dữ liệu kiến thức AI" đều báo "Dịch vụ AI tạm thời chưa phản hồi (HTTP 503)". FE không giả lập dữ liệu thay thế.
- **FE đã làm theo hợp đồng TASK-28/29** (đọc từ source và `docs/api-guide.md` của BE), mới **kiểm thử bằng mock**, chưa tích hợp thật:
  - Chat hiển thị `citations` / `grounded` / `relatedProcedures`, không hiện `score` cho công dân; có lịch sử phiên.
  - Màn quản lý kho kiến thức cho `knowledge.manage`: danh sách, chi tiết, thêm văn bản/FAQ, tải PDF, sửa, bật/tắt, chia đoạn lại, reindex, đồng bộ thủ tục, index-status, tìm thử.
- **Câu hỏi thêm cho BE:**
  - Chat đang gửi `wardCode: "WARD_001"` cố định. BE muốn FE gửi mã phường nào (lấy từ đâu), hay giữ nguyên vì kho kiến thức không lọc theo phường?
  - Khi nào bật `EmbeddingEnabled` / `RagEnabled` trên Azure để FE kiểm tra chat có dẫn nguồn với dữ liệu thật?
