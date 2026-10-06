# Hướng dẫn sử dụng từng API Procedure Catalog

Cập nhật: 06/10/2026. Phạm vi: frontend kết nối các endpoint Catalog hiện có. Không sửa backend.

## Chuẩn bị

1. Chạy frontend bằng `npm run dev`; dùng origin frontend để cookie IAM và các request Catalog đi đúng proxy.
2. Tra cứu công khai tại `/thu-tuc`; không cần đăng nhập.
3. Quản lý tại `/procedure-manager`; đăng nhập bằng tài khoản có role `PROCEDURE_MANAGER` hoặc `IT_ADMIN` do IAM cấp. Không dùng tài khoản công dân cho thao tác quản lý.
4. Để quan sát từng API, mở DevTools → Network → Fetch/XHR; xóa danh sách request, thao tác trên màn hình rồi chọn request `/api/v1/...`. Xem Query String, Payload, Response và HTTP status. Không chia sẻ ảnh chứa Authorization/cookie/SAS.
5. Các request public không gửi Bearer; request quản lý dùng client auth chung. Không tự lưu access token vào localStorage hoặc chép khóa dịch vụ vào FE.

Dev đã có proxy Catalog trong `vite.config.ts`; production đã bổ sung rewrite hai prefix Catalog trong `vercel.json`, đứng trước IAM và SPA. Cấu hình production chỉ có hiệu lực sau deploy; task này không deploy/push. Nếu đặt VITE_API_BASE_URL khác rỗng, origin đó phải định tuyến được cả IAM và Catalog.

Kiểm tra public thật ngày 06/10: `/health`, categories, list và detail trả 200. Catalog hiện trả một thủ tục seed `DEMO-KET-HON`, tên ghi rõ dữ liệu minh họa. Đây là dữ liệu trả từ máy chủ, không phải mock frontend; cần nhập dữ liệu đã đối soát để có nội dung nghiệp vụ thật. Không tự xóa seed hoặc xuất bản PDF mẫu trong task tích hợp.

## Luồng nên thử trước với PDF khai sinh

Vào Quản lý thủ tục → **PDF và bản nháp** → chọn PDF → **Đọc thử PDF (không lưu)** nếu chỉ muốn kiểm tra dịch vụ đọc PDF. Khi cần lưu tiến độ, dùng **Tải lên và tạo bản nháp**, chờ đọc xong, xem PDF nguồn, sửa các phần nội dung rồi lưu. Chỉ xác nhận xuất bản khi thông tin đã đủ và đã đối soát.

PDF mẫu có 11 trang. Nhóm “Trường hợp 1–4” của bản PDF gồm giấy tờ phải nộp, phải xuất trình, lưu ý và biểu mẫu, không tự coi là bốn tình huống loại trừ nhau. Những dòng “Không có” ở số lượng và các lưu ý chung chưa được schema Catalog biểu diễn đầy đủ. Không biến chúng thành giấy tờ số lượng 1 hoặc bỏ mất nội dung rồi xác nhận đầy đủ. Xem [danh sách cần BE bổ sung](PROCEDURE_BACKEND_GAPS.md).

## 1. Lấy danh mục

**GET `/api/v1/procedures/categories`** — public.

- Mở `/thu-tuc`: sidebar lĩnh vực tải danh mục. Trong quản lý, mở **Danh mục thủ tục** để xem danh sách chỉ đọc.
- 200: mảng `{id, categoryName, description?}`. ID là số, dùng đúng ID này khi lọc hoặc nhập thủ tục.
- Không có số lượng thủ tục theo danh mục trong response. FE không tự tạo số liệu.
- API chưa hỗ trợ thêm/sửa/xóa danh mục. Nếu lỗi, bấm **Thử lại**.

## 2. Tra cứu thủ tục công khai

**GET `/api/v1/procedures`** — public.

- Mở `/thu-tuc`, nhập mã/tên, chọn lĩnh vực, bấm trang kế tiếp. Trang chủ và tra cứu trong tài khoản công dân cũng lấy Catalog API.
- Request FE gửi `keyword`, `categoryId`, `pageNumber`, `pageSize`; tra cứu trang công khai hiện dùng 5 bản ghi/trang.
- API còn hỗ trợ `levelOfImplementation`, `sortBy`, `isAscending`. PageSize tối đa 50. Keyword tìm theo mã/tên không dấu, không phân biệt hoa thường; không phải tìm kiếm ngữ nghĩa.
- 200: `items,currentPage,totalPages,totalCount,pageSize,hasPrevious,hasNext`. Không có kết quả vẫn 200 với mảng rỗng.
- Chỉ active được công khai. Không truyền `isActive=false` để lấy thủ tục đã đóng bằng API này.

## 3. Xem chi tiết công khai

**GET `/api/v1/procedures/{id}`** — public.

- Bấm **Xem hướng dẫn** từ danh sách; URL chứa GUID của thủ tục, không phải mã nghiệp vụ như `1.001193`.
- 200: thông tin chung, `contentPayload`, `checklistSchema`, `formDefinitions`, metadata PDF và thời gian.
- Chọn trường hợp để đọc giấy tờ riêng; giấy tờ không có caseCode luôn hiển thị chung. Nếu không có cases thì giấy tờ vẫn hiển thị.
- 404: không tồn tại hoặc đã ngừng công khai. Không lấy mock thay thế khi lỗi.
- Phần biểu mẫu chỉ hiển thị định nghĩa được Catalog cung cấp, không có nút tải file giả. Tạo hồ sơ công dân/soạn DOCX chưa thuộc tích hợp Catalog này.

## 4. Xem PDF nguồn đã xuất bản

**GET `/api/v1/procedures/{id}/source`** — public.

- Tại chi tiết có metadata PDF, bấm **Xem PDF nguồn**. Có thể mở PDF trong tab mới.
- 200: `{url,expiresInSeconds:600}`. Link đọc có thời hạn 10 phút; bấm xem/làm mới để xin lại khi hết hạn.
- 404 nếu thủ tục inactive, không có draft Published tương ứng, hoặc PDF được gắn bằng API khác mà không có liên kết draft.
- Không gửi JWT tới URL Blob; không lưu SAS vào dữ liệu thủ tục hoặc localStorage.

## 5. Danh sách quản lý

**GET `/api/v1/procedure-manager/procedures`** — manager/admin.

- Vào **Danh sách thủ tục**, nhập từ khóa rồi **Tìm kiếm**; chọn lĩnh vực, trạng thái, cấp thực hiện, thứ tự sắp xếp.
- Query giống public, thêm `isActive` và cho pageSize tối đa 100. UI dùng 10 bản ghi/trang.
- Bỏ lọc trạng thái để xem cả active và inactive; summary có thêm `isActive,versionCount,createdAt`.
- Hai số trên Dashboard lấy `totalCount` của truy vấn active/inactive, không đếm riêng trang đầu.
- `versionCount` là số bản lưu lịch sử, không phải phiên bản hiện hành tự tăng ở FE.

## 6. Tạo thủ tục mới

**POST `/api/v1/procedure-manager/procedures`** — manager/admin.

1. Bấm **Thêm thủ tục**.
2. Nhập mã, tên ít nhất 10 ký tự, chọn danh mục thật, cấp, đối tượng, tóm tắt phí và thời hạn.
3. Điền các phần giấy tờ, quy trình theo trường hợp, phương thức nộp, biểu mẫu liên kết và căn cứ pháp lý nếu có. Không tự nhận giá trị mặc định là thông tin chính thức.
4. Giữ cách lưu **Tạo mới — từ chối mã đã tồn tại**, tích xác nhận đối soát rồi **Xác nhận lưu**.

Body là ProcedureInput: `categoryId,procedureCode,title,issuingAuthority?,executingAgency?,levelOfImplementation,targetAudience,feeSummary,processingTimeSummary,contentPayload,checklistSchema?,formDefinitions?,originalPdfUrl?,pdfFileName?`.

201: tạo active + bản lưu ban đầu. **Không có chế độ nháp nhập tay** trên endpoint này. 409 nếu mã đã có; 400 nếu chưa hợp lệ. Lỗi giữ form để sửa, không tự đóng hoặc báo thành công.

## 7. Cập nhật thủ tục theo ID

**PUT `/api/v1/procedure-manager/procedures/{id}`** — manager/admin.

1. Chọn thủ tục đang công khai → **Chi tiết** → **Chỉnh sửa**.
2. Sửa phần cần thiết; các mảng/metadata ngoài tab đang mở vẫn được giữ.
3. Nhập số quyết định ở Thông tin chung và **Ngày hiệu lực của thay đổi**, rồi **Lưu thay đổi**.

Body là toàn bộ ProcedureInput cộng `decisionNumber,effectiveDate` (YYYY-MM-DD). 200: detail mới; backend lưu snapshot cũ trước khi thay thế. Không phải PATCH từng field.

Backend chưa có GET manager detail cho inactive nên FE khóa chỉnh sửa record inactive, không dùng snapshot cũ làm bản hiện hành và không tự mở công khai để đọc. Có thể xem lịch sử và đổi trạng thái.

## 8. Đóng/mở công khai

**PATCH `/api/v1/procedure-manager/procedures/{id}/status`** — manager/admin.

- Chi tiết → **Ngừng công khai** hoặc **Mở công khai** → nhập lý do nếu cần → **Xác nhận**.
- Body `{isActive:true|false,reason?:string}`.
- 200: `{id,isActive,reason?,updatedAt}`. Đổi trạng thái không tạo bản lưu mới.
- Sau khi đóng, public GET detail/list không trả record đó; liên kết PDF đã cấp trước đó có thể còn hiệu lực tối đa 10 phút.
- Đây không phải xóa hoặc lưu trữ vĩnh viễn; backend chưa có trạng thái ARCHIVED.

## 9. Xem lịch sử phiên bản

**GET `/api/v1/procedure-manager/procedures/{id}/versions`** — manager/admin.

- Tại chi tiết, mở **Lịch sử phiên bản**, bấm từng bản lưu; dùng các phần nội dung để đọc snapshot.
- 200: mảng `{id,versionNumber,decisionNumber?,effectiveDate,snapshotData,createdAt,originalPdfUrl?,pdfFileName?}`.
- Snapshot là nội dung được đóng băng. Với cập nhật, đây là trạng thái trước khi thay; không lấy để sửa thay cho detail hiện hành.
- Chưa có API cấp SAS riêng cho PDF lịch sử, chưa có audit actor/changeLog; FE không điền người sửa giả.

## 10. Xuất bản trực tiếp nội dung đã đối soát

**POST `/api/v1/procedure-manager/procedures/publish`** — manager/admin.

- **Thêm thủ tục** → nhập đầy đủ nội dung → cách lưu **Xuất bản nội dung đã đối soát — cập nhật nếu mã tồn tại** → xác nhận.
- Body ReviewedProcedureInput cùng trường ProcedureInput, phí/thời hạn phải được cung cấp rõ ràng.
- 200 cho cả tạo và cập nhật. Mã mới tạo active; mã có sẵn thay toàn bộ nội dung và giữ trạng thái đóng/mở hiện tại.
- Đây là upsert theo mã, không dùng để đổi mã của một record đang chỉnh sửa. Mã phân biệt hoa thường theo backend hiện tại.
- Gửi lại vẫn có thể tạo version mới. Khi mất kết nối, kiểm tra danh sách và lịch sử trước khi gửi lại; FE không tự retry mutation.
- Với PDF được tải lên, ưu tiên API publish draft ở mục 18 để giữ liên kết nguồn và chống xuất bản lặp cùng draft.

## 11. Đọc thử PDF

**POST `/api/v1/procedure-manager/drafts/extract-preview`** — manager/admin.

- **PDF và bản nháp** → chọn file → **Đọc thử PDF (không lưu)**. Có nút dừng request đọc thử.
- Body multipart/form-data có trường `file`. Browser tự đặt boundary.
- 200: `{payload,extractedText,warnings}`; FE hiển thị văn bản và đề xuất chỉ đọc. Không tạo draft, không có id/revision, không lưu Blob.
- Đọc chữ trực tiếp không đồng nghĩa AI đã điền hết trường. Khi AI tắt hoặc reader phát hiện trang thiếu chữ, payload có thể trống, warnings giải thích việc đối soát thủ công.
- Cần AIOCR URL/service key và AIOCR hoạt động; không cần Blob. 503 thiếu cấu hình, 502 đọc thất bại, 504 timeout; 400 file sai, 413 quá lớn.

## 12. Upload và tạo draft

**POST `/api/v1/procedure-manager/drafts`** — manager/admin.

- **PDF và bản nháp** → chọn file → **Tải lên và tạo bản nháp**.
- Body FormData `file`; PDF tối đa 20 MiB, đuôi .pdf, tên tối đa 255 ký tự.
- 202 DraftDto và Location. FE mở URL chứa `draft=<id>` để mở lại sau reload.
- Extraction bật: Queued → Processing → NeedsReview hoặc Failed. Extraction tắt: NeedsReview ngay, nhập tay.
- Cần Blob; 503 `draft.storage_not_configured` nếu thiếu. Mất kết nối upload có thể đã tạo record: kiểm tra danh sách trước khi tải lại.

## 13. Liệt kê draft

**GET `/api/v1/procedure-manager/drafts?page=1&pageSize=10`** — manager/admin.

- Mở **PDF và bản nháp**; danh sách hiển thị tên PDF, trạng thái và **Mở bản nháp**. Dùng Trước/Sau hoặc Tải lại.
- 200 mảng DraftSummaryDto, không có tổng số bản ghi. Khi đủ 10 dòng, FE cho thử trang sau; trang sau có thể rỗng.
- Không tính số dòng hiện tại thành tổng toàn hệ thống. PageSize backend tối đa 50.

## 14. Đọc draft và theo dõi xử lý

**GET `/api/v1/procedure-manager/drafts/{id}`** — manager/admin.

- Bấm **Mở bản nháp** hoặc mở lại URL chứa draft id.
- FE gọi lại khoảng 4 giây/lần khi Queued/Processing; dừng khi NeedsReview/Failed/Published hoặc rời workspace.
- 200: `id,status,pdfFileName,payload,warnings,extractedText,failureCode?,revision,publishedProcedureId?,createdAt,updatedAt`.
- Đọc warnings trước khi sửa. Published chỉ đọc. Sau khi publish mất phản hồi, FE GET draft để kiểm tra đã Published thay vì gửi publish lặp.

## 15. Xem PDF draft

**GET `/api/v1/procedure-manager/drafts/{id}/source`** — manager/admin.

- Trong draft bấm **Xem PDF nguồn**, đối chiếu với editor bên cạnh; trên mobile hai khối xếp dọc.
- 200 `{url,expiresInSeconds:600}`. Link chỉ nằm trong bộ nhớ UI; hết hạn bấm xem lại/làm mới.
- 404 draft không có; 503 thiếu Blob; không đưa URL có SAS vào payload.

## 16. Lưu draft

**PUT `/api/v1/procedure-manager/drafts/{id}`** — manager/admin.

- Sửa các phần nội dung → **Lưu bản nháp**. Có thể lưu chưa hoàn chỉnh để tiếp tục sau.
- Body `{revision,payload}`; FE dùng revision mới nhất đã đọc, nhận revision mới sau lưu.
- 200 DraftDto, status NeedsReview. Chỉ sửa ở NeedsReview/Failed.
- 409 nếu revision cũ hoặc trạng thái không cho sửa: FE giữ nội dung đang nhập, không ghi đè tự động. Có thể đối chiếu/copy nội dung, bỏ phần chưa lưu có chủ ý rồi tải trạng thái mới.
- Payload object tối đa 500.000 ký tự; HTTP PUT tối đa 1 MiB. Không lưu toàn bộ PDF vào payload.

## 17. Thử trích xuất lại

**POST `/api/v1/procedure-manager/drafts/{id}/retry`** — manager/admin.

- Draft Failed → **Thử đọc lại PDF**. Lưu hoặc bỏ thay đổi đang nhập trước khi retry.
- Body `{revision}`. 200 status Queued; FE tiếp tục polling.
- Chỉ Failed mới retry; 409 nếu trạng thái/revision đổi; 503 nếu extraction chưa bật. Chưa có cấu hình thì chọn nhập tay thay vì bấm liên tục.

## 18. Xác nhận xuất bản draft

**POST `/api/v1/procedure-manager/drafts/{id}/publish`** — manager/admin.

1. Đối soát giấy tờ, hình thức nộp, trường hợp, căn cứ, lệ phí và thời hạn với PDF gốc. Không xác nhận nếu ghi chú quan trọng chưa có nơi lưu phù hợp.
2. Tích **Tôi đã đối soát nội dung với PDF gốc…** → **Xác nhận xuất bản**.
3. FE validate và PUT lưu nội dung trước, chỉ POST publish với revision vừa được trả về.

Body `{revision,confirmed:true}`. 200 ProcedureDetailDto; draft thành Published. Mã thủ tục mới tạo record, mã có sẵn cập nhật record và lưu snapshot cũ; không tự mở record đang đóng.

400 thiếu xác nhận/thiếu dữ liệu; 409 revision/state. Không tự thay số hoặc boolean chưa biết thành 0/1/true. Cùng draft không được publish lần nữa; muốn cập nhật bằng PDF khác thì tạo draft mới.

## Kiểm tra khi có lỗi

| Kết quả | Cách xử lý |
| --- | --- |
| 400 | Đọc thông báo và danh sách field, sửa dữ liệu; giữ form |
| 401 | Client thử refresh theo IAM; phiên hết hạn về đăng nhập với returnTo |
| 403 | Kiểm tra role tài khoản; không tự logout hoặc dùng dữ liệu giả |
| 404 | Kiểm tra GUID và trạng thái công khai, hoặc liên kết PDF/draft |
| 409 | Dữ liệu đã thay đổi/mã trùng; đọc bản mới trước khi thử lại |
| 413 | Chọn PDF nhỏ hơn hoặc chia file; mỗi draft dành cho một thủ tục |
| 502/503/504 | Kiểm tra AIOCR/Blob/routing và thời gian gateway; không kết luận PDF đã nhập thành công |
| Lỗi mạng sau mutation | Kiểm tra server đã lưu chưa trước khi gửi lại |

## Ranh giới nghiệm thu

“Đã nối API” nghĩa là FE dùng request/response thật, không fallback mock. Playwright dùng mock HTTP để xác minh hợp đồng và các nhánh lỗi; không chứng minh Azure Blob/AIOCR hay thao tác quản lý thật đã chạy thành công. Xem kết quả kiểm tra cập nhật trong [PROGRESS.md](PROGRESS.md).

Các thao tác manager/upload/publish thật cần tài khoản được phép và môi trường thử nghiệm. Task này không lưu token, không sửa BE, không tự phát sinh dữ liệu thật để kiểm thử. Phần hồ sơ công dân, kho DOCX/e-form, AI knowledge/audit riêng không được coi là đã tích hợp chỉ vì Catalog hoạt động.
