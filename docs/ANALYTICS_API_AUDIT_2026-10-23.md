# Đối chiếu API Analytics và rà soát validation — 23/10/2026

## Nguồn và kết luận phạm vi

Đã đọc lại Swagger Azure trực tiếp trong lượt rà soát này:
https://wardmate-gateway.blackmeadow-a2f12767.japaneast.azurecontainerapps.io/api/analytics-system/swagger/v1/swagger.json

Đối chiếu với controller/DTO/service AnalyticsSystem tại `E:/wardmate-backend` và luồng UI hiện tại của FE. Swagger có **10 thao tác HTTP nghiệp vụ, cả 10 đều đã có client và thao tác UI**. Thao tác thứ 11 là `GET /`, chỉ trả thông tin dịch vụ, không cần tạo màn hình người dùng. Không có endpoint nghiệp vụ mới phát sinh so với kế hoạch.

## API → client → UI

Trang Tổng quan Manager tại `ManagerOverviewView.tsx` cũng đọc overview, trends và feedback summary; đã có menu Tổng quan và là màn mặc định `/manager`. Không phát sinh endpoint mới.

Tất cả route nghiệp vụ bắt đầu bằng `/api/v1`. Client chung: `src/lib/api/analytics.ts`.

| Method / route | Client | Vị trí gọi thực tế | Actor |
| --- | --- | --- | --- |
| GET `/analytics/overview` | `overview` | `ManagerAnalyticsView.tsx`: thống kê hồ sơ / đúng hạn / lượt bổ sung | MANAGER |
| GET `/analytics/trends` | `trends` | `ManagerAnalyticsView.tsx`: biểu đồ, bảng ngày, hồ sơ tồn | MANAGER |
| GET `/analytics/procedures` | `procedures` | `ManagerAnalyticsView.tsx`: bảng thống kê thủ tục và phân trang | MANAGER |
| GET `/analytics/officers` | `officers` | `ManagerAnalyticsView.tsx`: hiệu suất / thời gian theo cán bộ | MANAGER |
| GET `/analytics/feedback/summary` | `summary` | `ManagerAnalyticsView.tsx`: mức độ hài lòng | MANAGER |
| GET `/analytics/feedback` | `feedback` | `ManagerAnalyticsView.tsx`: danh sách phản hồi và phân trang | MANAGER |
| POST `/analytics/jobs/rebuild` | `rebuild` | `AnalyticsJobsView.tsx`: form ngày → xác nhận → mutation | IT_ADMIN |
| GET `/analytics/jobs/{jobId}` | `job` | `AnalyticsJobsView.tsx`: job vừa tạo / tra cứu / polling | IT_ADMIN |
| GET `/citizen/feedback/{applicationId}` | `getFeedback` | `useCitizenFeedback` → `CitizenFeedbackModal.tsx`: xem trước khi gửi | REGISTERED_CITIZEN |
| POST `/citizen/feedback/{applicationId}` | `createFeedback` | `CitizenFeedbackModal.tsx`: form đánh giá theo ID hồ sơ thật | REGISTERED_CITIZEN |

Các view Manager hiện có bọc `src/components/analytics/ManagerAnalyticsView.tsx`; job tại `src/pages/admin/AnalyticsJobsView.tsx`; modal tại `src/components/feedback/CitizenFeedbackModal.tsx`. Manager đọc phản hồi qua Analytics; không sử dụng endpoint chính chủ của công dân. BE xác nhận role/phường/quyền sở hữu, FE không tự quyết định ward bằng query.

## Lỗi và thiếu sót đã sửa trong lượt rà soát

1. **Response đúng cấu trúc nhưng sai kỳ/trang vẫn có thể hiện dữ liệu:** client hiện đối chiếu `coverage.from/to`, `page/pageSize` với request; chặn số phần tử vượt pageSize/totalCount. Chỉ đối chiếu kỳ khi response có coverage; API danh sách/summary phản hồi hiện không trả metadata kỳ nên FE không thể tự chứng minh kỳ từ response này.
2. **Thiếu validation dữ liệu theo ngày:** chặn missingDates ngoài khoảng hoặc trùng nhau; xu hướng phải có một điểm cho mỗi ngày trong kỳ theo implementation BE, không chấp nhận ngày thiếu/trùng/ngoài kỳ.
3. **Validation UUID quá chặt so với .NET Guid:** đổi sang GUID dạng chuẩn không áp đặt version/variant UUID, vẫn chặn GUID rỗng và chuỗi sai định dạng.
4. **Focus lỗi validation BE chưa hoạt động đúng:** kiểm thử đã tái hiện lỗi góp ý có thông báo nhưng không được focus do fieldset còn khóa. Đã chuyển focus sau khi mutation kết thúc; form Admin chờ modal xác nhận đóng và Radix trả focus trước khi đưa tới ô ngày cần sửa. Bổ sung test cho cả hai form; không ép field lỗi của form khác vào form hiện tại.
5. **Manager thiếu cách chủ động lấy dữ liệu mới khi tải thành công:** thêm “Làm mới dữ liệu”, tải lại cả overview và trends tại màn thống kê hồ sơ, giữ bộ lọc đang áp dụng.
6. **Tra lại mã job có thể dùng cache còn mới:** job query dùng staleTime 0, khi quay lại một mã đã tra vẫn đọc lại trạng thái từ server. Polling chỉ tiếp tục với trạng thái đang chờ/đang xử lý đã biết.

## Validation đã đối chiếu

- Ngày lịch hợp lệ `yyyy-MM-dd`, từ 01/01/2000, From ≤ To ≤ hôm nay theo UTC+7, tối đa 366 ngày tính cả hai đầu, gồm trường hợp năm nhuận.
- GUID khác rỗng; Page nguyên 1–100.000; PageSize nguyên 1–100; jobId 1–30 chữ số ASCII.
- Rating nguyên 1–5, comment tối đa 2.000 ký tự, giữ nội dung khi BE từ chối. Chỉ cho đánh giá hồ sơ đủ điều kiện, BE vẫn kiểm tra trạng thái/chủ hồ sơ tại thời điểm POST.
- 404 chỉ được xem là chưa đánh giá nếu code là `feedback.not_found`. 409 đã đánh giá tải lại bản đã lưu; 409 chưa sẵn sàng khóa gửi lại và tải lại hồ sơ. Response đánh giá/job phải khớp ID được yêu cầu.
- 202 chỉ xác nhận xếp lịch job, không phải hoàn tất. Mutation không tự retry; không xóa phiên khi dịch vụ trả 503.

## Bằng chứng kiểm thử và giới hạn

- Lượt cuối: **22/22 test Edge/mock đạt** (`analytics.spec.ts`, `feedback.spec.ts`, `manager.spec.ts`), gồm cả 10 thao tác và các ca lỗi bổ sung bên trên.
- `npm run typecheck` và `npm run lint` đạt trong lượt rà soát; kết quả build cuối ghi tại `PROGRESS.md`.
- Không chạy lại bộ auth/core vì lượt này không sửa auth/core hoặc routing; 46 test của lượt triển khai trước là kết quả lịch sử riêng.
- Đọc Swagger live không đồng nghĩa đã kiểm chứng dữ liệu/role/phường bằng tài khoản thật. Chưa gửi đánh giá hoặc chạy rebuild trên Azure; chưa có tài khoản kiểm thử đúng role/phường trong phiên này.
- Không thiếu call trong phạm vi Swagger. Các tính năng ngoài hợp đồng vẫn còn giới hạn: lịch sử toàn bộ đánh giá công dân, sửa/xóa/trả lời đánh giá, thống kê tìm kiếm/biểu mẫu và xuất Excel. SignalR thông báo không nằm trong danh sách HTTP Swagger này.
- Tra tên cán bộ hiện lấy trang đầu tối đa 100 cán bộ từ IAM; người nằm ngoài danh sách này hoặc không còn trong danh bạ hiển thị ID dự phòng. Không coi ID dự phòng là tên thật.
- Không sửa BE, không thêm dependency, không commit/push và giữ nguyên thay đổi có sẵn trong `package-lock.json`.
