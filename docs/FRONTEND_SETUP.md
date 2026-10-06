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
