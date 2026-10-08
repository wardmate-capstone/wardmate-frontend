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
  | 'dossiers_completed'
  | 'dossier_detail'
  // Tiện ích
  | 'notifications'
  | 'qr_code'
  | 'feedback'
  | 'profile';

// Kiểu dữ liệu hồ sơ công dân
export interface CitizenDossier {
  code: string;
  procedureId?: string;
  procedureName: string;
  field: string;
  createdAt: string;
  updatedAt: string;
  status:
    | 'Bản nháp'
    | 'Chờ tiền kiểm'
    | 'Cần chỉnh sửa'
    | 'Đã gửi lại'
    | 'Đã duyệt'
    | 'Đã hoàn thành';
  officerNote?: string;
  officerName?: string;
  cases?: ProcedureCase[];
  checklist?: ChecklistItem[];
}

export const initialDossiers: CitizenDossier[] = [
  {
    code: 'HS-2026-00094',
    procedureName: 'Chứng thực bản sao từ bản chính',
    field: 'Chứng thực',
    createdAt: '25/09/2026',
    updatedAt: '28/09/2026 · 08:15',
    status: 'Đã hoàn thành',
    officerName: 'Lê Thu Hà (Bộ phận Một cửa)',
    officerNote: 'Hồ sơ đối chiếu hoàn tất, công dân đã nhận kết quả.',
  },
  {
    code: 'HS-2026-00128',
    procedureName: 'Đăng ký khai sinh',
    field: 'Hộ tịch',
    createdAt: '27/09/2026',
    updatedAt: '28/09/2026 · 09:42',
    status: 'Cần chỉnh sửa',
    officerName: 'Phạm Văn Nam',
    officerNote: 'Ảnh chụp giấy chứng sinh bị mờ góc dưới, vui lòng chụp lại rõ nét.',
  },
  {
    code: 'HS-2026-00155',
    procedureName: 'Xác nhận tình trạng hôn nhân',
    field: 'Hộ tịch',
    createdAt: '28/09/2026',
    updatedAt: '28/09/2026 · 14:20',
    status: 'Đã gửi lại',
    officerName: 'Trần Quốc Bảo',
    officerNote: 'Đã nhận bản cập nhật mới, đang tiền kiểm lần 2.',
  },
  {
    code: 'HS-2026-00160',
    procedureName: 'Đăng ký kết hôn',
    field: 'Hộ tịch',
    createdAt: '27/09/2026',
    updatedAt: '27/09/2026 · 16:30',
    status: 'Chờ tiền kiểm',
    officerName: 'Đang phân công',
    officerNote: 'Hồ sơ đã vào hàng đợi tiền kiểm trực tuyến.',
  },
  {
    code: 'HS-2026-00162',
    procedureName: 'Đăng ký biến động quyền sử dụng đất',
    field: 'Địa chính',
    createdAt: '29/09/2026',
    updatedAt: '29/09/2026 · 10:15',
    status: 'Chờ tiền kiểm',
    officerName: 'Đang phân công',
    officerNote: 'Đã tải lên giấy chứng nhận và căn cước công dân.',
  },
  {
    code: 'HS-2026-00170',
    procedureName: 'Cấp trích lục hộ tịch',
    field: 'Hộ tịch',
    createdAt: '29/09/2026',
    updatedAt: '29/09/2026 · 11:30',
    status: 'Đã duyệt',
    officerName: 'Lê Thu Hà',
    officerNote: 'Hồ sơ tiền kiểm hợp lệ 100%. Vui lòng mang giấy tờ gốc đến Một cửa.',
  },
  {
    code: 'HS-DRAFT-003',
    procedureName: 'Chứng thực chữ ký trong giấy tờ',
    field: 'Chứng thực',
    createdAt: '29/09/2026',
    updatedAt: '29/09/2026 · 09:00',
    status: 'Bản nháp',
    officerNote: 'Chưa nộp tiền kiểm, đang chuẩn bị hồ sơ.',
  },
];

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

export type ChartRange = 'day' | 'week' | 'month' | 'year';

export const citizenChartData: Record<ChartRange, Array<{ label: string; views: number; dossiers: number }>> = {
  day: [
    { label: '06:00', views: 2, dossiers: 0 },
    { label: '09:00', views: 8, dossiers: 2 },
    { label: '12:00', views: 5, dossiers: 1 },
    { label: '15:00', views: 12, dossiers: 3 },
    { label: '18:00', views: 7, dossiers: 1 },
    { label: '21:00', views: 4, dossiers: 0 },
  ],
  week: [
    { label: 'T2', views: 18, dossiers: 2 },
    { label: 'T3', views: 24, dossiers: 3 },
    { label: 'T4', views: 20, dossiers: 1 },
    { label: 'T5', views: 32, dossiers: 4 },
    { label: 'T6', views: 28, dossiers: 2 },
    { label: 'T7', views: 15, dossiers: 1 },
    { label: 'CN', views: 9, dossiers: 0 },
  ],
  month: [
    { label: 'Tuần 1', views: 65, dossiers: 4 },
    { label: 'Tuần 2', views: 92, dossiers: 6 },
    { label: 'Tuần 3', views: 110, dossiers: 7 },
    { label: 'Tuần 4', views: 84, dossiers: 5 },
  ],
  year: [
    { label: 'T1', views: 120, dossiers: 8 },
    { label: 'T2', views: 140, dossiers: 10 },
    { label: 'T3', views: 180, dossiers: 12 },
    { label: 'T4', views: 160, dossiers: 9 },
    { label: 'T5', views: 210, dossiers: 15 },
    { label: 'T6', views: 230, dossiers: 16 },
    { label: 'T7', views: 195, dossiers: 11 },
    { label: 'T8', views: 240, dossiers: 18 },
    { label: 'T9', views: 220, dossiers: 14 },
    { label: 'T10', views: 0, dossiers: 0 },
    { label: 'T11', views: 0, dossiers: 0 },
    { label: 'T12', views: 0, dossiers: 0 },
  ],
};

export function getStatusBadgeClass(status: CitizenDossier['status']): string {
  switch (status) {
    case 'Đã hoàn thành':
      return 'is-success';
    case 'Đã duyệt':
      return 'is-success';
    case 'Chờ tiền kiểm':
      return 'is-info';
    case 'Cần chỉnh sửa':
      return 'is-warning';
    case 'Đã gửi lại':
      return 'is-info';
    case 'Bản nháp':
    default:
      return 'is-warning';
  }
}
