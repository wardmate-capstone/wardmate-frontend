# Kế hoạch điều chỉnh lịch làm việc và đơn nghỉ Word cho WardMate

Ngày đối chiếu: 05/11/2026. Trạng thái: đề xuất triển khai, chưa triển khai chức năng mới.

## 1. Cơ sở và phạm vi

- Tham khảo `Work_Schedule_Management_Manager_Frontdesk.md` do người dùng cung cấp; đối chiếu với source FE và BE local hiện tại. Các trạng thái/flow trong tài liệu nguồn là thiết kế đề xuất, không phải chức năng đã tồn tại.
- Người dùng xác nhận: Frontdesk mở **mẫu đơn Word, sửa trực tiếp trên hệ thống và nộp cho Manager**. Không thay yêu cầu này bằng textarea có định dạng.
- Giữ các workspace, quyền IAM, HTTP client, React Hook Form/Zod, TanStack Query và UI hiện có. Không làm lại hệ thống nhân sự hoặc chấm công.
- Module lịch tập trung vào nhân sự. Giữ liên kết xem tác động/bàn giao hồ sơ đã có; điều phối và tham vấn tiếp tục là các nghiệp vụ riêng.
- Đề xuất trong tài liệu này chưa phải hợp đồng API được chốt. Không bổ sung hoặc gọi endpoint giả để thể hiện các chức năng chưa có BE.

## 2. Hiện trạng đã đối chiếu

| Nghiệp vụ | Hiện có | Khoảng trống |
|---|---|---|
| Ca làm | Manager tạo/hủy từng ca; Frontdesk xem lịch cá nhân; lọc khoảng ngày tối đa 93 ngày | Chưa có bảng lịch tháng, mẫu tuần, sinh lịch hàng loạt, sửa ca, nháp/công bố hoặc xác nhận nhận lịch |
| Kiểm tra ca | BE kiểm tra cùng phường, tài khoản/vai trò, ca tương lai tối đa 24 giờ, trùng ca/nghỉ đã duyệt | Cần mở rộng cho sinh/sửa/công bố nhiều ca và xem trước xung đột |
| Nghỉ phép | Frontdesk gửi thời gian + `reason`; Manager duyệt/từ chối/hủy, có version và lịch sử; Frontdesk hủy đơn chờ của mình | Chưa có nháp, sửa đơn, tệp Word, mẫu đơn hoặc thao tác nộp tách khỏi lưu |
| Bàn giao | Manager xem hồ sơ cán bộ đang giữ và chuyển cán bộ bằng luồng phân công | Không tự bàn giao khi duyệt nghỉ; danh sách tác động không dự báo theo ngày nghỉ |
| Khả dụng | Đang trong ca và không đang nghỉ đã duyệt là điều kiện khả dụng tại thời điểm kiểm tra | Lịch nháp mới phải bị loại khỏi tính khả dụng |
| Tham vấn | Tạo/đọc/trả lời/đóng, xem tài liệu theo quyền; chuyên viên là Frontdesk đủ điều kiện | Cần kiểm thử hồi quy khi đổi cơ chế lịch, không gộp vào đơn nghỉ |
| Ngày nghỉ | Có lịch lễ toàn quốc/đóng cửa phường, dùng điều chỉnh hạn tiền kiểm | Không coi đóng cửa phường là đơn nghỉ cá nhân; quy tắc sinh ca ngày lễ/ngoại lệ cần cấu hình rõ |
| Word | `DocxOnlineEditor` nhận `load`, `onSave`, `readOnly`; có cảnh báo chưa lưu, xuất DOCX và tải khi mở | Chưa có luồng mẫu/tệp cho nghỉ phép; editor hiện còn dùng một số tên/lỗi theo bản khai công dân |

API nghỉ hiện tại chỉ nhận `{ startsAt, endsAt, reason }`, tạo ngay trạng thái `PENDING`; quyết định nhận `{ expectedVersion, decision, reason }`. Trạng thái đã có: `PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`. Không đưa `DRAFT` vào client cũ trước khi BE hỗ trợ.

Source đối chiếu chính:

- FE: `src/components/staffing/{StaffingView,DispatchView,ConsultationsView,CalendarClosuresView,shared}.tsx`, `src/lib/api/staffing.ts`, `src/lib/staffingValidation.ts`.
- FE Word: `src/components/documents/DocxOnlineEditor.tsx`, `src/lib/api/documentForms.ts`.
- BE: `src/Services/WardMate.Services.ApplicationWorkflow/`, các file `StaffingService.cs`, `StaffingContracts.cs`, `OfficerAvailability.cs`, `StaffingController.cs`, `WorkflowSecurity.cs`.
- Policy `workflow.staffing.decide` là policy tổ hợp: Manager + `workflow.staffing.manage`, hoặc Frontdesk không kiêm Manager + `workflow.leave.request`; không phải một permission FE cần tự thêm vào token.

## 3. Phương án thích hợp với dự án

### 3.1. Lịch làm việc

- Giữ dữ liệu ca hiện có làm nền; bổ sung lịch tháng quản lý nhóm ca, trạng thái và phiên bản. Không tạo một nguồn lịch riêng khiến điều phối tiếp tục đọc dữ liệu cũ.
- Manager có lịch tháng theo nhân sự/ngày; chuyển sang danh sách trên mobile. Chọn tháng, lọc cán bộ, xem ca/nghỉ/lễ trong cùng màn.
- Có mẫu tuần cấu hình theo đơn vị: ngày làm việc, khoảng giờ, người áp dụng. Không mặc định mọi đơn vị có cùng giờ hành chính hoặc bắt buộc hai ca/ngày.
- Sinh lịch từ mẫu hoặc sao chép theo thứ/ngày làm việc; có bản xem trước. Tháng ngắn, ngày lễ và ngày đặc biệt phải được xử lý rõ, không cộng cơ học 30 ngày vào ca cũ.
- Manager sửa nháp rồi công bố. Công bố phải kiểm tra lại xung đột tại BE, chống gửi lặp và tránh tạo lịch nửa chừng khi một ca lỗi.
- Ca cũ được migration/đánh dấu là lịch đang có hiệu lực; không làm mất khả năng nhận hồ sơ khi nâng cấp.
- Chỉ ca đã công bố được tính cho khả dụng. Xác nhận đã nhận lịch phục vụ theo dõi, không trở thành điều kiện nhận hồ sơ nếu chưa có quyết định nghiệp vụ riêng.
- Sửa lịch đã công bố phải có lý do, kiểm tra version, lưu lịch sử và thông báo. Không giả lập sửa bằng hai request hủy/tạo dễ để lại trạng thái dở dang.
- Frontdesk xem lịch cá nhân và xác nhận **đúng phiên bản lịch**. Khi phần lịch liên quan thay đổi, yêu cầu xác nhận phiên bản mới; không xóa lịch sử xác nhận cũ.
- Chưa dùng trạng thái `Completed` cho ca. Có thể hiển thị “Sắp tới/Đang diễn ra/Đã qua” suy từ thời gian, tách biệt trạng thái hủy và chấm công.

### 3.2. Đơn xin nghỉ bằng Word

Luồng đề xuất:

```mermaid
flowchart LR
  A[Chọn thời gian nghỉ] --> B[Tạo nháp từ mẫu Word]
  B --> C[Sửa đơn trực tiếp]
  C --> D[Lưu nháp]
  D --> E[Xem lại thông tin và bản Word]
  E --> F[Nộp cho Manager]
  F --> G[Manager đọc bản đã nộp và xem tác động]
  G --> H[Duyệt hoặc từ chối]
```

Frontdesk:

1. Vào **Nghỉ phép cá nhân → Tạo đơn xin nghỉ**.
2. Chọn thời gian nghỉ, nhập lý do ngắn để hiển thị trong danh sách; nội dung giải trình đầy đủ soạn trong Word. Lý do ngắn giữ giới hạn hiện tại 2.000 ký tự.
3. Hệ thống tạo bản nháp từ mẫu được quản lý; đề xuất điền sẵn tên, đơn vị và thời gian theo dữ liệu xác thực. Chức năng điền mẫu này cần triển khai, editor hiện có chưa tự làm.
4. Mở editor hiện có, sửa nội dung/lý do chi tiết, bấm **Lưu nháp**. Lưu thành công phải tồn tại trên server để mở lại sau đăng nhập, không chỉ giữ blob trong RAM.
5. Bấm **Nộp cho quản lý** ở màn tổng hợp sau khi đã lưu. Xem trước cả thông tin thời gian và đúng phiên bản Word sẽ nộp.
6. Sau nộp, đơn chuyển **Chờ duyệt**, khóa sửa nội dung/tệp. Frontdesk theo dõi kết quả, xem đơn đã nộp và lịch sử; vẫn được hủy đơn chờ của mình theo quyền hiện có.

Manager:

1. Mở **Duyệt nghỉ phép**, lọc danh sách và chọn đơn.
2. Xem thời gian, lý do ngắn, Word đã nộp ở chế độ chỉ đọc, thông tin người nộp và lịch sử.
3. Xem ca bị ảnh hưởng và nhóm hồ sơ cán bộ đang giữ. Hai nhóm phải phân biệt, không trình bày hồ sơ đang giữ như dự báo chính xác của ngày nghỉ.
4. Khi cần, sử dụng luồng bàn giao hiện có. Có thể quay lại đơn sau bàn giao.
5. Duyệt/từ chối theo version mới nhất. Giữ yêu cầu nhập lý do cho quyết định như hiện tại; Frontdesk đọc được kết quả và lý do.
6. Không chỉnh sửa thay nội dung đơn Word đã nộp. Vòng “yêu cầu sửa rồi nộp lại” chưa nằm trong đợt đầu; đơn bị từ chối có thể dùng làm nguồn sao chép sang nháp mới khi chức năng này được bổ sung.

Quy tắc tài liệu và dữ liệu:

- Trạng thái đề xuất: **Nháp → Chờ duyệt → Đã duyệt/Từ chối**, giữ **Đã hủy** theo luồng hiện có. Nháp có thể sửa/xóa theo quyền chủ sở hữu; thao tác xóa nháp không xóa lịch sử đơn đã nộp.
- Thời gian nghỉ trong trường dữ liệu có cấu trúc là nguồn tính lịch. Word là tài liệu giải trình; không lấy ngày nghỉ bằng cách suy đoán hoặc đọc tự do từ DOCX.
- Phân biệt lý do ngắn với giải trình chi tiết để tránh hai trường bị hiểu là cùng một nội dung bắt buộc giống hệt. Mẫu đơn cần thể hiện rõ thông tin thời gian; thay đổi thời gian sau khi đã soạn phải cập nhật/xem lại tài liệu trước nộp. Cơ chế điền/cập nhật trường mẫu cần thống nhất với BE, không cam kết editor hiện có khóa được từng vùng.
- Khi nộp, lưu tham chiếu bất biến đến phiên bản tệp, phiên bản mẫu và thông tin nghỉ. Manager phải đọc đúng bản được nộp, không đọc tệp nháp vừa bị ghi đè.
- Tách **Lưu nháp** và **Nộp**. Lưu tệp lỗi thì không cho nộp. Nộp lỗi/timeout không chắc kết quả thì đọc lại trạng thái trước khi thử; chống tạo hai đơn hoặc hai lần nộp.
- Duyệt nghỉ hiển thị ngoại lệ trên lịch, giữ dấu vết ca gốc. Trước mắt không tự hủy/xóa ca và không tự chuyển hồ sơ. Hủy nghỉ không mặc nhiên sinh lại ca đã bị hủy riêng.
- Ca có sẵn giao với nghỉ vừa duyệt được hiển thị “Có nghỉ đã duyệt” tại phần giao nhau; kiểm tra khả dụng vẫn loại thời gian nghỉ. Ngăn tạo ca mới trùng nghỉ đã duyệt như hiện tại.
- Lý do nghỉ/tệp chỉ cho chủ đơn và người duyệt đúng phạm vi; người khác không xem được bằng cách đoán ID hoặc truy cập URL tệp. Không lưu nội dung Word/lý do vào log thông báo hoặc bộ nhớ trình duyệt dài hạn.
- Nộp trên hệ thống không mặc nhiên là ký số. Chưa bổ sung chữ ký điện tử, số ngày phép còn lại hoặc quy định pháp lý chưa được xác nhận.

### 3.3. Đổi ca, điều phối và tham vấn

- Đổi ca là yêu cầu riêng, không dùng trạng thái nghỉ phép để giả lập. Đề xuất đợt sau chỉ cho Frontdesk yêu cầu đổi thời gian ca của mình; Manager chọn phương án nhân sự và duyệt.
- Hoán đổi giữa hai Frontdesk cần quy tắc đồng thuận và kiểm tra cả hai lịch; chưa triển khai trong đợt đầu.
- Giữ **Điều phối hồ sơ**, **Lịch ngày nghỉ**, **Duyệt nghỉ phép**, **Tham vấn chuyên môn** tại menu hiện có. “Lịch ca làm” có thể đổi nhãn thành “Lịch làm việc” khi đã có màn tháng thực sự.
- Không bắt buộc bàn giao toàn bộ hồ sơ mới cho duyệt nghỉ nếu chưa có quy tắc nghiệp vụ. Manager phải thấy cảnh báo và chủ động xử lý.
- Kiểm thử lại khả dụng cho nhận hồ sơ/phân công/tham vấn sau khi công bố/sửa/hủy lịch và duyệt/hủy nghỉ. Không cho lịch nháp tạo quyền nhận hồ sơ.

## 4. Chia giai đoạn triển khai

| Giai đoạn | Backend cần làm | Frontend cần làm | Điều kiện hoàn tất |
|---|---|---|---|
| 0. Chốt hợp đồng | Chốt trạng thái, quyền, storage/mẫu, version, nộp bất biến và quy tắc lịch | Chốt wireframe, bảng dữ liệu/trạng thái và trường thông tin | Có hợp đồng được đối chiếu source/OpenAPI; có mẫu DOCX được cung cấp hoặc xác nhận |
| 1. Đơn nghỉ Word — ưu tiên đầu | Nháp/sửa/xóa nháp, lưu/đọc DOCX, quản lý phiên bản mẫu/tệp, nộp đơn, đọc đúng bản đã nộp; migration tương thích đơn cũ | Trang tạo/sửa nháp, tích hợp editor, lưu/nộp riêng, xem chỉ đọc ở Manager, giữ duyệt/lịch sử/bàn giao | Frontdesk soạn → lưu → mở lại → nộp → Manager đọc đúng bản → duyệt/từ chối; không mất nội dung khi lỗi |
| 2. Lịch tháng | Nhóm lịch tháng/phiên bản, mẫu tuần, preview, sinh/sao chép hàng loạt, công bố, sửa ca có kiểm soát; migration ca cũ | Lịch tháng và danh sách mobile, lọc cán bộ, chọn nhiều ngày, preview xung đột, thao tác nháp/công bố | Lịch nháp không tác động khả dụng; công bố không trùng lịch; dữ liệu cũ vẫn hoạt động |
| 3. Xác nhận và thông báo | Xác nhận theo phiên bản, lịch sử thay đổi, phát thông báo bền vững qua hạ tầng được xác minh | Xác nhận nhận lịch, xem thay đổi, trạng thái đã/chưa xác nhận | Sửa lịch tạo phiên bản mới; thông báo điều hướng đúng; lỗi gửi thông báo không đảo ngược hoặc nhân đôi quyết định |
| 4. Đổi ca | Yêu cầu/duyệt đổi ca và cập nhật lịch nhất quán | Gửi đề xuất, theo dõi, Manager xem trước và duyệt | Không trùng ca/nghỉ, không tự đổi trước duyệt; có lịch sử và thông báo |

Kiểm tra xung đột, phân quyền và lịch sử nghiệp vụ tối thiểu thuộc từng giai đoạn, không để đến giai đoạn cuối như tài liệu nguồn. Chưa ước lượng ngày công trước khi chốt hợp đồng và mẫu Word.

## 5. Phân chia công việc kỹ thuật

- **BE Workflow:** sở hữu đơn nghỉ, trạng thái/phiên bản, nhóm lịch, quyền nộp/duyệt và tác động khả dụng. Bổ sung lưu nháp và lịch tháng vào mô hình hiện có, giữ tương thích dữ liệu cũ.
- **BE tài liệu/storage:** xác minh khả năng lưu mẫu và DOCX nội bộ với phân quyền theo chủ đơn/phường. Có thể tái sử dụng hạ tầng lưu tệp, nhưng không dùng API bản khai công dân vốn bắt buộc `applicationId/checklistId/applicantId` cho đơn nhân sự. Không tạo hồ sơ công dân giả để lưu đơn nghỉ.
- **Hợp đồng cần bổ sung:** đọc mẫu đang áp dụng; tạo/đọc/cập nhật nháp; tải/lưu phiên bản Word; nộp nháp; đọc bản đã nộp; lịch tháng/preview/công bố; xác nhận phiên bản; sau cùng là đổi ca. Chỉ mô tả năng lực cần có, chưa tự đặt method/path/DTO.
- **FE:** tách phần lịch và nghỉ trong `StaffingView` khi luồng mới đủ phức tạp; giữ các phần dùng chung hữu ích. Thêm client/hook đúng hợp đồng; query key chứa danh tính/phạm vi, hủy request, invalidate sau ghi, không tự retry mutation.
- **Editor:** tái sử dụng lazy load và giao diện Word; bổ sung tùy chọn ngữ cảnh/tên file/thông báo lỗi cho đơn nghỉ khi cần. Không thay đồng loạt hành vi bản khai công dân; không thêm thư viện editor thứ hai.
- **Dữ liệu cũ:** đơn đã gửi không có Word vẫn đọc/duyệt theo cơ chế cũ, hiển thị “Đơn theo phiên bản trước, chưa có tệp Word”; không tạo tài liệu giả hoặc bắt buộc người dùng nộp lại hàng loạt.

## 6. Tiêu chí nghiệm thu

1. Frontdesk chỉ sửa nháp của mình; Manager chỉ đọc/duyệt đơn thuộc phạm vi. Không tự duyệt, không sửa tệp sau nộp, không xem tệp chéo phường.
2. Word mở/sửa/lưu/mở lại đúng nội dung; cảnh báo chưa lưu; tải lỗi giữ trạng thái rõ; bản Manager đọc trùng phiên bản nộp.
3. Thử lỗi upload, nộp trùng, timeout sau lưu, version cũ và hai Manager cùng quyết định: không báo thành công giả, không mất nháp, không ghi đè quyết định.
4. Đơn cũ không có Word, ca cũ và API hiện có vẫn hoạt động sau migration.
5. Lịch tháng xử lý tháng ngắn/năm nhuận, ngày lễ, giờ Việt Nam, ca qua ngày, trùng ca, nghỉ đã duyệt, sao chép và công bố lặp. Lỗi một ca không tạo kết quả thiếu mà UI báo hoàn tất.
6. Duyệt nghỉ không tự bàn giao hồ sơ; lịch giữ ca gốc và hiển thị phần nghỉ; khả dụng đúng tại đầu/cuối khoảng nghỉ. Hủy nghỉ không tự khôi phục phân công cũ.
7. Hồi quy điều phối/nhận xử lý/tham vấn khi lịch và nghỉ đổi. Không biến lịch xác nhận thành chấm công.
8. UI desktop/mobile, bàn phím, focus modal, màn đọc Word và các trạng thái tải/rỗng/lỗi đều sử dụng được.
9. Chạy typecheck/lint/build và test mock phù hợp; nghiệm thu FE–BE thật bằng Manager + hai Frontdesk cùng phường và tài khoản khác phường. Tách kết quả mock khỏi kết quả tích hợp thật.

## 7. Thông tin cần chốt trước khi triển khai phần phụ thuộc

- Mẫu đơn Word chính thức: tệp mẫu, trường điền sẵn, nội dung cho phép sửa, ai quản lý/thay mẫu. Nếu chưa có, chuẩn bị mẫu đề xuất để người dùng duyệt, không gọi là mẫu chính thức.
- Giờ/ngày làm việc mặc định của đơn vị và cách xử lý ngày lễ, ngoại lệ; chưa cấu hình giờ cố định trong code.
- Chủ sở hữu lưu trữ/mẫu, thời hạn giữ tài liệu, giới hạn tệp và hợp đồng API mở rộng giữa Workflow và dịch vụ tài liệu.
- Đợt đầu triển khai **đơn nghỉ Word**, sau đó **lịch tháng** là thứ tự đề xuất để đáp ứng nhu cầu mới nhất và giảm rủi ro ảnh hưởng điều phối hiện có.

Lượt này chỉ lập kế hoạch và đọc source, chưa chạy API thật, chưa sửa FE/BE hay thực thi migration. Kiểm tra tài liệu/đường dẫn/diff; không chạy lại test ứng dụng cho thay đổi tài liệu.
