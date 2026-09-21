export type ProcedureStatus = 'DRAFT' | 'PUBLISHED' | 'UNPUBLISHED' | 'ARCHIVED';

export type FormStatus = 'PUBLISHED' | 'DRAFT' | 'UNPUBLISHED' | 'ARCHIVED';

export type FormFileType = 'WORD' | 'PDF' | 'BOTH';

export type LegalDocType = 'LUAT' | 'NGHI_DINH' | 'THONG_TU' | 'QUYET_DINH' | 'KHAC';

export type AiSourceType = 'LEGAL_DOC' | 'FAQ' | 'PROCEDURE_GUIDE' | 'OPERATIONAL_CONTENT';

export type AiSyncStatus = 'SYNCED' | 'PENDING' | 'SYNCING' | 'ERROR';

export interface ProcedureCategory {
  id: string;
  code: string;
  name: string;
  description: string;
  procedureCount: number;
  iconName?: string;
}

export interface ProcedureCondition {
  id: string;
  order: number;
  content: string;
  isMandatory: boolean;
  notes?: string;
}

export interface ProcedureChecklistTemplate {
  id: string;
  order: number;
  documentName: string;
  description: string;
  isMandatory: boolean;
  allowUpload: boolean;
  maxFiles: number;
  allowedFormats: string[]; // e.g. ['pdf', 'jpg', 'png', 'docx']
  instruction: string;
}

export interface ProcedureStep {
  id: string;
  stepNumber: number;
  title: string;
  description: string;
  responsibleParty: 'CITIZEN' | 'OFFICER' | 'SYSTEM' | 'UBND';
  estimatedDuration?: string;
}

export interface ProcedureFormVersion {
  version: string; // 'V1', 'V2', 'V3'
  status: FormStatus;
  effectiveDate: string;
  expirationDate?: string;
  createdBy: string;
  createdAt: string;
  changeLog: string;
  wordFileName: string;
  pdfFileName?: string;
  sampleFilledFileName?: string;
  fileSize?: string;
}

export interface ProcedureForm {
  id: string;
  code: string; // Mã biểu mẫu, e.g. 'BM-HT-01'
  name: string; // Tên biểu mẫu
  procedureId: string; // Thủ tục áp dụng ID
  procedureName: string; // Thủ tục áp dụng Tên
  currentVersion: string; // 'V1', 'V2', 'V3'
  fileType: FormFileType;
  effectiveDate: string;
  expirationDate?: string;
  status: FormStatus;
  updatedAt: string;
  description?: string;
  wordFileName: string; // File Word (.doc/.docx)
  pdfFileName?: string; // File PDF nếu có
  sampleFilledFileName?: string; // File mẫu minh họa nếu có
  fileSize?: string;
  versions: ProcedureFormVersion[];
}

export interface LegalDocument {
  id: string;
  docNumber: string; // e.g. '123/2020/NĐ-CP'
  title: string;
  docType: LegalDocType;
  issuingAuthority: string; // e.g. 'Chính phủ'
  issuedDate: string;
  effectiveDate: string;
  expirationDate?: string;
  status: 'VALID' | 'EXPIRED' | 'REPLACED';
  fileUrl?: string;
  sourceUrl?: string;
  notes?: string;
  linkedProcedureCount?: number;
}

export interface ProcedureLegalLink {
  id: string;
  procedureId: string;
  legalDocumentId: string;
  legalDocument: LegalDocument;
  articles?: string; // 'Điều 5, Điều 6'
  effectiveDate: string;
}

export interface AiKnowledgeSource {
  id: string;
  name: string;
  type: AiSourceType;
  status: 'ACTIVE' | 'DISABLED';
  syncStatus: AiSyncStatus;
  lastUpdated: string;
  itemCount: number;
  description: string;
}

export interface ProcedureItem {
  id: string;
  code: string; // e.g. 'HT-01'
  title: string; // e.g. 'Đăng ký kết hôn'
  categoryId: string;
  categoryName: string;
  version: string; // e.g. 'V3'
  status: ProcedureStatus;
  updatedAt: string;
  updatedBy: string;
  description: string;
  targetAudience: string;
  receivingAuthority: string;
  receivingLocation: string;
  resultDescription: string;
  processingTimeDays: number;
  timeUnit: 'NGAY_LAM_VIEC' | 'GIO';
  feeAmount: number;
  isFeeFree: boolean;
  feeNotes?: string;
  workingHoursNotes?: string;
  conditions: ProcedureCondition[];
  checklistTemplates: ProcedureChecklistTemplate[];
  steps: ProcedureStep[];
  forms: ProcedureForm[];
  legalDocuments: LegalDocument[];
  hasForms: boolean;
  isChecklistComplete: boolean;
}

export interface ProcedureAuditLog {
  id: string;
  timestamp: string;
  performedBy: string;
  performerRole: string;
  targetId: string;
  targetName: string;
  targetType: 'PROCEDURE' | 'FORM' | 'LEGAL_DOC';
  action: 'CREATE' | 'UPDATE' | 'VERSION_CHANGE' | 'STATUS_CHANGE' | 'PUBLISH' | 'UNPUBLISH';
  summary: string;
  details?: string;
}

export interface ProcedureManagerStats {
  publishedCount: number;
  draftCount: number;
  pausedCount: number;
  activeFormsCount: number;
  formsNeedUpdateCount: number;
  legalDocsCount: number;
}
