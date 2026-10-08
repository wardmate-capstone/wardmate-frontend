import { ManagerProfileItem } from './types';

// Danh sách hồ sơ công dân nạp trực tiếp qua API
export const initialManagerProfiles: ManagerProfileItem[] = [];


// Dữ liệu biểu đồ xu hướng hồ sơ 6 tháng gần nhất
export const mockMonthlyTrends = [
  { month: "Tháng 4", tiepNhan: 1120, hoanThanh: 1098, dungHan: 1085 },
  { month: "Tháng 5", tiepNhan: 1250, hoanThanh: 1230, dungHan: 1215 },
  { month: "Tháng 6", tiepNhan: 1340, hoanThanh: 1310, dungHan: 1290 },
  { month: "Tháng 7", tiepNhan: 1410, hoanThanh: 1390, dungHan: 1372 },
  { month: "Tháng 8", tiepNhan: 1380, hoanThanh: 1365, dungHan: 1350 },
  { month: "Tháng 9", tiepNhan: 1428, hoanThanh: 1405, dungHan: 1392 },
];

// Dữ liệu phân bổ hồ sơ theo lĩnh vực
export const mockSectorDistribution = [
  { name: "Hộ tịch", count: 540, percentage: 37.8, color: "#991D18" },
  { name: "Chứng thực", count: 420, percentage: 29.4, color: "#D97706" },
  { name: "Đất đai - Địa chính", count: 215, percentage: 15.1, color: "#2563EB" },
  { name: "Lao động - TB&XH", count: 145, percentage: 10.2, color: "#059669" },
  { name: "Xây dựng - Đô thị", count: 108, percentage: 7.5, color: "#7C3AED" },
];

// Dữ liệu thống kê thủ tục hành chính
export const mockTopProcedures = [
  { id: "HT-01", name: "Đăng ký kết hôn", field: "Hộ tịch", total: 312, avgTime: "1.2 ngày", onTimeRate: "99.4%", onlinePercent: "78%" },
  { id: "HT-02", name: "Đăng ký khai sinh", field: "Hộ tịch", total: 285, avgTime: "0.8 ngày", onTimeRate: "100%", onlinePercent: "85%" },
  { id: "CT-01", name: "Chứng thực bản sao từ bản chính", field: "Chứng thực", total: 418, avgTime: "15 phút", onTimeRate: "100%", onlinePercent: "42%" },
  { id: "HT-03", name: "Xác nhận tình trạng hôn nhân", field: "Hộ tịch", total: 198, avgTime: "1.5 ngày", onTimeRate: "98.5%", onlinePercent: "81%" },
  { id: "DC-01", name: "Đăng ký biến động đất đai (sang tên)", field: "Địa chính", total: 112, avgTime: "8.5 ngày", onTimeRate: "96.4%", onlinePercent: "64%" },
  { id: "XH-01", name: "Trợ cấp xã hội hàng tháng", field: "Lao động - XH", total: 94, avgTime: "4.0 ngày", onTimeRate: "98.9%", onlinePercent: "52%" },
];

// Dữ liệu thống kê lượt tra cứu
export const mockSearchTraffic = [
  { hour: "07:00", visits: 145 },
  { hour: "08:30", visits: 480 },
  { hour: "10:00", visits: 620 },
  { hour: "11:30", visits: 390 },
  { hour: "13:30", visits: 410 },
  { hour: "15:00", visits: 690 },
  { hour: "16:30", visits: 510 },
  { hour: "18:00", visits: 230 },
  { hour: "20:00", visits: 310 },
];

export const mockTopKeywords = [
  { keyword: "đăng ký kết hôn", count: 2450, trend: "+18%" },
  { keyword: "khai sinh trực tuyến", count: 2180, trend: "+24%" },
  { keyword: "xác nhận độc thân", count: 1890, trend: "+12%" },
  { keyword: "chứng thực chữ ký", count: 1420, trend: "+5%" },
  { keyword: "thủ tục làm sổ đỏ", count: 1310, trend: "+15%" },
  { keyword: "chế độ thai sản", count: 980, trend: "-2%" },
];

// Dữ liệu biểu mẫu
export const mockFormStats = [
  { code: "BM-HT-01", title: "Tờ khai đăng ký kết hôn", downloads: 1820, onlineFills: 1420, updated: "15/09/2026", status: "Chuẩn hóa" },
  { code: "BM-HT-02", title: "Tờ khai đăng ký khai sinh", downloads: 1650, onlineFills: 1390, updated: "12/09/2026", status: "Chuẩn hóa" },
  { code: "BM-HT-03", title: "Tờ khai cấp Giấy xác nhận tình trạng hôn nhân", downloads: 1240, onlineFills: 980, updated: "08/09/2026", status: "Chuẩn hóa" },
  { code: "BM-DC-01", title: "Đơn đăng ký biến động đất đai Mẫu 09/ĐK", downloads: 980, onlineFills: 610, updated: "20/08/2026", status: "Cần rà soát" },
  { code: "BM-CT-01", title: "Phiếu yêu cầu chứng thực hợp đồng giao dịch", downloads: 840, onlineFills: 420, updated: "01/09/2026", status: "Chuẩn hóa" },
];

// Dữ liệu hiệu suất cán bộ
export const mockOfficersPerformance = [
  { id: "CB-01", name: "Trần Quốc Bảo", role: "Cán bộ Hộ tịch", received: 245, completed: 244, onTime: "99.6%", avgHours: "6.5 giờ", rating: 4.9 },
  { id: "CB-02", name: "Nguyễn Minh Anh", role: "Cán bộ Tiếp nhận Một cửa", received: 380, completed: 378, onTime: "99.5%", avgHours: "15 phút", rating: 5.0 },
  { id: "CB-03", name: "Lê Thu Hà", role: "Cán bộ Địa chính - Xây dựng", received: 140, completed: 135, onTime: "96.4%", avgHours: "28 giờ", rating: 4.8 },
  { id: "CB-04", name: "Phạm Tuấn Kiệt", role: "Cán bộ Chứng thực", received: 320, completed: 320, onTime: "100%", avgHours: "20 phút", rating: 4.9 },
  { id: "CB-05", name: "Vũ Mai Phương", role: "Cán bộ Lao động - Xã hội", received: 115, completed: 113, onTime: "98.2%", avgHours: "18 giờ", rating: 4.7 },
];

// Dữ liệu tỷ lệ cần bổ sung & nguyên nhân
export const mockSupplementReasons = [
  { reason: "Bản chụp CCCD/CMND bị mờ, mất góc hoặc quá hạn", count: 86, percentage: "41%" },
  { reason: "Thiếu Giấy xác nhận tình trạng hôn nhân từ xã/phường cũ", count: 48, percentage: "23%" },
  { reason: "Chưa ký tên vào phần cam đoan của tờ khai", count: 35, percentage: "17%" },
  { reason: "Thiếu giấy chứng sinh hoặc văn bản thỏa thuận đặt tên", count: 24, percentage: "11%" },
  { reason: "Lý do chuyên môn khác", count: 17, percentage: "8%" },
];

// Dữ liệu phản hồi của người dân
export const mockCitizenFeedbacks = [
  {
    id: "FB-1042",
    citizenName: "Nguyễn Hoàng Nam",
    phone: "0912***456",
    procedure: "Đăng ký khai sinh",
    date: "29/09/2026",
    rating: 5,
    category: "Thái độ phục vụ",
    comment: "Cán bộ nhiệt tình, hướng dẫn tiền kiểm trực tuyến qua WardMate rất nhanh, tới bàn Một cửa chỉ mất 5 phút là nhận được kết quả.",
    status: "Đã ghi nhận",
    resolvedNote: "Đã biểu dương cán bộ Nguyễn Minh Anh trong cuộc họp tuần."
  },
  {
    id: "FB-1041",
    citizenName: "Lê Thu Cúc",
    phone: "0988***112",
    procedure: "Đăng ký kết hôn",
    date: "28/09/2026",
    rating: 5,
    category: "Tiện ích số",
    comment: "Tính năng điền biểu mẫu trực tuyến tự điền thông tin rất thông minh, đỡ phải viết tay nhiều lần.",
    status: "Đã ghi nhận",
    resolvedNote: "Cảm ơn ý kiến đóng góp của người dân."
  },
  {
    id: "FB-1039",
    citizenName: "Đỗ Văn Toàn",
    phone: "0934***889",
    procedure: "Đăng ký biến động đất đai",
    date: "26/09/2026",
    rating: 4,
    category: "Thời gian xử lý",
    comment: "Thời gian hẹn trả kết quả cần rõ ràng hơn khi có phát sinh đo đạc thực địa.",
    status: "Đã xử lý",
    resolvedNote: "Đã cập nhật tin nhắn SMS tự động thông báo ngày đo đạc thực tế cho công dân."
  },
  {
    id: "FB-1035",
    citizenName: "Hoàng Bích Thủy",
    phone: "0971***345",
    procedure: "Xác nhận tình trạng hôn nhân",
    date: "24/09/2026",
    rating: 5,
    category: "Thái độ phục vụ",
    comment: "Tuyệt vời, giải quyết trước hạn 1 ngày. Cảm ơn các đồng chí Một cửa.",
    status: "Đã ghi nhận",
    resolvedNote: "Đã lưu hồ sơ thi đua quý."
  }
];

// Dữ liệu mức độ hài lòng
export const mockSatisfactionMetrics = [
  { criteria: "Thái độ tiếp đón & phục vụ của cán bộ", score: "99.1%", responses: 1240 },
  { criteria: "Thời gian giải quyết so với quy định", score: "98.4%", responses: 1240 },
  { criteria: "Mức độ thuận tiện khi chuẩn bị hồ sơ qua WardMate", score: "97.8%", responses: 1180 },
  { criteria: "Công khai, minh bạch quy trình và phí/lệ phí", score: "99.5%", responses: 1240 },
];
