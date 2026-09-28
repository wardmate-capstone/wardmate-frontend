export type CitizenNotificationType =
  | 'need_revision'   // Cần bổ sung hồ sơ
  | 'approved'        // Đã duyệt tiền kiểm
  | 'submitted'       // Đã gửi tiền kiểm
  | 'reminder'        // Nhắc nhở
  | 'info';           // Thông tin chung

export interface CitizenNotification {
  id: string;
  title: string;
  message: string;
  type: CitizenNotificationType;
  procedureName?: string;
  applicationCode?: string;
  createdAt: string; // ISO string or relative time label
  isRead: boolean;
  actionUrl?: string;
  actionLabel?: string;
}
