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

- Client tài liệu tại `src/lib/api/documentForms.ts`, Query hooks tại `src/hooks/useDocumentForms.ts`; query riêng tư có danh tính và applicationId. DOCX hiện dùng tải/sửa bằng Word/upload, `DocxPreview` chỉ để xem và không bảo đảm hiển thị Word comments.
- Khi `VITE_USE_API_PROXY=true`, browser gọi cùng origin. Vite dùng `VITE_API_BASE_URL`, `VITE_CATALOG_API_URL`, `VITE_WORKFLOW_API_URL`, `VITE_DOCUMENT_FORM_API_URL` làm target; hosting production cần cấu hình reverse proxy tương đương. Biến VITE là cấu hình công khai, không chứa token.
- Các đường dẫn DocumentForm phải ưu tiên trước prefix Workflow `/api/v1/applications`: `contents`, `supporting-documents`, `generate-pdf`, `generated-documents` (kể cả query submissionId), `approved-qr`, `approved-qr/image`; thêm các prefix `form-templates`, `citizen/submissions`, `officer/submissions`, `supporting-documents`, `generated-documents`. Các route hồ sơ/thụ lý còn lại đi Workflow. Không dùng SPA fallback trả index.html cho API.
- Kiểm tra routing Vite thực tế bằng `node tests/api-proxy-check.mjs`: script tự dựng target HTTP cục bộ, không gọi Azure, kiểm tra 12 route và giữ nguyên query.
- Playwright cấu hình cả bốn service về localhost mock, tắt runtime proxy trong browser tests để không lấy target từ env cá nhân. Kiểm thử browser mock không thay thế script routing hoặc kiểm thử phân quyền/Blob/Gotenberg thật.
- QR yêu cầu hồ sơ APPROVED nhưng vẫn có thể chưa được tạo; FE chỉ hiển thị PNG server trả về. Việc cấp QR ngay sau duyệt và tra cứu công khai/đúng version vẫn cần hợp đồng BE; không coi QR là giấy hẹn hay tiếp nhận chính thức.
