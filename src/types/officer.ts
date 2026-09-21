export type OfficerSection =
  | 'dashboard'
  | 'apps-all'
  | 'apps-pending'
  | 'apps-reviewing'
  | 'apps-need-revision'
  | 'apps-resubmitted'
  | 'apps-approved'
  | 'apps-ready-submit'
  | 'receipt-waiting'
  | 'receipt-received'
  | 'audit-log'
  | 'notifications'
  | 'profile';

export type ApplicationStatus =
  | 'SUBMITTED_FOR_REVIEW' // Chờ tiền kiểm
  | 'UNDER_REVIEW'         // Đang kiểm tra
  | 'NEED_REVISION'        // Cần bổ sung
  | 'RESUBMITTED'          // Đã gửi lại
  | 'APPROVED'             // Đã duyệt tiền kiểm
  | 'READY_TO_SUBMIT'      // Chờ tiếp nhận chính thức
  | 'OFFICIALLY_RECEIVED'; // Đã tiếp nhận tại UBND

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
  procedureName: string;
  procedureCategory: string;
  citizen: CitizenInfo;
  submittedAt: string;
  reviewStartedAt?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  status: ApplicationStatus;
  urgency: 'normal' | 'urgent' | 'overdue';
  priorityBadge?: string;
  assignedOfficer: string;
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
