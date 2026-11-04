# Danh sách theo dõi & Tiến độ hoàn thiện Portal WardMate

> **Tệp theo dõi tiến độ chi tiết theo từng hạng mục được người dùng yêu cầu.**  
> *Ngày khởi tạo: 03/11/2026 · Cập nhật theo thời gian thực*

---

## 📌 Bảng tổng quan trạng thái

| STT | Hạng mục công việc | Phạm vi | Trạng thái | Ghi chú |
| :---: | :--- | :---: | :---: | :--- |
| **1** | Thanh tìm kiếm Trang chủ chuyển sang Trang thủ tục | `HomePage.tsx` |  **Đã hoàn thành** | Gõ từ khóa chuyển sang `/thu-tuc?q=...`; giữ nguyên danh sách nổi bật |
| **2** | Sửa bảng Cách thức thực hiện & Lệ phí trong chi tiết thủ tục | `ProcedureDetailPage.tsx` | ⏳ **Chờ xử lý** | Sửa lỗi fallback 1 dòng `1 ngay · mien phi` (Ảnh 2) thành bảng chuẩn 3 hình thức (Ảnh 1) |
| **3** | Nâng cấp giao diện "Tệp văn bản nguồn công bố" | `ProcedureDetailPage.tsx` | ✅ **Đã hoàn thành** | Thay khung 450px bằng Thẻ tài liệu hành chính (~76px) + Modal xem toàn màn hình & Tải về (Ảnh 3) |
| **4** | Thời gian lưu & Thêm mốc giờ tin nhắn AI Chatbot | `AiChatWidget.tsx` | ✅ **Đã hoàn thành** | Đặt TTL 24h cho localStorage và thêm hiển thị giờ (`HH:mm`) cho từng bóng chat |
| **5** | Đổi logo AI Chatbot sang logo WardMate | `AiChatWidget.tsx` | ✅ **Đã hoàn thành** | Thay icon người dùng bằng `BrandMark` của dự án WardMate |
| **6** | Hiển thị AI Chatbot ở tất cả các trang | `App.tsx` | ✅ **Đã hoàn thành** | Đưa Chatbot lên cấp App Root (`App.tsx`), hiển thị xuyên suốt trên tất cả các trang (Trang chủ, Thủ tục, Công dân, Cán bộ,...) |
| **7** | Ràng buộc Single Role & Bảo vệ quyền IT_ADMIN | `AdminRbacViews.tsx` | ⏳ **Chờ xử lý** | Chuyển sang chọn 1 Role duy nhất (Radio/Select), chặn gán bừa bãi `IT_ADMIN` |
| **8** | Bỏ mã phường và ghi chú thừa trong modal tạo tài khoản cán bộ | `CreateStaffAccountModal.tsx` | ✅ **Đã hoàn thành** | Bỏ `({ward.code})` trong select; bỏ hint dưới vai trò và note ở chân modal |
| **9** | Tách riêng 2 trang Quản lý Accounts & Users | `AdminPage.tsx`, `api` | ✅ **Đã hoàn thành** | Tạo trang "Tài khoản đăng nhập" (`/api/v1/accounts`) và giữ trang "Người dùng hệ thống" (`/api/v1/admin/users`) |
| **10** | Xử lý tìm kiếm user theo Username & ký tự đặc biệt | `AdminPage.tsx` + `docs` BE | ⏳ **Chờ xử lý** | Làm sạch ký tự `@` phía FE; đã tạo file bàn giao Backend `BE_REQUESTS_FIXES_IAM_PROCEDURE.md` |

---

## 📋 Chi tiết từng hạng mục

### ✅ Mục 1: Thanh tìm kiếm ở Trang chủ chuyển sang Trang thủ tục
- **Vấn đề:** Khi gõ tìm kiếm ở Hero banner Trang chủ, trang tự cuộn xuống thay thế danh sách "Thủ tục nổi bật" bằng kết quả tìm kiếm thay vì mở trang danh mục thủ tục.
- **Giải pháp đã thực hiện:**
  - `handleSearch` điều hướng ngay sang `/thu-tuc?q=${encodeURIComponent(keyword)}`.
  - Các nút gợi ý nhanh (*Khai sinh*, *Kết hôn*, *Chứng thực*) chuyển hướng sang `/thu-tuc?q=...`.
  - Khu vực nổi bật `#thu-tuc-noi-bat` luôn hiển thị ổn định danh sách thủ tục nổi bật, bổ sung nút *"Xem tất cả thủ tục"*.
- **Tệp liên quan:** `src/pages/public/HomePage.tsx`, `tests/landing.spec.ts`.
- **Trạng thái kiểm thử:** Đã vượt qua `typecheck`, `eslint`, `build` production 100%.

---

### ⏳ Mục 2: Sửa lỗi UI mục Cách thức thực hiện, Lệ phí (Ảnh 1 & Ảnh 2)
- **Vấn đề:** Khi tệp PDF gốc có bảng "Cách thức thực hiện" đầy đủ nhưng API trả về `contentPayload.submissionMethods: []`, giao diện rơi vào fallback gộp 1 dòng duy nhất có nội dung `1 ngay · mien phi` (Ảnh 2) rất xấu và thiếu thông tin.
- **Giải pháp:**
  - Cải tiến fallback trong `ProcedureDetailPage.tsx`: Khi `submissionMethods` rỗng, tự động sinh các hàng hành chính tiêu chuẩn (Trực tiếp tại Bộ phận Một cửa, Trực tuyến qua Cổng DVC, Qua bưu điện) kết hợp với `processingTimeSummary` và `feeSummary` từ thủ tục (khớp định dạng chuẩn như Ảnh 1).
  - Đã lập biên bản kỹ thuật gửi BE trong `docs/BE_REQUESTS_FIXES_IAM_PROCEDURE.md` để hoàn thiện AI bóc tách.

---

### ✅ Mục 3: Nâng cấp giao diện "Tệp văn bản nguồn công bố" (Ảnh 3)
- **Vấn đề:** Khung `iframe` cố định cao 450px đặt chơ vơ giữa trang, khiến trang bị nặng, cuộn kép khó chịu, chữ bị nhỏ và thanh PDF viewer của trình duyệt chen chúc.
- **Giải pháp (Phương án 1):**
  - Chuyển thành **Thẻ văn bản hành chính (Administrative Document Card)** cao ~76px với icon PDF màu đỏ, nhãn *Văn bản gốc công bố*, tên file và mô tả pháp lý.
  - Tích hợp 3 nút thao tác:
    1. **"Xem văn bản gốc"**: Mở **Modal toàn màn hình (92vh)** hiển thị trọn vẹn văn bản A4 sắc nét, không bị cuộn kép.
    2. **"Mở tab mới"**: Mở PDF trên tab riêng của trình duyệt.
    3. **"Tải về"**: Tải trực tiếp file PDF về máy.
- **Tệp liên quan:** `src/pages/public/ProcedureDetailPage.tsx`.

---

### ✅ Mục 4: Cơ chế lưu trữ & Thời gian tin nhắn AI Chatbot
- **Vấn đề:** Cần làm rõ nơi lưu trữ tin nhắn guest và bổ sung thời gian gửi/nhận tin nhắn.
- **Hiện trạng & Giải pháp:**
  - Tin nhắn hiện lưu trong `localStorage.getItem('wardmate_guest_chat_messages')` vĩnh viễn (chưa có thời hạn).
  - Bổ sung cơ chế TTL hết hạn sau **24 giờ** (hoặc khi người dùng chủ động bấm Làm mới hội thoại).
  - Hiển thị thời gian (`HH:mm`) dưới chân mỗi bóng chat (cả tin nhắn của người dùng và câu trả lời của AI).

---

### ✅ Mục 5: Thay logo AI Chatbot thành logo WardMate của dự án
- **Vấn đề:** Hiện Chatbot dùng icon người dùng thông thường (`User`, `UserCheck`).
- **Giải pháp đã thực hiện:** Thay toàn bộ icon trợ lý ở nút mở chat, header khung chat, avatar bóng chat câu trả lời và trạng thái typing bằng biểu tượng thương hiệu chính thức `BrandMark` của WardMate (`@/components/brand/BrandMark`).

---

### ✅ Mục 6: Hiển thị AI Chatbot ở tất cả các trang
- **Yêu cầu:** Chatbot WardMate cần luôn sẵn sàng hỗ trợ người dân và cán bộ trên **mọi trang** của cổng thông tin, thay vì chỉ xuất hiện ở một trang nhất định.
- **Giải pháp đã thực hiện:**
  - Nhúng `<AiChatWidget />` tại tệp cấu hình gốc của ứng dụng [`App.tsx`](file:///d:/frontend/src/app/App.tsx) bên trong `<BrowserRouter>`.
  - Loại bỏ các lệnh nhúng cục bộ rải rác ở `HomePage.tsx` và `CitizenPage.tsx`.
  - Chatbot giờ đây hiển thị nổi cố định góc dưới bên phải (`fixed bottom-3 right-3 sm:bottom-6 sm:right-6 z-40`) trên toàn bộ hệ thống: Trang chủ, Danh mục thủ tục, Chi tiết thủ tục, Hướng dẫn, Hỏi đáp, Đăng nhập, và tất cả các Workspace chuyên biệt.

---

### ⏳ Mục 7: Phân quyền vai trò người dùng (Admin RBAC)
- **Vấn đề:** Modal gán vai trò người dùng hiện cho phép tích nhiều checkbox cùng lúc (đa vai trò gây xung đột luồng cán bộ/công dân) và cho phép gán cả quyền `IT_ADMIN`.
- **Giải pháp:**
  - Chuyển sang dạng chọn **1 vai trò duy nhất (Single Role)** qua Radio hoặc Dropdown Select.
  - Ẩn quyền `IT_ADMIN` khỏi danh sách gán vai trò nhân sự thông thường.
  - Đã lập biên bản gửi BE để thêm validation chặn cấp quyền trái phép.

---

### ✅ Mục 8: Bỏ mã phường và text gợi ý trong Modal tạo tài khoản cán bộ
- **Vấn đề:** Dropdown đơn vị hiển thị cả `({ward.code})` rườm rà; dưới lựa chọn vai trò và dưới chân form có các dòng text gợi ý/hint/note thừa.
- **Giải pháp đã thực hiện:**
  - Trong [`CreateStaffAccountModal.tsx`](file:///d:/frontend/src/pages/admin/CreateStaffAccountModal.tsx), danh sách chọn phường chỉ hiển thị tên phường (`{ward.name}`).
  - Xóa bỏ dòng chữ gợi ý vai trò `{roleOption.hint}` dưới dropdown vai trò.
  - Xóa bỏ đoạn văn bản ghi chú `* Vai trò được gán tự động...` ở cuối form giúp modal tinh gọn, sạch đẹp chuẩn form hành chính.

---

### ✅ Mục 9: Tách riêng 2 trang Quản lý Accounts & Users trong Admin
- **Vấn đề:** Trước đây chỉ có 1 màn hình `users` chung, chưa tận dụng API quản lý tài khoản xác thực độc lập `GET /api/v1/accounts` của Backend IAM.
- **Giải pháp đã thực hiện:**
  - Tách thành 2 menu độc lập trong nhóm **"Tài khoản & truy cập"**:
    1. **"Tài khoản đăng nhập" (`accounts`)**:
       - Kết nối API `GET /api/v1/accounts` (`getAccounts(page, pageSize)`).
       - Hiển thị bảng: Tên đăng nhập (`@username`), Email xác thực, Đơn vị Phường/Xã liên kết, Ngày tạo tài khoản, Trạng thái hoạt động (`Hoạt động` / `Tạm khóa`).
       - Thao tác: Hỗ trợ Khóa / Mở khóa tài khoản trực tiếp qua `PUT /api/v1/accounts/{userId}/status`.
       - Nghiệp vụ bảo mật: Đã lọc bỏ toàn bộ tài khoản quản trị tối cao (`IT_ADMIN`, `admin`, tài khoản đang đăng nhập) ra khỏi danh sách quản lý thông thường để tránh rủi ro thao tác nhầm và chuẩn hóa luồng nghiệp vụ.
    2. **"Người dùng hệ thống" (`users`)**:
       - Kết nối API `GET /api/v1/admin/users`.
       - Quản lý danh bạ cán bộ & công dân, phân công vai trò chuyên trách, xem/sửa hồ sơ nhân thân chi tiết.

---

### ⏳ Mục 10: Tìm kiếm tài khoản User theo Username & Ký tự đặc biệt
- **Vấn đề:** Tìm kiếm theo `Username` hoặc gõ `@username` trả về 0 kết quả do Backend `UserDirectory.cs` chỉ tìm theo `Email` và `FullName`.
- **Giải pháp:**
  - Frontend: Làm sạch tiền tố `@` trước khi gửi query lên API.
  - Backend: Đã tạo tài liệu chi tiết tại `docs/BE_REQUESTS_FIXES_IAM_PROCEDURE.md` để phía Backend cập nhật LINQ `x.Username`.

