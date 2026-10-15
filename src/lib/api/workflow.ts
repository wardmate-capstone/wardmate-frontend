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
  resubmitCount: z.number().int(),
  currentVersionNumber: z.number().int(),
  notes: z.string().nullish(),
  approvedAt: z.string().nullish(),
  wardCode: z.string().nullish(),
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

export type RejectInput = {
  reason: string;
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

  assignOfficer: async (id: string) => {
    const res = await api.post(workflowPath(`/api/v1/officer/applications/${id}/assign`));
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

  approveApplication: async (id: string) => {
    const res = await api.post(workflowPath(`/api/v1/officer/applications/${id}/approve`));
    return reviewResultDtoSchema.parse(res.data);
  },

  rejectApplication: async (id: string, input: RejectInput) => {
    const res = await api.post(workflowPath(`/api/v1/officer/applications/${id}/reject`), input);
    return reviewResultDtoSchema.parse(res.data);
  },

  getOfficerApplication: async (id: string, signal?: AbortSignal) => {
    const res = await api.get(workflowPath(`/api/v1/officer/applications/${id}`), { signal });
    return applicationDtoSchema.parse(res.data);
  },

  // === Phân hệ Công dân (Citizen) & Xem hồ sơ ===
  createApplication: async (input: CreateApplicationInput) => {
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

  resubmitApplication: async (id: string, input: ResubmitInput) => {
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
        return 'Cần ít nhất một nhận xét lỗi cụ thể trên tờ khai hoặc giấy tờ phiên bản hiện tại trước khi yêu cầu công dân sửa.';
      }
      if (code === 'application.open_comments') {
        return 'Hồ sơ còn nhận xét lỗi chưa giải quyết. Cần yêu cầu công dân sửa hoặc xóa nhận xét trước khi duyệt.';
      }
      if (code === 'application.version_conflict') {
        return 'Phiên bản hồ sơ đã thay đổi bởi thao tác khác. Vui lòng tải lại hồ sơ để xem nội dung mới nhất.';
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
      if (code === 'application.iam_unavailable') {
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
