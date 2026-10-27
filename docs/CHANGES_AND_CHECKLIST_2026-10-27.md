# Những gì đã sửa và cách kiểm tra — 27/10/2026

Tài liệu dành cho người kiểm tra giao diện và người review code, mô tả đợt thay đổi bắt đầu từ FE commit `789587a` trên nhánh `main`. Đợt này được chia thành 20 commit theo yêu cầu người dùng; xem [PROGRESS.md](PROGRESS.md) để biết trạng thái Git và kiểm tra chốt đợt. Backend chỉ được đọc để đối chiếu, chưa sửa.

**Cập nhật sau audit:** theo yêu cầu mới, nút/cửa sổ AI hiện cho cả khách chưa đăng nhập. Khách bấm “Đăng nhập để trò chuyện” để dùng API đang yêu cầu JWT; người đã đăng nhập vẫn chọn phường và gửi câu hỏi. Xem mục 9 để kiểm tra thay đổi này.

Người dùng đã bổ sung ba sơ đồ luồng và Conceptual ERD, đồng thời yêu cầu dùng làm cơ sở nghiệp vụ cho các lượt rà soát tiếp. Những sửa đổi tính năng dưới đây được thực hiện trong lượt rà soát trước khi nhận sơ đồ. Lượt viết tài liệu này chưa triển khai thêm tính năng theo ERD mới.

## 1. Hồ sơ cá nhân, validation và dữ liệu nhân thân

| File đã sửa | Trước sửa | Sau sửa |
|---|---|---|
| [src/lib/profileSchema.ts](../src/lib/profileSchema.ts) | Một số tên tiếng Việt Unicode tổ hợp bị từ chối; ngày hiện tại phụ thuộc múi giờ máy; chưa có helper chung chuẩn hóa payload và đọc lỗi server có tiền tố trường | Chuẩn hóa tên NFC; so ngày sinh theo `Asia/Ho_Chi_Minh`; thêm `normalizeProfileInput` và `profileServerErrors` |
| [src/lib/api/index.ts](../src/lib/api/index.ts) | Số điện thoại có dấu phân cách có thể được validation chấp nhận nhưng gửi nguyên dấu sang BE | `updateMyProfile`, `createAdminProfile`, `updateAdminProfile` đều chuẩn hóa tên và điện thoại trước gửi; ví dụ `0912.345.678` thành `0912345678` |
| [src/pages/manager/views/ManagerProfileDetailView.tsx](../src/pages/manager/views/ManagerProfileDetailView.tsx) | Form Admin/Manager lưu mà chưa qua schema chung; có badge “Đã xác thực”, giá trị dân tộc/quốc tịch mặc định thiếu căn cứ | Dùng React Hook Form/Zod; có danh sách lỗi bấm để focus trường; chặn gửi lặp, giữ dữ liệu khi lỗi, ánh xạ lỗi server về trường; bỏ badge và giá trị nhân thân suy đoán |
| [src/pages/admin/AdminPage.tsx](../src/pages/admin/AdminPage.tsx) | Dữ liệu giới tính trống/không nhận biết bị đổi thành Nam | Giữ trống khi chưa có giới tính hợp lệ |
| [src/pages/manager/ManagerPage.tsx](../src/pages/manager/ManagerPage.tsx) | Tạo dữ liệu hiển thị/đọc lại hồ sơ có thể tự gán Nam | Giữ giới tính chưa cập nhật ở các bước tải và cập nhật hồ sơ |
| [src/pages/manager/types.ts](../src/pages/manager/types.ts) | Kiểu giới tính bắt buộc phải là một trong ba giá trị | Cho phép chuỗi rỗng để thể hiện chưa có dữ liệu |
| [src/pages/citizen/views/CitizenProfileView.tsx](../src/pages/citizen/views/CitizenProfileView.tsx) | Có thể gửi lưu lặp; lỗi server dạng `Profile.FullName` không khớp tên trường | Khóa lần gửi đang chạy; nhận diện tên trường sau tiền tố khi hiển thị lỗi |

Giữ quy tắc sản phẩm đang có: tên ít nhất hai từ/tối đa 100 ký tự, CCCD 12 chữ số, địa chỉ nếu nhập từ 5–255 ký tự, năm sinh từ 1900. Các quy tắc này chặt hơn một số giới hạn BE; chưa tự nới theo ERD.

## 2. Trợ lý AI và OCR CCCD

| File đã sửa | Trước sửa | Sau sửa |
|---|---|---|
| [src/components/ai/AiChatWidget.tsx](../src/components/ai/AiChatWidget.tsx) | Chat dùng phường ghi cứng; hội thoại có thể giữ qua đổi user; reset lúc request đang chạy có thể nhận kết quả cũ; lỗi gửi tạo câu hỏi lặp; copy thất bại vẫn có thể báo thành công; cửa sổ/nút mở chiếm chỗ trên mobile | Chọn phường từ API; widget theo user đã xác thực; hủy request khi reset/unmount; giữ câu hỏi trong ô nhập khi lỗi và bỏ lượt gửi lỗi khỏi log; xử lý clipboard theo kết quả thật; sửa bố cục 320px, nhãn truy cập, Escape trả focus, thu gọn nút mở trên mobile |
| [src/lib/api/aiOcr.ts](../src/lib/api/aiOcr.ts) | Chat có fallback `WARD_001`; chưa kiểm tra đầy đủ input tại client | Phường bắt buộc; câu hỏi sau trim dài 1–4.000 ký tự; conversationId nếu có phải là UUID hợp lệ, khác GUID rỗng; lỗi 429/mạng/5xx có thông báo tiếng Việt |
| [src/pages/officer/OfficerReviewWorkspaceView.tsx](../src/pages/officer/OfficerReviewWorkspaceView.tsx) | Gợi ý lý do bổ sung dùng `WARD_001` khi hồ sơ thiếu phường | Chỉ dùng phường từ hồ sơ; thiếu phường thì báo và yêu cầu nhập lý do thủ công |
| [src/components/citizen/CccdOcrScanModal.tsx](../src/components/citizen/CccdOcrScanModal.tsx) | Chọn ảnh sai có thể giữ lựa chọn/kết quả cũ; nhận tệp rỗng; request cũ có thể trả kết quả sau khi đóng modal; nhập tay mặc định Nam | Xóa lựa chọn/kết quả cũ trước kiểm tra; chặn tệp rỗng; cho chọn lại cùng tệp; hủy request khi đóng/thay ảnh/unmount; chặn gửi lặp; thêm nhãn mặt trước/sau; giới tính nhập tay có lựa chọn chưa cập nhật |

## 3. Hồ sơ tiền kiểm, quyết định cán bộ và QR

| File đã sửa | Trước sửa | Sau sửa |
|---|---|---|
| [src/lib/api/workflow.ts](../src/lib/api/workflow.ts) | `confirm-readiness` 404 dẫn tới POST `/approve` cũ; chi tiết công dân chưa kiểm tra ID response | Bỏ fallback quyết định; từ chối response chi tiết có ID khác hồ sơ đang mở |
| [src/lib/api/documentForms.ts](../src/lib/api/documentForms.ts) | Quyết định theo submission cũng fallback `/approve` khi 404 | Chỉ gọi `confirm-readiness`; trả lỗi để UI xử lý, không gửi quyết định khác |
| [src/lib/api/workflowAdapters.ts](../src/lib/api/workflowAdapters.ts) | Trạng thái lạ thành bản nháp ở công dân hoặc chờ tiền kiểm ở cán bộ | Giữ trạng thái chưa xác định; không coi là hồ sơ có thể sửa/nhận xử lý; không gắn quá hạn từ trạng thái không biết |
| [src/types/officer.ts](../src/types/officer.ts) | Kiểu trạng thái chưa có giá trị cho dữ liệu chưa biết | Thêm `UNKNOWN` |
| [src/pages/citizen/types.ts](../src/pages/citizen/types.ts) | Kiểu trạng thái chưa thể hiện dữ liệu chưa biết | Thêm “Chưa xác định trạng thái” |
| [src/pages/officer/OfficerApplicationListView.tsx](../src/pages/officer/OfficerApplicationListView.tsx) | Badge trạng thái không nhận biết bị để trống | Hiển thị “Chưa xác định trạng thái” |
| [src/pages/citizen/components/DossierChecklistView.tsx](../src/pages/citizen/components/DossierChecklistView.tsx) | Một số lỗi upload/response hiện nguyên thông báo Zod kỹ thuật | Dùng `documentFormError` để thông báo phù hợp cho người dùng |
| [src/pages/citizen/views/CitizenQrCodeView.tsx](../src/pages/citizen/views/CitizenQrCodeView.tsx) | Thiếu QR backend thì tạo QR qua qrserver.com với link danh sách tự chế; thời gian cấp mã có thể lấy từ thời gian hồ sơ | Chỉ hiển thị/tải blob QR từ backend; link tra cứu lấy từ metadata backend đã kiểm tra; có loading/lỗi/tải lại/mở chi tiết; thiếu thời gian cấp mã thì báo chưa có thông tin; hướng dẫn tạo PDF khi giấy tờ sẵn sàng |

QR hiển thị được từ backend chưa đồng nghĩa đã nghiệm thu camera/quét QR tại quầy hoặc tiếp nhận chính thức. Các bước đó cần tiếp tục đối chiếu theo sơ đồ mới.

## 4. Trang thủ tục và lỗi tải dữ liệu

| File đã sửa | Trước sửa | Sau sửa |
|---|---|---|
| [src/pages/public/ProcedureDetailPage.tsx](../src/pages/public/ProcedureDetailPage.tsx) | Sidebar dùng tên thủ tục/cơ quan mẫu khi API rỗng; nhãn “Tìm kiếm nhiều nhất” chưa có dữ liệu xếp hạng | Bỏ dữ liệu mẫu; đổi thành “Thủ tục khác”, loại thủ tục đang xem; có loading/lỗi/thử lại/rỗng |
| [src/pages/procedure-manager/ProcedureManagerPage.tsx](../src/pages/procedure-manager/ProcedureManagerPage.tsx) | Lỗi tải danh mục có thể hiện như bảng rỗng | Hiển thị lỗi và nút thử lại |

## 5. Test, cấu hình và tài liệu đã thay đổi

| File | Nội dung |
|---|---|
| [tests/full-audit.spec.ts](../tests/full-audit.spec.ts) — mới | 9 test: Unicode/điện thoại; trạng thái lạ; validation chat; chat mobile/phường/lỗi/clipboard/chống lặp; danh sách thủ tục rỗng; 2 ca quyết định 404 không gọi approve; validation Admin; OCR file sai/hủy request |
| [tests/fixtures/documentWorkflow.ts](../tests/fixtures/documentWorkflow.ts) | Mock trả đúng DTO khi upload qua `/upload-filled-docx` |
| [tests/document-workflow.spec.ts](../tests/document-workflow.spec.ts) | Assertion dùng endpoint upload hiện tại và thông báo nhận xét tiếng Việt |
| [tests/document-lifecycle.spec.ts](../tests/document-lifecycle.spec.ts) | Hồ sơ gửi lại đã có cán bộ phụ trách dùng thao tác “Review lại” |
| [tests/docx-online.spec.ts](../tests/docx-online.spec.ts) | Mock lỗi lưu/capture request theo `/upload-filled-docx`, giữ hỗ trợ `/draft` ở fixture liên quan |
| [tests/landing.spec.ts](../tests/landing.spec.ts), [tests/officer.spec.ts](../tests/officer.spec.ts) | Kiểm tra menu mobile bằng Radix Dialog đang dùng trong UI |
| [tests/auth.spec.ts](../tests/auth.spec.ts) | Fixture auth nhận biết request negotiate phát sinh từ hộp thư công dân mới; mô phỏng hub không khả dụng bằng 503, giữ nguyên kiểm tra cookie/refresh/token |
| [eslint.config.js](../eslint.config.js) | Bỏ qua `test-results` và `playwright-report` sinh tự động |
| [FULL_AUDIT_2026-10-27.md](FULL_AUDIT_2026-10-27.md) — mới | Kết quả rà soát API, góp ý theo actor, main flow, ưu tiên/phụ thuộc và giới hạn kiểm thử |
| [API_UI_ENDPOINTS_2026-10-27.md](API_UI_ENDPOINTS_2026-10-27.md) — mới | 148 HTTP operations của 5 Swagger; có phân loại đã nối/chưa dùng/nội bộ/ngoài phạm vi, kèm phần AI đối chiếu source |
| [PROGRESS.md](PROGRESS.md) | Trạng thái bàn giao, kết quả kiểm tra và phần chưa làm |
| Tài liệu này — mới | Danh sách file đã sửa và checklist kiểm tra; ghi nhận sơ đồ/ERD làm cơ sở nghiệp vụ tiếp theo |

Không thay dependency/phiên bản trong `package.json` hay `package-lock.json`. Đã khôi phục các package thiếu trong `node_modules` theo lockfile có sẵn. Hai file cấu hình môi trường đã có đủ URL người dùng cung cấp; không phải thay đổi mới trong lượt audit.

## 6. Checklist để kiểm tra trên giao diện

Các ca hợp lệ có thể tạo/cập nhật dữ liệu: dùng tài khoản và hồ sơ thử. Ca lỗi hợp đồng API nên dùng mock/Playwright, không cần sửa dữ liệu thật để tạo lỗi.

| Mã | Vào đâu / thao tác | Kết quả cần thấy |
|---|---|---|
| KT-01 | `/admin` → Người dùng hệ thống → Xem chi tiết → Chỉnh sửa hồ sơ. Xóa tên rồi lưu; thử CCCD thiếu số, điện thoại sai, ngày sinh ngày mai | Báo lỗi; không gửi lưu dữ liệu sai; bấm lỗi quay focus về đúng trường; nội dung đã nhập được giữ |
| KT-02 | `/manager` → mở chi tiết nhân sự có quyền sửa → thử các dữ liệu sai như KT-01 | Form dùng cùng validation; không lưu dữ liệu sai |
| KT-03 | Hồ sơ cá nhân hoặc Admin/Manager sửa hồ sơ thử: tên tiếng Việt có dấu, điện thoại `0912.345.678` | Tên hợp lệ được chấp nhận; trong Network request điện thoại là `0912345678`. Unicode tổ hợp có ca test tự động riêng |
| KT-04 | Mở hồ sơ người dùng thử chưa có giới tính/dân tộc/quốc tịch; mở chế độ sửa | Không tự điền Nam/Kinh/Việt Nam; không có badge “Đã xác thực” thiếu bằng chứng |
| KT-05 | `/citizen?section=profile` → Quét CCCD (AI OCR). Chọn ảnh rỗng; chọn ảnh hợp lệ rồi chọn PDF sai định dạng | Có lỗi; file sai không giữ ảnh/kết quả trước; nút quét không dùng được khi thiếu ảnh mặt trước hợp lệ |
| KT-06 | OCR với mạng chậm: bắt đầu quét, đóng rồi mở lại | Kết quả request cũ không xuất hiện trong lần mở mới. Test mock đã bao phủ tình huống này |
| KT-07 | Sau đăng nhập, mở trợ lý AI; nhập câu hỏi khi chưa chọn phường; sau đó chọn phường từ danh sách | Chưa chọn phường thì không gửi được; request sau chọn dùng đúng `wardCode`, không tự dùng `WARD_001` |
| KT-08 | Chat mô phỏng 503 rồi thử lại; chặn quyền clipboard; làm mới hội thoại khi request chậm | Giữ câu hỏi để thử lại, không lặp câu hỏi trong log; copy lỗi không báo thành công; câu trả lời cũ không chen vào hội thoại mới |
| KT-09 | Thu viewport còn 320px, mở/đóng chat bằng Escape; mở menu mobile ở từng workspace | Không tràn ngang; nút chat thu gọn; Escape trả focus; menu giữ focus bên trong khi mở |
| KT-10 | `/citizen?section=qr_code` với hồ sơ giấy tờ sẵn sàng nhưng backend chưa có QR; sau đó mở hồ sơ thử và tạo PDF theo luồng hiện tại | Trước khi có QR: hiện lỗi/hướng dẫn và tải lại, không tự tạo QR ngoài. Khi backend đã cấp: tải được ảnh backend; Network không gọi qrserver.com |
| KT-11 | Cán bộ xác nhận giấy tờ sẵn sàng, mô phỏng endpoint trả 404 bằng test | Không phát sinh POST `/approve` ở cả nhánh Workflow và DocumentForm |
| KT-12 | API mock trả trạng thái hồ sơ chưa biết hoặc ID chi tiết khác ID yêu cầu | Trạng thái chưa biết không thành bản nháp/chờ nhận; response chi tiết sai ID bị từ chối |
| KT-13 | `/thu-tuc/{id}` khi danh sách thủ tục khác rỗng/lỗi | Có empty/error/retry; không hiện thủ tục/cơ quan mẫu hoặc nhãn “Tìm kiếm nhiều nhất” |
| KT-14 | Workspace Quản lý thủ tục → Danh mục; mô phỏng tải lỗi rồi thử lại | Hiển thị lỗi có thử lại, không hiểu nhầm là chưa có danh mục |

## 7. Kết quả kiểm thử đã chạy ở lượt sửa trước

| Kiểm tra | Kết quả và giới hạn |
|---|---|
| `npm run typecheck`, `npm run lint`, `npm run build` | Đạt. Build còn cảnh báo kích thước chunk DOCX và annotation Zod |
| Toàn bộ Playwright, 2 workers | 236/237 đạt; một test quên mật khẩu timeout khi nút bị tháo khỏi DOM/trang điều hướng lại |
| Kiểm tra lại sau chỉnh cuối chat: `full-audit`, `ui-audit`, `citizen-dossier-ui`, `auth-recovery`, 1 worker | 22/22 đạt, gồm test quên mật khẩu timeout trước đó. Chưa chạy lại toàn bộ 237 test sau hai chỉnh cuối chat |
| `node tests/api-proxy-check.mjs` | 23/23 tuyến proxy local đạt |
| Azure | Đọc 5 Swagger và GET không đăng nhập; chưa nghiệm thu có đăng nhập hoặc ghi dữ liệu thật |

Các test Playwright dùng mock. Trong lượt viết tài liệu này chỉ kiểm tra nội dung, đường dẫn và diff; không chạy lại các lệnh ở bảng trên và không coi kết quả cũ là vừa chạy.

## 8. Đối chiếu tiếp theo theo ba luồng và ERD mới

Nguồn: ba ảnh Main Flow/Main Flow 2/Flow 3 trong hội thoại ngày 27/10/2026 và [Conceptual ERD](<e:/FileSubject/Part 9/WardMate_ERD-Conceptual ERD.drawio.png>). ERD ghi 33 thực thể nghiệp vụ, 45 quan hệ; không mô tả đầy đủ thuộc tính, khóa hay hợp đồng API. Cần đối chiếu từng quan hệ với source/API trước khi kết luận đã hỗ trợ.

| Nội dung nghiệp vụ cần đối chiếu | Trạng thái sau lượt sửa đã thực hiện |
|---|---|
| Main Flow: Check Eligibility → View Process Flow → Select Application | Chưa xây thêm màn/logic kiểm tra điều kiện và trình bày quy trình trong lượt này; cần xác định dữ liệu điều kiện, đối tượng, thẩm quyền và trường hợp từ Catalog/BE |
| Main Flow: Document Checklist Verification và Validation Application | Có luồng checklist/validation hiện hữu và đã sửa một số lỗi; chưa xác nhận mọi quy tắc nghiệp vụ trong sơ đồ đều có implementation |
| Main Flow 2: Review → Revision → Notification → Resubmit | Các luồng hiện hữu có test mock; chưa nghiệm thu xuyên actor với thông báo thật. Nhận xét Word cần phân biệt với yêu cầu bổ sung của hồ sơ |
| Main Flow 2: Confirm Readiness → Stamp QR → Scan QR at Counter | Đã sửa quyết định và hiển thị QR backend. Chưa triển khai màn camera/quét tại quầy hoặc xác nhận tiếp nhận chính thức từ việc bổ sung sơ đồ |
| Flow 3: PDF → trích xuất → AI tạo nháp/cảnh báo → người kiểm tra → liên kết DOCX → xuất bản → lịch sử | Có code/API cho các phần của luồng theo audit trước; chưa rà lại toàn bộ điều kiện bắt buộc/liên kết mẫu/thứ tự xuất bản dựa trên sơ đồ mới |
| User/Role/Permission, Ward, Front Desk Officer và Procedure Category | Dùng mô hình người dùng có thể nhiều vai trò, phạm vi phường và lĩnh vực để đối chiếu quyền thực tế; chưa xác nhận toàn bộ cardinality ERD khớp DB |
| Procedure Version, Application Version, Form Template Version | Phải kiểm tra độc lập ba loại phiên bản. Audit trước chưa tìm thấy API quản lý phiên bản phôi riêng; thực thể trong ERD chưa chứng minh API đó có sẵn |
| Application Form Data, Form Submission, Checklist Item, Supporting Document, Review Comment | Tiếp tục kiểm tra liên kết bản khai/giấy tờ/nhận xét về đúng hồ sơ và phiên bản; chưa tuyên bố mọi ràng buộc ERD đã được thực thi |
| Approved QR, Generated Document, Status Change, Assignment Record | Cần kiểm tra liên kết QR/PDF, version, lịch sử trạng thái/phân công và quyền tra cứu QR công khai với source/DB thực tế |
| Knowledge Document/Chunk, Chat Session/Message | Chưa nối UI lịch sử chat, Knowledge/RAG và AI xác minh tài liệu; ERD xác nhận đây là nội dung nghiệp vụ cần tiếp tục rà soát |
| Performance Statistic, Citizen Feedback, Notification | Có tích hợp một số luồng theo audit; dashboard ca trực và một số màn vận hành còn thiếu API/UI; worker và realtime cần nghiệm thu thật |

Đây là danh sách cần đối chiếu tiếp, chưa phải kết quả kiểm chứng đầy đủ ERD. Báo cáo API chi tiết: [API_UI_ENDPOINTS_2026-10-27.md](API_UI_ENDPOINTS_2026-10-27.md). Báo cáo actor/main flow trước khi nhận sơ đồ: [FULL_AUDIT_2026-10-27.md](FULL_AUDIT_2026-10-27.md).

## 9. Bổ sung: hiển thị chat khi chưa đăng nhập

- File tính năng: [AiChatWidget.tsx](../src/components/ai/AiChatWidget.tsx). Hiện nút/cửa sổ cho guest; có CTA đăng nhập giữ trang quay lại; focus vào CTA khi mở và Escape trả focus về nút mở. Khách không gọi API chat hoặc danh sách phường. Hội thoại vẫn tách theo danh tính.
- Hợp đồng đã đọc lại: `AssistantController.cs` ở BE có `[Authorize]`, completions lấy user từ JWT. Muốn khách gửi câu hỏi trực tiếp cần thay đổi hợp đồng BE; lượt này chỉ đáp ứng yêu cầu hiển thị.
- Kiểm tra: mở trang chủ bằng cửa sổ chưa đăng nhập → thấy nút Trợ lý → mở cửa sổ → thấy lời chào và “Đăng nhập để trò chuyện” → Escape đóng → mở lại, bấm đăng nhập → URL có `returnTo`. Sau đăng nhập, chọn phường và gửi như luồng hiện có.
- [full-audit.spec.ts](../tests/full-audit.spec.ts) bổ sung test guest, hiện có 10 test. Kiểm tra lại **10/10 đạt**, typecheck/lint/build đạt; build còn cảnh báo đã biết. Test dùng mock, chưa xác minh Azure có đăng nhập.

## 10. Bổ sung: sửa thanh điều hướng che chat

- File sửa: [MainLayout.tsx](../src/components/layout/MainLayout.tsx). Header công khai đổi `z-50` thành `z-30` để nằm dưới chat `z-40`. Menu mobile và modal vẫn phủ trên chat theo lớp hiển thị hiện có.
- Kiểm tra bằng cửa sổ thấp hoặc zoom trình duyệt: mở trang chủ, cuộn trang, mở chat → thấy đầy đủ tiêu đề và nút đóng; bấm đóng hoạt động. Trên mobile mở menu khi chat đang mở → menu phủ trên chat, Escape đóng menu rồi đóng chat được.
- Thêm 2 test cho khách/người đã đăng nhập trong [full-audit.spec.ts](../tests/full-audit.spec.ts), hiện có 12 test. Mỗi test kiểm tra 1440×600, 1024×500 và 320×640 bằng `elementFromPoint` tại nút đóng để phát hiện phần tử bị header che. Có ảnh `test-results/chat-layer-*.png` (Git ignore).
- Kết quả: `full-audit` + `landing` **24/24 đạt** bằng mock; typecheck/lint/build và `git diff --check` đạt. Đã xem ảnh sau sửa ở desktop/mobile; build còn cảnh báo đã biết.

## 11. Bổ sung: UI hộp thư thông báo công dân

- [CitizenNotificationsView.tsx](../src/pages/citizen/views/CitizenNotificationsView.tsx): thay thanh tiêu đề đơn lẻ bằng hộp thư có header/mô tả, bộ lọc Tất cả/Chưa đọc, danh sách và trạng thái loading/empty/offline/lỗi thao tác. Có đánh dấu đọc từng mục/tất cả và mở hồ sơ; bố cục vừa 320px.
- [CitizenPage.tsx](../src/pages/citizen/CitizenPage.tsx): thay mảng rỗng cục bộ bằng `useNotificationHub`; số chưa đọc trên chuông lấy từ máy chủ; mở hồ sơ bằng applicationId qua Workflow. Dropdown chuông thông báo công khai không thuộc lượt sửa này.
- [useNotificationHub.ts](../src/hooks/useNotificationHub.ts): chỉ kết nối xong sau khi đọc danh sách thành công; retry tải danh sách không gọi start lần nữa trên socket đang connected; đọc lại số chưa đọc sau đánh dấu; báo lỗi thay vì coi offline là thao tác thành công.
- Cách kiểm tra: vào `/citizen?section=notifications`. Khi có dữ liệu, thử lọc, đánh dấu từng mục/tất cả và mở hồ sơ. Khi rỗng phải có “Bạn chưa có thông báo”; khi chưa tải được phải có trạng thái kết nối/lỗi thay vì khẳng định không có thông báo. Thu màn hình còn 320px để kiểm tra các nút xuống dòng. Khi đánh dấu lỗi, thông báo vẫn chưa đọc và có thể thử lại.
- API dùng GetNotifications/GetUnreadCount/MarkRead theo hub đã có, không thêm endpoint. Đọc tất cả chỉ áp dụng các mục đã tải; không tạo thao tác xóa chưa có hợp đồng. Kiểm thử SignalR bằng mock tại [citizen-notifications.spec.ts](../tests/citizen-notifications.spec.ts); chưa nghiệm thu Azure có đăng nhập.
- Kết quả lượt cuối: nhóm notification và `ui-audit` **16/16 đạt**, typecheck/lint/build và `git diff --check` đạt. Ảnh đã xem: `test-results/citizen-notifications-empty.png`, `citizen-notifications-1440.png`, `citizen-notifications-320.png` (Git ignore; bị ghi lại khi chạy test).

## 12. Kiểm tra chốt trước push

- Typecheck/lint/build đạt; proxy local 23/23 đạt. Build còn cảnh báo đã biết.
- Toàn bộ Playwright: 243/244 đạt, một lỗi fixture auth chưa biết request hub mới. Sau cập nhật fixture, chạy lại toàn bộ auth: 8/8 đạt. Chưa chạy lại toàn bộ 244 ca sau sửa fixture; source sản phẩm không đổi.
- Đây là kiểm thử mock, chưa phải nghiệm thu Azure có xác thực. 20 commit là cách nhóm thay đổi để review, không có nghĩa từng commit đã được kiểm thử độc lập.
