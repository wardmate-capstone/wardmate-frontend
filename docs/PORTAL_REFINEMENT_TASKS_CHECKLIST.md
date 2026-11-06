# Danh sách theo dõi & Tiến độ hoàn thiện Portal WardMate

> **Tệp theo dõi tiến độ chi tiết theo từng hạng mục được người dùng yêu cầu & các đợt bàn giao kỹ thuật từ Backend.**  
> *Ngày khởi tạo: 03/11/2026 · Cập nhật mới nhất: 05/11/2026 (Tích hợp bàn giao BE sau đợt test KB-00 → KB-04)*

---

## 📌 Bảng tổng quan trạng thái

### Phân hệ 1: Tối ưu UI/UX & Tính năng Cổng thông tin (Yêu cầu người dùng 03/11 - 04/11)

| STT | Hạng mục công việc | Phạm vi | Trạng thái | Ghi chú |
| :---: | :--- | :---: | :---: | :--- |
| **1** | Thanh tìm kiếm Trang chủ chuyển sang Trang thủ tục | `HomePage.tsx` | ✅ **Đã hoàn thành** | Gõ từ khóa chuyển sang `/thu-tuc?q=...`; giữ nguyên danh sách nổi bật |
| **2** | Sửa bảng Cách thức thực hiện & Lệ phí trong chi tiết thủ tục | `ProcedureDetailPage.tsx` | ⏳ **Chờ xử lý** | Sửa lỗi fallback 1 dòng `1 ngay · mien phi` thành bảng 3 hình thức (kết nối góp ý BE-01) |
| **3** | Nâng cấp giao diện "Tệp văn bản nguồn công bố" | `ProcedureDetailPage.tsx` | ✅ **Đã hoàn thành** | Thay khung 450px bằng Thẻ tài liệu hành chính (~76px) + Modal xem toàn màn hình & Tải về |
| **4** | Thời gian lưu & Thêm mốc giờ tin nhắn AI Chatbot | `AiChatWidget.tsx` | ✅ **Đã hoàn thành** | Đặt TTL 24h cho localStorage và thêm hiển thị giờ (`HH:mm`) cho từng bóng chat |
| **5** | Đổi logo AI Chatbot sang logo WardMate | `AiChatWidget.tsx` | ✅ **Đã hoàn thành** | Thay icon người dùng bằng `BrandMark` của dự án WardMate |
| **6** | Hiển thị AI Chatbot ở tất cả các trang | `App.tsx` | ✅ **Đã hoàn thành** | Đưa Chatbot lên cấp App Root (`App.tsx`), hiển thị xuyên suốt trên tất cả các trang |
| **7** | Ràng buộc Single Role & Bảo vệ quyền IT_ADMIN | `AdminRbacViews.tsx` | ⏳ **Chờ xử lý** | Chuyển sang chọn 1 Role duy nhất (Radio/Select), chặn gán bừa bãi `IT_ADMIN` |
| **8** | Bỏ mã phường và ghi chú thừa trong modal tạo tài khoản cán bộ | `CreateStaffAccountModal.tsx` | ✅ **Đã hoàn thành** | Bỏ `({ward.code})` trong select; bỏ hint dưới vai trò và note ở chân modal |
| **9** | Tách riêng 2 trang Quản lý Accounts & Users | `AdminPage.tsx`, `api` | ✅ **Đã hoàn thành** | Tạo trang "Tài khoản đăng nhập" (`/api/v1/accounts`) và giữ trang "Người dùng hệ thống" (`/api/v1/admin/users`) |
| **10** | Xử lý tìm kiếm user theo Username & ký tự đặc biệt | `AdminPage.tsx` + `docs` BE | ⏳ **Chờ xử lý** | Làm sạch ký tự `@` phía FE; đã tạo file bàn giao Backend `BE_REQUESTS_FIXES_IAM_PROCEDURE.md` |

---

### Phân hệ 2: Hạng mục Backend bàn giao sau đợt test Azure KB-00 → KB-04 (05/11/2026)

| STT | Mã BE | Hạng mục công việc | Mức ưu tiên | Trạng thái | Ghi chú & Đánh giá mã nguồn FE |
| :---: | :---: | :--- | :---: | :---: | :--- |
| **11** | **FE-01** | **Chọn phường khi tạo hồ sơ & Xử lý mã lỗi nộp hồ sơ** (KB-01 #6) | 🔴 **Cao** *(Bắt buộc trước KB-06)* | 🟡 **Đã có 90%** (Cần bổ sung lỗi) | `CreateDossierModal.tsx` đã có ô chọn phường và gửi `wardCode`; cần bổ sung xử lý lỗi 409 `application.ward_required` và 503 |
| **12** | **FE-07** | **Liên kết mẫu đơn DOCX ở màn sửa thủ tục nhập tay** (KB-04 #7, #12) | 🔴 **Cao** | ⏳ **Chờ xử lý** | Đổi nguồn kho mẫu sang `GET /api/v1/procedure-manager/document-forms`; bảo đảm `PUT /procedures/{id}` gửi đủ `checklistSchema` và `formDefinitions` |
| **13** | **FE-05** | **Tự động làm mới token sau 15 phút không bị đăng xuất** (KB-02 #10) | 🔴 **Cao** | ✅ **Code đã sẵn sàng** (Cần xác minh) | `createJwtClient.ts` và `api/index.ts` đã cấu hình `withCredentials: true`, Web Locks và HttpOnly cookie `SameSite=Strict` |
| **14** | **FE-02** | **Khắc phục Chatbot bị hủy request `(canceled)` & Lỗi hạn mức 429** (KB-01 #8) | 🟡 **Trung bình** | ✅ **Đã hoàn thành** | Nâng timeout chat lên 75s; khóa input khi AI suy nghĩ; xử lý 429 mời đăng nhập trang nhã |
| **15** | **FE-04** | **Chuẩn hóa thông báo trung tính & Hướng dẫn màn Quên mật khẩu** (KB-02 #13) | 🟡 **Trung bình** | ✅ **Đã hoàn thành** | Giữ nguyên thông báo 202 trung tính từ BE; bổ sung lưu ý Spam, hạn 5 phút, sai 5 lần; khóa nút gửi lại 60s |
| **16** | **FE-09** | **Tạo phôi & Tải DOCX trực tiếp trên màn bản nháp AI** (KB-04) | 🟡 **Trung bình** | ⏳ **Chờ xử lý** | Bổ sung nút "Tạo phôi và tải DOCX" trực tiếp ở từng mẫu thiếu phôi; hiển thị cảnh báo `formDefinitions` nếu thiếu file mẫu |
| **17** | **FE-03, FE-06, FE-08** | **Các tính năng hồ sơ & quản trị mở rộng** (Xóa profile, API admin phụ, Xuất bản nháp thiếu mẫu) | 🟢 **Thấp (Tùy chọn)** | ✅ **Đã hoàn thành** | Nút & Modal xóa profile công dân; API admin; Xuất bản nháp AI cho phép bổ sung phôi DOCX sau |

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

### ⏳ Mục 2: Sửa lỗi UI mục Cách thức thực hiện, Lệ phí
- **Vấn đề:** Khi tệp PDF gốc có bảng "Cách thức thực hiện" đầy đủ nhưng API trả về `contentPayload.submissionMethods: []`, giao diện rơi vào fallback gộp 1 dòng duy nhất có nội dung `1 ngay · mien phi` rất xấu và thiếu thông tin.
- **Giải pháp:**
  - Cải tiến fallback trong `ProcedureDetailPage.tsx`: Khi `submissionMethods` rỗng, tự động sinh các hàng hành chính tiêu chuẩn (Trực tiếp tại Bộ phận Một cửa, Trực tuyến qua Cổng DVC, Qua bưu điện) kết hợp với `processingTimeSummary` và `feeSummary` từ thủ tục.
  - *Kết nối Backend:* Trong đợt bàn giao ngày 05/11, BE ghi nhận mục `BE-01: Cho phép để trống lệ phí, thời hạn xử lý... Tạm thời nhập 'Không quy định' hoặc 'Không thu phí'`. Khi BE hoàn tất cập nhật API catalog, FE sẽ đồng bộ tương ứng.

---

### ✅ Mục 3: Nâng cấp giao diện "Tệp văn bản nguồn công bố"
- **Vấn đề:** Khung `iframe` cố định cao 450px đặt chơ vơ giữa trang, khiến trang bị nặng, cuộn kép khó chịu, chữ bị nhỏ và thanh PDF viewer của trình duyệt chen chúc.
- **Giải pháp đã thực hiện:**
  - Chuyển thành **Thẻ văn bản hành chính (Administrative Document Card)** cao ~76px với icon PDF màu đỏ, nhãn *Văn bản gốc công bố*, tên file và mô tả pháp lý.
  - Tích hợp 3 nút thao tác:
    1. **"Xem văn bản gốc"**: Mở **Modal toàn màn hình (92vh)** hiển thị trọn vẹn văn bản A4 sắc nét, không bị cuộn kép.
    2. **"Mở tab mới"**: Mở PDF trên tab riêng của trình duyệt.
    3. **"Tải về"**: Tải trực tiếp file PDF về máy.
- **Tệp liên quan:** `src/pages/public/ProcedureDetailPage.tsx`.

---

### ✅ Mục 4: Cơ chế lưu trữ & Thời gian tin nhắn AI Chatbot
- **Vấn đề:** Cần làm rõ nơi lưu trữ tin nhắn guest và bổ sung thời gian gửi/nhận tin nhắn.
- **Hiện trạng & Giải pháp đã thực hiện:**
  - Tin nhắn hiện lưu trong `localStorage.getItem('wardmate_guest_chat_messages')`.
  - Đã bổ sung cơ chế TTL hết hạn sau **24 giờ** kể từ tin nhắn cuối cùng (hoặc khi người dùng chủ động bấm Làm mới hội thoại).
  - Hiển thị thời gian (`HH:mm`) dưới chân mỗi bóng chat (cả tin nhắn của người dùng và câu trả lời của AI).

---

### ✅ Mục 5: Thay logo AI Chatbot thành logo WardMate của dự án
- **Vấn đề:** Trước đây Chatbot dùng icon người dùng thông thường (`User`, `UserCheck`).
- **Giải pháp đã thực hiện:** Thay toàn bộ icon trợ lý ở nút mở chat, header khung chat, avatar bóng chat câu trả lời và trạng thái typing bằng biểu tượng thương hiệu chính thức `BrandMark` của WardMate (`@/components/brand/BrandMark`).

---

### ✅ Mục 6: Hiển thị AI Chatbot ở tất cả các trang
- **Yêu cầu:** Chatbot WardMate cần luôn sẵn sàng hỗ trợ người dân và cán bộ trên **mọi trang** của cổng thông tin.
- **Giải pháp đã thực hiện:**
  - Nhúng `<AiChatWidget />` tại tệp cấu hình gốc của ứng dụng [`App.tsx`](file:///d:/frontend/src/app/App.tsx) bên trong `<BrowserRouter>`.
  - Loại bỏ các lệnh nhúng cục bộ rải rác ở `HomePage.tsx` và `CitizenPage.tsx`.
  - Chatbot giờ đây hiển thị nổi cố định góc dưới bên phải trên toàn bộ hệ thống.

---

### ⏳ Mục 7: Phân quyền vai trò người dùng (Admin RBAC)
- **Vấn đề:** Modal gán vai trò người dùng hiện cho phép tích nhiều checkbox cùng lúc (đa vai trò gây xung đột luồng cán bộ/công dân) và cho phép gán cả quyền `IT_ADMIN`.
- **Giải pháp:**
  - Chuyển sang dạng chọn **1 vai trò duy nhất (Single Role)** qua Radio hoặc Dropdown Select.
  - Ẩn quyền `IT_ADMIN` khỏi danh sách gán vai trò nhân sự thông thường.
  - Phù hợp với ghi nhận của BE tại KB-03 #20b và #23a (bảo vệ quyền tối cao).

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
    1. **"Tài khoản đăng nhập" (`accounts`)**: Kết nối `GET /api/v1/accounts`, hiển thị bảng tài khoản (`@username`, email, phường, ngày tạo, trạng thái), tìm kiếm, bộ lọc trạng thái, thao tác Khóa/Mở khóa. Đã lọc bỏ `IT_ADMIN` khỏi danh sách.
    2. **"Người dùng hệ thống" (`users`)**: Kết nối `GET /api/v1/admin/users`, quản lý danh bạ cán bộ & công dân, phân công vai trò chuyên trách.

---

### ⏳ Mục 10: Tìm kiếm tài khoản User theo Username & Ký tự đặc biệt
- **Vấn đề:** Tìm kiếm theo `Username` hoặc gõ `@username` trả về 0 kết quả do Backend `UserDirectory.cs` chỉ tìm theo `Email` và `FullName`.
- **Giải pháp:**
  - Frontend: Làm sạch tiền tố `@` trước khi gửi query lên API.
  - Backend: Đã tạo tài liệu chi tiết tại `docs/BE_REQUESTS_FIXES_IAM_PROCEDURE.md` để phía Backend cập nhật LINQ `x.Username`.

---

### ✅ Mục 11 (FE-01): Chọn phường khi tạo hồ sơ & Xử lý mã lỗi nộp hồ sơ (KB-01 #6)
- **Mã BE:** `FE-01` (Ưu tiên cao - Bắt buộc hoàn tất trước kịch bản KB-06).
- **Trạng thái:** ✅ Đã hoàn thành (05/11/2026).
- **Phản ánh từ BE:** Khi test trên Azure ngày 02/11, form tạo hồ sơ chưa có ô chọn phường dẫn tới lỗi 400.
- **Hiện trạng Code FE thực tế sau khi xử lý:**
  - Trong [`CreateDossierModal.tsx`](file:///d:/frontend/src/pages/citizen/components/CreateDossierModal.tsx): Dropdown `<select id="create-ward">` lấy dữ liệu từ `GET /api/v1/wards`. Schema Zod chuẩn hóa bắt buộc: `wardCode: z.string().trim().min(1, 'Phải chọn phường/xã tiếp nhận.').max(50)`. Hỗ trợ định dạng GUID linh hoạt cho `procedureId`.
  - Trong [`CitizenPage.tsx`](file:///d:/frontend/src/pages/citizen/CitizenPage.tsx): Đã loại bỏ việc tự động gán mặc định phường đầu tiên; dropdown luôn bắt đầu ở trạng thái trống `"Chọn đơn vị tiếp nhận"` để công dân chủ động chọn đơn vị; sau khi tạo thành công reset `newWardCode` về rỗng. Body gửi lên backend luôn có `wardCode: values.wardCode`.
  - Trong [`src/lib/api/workflow.ts`](file:///d:/frontend/src/lib/api/workflow.ts): Bổ sung đầy đủ xử lý các mã lỗi trong `workflowError`:
    - `application.ward_required` (409): *"Hồ sơ cũ chưa có phường tiếp nhận; cần bổ sung trước khi nộp."*
    - `application.invalid_ward` (400): *"Phường/xã tiếp nhận không hợp lệ hoặc không tồn tại trong hệ thống."*
    - `application.iam_unavailable` (503): *"Hệ thống định danh xác thực tạm thời không phản hồi. Vui lòng thử lại sau giây lát."*
- **Kiểm thử xác minh:**
  - Bộ test lỗi mã: `tests/workflow-ward-errors.spec.ts` (3/3 passed).
  - Bộ test wizard: `tests/citizen-application-wizard.spec.ts` (3/3 passed - kiểm tra chặn submit khi chưa chọn phường, hiển thị lỗi đỏ, và gửi đúng `wardCode`).
  - Toàn bộ source code đạt chuẩn: `npm run typecheck` và `npm run lint` pass 0 lỗi.

---

### ✅ Mục 12 (FE-07): Liên kết mẫu đơn DOCX ở màn sửa thủ tục nhập tay (KB-04 #7, #12)
- **Mã BE:** `FE-07` (Ưu tiên cao).
- **Trạng thái:** ✅ Đã hoàn thành (06/11/2026).
- **Phản ánh từ BE:** Màn checklist có danh sách mẫu nhưng không lưu được liên kết do BE lưu liên kết mẫu ở `formDefinitions` (gửi qua `PUT /procedures/{id}`), không nằm trong `checklistSchema` (gửi qua `PUT .../checklist`).
- **Hiện trạng Code FE thực tế sau khi xử lý:**
  - Trong [`ProcedureFormPicker.tsx`](file:///d:/frontend/src/pages/procedure-manager/ProcedureFormPicker.tsx): Đổi nguồn dữ liệu sang API catalog chuẩn `GET /api/v1/procedure-manager/document-forms` (`procedureApi.documentForms`), lấy chính xác `{ id, formCode, formName, formType }`.
  - Khi chọn mẫu từ kho, dữ liệu được gán vào `formDefinitions`:
    ```json
    {
      "formTemplateId": "<id>",
      "formCode": "<formCode>",
      "formName": "<formName>",
      "formType": "DOCX_TEMPLATE",
      "quantity": 1,
      "isMandatory": true,
      "caseCode": null
    }
    ```
  - Khi lưu thủ tục qua `PUT /api/v1/procedure-manager/procedures/{id}`, FE gửi đầy đủ cả `checklistSchema` và `formDefinitions` hiện tại kèm `decisionNumber` và `effectiveDate` (bảo toàn toàn bộ danh mục giấy tờ và liên kết mẫu đơn).
  - Trong [`ProcedureChecklistModal.tsx`](file:///d:/frontend/src/pages/procedure-manager/ProcedureChecklistModal.tsx): Thêm banner lưu ý màu xanh da trời: *"Lưu ý phân biệt: Mục này dùng để khai báo danh mục giấy tờ đính kèm (CMND, Giấy khai sinh, v.v.). Mẫu đơn, tờ khai điện tử (DOCX) được cấu hình tại mục 'Biểu mẫu' trong màn Chỉnh sửa thủ tục."* để cán bộ không bị nhầm lẫn.
- **Kiểm thử xác minh:**
  - Viết mới bộ test E2E tại [`tests/procedure-form-linking.spec.ts`](file:///d:/frontend/tests/procedure-form-linking.spec.ts):
    1. Kiểm tra màn sửa thủ tục: tải mẫu từ `document-forms`, chọn mẫu `KB04 Tờ khai`, lưu PUT gửi đầy đủ `formDefinitions` và giữ nguyên 2 mục `checklistSchema` ban đầu $\rightarrow$ PASSED.
    2. Kiểm tra modal checklist hiển thị đúng banner phân biệt giấy tờ và biểu mẫu DOCX $\rightarrow$ PASSED.
  - Cập nhật test 12 trong [`tests/procedure-manager.spec.ts`](file:///d:/frontend/tests/procedure-manager.spec.ts) sang `**/api/v1/procedure-manager/document-forms*` $\rightarrow$ PASSED.
  - Toàn bộ source code đạt chuẩn: `npm run typecheck` và `npm run lint` pass 0 lỗi.

---

### ✅ Mục 13 (FE-05): Tự động làm mới token sau 15 phút không bị đăng xuất (KB-02 #10)
- **Mã BE:** `FE-05` (Ưu tiên cao - Đã xác minh & kiểm thử tự động).
- **Trạng thái:** ✅ Đã hoàn thành (05/11/2026).
- **Hiện trạng Code FE thực tế & Cơ chế vận hành:**
  - Cơ chế refresh token hoàn chỉnh tại [`src/lib/api/index.ts`](file:///d:/frontend/src/lib/api/index.ts) và [`src/lib/api/createJwtClient.ts`](file:///d:/frontend/src/lib/api/createJwtClient.ts).
  - Tự động bắt mã lỗi 401 khi access token (15 phút) hết hạn.
  - Sử dụng Web Locks API (`navigator.locks.request('wardmate-auth:' + baseURL)`) giúp tuần tự hóa và chống xung đột refresh token giữa nhiều tab cùng mở.
  - Gọi `POST /api/v1/auth/refresh-token` với `withCredentials: true`, `X-CSRF-Protection: 1`, nhận access token mới vào RAM và tự động phát lại (replay) request ban đầu trong suốt. Người dùng hoàn toàn không bị đẩy ra trang đăng nhập.
  - Nếu refresh token cũng hết hạn thực sự (BE trả 401 cho refresh-token): Điều hướng an toàn về `/dang-nhap?reason=session-expired&returnTo=...` kèm giải thích rõ ràng.
- **Lưu ý triển khai & Hạ tầng:**
  - Cookie `refreshToken` có thuộc tính `HttpOnly`, `Path=/api/v1/auth` và mặc định `SameSite=Strict`.
  - Trên Azure/môi trường triển khai: Đảm bảo Gateway YARP và Frontend cùng host/domain (hoặc Backend IAM đặt `RefreshCookie__SameSite=None` kèm `Secure` nếu host khác domain) để trình duyệt luôn đính kèm cookie khi gọi API refresh.
- **Kiểm thử xác minh:**
  - Viết mới test E2E tại [`tests/auth.spec.ts`](file:///d:/frontend/tests/auth.spec.ts#L273) mô phỏng chính xác kịch bản KB-02 #10: Sau khi token ban đầu hết hạn và bị 401, FE tự động gọi `refresh-token` $\rightarrow$ 200 $\rightarrow$ tự động replay request nghiệp vụ $\rightarrow$ 200 OK $\rightarrow$ người dùng tiếp tục làm việc bình thường không bị văng đăng nhập.
  - Chạy toàn bộ 9/9 ca test của `tests/auth.spec.ts` và 12/12 ca test của `tests/jwt-client.spec.ts` đều PASSED 100%.
  - `npm run typecheck` và `npm run lint` đạt 100% 0 lỗi.

---

### ✅ Mục 14 (FE-02): Khắc phục Chatbot bị hủy request `(canceled)` & Lỗi hạn mức 429 (KB-01 #8)
- **Mã BE:** `FE-02` (Ưu tiên trung bình).
- **Trạng thái:** ✅ Đã hoàn thành (06/11/2026).
- **Nguyên nhân cốt lõi phát hiện:**
  - Ô nhập và nút gửi đã có `disabled={loading}`.
  - Tuy nhiên, tại [`src/lib/api/aiOcr.ts`](file:///d:/frontend/src/lib/api/aiOcr.ts), axios đang đặt **`timeout: 35000` (35 giây)**. Khi Gemini khởi động lạnh hoặc phân tích câu hỏi phức tạp mất 40–50 giây, axios tự động hủy kết nối, gây ra trạng thái `(canceled)` trên Network tab.
  - Ngoài ra, trong [`AiChatWidget.tsx`](file:///d:/frontend/src/components/ai/AiChatWidget.tsx), điều kiện fallback cũ chứa `!authenticated || ...`, khiến mọi lỗi của khách (kể cả lỗi 429 hạn mức câu hỏi) đều bị nuốt và thay bằng cẩm nang tĩnh thay vì mời đăng nhập!
- **Giải pháp đã thực hiện:**
  1. **Nâng timeout Chatbot lên 75 giây (`timeout: 75000`):** Đảm bảo đủ thời gian chờ Gemini xử lý các câu hỏi phức tạp hoặc khởi động lạnh mà không bị trình duyệt hủy giữa chừng. Bắt lỗi `ECONNABORTED` / timeout để báo lỗi thân thiện `"Trợ lý phản hồi quá lâu. Vui lòng thử lại."`.
  2. **Tạo lớp lỗi chuyên biệt `AiChatError`:** Lưu giữ chính xác `code`, `status` và `retryAfter` trả về từ Backend AIOCR.
  3. **Khóa chặt ô nhập và nút gửi khi AI đang suy nghĩ:** Input bị vô hiệu hóa, đổi placeholder thành *"Trợ lý đang suy nghĩ và trả lời..."*, nút gửi hiển thị icon xoay loading, ngăn chặn triệt để gửi liên tiếp.
  4. **Xử lý chuyên biệt lỗi hạn mức 429:**
     - `ai.guest_quota_exceeded`: Khi khách vãng lai hỏi tới câu thứ 11 (hết 10 câu/ngày/IP), hệ thống hiển thị câu trả lời lịch sự của trợ lý và kèm theo **Khung thông báo trang nhã mời đăng nhập** (nút *Đăng nhập ngay* chuyển hướng an toàn kèm `returnTo`, link *Tạo tài khoản mới*). Thanh nhập liệu dưới cùng tự động chuyển sang thông báo hết lượt kèm nút Đăng nhập.
     - `ai.guest_limit_reached`: Hiển thị thông báo thân thiện toàn hệ thống đã hết lượt khách hôm nay và mời đăng nhập hoặc hẹn ngày mai.
     - `ai.quota_exceeded` / `ai.daily_limit_reached`: Xử lý hạn mức 30 câu/ngày của công dân đăng nhập.
     - `ai.provider_busy` / 429 quá tải: Báo người dùng chờ giây lát rồi gửi lại.
  5. **Tách biệt Fallback Offline:** Chỉ kích hoạt câu trả lời cẩm nang thủ công khi máy chủ thật sự mất mạng hoặc trả lỗi hạ tầng 503/Database unavailable; tuyệt đối không nuốt lỗi 429.
- **Kiểm thử tự động:**
  - Viết mới 2 test E2E trong [`tests/guest-chat-and-ai-fallback.spec.ts`](file:///d:/frontend/tests/guest-chat-and-ai-fallback.spec.ts):
    + Kiểm tra khách gặp 429 `ai.guest_quota_exceeded` ở câu hỏi thứ 11 $\rightarrow$ hiển thị khung mời đăng nhập trang nhã $\rightarrow$ không hiện lỗi đỏ kỹ thuật.
    + Kiểm tra ô nhập và nút gửi bị khóa hoàn toàn trong suốt quá trình trợ lý đang xử lý.
  - Toàn bộ 4/4 test trong `tests/guest-chat-and-ai-fallback.spec.ts` và 10/10 test trong `tests/public-search-chat.spec.ts` đều PASSED 100%.
  - `npm run typecheck` và `npm run lint` đạt 100% 0 lỗi.

---

### ✅ Mục 15 (FE-04): Chuẩn hóa thông báo trung tính & Hướng dẫn màn Quên mật khẩu (KB-02 #13)
- **Mã BE:** `FE-04` (Ưu tiên trung bình).
- **Trạng thái:** ✅ Đã hoàn thành (05/11/2026).
- **Phản ánh từ BE & Yêu cầu nghiệp vụ:**
  - Backend luôn trả HTTP 202 với thông báo trung tính: `"Nếu tài khoản hợp lệ, mã xác thực đã được gửi tới email đăng ký."` (chống dò quét tài khoản).
  - Frontend không được hiển thị "Đã gửi mã thành công" hoặc suy đoán email có tồn tại hay không.
- **Những phần đã hoàn thiện trong Code FE:**
  1. Trong [`PasswordRecovery.tsx`](file:///d:/frontend/src/pages/auth/PasswordRecovery.tsx):
     - Loại bỏ hoàn toàn toast thông báo mang tính suy đoán `"Đã gửi lại yêu cầu mã xác thực."` khi bấm gửi lại mã; chỉ hiển thị thông báo trung tính trả về từ BE trên banner `role="status"`.
     - Bổ sung khối lưu ý thân thiện ngay dưới ô nhập mã xác thực OTP với 4 điểm hướng dẫn chi tiết:
       + *Vui lòng kiểm tra kỹ cả hộp thư Đến và thư mục Rác (Spam).*
       + *Mã xác thực có hiệu lực trong vòng **5 phút**.*
       + *Mỗi lần gửi mã cần chờ **60 giây** trước khi yêu cầu mã mới.*
       + *Nếu nhập sai quá **5 lần**, bạn sẽ cần yêu cầu mã mới.*
     - Nút "Gửi lại mã" bị vô hiệu hóa (`disabled`) trong suốt thời gian đếm ngược 60 giây và hiển thị `Gửi lại mã sau {cooldown}s`.
- **Kiểm thử xác minh:**
  - Viết mới test E2E tại [`tests/auth-recovery.spec.ts`](file:///d:/frontend/tests/auth-recovery.spec.ts#L175): kiểm tra thông báo trung tính 202, không hiện toast thừa, khối lưu ý 4 điểm hiển thị đầy đủ, và nút gửi lại mã bị khóa trong suốt 60s.
  - Toàn bộ 7/7 ca test trong `tests/auth-recovery.spec.ts` đều PASSED 100%.
  - `npm run typecheck` và `npm run lint` đạt 100% 0 lỗi.

---

### ✅ Mục 16 (FE-09): Tạo phôi & Tải DOCX trực tiếp trên màn bản nháp AI (KB-04)
- **Mã BE:** `FE-09` (Ưu tiên trung bình).
- **Trạng thái:** ✅ Đã hoàn thành (06/11/2026).
- **Mục tiêu:** Cán bộ thẩm định bản nháp AI không cần phải chuyển sang màn hình Quản lý mẫu đơn để tạo từng phôi DOCX rồi mới quay lại liên kết.
- **Những phần đã hoàn thiện trong Code FE:**
  1. **Modal Tạo phôi & Tải DOCX trực tiếp ([`DirectTemplateUploadModal.tsx`](file:///d:/frontend/src/pages/procedure-manager/DirectTemplateUploadModal.tsx)):**
     - Cho phép cán bộ nhập/chỉnh sửa Mã biểu mẫu, Tên biểu mẫu và đính kèm trực tiếp file Word (.docx) tối đa 20 MB.
     - Quy trình gọi tuần tự: `POST /api/v1/form-templates` $\rightarrow$ `POST /api/v1/form-templates/{id}/upload-docx`.
     - Bắt và hiển thị lỗi thân thiện từ backend (409 trùng mã, lỗi file không hợp lệ, v.v.).
  2. **Tích hợp nút hành động trên thẻ biểu mẫu ([`ProcedureFormPicker.tsx`](file:///d:/frontend/src/pages/procedure-manager/ProcedureFormPicker.tsx)):**
     - Với các biểu mẫu AI bóc tách chưa có `formTemplateId`: Hiển thị nút *"Tạo phôi & tải DOCX"* (màu hổ phách) bên cạnh badge *"Chưa gắn phôi Word"*.
     - Tại vùng kho biểu mẫu: Có nút *"Tạo phôi mới"* để tạo và tải nhanh phôi DOCX bổ sung nếu cần.
  3. **Tự động lưu bản nháp ([`ProcedureDraftWorkspace.tsx`](file:///d:/frontend/src/pages/procedure-manager/ProcedureDraftWorkspace.tsx)):**
     - Khi tạo phôi thành công: Hệ thống tự động gán `formTemplateId` mới tạo vào mảng `formDefinitions` và gọi `PUT /api/v1/procedure-manager/drafts/{id}` lưu ngay vào bản nháp, hiển thị toast thành công.
  4. **Cảnh báo AIOCR chênh lệch biểu mẫu ([`ProcedureFormPicker.tsx`](file:///d:/frontend/src/pages/procedure-manager/ProcedureFormPicker.tsx)):**
     - Bắt warnings từ AIOCR (bắt đầu bằng `formDefinitions:` hoặc đề cập tệp mẫu).
     - Hiển thị khối Alert màu hổ phách nổi bật ở đầu Tab Biểu mẫu và chấm cam cảnh báo trên thanh Tab bar của `ProcedureApiEditor`.
- **Kiểm thử xác minh:**
  - Viết mới bộ test E2E tại [`tests/procedure-draft-direct-docx.spec.ts`](file:///d:/frontend/tests/procedure-draft-direct-docx.spec.ts):
    1. Kiểm tra tạo phôi & tải DOCX trực tiếp cho biểu mẫu chưa liên kết trong bản nháp AI $\rightarrow$ gọi đúng 2 API $\rightarrow$ tự động lưu bản nháp PUT với `formTemplateId` $\rightarrow$ badge "Chưa gắn phôi Word" biến mất: **PASSED**.
    2. Kiểm tra hiển thị khối cảnh báo hổ phách khi AIOCR phát hiện chênh lệch số lượng biểu mẫu trong file PDF: **PASSED**.
  - Toàn bộ source code đạt chuẩn: `npm run typecheck` và `npm run lint` pass 0 lỗi.

---

### ✅ Mục 17 (FE-03, FE-06, FE-08): Các tính năng mở rộng & Tùy chọn (Low Priority)
- **Mã BE:** `FE-03`, `FE-06`, `FE-08` (Ưu tiên thấp).
- **Trạng thái:** ✅ Đã hoàn thành (05/11/2026).
- **Chi tiết kết quả thực hiện:**
  1. **FE-03 (Xóa thông tin cá nhân):**
     - Tại [`CitizenProfileView.tsx`](file:///d:/frontend/src/pages/citizen/views/CitizenProfileView.tsx): Bổ sung nút *"Xóa thông tin cá nhân"* ở cuối phân hệ thông tin cá nhân kèm Modal Radix xác nhận xóa an toàn.
     - Khi xác nhận: Gọi `DELETE /api/v1/users/me/profile`, reset form về trạng thái chưa thiết lập hồ sơ và tự động chuyển sang form nhập mới.
     - Hàm `updateMyProfile` trong [`src/lib/api/index.ts`](file:///d:/frontend/src/lib/api/index.ts) đã sẵn sàng cơ chế tự động chuyển sang `POST /api/v1/users/me/profile` khi lưu thông tin mới cho tài khoản chưa có hồ sơ.
     - Viết mới test E2E tại [`tests/guide-profile-email.spec.ts`](file:///d:/frontend/tests/guide-profile-email.spec.ts#L60) xác minh: mở modal $\rightarrow$ bấm Hủy không xóa $\rightarrow$ bấm Xác nhận gọi DELETE thành công (4/4 tests passed).
  2. **FE-08 (Cho phép xuất bản bản nháp khi chưa gán mẫu):**
     - Tại [`ProcedureDraftWorkspace.tsx`](file:///d:/frontend/src/pages/procedure-manager/ProcedureDraftWorkspace.tsx): Cho phép xuất bản bản nháp khi `formTemplateId = null` (liên kết mẫu sau), không chặn thao tác xuất bản.
     - Bổ sung thông báo cảnh báo màu hổ phách: *"Đã xuất bản thủ tục thành công. Lưu ý: Có N biểu mẫu chưa gắn tệp phôi DOCX (có thể bổ sung sau)."* Bước xác nhận đối soát PDF (`confirmed = true`) vẫn giữ bắt buộc.
  3. **FE-06 (Các API quản trị bổ sung):**
     - Tại [`src/lib/api/index.ts`](file:///d:/frontend/src/lib/api/index.ts): Đã có sẵn và export đầy đủ: `getAccount(userId)`, `getUsers(filter)`, `getAdminProfile(userId)`, `createAdminProfile(userId, payload)`, `updateAdminProfile(userId, payload)`, `saveAdminProfile(userId, payload)`, `deleteAdminProfile(userId)`.
- **Kiểm thử xác minh:**
  - `tests/guide-profile-email.spec.ts`: 4/4 passed 100%.
  - `npm run typecheck` và `npm run lint`: 100% 0 lỗi.
