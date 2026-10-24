export type OfficerSection =
  | 'dashboard'
  | 'apps-all'
  | 'apps-pending'
  | 'apps-reviewing'
  | 'apps-need-revision'
  | 'apps-resubmitted'
  | 'apps-approved'
  | 'audit-log'
  | 'notifications'
  | 'profile';

export type ApplicationStatus =
  | 'DRAFT'                // Bản nháp công dân chưa gửi
  | 'SUBMITTED_FOR_REVIEW' // Chờ tiền kiểm
  | 'UNDER_REVIEW'         // Đang kiểm tra
  | 'NEED_REVISION'        // Cần bổ sung
  | 'RESUBMITTED'          // Đã gửi lại
  | 'DOCUMENTS_READY'      // Giấy tờ sẵn sàng (Hoàn thành tiền kiểm trực tuyến)
  | 'APPROVED'             // Trạng thái lịch sử, không mở khóa PDF
  | 'REJECTED'             // Từ chối tiền kiểm
  | 'CANCELLED'            // Công dân đã hủy
  | 'READY_TO_SUBMIT'      // Trạng thái tương thích cũ
  | 'OFFICIALLY_RECEIVED'; // Trạng thái ngoài hệ thống Một cửa điện tử Nhà nước

export interface CitizenInfo {
  fullName: string;
  dateOfBirth: string;
  citizenId: string;
  phoneNumber: string;
  email: string;
  address: string;
  permanentAddress: string;
  gender: 'Nam' | 'Nữ' | 'Khác';
  ethnicity?: string;
  nationality?: string;
  fieldReviews?: Record<string, { status: 'valid' | 'warning'; comment?: string }>;
}

export interface EligibilityCriterion {
  id: string;
  label: string;
  met: boolean;
  notes?: string;
}

export interface ChecklistItem {
  id: string;
  name: string;
  type: 'mandatory' | 'optional' | 'conditional';
  citizenStatus: 'prepared' | 'missing';
  officerStatus: 'valid' | 'check_needed' | 'missing' | 'invalid';
  officerNote?: string;
}

export interface SupportingDocument {
  id: string;
  name: string;
  fileType: 'image' | 'pdf';
  fileSize: string;
  uploadDate: string;
  url: string;
  previewUrl?: string;
  status: 'valid' | 'invalid' | 'pending';
  officerComment?: string;
}

export interface EformField {
  key: string;
  label: string;
  value: string;
  status: 'valid' | 'warning' | 'error';
  officerComment?: string;
  wasChangedInRevision?: boolean;
  oldValue?: string;
}

export interface RevisionDiff {
  fieldName: string;
  v1Value: string;
  v2Value: string;
  reason?: string;
}

export interface RevisionHistoryItem {
  version: number;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  summary: string;
  diffs: RevisionDiff[];
  commentsCount: number;
  officerNote?: string;
}

export interface TimelineItem {
  id: string;
  time: string;
  title: string;
  actor: string;
  description?: string;
  type: 'system' | 'citizen' | 'officer';
  status: 'done' | 'current' | 'pending';
}

export interface OfficerReviewComment {
  status?: 'OPEN' | 'RESOLVED';
  versionNumber?: number;
  targetId?: string;
  id: string;
  category: 'eform' | 'document' | 'checklist' | 'general';
  target: string;
  content: string;
  createdAt: string;
  officerName: string;
}

export interface OfficialPaperCheckItem {
  id: string;
  name: string;
  description: string;
  checked: boolean;
  originalPresented: boolean;
}

export interface OfficialReceiptData {
  receivedAt: string;
  receivedBy: string;
  deskNumber: string;
  receiptNumber: string;
  appointmentDate: string;
}

export interface OfficerApplication {
  id: string;
  applicationNumber: string; // e.g. HS-2026-00125
  procedureId: string;
  caseCode?: string;
  procedureName: string;
  procedureCategory: string;
  citizen: CitizenInfo;
  submittedAt: string;
  submittedAtUtc?: string | null;
  categoryId?: number | null;
  /** Phiên bản phân công để gửi kèm khi trả lại/giao/chuyển (chống thao tác trên dữ liệu cũ). */
  assignmentVersion?: number | null;
  resubmitCount?: number;
  reviewStartedAt?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  status: ApplicationStatus;
  urgency: 'normal' | 'urgent' | 'overdue';
  priorityBadge?: string;
  assignedOfficer: string;
  assignedOfficerId?: string;
  eligibility: EligibilityCriterion[];
  checklist: ChecklistItem[];
  documents: SupportingDocument[];
  eformFields: EformField[];
  pdfPreviewUrl: string;
  revisionHistory: RevisionHistoryItem[];
  timeline: TimelineItem[];
  comments: OfficerReviewComment[];
  currentVersion: number;
  officialPaperChecklist?: OfficialPaperCheckItem[];
  officialReceipt?: OfficialReceiptData;
  dueAtUtc?: string | null;
  deadlineStatus?: string | null;
}

export interface OfficerAuditLog {
  id: string;
  time: string;
  applicationNumber: string;
  citizenName: string;
  action: string;
  details: string;
  officerName: string;
  badgeTone: 'info' | 'success' | 'warning' | 'danger';
}

export interface OfficerNotification {
  id: string;
  time: string;
  title: string;
  message: string;
  applicationNumber?: string;
  type: 'resubmitted' | 'new_pending' | 'urgent' | 'system';
  isRead: boolean;
}
