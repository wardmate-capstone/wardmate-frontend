# Triển khai kết nối Procedure Catalog API

Ngày đối chiếu: 06/10/2026 (UTC+07:00). Trạng thái: **đã triển khai FE gọi các API Catalog hiện có; không sửa BE**. Các mục bên dưới là bản đối chiếu triển khai ban đầu. Xem [hướng dẫn từng API](PROCEDURE_API_USER_GUIDE.md), [phần BE còn thiếu](PROCEDURE_BACKEND_GAPS.md) và [kết quả kiểm tra thực tế](PROGRESS.md).

## 1. Mục tiêu và phạm vi

Kết nối UI hiện có với Procedure Catalog, giữ sidebar, bố cục danh sách/chi tiết, màu sắc và component chung. Chỉ sửa UI khi cần biểu diễn đúng hợp đồng backend, trạng thái tải/lỗi hoặc dữ liệu thực tế. Không thiết kế lại workspace.

Thứ tự: hạ tầng gọi API → tra cứu công khai → danh sách/quản lý thủ tục → PDF/bản nháp/đối soát → kiểm thử xuyên luồng. Catalog quản lý định nghĩa thủ tục; hồ sơ công dân, upload giấy tờ cá nhân, tạo DOCX và tiền kiểm thuộc dịch vụ khác.

Tài liệu này không cho phép tự triển khai các API còn thiếu, tự xuất bản PDF mẫu lên production, hoặc commit/push. Khi bắt đầu code, đọc lại AGENTS.md và trạng thái nguồn hiện tại.

## 2. Nguồn đã đối chiếu

- FE: `src/pages/procedure-manager/`, `src/types/procedureManager.ts`, `src/pages/public/ProceduresPage.tsx`, `src/pages/public/ProcedureDetailPage.tsx`, `src/pages/public/components/ProcedureCasesView.tsx`, `src/lib/procedureContent.ts`, `src/lib/api/index.ts`, `src/lib/api/createJwtClient.ts`.
- BE tại `D:/wardmate-backend/src/Services/WardMate.Services.ProcedureCatalog/`: Controllers, DTOs, Queries, Management, Drafts, Entities, JsonModels, EF configurations, repository và worker.
- AIOCR: `TextFirstProcedureExtractor.cs`, controller nội bộ và cấu hình DI. Đã đọc kịch bản test Catalog và fixture; chưa chạy test.
- Tài liệu BE: `docs/procedure-reviewed-publishing.md`, `docs/procedure-pdf-drafts.md`, `docs/procedure-pdf-text.md`. Mô tả TASK cũ chỉ là lịch sử; source hiện tại quyết định hợp đồng.
- PDF người dùng cung cấp: `C:/Users/Duc Anh/Downloads/procedure/thu-tuc-dang-ky-khai-sinh.pdf`, 97.808 byte, 11 trang. Đã trích xuất toàn bộ văn bản và xem ảnh các trang liên quan. Không sao chép PDF vào repo.
- Người dùng cho biết PDF lấy từ https://dichvucong.gov.vn/. Lần mở trang chủ bị timeout; chưa xác minh trang chi tiết hay hiệu lực pháp lý hiện hành. Các dữ kiện dưới đây là nội dung file mẫu, không phải xác nhận pháp lý.

## 3. Hiện trạng FE và thay đổi tối thiểu

| Vị trí | Hiện trạng | Việc cần làm |
| --- | --- | --- |
| `ProcedureManagerPage.tsx` | Giữ mock riêng, tự tăng Vn, tự đổi trạng thái | Quản lý state lựa chọn và kết quả server; bỏ tăng version/ghi thành công giả |
| `ProcedureListView.tsx` | Một bản mock khác, lọc client, lưu trữ giả | Nhận dữ liệu/callback từ nguồn chung; tìm kiếm, lọc và phân trang server |
| `ProcedureWizardModal.tsx` | 8 bước, giá trị pháp lý mặc định, state chỉ khởi tạo từ props một lần | Giữ khung; reset theo lần mở/id, dùng DTO đầy đủ, bổ sung trường còn thiếu, lưu async |
| `ProcedureDetailView.tsx` | `ProcedureItem` phẳng, các thao tác/file giả | Render detail thực, lịch sử thực, source PDF; ẩn giá trị không có dữ liệu |
| `ProcedureCategoriesView.tsx` | CRUD danh mục local | Nối GET, chỉ đọc; không báo thêm/sửa/xóa thành công khi BE chưa có API |
| Dashboard, audit, legal, AI knowledge | Mock độc lập | Không coi đã tích hợp Catalog; ghi rõ chưa hỗ trợ hoặc vô hiệu hóa thao tác không có API |
| `ProceduresPage.tsx` | Mock, lọc tên lĩnh vực, phân trang client | Nối categories/list; ID danh mục thật, metadata server; giữ URL filter/Back/Forward |
| `ProcedureDetailPage.tsx` | Tìm mock theo id; parser schema FE | GET detail rồi ánh xạ riêng; phân biệt loading/404/error |
| `ProcedureCasesView.tsx` | Tải mẫu chỉ toast, đoán tờ khai theo tên; phụ thuộc cases | Chỉ tải khi có liên kết thật; hiển thị checklist chung cả khi cases rỗng; xử lý case thay đổi sau fetch |
| Các view checklist/steps | Dữ liệu minh họa riêng | Chọn procedure, đọc toàn bộ detail rồi chỉnh đúng mảng JSON; không dựng endpoint checklist/steps riêng |

Không dùng `ProcedureItem` hiện tại làm wire DTO. Nó thiếu cases, submissionMethods và nhiều trường backend; dùng nó để PUT có thể xóa dữ liệu chưa hiển thị. Dùng DTO backend làm nguồn chỉnh sửa, view model chỉ phục vụ hiển thị.

## 4. HTTP, xác thực và định tuyến

- Tái sử dụng `api` từ `src/lib/api/index.ts`; API public dùng `{ skipAuth: true, signal }`, manager dùng JWT mặc định và `signal`. Không tạo cơ chế token mới.
- Gọi đường dẫn tương đối `/api/v1/...`. Client hiện chặn origin khác; không truyền URL service Azure trực tiếp vào `api.get()` khi base origin khác.
- `VITE_API_BASE_URL` phải trỏ tới origin/gateway phục vụ cả IAM và Catalog, hoặc để rỗng và dùng proxy cùng origin. Giữ cơ chế refresh cookie HttpOnly, access token RAM và returnTo hiện có.
- Vite hiện đã có proxy `/api/v1/procedures` và `/api/v1/procedure-manager` đứng trước `/api` IAM. `.env.example` và `vite.config.ts` đang có thay đổi chưa commit của người dùng: bảo toàn, không ghi đè.
- **Production còn thiếu routing:** `vercel.json` hiện chuyển toàn bộ `/api/:path*` sang IAM. Khi triển khai cần thêm rewrite Catalog cho cả hai prefix trước rule IAM và trước SPA fallback, hoặc chuyển sang gateway đã xác minh. Vite proxy chỉ áp dụng dev.
- Kiểm tra cấu hình TLS/CORS, forwarding và route thực tế; không coi URL có trong cấu hình là bằng chứng dịch vụ đã hoạt động. Không đưa key AIOCR/Blob/JWT signing key vào FE.
- Role thao tác: `PROCEDURE_MANAGER` hoặc `IT_ADMIN`; giữ protected route và kiểm tra khả năng truy cập workspace của cả hai role. 403 là thiếu quyền, không tự logout.
- Client mặc định timeout 15 giây. Preview có thể lâu hơn: chọn timeout riêng theo giới hạn gateway đã xác minh, có hủy request. Ưu tiên upload 202 + polling cho luồng PDF lưu bền; không đổi timeout auth toàn cục.
- Không thêm dependency quản lý query mới chỉ cho task này; dùng Axios, React, Zod và component sẵn có.

## 5. Hợp đồng endpoint hiện có

### Tra cứu công khai

| Method / route | Input | Thành công |
| --- | --- | --- |
| GET `/api/v1/procedures/categories` | Không | 200 array `{id:number, categoryName, description?}` |
| GET `/api/v1/procedures` | Query bên dưới | 200 `PagedResult<ProcedureSummaryDto>` |
| GET `/api/v1/procedures/{id}` | GUID | 200 detail; 404 nếu không có hoặc inactive |
| GET `/api/v1/procedures/{id}/source` | GUID | 200 `{url, expiresInSeconds:600}`; chỉ active có PDF từ draft Published tương ứng |

Query chuẩn: `keyword?`, `categoryId?` (số nguyên dương), `levelOfImplementation?`, `pageNumber=1`, `pageSize=10` (1..50), `sortBy=Title`, `isAscending=true`. Sort hỗ trợ Title, ProcedureCode, UpdatedAt, CreatedAt, LevelOfImplementation. Tìm mã/tên không dấu, không phân biệt hoa thường; %, _ và backslash là ký tự thường. Lọc cấp so khớp toàn bộ chuỗi sau bỏ dấu/hoa thường. Public luôn active.

Không dùng alias cũ `page/search` trong code mới. Khi cả hai dạng được gửi, `page` ghi đè pageNumber, keyword ưu tiên search.

PagedResult: `items`, `currentPage`, `totalPages`, `totalCount`, `pageSize`, `hasPrevious`, `hasNext`. Không có trường `page`. List item public: `id`, `procedureCode`, `title`, `categoryName`, `levelOfImplementation`, `feeSummary`, `processingTimeSummary`, `originalPdfUrl?`, `updatedAt`. Không có categoryId/description/isActive trong item public.

### Quản lý thủ tục

| Method / route | Body / query | Thành công |
| --- | --- | --- |
| GET `/api/v1/procedure-manager/procedures` | Query như public; pageSize tối đa 100; thêm isActive? | 200 paged; item thêm isActive, versionCount, createdAt |
| POST `/api/v1/procedure-manager/procedures` | `ProcedureInput` | 201 detail; tạo active + snapshot ban đầu |
| PUT `/api/v1/procedure-manager/procedures/{id}` | Toàn bộ ProcedureInput + decisionNumber, effectiveDate | 200 detail; chụp bản cũ rồi thay nội dung |
| PATCH `/api/v1/procedure-manager/procedures/{id}/status` | `{isActive:boolean, reason?:string}` | 200 `{id,isActive,reason?,updatedAt}` |
| GET `/api/v1/procedure-manager/procedures/{id}/versions` | Không | 200 array lịch sử; snapshotData là JSON object |
| POST `/api/v1/procedure-manager/procedures/publish` | `ReviewedProcedureInput` | 200 detail; upsert theo procedureCode |

Publish giữ Id/CreatedAt/IsActive của bản đã tồn tại; không tự mở thủ tục đã đóng. Gọi lại publish trực tiếp vẫn tạo version, chưa có idempotency-key. PUT không phải PATCH: phải giữ các trường/mảng chưa sửa và thông tin PDF. Không dùng publish upsert để giả lập đổi mã của một id đang sửa.

`versionCount` là số snapshot, không phải số phiên bản hiện hành. Không tự tạo Vn+1. Đổi status không tạo snapshot. Lịch sử không phải audit log: không tự điền người sửa, ngày hiệu lực pháp lý hoặc changeLog nếu response không có.

### Bản nháp PDF

Prefix: `/api/v1/procedure-manager/drafts`, yêu cầu role manager/admin.

| Method / suffix | Body | Kết quả |
| --- | --- | --- |
| POST `/extract-preview` | FormData `file` | 200 `{payload,extractedText,warnings}`; không lưu draft/Blob |
| POST prefix | FormData `file` | 202 DraftDto, Location |
| GET prefix | `page=1&pageSize=10`, tối đa 50 | 200 array summary; không có totalCount |
| GET `/{id}` | Không | 200 DraftDto |
| PUT `/{id}` | `{revision,payload}` | 200 DraftDto, revision mới |
| POST `/{id}/retry` | `{revision}` | 200 Queued; chỉ Failed và extraction enabled |
| POST `/{id}/publish` | `{revision,confirmed:true}` | 200 procedure detail |
| GET `/{id}/source` | Không | 200 `{url,expiresInSeconds:600}` |

DraftDto: `id,status,pdfFileName,payload,warnings,extractedText,failureCode?,revision,publishedProcedureId?,createdAt,updatedAt`. Summary không có payload/warnings/extractedText. Null có thể bị bỏ khỏi JSON response.

PDF tối đa 20 MiB, tên tối đa 255 ký tự, đuôi .pdf và chữ ký %PDF-. Preview reader tối đa 100 trang/100.000 ký tự. FormData để browser/Axios đặt multipart boundary. Payload draft phải là object, tối đa 500.000 ký tự; PUT HTTP tối đa 1 MiB. Không gửi URL PDF để backend tự tải.

## 6. Mapping dữ liệu không mất nội dung

Tạo dự kiến `src/types/procedureCatalog.ts` cho DTO và `src/lib/api/procedures.ts` cho hàm gọi API. Chỉ thêm adapter nhỏ trong `src/lib/procedureContent.ts` hoặc file riêng nếu cần; giữ parser mock cũ cho những consumer chưa chuyển đổi.

| BE | UI / quy tắc |
| --- | --- |
| procedureCode / id | Mã nghiệp vụ / GUID định danh; không dùng lẫn nhau |
| categoryId:number | Select dùng ID thật, chuyển string ở DOM về số; không hardcode cat-hotich hoặc số 1 |
| categoryName | Tên hiển thị; không suy ra ID từ list item bằng phỏng đoán |
| isActive | PUBLISHED/UNPUBLISHED cho thủ tục đã lưu; Draft là resource riêng; không map false thành ARCHIVED |
| feeSummary / processingTimeSummary | Hiển thị nguyên văn; không parse chuỗi thành một số cho mọi trường hợp |
| contentPayload.submissionMethods[] | methodName, feeAmount, feeUnit, estimatedDays, note → các hàng cách thức/thời hạn/lệ phí; giữ note và số thập phân |
| contentPayload.legalReferences[] | documentNumber → number; documentName → title; giữ issueDate/authority nếu có; không tự tạo URL |
| executingAgency / issuingAuthority | Cơ quan thực hiện / ban hành; không gộp hai khái niệm |
| contentPayload.receivingAddress | Địa chỉ tiếp nhận, trống thì chưa cập nhật; không dùng địa chỉ mẫu |
| contentPayload.results[] | Danh sách kết quả; không bỏ các phần tử sau phần tử đầu |
| contentPayload.cases[].steps[] | Giữ mã trường hợp, thứ tự và executor dạng text; không ép vào bốn enum actor FE |
| checklistSchema[] | Giữ checklistId, caseCode?, submissionType, itemName, documentCopyType, quantity, conditionNote?, isMandatory |
| formDefinitions[] | Giữ formTemplateId?, caseCode?, formCode, formName, formType, quantity, isMandatory; không đổi thành file tải giả |
| originalPdfUrl / pdfFileName | Metadata PDF nguồn; link Blob private cần endpoint source; không dùng làm URL biểu mẫu |

Detail DTO còn có categoryId, targetAudience, cả ba cấu trúc JSON và timestamps. Trường không hỗ trợ trong wire contract: description/overview riêng, conditions, giờ làm việc, upload policy/maxFiles, người sửa, trạng thái lưu trữ, URL văn bản pháp lý. Không gửi rồi báo đã lưu; tạm chỉ đọc/ẩn thao tác với chú thích ngắn nếu cần.

Checklist enum: NOP/XUAT_TRINH; ORIGINAL/CERTIFIED_COPY/REGULAR_COPY. Hiển thị CERTIFIED_COPY là “Bản sao chứng thực”, REGULAR_COPY là “Bản sao thường”; không tự đồng nhất mọi “bản chụp” trong nguồn với một enum. FormType: ONLINE_INTERACTIVE/DOCX_TEMPLATE. Không nối biểu mẫu và checklist bằng cách dò tên: contract chưa có khóa liên kết trực tiếp giữa hai mảng.

Validation quan trọng: title sau trim ít nhất 10 và tối đa 500 ký tự; code tối đa 50, giữ phân biệt hoa/thường của BE, không tự uppercase; category phải tồn tại; quantity > 0; feeAmount/estimatedDays không âm. Giữ null/unknown trong draft, không thay bằng 0/1/true. Publish kiểm tra đầy đủ trường số/boolean, FE phải yêu cầu đối soát trước khi gửi.

Không gọi parser cũ trực tiếp với contentPayload rồi coi mapping hoàn tất: parser đang đọc methods/legalBases/receivingAgencies, còn BE trả submissionMethods/legalReferences và scalar cơ quan ở root. Bổ sung test mapping và giữ dữ liệu gốc khi hiển thị một phần.

## 7. Các khoảng trống cần chốt trước phần phụ thuộc

1. **Chi tiết manager cho thủ tục inactive:** chưa có GET manager detail. GET public trả 404, list manager thiếu JSON. Đề xuất BE thêm GET theo id có cùng policy, trả đầy đủ detail kể cả inactive; đây là đề xuất, chưa tồn tại. Có thể nối list/status/public trước, nhưng không hoàn tất editor inactive bằng snapshot cũ hoặc mở công khai tạm để đọc.
2. **Nháp nhập tay không có PDF:** POST procedures tạo active ngay, không có cờ tạo draft. Draft hiện bắt buộc upload PDF. Nút “Lưu bản nháp” wizard không được gọi POST procedures rồi PATCH đóng. Hỗ trợ PDF draft trước; nháp nhập tay cần hợp đồng BE hoặc quyết định giới hạn chức năng.
3. **Ghi chú và cấu trúc PDF:** contract chưa có trường ghi chú chung/điều kiện, một case không có description, quantity bắt buộc >0. Các đoạn “Lưu ý” và hàng “Không có” không ánh xạ đầy đủ được. Cần chốt nơi lưu nội dung này trước khi tuyên bố import PDF đầy đủ. Giữ PDF/extractedText để đối soát; không nhét ghi chú vào checklist giả hay tự thêm field JSON mà typed BE sẽ bỏ.
4. **Đếm và quản trị mở rộng:** categories không trả code/count, draft list không trả tổng, chưa có archive/delete, category CRUD, dashboard tổng hợp, audit và kho pháp lý/AI Catalog. Không đếm trang hiện tại thành tổng toàn hệ thống; ẩn số không có hoặc dùng totalCount từ truy vấn phù hợp. Không gọi endpoint tự đặt.
5. **Biểu mẫu:** Catalog chỉ giữ formDefinitions và ID DocumentForm. Tải mẫu, DOCX editor, schema e-form và version biểu mẫu cần task DocumentForm riêng với contract đã đối chiếu. PDF này là mô tả thủ tục, không phải file phôi tờ khai.

Các khoảng trống trên không cản việc làm API layer, public list/detail và manager list/status. Chỉ dừng phần chức năng phụ thuộc để chốt với chủ dự án.

## 8. Luồng UI cần triển khai

### Danh sách và detail

- Giữ layout, debounce tìm kiếm ngắn, reset page khi đổi filter; dùng AbortController để response cũ không ghi đè mới. Không lọc tiếp trên một trang server rồi coi là kết quả đầy đủ.
- Metadata pagination lấy từ server; xử lý trang rỗng khi đóng thủ tục cuối trang. Giới hạn nút trang hiển thị, không render hàng nghìn nút.
- Categories dropdown lấy GET; bỏ badge count chưa có nguồn. Public list không có description: dùng fee/time/level thật hoặc bỏ dòng mô tả, không ghép mô tả mẫu.
- Chọn list row thì tải detail, không truyền summary như detail đầy đủ. Detail missing/inactive trả trạng thái 404, lỗi mạng có thử lại.
- Mutation chỉ báo thành công sau response; khóa nút đang gửi, giữ input khi lỗi, refetch các view liên quan. Dùng Modal/Toast chung thay alert/window.confirm trong phần được sửa.
- Khi mở wizard khác id hoặc mở tạo mới, reset form có kiểm soát; không giữ dữ liệu record trước. Bỏ mã, địa chỉ, lệ phí, người sửa và quy trình tiền kiểm mặc định đang hardcode.
- Giữ nguyên layout công khai và thông báo tiền kiểm khác tiếp nhận chính thức. Bỏ nhãn “dữ liệu minh họa” chỉ tại màn hình đã chuyển sang dữ liệu API; không gắn nhãn “đã xác minh pháp lý” chỉ vì fetch thành công.

### PDF và đối soát

1. Thêm điểm vào “Nhập PDF thủ tục” ở danh sách thủ tục, không dùng nhầm mục “Tải biểu mẫu”. Tái sử dụng khung modal/editor, thêm PDF viewer khi cần; không xây lại sidebar.
2. Upload → 202; lưu draft id vào URL hoặc lựa chọn điều hướng để mở lại sau reload. Đọc danh sách draft bằng API, không lưu payload/SAS vào localStorage.
3. Queued/Processing: poll detail khoảng 3–5 giây, dừng khi unmount/đổi draft hoặc NeedsReview/Failed/Published. Không tạo progress phần trăm giả. Nếu extraction tắt, upload trả NeedsReview ngay và cho nhập tay.
4. Source → PDF bên trái, form bên phải; mobile chuyển tab PDF/Nội dung. Link read hết hạn sau 600 giây, xin lại khi cần. Không gửi Bearer token đến Blob, không log/lưu SAS.
5. Render warnings/extractedText dạng text. Giữ giá trị chưa rõ để người quản lý bổ sung; không dùng kết quả AI làm xác nhận.
6. PUT draft với revision hiện tại → nhận revision mới. Khi bấm xuất bản mà còn sửa chưa lưu, lưu trước, chỉ publish với revision trả về; save lỗi thì không publish.
7. Cán bộ tích xác nhận đối soát; POST draft publish. Thành công chuyển sang detail, cập nhật danh sách/draft. Published chỉ đọc; PDF mới tạo draft mới.
8. 409: giữ phần đang nhập để so sánh, tải bản mới theo lựa chọn người dùng; không tự ghi đè hoặc retry mutation. Nếu publish timeout/mất mạng, GET draft để xác định Published trước khi thử lại. Upload timeout có thể đã tạo draft, không tự upload lại vô hạn.
9. Preview là thao tác tùy chọn không lưu dữ liệu. Không chạy cả preview rồi upload extraction lần nữa mặc định; tránh xử lý/chi phí lặp. Kết quả preview không có draft id/revision.

Draft trạng thái hiển thị: Queued = Chờ đọc PDF; Processing = Đang đọc PDF; NeedsReview = Cần đối soát; Failed = Đọc PDF thất bại; Published = Đã xuất bản. Failed cho sửa tay hoặc retry có kiểm soát. Không lẫn với bản nháp hồ sơ của công dân.

### Lỗi và ranh giới hồ sơ công dân

- 400: map errors theo field, giữ lỗi không map được ở đầu form; 401 qua client chung; 403 thiếu quyền; 404 không còn dữ liệu; 409 xung đột; 413 file lớn; 502/503/504 lỗi trích xuất/cấu hình/quá thời gian. Không fallback mock khi API lỗi.
- `ProcedureDetailPage` hiện tạo hồ sơ localStorage rồi báo thành công. Kết nối Catalog không biến thao tác này thành UserSubmission thật. Giữ thành task riêng, không gọi API draft Catalog để tạo hồ sơ công dân. Khi đổi dữ liệu public cần bảo đảm consumer cases/checklist đang có vẫn tương thích và thông báo không ngụ ý đã lưu server.
- Có checklist nhưng cases=[] vẫn phải đọc được giấy tờ. Reset case selection khi đổi thủ tục; không để selectedCaseCode cũ làm rỗng danh sách.

## 9. PDF khai sinh: dữ liệu đối soát và ca kiểm thử

Đây là nội dung file mẫu, không seed/import tự động vào môi trường thật.

| Trang | Nội dung đã đọc | Kỳ vọng khi kiểm thử |
| --- | --- | --- |
| 1 | Thủ tục đăng ký khai sinh; mã 1.001193; số quyết định QĐ/0001-BTP; lĩnh vực Hộ tịch; cấp “Xã” | Giữ mã và nội dung nguồn; chọn categoryId từ API. Nếu chuẩn hóa Xã → Cấp Xã phải hiển thị để người quản lý xác nhận; BE filter hiện so khớp toàn chuỗi |
| 1, 10 | Ô thẩm quyền/địa chỉ trống; cơ quan thực hiện ghi không có thông tin | Không điền UBND Phường An Khánh, không suy ra issuingAuthority từ tên file hay lĩnh vực |
| 2–3 | Quy trình trực tiếp/trực tuyến, kiểm tra/bổ sung/từ chối, lưu ý | Giữ điều kiện và văn bản nhiều dòng; không thay bằng quy trình tiền kiểm WardMate |
| 3–4 | Nhóm giấy tờ phải nộp; giấy chứng sinh và các trường hợp thay thế, bỏ rơi, mang thai hộ, ủy quyền | Giữ điều kiện áp dụng, không bắt mọi người nộp đồng thời mọi loại giấy tờ |
| 4–5 | Nhóm giấy tờ phải xuất trình, miễn xuất trình khi khai thác được dữ liệu và ngoại lệ | Tách NOP/XUAT_TRINH; không biến ngoại lệ thành giấy tờ bắt buộc mới |
| 5–8 | Nhóm “Lưu ý”, nhiều hàng số lượng ghi “Không có” | Không đổi thành quantity=0 (BE từ chối), không tự quantity=1; xử lý theo khoảng trống schema ở mục 7 |
| 8 | “Trường hợp 4” không có tên; tờ khai trực tiếp/bưu chính và mẫu điện tử tương tác | Không tạo đường dẫn tải hay FormTemplateId giả; không ép hai hình thức thành hai mẫu phải nộp đồng thời |
| 8–9 | Ba hình thức: trực tuyến, qua bưu điện, trực tiếp; bảng ghi 1 ngày và miễn phí | Đối soát cùng phần quy trình có nội dung phí có điều kiện, không coi bảng rút gọn là kết luận cho mọi đối tượng |
| 9–10 | 15 dòng căn cứ pháp lý | Mapping không bỏ dòng; giữ tên/số hiệu; không suy ra URL/ngày ban hành/hiệu lực từ số văn bản |
| 10 | Kết quả Giấy khai sinh, mã KQ.G15.000031 | Giữ tên kết quả; mã kết quả chưa có field riêng trong contract, không lặng lẽ cam kết lưu structured field |
| 11 | Mục mô tả không có nội dung | Không sinh mô tả pháp lý mặc định |

“Trường hợp 1–4” trong file là cách chia nhóm của bản xuất PDF, không đủ bằng chứng là bốn case nghiệp vụ loại trừ nhau. Không tự map một-một vào dropdown đang chọn một case. Cần đối soát cách nhóm, dùng checklist chung + submissionType khi phù hợp; ghi chú chung cần hợp đồng lưu phù hợp trước khi publish đầy đủ.

Reader hiện dùng heuristic ít chữ để cảnh báo; trang 11 chỉ có tiêu đề có thể làm kết quả chuyển nhập tay khi OCR tắt. Đây là dự đoán từ source, chưa chạy PDF qua AIOCR thật. Không coi cảnh báo/manual payload trống là lỗi UI, và không tự bật OCR/AI trả phí để vượt qua.

## 10. Thứ tự thực hiện và điều kiện hoàn tất

### Bước A — Nền tảng và DTO

- [ ] Xác minh routing dev/production và baseURL; bảo toàn thay đổi cấu hình của người dùng.
- [ ] Thêm DTO đúng camelCase, optional/null, API functions, mapping và ProblemDetails theo client chung.
- [ ] Không thêm API endpoint hoặc token/storage convention tự đặt.

### Bước B — Tra cứu công khai

- [ ] Categories, danh sách, server pagination/filter, detail và source PDF hoạt động.
- [ ] Giữ layout/responsive, checklist công khai không có checkbox tự kiểm tra.
- [ ] Không mất cases/checklist/methods/legalReferences/results; không có link tải giả.

### Bước C — Manager

- [ ] Hợp nhất nguồn state, list/status và lịch sử version dùng server.
- [ ] Chốt manager detail inactive trước khi hoàn thiện editor.
- [ ] Create/PUT giữ nguyên mọi field ngoài phần sửa; validate và xử lý pending/error.
- [ ] Không archive, tạo version giả hoặc lưu nháp bằng cách công khai rồi đóng.

### Bước D — PDF draft

- [ ] Upload, poll, source, lưu revision, retry, đối soát, publish và mở lại sau reload.
- [ ] Chốt ghi chú/cases/unknown của PDF mẫu; chưa chốt thì không tuyên bố import đầy đủ.
- [ ] Không gửi dữ liệu mẫu lên production để thử nghiệm nếu chưa được yêu cầu.

### Bước E — Kiểm thử

- [ ] `npm run typecheck`, `npm run lint`, `npm run build`.
- [ ] Cập nhật/mở rộng Playwright liên quan: `tests/procedure-manager.spec.ts`, `tests/landing.spec.ts`, `tests/procedure-detail.spec.ts`; test consumer hồ sơ công dân nếu mapping chạm vào luồng đó.
- [ ] Test mock: đúng URL/query/body, categories số, public skipAuth, roles/403, 404 inactive, response camelCase, pagination, request race/cancel, loading/empty/error, không fallback mock.
- [ ] Test bảo toàn dữ liệu PUT với nhiều cases/forms, trường nullable, ghi chú và PDF; không để chỉnh title làm mất mảng chưa mở tab.
- [ ] Test draft: 202→Processing→NeedsReview, extraction tắt, Failed/retry, save revision mới trước publish, 409, double click, timeout chưa rõ kết quả, link source hết hạn.
- [ ] Test PDF mẫu ở môi trường dev: kiểm tra extractedText/warnings và từng nhóm trang mục 9; không chỉ kiểm tra HTTP 200.
- [ ] Smoke API thật qua origin triển khai: public list/detail, manager quyền đúng/sai, upload/source/save/publish trong môi trường test được phép; reload vẫn tồn tại dữ liệu. Mock pass không thay thế bước này.
- [ ] Kiểm tra desktop/mobile, focus modal, bàn phím, text dài và checklist không có case.

Playwright hiện dùng Edge, 127.0.0.1:4317; biến test baseURL API là http://localhost:5000. Route mock cần intercept các API Catalog mới để test không gọi nhầm cloud. Không chạy migration, build/push Docker hay sửa BE chỉ để hoàn tất task FE nếu chưa có phạm vi tương ứng.

## 11. Trạng thái bàn giao tài liệu

Đã đối chiếu source FE/BE, đọc 11 trang PDF và xem các trang dữ liệu chính. Chưa sửa UI, chưa kết nối API, chưa chạy build/test FE/BE, chưa gọi endpoint nghiệp vụ hoặc xuất bản mẫu. Khi bắt đầu triển khai, ưu tiên Bước A/B và phần độc lập của C, sau đó chốt các khoảng trống mục 7 với chủ dự án.
