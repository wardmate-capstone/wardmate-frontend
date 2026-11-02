import axios from 'axios';
import { workflowError } from './workflow';

const messages: Record<string, string> = {
  'staffing.invalid_date': 'Ngày tạo phải từ hôm nay đến 366 ngày tiếp theo; khoảng xem tối đa 400 ngày.',
  'staffing.reason_required': 'Vui lòng nhập lý do trong giới hạn cho phép.',
  'staffing.closure_exists': 'Đã có ngày nghỉ đang hiệu lực trong phạm vi này. Vui lòng xem lại lịch.',
  'staffing.closure_started': 'Ngày nghỉ đã bắt đầu, không thể hủy.',
  'staffing.closure_cancelled': 'Ngày nghỉ này đã được hủy. Vui lòng xem lại lịch.',
  'dispatch.officer_ineligible': 'Cán bộ không còn đủ điều kiện nhận hồ sơ. Vui lòng xem lại danh sách.',
  'consultation.specialist_ineligible': 'Chuyên viên không đủ điều kiện tham vấn. Vui lòng chọn lại.',
};

export function staffingError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const data = error.response?.data;
    const code = data && typeof data === 'object' ? data.code ?? data.extensions?.code : undefined;
    if (status === 403) return 'Bạn không có quyền thực hiện thao tác này hoặc dữ liệu nằm ngoài phạm vi quản lý.';
    if (status === 404) return 'Dữ liệu không tồn tại hoặc không còn trong phạm vi truy cập. Vui lòng tải lại.';
    if (status === 503) return 'Dịch vụ tạm thời chưa sẵn sàng. Vui lòng thử lại sau; thao tác ghi không được tự động gửi lại.';
    if (typeof code === 'string' && Object.hasOwn(messages, code)) return messages[code];
  }
  return workflowError(error);
}
