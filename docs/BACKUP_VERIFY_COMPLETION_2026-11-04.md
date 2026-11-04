# Hoàn thiện Verify sao lưu — 04/11/2026

## Phạm vi

Người dùng báo BE đã sửa, yêu cầu đọc BE/FE và hoàn thiện. Đã đọc tài liệu bàn giao, controller, DTO, Verify và worker. Lần kiểm tra đầu source BE local còn cũ nên đã đối chiếu repository GitHub nhánh main. Sau khi người dùng tải bản mới về, đã đọc lại BE local và tính blob SHA bằng nội dung chuẩn hóa LF: cả bốn file bên dưới khớp hoàn toàn bản GitHub đã đọc. Không chạy Git để đồng bộ repo BE và không sửa BE.

## Bản sửa đã đối chiếu

Repository: https://github.com/wardmate-capstone/wardmate-backend/tree/main/src/Services/WardMate.Services.AnalyticsSystem

Các SHA sau là blob SHA của file đã đọc, không phải commit SHA:
- Infrastructure/SystemBackups.cs: 62126baf44473a41d124039c502415f50260eefa.
- Infrastructure/SystemBackupWorker.cs: 3d577ea08889cb566bd8afd8177e05ff7113fc9f.
- Application/SystemBackupContracts.cs: 3435a25afd3f579413f12a47b0a102531f8ed906.
- API/Controllers/SystemBackupsController.cs: 811e2e409c718ae657a8da52d77db5f6b8a6f4fd.

BE đã chặn thiếu Blob client, tải đầy đủ stream (không phụ thuộc seek), kiểm tra kích thước thực so metadata và giới hạn cấu hình, tính SHA-256, rồi pg_restore --file=- đọc toàn bộ archive ra Stream.Null. Chỉ thành công mới ghi Verified; lỗi trong quá trình kiểm tra trả Succeeded, xóa VerifiedAtUtc và lưu errorCode. Verify/retention dùng chung advisory lock. Worker bắt buộc Blob client và pg_dump, đã bỏ managed snapshot chỉ có header/danh sách bảng; chỉ báo Succeeded sau upload thành công.

Đây là kiểm tra toàn vẹn và khả năng giải mã archive; không kết nối DB hay chạy restore drill. RestoreTestedAtUtc vẫn là mốc riêng. Source mới giải quyết các lỗi đã nêu; chưa khẳng định bản Azure đã triển khai cùng source hoặc nghiệm thu Blob/pg_restore thật.

## Kế hoạch và thay đổi FE

1. Giữ API hiện có: GET list/detail, POST create trả 202, POST verify trả 200; role IT_ADMIN và cache theo user. Không tạo endpoint restore/download.
2. Bỏ cảnh báo lỗi BE đang chờ sửa; mô tả đúng kiểm tra kích thước/SHA-256/pg_restore và phân biệt thử khôi phục. Badge Verified là “Đã xác minh tệp”; toast thành công chỉ xuất hiện sau response hợp lệ.
3. Response Verify phải đúng ID/status, timestamp có giá trị, SHA-256, sizeBytes>0 và errorCode=null. Kiểm tra DTO không thay thế việc đọc tệp tại máy chủ.
4. FE chờ POST Verify tối đa 330 giây, tương ứng BE tối đa 5 phút cho tải/kiểm tra cộng khoảng lưu lỗi. Hiện tiến trình và giữ cửa sổ khi chờ; không tự retry POST. Gateway/hosting vẫn cần cho phép request dài tương ứng, chưa đo môi trường thật.
5. Sau lỗi hoặc kết quả không chắc chắn: đọc lại dữ liệu; khóa xác minh đến khi người dùng làm mới chi tiết thành công. Không giữ badge xác minh cũ nếu BE đã hạ trạng thái sau lần kiểm tra thất bại.
6. Ánh xạ lỗi mới: storage_unavailable, verification_busy, size_limit, size_mismatch, verifier_unavailable, verification_timeout, verification_unavailable (đều có tiền tố system.backup_).
7. Test mock metadata sai, thử lại sau lỗi, trạng thái đổi trước POST, re-verify thất bại, bảy mã lỗi mới, polling, quyền/mobile và health. Chạy typecheck/lint/build; kết quả cuối trong PROGRESS.

## Điều còn cần theo dõi

- Đã xác nhận bốn file backup/Verify tại E:/wardmate-backend khớp bản sửa GitHub; không còn chờ cập nhật source local. Đối chiếu source không thay thế nghiệm thu thực thi.
- Cần vận hành re-verify các bản Verified tạo bởi implementation cũ; không suy rằng bản ghi cũ đã được kiểm tra bằng pg_restore mới.
- Chưa test Azure với tài khoản IT_ADMIN/Blob thử nghiệm, chưa build/test BE mới tại local, chưa kiểm tra gateway timeout hay restore drill. Không cần người dùng gửi token/key vào chat.
- FE hiện ở f20d2b0, đồng bộ origin/main khi đọc lại; các thay đổi Verify đang staged và AiChatWidget có thay đổi riêng chưa staged. Giữ nguyên index và thay đổi của người khác; không commit/push khi chưa được yêu cầu mới.

## Kết quả đọc lại BE local sau khi người dùng cập nhật

Bốn blob SHA trùng khớp danh sách nguồn ở trên; DTO/route/status và bảy mã lỗi mới tương thích FE đã triển khai. Không phát sinh thay đổi code mới trong lượt đọc lại. Kết quả 14/14 mock, typecheck/lint/build là của lượt triển khai trước, không báo là vừa chạy lại. Lượt này chỉ đối chiếu source/hash, kiểm tra tài liệu và diff.

## Rà soát và sửa lỗi tích hợp — 04/11/2026

Phát hiện lúc chạy kiểm tra mới: AiChatWidget.tsx mở section cho cửa sổ chat nhưng đóng bằng fragment, khiến typecheck/Vite lỗi và toàn ứng dụng không tải được. Kế hoạch: sửa đúng thẻ đóng, giữ nội dung/nhãn chatbot; chạy lại typecheck/lint, kiểm thử sao lưu/Verify và hồi quy chatbot công khai/audit/cấu hình, rồi build. Lượt browser trước sửa bị dừng vì ứng dụng chưa biên dịch, không tính là đã kiểm thử đạt. Không sửa BE hoặc thay đổi index Git.

Đã sửa thẻ đóng section của chatbot, typecheck/lint chạy mới đạt. Bộ Playwright Edge trên workspace tích hợp hiện tại: **40/40 ca đạt trong một lượt**, gồm admin-system-operations, admin-system-audit, admin-system-settings và public-search-chat. Phát hiện thêm cấu hình Gateway chưa đặt ActivityTimeout cho Analytics; chi tiết và yêu cầu BE/DevOps ở BE_REQUEST_BACKUP_VERIFICATION_2026-11-03.md. Build cuối được ghi tại PROGRESS sau khi hoàn tất.

Kết thúc lượt sửa: npm run build đạt (còn cảnh báo annotation dependency/chunk lớn hiện có); typecheck/lint và 40/40 ca Playwright mock đều đạt. Đối chiếu diff staged/unstaged đạt; không đổi index hoặc commit/push.
