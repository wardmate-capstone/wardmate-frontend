# Chuẩn thiết kế UI/UX — Hệ thống Hỗ trợ Chuẩn bị và Hướng dẫn Thủ tục Hành chính cấp Xã/Phường

> **Tên sản phẩm:** WardMate
> **Phiên bản tài liệu:** 1.0  
> **Ngôn ngữ sản phẩm:** Tiếng Việt  
> **Đối tượng của tài liệu:** Product Designer, UI/UX Designer, Front-end Developer, Business Analyst, QA và công cụ sinh giao diện bằng AI  
> **Phạm vi hiện tại:** Giao diện dành cho Khách vãng lai và Người dân đã đăng ký

---

## 1. Mục đích của tài liệu

Đây là tài liệu nguồn dùng để thiết kế mọi màn hình phía người dân của hệ thống. Trước khi tạo mới hoặc chỉnh sửa một màn hình, người thực hiện phải đọc tài liệu này để hiểu:

- Hệ thống giải quyết vấn đề gì.
- Người dùng là ai.
- Ranh giới pháp lý và nghiệp vụ của sản phẩm.
- Luồng hồ sơ và quy tắc chuyển trạng thái.
- Cách tổ chức điều hướng, nội dung và tương tác.
- Chuẩn hình ảnh, component, responsive và accessibility.
- Những nội dung hoặc hành vi không được thiết kế sai.

Khi yêu cầu của một màn hình chưa rõ, ưu tiên theo thứ tự:

1. Quy tắc nghiệp vụ trong tài liệu này.
2. Sự an toàn và khả năng hiểu đúng của người dân.
3. Tính nhất quán với luồng và component đã có.
4. Tính thẩm mỹ.

Không hy sinh tính dễ hiểu để tạo giao diện bắt mắt.

---

## 2. Tổng quan dự án

### 2.1. Bài toán

Người dân thường gặp khó khăn khi thực hiện thủ tục hành chính:

- Không biết chọn đúng thủ tục.
- Không hiểu điều kiện và thành phần hồ sơ.
- Không biết giấy tờ nào bắt buộc hoặc chỉ cần trong một số trường hợp.
- Điền sai hoặc thiếu tờ khai.
- Ảnh chụp tài liệu mờ, mất góc hoặc không đủ trang.
- Chỉ phát hiện thiếu sót khi đã đến cơ quan tiếp nhận.
- Không biết hồ sơ đang ở bước nào hoặc phải làm gì tiếp theo.

Hệ thống giúp người dân chuẩn bị hồ sơ tại nhà và gửi bản điện tử để cán bộ kiểm tra trước. Mục tiêu là giảm bỡ ngỡ, giảm sai sót và hạn chế việc đi lại nhiều lần.

### 2.2. Tuyên bố sản phẩm

**WardMate giúp người dân tìm đúng thủ tục, chuẩn bị đúng hồ sơ và nhận hướng dẫn tiền kiểm trước khi đến cơ quan tiếp nhận.**

### 2.3. Giá trị cốt lõi

- **Rõ ràng:** Nói cho người dân biết cần gì và vì sao.
- **Dễ thực hiện:** Chia công việc thành từng bước ngắn.
- **An tâm:** Luôn cho biết dữ liệu đã lưu chưa và tiếp theo cần làm gì.
- **Minh bạch:** Phân biệt rõ tiền kiểm với tiếp nhận chính thức.
- **Bao hàm:** Người lớn tuổi và người ít sử dụng công nghệ vẫn có thể thao tác.

---

## 3. Ranh giới nghiệp vụ bắt buộc

### 3.1. Bản chất của hệ thống

Đây là hệ thống **hỗ trợ chuẩn bị và tiền kiểm hồ sơ**. Đây không phải cổng nộp hồ sơ hành chính trực tuyến chính thức.

**Tiền kiểm** là bước cán bộ kiểm tra trước để giúp người dân chuẩn bị hồ sơ đầy đủ trước khi đến cơ quan tiếp nhận.

### 3.2. Các quy tắc không được vi phạm

1. Điền xong tờ khai không có nghĩa là đã nộp hồ sơ.
2. Gửi hồ sơ tiền kiểm không có nghĩa là đã nộp hồ sơ chính thức.
3. Gửi bổ sung không được tự động chuyển thành đã duyệt.
4. Chỉ cán bộ có thẩm quyền mới có thể duyệt tiền kiểm.
5. Mã QR chỉ được tạo sau khi cán bộ duyệt tiền kiểm.
6. Mã QR đại diện cho đúng phiên bản hồ sơ đã được duyệt.
7. Hồ sơ đã duyệt phải ở chế độ chỉ đọc đối với người dân.
8. Mã QR không phải kết quả giải quyết thủ tục, giấy hẹn hoặc số thứ tự.
9. Việc tiếp nhận chính thức chỉ xảy ra khi người dân đến cơ quan có thẩm quyền và cán bộ xác nhận đã đối chiếu hồ sơ giấy.
10. AI không được tự kết luận người dân đủ điều kiện pháp lý.
11. OCR chỉ hỗ trợ nhập dữ liệu, không xác thực danh tính.
12. Tải tệp thành công không có nghĩa là giấy tờ đã được cán bộ xác nhận hợp lệ.
13. Không được tự tạo thông tin pháp lý, lệ phí, thời hạn, căn cứ, địa chỉ hoặc số điện thoại chưa được xác minh.
14. Thủ tục không thuộc phạm vi tiếp nhận của xã/phường phải chỉ rõ cơ quan có thẩm quyền và không hiển thị hành động gửi tiền kiểm gây hiểu nhầm.

### 3.3. Câu thông báo bắt buộc

Tại bước gửi tiền kiểm:

> Tôi đã kiểm tra thông tin và hiểu rằng đây là yêu cầu tiền kiểm, chưa phải nộp hồ sơ hành chính chính thức.

Tại trang QR:

> Duyệt tiền kiểm không thay thế việc tiếp nhận hồ sơ chính thức. Cán bộ sẽ đối chiếu giấy tờ khi bạn đến.

Khi giải thích tiền kiểm lần đầu:

> Tiền kiểm là bước cán bộ kiểm tra trước để giúp bạn chuẩn bị hồ sơ đầy đủ trước khi đến cơ quan tiếp nhận.

---

## 4. Phạm vi actor

### 4.1. Actor toàn hệ thống

- Khách vãng lai.
- Người dân đã đăng ký.
- Cán bộ Một cửa.
- Lãnh đạo/Quản lý.
- Quản lý thủ tục và pháp lý.
- Quản trị hệ thống.
- Dịch vụ AI/LLM.
- Dịch vụ OCR.
- Dịch vụ thông báo.

### 4.2. Actor thuộc phạm vi UI hiện tại

#### Khách vãng lai

Có thể:

- Xem trang chủ.
- Tra cứu thủ tục.
- Xem chi tiết, thành phần hồ sơ và quy trình.
- Xem hoặc tải biểu mẫu trống và mẫu minh họa.
- Xem hướng dẫn, câu hỏi thường gặp.
- Dùng trợ lý AI ở mức tra cứu cơ bản.

Không thể:

- Lưu hồ sơ cá nhân.
- Gửi tiền kiểm.
- Xem hồ sơ riêng tư.
- Nhận phản hồi hoặc mã QR.

#### Người dân đã đăng ký

Có toàn bộ quyền của khách và có thể:

- Lưu thông tin cá nhân.
- Tạo và lưu bản nháp.
- Hoàn thành danh sách giấy tờ.
- Điền tờ khai điện tử.
- Tải tài liệu tiền kiểm.
- Xem, in hoặc tải tờ khai được tạo.
- Gửi hồ sơ tiền kiểm.
- Theo dõi trạng thái và lịch sử.
- Nhận và xử lý yêu cầu bổ sung.
- Gửi lại hồ sơ để tiền kiểm.
- Nhận mã QR sau khi được duyệt.
- Gửi đánh giá và góp ý.

### 4.3. Ngoài phạm vi UI hiện tại

Không thiết kế các workspace sau nếu chưa có yêu cầu mở rộng rõ ràng:

- Cổng làm việc của cán bộ.
- Dashboard lãnh đạo.
- Quản lý danh mục thủ tục.
- Quản trị tài khoản, phân quyền và hệ thống.

---

## 5. Người dùng mục tiêu

### 5.1. Nhóm chính

- Người dân Việt Nam lần đầu thực hiện một thủ tục.
- Người lớn tuổi hoặc ít sử dụng công nghệ.
- Người dùng điện thoại để chụp tài liệu.
- Người bận rộn muốn chuẩn bị trước ở nhà.
- Người quay lại để theo dõi hoặc bổ sung hồ sơ.

### 5.2. Nhu cầu cốt lõi

Người dùng cần trả lời nhanh năm câu hỏi:

1. Tôi phải chọn thủ tục nào?
2. Tôi cần chuẩn bị những gì?
3. Tôi đang làm đến bước nào?
4. Hồ sơ của tôi đang ở trạng thái nào?
5. Tôi cần làm gì tiếp theo?

Mỗi màn hình phải giúp trả lời ít nhất một trong các câu hỏi trên.

### 5.3. Nguyên tắc UX

- Một màn hình có một mục tiêu chính.
- Một vùng nội dung chỉ nên có một hành động chính nổi bật.
- Giải thích trước khi yêu cầu người dùng cung cấp thông tin.
- Dùng ngôn ngữ đời thường, tránh bắt người dùng hiểu cấu trúc hành chính nội bộ.
- Không bắt đăng nhập trước khi người dân hiểu thủ tục.
- Không bắt nhập lại dữ liệu đã có nếu có thể tái sử dụng an toàn.
- Luôn giữ dữ liệu khi lỗi có thể khôi phục.
- Luôn hiển thị bước tiếp theo phù hợp với trạng thái.
- Mọi hành động không thể thực hiện phải có lý do và cách khắc phục.
- Không dùng AI như con đường duy nhất để hoàn thành công việc.

---

## 6. Từ điển thuật ngữ sản phẩm

| Thuật ngữ | Ý nghĩa hiển thị cho người dùng |
|---|---|
| Thủ tục | Thủ tục hành chính mà người dân cần tìm hiểu hoặc chuẩn bị |
| Hồ sơ | Bộ thông tin, tờ khai và tài liệu của một lần chuẩn bị thủ tục |
| Bản nháp | Hồ sơ đang chuẩn bị, chưa gửi cán bộ |
| Tiền kiểm | Kiểm tra trước để hướng dẫn người dân hoàn thiện hồ sơ |
| Tờ khai điện tử | Biểu mẫu người dân điền trên hệ thống |
| Tài liệu đính kèm | Ảnh hoặc PDF được gửi để cán bộ tiền kiểm |
| Cần bổ sung | Cán bộ yêu cầu sửa thông tin hoặc thay thế/thêm giấy tờ |
| Đã duyệt tiền kiểm | Cán bộ xác nhận phiên bản hồ sơ đủ để người dân chuẩn bị đến cơ quan tiếp nhận |
| Mã QR | Mã nhận diện phiên bản hồ sơ đã duyệt tiền kiểm |
| Tiếp nhận chính thức | Cơ quan có thẩm quyền xác nhận nhận hồ sơ sau khi đối chiếu trực tiếp |

Không dùng từ “duyệt” đơn lẻ nếu có thể khiến người dân nghĩ thủ tục đã được giải quyết. Luôn ưu tiên “Đã duyệt tiền kiểm”.

---

## 7. Luồng nghiệp vụ chính

### 7.1. Luồng tra cứu của khách

```text
Trang chủ
→ Nhập nhu cầu hoặc chọn danh mục
→ Xem kết quả tìm kiếm
→ Xem chi tiết thủ tục
→ Đọc điều kiện, giấy tờ và quy trình
→ Chọn “Bắt đầu chuẩn bị”
→ Đăng nhập nếu chưa đăng nhập
→ Trở lại đúng thủ tục đã chọn
```

### 7.2. Luồng chuẩn bị và gửi tiền kiểm

```text
Chi tiết thủ tục
→ Danh sách giấy tờ
→ Điền tờ khai
→ Đính kèm tài liệu
→ Kiểm tra toàn bộ hồ sơ
→ Xác nhận hiểu phạm vi tiền kiểm
→ Gửi hồ sơ tiền kiểm
→ Nhận mã hồ sơ và theo dõi trạng thái
```

### 7.3. Luồng cần bổ sung

```text
Nhận thông báo
→ Mở hồ sơ cần bổ sung
→ Đọc góp ý của cán bộ
→ Sửa đúng trường hoặc tài liệu bị ảnh hưởng
→ Xem tóm tắt thay đổi
→ Gửi lại để tiền kiểm
→ Trạng thái trở về “Chờ tiền kiểm”
```

Không yêu cầu người dân nhập lại toàn bộ hồ sơ. Các nội dung không bị góp ý phải được giữ nguyên.

### 7.4. Luồng được duyệt

```text
Cán bộ duyệt tiền kiểm
→ Hệ thống khóa phiên bản đã duyệt
→ Hệ thống tạo mã QR
→ Người dân nhận thông báo
→ Xem QR và danh sách giấy tờ cần mang
→ Đến cơ quan có thẩm quyền
→ Cán bộ đối chiếu hồ sơ giấy và quét QR
→ Xác nhận tiếp nhận chính thức nếu hồ sơ đạt yêu cầu
```

---

## 8. Mô hình trạng thái hồ sơ

| Mã nội bộ gợi ý | Nhãn tiếng Việt | Người dân cần làm gì? | Có QR? | Có thể sửa? |
|---|---|---|---|---|
| `DRAFT` | Bản nháp | Tiếp tục chuẩn bị | Không | Có |
| `SUBMITTED` | Chờ tiền kiểm | Chờ cán bộ tiếp nhận kiểm tra | Không | Không, trừ khi có chức năng thu hồi rõ ràng |
| `UNDER_REVIEW` | Đang tiền kiểm | Theo dõi phản hồi | Không | Không |
| `NEED_REVISION` | Cần bổ sung | Sửa các nội dung được yêu cầu | Không | Chỉ phần cần bổ sung |
| `RESUBMITTED` | Đã gửi bổ sung | Chờ tiền kiểm lại | Không | Không |
| `APPROVED_PRECHECK` | Đã duyệt tiền kiểm | Chuẩn bị hồ sơ giấy và đến cơ quan | Có | Không |
| `PHYSICALLY_RECEIVED` | Đã tiếp nhận tại cơ quan | Xem thông tin tiếp nhận | Có thể lưu lịch sử | Không |

Quy tắc hiển thị timeline:

- Sự kiện đã xảy ra mới có ngày giờ hoàn thành.
- Bước tương lai chỉ được thể hiện là bước dự kiến hoặc đang chờ.
- Không tạo thời gian giả cho sự kiện chưa xảy ra.
- Timeline phải phân biệt được “hoàn thành”, “đang diễn ra”, “cần hành động” và “chưa diễn ra”.

---

## 9. Kiến trúc thông tin

### 9.1. Điều hướng chính

- Trang chủ.
- Tra cứu thủ tục.
- Hồ sơ của tôi.
- Hướng dẫn và hỗ trợ.
- Thông báo, chỉ khi đã đăng nhập.
- Tài khoản hoặc Đăng nhập.

Menu tài khoản:

- Thông tin cá nhân.
- Cài đặt thông báo.
- Đăng xuất.

### 9.2. Quy tắc điều hướng

- Website công dân dùng thanh điều hướng trên cùng ở desktop.
- Không dùng sidebar cố định kiểu dashboard quản trị làm điều hướng chính.
- Mobile dùng header gọn và menu có nhãn rõ ràng.
- Không dùng biểu tượng đơn lẻ cho chức năng quan trọng nếu không có nhãn hoặc accessible name.
- Breadcrumb xuất hiện ở trang nằm sâu như chi tiết thủ tục và chi tiết hồ sơ.
- Sau đăng nhập, người dùng phải quay lại đúng trang hoặc thủ tục đang thực hiện.
- Sau thao tác thành công, điều hướng đến màn hình xác nhận hoặc trạng thái phù hợp, không đưa về trang chủ một cách bất ngờ.

### 9.3. Footer

- Giới thiệu dịch vụ.
- Hướng dẫn sử dụng.
- Quyền riêng tư.
- Hỗ trợ tiếp cận.
- Thông tin liên hệ khi đã được xác minh.
- Ghi chú rằng hệ thống hỗ trợ chuẩn bị và tiền kiểm.

---

## 10. Danh mục màn hình chuẩn

1. Trang chủ khách vãng lai.
2. Trang chủ người dân đã đăng nhập.
3. Tra cứu và kết quả thủ tục.
4. Chi tiết thủ tục.
5. Đăng nhập.
6. Xác thực mã.
7. Danh sách giấy tờ.
8. Tờ khai điện tử.
9. Tải tài liệu.
10. Kiểm tra hồ sơ trước khi gửi.
11. Xác nhận đã gửi tiền kiểm.
12. Hồ sơ của tôi.
13. Chi tiết và dòng thời gian hồ sơ.
14. Hồ sơ cần bổ sung.
15. Kiểm tra nội dung bổ sung.
16. Xác nhận đã gửi lại.
17. Hồ sơ đã duyệt tiền kiểm và mã QR.
18. Thông tin cá nhân.
19. Xem lại dữ liệu OCR.
20. Trợ lý AI.
21. Thông báo.
22. Hướng dẫn và câu hỏi thường gặp.
23. Đánh giá và góp ý.
24. Không tìm thấy trang.
25. Không có quyền xem hồ sơ.

---

## 11. Yêu cầu theo từng nhóm màn hình

### 11.1. Trang chủ khách

Mục tiêu: giúp người dân tìm đúng thủ tục nhanh nhất.

Phải có:

- Tiêu đề: “Bạn cần chuẩn bị thủ tục gì?”
- Mô tả ngắn về chuẩn bị và tiền kiểm.
- Ô tìm kiếm lớn, có label rõ ràng.
- Ví dụ: “Đăng ký khai sinh, kết hôn, chứng thực bản sao…”
- Danh mục thủ tục.
- Một số thủ tục thường dùng.
- Bốn bước giải thích cách hệ thống hoạt động.
- Khối giải thích tiền kiểm.
- Lối vào hướng dẫn hoặc trợ lý AI.

Không được:

- Đặt đăng nhập làm hành động nổi bật hơn tìm kiếm.
- Dùng hero quá lớn đẩy chức năng tìm kiếm xuống dưới màn hình.
- Hiển thị số liệu thống kê không hữu ích.

### 11.2. Trang chủ sau đăng nhập

Giữ trải nghiệm tra cứu như trang khách và bổ sung vùng “Việc bạn cần làm”. Thứ tự ưu tiên:

1. Hồ sơ cần bổ sung.
2. Bản nháp đang làm.
3. Hồ sơ đã duyệt và sẵn sàng đến cơ quan.
4. Hồ sơ đang chờ, chỉ hiển thị tóm tắt.

Mỗi hồ sơ có đúng một hành động theo ngữ cảnh.

### 11.3. Tra cứu thủ tục

Phải có:

- Ô tìm kiếm giữ lại từ khóa.
- Số kết quả.
- Bộ lọc danh mục.
- Bộ lọc cơ quan tiếp nhận hoặc địa phương khi có dữ liệu.
- Chip bộ lọc đang áp dụng.
- “Xóa bộ lọc”.
- Danh sách kết quả dễ đọc.
- Trạng thái tải, không có kết quả và lỗi mạng.

Tìm kiếm phải hỗ trợ tiếng Việt có dấu và không dấu.

Một kết quả gồm:

- Tên thủ tục.
- Mô tả ngắn.
- Danh mục.
- Cơ quan có thẩm quyền.
- Mức hỗ trợ có trên hệ thống.
- Hành động “Xem hướng dẫn”.

### 11.4. Chi tiết thủ tục

Phải có:

- Breadcrumb.
- Tên, danh mục và mô tả dễ hiểu.
- Cơ quan tiếp nhận.
- Nguồn và ngày cập nhật nếu có.
- “Bắt đầu chuẩn bị” khi thủ tục thuộc phạm vi hỗ trợ.
- Đối tượng thực hiện.
- Điều kiện cần kiểm tra.
- Giấy tờ cần chuẩn bị.
- Quy trình.
- Thời gian và lệ phí.
- Nơi tiếp nhận.
- Biểu mẫu.
- Lưu ý thường gặp.
- Căn cứ và nguồn thông tin.

Nếu chưa có dữ liệu đã xác minh, dùng:

> Thông tin cần được cơ quan tiếp nhận xác nhận.

Không tự điền số liệu hoặc căn cứ giả.

### 11.5. Đăng nhập

- Nêu lợi ích: “Đăng nhập để lưu tiến độ và theo dõi hồ sơ của bạn.”
- Chỉ yêu cầu đăng nhập khi bắt đầu chức năng cá nhân.
- Có số điện thoại và mã xác thực nếu đó là cơ chế đã chọn.
- Có lỗi mã sai, mã hết hạn, gửi lại mã và đổi số điện thoại.
- Prototype phải ghi rõ “Dùng tài khoản trải nghiệm”.
- Không khẳng định kết nối định danh chính phủ nếu chưa tích hợp thật.

### 11.6. Khung chuẩn bị hồ sơ

Gồm bốn bước:

1. Giấy tờ cần chuẩn bị.
2. Điền tờ khai.
3. Tài liệu đính kèm.
4. Kiểm tra và gửi tiền kiểm.

Luôn hiển thị:

- Tên thủ tục.
- Mã bản nháp.
- Bước hiện tại.
- Tiến độ.
- Trạng thái lưu.
- “Lưu và thoát”.
- Trợ giúp theo ngữ cảnh.

Trạng thái lưu:

- “Đang lưu…”
- “Đã lưu lúc 09:42”
- “Chưa lưu được. Thử lại.”

Không hiển thị đã lưu nếu thao tác lưu thất bại.

### 11.7. Danh sách giấy tờ thông minh

Phân nhóm:

- Bắt buộc.
- Theo điều kiện.
- Tài liệu hỗ trợ không bắt buộc.

Mỗi mục gồm:

- Tên giấy tờ.
- Mô tả ngắn.
- Nhãn bắt buộc hoặc theo điều kiện.
- Checkbox “Tôi đã chuẩn bị giấy tờ này”.
- Hướng dẫn mở rộng.
- “Tôi chưa có giấy tờ này”.
- Lối tắt đến tải tệp khi phù hợp.

Phân biệt rõ:

- Đánh dấu checkbox: người dân xác nhận có bản giấy.
- Tải tệp: có bản điện tử để tiền kiểm.
- Xác nhận của cán bộ: chỉ xuất hiện sau khi cán bộ thực sự kiểm tra.

### 11.8. Tờ khai điện tử

Nhóm trường theo ý nghĩa:

- Thông tin người yêu cầu.
- Thông tin riêng của thủ tục.
- Địa chỉ và liên hệ.
- Thông tin bổ sung.

Yêu cầu:

- Label nằm phía trên trường.
- Phân biệt trường bắt buộc và không bắt buộc.
- Có mô tả định dạng khi cần.
- Không dùng placeholder thay cho label.
- Không hiển thị lỗi trước khi người dùng tương tác.
- Khi bấm tiếp tục, có tóm tắt lỗi và focus vào trường lỗi đầu tiên.
- Không xóa dữ liệu khi validation thất bại.
- “Điền từ thông tin cá nhân” phải cho xem lại trước khi ghi đè dữ liệu đang có.

Mỗi thủ tục phải có cấu trúc biểu mẫu riêng. Không dùng một form chung giống hệt cho khai sinh, kết hôn và chứng thực.

### 11.9. Tải tài liệu

Mỗi giấy tờ có một vùng tải riêng, gồm:

- Tên giấy tờ.
- Định dạng chấp nhận.
- Dung lượng tối đa.
- “Chọn tệp”.
- “Chụp ảnh” trên thiết bị hỗ trợ.
- Hướng dẫn chụp đủ bốn góc, rõ chữ, không bị lóa.

Sau khi chọn:

- Thumbnail hoặc biểu tượng PDF.
- Tên tệp và dung lượng.
- Tiến trình tải.
- Thành công hoặc thất bại.
- Xem trước.
- Thay thế.
- Xóa.

Cần có trạng thái tệp sai định dạng, quá lớn, gián đoạn và thử lại.

Không gọi trạng thái tải thành công là “Đã xác thực” hoặc “Hợp lệ”.

### 11.10. Kiểm tra và gửi tiền kiểm

Hiển thị tóm tắt:

- Thủ tục.
- Người yêu cầu.
- Thông tin riêng của thủ tục.
- Danh sách giấy tờ.
- Tài liệu đính kèm.
- Tờ khai được tạo.

Mỗi phần có “Chỉnh sửa” về đúng bước.

Hành động:

- Xem tờ khai.
- Tải PDF.
- In tờ khai.
- Gửi hồ sơ tiền kiểm.

Nếu chưa đủ dữ liệu, giải thích cụ thể và có link sửa. Không chỉ vô hiệu hóa nút mà không nêu lý do.

Sau khi gửi:

- Hiển thị “Đã gửi yêu cầu tiền kiểm”.
- Có mã hồ sơ và thời gian gửi.
- Nêu trạng thái hiện tại và bước tiếp theo.
- Có “Theo dõi hồ sơ” và “Về hồ sơ của tôi”.
- Tuyệt đối không hiển thị QR.

### 11.11. Hồ sơ của tôi

Phải có:

- Tìm theo mã hoặc tên thủ tục.
- Lọc theo trạng thái.
- Sắp xếp theo cập nhật gần nhất.
- “Chuẩn bị hồ sơ mới”.

Mỗi hồ sơ gồm:

- Tên thủ tục.
- Mã hồ sơ.
- Trạng thái.
- Cập nhật gần nhất.
- Bước tiếp theo bằng câu dễ hiểu.
- Một hành động chính phù hợp.

Ánh xạ hành động:

| Trạng thái | Hành động chính |
|---|---|
| Bản nháp | Tiếp tục chuẩn bị |
| Chờ tiền kiểm | Theo dõi hồ sơ |
| Đang tiền kiểm | Theo dõi hồ sơ |
| Cần bổ sung | Xem yêu cầu bổ sung |
| Đã duyệt tiền kiểm | Xem mã QR |
| Đã tiếp nhận tại cơ quan | Xem chi tiết |

### 11.12. Chi tiết hồ sơ và timeline

Phần đầu trang gồm:

- Tên thủ tục.
- Mã hồ sơ.
- Trạng thái.
- Lần cập nhật cuối.
- Việc người dân cần làm tiếp theo.

Các vùng nội dung:

- Dòng thời gian.
- Thông tin hồ sơ.
- Tờ khai.
- Tài liệu.
- Phản hồi của cán bộ.
- Lịch sử phiên bản.

Hồ sơ chờ hoặc đang tiền kiểm phải nói rõ chưa có QR.

### 11.13. Cần bổ sung

Dùng thông báo màu hổ phách, giọng điệu bình tĩnh.

Phải có:

- Ngày phản hồi.
- Danh sách nội dung cần xử lý.
- Comment gắn đúng trường hoặc tài liệu.
- Giá trị/tệp cũ.
- Hành động sửa hoặc thay thế.
- Trạng thái người dân đã sửa mục đó chưa.
- Lời nhắn tùy chọn cho cán bộ.
- Tóm tắt thay đổi.
- “Lưu và tiếp tục sau”.
- “Gửi lại để tiền kiểm”.

Sau khi gửi lại, trạng thái là “Chờ tiền kiểm”; không tạo QR.

### 11.14. Hồ sơ đã duyệt và QR

Tiêu đề: “Hồ sơ đã được duyệt tiền kiểm”.

Phải có:

- Trạng thái duyệt tiền kiểm.
- Tên thủ tục.
- Mã hồ sơ.
- Ngày duyệt.
- QR rõ, có khoảng trắng an toàn.
- “Tải mã QR”.
- “In phiếu hướng dẫn”.
- Tờ khai đã duyệt ở chế độ chỉ đọc.
- Danh sách giấy tờ bản giấy cần mang.
- Địa điểm và thời gian làm việc nếu đã xác minh.
- Thông báo về tiếp nhận chính thức.

Truy cập đường dẫn QR của hồ sơ chưa duyệt phải chuyển sang trang trạng thái và giải thích QR chưa có.

### 11.15. Thông tin cá nhân và OCR

Thông tin cá nhân:

- Thông tin cơ bản.
- Liên hệ.
- Địa chỉ.
- Tùy chọn thông báo.
- Sửa, Lưu, Hủy.
- Che bớt số định danh khi không ở chế độ chỉnh sửa.

Luồng OCR:

1. Giải thích dữ liệu sẽ được đọc.
2. Người dân chủ động tiếp tục.
3. Chụp hoặc tải ảnh.
4. Hiển thị đang xử lý.
5. Hiển thị các trường trích xuất để kiểm tra.
6. Làm nổi bật nội dung thiếu hoặc độ tin cậy thấp.
7. Người dân sửa và xác nhận.
8. Chỉ áp dụng những giá trị đã được xác nhận.

Luôn cung cấp nhập thủ công. Với prototype, hiển thị:

> OCR minh họa · Không sử dụng giấy tờ thật.

### 11.16. Trợ lý AI

Trợ lý có thể:

- Giúp tìm thủ tục.
- Giải thích danh sách giấy tờ.
- Giải thích luồng tiền kiểm.
- Hướng dẫn vị trí sửa hồ sơ.
- Dẫn đến trang thủ tục hoặc hồ sơ liên quan.

Trợ lý không thể:

- Duyệt hồ sơ.
- Kết luận điều kiện pháp lý.
- Tạo QR đã duyệt.
- Khẳng định hồ sơ đã nộp chính thức.
- Giả vờ đã liên hệ cán bộ.
- Tạo nguồn hoặc căn cứ pháp lý không tồn tại.

Thông báo:

> Trợ lý hỗ trợ tra cứu và chuẩn bị hồ sơ. Nội dung cần được đối chiếu với hướng dẫn của cơ quan tiếp nhận.

Nếu AI chỉ là prototype, phải ghi rõ câu trả lời mô phỏng.

---

## 12. Ngôn ngữ và nội dung

### 12.1. Ngôn ngữ bắt buộc

Toàn bộ nội dung người dùng nhìn thấy phải là tiếng Việt có dấu, gồm:

- Menu, tiêu đề và nút.
- Label, placeholder và trợ giúp trường nhập.
- Trạng thái, lỗi và xác nhận.
- Tooltip, dialog, toast và thông báo.
- Nội dung AI, OCR và biểu mẫu.
- Alt text và accessible label.

Có thể giữ các thuật ngữ quen thuộc như QR, PDF, AI, SMS và OCR nhưng phải đặt trong câu tiếng Việt dễ hiểu.

Tên biến, API, route và mã nguồn có thể dùng tiếng Anh.

Trang HTML phải dùng:

```html
<html lang="vi">
```

### 12.2. Giọng văn

- Xưng hô “Bạn”.
- Bình tĩnh, tôn trọng và hỗ trợ.
- Dùng câu ngắn, động từ rõ.
- Không đổ lỗi cho người dùng.
- Tránh từ chuyên môn khi có từ phổ thông tương đương.
- Không dùng giọng quảng cáo quá mức.
- Không dùng nhiều dấu chấm than.

Ví dụ tốt:

- “Ảnh chưa rõ phần thông tin của trẻ. Vui lòng chụp lại ở nơi đủ sáng.”
- “Chưa lưu được thay đổi. Kiểm tra kết nối và thử lại.”
- “Bạn còn 2 giấy tờ cần đính kèm trước khi gửi.”

Ví dụ không dùng:

- “Upload failed.”
- “Invalid input.”
- “Bạn đã nhập sai!”
- “Hồ sơ hoàn toàn hợp lệ.” khi cán bộ chưa kiểm tra.

### 12.3. Từ ngữ chuẩn

| Không dùng | Dùng |
|---|---|
| Home | Trang chủ |
| Dashboard | Tổng quan hoặc Việc bạn cần làm |
| Profile | Thông tin cá nhân |
| Checklist | Danh sách giấy tờ |
| E-form | Tờ khai điện tử |
| Upload | Tải lên hoặc Đính kèm |
| Download | Tải xuống |
| Submit | Gửi tiền kiểm |
| Draft | Bản nháp |
| Pending | Chờ tiền kiểm |
| Under review | Đang tiền kiểm |
| Revision required | Cần bổ sung |
| Approved | Đã duyệt tiền kiểm |
| Save & Exit | Lưu và thoát |
| Feedback | Đánh giá và góp ý |

### 12.4. Định dạng Việt Nam

- Ngày: `dd/MM/yyyy`.
- Giờ: `HH:mm`, hệ 24 giờ.
- Ngày giờ đầy đủ: `09:42, 14/09/2026`.
- Tiền: `50.000 đồng` hoặc `50.000 ₫` theo chuẩn thống nhất.
- Chỉ hiển thị lệ phí khi có nguồn dữ liệu xác minh.
- Số điện thoại được nhóm dễ đọc nhưng không làm thay đổi dữ liệu.
- Họ tên và địa chỉ phải giữ đầy đủ dấu tiếng Việt.

---

## 13. Design system

### 13.1. Định hướng hình ảnh

Tính cách hình ảnh:

- Tin cậy.
- Điềm tĩnh.
- Hiện đại vừa phải.
- Gần gũi.
- Gọn gàng.
- Phù hợp dịch vụ công.

Không sử dụng:

- Giao diện giống dashboard quản trị cho trang công dân.
- Gradient mạnh, neon hoặc glassmorphism.
- Họa tiết trang trí làm giảm khả năng đọc.
- Bóng đổ dày.
- Góc bo quá lớn trên mọi component.
- Biểu tượng không đồng bộ.
- Quốc huy, con dấu hoặc dấu hiệu nhận diện cơ quan nhà nước giả.

### 13.2. Màu sắc gợi ý

Các mã sau là điểm khởi đầu và có thể điều chỉnh sau khi kiểm tra tương phản:

| Token | Màu gợi ý | Mục đích |
|---|---|---|
| `primary-700` | `#174A8B` | Nút chính, link quan trọng |
| `primary-800` | `#123B70` | Hover, tiêu đề nhấn mạnh |
| `primary-050` | `#EEF5FC` | Nền thông tin nhẹ |
| `text-900` | `#172033` | Tiêu đề và nội dung chính |
| `text-700` | `#384860` | Nội dung phụ có độ tương phản tốt |
| `text-500` | `#65748A` | Metadata, không dùng cho chữ quá nhỏ |
| `surface` | `#FFFFFF` | Bề mặt chính |
| `background` | `#F5F7FA` | Nền trang |
| `border` | `#D9E1EA` | Viền component |
| `success-700` | `#24715A` | Đã duyệt, hoàn thành |
| `success-050` | `#EAF6F0` | Nền trạng thái thành công |
| `warning-700` | `#8B5D17` | Cần bổ sung, chú ý |
| `warning-050` | `#FFF6E5` | Nền cảnh báo nhẹ |
| `danger-700` | `#B42318` | Lỗi, thao tác nguy hiểm |
| `danger-050` | `#FFF0EE` | Nền lỗi nhẹ |

Mọi cặp màu chữ/nền phải đạt WCAG 2.2 AA.

### 13.3. Typography

Font ưu tiên:

1. Be Vietnam Pro.
2. Inter có hỗ trợ đầy đủ tiếng Việt.
3. System sans-serif có khả năng hiển thị tiếng Việt tốt.

Gợi ý desktop:

| Vai trò | Cỡ chữ | Độ đậm | Chiều cao dòng |
|---|---:|---:|---:|
| Tiêu đề trang | 32–40px | 600–700 | 1.2–1.3 |
| Tiêu đề khu vực | 24–28px | 600–700 | 1.3 |
| Tiêu đề component | 18–20px | 600 | 1.4 |
| Nội dung | 16–18px | 400 | 1.5–1.7 |
| Label | 15–16px | 500–600 | 1.4 |
| Nội dung hỗ trợ | 14–16px | 400 | 1.5 |

Không dùng chữ nội dung dưới 14px. Với form trên mobile, cỡ chữ input tối thiểu 16px để tránh zoom ngoài ý muốn.

### 13.4. Khoảng cách và bố cục

- Dùng hệ khoảng cách 8px: 4, 8, 12, 16, 24, 32, 40, 48, 64.
- Chiều rộng nội dung desktop khoảng 1.120–1.200px.
- Nội dung form giới hạn chiều rộng đọc thoải mái, không kéo dài toàn màn hình.
- Khoảng cách giữa các nhóm nội dung lớn tối thiểu 32px.
- Chiều cao mục tiêu của nút và input tối thiểu 44px; ưu tiên 48px cho hành động chính.
- Bán kính góc thường dùng 8–12px.
- Card chỉ dùng khi thực sự cần phân nhóm hoặc tạo tương tác độc lập.

### 13.5. Icon và hình ảnh

- Dùng một bộ icon dạng outline nhất quán.
- Icon quan trọng phải đi kèm nhãn chữ.
- Icon trạng thái phải đi kèm nội dung, không dùng icon/màu đơn lẻ.
- Hình minh họa chỉ dùng khi giúp giải thích thao tác.
- Không dùng hình trang trí lớn lấn át tìm kiếm hoặc hành động chính.
- Ảnh có ý nghĩa phải có alt text tiếng Việt.

### 13.6. Button

#### Chính

Dùng cho hành động quan trọng nhất của vùng hoặc màn hình:

- Bắt đầu chuẩn bị.
- Tiếp tục.
- Gửi hồ sơ tiền kiểm.
- Gửi lại để tiền kiểm.

#### Phụ

Dùng cho:

- Quay lại.
- Lưu và thoát.
- Xem trước.
- In.
- Tải xuống.

#### Nguy hiểm

Chỉ dùng cho thao tác có thể mất dữ liệu như xóa bản nháp hoặc xóa tệp. Phải có xác nhận hoặc khả năng hoàn tác phù hợp.

Không đặt nhiều nút chính cạnh nhau.

### 13.7. Status badge

Badge trạng thái gồm:

- Nhãn chữ rõ.
- Màu và có thể kèm icon.
- Tooltip hoặc mô tả khi thuật ngữ có thể chưa quen.

Không dùng dấu chấm màu đơn lẻ.

### 13.8. Thông báo hệ thống

Có bốn loại:

- Thông tin.
- Thành công.
- Cần chú ý.
- Lỗi.

Mỗi thông báo gồm:

- Tiêu đề hoặc câu chính.
- Mô tả hậu quả.
- Việc người dùng có thể làm tiếp theo.

Toast chỉ dùng cho xác nhận ngắn, không chứa thông tin quan trọng cần đọc lâu.

---

## 14. Responsive

### 14.1. Mốc kiểm tra bắt buộc

- Desktop: 1440px.
- Laptop: 1024–1280px.
- Tablet: 768px.
- Mobile: 390px.
- Mobile hẹp: 360px.
- Zoom trình duyệt 200%.

### 14.2. Quy tắc mobile

- Form một cột.
- Không có scroll ngang toàn trang.
- Không dùng thao tác chỉ hoạt động khi hover.
- Tên thủ tục, địa chỉ và tên tệp dài phải xuống dòng an toàn.
- Stepper hiển thị dạng “Bước 2/4: Điền tờ khai”; không ép bốn nhãn dài trên một hàng.
- Có thể dùng vùng hành động sticky nhưng không che nội dung, lỗi hoặc bàn phím.
- Nút và mục tương tác tối thiểu 44 × 44px.
- Chat launcher không che nút tiếp tục hoặc nút gửi.
- Bảng trên desktop phải chuyển thành card/danh sách hoặc bố cục dọc.
- Modal dài nên trở thành full-screen sheet phù hợp trên mobile.

---

## 15. Accessibility

Mục tiêu: WCAG 2.2 AA.

Yêu cầu:

- Cấu trúc heading đúng thứ tự.
- Có skip link đến nội dung chính.
- Tất cả form control có label liên kết đúng.
- Focus bàn phím luôn nhìn thấy.
- Thứ tự tab theo thứ tự đọc.
- Không dùng màu làm tín hiệu duy nhất.
- Lỗi được liên kết tới trường bằng mô tả hỗ trợ.
- Sau submit lỗi, focus vào error summary; từ summary có link đến từng trường lỗi.
- Dialog giữ focus bên trong và trả focus về điểm mở khi đóng.
- Thông báo động dùng live region phù hợp.
- Accordion có trạng thái mở/đóng cho screen reader.
- Tôn trọng `prefers-reduced-motion`.
- Không tự động phát âm thanh hoặc video.
- Hỗ trợ phóng to chữ và zoom 200% mà không mất chức năng.
- Nội dung link phải mô tả đích, tránh lặp quá nhiều “Xem thêm” không có ngữ cảnh.

---

## 16. Validation và lỗi

### 16.1. Nguyên tắc

- Không hiển thị lỗi trước khi người dùng tương tác, trừ lỗi hệ thống đã tồn tại.
- Lỗi phải nằm gần trường và có tóm tắt khi người dùng cố chuyển bước.
- Nêu rõ cách sửa.
- Không xóa dữ liệu đã nhập.
- Không dùng thông báo chung chung “Có lỗi xảy ra” nếu biết nguyên nhân hoặc cách khắc phục.
- Nút bị khóa phải có lý do nhìn thấy được.

### 16.2. Ví dụ

- “Vui lòng nhập họ và tên.”
- “Số định danh cá nhân cần gồm 12 chữ số.”
- “Ngày sinh không được sau ngày hiện tại.”
- “Tệp lớn hơn 10 MB. Vui lòng chọn tệp nhỏ hơn.”
- “Định dạng này chưa được hỗ trợ. Hãy chọn PDF, JPG hoặc PNG.”
- “Chưa tải được tệp. Kiểm tra kết nối và thử lại.”
- “Bạn còn 2 giấy tờ bắt buộc chưa đính kèm.”

### 16.3. Trạng thái hệ thống bắt buộc

Mỗi tính năng liên quan phải thiết kế tối thiểu các trạng thái:

- Ban đầu.
- Đang tải.
- Có dữ liệu.
- Không có dữ liệu.
- Thành công.
- Lỗi có thể thử lại.
- Lỗi không có quyền.
- Mất phiên đăng nhập.
- Mạng chậm hoặc mất kết nối.

---

## 17. Riêng tư và dữ liệu nhạy cảm

- Chỉ thu thập dữ liệu cần thiết cho thủ tục hoặc liên hệ.
- Nêu rõ mục đích trước khi yêu cầu giấy tờ nhạy cảm.
- Không dùng dữ liệu thật trong prototype, demo, screenshot hoặc tài liệu thiết kế.
- Dữ liệu mẫu phải ghi rõ là hư cấu.
- Che một phần số định danh khi không cần hiển thị đầy đủ.
- Không đưa số định danh hoặc thông tin nhạy cảm cạnh QR nếu không cần thiết.
- Không lưu dữ liệu OCR trước khi người dân xem lại và xác nhận.
- Không chọn sẵn sự đồng ý cho mục đích không liên quan.
- Nếu phiên đăng nhập hết hạn, ưu tiên phục hồi bản nháp an toàn sau khi đăng nhập lại.

---

## 18. Thông báo và đánh giá

### 18.1. Thông báo

Thông báo gồm:

- Tên thủ tục hoặc ngữ cảnh hồ sơ.
- Nội dung ngắn.
- Thời gian.
- Đã đọc/chưa đọc.
- Link trực tiếp đến hành động cần làm.

Ví dụ:

- “Hồ sơ đăng ký khai sinh cần bổ sung ảnh giấy chứng sinh.”
- “Hồ sơ chứng thực bản sao đã được duyệt tiền kiểm.”

Không hiển thị chi tiết riêng tư khi người dùng đã đăng xuất.

### 18.2. Đánh giá

- Chỉ mời đánh giá sau một cột mốc có ý nghĩa.
- Đánh giá trải nghiệm chuẩn bị/tiền kiểm, không gọi là kết quả giải quyết nếu chưa xảy ra.
- Có mức hài lòng, góp ý tùy chọn, gửi và xác nhận.
- Không dùng modal bắt buộc hoặc chặn hành trình.

---

## 19. Dữ liệu mẫu xuyên suốt

Tất cả dữ liệu dưới đây chỉ dùng làm mẫu thiết kế và phải ghi rõ là hư cấu.

### 19.1. Hồ sơ chính

- Thủ tục: Đăng ký khai sinh.
- Người yêu cầu: Nguyễn Minh Anh.
- Mã hồ sơ mẫu: HS-2026-00128.
- Trạng thái mẫu: Cần bổ sung.
- Góp ý: “Ảnh giấy chứng sinh chưa rõ phần thông tin của trẻ. Vui lòng chụp lại toàn bộ giấy tờ, không cắt góc.”

### 19.2. Hồ sơ phụ

- Đăng ký kết hôn — Bản nháp.
- Chứng thực bản sao từ bản chính — Đã duyệt tiền kiểm, có QR mẫu.
- Đăng ký khai sinh — Đang tiền kiểm hoặc cần bổ sung tùy màn hình.

Không dùng cùng một mã hồ sơ cho hai thủ tục khác nhau. Trạng thái và timeline phải nhất quán giữa trang chủ, danh sách hồ sơ, chi tiết và thông báo.

---

## 20. Danh sách component chuẩn

- PublicHeader.
- MobileNavigation.
- AccountMenu.
- Breadcrumb.
- PageHeader.
- SearchBar.
- FilterGroup.
- AppliedFilterChip.
- ProcedureResultItem.
- PrimaryButton.
- SecondaryButton.
- DestructiveButton.
- FormField.
- ErrorSummary.
- StatusBadge.
- InfoAlert.
- SuccessAlert.
- WarningAlert.
- ErrorAlert.
- ProgressStepper.
- SaveStatus.
- ChecklistItem.
- ConditionalRequirement.
- DocumentUploader.
- DocumentPreview.
- ApplicationCard.
- ApplicationSummary.
- TimelineEvent.
- OfficerComment.
- RevisionItem.
- QRPanel.
- ConfirmationDialog.
- Toast.
- EmptyState.
- LoadingSkeleton.
- HelpCallout.
- ChatMessage.
- Footer.

Component mới chỉ được tạo khi component hiện có không thể đáp ứng hợp lý. Tránh tạo nhiều biến thể có hành vi tương tự nhưng tên khác nhau.

---

## 21. Mẫu đặc tả khi thiết kế một màn hình mới

Trước khi thiết kế, điền ngắn gọn mẫu sau:

```md
# Tên màn hình

## Người dùng
Khách vãng lai / Người dân đã đăng nhập

## Mục tiêu người dùng
Người dùng muốn...

## Điều kiện vào màn hình
- Đến từ đâu?
- Cần đăng nhập không?
- Hồ sơ phải ở trạng thái nào?

## Thông tin bắt buộc hiển thị
- ...

## Hành động chính
- ...

## Hành động phụ
- ...

## Quy tắc nghiệp vụ
- ...

## Trạng thái
- Ban đầu
- Đang tải
- Không có dữ liệu
- Thành công
- Lỗi
- Không có quyền

## Hành vi responsive
- Desktop
- Tablet
- Mobile

## Accessibility
- Focus
- Label
- Screen reader
- Keyboard

## Sự kiện phân tích cần đo
- ...

## Tiêu chí hoàn thành
- ...
```

---

## 22. Checklist nghiệm thu UI/UX

### 22.1. Hiểu đúng nghiệp vụ

- [ ] Màn hình có phân biệt tiền kiểm với nộp chính thức.
- [ ] Không hiển thị QR trước khi duyệt tiền kiểm.
- [ ] Không tự chuyển hồ sơ bổ sung thành đã duyệt.
- [ ] Trạng thái và hành động tiếp theo khớp nhau.
- [ ] Không bịa thông tin pháp lý hoặc cơ quan tiếp nhận.
- [ ] Hồ sơ đã duyệt ở chế độ chỉ đọc.

### 22.2. Nội dung

- [ ] Toàn bộ nội dung hiển thị bằng tiếng Việt có dấu.
- [ ] Không còn từ tiếng Anh không cần thiết.
- [ ] Thuật ngữ tiền kiểm được giải thích.
- [ ] Nút dùng động từ rõ.
- [ ] Lỗi nói rõ cách sửa.
- [ ] Dữ liệu mẫu được đánh dấu là hư cấu.

### 22.3. UX

- [ ] Mục tiêu của màn hình có thể hiểu trong vài giây.
- [ ] Hành động chính dễ nhận biết.
- [ ] Không có nhiều CTA cạnh tranh.
- [ ] Người dùng biết mình đang ở bước nào.
- [ ] Có trạng thái lưu hoặc tải thật.
- [ ] Lỗi không làm mất dữ liệu.
- [ ] Có empty, loading và error state.
- [ ] Luồng quay lại không làm mất tiến độ.

### 22.4. UI và responsive

- [ ] Nhất quán với màu, chữ, khoảng cách và component chuẩn.
- [ ] Không có scroll ngang ở 360px và 390px.
- [ ] Form mobile một cột.
- [ ] Nội dung dài xuống dòng an toàn.
- [ ] Touch target tối thiểu 44 × 44px.
- [ ] Kiểm tra desktop, tablet, mobile và zoom 200%.

### 22.5. Accessibility

- [ ] Độ tương phản đạt WCAG AA.
- [ ] Focus rõ khi dùng bàn phím.
- [ ] Heading đúng cấu trúc.
- [ ] Input có label.
- [ ] Trạng thái không phụ thuộc vào màu.
- [ ] Lỗi được screen reader nhận biết.
- [ ] Dialog và menu quản lý focus đúng.
- [ ] Chuyển động tôn trọng reduced motion.

---

## 23. Tiêu chí hoàn thành cho một thiết kế

Một màn hình chỉ được xem là hoàn thành khi:

1. Có đầy đủ desktop và mobile nếu màn hình thuộc luồng chính.
2. Đã thiết kế trạng thái tải, rỗng, lỗi và thành công liên quan.
3. Hành động khớp với trạng thái hồ sơ.
4. Nội dung tiếng Việt đã được rà soát.
5. Không vi phạm ranh giới tiền kiểm và QR.
6. Component và token có thể tái sử dụng.
7. Luồng bàn phím và focus đã được mô tả.
8. Có tiêu chí để QA kiểm tra.
9. Dữ liệu mẫu nhất quán với các màn hình liên quan.
10. Designer, FE và BA có thể hiểu cùng một hành vi từ thiết kế.

---

## 24. Hướng mở rộng sau này

Khi mở rộng sang cán bộ hoặc quản trị, tạo tài liệu riêng cho từng workspace. Không thay đổi âm thầm quy tắc phía người dân trong tài liệu này.

Các nội dung cần được quyết định trước khi sản phẩm thật vận hành:

- Tên sản phẩm và nhận diện chính thức.
- Cơ chế đăng nhập/xác thực.
- Danh mục thủ tục và phạm vi cơ quan tiếp nhận.
- Nguồn dữ liệu pháp lý.
- Quy tắc tờ khai theo từng thủ tục.
- Giới hạn định dạng và dung lượng tài liệu.
- Kênh thông báo: SMS, Email, Zalo hoặc kết hợp.
- Chính sách lưu trữ dữ liệu cá nhân.
- Nội dung QR và cơ chế chống giả mạo.
- SLA tiền kiểm và nội dung có thể cam kết.
- Tích hợp OCR và AI thực tế.
- Accessibility audit và usability testing với người dân.

---

## 25. Chỉ dẫn nhanh cho công cụ AI hoặc Google Stitch

Khi đưa tài liệu này cho công cụ tạo UI, thêm yêu cầu sau:

> Đọc toàn bộ tài liệu `UI_UX_DESIGN_STANDARD.md` trước khi thiết kế. Thiết kế màn hình được yêu cầu theo đúng phạm vi người dân, trạng thái hồ sơ, quy tắc tiền kiểm, ngôn ngữ tiếng Việt, design system, responsive và accessibility trong tài liệu. Không tự tạo nghiệp vụ mới, không hiển thị QR trước khi cán bộ duyệt tiền kiểm và không mô tả tiền kiểm như nộp hồ sơ chính thức. Trước khi kết thúc, tự kiểm tra thiết kế bằng checklist nghiệm thu trong tài liệu.

Khi yêu cầu một trang cụ thể, dùng mẫu:

> Dựa hoàn toàn trên `UI_UX_DESIGN_STANDARD.md`, hãy thiết kế màn hình **[TÊN MÀN HÌNH]** cho **[KHÁCH/NGƯỜI DÂN ĐÃ ĐĂNG NHẬP]** ở trạng thái **[TRẠNG THÁI]**. Tạo bản desktop 1440px và mobile 390px, bao gồm trạng thái tải, rỗng, lỗi và thành công phù hợp. Toàn bộ nội dung người dùng nhìn thấy phải bằng tiếng Việt có dấu. Giữ đúng quy tắc nghiệp vụ và sử dụng component có thể tái sử dụng.

---

## 26. Nguyên tắc cuối cùng

Khi có nhiều lựa chọn thiết kế, chọn phương án giúp người dân:

- Hiểu đúng bản chất dịch vụ.
- Biết chính xác mình cần làm gì.
- Hoàn thành tác vụ với ít sai sót hơn.
- Không mất dữ liệu hoặc cảm thấy bị mắc kẹt.
- Không hiểu nhầm tiền kiểm là tiếp nhận hay giải quyết thủ tục chính thức.

Đó là tiêu chuẩn quan trọng nhất của mọi UI/UX trong dự án này.
