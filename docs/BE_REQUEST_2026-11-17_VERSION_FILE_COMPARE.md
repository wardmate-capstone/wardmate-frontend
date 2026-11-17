# Đề nghị BE: So sánh nội dung tờ khai Word và giấy tờ giữa các lần gửi

| | |
|---|---|
| Ngày | 17/11/2026 |
| Mức độ | **Trung bình**: chức năng chạy được, nhưng tab "So sánh các lần gửi" không cho cán bộ thấy công dân đã sửa gì trong tệp |
| Service cần sửa | **DocumentForm** (bắt buộc), **ApplicationWorkflow** (nếu chọn phương án gắn tệp vào snapshot, mục 4.2) |
| Service KHÔNG cần sửa | IAM, Catalog |
| Migration / SQL | **Có**: thêm bảng lịch sử phiên bản tệp (mục 4.1) |
| FE | Sẽ nối giao diện sau khi BE deploy (mục 6) |

---

## 1. Bối cảnh

Khi cán bộ yêu cầu bổ sung, công dân sửa hồ sơ rồi gửi lại, Workflow tạo phiên bản mới (lần gửi 1 → lần gửi 2). Tab **"So sánh các lần gửi"** của cán bộ dùng để xem công dân đã thay đổi gì, để biết họ có sửa đúng các điểm đã nhận xét hay không.

Hiện tab này **chỉ so sánh được**:

- thông tin kê khai trong `formData` (họ tên người nộp, CCCD, số điện thoại…);
- thông tin danh mục giấy tờ trong snapshot (trạng thái, số lượng, ghi chú…).

**Không so sánh được** nội dung tờ khai Word điền trực tuyến và giấy tờ công dân tải lên (ảnh, PDF).

### Ví dụ thực tế

Hồ sơ `HS-20261117-00000058`, phiên bản 2. Công dân sửa tờ khai Word mẫu số 15 rồi gửi lại. Tab so sánh báo *"Hai lần gửi không có thay đổi…"* vì `formData` và danh mục giấy tờ giống hệt lần 1. Cán bộ dễ hiểu nhầm là công dân không sửa gì.

Nếu công dân sửa ô họ tên **trong tờ khai Word** từ "Đức Anh" thành "Nguyễn Đức Anh", hiện không có cách nào cho cán bộ thấy thay đổi này ngoài việc tự mở tệp ra đọc lại toàn bộ.

## 2. Nguyên nhân phía BE

Đã đối chiếu mã nguồn:

1. **Mỗi mục giấy tờ chỉ có một bản ghi tờ khai, và tệp bị ghi đè khi lưu.**
   `SaveDraftSubmissionCommand.cs`: mỗi `(ApplicationId, ChecklistId)` chỉ có một `UserSubmission` (dòng 42–43, báo `document.draft_exists`). Mỗi lần lưu, BE tải lên blob mới rồi gọi `submission.SaveDraft(url, …)` (dòng 60), nên `FileUrl` trỏ sang tệp mới. **Không còn tham chiếu nào tới tệp của lần gửi trước.**
2. **Tờ khai do cán bộ chú thích cũng thay thế tệp hiện có.** Xem `SaveOfficerAnnotatedDocxCommand` ("DOCX mới (có comment) thay thế bản hiện có").
3. **Snapshot phiên bản của Workflow** (`GET /api/v1/applications/{id}/versions` → `snapshotData`) chỉ chứa `formData` và `checklists`, **không có** danh sách tệp hay mã phiên bản tệp.
4. **Giấy tờ tải lên** trong `GET …/contents` (`contentItemSchema`) **không có thời điểm tải lên**. FE vì vậy không biết giấy tờ nào mới được thay sau lần gửi trước.

## 3. FE đã tạm xử lý (không cần BE)

- Thông báo ở tab so sánh nói rõ "Nội dung tờ khai Word và giấy tờ đính kèm chưa được so sánh", kèm nút sang tab "Tờ khai & giấy tờ".
- Thêm phần **"Nhận xét ở lần gửi trước"** để cán bộ đối chiếu từng điểm đã yêu cầu sửa.
- Gắn nhãn **"Mới cập nhật sau lần gửi N"** cho tờ khai Word có `submittedAt` sau thời điểm gửi lần trước. **Giấy tờ tải lên chưa gắn nhãn được** vì thiếu ngày (mục 2.4).

## 4. Đề nghị

### 4.1. (Bắt buộc) Lưu lịch sử phiên bản tệp: DocumentForm

Không ghi đè mà giữ lại tệp của từng lần công dân **gửi** (không cần giữ mỗi lần lưu nháp).

Gợi ý bảng `submission_file_versions`:

| Cột | Kiểu | Ghi chú |
|---|---|---|
| `Id` | uuid | |
| `ApplicationId` | uuid | |
| `ChecklistId` | uuid | |
| `SourceType` | text | `SUBMISSION` (tờ khai Word) hoặc `SUPPORTING_DOCUMENT` (giấy tờ tải lên) |
| `SourceId` | uuid | Id của `UserSubmission` hoặc giấy tờ tải lên |
| `ApplicationVersionNumber` | int | Lần gửi của hồ sơ mà tệp này thuộc về |
| `BlobUrl` | text | Không xóa blob cũ khi công dân sửa |
| `FileName`, `FileSizeBytes`, `ContentType` | | |
| `Sha256` | text | Để biết tệp có thực sự thay đổi không |
| `CreatedAtUtc` | timestamptz | |

Thời điểm ghi: khi Workflow chuyển hồ sơ sang `SUBMITTED` hoặc `RESUBMITTED`, chụp lại tệp hiện tại của mọi mục cho phiên bản đó.

### 4.2. (Bắt buộc) API liệt kê tệp theo lần gửi

```
GET /api/v1/officer/applications/{applicationId}/files?versionNumber={n}
```

Trả về:

```json
[
  {
    "id": "…",
    "checklistId": "…",
    "sourceType": "SUBMISSION",
    "fileName": "mau-so-15.docx",
    "fileSizeBytes": 20480,
    "sha256": "…",
    "createdAtUtc": "2026-11-17T11:33:00Z"
  }
]
```

```
GET /api/v1/officer/applications/{applicationId}/files/{fileVersionId}/download
```

- Quyền: giống các API cán bộ hiện có (cán bộ đang thụ lý, không phải người nộp).
- Có `sha256` thì FE tự đánh dấu được **tệp mới / tệp bị thay / tệp bị xóa / không đổi** cho từng mục giữa hai lần gửi.
- Phương án thay thế: thêm danh sách tệp (id + sha256) vào `snapshotData` của Workflow khi tạo phiên bản. Khi đó API `/versions` hiện có đã đủ cho bước đánh dấu.

### 4.3. (Nên có) So sánh nội dung tờ khai Word theo trường

Để cán bộ thấy trực tiếp **"Họ tên: Đức Anh → Nguyễn Đức Anh"** trong tờ khai Word:

```
GET /api/v1/officer/applications/{applicationId}/files/diff?fromVersion=1&toVersion=2&checklistId={id}
```

Trả về theo đúng dạng `FieldDiffDto` mà `/diff` của Workflow đang dùng, để FE dùng lại giao diện hiện có:

```json
[
  { "fieldKey": "/docx/{checklistId}/hoTen", "fieldLabel": "Họ và tên", "oldValue": "Đức Anh", "newValue": "Nguyễn Đức Anh", "hasChanged": true, "oldExists": true, "newExists": true }
]
```

Cách làm gợi ý: mẫu tờ khai đã có các ô điền (content control hoặc placeholder) thì đọc giá trị từng ô của hai bản DOCX rồi so sánh. Nếu mẫu không có ô định danh, tối thiểu trả về so sánh theo đoạn văn (đoạn bị thêm / xóa / sửa).

### 4.4. (Nên có) Thêm thời điểm tải lên cho giấy tờ

Thêm `createdAtUtc` (hoặc `updatedAtUtc`) vào từng phần tử `supportingDocuments` và `submissions` của `GET /api/v1/officer/applications/{id}/contents`. FE sẽ gắn được nhãn "Mới cập nhật" cho cả giấy tờ tải lên mà không phải chờ 4.1–4.3.

## 5. Lưu ý nghiệp vụ

- Đây là hệ thống **tiền kiểm**. Lịch sử tệp chỉ phục vụ cán bộ đối chiếu, không phải lưu trữ hồ sơ chính thức.
- Dung lượng blob sẽ tăng theo số lần gửi lại. Có thể giới hạn chỉ giữ tệp của các lần gửi (không giữ bản nháp), và dọn khi hồ sơ đóng hoặc hủy theo chính sách lưu trữ hiện hành.
- Công dân **không** được truy cập tệp của lần gửi cũ qua API cán bộ.

## 6. FE sẽ làm sau khi BE xong

| BE xong | FE làm |
|---|---|
| 4.4 | Gắn nhãn "Mới cập nhật" cho cả giấy tờ tải lên |
| 4.1 + 4.2 | Tab so sánh có thêm phần "Tệp thay đổi" theo từng mục (mới / thay / xóa), nút mở bản cũ và bản mới cạnh nhau |
| 4.3 | Hiện thay đổi từng trường trong tờ khai Word cùng danh sách thay đổi `formData` |

## 7. Câu hỏi cần BE xác nhận

1. Chọn lưu danh sách tệp trong bảng riêng của DocumentForm (4.1) hay trong `snapshotData` của Workflow (4.2, phương án thay thế)?
2. Mẫu tờ khai DOCX hiện có ô điền định danh (content control) không? Nếu không, 4.3 chỉ làm được so sánh theo đoạn văn.
3. Chính sách lưu trữ và dọn blob của các lần gửi cũ là gì?
