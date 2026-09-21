Sidebar Front-desk Officer
Dashboard

Quản lý hồ sơ
├── Tất cả hồ sơ
├── Chờ tiền kiểm
├── Đang kiểm tra
├── Cần bổ sung
├── Đã gửi lại
├── Đã duyệt tiền kiểm
└── Chờ tiếp nhận chính thức

Tiếp nhận hồ sơ
├── Chờ tiếp nhận
└── Đã tiếp nhận

Lịch sử xử lý

Thông báo

Hồ sơ cá nhân
Đăng xuất

Điểm quan trọng là không có "Quét QR" nữa.

1. Dashboard

Sidebar:

Dashboard

Màn hình này hiển thị tổng quan:

12  Chờ tiền kiểm
5   Đang kiểm tra
3   Cần bổ sung
4   Đã gửi lại
8   Đã duyệt tiền kiểm
6   Chờ tiếp nhận chính thức
20  Đã tiếp nhận hôm nay

Ngoài ra:

Hồ sơ mới nhất.
Hồ sơ vừa được người dân gửi lại.
Hồ sơ đang xử lý.
Thời gian xử lý trung bình.
Số hồ sơ đã xử lý hôm nay.
2. Quản lý hồ sơ

Đây là module chính của Officer.

Quản lý hồ sơ
├── Tất cả hồ sơ
├── Chờ tiền kiểm
├── Đang kiểm tra
├── Cần bổ sung
├── Đã gửi lại
├── Đã duyệt tiền kiểm
└── Chờ tiếp nhận chính thức
Tất cả hồ sơ

Hiển thị:

Mã hồ sơ	Người dân	Thủ tục	Ngày gửi	Cán bộ	Trạng thái	Action
HS001	Nguyễn Văn A	Đăng ký kết hôn	21/09	—	Chờ tiền kiểm	Xem
HS002	Trần Văn B	Chứng thực	21/09	Nguyễn C	Đang kiểm tra	Tiếp tục

Filter:

Search mã hồ sơ
Search người dân
Thủ tục
Trạng thái
Ngày gửi
Cán bộ xử lý
3. Chờ tiền kiểm

Đây chính là chức năng:

Tiếp nhận hồ sơ tiền kiểm.

Sidebar:

Quản lý hồ sơ
    └── Chờ tiền kiểm

Officer mở danh sách:

HS-2026-00125
Nguyễn Văn A
Đăng ký kết hôn
21/09/2026 08:30

[Quick Preview]
[Nhận xử lý]

Khi chọn:

[Nhận xử lý]

trạng thái:

SUBMITTED_FOR_REVIEW
        ↓
UNDER_REVIEW

và lưu:

reviewStartedAt
reviewedBy
4. Xem và phân loại hồ sơ

Không cần sidebar riêng.

Nó nằm trong:

Quản lý hồ sơ
    └── Tất cả hồ sơ

Officer sử dụng:

Search
Filter
Sort

Ví dụ filter:

Trạng thái: Cần bổ sung
Thủ tục: Đăng ký kết hôn
Ngày: 01/09 - 21/09

Do đó:

Xem và phân loại hồ sơ = chức năng trong Application List, không phải menu riêng.

5. Đang kiểm tra

Sidebar:

Quản lý hồ sơ
    └── Đang kiểm tra

Danh sách những hồ sơ Officer đã nhận nhưng chưa đưa ra quyết định.

Ví dụ:

HS-2026-00125

Nguyễn Văn A
Đăng ký kết hôn

Bắt đầu:
09:15 21/09/2026

[Tiếp tục kiểm tra]

Khi click → mở Application Review Workspace.

6. Application Review Workspace

Đây mới là nơi chứa phần lớn các chức năng bạn hỏi.

┌─────────────────────────────────────────────────────────┐
│ HS-2026-00125                    [ĐANG KIỂM TRA]        │
│ Nguyễn Văn A · Đăng ký kết hôn                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ [Thông tin] [Điều kiện] [Checklist] [Giấy tờ]          │
│ [E-form] [PDF] [Comment] [Phiên bản] [Timeline]         │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│                  Nội dung Review                        │
│                                                         │
├─────────────────────────────────────────────────────────┤
│ [Yêu cầu bổ sung]                 [Duyệt tiền kiểm]     │
└─────────────────────────────────────────────────────────┘

Và các chức năng của bạn nằm ở đây.

7. Kiểm tra thông tin người dân

Tab:

[Thông tin]

Giao diện:

THÔNG TIN NGƯỜI DÂN

Họ tên
Nguyễn Văn A                     ✓

Ngày sinh
01/01/2000                       ✓

CCCD
********1234                     ✓

Địa chỉ
Bình Dương                       ⚠

Số điện thoại
09xxxxxxxx

Officer có thể:

[Hợp lệ]
[Cần kiểm tra]
[Comment]
8. Kiểm tra điều kiện thủ tục

Nên thêm tab:

[Điều kiện]

Ví dụ:

ĐIỀU KIỆN THỰC HIỆN

✓ Đúng đối tượng thực hiện

✓ Đúng cơ quan có thẩm quyền

✓ Thông tin cư trú phù hợp

⚠ Điều kiện khác cần kiểm tra

Nếu không đạt:

[Thêm nhận xét]
9. Kiểm tra Checklist

Tab:

[Checklist]

Ví dụ:

THÀNH PHẦN HỒ SƠ

CCCD
Citizen: Đã chuẩn bị
Officer: [Hợp lệ ▼]

Giấy xác nhận cư trú
Citizen: Đã chuẩn bị
Officer: [Cần kiểm tra ▼]

Tờ khai đăng ký
Citizen: Đã chuẩn bị
Officer: [Hợp lệ ▼]

Officer status:

Hợp lệ
Cần kiểm tra
Thiếu
Không hợp lệ
10. Kiểm tra giấy tờ

Tab:

[Giấy tờ]

Hiển thị:

CCCD mặt trước.jpg

[Preview]

Trạng thái:
● Chưa kiểm tra

[Hợp lệ]
[Không hợp lệ]
[Comment]

Officer có thể:

Preview.
Zoom.
Đánh dấu hợp lệ.
Đánh dấu không hợp lệ.
Comment.
11. Kiểm tra E-form

Tab:

[E-form]

Ví dụ:

Field	Dữ liệu	Review
Họ tên	Nguyễn Văn A	✓
Ngày sinh	01/01/2000	✓
CCCD	********1234	✓
Địa chỉ	Bình Dương	⚠ Comment

Mỗi field nên có:

[✓]
[⚠]
[💬]

Không cần Officer sửa dữ liệu của Citizen.

Officer chỉ:

Review
Comment
Request Revision
12. Kiểm tra PDF

Tab:

[PDF]

Layout:

┌───────────────────────────────┬────────────────────┐
│                               │ REVIEW CHECKLIST   │
│                               │                    │
│        PDF PREVIEW            │ ☑ Đúng mẫu        │
│                               │ ☑ Đúng version     │
│                               │ ☑ Đầy đủ dữ liệu   │
│                               │ ☑ Không lỗi layout │
│                               │                    │
└───────────────────────────────┴────────────────────┘

Có:

[Download]
[Full Screen]
13. Comment trực tiếp

Không cần Sidebar:

Comment

nên là tab + action trong Review Workspace.

Tab:

[Comment]

Tổng hợp:

3 vấn đề cần xử lý

1. E-form > Địa chỉ
   "Vui lòng cập nhật địa chỉ theo giấy xác nhận cư trú."

2. CCCD mặt trước
   "Ảnh chưa rõ."

3. Checklist > Giấy cư trú
   "Thiếu tài liệu."

Officer có thể:

Add Comment
Edit Comment
Delete Comment
14. Yêu cầu người dân chỉnh sửa/bổ sung

Không phải sidebar riêng.

Button cố định cuối Review Workspace:

[Yêu cầu bổ sung]

Modal:

YÊU CẦU CHỈNH SỬA/BỔ SUNG

Các vấn đề:

☑ E-form > Địa chỉ
☑ Document > CCCD
☑ Checklist > Giấy cư trú

Ghi chú:
[...................................]

[Hủy]
[Gửi yêu cầu]

Sau đó:

UNDER_REVIEW
      ↓
NEED_REVISION

Hồ sơ tự xuất hiện trong:

Quản lý hồ sơ
    └── Cần bổ sung
15. Cần bổ sung

Sidebar:

Quản lý hồ sơ
    └── Cần bổ sung

Đây là những hồ sơ Officer đã gửi Request Revision và đang chờ Citizen sửa.

Table:

Mã HS	Citizen	Thủ tục	Ngày yêu cầu	Số lỗi	Status
HS125	Nguyễn A	Kết hôn	21/09	3	Cần bổ sung

Không cần Officer làm gì nhiều cho đến khi Citizen gửi lại.

16. Đã gửi lại

Sidebar:

Quản lý hồ sơ
    └── Đã gửi lại

Đây là một menu rất nên có.

Khi Citizen sửa xong:

NEED_REVISION
      ↓
RESUBMITTED

Officer thấy badge:

● Người dân vừa cập nhật

Action:

[Review lại]
17. Theo dõi lịch sử sửa hồ sơ

Đây là:

Revision History

Không cần sidebar riêng cho từng hồ sơ.

Nằm trong Review Workspace:

[Phiên bản]

Ví dụ:

Version 1
21/09 09:00

Officer Request Revision

Version 2
21/09 10:05

[So sánh V1 ↔ V2]

Compare:

Trường	V1	V2
Địa chỉ	A	B
CCCD	old.jpg	new.jpg
18. Timeline

Nên có tab:

[Timeline]

Ví dụ:

08:20 Hồ sơ được tạo

08:52 E-form hoàn thành

09:00 Gửi tiền kiểm

09:15 Officer tiếp nhận

09:30 Yêu cầu chỉnh sửa

10:05 Citizen chỉnh sửa

10:07 Gửi lại

10:30 Được duyệt tiền kiểm
19. Duyệt hồ sơ

Button cuối Review Workspace:

[Duyệt tiền kiểm]

Modal:

XÁC NHẬN DUYỆT TIỀN KIỂM

✓ Điều kiện
✓ Thông tin
✓ Checklist
✓ Giấy tờ
✓ E-form
✓ PDF

[Hủy]

[Xác nhận duyệt]

Sau confirm:

UNDER_REVIEW
      ↓
APPROVED
20. Tạo QR sau duyệt

Bạn nói:

Hệ thống không còn chức năng quét QR.

Điều này không đồng nghĩa phải bỏ QR của Citizen, nếu requirement của bạn vẫn là:

Sau Officer duyệt, hệ thống tạo QR cho bộ hồ sơ.

Flow vẫn có thể:

Officer Approve
      ↓
APPROVED
      ↓
System Generate QR
      ↓
READY_TO_SUBMIT

Officer không có menu QR.

Citizen vẫn có thể:

View QR
Download QR

Nếu bạn cũng muốn bỏ QR hoàn toàn khỏi dự án, lúc đó mới xóa bước Generate QR. Còn theo yêu cầu hiện tại của bạn, mình hiểu là chỉ bỏ chức năng Officer quét QR.

21. Đã duyệt tiền kiểm

Sidebar:

Quản lý hồ sơ
    └── Đã duyệt tiền kiểm

Table:

Mã HS	Citizen	Procedure	Approved At	Approved By	Status

Officer có thể:

View
View Approved Version
View Timeline

Không Edit.

22. Chờ tiếp nhận chính thức

Đây chính là nơi đặt hai chức năng bạn hỏi:

Đối chiếu hồ sơ điện tử và hồ sơ giấy.
Xác nhận tiếp nhận hồ sơ chính thức.

Sidebar:

Tiếp nhận hồ sơ
    └── Chờ tiếp nhận

Khi Citizen đến UBND, Officer không cần scan QR nữa.

Có thể tìm bằng:

Mã hồ sơ
Số CCCD
Số điện thoại
Họ tên

Ví dụ:

TÌM HỒ SƠ ĐÃ DUYỆT

[Mã hồ sơ / CCCD / SĐT........]

[Tìm kiếm]

Kết quả:

HS-2026-00125

Nguyễn Văn A
Đăng ký kết hôn

Đã duyệt tiền kiểm
Version: V3

Officer chọn:

[Tiếp nhận hồ sơ]
23. Màn hình đối chiếu hồ sơ

Sau khi Officer tìm hồ sơ:

┌────────────────────────┬────────────────────────┐
│ HỒ SƠ ĐIỆN TỬ          │ HỒ SƠ GIẤY             │
├────────────────────────┼────────────────────────┤
│ CCCD                   │ ☐ Đã đối chiếu         │
│ Giấy cư trú            │ ☐ Đã đối chiếu         │
│ Tờ khai                │ ☐ Đã đối chiếu         │
│ PDF approved           │ ☐ Đã đối chiếu         │
└────────────────────────┴────────────────────────┘

Officer tick:

☑ CCCD khớp
☑ Giấy cư trú khớp
☑ Tờ khai khớp
☑ Hồ sơ đầy đủ

Sau đó:

[Xác nhận tiếp nhận chính thức]
24. Xác nhận tiếp nhận chính thức

Modal:

XÁC NHẬN TIẾP NHẬN HỒ SƠ

HS-2026-00125
Nguyễn Văn A

Hồ sơ giấy đã được kiểm tra và
đối chiếu với hồ sơ điện tử.

[Hủy]

[Xác nhận tiếp nhận]

Sau đó:

READY_TO_SUBMIT
       ↓
OFFICIALLY_RECEIVED

Hồ sơ chuyển sang:

Tiếp nhận hồ sơ
    └── Đã tiếp nhận
25. Đã tiếp nhận

Sidebar:

Tiếp nhận hồ sơ
    └── Đã tiếp nhận

Table:

Mã HS	Citizen	Procedure	Tiếp nhận lúc	Officer	Status

Actions:

View Detail
View Timeline
View Approved Version

Read-only.

26. Lịch sử xử lý

Sidebar:

Lịch sử xử lý

Đây là lịch sử của Officer, khác với Revision History của một hồ sơ.

Ví dụ:

Time	Mã HS	Action
08:30	HS001	Nhận xử lý
08:45	HS001	Comment
09:00	HS001	Request Revision
10:30	HS002	Approve
14:20	HS003	Xác nhận tiếp nhận

Filter:

Ngày
Action
Procedure
Application
Sidebar Officer chốt lại

Mình khuyên bạn dùng bản này:

OFFICER

Dashboard

Quản lý hồ sơ
├── Tất cả hồ sơ
├── Chờ tiền kiểm
├── Đang kiểm tra
├── Cần bổ sung
├── Đã gửi lại
├── Đã duyệt tiền kiểm
└── Chờ tiếp nhận chính thức

Tiếp nhận hồ sơ
├── Chờ tiếp nhận
└── Đã tiếp nhận

Lịch sử xử lý

Thông báo

Hồ sơ cá nhân

Đăng xuất

Trong đó Application Review Workspace chứa:

Thông tin người dân
Điều kiện thủ tục
Checklist
Giấy tờ
E-form
PDF
Comment
Revision History
Timeline

[Yêu cầu bổ sung]
[Duyệt tiền kiểm]

Và Official Receipt Workspace chứa:

Tìm hồ sơ đã duyệt
        ↓
Xem Approved Version
        ↓
Đối chiếu hồ sơ điện tử
với hồ sơ giấy
        ↓
Xác nhận tiếp nhận chính thức
Mapping toàn bộ 14 chức năng bạn đưa ra
Chức năng	Nằm ở đâu
Tiếp nhận hồ sơ tiền kiểm	Chờ tiền kiểm → Nhận xử lý
Xem và phân loại hồ sơ	Tất cả hồ sơ + Search/Filter
Kiểm tra thông tin người dân	Review Workspace → Thông tin
Kiểm tra Checklist	Review Workspace → Checklist
Kiểm tra giấy tờ	Review Workspace → Giấy tờ
Kiểm tra E-form	Review Workspace → E-form
Kiểm tra PDF	Review Workspace → PDF
Comment trực tiếp	Review Workspace → Field/Document/Comment
Yêu cầu chỉnh sửa/bổ sung	Review Workspace → Yêu cầu bổ sung
Duyệt hồ sơ	Review Workspace → Duyệt tiền kiểm
Tạo QR sau duyệt	System tự động, không nằm Sidebar
Theo dõi lịch sử sửa hồ sơ	Review Workspace → Phiên bản/Revision History
Đối chiếu hồ sơ điện tử và giấy	Tiếp nhận hồ sơ → Chờ tiếp nhận → Detail
Xác nhận tiếp nhận chính thức	Tiếp nhận hồ sơ → Detail → Xác nhận tiếp nhận