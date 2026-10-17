# Nền tảng FE Web

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
