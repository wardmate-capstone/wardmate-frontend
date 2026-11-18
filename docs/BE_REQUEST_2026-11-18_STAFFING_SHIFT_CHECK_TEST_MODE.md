# Đề nghị BE: Chế độ thử nghiệm bỏ qua kiểm tra ca làm khi giao hồ sơ, tham vấn và chuyển hồ sơ

> **Trạng thái 18/11/2026: BE đã làm và deploy** (STAFFING-TEST-01, nhánh `kha`, image `workflow-20261118-02`, DEPLOY-1118b). Cờ `Staffing__SkipShiftCheck`; chọn cách header `X-Staffing-Shift-Check: skipped` (đã expose qua CORS) ở `assignment-candidates` và `specialist-candidates`. FE đã nối: hai hộp thoại hiện dòng "Chế độ thử nghiệm". Tài liệu BE chưa ghi đã đặt biến môi trường `true` trên Azure hay chưa. Phần dưới giữ làm lịch sử.

| | |
|---|---|
| Ngày | 18/11/2026 |
| Mức độ | **Trung bình**: chặn việc thử nghiệm 3 chức năng trên môi trường Azure, không ảnh hưởng người dùng thật |
| Service cần sửa | **ApplicationWorkflow** |
| Service KHÔNG cần sửa | IAM, Catalog, DocumentForm, Gateway |
| Migration / SQL | Không |
| Cấu hình | Thêm 1 khóa cấu hình, mặc định tắt (mục 4) |
| FE | Không bắt buộc sửa. Mục 5 là phần tùy chọn để FE hiện cảnh báo khi đang bật |

---

## 1. Bối cảnh

Ba chức năng sau chỉ cho chọn cán bộ **đang có ca làm tại đúng thời điểm thao tác**:

| Chức năng trên FE | API | Chỗ kiểm tra (Workflow) |
|---|---|---|
| Manager giao / đổi cán bộ cho hồ sơ (Giám sát hồ sơ, Điều phối) | `GET /api/v1/manager/applications/{id}/assignment-candidates`, `POST /api/v1/manager/applications/{id}/assignments` | `DispatchService.Candidates` (~dòng 81), `DispatchService.Assign` (~dòng 103, lỗi 422 `officer_unavailable`) |
| Tham vấn chuyên môn: chọn và gửi cán bộ chuyên môn | `GET /api/v1/applications/{applicationId}/consultations/specialist-candidates`, `POST .../consultations/{id}/dispatch` | `ConsultationService.SpecialistReasons` (~dòng 34), dispatch (~dòng 145, lỗi 422 `specialist_ineligible`) |
| Đóng tham vấn và chuyển hồ sơ cho cán bộ chuyên môn | `POST .../consultations/{id}/close` (có chuyển hồ sơ) | `ConsultationService` (~dòng 190, lỗi 422 `officer_ineligible`) |

Cả ba đều gọi chung một hàm:

```csharp
// Infrastructure/StaffingService.cs, StaffingLocks.Availability
if (!await db.Shifts.AnyAsync(x => x.OfficerId == officer && x.WardCode == ward && x.CancelledAtUtc == null
        && x.StartsAtUtc <= now && x.EndsAtUtc > now, ct))
    reasons.Add("NO_ACTIVE_SHIFT");
if (await db.Leaves.AnyAsync(x => ... x.Status == "APPROVED" && x.StartsAtUtc <= now && x.EndsAtUtc > now, ct))
    reasons.Add("APPROVED_LEAVE");
```

## 2. Vấn đề khi thử nghiệm

- Người thử phải **đúng giờ có ca** của cán bộ đích thì mới giao, tham vấn hoặc chuyển hồ sơ được. Ngoài giờ ca, ví dụ buổi tối hoặc cuối tuần, cả ba chức năng đều không chọn được ai.
- Không tự tạo ca để thử được, vì `POST` tạo ca (`StaffingService`, ~dòng 57) yêu cầu ca **bắt đầu trong tương lai** và **dài tối đa 24 giờ**. Không tạo được ca phủ "ngay bây giờ", và ngày nào cũng phải tạo lại.
- Hiện **không có cờ cấu hình nào** để bỏ qua điều kiện này.

## 3. Yêu cầu

Thêm một chế độ thử nghiệm **chỉ bỏ qua điều kiện "phải có ca làm hiện tại"** (`NO_ACTIVE_SHIFT`), bật tắt bằng cấu hình, **mặc định tắt**.

Giữ nguyên mọi điều kiện khác:

- **Vẫn chặn nghỉ phép đã duyệt** (`APPROVED_LEAVE`), không giao việc cho người đang nghỉ;
- vẫn kiểm tra đúng phường, đang hoạt động, đúng vai trò, đúng lĩnh vực, đủ quyền, không phải chủ hồ sơ, không phải cán bộ đang thụ lý (với tham vấn);
- không đổi quy tắc tạo / sửa / hủy ca.

## 4. Gợi ý cách làm

1. Khóa cấu hình: `Staffing:SkipShiftCheck` (biến môi trường `Staffing__SkipShiftCheck`), kiểu `bool`, mặc định `false`. Không đặt `true` trong `appsettings.Production.json` của repo; chỉ bật bằng biến môi trường trên môi trường thử nghiệm.
2. `StaffingLocks.Availability` hiện là hàm `static` không đọc được cấu hình. Gợi ý: thêm tham số `bool skipShift` (hoặc một `IOptions<StaffingOptions>` được tiêm vào `StaffingService`, `DispatchService`, `ConsultationService`), rồi bỏ qua nhánh `NO_ACTIVE_SHIFT` khi bật. Nhánh `APPROVED_LEAVE` giữ nguyên.
3. Khi khởi động với cờ bật, ghi log cảnh báo một lần, ví dụ `Staffing shift check is DISABLED (test mode)`, để dễ phát hiện nếu quên tắt.
4. Test: cán bộ không có ca, cờ tắt → bị loại `NO_ACTIVE_SHIFT` (như hiện tại); cờ bật → hợp lệ; cán bộ đang nghỉ đã duyệt, cờ bật → vẫn bị loại `APPROVED_LEAVE`.
5. Ghi vào `docs/system-constraints.md` (mục staffing) và `docs/api-guide.md`.

## 5. (Tùy chọn) Cho FE biết cờ đang bật

Để FE hiện dòng cảnh báo "Đang ở chế độ thử nghiệm: bỏ qua kiểm tra ca làm" trên màn Điều phối và Tham vấn, tránh quên tắt khi dùng thật, BE chọn một trong hai cách:

- trả header `X-Staffing-Shift-Check: skipped` trong phản hồi của `assignment-candidates` và `specialist-candidates`; **hoặc**
- thêm trường `shiftCheckSkipped: true` vào một API cấu hình sẵn có mà FE đã gọi (ví dụ `GET /api/v1/system/app-config`, nếu phù hợp).

Nếu BE chưa làm mục này, FE vẫn dùng được chế độ thử nghiệm, chỉ không có cảnh báo.

## 6. Triển khai trên Azure

- Build và deploy image Workflow mới.
- Bật trên môi trường thử nghiệm: đặt biến môi trường `Staffing__SkipShiftCheck=true` cho Container App `wardmate-application-workflow` rồi khởi động lại.
- Tắt khi demo hoặc dùng thật: xóa biến hoặc đặt `false`.

## 7. Lưu ý nghiệp vụ

Đây chỉ là công cụ thử nghiệm. Quy tắc "cán bộ phải có lịch làm mới được giao hồ sơ" vẫn là quy tắc chính thức của hệ thống, và mặc định luôn bật.

## 8. Câu hỏi cần BE xác nhận

1. Môi trường Azure hiện tại có dùng chung cho thử nghiệm và demo không? Nếu dùng chung thì cần thống nhất ai bật/tắt cờ và vào lúc nào.
2. BE chọn cách nào ở mục 5 (header hay trường trong app-config), hay chưa làm?
