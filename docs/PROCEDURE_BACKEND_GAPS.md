# Các phần cần backend bổ sung sau tích hợp Catalog

Ngày: 06/10/2026. Theo yêu cầu chủ dự án, task FE không sửa backend. Các đề xuất dưới đây **chưa phải API đã tồn tại**, không gọi từ FE cho đến khi BE bàn giao hợp đồng.

## Ưu tiên 1 — Hoàn thiện vòng đời thủ tục và PDF

1. **GET detail dành cho manager, gồm inactive.** List manager chỉ trả summary; public detail trả 404 với inactive. Cần route có policy PROCEDURE_MANAGER/IT_ADMIN, trả đầy đủ scalar và JSON để sửa thủ tục đóng mà không công khai tạm. FE hiện vẫn cho đổi trạng thái/xem lịch sử, khóa chỉnh sửa inactive.
2. **Nơi lưu ghi chú chung/điều kiện và nội dung nguồn không cấu trúc.** PDF khai sinh có nhiều mục “Lưu ý”, hàng “Không có” số lượng và phần nhóm hồ sơ không phải case nghiệp vụ. Schema hiện chỉ có checklist quantity>0 và case steps, chưa có general notes/conditions hoặc mô hình nhóm độc lập. BE cần chốt DTO, persistence, validation, snapshot và response; không chỉ nhận thêm field rồi bỏ khi deserialize.
3. **Nháp nhập tay không có PDF.** POST procedures tạo active, draft hiện bắt buộc upload PDF. Cần nghiệp vụ tạo/lưu nháp thủ công, revision và publish nếu muốn giữ nút Lưu nháp trong wizard nhập tay. FE không dùng tạo active rồi đóng để giả lập.
4. **Chất lượng trích xuất với trang ít chữ.** PDF mẫu 11 trang có trang cuối chỉ tiêu đề; text-first reader có thể chuyển toàn bộ payload sang nhập tay theo heuristic khi OCR tắt. Cần kiểm tra file thật và phân biệt trang trắng/trang tiêu đề với trang scan thiếu chữ. FE đã giữ cảnh báo và hỗ trợ nhập tay, không tự bật AI/OCR.

## Ưu tiên 2 — Các chức năng UI chưa có contract Catalog

- Category CRUD và metadata count/code nếu cần; hiện chỉ có GET categories.
- Trạng thái ARCHIVED/xóa theo nghiệp vụ; hiện chỉ có isActive. Không đồng nhất ngừng công khai với lưu trữ.
- Tổng số draft/phân trang có metadata, bộ lọc trạng thái nếu cần dashboard đầy đủ.
- Audit log có actor, thời gian và hành động; history snapshot hiện tại không thay thế audit.
- Kho văn bản pháp lý độc lập và liên kết văn bản bằng ID; hiện chỉ có legalReferences nhúng trong thủ tục.
- Endpoint quản lý/sync kho tri thức AI; không suy ra từ endpoint trích xuất PDF.
- API đọc PDF lịch sử có quyền phù hợp và SAS ngắn hạn; hiện source chỉ phục vụ PDF hiện tại hoặc draft cụ thể.
- Bảo vệ concurrent edit thủ tục hiện hành bằng revision/ETag nếu muốn phát hiện hai người sửa cùng bản. Hiện FE không có token concurrency cho PUT procedure, chỉ draft có revision.
- Idempotency cho create/upload/publish trực tiếp nếu muốn retry an toàn sau lỗi mạng. Draft publish đã có state/revision để đối chiếu; FE không tự retry mù các mutation khác.

## Phụ thuộc dịch vụ khác

- **DocumentForm:** hợp đồng tra cứu/tải phôi thật, quyền truy cập công khai, ID template và schema e-form để nối nút tải/soạn mẫu. Catalog formDefinitions không có URL tải, checklist chưa có khóa trực tiếp tới formDefinition; không map bằng dò tên giấy tờ.
- **Hồ sơ công dân:** tạo/lưu/nộp hồ sơ và file đính kèm không dùng procedure draft. FE đã bỏ việc tạo hồ sơ localStorage từ CTA chi tiết Catalog rồi báo đã lưu thật; tích hợp UserSubmission cần phạm vi riêng.

## Môi trường cần xác minh

- Public Azure hiện hoạt động nhưng mới có record seed minh họa. Cần dữ liệu đã được chủ dự án đối soát, không chỉ thay nguồn mock FE bằng seed BE rồi coi là dữ liệu nghiệp vụ đã xác thực.
- Cấp tài khoản thử có role manager/admin qua quy trình của dự án; xác minh Jwt issuer/audience/key giữa IAM và Catalog.
- Blob private, quyền cấp SAS, migration ProcedureDrafts và AIOCR URL/service key cần cấu hình ở BE. Không đưa secret vào frontend.
- Kiểm tra giới hạn request/body/timeout của ingress cho PDF và preview; frontend có timeout riêng nhưng không vượt được giới hạn gateway.
- Source-code contract đã đối chiếu không chứng minh mọi endpoint quản lý trên Azure cùng phiên bản. Cần xác nhận phiên bản deploy và smoke test manager trên môi trường được phép.

## Thông tin BE nên bàn giao cho FE

Mỗi phần mới cần method/route, role, request mẫu, response thực, optional/null, status và ProblemDetails; thêm validation/giới hạn, migration cần áp dụng và hành vi version/concurrency. Có hợp đồng này thì FE có thể bật chức năng tương ứng bằng UI hiện tại, không cần thiết kế lại workspace.
