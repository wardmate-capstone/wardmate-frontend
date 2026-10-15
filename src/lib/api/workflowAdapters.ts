import type {
  OfficerApplication,
  ApplicationStatus,
  CitizenInfo,
  ChecklistItem,
  SupportingDocument,
  EformField,
  TimelineItem,
  OfficerReviewComment,
} from '@/types/officer';
import type { CitizenDossier } from '@/pages/citizen/types';
import type { ChecklistItem as ProcedureChecklistItem } from '@/lib/procedureContent';
import type {
  ApplicationDto,
  ApplicationSummaryDto,
  ChecklistDto,
  CommentDto,
  HistoryDto,
} from './workflow';

function formatDateTime(isoString?: string | null): string {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    if (Number.isNaN(d.getTime())) return isoString;
    return d.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
}

function parseFormData(raw: unknown): Record<string, unknown> {
  if (!raw) return {};
  if (typeof raw === 'object' && !Array.isArray(raw)) {
    return raw as Record<string, unknown>;
  }
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      if (typeof parsed === 'object' && parsed !== null) return parsed as Record<string, unknown>;
    } catch {
      return {};
    }
  }
  return {};
}

function mapStatus(status?: string | null, resubmitCount = 0): ApplicationStatus {
  const s = (status || '').toUpperCase();
  if (s === 'DRAFT') return 'SUBMITTED_FOR_REVIEW';
  if (s === 'SUBMITTED') return resubmitCount > 0 ? 'RESUBMITTED' : 'SUBMITTED_FOR_REVIEW';
  if (s === 'UNDER_REVIEW') return 'UNDER_REVIEW';
  if (s === 'NEED_REVISION') return 'NEED_REVISION';
  if (s === 'APPROVED') return 'APPROVED';
  if (s === 'REJECTED') return 'REJECTED';
  return 'SUBMITTED_FOR_REVIEW';
}

function humanizeFieldName(key: string): string {
  const map: Record<string, string> = {
    fullName: 'Họ và tên',
    applicantName: 'Họ và tên người nộp',
    citizenId: 'Số định danh cá nhân / CCCD',
    cccd: 'Số CCCD',
    idNumber: 'Số giấy tờ tùy thân',
    dateOfBirth: 'Ngày tháng năm sinh',
    dob: 'Ngày sinh',
    phoneNumber: 'Số điện thoại liên hệ',
    phone: 'Số điện thoại',
    email: 'Địa chỉ Email',
    address: 'Địa chỉ thường trú',
    permanentAddress: 'Nơi đăng ký thường trú',
    temporaryAddress: 'Nơi tạm trú',
    currentAddress: 'Nơi ở hiện nay',
    gender: 'Giới tính',
    nationality: 'Quốc tịch',
    ethnicity: 'Dân tộc',
    wardCode: 'Mã Phường/Xã tiếp nhận',
    caseCode: 'Trường hợp thủ tục',
  };
  return map[key] || key;
}

export function mapCommentDtoToOfficerReviewComment(c: CommentDto, officerFallback = 'Cán bộ Một cửa'): OfficerReviewComment {
  return {
    id: c.id,
    category: c.targetType === 'CHECKLIST_ITEM' ? 'checklist' : 'eform',
    target: c.fieldLabel || c.targetId || 'Nhận xét',
    content: c.commentText || '',
    createdAt: formatDateTime(c.createdAt),
    officerName: officerFallback,
  };
}

export function mapHistoryDtoToTimelineItem(h: HistoryDto): TimelineItem {
  const statusTitles: Record<string, string> = {
    DRAFT: 'Hồ sơ được tạo bản nháp',
    SUBMITTED: 'Công dân nộp hồ sơ tiền kiểm',
    UNDER_REVIEW: 'Cán bộ tiếp nhận và bắt đầu kiểm tra',
    NEED_REVISION: 'Cán bộ gửi yêu cầu bổ sung/chỉnh sửa hồ sơ',
    APPROVED: 'Cán bộ đã duyệt tiền kiểm thành công',
    REJECTED: 'Cán bộ từ chối hồ sơ',
    CANCELLED: 'Hồ sơ đã bị hủy',
  };

  return {
    id: h.id,
    time: formatDateTime(h.createdAt),
    title: statusTitles[h.toStatus] || `Chuyển trạng thái: ${h.toStatus}`,
    actor: h.changedBy ? `Mã CB: ${h.changedBy.slice(0, 8)}` : 'Hệ thống',
    description: h.reason || undefined,
    type: 'officer',
    status: 'done',
  };
}

export function mapSummaryDtoToOfficerApplication(summary: ApplicationSummaryDto): OfficerApplication {
  const status = mapStatus(summary.status);
  return {
    id: summary.id,
    applicationNumber: summary.applicationCode || `HS-${summary.id.slice(0, 8).toUpperCase()}`,
    procedureId: summary.procedureId,
    procedureName: summary.procedureTitle || 'Thủ tục hành chính',
    procedureCategory: 'Hành chính cấp Xã/Phường',
    citizen: {
      fullName: 'Đang tải thông tin...',
      dateOfBirth: '—',
      citizenId: '—',
      phoneNumber: '—',
      email: '—',
      address: summary.wardCode ? `Phường/Xã: ${summary.wardCode}` : '—',
      permanentAddress: '—',
      gender: 'Nam',
    },
    submittedAt: formatDateTime(summary.submittedAt || summary.createdAt),
    status,
    urgency: 'normal',
    assignedOfficer: 'Chưa phân công',
    eligibility: [],
    checklist: [],
    documents: [],
    eformFields: [],
    pdfPreviewUrl: '',
    revisionHistory: [],
    timeline: [],
    comments: [],
    currentVersion: 1,
  };
}

export function mapApplicationDtoToOfficerApplication(dto: ApplicationDto, comments: CommentDto[] = []): OfficerApplication {
  const formData = parseFormData(dto.formData);
  const status = mapStatus(dto.status, dto.resubmitCount);
  const currentVersion = dto.currentVersionNumber || dto.resubmitCount + 1 || 1;

  // Citizen info extracted from formData
  const citizen: CitizenInfo = {
    fullName: String(formData.applicantName || formData.fullName || formData.name || 'Công dân nộp hồ sơ'),
    citizenId: String(formData.citizenId || formData.cccd || formData.idNumber || '—'),
    phoneNumber: String(formData.phoneNumber || formData.phone || '—'),
    email: String(formData.email || '—'),
    address: String(formData.address || formData.currentAddress || (dto.wardCode ? `Phường: ${dto.wardCode}` : '—')),
    permanentAddress: String(formData.permanentAddress || formData.address || '—'),
    dateOfBirth: String(formData.dateOfBirth || formData.dob || '—'),
    gender: (formData.gender === 'Nữ' ? 'Nữ' : 'Nam') as 'Nam' | 'Nữ' | 'Khác',
    ethnicity: formData.ethnicity ? String(formData.ethnicity) : undefined,
    nationality: formData.nationality ? String(formData.nationality) : 'Việt Nam',
  };

  // Checklists
  const checklist: ChecklistItem[] = (dto.checklists || []).map((c: ChecklistDto) => ({
    id: c.id,
    name: c.title || c.code || 'Giấy tờ kèm theo',
    type: c.isRequired ? 'mandatory' : 'optional',
    citizenStatus: c.status === 'COMPLETED' ? 'prepared' : 'missing',
    officerStatus: c.status === 'COMPLETED' ? 'valid' : 'check_needed',
    officerNote: c.note || undefined,
  }));

  // Documents
  const documents: SupportingDocument[] = (dto.checklists || [])
    .filter((c: ChecklistDto) => Boolean(c.fileUrl))
    .map((c: ChecklistDto) => {
      const isPdf = Boolean(c.fileUrl?.toLowerCase().includes('.pdf'));
      return {
        id: c.id,
        name: c.title || 'Tệp đính kèm',
        fileType: isPdf ? 'pdf' : 'image',
        fileSize: 'Đã tải lên',
        uploadDate: formatDateTime(c.updatedAt),
        url: c.fileUrl!,
        previewUrl: c.fileUrl!,
        status: c.status === 'COMPLETED' ? 'valid' : 'pending',
        officerComment: c.note || undefined,
      };
    });

  // E-form fields
  const eformFields: EformField[] = Object.entries(formData).map(([k, v]) => ({
    key: `/formData/${k}`,
    label: humanizeFieldName(k),
    value: typeof v === 'object' && v !== null ? JSON.stringify(v) : String(v ?? ''),
    status: 'valid',
  }));

  // Timeline from backend history
  const timeline: TimelineItem[] = (dto.history || []).map(mapHistoryDtoToTimelineItem);

  // Review comments mapped from backend
  const mappedComments: OfficerReviewComment[] = comments.map((c) =>
    mapCommentDtoToOfficerReviewComment(c, dto.assignedOfficerId ? `Cán bộ ${dto.assignedOfficerId.slice(0, 6)}` : 'Cán bộ Một cửa')
  );

  return {
    id: dto.id,
    applicationNumber: dto.applicationCode || `HS-${dto.id.slice(0, 8).toUpperCase()}`,
    procedureId: dto.procedureId,
    caseCode: dto.caseCode || undefined,
    procedureName: dto.procedureTitle || 'Thủ tục hành chính',
    procedureCategory: 'Hành chính cấp Xã/Phường',
    citizen,
    submittedAt: formatDateTime(dto.submittedAt || dto.createdAt),
    reviewStartedAt: dto.assignedOfficerId ? formatDateTime(dto.updatedAt) : undefined,
    reviewedBy: dto.assignedOfficerId ? `Cán bộ (${dto.assignedOfficerId.slice(0, 8)})` : undefined,
    status,
    urgency: 'normal',
    assignedOfficer: dto.assignedOfficerId ? `Cán bộ ${dto.assignedOfficerId.slice(0, 8)}` : 'Chưa phân công',
    eligibility: [
      { id: 'el-1', label: 'Đúng đơn vị hành chính tiếp nhận (Phường/Xã)', met: Boolean(dto.wardCode), notes: dto.wardCode || undefined },
      { id: 'el-2', label: 'Đúng trường hợp hồ sơ quy định', met: Boolean(dto.caseCode), notes: dto.caseCode || undefined },
    ],
    checklist,
    documents,
    eformFields,
    pdfPreviewUrl: '',
    revisionHistory: [],
    timeline,
    comments: mappedComments,
    currentVersion,
  };
}

export function mapSummaryDtoToCitizenDossier(summary: ApplicationSummaryDto): CitizenDossier {
  const s = (summary.status || '').toUpperCase();
  let status: CitizenDossier['status'] = 'Bản nháp';
  if (s === 'DRAFT') status = 'Bản nháp';
  else if (s === 'SUBMITTED' || s === 'UNDER_REVIEW') status = 'Chờ tiền kiểm';
  else if (s === 'NEED_REVISION') status = 'Cần chỉnh sửa';
  else if (s === 'APPROVED') status = 'Đã duyệt';
  else if (s === 'REJECTED') status = 'Đã từ chối';

  return {
    id: summary.id,
    code: summary.applicationCode || `HS-${summary.id.slice(0, 8).toUpperCase()}`,
    procedureId: summary.procedureId,
    procedureName: summary.procedureTitle || 'Thủ tục hành chính',
    field: 'Hành chính cấp Xã/Phường',
    createdAt: formatDateTime(summary.createdAt),
    updatedAt: formatDateTime(summary.submittedAt || summary.createdAt),
    status,
    wardCode: summary.wardCode || undefined,
  };
}

export function mapApplicationDtoToCitizenDossier(dto: ApplicationDto): CitizenDossier {
  const s = (dto.status || '').toUpperCase();
  let status: CitizenDossier['status'] = 'Bản nháp';
  if (s === 'DRAFT') status = 'Bản nháp';
  else if (s === 'SUBMITTED') status = dto.resubmitCount > 0 ? 'Đã gửi lại' : 'Chờ tiền kiểm';
  else if (s === 'UNDER_REVIEW') status = 'Chờ tiền kiểm';
  else if (s === 'NEED_REVISION') status = 'Cần chỉnh sửa';
  else if (s === 'APPROVED') status = 'Đã duyệt';
  else if (s === 'REJECTED') status = 'Đã từ chối';

  const checklist: ProcedureChecklistItem[] = (dto.checklists || []).map((c: ChecklistDto) => ({
    checklistId: c.id,
    caseCode: c.caseCode || undefined,
    submissionType: c.submissionType || 'NOP',
    itemName: c.title || c.code || 'Giấy tờ',
    documentCopyType: c.documentCopyType || 'ORIGINAL',
    quantity: c.quantity,
    conditionNote: c.conditionNote || c.note || undefined,
    isMandatory: c.isRequired,
    formTemplateId: c.formTemplateId || undefined,
    templateUrl: c.formTemplateId ? 'linked' : undefined,
    templateFormat: c.formTemplateId ? 'DOCX' : undefined,
    status: c.status === 'COMPLETED' || c.status === 'REJECTED' ? c.status : 'PENDING',
    sortOrder: c.sortOrder,
  }));

  return {
    id: dto.id,
    code: dto.applicationCode || `HS-${dto.id.slice(0, 8).toUpperCase()}`,
    procedureId: dto.procedureId,
    caseCode: dto.caseCode || undefined,
    procedureName: dto.procedureTitle || 'Thủ tục hành chính',
    field: 'Hành chính cấp Xã/Phường',
    createdAt: formatDateTime(dto.createdAt),
    updatedAt: formatDateTime(dto.updatedAt),
    status,
    officerNote: dto.notes || undefined,
    officerName: dto.assignedOfficerId ? `Cán bộ (${dto.assignedOfficerId.slice(0, 8)})` : undefined,
    currentVersion: dto.currentVersionNumber,
    wardCode: dto.wardCode || undefined,
    formData: parseFormData(dto.formData),
    checklist,
  };
}
