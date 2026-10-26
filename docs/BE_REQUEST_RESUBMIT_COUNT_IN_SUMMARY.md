# Yêu cầu nhỏ cho BE ApplicationWorkflow: thêm `resubmitCount` vào danh sách hồ sơ

> **ĐÃ XONG – không cần gửi lại BE (26/10/2026).** Việc BE còn tồn đọng nằm duy nhất trong `docs/BE_REQUESTS_PENDING.md`.

*Ngày 23/10/2026 · Frontend Team · Mức độ: nên làm, không chặn*

> **Trạng thái 26/10/2026: ĐÃ XONG.** BE thêm `ResubmitCount` (int, mặc định 0) vào `ApplicationSummaryDto` ở cả 3 projection (commit `4b9d19d`, 24/10). FE dùng giá trị thật (`workflowAdapters.ts`); suy luận "SUBMITTED + có người phụ trách" chỉ còn là fallback khi response thiếu trường. Không cần BE làm thêm.

## Vấn đề

Khi công dân nộp lại hồ sơ bị yêu cầu bổ sung, `ResubmitApplicationCommand` xử lý như sau:
- tăng `ResubmitCount`;
- chuyển hồ sơ về `SUBMITTED`;
- **giữ nguyên** `AssignedOfficerId`.

Flow này đúng và FE đang dùng bình thường. Cán bộ phụ trách bấm "Review lại", FE gọi `POST /officer/applications/{id}/assign` để chuyển hồ sơ sang `UNDER_REVIEW`.

Tuy nhiên `ApplicationSummaryDto` (dữ liệu của `GET /officer/applications` và `GET /officer/applications/pending`) **không có `ResubmitCount`**. Vì vậy FE không biết hồ sơ nào là hồ sơ gửi lại.

Hiện FE tạm suy luận: hồ sơ `SUBMITTED` mà đã có `AssignedOfficerId` thì là hồ sơ gửi lại. Cách này dựa vào một quy tắc ngầm của BE: nhận xử lý luôn chuyển sang `UNDER_REVIEW`, nên hồ sơ mới nộp không bao giờ có người phụ trách. Nếu sau này BE đổi quy tắc đó (ví dụ thêm API trả hồ sơ về hàng đợi hoặc Manager giao hồ sơ), FE có thể hiển thị sai.

## Cần sửa

Thêm `int ResubmitCount` vào cuối `ApplicationSummaryDto`, có giá trị mặc định để không ảnh hưởng các chỗ đang tạo DTO.

- `WardMate.Services.ApplicationWorkflow.Application/WorkflowContracts.cs`, dòng 34:
  ```csharp
  public sealed record ApplicationSummaryDto(..., DateTime? DeadlinePausedAtUtc = null, int ResubmitCount = 0);
  ```
- Truyền `x.ResubmitCount` ở 3 chỗ `.Select(x => new ApplicationSummaryDto(...))`:
  - `WardMate.Services.ApplicationWorkflow.Infrastructure/ApplicationReviewStore.cs`, dòng 25 (pending) và dòng 64 (list);
  - `WardMate.Services.ApplicationWorkflow.Infrastructure/ApplicationStore.cs`, dòng 25 (danh sách của công dân).

Không cần migration, vì cột `resubmit_count` đã có trong bảng.

## Response mong muốn

```json
{
  "id": "…",
  "status": "SUBMITTED",
  "assignedOfficerId": "…",
  "resubmitCount": 1
}
```

FE đã sẵn sàng nhận trường này (kiểu nullable). Khi BE trả về, FE sẽ dùng giá trị thật thay cho suy luận, không cần sửa thêm phía FE.

## Không cần sửa

- Giữ bước "nhận lại" (`assign`) khi hồ sơ gửi lại. Bước này cho biết cán bộ bắt đầu kiểm tra phiên bản mới, và ghi đúng lịch sử `SUBMITTED → UNDER_REVIEW`.
- Không cần thêm trạng thái mới như `RESUBMITTED`.

## Kiểm thử đề xuất

1. Hồ sơ mới nộp: `resubmitCount = 0`.
2. Cán bộ yêu cầu bổ sung, công dân nộp lại, gọi `GET /officer/applications`: `status = SUBMITTED`, `resubmitCount = 1`, `assignedOfficerId` vẫn là cán bộ cũ.
3. Nộp lại lần 2: `resubmitCount = 2`.

---
Đây là một phần của `docs/OFFICER_CATEGORY_ROUTING_BACKEND_SPEC.md` (mục 3.1), tách riêng ra vì nhỏ và có thể làm ngay.
