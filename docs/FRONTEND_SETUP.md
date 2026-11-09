# Nền tảng FE Web

## UI bộ lọc ngày và Cập nhật thống kê — 09/11/2026

- Bộ lọc dùng chung `AnalyticsFilters` căn theo đầu hàng, nút Áp dụng căn với ô ngày trên desktop. Lỗi validation nằm dưới ô, không đẩy lệch ô bên cạnh; `aria-invalid`/`aria-describedby` liên kết lỗi. Sửa ngày thủ công bỏ đánh dấu kỳ chọn nhanh.
- Admin dùng nhãn **Cập nhật thống kê**, tiêu đề **Cập nhật số liệu thống kê**. Theo yêu cầu thu gọn tiếp ngày 09/11, màn hình chỉ có một card tối đa 4xl: hai ô ngày và nút cập nhật; kết quả chỉ xuất hiện sau khi gửi/tra cứu. Bỏ số thứ tự, khối chờ rỗng và các hướng dẫn lặp. Mã/thời gian/nút kiểm tra nằm trong **Chi tiết lần cập nhật**, tra mã cũ nằm trong **Tra cứu lần cập nhật cũ**; mặc định đều thu gọn. Không có API danh sách/lịch sử tác vụ nên không dựng danh sách giả hoặc tự lưu mã vào storage.
- BE `AnalyticsAggregationJob.Rebuild` đọc Workflow và thay số liệu tổng hợp theo ngày cho thủ tục/cán bộ. UI chỉ yêu cầu tổng hợp lại và đọc trạng thái; không sửa dữ liệu hồ sơ. Giữ khoảng 1–366 ngày, role IT_ADMIN, POST 202 có xác nhận và không tự retry; GET polling 3 giây khi còn chờ/xử lý, dừng khi lỗi/kết thúc. Không hiển thị phần trăm hoặc thời điểm hoàn tất thiếu hợp đồng.

## Khắc phục 404 quản trị hệ thống qua Gateway — 09/11/2026

- Bốn chức năng Giám sát dịch vụ, Cấu hình hệ thống, Nhật ký hoạt động (nghiệp vụ/thay đổi cấu hình) và Sao lưu dữ liệu dùng `systemAdministrationPath` tại `src/lib/api/serviceUrls.ts`: `/api/analytics-system/api/v1/system/...`. Tab Phân quyền IAM giữ API IAM hiện có.
- Khi gọi khác origin, helper dùng `VITE_DOCUMENT_FORM_API_URL` là origin **Gateway**, giống hub thông báo; không thêm prefix vào biến môi trường. Khi `VITE_USE_API_PROXY=true`, URL tương đối đi qua proxy `/api/analytics-system` có sẵn của Vite tới Gateway. Hosting dùng proxy production cần hỗ trợ cùng tuyến này.
- Chỉ đổi đường đi qua Gateway, giữ method/body/query và JWT client. Không đổi URL chung của Analytics, thống kê, phản hồi hoặc job.
- Kiểm tra Azure ngày 09/11: GET health/services, settings, audit-logs, audit-events, backups trực tiếp Analytics và qua prefix Gateway trả 401 khi chưa có token; đường ngắn `/api/v1/system/...` qua Gateway trả 404. Source YARP local đã có route ngắn nhưng cấu hình triển khai hiệu lực chưa được xác minh. Chưa nghiệm thu nghiệp vụ bằng phiên IT_ADMIN thật; 401 chỉ xác nhận request tới lớp xác thực.

## Lịch tháng: hợp đồng đang dùng — 06/11/2026

- Đối chiếu source hiện tại tại `E:/wardmate-backend`: MonthlyView gồm `month, slots, baseFingerprint, draft, leaves, closures, confirmations`; ScheduleDraftInput nhận `expectedVersion, baseFingerprint, slots, reason`. FE dùng đúng các trường này. Không yêu cầu hoặc tự tạo `daysOff/isPublished/canEdit/editDeadlineUtc`.
- Chọn cán bộ rồi tháng; bấm ngày để đặt hoặc bỏ ca, lưu nháp và xác nhận công bố riêng. Mỗi lần lưu gửi toàn bộ ca của phường, giữ ca và bản nháp của cán bộ khác. HTTP 400 cho sửa và gửi lại; lỗi mạng/409/5xx giữ nội dung và yêu cầu kiểm tra trạng thái, không tự gửi lại mutation.
- Lịch tháng đọc ca qua đêm tại hai ranh giới tháng để chặn giờ trùng, không đưa ca ngoài tháng vào payload. Danh sách hiển thị cả ca kéo dài sang hôm sau và ca từ cuối tháng trước.
- Ngày có ca màu xanh nhạt; ngày lễ/nghỉ chung hoặc nghỉ phép cả ngày màu đỏ nhạt. Ngày trống là chưa có ca. BE hiện chưa lưu ngày nghỉ cá nhân bằng checkbox và chưa áp hạn khóa sửa 24 giờ trước đầu tháng; không coi hai yêu cầu đó đã triển khai. Muốn hỗ trợ cần thay đổi hợp đồng, lưu trữ và enforcement BE đồng bộ.
- BE hiện cho sửa ca tương lai và giữ nguyên ca đã bắt đầu. Publish ghi outbox `SCHEDULE_PUBLISHED` cho cán bộ có ca thay đổi; lưu nháp chưa thông báo. Chưa nghiệm thu thông báo trên Azure bằng phiên thật trong lượt này.
- Danh sách ca chỉ xem theo cán bộ/tháng; chỉnh tại Sắp xếp lịch tháng. Schema history cho phép BASELINE có baseFingerprint rỗng theo migration; DRAFT/PUBLISHED yêu cầu hash 64 ký tự.

## Lịch làm việc, đơn nghỉ Word và đổi ca — 06/11/2026

- Đã nối 25 thao tác Workflow mới với UI Manager/Frontdesk, giữ 22 thao tác cũ; bảng 47 method/path → client/UI tại `FE_STAFFING_API_COVERAGE_2026-11-06.md`. Client mới: `src/lib/api/workSchedules.ts`, UI tại `src/components/staffing/`.
- Lịch mở mặc định ở bảng tháng 7 cột; hành vi lưu ngày nghỉ/khóa/công bố theo mục cập nhật phía trên. GET shifts bổ sung ca qua đêm ở ranh giới tháng để xem/chặn trùng, không đưa các ca ngoài tháng vào payload lưu. Tiện ích giờ tuần/sao chép/lịch sử thu gọn riêng; chỉ điền ngày trống chưa chỉnh, không điền ngày nghỉ/lễ chung hoặc nghỉ phép cả ngày. Frontdesk xác nhận fingerprint ca cá nhân và đề nghị đổi giờ theo điều kiện BE.
- Nghỉ cá nhân có Nháp của tôi/Đơn đã nộp. Mẫu chung đọc theo capability; Word mở bản riêng của draft. Lưu multipart, metadataVersion/revision/version đồng bộ; tạo và nộp có key UUID riêng, giữ key/body khi gửi lại. Khi Word bắt buộc không fallback `POST /leaves`. Đơn cũ không Word vẫn đọc theo hợp đồng.
- Manager đọc detail/version mới trước quyết định, xem Word đã nộp chỉ đọc và hash, tách ca ảnh hưởng khỏi hồ sơ đang giữ để bàn giao. Lỗi quyền/detail không mở các thao tác phụ. Duyệt nghỉ không tự chuyển hồ sơ.
- Query staffing tách theo user/phường/role/permission, luôn đọc lại khi mount; mutation không tự retry, 409 giữ nội dung và yêu cầu xem lại. Editor tái sử dụng lazy load, có nhãn/lỗi theo ngữ cảnh; modal Word dùng toàn viewport để tránh thanh công cụ bị che.
- Thông báo STAFFING hiện về SYSTEM_ALERT không có resourceId/actionUrl. Toast/bell vào danh sách lịch/nghỉ/đổi ca phù hợp, refresh cache staffing/workflow khi nhận; không gọi thêm API gửi thông báo từ FE.
- Kết quả kiểm tra và giới hạn nghiệm thu thật được ghi tại `PROGRESS.md`; mock DOCX không chứng minh cấu hình Blob/mẫu chung, quyền liên phường hoặc outbox Azure đã hoạt động.

## Analytics: hoàn thiện health/backups/delivery detail — 03/11/2026

- Đã gắn 29/29 thao tác nghiệp vụ trong Swagger Analytics vào luồng UI. Bảng method/path → màn hình ở `ANALYTICS_API_COVERAGE_2026-11-03.md`; GET `/` chỉ nhận diện service, không phải API nghiệp vụ.
- Admin có **Giám sát dịch vụ** và **Sao lưu dữ liệu** thay placeholder. API tại `src/lib/api/systemOperations.ts`, UI `ServiceHealthView.tsx`, `SystemBackupsView.tsx`, bộ lọc dùng RHF/Zod và Query/cache theo danh tính. Status 202 chỉ là xếp hàng; health đọc lại sau 3 giây, backup theo dõi Queued/Running tối đa 20 lần cách 3 giây, đóng modal/lỗi/trạng thái kết thúc thì dừng.
- Backup targets chưa có endpoint discovery: nhập mã dịch vụ theo cấu hình, không đồng nhất mã health (có thể procedure-catalog) với mã backup (có thể catalog). Server xác nhận target tồn tại; FE không đưa connection string vào form.
- Phát thông báo đã đọc GET detail mới nhất, audit có phân trang, gửi lại dùng revision mới đọc. Mặc định list là nhóm cần xử lý, không phải tất cả; trạng thái BE không có Failed. Replay chỉ Dead/Blocked, khác SMS, cần role IT_ADMIN + quyền read/manage, lý do 5–500 ký tự và xác nhận rủi ro gửi trùng. Mutation lỗi giữ nháp, cần đọc lại trước lần gửi mới.
- **Verify cập nhật 04/11/2026:** đã đọc bản sửa BE trên GitHub main (đã đọc lại BE local sau khi người dùng cập nhật, bốn file backup/Verify khớp blob SHA của bản GitHub): size/SHA-256 + pg_restore đọc archive, bỏ đường Verified khi không đọc file và managed snapshot giả dạng backup. FE dùng timeout 330 giây, kiểm tra metadata response, map lỗi mới và yêu cầu làm mới sau lỗi trước lần thử tiếp. Verified là xác minh tệp, không phải restore drill. Xem `BACKUP_VERIFY_COMPLETION_2026-11-04.md`; chưa nghiệm thu Azure/Blob/gateway thật. Không có API restore/download.
- Kiểm tra mới tại `tests/admin-system-operations.spec.ts`, `tests/admin-notification-deliveries.spec.ts`; proxy test 45 tuyến gồm 9 thao tác bổ sung. Chưa xác minh Azure/runner/Blob với tài khoản thật.

## Admin: cấu hình và audit tập trung TASK-34 — 03/11/2026

- Menu **Cấu hình hệ thống** đọc/sửa `analytics.lookbackDays` (số ngày tác vụ tổng hợp lại, 1–366); cần lý do trim 3–500 ký tự, PUT gửi `expectedVersion` từ chi tiết mới nhất. Xung đột 409 hoặc kết quả lưu không chắc chắn giữ nháp và khóa lưu đến khi người dùng đọc lại; không tự retry PUT, không tự tạo job thống kê.
- **Nhật ký hoạt động** có tab Nghiệp vụ toàn hệ thống, Thay đổi cấu hình và Phân quyền IAM. Hai tab mới và cấu hình chỉ dùng role `IT_ADMIN`; IAM giữ quyền `iam.audit.read`. Route Admin hiện có còn cho phép quyền IAM được ủy quyền, không suy rằng vào route là đủ quyền gọi Analytics.
- API/validation tại `src/lib/api/systemAdministration.ts`, hook Query tại `src/hooks/useSystemAdministration.ts`: đủ 7 method đọc/sửa cấu hình, danh sách/chi tiết audit. Query key có user ID, loại dữ liệu, bộ lọc/trang/ID; AbortSignal và không tự retry; dữ liệu và modal tách theo danh tính.
- Audit mới lọc/phân trang phía server; ngày chọn theo Việt Nam được chuyển UTC có Z, không áp giới hạn kỳ 366 ngày của thống kê sang audit. `action` không có query hỗ trợ và `payloadHash` không có trong response nên không dựng bộ lọc/cột đó. Actor/IP thiếu không được suy đoán; `[REDACTED]` là dữ liệu đã che tại nguồn.
- Client quản trị hiện đi qua prefix Gateway theo mục khắc phục 09/11 ở đầu tài liệu. Tuyến Vite `/api/v1/system` cũ vẫn có nhưng client không sử dụng; `vercel.json` hiện chưa cấu hình reverse proxy production.
- Kiểm thử mock tại `tests/admin-system-audit.spec.ts`, `tests/admin-system-settings.spec.ts`; proxy bằng `node tests/api-proxy-check.mjs`. Các test này không xác minh Azure, migrations, cờ quản trị hoặc relay thật. Chi tiết phạm vi/nghiệp vụ ở `ADMIN_SYSTEM_AUDIT_INTEGRATION_PLAN_2026-11-03.md`.

## Danh sách thủ tục trong Admin — 23/10/2026

- Admin dùng `AdminProceduresView` với `ProcedureApiList` không truyền `onSelect`/`onViewVersions`: chỉ danh sách, tìm kiếm, bộ lọc và phân trang; không cột thao tác, chi tiết, liên kết công khai hoặc lịch sử. Số bản lưu chỉ hiển thị tĩnh. Chỉ gọi danh mục và danh sách quản lý để vẫn xem được thủ tục ngừng công khai; không mount workspace quản lý hoặc đọc tham số bản nháp từ URL. Áp dụng cả tài khoản đa vai trò.
- Workspace Quản lý thủ tục độc lập vẫn dùng quyền hiện có; không thay đổi IAM/BE. Khi tái sử dụng workspace cho màn chỉ xem, phải truyền cờ xuống cả detail và versions modal, không chỉ ẩn nút ở danh sách.

## Analytics / phản hồi / job — 23/10/2026

- Manager mở `/manager` vào **Tổng quan** mặc định. Dashboard tại `ManagerOverviewView.tsx` đọc overview/trends/feedback summary với bộ lọc chung; từng khối tải và báo lỗi độc lập. UI hiện tập trung vào 4 biểu đồ (xu hướng, hoạt động, hạn xử lý, đánh giá), không còn các thẻ KPI lớn. Menu Thống kê hồ sơ vẫn giữ màn chi tiết. Biểu đồ/bảng dữ liệu dùng `AnalyticsTrendChart.tsx` và `OverviewCountChart.tsx`; dữ liệu rỗng không tạo tỷ lệ/hình giả.

- `VITE_ANALYTICS_API_URL` là origin Gateway hoặc AnalyticsSystem, không gồm đường dẫn Swagger. Khi dùng proxy, Vite ưu tiên `/api/v1/analytics` và `/api/v1/citizen/feedback` trước `/api` của IAM; production cần reverse proxy tương đương hoặc cấu hình gọi trực tiếp có CORS. `.env.example` đã có origin Gateway; local hiện tại đã thêm biến này mà không ghi đè các biến có sẵn.
- Client `src/lib/api/analytics.ts` kiểm tra request/response bằng Zod; Query ở `src/hooks/useAnalytics.ts` cách ly theo user. Manager đọc sáu API thống kê/phản hồi; Admin tạo/theo dõi job; công dân GET/POST đánh giá theo applicationId. Đánh giá dùng RHF/Controller, rating nguyên 1–5 và comment tối đa 2.000 ký tự; không gửi tiêu chí phụ mà BE chưa lưu.
- Rà soát bổ sung: GUID theo .NET; response có coverage/page phải khớp kỳ/trang yêu cầu, xu hướng đủ ngày, không trùng/ngoài kỳ. Manager có nút làm mới dữ liệu. Lỗi BE chỉ focus sau khi fieldset hết khóa hoặc modal xác nhận đã trả focus; tra job luôn đọc lại trạng thái khi quay lại. Xem bảng API → UI và giới hạn tại `ANALYTICS_API_AUDIT_2026-10-23.md`.
- Ngày thống kê là ngày Việt Nam, tối đa 366 ngày tính cả hai đầu. `coverage.missingDates` được hiển thị rõ và tạo khoảng trống biểu đồ, không biến thành số 0; tỷ lệ null là chưa đủ dữ liệu. 202 job chỉ là xếp lịch; không tự retry POST, dừng polling ở trạng thái kết thúc/lỗi/không xác định.
- Chi tiết phạm vi và giới hạn: `ANALYTICS_API_INTEGRATION_PLAN_2026-10-23.md`. Không gồm SignalR thông báo hoặc API nội bộ service. Không có endpoint lịch sử toàn bộ đánh giá công dân, sửa/xóa đánh giá, trả lời phản ánh, xuất Excel hoặc thống kê lượt tìm kiếm/khai thác biểu mẫu.

Setup ngày 06/10/2026. Giữ React/Vite/Tailwind, routing, Zustand và UI WardMate hiện có.

## Query

`src/app/QueryProvider.tsx` đã bọc App. `src/lib/queryClient.ts` đặt staleTime 30 giây, gcTime 5 phút; chỉ retry một lần cho lỗi Axios mạng/5xx, không retry mutation. Cache chỉ ở RAM và xóa khi đổi/mất danh tính. Focus/reconnect dùng cơ chế mặc định của TanStack Query cho trình duyệt.

Hook tại `src/hooks/useProcedureCategories.ts` gọi Catalog thật qua service/validation sẵn có và chuyển signal hủy request. Ba luồng Catalog công khai — Trang chủ, danh sách thủ tục và chi tiết thủ tục — đã dùng TanStack Query. Các trang quản lý thủ tục vẫn dùng `useProcedureQuery` cũ và chỉ chuyển sang Query khi sửa đúng màn hình đó, kèm kiểm thử.

```tsx
const { data = [], isPending, error, refetch } = useProcedureCategories();
```

Dùng `procedureError` từ `@/lib/api/procedures` để hiển thị lỗi tiếng Việt. Với query riêng tư: thêm user ID vào query key, chỉ enable khi xác thực; invalidate sau mutation thành công. Quyền và duyệt tiền kiểm vẫn do backend xác nhận.

## Form

React Hook Form, Zod và `@hookform/resolvers` đã tồn tại. Tiếp tục dùng schema và components tại `src/components/ui`; không thêm thư viện form thứ hai.

## shadcn

`components.json` trỏ tới Tailwind v4 tại `src/styles/globals.css`, alias `@/components/ui` và hàm `cn` hiện có. Đã thêm semantic color tokens đỏ/vàng WardMate cho component mới. Không chạy init ghi đè UI cũ.

Khi cần component mới: `npx shadcn@latest add <component>`. Kiểm tra component hiện có trước; Windows không phân biệt Button.tsx và button.tsx nên không ghi đè Button/Input/Card/Modal. Các component mới cần rà soát dependency, touch target, tiếng Việt, keyboard và animation theo chuẩn UI/UX. Chưa nhập nguyên bộ component hoặc template dashboard.

## Lệnh

- Chạy: `npm run dev`.
- Kiểm tra: `npm run typecheck`, `npm run lint`, `npm run build`.
- Kiểm tra core: `npx playwright test tests/jwt-client.spec.ts tests/design-system.spec.ts tests/landing.spec.ts`.

Nguồn cấu hình: https://ui.shadcn.com/docs/components-json.

## DocumentForm và proxy — cập nhật 16/10/2026

### Hợp đồng cán bộ mới — 17/10/2026

- Người dùng chọn hợp đồng BE local mới nhất: POST `officer/submissions/{submissionId}/confirm-readiness`, trạng thái đơn `ReadyForDownload`, trạng thái Workflow `DOCUMENTS_READY`. Không gọi `/approve`; `Approved`/`APPROVED` chỉ là dữ liệu lịch sử và không mở PDF/QR.
- Workspace cán bộ lấy danh sách đơn bằng `by-application`, chọn một đơn có liên kết hợp lệ để gửi `request-revision` (`{comment}`) hoặc `confirm-readiness` (`{}`). BE lấy officer từ JWT; không cần gửi `officerId`. Mỗi thao tác chỉ gọi một endpoint quyết định, tác động toàn hồ sơ. Chỉ khi discovery thành công và trả danh sách rỗng mới dùng endpoint Workflow tương ứng theo applicationId.
- Quyền ghi: cán bộ được phân công, đúng phường, không xử lý hồ sơ của chính mình, Workflow đang `UNDER_REVIEW`. Annotate còn yêu cầu đơn `Submitted`/`RevisionRequested`. Backend xác minh quyền/phạm vi và bằng chứng tệp; FE không thay thế kiểm tra này.
- Mutations làm mất hiệu lực cache Workflow/DocumentForm sau cả thành công lẫn lỗi, vì dịch vụ có thể đã lưu trạng thái trước khi lỗi đồng bộ/timeout. Trước quyết định đọc lại hồ sơ, đơn và nhận xét; lỗi giữ lý do và modal. Annotate lỗi giữ file trong RAM để thử lại. Không tự retry mutation.
- PDF/QR chỉ mở cho hồ sơ `DOCUMENTS_READY`; tạo PDF từ đơn `ReadyForDownload`. Route `approved-qr` vẫn giữ theo BE để tương thích, không đổi sang route tự đặt. Comment Word vẫn thêm/đọc đầy đủ qua Word rồi tải lại theo quyết định dùng editor miễn phí.
- Giới hạn BE: queue chỉ trả `SUBMITTED`/`UNDER_REVIEW`, chưa có API danh sách đầy đủ cho các mục cần bổ sung/sẵn sàng/lịch sử. Giữ cảnh báo nguồn dữ liệu tại workspace. Swagger Azure chưa truy cập được trong phiên đối chiếu; chưa xác minh hợp đồng này đã deploy.

### Rà soát lỗi và validation — 17/10/2026

- Chặn quyết định khi có nhận xét chưa lưu; có thao tác xóa nội dung nháp, không xóa nhận xét đã lưu. Hộp thoại giữ phiên bản tại lúc mở; nếu phiên bản/quyền thay đổi phải đóng và kiểm tra lại. Đơn biến mất khi refetch không được chuyển ngầm sang Workflow. Bản khai chọn phải khớp hồ sơ, người nộp, checklist và mẫu đơn.
- Kiểm tra response quyết định `{submissionId,message}` bằng Zod và đối chiếu ID; không báo thành công khi response 200 sai cấu trúc/sai bản khai. Response contents/detail/danh sách đơn cũng phải khớp hồ sơ được yêu cầu. Lý do trim, không trống, tối đa 4.000 ký tự; tên hiển thị nhận xét tối đa 255 ký tự theo BE; lỗi lý do/chọn bản khai đưa focus về trường cần sửa.
- Annotate kiểm tra file ở cả UI và API client; chọn file lỗi xóa thông báo thành công và file thử lại cũ. Sau cả thành công/lỗi, invalidate dữ liệu hồ sơ, tài liệu và preview binary để tránh bản xem trước cũ khi server đã lưu trước khi lỗi/timeout. Các mutation quyết định chờ cache invalidation hoàn tất.
- Tiếp nhận tại quầy chưa có API: khóa nút xác nhận, không cấp biên nhận/ngày hẹn giả, không chuyển sang “Đã tiếp nhận” chỉ bằng state cục bộ. Chỉ hiển thị số biên nhận/ngày hẹn từ dữ liệu thật nếu có. Thời điểm xác nhận sẵn sàng dùng `documentsReadyAt`, không suy từ ngày cập nhật hoặc ngày gửi.

Các ghi chú `APPROVED` và `/approve` trong phần bàn giao ngày 16/10 bên dưới là trạng thái trước thay đổi này.

- Client tài liệu tại `src/lib/api/documentForms.ts`, Query hooks tại `src/hooks/useDocumentForms.ts`; query riêng tư có danh tính và applicationId. DOCX hiện dùng tải/sửa bằng Word/upload, `DocxPreview` chỉ để xem và không bảo đảm hiển thị Word comments.
- Khi `VITE_USE_API_PROXY=true`, browser gọi cùng origin. Vite dùng `VITE_API_BASE_URL`, `VITE_CATALOG_API_URL`, `VITE_WORKFLOW_API_URL`, `VITE_DOCUMENT_FORM_API_URL` làm target; hosting production cần cấu hình reverse proxy tương đương. Biến VITE là cấu hình công khai, không chứa token.
- Các đường dẫn DocumentForm phải ưu tiên trước prefix Workflow `/api/v1/applications`: `contents`, `supporting-documents`, `generate-pdf`, `generated-documents` (kể cả query submissionId), `approved-qr`, `approved-qr/image`; thêm các prefix `form-templates`, `citizen/submissions`, `officer/submissions`, `supporting-documents`, `generated-documents`. Các route hồ sơ/thụ lý còn lại đi Workflow. Không dùng SPA fallback trả index.html cho API.
- Kiểm tra routing Vite thực tế bằng `node tests/api-proxy-check.mjs`: script tự dựng target HTTP cục bộ, không gọi Azure, kiểm tra 12 route và giữ nguyên query.
- Playwright cấu hình cả bốn service về localhost mock, tắt runtime proxy trong browser tests để không lấy target từ env cá nhân. Kiểm thử browser mock không thay thế script routing hoặc kiểm thử phân quyền/Blob/Gotenberg thật.
- QR yêu cầu hồ sơ APPROVED nhưng vẫn có thể chưa được tạo; FE chỉ hiển thị PNG server trả về. Việc cấp QR ngay sau duyệt và tra cứu công khai/đúng version vẫn cần hợp đồng BE; không coi QR là giấy hẹn hay tiếp nhận chính thức.

## Soạn DOCX online — 16/10/2026

- `src/components/documents/DocxOnlineEditor.tsx` lazy load engine `@docx-editor.dev/react/core/fonts` 2.31.0 (Apache-2.0), chỉ tải khi mở editor. Công dân mở từ checklist hoặc mục Bản khai của tôi; cán bộ mở từ panel tài liệu. Save xuất DOCX thật rồi gọi API có sẵn; không có editor server hay API chuyển đổi tự đặt.
- Vite `build.target` và `optimizeDeps.esbuildOptions.target` là ES2022 vì font shaping dùng top-level await/WASM. Hosting cần phục vụ assets/font/WASM đúng MIME; browser mục tiêu là trình duyệt hiện đại, hiện QA bằng Edge.
- Font thay thế Word được đóng gói cùng frontend, không bật Google Fonts/telemetry/collaboration hay gửi file sang website tham chiếu. Bundle editor lớn hơn 500 kB; giữ lazy import tại điểm mở.
- Theo lựa chọn người dùng, dùng bản miễn phí: thêm và đọc đầy đủ comment Word qua Word rồi upload lại. Không cài gói Pro. Review content vẫn cần đối chiếu Word; không cam kết mọi mẫu giữ layout tuyệt đối.
- API audit: `docs/DOCUMENT_FORM_API_AUDIT_2026-10-16.md`; tests editor: `tests/docx-online.spec.ts`, dùng DOCX ZIP/XML thực và API mock.
