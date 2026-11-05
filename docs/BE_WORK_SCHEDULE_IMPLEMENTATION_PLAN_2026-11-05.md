# Kế hoạch Backend: lịch làm việc và đơn nghỉ Word

Ngày: 05/11/2026. Trạng thái: tài liệu bàn giao triển khai đề xuất; chưa sửa BE, chưa có API mới được nghiệm thu.

Tài liệu đầu vào: [WORK_SCHEDULE_ADAPTATION_PLAN_2026-11-05.md](WORK_SCHEDULE_ADAPTATION_PLAN_2026-11-05.md). Yêu cầu đã xác nhận: Frontdesk soạn **mẫu đơn Word trực tiếp trên hệ thống**, lưu nháp rồi nộp Manager.

## 1. Mục tiêu và thứ tự ưu tiên

1. **P0 — Đơn nghỉ Word:** mẫu/version, nháp, lưu DOCX, nộp bản bất biến, đọc đúng bản đã nộp, giữ luồng quyết định/lịch sử/bàn giao hiện có.
2. **P1 — Lịch tháng:** cấu hình/mẫu tuần, sinh/sao chép, xem trước, nháp/công bố, sửa lịch có version, tương thích ca cũ.
3. **P2 — Xác nhận và thông báo:** xác nhận phiên bản lịch; phát thông báo lịch/nghỉ qua outbox, có theo dõi gửi lại.
4. **P3 — Đổi ca:** yêu cầu đổi thời gian ca của mình, Manager quyết định; chưa có hoán đổi hai cán bộ.

Phân quyền, chống xung đột, audit và bảo toàn dữ liệu phải có ngay trong từng gói. Không mở rộng sang chấm công, bảng phép năm, ký số hoặc tự động bàn giao hồ sơ.

## 2. Nền tảng cần giữ

Đối chiếu source BE local trong `E:/wardmate-backend/src/Services/WardMate.Services.ApplicationWorkflow/`:

| Vị trí | Vai trò hiện tại | Hướng mở rộng |
|---|---|---|
| `Application/StaffingContracts.cs` | Input ca, nghỉ, quyết định; interface staffing | Thêm hợp đồng riêng cho nháp/tệp/nộp và lịch tháng; không thay input cũ âm thầm |
| `Domain/OfficerAvailability.cs` | `OfficerShift`, `OfficerLeave`, `OfficerLeaveDecision` | Giữ ca/nghỉ chính thức, bổ sung liên kết bản nộp và phiên bản |
| `Infrastructure/StaffingService.cs` | Tạo/hủy ca, gửi/duyệt nghỉ, tác động/lịch sử | Tái sử dụng validation, kiểm tra khả dụng và khóa phường |
| `Infrastructure/WorkflowDbContext.cs` | DbSet staffing, `WorkflowOutbox`, capture khi SaveChanges | Migration bổ sung, ràng buộc DB; kiểm tra capture/worker trước khi thêm loại sự kiện |
| `API/Controllers/StaffingController.cs` | API staffing đang được FE dùng | Giữ đường cũ; API mở rộng phải có OpenAPI và test hợp đồng |
| `API/WorkflowSecurity.cs` | Policy role + permission | Mở rộng theo cùng nguyên tắc và kiểm tra chủ sở hữu/phường trong service |

Các path trên là đường dẫn tương đối bên trong service, với tên thư mục dự án đầy đủ `WardMate.Services.ApplicationWorkflow.Application`, `.Domain`, `.Infrastructure`, `.API`.

Hành vi hiện tại phải được giữ:

- Ca tạo mới bắt đầu trong tương lai, tối đa 24 giờ; chống trùng ca và nghỉ đã duyệt; đọc lịch tối đa 93 ngày.
- Nghỉ gửi trực tiếp nhận `startsAt`, `endsAt`, `reason`; lý do tối đa 2.000 ký tự; khoảng nghỉ tối đa 93 ngày và chưa kết thúc. Nộp mới không tự đổi sang quy tắc “bắt đầu trong tương lai” nếu chưa được chốt.
- Nghỉ `PENDING`/`APPROVED` giao nhau bị từ chối khi gửi. Nháp mới có thể trùng để soạn; phải kiểm tra lại tại lúc nộp.
- Quyết định dùng `expectedVersion`, có lịch sử và khóa theo phường. Frontdesk chỉ hủy đơn `PENDING` của mình; Manager không tự duyệt đơn của mình.
- Availability kiểm tra khoảng nửa mở `[start, end)`: đang trong ca chưa hủy và không trong nghỉ `APPROVED`. Không đưa nháp, xác nhận nhận lịch hoặc thời điểm gửi thông báo vào điều kiện khả dụng.
- Duyệt nghỉ không xóa ca, không tự chuyển hồ sơ. API impact hiện trả hồ sơ cán bộ đang giữ; không phải dự báo theo kỳ nghỉ.

## 3. Phân chia trách nhiệm dịch vụ

- **Workflow:** sở hữu đơn nghỉ, chủ đơn/phường, trạng thái, revision, bản nộp, quyết định, lịch và khả dụng. Quyền truy cập tài liệu phải được xác nhận theo các dữ liệu này.
- **Storage/tài liệu:** lưu mẫu và DOCX qua hạ tầng được xác minh, hỗ trợ đọc/lưu tệp nội bộ. BE cần quyết định dùng adapter storage trong Workflow hay một API tài liệu nội bộ có service authentication. Không chia sẻ transaction DB xuyên hai dịch vụ.
- **IAM:** danh tính, vai trò, permission và phạm vi đơn vị. Không nhận `officerId`, `wardCode`, người nộp/người duyệt tùy ý từ FE cho thao tác nghỉ của chính mình.
- **Notification:** nhận sự kiện sau commit qua outbox và chống gửi lặp. Trước khi triển khai phải đối chiếu schema event, routing, recipient và worker thực tế; chưa coi capture hiện có tự hỗ trợ sự kiện staffing.
- Không gọi API bản khai công dân bằng hồ sơ/checklist giả để lưu đơn nhân sự. Không tạo dependency mới nếu adapter/storage hiện có đáp ứng được.

## 4. P0: mô hình dữ liệu đề xuất

Tên dưới đây là thiết kế đề xuất, chưa phải entity/DTO hiện có.

| Đối tượng | Dữ liệu chính | Ràng buộc |
|---|---|---|
| Mẫu đơn nghỉ và phiên bản | ID, phạm vi áp dụng, version, storage key nội bộ, SHA-256, trạng thái áp dụng, người/thời gian tạo | Mỗi version bất biến; mẫu mới không đổi nháp/bản nộp đã pin mẫu cũ; quyền quản lý mẫu cần chốt |
| `OfficerLeaveDraft` | ID, officer/phường, thời gian nghỉ, reason ngắn, templateVersionId, currentDocumentRevisionId, version, trạng thái nháp, submittedLeaveId | Chủ đơn được sửa nháp; nộp một lần; không xuất hiện trong danh sách nghỉ chính thức hoặc availability |
| Revision tài liệu | ID, draftId, templateVersionId, metadataVersion đã dùng, storage key, tên hiển thị, size, hash, người/thời gian lưu | Tệp immutable; revision cũ không bị ghi đè; không cho gắn tệp của đơn/người khác |
| Bản nộp | leaveId, draftId, documentRevisionId, templateVersionId, snapshot thông tin người nộp/đơn vị/thời gian/reason, submittedAt | Một bản nộp cho một leave, một leave cho một draft; giữ đúng metadata/tệp đã nộp |
| Audit nháp/nộp | actor, đơn/phường, thao tác, thời gian, version trước/sau, revision liên quan | Không ghi toàn bộ nội dung Word/lý do vào log chung; không thay thế `OfficerLeaveDecision` |
| Idempotency record | actor, phạm vi/thao tác, key, request hash, trạng thái/kết quả/ID đã tạo | Unique theo actor + thao tác + key; key trùng nội dung khác bị từ chối |

**Đề xuất tương thích:** tách nháp khỏi `OfficerLeave`; khi nộp mới tạo `OfficerLeave` ở `PENDING` trong cùng transaction với bản nộp. Như vậy không cần đưa `DRAFT` vào check constraint trạng thái nghỉ cũ và FE cũ không nhận trạng thái lạ. Trạng thái quyết định tiếp tục đọc từ `OfficerLeave`, không nhân đôi sang nháp.

Các ràng buộc/index tối thiểu: unique liên kết draft–leave; FK revision thuộc đúng draft; version chống ghi đè; index nháp theo chủ đơn/phường/thời gian cập nhật; index nghỉ theo phường/cán bộ/kỳ; lưu đầy đủ audit hiện có. Nháp đã xóa không được nộp lại. Xóa nháp không được cascade xóa tài liệu của bản nộp.

Đơn cũ không có bản nộp Word được phân biệt bằng nguồn dữ liệu/version; vẫn đọc và quyết định được. Không tự tạo Word giả cho dữ liệu cũ.

## 5. P0: hợp đồng chức năng cần bàn giao cho FE

Không tự coi method/path mới là API đã tồn tại. BE cần cung cấp OpenAPI cho từng năng lực dưới đây; FE chỉ tích hợp sau khi đối chiếu hợp đồng thật.

| Năng lực | Đầu vào tối thiểu đề xuất | Kết quả FE cần |
|---|---|---|
| Lấy mẫu áp dụng | Ngữ cảnh người đang đăng nhập | templateId/version, tên, khả năng sử dụng; tải DOCX qua quyền truy cập |
| Tạo nháp | Thời gian nghỉ, reason ngắn, templateVersion, idempotency key | draftId/version, metadata, trạng thái khởi tạo Word, revision nếu đã sẵn sàng |
| Danh sách nháp cá nhân | Phân trang/lọc theo hợp đồng | items/page/pageSize/total; không trả nháp người khác cho Manager |
| Đọc chi tiết nháp | draftId | Metadata, version, revision hiện tại, quyền/thao tác cho phép |
| Sửa thông tin nháp | draftId, expectedVersion, thời gian/reason | Version mới, trạng thái cần xem lại Word khi metadata đổi |
| Lưu Word | draftId, expectedVersion, DOCX multipart, metadataVersion | documentRevisionId/hash/size, draft version mới; không trả thành công khi storage chưa lưu được |
| Đọc Word | ID nháp/bản nộp và revision được phép | Binary DOCX + Content-Type/Content-Disposition phù hợp; không lộ storage key/credential |
| Xóa nháp | draftId, expectedVersion | Kết quả xóa hợp lệ, không xóa leave đã nộp |
| Nộp nháp | draftId, expectedVersion, documentRevisionId, metadataVersion đã xem lại, idempotency key | leaveId, status `PENDING`, version, submittedAt và tham chiếu bản nộp |
| Đọc chi tiết đơn đã nộp | leaveId | Thông tin nghỉ, trạng thái/version, bản Word đã nộp hoặc cờ dữ liệu cũ, thông tin thao tác theo quyền |
| Đọc tác động lịch | leaveId | Ca gốc giao với kỳ nghỉ, phần thời gian giao nhau; tách khỏi danh sách hồ sơ impact hiện có |

Quy ước chung:

- Timestamp có offset, lưu UTC, tính tháng/ngày theo `Asia/Ho_Chi_Minh`. FE gửi offset rõ, không phụ thuộc múi giờ máy chủ.
- Client cần ID ổn định, version, trạng thái và thông tin tệp; danh sách không tải kèm blob/nội dung toàn bộ tài liệu.
- Lỗi theo định dạng hiện có của Workflow, có code ổn định, message tiếng Việt, field errors và correlation ID khi hệ thống hỗ trợ. Mapping đề xuất: validation 400, chưa xác thực 401, thiếu quyền 403, không tìm thấy/ngoài phạm vi theo quy ước bảo mật 404, version/trạng thái/trùng lịch 409, quá lớn 413, sai định dạng 415, dependency không khả dụng 503. Đối chiếu cách dùng 422 hiện có, không đổi nghĩa mã lỗi đang được FE xử lý.
- Cần phân biệt lỗi revision đã cũ, thiếu tệp, tệp chưa sẵn sàng, metadata chưa được xác nhận, storage lỗi và đơn đã nộp. Tên code mới do BE thống nhất và đưa vào OpenAPI/test, không chỉ trả text tự do.
- Không đưa chữ “Đã nộp/Đã duyệt” vào response thành công trước khi transaction nghiệp vụ commit.

## 6. P0: luồng Word, transaction và chống mất dữ liệu

### 6.1. Tạo mẫu và lưu nháp

- Pin version mẫu tại thời điểm tạo nháp. Tạo bản Word riêng từ mẫu; không cho FE sửa tệp mẫu dùng chung.
- Các trường tên/đơn vị lấy từ dữ liệu tin cậy, thời gian từ metadata có cấu trúc. Cơ chế điền mẫu phải test với DOCX thực và editor FE hiện có; không cam kết khóa từng vùng Word nếu chưa kiểm chứng.
- Thời gian nghỉ trong DB là nguồn tính lịch. Word dùng giải trình. Nếu metadata đổi sau khi soạn, đánh dấu cần xem lại tài liệu và yêu cầu lưu/xác nhận revision tương ứng trước nộp; không phân tích ngày nghỉ tự do từ nội dung DOCX để cập nhật lịch.
- Bản nộp nên có thông tin thời gian chuẩn được tạo từ DB hoặc hiển thị kèm tài liệu rõ ràng; không quảng bá cơ chế xác nhận revision như bằng chứng Word tự do luôn khớp dữ liệu DB.
- Mỗi lần upload tạo object/revision mới. Lưu tệp ngoài transaction khóa phường; khi gắn revision vào draft, kiểm tra lại quyền, version và trạng thái. Xung đột thì không thay currentRevision, có cơ chế dọn object mồ côi sau thời gian an toàn.
- Nếu khởi tạo Word lỗi, không tạo leave `PENDING`. Nháp chỉ được trả là sẵn sàng khi đã có tệp đọc được; có khả năng thử lại khởi tạo mà không nhân đôi nháp.

### 6.2. Nộp đơn

1. Xác thực chủ đơn/phường, quyền, trạng thái nháp và idempotency key.
2. Xác minh revision thuộc nháp, tệp đã lưu hoàn tất, hash/metadataVersion phù hợp và có mẫu được pin. Không cho dùng một documentRevisionId tùy ý.
3. Mở transaction DB và lấy cùng khóa phường đang dùng cho staffing/assignment; khóa/kiểm tra draft version để chặn upload, xóa và nộp đồng thời.
4. Kiểm tra lại khoảng nghỉ và giao với đơn `PENDING`/`APPROVED`. Dùng quy tắc hiện tại, không xét draft khác như nghỉ có hiệu lực.
5. Tạo leave `PENDING`, snapshot bản nộp bất biến, đóng nháp, ghi audit/idempotency và sự kiện outbox nếu đã có hợp đồng event.
6. Commit rồi trả kết quả. Sau nộp, mọi đường sửa/xóa nháp hoặc ghi Word phải từ chối.

Nếu mất response sau commit, replay cùng key/nội dung phải tìm lại đúng leave và kết quả đã tạo; thao tác nộp lại cùng draft không tạo leave thứ hai. Khác key cũng bị unique draft–leave chặn. Cùng key khác nội dung phải báo xung đột.

### 6.3. Duyệt, từ chối và hủy

- Tái sử dụng policy quyết định hiện tại, `expectedVersion`, khóa phường và `OfficerLeaveDecision`. Kiểm tra tất cả điều kiện ở BE, không dựa vào nút ẩn của FE.
- Quyết định chỉ thực hiện trên trạng thái cho phép và kỳ nghỉ chưa kết thúc; không tự duyệt, không sửa snapshot/tệp sau nộp.
- Hai Manager cùng quyết định: đúng một quyết định được ghi; lần còn lại nhận conflict và đọc lại dữ liệu.
- Duyệt nghỉ làm availability loại thời gian nghỉ như hiện tại. Giữ ca gốc, không tự bàn giao. Hủy nghỉ không tự sinh ca hoặc khôi phục người phụ trách cũ.
- Timeout quyết định: client đọc lại chi tiết/lịch sử trước khi thử. Nếu bổ sung idempotency cho quyết định, bảo đảm replay không thêm dòng lịch sử hoặc sự kiện thứ hai.

### 6.4. Kiểm soát tệp

- Chỉ DOCX theo hợp đồng; kiểm tra thực chất gói ZIP/OpenXML, kích thước giải nén/số entry, đường dẫn entry bất thường, không chỉ đuôi file/MIME. Không cho DOCM, macro hoặc xử lý nội dung/quan hệ ngoài không được hỗ trợ.
- Đề xuất giới hạn ban đầu 10 MiB/tệp để BE và FE thống nhất; đây chưa phải cấu hình hiện có. Chốt cùng giới hạn request Gateway và giới hạn đọc tài liệu.
- Tên lưu/storage key do server tạo; không lấy path từ tên file người dùng. Tên tải xuống được làm sạch; hash và size lưu theo nội dung thực.
- Đọc tệp phải kiểm tra lại quyền theo leave/draft và revision. Nếu dùng URL ký, URL chỉ dành cho đúng object, có hạn ngắn theo cấu hình; với bản nghỉ nhạy cảm ưu tiên tải qua API kiểm soát quyền. Không trả URL công khai dài hạn.
- Thống nhất retention trước khi bật dọn tệp. Không xóa revision đang được snapshot tham chiếu; không log nội dung nghỉ, token hoặc URL ký.

## 7. Quyền truy cập

| Thao tác | Frontdesk | Manager |
|---|---|---|
| Đọc mẫu áp dụng | Có quyền staffing và đúng phạm vi | Theo quyền đọc mẫu được chốt |
| Tạo/sửa/xóa nháp, lưu Word | Chính mình; role Frontdesk không kiêm Manager + `workflow.leave.request`, giữ yêu cầu đọc staffing của API | Không sửa nháp thay người khác |
| Nộp đơn | Chính mình, đúng revision/version | Không nộp thay trong đợt đầu |
| Đọc đơn và Word đã nộp | Chủ đơn + quyền đọc staffing | Đúng phường + quyền đọc staffing; đọc để quyết định theo quyền manage |
| Duyệt/từ chối | Không | Role Manager + `workflow.staffing.manage`, không tự duyệt |
| Hủy đơn chính thức | Chủ đơn `PENDING`, đúng quyền hiện tại | `PENDING`/`APPROVED` theo điều kiện hiện có |
| Quản lý mẫu/lịch | Không | Lịch dùng manage; quyền quản lý mẫu cần chốt với IAM |

`workflow.staffing.decide` hiện là policy tổ hợp, không phải permission FE cần thêm vào token. Nếu thêm quyền quản lý mẫu hoặc xác nhận lịch, phải có migration IAM, mapping role và test deny/allow; không chỉ khai báo policy ở API.

## 8. P1: thiết kế lịch tháng tương thích ca cũ

- Thêm aggregate **WardSchedule** theo phường + năm/tháng Việt Nam, unique một bảng lịch chính; có version đang công bố và bản chỉnh sửa nháp riêng. Tạo nháp chỉnh sửa không được làm lịch đang công bố ngừng hiệu lực.
- Mẫu tuần có ngày/giờ/phạm vi/version; giờ làm theo cấu hình đơn vị. Không hardcode giờ hành chính. Lễ/đóng cửa là dữ liệu tham chiếu riêng; mặc định cảnh báo/bỏ qua khi sinh lịch theo cấu hình và có ngoại lệ được Manager xác nhận có lý do.
- Đề xuất lưu các dòng nháp trong bảng revision lịch; **chỉ khi công bố** mới đồng bộ transactionally sang `OfficerShift` hiệu lực và snapshot revision. Cách này giữ availability đọc một nguồn ca chính thức, không vô tình nhận ca nháp.
- Giữ ID ca đang tồn tại khi không thay đổi; ánh xạ dòng lịch–ca chính thức. Các ca gốc liên quan revision cũ không xóa lịch sử. Không cascade xóa ca khi xóa bản nháp.
- Preview sinh/sao chép trả ca dự kiến, xung đột, ngoại lệ và dữ liệu/version nền. Công bố phải kiểm tra lại; preview không giữ chỗ lịch.
- Sao chép theo mẫu tuần/thứ/ngày trong tháng, xử lý ngày không tồn tại, năm nhuận, kỳ qua ngày và ngày lễ. Chốt giới hạn batch và kích thước response để tránh transaction quá lớn.
- Công bố dưới khóa phường: kiểm tra quyền/phiên bản, ca tương lai, tối đa 24h/ca, nhân sự hợp lệ, trùng nội bộ batch, trùng ca hiệu lực ngoài batch và nghỉ đã duyệt; transaction all-or-nothing.
- Khi sửa lịch đã công bố: chỉ đổi ca tương lai trong đợt đầu; ca đang diễn ra/đã qua giữ nguyên. Sửa thời gian/người phải là một thao tác nguyên tử có lý do, audit và event, không ghép hai API hủy/tạo ở FE.
- API tạo/hủy ca đơn lẻ cũ vẫn phải đồng bộ aggregate/version nếu ca thuộc lịch tháng. Không được để lối ghi cũ bỏ qua version hoặc làm bản nháp cũ công bố ghi đè ca vừa tạo. Cùng khóa phường và kiểm tra lại khi publish.
- Ca qua ranh giới tháng cần một nguồn sở hữu rõ (đề xuất tháng của thời điểm bắt đầu tại Việt Nam); kiểm tra xung đột cả phần nằm ngoài tháng. Hủy phần nghỉ không đồng nghĩa hủy toàn ca qua ngày.
- Migration lịch cũ không đổi ID, thời gian, người tạo/hủy hoặc khả dụng. Nhóm ca theo phường/tháng thành revision nền hiệu lực, xử lý ca qua tháng theo quy tắc đã chốt.

Hợp đồng năng lực P1: đọc lịch tháng với version, cấu hình/mẫu tuần, tạo/sửa nháp, preview sinh/sao chép, công bố, đọc lịch sử và ca ảnh hưởng. Response lịch cần phân biệt ca gốc, nghỉ đã duyệt và ngày đóng cửa; Frontdesk chỉ nhận lịch/nghỉ của mình.

## 9. P2 và P3

**Xác nhận:** lưu `(scheduleId, officerId, relevantRevision, confirmedAt)` với unique phù hợp; chỉ xác nhận phiên bản hiện hành liên quan chính mình. Thay lịch người khác không tự mất xác nhận của người không bị ảnh hưởng. Giữ lịch sử, không xem xác nhận là chấm công hoặc quyền nhận hồ sơ.

**Thông báo:** mở rộng hợp đồng event cho nộp/quyết định nghỉ, công bố/điều chỉnh lịch và đổi ca. Event vào cùng transaction với thay đổi nghiệp vụ; worker phát sau commit, consumer deduplicate theo event ID. Payload chỉ ID/phạm vi/loại thay đổi và thông tin tối thiểu, không chứa lý do nhạy cảm/nội dung Word. Tái sử dụng `WorkflowOutbox` sau khi kiểm tra capture/worker; không gọi gửi trực tiếp trước commit. Thông báo gửi lỗi không rollback quyết định hoặc nhân đôi đơn. Nếu BE/FE chưa hỗ trợ deep link, bàn giao hợp đồng điều hướng thay vì giả định bấm thông báo mở đúng đơn.

**Đổi ca:** entity riêng liên kết ca gốc/version, thời gian đề xuất, lý do và trạng thái. Khi duyệt kiểm tra lại ca/nhân sự/nghỉ dưới khóa phường; ghi quyết định và cập nhật ca trong một transaction. Ca gốc thay đổi hoặc hết thời hạn thì conflict, không âm thầm duyệt trên version mới. Đợt đầu không hỗ trợ hoán đổi hai người hoặc tự tìm người thay.

## 10. Backlog có thể giao việc

| Mã | Công việc | Phụ thuộc | Sản phẩm bàn giao |
|---|---|---|---|
| BE-WS-00 | Chốt ADR storage/mẫu, metadata Word, quyền và OpenAPI P0 | Mẫu DOCX và chính sách lưu trữ | ADR + schema/sequence + lỗi + ví dụ request/response, chưa có endpoint giả ở FE |
| BE-WS-01 | Migration nháp/revision/bản nộp/idempotency và mapping EF | 00 | Migration chạy được trên DB có dữ liệu cũ; constraint/index/test |
| BE-WS-02 | Quản lý phiên bản mẫu, khởi tạo Word, upload/download riêng cho đơn nghỉ | 00, 01 | Adapter/API tài liệu, validation tệp, quyền tải và cleanup an toàn |
| BE-WS-03 | CRUD nháp + optimistic concurrency | 01, 02 | Nháp mở lại được, xung đột không mất nội dung, không lộ nháp |
| BE-WS-04 | Nộp nguyên tử + immutable snapshot + idempotency | 03 | Nộp một lần, replay đúng kết quả, không có leave thiếu Word |
| BE-WS-05 | Detail/bản nộp/tác động ca + giữ quyết định/lịch sử cũ | 04 | Manager đọc đúng bản, dữ liệu cũ vẫn duyệt được |
| BE-WS-06 | Kiểm thử P0 + OpenAPI + nghiệm thu tích hợp FE | 01–05 | Báo cáo test và bộ dữ liệu kiểm thử, giao FE gói P0 |
| BE-WS-07 | Aggregate lịch tháng/mẫu tuần/migration ca cũ | P0 ổn định, chốt giờ đơn vị | Schema + API đọc/nháp + tính khả dụng không đổi |
| BE-WS-08 | Preview/sinh/sao chép/công bố/sửa lịch nguyên tử | 07 | Batch có validation/xung đột, idempotency, audit; lối ghi cũ nhất quán |
| BE-WS-09 | Xác nhận phiên bản + notification event/worker | 08, hợp đồng Notification | Audit xác nhận, retry/dedup, theo dõi lỗi phát |
| BE-WS-10 | Yêu cầu/duyệt đổi ca | 08, 09 | Cập nhật ca nhất quán, không tác động trước duyệt |

Không cần chờ toàn bộ lịch tháng/đổi ca mới giao FE tích hợp Word. Không ước lượng ngày công trước khi xác minh storage và mẫu. BE cần tự phân công người phụ trách Workflow, storage, IAM và Notification theo cơ cấu nhóm thực tế.

## 11. Migration và rollout

1. Bổ sung bảng/field nullable, constraint/index; test trên bản DB kiểm thử có đơn/cặp ca cũ. Không chạy migration production trong task lập kế hoạch này.
2. Deploy BE tương thích cả FE cũ và mới. API nghỉ cũ vẫn trả trạng thái/schema quen thuộc; danh sách cũ không nhận draft.
3. Bật luồng Word theo capability/cấu hình server và phạm vi pilot; thống nhất cách FE nhận biết hỗ trợ, không thử endpoint bằng cách đoán path.
4. API gửi nghỉ kiểu cũ không được biến thành lối bỏ qua yêu cầu Word sau khi đơn vị đã bật bắt buộc Word. Trong pilot vẫn giữ tương thích cho đơn vị chưa bật; rollout bắt buộc phải đồng bộ FE và trả lỗi có mã rõ cho client cũ. Đơn đã tồn tại được miễn hồi tố.
5. Xác minh truy cập tệp và khôi phục nháp/bản nộp sau restart. Backup/restore phải giữ cả DB và object được tham chiếu, không chỉ một phía.
6. Triển khai lịch tháng sau đó, bảo toàn khả dụng và ca cũ. Có cơ chế rollback ứng dụng bằng cấu hình nhưng giữ dữ liệu/tệp mới; không dùng migration down xóa bản nộp làm rollback mặc định.

## 12. Kiểm thử và Definition of Done

P0 bắt buộc:

- Unit: thời gian/giới hạn/reason, trạng thái, metadata/revision, chính sách chủ đơn/phường/role và validation DOCX.
- Integration DB PostgreSQL thật: khóa phường và version, submit trùng key/khác key, upload–submit/xóa–submit đồng thời, hai Manager quyết định, duplicate outbox. Không dùng test in-memory thay bằng chứng transaction/locking.
- Storage: upload lỗi, DB lỗi sau upload, object mất trước nộp, revision bị tráo, tệp hỏng/quá lớn và cleanup không xóa snapshot. Không báo lưu thành công khi storage chưa sẵn sàng.
- Security: đoán draft/leave/revision ID, tải chéo phường, Manager đọc nháp người khác, chủ đơn sửa tệp sau nộp, tự duyệt và tài khoản đa vai trò.
- Compatibility: đơn cũ không Word, FE cũ gửi/đọc/quyết định khi chưa bật bắt buộc Word; không rò draft vào list cũ; không nhân đôi lịch sử.
- Contract: response metadata/tệp/version/status đúng OpenAPI, multipart/filename/content headers, lỗi có code để FE xử lý.
- End-to-end FE–BE thật: tạo nháp → soạn Word → lưu → logout/login mở lại → nộp → Manager tải đúng hash/revision → duyệt/từ chối/hủy → Frontdesk thấy kết quả. Lỗi mạng giữ nháp và replay tìm đúng kết quả.

P1–P3 bổ sung: tháng ngắn/năm nhuận/ca qua tháng/ngày lễ, publish cạnh tranh tạo ca/nghỉ, giữ lịch hiệu lực khi có nháp sửa, lối ghi API cũ, preview lỗi thời, sửa ca đang diễn ra, xác nhận sai revision, lỗi Notification/retry/dedup và đổi ca lỗi giữa transaction. Hồi quy `NO_ACTIVE_SHIFT`/`APPROVED_LEAVE` cho phân công/nhận xử lý/tham vấn tại chính biên thời gian.

Hoàn tất mỗi gói khi: build/test BE phù hợp đạt, migration được thử có dữ liệu cũ, OpenAPI/lỗi/quyền được bàn giao, test tích hợp thực có bằng chứng, biết các giới hạn chưa nghiệm thu. Không coi test mock FE là bằng chứng upload/storage/transaction BE đã hoạt động.

## 13. Thông tin cần chốt

- Mẫu DOCX và trường điền sẵn; lý do ngắn phục vụ danh sách, nội dung chi tiết trong Word; quyền quản lý/thay mẫu.
- Giới hạn tệp/retention, storage owner và quyền truy cập nội bộ giữa các service.
- Giờ/ngày làm việc theo đơn vị, ngoại lệ lễ/đóng cửa, giới hạn batch và chính sách thay ca đang diễn ra.
- Lộ trình bật Word bắt buộc và thời điểm hạn chế API gửi nghỉ cũ.
- Event/recipient/điều hướng thông báo, quyền mới nếu cần. Những điểm chưa chốt chỉ chặn phần phụ thuộc, không chặn chuẩn bị OpenAPI/test/migration tương thích.

## 14. Kiểm tra trong lượt lập kế hoạch

Đã đọc kế hoạch nguồn và source staffing/domain/contracts/security/DbContext local, kiểm tra liên kết/đường dẫn và diff tài liệu. Chưa chạy API thật, build/test BE, upload storage hoặc migration; không sửa source BE/FE. Các entity/năng lực mới trong tài liệu đều là đề xuất cho BE triển khai và công bố hợp đồng.
