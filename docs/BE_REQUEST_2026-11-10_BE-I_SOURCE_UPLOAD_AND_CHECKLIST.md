# BE-I — Lỗi khi nghiệm thu BE-H trên Azure: gắn PDF gốc (500) và cập nhật checklist có `formCodes` (400)

| | |
|---|---|
| Ngày | 10/11/2026 |
| Phát hiện khi | FE test bảng nghiệm thu `fe-handoff-2026-11-10.md` trên Azure (`catalog-20261110-02`) |
| Service | **ProcedureCatalog** |
| Thủ tục dùng để test | `21b557d3-89d3-4fa6-8186-afad7b1bda47` (tạo tay, đang ẩn, có `formCodes`) |
| Mức độ | Cao: (1) chặn tính năng gắn PDF cho thủ tục nhập tay; (2) chặn mọi lần cập nhật checklist của thủ tục có gắn mẫu |

## ✅ Cập nhật 11/11/2026 (chiều) — BE đã sửa code, CHỜ xác nhận deploy

- Commit `86a68ac` (nhánh `kha`, 15:56): (1) `AttachSource` nạp `Category` trước khi trả DTO (nguyên nhân 500: `LockProcedure` không nạp `Category` → NullReferenceException), lỗi Blob trả **503 `draft.storage_unavailable`**; (2) `UpdateProcedureChecklistHandler` truyền `FormDefinitions = p.FormDefinitions`. Thêm 4 unit test `BeIRegressionTests` (92/92 đạt).
- FE đã đọc diff: **đúng nguyên nhân, đúng cách sửa**.
- **Chưa có ghi chép deploy Catalog** (`PROGRESS.md` ghi "Chưa thử trên Azure"; không có `DEPLOY-1111`). Nhờ BE deploy `wardmate-procedure-catalog` và báo tag image để FE chạy lại 2 bảng nghiệm thu bên dưới.
- Code mới nằm trên `kha`, **chưa merge vào `main`**.

## ⚠️ Cập nhật 11/11/2026 (sáng) — 2 lỗi CHƯA được sửa

FE kiểm tra lại sáng 11/11:

| Kiểm tra | Kết quả |
|---|---|
| Commit mới nhất chạm `src/Services/WardMate.Services.ProcedureCatalog` trên `main` và `kha` | Vẫn là `04b830a4` (10/11 10:34), trước khi FE báo lỗi. **Chưa có commit sửa** |
| `Application/Management/ProcedureChecklist.cs` (nhánh `kha`) | Vẫn dựng `new ProcedureInput { ChecklistSchema = …, ContentPayload = … }`, **chưa có `FormDefinitions = p.FormDefinitions`** |
| `AttachSource` (`Application/Drafts/ProcedureDraftService.cs`) | Không đổi; chưa có test cho API 32a/32b |
| Image Catalog trên Azure (theo `PROGRESS.md` nhánh `kha`) | Vẫn `catalog-20261110-02` |
| Các đợt deploy sau đó | DEPLOY-1110c (Workflow, Analytics: luồng thông báo), DEPLOY-1110d (DocumentForm: BE-J). Không đợt nào gồm Catalog |

**Ảnh hưởng hiện tại:**

- Thủ tục nhập tay **không gắn được PDF gốc**, nên cán bộ không xem được văn bản nguồn khi xử lý hồ sơ của các thủ tục này.
- Thủ tục có giấy tờ gắn mẫu đơn (`formCodes`, tính năng BE-H mới) **không dùng được** cửa sổ "Cập nhật giấy tờ (Checklist)". Cách tạm thời: sửa giấy tờ qua "Chỉnh sửa" thủ tục (`PUT /procedure-manager/procedures/{id}`), API này kiểm tra đúng vì có `formDefinitions` trong body.

**Đề nghị BE xử lý theo thứ tự:**

1. **Lỗi 2 (sửa 1 dòng, xem mục "Đề nghị sửa" bên dưới)**: thêm `FormDefinitions = p.FormDefinitions` và unit test.
2. **Lỗi 1**: tra log `wardmate-procedure-catalog` theo `traceId` `00-102e2eb3eb4b61dd300fcdf2de6cce76-ce9d307f0c31633f-00` (10/11), sửa nguyên nhân, bọc lỗi Blob thành 503.
3. Deploy lại **chỉ Catalog**, báo FE tag image để chạy lại 2 bảng nghiệm thu bên dưới.

---

## Lỗi 1 — `POST /procedure-manager/procedures/{id}/source` trả 500

### Hiện tượng

Procedure Manager mở chi tiết thủ tục đang ẩn (chưa có PDF), bấm **"Tải PDF gốc"**, chọn file PDF hợp lệ. File là bản xuất "Chi tiết thủ tục hành chính" tải từ Cổng DVC Quốc gia, khoảng vài trăm KB, tên `chi-tiet-thu-tuc-3.000781-1793840021802.pdf`.

```
POST /api/v1/procedure-manager/procedures/21b557d3-89d3-4fa6-8186-afad7b1bda47/source
Content-Type: multipart/form-data   (trường: file)
```

```json
{
  "type": "https://www.rfc-editor.org/rfc/rfc9110#section-15.6.1",
  "title": "Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.",
  "status": 500,
  "instance": "/api/v1/procedure-manager/procedures/21b557d3-89d3-4fa6-8186-afad7b1bda47/source",
  "traceId": "00-102e2eb3eb4b61dd300fcdf2de6cce76-ce9d307f0c31633f-00"
}
```

Trước đó, `GET /api/v1/procedure-manager/procedures/{id}/source` (API 32b) trả 404 `draft.source_not_found`. Đây là đúng, vì thủ tục chưa có PDF.

### Vì sao không phải lỗi FE

- FE gửi `multipart/form-data` với trường **`file`**, giống hệt luồng tải PDF bản nháp (`POST /procedure-manager/drafts`) đang chạy được. FE chặn trước file không phải `.pdf` hoặc lớn hơn 20 MB.
- Nếu request sai (thiếu file, sai tên trường, file không phải PDF), `ProcedureManagerController.AttachSource` và `CheckPdf` trả **400 `draft.invalid_pdf`**. Thiếu cấu hình Blob thì trả **503**.
- Nhận **500** nghĩa là có exception chưa bắt **sau khi qua kiểm tra file**, tức trong `ProcedureDraftService.AttachSource`.

### Nghi vấn (nhờ BE tra log theo `traceId`)

Theo `Application/Drafts/ProcedureDraftService.cs` → `AttachSource`, các bước có thể ném exception:

1. **`blobs.Upload(pdf, "drafts/{id}/source.pdf")`**: lỗi Azure Blob (quyền ghi, container, connection string của Container App sau lần deploy `catalog-20261110-02`). Không có `try/catch` nên ra 500.
2. **`ProcedureVersion.Capture(procedure, …)`**: chụp snapshot thủ tục có dữ liệu BE-H mới (`fees`, `processingTime`, `formCodes`, `additionalSections`, tên giấy tờ 340 ký tự…). Lỗi serialize hoặc ghi `procedure_versions` (cột, ràng buộc) sẽ ra 500.
3. **`store.Add(d)` (bảng `procedure_drafts`)**: ràng buộc DB (ví dụ check constraint cột `status`, hay cột NOT NULL chưa có giá trị mặc định) khi lưu bản nháp `Status = "Published"` không qua AI.
4. Tên file có ký tự đặc biệt: tên trên là ASCII, ít khả năng.

Hiện chưa có unit test cho API 32a/32b; `TEST-1110` ghi "Chưa phủ: API 32b".

### Đề nghị

- Tra log Container App `wardmate-procedure-catalog` theo `traceId` ở trên, sửa nguyên nhân gốc.
- Bọc lỗi Blob thành **503 `draft.storage_unavailable`** (thông báo tiếng Việt) thay vì 500 chung.
- Thêm test cho `AttachSource`: thủ tục tạo tay có dữ liệu BE-H, cả thủ tục đang ẩn.

### Nghiệm thu

| # | Thao tác | Kỳ vọng |
|---|---|---|
| 1 | Gắn PDF cho thủ tục `21b557d3-…` (đang ẩn) | 200, `originalPdfUrl`, `pdfFileName` có giá trị; lịch sử phiên bản +1 |
| 2 | `GET /procedure-manager/procedures/{id}/source` ngay sau đó | 200 `{ url, expiresInSeconds: 600 }` |
| 3 | Gắn PDF lần 2 (thay PDF) | 200; phiên bản +1; PDF cũ mở được qua nguồn phiên bản cũ |
| 4 | Gửi file `.docx` | 400 `draft.invalid_pdf` (không phải 500) |

---

## Lỗi 2 — `PUT /procedure-manager/procedures/{id}/checklist` báo `formCodes` không có trong `formDefinitions`

### Hiện tượng

Mở cửa sổ **"Cập nhật danh mục giấy tờ (Checklist)"** của thủ tục trên, **không đổi gì về biểu mẫu**, chỉ sửa số lượng một dòng, rồi lưu:

```
PUT /api/v1/procedure-manager/procedures/21b557d3-89d3-4fa6-8186-afad7b1bda47/checklist
```

```json
{
  "title": "Checklist không hợp lệ.",
  "status": 400,
  "code": "validation.failed",
  "traceId": "0HNPV5BJL4GDU:00000001",
  "errors": {
    "ChecklistSchema": [
      "Giấy tờ 'GT_01' gắn biểu mẫu 'M25' không có trong formDefinitions (phải là biểu mẫu dùng chung hoặc cùng trường hợp với giấy tờ).",
      "Giấy tờ 'GT_06' gắn biểu mẫu 'TO_KHAI_LE_PHI_TRUOC_BA' không có trong formDefinitions (...).",
      "Giấy tờ 'GT_07' gắn biểu mẫu 'TO_KHAI_THUE_CA_NHAN' không có trong formDefinitions (...)."
    ]
  }
}
```

Ba mẫu `M25`, `TO_KHAI_LE_PHI_TRUOC_BA`, `TO_KHAI_THUE_CA_NHAN` **có trong `formDefinitions` của thủ tục** và đều là mẫu dùng chung (`caseCode` null). Thủ tục được tạo thành công với đúng các `formCodes` này qua `POST /procedure-manager/procedures`, và `GET` chi tiết trả đủ.

### Nguyên nhân (đã xác định trong source)

`Application/Management/ProcedureChecklist.cs`, `UpdateProcedureChecklistHandler.Handle`:

```csharp
var validation = await validator.ValidateAsync(
    new ProcedureInput { ChecklistSchema = input.Items, ContentPayload = p.ContentPayload },
    options => options.IncludeProperties(x => x.ChecklistSchema), ct);
```

`ProcedureInput` dựng để validate **không có `FormDefinitions`**. Rule BE-H (B.3.1) trong `ProcedureInputValidator` đọc `context.InstanceToValidate.FormDefinitions ?? []`, nên luôn thấy danh sách rỗng. Kết quả: **mọi giấy tờ có `formCodes` đều bị từ chối** ở API cập nhật riêng checklist, dù mẫu có thật.

### Đề nghị sửa (một dòng)

```diff
-    new ProcedureInput { ChecklistSchema = input.Items, ContentPayload = p.ContentPayload },
+    new ProcedureInput { ChecklistSchema = input.Items, ContentPayload = p.ContentPayload, FormDefinitions = p.FormDefinitions },
```

`FormDefinitions` lấy từ thủ tục đã lưu (`p`), vì API này không cho sửa biểu mẫu. Đề nghị thêm unit test: cập nhật checklist có `formCodes` trỏ tới biểu mẫu dùng chung của thủ tục thì hợp lệ; trỏ tới mã không tồn tại thì 400.

### Nghiệm thu

| # | Thao tác | Kỳ vọng |
|---|---|---|
| 1 | PUT checklist thủ tục `21b557d3-…`, giữ nguyên `formCodes` | 200; phiên bản +1; `formCodes` giữ nguyên |
| 2 | PUT checklist, `formCodes` có mã không có trong biểu mẫu của thủ tục | 400, thông báo nêu mã giấy tờ và mã mẫu |
| 3 | PUT checklist, `formCodes` trỏ tới mẫu của **trường hợp khác** | 400 |

---

Báo lại FE sau khi deploy (tag image + thời điểm) để FE chạy lại 2 bước nghiệm thu. Không gửi mật khẩu/token.
