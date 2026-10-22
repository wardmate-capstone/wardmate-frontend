import type { ProcedureCase, ChecklistItem } from '@/lib/procedureContent';

export type CitizenSectionId =
  | 'dashboard'
  | 'procedures'
  // Hồ sơ của tôi
  | 'dossiers_all'
  | 'dossiers_draft'
  | 'dossiers_pending'
  | 'dossiers_need_revision'
  | 'dossiers_resubmitted'
  | 'dossiers_approved'
  | 'dossier_detail'
  | 'submissions'
  // Tiện ích
  | 'notifications'
  | 'qr_code'
  | 'feedback'
  | 'profile';

// Kiểu dữ liệu hồ sơ công dân
export interface CitizenDossier {
  id?: string;
  code: string;
  procedureId?: string;
  caseCode?: string;
  procedureName: string;
  field: string;
  createdAt: string;
  updatedAt: string;
  status:
    | 'Bản nháp'
    | 'Chờ tiền kiểm'
    | 'Cần chỉnh sửa'
    | 'Đã gửi lại'
    | 'Giấy tờ sẵn sàng'
    | 'Đã duyệt'
    | 'Đã hoàn thành'
    | 'Đã từ chối'
    | 'Đã hủy'
    | 'Đã tiếp nhận tại quầy';
  officerNote?: string;
  officerName?: string;
  cases?: ProcedureCase[];
  checklist?: ChecklistItem[];
  currentVersion?: number;
  wardCode?: string;
  formData?: Record<string, unknown>;
  dueAtUtc?: string | null;
  deadlineStatus?: string | null;
}



export type CitizenNotification = {
  id: string;
  title: string;
  content: string;
  time: string;
  read: boolean;
  type: 'success' | 'warning' | 'info';
};

export const citizenNotifications: CitizenNotification[] = [
  { id: 'notif-1', title: 'Hồ sơ đã được phê duyệt tiền kiểm', content: 'Hồ sơ HS-2026-00170 đã đạt yêu cầu. Bạn có thể đến bộ phận Một cửa để đối chiếu giấy tờ gốc.', time: '10 phút trước', read: false, type: 'success' },
  { id: 'notif-2', title: 'Yêu cầu chỉnh sửa ảnh giấy chứng sinh', content: 'Hồ sơ HS-2026-00128 cần chụp lại giấy chứng sinh do bị mờ góc dưới bên phải.', time: '2 giờ trước', read: false, type: 'warning' },
  { id: 'notif-3', title: 'Cán bộ đang tiền kiểm hồ sơ', content: 'Cán bộ Trần Quốc Bảo đã tiếp nhận tiền kiểm hồ sơ HS-2026-00155.', time: 'Hôm qua · 14:20', read: true, type: 'info' },
  { id: 'notif-4', title: 'Hoàn tất trả kết quả hồ sơ', content: 'Hồ sơ HS-2026-00094 chứng thực bản sao đã hoàn tất thành công.', time: '28/09/2026', read: true, type: 'success' },
];



export function getStatusBadgeClass(status: CitizenDossier['status']): string {
  switch (status) {
    case 'Đã hoàn thành':
    case 'Đã tiếp nhận tại quầy':
      return 'is-success';
    case 'Giấy tờ sẵn sàng':
    case 'Đã duyệt':
      return 'is-success';
    case 'Chờ tiền kiểm':
      return 'is-info';
    case 'Cần chỉnh sửa':
      return 'is-warning';
    case 'Đã gửi lại':
      return 'is-info';
    case 'Đã từ chối':
    case 'Đã hủy':
      return 'is-danger';
    case 'Bản nháp':
    default:
      return 'is-warning';
  }
}
