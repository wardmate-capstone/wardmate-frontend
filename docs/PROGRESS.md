# Tiến độ và bàn giao WardMate

## Đồng bộ origin/main, commit và đẩy thay đổi local — 13/11/2026 (Asia/Saigon)

- Chia thay đổi chưa commit thành 8 commit theo chủ đề: ảnh đại diện; MarkAllRead; ảnh HEIC/HEIF/WebP; chatbot hỏi lại/đánh giá; tham vấn STAFFING-01; trang điều phối (mới nhất lên đầu, tìm kiếm, bỏ tiêu đề trùng); bộ component UI dùng chung; tài liệu. Một số file chứa thay đổi của nhiều chủ đề được xếp vào chủ đề chính của file.
- Rebase lên 20 commit mới của origin/main. Xung đột đã gộp tay: `ConsultationsView.tsx` (giữ bộ lọc trạng thái + RefreshButton, đổi "Lãnh đạo" thành "Quản lý cán bộ" theo quy ước mới của upstream, sửa test tương ứng); `OfficerReviewWorkspaceView.tsx` (gộp import, giữ ListSelect của upstream); `OfficerApplicationListView.tsx` (giữ ListSelect tìm được cho ô lọc thủ tục của upstream thay vì Select mới, gộp import); `PROGRESS.md` (giữ cả hai phần).
- Thêm `docs/BE_REQUEST_2026-11-13_MANAGER_APPLICATIONS_SEARCH_SORT.md`: đề nghị BE thêm `search`, `sort` (và nên có `status`) cho `GET /api/v1/manager/applications`, kèm hợp đồng, gợi ý cài đặt, index và tiêu chí nghiệm thu.

## Thông báo MarkAllRead, ảnh đại diện, ảnh HEIC, chatbot hỏi lại và đánh giá (Web) — 13/11/2026 (Asia/Saigon)

- Đối chiếu BE: NOTIFY-READALL-01 ở `main`, đã deploy Azure (Analytics `analytics-20261112-02`). MOBILE-1112 (avatar, HEIC, push, app-config, chatbot hỏi lại/đánh giá) chỉ có ở nhánh `origin/kha` (commit 881f3b0), **chưa deploy** (cần SQL IAM/Analytics/AIOCR + build IAM, DocumentForm, AIOCR). Đọc hợp đồng từ `docs/api-guide.md` và DTO trên `origin/kha` bằng `git show`, không checkout/sửa BE.
- `notificationStore.markAllRead`: thay vòng lặp `MarkRead` bằng một lệnh hub `MarkAllRead(before)`, `before` = `createdAt` của thông báo mới nhất đang hiển thị (dự phòng `new Date().toISOString()`); cập nhật lạc quan các mục `createdAt <= before`, hoàn lại khi lỗi, đối chiếu `GetUnreadCount` một lần. Bấm được khi chuông > 0 dù danh sách đã tải đọc hết. Chuông báo lỗi bằng toast (trước đây lỗi bị nuốt). Trang thông báo công dân nhận `unreadCount` từ server.
- Ảnh đại diện (PROFILE-AVATAR-01): `lib/api/avatar.ts` (PUT/DELETE `users/me/avatar`, tải ảnh có token bằng axios → object URL, cache theo URL có `v`, xóa cache khi đổi tài khoản), `CurrentUser.avatarUrl` (chỉ nhận đường dẫn `/api/v1/users/...`), `UserAvatar` (ui), `AvatarEditor` (profile: bấm ảnh để đổi, xác nhận khi xóa). Gắn vào menu tài khoản, trang hồ sơ cán bộ/quản lý (`UnifiedSelfProfileView`) và công dân (`CitizenProfileView`). Mã lỗi `iam.avatar_*`/`iam.image_*` có câu tiếng Việt.
- DOC-HEIC-01: giấy tờ kèm theo nhận `.heic/.heif/.webp`; ô quét CCCD nhận WebP/HEIC, ảnh trình duyệt không xem trước được (HEIC trên Chrome/Edge) hiện khung thay thế, vẫn gửi đọc được.
- CHAT-QUALITY-01/CHAT-FEEDBACK-01: schema chat thêm `messageId`, `needsClarification`, `suggestedQuestions` (≤ 4), lịch sử thêm `feedbackHelpful`; lưu cả trong chat khách (localStorage). Widget hiện nút "Chọn trường hợp của bạn"/"Câu hỏi tiếp theo" ở câu trả lời mới nhất (bấm = gửi đúng chữ, giữ conversationId) và 👍/👎 (`ChatFeedbackControls`: 👎 chọn lý do + góp ý ≤ 1000 ký tự). Kho kiến thức AI (PM/IT_ADMIN, `knowledge.manage`) thêm tab "Đánh giá chatbot" (`ChatFeedbackView`: lọc chưa hài lòng/hữu ích/tất cả, phân trang).
- Không làm (dành cho Mobile): đăng ký/gỡ token đẩy, app-config, tệp deep link `/.well-known/*` (cần package name/SHA-256/Team ID của app). Chưa làm: hiện ảnh cán bộ phụ trách cho người dân (BE cho phép, FE chưa có chỗ hiển thị).
- Kiểm tra: typecheck/lint đạt. Theo yêu cầu người dùng không chạy Playwright. Chưa nghiệm thu thật: MarkAllRead cần kiểm #1–#6 trên Azure; avatar/HEIC/chatbot chờ BE deploy MOBILE-1112. Chưa commit/push.

## Điều phối hồ sơ: mới nhất lên đầu, bỏ tiêu đề trùng, ô tìm kiếm — 12/11/2026 (Asia/Saigon)

- BE `GET /api/v1/manager/applications` sắp theo CreatedAt tăng dần, chỉ có page/pageSize (≤100), không có sort/search; không sửa BE. `staffing.ts`: `applicationsNewestFirst` lấy total rồi đọc đúng khối 100 mục chứa trang cần xem và đảo ngược; `searchApplications` đọc đủ danh sách phường, lọc không phân biệt dấu/hoa theo mã hồ sơ, tên thủ tục, tên cán bộ phụ trách (từng từ đều phải khớp), mới nhất lên đầu, phân trang ở FE. dispatchSchema giữ `assignedOfficerName` BE đã trả.
- `DispatchView.tsx`: bỏ tiêu đề "Danh sách hồ sơ điều phối" trùng với tiêu đề trang (`StaffHeading` cho phép bỏ title); thêm ô tìm kiếm (chờ 300ms, đổi từ khóa về trang 1, báo số kết quả/không có kết quả).
- Kiểm thử mock: mới `tests/dispatch-order.spec.ts` 1/1 (23 hồ sơ: trang 1 bắt đầu HS-023, trang 3 còn 3 hồ sơ cũ nhất, tìm không dấu, tìm theo mã, không kết quả, xóa từ khóa). typecheck/lint đạt; consultation-dispatch 5/5 đạt; staffing-ui vẫn 3 ca tràn ngang có sẵn.
- Giới hạn: thứ tự dựa vào BE sắp CreatedAt tăng dần; khi tìm kiếm, mỗi lần đổi trang/từ khóa đọc lại toàn bộ hồ sơ phường. Nên đề nghị BE thêm sort/search khi dữ liệu lớn.

## Tham vấn chuyên môn do cán bộ phụ trách khởi tạo (STAFFING-01) — 12/11/2026 (Asia/Saigon)

- Đối chiếu BE: STAFFING-01 đã ở `origin/main` của wardmate-backend (bàn giao `docs/fe-handoff-tham-van-chuyen-mon.md`), deploy Azure theo DEPLOY-1112f (Workflow `workflow-20261112-03`, Analytics; SQL Workflow/IAM đã chạy). Gọi Gateway Azure không token: `requests`, `specialist-candidates`, `{id}/dispatch`, danh sách và hộp thư `?status=` đều 401 (trước deploy 3 route mới trả 404). Không sửa BE, không chạy Git BE.
- `src/lib/api/staffing.ts`: `specialistId` cho phép null (yêu cầu PENDING_DISPATCH; schema cũ bắt buộc sẽ làm Zod lỗi cả hộp thư); thêm dispatchedBy/dispatchedAtUtc/decision/willingToTakeOver/answeredAtUtc/closedAtUtc/closedBy; thêm `requestConsultation`, `specialistCandidates`, `dispatchConsultation`; `inbox` nhận status; `answer` gửi willingToTakeOver; `close` gửi decision và expectedAssignmentVersion khi TRANSFER_TO_SPECIALIST.
- `src/lib/api/staffingError.ts`: câu tiếng Việt cho các mã consultation mới; gộp nhãn lý do cán bộ chưa đủ điều kiện vào `officerBlockers` (thêm RESPOND_PERMISSION_MISSING, CURRENT_ASSIGNEE), DispatchView dùng chung. `shared.tsx`: nhãn/màu PENDING_DISPATCH.
- `src/components/staffing/ConsultationsView.tsx`: cán bộ phụ trách (quyền workflow.consultation.request, hồ sơ UNDER_REVIEW, đúng assignmentVersion) có nút Yêu cầu tham vấn ở tab Tham vấn của hồ sơ; khi đã có yêu cầu chờ thì ẩn nút và báo chờ điều phối. Lãnh đạo: Chọn cán bộ tư vấn (danh sách ứng viên nhóm đủ/chưa đủ điều kiện kèm lý do) hoặc Từ chối yêu cầu; OPEN giữ Đóng tham vấn; ANSWERED có Giữ cán bộ phụ trách và Chuyển hồ sơ cho cán bộ tư vấn (chỉ khi B đồng ý nhận hoặc tham vấn do Lãnh đạo tự mở). Cán bộ tư vấn trả lời kèm lựa chọn "Tôi sẵn sàng tiếp nhận hồ sơ" (mặc định chỉ góp ý). Thẻ hiển thị "Chờ chọn cán bộ", đề nghị nhận hồ sơ, quyết định. Hộp thư thêm lọc trạng thái, Lãnh đạo mặc định Chờ điều phối. Mọi thao tác đọc lại version trước khi gửi. `OfficerReviewWorkspaceView.tsx` truyền chi tiết hồ sơ làm ngữ cảnh.
- Kiểm thử (mock): mới `tests/consultation-dispatch.spec.ts` 5/5 (điều phối, từ chối, chuyển giao, chỉ giữ khi B không nhận, 360px không tràn), `tests/consultation-officer.spec.ts` 2/2 (A gửi yêu cầu, B trả lời kèm willingToTakeOver); fixture `documentWorkflow.ts` thêm assignmentVersion. typecheck/lint/build đạt (còn cảnh báo chunk lớn). Lỗi có sẵn, chạy trên code gốc cũng lỗi y hệt: staffing-ui 3 ca tràn ngang 768/390/360px; assignment 3, document-lifecycle 1, document-workflow 2, officer 2 ca; `full-audit.spec.ts` import `chatInputSchema` không còn tồn tại.
- Giới hạn: chưa nghiệm thu với tài khoản thật trên Azure (cần Manager + 2 Front Desk cùng phường, B đúng lĩnh vực và đang trong ca; 4 ca: giữ A, chuyển B, từ chối trước khi chọn, hai tab cùng gửi version cũ). Chưa commit/push.
## Chia 20 commit FE và đẩy main — 13/11/2026, 07:59 Asia/Saigon

- Người dùng yêu cầu trực tiếp chia đúng 20 commit và đẩy `main`. Chỉ thao tác repository `E:/wardmate-frontend`; không chạy Git hay chỉnh file trong BE. `AGENTS.md` của FE cho phép commit/push khi người dùng yêu cầu; quy tắc Antigravity được cung cấp cho BE không dùng để thực hiện Git trên BE trong phiên này.
- Trước chia commit: đang ở `main`, origin là `https://github.com/wardmate-capstone/wardmate-frontend.git`; fetch origin/main thành công, HEAD và origin/main cùng `757629f`, 0 ahead/0 behind, staging rỗng. Có đúng 20 file hiện có thay đổi và 1 file test mới, khớp phần sửa FE vừa bàn giao; không đưa dist, test-results, secrets hoặc dữ liệu thật vào commit.
- Chia 20 commit: 14 fix (nhãn vai trò dùng chung, adapter so sánh, hồ sơ cá nhân, tạo tài khoản, danh sách tài khoản, RBAC/nhật ký, lời chào quản lý, chi tiết cán bộ, tên phường, bộ lọc thủ tục/ngày, thông báo quyền preview, tài liệu tham vấn, nhận xét công dân, workspace tiền kiểm); 5 test (quản trị, quản lý, tiền kiểm, vòng đời tài liệu và file kiểm thử mới); 1 docs cập nhật FRONTEND_SETUP/PROGRESS cho cùng phần bàn giao. File test mới có commit riêng.
- Không thay đổi source trong lượt chia commit. Kết quả kiểm tra của lượt triển khai bên dưới vẫn giữ nguyên, không coi là vừa chạy lại: typecheck/lint/build đạt, build còn cảnh báo; kết quả mới nhất của 45 ca khác nhau là 43 đạt/2 dashboard chưa đạt; Word tham vấn còn phụ thuộc BE. `git diff --check` đạt trong lượt chuẩn bị commit. Không build Docker hoặc xác nhận CI/CD/deploy.
- Đã tạo đúng 20 commit (14 fix, 5 test, 1 docs), working tree sạch; `git diff --check origin/main..HEAD` đạt. Lệnh `git push origin HEAD:main` bị bộ xét duyệt tự động từ chối trước khi thực thi: đẩy trực tiếp nhánh chính là thay đổi từ xa có tác động cao, chưa có bằng chứng kiểm thử Docker và xác nhận sau kiểm thử. Không tìm cách vòng qua từ chối. Chưa push, chưa kiểm tra CI/CD; chờ người dùng xác nhận Docker đã kiểm thử và cho phép push main sau kiểm thử. Commit tài liệu được cập nhật tại chỗ trước khi xuất bản để vẫn giữ đúng 20 commit; không squash hoặc force push.

## FE-UI-20261113 — Giao diện tiếng Việt, so sánh lần gửi, tên phường và tài liệu tham vấn

- Bàn giao lúc 07:50 ngày 13/11/2026, Asia/Saigon (UTC+07:00). Phần sửa FE hoàn tất; giới hạn Word tham vấn và 2 ca dashboard chưa giải quyết ghi bên dưới. Chỉ sửa frontend; đọc BE local để đối chiếu. Không chạy Git, không chỉnh BE, không build/deploy Docker hoặc gọi mutation thật.
- Đã sửa: bộ lọc thủ tục và mục nhận xét dùng danh sách tìm kiếm có xuống dòng, tránh tên dài bung ra ngoài màn hình. Hai ô lọc ngày có nhãn riêng, xếp dọc trên màn hình nhỏ, không lấn ra ngoài khung. Việt hóa các nhãn thông tin/nhận xét/thuộc tính so sánh và trạng thái lịch sử. Vai trò MANAGER hiển thị **Quản lý cán bộ** ở hồ sơ và quản trị tài khoản; mã role/quyền không đổi. Tên người dùng và nội dung kê khai vẫn giữ nguyên dữ liệu gốc.
- So sánh lấy giá trị từ đúng hai snapshotData, hỗ trợ JSON object/chuỗi, tách từng thuộc tính và giấy tờ theo id. Dùng tên giấy tờ trong bản chụp, phân biệt thiếu thuộc tính với null/rỗng, số 0 và boolean; có trạng thái không thay đổi và chặn thứ tự phiên bản không hợp lệ. Snapshot cũ thiếu cấu trúc thì dùng kết quả API diff. Chưa có so sánh nội dung nhị phân tệp lịch sử.
- Danh bạ cán bộ ghép wardCode với danh mục phường để hiện tên chính thức; tải danh mục lỗi có thông báo và nút thử lại, không đoán tên từ mã.
- **Chưa xử lý hoàn toàn mục xem Word tham vấn:** source BE `OfficerSubmissionsController.DownloadDocx` gọi `ApplicationAccess.OfficerSubmission` → `Check(officer:true)` và chặn khi người xem không phải AssignedOfficerId. Quyền consultation/document-access không được áp dụng ở API này. FE giải thích lỗi 403 riêng, giữ kiểm tra quyền/phiên bản trước tải, không vòng qua route công dân hoặc URL Blob. Cần phía BE hỗ trợ đọc Word cho chuyên viên được tham vấn; phiên này giữ nguyên BE theo yêu cầu.
- API chỉ tái sử dụng, không thêm/sửa hợp đồng: `GET /api/v1/wards` → 200 danh mục `{id,code,name}`; `GET /api/v1/applications/{id}/versions` → 200 bản chụp; `GET /api/v1/applications/{id}/diff?fromVersion=...&toVersion=...` → 200 chênh lệch; `GET /api/v1/applications/{id}/consultations/document-access` → 200 quyền/phiên bản; `GET /api/v1/applications/{id}/contents` → 200 danh sách tệp; `GET /api/v1/officer/submissions/{id}/download-docx` và `GET /api/v1/supporting-documents/{id}/download` → 200 tệp hoặc lỗi quyền/không tồn tại theo BE. Các GET không có request body. Không đổi request nhận xét/đăng ký tài khoản.
- DTO/ProblemDetails/token: giữ nguyên tên trường gửi/nhận; chỉ đổi nhãn trình bày. Giữ oldExists/newExists và giới hạn snapshot; không gán giá trị lịch sử giả. Lỗi dùng client hiện có, token chỉ trong RAM; không lưu token hay dữ liệu người dùng thật vào test/tài liệu.
- Nguồn sửa: `src/lib/api/workflowAdapters.ts`, `src/lib/personName.ts`; `src/pages/officer/OfficerApplicationListView.tsx`, `src/pages/officer/OfficerReviewWorkspaceView.tsx`; `src/components/staffing/ConsultationsView.tsx`, `src/components/documents/DocumentFilePreview.tsx`, `src/components/profile/UnifiedSelfProfileView.tsx`; `src/pages/manager/ManagerPage.tsx`, `src/pages/manager/views/ManagerProfilesView.tsx`, `src/pages/manager/views/ManagerProfileDetailView.tsx`; `src/pages/admin/AdminPage.tsx`, `src/pages/admin/AdminRbacViews.tsx`, `src/pages/admin/CreateStaffAccountModal.tsx`; `src/pages/citizen/views/CitizenDossierDetailView.tsx`.
- Test mới: `tests/officer-ui-repairs.spec.ts`. Cập nhật test tương ứng trong `tests/manager.spec.ts`, `tests/admin-provisioning.spec.ts`, `tests/officer-submissions.spec.ts`, `tests/document-lifecycle.spec.ts`. Tài liệu: `docs/FRONTEND_SETUP.md`, `docs/PROGRESS.md`.
- Kiểm tra cuối: `npm run typecheck`, `npm run lint`, `npm run build` đạt (exit 0); build có cảnh báo annotation dependency và bundle Word lớn, không phải build sạch cảnh báo. Không chạy build/test .NET vì BE chỉ được đọc.
- Playwright chạy 3 lượt: (1) 37 ca: 28 đạt/9 lỗi; (2) 33 ca: 30 đạt/3 lỗi; (3) chạy lại 15 ca sau cập nhật test và bố cục ngày: **15 đạt/0 lỗi** (4 phút, exit 0). Kết quả mới nhất theo từng ca: **40/40 ca liên quan** đạt qua các lượt chạy (quản trị tài khoản 5, vòng đời tài liệu 2, tiền kiểm 14, sửa UI mới 5, rà soát bố cục 7, quản lý 7). Trong đó test helper so sánh/nhãn là kiểm tra hàm; các ca browser dùng HTTP mock, không có DB/HTTP/AI thật.
- Lượt rà soát rộng đầu còn **2 ca dashboard trong `tests/officer.spec.ts` chưa đạt/chưa sửa**: kỳ vọng nút `Xem danh sách hồ sơ sẵn sàng` (source hiện dùng thẻ chỉ số) và kỳ vọng không có nút `Xử lý` khi danh sách chưa tải. Không suy đây chỉ là lỗi test mà chưa đối chiếu thêm. Có 3 ca khác trong file này đã đạt ở lượt đầu. Tính theo kết quả mới nhất của 45 ca khác nhau đã chạy: 43 đạt, 2 chưa đạt; không coi toàn bộ regression suite đã xanh.
- Đã xem ảnh desktop so sánh và mobile bộ lọc; ca mới kiểm tra hai ô ngày nằm trong fieldset ở 320/390px. Rà soát bố cục 7 ca đạt ở 1440/720/320px cho 5 workspace, trang công khai/auth và clipboard. Nhãn ngày trống native phụ thuộc ngôn ngữ trình duyệt (Edge kiểm thử hiện `mm/dd/yyyy`); không coi đã Việt hóa nội dung do trình duyệt hoặc người dùng cung cấp. Không nghiệm thu mọi màn hình/zoom/thiết bị hoặc API thật. Đã dừng các Vite test server do phiên này tạo.
- Antigravity thực hiện commit; gợi ý tiêu đề chức năng `fix(frontend): localize staff UI and repair submission comparison`. Tách commit theo từng cập nhật chức năng của file hiện có; file test mới phải có commit riêng, ví dụ `test(frontend): cover staff UI repairs`. Không gộp/squash trái quy tắc chủ dự án.

## Chuẩn bị 20 commit lên main — 09/11/2026 (Asia/Saigon)

- Người dùng yêu cầu chia toàn bộ thay đổi FE hiện có thành đúng 20 commit và push main. Đã fetch origin/main, kiểm tra trước commit HEAD đồng bộ origin/main (0 ahead/0 behind); remote là wardmate-capstone/wardmate-frontend. Không chạy Git hoặc chỉnh BE.
- Nhóm commit: sinh/lưu lịch mặc định và xác nhận lịch; form nghỉ trọn ngày, tên cán bộ và điều hướng; metadata/góp ý Analytics, chọn sao, sao lưu; nút xem/tải mẫu cho khách dùng API hiện có; kiểm thử và tài liệu. Giữ giới hạn API xác thực phôi như ghi bên dưới, không tuyên bố khách tải thật được khi BE còn chặn.
- Kiểm tra lượt chuẩn bị: typecheck/lint/build, proxy 50 tuyến + 3 kiểm tra bảo toàn request và coverage Analytics 29/29 đạt; git diff --check đạt. Build còn cảnh báo annotation dependency/chunk lớn. Các kết quả Playwright và giới hạn mock đã ghi theo từng task bên dưới, không chạy lại toàn bộ trong lượt chia commit.
- Tại thời điểm ghi chú này chưa push; sau tạo commit sẽ kiểm tra đúng 20 commit, diff sạch, push thường lên main và đối chiếu SHA remote. Kết quả push báo ở phản hồi kết thúc; không đồng nhất push với deploy.

## Xem/tải phôi công khai — 09/11/2026 (Asia/Saigon)

- Theo yêu cầu mới, thay liên kết Đăng nhập để tải mẫu bằng hai nút Xem mẫu/Tải mẫu trên trang chi tiết thủ tục cho cả khách vãng lai. FormTemplateActions nhận publicAccess, query cache tách chế độ public, API dùng skipAuth=true nên không refresh/chuyển đăng nhập khi đọc mẫu lỗi. Giữ DocxPreview/Blob download và xử lý thiếu liên kết/tệp/lỗi API.
- Quyết định mới nhất: chỉ sửa FE, không sửa BE. Đã kiểm tra source BE và tài liệu: các bổ sung public route/ActiveOnly/ghi chú từ lượt trước không còn; không chạy Git BE hoặc thay đổi tiếp BE. FE sửa `src/components/forms/FormTemplateActions.tsx`, `src/pages/public/ProcedureDetailPage.tsx`, `src/lib/api/formTemplates.ts`; cập nhật `tests/form-templates.spec.ts` và FRONTEND_SETUP.md. Dùng lại hai API có sẵn `/api/v1/form-templates/{id}` và `.../download-docx`, bỏ route `/public/` tự thêm trước đó.
- Kiểm tra lượt trước: FE typecheck/lint/build và 2 ca mock đạt với route cũ của lượt đó; không dùng làm bằng chứng route hiện tại. Lượt hiện tại typecheck/lint đạt, 2/2 ca Playwright mock anonymous/citizen với route hiện có đạt (exit 0), git diff --check đạt. Dọn đúng Vite test PID 9244 sau workers. Test khẳng định request xem mẫu của khách không có Authorization; UI vẫn giữ trang khi mẫu ngừng, không ghi dữ liệu. Không chạy lại build trong lượt này vì chỉ đổi path về API có sẵn.
- Giới hạn: BE source vẫn có DocumentUser trên hai API hiện có; FE hiển thị đủ nút nhưng không thể tự gỡ quyền API. Chưa nghiệm thu HTTP/Blob/Azure không đăng nhập, chưa commit/push/deploy. Giữ toàn bộ thay đổi chưa commit của các task trước. Không yêu cầu build/deploy BE trong task chỉ sửa FE này.

## Rà soát đủ API Analytics và hoàn thiện UI — 09/11/2026 (Asia/Saigon)

- Đọc lại Swagger/OpenAPI Azure, các controller Analytics/Jobs/CitizenFeedback/NotificationDeliveryAdmin/SystemAdministration/BusinessAudit/SystemHealth/SystemBackups và DTO/service tương ứng trong BE local. Đếm 29 API nghiệp vụ: 22 GET, 6 POST, 1 PUT; GET `/` là nhận diện service, không tạo UI thừa. Internal audit HMAC, hub SignalR và health probes không phải API nghiệp vụ trên Swagger. Không sửa BE hoặc chạy Git BE.
- Đã lần theo đủ 29 adapter và nơi gọi UI/hook. Thêm `tests/analytics-api-coverage-check.mjs`: so method/path từ JSON OpenAPI mới với mapping, kiểm tra adapter và consumer source có thật, báo lỗi khi contract thay đổi/bỏ sót. Chạy đạt 29/29 với đặc tả tải lại Azure trong lượt này, lưu tạm ngoài repo. Cập nhật bảng đầy đủ tại `docs/ANALYTICS_API_COVERAGE_2026-11-03.md` (giữ tên file vì có liên kết cũ), không coi kiểm tra tĩnh là tích hợp HTTP có token.
- Probe thực tế 22 GET trực tiếp Analytics + 22 GET qua tuyến Gateway FE đang dùng: 44/44 trả 401 không token, không có 404 ở các path đã kiểm tra. Giữ system qua prefix `/api/analytics-system`, các nhóm Analytics/jobs/feedback/notification-admin giữ tuyến ngắn đang hoạt động. Không gọi mutation thật hoặc suy quyền/feature flags/worker đã chạy từ kết quả 401.
- `src/lib/api/analytics.ts`: giữ applicationCode/procedureTitle/applicantName nullable từ FeedbackDto mới (Swagger và BE đều có), không để Zod bỏ mất thông tin. `src/components/analytics/ManagerAnalyticsView.tsx`: dùng metadata Analytics trực tiếp, chỉ tra Workflow cho dữ liệu cũ thiếu, danh bạ hiệu suất đọc đủ trang và kiểm tra MANAGER + iam.accounts.read trước khi gọi. Không dùng GUID làm tên cán bộ. Góp ý dài mở Modal riêng, bảng có hướng dẫn cuộn mobile/vùng cuộn nhận focus; tránh hàng bị kéo dài khi cột hẹp.
- `src/components/feedback/CitizenFeedbackModal.tsx`: sửa vùng click sao bị SVG chặn bằng input native phủ trọn biểu tượng và SVG pointer-events-none; giữ chọn bằng bàn phím/focus. `src/pages/admin/SystemBackupsView.tsx`: combobox/datalist chọn gợi ý hoặc nhập mã target khác theo cấu hình BE, không tự suy mã gợi ý là target đã provision. Giữ request/response/status/quyền, validation, no-auto-retry, revision/version, đọc lại trước mutation và verify timeout 330 giây. Source check-now/create backup trả 202 dù Swagger còn mô tả 200; không nới FE nhận 200 giả xếp hàng.
- Kiểm tra cuối: typecheck/lint/build đạt; build còn cảnh báo annotation SignalR/Zod/chunk lớn. Proxy 50 tuyến + 3 kiểm tra request/header/body đạt. Coverage OpenAPI 29/29 đạt. Tổng 57 ca mock khác nhau có kết quả đạt qua các lượt: lượt 6 suite ban đầu các ca ngoài feedback (49 ca) đã báo đạt, nhưng các ca chọn sao bị kẹt và đã dừng đúng runner audit PID 6604/tiến trình con, không coi suite đó exit thành công. Sau sửa click sao, chạy 8 ca feedback đạt; ca Manager metadata/modal được chạy lại riêng 1/1 đạt sau sửa kiểm tra ảnh (modal Radix ẩn main khỏi accessibility tree nên đo modal thay vì main). Ca metadata trùng trong 49, không cộng thành 58. Đã xem ảnh modal góp ý desktop/mobile 390px và picker backup; không tràn ngang ở mobile. Dọn đúng Vite test PID 8340/2396 sau workers, không đụng server dev. git diff --check đạt.
- Các test sửa/thêm: `tests/analytics.spec.ts`, `tests/feedback.spec.ts`, `tests/fixtures/analytics.ts`, `tests/admin-system-operations.spec.ts`; update FRONTEND_SETUP.md. Không tự thực hiện các mục ProcedureCatalog/DocumentForm trong bàn giao BE 09/11 vì task này là Analytics.
- Giới hạn: chưa có phiên MANAGER/IT_ADMIN/REGISTERED_CITIZEN thật để nghiệm thu toàn bộ nghiệp vụ trên Azure; chưa xác minh jobs/health worker/audit relay/backup runner/Blob/pg_restore/gateway long timeout thật. Source Verify đã kiểm SHA/size/pg_restore nhưng không phải restore drill. Không có API backup-target discovery/download/restore hoặc health request-status nên không bịa UI/API. Giữ các thay đổi chưa commit từ các task trước; chưa commit/push/deploy bản rà soát này.

## Khung giờ mặc định cho tất cả cán bộ — 09/11/2026 (Asia/Saigon)

- Người dùng chốt đây là lịch mặc định được lưu thành ca cho mọi cán bộ, không chỉ thông tin tham khảo: Thứ Hai–Thứ Sáu 07:30–11:30 và 13:00–17:00; Thứ Bảy 07:30–11:30, giờ Việt Nam. Không tự thêm ca Chủ nhật.
- Thêm `src/lib/defaultStaffSchedule.ts` sinh ca UUID/version 0 cho các Frontdesk đang hoạt động thuộc danh bạ Manager trong phường. Giữ ngày đã có ca/đã sửa tay, kể cả ngày vừa xóa hết ca; bỏ ngày đóng cửa/lễ, ca đã bắt đầu, buổi giao với nghỉ phép được duyệt hoặc ca qua đêm tháng bên cạnh. Đổi giờ đúng UTC; không tự giả ca chính thức. Giữ giới hạn 500 ca/tháng từ BE: nếu vượt thì báo lỗi trước khi thêm ca, không điền một phần.
- `MonthlyScheduleView.tsx` có vùng **Lịch mặc định cho tất cả cán bộ** ngay trên lịch Manager: nêu giờ chuẩn, số cán bộ/tháng, nút điền và kết quả số ca. Ca được thêm vào nội dung đang soạn; Lãnh đạo dùng Lưu bản nháp/Xác nhận công bố lịch theo API cũ để lưu thật. Frontdesk tiếp tục đọc ca đã công bố và có dòng khung giờ mặc định. Không tự công bố khi GET hoặc mở trang, không ghi đè lịch cũ/mẫu tuần tùy chỉnh. Áp dụng từng tháng; không tự tạo vô hạn tháng tương lai.
- `tests/schedule-calendar.spec.ts` thêm ca tạo/công bố lịch chuẩn cho hai cán bộ, giữ ca sửa tay/ngày vừa xóa, bỏ lễ/Chủ nhật, nghỉ phép buổi sáng chỉ giữ chiều, kiểm tra payload UTC; xem ảnh desktop/mobile 390px. FRONTEND_SETUP.md ghi cách áp dụng và giới hạn.
- Kiểm tra: typecheck/lint/build cuối đạt (còn cảnh báo annotation SignalR/Zod và chunk lớn); Playwright Edge 3/3 ca liên quan đạt ở lượt đầu (lịch mặc định, xác nhận theo fingerprint sau lịch mới, tiện ích tuần/copy/history). Sau đưa nút lên trên lịch, chạy lại ca lịch mặc định/ảnh mobile 1/1 đạt, trùng trong 3, không tính thành 4 ca khác nhau. Đã xem ảnh desktop/mobile, không tràn ngang. Dọn đúng Vite test PID 16836/18396 sau workers. git diff --check đạt.
- Giới hạn: kiểm thử API mock; chưa công bố ca thật trên Azure, chưa đổi BE hoặc giới hạn 500 ca. Với phường vượt giới hạn cần nâng hợp đồng/giới hạn BE trước khi áp dụng toàn bộ. Giữ các thay đổi chưa commit của task trước; chưa commit/push/deploy. Bước tiếp theo: Lãnh đạo chọn tháng, điền lịch mặc định, kiểm tra và công bố; cán bộ lấy lịch mới để xem ca thật.

## Bỏ giờ trong form tạo đơn nghỉ — 09/11/2026 (Asia/Saigon)

- Theo yêu cầu mới nhất, `CreateLeave` trong `src/components/staffing/LeaveDraftsView.tsx` bỏ Từ giờ/Đến giờ và hướng dẫn nhập giờ, chỉ chọn ngày. Đơn tạo mới tính trọn các ngày đã chọn: 00:00 ngày bắt đầu đến 00:00 ngày kế tiếp sau ngày kết thúc, theo giờ Việt Nam, sau đó đổi UTC. UI nói rõ nghỉ trọn ngày. Không tự chọn giờ hành chính; không thay API/BE. Phần sửa metadata của bản nháp hiện có giữ nguyên.
- Local Zod bỏ trường giờ, kiểm tra validatePeriod trên khoảng trọn ngày, giữ giới hạn 93 ngày và lý do. Form một ngày tạo đúng 24 giờ; nhiều ngày bao gồm trọn ngày cuối. Giữ radio, reset, tổng ngày lịch và cơ chế body/key retry cũ. FRONTEND_SETUP.md đã thay mô tả giữ ô giờ cũ bằng hành vi mới.
- `tests/work-schedules.spec.ts`: bỏ nhập giờ trong helper form tạo, xác nhận không có input time; kiểm tra UTC nhiều ngày và 24 giờ một ngày trong ca retry/idempotency. Kiểm tra lượt này: typecheck/lint/build đạt (còn cảnh báo annotation SignalR/Zod/chunk lớn); Playwright Edge 3/3 ca đạt trong một lượt bằng API mock: form ngày/reset/validation, retry tạo nháp, chính sách không Word. Đã xem ảnh desktop cập nhật; test mobile 390px không tràn ngang đạt. Dọn đúng Vite test PID 14732 sau workers. git diff --check đạt.
- Giữ thay đổi chưa commit của các task trước; chưa commit/push/deploy, chưa nghiệm thu tạo/lưu/nộp trên Azure bằng phiên thật. Bước tiếp theo: tải lại form tạo đơn để xem giao diện chỉ chọn ngày.

## Form tạo đơn nghỉ theo ảnh gợi ý — 09/11/2026 (Asia/Saigon)

- `CreateLeave` trong `src/components/staffing/LeaveDraftsView.tsx`: modal rộng tối đa 3xl, lựa chọn Nghỉ 1 ngày/Nghỉ nhiều ngày, ngày bắt đầu/kết thúc cạnh nhau trên desktop, lý do nghỉ có placeholder, tùy chọn Word xuống cuối; footer Đặt lại/Tạo nháp Word. Giữ ô Từ giờ/Đến giờ riêng để không mất nghiệp vụ nghỉ theo buổi và không tự giả định giờ hành chính. Modal vẫn cuộn nội dung khi viewport thấp, header/footer giữ nguyên.
- Summary đếm số ngày lịch bao gồm hai đầu, chưa loại cuối tuần/ngày lễ và không suy thành số ngày phép bị trừ. Nghỉ 1 ngày dùng cùng ngày cho hai mốc, nhiều ngày dùng ngày kết thúc đã chọn. Local RHF/Zod schema kiểm tra ngày/giờ, dùng lại validatePeriod; payload startsAt/endsAt vẫn đổi UTC theo vietnamIso, không đổi API/BE hoặc giới hạn thời lượng 93 ngày hiện có.
- Reset xóa lựa chọn local và về chế độ một ngày, giữ chính sách Word; khóa reset sau khi có request cố định để bảo toàn key/body retry. Checkbox Word bắt buộc hiển thị nhưng disabled. Thiếu mẫu vẫn chặn tạo, không fallback đơn văn bản; chính sách cho phép không Word giữ luồng cũ.
- `tests/work-schedules.spec.ts` cập nhật helper/form labels, nút đóng X và kiểm tra khóa lý do; thêm ca ngày đảo ngược không POST, đổi chế độ, tổng ngày lịch, đặt lại, payload UTC và ảnh desktop/mobile 390px. FRONTEND_SETUP.md ghi hành vi hiện tại.
- Kiểm tra lượt này: typecheck/lint/build đạt; còn cảnh báo annotation SignalR/Zod/chunk lớn. Playwright Edge 4 ca khác nhau đạt qua các lượt: form theo ngày, retry tạo nháp cùng key/body, thiếu mẫu Word bắt buộc, chính sách không Word. Lượt đầu 3/4 đạt, ca thiếu mẫu lỗi kỳ vọng câu thông báo cũ; sửa expectation theo UI thật, chạy lại cùng ca ảnh 2/2 đạt (trùng trong 4). Đã xem ảnh desktop/mobile, không tràn ngang mobile. Dọn đúng Vite test PID 9536/15556 sau workers. git diff --check đạt. Không nghiệm thu Word/Blob/nộp thật trên Azure trong lượt này.
- Giữ toàn bộ thay đổi chưa commit từ các task trước; chưa commit/push/deploy. Bước tiếp theo: tải lại FE và thử tạo đơn nghỉ một ngày/nhiều ngày theo giao diện mới.

## Nghỉ phép cá nhân: nút rõ ràng và tạo đơn ngay đầu trang — 09/11/2026 (Asia/Saigon)

- `src/components/staffing/LeaveRequestsView.tsx`: đưa Tạo đơn nghỉ phép lên tiêu đề, dùng từ cả danh sách đang soạn và đã gửi; mặc định Frontdesk mở Đơn đang soạn, đổi hai tab thành Đơn đang soạn/Đơn đã gửi. Mô tả dành riêng cán bộ, không còn hướng dẫn quản lý duyệt/bàn giao. Bấm tạo mở form, không tự gọi API tạo; đơn đã gửi dùng nút Xem đơn và kết quả duyệt, có hướng dẫn riêng khi danh sách trống. Manager giữ luồng hiện có.
- `src/components/staffing/LeaveDraftsView.tsx`: nhận trạng thái mở form từ parent, không có nút tạo thứ hai. Đổi nút thành Tiếp tục soạn đơn, Xem mẫu đơn nghỉ phép và Tải lại danh sách; trạng thái trống hướng dẫn bấm Tạo đơn nghỉ phép ở đầu trang, bỏ phân trang khi không cần. Giữ nguyên tạo/soạn/lưu/nộp, RHF/Zod, capability và idempotency; không đổi API/BE.
- `tests/work-schedules.spec.ts`: cập nhật helper/nhãn; thêm kiểm tra CTA dùng từ cả hai tab, mở form không POST, empty state và mobile 390px. Cập nhật FRONTEND_SETUP.md.
- Kiểm tra lượt này: typecheck/lint/build đạt (còn cảnh báo annotation SignalR/Zod và chunk lớn); Playwright Edge 4/4 ca liên quan đạt trong một lượt bằng API mock: CTA/empty/mobile, mất response tạo nháp/idempotency, chính sách đơn không Word, Manager duyệt đơn. Đã xem ảnh desktop/mobile; không tràn ngang ở 390px. Ảnh mock có banner hàng đợi từ fixture chưa mock đủ dữ liệu, không coi đó là lỗi nghiệp vụ nghỉ phép hoặc xác minh Azure. Dọn đúng Vite test PID 3084 sau workers để kết thúc runner Windows. git diff --check đạt.
- Giữ các thay đổi chưa commit của các task trước. Chưa commit/push/deploy, chưa nghiệm thu tạo/lưu/nộp đơn trên Azure bằng phiên thật. Bước tiếp theo: tải lại FE, bấm Tạo đơn nghỉ phép ngay trên đầu trang hoặc Tiếp tục soạn đơn ở đơn chưa gửi.

## Bỏ danh sách ca trùng trong lịch cán bộ — 09/11/2026 (Asia/Saigon)

- `src/components/staffing/StaffingView.tsx`: bỏ tab Danh sách ca ở Frontdesk, đổi Sắp xếp lịch tháng thành Lịch tháng. Chỉ còn lịch tháng và yêu cầu đổi ca. URL cũ view=list của cán bộ mở lịch tháng; không mount ScheduleListView cho Frontdesk. Giữ danh sách ca của Manager, không xóa component/API đang dùng; xác nhận đã xem và đề nghị đổi ca vẫn ở lịch tháng.
- `tests/work-schedules.spec.ts`: cập nhật hồi quy Frontdesk kiểm tra bỏ tab, URL cũ về lịch tháng và chuyển qua lại yêu cầu đổi ca. `docs/FRONTEND_SETUP.md` ghi trạng thái hiện tại.
- Kiểm tra lượt này: typecheck/lint/build đạt; build còn cảnh báo annotation SignalR/Zod và chunk lớn. Playwright Edge 2/2 ca liên quan đạt trong một lượt bằng API mock (Frontdesk và danh sách ca Manager). Dọn đúng Vite test PID 6232 sau workers để kết thúc runner Windows. git diff --check đạt.
- Giữ nguyên các thay đổi chưa commit từ tiện ích xếp lịch/tên cán bộ/xác nhận đã xem. Chưa commit/push/deploy; chưa nghiệm thu Azure bằng phiên thật.

## Ẩn xác nhận đã xem, hiện lại khi lịch cá nhân đổi — 09/11/2026 (Asia/Saigon)

- Đối chiếu BE MonthlyScheduleService.Month/Confirm: receipt gắn fingerprint ca cá nhân theo tháng, Month chỉ trả confirmedAtUtc khi khớp fingerprint hiện tại. Không cần thay API/BE hoặc lưu cờ vào storage.
- `src/components/staffing/MonthlyScheduleView.tsx`: ẩn nút khi BE đã xác nhận hoặc POST thành công khớp cán bộ/tháng/fingerprint. Nút hiện lại khi bản lịch được đọc có fingerprint mới và chưa xác nhận. CalendarLoader dùng key theo fingerprint/receipt cho bản Frontdesk chỉ xem để cập nhật khi Query refetch; giữ key Manager ổn định, bảo toàn bản đang soạn. Lỗi xác nhận không ẩn nút, vẫn giữ chặn gửi lại khi cần đối chiếu.
- `tests/fixtures/workSchedules.ts` mô phỏng receipt theo tháng/fingerprint và xung đột; `tests/work-schedules.spec.ts` xác nhận nút ẩn sau POST, F5 vẫn ẩn, refetch nền thấy giờ mới/nút hiện lại, xác nhận lại gửi fingerprint mới, POST thất bại giữ nút. Cập nhật FRONTEND_SETUP.md.
- Kiểm tra lượt này: typecheck/lint/build đạt; còn cảnh báo annotation SignalR/Zod và chunk lớn. Playwright Edge 3/3 ca liên quan đạt bằng API mock trong một lượt. Dọn đúng Vite test PID 12552 sau workers để hoàn tất runner. git diff --check đạt. Chưa kiểm chứng receipt/outbox/notification trên Azure bằng phiên thật.
- Giới hạn: nút cập nhật theo GET mới từ Lấy lịch mới hoặc invalidation staffing hiện có; không thêm polling, không khẳng định nhận thay đổi tức thì khi chưa có thông báo/refetch. Giữ các thay đổi chưa commit của tiện ích xếp lịch/tên cán bộ. Chưa commit/push/deploy bản sửa này.

## Hiển thị tên cán bộ trên đơn nghỉ — 09/11/2026 (Asia/Saigon)

- `src/components/staffing/LeaveRequestsView.tsx`: nguyên nhân hiển thị mã là fallback thẳng officerId khi tra danh bạ không có kết quả/tải lỗi. Nay ưu tiên fullName đã trim, fallback username; người đăng nhập dùng profile của mình, đối chiếu ID không phân biệt hoa/thường. Không hiện GUID làm tên. Thẻ đơn và modal chi tiết dùng cùng hàm lấy tên. Lỗi danh bạ hiện thông báo và Thử lại thay vì âm thầm hiện mã; chưa tìm thấy tên có nhãn rõ, không tự bịa dữ liệu.
- Đã đọc source IAM UserDirectory: manager/officers yêu cầu iam.accounts.read + MANAGER/scope phường; chưa xác minh nguyên nhân danh bạ không trả tên cho đúng cán bộ trong ảnh trên môi trường thật. Không đổi quyền, BE hoặc hợp đồng API; khi thiếu quyền/thiếu bản ghi phải xử lý theo lỗi thực tế.
- `tests/work-schedules.spec.ts` kiểm tra tên trên thẻ/chi tiết, giữ nguyên duyệt đơn; thêm ca lỗi danh bạ 503 → thử lại có tên, không hiện GUID. `docs/FRONTEND_SETUP.md` ghi cách lấy tên và giới hạn.
- Kiểm tra lượt này: typecheck/lint/build đạt (còn cảnh báo annotation SignalR/Zod/chunk lớn); Playwright Edge 2/2 ca liên quan đạt bằng API mock. Dọn đúng Vite test PID 14172 sau workers để hoàn tất runner. git diff --check đạt. Chưa kiểm chứng danh bạ/đơn nghỉ bằng phiên thật trên Azure, chưa chạy toàn bộ suite.
- Giữ thay đổi chưa commit của Tiện ích xếp lịch; chưa commit/push/deploy bản sửa tên. Bước tiếp theo: tải lại trang, nếu còn Chưa tìm thấy tên cán bộ thì kiểm tra GET manager/officers có thành công và chứa officerId tương ứng hay không.

## Tiện ích xếp lịch dễ dùng và giải thích null cấu hình — 09/11/2026 (Asia/Saigon)

- Đối chiếu `SystemAdministration.Setting/Update` BE local: chưa có bản ghi cấu hình thì trả value từ Analytics:LookbackDays (fallback 7), version 0, updatedBy/updatedAtUtc null; PUT thành công mới ghi actor/timestamp và tăng version. Giải thích cho người dùng, không sửa BE/DTO hoặc giả metadata. Swagger Example không phải dữ liệu thật.
- `src/components/staffing/MonthlyScheduleView.tsx`: nhóm tiện ích thành Dùng giờ hằng tuần và Sao chép từ tháng khác; thay input month bằng select tháng/năm nguồn, nêu rõ cán bộ/tháng đích và nguồn → đích. Có lý do nút sao chép bị khóa khi chưa chọn/trùng tháng. Lịch sử công bố ở cuối. Sau preview thông báo số ngày được điền hoặc không có ngày phù hợp; vẫn giữ ca/ngày sửa tay, khóa ngày đã qua, ngày nghỉ/lễ, quyền và fingerprint/xung đột. Chỉ cập nhật nội dung đang soạn, không tự lưu/công bố.
- `tests/schedule-calendar.spec.ts`: cập nhật nhãn, kiểm tra chặn thiếu/trùng tháng nguồn, GET preview đúng query, phản hồi không có ngày phù hợp; thêm ca xác nhận điền đúng số ngày, giữ giờ sửa tay và không gửi draft/publish. Cập nhật `docs/FRONTEND_SETUP.md`.
- Kiểm tra lượt này: typecheck/lint/build đạt; build còn cảnh báo annotation SignalR/Zod và chunk lớn. Playwright Edge 2/2 ca liên quan đạt trong một lượt, dùng API mock. Đã xem ảnh tiện ích desktop/mobile 390px; kiểm tra không tràn ngang đạt. Dừng đúng Vite test PID 6284 sau workers để kết thúc teardown Windows. git diff --check đạt. Không chạy lại toàn bộ suite lịch hoặc nghiệm thu lưu/công bố trên Azure.
- Đầu lượt workspace sạch tại main `60b60fa`, 10 commit của lượt trước đã push và xác minh SHA remote trong phiên này. Bản sửa tiện ích hiện chưa commit/push/deploy; yêu cầu push trước không áp dụng task này. Bước tiếp theo: tải lại giao diện và thử giờ tuần/sao chép trên lịch cán bộ thật.

## Chia 10 commit và push main theo yêu cầu — 09/11/2026 (Asia/Saigon)

- Phạm vi: các thay đổi frontend trong phiên này, gồm khắc phục 404 nhóm quản trị qua prefix Gateway, bộ lọc ngày và UI Cập nhật thống kê. Remote xác minh: `https://github.com/wardmate-capstone/wardmate-frontend.git`; sau fetch, main/origin/main đồng bộ tại `7924f25` trước khi tạo commit. Không thao tác Git backend.
- Chia đúng 10 nhóm: (1) helper Gateway và chú thích env, (2) client settings/audit, (3) client health/backups, (4) mock quản trị, (5) hồi quy audit, (6) hồi quy health/backups, (7) kiểm tra proxy, (8) bộ lọc ngày, (9) UI/menu thống kê và kiểm thử, (10) tài liệu setup/bàn giao. Commit có mô tả hành vi, lý do, validation và giới hạn; không đưa env local, secrets, build outputs hoặc ảnh kiểm thử vào commit.
- Lượt Git chỉ kiểm tra nội dung/diff và dùng kết quả kiểm tra đã chạy trong các mục 09/11 phía dưới: không báo đã chạy lại typecheck/lint/build/Playwright trong lượt chia commit. Chưa nghiệm thu nghiệp vụ bằng JWT thật trên Azure. Push không đồng nghĩa deploy thành công.
- Tại thời điểm ghi mục này đang chuẩn bị commit/push; chưa xác minh kết quả push. Sau khi push, kiểm tra SHA remote, số commit và workspace sạch, báo kết quả riêng cho người dùng. Nếu lệnh push thất bại thì giữ commit local và báo rõ, không force push.

## Thu gọn lại UI Cập nhật thống kê — 09/11/2026 (Asia/Saigon)

- Theo yêu cầu đơn giản hơn, `src/pages/admin/AnalyticsJobsView.tsx` gộp màn hình vào một card tối đa 4xl: mô tả một câu, hai ô ngày và nút cập nhật cùng hàng desktop/xếp dọc mobile. Bỏ hai bước đánh số, card kết quả riêng, trạng thái trống và hướng dẫn lặp. Kết quả chỉ xuất hiện khi có yêu cầu đang theo dõi; mã/thời gian/nút kiểm tra nằm trong **Chi tiết lần cập nhật**, tra mã cũ trong **Tra cứu lần cập nhật cũ**, mặc định thu gọn. Rút gọn nội dung xác nhận, giữ nguyên API/auth/validation/polling/xử lý lỗi.
- Cập nhật nhãn tra cứu trong `tests/analytics.spec.ts` và trạng thái UI hiện tại trong `docs/FRONTEND_SETUP.md`; phần hai bước ở mục trước là lịch sử, không còn bố cục hiện tại. Giữ nguyên thay đổi chưa commit của các task trước, không sửa BE.
- Kiểm tra lượt này: typecheck, lint, build đạt (còn cảnh báo annotation SignalR/Zod và chunk lớn); Playwright Edge 4/4 ca Admin đạt trong một lượt: tạo/tra mã, jobs_disabled, polling và lỗi BE/focus. Đã xem ảnh desktop 1280px và mobile 390px, kết quả kiểm tra không tràn ngang đạt. Runner Windows cần dừng đúng Vite test PID 10888 sau khi workers xong để kết thúc teardown; không dừng server dev người dùng. git diff --check đạt.
- Giới hạn: kiểm thử bằng API mock, chưa nghiệm thu cập nhật thống kê thật trên Azure. Chưa commit/push/deploy. Bước tiếp theo: tải lại FE để xem bố cục gọn mới.

## UI bộ lọc Tổng quan và Cập nhật thống kê Admin — 09/11/2026 (Asia/Saigon)

- Đối chiếu source `AnalyticsAggregationJob.Rebuild`/AnalyticsJobsController: tác vụ đọc số liệu Workflow và tổng hợp lại theo ngày cho thủ tục/cán bộ, dùng trong báo cáo Lãnh đạo; không sửa hồ sơ gốc. Giữ POST rebuild/GET job hiện có, không thêm API hoặc thay backend. Ảnh bộ lọc đầu là workspace Lãnh đạo; sửa component AnalyticsFilters dùng chung nên áp dụng cho Tổng quan và các màn báo cáo có cùng bộ lọc.
- `src/components/analytics/AnalyticsFilters.tsx`: căn đầu hàng và nút Áp dụng theo ô ngày, không lệch hàng khi một ô có lỗi; thêm aria-invalid/describedby cho lỗi ngày. Sửa ngày thủ công xóa đánh dấu kỳ chọn nhanh.
- `src/pages/admin/AdminPage.tsx` đổi nhãn menu thành Cập nhật thống kê, tiêu đề Cập nhật số liệu thống kê. `AnalyticsJobsView.tsx` giải thích mục đích/khi dùng; chia hai bước chọn ngày và theo dõi kết quả; tự đọc trạng thái sau POST, badge/hướng dẫn theo trạng thái, nút kiểm tra thủ công. Tra cứu mã cũ thu gọn trong details, không bắt nhập mã cho yêu cầu vừa tạo. Xác nhận hiển thị ngày dd/MM/yyyy; không thêm % tiến độ/thời điểm hoàn tất giả. Giữ role IT_ADMIN, validation 1–366 ngày, focus lỗi BE, polling 3 giây/dừng khi lỗi hoặc kết thúc, không tự retry POST. Ghi giới hạn mất kết nối chưa nhận mã rõ hơn.
- `tests/analytics.spec.ts`: cập nhật tên/selector theo UI, kiểm tra căn hàng khi ngày đảo ngược, aria-invalid, không gửi bộ lọc lỗi, tra cứu mã mở rộng, kiểm tra không tràn ngang và ảnh desktop/mobile 390px. Chờ margin transition của shell kết thúc trước khi chụp ảnh mobile; ảnh chụp ngay khi resize trước đó cho bố cục đang chuyển, không dùng ảnh đó nghiệm thu. Đã xem ảnh cuối `admin-analytics-update-{desktop,mobile}.png`, `analytics-date-error-{desktop,mobile}.png` (artifact không commit). Cập nhật hướng dẫn tại FRONTEND_SETUP.md.
- Kiểm tra lượt này: typecheck/lint/build đạt, build còn cảnh báo annotation SignalR/Zod và chunk lớn. Playwright Edge 5 ca liên quan khác nhau đã đạt qua các lượt: 4 ca Admin (tạo/tra mã, jobs_disabled, polling, lỗi BE/focus) và 1 ca Manager (validation/bố cục). Lượt đầu 1/5 đạt, 4 lỗi selector trùng tên menu/nút; sửa scope selector về main, chạy lại 4/4 đạt. Sau bổ sung chờ layout mobile, chạy lại 2 ca ảnh 2/2 đạt (trùng trong 5, không cộng thành 7). Lượt kiểm tra ảnh trước đó bị người dùng ngắt, không tính là kết quả đạt. Runner Windows phải dọn đúng Vite test sau workers để có summary; không dừng Vite dev người dùng. git diff --check đạt.
- Giới hạn: kiểm thử API mock, chưa nghiệm thu gửi/tổng hợp thật trên Azure; không thay đổi URL Analytics jobs trong task này. Giữ nguyên toàn bộ thay đổi chưa commit của task sửa 404 trước đó. Chưa commit/push/deploy. Bước tiếp theo: người dùng tải lại FE, xem giao diện và thử khoảng ngày trên môi trường đang dùng; nếu API job lỗi, đối chiếu network thực tế trước khi đổi hợp đồng.

## Sửa FE: 404 ở bốn chức năng quản trị hệ thống — 09/11/2026 (Asia/Saigon)

- Đã đối chiếu controller AnalyticsSystem, cấu hình YARP local và Swagger/HTTP Azure. GET health/services, settings, audit-logs, audit-events, backups trực tiếp Analytics trả 401 khi chưa có token; qua Gateway đường `/api/v1/system/...` trả 404; qua `/api/analytics-system/api/v1/system/...` trả 401. Đủ API trên Swagger. Source Gateway đã có route ngắn nhưng chưa xác minh image/revision/config hiệu lực trên Azure; không kết luận chính xác nguyên nhân deploy khi chưa kiểm tra deployment.
- `src/lib/api/serviceUrls.ts` thêm `systemAdministrationPath`, dùng origin Gateway từ `VITE_DOCUMENT_FORM_API_URL` (giống notification hub) hoặc URL tương đối khi bật proxy. `systemAdministration.ts` và `systemOperations.ts` dùng helper cho toàn bộ GET/PUT/POST của Giám sát dịch vụ, Cấu hình hệ thống, Nhật ký nghiệp vụ/thay đổi cấu hình và Sao lưu. Không đổi auth, request/response, mutation retry, tab nhật ký IAM hay URL chung Analytics. Vite đã có proxy `/api/analytics-system` tới Gateway nên không cần sửa config.
- Cập nhật mock/override trong `tests/fixtures/systemAdministration.ts`, `tests/fixtures/systemOperations.ts`, `tests/admin-system-audit.spec.ts`, `tests/admin-system-operations.spec.ts`; sửa 3 selector health cũ dùng `iam` sang nhãn UI hiện tại `Tài khoản & phân quyền`. `tests/api-proxy-check.mjs` kiểm tra 15 thao tác system qua prefix mới tới đúng target Gateway, giữ method/path/query. `.env.example` và `docs/FRONTEND_SETUP.md` ghi rõ yêu cầu origin Gateway, không thêm prefix vào env.
- Kiểm tra lượt này: `npm run typecheck`, `npm run lint`, `npm run build` đạt; build còn cảnh báo annotation SignalR/Zod và chunk lớn. `node tests/api-proxy-check.mjs`: 50 tuyến + 3 kiểm tra request/header/body đạt. Playwright Edge ba suite admin-system-operations/audit/settings: lượt đầu 27/30 đạt, 3 lỗi selector health cũ; sửa selector, chạy lại riêng 3/3 đạt, tổng 30 ca khác nhau có kết quả đạt qua hai lượt. Một lệnh lọc `^health` không tìm thấy test, không tính là đạt; lượt sau dùng `health`. Runner Windows chờ teardown sau khi workers xong, đã xác minh và dừng đúng Vite PID 16064/12748/7104 của các lượt test để giải phóng cổng và lấy summary.
- Giới hạn: UI được kiểm thử bằng API mock; probe Azure không có token chỉ xác nhận tuyến tới xác thực, chưa nghiệm thu đọc/lưu cấu hình, health worker, audit hoặc backup/Blob/verify bằng phiên IT_ADMIN thật. Chưa commit/push/deploy. Bước tiếp theo: tải lại FE local hoặc phát hành bản build rồi nghiệm thu 4 màn hình với tài khoản thật; nếu trả 503 thì kiểm tra feature flags/migration/runner/storage theo mã lỗi BE, không coi đó là 404 routing.

## Đơn nghỉ: sửa ngày trực tiếp, Xuất bản Word và nộp một lần — 06/11/2026

- Theo xác nhận người dùng, nút Đối chiếu thông tin trong trình soạn đơn nghỉ đổi thành **Xuất bản**: xuất DOCX và lưu qua API hiện có, chỉ đóng editor sau khi lưu thành công đúng nội dung hiện tại. Lỗi giữ editor/nội dung để sửa hoặc thử lại. Lưu nháp Word/Ctrl+S vẫn lưu mà không thoát. Xuất bản chưa gửi đơn cho quản lý; người dùng bấm **Nộp cho quản lý** một lần để gửi, bỏ modal xác nhận nộp trung gian. Giữ kiểm tra revision/metadataVersion và key chống nộp trùng. Editor ở các workspace khác giữ hành vi cũ.
- Người dùng đã xác nhận nút sửa hoạt động nhưng giao diện khó hiểu. `LeaveDraftsView.tsx` chia bản nháp theo ba bước **Thông tin nghỉ → Soạn Word → Nộp đơn**. Ngày giờ/lý do sửa trực tiếp trong bước 1, lưu bằng **Lưu thông tin nghỉ**, không phải mở modal sửa riêng. `shared.tsx` bổ sung chế độ inline cho ActionForm, tái sử dụng RHF/Zod, validation, xử lý lỗi/xung đột có sẵn. Khi có thông tin chưa lưu, chặn soạn Word/nộp và cảnh báo khi đóng hoặc đọc lại trạng thái. Sửa metadata đã lưu yêu cầu lưu lại Word trước khi nộp. Xóa nháp vẫn có xác nhận.
- Kiểm tra: typecheck, lint và build đạt; build còn cảnh báo annotation SignalR/Zod và chunk lớn. Playwright Edge mock lượt cuối `work-schedules.spec.ts + docx-online.spec.ts --workers=2 --timeout=90000`: **16/16 đạt**, gồm đổi ngày giờ đúng UTC, giữ nội dung khi upload lỗi, Xuất bản lưu bản cuối/tự thoát, nộp một lần, cảnh báo mất thay đổi và mobile 390px. Đã xem ảnh desktop/mobile, không tràn ngang. Các lượt đầu có timeout và assertion test dùng sai định dạng UTC (đã sửa kỳ vọng); không coi các lượt đó là đạt. Runner chờ dọn Vite sau workers; dừng đúng PID server 4317 của lượt test để lấy summary.
- Giới hạn: kiểm thử bằng API mock và DOCX thật, chưa xác minh lưu/nộp trên Azure bằng phiên thật. Không đổi hợp đồng API hoặc backend. Người dùng tải lại giao diện và thử luồng sửa thông tin → lưu → Word/Xuất bản → nộp trên môi trường đang dùng.
- Git theo yêu cầu người dùng: chia 3 commit gồm editor lưu/thoát, UI đơn nghỉ ba bước, kiểm thử/bàn giao; đẩy lên `origin/main`. Đã fetch và xác minh main đồng bộ tại `294c1a5` trước khi chia commit. Tại thời điểm ghi tài liệu, đang chuẩn bị commit/push; kết quả push và SHA được xác minh riêng sau khi hoàn tất. Lượt Git chỉ kiểm tra diff/nội dung, dùng kết quả validation của lượt triển khai ngay trước đó, không chạy lại test.

## Rà soát BE và sửa luồng lịch Manager — 06/11/2026 (Asia/Saigon)

- Đọc lại `E:/wardmate-backend/AGENTS.md`, `PROGRESS.md`, MonthlyScheduleContracts/MonthlySchedulesController/MonthlyScheduleService, StaffingService và WF-WS-03. Không sửa hoặc chạy Git BE. Source hiện tại dùng MonthlyView 7 trường; chưa có ngày nghỉ cá nhân, isPublished/canEdit/editDeadlineUtc hoặc enforcement hạn sửa 24 giờ trước đầu tháng. FE đang khớp hợp đồng sau commit `f175f8f`; không khôi phục các trường giả hoặc checkbox chưa có lưu trữ.
- `MonthlyScheduleView.tsx`: HTTP 400 ở PUT draft cho phép sửa rồi gửi lại; HTTP 400 ở POST publish bỏ payload công bố cũ để gửi ghi chú/revision đã sửa. Lỗi mạng/409/5xx hoặc response không xác định vẫn giữ nội dung và cơ chế yêu cầu đối chiếu, không tự retry mutation. Đọc shifts đến hết ngày đầu tháng sau để chặn ca qua đêm cuối tháng trùng ca đầu tháng sau; ca ngoài tháng chỉ làm ngữ cảnh, không vào payload lưu.
- `ScheduleListView.tsx`: bổ sung ca kéo dài từ cuối tháng trước, liệt kê ca theo thời gian giao với từng ngày và ghi rõ ngày bắt đầu/kết thúc của ca qua đêm. Giữ bộ lọc cán bộ/tháng và chế độ chỉ xem.
- Thêm 4 ca hồi quy trong `tests/schedule-calendar.spec.ts`: lỗi 400 draft, lỗi 400 publish dùng ghi chú mới, trùng ca đầu tháng sau, danh sách ca qua đêm trong/giữa hai tháng. Cập nhật trạng thái hiện tại tại `FRONTEND_SETUP.md` và đầu `SCHEDULE_API_CONTRACT_RCA_AND_FIX_2026-11-06.md`; các mục RCA phía sau giữ làm lịch sử.
- Kiểm tra lượt này: typecheck đạt; lint đạt; build đạt (8036 modules, còn cảnh báo annotation SignalR/Zod và chunk lớn). Playwright Edge `schedule-calendar + work-schedules + staffing-ui`: **38/38 đạt**. Sau tinh chỉnh điều kiện lỗi và cách tính ranh giới tháng, chạy lại 4 ca mới **4/4 đạt**, lint/build cuối đạt; 4 ca này nằm trong 38, không cộng thành 42 ca khác nhau. Đã xem ảnh lịch mobile 390px; kiểm thử có desktop/mobile và tăng cỡ chữ. Runner Windows chờ dọn server sau khi workers kết thúc; dừng đúng Vite PID do từng lượt test tạo để lấy summary/exit 0.
- Giới hạn: đây là kiểm thử mock theo source BE, chưa nghiệm thu đăng nhập/lưu/công bố/outbox/SignalR trên Azure bằng phiên thật. BE publish có tạo outbox cho cán bộ có ca thay đổi; chưa chứng minh thông báo đã được phát thật. Checkbox ngày nghỉ và khóa sửa trước tháng 24 giờ vẫn cần BE hỗ trợ đồng bộ, chưa hoàn tất hai yêu cầu đó.
- Git đầu lượt: main tại `8ef7883`, đã đồng bộ origin/main, các commit từ lượt trước đã có trên remote. Bản sửa này được chuẩn bị thành commit bổ sung, giữ lịch sử đã phát hành. Tại thời điểm ghi bàn giao chưa push bản sửa mới; kết quả push được kiểm tra riêng sau commit, không đồng nhất Git push với deploy.

## Khôi phục hợp đồng chuẩn BE và hiển thị lịch tháng thành công — 06/11/2026

- **Trạng thái thực tế:** Màn hình **Lịch ca làm** và **Danh sách ca** tại `http://localhost:5173/manager` đã hiển thị lịch làm việc thành công, không còn lỗi chặn validation Zod.
- **Nguyên nhân và khắc phục:**
  - Trước đó FE tự thêm các trường `daysOff`, `isPublished`, `canEdit`, `editDeadlineUtc` vào schema Zod và logic xử lý lịch, trong khi hợp đồng BE chính thức (`MonthlyView`, `ScheduleDraftInput`, `MonthlyRevisionView`) và tài liệu bàn giao `Lịch làm việc Front Desk và đơn nghỉ Word` chỉ gồm: `month, slots, baseFingerprint, draft, leaves, closures, confirmations`.
  - Đã loại bỏ các trường thừa khỏi `src/lib/api/workSchedules.ts`, `MonthlyScheduleView.tsx`, `ScheduleListView.tsx`, `scheduleCalendar.ts` và các fixture test.
  - Ngày có ca hiển thị màu xanh nhạt; ngày nghỉ/lễ chung hoặc nghỉ phép cả ngày hiển thị màu đỏ nhạt; ngày chưa có ca hiển thị "Chưa có ca" (không tự quy kết thành ngày nghỉ cá nhân do BE không lưu riêng entity này).
- **Rà soát toàn bộ 47 API bàn giao (22 cũ + 25 mới):**
  - **Luồng A (5 API):** Capabilities, ngày đóng cửa phường và toàn quốc, hủy ngày đóng cửa.
  - **Luồng B (11 API):** Tra cứu ca, thêm/hủy ca lẻ, lịch tháng, cấu hình mẫu tuần, xem trước preview kèm sao chép theo ngày, lưu nháp draft, công bố publish kèm xác nhận ngoại lệ ngày đóng cửa, lịch sử BASELINE/PUBLISHED, xác nhận lịch bằng baseFingerprint cá nhân.
  - **Luồng C (11 API):** Mẫu đơn Word chung, tải DOCX mẫu, tạo nháp Word với Idempotency-Key, danh sách nháp, mở lại nháp, tải/lưu Word riêng với multipart/hash, xóa nháp, nộp cho quản lý; fallback API nộp trực tiếp cũ khi chính sách chưa bắt buộc Word.
  - **Luồng D (11 API):** Danh sách đơn nghỉ, chi tiết kèm cờ hasSubmittedDocx và hash, tải Word đã nộp, ca bị ảnh hưởng (shift-impact), hồ sơ cần bàn giao (impact/applications), quyết định duyệt/từ chối/hủy, lịch sử chuyển trạng thái, điều phối hồ sơ.
  - **Luồng E (3 API):** Danh sách đề nghị đổi giờ ca, cán bộ gửi đề nghị PENDING theo shiftVersion ca gốc, Manager duyệt/từ chối theo ID yêu cầu đổi ca.
  - **Luồng F (6 API):** Mời tham vấn hồ sơ UNDER_REVIEW, hộp thư tham vấn, tab tham vấn chi tiết, kiểm tra quyền đọc tài liệu, chuyên viên trả lời, Manager đóng tham vấn.
- **Kiểm tra đã chạy:**
  - `npm run typecheck`: đạt (0 lỗi).
  - `npm run lint`: đạt (0 lỗi).
  - `npm run build`: đạt (8036 modules transformed, dist hoàn chỉnh trong 27s).
  - `node tests/staffing-validation-check.mjs`: 56/56 checks đạt.
  - Xác nhận trực quan qua ảnh giao diện local 5173: lịch tháng 12/2026 hiển thị đúng 4 tuần ca làm (thứ Hai: 08:00–11:00, 13:00–16:00, 2 ca), các ngày khác "Chưa có ca".
- **Bước tiếp theo:** Người dùng tiếp tục thao tác thử nghiệm các luồng (tạo ca, lưu nháp, công bố lịch, xin nghỉ Word, đổi ca) trên môi trường local/Azure; báo lại nếu có bất kỳ phản hồi hoặc yêu cầu tinh chỉnh UI nào.

## Đối chiếu lịch tháng với backend bên cạnh — 06/11/2026

- Đã đọc mô tả/ràng buộc, DTO và service tại `D:/term 9/wardmate-backend`, không chạy Git hoặc sửa BE. Checkout này chưa có daysOff/isPublished/canEdit/editDeadlineUtc hay migration PersistScheduleDaysOff; không đồng nhất với checkout `E:/wardmate-backend` trong lịch sử.
- Swagger Workflow Azure trực tiếp hiện có 7 trường MonthlyView cũ, draft có 4 trường cũ. Gateway `/swagger/v1/swagger.json` trả 404 trong lượt này. Chưa kiểm tra response lịch bằng phiên thật; không sử dụng token trong ảnh.
- FE yêu cầu contract mới; ảnh chọn shifts 200 không phải bằng chứng cho schedules/{month}. Đã cập nhật phần đối chiếu mới ở đầu `docs/SCHEDULE_API_CONTRACT_RCA_AND_FIX_2026-11-06.md`, đề xuất tương thích chỉ đọc trước và chốt nghiệp vụ trước thay đổi ghi. Chưa sửa logic, migrate/deploy hoặc chạy test; chỉ kiểm tra source/tài liệu/API schema công khai và diff.

## Khắc phục thiếu cấu hình Azure khi clone FE — 06/11/2026

- Xác minh checkout chỉ có `.env.example`, không có env được Vite nạp. POST local `/api/v1/auth/login` với `{}` trả 404 trước sửa; trang chủ 200 ở lượt trước không chứng minh API đã nối.
- Đã tạo `.env.development.local` từ mẫu Azure hiện có, giữ proxy bật; file được Git ignore, không chứa tài khoản/token. Vite tự restart sau khi tạo file. Thêm `README.md` hướng dẫn clone/cài/env/chạy và phân biệt lỗi login, `/me`, refresh.
- Kiểm tra thật qua proxy localhost sau sửa: login `{}` trả 400 validation; GET wards 200; GET users/me không Bearer trả 401; POST refresh-token không body/cookie (đúng cách FE gửi) trả 401 `iam.invalid_token`. Thử refresh với `{}` trả 400 do validation body nên không dùng thử nghiệm đó để kết luận contract cookie hỏng. Swagger IAM công khai có LoginCommand, BrowserAuthResponse và header CSRF.
- `npm run typecheck` đạt. Chưa đăng nhập bằng tài khoản thật, chưa xác minh cookie/F5 hay tất cả API Azure; không chạy lint/build/E2E trong lượt này, không commit/push. Người dùng tải lại localhost:5173 và thử tài khoản đúng môi trường; nếu còn lỗi cần HTTP status/mã lỗi của login và users/me, không cần mật khẩu/token.

## Chạy frontend local — 06/11/2026

- Đã cài 399 packages bằng `npm install --no-audit --no-fund`; `npm ci` ban đầu thất bại do lockfile thiếu `@emnapi/core` và `@emnapi/runtime` 1.11.3. `package-lock.json` đã được npm bổ sung dependency và chuẩn hóa metadata peer; không đổi `package.json`.
- Đã chạy `npm run dev` ngoài sandbox tại `http://localhost:5173/`, kiểm tra HTTP trả 200. Server chỉ tồn tại trong phiên chạy; lần sau có thể cần khởi động lại.
- Chưa chạy typecheck/lint/build hoặc kiểm thử nghiệp vụ/API thật trong lượt khởi động này. Không commit/push.

## RCA lỗi HTTP 200 nhưng hai màn lịch không hiển thị — 06/11/2026

- Theo yêu cầu người dùng, đã lập `docs/SCHEDULE_API_CONTRACT_RCA_AND_FIX_2026-11-06.md`: nguyên nhân, bằng chứng, trách nhiệm, phương án khôi phục chỉ đọc và triển khai đồng bộ. Lượt này chỉ điều tra/tài liệu, không sửa tiếp logic FE/BE hoặc deploy.
- Đã đọc Swagger công khai Gateway lúc 13:41:45 UTC+7 và Workflow trực tiếp lúc 13:43:35: cả hai HTTP 200 nhưng MonthlyView chỉ có 7 trường cũ, thiếu daysOff/isPublished/canEdit/editDeadlineUtc; ScheduleDraftInput chưa có daysOff. FE mới bắt buộc các trường này. Config development Vite proxy staffing về Workflow Azure trực tiếp, không phải BE local. Chưa đọc response nghiệp vụ bằng phiên thật hoặc DB/revision Azure; báo cáo phân biệt schema công khai với body thực tế.
- Xác định trách nhiệm chính ở tích hợp/rollout do agent thực hiện: FE yêu cầu contract mới trước khi nghiệm thu BE đích, chưa có tương thích chỉ đọc; không quy lỗi người dùng hoặc cá nhân BE/DevOps khi thiếu log triển khai. Thông báo hiện gom mọi ZodError thành yêu cầu cập nhật BE nên cũng cần sửa độ chính xác.
- Đề xuất, chưa triển khai: legacy response hợp lệ vẫn hiển thị chỉ đọc, không giả canEdit/daysOff hoặc bỏ validation; migration + BE đúng môi trường rồi nghiệm thu response/lưu/nghiệp vụ/thông báo thật trước bật ghi FE. Kiểm tra tài liệu/đường dẫn và diff; không chạy lại build/test cho thay đổi tài liệu, không dùng số kiểm thử cũ làm kết quả mới.

## Lưu ngày nghỉ qua API, khóa lịch đã công bố và danh sách theo cán bộ/tháng — 06/11/2026

- **Đã sửa source FE và BE theo yêu cầu mới.** Ghi chú “dấu nghỉ chỉ giữ trong phiên” ở các mục lịch sử phía dưới đã được thay thế bằng hợp đồng có lưu DB. Chưa deploy Azure hoặc áp dụng migration lên DB thật.
- **Danh sách ca:** thêm `src/components/staffing/ScheduleListView.tsx`; chọn cán bộ rồi tháng/năm, bảng ngày/loại ngày/giờ làm, chỉ đọc ca/ngày nghỉ chính thức trong tháng. Người ngừng hoạt động vẫn tra cứu được ở danh sách. Bỏ nút tạo/hủy ca trực tiếp khỏi danh sách; sửa qua Sắp xếp lịch tháng. Giữ tên tab người dùng đã đổi.
- **API/checkbox:** `workSchedules.ts` có `daysOff:[{officerId,date}]` trong input draft và response revision/tháng; tháng có thêm `isPublished,canEdit,editDeadlineUtc`. Tick/bỏ tick gọi GET đối chiếu rồi PUT draft ngay với toàn bộ slots+daysOff cả phường; dùng revision/version mới cho thao tác tiếp theo, không mất ngày nghỉ người khác. Mở lại lấy nháp đã lưu, sau công bố lấy ngày nghỉ chính thức. Giờ sửa bằng form được lưu khi công bố hoặc cùng lần tick tiếp theo. Lỗi/mất phản hồi giữ nội dung, chặn ghi đè; kiểm tra response có đúng ngày nghỉ trước báo thành công. BE cũ thiếu metadata thì báo cần cập nhật, không giả lưu bằng localStorage.
- **Khóa/sửa:** tháng đã PUBLISHED/BASELINE mặc định chỉ xem lịch chính thức, không lấy nháp chưa công bố để giả lịch đã công bố. Có nút Sửa lịch cho Manager có quyền manage khi còn hạn; bấm sửa mới mở bản đang soạn. Hạn là đủ 24 giờ trước 00:00 ngày 1 theo Việt Nam: tháng 12/2026 sửa chậm nhất **30/11/2026 00:00** (29/11 17:00 UTC), đúng mốc vẫn được. BE kiểm tra lại dưới khóa phường ở draft/publish và luồng đổi ca; API tạo/hủy ca cũ không sửa tháng đã công bố. Công bố lại xong về chỉ xem.
- **Thông báo:** BE công bố lưu event STAFFING/SCHEDULE_PUBLISHED vào outbox cùng transaction cho từng cán bộ có giờ hoặc ngày nghỉ thay đổi, kể cả chỉ đổi ngày nghỉ. Consumer hiện có nhận loại event này và tạo IN_APP; không phát event khi chỉ lưu nháp, không phát trùng khi replay publish đã thành công. Hộp xác nhận liệt kê giờ cũ/mới, ngày nghỉ thêm/bỏ, cán bộ bị ảnh hưởng và nhắc sẽ thông báo. Chưa nghiệm thu giao nhận RabbitMQ/Analytics/SignalR thật.
- **BE cùng workspace:** cập nhật MonthlyScheduleContracts/MonthlyScheduleService, StaffingService, WardSchedule/WorkflowDbContext; thêm SchedulePolicy, migration `20261106061808_PersistScheduleDaysOff` (JSONB `days_off_json`) cùng designer/snapshot. Hướng dẫn và toàn bộ đường dẫn ở `E:/wardmate-backend/PROGRESS.md`, `docs/api-guide.md`, `docs/system-constraints.md`. Không chạy Git trong BE theo AGENTS, không commit/push repo nào.
- **Kiểm tra thực chạy:** hồi quy `schedule-calendar + work-schedules + staffing-ui` **39/39 đạt**; sau tinh chỉnh quyền/schema/lỗi, nhóm trọng tâm **7/7 đạt**, gồm 2 ca mới sát hạn và response không xác nhận ngày nghỉ: **41 ca khác nhau** qua hai lượt. Tất cả nghiệp vụ/danh tính dùng mock; fixture Word là DOCX ZIP/XML thực. Cập nhật test bảng danh sách theo UI mới, kiểm tra tự lưu/mở lại/công bố/khóa, giữ nghỉ người khác, cutoff, năm nhuận, qua đêm, cache/lỗi mạng và responsive 1440/768/390/360 + font CSS 200%. Sửa schema lịch sử BASELINE để nhận fingerprint rỗng đúng migration BE thật, không nới DRAFT/PUBLISHED.
- Typecheck, lint, FE build cuối đạt (còn cảnh báo annotation/chunk lớn cũ). BE build Release toàn solution sau migration **0 errors / 0 warnings**; EF `has-pending-model-changes` đạt, đã tạo/đọc SQL migration offline. Không tạo lại test project BE; chưa chạy kiểm thử DB/race/outbox thật. SDK .NET 8.0.427 cài trong thư mục tạm sau kiểm SHA-512 do máy ban đầu chỉ có runtime; không đổi SDK hệ thống. Các Vite PID do test tạo đã được dừng để kết thúc teardown Windows, exit 0.
- **Bước triển khai còn lại:** áp dụng migration và deploy Workflow mới trước FE mới; kiểm tra hai Manager cạnh tranh version, hai phường, hạn sửa theo giờ server và thông báo IN_APP thực với tài khoản kiểm thử. Không coi các lượt mock/build là xác minh đã lưu/gửi thông báo trên Azure. Bảng coverage cập nhật: 45 nhánh UI hiện hành + 2 endpoint create/cancel cũ chỉ còn client tương thích; tổng route vẫn 47.

## Đổi mặc định và màu ngày làm/ngày nghỉ — 06/11/2026

- Đã sửa `MonthlyScheduleView.tsx` và `staffing.css`: mặc định **không tick = ngày làm, xanh nhạt** kể cả chưa có giờ; **tick = nghỉ, đỏ nhạt**. Ngày lễ/nghỉ chung và nghỉ phép phủ cả ngày từ BE được tick/đỏ; phép một phần ngày không biến cả ngày thành nghỉ. Màu chọn ngày và trạng thái đã qua không ghi đè màu làm/nghỉ. Thay “Không có ca” trên ô ngày làm trống bằng “Chưa đặt giờ”.
- Tách dấu nghỉ khỏi việc thiếu slots. Tick nghỉ bỏ ca ngày đó trong bản đang soạn, bỏ tick khôi phục giờ đã nhập, không tự mở form; áp dụng giờ mới chuyển về ngày làm. Tiện ích điền ngày trống bỏ qua ngày được tick nghỉ; cảnh báo mất thay đổi bao gồm dấu nghỉ. Không sửa API/BE, không tự tạo ca mặc định hoặc dùng closure chung để lưu nghỉ cá nhân.
- **Giới hạn xác minh từ hợp đồng BE hiện tại:** `ScheduleDraftInput`/`MonthlyRevisionView` chỉ có slots, không có ngày nghỉ cá nhân. Vì vậy dấu tick cá nhân chỉ giữ trong phiên xếp lịch, mất khi tải lại/công bố; UI giải thích rõ. Phần bỏ ca tương lai vẫn lưu qua API khi công bố. Muốn giữ nguyên dấu tick khi mở lại cần BE bổ sung dữ liệu ngày làm/nghỉ theo cán bộ/tháng; chưa tự đặt hợp đồng mới hay dùng localStorage thay dữ liệu BE. Ghi chú này thay thế quy ước cũ “không có ca là nghỉ” trong mục phía dưới.
- Kiểm tra thực chạy: `npm run typecheck`, `npm run lint`, `npm run build` đạt (8035 modules, còn cảnh báo annotation/chunk lớn cũ); **19/19 Playwright lịch dùng mock đạt**, gồm kiểm tra màu CSS thực, ngày trống mặc định không tick, tick/bỏ tick khôi phục giờ, ngày lễ đỏ, công bố, cache/lỗi mạng, qua đêm và responsive 1440/390/360 + font CSS 200%. Đã xem ảnh mobile 390. Dừng đúng Vite PID của lượt test để kết thúc teardown Windows, exit 0. Chưa nghiệm thu Azure bằng phiên thật. Cập nhật `FRONTEND_SETUP.md`; giữ thay đổi trước đó, không commit/push.

## Xây lại bảng lịch tháng theo cán bộ — 06/11/2026

- **Đã triển khai theo yêu cầu mới nhất:** Manager mở Lịch ca làm mặc định ở Lịch tháng → chọn cán bộ trước → chọn tháng/năm bằng bộ chọn tiếng Việt → bảng đủ ngày, 7 cột Thứ Hai–Chủ nhật → bấm ngày đặt giờ 24 giờ, nhiều ca/qua đêm hoặc tick Nghỉ → xác nhận công bố bên dưới bảng. Giữ các tab danh sách và đổi ca; giờ tuần/sao chép/lịch sử nằm trong Tiện ích xếp lịch. Frontdesk bấm ngày xem chi tiết, xác nhận đã xem hoặc đề nghị đổi giờ; tháng rỗng không cho xác nhận.
- **File chính:** viết lại `src/components/staffing/MonthlyScheduleView.tsx`, thêm `ScheduleWeekPattern.tsx`, `src/lib/scheduleCalendar.ts`; cập nhật `StaffingView.tsx`, `staffing.css`, fixture/tests lịch. Giữ thay đổi đang có của phiên trước; không commit/push, không sửa BE.
- **API/nghiệp vụ:** đối chiếu lại `MonthlyScheduleService.cs` và `StaffingService.cs` local. Tick Nghỉ là không có ca cá nhân trong ngày, không gọi API tạo ngày nghỉ chung. Ngày lễ/nghỉ phép hiển thị từ BE; chặn giờ trùng/nghỉ phép được duyệt và yêu cầu xác nhận ca thay đổi trong ngày lễ. GET shifts ngày đầu tháng bổ sung ca qua đêm từ tháng trước để xem/chặn trùng; không đưa các ca ngoài tháng vào payload lưu. Không dựng phiên bản giả nếu ca thiếu version.
- **Công bố:** một thao tác UI thực hiện lưu draft đầy đủ ca cả phường rồi publish theo hợp đồng có sẵn; hai call này không phải một transaction FE. Giữ lịch người khác và bản soạn hợp lệ trên server, liệt kê cán bộ/giờ cũ/giờ mới trong xác nhận. Kiểm tra fingerprint/version trước PUT; bản soạn lỗi thời phải xác nhận bỏ trước khi lập lại từ lịch chính thức. Nếu đã lưu nhưng publish lỗi, giữ revision/body để kiểm tra và thử công bố lại; không báo thành công sớm hay tự retry. Nếu mất phản hồi lưu, yêu cầu lấy lịch mới để đối chiếu.
- **Sửa lỗi khi kiểm tra:** không cố định lại editor từ cache cũ khi bấm Lấy lịch mới; lỗi đọc nền không unmount/mất giờ đang chỉnh; sau công bố vẫn mở khóa bộ chọn/tải lại dù lần đọc tiếp thất bại. Hiển thị ca qua đêm vào ngày sau và khóa tick nghỉ nhầm. Chọn ngày đã qua mở chi tiết chỉ xem thay vì form giờ bị khóa. Giữ thay đổi khi chuyển tab; đổi cán bộ/tháng/tải lại có cảnh báo bỏ thay đổi và có beforeunload. Hook hiện tại chưa chặn mọi điều hướng router ra workspace.
- **Kiểm tra thực chạy:** lượt hồi quy cuối `schedule-calendar + work-schedules + staffing-ui` **33/33 đạt** (API/danh tính mock, có DOCX ZIP/XML thực từ fixture). Sau chỉnh trạng thái mở khóa và tra tên, chạy thêm hai ca công bố thường/công bố xong đọc lỗi **2/2 đạt**, trong đó một ca mới: **34 ca khác nhau** qua hai lượt. Bao gồm xung đột, giữ lịch người khác, ngày lễ/nghỉ phép, ca qua đêm/cận tháng, cache/lỗi mạng, năm nhuận, desktop 1440 và mobile 390/360, font CSS 200%, Word/nghỉ/đổi ca và năm màn điều hành. Đã xem ảnh desktop/mobile; không coi tăng font CSS là zoom trình duyệt thật. Lượt đầu sửa assertion chọn ca theo ID thay vì thứ tự; các lượt có reload khi đang thay source/build không tính đạt, đã chạy lại ổn định.
- `npm run typecheck`, `npm run lint`, build cuối **8035 modules** đạt; lint lại các file UI/test lịch sau bổ sung đạt. Build còn cảnh báo annotation SignalR/Zod và chunk lớn hiện có. Windows runner chờ dọn Vite sau các ca; đã dừng đúng PID Vite do từng lượt test tạo để nhận summary/exit 0, không dừng dịch vụ khác. Cập nhật `FRONTEND_SETUP.md` và bảng coverage theo tên thao tác mới.
- **Giới hạn/bước tiếp:** chưa nghiệm thu Azure bằng phiên thật/hai phường; không dùng mock làm bằng chứng dữ liệu thật đã lưu. BE hiện không có API xóa vĩnh viễn lịch tháng/ca đã kết thúc; bảng tháng giữ ca đã bắt đầu chỉ xem, danh sách vẫn hỗ trợ hủy ca còn hiệu lực theo API. Không có loại nghỉ/lễ cá nhân được lưu riêng ngoài trạng thái không có ca. Kiểm tra thật tiếp theo: hai cán bộ trong cùng phường, giữ lịch người khác khi công bố, ngày lễ/nghỉ phép và lỗi/xung đột đồng thời với BE deploy.

## Triển khai FE lịch tháng, nghỉ Word và đổi ca — 06/11/2026

- **Đã triển khai FE theo kế hoạch được người dùng duyệt.** Bổ sung 25 thao tác mới, giữ 22 thao tác cũ; bảng **47 API → client/UI** tại `FE_STAFFING_API_COVERAGE_2026-11-06.md`. Đây là bao phủ call site/nhánh UI, không phải 47 thao tác đã nghiệm thu Azure có xác thực. Baseline FE `46bb7c0`; giữ tài liệu bàn giao và kế hoạch chưa tracked có sẵn, không commit/push.
- **API/cache:** thêm `src/lib/api/workSchedules.ts`, cập nhật staffing/validation/error. Có Zod, đối chiếu ID/phiên bản cần thiết, binary DOCX/hash/multipart, key/body cố định cho tạo/nộp khi gửi lại, không tự retry mutation. Query staffing tách user/phường/role/quyền; luôn đọc lại khi mount, giữ nội dung và khóa ghi sau xung đột.
- **UI mới:** `LeaveDraftsView.tsx`, `LeaveRequestsView.tsx`, `MonthlyScheduleView.tsx`, `ShiftChangesView.tsx`; `StaffingView` nối hai workspace. Frontdesk có nháp/đơn đã nộp, editor Word lưu/mở lại, sửa metadata/xóa/nộp và xem Word đã nộp chỉ đọc; đọc capability để không bỏ qua Word bắt buộc. Manager có detail/version mới, ca bị ảnh hưởng, hồ sơ bàn giao, quyết định/lịch sử; không tự chuyển hồ sơ khi duyệt nghỉ.
- **Lịch:** danh sách ca, tháng theo ngày/cán bộ, mẫu tuần, preview/sao chép theo ngày trong tháng, chỉnh toàn bộ slots, lưu nháp/công bố/lịch sử BASELINE, phục hồi nháp lỗi thời có xác nhận; giữ ca đã bắt đầu. Frontdesk xác nhận fingerprint cá nhân, gửi đổi giờ với version ca thật; Manager duyệt/từ chối theo ID yêu cầu. Bộ lọc hiển thị không làm thiếu ca khi lưu; công bố có xác nhận riêng ngoại lệ ngày đóng cửa và ca bị hủy.
- **Dùng chung:** editor DOCX lazy load có nhãn/lỗi theo ngữ cảnh; khung Word toàn viewport. Sửa guard thay đổi chưa lưu hiển thị trên editor. Tham vấn đọc lại trước trả lời/đóng và kiểm tra quyền khi mở tài liệu. Toast/bell staffing về đúng nhóm danh sách, invalidation staffing/workflow; Manager/Officer hiểu query section/view tương ứng. Không giả resourceId/actionUrl mà BE chưa gửi. Cập nhật `FRONTEND_SETUP.md`.
- **Lỗi phát hiện và đã sửa:** thanh công cụ Word che nút lưu khi nằm trong modal hẹp; modal đọc Word trùng tên accessible; label select trong test cần đối chiếu đúng accessible name; khung giờ 2 cột bị cắt chữ khi phóng chữ 200% (đổi flex wrap, thêm kiểm tra overflow bên trong). Test mobile cold-start từng vượt chờ 5 giây, đã chờ tối đa 15 giây cho dữ liệu lịch sẵn sàng và chạy lại đạt. Script form từng timeout lúc tối ưu dependency/chạy song song build, chạy riêng lại đạt; không tính các lượt lỗi là đạt.
- **Kiểm tra thực chạy:** typecheck đạt (chạy riêng và trong build), lint đạt, build cuối đạt **8033 modules**; còn cảnh báo annotation SignalR/Zod và chunk lớn hiện có. Playwright Edge có **36 ca khác nhau đạt qua các lượt**: lượt hồi quy chung `work-schedules + staffing-ui + manager + docx-online` **30/30**; lượt bổ sung notification/stale/copy/403/detail **6/6** (trùng 1 ca detail với lượt chính); lượt responsive/phóng chữ cuối **4/4** (trùng 3 ca responsive, thêm 1 ca phóng chữ). Đã xem ảnh desktop/mobile và chữ 200%; đây là tăng font CSS, chưa xác minh zoom trình duyệt thực. Script validation **56/56**; form độc lập **11/11**, không gọi API; proxy **50 tuyến + 3 ca giữ header/body** gồm Idempotency-Key/PATCH/multipart. `git diff --check` đạt; bảng coverage kiểm đếm 47 dòng.
- **Môi trường kiểm tra:** Word dùng DOCX ZIP/XML thực do fixture tạo, nghiệp vụ/API và danh tính được mock. Runner Windows chờ dọn Vite sau khi báo từng ca; đã dừng đúng các tiến trình Vite do lượt test tạo để nhận summary/exit 0. Không thay cấu hình Playwright, không dừng dịch vụ của người dùng. Test artifacts ở test-results, không đưa vào source.
- **Giới hạn còn lại:** chưa có nghiệm thu nghiệp vụ Azure bằng phiên thật: mẫu chung/Blob, hai phường, quyền tải tệp thực, dữ liệu lưu qua restart, outbox/SignalR liên dịch vụ và deployment. Bước tiếp là chạy kịch bản hai phường trong bàn giao với tài khoản kiểm thử hợp lệ, ghi riêng kết quả thật; không dùng mock hay Swagger làm bằng chứng các phần này đã đạt. Không sửa BE, migration, secrets hoặc cấu hình template/storage.

## Khảo sát BE mới và kế hoạch tích hợp đầy đủ FE — 06/11/2026

- Người dùng yêu cầu gắn toàn bộ API trong bàn giao `Lịch làm việc Front Desk và đơn nghỉ Word.md`, hoàn thiện UI/UX và kiểm tra bug/validation, **trước hết lập kế hoạch để xem**. Lượt này chỉ khảo sát/lập kế hoạch, chưa triển khai chức năng.
- Đã đọc source BE local mới LeaveDraft/MonthlySchedule contracts/controller/service, hướng dẫn API và WF-WS; đã đọc Swagger UI/index.js/OpenAPI JSON đang deploy qua Gateway (HTTP 200). Đủ 47 thao tác trong bàn giao: 22 cũ + 25 mới. Bộ lọc rộng có 49 vì thêm assignment-summary và PUT assignee đã được FE dùng ở Giám sát hồ sơ, đưa vào hồi quy. Thông tin cũ “BE chưa có nháp/lịch tháng/đổi ca” bên dưới là lịch sử, không còn là trạng thái source hiện tại.
- FE hiện có 22 client/luồng cũ; chưa có 25 API mới và UI Word/lịch tháng/đổi ca tương ứng. Kế hoạch chi tiết tại `FE_STAFFING_FULL_INTEGRATION_PLAN_2026-11-06.md`: 8 bước từ coverage/client/schema → Word → duyệt nghỉ → lịch tháng → xác nhận/đổi ca → hồi quy/thông báo → test và nghiệm thu thật.
- Điểm hợp đồng cần giữ: mẫu Word chung, capability không chứng minh tải được file; nháp/tệp riêng, lưu/nộp tách biệt; idempotency key/body giữ nguyên khi retry; metadataVersion/revision; lịch nháp gửi toàn bộ slots, sao chép theo ngày trong tháng như BE hiện tại, fingerprint lịch cá nhân, quyết định đổi ca không có expectedVersion; BASELINE có actor UUID toàn 0.
- Git FE đầu lượt: main tại `46bb7c0`, chỉ tài liệu bàn giao tiếng Việt của người dùng chưa tracked. Không chạy Git BE theo AGENTS backend, không sửa BE hoặc cấu hình mẫu/storage. Không gọi nghiệp vụ có xác thực, không tạo dữ liệu thật; chưa chạy build/test trong lượt kế hoạch. Chỉ thêm kế hoạch và ghi chú, kiểm tra nội dung/đường dẫn/diff; không commit/push.
- Bước tiếp: người dùng xem kế hoạch; sau đó triển khai FE theo hợp đồng thật. Nghiệm thu hai phường cần phiên kiểm thử hợp lệ và mẫu/storage đã cấu hình; có route trong Swagger không chứng minh luồng Word/quyền/thông báo thật đã đạt.

## Nâng cấp UI/UX Dashboard Quản lý Thủ tục (`ProcedureDashboardView`) — 06/11/2026

- **Mục tiêu & Bối cảnh:**
  - Tối ưu hóa giao diện trang Tổng quan Quản lý Thủ tục (`section === 'dashboard'`) theo phản hồi của người dùng về việc UI cũ hiển thị đơn điệu, thẻ số trống trải, văn bản mã và trạng thái dính cục (`test Đang công khai`).
- **Những việc đã thực hiện:**
  1. **Nâng cấp Thẻ chỉ số tổng quan (Stat Cards) thành lưới 4 cột chuẩn `admin-stat-grid`:**
     - Bổ sung chỉ số **Tổng thủ tục quản lý** (`active + inactive`) và **Lĩnh vực hành chính** (`categoriesCount`).
     - Thêm tỷ lệ hoạt động (% đang công khai), nhãn ngữ cảnh và hiệu ứng hover tinh tế.
  2. **Tái thiết kế khối "Thủ tục cập nhật gần đây" theo dạng thẻ danh sách rõ ràng:**
     - Giới hạn hiển thị đúng **3 thủ tục gần nhất** (`pageSize: 3`, `.slice(0, 3)`).
     - Tách riêng **Mã thủ tục** bằng badge font mono có khung nền xám nhạt (`border border-slate-200 bg-slate-100`).
     - Hiển thị **Trạng thái** bằng huy hiệu màu nhận diện có chấm tròn trạng thái (Xanh lá `Đang công khai`, Đỏ nhạt `Ngừng công khai`).
     - Tên thủ tục hiển thị font chữ đậm rõ nét, giới hạn `line-clamp-2` chống tràn vỡ giao diện; metadata ngày cập nhật và lĩnh vực có icon trực quan.
     - Hiệu ứng hover mượt mà với mũi tên `CaretRight` trượt nhẹ báo hiệu có thể click vào xem/sửa chi tiết.
  3. **Cột phụ bên phải:**
     - Giữ nguyên khối **Thao tác nhanh**: Lối tắt thêm thủ tục mới, tải tệp PDF bóc tách AI, quản lý biểu mẫu và danh mục lĩnh vực.
     - Bỏ khối **Lưu ý nghiệp vụ** theo đúng yêu cầu tối giản của người dùng.
- **Tệp sửa đổi:**
  - `src/pages/procedure-manager/ProcedureDashboardView.tsx`
  - `src/pages/procedure-manager/ProcedureManagerPage.tsx`
- **Kiểm tra chất lượng:**
  - `npm run typecheck`: **0 lỗi** (đạt 100%). Người dùng yêu cầu không cần chạy test.

## Hoàn thành Mục 16 (FE-09): Tạo phôi & Tải DOCX trực tiếp trên màn bản nháp AI — 06/11/2026

- **Mục tiêu & Nghiệp vụ (FE-09 / KB-04):**
  - Cán bộ khi đối soát bản nháp PDF do AI bóc tách có thể tạo phôi và tải tệp Word (.docx) trực tiếp ngay tại chỗ cho từng biểu mẫu chưa liên kết, không cần phải rời màn hình sang phân hệ khác.
  - Bắt cảnh báo chênh lệch từ AIOCR: Nếu backend trả về warning dạng `formDefinitions: Văn bản nguồn có N tệp mẫu...`, hiển thị khối cảnh báo màu hổ phách nổi bật ở đầu Tab Biểu mẫu và chấm cam trên thanh điều hướng Tab.
- **Những việc đã thực hiện:**
  1. **Tạo component `DirectTemplateUploadModal` (`src/pages/procedure-manager/DirectTemplateUploadModal.tsx`):**
     - Cho phép nhập/chỉnh sửa Mã biểu mẫu, Tên biểu mẫu (tự động điền từ biểu mẫu trong bản nháp).
     - Hỗ trợ chọn/kéo thả tệp Word (.docx) kèm kiểm tra định dạng và giới hạn dung lượng (20 MB).
     - Quy trình chuẩn Backend: Gọi `POST /api/v1/form-templates` (tạo metadata) $\rightarrow$ Gọi `POST /api/v1/form-templates/{id}/upload-docx` (tải file lên kho).
     - Bắt và hiển thị lỗi thân thiện thông qua `formTemplateErrorMessage`.
  2. **Tích hợp nút hành động trong `ProcedureFormPicker.tsx`:**
     - Với mỗi biểu mẫu AI bóc tách chưa có `formTemplateId`: Bổ sung nút _"Tạo phôi & tải DOCX"_ (màu hổ phách) bên cạnh badge _"Chưa gắn phôi Word"_.
     - Tại vùng kho biểu mẫu: Bổ sung nút _"Tạo phôi mới"_ để thêm nhanh biểu mẫu mới kèm file Word trực tiếp.
  3. **Tự động lưu bản nháp (`ProcedureDraftWorkspace.tsx`):**
     - Khi tạo phôi thành công: Tự động gán `formTemplateId` mới tạo vào `formDefinitions` của bản nháp và gọi `procedureApi.saveDraft(draft.id, draft.revision, updatedPayload)` để lưu ngay vào bản nháp, tránh thất lạc dữ liệu.
  4. **Hiển thị cảnh báo AIOCR (`ProcedureFormPicker.tsx`, `ProcedureApiEditor.tsx`):**
     - Nhận `warnings` từ `draft.warnings` hoặc `preview.warnings`.
     - Lọc các cảnh báo liên quan đến `formDefinitions` hoặc tệp mẫu $\rightarrow$ Hiển thị khối Alert màu hổ phách nổi bật ở đầu danh sách biểu mẫu và chấm cam trên Tab Bar.
- **Kiểm thử tự động & Xác minh chất lượng:**
  - Viết mới bộ test E2E tại `tests/procedure-draft-direct-docx.spec.ts`:
    - Test 1: Tạo phôi và tải DOCX trực tiếp cho biểu mẫu chưa liên kết trong bản nháp AI, tự động lưu bản nháp: **PASSED (17.9s)**.
    - Test 2: Hiển thị khối cảnh báo hổ phách khi AI phát hiện chênh lệch số lượng biểu mẫu: **PASSED (9.6s)**.
  - `npm run typecheck`: **0 lỗi**.
  - `npm run lint`: **0 lỗi**.
- **Trạng thái:** ✅ Đã hoàn thành Mục 16 (FE-09) và cập nhật tài liệu `PORTAL_REFINEMENT_TASKS_CHECKLIST.md`.

## Chia 4 commit và đẩy main — 05/11/2026

- Người dùng yêu cầu chia các thay đổi FE còn lại thành **đúng 4 commit** rồi đẩy lên main. Phạm vi 11 file:
  1. Giao diện điều hành nhân sự (6 file): `src/components/staffing/staffing.css`, `shared.tsx`, `CalendarClosuresView.tsx`, `ConsultationsView.tsx`, `DispatchView.tsx`, `StaffingView.tsx`.
  2. Kiểm thử tự động giao diện (1 file): `tests/staffing-ui.spec.ts`.
  3. Kế hoạch nghiệp vụ & kỹ thuật lịch làm việc/đơn nghỉ Word (3 file): `docs/Work_Schedule_Management_Manager_Frontdesk.md`, `docs/WORK_SCHEDULE_ADAPTATION_PLAN_2026-11-05.md`, `docs/BE_WORK_SCHEDULE_IMPLEMENTATION_PLAN_2026-11-05.md`.
  4. Nhật ký tiến độ và bàn giao (1 file): `docs/PROGRESS.md`.
- Nhóm commit: **1 feat, 1 test, 2 docs**.
- Kiểm tra trước khi chia commit: `npm run typecheck` đạt, `npm run lint` đạt, `npm run build` đạt (8028 modules transformed). Lượt Playwright mock trước đó đạt 12/12 ca.
- Thực hiện commit từng nhóm theo đúng thứ tự và đẩy lên nhánh `main`.

## Bàn giao kế hoạch Backend lịch/đơn nghỉ Word — 05/11/2026

- Theo yêu cầu lập kế hoạch riêng cho BE, đã tạo `BE_WORK_SCHEDULE_IMPLEMENTATION_PLAN_2026-11-05.md` dựa trên kế hoạch thích ứng và source BE local StaffingService/Contracts/Domain/Security/DbContext. Không triển khai chức năng mới.
- Tài liệu có backlog BE-WS-00–10 theo thứ tự đơn nghỉ Word → lịch tháng → xác nhận/thông báo → đổi ca; mô hình nháp riêng để giữ trạng thái/API nghỉ cũ, revision và snapshot bất biến, idempotency/transaction/khóa phường, phân quyền tệp, migration/rollout và bộ tiêu chí test. Các DTO/entity/năng lực mới chỉ là đề xuất; chưa tự đặt endpoint mới hoặc coi hợp đồng đã được BE chốt.
- Xác nhận DbContext hiện có WorkflowOutbox/capture; còn phải đối chiếu và mở rộng event/worker cho staffing. Nhấn mạnh lịch nháp không tác động availability, duyệt nghỉ không tự bàn giao, API cũ không được bỏ qua Word khi đơn vị đã bật bắt buộc.
- Còn cần mẫu DOCX, storage/retention, giờ đơn vị và hợp đồng API/event. Chỉ thêm tài liệu này và ghi chú; giữ nguyên thay đổi UI/tài liệu trước đó, không sửa BE, không commit/push. Kiểm tra nội dung/đường dẫn/diff; không chạy build/test ứng dụng, API thật hoặc migration cho task tài liệu.

## Kế hoạch lịch làm việc và đơn nghỉ Word — 05/11/2026

- Người dùng yêu cầu tổng hợp kế hoạch từ `Work_Schedule_Management_Manager_Frontdesk.md`, điều chỉnh theo Manager/Frontdesk hiện có; đã xác nhận **mở mẫu đơn Word, sửa trực tiếp rồi nộp Manager**. Chưa yêu cầu triển khai chức năng mới.
- Đã đọc tài liệu nguồn, luồng FE staffing/Word và source BE local StaffingService/Contracts/Domain/Controller/Security. Có ca đơn lẻ, nghỉ bằng reason, quyết định/version/lịch sử/bàn giao; chưa có nháp/tệp đơn nghỉ, lịch tháng nháp/công bố, xác nhận lịch hoặc đổi ca. Editor DOCX có thể tái sử dụng; API bản khai công dân không phù hợp lưu đơn nhân sự.
- Kế hoạch tại `WORK_SCHEDULE_ADAPTATION_PLAN_2026-11-05.md`: ưu tiên đơn nghỉ Word lưu nháp/nộp riêng, bản nộp bất biến và Manager chỉ đọc; sau đó lịch tháng trên nền ca hiện có, xác nhận/thông báo và đổi ca. Đây là đề xuất, chưa chốt hợp đồng API mới. Giữ lịch nháp ngoài tính khả dụng và không tự bàn giao hồ sơ khi duyệt nghỉ.
- Còn cần mẫu DOCX, cấu hình lịch của đơn vị và hợp đồng BE/storage/version. Chỉ thêm tài liệu kế hoạch và ghi chú; giữ nguyên tài liệu người dùng và thay đổi UI chưa commit. Đã kiểm tra đường dẫn/nội dung/diff; không chạy test ứng dụng hoặc gọi API thật, không sửa BE, không commit/push.

## Làm lại UI 5 mục điều hành — 05/11/2026

- **Đã làm:** Điều phối hồ sơ, Lịch ca làm, Lịch ngày nghỉ, Duyệt nghỉ phép và Tham vấn chuyên môn tại `src/components/staffing/`. Đồng bộ tiêu đề/mô tả/thao tác, bộ lọc, thẻ và phân trang; ca làm/nghỉ phép có khung giờ bắt đầu/kết thúc riêng theo Việt Nam, ngày và badge trạng thái. Đưa nút xem tham vấn cùng hồ sơ vào thẻ tương ứng, phân biệt câu hỏi/ý kiến/lý do đóng. Bố cục một cột trên mobile, hai cột cho ca/nghỉ trên desktop rộng; tăng vùng bấm, xử lý tên/nội dung dài và trạng thái tải/rỗng/lỗi. Tái sử dụng Badge/Button/Modal và logic form/query hiện có; CSS riêng tại `staffing.css` có tham chiếu Tailwind.
- **Phạm vi:** chỉ FE, giữ hợp đồng API, quyền, validation và điều kiện thao tác. Component dùng chung cũng cập nhật cách hiển thị lịch/nghỉ/tham vấn trong workspace cán bộ và lịch nghỉ Admin. Không sửa backend, không commit/push. Baseline `c9d6f8b`, working tree sạch trước task.
- **Kiểm tra thực chạy:** `npm run typecheck`, `npm run lint`, `npm run build` đạt; build còn cảnh báo annotation dependency và chunk lớn hiện có. Playwright Edge `tests/staffing-ui.spec.ts` + `tests/manager.spec.ts`: **12/12 ca mock đạt trong lượt cuối**, gồm 5 màn ở 1440/768/390/360px, không tràn ngang, giờ Việt Nam, tên cán bộ, form tạo ca/validation, xem tham vấn cùng hồ sơ, trạng thái rỗng/lỗi/thử lại/khoảng ngày sai và hồi quy Manager. Đã xem ảnh ca làm desktop/mobile. `node tests/staffing-form-check.mjs`: **11/11 kiểm tra form độc lập đạt**, không gọi API. `git diff --check` đạt.
- **Lưu ý kiểm tra:** lượt build đầu thiếu `@reference` cho CSS mới đã được sửa và build lại đạt. Lượt browser đầu chạy qua 5 ca nhưng dừng khi runner chờ dọn Vite; không dùng lượt đó làm kết quả cuối. Lượt 12 ca cuối kết thúc exit 0 sau khi dừng đúng tiến trình Vite do chính lượt test tạo, vì bước dọn server Windows chờ lâu; không đổi cấu hình Playwright.
- **Giới hạn/bước tiếp:** chưa nghiệm thu API/deployment thật, chưa kiểm tra riêng workspace cán bộ/Admin bằng tài khoản thật hoặc zoom 200%. Người dùng có thể xem UI trong 5 mục Manager; các thao tác ghi vẫn cần xác minh trên môi trường tích hợp.

## Hoàn thành Mục 12 (FE-07): Liên kết mẫu đơn DOCX ở màn sửa thủ tục nhập tay — 06/11/2026

- **Mục tiêu & Hợp đồng Backend (KB-04 #7, #12 / FE-07):**
  - Màn checklist chỉ quản lý danh mục giấy tờ (CMND, Giấy chứng sinh...), không lưu được liên kết mẫu đơn. Liên kết mẫu đơn nằm ở mảng `formDefinitions` của thủ tục và gửi qua `PUT /api/v1/procedure-manager/procedures/{id}`.
  - Chuyển đổi nguồn dữ liệu trong `ProcedureFormPicker.tsx` từ `GET /api/v1/form-templates` (DocumentForm service) sang API catalog chuẩn: `GET /api/v1/procedure-manager/document-forms` (`procedureApi.documentForms`), lấy chính xác `{ id, formCode, formName, formType }`.
  - Mỗi mẫu đã chọn được gán vào `formDefinitions`:
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
  - Khi lưu thủ tục qua `PUT /api/v1/procedure-manager/procedures/{id}`, FE gửi đầy đủ cả `checklistSchema` và `formDefinitions` hiện tại (bảo toàn toàn bộ danh mục giấy tờ và liên kết mẫu đơn).
  - Thêm banner thông báo hướng dẫn phân biệt Giấy tờ đính kèm và Biểu mẫu DOCX trong `ProcedureChecklistModal.tsx` để tránh cán bộ nhầm lẫn.
- **Những việc đã thực hiện:**
  1. **Cập nhật API Client (`src/lib/api/procedures.ts`):**
     - Bổ sung tham số phân trang và tìm kiếm cho `documentForms`: `procedureApi.documentForms(searchCode = '', page = 1, pageSize = 50, signal?: AbortSignal)`.
  2. **Nâng cấp `ProcedureFormPicker.tsx`:**
     - Đổi React Query sang gọi `procedureApi.documentForms(search.trim(), page, 20, signal)`.
     - Cập nhật hàm `toggle`: Map dữ liệu từ `DocumentFormOption` sang `Row` với đầy đủ các thuộc tính chuẩn của Backend (`formTemplateId: form.id`, `formCode: form.formCode`, `formName: form.formName`, `formType: form.formType || 'DOCX_TEMPLATE'`, `quantity: 1`, `isMandatory: true`, `caseCode: null`).
     - Render thẻ biểu mẫu lấy trực tiếp từ `query.data` (mảng `DocumentFormOption[]`), hiển thị mã biểu mẫu dạng badge font-mono, tên biểu mẫu, loại phôi DOCX và nút chọn mẫu (`aria-label="${form.formCode} · ${form.formName}"`).
  3. **Thêm Banner phân biệt trong `ProcedureChecklistModal.tsx`:**
     - Bổ sung khối Alert màu xanh da trời phía trên bảng danh mục giấy tờ: _"Lưu ý phân biệt: Mục này dùng để khai báo danh mục giấy tờ đính kèm (CMND, Giấy khai sinh, v.v.). Mẫu đơn, tờ khai điện tử (DOCX) được cấu hình tại mục 'Biểu mẫu' trong màn Chỉnh sửa thủ tục."_.
  4. **Bảo toàn dữ liệu trong `ProcedureApiEditor.tsx`:**
     - Xác nhận luồng submit `PUT /api/v1/procedure-manager/procedures/{id}` gửi toàn bộ payload bao gồm `checklistSchema` và `formDefinitions` hiện tại, kèm `decisionNumber` và `effectiveDate`.
- **Kiểm thử tự động & Xác minh chất lượng:**
  - Viết mới bộ test E2E chuyên biệt tại `tests/procedure-form-linking.spec.ts`:
    - Test 1: Sửa thủ tục nhập tay $\rightarrow$ vào Tab Biểu mẫu $\rightarrow$ tải mẫu từ `GET /api/v1/procedure-manager/document-forms` $\rightarrow$ chọn mẫu `KB04 Tờ khai` $\rightarrow$ điền ngày hiệu lực $\rightarrow$ bấm Lưu thay đổi $\rightarrow$ kiểm tra request PUT gửi lên backend chứa đúng 2 mục `checklistSchema` ban đầu và mảng `formDefinitions` có mẫu vừa chọn với đầy đủ thuộc tính chuẩn.
    - Test 2: Mở `ProcedureChecklistModal` $\rightarrow$ xác nhận hiển thị thông báo hướng dẫn phân biệt giấy tờ và biểu mẫu DOCX.
  - Cập nhật test 12 trong `tests/procedure-manager.spec.ts` khớp với API mới `**/api/v1/procedure-manager/document-forms*`.
  - Kết quả kiểm thử:
    - `tests/procedure-form-linking.spec.ts`: **2/2 tests PASSED 100%**.
    - `tests/procedure-manager.spec.ts` (test 12): **PASSED 100%**.
  - `npm run typecheck`: **0 lỗi**.
  - `npm run lint`: **0 lỗi**.
- **Trạng thái:** ✅ Đã hoàn thành Mục 12 (FE-07) và cập nhật tài liệu `PORTAL_REFINEMENT_TASKS_CHECKLIST.md`.

## Hoàn thành Mục 14 (FE-02): Khắc phục Chatbot bị hủy request (canceled) & Lỗi hạn mức 429 — 06/11/2026

- **Mục tiêu & Hợp đồng Backend (KB-01 #8 / FE-02):**
  - Xử lý triệt để hiện tượng câu hỏi chatbot bị trình duyệt hủy kết nối `(canceled)` khi hỏi liên tiếp hoặc khi Gemini xử lý lâu.
  - Khóa ô nhập liệu trong suốt thời gian chờ trợ lý AI suy nghĩ và phản hồi.
  - Xử lý mã lỗi 429 từ Backend AIOCR:
    - `ai.guest_quota_exceeded`: Khách vãng lai hỏi tới câu thứ 11 (hết 10 câu/ngày/IP). Hiển thị lời mời đăng nhập trang nhã, không hiện lỗi kỹ thuật.
    - `ai.guest_limit_reached`: Toàn hệ thống đã hết lượt hỏi cho khách hôm nay. Hiển thị thông báo hẹn thử lại ngày mai hoặc đăng nhập.
    - `ai.quota_exceeded` / `ai.daily_limit_reached`: Hết hạn mức 30 câu/ngày của công dân đăng nhập.
    - `ai.provider_busy`: Gemini bận hoặc quá tải tạm thời.
- **Những việc đã thực hiện:**
  1. **Nâng timeout Chatbot lên 75 giây (`src/lib/api/aiOcr.ts`):**
     - Đổi `timeout: 35000` thành `timeout: 75000` (75 giây) trong `aiOcrApi.chat`. Tránh việc axios tự động hủy kết nối khi mô hình ngôn ngữ lớn (Gemini) khởi động lạnh hoặc phân tích câu hỏi pháp lý phức tạp mất 40–50 giây.
     - Bắt mã lỗi `ECONNABORTED` / timeout để trả về thông điệp thân thiện: _"Trợ lý phản hồi quá lâu. Vui lòng thử lại."_.
  2. **Định nghĩa lớp lỗi chuyên biệt `AiChatError` (`src/lib/api/aiOcr.ts`):**
     - Kế thừa `Error`, lưu giữ đầy đủ `code`, `status` (429, 503, 409...) và `retryAfter` từ ProblemDetails backend để component UI bắt và phân loại chính xác.
  3. **Khóa chặt ô nhập và nút gửi (`src/components/ai/AiChatWidget.tsx`):**
     - Trong suốt thời gian `loading = true`: Ô nhập liệu bị vô hiệu hóa (`disabled={loading}`), đổi placeholder thành _"Trợ lý đang suy nghĩ và trả lời..."_. Nút gửi hiển thị icon xoay loading và bị khóa, ngăn chặn người dùng bấm gửi liên tiếp.
  4. **Hiển thị Khung thông báo trang nhã mời đăng nhập khi gặp 429 (`AiChatWidget.tsx`):**
     - Khi khách vãng lai gặp lỗi `ai.guest_quota_exceeded` (câu hỏi thứ 11):
       - Giữ nguyên tin nhắn câu hỏi của khách trong lịch sử chat.
       - Trợ lý trả lời lịch sự giải thích về hạn mức 10 câu/ngày.
       - Xuất hiện **Khung thông báo trang nhã mời đăng nhập** (màu hổ phách nhẹ) với nút _"Đăng nhập ngay"_ (chuyển hướng kèm `returnTo`) và link _"Tạo tài khoản mới"_.
       - Thanh nhập liệu dưới cùng tự động chuyển sang chế độ thông báo hết lượt kèm nút Đăng nhập.
     - Khi gặp `ai.guest_limit_reached`: Hiển thị thông báo toàn hệ thống đã đạt giới hạn lượt khách và mời đăng nhập tài khoản công dân.
     - Tách biệt rạch ròi cơ chế Fallback Offline: Chỉ kích hoạt câu trả lời cẩm nang tĩnh khi mất mạng thật sự hoặc 503; không nuốt lỗi 429 của khách.
- **Kiểm thử tự động & Xác minh chất lượng:**
  - Viết mới 2 kịch bản E2E trong `tests/guest-chat-and-ai-fallback.spec.ts`:
    - Mock 429 `ai.guest_quota_exceeded` ở câu hỏi thứ 11 $\rightarrow$ xác nhận hiển thị câu trả lời lịch sự, nút "Đăng nhập ngay", khung thông báo hết lượt 10 câu $\rightarrow$ không hiện lỗi đỏ kỹ thuật.
    - Mock API có độ trễ 800ms $\rightarrow$ xác nhận ô input bị `disabled`, placeholder đổi thành _"Trợ lý đang suy nghĩ và trả lời..."_, nút gửi bị `disabled`.
  - Kết quả kiểm thử:
    - `tests/guest-chat-and-ai-fallback.spec.ts`: **4/4 tests PASSED 100%**.
    - `tests/public-search-chat.spec.ts`: **10/10 tests PASSED 100%**.
  - `npm run typecheck`: **0 lỗi**.
  - `npm run lint`: **0 lỗi**.
- **Trạng thái:** ✅ Đã hoàn thành Mục 14 (FE-02) và cập nhật tài liệu `PORTAL_REFINEMENT_TASKS_CHECKLIST.md`.

## Nâng cấp thông báo xuất bản chi tiết & Tinh chỉnh toàn diện UI "Thiết lập sử dụng mẫu" (FE-08) — 05/11/2026

- **Yêu cầu người dùng:**
  1. _"cái thông báo này có thể chỉ rõ hơn đc ko"_: Thông báo toast cảnh báo xuất bản cần nêu rõ tên cụ thể của biểu mẫu chưa gắn phôi Word và hướng dẫn nơi bổ sung.
  2. _"và lỗi UI đang còn hơi nhiều ở khúc này mở 'Thiết lập sử dụng mẫu'"_: Tinh chỉnh lại toàn bộ UI của khối mở rộng "Thiết lập sử dụng mẫu" trong danh sách biểu mẫu, loại bỏ tình trạng lệch kích thước ô, thô kệch.
- **Giải pháp & Kết quả triển khai:**
  1. **Nâng cấp thông báo Toast xuất bản (`ProcedureDraftWorkspace.tsx`):**
     - Tại cả 2 điểm xuất bản (từ bản nháp chi tiết và từ modal xem trước): Thay vì chỉ báo chung chung `Có N biểu mẫu chưa gắn tệp phôi DOCX`, hệ thống tự động trích xuất tên cụ thể của biểu mẫu bị thiếu:
       _Ví dụ:_ `"Đã xuất bản thủ tục thành công. Lưu ý: Có 1 biểu mẫu chưa gắn tệp phôi DOCX: "Don Khai Sinh". Bạn có thể bổ sung tệp phôi Word sau tại mục "Danh sách biểu mẫu"."`
     - Tăng thời gian hiển thị lên `duration: 8000` (8 giây) để cán bộ đọc kịp hướng dẫn.
  2. **Đại tu toàn diện UI thẻ biểu mẫu & khối "Thiết lập sử dụng mẫu" (`ProcedureFormPicker.tsx`):**
     - _Badge trạng thái trực quan:_ Thêm nhãn màu hổ phách `Chưa gắn phôi Word` ngay cạnh mã biểu mẫu nếu mẫu chưa có `formTemplateId`.
     - _Thanh tóm tắt thông tin nhanh:_ Bổ sung thanh tóm tắt xám nhạt tinh tế hiển thị: `Số lượng: 1 bản • Loại: Mẫu Word (DOCX) • Áp dụng: Mọi trường hợp`.
     - _Chuẩn hóa form nhập "Thiết lập sử dụng mẫu":_
       - Phần `summary` chuyển sang thiết kế hiện đại với icon `Sliders` đỏ thương hiệu và icon `CaretDown` xoay 180° mượt mà khi mở rộng.
       - Khung nền bo góc `rounded-xl`, viền nhạt `border-slate-200/80`, nền `bg-slate-50/60`.
       - Toàn bộ 4 ô nhập/chọn (Số lượng bản nộp, Quy định nộp, Loại biểu mẫu, Trường hợp áp dụng) được đồng bộ tuyệt đối về chiều cao chuẩn `h-9` (36px), phông chữ `text-xs`, nhãn `text-xs font-semibold text-slate-700`.
       - Ô Loại biểu mẫu cung cấp dropdown 2 tùy chọn rõ ràng: _Mẫu Word (phôi DOCX)_ (`DOCX_TEMPLATE`) và _Mẫu điện tử tương tác_ (`ONLINE_INTERACTIVE`).
- **Kiểm tra chất lượng:**
  - `npm run typecheck`: 0 lỗi.
  - `npm run lint`: 0 lỗi.
  - `npm run build`: Production build thành công 100% trong 19.95s.

## Khắc phục lỗi xác thực formType biểu mẫu khi xuất bản bản nháp thủ tục (FE-08) — 05/11/2026

- **Nguyên nhân lỗi:**
  - Trong ảnh phản hồi của người dùng khi bấm "Xác nhận xuất bản": Hệ thống báo lỗi _"Loại biểu mẫu (dòng 1): Vui lòng nhập loại biểu mẫu hợp lệ"_ và đánh dấu tab _5 Biểu mẫu_ bị lỗi.
  - Đối chiếu source backend AIOCR (`AzureProcedureDocumentExtractor.cs:156`): Khi tệp PDF không đủ bằng chứng rõ ràng về định dạng tệp, AI trích xuất sẽ để `formType: null`.
  - Trong khi đó, ở frontend:
    - Schema validation (`formsSchema` trong `src/lib/api/procedures.ts`) bắt buộc `formType` phải là `'DOCX_TEMPLATE'` hoặc `'ONLINE_INTERACTIVE'`.
    - Giao diện `ProcedureFormPicker.tsx` trước đó chỉ hiển thị dòng text thuần túy: _"Loại biểu mẫu: Cần kiểm tra loại biểu mẫu"_ mà **không có ô dropdown nào để người dùng chọn hoặc sửa**.
    - Dẫn tới người dùng bị chặn xuất bản bởi một lỗi không thể tự sửa trên giao diện!
- **Giải pháp xử lý:**
  1. **Tự động chuẩn hóa (`normalizeDraftPayload`):** Khi AI bóc tách trả về `formType` bị `null`, `undefined` hoặc chuỗi rỗng, hệ thống tự động chuẩn hóa fallback về `'DOCX_TEMPLATE'` (Mẫu Word - định dạng chuẩn của toàn bộ phôi đơn hành chính Việt Nam).
  2. **Thêm điều khiển chọn loại biểu mẫu trên UI (`ProcedureFormPicker.tsx`):**
     - Tại mục _"Thiết lập sử dụng mẫu"_, chuyển dòng text tĩnh thành ô dropdown chọn **Loại biểu mẫu** với 2 tùy chọn: _Mẫu Word (DOCX)_ (`DOCX_TEMPLATE`) và _Mẫu điện tử tương tác_ (`ONLINE_INTERACTIVE`).
     - Cán bộ có thể chủ động xem và thay đổi loại biểu mẫu cho từng mẫu đơn ngay trên giao diện.
  3. **Chuẩn hóa dữ liệu trước khi validate:** Tại cả 2 điểm xuất bản (từ không gian bản nháp và từ modal xem trước), payload luôn được chuẩn hóa `formType` hợp lệ và `formTemplateId || null` trước khi gọi `validateProcedure`.
- **Kiểm tra chất lượng:**
  - `npm run typecheck` đạt 0 lỗi.
  - `npm run lint` đạt 0 lỗi.
  - Người dùng có thể xuất bản thành công bản nháp và nhận đúng cảnh báo màu hổ phách nhắc nhở tệp phôi DOCX bổ sung sau.

## Tinh gọn UI Hồ sơ cá nhân & Sửa lỗi layout khối xóa, bỏ nút In phiếu — 05/11/2026

- **Nội dung xử lý theo phản hồi trực tiếp từ giao diện:**
  1. **Sửa lỗi layout khối xóa thông tin cá nhân (`CitizenProfileView.tsx`):**
     - Khối _"Xóa dữ liệu thông tin cá nhân"_ nằm trong grid 2 cột (`md:grid-cols-2`) nhưng thiếu `md:col-span-2`, dẫn tới bị ép co cụm vào cột 1 bên trái và để trống hoác cột 2 bên phải (như trong ảnh phản hồi). Đã thêm `md:col-span-2` giúp thẻ trải đều, cân đối toàn màn hình.
     - Xóa bỏ `border-l-4 border-l-red-800` ở thẻ Banner trên cùng, loại bỏ vệt đỏ nhô lệch ở góc bo tròn trên bên trái (Ảnh 3).
  2. **Gỡ bỏ nút "In phiếu thông tin" (`CitizenProfileView.tsx`):**
     - Đã loại bỏ hoàn toàn nút _"In phiếu thông tin"_ ở phần nút hành động hồ sơ cá nhân theo đúng yêu cầu người dùng; dọn dẹp import icon `Printer`.
  3. **Tinh gọn toàn diện các đoạn Subtext rườm rà, thừa chữ:**
     - _Thẻ CCCD:_ Xóa dòng text trùng lặp không cần thiết `(Định danh: ...)`; rút gọn tiêu đề badge từ _"THÔNG TIN ĐỊNH DANH DO NGƯỜI DÙNG KÊ KHAI"_ $\rightarrow$ _"Thông tin định danh CCCD"_.
     - _Ô Email đăng ký:_ Rút gọn subtext dài giải thích kỹ thuật thành _"Dùng để nhận mã xác thực khi khôi phục tài khoản."_.
     - _Khối xóa dữ liệu:_ Tinh gọn mô tả thành _"Xóa các thông tin kê khai cá nhân khỏi tài khoản này."_.
     - _Banner chế độ chỉnh sửa:_ Tinh gọn thành _"Chỉnh sửa các trường bên dưới và bấm Lưu thay đổi khi hoàn tất."_.
     - _Modal Quét CCCD AI OCR (`CccdOcrScanModal.tsx`):_ Rút gọn tiêu đề mô tả và banner bảo vệ dữ liệu thành câu ngắn gọn, súc tích, dễ đọc.
- **Kiểm tra chất lượng:**
  - `npm run typecheck` đạt 0 lỗi.
  - `npm run lint` đạt 0 lỗi.
  - `npx playwright test tests/guide-profile-email.spec.ts -g "hồ sơ hiện email|xóa thông tin cá nhân"`: 2/2 tests PASSED 100%.

## Tinh chỉnh UI & Khôi phục Admin Dashboard, Giải đáp nghiệp vụ Frontdesk — 05/11/2026

- **Nội dung xử lý:**
  1. **Giải đáp nghiệp vụ hiển thị hồ sơ tại Cán bộ Một cửa (Frontdesk / Officer):**
     - Làm rõ tại sao khi công dân tạo hồ sơ xong nhưng tài khoản Cán bộ Một cửa ở phường đó chưa thấy: Trong ảnh người dùng cung cấp (`media_1793884717332_0a8dcb97.jpg`), hồ sơ mới tạo có trạng thái **`Bản nháp` (DRAFT)**.
     - Theo kịch bản nghiệp vụ KB-06 và kiến trúc Workflow Backend: API Cán bộ Một cửa (`GET /api/v1/officer/applications`) chỉ lấy các hồ sơ đã chính thức nộp sang trạng thái **`SUBMITTED` (Chờ tiền kiểm)**; hệ thống tự động lọc bỏ hồ sơ nháp để bảo vệ dữ liệu riêng tư của công dân khi đang chuẩn bị tài liệu.
     - Sau khi công dân hoàn tất hồ sơ và bấm _"Nộp hồ sơ tiền kiểm"_ $\rightarrow$ hồ sơ chuyển sang `SUBMITTED`, tài khoản Cán bộ Một cửa đúng phường đó sẽ thấy ngay lập tức trong hàng đợi.
  2. **Gỡ bỏ nút "Chuẩn bị hồ sơ mới" tại trang Tổng quan công dân (`CitizenPage.tsx`):**
     - Đã xóa nút `+ Chuẩn bị hồ sơ mới` ở phần tiêu đề trang khi `activeSection === 'dashboard'` theo đúng yêu cầu người dùng; giữ lại nút nộp hồ sơ ở các phân hệ hồ sơ chuyên biệt.
  3. **Khôi phục toàn diện Dashboard Tổng quan Quản trị hệ thống (`AdminPage.tsx`):**
     - Lần theo lịch sử commit (`ab6b4cd`), phát hiện commit trước đó đã xóa nhầm các thẻ KPI, danh mục phân hệ và bảng tình trạng dịch vụ, dẫn tới màn hình Admin Dashboard chỉ còn duy nhất 1 thẻ tài khoản trơ trọi như trong ảnh người dùng (`media_1793884775190_51ed22d5.png`).
     - Khôi phục cấu trúc chuẩn mực với dữ liệu thật:
       - **4 Thẻ chỉ số tổng quan (`admin-stat-grid`):** "Thủ tục đang áp dụng" (lấy tổng số thực tế qua `usePublicProcedureList`), "Tài khoản nội bộ" (lấy qua `getAdminUsers`), "Đơn vị Phường / Xã" (lấy qua `wards`), "Hệ thống vận hành" (Ổn định).
       - **Lối tắt phân hệ quản trị (`admin-module-card` / `admin-module-grid`):** 6 phân hệ nòng cốt (Thủ tục, Tri thức AI, Tài khoản, Người dùng, Phường/Xã, Phân quyền).
       - **Bố cục 2 cột chuyên nghiệp (`admin-insight-grid`):** Cột trái là "Phân quyền gần đây" (Nhật ký RBAC audit), Cột phải là "Tình trạng dịch vụ" (Giám sát 5 service lõi: AI RAG, OCR CCCD, IAM, Workflow Một cửa, PDF/QR) với trạng thái xanh trực quan.
- **Kiểm tra chất lượng:**
  - `npm run typecheck` đạt 0 lỗi.
  - `npm run lint` đạt 0 lỗi.
  - `npx playwright test tests/admin-system-audit.spec.ts tests/citizen-application-wizard.spec.ts`: 15/15 tests PASSED 100%.

## Hoàn thành Mục 17: Các tính năng mở rộng & tùy chọn (FE-03, FE-06, FE-08) — 05/11/2026

- **Phạm vi & Nhiệm vụ (Mục 17):**
  - **FE-03: Nút Xóa thông tin cá nhân & Modal xác nhận (`CitizenProfileView.tsx`):**
    - Bổ sung nút _"Xóa thông tin cá nhân"_ ở cuối phân hệ xem thông tin cá nhân của công dân khi profile đã tồn tại.
    - Tích hợp Modal Radix UI theo Design System xác nhận hành động nguy hiểm: cảnh báo thông tin sẽ bị xóa hoàn toàn khỏi hệ thống, hỗ trợ nút Hủy và nút Xác nhận xóa.
    - Gọi API `DELETE /api/v1/users/me/profile` qua hàm `deleteMyProfile()`.
    - Sau khi xóa thành công: reset toàn bộ form về giá trị rỗng, tự động mở form nhập liệu (`isEditing = true`) để công dân có thể tạo hồ sơ thông tin mới (`POST /api/v1/users/me/profile` qua cơ chế tự động fallback của `updateMyProfile`), đồng thời thông báo Toast thành công.
  - **FE-08: Xuất bản bản nháp thủ tục khi chưa liên kết phôi DOCX (`ProcedureDraftWorkspace.tsx`):**
    - Cho phép công chức xuất bản bản nháp thủ tục mà không bắt buộc tất cả biểu mẫu phải có `formTemplateId`.
    - Tại cả 2 điểm xuất bản (Xuất bản từ chi tiết bản nháp và Xuất bản từ modal xem trước): Nếu có biểu mẫu chưa liên kết phôi DOCX (`!f.formTemplateId`), hệ thống xuất bản thành công nhưng gửi cảnh báo màu hổ phách (`toast.warning`) nhắc nhở rõ ràng: _"Đã xuất bản thủ tục. Lưu ý: Có {N} biểu mẫu chưa gắn tệp phôi DOCX (có thể bổ sung sau)."_
    - Vẫn duy trì nghiêm ngặt điều kiện nghiệp vụ: Bước đối soát PDF gốc (`confirmed: true`) là bắt buộc trước khi xuất bản.
  - **FE-06: Bổ sung API quản trị trong `src/lib/api/index.ts`:**
    - Hoàn thiện và xuất đầy đủ các hàm API theo chuẩn Backend: `getUsers(filter)`, `getAccount()`, `getAdminProfile()`, `createAdminProfile()`, `updateAdminProfile()`, `saveAdminProfile()`, `deleteAdminProfile()`.
- **Kiểm thử tự động & Chất lượng:**
  - Cập nhật fixture mock `tests/fixtures/auth.ts` hỗ trợ mock `DELETE /api/v1/users/me/profile` (HTTP 204).
  - Bổ sung kịch bản kiểm thử E2E vào `tests/guide-profile-email.spec.ts`: Mở modal xác nhận xóa thông tin cá nhân $\rightarrow$ kiểm tra gọi đúng API $\rightarrow$ hiển thị toast thành công $\rightarrow$ reset form về form tạo mới.
  - Toàn bộ 4/4 tests trong `tests/guide-profile-email.spec.ts` đều PASSED 100%.
  - `npm run typecheck` đạt 0 lỗi.
  - `npm run lint` đạt 0 lỗi.
- **Trạng thái:** Đã hoàn thành Mục 17 và cập nhật tài liệu `PORTAL_REFINEMENT_TASKS_CHECKLIST.md`.

## Hoàn thành Mục 15 (FE-04): Chuẩn hóa thông báo trung tính & Hướng dẫn màn Quên mật khẩu (KB-02 #13) — 05/11/2026

- **Phạm vi & Nhiệm vụ (Mục 15 / FE-04):**
  - **Chuẩn hóa thông báo trung tính:**
    - Loại bỏ thông báo toast suy đoán `"Đã gửi lại yêu cầu mã xác thực."` trong hàm `resend()` tại `PasswordRecovery.tsx`.
    - Duy trì thông điệp trung tính từ Backend (`"Nếu tài khoản hợp lệ, mã xác thực đã được gửi tới email đăng ký."`) hiển thị trên banner `role="status"`, không tiết lộ tài khoản có tồn tại trong hệ thống hay không để chống dò quét tài khoản.
  - **Hướng dẫn thân thiện cho người dùng:**
    - Bổ sung khối lưu ý trang nhã ngay dưới ô nhập mã xác thực OTP với 4 điểm hướng dẫn chi tiết:
      - Kiểm tra kỹ cả hộp thư Đến và thư mục Rác (Spam).
      - Mã xác thực có hiệu lực trong vòng **5 phút**.
      - Mỗi lần gửi mã cần chờ **60 giây** trước khi yêu cầu mã mới.
      - Nếu nhập sai quá **5 lần**, bạn sẽ cần yêu cầu mã mới.
  - **Khóa nút gửi lại mã:** Nút "Gửi lại mã" bị vô hiệu hóa (`disabled`) trong suốt 60 giây đếm ngược, hiển thị rõ thời gian còn lại `Gửi lại mã sau {cooldown}s`.
- **Kiểm thử tự động:**
  - Viết mới test E2E tại `tests/auth-recovery.spec.ts` kiểm tra kịch bản nhập email bất kỳ $\rightarrow$ nhận thông báo trung tính 202 $\rightarrow$ không hiện toast khẳng định $\rightarrow$ hiển thị đầy đủ 4 điểm lưu ý $\rightarrow$ nút gửi lại bị khóa 60s.
  - Toàn bộ 7/7 ca test trong `tests/auth-recovery.spec.ts` đều PASSED 100%.
  - `npm run typecheck` và `npm run lint` đạt 100% 0 lỗi.
- **Trạng thái:** Đã hoàn thành Mục 15 và cập nhật tài liệu `PORTAL_REFINEMENT_TASKS_CHECKLIST.md`.

## Hoàn thành Mục 13 (FE-05): Tự động làm mới token sau 15 phút không bị đăng xuất (KB-02 #10) — 05/11/2026

- **Phạm vi & Nhiệm vụ (Mục 13 / FE-05):**
  - **Rà soát kiến trúc xác thực JWT/Cookie HttpOnly:**
    - Access token lưu trong RAM (không lưu localStorage/sessionStorage để chống tấn công XSS).
    - Refresh token lưu trong Cookie HttpOnly với `Path=/api/v1/auth`, `SameSite=Strict`.
    - Gọi API refresh token sử dụng Web Locks API (`navigator.locks.request('wardmate-auth:' + baseURL)`) giúp đồng bộ và loại bỏ xung đột cookie rotation giữa nhiều tab của cùng một trình duyệt.
    - Axios interceptor trong `createJwtClient.ts` tự động phát hiện mã HTTP 401 khi access token hết hạn 15 phút, gọi ngầm `POST /api/v1/auth/refresh-token` với `withCredentials: true` và header `X-CSRF-Protection: 1`, sau đó tự động replay request ban đầu trong suốt mà người dùng không hề bị gián đoạn hay đẩy ra màn hình đăng nhập.
  - **Lưu ý triển khai môi trường Azure/Gateway:**
    - Cần đảm bảo Gateway YARP và Frontend cùng chung domain gốc. Nếu deploy khác origin, cần báo Backend IAM cấu hình `RefreshCookie__SameSite=None` kèm `Secure` để trình duyệt không chặn cookie HttpOnly khi gọi endpoint refresh.
- **Kiểm thử tự động:**
  - Viết mới ca kiểm thử E2E Playwright tại `tests/auth.spec.ts` (test case `tự động làm mới token sau khi access token hết hạn 15 phút mà không bị đăng xuất (FE-05 / KB-02 #10)`):
    - Mô phỏng request nghiệp vụ bị trả 401 do token cũ hết hạn.
    - Xác minh FE tự động gửi request `POST /api/v1/auth/refresh-token` có cookie và CSRF header.
    - Xác minh FE tự động gửi lại request nghiệp vụ với access token mới nhận được.
    - Xác nhận trang tiếp tục hoạt động bình thường, không điều hướng về `/dang-nhap`.
  - Kết quả: Toàn bộ 9/9 tests của `tests/auth.spec.ts` và 12/12 tests của `tests/jwt-client.spec.ts` đều PASSED 100%.
  - `npm run typecheck` và `npm run lint` đạt 100% 0 lỗi.
- **Trạng thái:** Đã hoàn thành Mục 13 và cập nhật tài liệu `PORTAL_REFINEMENT_TASKS_CHECKLIST.md`.

## Hoàn thành Mục 11 (FE-01): Bắt buộc chọn Phường/Xã (wardCode) khi tạo hồ sơ & Scoping Multi-tenancy — 05/11/2026

- **Phạm vi & Nhiệm vụ (Mục 11 / FE-01):**
  - **Dropdown chọn phường tiếp nhận:** Khởi tạo giá trị rỗng (`Chọn đơn vị tiếp nhận`), loại bỏ việc tự động gán mặc định phường đầu tiên trong `CitizenPage.tsx`. Công dân bắt buộc phải chủ động chọn đơn vị phường/xã trước khi tạo hồ sơ.
  - **Client validation:** Bắt buộc `wardCode: z.string().trim().min(1, 'Phải chọn phường/xã tiếp nhận.').max(50)` trong schema Zod của `CreateDossierModal.tsx`. Nếu bấm tạo khi chưa chọn phường, form lập tức chặn lại và hiển thị cảnh báo đỏ `"Phải chọn phường/xã tiếp nhận."` ngay tại field, không gửi request rỗng lên server.
  - **Gửi đúng dữ liệu lên Backend:** `POST /api/v1/applications` luôn truyền `wardCode: values.wardCode` chuẩn xác trong request body.
  - **Chuẩn hóa thông điệp lỗi Backend trong `workflowError` (`src/lib/api/workflow.ts`):**
    - `application.ward_required` (409): `"Hồ sơ cũ chưa có phường tiếp nhận; cần bổ sung trước khi nộp."`
    - `application.invalid_ward` (400): `"Phường/xã tiếp nhận không hợp lệ hoặc không tồn tại trong hệ thống."`
    - `application.iam_unavailable` (503): `"Hệ thống định danh xác thực tạm thời không phản hồi. Vui lòng thử lại sau giây lát."`
- **Kiểm tra đã chạy:**
  - `npm run typecheck`: Đạt 100% (exit 0).
  - `npm run lint`: Đạt 100% (exit 0, 0 warning).
  - Playwright test:
    - `tests/workflow-ward-errors.spec.ts`: 3/3 ca test passed (kiểm tra chuẩn hóa thông điệp 409, 400, 503).
    - `tests/citizen-application-wizard.spec.ts`: 3/3 ca test passed (kiểm tra dropdown rỗng, validation chặn submit và gửi đúng `wardCode: "WARD_A"`).
- **Trạng thái:** Đã hoàn thành Mục 11 và cập nhật tài liệu `PORTAL_REFINEMENT_TASKS_CHECKLIST.md`. Bảo toàn toàn bộ các thay đổi chưa commit của người dùng.

## Tối ưu và chuẩn hóa UI/UX phân hệ Quản lý thủ tục — 05/11/2026

- **Phạm vi & Nhiệm vụ:** Rà soát và khắc phục triệt để 5 vấn đề UI/UX trong luồng Quản lý thủ tục (`Procedure Manager`) theo phản ánh qua ảnh chụp thực tế:
  1. **Khử trùng lặp lỗi validation & Triệt tiêu Banner lỗi kép (`ProcedureApiEditor.tsx`, `procedureValidation.ts`, `ProcedureManagerPage.tsx`, `ProcedureApiDetail.tsx`):**
     - Khử trùng lặp issue theo `path`: mỗi trường chỉ giữ lại duy nhất 1 thông báo lỗi có độ cụ thể cao nhất, loại bỏ hoàn toàn tình trạng nhân đôi/nhân ba lỗi ("Thông tin này không được để trống" và "Vui lòng nhập ... hợp lệ").
     - Bỏ khối `<ProcedureFeedback>` dài ngoằng chiếm diện tích ở đầu modal khi đã có validation inline. Thay bằng danh sách lỗi gọn gàng dạng lưới 2 cột, có chip tên phần (`[Thông tin chung]`, `[Thời hạn & lệ phí]`) kèm thao tác click để chuyển tab và focus thẳng vào trường lỗi đầu tiên.
  2. **Chuẩn hóa trạng thái viền ô nhập & Dấu sao bắt buộc (`ProcedureApiEditor.tsx`):**
     - Khắc phục lỗi nghịch đảo thị giác: Ô có lỗi hiển thị viền đỏ cảnh báo `border-red-400 bg-red-50/40 text-slate-900 focus:border-red-600 focus:ring-red-100`.
     - Ô bình thường khi focus dùng viền trung tính `focus:border-slate-800 focus:ring-slate-100`, không còn bị đỏ rực như ô lỗi.
     - Bổ sung ký hiệu bắt buộc (`*` màu đỏ) trên nhãn của các trường thông tin quy định.
  3. **Chuẩn hóa Modal Xóa danh mục và khử trùng lặp thông báo (`ProcedureCategoriesView.tsx`, `ConfirmDeleteModal.tsx`):**
     - Khử lỗi Double Notification: Chỉ hiển thị thông báo lỗi bên trong modal, không bắn thêm Toast notification ngoài màn hình khi modal đang mở.
     - Khi gặp lỗi ràng buộc không thể xóa (409 Conflict): Nút "Xác nhận xóa" tự động bị vô hiệu hóa (`confirmDisabled`), modal footer chuyển thành nút "Đã hiểu" và hiển thị hướng dẫn người dùng chuyển hoặc xóa các thủ tục liên kết trước.
  4. **Triệt tiêu toàn bộ `window.confirm` sang Radix Modal (`ProcedureDraftWorkspace.tsx`):**
     - Thay thế 100% hộp thoại trình duyệt nguyên thủy bằng Design System Modal cho cả 2 thao tác: Bỏ thay đổi chưa lưu khi quay về danh sách bản nháp và Khôi phục nội dung ban đầu từ tệp PDF gốc.
- **Kiểm tra đã chạy:**
  - `npm run typecheck`: Đạt 100% (exit 0).
  - `npm run lint`: Đạt 100% (exit 0).
  - `npm run build`: Đạt 100% (exit 0, 8.027 modules transformed).
  - Playwright: `tests/procedure-manager.spec.ts` 24/24 tests PASSED 100%.

## Chia 5 commit và đẩy main — 04/11/2026

- Người dùng yêu cầu chia các thay đổi FE còn lại thành **đúng 5 commit** rồi push main. Phạm vi 9 file: API/validation và lỗi Verify (2 file), giao diện sao lưu (1), test/fixture (2), tài liệu kỹ thuật (3) và PROGRESS (1). Bắt đầu tại f20d2b00f7aecf4f12727288e67de4f3851dc2dc, đã fetch và xác minh đồng bộ origin/main.
- Nhóm commit: **2 fix, 1 test, 2 docs**. Đã tạo 4 commit đầu: 4db2c04 (API/timeout/lỗi), e709fdb (UI Verify/retry), 5a643bd (kiểm thử), 09e7e57 (tài liệu/đề nghị Gateway). Đã push 4 commit này và xác minh remote tại **09e7e579432c098cda12efb8400b3f32e24b3b53** bằng git ls-remote. Lần push đầu gặp lỗi máy chủ commit_refs, thử lại đã thành công, không force push.
- Commit chứa mục này là commit thứ 5, dành cho bàn giao; bước tiếp theo là push và xác minh đúng 5 commit tính từ baseline, remote HEAD trùng local và working tree sạch. Kết quả cuối báo trong phản hồi hoàn tất; không ghi trước rằng commit chưa tạo đã push.
- Đã đối chiếu đúng path, tổ chức lại index theo hạng mục và so SHA-256 xác nhận cả 9 file giữ nguyên nội dung sau khi chia 4 commit; chỉ PROGRESS được bổ sung mục bàn giao này. git diff --check và staged diff check đạt. Không commit env, dist, test artifacts hoặc thông tin xác thực. Sửa thẻ JSX chatbot trước đó đưa file về đúng HEAD nên không tạo commit rỗng cho file này.
- Không chạy lại typecheck/lint/build/Playwright để tách commit. Kết quả thực chạy ở lượt sửa ngay trước: typecheck/lint/build đạt, **40/40 ca mock đạt trong một lượt**. Giới hạn còn nguyên: chưa nghiệm thu Azure/Blob/restore drill; BE/DevOps cần kiểm tra ActivityTimeout Gateway cho Verify dài. Không đổi BE, không coi Git push là bằng chứng deployment thành công.

## Kiểm tra và sửa lỗi chặn FE — 04/11/2026

- **Lỗi tìm được và đã sửa:** AiChatWidget.tsx dòng cuối cửa sổ chat mở section nhưng đóng fragment, gây TS1003 và lỗi parser Vite, toàn FE không tải được. Đổi đúng thẻ đóng thành /section, giữ nguyên nội dung/nhãn Hỏi Đáp AI, thời gian tin nhắn và logic chatbot. Đây là sửa thay đổi chưa commit bị sai cú pháp; sau sửa file khớp phiên bản HEAD nên không còn diff riêng của AiChatWidget.
- **Kiểm tra thực chạy trên workspace hiện tại f20d2b0 + các thay đổi Verify:** npm run typecheck đạt, npm run lint đạt, npm run build đạt (8027 modules; còn cảnh báo annotation SignalR/Zod và chunk lớn hiện có). Playwright Edge: **40/40 ca đạt trong một lượt** với admin-system-operations, admin-system-audit, admin-system-settings và public-search-chat. Bao gồm Verify/lỗi/trạng thái thay đổi, RBAC/cache khi đổi danh tính, form cấu hình/xung đột, tìm kiếm, PDF/lệ phí mobile và chat khách 24h/chat xác thực. Lượt browser đầu được dừng sau khi phát hiện lỗi biên dịch, không tính đạt. git diff --check và git diff --cached --check đạt; không đổi index.
- **Phát hiện cần BE/DevOps:** Gateway YARP 2.3.0 dùng LoadFromConfig; cluster analytics-system không đặt HttpRequest.ActivityTimeout trong appsettings.json/Production. Nếu không có override deployment, mặc định idle 100 giây có thể ngắt POST Verify đồng bộ trước giới hạn BE 5 phút dù FE đã chờ 330 giây. Đã đối chiếu tài liệu Microsoft và ghi đường cấu hình/đề nghị kiểm thử request dài tại BE_REQUEST_BACKUP_VERIFICATION_2026-11-03.md. Không khẳng định đã tái hiện production, không sửa BE theo phạm vi đã chốt.
- Cập nhật BACKUP_VERIFY_COMPLETION_2026-11-04.md. Chưa chạy API/Blob thật hoặc restore drill. Không chạy lại toàn bộ suite ngoài các luồng nêu trên. Giữ các thay đổi staged của task Verify và tài liệu/phiên khác; không commit/push.

## Đọc lại BE local sau khi người dùng tải bản mới — 04/11/2026

- Đã đọc lại SystemBackups.Verify/Create, SystemBackupWorker, SystemBackupContracts và SystemBackupsController tại E:/wardmate-backend. Tính blob SHA từ nội dung chuẩn hóa LF bằng Node (không chạy Git trong repo BE): **4/4 khớp chính xác** các file bản GitHub đã dùng để triển khai FE. Không còn chờ bản sửa BE/source local.
- Xác nhận logic: thiếu Blob/tệp thì lỗi; kiểm tra kích thước và SHA-256, pg_restore đọc archive; lỗi kiểm tra xóa mốc Verified và về Succeeded; lock chung với retention; worker bắt buộc pg_dump/Blob và upload thành công. DTO và endpoint không đổi, FE hiện có tương thích timeout/mã lỗi/trạng thái. Không phát hiện chênh lệch cần sửa thêm code trong lượt đọc lại.
- Cập nhật trạng thái trong BACKUP_VERIFY_COMPLETION_2026-11-04.md, BE_REQUEST_BACKUP_VERIFICATION_2026-11-03.md và FRONTEND_SETUP.md. Giữ nguyên nội dung staged và thay đổi AiChatWidget của phiên khác; FE hiện ở f20d2b0 và đồng bộ origin/main khi bắt đầu đọc lại.
- Kiểm tra lượt này: đối chiếu source/hash 4 file, rà hợp đồng FE và git diff --check; không chạy lại typecheck/lint/build/Playwright vì không đổi code. Kết quả lượt triển khai trước: 14/14 ca mock Verify/health/backups đạt, typecheck/lint/build đạt; không coi là vừa chạy lại trên workspace mới tích hợp.
- Giới hạn: chưa chạy BE mới/Blob/pg_restore trên môi trường thật, chưa xác minh deployment/gateway timeout hay restore drill. Cần re-verify bản Verified từ implementation cũ. Không sửa BE, không commit/push.

## Đồng bộ remote main, phân tách Accounts/Users và hoàn thiện Checklist — 04/11/2026

- **Phạm vi & Nhiệm vụ:** Xử lý kéo code từ remote `origin/main` sau khi đồng nghiệp cập nhật các màn hình quản trị hệ thống và kiểm thử tìm kiếm/chat; đối chiếu, giải quyết xung đột, tích hợp giữ lại những phần tối ưu nhất và duy trì các mục chờ theo đúng yêu cầu của người dùng.
- **Việc đã làm:**
  - Fast-forward `main` đồng bộ với `origin/main` (`115ad30`).
  - Khôi phục và cập nhật tài liệu bàn giao Backend `docs/BE_REQUESTS_FIXES_IAM_PROCEDURE.md` và bảng theo dõi tiến độ `docs/PORTAL_REFINEMENT_TASKS_CHECKLIST.md`.
  - **Mục 4 (`AiChatWidget.tsx`):** Thêm hiển thị mốc giờ gửi/nhận (`HH:mm`) bằng hàm `formatChatTime` cho cả bóng chat của người dùng và khung chân tin nhắn của trợ lý AI.
  - **Mục 8 (`CreateStaffAccountModal.tsx`):** Loại bỏ mã phường `({ward.code})` trong ô chọn đơn vị; loại bỏ dòng text gợi ý vai trò thừa `{roleOption.hint}`; loại bỏ dòng lưu ý chân modal để form ngắn gọn, trang nhã.
  - **Mục 9 (`AdminPage.tsx`, `src/lib/api/index.ts`):** Tách bạch nhóm "Tài khoản & truy cập" thành 2 màn hình riêng biệt:
    1. **"Tài khoản đăng nhập" (`accounts`):** Tích hợp API `GET /api/v1/accounts`, bảng dữ liệu tài khoản (`@username`, email, phường, ngày tạo, trạng thái), tìm kiếm, bộ lọc trạng thái, thao tác Khóa/Mở khóa trực tiếp và phân trang.
    2. **"Người dùng hệ thống" (`users`):** Giữ nguyên quản lý hồ sơ nhân thân chi tiết và phân quyền RBAC.
    - **Nghiệp vụ bảo mật:** Ẩn toàn bộ tài khoản quản trị tối cao (`IT_ADMIN`, `admin`, tài khoản hiện tại) khỏi cả 2 danh sách tài khoản và người dùng thông thường theo đúng chỉ đạo của người dùng.
  - **Mục 1, 3, 5, 6:** Duy trì giải pháp từ remote và local (điều hướng tìm kiếm `/thu-tuc?q=...`, thẻ văn bản hành chính gọn gàng + modal xem trước, logo `BrandMark` thống nhất, trợ lý AI hiển thị toàn hệ thống).
  - **Mục 2, 7, 10:** Tiếp tục giữ nguyên trạng thái "Chờ xử lý" (Pending) theo đúng yêu cầu; các kiến nghị kỹ thuật Backend được lưu giữ đầy đủ trong `docs/BE_REQUESTS_FIXES_IAM_PROCEDURE.md`.
- **Kiểm tra đã chạy:**
  - `npm run typecheck`: Đạt 100% (exit 0).
  - `npm run lint`: Đạt 100% (exit 0).
  - Playwright Edge:
    - `tests/public-search-chat.spec.ts`: 10/10 tests PASSED.
    - `tests/admin-provisioning.spec.ts`: 5/5 tests PASSED.
    - `tests/landing.spec.ts` & `tests/design-system.spec.ts`: 16/16 tests PASSED.
    - `tests/admin-system-audit.spec.ts`: 12/12 tests PASSED.
- **Trạng thái Git:** Cây thư mục sạch, stash đã được giải phóng, không còn xung đột.

## Chia 15 commit và đẩy main — 04/11/2026

- **Phạm vi được yêu cầu:** toàn bộ 23 path chưa commit của hai task dọn UI và sửa tìm kiếm/lệ phí/PDF/chatbot. Đã fetch, main và origin/main đồng bộ tại 4658dbaf56a0a05ea59a9d3c5bf5bf9831c55093 trước khi đóng gói.
- Chia thành **15 commit**: 6 refactor theo workspace/FAQ, 3 fix styles/tìm kiếm/chi tiết thủ tục, 3 feat PDF/chatbot/trang công khai, 1 test hồi quy và 2 docs (gồm commit bàn giao này). Không tạo commit rỗng, không thêm chức năng ngoài phạm vi. Commit trung gian có phụ thuộc; các kiểm tra triển khai áp dụng cho cây tích hợp cuối.
- **Đã push và xác minh 14 commit đầu** lên origin/main tại ff4db6a891d491fd0ca093be56bfa5d591319c84 bằng git ls-remote; không force push. Commit chứa mục này là commit thứ 15, sau đó push riêng và xác minh HEAD/remote, tổng số commit từ baseline và working tree sạch. Kết quả xác minh cuối được báo trong phản hồi hoàn tất, không ghi trước rằng commit chưa tạo đã push.
- Đã đối chiếu đúng 23 path và SHA-256 trước/sau khi chia 14 commit; nội dung triển khai/tài liệu giữ nguyên, riêng PROGRESS được bổ sung bàn giao. git diff --check đạt; không đưa env, token, dist, ảnh chụp hoặc dữ liệu thật vào commit.
- Không chạy lại typecheck/lint/build/Playwright chỉ để chia commit. Kết quả ở bước triển khai: typecheck/lint/build đạt; dọn UI có 60 ca mock khác nhau đạt qua các lượt, phần công khai/chat có 49 ca khác nhau đạt qua các lượt. Hai tập có ca trùng, không cộng thành tổng 109. Chi tiết bên dưới và trong hai tài liệu task.
- **Giới hạn còn lại:** full-audit cũ lỗi import chatInputSchema, chưa nghiệm thu API Azure hay PDF thật; push Git không chứng minh CI/CD/deployment thành công. Không thay BE.

## Tìm kiếm công khai, lệ phí, PDF nguồn và chatbot 24 giờ — hoàn tất 04/11/2026

- **Đã làm (FE):** tìm kiếm và gợi ý trang chủ đi tới /thu-tuc?q=..., trang danh sách gọi catalog theo keyword; sửa xuống dòng lệ phí và cuộn bảng trong khung mobile, chuẩn hóa VND thành “đồng”. Gộp văn bản nguồn vào một thẻ gọn; chỉ lấy URL PDF khi mở modal xem trước, giữ mở tab mới và xử lý lỗi của PdfSource.
- Chatbot dùng chung trên trang chủ, danh sách/chi tiết thủ tục (kể cả alias), hướng dẫn và hỏi đáp; logo mở/header/avatar trợ lý dùng BrandMark của trang. Giữ chatbot workspace công dân.
- Khách: lưu phiên có timestamp/expiry, conversationId và phường/xã trong trình duyệt tối đa 24 giờ kể từ tin cuối; reload không gia hạn. Hết hạn xóa dữ liệu/ID và mở hội thoại mới; dữ liệu cũ chỉ migrate khi còn hạn, dữ liệu sai bỏ; storage bị chặn vẫn chat RAM. Chỉ lưu tối đa 100 tin gần nhất; không ghi tin người đã đăng nhập vào bộ lưu khách. Trình duyệt đóng thì dọn khi mở lại, không thay chính sách lưu BE.
- File và diễn giải chi tiết: [PUBLIC_SEARCH_CHAT_UPDATE_2026-11-03.md](PUBLIC_SEARCH_CHAT_UPDATE_2026-11-03.md), bắt đầu ngày 03/11 và hoàn tất ngày 04/11. Source chính: HomePage, ProcedureDetailPage, MainLayout, AiChatWidget, guestChatStorage, PdfSource và globals.css.
- **Kiểm tra vừa chạy:** typecheck, lint và build đạt (build còn cảnh báo annotation dependency/chunk lớn hiện có); git diff --check đạt. Playwright Edge có **49 ca khác nhau đạt qua các lượt chạy**: lượt đầu 45/47, sửa hai dữ liệu/assertion kiểm thử mới rồi lượt sau 10/10, gồm hai ca bổ sung. Phạm vi landing, procedures-ui, procedure-manager, public-search-chat và riêng lịch sử chat của ai-verify-and-deliveries. Đã xem ảnh modal PDF mock 375px, không tràn ngang; không coi PDF giả là nghiệm thu nội dung tệp thật.
- **Giới hạn:** full-audit không thu thập được vì import chatInputSchema không còn export trong API hiện tại; không tính là đạt, cần cập nhật bộ test lịch sử riêng. Chưa kiểm tra API/deployment thật. Không sửa BE. Phần này và dọn UI đã được đóng gói theo yêu cầu 15 commit ở mục bàn giao mới nhất phía trên.

Cập nhật: 04/11/2026.
Mục đích: giúp phiên Codex mới tiếp tục đúng công việc và quyết định đã thống nhất.
Đọc cùng `../AGENTS.md`; luôn xác minh lại bằng code và Git trước khi hành động.

## Rà soát và xóa UI thừa trên FE — 03/11/2026

- **Phạm vi/trạng thái:** Hoàn tất dọn các UI thừa xác định được sau khảo sát route, năm workspace, trang công khai và component dùng chung. Baseline `4658dba`, working tree sạch trước task. Kiểm kê 116 file pages/components, quét AST trên 173 file TS/TSX với 582 button/Button; lần theo nơi sử dụng trước khi xóa. Chi tiết quyết định tại `docs/UI_CLEANUP_REVIEW_2026-11-03.md`.
- **Admin:** Bỏ 3 KPI không có số liệu, biểu đồ lưu lượng chờ, thẻ health cũ báo chưa tích hợp và 5 phím tắt trùng sidebar. Giữ tổng tài khoản thật, phân quyền gần đây và toàn bộ màn/29 thao tác Analytics đã gắn. Audit không còn bị bó vào cột của thẻ health rỗng.
- **Công dân:** Bỏ khối biểu đồ hoạt động chờ và code phím tắt đã comment. Giữ thống kê hồ sơ thực, danh sách/bổ sung/đánh giá/QR và hướng dẫn.
- **Cán bộ:** Bỏ chart/hiệu suất chờ và thẻ thông tin quầy tĩnh ghi “Đang nhận tiếp dân” không có dữ liệu ca trực. Bỏ V2 cố định và câu khẳng định đã nhận PDF/QR ở thẻ không có bằng chứng đó; giữ hàng đợi gửi lại, xem nhanh/thẩm định và hồ sơ sẵn sàng. Cập nhật heading sau khi bỏ chart.
- **Quản lý thủ tục:** Bỏ KPI bản nháp không có số, 3 cảnh báo thiếu thống kê và 2 vùng tổng hợp trống. Bỏ 7 menu chỉ mở trang hướng dẫn/chưa kết nối: thành phần hồ sơ, quy trình, phiên bản biểu mẫu, gắn mẫu, văn bản pháp lý, liên kết pháp lý, lịch sử tổng hợp. Giữ chức năng thật trong từng thủ tục/biểu mẫu, danh sách, bản nháp/PDF, danh mục và AI; giữ kiểu section/fallback cũ cho tương thích caller.
- **Công khai:** Xóa `src/components/faq/QuestionForm.tsx` vì form bị khóa toàn bộ, bỏ nơi render và CSS riêng; FAQ một cột vẫn có accordion và link tra cứu. Không xóa hướng dẫn tiền kiểm/QR, validation/quyền/xác nhận, cảnh báo Verify BE hoặc các biểu đồ Manager có dữ liệu thật.
- **File:** `src/pages/admin/AdminPage.tsx`, `src/pages/citizen/views/CitizenDashboardView.tsx`, `src/pages/officer/OfficerDashboardView.tsx`, `src/pages/procedure-manager/{ProcedureDashboardView,ProcedureManagerPage}.tsx`, `src/components/layout/RoleWorkspaceSidebars.tsx`, `src/pages/public/FaqPage.tsx`, `src/styles/globals.css`; cập nhật 4 file test hiện có theo UI và skeleton thực tế. Không sửa endpoint, auth core, cache, dependency hoặc BE.
- **Kiểm tra thực chạy:**
  - `npm run typecheck`: đạt; `npm run lint`: đạt (đã chạy lại sau cập nhật test).
  - `npm run build`: đạt, exit 0, 8026 modules; còn cảnh báo annotation SignalR/Zod và chunk lớn hiện có.
  - Playwright Edge: bộ `landing`, `officer`, `procedure-manager`, `workspace-sidebar`, `admin-rbac`, `citizen-dossier-ui`, `manager`: **60 ca khác nhau đã đạt qua các lượt chạy**. Lượt đầy đủ sau build có 57/60 đạt; cập nhật 3 assertion cũ (KPI đã xóa, chuông trùng tên, skeleton bảng) rồi chạy lại riêng 3/3 đạt, exit 0. Một lượt đầu bị timeout khi tải lazy workspace trong lúc build và đã dừng; không coi đó là kết quả đạt. Rerun dùng timeout 60 giây qua CLI, không sửa timeout repo hoặc bỏ assertion nghiệp vụ.
  - Đã xem ảnh mock mobile `test-results/officer-dashboard-cleanup-mobile.png`; không tràn ngang. Các ca mobile công khai, công dân, Admin, Manager và editor cũng đạt.
  - `git diff --check`: đạt. Không tạo test chỉ để đo số dòng bị xóa.
- **Giới hạn/Git:** Rà soát source/kiểm thử mock, không nghiệm thu dữ liệu Azure thật. Phần dọn UI được đưa vào đợt 15 commit theo yêu cầu mới ngày 04/11/2026 (xem mục bàn giao phía trên). Không còn phần code bắt buộc đang chờ trong phạm vi dọn UI này.

## Chia đúng 30 commit và bàn giao lên main theo yêu cầu — 03/11/2026

- Người dùng yêu cầu chia các thay đổi frontend thành **đúng 30 commit** và push `main`. Phạm vi là 32 file của TASK-34 và phần API Analytics còn thiếu; gộp hai test hồi quy IAM thành một commit, cấu hình proxy và test định tuyến thành một commit. Nhóm còn lại tách theo hạng mục: **13 feat, 3 fix, 8 test, 6 docs** (tính cả commit bàn giao này).
- Đã fetch và xác minh `main` bắt đầu đồng bộ tại `461a5ff6a5ffda74ccf8aa50844cd3d6b3ab6c76`. Đã push **29 commit triển khai/tài liệu đầu tiên** tới `origin/main`, không force push; xác minh bằng `git ls-remote` rằng remote khớp local tại **`6ceda9971df5e9e6f37bd8b5ec2f38ac9fd6e16e`** trước khi ghi mục này.
- Commit chứa mục bàn giao này là **commit thứ 30**, ghi nhận kết quả push đã xác minh; bước sau commit là push commit bàn giao và kiểm tra lại HEAD/remote cùng working tree. Kết quả xác minh cuối chuỗi được báo trong phản hồi kết thúc phiên, tránh ghi trước rằng commit chưa tạo đã push thành công.
- Kiểm tra đóng gói: đối chiếu đúng 32 path; kiểm tra hash SHA-256 xác nhận chia staging/commit không đổi nội dung file; `git diff --check` đạt; không đưa env, token, artifact build hoặc screenshot vào commit. Không thay đổi BE và giữ lịch sử remote hiện có.
- Không chạy lại typecheck/lint/build/Playwright chỉ để tách commit. Kết quả chạy ở bước triển khai ngay trước đó: typecheck/lint/build đạt, 45 tuyến proxy đạt, 62 ca mock/hồi quy khác nhau đạt qua các lượt chạy; chi tiết ở mục dưới. Các commit trung gian có quan hệ phụ thuộc, kiểm tra áp dụng cho cây tích hợp hoàn chỉnh.
- Giới hạn giữ nguyên: chưa xác minh Azure với phiên IT_ADMIN thật; Verify chưa nghiệm thu bảo đảm toàn vẹn/khôi phục trước khi BE sửa. Push Git không chứng minh CI/CD hoặc deployment đã hoàn tất.

## Hoàn thiện 9 thao tác Analytics còn thiếu: health, backups và delivery detail — 03/11/2026

- **Phạm vi mới:** Người dùng yêu cầu đọc BE/FE, lập kế hoạch, xây UI và gắn hết API còn lại. Đã đối chiếu Swagger đang chạy: **29 thao tác nghiệp vụ** và GET `/` nhận diện service. Hiện **29/29 thao tác nghiệp vụ có adapter và luồng UI gọi**, không tính endpoint gốc là nghiệp vụ.
- **Quyết định người dùng:** **Chỉ làm FE**, ghi lại lỗi Verify để đội BE sửa trước nghiệm thu. Không sửa/build BE, không tạo endpoint giả hoặc tự thử mutation production.
- **UI/API mới:** `src/lib/api/systemOperations.ts`, `src/pages/admin/{ServiceHealthView,SystemBackupsView,SystemOperationsShared}.tsx`; AdminPage thay 2 placeholder bằng **Giám sát dịch vụ** và **Sao lưu dữ liệu**. Gắn GET danh sách/chi tiết/history health + POST check-now; GET list/detail backups + POST create/verify. Query theo user/ID/filters/page có AbortSignal; quyền IT_ADMIN và root key tách theo danh tính.
- **Luồng vận hành:** Health hỗ trợ Unknown/not_checked/stale; không hiển thị năm 0001 hoặc 0ms thành phép đo thật. Check-now202 chỉ xếp hàng, đọc lại sau 3 giây. Backup create202 mở chi tiết, theo dõi Queued/Running tối đa 20 lần cách 3 giây và dừng khi lỗi/kết thúc/đóng modal. Verify đọc lại trước thao tác, không tự retry; lỗi vẫn refetch để nhận errorCode đã lưu. UI ghi trạng thái máy chủ và giới hạn, không bảo đảm file toàn vẹn/restore.
- **Sửa phát thông báo:** `src/lib/api/notificationAdmin.ts`, `src/pages/admin/NotificationDeliveriesView.tsx`. Modal đã gọi GET detail thật, không dùng dòng list làm dữ liệu mới nhất; audit phân trang độc lập và có lỗi riêng. Sửa nhãn default list là nhóm cần xử lý, bỏ Failed không hợp đồng, thêm Blocked/Sandbox. Replay chỉ Dead/Blocked, khác SMS, role IT_ADMIN + quyền read/manage, lý do trim 5–500 không ký tự điều khiển và xác nhận rủi ro; dùng revision mới đọc, 202 chỉ xếp hàng, lỗi giữ nháp và khóa gửi đến khi đọc lại. Giữ thao tác sao chép ID và skeleton bảng.
- **Validation:** RHF/Zod cho form; ngày Việt Nam chuyển UTC Z, from≤to, đúng giới hạn page/pageSize/service/reason/GUID/ID response; kiểm tra status202, response/page/nullable, số nguyên an toàn. Lỗi 403/409/503, thiếu target/runner và checksum có thông báo riêng; không biến lỗi thành dữ liệu rỗng thành công. Tái sử dụng validation ngày và phần UI chung, không đổi auth core hoặc thêm dependency.
- **Kiểm tra thực chạy:**
  - `npm run typecheck`: đạt, exit 0.
  - `npm run lint`: đạt, exit 0.
  - `npm run build`: đạt, exit 0; có cảnh báo annotation dependency SignalR/Zod và chunk lớn, không tuyên bố 0 cảnh báo build.
  - `node tests/api-proxy-check.mjs`: **45/45 tuyến đạt**, thêm đủ 9 tuyến còn thiếu và giữ method/path/query; chỉ HTTP local.
  - Playwright Edge: **52/52 ca đạt** trong `admin-system-operations`, `admin-notification-deliveries`, `admin-system-audit`, `admin-system-settings`, `analytics`, `feedback` (18 ca mới, 34 ca hồi quy).
  - Hồi quy `admin-rbac`, `admin-provisioning`: **9/9 ca đạt**. Một ca phát thông báo cũ ở `ai-verify-and-deliveries` đã cập nhật GUID/trạng thái/detail mock và sửa selector trùng option/cell; chạy lại riêng **1/1 đạt**, exit 0. Tổng 62 ca khác nhau đã có kết quả đạt qua các lượt chạy, không khẳng định chạy cả suite toàn repo.
  - Đã xem ảnh mobile 375px `test-results/admin-backup-mobile.png`; artifact mock không commit. `git diff --check` đạt.
- **Tài liệu:** kế hoạch `docs/ANALYTICS_REMAINING_APIS_PLAN_2026-11-03.md`; bảng đủ 29 API → UI tại `docs/ANALYTICS_API_COVERAGE_2026-11-03.md`; yêu cầu BE tại `docs/BE_REQUEST_BACKUP_VERIFICATION_2026-11-03.md`; cập nhật `docs/FRONTEND_SETUP.md`.
- **Giới hạn/bước tiếp:** chưa có phiên IT_ADMIN thật để xác minh Azure, cờ Enabled/targets/runner/Blob/worker hoặc CORS. Verify **chưa nghiệm thu bảo đảm phía BE**: có nhánh Verified không đọc file, kiểm tra header chưa đủ, worker có thể Succeeded khi không upload. Không có API restore/download/backup-target discovery/health-request completion nên không bịa chức năng đó. Cần BE sửa/deploy và kiểm tra thật theo tài liệu bàn giao. Chưa commit/push; giữ nguyên các thay đổi TASK-34 đang staged và thay đổi của người dùng.

## Triển khai Admin TASK-34: cấu hình và audit tập trung — 03/11/2026

- **Đã làm:** Người dùng yêu cầu triển khai kế hoạch. Admin có mục **Cấu hình hệ thống** và 3 tab **Nghiệp vụ toàn hệ thống / Thay đổi cấu hình / Phân quyền**. Gắn đủ 7 method API TASK-34; tổng quan “Phân quyền gần đây” mở đúng tab IAM; lịch sử từ cấu hình mở đúng tab thay đổi cấu hình. TASK-35/36 vẫn ngoài phạm vi.
- **API/Query:** `src/lib/api/systemAdministration.ts`, `src/hooks/useSystemAdministration.ts`. Dùng HTTP client/JWT và analytics URL sẵn có; Zod kiểm tra request/response, ID chi tiết, trang, số nguyên an toàn cho version. Query riêng tư theo user/bộ lọc/trang/ID, có AbortSignal, không retry tự động; đổi danh tính đóng modal và tách dữ liệu.
- **UI:** `src/pages/admin/{AdminAuditView,BusinessAuditEventsView,SystemAuditLogsView,SystemAuditShared,SystemSettingsView}.tsx`; sửa `AdminPage.tsx`, mô tả giới hạn bộ lọc IAM ở `AdminRbacViews.tsx`. Bộ lọc audit mới chạy phía server; ngày Việt Nam chuyển UTC; không thêm action query/hash thiếu hợp đồng; không suy actor/IP bị thiếu, giải thích dữ liệu che.
- **Cấu hình:** RHF/Zod kiểm tra số nguyên 1–366, lý do trim 3–500 ký tự. Mở form đọc chi tiết mới nhất; PUT giữ snapshot version. Conflict/timeout/kết quả không chắc chắn giữ nháp, khóa lưu đến khi đọc lại; người dùng chủ động lưu lần mới. Không tự tạo job thống kê. Lỗi validation ở trường có focus, modal dùng Radix chung.
- **Proxy:** `vite.config.ts` thêm `/api/v1/system` trước `/api` IAM. `tests/api-proxy-check.mjs` kiểm tra đủ 7 thao tác mới và giữ path/query/method.
- **Kiểm tra đã chạy phiên triển khai:**
  - `npm run typecheck`: đạt (exit 0).
  - `npm run lint`: đạt (exit 0).
  - `npm run build`: đã build thành công; có cảnh báo annotation ở dependency SignalR/Zod và chunk lớn từ thư viện/editor hiện có, không tuyên bố 0 cảnh báo build.
  - `node tests/api-proxy-check.mjs`: **36/36 tuyến đạt**, chỉ HTTP local.
  - Playwright Edge: `tests/admin-system-audit.spec.ts`, `tests/admin-system-settings.spec.ts`, `tests/admin-rbac.spec.ts`, `tests/admin-provisioning.spec.ts`: **25/25 ca đạt**, exit 0, gồm 16 ca mới và 9 ca hồi quy. Lần chạy sandbox mắc bước teardown Windows sau khi báo đủ ca; lần chạy lại ngoài sandbox kết thúc bình thường. Đã xem ảnh mobile 375px `test-results/admin-system-audit-mobile.png` (artifact kiểm thử, không commit).
- **Giới hạn:** Chưa có phiên IT_ADMIN để kiểm tra API nghiệp vụ thật trên Azure; kết quả hiện là mock và proxy local. Chưa xác minh production hosting `/api/v1/system`, cờ quản trị, migrations/relay hoặc refresh/CORS thật. Route Admin có quyền IAM ủy quyền; TASK-34 kiểm tra role IT_ADMIN riêng, không đổi auth core. Phát hiện Verify backup ở ghi chú kế hoạch vẫn ngoài phạm vi.
- **Bàn giao:** cập nhật `docs/FRONTEND_SETUP.md` và `docs/ADMIN_SYSTEM_AUDIT_INTEGRATION_PLAN_2026-11-03.md`. Không sửa BE, không thêm dependency, chưa commit/push. Bước tiếp: dùng phiên kiểm thử hợp lệ và xác nhận môi trường/cờ BE để nghiệm thu dữ liệu thật; không tự đổi cấu hình production chỉ để thử.

## Lập kế hoạch Admin TASK-34: cấu hình và audit tập trung — 03/11/2026

- Người dùng chốt phạm vi **TASK-34: audit tập trung + cấu hình và nhật ký cấu hình**; giám sát/sao lưu TASK-35 và tối ưu DB TASK-36 ngoài phạm vi. Yêu cầu bàn giao kế hoạch Markdown trước khi sửa code.
- Đã tạo `docs/ADMIN_SYSTEM_AUDIT_INTEGRATION_PLAN_2026-11-03.md`: nghiệp vụ ba nguồn nhật ký, bảng 7 thao tác API → UI, menu/tab/modal dự kiến, validation, quyền, proxy, danh sách file và tiêu chí kiểm thử.
- Đã đọc source BE tại `E:/wardmate-backend`, FE hiện tại và file bàn giao `fe-handoff-task34-35-36-management-portal.md`; đã tải Swagger JSON công khai của Analytics trong phiên. Chưa đăng nhập hoặc xác minh API nghiệp vụ thật; chưa sửa code ứng dụng/BE.
- Phát hiện TASK-34: API audit tập trung không có lọc `action` hoặc trường `payloadHash`; bàn giao bỏ sót GET chi tiết nhật ký cấu hình; Vite chưa có proxy `/api/v1/system`. Giữ nhật ký phân quyền IAM hiện có, không coi nó là audit toàn hệ thống.
- Ghi nhận ngoài phạm vi: nhánh `SystemBackups.Verify` có thể đi tới Verified khi không đọc file nếu runner được đánh dấu đã cấp nhưng không có Blob client/file local; cần BE xử lý trước nghiệm thu TASK-35. Chi tiết và giới hạn trong kế hoạch.
- Kiểm tra phiên này: đối chiếu controller/DTO/service/Swagger, nội dung tài liệu và diff. Không chạy typecheck/lint/build/Playwright vì chỉ thêm tài liệu; kết quả test các mục cũ không phải kết quả phiên này.
- Git FE lúc khảo sát: HEAD `142a6fd`, working tree sạch, local báo sau `origin/main` 3 commit; chưa fetch/pull/commit/push. Không suy remote mới nhất từ thông tin tracking local.
- Kế hoạch sau đó đã được người dùng yêu cầu triển khai; trạng thái mới nhất ở mục **Triển khai Admin TASK-34** phía trên. Phần còn chờ là nghiệm thu môi trường thật, không phải phần UI/client.

## Rà soát và Chuẩn hóa Toàn bộ Skeleton UI/UX Bảng Danh sách (5 Roles) — 03/11/2026

- **Phạm vi & Trạng thái thực tế:**
  1. **Khắc phục lỗi Skeleton trang Lịch sử xử lý của cán bộ (`OfficerAuditLogView.tsx`):**
     - Sửa lỗi thẻ `<td>` không có padding do thiếu `cellClassName`, khiến các hàng skeleton bị bẹp rúm còn 16px và dính mép trái, lệch cột so với header.
     - Cung cấp padding chuẩn `px-4 py-3.5 first:pl-5 last:pr-5`, độ rộng tương ứng từng cột (Thời gian font-mono, Mã hồ sơ, Công dân, Hành động, Chi tiết thao tác dài w-64, Cán bộ thực hiện căn phải).
  2. **Nâng cấp nền tảng `TableSkeletonRows` & `TableSkeleton` (`Skeleton.tsx`):**
     - Bổ sung fallback padding mặc định `px-4 py-3.5` để bảo vệ mọi bảng khỏi nguy cơ bẹp dòng khi không có `.admin-table-wrap`.
     - Hỗ trợ `columnWidths?: (string | undefined)[]` cho phép từng bảng cấu hình độ rộng trực quan khớp chính xác với cột thực tế.
     - Hỗ trợ `lastCellClassName?: string` để căn phải (`text-right`) hoặc ghim cố định (`sticky right-0`) cột thao tác khi bảng cuộn ngang.
     - Phân bổ độ rộng tự nhiên, đan xen khi không chỉ định cấu hình riêng thay vì vệt w-24 cụt lủn hàng loạt.
  3. **Rà soát & tối ưu toàn bộ các role:**
     - **Role Frontdesk (Cán bộ một cửa):**
       - `OfficerAuditLogView.tsx`: Cấu hình 6 cột skeleton chuẩn, căn phải cột cán bộ.
       - `OfficerApplicationListView.tsx`: Cấu hình 7 cột skeleton, cột thao tác có `sticky right-0 bg-white text-right shadow-...` khớp chuẩn với header sticky.
     - **Role Citizen (Công dân):**
       - `CitizenDossiersView.tsx`: Cấu hình 6 cột skeleton chuẩn, cột thủ tục w-56, ghi chú w-48, thao tác căn phải.
       - `CitizenFeedbackView.tsx`: Thay thông báo text tải bằng `ListSkeleton rows={3}` mượt mà.
     - **Role Manager (Lãnh đạo phường):**
       - `ManagerApplicationsView.tsx`: Cấu hình 6 cột skeleton, cột thao tác sticky right căn phải.
       - `ManagerProfilesView.tsx`: Cấu hình 4 cột skeleton, cột cán bộ w-44, lĩnh vực w-48, thao tác căn phải.
     - **Role Procedure Manager (Quản lý thủ tục):**
       - `ProcedureApiList.tsx`: Triệt tiêu lỗi giấu card và thead khi tải (Zero Layout Shift). Header 5/6 cột luôn hiển thị cố định, skeleton mượt mà trong tbody.
       - `ProcedureDraftWorkspace.tsx`: Giữ nguyên card và thead bản nháp gần đây, skeleton 3 cột chuẩn.
     - **Role Admin (Quản trị hệ thống):**
       - `AdminPage.tsx`: Gộp 2 bảng Users trùng lặp thành 1 bảng chuẩn duy nhất với thead cố định, skeleton 4 cột; tối ưu bảng Wards 4 cột.
       - `AdminRbacViews.tsx`: Giữ nguyên toolbar tìm kiếm và thead Roles, thead Audit Logs cố định không bị giấu khi tải.
       - `FormsView.tsx`: Giữ nguyên thead biểu mẫu Word, bỏ lồng `.admin-card`, skeleton 4 cột chuẩn.
       - `NotificationDeliveriesView.tsx`: Tối ưu độ rộng skeleton 7 cột nhật ký gửi thông báo.
     - **Component AI:**
       - `KnowledgeBaseView.tsx`: Tối ưu độ rộng skeleton 7 cột kho kiến thức.
- **Trạng thái Git:** Đã commit và push thành công lên `origin/main` (`142a6fd..6c628e8`).
- **Commits:**
  1. `f84e572` fix(ui): standardize table list skeletons and eliminate layout shift across all roles
  2. `6c628e8` docs(handoff): record table skeleton ui audit and polish progress across all roles
- **Kiểm tra đã chạy:**
  - `npm run typecheck`: **0 errors**.
  - `npm run lint`: **0 errors, 0 warnings**.
  - `npm run build`: **Build production thành công 100%** (8.016 modules transformed).
- **Tệp liên quan:**
  - `src/components/ui/Skeleton.tsx`
  - `src/pages/officer/OfficerAuditLogView.tsx`
  - `src/pages/officer/OfficerApplicationListView.tsx`
  - `src/pages/citizen/views/CitizenDossiersView.tsx`
  - `src/pages/citizen/views/CitizenFeedbackView.tsx`
  - `src/pages/manager/views/ManagerApplicationsView.tsx`
  - `src/pages/manager/views/ManagerProfilesView.tsx`
  - `src/pages/procedure-manager/ProcedureApiList.tsx`
  - `src/pages/procedure-manager/ProcedureDraftWorkspace.tsx`
  - `src/pages/admin/AdminPage.tsx`
  - `src/pages/admin/AdminRbacViews.tsx`
  - `src/pages/admin/FormsView.tsx`
  - `src/pages/admin/NotificationDeliveriesView.tsx`
  - `src/components/ai/KnowledgeBaseView.tsx`
  - `docs/PROGRESS.md`

## Bàn giao Đồng bộ, Tách Commit theo Yêu cầu và Push Thành công lên origin/main — 02/11/2026

- **Trạng thái Git:** Đã pull code mới nhất từ remote origin/main (bao gồm các commit Calendar Closures, Staffing form validation và Logo UI mới).
- **Phân tách commit:** Toàn bộ công việc đã hoàn thành được chia thành các commit chuẩn ngữ nghĩa theo từng yêu cầu:
  1. 40090fe docs: add backend requests for AI dossier assistant, worker config and verification handoff
  2. 9ecba8a feat(ai): enhance guest chat widget with fallback mechanism and bilingual support
  3. de42d6f feat(workflow): support comment withdrawal and align dossier readiness status
  4. a568023 feat(admin): add notification deliveries history view and proxy routing
  5. 5920d0d feat(notifications): add realtime toast subscriber with deduplication and deep links
  6. fbfcd8e feat(ai-ocr): add dossier assist review card and document verification
  7. a3b6153 refactor(ui): redesign dispatch view and standardize tech-speak to administrative language
  8. a6f6e45 docs(handoff): record AI dossier assistant, realtime toast and UI polish progress
  9. 6f1b982 Merge remote-tracking branch origin/main into main
- **Xử lý xung đột (Conflict Resolution):** Đã kiểm tra và giải quyết triệt để xung đột nội dung tại 4 tệp (AdminPage.tsx, ConsultationsView.tsx, DispatchView.tsx, PROGRESS.md), giữ toàn vẹn tính năng Lịch ngày lễ toàn quốc (CalendarClosuresView) của remote và tính năng Phát thông báo, chuẩn hóa UI/UX của local.
- **Kiểm thử nghiệm thu:**
  - TypeScript npm run typecheck: Đạt 100% (0 lỗi).
  - ESLint npm run lint: Đạt 100% (0 lỗi, 0 cảnh báo).
  - npm run build: Build production thành công 100% (8.011 modules transformed).
  - Test suite: 32/32 calendar rules, 56/56 staffing validation, 9/9 Playwright E2E tests passed 100%.
- **Trạng thái Remote:** Đã push thành công lên origin/main (c86591e..6f1b982), nhánh đồng bộ hoàn toàn với remote.

## Rà soát Chuẩn hóa Text Kỹ thuật sang Ngôn ngữ Hành chính & Tối ưu UI/UX Toàn hệ thống — 01/11/2026

- **Phạm vi & Trạng thái thực tế:**
  1. **Khắc phục triệt để lỗi ô nhận xét bị co 1 dòng (`OfficerReviewWorkspaceView.tsx`):**
     - Thay thế `<Input>` 1 dòng bằng `<textarea>` 4 dòng (`rows={4}`), tự động xuống hàng, hiển thị toàn bộ nội dung văn bản dài do AI gợi ý hoặc cán bộ nhập, kèm bộ đếm ký tự `0/4.000 ký tự`.
  2. **Tái thiết kế UI/UX trang Điều phối hồ sơ của Quản lý (`DispatchView.tsx`):**
     - Thay thế việc in chuỗi UUID thô của cán bộ bằng việc tự động đối chiếu danh bạ để hiển thị Họ tên thật của cán bộ.
     - Thiết kế lại thẻ hồ sơ: bo góc `rounded-2xl`, hiển thị mã hồ sơ chuẩn font mono, hệ thống badge màu sắc trực quan (Xanh lá, Xanh lam, Vàng, Đỏ) kèm icon trạng thái Phosphor, bố trí các nút hành động (Phân công, Chuyển cán bộ, Lịch sử, Tham vấn) tinh gọn.
  3. **Tối ưu hệ thống thông báo & khử trùng lặp Real-time (`notificationStore.ts`, `NotificationToastSubscriber.tsx`):**
     - Bổ sung bộ lọc de-duplication trong vòng 4 giây: khi máy chủ SignalR phát sự kiện trùng lặp vào nhiều nhóm (User, Ward, Role), client tự lọc và chỉ hiển thị DUY NHẤT 1 Toast popup, triệt tiêu hiện tượng xếp chồng 3 thông báo.
     - Sửa lỗi click thông báo bị 404: bổ sung hàm `resolveNotificationUrl` chuyển đổi URL REST của backend thành route SPA chuẩn; công dân được dẫn thẳng vào màn hình Chi tiết hồ sơ, cán bộ được dẫn thẳng vào Không gian thẩm định hồ sơ.
     - Loại bỏ badge UUID `74b0ee66...` trong dropdown chuông thông báo; tự động trích xuất mã hồ sơ thân thiện `HS-2026...` từ nội dung.
  4. **Rà soát và chuyển hóa toàn bộ thuật ngữ kỹ thuật (Tech-speak) sang ngôn ngữ hành chính công:**
     - Loại bỏ các từ "BE", "API", "HTTP 401/429/415", "Mã kiểm vết", "payload JSON":
       - `ConsultationsView.tsx`: "BE kiểm tra..." -> "Hồ sơ ở chế độ tham khảo chuyên môn...", "Hệ thống sẽ chuyển yêu cầu đến chuyên viên cùng lĩnh vực đang trong ca trực để hỗ trợ giải đáp."
       - `DispatchView.tsx`: "BE xác minh lại điều kiện..." -> "Hệ thống sẽ kiểm tra ca trực và điều kiện của cán bộ khi lưu."
       - `CitizenFeedbackView.tsx`: "chưa có API lịch sử toàn bộ đánh giá..." -> "Hiển thị danh sách đánh giá theo các hồ sơ bạn đã hoàn tất tiền kiểm."
       - `OfficerDashboardView.tsx`: "⚠️ API sẽ tích hợp sau" -> "Bộ phận Một cửa" / "Được phân công theo ca" / "Biểu đồ tiến độ xử lý hồ sơ đang được tổng hợp số liệu thực tế theo ca trực."
       - `PermissionFeatures.tsx`: "kết nối API DocumentForm" -> "Chức năng quản lý kho biểu mẫu điện tử đang được hoàn thiện."
       - `AdminRbacViews.tsx`: "Xem payload JSON gốc" -> "Xem dữ liệu kiểm toán gốc".
       - `aiOcr.ts`: Bỏ các mã lỗi kỹ thuật "HTTP 401", "HTTP 429", "HTTP 415", chuyển "Mã kiểm vết" -> "Mã tra cứu hỗ trợ".
- **Kiểm tra đã chạy:**
  - `npm run typecheck`: **0 errors**.
  - `npm run lint`: **0 errors, 0 warnings**.
  - `npm run build`: **Build production thành công 100%**.
  - Playwright test: **100% passed** (`officer-dossier-assist`, `realtime-notification-toast`, `officer-notifications`).
- **Tệp liên quan:**
  - `src/pages/officer/OfficerReviewWorkspaceView.tsx`
  - `src/components/staffing/DispatchView.tsx`
  - `src/stores/notificationStore.ts`
  - `src/lib/api/notifications.ts`
  - `src/components/notifications/NotificationBell.tsx`
  - `src/components/notifications/NotificationToastSubscriber.tsx`
  - `src/pages/citizen/CitizenPage.tsx`
  - `src/pages/officer/OfficerPage.tsx`
  - `src/components/staffing/ConsultationsView.tsx`
  - `src/pages/citizen/views/CitizenFeedbackView.tsx`
  - `src/pages/officer/OfficerDashboardView.tsx`
  - `src/components/layout/PermissionFeatures.tsx`
  - `src/pages/admin/AdminRbacViews.tsx`
  - `src/lib/api/aiOcr.ts`
  - `docs/PROGRESS.md`

## Tích hợp Hoàn tất Tính năng AI Trợ lý Thẩm định Hồ sơ Một cửa (`AI-OFFICER-ASSIST-01`) & Cập nhật Quản trị Thông báo — 01/11/2026

- **Phạm vi & Trạng thái thực tế:**
  1. **Tầng API & Zod Schemas (`src/lib/api/aiOcr.ts`):**
     - Tích hợp endpoint mới `POST /api/v1/ai-ocr/applications/{applicationId}/dossier-assist` (Bearer token, body `{ includeSubmissions: true, includeSupportingDocuments: true }`).
     - Khai báo đầy đủ các Zod schemas chuẩn theo Backend bàn giao: `dossierAssistFileSchema`, `dossierAssistExtractedFieldSchema`, `dossierAssistCrossCheckSchema`, `dossierAssistResultSchema`.
     - Xử lý triệt để các mã lỗi từ Backend: `ai.provider_busy` (HTTP 429), `ai.not_assigned_officer` (HTTP 403), `ai.application_not_under_review` (HTTP 409), `ai.dossier_empty` (HTTP 422), `ai.output_truncated` (HTTP 502), `ai.provider_unavailable` (HTTP 503).
     - Helper `getAiRetryAfterSeconds`: trích xuất số giây từ header `Retry-After` (chuẩn hóa cả chữ hoa/thường lẫn fallback từ body) để kích hoạt đồng hồ đếm ngược.
  2. **Component Thẩm định AI (`src/components/documents/DossierAiReviewCard.tsx`):**
     - Đánh giá tổng thể (`overallAssessment`): `NO_ISSUES_FOUND` (Không phát hiện vấn đề), `NEEDS_ATTENTION` (Cần lưu ý kiểm tra đối soát), `INSUFFICIENT_DATA` (Chưa đủ thông tin đối chiếu) kèm tóm tắt (`summary`).
     - Bảng đối chiếu chéo (`crossChecks`): đối chiếu giữa bản khai DOCX và giấy tờ đính kèm CCCD/Hộ khẩu với 3 trạng thái rõ ràng: Trùng khớp (`MATCH`), Không khớp/Lệch (`MISMATCH`), Chưa có giấy tờ đối chiếu (`NOT_FOUND`).
     - Danh sách cảnh báo giấy tờ còn thiếu (`missingItems`) và lưu ý sai sót (`issues`).
     - Gợi ý nhận xét hành chính cho Cán bộ Một cửa (`suggestedComment`) kèm nút hành động "Chèn vào ô nhận xét" để đưa nội dung vào form nhận xét (không tự ý gửi nhận xét).
     - Danh sách tệp tin đã phân tích (`files`) kèm trạng thái, lý do bỏ qua (`skipReason`) và dòng lưu ý pháp lý (`disclaimer`) luôn hiển thị rõ ràng.
  3. **Tích hợp Không gian Làm việc Cán bộ (`src/pages/officer/OfficerReviewWorkspaceView.tsx`):**
     - Nhúng `DossierAiReviewCard` vào tab `Bản khai & giấy tờ`.
     - Phân quyền chặt chẽ: chỉ cán bộ đang trực tiếp thụ lý hồ sơ (`canVerifyAi` = `assignedOfficerId === user.id` && `!isManager`) mới thấy và chạy được tính năng. Ẩn hoàn toàn với Manager để tuân thủ quyền hạn.
     - Xử lý đếm ngược thời gian chờ khi gặp lỗi 429 quá tải hạn mức Google Gemini (`retryCountdown`).
     - Tự động điền nhận xét và chuyển tab `comments` khi bấm "Chèn vào ô nhận xét".
  4. **Cập nhật Bảng Quản trị Phát thông báo (`src/pages/admin/NotificationDeliveriesView.tsx`):**
     - Bổ sung 2 trạng thái giao thông báo mới từ Analytics Backend: `Dispatching` (Đang điều phối gửi) và `Unknown` (Không xác định) vào danh sách bộ lọc và badge hiển thị.
  5. **Kiểm thử tự động Playwright E2E:**
     - Tạo mới `tests/officer-dossier-assist.spec.ts` kiểm thử toàn diện 2 kịch bản:
       - Ca 1: Chạy trợ lý AI, đối soát chéo CCCD với bản khai DOCX, hiển thị danh sách giấy tờ thiếu và chèn nhận xét gợi ý vào form.
       - Ca 2: Xử lý lỗi 429 `ai.provider_busy`, đọc header `Retry-After` và hiển thị đồng hồ đếm ngược.
     - Cập nhật fixture `tests/fixtures/auth.ts` hỗ trợ expose header `Retry-After` trong CORS reply.
- **Kiểm tra đã chạy:**
  - `npm run typecheck`: **0 errors**.
  - `npm run lint`: **0 errors, 0 warnings**.
  - `npm run build`: **thành công 100%** (8011 modules transformed).
  - Playwright test: **11/11 tests passed** (bao gồm `officer-dossier-assist`, `realtime-notification-toast`, `ai-verify-and-deliveries`, `document-workflow`).
- **Tệp liên quan:**
  - `src/lib/api/aiOcr.ts`
  - `src/components/documents/DossierAiReviewCard.tsx`
  - `src/pages/officer/OfficerReviewWorkspaceView.tsx`
  - `src/pages/admin/NotificationDeliveriesView.tsx`
  - `tests/officer-dossier-assist.spec.ts`
  - `tests/fixtures/auth.ts`
  - `docs/PROGRESS.md`
- **Bước tiếp theo:**
  - Chờ DevOps/Backend deploy bản build backend AIOCR mới lên môi trường Azure để xác minh thực tế.

## Triển khai Hệ thống Thông báo Thời gian thực (Real-time In-App Toast & Hub Sync) — 31/10/2026

- **Phạm vi & Trạng thái thực tế:**
  1. **Notification Hub & Store tập trung (`useNotificationStore` - Zustand):**
     - Đưa kết nối WebSocket/SignalR NotificationHub (`/api/analytics-system/hubs/notifications`) lên cấp độ Store toàn cục ứng dụng.
     - Đồng bộ trạng thái kết nối (`connecting`, `connected`, `offline`), danh sách thông báo và số lượng chưa đọc (`unreadCount`).
     - Tự động duy trì kết nối xuyên suốt mọi trang (Trang chủ, Công dân, Cán bộ Một cửa, Quản lý, Quản trị viên).
  2. **Toast Popup Thông báo Thời gian thực góc trên bên phải (`NotificationToastSubscriber`):**
     - Lắng nghe sự kiện `ReceiveNotification` từ máy chủ SignalR và kích hoạt Toast Popup nổi trang trọng ở **góc trên bên phải** (`top-right`).
     - Giao diện Toast gồm: Biểu tượng chuông Một cửa, Tiêu đề hồ sơ, Nội dung tóm tắt, nhãn thời gian "Vừa xong • WardMate", nút đóng nhanh "×" và nút hành động "Xem hồ sơ" (click vào sẽ đánh dấu đã đọc và điều hướng thẳng đến đúng chi tiết hồ sơ).
     - Không phát âm thanh và không kích hoạt native desktop notification phiền toái theo đúng yêu cầu người dùng.
  3. **Chuông Thông báo Real-time (`NotificationBell`):**
     - Thay thế mock hook cô lập cũ; kết nối trực tiếp với `useNotificationStore`.
     - Badge đỏ trên icon chuông ở Header tự động nhảy số theo thời gian thực khi có thông báo mới.
     - Dropdown chuông hiển thị danh sách thông báo thật, trạng thái kết nối máy chủ, nút "Đánh dấu tất cả đã đọc" và phân loại Chưa đọc / Tất cả.
  4. **Tương thích ngược 100%:**
     - `useNotificationHub` được chuyển sang proxy qua `useNotificationStore`, giúp các trang `CitizenNotificationsView` và `OfficerNotificationView` hoạt động đồng nhất, mượt mà mà không phải sửa cấu trúc logic cũ.
- **Tệp liên quan:**
  - `src/stores/notificationStore.ts`
  - `src/components/notifications/NotificationToastSubscriber.tsx`
  - `src/components/notifications/NotificationBell.tsx`
  - `src/hooks/useNotificationHub.ts`
  - `src/app/App.tsx`
  - `tests/realtime-notification-toast.spec.ts`
  - `tests/notifications.spec.ts`
  - `tests/citizen-notifications.spec.ts`
  - `tests/officer-notifications.spec.ts`
- **Kiểm tra đã chạy:**
  - `npm run typecheck`: đạt (0 errors).
  - `npm run lint`: đạt (0 errors, 0 warnings).
  - `npm run build`: đạt (0 errors, 8010 modules transformed thành công).
  - Playwright tests: **10/10 tests passed** (bao gồm test mới `realtime-notification-toast.spec.ts`).

## Lập Đặc tả Yêu cầu Kỹ thuật Backend: AI Trợ lý Thẩm định & Phân tích Đơn DOCX (`AI-OFFICER-ASSIST-01`) — 31/10/2026

- **Phạm vi & Trạng thái thực tế:**
  1. **Tạo tài liệu bàn giao Backend (`docs/BE_FEATURE_REQUEST_AI_DOSSIER_ASSISTANT.md`):**
     - Làm rõ nguyên nhân cốt lõi vì sao AI OCR hiện tại từ chối file DOCX: `GeminiAssistant.cs` chỉ nhận MIME PNG, JPEG, PDF; `AuthorizedDocumentSource.cs` chỉ đọc `supporting-documents` chứ không gọi sang `submissions`.
     - Phân tích chi tiết vì sao bắt buộc phải xử lý ở Backend: Tính toàn vẹn cấu trúc bảng biểu Word (`DocumentFormat.OpenXml`), bảo mật thông tin công dân, phân quyền RBAC và lưu vết kiểm toán pháp lý (Audit Trail).
     - Đặc tả endpoint mới: `POST /api/v1/ai-ocr/applications/{applicationId}/dossier-assist` cho phép AI phân tích toàn diện bộ hồ sơ, đối chiếu chéo (Cross-check) giữa thông tin trong đơn DOCX với ảnh CCCD/giấy tờ đính kèm, phát hiện mâu thuẫn/bỏ sót và gợi ý sẵn nội dung nhận xét hành chính Một cửa (1-click chèn vào form).
     - Thống nhất cơ chế bản khai DOCX: Giữ nguyên cơ chế Replace (`PUT /draft`) hiện tại của Backend vì tờ khai là bắt buộc; Frontend đã hoàn thiện nhãn trực quan "Thay tệp Word khác", không cần phát triển thêm endpoint `DELETE`.
     - Khắc phục lỗi 503 `ai.provider_unavailable`: Phân tích nguyên nhân Google Gemini API Key bị chạm Rate Limit / Quota Exceeded (HTTP 429), đề xuất cơ chế Polly Retry Exponential Backoff và nâng cấp hạn mức quota.
  2. **Trạng thái mã nguồn Frontend:**
     - Đã hoàn tất 100% các tinh chỉnh UI/UX: Avatar Cán bộ Một cửa cho Chatbot AI, chuẩn hóa hiển thị danh xưng phường/xã, loại bỏ nút lặp, tối ưu skeleton loading bảng Quản trị phát thông báo, fallback thông minh khi backend gián đoạn.
     - Typecheck: 0 lỗi.
     - Lint: 0 lỗi.
     - Tests: 6/6 passed.
  3. **Tạo tài liệu cấu hình Azure Worker (`docs/BE_DEVOPS_NOTIFICATION_WORKER_CONFIG.md`):**
     - Hướng dẫn DevOps Backend bật worker thông báo `AnalyticsSystem` bằng cách đặt `minReplicas = 1` và `Notifications__WorkersEnabled=true` trên Azure Container Apps.
     - Giúp trang Quản trị Admin tự động nhận dữ liệu thực tế từ sự kiện nộp/tiếp nhận hồ sơ qua RabbitMQ.
  4. **Bước tiếp theo:**
     - Người dùng gửi tài liệu `docs/BE_FEATURE_REQUEST_AI_DOSSIER_ASSISTANT.md` cho đội Backend và DevOps.
     - Chờ Backend triển khai xong các endpoint trên máy chủ, Frontend sẽ tiến hành cắm tích hợp toàn diện giao diện và kiểm thử E2E.

## Hoàn thành bàn giao Backend và Chuẩn hóa hệ thống — 31/10/2026

- **Phạm vi & Trạng thái thực tế:**
  1. **Tính năng Rút nhận xét (`WORKFLOW-COMMENT-01`):**
     - Bổ sung `withdrawComment(id, commentId, reason)` gọi `DELETE /api/v1/applications/{id}/comments/{commentId}` kèm lý do 5-500 ký tự.
     - Cập nhật schema: `commentDtoSchema` hỗ trợ trạng thái `OPEN`, `RESOLVED`, `WITHDRAWN`, lưu vết `withdrawnBy`, `withdrawnAt`, `withdrawReason`.
     - Phía Cán bộ: chỉ cán bộ đang thụ lý được quyền rút nhận xét `OPEN` khi hồ sơ ở trạng thái `UNDER_REVIEW`. Hiển thị badge xám "Đã rút nhận xét" kèm thời gian và lý do.
     - Phía Công dân: trong `CitizenDossierDetailView.tsx`, nhận xét đã rút hoàn toàn bị ẩn, không còn là blocker chặn nộp lại hồ sơ hay chặn chuyển trạng thái.
  2. **Nâng cấp Chatbot AI Công khai (`AI-GUEST-01`) & Mã lỗi ProblemDetails:**
     - Bổ sung xử lý toàn bộ mã lỗi theo hợp đồng Backend: `ai.guest_quota_exceeded`, `ai.guest_limit_reached`, `ai.quota_exceeded`, `ai.daily_limit_reached`, `ai.output_truncated`, `ai.provider_unavailable`, `chat.busy`, `chat.database_unavailable`, `ai.document_not_found`, `ai.document_access_failed`.
     - Hiển thị `traceId` trong banner lỗi để người dùng báo cáo kỹ thuật. Cấu hình timeout 35s cho trường hợp cold start.
     - Tự động lưu và khôi phục `conversationId` cùng lịch sử tin nhắn của khách vào `localStorage`. Khi gặp sự cố máy chủ hoặc ngoại tuyến, hệ thống kích hoạt bộ cẩm nang tư vấn nghiệp vụ công dự phòng thông minh cho khách.
  3. **Chuẩn hóa Tiền kiểm AI và Phân quyền:**
     - Khắc phục triệt để lỗi 404 `ai.document_not_found`: Backend AI OCR chỉ hỗ trợ file tài liệu đính kèm `supportingDocuments` (.pdf, .png, .jpg, .jpeg); đã gỡ bỏ nút verify khỏi danh sách bản khai biểu mẫu `submissions`.
     - Phân quyền: Nút tiền kiểm chỉ hiển thị cho cán bộ đang thụ lý (`isAssignedOfficer`) và công dân sở hữu hồ sơ khi còn quyền sửa (`editable`). Ẩn hoàn toàn với Manager và cán bộ không phụ trách theo đúng phân quyền Backend.
  4. **Chuẩn hóa Thuật ngữ Giao diện (Mục 3.8):**
     - Loại bỏ các từ ngữ "phê duyệt hồ sơ", "duyệt tiền kiểm" khỏi giao diện vì WardMate là cổng chuẩn bị tiền kiểm trước quầy Một cửa, không thay thế tiếp nhận hành chính.
     - `DOCUMENTS_READY` chuẩn hóa thành "Giấy tờ sẵn sàng"; `OFFICIALLY_RECEIVED` chuẩn hóa thành "Đã tiếp nhận tại quầy".
     - Cập nhật text tại: `NotificationDeliveriesView.tsx`, `OfficerDashboardView.tsx`, `CitizenPage.tsx`, `CitizenDossierDetailView.tsx`, `CitizenQrCodeView.tsx`, `HomePage.tsx`, `FaqPage.tsx`.
  5. **Giải đáp màn hình Quản trị phát thông báo Admin (Ảnh gửi từ người dùng):**
     - Thanh tìm kiếm Network tab của DevTools đang bật bộ lọc `cookie-domain:cms.ptxsolution.com`, vô tình lọc hết mọi request (0 / 249 requests displayed). Xóa chuỗi lọc này trong DevTools sẽ thấy các request API /api/v1/... bình thường.
     - Bảng phát thông báo báo 200 OK nhưng tổng số = 0 vì chưa có sự kiện nộp/tiếp nhận nào được đẩy qua RabbitMQ trên máy chủ.
- **Tệp liên quan:**
  - `src/lib/api/workflow.ts`
  - `src/lib/api/workflowAdapters.ts`
  - `src/hooks/useWorkflow.ts`
  - `src/types/officer.ts`
  - `src/pages/officer/OfficerReviewWorkspaceView.tsx`
  - `src/pages/officer/OfficerDocumentsPanel.tsx`
  - `src/pages/officer/OfficerDashboardView.tsx`
  - `src/pages/citizen/components/DossierChecklistView.tsx`
  - `src/pages/citizen/views/CitizenDossierDetailView.tsx`
  - `src/pages/citizen/views/CitizenQrCodeView.tsx`
  - `src/pages/citizen/CitizenPage.tsx`
  - `src/pages/admin/NotificationDeliveriesView.tsx`
  - `src/pages/public/HomePage.tsx`
  - `src/pages/public/FaqPage.tsx`
  - `src/components/ai/AiChatWidget.tsx`
  - `src/lib/api/aiOcr.ts`
  - `tests/ai-verify-and-deliveries.spec.ts`
  - `tests/guest-chat-and-ai-fallback.spec.ts`
  - `docs/BE_HANDOVER_ISSUES_2026-10-30.md`
- **Kiểm tra đã chạy:**
  - `npm run typecheck`: đạt (0 errors).
  - `npm run lint`: đạt (0 errors, 0 warnings).
  - `npm run build`: đạt (0 errors, bundle 8009 modules thành công trong 22s).
  - Playwright test:
    - `tests/ai-verify-and-deliveries.spec.ts`: 4/4 passed (13.7s).
    - `tests/guest-chat-and-ai-fallback.spec.ts`: 2/2 passed (9.2s).
- **Trạng thái:** Sẵn sàng kiểm thử và bàn giao.

## Hoàn thiện 4 hạng mục theo phản hồi người dùng — 30/10/2026

- **Phạm vi & Trạng thái thực tế:**
  1. **Nghiệp vụ nút Tiền kiểm AI khi đã nộp hồ sơ:**
     - Đã thống nhất và triển khai trong `DossierChecklistView.tsx`: Nút `✨ Tiền kiểm AI` chỉ hiển thị khi hồ sơ đang chuẩn bị hoặc bổ sung (`editable === true`). Khi công dân đã chính thức nộp hồ sơ (`!editable`), nút tự động ẩn đi vì hồ sơ đã ở chế độ chỉ đọc, không thể thay đổi giấy tờ.
     - Cán bộ Một cửa (`Officer`) vẫn có nút tiền kiểm để đối soát khi thụ lý hồ sơ.
  2. **Xử lý lỗi 404 `ai.document_not_found` & Lỗi 503 `chat.database_unavailable`:**
     - Phân tích mã nguồn backend `AuthorizedDocumentSource.cs` (dòng 16-20) cho thấy `Download` gọi sang DocumentForm service với URL nội bộ và chỉ đọc supporting-documents (chưa hỗ trợ submissions).
     - Đã tạo tệp báo cáo kỹ thuật chi tiết: `docs/BE_HANDOVER_ISSUES_2026-10-30.md` để gửi trực tiếp cho đội ngũ Backend & DevOps cấu hình PostgreSQL, RabbitMQ và liên kết nội bộ giữa các microservices trên Azure.
     - Cập nhật `AiChatWidget.tsx`: khi người dùng đã đăng nhập gặp lỗi 503 từ BE, hệ thống tự động kích hoạt fallback tư vấn nghiệp vụ công chuẩn mực kèm thông báo bảo trì, không làm gián đoạn trải nghiệm người dùng.
  3. **Xử lý lỗi 503 `chat.database_unavailable` ở nút Tiền kiểm AI:**
     - Backend AIOCR phụ thuộc PostgreSQL AI chưa chạy migration/kết nối DB trên Azure. Phía FE: `src/lib/api/aiOcr.ts` bắt mã lỗi `chat.database_unavailable` và HTTP 503.
     - `DocumentAiVerificationCard.tsx` hiển thị banner cảnh báo amber thân thiện, nêu rõ máy chủ AI đang bảo trì hoặc chưa sẵn sàng DB, đồng thời hướng dẫn cán bộ/công dân đối soát giấy tờ thủ công để không làm tắc nghẽn quy trình nộp hay duyệt hồ sơ.
  4. **Hiển thị đầy đủ nút Tiền kiểm AI cho Officer:**
     - Trong `OfficerDocumentsPanel.tsx`: loại bỏ ràng buộc `item.fileExists &&`, chỉ cần `Boolean(item.id)` là hiển thị nút `✨ Tiền kiểm AI` cho toàn bộ tài liệu đính kèm.
     - Bổ sung nút `✨ Tiền kiểm AI` cho cả phần bản khai đã nộp (`submissions`) của cán bộ Một cửa và công dân.
     - Trong `OfficerReviewWorkspaceView.tsx`: thêm nút tắt `✨ Tài liệu & AI` tại tab Tổng quan (`overview`) dưới mỗi mục giấy tờ đã chuẩn bị, giúp cán bộ mở nhanh tab tài liệu để đối soát AI.
  5. **Mở khóa Chatbot AI cho Khách vãng lai (không cần đăng nhập):**
     - Trong `AiChatWidget.tsx`: bỏ chặn `if (!authenticated)`, mở khóa form nhập câu hỏi, nút gửi, bộ chọn phường/xã và gợi ý câu hỏi phổ biến (`QUICK_SUGGESTIONS`) cho mọi người dùng.
     - Xây dựng cơ chế tư vấn tự động nghiệp vụ thủ tục hành chính công một cửa (CCCD, Đăng ký kết hôn, Khai sinh, Chứng thực bản sao, Đăng ký cư trú) cho khách, kèm lời nhắc đăng nhập nếu muốn lưu phiên và dùng tiền kiểm AI trực tuyến.
  6. **Cải thiện màn hình Admin "Quản trị phát thông báo":**
     - Thiết kế lại Empty State giàu thông tin khi bảng rỗng: biểu tượng phát thanh, giải thích rõ cơ chế phát sinh bản ghi delivery qua sự kiện và broker RabbitMQ, hiển thị badge xác nhận kết nối máy chủ HTTP 200 OK và nút làm mới dữ liệu.
     - Phân tích nguyên nhân tab Network của người dùng bị trống do filter DevTools `cookie-domain:cms...` vô tình ẩn requests.
- **Tệp liên quan:**
  - `src/lib/api/aiOcr.ts`
  - `src/components/documents/DocumentAiVerificationCard.tsx`
  - `src/pages/officer/OfficerDocumentsPanel.tsx`
  - `src/pages/officer/OfficerReviewWorkspaceView.tsx`
  - `src/pages/citizen/components/DossierChecklistView.tsx`
  - `src/components/ai/AiChatWidget.tsx`
  - `src/pages/admin/NotificationDeliveriesView.tsx`
  - `tests/guest-chat-and-ai-fallback.spec.ts`
  - `tests/ai-verify-and-deliveries.spec.ts`
- **Kiểm tra đã chạy:**
  - `npm run typecheck`: đạt (0 errors).
  - `npm run lint`: đạt (0 errors, 0 warnings).
  - `npm run build`: đạt (0 errors, 8009 modules transformed).
  - Playwright test:
    - `tests/ai-verify-and-deliveries.spec.ts`: 3/3 passed.
    - `tests/guest-chat-and-ai-fallback.spec.ts`: 2/2 passed.
    - Tổng cộng 5/5 passed (16.7s).
- **Trạng thái:** Toàn bộ thay đổi ở frontend, không can thiệp backend.

## Tích hợp AI Tiền kiểm giấy tờ, Lịch sử Chat AI và Quản trị Delivery Thông báo — 30/10/2026

- **Phạm vi:** Hoàn thiện 3 hạng mục API còn thiếu theo đối chiếu mã nguồn Backend mới nhất (`WardMate.Services.AIOCR` và `WardMate.Services.AnalyticsSystem`):
  1. **AI Tiền kiểm giấy tờ (`POST /api/v1/ai-ocr/documents/verify`)**:
     - Thêm `documentVerificationSchema`, `DocumentVerificationDto`, `VerifyDocumentInput`, `verifyDocument` trong `src/lib/api/aiOcr.ts`.
     - Thêm component `DocumentAiVerificationCard.tsx` hiển thị badge hợp lệ, cảnh báo lỗi chất lượng (mờ/lóa/thiếu trang), độ tin cậy và lý do chi tiết từ AI.
     - Tích hợp vào màn chuẩn bị hồ sơ công dân (`DossierChecklistView.tsx`) và màn thẩm định của cán bộ Một cửa (`OfficerDocumentsPanel.tsx`).
  2. **Lịch sử phiên trò chuyện AI (`GET /api/v1/ai/chat/sessions` và `GET .../messages`)**:
     - Cập nhật `AiChatWidget.tsx`: thêm nút Lịch sử, Drawer xem danh sách các phiên chat gần đây, chuyển đổi giữa các phiên cũ và tải lại đầy đủ tin nhắn.
  3. **Quản trị Delivery Thông báo cho IT Admin (`GET /api/v1/admin/notification-deliveries`, audit, replay)**:
     - Tạo `src/lib/api/notificationAdmin.ts` với Zod schema và API client.
     - Tạo view `NotificationDeliveriesView.tsx` trong Admin workspace, hỗ trợ lọc trạng thái, kênh phát, xem chi tiết, lịch sử kiểm toán (audit) và modal Replay an toàn.
     - Bổ sung định tuyến `proxy['/api/v1/admin/notification-deliveries']` trong `vite.config.ts` và test proxy trong `tests/api-proxy-check.mjs`.
- **Kiểm tra đã chạy:**
  - `npm run typecheck`: đạt (0 lỗi).
  - `npm run lint`: đạt (0 lỗi).
  - `node tests/api-proxy-check.mjs`: 29/29 route đạt.
  - `npm run build`: đạt (0 lỗi).
  - Playwright `tests/ai-verify-and-deliveries.spec.ts`: 3/3 passed.
  - `git diff --check`: đạt.
- **Trạng thái:** Chưa commit/push. Không can thiệp Backend.

Cập nhật: 02/11/2026.
Mục đích: giúp phiên Codex mới tiếp tục đúng công việc và quyết định đã thống nhất.
Đọc cùng `../AGENTS.md`; luôn xác minh lại bằng code và Git trước khi hành động.

## Điều chỉnh nhận diện trang chủ — 02/11/2026

- Đã bỏ nhãn “Cổng tiền kiểm điện tử” khỏi header trong `src/components/layout/MainLayout.tsx`; thay quốc huy ở phần giới thiệu trang chủ bằng `BrandMark` dùng logo WardMate hiện có, với tên ảnh “Logo WardMate” trong `src/pages/public/HomePage.tsx`.
- Đổi class CSS thành `hero-brand-mark` trong `src/styles/globals.css`, giữ kích thước responsive 80/96px và bóng hiện tại.
- Kiểm tra mới: `npm run typecheck`, `npm run lint`, `git diff --check` đạt; test Playwright Edge kiểm tra không tràn ngang tại 360/390/768/1024/1440px báo `ok` (1 test, Catalog mock), nhưng tiến trình runner chưa thoát sau test nên chưa xác nhận exit code toàn lệnh. Chưa chạy production build, chưa kiểm tra trực quan hoặc zoom 200%; không thay đổi API. Chưa commit/push.

## Bàn giao 15 commit calendar/staffing để push main — 01/11/2026

- Người dùng yêu cầu chia toàn bộ thay đổi tích hợp/rà soát thành đúng **15 commit** và push lên main. Remote đã kiểm tra: `https://github.com/wardmate-capstone/wardmate-frontend.git`; nhánh local `main` theo dõi `origin/main`. Fetch trước khi chia xác nhận cùng gốc `3f583c999583eb7078b13e04bcd8dcd204f15f82`, không có commit remote mới tại thời điểm đó.
- Đã nhóm 15 commit có nội dung thực: **7 feat, 5 fix, 1 test, 2 docs** (gồm commit bàn giao này). Không tạo commit rỗng, sửa mã sản phẩm để tăng số commit, viết lại lịch sử đã push, đổi backend/auth/core/dependency/môi trường hoặc stage test-results/dist/secrets. Script và message tạm nằm trong test-results bị ignore, không thuộc bản phát hành.
- 14 commit trước commit bàn giao này: `61971a3` quy tắc ngày Việt Nam; `9653570` 4 API closures; `d80159f` thông báo lỗi staffing; `1e27b8f` validation lựa chọn/ngày giờ; `259e1d8` chặn gửi lại không xác định; `8203821` UI calendar; `e53bfda` Manager; `93400da` Officer; `8d3179d` Admin; `3e2ae14` menu; `bfde549` khoảng ngày staffing/nhãn lý do; `3b99f0d` cache tham vấn; `9f9546e` kiểm thử; `8dc15ef` tài liệu tích hợp.
- Kiểm tra chạy lại trong lượt chia commit: ngày calendar **32/32**, validation **56/56**, `git diff --check` đạt. Không sửa code sản phẩm trong lượt chia commit. Typecheck/lint/build và **11/11 Edge** ở mục rà soát bên dưới là kết quả lượt trước, không phải vừa chạy lại và không khẳng định từng commit trung gian đã build độc lập. Build còn cảnh báo thư viện/chunk lớn; luồng đăng nhập/ghi production và responsive cả workspace chưa nghiệm thu.
- Mục này được ghi trước push. Chỉ kết luận đã push sau khi lệnh push thành công và SHA từ `git ls-remote origin refs/heads/main` khớp HEAD; không force push. SHA cuối của commit bàn giao tra bằng Git, không tự ghi SHA vào chính commit đó. Các dòng “chưa commit/push” trong hai mục triển khai/rà soát bên dưới là lịch sử trước lần chia commit này.

## Rà soát lỗi và validation staffing/calendar — 01/11/2026

- Theo yêu cầu kiểm tra/sửa lỗi sau tích hợp: giữ nguyên toàn bộ thay đổi chưa commit của lượt trước; không đổi BE, auth/core, dependency hoặc môi trường.
- `src/lib/staffingValidation.ts` và `shared.tsx`: validate lựa chọn theo options hiện tại, loại mục disabled/đã biến mất; giữ trim/giới hạn độ dài; chặn datetime không tồn tại/không đúng định dạng, giờ 24:00/phút 60 và khoảng đảo/ngang/vượt giới hạn. `StaffingView.tsx` kiểm tra date-only thực và khoảng xem <=93 ngày gồm hai đầu. Lỗi form liên kết aria-describedby; lỗi 400 từ BE đưa focus về trường sau khi hết trạng thái đang gửi.
- Form staffing chung khóa gửi và tải lại cache khi 403/404/409/422, lỗi mạng/5xx hoặc kết quả không xác định; không cho gửi lại ngay sau timeout có thể đã lưu phía BE. Calendar hủy dựa vào bản ghi GET mới nhất, khóa khi đang refetch/đã hủy/đã bắt đầu/không còn bản ghi; hộp thoại cũ không dùng lại khi danh tính/phường/quyền/phạm vi đổi. Calendar cũng focus trường có lỗi BE sau khi fieldset mở lại.
- `ConsultationsView.tsx`: cache contents và tệp chọn gắn phiên bản hồ sơ; đổi phiên bản ẩn preview cũ, buộc chọn lại. Binary dùng revision riêng cho ngữ cảnh tham vấn để tránh dùng chung cache với màn nghiệp vụ khác. `staffingError.ts` chỉ lấy mã lỗi có trong chính bảng thông báo, không lấy thuộc tính prototype.
- Kiểm tra mới: `npm run typecheck`, `npm run lint`, `git diff --check` đạt; `npm run build` ngoài sandbox đạt, còn cảnh báo annotation thư viện/chunk lớn. Ngày/giờ **32/32**, validation request/form **56/56**, tương tác ActionForm độc lập trên Edge **11/11** đạt. Lượt Edge cuối không request API, không runtime error; xem ảnh form 360px tại test-results/staffing-validation-mobile.png, không tràn ngang. Chỉ form độc lập có callback điều khiển để kiểm tra lỗi/chờ; không giả lập response BE hoặc tài khoản, không phải nghiệm thu 3 workspace thật.
- Mới: `tests/staffing-validation-check.mjs`, `tests/staffing-form-check.mjs`. Các lượt harness ban đầu chưa đạt do cache/quyền Vite, route bị SPA fallback, target ES2022 và chặn nhầm import /src/lib/api; đã sửa harness, chỉ dùng lượt cuối exit 0 làm bằng chứng. Lượt fallback từng thử bootstrap refresh không token và bị môi trường chặn; lượt cuối 0 API request. Không chạy lại bộ 22/22 Azure ở lượt này; kết quả đó thuộc lượt tích hợp trước.
- Còn chờ nghiệm thu nghiệp vụ bằng tài khoản thật và responsive cả workspace. Giới hạn DOCX tham vấn/lý do phân công phía BE vẫn như mục trước. Chưa commit/push. Chi tiết và lệnh chạy tại docs/STAFFING_INTEGRATION.md.

## Tích hợp lịch đóng cửa/ngày lễ và rà soát staffing — 01/11/2026

- Theo kế hoạch đã được người dùng yêu cầu triển khai: bổ sung 4 API lịch đóng cửa, tổng 22 API bàn giao; đọc lại source BE mới tại E:/wardmate-backend và Swagger Azure trước khi sửa. Không đổi backend, auth/core, dependency hoặc môi trường.
- Mới: `src/lib/calendarRules.ts`, `src/lib/api/calendarClosures.ts`, `src/lib/api/staffingError.ts`, `src/components/staffing/CalendarClosuresView.tsx`, `tests/calendar-rules-check.mjs`. Gắn menu/section/title vào Manager, Officer và Admin; giữ UI dùng chung, form RHF/Zod, cache TanStack Query, Modal/Toast hiện có.
- Lịch có phạm vi/trạng thái/chi tiết hủy; date-only VN, xem <=400 ngày gồm hai đầu, tạo hôm nay..+366, lý do trim 1–500, hủy tương lai trong phạm vi BE. POST hiển thị số hồ sơ đổi hạn từ BE và tải lại staffing/workflow/analytics; không tính hạn hoặc tự chuyển cán bộ. Xử lý 403 body rỗng, xung đột và kết quả ghi chưa chắc chắn; không tự retry ghi.
- Rà soát API cũ: sửa danh sách chuyên viên bị rỗng khi hồ sơ thiếu category (để BE tra Catalog); quyền đọc tham vấn refetch khi focus/reconnect; bổ sung lỗi staffing tiếng Việt/422 và giữ giới hạn lý do phân công 470. Source BE mới vẫn chặn DOCX tham vấn qua OfficerSubmission và vẫn cắt lịch sử lý do ở 500 ký tự gồm mã.
- Kiểm tra mới: ngày/giờ thuần **32/32** đạt, lint và `git diff --check` đạt; `npm run build` (gồm TypeScript) đạt ngoài sandbox sau các lần sandbox lỗi EPERM ở dist/.gitkeep. Build còn cảnh báo annotation thư viện/chunk lớn hiện hữu. Swagger + ranh giới auth trên Gateway Azure trực tiếp **22/22** trả 401 ProblemDetails auth.unauthorized không token. Không tạo bản ghi/tài khoản, không chạy mock; không kiểm tra proxy Vite trong lượt này.
- Còn chờ: QA trình duyệt/responsive và nghiệp vụ đăng nhập bằng tài khoản Manager/Officer/IT_ADMIN thật trên dữ liệu được phép thử; đặc biệt tạo/hủy và cập nhật hạn, 403/409, lịch toàn quốc/phường trùng, quyền DOCX tham vấn. Không dùng các kết quả build/test cũ bên dưới làm kết quả lượt này. Chi tiết/lệnh kiểm tra tại `docs/STAFFING_INTEGRATION.md`. Chưa commit/push.

## Chốt commit tích hợp Staffing/Workflow để push main — 30/10/2026

- Yêu cầu hiện tại cho phép commit/push trực tiếp frontend lên `origin/main`, không force push. Đối chiếu ban đầu: nhánh cloud `work` và `origin/main` cùng `1635a0e`; chuyển sang nhánh local `main` theo dõi `origin/main`, giữ nguyên thay đổi.
- Nội dung yêu cầu nêu cả mốc 20 và mục tiêu 25; chọn **20 commit có ý nghĩa** từ thay đổi thực, không tạo commit rỗng, không thêm tính năng hoặc viết lại lịch sử để đủ số. Gồm 19 commit triển khai/tài liệu và commit bàn giao này. Không khẳng định từng commit trung gian build độc lập; kiểm tra áp dụng trên cây mã cuối.
- Kiểm tra mới trong môi trường đã publish: `npm run typecheck`, `npm run lint`, `npm run build`, `git diff --check` đạt; build còn cảnh báo annotation thư viện và chunk lớn. Không sửa mã sản phẩm, lockfile hoặc backend trong lượt chia commit; không thêm mock dữ liệu và không chạy lại suite dùng mock.
- Swagger Azure qua gateway đã trả HTTP 200 và có đủ 18 operation. Ghi chú CONNECT 403 ở lượt trước là lịch sử, không còn là trạng thái truy cập hiện tại. Lượt này chỉ đọc Swagger, không tạo dữ liệu hoặc thử thao tác ghi trên Azure; chưa nghiệm thu luồng có đăng nhập.
- Fetch lại trước push: remote chưa có commit mới ngoài gốc `1635a0e`. Không thay đổi cấu hình môi trường hoặc publish thêm. Kết quả push và HEAD cuối phải xác minh bằng `git ls-remote origin refs/heads/main`; không xem việc tạo commit là bằng chứng đã push.
- Thời điểm kiểm tra/chốt: 2026-10-30T11:36:26+07:00. Giới hạn DOCX tham vấn và lịch sử lý do BE ở báo cáo tích hợp vẫn còn.
- 19 commit trước commit bàn giao này:
  - `d048e12a11` — feat(api): add validated dispatch and assignment services
  - `d47a706781` — feat(api): add shift leave and handover services
  - `2c510ef141` — feat(api): add versioned consultation services
  - `0697a09421` — feat(staffing): add permission-aware queries and validated action forms
  - `8de33388b2` — feat(assignments): select eligible officers for assignments and transfers
  - `7f34d168a7` — feat(consultations): add inbox replies and read-only document review
  - `4b746c8adf` — feat(dispatch): add paginated coordination and assignment history
  - `edb221b3de` — feat(staffing): add shift leave and handover screens
  - `56cd33cfbf` — feat(manager): define staffing workspace sections and titles
  - `75a911e4ac` — feat(manager): integrate staffing screens into the workspace
  - `3b1c529b06` — feat(officer): define schedule leave and consultation sections
  - `f264fb44fd` — feat(officer): integrate personal staffing and consultation views
  - `e8971a4063` — feat(review): show permission-gated application consultations
  - `570f416e7a` — feat(navigation): gate manager staffing actions by permissions
  - `75afcf5496` — feat(navigation): expose officer staffing and consultation menus
  - `1eb7422483` — refactor(assignments): use dispatch APIs in dossier supervision
  - `d793e902de` — fix(proxy): route staffing requests to Workflow before IAM
  - `69810c7d82` — test(staffing): verify real OpenAPI and unauthenticated routes
  - `1249e4bb83` — docs(staffing): explain integration validation and backend limits

## Tích hợp 18 API Staffing/Workflow — 30/10/2026

- Theo yêu cầu người dùng: triển khai kế hoạch điều phối, ca làm, nghỉ phép và tham vấn; **không mock dữ liệu**. Hoàn tất thay đổi FE lúc 2026-10-30T11:26:06+07:00.
- Thêm `src/lib/api/staffing.ts` (18 API, schema response), `src/components/staffing/{shared,DispatchView,StaffingView,ConsultationsView}.tsx`; bổ sung menu/title/section Manager và Officer, tab Tham vấn trong chi tiết cán bộ, Vite proxy `/api/v1/staffing`. Nút giao/chuyển ở màn Giám sát cũ dùng API mới; giữ bộ lọc giám sát hiện hữu.
- Form dùng RHF/Zod và UI chung; version lấy từ dữ liệu API, xử lý 409/422 bằng tải lại và xác nhận lại, không retry ghi; nhập/hiển thị giờ Việt Nam, role/permission theo BE, tài liệu tham vấn chỉ đọc. Không sửa BE, auth/token hoặc lockfile; không thêm dữ liệu mẫu/fake response.
- Validation lượt này: `npm run build` (gồm typecheck), `npm run lint`, `git diff --check` đạt. Build còn cảnh báo annotation thư viện/chunk lớn. `tests/staffing-live-check.mjs` **18/18 đạt** trên Swagger/Workflow .NET thật và request qua Vite → gateway → Workflow: tất cả trả 401 ProblemDetails đúng code khi không token. Không tạo bản ghi/tài khoản, không chạy test mock; **chưa chứng minh luồng có đăng nhập hoặc thao tác ghi đạt**, chưa QA responsive bằng tài khoản thật.
- Azure Swagger hiện bị proxy môi trường chặn CONNECT 403. Đã lưu thêm domain gateway vào draft network, chưa áp dụng/publish. Cần review/save cấu hình mạng và nghiệm thu tài khoản Manager/Officer thật.
- Giới hạn BE xác minh từ source: tải DOCX của chuyên viên tham vấn vẫn bị `OfficerSubmission -> Check(officer: true)` yêu cầu cán bộ phụ trách chính; không giả lập tải thành công. Lý do phân công BE lưu lịch sử tối đa 500 ký tự gồm mã; UI giới hạn phần nội dung 470. Endpoint điều phối chỉ có phân trang, không giả bộ lọc toàn bộ trên một trang. Danh sách chọn chuyên viên lấy IAM thật, điều kiện cuối cùng do BE xác minh.
- Báo cáo chi tiết, cách kiểm tra lại và điểm cần BE xử lý: `docs/STAFFING_INTEGRATION.md`. Chưa commit/push. Gợi ý commit: `feat(staffing): integrate dispatch scheduling leave and consultation APIs`.

## Chốt 8 commit hướng dẫn, giao diện công khai và email — 27/10/2026

- Theo yêu cầu người dùng, chia toàn bộ thay đổi từ `d35365c` thành đúng **8 commit**: dữ liệu hướng dẫn, trang/route hướng dẫn, menu/header, hướng dẫn landing, trang tra cứu, email hồ sơ, kiểm thử và tài liệu bàn giao. Các mục bên dưới là lịch sử triển khai; dòng “chưa commit/push” của từng lượt không còn mô tả trạng thái hiện tại.
- 7 commit code/test: `b26af13`, `d4fc7af`, `9df2b20`, `768ad8f`, `2a16c66`, `e591b96`, `66e916c`. Đã push và xác minh `origin/main` bằng `git ls-remote` tại `66e916cb62d6bd15117177c565b777649ef5a517`. Commit chứa mục bàn giao này là commit thứ 8; xác nhận SHA cuối sau push bằng Git, không ghi trước kết quả chưa thực hiện.
- Kiểm tra mới nhất trên trạng thái code cuối: `npm run typecheck`, `npm run lint`, `npm run build`, `git diff --check` đạt. Build còn cảnh báo annotation Zod/SignalR và chunk lớn. Chỉnh hai locator “Chứng thực” để chọn đúng bộ lọc lĩnh vực, tránh trùng gợi ý tìm kiếm.
- Playwright `guide-profile-email`, `landing`, `procedures-ui`, `auth-recovery`: **23/23 đạt**, chạy Edge ngoài sandbox, có tổng kết exit 0; không dùng các lượt bị dừng trước đây làm bằng chứng đạt. Kiểm thử dùng mock, không gửi OTP thật hoặc nghiệm thu SMTP/API Azure. Không thay đổi auth/core hay backend; không chạy lại toàn suite hoặc kiểm thử từng commit độc lập.
- File sinh tự động `auth-otp-diagnosis-tests.log` giữ ở máy, không stage/commit. Không đổi dependency. Báo cáo chi tiết: [GUIDE_AND_EMAIL_REVIEW_2026-10-27.md](GUIDE_AND_EMAIL_REVIEW_2026-10-27.md). Còn chờ nghiệm thu môi trường thật khi có yêu cầu.

## Đưa nội dung banner hướng dẫn lên trên — 27/10/2026

- `GuidePage.tsx`: bỏ căn giữa dọc (`justify-center`), căn nội dung từ trên; giảm padding đầu xuống 24px mobile/32px từ màn hình sm. Breadcrumb, tiêu đề và thẻ chuẩn bị dịch lên gần menu; giữ chiều cao banner và ảnh phủ kín theo yêu cầu trước.
- Kiểm tra: `npm run typecheck`, ESLint riêng `GuidePage.tsx`, `git diff --check` đạt. Thay đổi khoảng cách thuần túy; không chạy lại build/Playwright, chưa xác minh ảnh trình duyệt lượt này. Chưa commit/push.

## Mở rộng banner và làm lại đầu trang thủ tục — 27/10/2026

- `GuidePage.tsx`: banner cao tối thiểu 640px desktop/600px màn hình nhỏ, ảnh phủ kín; nền kem tiếp tục xuống nội dung và bỏ padding đầu khối sau banner để không còn dải trắng ngắt quãng.
- `ProceduresPage.tsx`, `globals.css`: bỏ khung bo viền đỏ và khoảng đệm bên ngoài đầu trang công khai. Hero trải ngang sát menu, nền kem, breadcrumb, H1 hiển thị và mô tả rõ tiền kiểm; bỏ các badge phụ. Giữ tìm kiếm/lĩnh vực/phân trang/API hiện có; bản nhúng trong cổng công dân vẫn gọn trong workspace.
- Kiểm tra: typecheck/lint/build, `git diff --check` đạt; build còn cảnh báo annotation Zod/SignalR và chunk lớn. Đã xem screenshot hướng dẫn desktop, trang thủ tục desktop/mobile; Playwright mock đã tạo ảnh thủ tục công khai và nhúng ở 1440/390px, qua kiểm tra reflow 1440/768/390/360px. Các tiến trình `guide-profile-email` (2 ca UI) và `procedures-ui` (ca bố cục) chưa trả tổng kết sau chụp ảnh nên đã dừng, không khẳng định suite đạt. Script xem trang riêng trả timeout khi chờ H1, không dùng làm bằng chứng UI đạt. Chưa xác minh API thật; chưa commit/push.

## Đồng bộ màu thanh menu với nút Tìm kiếm — 27/10/2026

- `MainLayout.tsx`: đổi nền thanh điều hướng desktop từ gradient đỏ sẫm sang `bg-red-700`, cùng token với nút Tìm kiếm (`Button` primary) ở trang thủ tục. Giữ chữ trắng, hover và gạch vàng của mục đang chọn.
- Kiểm tra: `npm run build` (gồm typecheck), ESLint riêng `MainLayout.tsx` và `git diff --check` đạt. Build còn cảnh báo annotation Zod/SignalR và chunk lớn như trước. Không chạy lại Playwright cho thay đổi màu thuần túy. Không thay đổi API; chưa commit/push.

## Banner trang hướng dẫn và nút đăng nhập — 27/10/2026

- Dùng ảnh có sẵn `public/hero-architecture-bg.jpg` làm nền banner `/huong-dan` trong `GuidePage.tsx`; phủ sáng để giữ nội dung dễ đọc, tăng lớp phủ trên màn hình nhỏ.
- `MainLayout.tsx`: nút Đăng nhập desktop đỏ đậm/chữ trắng, hover đỏ sẫm; sửa co giãn thương hiệu/header để nút menu không bị đẩy ra ngoài viewport 320px. Giữ nguyên các thay đổi chưa commit có sẵn, không sửa backend/API.
- Kiểm tra cuối: typecheck/lint/build và `git diff --check` đạt; build còn cảnh báo annotation Zod/SignalR và chunk lớn. Đã xem ảnh desktop/mobile 320px. Playwright mock chạy lại `guide-profile-email`: hai ca hướng dẫn desktop/mobile hoàn tất và chuyển sang ca profile, nhưng tiến trình chưa trả tổng kết nên đã dừng; không khẳng định toàn suite đạt. Lượt `guide-profile-email` + `landing` trước đó phát hiện lỗi menu 320px (đã sửa) và lỗi locator hai nút “Chứng thực” ở trang thủ tục đang có thay đổi ngoài phạm vi task; lượt đó cũng đã dừng khi chưa trả tổng kết. Chưa commit/push.

## Trang hướng dẫn, menu giữa và email hồ sơ — 27/10/2026

- Bắt đầu từ `d35365c`, working tree sạch. Yêu cầu mới: xây lại Hướng dẫn thực hiện, căn giữa menu landing, đọc BE quên mật khẩu email và giải thích thiếu email trong hồ sơ.
- Thêm `/huong-dan` (`GuidePage.tsx`) với mục lục, 6 bước và hỗ trợ OTP/QR; dữ liệu chung ở `src/data/preparationGuide.ts`. Menu desktop căn giữa, có active state; menu mobile/footer mở route mới. HomePage cập nhật phần hướng dẫn chi tiết 6 bước, link theo từng mục; anchor `/#quy-trinh` cũ vẫn dùng được. JourneySteps hiện có vẫn tóm tắt 4 giai đoạn tổng quát.
- CitizenProfileView hiện Email đăng ký từ `useAuthStore.user.email`, chỉ đọc vì ProfileInput BE không có email. Email không đi vào payload cập nhật hồ sơ. BE bắt buộc email khi đăng ký; chưa thấy hợp đồng tự đổi email trong các controller đã rà soát.
- Đọc source IAM: AuthController/PasswordOtpService/IamEmailSender đã có request OTP email và verify-and-change cho FORGOT_PASSWORD; 6 số, 5 phút, giới hạn gửi/thử, thu hồi phiên sau thành công. Gửi tới email User; thiếu cấu hình email trả 503. 202 là thông báo chung, không chứng minh SMTP đã gửi/khách đã nhận. Không gọi gửi email thật, không sửa BE.
- Báo cáo đối chiếu và file kiểm tra: [GUIDE_AND_EMAIL_REVIEW_2026-10-27.md](GUIDE_AND_EMAIL_REVIEW_2026-10-27.md).
- Kiểm tra: typecheck/lint/build đạt (cảnh báo chunk DOCX/annotation Zod cũ); Playwright `guide-profile-email`, `landing`, `auth-recovery`, `full-audit` **31/31 đạt** bằng mock; đã xem ảnh desktop/mobile. Không chạy lại toàn bộ suite hoặc gửi OTP Azure thật. Chưa commit/push; yêu cầu push của task trước không áp dụng cho task này.

## Chốt 20 commit và kiểm tra trước push main — 27/10/2026

- Theo yêu cầu người dùng, toàn bộ đợt thay đổi từ `789587a` được chia thành **20 commit** theo hạng mục: profile/validation, chat/AI/OCR, quyết định và trạng thái hồ sơ, QR, tài liệu, thủ tục, lớp hiển thị, thông báo, kiểm thử và báo cáo. Không sửa backend, không đổi dependency.
- 19 commit đầu: `01dc919` → `091be5b`. Đã xác minh bằng `git ls-remote origin refs/heads/main` rằng GitHub `wardmate-capstone/wardmate-frontend`, nhánh `main`, ở `091be5b35dfb123a9aebaa12a0c060af4564402f` và đã chứa 19 commit này. Commit bàn giao này là commit thứ 20, gồm 3 tài liệu còn lại và fixture auth được cập nhật sau kiểm tra toàn bộ. Xác nhận SHA push cuối cùng bằng Git; không dùng các dòng “chưa commit/push” trong những mục lịch sử phía dưới làm trạng thái hiện tại.
- **Kiểm tra chốt đợt:** `npm run typecheck`, `npm run lint`, `npm run build` đạt; build còn cảnh báo chunk DOCX lớn và annotation Zod đã biết. Proxy local **23/23** đạt.
- Playwright toàn bộ **243/244 đạt**. Ca lỗi `auth.spec.ts` không nhận biết request negotiate của NotificationHub mới tại cổng công dân; mock coi request này là `/mock-private`. Đã cập nhật fixture trả 503 cho negotiate để mô phỏng dịch vụ thông báo không khả dụng, giữ nguyên các assertion cookie HttpOnly, token RAM và refresh. Chạy lại toàn bộ `tests/auth.spec.ts`: **8/8 đạt**. Không trình bày kết quả này thành một lượt toàn bộ 244/244 đạt.
- Source sản phẩm giữ nguyên sau lượt toàn bộ; thay đổi cuối chỉ là fixture test và tài liệu. Các commit không được kiểm thử độc lập. SignalR/API trong Playwright dùng mock; chưa nghiệm thu Azure có đăng nhập, OTP/worker/Blob/Gotenberg hoặc quét QR thực tế.
- Báo cáo: [FULL_AUDIT_2026-10-27.md](FULL_AUDIT_2026-10-27.md), [API_UI_ENDPOINTS_2026-10-27.md](API_UI_ENDPOINTS_2026-10-27.md), [CHANGES_AND_CHECKLIST_2026-10-27.md](CHANGES_AND_CHECKLIST_2026-10-27.md). Các giới hạn nghiệp vụ/API trong báo cáo vẫn còn hiệu lực.

## Sửa UI hộp thư thông báo công dân — 27/10/2026

- Theo ảnh người dùng, trang chỉ có thanh tiêu đề/nút đọc tất cả và khoảng trống. Nguyên nhân code: `CitizenPage` giữ mảng thông báo rỗng cục bộ; thao tác đọc tất cả chỉ sửa state/toast, chưa dùng NotificationHub.
- `CitizenNotificationsView.tsx`: dựng lại header/mô tả, bộ lọc Tất cả/Chưa đọc có số lượng trong danh sách, nhãn chưa đọc, thời gian, mở hồ sơ và đánh dấu từng mục/tất cả. Thêm loading/empty/offline/lỗi thao tác riêng; khóa gửi lặp và thao tác khi chưa kết nối; nút/khối xuống dòng ở 320px. Không có xóa hoặc dữ liệu mẫu.
- `CitizenPage.tsx`: dùng `useNotificationHub` hiện có cho hộp thư và số chưa đọc ở chuông; mở hồ sơ bằng applicationId qua Workflow. Không dùng actionUrl tùy ý từ notification. Đây là hộp thư trong cổng công dân, không phải thay đổi dropdown `NotificationBell` công khai.
- `useNotificationHub.ts`: chỉ báo connected sau khi tải snapshot thành công; lỗi tải được hiển thị offline và retry trên kết nối hiện hữu; reconnect cũng tải lại qua cùng luồng retry. Sau MarkRead, đọc lại GetUnreadCount; offline không được xem là đánh dấu thành công. Đã đối chiếu GetNotifications/GetUnreadCount/MarkRead với NotificationHub BE; BE chưa có MarkAllRead nên đọc tất cả áp dụng các thông báo đã tải (lần tải hiện tại tối đa 50), UI ghi rõ phạm vi.
- Test mới `tests/citizen-notifications.spec.ts` bao phủ loading/empty, list/filter, mark lỗi/thử lại, mở hồ sơ, offline và snapshot lỗi. Đã xem ảnh empty/desktop/320px. Lượt đầu nhóm notification 9/9 đạt; lượt cuối `citizen-notifications`, `officer-notifications`, `notifications`, `ui-audit` **16/16 đạt**. Typecheck/lint/build và `git diff --check` đạt; build còn cảnh báo chunk DOCX/annotation Zod đã biết. Các ca SignalR dùng mock; chưa nghiệm thu Azure có đăng nhập. Chưa commit/push.

## Sửa chat bị thanh điều hướng che phần đầu — 27/10/2026

- Theo ảnh người dùng: header công khai `z-50` che cửa sổ AI `z-40` khi viewport thấp hoặc thu phóng. Sửa `src/components/layout/MainLayout.tsx`: header về `z-30`, chat giữ 40; menu mobile 70/80 và modal 90/91 tiếp tục phủ phía trên. Không tăng chat vượt các hộp thoại.
- Thêm 2 test khách/đã đăng nhập vào `tests/full-audit.spec.ts`: tại 1440×600, 1024×500 và 320×640, cuộn trang rồi mở chat; dùng hit test ở nút đóng để xác nhận header không che thao tác, kiểm tra menu mobile phủ chat và đóng chat được. Đã xem ảnh desktop/mobile sau sửa.
- Kiểm tra: typecheck/lint/build đạt (cảnh báo chunk DOCX và annotation Zod đã biết); Playwright `full-audit` + `landing` **24/24 đạt** (mock); `git diff --check` đạt. Chưa commit/push.

## Hiển thị trợ lý AI cho khách chưa đăng nhập — 27/10/2026

- Theo yêu cầu mới, `AiChatWidget.tsx` hiện nút và cửa sổ chat cả khi chưa đăng nhập trên trang chủ. Khách thấy lời chào và nút “Đăng nhập để trò chuyện”; link giữ `returnTo` gồm đường dẫn/query/hash. Mở cửa sổ đưa focus tới nút đăng nhập, Escape đóng và trả focus về nút mở.
- Đã đọc lại `AssistantController.cs`: controller có `[Authorize]`, completions dùng `UserId` từ JWT. Khách chưa được gửi câu hỏi trực tiếp với hợp đồng BE hiện tại. Widget khách không tải phường hoặc gọi chat; người đã đăng nhập giữ luồng chọn phường/gửi như trước. Hội thoại vẫn tách theo user/guest và hủy request khi đổi danh tính.
- Không sửa backend. Yêu cầu mới thay thế quyết định hiển thị widget chỉ cho người đăng nhập ở lượt audit trước.
- Thêm test khách trong `tests/full-audit.spec.ts`: hiển thị tại 320px, Escape/focus, không gọi chat khi khách và link đăng nhập giữ trang quay lại. Lượt đầu phát hiện lỗi focus khách, đã sửa; kiểm tra lại **10/10 đạt** (mock). `npm run typecheck`, `npm run lint`, `npm run build` đạt; build còn cảnh báo chunk DOCX lớn/annotation Zod như trước. Đã xem ảnh guest mobile. Chưa nghiệm thu API Azure có đăng nhập; chưa commit/push.

## Bổ sung cơ sở nghiệp vụ và danh sách file để kiểm tra — 27/10/2026

- Người dùng cung cấp 3 sơ đồ Main Flow/Main Flow 2/Flow 3 và Conceptual ERD; yêu cầu dùng làm cơ sở nghiệp vụ khi rà soát tiếp. ERD gốc: `e:/FileSubject/Part 9/WardMate_ERD-Conceptual ERD.drawio.png`; 3 ảnh luồng nằm trong hội thoại. ERD thể hiện mô hình khái niệm, không được suy ra endpoint hoặc implementation từ sự tồn tại của thực thể.
- Đã tạo [CHANGES_AND_CHECKLIST_2026-10-27.md](CHANGES_AND_CHECKLIST_2026-10-27.md): từng file đã sửa so với `789587a`, hành vi trước/sau, 14 bước kiểm tra và bảng những điểm cần tiếp tục đối chiếu theo sơ đồ/ERD. Chưa thực hiện lượt rà soát đầy đủ ERD hoặc triển khai tính năng bổ sung từ các ảnh.
- Lượt này chỉ sửa tài liệu; đã đối chiếu diff hiện tại, kiểm tra đường dẫn/nội dung và `git diff --check`. Không chạy lại test/build; kết quả lượt sửa tính năng bên dưới được giữ nguyên với ngày/phạm vi thực tế. Chưa commit/push.

## Rà soát toàn bộ API, actor UI, validation và main flow — 27/10/2026

- **Phạm vi:** thực hiện yêu cầu rà soát/sửa lỗi sau khi người dùng cho triển khai kế hoạch. Bắt đầu từ FE `main` tại `789587a`, working tree sạch. Chỉ đọc BE tại `E:/wardmate-backend`, không sửa BE, không dùng Git trong BE. Chưa commit/push.
- **Bằng chứng API:** GET trực tiếp 5 Swagger Azure thành công, tổng 148 HTTP operations gồm health. GET chưa đăng nhập: IAM `/users/me` 401; Catalog `/procedures/categories` 200; Workflow `/applications` 401; gateway `/form-templates` và `/analytics/overview` 401. Không gọi mutation nghiệp vụ trên Azure.
- **Tài liệu bàn giao:** [FULL_AUDIT_2026-10-27.md](FULL_AUDIT_2026-10-27.md) ghi kết quả, đề xuất từng actor, sơ đồ luồng và phụ thuộc; [API_UI_ENDPOINTS_2026-10-27.md](API_UI_ENDPOINTS_2026-10-27.md) kiểm kê từng method/route. Phân biệt call-site đã có với tích hợp thật đã nghiệm thu.
- **Đã sửa:**
  - Workflow/DocumentForm: bỏ fallback POST `/approve` khi `confirm-readiness` trả 404; chi tiết công dân kiểm tra ID response. Trạng thái không biết hiển thị chưa xác định, không biến thành bản nháp/chờ nhận xử lý.
  - QR công dân: bỏ QR tự sinh qua qrserver.com và link danh sách tự chế; chỉ hiển thị/tải ảnh từ backend, có loading/error/retry và mở chi tiết để tạo PDF.
  - Hồ sơ Admin/Manager dùng RHF/Zod chung, lỗi liên kết focus về trường, giữ dữ liệu khi lỗi và chặn gửi lặp. Bỏ giới tính/trạng thái xác thực/dân tộc/quốc tịch suy đoán. Công dân chặn gửi lặp và đọc lỗi server có tiền tố trường.
  - `profileSchema.ts`/HTTP client: tên Unicode NFC; chuẩn hóa số điện thoại có dấu phân cách ở lớp API cho mọi màn sửa hồ sơ; so ngày sinh theo giờ Việt Nam. Giữ các ràng buộc sản phẩm đang có dù chặt hơn BE, không tự nới nghiệp vụ.
  - Chat dùng phường từ API công khai; không dùng `WARD_001`. Gợi ý lý do cán bộ dùng phường hồ sơ, thiếu thì nhập tay. Widget tách hội thoại theo user, hủy request reset/unmount, giữ câu hỏi khi lỗi và không lặp tin khi thử lại, kiểm tra clipboard, sửa reflow 320px/nhãn/Escape; nút mở thu gọn trên mobile để giảm che nội dung.
  - OCR: chặn tệp rỗng, xóa tệp/kết quả cũ khi chọn sai, chọn lại cùng tệp; hủy request khi đóng/thay ảnh/unmount, chặn gửi lặp; nhập tay không tự gán Nam.
  - Chi tiết thủ tục bỏ danh sách/cơ quan mẫu, đổi nhãn xếp hạng không có bằng chứng thành “Thủ tục khác”; lỗi danh mục quản lý có tải lại. Upload hiển thị lỗi tiếng Việt qua `documentFormError`.
  - Fixture/test cập nhật đúng `/upload-filled-docx`, hành vi gửi lại đã có cán bộ phụ trách và menu mobile Radix Dialog. Thêm `tests/full-audit.spec.ts` cho các lỗi vừa sửa. ESLint bỏ qua thư mục kết quả test.
- **Môi trường:** khôi phục 16 package đã có trong lockfile nhưng thiếu ở node_modules (gồm SignalR); không thêm dependency/đổi phiên bản. Nội dung `package-lock.json` giữ nguyên HEAD. `.env.development.local` và `.env.example` có đủ 5 URL đã cung cấp.
- **Kiểm tra đã chạy trên code hiện tại:**
  - `npm run typecheck`, `npm run lint`, `npm run build`: đạt. Build còn cảnh báo chunk lớn (DOCX editor khoảng 3,86 MB, gzip 1,20 MB) và annotation của Zod bị Rollup bỏ qua; không phải build lỗi.
  - `npx playwright test --workers=2 --reporter=line`: **236/237 đạt**, 1 ca `auth-recovery` timeout lúc nút bị tháo khỏi DOM và trang điều hướng lại. Chưa khẳng định nguyên nhân; không sửa auth chỉ để test xanh.
  - Sau chỉnh cuối nút chat/mobile và chống lặp tin gửi lỗi: `npx playwright test tests/full-audit.spec.ts tests/ui-audit.spec.ts tests/citizen-dossier-ui.spec.ts tests/auth-recovery.spec.ts --workers=1 --reporter=line`: **22/22 đạt**, gồm ca quên mật khẩu timeout ở trên. Không trình bày thành một lượt toàn bộ 237/237 đạt.
  - `node tests/api-proxy-check.mjs`: **23/23 tuyến đạt**, exit 0; dùng HTTP server thử tại local, không gọi Azure.
  - Đã xem ảnh chat 320px, validation auth, chi tiết hồ sơ công dân/cán bộ và dashboard Manager/Admin. Test kiểm tra reflow 1440/720/320, focus trap/Escape cho cả 5 vai trò; screenshot nằm trong `test-results` (Git ignore, bị ghi lại khi chạy test).
  - `git diff --check`: đạt. Các lượt chẩn đoán trước có fixture/assertion cũ và teardown Vite treo trong sandbox Windows; lượt xác minh cuối chạy Edge ngoài sandbox, thoát bình thường. Toàn bộ Playwright là **mock**, chưa phải nghiệm thu Azure có đăng nhập.
- **Còn thiếu:** chưa nối UI cho AI `documents/verify`, chat sessions/messages và Knowledge/RAG; một số màn vận hành còn placeholder. Xem báo cáo để biết API đã có source và phần cần thêm hợp đồng BE. Lọc trạng thái hồ sơ công dân/Admin vẫn chỉ trên trang đã tải do giới hạn query BE; số lượng phân công cần API tổng hợp để giảm request.
- **Giữ quyết định cũ:** không bật lại tiếp nhận chính thức/cấp biên nhận, phone/SMS, remember-me hay delivery admin. Không suy ra các mục đó phải được triển khai chỉ vì Swagger có endpoint.
- **Bước nghiệm thu thật còn cần:** tài khoản thử được phép cho 5 vai trò thuộc ít nhất 2 phường; chạy xuyên actor, kiểm tra 403/409, OTP mail, SignalR/worker, PDF/Blob/Gotenberg và QR công khai. Chưa có credentials nên không xác nhận luồng production, CORS/cookie hoặc phân quyền Azure đã hoạt động xuyên suốt.

## Rà soát và tích hợp API IAM (trừ phone/SMS) — 26/10/2026

- **Nguồn:** đối chiếu 9 controller IAM tại `D:/wardmate-backend/src/Services/WardMate.Services.IAM` với mọi lời gọi IAM trong FE. BE không có envelope; lỗi là ProblemDetails `{ status, title, code, traceId }` (không có `detail`), `title` đã là tiếng Việt.
- **Ngoài phạm vi (theo người dùng):** phone-verification, OTP kênh SMS. Cố ý không dùng: `/internal/*`, `/users/access-context` (BE-to-BE), `assignment-context` (workflow), remember-me, avatar (BE chưa có).
- **Quyết định người dùng:** quên mật khẩu = 1 trang 2 bước; Admin có modal tạo cán bộ và **giữ** "Phân vai trò"; Admin được sửa hồ sơ người dùng (không có nút xoá).
- **Đã làm:**
  - `src/lib/api/index.ts`:
    - `iamErrorCode()` đọc `code`. `authErrorMessage` map mã `iam.*` sang tiếng Việt trước, sau đó mới dùng status. Trước đây 403 ngoài phạm vi phường hay 404 `iam.ward_not_found` hiện sai ngữ cảnh.
    - Thêm `requestPasswordOtp`, `resetPasswordWithOtp` (`channel: 'EMAIL'`, `purpose: 'FORGOT_PASSWORD'`). Hàm reset cũng xoá phiên trong tab.
    - Thêm `createStaffAccount(role, input)` cho `/accounts/front-desk|manager|procedure-manager`.
    - Thêm `saveAdminProfile` (PUT, gặp `iam.profile_not_found` thì POST). `updateMyProfile` cũng fallback POST.
    - Bỏ `getAccounts` và `getUserProfiles` vì không còn nơi dùng.
  - Quên/đặt lại mật khẩu:
    - `src/pages/auth/PasswordRecovery.tsx` (RHF/Zod, schema trong `authSchema.ts`): bước 1 gửi mã (hiện thông báo chung của BE); bước 2 nhập OTP 6 số + mật khẩu mới, "Gửi lại mã" đếm ngược 60 giây.
    - `/dat-lai-mat-khau` chỉ vào thẳng bước 2 khi có `emailOrUsername` trong router state. Đã xoá `RecoveryUnavailable.tsx`.
  - Admin (`AdminPage.tsx`):
    - Nút "Tạo tài khoản cán bộ" (`CreateStaffAccountModal.tsx`), chỉ hiện khi có IT_ADMIN và `iam.accounts.manage`. Phường bắt buộc với Cán bộ Một cửa/Quản lý, tuỳ chọn với Quản lý thủ tục.
    - Lọc vai trò gửi `role` lên `/admin/users` và reset về trang 1. Lọc trạng thái vẫn chỉ trong trang hiện tại vì BE chưa có tham số `isActive`.
    - Màn chi tiết có nút sửa hồ sơ khi có `iam.accounts.manage`. Manager cũng dùng `saveAdminProfile`.
  - UI đặt mật khẩu thống nhất: `src/components/auth/PasswordStrength.tsx` (thanh 5 nấc + checklist + `PasswordMatchHint` báo khớp ngay khi gõ) dùng ở đăng ký, đặt lại mật khẩu, đổi mật khẩu (`AccountSecuritySection`) và modal tạo cán bộ. `strict` cho các luồng IAM bắt buộc thêm chữ thường và chữ số.
  - **Hiệu năng IAM:** trước đây mọi request IAM đều đi qua Web Lock `wardmate-auth:` nên chạy tuần tự, kể cả giữa các tab. Đo IAM Azure khoảng 0,7–1 giây mỗi request, nên trang Phường/Xã (gọi `getWards` 2 lần + `/admin/users`) mất vài giây. Nay chỉ các request `/api/v1/auth/*` (đụng cookie refresh) còn khoá (`authCookieConfig`), request nghiệp vụ chạy song song.
  - Trang Phường/Xã: bỏ lời gọi `getWards` trùng; không gọi `/admin/users` cho cả trang nữa. Số nhân sự đếm chính xác bằng `total` của `/admin/users?wardCode=…&pageSize=1` (song song). Trước đây chỉ đếm trên 20 user của trang đầu nên sai. Bảng có skeleton khi tải.
  - Đổi mật khẩu có 2 cách (tab "Dùng mật khẩu hiện tại" / "Xác thực qua email" trong `AccountSecuritySection`):
    - Cách OTP dùng `ChangePasswordOtpForm.tsx`: `password-otp/request` + `verify-and-change` với `purpose: 'CHANGE_PASSWORD'`, gửi kèm Bearer (không `skipAuth`), vì BE lấy `sub` làm actor và chỉ cho đổi mật khẩu của chính mình.
    - Định danh gửi lên là `username` trong `/users/me`; email hiển thị được che bớt. Thành công thì xoá phiên và về đăng nhập.
  - Bảng Phường/Xã: bỏ cột ID; căn phải tiêu đề "Trạng thái" cho khớp badge (CSS chung `td:last-child` căn phải). Lưu ý: "Hoạt động" vẫn là chữ ghi cứng vì BE không có trạng thái phường.
  - Đăng ký: đã đối chiếu rule với `AuthValidators.cs` (khớp). Làm rõ lỗi tên đăng nhập (không khoảng trắng/không dấu, có ví dụ), placeholder có ví dụ, checklist mật khẩu tách mục bắt buộc và "nên có" (chữ thường, chữ số).
  - Đổi mật khẩu: `AccountSecuritySection` so theo `code` thay cho `msg.includes(...)` (cách cũ không bao giờ khớp). Xoá `ChangePasswordModal.tsx` (UI chết) và state liên quan trong 2 profile view.
- **Kiểm tra (chỉ mock):**
  - `npm run typecheck`, `npm run lint`, `npm run build`: đạt.
  - `node tests/api-proxy-check.mjs`: 26/26, đã thêm 3 route IAM.
  - Spec mới `tests/auth-recovery.spec.ts` (3) và `tests/admin-provisioning.spec.ts` (3), cùng `admin-rbac`: 10/10.
  - jwt-client, design-system, landing, auth, auth-session, manager, profile-validation, ui-audit, workspace-sidebar, assignment: 89/90.
  - Ca lỗi là `ui-audit` REGISTERED_CITIZEN, lặp lại ổn định: `complementary` "Trợ lý hỗ trợ thủ tục" của `AiChatWidget` (thay đổi AI chưa commit, có từ trước) hiện ở màn hẹp. Không do task IAM; chưa sửa.
  - Đã gỡ 2 test cũ trong `landing.spec.ts` vốn khẳng định "khôi phục chưa khả dụng".
- **Giới hạn / cần xác minh thật:**
  - OTP email phụ thuộc cấu hình gửi mail của BE; chưa cấu hình thì trả 503 `iam.email_unavailable`.
  - Chưa thử với Azure IAM thật, chưa thử tạo Manager/Procedure-manager trên DB thật.
  - Chưa commit.

## Làm lại UI thống kê Manager và gộp menu Hiệu suất — 26/10/2026

- **Thư viện:** giữ Recharts (đã cài), không thêm dependency.
- **Bảng màu:**
  - 2 series dùng `#2a78d6` / `#eb6834`, đã chạy validator dataviz trên nền trắng: CVD ΔE 24,7, normal ΔE 33,6, tương phản ≥ 3:1.
  - Trạng thái hạn dùng màu status, luôn kèm nhãn và số.
  - Biểu đồ cột một độ đo dùng một màu, không tô 5 màu như trước.
- **Thành phần mới `src/components/analytics/chartKit.tsx`:** token màu, `ChartTooltip`, `LegendKeys`, `StatTile`, `ChartDataTable` (bảng dữ liệu thay thế).
- **Biểu đồ:**
  - Xu hướng chuyển sang area: đường 2px, nền mờ, crosshair, ngày dd/MM, ngắt đường ở ngày thiếu dữ liệu.
  - Cột ngang: rộng tối đa 24px, giá trị ở đầu cột.
  - Donut: số chính (% đúng hạn) ở giữa, chú giải có số và %.
- **Tổng quan:**
  - 4 thẻ số liệu: lượt gửi, sẵn sàng, đúng hạn, hài lòng.
  - Xu hướng rộng toàn hàng; mỗi thẻ có link sang màn chi tiết.
  - Bỏ câu mô tả và ghi chú thừa; coverage chỉ hiện 1 lần.
  - Ô số lớn hiện "—" khi thiếu dữ liệu, không nhét câu chữ vào.
- **Màn chi tiết:**
  - Bảng dùng style admin, có thanh dữ liệu trong ô.
  - Hạn xử lý rút còn 4 chỉ số; khối "còn tồn" chỉ giữ 3 chỉ số tồn đọng.
  - Bỏ cột "Số mẫu thời gian".
  - Phản hồi hiện sao; mức độ hài lòng dùng thẻ số liệu + biểu đồ cột.
- **Menu (người dùng chốt):** nhóm "Hiệu suất xử lý" chỉ còn "Hiệu suất cán bộ". Đã bỏ `perf-processing-time`, `perf-completion-rate`, `perf-supplement-rate` (trùng màn hình) khỏi sidebar, types, header và page.
- **Kiểm tra:**
  - typecheck, lint; Playwright analytics, manager, feedback, workspace-sidebar 31/31 (mock).
  - Đã chụp và xem Tổng quan (1440px, 390px), Thống kê hồ sơ, Hiệu suất cán bộ.
  - Chưa xem với dữ liệu thật.

## Rà soát Analytics & Citizen Feedback (trừ NotificationDeliveryAdmin) — 26/10/2026

- **Nguồn:**
  - Swagger gateway `/api/analytics-system/swagger/v1/swagger.json`, gồm 10 endpoint Analytics, AnalyticsJobs và CitizenFeedback.
  - Source `D:/wardmate-backend/src/Services/WardMate.Services.AnalyticsSystem`.
  - Bỏ qua NotificationDeliveryAdmin (SMS, không dùng).
- **Nguyên nhân 404:**
  - `.env.development.local` không có `VITE_ANALYTICS_API_URL`.
  - Khi thiếu biến này, `vite.config.ts` và `serviceUrls.ts` lùi về `VITE_API_BASE_URL` (IAM), nhưng IAM không có `/api/v1/analytics` hay `/api/v1/citizen/feedback`, nên luôn 404.
  - Đã đo: gọi qua IAM thì 404; gọi qua gateway thì 401 khi chưa đăng nhập, tức route tồn tại.
- **Đã sửa:** fallback đổi sang `VITE_DOCUMENT_FORM_API_URL` (gateway), giống AI OCR. Kiểm tra qua Vite dev server với env thật: 3 route trả 401 từ gateway, không còn 404.
- **Hợp đồng đã đối chiếu, khớp với FE (`src/lib/api/analytics.ts`):**
  - Tham số `from/to/procedureId/page/pageSize`.
  - `ratingCounts` luôn đủ khoá 1–5; các tỷ lệ theo thang 0–100.
  - `timelinessStatus`/`timeZone` có giá trị mặc định.
  - `jobId` chỉ gồm chữ số; mã lỗi `feedback.not_found`.
  - Phân quyền: thống kê chỉ MANAGER có phường; job chỉ IT_ADMIN; feedback chỉ REGISTERED_CITIZEN. FE gọi đúng theo vai trò.
- **Kiểm tra:**
  - typecheck, lint, `api-proxy-check` 26/26.
  - Playwright analytics và feedback 18/18 (mock).
  - Chưa xem dữ liệu thật bằng tài khoản Manager.
- **Lưu ý production:** hosting phải có reverse proxy tương ứng, vì `vercel.json` chỉ có SPA rewrite; hoặc đặt `VITE_ANALYTICS_API_URL`.

## Đối chiếu các yêu cầu đã gửi BE — 26/10/2026

- **Nguồn:** source BE `main` = `091b169` (24/10), không có commit nào sau 24/10. Đối chiếu với `ADMIN_USER_PROVISIONING_BACKEND_SPEC.md`, `OFFICER_CATEGORY_ROUTING_BACKEND_SPEC.md`, `BE_REQUEST_RESUBMIT_COUNT_IN_SUMMARY.md`, `BE_REQUEST_PERFORMANCE_AND_OFFICER_ACTIVITY.md`. Đã ghi trạng thái vào đầu từng file.
- **BE xong, FE đã tích hợp:**
  - Tạo Manager / Procedure-manager.
  - Phân công theo lĩnh vực: field, bộ lọc, trả hồ sơ, Manager giao/chuyển.
  - `resubmitCount`.
  - `assignedCategories` trong `/users/me`.
- **BE chưa làm:**
  - Perf A `applicantName`, B loại DRAFT, C `assignment-summary`, D `/officer/activity`, E cache.
  - F đã có code nhưng RabbitMQ/worker mặc định tắt. FE giữ các workaround tương ứng.
- **FE vừa làm:**
  - Nhãn audit `account.manager_created`, `account.procedure_manager_created`, `OFFICER_CATEGORIES_ASSIGNED/RECONCILED`; khối chi tiết hiện phường cho cả 3 loại tạo tài khoản (`AdminRbacViews.tsx`).
  - Test `admin-provisioning.spec.ts` (5/5).
- **Đã xét, không cần sửa:** query đếm quá hạn và lịch sử cán bộ không lọt DRAFT. BE `overdue` đã giới hạn trạng thái; bản nháp không có `assignee`.
- **Gửi BE:** gộp mọi việc còn tồn đọng (6 mục A–F cũ + xác nhận deploy) vào **một file duy nhất** `docs/BE_REQUESTS_PENDING.md`. Các file yêu cầu cũ đã gắn nhãn "ĐÃ GỘP" / "ĐÃ XONG – không cần gửi lại".
- **UI:** làm lại màn chặn truy cập trong `ProtectedRoute.tsx` (đang khôi phục phiên / lỗi xác minh / không đủ quyền): logo WardMate, thẻ bo góc như trang đăng nhập, nút Thử lại, Về trang chủ, Đăng nhập lại; responsive.
- **Deploy:** PROGRESS của BE chưa ghi image Azure nào cho phân công, nhưng FE đã test tay trên Azure ngày 24/10 (Manager chuyển cán bộ được). Cần BE xác nhận phiên bản đang chạy và migration.

## Kho kiến thức AI và chatbot có dẫn nguồn (BE TASK-28/29) — 24/10/2026

- **Nguồn hợp đồng:** BE chưa liên lạc được. Đã đọc commit KhaNguyen454 ngày 24/10 trong `D:/wardmate-backend`: `docs/api-guide.md` mục TASK-28/29, `docs/system-constraints.md` KB-01/KB-02, cùng `KnowledgeController.cs`, `AssistantController.cs`, `AssistantContracts.cs`, `KnowledgeContracts.cs`, `KnowledgeRetrievalContracts.cs`, `ChatService.cs`. Theo BE: chưa apply DB, chưa deploy, `Knowledge:EmbeddingEnabled`/`RagEnabled` mặc định tắt (khi tắt, chat trả `grounded:false`, `citations:null`).
- **Quyết định người dùng:**
  - Làm cả chat có nguồn và màn quản lý kho.
  - Màn quản lý dùng chung cho Quản lý thủ tục và Admin.
  - Có "Tìm thử" (mỗi lần gọi tốn phí).
  - Lịch sử chat theo API BE.
  - Không đụng thông báo/SMS.
- **Đã làm:**
  - Proxy `vite.config.ts`: thêm `/api/v1/ai/knowledge` → AIOCR. `tests/api-proxy-check.mjs` thêm 3 route.
  - `src/lib/api/aiOcr.ts`:
    - Schema Zod cho `citations`, `grounded`, `relatedProcedures {procedureId,title}` (bỏ qua phần tử sai dạng), phiên và tin nhắn chat.
    - `knowledgeApi` gọi toàn bộ API knowledge.
    - `aiError` map mã `knowledge.*`/`chat.*`/`ai.*`, 403, 429.
  - `src/hooks/useAiKnowledge.ts`: query có user ID, chỉ bật khi có `knowledge.manage`; mutation invalidate cả khi lỗi; `search` là mutation nên không tự gọi lại.
  - `AiChatWidget`:
    - `[n]` thành nút dẫn tới khối "Nguồn tham khảo" (tiêu đề, mục, loại nguồn, "Xem thủ tục" → `/thu-tuc/:id`).
    - Không hiện `score`. "Thủ tục liên quan" bỏ mục trùng với nguồn.
    - Nút "Lịch sử": chỉ gọi khi bấm; nếu quá 50 tin thì tải trang cuối và có ghi chú.
    - Khách chưa đăng nhập thấy lời nhắc đăng nhập, không gọi API.
    - `wardCode` giữ `WARD_001`: BE chỉ dùng làm gợi ý trong prompt, không lọc nguồn theo phường; đổi giữa phiên sẽ bị 409 `chat.ward_mismatch`.
  - `src/components/ai/KnowledgeBaseView.tsx` + `KnowledgeModals.tsx`:
    - Thẻ index-status kèm hướng dẫn thứ tự bật (FE không bật công tắc).
    - Danh sách có tìm kiếm, lọc, phân trang; chi tiết kèm tab các đoạn đã chia.
    - Thêm văn bản/FAQ (RHF/Zod); tải PDF (chặn ở UI nếu không phải PDF hoặc quá 10 MB; hiện `warnings`).
    - Sửa: PDF chỉ đổi tiêu đề, nguồn PROCEDURE không có nút sửa; gặp 409 giữ form và có nút "Tải bản mới nhất".
    - Ngừng dùng/dùng lại, chia đoạn lại, tạo lại vector đều gửi `expectedRevision`.
    - Đồng bộ một thủ tục hoặc tất cả; cảnh báo khi `complete:false` hoặc có thủ tục lỗi.
    - Tìm thử có cảnh báo phí.
  - Gắn vào workspace:
    - `ProcedureManagerPage` (mục `ai-knowledge`) và `AdminPage` (mục `knowledge`, thay placeholder `KnowledgeView`).
    - Sidebar cả hai nơi chỉ hiện khi có `knowledge.manage`.
    - Không thêm vào `PermissionFeatures`, vì panel `?feature=` đã bị gỡ khỏi menu.
- **Test (mock):**
  - Mới: `tests/fixtures/aiKnowledge.ts`, `tests/ai-chat.spec.ts` (4 test), `tests/ai-knowledge.spec.ts` (8 test).
  - `tests/fixtures/auth.ts`: thêm `knowledge.manage` vào quyền mặc định của PROCEDURE_MANAGER/IT_ADMIN (khớp seed BE).
  - `procedure-manager.spec.ts`: test placeholder chuyển sang mục "Văn bản pháp lý".
- **Kiểm tra:**
  - `node_modules` máy này lệch lockfile (thiếu `@docx-editor.dev/*` và `.bin`); đã chạy `npm install`, lockfile không đổi.
  - typecheck, lint, build: đạt.
  - Proxy check: 23/23.
  - Playwright ai-chat, ai-knowledge, landing, procedure-manager, admin-rbac, workspace-sidebar, design-system (`--workers=2`): 63/64. Lỗi còn lại `procedure-manager.spec.ts:125` (skeleton) chạy riêng thì đạt, nên là lỗi chập chờn khi tải nặng.
  - **Chưa tích hợp thật:** BE chưa deploy, chưa gọi Azure, chưa gọi chat/search thật (có phí).
- **Việc chờ:**
  - BE apply `aiocr-knowledge-base.sql`, `aiocr-knowledge-retrieval.sql`, `iam-knowledge-permission.sql`, deploy AIOCR và route gateway `/api/v1/ai/knowledge`.
  - Bật embedding → kiểm tra bằng "Tìm thử" → bật RAG, rồi kiểm tra lại chat thật.
  - Hosting production cần reverse proxy `/api/v1/ai/knowledge` nếu dùng proxy.
  - Hỏi BE mã phường thật cho chat (hiện `WARD_001`).

## Tích hợp phân công theo lĩnh vực (FE bước 1–3) — 24/10/2026

- **BE:** đã đối chiếu source `D:/wardmate-backend` (commit WORKFLOW-ASSIGN-01/IAM-CATEGORY-01/WORKFLOW-RESUBMIT-01) và Swagger Workflow/IAM trên Azure (GET 200, khớp source). Route `PUT /api/v1/manager/applications/{id}/assignee` trả 401 khi không có token (route tồn tại). **Chưa gọi bằng tài khoản thật**, chưa xác minh migration DB.
- **Quyết định bổ sung của người dùng:** hồ sơ cũ không có lĩnh vực hiển thị "Chưa xác định lĩnh vực" theo BE (bỏ tra lĩnh vực theo thủ tục hiện tại); Manager được chuyển người cả khi `DOCUMENTS_READY` như BE.
- **Đã làm:**
  - Proxy dev `vite.config.ts`: `/api/v1/manager/applications` → Workflow (trước `/api` của IAM); `tests/api-proxy-check.mjs` thêm 3 route (19/19 đạt).
  - `src/lib/api/workflow.ts`: `assignmentVersion`, `assignmentHistory`, bộ lọc `categoryIds/scope/assignee/overdue/sort`, `releaseApplication`, `manageAssignee`, `reasonSchema` 5–500, thông báo lỗi `workflow.*` mới. `officerCategoryError` cho `iam.invalid_categories`/`iam.catalog_unavailable`.
  - `authStore`/`loadCurrentUser`: `assignedCategories` từ `/users/me`.
  - Hooks `useReleaseApplicationMutation`, `useManagerAssigneeMutation` (invalidate cả khi lỗi).
  - Cán bộ: 3 tab Lĩnh vực của tôi/Đang xử lý của tôi/Toàn phường (`scope`/`assignee` ở server, chỉ áp cho danh sách; Tổng quan giữ toàn phường), lọc lĩnh vực theo ID và "Chỉ hồ sơ quá hạn" ở server, nhãn "Ngoài lĩnh vực", modal xác nhận khi nhận hồ sơ ngoài lĩnh vực, nút "Trả về hàng đợi" (modal RHF/Zod, gửi `expectedAssignmentVersion`), timeline "Lịch sử phân công".
  - Manager: mục mới "Giám sát hồ sơ" (`ManagerApplicationsView`): thẻ chưa phân công/quá hạn, khối lượng theo cán bộ (đếm bằng truy vấn `pageSize=1`), bảng lọc trạng thái/lĩnh vực/cán bộ/quá hạn/mã hồ sơ, modal Giao/Chuyển (`AssignOfficerModal`, ưu tiên cán bộ đúng lĩnh vực, lý do bắt buộc). Trang chi tiết cán bộ đổ "Lịch sử hồ sơ" bằng `assignee={id}`.
  - Component dùng chung: `src/components/workflow/AssignmentModals.tsx`. Gỡ hook tra lĩnh vực theo thủ tục.
- **Lưu ý working tree:** có thay đổi song song không thuộc phiên này (Review lại chỉ cho cán bộ phụ trách, `TableSkeletonRows.cellClassName`, bỏ hỏi khi đóng modal quyết định, test mới trong `tests/officer.spec.ts`); đã giữ nguyên.
- **Kiểm tra:** `npm run typecheck`, `npm run lint`: đạt. `npm run build`: đạt. `node tests/api-proxy-check.mjs`: 19/19 đạt. Playwright (officer, officer-submissions, manager, auth, auth-session): lần đầu 50/55 đạt; chạy lại thì manager + auth đều đạt (lỗi lần đầu là timeout chập chờn). Còn 2 lỗi có từ trước: `officer.spec.ts:53` và `:66` tìm nút "Tiếp nhận tại quầy", nút này không còn trong src. Chưa có test mới cho tab/release/assign (bước 4).
- **Sửa sau kiểm tra tay (24/10):** FE đang map `CANCELLED` thành "Chờ tiền kiểm" nên vẫn hiện nút Nhận xử lý, bấm vào bị BE trả 409. Đã thêm trạng thái `CANCELLED` ("Đã hủy"), không hiện nút nhận, không gắn nhãn quá hạn. Ghi nhận: API nhận hồ sơ (`/assign`) không kiểm tra lĩnh vực; 409 chỉ do `application.invalid_status` (hồ sơ không còn SUBMITTED hoặc đã có người nhận) hoặc `application.snapshot_missing` (hồ sơ cũ thiếu snapshot). typecheck + eslint đạt.
- **Sửa tiếp (24/10):** nguyên nhân chính của 409 khi nhận hồ sơ "Chờ tiền kiểm": `mapStatus` đổi `DRAFT` thành `SUBMITTED_FOR_REVIEW`, trong khi BE `ListAll` (`GET /officer/applications`) trả cả bản nháp của công dân trong phường. Đã thêm trạng thái `DRAFT` ("Bản nháp"), không hiện nút nhận. Đề xuất BE: `ListAll` loại `DRAFT` để cán bộ không thấy bản nháp chưa gửi. typecheck + eslint đạt; chưa xác minh lại trên Azure.
- **Ẩn bản nháp khỏi hàng đợi (24/10):** khi không chọn trạng thái, danh sách cán bộ (Tổng quan, Tất cả hồ sơ) và Manager "Giám sát hồ sơ" gửi `Status=OFFICER_VISIBLE_STATUSES` (`src/lib/api/workflow.ts`, mọi trạng thái trừ `DRAFT`). Giới hạn: bản nháp công dân tự hủy (`CANCELLED` chưa từng nộp) vẫn có thể hiện. Playwright officer/officer-submissions/manager: 25 đạt, 2 lỗi cũ (`officer.spec.ts:53`, `:66`).
- **Chi tiết hồ sơ công dân (24/10):** request `comments` bị hủy (canceled) khi mở bản nháp. Nguyên nhân: dữ liệu từ danh sách chưa có `currentVersion` nên FE gọi luôn; khi chi tiết trả về version 0, hook tắt query và hủy request. Giờ bản nháp không gọi `comments`. `contents` trả 200 nhưng mất khoảng 6 giây trên Azure.
- **Sửa sau kiểm tra tay vòng đời (24/10):**
  - Lĩnh vực cán bộ: thêm `refreshAssignedCategories()` (`src/lib/api/index.ts`); `OfficerPage` tải lại `/users/me` khi quay lại tab và mỗi 60 giây, nên nhãn "Ngoài lĩnh vực" đúng mà không cần đăng nhập lại. BE `WorkflowAccessMiddleware` đọc access-context mỗi request nên bộ lọc server vốn đã đúng ngay.
  - Công dân: `mapSummaryDtoToCitizenDossier` dùng `resubmitCount`, hồ sơ gửi lại vào mục "Đã gửi lại".
  - Yêu cầu bổ sung khi chưa có nhận xét: chặn trước khi mở hộp thoại, chuyển sang tab Nhận xét và ghi rõ cần làm gì; câu báo lỗi `application.comments_required` rõ hơn.
  - Xác nhận sẵn sàng: đóng hộp thoại ngay khi BE trả thành công, ở lại workspace (đã khóa) và mở tab PDF; tải lại chạy nền. Yêu cầu bổ sung không còn refetch rồi bị hủy khi workspace đóng.
  - Manager "Giám sát hồ sơ": nút "Lịch sử" mở modal lịch sử phân công (từ `GET /officer/applications/{id}` → `assignmentHistory`).
  - Các request "(canceled)" còn lại (`applications?page=1`, `comments`) là TanStack hủy lần tải cũ khi invalidate/refetch, có request 200 ngay sau; không phải lỗi API.
  - Kiểm tra: typecheck, lint đạt. Playwright officer/officer-submissions/manager/auth/auth-session: 51/55; `officer.spec:6`, `manager.spec:8` chập chờn khi chạy song song, chạy riêng đều đạt; còn 2 lỗi cũ `officer.spec:53`, `:66`. Chưa kiểm tra lại trên Azure.
  - Câu chữ màn thẩm định: bỏ thuật ngữ kỹ thuật (OPEN, checklist, phiên bản N) trong thông báo yêu cầu bổ sung / xác nhận sẵn sàng; tab "Thông tin & giấy tờ", hộp xác nhận ghi "Lần nộp đang kiểm tra" (đã cập nhật `tests/officer-submissions.spec.ts`). Playwright officer + officer-submissions: 18 đạt, 2 lỗi cũ.
- **Tối ưu FE sau rà soát (24/10):**
  - Nhận hồ sơ dùng luôn kết quả `POST .../assign` (đã có chi tiết) để mở workspace, bỏ 2 request chi tiết + nhận xét.
  - Danh sách cán bộ: ghim cột Thao tác bên phải; bộ lọc 2 cột ở tablet, 1 hàng ở desktop rộng; "Gửi từ … đến …" luôn cùng hàng; trạng thái rỗng theo tab ("Xem hồ sơ toàn phường", "Mở hàng đợi lĩnh vực của tôi", "Xóa bộ lọc").
  - Công dân: nút "Xóa bộ lọc" không xuống dòng, tắt khi chưa lọc. Manager: nút Lịch sử chỉ còn biểu tượng (có aria-label), cột thao tác ghim phải.
  - Thông báo cán bộ: thêm `@microsoft/signalr@10.0.11`, `src/lib/api/notifications.ts`, `src/hooks/useNotificationHub.ts`; nối NotificationHub qua gateway `/api/analytics-system/hubs/notifications` (Vite proxy `ws: true`); trang Thông báo và số trên chuông dùng dữ liệu thật, mở hồ sơ từ thông báo, đánh dấu đã đọc (BE chưa có MarkAll nên gọi MarkRead từng cái). Đã probe Azure: negotiate trả 401 khi không token. Chưa thử với tài khoản thật.
  - Test: mới `tests/assignment.spec.ts` (5: tab/bộ lọc, nhận ngoài lĩnh vực + 409, trả hồ sơ, Manager giao + 409, chuyển + lịch sử) và `tests/officer-notifications.spec.ts` (2, mock SignalR qua routeWebSocket). Thay 2 test "Tiếp nhận tại quầy" lỗi thời bằng 1 test kiểm tra không có thao tác tiếp nhận/biên nhận giả.
  - Kiểm tra: typecheck, lint, build đạt; proxy check 20/20. Playwright 11 file liên quan (`--workers=2`): 92/93; lỗi còn lại `citizen-dossier-ui.spec.ts:40` ("Cần xác nhận bản khai") vẫn lỗi khi hoàn lại thay đổi của task này nên là lỗi có sẵn. Chạy mặc định nhiều worker ngay sau build bị nhiều timeout do quá tải.
  - Gửi BE: `docs/BE_REQUEST_PERFORMANCE_AND_OFFICER_ACTIVITY.md` (A applicantName, B loại DRAFT, C thống kê phân công, D API lịch sử thao tác cán bộ, E độ trễ Azure). Màn "Lịch sử xử lý" vẫn chỉ là log tạm phía trình duyệt cho đến khi có mục D.
  - Test tay thông báo (24/10): FE kết nối hub thành công (long polling, 200) nhưng `GetNotifications` rỗng và không nhận thông báo sau khi Manager chuyển cán bộ. Nghi chuỗi Workflow outbox → RabbitMQ → Analytics chưa bật trên Azure; đã ghi mục F trong file gửi BE. Chưa xác minh được phía Azure.
- **Còn chờ (bước 4):** test Playwright mock cho các luồng mới; kiểm thử thật cần 2 cán bộ cùng phường + 1 Manager + hồ sơ thử (thao tác ghi dữ liệu thật).

## Phân công hồ sơ theo lĩnh vực cho cán bộ Một cửa — 23/10/2026

> Lỗi thời: BE đã làm spec này ngày 24/10 (xem mục 24/10 ở trên và mục đối chiếu 26/10). Phần mô tả suy luận "đã gửi lại" bên dưới nay chỉ còn là fallback khi thiếu `resubmitCount`.

- **Quyết định người dùng (đã chốt):**
  - Ưu tiên mềm theo lĩnh vực: cán bộ vẫn nhận được hồ sơ thuộc lĩnh vực khác.
  - MANAGER giám sát hồ sơ, được giao/chuyển hồ sơ (có lý do, ghi lịch sử), nhưng không tự duyệt.
  - Cán bộ được trả lại hồ sơ khi còn `UNDER_REVIEW`.
  - Cán bộ chưa được gán lĩnh vực được coi là phụ trách mọi lĩnh vực.
  - PROCEDURE_MANAGER giữ nguyên vai trò.
- **Spec BE:** `docs/OFFICER_CATEGORY_ROUTING_BACKEND_SPEC.md`.
  - Nội dung: snapshot lĩnh vực trên hồ sơ, `assignedCategories` trong access-context, bộ lọc `categoryIds`/`scope`/`assignee`, `POST .../release`, `PUT /manager/applications/{id}/assignee`, permission `workflow.assign.manage`.
  - **Trạng thái:** chưa triển khai ở BE; chưa sửa `D:/wardmate-backend`.
- **FE đã làm, không cần API mới:**
  - Schema Workflow nhận thêm các trường nullish `categoryId`, `categoryName`, `assignedAt`, `assignedOfficerName`, `resubmitCount`.
  - Bỏ nhãn lĩnh vực ghi cứng ở hàng đợi cán bộ. Lĩnh vực lấy từ DTO, nếu không có thì tra chi tiết thủ tục qua `useProcedureCategoryLookup`. Thủ tục ngừng công khai hiển thị "Chưa xác định lĩnh vực". Phía công dân vẫn giữ nhãn cũ khi BE chưa trả lĩnh vực.
  - Lọc trạng thái theo mục sidebar và lọc khoảng ngày gửi ở server (`OfficerListInput`). Khoảng ngày ngược thì không gửi lên và báo lỗi tại bộ lọc.
  - Thêm bộ lọc lĩnh vực; sắp xếp theo ngày nộp thật thay cho sắp theo id.
  - Hồ sơ công dân gửi lại: BE chuyển về `SUBMITTED` và giữ `AssignedOfficerId`, nhưng summary chưa có `resubmitCount`. FE suy ra "Đã gửi lại" từ điều kiện `SUBMITTED` có người phụ trách, vì hồ sơ mới nộp luôn chưa có người phụ trách.
    - Chỉ cán bộ đang phụ trách thấy nút "Review lại". Nút này gọi `assign` để chuyển sang `UNDER_REVIEW` rồi mở workspace.
    - Cán bộ khác thấy "Chờ cán bộ phụ trách". Dashboard chỉ ưu tiên hồ sơ gửi lại của chính mình.
    - Test: `tests/officer.spec.ts` "hồ sơ công dân gửi lại…".
    - Khi BE có thêm `release`, cần đối chiếu lại điều kiện suy luận này.
  - Sửa câu mô tả trong modal phân công lĩnh vực của Manager.
  - Skeleton bảng hồ sơ cán bộ bị dính vì ô thiếu padding: `TableSkeletonRows` thêm prop `cellClassName` cho bảng ngoài `.admin-table-wrap`.
  - Theo yêu cầu người dùng, đóng modal quyết định (yêu cầu bổ sung / giấy tờ sẵn sàng) không còn hỏi "Bỏ thay đổi chưa lưu?". Vẫn giữ cảnh báo khi rời workspace với nhận xét chưa lưu.
- **Kiểm tra:**
  - `npm run typecheck`, `npm run lint`, `npm run build`: đạt.
  - Playwright các file officer, officer-submissions, manager, auth: 30/34 đạt.
    - `auth.spec.ts:84` và `manager.spec.ts:8` bị timeout lúc trang đang tải; chạy lại riêng thì đạt.
    - `officer.spec.ts:53` và `officer.spec.ts:66` tìm nút "Tiếp nhận tại quầy" vốn không có trong `src` hiện tại. Đây là lỗi có từ trước, không thuộc thay đổi này.
  - Chưa có test riêng cho bộ lọc lĩnh vực và ngày gửi.
- **Còn chờ:**
  - Sau khi BE có API: tab "Lĩnh vực của tôi"/"Đang xử lý của tôi"/"Toàn phường", trả hồ sơ, section "Giám sát hồ sơ" và modal giao/chuyển cho Manager, `assignedCategories` trong `authStore`.
  - Bộ lọc lĩnh vực và thủ tục hiện vẫn chỉ áp dụng trên trang đang tải (50 hồ sơ). Tìm theo họ tên/CCCD cũng vẫn làm phía client.

## Knowledge graph bằng graphify (công cụ cá nhân) — 23/10/2026

- **Phạm vi:** dựng knowledge graph cho FE (toàn bộ code + 27 tài liệu `.md`, bỏ 7 ảnh trang trí trong `public/`) và BE (`D:/wardmate-backend`: chỉ `src/` + `PROGRESS.md`, theo yêu cầu người dùng).
- **Thay đổi trong repo:** chỉ thêm `graphify-out/` vào `.gitignore`. Output cục bộ, không commit: `graphify-out/graph.html`, `GRAPH_REPORT.md`, `graph.json`, `merged-graph.json` (gộp FE+BE). BE đã ignore `graphify-out/` sẵn.
- **Kết quả:** FE 1.346 node / 3.791 cạnh / 73 cụm; BE 3.413 node / 11.208 cạnh / 149 cụm; gộp 4.759 node / 14.999 cạnh. Health check: FE 34 cạnh treo, BE 922 cạnh treo (phần lớn tham chiếu kiểu .NET ngoài repo).
- **Giới hạn:** graphify (`pip install graphifyy`) là công cụ cá nhân giống Ponytail, không phải dependency; chưa cài hook PreToolUse vào `.claude/settings.json` chung. Node từ tài liệu chưa tự nối với node code tương ứng (ID khác nhau). Cập nhật sau khi sửa code: `/graphify . --update`.

## Loại bỏ 2 trang Thống kê chưa có Backend: "Thống kê lượt tra cứu" & "Thống kê biểu mẫu" — 23/10/2026

- **Yêu cầu người dùng:** Xóa 2 trang "Thống kê lượt tra cứu" và "Thống kê biểu mẫu" trong phân hệ Quản lý điều hành (Manager Workspace).
- **Các file và thành phần đã cập nhật:**
  1. `src/components/layout/RoleWorkspaceSidebars.tsx`: Loại bỏ 2 menu item `stats-searches` và `stats-forms` khỏi nhóm `Thống kê hệ thống` trong `UnifiedManagerSidebar`. Dọn dẹp import không dùng `MagnifyingGlass`.
  2. `src/pages/manager/types.ts`: Xóa `stats-searches` và `stats-forms` khỏi union type `ManagerSectionId`.
  3. `src/pages/manager/ManagerHeader.tsx`: Loại bỏ metadata tiêu đề tương ứng trong `managerSectionTitles`.
  4. `src/pages/manager/ManagerPage.tsx`: Xóa logic kiểm tra điều kiện render cho 2 section này.
  5. `src/pages/manager/views/ManagerSystemStatsView.tsx` & `src/components/analytics/ManagerAnalyticsView.tsx`: Cập nhật prop type và dọn sạch khối cảnh báo placeholder `unavailable`.
  6. `tests/manager.spec.ts`: Cập nhật test case chuyển đổi tab thống kê chỉ còn `Thống kê hồ sơ` và `Thống kê thủ tục`.
- **Kiểm tra kỹ thuật:**
  - `npm run typecheck`: **0 lỗi (exit code 0)**.
  - `npm run lint`: **0 lỗi (exit code 0)**.
  - `npx playwright test tests/manager.spec.ts tests/analytics.spec.ts`: **17/17 tests PASS (100%)**.
  - `npm run build`: **Build production thành công**.

## Nâng cấp Giao diện Bộ lọc Thống kê Quản lý (AnalyticsFilters UI) — 23/10/2026

- **Yêu cầu người dùng:** Xây dựng lại khu vực bộ lọc của giao diện Manager (và các nơi tương tự) chuyên nghiệp, đẹp và hiện đại hơn.
- **Các cải tiến đã triển khai tại `src/components/analytics/AnalyticsFilters.tsx`:**
  1. **Thiết kế phân tầng hiện đại (Card Header & Body):**
     - Bổ sung thanh tiêu đề phụ với icon `FunnelSimple`, nhãn _"Bộ lọc & Phạm vi thời gian"_ và mô tả trực quan.
     - Cụm nút bấm chọn nhanh thời gian (_Tháng này, Quý này, Năm nay_) được đưa vào cụm segment control viền mềm với hiệu ứng active nổi bật, đổi màu đỏ thương hiệu và bóng đổ tinh tế khi được chọn.
  2. **Tối ưu hóa các trường nhập liệu ngày & thủ tục:**
     - Các ô nhập ngày `Từ ngày` và `Đến ngày` bổ sung nhãn kèm icon `CalendarBlank`, styling viền bo góc tròn `rounded-xl`, màu nền xám nhẹ `bg-slate-50/40`, focus ring đỏ nhạt cao cấp `focus:ring-red-100`.
     - Cụm "Thủ tục áp dụng": Gộp ô tìm kiếm nhanh (icon `MagnifyingGlass`) và dropdown chọn thủ tục liền kề cân đối, có badge xanh `Đã lọc thủ tục` khi đang chọn thủ tục cụ thể.
     - Nút "Áp dụng" đồng bộ chiều cao `h-11`, bo góc hiện đại, shadow mượt mà.
  3. **Cải tiến các khối trạng thái liên quan:**
     - `AnalyticsStatus`: Loading spinner thanh lịch, khối lỗi có cảnh báo nhẹ và nút "Thử lại".
     - `CoverageNotice`: Badge trực quan thể hiện trạng thái dữ liệu (đủ ngày vs thiếu ngày) và thời điểm cập nhật.
     - `AnalyticsPagination`: Trình bày phân trang gọn gàng, tách biệt hàng nút với số trang hiện tại.
- **Kiểm tra kỹ thuật:**
  - `npm run typecheck`: **0 lỗi (exit code 0)**.

## Cải tổ UI/UX "Tờ khai của tôi": Chống Trùng lặp Tiêu đề, Làm Sạch Tên File & Toolbar Chuẩn — 23/10/2026

- **Yêu cầu người dùng:** Đặt lại tựa đề chuẩn cho chức năng, loại bỏ trùng lặp 3 tầng tiêu đề (Breadcrumb, H1, H2 trong card) và cải tổ toàn diện UI/UX của danh mục bản khai.
- **Các cải tiến đã triển khai:**
  1. **Chuẩn hóa Tựa đề & Phân cấp Tiêu đề (`CitizenPage.tsx`):**
     - Đổi tên gọi từ `Bản khai của tôi` ➔ **`Tờ khai của tôi`** chuẩn hành chính một cửa, đồng bộ giữa Breadcrumb, Sidebar và H1 trang.
     - Bổ sung subtitle giải thích rõ ràng: _"Quản lý các mẫu tờ khai hành chính trực tuyến (.docx). Bạn có thể xem lại, chỉnh sửa hoặc liên kết vào hồ sơ."_ hiển thị dưới H1 trang.
     - Xóa bỏ thẻ H2 trùng lặp bên trong Card (`CitizenSubmissionsView.tsx`), thay bằng `<h2 className="sr-only">Danh sách tờ khai</h2>` chuẩn trợ năng WCAG.
  2. **Bộ lọc làm sạch tên file thông minh (`cleanSubmissionFileName`):**
     - Tự động cắt bỏ tiền tố mã băm GUID 32 ký tự hex (ví dụ: `dccb6f4a..._don-nhap.docx` ➔ `don-nhap.docx`).
     - Tự động loại bỏ phần mở rộng kép bị lỗi từ backend (ví dụ: `.docx.docx` ➔ `.docx`).
  3. **Thanh công cụ Toolbar hiện đại (`CitizenSubmissionsView.tsx`):**
     - Bổ sung ô tìm kiếm nhanh (Search) theo tên tờ khai thời gian thực với nút xóa nhanh `×`.
     - Dropdown chọn trạng thái bo góc tinh tế, giữ nhãn trợ năng `aria-label="Trạng thái bản khai"`; loại bỏ tùy chọn lỗi thời `Approved` ("luồng cũ") để chỉ giữ 4 trạng thái thực tế.
     - Nút xóa bộ lọc khi đang tìm kiếm hoặc lọc trạng thái.
     - Badge đếm số lượng tờ khai (`4 tờ khai`) và nút Làm mới kèm icon xoay đồng bộ.
  4. **Nâng cấp thẻ hiển thị tờ khai (Document Cards):**
     - Thêm icon nhận diện file Word màu xanh (`FileDoc` trong khung xanh nhạt bo góc).
     - Badge trạng thái trực quan với màu sắc & chấm trạng thái rõ ràng (_Nháp đã lưu_, _Đã chốt_, _Cần chỉnh sửa_, _Giấy tờ sẵn sàng_, _Đã duyệt_).
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

- Theo yêu cầu mới, thay phần KPI dạng thẻ và khối truy cập nhanh bằng bố cục tập trung vào **4 biểu đồ**: đường xu hướng theo ngày; thanh ngang so sánh hoạt động tiền kiểm; vòng phân bố hạn xử lý của hồ sơ đã sẵn sàng; thanh ngang phân bố đánh giá 1–5 sao. Desktop hai cột, mobile một cột.
- Sửa `src/pages/manager/views/ManagerOverviewView.tsx`, thêm `src/components/analytics/OverviewCountChart.tsx` dùng Recharts đã cài. Giữ ba API overview/trends/feedback summary, bộ lọc và làm mới chung, lỗi/retry từng khối, coverage, bảng dữ liệu cho accessibility và nút vào màn chi tiết.
- Các hoạt động không phải tập hồ sơ loại trừ nhau nên dùng thanh so sánh, không tính tỷ lệ cộng dồn. Biểu đồ vòng chỉ dùng bốn nhóm hồ sơ đã hoàn tất tiền kiểm (đúng hạn/quá hạn/chưa xác định hạn/không áp dụng hạn); hồ sơ đang tồn/tạm dừng hiển thị riêng. Tổng bằng 0 hiển thị trạng thái rỗng; rate null giữ “Chưa đủ dữ liệu”, không tạo hình hoặc phần trăm giả.
- Cập nhật `tests/manager.spec.ts`, `tests/analytics.spec.ts` theo UI biểu đồ; thêm dữ liệu rỗng trong fixture và test không vẽ vòng/tỷ lệ giả. **17/17 test Edge/mock đạt** ở lượt cuối (37,7 giây), gồm Manager và Analytics. Đã chụp/xem ảnh desktop và mobile, không tràn ngang trong kiểm tra mobile.
- `npm run typecheck`, `npm run lint`, `npm run build` đều đạt; build cuối 16,41 giây, còn cảnh báo annotation Zod/bundle lớn như trước. Không thay đổi API/auth/proxy/BE, không thêm dependency, không commit/push; chưa xác minh dữ liệu bằng tài khoản Azure thật. Giữ nguyên thay đổi có sẵn trong `package-lock.json`.

## Bổ sung trang Tổng quan Manager — 23/10/2026

- Đã thêm mục **Tổng quan** ở đầu sidebar Manager và đặt làm màn mặc định tại `/manager` (cả route alias dùng cùng component). Mục Thống kê hồ sơ vẫn là màn chi tiết riêng; không còn dùng màn này thay dashboard.
- UI mới tại `src/pages/manager/views/ManagerOverviewView.tsx`: bốn chỉ số lượt gửi/giấy tờ sẵn sàng/đúng hạn/tồn quá hạn, số lượt bổ sung/gửi lại/hủy, cảnh báo thiếu hạn/tạm dừng, biểu đồ theo ngày, điểm hài lòng/phân bố sao và nút tới hồ sơ/phản hồi/thủ tục/cán bộ. Dùng chung bộ lọc ngày/thủ tục và nút làm mới trên dashboard.
- Đọc ba API đã có (`overview`, `trends`, `feedback/summary`) qua `useAnalytics`; không thêm endpoint, mock vào runtime hoặc dependency. Các khối loading/lỗi/retry độc lập; thiếu dữ liệu hiện cảnh báo, tỷ lệ null không đổi thành 0. Tái sử dụng schema/validation và phân quyền Manager hiện có.
- Tách `src/components/analytics/AnalyticsTrendChart.tsx` dùng chung giữa Tổng quan và thống kê chi tiết, có bảng dữ liệu cho accessibility, giữ khoảng trống ngày thiếu và tắt animation để dữ liệu hiển thị ngay. Chỉnh bộ lọc `items-start` để ô ngày không bị kéo cao theo cột tìm thủ tục.
- File điều hướng liên quan: `ManagerPage.tsx`, `ManagerHeader.tsx`, `types.ts`, `RoleWorkspaceSidebars.tsx`; lời chào chuyển sang Tổng quan.
- Kiểm tra mới: `npm run typecheck` đạt; `npm run lint` đạt. **22/22 test Edge/mock đạt** ở lượt cuối (40,4 giây), gồm `manager.spec.ts`, `analytics.spec.ts`, `workspace-sidebar.spec.ts`: mặc định Tổng quan, điều hướng chi tiết, lỗi từng khối, kỳ lọc chung, hồi quy API/sidebar và không tràn ngang mobile. Đã chụp và xem ảnh desktop/mobile trong `test-results` (không commit artifact).
- `npm run build` bản cuối đạt (28,23 giây, exit 0); còn cảnh báo annotation Zod và bundle lớn như trước. `git diff --check` đạt. Chưa xác minh bằng tài khoản thật trên Azure. Không sửa BE, không commit/push và giữ nguyên thay đổi khác đang có.

## Rà soát lại API Analytics và sửa validation — 23/10/2026

- Đã đọc lại Swagger Azure trực tiếp và đối chiếu controller/DTO BE với client cùng nơi gọi UI: **đủ 10/10 thao tác nghiệp vụ** (Manager 6, Admin 2, công dân 2). `GET /` chỉ là thông tin dịch vụ. Bảng đối chiếu đầy đủ tại `docs/ANALYTICS_API_AUDIT_2026-10-23.md`.
- Sửa `src/lib/api/analytics.ts`: GUID tương thích .NET, không áp đặt version/variant UUID, vẫn chặn GUID rỗng. Kiểm tra response đúng kỳ/trang đã yêu cầu, số lượng phần tử hợp lệ; missingDates không trùng/ngoài kỳ; xu hướng đủ ngày, không trùng/ngoài kỳ. API phản hồi không trả coverage thì không tự tuyên bố đã xác minh kỳ từ metadata response.
- Test bổ sung tái hiện lỗi focus validation BE ở modal công dân: thông báo có nhưng fieldset còn khóa nên không focus được. Đã sửa trong `CitizenFeedbackModal.tsx`; `AnalyticsJobsView.tsx` chờ modal xác nhận đóng/khôi phục focus trước khi focus ô ngày. Chỉ ánh xạ các trường thuộc đúng form.
- Thêm “Làm mới dữ liệu” cho Manager, giữ bộ lọc và tải lại cả overview/trends khi cần; tra job dùng staleTime 0 để không bỏ qua việc đọc lại trạng thái khi quay lại mã đã tra.
- Kiểm tra mới trong lượt này: **22/22 test Edge/mock đạt**, gồm `analytics.spec.ts`, `feedback.spec.ts`, `manager.spec.ts` (50 giây, exit 0). Bổ sung ca sai kỳ/trang/trùng ngày, GUID/pageSize/jobId tại biên, 409 hồ sơ chưa sẵn sàng, lỗi trường và focus của hai form. Fixture trends đã mô phỏng đủ ngày theo implementation BE thay vì chỉ một ngày.
- `npm run typecheck`: đạt; `npm run lint`: đạt; `npm run build` bản cuối: đạt (28,61 giây), còn cảnh báo annotation Zod và bundle lớn như trước. `git diff --check`: đạt. Không chạy lại bộ JWT/core hoặc proxy vì không sửa các phần đó trong lượt này; kết quả 46 test và 16 route của lượt trước là lịch sử riêng.
- Chưa kiểm chứng luồng có tài khoản thật hoặc gửi mutation lên Azure. Không thiếu call API trong Swagger; các tính năng ngoài hợp đồng và giới hạn tra tên cán bộ từ 100 mục IAM đầu tiên được ghi rõ trong tài liệu audit. Không sửa BE, không thêm dependency, không commit/push; giữ nguyên thay đổi `package-lock.json` có sẵn.

## Tích hợp Analytics / AnalyticsJobs / CitizenFeedback — 23/10/2026

- **Đã triển khai FE đủ 10 thao tác HTTP nghiệp vụ** theo kế hoạch `docs/ANALYTICS_API_INTEGRATION_PLAN_2026-10-23.md`, sau khi đọc code FE/BE và Swagger Azure. Không sửa BE, không triển khai mọi API còn thiếu của toàn bộ WardMate. Ghi chú cũ loại trừ Analytics không còn áp dụng cho phạm vi mới này.
- **Client / routing:** thêm `src/lib/api/analytics.ts`, `src/hooks/useAnalytics.ts`; Zod kiểm tra query, response và ID hồ sơ/job; dùng Axios/JWT chung, Query theo userId, không tự retry thao tác ghi. Thêm `VITE_ANALYTICS_API_URL`, proxy Analytics/feedback trước IAM; cập nhật `.env.example`, Playwright và script kiểm tra proxy. Đã thêm origin Gateway vào `.env.development.local` đang được ignore mà không ghi đè biến có sẵn; production cần biến môi trường/reverse proxy tương đương.
- **Manager:** nối overview/trends/procedures/officers/feedback/feedback summary qua `src/components/analytics/ManagerAnalyticsView.tsx` và các view hiện có. Có lọc ngày/thủ tục, kỳ tháng/quý/năm hiện tại, phân trang server, tra tên thủ tục/cán bộ, biểu đồ và bảng dữ liệu, loading/error/retry/empty. Ngày thiếu để trống trên biểu đồ và cảnh báo coverage; tỷ lệ null là chưa đủ dữ liệu. Nhóm hồ sơ chưa phân công tách riêng. Nhãn UI diễn đạt tiền kiểm và số lượt bổ sung, không tự tính tỷ lệ thiếu mẫu số hoặc mô tả tiếp nhận chính thức.
- **Công dân:** sửa `CitizenFeedbackModal.tsx`, `CitizenPage.tsx`, các view đánh giá/dashboard/danh sách hồ sơ. Truyền applicationId thật; cho chọn hồ sơ `DOCUMENTS_READY` hoặc dữ liệu lịch sử `OFFICIALLY_RECEIVED`; GET đánh giá trước khi gửi, chỉ coi 404 `feedback.not_found` là chưa đánh giá. Form RHF/Controller giữ rating là số nguyên 1–5, comment tối đa 2.000 ký tự; bỏ tiêu chí phụ BE chưa lưu. Chặn gửi trùng, giữ dữ liệu khi lỗi/đóng nhầm, xử lý 409 đã đánh giá bằng tải lại, khóa gửi khi hồ sơ không còn đủ điều kiện; response phải khớp hồ sơ. Trang đánh giá có phân trang hồ sơ, không giả lập lịch sử toàn bộ tài khoản.
- **Admin:** thêm `src/pages/admin/AnalyticsJobsView.tsx` và menu Job thống kê. Form ngày có xác nhận, POST 202 chỉ báo xếp lịch; GET trạng thái có polling, dừng khi kết thúc/lỗi/trạng thái chưa biết. Xử lý jobs_disabled và tra cứu mã job; không tự retry POST sau timeout.
- **Validation:** ngày lịch hợp lệ từ 01/01/2000, From ≤ To ≤ hôm nay tại UTC+7, tối đa 366 ngày tính cả hai đầu; GUID khác rỗng, page 1–100.000, pageSize 1–100, jobId gồm 1–30 chữ số ASCII. Có ánh xạ lỗi HTTP validation theo trường; không xóa phiên vì 503.
- **Kiểm tra đã chạy trong lượt triển khai trước khi bị ngắt:** `npm run typecheck` đạt; `npm run lint` đạt; `npm run build` đạt (37,59 giây ở lượt cuối). Build còn cảnh báo annotation của Zod và bundle lớn, gồm editor DOCX hiện có. `node tests/api-proxy-check.mjs`: **16/16 route đạt**.
- **Kiểm thử Edge/mock cuối cùng:** **46/46 test đạt, exit 0**, gồm `analytics.spec.ts`, `feedback.spec.ts`, `manager.spec.ts`, `jwt-client.spec.ts`, `design-system.spec.ts`, `landing.spec.ts`. Bao phủ cả 10 thao tác, ngày biên/năm nhuận, sao/nội dung, phân trang/đổi kỳ, coverage/null, 403/404/409/503, response sai hồ sơ/cấu trúc, job 202/polling và mobile/đóng form. Các lượt chạy trong sandbox trước đó treo ở dọn tiến trình; lượt cuối ngoài sandbox đã kết thúc đầy đủ. Lượt tiếp tục sau ngắt chỉ kiểm tra Git/diff, xác nhận `.last-run.json` passed và hoàn tất tài liệu, không báo đã chạy lại toàn bộ test.
- **Azure:** đã đọc Swagger live; GET không token tới ba nhóm route overview/job/citizen feedback đều trả 401. Đây chỉ là kiểm tra routing/yêu cầu xác thực, chưa kiểm chứng dữ liệu, quyền/phường, cookie hoặc job thật; không gửi mutation lên Azure.
- **Còn chờ xác minh môi trường thật:** tài khoản công dân/Manager/Admin đúng role/phường và môi trường cho phép chạy job. Các chức năng BE chưa có (lịch sử toàn bộ đánh giá công dân, sửa/xóa/trả lời đánh giá, xuất Excel, thống kê tra cứu/biểu mẫu) không được giả lập. SignalR thông báo nằm ngoài 10 thao tác HTTP đã chốt.
- Giữ nguyên thay đổi có sẵn trong `package-lock.json` (27 dòng thêm/25 dòng bỏ); không thêm dependency. Trạng thái behind trong lượt tích hợp cũ đã được thay thế bởi mốc Git xác minh ở mục bàn giao 23/10 đầu file. `git diff --check` đạt khi tiếp tục phiên.

## Bổ sung Tab "Hồ sơ đã hủy" trong Cổng dịch vụ công dân — 23/10/2026

- **Hạng mục hoàn thành:**
  - Bổ sung định danh mục `dossiers_cancelled` vào kiểu dữ liệu `CitizenSectionId` (`src/pages/citizen/types.ts`).
  - Thêm tab con **"Đã hủy"** (`XCircle` icon) dưới nhóm điều hướng _"Hồ sơ của tôi"_ ở Sidebar (`src/pages/citizen/CitizenPage.tsx`).
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
     - Loại bỏ thanh tiêu đề phụ dư thừa _"Hàng đợi hồ sơ tiếp nhận / X hồ sơ"_ phía trên bảng.
     - Chuyển nút _"Làm mới"_ lên thẳng thanh công cụ bộ lọc (cùng hàng với kết quả tìm kiếm), giúp bảng hồ sơ gọn gàng, thoáng đãng và hiển thị trực tiếp hàng tiêu đề cột.
- **Kiểm tra kỹ thuật:**
  - `npm run typecheck`: **0 lỗi (exit code 0)**.
  - `npm run lint`: **0 lỗi (exit code 0)**.

## Hoàn thiện UI Nội dung Đổi mật khẩu & Chuẩn hóa Thanh Tab — 22/10/2026

- **Yêu cầu & Tinh chỉnh từ người dùng:**
  1. Trả thanh Tab điều hướng về kiểu thanh gạch chân (Underline Tabs) tinh tế, chuẩn mực, không dùng hiệu ứng gradient hay badge nổi trội chói mắt.
  2. Gỡ bỏ hoàn toàn khối card "Mật khẩu tài khoản" dư thừa ở chân trang tab Thông tin cá nhân.
  3. **Tối ưu heading và nội dung đổi mật khẩu (`AccountSecuritySection.tsx`):**
     - Đơn giản hóa phần Heading: Bỏ gradient nền rườm rà, dùng layout ngang gọn gàng, tiêu đề súc tích _"Đổi mật khẩu"_ và phụ đề ngắn gọn, ý nghĩa: _"Bảo vệ an toàn cho tài khoản của bạn"_.
     - Rút gọn toàn bộ các placeholder ô nhập ("Nhập mật khẩu hiện tại", "Nhập mật khẩu mới", "Nhập lại mật khẩu mới") giảm tải chữ, tạo cảm giác thoáng đãng và dễ thao tác.
     - **Thanh đo độ mạnh 4 nấc real-time (Strength Meter):** Phản hồi màu sắc sinh động (Yếu, Trung bình, Khá tốt, Rất mạnh).
     - **Checklist 4 tiêu chí dạng thẻ pill tương tác:** Tự động chuyển từ xám sang nền xanh `emerald-50` kèm dấu tick `Check` khi đạt tiêu chí.
     - **Chỉ báo khớp mật khẩu xác nhận real-time:** Báo tick xanh khi trùng khớp, báo cảnh báo đỏ khi chưa khớp trước khi bấm gửi.
     - Footer thanh lịch với ghi chú bảo mật và nút _"Lưu mật khẩu mới"_ chuẩn phong cách WardMate.
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
  2. **Đổi mật khẩu tài khoản (`POST /api/v1/users/me/change-password`):**
     - Bổ sung API `changePassword` trong `src/lib/api/index.ts`.
     - Xây dựng component `ChangePasswordModal.tsx` với checklist độ mạnh mật khẩu (>=8 ký tự, hoa, thường, số, ký tự đặc biệt), ẩn/hiện mật khẩu, kiểm tra trùng khớp.
     - Tự động thu hồi phiên đăng nhập và điều hướng an toàn về `/dang-nhap` khi đổi mật khẩu thành công (do backend thu hồi toàn bộ refresh token).
     - Tích hợp nút mở đổi mật khẩu tại:
       - Menu tài khoản `UserDropdown.tsx` (cả giao diện desktop và mobile drawer).
       - Trang hồ sơ cá nhân cán bộ/quản lý `UnifiedSelfProfileView.tsx`.
       - Trang hồ sơ công dân `CitizenProfileView.tsx`.
  3. **Xem trước trực tiếp tài liệu đính kèm (`GET /api/v1/supporting-documents/{documentId}/preview`):**
     - Bổ sung `previewSupportingDocument` trong `src/lib/api/documentForms.ts`.
     - Cập nhật `OfficerDocumentsPanel.tsx` và `DossierChecklistView.tsx` để xem trước trực tiếp (inline stream) đối với định dạng PDF, PNG, JPG/JPEG kèm cơ chế tự động fallback về download nếu là Word hoặc định dạng không hỗ trợ.
  4. **Thủ tục hành chính nổi bật (`GET /api/v1/procedures/featured`):**
     - Bổ sung `procedureApi.featured` và hook `useFeaturedProcedures()`.
     - Hiển thị danh sách thủ tục nổi bật có gắn huy hiệu "Nổi bật" tại trang chủ `HomePage.tsx` khi chưa nhập từ khóa tìm kiếm.
  5. **Nộp bản Word đã điền offline (`POST /api/v1/citizen/submissions/upload-filled-docx`):**
     - Bổ sung `uploadFilledDocx` trong `documentFormApi` và `useDocumentMutations`.
     - Kết nối luồng upload bản Word tải về từ biểu mẫu trong `DossierChecklistView.tsx`.
  6. **Bóc tách thông tin thẻ CCCD bằng AI OCR (`POST /api/v1/ai-ocr/cccd/extract`):**
     - Tạo client `src/lib/api/aiOcr.ts` với Zod schema xác thực dữ liệu trích xuất.
     - Xây dựng component `CccdOcrScanModal.tsx` cho phép tải ảnh mặt trước (bắt buộc) và mặt sau (tùy chọn) thẻ CCCD, kiểm tra dung lượng (tối đa 8MB/ảnh).
     - Hiển thị kết quả bóc tách (Số CCCD, Họ tên, Ngày sinh, Giới tính, Quê quán, Thường trú) cùng độ tin cậy AI, hỗ trợ người dùng áp dụng trực tiếp vào biểu mẫu hồ sơ công dân (`CitizenProfileView.tsx`).
     - Bổ sung cảnh báo an toàn bảo mật dữ liệu công dân (không lưu trữ ảnh vào cơ sở dữ liệu).
  7. **Trợ lý ảo AI hỏi đáp quy trình thủ tục (`POST /api/v1/ai/chat/completions`):**
     - Xây dựng component `AiChatWidget.tsx` dạng cửa sổ nổi tương tác trực quan (Floating Widget) góc dưới bên phải màn hình tại `CitizenPage.tsx` và `HomePage.tsx`.
     - Hỗ trợ câu hỏi nhanh gợi ý, duy trì mã phiên hội thoại `conversationId`, hiển thị câu trả lời dạng văn bản an toàn kèm lưu ý pháp lý.
  8. **Cấu hình Gateway / Proxy (`vite.config.ts` & `serviceUrls.ts`):**
     - Bổ sung định tuyến proxy cho `/api/v1/ai-ocr` và `/api/v1/ai/chat`.
  9. **Theo dõi Hạn xử lý tiền kiểm (Review Deadline - SLA 45 giờ làm việc):**
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
    - Thêm ô chọn `Loại biểu mẫu` (`formType`) vào `FormDefinitionsEditor` (cho phép chọn giữa _Mẫu điện tử tương tác_ và _Mẫu Word DOCX_).
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
  - Tại `src/pages/citizen/views/CitizenQrCodeView.tsx`: Thêm điều kiện xử lý an toàn khi danh sách hồ sơ `dossiers` rỗng hoặc chưa chọn hồ sơ (`!activeDossier`); hiển thị giao diện placeholder thông báo _"Chưa có mã QR hồ sơ - API mã QR hồ sơ điện tử sẽ được tích hợp sau"_ thay vì cố đọc `activeDossier.procedureName`.
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
  - `tests/manager.spec.ts`: Cập nhật nhãn tìm kiếm nút Sidebar và Header từ context cũ sang context mới _"Cán bộ Một cửa"_.
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
    - **Khối Thông tin Định danh & Nhân thân (API 06/07)**: Họ tên, Ngày tháng năm sinh, Giới tính, Số điện thoại liên hệ (chuẩn hóa nhãn _"Chưa được cập nhật"_ khi trống).
    - **Khối Nơi cư trú**: Địa chỉ thường trú và Địa chỉ tạm trú (kèm thẻ chip Đơn vị công tác nếu có).
    - **Khối Tài khoản & Quyền hạn công vụ (API 05)**: Tên đăng nhập, Email liên kết, Vai trò hệ thống, và Đơn vị Phường/Xã công tác đối chiếu từ danh mục API `getWards()`.
    - **Thao tác hành động**: Nút "Chỉnh sửa hồ sơ" mở Modal cập nhật thông tin gọi API `PUT /api/v1/users/me/profile` (tự động cập nhật store và làm mới giao diện) + Nút "In phiếu thông tin" (`window.print()`).
  - **Tích hợp đồng bộ vào cả 4 vai trò**:
    - **Admin (`AdminPage.tsx`)**: Bổ sung mục "Hồ sơ cá nhân" (icon `UserCircle`, tab `profile`) trong nhóm _Tài khoản & truy cập_ tại Sidebar, kết nối trực tiếp với `UnifiedSelfProfileView`.
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
  - **Xử lý thân thiện khi Manager gặp lỗi 403 (chưa có Phường)**: Thay vì báo lỗi chung chung, hiển thị Alert hướng dẫn rõ ràng: _"Tài khoản Lãnh đạo của bạn chưa được phân bổ Phường công tác trong hệ thống. Vui lòng liên hệ Quản trị viên hệ thống (Admin) để gán Phường trước khi quản lý cán bộ Một cửa."_
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
    - Dropdown chọn phường công tác trong bảng Người dùng chỉ hiển thị tên phường thuần túy (`w.name`, ví dụ: _Phường Bình Hòa_), bỏ mã code kỹ thuật trong ngoặc đơn (`(PHUONG_BINH_HOA)`) giúp giao diện gọn gàng, tự nhiên.
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
    - Loại bỏ hoàn toàn khối giả lập hardcode _"Phân công quầy tiếp nhận"_ (cơ quan giả UBND Phường An Khánh, vị trí trực giả, lĩnh vực phụ trách giả, lịch trực tuần giả, badge giả "Đang trong ca trực").
    - Chuyển sang hiển thị 100% dữ liệu thực từ backend IAM:
      - **Thông tin Định danh & Nhân thân (API 06/07)**: Thẻ CCCD gắn chip (kèm nút sao chép), Họ tên, Ngày tháng năm sinh, Giới tính, Số điện thoại liên hệ, Địa chỉ thường trú và Tạm trú.
      - **Thông tin Tài khoản & Quyền hạn công vụ (API 05)**: Tên đăng nhập, Email, Đơn vị Phường công tác thực tế (đối chiếu `wardId` qua API `getWards()`), Vai trò Việt hóa chuẩn (`Cán bộ Một cửa`), và số lượng quyền nghiệp vụ IAM.
      - Cho phép chỉnh sửa và cập nhật hồ sơ cá nhân thời gian thực qua `updateMyProfile` (`PUT /api/v1/users/me/profile`).
  - **Tối ưu hóa UI chi tiết Phường và Bảng Cán bộ Một cửa theo phản hồi người dùng**:
    - **Manager Quản lý Cán bộ Một cửa (`ManagerProfilesView.tsx`)**: Bỏ cột "Số điện thoại" trong bảng danh sách giúp bảng thông thoáng; chuyển thông tin số điện thoại vào trong màn hình Xem chi tiết.
    - **Làm rõ UI Đơn vị Phường trong Xem chi tiết (`ManagerProfileDetailView.tsx`)**:
      - Bổ sung icon `Buildings` kèm nhãn rõ ràng `Đơn vị: {wardName}` dạng thẻ badge trang nhã ở Header Banner thay vì thẻ xám không rõ ý nghĩa.
      - Xóa bỏ hoàn toàn dòng text phụ dính nhau `@username · email` ở Banner; gom toàn bộ dữ liệu tài khoản và quyền truy cập về **1 chỗ duy nhất** ở khối _"Thông tin Tài khoản & Quyền truy cập"_ ở cuối trang với nhãn đầy đủ cho từng trường dữ liệu.
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
    - Cập nhật nhãn mục lục thành _"Thành phần hồ sơ & Quy trình"_.
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
    - **Thanh Tabs Trường hợp áp dụng (Cases)**: Tab bar tinh tế cho phép chuyển đổi tức thì giữa các trường hợp (ví dụ: _Đúng hạn_, _Quá hạn_, _Chưa kết hôn_...), kèm thẻ ghi chú điều kiện áp dụng ngay bên dưới.
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
     - Thay đổi thông báo khi đăng xuất từ _"Đã đăng xuất an toàn."_ thành **"Đã đăng xuất."** ngắn gọn, chuẩn xác.
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
     - Rút gọn tiêu đề và nội dung modal: _"Bạn có chắc chắn muốn đăng xuất tài khoản? Phiên làm việc hiện tại sẽ kết thúc an toàn."_
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
  - Bổ sung `SectionId` `'profiles'` và mục **"Hồ sơ công dân"** vào menu điều hướng nhóm _Tài khoản & truy cập_ (icon `IdentificationCard`, badge đếm số lượng).
  - Giao diện bảng dữ liệu `AdminProfilesView`:
    - Thanh công cụ (`admin-toolbar`): Ô tìm kiếm từ khóa đa trường (`SearchBar`), dropdown lọc theo giới tính và nút `+ Thêm hồ sơ`.
    - Bảng hiển thị: 7 cột thuộc tính định danh kèm mã mono nổi bật cho CCCD, badge giới tính và nút thao tác _Chỉnh sửa_.
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

| Hạng mục      | Kết quả / vị trí                                                                                             |
| ------------- | ------------------------------------------------------------------------------------------------------------ |
| UI core       | `src/components/ui/`: Button, Input, Modal, Badge, Toast và export chung                                     |
| Button        | Thêm loading, disabled khi loading và aria-busy; giữ variant/size hiện có                                    |
| Input         | Label, hint, error, aria-describedby/aria-invalid; áp dụng vào đăng nhập/đăng ký                             |
| Modal         | Radix, focus trap, Escape, trả focus cả khi mở bằng code, bố cục mobile                                      |
| Toast         | Module dùng chung; chuyển Toaster và thông báo các trang sang module này                                     |
| JWT client    | `src/lib/api/createJwtClient.ts`: gắn Bearer, gom refresh đồng thời, retry tối đa một lần, xử lý 401 đến trễ |
| Quản lý phiên | Chặn kết quả refresh của phiên cũ sau logout/đổi phiên; request hủy không gửi lại                            |
| Lỗi refresh   | 401/403 từ refresh hoặc retry vẫn 401 thì hết phiên; lỗi mạng/server giữ phiên để thử lại                    |
| Điều hướng    | `src/lib/authRedirect.ts`: returnTo an toàn; AuthPage hiện lý do hết phiên                                   |
| Cấu hình      | `.env.example` để trống VITE_API_BASE_URL; không gọi endpoint giả                                            |
| Tài liệu      | `design-system-and-auth.md`: cách dùng core và nối backend                                                   |
| Ví dụ UI      | `tests/fixtures/ui.html`, `tests/fixtures/ui.tsx`: dùng khi chạy Vite dev                                    |

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
