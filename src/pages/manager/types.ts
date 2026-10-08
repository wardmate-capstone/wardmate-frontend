export type ManagerSectionId =
  | 'stats-dossiers'
  | 'stats-procedures'
  | 'stats-searches'
  | 'stats-forms'
  | 'profiles'
  // Hiệu suất xử lý
  | 'perf-processing-time'
  | 'perf-completion-rate'
  | 'perf-supplement-rate'
  | 'perf-officers'
  // Phản hồi người dân
  | 'feedback-reports'
  | 'satisfaction-level'
  | 'profile';

export interface ManagerProfileItem {
  userId: string;
  username?: string;
  email?: string;
  isActive?: boolean;
  fullName: string;
  identityNumber: string;
  phoneNumber: string;
  dateOfBirth: string;
  gender: 'Nam' | 'Nữ' | 'Khác';
  permanentAddress: string;
  temporaryAddress: string;
  updatedAt?: string;
  ethnicity?: string;
  vneidLevel?: number;

  dossierHistory?: Array<{
    code: string;
    procedureName: string;
    field: string;
    submittedAt: string;
    status: 'Đã hoàn thành' | 'Đang xử lý' | 'Cần bổ sung';
    officer: string;
  }>;
}

export interface NavGroupItem {
  id: ManagerSectionId;
  label: string;
  icon?: React.ComponentType<{ size?: number; className?: string; weight?: string }>;
  badge?: string;
  badgeTone?: 'default' | 'success' | 'warning' | 'info';
}

export interface NavGroup {
  group: string;
  items: NavGroupItem[];
}
