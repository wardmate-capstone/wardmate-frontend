import { popularProcedures } from './landing';

// Dữ liệu minh họa cho giao diện, không phải danh mục thủ tục chính thức.
export const mockPublicProcedures = [
  ...popularProcedures.map(({ title, category }) => ({ title, category })),
  { title: 'Đăng ký khai tử', category: 'Hộ tịch' },
  { title: 'Đăng ký lại khai sinh', category: 'Hộ tịch' },
  { title: 'Đăng ký lại kết hôn', category: 'Hộ tịch' },
  { title: 'Cấp bản sao trích lục hộ tịch', category: 'Hộ tịch' },
  { title: 'Thay đổi, cải chính thông tin hộ tịch', category: 'Hộ tịch' },
  { title: 'Chứng thực chữ ký', category: 'Chứng thực' },
  { title: 'Chứng thực hợp đồng, giao dịch', category: 'Chứng thực' },
  { title: 'Chứng thực chữ ký người dịch', category: 'Chứng thực' },
  { title: 'Đề nghị xác định mức độ khuyết tật', category: 'Chính sách xã hội' },
  { title: 'Đề nghị hỗ trợ chi phí mai táng', category: 'Chính sách xã hội' },
].map((procedure, index) => ({
  ...procedure,
  id: 'demo-' + (index + 1),
  description: {
    'Hộ tịch': 'Tra cứu hướng dẫn chuẩn bị thông tin và giấy tờ hộ tịch.',
    'Chứng thực': 'Tra cứu hướng dẫn chuẩn bị giấy tờ cần chứng thực.',
    'Chính sách xã hội': 'Tra cứu hướng dẫn chuẩn bị thông tin đề nghị hỗ trợ.',
  }[procedure.category],
}));
