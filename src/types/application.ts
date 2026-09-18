export type ApplicationStatus =
  | 'DRAFT'
  | 'SUBMITTED_FOR_REVIEW'
  | 'UNDER_REVIEW'
  | 'NEED_REVISION'
  | 'RESUBMITTED'
  | 'APPROVED'
  | 'READY_TO_SUBMIT'
  | 'OFFICIALLY_RECEIVED'
  | 'COMPLETED'
  | 'CANCELLED';

export interface CitizenInfo {
  fullName: string;
  dateOfBirth: string;
  citizenId: string;
  gender: 'Nam' | 'Nữ' | 'Khác';
  phoneNumber: string;
  email: string;
  address: string;
  permanentAddress: string;
  ethnicity?: string;
  nationality?: string;
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
  status: 'ok' | 'warning' | 'missing';
  officerNote?: string;
}

export interface SupportingDocument {
  id: string;
  name: string;
  fileType: 'image' | 'pdf';
  fileSize: string;
  uploadDate: string;
  url: string;
  status: 'valid' | 'invalid' | 'pending';
  officerComment?: string;
}

export interface EformField {
  key: string;
  label: string;
  value: string;
  mappedFrom?: string;
  status: 'valid' | 'warning' | 'error';
  officerComment?: string;
  wasChangedInRevision?: boolean;
  oldValue?: string;
}

export interface RevisionDiff {
  fieldName: string;
  oldValue: string;
  newValue: string;
  reason: string;
}

export interface VersionSnapshotDocument {
  name: string;
  fileType: 'image' | 'pdf';
  status: 'valid' | 'invalid' | 'pending';
  officerComment?: string;
}

export interface VersionSnapshot {
  eformFields: EformField[];
  documents: VersionSnapshotDocument[];
  checklist: Array<{ id: string; name: string; status: 'ok' | 'warning' | 'missing'; officerNote?: string }>;
  officerComments: string[];
}

export interface RevisionHistoryItem {
  version: number;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  summary: string;
  diffs: RevisionDiff[];
  commentsCount: number;
  snapshot?: VersionSnapshot;
  officerNote?: string;
  result?: 'approved' | 'need_revision' | 'pending';
}

export interface Application {
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
  eligibility: EligibilityCriterion[];
  checklist: ChecklistItem[];
  documents: SupportingDocument[];
  eformFields: EformField[];
  pdfPreviewUrl: string;
  qrCodeUrl?: string;
  revisionHistory: RevisionHistoryItem[];
  currentVersion: number;
  internalNotes?: string;
  officialReceipt?: {
    receivedAt: string;
    receivedBy: string;
    deskNumber: string;
    verifiedPaperDocs: boolean;
    receiptNumber: string;
  };
}

export type TimeFilterRange = 'day' | 'week' | 'month' | 'year';

export interface ManagerKpiSummary {
  totalApplications: number;
  searchQueriesCount: number;
  firstTimePassRate: number;
  revisionRate: number;
  avgProcessingTimeMinutes: number;
  satisfactionScore: number;
  urgentQueueCount: number;
}

export interface OfficerProductivity {
  id: string;
  officerName: string;
  avatar: string;
  desk: string;
  totalReviewed: number;
  approvedCount: number;
  revisionCount: number;
  avgTimeMinutes: number;
  onTimeRate: number;
  rating: number;
  status: 'active' | 'break' | 'offline';
}

export interface ProcedureStat {
  code: string;
  name: string;
  category: string;
  totalApplications: number;
  approvalRate: number;
  avgProcessingTime: number;
  formDownloadCount: number;
  commonMistake: string;
}

export interface CitizenFeedbackItem {
  id: string;
  citizenName: string;
  applicationNumber: string;
  procedureName: string;
  rating: number;
  speedRating: number;
  clarityRating: number;
  attitudeRating: number;
  comment: string;
  createdAt: string;
  officerResponse?: string;
}
