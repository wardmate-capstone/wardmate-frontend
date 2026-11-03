# Gửi BE: điều kiện nghiệm thu sao lưu và Verify

Ngày 03/11/2026. Người dùng yêu cầu **chỉ làm FE**, ghi lại lỗi để BE sửa; phiên này không sửa hoặc build BE. Các phát hiện dưới đây từ source local tại `E:/wardmate-backend`, không khẳng định bản Azure đang có cùng implementation.

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
