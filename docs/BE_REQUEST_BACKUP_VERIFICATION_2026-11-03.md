# Gửi BE: điều kiện nghiệm thu sao lưu và Verify

## Cập nhật 04/11/2026 — đã đối chiếu bản sửa GitHub

Source local E:/wardmate-backend lúc kiểm tra đầu còn cũ; sau khi người dùng cập nhật, đã đọc lại và xác nhận bốn file Verify/worker/DTO/controller khớp các blob SHA của bản sửa GitHub. Đã đọc SystemBackups/worker/controller/DTO trực tiếp trên wardmate-capstone/wardmate-backend nhánh main bằng công cụ GitHub. Bản mới chặn thiếu kho lưu, kiểm tra size/SHA-256, giải mã toàn bộ archive bằng pg_restore; worker bỏ managed snapshot và bắt buộc upload thành công. Các lỗi source ở mục 1–2 dưới đây là ghi nhận lịch sử, đã được xử lý trong bản main vừa đọc. Chi tiết blob SHA, FE, kiểm thử và giới hạn: BACKUP_VERIFY_COMPLETION_2026-11-04.md.

Không đồng nhất kiểm tra tệp với thử khôi phục. Chưa nghiệm thu Azure/Blob thật hoặc xác nhận deployment; cần re-verify các bản Verified từ implementation cũ. FE đã cập nhật thông báo, timeout, lỗi mới và kiểm tra response.

Ngày 03/11/2026. Người dùng yêu cầu **chỉ làm FE**, ghi lại lỗi để BE sửa; phiên này không sửa hoặc build BE. Các phát hiện dưới đây từ source local tại `E:/wardmate-backend`, không khẳng định bản Azure đang có cùng implementation.

## Bổ sung rà soát Gateway — 04/11/2026

Đã đọc WardMate.YarpGateway (YARP 2.3.0): Program.cs dùng LoadFromConfig, cả appsettings.json và appsettings.Production.json đều không đặt HttpRequest.ActivityTimeout cho cluster analytics-system. Trong khi đó POST Verify chỉ trả response khi kiểm tra xong, BE cho phép tối đa 5 phút, FE chờ 330 giây.

Theo [tài liệu Microsoft về YARP timeout](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/timeouts), ActivityTimeout mặc định là 100 giây khi không có hoạt động truyền nhận. Nếu môi trường triển khai không có override, Verify chờ xử lý lâu có thể bị Gateway ngắt trước khi BE hoàn tất. Đây là phát hiện về cấu hình source, chưa tái hiện timeout production và chưa đọc cấu hình bí mật môi trường.

Đề nghị BE/DevOps đặt ReverseProxy:Clusters:analytics-system:HttpRequest:ActivityTimeout phù hợp ngân sách xử lý (ví dụ 00:05:30), kiểm tra cả cấu hình môi trường/ingress và thử request Verify >100 giây bằng dữ liệu thử nghiệm. Không chỉ tăng timeout Axios ở FE. Nếu hạ tầng không cho phép request dài, cần đổi Verify sang xử lý nền có endpoint theo dõi; không tự đặt hợp đồng mới ở FE. Phiên này giữ phạm vi chỉ sửa FE, không đổi cấu hình BE.

## 1. Verify có thể ghi nhận thành công khi chưa kiểm tra file

File: `src/Services/WardMate.Services.AnalyticsSystem/WardMate.Services.AnalyticsSystem.Infrastructure/SystemBackups.cs`, method `Verify`.

- Khi `IBlobStorageClient` không có, `File.Exists(StorageObjectName)` là false và `SystemBackups:RunnerProvisioned=true`, không nhánh nào báo lỗi. Luồng vẫn đặt `VerifiedAtUtc`, `Status="Verified"` và xóa ErrorCode.
- Nhánh Blob chỉ kiểm tra `PGDMP` khi `stream.CanSeek=true`; trường hợp đọc ít hơn 5 byte không bị từ chối. Nhánh local chỉ so checksum, chưa kiểm tra header.
- FE không đọc được file backup private, không thể bù bằng hash response hoặc nút xác nhận người dùng.

Đề nghị: chỉ đặt Verified sau khi thực sự đọc được file và hoàn tất các bước kiểm tra được cam kết. Khi không có kho/file hoặc không đọc được phải trả lỗi rõ và không ghi Verified mới. Kiểm tra đủ header cả stream seek/non-seek và local; file ngắn/không phải PGDMP phải thất bại. Không giữ thông tin “xác minh thành công mới” sau lần kiểm tra lỗi. Giữ route và DTO hiện có nếu không cần thay đổi hợp đồng.

## 2. Worker có thể báo Succeeded khi không upload

File cùng thư mục: `SystemBackupWorker.cs`, method `ProcessNextBackupJobAsync`.

- Chỉ upload khi `blobClient is not null`, nhưng nhánh không có client vẫn đặt Succeeded, StorageObjectName theo object name, SizeBytes/Sha256 và CompletedAtUtc.
- Khối finally xóa file tạm; trường hợp đó chưa có bằng chứng còn một bản lưu bền vững.

Đề nghị: khi không có nơi lưu đã provision thì thất bại trước khi báo Succeeded; nếu hỗ trợ lưu local thì phải dùng đường dẫn lưu bền vững rõ ràng và không xóa chính bản lưu trong cleanup tạm.

## 3. Hợp đồng và nghiệm thu cần xác minh

- POST `/api/v1/system/backups` thực tế trả 202 theo controller, Swagger hiện chỉ mô tả 200; POST `/api/v1/system/health/check-now` tương tự. Đề nghị bổ sung status/DTO OpenAPI.
- Verify trả 200 không chứng minh đã restore test. DTO có `RestoreTestedAtUtc` riêng; FE hiển thị “Chưa có thông tin thử khôi phục” khi null.
- Cần kiểm tra thật: Blob tồn tại/mất file, checksum sai, header sai/ngắn, stream không seek, local store nếu có, thiếu Blob client với runner=true, và worker thiếu kho lưu. Không dùng dữ liệu production thật để test các ca phá hỏng file.
- Cần BE/DevOps xác nhận migrations, cờ Enabled/RunnerProvisioned, targets, Blob và worker đã deploy trước nghiệm thu thật. Không gửi connection string hoặc key vào tài liệu FE.

FE đã gắn nút yêu cầu Verify, có thông báo giới hạn trước thao tác; kết quả chỉ ghi “Máy chủ ghi nhận đã xác minh”. Chưa nghiệm thu bảo đảm toàn vẹn/khôi phục trước khi BE sửa và deploy.
