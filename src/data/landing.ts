import {
  IdentificationIcon,
  DocumentCheckIcon,
  HomeModernIcon,
  HeartIcon,
  MapPinIcon,
  BriefcaseIcon,
  UserGroupIcon,
  ClipboardDocumentCheckIcon,
  ShieldCheckIcon,
  CheckBadgeIcon,
  MagnifyingGlassIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';

export const serviceGroups = [
  { label: 'Hộ tịch', description: 'Khai sinh, kết hôn, tình trạng hôn nhân', icon: IdentificationIcon, count: '12 hướng dẫn' },
  { label: 'Chứng thực', description: 'Bản sao, chữ ký và giấy tờ liên quan', icon: DocumentCheckIcon, count: '08 hướng dẫn' },
  { label: 'Cư trú', description: 'Thông tin và chỉ dẫn đến cơ quan phù hợp', icon: HomeModernIcon, count: '06 hướng dẫn' },
  { label: 'Chính sách xã hội', description: 'Hỗ trợ và chính sách dành cho người dân', icon: HeartIcon, count: '15 hướng dẫn' },
  { label: 'Đất đai và xây dựng', description: 'Tra cứu điều kiện và nơi tiếp nhận', icon: MapPinIcon, count: '10 hướng dẫn' },
  { label: 'Lao động và việc làm', description: 'Thủ tục liên quan đến lao động địa phương', icon: BriefcaseIcon, count: '09 hướng dẫn' },
];

export const popularProcedures = [
  { title: 'Đăng ký khai sinh', category: 'Hộ tịch', icon: IdentificationIcon, note: 'Có hỗ trợ chuẩn bị hồ sơ' },
  { title: 'Đăng ký kết hôn', category: 'Hộ tịch', icon: HeartIcon, note: 'Có tờ khai điện tử' },
  { title: 'Chứng thực bản sao từ bản chính', category: 'Chứng thực', icon: DocumentCheckIcon, note: 'Có hướng dẫn giấy tờ' },
  { title: 'Cấp giấy xác nhận tình trạng hôn nhân', category: 'Hộ tịch', icon: DocumentTextIcon, note: 'Có hỗ trợ tiền kiểm' },
  { title: 'Đề nghị hỗ trợ xã hội', category: 'Chính sách xã hội', icon: UserGroupIcon, note: 'Có hướng dẫn theo trường hợp' },
];

export const preparationSteps = [
  { number: '01', title: 'Tìm đúng thủ tục', description: 'Tra cứu theo nhu cầu, đọc điều kiện và xác định đúng cơ quan tiếp nhận.', icon: MagnifyingGlassIcon },
  { number: '02', title: 'Chuẩn bị hồ sơ', description: 'Hoàn thành danh sách giấy tờ, tờ khai và tài liệu cần tiền kiểm.', icon: ClipboardDocumentCheckIcon },
  { number: '03', title: 'Nhận góp ý', description: 'Cán bộ chỉ rõ nội dung cần bổ sung. Những phần khác được giữ nguyên.', icon: ShieldCheckIcon },
  { number: '04', title: 'Nhận QR sau khi duyệt', description: 'Mang QR cùng hồ sơ giấy đến cơ quan có thẩm quyền để đối chiếu.', icon: CheckBadgeIcon },
];

export const notices = [
  { category: 'Hướng dẫn', date: '14/09/2026', title: 'Cách chụp giấy tờ rõ nét để cán bộ tiền kiểm', excerpt: 'Chụp đủ bốn góc, đặt giấy tờ trên nền phẳng và tránh ánh sáng phản chiếu.' },
  { category: 'Cần biết', date: '10/09/2026', title: 'Phân biệt tiền kiểm và tiếp nhận hồ sơ chính thức', excerpt: 'Tiền kiểm giúp bạn chuẩn bị đầy đủ; việc tiếp nhận được thực hiện tại cơ quan có thẩm quyền.' },
  { category: 'Hướng dẫn', date: '05/09/2026', title: 'Theo dõi và bổ sung hồ sơ như thế nào?', excerpt: 'Mở Hồ sơ của tôi để xem góp ý gắn với từng trường thông tin hoặc tài liệu.' },
  { category: 'Bảo mật', date: '01/09/2026', title: 'Lưu ý khi sử dụng dữ liệu cá nhân trên hệ thống', excerpt: 'Chỉ cung cấp thông tin cần thiết và luôn kiểm tra dữ liệu trước khi gửi tiền kiểm.' },
];

export const faq = [
  { question: 'Tiền kiểm hồ sơ có phải là nộp hồ sơ trực tuyến không?', answer: 'Không. Tiền kiểm là bước cán bộ kiểm tra trước để giúp bạn chuẩn bị hồ sơ đầy đủ. Hồ sơ chính thức được tiếp nhận tại cơ quan có thẩm quyền.' },
  { question: 'Tôi có cần đăng nhập để tra cứu thủ tục không?', answer: 'Không. Bạn có thể tìm kiếm và đọc toàn bộ hướng dẫn công khai. Hệ thống chỉ yêu cầu đăng nhập khi bạn muốn lưu bản nháp, gửi tiền kiểm hoặc xem hồ sơ cá nhân.' },
  { question: 'Khi nào hệ thống tạo mã QR?', answer: 'Mã QR chỉ được tạo sau khi cán bộ duyệt tiền kiểm. Hoàn thành tờ khai, tải tài liệu hoặc gửi bổ sung đều chưa tạo QR.' },
  { question: 'Nếu cán bộ yêu cầu bổ sung, tôi có phải làm lại hồ sơ không?', answer: 'Không. Hệ thống giữ nguyên nội dung không bị góp ý và đưa bạn đến đúng trường hoặc tài liệu cần sửa. Sau đó bạn gửi lại để cán bộ tiền kiểm lần nữa.' },
];
