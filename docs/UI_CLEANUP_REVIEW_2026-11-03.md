# Rà soát UI thừa — 03/11/2026

Yêu cầu: rà soát FE và xóa phần UI thừa, không cần thiết. Baseline `4658dba`, working tree sạch khi bắt đầu; không tự commit/push cho task mới.

## Phạm vi khảo sát

- Kiểm kê 116 file trong `src/pages` và `src/components`; quét AST trên 173 file TS/TSX trong `src`, bao gồm 582 phần tử button/Button. Lần theo các route App, sidebar/header, tổng quan năm workspace, trang công khai và nơi sử dụng các placeholder.
- Đối chiếu `UI_UX_DESIGN_STANDARD.md`, `docs/FRONTEND_SETUP.md`, `Officer.md`, `Procedure Management.md` và các luồng thật trước khi xóa.
- Tiêu chí xóa: khối tĩnh không có dữ liệu, thông báo chờ chiếm cả vùng nội dung, form bị vô hiệu hóa hoàn toàn, lối vào trùng menu hoặc chỉ dẫn tới cùng màn chưa kết nối. Không coi dữ liệu rỗng do API/lỗi/quyền là UI thừa.

## Đã dọn

| Khu vực | Phần bỏ | Luồng còn giữ |
|---|---|---|
| Admin | 3 KPI luôn “—”; biểu đồ lưu lượng chờ; thẻ giám sát cũ vẫn báo chưa tích hợp; khối 5 phím tắt trùng sidebar | Tổng tài khoản từ API, phân quyền gần đây; toàn bộ menu và 29 lời gọi Analytics đã tích hợp, gồm màn giám sát thật |
| Công dân | Biểu đồ hoạt động chỉ có thông báo chờ; code phím tắt đã comment | Số liệu hồ sơ, hồ sơ gần đây, bổ sung/đánh giá/QR và hướng dẫn chuẩn bị |
| Cán bộ | Biểu đồ và hiệu suất chờ; thông tin quầy tĩnh có “Đang nhận tiếp dân”; nhãn V2 cố định, câu nói công dân đã nhận PDF/QR không có bằng chứng ở thẻ | Hồ sơ gửi lại ưu tiên, xem nhanh/mở thẩm định, danh sách hồ sơ sẵn sàng; chỉnh cấp heading sau khi bỏ chart |
| Quản lý thủ tục | KPI bản nháp không có số; 3 cảnh báo không có thống kê; 2 vùng tổng hợp trống; 7 mục sidebar chỉ dẫn tới trang chờ | Thống kê công khai/tạm ngừng, thủ tục gần đây, danh sách, PDF/bản nháp, danh mục, kho biểu mẫu, AI, hồ sơ cá nhân |
| Hỏi đáp công khai | Form gửi câu hỏi bị khóa toàn bộ, component `QuestionForm` và CSS riêng không còn dùng | Accordion hỏi đáp, giới hạn tiền kiểm, hướng dẫn QR và liên kết tra cứu; chuyển layout một cột |

7 mục sidebar quản lý thủ tục được bỏ: Thành phần hồ sơ, Quy trình thực hiện, Phiên bản biểu mẫu, Gắn biểu mẫu vào thủ tục, Văn bản pháp lý, Liên kết thủ tục - VB, Lịch sử cập nhật. Các thao tác thật theo từng thủ tục/biểu mẫu vẫn ở detail/editor/modal phiên bản; không xóa API hoặc dữ liệu nghiệp vụ. Giữ kiểu section và fallback cũ để không tự phá tương thích các caller cũ.

## Đã đối chiếu và giữ

- Manager: biểu đồ, bộ lọc và coverage thực từ Analytics có mục đích riêng; không xóa chỉ vì dữ liệu có thể null/rỗng.
- Header/sidebar, menu tài khoản, chuông thông báo: các lối vào có chức năng, phục vụ cả desktop/mobile. Hai nút menu công khai không có onClick trực tiếp được Radix Trigger/Close điều khiển; nút tên vai trò nổi click lên dòng. Không coi chúng là nút rỗng từ kết quả quét AST.
- Form hồ sơ, upload, validation, quyền, modal xác nhận, cảnh báo mất nháp, thông báo lỗi và hướng dẫn tiền kiểm/QR: giữ vì giúp người dùng quyết định đúng.
- Cảnh báo Verify backup đã được người dùng yêu cầu ghi rõ do lỗi BE thực tế: giữ, không coi là chữ thừa.
- Public tìm kiếm/thủ tục/hướng dẫn, auth và profile, AI, staffing/dispatch/consultations, thông báo, các bảng và modal đang có API: giữ. Không thêm dependency, refactor auth/cache hay sửa BE.
- PermissionFeatureContent chưa sẵn sàng chỉ phục vụ URL feature cũ, đã không có menu sidebar riêng; giữ tương thích thay vì xóa ngầm cơ chế phân quyền.

## Kiểm tra

Cập nhật test hiện có theo UI mới: FAQ vẫn đọc câu trả lời/đi tới tra cứu; sidebar không đưa vào trang rỗng; dashboard giữ số liệu/thủ tục thật; Officer mobile vẫn có hồ sơ ưu tiên/sẵn sàng và không tràn ngang. Không tạo test chỉ để đếm số dòng đã xóa.

Typecheck, lint, build và diff check đã đạt. Playwright có kết quả đạt cho 60 ca khác nhau qua các lượt chạy: 57 ca ở lượt đầy đủ và 3 ca chạy lại sau cập nhật assertion cũ về KPI/chuông/skeleton. Lượt đầu bị timeout khi lazy workspace đang tải cùng lúc build đã dừng; lượt sau chạy riêng, timeout 60 giây qua CLI. Đã xem ảnh mobile Officer; đây là kiểm thử mock, không xác minh Azure. Chi tiết tại `PROGRESS.md`. Chưa commit/push task này.
