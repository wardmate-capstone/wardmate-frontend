# Tích hợp điều phối, ca làm, nghỉ phép và tham vấn

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

## Điểm cần BE xử lý / xác nhận

1. DOCX tham vấn: DocumentForm ApplicationAccess.Read hỗ trợ fallback consultation/document-access, nhưng OfficerSubmissionsController.DownloadDocx gọi ApplicationAccess.OfficerSubmission → Check(officer: true), vẫn bắt AssignedOfficerId là người tải. FE đã nối request thật và hiển thị lỗi, không mở quyền hoặc giả lập tải thành công. Muốn chuyên viên tải DOCX đầy đủ cần BE bổ sung kiểm tra read-only tham vấn cho đường tải này. Không được mở fallback cho write/annotate/decide.
2. Lý do phân công: DispatchService nhận tối đa 2000 ký tự nhưng lưu history tối đa 500 ký tự gồm reasonCode. UI tạm giới hạn nội dung 470 ký tự để không mất phần đã nhập khi đọc lại lịch sử. Nếu BE sửa lưu đầy đủ thì cập nhật giới hạn UI cùng hợp đồng.
3. GET manager/applications mới chỉ hỗ trợ page/pageSize, không có các filter giám sát cũ. Vì vậy có màn Điều phối riêng, không giả bộ bộ lọc toàn tập bằng lọc client trên một trang.
4. Danh sách IAM hiện không trả quyền consultation.respond trong DTO frontend. Form chọn chuyên viên dùng danh sách cán bộ thật theo role/hoạt động/lĩnh vực và loại người phụ trách; ca làm, nghỉ và quyền trả lời được BE xác minh khi gửi. Không trình bày danh sách này là đã được BE xác nhận đủ điều kiện tham vấn. 422 tải lại dữ liệu và yêu cầu chọn lại.

## Nghiệm thu tiếp

Sau khi cấu hình mạng được áp dụng, đối chiếu lại Swagger Azure và đăng nhập tài khoản Manager/Officer được cấp quyền thật. Kiểm tra phân công, trùng ca/nghỉ, tự hủy đơn, bàn giao, tham vấn/thu hồi quyền và hai phiên cập nhật đồng thời. Không nhập mật khẩu/token vào tài liệu hoặc chat; đăng nhập qua giao diện ứng dụng. Chỉ thử thao tác ghi trên hồ sơ được phép dùng để nghiệm thu.
