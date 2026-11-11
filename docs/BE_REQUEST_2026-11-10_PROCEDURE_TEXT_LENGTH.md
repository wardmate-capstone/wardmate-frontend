# BE-H — Mô hình thủ tục đủ linh hoạt cho mọi thủ tục hành chính: bỏ giới hạn độ dài và thêm trường dự phòng

| | |
|---|---|
| Ngày | 10/11/2026 |
| Mức độ | Cao: Procedure Manager không nhập đủ được nhiều thủ tục thật bằng form "Thêm thủ tục" |
| Service cần sửa | **ProcedureCatalog** (A, B, C), **ApplicationWorkflow** (A) |
| Migration | Phần A: đổi kiểu cột. Phần B, C: **không cần** (chỉ thêm trường tuỳ chọn trong `contentPayload` jsonb) |
| Tương thích ngược | Có: mọi trường mới tuỳ chọn; thủ tục và FE hiện tại vẫn chạy |

---

## 1. Bối cảnh và mục tiêu

Việt Nam có hàng nghìn thủ tục hành chính, ở nhiều lĩnh vực, cấp thực hiện và địa phương, công bố theo cùng khung nội dung trên Cổng Dịch vụ công. Mỗi thủ tục có các mục: tên, trình tự, cách thức thực hiện, thành phần hồ sơ, thời hạn, phí/lệ phí, đối tượng, các loại cơ quan, kết quả, mẫu đơn, yêu cầu/điều kiện, căn cứ pháp lý. **Cách viết từng mục lại rất khác nhau giữa các thủ tục.**

Mô hình hiện tại giả định dữ liệu "gọn":

- một mức phí là một số;
- thời hạn là một số ngày;
- số lượng là một số nguyên với 3 loại bản cố định;
- tên giấy tờ ≤ 255 ký tự;
- bước thực hiện bắt buộc nằm trong "trường hợp";
- không có chỗ cho yêu cầu/điều kiện, loại thủ tục, cơ quan phối hợp…

Thủ tục nào lệch khỏi giả định thì **không lưu được**, hoặc **lưu sai hoặc thiếu** so với văn bản công bố.

**Mục tiêu:** Procedure Manager nhập tay được **bất kỳ** thủ tục nào, đầy đủ như văn bản gốc. Dữ liệu có cấu trúc (số tiền, số ngày, mã) vẫn dùng được cho tính toán và lọc khi có.

> **Nguồn đối chiếu:** bản xuất "Chi tiết thủ tục hành chính" **chính thức từ Cổng Dịch vụ công Quốc gia** (PDF FE gửi kèm, thủ tục 3.000781 "(Đà Nẵng) Đăng ký, cấp Giấy chứng nhận đối với thửa đất có diện tích tăng thêm…"). **Bố cục các mục** của bản xuất này là khung chuẩn mà mọi thủ tục trên Cổng đều theo (mục 3b). **Nội dung** của riêng thủ tục này chỉ là một ví dụ: giấy tờ dài 340 ký tự, 9 mức phí trong một cách nộp, trình tự không chia trường hợp. Form hiện tại không lưu được thủ tục này.

## 2. Nguyên tắc thiết kế

1. **Văn bản mô tả không giới hạn độ dài thực tế.** Cột dùng `text`. Validator chỉ đặt trần chống lạm dụng rất rộng (xem A.3), không đặt 255/500.
2. **Mọi trường có cấu trúc đều có trường văn bản dự phòng.** Khi nội dung gốc không tách được thành số hoặc mã (ví dụ "Theo quy định của Bộ Tài chính", "Không quá 15 phút", "01 bản chính và 01 bản sao"), người nhập ghi nguyên văn. FE ưu tiên hiển thị văn bản dự phòng nếu có.
3. **Chỉ bắt buộc mã, tên, lĩnh vực** (đã làm ở PROC-01b). Mọi trường khác cho phép rỗng/null, kể cả `estimatedDays` và `feeAmount`.
4. **Mọi thứ có thể có nhiều thì là danh sách**: cấp thực hiện, cơ quan, mức phí, kết quả, mẫu đơn.
5. **Có mục mở rộng tự do** cho nội dung chưa có trường riêng, để không bao giờ phải bỏ thông tin.
6. **Tương thích ngược**: giữ trường cũ; BE tự suy ra trường cũ từ trường mới khi cần, để Workflow, AIOCR và FE cũ không phải sửa cùng lúc.

## 3. Các dạng dữ liệu cần bao phủ

| Mục | Các dạng gặp trong thủ tục thật | Mô hình hiện tại |
|---|---|---|
| Phí, lệ phí | Không thu phí · một mức · **nhiều mức** (theo đối tượng, diện tích, loại giấy) · theo **tỷ lệ %** · **khác nhau theo cách nộp hoặc trường hợp** · "Theo quy định tại Thông tư…" · có cả phí và lệ phí | Một số `feeAmount` cho mỗi cách nộp ❌ |
| Thời hạn | N ngày / N ngày làm việc · **N giờ / N phút** · "Trong ngày" · "Ngay khi nhận đủ hồ sơ" · **khác nhau theo trường hợp** · có cộng thêm cho vùng khó khăn · **không quy định** | Một số `estimatedDays` bắt buộc ❌ |
| Số lượng, loại bản giấy tờ | "01 bản chính" · "01 bản sao có chứng thực hoặc bản sao kèm bản chính để đối chiếu" · "02 bộ" · "bản chụp", "bản điện tử", "bản dịch có công chứng" | `quantity` số nguyên + 3 giá trị cố định ❌ |
| Tên giấy tờ / mẫu đơn | Ngắn, hoặc **dài hàng trăm ký tự** kèm điều kiện, ngoại lệ | ≤ 255 ❌ |
| Đối tượng thực hiện | Một dòng hoặc **đoạn văn dài** liệt kê nhiều đối tượng | ≤ 255 ❌ |
| Cấp thực hiện | Một cấp · **nhiều cấp** ("Cấp Tỉnh, Cấp Xã") | Chuỗi ≤ 50 ⚠️ |
| Cơ quan | Có thẩm quyền · thực hiện · được ủy quyền · phối hợp · **nhiều cơ quan mỗi loại** | Chỉ `issuingAuthority` (≤ 255) + `executingAgency` ⚠️ |
| Trình tự | **Không chia trường hợp** · chia trường hợp · bước chung + bước riêng · bước rất dài | Bước chỉ nằm trong `cases[]` ⚠️ |
| Cách thức nộp | Trực tiếp / trực tuyến / bưu chính · **mỗi cách một thời hạn và mức phí** · ghi chú dài | Có, nhưng phí và thời hạn chỉ một số ❌ |
| Kết quả | Một hoặc nhiều giấy tờ · có **mã kết quả** · có thời hạn hiệu lực | `results: string[]` ⚠️ |
| Yêu cầu, điều kiện | Không có · một câu · **danh sách nhiều điều kiện dài** | Không có trường ❌ |
| Căn cứ pháp lý | Có/không số hiệu · có/không ngày · tên văn bản dài · kèm ghi chú địa phương | Có (không giới hạn) ✅ |
| Mục khác | Lưu ý, từ khoá, mô tả, thông tin liên hệ, số điện thoại hỗ trợ… | Không có chỗ ❌ |

## 3b. Đối chiếu từng mục của Cổng DVC Quốc gia

Mọi mục trong bản xuất "Chi tiết thủ tục hành chính" phải có chỗ lưu. Cột "Sau đề xuất" là trường sẽ dùng khi BE làm xong file này.

| # | Mục trên Cổng DVC | Dạng dữ liệu trên Cổng | Hiện tại | Sau đề xuất |
|---|---|---|---|---|
| 1 | Tên thủ tục | Văn bản | `title` ≤ 500 | `title` ≤ 1.000 (A.2) |
| 2 | Mã thủ tục | Mã ("3.000781", "1.001234.000.00.00.H12") | `procedureCode` ≤ 50 | ≤ 100 (A.2) |
| 3 | Số quyết định | Một hoặc nhiều số quyết định | `decisionNumber` ≤ 100 | ≤ 255 (A.2) |
| 4 | Cấp thực hiện | Một hoặc nhiều cấp | `levelOfImplementation` ≤ 50 | ≤ 255 + `levels[]` (B.2) |
| 5 | Loại thủ tục | Văn bản ngắn | ❌ không có | `procedureType` (B.2) |
| 6 | Lĩnh vực | Danh mục | `categoryId` | Giữ |
| 7 | Đối tượng thực hiện | Văn bản, có thể dài | `targetAudience` ≤ 255 | `text` (A.1) |
| 8 | Cơ quan có thẩm quyền | Một hoặc nhiều | ⚠️ mượn `issuingAuthority` | `competentAuthorities[]` (B.2) |
| 9 | Địa chỉ tiếp nhận HS | Một hoặc nhiều | `receivingAddress` | + `receivingAddresses[]` (B.2) |
| 10 | Cơ quan được ủy quyền | Một hoặc nhiều | ❌ | `authorizedAgencies[]` (B.2) |
| 11 | Cơ quan phối hợp | Một hoặc nhiều | ❌ | `coordinatingAgencies[]` (B.2) |
| 12 | Trình tự thực hiện | **Thường là một khối văn bản** "Bước 1… Bước 2…", có thể chia trường hợp | ⚠️ chỉ có `cases[].steps[]` | `stepsText` + `commonSteps[]` + `cases[].steps[]` (B.4) |
| 13 | Thành phần hồ sơ → Tên giấy tờ | Văn bản, có thể rất dài | `itemName` ≤ 255 | `text` (A.1) |
| 14 | Thành phần hồ sơ → **Mẫu đơn, tờ khai** | **0..n tệp mẫu gắn vào từng giấy tờ** | ⚠️ `formDefinitions` tách riêng, chỉ khớp khi trùng mã | `formCodes[]` trên từng giấy tờ (B.3) |
| 15 | Thành phần hồ sơ → Số lượng | Văn bản ("1 bản chính", "01 bản chính và 01 bản sao") | ⚠️ `quantity` số + 3 loại bản | + `quantityText`, `OTHER` (B.3) |
| 16 | Cách thức → Hình thức nộp | Danh sách | `submissionMethods[]` | Giữ |
| 17 | Cách thức → Thời hạn giải quyết | Văn bản ("57 ngày làm việc") | ⚠️ `estimatedDays` số bắt buộc | `processingTime` + văn bản (B.1) |
| 18 | Cách thức → Phí, lệ phí | **Danh sách nhiều mức** hoặc văn bản | ❌ `feeAmount` một số | `fees[]` + `feeText` (B.1) |
| 19 | Cách thức → Mô tả | Văn bản dài | `note` | Giữ |
| 20 | Căn cứ pháp lý | **2 cột**: Tên văn bản pháp lý + Mã văn bản | `legalReferences[]` (`documentName`, `documentNumber`) | ✅ Giữ nguyên, BE không cần sửa (B.5) |
| 21 | Cơ quan thực hiện | Danh sách hoặc "Không có thông tin" | `executingAgency` | + `executingAgencies[]` (B.2) |
| 22 | Yêu cầu, điều kiện thực hiện | Văn bản dài | ❌ | `requirements` (B.2) |
| 23 | Kết quả xử lý | Tên + **mã kết quả** ("KQ.H17.000312") | ⚠️ `results[]` chuỗi | `resultDetails[]` (B.2) |
| 24 | **Từ khóa** | Danh sách | ❌ | `keywords[]` (B.2) |
| 25 | **Mô tả** | Văn bản | ❌ | `description` (B.2) |
| — | Mục khác ngoài khung (nếu có) | — | ❌ | `additionalSections[]` (Phần C) |

**Lưu ý về chất lượng dữ liệu nguồn:** bản xuất từ Cổng có thể **lặp lại nội dung**. Ví dụ trong mẫu, phần "Mô tả" thời hạn bị lặp 3 lần trong cùng một ô, nối bằng ", 4.1.". Khi AI trích xuất PDF (luồng bản nháp), đề nghị prompt **loại bỏ đoạn lặp** trước khi điền.

---

## Phần A — Bỏ giới hạn độ dài

Giới hạn hiện nằm ở **3 lớp**, nên FE không tự bỏ được:

1. Validator của Catalog.
2. Cột DB `varchar(n)` của Catalog.
3. **ApplicationWorkflow** chép tên giấy tờ/biểu mẫu sang hồ sơ, tự chặn 255 ký tự và cột cũng là varchar(255).

Nếu chỉ sửa Catalog thì người dân **không tạo được hồ sơ** (502 `application.invalid_schema`).

Đường dẫn rút gọn: `Catalog/` = `src/Services/WardMate.Services.ProcedureCatalog/WardMate.Services.ProcedureCatalog.`, `Workflow/` = `src/Services/WardMate.Services.ApplicationWorkflow/WardMate.Services.ApplicationWorkflow.`

### A.1. Trường văn bản: chuyển sang `text`, bỏ giới hạn 255

| Trường | Chỗ cần sửa |
|---|---|
| `targetAudience` | `Catalog/Application/Management/ProcedureInputValidator.cs:23`; `Catalog/Infrastructure/Persistence/Configurations/ProcedureConfiguration.cs:22` |
| `issuingAuthority` | `ProcedureInputValidator.cs:21`; `ProcedureConfiguration.cs:19` |
| `feeSummary`, `processingTimeSummary` | `ProcedureInputValidator.cs:24-25`; `ProcedureConfiguration.cs:23-24`; **bỏ cắt 255** ở `Catalog/Application/Management/ProcedureSummaries.cs:12,46` |
| `checklistSchema[].itemName` | `ProcedureInputValidator.cs:50`; **Workflow** `Workflow/Application/WorkflowRequests.cs:39` và cột `application_checklists.title` (`Workflow/Infrastructure/WorkflowDbContext.cs:155`) |
| `formDefinitions[].formName` | `ProcedureInputValidator.cs:75`; **Workflow** `WorkflowRequests.cs:56` (cùng cột `application_checklists.title`) |

### A.2. Trường mã/ngắn: nới rộng để dự phòng

| Trường | Hiện tại | Đề nghị | Lưu ý |
|---|---|---|---|
| `title` (Tên thủ tục) | 500 | **1.000** | Phải đổi **cùng lúc 3 service**: Catalog (`ProcedureConfiguration.cs:16`, validator `:20`), Workflow `ProcedureTitle` (`WorkflowDbContext.cs:113`), Analytics `ProcedureTitle` (`AnalyticsDbContext.cs:100` và `Clip(…, 500)` ở `AnalyticsService.cs:96`) |
| `levelOfImplementation` | 50 | **255**, hoặc dùng thêm danh sách `levels[]` (B.2) | Vẫn dùng làm bộ lọc |
| `procedureCode` | 50 | **100** | Dự phòng mã địa phương có tiền tố hoặc hậu tố |
| `decisionNumber` | 100 | **255** | Có thủ tục ghi nhiều quyết định công bố hoặc sửa đổi |
| `checklistId`, `formCode` | 255 | Giữ | Mã nội bộ, unique theo hồ sơ ở Workflow |
| `caseCode` | 100 | Giữ | Workflow cũng giới hạn 100 |

### A.3. Trần chống lạm dụng (thay cho 255)

Để tránh dán nhầm hoặc payload quá lớn, có thể giữ một trần **rất rộng**:

- trường một dòng (tên giấy tờ, tên biểu mẫu, đối tượng, cơ quan, tóm tắt): **10.000 ký tự**;
- nội dung trong `contentPayload` (bước, mô tả, điều kiện…): không giới hạn từng trường, chỉ giới hạn tổng payload. Luồng bản nháp đang dùng 500.000 ký tự (`ProcedureDraftService.cs:45`); đề nghị áp dụng cùng mức cho tạo và sửa.

Hãy ghi rõ con số chốt trong phản hồi để FE hiển thị bộ đếm đúng.

### A.4. Migration

```sql
-- Catalog (snake_case)
ALTER TABLE procedures
  ALTER COLUMN issuing_authority TYPE text, ALTER COLUMN target_audience TYPE text,
  ALTER COLUMN fee_summary TYPE text,       ALTER COLUMN processing_time_summary TYPE text,
  ALTER COLUMN title TYPE varchar(1000),    ALTER COLUMN level_of_implementation TYPE varchar(255),
  ALTER COLUMN procedure_code TYPE varchar(100);
ALTER TABLE procedure_versions ALTER COLUMN decision_number TYPE varchar(255);
-- Workflow
ALTER TABLE application_checklists ALTER COLUMN title TYPE text;
ALTER TABLE applications ALTER COLUMN procedure_title TYPE varchar(1000);
-- Analytics: cột ProcedureTitle của bảng phản hồi → varchar(1000)
```

Kiểm tra tên bảng và cột thật trong snapshot từng service trước khi chạy. Tăng độ dài varchar hoặc đổi sang `text` không ghi lại dữ liệu.

---

## Phần B — Trường có cấu trúc kèm văn bản dự phòng

Tất cả nằm trong `contentPayload` (jsonb), **tuỳ chọn**, không cần migration. Model ở `Catalog/Domain/JsonModels/ProcedureContentPayload.cs`.

### B.1. Cách thức nộp: phí và thời hạn

```csharp
public sealed class SubmissionMethodDetail
{
    public string MethodName { get; set; } = string.Empty;
    public decimal? FeeAmount { get; set; }          // ĐỔI: cho phép null (không rõ / theo văn bản)
    public string FeeUnit { get; set; } = "VND";
    public decimal? EstimatedDays { get; set; }      // ĐỔI: cho phép null (không quy định / tính theo giờ)
    public string? Note { get; set; }
    // MỚI
    public string? CaseCode { get; set; }            // cách nộp chỉ áp dụng cho một trường hợp
    public List<FeeItem>? Fees { get; set; }         // nhiều mức phí/lệ phí
    public string? FeeText { get; set; }             // nguyên văn phí khi không tách được
    public ProcessingTime? ProcessingTime { get; set; }
}
public sealed class FeeItem
{
    public string? Kind { get; set; }                // "PHI" | "LE_PHI" | null
    public decimal? Amount { get; set; }             // null khi là tỷ lệ hoặc "theo quy định"
    public decimal? Percent { get; set; }            // ví dụ 0.5 (%)
    public string Unit { get; set; } = "VND";
    public string? Description { get; set; }         // áp dụng cho ai / trường hợp nào
    public string? CaseCode { get; set; }
}
public sealed class ProcessingTime
{
    public decimal? Value { get; set; }              // 15, 0.5…
    public string? Unit { get; set; }                // "WORKING_DAY" | "DAY" | "HOUR" | "MINUTE" | null
    public string? Text { get; set; }                // nguyên văn: "Trong ngày", "Không quá 15 phút"…
}
```

Quy tắc tương thích:

- Có `Fees`: BE gán `FeeAmount` = mức nhỏ nhất có `Amount`, để chỗ cũ vẫn đọc được.
- Có `ProcessingTime` với đơn vị ngày: BE gán `EstimatedDays` = `Value`.
- **Tóm tắt tự sinh** (`ProcedureSummaries`), theo thứ tự ưu tiên:
  1. `FeeText` / `ProcessingTime.Text`;
  2. khoảng min–max từ `Fees` / `ProcessingTime`;
  3. trường cũ.

  Không có dữ liệu thì để null. Sau phần A thì không cắt.
- Validator: `Amount`, `Percent`, `Value` ≥ 0 khi có giá trị; `Unit` thuộc danh sách hoặc null.
- Workflow **không** dùng `EstimatedDays` hay `FeeAmount` để tính hạn: hạn tiền kiểm tính riêng (`DeadlineFacts`). Nhờ BE xác nhận lại trước khi cho null.

### B.2. Thông tin chung

| Trường mới trong `contentPayload` | Kiểu | Dùng cho |
|---|---|---|
| `procedureType` | `string?` | Loại thủ tục. Hiện trang công dân đang ghi cố định một câu |
| `levels` | `string[]?` | Nhiều cấp thực hiện; BE ghép vào `levelOfImplementation` nếu trống |
| `competentAuthorities` | `string[]?` | Cơ quan có thẩm quyền |
| `executingAgencies` | `string[]?` | Cơ quan thực hiện (giữ `executingAgency` cũ) |
| `authorizedAgencies` | `string[]?` | Cơ quan được ủy quyền |
| `coordinatingAgencies` | `string[]?` | Cơ quan phối hợp |
| `requirements` | `string?` | Yêu cầu, điều kiện thực hiện (văn bản dài, nhiều dòng) |
| `receivingAddresses` | `string[]?` | Nhiều địa chỉ tiếp nhận (giữ `receivingAddress` cũ) |
| `resultDetails` | `[{ name, code?, validity?, note? }]?` | Kết quả kèm mã, thời hạn hiệu lực. BE tự điền `results` = danh sách `name` để tương thích |
| `keywords` | `string[]?`: **nullable, tuỳ chọn**; null hoặc `[]` đều hợp lệ | Mục "Từ khóa" của Cổng (thường để trống); nên đưa vào tìm kiếm thủ tục (`keyword`) |
| `description` | `string?`: **nullable, tuỳ chọn** | Mục "Mô tả" của Cổng (thường để trống) |

Mọi trường trong bảng trên đều **nullable và tuỳ chọn**: không gửi, gửi `null` hay chuỗi rỗng đều lưu được. Chuỗi chỉ có khoảng trắng lưu thành `null`, giống quy tắc PROC-01b.

### B.3. Thành phần hồ sơ

Thêm vào `ChecklistItemSchema`:

| Trường | Kiểu | Dùng cho |
|---|---|---|
| `quantityText` | `string?` | Nguyên văn "01 bản chính và 01 bản sao", "02 bộ"… khi `quantity` + `documentCopyType` không diễn đạt được |
| `documentCopyType` | Cho phép thêm `"OTHER"` | Kèm `quantityText` cho bản chụp, bản điện tử, bản dịch… |
| `note` | `string?` | Ghi chú, ngoại lệ (tách khỏi `conditionNote` nếu cần) |
| `formCodes` | `string[]?` | **Mẫu đơn, tờ khai gắn với giấy tờ này** (theo cột "Mẫu đơn, tờ khai" của Cổng); mỗi mã trỏ tới một `formDefinitions[].formCode`. Một giấy tờ có thể có 0..n mẫu |

#### B.3.1. Gắn mẫu đơn với từng giấy tờ (`formCodes`)

**Trên Cổng DVC**, bảng "Thành phần hồ sơ" có cột **"Mẫu đơn, tờ khai"**. Mỗi dòng giấy tờ có thể kèm 0..n file mẫu, nằm ngay trên cùng dòng:

| Tên giấy tờ | Mẫu đơn, tờ khai | Số lượng |
|---|---|---|
| Đơn đăng ký biến động đất đai, tài sản gắn liền với đất theo Mẫu số 25… | **Mẫu số 25.docx** | 1 bản chính |
| Giấy chứng nhận đã cấp | *(không có)* | 1 bản chính |
| Tờ khai lệ phí trước bạ (bản chính) | **Mẫu số 01.LPTB Tờ khai lệ phí trước bạ.docx** | 1 bản chính |

**Trong hệ thống hiện tại**, giấy tờ (`checklistSchema`) và biểu mẫu (`formDefinitions`) là **2 danh sách tách rời**, hiển thị ở 2 tab riêng trên form. Không có trường nào cho biết mẫu nào thuộc giấy tờ nào. Workflow chỉ nối hai bên khi **`formCode` trùng hệt `checklistId`** (`Workflow/Application/WorkflowRequests.cs:62-70`, chú thích "Same explicit code means the form satisfies that checklist item"). Nếu không trùng, Workflow **tạo thêm một dòng checklist mới** cho biểu mẫu.

Ví dụ người nhập đặt mã như sau (rất tự nhiên):

| `checklistSchema` | | `formDefinitions` | |
|---|---|---|---|
| `GT01` | Đơn đăng ký biến động đất đai… | `M25` | Mẫu số 25 |
| `GT02` | Giấy chứng nhận đã cấp | `01.LPTB` | Mẫu số 01.LPTB |
| `GT03` | Tờ khai lệ phí trước bạ | | |

Khi người dân tạo hồ sơ, checklist của hồ sơ thành **5 dòng thay vì 3**:

1. Đơn đăng ký biến động đất đai…
2. Giấy chứng nhận đã cấp
3. Tờ khai lệ phí trước bạ
4. **Mẫu số 25**: bị lặp, thực chất là dòng 1
5. **Mẫu số 01.LPTB**: bị lặp, thực chất là dòng 3

Hệ quả:

- **Người dân hiểu sai**: tưởng phải nộp 5 thứ.
- **Cán bộ phải duyệt trùng.**
- **Người nhập phải tự nhớ đặt mã biểu mẫu trùng mã giấy tờ**, mà form không hướng dẫn điều này.
- Mỗi giấy tờ chỉ trùng mã được với **một** biểu mẫu, nên giấy tờ cần 2 mẫu thì không biểu diễn được.

**Đề xuất:** thêm vào `ChecklistItemSchema`:

```csharp
public List<string>? FormCodes { get; set; }   // các formDefinitions[].formCode gắn với giấy tờ này; null/[] = không có mẫu
```

Dữ liệu ví dụ sau khi sửa:

```json
"checklistSchema": [
  { "checklistId": "GT01", "itemName": "Đơn đăng ký biến động đất đai…", "formCodes": ["M25"] },
  { "checklistId": "GT02", "itemName": "Giấy chứng nhận đã cấp",         "formCodes": [] },
  { "checklistId": "GT03", "itemName": "Tờ khai lệ phí trước bạ",        "formCodes": ["01.LPTB"] }
],
"formDefinitions": [
  { "formCode": "M25",     "formName": "Mẫu số 25",      "formTemplateId": "…" },
  { "formCode": "01.LPTB", "formName": "Mẫu số 01.LPTB", "formTemplateId": "…" }
]
```

Quy tắc đề nghị:

| Nơi | Quy tắc |
|---|---|
| **Catalog: validator** | Mỗi mã trong `formCodes` phải tồn tại trong `formDefinitions` (cùng `caseCode`, hoặc biểu mẫu dùng chung). Không trùng lặp trong cùng một giấy tờ. Trường tuỳ chọn, nullable |
| **Workflow: tạo hồ sơ** (`WorkflowRequests.cs:62-70`) | Biểu mẫu được ít nhất một giấy tờ tham chiếu qua `formCodes` thì **gắn vào giấy tờ đó, không tạo dòng checklist mới**. Biểu mẫu không giấy tờ nào tham chiếu thì giữ cách cũ: khớp theo mã trùng, không khớp thì tạo dòng mới |
| **Workflow: DTO trả cho FE** | Mỗi dòng checklist của hồ sơ trả kèm danh sách biểu mẫu gắn với nó (mã, tên, `formTemplateId`), để FE hiện nút "Tải mẫu / Điền tờ khai" ngay trên dòng giấy tờ |
| **Tương thích ngược** | Thủ tục cũ không có `formCodes` chạy như hiện tại |

FE sẽ làm sau khi BE deploy: trên tab "Thành phần hồ sơ", mỗi dòng giấy tờ có ô **"Mẫu đơn kèm theo"** để chọn nhiều mẫu từ tab "Biểu mẫu", đúng như cột giữa của Cổng. Màn hình hồ sơ của người dân và cán bộ hiện mẫu ngay dưới giấy tờ tương ứng.

Workflow đang chặn `DocumentCopyType` ngoài 3 giá trị (`WorkflowRequests.cs:41`) và so khớp ở `DocumentContentsClient.cs:42`. Nếu thêm `"OTHER"`, Workflow phải chấp nhận giá trị này và coi như không ràng buộc loại bản khi so khớp.

### B.4. Trình tự thực hiện

Trên Cổng DVC, "Trình tự thực hiện" thường là **một khối văn bản** "Bước 1… Bước 2…", nhiều thủ tục không tách thành từng bước có cấu trúc. Đề nghị cho phép 3 mức chi tiết, dùng mức nào cũng được:

- `contentPayload.stepsText: string?`: nguyên văn trình tự, nhiều dòng, không giới hạn. Đây là **dự phòng chính**: dán nguyên văn từ Cổng là đủ.
- `contentPayload.commonSteps: ProcedureStepDetail[]?`: các bước có cấu trúc dùng chung, cho thủ tục không chia trường hợp.
- `cases[].steps`: giữ nguyên cho bước riêng từng trường hợp.

Trong `ProcedureStepDetail`, chỉ bắt buộc `ActionDetails` **hoặc** `StepName` (một trong hai). `Executor` tuỳ chọn. `StepOrder` tự đánh số theo thứ tự nếu không gửi.

Nhờ BE xác nhận Workflow/AIOCR có đọc bước hay không; nếu có thì dùng `stepsText` khi không có bước có cấu trúc.

### B.5. Căn cứ pháp lý: giữ đơn giản, BE không cần sửa

Trên Cổng, bảng "Căn cứ pháp lý" chỉ có **2 cột: "Tên văn bản pháp lý" và "Mã văn bản"**, đều là văn bản để người nhập copy và dán. Mô hình hiện tại đã đáp ứng:

- `documentName` = Tên văn bản pháp lý (`text`, không giới hạn);
- `documentNumber` = Mã văn bản (`text`, có thể kèm chú thích như "135/2026/QĐ-UBND (Thành phố Đà Nẵng)").

`issueDate` và `authority` **giữ nguyên trong model** để không ảnh hưởng dữ liệu cũ, nhưng không bắt buộc. Validator hiện tại cũng không bắt buộc trường con nào. **Không thêm trường mới.** Chỉ nhờ BE ghi rõ trong Swagger rằng `issueDate` và `authority` tuỳ chọn. FE sẽ rút form về đúng 2 ô như Cổng.

---

## Phần C — Mục mở rộng tự do (dự phòng cuối cùng)

Dù thêm bao nhiêu trường vẫn có thủ tục chứa mục ngoài khung (lưu ý, thông tin liên hệ, hướng dẫn riêng của địa phương, từ khoá, mô tả…). Đề nghị thêm:

```json
"contentPayload": {
  "additionalSections": [
    { "title": "Lưu ý", "content": "…văn bản nhiều dòng…" },
    { "title": "Thông tin liên hệ hỗ trợ", "content": "…" }
  ]
}
```

- `title` ≤ 255 (tiêu đề mục), `content` không giới hạn. Tối đa 50 mục.
- FE hiển thị nguyên văn theo thứ tự, sau các mục chuẩn.
- Đưa vào văn bản tri thức AIOCR (`AIOCR/Application/ProcedureKnowledgeText.cs`) để chatbot trả lời được.

---

## Triển khai

1. **Phần A**: Catalog + Workflow (+ Analytics nếu tăng `title`), có migration. Deploy Workflow và Analytics **trước hoặc cùng lúc** với Catalog.
2. **Phần B, C**: Catalog (+ Workflow cho `documentCopyType = "OTHER"`, + AIOCR cho tri thức và prompt trích xuất PDF). Không migration; có thể deploy sau phần A.
3. Cập nhật Swagger, bổ sung ví dụ JSON cho từng trường mới vào `docs/api-guide.md`.
4. Báo FE: các con số trần chốt, tên trường chính thức.
5. FE sẽ làm sau khi BE deploy:
   - bỏ hoặc nới giới hạn độ dài;
   - thêm ô có cấu trúc kèm ô văn bản dự phòng vào form;
   - thêm mục "Thông tin khác";
   - trang công dân ưu tiên văn bản dự phòng, bỏ các chữ đang ghi cố định.

## Tiêu chí nghiệm thu

Không dựa vào một thủ tục cụ thể. Mỗi dòng là một dạng dữ liệu phải lưu, đọc và hiển thị được.

| # | Dữ liệu thử | Kỳ vọng |
|---|---|---|
| 1 | Tên giấy tờ 2.000 ký tự; đối tượng thực hiện 5.000 ký tự | Lưu, đọc lại đủ; **người dân tạo hồ sơ được**, checklist hồ sơ hiện đủ tên |
| 2 | Một cách nộp có 9 mức phí, gồm "miễn phí" và một mức theo % | Lưu được; `feeAmount` = 0; `feeSummary` tự sinh hợp lý |
| 3 | Phí chỉ có văn bản "Theo quy định của Bộ Tài chính" (`feeText`, không có số) | Lưu được; `feeSummary` = nguyên văn |
| 4 | Thời hạn "Không quá 15 phút" (`unit = MINUTE`) và "Không quy định" (null) | Lưu được; `estimatedDays` null không gây lỗi ở Workflow, Analytics, AIOCR |
| 5 | Mỗi cách nộp có thời hạn và phí khác nhau; một cách nộp gắn `caseCode` | Lưu và trả đúng |
| 6 | Giấy tờ "01 bản chính và 01 bản sao" (`documentCopyType = OTHER` + `quantityText`) | Lưu được; tạo hồ sơ được |
| 7 | Thủ tục không có trường hợp, chỉ có `commonSteps` | Lưu được; tạo hồ sơ không yêu cầu chọn trường hợp |
| 8 | Hai cấp thực hiện, ba cơ quan phối hợp, điều kiện thực hiện dài, kết quả có mã | Trả đủ trong chi tiết công khai |
| 9 | 3 mục `additionalSections` | Trả đúng thứ tự |
| 10 | Tên thủ tục 1.000 ký tự | Lưu được; tạo hồ sơ và ghi phản hồi (Analytics) không lỗi |
| 11 | Thủ tục cũ không có trường mới | Đọc, sửa, xuất bản, tạo hồ sơ bình thường |
| 12 | Vượt trần chống lạm dụng (A.3) | 400 với thông báo rõ trường nào |
| 13 | Trình tự chỉ có `stepsText` (dán nguyên văn "Bước 1… Bước 4…" khoảng 5.000 ký tự) | Lưu được; trả đúng nguyên văn, giữ xuống dòng |
| 14 | Thủ tục có 3 giấy tờ, 2 biểu mẫu mã khác giấy tờ (`M25`, `01.LPTB`), gắn qua `formCodes` | Người dân tạo hồ sơ: checklist **đúng 3 dòng**, không sinh dòng lặp; dòng 1 và 3 kèm mẫu tương ứng |
| 14b | Một giấy tờ gắn 2 mẫu qua `formCodes` | Lưu được; dòng giấy tờ hiện cả 2 mẫu |
| 14c | `formCodes` chứa mã không có trong `formDefinitions` | 400, thông báo rõ giấy tờ nào sai mã |
| 15 | Căn cứ pháp lý chỉ có tên văn bản + mã văn bản (dán nguyên từ Cổng) | Lưu được, không cần ngày hay cơ quan |
| 16 | `keywords` 5 từ khoá | Tìm thủ tục bằng một từ khoá trả về đúng thủ tục |
| 17 | **Nhập đủ 25 mục của thủ tục mẫu 3.000781** (PDF Cổng DVC kèm theo) | Lưu được không cắt bớt; trang chi tiết hiển thị đủ như bản Cổng |

Báo lỗi cho FE kèm: route, mã HTTP, `code`, `traceId`, thời điểm gọi.
