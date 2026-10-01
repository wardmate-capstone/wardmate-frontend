# Tiến độ và bàn giao WardMate

Cập nhật: 01/10/2026.
Mục đích: giúp phiên Codex mới tiếp tục đúng công việc và quyết định đã thống nhất.
Đọc cùng `../AGENTS.md`; luôn xác minh lại bằng code và Git trước khi hành động.

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

- Người dùng chọn `src/pages/AdminPage.tsx` làm mẫu dashboard quản lý; phạm vi lần này chỉ `procedure-manager`, giữ chức năng hiện có.
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

- Người dùng yêu cầu: Thêm trang giao diện AdminProfiles tại [src/pages/AdminPage.tsx](file:///e:/wardmate-frontend/src/pages/AdminPage.tsx) quản lý 7 thuộc tính định danh cá nhân:
  1. `fullName`: Họ và tên
  2. `identityNumber`: Số CCCD / Mã định danh cá nhân (12 số)
  3. `phoneNumber`: Số điện thoại liên hệ
  4. `dateOfBirth`: Ngày sinh (định dạng YYYY-MM-DD / DD/MM/YYYY)
  5. `gender`: Giới tính (Nam / Nữ / Khác)
  6. `permanentAddress`: Nơi thường trú
  7. `temporaryAddress`: Nơi tạm trú / Nơi ở hiện tại
- Triển khai trong [src/pages/AdminPage.tsx](file:///e:/wardmate-frontend/src/pages/AdminPage.tsx):
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
- Tích hợp vào `src/pages/ProfilePage.tsx`: hiển thị danh sách hồ sơ tiền kiểm gần đây và nút mở modal đánh giá dịch vụ cho hồ sơ đã hoàn thành.
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

## Phần đang chờ backend

Cần người dùng cung cấp:
1. Base URL và endpoint login, refresh, logout.
2. Method, request/response mẫu và định dạng lỗi.
3. Refresh token dùng cookie HttpOnly hay JSON; quy tắc credentials/CORS và rotation.
4. Cách khôi phục phiên, thời hạn token và yêu cầu “Ghi nhớ đăng nhập”.
5. Thông tin user/role và quy tắc truy cập nếu task tiếp theo bao gồm phân quyền.

Khi có contract:
- Nối refresh adapter trong `src/lib/api/index.ts` bằng transport riêng.
- Nối login thật với `skipAuth: true`, kiểm tra response rồi đặt access token.
- Chỉ sau login thành công mới quay lại `safeReturnTo(...)`.
- Nối logout và khôi phục phiên theo contract; bổ sung test tích hợp tương ứng.
- Không đánh dấu route protection hoặc phân quyền là đã hoàn tất từ interceptor hiện có.

Giới hạn hiện tại:
- Access token chỉ nằm trong bộ nhớ, reload sẽ mất.
- Form đăng nhập/đăng ký chỉ kiểm tra dữ liệu và thông báo; chưa xác thực người dùng.
- returnTo đã được giữ, nhưng luồng quay lại sau login thật chưa nối.
- Chuyển trang khi hết phiên không bảo đảm giữ nội dung form chưa lưu.

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
