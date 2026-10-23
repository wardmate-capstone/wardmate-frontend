# Kế hoạch kiểm thử toàn diện các tính năng mới & Chuẩn hóa ranh giới nghiệp vụ (Phương án 1)

> **Mục tiêu:** Cung cấp danh mục kịch bản kiểm thử từng bước (step-by-step test plan) giúp người dùng và đội ngũ dự án nghiệm thu toàn bộ các tính năng vừa triển khai phía Frontend, bao gồm các API Backend mới (P0, P1, P2) và việc chuẩn hóa ranh giới nghiệp vụ theo **Phương án 1** (Dừng lại ở tiền kiểm & mã QR, không thay thế Một cửa chính thức).

---

## Tóm tắt ma trận kịch bản kiểm thử

| Mã kịch bản | Phân hệ / Vai trò | Nội dung kiểm thử | Endpoint API liên quan |
| :--- | :--- | :--- | :--- |
| **TC-01** | Cán bộ Một cửa | Chuẩn hóa ranh giới nghiệp vụ (Phương án 1): Gỡ bỏ luồng tiếp nhận chính thức & cấp giấy hẹn | N/A (Giao diện UI/UX) |
| **TC-02** | Công dân / Cán bộ | Đổi mật khẩu tài khoản & Thu hồi phiên đăng nhập | `POST /api/v1/users/me/change-password` |
| **TC-03** | Công dân | Hủy hồ sơ tiền kiểm (trạng thái Nháp / Cần bổ sung) | `POST /api/v1/applications/{id}/cancel` |
| **TC-04** | Công dân | Trích xuất thông tin thẻ CCCD tự động bằng AI OCR | `POST /api/v1/ai-ocr/cccd/extract` |
| **TC-05** | Công dân | Tải lên bản khai DOCX đã điền offline | `POST /api/v1/citizen/submissions/upload-filled-docx` |
| **TC-06** | Cán bộ & Công dân | Xem trước trực tiếp tài liệu đính kèm (PDF, PNG, JPG) | `GET /api/v1/supporting-documents/{id}/preview` |
| **TC-07** | Cán bộ Một cửa | Theo dõi hạn xử lý tiền kiểm (Review Deadline - SLA 45h) | `dueAtUtc`, `deadlineStatus` |
| **TC-08** | Khách / Công dân | Danh mục thủ tục nổi bật tại Trang chủ | `GET /api/v1/procedures/featured` |
| **TC-09** | Khách / Công dân | Trợ lý ảo AI tư vấn quy trình thủ tục hành chính | `POST /api/v1/ai/chat/completions` |
| **TC-10** | Công dân & Cán bộ | Điểm kết thúc tiền kiểm: Sinh mã QR và tải trọn bộ hồ sơ PDF | `GET /api/v1/document-forms/applications/{id}/approved-qr` |

---

## Chi tiết các kịch bản kiểm thử (Step-by-Step)

### TC-01: Kiểm tra ranh giới nghiệp vụ Cán bộ Một cửa (Phương án 1)

* **Mục đích:** Xác minh không còn bất kỳ nút bấm, màn hình hoặc thông điệp nào ngộ nhận WardMate là hệ thống Một cửa điện tử tiếp nhận chính thức của Nhà nước.
* **Tài khoản test:** Cán bộ Một cửa (`FRONT_DESK_OFFICER`).
* **Các bước thực hiện:**
  1. Đăng nhập với tài khoản Cán bộ Một cửa và vào trang `/can-bo`.
  2. Quan sát thanh điều hướng Sidebar bên trái:
     * **Kỳ vọng:** Chỉ hiển thị nhóm *"Quản lý hồ sơ"* gồm 6 mục tiền kiểm: *Tất cả hồ sơ, Chờ tiền kiểm, Đang kiểm tra, Cần bổ sung, Đã gửi lại, Giấy tờ sẵn sàng*.
     * **Kỳ vọng:** **KHÔNG** còn mục *"Chờ tiếp nhận chính thức"*, *"Tiếp nhận hồ sơ tại quầy"* hay *"Hồ sơ đã tiếp nhận chính thức"*.
  3. Quan sát màn hình Dashboard Tổng quan (`/can-bo`):
     * **Kỳ vọng:** Thẻ hành động quầy Một cửa đã đổi tên thành **"Giấy tờ sẵn sàng nộp UBND"** với thống kê số hồ sơ đã duyệt tiền kiểm.
     * **Kỳ vọng:** Bấm nút *"Xem danh sách hồ sơ sẵn sàng"* sẽ chuyển hướng sang tab *"Giấy tờ sẵn sàng"* (`apps-approved`).
  4. Mở danh sách hồ sơ:
     * **Kỳ vọng:** Không còn màn hình đối chiếu 4 mục giấy tờ hay nút *"Xác nhận tiếp nhận chính thức tại quầy (cấp biên nhận)"*.

---

### TC-02: Kiểm tra Đổi mật khẩu tài khoản & Thu hồi phiên

* **Mục đích:** Kiểm tra form đổi mật khẩu, tiêu chí độ mạnh mật khẩu và xử lý thu hồi phiên từ backend.
* **Tài khoản test:** Bất kỳ (Công dân hoặc Cán bộ).
* **Các bước thực hiện:**
  1. Bấm vào Avatar tài khoản ở góc trên cùng bên phải màn hình -> Chọn **"Đổi mật khẩu"**.
     *(Hoặc vào trang Cá nhân `/cong-dan/ho-so` hoặc `/can-bo` -> chọn mục "Hồ sơ cá nhân" -> bấm nút "Đổi mật khẩu")*.
  2. Tại cửa sổ **Đổi mật khẩu**:
     * Nhập mật khẩu hiện tại.
     * Nhập mật khẩu mới không đạt chuẩn (ví dụ: `123456`) -> Kiểm tra 4 dòng checklist tiêu chí:
       - Tối thiểu 8 ký tự.
       - Chữ hoa & chữ thường.
       - Chữ số.
       - Ký tự đặc biệt.
     * Nhập mật khẩu xác nhận không khớp -> Nút "Xác nhận đổi mật khẩu" bị vô hiệu hóa hoặc báo lỗi đỏ.
     * Bấm icon mắt để kiểm tra tính năng ẩn/hiện mật khẩu.
  3. Nhập mật khẩu mới hợp lệ và bấm **"Xác nhận đổi mật khẩu"**.
* **Kết quả kỳ vọng:**
  * Thông báo Toast thành công: *"Đổi mật khẩu thành công. Vui lòng đăng nhập lại với mật khẩu mới."*
  * Hệ thống tự động thu hồi access token và chuyển hướng về trang `/dang-nhap`.
  * Đăng nhập lại bằng mật khẩu mới thành công; đăng nhập bằng mật khẩu cũ bị từ chối.

---

### TC-03: Kiểm tra Công dân Hủy hồ sơ tiền kiểm

* **Mục đích:** Kiểm tra quyền hủy hồ sơ của công dân khi hồ sơ đang ở trạng thái nháp hoặc cần chỉnh sửa.
* **Tài khoản test:** Công dân (`CITIZEN`).
* **Các bước thực hiện:**
  1. Vào phân hệ Công dân -> Chọn tab **"Hồ sơ của tôi"**.
  2. Chọn một hồ sơ ở trạng thái **"Bản nháp"** hoặc **"Cần bổ sung / chỉnh sửa"** để mở xem chi tiết.
  3. Quan sát phần đầu trang chi tiết hồ sơ:
     * **Kỳ vọng:** Xuất hiện nút **"Hủy hồ sơ"** (màu đỏ nhạt / viền đỏ).
  4. Bấm nút **"Hủy hồ sơ"**:
     * **Kỳ vọng:** Hiển thị Modal cảnh báo xác nhận *"Bạn có chắc chắn muốn hủy hồ sơ này? Thao tác này không thể hoàn tác."*
  5. Bấm xác nhận hủy:
     * **Kỳ vọng:** Toast hiển thị thông báo hủy thành công. Trạng thái hồ sơ chuyển sang **"Đã hủy"** (`CANCELLED`) và các nút nộp/chỉnh sửa bị khóa.
  6. Kiểm tra đối chứng: Mở một hồ sơ đã chuyển sang *"Giấy tờ sẵn sàng"* hoặc *"Đang kiểm tra"*:
     * **Kỳ vọng:** Không hiển thị nút "Hủy hồ sơ" (đúng nghiệp vụ).

---

### TC-04: Kiểm tra Trích xuất thẻ CCCD bằng AI OCR

* **Mục đích:** Kiểm tra tính năng bóc tách tự động thông tin từ ảnh thẻ Căn cước công dân.
* **Tài khoản test:** Công dân (`CITIZEN`).
* **Các bước thực hiện:**
  1. Vào phân hệ Công dân -> Chọn mục **"Hồ sơ cá nhân"** (`/cong-dan/ho-so`).
  2. Bấm vào nút **"Quét CCCD bằng AI"** (hoặc icon máy ảnh / AI OCR).
  3. Tải lên ảnh mặt trước CCCD (bắt buộc) và mặt sau (tùy chọn) định dạng JPG/PNG dung lượng < 8MB.
  4. Bấm **"Bắt đầu trích xuất"**:
     * Cửa sổ hiển thị trạng thái đang xử lý quét AI.
  5. Khi có kết quả:
     * **Kỳ vọng:** Hiển thị bảng đối chiếu các trường thông tin bóc tách: *Số CCCD, Họ và tên, Ngày sinh, Giới tính, Quê quán, Địa chỉ thường trú*.
     * **Kỳ vọng:** Có chỉ số độ tin cậy AI (Confidence score) và lưu ý bảo mật dữ liệu.
  6. Bấm **"Áp dụng vào thông tin cá nhân"**:
     * **Kỳ vọng:** Dữ liệu bóc tách tự động điền vào các ô tương ứng trên form thông tin cá nhân của công dân mà không cần nhập thủ công.

---

### TC-05: Kiểm tra Nộp bản Word (DOCX) đã điền offline

* **Mục đích:** Hỗ trợ công dân tải biểu mẫu Word về máy, điền văn bản ngoại tuyến và nộp lại lên hệ thống.
* **Tài khoản test:** Công dân (`CITIZEN`).
* **Các bước thực hiện:**
  1. Vào một hồ sơ đang trong bước điền tờ khai / checklist tài liệu.
  2. Bấm tải biểu mẫu Word mẫu (.docx) về máy tính.
  3. Mở Word điền một số thông tin mẫu và lưu lại file.
  4. Tại giao diện hồ sơ WardMate, bấm nút **"Tải lên bản khai DOCX"**.
  5. Chọn file DOCX vừa điền và xác nhận tải lên.
* **Kết quả kỳ vọng:**
  * File được nạp thành công lên backend qua endpoint `/api/v1/citizen/submissions/upload-filled-docx`.
  * Trạng thái tờ khai chuyển sang đã tải lên, hiển thị tên file và thời gian nộp.

---

### TC-06: Kiểm tra Xem trước trực tiếp tài liệu đính kèm (Inline Stream)

* **Mục đích:** Cán bộ và công dân xem trực tiếp giấy tờ đính kèm (PDF, ảnh JPG/PNG) ngay trên giao diện mà không phải tải file về máy.
* **Các bước thực hiện:**
  1. **Phía Cán bộ:** Mở hồ sơ thẩm định -> Tab *"Giấy tờ kèm theo"* (`OfficerDocumentsPanel`).
  2. **Phía Công dân:** Mở chi tiết hồ sơ -> Bảng *"Tài liệu đính kèm"*.
  3. Bấm vào icon con mắt **"Xem trước"** trên một tài liệu dạng PDF:
     * **Kỳ vọng:** Mở modal xem trước tài liệu nhúng trực tiếp luồng stream từ `/api/v1/supporting-documents/{id}/preview`.
  4. Bấm xem trước trên một file ảnh (PNG hoặc JPG):
     * **Kỳ vọng:** Ảnh hiển thị sắc nét trong khung xem trước, có nút phóng to / đóng.
  5. Thử nghiệm trên file Word hoặc file không hỗ trợ inline:
     * **Kỳ vọng:** Hệ thống tự động fallback hiển thị nút tải về thay vì báo lỗi màn hình trắng.

---

### TC-07: Kiểm tra Theo dõi Hạn xử lý tiền kiểm (SLA 45 giờ làm việc)

* **Mục đích:** Kiểm tra tính năng tính toán và hiển thị cảnh báo thời hạn giải quyết tiền kiểm hồ sơ.
* **Các bước thực hiện:**
  1. **Phía Cán bộ (`/can-bo`):**
     * Mở danh sách hồ sơ (`OfficerApplicationListView`).
     * Quan sát cột thông tin thời gian xử lý: Hiển thị hạn tiền kiểm (dựa vào `dueAtUtc`).
     * Với hồ sơ còn hạn: Hiển thị nhãn thời gian hẹn giải quyết bình thường.
     * Với hồ sơ đã quá thời hạn 45 giờ làm việc: Hiển thị badge cảnh báo màu đỏ **"Quá hạn xử lý"**.
  2. **Phía Công dân:**
     * Mở chi tiết một hồ sơ đang chờ duyệt.
     * Khối trạng thái hiển thị thông tin: *"Thời hạn tiền kiểm dự kiến: 45 giờ làm việc kể từ thời điểm gửi hồ sơ"*.

---

### TC-08: Kiểm tra Danh mục Thủ tục nổi bật tại Trang chủ

* **Mục đích:** Khách vãng lai và công dân truy cập trang chủ dễ dàng tìm thấy các thủ tục hành chính thường gặp.
* **Các bước thực hiện:**
  1. Mở trình duyệt và truy cập trang chủ `http://localhost:4317/` (khi chưa đăng nhập hoặc đã đăng nhập).
  2. Không nhập từ khóa vào ô tìm kiếm, quan sát phần danh mục thủ tục phía dưới:
     * **Kỳ vọng:** Hiển thị khối **"Thủ tục hành chính nổi bật"** được lấy tự động từ API `/api/v1/procedures/featured`.
     * Mỗi thẻ thủ tục có huy hiệu *"Nổi bật"*, thời gian giải quyết, mức phí và nút *"Xem hướng dẫn"*.
  3. Nhập từ khóa tìm kiếm (VD: `khai sinh`):
     * **Kỳ vọng:** Giao diện chuyển mượt mà sang chế độ hiển thị kết quả tìm kiếm theo từ khóa. Xóa từ khóa tìm kiếm -> Quay lại danh sách thủ tục nổi bật.

---

### TC-09: Kiểm tra Trợ lý ảo AI tư vấn quy trình thủ tục

* **Mục đích:** Đảm bảo công dân có thể tương tác hỏi đáp 24/7 với chatbot AI về hồ sơ, giấy tờ.
* **Các bước thực hiện:**
  1. Truy cập Trang chủ (`/`) hoặc Cổng dịch vụ công dân (`/cong-dan`).
  2. Quan sát góc dưới cùng bên phải màn hình:
     * **Kỳ vọng:** Có nút tròn nổi (Floating button) mang biểu tượng Trợ lý AI với huy hiệu *"Hỗ trợ 24/7"*.
  3. Bấm vào nút để mở khung chat:
     * **Kỳ vọng:** Cửa sổ chat mở lên mượt mà, hiển thị lời chào và 3 câu hỏi gợi ý nhanh (VD: *Thủ tục đăng ký kết hôn cần giấy tờ gì?*, *Lệ phí cấp bản sao trích lục là bao nhiêu?*...).
  4. Bấm thử một câu hỏi gợi ý hoặc tự nhập câu hỏi:
     * **Kỳ vọng:** Hiển thị bong bóng câu hỏi của người dùng và hiệu ứng "Đang suy nghĩ...".
     * **Kỳ vọng:** AI trả lời đầy đủ, tiếng Việt có dấu, liệt kê rõ các bước và giấy tờ cần mang đến UBND.
     * Dưới câu trả lời có dòng thông báo pháp lý: *"Thông tin chỉ mang tính tham khảo hướng dẫn chuẩn bị..."*.
  5. Gửi tiếp câu hỏi thứ hai:
     * **Kỳ vọng:** Hội thoại duy trì ngữ cảnh trong cùng phiên chat (`conversationId`).

---

### TC-10: Kiểm tra Điểm kết thúc tiền kiểm: Mã QR & Bản in PDF nộp UBND

* **Mục đích:** Kiểm tra điểm chạm cuối cùng của WardMate: Cung cấp mã tra cứu và bộ hồ sơ hoàn chỉnh để công dân mang đến Một cửa UBND.
* **Các bước thực hiện:**
  1. Cán bộ Một cửa thực hiện duyệt một hồ sơ đạt yêu cầu -> Hồ sơ chuyển sang trạng thái **"Giấy tờ sẵn sàng"** (`DOCUMENTS_READY`).
  2. Công dân đăng nhập vào tài khoản -> Vào tab **"Mã QR hồ sơ"** (`/cong-dan` -> tab `qr_code`):
     * **Kỳ vọng:** Hiển thị thông báo pháp lý: *"Xác nhận giấy tờ sẵn sàng không thay thế việc tiếp nhận hồ sơ chính thức. Cán bộ sẽ đối chiếu giấy tờ khi bạn đến."*
     * Chọn hồ sơ vừa được duyệt: Hiển thị hình ảnh mã QR tra cứu hồ sơ tiền kiểm đã được sinh từ backend.
     * Bấm vào liên kết hoặc quét mã QR: Mở đúng thông tin tra cứu hồ sơ phiên bản đã duyệt.
  3. Bấm nút **"Tải trọn bộ hồ sơ PDF"** trong chi tiết hồ sơ:
     * **Kỳ vọng:** Tải file PDF hoàn chỉnh gồm tờ khai có mã QR và các tài liệu đính kèm để công dân sẵn sàng in ra giấy mang đến nộp tại Bộ phận Một cửa.

---

## Mẫu phiếu ghi nhận kết quả kiểm thử (Test Log)

Khi thực hiện kiểm tra, bạn có thể đánh dấu kết quả vào bảng dưới đây:

| Mã TC | Tính năng | Người kiểm thử | Ngày test | Kết quả (Đạt / Chưa đạt) | Ghi chú / Lỗi phát sinh |
| :---: | :--- | :---: | :---: | :---: | :--- |
| **TC-01** | Ranh giới Phương án 1 (Gỡ bỏ tiếp nhận Một cửa) | | | `[ ] Đạt  [ ] Chưa đạt` | |
| **TC-02** | Đổi mật khẩu & Thu hồi token | | | `[ ] Đạt  [ ] Chưa đạt` | |
| **TC-03** | Hủy hồ sơ tiền kiểm | | | `[ ] Đạt  [ ] Chưa đạt` | |
| **TC-04** | AI OCR trích xuất thẻ CCCD | | | `[ ] Đạt  [ ] Chưa đạt` | |
| **TC-05** | Tải lên bản khai Word offline | | | `[ ] Đạt  [ ] Chưa đạt` | |
| **TC-06** | Xem trước trực tiếp PDF / Ảnh | | | `[ ] Đạt  [ ] Chưa đạt` | |
| **TC-07** | SLA & Cảnh báo quá hạn 45h | | | `[ ] Đạt  [ ] Chưa đạt` | |
| **TC-08** | Thủ tục nổi bật trang chủ | | | `[ ] Đạt  [ ] Chưa đạt` | |
| **TC-09** | Trợ lý ảo AI Chatbot | | | `[ ] Đạt  [ ] Chưa đạt` | |
| **TC-10** | Mã QR & Tải trọn bộ hồ sơ PDF | | | `[ ] Đạt  [ ] Chưa đạt` | |
