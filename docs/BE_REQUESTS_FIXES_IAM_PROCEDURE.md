# Tổng hợp các điểm cần Backend (BE) kiểm tra và điều chỉnh

*Ngày tạo: 03/11/2026 · Frontend Team tổng hợp gửi Backend Team*
*Đã đối chiếu trực tiếp mã nguồn Backend tại `D:/wardmate-backend`*

---

## 1. Dịch vụ IAM: Sửa lỗi tìm kiếm tài khoản người dùng (`UserDirectory.cs`)

- **Vị trí tệp:**  
  `src/Services/WardMate.Services.IAM/WardMate.Services.IAM.Infrastructure/Persistence/UserDirectory.cs` (Dòng 24–29)
- **Hiện tượng:**  
  Người dùng/Admin tìm kiếm theo tên đăng nhập (`Username`) hoặc gõ ký tự đặc biệt như `@username` thì API `GET /api/v1/admin/users?search=...` trả về 0 kết quả. Chỉ khi gõ đúng Họ và tên thật (`Profile.FullName`) hoặc đúng `Email` thì mới tìm thấy.
- **Nguyên nhân mã nguồn:**  
  Câu truy vấn LINQ hiện tại bỏ quên kiểm tra trường `x.Username`:
  ```csharp
  // Code hiện tại trong UserDirectory.cs
  if (!string.IsNullOrWhiteSpace(f.Search))
  {
      var pattern = "%" + f.Search.Trim().Replace("\\", "\\\\").Replace("%", "\\%").Replace("_", "\\_") + "%";
      q = q.Where(x => EF.Functions.ILike(x.Email, pattern, "\\") || x.Profile != null &&
          (EF.Functions.ILike(x.Profile.FullName, pattern, "\\") || x.Profile.IdentityNumber != null && EF.Functions.ILike(x.Profile.IdentityNumber, pattern, "\\")));
  }
  ```
- **Giải pháp BE cần sửa:**  
  Bổ sung điều kiện tìm kiếm trên `x.Username`:
  ```csharp
  q = q.Where(x => EF.Functions.ILike(x.Username, pattern, "\\") ||
                   EF.Functions.ILike(x.Email, pattern, "\\") ||
                   x.Profile != null && (
                       EF.Functions.ILike(x.Profile.FullName, pattern, "\\") ||
                       (x.Profile.IdentityNumber != null && EF.Functions.ILike(x.Profile.IdentityNumber, pattern, "\\"))
                   ));
  ```

---

## 2. Dịch vụ AI-OCR & Procedure Catalog: Trích xuất thiếu bảng "Cách thức thực hiện" (`submissionMethods`)

- **Vị trí tệp:**  
  `src/Services/WardMate.Services.AIOCR/WardMate.Services.AIOCR.Infrastructure/Extraction/AzureProcedureDocumentExtractor.cs`  
  `src/Services/WardMate.Services.ProcedureCatalog/WardMate.Services.ProcedureCatalog.Application/Drafts/ProcedureDraftService.cs`
- **Hiện tượng:**  
  Tệp PDF gốc công bố thủ tục (ví dụ: `thu-tuc-dang-ky-khai-tu.pdf` trang 7/9) có bảng *"CÁCH THỨC THỰC HIỆN"* rất rõ ràng với 3 hình thức:
  - *Trực tuyến* (Thời hạn: 1 ngày, Phí: Miễn phí)
  - *Qua bưu điện* (Thời hạn: 1 ngày, Phí: Miễn phí)
  - *Trực tiếp* (Thời hạn: 1 ngày, Phí: Miễn phí)  
  Tuy nhiên, khi bóc tách sang dữ liệu JSON của thủ tục, trường `contentPayload.submissionMethods` lại ra mảng rỗng `[]`.
- **Hệ quả:**  
  Giao diện công dân không có danh sách các hình thức nộp để hiển thị, phải dùng fallback text đơn điệu.
- **Giải pháp BE cần cải thiện:**  
  1. Cập nhật prompt trích xuất của Azure AI-OCR để nhận diện chính xác bảng biểu có tiêu đề *"CÁCH THỨC THỰC HIỆN"* và đưa vào mảng `submissionMethods` gồm `{ methodName, feeAmount, feeUnit, estimatedDays, note }`.
  2. Tại màn hình duyệt bản nháp thủ tục của Quản lý thủ tục, hỗ trợ xem và bổ sung/chỉnh sửa mảng `submissionMethods` trước khi Publish nếu AI trích xuất thiếu.

---

## 3. Dịch vụ IAM: Ràng buộc gán vai trò người dùng (RBAC User Roles)

- **Vị trí tệp:**  
  `src/Services/WardMate.Services.IAM/WardMate.Services.IAM.Application/Rbac/RbacCommandHandlers.cs` (`SetUserRoleCommand`, dòng 68–84)
- **Hiện tượng:**  
  Backend cho phép 1 User có thể được gán nhiều role bất kỳ cùng lúc (quan hệ N-N trong `UserRoles`), và API cho phép gán/thu hồi cả role `IT_ADMIN` cho bất kỳ tài khoản nào nếu người gọi có quyền quản trị.
- **Vấn đề vận hành:**  
  - Một tài khoản cán bộ không nên vừa là `CITIZEN` vừa là `FRONT_DESK_OFFICER` hay `MANAGER`, vì sẽ gây xung đột quyền hạn và không xác định được luồng làm việc mặc định.
  - Role `IT_ADMIN` là quyền quản trị tối cao, không nên để xuất hiện trong luồng phân quyền nhân sự/cán bộ thông thường để tránh rủi ro leo thang đặc quyền (Privilege Escalation).
- **Đề xuất BE xem xét:**  
  1. Bổ sung validation nghiệp vụ: Mỗi tài khoản chỉ gắn với **1 vai trò chức năng chính (Primary Functional Role)**.
  2. Chặn việc gán role `IT_ADMIN` qua endpoint quản lý tài khoản nhân sự thông thường; chỉ cho phép Super Admin ủy quyền trong quy trình kiểm soát đặc biệt.

