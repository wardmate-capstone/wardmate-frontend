# Phương án tích hợp Auth — đã chốt phạm vi rút gọn

Ngày: 01/10/2026. **Người dùng đã yêu cầu triển khai 4 API Auth.**

## Quyết định mới nhất — ưu tiên hơn bản đề xuất bên dưới

- Xác nhận hợp đồng HttpOnly và Gateway local `http://localhost:5000`.
- Chỉ nối register, login, refresh-token, revoke-token. Bỏ qua roles/permissions, `/users/me`, route guard và điều hướng theo role trong task này.
- Giữ nguyên checkbox “Ghi nhớ đăng nhập”, chưa nối logic; không vô hiệu hóa như đề xuất cũ.
- Tái sử dụng JWT client, không thêm AuthContext. Access token ở RAM, refresh theo nhu cầu khi API có xác thực trả 401, kể cả sau reload; không tự gọi API lúc mở trang công cộng.
- Login về returnTo an toàn hoặc `/`; register thành công chuyển sang login. Trạng thái triển khai/kiểm tra cuối cùng xem [PROGRESS.md](PROGRESS.md).

Phần dưới lưu lại phân tích ban đầu; các mục chờ duyệt, `/me`, role guard và vô hiệu hóa checkbox không còn là phạm vi thực hiện hiện tại.

## 1. Phạm vi và nguồn thông tin

Yêu cầu của bạn: nối Auth BE vào FE đã có, không lưu token trong localStorage, giữ UI tối đa; chỉ triển khai sau khi bạn đồng ý.

Đã đọc `auth_api_integration_plan.md` và `iam-httponly.md` từ Downloads, đối chiếu code local. Nội dung trong tài liệu là nguồn tham khảo/hợp đồng cần xác nhận, không phải quyền tự triển khai hoặc chạy các script BE trong tài liệu.

**Có xung đột cần chốt:** request bạn dán và kế hoạch cũ dùng refresh token trong JSON; `iam-httponly.md` tự mô tả là hợp đồng mới, dùng cookie HttpOnly. Đề xuất dùng hợp đồng HttpOnly sau khi bạn xác nhận đó là bản BE đang chạy. Không tự hỗ trợ song song hai cách hoặc fallback lưu token vào storage.

Git lúc kiểm tra: `main`, HEAD `d9ce7fd`, working tree sạch, đang sau `origin/main` 2 commit theo ref local; chưa fetch/pull. Trước triển khai phải đối chiếu lại hai commit này để tránh làm trên code cũ.

## 2. Hiện trạng đã xác minh ở FE

- `src/pages/auth/AuthPage.tsx` mới kiểm tra form rồi báo hợp lệ, chưa gọi API. Cả đăng nhập và đăng ký đều ghi “Số điện thoại hoặc email”.
- `src/lib/api/createJwtClient.ts` đã giữ access token trong RAM, gom refresh đồng thời trong một client, retry một lần, chặn kết quả refresh phiên cũ và request bị hủy. Chưa có thao tác khôi phục phiên công khai để startup dùng chung.
- `src/lib/api/index.ts` chưa nối refresh adapter. `src/lib/authRedirect.ts` đã có returnTo nội bộ an toàn.
- `src/app/App.tsx` chưa bọc route riêng tư bằng kiểm tra phiên/quyền; chưa có AuthProvider. Các nút đăng xuất tìm thấy ở Citizen, Officer, Manager, Procedure Manager mới thông báo/điều hướng.
- Checkbox “Ghi nhớ đăng nhập” chưa có logic. Password input hiện áp dụng tối thiểu 8 ký tự cả khi login; cần đối chiếu chính sách BE, tránh chặn mật khẩu đăng nhập hợp lệ theo quy tắc đăng ký.
- Playwright dùng Edge, FE tại `http://127.0.0.1:4317`; tài liệu BE chỉ liệt kê origin `http://localhost:5173` và `http://localhost:3000`.

## 3. Phương án token và bảo mật đề xuất

**Access token ở RAM; refresh token ở cookie HttpOnly do BE đặt.** Không lưu token vào localStorage, sessionStorage, IndexedDB, URL hoặc log. Không mã hóa token trong storage như một cách thay thế.

Cookie theo tài liệu BE: `refreshToken`, HttpOnly, host-only, Path `/api/v1/auth`, SameSite=Strict mặc định, Secure ngoài môi trường development. FE dùng `withCredentials: true` cho auth; JavaScript không đọc/ghi cookie HttpOnly hoặc đọc Set-Cookie. Reload sẽ lấy access token mới bằng cookie rồi tải user. Đây là đề xuất dựa trên bàn giao, chưa kiểm chứng server thật. [MDN Set-Cookie](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie).

HttpOnly **không chống XSS tuyệt đối**: mã độc cùng trang vẫn có thể gửi request bằng phiên người dùng và sử dụng access token trong RAM. Cần tiếp tục phòng XSS, tránh render HTML không tin cậy và không đưa secret vào bundle FE. Nhận định “tuyệt đối” và gợi ý sessionStorage mã hóa trong kế hoạch cũ không được áp dụng.

**Không thể giấu request khỏi tab Network của chính người dùng.** Biết URL API không đồng nghĩa có quyền sửa hệ thống. BE phải xác minh token, kiểm tra quyền thao tác và quyền trên từng bản ghi ở mọi request, không tin role/userId do FE tự gửi. Route guard và ẩn nút chỉ hỗ trợ trải nghiệm. [OWASP Authorization](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html).

CORS hạn chế trình duyệt đọc response xuyên origin; không ngăn curl/Postman gọi API và không thay thế phân quyền. Với cookie, cần origin cụ thể, credentials và kiểm tra CSRF phía server. [MDN CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS).

Đề xuất triển khai production qua HTTPS và Gateway/proxy cùng site để phù hợp SameSite=Strict. Proxy có thể che địa chỉ upstream nhưng request tới proxy vẫn hiện trên Network. BFF giữ cả token ở server là lựa chọn khác nếu cần giảm token tiếp xúc với JavaScript, nhưng đòi hỏi backend/session riêng; chưa cần thêm vào phạm vi này. Rate limit, kiểm tra đầu vào, audit và phân quyền server là trách nhiệm BE; không coi đã có chỉ vì tài liệu đề xuất.

## 4. Hợp đồng dự kiến áp dụng sau xác nhận

Tất cả bốn POST có header `X-CSRF-Protection: 1` và credentials. Header này không phải secret; BE phải kiểm tra Origin/allowlist như tài liệu mô tả.

| API | Body | Kết quả/hành vi |
|---|---|---|
| POST `/api/v1/auth/register` | `username`, `email`, `password`, `fullName` | 201 user/profile/roles/permissions; chưa đăng nhập |
| POST `/api/v1/auth/login` | `usernameOrEmail`, `password` | 200 access token và thời hạn trong JSON; refresh qua Set-Cookie |
| POST `/api/v1/auth/refresh-token` | Không body | 200 access token mới; BE xoay cookie refresh |
| POST `/api/v1/auth/revoke-token` | Không body | Bearer + cookie; 204 và xóa cookie |

JSON login/refresh dự kiến có `accessToken`, `accessTokenExpiresAt`, `refreshTokenExpiresAt`, `tokenType`; **không có `refreshToken`**. Kiểm tra response trước khi nhận phiên, không coi HTTP 200 với dữ liệu sai là thành công.

Tài liệu HttpOnly nhắc GET `/api/v1/users/me` để lấy user/roles/permissions, nhưng chưa cung cấp schema đầy đủ, khả năng null hoặc tên role chính thức. Cần bổ sung trước phần user/route theo quyền; không tự lấy response đăng ký làm bằng chứng schema `/me`, không tự giải mã JWT để đoán role.

## 5. UI sẽ thay đổi tối thiểu như thế nào?

| Vị trí | Thay đổi dự kiến |
|---|---|
| Đăng ký | Thay ô “Số điện thoại hoặc email” bằng “Tên đăng nhập” và “Email”; giữ Họ và tên, Mật khẩu, Xác nhận mật khẩu, điều khoản |
| Đăng nhập | Đổi nhãn/placeholder thành “Tên đăng nhập hoặc email”; giữ bố cục |
| Submit | Nối API, loading/chống gửi lặp, lỗi tiếng Việt bằng Input/Toast chung; giữ dữ liệu cần thiết khi lỗi, không trim password |
| Đăng ký thành công | Chuyển sang đăng nhập, giữ returnTo; không tự coi user đăng ký là đã có phiên |
| Đăng xuất | Nối hành vi thật vào các nút hiện có, giữ thiết kế |
| Ghi nhớ đăng nhập | Đề xuất vô hiệu hóa kèm giải thích ngắn cho đến khi BE hỗ trợ chính sách tương ứng |

Không thêm CCCD, điện thoại, ngày sinh, giới tính, địa chỉ vào form đăng ký chỉ vì response có các trường đó. Không sửa màu, font, animation, dashboard hoặc bố cục workspace. Không nối quên/đặt lại mật khẩu, VNeID hay API hồ sơ ngoài phạm vi đã cấp.

Cookie hiện có Expires do BE quyết định và login không có `rememberMe`; vì vậy checkbox không thể tự điều khiển thời gian phiên. Khôi phục sau F5 và “Ghi nhớ đăng nhập” là hai yêu cầu khác nhau. Nếu cần checkbox hoạt động thật, phải thống nhất thêm hợp đồng với BE.

## 6. Các bước triển khai sau duyệt

1. **Chốt contract và môi trường:** bản HttpOnly đang chạy, base URL, schema `/me`, lỗi/validation, role mapping. Local đề xuất FE `localhost:5173` → Gateway `localhost:5000`. Test tích hợp cookie dùng localhost nhất quán và thêm origin test chính xác vào allowlist của cả IAM/Gateway, hoặc cấu hình proxy phù hợp. Không tự bật wildcard/đổi Strict thành None.
2. **Nối API trên Axios sẵn có:** DTO và hàm auth gọn tại `src/lib/api/`; tái sử dụng client thay vì tạo tầng service trùng lặp. Register/login dùng `skipAuth`; refresh dùng transport riêng để không đệ quy. Credentials/CSRF giới hạn vào request cần thiết.
3. **Quản lý phiên dùng chung:** một provider/hook nhỏ chứa user và trạng thái đang khôi phục/đã đăng nhập/chưa đăng nhập/lỗi tạm thời. Không giữ bản sao token trong nhiều state. Startup refresh và interceptor dùng cùng cơ chế gom request; tránh refresh đôi do React StrictMode.
4. **Login và khôi phục:** nhận token → tải `/me` → công bố phiên → điều hướng returnTo đã kiểm tra, đồng thời kiểm tra quyền đích đến. Nếu không có returnTo, dùng trang mặc định theo mapping role được xác nhận. Không hiện nội dung riêng tư trước khi khôi phục xong; khách truy cập trang công cộng không bị đá sang login chỉ vì thiếu cookie.
5. **Refresh và lỗi:** giữ retry tối đa một lần và chống kết quả phiên cũ. 401 invalid token kết thúc phiên; lỗi mạng/5xx không giả là hết phiên. Phân biệt 403 `iam.csrf_rejected` là lỗi CSRF/cấu hình, không lặp refresh hoặc hiển thị sai thành “hết phiên”; đây là điểm cần điều chỉnh vì client hiện coi cả 401/403 từ refresh là hết phiên. ProblemDetails cần mapping an toàn theo schema thật.
6. **Nhiều tab và logout:** phối hợp refresh/login/logout xuyên tab vì cookie dùng chung và có rotation. Ưu tiên Web Locks/BroadcastChannel nếu browser mục tiêu hỗ trợ; kiểm thử hai tab và không dùng storage chứa token. Khóa tuần tự request chưa đủ để xử lý kết quả cũ: phải kiểm tra thay đổi phiên và ngăn refresh khôi phục lại sau logout. Chi tiết fallback phụ thuộc browser được hỗ trợ.
7. **Đăng xuất thật:** gọi revoke khi còn Bearer, nếu 401 thì refresh rồi retry một lần; sau thành công xóa RAM/user và đồng bộ tab. Khi request thất bại, báo chưa thu hồi được phía server và cho thử lại; không chỉ xóa RAM rồi báo thành công, vì cookie có thể đăng nhập lại sau reload. Theo tài liệu, access token đã phát còn hiệu lực đến hết hạn do chưa có blacklist.
8. **Route và user:** sau khi có `/me`/role mapping, bọc các route riêng tư và alias hiện có trong `App.tsx`, kiểm tra quyền trước khi render. Thay thông tin tài khoản giả tại điểm hiển thị phiên bằng user thật, giữ layout; không biến dữ liệu hồ sơ demo thành dữ liệu thật. Các nút logout hiện có dùng một hành vi chung.

File dự kiến: `src/lib/api/index.ts`, `createJwtClient.ts`, module auth/provider gọn mới, `src/pages/auth/AuthPage.tsx`, `src/app/App.tsx`, các điểm tài khoản/logout liên quan, cấu hình mẫu/test và tài liệu. Chỉ sửa helper redirect nếu luồng thật cần, không refactor toàn dự án, không thêm dependency dự kiến.

## 7. Tiêu chí kiểm tra và bàn giao

- Chạy typecheck, lint, build; test JWT, design-system, landing và test auth phù hợp bằng Playwright đang có.
- Kiểm tra payload đúng, login sai không refresh, register không tự login, response sai không nhận phiên, returnTo ngoài bị chặn, tài khoản không đủ quyền không vào workspace.
- Kiểm tra F5, refresh đồng thời, 401 đến trễ, refresh thất bại, 403 CSRF, logout khi access token hết hạn, logout lỗi mạng, refresh đang chạy lúc logout/đổi tài khoản và hai tab dùng chung cookie.
- Kiểm tra UI mobile/desktop sau bổ sung email/username; không tràn, loading và lỗi có thể tiếp cận bằng bàn phím.
- Với BE thật và tài khoản test được cấp: xác minh Cookie/Set-Cookie, credentials, CORS/CSRF, rotation, `/me`, reload/logout; không lưu token/mật khẩu vào artifact/log hoặc commit. Mock không chứng minh cookie HttpOnly/SameSite hoạt động thật.
- Chỉ báo “tích hợp thật” sau kiểm tra thực tế; ghi rõ phần chỉ mock và giới hạn. Cập nhật `docs/PROGRESS.md`, không tự commit/push/deploy.

## 8. Thông tin cần bạn xác nhận trước khi làm code

1. BE đang chạy **đúng bản HttpOnly trong `iam-httponly.md`** và dùng Gateway `http://localhost:5000`, hay vẫn là API JSON bạn dán? Nếu khác, cung cấp URL môi trường sẽ tích hợp.
2. Cung cấp Swagger/schema GET `/api/v1/users/me`, tên role/permission và trang mặc định tương ứng (kể cả tài khoản nhiều role), cùng quy tắc username/password và mẫu ProblemDetails. Không cần gửi mật khẩu/token trong tài liệu.
3. Bạn duyệt phạm vi trên, gồm route guard theo role sau khi có mapping, và tạm vô hiệu hóa “Ghi nhớ đăng nhập” do BE chưa có lựa chọn này chứ?

**Điểm dừng:** chưa sửa mã nguồn cho đến khi bạn duyệt. Những thông tin chưa chốt sẽ không được tự suy đoán để triển khai.
