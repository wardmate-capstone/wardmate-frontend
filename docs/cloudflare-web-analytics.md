# Cloudflare Web Analytics cho FE

Website: https://wardmate-frontend.vercel.app/

1. Trong Cloudflare, mở **Web Analytics → Add a site**, nhập `wardmate-frontend.vercel.app`.
2. Trong **Manage site**, lấy giá trị `token` trong `data-cf-beacon` của script được cấp. Đây là mã nhận diện site công khai, không phải Cloudflare API token. Không chép mã thật vào tài liệu hoặc commit.
3. Trong project Vercel, mở **Settings → Environment Variables**, thêm `VITE_CLOUDFLARE_WEB_ANALYTICS_TOKEN` với mã trên, chỉ chọn môi trường **Production**.
4. Deploy source có thay đổi Analytics và build lại. Vite đọc biến lúc build; đổi biến trên Vercel cần redeploy.
5. Mở website production, kiểm tra Network có tải `https://static.cloudflareinsights.com/beacon.min.js`; chuyển trang và kiểm tra request Analytics. Sau vài phút, kiểm tra dashboard Cloudflare có dữ liệu.

`src/main.tsx` nạp script bất đồng bộ ngoài React để tránh StrictMode nạp hai lần. Chỉ bật khi `import.meta.env.PROD` và mã không rỗng; dev và build thiếu mã không tải script. Cloudflare tự hỗ trợ điều hướng SPA, không cần thêm listener vào React Router.

Không bật thêm cơ chế tự chèn script của Cloudflare khi dùng cách này. Không gửi thêm thông tin tài khoản, nội dung biểu mẫu hoặc tệp hồ sơ. Trình chặn quảng cáo có thể ngăn script/request Analytics, nên số liệu không bảo đảm bao gồm mọi lượt truy cập.

Không thay đổi DNS, hosting Vercel, API, cookie hoặc BE. Để tắt, xóa biến môi trường rồi build/deploy lại.

Tài liệu: https://developers.cloudflare.com/web-analytics/get-started/ và https://developers.cloudflare.com/web-analytics/get-started/web-analytics-spa/
