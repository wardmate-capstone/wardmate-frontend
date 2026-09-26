# Design System Core và JWT client

## Trạng thái hiện tại

- Core: Button, Input, Modal, Badge và Toast tại `src/components/ui`.
- Input đã được dùng trong đăng nhập/đăng ký. Các trang dùng Toast qua module chung.
- Modal/Badge dùng được ngay; ví dụ trực quan nằm tại `/tests/fixtures/ui.html` khi chạy Vite dev. Fixture không nằm trong bundle production.
- Chưa có backend: không tự gọi login/refresh, không tạo token giả và không xem form hợp lệ là đăng nhập thành công.
- API client chỉ hoạt động khi có `VITE_API_BASE_URL`. Sao chép giá trị cấu hình từ `.env.example` khi backend sẵn sàng.
- Access token chỉ ở bộ nhớ; tải lại trang sẽ mất token. Cơ chế khôi phục phiên/refresh cookie và “Ghi nhớ đăng nhập” sẽ nối sau khi có hợp đồng API.

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

## Nối backend sau này

Điểm cấu hình duy nhất: `src/lib/api/index.ts`. `createJwtClient` nhận:
- `baseURL`: URL backend.
- `refreshAccessToken(transport)`: callback gọi endpoint refresh thật và trả về access token đã kiểm tra định dạng.
- `onSessionExpired`: hiện dùng `redirectToLogin`.
- `timeout`: mặc định 15 giây.

Callback được cung cấp Axios transport riêng không có interceptor JWT để không gây vòng lặp. Endpoint, body, cookie/JSON và cách lấy token sẽ được bổ sung khi backend cung cấp; không tự giả định contract.

Ví dụ cấu trúc tích hợp (các adapter là phần cần triển khai theo API thật):

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

Khi nối login:
1. Gọi endpoint login với `{ skipAuth: true }` (không gắn JWT/không refresh khi sai mật khẩu).
2. Chỉ sau thành công thật, gọi `authClient.setAccessToken(accessToken)`.
3. Điều hướng bằng `navigate(safeReturnTo(searchParams.get('returnTo')), { replace: true })`.
4. Khi logout, gọi `authClient.clearSession()` và endpoint logout theo hợp đồng backend.
5. Nếu refresh cookie được chọn, adapter cần cấu hình credentials/CORS theo backend; không lưu refresh token vào localStorage theo suy đoán.

## Hành vi lỗi

- Request riêng tư gắn Bearer token hiện tại; `skipAuth` bỏ Authorization.
- 401: một refresh dùng chung cho các request đồng thời; mỗi request gửi lại tối đa một lần.
- 401 đến trễ dùng token vừa refresh, không gọi refresh thêm.
- Refresh trả 401/403 hoặc request retry vẫn 401: xóa token, chuyển về đăng nhập.
- Mất mạng, timeout hoặc 5xx khi refresh: trả lỗi cho nơi gọi, giữ phiên để người dùng thử lại.
- 403 từ request nghiệp vụ: trả lỗi phân quyền, không refresh.
- Đăng nhập phiên mới/logout trong lúc refresh: bỏ kết quả phiên cũ.
- Request bị hủy không được gửi lại.
- Không có base URL: báo thiếu cấu hình trước khi gửi request. Không có refresh adapter: không gọi endpoint giả.
- Client này chỉ dùng cho backend đã cấu hình; URL khác origin bị chặn.
- Không tự retry 5xx/lỗi mạng ở request nghiệp vụ. UI nơi gọi chịu trách nhiệm hiển thị lỗi phù hợp.

## Vì sao chuyển về đăng nhập?

Người dùng cần xác thực lại để tiếp tục việc đang làm. Chuyển về landing sẽ làm họ mất ngữ cảnh. URL đăng nhập giữ `returnTo` nội bộ và hiển thị thông báo hết phiên rõ ràng; người dùng vẫn có link về trang chủ. `safeReturnTo` chặn URL ngoài và vòng lặp trang xác thực.

Hiện mới giữ đích quay lại; việc thực sự đăng nhập và điều hướng sau thành công chờ API thật. Không bảo đảm giữ dữ liệu form chưa lưu qua lần chuyển trang.

## Kiểm tra

```sh
npm run build
npm run lint
npm run test:e2e -- tests/jwt-client.spec.ts tests/design-system.spec.ts tests/landing.spec.ts
```

JWT được kiểm thử bằng Axios adapter giả lập, không cần server/API/token thật. Test UI kiểm tra bàn phím, focus, mô tả lỗi, loading, toast và mobile.
Tham khảo API interceptor chính thức: https://axios-http.com/docs/interceptors
