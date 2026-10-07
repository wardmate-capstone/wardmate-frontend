# Tiến độ và bàn giao WardMate

Cập nhật: 07/10/2026.
Mục đích: giúp phiên Codex mới tiếp tục đúng công việc và quyết định đã thống nhất.
Đọc cùng `../AGENTS.md`; luôn xác minh lại bằng code và Git trước khi hành động.

## Đồng nhất Icon Hệ thống trên Toàn bộ Sidebar (Chuẩn `@phosphor-icons/react`) — 07/10/2026

- **1. Thống nhất Icon đại diện cho các mục cùng chức năng**:
  - **Mục "Tổng quan"**: Chuẩn hóa dùng icon `House` (Ngôi nhà) trên tất cả phân hệ (`Admin`, `Procedure Manager`, `Officer`, `Citizen`). Thay thế icon `SquaresFour` ở Quản lý thủ tục.
  - **Mục "Thủ tục hành chính" / "Danh sách thủ tục"**: Chuẩn hóa dùng icon `ClipboardText` trên tất cả phân hệ (`Admin`, `Manager`, `Procedure Manager`). Thay thế icon `Files` ở Quản lý thủ tục.
  - **Mục "Hồ sơ cá nhân"**: Chuẩn hóa dùng icon `UserCircle` trên cả 4 vai trò cán bộ (`Admin`, `Manager`, `Officer`, `Procedure Manager`). Thay thế icon `User` ở Cán bộ Một cửa và `UserGear` ở Quản lý thủ tục.
  - **Mục "Nhật ký hoạt động" / "Lịch sử cập nhật"**: Chuẩn hóa dùng icon `ClockCounterClockwise` trên tất cả phân hệ (`Admin`, `Officer`, `Procedure Manager`). Thay thế icon `Article` ở Quản lý thủ tục và `Activity` ở Admin.
- **2. Đồng nhất 1 Thư viện Icon duy nhất**:
  - Xác nhận 100% icon trên hệ thống sử dụng **duy nhất một thư viện chuẩn: `@phosphor-icons/react`**. Không có thư viện ngoài nào bị trộn lẫn.
- **3. Kiểm tra chất lượng**:
  - `npm run typecheck`: Đạt 0 lỗi (Exit code 0).
  - `npm run lint`: Đạt 0 lỗi (Exit code 0).
  - `npm run build`: Đạt 0 lỗi, bundle thành công 100% trong 10.99s.

## Thống nhất Nhãn 'Tổng quan' trên Tất cả Sidebar & Tối ưu Cột Người dùng — 07/10/2026

- **1. Thống nhất nhãn mục đầu tiên thành 'Tổng quan' trên toàn bộ Sidebar**:
  - `AdminPage.tsx`: Đổi nhãn `Trung tâm quản trị` thành `Tổng quan` (tiêu đề và breadcrumb đồng bộ).
  - `ProcedureManagerSidebar.tsx`: Đổi nhãn `Dashboard` thành `Tổng quan`.
  - `OfficerSidebar.tsx`: Đổi nhãn `Dashboard` thành `Tổng quan`.
  - `CitizenPage.tsx`: Đổi nhãn `Dashboard` thành `Tổng quan`.
  - Toàn bộ 4 phân hệ hiện đã đồng nhất 100% về từ ngữ thuần Việt, trang nhã, đúng quy chuẩn cơ quan Nhà nước.
- **2. Tối ưu hiển thị Cột Người dùng (`AdminPage.tsx`)**:
  - Đổi tiêu đề cột từ `Người dùng & Họ tên` thành `Người dùng` tinh gọn.
  - Tự động khử trùng lặp: Nếu tài khoản chưa có họ tên riêng (hoặc họ tên trùng username như `ducanh1`), chỉ hiển thị đúng 1 dòng `@username` font mono rõ ràng, không lặp lại 2 dòng chữ giống nhau gây rối mắt.
- **3. Kiểm tra chất lượng**:
  - `npm run typecheck`: Đạt 0 lỗi (Exit code 0).
  - `npm run lint`: Đạt 0 lỗi (Exit code 0).
  - `npm run build`: Đạt 0 lỗi (Vite bundle hoàn tất thành công).

## Tinh chỉnh Vị trí Hồ sơ cá nhân Sidebar Admin — 07/10/2026

- **1. Chuyển mục Hồ sơ cá nhân xuống vị trí cuối cùng**:
  - `src/pages/admin/AdminPage.tsx`: Di chuyển `{ id: "profile", label: "Hồ sơ cá nhân", icon: UserCircle }` từ đầu nhóm "Tài khoản & truy cập" xuống vị trí cuối cùng của nhóm "Vận hành hệ thống" (dưới mục "Bảo mật & sao lưu"), đảm bảo nằm ở đáy của Sidebar Admin tương đồng với các vai trò khác.
- **2. Kiểm tra chất lượng**:
  - `npm run typecheck`: Đạt 0 lỗi (Exit code 0).
  - `npm run lint`: Đạt 0 lỗi (Exit code 0).

## Dọn dẹp Mã nguồn & Loại bỏ các File không sử dụng (Dead Code Cleanup) — 07/10/2026

- **1. Rà soát & Loại bỏ các file mồ côi (Unused / Dead Code)**:
  - **3 View Profile cũ sau khi đồng nhất sang `UnifiedSelfProfileView`**:
    - `src/pages/manager/views/ManagerProfileView.tsx` (Đã được thay thế hoàn toàn bởi `UnifiedSelfProfileView.tsx`).
    - `src/pages/officer/OfficerProfileView.tsx` (Đã được thay thế hoàn toàn bởi `UnifiedSelfProfileView.tsx`).
    - `src/pages/procedure-manager/ProcedureProfileView.tsx` (Đã được thay thế hoàn toàn bởi `UnifiedSelfProfileView.tsx`).
  - **Trang Profile cũ không còn route**:
    - `src/pages/account/ProfilePage.tsx` (Route `/tai-khoan` đã gỡ bỏ từ trước, không còn bất kỳ import hay tham chiếu nào trong dự án).
  - **Các component thừa không còn sử dụng**:
    - `src/components/brand/NationalEmblem.tsx` (Component vẽ SVG quốc huy không được sử dụng ở bất kỳ màn hình nào).
    - `src/components/home/NoticeCarousel.tsx` (Carousel thông báo cũ không được gọi trong trang chủ hay bất cứ trang nào).
  - **Types cũ không còn sử dụng**:
    - `src/types/procedureManager.ts` (Type mock cũ của Procedure Manager, đã được thay thế hoàn toàn bởi `src/lib/api/procedures.ts`).
- **2. Cập nhật Fixture & Test Playwright**:
  - `tests/fixtures/auth.ts`: Bổ sung mock cho endpoint `/api/v1/users/profiles` (API 60) đảm bảo test môi trường giả lập cán bộ chạy chuẩn xác.
  - `tests/manager.spec.ts`: Cập nhật nhãn tìm kiếm nút Sidebar và Header từ context cũ sang context mới *"Cán bộ Một cửa"*.
- **3. Kiểm tra chất lượng sau dọn dẹp**:
  - `npm run typecheck`: Đạt 0 lỗi (Exit code 0).
  - `npm run lint`: Đạt 0 lỗi (Exit code 0).
  - `npm run build`: Đạt 0 lỗi, bundle thành công 100% trong 10.29s.
  - Playwright E2E:
    - `tests/manager.spec.ts` & `tests/officer.spec.ts`: **8/8 tests pass (100%)**.
    - `tests/procedure-manager.spec.ts`: **20/20 tests pass (100%)**.

## Tối ưu Bảng Người dùng Admin & Đồng nhất Hồ sơ cá nhân 4 Vai trò Cán bộ — 07/10/2026

- **1. Tối ưu Bảng Danh sách Người dùng Admin (`UsersView` trong `AdminPage.tsx`)**:
  - **Gộp cột "Phường công tác" vào "Vai trò" thành `Vai trò & Đơn vị`**:
    - Xóa bỏ cột riêng "Phường công tác" vốn làm 90% dòng công dân bị trống trải và hiện dòng chữ "Không áp dụng" mất mỹ quan.
    - Bảng rút gọn thành 4 cột cân đối, thanh lịch: `Người dùng & Họ tên` | `Vai trò & Đơn vị` | `Trạng thái` | `Thao tác`.
  - **Phân cấp hiển thị theo vai trò**:
    - **Công dân (`REGISTERED_CITIZEN`)**: Chỉ hiển thị huy hiệu `Công dân` nhẹ nhàng, gọn gàng; không có dòng phụ, không có ô chọn thừa.
    - **Cán bộ địa phương (`MANAGER`, `FRONT_DESK_OFFICER`)**: Hiển thị huy hiệu vai trò chuẩn, kèm cụm icon `Buildings` và dropdown chọn Phường nhỏ gọn ngay bên dưới để Admin gán/chuyển đổi đơn vị nhanh.
    - **Quản trị viên / Quản lý thủ tục**: Hiển thị huy hiệu vai trò chuyên biệt tương ứng.
- **2. Đồng nhất 100% Hồ sơ cá nhân cho cả 4 vai trò Cán bộ (`UnifiedSelfProfileView`)**:
  - **Lấy chuẩn gốc Admin (`ManagerProfileDetailView`) làm chuẩn thiết kế**:
    - Tạo component dùng chung [`UnifiedSelfProfileView.tsx`](file:///d:/frontend/src/components/profile/UnifiedSelfProfileView.tsx).
    - **Hero Banner nhận diện cán bộ**: Ảnh bìa cờ hoa trang trọng, avatar ký tự tên viết tắt, nhãn vai trò và đơn vị hành chính.
    - **Thẻ CCCD gắn chip chuẩn Quốc gia**: Thiết kế mô phỏng thẻ Căn cước công dân gắn chip với dải gradient đỏ - vàng ánh kim, chip bảo mật vàng, quốc hiệu, mã QR tra cứu và nút sao chép số CCCD 1 chạm có thông báo Toast.
    - **Khối Thông tin Định danh & Nhân thân (API 06/07)**: Họ tên, Ngày tháng năm sinh, Giới tính, Số điện thoại liên hệ (chuẩn hóa nhãn *"Chưa được cập nhật"* khi trống).
    - **Khối Nơi cư trú**: Địa chỉ thường trú và Địa chỉ tạm trú (kèm thẻ chip Đơn vị công tác nếu có).
    - **Khối Tài khoản & Quyền hạn công vụ (API 05)**: Tên đăng nhập, Email liên kết, Vai trò hệ thống, và Đơn vị Phường/Xã công tác đối chiếu từ danh mục API `getWards()`.
    - **Thao tác hành động**: Nút "Chỉnh sửa hồ sơ" mở Modal cập nhật thông tin gọi API `PUT /api/v1/users/me/profile` (tự động cập nhật store và làm mới giao diện) + Nút "In phiếu thông tin" (`window.print()`).
  - **Tích hợp đồng bộ vào cả 4 vai trò**:
    - **Admin (`AdminPage.tsx`)**: Bổ sung mục "Hồ sơ cá nhân" (icon `UserCircle`, tab `profile`) trong nhóm *Tài khoản & truy cập* tại Sidebar, kết nối trực tiếp với `UnifiedSelfProfileView`.
    - **Lãnh đạo UBND (`ManagerPage.tsx`)**: Chuyển đổi tab `profile` sang `UnifiedSelfProfileView`, đồng thời ẩn heading phụ tránh đúp tiêu đề.
    - **Cán bộ Một cửa (`OfficerPage.tsx`)**: Chuyển đổi tab `profile` sang `UnifiedSelfProfileView`, gỡ bỏ hoàn toàn view cũ giả lập ca trực hardcode.
    - **Quản lý Thủ tục (`ProcedureManagerPage.tsx`)**: Chuyển đổi tab `profile` sang `UnifiedSelfProfileView`, đồng nhất 100% trải nghiệm người dùng.
- **3. Kiểm tra chất lượng**:
  - `npm run typecheck`: Đạt 0 lỗi (TypeScript 100% type-safe).
  - `npm run lint`: Đạt 0 lỗi (ESLint pass).
  - `npm run build`: Đạt 0 lỗi (Vite bundle thành công trong 18.14s, code-splitting tự động `UnifiedSelfProfileView-BawAj_0i.js`).

## Chuẩn hóa & Hoàn thiện Tích hợp IAM Service API (API 09, 15, 16, 54–58, 60) — 07/10/2026

- **1. Trả lời & Xác minh các API IAM theo câu hỏi của người dùng**:
  - **API 09 (`DELETE /api/v1/users/me/profile`)**: Đã được khai báo và export trong `src/lib/api/index.ts` (`deleteMyProfile()`), nhưng **chưa được gắn vào UI** do người dùng thông thường không có nhu cầu xóa trắng hồ sơ định danh gốc của chính mình.
  - **API 15 (`GET /api/v1/accounts/{id}`) & API 60 (`GET /api/v1/users/profiles`)**: Xác nhận người dùng nhận định **chính xác 100%**. Trước đó Admin chỉ có bảng tài khoản và nút Khóa/Mở, chưa có nút "Xem chi tiết". Nay đã bổ sung Modal "Chi tiết tài khoản & Người dùng" cho Admin, hiển thị đầy đủ thông tin tài khoản (API 15) và hồ sơ cá nhân/định danh (API 60/61).
  - **API 16 (`PUT /api/v1/accounts/{id}/status`)**: Xác nhận người dùng nhận định **chính xác 100%**. Trước đó Manager chỉ có thao tác Xem/Sửa/Xóa hồ sơ, chưa có nút Khóa/Mở khóa tài khoản cho cán bộ cấp dưới. Nay đã bổ sung cột Trạng thái và nút "Tạm khóa / Kích hoạt" trong `ManagerProfilesView.tsx`.
- **2. Thực hiện Mục 3: Chuẩn hóa UX Frontend "hết kì" và mượt mà 100%**:
  - **Đổi ngữ cảnh Manager (`/quan-ly`)**: Cập nhật nhãn Sidebar và Header từ "Hồ sơ công dân" thành "Nhân sự Một cửa / Cán bộ Một cửa", tiêu đề "Quản lý Cán bộ Một cửa", phản ánh đúng bản chất cán bộ cấp dưới trong phường quản lý.
  - **Xử lý thân thiện khi Manager gặp lỗi 403 (chưa có Phường)**: Thay vì báo lỗi chung chung, hiển thị Alert hướng dẫn rõ ràng: *"Tài khoản Lãnh đạo của bạn chưa được phân bổ Phường công tác trong hệ thống. Vui lòng liên hệ Quản trị viên hệ thống (Admin) để gán Phường trước khi quản lý cán bộ Một cửa."*
  - **Admin Xem chi tiết (API 15 & API 60)**: Bổ sung nút "Xem chi tiết" và Modal hiển thị toàn diện thông tin tài khoản (username, email, ward, roles, trạng thái) và hồ sơ định danh (CCCD, họ tên, ngày sinh, giới tính, thường trú, tạm trú).
  - **Manager Khóa/Mở tài khoản (API 16)**: Bổ sung cột Trạng thái và nút "Khóa / Kích hoạt" trực tiếp cho từng cán bộ Một cửa trong bảng `ManagerProfilesView.tsx`.
- **3. Tinh chỉnh UI theo yêu cầu người dùng**:
  - **Bỏ cột Email khỏi bảng Người dùng Admin**: Email đã có đầy đủ trong popup "Xem chi tiết", giúp bảng thông thoáng.
  - **Đồng bộ nút Làm mới**: Thống nhất dùng icon `ArrowsClockwise` xoay khi đang tải, nhãn chữ "Làm mới", chiều cao `h-10 px-3.5` cho cả Admin và Manager.
  - **Đồng bộ cột thao tác Manager**: Đổi từ các chữ trần (`Chi tiết`, `Khóa`, `Sửa`) sang các nút bo góc viền chuẩn UI (`Xem chi tiết`, `Tạm khóa/Kích hoạt`, `Chỉnh sửa`, icon xóa) đồng bộ 100% với Admin.
  - **Đơn giản hóa khóa tài khoản**: Bỏ nút khóa/mở trong Modal xem chi tiết của Admin, chỉ quản lý 1 nơi duy nhất tại bảng danh sách.
  - **Tách riêng trang Quản lý đơn vị Phường / Xã (`WardsView`)**: Thêm mục menu "Đơn vị Phường / Xã" trong nhóm Tài khoản & truy cập; chuyển toàn bộ nút "Thêm phường" và bảng danh sách phường sang view riêng này.
  - **Tối ưu phân cấp quản trị cán bộ Một cửa & Tinh gọn dropdown Phường**:
    - Gỡ bỏ hoàn toàn nút "Thêm Cán bộ Một cửa" khỏi trang Admin; chức năng này giao riêng cho Lãnh đạo cấp phường (`Manager`) tại `/quan-ly`.
    - Dropdown chọn phường công tác trong bảng Người dùng chỉ hiển thị tên phường thuần túy (`w.name`, ví dụ: *Phường Bình Hòa*), bỏ mã code kỹ thuật trong ngoặc đơn (`(PHUONG_BINH_HOA)`) giúp giao diện gọn gàng, tự nhiên.
  - **Bổ sung & Chuẩn hóa bộ lọc Vai trò (Role Filter) tinh gọn cho Admin**:
    - Chuẩn hóa chỉ giữ đúng các vai trò đối tượng mà Admin cần quản trị: `Tất cả vai trò`, `Lãnh đạo UBND`, `Cán bộ Một cửa`, `Quản lý thủ tục`, `Công dân`.
    - Loại bỏ tùy chọn `Quản trị viên` khỏi dropdown bộ lọc (`ROLE_FILTER_OPTIONS`), do Admin không cần tự lọc chính mình trên danh sách quản trị người dùng.
    - Loại bỏ triệt để các mã kỹ thuật tiếng Anh thô (`REGISTERED_CITIZEN`, `FRONT_DESK_OFFICER`,...), loại bỏ các hậu tố ngoặc đơn dài dòng (`(Admin)`, `(Manager)`), gom các biến thể dữ liệu trùng lặp về cùng một vai trò chuẩn.
  - **Chuẩn hóa & Phân tách rõ Phường công tác theo Vai trò (Cán bộ vs Công dân/Admin)**:
    - **Bảng Người dùng Admin (`AdminPage.tsx`)**: Chỉ hiển thị dropdown chọn Phường công tác đối với các tài khoản Cán bộ địa phương (`MANAGER`, `FRONT_DESK_OFFICER`). Đối với tài khoản Công dân (`REGISTERED_CITIZEN`) và Quản trị viên/khác, hiển thị nhãn nhẹ nhàng `Không áp dụng` thay vì dropdown và chữ `(Chưa gán phường)`.
    - **Trang Xem chi tiết (`ManagerProfileDetailView.tsx`)**: 
      - Tự động ẩn huy hiệu `Đơn vị: ...` ở Banner nếu tài khoản không phải Cán bộ địa phương.
      - Tại khối Thông tin Tài khoản: Nếu là Công dân/Admin, hiển thị `Phạm vi quản trị: Toàn hệ thống (Không áp dụng)`. Nơi ở của công dân được thể hiện chuẩn mực qua 2 trường cư trú độc lập: `Địa chỉ thường trú` và `Địa chỉ tạm trú`.
  - **Cơ chế Điều hướng Thông minh giữ Cán bộ / Quản lý trong Dashboard nghiệp vụ**:
    - **Tách biệt ngữ cảnh công vụ vs cổng công dân**: Các tài khoản Cán bộ chuyên trách (`IT_ADMIN`, `MANAGER`, `FRONT_DESK_OFFICER`) được giữ cố định trong môi trường làm việc công vụ tương ứng (`/admin`, `/quan-ly`, `/can-bo`).
    - **Tự động chuyển hướng tại Route Trang chủ (`/`)**: Bổ sung `HomeRoute` tại route index của [`App.tsx`](file:///d:/frontend/src/app/App.tsx). Khi Cán bộ bấm Back trình duyệt về `/` hoặc nhập URL `/`, hệ thống tự động redirect về đúng Dashboard chuyên trách (`replace: true`).
    - **Đảm bảo tính linh hoạt cho `PROCEDURE_MANAGER` và `REGISTERED_CITIZEN`**: Procedure Manager và Công dân vẫn được xem và hoạt động bình thường trên Landing Page và danh mục thủ tục công khai (`/thu-tuc`).
    - **Logo Header thông minh ([`MainLayout.tsx`](file:///d:/frontend/src/components/layout/MainLayout.tsx))**: Click vào Logo WardMate sẽ tự động đưa Cán bộ về Dashboard của họ thay vì ra Landing Page của công dân.
  - **Trang Xem chi tiết toàn diện dạng View cho Admin & Phân tách Tab theo vai trò**:
    - **Admin (`AdminPage.tsx`)**: Chuyển đổi toàn bộ cơ chế xem chi tiết người dùng từ Modal popup nhỏ sang giao diện trang xem chi tiết (`ManagerProfileDetailView.tsx`), có nút quay lại bảng danh sách mượt mà và màn hình loading xoay khi đang lấy dữ liệu API 61 (`getAdminProfile`).
    - **Quản lý User (Admin)**: Hiển thị đầy đủ cả 3 mục như trong thiết kế:
      - **Mục 1. Thông tin cá nhân**: Thông tin định danh & nhân thân (CCCD với nút sao chép, Họ tên, Ngày sinh, Giới tính, Dân tộc, SĐT), Địa chỉ thường trú / tạm trú, và khối Thông tin Tài khoản & Quyền truy cập (Username, Email, Phường công tác, Vai trò).
      - **Mục 2. Lịch sử Hồ sơ**: Danh sách các hồ sơ thủ tục hành chính công dân đã thực hiện tại Phường.
      - **Mục 3. Giấy tờ điện tử đã nộp**: Tệp đính kèm và tài liệu số hóa của công dân.
      - **Tối ưu hiển thị**: Tự động ẩn tiêu đề `<h1>Người dùng hệ thống</h1>` khi Admin đang xem chi tiết, tránh tình trạng bị dính chữ phía trên thanh điều hướng `← Quay lại danh sách người dùng` (đồng bộ với cơ chế của Manager).
    - **Quản lý Cán bộ Một cửa (Manager - `/quan-ly`)**: Đặt cờ `isFrontDesk={true}`, **ẩn hoàn toàn Mục 2 (Lịch sử hồ sơ) và Mục 3 (Giấy tờ điện tử)**; chỉ giữ lại Mục 1 phục vụ quản lý nhân sự nội bộ.
  - **Chuẩn hóa Hồ sơ cá nhân Cán bộ Một cửa (`OfficerProfileView.tsx`) dùng 100% dữ liệu API thật**:
    - Loại bỏ hoàn toàn khối giả lập hardcode *"Phân công quầy tiếp nhận"* (cơ quan giả UBND Phường An Khánh, vị trí trực giả, lĩnh vực phụ trách giả, lịch trực tuần giả, badge giả "Đang trong ca trực").
    - Chuyển sang hiển thị 100% dữ liệu thực từ backend IAM:
      - **Thông tin Định danh & Nhân thân (API 06/07)**: Thẻ CCCD gắn chip (kèm nút sao chép), Họ tên, Ngày tháng năm sinh, Giới tính, Số điện thoại liên hệ, Địa chỉ thường trú và Tạm trú.
      - **Thông tin Tài khoản & Quyền hạn công vụ (API 05)**: Tên đăng nhập, Email, Đơn vị Phường công tác thực tế (đối chiếu `wardId` qua API `getWards()`), Vai trò Việt hóa chuẩn (`Cán bộ Một cửa`), và số lượng quyền nghiệp vụ IAM.
      - Cho phép chỉnh sửa và cập nhật hồ sơ cá nhân thời gian thực qua `updateMyProfile` (`PUT /api/v1/users/me/profile`).
  - **Tối ưu hóa UI chi tiết Phường và Bảng Cán bộ Một cửa theo phản hồi người dùng**:
    - **Manager Quản lý Cán bộ Một cửa (`ManagerProfilesView.tsx`)**: Bỏ cột "Số điện thoại" trong bảng danh sách giúp bảng thông thoáng; chuyển thông tin số điện thoại vào trong màn hình Xem chi tiết.
    - **Làm rõ UI Đơn vị Phường trong Xem chi tiết (`ManagerProfileDetailView.tsx`)**:
      - Bổ sung icon `Buildings` kèm nhãn rõ ràng `Đơn vị: {wardName}` dạng thẻ badge trang nhã ở Header Banner thay vì thẻ xám không rõ ý nghĩa.
      - Xóa bỏ hoàn toàn dòng text phụ dính nhau `@username · email` ở Banner; gom toàn bộ dữ liệu tài khoản và quyền truy cập về **1 chỗ duy nhất** ở khối *"Thông tin Tài khoản & Quyền truy cập"* ở cuối trang với nhãn đầy đủ cho từng trường dữ liệu.
    - **Chuẩn hóa thông báo trường dữ liệu trống**: Thay thế toàn bộ dấu gạch thô `'—'` hoặc chữ `'Chưa cập nhật'` thành dòng chữ chuẩn **`"Chưa được cập nhật"`** (dạng chữ nghiêng màu xám thanh lịch) cho toàn bộ các trường dữ liệu chưa có (Số CCCD, Họ tên, Ngày sinh, Giới tính, Số điện thoại, Địa chỉ thường trú, Tạm trú, Email, Đơn vị Phường, Vai trò).
- **4. Kiểm tra chất lượng & Commit phân tách**:
  - `npm run typecheck`: Đạt 0 lỗi.
  - `npm run lint`: Đạt 0 lỗi.
  - Playwright test: `npx playwright test tests/procedure-manager.spec.ts` đạt **20/20 tests** (100% pass).
  - **Commit phân tách đã thực hiện**:
    - `f8e040b` — `feat(procedure-manager): add version rollback, delete draft modal, and category refresh`
    - `6fb70c1` — `feat(iam): integrate real profile APIs, full-page detail view, and role-based ward display`
    - `47ba1c9` — `feat(navigation): add smart home route and brand logo redirect for staff roles`

## Tối ưu hóa UI/UX Quản lý thủ tục, Hộp thoại xóa và Khôi phục phiên bản — 07/10/2026

- **1. Hoàn thiện tính năng Khôi phục phiên bản (Rollback)**:
  - Bổ sung nút "Khôi phục phiên bản này" trực tiếp trong từng bản ghi lịch sử tại trang Chi tiết thủ tục (`ProcedureApiDetail.tsx`), đồng bộ với `ProcedureVersionsModal.tsx`.
  - Hộp thoại khôi phục yêu cầu nhập đầy đủ: Lý do khôi phục, Số quyết định, Ngày hiệu lực mới theo hợp đồng API 71 (`POST /api/v1/procedure-manager/procedures/{id}/versions/{v}/rollback`).
  - Tự động làm mới dữ liệu chi tiết và danh sách phiên bản sau khi khôi phục thành công.
- **2. Tinh gọn & Chuẩn hóa Modal xác nhận xóa (`ConfirmDeleteModal.tsx`)**:
  - Tạo component dùng chung `ConfirmDeleteModal` có đầy đủ nút "Hủy bỏ" và "Xác nhận xóa" màu đỏ nổi bật (`bg-red-700 hover:bg-red-800`), kèm icon thùng rác và spinner khi đang xóa.
  - Tách biệt hoàn toàn biến `deleteBusy` và `deleteError` độc lập trong cả `ProcedureDraftWorkspace.tsx` và `ProcedureCategoriesView.tsx`. Khắc phục triệt để tình trạng xoay loading ở 2 nút cùng lúc ("Xác nhận xóa" và "Tải lên và tạo bản nháp").
  - Gỡ bỏ banner báo lỗi màu đỏ tràn viền thô kệch; sử dụng Sonner Toast và hiển thị lỗi inline ngay trong modal khi server trả 409 conflict.
  - Nội dung câu chữ xác nhận xóa được tinh gọn, tự nhiên, không bị nặng nề.
- **3. Cải tiến nút thao tác trên Thẻ & Bảng**:
  - Bổ sung icon `Trash` cho nút Xóa, hiệu ứng hover màu đỏ nhạt (`hover:bg-red-50 hover:text-red-700`), phân tách rõ ràng với nút "Chỉnh sửa".
- **4. Kiểm thử & Đảm bảo chất lượng**:
  - `npm run typecheck`: Đạt 0 lỗi.
  - `npm run lint`: Đạt 0 lỗi.
  - `npm run build`: Đạt 0 lỗi (Vite/Rollup hoàn tất thành công).
  - Playwright test: `npx playwright test tests/procedure-manager.spec.ts` đạt **20/20 tests** (100% pass trong 1.6m).

## Tích hợp Procedure Administration API 66–73 — 07/10/2026

- FE đã đối chiếu và tích hợp các contract mới từ Procedure Catalog BE; không sửa IAM hoặc backend.
- Màn chi tiết quản lý dùng `GET /api/v1/procedure-manager/procedures/{id}`, nên xem và chỉnh sửa được cả thủ tục đã ngừng công khai.
- Màn danh mục hỗ trợ tạo, sửa, xóa qua API quản trị; giữ lỗi 409 từ BE khi danh mục còn được sử dụng.
- Workspace PDF hỗ trợ xóa bản nháp có xác nhận qua `DELETE /api/v1/procedure-manager/drafts/{id}`.
- Lịch sử phiên bản hỗ trợ xem PDF nguồn bằng SAS có thời hạn và rollback có lý do, số quyết định, ngày hiệu lực. Không tự retry rollback khi chưa biết kết quả.
- Tab Biểu mẫu tìm và chọn dữ liệu thật từ proxy `GET /api/v1/procedure-manager/document-forms`; không còn yêu cầu nhập GUID thủ công. Endpoint BE trả mảng nên FE chưa dựng tổng trang giả.
- Client API, UI và mock-contract tests được cập nhật tại `src/lib/api/procedures.ts`, `src/pages/procedure-manager/` và `tests/`.
- Kiểm tra vừa chạy: `npm run typecheck`, `npm run lint`, `npm run build`, `git diff --check` đạt; Playwright `tests/procedure-manager.spec.ts` đạt 20/20. Build còn cảnh báo Zod annotation và chunk lớn như trước. Đây là kiểm thử mock HTTP, chưa smoke test API 66–73 trên môi trường deploy thật.
- `npm install` chỉ khôi phục 2 package TanStack Query đã có trong lockfile vào `node_modules`; npm vẫn báo 2 lỗ hổng high hiện hữu, chưa chạy audit fix ngoài phạm vi.
- Chưa commit/push. Bước tiếp theo: smoke test bằng tài khoản ProcedureManager sau khi backend mới được deploy, đặc biệt DocumentForm proxy, Blob SAS, xóa draft lỗi 503 và rollback mất phản hồi.

## Lời chào theo thời gian thực (Time-based Greetings) cho Admin, Procedure Manager và Manager — 07/10/2026

- **1. Helper dùng chung `getGreeting` (`src/lib/utils.ts`)**:
  - Export hàm chuẩn `getGreeting(): string` tính theo giờ trong ngày:
    - 05:00 - 11:59: "Chào buổi sáng"
    - 12:00 - 17:59: "Chào buổi chiều"
    - 18:00 - 04:59: "Chào buổi tối"
  - Tái sử dụng đồng bộ cho toàn bộ các phân hệ (`officer`, `admin`, `procedure-manager`, `manager`). Gỡ bỏ hàm cục bộ trùng lặp trong `OfficerDashboardView.tsx`.
- **2. Phân hệ Quản trị hệ thống (`admin`)**:
  - Tại `AdminPage.tsx`: Hiển thị `{getGreeting()}, Quản trị viên {adminName}` ngay dưới tiêu đề `Trung tâm quản trị` ở chế độ `overview`.
  - Giữ nguyên thẻ `<h1>{meta.title}</h1>` để đảm bảo 100% tương thích với Playwright test assertions (`landing.spec.ts`).
- **3. Phân hệ Quản lý thủ tục (`procedure-manager`)**:
  - Tại `ProcedureManagerPage.tsx`: Hiển thị `{getGreeting()}, Chuyên viên {procedureManagerName}` ở chế độ `dashboard` ("Tổng quan Quản lý Thủ tục").
  - Đưa nút "Thêm thủ tục" ra thanh tác vụ header chung khi xem overview để chuyên viên có thể tạo mới thủ tục trực tiếp từ Dashboard.
- **4. Phân hệ Quản lý Điều hành (`manager`)**:
  - Tại `ManagerPage.tsx`: Hiển thị `{getGreeting()}, Lãnh đạo {managerName}` ngay dưới tiêu đề `Thống kê Hồ sơ Hành chính` ở trang tổng quan mặc định `stats-dossiers`.
  - Giữ nguyên heading exact `Thống kê Hồ sơ Hành chính` để pass toàn bộ `tests/manager.spec.ts`.
- **5. Kiểm thử & Đảm bảo chất lượng**:
  - `npm run typecheck`: Đạt 0 lỗi.
  - `npm run lint`: Đạt 0 lỗi.
  - Playwright E2E: Toàn bộ 38/38 ca kiểm thử liên quan (`landing.spec.ts`, `manager.spec.ts`, `officer.spec.ts`, `procedure-manager.spec.ts`) đều PASS 100%.

## Tối ưu hóa UI/UX, Module hóa CitizenPage và Route Code-Splitting — 07/10/2026

- **1. Trình soạn thảo thủ tục & Đối soát bản nháp (`procedure-manager`)**:
  - Tại `ProcedureApiEditor.tsx`: Thêm badge đếm số lượng bản ghi thực tế trên từng tab (Thành phần hồ sơ, Quy trình, Thời hạn/Lệ phí, Biểu mẫu, Căn cứ pháp lý). Thêm thanh điều hướng chân trang (`← Phần trước` và `Phần tiếp theo →`) giúp chuyển tab mượt mà mà không phải cuộn ngược lên đầu trang.
  - Tại `ProcedureDraftWorkspace.tsx`: Cố định thanh thao tác bản nháp (`sticky bottom-2`) chứa checkbox xác nhận đối soát, nút "Lưu bản nháp" và "Xác nhận xuất bản", giúp luôn hiển thị rõ ràng trong tầm nhìn khi cuộn xem form dữ liệu dài.
- **2. Đồng bộ danh tính Cán bộ Tiếp nhận Một cửa (`officer`)**:
  - Gỡ bỏ hoàn toàn tên cán bộ hardcode tĩnh "Cán bộ Lê Thu Hà" ở tất cả các màn hình: Dashboard chào mừng (`OfficerDashboardView`), Thẻ ca trực quầy Một cửa, Quầy tiếp nhận cấp biên nhận (`OfficerReceiptWorkspaceView`), Workspace nhận xét/đối chiếu (`OfficerReviewWorkspaceView`) và Timeline/Audit Logs (`OfficerPage`).
  - Lấy thông tin họ tên động qua `useUserProfile()` và `useAuthStore` (fallback an toàn theo tài khoản).
  - Cập nhật test `tests/officer.spec.ts` để kiểm tra regex tên cán bộ linh hoạt.
- **3. Tái cấu trúc module hóa phân hệ Công dân (`citizen`)**:
  - Tách nhỏ file nguyên khối `CitizenPage.tsx` (từ 2.010 dòng xuống còn ~350 dòng).
  - Tạo cấu trúc thư mục chuẩn `src/pages/citizen/views/`:
    - `CitizenDashboardView.tsx`: Thẻ chỉ số, biểu đồ xu hướng tra cứu & lưu ý Một cửa.
    - `CitizenDossiersView.tsx`: Bảng danh sách & bộ lọc trạng thái hồ sơ.
    - `CitizenDossierDetailView.tsx`: Chi tiết hồ sơ, thanh trạng thái & bảng checklist.
    - `CitizenNotificationsView.tsx`: Hộp thư thông báo tiến độ.
    - `CitizenQrCodeView.tsx`: Khu vực hiển thị mã QR hồ sơ điện tử đã duyệt.
    - `CitizenFeedbackView.tsx`: Đánh giá dịch vụ & khảo sát sự hài lòng.
    - `CitizenProfileView.tsx`: Form thông tin cá nhân & định danh công dân.
  - Tách file kiểu dữ liệu và mock data dùng chung sang `src/pages/citizen/types.ts`.
- **4. Hiệu năng & Route Code-Splitting (`performance`)**:
  - Tại `src/app/App.tsx`: Chuyển 5 phân hệ nội bộ (`AdminPage`, `CitizenPage`, `OfficerPage`, `ProcedureManagerPage`, `ManagerPage`) sang `React.lazy()` và bọc trong `<Suspense fallback={<WorkspaceLoadingFallback />}>`. Giúp người dùng/khách vãng lai vào Trang chủ `/` hoặc Tra cứu `/thu-tuc` không bị tải trước hàng trăm KB mã nguồn của các phân hệ quản trị.
  - Tại `vite.config.ts`: Cấu hình `manualChunks` tách riêng `react-vendor`, `charts` (Recharts) và `icons` (Phosphor/Lucide).
- **Commits & Push**:
  - Đã chia thành 4 commits theo đúng hạng mục và đẩy thành công lên `origin/main`:
    1. `190c1b8`: `feat(procedure-manager): enhance editor tab navigation with count badges and sticky action bar`
    2. `bd35dbf`: `feat(officer): bind dynamic officer identity from user profile and auth store`
    3. `d6a3e80`: `refactor(citizen): modularize CitizenPage into dedicated view components`
    4. `65d671a`: `perf(app): implement route code-splitting with React.lazy and manualChunks`
  - Đã kiểm tra trạng thái remote đồng bộ, không sửa BE.

## Setup nền tảng FE — 06/10/2026

- `AGENTS.md` yêu cầu đọc `docs/FRONTEND_SETUP.md` trước mọi thay đổi form, dữ liệu API/cache hoặc component UI, để các phiên AI sau tái sử dụng đúng ba nền tảng đã setup.
- Đã vận dụng TanStack Query vào ba luồng Catalog công khai: Trang chủ, danh sách thủ tục và chi tiết thủ tục. Query key phân biệt danh mục, từ khóa, lĩnh vực, trang và ID; điều hướng quay lại dùng cache trong RAM thay vì luôn tải lại.
- Tìm kiếm ở danh sách vẫn debounce 350 ms, chuyển tiếp AbortSignal xuống Axios và hủy request cũ khi bộ lọc đổi. Lỗi API tiếp tục dùng thông báo tiếng Việt hiện có; nút Thử lại gọi refetch. Không cache dữ liệu hồ sơ tiền kiểm hoặc thay đổi quyền phía client.
- Kiểm tra lần này: typecheck, lint, build và diff check đạt. Playwright `landing.spec.ts` in **14/14 pass**, sau đó vẫn treo khi đóng runner/web server nên đã dừng Ctrl+C; không coi là exit code 0. Cảnh báo Zod annotation và bundle lớn vẫn còn như trước.
- Cài TanStack Query; bọc App bằng QueryProvider, staleTime 30 giây/gcTime 5 phút, retry một lần cho mạng/5xx, không retry mutation hoặc 4xx/validation. Cache RAM xóa khi đổi/mất danh tính.
- Thêm hook `useProcedureCategories` sử dụng Catalog service + signal hiện có, sẵn dùng cho màn hình mới; chưa migrate các màn hình dùng `useProcedureQuery`. React Hook Form/Zod/resolvers đã có, tiếp tục sử dụng.
- Thêm `components.json` cho shadcn/Vite/Tailwind v4, alias tới components/ui và cn hiện có; semantic color tokens WardMate. `shadcn info` xác nhận cấu hình hợp lệ; chưa nhập bộ component shadcn hoặc ghi đè UI hiện tại.
- Hướng dẫn tại `docs/FRONTEND_SETUP.md`. Không sửa BE, chưa commit/push/deploy.
- Typecheck, lint, build và diff check đạt. Build còn cảnh báo annotation Zod và bundle lớn. npm báo 2 lỗ hổng mức high, chưa xử lý audit diện rộng.
- Playwright nhóm jwt-client/design-system/landing: 28 ca đều in kết quả pass nhưng tiến trình treo ở bước kết thúc; đã dừng bằng Ctrl+C. Lần chạy lại ngoài sandbox thất bại với EPERM khi unlink `test-results/auth-core-mobile.png`. Không coi đây là bộ test có exit code 0; cần kiểm tra quyền/khóa file kết quả và vòng đời runner/webServer trên Windows. Không xác minh đăng nhập backend thật trong task này.

## Dọn dẹp mã nguồn và gỡ bỏ file/mock data không sử dụng — 06/10/2026

- Đã rà soát toàn bộ thư mục `src/pages/procedure-manager/` và xóa 10 file views mock cũ (mồ côi, không còn được import sau khi chuyển sang dùng API views):
  - `ProcedureListView.tsx`, `ProcedureDetailView.tsx`, `ProcedureWizardModal.tsx`, `ProcedureFormsView.tsx`, `ProcedureLegalView.tsx`, `ProcedureChecklistsView.tsx`, `ProcedureStepsView.tsx`, `ProcedureAiKnowledgeView.tsx`, `ProcedureAuditLogView.tsx`, `CitizenFormFillWorkspaceModal.tsx`.
- Xóa file dữ liệu mock tĩnh cũ không còn sử dụng: `src/data/mockProcedureManagerData.ts`.
- Rà soát toàn bộ các phân hệ UI khác ngoài Quản lý thủ tục:
  - Phân hệ Public: Xóa file dữ liệu giả cũ `src/data/mockPublicProcedures.ts` (đã thay bằng Catalog API) và component mồ côi `src/pages/public/components/ProcedureCasesAndChecklist.tsx` (đã thay bằng `ProcedureCasesView.tsx`).
  - Phân hệ Cán bộ tiếp nhận (`officer`), Quản trị hệ thống (`admin`), Quản lý (`manager`), Công dân (`citizen`), Xác thực (`auth`), Tài khoản (`account`): Kiểm tra toàn bộ imports, không còn file chết hoặc code debug/console sót lại.
- Giảm hơn 4.690 dòng code thừa và mock data, tối ưu dung lượng bundle.
- Đã chạy kiểm tra toàn diện hệ thống:
  - `npm run typecheck`: **0 lỗi**.
  - `npm run lint`: **0 cảnh báo / 0 lỗi**.
  - `npm run build`: **Build production thành công** (0 lỗi).
- Commits & push:
  - `4ed3f68`: `chore: remove unused legacy mock views and mock procedure manager data`
  - `e70025d`: `chore: remove unused mockPublicProcedures and unused ProcedureCasesAndChecklist`
  - Đã đẩy lên `origin/main`.

## Điều chỉnh dashboard và tìm kiếm theo phản hồi người dùng — 06/10/2026

- Điều chỉnh tiếp: bỏ ba card chỉ số “Biểu mẫu đang dùng”, “Biểu mẫu cần cập nhật”, “Văn bản pháp lý”; giữ Đang công khai/Bản nháp/Tạm ngừng. Dọn import icon và cập nhật kỳ vọng số card trong test hiện có. Không chạy test/lint/build cho thay đổi này theo yêu cầu người dùng; kết quả bên dưới thuộc lần sửa trước.
- Khôi phục `ProcedureDashboardView`: sáu thẻ chỉ số, mục cần chú ý, thủ tục cập nhật gần đây và khu vực biểu mẫu/pháp lý như bố cục cũ. Dashboard không còn bảng tìm kiếm/phân trang trùng danh sách thủ tục. Chỉ số đang công khai/tạm ngừng và cập nhật gần đây lấy API; phần chưa có nguồn ghi chưa có dữ liệu, không phục hồi mock.
- `ProceduresPage` chờ 350 ms khi tìm với từ khóa, hủy timer/request cũ khi điều kiện thay đổi. URL vẫn giữ từ khóa/lĩnh vực/trang; không thêm dependency.
- Người dùng báo các API 1, 3–5, 7–9, 11–16 OK; 6 và 10 chưa test; 17 và 18 chưa test được. API 2 được yêu cầu giảm request khi gõ. Đây là phản hồi kiểm tra của người dùng, không thay cho bằng chứng tự chạy môi trường thật của agent.
- Người dùng đã hiểu và xác nhận BE cần API detail riêng cho quản lý để xem/sửa inactive; không sửa BE trong task này.
- Kiểm tra lần này: typecheck/lint/build và diff check đạt (còn cảnh báo build Zod/bundle). Playwright 32/33 đạt lần đầu, một ca detail timeout khi tải trang; chạy lại riêng toàn bộ nhóm detail đạt 3/3, không đổi code/test để bỏ qua lỗi. Hai ca mới xác nhận gõ nhanh chỉ gọi một request từ khóa và dashboard không có bảng danh sách đều đạt. Đã xem ảnh dashboard mobile.
- Đã chia 4 commits theo yêu cầu:
  1. `ddd5e92` `feat(api): integrate procedure catalog client and proxy configuration`
  2. `b5e1e0e` `feat(public): connect home, procedure lookup, and detail pages to catalog API`
  3. `accb123` `feat(procedure-manager): add workspace, api list, detail, and editor flows`
  4. `9200a9c` `test: update playwright suites and add procedure mock fixtures`
- Commit thứ 5 (tài liệu bàn giao, API guide, backend gaps & progress) sẵn sàng gửi cùng khi push.

## Tích hợp Procedure Catalog API — 06/10/2026

- Theo quyết định người dùng: chỉ sửa FE, không sửa backend; báo các hợp đồng thiếu để BE bổ sung. Chưa commit/push/deploy. Giữ nguyên thay đổi có sẵn của người dùng ở `.env.example` và `vite.config.ts`.
- Thêm `src/lib/api/procedures.ts` với validation response, dùng HTTP/auth client chung, public không gửi JWT. Kết nối 18 endpoint: danh mục, public list/detail/source; manager list/create/update/status/versions/publish; draft preview/upload/list/detail/source/save/retry/publish. Không fallback dữ liệu giả khi API lỗi.
- Manager dùng các component `ProcedureApiList/Detail/Editor`, `ProcedureDraftWorkspace`; giữ layout/sidebar/component chung. PDF có polling, revision, lỗi 409 giữ nội dung đang nhập, save trước publish, đối chiếu trạng thái nếu mất response publish. SAS chỉ giữ trong RAM và hết hạn theo response. Không tự nhập hoặc xuất bản PDF mẫu.
- Trang chủ, tra cứu công khai, chi tiết và tra cứu trong tài khoản công dân lấy Catalog. Bỏ đoán checklist từ tên thủ tục; hồ sơ cũ thiếu checklist không còn báo đủ điều kiện/nộp. CTA Catalog không tạo hồ sơ localStorage rồi báo thành công. Các phân hệ hồ sơ công dân khác vẫn là phạm vi chưa tích hợp, không được coi toàn bộ ứng dụng đã dùng dữ liệu thật.
- Không hiển thị số liệu giả trên dashboard/sidebar quản lý. Các mục kho DOCX/e-form, AI, audit và kho pháp lý độc lập báo chưa có kết nối. Inactive vẫn xem lịch sử/đổi trạng thái, chưa sửa được vì BE thiếu detail riêng.
- Thêm rewrite Catalog vào `vercel.json` trước IAM; chưa xác minh deployment. Hướng dẫn từng API: `docs/PROCEDURE_API_USER_GUIDE.md`. Danh sách gửi BE: `docs/PROCEDURE_BACKEND_GAPS.md`. Bản đối chiếu ban đầu: `docs/IMPLEMENT_PROCEDURE_API.md`.
- Kiểm tra API public thật trên Azure: health/categories/list/detail đều 200; hiện chỉ có seed `DEMO-KET-HON` ghi rõ dữ liệu minh họa. Đây là response server, chưa phải dữ liệu nghiệp vụ đã đối soát. Chưa xác minh manager/upload/Blob/AIOCR/publish thật vì chưa có phiên tài khoản thử có quyền.
- PDF khai sinh mẫu 11 trang đã đọc ở bước chuẩn bị. Các nhóm “Trường hợp 1–4” không tự coi là lựa chọn loại trừ nhau; ghi chú chung, điều kiện và số lượng chưa xác định cần BE bổ sung. Không đưa PDF gốc vào repo.
- Kiểm tra vừa chạy: `npm run typecheck`, `npm run lint`, `npm run build` đạt; build còn cảnh báo annotation Zod/bundle lớn. Playwright Edge: 33/33 đạt trong `procedure-manager`, `procedure-detail`, `landing`, `citizen-application-wizard` (mock HTTP, không phải manager thật). Đã xem ảnh detail mobile và editor mobile, kiểm tra tràn ngang/focus trong test. `git diff --check` đạt.
- Bước tiếp: dùng tài khoản manager/admin trên môi trường được phép để smoke test hướng dẫn từng API; xác minh phiên bản Catalog deploy, JWT liên dịch vụ, Blob và extraction. BE cần ưu tiên detail inactive, mô hình ghi chú/nhóm hồ sơ và nháp thủ công không PDF.

## Tinh gọn Giao diện Công dân: Gỡ bỏ Phân hệ "Chuẩn bị hồ sơ" dư thừa — 03/10/2026

- **Yêu cầu & Triển khai**:
  - Gỡ bỏ hoàn toàn nhánh menu Sidebar "Chuẩn bị hồ sơ" và 4 sub-view tĩnh không cần thiết (`prep_checklist`, `prep_documents`, `prep_forms`, `prep_pdfs`) trong [`CitizenPage.tsx`](file:///d:/frontend/src/pages/citizen/CitizenPage.tsx).
  - Lý do: Toàn bộ quy trình chuẩn bị hồ sơ thực tế (kèm checklist, kéo thả đính kèm giấy tờ, soạn thảo biểu mẫu trực tuyến tự động điền VNeID, theo dõi tiến độ và nộp tiền kiểm) đã được tích hợp tập trung, đầy đủ theo từng hồ sơ tại view Chi tiết hồ sơ ([`DossierChecklistView.tsx`](file:///d:/frontend/src/pages/citizen/components/DossierChecklistView.tsx)). Các trang `prep_*` trước đây chỉ là mock data rời rạc, làm phân tán trải nghiệm người dùng và gây rối sidebar.
  - Cập nhật các shortcut tại Dashboard sang các mục hữu ích: "Hồ sơ bản nháp", "Hồ sơ của tôi".
  - Chuyển hướng nút hành động ở bảng Tra cứu thủ tục thành "Bắt đầu làm hồ sơ" đưa đến danh sách hồ sơ.
  - Dọn dẹp các icons và mock data không còn sử dụng (`citizenDocuments`, `citizenForms`, `citizenPdfs`).
- **Kiểm tra & Git**:
  - `npm run typecheck`: Đạt 0 lỗi.
  - Commit: `fe22ca2` (`refactor(citizen): remove redundant profile prep module and streamline dossier detail flow`).
  - Đã push thành công lên `origin/main`.

## Tối ưu giao diện Cột Thao tác Danh sách Hồ sơ Công dân — 03/10/2026

- **Yêu cầu & Triển khai**:
  - Tinh chỉnh giao diện cột "Thao tác" trong bảng danh sách hồ sơ công dân ([`CitizenPage.tsx`](file:///d:/frontend/src/pages/citizen/CitizenPage.tsx)) theo phản hồi của người dùng.
  - Khắc phục triệt để tình trạng các nút bị so le, rớt dòng vỡ layout bằng cách áp dụng `whitespace-nowrap` và flex inline đồng nhất trên một hàng.
  - Bổ sung icon trực quan từ Phosphor Icons cho từng nút hành động (`Eye` cho Chi tiết, `NotePencil` cho Chỉnh sửa, `Star` cho Đánh giá, `QrCode` cho Mã QR).
  - Tối ưu màu sắc, padding, viền và hiệu ứng hover/active scale để cột thao tác trông thanh lịch, hiện đại và chuẩn chỉ hơn.
- **Kiểm tra**:
  - `npm run typecheck`: Đạt 0 lỗi.

## Vercel Web Analytics — 03/10/2026

- Theo yêu cầu người dùng, thêm `@vercel/analytics` 2.0.1 và `<Analytics />` từ `@vercel/analytics/react` tại root `src/main.tsx`, chỉ render trong build production. Cập nhật `package.json` và `package-lock.json`; không chỉnh BE/API/auth.
- Giữ Cloudflare Analytics hiện có: khi cả hai được bật, cả hai dịch vụ đều nhận số liệu. Không thêm custom events hay dữ liệu nghiệp vụ.
- Kiểm tra vừa chạy: `npm run build` (gồm TypeScript), `npm run lint`, `git diff --check` đạt. Build còn cảnh báo annotation Zod và bundle lớn. `npm audit --omit=dev` không phát hiện lỗ hổng; audit toàn bộ còn 1 cảnh báo high ở dependency dev `brace-expansion`, chưa sửa ngoài phạm vi.
- Người dùng yêu cầu commit/push ngày 03/10/2026; gom tích hợp Vercel Analytics, dependency và bàn giao trong một commit. Đối chiếu lịch sử Git và `origin/main` để xác định đồng bộ. Chưa xác minh deployment, request hoặc dashboard Analytics thật, chưa chạy Playwright.
- Kích hoạt: Vercel → Web Analytics/Analytics → chọn project `wardmate-frontend` → Enable; sau đó deploy bản code mới. Không cần token/biến môi trường cho Vercel Analytics. Mở website, chuyển vài trang và kiểm tra dữ liệu trên dashboard sau vài phút. Tài liệu: https://vercel.com/docs/analytics/quickstart.

## Cloudflare Web Analytics — 03/10/2026

- Đã chuẩn bị tích hợp FE tại `src/main.tsx`: nạp beacon bất đồng bộ chỉ ở production có `VITE_CLOUDFLARE_WEB_ANALYTICS_TOKEN`; dev hoặc thiếu mã thì tắt. Không thêm dependency, không truy cập/chỉnh BE.
- `.env.example` có biến rỗng; hướng dẫn cấu hình và xác minh tại `docs/cloudflare-web-analytics.md`. Website người dùng cung cấp: https://wardmate-frontend.vercel.app/.
- Kiểm tra vừa chạy: `npm run build` (gồm TypeScript) và `npm run lint` đạt; build còn cảnh báo annotation Zod và bundle lớn. `git diff --check` đạt trước cập nhật tài liệu.
- Người dùng đã cung cấp mã site; lưu trong `.env.production.local` được Git ignore, không chép giá trị vào tài liệu/commit. Script dùng `type="module"` khớp snippet được cấp.
- Kiểm tra lại sau cấu hình: build (gồm TypeScript), lint và kiểm tra bundle có beacon cùng mã đã cấu hình đều đạt; `git check-ignore` xác nhận file cấu hình riêng bị bỏ qua. Build còn cảnh báo Zod/bundle lớn. Lệnh kiểm tra Node ban đầu lỗi quoting PowerShell, đã thay bằng kiểm tra PowerShell thành công.
- Chưa cấu hình Vercel, deploy, xác minh beacon/dashboard thật hoặc chạy Playwright. Không coi Analytics đã hoạt động production.
- Người dùng yêu cầu commit/push phần Analytics ngày 03/10/2026; gom code, cấu hình mẫu và hướng dẫn trong một commit. Kiểm tra lịch sử Git và `origin/main` để xác định trạng thái đồng bộ; không đưa `.env.production.local` vào Git.
- Tiếp theo: đặt `VITE_CLOUDFLARE_WEB_ANALYTICS_TOKEN` trong biến build Production của Vercel, deploy source FE mới và xác minh dữ liệu.

## FE-TASK-13, FE-TASK-14, FE-TASK-15 — Phân hệ Chuẩn bị Hồ sơ Tiền kiểm & Biểu mẫu Thông minh — 03/10/2026

- **Yêu cầu & Triển khai theo định hướng trợ lý tiền kiểm**:
  - Tinh gọn trải nghiệm người dân: chuẩn bị hồ sơ trực tiếp ngay trên bảng Checklist của từng thủ tục, không tách trang rườm rà.
  1. **Tích hợp Kéo thả & Đính kèm Tệp từng dòng Giấy tờ (FE-TASK-15 & FE-TASK-09)**:
     - Nâng cấp [`DossierChecklistView.tsx`](file:///d:/frontend/src/pages/citizen/components/DossierChecklistView.tsx): mỗi dòng giấy tờ đều có nút **"Đính kèm tệp"** (hỗ trợ ảnh CCCD 2 mặt, PDF scan, tờ khai có sẵn).
     - Khi tải lên thành công: hiển thị tên file, icon loại file, nút xem trước mắt biếc 👁️ và nút xóa 🗑️.
     - **Tự động tick xanh ✅** và cập nhật % tiến độ chuẩn bị hồ sơ theo thời gian thực; tự động lưu vào `localStorage`.
  2. **Trình Soạn thảo Biểu mẫu Trực tuyến & Auto-fill từ Hồ sơ cá nhân (FE-TASK-14)**:
     - Nâng cấp [`FormDocxEditorModal.tsx`](file:///d:/frontend/src/pages/citizen/components/FormDocxEditorModal.tsx):
       - Form khi mở là form chuẩn khổ A4 theo Nghị định 30/2020/NĐ-CP.
       - Nút **"Tự động điền từ Hồ sơ cá nhân / VNeID"**: tự động trích xuất Họ tên, CCCD (12 số), Ngày sinh, Giới tính, Địa chỉ thường trú/tạm trú, SĐT từ `userProfile` (API `/api/v1/users/me/profile`) điền vào đúng các vị trí tương ứng trên mẫu đơn.
       - Hỗ trợ lưu trực tuyến, in ấn và tải về định dạng `.docx`.
  3. **Quy trình Nộp tiền kiểm tinh gọn (FE-TASK-13)**:
     - Sau khi người dân chuẩn bị đủ giấy tờ (hoặc tự tin đã chuẩn bị xong), bấm **"Nộp tiền kiểm ngay"** để gửi hồ sơ vào hàng đợi chờ Cán bộ Một cửa tiếp nhận và phản hồi ghi chú/nhận xét.
  4. **Tối giản hóa giao diện (Minimalist UI) & Dọn dẹp mã nguồn**:
     - Lược bỏ các đoạn text/subtext rườm rà, giải thích thừa thãi ở tiêu đề bảng, thanh tiến độ và thanh hành động.
     - Thu gọn tiêu đề các cột bảng giấy tờ (`Đạt`, `STT`, `Tên giấy tờ`, `Số lượng`, `Yêu cầu`, `Thao tác`).
     - Đã dọn dẹp và xóa hoàn toàn các file mồ côi không dùng tới: `CitizenDossierWizardView.tsx`, toàn bộ thư mục `components/wizard/`, `components/form-renderer/`, `DocumentDropzoneUploader.tsx`, và `types/formSchema.ts`.
- **Kiểm tra**:
  - `npm run typecheck`: Đạt 100% (0 lỗi).
  - `npm run lint`: Đạt 100% (0 lỗi/cảnh báo).
  - `npm run build`: Đạt 100% (Build production thành công trong 24.01s).
  - Playwright test: [`tests/citizen-application-wizard.spec.ts`](file:///d:/frontend/tests/citizen-application-wizard.spec.ts) đạt 1/1 test (100% pass trong 19.5s).

## Hiển thị danh mục giấy tờ cần chuẩn bị & tải mẫu (không có checkbox) ở Chi tiết thủ tục — 02/10/2026

- **Yêu cầu người dùng**:
  - Tại trang Chi tiết thủ tục công khai (`ProcedureDetailPage`): vẫn hiển thị đầy đủ checklist danh mục giấy tờ cần thiết theo từng trường hợp để mọi người đọc, tra cứu và tải mẫu văn bản (`.docx`), nhưng **không có các ô checkbox tự kiểm tra** (checkbox chỉ dành cho khu vực quản lý hồ sơ riêng của người dân).
- **Hiện trạng & Triển khai**:
  - [`src/pages/public/components/ProcedureCasesView.tsx`](file:///d:/frontend/src/pages/public/components/ProcedureCasesView.tsx):
    - Tiếp nhận `checklist` và lọc danh mục giấy tờ tự động theo `caseCode` của từng trường hợp.
    - Phân tách rõ ràng thành 2 nhóm: **Giấy tờ, tài liệu phải nộp** và **Giấy tờ phải xuất trình**.
    - Hiển thị bảng tra cứu giấy tờ trực quan: STT, Tên giấy tờ & Ghi chú, Số lượng & Loại bản sao (bản chính, bản sao, bản chụp), Yêu cầu bắt buộc/tùy chọn.
    - Cung cấp nút **"Tải mẫu"** (Download template) đối với các mục có biểu mẫu / tờ khai.
    - **Hoàn toàn không có checkbox**, giữ trải nghiệm đọc và tra cứu công khai trong sáng, không gây nhầm lẫn với trạng thái chuẩn bị hồ sơ cá nhân.
  - [`src/pages/public/ProcedureDetailPage.tsx`](file:///d:/frontend/src/pages/public/ProcedureDetailPage.tsx):
    - Truyền `content.checklist` vào `ProcedureCasesView`.
    - Cập nhật nhãn mục lục thành *"Thành phần hồ sơ & Quy trình"*.
  - [`tests/landing.spec.ts`](file:///d:/frontend/tests/landing.spec.ts):
    - Cập nhật test 16 xác minh danh mục giấy tờ xuất hiện, có nút Tải mẫu và khẳng định 0 checkbox (`toHaveCount(0)`).
- **Kiểm tra**:
  - `npm run typecheck`: Đạt 100% (0 lỗi).
  - `npm run lint`: Đạt 100% (0 lỗi).
  - `npm run build`: Đạt 100% (Build thành công toàn bộ bundle).
  - `npx playwright test tests/landing.spec.ts`: Đạt 16/16 tests (100%).

## Tối ưu giao diện Đăng nhập / Đăng ký đơn gọn & Fit trọn màn hình không bị scroll — 02/10/2026

- **Yêu cầu người dùng**:
  - Bỏ phần thông tin / quyền lợi bên trái (`auth-intro`) trên trang đăng nhập và đăng ký.
  - Chỉ giữ 1 form login/register đơn gọn, căn giữa màn hình, giữ lại nút quay lại trang chủ.
  - Tối ưu layout đứng vừa vặn với chiều cao màn hình (fit viewport height 100vh), không bị cuộn xuống.
- **Hiện trạng & Triển khai**:
  - [`src/components/layout/MainLayout.tsx`](file:///d:/frontend/src/components/layout/MainLayout.tsx):
    - Ẩn phần `<footer>` lớn nhiều hàng đối với các trang xác thực (`/dang-nhap`, `/dang-ky`, `/quen-mat-khau`, `/dat-lai-mat-khau`) để không đẩy chiều cao trang vượt quá viewport.
  - [`src/styles/globals.css`](file:///d:/frontend/src/styles/globals.css):
    - Tối ưu padding của `.auth-page` (`py-4 sm:py-6`) và chiều cao ô nhập liệu `.auth-input` (`min-h-11 sm:min-h-12`).
  - [`src/pages/auth/AuthPage.tsx`](file:///d:/frontend/src/pages/auth/AuthPage.tsx):
    - Căn giữa form card toàn màn hình (`flex min-h-[calc(100vh-135px)] items-center justify-center py-2 sm:py-4`) với bề rộng chuẩn `max-w-[480px]`.
    - Giữ nút "Quay lại trang chủ" trang nhã ngay phía trên Card.
    - Giữ trọn vẹn toàn bộ validation Zod, xử lý lỗi API và animation chuyển tiếp mượt mà giữa đăng nhập và đăng ký.
- **Kiểm tra**:
  - `npm run typecheck`: Đạt 100% (0 lỗi).
  - `npm run lint`: Đạt 100% (0 cảnh báo/lỗi).
  - `npm run build`: Đạt 100% (Build thành công).
  - `npx playwright test tests/landing.spec.ts`: Đạt 16/16 tests (100%).

## Chuyển Checklist sang Hồ sơ bản nháp & Tích hợp E-Form Editor chuẩn A4 — 02/10/2026

- **Yêu cầu người dùng**:
  1. Gỡ bỏ khối checklist giấy tờ ở trang xem chi tiết thủ tục công khai (`ProcedureDetailPage`).
  2. Bổ sung nút **"Bắt đầu làm thủ tục"** trên `ProcedureDetailPage`. Khi người dùng đã đăng nhập nhấn vào, thủ tục được chọn sẽ tự động lưu vào danh sách "Hồ sơ của tôi" (Bản nháp - Draft). Nếu chưa đăng nhập, chuyển hướng đến trang Đăng nhập kèm link quay lại an toàn.
  3. Loại bỏ nút / hộp nhắc dư thừa ở phần icon ngôi sao trong khối trường hợp thủ tục.
  4. Khi nhấn **Chi tiết** một hồ sơ, chuyển sang **một trang/view riêng biệt (`CitizenDossierDetailView`)** rộng rãi toàn màn hình thay vì dùng Modal nhỏ để hiển thị đầy đủ thông tin hồ sơ, ghi chú và danh mục checklist giấy tờ.
  5. Ở từng mục biểu mẫu/tờ khai trong checklist, cung cấp 3 nút hành động:
     - 📥 **Tải mẫu (Download Form)**: Tải file mẫu văn bản `.docx`.
     - 👁️ **Xem trước (Preview Form)**: Mở modal xem trước trang biểu mẫu khổ A4 chuẩn thể thức hành chính Việt Nam.
     - ✏️ **Soạn thảo (Edit Form)**: Mở Trình soạn thảo văn bản trực tuyến (lấy cảm hứng từ [editdocx.net](https://editdocx.net/editor/?doc=builtin-demo)) với giao diện mô phỏng trang giấy A4, thanh công cụ căn lề, định dạng phông chữ, in đậm/nghiêng/gạch chân, tính năng tự động điền dữ liệu công dân (Đề án 06/VNeID) và xuất file/in ấn.
- **Hiện trạng & Triển khai**:
  - [`src/pages/public/components/ProcedureCasesView.tsx`](file:///d:/frontend/src/pages/public/components/ProcedureCasesView.tsx):
    - Tạo mới component hiển thị thông tin các trường hợp (Cases) và quy trình các bước thực hiện của thủ tục; loại bỏ bảng checklist giấy tờ công khai.
    - Tích hợp nút CTA "Bắt đầu làm thủ tục".
  - [`src/pages/public/ProcedureDetailPage.tsx`](file:///d:/frontend/src/pages/public/ProcedureDetailPage.tsx):
    - Thay thế `ProcedureCasesAndChecklist` bằng `ProcedureCasesView`.
    - Tích hợp nút "Bắt đầu làm thủ tục" ở Header banner, Sidebar và Footer banner.
    - Xử lý kiểm tra auth: nếu chưa đăng nhập → chuyển hướng an toàn đến `/dang-nhap?returnTo=...`; nếu đã đăng nhập → tạo bản nháp mới lưu vào `wardmate_citizen_drafts` (localStorage) và điều hướng vào `/citizen?section=dossiers_draft&dossierCode=...`.
  - [`src/pages/citizen/components/DossierChecklistView.tsx`](file:///d:/frontend/src/pages/citizen/components/DossierChecklistView.tsx):
    - Tạo mới component render bảng checklist giấy tờ chuẩn DVC (Giấy tờ phải nộp & Giấy tờ phải xuất trình, checkbox tự kiểm tra, thanh tiến độ %).
    - Cột thao tác biểu mẫu tích hợp 3 nút: **Tải mẫu**, **Xem trước**, **Soạn thảo**.
  - [`src/pages/citizen/components/FormPreviewModal.tsx`](file:///d:/frontend/src/pages/citizen/components/FormPreviewModal.tsx):
    - Modal xem trước tờ khai định dạng trang A4 tiêu chuẩn (Quốc hiệu, Tiêu ngữ, Kính gửi, nội dung kê khai, phần chữ ký).
  - [`src/pages/citizen/components/FormDocxEditorModal.tsx`](file:///d:/frontend/src/pages/citizen/components/FormDocxEditorModal.tsx):
    - Trình soạn thảo văn bản E-Form online lấy cảm hứng từ editdocx.net: Toolbar chuyên nghiệp (phông chữ, cỡ chữ, in đậm/nghiêng/gạch chân, căn trái/giữa/phải/đều, zoom phóng to/thu nhỏ, nút lưu, tải .docx, in văn bản, tự động điền thông tin định danh công dân).
  - [`src/pages/citizen/CitizenPage.tsx`](file:///d:/frontend/src/pages/citizen/CitizenPage.tsx):
    - Mở rộng kiểu dữ liệu `CitizenDossier` hỗ trợ `cases` và `checklist`.
    - Đồng bộ `dossiers` với `localStorage` để đón ngay bản nháp vừa tạo từ trang chi tiết thủ tục.
    - Tích hợp nút "Chi tiết" trên bảng hồ sơ để mở Modal chi tiết hồ sơ nháp & checklist, kết nối trơn tru với `FormPreviewModal` và `FormDocxEditorModal`.
- **Kiểm tra**:
  - `npm run typecheck`: Đạt 100% (0 lỗi).
  - `npm run lint`: Đạt 100% (0 lỗi).
  - `npm run build`: Đạt 100% (Build thành công toàn bộ bundle).

## Tích hợp API Hồ sơ cá nhân thật cho các vai trò Cán bộ, Quản lý, Quản lý thủ tục — 02/10/2026

- **Yêu cầu**: Xóa bỏ dữ liệu mock hardcoded tại tab "Hồ sơ cá nhân" của Cán bộ Một cửa (`OfficerProfileView`), Quản lý Điều hành (`ManagerProfileView`), Quản lý Thủ tục (`ProcedureProfileView`). Kết nối trực tiếp vào API `GET /api/v1/users/me` và `PUT /api/v1/users/me/profile`.
- **Hiện trạng & Triển khai**:
  - Dữ liệu tài khoản đăng nhập hiện tại được cung cấp qua `useUserProfile()` và `useAuthStore()` (đã bao gồm `user.username`, `user.email`, `user.roles`, `profile` từ `/api/v1/users/me`).
  - [`src/pages/manager/views/ManagerProfileView.tsx`](file:///d:/frontend/src/pages/manager/views/ManagerProfileView.tsx):
    - Xóa bỏ mock tĩnh `Nguyễn Thế Hùng`.
    - Kết nối với `useUserProfile()`, form chỉnh sửa họ tên, CCCD, SĐT, giới tính, ngày sinh, địa chỉ thường trú/tạm trú.
    - Gọi API `updateMyProfile(payload)` (`PUT /api/v1/users/me/profile`) khi lưu và refetch tự động cập nhật context.
  - [`src/pages/officer/OfficerProfileView.tsx`](file:///d:/frontend/src/pages/officer/OfficerProfileView.tsx):
    - Xóa bỏ mock tĩnh `Lê Thu Hà`.
    - Bổ sung nút "Chỉnh sửa" mở form cập nhật thông tin cá nhân của cán bộ.
    - Tích hợp `updateMyProfile` và hiển thị thông tin thực tế từ `user` và `profile`.
  - [`src/pages/procedure-manager/ProcedureProfileView.tsx`](file:///d:/frontend/src/pages/procedure-manager/ProcedureProfileView.tsx):
    - Xóa bỏ mock tĩnh `Lê Hoàng Nam`.
    - Bổ sung form cập nhật hồ sơ cá nhân và hiển thị chính xác email, username, vai trò hệ thống của tài khoản đang đăng nhập.
- **Kiểm tra**:
  - `npm run typecheck`: Đạt 100% (0 lỗi).
  - `npm run lint`: Đạt 100% (0 lỗi).
  - `npx playwright test tests/manager.spec.ts`: Đạt 4/4 tests (100%).

## Tích hợp API Quản lý Hồ sơ Công dân cho Quản lý (Manager) — 02/10/2026


- **Yêu cầu**: Tích hợp nhóm API AdminProfiles (`/api/v1/users/{userId}/profile`) và Accounts (`/api/v1/accounts`) vào phân hệ Quản lý Điều hành (`ManagerPage` → `ManagerProfilesView`), xóa bỏ dữ liệu mock, tải và thao tác trực tiếp với dữ liệu thật từ máy chủ. Giữ nguyên tối đa cấu trúc UI hiện tại.
- **Hiện trạng & Giải pháp API**:
  - Backend IAM phân tách: `GET /api/v1/accounts` trả về danh sách tài khoản phân trang, và nhóm `GET / POST / PUT / DELETE /api/v1/users/{userId}/profile` quản lý hồ sơ theo từng `userId` (yêu cầu quyền `iam.manage`).
  - Giải pháp Frontend:
    1. Khi vào tab "Hồ sơ công dân", gọi `getAccounts(1, 50)` để lấy danh sách tài khoản.
    2. Song song fetch chi tiết hồ sơ `getAdminProfile(userId)` của từng người dùng để hiển thị đầy đủ họ tên, CCCD, ngày sinh, SĐT, giới tính, địa chỉ.
    3. Cập nhật hồ sơ bằng `updateAdminProfile(userId, data)` và xóa hồ sơ bằng `deleteAdminProfile(userId)`.
- **Triển khai**:
  - [`src/lib/api/index.ts`](file:///d:/frontend/src/lib/api/index.ts): Thêm 4 hàm API admin profiles: `getAdminProfile`, `createAdminProfile`, `updateAdminProfile`, `deleteAdminProfile`.
  - [`src/pages/manager/types.ts`](file:///d:/frontend/src/pages/manager/types.ts): Mở rộng `ManagerProfileItem` thêm các trường tài khoản `userId`, `username`, `email`, `isActive`.
  - [`src/pages/manager/mockData.ts`](file:///d:/frontend/src/pages/manager/mockData.ts): Xóa bỏ mảng mock `initialManagerProfiles`, chuyển thành mảng rỗng sẵn sàng đón dữ liệu API.
  - [`src/pages/manager/ManagerPage.tsx`](file:///d:/frontend/src/pages/manager/ManagerPage.tsx):
    - Tích hợp `fetchCitizenProfiles` gọi `getAccounts` và `getAdminProfile` song song qua `Promise.allSettled`.
    - Tích hợp `handleSaveProfile` gọi `updateAdminProfile(userId, payload)` với toast thông báo và cập nhật state tối ưu.
    - Tích hợp `handleDeleteProfile` gọi `deleteAdminProfile(userId)`.
  - [`src/pages/manager/views/ManagerProfilesView.tsx`](file:///d:/frontend/src/pages/manager/views/ManagerProfilesView.tsx):
    - Bổ sung nút "Làm mới", icon spinner khi tải dữ liệu, thông báo lỗi inline có nút "Thử lại".
    - Bổ sung nút "Xóa hồ sơ" (thùng rác) với hộp thoại xác nhận an toàn trước khi gọi API xóa.
    - Nút submit modal có trạng thái loading (`isSubmitting`) vô hiệu hóa khi đang gửi request.
- **Kiểm tra**:
  - `npm run typecheck`: Đạt 100% (0 lỗi).
  - `npm run lint`: Đạt 100% (0 lỗi).
  - `npx playwright test tests/manager.spec.ts`: Đạt 4/4 tests (100%).

## Tích hợp API Accounts vào trang Admin — Người dùng hệ thống — 02/10/2026


- **Yêu cầu**: Trang Admin → mục "Người dùng hệ thống" đang dùng dữ liệu hardcoded (mock). Yêu cầu xoá mock và call API thật.
- **API backend** (`/api/v1/accounts`):
  - `GET /api/v1/accounts?page=1&pageSize=20` → phân trang danh sách tài khoản (`items[]`, `page`, `pageSize`, `total`).
  - `GET /api/v1/accounts/{userId}` → chi tiết một tài khoản.
  - `PUT /api/v1/accounts/{userId}/status` body `{ "isActive": boolean }` → kích hoạt hoặc tạm khóa, response 204.
- **Triển khai**:
  - [`src/lib/api/index.ts`](file:///e:/wardmate-frontend/src/lib/api/index.ts): Thêm type `AccountItem`, `AccountListResponse` và 3 functions `getAccounts`, `getAccount`, `updateAccountStatus`.
  - [`src/pages/admin/AdminPage.tsx`](file:///e:/wardmate-frontend/src/pages/admin/AdminPage.tsx): Xóa toàn bộ mock `const users = [...]`.
    - Thêm state `accountData`, `accountPage`, `accountLoading`, `accountError`, `togglingId`.
    - `fetchAccounts` dùng `useCallback`; tự động gọi khi vào section `users` qua `useEffect`.
    - `filteredAccounts` lọc theo `query` từ dữ liệu thật.
    - `handleToggleAccountStatus` gọi `PUT /api/v1/accounts/{id}/status`, cập nhật state optimistic và toast kết quả.
  - `UsersView` nâng cấp hoàn toàn:
    - **Skeleton loading** (5 hàng animate-pulse) khi đang tải.
    - **Banner lỗi** inline với nút "Thử lại" khi gọi API thất bại.
    - Bảng hiển thị tên đăng nhập, email, ngày tạo tài khoản (format `vi-VN`), badge trạng thái Hoạt động/Tạm khóa.
    - Nút **"Tạm khóa"** / **"Kích hoạt"** cho từng dòng; vô hiệu hóa khi đang xử lý (chống click chồng).
    - **Phân trang** Trước/Sau khi `total > pageSize`.
    - Nút "Tải lại" trên toolbar.
- **Kiểm tra**:
  - `npm run typecheck`: Đạt 100% (0 lỗi).
  - `npm run lint`: Đạt 100% (0 lỗi).
  - Chưa chạy E2E với tài khoản BE thật; auth và proxy qua Vite đã hoạt động ở các task trước.

## Validation Chặt Chẽ Form Cập Nhật Hồ Sơ Công Dân (Profile) — 02/10/2026

- **Yêu cầu & Triển khai**:
  - Triển khai bộ quy tắc validation toàn diện, chặt chẽ cho form cập nhật thông tin cá nhân của công dân theo contract API `PUT /api/v1/users/me/profile`.
  - Tạo module validation Zod: [src/lib/profileSchema.ts](file:///e:/wardmate-frontend/src/lib/profileSchema.ts):
    1. **Họ và tên (`fullName`)**: Bắt buộc; tối đa 100 ký tự; chỉ chấp nhận chữ cái tiếng Việt và khoảng trắng; yêu cầu ít nhất 2 từ (Họ và Tên).
    2. **Số CCCD / Mã định danh (`identityNumber`)**: Tùy chọn; nếu nhập phải gồm đúng 12 chữ số theo quy chuẩn Căn cước công dân gắn chip.
    3. **Số điện thoại di động (`phoneNumber`)**: Tùy chọn; nếu nhập phải đúng định dạng di động Việt Nam (10 số, bắt đầu bằng 03, 05, 07, 08, 09); tự động làm sạch ký tự phân tách (khoảng trắng, dấu chấm).
    4. **Ngày sinh (`dateOfBirth`)**: Tùy chọn; kiểm tra ngày lịch thực tế hợp lệ; không vượt quá ngày hiện tại (không ở tương lai, giới hạn native `max` date input); năm sinh từ 1900 trở lại đây.
    5. **Giới tính (`gender`)**: Chỉ chấp nhận `Nam`, `Nữ` hoặc `Khác`.
    6. **Nơi thường trú (`permanentAddress`)** & **Địa chỉ tạm trú (`temporaryAddress`)**: Tùy chọn; nếu nhập phải từ 5 đến 255 ký tự; tránh nhập ký tự rác.
  - Tối ưu trải nghiệm Form [src/pages/citizen/CitizenPage.tsx](file:///e:/wardmate-frontend/src/pages/citizen/CitizenPage.tsx):
    - Tự động chuẩn hóa dữ liệu trước khi gửi lên API (loại bỏ khoảng trắng thừa, format SĐT, chuyển trường rỗng thành `null`).
    - Báo lỗi inline chi tiết ngay dưới từng ô input có viền đỏ nổi bật (`role="alert"`, `aria-invalid`, `aria-describedby`), tự động xóa lỗi khi người dùng chỉnh sửa ô đó.
    - Tự động focus vào trường lỗi đầu tiên khi submit không hợp lệ.
    - Hỗ trợ map lỗi trực tiếp từ ProblemDetails 400 của máy chủ vào từng trường form.
    - Nút "Hủy chỉnh sửa" khôi phục lại dữ liệu gốc và xóa sạch lỗi đang hiển thị.
  - Viết bộ unit test validation [tests/profile-validation.spec.ts](file:///e:/wardmate-frontend/tests/profile-validation.spec.ts) bao quát 9 kịch bản kiểm thử các trường.
- **Kiểm tra**:
  - `npm run typecheck`: Đạt 100% (0 lỗi).
  - `npm run lint`: Đạt 100% (0 lỗi).
  - `npx playwright test tests/profile-validation.spec.ts`: Đạt 9/9 tests (100%).
  - `npm run build`: Đạt 100% (Vite production bundle thành công).

## FE-TASK-09 — Giao diện Các Trường hợp (Cases) & Checklist Giấy tờ — 02/10/2026

- **Yêu cầu & Triển khai**:
  - Tinh chỉnh giao diện hiển thị các tình huống/trường hợp (`Cases`) và danh mục giấy tờ yêu cầu (`Checklist`) chuẩn hóa hoàn toàn theo cấu trúc bảng biểu chính thức của Cổng Dịch vụ công Quốc gia ([dichvucong.gov.vn](https://dichvucong.gov.vn/)), đồng thời lược bỏ khối sơ đồ quy trình 3 bước lặp lại để giao diện cực kỳ trực quan, tập trung và dễ sử dụng nhất cho người dân.
  - Component [src/pages/public/components/ProcedureCasesAndChecklist.tsx](file:///d:/frontend/src/pages/public/components/ProcedureCasesAndChecklist.tsx):
    - **Thanh Tabs Trường hợp áp dụng (Cases)**: Tab bar tinh tế cho phép chuyển đổi tức thì giữa các trường hợp (ví dụ: *Đúng hạn*, *Quá hạn*, *Chưa kết hôn*...), kèm thẻ ghi chú điều kiện áp dụng ngay bên dưới.
    - **Cấu trúc 2 Bảng biểu chuẩn Cổng DVC**:
      1. **Bảng 1: Giấy tờ, tài liệu phải nộp** (Cơ quan lưu giữ vào hồ sơ).
      2. **Bảng 2: Giấy tờ phải xuất trình** (Đối chiếu xong trả lại người nộp).
    - **Các cột chuẩn hóa**:
      - **Tự kiểm**: Ô checkbox tương tác thông minh cho phép người dân tự rà soát xem mình đã có giấy tờ đó chưa.
      - **STT**: Đánh số thứ tự rõ ràng.
      - **Tên giấy tờ**: Tên văn bản kèm dòng ghi chú/hướng dẫn điều kiện cụ thể.
      - **Mẫu đơn, tờ khai**: Cung cấp nút tải về mẫu biểu (.doc/.docx/.pdf) tiện lợi.
      - **Số lượng (Bản chính/Bản sao)**: Quy định số lượng cụ thể và rõ loại bản chính, bản sao chứng thực hay bản chụp photo.
      - **Yêu cầu**: Huy hiệu rõ ràng `Bắt buộc` hoặc `Tùy chọn`.
    - **Thanh tiện ích tự kiểm tiến độ**: Tự động tính tỷ lệ % hoàn thiện và số lượng giấy tờ bắt buộc đã chuẩn bị (`x / y`) giúp người dân tự tin trước khi đến UBND.
    - **Ghi chú Đề án 06 / VNeID**: Nhắc nhở người dân các giấy tờ đã được tích hợp trên Cơ sở dữ liệu quốc gia về dân cư hoặc VNeID Mức 2 thì không phải nộp lại bản giấy.
- **Kiểm tra**:
  - `npm run typecheck`: Đạt 100% (0 lỗi).
  - `npm run lint`: Đạt 100% (0 lỗi/cảnh báo).
  - `npm run build`: Đạt 100% (Vite production bundle thành công).
  - Playwright test: Kiểm tra tab chuyển trường hợp, hiển thị 2 bảng nộp/xuất trình, tương tác checkbox và responsive không tràn ngang (390px, 768px, 1440px): Đạt 100%.


## Commit và push điều hướng/tài khoản — 02/10/2026


- Đã commit và push lên `origin/main`: `5b49dfe` (điều hướng theo role IAM) và `20173b8` (dropdown theo trang, logout chung, bỏ sidebar trùng và test). Đã xác minh remote main bằng `git ls-remote` trùng HEAD `20173b8` sau push.
- Tài liệu bàn giao và hợp đồng auth được gom vào commit tài liệu tiếp theo. Phiên commit/push không chạy lại test; kết quả kiểm tra trước commit được ghi ở các mục bên dưới. Không sửa BE, không force push.

## Tinh gọn dropdown theo trang và sidebar — 02/10/2026

- Người dùng xác nhận: citizen ở landing chỉ thấy liên kết Cổng công dân; trong Cổng công dân chỉ thấy “Về trang chủ”. Role nội bộ không có liên kết trang chủ; giữ workspace khác được cấp quyền và Đăng xuất. `UserDropdown.tsx` ẩn workspace đang mở, nhận diện cả alias tiếng Việt.
- Bỏ avatar/tên tài khoản và nút đăng xuất trùng ở chân sidebar Admin, Officer, Manager, Procedure Manager; xóa hook/props logout không còn dùng. Thao tác đăng xuất tập trung trong dropdown header.
- Kiểm tra mới: typecheck, lint, build, diff check đạt; **63/63 test đạt** gồm auth-session, JWT, design-system, landing, officer, manager và procedure-manager. Có ca citizen đi qua lại landing/cổng/alias và xác nhận từng role không còn sidebar logout hay liên kết trỏ chính workspace hiện tại. Auth dùng mock; không gọi lại IAM thật trong task này. Build còn cảnh báo chunk lớn/annotation Zod đã có.
- Cập nhật tài liệu auth. Code đã commit/push tại `20173b8`; không sửa BE.

## Dropdown tài khoản chung và trang mặc định công dân — 02/10/2026

- Theo yêu cầu mới: công dân đăng nhập mặc định về landing `/`, không tự vào `/citizen`. ReturnTo nội bộ cụ thể vẫn được giữ; role nội bộ giữ workspace tương ứng.
- Landing và header Citizen/Admin/Officer/Manager/Procedure Manager dùng chung `src/components/layout/UserDropdown.tsx`; bỏ dropdown riêng của Citizen và avatar tĩnh/toast giữ chỗ ở các header. Quy tắc liên kết menu đã được tinh gọn theo yêu cầu mới ở mục trên.
- `src/hooks/useLogout.ts`: toast ID chung; chỉ hiện “Đã đăng xuất.” khi BE xác nhận thu hồi. Mở menu không phát toast; lúc chờ khóa nút; lỗi giữ menu để thử lại, toast thành công thay toast lỗi.
- Kiểm tra: typecheck, lint, build và diff check đạt. Lượt auth-session/auth/officer/manager/procedure-manager **40/40 đạt**; lượt design-system/landing/jwt-client/auth-session (thêm ca logout lỗi rồi thử lại) **48/48 đạt**. Hai lượt có test trùng; auth dùng mock, chưa chạy lại IAM thật cho thay đổi dropdown. Build còn cảnh báo chunk lớn và annotation Zod đã có.
- Cập nhật `docs/design-system-and-auth.md` theo hành vi hiện tại. Điều hướng và dropdown đã commit/push tại `5b49dfe`, `20173b8`; không sửa BE.

## Điều hướng sau đăng nhập theo role IAM — 02/10/2026

- Đã phát hiện login không có returnTo luôn về `/`. Sửa `src/lib/authRedirect.ts` và `src/pages/auth/AuthPage.tsx`: lấy role từ danh tính IAM sau login; mặc định IT_ADMIN → `/admin`, FRONT_DESK_OFFICER → `/officer`, MANAGER → `/manager`, PROCEDURE_MANAGER → `/procedure-manager`. REGISTERED_CITIZEN hiện về `/` theo yêu cầu mới ở mục trên. Không hardcode username.
- Giữ returnTo nội bộ an toàn nếu đã có; ProtectedRoute tiếp tục kiểm tra quyền trang đích. Tài khoản nhiều role hoặc role chưa biết vẫn về trang chủ để chọn workspace từ menu, không suy đoán role chính. Không đổi quyền IT_ADMIN đã chốt hoặc logic ghi nhớ đăng nhập.
- Xác minh thật: bốn tài khoản kiểm thử BE do chủ sở hữu cung cấp có đúng bốn role nội bộ trên. Edge headless tại FE `http://localhost:5173`, qua Vite proxy tới IAM Azure: **4/4 login đúng workspace, 4/4 F5 khôi phục đúng role/trang, cookie refresh HttpOnly và logout thu hồi phiên test thành công**. Không ghi thông tin đăng nhập/token vào repo. Chưa xác minh FE production, không đồng nhất với triển khai thành công.
- Kiểm tra code: typecheck, lint đạt; `auth-session.spec.ts`, `auth.spec.ts`, `jwt-client.spec.ts`: **31/31 đạt** bằng mock. Thêm ca role default/safe returnTo; cập nhật ca bootstrap đến muộn theo trang mặc định công dân. Không chạy lại toàn bộ suite hoặc build trong task nhỏ này.
- Git: các commit FE-TASK-03 trước đã có trên origin/main tại `2072174`; phần sửa điều hướng đã commit/push tại `5b49dfe`. Không sửa BE.

## FE-TASK-03 — Form auth, Zustand và Protected Routes — 01/10/2026

- Phạm vi đã được người dùng duyệt: Zod/React Hook Form, Zustand, guard theo role IAM; IT_ADMIN được vào admin và procedure-manager, không ngầm cấp workspace khác. Tạm bỏ qua “Ghi nhớ đăng nhập”, giữ checkbox chưa có logic; không mở rộng quên/đặt lại mật khẩu.
- Đã triển khai: `src/lib/authSchema.ts`, `src/pages/auth/AuthPage.tsx` dùng schema theo IAM, lỗi từng trường/ProblemDetails.errors, giữ UI/loading/chống submit lặp. Password giữ nguyên khoảng trắng, giới hạn 72 byte UTF-8. CSS cố định icon theo chiều cao input để lỗi bên dưới không làm lệch icon.
- `src/stores/authStore.ts`, `src/hooks/useAuthState.ts`, `src/hooks/useUserProfile.tsx`, `src/lib/api/index.ts`, `createJwtClient.ts`: trạng thái restoring/authenticated/anonymous/error; lấy danh tính/roles/permissions bằng GET `/api/v1/users/me`; profile ban đầu dùng response này. Bootstrap và 401 dùng chung refresh promise; kiểm tra phiên trước khi áp dụng kết quả auth/profile đến muộn. Không persist token hoặc user; refresh vẫn HttpOnly, access token ở RAM của JWT client.
- `src/components/ProtectedRoute.tsx`, `src/app/App.tsx`: chờ bootstrap; chưa xác thực chuyển login kèm returnTo nội bộ; sai role hiển thị không có quyền; lỗi bootstrap 403/mạng/5xx giữ trang riêng tư và cho thử lại. Bảo vệ alias tiếng Việt lẫn tiếng Anh. Public pages vẫn mở không cần đăng nhập. `UserDropdown.tsx` hiển thị các workspace được cấp theo role.
- API tiếp tục dùng hợp đồng IAM hiện có; không thay backend, endpoint, cookie policy hoặc database. Không kiểm thử tài khoản thật/Azure/deployment trong phiên này, chưa xác nhận production cookie. Auth/roles trong Playwright là mock, không phải tích hợp end-to-end thật.
- Kiểm tra: typecheck và lint đạt. Lượt hồi quy 62 tests: 61 đạt, 1 test cán bộ dùng nhãn dashboard cũ thất bại. Đã đối chiếu UI và sửa test; chạy lại `auth-session.spec.ts` + `officer.spec.ts`: **16/16 đạt**, gồm test menu IT_ADMIN mới. Các test auth/JWT/design-system/landing/manager/procedure-manager đã đạt ở lượt hồi quy. Test workspace được bổ sung mock IAM đúng role; test hồ sơ/logout cũ cập nhật theo UI đang có, không thay nghiệp vụ để làm test qua.
- Build production đã đạt; còn cảnh báo chunk lớn và annotation trong dependency Zod. `npm audit` báo 1 high ở dependency phát triển gián tiếp brace-expansion; không chạy audit fix/refactor dependency ngoài phạm vi. Ảnh đăng ký mobile đã kiểm tra; kiểm tra bổ sung ảnh lỗi validation mobile được ghi ở mục xác minh cuối bên dưới.
- Tài liệu cập nhật: `AGENTS.md`, `docs/design-system-and-auth.md`, file này; thay nhận định lỗi thời “chưa có backend auth/route guard”. `package.json`/lock thêm Zustand, Zod, React Hook Form và resolver. Chưa commit/push.
- Còn chờ: smoke test login/logout/F5/role với IAM thật trên môi trường triển khai; cần tài khoản test đúng role và cấu hình proxy/cookie tại môi trường đó. Không ghi “Complete tích hợp thật” chỉ dựa trên test mock.
- Xác minh cuối: test server validation/mobile **1/1 đạt**, ảnh `test-results/auth-validation-mobile.png` đã xem (lỗi nằm dưới ô nhập, icon không lệch, không tràn ngang); build bản cuối đạt và `git diff --check` đạt. Tổng phạm vi đã kiểm tra là 63 test khác nhau qua các lượt trên, không phải một lượt 63/63; chưa chạy toàn bộ test suite ngoài phạm vi. Không có thay đổi backend, commit hoặc push.

## Nâng cao Trải nghiệm Nút Đăng nhập & Đăng ký (Dynamic Loading Text) — 01/10/2026

- **Yêu cầu & Triển khai**:
  - Khi người dùng gửi form, trước đây nút bấm chỉ hiện spinner xoay tròn kèm chữ tĩnh "Đăng nhập" hoặc "Tạo tài khoản".
  - Đã cập nhật nút bấm tại [src/pages/auth/AuthPage.tsx](file:///d:/frontend/src/pages/auth/AuthPage.tsx) tự động chuyển đổi chữ hiển thị tương ứng:
    - Khi đăng nhập: **"Đang đăng nhập..."** kèm spinner xoay.
    - Khi đăng ký: **"Đang tạo tài khoản..."** kèm spinner xoay.
  - Phản hồi trực quan này giúp người dùng nhận biết rõ ràng hệ thống đang kết nối và xử lý yêu cầu với máy chủ từ xa, không lo lắng hay bấm gửi lặp nhiều lần.
- **Kiểm tra**:
  - `npm run typecheck`: Đạt 100% (0 lỗi).
  - `npm run lint`: Đạt 100% (0 lỗi/cảnh báo).

## Đồng nhất Trải nghiệm Đăng xuất (Toast & Luồng trực tiếp) — 01/10/2026

- **Yêu cầu & Triển khai**:
  1. **Đồng nhất thông báo Toast**:
     - Thay đổi thông báo khi đăng xuất từ *"Đã đăng xuất an toàn."* thành **"Đã đăng xuất."** ngắn gọn, chuẩn xác.
  2. **Đồng nhất luồng Đăng xuất trên toàn ứng dụng**:
     - Ở Landing Page và Topbar Cổng công dân (`/citizen`), khi người dùng bấm **"Đăng xuất"**, hệ thống sẽ thực hiện đăng xuất ngay tức thì và hiển thị toast **"Đã đăng xuất."**.
     - Đã loại bỏ hoàn toàn popup xác nhận thừa rườm rà ở trang `/citizen`, đảm bảo trải nghiệm người dùng (UX) đồng nhất 100% giữa các trang.
  3. **Giải thích hiện tượng độ trễ 2-3s ban đầu khi F5**:
     - Do server IAM được triển khai trên **Azure Container Apps** với cơ chế serverless / container scaling, khi ứng dụng F5 và kích hoạt chuỗi 2 request liên tiếp (`POST /refresh-token` rồi đến `GET /profile`), độ trễ mạng quốc tế từ máy local sang data center Japan East kèm độ trễ xử lý DB mất khoảng 1.5 - 2s trước khi nhận được dữ liệu.
- **Kiểm tra**:
  - `npm run typecheck`: Đạt 100% (0 lỗi).
  - `npm run lint`: Đạt 100% (0 lỗi/cảnh báo).

## Cấu hình Vite Dev Proxy khắc phục lỗi Cookie Cross-Site (F5 / Reload) — 01/10/2026

- **Nguyên nhân cốt lõi phát hiện từ DevTools**:
  - Trình duyệt hiển thị cảnh báo `(!)` màu vàng ở cột SameSite của cookie `refreshToken` do gọi cross-site từ `http://localhost:5173` sang `https://wardmate-iam.blackmeadow-a2f12767.japaneast.azurecontainerapps.io`.
  - Khi người dùng F5 hoặc reload trang, trình duyệt chặn không gửi cookie cross-site này lên Azure, dẫn đến backend không nhận được token và trả về `401 iam.invalid_token`.
- **Giải pháp triển khai (Không sửa Backend)**:
  1. `vite.config.ts`: Cấu hình Proxy chuyển tiếp `/api` sang Azure Container App với `changeOrigin: true`.
  2. `src/lib/api/createJwtClient.ts` & `src/lib/api/index.ts`: Cho phép `baseURL` tương đối (cùng origin `http://localhost:5173`).
  3. `.env.development.local`: Đặt `VITE_API_BASE_URL=` rỗng để chạy qua Vite Proxy.
  - **Kết quả**: Cookie được lưu và gửi trực tiếp dưới origin `localhost:5173` (Same-Site), không còn bị gắn cờ hạn chế hay bị trình duyệt chặn khi reload. Mỗi lần F5 đều tự động khôi phục phiên thành công 100%.
- **Kiểm tra**:
  - `npm run typecheck`: Đạt 100% (0 lỗi).
  - `npm run lint`: Đạt 100% (0 lỗi/cảnh báo).

## Tối ưu Giao diện Sidebar Công dân: Gỡ bỏ Nút Đăng xuất ở Sidebar — 01/10/2026

- **Yêu cầu & Triển khai**:
  - Gỡ bỏ hoàn toàn nút **"Đăng xuất"** trong danh mục TIỆN ÍCH & CÀI ĐẶT ở thanh Sidebar trang `/citizen`.
  - Toàn bộ thao tác kết thúc phiên làm việc / đăng xuất giờ đây được quản lý tập trung và chuẩn mực tại menu **User Dropdown** ở góc phải thanh Topbar (hoặc Header), tránh trùng lặp nút thừa trên giao diện.
- **Kiểm tra**:
  - `npm run typecheck`: Đạt 100% (0 lỗi).
  - `npm run lint`: Đạt 100% (0 lỗi/cảnh báo).

## Tự động Khôi phục Phiên (F5 / Reload), Sửa Spinner Đăng nhập & Tối ưu Sidebar — 01/10/2026

- **Yêu cầu & Triển khai**:
  1. **Khắc phục lỗi F5 bị văng đăng nhập**:
     - Bổ sung hàm `restoreSession()` trong [src/lib/api/index.ts](file:///d:/frontend/src/lib/api/index.ts): Gọi `POST /api/v1/auth/refresh-token` với credentials ngầm khi ứng dụng khởi chạy / reload trang.
     - Tích hợp vào `UserProfileProvider` ([src/hooks/useUserProfile.tsx](file:///d:/frontend/src/hooks/useUserProfile.tsx)) để tự động lấy lại Access Token vào RAM mà không bắt người dùng phải đăng nhập lại mỗi khi F5.
  2. **Khắc phục Spinner nút Đăng nhập không xoay**:
     - Kiểm tra và sửa lỗi CSS tại [src/styles/globals.css](file:///d:/frontend/src/styles/globals.css): Quy tắc `@media (prefers-reduced-motion: reduce)` trước đây vô tình tắt hiệu ứng `animation: none` trên toàn bộ phần tử, làm spinner của nút bấm bị đóng băng thành hình tĩnh `C`. Đã loại trừ `.animate-spin` để spinner xoay tròn liên tục và mượt mà.
  3. **Gỡ bỏ khung dư thừa ở chân Sidebar**:
     - Đã loại bỏ phần khung công dân `admin-sidebar-user` ("AĐ - Anh Đức") ở chân Sidebar trang `/citizen` theo yêu cầu, tạo không gian gọn gàng cho danh sách menu và tránh trùng lặp với User Dropdown trên Topbar.
- **Kiểm tra**:
  - `npm run typecheck`: Đạt 100% (0 lỗi).
  - `npm run lint`: Đạt 100% (0 lỗi/cảnh báo).

## Bổ sung Nút quay lại Trang chủ tại Cổng dịch vụ công dân (`/citizen`) — 01/10/2026

- **Yêu cầu & Triển khai**:
  - Logo và tên hệ thống **WardMate Dịch vụ công dân** ở đầu Sidebar trước đây là thẻ tĩnh, người dùng không thể bấm quay lại trang chủ.
  - Đã chuyển cụm logo và tên hệ thống thành `<Link to="/" ... title="Về trang chủ WardMate">` có hiệu ứng tương tác, giúp người dùng dễ dàng bấm vào logo để quay về trang chủ bất kỳ lúc nào.
  - Đồng thời bổ sung tùy chọn **"Về trang chủ"** ngay đầu menu User Dropdown trên Topbar để thuận tiện thao tác khi thanh sidebar đang đóng/thu gọn.
- **Kiểm tra**:
  - `npm run typecheck`: Đạt 100% (0 lỗi).
  - `npm run lint`: Đạt 100% (0 lỗi/cảnh báo).

## Tối ưu UserProfileProvider & Modal Đăng xuất Công dân — 01/10/2026

- **Vấn đề đã khắc phục**:
  1. Loại bỏ việc API `GET /api/v1/users/me/profile` bị bắn lặp lại nhiều lần do nhiều component cùng gọi hook độc lập:
     - Tạo `UserProfileProvider` ([src/hooks/useUserProfile.tsx](file:///d:/frontend/src/hooks/useUserProfile.tsx)) bọc tại gốc `App.tsx`.
     - Toàn bộ ứng dụng (`UserDropdown`, Topbar, Citizen sidebar, `CitizenProfileView`) hiện tại dùng chung 1 nguồn dữ liệu duy nhất, chỉ gọi 1 request API khi người dùng đăng nhập.
  2. Khắc phục trải nghiệm popup đăng xuất ở trang Cổng dịch vụ công dân (`/citizen`):
     - Rút gọn tiêu đề và nội dung modal: *"Bạn có chắc chắn muốn đăng xuất tài khoản? Phiên làm việc hiện tại sẽ kết thúc an toàn."*
     - Hai nút bấm trực quan: **"Ở lại"** và **"Đăng xuất"**.
     - Cải tiến `useLogout(redirectTo)`: Khi đăng xuất, xóa phiên và điều hướng an toàn về trang chủ (`/`), hiển thị thông báo toast chuẩn mực.
- **Kiểm tra**:
  - `npm run typecheck`: Đạt 100% (0 lỗi).
  - `npm run lint`: Đạt 100% (0 lỗi/cảnh báo).

## Tích hợp API Profile thật (/api/v1/users/me/profile) — 01/10/2026

- **Yêu cầu**:
  - Không dùng dữ liệu cứng (mock/hardcoded) cho thông tin cá nhân của người dùng trên Dropdown menu và trang Cổng dịch vụ công dân (`/citizen`).
  - Lựa chọn API 2 từ backend `WardMate.Services.IAM`: `GET /api/v1/users/me/profile` và `PUT /api/v1/users/me/profile` ([ProfilesController.cs](file:///d:/wardmate-backend/src/Services/WardMate.Services.IAM/WardMate.Services.IAM.Api/Controllers/ProfilesController.cs)).
- **Triển khai**:
  - `src/types/profile.ts`: Khai báo interface `UserProfileDto` và `ProfileInput` khớp hoàn toàn với contract backend IAM (`fullName`, `identityNumber`, `phoneNumber`, `dateOfBirth`, `gender`, `permanentAddress`, `temporaryAddress`).
  - `src/lib/api/index.ts`: Bổ sung 2 hàm client:
    - `getMyProfile()`: Gọi `GET /api/v1/users/me/profile` qua `authClient` (tự động gắn token Bearer, cookie credentials).
    - `updateMyProfile(payload)`: Gọi `PUT /api/v1/users/me/profile` kèm header `X-CSRF-Protection: 1`.
  - `src/hooks/useUserProfile.ts`: Hook chuyên dụng quản lý dữ liệu profile:
    - Tự động gọi API khi người dùng đã đăng nhập (`isAuthenticated`).
    - Tính toán avatar initials động từ chữ cái đầu của họ và tên (`getInitials`).
    - Hỗ trợ hàm `refetch` và xử lý graceful fallback (khi tài khoản mới chưa có profile 404).
  - `src/components/layout/UserDropdown.tsx`:
    - Loại bỏ code cứng `"Nguyễn Minh Anh"`, `"CD"` và email giả định.
    - Hiển thị họ tên thật, số điện thoại / thông tin liên hệ và avatar initials động từ API thật.
  - `src/pages/citizen/CitizenPage.tsx`:
    - Đồng bộ tên và avatar trên Topbar Dropdown và sidebar mini.
    - `CitizenProfileView` nhận dữ liệu thật từ `useUserProfile` vào form, cho phép người dùng chỉnh sửa và cập nhật trực tiếp qua API `PUT /api/v1/users/me/profile`.
- **Kiểm tra**:
  - `npm run typecheck`: Đạt 100% (0 lỗi).
  - `npm run lint`: Đạt 100% (0 lỗi/cảnh báo).

## User Dropdown Menu & Ẩn nút Đăng nhập khi Authenticated — 01/10/2026

- **Yêu cầu**:
  1. Hiển thị User Avatar/Logo kèm Dropdown menu sau khi đăng nhập thành công.
  2. Bỏ nút "Đăng nhập" ở trang công cộng/header khi đã đăng nhập thành công và thay bằng User Dropdown.
  3. Bổ sung đường dẫn trực tiếp tới Cổng dịch vụ công dân (`/citizen`) ngay trong Dropdown menu.
  4. Cung cấp tùy chọn Đăng xuất (`logout`).
  5. Loại bỏ trang hồ sơ cá nhân độc lập (`/tai-khoan`) do giao diện `/citizen` đã có sẵn phân hệ quản lý hồ sơ cá nhân (`profile`).
- **Triển khai**:
  - `src/lib/api/index.ts`: Kích hoạt custom event `wardmate-auth-state` khi `login`, `logout`, `clearSession` và nhận message từ `BroadcastChannel` để các component React phản ứng tức thì.
  - `src/hooks/useAuthState.ts`: Hook `useAuthState` dùng `useSyncExternalStore` để lắng nghe thay đổi token RAM từ `authClient.hasAccessToken()` và cập nhật giao diện mà không gây giật lag.
  - `src/components/layout/UserDropdown.tsx`: Dropdown tài khoản công dân chuẩn design system WardMate:
    - Avatar tròn "CD" đỏ đô, tên "Nguyễn Minh Anh".
    - Link dẫn tới Cổng dịch vụ công dân (`/citizen`).
    - Nút Đăng xuất kết nối trực tiếp với `useLogout()`.
    - Đã loại bỏ hoàn toàn liên kết thừa tới `/tai-khoan`.
    - Hỗ trợ đóng khi nhấn phím Escape hoặc click outside, hỗ trợ phiên bản Mobile Drawer.
  - `src/app/App.tsx`: Gỡ bỏ route `/tai-khoan` và import `ProfilePage` không cần thiết.
  - `src/data/mockNotifications.ts`: Cập nhật `actionUrl` từ `/tai-khoan` chuyển về `/citizen`.
  - `src/components/layout/MainLayout.tsx`: Sử dụng `useAuthState()`, hiển thị `UserDropdown` thay thế cho nút "Đăng nhập" ở cả header desktop và menu drawer mobile khi người dùng đã đăng nhập.
  - `src/pages/citizen/CitizenPage.tsx`: Chuyển đổi nút công dân trên Topbar thành Dropdown menu tương ứng với đường dẫn Tổng quan (`/citizen`), Hồ sơ (`profile`) và Đăng xuất (mở modal xác nhận).
- **Kiểm tra**:
  - `npm run typecheck`: Đạt 100% (0 lỗi).
  - `npm run lint`: Đạt 100% (0 lỗi/cảnh báo).


## Sửa cấu hình BE Azure và origin FE — 01/10/2026

- Người dùng xác nhận BE ở máy/server khác; localhost:5000 trước đó trỏ nhầm về máy FE. Kiểm tra local không có listener 5000/5001; chỉ có FE ở 5173.
- URL BE thực tế từ Swagger người dùng gửi: `https://wardmate-iam.blackmeadow-a2f12767.japaneast.azurecontainerapps.io`. Đã tạo `.env.development.local` (Git ignore, chỉ development) và cập nhật `.env.example` dùng origin này, không kèm đường dẫn Swagger/API.
- `vite.config.ts` cố định host localhost, port 5173, strictPort để tránh tự nhảy sang cổng ngoài allowlist BE. Xác minh bằng Vite loadEnv/resolveConfig và mã module từ server FE đang chạy: đã nạp URL Azure, không còn gọi localhost:5000 trong phiên dev này.
- Đã đọc OpenAPI triển khai thật: 4 route Auth tồn tại, refresh/revoke không có body, header CSRF bắt buộc. OPTIONS login thật trả 204, Allow-Origin `http://localhost:5173`, Allow-Credentials true và cho phép Content-Type/Authorization/X-CSRF-Protection. Đây là kiểm tra kết nối/contract/CORS, chưa phải đăng nhập tài khoản thật.
- `playwright.config.ts` cố định API origin mock localhost:5000 trong tiến trình test, tránh gửi dữ liệu test lên Azure do `.env` cá nhân. Typecheck, lint, diff check và 8/8 test Auth mock đạt; không đổi UI/logic Auth trong task env này. Không chạy lại production build vì chỉ cấu hình dev/test.
- Còn cần xác minh login/refresh thật với tài khoản test: nếu cookie BE vẫn dùng SameSite=Strict theo bàn giao cũ, FE localhost và BE Azure khác site sẽ không gửi cookie; khi đó cần phối hợp BE hoặc proxy cùng site. Chưa tự đổi chính sách cookie phía BE. Không commit/push.

## Tích hợp 4 API Auth HttpOnly — 01/10/2026

- Người dùng đã chốt triển khai register/login/refresh-token/revoke-token theo `iam-httponly.md`, Gateway `http://localhost:5000`. Bỏ qua roles/permissions, `/users/me`, route guard và giữ nguyên “Ghi nhớ đăng nhập” chưa có logic. Schema `/me` đã được gửi nhưng không dùng trong task này.
- `src/lib/api/index.ts`: 4 POST dùng credentials + `X-CSRF-Protection: 1`; refresh/revoke không body. Access token chỉ ở RAM, cookie refresh do BE đặt. Kiểm tra response token/thời hạn; register nhận 201 rồi về login, login về safe returnTo hoặc `/`, revoke chỉ báo thành công sau 204.
- Tái sử dụng JWT client: refresh khi 401, gom đồng thời, retry một lần, chặn kết quả phiên cũ/hủy request. Sau reload khôi phục khi request có xác thực cần refresh, không tự gọi startup hay `/me`. Auth adapter phân biệt refresh 403 CSRF với 401 hết phiên; lỗi mạng/5xx không giả thành logout.
- Web Locks tuần tự hóa request auth có cookie giữa các tab cùng origin; BroadcastChannel chỉ truyền sự kiện login/logout để xóa access token cũ, không truyền/lưu token. Browser thiếu Web Locks chưa bảo đảm phối hợp đa tab; chỉ có gom refresh trong một tab.
- `src/pages/auth/AuthPage.tsx`: thay nhãn identity, bổ sung email khi đăng ký; giữ thiết kế, checkbox ghi nhớ và UI nghiệp vụ. Nút submit loading/chống gửi lặp, lỗi từ API, login không áp chính sách độ dài password đăng ký. Thêm key cho hai route auth để kết quả request cũ không điều hướng form mới.
- `src/hooks/useLogout.ts` nối chung các nút Citizen/Officer/Manager/Procedure Manager. Lỗi revoke giữ trang/cho thử lại và không báo đã thu hồi. Admin chưa có nút logout, không thêm UI mới.
- Cấu hình: development mặc định Gateway 5000 nếu chưa có biến môi trường; production phải đặt `VITE_API_BASE_URL`. FE local nên dùng `localhost:5173`, không trộn localhost/127.0.0.1. Test auth mock dùng localhost:4317; test với BE thật cần allowlist origin này ở IAM/Gateway.
- Đã kiểm tra typecheck, lint, build đạt; build còn cảnh báo bundle lớn. Lượt đầu 51 test: 47 đạt, 4 lỗi (locator Email mới, một timeout fixture UI, test Officer giả định luôn buổi sáng). Đã chỉnh nhãn email theo form hiện có và test Officer theo lời chào động; chạy lại 31 test Auth/Core/Landing/Officer đạt. 20 test JWT/Manager/Procedure Manager đã đạt trong lượt đầu. Các kiểm tra auth là mock trên Edge, không phải tích hợp BE thật.
- Bổ sung kiểm tra đăng nhập hai tài khoản đồng thời bị từ chối và cookie thực sự đổi giá trị giữa hai lượt refresh ở hai tab; chạy lại 3 ca liên quan đạt, lint và diff check cuối đạt.
- Đã xem ảnh form đăng ký 390/1440px và kiểm tra không tràn ngang. Không refactor UI ngoài phạm vi auth.
- Không kết nối được localhost:5000 và :5001 khi kiểm tra (curl connection refused), nên chưa xác minh BE thật, CORS/CSRF/rotation thật hoặc tài khoản thật. Chờ BE chạy để kiểm thử E2E với server; chưa commit/push/deploy.
- Git vẫn dựa trên HEAD `d9ce7fd`; ref origin/main đi trước 2 commit về landing/dashboard Officer, đã đối chiếu danh sách file, không tự pull/ghi đè. Tài liệu chi tiết: [design-system-and-auth.md](design-system-and-auth.md); [auth-integration-review.md](auth-integration-review.md) ghi rõ phạm vi mới ưu tiên hơn đề xuất cũ.

## Kiểm tra và chia commit Officer/Manager — 01/10/2026

- Theo yêu cầu commit/push, nhóm thay đổi hiện tại thành 3 commit: dashboard/điều hướng Officer; tab hồ sơ và CCCD Manager kèm test; giao diện phản hồi Manager kèm bàn giao.
- `ManagerFeedbackView.tsx` hiện ẩn phần giới thiệu và bộ lọc lĩnh vực; danh sách hiển thị tất cả phản hồi, vẫn giữ thao tác trả lời. Đây là trạng thái code được gửi, không coi bộ lọc còn hoạt động.
- Đã chạy lại lint, build (gồm TypeScript) và 8/8 test Officer/Manager đạt. Build còn cảnh báo bundle lớn. Chỉ dọn khoảng trắng thừa trước commit; chưa kiểm tra clipboard và toàn bộ thao tác ở tab giấy tờ bằng trình duyệt trong lượt này.
- Đối chiếu lịch sử Git và origin/main để xác định trạng thái push; chưa tích hợp backend.

## Nâng cấp Giao diện Quản lý Hồ sơ Công dân (Manager Workspace) — 01/10/2026

- **Yêu cầu**: Phân chia chi tiết hồ sơ công dân thành 3 tab nhỏ rõ ràng (1. Thông tin Định danh & Nhân thân và Địa chỉ & Nơi cư trú; 2. Lịch sử Hồ sơ Thủ tục Hành chính tại Phường; 3. Giấy tờ điện tử đã nộp) và làm nổi bật số CCCD/Mã định danh.
- **Triển khai**:
  - **Trang Chi tiết ([src/pages/manager/views/ManagerProfileDetailView.tsx](file:///d:/frontend/src/pages/manager/views/ManagerProfileDetailView.tsx))**:
    - Thiết kế thanh điều hướng 3 Tab chuẩn UI/UX hiện đại với icon chuyên biệt (`IdentificationCard`, `ClockCounterClockwise`, `Files`) và badge đếm số lượng hồ sơ/giấy tờ.
    - Làm nổi bật số CCCD ở 2 vị trí quan trọng:
      1. Ngay trên **Header Banner** của công dân: Huy hiệu đỏ đô sang trọng (`font-mono text-base font-black tracking-wider`) kèm nút sao chép nhanh (`Copy`) và biểu tượng điện thoại.
      2. Trong **Tab 1**: Thiết kế riêng khối thẻ mô phỏng Căn cước công dân gắn chip / VNeID điện tử nổi bật với phông nền gradient nhẹ, số CCCD cỡ lớn `text-xl` và nút Sao chép trực tiếp vào clipboard.
    - Tab 2: Hiển thị đầy đủ danh sách lịch sử hồ sơ TTHC tại phường (mã hồ sơ, lĩnh vực, thời gian nộp, cán bộ thụ lý, trạng thái và ghi chú của cán bộ Một cửa).
    - Tab 3: Hiển thị kho giấy tờ điện tử đã nộp dạng grid thẻ tài liệu hiện đại (CCCD, Giấy khai sinh, Xác nhận cư trú CT07, trạng thái xác thực và nút tải về).
  - **Bảng Danh sách ([src/pages/manager/views/ManagerProfilesView.tsx](file:///d:/frontend/src/pages/manager/views/ManagerProfilesView.tsx))**:
    - Bổ sung số CCCD nổi bật ngay dưới tên công dân trong cột "Họ và tên", giúp lãnh đạo/cán bộ tra cứu và nhận diện nhanh mà không cần mở chi tiết.
- **Kiểm tra**:
  - `npm run typecheck`: Đạt 100% (0 lỗi).
  - `npm run lint`: Đạt 100% (0 lỗi).
  - Playwright test: `tests/manager.spec.ts` 4/4 tests đạt.

## Tái cấu trúc Dashboard Cán bộ Một cửa (Officer Workspace) — 01/10/2026

- **Yêu cầu**: Dashboard ban đầu quá chi tiết (bày danh sách dài từng hồ sơ chờ kiểm tra và gửi lại); người dùng muốn có biểu đồ trực quan và chỉ tổng quan những mảng chính trong các chức năng của cán bộ.
- **Triển khai ([src/pages/officer/OfficerDashboardView.tsx](file:///d:/frontend/src/pages/officer/OfficerDashboardView.tsx))**:
  - Tích hợp **Biểu đồ luồng xử lý hồ sơ trong ca trực** sử dụng thư viện `recharts` (`AreaChart`, `ResponsiveContainer`):
    - Trực quan hóa tiến độ tiếp nhận hồ sơ vào quầy và số lượng hoàn thành tiền kiểm theo các mốc thời gian trong ca làm việc (`08:00`, `09:00`, `10:00`, `11:00`, `13:30`, `14:30`, `15:30`, `16:30`).
    - Bổ sung bộ lọc chuyển đổi nhanh giữa chế độ biểu đồ khung giờ và tóm tắt tỷ lệ (tổng nộp, đã xử lý, tồn chờ).
  - Tinh giản danh sách chi tiết: Thay vì dàn trải toàn bộ danh sách hồ sơ (vốn thuộc về các trang danh mục hồ sơ con), Dashboard chỉ giữ lại khối **Hàng đợi ưu tiên xử lý ngay (Priority Queue)** rút gọn hiển thị top hồ sơ vừa được người dân bổ sung gửi lại cần duyệt lại gấp.
  - Tái cấu trúc layout 3 cột:
    - 2 cột bên trái: Biểu đồ tiến độ ca trực + Hàng đợi ưu tiên xử lý ngay (bảo đảm đầy đủ các nút nghiệp vụ `Quick Preview`, `Review lại ngay`).
    - 1 cột bên phải: Khối điều phối **Tiếp nhận hồ sơ tại quầy** (chức năng cốt lõi có badge số lượng chờ tiếp nhận), khối **Hiệu suất ca làm việc** (thời gian TB, tỷ lệ đúng hẹn 94%, tiến độ chỉ tiêu 78%) và khối **Thông tin quầy làm việc** (Quầy Một cửa 02).
  - Giữ nguyên 7 thẻ KPI phân luồng nghiệp vụ trên đầu để cán bộ nắm trọn vẹn số liệu các trạng thái hồ sơ.
- **Kiểm tra**:
  - `npm run typecheck`: Đạt 100% (0 lỗi).
  - `npm run lint`: Đạt 100% (0 lỗi).
  - Playwright test: `tests/officer.spec.ts` 4/4 tests đạt.

## Tinh chỉnh Header & Welcome Section Phân hệ Cán bộ (Officer Workspace) — 01/10/2026

- **Top Header ([src/pages/officer/OfficerHeader.tsx](file:///d:/frontend/src/pages/officer/OfficerHeader.tsx))**:
  - Gỡ bỏ dòng thông tin 2 hàng cồng kềnh ("UBND Phường An Khánh · Quầy số 02 | Tiền kiểm hồ sơ Một cửa").
  - Đồng bộ cấu trúc Breadcrumb nằm trên **1 hàng duy nhất** theo chuẩn Manager (`Cán bộ / [Tên chức năng hiện tại]`, ví dụ `Cán bộ / Tổng quan công việc Cán bộ Một cửa`, `Cán bộ / Hồ sơ chờ tiền kiểm`...) và hỗ trợ breadcrumb sâu khi review hồ sơ (`Cán bộ / Quản lý hồ sơ / HS-2026-00125`).
- **Welcome Section ([src/pages/officer/OfficerDashboardView.tsx](file:///d:/frontend/src/pages/officer/OfficerDashboardView.tsx))**:
  - Bỏ nền gradient đỏ và border của banner cũ, chuyển về layout tiêu đề sạch.
  - Bổ sung hàm `getGreeting()` chào hỏi theo thời gian thực (Sáng/Chiều/Tối).
- **Sidebar Navigation ([src/pages/officer/OfficerSidebar.tsx](file:///d:/frontend/src/pages/officer/OfficerSidebar.tsx))**:
  - Bổ sung tính năng thu gọn / mở rộng (accordion tree) cho nhóm **Quản lý hồ sơ** (Hồ sơ nghiệp vụ) tương tự phân hệ Citizen.
  - Hiển thị badge tổng số hồ sơ cần xử lý, mũi tên Caret xoay mượt mà khi thu gọn / mở rộng; hỗ trợ tự động mở rộng khi sidebar ở chế độ compact trên desktop.
- **Kiểm tra**:
  - `npm run typecheck`: Đạt 100% (0 lỗi).
  - `npm run lint`: Đạt 100% (0 lỗi).
  - Playwright test: `tests/officer.spec.ts` 4/4 tests đạt.

## Sắp xếp thư mục pages — 01/10/2026

- Chuyển toàn bộ 10 file trực tiếp dưới `src/pages` vào thư mục theo chức năng: `admin` (AdminPage), `auth` (AuthPage, ForgotPasswordPage, ResetPasswordPage), `public` (HomePage, FaqPage, ProceduresPage, ProcedureDetailPage), `account` (ProfilePage), `errors` (NotFoundPage).
- Cập nhật import trong `src/app/App.tsx`; giữ nguyên URL, nội dung file và hành vi các trang. Các workspace citizen/officer/manager/procedure-manager giữ nguyên cấu trúc.
- Người dùng yêu cầu commit/push ngày 01/10; chia theo nhóm trang công cộng và nhóm quản trị/xác thực/tài khoản/trang lỗi. Đối chiếu lịch sử Git và origin/main để xác định trạng thái đồng bộ.
- Kiểm tra: cả 10 file giữ nguyên nội dung (đối chiếu Git hash); không còn import đường dẫn cũ. Lint và build (gồm TypeScript) đạt, build còn cảnh báo bundle lớn. Lượt test landing/detail/feedback đạt 21/22, một test detail timeout khi chạy song song; chạy riêng test đó đạt (9,4 giây). Không sửa test hoặc tăng timeout.

## Rút gọn nội dung Manager — 01/10/2026

- Phạm vi `/manager`: bỏ subtext dưới tiêu đề trang, tiêu đề thống kê lặp và mô tả trang trí; rút ngắn tiêu đề biểu đồ, nhóm vai trò và mẫu báo cáo.
- Bỏ nhãn “Công dân” lặp trên từng dòng và mô tả modal về đồng bộ cơ sở dữ liệu chưa được tích hợp. Giữ trường nhập, validation, nội dung chi tiết, mô tả quyền, số liệu so sánh và kỳ thống kê.
- Không đổi dữ liệu hoặc logic thao tác. Ngày 01/10, người dùng yêu cầu chia 2 commit (thống kê/báo cáo; hồ sơ/phân quyền và bàn giao) rồi push lên origin/main. Đối chiếu lịch sử Git và remote để xác định trạng thái đồng bộ.
- Kiểm tra: lint, production build (gồm TypeScript) và 4/4 test `tests/manager.spec.ts` đạt. Build còn cảnh báo bundle lớn; test có kiểm tra mobile không tràn ngang. Chưa xem ảnh trực quan trong lượt rút gọn này.

## Tinh chỉnh Header Phân hệ Quản lý Điều hành (Manager Workspace) — 30/09/2026

- **Yêu cầu & Vấn đề**: Thanh Header của phân hệ Manager trước đó bị vỡ thành 2 dòng do thiếu cấu trúc flexbox và class chuẩn của layout Admin (`admin-header` thay vì `admin-topbar`).
- **Giải pháp triển khai**:
  - Tái cấu trúc [src/pages/manager/ManagerHeader.tsx](file:///e:/wardmate-frontend/src/pages/manager/ManagerHeader.tsx) sử dụng chuẩn `.admin-topbar` đồng bộ với `AdminPage` và `ProcedureManagerHeader`.
  - Toàn bộ thanh Header nằm gọn gàng trên **1 hàng duy nhất** (`min-h-[68px]`, `flex items-center justify-between`):
    - Cụm trái: Nút mobile toggle, nút desktop collapse và Breadcrumb phân cấp tinh tế (`Quản lý / [Tên trang hiện tại]`).
    - Cụm phải: Ô tìm kiếm bo tròn nhẹ hiện đại, nút "Xuất báo cáo" viền mỏng thanh lịch, chuông thông báo có chấm đỏ, thanh phân cách dọc tinh tế và User badge (`TH Nguyễn Thế Hùng - Lãnh đạo UBND` kèm CaretDown).
- **Kiểm tra**:
  - `npm run typecheck`: Đạt 100% (0 lỗi).
  - `npm run lint`: Đạt 100% (0 lỗi).
  - Playwright test: `tests/manager.spec.ts` 4/4 tests đạt.

## Xây dựng Giao diện Phân hệ Quản lý Điều hành (Manager Workspace) — 30/09/2026

- Người dùng yêu cầu xây dựng giao diện phân hệ Quản lý điều hành (`/manager`, `/quan-ly`) theo layout và phong cách chuẩn của trang Admin (`AdminPage.tsx`):
  - **Bỏ trang Dashboard**: Chuyển thẳng trang **Thống kê hồ sơ** lên làm trang chủ/mặc định ban đầu của phân hệ Manager với 4 thẻ KPI rõ ràng, biểu đồ xu hướng Recharts và bảng chi tiết theo lĩnh vực.
  - **Bổ sung Trang Chi tiết Hồ sơ công dân** ([src/pages/manager/views/ManagerProfileDetailView.tsx](file:///e:/wardmate-frontend/src/pages/manager/views/ManagerProfileDetailView.tsx)): Thay vì chỉ có Modal popup nhỏ, khi bấm "Xem chi tiết" ở bảng danh sách công dân, hệ thống chuyển sang trang chi tiết toàn diện với thông tin CCCD/VNeID Mức 2, nơi thường trú/tạm trú, lịch sử các hồ sơ TTHC công dân đã thực hiện tại phường, kho giấy tờ điện tử đính kèm, nhật ký ghi chú của cán bộ tiếp nhận và nút quay lại danh sách.
  - **Thống kê hệ thống**: Thống kê hồ sơ (mặc định), Thống kê thủ tục, Thống kê lượt tra cứu, Thống kê biểu mẫu.
    - Thống kê hồ sơ: Diễn biến tiếp nhận & giải quyết theo tháng, bảng cơ cấu theo lĩnh vực, phân loại đúng hạn/trễ hạn.
    - Thống kê thủ tục: Tần suất thực hiện, tỷ lệ nộp trực tuyến, thời gian trung bình từng thủ tục.
    - Thống kê lượt tra cứu: Biểu đồ lưu lượng theo khung giờ trong ngày, top từ khóa tìm kiếm.
    - Thống kê biểu mẫu: Số lượt tải Word/PDF, số lượt điền E-Form trực tuyến, trạng thái rà soát.
  - **Hiệu suất xử lý**:
    - Thời gian xử lý: So sánh thời gian thực tế với quy định pháp luật.
    - Tỷ lệ hoàn thành: Tỷ lệ giải quyết trước hạn, đúng hạn, quá hạn và rút hồ sơ.
    - Tỷ lệ cần bổ sung: Phân tích nguyên nhân hồ sơ thiếu sót và giải pháp giảm số lần đi lại cho dân.
    - Hiệu suất cán bộ: Bảng đánh giá năng suất từng cán bộ Một cửa, tỷ lệ đúng hạn và điểm hài lòng (sao).
  - **Phản hồi người dân**:
    - Báo cáo phản hồi: Danh sách ý kiến đóng góp, phân loại chủ đề, phản hồi giải trình từ cơ quan.
    - Mức độ hài lòng: Đánh giá theo 4 tiêu chí chuẩn của Bộ Nội vụ (SIPAS).
  - **Báo cáo**: Trung tâm kết xuất báo cáo định kỳ tháng, quý, năm, xuất file PDF, Excel.
  - **Cài đặt quyền**: Danh mục vai trò và chi tiết phân quyền chức năng trong hệ thống.
  - **Hồ sơ cá nhân**: Thông tin tài khoản quản trị và bảo mật.
  - **Đăng xuất**: Hộp thoại xác nhận và điều hướng về trang đăng nhập.
- Files triển khai:
  - `src/pages/manager/ManagerPage.tsx`: Layout chính, điều phối view và state quản lý hồ sơ.
  - `src/pages/manager/ManagerSidebar.tsx`: Thanh điều hướng phân cấp chuẩn Admin.
  - `src/pages/manager/ManagerHeader.tsx`: Topbar với breadcrumb, tìm kiếm và nút xuất báo cáo.
  - `src/pages/manager/views/*`: 7 view chức năng chi tiết, module hóa rõ ràng.
  - `src/pages/manager/mockData.ts`, `src/pages/manager/types.ts`.
  - Cập nhật route `/manager/*` và `/quan-ly/*` tại `src/app/App.tsx`.
- Kiểm tra:
  - `npm run typecheck`: Đạt 100% (0 lỗi).
  - `npm run lint`: Đạt 100% (0 lỗi/cảnh báo).
  - `npm run build`: Đạt 100% (Vite production bundle thành công).
  - Playwright tests: 10/10 tests đạt (`tests/manager.spec.ts` 4/4 tests và `tests/procedure-manager.spec.ts` 6/6 tests), kiểm tra đầy đủ desktop và mobile (không tràn ngang).

## Cập nhật Logo WardMate — 30/09/2026

- Người dùng cung cấp tệp logo mới tại `dist/wardmate-mark.svg`.
- Cập nhật tài nguyên favicon / logo tĩnh tại [public/wardmate-mark.svg](file:///e:/wardmate-frontend/public/wardmate-mark.svg).
- Cập nhật component thương hiệu [src/components/brand/BrandMark.tsx](file:///e:/wardmate-frontend/src/components/brand/BrandMark.tsx) hiển thị logo mới tối ưu thông qua `/wardmate-mark.svg`, đồng bộ kích thước và class Tailwind trên toàn bộ các workspace (Admin, Officer, Procedure Manager, Citizen, MainLayout).
- Điều chỉnh tăng kích thước logo trên header trang chủ từ `48px` (`size-12`) lên `56px` (`size-14`) tại [src/styles/globals.css](file:///e:/wardmate-frontend/src/styles/globals.css) và [src/components/layout/MainLayout.tsx](file:///e:/wardmate-frontend/src/components/layout/MainLayout.tsx) giúp logo nổi bật và cân đối hơn với header 82px.
- Kiểm tra: `npm run typecheck`, `npm run lint`, `npm run build` đều đạt; 19/19 test Playwright (`design-system.spec.ts`, `landing.spec.ts`) đạt.

## Đồng bộ UI Procedure Manager theo Admin — 30/09/2026

- Người dùng chọn `src/pages/admin/AdminPage.tsx` làm mẫu dashboard quản lý; phạm vi lần này chỉ `procedure-manager`, giữ chức năng hiện có.
- Dùng lại `admin-layout`, sidebar/brand, topbar, workspace, tiêu đề, card, bảng và nút hành động từ CSS Admin. Không thay đổi AdminPage, không thêm dependency hoặc API.
- Giữ 14 mục điều hướng, tìm kiếm/lọc, chi tiết, wizard 8 bước, biểu mẫu, phiên bản, checklist, pháp lý, AI và đăng xuất. Thẻ thống kê chuyển sang button để dùng được bằng bàn phím.
- Đồng bộ nền trắng, viền, bo góc, font và màu đỏ chủ đạo; bỏ banner gradient lớn, tránh tiêu đề lặp. Sidebar cố định, cuộn riêng, thu gọn desktop và drawer mobile; nhãn dài xuống dòng khi mở rộng.
- File liên quan: `src/pages/procedure-manager/` và quy tắc nhãn sidebar có scope riêng ở `src/styles/globals.css`.
- Kiểm tra: typecheck, lint và production build đạt; build vẫn cảnh báo bundle lớn. 6/6 test hiện có trong `tests/procedure-manager.spec.ts` đạt sau thay đổi layout. Các chỉnh màu/nhãn cuối được kiểm tra trình duyệt; không thay logic nghiệp vụ.
- Kiểm tra 14 mục ở 1440/768/390/360px không tràn ngang; xem ảnh dashboard, danh sách, menu mobile và compact. Xác minh 15 nút menu giữ chiều cao chuẩn khi thu gọn. Chưa kiểm tra screen reader hoặc zoom 200%.
- Rút gọn nội dung theo phản hồi: bỏ banner giới thiệu dashboard, subtext lặp dưới 6 chỉ số/tiêu đề và mô tả từng dòng danh sách; bỏ ghi chú kỹ thuật về xóa cứng. Giữ dữ liệu nghiệp vụ trong chi tiết, cảnh báo, yêu cầu tệp, nhãn và trạng thái.
- Đưa thao tác tải biểu mẫu lên cạnh nút thêm thủ tục; bỏ nút thêm trùng ở banner. Rút gọn tiêu đề AI và placeholder tìm kiếm, giữ đầy đủ chức năng.
- Kiểm tra lượt rút gọn: lint và build (gồm TypeScript) đạt, cảnh báo bundle lớn còn tồn tại; 6/6 test procedure-manager đạt với nhãn mới. Đã xem ảnh desktop; kiểm tra desktop/mobile 1440/390px không tràn ngang.
- Vẫn là frontend/mock; không sửa các giới hạn dữ liệu và xử lý nghiệp vụ vốn có. Người dùng yêu cầu chia thành 2 commit và push: khung dashboard; nội dung màn hình và rút gọn text. Đối chiếu Git và origin/main để xác định trạng thái đồng bộ hiện tại.
## FE-TASK-33 — Phân hệ Quản lý Hồ sơ Công dân trên Admin (Admin Profiles)

- Người dùng yêu cầu: Thêm trang giao diện AdminProfiles tại `src/pages/admin/AdminPage.tsx` quản lý 7 thuộc tính định danh cá nhân:
  1. `fullName`: Họ và tên
  2. `identityNumber`: Số CCCD / Mã định danh cá nhân (12 số)
  3. `phoneNumber`: Số điện thoại liên hệ
  4. `dateOfBirth`: Ngày sinh (định dạng YYYY-MM-DD / DD/MM/YYYY)
  5. `gender`: Giới tính (Nam / Nữ / Khác)
  6. `permanentAddress`: Nơi thường trú
  7. `temporaryAddress`: Nơi tạm trú / Nơi ở hiện tại
- Triển khai trong `src/pages/admin/AdminPage.tsx`:
  - Bổ sung `SectionId` `'profiles'` và mục **"Hồ sơ công dân"** vào menu điều hướng nhóm *Tài khoản & truy cập* (icon `IdentificationCard`, badge đếm số lượng).
  - Giao diện bảng dữ liệu `AdminProfilesView`:
    - Thanh công cụ (`admin-toolbar`): Ô tìm kiếm từ khóa đa trường (`SearchBar`), dropdown lọc theo giới tính và nút `+ Thêm hồ sơ`.
    - Bảng hiển thị: 7 cột thuộc tính định danh kèm mã mono nổi bật cho CCCD, badge giới tính và nút thao tác *Chỉnh sửa*.
  - Modal tạo mới / Chỉnh sửa hồ sơ `AdminProfileModal`:
    - Dựa trên Radix Modal chuẩn của hệ thống, form nhập liệu đầy đủ cả 7 trường thông tin, kiểm tra tính hợp lệ cơ bản và cập nhật trực tiếp vào state danh sách kèm thông báo Sonner Toast.
- Cập nhật theo yêu cầu ngày 30/09:
  - Bảng danh sách chỉ giữ họ tên, số điện thoại, ngày sinh, giới tính và thao tác; bỏ các cột CCCD, nơi thường trú, nơi tạm trú để giảm chiều rộng.
  - Thêm thao tác **Xem chi tiết** dùng Modal chung, hiển thị đầy đủ thông tin định danh và hai địa chỉ ở chế độ chỉ đọc; giữ nguyên thao tác **Chỉnh sửa**.
- Kiểm tra cập nhật: `npm run typecheck`, `npm run lint`, `npm run build` đều đạt; build còn cảnh báo bundle lớn như trước. Chưa kiểm tra trực quan trên trình duyệt trong lượt này.
- Kiểm tra ngày 30/09: `npm run typecheck`, `npm run lint`, `npm run build` đều đạt 100%. Đã xác minh thực tế trên trình duyệt qua subagent (`admin_profiles_modal_1790702366358.png`).

## FE-TASK-32 — Phân hệ Giao diện Cổng Dịch vụ Công dân (Citizen Workspace)

- Người dùng yêu cầu: Sao chép layout giao diện của Admin (`admin-layout`), tùy biến hệ thống thanh điều hướng (Sidebar) và các màn hình dành riêng cho người dân với cấu trúc phân cấp.
- Cấu trúc thanh điều hướng công dân đã triển khai tại `src/pages/citizen/CitizenPage.tsx`:
  - **Dashboard**: Thống kê số lượng hồ sơ (đang xử lý, cần bổ sung, đã duyệt, đã hoàn thành), biểu đồ diện tích Recharts phản ánh xu hướng nộp & tra cứu, tiện ích thao tác nhanh, hồ sơ gần đây và lưu ý khi đến Một cửa.
  - **Tra cứu thủ tục**: Bảng tra cứu thủ tục hành chính công dân theo từ khóa và phân loại lĩnh vực (Hộ tịch, Chứng thực, Địa chính), nút chuẩn bị hồ sơ.
  - **Hồ sơ của tôi** (Hỗ trợ mở rộng/thu gọn và badge đếm số lượng hồ sơ):
    - Tất cả hồ sơ
    - Bản nháp
    - Chờ tiền kiểm
    - Cần chỉnh sửa
    - Đã gửi lại
    - Đã duyệt
    - Đã hoàn thành
  - **Chuẩn bị hồ sơ** (Hỗ trợ mở rộng/thu gọn):
    - Checklist (Danh mục giấy tờ cần chuẩn bị theo thủ tục, phần trăm hoàn thiện, check/uncheck)
    - Giấy tờ đã tải lên (Kho tài liệu điện tử dùng chung: CCCD, giấy chứng sinh, xác nhận cư trú)
    - Biểu mẫu (Kho e-form, khai trực tuyến, tải mẫu Word/PDF)
    - PDF đã tạo (Bản in phiếu hẹn, hồ sơ điện tử có mã vạch / mã QR tiền kiểm)
  - **Thông báo**: Hộp thư thông báo tiến độ tiền kiểm từ cán bộ Một cửa, đánh dấu đã đọc.
  - **Mã QR hồ sơ**: Trình hiển thị mã QR hồ sơ điện tử để quét tại Ki-ốt lấy số thứ tự hoặc xuất trình cho cán bộ tiếp nhận.
  - **Đánh giá dịch vụ**: Tích hợp `CitizenFeedbackModal` và màn hình lịch sử khảo sát sự hài lòng của công dân.
  - **Hồ sơ cá nhân**: Quản lý thông tin định danh công dân VNeID Mức 2 (Họ tên, CCCD, Ngày sinh, Giới tính, SĐT, Email, Nơi thường trú).
  - **Đăng xuất**: Hộp thoại xác nhận đăng xuất an toàn với toast thông báo và điều hướng về `/dang-nhap`.
- Cấu hình Route trong `src/app/App.tsx`: Hỗ trợ cả 2 đường dẫn `/citizen/*` và `/cong-dan/*`.
- Export module tại `src/pages/citizen/index.ts`.
- Đã sửa lỗi layout thanh điều hướng: Bổ sung các class `.admin-nav-parent`, `.admin-subnav-tree`, `.admin-subnav-btn` và `shrink-0` cho khối user trong [src/styles/globals.css](file:///e:/wardmate-frontend/src/styles/globals.css) để các mục con phân cấp cây không bị dính chùm ngang, có đường kẻ dọc liên kết, thụt lề chuẩn, icon và badge riêng biệt.
- Đã sửa lỗi layout màn hình danh sách hồ sơ: Loại bỏ nút trùng lặp `+ Nộp hồ sơ mới` bị co hẹp chữ trong thanh toolbar, thay bằng dropdown chọn lĩnh vực và nút `Lọc` chuẩn admin; tối ưu hóa hiển thị ghi chú cán bộ (line-clamp-2) và khoảng cách các nút thao tác (`Đánh giá`, `Chỉnh sửa`, `Mã QR`).
- Đã kiểm tra ngày 30/09: `npm run typecheck`, `npm run lint` đạt 100%; Đã chụp ảnh xác minh thực tế trên trình duyệt (`citizen_all_records_verified_1790701740720.png`).

## FE-TASK-31 — Modal Đánh giá Mức độ Hài lòng Công dân (Feedback)

- Người dùng xác nhận phạm vi: chỉ làm giao diện đánh giá với mock data, chưa có backend API.
- Đã tạo `CitizenFeedbackModal` tại `src/components/feedback/CitizenFeedbackModal.tsx` và kiểu dữ liệu `src/types/feedback.ts`.
- Giao diện modal đánh giá:
  - Đánh giá từ 1 đến 5 sao có nhãn tương ứng (Rất không hài lòng -> Rất hài lòng), hỗ trợ hover preview, radio group chuẩn WCAG AA và bàn phím.
  - Danh sách tiêu chí chất lượng phục vụ đa chọn (Thủ tục rõ ràng, thời gian tiền kiểm nhanh, hướng dẫn dễ hiểu, giao diện trực quan,...).
  - Khung nhập góp ý chi tiết kèm đếm ký tự (tối đa 500 ký tự).
  - Xử lý submit với hiệu ứng loading và màn hình cảm ơn ghi nhận thành công.
  - Đóng modal an toàn bằng phím Escape, click outside hoặc nút "Để sau".
- Tích hợp vào `src/pages/account/ProfilePage.tsx`: hiển thị danh sách hồ sơ tiền kiểm gần đây và nút mở modal đánh giá dịch vụ cho hồ sơ đã hoàn thành.
- Kiểm tra ngày 28/09: `npm run typecheck`, `npm run lint`, `npm run build` đều đạt; 4/4 test trong `tests/feedback.spec.ts` đạt; toàn bộ test regression đạt.
- Phần chưa làm: API lưu trữ và thống kê đánh giá người dân lên server backend.

## FE-TASK-25 — Chuông Thông báo & Danh sách Thông báo Người dùng

- Người dùng xác nhận phạm vi: chỉ làm giao diện với mock data, chưa có backend API.
- Đã triển khai `NotificationBell` và `NotificationItem` tại `src/components/notifications/`, tích hợp trên Header desktop và mobile của `MainLayout.tsx`.
- Badge đếm số tin chưa đọc hiển thị trực quan (`unreadCount`), tự động ẩn khi số lượng = 0, có `aria-label` hỗ trợ screen reader.
- Dropdown/dialog danh sách thông báo:
  - Header: Tiêu đề "Thông báo", badge số tin mới, nút "Đã đọc tất cả".
  - Bộ lọc: Tab "Tất cả" và "Chưa đọc".
  - Danh sách tin: Thể hiện rõ loại thông báo (`need_revision`, `approved`, `submitted`, `reminder`), ngữ cảnh thủ tục/mã hồ sơ, thời gian định dạng tiếng Việt, trạng thái đọc/chưa đọc.
  - Thao tác: Đánh dấu đã đọc từng tin, đánh dấu tất cả đã đọc, xóa tin, điều hướng đến chi tiết hồ sơ (`/tai-khoan`).
  - Trạng thái rỗng: Hiển thị minh họa khi không có thông báo hoặc đã đọc hết.
  - Phím tắt & tương tác: Hỗ trợ phím Escape, click outside, bẫy focus.
- Mock data & State: `src/data/mockNotifications.ts` và hook `src/hooks/useCitizenNotifications.ts` đồng bộ qua `localStorage`.
- Dữ liệu chuẩn theo `UI_UX_DESIGN_STANDARD.md` mục 18.1 & 19 (hư cấu, minh họa, bám sát nghiệp vụ tiền kiểm).
- Kiểm tra ngày 28/09: `npm run typecheck`, `npm run lint`, `npm run build` đều đạt; 6/6 test trong `tests/notifications.spec.ts` đạt; toàn bộ test regression (`landing.spec.ts`, `procedure-detail.spec.ts`, `design-system.spec.ts`) đạt.
- Phần chưa làm: API thông báo thời gian thực (WebSocket/SSE/REST API backend), push notification, phân trang thông báo khi có số lượng lớn từ server.

## FE-TASK-08 — Chi tiết thủ tục và parser content_payload

- Người dùng xác nhận chưa có schema BE; cho phép dùng cấu trúc mẫu frontend. Chỉ giao diện/dữ liệu mẫu, không gọi API.
- Route mới `/thu-tuc/:procedureId`; ví dụ `/thu-tuc/demo-1`. Danh sách dùng link thật; quay về giữ query/lĩnh vực/trang. Menu công cộng giữ mục thủ tục active khi xem chi tiết.
- Trang có breadcrumb, tên/lĩnh vực/mã minh họa, mục lục, thông tin chung, bảng cách thức–thời hạn–lệ phí, bảng căn cứ pháp luật và cơ quan tiếp nhận.
- Mobile chuyển bảng thành từng khối có nhãn. Có trạng thái không tìm thấy mã, dữ liệu trống, JSON lỗi và lỗi một phần.
- `src/lib/procedureContent.ts` nhận object hoặc chuỗi JSON, kiểm tra schema v1 và kiểu dữ liệu; bỏ row sai, giữ phần đúng, chặn URL ngoài HTTP/HTTPS hoặc chứa credentials. React render text, không chèn HTML.
- `src/data/mockPublicProcedures.ts` bổ sung content_payload minh họa. Không lấy số liệu pháp lý từ mock quản trị; không bịa mức phí/thời hạn/căn cứ/cơ quan. Các phần chưa xác minh hiện chờ xác nhận.
- Tham khảo các mục từ kết quả tìm kiếm Cổng Dịch vụ công Quốc gia; mở trang trực tiếp timeout/503, chưa đối chiếu toàn bộ giao diện nguồn.
- Hợp đồng mẫu và cách nối BE: `docs/procedure-content-payload.md`. Cần BE cung cấp response thật trước khi coi parser này tương thích API.
- Kiểm tra 28/09: typecheck, build và lint đạt; build còn cảnh báo bundle lớn. 18 test (15 landing + 3 detail/parser) đạt.
- Đã xem ảnh chi tiết ở 1440/390px; kiểm tra không tràn ngang ở 1440/768/390/360px. Chưa kiểm tra zoom 200% hay screen reader thực tế.
- Ngày 28/09, người dùng yêu cầu chia FE-TASK-07 và FE-TASK-08 thành 2 commit theo hạng mục và push lên origin/main. Đối chiếu lịch sử Git và remote để xác định trạng thái đồng bộ; không coi yêu cầu này là quyền push cho task sau.
- Phần chưa làm: lấy API/dữ liệu chính thức, tải/lỗi mạng, biểu mẫu, chuẩn bị/gửi hồ sơ.

## FE-TASK-07 — Danh sách tra cứu thủ tục công cộng

- Phạm vi người dùng chốt: chỉ giao diện, chưa có BE/API; dùng dữ liệu minh họa tại `src/data/mockPublicProcedures.ts`.
- Đã hoàn thiện trang `/thu-tuc`: 15 mẫu thuộc 3 lĩnh vực, tìm từ khóa có/không dấu và không phân biệt hoa thường, lọc kết hợp, chip bộ lọc, xóa lọc và trạng thái không có kết quả.
- Phân trang 5 mục/trang; có số trang, Trước/Sau, tổng kết quả và khoảng đang xem. Đổi từ khóa/lĩnh vực về trang 1; giới hạn trang không hợp lệ.
- Từ khóa, lĩnh vực và trang nằm trên URL; hỗ trợ tải lại và Back/Forward. Chuyển trang đưa focus về tiêu đề kết quả, cuộn mượt và tôn trọng reduced-motion.
- Tái sử dụng Button/Input/Badge/Toast; không thêm dependency, không thay danh mục phổ biến của trang chủ.
- Giao diện ghi rõ dữ liệu minh họa. FE-TASK-08 đã thay nút thông báo bằng link đến trang chi tiết mẫu; giữ bộ lọc khi quay lại.
- Không thêm API giả, độ trễ tải giả, phân quyền hay backend. Loading/lỗi mạng và dữ liệu chính thức sẽ nối khi có API.
- Kiểm tra ngày 28/09: typecheck, lint, production build đạt; Vite vẫn cảnh báo bundle lớn. 15 test trong `tests/landing.spec.ts` đạt, gồm test mới cho phân trang/URL/lọc kết hợp/trang sai.
- Đã kiểm tra không tràn ngang ở 1440, 1024, 768, 390, 360px và từ khóa dài; xem ảnh desktop 1440/mobile 390. Chưa kiểm tra zoom trình duyệt 200%.
- Commit FE-TASK-07: `51a5b07` — danh sách, tìm kiếm, bộ lọc và phân trang. FE-TASK-08 được tách thành commit riêng, kèm tài liệu schema và bàn giao.
- Bước tiếp theo: người dùng duyệt giao diện; khi có API danh sách/category, thay nguồn mock và nối tìm kiếm/phân trang theo contract thực tế.

## Trạng thái nền tảng trước FE-TASK-07

- Hạng mục đã triển khai: Design System Core và khung Axios interceptor JWT.
- Auth được kiểm thử bằng mock; chưa kết nối API thật vì người dùng chưa có hợp đồng backend.
- Ba commit triển khai đã push lên `origin/main`; lần kiểm tra trước khi tạo tài liệu này: local/remote đồng bộ, workspace sạch.
- Remote: `https://github.com/wardmate-capstone/wardmate-frontend.git`.
- Đã hoàn thiện `AGENTS.md` và ghi chú tiến độ. Người dùng yêu cầu đưa hai tài liệu lên GitHub trong một commit tài liệu; đối chiếu lịch sử Git và `origin/main` để xác định trạng thái đồng bộ hiện tại.

## Nhu cầu đã chốt với người dùng

- Làm trước phần không cần API; người dùng sẽ cung cấp backend sau.
- Agent chọn giải pháp phù hợp, tối ưu cho dự án; hỏi trước khi phần việc có điểm mơ hồ thực sự.
- Khi hết phiên, đưa về đăng nhập và giữ đích quay lại để tiếp tục công việc.
- Khi được yêu cầu push, chia commit theo nhóm vừa đủ và mô tả đầy đủ.
- Người dùng muốn làm việc trong Codex CLI và tiếp tục được sau khi đóng VS Code; cần ghi chú bền vững giữa các phiên.
- Không yêu cầu cài thêm memory server trong task này.

## Đã hoàn thành

| Hạng mục | Kết quả / vị trí |
| --- | --- |
| UI core | `src/components/ui/`: Button, Input, Modal, Badge, Toast và export chung |
| Button | Thêm loading, disabled khi loading và aria-busy; giữ variant/size hiện có |
| Input | Label, hint, error, aria-describedby/aria-invalid; áp dụng vào đăng nhập/đăng ký |
| Modal | Radix, focus trap, Escape, trả focus cả khi mở bằng code, bố cục mobile |
| Toast | Module dùng chung; chuyển Toaster và thông báo các trang sang module này |
| JWT client | `src/lib/api/createJwtClient.ts`: gắn Bearer, gom refresh đồng thời, retry tối đa một lần, xử lý 401 đến trễ |
| Quản lý phiên | Chặn kết quả refresh của phiên cũ sau logout/đổi phiên; request hủy không gửi lại |
| Lỗi refresh | 401/403 từ refresh hoặc retry vẫn 401 thì hết phiên; lỗi mạng/server giữ phiên để thử lại |
| Điều hướng | `src/lib/authRedirect.ts`: returnTo an toàn; AuthPage hiện lý do hết phiên |
| Cấu hình | `.env.example` để trống VITE_API_BASE_URL; không gọi endpoint giả |
| Tài liệu | `design-system-and-auth.md`: cách dùng core và nối backend |
| Ví dụ UI | `tests/fixtures/ui.html`, `tests/fixtures/ui.tsx`: dùng khi chạy Vite dev |

Các modal/badge nghiệp vụ cũ chưa được chuyển đồng loạt sang core. Không tự mở rộng phạm vi refactor.

## Commit đã push

- `f2a76a2` — `feat(ui): complete reusable design system core`
- `04f23a7` — `feat(auth): add configurable Axios JWT refresh interceptor`
- `607b7d8` — `feat(auth-ui): integrate core inputs and session-expiry guidance`

## Bằng chứng kiểm tra gần nhất

Các kết quả dưới đây thuộc lượt triển khai core/auth ngày 26/09; kiểm tra riêng FE-TASK-07 được ghi ở đầu file:

- Production build đạt; có cảnh báo Vite về bundle lớn, chưa xử lý chia bundle.
- TypeScript và ESLint đạt; đã chạy lại sau chỉnh sửa cuối của Modal.
- 28 test riêng biệt đạt qua các lượt chạy: 10 JWT, 4 design-system, 14 landing.
- Đã xem ảnh mobile của form hết phiên và Modal; không thấy lỗi bố cục trong các ảnh đã kiểm tra.
- Không phải kiểm thử API thật, cũng không phải xác nhận toàn bộ test của mọi workspace đều đã chạy.
- Task tài liệu ngày 26/09 chỉ kiểm tra nội dung/đường dẫn/diff; không chạy lại build hay test ứng dụng.

## Phần còn chờ sau tích hợp Auth

- BE local đang chạy và tài khoản kiểm thử để kiểm tra thật 4 API/cookie/CORS/CSRF; hiện chỉ có bằng chứng mock FE.
- Quy tắc username/password và mẫu lỗi validation chi tiết để đối chiếu thêm với BE. Giữ validation đăng ký tối thiểu 8 ký tự hiện có, không tự đặt policy mới.
- `/me`, roles/permissions, route protection, user thật trên header và API nghiệp vụ đều được người dùng hoãn; không coi các workspace mock đang được bảo vệ chỉ vì auth đã nối.
- “Ghi nhớ đăng nhập” còn bỏ qua; cookie hiện có thời hạn do BE quyết định. Không lưu token vào storage để làm checkbox này.
- Access token mất sau reload; interceptor đã có thể khôi phục qua cookie khi gặp request 401. Chuyển trang khi hết phiên vẫn không bảo đảm giữ nội dung form chưa lưu.
- Theo bàn giao BE, logout thu hồi refresh hiện tại; access token đã phát còn hiệu lực đến hết hạn (chưa có blacklist).

## Công cụ cá nhân trên máy người dùng

- Ponytail 4.10.0 đã được xác minh installed/enabled qua Codex CLI ở phiên thiết lập.
- Ảnh người dùng từng gửi cho thấy 3 hooks chờ review. Đã hướng dẫn chấp thuận, chưa có bằng chứng xác nhận trạng thái Active sau đó.
- Không coi Ponytail là bộ nhớ hội thoại hoặc dependency của repository.
- CLI đã xác minh hỗ trợ `codex resume` và `codex resume --last`.
- Alias PowerShell từng hướng dẫn chỉ có hiệu lực trong terminal đó; chưa thiết lập alias bền vững.
- Không tự cài/chỉnh plugin hoặc profile cá nhân khi chỉ đang làm task frontend.

## Bắt đầu lần làm việc tiếp theo

1. Đọc yêu cầu mới, file này và `../AGENTS.md`; kiểm tra Git.
2. Nếu chưa có API và chưa có task mới, báo phần đang chờ; không tự dựng backend hay giả định hợp đồng.
3. Kiểm tra lịch sử Git trước khi tạo commit để không lặp lại công việc đã hoàn thành.
4. Sau công việc có thay đổi, cập nhật ghi chú cho đúng trạng thái mới; không tích lũy các mục đã lỗi thời.
