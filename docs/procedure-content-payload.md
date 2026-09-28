# FE-TASK-08 — Chi tiết thủ tục công cộng

## Phạm vi đã chốt

Chỉ frontend với dữ liệu mẫu, không gọi API. Người dùng xác nhận chưa có schema
`content_payload` của BE và đồng ý dùng cấu trúc mẫu frontend.
JSONB là kiểu lưu trữ phía database; frontend nhận giá trị JSON qua API sau này,
không truy cập PostgreSQL hay phân tích định dạng nhị phân JSONB.

Route: `/thu-tuc/:procedureId`. Link từ danh sách giữ query tìm kiếm/lọc/trang
để quay lại đúng trạng thái. Mã không tồn tại có thông báo và link về danh sách.

## Cấu trúc mẫu v1 — chưa phải hợp đồng BE

```json
{
  "schemaVersion": 1,
  "overview": "Mô tả thủ tục đã được xác minh",
  "methods": [
    {
      "method": "Trực tiếp",
      "processingTime": "Thông tin cần được cơ quan tiếp nhận xác nhận.",
      "fee": "Chưa có mức phí, lệ phí được xác minh.",
      "notes": "Chưa xác nhận điều kiện miễn, giảm."
    }
  ],
  "legalBases": [],
  "receivingAgencies": []
}
```

- `legalBases`: các phần tử `{ number, title, url }`, title là chuỗi không rỗng.
- `receivingAgencies`: các phần tử `{ name, address, url }`, name là chuỗi không rỗng.
- `methods`: method là chuỗi không rỗng; thời hạn/lệ phí/ghi chú là chuỗi,
  không tự diễn giải số 0 là miễn phí hoặc giải quyết trong ngày.
- Mảng thiếu/null trở thành mảng rỗng. Không có dữ liệu thì hiện thông báo chờ xác nhận.
- Dữ liệu demo không điền số hiệu luật, lệ phí, ngày giải quyết hoặc tên cơ quan giả.
  Ba hình thức thực hiện chỉ minh họa bố cục, chưa xác nhận áp dụng.
- Không dùng các thông tin pháp lý trong mock quản trị làm dữ liệu chính thức.

## Parser và an toàn hiển thị

`src/lib/procedureContent.ts` nhận `unknown`: object hoặc chuỗi JSON.
Trả content đã kiểm tra và status `ready | empty | partial | invalid`.
JSON lỗi, root không phải object hoặc schemaVersion khác 1 trả invalid.
Các row sai bị bỏ, các field sai kiểu trở thành rỗng, phần hợp lệ được giữ.
Field lạ không được render. Nội dung được render dạng text bởi React,
không dùng `dangerouslySetInnerHTML`.
Link chỉ cho phép URL tuyệt đối HTTP/HTTPS không chứa credentials;
link không hợp lệ bị bỏ. Link mở tab mới dùng noopener/noreferrer.
Đây không phải kiểm tra tính đúng đắn pháp lý của dữ liệu.

## Giao diện

Tên/lĩnh vực/mã minh họa, breadcrumb, mục lục và bốn vùng:
thông tin chung; bảng cách thức–thời hạn–lệ phí; bảng căn cứ pháp luật;
cơ quan tiếp nhận. Mobile chuyển hàng bảng thành các khối có nhãn.
Có trạng thái thiếu nội dung, nội dung lỗi một phần, dữ liệu lỗi toàn bộ và mã không tồn tại.

Tham khảo cấu trúc mục từ kết quả tìm kiếm của Cổng Dịch vụ công Quốc gia:
https://dichvucong.gov.vn/p/home/dvc-tthc-thu-tuc-hanh-chinh-chi-tiet.html?ma_thu_tuc=1774&open_popup=1
Ngày tham khảo: 28/09/2026. Mở trang trực tiếp bị timeout/503; không khẳng định
đã đối chiếu toàn bộ giao diện hay sao chép số liệu pháp lý trên trang đó.

## Kiểm tra và tích hợp sau

`tests/procedure-detail.spec.ts` kiểm tra parser, URL không an toàn, trạng thái lỗi/rỗng,
text HTML không thực thi, điều hướng danh sách–chi tiết, reload và responsive.
Chạy: `npm run test:e2e -- tests/procedure-detail.spec.ts tests/landing.spec.ts`.

Khi có BE: lấy response mẫu và schema thật, điều chỉnh parser cùng test;
nối API, nguồn/ngày cập nhật đã xác minh và trạng thái tải/lỗi mạng.
Trang này chưa thực hiện nộp hồ sơ, đăng nhập, lấy biểu mẫu hay gửi tiền kiểm.
