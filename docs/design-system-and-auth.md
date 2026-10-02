# Design System Core và JWT client

## Trạng thái hiện tại

- Core: Button, Input, Modal, Badge và Toast tại `src/components/ui`.
- Input đã được dùng trong đăng nhập/đăng ký. Các trang dùng Toast qua module chung.
- Modal/Badge dùng được ngay; ví dụ trực quan nằm tại `/tests/fixtures/ui.html` khi chạy Vite dev. Fixture không nằm trong bundle production.
- Đã nối register, login, refresh-token, revoke-token và `/api/v1/users/me`. Zustand tại `src/stores/authStore.ts` giữ trạng thái restoring/authenticated/anonymous/error, danh tính, roles/permissions; token không persist.
- Base URL mặc định rỗng để dùng `/api` cùng origin; `VITE_API_BASE_URL` có thể ghi đè. Vite dev proxy và Vercel rewrite hiện trỏ IAM Azure. Deployment khác cần cấu hình proxy/URL phù hợp; không mặc định các route nghiệp vụ service khác đi được qua IAM.
- Access token chỉ ở RAM trong JWT client. Refresh cookie HttpOnly do BE quản lý. Khi ứng dụng khởi động/F5, provider khôi phục phiên rồi lấy `/users/me`; route riêng tư chờ hoàn tất. Bootstrap và refresh khi 401 dùng chung một promise trong client.
- Form Login/Register dùng React Hook Form + Zod, đồng bộ ràng buộc IAM (kể cả giới hạn mật khẩu 72 byte UTF-8), lỗi tiếng Việt từng trường và ánh xạ ProblemDetails.errors. Đăng ký thành công không tạo phiên.
- Protected Routes bảo vệ cả alias tiếng Việt: citizen/cong-dan → REGISTERED_CITIZEN; officer/can-bo → FRONT_DESK_OFFICER; manager/quan-ly → MANAGER; procedure-manager/quan-ly-thu-tuc → PROCEDURE_MANAGER hoặc IT_ADMIN; admin → IT_ADMIN. Không cấp IT_ADMIN quyền workspace khác ngầm định. Menu tài khoản công khai hiển thị workspace theo role.
- Chưa đăng nhập → login với returnTo nội bộ; sai role → thông báo không có quyền; lỗi mạng/5xx/CSRF lúc bootstrap → trạng thái lỗi và nút thử lại trên trang riêng tư. Backend vẫn là nơi thực thi bảo mật API.
- Login không có returnTo cụ thể: công dân về landing `/`; role nội bộ duy nhất vào workspace admin/officer/manager/procedure-manager tương ứng. Có returnTo an toàn thì giữ đích; guard vẫn kiểm tra quyền. Nhiều role/role chưa biết về trang chủ để chọn workspace, không tự chọn role chính.
- “Ghi nhớ đăng nhập” được giữ nguyên UI và chưa nối logic theo yêu cầu. Thời hạn cookie hiện do BE quyết định.

## Component dùng chung

```tsx
import { Button, Input, Modal, Badge, toast } from '@/components/ui';

<Button loading={saving} disabled={!canSave}>Lưu thay đổi</Button>
<Input label="Email" type="email" required hint="Địa chỉ nhận thông báo" error={emailError} />
<Badge variant="warning">Cần bổ sung</Badge>
<Modal
  open={open}
  onOpenChange={setOpen}
  title="Kiểm tra thông tin"
  description="Xem lại trước khi tiếp tục."
  trigger={<Button>Mở hộp thoại</Button>}
  footer={<Button onClick={() => setOpen(false)}>Hoàn tất</Button>}
>
  <Input label="Họ và tên" />
</Modal>
toast.success('Đã lưu thay đổi.');
```

- Button giữ variant/size cũ; `loading` khóa bấm, hiện spinner và `aria-busy`. Dùng nhãn có nghĩa khi loading.
- Input hỗ trợ thuộc tính input native/ref, label tự liên kết, hint/error qua `aria-describedby`, lỗi qua `aria-invalid`. Nếu dùng label bên ngoài, truyền `id` và `htmlFor` khớp nhau. Chỉ truyền lỗi sau khi tương tác/submit.
- Badge: `neutral | info | success | warning | danger`; luôn có nhãn chữ.
- Modal dùng Radix Dialog: portal, focus trap, Escape, nút đóng và trở về trigger; mobile toàn màn hình, nội dung cuộn bên trong. Trigger phải là một phần tử nhận ref (Button hỗ trợ).
- Toast giữ API của Sonner: success/error/warning/info/promise. Chỉ đặt một Toaster trong App.

## Hợp đồng Auth hiện tại

- `register({ username, email, password, fullName })`: POST `/api/v1/auth/register`, 201; không tạo phiên.
- `login({ usernameOrEmail, password })`: POST `/api/v1/auth/login`, nhận access token hợp lệ rồi lưu RAM.
- Refresh: POST `/api/v1/auth/refresh-token`, không body, transport riêng tránh đệ quy.
- `logout()`: POST `/api/v1/auth/revoke-token`, không body, Bearer + cookie. Chỉ xóa phiên/thông báo thành công khi nhận 204; 401 dùng luồng refresh/retry một lần.
- Cả bốn POST gửi `X-CSRF-Protection: 1`, `withCredentials: true`. FE không đọc/ghi Set-Cookie. JSON login/refresh được kiểm tra tokenType và thời hạn, không nhận refresh token từ JSON.
- Header landing và cả năm workspace dùng chung `UserDropdown`: danh tính thật và đăng xuất. Citizen ở landing thấy liên kết Cổng công dân; trong Cổng công dân thấy “Về trang chủ”. Role nội bộ không có liên kết trang chủ; chỉ hiện workspace khác được cấp quyền, ẩn workspace đang mở (kể cả alias tiếng Việt). Sidebar các workspace không còn avatar/tên tài khoản hay nút đăng xuất trùng.
- Mở menu không phát toast. `useLogout` chỉ báo “Đã đăng xuất.” sau khi thu hồi thành công; dùng một toast ID chung, khóa nút lúc chờ và giữ menu để thử lại khi thất bại.
- Web Locks tuần tự hóa request auth có cookie ở các tab cùng origin; BroadcastChannel xóa phiên cũ khi tab khác logout, khôi phục danh tính mới khi tab khác login. Không truyền token qua storage hoặc channel. Browser không có Web Locks chỉ được gom refresh trong một tab; chưa bảo đảm phối hợp đa tab/cross-origin FE trên browser đó.

### Môi trường local và kiểm thử cookie

Dùng FE `http://localhost:5173`, Gateway `http://localhost:5000`; không trộn `127.0.0.1` với `localhost`. BE phải cho phép origin FE chính xác, credentials và header CSRF ở cả Gateway/IAM. Production ưu tiên cùng site để cookie SameSite=Strict được gửi.

Vite đã cố định host `localhost`, port 5173 và strictPort (không tự nhảy sang 5174 khi cổng bận). Cấu hình riêng máy phát triển ở `.env.development.local`; file này được Git ignore và không áp dụng cho production build. `.env.example` chỉ là mẫu, không tự được Vite nạp. Sau khi thay `.env`, khởi động lại `npm run dev`.

Ngày 02/10/2026 đã xác minh bốn role nội bộ bằng tài khoản BE thật trên Edge tại localhost:5173 qua Vite proxy tới IAM Azure: login đúng workspace, F5 khôi phục phiên, cookie HttpOnly, logout thành công. Chưa kiểm tra FE production; không suy ra cookie production hoạt động chỉ từ local. Không trộn localhost và 127.0.0.1.

Playwright ghi đè `VITE_API_BASE_URL=http://localhost:5000` trong tiến trình Vite dành cho test để mock Auth không vô tình gọi server thật từ `.env` cá nhân.

Test auth mock dùng `http://localhost:4317`; các test UI cũ giữ `127.0.0.1:4317`. Nếu test với BE thật ở port 4317 phải thêm origin `http://localhost:4317` vào allowlist BE. Mock Playwright không chứng minh cấu hình CORS/CSRF server thật.

## Cấu hình JWT client

Điểm cấu hình duy nhất: `src/lib/api/index.ts`. `createJwtClient` nhận:
- `baseURL`: URL backend.
- `refreshAccessToken(transport)`: callback gọi endpoint refresh thật và trả về access token đã kiểm tra định dạng.
- `onSessionExpired`: xóa token và trạng thái Zustand; chuyển đăng nhập bằng `redirectToLogin` ngoài bootstrap. Khi bootstrap, public vẫn mở được, route guard xử lý trang riêng tư.
- `isRefreshSessionExpired`: adapter Auth chỉ coi 401 là hết phiên; 403 CSRF trả lỗi để kiểm tra cấu hình.
- `timeout`: mặc định 15 giây.

Callback được cung cấp Axios transport riêng không có interceptor JWT để không gây vòng lặp. Adapter thật tại `index.ts` dùng hợp đồng HttpOnly phía trên.

Ví dụ cấu trúc khi tái sử dụng client cho hợp đồng khác (không thay adapter Auth đang có):

```ts
const authClient = createJwtClient({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  refreshAccessToken: async (transport) => {
    // callRefreshEndpoint phải gọi bằng transport, không gọi authClient.api.
    const response = await callRefreshEndpoint(transport);
    return readAndValidateAccessToken(response);
  },
  onSessionExpired: redirectToLogin,
});
```

Luồng login/logout:
1. Gọi endpoint login với `{ skipAuth: true }` (không gắn JWT/không refresh khi sai mật khẩu).
2. Chỉ sau thành công thật, gọi `authClient.setAccessToken(accessToken)`.
3. Lấy danh tính IAM rồi điều hướng bằng `loginDestination(user.roles, returnTo)`; không suy đoán role từ username.
4. Dùng `logout()` chung; không tự clearSession trước khi API thu hồi xác nhận thành công.
5. Adapter cấu hình credentials/CSRF theo backend; không lưu refresh token trong JavaScript.

## Hành vi lỗi

- Request riêng tư gắn Bearer token hiện tại; `skipAuth` bỏ Authorization.
- 401: một refresh dùng chung cho các request đồng thời; mỗi request gửi lại tối đa một lần.
- 401 đến trễ dùng token vừa refresh, không gọi refresh thêm.
- Adapter Auth: refresh trả 401 hoặc request retry vẫn 401 thì xóa token, chuyển về đăng nhập. Refresh 403 không refresh tiếp và không coi là hết phiên; client generic mặc định vẫn hỗ trợ chính sách 401/403 cho caller cũ.
- Mất mạng, timeout hoặc 5xx khi refresh: trả lỗi cho nơi gọi, giữ phiên để người dùng thử lại.
- 403 từ request nghiệp vụ: trả lỗi phân quyền, không refresh.
- Đăng nhập phiên mới/logout trong lúc refresh: bỏ kết quả phiên cũ.
- Request bị hủy không được gửi lại.
- Base URL rỗng dùng origin hiện tại và cần reverse proxy `/api`. Không có refresh adapter: không gọi endpoint giả.
- Client này chỉ dùng cho backend đã cấu hình; URL khác origin bị chặn.
- Không tự retry 5xx/lỗi mạng ở request nghiệp vụ. UI nơi gọi chịu trách nhiệm hiển thị lỗi phù hợp.

## Vì sao chuyển về đăng nhập?

Người dùng cần xác thực lại để tiếp tục việc đang làm. Chuyển về landing sẽ làm họ mất ngữ cảnh. URL đăng nhập giữ `returnTo` nội bộ và hiển thị thông báo hết phiên rõ ràng; người dùng vẫn có link về trang chủ. `safeReturnTo` chặn URL ngoài và vòng lặp trang xác thực.

Form chỉ điều hướng sau login và tải danh tính IAM thành công; không tự coi validation FE là đăng nhập. Không bảo đảm giữ dữ liệu form chưa lưu qua lần chuyển trang. ReturnTo được kiểm tra URL nội bộ, sau đó ProtectedRoute kiểm tra quyền workspace; không thay thế phân quyền BE.

## Kiểm tra

```sh
npm run build
npm run lint
npm run test:e2e -- tests/auth.spec.ts tests/auth-session.spec.ts tests/jwt-client.spec.ts tests/design-system.spec.ts tests/landing.spec.ts
```

JWT được kiểm thử bằng Axios adapter giả lập, không cần server/API/token thật. Test UI kiểm tra bàn phím, focus, mô tả lỗi, loading, toast và mobile.
Tham khảo API interceptor chính thức: https://axios-http.com/docs/interceptors
