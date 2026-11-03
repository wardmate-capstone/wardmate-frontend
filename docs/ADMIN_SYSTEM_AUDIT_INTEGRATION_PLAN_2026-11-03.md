# Kế hoạch TASK-34: Cấu hình hệ thống và nhật ký kiểm toán Admin

Ngày: 03/11/2026 (Asia/Saigon). Trạng thái: đã triển khai UI và 7 method API TASK-34; kiểm thử mock và proxy đã đạt. Chưa xác minh nghiệp vụ bằng phiên IT_ADMIN thật trên Azure. Kết quả kiểm tra cuối cùng xem `PROGRESS.md`.

## 1. Phạm vi đã thống nhất

Người dùng chọn **TASK-34: audit tập trung + cấu hình và nhật ký cấu hình** trong phiên 03/11/2026.

Mục tiêu là giúp quản trị viên biết dữ liệu nào đã thay đổi, ai thực hiện nếu nguồn có danh tính, thay đổi lúc nào; đồng thời điều chỉnh số ngày tổng hợp thống kê và tra cứu lịch sử thay đổi tham số đó.

Bao gồm:

1. Nhật ký nghiệp vụ tập trung của các dịch vụ.
2. Xem và sửa cấu hình `analytics.lookbackDays`.
3. Danh sách và chi tiết nhật ký thay đổi cấu hình.
4. Gắn API, định tuyến proxy, validation, trạng thái lỗi, phân quyền và kiểm thử liên quan.
5. Giữ luồng nhật ký phân quyền IAM đang có; làm rõ nguồn dữ liệu để không nhầm với audit toàn hệ thống.

Không bao gồm: giám sát dịch vụ, sao lưu/xác minh/khôi phục database (TASK-35); tối ưu database, vector index và import Postman (TASK-36). Tài liệu BE đính kèm là nguồn để đối chiếu hợp đồng, không tự mở rộng yêu cầu sang tất cả tab mà tài liệu đề xuất.

## 2. Nguồn đã đối chiếu và mức xác minh

| Nguồn | Kết quả |
|---|---|
| `e:/Zalo Data/fe-handoff-task34-35-36-management-portal.md` | Đã đọc, phát hành 03/11/2026, tham chiếu BE `1c44510`; có một số mô tả khác source/Swagger |
| Source BE tại `E:/wardmate-backend` | Đã đọc controller, DTO, service, quyền, luồng tổng hợp và cấu hình Gateway; không thay đổi BE |
| [Swagger Analytics](https://wardmate-analytics-system.blackmeadow-a2f12767.japaneast.azurecontainerapps.io/swagger/index.html) và `/swagger/v1/swagger.json` | Đã tải đặc tả công khai trong phiên; xác nhận 7 thao tác TASK-34 bên dưới có trong Swagger đang chạy |
| FE `docs/PROGRESS.md`, `UI_UX_DESIGN_STANDARD.md`, `docs/FRONTEND_SETUP.md`, `docs/design-system-and-auth.md` | Đã đối chiếu với code; không dùng kết quả test cũ như kết quả phiên này |
| Git FE | `main`, HEAD `142a6fd`, working tree sạch trước khi lập tài liệu; thông tin local cho thấy sau `origin/main` 3 commit, chưa fetch/pull nên chưa kết luận trạng thái remote mới nhất |

Đọc Swagger thành công **không chứng minh** các API quản trị đã bật, migrations/relay đã rollout, quyền/CORS hoạt động hay dữ liệu thật đã được thu thập. Phiên lập kế hoạch chưa đăng nhập hoặc gọi nghiệp vụ bằng tài khoản thật.

Các file BE chính, tính từ `src/Services/WardMate.Services.AnalyticsSystem/`:

- `WardMate.Services.AnalyticsSystem.API/Controllers/SystemAdministrationController.cs`.
- `WardMate.Services.AnalyticsSystem.API/Controllers/BusinessAuditController.cs`.
- `WardMate.Services.AnalyticsSystem.API/AnalyticsAccess.cs`.
- `WardMate.Services.AnalyticsSystem.Application/SystemAdministration.cs`, `BusinessAuditContracts.cs`, `AnalyticsContracts.cs`.
- `WardMate.Services.AnalyticsSystem.Infrastructure/SystemAdministration.cs`, `BusinessAuditStore.cs`, `AnalyticsAggregationJob.cs`.
- Thêm `E:/wardmate-backend/docs/task34-system-audit-plan.md`, `src/BuildingBlocks/WardMate.Auditing/SourceAudit.sql` và cấu hình `src/Gateways/WardMate.YarpGateway/appsettings*.json` để hiểu thu thập, che dữ liệu và định tuyến.

## 3. Nghiệp vụ: ba loại nhật ký khác nhau

| Loại | Dùng để trả lời | Nguồn | Cách hiển thị |
|---|---|---|---|
| Nhật ký phân quyền IAM hiện có | Ai gán/gỡ vai trò, thay đổi quyền? | `/api/v1/rbac/audit-logs` | Giữ component và dữ liệu hiện tại, đặt trong tab “Phân quyền” |
| Nhật ký thay đổi cấu hình | Ai đổi số ngày tổng hợp, từ bao nhiêu sang bao nhiêu, vì sao? | `/api/v1/system/audit-logs` | Tab “Thay đổi cấu hình”, có trước/sau, phiên bản và lý do |
| Nhật ký nghiệp vụ tập trung | Dữ liệu của dịch vụ nào được thêm/sửa/xóa, thực thể nào thay đổi? | `/api/v1/system/audit-events` | Tab “Nghiệp vụ toàn hệ thống”, có bộ lọc phía server và chi tiết trước/sau |

Luồng audit nghiệp vụ:

```text
Thay đổi dữ liệu tại dịch vụ nguồn
  → trigger ghi sự kiện cùng giao dịch vào outbox tại database nguồn
  → relay chuyển sự kiện đã che dữ liệu sang Analytics
  → Analytics lưu sự kiện
  → Admin tra cứu danh sách và chi tiết qua API đọc
```

- Đây là nhật ký thay đổi dữ liệu đã commit, không phải danh sách mọi lượt truy cập, request GET hoặc đăng nhập thất bại.
- Dữ liệu có thể đến chậm do relay; không hứa cập nhật tức thì và không kết luận mất sự kiện chỉ vì vừa thao tác chưa thấy.
- Không có bảo đảm backfill dữ liệu trước rollout trigger.
- `actorId = null` nghĩa là nguồn không cung cấp danh tính; hiển thị “Không có thông tin người thực hiện”, không gán cho chủ hồ sơ hay người đang đăng nhập.
- `before`/`after` đã che các trường nhạy cảm bằng `[REDACTED]`; UI giải thích “Đã ẩn dữ liệu nhạy cảm”. Đây không phải bản sao nội dung đầy đủ để khôi phục tài liệu.
- Audit là dữ liệu chỉ đọc. Không có nút thêm, sửa, xóa nhật ký hoặc gửi sự kiện từ browser vào collector nội bộ.

Luồng cấu hình:

```text
Admin xem cấu hình → mở chi tiết mới nhất → nhập giá trị và lý do
  → PUT với expectedVersion tại lúc mở form
  → BE kiểm tra quyền và phiên bản
  → lưu cấu hình + nhật ký cấu hình trong cùng giao dịch
  → FE tải lại cấu hình và nhật ký
```

`analytics.lookbackDays` là **số ngày mà tác vụ tổng hợp thống kê định kỳ đọc lại**, tính cả ngày hiện tại theo ngày Việt Nam. Ví dụ giá trị 14 thì lần tổng hợp tiếp theo đọc 14 ngày đến hôm nay. Nó không phải số ngày lưu audit, thời hạn giữ hồ sơ, hoặc tự động yêu cầu chạy tổng hợp ngay. Source `AnalyticsAggregationJob.Refresh` đã đọc cấu hình DB khi quản trị hệ thống bật; không cần restart để tác vụ sau nhận giá trị mới. Nút tạo job thống kê hiện có là nghiệp vụ riêng, không tự gọi sau mỗi lần sửa cấu hình.

## 4. FE đang có gì và còn thiếu gì

| Vị trí | Hiện trạng đã đọc | Thay đổi dự kiến |
|---|---|---|
| `src/pages/admin/AdminPage.tsx` | Có mục `audit` → `AdminRbacAuditView`; chưa có mục cấu hình hệ thống | Bổ sung mục cấu hình và vùng nhật ký có tab; dùng quyền role IT_ADMIN cho API mới |
| `src/pages/admin/AdminRbacViews.tsx` | Nhật ký IAM có bảng, modal; bộ lọc chỉ lọc các dòng của trang đang tải | Giữ nghiệp vụ IAM; bổ sung mô tả phạm vi lọc tại trang nếu cần, không giả làm tìm kiếm toàn bộ nhật ký |
| Tổng quan Admin | “Hoạt động gần đây” gọi `rbacApi.audit(1, 5)` | Ghi rõ “Phân quyền gần đây”, liên kết mở đúng tab Phân quyền |
| `src/lib/api/rbac.ts` | Adapter và schema IAM đã có | Không dùng DTO IAM để parse dữ liệu Analytics |
| `src/lib/api/serviceUrls.ts` và `src/lib/api/index.ts` | Có analytics URL, HTTP client và refresh JWT dùng chung | Tái sử dụng, không tạo hệ thống token hoặc interceptor auth mới |
| `vite.config.ts` | Có proxy Analytics, chưa có `/api/v1/system` trước fallback `/api` về IAM | Thêm prefix vào target Analytics, kiểm thử route danh sách/chi tiết/PUT |
| `src/pages/admin/AdminPage.tsx`: integrations/backup | Đang là giao diện chờ | Ngoài phạm vi TASK-34, không báo đã tích hợp |
| `vercel.json` | Chỉ có SPA rewrite về `index.html` | Ghi rõ yêu cầu reverse proxy production; chưa tự sửa deployment khi chưa biết nơi host FE thực tế |

Gateway BE local đã có `/api/v1/system/{**catch-all}` tới `analytics-system` trong cấu hình mặc định và Production. Vite local vẫn cần prefix riêng nếu fallback IAM dùng target khác Gateway.

## 5. Bản đồ toàn bộ API TASK-34 → UI

Các đường dẫn dưới đây đi qua `servicePath(serviceUrls.analytics, path)` và client `api` dùng chung. Ưu tiên Gateway theo cấu hình môi trường hiện có, không hardcode Azure URL trong component.

| # | API / kết quả | Dùng khi nào, gắn ở đâu | Dữ liệu / hành vi |
|---|---|---|---|
| 1 | `GET /api/v1/system/settings` → 200, mảng | Vào mục “Cấu hình hệ thống”, bấm Làm mới | Key, value, version, updatedBy, updatedAtUtc; hiện có một key |
| 2 | `GET /api/v1/system/settings/{key}` → 200 | Bấm Chỉnh sửa, đọc bản mới nhất trước khi tạo form | Khóa key cố định; giữ `version` làm snapshot cho lần lưu |
| 3 | `PUT /api/v1/system/settings/{key}` → 200 | Submit modal cấu hình | Body `{ value, expectedVersion, reason }`; thành công tải lại cấu hình và lịch sử |
| 4 | `GET /api/v1/system/audit-logs` → 200, trang | Tab “Thay đổi cấu hình”, bộ lọc và phân trang | Query `from`, `to`, `page`, `pageSize` |
| 5 | `GET /api/v1/system/audit-logs/{id}` → 200 | Bấm Xem chi tiết nhật ký cấu hình | Lấy bản ghi thật theo ID, không bỏ sót endpoint này |
| 6 | `GET /api/v1/system/audit-events` → 200, trang | Tab “Nghiệp vụ toàn hệ thống”, bộ lọc và phân trang | Query `from`, `to`, `source`, `entity`, `actorId`, `traceId`, `page`, `pageSize` |
| 7 | `GET /api/v1/system/audit-events/{id}` → 200 | Bấm Xem chi tiết sự kiện | Response `BusinessAuditMessage`; đối chiếu `eventId` đúng dòng chọn |

Response trang là `{ items, page, pageSize, totalCount, coverage?, unassignedDeadlines? }`; hai trường cuối thuộc DTO dùng chung và có thể null, không bắt buộc dữ liệu coverage như màn thống kê.

DTO nghiệp vụ: `eventId`, `source`, `schema`, `entity`, `entityKey` (JSON), `action`, `before` (JSON), `after` (JSON), `actorId?`, `clientIp?`, `traceId?`, `occurredAtUtc`.

DTO nhật ký cấu hình: `id`, `actorId`, `action`, `entityKey`, `previousValue?`, `newValue`, `version`, `reason`, `clientIp?`, `traceId`, `occurredAtUtc`.

## 6. Thiết kế UI/UX dự kiến

### 6.1 Điều hướng

Trong nhóm “Vận hành hệ thống” của cổng Admin:

```text
Cấu hình hệ thống
  Danh sách tham số → Chỉnh sửa → Giá trị mới + lý do → Lưu
  Liên kết “Xem lịch sử thay đổi” → tab Thay đổi cấu hình

Nhật ký hoạt động
  [Nghiệp vụ toàn hệ thống] [Thay đổi cấu hình] [Phân quyền]
```

Tái sử dụng shell Admin, màu sắc và component sẵn có. Không dựng portal hoặc hệ thống route mới riêng. Luồng từ tổng quan hoặc cấu hình phải mở đúng tab, không chỉ đưa về tab mặc định.

### 6.2 Nhật ký nghiệp vụ tập trung

- Đầu trang giải thích: “Theo dõi các thay đổi dữ liệu do các dịch vụ gửi về hệ thống.”
- Bộ lọc chính: Nguồn phát sinh, Thực thể, Từ ngày, Đến ngày; nút “Áp dụng”, “Xóa bộ lọc”, “Làm mới”.
- Bộ lọc mở rộng: Mã người thực hiện (`actorId`), Mã tra cứu (`traceId`). Nguồn dùng các giá trị `iam`, `catalog`, `workflow`, `documentform`, `aiocr`, `analytics`, `notifications` với nhãn tiếng Việt.
- Không có dropdown lọc hành động ở bản đầu vì BE không nhận query đó. Cột vẫn dịch `INSERT` → “Thêm mới”, `UPDATE` → “Cập nhật”, `DELETE` → “Xóa”.
- Bảng: Thời điểm, Nguồn, Thực thể, Hành động, Người thực hiện, nút Chi tiết. ID dài đặt trong chi tiết hoặc rút gọn kèm cách xem/copy đầy đủ.
- Bộ lọc áp dụng trên server trước phân trang; không lọc riêng trang rồi thông báo đó là toàn bộ kết quả.
- Chi tiết dùng Modal Radix chung: thông tin định danh, entityKey, actor/IP/trace nếu có, khối trước/sau và dữ liệu JSON được API trả về. Desktop có thể chia hai cột, mobile xếp dọc.
- Hiển thị JSON bằng nội dung văn bản, không render HTML từ dữ liệu. Có nút “Sao chép dữ liệu” và xử lý clipboard thất bại. Không tự lưu payload vào localStorage hoặc log trình duyệt.
- Không hiển thị hoặc tự tính `payloadHash` để đóng vai bằng chứng toàn vẹn vì API không trả trường đó.

### 6.3 Cấu hình hệ thống

- Một bảng tham số với nhãn “Số ngày tổng hợp lại thống kê”, key kỹ thuật làm thông tin phụ.
- Hiển thị giá trị (ngày), phiên bản, người cập nhật và thời điểm cập nhật. `updatedBy/updatedAtUtc = null` cùng version 0 thể hiện đang dùng giá trị mặc định, không tự gán người hoặc ngày cập nhật.
- “Chỉnh sửa” tải chi tiết trước; chỉ mở form có thể lưu khi đã lấy được bản hợp lệ.
- Modal có giá trị hiện tại, ô số ngày mới, lý do bắt buộc, trợ giúp giới hạn và nút Hủy/Lưu thay đổi. `expectedVersion` không cho người dùng sửa.
- Trong khi gửi khóa gửi trùng. Lỗi giữ dữ liệu người dùng đã nhập.
- Thành công hiển thị giá trị BE trả về, thông báo đã lưu, làm mới cache cấu hình và nhật ký cấu hình; vô hiệu hóa cache audit nghiệp vụ liên quan nhưng không khẳng định relay đã chuyển sự kiện xong.
- `409 system.setting_conflict`: báo có phiên bản mới, khóa việc lưu bằng snapshot cũ, có nút đọc lại. Giữ lý do/giá trị nháp để đối chiếu; sau khi đọc lại phải để người dùng chủ động xác nhận lần lưu mới, không tự gửi lại.
- Nếu timeout/mất mạng sau PUT, có thể BE đã lưu: đọc lại cấu hình/lịch sử, không tự retry mutation hay tự gắn version mới cho dữ liệu nháp.

### 6.4 Nhật ký thay đổi cấu hình

- Bộ lọc khoảng ngày, phân trang thật theo server; bỏ trống ngày để xem mọi thời điểm mà server đang giữ.
- Bảng: thời điểm, tham số, giá trị cũ → mới, phiên bản, người thực hiện, lý do và Chi tiết.
- Modal chi tiết đọc API #5 để hiển thị đầy đủ cả ID, IP và mã tra cứu nếu có.
- IP không được API trả thì ghi “Không có thông tin”; không suy từ IP máy đang mở trình duyệt.

### 6.5 Trạng thái chung và khả năng truy cập

- Có loading ban đầu, đang làm mới, dữ liệu rỗng, bộ lọc không có kết quả, lỗi và nút thử lại; lỗi không được biến thành bảng rỗng thành công.
- 403 hiển thị không đủ quyền, không thử refresh lặp lại; 503 chức năng chưa bật có thông điệp riêng.
- Khi làm mới thất bại mà còn dữ liệu cũ, ghi rõ chưa cập nhật được, không thông báo đó là dữ liệu vừa tải thành công.
- Form có label, lỗi tại trường, focus vào trường lỗi; modal có mô tả, focus trap, Escape và trả focus. Tab có hỗ trợ bàn phím; nút icon có accessible name.
- Mobile dùng vùng cuộn bảng nằm trong component, modal cuộn nội dung; JSON dài không làm tràn toàn trang. Thời gian format `dd/MM/yyyy HH:mm:ss` theo `Asia/Ho_Chi_Minh`.

## 7. Validation và hợp đồng lỗi

| Hạng mục | Quy tắc FE cần triển khai |
|---|---|
| Giá trị cấu hình | Số nguyên 1–366, không nhận rỗng thành 0, NaN, số thập phân hoặc giá trị ngoài miền |
| Phiên bản | Số nguyên không âm lấy từ response; kiểm tra số nguyên an toàn của JavaScript vì BE dùng int64; không sửa tay |
| Lý do | Trim trước validate/gửi; 3–500 ký tự, có bộ đếm; không chấp nhận chỉ có khoảng trắng |
| Key cấu hình | Chỉ sửa `analytics.lookbackDays`; không tạo form quản lý key tùy ý |
| Phân trang | `page` 1–100000, `pageSize` 1–100, mặc định 1/20; đổi bộ lọc/pageSize trở về trang 1 |
| Khoảng ngày | Ngày hợp lệ, from ≤ to; cho phép bỏ một hoặc cả hai đầu; không áp giới hạn 366 ngày của báo cáo sang audit vì BE không quy định |
| Múi giờ query | Ngày người dùng chọn là ngày Việt Nam: đầu ngày +07:00 và cuối ngày +07:00, chuyển ISO UTC có `Z` trước gửi; BE dùng so sánh bao gồm hai đầu |
| Source | Đúng 7 giá trị BE chấp nhận; “Tất cả” bỏ query, không gửi `ALL` hoặc chuỗi rỗng |
| Entity | Trim, tối đa 100 ký tự; lọc khớp chính xác theo BE, không quảng cáo tìm gần đúng; để trống bỏ query |
| Actor | GUID đúng hợp đồng .NET; để trống bỏ query, không gửi chuỗi bất kỳ |
| Trace | Trim, tối đa 128 ký tự; khớp chính xác; để trống bỏ query |
| ID chi tiết | GUID hợp lệ; response phải khớp ID yêu cầu (`eventId` cho nghiệp vụ, `id` cho cấu hình) |
| Response | Zod kiểm tra cấu trúc, kiểu/nullable, timestamp, trang và số đếm; lỗi cấu trúc hiển thị lỗi đọc dữ liệu, không ép thành thành công |

Tách schema form và schema request để tránh input số rỗng bị coercion sai. Sử dụng React Hook Form + Zod, không thêm thư viện form.

Các lỗi cần ánh xạ tiếng Việt:

- `system.invalid_setting`: giá trị, lý do hoặc phiên bản không hợp lệ.
- `system.setting_conflict`: cấu hình đã có phiên bản khác; đọc lại và người dùng quyết định lưu lại.
- `system.setting_not_found`, `system.audit_not_found`, `audit.not_found`: đối tượng không còn khả dụng hoặc không tồn tại; không hiển thị dữ liệu chi tiết cũ cho ID mới.
- `system.invalid_query`, `audit.invalid_query`: kiểm tra các điều kiện lọc.
- `system.administration_disabled`: quản trị hệ thống chưa được bật phía máy chủ; không coi là không có nhật ký.
- `analytics.forbidden`: không đủ quyền IT_ADMIN.
- `analytics.iam_unavailable`: chưa thể xác minh quyền từ IAM; có thể thử lại.
- ProblemDetails có thể có `code`, `title`, `traceId` và validation `errors`; hiển thị lỗi trường khi ánh xạ được, có lỗi chung dự phòng khi không ánh xạ được.

401 đi qua client refresh hiện có; chỉ đưa về `/dang-nhap` với returnTo an toàn khi phiên thật sự không còn hợp lệ. Không làm theo cách giản lược trong bàn giao là chuyển login ngay ở mọi 401.

## 8. Kế hoạch sửa/thêm file theo thứ tự

Tên file mới dưới đây là dự kiến; kiểm tra code mới nhất trước khi tạo để tránh trùng chức năng.

| Bước | File | Công việc và đầu ra |
|---|---|---|
| 1 | `src/lib/api/systemAdministration.ts` (mới) | Schema request/response, 7 method API TASK-34, phân loại lỗi và adapter ngày UTC; dùng client/serviceUrls chung |
| 2 | `src/hooks/useSystemAdministration.ts` (mới) | Query settings/detail/config audits/business events; query key có user ID + loại dữ liệu + bộ lọc/trang/ID; AbortSignal, retry phù hợp, mutation không tự retry, invalidation sau lưu |
| 3 | `vite.config.ts`, `tests/api-proxy-check.mjs` | Proxy `/api/v1/system` tới Analytics trước IAM; kiểm tra path/query/method không bị đổi hoặc rơi vào SPA |
| 4 | `src/pages/admin/SystemSettingsView.tsx` (mới) | Bảng cấu hình và modal sửa dùng RHF/Zod, xử lý version/conflict/timeout |
| 5 | `src/pages/admin/SystemAuditLogsView.tsx` (mới) | Form lọc ngày, bảng/phân trang và modal đọc chi tiết nhật ký cấu hình |
| 6 | `src/pages/admin/BusinessAuditEventsView.tsx` (mới) | Lọc server, bảng/phân trang, chi tiết trước/sau và copy JSON |
| 7 | `src/pages/admin/AdminAuditView.tsx` (mới), `AdminPage.tsx`, `AdminRbacViews.tsx` | Gắn tab, menu cấu hình, quyền IT_ADMIN và liên kết mở đúng tab; giữ IAM, chú thích giới hạn bộ lọc cũ trong trang |
| 8 | `tests/fixtures/systemAdministration.ts`, `tests/admin-system-audit.spec.ts`, `tests/admin-system-settings.spec.ts` (mới) | Mock đúng hợp đồng và test các luồng đọc/lưu/lỗi/validation/quyền/race/mobile quan trọng |
| 9 | `tests/admin-rbac.spec.ts`, `tests/admin-provisioning.spec.ts` nếu bị ảnh hưởng điều hướng | Điều chỉnh đường vào tab IAM, giữ các assertion dữ liệu/quyền đang có |
| 10 | `docs/FRONTEND_SETUP.md`, `docs/PROGRESS.md`, tài liệu kế hoạch này | Ghi hợp đồng đã gắn, cấu hình proxy, kết quả kiểm tra thực chạy và việc còn chờ |

Cache riêng tư chỉ ở RAM, dùng chính sách xóa khi đổi/mất danh tính hiện có. Chỉ enable các query mới khi có user và role IT_ADMIN; quyền `iam.audit.read` của tab IAM không dùng thay role cho Analytics. Không tải tất cả dữ liệu quản trị ngay khi vừa vào Admin nếu người dùng chưa mở màn hình liên quan.

Không cần sửa auth core, backend, dependency hoặc route cấp ứng dụng cho phạm vi này. Nếu phải thay ngoài dự kiến do code mới hoặc lỗi phát hiện, cập nhật kế hoạch và giải thích tác động trước.

## 9. Kế hoạch kiểm tra và tiêu chí hoàn thành

### 9.1 Ma trận kiểm tra bằng mock

1. Danh sách audit tập trung/nhật ký cấu hình gọi đúng API, query, trang và pageSize; đổi bộ lọc reset trang; kiểm tra trang thứ hai để tránh chỉ lọc cục bộ.
2. Không gửi `action` hoặc mong có `payloadHash`; có bộ lọc actor/trace thực sự được gửi và giới hạn độ dài đúng.
3. Chi tiết gọi đúng endpoint/ID, lỗi 404 không giữ chi tiết dòng trước; đổi nhanh dòng hoặc đóng modal không để response cũ thay dữ liệu mới.
4. Chuyển ngày Việt Nam sang UTC đúng hai biên; ngày đảo hoặc không hợp lệ không gọi API; bỏ trống không gửi ngày giả.
5. Trường null, `[REDACTED]`, before/after rỗng, dữ liệu dài và JSON có ký tự HTML hiển thị an toàn và dễ đọc.
6. Cấu hình mặc định version 0, mở form đọc chi tiết, lưu 1/366 hợp lệ; chặn rỗng, 0, 367, thập phân, lý do toàn khoảng trắng hoặc sai độ dài.
7. PUT gửi chính xác snapshot expectedVersion; thành công tải lại cấu hình/lịch sử. 409 không retry hoặc ghi đè; lỗi mạng sau lưu không báo thất bại chắc chắn và không gửi trùng tự động.
8. 401/403/503, timeout, response sai cấu trúc và sai ID có trạng thái đúng; query lỗi không bị coi là danh sách rỗng.
9. User khác/đăng xuất không thấy dữ liệu cache của phiên cũ; role không đủ không gọi API mới.
10. Điều hướng từ tổng quan tới tab IAM và từ cấu hình tới lịch sử đúng; các luồng IAM cũ không bị thay dữ liệu Analytics.
11. Bàn phím, focus modal, label/lỗi form và layout khoảng 375px; thông báo copy thành công/thất bại.

### 9.2 Lệnh kiểm tra khi triển khai

- `npm run typecheck`.
- `npm run lint`.
- `npm run build`.
- `node tests/api-proxy-check.mjs` (routing bằng HTTP local, không xác minh Azure).
- `npx playwright test tests/admin-system-audit.spec.ts tests/admin-system-settings.spec.ts tests/admin-rbac.spec.ts tests/admin-provisioning.spec.ts`.
- Nếu thực tế phải sửa auth/core: thêm `tests/jwt-client.spec.ts`, `tests/design-system.spec.ts`, `tests/landing.spec.ts` theo hướng dẫn dự án.

Playwright hiện dùng Edge, Vite cổng 4317; đọc lại config lúc chạy. Chỉ báo test đạt sau khi có kết quả mới.

### 9.3 Xác minh môi trường thật (cần ở giai đoạn tích hợp)

- Xác nhận URL Gateway/hosting FE và routing `/api/v1/system` đúng, không trả HTML; IAM xác minh đúng role IT_ADMIN.
- BE xác nhận migrations + `SystemAdministration:Enabled` và relay những nguồn cần nghiệm thu đã bật. File appsettings mặc định đang false không cho biết giá trị Azure runtime.
- Dùng tài khoản/phiên kiểm thử do người dùng cung cấp hoặc tự đăng nhập; không ghi token/mật khẩu vào tài liệu/test.
- Tra cứu audit thật; nếu được phép sửa môi trường kiểm thử, đổi một cấu hình với lý do kiểm thử, xác nhận giá trị + version + nhật ký cấu hình; kiểm tra audit nghiệp vụ sau khi relay chuyển tới. Thống nhất giá trị mong muốn cuối cùng, không tự đổi tham số production chỉ để thử.
- Phân biệt kết quả “đã gọi mock”, “đã chạy local qua proxy”, “đã xác minh API thật”. Chưa kiểm tra thật thì ghi giới hạn rõ, không tuyên bố tích hợp production hoàn tất.

Nghiệm thu TASK-34 khi cả 7 method có luồng UI tương ứng, quyền/validation/xử lý lỗi đúng, kiểm tra FE và hồi quy liên quan đạt; phần kiểm tra môi trường thật được ghi nhận bằng bằng chứng riêng hoặc nêu rõ còn chờ.

## 10. Sai lệch trong bàn giao và hướng xử lý

| Phát hiện đã đối chiếu | Ảnh hưởng | Hướng làm trong TASK-34 |
|---|---|---|
| Tài liệu đề xuất dropdown `action`, nhưng BusinessAuditQuery và Swagger không có trường này | Gửi action có thể bị bỏ qua, UI tạo cảm giác lọc đúng trong khi không lọc | Không dựng lọc hành động; vẫn hiển thị cột hành động. Muốn lọc toàn bộ theo hành động cần BE bổ sung hợp đồng |
| Tài liệu yêu cầu `PayloadHash`, DTO/Swagger không trả | FE không thể hiển thị mã băm được server lưu | Bỏ cột; không bịa giá trị hoặc hash lại JSON để nhận là hash nguồn |
| Tài liệu bỏ sót `GET /system/audit-logs/{id}` | Dễ bỏ luồng chi tiết nhật ký cấu hình | Có API #5 và modal đọc riêng trong kế hoạch |
| Tài liệu nhắc 6 microservice nhưng liệt kê 7 nguồn audit | Dễ hardcode sai số nguồn | Dùng 7 source trong hợp đồng; không đồng nhất source với số deployment service |
| Tài liệu xử lý mọi 401 bằng về login | Bỏ qua refresh hợp lệ của FE | Giữ client refresh chung, chỉ chuyển login khi phiên hết thật |
| Nhật ký IAM hiện lọc trên trang đang tải | Người dùng có thể nhầm là tìm toàn bộ | Làm rõ phạm vi trong tab IAM; audit Analytics mới lọc phía server |
| Vite chưa có prefix `/api/v1/system` | Có nguy cơ gửi nhầm IAM và 404 | Thêm routing cùng kiểm tra proxy ở bước 3 |

Phát hiện ngoài phạm vi để chuyển BE khi làm TASK-35:

- Swagger khai báo mặc định 200 cho một số API health/backup nhưng source controller tạo health check/backup trả **202**; health/backup thiếu mô tả response DTO đầy đủ. Không suy kết quả thực thi từ metadata đó.
- Trong `SystemBackups.Verify`, nếu không có `IBlobStorageClient`, không có file local, nhưng `RunnerProvisioned=true`, luồng vẫn có thể đi tới `Status="Verified"` mà chưa đọc file. Nhánh Blob cũng chỉ kiểm tra magic bytes khi stream seek được. Cần BE xử lý trước khi cam kết xác minh toàn vẹn; `Verified` cũng không đồng nghĩa đã thử khôi phục database (`RestoreTestedAtUtc` là trường riêng).
- Health có `Unknown`, `not_checked`, `stale_observation`, không chỉ 3 trạng thái nêu trong tài liệu; số thẻ phụ thuộc targets cấu hình. Chưa có API tra hoàn tất theo `requestId`, nên chờ 2–3 giây không đủ chứng minh quét đã xong.

Những phát hiện TASK-35 không cản việc triển khai TASK-34 và không được tự sửa BE trong phạm vi này.

## 11. Điểm đã chốt và thông tin còn chờ

Đã chốt: chỉ TASK-34; giữ nhật ký IAM; không thêm lọc action/hash thiếu hợp đồng; dùng 7 API đã có; tái sử dụng auth/Query/UI dự án.

Không còn câu hỏi nghiệp vụ chặn việc xây UI và tích hợp client theo hợp đồng hiện có. Trước xác minh thật cần biết môi trường FE/Gateway đang dùng và có phiên IT_ADMIN kiểm thử hợp lệ, đồng thời BE xác nhận các cờ/relay đã bật. Không cần gửi mật khẩu hay token vào tài liệu.

Nếu người dùng cần lọc theo hành động hoặc bắt buộc hiển thị hash server thì phải xác nhận yêu cầu mở rộng và chờ BE cung cấp API; không tự thêm query/response giả. Kế hoạch đã được bàn giao trước khi sửa code; người dùng sau đó yêu cầu thực hiện theo kế hoạch.

Ghi nhận khi triển khai: route Admin thực tế cho phép role IT_ADMIN **hoặc** một số quyền IAM được ủy quyền; tính năng TASK-34 mới kiểm tra role riêng, không thay đổi auth core. Các tab không hoạt động không tải dữ liệu; tab IAM vẫn chỉ hiển thị khi có `iam.audit.read`. Bộ kiểm tra proxy hiện bao gồm 36 tuyến, có path/query/method của đủ 7 thao tác TASK-34.

Kết quả kiểm thử ngày 03/11/2026: 25/25 ca Playwright đạt, gồm 16 ca mới TASK-34 và 9 ca hồi quy IAM/provisioning; proxy 36/36 tuyến đạt; typecheck và lint đạt. Đã kiểm tra ảnh modal trên màn hình 375px. Các ca mới bao phủ bộ lọc/phân trang/UTC, đủ 7 method, validation biên, lỗi 403/503/sai cấu trúc/sai ID, conflict và lưu không chắc chắn, focus/keyboard, response chi tiết đến trễ và cách ly dữ liệu khi đổi danh tính. Không sửa auth core và không chạy lại test auth riêng; chưa kiểm tra CORS/cookie/refresh hoặc rollout dữ liệu thật ở Azure. Lần chạy sandbox báo đủ ca đạt nhưng mắc teardown Windows; lần chạy lại ngoài sandbox kết thúc với exit code 0, `25 passed (1.3m)`.
