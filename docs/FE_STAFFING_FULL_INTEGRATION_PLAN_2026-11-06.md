# Kế hoạch FE: tích hợp đầy đủ lịch làm việc và đơn nghỉ Word

Ngày: 06/11/2026, Asia/Saigon. Trạng thái: kế hoạch để người dùng xem trước; chưa triển khai chức năng mới.

## 1. Phạm vi và bằng chứng đối chiếu

- Đầu vào: [Lịch làm việc Front Desk và đơn nghỉ Word.md](Lịch%20làm%20việc%20Front%20Desk%20và%20đơn%20nghỉ%20Word.md).
- Đã đọc source BE local `LeaveDraftContracts`, `LeaveDraftsController`, `LeaveDraftService`, `MonthlyScheduleContracts`, `MonthlySchedulesController`, `MonthlyScheduleService`, chính sách WF-WS và hướng dẫn API.
- Đã đọc Swagger UI, cấu hình `index.js` và [OpenAPI JSON đang deploy](https://wardmate-gateway.blackmeadow-a2f12767.japaneast.azurecontainerapps.io/api/application-workflow/swagger/v1/swagger.json), HTTP 200, ngày 06/11/2026. Có đủ 47 thao tác trong tài liệu đầu vào.
- Bộ lọc rộng còn thấy 2 API `GET /api/v1/manager/applications/assignment-summary` và `PUT /api/v1/manager/applications/{id}/assignee`. FE đã có trong `workflow.ts` và luồng Giám sát hồ sơ; đưa vào hồi quy, không thêm hai nút phân công trùng nhau.
- FE hiện đã có client/luồng cho 22 thao tác cũ (18 tại `staffing.ts`, 4 tại `calendarClosures.ts`). Cần bổ sung 25 thao tác mới và rà lại hợp đồng/quyền/validation của cả 22 thao tác cũ, không coi việc có client là đã nghiệm thu tích hợp thật.
- Phạm vi là các nhóm staffing, điều phối và tham vấn trong bàn giao, cùng phần thông báo liên quan; không triển khai mọi API khác của service Workflow.
- Source và Swagger là cơ sở hợp đồng hiện tại; kế hoạch BE cũ chỉ để tham khảo. Chưa gọi API nghiệp vụ có xác thực hoặc thực hiện ghi dữ liệu thật trong lượt khảo sát này.

## 2. Bảng bao phủ API → giao diện

Số thứ tự dưới đây trùng bảng 01–47 trong tài liệu bàn giao. Khi triển khai phải ghi kết quả từng method/path, UI gọi, quyền và test để xác nhận 47/47; có thể là thao tác tùy chọn/nhánh theo capability, không phải gọi tất cả khi mở trang.

| Nhóm | API cũ | API mới | UI/luồng cần hoàn thiện |
|---|---|---|---|
| Chính sách và ngày đóng cửa | 02–05 | 01 | Đọc capabilities; giữ khai báo/hủy ngày phường/toàn quốc đúng vai trò, kiểm tra ảnh hưởng lịch |
| Ca/lịch tháng | 06–08 | 09–16 | Lịch tháng và danh sách, mẫu tuần, preview, lưu nháp/công bố, lịch sử, xác nhận cá nhân |
| Soạn/nộp Word | 27 | 17–26 | Mẫu hiện hành/xem mẫu, tạo và phân trang nháp, sửa thông tin, editor lưu/mở lại, xóa nháp, nộp |
| Duyệt nghỉ và điều phối | 28, 32–38 | 29–31 | Detail mới, bản Word đã nộp, ca ảnh hưởng; giữ quyết định/lịch sử/bàn giao qua đúng API |
| Đổi giờ ca | — | 39–41 | Frontdesk đề nghị, theo dõi; Manager đọc/duyệt/từ chối, so sánh giờ cũ/mới |
| Tham vấn | 42–47 | — | Rà toàn luồng mời/đọc/quyền tài liệu/trả lời/đóng và cập nhật khi lịch/nghỉ thay đổi |
| **Tổng** | **22** | **25** | **47 thao tác trong phạm vi** |

Các binary GET, API đọc detail khi sửa và API nhánh nộp cũ vẫn phải có đường gọi rõ ràng, không chỉ khai báo method rồi để không dùng. Xem mẫu chung là tùy chọn có nút riêng; sửa Word luôn đọc bản riêng bằng draftId.

## 3. Tổ chức UI/UX

### Manager

- **Lịch làm việc:** chọn tháng/cán bộ; desktop lịch tháng hoặc danh sách theo người, mobile danh sách ngày. Hiển thị ca chính thức, nháp đang chỉnh, nghỉ đã duyệt và ngày đóng cửa bằng nhãn có chữ.
- Thao tác tách rõ **Thêm ca chính thức**, **Lập lịch tháng**, **Lưu nháp**, **Công bố**. Không dùng một nút “Lưu” gây hiểu nhầm nháp đã có hiệu lực.
- **Mẫu tuần:** dòng cán bộ + thứ + giờ bắt đầu/kết thúc, thêm nhiều ca/ngày; hỗ trợ nhân bản dòng hợp lệ, không ép một người chỉ có một ca/ngày.
- **Lập lịch tháng:** từ mẫu tuần hoặc sao chép tháng nguồn; preview danh sách và xung đột, chỉnh ca, xem số ca thêm/sửa/hủy trước khi công bố. Không tự bật ngoại lệ ngày đóng cửa.
- **Lịch sử:** revision `BASELINE` giải thích là dữ liệu ban đầu; actor UUID toàn 0 không hiển thị thành tên một người. Lịch `PUBLISHED` có thời gian/người/lý do theo dữ liệu thực.
- **Duyệt nghỉ phép:** danh sách và detail gồm thông tin nghỉ, Word chỉ đọc, ca bị ảnh hưởng, hồ sơ đang giữ, lịch sử. Duyệt/từ chối/hủy dùng dữ liệu mới nhất; bàn giao là hành động riêng.
- **Yêu cầu đổi ca:** nằm trong nhóm lịch làm việc bằng tab; so sánh ca hiện tại với giờ đề xuất, lý do và trạng thái trước quyết định.
- **Điều phối/Tham vấn/Lịch ngày nghỉ:** giữ vị trí nghiệp vụ hiện có, hoàn thiện tương tác và các lỗi hợp đồng; không nhân bản chức năng sang màn lịch.

### Frontdesk

- **Lịch làm việc của tôi:** tháng/danh sách cá nhân, xem nghỉ/lễ, xác nhận đã nhận đúng lịch đang xem; ca tương lai có nút đề nghị đổi giờ.
- **Nghỉ phép cá nhân:** tab **Nháp của tôi** và **Đơn đã nộp**. Nháp có sửa/soạn Word/xóa; đơn đã nộp có xem kết quả/tài liệu/lịch sử và hủy khi đúng điều kiện.
- **Xin nghỉ bằng Word:** thông tin nghỉ → tạo nháp riêng → soạn Word → lưu → xem lại → nộp. Hiển thị rõ “Chưa lưu”, “Đã lưu nháp”, “Chưa nộp”, “Đã nộp”; không coi lưu editor là nộp Manager.
- Đổi metadata sau khi soạn phải xem lại và lưu Word theo metadataVersion mới. Giữ nội dung editor khi lưu lỗi; có cảnh báo rời trang khi chưa lưu.
- Sau nộp chuyển từ draftId sang leaveId; Word bản đã nộp chỉ đọc. Đơn cũ không có Word hiển thị đúng trạng thái dữ liệu cũ, không yêu cầu tệp giả.
- **Yêu cầu đổi ca/Hộp thư tham vấn:** theo dõi đúng dữ liệu cá nhân, không mở quyền Manager cho Frontdesk hoặc tài khoản kiêm Manager.

Tái sử dụng UI hiện có, Modal Radix, Toast Sonner và editor DOCX lazy load. Có tải/rỗng/lỗi/thử lại, bàn phím/focus, nút tối thiểu 44px và bố cục 360/390/768/1440px, zoom 200%. Không bổ sung thư viện lịch/editor trước khi xác định component hiện có không đáp ứng.

## 4. Kế hoạch triển khai theo thứ tự

| Bước | Công việc | Sản phẩm/điều kiện qua bước |
|---|---|---|
| FE-WS-01 | Lập bảng coverage 47 thao tác; đối chiếu DTO/response/error/quyền với Swagger và service; kiểm tra client/proxy | Mỗi thao tác có UI, quyền, schema và validation; ghi riêng khác biệt hợp đồng/deployment nếu có |
| FE-WS-02 | Bổ sung client/hook cho capabilities, Word và lịch tháng/đổi ca; cập nhật shift.version, error mapping và binary/multipart | Request/response có Zod, AbortSignal/cache theo danh tính; không có endpoint giả, không tự retry ghi |
| FE-WS-03 | Nháp nghỉ cá nhân và editor: mẫu, tạo/sửa/mở lại/lưu/xóa/nộp, idempotency | Tái đăng nhập đọc được Word đã lưu; nộp đúng revision; lỗi không mất nội dung hoặc tạo hai đơn |
| FE-WS-04 | Detail nghỉ Manager/chủ đơn; Word bản nộp, ca ảnh hưởng, hồ sơ bàn giao, quyết định/lịch sử | Đọc đúng leave.version trước quyết định; không lẫn ca với hồ sơ; không tự bàn giao khi duyệt |
| FE-WS-05 | Lịch tháng Manager, mẫu tuần, preview/sao chép, biên tập nháp, công bố và lịch sử | Giữ đủ ca/ID/version, cảnh báo xóa/hủy, 409 không ghi đè; không cho nháp tạo lịch hiệu lực giả |
| FE-WS-06 | Lịch cá nhân/xác nhận và yêu cầu đổi ca hai vai trò | Fingerprint cá nhân đúng; ca cũ còn hiệu lực khi yêu cầu đang chờ, duyệt xong đọc lại lịch |
| FE-WS-07 | Rà 22 API cũ, phân quyền, thông báo và điều hướng; cache giữa lịch/nghỉ/điều phối/tham vấn | Không hồi quy Giám sát hồ sơ, trang cán bộ hoặc lịch nghỉ Admin; không POST gửi thông báo thủ công |
| FE-WS-08 | Test/mock/proxy, duyệt giao diện, sửa lỗi/validation và nghiệm thu API thật khi có phiên kiểm thử | Typecheck/lint/build đạt; báo riêng kết quả mock và tích hợp thật; coverage 47/47 có bằng chứng |

Hoàn thiện từng luồng xuyên suốt trước khi chuyển bước lớn; nếu phát hiện BE thiếu hoặc sai hợp đồng thì ghi yêu cầu sửa cụ thể, tiếp tục phần độc lập, không giả lập lưu thành công. Không tự sửa BE trong task tích hợp FE.

## 5. Các điểm kỹ thuật và validation bắt buộc

### Nghỉ Word

- Đọc `wordRequired`, `templateConfigured`, `maxDocxBytes` trước khi mở nhánh xin nghỉ. Word bắt buộc nhưng mẫu/storage không sẵn sàng phải báo lỗi; không fallback sang `POST /leaves` để bỏ qua Word. Configured không chứng minh file tồn tại/tải được.
- Cùng mẫu chung dùng cho phường cũ/mới; không tạo màn chọn mẫu theo phường. Tạo nháp dùng templateVersionId hiện hành, editor đọc DOCX theo draftId. Không hứa BE tự điền mẫu khi implementation chỉ tạo bản sao; hiển thị dữ liệu tham chiếu để người soạn đối chiếu.
- Tạo nháp và nộp có hai UUID idempotency riêng. Giữ key và body chính xác của cùng thao tác khi kết quả chưa chắc chắn; không tự sinh key mới mỗi lần bấm thử lại. Chặn double-click.
- PATCH metadata và PUT Word cập nhật version; submit dùng revision/version/metadataVersion từ kết quả lưu mới nhất. Không cho nộp chỉ với bản sao mẫu ban đầu hoặc editor đang có thay đổi chưa lưu.
- Lưu FormData không tự đặt boundary. Giới hạn theo capability và hợp đồng 10 MiB, DOCX; BE là nơi xác nhận cấu trúc thật, FE không chỉ dựa đuôi file để tuyên bố tệp hợp lệ.
- Binary lỗi có thể là ProblemDetails; đọc đúng để hiện lỗi, không đưa JSON lỗi vào editor. Có thể đối chiếu SHA-256 của mẫu/bản nộp khi tải; không so hash bản đã điền với hash mẫu gốc.
- Cùng tài liệu mở ở hai tab, 409 phải giữ bản đang soạn và yêu cầu đọc lại/giải quyết; không refetch rồi ghi đè âm thầm hoặc remount editor làm mất nội dung.
- Backend quyết định nhận quyền đọc/tải; không lưu tệp/lý do nhạy cảm vào localStorage. Access token giữ cơ chế RAM, refresh HttpOnly hiện có.

### Lịch và đổi ca

- Tháng gửi ngày đầu tháng, ngày/giờ Việt Nam chuyển offset rõ; `DayOfWeek=0` là Chủ nhật. Giờ mẫu tuần dạng TimeOnly đúng contract; tối đa 200 dòng/tuần, 500 ca/tháng.
- Sao chép tháng nguồn theo **ngày trong tháng** như BE hiện tại, không thực hiện giả định sao chép theo thứ của kế hoạch cũ. Hiển thị preview để người dùng rà tháng ngắn/ngày lễ.
- `PUT draft` gửi **toàn bộ** slots, giữ shiftId/shiftVersion. Bộ lọc hiển thị không được vô tình biến thành danh sách lưu thiếu ca. Xóa ca tương lai khỏi bản nháp có thể hủy ca lúc publish, cần tổng hợp thay đổi và xác nhận.
- Ca đã bắt đầu chỉ được giữ nguyên theo BE; không cho chỉnh/xóa trong UI. Giờ kết thúc phải sau bắt đầu, ca tối đa 24h; nhiều ca cùng ngày được phép, hai ca nối nhau không coi là trùng.
- 409 phải phân biệt schedule.changed, conflicts, closure và các lỗi Word; không xử lý mọi 409 thành một thông báo “trùng lịch”. Hiển thị conflicts BE trả về, giữ nháp đang chỉnh và ngăn công bố bằng fingerprint cũ.
- Publish có xác nhận riêng `allowClosure`, mặc định không bật. Không dùng lịch nháp để hiển thị “cán bộ đang trong ca chính thức”.
- Xác nhận lịch chỉ dùng baseFingerprint nhận từ lịch cá nhân, không lấy fingerprint toàn phường. Lịch trống hoặc đã đổi thì không xác nhận giả.
- Đổi ca dùng shift.version hoặc slot.shiftVersion từ BE; không tự gửi expectedVersion=0. Quyết định đổi ca hiện **không nhận expectedVersion**; không bịa thêm field bắt buộc.
- Reason/thời gian/phân trang/UUID/selection kiểm tra đúng từng API. UUID .NET có giá trị toàn 0 ở BASELINE cần xử lý rõ; tránh schema UUID hiện tại loại dữ liệu lịch sử hợp lệ.

### Cache, lỗi và điều hướng

- Query key có user/phạm vi/tháng/trang/ID; signal hủy request; dữ liệu riêng tư và editor tách theo danh tính. Mutation ảnh hưởng lịch phải invalidate lịch tháng, ca, nghỉ, candidate/điều phối/tham vấn liên quan phù hợp.
- Giữ luồng hết phiên hiện có, safe returnTo, không retry mutation sau refresh theo cách nhân đôi yêu cầu.
- Mở detail mới nhất trước quyết định; 403/404 khóa thao tác không còn quyền, 503 không báo thành công. Giữ traceId khi BE trả để hỗ trợ chẩn đoán.
- Source mới phát SYSTEM_ALERT qua outbox; FE dùng luồng thông báo sẵn có. Kiểm tra actionUrl thật, không xem staffing ID là applicationId hồ sơ công dân.
- Manager hiện dùng section state và Officer đang xử lý URL chủ yếu cho applicationId. Chỉ bổ sung route/query cần thiết theo dữ liệu thông báo thực tế; không hứa deep link đến từng đơn nếu BE không cung cấp định danh tương ứng.

## 6. File dự kiến tác động

- API/validation: `src/lib/api/staffing.ts`, `staffingError.ts`; tách client mới cho Word/lịch tháng khi cần, `src/lib/staffingValidation.ts`, hook Query tương ứng.
- UI: `src/components/staffing/`; tách lịch và nghỉ khỏi component mode cũ theo luồng mới, tái sử dụng shared/AssignDialog/ConsultationPanel thay vì sao chép.
- Word: `src/components/documents/DocxOnlineEditor.tsx` chỉ bổ sung tùy chọn ngữ cảnh tên/lỗi/save nếu cần, không làm hỏng bản khai công dân đang dùng.
- Workspace: ManagerPage/OfficerPage/Header/sidebar để nối view, tab và điều hướng theo quyền; không tạo role chuyên viên mới.
- Thông báo và proxy: chỉnh đúng phạm vi nếu audit cho thấy cần. `/api/v1/staffing` hiện đã đi Workflow nhưng vẫn phải test multipart/header/idempotency qua proxy. Không sửa env/credentials hoặc deployment chỉ để test.
- Tests/fixtures mới, bổ sung coverage và cập nhật PROGRESS/FRONTEND_SETUP sau triển khai.

## 7. Kiểm tra và tiêu chí hoàn tất

1. **Hợp đồng:** đủ 47 thao tác có call site/nhánh UI và test tương ứng; 2 API Giám sát hồ sơ cũ được hồi quy, không nhân bản chức năng. Response sai schema/ID không báo thành công.
2. **Nghỉ Word:** mẫu → nháp riêng → chỉnh/lưu → mở lại → nộp → Manager đọc bản nộp → quyết định. Kiểm tra lỗi upload, DOCX không hợp lệ, metadata/revision cũ, hai tab, timeout tạo/nộp và retry cùng key/body.
3. **Lịch:** hai ca/ngày, mẫu tuần, sao chép tháng ngắn, ca qua ngày, giữ ca đã bắt đầu, bản nháp lỗi thời sau tạo/hủy ca đơn lẻ, publish ngày đóng cửa và xác nhận lịch cá nhân.
4. **Đổi ca:** gửi đề nghị, ca cũ còn hiệu lực, duyệt/từ chối, ca gốc đã đổi và xung đột nghỉ/lễ/giờ. Không tự hủy hoặc đổi chính thức khi chỉ gửi đề nghị.
5. **Quyền:** Manager/Frontdesk/tài khoản kiêm vai trò, hết phiên, khác phường, ID nháp/đơn/tệp của người khác. Lịch nghỉ Admin vẫn hoạt động đúng phạm vi.
6. **Hồi quy:** điều phối/nhận xử lý/tham vấn, document access, notification và editor bản khai công dân khi shared thay đổi. Duyệt nghỉ không tự chuyển hồ sơ.
7. **UI:** kiểm tra hình ảnh desktop/mobile, 360/390/768/1440px, zoom 200%, bàn phím, focus, nội dung dài và trạng thái tải/rỗng/lỗi.
8. Chạy `npm run typecheck`, `npm run lint`, `npm run build`, Playwright phù hợp, script proxy phù hợp; sửa lỗi rồi chạy lại phần bị ảnh hưởng. Auth/core chỉ chạy mở rộng khi thực sự thay đổi.
9. **Tích hợp thật:** cần phiên/tài khoản kiểm thử hợp lệ và mẫu/storage đã provision. Chạy hai phường theo tài liệu bàn giao để kiểm tra cùng mẫu/nháp riêng/chặn đọc chéo/nộp Word bắt buộc; xác minh thông báo qua luồng thực. Không coi có endpoint trong Swagger là đã nghiệm thu quyền, file hoặc dữ liệu thật.

## 8. Trạng thái sau lượt lập kế hoạch

- Đã đọc source/tài liệu, kiểm kê OpenAPI online và lập kế hoạch; chỉ thêm tài liệu kế hoạch/ghi chú bàn giao, không sửa code hoặc cấu hình FE/BE.
- Chưa chạy typecheck/lint/build/Playwright cho task này, chưa đăng nhập/test API nghiệp vụ hoặc tạo dữ liệu thật. Tài khoản kiểm thử và storage mẫu là điều kiện của bước nghiệm thu thật, không phải kết quả đã đạt.
- Chờ người dùng xem kế hoạch trước khi bắt đầu triển khai chức năng theo yêu cầu mới nhất. Không commit/push trong lượt này.
