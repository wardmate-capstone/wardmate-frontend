import axios from 'axios';
import { z } from 'zod';
import { api } from './index';
import { servicePath, serviceUrls } from './serviceUrls';

// Base URL helper for Workflow service
// Business APIs use same-origin proxy/rewrite so the shared JWT client never sends
// the access token to a different origin.
function workflowPath(path: string): string {
  return servicePath(serviceUrls.workflow, path);
}

const formDataInputSchema = z.record(z.string(), z.unknown()).refine(value => new TextEncoder().encode(JSON.stringify(value)).byteLength <= 65536, 'Dữ liệu kê khai vượt quá 65.536 byte UTF-8.');

// ----------------------------------------------------
// Zod Schemas & Domain Types
// ----------------------------------------------------

export const checklistDtoSchema = z.object({
  id: z.string(),
  code: z.string().nullish(),
  title: z.string().nullish(),
  isRequired: z.boolean(),
  status: z.string().nullish(),
  fileUrl: z.string().nullish(),
  note: z.string().nullish(),
  createdAt: z.string(),
  updatedAt: z.string(),
  formTemplateId: z.string().nullish(),
  sortOrder: z.number().int(),
  caseCode: z.string().nullish(),
  submissionType: z.enum(['NOP', 'XUAT_TRINH']).nullish(),
  documentCopyType: z.enum(['ORIGINAL', 'CERTIFIED_COPY', 'REGULAR_COPY']).nullish(),
  quantity: z.number().int().positive(),
  conditionNote: z.string().nullish(),
});

export const historyDtoSchema = z.object({
  id: z.string(),
  fromStatus: z.string().nullish(),
  toStatus: z.string(),
  changedBy: z.string(),
  reason: z.string().nullish(),
  createdAt: z.string(),
});

export const assignmentHistoryDtoSchema = z.object({
  id: z.string(),
  action: z.string(), // CLAIM | RELEASE | ASSIGN | TRANSFER
  fromOfficerId: z.string().nullish(),
  toOfficerId: z.string().nullish(),
  actorId: z.string(),
  reason: z.string().nullish(),
  createdAt: z.string(),
});

export const applicationDtoSchema = z.object({
  id: z.string(),
  applicationCode: z.string().nullish(),
  userId: z.string(),
  procedureId: z.string(),
  procedureTitle: z.string().nullish(),
  caseCode: z.string().nullish(),
  status: z.string(),
  formData: z.unknown(),
  submittedAt: z.string().nullish(),
  createdAt: z.string(),
  updatedAt: z.string(),
  checklists: z.array(checklistDtoSchema).nullish(),
  history: z.array(historyDtoSchema).nullish(),
  assignedOfficerId: z.string().nullish(),
  // Lĩnh vực/phân công theo WORKFLOW-ASSIGN-01 (docs/OFFICER_CATEGORY_ROUTING_BACKEND_SPEC.md).
  assignedOfficerName: z.string().nullish(),
  assignedAt: z.string().nullish(),
  categoryId: z.number().int().nullish(),
  categoryName: z.string().nullish(),
  assignmentVersion: z.number().int().nonnegative().nullish(),
  // Chỉ có trong response cho cán bộ/Manager; API công dân trả null.
  assignmentHistory: z.array(assignmentHistoryDtoSchema).nullish(),
  resubmitCount: z.number().int(),
  currentVersionNumber: z.number().int(),
  notes: z.string().nullish(),
  approvedAt: z.string().nullish(),
  documentsReadyAt: z.string().nullish(),
  wardCode: z.string().nullish(),
  dueAtUtc: z.string().nullish(),
  deadlineStatus: z.string().nullish(),
  receiptNumber: z.string().nullish(),
  receivedAt: z.string().nullish(),
  appointmentDate: z.string().nullish(),
});

export const applicationSummaryDtoSchema = z.object({
  id: z.string(),
  applicationCode: z.string().nullish(),
  procedureId: z.string(),
  procedureTitle: z.string().nullish(),
  status: z.string().nullish(),
  createdAt: z.string(),
  submittedAt: z.string().nullish(),
  wardCode: z.string().nullish(),
  assignedOfficerId: z.string().nullish(),
  assignedOfficerName: z.string().nullish(),
  assignedAt: z.string().nullish(),
  categoryId: z.number().int().nullish(),
  categoryName: z.string().nullish(),
  resubmitCount: z.number().int().nullish(),
  assignmentVersion: z.number().int().nonnegative().nullish(),
  applicantName: z.string().nullish(),
  citizenId: z.string().nullish(),
  dueAtUtc: z.string().nullish(),
  deadlineStatus: z.string().nullish(),
  receiptNumber: z.string().nullish(),
  receivedAt: z.string().nullish(),
  appointmentDate: z.string().nullish(),
});

export const applicationPageSchema = z.object({
  items: z.array(applicationSummaryDtoSchema).nullish(),
  page: z.number().int(),
  pageSize: z.number().int(),
  total: z.number().int(),
});

export const commentDtoSchema = z.object({
  id: z.string(),
  applicationVersionId: z.string(),
  versionNumber: z.number().int(),
  officerId: z.string(),
  targetType: z.string().nullish(), // FORM_FIELD or CHECKLIST_ITEM
  targetId: z.string().nullish(),
  fieldLabel: z.string().nullish(),
  commentText: z.string().nullish(),
  status: z.string().nullish(), // OPEN or RESOLVED
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const versionDtoSchema = z.object({
  id: z.string(),
  versionNumber: z.number().int(),
  submittedBy: z.string(),
  submittedAt: z.string(),
  snapshotData: z.unknown(),
});

export const fieldDiffDtoSchema = z.object({
  fieldKey: z.string().nullish(),
  fieldLabel: z.string().nullish(),
  oldValue: z.unknown().nullish(),
  newValue: z.unknown().nullish(),
  hasChanged: z.boolean(),
  associatedComments: z.array(commentDtoSchema).nullish(),
  oldExists: z.boolean(),
  newExists: z.boolean(),
});

export const reviewResultDtoSchema = z.object({
  application: applicationDtoSchema,
  assignedOfficerId: z.string().nullish(),
  resubmitCount: z.number().int(),
  currentVersionNumber: z.number().int(),
});

// Inferred TypeScript Types
export type ChecklistDto = z.infer<typeof checklistDtoSchema>;
export type AssignmentHistoryDto = z.infer<typeof assignmentHistoryDtoSchema>;
export type HistoryDto = z.infer<typeof historyDtoSchema>;
export type ApplicationDto = z.infer<typeof applicationDtoSchema>;
export type ApplicationSummaryDto = z.infer<typeof applicationSummaryDtoSchema>;
export type ApplicationPage = z.infer<typeof applicationPageSchema>;
export type CommentDto = z.infer<typeof commentDtoSchema>;
export type VersionDto = z.infer<typeof versionDtoSchema>;
export type FieldDiffDto = z.infer<typeof fieldDiffDtoSchema>;
export type ReviewResultDto = z.infer<typeof reviewResultDtoSchema>;

// Input Types
export type CreateApplicationInput = {
  procedureId: string;
  formData: Record<string, unknown>;
  caseCode?: string | null;
  wardCode: string;
};

export type UpdateChecklistInput = {
  status?: string | null;
  fileUrl?: string | null;
  note?: string | null;
};

export type ResubmitChecklistInput = {
  id: string;
  status: string;
  fileUrl?: string | null;
  note?: string | null;
};

export type ResubmitInput = {
  expectedVersionNumber: number;
  formData: Record<string, unknown>;
  checklists: ResubmitChecklistInput[];
};

export type AddCommentInput = {
  versionNumber: number;
  targetType: 'FORM_FIELD' | 'CHECKLIST_ITEM';
  targetId: string;
  fieldLabel: string;
  commentText: string;
};

export type RequestRevisionInput = {
  reason: string;
};

export type OfficerPendingInput = {
  status?: string;
  procedureId?: string;
  submittedFrom?: string;
  submittedTo?: string;
  page?: number;
  pageSize?: number;
};

export type OfficerListInput = {
  status?: string;
  procedureId?: string;
  applicationCode?: string;
  submittedFrom?: string;
  submittedTo?: string;
  page?: number;
  pageSize?: number;
  categoryIds?: number[];
  /** Lọc theo lĩnh vực được gán của cán bộ; danh sách rỗng ở BE nghĩa là mọi lĩnh vực. */
  scope?: 'my-categories';
  /** 'me' | 'unassigned' | GUID cán bộ (GUID chỉ Manager). */
  assignee?: string;
  overdue?: boolean;
  sort?: 'submittedAt' | '-submittedAt' | 'dueAt';
};

// Hàng đợi cán bộ/Manager không hiển thị bản nháp công dân chưa gửi (BE ListAll vẫn trả DRAFT khi không lọc).
export const OFFICER_VISIBLE_STATUSES = 'SUBMITTED,UNDER_REVIEW,NEED_REVISION,DOCUMENTS_READY,OFFICIALLY_RECEIVED,CANCELLED';

export const reasonSchema = z.string().trim().min(5, 'Lý do cần ít nhất 5 ký tự.').max(500, 'Lý do tối đa 500 ký tự.');

export type ReleaseApplicationInput = {
  reason: string;
  expectedAssignmentVersion?: number | null;
};

export type ManageAssigneeInput = {
  officerId: string;
  reason: string;
  expectedAssignmentVersion: number;
};

export const officialReceiptInputSchema = z.object({
  paperDossierVerified: z.literal(true),
  notes: z.string().max(4000).nullish(),
  appointmentDate: z.string().nullish(),
});
export type OfficialReceiptInput = z.infer<typeof officialReceiptInputSchema>;

export const officialReceiptDtoSchema = z.object({
  applicationId: z.string(),
  status: z.string(),
  receiptNumber: z.string().nullish(),
  receivedAt: z.string().nullish(),
  appointmentDate: z.string().nullish(),
  message: z.string().nullish(),
});
export type OfficialReceiptDto = z.infer<typeof officialReceiptDtoSchema>;

// ----------------------------------------------------
// API Client Methods
// ----------------------------------------------------

export const workflowApi = {
  // === Phân hệ Cán bộ (Officer) ===
  listOfficerPending: async (input: OfficerPendingInput = {}, signal?: AbortSignal) => {
    const params: Record<string, unknown> = {
      Page: input.page ?? 1,
      PageSize: input.pageSize ?? 20,
    };
    if (input.status && input.status !== 'ALL') params.Status = input.status;
    if (input.procedureId) params.ProcedureId = input.procedureId;
    if (input.submittedFrom) params.SubmittedFrom = input.submittedFrom;
    if (input.submittedTo) params.SubmittedTo = input.submittedTo;

    const res = await api.get(workflowPath('/api/v1/officer/applications/pending'), { params, signal });
    return applicationPageSchema.parse(res.data);
  },

  listOfficerApplications: async (input: OfficerListInput = {}, signal?: AbortSignal) => {
    const params: Record<string, unknown> = {
      Page: input.page ?? 1,
      PageSize: input.pageSize ?? 20,
    };
    if (input.status && input.status !== 'ALL') params.Status = input.status;
    if (input.procedureId) params.ProcedureId = input.procedureId;
    if (input.applicationCode) params.ApplicationCode = input.applicationCode;
    if (input.submittedFrom) params.SubmittedFrom = input.submittedFrom;
    if (input.submittedTo) params.SubmittedTo = input.submittedTo;
    if (input.categoryIds?.length) params.CategoryIds = input.categoryIds.join(',');
    if (input.scope) params.Scope = input.scope;
    if (input.assignee) params.Assignee = input.assignee;
    if (input.overdue) params.Overdue = true;
    if (input.sort) params.Sort = input.sort;

    const res = await api.get(workflowPath('/api/v1/officer/applications'), { params, signal });
    return applicationPageSchema.parse(res.data);
  },

  assignOfficer: async (id: string) => {
    const res = await api.post(workflowPath(`/api/v1/officer/applications/${id}/assign`));
    return reviewResultDtoSchema.parse(res.data);
  },

  releaseApplication: async (id: string, input: ReleaseApplicationInput) => {
    const reason = reasonSchema.parse(input.reason);
    const body: Record<string, unknown> = { reason };
    if (typeof input.expectedAssignmentVersion === 'number') body.expectedAssignmentVersion = input.expectedAssignmentVersion;
    const res = await api.post(workflowPath(`/api/v1/officer/applications/${id}/release`), body);
    return reviewResultDtoSchema.parse(res.data);
  },

  // Manager giao (hồ sơ SUBMITTED chưa có người) hoặc chuyển (đã có người phụ trách).
  manageAssignee: async (id: string, input: ManageAssigneeInput) => {
    const body = {
      officerId: input.officerId,
      reason: reasonSchema.parse(input.reason),
      expectedAssignmentVersion: z.number().int().nonnegative().parse(input.expectedAssignmentVersion),
    };
    const res = await api.put(workflowPath(`/api/v1/manager/applications/${id}/assignee`), body);
    return reviewResultDtoSchema.parse(res.data);
  },

  addComment: async (id: string, input: AddCommentInput) => {
    const res = await api.post(workflowPath(`/api/v1/officer/applications/${id}/comments`), input);
    return reviewResultDtoSchema.parse(res.data);
  },

  requestRevision: async (id: string, input: RequestRevisionInput) => {
    const res = await api.post(workflowPath(`/api/v1/officer/applications/${id}/request-revision`), input);
    return reviewResultDtoSchema.parse(res.data);
  },

  confirmReadiness: async (id: string) => {
    try {
      const res = await api.post(workflowPath(`/api/v1/officer/applications/${id}/confirm-readiness`));
      return reviewResultDtoSchema.parse(res.data);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        const fallback = await api.post(workflowPath(`/api/v1/officer/applications/${id}/approve`));
        return reviewResultDtoSchema.parse(fallback.data);
      }
      throw error;
    }
  },

  officiallyReceiveApplication: async (id: string, input: OfficialReceiptInput) => {
    const res = await api.post(workflowPath(`/api/v1/officer/applications/${id}/officially-received`), input);
    return officialReceiptDtoSchema.parse(res.data);
  },

  getOfficerApplication: async (id: string, signal?: AbortSignal) => {
    const res = await api.get(workflowPath(`/api/v1/officer/applications/${id}`), { signal });
    return applicationDtoSchema.refine(value => value.id.toLowerCase() === id.toLowerCase(), 'Dữ liệu không thuộc hồ sơ đang mở.').parse(res.data);
  },

  // === Phân hệ Công dân (Citizen) & Xem hồ sơ ===
  createApplication: async (input: CreateApplicationInput) => {
    const validation = formDataInputSchema.safeParse(input.formData);
    if (!validation.success) throw new Error('Dữ liệu kê khai phải là object JSON, tối đa 65.536 byte UTF-8.');
    const res = await api.post(workflowPath('/api/v1/applications'), input);
    return applicationDtoSchema.parse(res.data);
  },

  listCitizenApplications: async (page = 1, pageSize = 20, signal?: AbortSignal) => {
    const res = await api.get(workflowPath('/api/v1/applications'), {
      params: { page, pageSize },
      signal,
    });
    return applicationPageSchema.parse(res.data);
  },

  getApplication: async (id: string, signal?: AbortSignal) => {
    const res = await api.get(workflowPath(`/api/v1/applications/${id}`), { signal });
    return applicationDtoSchema.parse(res.data);
  },

  updateChecklist: async (id: string, checklistId: string, input: UpdateChecklistInput) => {
    const res = await api.patch(workflowPath(`/api/v1/applications/${id}/checklists/${checklistId}`), input);
    return applicationDtoSchema.parse(res.data);
  },

  submitApplication: async (id: string) => {
    const res = await api.post(workflowPath(`/api/v1/applications/${id}/submit`));
    return applicationDtoSchema.parse(res.data);
  },

  cancelApplication: async (id: string) => {
    const res = await api.post(workflowPath(`/api/v1/applications/${id}/cancel`));
    return applicationDtoSchema.parse(res.data);
  },

  resubmitApplication: async (id: string, input: ResubmitInput) => {
    const validation = formDataInputSchema.safeParse(input.formData);
    if (!validation.success) throw new Error('Dữ liệu kê khai phải là object JSON, tối đa 65.536 byte UTF-8.');
    const res = await api.post(workflowPath(`/api/v1/applications/${id}/resubmit`), input);
    return reviewResultDtoSchema.parse(res.data);
  },

  getComments: async (id: string, versionNumber?: number, status?: string, signal?: AbortSignal) => {
    const res = await api.get(workflowPath(`/api/v1/applications/${id}/comments`), {
      params: {
        versionNumber: versionNumber ?? undefined,
        status: status ?? undefined,
      },
      signal,
    });
    return z.array(commentDtoSchema).parse(res.data);
  },

  getVersions: async (id: string, signal?: AbortSignal) => {
    const res = await api.get(workflowPath(`/api/v1/applications/${id}/versions`), { signal });
    return z.array(versionDtoSchema).parse(res.data);
  },

  getDiff: async (id: string, fromVersion: number, toVersion: number, signal?: AbortSignal) => {
    const res = await api.get(workflowPath(`/api/v1/applications/${id}/diff`), {
      params: { fromVersion, toVersion },
      signal,
    });
    return z.array(fieldDiffDtoSchema).parse(res.data);
  },
};

// ----------------------------------------------------
// Error Extractor & Humanizer for Workflow API
// ----------------------------------------------------

export function workflowError(error: unknown): string {
  if (error instanceof z.ZodError) {
    return 'Dữ liệu phản hồi từ máy chủ không đúng định dạng chuẩn.';
  }
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (data && typeof data === 'object') {
      const code = (data as { code?: string; extensions?: { code?: string; missingItems?: Array<{ title?: string; code?: string }> } }).code
        ?? (data as { extensions?: { code?: string } }).extensions?.code;
      const missingItems = (data as { missingItems?: Array<{ title?: string; code?: string }>; extensions?: { missingItems?: Array<{ title?: string; code?: string }> } }).missingItems
        ?? (data as { extensions?: { missingItems?: Array<{ title?: string; code?: string }> } }).extensions?.missingItems;
      const missingChecklistIds = (data as { missingChecklistIds?: string[]; extensions?: { missingChecklistIds?: string[] } }).missingChecklistIds
        ?? (data as { extensions?: { missingChecklistIds?: string[] } }).extensions?.missingChecklistIds;
      const traceId = (data as { traceId?: string; extensions?: { traceId?: string } }).traceId
        ?? (data as { extensions?: { traceId?: string } }).extensions?.traceId;

      if (code === 'application.checklist_incomplete' && Array.isArray(missingItems) && missingItems.length > 0) {
        const itemNames = missingItems.map((m) => m.title || m.code).filter(Boolean).join(', ');
        return `Vui lòng hoàn tất các giấy tờ bắt buộc trước khi nộp: ${itemNames}`;
      }
      if (code === 'application.comments_required') {
        return 'Chưa có nhận xét nào về điểm cần sửa. Hãy ghi và lưu nhận xét trước khi yêu cầu công dân bổ sung.';
      }
      if (code === 'application.open_comments') {
        return 'Hồ sơ còn nhận xét lỗi chưa giải quyết. Cần yêu cầu công dân sửa và kiểm tra lại trước khi xác nhận giấy tờ sẵn sàng.';
      }
      if (code === 'application.version_conflict') {
        return 'Phiên bản hồ sơ đã thay đổi bởi thao tác khác. Vui lòng tải lại hồ sơ để xem nội dung mới nhất.';
      }
      if (code === 'workflow.not_assignee') {
        return 'Bạn không còn là cán bộ phụ trách hồ sơ này. Vui lòng tải lại danh sách.';
      }
      if (code === 'application.forbidden' || error.response?.status === 403) {
        return 'Bạn không có quyền thực hiện thao tác trên hồ sơ này (khác phường/xã hoặc không đúng thẩm quyền).';
      }
      if (code === 'application.invalid_status') {
        return 'Trạng thái hiện tại của hồ sơ không cho phép thực hiện thao tác này.';
      }
      if (code === 'application.invalid_ward') {
        return 'Phường/xã tiếp nhận không hợp lệ hoặc không tồn tại trong hệ thống.';
      }
      if (code === 'application.procedure_inactive') {
        return 'Thủ tục hành chính này hiện đã tạm ngừng tiếp nhận hồ sơ.';
      }
      if (code === 'application.documents_incomplete') {
        return Array.isArray(missingChecklistIds) && missingChecklistIds.length > 0
          ? `Cần lưu tệp hoặc chốt biểu mẫu cho ${missingChecklistIds.length} mục còn thiếu.`
          : 'Cần lưu tệp giấy tờ hoặc hoàn thành biểu mẫu tương ứng trước khi nộp hồ sơ.';
      }
      if (code === 'application.documents_unavailable') {
        return 'Dịch vụ lưu trữ giấy tờ DocumentForm tạm thời không phản hồi. Vui lòng thử lại sau.';
      }
      if (code === 'application.invalid_target') {
        return 'Vị trí nhận xét (trường dữ liệu hoặc mục checklist) không tồn tại trong phiên bản hiện tại.';
      }
      if (code === 'application.invalid_checklist') {
        return 'Danh sách giấy tờ gửi kèm không khớp với hồ sơ.';
      }
      if (code === 'application.snapshot_missing') {
        return 'Hồ sơ chưa có bản chụp dữ liệu (snapshot) hợp lệ để thụ lý.';
      }
      if (code === 'workflow.assignment_conflict') {
        return 'Phân công hồ sơ vừa thay đổi bởi thao tác khác. Vui lòng tải lại hồ sơ rồi thực hiện lại.';
      }
      if (code === 'workflow.same_assignee') {
        return 'Cán bộ được chọn đang phụ trách hồ sơ này.';
      }
      if (code === 'workflow.invalid_assignee') {
        return 'Cán bộ được chọn không còn hoạt động, không cùng phường hoặc không phải cán bộ Một cửa.';
      }
      if (code === 'workflow.invalid_status') {
        return 'Trạng thái hiện tại của hồ sơ không cho phép thao tác phân công này.';
      }
      if (code === 'workflow.snapshot_missing') {
        return 'Hồ sơ chưa có bản nộp hợp lệ nên chưa thể giao cho cán bộ.';
      }
      if (code === 'workflow.validation') {
        return 'Dữ liệu gửi lên chưa hợp lệ (lý do 5–500 ký tự hoặc bộ lọc không đúng).';
      }
      if (code === 'workflow.iam_unavailable' || code === 'application.iam_unavailable') {
        return 'Hệ thống định danh xác thực tạm thời không phản hồi. Vui lòng thử lại sau giây lát.';
      }

      if ('title' in data && typeof (data as { title?: unknown }).title === 'string') {
        const title = (data as { title: string }).title;
        return error.response?.status === 500 && traceId ? `${title} Mã theo dõi: ${traceId}` : title;
      }
      if ('detail' in data && typeof (data as { detail?: unknown }).detail === 'string') {
        return (data as { detail: string }).detail;
      }
    }
    if (error.response?.status === 401) {
      return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
    }
    if (error.response?.status === 404) {
      return 'Không tìm thấy hồ sơ hoặc phiên bản yêu cầu.';
    }
  }
  return error instanceof Error ? error.message : 'Đã có lỗi xảy ra khi xử lý hồ sơ. Vui lòng thử lại.';
}
