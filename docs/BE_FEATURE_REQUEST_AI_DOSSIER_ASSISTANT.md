# Yêu cầu Phát triển Tính năng Backend: AI Trợ lý Thẩm định Hồ sơ & Hỗ trợ Phân tích Bản khai DOCX (AI-OFFICER-ASSIST-01)

**Ngày lập:** 31/10/2026  
**Dự án:** WardMate — Hệ thống Chuẩn bị & Tiền kiểm Hồ sơ Hành chính Phường/Xã  
**Người lập:** Đội ngũ Frontend WardMate  
**Gửi tới:** Đội ngũ Backend (`WardMate.Services.AIOCR`, `WardMate.Services.DocumentForm`, `WardMate.Services.Workflow`) & DevOps Cloud (Azure)  
**Mức độ ưu tiên:** **Cao (P1)** — Tính năng trọng tâm nâng cao chất lượng thẩm định tại bộ phận Một cửa

---

## 1. Tóm tắt nhu cầu nghiệp vụ & Đặt vấn đề

### 1.1. Hiện trạng thực tế tại bộ phận Một cửa
1. **Người dân nộp tờ khai bằng file Word (.docx):**
   * Theo quy trình nghiệp vụ số hóa, người dân có thể tải biểu mẫu chuẩn về máy tính, điền thông tin và tải tệp `.docx` đã điền lên hệ thống (`CitizenSubmissionsController`).
2. **Hạn chế của AI OCR hiện tại:**
   * Dịch vụ `WardMate.Services.AIOCR` (`GeminiAssistant.cs`) hiện tại chỉ chấp nhận 3 định dạng media đa phương thức: `image/png`, `image/jpeg` và `application/pdf`. Khi kiểm tra file `.docx`, hệ thống từ chối với lỗi HTTP 415 `ai.unsupported_file`.
   * Hơn nữa, `AuthorizedDocumentSource.cs` chỉ gọi sang `supporting-documents` (tài liệu đính kèm), không hề truy vấn tệp bản khai `submissions`.
3. **Nỗi đau (Pain Points) của Cán bộ thụ lý:**
   * Cán bộ phải tải file DOCX về máy tính cá nhân, mở Word đọc từng dòng và đối chiếu thủ công bằng mắt với ảnh chụp CCCD/giấy tờ kèm theo.
   * Dễ xảy ra sai sót: Người dân gõ nhầm số CCCD, sai lệch ngày tháng năm sinh hoặc địa chỉ thường trú so với giấy tờ đính kèm.
   * Cán bộ mất nhiều thời gian gõ đi gõ lại các câu nhận xét yêu cầu chỉnh sửa lặp đi lặp lại.

### 1.2. Mục tiêu giải pháp đề xuất
* Xây dựng module **"AI Trợ lý thẩm định hồ sơ Một cửa" (`AI-OFFICER-ASSIST-01`)**:
  1. Backend tự động trích xuất nội dung văn bản từ tệp Word (.docx) của bản khai.
  2. Mô hình AI tổng hợp thông tin từ bản khai DOCX và giấy tờ scan/chụp (CCCD, Xác nhận cư trú...).
  3. Tự động **đối chiếu chéo (Cross-check)** để phát hiện ngay mâu thuẫn (ví dụ: Tên trong đơn khác tên trên CCCD, thiếu ngày cấp...).
  4. Đưa ra **Ý kiến tham khảo hành chính** kèm sẵn nội dung nhận xét đề xuất (Cán bộ chỉ cần 1 click để đưa vào ô nhận xét/yêu cầu bổ sung).

---

## 2. Phân tích Kỹ thuật: Vì sao cần xử lý tại Backend thay vì Frontend?

| Tiêu chí | Xử lý tại Frontend (Client-side) | Xử lý tại Backend (Server-side) — **Khuyến nghị chuẩn** |
|---|---|---|
| **Độ chính xác bóc tách DOCX** | Dùng JS parse thô sơ (như `mammoth.js`) thường xuyên mất cấu trúc bảng biểu phức tạp, mất header/footer, mất form fields của biểu mẫu nhà nước. | Dùng thư viện chuẩn .NET (`DocumentFormat.OpenXml` của Microsoft): Đọc chính xác 100% từng Table, Cell, Paragraph, Custom XML Properties và Form Controls. |
| **Bảo mật & An toàn thông tin** | Nguy cơ rò rỉ dữ liệu hành chính nhạy cảm của người dân vào trình duyệt; khó kiểm soát API Key AI nếu gọi trực tiếp từ client. | Tuân thủ tuyệt đối quy trình nội bộ: Token IAM HttpOnly, phân quyền RBAC (`DocumentOfficer`), mã hóa dữ liệu trên server. API Key AI được giữ kín trong Key Vault. |
| **Đối soát chéo (Cross-check)** | FE phải tải toàn bộ file đính kèm lớn (PDF/ảnh nhiều MB) về trình duyệt rồi nén gửi lại, gây đơ lag máy cán bộ và tốn băng thông. | Microservice AIOCR trên Azure tải trực tiếp qua mạng nội bộ băng thông cao giữa các service (`DocumentForm` -> `AIOCR`), xử lý ngầm nhanh chóng. |
| **Lưu vết pháp lý & Kiểm toán (Audit Log)** | Không có bằng chứng pháp lý lưu lại trên cơ sở dữ liệu nếu người dùng refresh trang. | Backend lưu vết kết quả tiền kiểm vào bảng `dossier_ai_reviews` / audit log: ngày giờ phân tích, model phiên bản nào, cán bộ nào đã duyệt ý kiến. |

---

## 3. Kiến trúc Triển khai Đề xuất trên Backend (.NET Core)

### 3.1. Thư viện trích xuất DOCX đề xuất: `DocumentFormat.OpenXml`
* **Ưu điểm:** Thư viện chính thức của Microsoft, mã nguồn mở, siêu nhẹ, hiệu năng cực cao, không phụ thuộc Microsoft Office (interop-free), tương thích 100% Linux Container trên Azure.
* **Cài đặt tại `WardMate.Services.AIOCR.Infrastructure`:**
  ```bash
  dotnet add package DocumentFormat.OpenXml --version 3.1.1
  ```
* **Mẫu trích xuất văn bản (Code tham khảo):**
  ```csharp
  using DocumentFormat.OpenXml.Packaging;
  using DocumentFormat.OpenXml.Wordprocessing;
  using System.Text;

  public static class DocxTextExtractor
  {
      public static string ExtractText(Stream docxStream)
      {
          using var doc = WordprocessingDocument.Open(docxStream, false);
          var body = doc.MainDocumentPart?.Document.Body;
          if (body is null) return string.Empty;

          var sb = new StringBuilder();
          foreach (var element in body.Elements())
          {
              if (element is Paragraph p)
              {
                  var text = p.InnerText?.Trim();
                  if (!string.IsNullOrEmpty(text)) sb.AppendLine(text);
              }
              else if (element is Table table)
              {
                  foreach (var row in table.Elements<TableRow>())
                  {
                      var cells = row.Elements<TableCell>().Select(c => c.InnerText?.Trim());
                      sb.AppendLine(string.Join(" | ", cells));
                  }
              }
          }
          return sb.ToString();
      }
  }
  ```

### 3.2. Cấu trúc Prompt thẩm định cho Gemini
Backend gửi vào Gemini Model (`gemini-2.5-flash` hoặc `gemini-1.5-pro`) cấu trúc System Instruction chuyên môn hành chính Một cửa:
* **Role:** Cán bộ thẩm định hồ sơ tư pháp - hành chính Một cửa cấp xã/phường tại Việt Nam.
* **Input:**
  - Dữ liệu văn bản trích xuất từ tờ khai DOCX.
  - Kết quả OCR CCCD hoặc hình ảnh/PDF tài liệu đính kèm.
* **Nhiệm vụ:**
  1. Trích xuất thông tin người đứng đơn (Họ tên, ngày sinh, số định danh CCCD, nơi cư trú, quan hệ...).
  2. Đối chiếu chéo (Cross-check): Kiểm tra độ khớp giữa bản khai và giấy tờ chứng thực.
  3. Liệt kê các lỗi/nguy cơ (nếu có): Bỏ trống trường bắt buộc, sai định dạng ngày cấp, sai lệch số CCCD...
  4. Gợi ý 1 đoạn văn bản nhận xét hành chính chuẩn quy cách (ví dụ: *"Hồ sơ hợp lệ, đề xuất tiếp nhận tại quầy"* hoặc *"Đề nghị công dân bổ sung: Giấy xác nhận tình trạng hôn nhân do UBND Phường cũ cấp theo quy định"*).

---

## 4. Đặc tả Hợp đồng API (API Specification)

### 4.1. Endpoint: Trợ lý AI Thẩm định Toàn bộ Bộ hồ sơ
* **Phương thức:** `POST`
* **Đường dẫn:** `/api/v1/ai-ocr/applications/{applicationId}/dossier-assist`
* **Phân quyền:** Cán bộ phụ trách hồ sơ (`isAssignedOfficer`) hoặc Quản lý cấp xã (`Manager`).
* **Headers:** `Authorization: Bearer <access_token>`

#### Request Body (Tùy chọn cấu hình phạm vi):
```json
{
  "includeSubmissions": true,
  "includeSupportingDocuments": true
}
```

#### Response Thành công (HTTP 200 OK):
```json
{
  "applicationId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "analyzedAt": "2026-10-31T19:40:00Z",
  "dossierStatus": "UNDER_REVIEW",
  "overallVerdict": "REQUIRES_ATTENTION", // "READY_TO_RECEIVE" | "REQUIRES_ATTENTION" | "INVALID"
  "submissionAnalysis": {
    "submissionId": "7cb26b21-4d1a-47d3-82b2-6db92b95fae1",
    "documentName": "don_dang_ky_khai_tu.docx",
    "fieldsExtracted": {
      "applicantName": "Nguyễn Văn A",
      "applicantCitizenId": "079090001234",
      "deceasedName": "Nguyễn Văn B",
      "dateOfDeath": "2026-10-25",
      "placeOfDeath": "Bệnh viện Đa khoa Sài Gòn"
    },
    "missingFields": []
  },
  "crossCheckResults": [
    {
      "fieldName": "Số CCCD người nộp",
      "valueInForm": "079090001234",
      "valueInDocument": "079090001234",
      "matched": true,
      "sourceDocument": "CCCD mặt trước"
    },
    {
      "fieldName": "Họ và tên người nộp",
      "valueInForm": "Nguyễn Văn A",
      "valueInDocument": "Nguyễn Văn A",
      "matched": true,
      "sourceDocument": "CCCD mặt trước"
    },
    {
      "fieldName": "Nơi cư trú",
      "valueInForm": "Số 12 Lê Lợi, Phường Bến Nghé, Quận 1",
      "valueInDocument": "Chưa có giấy xác nhận cư trú đính kèm",
      "matched": false,
      "sourceDocument": null,
      "warning": "Cần kiểm tra giấy tờ chứng minh nơi cư trú cuối cùng của người chết."
    }
  ],
  "administrativeSuggestion": {
    "isRecommendedAccept": false,
    "suggestedComment": "Đề nghị công dân bổ sung: Giấy báo tử bản chính do Bệnh viện cấp (hiện chỉ mới nộp bản chụp mờ) và Giấy xác nhận thông tin về cư trú (CT07) để xác định thẩm quyền đăng ký.",
    "policyReference": "Khoản 1 Điều 32 Luật Hộ tịch 2014"
  }
}
```

---

## 5. Thống nhất về Cơ chế Quản lý Bản khai DOCX

* **Về cơ chế tải lại bản khai:**
  - Hai bên thống nhất **giữ nguyên cơ chế ghi đè Replace hiện tại** (`PUT /api/v1/citizen/submissions/{submissionId}/draft`).
  - **Lý do:** Tờ khai là thành phần bắt buộc của bộ hồ sơ dịch vụ công. Khi người dân tải nhầm file, họ chỉ cần chọn tải lại file mới để hệ thống ghi đè thay thế.
  - Backend **không cần xây dựng thêm endpoint `DELETE`**, giúp đơn giản hóa logic cơ sở dữ liệu và tránh phát sinh trạng thái rỗng không hợp lệ.
  - Phía Frontend đã cập nhật nhãn giao diện trực quan: nút **"Thay tệp Word khác"** và **"Chọn tệp Word mới để thay thế"**, giúp người dân thao tác trực tiếp, thuận tiện.

---

## 6. Khắc phục triệt để lỗi 503 `ai.provider_unavailable` (Google Gemini)

### 6.1. Bằng chứng mã nguồn Backend gây lỗi 503
Tại file `GeminiAssistant.cs` (dòng 115–117):
```csharp
using var response = await http.SendAsync(request, ct);
if (!response.IsSuccessStatusCode)
    throw new AiFailure(503, "ai.provider_unavailable", "AI chưa xử lý được yêu cầu (hạn mức, cấu hình hoặc dịch vụ bận). Thử lại sau.");
```
Khi gọi sang Google Gemini (`https://generativelanguage.googleapis.com/...`), Google trả về HTTP 429 (*Too Many Requests / Resource Exhausted*) do:
1. API Key đang dùng là Free Tier (hạn chế 15 RPM - Requests Per Minute).
2. Khi nhiều user hoặc test Playwright cùng chạy verify liên tiếp, số request vượt ngưỡng tức thời.

### 6.2. Giải pháp đề xuất cho Backend & DevOps:
1. **Bổ sung Polly Retry Policy:**
   Cấu hình `HttpClient` với Polly để tự động thử lại 3 lần với khoảng cách Exponential Backoff (2s, 4s, 8s) kèm Jitter khi gặp mã 429 hoặc 503 từ Google:
   ```csharp
   services.AddHttpClient<GeminiAssistant>()
       .AddTransientHttpErrorPolicy(policy => policy.WaitAndRetryAsync(3, retryAttempt => 
           TimeSpan.FromSeconds(Math.Pow(2, retryAttempt)) + TimeSpan.FromMilliseconds(Random.Shared.Next(0, 500))));
   ```
2. **Nâng cấp Quota / Pool API Key:**
   * Cấu hình Billing trên Google Cloud Platform (Pay-as-you-go) cho Gemini API Key để nâng hạn mức lên hàng nghìn RPM.
   * Hoặc cấu hình hỗ trợ xoay vòng dự phòng (Key Rotation / Fallback Key) trong `IConfiguration`.
3. **Trả về Header `Retry-After`:**
   Nếu Google báo 429, Backend đọc giá trị header `Retry-After` từ Google và chuyển tiếp về Frontend để Frontend hiển thị thanh đếm lùi thời gian cho người dùng.

---

## 7. Phân định Trách nhiệm (Work Breakdown Structure)

| Hạng mục | Đội ngũ Phụ trách | Chi tiết công việc |
|---|---|---|
| **Trích xuất DOCX & Thư viện** | **Backend** | Tích hợp `DocumentFormat.OpenXml`, viết service bóc tách text và table từ file DOCX nộp lên. |
| **Logic Prompt Thẩm định & Đối chiếu chéo** | **Backend** | Xây dựng prompt chuyên môn Một cửa, kết nối Gemini Vision + Text, trả về JSON Schema thẩm định chuẩn. |
| **Ổn định kết nối AI (Fix 503)** | **Backend & DevOps** | Cấu hình Polly Retry, nâng cấp hạn mức Gemini API Key trên Google Cloud/Azure Key Vault. |
| **Giao diện Thẩm định AI Cán bộ** | **Frontend** | Xây dựng Card hiển thị: Kết quả đối chiếu chéo (Khớp/Lệch), Cảnh báo, Nút 1-click chèn gợi ý nhận xét vào form. |
| **Giao diện Tải thay thế file bản khai** | **Frontend** | Đã hoàn thiện nhãn trực quan "Thay tệp Word khác", gọi đúng API `PUT /draft` hiện hữu. |
| **Kiểm thử tích hợp E2E** | **Cả hai đội** | Chạy kịch bản nộp đơn DOCX, thẩm định AI, đối soát chéo và phê duyệt tại quầy Một cửa. |

---

## 8. Kết luận & Bước tiếp theo

* Frontend đã hoàn thiện 100% các yêu cầu về UI/UX hiện tại: Chatbot avatar Cán bộ Một cửa chính quy, hiển thị chuẩn danh xưng Phường Bến Nghé, loại bỏ nút lặp, tối ưu bảng Quản trị phát thông báo và xử lý fallback thân thiện khi BE bảo trì.
* Sau khi đội ngũ Backend hoàn thành việc triển khai các endpoint và cấu hình hạ tầng theo tài liệu này, đội Frontend sẽ lập tức tích hợp toàn diện giao diện và bàn giao sản phẩm trọn vẹn.

