import axios from 'axios';
import { workflowError } from './workflow';

const messages: Record<string, string> = {
  'leave.version_conflict': 'Đơn đã thay đổi. Đọc lại phiên bản mới trước khi lưu hoặc nộp.',
  'leave.revision_required': 'Cần mở và lưu lại Word theo thông tin nghỉ mới nhất trước khi nộp.',
  'leave.key_conflict': 'Lần gửi trước có nội dung khác. Kiểm tra lại danh sách đơn trước khi tạo thao tác mới.',
  'leave.overlap': 'Khoảng nghỉ trùng với đơn đang chờ hoặc đã duyệt.',
  'leave.template_unavailable': 'Mẫu đơn nghỉ chưa sẵn sàng. Vui lòng liên hệ quản trị viên.',
  'leave.storage_unavailable': 'Chưa đọc hoặc lưu được Word. Giữ nội dung đang soạn và thử lại sau.',
  'leave.invalid_docx': 'DOCX không được hỗ trợ hoặc chứa thành phần không hợp lệ.',
  'leave.too_large': 'DOCX vượt quá giới hạn dung lượng cho phép.',
  'staffing.word_required': 'Đơn nghỉ phải có Word. Vui lòng tạo nháp và nộp theo luồng Word.',
  'schedule.changed': 'Ca hoặc lịch đã thay đổi. Đọc lại lịch trước khi lưu hoặc công bố.',
  'schedule.edit_deadline': 'Đã hết hạn sửa lịch đã công bố. Lịch chỉ được sửa chậm nhất 24 giờ trước ngày 1 của tháng đó (giờ Việt Nam).',
  'staffing.schedule_editor_required': 'Lịch đã công bố. Hãy dùng Sửa lịch trong Sắp xếp lịch tháng và công bố lại trong hạn cho phép.',
  'schedule.closure': 'Ca giao với ngày đóng cửa. Kiểm tra lịch và xác nhận ngoại lệ khi công bố.',
  'schedule.conflicts': 'Các ca đang xung đột. Kiểm tra trùng giờ, nghỉ đã duyệt và ca đã bắt đầu.',
  'schedule.invalid_week': 'Mẫu tuần không hợp lệ; tối đa 200 dòng, giờ bắt đầu và kết thúc phải khác nhau.',
  'schedule.officer_ineligible': 'Cán bộ không còn đủ điều kiện làm ca. Vui lòng chọn lại.',
  'staffing.invalid_date': 'Ngày tạo phải từ hôm nay đến 366 ngày tiếp theo; khoảng xem tối đa 400 ngày.',
  'staffing.reason_required': 'Vui lòng nhập lý do trong giới hạn cho phép.',
  'staffing.closure_exists': 'Đã có ngày nghỉ đang hiệu lực trong phạm vi này. Vui lòng xem lại lịch.',
  'staffing.closure_started': 'Ngày nghỉ đã bắt đầu, không thể hủy.',
  'staffing.closure_cancelled': 'Ngày nghỉ này đã được hủy. Vui lòng xem lại lịch.',
  'dispatch.officer_ineligible': 'Cán bộ không còn đủ điều kiện nhận hồ sơ. Vui lòng xem lại danh sách.',
  'consultation.specialist_ineligible': 'Chuyên viên không đủ điều kiện tham vấn. Vui lòng chọn lại.',
  // Tham vấn do cán bộ phụ trách khởi tạo (STAFFING-01, 12/11/2026)
  'consultation.already_pending': 'Hồ sơ đã có yêu cầu tham vấn đang chờ điều phối. Vui lòng mở yêu cầu đó thay vì gửi mới.',
  'consultation.already_open': 'Cán bộ này đang có tham vấn chưa đóng cho hồ sơ. Vui lòng chọn cán bộ khác.',
  'consultation.application_changed': 'Hồ sơ hoặc phân công đã thay đổi. Tải lại hồ sơ và tham vấn trước khi thao tác tiếp.',
  'consultation.version_conflict': 'Tham vấn hoặc phiên bản phân công đã thay đổi. Tải lại dữ liệu trước khi gửi lại.',
  'consultation.invalid_status': 'Quyết định chưa phù hợp với trạng thái hiện tại của tham vấn. Vui lòng tải lại.',
  'consultation.invalid_decision': 'Quyết định không hợp lệ. Vui lòng chọn lại thao tác.',
  'consultation.takeover_not_accepted': 'Cán bộ tư vấn chỉ đồng ý góp ý, chưa đồng ý nhận hồ sơ. Hãy giữ cán bộ hiện tại.',
  'consultation.officer_ineligible': 'Cán bộ tư vấn chưa đủ điều kiện nhận hồ sơ lúc này (ca làm, nghỉ phép, quyền hoặc lĩnh vực).',
  'consultation.category_mismatch': 'Bạn không còn phụ trách lĩnh vực của hồ sơ này.',
  'consultation.category_unavailable': 'Chưa xác minh được lĩnh vực của hồ sơ. Vui lòng thử lại sau.',
  'consultation.snapshot_missing': 'Hồ sơ chưa có phiên bản đã nộp nên chưa thể tham vấn.',
  'consultation.dependency_unavailable': 'Chưa xác minh được cán bộ hoặc lĩnh vực. Tải lại tham vấn để kiểm tra lần gửi trước trước khi thử lại.',
};

// Lý do cán bộ chưa đủ điều kiện (danh sách ứng viên phân công/tham vấn)
export const officerBlockers: Record<string, string> = { NO_ACTIVE_SHIFT: 'Không có ca làm hiện tại', APPROVED_LEAVE: 'Đang nghỉ phép', CATEGORY_MISMATCH: 'Không phụ trách lĩnh vực', WARD_MISMATCH: 'Khác phường', ROLE_MISMATCH: 'Sai vai trò', ACCOUNT_INACTIVE: 'Tài khoản bị khóa', ASSIGN_PERMISSION_MISSING: 'Thiếu quyền nhận hồ sơ', RESPOND_PERMISSION_MISSING: 'Thiếu quyền trả lời tham vấn', APPLICATION_OWNER: 'Là chủ hồ sơ', CURRENT_ASSIGNEE: 'Đang phụ trách hồ sơ' };

export function staffingError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const data = error.response?.data;
    const code = data && typeof data === 'object' ? data.code ?? data.extensions?.code : undefined;
    if (status === 403) return 'Bạn không có quyền thực hiện thao tác này hoặc dữ liệu nằm ngoài phạm vi quản lý.';
    if (status === 404) return 'Dữ liệu không tồn tại hoặc không còn trong phạm vi truy cập. Vui lòng tải lại.';
    const trace = typeof data?.traceId === 'string' ? ` Mã tra cứu: ${data.traceId}` : '';
    if (code === 'schedule.conflicts') {
      const details = data.missingItems ?? data.extensions?.missingItems;
      const labels: Record<string, string> = { SHIFT_OVERLAP: 'Ca trùng thời gian', PAST_OR_APPROVED_LEAVE: 'Ca đã bắt đầu hoặc giao với nghỉ đã duyệt', PAST_SHIFT_CHANGED: 'Ca đã bắt đầu bị thay đổi', INVALID_SLOT: 'Dòng ca không hợp lệ', INVALID_DAY_OFF: 'Ngày nghỉ không hợp lệ hoặc trùng lặp', DAY_OFF_OVERLAP: 'Giờ làm trùng ngày nghỉ đã chọn', PAST_DAY_OFF_CHANGED: 'Không được đổi ngày nghỉ đã qua' };
      const conflicts = Array.isArray(details) ? details.filter((v): v is string => typeof v === 'string').map(v => { const [name, id] = v.split(':'); return (labels[name] || 'Xung đột ca') + (id ? ` (${id})` : ''); }).join('; ') : '';
      return messages[code] + (conflicts ? ' ' + conflicts : '') + trace;
    }
    if (typeof code === 'string' && Object.hasOwn(messages, code)) return messages[code] + trace;
    if (status === 503) return 'Dịch vụ tạm thời chưa sẵn sàng. Vui lòng thử lại sau; thao tác ghi không được tự động gửi lại.' + trace;
    if (status === 413) return 'Tệp vượt quá giới hạn dung lượng cho phép.';
    if (status === 415) return 'Chỉ hỗ trợ tệp Word DOCX hợp lệ.';
    if (status === 409) return 'Dữ liệu hoặc trạng thái đã thay đổi. Vui lòng đọc lại trước khi thao tác tiếp.' + trace;
  }
  if (error instanceof Error && !axios.isAxiosError(error) && error.name !== 'ZodError') return error.message;
  return workflowError(error);
}
