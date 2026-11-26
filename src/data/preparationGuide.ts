import { Bell, ClipboardText, FileMagnifyingGlass, Files, QrCode, UserCircle } from '@phosphor-icons/react';

export const guideSteps = [
  {
    id: 'tim-thu-tuc', number: '01', icon: FileMagnifyingGlass, title: 'Tìm đúng thủ tục',
    description: 'Tra cứu nhu cầu của bạn, đọc điều kiện, đối tượng và nơi thực hiện trước khi chuẩn bị.',
    tasks: ['Tìm theo tên thủ tục hoặc chọn lĩnh vực phù hợp.', 'Đọc đối tượng, điều kiện, thành phần hồ sơ và trường hợp áp dụng.'],
    outcome: 'Biết thủ tục và danh sách giấy tờ cần chuẩn bị cho trường hợp của mình.',
  },
  {
    id: 'tai-khoan', number: '02', icon: UserCircle, title: 'Đăng nhập và chọn nơi tiền kiểm',
    description: 'Dùng tài khoản đã đăng ký để lưu hồ sơ; chọn đúng phường/xã và trường hợp áp dụng.',
    tasks: ['Chưa có tài khoản? Đăng ký với email bạn đang sử dụng và có thể nhận thư.', 'Đăng nhập, chọn thủ tục, trường hợp và phường/xã phù hợp để tạo hồ sơ.'],
    outcome: 'Có bản nháp để tiếp tục điền và lưu giấy tờ. Tra cứu hướng dẫn công khai không cần đăng nhập.',
  },
  {
    id: 'chuan-bi', number: '03', icon: Files, title: 'Điền tờ khai và thêm giấy tờ',
    description: 'Hoàn thành từng mục trong danh sách, điền biểu mẫu và lưu tài liệu rõ nét.',
    tasks: ['Điền biểu mẫu trực tuyến, hoặc tải mẫu Word về điền rồi tải lên lại theo hướng dẫn của từng mục.', 'Tải giấy tờ đúng mục, khai đúng số bản; kiểm tra loại và dung lượng tệp được chấp nhận.'],
    outcome: 'Tờ khai và giấy tờ đã được lưu trong hồ sơ. Chỉ chọn tệp trên máy chưa có nghĩa đã lưu thành công.',
  },
  {
    id: 'gui-tien-kiem', number: '04', icon: ClipboardText, title: 'Kiểm tra và gửi tiền kiểm',
    description: 'Đối chiếu thông tin, xác nhận bản khai rồi gửi hồ sơ để cán bộ kiểm tra trước.',
    tasks: ['Kiểm tra lại họ tên, thông tin kê khai, phường/xã và các giấy tờ bắt buộc.', 'Xác nhận bản khai theo yêu cầu, đọc nội dung xác nhận và gửi hồ sơ tiền kiểm.'],
    outcome: 'Hồ sơ chuyển sang chờ tiền kiểm; theo dõi trạng thái trong Hồ sơ của tôi.',
  },
  {
    id: 'bo-sung', number: '05', icon: Bell, title: 'Theo dõi và bổ sung nếu cần',
    description: 'Đọc nhận xét của cán bộ, sửa đúng nội dung được yêu cầu và gửi lại hồ sơ.',
    tasks: ['Mở Thông báo hoặc Hồ sơ của tôi để xem tiến độ và yêu cầu bổ sung.', 'Sửa tờ khai hoặc giấy tờ được góp ý, kiểm tra lại, xác nhận bản khai và gửi lại để tiền kiểm.'],
    outcome: 'Tiếp tục trên hồ sơ đang có; không cần tạo hồ sơ mới chỉ vì có yêu cầu bổ sung.',
  },
  {
    id: 'pdf-qr', number: '06', icon: QrCode, title: 'Tải mã QR và mang giấy tờ đến quầy',
    description: 'Khi giấy tờ sẵn sàng, tải mã QR do hệ thống cấp; thủ tục có tờ khai thì tải thêm bản PDF.',
    tasks: ['Mở hồ sơ có trạng thái Giấy tờ sẵn sàng để tải mã QR và bản PDF (nếu có). Thủ tục chỉ có giấy tờ đính kèm thì không có PDF, mã QR vẫn dùng được.', 'In tài liệu cần thiết, chuẩn bị giấy tờ theo danh sách và mang đến cơ quan có thẩm quyền để đối chiếu.'],
    outcome: 'Giấy tờ đã được chuẩn bị cho bước làm thủ tục tại cơ quan tiếp nhận. QR không phải giấy hẹn hay kết quả giải quyết.',
  },
];
