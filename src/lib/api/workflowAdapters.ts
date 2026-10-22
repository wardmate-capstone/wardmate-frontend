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

export function parseFormData(raw: unknown): Record<string, unknown> {
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

export function extractCitizenInfoFromFormData(formData: Record<string, unknown>): {
  fullName: string;
  citizenId: string;
  phoneNumber?: string;
  email?: string;
} {
  const fullName = String(
    formData.applicantName ||
    formData.fullName ||
    formData.name ||
    formData.hoTen ||
    formData.hoVaTen ||
    formData.hoTenNguoiKhai ||
    formData.nguoiYeuCau ||
    ''
  ).trim();

  const citizenId = String(
    formData.identityNumber ||
    formData.citizenId ||
    formData.cccd ||
    formData.idNumber ||
    formData.soCCCD ||
    formData.soDinhDanh ||
    ''
  ).trim();

  const phoneNumber = String(formData.phoneNumber || formData.phone || formData.sdt || '').trim() || undefined;
  const email = String(formData.email || '').trim() || undefined;

  return {
    fullName: fullName || 'Công dân',
    citizenId: citizenId || '—',
    phoneNumber,
    email,
  };
}

function mapStatus(status?: string | null, resubmitCount = 0): ApplicationStatus {
  const s = (status || '').toUpperCase();
  if (s === 'DRAFT') return 'SUBMITTED_FOR_REVIEW';
  if (s === 'SUBMITTED') return resubmitCount > 0 ? 'RESUBMITTED' : 'SUBMITTED_FOR_REVIEW';
  if (s === 'UNDER_REVIEW') return 'UNDER_REVIEW';
  if (s === 'NEED_REVISION') return 'NEED_REVISION';
  if (s === 'DOCUMENTS_READY') return 'DOCUMENTS_READY';
  if (s === 'OFFICIALLY_RECEIVED') return 'OFFICIALLY_RECEIVED';
  if (s === 'READY_TO_SUBMIT') return 'READY_TO_SUBMIT';
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
    status: c.status === 'RESOLVED' ? 'RESOLVED' : 'OPEN',
    versionNumber: c.versionNumber,
    targetId: c.targetId || undefined,
  };
}

export function mapHistoryDtoToTimelineItem(h: HistoryDto): TimelineItem {
  const statusTitles: Record<string, string> = {
    DRAFT: 'Hồ sơ được tạo bản nháp',
    SUBMITTED: 'Công dân nộp hồ sơ tiền kiểm',
    UNDER_REVIEW: 'Cán bộ tiếp nhận và bắt đầu kiểm tra',
    NEED_REVISION: 'Cán bộ gửi yêu cầu bổ sung/chỉnh sửa hồ sơ',
    DOCUMENTS_READY: 'Cán bộ xác nhận giấy tờ sẵn sàng để mang đến phường',
    APPROVED: 'Đã duyệt theo luồng cũ',
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

export type OfficerLookup = {
  currentOfficer?: { id?: string; name?: string };
  directory?: Record<string, string>; // map lowercase officerId -> fullName hoặc username
};

export function resolveOfficerDisplayName(
  assignedOfficerId?: string | null,
  assignedOfficerName?: string | null,
  lookup?: OfficerLookup
): string {
  if (assignedOfficerName?.trim()) return assignedOfficerName.trim();
  if (!assignedOfficerId?.trim()) return 'Chưa phân công';

  const cleanId = assignedOfficerId.trim().toLowerCase();

  // 1. Kiểm tra nếu khớp với cán bộ đang đăng nhập
  if (
    lookup?.currentOfficer?.id &&
    lookup.currentOfficer.id.trim().toLowerCase() === cleanId &&
    lookup.currentOfficer.name?.trim()
  ) {
    return lookup.currentOfficer.name.trim();
  }

  // 2. Tra cứu trong danh bạ cán bộ (nếu có nạp từ hệ thống)
  if (lookup?.directory && lookup.directory[cleanId]?.trim()) {
    return lookup.directory[cleanId].trim();
  }

  // 3. Fallback hiển thị mã rút gọn
  return `Cán bộ (${cleanId.slice(0, 8)})`;
}

export function mapSummaryDtoToOfficerApplication(
  summary: ApplicationSummaryDto,
  lookup?: OfficerLookup
): OfficerApplication {
  const status = mapStatus(summary.status);
  const assignedOfficer = resolveOfficerDisplayName(
    summary.assignedOfficerId,
    summary.assignedOfficerName,
    lookup
  );

  return {
    id: summary.id,
    applicationNumber: summary.applicationCode || `HS-${summary.id.slice(0, 8).toUpperCase()}`,
    procedureId: summary.procedureId,
    procedureName: summary.procedureTitle || 'Thủ tục hành chính',
    procedureCategory: 'Hành chính cấp Xã/Phường',
    citizen: {
      fullName: summary.applicantName?.trim() || 'Công dân',
      dateOfBirth: '—',
      citizenId: summary.citizenId?.trim() || '—',
      phoneNumber: '—',
      email: '—',
      address: summary.wardCode ? `Phường/Xã: ${summary.wardCode}` : '—',
      permanentAddress: '—',
      gender: 'Nam',
    },
    submittedAt: formatDateTime(summary.submittedAt || summary.createdAt),
    status,
    urgency: summary.dueAtUtc && Date.parse(summary.dueAtUtc) < Date.now() && status !== 'DOCUMENTS_READY' && status !== 'OFFICIALLY_RECEIVED' && status !== 'REJECTED' ? 'overdue' : 'normal',
    dueAtUtc: summary.dueAtUtc,
    deadlineStatus: summary.deadlineStatus,
    assignedOfficer,
    eligibility: [],
    checklist: [],
    documents: [],
    eformFields: [],
    pdfPreviewUrl: '',
    revisionHistory: [],
    timeline: [],
    comments: [],
    currentVersion: 1,
    officialReceipt: summary.receiptNumber ? {
      receiptNumber: summary.receiptNumber,
      receivedAt: formatDateTime(summary.receivedAt),
      appointmentDate: formatDateTime(summary.appointmentDate),
      receivedBy: assignedOfficer,
      deskNumber: 'Quầy tiếp nhận số 1',
    } : undefined,
  };
}

export function mapApplicationDtoToOfficerApplication(
  dto: ApplicationDto,
  comments: CommentDto[] = [],
  lookup?: OfficerLookup
): OfficerApplication {
  const formData = parseFormData(dto.formData);
  const status = mapStatus(dto.status, dto.resubmitCount);
  const currentVersion = dto.currentVersionNumber;
  const officerDisplayName = resolveOfficerDisplayName(dto.assignedOfficerId, undefined, lookup);
  const citizenInfo = extractCitizenInfoFromFormData(formData);

  // Citizen info extracted from formData
  const citizen: CitizenInfo = {
    fullName: citizenInfo.fullName === 'Công dân' ? 'Công dân nộp hồ sơ' : citizenInfo.fullName,
    citizenId: citizenInfo.citizenId,
    phoneNumber: citizenInfo.phoneNumber || String(formData.phoneNumber || formData.phone || '—'),
    email: citizenInfo.email || String(formData.email || '—'),
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
  const eformFields: EformField[] = formDataFields(formData);

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
    reviewedBy: dto.assignedOfficerId ? officerDisplayName : undefined,
    status,
    urgency: dto.dueAtUtc && Date.parse(dto.dueAtUtc) < Date.now() && status !== 'DOCUMENTS_READY' && status !== 'OFFICIALLY_RECEIVED' && status !== 'REJECTED' ? 'overdue' : 'normal',
    dueAtUtc: dto.dueAtUtc,
    deadlineStatus: dto.deadlineStatus,
    assignedOfficer: officerDisplayName,
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
    officialReceipt: dto.receiptNumber ? {
      receiptNumber: dto.receiptNumber,
      receivedAt: formatDateTime(dto.receivedAt),
      appointmentDate: formatDateTime(dto.appointmentDate),
      receivedBy: dto.assignedOfficerId ? officerDisplayName : 'Bộ phận Một cửa',
      deskNumber: 'Quầy tiếp nhận số 1',
    } : undefined,
  };
}

export function mapSummaryDtoToCitizenDossier(summary: ApplicationSummaryDto): CitizenDossier {
  const s = (summary.status || '').toUpperCase();
  let status: CitizenDossier['status'] = 'Bản nháp';
  if (s === 'DRAFT') status = 'Bản nháp';
  else if (s === 'SUBMITTED' || s === 'UNDER_REVIEW') status = 'Chờ tiền kiểm';
  else if (s === 'NEED_REVISION') status = 'Cần chỉnh sửa';
  else if (s === 'DOCUMENTS_READY') status = 'Giấy tờ sẵn sàng';
  else if (s === 'OFFICIALLY_RECEIVED') status = 'Đã tiếp nhận tại quầy';
  else if (s === 'APPROVED') status = 'Đã duyệt';
  else if (s === 'REJECTED') status = 'Đã từ chối';
  else if (s === 'CANCELLED') status = 'Đã hủy';

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
    dueAtUtc: summary.dueAtUtc,
    deadlineStatus: summary.deadlineStatus,
  };
}

export function mapApplicationDtoToCitizenDossier(
  dto: ApplicationDto,
  lookup?: OfficerLookup
): CitizenDossier {
  const s = (dto.status || '').toUpperCase();
  let status: CitizenDossier['status'] = 'Bản nháp';
  if (s === 'DRAFT') status = 'Bản nháp';
  else if (s === 'SUBMITTED') status = dto.resubmitCount > 0 ? 'Đã gửi lại' : 'Chờ tiền kiểm';
  else if (s === 'UNDER_REVIEW') status = 'Chờ tiền kiểm';
  else if (s === 'NEED_REVISION') status = 'Cần chỉnh sửa';
  else if (s === 'DOCUMENTS_READY') status = 'Giấy tờ sẵn sàng';
  else if (s === 'OFFICIALLY_RECEIVED') status = 'Đã tiếp nhận tại quầy';
  else if (s === 'APPROVED') status = 'Đã duyệt';
  else if (s === 'REJECTED') status = 'Đã từ chối';
  else if (s === 'CANCELLED') status = 'Đã hủy';

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

  const officerName = dto.assignedOfficerId
    ? resolveOfficerDisplayName(dto.assignedOfficerId, undefined, lookup)
    : undefined;

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
    officerName,
    currentVersion: dto.currentVersionNumber,
    wardCode: dto.wardCode || undefined,
    formData: parseFormData(dto.formData),
    checklist,
    dueAtUtc: dto.dueAtUtc,
    deadlineStatus: dto.deadlineStatus,
  };
}

export function formDataFields(raw: unknown): EformField[] {
  const result: EformField[] = [];
  function visit(value: unknown, path: string, label: string) {
    if (value !== null && typeof value === 'object') {
      for (const [key, child] of Object.entries(value)) visit(child, path + '/' + key.replace(/~/g, '~0').replace(/\//g, '~1'), label ? label + ' / ' + humanizeFieldName(key) : humanizeFieldName(key));
    } else result.push({ key: path, label, value: String(value ?? ''), status: 'valid' });
  }
  visit(parseFormData(raw), '/formData', '');
  return result;
}
