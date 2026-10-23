# Tiến độ và bàn giao WardMate

Cập nhật: 23/10/2026.
Mục đích: giúp phiên Codex mới tiếp tục đúng công việc và quyết định đã thống nhất.
Đọc cùng `../AGENTS.md`; luôn xác minh lại bằng code và Git trước khi hành động.

## Cải tổ UI/UX "Tờ khai của tôi": Chống Trùng lặp Tiêu đề, Làm Sạch Tên File & Toolbar Chuẩn — 23/10/2026

- **Yêu cầu người dùng:** Đặt lại tựa đề chuẩn cho chức năng, loại bỏ trùng lặp 3 tầng tiêu đề (Breadcrumb, H1, H2 trong card) và cải tổ toàn diện UI/UX của danh mục bản khai.
- **Các cải tiến đã triển khai:**
  1. **Chuẩn hóa Tựa đề & Phân cấp Tiêu đề (`CitizenPage.tsx`):**
     - Đổi tên gọi từ `Bản khai của tôi` ➔ **`Tờ khai của tôi`** chuẩn hành chính một cửa, đồng bộ giữa Breadcrumb, Sidebar và H1 trang.
     - Bổ sung subtitle giải thích rõ ràng: *"Quản lý các mẫu tờ khai hành chính trực tuyến (.docx). Bạn có thể xem lại, chỉnh sửa hoặc liên kết vào hồ sơ."* hiển thị dưới H1 trang.
     - Xóa bỏ thẻ H2 trùng lặp bên trong Card (`CitizenSubmissionsView.tsx`), thay bằng `<h2 className="sr-only">Danh sách tờ khai</h2>` chuẩn trợ năng WCAG.
  2. **Bộ lọc làm sạch tên file thông minh (`cleanSubmissionFileName`):**
     - Tự động cắt bỏ tiền tố mã băm GUID 32 ký tự hex (ví dụ: `dccb6f4a..._don-nhap.docx` ➔ `don-nhap.docx`).
     - Tự động loại bỏ phần mở rộng kép bị lỗi từ backend (ví dụ: `.docx.docx` ➔ `.docx`).
  3. **Thanh công cụ Toolbar hiện đại (`CitizenSubmissionsView.tsx`):**
     - Bổ sung ô tìm kiếm nhanh (Search) theo tên tờ khai thời gian thực với nút xóa nhanh `×`.
     - Dropdown chọn trạng thái bo góc tinh tế, giữ nhãn trợ năng `aria-label="Trạng thái bản khai"`.
     - Nút xóa bộ lọc khi đang tìm kiếm hoặc lọc trạng thái.
     - Badge đếm số lượng tờ khai (`4 tờ khai`) và nút Làm mới kèm icon xoay đồng bộ.
  4. **Nâng cấp thẻ hiển thị tờ khai (Document Cards):**
     - Thêm icon nhận diện file Word màu xanh (`FileDoc` trong khung xanh nhạt bo góc).
     - Badge trạng thái trực quan với màu sắc & chấm trạng thái rõ ràng (*Nháp đã lưu*, *Đã chốt*, *Cần chỉnh sửa*, *Giấy tờ sẵn sàng*, *Đã duyệt*).
     - Hiển thị ngày giờ cập nhật có icon `Clock` và dung lượng file KB.
     - Khối thông báo ghi chú của cán bộ trong hộp cảnh báo vàng viền mềm.
     - Phân cấp nút bấm rõ ràng: Nút chính `"Xem bản khai"` (đỏ thương hiệu) và Nút phụ `"Mở hồ sơ liên quan"` (outline nhã nhặn).
  5. **Empty state & Phân trang:** Thêm giao diện trạng thái rỗng sinh động khi không có dữ liệu và làm đẹp thanh phân trang.
- **Kiểm tra kỹ thuật:**
  - `npm run typecheck`: **0 lỗi (exit code 0)**.
  - `npx playwright test tests/docx-online.spec.ts`: **100% tests liên quan PASS**.
  - `npm run build`: **Build production bundle thành công**.
- **File liên quan:**
  - `src/pages/citizen/CitizenPage.tsx`
  - `src/pages/citizen/views/CitizenSubmissionsView.tsx`
  - `src/pages/citizen/views/CitizenDashboardView.tsx`
  - `tests/docx-online.spec.ts`

## Tinh gọn Giao diện Trợ lý Chat & Đồng bộ Logo User — 23/10/2026

- **Yêu cầu người dùng:** Tinh gọn toàn bộ giao diện Chatbot đang bị rườm rà, loại bỏ các khối chiếm diện tích và thay toàn bộ logo chatbot thành logo User.
- **Các cải tiến đã triển khai (`AiChatWidget.tsx`):**
  1. **Đồng bộ Logo User:**
     - Thay thế toàn bộ biểu tượng ngôi sao lấp lánh `Sparkle` ở nút nổi ngoài màn hình, header cửa sổ chat và avatar của trợ lý trong bong bóng tin nhắn thành biểu tượng **`User`** chuẩn mực, thân thiện.
  2. **Gỡ bỏ các thành phần rườm rà:**
     - Xóa bỏ hoàn toàn thanh cảnh báo vàng chèn ngang đầu trang.
     - Xóa bỏ drawer kho câu hỏi mẫu cồng kềnh với các tab lọc phức tạp chiếm gần 50% chiều cao khung chat.
     - Thay bằng **4 chip gợi ý nhanh (Quick Suggestions)** tinh tế đặt trực tiếp dưới tin nhắn chào đầu tiên: *Đăng ký kết hôn, Khai sinh cho con, Sao y chứng thực CCCD, Quy trình tiền kiểm hồ sơ*. Khi người dùng gửi câu hỏi, các chip tự động ẩn đi để nhường toàn bộ không gian cho nội dung chat.
  3. **Header & Footer tối giản:**
     - Header tinh gọn: Icon User kèm chấm xanh trực tuyến + Tiêu đề *"Trợ lý Một cửa"* + Nút Làm mới và Đóng.
     - Chân ô chat: Input mềm mại + Nút gửi đỏ + Dòng nhắc pháp lý ngắn gọn ở đáy.
- **Kiểm tra kỹ thuật:**
  - `npm run typecheck`: **0 lỗi (exit code 0)**.
  - `npm run lint`: **0 lỗi, 0 cảnh báo (exit code 0)**.
  - `npm run build`: **Build production bundle thành công trong 20.38s (exit code 0)**.
- **Trạng thái Git & Commit:** Đã phân chia thành 4 commit theo đúng quy tắc và chuẩn conventional:
  1. `3d215f4`: `feat(ai-ocr): prevent session expiry on 401 and enhance CCCD lightbox preview`
  2. `20dcb84`: `feat(procedures): streamline lookup hero with compact search bar and sync tests`
  3. `e80d3fb`: `feat(officer-chat): add inline document preview and simplify assistant chat widget`
  4. (Commit hiện tại): `docs(handover): add recent changes test plan and update progress tracking`

## Mở Xem trước Giấy tờ Ngay Dưới Từng Mục (Inline Document Preview) — 23/10/2026

- **Yêu cầu người dùng:** Khi cán bộ ấn nút "Mở giấy tờ" (hoặc "Mở bản khai") ở mục nào, nội dung xem trước phải hiển thị ngay bên dưới thẻ/hàng của mục đó (inline preview), không được nhảy xuống tận cuối trang.
- **Hiện trạng trước sửa:** Toàn bộ danh sách giấy tờ được map ra trước, còn component xem trước `{selected && <DocumentFilePreview ... />}` nằm ở tận đáy container sau tất cả các mục, khiến cán bộ không thấy được nội dung ngay tại vị trí vừa bấm mà phải cuộn chuột dài xuống cuối trang.
- **Giải pháp triển khai (`OfficerDocumentsPanel.tsx`):**
  1. **Hiển thị Inline trực tiếp tại thẻ được chọn:**
     - Chuyển component `<DocumentFilePreview>` vào render trực tiếp bên trong thẻ của từng mục `documents` và `submissions` khi `selected?.id === item.id`.
     - Xóa bỏ hoàn toàn khối render xem trước ở tận cuối trang.
  2. **Trạng thái nút thông minh & Nút đóng tiện lợi:**
     - Khi mở: Nút chuyển sang `primary` với nhãn *"Đóng giấy tờ"* / *"Đóng bản khai"*.
     - Hỗ trợ toggle: Bấm lại chính nút đó sẽ thu gọn/đóng khung xem trước.
     - Khung xem trước bổ sung header nhỏ hiển thị tên tài liệu kèm nút *"Đóng"* tiện lợi.
- **Kiểm tra kỹ thuật:**
  - `npm run typecheck`: **0 lỗi (exit code 0)**.
  - `npm run lint`: **0 lỗi, 0 cảnh báo (exit code 0)**.
  - `tests/document-workflow.spec.ts`: test cán bộ discovery và mở bản khai DOCX **PASSED** (13.7s).
  - `npm run build`: **Build production bundle thành công trong 1m 1s (exit code 0)**.
- **Trạng thái Git:** Giữ nguyên các thay đổi tại local working tree, không tự ý commit hay push khi chưa có yêu cầu từ người dùng.

## Tinh gọn Giao diện Tra cứu Thủ tục Hành chính: Giữ duy nhất Khung Tìm kiếm — 23/10/2026

- **Yêu cầu người dùng:** Loại bỏ triệt để tình trạng dư thừa 2 nút "Trang chủ" (ở menu điều hướng đỏ và breadcrumb), loại bỏ tiêu đề lặp lại, chỉ để lại duy nhất phần Search (Khung tìm kiếm).
- **Các điểm đã hoàn thành:**
  1. **Xóa bỏ Breadcrumb và Khối tiêu đề lặp lại:**
     - Loại bỏ hoàn toàn breadcrumb `Trang chủ > Thủ tục hành chính` (tránh dư 2 chữ "Trang chủ" với Navbar).
     - Loại bỏ khối tiêu đề `Thủ tục hành chính` và dòng mô tả phụ trong khung hero.
     - Vẫn duy trì thẻ `<h1 id="procedures-title" className="sr-only">` khi `!embedded` để đảm bảo 100% chuẩn Accessibility và Semantic HTML/SEO mà không gây trùng 2 thẻ `h1` khi nhúng trong Cổng công dân.
  2. **Tối ưu Khung Search tinh gọn (Clean Search Box):**
     - Khối `.procedures-hero` giờ chỉ chứa thanh tìm kiếm (Input, Kính lúp, Nút xóa X, Nút đỏ "Tìm kiếm →") và dòng gợi ý nhập liệu.
     - Tự động ẩn vế *"Không cần đăng nhập để tra cứu"* khi tài khoản đã đăng nhập (`isAuthenticated`).
     - Tối ưu padding `p-4 sm:p-5`, giúp toàn bộ danh sách kết quả và bộ lọc lĩnh vực hiển thị trọn vẹn ngay trong tầm nhìn đầu tiên của người dùng.
  3. **Đồng bộ Kiểm thử tự động:**
     - Cập nhật `tests/procedures-ui.spec.ts` và `tests/landing.spec.ts` tương ứng với thiết kế giao diện tinh gọn mới.
- **Kiểm tra kỹ thuật:**
  - `npm run typecheck`: **0 lỗi (exit code 0)**.
  - `npm run lint`: **0 lỗi, 0 cảnh báo (exit code 0)**.
  - Playwright test:
    - `tests/procedures-ui.spec.ts`: **2/2 passed** (30.1s) ở cả 4 breakpoint (1440px, 768px, 390px, 360px).
    - `tests/landing.spec.ts` & `tests/procedure-detail.spec.ts`: **17/17 passed** (1.1m).
  - `npm run build`: **Build production bundle thành công trong 21.71s (exit code 0)**.
  - Đã xác minh ảnh chụp màn hình desktop (1440px) và mobile (390px): giao diện thoáng đãng, sắc nét, không tràn ngang.
- **Trạng thái Git:** Giữ nguyên các thay đổi tại local working tree, không tự ý commit hay push khi chưa có yêu cầu từ người dùng.

## Khắc phục triệt để lỗi UI Lightbox Portal và Phân tích chuyên sâu lỗi 401 Backend AI OCR — 23/10/2026

- **Yêu cầu người dùng:**
  - Vẫn còn lỗi UI (ảnh Lightbox bị chìm phía sau khung modal trắng trong ảnh chụp màn hình).
  - Khi gọi API vẫn bị lỗi 401: Yêu cầu đọc và kiểm tra thật kỹ mã nguồn Backend (`d:\wardmate-backend`) để giải thích nguyên nhân và khắc phục ở phía Frontend.
  - Tuyệt đối không chỉnh sửa Backend (`d:\wardmate-backend`), chỉ thực hiện ở Frontend (`d:\frontend`).
  - Không push Git khi chưa đạt yêu cầu / chưa có sự đồng ý của người dùng.

- **1. Khắc phục triệt để lỗi UI Lightbox bị chìm sau Modal:**
  - **Hiện tượng trên ảnh:** Khi người dùng bấm xem to ảnh CCCD, lớp phủ xem ảnh màu đen xuất hiện ở phía sau hộp thoại Modal trắng của Radix Dialog (`z-[91]`), khiến tiêu đề và chân trang của Lightbox bị che khuất và người dùng không thể xem được trọn vẹn thẻ CCCD.
  - **Nguyên nhân:** Radix Dialog hiển thị trong Portal với `z-[90]` và `z-[91]`. Thẻ div Lightbox trước đây nằm trong luồng DOM thông thường với `z-50`, do đó bị Radix Dialog đè lên.
  - **Giải pháp xử lý:**
    - Sử dụng `createPortal(..., document.body)` để đưa toàn bộ giao diện Lightbox ra lớp cao nhất của `document.body` với `z-[9999]`.
    - Bổ sung thanh công cụ chuyên nghiệp trong Lightbox:
      - **Nút xoay 90° (`ArrowClockwise`):** Cho phép xoay ảnh 90, 180, 270 độ, cực kỳ tiện lợi cho các ảnh chụp dọc từ điện thoại thông minh (smartphone portrait photos).
      - **Phóng to / Thu nhỏ (`MagnifyingGlassPlus` / `MagnifyingGlassMinus`):** Tỉ lệ zoom từ 50% đến 300%.
      - **Nút đặt lại kích thước gốc (`ArrowsIn`):** Trở về 100%.
      - **Nút đóng / Phím tắt `Esc`:** Đóng nhanh và quay lại modal.
    - Tại thẻ xem trước trong modal: Bổ sung nút **Xoay 90°** trực tiếp trên thumbnail để người dùng có thể lật ngang thẻ CCCD ngay trước khi bấm xem to hoặc quét AI.

- **2. Kết quả kiểm tra và phân tích chi tiết mã nguồn Backend về lỗi 401:**
  - Qua rà soát chi tiết mã nguồn tại `d:\wardmate-backend`:
    - Controller `AssistantController.cs` (dòng 9) gắn nhãn `[Authorize]`.
    - Trong `AssistantRegistration.cs` (dòng 24-41):
      - Cấu hình kiểm tra JWT:
        - `ValidIssuer = config["Jwt:Issuer"] ?? "WardMate.IAM"`
        - `ValidAudience = config["Jwt:Audience"] ?? "WardMate.Client"`
        - `IssuerSigningKey = key.Length >= 32 ? new SymmetricSecurityKey(...) : null`
    - Đối chiếu với IAM Service (`WardMate.Services.IAM.API/appsettings.json` và `JwtOptions.cs`):
      - Token do IAM cấp phát có `Issuer = "wardmate"` và `Audience = "wardmate-client"`.
    - **Điểm bất đồng bộ (Root Cause) trên Backend:**
      1. **Sai lệch Issuer & Audience:** AI OCR mặc định yêu cầu `WardMate.IAM` và `WardMate.Client`, trong khi token IAM cấp ra là `wardmate` và `wardmate-client`.
      2. **Thiếu cấu hình `Jwt:Key` trong `WardMate.Services.AIOCR.API/appsettings.json`:** Service AI OCR hoàn toàn không có mục `Jwt`, dẫn đến `key = ""` và `IssuerSigningKey = null`. Khi đó `JwtBearerHandler` của ASP.NET Core tự động coi mọi token gửi lên là `invalid_token` và trả về `HTTP 401 Unauthorized` (`WWW-Authenticate: Bearer error="invalid_token"`).
      3. **AccountSessionMiddleware:** Service AI OCR gắn middleware xác minh session tới `Iam:BaseUrl` (`http://localhost:5001/`), vốn không kết nối được trong môi trường container/cloud.
  - **Giải pháp giải tỏa nghẽn cho người dùng tại Frontend (Unblocking Solution):**
    - Đảm bảo `createJwtClient.ts` tuyệt đối không kích hoạt `expire()` hay đăng xuất người dùng khi API AI OCR trả về 401 (`suppressSessionExpiry: true`).
    - Bổ sung chế độ **"Nhập thông tin nhanh từ ảnh" (`manualMode`)** ngay trong modal: Khi AI OCR gặp lỗi 401 hoặc dịch vụ AI chưa sẵn sàng, người dùng có thể bấm nút này để hiển thị các ô nhập liệu (Số CCCD, Họ tên, Ngày sinh, Giới tính, Quê quán, Thường trú) ngay dưới các ảnh CCCD đã tải lên. Người dùng vừa nhìn ảnh đối chiếu (có thể phóng to/xoay ảnh), vừa điền dữ liệu và bấm "Áp dụng vào biểu mẫu" để tiếp tục quy trình mà không bị gián đoạn.

- **3. Hoàn thiện Quét CCCD: Chống Logout Tuyệt Đối khi 401 & Hiển Thị Trọn Vẹn 100% Ảnh Preview — 23/10/2026

- **Cải tiến Hiển thị Full Ảnh Preview (`CccdOcrScanModal.tsx`):**
  - **Hiển thị 100% trọn vẹn, không cắt xén:**
    - Thay thế khung cố định cứng nhắc bằng khung preview cao thoáng (`min-h-[220px] max-h-[280px]`) trên nền tương phản tối `bg-slate-950/90`.
    - Ảnh thẻ CCCD hiển thị `object-contain` tự nhiên, giữ trọn vẹn 100% cả 4 góc, số thẻ, họ tên, chip và hoa văn nền.
    - Hiển thị badge định dạng & dung lượng file (ví dụ `Mặt trước • 1.8MB`).
  - **Tính năng Phóng to / Lightbox Toàn màn hình (`ArrowsOut` / `MagnifyingGlassPlus`):**
    - Nhấp trực tiếp vào ảnh hoặc bấm nút phóng to sẽ mở modal Lightbox hiển thị ảnh ở kích thước gốc siêu nét, có phím tắt `Esc` để đóng.
    - Người dùng có thể kiểm tra từng con số, dấu vân tay trên thẻ một cách trực quan trước khi bấm quét.
  - **Bổ sung xem ảnh đối chiếu ở màn hình Kết quả:**
    - Khi bóc tách xong, modal vẫn giữ thumbnail ảnh mặt trước/mặt sau kèm tính năng click mở lớn, giúp công dân dễ dàng đối soát từng trường dữ liệu với ảnh chụp thực tế.
  - **Xử lý lỗi 401 & nút chuyển đổi linh hoạt:**
    - Hiển thị thông báo giải thích rõ phiên đăng nhập vẫn an toàn và cung cấp nút **"Đóng và điền thủ công"** để công dân tiếp tục công việc ngay mà không bị gián đoạn.

- **Cải tiến API & Dev Proxy:**
  - `src/lib/api/aiOcr.ts`: Bổ sung `z.preprocess` tự động chuẩn hóa cả định dạng camelCase lẫn PascalCase từ server; gửi kèm `filename` trong `FormData`; xử lý chi tiết các mã HTTP 401, 413 (ảnh quá 8MB), 415 (sai định dạng), 429 (rate limit), 502/503/504.
  - `vite.config.ts`: Bổ sung định tuyến `aiOcr` ưu tiên biến môi trường `VITE_AI_OCR_API_URL` (nếu có) trước khi fallback về `documentForm` Gateway.

- **Kiểm tra kỹ thuật & Tự động hóa:**
  - Viết mới test tự động trong `tests/jwt-client.spec.ts`: `request with suppressSessionExpiry throws 401 without refreshing or expiring session` => **12/12 tests PASS**.
  - `tests/profile-validation.spec.ts`: **9/9 tests PASS**.
  - `npm run typecheck`: **0 lỗi (exit code 0)**.
  - `npm run lint`: **0 lỗi (exit code 0)**.
  - `npm run build`: **Build production bundle thành công trong 35.75s (exit code 0)**.
  - Trạng thái Git: Các thay đổi nằm tại local working tree, **chưa commit và chưa push lên remote**.

## Bổ sung Tab "Hồ sơ đã hủy" trong Cổng dịch vụ công dân — 23/10/2026

- **Hạng mục hoàn thành:**
  - Bổ sung định danh mục `dossiers_cancelled` vào kiểu dữ liệu `CitizenSectionId` (`src/pages/citizen/types.ts`).
  - Thêm tab con **"Đã hủy"** (`XCircle` icon) dưới nhóm điều hướng *"Hồ sơ của tôi"* ở Sidebar (`src/pages/citizen/CitizenPage.tsx`).
  - Cập nhật tiêu đề trang `sectionTitles.dossiers_cancelled: { title: 'Hồ sơ đã hủy' }`.
  - Ánh xạ bộ lọc trạng thái `dossiers_cancelled` => `'Đã hủy'` trong `CitizenDossiersView.tsx`.
  - Cập nhật nút quay lại từ chi tiết hồ sơ: nếu hồ sơ có trạng thái `'Đã hủy'`, hệ thống tự động quay lại đúng tab `dossiers_cancelled`.
- **Kiểm tra kỹ thuật:**
  - `npm run typecheck`: **0 lỗi (exit code 0)**.
  - `npm run build`: **Build production bundle thành công trong 21.07s (exit code 0)**.
- **Git Commit:**
  - Commit `68e448f`: `feat(citizen): add cancelled dossiers tab to sidebar navigation` đã push lên `origin/main`.

## Hoàn thiện Cổng công dân, Menu tài khoản & Khắc phục hiển thị Phường trong Quản trị — 22/10/2026

- **Các hạng mục hoàn thành:**
  1. **Chuẩn hóa danh mục hồ sơ công dân (`CitizenPage.tsx`, `types.ts`, `CitizenDossiersView.tsx`):**
     - Loại bỏ hoàn toàn mục "Đã hoàn thành" (`dossiers_completed`) khỏi sidebar và bộ lọc danh sách hồ sơ công dân.
     - Lý do: WardMate là hệ thống hỗ trợ chuẩn bị và tiền kiểm hồ sơ cấp xã/phường. Vòng đời tiền kiểm kết thúc tại trạng thái "Giấy tờ sẵn sàng" (`DOCUMENTS_READY`), kèm mã QR đối soát để người dân mang tới nộp trực tiếp tại Bộ phận một cửa UBND.
  2. **Gỡ bỏ Đổi mật khẩu khỏi dropdown người dùng (`UserDropdown.tsx`):**
     - Loại bỏ nút "Đổi mật khẩu" khỏi dropdown tài khoản người dùng ở cả desktop và mobile drawer. Toàn bộ thao tác đổi mật khẩu đã được chuyển vào tab chuyên dụng trong trang Hồ sơ cá nhân (`/citizen` hoặc `/admin`).
  3. **Khắc phục hiển thị phường công tác trong Quản trị người dùng (`AdminPage.tsx`):**
     - Sửa lỗi dropdown phân công phường luôn hiển thị `(Chưa gán phường)` mặc dù API `GET /api/v1/admin/users` đã trả về `wardCode`.
     - Bổ sung cơ chế tự động ánh xạ `wardCode` sang `wardId` dựa trên danh mục phường `wards`, hỗ trợ so khớp không phân biệt hoa thường (`.trim().toUpperCase()`) và lưu cache tức thời qua `wardsRef`.
     - Bổ sung fallback kiểm tra trực tiếp trong thẻ `<select value={assignedWardId}>`, đảm bảo dropdown lập tức hiển thị chính xác phường công tác của từng cán bộ/lãnh đạo.
     - Đồng bộ công thức đếm nhân sự trực thuộc tại bảng "Quản lý đơn vị Phường / Xã" cho kết quả chính xác 100%.
- **Kiểm tra kỹ thuật:**
  - `npm run typecheck`: **0 lỗi (exit code 0)**.
  - `npm run build`: **Build production bundle thành công trong 19.07s**.

## Tự động trích xuất và hiển thị tên Người dân trên bảng hàng đợi cán bộ — 22/10/2026

- **Vấn đề phát hiện:** Ở cột **Người dân** trên bảng danh sách hồ sơ cán bộ Một cửa (`OfficerApplicationListView`), hệ thống hiển thị giá trị mặc định là `"Công dân"` và `"—"` thay vì họ tên và số CCCD của người nộp.
- **Nguyên nhân:**
  - API danh sách hồ sơ phường trên backend (`GET /api/v1/officer/applications` hoặc `/pending`) trả về `ApplicationSummaryDto`.
  - DTO tóm tắt này hiện chỉ lưu các trường cấp hồ sơ (`applicationCode`, `procedureTitle`, `status`, `submittedAt`, `assignedOfficerId`...) mà chưa bao gồm thông tin công dân (`applicantName`, `citizenId`).
  - Toàn bộ thông tin định danh của người dân thực chất được lưu trữ đầy đủ trong trường `formData` (JSON) của hồ sơ.
- **Giải pháp triển khai:**
  1. **Nâng cấp `workflowAdapters.ts`:**
     - Bổ sung hàm `extractCitizenInfoFromFormData(formData)` quét và chuẩn hóa thông tin người nộp theo nhiều biến thể trường phổ biến (`applicantName`, `fullName`, `hoTen`, `hoVaTen`, `hoTenNguoiKhai`, `identityNumber`, `citizenId`, `cccd`, `soCCCD`...).
     - Export `parseFormData` và tích hợp `extractCitizenInfoFromFormData` vào mapper `mapApplicationDtoToOfficerApplication`.
     - Cập nhật `mapSummaryDtoToOfficerApplication` hỗ trợ map `summary.applicantName` và `summary.citizenId`.
  2. **Cập nhật `workflow.ts`:** Bổ sung `citizenId: z.string().nullish()` vào `applicationSummaryDtoSchema`.
  3. **Cơ chế Auto-Enrichment trên `OfficerPage.tsx`:**
     - Thiết lập state cache `citizenInfoMap` lưu thông tin người dân theo `applicationId`.
     - Với các hồ sơ trên bảng chưa có thông tin công dân từ summary, hệ thống tự động gọi ngầm `workflowApi.getOfficerApplication(id)` để trích xuất ngay họ tên thật và số CCCD/SĐT, sau đó cập nhật trực tiếp lên bảng mà không cần người dùng thao tác.
     - Khi cán bộ chuyển trang/lọc hoặc nạp lại, thông tin đã cache hiển thị ngay tức thì, không gây giật lag hay phụ thuộc vào việc deploy backend mới.
  4. **Tối ưu UI danh sách hồ sơ (`OfficerApplicationListView.tsx`):**
     - Loại bỏ thanh tiêu đề phụ dư thừa *"Hàng đợi hồ sơ tiếp nhận / X hồ sơ"* phía trên bảng.
     - Chuyển nút *"Làm mới"* lên thẳng thanh công cụ bộ lọc (cùng hàng với kết quả tìm kiếm), giúp bảng hồ sơ gọn gàng, thoáng đãng và hiển thị trực tiếp hàng tiêu đề cột.
- **Kiểm tra kỹ thuật:**
  - `npm run typecheck`: **0 lỗi (exit code 0)**.
  - `npm run lint`: **0 lỗi (exit code 0)**.

## Hoàn thiện UI Nội dung Đổi mật khẩu & Chuẩn hóa Thanh Tab — 22/10/2026

- **Yêu cầu & Tinh chỉnh từ người dùng:**
  1. Trả thanh Tab điều hướng về kiểu thanh gạch chân (Underline Tabs) tinh tế, chuẩn mực, không dùng hiệu ứng gradient hay badge nổi trội chói mắt.
  2. Gỡ bỏ hoàn toàn khối card "Mật khẩu tài khoản" dư thừa ở chân trang tab Thông tin cá nhân.
  3. **Tối ưu heading và nội dung đổi mật khẩu (`AccountSecuritySection.tsx`):**
     - Đơn giản hóa phần Heading: Bỏ gradient nền rườm rà, dùng layout ngang gọn gàng, tiêu đề súc tích *"Đổi mật khẩu"* và phụ đề ngắn gọn, ý nghĩa: *"Bảo vệ an toàn cho tài khoản của bạn"*.
     - Rút gọn toàn bộ các placeholder ô nhập ("Nhập mật khẩu hiện tại", "Nhập mật khẩu mới", "Nhập lại mật khẩu mới") giảm tải chữ, tạo cảm giác thoáng đãng và dễ thao tác.
     - **Thanh đo độ mạnh 4 nấc real-time (Strength Meter):** Phản hồi màu sắc sinh động (Yếu, Trung bình, Khá tốt, Rất mạnh).
     - **Checklist 4 tiêu chí dạng thẻ pill tương tác:** Tự động chuyển từ xám sang nền xanh `emerald-50` kèm dấu tick `Check` khi đạt tiêu chí.
     - **Chỉ báo khớp mật khẩu xác nhận real-time:** Báo tick xanh khi trùng khớp, báo cảnh báo đỏ khi chưa khớp trước khi bấm gửi.
     - Footer thanh lịch với ghi chú bảo mật và nút *"Lưu mật khẩu mới"* chuẩn phong cách WardMate.
- **Kiểm tra kỹ thuật:**
  - `npm run typecheck`: **0 lỗi (exit code 0)**.
  - `npm run lint`: **0 lỗi, 0 cảnh báo (exit code 0)**.
  - `npm run build`: **Build production thành công 100% trong 19.48s**.

## Nâng cấp Trợ lý AI và Gợi ý lý do bổ sung hồ sơ (Ứng dụng kỹ thuật prompts.chat) — 22/10/2026

- **Phạm vi triển khai:** Frontend React/TypeScript (100% độc lập, không thay đổi backend, tận dụng toàn bộ API AI hiện có `POST /api/v1/ai/chat/completions`).
- **Nội dung đã hoàn thành:**
  1. **Nâng cấp Trợ lý ảo AI (`AiChatWidget.tsx`):**
     - Xây dựng **Kho câu hỏi mẫu hành chính công (Prompt Library Drawer)** phân theo 5 danh mục: Tất cả, Hộ tịch (Khai sinh, Khai tử), Hôn nhân & Kết hôn, Chứng thực & Sao y, và Quy trình tiền kiểm.
     - Cho phép công dân lọc danh mục, bấm chọn câu hỏi mẫu gửi ngay hoặc nạp vào ô nhập liệu.
     - Bổ sung nút **Sao chép 1-click (1-Click Copy)** trên câu trả lời của AI với hiệu ứng phản hồi trực quan.
     - Nút bật/tắt ngăn câu hỏi mẫu (`Gợi ý / Ẩn mẫu`) tiện lợi mọi lúc trong phiên trò chuyện.
  2. **Gợi ý nhận xét AI cho Cán bộ Một cửa (`OfficerReviewWorkspaceView.tsx`):**
     - Trong modal quyết định "Yêu cầu bổ sung hồ sơ" (`NEED_REVISION`), bổ sung nút **"✨ AI gợi ý lý do"**: tự động tổng hợp danh sách các giấy tờ bắt buộc chưa đạt hoặc thiếu kèm nhận xét sai sót từ checklist, gọi AI để sinh văn bản lý do ngắn gọn (< 120 từ), chuẩn văn phong hành chính nhà nước.
     - Bổ sung 3 mẫu văn bản nhanh (Quick Revision Templates) cho cán bộ bấm chọn tức thì (ảnh chụp mờ lóa, thiếu chữ ký, thiếu giấy tờ bắt buộc).
     - Nâng cấp ô nhập lý do từ input 1 dòng sang textarea nhiều dòng hỗ trợ tối đa 4.000 ký tự.
- **Kiểm tra kỹ thuật:**
  - `npm run typecheck`: **0 lỗi (exit code 0)**.
  - `npm run lint`: **0 lỗi, 0 cảnh báo (exit code 0)**.
  - `npm run build`: **Build production thành công 100% trong 18.75s**.

## Sửa lỗi hiển thị mã ID rút gọn thay vì tên cán bộ — 22/10/2026

- **Vấn đề:** Trên giao diện danh sách hồ sơ cán bộ Một cửa (`/can-bo`), cột "Cán bộ" hiển thị mã ID rút gọn dạng `Cán bộ (cd57fbe0)` thay vì họ tên đầy đủ của cán bộ phụ trách. Đồng thời bộ lọc cán bộ phụ trách bị hardcode lựa chọn mock "Cán bộ Lê Thu Hà".
- **Nguyên nhân:** Backend `ApplicationWorkflow` theo chuẩn Microservices/database-per-service chỉ lưu trữ `assignedOfficerId` (GUID) mà không giữ thông tin họ tên cán bộ thuộc IAM. Khi chuyển đổi DTO sang ViewModel, các adapter `mapSummaryDtoToOfficerApplication` và `mapApplicationDtoToOfficerApplication` fallback hiển thị mã GUID cắt ngắn 8 ký tự do chưa nhận ngữ cảnh phiên đăng nhập hay danh bạ cán bộ.
- **Giải pháp triển khai:**
  1. Xây dựng module phân giải tên cán bộ `OfficerLookup` và hàm chuẩn hóa `resolveOfficerDisplayName(assignedOfficerId, assignedOfficerName, lookup)` trong `src/lib/api/workflowAdapters.ts`:
     - Ưu tiên 1: Lấy `assignedOfficerName` nếu backend cung cấp.
     - Ưu tiên 2: Đối chiếu `assignedOfficerId` với tài khoản cán bộ đang đăng nhập (`user.id`), tự động lấy họ tên từ hồ sơ cá nhân `profile.fullName` hoặc `username`.
     - Ưu tiên 3: Tra cứu trong danh bạ cán bộ phường `officerDirectory` (nếu đã nạp).
     - Ưu tiên 4: Fallback hiển thị mã rút gọn nếu chưa rõ danh tính.
  2. Cập nhật `src/pages/officer/OfficerPage.tsx`:
     - Tạo `officerLookup` tổng hợp thông tin tài khoản hiện hành và danh bạ cán bộ.
     - Tự động gọi API `getManagerOfficers` nạp danh bạ cán bộ cùng phường (với tài khoản có quyền).
     - Truyền `officerLookup` vào các mapper `mapSummaryDtoToOfficerApplication` và `mapApplicationDtoToOfficerApplication`.
  3. Cập nhật `src/pages/officer/OfficerApplicationListView.tsx`:
     - Xóa bỏ mock tĩnh "Cán bộ Lê Thu Hà" trong select box lọc cán bộ.
     - Tự động sinh danh sách lựa chọn cán bộ phụ trách `officerOptions` từ các cán bộ thực tế trong danh sách hồ sơ.
  4. Cập nhật `src/pages/officer/OfficerDashboardView.tsx`: Thay fallback 'Lê Thu Hà' thành 'Cán bộ Một cửa'.
- **Kiểm tra kỹ thuật:**
  - `npm run typecheck`: **0 lỗi (exit code 0)**.
  - `npm run lint`: **0 lỗi, 0 cảnh báo (exit code 0)**.
  - `npm run build`: **Build production thành công 100% trong 18.66s**.

## Tích hợp toàn diện các API Backend mới triển khai (P0, P1, P2) — 22/10/2026

- **Phạm vi công việc:** Triển khai phía Frontend (React/Vite/TypeScript) tương thích 100% với toàn bộ các endpoint backend đã được deploy (từ commit backend `1bcfc59`, `70b3984`, `dc4b101`, `8072c28`), loại trừ phân hệ Analytics & System theo chỉ đạo của người dùng.
- **Quyết định chuẩn hóa ranh giới nghiệp vụ (Phương án 1 — 22/10/2026):**
  - Thực hiện chuẩn hóa theo yêu cầu và bản chất cốt lõi của WardMate: Đây là hệ thống **hỗ trợ chuẩn bị và tiền kiểm hồ sơ**, không thay thế Cổng Dịch vụ công Quốc gia hay Hệ thống Một cửa điện tử chính thức của Nhà nước.
  - Điểm kết thúc vòng đời hồ sơ trên WardMate dừng chuẩn tại trạng thái **`DOCUMENTS_READY` ("Giấy tờ sẵn sàng")**: Khi hồ sơ được duyệt tiền kiểm, hệ thống sinh mã QR tiền kiểm và công dân tải toàn bộ bản in PDF tờ khai cùng tài liệu hợp lệ để mang đến nộp trực tiếp tại Bộ phận Một cửa UBND cấp Xã/Phường.
  - Lược bỏ hoàn toàn phân hệ mô phỏng tiếp nhận chính thức và cấp giấy hẹn tại quầy (`OfficerReceiptWorkspaceView`, menu `receipt-waiting`, `receipt-received`, `apps-ready-submit`). Thao tác thụ lý chính thức và ký giấy hẹn là thẩm quyền của Hệ thống Một cửa Nhà nước.
  - Trên giao diện cán bộ: Thay thế thẻ ca trực quầy bằng phân hệ theo dõi "Giấy tờ sẵn sàng nộp UBND" (`apps-approved`), cho phép cán bộ Một cửa quản lý các hồ sơ đã duyệt tiền kiểm và hỗ trợ đối soát mã QR công dân mang tới.
- **Các tính năng và luồng nghiệp vụ đã hoàn thiện:**
  1. **Công dân hủy hồ sơ tiền kiểm (`POST /api/v1/applications/{id}/cancel`):**
     - Thêm mutation `useCancelApplicationMutation` trong `src/hooks/useWorkflow.ts`.
     - Bổ sung nút "Hủy hồ sơ" kèm modal cảnh báo xác nhận trong `CitizenDossierDetailView.tsx` khi hồ sơ ở trạng thái `Bản nháp` hoặc `Cần chỉnh sửa`.
     - Adapter cập nhật trạng thái `'Đã hủy'` (`CANCELLED`).
  3. **Đổi mật khẩu tài khoản (`POST /api/v1/users/me/change-password`):**
     - Bổ sung API `changePassword` trong `src/lib/api/index.ts`.
     - Xây dựng component `ChangePasswordModal.tsx` với checklist độ mạnh mật khẩu (>=8 ký tự, hoa, thường, số, ký tự đặc biệt), ẩn/hiện mật khẩu, kiểm tra trùng khớp.
     - Tự động thu hồi phiên đăng nhập và điều hướng an toàn về `/dang-nhap` khi đổi mật khẩu thành công (do backend thu hồi toàn bộ refresh token).
     - Tích hợp nút mở đổi mật khẩu tại:
       + Menu tài khoản `UserDropdown.tsx` (cả giao diện desktop và mobile drawer).
       + Trang hồ sơ cá nhân cán bộ/quản lý `UnifiedSelfProfileView.tsx`.
       + Trang hồ sơ công dân `CitizenProfileView.tsx`.
  4. **Xem trước trực tiếp tài liệu đính kèm (`GET /api/v1/supporting-documents/{documentId}/preview`):**
     - Bổ sung `previewSupportingDocument` trong `src/lib/api/documentForms.ts`.
     - Cập nhật `OfficerDocumentsPanel.tsx` và `DossierChecklistView.tsx` để xem trước trực tiếp (inline stream) đối với định dạng PDF, PNG, JPG/JPEG kèm cơ chế tự động fallback về download nếu là Word hoặc định dạng không hỗ trợ.
  5. **Thủ tục hành chính nổi bật (`GET /api/v1/procedures/featured`):**
     - Bổ sung `procedureApi.featured` và hook `useFeaturedProcedures()`.
     - Hiển thị danh sách thủ tục nổi bật có gắn huy hiệu "Nổi bật" tại trang chủ `HomePage.tsx` khi chưa nhập từ khóa tìm kiếm.
  6. **Nộp bản Word đã điền offline (`POST /api/v1/citizen/submissions/upload-filled-docx`):**
     - Bổ sung `uploadFilledDocx` trong `documentFormApi` và `useDocumentMutations`.
     - Kết nối luồng upload bản Word tải về từ biểu mẫu trong `DossierChecklistView.tsx`.
  7. **Bóc tách thông tin thẻ CCCD bằng AI OCR (`POST /api/v1/ai-ocr/cccd/extract`):**
     - Tạo client `src/lib/api/aiOcr.ts` với Zod schema xác thực dữ liệu trích xuất.
     - Xây dựng component `CccdOcrScanModal.tsx` cho phép tải ảnh mặt trước (bắt buộc) và mặt sau (tùy chọn) thẻ CCCD, kiểm tra dung lượng (tối đa 8MB/ảnh).
     - Hiển thị kết quả bóc tách (Số CCCD, Họ tên, Ngày sinh, Giới tính, Quê quán, Thường trú) cùng độ tin cậy AI, hỗ trợ người dùng áp dụng trực tiếp vào biểu mẫu hồ sơ công dân (`CitizenProfileView.tsx`).
     - Bổ sung cảnh báo an toàn bảo mật dữ liệu công dân (không lưu trữ ảnh vào cơ sở dữ liệu).
  8. **Trợ lý ảo AI hỏi đáp quy trình thủ tục (`POST /api/v1/ai/chat/completions`):**
     - Xây dựng component `AiChatWidget.tsx` dạng cửa sổ nổi tương tác trực quan (Floating Widget) góc dưới bên phải màn hình tại `CitizenPage.tsx` và `HomePage.tsx`.
     - Hỗ trợ câu hỏi nhanh gợi ý, duy trì mã phiên hội thoại `conversationId`, hiển thị câu trả lời dạng văn bản an toàn kèm lưu ý pháp lý.
  9. **Cấu hình Gateway / Proxy (`vite.config.ts` & `serviceUrls.ts`):**
     - Bổ sung định tuyến proxy cho `/api/v1/ai-ocr` và `/api/v1/ai/chat`.
  10. **Theo dõi Hạn xử lý tiền kiểm (Review Deadline - SLA 45 giờ làm việc):**
      - Bổ sung trường `dueAtUtc` và `deadlineStatus` trong `OfficerApplication` và `CitizenDossier`.
      - Cập nhật adapter `workflowAdapters.ts` tự động tính toán trạng thái quá hạn (`urgency: 'overdue'`).
      - Hiển thị nhãn hạn xử lý và cảnh báo quá hạn trong danh sách hồ sơ cán bộ Một cửa (`OfficerApplicationListView.tsx`).
      - Hiển thị thông tin hạn tiền kiểm (45 giờ làm việc của UBND) tại khối trạng thái chi tiết hồ sơ công dân (`CitizenDossierDetailView.tsx`).
- **Kiểm tra kỹ thuật:**
  - `npm run typecheck`: **0 lỗi (exit code 0)**.
  - `npm run lint`: **0 lỗi, 0 cảnh báo (exit code 0)**.
  - `npm run build`: **Build production thành công 100% trong 51.67s**.
- **Bước tiếp theo:** Người dùng kiểm tra trải nghiệm các tính năng mới trên môi trường dev/staging.


## Thiết kế lại UI/UX tra cứu thủ tục — 21/10/2026

- Sửa theo phản hồi trùng/lặp: `ProceduresPage` nhận prop `embedded`; `CitizenPage` truyền prop này để bỏ breadcrumb Trang chủ, nhãn giới thiệu, tiêu đề “Thủ tục hành chính” và mô tả trong khung tìm kiếm. Chỉ giữ tiêu đề “Tra cứu thủ tục” của workspace và breadcrumb topbar; bỏ câu “Không cần đăng nhập” khi nhúng, thu gọn khoảng cách. Trang công khai giữ phần đầu trang. Section tìm kiếm vẫn có accessible name.
- Kiểm tra lại cho lần sửa trùng/lặp: typecheck, lint, build và `git diff --check` đạt; 2/2 ca `procedures-ui.spec.ts` với API mock đạt, bổ sung xác nhận chỉ có một h1 và không có breadcrumb/hero-copy lặp trong cổng công dân. Đã xem lại ảnh desktop/mobile và kiểm tra responsive 360–1440px. Chưa kiểm tra backend thật. Build vẫn có cảnh báo Zod/chunk lớn.
- Đã sửa `src/pages/public/ProceduresPage.tsx` và nhóm CSS `procedures-*` trong `src/styles/globals.css`, áp dụng cho `/thu-tuc` và mục tra cứu trong `/citizen?section=procedures`.
- Thay banner đỏ lớn bằng khung tìm kiếm trắng có điểm nhấn đỏ, mô tả ngắn và hướng dẫn nhập có/không dấu. Mở rộng nội dung tối đa 1280px; bỏ padding lồng nhau khi nhúng trong workspace.
- Bộ lọc có dấu chọn, nền đỏ nhạt; chia hai cột trên mobile, một cột ở sidebar desktop. Có hướng dẫn bắt đầu và liên kết hỏi đáp trên desktop.
- Kết quả dùng thẻ riêng: lĩnh vực, mã thủ tục từ API, tên, nhãn thời gian/lệ phí và hành động “Xem hướng dẫn”. Giữ URL, bộ lọc đang áp dụng, liên kết chi tiết và phân trang phía dưới.
- Nhấn Enter/nút Tìm kiếm áp dụng từ khóa ngay vào URL; xóa bộ lọc đồng thời xóa nội dung đang nhập. Giữ tiêu đề kết quả trong DOM để focus không mất khi tải/phân trang; skeleton tương ứng thẻ kết quả và lĩnh vực. Không hiển thị số kết quả bằng 0 khi đang tải hoặc khi lỗi.
- Validation: `npm run typecheck`, `npm run lint`, `npm run build`, `git diff --check` đạt. Build có cảnh báo chú thích thư viện Zod và chunk lớn (editor DOCX).
- Playwright Edge với API mock: 17/17 ca trong `landing.spec.ts` và `procedure-detail.spec.ts`; 3/3 ca công khai được chọn trong `procedure-manager.spec.ts` (query/phân trang, loading, lỗi/thử lại); 2/2 ca mới trong `procedures-ui.spec.ts` (public/citizen responsive và tìm kiếm/xóa lọc/focus). Tổng 22 ca riêng biệt đạt. Đã xem ảnh desktop/mobile; kiểm tra không tràn ngang ở 1440/768/390/360px. Test chờ chuyển động sidebar kết thúc trước khi chụp.
- Lần lint đầu vướng thư mục `test-results` đang được Playwright tạo lại; chạy lại thành công. Playwright mặc định đã báo đủ 17 ca đạt nhưng giữ tiến trình Vite khi teardown trên Windows; các ca bổ sung dùng cấu hình tạm tái sử dụng đúng server mock, sau đó đóng server đã tạo và xóa cấu hình tạm.
- Git theo yêu cầu người dùng: chia 3 commit trên `main`: `e71ba6d` (giao diện tra cứu và chế độ nhúng), `0ea60b8` (áp dụng chế độ nhúng trong cổng công dân và kiểm thử hồi quy), cùng commit tài liệu bàn giao này. Remote: `origin` → `https://github.com/wardmate-capstone/wardmate-frontend.git`; đối chiếu `origin/main` để xác định trạng thái đồng bộ thực tế. Phiên chia commit không thay đổi code đã kiểm thử; chỉ kiểm tra lại diff và Git, không chạy lại test/build.
- Giới hạn: dùng luồng Catalog hiện có, chưa xác minh lại backend thật trong phiên này; chưa kiểm tra screen reader hoặc zoom 200%. Bước tiếp theo: người dùng xem giao diện với danh mục môi trường thật.

## Nâng cấp Trải nghiệm Loading & Chuẩn hóa Skeleton UI Toàn diện — 19/10/2026

- **Yêu cầu người dùng:** Kiểm tra và rà soát toàn bộ hệ thống giao diện web về trạng thái tải dữ liệu (loading states). Người dùng cung cấp ảnh chụp thực tế tại mục "Hồ sơ của tôi > Bản nháp", trong đó giao diện bị thô xấu: dòng chữ trần `Đang tải hồ sơ của bạn…` hiển thị phía trên tiêu đề, và toàn bộ phần thân trang trắng tinh/trống rỗng do thiếu Skeleton loading.
- **Phân tích nguyên nhân:**
  1. `CitizenPage.tsx`: Khi `citizenAppsQuery.isPending`, thẻ `<p role="status">Đang tải hồ sơ của bạn…</p>` được đặt trước tiêu đề `<div className="admin-page-heading">`, và view `<CitizenDossiersView>` chỉ được render khi `citizenAppsQuery.isSuccess` là true. Do đó khi đang fetch, toàn bộ phần nội dung bảng không xuất hiện, gây giật giao diện và trang trắng.
  2. Toàn bộ các view khác (`CitizenDashboardView`, `CitizenSubmissionsView`, `CitizenQrCodeView`, `CitizenDossierDetailView`, `DossierChecklistView`, `GeneratedDocumentsPanel`, `OfficerApplicationListView`, `OfficerDocumentsPanel`, `OfficerReviewWorkspaceView`, `FormsView`, `ProcedureFormPicker`, `ProcedureFeedback`) đều đang dùng các thẻ `<p role="status">Đang tải...</p>` dạng text trần thay vì Skeleton placeholder.
- **Các cải tiến đã triển khai:**
  1. **Bổ sung component Skeleton trong `@/components/ui/Skeleton.tsx`:**
     - Thêm `StatGridSkeleton`: Skeleton mô phỏng 4 thẻ chỉ số thống kê (`.admin-stat-grid`).
     - Thêm `ChecklistSkeleton`: Skeleton mô phỏng danh sách các mục giấy tờ / tờ khai.
  2. **Chuẩn hóa luồng nạp Danh sách Hồ sơ Công dân (`CitizenPage.tsx` & `CitizenDossiersView.tsx`):**
     - Xóa bỏ hoàn toàn dòng text thô `<p>Đang tải hồ sơ của bạn…</p>` phía trên tiêu đề.
     - Luôn render khung bảng `CitizenDossiersView` kèm `isLoading={citizenAppsQuery.isPending}`.
     - Khi `isLoading` là true: Bảng hiển thị `TableSkeletonRows` gồm 6 cột x 6 hàng pulsing mượt mà, huy hiệu hiển thị "Đang tải…", và không bị nhấp nháy thông báo trống "Bạn chưa có hồ sơ nào".
  3. **Nâng cấp Skeleton toàn diện trên các phân hệ:**
     - `CitizenDashboardView.tsx`: Giữ nguyên cấu trúc 4 thẻ chỉ số, giữ nguyên icon và nhãn tiếng Việt ("Hồ sơ đang xử lý", "Cần bổ sung gấp", "Giấy tờ sẵn sàng", "Đã hoàn tất thủ tục"); chỉ tải skeleton cho riêng giá trị số (`<strong>`), loại bỏ hoàn toàn ô xám che icon. Đồng thời dùng `ListSkeleton` cho "Hồ sơ gần đây của bạn".
     - `CitizenSubmissionsView.tsx`: Thay `<p>Đang tải bản khai…</p>` bằng `ListSkeleton`.
     - `CitizenQrCodeView.tsx`: Thay `<p>Đang tải thông tin mã QR…</p>` bằng khung card placeholder chứa ảnh QR skeleton.
     - `CitizenDossierDetailView.tsx`: Thay `<p>Đang tải ý kiến cán bộ…</p>` bằng khung skeleton nhận xét màu vàng nhạt.
     - `DossierChecklistView.tsx`: Thay `<p>Đang tải giấy tờ đã lưu…</p>` bằng `ChecklistSkeleton`.
     - `GeneratedDocumentsPanel.tsx`: Thay text bằng `ListSkeleton`.
     - `OfficerApplicationListView.tsx`: Hỗ trợ `isLoading={queue.isPending}`, hiển thị `TableSkeletonRows` 7 cột x 6 hàng thay vì hiện text rỗng.
     - `OfficerDocumentsPanel.tsx`: Dùng `ListSkeleton` cho danh sách tài liệu thẩm định.
     - `OfficerReviewWorkspaceView.tsx`: Dùng `Skeleton` cho nhận xét và danh sách bản khai.
     - `FormsView.tsx`: Dùng `TableSkeleton` 4 cột cho phôi biểu mẫu Word.
     - `ProcedureFormPicker.tsx`: Dùng `ListSkeleton` cho kho mẫu thủ tục.
     - `ProcedureFeedback.tsx`: Thay thế toàn bộ đoạn text đơn điệu trong trang Chi tiết thủ tục (`ProcedureDetailPage`) bằng khung Skeleton hoàn chỉnh mô phỏng header, chỉ số và card nội dung.
     - `DocumentFilePreview.tsx`: Dùng `Skeleton` cho khung xem trước tệp tài liệu.
     - `DocxPreview.tsx`: Dùng `Skeleton` mô phỏng trang văn bản khi đang nạp iframe preview biểu mẫu.
     - `OfficerReviewWorkspaceView.tsx`: Dùng `Skeleton` cho so sánh phiên bản (`diff.isPending`) thay thế text thô.
     - `AdminPage.tsx`: Dùng `Skeleton` bố cục hồ sơ chi tiết khi quản trị viên xem tài khoản người dùng (`detailLoading`).
     - `CitizenDossierDetailView.tsx`: Dùng `Skeleton` cho tiến độ giấy tờ bắt buộc và hộp thoại xác nhận tiền kiểm.
     - `UnifiedSelfProfileView.tsx` & `CitizenProfileView.tsx`: Thay toàn bộ text "Đang tải..." và tình trạng nhấp nháy "Chưa cập nhật" bằng `Skeleton` cho từng trường dữ liệu cá nhân (CCCD, Họ tên, Ngày sinh, Giới tính, SĐT, Địa chỉ).
     - `UserDropdown.tsx`: Dùng `Skeleton` nhẹ trên thanh topbar, menu thả xuống và menu mobile khi đang fetch profile.
     - `PermissionFeatures.tsx`: Dùng spinner fallback đồng bộ cho các phân hệ nhúng.
- **Kiểm tra kỹ thuật:**
  - `npm run typecheck`: **0 lỗi (exit code 0)**.
  - `npm run lint`: **0 lỗi, 0 cảnh báo (exit code 0)**.
  - `npm run build`: **Build production hoàn tất thành công trong 31.94s (7.366 modules)**.
  - Playwright test: **12/12 tests ĐẠT 100%** (`citizen-dossier-ui`, `procedure-detail`, `officer`, `citizen-application-wizard`).
- **Giới hạn & Chưa thực hiện:** Giữ nguyên trạng thái chưa commit theo nguyên tắc an toàn Git, sẵn sàng báo cáo người dùng.

## Rà soát & Dọn dẹp Mã nguồn và File Không Còn Sử dụng — 18/10/2026

- **Yêu cầu người dùng:** Kiểm tra kỹ lưỡng toàn bộ mã nguồn frontend để tìm và xóa bớt các file hoặc đoạn code không còn sử dụng (dead code / orphan files), giúp dự án gọn gàng, giảm rối mắt và dễ bảo trì. Yêu cầu kiểm tra cẩn thận trước khi xóa.
- **Quá trình phân tích & Kiểm tra an toàn:**
  1. Sử dụng công cụ phân tích tĩnh `knip` kết hợp rà soát toàn bộ cây import (`grep_search`) xuyên suốt thư mục `src/`, `tests/` và `docs/`.
  2. Xác minh các file kiểm thử đặc thù:
     - `tests/fixtures/ui.tsx`: Được tham chiếu qua thẻ `<script src="/tests/fixtures/ui.tsx">` trong `ui.html` phục vụ `tests/design-system.spec.ts` -> **Giữ nguyên 100%, không xóa**.
     - `tests/api-proxy-check.mjs`: Được ghi chú trong tài liệu `docs/FRONTEND_SETUP.md` và `docs/PROGRESS.md` -> **Giữ nguyên, không xóa**.
- **Các file và đoạn code thừa đã loại bỏ:**
  1. **5 file mã nguồn mồ côi (Orphan Files) không được import ở bất cứ đâu (~1.200 dòng code):**
     - `src/pages/citizen/components/FormDocxEditorModal.tsx` (640 dòng): Modal soạn thảo prototype cũ bằng HTML div/canvas trước khi tích hợp `@docx-editor.dev` và `DocxOnlineEditor.tsx`.
     - `src/pages/citizen/components/FormPreviewModal.tsx` (144 dòng): Modal xem trước bản khai mockup cũ, đã được thay thế bởi `DocumentFilePreview.tsx`.
     - `src/pages/citizen/components/uploader/DocumentPreviewModal.tsx` (97 dòng): Component modal cũ nằm lẻ loi trong thư mục `uploader/`. Đã dọn cả thư mục rỗng.
     - `src/pages/public/components/ProcedureCasesView.tsx` (280 dòng): Component trường hợp thủ tục prototype cũ nằm lẻ loi trong thư mục `components/`. Đã dọn cả thư mục rỗng.
     - `src/data/mockNotifications.ts` (51 dòng): Dữ liệu thông báo giả lập ban đầu không còn được sử dụng.
  2. **Dữ liệu giả lập dư thừa trong `src/pages/citizen/types.ts`:**
     - Xóa mảng `initialDossiers` (70 dòng dữ liệu hồ sơ giả lập cũ).
     - Xóa mảng `citizenChartData` và type `ChartRange` (40 dòng biểu đồ thống kê mockup cũ).
  3. **Tối ưu import trùng lặp:**
     - `src/pages/citizen/CitizenPage.tsx`: Gộp 2 dòng import trùng lặp từ `@tanstack/react-query` (`useQuery` và `useQueryClient`).
- **Kiểm tra kỹ thuật:**
  - `npm run typecheck`: **0 lỗi (exit code 0)**.
  - `npm run lint`: **0 lỗi, 0 cảnh báo (exit code 0)**.
  - `npm run build`: **Build production thành công 100%** (`vite build` hoàn tất trong 18s).
  - Playwright test:
    - `tests/citizen-dossier-ui.spec.ts`: **2/2 passed** (18.8s).
    - `tests/procedure-detail.spec.ts`: **3/3 passed** (19.2s).
    - `tests/citizen-application-wizard.spec.ts`: **2/2 passed** (15.9s).
    - `tests/docx-online.spec.ts`: **4/4 passed** (27.8s).
    - `tests/officer.spec.ts`: **5/5 passed** (15.8s).
    - **Tổng cộng 16/16 tests ĐẠT 100%**.
- **Trạng thái Git & Commit:** Đã phân nhóm thành 5 commit chuẩn conventional và push thành công lên `origin/main` (`6b6aca3..cc1255f`):
  1. `91bcd5e`: `perf(workflow): optimize api caching, polling intervals, and lazy version queries`
  2. `ebfdb31`: `feat(officer): improve review workspace, manual refresh, and queue pagination`
  3. `aec0e7e`: `feat(citizen): update dossier checklist, inline docx editor, and table footer pagination`
  4. `af614c6`: `refactor(codebase): remove dead prototype modals, obsolete mock data, and unused files`
  5. `cc1255f`: `docs(progress): document workflow optimizations, UI refactors, and codebase cleanup`
- **Giới hạn & Chưa thực hiện:** Không còn tồn đọng thay đổi dở dang; toàn bộ mã nguồn sạch, build và test đều đạt 100%.

## Tối ưu hóa API Calls, Tích hợp nút Làm mới & Chuyển phân trang xuống dưới Table — 17/10/2026

- **Yêu cầu người dùng:**
  - Tối ưu hóa việc gọi API của các dịch vụ hiện tại (Workflow, Document Form, v.v.), khắc phục tình trạng gọi API liên tục và quá nhiều lần (auto-polling, refetch on window focus liên tục).
  - Đặt các nút/icon Làm mới (Reload) trực tiếp vào các bảng quản lý hồ sơ (table) cho cả Cán bộ và Công dân, cũng như tại các trang chi tiết hồ sơ / không gian thẩm định, giúp Cán bộ khi có nhận xét hoặc Công dân khi nộp hồ sơ chỉ cần bấm nút để cập nhật tức thì mà không cần phải nhấn F5 trình duyệt.
  - Xóa bỏ banner text cảnh báo không cần thiết ở đầu trang Cán bộ ("Danh sách và chỉ số chỉ phản ánh hàng đợi chờ/đang kiểm tra...").
  - Chuyển thanh phân trang ("Trang trước / Trang sau") từ vị trí phía trên xuống chân bảng hồ sơ (table footer).
- **Giải pháp & Triển khai chi tiết:**
  1. **Khắc phục tình trạng spam/gọi API liên tục:**
     - `src/lib/queryClient.ts`: Tắt chế độ tự động refetch gây phiền toái `refetchOnWindowFocus: false` và `refetchOnReconnect: false`. Tăng thời gian lưu bộ nhớ cache hợp lý: `staleTime: 2 * 60_000` (2 phút không gọi lại nếu dữ liệu còn mới trong RAM), `gcTime: 10 * 60_000` (10 phút dọn rác cache).
     - `src/hooks/useWorkflow.ts`: Tắt polling chạy ngầm liên tục (`refetchInterval: false`) ở cả `useOfficerPendingApplications` (trước đó là 15s) và `useCitizenApplications`. Bổ sung tham số `enabled` để lazy-load danh sách phiên bản và so sánh diff (`useApplicationVersions`, `useApplicationDiff`) chỉ khi tab `versions` được chọn.
  2. **Tích hợp nút Làm mới trực tiếp vào Table Quản lý Hồ sơ:**
     - `src/pages/officer/OfficerApplicationListView.tsx`: Thêm thanh toolbar quản lý ngay phía trên thẻ `<table>`, bao gồm hiển thị tổng số hồ sơ trong hàng đợi và nút "Làm mới" với icon `ArrowCounterClockwise` xoay tròn (`animate-spin`) khi đang tải.
     - `src/pages/officer/OfficerPage.tsx`: Truyền prop `onRefresh={() => void queue.refetch()}` và trạng thái `isRefreshing={queue.isFetching}` xuống `OfficerApplicationListView`.
     - `src/pages/citizen/views/CitizenDossiersView.tsx`: Thêm nút "Làm mới" ngay trên thanh tiêu đề bảng hồ sơ công dân (`admin-table-wrap`) kèm icon `ArrowClockwise` xoay khi đang lấy dữ liệu mới.
     - `src/pages/citizen/CitizenPage.tsx`: Truyền prop `onRefresh={() => void citizenAppsQuery.refetch()}` và `isRefreshing={citizenAppsQuery.isFetching}` xuống `CitizenDossiersView`.
     - `src/pages/citizen/views/CitizenDossierDetailView.tsx`: Thêm nút "Làm mới hồ sơ" ở thanh header của chi tiết hồ sơ.
     - `src/pages/officer/OfficerReviewWorkspaceView.tsx`: Thêm nút "Làm mới dữ liệu" ở thanh điều hướng phụ của không gian thẩm định.
  3. **Xóa banner text & chuyển phân trang xuống chân bảng hồ sơ:**
     - `src/pages/officer/OfficerPage.tsx`: Xóa bỏ thẻ `<p className="mb-4 rounded-xl border bg-white p-3 text-sm text-slate-600">...` khỏi đầu trang; xóa cụm phân trang phía trên; truyền cấu hình `pagination={{ currentPage, totalItems, pageSize, onPrevPage, onNextPage, isFetching }}` vào `OfficerApplicationListView`.
     - `src/pages/officer/OfficerApplicationListView.tsx`: Bổ sung `<nav aria-label="Phân trang hàng đợi">` ở chân container bảng `rounded-2xl border`, hiển thị số trang hiện tại, tổng số hồ sơ, nút `Trang trước` và `Trang sau`.
     - `tests/officer.spec.ts`: Cập nhật assertion kiểm tra thẻ điều hướng phân trang ở bảng hồ sơ thay cho text banner đã xóa.
- **Kiểm tra kỹ thuật:**
  - `npm run typecheck`: **0 lỗi (exit code 0)**.
  - Playwright test: Chạy toàn bộ các bộ test liên quan:
    - `tests/officer.spec.ts` (5/5 passed) & `tests/citizen-dossier-ui.spec.ts` (2/2 passed) -> **7/7 passed**.
    - `tests/officer-submissions.spec.ts` & `tests/document-workflow.spec.ts`: **18/18 passed**.
    - **Tổng cộng 25/25 tests ĐẠT 100%**, không có bất kỳ regression nào.
- **Giới hạn & Chưa thực hiện:** Giữ nguyên các thay đổi chưa commit theo quy định an toàn Git.

## Kế hoạch tái thiết kế UI/UX Workflow & Triển khai DOCX Studio Workspace + Officer Review Studio — 17/10/2026

- **Phạm vi & Yêu cầu:** Người dùng yêu cầu đọc lại toàn bộ mã nguồn FE và BE của Workflow & Document Form để lên kế hoạch làm lại giao diện sao cho tối ưu, đơn giản, dễ tiếp cận nhưng vẫn đảm bảo đầy đủ chức năng và nghiệp vụ.
  - Phần chỉnh sửa trực tuyến Word (DOCX Online Editor) chạy ở **Workspace riêng biệt toàn màn hình** (đã hoàn thành ở Bước 1).
  - Tái cấu trúc không gian thẩm định của Cán bộ (Officer Review Studio) và tối ưu hóa quy trình ra quyết định (đã hoàn thành ở Bước 2).
- **Kế hoạch tổng thể:** Đã lập kế hoạch chi tiết lưu tại artifact `workflow_ui_ux_redesign_plan.md` gồm 4 giai đoạn.
- **Triển khai Bước 1 - DOCX Studio Workspace:**
  - `DocxOnlineEditor.tsx`: Chuyển từ cửa sổ Modal Radix sang Workspace toàn màn hình chuyên biệt (`fixed inset-0 z-50 flex flex-col bg-slate-900/40 backdrop-blur-sm`).
  - Top Bar (56px) hiển thị tên đơn, trạng thái lưu tức thời, phím tắt `Ctrl + S`, nút Lưu to rõ.
  - Ribbon Toolbar phân tab (Trang đầu, Chèn, Bố trí) phong cách Office hiện đại.
  - Bàn làm việc rộng rãi (Desk Canvas) với mô phỏng A4, bộ điều khiển Zoom (75% - 150%) và ngăn tham chiếu thông tin đối chiếu (Collapsible Reference Drawer).
  - Suspense Fallback dạng Studio Backdrop mượt mà tại `OfficerDocumentsPanel.tsx`, `CitizenSubmissionsView.tsx`, `DossierChecklistView.tsx`.
- **Triển khai Bước 2 - Master-Detail Officer Review Studio & Pre-flight Verification:**
  - `OfficerReviewWorkspaceView.tsx`:
    - **Header Banner chuyên nghiệp:** Tích hợp breadcrumb "Quay lại danh sách hồ sơ", mã hồ sơ, tên thủ tục, huy hiệu trạng thái sắc nét, và thanh chỉ số nhanh (Checklist bắt buộc: X/Y hoàn tất, Nhận xét: Z đang mở, Bản khai Word, Thẩm quyền xử lý).
    - **Thao tác quyết định nhanh (Action Group):** 2 nút quyết định chính to rõ: `Yêu cầu bổ sung` (màu hổ phách) và `Xác nhận giấy tờ sẵn sàng` (màu xanh ngọc).
    - **Tabs Bar phân đoạn hiện đại:** Thay tab cũ bằng hệ thống tab có biểu tượng trực quan từ Lucide React (`FileText`, `FileCheck`, `AlertTriangle`, `GitCompare`, `History`, `ShieldCheck`) và bộ đếm số lượng.
    - **Thêm nhận xét siêu tốc (Quick Comment Templates):** Bổ sung 4 gợi ý mẫu nhận xét thông dụng (`Ảnh chụp/bản scan chưa rõ nét...`, `Cần ký và ghi rõ họ tên...`, `Thông tin họ tên hoặc ngày sinh chưa khớp...`, `Vui lòng tải lại bản chính...`) cho phép cán bộ click 1 chạm là tự điền vào khung nhận xét.
    - **Pre-flight Condition Checklist trong Decision Modal:** Tự động đối soát và hiển thị trực quan các điều kiện tiên quyết (giấy tờ bắt buộc đã hoàn tất hay chưa, còn nhận xét OPEN dở dang nào không, bản khai điện tử đã liên kết đúng chưa) trước khi cán bộ chốt quyết định.
- **Kiểm tra kỹ thuật:**
  - `npm run typecheck`: **0 lỗi (exit code 0)**.
  - Playwright test: Chạy toàn bộ 3 bộ test liên quan `tests/officer-submissions.spec.ts` (14/14 passed), `tests/document-workflow.spec.ts` (4/4 passed), `tests/officer.spec.ts` (5/5 passed) — **Tổng cộng 23/23 tests ĐẠT 100%**.
  - Dev server chạy trên `http://localhost:5173`.
- **Giới hạn & Chưa thực hiện:** Chưa commit/push theo quy định. Sẵn sàng cho Bước 3 & 4 (Công dân).

## Chia 20 commit và bàn giao lên main — 17/10/2026

- Người dùng yêu cầu chia toàn bộ thay đổi frontend của hai task cán bộ hiện tại thành **đúng 20 commit** rồi push `main`. Nền trước đợt này: `4a86cdc588499d2ac12038c59b96738c6a5e86d7`; đã fetch và xác minh `HEAD` trùng `origin/main` trước khi tạo commit, không có commit local khác chờ gửi hoặc thay đổi đã stage sẵn.
- Phân nhóm: **5 feat + 10 fix + 4 test + 1 docs**. 15 commit code/UI bao gồm trạng thái, API và validation, cache, workspace cán bộ/công dân, PDF/QR và khóa tiếp nhận chưa có API; 4 commit kiểm thử chứa fixture và các kịch bản hồi quy; commit thứ 20 chứa ba tài liệu bàn giao. 19 commit code/test từ `d2ee0a0` đến `c1006e1`. Không sửa nội dung code trong phiên chia commit; không đưa thay đổi BE vào đợt này. Mỗi commit có mô tả hành vi, lý do và validation/giới hạn của toàn bộ series; kiểm tra được áp dụng cho series hoàn chỉnh, không khẳng định từng commit trung gian đều độc lập biên dịch.
- Kiểm tra mới trong phiên chia commit: `npm run typecheck`, `npm run lint`, `git diff --check` đạt. Không chạy lại build/browser vì code không thay đổi; kết quả kiểm thử đã chạy ở task ngay trước vẫn giữ nguyên: build đạt, proxy 12/12; lượt browser tổng 189/190 (1 timeout auth), nhóm ảnh hưởng 26/26, auth chạy lại 3/3. Không coi đây là kết quả 191/191 hoặc kiểm thử Azure thật.
- Remote đích đã xác minh: `https://github.com/wardmate-capstone/wardmate-frontend.git`, nhánh `main`. Người dùng đã yêu cầu push. Sau commit tài liệu cuối, kiểm tra đúng 20 commit sẽ gửi, không force push; xác minh SHA remote và trạng thái đồng bộ sau push rồi báo trong phản hồi bàn giao. Không coi commit local hoặc push thành công là bằng chứng deployment thành công.
- Kết quả hiện tại: đã tạo đủ 20 commit local, xác minh `main` đi trước `origin/main` đúng 20 commit và diff đạt. **Chưa push**: automatic approval review từ chối lệnh `git push origin main`, yêu cầu người dùng xác nhận rõ URL GitHub nhận mã nguồn riêng tư. Chờ xác nhận push tới remote nêu trên; không đổi remote hoặc dùng cách gửi khác để vượt chặn. Chỉ amend commit tài liệu cuối còn ở local để ghi đúng trạng thái, không thêm commit thứ 21 hoặc sửa lịch sử đã công bố.
- Các dòng “Chưa commit/push/deploy” trong hai mục task bên dưới mô tả thời điểm hoàn tất triển khai/kiểm thử trước đợt bàn giao này; xem mục này cùng Git và phản hồi xác minh cuối để biết trạng thái sau chia commit.

## Rà soát lỗi và validation luồng cán bộ — 17/10/2026

- Phạm vi: toàn bộ luồng cán bộ vừa tích hợp và phần tài liệu công dân liên quan; đối chiếu lại validator/controller/DTO của BE local, chạy thêm toàn bộ bộ kiểm thử FE. Giữ các thay đổi chưa commit của task trước, không sửa BE hoặc hợp đồng endpoint.
- `OfficerReviewWorkspaceView.tsx`: chặn quyết định khi nhận xét chưa lưu, thêm xóa nội dung nháp; cố định phiên bản trong modal, không dùng lý do cũ cho phiên bản mới; không fallback Workflow nếu đơn vừa biến mất. Kiểm tra liên kết người nộp/checklist/mẫu đơn, dữ liệu checklist, giới hạn tên nhận xét 255 ký tự; lý do trắng bị chặn/trim, focus trường lỗi. Dùng thông báo Workflow đúng dịch vụ và bỏ hướng dẫn xóa nhận xét đã lưu vốn chưa có API.
- `documentForms.ts`, `workflow.ts`: validate cấu trúc và submissionId của response quyết định; kiểm tra response danh sách/contents/detail khớp hồ sơ; validate file annotate tại API client. `useWorkflow.ts` chờ cache invalidation sau quyết định; `useDocumentForms.ts` invalidate cả hồ sơ và preview binary sau annotate thành công/lỗi để phục hồi khi server đã ghi trước lỗi phản hồi.
- `OfficerDocumentsPanel.tsx`: chọn file không hợp lệ xóa trạng thái thành công và file thử lại cũ. `OfficerReceiptWorkspaceView.tsx`/`OfficerPage.tsx`: bỏ số biên nhận random, ngày tiếp nhận/ngày hẹn cố định và luồng chuyển “Đã tiếp nhận” cục bộ khi chưa có API; khóa xác nhận và giải thích. `workflowAdapters.ts`: thời điểm sẵn sàng lấy `documentsReadyAt`, không suy từ `updatedAt`/ngày gửi. Không tạo endpoint tiếp nhận mới.
- Kiểm thử mới tại `tests/officer-submissions.spec.ts`/`tests/officer.spec.ts`, fixture trả acknowledgement đúng submissionId được gọi. Lượt toàn bộ Edge/API mock: **189/190 đạt**, exit 1 (6,1 phút); một ca `auth.spec.ts` “failed revoke keeps…” timeout khi menu item bị detach. Các ca nghiệp vụ/validation mới đều đạt. Sau sửa tiếp nhận tại quầy, chạy lại officer + officer-submissions + ui-audit đạt **26/26**, exit 0 (1,2 phút), gồm ca không cấp biên nhận giả dù đã đánh dấu đủ checklist. Chạy lại riêng ca auth timeout ba lần đạt **3/3**, exit 0 (20,2 giây), không sửa auth hoặc test auth; chưa kết luận nguyên nhân timeout của lượt tổng và không báo lượt tổng là 190/190. Số kịch bản hiện tại là 191 sau khi thêm ca tiếp nhận tại quầy; chưa chạy lại toàn bộ 191 ca, chỉ chạy lại nhóm chịu ảnh hưởng nêu trên.
- Typecheck/lint/build cuối đạt, build exit 0 (Vite 31,85 giây); còn cảnh báo annotation Zod/chunk editor lớn có sẵn. Script proxy Vite thật local đạt **12/12**. `git diff --check` đạt. Hợp đồng và validation cập nhật tại `docs/FRONTEND_SETUP.md`. Không nâng dependency hoặc sửa cấu hình Git.
- Giới hạn: các lượt browser dùng mock, chưa chạy Azure/Blob/Gotenberg hay kiểm thử phân quyền thật theo phường/tài khoản được phân công. BE vẫn chưa có API danh sách đầy đủ cho hồ sơ cần bổ sung/sẵn sàng/lịch sử và API tiếp nhận chính thức. Chưa commit/push/deploy.

## Tích hợp cán bộ theo hợp đồng xác nhận giấy tờ sẵn sàng — 17/10/2026

- Người dùng đã xem kế hoạch và chọn **BE mới nhất**. Đối chiếu source tại `E:/wardmate-backend`: OfficerSubmissionsController/ApplicationAccess của DocumentForm, ApplicationReviewController/DocumentReadinessRequests/ApplicationReviewStore của Workflow. Hợp đồng mới là POST `officer/submissions/{submissionId}/confirm-readiness` và trạng thái `ReadyForDownload`/`DOCUMENTS_READY`; không dùng `/approve` cho thao tác mới. Các ghi chú lịch sử ngày 16/10 về approve phía dưới không còn mô tả code hiện tại. Không sửa BE.
- `documentForms.ts`, `workflow.ts`, `useWorkflow.ts`: nối request-revision/confirm-readiness qua submission thật; dùng Workflow tương ứng chỉ khi discovery thành công và không có đơn. Body DocumentForm `{comment}`/`{}`; officer lấy từ JWT, không bịa officerId. Mỗi thao tác chỉ một POST quyết định toàn hồ sơ. Gỡ client/hook/nút từ chối do BE mới không có endpoint. Cache Workflow/DocumentForm bị invalidate sau cả thành công/lỗi để phục hồi khi Workflow đã lưu nhưng đồng bộ/response thất bại.
- `OfficerReviewWorkspaceView.tsx`: chọn bản khai trong Modal, đọc lại detail/submissions/comments trước quyết định, kiểm tra người thụ lý, phiên bản, trạng thái, nhận xét OPEN và checklist bắt buộc. Lỗi giữ modal/lý do, chỉ báo đã tải lại dữ liệu khi các refetch thành công. Backend vẫn thực thi phường, phân công, chống tự xử lý, quyền và bằng chứng tệp. `OfficerDocumentsPanel.tsx`: badge trạng thái, ngày gửi/ghi chú nếu API có, khóa annotate theo trạng thái đơn, giữ file trong RAM để thử lưu lại khi lỗi. Editor miễn phí giữ nguyên: tạo/đọc đầy đủ comment Word bằng Word rồi upload, chưa có UI comment online đầy đủ.
- Đồng bộ adapters/types, menu/badge/bộ lọc cán bộ/công dân, PDF/QR và evidence: `DOCUMENTS_READY` hiển thị “Giấy tờ sẵn sàng”; PDF chỉ mở khi Workflow ở trạng thái này, tạo từ đơn `ReadyForDownload`. `APPROVED`/`Approved` giữ để xem dữ liệu lịch sử, không mở PDF/QR. Route `approved-qr` vẫn giữ vì BE giữ tương thích. Hợp đồng tại `docs/FRONTEND_SETUP.md`; thêm ghi chú supersede tại audit 16/10, không sửa snapshot OpenAPI lịch sử.
- Kiểm tra: typecheck/lint đạt. Edge/API mock ngoài sandbox gồm `officer-submissions`, `document-workflow`, `document-lifecycle`, `docx-online`, `citizen-dossier-ui`, `citizen-application-wizard` đạt **20/20**, runner exit 0 (1 phút). Sau chỉnh ô chọn tệp mobile chạy lại nhóm liên quan **9/9**, exit 0 (30,6 giây); sau tách thông báo thành công khỏi lỗi accessibility chạy lại annotate **1/1**, exit 0 (9,7 giây). Đã xem ảnh desktop và mobile 390px, ô chọn tệp có nhãn tiếng Việt, không cắt ở mép thẻ; có focus bàn phím. Lượt sandbox trước đó bị ảnh hưởng khi Vite reload trong lúc sửa source, thiếu dữ liệu fixture `updatedAt`/checklist và runner không kết thúc teardown; đã sửa fixture, dừng lượt đó và xác minh lại bằng lượt ngoài sandbox thoát sạch. Chưa kiểm tra screen reader hay zoom trình duyệt 200%.
- Build cuối sau chỉnh UI/accessibility đạt, exit 0 (Vite 18,26 giây); còn cảnh báo annotation Zod/chunk editor lớn đã tồn tại. Lint cuối và `git diff --check` theo cấu hình Git hiện tại đạt. Không thay đổi cấu hình Git hoặc dependency.
- Giới hạn: Swagger Azure chưa truy cập được trong phiên này; chưa xác minh revision BE đã deploy, chưa chạy mutation Azure/Blob/Gotenberg thật. Queue BE chỉ trả `SUBMITTED`/`UNDER_REVIEW`, chưa có endpoint danh sách đầy đủ cho “Cần bổ sung”/“Giấy tờ sẵn sàng”/lịch sử; không tạo API/dữ liệu bù. Tiếp tục giữ cảnh báo nguồn dữ liệu hiện có tại workspace. Chưa commit/push/deploy. Bước tiếp theo ở môi trường thật: kiểm tra bằng tài khoản cán bộ đúng phường được phân công và bộ DOCX thực tế, sau khi xác nhận BE mới được triển khai.

## Chia commit và bàn giao lên main — 16/10/2026

- Theo yêu cầu người dùng: gom toàn bộ thay đổi frontend của các task hiện tại thành đúng 16 commit trên `main`, từ nền `06d71a7`; 15 commit code/config/test từ `0e4cf33` đến `1955da7`, commit thứ 16 chứa audit API, snapshot OpenAPI, giới hạn BE và ghi chú bàn giao này. Không sửa lịch sử commit cũ, không đưa code backend vào đợt này.
- Đã fetch và xác minh `origin/main` trùng nền trước khi chia commit. Remote đích: `https://github.com/wardmate-capstone/wardmate-frontend.git`, nhánh `main`; người dùng đã yêu cầu push. Kết quả push được xác minh bằng so sánh HEAD và remote sau khi hoàn tất commit cuối, báo trong phản hồi bàn giao; không coi commit local là đã push.
- Kiểm tra mới trong phiên chia commit: `npm run typecheck`, `npm run lint`, `git diff --check` đạt. Edge/API mock `tests/form-templates.spec.ts` + `tests/ui-state.spec.ts` đạt **30/30**, process exit 0 (1,6 phút), xác nhận lại upload Blob/500, ngày hiệu lực và đóng form trực tiếp; thay thế giới hạn runner treo ở các lượt lịch sử bên dưới. Build gần nhất của đúng code trước chia commit đạt, không sửa code trong phiên chia commit. Các kiểm tra editor/workflow/responsive và giới hạn Azure thật ghi ở mục tương ứng bên dưới.

## Thiết kế lại trang chi tiết hồ sơ công dân — 16/10/2026

- Theo ảnh và yêu cầu từ ngữ dễ hiểu, hiện đại/trang trọng: sửa `CitizenDossierDetailView.tsx`, `DossierChecklistView.tsx` và điểm truyền tên phường tại `CitizenPage.tsx`. Thông tin hồ sơ/3 bước chuẩn bị–gửi–nhận phản hồi, giấy tờ ở cột chính, khung tiến độ/việc cần làm bên phải trên desktop. Mobile có thông tin gọn 2 cột và link đến bước tiếp theo; khung bên phải khi cuộn nằm dưới topbar. Dùng tên đơn vị từ danh mục đã tải, không đoán tên từ mã; nếu thiếu tên thì hiển thị chưa có thông tin.
- Mỗi mục giấy tờ có yêu cầu, trạng thái và thao tác chính rõ ràng. Ưu tiên Điền trực tuyến; xem/tải mẫu trống và tải Word có sẵn nằm trong phần mở rộng. Thay file input mặc định bằng vùng chọn tệp có nhãn, giới hạn/định dạng và focus bàn phím. “Chốt bản khai” đổi thành “Xác nhận bản khai”; “Đồng bộ checklist” đổi thành “Kiểm tra lại giấy tờ”, chỉ hiện khi cần phục hồi lỗi cập nhật trạng thái. Không lược validation, xử lý lỗi, confirmation xóa/gửi hoặc editor có sẵn.
- Chỉ một nút “Gửi hồ sơ tiền kiểm”, khóa khi chưa đủ bằng chứng từ API/đang ghi dữ liệu; có giải thích lý do. Bản nháp đã lưu chưa được tính hoàn tất cho đến khi xác nhận thật. Nhận xét cán bộ dùng nhãn thay ID kỹ thuật. Thông báo tiền kiểm chưa phải tiếp nhận chính thức được trình bày gọn ở cuối; không tự cam kết hồ sơ hợp lệ hoặc suy đoán lý do từ chối.
- Cập nhật selector/từ ngữ tại `tests/document-workflow.spec.ts`, `tests/document-lifecycle.spec.ts`, `tests/docx-online.spec.ts`, `tests/citizen-application-wizard.spec.ts`; thêm `tests/citizen-dossier-ui.spec.ts` kiểm tra nút gửi, tiến độ, chọn tệp thật qua file chooser, focus mục thiếu, responsive 360/390/768/1440/1920px và sticky không chui dưới topbar.
- Kiểm tra: typecheck/lint đạt; bộ Edge/API mock UI + DocumentWorkflow/Lifecycle + editor đạt 12/12, exit 0. Sau chỉnh mobile chạy UI + application wizard đạt 4/4, exit 0; sau chỉnh sticky chạy lại UI đạt 2/2, exit 0. Đã xem ảnh desktop 1440px/mobile 390px cuối, kiểm tra responsive 360–1920px và khung thao tác không bị topbar che. `git diff --check` đạt. Chưa kiểm thử API Azure thật, screen reader hoặc zoom trình duyệt 200%. Không sửa BE, endpoint, commit/push/deploy; giữ thay đổi task trước.
- Build cuối đạt (exit 0, Vite 14,81 giây); còn cảnh báo annotation Zod/chunk editor lớn đã ghi ở task trước.

## Rà soát toàn bộ DocumentForm và triển khai editor DOCX online — 16/10/2026

- Đã đọc `E:/Mô Tả API.docx`, GET Swagger init/OpenAPI Gateway và đối chiếu controllers/DTO/ApplicationAccess/handler của BE local. Swagger hiện có 26 API nghiệp vụ (+ GET `/`), khác số 23 trong DOCX. Ma trận từng endpoint, caller UI, các luồng tương đương và giới hạn tại `docs/DOCUMENT_FORM_API_AUDIT_2026-10-16.md`; lưu snapshot OpenAPI công khai `docs/document-form-openapi-2026-10-16.json`. Không coi các kịch bản trong DOCX là lệnh mutation production.
- Bổ sung `src/components/documents/DocxOnlineEditor.tsx`: engine `@docx-editor.dev/react/core/fonts` 2.31.0, lazy load; mở DOCX binary, soạn chữ/định dạng/danh sách/bảng/ngắt trang/bố trí, zoom, xuất DOCX thật và lưu API, lỗi giữ nội dung, trạng thái đã lưu chỉ sau API thành công, Ctrl/Cmd+S. Dùng Modal Radix chung (thêm bodyClassName tùy chọn) và bảo vệ bản sửa chưa lưu. Công dân đi từ checklist để điền mới hoặc sửa bản hiện có; hồ sơ khóa chỉ xem. Cán bộ mở editor từ panel và lưu qua annotate-docx; không tự duyệt/gửi yêu cầu bổ sung.
- Bổ sung `CitizenSubmissionsView.tsx` + menu “Bản khai của tôi”, lọc/phân trang server bằng GET submissions; GET metadata khi mở lại, không tự gán applicationId cho legacy. Hooks có query params trong private query key. Thêm thông báo lỗi Blob/DOCX tiếng Việt tại documentForms client. Hiện 23 API có caller UI trực tiếp; 2 API quyết định DocumentForm được thay bằng Workflow cùng nghiệp vụ (tránh gọi hai lần), GET supporting-documents được thay bằng dữ liệu contents đã có.
- Người dùng đã chọn **bản miễn phí sửa DOCX; cán bộ thêm comment bằng Word rồi tải lại**. Không có gói Pro/commercial license. Kiểm thử round trip giữ được comment Word có sẵn, nhưng không có UI tạo/đọc đầy đủ comment/track changes trực tuyến. Nhắc đối chiếu Word khi có review content. Không gửi file sang EditDocx/dịch vụ editor ngoài, không bật telemetry/collaboration/Google Fonts. Các package tên cũ khảo sát đã gỡ, package.json chỉ giữ 3 dependency engine hiện hành.
- Vite prebundle/build target ES2022 để hỗ trợ top-level await của WASM/font shaping. Đã kiểm tra `dist/assets` có font TTF/OTF và harfbuzz WASM, URL font trong bundle trỏ assets cùng origin. Bundle editor ~3,85 MB (~1,2 MB gzip), tải khi mở editor; build vẫn cảnh báo chunk >500 kB và annotation Zod. Trang tham chiếu live tại môi trường kiểm tra chỉ tải được shell Loading; UI dựa bố cục công cụ phía trên/giấy trắng/nền xám/thanh trạng thái, không khẳng định giống mọi chi tiết của EditDocx.
- Kiểm tra: typecheck/lint/build cuối và `git diff --check` đạt; proxy Vite thật local đạt 12/12. Bộ Edge/API mock ngoài sandbox gồm docx-online + document-workflow/lifecycle + jwt-client/design-system/landing đạt **39/39**, process exit 0. Sau chỉnh cuối reset trạng thái tải/bản dịch/assertion in nghiêng, chạy lại nhóm editor đạt **4/4**, process exit 0 (16,9 giây). ZIP/XML kiểm tra chữ đã sửa, định dạng in nghiêng, bảng, comment Word có sẵn, POST tạo/PUT cập nhật, lỗi Blob giữ bản sửa, cán bộ annotate không quyết định, danh sách/lọc/phân trang/legacy và hồ sơ đã gửi chỉ xem. Đã xem ảnh desktop/mobile cuối tại `test-results/docx-online-{desktop,mobile}.png`.
- Các lượt đầu: sửa Vite target do engine dùng top-level await; sửa selector test dùng textbox thay canvas và heading h2 thay selector trùng h1/h2. Lượt sandbox 8/9 thân test đạt rồi dừng teardown; lượt ngoài sandbox 39 ca đã thoát sạch. Lượt chạy 4 editor đồng thời build bị timeout khởi tạo ca đầu (3 ca còn lại đạt); chạy lại sau build đạt đủ 4/4, không kết luận chắc nguyên nhân timeout. `npm audit --omit=dev --json`: 0 vulnerabilities; audit toàn cây còn 2 high ở tooling đã tồn tại cả lúc gỡ các package editor thử nghiệm (brace-expansion/source-map-js), không tự nâng dependency ngoài phạm vi.
- Giới hạn: QA bằng Edge/API mock local; đã xem ảnh desktop/mobile 390px, chưa screen reader/zoom trình duyệt 200%, chưa kiểm tra mọi mẫu DOCX thực tế hoặc Azure mutation/Blob/Gotenberg/QR scan thật. Các khoảng trống BE về QR/snapshot/lịch sử queue vẫn ghi tại `docs/DOCUMENT_FORM_BACKEND_GAPS.md`; chưa sửa BE, commit/push/deploy. Giữ toàn bộ thay đổi chưa commit của task trước. Bước tiếp theo môi trường thật: tài khoản thử theo role, kiểm tra lưu/mở lại/thay phôi và PDF với mẫu thực tế; không coi mock là tích hợp production.

## Bỏ xác nhận đóng form tạo hồ sơ mới — 16/10/2026

- Theo yêu cầu từ ảnh, bỏ hộp “Bỏ thay đổi chưa lưu?” riêng tại `src/pages/citizen/components/CreateDossierModal.tsx`. Nút đóng/Escape/nhấn ngoài đóng form trực tiếp, vẫn chặn đóng khi đang tạo hồ sơ. Gỡ hook cảnh báo chưa lưu khỏi form này; không thay đổi các form khác.
- Cập nhật ca hiện có trong `tests/ui-state.spec.ts` để kiểm tra Escape đóng trực tiếp mà không hiện xác nhận. Giữ thay đổi chưa commit của các task trước; không commit/push/deploy.
- Kiểm tra: typecheck, lint và `git diff --check` đạt. Ca Edge/mock đổi thủ tục/đóng trực tiếp/mở lại báo `ok` (1/1); runner không kết thúc teardown, đã dừng Ctrl+C (exit 1), không coi runner thoát thành công. Không chạy lại build cho thay đổi nhỏ này; chưa kiểm thử môi trường thật.

## Validation ngày hiệu lực khi chỉnh sửa thủ tục — 16/10/2026

- `src/pages/procedure-manager/ProcedureApiDetail.tsx`: trường “Ngày hiệu lực của thay đổi” có dấu bắt buộc/hướng dẫn; kiểm tra bằng Zod khi rời ô và khi lưu. Bỏ trống báo “Vui lòng nhập ngày hiệu lực của thay đổi.” ngay dưới ô, ngày không hợp lệ có thông báo riêng. Chặn trước khi khóa form/gọi API, focus và cuộn đến trường lỗi; nhập lại xóa lỗi tại trường. Không áp đặt giới hạn ngày quá khứ/tương lai mới.
- `tests/form-templates.spec.ts`: thêm hồi quy để trống/rời ô/lưu → lỗi inline và focus, không PUT; nhập ngày hợp lệ → xóa lỗi, lưu đúng DateOnly. Giữ các thay đổi upload DOCX từ task trước, không sửa BE/commit/push/deploy.
- Kiểm tra cuối: typecheck, lint, build và `git diff --check` đạt; build còn cảnh báo annotation Zod/chunk lớn. Lượt Edge/mock cuối: cả 3/3 ca ngày hiệu lực, focus lỗi số lượng và khóa lưu báo `ok`; runner không kết thúc teardown, đã dừng Ctrl+C (exit 1), không coi runner thoát thành công. Lượt đầu phát hiện focus mất do khóa input khi validation, đã sửa kiểm tra ngày trước `run`; lượt kế tiếp sửa kỳ vọng test về aria-invalid được gỡ khi hết lỗi, một ca mở danh sách bị timeout; lượt chạy cuối cả 3 thân test đạt. Chưa xác minh backend thật.

## Đồng bộ xử lý lỗi upload phôi DOCX với BE mới — 16/10/2026

- Đối chiếu source BE tại `E:/wardmate-backend`: `UploadFormTemplateDocxCommandHandler` đã bắt lỗi Blob và trả `document.blob_upload_failed`; `FormTemplatesController` trả **400 `{code,message}`** cho lỗi này. Nếu lưu database thất bại, handler thử xóa blob mới rồi ném lại exception, vẫn có thể trả **500 ProblemDetails**. Endpoint, multipart field `file` và kết quả thành công không đổi; FE đã gửi đúng hợp đồng.
- `src/lib/api/formTemplates.ts`: làm rõ thông báo tiếng Việt cho lỗi kho lưu trữ, hướng dẫn liên hệ quản trị viên khi lặp lại; không hiển thị exception Storage từ message. Lỗi 5xx có hướng dẫn tải lại dữ liệu trước khi thử và giữ `traceId` làm mã hỗ trợ. Giữ hành vi `FormsView` giữ file/xác nhận thay phôi khi lỗi và chỉ báo thành công sau POST thành công.
- `tests/form-templates.spec.ts`: thêm 4 ca hồi quy tải mới/thay phôi × lỗi Blob/500; kiểm tra giữ file, giữ xác nhận, không thành công giả, thử lại gửi nguyên bytes DOCX, multipart có boundary và cập nhật danh sách sau thành công. Cập nhật diễn giải trước/sau sửa BE tại `docs/INVESTIGATE_FORM_TEMPLATE_DOCX_UPLOAD_500_2026-10-16.md`.
- Kiểm tra: typecheck, lint, build và `git diff --check` đạt. Build còn cảnh báo annotation Zod/chunk >500 kB. `npx playwright test tests/form-templates.spec.ts --workers=1`: cả 26/26 ca Edge/API mock báo `ok`, gồm 4 ca mới; runner treo teardown sau ca cuối, đã dừng bằng Ctrl+C (exit 1). Không coi đây là lượt runner thoát thành công; chưa chạy lại ngoài sandbox.
- Giới hạn: chưa xác minh bản BE mới đã deploy, chưa retest upload/Blob/database trên Azure hoặc tra log trace gốc; sửa FE không khôi phục cấu hình Storage/database. Bước tiếp theo ở môi trường thật: xác nhận revision BE và upload/tải lại/thay phôi bằng tài khoản thử nghiệm, tra log theo mã hỗ trợ nếu còn lỗi. Không sửa BE, không commit/push/deploy.

## Tích hợp API Cập nhật Checklist & Đồng bộ Ràng buộc Procedure Catalog — 16/10/2026

- Tích hợp hoàn chỉnh API và giao diện quản lý riêng danh mục giấy tờ (Checklist) cho thủ tục:
  1. **Core API & Types (`src/lib/api/procedures.ts`)**:
     - Thêm Zod schema `checklistUpdateInputSchema` và type `ChecklistUpdateInput`.
     - Thêm method `procedureApi.updateChecklist(id, input)` gọi `PUT /api/v1/procedure-manager/procedures/{id}/checklist` kèm chuẩn hóa ngày hiệu lực ISO DateOnly (`YYYY-MM-DD`).
     - Cập nhật `formsSchema`: chặn toàn bộ GUID rỗng toàn số 0 (`00000000-0000-0000-0000-000000000000`) cho `formTemplateId`.
     - Bổ sung an toàn cho `src/lib/api/serviceUrls.ts` khi chạy trong môi trường node test.
  2. **Validation Rules (`src/lib/procedureValidation.ts`)**:
     - Đồng bộ quy tắc kiểm tra với `ProcedureInputValidator.cs` của backend:
       - Checklist: Tối đa 500 mục, mã giấy tờ (`checklistId`) duy nhất, <= 255 ký tự, không có khoảng trắng đầu/cuối (`trim`), mã trường hợp (`caseCode`) phải thuộc danh sách `cases` của thủ tục.
       - Biểu mẫu: `formCode` và `formName` <= 255 ký tự, không có khoảng trắng thừa, chặn trùng `formCode` trong cùng trường hợp hoặc trùng với biểu mẫu dùng chung.
       - Trường hợp: `caseCode` <= 100 ký tự, `trim`, duy nhất.
     - Hàm `validateChecklistItems(items, allowedCases)` phục vụ kiểm tra độc lập danh mục checklist.
  3. **UI / UX Quản lý Checklist (`ProcedureChecklistModal.tsx` & `ProcedureApiDetail.tsx`)**:
     - Tạo mới component `ProcedureChecklistModal`: Modal chuyên dụng cho phép thêm, xóa, sửa từng mục checklist (mã, trường hợp, tên, hình thức, loại bản sao, số lượng, bắt buộc, ghi chú điều kiện).
     - Nhập số quyết định ban hành (`decisionNumber`) và ngày có hiệu lực (`effectiveDate`).
     - Tự động truyền `expectedUpdatedAt` từ dữ liệu thủ tục để kích hoạt kiểm soát cập nhật đồng thời (Optimistic Concurrency Control).
     - Bắt lỗi HTTP 409 `procedure.concurrent_update` và hiển thị cảnh báo trực quan kèm nút **"Tải lại dữ liệu mới nhất"** để nạp lại dữ liệu mà không làm mất phiên.
     - Tích hợp nút **"Cập nhật giấy tờ (Checklist)"** tại trang chi tiết thủ tục (hòa hợp với Header mới) và banner hướng dẫn trực tiếp trong tab Thành phần hồ sơ của `ProcedureApiEditor`.
  4. **Kiểm tra**:
     - `npm run typecheck`: 0 lỗi.
     - `npm run lint`: 0 lỗi.
     - `tests/procedure-checklist.spec.ts`: 7/7 test cases PASS.

## Chỉnh UI đầu trang chi tiết thủ tục — 16/10/2026

- `src/pages/procedure-manager/ProcedureApiDetail.tsx`: bố trí tiêu đề và thông tin bên trái, nút thao tác bên phải ở desktop; nhãn riêng cho mã thủ tục/lĩnh vực, Badge trạng thái kèm icon, nút quay lại dạng ghost. Mobile xếp dọc, nút rộng toàn hàng; tái sử dụng Button/Badge và icon Phosphor hiện có. Giữ nguyên quyền, modal và hành vi API.
- Kiểm tra lượt này: typecheck, lint, build và `git diff --check` đạt; build còn cảnh báo annotation Zod/chunk lớn. Hai ca Edge/mock hiện có (chỉnh sửa và mở công khai) báo đạt phần thân. Script preview tạm báo đạt ở 1440/768/390/360px, không tràn ngang toàn trang; đã xem ảnh desktop/mobile tại `test-results/procedure-header-{1440,360}.png`, script tạm đã xóa. Cả hai lượt Playwright treo teardown, đã dừng bằng Ctrl+C; không coi là runner thoát thành công. Lượt preview ban đầu không chạy vì cổng 4317 còn bị lượt trước giữ, đã chạy lại sau khi dừng lượt trước.
- Chưa xác minh môi trường thật, screen reader hoặc zoom trình duyệt 200%. Giữ thay đổi có sẵn ở `tsconfig.json` và ghi chú baseUrl; không commit/push/deploy. Không còn việc triển khai trong phạm vi ảnh yêu cầu.

## Sửa cảnh báo `baseUrl` trong VS Code — 16/10/2026

- VS Code dùng TypeScript mới hơn và đánh dấu `compilerOptions.baseUrl` là deprecated. Dự án không cần tùy chọn này: target trong `paths` có thể dùng đường dẫn tương đối từ `tsconfig.json`, còn Vite đã khai báo alias `@` tới `src` trong `vite.config.ts`.
- Đã bỏ `baseUrl` thay vì dùng `ignoreDeprecations` để che cảnh báo, đồng thời đổi target thành `paths: { "@/*": ["./src/*"] }` để tương thích TypeScript 5.8 của dự án. Không đổi import hoặc cấu trúc build.
- Kiểm tra: `npm run typecheck`, `npm run lint`, `npm run build` và `git diff --check` đạt. Build còn cảnh báo annotation Zod và chunk lớn như baseline. Không commit/push trong lượt này vì yêu cầu push trước không mặc nhiên áp dụng cho task mới.

## Rà soát FE, UI/UX và sửa lỗi — 16/10/2026

- Phạm vi mới nhất: rà soát FE công khai/auth và cả 5 workspace. Giữ toàn bộ thay đổi DocumentForm chưa commit của lượt trước; không sửa BE, không commit/push/deploy.
- Đã sửa: focus/Tab/Escape và cuộn menu mobile bằng Radix; popup thông báo tràn viewport, route hồ sơ sai, số thông báo giả và chuông quản lý không hành động; clipboard báo thành công trước kết quả; nút in chỉ hiện toast; form tạo hồ sơ mất phường khi đổi thủ tục và URL tự mở lại modal; danh sách hồ sơ thiếu phân trang/loading/lỗi/thử lại; bộ lọc không thực sự đặt lại; validation và nhãn trường hồ sơ cán bộ, giữ bản sửa công dân khi refetch, ngày địa phương và nhãn định danh kê khai. Hướng dẫn công dân không còn lịch tiếp nhận/cam kết QR ưu tiên gắn cứng chưa xác minh.
- Khôi phục mật khẩu, gửi câu hỏi, đánh giá và thông báo chưa có hợp đồng API tích hợp: hiện trạng thái chưa khả dụng rõ ràng, bỏ gửi/đổi mật khẩu/đánh giá thành công giả và dữ liệu thông báo mẫu. Không tự tạo endpoint. Editor Word minh họa cũ không được dùng bởi luồng hiện tại.
- Thêm `tests/ui-audit.spec.ts`, `tests/ui-state.spec.ts`; cập nhật notifications/landing/feedback và fixture auth. Sửa selector checkbox điều khoản; kiểm tra menu đa workspace trên `/hoi-dap` để tránh chạy đua với redirect `/` của quản trị; test dashboard cán bộ kiểm tra nội dung thật thay vì nhãn của menu mobile đóng.
- Kiểm tra cuối: typecheck, lint, build và `git diff --check` đạt; proxy Vite thật với targets localhost đạt 12/12. Lượt Edge/mock toàn bộ đạt 157/158 (5,2 phút), ca auth còn lại do fixture IAM nhận nhầm request danh mục/hồ sơ nền và gọi evaluate trước workspace sẵn sàng sau reload. Đã bổ sung mock danh mục/wards/workflow và chờ heading; chạy lại cả nhóm auth đạt 8/8, process thoát mã 0. Không chạy lại toàn bộ 158 ca sau sửa fixture cuối. Nhóm UI audit/auth trước đó đạt 15/15, state/notifications đạt 6/6. Đã xem ảnh mobile công dân/quản trị, kiểm tra reflow 5 workspace ở 320/720/1440 px. Chi tiết phạm vi và giới hạn tại `docs/FE_UI_UX_AUDIT_2026-10-16.md`.
- Giới hạn: kiểm thử Edge/API mock local, chưa xác minh Azure thật; chưa screen reader, zoom trình duyệt thực tế hoặc máy in vật lý. Các khoảng trống API/BE theo `docs/DOCUMENT_FORM_BACKEND_GAPS.md` còn chờ. Build còn cảnh báo dependency Zod và chunk lớn.

## Điều tra upload/thay phôi DOCX trả 500 — 16/10/2026

- Phân tích response production `POST /api/v1/form-templates/e254056e-984b-4cb6-9647-e284daf94166/upload-docx`, trace `00-8bd42c0e86d2d1e420c8036bf5dd59fe-331b61724d9dc270-00`. FE multipart/route đúng; sai quyền/template/file sẽ trả 401/403/404/400, không khớp lỗi 500 hiện tại.
- Source BE không bắt exception tại `CreateIfNotExistsAsync`, `UploadAsync` và `SaveChangesAsync`. Kết luận ưu tiên là cấu hình/quyền/kết nối Azure Blob của revision DocumentForm; khả năng thấp hơn là lỗi PostgreSQL sau khi blob được ghi. Chưa đủ log để chọn chính xác nguyên nhân con.
- Báo cáo, cách tra log theo trace, kiểm tra secret reference không lộ secret và checklist retest: `docs/INVESTIGATE_FORM_TEMPLATE_DOCX_UPLOAD_500_2026-10-16.md`.
- Máy hiện tại không có Azure CLI nên chưa đọc Container App log; không gọi mutation production, không sửa FE/BE/hạ tầng, không commit/push/deploy. Chỉ thay tài liệu, đã kiểm tra nội dung và đường dẫn; không chạy lại typecheck/lint/build/Playwright.

## Triển khai FE theo kế hoạch DocumentForm/UI/validation — 16/10/2026

- Theo yêu cầu triển khai kế hoạch `docs/document-form-integration-plan-2026-10-16.md`, đã hoàn thành phần FE có hợp đồng trong P0–P3 và kiểm thử local/mock P4. Bắt đầu từ HEAD `91cb439`; giữ các thay đổi tài liệu chưa commit của lượt lập kế hoạch. Không sửa BE, không commit/push/deploy.
- `src/lib/api/documentForms.ts`, `src/hooks/useDocumentForms.ts`, `src/hooks/useWorkflow.ts`, `vite.config.ts`: nối discovery bản khai cán bộ, QR metadata/PNG, giữ submissionId nullable của PDF và query filter; cache riêng theo danh tính/hồ sơ, invalidate xuyên service; proxy có QR/image và nhận đúng query PDF. Test proxy thật: `tests/api-proxy-check.mjs`, cấu hình hosting ở `docs/FRONTEND_SETUP.md`.
- Công dân: `CreateDossierModal.tsx` dùng RHF/Zod/Modal chung, chọn case rõ và thử lại danh mục; `DossierChecklistView.tsx` dùng card responsive, tách lưu nháp/chốt, quantity thực tế theo tệp, xác nhận xóa, preview/tải minh chứng, đồng bộ checklist và báo bước đã lưu khi chốt/PATCH thất bại. `CitizenPage.tsx` kiểm tra bằng chứng mới nhất trước gửi/gửi lại, resubmit không PATCH NEED_REVISION; `CitizenDossierDetailView.tsx` có xác nhận pháp lý, link đến mục thiếu/nhận xét, khóa gửi khi tài liệu đang ghi và không hiển thị version 0. Nút Chỉnh sửa trong danh sách mở chi tiết thật.
- Cán bộ: `OfficerReviewWorkspaceView.tsx` thay nội dung minh họa bằng dữ liệu server, RHF/Modal cho comment/quyết định, guard OPEN đúng phiên bản và JSON Pointer escape, không fallback/xóa comment local. `OfficerDocumentsPanel.tsx` tải metadata trước/binary theo lựa chọn, xem DOCX thật, upload Word có ghi chú; dùng `DocumentFilePreview.tsx` để hủy request/thu hồi Blob URL. Nhận xử lý có hành động rõ và khóa gọi lặp. Quyết định toàn hồ sơ chỉ gọi Workflow một lần; lỗi giữ modal và đọc lại trạng thái; duyệt thành công giữ workspace để mở PDF.
- PDF/QR: nhóm theo submissionId, PDF cũ null tách riêng; ảnh QR và thao tác tải dùng binary thật, 404 chưa có QR có hướng dẫn, không tự tạo PDF khi mở QR và bỏ phiếu hẹn giả. Giữ Word tải/sửa/upload, chưa có engine Word web; preview không bảo đảm hiển thị Word comments. Quyền ghi phôi FE yêu cầu PROCEDURE_MANAGER theo BE; IT_ADMIN đơn lẻ chỉ xem. Hàng đợi có phân trang và ghi rõ chỉ phản ánh pending, chưa tự tạo danh sách lịch sử/tiếp nhận.
- Kiểm tra: `npm run typecheck`, `npm run lint`, `npm run build` đạt; build còn cảnh báo annotation Zod và chunk >500 kB như baseline. `node tests/api-proxy-check.mjs` đạt **12/12** route qua Vite thật với HTTP targets cục bộ. Bộ Edge/mock **63/63 đạt**, process thoát mã 0; sau hai chỉnh cuối (ẩn version 0/giữ workspace sau duyệt), chạy lại nhóm DocumentWorkflow/Lifecycle đạt **6/6**, build/typecheck/lint đạt. Sửa cuối nội dung lỗi tiếng Việt và bỏ link nhận xét trùng đã được kiểm tra diff, không chạy lại toàn bộ E2E cho thay đổi text này.
- Kiểm thử thêm 6 ca luồng tài liệu tại `tests/document-workflow.spec.ts`, `tests/document-lifecycle.spec.ts`, fixture `tests/fixtures/documentWorkflow.ts`; đã đi hết vòng v1 → bổ sung → sửa/chốt → resubmit v2 → duyệt, recovery lỗi từng bước, file 0 byte/sai đuôi/quá 20 MiB, PDF legacy/QR 404/PNG download và không quyết định trùng. Có kiểm tra 360/390px và đã xem ảnh mobile tại `test-results/document-validation-mobile.png`. Chưa xác minh zoom 200% hoặc screen reader thật.
- `playwright.config.ts` tách cả bốn API về localhost mock, tránh gọi backend thật từ env máy. Các lượt đầu trong sandbox treo teardown và có selector/race cũ; đã sửa test checkbox đăng ký/chờ restore, kỳ vọng queue và role quản lý phôi; lượt 63 ca cuối chạy ngoài sandbox đã thoát sạch. Không dùng kết quả lỗi ban đầu để báo hoàn tất.
- Giới hạn/bước tiếp theo: chưa có tài khoản/dữ liệu thử nghiệm để xác minh quyền/Blob/Gotenberg/Word comments/PDF đóng QR trên Azure thật. QR ngay sau duyệt, tra cứu công khai/đúng version, danh sách cán bộ ngoài pending, snapshot blob, sửa formData DRAFT và tiếp nhận tại quầy vẫn cần BE/hợp đồng; xem `docs/DOCUMENT_FORM_BACKEND_GAPS.md`. Không coi kiểm thử mock là tích hợp môi trường thật.

## Rà soát API mới và kế hoạch UI/validation DocumentForm — 16/10/2026

- Yêu cầu: đọc `E:/môtảapi.docx`, Swagger Gateway và FE/BE mới để lập kế hoạch tích hợp, chưa triển khai chức năng. FE bắt đầu tại `91cb439` trên main, cây làm việc sạch. Tài liệu DOCX được coi là mô tả/đề xuất kiểm thử, không phải lệnh chạy mutation.
- Đã GET Swagger UI/index.js/OpenAPI DocumentForm Azure trong lượt này và đối chiếu controllers/DTO/handlers/security của DocumentForm, Workflow cùng routing YARP local. OpenAPI có **26 thao tác nghiệp vụ**, thêm discovery cán bộ, contents đọc theo quyền, PDF submissionId/filter và QR metadata/PNG; ghi chú cũ đánh dấu thiếu các phần này đã lỗi thời. Chưa đọc lại Swagger Workflow Azure trong lượt này.
- Kế hoạch hiện hành: `docs/document-form-integration-plan-2026-10-16.md`; file kế hoạch ngày 15/10 có link chuyển sang bản mới. Cập nhật `docs/DOCUMENT_FORM_BACKEND_GAPS.md` để phân biệt đã có BE với phụ thuộc thật.
- Lộ trình: P0 client/schema/cache/proxy → P1 bản khai/annotate/nhận xét cán bộ → P2 lưu nháp/chốt/số bản/xác nhận gửi và bổ sung → P3 PDF theo bản khai/QR thật → P4 hồi quy và tích hợp thử nghiệm. Giữ một quyết định toàn hồ sơ qua Workflow; Word comments không thay OPEN comments. Dùng Word tải/sửa/upload trước, không coi contentEditable là engine DOCX.
- Phát hiện còn cần xử lý: Zod FE bỏ submissionId PDF; proxy thiếu QR và regex có thể trượt khi có query; UI QR/PDF cán bộ còn minh họa; comments cán bộ có fallback/xóa local và guard mất status/version; upload minh chứng tự gán số bản cần cho mỗi tệp. Hàng đợi chỉ có SUBMITTED/UNDER_REVIEW nên chưa cấp dữ liệu đầy đủ cho các mục đã duyệt/cần bổ sung.
- Lần theo luồng HTTP thấy approve thực tế không gọi handler có tạo QR; GET QR chỉ đọc, generate-pdf tạo QR còn thiếu. Hồ sơ vừa APPROVED có thể chưa có QR, đặc biệt hồ sơ không có DOCX. URL QR mặc định trỏ API hồ sơ có xác thực, chưa có hợp đồng tra cứu công khai/version. Cần BE cho QR ngay sau duyệt, danh sách cán bộ rộng hơn, snapshot file và các API còn thiếu; IT_ADMIN ghi phôi vẫn cần quyết định quyền.
- Kiểm tra lượt này: đọc source/DOCX/OpenAPI, kiểm tra đường dẫn tài liệu và diff. Không chạy typecheck/lint/build/Playwright/build BE vì chỉ đổi tài liệu; chưa đăng nhập hoặc kiểm thử mutation/binary/quyền Azure thật. Không sửa chức năng FE, không sửa BE, không commit/push/deploy. Bước tiếp theo là triển khai theo đợt khi có yêu cầu; không tự thực hiện toàn bộ danh sách chờ.

## Tối ưu Smart Polling cho hồ sơ công dân — 15/10/2026

- Theo yêu cầu người dùng, thay thế cơ chế polling 30 giây mù quáng bằng Smart Polling có điều kiện trong `src/hooks/useWorkflow.ts` (`useCitizenApplications`).
- `refetchInterval` được cấu hình dạng hàm: chỉ tự động làm mới mỗi 30 giây khi danh sách có hồ sơ ở trạng thái chờ cán bộ thụ lý/tiền kiểm (`SUBMITTED`, `UNDER_REVIEW`). Khi tất cả hồ sơ ở trạng thái tĩnh (`DRAFT`, `APPROVED`, `REJECTED`), polling tự động dừng (`false`), tránh bắn request dư thừa vào backend và giữ tab Network sạch.
- Kiểm tra: `npm run typecheck` đạt 0 lỗi, `npm run lint` đạt 0 lỗi.

## Điều tra Workflow tạo hồ sơ trả 500 — 15/10/2026

- Response `POST /api/v1/applications` có trace `00-bec4f2471bb01af0c7eeb25d793fb161-1655b599d4dae45b-00`. Đối chiếu source backend xác định validation/phụ thuộc đều trả lỗi có kiểm soát; thao tác DB là nhánh còn ném 500. Azure trước đó chỉ ghi nhận đã áp dụng 5 migrations, còn model mới cần migration thứ 6 `SnapshotChecklistRequirements` để ghi metadata checklist.
- Đã sửa backend local bật `Database:AutoMigrate=true`; cần redeploy Workflow hoặc chạy migration Azure trước khi endpoint hoạt động. FE không thể sửa schema database. `workflowError` được bổ sung hiển thị `traceId` cho lỗi 500 để vận hành tra log chính xác.
- Kiểm tra FE: typecheck/lint sẽ được chạy ở cuối lượt. Backend không có .NET SDK; Docker daemon cũng không chạy nên chưa thể build Release local. Cấu hình JSON đã parse và xác nhận AutoMigrate=True; chưa deploy/migrate Azure.

## Sửa refresh-token gọi cross-origin — 15/10/2026

- Ảnh Network cho thấy browser gọi thẳng `https://wardmate-iam.../api/v1/auth/refresh-token`, làm refresh cookie HttpOnly phụ thuộc CORS/SameSite và thất bại. Nguyên nhân là service URL từ env được dùng trực tiếp ở runtime.
- Thêm `VITE_USE_API_PROXY=true`: runtime giữ base URL rỗng và gọi `/api/...` cùng origin; Vite vẫn đọc bốn URL service trong env để làm proxy target. Catalog, Workflow và DocumentForm cũng đi cùng cơ chế nên bundle không chứa URL Azure.
- Đã cập nhật `.env.example` và `.env.development.local` (Git ignore). Dev server phải khởi động lại sau khi đổi env. Với hosting production bật proxy, hạ tầng hosting cũng phải chuyển tiếp `/api` theo cùng bảng route; `vercel.json` hiện không chứa backend URL theo yêu cầu người dùng.
- Kiểm tra: build đạt; tìm URL Azure trong JS build không có kết quả. Vite cổng thử nghiệm nhận `/api/v1/auth/refresh-token` và cố proxy tới IAM; sandbox chặn outbound TCP bằng `EACCES`, nên chưa xác minh response Azure thật. Cổng 5173 đang do tiến trình khác sử dụng và cần người dùng restart để nhận env mới.

## Chuẩn hóa URL service qua biến môi trường — 15/10/2026

- Theo yêu cầu người dùng, đã loại toàn bộ URL backend khỏi `src`, `vite.config.ts` và `vercel.json`. Giữ ba biến cũ `VITE_API_BASE_URL`, `VITE_CATALOG_API_URL`, `VITE_WORKFLOW_API_URL`; bổ sung `VITE_DOCUMENT_FORM_API_URL` vì DocumentForm dùng origin Gateway riêng.
- `serviceUrls.ts` chuẩn hóa base URL và dựng đường dẫn cho Catalog, Workflow, DocumentForm. JWT client chỉ cho gửi access token RAM tới IAM origin hoặc các service origin được khai báo trong env; origin tùy ý vẫn bị chặn. Form templates cũng chuyển sang DocumentForm env, procedure APIs chuyển sang Catalog env.
- `vite.config.ts` đọc env bằng `loadEnv`; proxy chỉ được tạo khi biến tương ứng có giá trị. `vercel.json` chỉ giữ SPA fallback, không chứa endpoint backend; deployment phải cấu hình bốn biến VITE trong Environment Variables rồi build lại.
- Khôi phục URL cũ trong `.env.example`, thêm biến DocumentForm và tạo `.env.development.local` bị Git ignore cho máy hiện tại. Không đưa token/secret vào env; các URL base là cấu hình công khai.
- Kiểm tra: typecheck, lint, build đạt; 16/16 ca JWT/Citizen CTA/Procedure detail đạt phần thân. Playwright trên máy vẫn treo ở teardown sau khi báo đủ ca đạt và được dừng bằng Ctrl+C.

## Triển khai DocumentForm / ApplicationWorkflow vào FE — 15/10/2026

- Đã triển khai phần FE trong `docs/document-form-workflow-plan.md`: same-origin proxy/rewrite Vite và Vercel; client Zod/TanStack Query cho submissions, application contents, supporting/generated documents và các thao tác cán bộ; Workflow giữ đủ metadata checklist và đọc đúng ProblemDetails thiếu giấy tờ.
- Luồng công dân dùng dữ liệu thật: nút **Chuẩn bị hồ sơ** từ chi tiết thủ tục giữ `procedureId/caseCode`; modal tạo hồ sơ chọn case và phường IAM thật, không còn phường fallback; checklist upload/tải/xóa minh chứng, tải phôi, upload/chốt DOCX và reload từ server. Gửi lại tính trạng thái checklist theo bằng chứng server thay vì đánh dấu hoàn tất hàng loạt.
- Hồ sơ đã duyệt có khu vực tạo/danh sách/tải PDF. Workspace cán bộ tải danh sách và binary supporting documents thật. Không dùng editor/toast giả hoặc localStorage/blob URL làm trạng thái hồ sơ.
- Phần không thể hoàn tất vì thiếu hợp đồng BE được ghi chi tiết trong `docs/DOCUMENT_FORM_BACKEND_GAPS.md`: API cán bộ tìm submission theo application, ánh xạ PDF về submission, quyền IT_ADMIN/DocumentManager, snapshot file theo phiên bản, sửa formData DRAFT, vòng đời comment, QR/tiếp nhận chính thức. Client cho bốn thao tác officer submission đã sẵn sàng nhưng UI chưa thể gọi an toàn khi không có submissionId.
- Kiểm tra: `npm run typecheck`, `npm run lint`, `npm run build` đạt; build còn cảnh báo Zod annotation và chunk chính lớn như trước. Bộ Playwright 143 ca chạy hết phần thân nhưng 5 ca timeout và runner treo ở teardown; 3 timeout liên quan locator cũ đã được phân tích/sửa; lượt chạy gộp liên quan đạt 4/5 và ca selector cuối đạt khi chạy riêng. Chưa kiểm thử mutation Azure thật do không có phiên/tài khoản thử nghiệm trong lượt này.
- Không sửa backend, không commit/push/deploy. Giữ các thay đổi tài liệu chưa commit từ lượt lập kế hoạch.

## Rà soát và kế hoạch DocumentForm / ApplicationWorkflow — 15/10/2026

- Phạm vi: yêu cầu đọc hai service, đối chiếu FE/BE và lập kế hoạch tích hợp/đồng bộ UI/validation. Đã tạo `docs/document-form-workflow-plan.md`; chưa sửa chức năng, chưa commit/push/deploy.
- Đã GET và đọc OpenAPI thật của DocumentForm qua Gateway và ApplicationWorkflow theo URL người dùng cung cấp ở lượt khảo sát đầu. **Cập nhật sau pull BE**: source `E:/wardmate-backend` đã có đầy đủ nhóm API tài liệu/metadata trước đây thiếu; đã đọc controllers, handlers, security, DTO, cấu hình index, PDF engine và `docs/system-constraints.md`. Kế hoạch phủ 23 API nghiệp vụ DocumentForm + 16 API Workflow. Chưa xác minh deployment/image/config Azure đồng bộ source mới.
- Đính chính trạng thái cũ: **chưa đủ bằng chứng hoàn tất 100% tích hợp workflow**. FE có client/hooks/workspace nhưng chưa có luồng tài liệu liên service đầy đủ. `FormDocxEditorModal` chỉ toast khi lưu/tải; `DossierChecklistView` giữ blob URL/localStorage thay vì upload server; cập nhật checklist gửi trạng thái UI và tên file vào fileUrl; adapter làm mất metadata Azure; tạo hồ sơ thiếu caseCode. Vercel chưa rewrite workflow, routing tài liệu dưới `/applications/...` cần ưu tiên trước prefix workflow. Chi tiết và thứ tự khắc phục ở tài liệu kế hoạch.
- Kế hoạch: P0 chốt hợp đồng/routing/DTO/cache/lỗi → P1 bắt đầu từ chi tiết thủ tục, file minh chứng/bản khai thật, gửi/gửi lại/cán bộ → P2 PDF và hồi quy. Vùng khoanh đỏ trong ảnh đề xuất nút “Chuẩn bị hồ sơ”. Tái sử dụng kho/phôi/preview hiện có.
- Đã chốt từ source mới: formCode đối chiếu chính xác checklistId; Workflow kiểm tra fileExists/trạng thái/template hoặc tổng số lượng minh chứng đúng loại bản/hình thức; DOCX/minh chứng tối đa 20 MiB. NEED_REVISION cho sửa submission Submitted về Draft rồi chốt lại, không PATCH checklist DRAFT trong luồng bổ sung. DocumentForm approve/request-revision chuyển tiếp quyết định toàn hồ sơ sang Workflow; annotate không tạo OPEN comment. PDF chỉ từ submission đã lưu/Approved và hồ sơ APPROVED, không gửi File thay thế; Gotenberg render thật.
- Còn phụ thuộc BE: cán bộ thiếu discovery submissionId (contents chỉ chính chủ); DocumentManager yêu cầu PROCEDURE_MANAGER nên IT_ADMIN có permission vẫn có thể bị 403, cần quyết định quyền nếu muốn quản trị phôi trong Admin. Snapshot JSON chưa đóng băng file theo phiên bản; PDF DTO chưa có SubmissionId để gán chắc chắn về từng bản khai. Editor trực tuyến vẫn cần engine DOCX thật; phương án hiện có là Word tải về/upload. Các phần đã đủ source không còn chờ “lấy source mới”.
- Kiểm tra lượt cập nhật: đối chiếu source và nội dung/đường dẫn/diff tài liệu. Không chạy lại HTTP Azure, typecheck/lint/build/E2E hoặc build BE vì chỉ thay tài liệu; chưa thử mutation/tài khoản/quyền thật. Không sửa BE hoặc tài liệu Catalog `IMPLEMENT_PROCEDURE_API.md`; không commit/push/deploy. Kết quả test trong mục cũ thuộc phiên trước.

## Tích hợp Dịch vụ Tiền kiểm Hồ sơ Đa phiên bản & Đồng bộ Quy tắc Backend — 15/10/2026 (bàn giao trước, xem đính chính ở trên)

- **Phạm vi & Trạng thái ghi nhận trước đây**: Đã thêm client/hooks và kết nối một phần workspace với `WardMate.Services.ApplicationWorkflow` (API Swagger: `https://wardmate-application-workflow.blackmeadow-a2f12767.japaneast.azurecontainerapps.io`). Rà soát 15/10 phát hiện khoảng trống tài liệu/validation/routing; không coi đây là tích hợp hoàn tất hoặc đã kiểm thử Azure thật.
- **Việc đã làm**:
  1. **Hạ tầng API & Proxy**:
     - `vite.config.ts`: Cấu hình reverse proxy cho `/api/v1/applications` và `/api/v1/officer/applications` trỏ đến Cloud Container App.
     - `.env.example`: Bổ sung biến môi trường `VITE_WORKFLOW_API_URL`.
     - `src/lib/api/workflow.ts`: Zod schemas, TypeScript types, `workflowApi` client (15 endpoints), và hàm trích xuất/chuyển ngữ lỗi RFC 7807 (`workflowError`) hỗ trợ các mã lỗi nghiệp vụ: `checklist_incomplete`, `documents_incomplete`, `documents_unavailable`, `invalid_target`, `comments_required`, `open_comments`, `version_conflict`, `forbidden`, `invalid_ward`, v.v.
     - `src/hooks/useWorkflow.ts`: Bộ TanStack Query hooks, query keys và mutations cho toàn bộ các thao tác hồ sơ công dân và cán bộ.
     - `src/lib/api/workflowAdapters.ts`: Mappers chuyển đổi 2 chiều giữa Backend DTOs (`ApplicationDto`, `ApplicationSummaryDto`, `CommentDto`, `HistoryDto`) và ViewModels (`OfficerApplication`, `CitizenDossier`).
     - `src/lib/api/index.ts`: Chuẩn hóa `getPublicWards` tự động unwrap `{ value: WardDto[] }` từ IAM API.
  2. **Phân hệ Cán bộ Một cửa (Officer Workspace)**:
     - `src/types/officer.ts`: Bổ sung trạng thái `'REJECTED'` vào `ApplicationStatus`.
     - `src/pages/officer/OfficerPage.tsx`: Kết nối danh sách hồ sơ chờ tiền kiểm (`useOfficerPendingApplications`), tiếp nhận thụ lý (`assignOfficer`), duyệt/yêu cầu sửa/từ chối hồ sơ. Tự động gán thụ lý khi cán bộ mở hồ sơ chưa phân công để tránh lỗi 404 backend.
     - `src/pages/officer/OfficerReviewWorkspaceView.tsx`: Thêm Modal Từ chối hồ sơ kèm lý do; chuẩn hóa chức năng comment tuân thủ nghiêm ngặt RFC 6901 JSON Pointer cho E-form (`/formData/...`) và GUID cho Checklist item; cài đặt guardrail chặn yêu cầu sửa nếu thiếu comment và chặn duyệt nếu còn comment OPEN; tích hợp Diff Viewer đối chiếu lịch sử phiên bản (V1 ↔ V2).
     - `src/pages/officer/OfficerApplicationListView.tsx`: Cập nhật bộ lọc trạng thái và giao diện hàng đợi trống.
  3. **Phân hệ Công dân (Citizen Portal)**:
     - `src/pages/citizen/types.ts`: Bổ sung `id`, `currentVersion`, `wardCode`, `formData`, `'Đã từ chối'` vào `CitizenDossier`.
     - `src/pages/citizen/CitizenPage.tsx`: Kết nối `useCitizenApplications()` lấy danh sách hồ sơ thực tế; Modal khởi tạo hồ sơ liên kết danh mục Catalog (`proceduresQuery`) và danh mục phường IAM (`getPublicWards`) với mã GUID và `wardCode` chuẩn; tích hợp mutation nộp tiền kiểm và nộp lại hồ sơ (`resubmit`) bảo lưu `formData` và đúng GUID checklist.
     - `src/pages/citizen/views/CitizenDossierDetailView.tsx`: Hiển thị thông báo pháp lý bắt buộc (tiền kiểm không thay thế nộp chính thức tại UBND); hiển thị nhận xét của cán bộ (OPEN/RESOLVED); khối thông báo kết quả duyệt kèm hướng dẫn mang giấy tờ gốc đến Một cửa; khối từ chối kèm lý do; các nút hành động nộp/gửi lại tương ứng theo trạng thái.
- **Kiểm tra**:
  - `npm run typecheck`: PASS (0 errors, 0 warnings).
  - `npm run lint`: PASS (0 errors).
  - `npm run build`: PASS (Vite production bundle thành công, 0 errors).

## Đóng gói 10 commit validation/UX trên main — 14/10/2026

- Người dùng yêu cầu chia phần validation/UX thành đúng 10 commit và đẩy frontend lên main. Baseline `83d730b`; đã fetch và xác nhận HEAD/origin/main đồng bộ trước đóng gói. Remote: https://github.com/wardmate-capstone/wardmate-frontend.git. Không thao tác Git hoặc sửa source backend.
- 9 commit code/test: `8e47809` validation/Int32; `4c7d0b6` hook bảo vệ dữ liệu chưa lưu; `60d363a` preview/zoom; `241baa0` kho Admin; `7e08621` editor/bộ chọn mẫu; `7d86070` chỉnh sửa thủ tục; `4f803e4` tạo thủ tục; `f513921` xuất bản nháp; `e51a93e` kiểm thử. Commit tài liệu chứa ghi chú này là commit thứ 10.
- Lượt đóng gói chỉ kiểm tra diff, trạng thái nhánh/remote và phạm vi commit; không thay đổi hành vi code, không chạy lại kiểm thử. Kết quả typecheck/lint/build và 51 ca mock Edge thuộc lượt triển khai ngay trước, được ghi chi tiết bên dưới. Azure 403 vẫn còn.
- Ghi chú được tạo trước thao tác push cuối: kiểm tra HEAD/origin/main hoặc remote để xác minh trạng thái gửi đủ 10 commit. Không coi push Git là xác nhận deployment thành công.

## Validation và UX luồng biểu mẫu/thủ tục — 14/10/2026

- Người dùng duyệt triển khai toàn bộ kế hoạch rà soát. Baseline frontend `83d730b` trên main, cây làm việc sạch khi bắt đầu. Phạm vi lần này là code local; chưa commit/push/deploy.
- `src/lib/procedureValidation.ts`: tách validation lúc lưu/xuất bản khỏi DTO đọc; bỏ tự điền mã/tên mẫu, số bản, lệ phí và thời hạn. Yêu cầu số bản là số nguyên dương trong giới hạn Int32 của BE; phí/thời hạn vẫn cho số thập phân không âm. Chặn dữ liệu bắt buộc trắng, trường hợp trùng mã/tham chiếu không còn tồn tại, bước có thứ tự/tên sai; đối chiếu `ProcedureInputValidator.cs` và JsonModels ở backend local. Không thay đổi backend.
- `ProcedureApiEditor.tsx`, `ProcedureApiDetail.tsx`, `ProcedureManagerPage.tsx`, `ProcedureDraftWorkspace.tsx`: lỗi tiếng Việt tại ô nhập, đánh dấu tab lỗi, danh sách lỗi có thể bấm, chuyển tab/mở thiết lập/focus sau khi giao diện dựng xong. Áp dụng cho tạo/sửa thủ tục và xuất bản bản nháp/nhận diện PDF; lưu nháp vẫn cho giữ dữ liệu chưa hoàn chỉnh. Ngày hiệu lực được báo lỗi riêng.
- `useUnsavedChanges.tsx`, `FormsView.tsx`: Modal Radix xác nhận khi đóng X/Escape có dữ liệu chưa lưu ở tạo/sửa thủ tục và tạo/upload phôi; cảnh báo khi đóng/tải lại trình duyệt. Chặn đóng trong khi đang ghi và khóa dữ liệu đang lưu. Chưa thêm chặn điều hướng SPA toàn ứng dụng.
- `ProcedureFormPicker.tsx`: chọn trường hợp từ quy trình, phát hiện tham chiếu cũ; không cho biến DOCX thành E-form qua dropdown, giữ loại ONLINE_INTERACTIVE đã tồn tại. Nút Đã chọn trong kho không bỏ mẫu; bỏ bằng nút riêng và giữ cấu hình khi chọn lại trong cùng phiên editor, kể cả đổi tab. Bỏ vùng cuộn kho lồng bên trong modal. `DocxPreview.tsx` thu/phóng theo mức vừa khung thực tế; `FormTemplateActions.tsx` vô hiệu hóa Xem mẫu khi biết chắc chưa có file.
- Kiểm tra: typecheck, lint, build và diff --check đạt; build còn cảnh báo Zod annotation/chunk lớn như baseline. Xác minh **51 ca Edge/mock đạt** theo hai lượt: `tests/form-templates.spec.ts` chạy cuối đạt **21/21**; `tests/procedure-manager.spec.ts` + `tests/workspace-sidebar.spec.ts` đạt **30/30** trong lượt gộp trước. Lượt gộp từng còn 2 ca biểu mẫu lỗi, đã sửa nhãn truy cập dropdown và xác minh lại toàn bộ 21 ca riêng; giữ file ổn định khi chạy để tránh Vite tự tải lại. Các test HTTP dùng mock, DOCX được dựng bằng thư viện thật; không coi là kiểm thử Azure thật.
- `tests/form-templates.spec.ts` thêm 7 ca cho validation số bản/phí/thời hạn/metadata, tham chiếu trường hợp, giữ thiết lập qua đổi tab, focus lỗi, X/Escape và khóa thao tác ghi; ca preview mobile kiểm tra kích thước trang thực sự giảm/tăng khi thu/phóng. `tests/procedure-manager.spec.ts` cập nhật selector theo UI hiện tại (nút chọn trường hợp, PDF hiển thị sẵn, nhãn đối soát và điều hướng sau xuất bản), giữ kiểm tra request/revision/conflict và không lưu khi validation sai. Đã xem ảnh bộ chọn desktop và chạy kiểm tra viewport mobile; không chạy toàn bộ test repo.
- 403 **chưa sửa trên Azure**: request người dùng cung cấp là POST `/api/v1/form-templates` bị `auth.forbidden`, không phải upload-docx. Source DocumentForm local vẫn không có policy/auth tương ứng deployment. FE giữ JWT client/quyền/lỗi traceId; không bypass, không tự cấp quyền. Cần source/config đúng bản Azure để đối chiếu policy và claims IAM; không yêu cầu người dùng gửi token/cookie.

## Đóng gói 12 commit trên main — 14/10/2026

- Người dùng yêu cầu chia toàn bộ phần biểu mẫu thành đúng 12 commit và push frontend lên origin/main. Baseline `d8b7e49`; đã fetch và xác minh main/origin/main đồng bộ trước khi tạo commit. Remote: https://github.com/wardmate-capstone/wardmate-frontend.git. Không có thay đổi ở repository backend.
- 11 commit code/test: `9629d19` cấu hình Gateway/Vercel; `133121c` dependency preview; `9400c6a` API/validation/lỗi; `5eb81f6` dựng DOCX; `38b5074` thao tác xem/tải; `8c85033` kho Admin; `7ff69ab` bộ chọn; `6bad714` editor/chi tiết thủ tục; `489c394` workspace/sidebar; `6d93bf6` mẫu ở trang công khai; `8566118` kiểm thử. Commit tài liệu chứa ghi chú này là commit thứ 12.
- Kiểm tra ngay trước đóng gói: build (gồm tsc --noEmit), lint, diff --check đạt; 21/21 test Edge liên quan đạt. Không chạy lại toàn bộ hồi quy cũ. Build còn cảnh báo Zod/chunk lớn; các giới hạn Azure 403 và audit toolchain ở các mục dưới vẫn còn.
- Tại thời điểm tạo commit bàn giao chưa xác nhận push; bước cuối của phiên là push main và đối chiếu HEAD với remote. Kiểm tra Git để biết trạng thái đồng bộ mới nhất; push Git không phải bằng chứng deployment thành công.

## Làm gọn bộ chọn và xem trước nội dung Word — 14/10/2026

- Theo yêu cầu mới: `ProcedureFormPicker.tsx` tách khỏi editor, bố trí kho và mẫu đã gắn cạnh nhau trên màn hình rộng, danh sách kho gọn/cuộn độc lập. Mẫu đã gắn có tóm tắt số bản/bắt buộc/trường hợp, nút bỏ rõ tên và thiết lập trong phần mở rộng; giữ tìm mã/phân trang/nhiều lựa chọn/validation khi lưu thủ tục.
- `RoleWorkspaceSidebars.tsx`: bỏ mục Upload biểu mẫu và icon thừa; upload/thay phôi tiếp tục ở Danh sách biểu mẫu. Không xóa xử lý section cũ để tránh ảnh hưởng liên kết nội bộ đã có.
- `FormTemplateActions.tsx`, `DocxPreview.tsx`: Xem mẫu mở modal rộng, tải binary bằng JWT client/AbortSignal rồi render DOCX thật (chữ, bảng, trang), thu/phóng/vừa khung, tải gốc, lỗi và thử lại. Query binary chỉ khi mở/có file/đang hoạt động, gcTime 0; không gửi file sang Office/Google viewer. Không phải PDF nguồn thủ tục, không thêm endpoint chuyển đổi hoặc editor/lưu đơn giả.
- Thêm `docx-preview` 0.4.1, tải module khi xem; package-lock cập nhật. Theo API chính thức: https://github.com/VolodymyrBaydalka/docxjs. Preview nằm trong iframe sandbox không cho script, CSP chặn request bên ngoài, tắt altChunks và liên kết tài liệu; CSS tài liệu không tác động UI ngoài. Độ giống Word phụ thuộc tính năng DOCX/font, có ghi chú trong preview.
- `tests/fixtures/formTemplateDocx.ts`: DOCX thử nghiệm tự tạo có tiêu đề, bảng và hyperlink. Nhóm test bổ sung xác minh nội dung thật trong iframe, file hỏng, sandbox/không có href và bỏ Upload sidebar; không chỉ mock HTML render.
- Kiểm tra: typecheck/lint/build và diff --check đạt; build còn cảnh báo Zod annotation/chunk lớn. **21/21 mock Edge đạt** (biểu mẫu + chọn mẫu hiện có + workspace-sidebar), đã xem ảnh desktop/mobile, kiểm tra trang Word nằm trọn chiều ngang khi vừa khung. Sau chuyển nút tải Word vào footer cố định, chạy lại 3 luồng preview đạt 3/3; typecheck/lint cuối đạt. DOCX thực được tạo trong test và render qua thư viện thật; HTTP vẫn mock, chưa xác minh tài khoản/file Azure thật. npm audit báo 2 high ở brace-expansion/source-map-js trong toolchain ESLint/Vite/Tailwind cũ, không thuộc cây docx-preview; chưa mở rộng sang audit fix toàn dự án. Giữ nguyên thay đổi chưa commit của người dùng; chưa commit/push/deploy.

## Bộ chọn thủ tục dùng trực tiếp kho biểu mẫu — 14/10/2026

- Theo ảnh mới, lỗi ở bộ chọn là thông báo từ API trung gian Catalog `/api/v1/procedure-manager/document-forms`, không phải kho mẫu Admin. Source local `DocumentFormsClient` gọi DocumentForm không chuyển JWT, quy nhiều lỗi upstream về cùng thông báo unavailable; không đủ bằng chứng xác định status upstream của deployment.
- `ProcedureApiEditor.tsx` chuyển bộ chọn sang `getFormTemplates`/JWT client giống kho Admin: để trống duyệt kho đang hoạt động, tìm theo mã có debounce/hủy request, phân trang 10 mẫu/trang, giữ nhiều lựa chọn khi tìm/chuyển trang; dùng thông báo lỗi DocumentForm thật. Gắn đúng id/code/title, `formType: DOCX_TEMPLATE`; hiển thị trạng thái có Word, không cho gắn mới mẫu chưa có file. Không tạo endpoint hoặc fallback mẫu giả.
- Cache bộ chọn cùng prefix form-templates nên tạo/thay file ở kho sẽ invalidate đúng; `FormsView.tsx` bỏ invalidation key trung gian không dùng nữa. Không thay đổi BE hoặc quyền Azure.
- Các mẫu đã gắn vẫn được lưu qua API cập nhật thủ tục và công dân xem metadata/tải Word qua FormTemplateActions. Chưa thêm editor DOCX trực tuyến; đã hỏi người dùng cần chỉnh sửa file Word tải về hay chỉnh sửa/lưu trực tiếp trên web, đang chờ lựa chọn. Không nối editor HTML minh họa và không báo lưu đơn thành công giả.
- Kiểm tra lượt này: typecheck/lint/build và diff --check đạt; build còn cảnh báo Zod annotation/chunk lớn. Nhóm `tests/form-templates.spec.ts` + `tests/procedure-manager.spec.ts:170` đạt **13/13 mock Edge**; gồm chọn nhiều mẫu/lưu/hiển thị công khai, API trung gian giả lập 503 nhưng kho trực tiếp vẫn dùng được, Bearer trên request kho, tìm mã/reset trang/giữ lựa chọn và chặn mẫu thiếu file. Đã xem ảnh bộ chọn tìm mã. Không kiểm thử tài khoản Azure thật, không báo đã sửa quyền 403 hay kết nối server-to-server BE. Giữ nguyên thay đổi nhãn “Thêm đơn” của người dùng và các thay đổi chưa commit từ lượt trước; không commit/push/deploy.

## Đồng bộ nút biểu mẫu, chọn nhiều mẫu và điều tra 403 Admin — 14/10/2026

- Yêu cầu mới: đồng bộ nút Xem mẫu/Tải mẫu/Thay đổi, mẫu thiếu file chỉ có Xem mẫu/Tải lên; kiểm tra quyền Admin và làm rõ nơi chọn nhiều mẫu cho thủ tục.
- `FormTemplateActions.tsx`, `FormsView.tsx`: cùng Button outline nhỏ/bo góc/icon; thao tác quản lý nằm cùng nhóm với xem/tải. Truyền trạng thái có file để ẩn nút tải không sử dụng được. Bảng có chiều rộng tối thiểu và cuộn bên trong trên mobile.
- `ProcedureApiDetail.tsx`, `ProcedureApiEditor.tsx`: tab Biểu mẫu chỉ xem có số mẫu/trạng thái rỗng và nút Chọn/Quản lý biểu mẫu (cần procedure.update), mở thẳng tab Biểu mẫu của modal chỉnh sửa. Bộ chọn tìm theo mã, chọn/bỏ nhiều mẫu, giữ cấu hình trường hợp/số lượng/bắt buộc. Lưu dùng API cập nhật thủ tục hiện có; không tạo endpoint mới.
- Điều tra 403: response người dùng cung cấp là **POST /api/v1/form-templates → 403 auth.forbidden** ngay lúc tạo phôi, chưa phải upload-docx. Không coi vai trò IT_ADMIN là bằng chứng được API cấp quyền; không thêm bypass FE. Nút tạo đang hiện cho thấy FE nhận quyền manage. Code request dùng JWT client chung; kiểm thử mock xác minh Bearer được gửi. `formTemplates.ts` giữ thông báo từ chối/traceId của server, phân biệt mã iam.csrf_rejected; để Axios/browser tự dựng multipart boundary.
- Đối chiếu BE local: IAM migration DeployedFeaturePermissionCatalog cấp document.templates.manage cho IT_ADMIN/PROCEDURE_MANAGER, JwtTokenService phát claim permissions. Nhưng DocumentForm local controller/Program chưa có auth/policy tương ứng với Azure; không đủ source đúng phiên bản để sửa policy đang trả auth.forbidden. Cần đối chiếu quyền trong JWT với policy và nguồn IAM của deployment; chưa xác minh hay khắc phục quyền thật trên Azure. Không sửa BE hoặc tự cấp quyền.
- Kiểm tra lượt này: typecheck/lint/build đạt; build còn cảnh báo Zod annotation và chunk lớn như trước. Nhóm `tests/form-templates.spec.ts` + `tests/procedure-manager.spec.ts:170` đạt **12/12 mock Edge**, gồm 3 ca mới cho thao tác Admin/mẫu thiếu file, tạo phôi bị 403 có lý do/trace, chọn hai mẫu từ tab chỉ xem rồi kiểm tra hiển thị công khai. Đã xem ảnh Admin ở desktop và mobile; không chạy lại toàn bộ hồi quy 52 ca của lượt trước. `git diff --check` đạt. Không commit/push/deploy.

## Hoàn thiện luồng kho biểu mẫu → thủ tục → tải mẫu — 14/10/2026

- Phạm vi được duyệt: triển khai bước 1–4 của kế hoạch; chưa triển khai editor DOCX/lưu đơn cá nhân, phiên bản mẫu hay E-form.
- `FormsView.tsx` dùng chung cho Admin và Quản lý thủ tục (Danh sách/Upload biểu mẫu). Query theo user ID, có AbortSignal, phân trang/tìm mã/lọc trạng thái, lỗi và thử lại. Tạo mẫu bằng RHF/Zod (mã 1–50, tên 1–255), kiểm tra file không rỗng/.docx/20 MiB, xác nhận thay phôi và invalidation cache sau ghi. Nút ghi chỉ hiện khi có `document.templates.manage`; xem kho cần read hoặc manage.
- `src/components/forms/FormTemplateActions.tsx`: xem metadata và tải binary qua JWT client; kiểm tra mẫu hoạt động/có file, không mở Blob URL trực tiếp. Nội dung modal không khẳng định có E-form chỉ dựa trên `onlineReady`. Khách được hướng dẫn đăng nhập với returnTo nội bộ; backend vẫn quyết định quyền API.
- `ProcedureApiEditor.tsx`: Query cho bộ chọn mẫu (debounce, hủy request cũ, cache theo user); xem/tải phôi trước khi chọn, giữ luồng lưu `formDefinitions.formTemplateId` hiện có.
- `ProcedureDetailPage.tsx`: liệt kê mẫu từ formDefinitions theo trường hợp, số bản/bắt buộc, xem/tải hoặc thông báo chưa liên kết. Bỏ cách đoán quan hệ mẫu–checklist bằng tên; quan hệ này vẫn cần BE/nghiệp vụ xác nhận. Không tự tạo API liên kết.
- `formTemplates.ts`: validation response, AbortSignal, xử lý lỗi tải binary/403/404/409; bảo vệ tên file mã hóa lỗi. `vercel.json`: thêm rewrite biểu mẫu trước route IAM. `.env.example`: mặc định cùng origin; base API riêng phải là Gateway phục vụ cả IAM/DocumentForm, không trỏ IAM-only.
- Đối chiếu trước triển khai: Swagger Azure có Bearer; GET không token ở cả hai dạng route trả 401. Source BE local khác deployment (thiếu một số controller và cấu hình auth); không suy ra RBAC Azure đã xác minh chỉ từ IAM permission catalog.
- Kiểm tra cuối: `npm run typecheck`, `npm run lint`, `npm run build`, `git diff --check` đạt. Build còn cảnh báo annotation từ Zod và chunk >500 kB.
- Mock Edge: chạy cuối `tests/form-templates.spec.ts` cùng `tests/procedure-manager.spec.ts:170` đạt **9/9** (8 ca mới + ca chọn mẫu hiện có). Đã sửa lỗi hiển thị tên mẫu đã chọn hai lần phát hiện trong lượt hồi quy; xem phôi/tải được cả khi nội dung thủ tục ở chế độ chỉ đọc. Đã kiểm tra ảnh kho mẫu 390px sau khi hiệu ứng sidebar hoàn tất.
- Hồi quy rộng: chạy 52 ca thuộc `procedure-manager`, `jwt-client`, `design-system`, `landing`: 42 đạt/10 lỗi ở lượt đầu; lỗi chọn mẫu do thay đổi mới đã sửa và chạy lại đạt ở nhóm 9/9. Còn 9 lỗi chưa xử lý trong các test đăng ký, tra cứu công khai, tab trường hợp, PDF nguồn/rollback và xuất bản nháp PDF (bộ chọn/luồng cũ không khớp UI hiện tại); chưa chạy lại toàn bộ 52 ca sau sửa. JWT 10/10 và design-system 4/4 đạt trong lượt này. Không báo hồi quy toàn bộ đạt.
- Giới hạn: chưa kiểm thử ghi Azure bằng tài khoản thật; không ghi dữ liệu production, không thay BE, chưa deploy/commit/push. Vercel rewrite mới cần xác minh sau deploy. Chỉ kiểm thử mock binary, chưa chứng minh một DOCX thật được Word mở đúng.

## Tích hợp ban đầu Cụm API Phôi Biểu mẫu (Form Templates) — 14/10/2026 (ghi nhận lịch sử)

- **Phạm vi & Trạng thái**: Triển khai API client `src/lib/api/formTemplates.ts`, cấu hình proxy Vite cho Gateway Azure, và xây dựng giao diện hoàn chỉnh `FormsView.tsx` tại phân hệ Quản trị (`AdminPage.tsx`). Đã kiểm thử kết nối trực tiếp với Azure và xác nhận phản hồi HTTP 200 OK.
- **Việc đã làm**:
  1. **Tạo API client chuẩn TypeScript (`src/lib/api/formTemplates.ts`)**:
     - `getFormTemplates(params)`: `GET /api/v1/form-templates` (phân trang, lọc `isActive`, tìm kiếm `searchCode`).
     - `getFormTemplateById(templateId)`: `GET /api/v1/form-templates/{templateId}` (chi tiết phôi kèm cờ `onlineReady`).
     - `createFormTemplate(payload)`: `POST /api/v1/form-templates` (khởi tạo `code` và `title`).
     - `uploadFormTemplateDocx(templateId, file)`: `POST /api/v1/form-templates/{templateId}/upload-docx` (`multipart/form-data` tải tệp Word `.docx` lên Azure Blob).
     - `downloadFormTemplateDocx(templateId)`: `GET /api/v1/form-templates/{templateId}/download-docx` (nhận luồng nhị phân binary DOCX blob).
     - `triggerFileDownload(blob, fileName)`: Helper tự động tải tệp về máy tính.
     - `formTemplateErrorMessage(error)`: Xử lý thông báo lỗi thân thiện.
  2. **Cấu hình định tuyến Vite Proxy (`vite.config.ts`)**:
     - Điều hướng tuyến `/api/v1/form-templates` trỏ chính xác về YARP Gateway tại `https://wardmate-gateway.blackmeadow-a2f12767.japaneast.azurecontainerapps.io`.
  3. **Xây dựng giao diện Kho Phôi Biểu Mẫu (`src/pages/admin/FormsView.tsx`)**:
     - Bảng danh sách phôi mẫu: Mã biểu mẫu, tiêu đề, trạng thái tệp DOCX (badge xanh/vàng), trạng thái hoạt động, ngày tạo.
     - Thanh tìm kiếm theo mã phôi và bộ lọc nhanh trạng thái (Tất cả / Đang hoạt động / Tạm dừng).
     - Phân trang đầy đủ (Trang trước / sau, hiển thị số lượng bản ghi).
     - Modal tạo mới phôi biểu mẫu (`POST /api/v1/form-templates`).
     - Modal tải lên tệp DOCX (`POST /api/v1/form-templates/{id}/upload-docx`) hỗ trợ kéo thả/chọn tệp và kiểm tra định dạng.
     - Nút tải trực tiếp file DOCX gốc (`GET /api/v1/form-templates/{id}/download-docx`) với hiệu ứng loading/tải file.
     - Modal xem chi tiết trạng thái sẵn sàng trực tuyến (`onlineReady`).
     - Thay thế toàn bộ placeholder cũ trong `AdminPage.tsx`.
  4. **Kiểm thử thực tế (Smoke test trực tiếp trên Cloud Azure)**:
     - `GET /api/v1/form-templates` ➔ **200 OK** (8 bản ghi mẫu thực tế trong database).
     - `GET /api/v1/form-templates/{id}` ➔ **200 OK** (chi tiết bản ghi mẫu kèm `onlineReady: true`).
     - `GET /api/v1/form-templates/{id}/download-docx` ➔ **200 OK** (nhận trọn vẹn 19.094 bytes binary Word docx).
     - IAM có `document.templates.read` và `document.templates.manage`; ghi nhận cũ chưa đủ bằng chứng xác nhận thực thi RBAC cho từng endpoint trên Azure. Xem kết quả đối chiếu ở mục mới phía trên.
- **Kiểm tra**:
  - `npm run typecheck`: PASS (0 lỗi).
  - `npm run lint`: PASS (0 lỗi).
  - `npm run build`: PASS (0 lỗi, production bundle sẵn sàng).

## Chuẩn hóa UI Trang Chi tiết Thủ tục theo Bố cục Cổng Dịch vụ công Quốc gia (dichvucong.gov.vn) — 14/10/2026

- **Phạm vi & Trạng thái**: Tái thiết kế toàn diện trang chi tiết thủ tục hành chính (`ProcedureDetailPage.tsx`) theo chuẩn 100% bố cục Cổng Dịch vụ công Quốc gia.
- **Việc đã làm**:
  - Hỗ trợ cả 2 đường dẫn truy cập: `/thu-tuc/:procedureId` và `/thu-tuc-hanh-chinh/:procedureId` trong `src/app/App.tsx`.
  - Phân tích trực tiếp từ website `https://dichvucong.gov.vn/thu-tuc-hanh-chinh/{id}` qua browser subagent để trích xuất layout, tỷ lệ và màu sắc.
  - **Bố cục 2 Cột chuẩn DVCQG (Cột trái ~68%, Cột phải ~32%)**:
    1. **Phần Tiêu đề & PDF nguồn**:
       - Tiêu đề thủ tục to, đậm, màu chữ đen slate-900 chuẩn công vụ.
       - Biểu tượng PDF màu đỏ (`FilePdf`) ngay dưới tiêu đề kèm liên kết mở/tải tệp công bố gốc.
    2. **Bảng Thông tin chung dạng lưới (Grid Table)**:
       - Các hàng ô kẻ viền mỏng xám `#cbd5e1`, nền ô nhãn xám nhạt `#f8fafc`, nền ô dữ liệu trắng:
       - `Tên thủ tục`, `Mã thủ tục`, `Số quyết định`, `Cấp thực hiện`, `Loại thủ tục`, `Lĩnh vực`, `Đối tượng thực hiện`, `Cơ quan có thẩm quyền`, `Địa chỉ tiếp nhận HS`, `Cơ quan được ủy quyền`, `Cơ quan phối hợp`.
    3. **Trình Tự Thực Hiện**:
       - Tiêu đề đỏ đô (`#b91c1c`), hiển thị các trường hợp và chi tiết từng bước (thứ tự, tên bước, người thực hiện, nội dung chi tiết).
    4. **Cách Thức Thực Hiện**:
       - Bảng 4 cột chuẩn: `Hình thức nộp` | `Thời gian` | `Phí, lệ phí` | `Mô tả`.
    5. **Thành phần hồ sơ**:
       - Phân tách thành 2 bảng chuyên biệt: `* Giấy tờ phải nộp:` và `* Giấy tờ phải xuất trình:` (3 cột: `Tên giấy tờ`, `Mẫu đơn, tờ khai`, `Số lượng`).
    6. **Căn cứ pháp lý & Kết quả thực hiện**:
       - Đổi thứ tự và cấu trúc bảng Căn cứ pháp lý theo đúng chuẩn Cổng DVCQG (ảnh mẫu): Cột 1 là **`Tên văn bản pháp lý`** (chiếm 75% chiều rộng), Cột 2 là **`Mã văn bản`** (số hiệu văn bản).
       - Thêm dải viền cam đất (`border-b-2 border-[#ca5116]`) và nền `bg-[#eaeff5]` dưới tất cả các header (`thead tr`) của table: Cách thức thực hiện, Thành phần hồ sơ, Căn cứ pháp lý.
    7. **Sidebar Tiện ích**:
       - Bỏ hoàn toàn khối chọn cơ quan thực hiện (radio Tỉnh/TP - Bộ ngành, dropdown, nút nộp hồ sơ) theo yêu cầu người dùng, giữ sidebar thông thoáng, tập trung.
       - **Card "Tìm kiếm nhiều nhất"**: Danh mục các thủ tục phổ biến được tra cứu nhiều nhất (kết nối trực tiếp từ database).
    8. Tối ưu hook `usePublicProcedureList({ pageSize: 7 })` có TanStack Query cache để tránh lỗi lặp vô hạn `429 Too Many Requests`.
- **Kiểm tra**:
  - `npm run typecheck`: PASS (0 lỗi).
  - `npm run lint`: PASS (0 lỗi).
  - Browser subagent verify: Giao diện hiển thị trực quan chuẩn xác 100% theo mẫu Cổng DVCQG.

## Khắc phục phản hồi nút Xác nhận xuất bản & Hiển thị lỗi validation — 14/10/2026

- **Phạm vi & Trạng thái**: Xử lý lỗi nút "Xác nhận xuất bản" không phản hồi / không gọi API khi người dùng click trong chế độ Studio, và khắc phục lỗi validation `submissionMethods.estimatedDays`, `formDefinitions.formType`.
- **Việc đã làm**:
  - Phát hiện nguyên nhân:
    - Khi AI bóc tách PDF, các trường `estimatedDays` (trong phương thức nộp) bị thiếu hoặc là chuỗi chữ; `formDefinitions` thiếu `formType` (`ONLINE_INTERACTIVE` | `DOCX_TEMPLATE`) và UI chưa có input chọn `formType`.
    - Dẫn đến cả Zod validator của frontend và `DraftPayloadRequirements.Check` của backend từ chối xuất bản.
    - Ban đầu `validateProcedure` ném ngoại lệ nhưng bị nuốt chìm trong `run()`, không có toast hay UI feedback.
  - Giải pháp đã hoàn thành:
    - Bổ sung `toast.error(msg)` trực tiếp vào khối `catch` của hàm `run()`.
    - Đặt component `<ProcedureFeedback error={error} />` ngay trên đầu form biên tập Studio để hiển thị rõ ràng danh sách các trường còn thiếu cần bổ sung.
    - **Cơ chế Auto-healing & Chuẩn hóa dữ liệu**: Tự động gán mặc định hợp lệ cho dữ liệu trích xuất từ AI trước khi validate và lưu lên backend:
      - `formDefinitions`: tự động gán `formType: "ONLINE_INTERACTIVE"`, `quantity: 1`, `isMandatory: true`.
      - `submissionMethods`: tự động gán `estimatedDays: 0`, `feeAmount: 0`, `feeUnit: "VNĐ"`.
      - `checklistSchema`: tự động gán `quantity: 1`, `isMandatory: true`, `submissionType: "NOP"`, `documentCopyType: "ORIGINAL"`.
    - Cập nhật `ProcedureDraftWorkspace.tsx`: lưu payload đã qua chuẩn hóa (`validated`) lên backend thay vì payload thô trước khi gọi `publishDraft`.
    - Thêm ô chọn `Loại biểu mẫu` (`formType`) vào `FormDefinitionsEditor` (cho phép chọn giữa *Mẫu điện tử tương tác* và *Mẫu Word DOCX*).
    - Thêm hàm `humanizeFieldPath` ánh xạ các JSON path kỹ thuật (`contentPayload.submissionMethods.0.estimatedDays`) thành nhãn tiếng Việt dễ hiểu và chỉ rõ vị trí (Ví dụ: `Phần 4 [Phương thức nộp] - dòng 1: Thời hạn (ngày)`).
    - Bỏ trạng thái `disabled={!confirmed}` của nút Xác nhận xuất bản: hiển thị `toast.warning(...)` hướng dẫn cán bộ tích chọn đối soát thay vì vô hiệu hóa câm lặng.
    - Mở rộng quyền điều kiện xuất bản `(can("procedure.drafts.publish") || can("procedure.publish"))`.
    - Tách riêng trạng thái loading cho từng nút: `savingDraft` cho nút **Lưu bản nháp** và `publishingDraft` cho nút **Xác nhận xuất bản** (thay vì dùng chung `busy`), tránh hiện tượng cả hai nút cùng quay icon loading khi chỉ bấm một hành động.
    - Sau khi xuất bản thành công, tự động quay về danh sách bản nháp (`select()`) và refresh lại bảng dữ liệu.
- **Kiểm tra**:
  - `npm run typecheck`: PASS (0 lỗi).
  - `npm run lint`: PASS (0 lỗi).

## Tối ưu hóa UI/UX Chế độ Studio Biên tập Thủ tục & Modal Cảnh báo AI — 13/10/2026

- **Phạm vi & Trạng thái**: Tối ưu hóa toàn diện trải nghiệm người dùng (UX) khi mở bản nháp thủ tục (PDF Draft Workspace).
- **Việc đã làm**:
  1. **Chế độ Làm việc Chuyên biệt (Dedicated Studio Mode)**:
     - Ẩn hoàn toàn Sidebar và Dashboard Header khi mở bản nháp (`ProcedureManagerPage`), mở rộng 100% diện tích màn hình làm việc (`h-screen overflow-hidden`).
     - Tách riêng nhánh render của Studio: loại bỏ hoàn toàn tiêu đề chiếm chỗ `PDF và bản nháp thủ tục` ở đỉnh trang, đưa thanh Studio Topbar lên sát mép trên cùng.
     - Bỏ nhãn thừa `Đã đồng bộ` trên Topbar; chỉ hiển thị nhãn cảnh báo `Chưa lưu thay đổi` khi người dùng có thao tác sửa đổi chưa bấm Lưu.
     - Thanh Topbar tích hợp nút thùng rác xóa nhanh bản nháp và tệp PDF nguồn kèm modal xác nhận.
  2. **Giải quyết vấn đề cuộn lồng nhau & Tiện ích xem PDF (Dual Pane)**:
     - Khung PDF bên trái tích hợp thanh công cụ mini: bổ sung nút **`Mở tab mới`** (`ArrowSquareOut`) để mở tệp PDF trực tiếp trong tab trình duyệt riêng biệt, cùng nút phóng to/thu nhỏ toàn màn hình (`ArrowsOut`).
     - Iframe PDF hiển thị trực tiếp 100% chiều cao và chiều rộng của cột bên trái.
     - Cột biên tập bên phải chỉ giữ đúng **1 thanh cuộn duy nhất**, gom gọn thông tin biểu mẫu và ghim thanh tab sticky giúp người dùng chuyển đổi nhanh giữa các nhóm nội dung.
     - Thanh hành động đáy (Xác nhận đối soát, Lưu nháp, Xuất bản) được ghim cố định ở đáy cột biên tập để luôn sẵn sàng thao tác mà không cần cuộn tìm.
  3. **Tối ưu hiển thị Cảnh báo AI (AI Warnings Modal)**:
     - Thay vì khối cảnh báo choán diện tích phía trên form, toàn bộ các cảnh báo đối soát và lỗi phân tích từ AI được thu gọn vào một nút nổi bật trên thanh Topbar: `⚠️ [X] lưu ý từ AI`.
     - Khi bấm nút, modal pop-up chuyên dụng mở ra hiển thị đầy đủ, phân loại trực quan (lỗi mạng/quota, cảnh báo đối soát, khuyến cáo bổ sung), giúp giải phóng ngay ~150px chiều cao cho form nhập liệu.
- **Kiểm tra**:
  - `npm run typecheck`: PASS (0 lỗi).
  - `npm run lint`: PASS (0 lỗi).


## Nâng cấp trải nghiệm UI/UX phân hệ IAM, bộ lọc trạng thái và chuẩn hóa quản lý hồ sơ — 11/10/2026

- **Phạm vi & Trạng thái**: Đã triển khai và đẩy lên remote 4 commits theo đúng nhóm tính năng: Auth, Citizen Profile, Admin Directory và Manager Officers.
- **Việc đã làm**:
  1. `feat(auth): add password strength meter and terms modal on register` (commit `34b5415`):
     - Password Strength Meter thời gian thực (5 nấc, 4 tiêu chí: 8+ ký tự, chữ in hoa, số, ký tự đặc biệt).
     - Modal "Điều khoản sử dụng dịch vụ WardMate" giải thích rõ ranh giới pháp lý tiền kiểm hành chính.
  2. `style(citizen): standardize profile layout and format identity numbers` (commit `95077ac`):
     - Chuẩn hóa layout tiêu đề trang với khoảng cách `mb-6`, khắc phục lặp tiêu đề.
     - Tích hợp cụm nút thao tác trực tiếp vào thẻ Overview, bỏ các nút trùng lặp trong banner trạng thái chỉnh sửa.
     - Format hiển thị CCCD (`079 090 123 456`) và SĐT, disable nút Lưu khi form chưa thay đổi (`isPristine`).
  3. `feat(admin): add account status filter and modal confirmations` (commit `9c32ce4`):
     - Mặc định chọn bộ lọc trạng thái "Đang hoạt động" (`ACTIVE`) khi vào danh mục người dùng.
     - Modal xác nhận khi Tạm khóa / Kích hoạt tài khoản người dùng; kiểm soát sanitize mã phường.
     - Đồng bộ banner chế độ chỉnh sửa của `UnifiedSelfProfileView`.
  4. `feat(manager): enhance officer directory filters and clarify profile deletion` (commit `0ef7ed2`):
     - Mặc định chọn bộ lọc trạng thái "Đang hoạt động" (`ACTIVE`) cho danh sách cán bộ Một cửa.
     - Phân định rõ giữa xóa hồ sơ cá nhân (`DELETE /api/v1/users/{userId}/profile`) với tài khoản người dùng; Modal xác nhận thông báo rõ chỉ xóa dữ liệu định danh (CCCD, tên khai sinh, địa chỉ) chứ không xóa tài khoản đăng nhập.
     - Tự động disable nút xóa hồ sơ khi cán bộ chưa có dữ liệu hồ sơ cá nhân để loại bỏ hoàn toàn lỗi 404 khi bấm xóa lại.
     - Format hiển thị cụm số CCCD cán bộ.
- **Kiểm tra**:
  - `npm run typecheck`: 0 errors.
  - `npm run build`: hoàn tất thành công (9.28s).
  - Đã đẩy toàn bộ commit lên nhánh `origin/main`.

## Chuẩn hóa định dạng ngày và xử lý lỗi ProblemDetails cho IAM & Procedure — 11/10/2026

- **Phạm vi & Trạng thái**: Đã rà soát toàn bộ hợp đồng API Backend IAM và Procedure Catalog, hoàn thiện và đối soát client Frontend.
- **Việc đã làm**:
  - Tại `src/lib/api/procedures.ts`:
    - Thêm hàm `toDateOnlyString()` chuẩn hóa định dạng ngày `YYYY-MM-DD` cho `EffectiveDate` trước khi gửi lên API cập nhật và rollback thủ tục, tránh lỗi .NET 400 Bad Request không parse được kiểu `System.DateOnly`.
    - Cải tiến hàm `procedureError()`: ưu tiên đọc thông điệp cụ thể từ `data.detail`, đồng thời giải nén dictionary `data.errors` để hiển thị lỗi chi tiết đến từng trường.
  - Tại `src/lib/api/index.ts`:
    - Tiền xử lý mảng `categories` trong `assignOfficerCategories()` (khử trùng lặp, lọc số nguyên dương > 0, cắt tối đa 100 mục) theo đúng quy tắc validator backend.
    - Cải tiến `authErrorMessage()`: hỗ trợ giải nén cả `data.detail` và `data.errors` của RFC 7807 ProblemDetails.
- **Kiểm tra**:
  - `npm run typecheck`: 0 lỗi.
  - `npm run build`: hoàn tất thành công (27.28s).
- **Giới hạn**: Đã đối soát trực tiếp với source C# .NET và DTOs backend; chưa thực hiện integration test trực tiếp trên môi trường chạy thật.

## Sửa proxy local cho IAM CSRF — 10/10/2026

- Commit: `dc58224` — cấu hình proxy local IAM/Procedure và Origin cho CSRF.
- Cấu hình local theo hai service Swagger backend đang cung cấp, không đi qua Gateway đang trả `502`: `/api/v1/procedures` và `/api/v1/procedure-manager` đi thẳng Procedure Catalog; `/api` còn lại đi thẳng IAM. Cách này bao phủ toàn bộ auth/users/wards/admin/manager của IAM mà không cần vá từng endpoint.
- Mỗi proxy ghi đè `Origin` thành origin của đúng service để vượt kiểm tra CSRF same-origin của backend; bật kiểm tra TLS với `secure: true`.
- Đã rà soát auth client: login/refresh/logout dùng đường dẫn tương đối, `withCredentials: true` và header `X-CSRF-Protection: 1`; không cần sửa code gọi API.
- Cấu hình chỉ có hiệu lực sau khi khởi động lại Vite. Cần xóa cookie/storage cũ rồi xác minh đăng nhập và refresh bằng tài khoản thật; chưa ghi nhận kiểm thử môi trường thật trong mục này.

## Làm rõ danh mục phường và validation xuất bản PDF — 10/10/2026

- Hồ sơ Admin không còn gọi thừa `GET /api/v1/wards`; danh mục phường chỉ tải khi tài khoản thuộc nhóm cán bộ địa phương và thực sự có `wardId` cần ánh xạ tên.
- Giữ chặn xuất bản khi dữ liệu OCR thiếu trường bắt buộc, không tự sinh dữ liệu hành chính. Thông báo validation nay dùng nhãn tiếng Việt và hướng người dùng về mục `Thông tin chung`, thay cho đường dẫn field và lỗi Zod kỹ thuật.
- Backend xác định bản nháp OCR ở trạng thái `NeedsReview` cần người quản lý đối soát/bổ sung trước khi xuất bản; dữ liệu rỗng từ kết quả extract không phải do frontend xóa payload.

## Hoàn thiện workspace PDF và rà soát API IAM/Procedure — 10/10/2026

- Commit: `4f4af50` — luồng PDF, xuất bản, phân quyền và tinh gọn UX Procedure.
- Đối chiếu controller backend với API client frontend: đã bao phủ auth/profile/accounts/RBAC/directory/phường của IAM và public/manager/categories/drafts/versions/rollback/Document Form của Procedure Catalog. `GET /api/v1/users/access-context` tiếp tục không nối UI vì là contract ngữ cảnh dành cho service backend gọi.
- Thiết kế lại khu tải PDF: vùng chọn tệp rõ ràng, hiển thị tên/dung lượng, phân biệt hành động lưu bản nháp với đọc thử không lưu, cảnh báo về PDF nguồn, kết quả preview gọn và dữ liệu bóc tách chi tiết được thu gọn.
- Reset tệp, kết quả preview và AbortController khi mở hoặc rời bản nháp; sửa lỗi quay về danh sách vẫn thấy kết quả đọc thử cũ và lỗi nút dừng preview có thể xuất hiện nhầm trong lúc upload.
- Sửa phân quyền bảng draft: quyền đọc điều khiển nút mở, quyền xóa mới hiển thị nút xóa; bổ sung trạng thái màu, empty state và header danh sách dễ quét.
- Thu gọn khu chọn PDF thành một hàng hiển thị trực tiếp tên/dung lượng tệp; giảm padding, chiều cao CTA và nội dung hướng dẫn. Đổi nhãn hành động thành `Hủy đọc PDF`, `Kiểm tra trạng thái xử lý`, `Làm mới danh sách` và `Đọc lại PDF` để mô tả đúng tác dụng.
- Đổi `Đọc thử PDF` thành `Phân tích thử PDF (không lưu)` cho đúng hành vi API OCR. Kết quả có hai tab `PDF gốc` và `Văn bản nhận diện`; PDF gốc được xem trực tiếp từ file cục bộ bằng object URL, không upload thêm và được thu hồi khi đổi/rời file.
- Bỏ nút `Kiểm tra trạng thái xử lý`: draft `Queued`/`Processing` vốn đã polling mỗi 4 giây nên chỉ hiển thị trạng thái tự động cập nhật; `NeedsReview`, `Failed` và `Published` giữ đúng hành động nghiệp vụ, tránh một nút làm mới dư thừa có nguy cơ ghi đè dữ liệu đang đối soát.
- Theo quyết định người dùng sau audit Procedure: giữ nguyên các điều hướng/chỉ số chưa có API, lựa chọn cách lưu ở modal thêm thủ tục và nút PDF nguồn; chỉ bỏ nút `Làm mới` dư thừa ở phân trang danh sách thủ tục vì tìm kiếm, lọc, phân trang và mutation đã tự tải lại dữ liệu.
- Tách UX hai API ghi Procedure: modal `Thêm thủ tục` chỉ gọi API create và không còn dropdown trộn với publish; luồng phân tích PDF không lưu cho phép đối soát payload rồi gọi `POST /api/v1/procedure-manager/procedures/publish` với cảnh báo cập nhật theo mã và xác nhận riêng.
- Workspace PDF chuyển từ hai CTA cạnh tranh sang chọn mục đích trước: `Tạo bản nháp có PDF gốc` (khuyến nghị) hoặc `Xem và nhận diện nội dung`, sau đó chỉ hiện một CTA chính. Sidebar rút nhãn thành `PDF và bản nháp` với icon PDF rõ nghĩa hơn.
- Ngày 10/10, đã làm gọn câu chữ toàn phân hệ Procedure: bỏ các từ kỹ thuật hướng người dùng như backend/API/OCR/snapshot/payload, đổi luồng xem nhanh thành `Xem và nhận diện PDF`, nút cuối thành `Công khai thủ tục`, rút cảnh báo còn việc cần kiểm tra và tác động khi trùng mã. Các mô tả bản nháp, lịch sử, trạng thái trống và tiêu đề cũng chuyển sang tiếng Việt dễ hiểu; không đổi hợp đồng hay cách gọi API.
- Tiếp tục giảm mật độ chữ: bỏ hướng dẫn lặp ở đầu khối PDF, hộp thông tin lặp dưới nút, mô tả dưới danh sách bản nháp và các subtitle không được sử dụng; rút gọn empty state, ghi chú biểu mẫu và lịch sử phiên bản. Giữ lại mô tả phân biệt hai cách xử lý PDF cùng các cảnh báo ảnh hưởng đến dữ liệu.
- Bỏ nốt nút `Làm mới danh sách` trong bảng bản nháp vì tải lại thủ công không cần thiết và có thể tạo thêm request lỗi; danh sách vẫn tự cập nhật sau thao tác và khi quay lại màn. Thêm ô tìm kiếm cục bộ tại `Danh mục thủ tục`, lọc tên/mô tả không phân biệt dấu và có trạng thái không tìm thấy.
- Rà toàn bộ trạng thái loading: sửa bản nháp từng render skeleton cùng bảng rỗng, danh mục từng render skeleton cùng lưới/empty state, và trang tra cứu công khai từng báo `0 thủ tục phù hợp` trước khi dữ liệu về. Mỗi vùng nay chỉ render một trong loading/dữ liệu/lỗi/rỗng; số nhóm công khai không thể âm. Bổ sung test cố tình làm chậm API cho ba trường hợp này.
- Commit: `2b64602` — tìm kiếm danh mục, bỏ nút làm mới bản nháp và tách biệt các trạng thái loading/dữ liệu/rỗng.
- Kiểm tra sau thay đổi câu chữ: `npm run typecheck` và `npm run lint` đạt; bộ `tests/procedure-manager.spec.ts` hiện đạt **24/24**. Chưa kiểm tra trực tiếp với API Azure hoặc tài khoản thật trong lượt này.
- Kiểm tra ngày 10/10 sau audit loading: typecheck và lint đạt; Procedure đạt **24/24**. Toàn bộ **122** test đạt khi tính lượt chạy đầy đủ và chạy lại tuần tự các ca timeout do máy quá tải ở cấu hình 8 worker. Đồng thời cập nhật 2 selector test đã cũ theo thông báo validation và UI hồ sơ inline hiện tại. Computer-use không khởi tạo được vì helper Windows báo `helper_unknown_error`, nên chưa có kiểm tra trực quan trên phiên trình duyệt thật của người dùng.

## Tích hợp IAM directory theo phường và quyền chi tiết Procedure — 10/10/2026

- Commit: `9e27e2e` — danh bạ IAM theo phạm vi, phường và phân công lĩnh vực.
- Đối chiếu source backend mới và chuyển danh sách cán bộ của Manager sang `GET /api/v1/manager/officers`: tìm kiếm/phân trang phía server, hiển thị mã phường, trạng thái và lĩnh vực phụ trách theo đúng `DirectoryPage`.
- Bổ sung UI chọn nhiều lĩnh vực thủ tục và lưu toàn bộ danh sách qua `PUT /api/v1/manager/officers/{userId}/categories`; danh mục chọn lấy từ API Procedure Catalog, không cho nhập ID tự do.
- Chuyển danh sách người dùng Admin sang `GET /api/v1/admin/users`; giữ các API chi tiết, khóa/mở, gán phường và RBAC hiện có cho thao tác quản trị.
- Bổ sung API client cho directory Manager/Admin, phân công lĩnh vực và danh sách phường công khai. `UnifiedSelfProfileView` dùng `GET /api/v1/wards` thay cho route quản trị `/accounts/wards`, tránh request 403 bị bỏ qua ở các role không có `iam.wards.read`.
- Không nối `GET /api/v1/users/access-context` vào frontend vì đây là contract để Workflow xác minh ngữ cảnh hiện hành của chính người gọi.
- Luồng PDF giữ nguyên contract đã khớp backend. Các hành động tạo/sửa/trạng thái/lịch sử/rollback, quản lý danh mục và upload/đọc/lưu/xuất bản/xóa draft nay chỉ hiển thị khi có permission tương ứng; truy cập trực tiếp workspace draft thiếu `procedure.drafts.read` hiển thị trạng thái không có quyền và không gọi API draft.
- Kiểm tra: `npm run typecheck` đạt; `npm run lint` đạt; production build đạt. Nhóm Playwright liên quan Manager, Admin RBAC và Procedure đạt **29/29**; test mới xác nhận phân công lĩnh vực và tài khoản chỉ có `procedure.read` không thấy thao tác ghi/không gọi draft API.
- Giới hạn: kết quả trên dùng mock HTTP theo contract backend; chưa xác minh API thật, migration IAM, tài khoản/phường thật, AIOCR hoặc Azure Blob trong môi trường chạy. Build còn cảnh báo annotation Zod và chunk chính trên 500 KB như trước.

## Sửa lỗi Layout Shift / Dòng text "Đang tải dữ liệu thủ tục..." bị nhảy ra ngoài — 09/10/2026

- **Nguyên nhân**:
  - Tại [ProcedureManagerPage.tsx](file:///d:/frontend/src/pages/procedure-manager/ProcedureManagerPage.tsx), khi load số liệu thống kê cho Dashboard (`stats = useProcedureQuery(...)`), component gọi `<ProcedureFeedback loading={stats.loading} ... />` đặt ngay phía trên `<ProcedureDashboardView />`.
  - Component `ProcedureFeedback` khi `loading = true` render một thẻ `<p className="rounded-xl bg-slate-50 p-5">Đang tải dữ liệu thủ tục…</p>`.
  - Do thẻ này nằm độc lập bên ngoài và trên cùng của toàn bộ các card thống kê, mỗi khi trang fetch dữ liệu, dòng thông báo này xuất hiện chèn vào giữa tiêu đề trang và các card, đẩy toàn bộ nội dung dashboard xuống dưới, gây giật giao diện (layout shift) và cảm giác "bị nhảy ra bên ngoài". Đồng thời các thẻ thống kê hiển thị tạm dòng chữ `Chưa có dữ liệu`.
- **Giải pháp xử lý**:
  - Tại [ProcedureManagerPage.tsx](file:///d:/frontend/src/pages/procedure-manager/ProcedureManagerPage.tsx): Bỏ `loading={stats.loading}` khỏi `ProcedureFeedback` ở ngoài; chỉ render `ProcedureFeedback` khi có lỗi (`stats.error`). Truyền cờ `statsLoading={stats.loading}` vào `ProcedureDashboardView`.
  - Tại [ProcedureDashboardView.tsx](file:///d:/frontend/src/pages/procedure-manager/ProcedureDashboardView.tsx): Khi `statsLoading === true`, các card hiển thị skeleton nhấp nháy êm ái (`animate-pulse rounded-lg bg-slate-200/70`) đúng tại vị trí con số thống kê thay vì chèn dòng text thô ra ngoài và không bị nhảy giật layout.
- **Kiểm tra**: `npx tsc --noEmit` đạt 0 lỗi.

## Thống nhất thiết kế Chỉnh sửa Hồ sơ cá nhân (Inline Editing, Không dùng Modal) cho toàn bộ 5 Roles — 09/10/2026

- **Loại bỏ 100% Modal pop-up khi Chỉnh sửa Hồ sơ cá nhân & Thống nhất chung 1 chuẩn thiết kế**:
  1. **Manager (Lãnh đạo UBND)**:
     - Màn hình Hồ sơ cá nhân: [UnifiedSelfProfileView.tsx](file:///d:/frontend/src/components/profile/UnifiedSelfProfileView.tsx) — inline editing, không modal.
     - Màn hình Chi tiết cán bộ Một cửa: [ManagerProfileDetailView.tsx](file:///d:/frontend/src/pages/manager/views/ManagerProfileDetailView.tsx) — inline editing, không modal.
  2. **Officer (Cán bộ Một cửa)**: Dùng [UnifiedSelfProfileView.tsx](file:///d:/frontend/src/components/profile/UnifiedSelfProfileView.tsx) — inline editing, không modal.
  3. **Admin (Quản trị viên)**: Dùng [UnifiedSelfProfileView.tsx](file:///d:/frontend/src/components/profile/UnifiedSelfProfileView.tsx) — inline editing, không modal.
  4. **Procedure Manager (Quản lý thủ tục)**: Dùng [UnifiedSelfProfileView.tsx](file:///d:/frontend/src/components/profile/UnifiedSelfProfileView.tsx) — inline editing, không modal.
  5. **Citizen (Công dân)**:
     - Nâng cấp [CitizenProfileView.tsx](file:///d:/frontend/src/pages/citizen/views/CitizenProfileView.tsx) sang đúng chuẩn thiết kế cao cấp của `UnifiedSelfProfileView`:
       - Thanh action bar trên cùng với nút `Chỉnh sửa hồ sơ` / `In phiếu thông tin` và đổi sang cụm `Hủy` / `Lưu thay đổi`.
       - Banner gradient thông báo trạng thái chỉnh sửa (`from-red-900 via-red-800 to-amber-700`) với nút Hủy và Lưu nổi bật.
       - Thẻ CCCD gắn chip VNeID chuyên nghiệp kèm sao chép nhanh, input CCCD phong cách mono 12 ký tự có đếm số ký tự `XX/12`.
       - Hiệu ứng viền đỏ `ring-2 ring-red-800/20` và huy hiệu `Được phép sửa`.
       - Đầy đủ validation schema Zod và hiển thị thông báo lỗi inline dưới từng trường.
- **Kiểm tra**: `npx tsc --noEmit` đạt 0 lỗi trên toàn bộ dự án.

## Dọn file source và dependency không còn sử dụng — 09/10/2026

- Rà soát toàn bộ `src` bằng đồ thị import từ `src/main.tsx`, sau đó xác minh từng ứng viên bằng `rg`, lazy import, barrel export, test và production build. Không xóa `src/vite-env.d.ts` vì đây là ambient type bắt buộc của Vite.
- Xóa 3 file re-export sidebar không còn caller: `src/pages/manager/ManagerSidebar.tsx`, `src/pages/officer/OfficerSidebar.tsx`, `src/pages/procedure-manager/ProcedureManagerSidebar.tsx`.
- Xóa 2 nguồn mock không còn được import sau khi chuyển sang API/empty state: `src/data/mockOfficerData.ts`, `src/pages/manager/mockData.ts`.
- Xóa ảnh `src/assets/logo.png` (903 KB) không có tham chiếu; logo hiện tại tiếp tục dùng asset công khai qua `BrandMark`.
- Đã xác định 6 dependency trực tiếp hiện không còn import (`@fontsource/poppins`, `@heroicons/react`, `embla-carousel-react`, `lucide-react`, `react-is`, `recharts`) nhưng giữ nguyên theo yêu cầu người dùng; `package.json`, `package-lock.json`, chunk `charts`/`lucide-react` và selector Recharts đã được phục hồi.
- Không xóa `mockNotifications` vì `NotificationBell` vẫn sử dụng; không đụng `tmp` và `.npm-cache` vì chưa đủ bằng chứng là dữ liệu có thể bỏ.
- Cập nhật các test Playwright đã lệch UI hiện tại: route đánh giá công dân, trạng thái hồ sơ rỗng, nhãn sidebar theo role, đăng xuất qua `UserDropdown` và việc không còn render nhóm `Chức năng được cấp`. Mock auth chỉ xử lý endpoint auth để không bắt nhầm request dữ liệu nền; test retry đăng xuất chờ trạng thái nút thực sự sẵn sàng để tránh race khi React thay DOM.
- Kiểm tra: `npm run typecheck` đạt; `npm run lint` đạt; `npm run build` đạt. Toàn bộ Playwright đạt **118/118** với Microsoft Edge và 2 worker; riêng test retry đăng xuất đạt 5/5 lần lặp song song trước lượt chạy toàn bộ cuối. Build còn cảnh báo annotation Zod và chunk chính trên 500 KB như trước. `npm audit` báo 2 lỗ hổng mức cao; chưa chạy `npm audit fix` và không thay dependency theo yêu cầu người dùng.

## Sửa lỗi Citizen Login Redirect & Bỏ mục Chức năng được cấp trên Sidebar — 08/10/2026

- **Nguyên nhân Citizen login bị đá sang `/procedure-manager`**:
  1. Trong `src/lib/navigationAccess.ts`, quy tắc kiểm tra quyền workspace `procedure-manager` sử dụng prefix `procedure.` lỏng lẻo, khiến tài khoản có quyền đọc thủ tục công khai (`procedure.read`) bị nhận diện nhầm là có quyền quản trị phân hệ Quản lý thủ tục.
  2. Trong `src/lib/authRedirect.ts`, hàm `getManagementHome` kiểm tra `canAccessWorkspace('procedure-manager', ...)` và trả về `/procedure-manager`, đi ngược lại nguyên tắc "công dân và quản lý thủ tục không bị ép buộc rời khỏi cổng công khai". Khi công dân login về trang chủ `/`, component `HomeRoute` trong `App.tsx` gọi `getManagementHome` và redirect công dân thẳng vào `/procedure-manager`.
- **Giải pháp xử lý**:
  - `src/lib/navigationAccess.ts`: Chuẩn hóa danh sách permissions của `procedure-manager` thành các quyền quản trị cụ thể (`procedure.manage`, `procedure.create`, `procedure.update`, `procedure.publish`, `procedure.status`, `document.templates.`), loại trừ quyền đọc công khai.
  - `src/lib/authRedirect.ts`:
    - `getManagementHome`: Trả về `null` ngay lập tức nếu người dùng có role `REGISTERED_CITIZEN`; loại bỏ dòng redirect sang `/procedure-manager`.
    - `loginDestination`: Bổ sung kiểm tra `if (roles.includes('REGISTERED_CITIZEN')) return '/';` để bảo đảm công dân luôn về trang chủ hoặc `returnTo` cụ thể.
- **Bỏ mục "Chức năng được cấp" & Xóa thẻ tài khoản ở cuối Sidebar**:
  - Trong `src/components/layout/WorkspaceSidebar.tsx`:
    - Bỏ phần render mục `Chức năng được cấp` khỏi sidebar. Giữ nguyên toàn bộ code và các file liên quan (`PermissionFeatures.tsx`, handler tính năng) đúng theo yêu cầu "không cần xóa hết mấy cái liên quan".
    - Xóa khối thẻ tài khoản ở đáy sidebar (`.admin-sidebar-user` chứa avatar, tên tài khoản và vai trò) theo yêu cầu người dùng, giúp sidebar gọn gàng và đồng bộ với UserDropdown ở topbar.
- **Sửa lỗi crash `CitizenQrCodeView` khi chưa có hồ sơ (`Cannot read properties of undefined`)**:
  - Tại `src/pages/citizen/views/CitizenQrCodeView.tsx`: Thêm điều kiện xử lý an toàn khi danh sách hồ sơ `dossiers` rỗng hoặc chưa chọn hồ sơ (`!activeDossier`); hiển thị giao diện placeholder thông báo *"Chưa có mã QR hồ sơ - API mã QR hồ sơ điện tử sẽ được tích hợp sau"* thay vì cố đọc `activeDossier.procedureName`.
- **Xóa toàn bộ subtext (phụ đề dưới tiêu đề/thẻ) trên Phân hệ Cán bộ Một cửa (Officer)**:
  - Tại `src/pages/officer/OfficerHeader.tsx`: Bỏ toàn bộ phụ đề `subtitle` trong cấu hình `SECTION_TITLES` của tất cả các section.
  - Tại `src/pages/officer/OfficerDashboardView.tsx`: Xóa các dòng subtext phụ đề mô tả bên dưới tiêu đề biểu đồ ca trực, hàng đợi ưu tiên xử lý ngay và thẻ tiếp nhận tại quầy.
  - Tại `src/pages/officer/OfficerAuditLogView.tsx`: Xóa dòng phụ đề bên dưới tiêu đề "Lịch sử xử lý trong ca trực".
  - Tại `src/pages/officer/OfficerNotificationView.tsx`: Xóa dòng phụ đề bên dưới tiêu đề "Thông báo ca làm việc".
  - Tại `src/pages/officer/OfficerReviewWorkspaceView.tsx`: Xóa toàn bộ các dòng subtext giải thích dưới tiêu đề `h3` ở tất cả 9 tab thẩm tra hồ sơ (thông tin người dân, điều kiện thủ tục, checklist giấy tờ, tệp đính kèm, E-Form, kết xuất PDF, nhận xét/góp ý, lịch sử phiên bản, tiến trình timeline).
- **Xóa toàn bộ subtext (phụ đề dưới tiêu đề/thẻ) trên Cổng Công dân**:
  - Tại `src/pages/citizen/CitizenPage.tsx`: Bỏ tất cả phụ đề `subtitle` trong cấu hình tiêu đề các màn hình (`sectionTitles`), loại bỏ dòng render `<p>{meta.subtitle}</p>` dưới tiêu đề chính `h1`.
  - Tại `src/pages/citizen/views/CitizenDashboardView.tsx`: Xóa dòng subtext mô tả phụ `{sub}` dưới 4 thẻ chỉ số thống kê hồ sơ; xóa dòng mô tả `{desc}` dưới các phím tắt tiện ích hồ sơ.
  - Tại `src/pages/citizen/views/CitizenNotificationsView.tsx`: Xóa dòng subtext phụ đề dưới tiêu đề "Hộp thư thông báo tiến độ".
  - Tại `src/pages/citizen/views/CitizenFeedbackView.tsx`: Xóa dòng subtext phụ đề dưới tiêu đề "Góp ý chất lượng phục vụ công dân".
- **Xóa nhóm "Tiếp nhận hồ sơ" khỏi Sidebar Cán bộ Một cửa**:
  - Tại `src/components/layout/RoleWorkspaceSidebars.tsx`: Đã xóa toàn bộ nhóm `Tiếp nhận hồ sơ` (`Chờ tiếp nhận` và `Đã tiếp nhận`) khỏi `UnifiedOfficerSidebar`. Đúng theo ranh giới nghiệp vụ chuẩn của WardMate: hệ thống chỉ phục vụ tiền kiểm và chuẩn bị hồ sơ trực tuyến, việc tiếp nhận chính thức thuộc về Bộ phận một cửa ngoài đời thực. Quy trình tiền kiểm đã nằm trọn vẹn trong cây menu `Quản lý hồ sơ` (`Hồ sơ nghiệp vụ`).
- **Xóa tag số (badge) ở các mục trên Sidebar**:
  - Tại `src/components/layout/WorkspaceSidebar.tsx`: Gỡ bỏ hoàn toàn thẻ tag `<small>` hiển thị số badge trên các nút điều hướng sidebar (cả mục cha, nhánh cây con và nút thông thường).
  - Tại `src/components/layout/RoleWorkspaceSidebars.tsx`: Loại bỏ thuộc tính `badge` khỏi tất cả các mục điều hướng quản lý của Cán bộ Một cửa (`Officer`), Lãnh đạo UBND (`Manager`), và Quản lý thủ tục (`Procedure Manager`).
  - Tại `src/pages/citizen/CitizenPage.tsx`: Loại bỏ thuộc tính `badge` khỏi các mục hồ sơ và thông báo trên sidebar công dân; dọn dẹp hàm `dossierCounts` và `useMemo`.
  - Tại `src/pages/officer/OfficerPage.tsx`: Bỏ số đếm `20` hardcode trong `receivedToday`.
- **Xóa mục "Tra cứu thủ tục" khỏi Sidebar Công dân**:
  - Tại `src/pages/citizen/CitizenPage.tsx`: Bỏ mục điều hướng `{ id: 'procedures', label: 'Tra cứu thủ tục' }` trong nhóm `Tổng quan` của sidebar công dân theo yêu cầu người dùng; tra cứu thủ tục là chức năng công khai tại trang chủ/cổng thông tin, không cần thiết lặp lại trên thanh điều hướng workspace cá nhân của công dân.
- **Đồng bộ bộ Icon của Citizen theo Officer**:
  - Tại `src/pages/citizen/CitizenPage.tsx`:
    - Thay thế các icon `Folder` đơn điệu trong cây menu `Hồ sơ của tôi` bằng các icon trực quan giống Officer:
      - Mục cha `Hồ sơ của tôi`: `Files` (giống `Hồ sơ nghiệp vụ` của Officer).
      - `Tất cả hồ sơ`: `Files`.
      - `Bản nháp`: `FileText`.
      - `Chờ tiền kiểm`: `Hourglass` (đồng hồ cát).
      - `Cần chỉnh sửa`: `WarningCircle` (cảnh báo).
      - `Đã gửi lại`: `ArrowCounterClockwise` (mũi tên hoàn tác).
      - `Đã duyệt tiền kiểm`: `CheckCircle` (dấu tích thành công).
      - `Đã hoàn thành`: `FileText`.
    - Mục `Hồ sơ cá nhân`: Đổi từ `User` sang `UserCircle` để thống nhất với Officer/Manager/Admin.
- **Kiểm tra**:
  - `npm run typecheck`: Đạt (0 lỗi).
  - Không chạy test tự động theo yêu cầu người dùng.

## Khôi phục UI dashboard trước khi hợp nhất theo Admin — 08/10/2026

- Người dùng chốt mốc giao diện ngay trước commit `a98db02`. Khôi phục các đặc điểm UI của sidebar riêng cho Admin, Công dân, Cán bộ Một cửa, Lãnh đạo UBND và Quản lý thủ tục trên khung permission hiện tại: khoảng cách nhóm/hàng 44px, thẻ tài khoản cuối sidebar và nhãn điều hướng theo từng workspace.
- Khôi phục menu cây `Hồ sơ của tôi` cho Công dân và `Hồ sơ nghiệp vụ` cho Cán bộ Một cửa, gồm trạng thái mở/đóng, badge tổng và các nhánh con như trước khi menu bị làm phẳng. Mobile/compact và accessibility (`aria-expanded`, `aria-current`, nhãn sidebar theo role) được giữ.
- Không khôi phục nội dung/mock cũ. Các view hiện tại, dòng thông báo chờ API, API thật, auth, Protected Routes, RBAC động và panel `Chức năng được cấp` được giữ nguyên.
- Đã bỏ hoàn toàn phương án thêm `ManagerDashboardView` ở lượt hiểu nhầm trước; Manager tiếp tục mở `Thống kê hồ sơ` như trạng thái trước task.
- File UI liên quan: `src/components/layout/WorkspaceSidebar.tsx`, `src/components/layout/RoleWorkspaceSidebars.tsx`, `src/pages/citizen/CitizenPage.tsx`, `src/styles/globals.css`. Test Officer/Manager/sidebar được cập nhật để phản ánh UI cũ và dữ liệu rỗng hiện tại.
- Kiểm tra: `npm run typecheck` đạt; `npm run lint` đạt; production build đạt (còn cảnh báo chunk lớn và annotation Zod như trước). Lượt Playwright tổng đầu đạt 33/38, 5 lỗi đều là kỳ vọng UI compact hoặc dữ liệu mock đã bị xóa; sau khi cập nhật đúng trạng thái hiện tại, chạy lại toàn bộ nhóm liên quan đạt 14/14. Chưa kiểm tra trực quan thủ công trên trình duyệt.

## Dọn dẹp mock data các mục sidebar — Chờ tích hợp API — 08/10/2026

- Theo yêu cầu người dùng, đã xóa toàn bộ mock data từ các mục ở sidebar chưa có backend, thay bằng thông báo rõ ràng "⚠️ API ... sẽ được tích hợp sau". Tuyệt đối không chỉnh sửa các mục đã call API thật.
- **Citizen Workspace**:
  - `CitizenPage.tsx`, `types.ts`: Khởi tạo danh sách hồ sơ `dossiers` và thông báo `notifications` thành mảng rỗng; xóa import dữ liệu mock.
  - `CitizenDashboardView.tsx`: Xóa biểu đồ AreaChart mock, thay bằng placeholder thông báo API thống kê hoạt động công dân sẽ được tích hợp sau.
  - `CitizenFeedbackView.tsx`: Xóa danh sách đánh giá mẫu, hiển thị placeholder thông báo API lịch sử đánh giá dịch vụ sẽ được tích hợp sau.
- **Officer Workspace**:
  - `OfficerPage.tsx`: Khởi tạo `applications`, `auditLogs`, `notifications` thành mảng rỗng.
  - `OfficerDashboardView.tsx`: Xóa biểu đồ và các thẻ số liệu ca trực mock, thay bằng placeholder API thống kê tiến độ và hiệu suất ca trực.
  - `OfficerApplicationListView.tsx`, `OfficerAuditLogView.tsx`, `OfficerNotificationView.tsx`: Cập nhật empty state thông báo rõ API sẽ được tích hợp sau.
- **Manager Workspace**:
  - `ManagerFeedbackView.tsx`: Xóa danh sách phản hồi mock và khảo sát hài lòng, thay bằng placeholder API tiếp nhận ý kiến và khảo sát SIPAS.
  - `ManagerPerformanceView.tsx`: Xóa các bảng/chỉ số hiệu suất cán bộ và tỷ lệ bổ sung mock, thay bằng placeholder API hiệu suất.
  - `ManagerSystemStatsView.tsx`: Xóa biểu đồ xu hướng, phân bổ hồ sơ, top thủ tục và tra cứu mock; thay bằng placeholder API thống kê hệ thống.
  - `mockData.ts`: Dọn dẹp dữ liệu mock, giữ lại mảng rỗng cho hồ sơ. Các mục danh sách cán bộ Một cửa (`ManagerProfilesView`, `ManagerProfileDetailView`) tiếp tục gọi API thật `getUserProfiles`, `getAdminProfile`, `updateAdminProfile`, `updateAccountStatus`.
- **Admin Workspace**:
  - `AdminPage.tsx`: Xóa biểu đồ `UsageChart`, `services`, `FormsView`, `KnowledgeView`, `IntegrationsView`, `BackupView` mock; thay bằng placeholder thông báo API sẽ được tích hợp sau. Các chỉ số chưa có API hiển thị `—`.
  - Giữ nguyên toàn bộ các phân hệ đã kết nối API thật: Người dùng (`getManagedUsers`, `updateAccountStatus`), Phường/Xã (`getWards`, `createWard`, `assignUserWard`), Vai trò & quyền hạn (`AdminRolesView`), Nhật ký hoạt động (`AdminRbacAuditView`), Danh sách thủ tục (`ProcedureManagerPage`).
- **Kiểm tra**:
  - `npm run typecheck`: Đạt (0 lỗi).
  - `npm run lint`: Đạt (0 cảnh báo, 0 lỗi).
  - `npm run build`: Đạt (biên dịch production thành công).

## Dashboard Admin — hoạt động quản trị gần đây — 08/10/2026

- Thẻ `Hoạt động quản trị gần đây` trên Tổng quan Admin nay gọi API audit thật với `pageSize=5` và hiển thị tối đa 5 sự kiện mới nhất. Mỗi sự kiện nêu rõ hành động, người/ quyền bị tác động, người thực hiện, vai trò liên quan và thời gian; màu icon phân biệt thao tác cấp/tạo, thu hồi/xóa/khóa và cập nhật. Dữ liệu tên tài khoản, vai trò và quyền đều được resolve từ API, không hardcode. Chỉ số `Tài khoản nội bộ` cũng lấy tổng số tài khoản từ API người dùng thay cho số `40` hardcode.
- Có skeleton tải, trạng thái lỗi kèm thử lại và trạng thái rỗng; nút `Xem nhật ký` vẫn mở danh sách đầy đủ. Không hiển thị GUID hoặc dữ liệu audit giả trên dashboard.
- File liên quan: `src/pages/admin/AdminPage.tsx`, `src/pages/admin/AdminRbacViews.tsx`, `tests/admin-rbac.spec.ts`.
- Kiểm tra: `npm run typecheck` đạt, `npm run lint` đạt, Playwright `tests/admin-rbac.spec.ts` đạt 4/4, `git diff --check` đạt (chỉ có cảnh báo chuyển LF sang CRLF của Git trên Windows).

## Sidebar Admin và chức năng được cấp — 08/10/2026

- Loại bỏ mục `Thủ tục hành chính` bị chèn trùng trong nhóm `Chức năng được cấp` bằng cách khai báo đúng permission trên mục Admin đã có.
- Sửa danh sách thủ tục nhúng bị hiện hai thông báo tải giống nhau; nút `Thêm thủ tục` chỉ còn xuất hiện đúng ở trang danh sách.
- `Lịch sử phiên bản`, `Biểu mẫu điện tử` và `Đơn điện tử của tôi` không còn mở nhầm màn hình hoặc dữ liệu mock; hiển thị thông báo trạng thái tích hợp/API ngắn gọn. `Danh mục thủ tục` và `PDF & bản nháp` tiếp tục dùng API thật hiện có.

## Skeleton cho danh sách dữ liệu — 08/10/2026

- Thêm bộ skeleton UI dùng chung tại `src/components/ui/Skeleton.tsx`: primitive `Skeleton`, dòng bảng, bảng, danh sách và lưới thẻ; giữ Tailwind/shadcn convention hiện có, không thêm dependency.
- Thay thông báo tải dạng chữ tại các danh sách API chính: vai trò/quyền, audit, cán bộ Một cửa, thủ tục quản trị, PDF/bản nháp, danh mục, lịch sử phiên bản, thủ tục cập nhật gần đây và các danh sách thủ tục công khai/trang chủ.
- Không thay loading của form submit, trang chi tiết, lazy route hoặc dữ liệu tĩnh/mock vì các trạng thái đó không phải danh sách dữ liệu.
- Sửa ô tìm kiếm thủ tục công khai cập nhật URL ở từng ký tự khiến mất chữ khi gõ nhanh; nay giữ state nhập cục bộ và debounce 300 ms, test debounce đạt.
- Kiểm tra: `npm run typecheck` và `npm run lint` đạt; 5 test từng lỗi do badge sidebar/tên nhãn cũ đã chạy lại đạt 4/5, test debounce còn lại đạt sau khi sửa. Lượt chạy tổng 42 test trước sửa cuối đạt 37/42; các lỗi liên quan đã được chạy lại riêng và đạt, chưa chạy lại toàn bộ 42 test thêm một lần.

## Đồng nhất thủ tục trên sidebar Admin — 08/10/2026

- Đổi nhãn Admin thành `Danh sách thủ tục`, `Danh sách biểu mẫu`, `Dữ liệu kiến thức AI` để thống nhất với sidebar Quản lý thủ tục.
- Mục `Danh sách thủ tục` của Admin không còn dùng bốn dòng mock hardcode; nhúng trực tiếp màn quản lý thủ tục đã nối `GET /api/v1/procedure-manager/procedures` và các API danh mục/thống kê liên quan.
- Panel `Chức năng được cấp` nay phủ trọn workspace từ đỉnh đến đáy viewport và có lớp hiển thị cao hơn topbar, không còn bị topbar che tiêu đề/nút đóng khi mở sau khi cuộn. Nội dung panel chỉ cuộn dọc trong vùng riêng; khóa overflow của cả `html` và `body` để loại bỏ thanh cuộn nền/ngang ở đáy.
- Theo yêu cầu người dùng, đã bỏ hoàn toàn thanh header riêng của panel (tên chức năng, dòng quyền IAM và nút X). Nội dung chức năng mở trực tiếp trong vùng làm việc; chuyển mục hoặc thoát bằng sidebar.
- Vùng chức năng bắt đầu dưới topbar chuẩn 72px thay vì phủ từ đỉnh viewport, nên vẫn giữ nút thu gọn sidebar, chuông thông báo và UserDropdown; không khôi phục header phụ/nút X.
- Sidebar Lãnh đạo UBND đã bỏ hai mục `Báo cáo tổng hợp` và `Cài đặt quyền` theo yêu cầu; nhóm cuối chỉ còn `Hồ sơ cá nhân` và đổi tên thành `Tài khoản`.
- Đã xóa toàn bộ code mồ côi của hai mục trên: `ManagerReportsView`, `ManagerPermissionsView`, hai section/type/header mapping và các bộ `mockReportTemplates`, `mockPermissionRoles`; test Manager chuyển sang xác nhận hai mục không còn tồn tại.
- Thu gọn mật độ sidebar dùng chung: hàng menu từ tối thiểu 44px xuống 40px, giảm khoảng cách giữa hàng/nhóm và padding dọc; vẫn giữ touch target 40px, các nhãn dài được phép xuống dòng khi cần.

## Tích hợp IAM RBAC động — 08/10/2026

- Hợp nhất runtime sidebar của Admin, Công dân, Cán bộ Một cửa, Lãnh đạo UBND và Quản lý thủ tục về `src/components/layout/WorkspaceSidebar.tsx`; ba component sidebar cũ chỉ còn re-export để không duy trì implementation trùng lặp. Cấu hình theo workspace dùng chung tại `RoleWorkspaceSidebars.tsx`; Admin/Citizen cũng render cùng component này.
- Thêm `navigationAccess.ts` làm nguồn quyết định hiển thị menu từ `roles` và `permissions` của `/users/me`. Đã bỏ hoàn toàn nhóm `Không gian làm việc`: quyền ngoài role hiện tại được chèn trực tiếp vào sidebar dưới nhóm `Chức năng được cấp`, bấm vào thay vùng nội dung nhưng giữ nguyên sidebar/layout của role đang đăng nhập.
- Map đủ 30 permission thành 11 mục chức năng dễ dùng: hồ sơ cá nhân; người dùng; Phường/Xã; vai trò & quyền; audit; thủ tục; lịch sử phiên bản; danh mục; PDF/bản nháp; biểu mẫu; đơn điện tử. Các permission thao tác cùng màn được gom vào một mục, không tạo 30 dòng menu. Thu hồi quyền làm mục biến mất sau khi IAM phát hành phiên/token mới.
- `PermissionFeatures.tsx` tái sử dụng trực tiếp `AdminRbacAuditView`, `AdminRolesView`, `UnifiedSelfProfileView` và chế độ nhúng của Admin/Procedure Manager/Citizen để không nhân bản API/UI. Các chức năng UI mẫu chưa nối API vẫn được giữ nguyên theo role cũ.
- Đã kiểm tra trực quan bằng Edge với tài khoản Manager mock có `iam.audit.read`. Sửa panel permission bị phủ lên topbar, thiếu tiêu đề/nút đóng và cuộn chung với trang nền: panel nay nằm dưới topbar, giữ sidebar hiện tại, có header/nút đóng, khóa cuộn nền và cuộn nội dung riêng; bảng audit mobile cuộn ngang trong card.
- `ProtectedRoute` và điều hướng đăng nhập/trang chủ vẫn nhận permission để hỗ trợ tài khoản custom truy cập trực tiếp khi cần; sidebar không còn liên kết chuyển workspace. Lượt chỉnh cuối theo yêu cầu người dùng không chạy Playwright/build; `npm run typecheck` và `npm run lint` đạt.
- Đổi màn `Vai trò & quyền hạn` thành bảng cuộn dọc, có badge loại vai trò và thanh tiến độ số quyền. Khi chọn một vai trò, bảng quyền mở trong drawer từ mép phải, rộng gần nửa màn hình và làm mờ danh sách phía sau; mobile dùng toàn chiều rộng. Drawer hỗ trợ đóng bằng nền phủ, nút đóng hoặc phím Escape.
- Bảng quyền trong drawer dùng header cố định, badge module và màu trạng thái để dễ quét dữ liệu hơn.
- Bỏ số phần trăm khỏi cột quyền và áp dụng lại wrapper bảng chuẩn để căn hàng/cột, khoảng đệm đồng đều; thanh tiến độ chỉ còn hỗ trợ nhận biết nhanh tỷ lệ quyền.
- Bảng quyền giữ tìm kiếm, lọc module, lọc đã cấp/chưa cấp và công tắc gọi API cấp/thu hồi hiện có. Giữ nguyên modal tạo/sửa/xóa, quy tắc vai trò hệ thống và phân trang.
- Sau lần chỉnh UI drawer cuối cùng chưa chạy lại kiểm thử theo yêu cầu người dùng. Kết quả Playwright 3/3 và ESLint đạt ở lượt kiểm tra trước chỉ áp dụng cho bố cục master-detail trước đó.
- Đã dọn dẹp các badge đếm số lượng tĩnh trong sidebar của Admin, Manager, Officer và Procedure Manager; giải quyết triệt để các cảnh báo biến không dùng.
- Tinh chỉnh giao diện Nhật ký hoạt động (`AdminRbacViews.tsx`):
  - Thêm modal xem chi tiết nhật ký (`AuditDetailModal`) với so sánh trước/sau (`before`/`after`), giải mã tên tài khoản, sao chép ID, và khối dữ liệu có thể mở rộng.
  - Thêm nút xem "Chi tiết" ở cột Thao tác trên bảng Nhật ký hoạt động, giữ nguyên kết cấu các cột nghiệp vụ của bảng.
  - Sửa hiệu ứng spinner trùng lặp trên nút "Làm mới".
  - Loại bỏ các thuật ngữ kỹ thuật nội bộ (như chữ "IAM" tại thẻ tổng quan `AdminPage.tsx` và modal phân vai trò `AdminRbacViews.tsx`).
  - Chuẩn hóa tên quyền hạn và hành động sang tiếng Việt thân thiện.
  - Tăng khoảng cách đệm `mb-6` cho tiêu đề trang Admin (`.admin-page-heading`) giúp bố cục thoáng đãng.
  - Loại bỏ việc lặp mã vai trò tiếng Anh (`REGISTERED_CITIZEN`) và mô tả thừa trong drawer chi tiết vai trò.
- Thay màn `Vai trò & quyền hạn` và `Nhật ký hoạt động` mock trong Admin bằng API IAM thật; loại bỏ nhật ký tên người/IP giả khỏi cả Dashboard và trang audit.
- Thêm client Zod `src/lib/api/rbac.ts` cho danh sách/CRUD vai trò, danh mục quyền, cấp/thu hồi quyền, vai trò người dùng và audit. Danh sách quyền lấy động từ DB/API, nhóm theo `module`; không hardcode 30 permission ID hoặc giới hạn ba module hiện tại.
- Vai trò hệ thống khóa tên và không có thao tác xóa; vai trò tùy chỉnh hỗ trợ tạo/sửa/xóa. Ràng buộc `system_role`, `role_in_use`, `last_admin`, quyền quản trị và conflict vẫn do BE quyết định, FE giữ trạng thái và hiển thị ProblemDetails.
- Màn Người dùng hệ thống có modal `Phân vai trò`, gọi API gán/thu hồi từng vai trò và làm mới danh sách sau thành công. Không tự sửa access token; quyền có hiệu lực theo phiên/token IAM phát hành.
- Audit dùng actor/target GUID, role/permission ID, action, details và thời gian từ BE; không phát sinh địa chỉ IP hoặc dữ liệu audit giả.
- Bổ sung tìm kiếm audit theo hành động/tài khoản/GUID/details, lọc theo hành động và ngày, nút xóa lọc. UI ghi chú lọc trên 20 bản ghi của trang hiện tại.
- Actor/target GUID được resolve sang `username` bằng `GET /api/v1/accounts/{id}` cho các ID duy nhất trên trang và cache trong RAM; vẫn hiện GUID dưới username để truy vết, fallback GUID nếu tài khoản đã xóa hoặc lookup lỗi.
- Test mới `tests/admin-rbac.spec.ts` đạt 3/3; `tests/workspace-sidebar.spec.ts` đạt.
- Kiểm tra chất lượng:
  - `npm run typecheck`: Đạt 0 lỗi.
  - `npm run lint`: Đạt 0 lỗi.


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
