# Tích hợp điều phối, ca làm, nghỉ phép và tham vấn

## Rà soát lỗi/validation sau tích hợp — 01/11/2026

- Chặn lựa chọn cán bộ/lý do phân công đã biến mất hoặc bị disabled khi danh sách refresh: schema form được tạo lại từ chính options đang hiển thị. Không chỉ kiểm tra ID có tồn tại trong danh bạ. Giữ các giới hạn ký tự và trim trước khi gửi.
- Tách `src/lib/staffingValidation.ts` để kiểm tra date-only thực, datetime giờ Việt Nam đúng định dạng (không để Date.parse tự chuẩn hóa 30/02), thứ tự/khoảng/giới hạn 24 giờ và 93 ngày. Khoảng GET staffing <=93 ngày gồm hai đầu; calendar vẫn <=400.
- Form staffing không cho gửi lại khi kết quả ghi chưa xác định hoặc 403/404/409/422; invalidate dữ liệu và yêu cầu đóng/xem lại. Các trường lỗi nối aria-describedby; lỗi trường BE có focus sau khi hết disabled. Calendar hủy chỉ gửi khi GET mới nhất còn bản ghi được phép hủy, khóa khi refetch; context danh tính/phường/quyền đổi thì ẩn hộp thoại cũ.
- Contents tham vấn cache theo application version, tệp chọn gắn version và dùng revision binary riêng cho consultation. Khi version đổi, không mở tiếp tệp đã chọn trên dữ liệu cũ. Đây không sửa giới hạn cấp quyền DOCX phía DocumentForm.
- Kết quả mới: typecheck/lint/build/diff check đạt; build chạy ngoài sandbox vì quyền dist và còn cảnh báo thư viện/chunk lớn. **32/32** kiểm tra ngày calendar, **56/56** validation staffing/form/API input không mạng, **11/11** tương tác ActionForm độc lập trên Edge. Edge kiểm tra form rỗng, lựa chọn bị loại sau refresh, khóa gửi lại sau lỗi không xác định, chặn double-submit/Escape khi đang lưu, đóng sau thành công, aria-describedby và không tràn ngang ở 360px; lượt cuối 0 API request/0 runtime error. Callback form được điều khiển trong harness, không giả lập tài khoản/response nghiệp vụ BE. Không dùng kết quả này để khẳng định luồng đăng nhập hay responsive toàn workspace đã đạt.
- Các lượt harness thất bại ban đầu đã được sửa cấu hình/cô lập cache và route; chỉ lượt cuối exit 0 được tính đạt. Không chạy lại 22 API Azure trong lượt rà soát này; không thay backend hoặc auth/core.

```sh
node --experimental-strip-types tests/calendar-rules-check.mjs
node tests/staffing-validation-check.mjs
node tests/staffing-form-check.mjs
```

## Bổ sung lịch đóng cửa/ngày lễ — 01/11/2026

- Đã đối chiếu lại source BE mới tại `E:/wardmate-backend`: CalendarClosuresController, CalendarContracts, CalendarClosureService, WorkflowSecurity, ReviewDeadline, DI staffing/calendar và migration IAM/Workflow. Swagger Azure có 22 operation bàn giao; bộ lọc rộng có 24 vì thêm assignment-summary và PUT assignee đã tồn tại.
- Client `src/lib/api/calendarClosures.ts` nối GET closures, POST closures, POST closures/national và POST closures/{id}/cancel qua JWT client/Workflow hiện có. Kiểm tra response bằng Zod; GET trả mảng, POST trả `{closure,rescheduledApplications}`. Không gửi wardCode, người tạo hoặc hạn tự tính.
- `CalendarClosuresView.tsx` dùng chung cho ba workspace: Manager xem lịch phường/toàn quốc và tạo/hủy lịch phường; Officer chỉ xem; IT_ADMIN có workflow.calendar.manage quản lý lịch toàn quốc. Với tài khoản đa vai trò có quyền calendar.manage, phạm vi GET ưu tiên toàn quốc đúng BE. `/users/me` chỉ có wardId, nên FE dựa vào phạm vi GET do BE trả về, không giả định wardId là wardCode. BE xác minh lại quyền/phạm vi khi ghi.
- UI có khoảng ngày, bộ lọc phạm vi/trạng thái trên toàn bộ mảng trong khoảng GET, chi tiết khai báo/hủy, form RHF/Zod, Modal/Toast chung; giữ bản ghi đã hủy. Ngày date-only theo Việt Nam; timestamp UTC hiển thị UTC+07. Xem tối đa 400 ngày gồm hai đầu; tạo hôm nay..+366; lý do trim 1–500; chỉ hủy ngày sau hôm nay. Đồng hồ ngày cập nhật mỗi 30 giây/khi focus và kiểm tra lại khi submit.
- Tạo/hủy thành công hiển thị chính xác rescheduledApplications (kể cả 0), invalidate staffing/workflow/analytics; đưa bộ lọc về tất cả và chuyển khoảng xem nếu ngày vừa lưu nằm ngoài khoảng cũ. Không tự hủy ca, bàn giao hoặc tính deadline FE. Hạn là hạn tiền kiểm nội bộ.
- Xử lý 403 kể cả body rỗng, 404/409 và 503 bằng thông báo tiếng Việt. Không retry mutation; khi xung đột hoặc kết quả ghi chưa chắc chắn (mạng/5xx/response sai), tải lại dữ liệu, khóa gửi trong hộp thoại và yêu cầu đóng/xem lại. GET lịch refetch khi focus/reconnect.
- Rà soát 18 API: giữ hợp đồng hiện có; dùng thông báo staffing chung, hướng dẫn chọn lại khi 422; cho phép chọn chuyên viên khi hồ sơ chưa có category để BE tra Catalog thay vì FE loại hết; kiểm tra quyền tài liệu tham vấn khi focus/reconnect ngoài chu kỳ 15 giây. Lý do phân công vẫn giới hạn 470 vì BE cắt lịch sử ở 500 gồm mã. DOCX tham vấn vẫn bị kiểm tra cán bộ chính ở OfficerSubmission trong source mới, chưa được BE sửa.
- Kiểm tra lượt này: `node --experimental-strip-types tests/calendar-rules-check.mjs` đạt **32/32** (biên UTC+07 ở ba timezone, ngày nhuận/ngày sai, khoảng 400 ngày, tạo +366/+367, hủy khi qua ngày); không gọi API hoặc tạo dữ liệu nghiệp vụ. `npm run lint` đạt.
- `tests/staffing-live-check.mjs` cập nhật 18 → 22; chạy với Swagger và API origin **Gateway Azure trực tiếp**, đạt **22/22** không token, HTTP 401 ProblemDetails code auth.unauthorized. Không chạy qua Vite trong lượt này, không đăng nhập hoặc ghi bản ghi thật; không coi 401 là nghiệm thu nghiệp vụ.
- `npm run build` (gồm TypeScript) đạt khi chạy ngoài sandbox, còn cảnh báo annotation SignalR/Zod và chunk lớn hiện hữu. Các lần trong sandbox lỗi EPERM khi xóa/ghi dist/.gitkeep; thử giữ output cũng bị chặn ghi, không thay cấu hình build để né lỗi. `git diff --check` đạt. Chưa QA trình duyệt/responsive hoặc luồng có tài khoản Manager/Officer/IT_ADMIN thật, chưa chạy suite mock. Không đổi backend, auth/core, dependency hoặc cấu hình môi trường; chưa commit/push.

Lệnh kiểm tra biên ngày không cần backend:

```sh
node --experimental-strip-types tests/calendar-rules-check.mjs
```

Kiểm tra 22 route thật không token (đặt STAFFING_API_ORIGIN là Vite nếu muốn kiểm tra thêm reverse proxy):

```powershell
$env:STAFFING_OPENAPI_URL='https://wardmate-gateway.blackmeadow-a2f12767.japaneast.azurecontainerapps.io/api/application-workflow/swagger/v1/swagger.json'
$env:STAFFING_API_ORIGIN='https://wardmate-gateway.blackmeadow-a2f12767.japaneast.azurecontainerapps.io'
node tests/staffing-live-check.mjs
```

Các phần ngày 30/10 bên dưới là lịch sử; kiểm tra 18/18 hoặc proxy ở đó không phải kết quả chạy lại ngày 01/11.

Ngày: 30/10/2026, múi giờ Asia/Bangkok.

## Phạm vi đã triển khai

- API client `src/lib/api/staffing.ts` gọi đủ 18 thao tác thuộc ManagerDispatchController, StaffingController và ConsultationsController. Dùng JWT client hiện có, serviceUrls.workflow, Zod kiểm tra response và giới hạn version trong miền số nguyên an toàn JavaScript.
- Manager có các mục Điều phối hồ sơ, Lịch ca làm, Duyệt nghỉ phép, Tham vấn chuyên môn. Giữ bộ lọc của màn Giám sát cũ; nút giao/chuyển trên màn đó dùng cùng AssignDialog/API mới.
- Officer có Lịch ca làm, Nghỉ phép cá nhân, Hộp thư tham vấn và tab Tham vấn trong chi tiết hồ sơ. Chuyên viên là FRONT_DESK_OFFICER có workflow.consultation.respond, không thêm role mới.
- Các form dùng React Hook Form/Zod, Modal và Toast hiện có. Ngày giờ nhập/hiển thị theo Việt Nam; khoảng xem/nghỉ tối đa 93 ngày, ca tối đa 24 giờ và bắt đầu trong tương lai. Duyệt/hủy gửi version từ bản ghi đã tải. Khi 409/422, tải lại các cache liên quan, khóa gửi lại trong hộp thoại cũ và yêu cầu kiểm tra lại.
- Quyền xem/quản lý/xin nghỉ/trả lời kiểm tra từ user.permissions và roles; policy staffing.decide được phản ánh qua staffing.manage cho Manager, leave.request cho Officer. Backend vẫn là nơi xác minh cuối cùng. Không tự duyệt đơn của mình.
- Ứng viên phân công lấy từ BE, giữ thứ tự BE, hiển thị khối lượng và lý do không đủ điều kiện, không cho chọn người đang phụ trách. Lịch sử và ảnh hưởng nghỉ phép lấy từ API thật. Không tự động bàn giao khi duyệt nghỉ.
- Tài liệu tham vấn ở chế độ chỉ đọc, kiểm tra document-access trước mỗi lần tải, kiểm tra lại khi focus và định kỳ 15 giây khi hộp thoại đang mở. Lỗi/thu hồi quyền ẩn vùng đọc. File đã được người dùng tải về trước đó không thể thu hồi từ máy của họ.
- Thêm Vite proxy /api/v1/staffing trước /api của IAM. Không thay đổi backend hoặc hợp đồng auth.

Không thêm dữ liệu mẫu, fake token, fixture response, mock server hoặc fallback dữ liệu nghiệp vụ. Danh sách rỗng và lỗi API hiển thị trực tiếp. Enum/nhãn trạng thái là nội dung giao diện, không phải bản ghi dữ liệu.

## Kiểm tra và giới hạn

- npm run build (gồm typecheck), npm run lint và git diff --check đạt. Build vẫn có cảnh báo bundle lớn và annotation thư viện đã có.
- Kiểm tra thực bằng tests/staffing-live-check.mjs: đọc Swagger từ tiến trình Workflow .NET thật, đối chiếu đủ 18 operation; gửi request không token qua Vite → YARP → Workflow. 18/18 trả đúng 401 application/problem+json, code auth.unauthorized. Không đăng nhập, không tạo tài khoản/bản ghi và không chạy handler nghiệp vụ. Đây không phải bằng chứng các luồng ghi có đăng nhập đã đạt.
- Chưa chạy bộ Playwright mock sẵn có vì yêu cầu không mock dữ liệu. Chưa nghiệm thu giao diện sau đăng nhập, responsive bằng tài khoản thật hoặc các quyết định nghiệp vụ trên Azure.
- URL Swagger Azure người dùng gửi bị proxy môi trường chặn CONNECT 403. Đã lưu bổ sung riêng domain wardmate-gateway.blackmeadow-a2f12767.japaneast.azurecontainerapps.io vào draft network; chưa áp dụng runtime/publish. Không tuyên bố đã đối chiếu Swagger Azure hoặc gọi API Azure thành công.

Chạy lại kiểm tra không cần tài khoản khi các tiến trình thật đang chạy:

```sh
cd /workspace/wardmate-frontend
STAFFING_OPENAPI_URL=http://127.0.0.1:5003/swagger/v1/swagger.json \
STAFFING_API_ORIGIN=http://127.0.0.1:5173 \
node tests/staffing-live-check.mjs
```

Các giá trị trên trỏ tới instance local đã kiểm tra. Khi dùng môi trường khác, đặt origin/OpenAPI URL thật tương ứng; không thêm đường dẫn Swagger vào VITE_WORKFLOW_API_URL. Hosting production phải định tuyến /api/v1/staffing và các API Workflow tới đúng service/gateway; Vite proxy chỉ áp dụng cho phát triển.

## Cập nhật kiểm tra trước push main — 30/10/2026

Môi trường đã được người dùng publish. Lượt chia commit/push hiện tại không áp dụng lại cấu hình cũ và không publish thêm. Gateway Swagger đã truy cập HTTP 200, đối chiếu có đủ 18 operation. Giới hạn mạng CONNECT 403 phía trên mô tả lượt triển khai trước; không còn là blocker hiện tại.

Chạy lại typecheck, lint, build và kiểm tra whitespace trên cây mã cuối: đạt, còn cảnh báo bundle/annotation hiện hữu. Chỉ đọc Swagger Azure, không gửi dữ liệu ghi hoặc dùng tài khoản giả; chưa kiểm chứng lại các luồng có đăng nhập. Bộ 18/18 local ở phần trước là kết quả lượt triển khai, không được trình bày là vừa chạy lại. Giai đoạn này chỉ chia phần thay đổi sẵn có thành 20 commit có ý nghĩa (bao gồm bàn giao), không chế tạo 25 commit từ các thay đổi không tồn tại.

## Điểm cần BE xử lý / xác nhận

1. DOCX tham vấn: DocumentForm ApplicationAccess.Read hỗ trợ fallback consultation/document-access, nhưng OfficerSubmissionsController.DownloadDocx gọi ApplicationAccess.OfficerSubmission → Check(officer: true), vẫn bắt AssignedOfficerId là người tải. FE đã nối request thật và hiển thị lỗi, không mở quyền hoặc giả lập tải thành công. Muốn chuyên viên tải DOCX đầy đủ cần BE bổ sung kiểm tra read-only tham vấn cho đường tải này. Không được mở fallback cho write/annotate/decide.
2. Lý do phân công: DispatchService nhận tối đa 2000 ký tự nhưng lưu history tối đa 500 ký tự gồm reasonCode. UI tạm giới hạn nội dung 470 ký tự để không mất phần đã nhập khi đọc lại lịch sử. Nếu BE sửa lưu đầy đủ thì cập nhật giới hạn UI cùng hợp đồng.
3. GET manager/applications mới chỉ hỗ trợ page/pageSize, không có các filter giám sát cũ. Vì vậy có màn Điều phối riêng, không giả bộ bộ lọc toàn tập bằng lọc client trên một trang.
4. Danh sách IAM hiện không trả quyền consultation.respond trong DTO frontend. Form chọn chuyên viên dùng danh sách cán bộ thật theo role/hoạt động/lĩnh vực và loại người phụ trách; ca làm, nghỉ và quyền trả lời được BE xác minh khi gửi. Không trình bày danh sách này là đã được BE xác nhận đủ điều kiện tham vấn. 422 tải lại dữ liệu và yêu cầu chọn lại.

## Nghiệm thu tiếp

Swagger Azure đã đọc được trong lượt kiểm tra trước push. Bước tiếp theo là đăng nhập tài khoản Manager/Officer được cấp quyền thật. Kiểm tra phân công, trùng ca/nghỉ, tự hủy đơn, bàn giao, tham vấn/thu hồi quyền và hai phiên cập nhật đồng thời. Không nhập mật khẩu/token vào tài liệu hoặc chat; đăng nhập qua giao diện ứng dụng. Chỉ thử thao tác ghi trên hồ sơ được phép dùng để nghiệm thu.
