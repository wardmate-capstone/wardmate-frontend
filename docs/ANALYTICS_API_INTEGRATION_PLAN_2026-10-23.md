# Kế hoạch tích hợp Analytics, AnalyticsJobs và CitizenFeedback

Ngày: 23/10/2026 (Asia/Saigon). Kế hoạch đã được triển khai phía FE và kiểm thử bằng mock: 46/46 test đạt, typecheck/lint/build đạt, 16 route proxy đạt. Chưa kiểm chứng luồng có xác thực và mutation trên Azure; xem `PROGRESS.md` để biết bàn giao thực tế. Các mục dưới đây giữ mô tả kế hoạch và tiêu chí triển khai ban đầu.

## 1. Phạm vi đã chốt

Rà soát sau triển khai: `ANALYTICS_API_AUDIT_2026-10-23.md` ghi bảng đủ 10/10 API, các sửa lỗi và 22 test mới chạy trong lượt kiểm tra lại. Kết quả này tách biệt với 46 test của lượt triển khai ban đầu.

- Analytics: workspace Manager.
- AnalyticsJobs: workspace Admin (`IT_ADMIN`).
- CitizenFeedback: công dân gửi/xem đánh giá của mình; Manager xem danh sách và thống kê phản hồi trong phường.
- Tích hợp đủ 10 thao tác HTTP nghiệp vụ của Swagger được cung cấp. Route `GET /` là thông tin service, không cần tạo chức năng người dùng.
- SignalR thông báo là luồng riêng đã khảo sát vì cùng service; không tự đưa vào phạm vi triển khai 10 thao tác HTTP này.
- Không mở rộng sang mọi API còn thiếu của toàn bộ WardMate. Không khôi phục nghiệp vụ tiếp nhận chính thức đã loại bỏ.

Nguồn Swagger đã truy cập thành công trong phiên:
https://wardmate-gateway.blackmeadow-a2f12767.japaneast.azurecontainerapps.io/api/analytics-system/swagger/v1/swagger.json

Đã đối chiếu với BE tại `E:/wardmate-backend/src/Services/WardMate.Services.AnalyticsSystem/`: controllers, `AnalyticsContracts.cs`, `DeadlineStatistics.cs`, `AnalyticsAccess.cs`, `AnalyticsService.cs`, cấu hình job và Gateway. Việc đọc Swagger xác nhận mô tả API đang phục vụ, chưa chứng minh API có xác thực, IAM, DB và job chạy thành công.

## 2. Bản đồ API → UI

Các route bên dưới bắt đầu bằng `/api/v1`. Không lấy prefix trang Swagger làm prefix API một cách mặc định.

| Actor | Method / route | Giao diện và hành vi dự kiến |
| --- | --- | --- |
| Manager | GET `/analytics/overview` | Thống kê hồ sơ: số gửi tiền kiểm, sẵn sàng, yêu cầu bổ sung, gửi lại, hủy; chỉ số đúng/quá hạn từ BE |
| Manager | GET `/analytics/trends` | Biểu đồ theo ngày; hiển thị dữ liệu thiếu và tồn quá hạn riêng với hồ sơ đã kết thúc tiền kiểm |
| Manager | GET `/analytics/procedures` | Thống kê theo thủ tục, phân trang server và tra tên qua Catalog |
| Manager | GET `/analytics/officers` | Hiệu suất cán bộ: số sẵn sàng/bổ sung, thời gian trung bình, số mẫu và deadline; tên qua danh bạ IAM đúng quyền |
| Manager | GET `/analytics/feedback/summary` | Tổng đánh giá, điểm trung bình, tỷ lệ hài lòng, phân bố 1–5 sao |
| Manager | GET `/analytics/feedback` | Danh sách phản hồi có phân trang, thời gian, ID hồ sơ, sao và nội dung; không thêm thao tác trả lời khi chưa có API |
| Admin | POST `/analytics/jobs/rebuild` | Form tính lại thống kê theo khoảng ngày, xác nhận thao tác; body `{from,to}`, thành công 202 nhận `{jobId}` |
| Admin | GET `/analytics/jobs/{jobId}` | Theo dõi trạng thái job vừa tạo hoặc ID hợp lệ nhập vào; dừng polling khi hoàn tất/thất bại hoặc rời màn hình |
| Công dân | GET `/citizen/feedback/{applicationId}` | Tải đánh giá của hồ sơ đang mở; 404 `feedback.not_found` là chưa đánh giá, khác lỗi không có hồ sơ |
| Công dân | POST `/citizen/feedback/{applicationId}` | Gửi `{rating,comment}`; chỉ báo thành công khi 201 và DTO hợp lệ; hồ sơ đã đánh giá hiển thị bản đã lưu |

Phân quyền BE: sáu GET Analytics yêu cầu `MANAGER` và có phường do IAM xác nhận; job yêu cầu `IT_ADMIN`; hai route CitizenFeedback yêu cầu `REGISTERED_CITIZEN`, gắn chủ hồ sơ. Manager đọc phản hồi qua Analytics, không dùng route công dân. Không gửi wardCode/userId từ FE để tự quyết định phạm vi.

## 3. Hiện trạng FE và vấn đề cần sửa

| Nguồn hiện tại | Phát hiện | Cách xử lý trong triển khai |
| --- | --- | --- |
| `src/lib/api/serviceUrls.ts`, `vite.config.ts` | Chưa có cấu hình Analytics riêng; `/api` mặc định đi IAM khi không dùng chung Gateway | Thêm base URL Analytics, origin được phép và proxy cụ thể trước `/api`; cập nhật env mẫu và cấu hình mock |
| `ManagerSystemStatsView.tsx` | Thống kê còn placeholder; nút năm hardcode 2026; xuất Excel chỉ toast | Nối overview/trends/procedures, tạo bộ lọc thật; năm hiện tại lấy theo giờ Việt Nam; ẩn hành động xuất chưa hỗ trợ |
| `ManagerPerformanceView.tsx` | Các mục hiệu suất chưa gọi API | Dùng dữ liệu officers/deadlines phù hợp; luôn ghi rõ số mẫu và đơn vị phút |
| `ManagerFeedbackView.tsx` | Danh sách và mức hài lòng còn placeholder | Nối list/summary, bộ lọc, phân trang và đầy đủ trạng thái tải/lỗi/rỗng |
| `CitizenPage.tsx`, `CitizenFeedbackView.tsx` | Modal chỉ mang tên thủ tục/mã hiển thị, không có applicationId và callback gửi | Truyền ID thật từ hồ sơ; nút đánh giá tổng quát phải chọn hồ sơ đủ điều kiện trước |
| `CitizenFeedbackModal.tsx`, `types/feedback.ts` | Nội dung tối đa 500 thay vì 2.000; `aspects` không thuộc DTO BE; ID/thời gian tạo cục bộ | Form RHF/Zod 1–5 sao, tối đa 2.000 ký tự; bỏ phần tiêu chí phụ chưa được lưu; dùng ID/thời gian response |
| Admin | Chưa có UI quản lý AnalyticsJobs | Thêm mục tính lại thống kê và theo dõi job theo phong cách workspace hiện tại |

## 4. Thứ tự triển khai

### Bước 1 — Client, routing và hợp đồng dữ liệu

- Thêm `src/lib/api/analytics.ts`: schema Zod cho query, response thống kê, feedback và job; tái sử dụng Axios/JWT chung.
- Thêm `src/hooks/useAnalytics.ts`: TanStack Query với userId, bộ lọc và page trong query key; chỉ enable theo phiên/role; chuyển AbortSignal.
- Thêm mutation feedback/rebuild, không tự retry thao tác ghi; invalidate đúng dữ liệu sau thành công.
- Sửa `serviceUrls.ts`, `vite.config.ts`, `.env.example`, cấu hình Playwright và kiểm tra proxy. Kiểm tra Gateway Azure đang dùng cấu hình route nào trước khi chốt URL production.

### Bước 2 — Manager

- Dùng lại các view thống kê/hiệu suất/phản hồi, không xây workspace mới.
- Bộ lọc dùng chung về từ ngày/đến ngày và thủ tục; mặc định tháng hiện tại tới hôm nay, quý/năm cũng kết thúc ở hôm nay.
- Chuyển trang về 1 khi đổi bộ lọc; chỉ gọi dữ liệu cần cho màn hình hiện tại.
- Các KPI/biểu đồ đều có loading/error/retry/empty. Có coverage thiếu ngày phải báo dữ liệu chưa đủ; tỷ lệ null hiển thị “Chưa đủ dữ liệu”.
- Đối chiếu ý nghĩa nhãn hiện có: `receivedCount` là sự kiện gửi tiền kiểm, `readyCount` là giấy tờ sẵn sàng. Không mô tả là tiếp nhận chính thức hoặc kết quả giải quyết hành chính.
- Không tự tính tỷ lệ “hồ sơ cần bổ sung” bằng cách chia các số sự kiện khác tập hồ sơ. BE chưa cung cấp tỷ lệ và phân tích nguyên nhân tương ứng; hiển thị số lượt có sẵn hoặc ghi rõ chưa hỗ trợ.
- Không tính thời gian trung bình toàn phường từ một trang cán bộ; chỉ hiển thị chỉ số mà response thực sự hỗ trợ.
- Phân biệt nhóm tồn chưa phân công (`unassignedDeadlines`) và chỉ số từng cán bộ.

### Bước 3 — Công dân

- Mở đánh giá từ hồ sơ chính chủ đủ điều kiện; trạng thái hiện hành là `DOCUMENTS_READY`; BE còn hỗ trợ dữ liệu lịch sử `OFFICIALLY_RECEIVED`, không tạo luồng tiếp nhận mới.
- GET đánh giá theo applicationId trước khi cho gửi; giữ nguyên nội dung khi request lỗi và khóa gửi trùng.
- `409 feedback.already_exists`: tải lại đánh giá đã lưu; `feedback.not_ready`: tải lại hồ sơ và giải thích trạng thái đã thay đổi.
- Trang đánh giá chung chọn hồ sơ và xem đánh giá theo hồ sơ. Chưa gọi đây là lịch sử toàn bộ tài khoản vì BE chưa có endpoint danh sách lịch sử công dân.
- Dùng response để hiển thị đánh giá, không tự sinh ID/ngày tạo, không báo lưu các tiêu chí không được gửi/lưu.

### Bước 4 — Admin

- Form ngày riêng, RHF/Zod và modal xác nhận tính lại thống kê.
- 202 chỉ có nghĩa đã xếp lịch; hiển thị jobId và trạng thái chờ, chưa báo dữ liệu đã tính xong.
- GET trạng thái theo jobId; dừng theo trạng thái kết thúc thực tế của Hangfire; không đồng nhất tất cả trạng thái chưa biết với thành công.
- `503 analytics.jobs_disabled`: báo chức năng chưa bật, giữ form; không tự bật cấu hình BE.
- Không tự gửi lại POST sau timeout: có thể job đã được tạo. Backend chưa có API liệt kê job hay khóa idempotency để FE tự tra cứu lần gửi bị mất response.

### Bước 5 — Validation, lỗi và kiểm thử

- Ngày phải là lịch hợp lệ `yyyy-MM-dd`, từ 01/01/2000, From ≤ To ≤ hôm nay tại UTC+7; khoảng tính cả hai đầu tối đa 366 ngày. Không dùng UTC cắt ngày khiến sai ngày Việt Nam.
- ProcedureId/applicationId phải là GUID khác rỗng. Page 1–100.000, pageSize 1–100; jobId chỉ số ASCII, độ dài 1–30.
- Rating nguyên 1–5; comment tùy chọn, tối đa 2.000 ký tự; trim nhất quán và ánh xạ lỗi validation theo trường. Kiểm tra biên bằng API mock vì Swagger live không thể hiện đầy đủ giới hạn rating/comment của source.
- Dùng ProblemDetails/code cho HTTP: 400 theo trường, 401 qua cơ chế phiên hiện có, 403 thiếu quyền/phường, 404 phân biệt theo code, 409 xung đột, 503 gián đoạn. 503 không xóa phiên.
- Query cache cách ly theo danh tính, xóa khi logout/đổi tài khoản; response request cũ không ghi đè bộ lọc hoặc hồ sơ mới.
- Kiểm tra bàn phím, focus lỗi, nhãn sao, bộ đếm ký tự, mobile, trạng thái chờ và double submit.

## 5. Chức năng chưa có hợp đồng tương ứng

- Lịch sử toàn bộ đánh giá công dân; sửa/xóa đánh giá; Manager trả lời/đổi trạng thái phản ánh; bộ lọc sao server; tiêu chí đánh giá phụ.
- Thống kê lượt tìm kiếm, khai thác biểu mẫu, nguyên nhân cần bổ sung, xuất Excel server.
- Danh sách job, retry/cancel job và tra job theo lần gửi bị timeout.
- Không suy diễn các chức năng trên từ endpoint gần giống. Giữ thông báo chưa hỗ trợ hoặc ẩn hành động phù hợp; chỉ bổ sung BE nếu phạm vi được thống nhất riêng.
- Thông báo cùng service dùng `/hubs/notifications`: `GetNotifications`, `GetUnreadCount`, `MarkRead`; không có REST notifications, xóa hoặc đánh dấu tất cả. Nếu làm thêm sau này cần SignalR client, đồng bộ cache chung và refresh/reconnect an toàn; hiện package chưa có `@microsoft/signalr`.

## 6. Kiểm tra và điều kiện hoàn thành

- Tại thời điểm lập kế hoạch: chỉ đọc code FE/BE và Swagger live, chưa sửa runtime hoặc chạy test/build. Kết quả triển khai sau đó được cập nhật ở đầu tài liệu và `PROGRESS.md`; chưa gửi mutation lên Azure.
- Khi triển khai: chạy `npm run typecheck`, `npm run lint`, `npm run build`, script proxy; bổ sung test tích hợp có ý nghĩa cho 10 thao tác và cập nhật test Manager/feedback đã lỗi thời.
- Test mock: role/phường, response sai cấu trúc, ngày biên 366/367, năm nhuận, page, feedback 0/6 sao và 2.000/2.001 ký tự, 404/409/503, dữ liệu thiếu/null, job 202→trạng thái kết thúc, cache đổi tài khoản và gửi trùng.
- Nếu sửa auth/core, chạy các test JWT/design-system/landing liên quan theo AGENTS.md.
- Xác minh thật cần tài khoản công dân/Manager/Admin được phép, dữ liệu đúng phường, cấu hình jobs bật và môi trường chấp nhận tính lại thống kê. Kết quả mock phải được báo tách biệt với kiểm chứng Azure.
- Nếu phát hiện lỗi BE cần thay đổi: cập nhật `docs/api-guide.md`, `docs/system-constraints.md`, `PROGRESS.md` của BE và chạy solution Release theo AGENTS.md; không tạo lại test project đã bị chủ dự án xóa.
- Hoàn thành khi cả 10 thao tác được nối UI đúng actor, không báo thành công giả, validation và trạng thái lỗi được kiểm tra, giới hạn API được ghi rõ, và cập nhật bàn giao.

## 7. File liên quan

- FE hiện có: `src/pages/manager/views/ManagerSystemStatsView.tsx`, `ManagerPerformanceView.tsx`, `ManagerFeedbackView.tsx`, `src/pages/admin/AdminPage.tsx`, `src/pages/citizen/CitizenPage.tsx`, `src/pages/citizen/views/CitizenFeedbackView.tsx`, `src/components/feedback/CitizenFeedbackModal.tsx`.
- Các test hiện có: `tests/manager.spec.ts`, `tests/feedback.spec.ts`, `tests/api-proxy-check.mjs`; test feedback đang khẳng định tính năng chưa khả dụng, phải cập nhật khi tích hợp.
- Tài liệu `FULL_PROJECT_API_AUDIT_AND_GAPS.md` ngày 20/10 loại trừ Analytics là bối cảnh cũ; yêu cầu mới của phiên này mở phạm vi cho ba nhóm actor ở mục 1.
- Giữ nguyên thay đổi có sẵn trong `package-lock.json`. Không pull/commit/push trong task lập kế hoạch này.
