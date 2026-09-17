Cán bộ đăng nhập
       ↓
   Dashboard
       ↓
Xem hồ sơ chờ kiểm tra
       ↓
 Quick Preview
       ↓
Kiểm tra thông tin
       ↓
Kiểm tra Checklist
       ↓
Kiểm tra E-form
       ↓
   ┌───────────────┐
   │ Hồ sơ hợp lệ?               │
   └───────┬───────┘
       Có  │  Không
           │
    ↓      │       ↓
  Approve  │   Comment
    ↓      │       ↓
Thông báo  │   Người dân
người dân  │   chỉnh sửa
    ↓      │       ↓
Cho phép   │   Gửi lại
nộp hồ sơ  │       ↓
           └───────┘




Sau đó phần quản lý flow của manager

Manager / Procedure Manager
            ↓
       Dashboard
            ↓
 ┌──────────┼──────────┐
 ↓          ↓          ↓
Thống kê   Thủ tục    Biểu mẫu
 ↓          ↓          ↓
Tra cứu    CRUD       Upload
 ↓          ↓          ↓
Lượt dùng  Điều kiện  Mapping E-form
           Quy trình
           Lệ phí

Các flow con thuộc Main Flow 2
2.1. Officer Login & Authorization
Login
RBAC
Xác định role
Front-desk Officer / Manager
2.2. Review Application Flow
Xem danh sách hồ sơ
Filter theo status
Quick Preview
Review
Comment
Approve / Request Revision
2.3. Comment & Revision Flow
Đây là flow nên làm kỹ:
Officer Comment
      ↓
Citizen nhận notification
      ↓
Citizen mở hồ sơ
      ↓
Xem comment
      ↓
Edit form
      ↓
Submit revision
      ↓
Officer review lại
2.4. Notification Flow
Hồ sơ cần bổ sung
Hồ sơ đã được duyệt
Cho phép nộp hồ sơ

2.5. Procedure Management Flow
Create procedure
Edit
Delete
Publish/Unpublish
Update legal information
2.6. Form Management Flow
Upload PDF/Word
Upload mẫu minh họa
Cấu hình field
Mapping field → dữ liệu người dân
Version form
Ví dụ:
"Họ và tên" → fullName
"Ngày sinh" → dateOfBirth
"CCCD" → citizenId
"Địa chỉ" → address
2.7. Dashboard & Analytics Flow
Số lượt tra cứu
Thủ tục được quan tâm
Lượt tải biểu mẫu
FAQ/lỗi thường gặp
Số hồ sơ
Tỷ lệ hồ sơ đạt
Tỷ lệ cần bổ sung
Thời gian xử lý trung bình
Mức độ hài lòng



















MAIN FLOW 2 — OFFICER
Cán bộ Một cửa kiểm tra, phê duyệt và tiếp nhận hồ sơ
🎯 Mục tiêu
Main Flow 2 hỗ trợ cán bộ Một cửa quản lý toàn bộ quá trình từ khi người dân gửi hồ sơ điện tử để tiền kiểm cho đến khi hồ sơ được duyệt, cấp mã QR và được tiếp nhận chính thức tại UBND.
Cán bộ có thể:
Tiếp nhận hồ sơ tiền kiểm.
Xem và phân loại hồ sơ.
Kiểm tra thông tin người dân.
Kiểm tra Checklist.
Kiểm tra giấy tờ.
Kiểm tra E-form.
Kiểm tra PDF.
Comment trực tiếp.
Yêu cầu người dân chỉnh sửa/bổ sung.
Duyệt hồ sơ.
Hệ thống tự động tạo QR sau khi duyệt.
Theo dõi lịch sử hồ sơ.
Quét QR khi người dân đến UBND.
Đối chiếu hồ sơ điện tử và hồ sơ giấy.
Xác nhận tiếp nhận hồ sơ chính thức.

PHẦN A — CÁN BỘ TIẾP NHẬN HỒ SƠ TIỀN KIỂM
1. Cán bộ đăng nhập
Cán bộ truy cập hệ thống:
Login
 ↓
Authentication
 ↓
RBAC
 ↓
Verify Officer Role
 ↓
Officer Dashboard
Hệ thống kiểm tra quyền:
FRONT_DESK_OFFICER
Nếu đúng quyền → truy cập Dashboard.

2. Officer Dashboard
Dashboard là màn hình làm việc chính của cán bộ.
Thông tin tổng quan
┌───────────────────────────────────────────┐
│           OFFICER DASHBOARD               │
├───────────────────────────────────────────┤
│ Hồ sơ chờ kiểm tra             12         │
│ Hồ sơ đang xử lý                5         │
│ Hồ sơ cần bổ sung               3         │
│ Hồ sơ đã duyệt                  8         │
│ Hồ sơ chờ tiếp nhận             6         │
│ Hồ sơ quá hạn                   1         │
└───────────────────────────────────────────┘
Các khu vực chính
Dashboard
├── Hồ sơ chờ kiểm tra
├── Hồ sơ cần bổ sung
├── Hồ sơ đã duyệt
├── Hồ sơ chờ tiếp nhận
├── Hồ sơ đang xử lý
└── Hồ sơ hoàn thành

3. Danh sách hồ sơ tiền kiểm
Cán bộ chọn:
Hồ sơ chờ kiểm tra
Hệ thống hiển thị:
Mã hồ sơ
Người dân
Thủ tục
Ngày gửi
Trạng thái
HS001
Nguyễn Văn A
Đăng ký kết hôn
01/09
Chờ kiểm tra
HS002
Trần Văn B
Chứng thực
01/09
Chờ kiểm tra

Cán bộ có thể:
Search mã hồ sơ.
Search tên người dân.
Filter theo thủ tục.
Filter theo ngày.
Filter theo trạng thái.
Sort theo thời gian gửi.

4. Nhận hồ sơ để xử lý
Cán bộ chọn một hồ sơ:
HS-2026-00125
Hệ thống chuyển:
SUBMITTED_FOR_REVIEW
        ↓
UNDER_REVIEW
Đồng thời lưu:
reviewStartedAt
reviewedBy
Ví dụ:
Cán bộ: Nguyễn Văn B
Bắt đầu kiểm tra:
01/09/2026 09:15
Điều này rất hữu ích để tính thời gian xử lý trung bình.

PHẦN B — KIỂM TRA HỒ SƠ
5. Quick Preview
Cán bộ không cần mở từng màn hình riêng biệt.
Hệ thống cung cấp:
Application Review Workspace
Gồm:
┌──────────────────────────────────────────────┐
│ Hồ sơ HS-2026-00125                          │
├──────────────┬──────────────┬────────────────┤
│ Người dân    │ Checklist    │ Review         │
├──────────────┴──────────────┴────────────────┤
│                                              │
│              PDF Preview                     │
│                                              │
└──────────────────────────────────────────────┘

6. Kiểm tra thông tin người dân
Cán bộ kiểm tra:
Họ tên.
Ngày sinh.
Số định danh/CCCD.
Địa chỉ.
Thông tin liên quan đến thủ tục.
Ví dụ:
Họ tên: Nguyễn Văn A       ✓
Ngày sinh: 01/01/2000      ✓
CCCD: ************         ✓
Địa chỉ: ...               ⚠
Nếu phát hiện sai:
Comment vào trường tương ứng.

7. Kiểm tra điều kiện thủ tục
Hệ thống hiển thị điều kiện của thủ tục.
Cán bộ đối chiếu hồ sơ với điều kiện.
Ví dụ:
Điều kiện:
✓ Người thực hiện đủ điều kiện
✓ Đúng cơ quan có thẩm quyền
✓ Thông tin phù hợp
Nếu không đáp ứng:
❌ Không đáp ứng điều kiện thực hiện thủ tục
Cán bộ ghi rõ lý do.

8. Kiểm tra Smart Checklist
Hệ thống tự động hiển thị Checklist.
Ví dụ:
THÀNH PHẦN HỒ SƠ

☑ CCCD
☑ Giấy xác nhận cư trú
☑ Tờ khai
☑ Giấy tờ liên quan
Cán bộ kiểm tra từng mục.
Có thể đánh dấu:
✓ Đầy đủ
⚠ Cần kiểm tra
✕ Thiếu

9. Kiểm tra tài liệu đính kèm
Cán bộ xem các file người dân upload:
Documents

CCCD.jpg
GiayCuTru.pdf
TaiKhai.pdf
Cán bộ có thể:
Preview.
Zoom.
Kiểm tra.
Đánh dấu hợp lệ.
Đánh dấu không hợp lệ.
Comment.
Ví dụ:
Giấy xác nhận cư trú.pdf

❌ Không hợp lệ

Comment:
"Thông tin địa chỉ chưa khớp với E-form."

10. Kiểm tra E-form
Cán bộ kiểm tra dữ liệu người dân đã nhập.
Ví dụ:
E-FORM

Họ tên: Nguyễn Văn A
Ngày sinh: 01/01/2000
CCCD: ************
Địa chỉ: Bình Định
Đối chiếu:
E-form
   ↕
CCCD
   ↕
Giấy cư trú
Nếu thông tin không khớp → Comment.

11. Kiểm tra PDF
Cán bộ Preview file PDF được hệ thống tạo.
Kiểm tra:
Đúng biểu mẫu.
Đúng phiên bản.
Đầy đủ thông tin.
Không sai dữ liệu.
Không bị thiếu trường.
Bố cục đúng.
E-form Data
     ↓
PDF
     ↓
Officer Review

PHẦN C — RA QUYẾT ĐỊNH
12. Final Review
Sau khi kiểm tra:
✓ Điều kiện
✓ Thông tin
✓ Checklist
✓ Documents
✓ E-form
✓ PDF
Hệ thống cho phép cán bộ đưa ra quyết định.
┌───────────────────────────┐
│     FINAL REVIEW          │
├───────────────────────────┤
│ ✓ Hồ sơ đầy đủ            │
│ ✓ Thông tin hợp lệ        │
│ ✓ Biểu mẫu hợp lệ         │
│                           │
│ [Request Revision]        │
│ [Approve]                 │
└───────────────────────────┘

13. Trường hợp KHÔNG hợp lệ
Cán bộ chọn:
Request Revision
Không nên chỉ cho nhập một comment chung.
Nên cho phép comment theo từng vị trí:
E-form
 └── Địa chỉ
       ↓
Comment:
"Vui lòng cập nhật địa chỉ theo
giấy xác nhận cư trú."
Hoặc:
Document
 └── CCCD
       ↓
Comment:
"Vui lòng bổ sung ảnh CCCD rõ hơn."

14. Gửi yêu cầu chỉnh sửa
Cán bộ xác nhận:
Request Revision
       ↓
NEED_REVISION
       ↓
Notification Citizen
Người dân nhận:
⚠️ Hồ sơ HS-2026-00125 cần được chỉnh sửa/bổ sung.

15. Người dân chỉnh sửa
Đây là loop trong Main Flow 2:
NEED_REVISION
      ↓
Citizen xem Comment
      ↓
Edit E-form
      ↓
Upload / Update document
      ↓
Generate PDF
      ↓
Resubmit
      ↓
RESUBMITTED
      ↓
Officer Review
Cán bộ sẽ nhận thông báo:
Hồ sơ đã được người dân cập nhật.

16. So sánh phiên bản trước và sau
Một chức năng nâng cấp rất đáng làm:
Revision History
Version 1
Địa chỉ: A
       ↓
Officer Comment
       ↓
Version 2
Địa chỉ: B
Cán bộ có thể xem:
What changed?
Ví dụ:
Changed:
✓ Địa chỉ
✓ Giấy xác nhận cư trú
Như vậy cán bộ không phải kiểm tra lại toàn bộ hồ sơ nếu chỉ có một vài phần được chỉnh sửa.

PHẦN D — DUYỆT HỒ SƠ
17. Approve
Nếu hồ sơ đạt:
Cán bộ chọn:
Approve
Hệ thống yêu cầu xác nhận:
Bạn có chắc chắn muốn duyệt
hồ sơ này?

[Hủy]     [Xác nhận duyệt]
Sau khi xác nhận:
UNDER_REVIEW
      ↓
APPROVED

18. Hệ thống tạo QR Code
Đây là điểm quan trọng theo yêu cầu mới của bạn.
QR chỉ được tạo sau khi cán bộ Approve.
APPROVED
    ↓
Generate QR
    ↓
QR Generated
Ví dụ:
Application ID:
HS-2026-00125

QR:
████████████
██      ████
██  QR  ████
████████████
QR liên kết với bộ hồ sơ đã được duyệt.
QR
 ↓
Application ID
 ↓
Approved Application
 ↓
E-form
 ↓
PDF Documents


20. Thông báo cho người dân
Sau khi QR được tạo:
APPROVED
   ↓
QR GENERATED
   ↓
Notification
Người dân nhận:
Hồ sơ của bạn đã được duyệt tiền kiểm. Mã QR đã được tạo. Vui lòng tải mã QR và các biểu mẫu đã hoàn thành, in hồ sơ và mang đến UBND để nộp.

