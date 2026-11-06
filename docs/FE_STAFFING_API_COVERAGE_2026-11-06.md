# FE: bao phủ API lịch làm việc, nghỉ Word, điều phối và tham vấn

Cập nhật 06/11/2026: sau yêu cầu khóa lịch, có 45 nhánh UI hiện hành; hai route tạo/hủy ca cũ chỉ còn client tương thích, không có nút gọi từ FE. Bảng này ghi **call site và nhánh UI đã triển khai**, không đồng nghĩa 47 thao tác đều đã nghiệm thu với backend Azure có xác thực.

Đối chiếu: [bàn giao BE](Lịch%20làm%20việc%20Front%20Desk%20và%20đơn%20nghỉ%20Word.md), source BE local và [OpenAPI Gateway](https://wardmate-gateway.blackmeadow-a2f12767.japaneast.azurecontainerapps.io/api/application-workflow/swagger/v1/swagger.json). Tất cả route dưới đây có tiền tố `/api/v1`.

Client:

- **W**: `src/lib/api/workSchedules.ts` — 25 thao tác mới; binary Word riêng, multipart và Idempotency-Key.
- **S**: `src/lib/api/staffing.ts` — 18 thao tác cũ, cập nhật đọc version ca và trạng thái nghỉ.
- **C**: `src/lib/api/calendarClosures.ts` — 4 thao tác cũ, dùng chung với Admin theo phạm vi.

| # | Method + route | Client | UI / thao tác gọi |
|---|---|---|---|
| 01 | GET `/staffing/capabilities` | W.capabilities | Frontdesk mở Nghỉ phép; đọc lại trước nhánh nộp không Word |
| 02 | GET `/staffing/closures` | C.list | Lịch ngày nghỉ, lọc khoảng ngày |
| 03 | POST `/staffing/closures` | C.create | Manager khai báo ngày nghỉ phường |
| 04 | POST `/staffing/closures/national` | C.create | Admin khai báo ngày lễ toàn quốc |
| 05 | POST `/staffing/closures/{id}/cancel` | C.cancel | Hủy ngày nghỉ đúng phạm vi |
| 06 | GET `/staffing/shifts` | S.shifts | Danh sách ca theo khoảng ngày; ngữ cảnh ca qua đêm từ tháng trước trên bảng tháng |
| 07 | POST `/staffing/shifts` | S.createShift | Client cũ, không còn UI gọi; tạo ca qua draft/publish lịch tháng |
| 08 | POST `/staffing/shifts/{id}/cancel` | S.cancelShift | Client cũ, không còn UI gọi; bỏ ca qua sửa lịch tháng và công bố |
| 09 | GET `/staffing/schedules/{month}` | W.month | Lịch tháng/bảng danh sách; đọc daysOff, isPublished, canEdit, editDeadlineUtc |
| 10 | GET `/staffing/week-pattern` | W.week | Tiện ích xếp lịch → Thiết lập giờ hằng tuần |
| 11 | PUT `/staffing/week-pattern` | W.saveWeek | Lưu mẫu tuần với version nền |
| 12 | GET `/staffing/schedules/{month}/preview` | W.preview | Tiện ích điền ngày trống từ giờ tuần/tháng nguồn; copyFrom là query tùy chọn |
| 13 | PUT `/staffing/schedules/{month}/draft` | W.saveMonth | Tick nghỉ tự lưu draft ngay; công bố lưu nếu còn thay đổi; gửi đầy đủ slots + daysOff cả phường, expectedVersion/fingerprint |
| 14 | POST `/staffing/schedules/{month}/publish` | W.publish | Nút dưới bảng lịch → xem giờ cũ/mới và toàn bộ cán bộ bị ảnh hưởng → công bố; xác nhận ngoại lệ ngày lễ riêng |
| 15 | GET `/staffing/schedules/{month}/history` | W.history | Lịch sử BASELINE/PUBLISHED |
| 16 | POST `/staffing/schedules/{month}/confirm` | W.confirm | Frontdesk xác nhận fingerprint lịch cá nhân |
| 17 | GET `/staffing/leave-templates/current` | W.template | Tạo nháp Word hoặc xem mẫu hiện hành |
| 18 | GET `/staffing/leave-templates/{id}/docx` | W.templateDocx | Nút Xem mẫu Word chung; đọc chỉ xem và kiểm tra SHA-256 |
| 19 | POST `/staffing/leave-drafts` | W.createDraft | Tạo nháp Word riêng, key/body giữ nguyên khi gửi lại |
| 20 | GET `/staffing/leave-drafts` | W.drafts | Nháp của tôi, phân trang |
| 21 | GET `/staffing/leave-drafts/{id}` | W.draft | Mở/đọc lại nháp; kiểm tra trước sửa hoặc mở Word |
| 22 | GET `/staffing/leave-drafts/{id}/docx` | W.draftDocx | Soạn/mở lại Word riêng của nháp |
| 23 | PATCH `/staffing/leave-drafts/{id}` | W.editDraft | Sửa thông tin nghỉ; sau đó phải lưu lại Word |
| 24 | PUT `/staffing/leave-drafts/{id}/docx` | W.saveDocx | Lưu nháp Word multipart kèm version/metadataVersion |
| 25 | DELETE `/staffing/leave-drafts/{id}` | W.deleteDraft | Xóa nháp có xác nhận, expectedVersion trong query |
| 26 | POST `/staffing/leave-drafts/{id}/submit` | W.submit | Nộp bản Word đã lưu, key riêng với thao tác tạo nháp |
| 27 | POST `/staffing/leaves` | S.requestLeave | Nhánh không Word chỉ khi capability cho phép và người dùng chủ động chọn |
| 28 | GET `/staffing/leaves` | S.leaves | Danh sách đơn đã nộp theo khoảng ngày |
| 29 | GET `/staffing/leaves/{id}` | W.leaveDetail | Detail chủ đơn/Manager; đọc mới trước quyết định và xem Word |
| 30 | GET `/staffing/leaves/{id}/submitted-docx` | W.submittedDocx | Word đã nộp chỉ đọc, đối chiếu hash từ detail |
| 31 | GET `/staffing/leaves/{id}/shift-impact` | W.shiftImpact | Manager xem ca gốc và phần giao thời gian nghỉ |
| 32 | GET `/staffing/leaves/{id}/impact` | S.impact | Manager xem hồ sơ cán bộ đang giữ để bàn giao |
| 33 | POST `/staffing/leaves/{id}/decision` | S.decide | Duyệt/từ chối/hủy theo trạng thái, quyền và version |
| 34 | GET `/staffing/leaves/{id}/history` | S.leaveHistory | Lịch sử quyết định trong detail |
| 35 | GET `/manager/applications` | S.applications | Điều phối hồ sơ, phân trang |
| 36 | GET `/manager/applications/{id}/assignment-candidates` | S.candidates | Chọn cán bộ đủ điều kiện khi phân công/bàn giao |
| 37 | POST `/manager/applications/{id}/assignments` | S.assign | Phân công/chuyển cán bộ hoặc bàn giao từ đơn nghỉ |
| 38 | GET `/manager/applications/{id}/assignments` | S.assignments | Lịch sử phân công |
| 39 | GET `/staffing/shift-change-requests` | W.changes | Tab Yêu cầu đổi ca, phân trang theo vai trò |
| 40 | POST `/staffing/shift-change-requests` | W.requestChange | Frontdesk chọn ca tương lai, đề nghị giờ mới với version thật |
| 41 | POST `/staffing/shift-change-requests/{id}/decision` | W.decideChange | Manager duyệt/từ chối theo ID yêu cầu; không bịa expectedVersion |
| 42 | POST `/applications/{applicationId}/consultations` | S.createConsultation | Manager gửi yêu cầu tham vấn trên hồ sơ đang kiểm tra |
| 43 | GET `/staffing/consultations` | S.inbox | Hộp thư tham vấn theo vai trò |
| 44 | GET `/applications/{applicationId}/consultations` | S.consultations | Tham vấn cùng hồ sơ; kiểm tra mới trước trả lời/đóng |
| 45 | GET `/applications/{applicationId}/consultations/document-access` | S.documentAccess | Chuyên viên kiểm tra quyền xem tài liệu hồ sơ |
| 46 | POST `/applications/{applicationId}/consultations/{id}/answer` | S.answer | Chuyên viên trả lời theo version |
| 47 | POST `/applications/{applicationId}/consultations/{id}/close` | S.close | Manager đóng tham vấn, có lý do |

Hai API phân công khác (`assignment-summary`, PUT `assignee`) giữ client và UI Giám sát hồ sơ hiện có, không gộp vào con số 47 hoặc tạo thao tác trùng nhau.

## Các quy tắc FE đã áp dụng

- Cache staffing có danh tính, phường, vai trò/quyền; đọc lại khi mount và không tự retry mutation. State màn lịch/nghỉ tách khi danh tính/phạm vi đổi.
- Dữ liệu ghi dùng đúng version/fingerprint, schema response và đối chiếu ID/metadata cần thiết. 409 không tự ghi đè; giữ thông tin đang chỉnh, yêu cầu người dùng xem lại.
- Lịch nháp gửi đủ slots/ID/version, ca đã bắt đầu được giữ nguyên; bộ lọc chỉ thay hiển thị. Công bố có tổng hợp số ca và cảnh báo hủy, mặc định không cho ngoại lệ ngày đóng cửa.
- Một người được nhiều ca không trùng/ngày; ca nối nhau không coi trùng, ca qua ngày được hỗ trợ. Sao chép theo ngày trong tháng theo BE thực tế.
- Word: capability bắt buộc thì không fallback API cũ; tải/soạn bản riêng, không sửa mẫu; sau đổi metadata phải lưu lại; nộp tách khỏi lưu, bản nộp chỉ đọc. Không giả lập ký số hoặc Word tự điền trường nếu BE chưa làm.
- Lỗi upload/binary/response không được coi là thành công. Đối chiếu hash khi đọc mẫu/bản nộp, không so hash bản đã điền với hash mẫu.
- SYSTEM_ALERT staffing hiện không chứa actionUrl/resourceId; FE điều hướng đến đúng nhóm danh sách lịch/nghỉ/đổi ca dựa trên loại thông báo nhận được, không gán ID staffing thành ID hồ sơ công dân. Không gửi thêm POST thông báo.

## Kiểm tra

Kết quả thực chạy và giới hạn nghiệm thu được ghi tại mục triển khai mới nhất trong `PROGRESS.md`. Tests mới: `tests/work-schedules.spec.ts`, fixture `tests/fixtures/workSchedules.ts`; hồi quy `staffing-ui`, `manager`, `docx-online`; proxy kiểm tra method, query, multipart và Idempotency-Key. Test Word dùng gói DOCX thật do fixture tạo, API nghiệp vụ được mock.

Chưa dùng tài khoản thật để xác minh hai phường, storage, chính sách mẫu chung hoặc thông báo Azure. Không chỉnh backend, cấu hình template/storage hoặc credentials trong task FE này.
