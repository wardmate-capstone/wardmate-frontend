# Rà soát FE và UI/UX — 16/10/2026

Phạm vi: mã nguồn FE, luồng công khai/auth, công dân, cán bộ một cửa, quản lý, quản lý thủ tục và quản trị hệ thống. Giữ các thay đổi DocumentForm chưa commit từ lượt trước; không sửa BE, commit, push hoặc deploy.

## Các lỗi đã sửa

| Nhóm | Lỗi và hành vi sau sửa |
| --- | --- |
| Điều hướng mobile | Sidebar dùng Radix Dialog: giữ focus bên trong, Escape đóng và trả focus về nút mở; menu đóng không còn nhận Tab ngoài màn hình. Menu công khai cuộn được khi nội dung dài. |
| Thông báo | Không đưa dữ liệu mẫu/localStorage cũ vào tài khoản. Bỏ số 3 gắn cứng ở quản trị và chuông không có hành động ở quản lý, dùng component chung. Liên kết hồ sơ có route hợp lệ theo phiên/vai trò. Popup qua portal, giới hạn chiều rộng và vị trí trong viewport, Escape trả focus. Hiển thị rõ chưa kết nối thông báo. |
| Khởi tạo hồ sơ | Không reset toàn bộ form khi đổi thủ tục hoặc danh mục cập nhật; giữ phường đã chọn. URL yêu cầu mở thủ tục được xử lý một lần, không tự mở lại sau khi đóng. Bổ sung thủ tục đang chọn vào lựa chọn nếu nằm ngoài trang danh mục đầu. |
| Danh sách hồ sơ | Phân biệt loading/lỗi với rỗng, có thử lại và phân trang server. Lĩnh vực lấy từ dữ liệu hiện tại; nút xóa bộ lọc thực sự đặt lại tìm kiếm/lĩnh vực. Ghi rõ bộ lọc chỉ áp dụng trang hiện tại. |
| Hồ sơ cá nhân | Hồ sơ cán bộ dùng cùng Zod validation, lỗi có liên kết trường và khóa lưu lặp. Không tự điền username làm họ tên hoặc giới tính Nam khi thiếu dữ liệu. Refetch không ghi đè bản đang sửa của công dân. Thêm tên truy cập cho trường nhập. Ngày tối đa dùng lịch địa phương. Thay nhãn xác thực/VNeID không có bằng chứng bằng thông tin kê khai. |
| Clipboard/in | Chỉ báo sao chép thành công khi clipboard hoàn tất; lỗi quyền có hướng dẫn thủ công, không đưa CCCD vào toast. Các nút in gọi window.print; màn hình quản lý đổi nhãn xuất báo cáo thành in màn hình. CSS in ẩn điều hướng/thao tác. |
| Chức năng chưa tích hợp | Khôi phục mật khẩu không thu mật khẩu/CCCD hoặc giả báo đã gửi/đổi. Gửi câu hỏi/đánh giá bị khóa và có lý do rõ khi chưa có API. Feedback hỗ trợ phím mũi tên/Home/End và xác nhận bỏ bản đang sửa; chỉ báo thành công sau callback gửi thực sự nếu được tích hợp. FAQ dẫn đúng trang thủ tục. |
| Kiểm thử | Chọn checkbox điều khoản theo role để tránh mở nhầm modal từ label. Fixture workflow trả danh sách rỗng hợp lệ. Thay các kỳ vọng thành công giả bằng kiểm tra trạng thái chưa khả dụng. |
| Hướng dẫn công dân | Bỏ cam kết đủ 100% giấy tờ, lấy số ưu tiên bằng QR và lịch làm việc gắn cứng chưa có nguồn dữ liệu; hướng dẫn kiểm tra với cơ quan tiếp nhận. |

## Phạm vi kiểm chứng

- `tests/ui-audit.spec.ts`: 5 workspace ở độ rộng 1440/720/320 px, độ rộng vùng nội dung, tràn ngang, lỗi JavaScript, focus menu/Tab/Escape; 8 route công khai/auth ở 320 px; clipboard bị từ chối.
- `tests/ui-state.spec.ts`: giữ phường khi đổi thủ tục, URL không mở lại modal, lỗi/thử lại/phân trang hồ sơ, chặn PUT profile sai, gọi in thật ở cấp browser API.
- `tests/notifications.spec.ts`: không dùng dữ liệu mẫu lưu cũ, popup 320/390/1440 px, Escape/focus, route hồ sơ.
- Các bộ hiện có kiểm tra auth/session/JWT, phân quyền, hồ sơ cá nhân, danh mục/thủ tục, quản lý tài khoản, DocumentForm và workflow bằng API mock.
- Proxy được kiểm tra qua Vite thật với HTTP targets cục bộ, không phải Azure.

Kết quả chạy cuối được ghi tại [PROGRESS.md](PROGRESS.md).

## Giới hạn còn lại

- Không có tài khoản/phiên để kiểm chứng Azure thật; không khẳng định API production hoặc quyền nghiệp vụ đã được xác minh end-to-end.
- Khôi phục mật khẩu, gửi câu hỏi, đánh giá và thông báo cần hợp đồng API để triển khai gửi/nhận thật. FE thể hiện trạng thái chưa khả dụng, không tự đặt endpoint.
- Các khoảng trống DocumentForm/QR và nghiệp vụ tiếp nhận vẫn theo [DOCUMENT_FORM_BACKEND_GAPS.md](DOCUMENT_FORM_BACKEND_GAPS.md).
- Reflow theo kích thước viewport không tương đương kiểm tra zoom trình duyệt thực tế. Chưa kiểm thử screen reader, máy in vật lý hoặc mọi tổ hợp dữ liệu thật. File ảnh screenshot trong `test-results` là sản phẩm kiểm tra tạm thời, không commit.
- `FormDocxEditorModal.tsx` cũ không được import bởi luồng hiện tại; không coi editor minh họa đó là chức năng Word đã tích hợp. Luồng đang dùng tải/sửa/upload Word theo tài liệu DocumentForm.
- Build có cảnh báo annotation từ dependency Zod và chunk lớn; không thay dependency hoặc refactor chia bundle trong đợt sửa lỗi này.
