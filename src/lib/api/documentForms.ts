import axios from 'axios';
import { z } from 'zod';
import { api } from '@/lib/api';
import { servicePath, serviceUrls } from './serviceUrls';

const guid = z.string().uuid();
const nullableText = z.string().nullish();
const documentPath = (path: string) => servicePath(serviceUrls.documentForm, path);

export const submissionSchema = z.object({
  id: guid,
  templateId: guid,
  applicationId: guid.nullish(),
  checklistId: guid.nullish(),
  applicantId: guid,
  fileName: z.string(),
  fileSizeBytes: z.number().int().nonnegative(),
  status: z.string(),
  officerComment: nullableText,
  submittedAt: nullableText,
  reviewedAt: nullableText,
  createdAt: z.string(),
  updatedAt: nullableText,
});

export const saveSubmissionResultSchema = z.object({
  submissionId: guid,
  status: z.string(),
  fileName: z.string(),
  fileSizeBytes: z.number().int().nonnegative(),
  updatedAt: z.string(),
  message: z.string().nullish(),
});

const officerDecisionResultSchema = z.object({ submissionId: guid, message: z.string() });
function parseOfficerDecision(data: unknown, submissionId: string) {
  const result = officerDecisionResultSchema.parse(data);
  if (result.submissionId.toLowerCase() !== submissionId.toLowerCase())
    throw new Error('Phản hồi quyết định không khớp với bản khai đang kiểm tra. Vui lòng tải lại hồ sơ.');
  return result;
}

export const contentItemSchema = z.object({
  id: guid,
  checklistId: guid.nullish(),
  fileName: z.string(),
  status: z.string(),
  templateId: guid.nullish(),
  fileExists: z.boolean(),
  submissionType: nullableText,
  documentCopyType: nullableText,
  quantity: z.number().int().nonnegative(),
});

export const applicationContentsSchema = z.object({
  applicationId: guid,
  submissions: z.array(contentItemSchema),
  supportingDocuments: z.array(contentItemSchema),
});

export const supportingDocumentSchema = z.object({
  id: guid,
  applicationId: guid,
  checklistId: guid.nullish(),
  fileName: z.string(),
  blobUrl: z.string().nullish(),
  fileSizeBytes: z.number().int().nonnegative().nullish(),
  contentType: nullableText,
  createdAtUtc: z.string(),
  submissionType: nullableText,
  documentCopyType: nullableText,
  quantity: z.number().int().positive(),
});

export const generatedDocumentSchema = z.object({
  id: guid,
  applicationId: guid,
  submissionId: guid.nullish(),
  documentType: z.string(),
  pdfBlobUrl: z.string().nullish(),
  createdAtUtc: z.string(),
});

export const approvedQrSchema = z.object({
  id: guid, applicationId: guid, submissionId: guid,
  qrCodeValue: z.string(), generatedAt: z.string(),
});

export const documentQuantitySchema = z.coerce.number().int('Số bản phải là số nguyên.').min(1, 'Số bản phải lớn hơn 0.').max(2147483647, 'Số bản vượt quá giới hạn cho phép.');

const submissionPageSchema = z.object({
  items: z.array(submissionSchema),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  totalCount: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
  hasNextPage: z.boolean().optional(),
  hasPreviousPage: z.boolean().optional(),
});

export type UserSubmissionDto = z.infer<typeof submissionSchema>;
export type SaveSubmissionResultDto = z.infer<typeof saveSubmissionResultSchema>;
export type ApplicationContentItem = z.infer<typeof contentItemSchema>;
export type ApplicationContentsDto = z.infer<typeof applicationContentsSchema>;
export type SupportingDocumentDto = z.infer<typeof supportingDocumentSchema>;
export type GeneratedDocumentDto = z.infer<typeof generatedDocumentSchema>;
export type ApprovedQrDto = z.infer<typeof approvedQrSchema>;

export const DOCUMENT_MAX_BYTES = 20 * 1024 * 1024;
export const SUPPORTING_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'] as const;

function appendFile(data: FormData, file: File) {
  data.append('File', file);
}

async function binaryRequest(url: string, signal?: AbortSignal) {
  const response = await api.get<Blob>(documentPath(url), { responseType: 'blob', signal }).catch(async error => {
    if (axios.isAxiosError(error) && error.response?.data instanceof Blob) {
      try { error.response.data = JSON.parse(await error.response.data.text()); } catch { /* binary error */ }
    }
    throw error;
  });
  const disposition = response.headers['content-disposition'];
  let fileName = 'tai-lieu';
  if (typeof disposition === 'string') {
    const match = /filename\*?=(?:UTF-8'')?["']?([^"';]+)["']?/i.exec(disposition);
    if (match?.[1]) {
      try { fileName = decodeURIComponent(match[1]); } catch { fileName = match[1]; }
    }
  }
  return { blob: response.data, fileName };
}

export const documentFormApi = {
  getContents: async (applicationId: string, signal?: AbortSignal) => {
    const response = await api.get(documentPath(`/api/v1/applications/${applicationId}/contents`), { signal });
    return applicationContentsSchema.refine(value => value.applicationId.toLowerCase() === applicationId.toLowerCase(), 'Dữ liệu không thuộc hồ sơ đang mở.').parse(response.data);
  },
  listSubmissions: async (applicantId: string, params: { status?: string; page?: number; pageSize?: number } = {}, signal?: AbortSignal) => {
    const response = await api.get(documentPath('/api/v1/citizen/submissions'), {
      params: { applicantId, status: params.status || undefined, page: params.page ?? 1, pageSize: params.pageSize ?? 100 }, signal,
    });
    return submissionPageSchema.parse(response.data);
  },
  getSubmission: async (submissionId: string, applicantId: string, signal?: AbortSignal) => {
    const response = await api.get(documentPath(`/api/v1/citizen/submissions/${submissionId}`), { params: { applicantId }, signal });
    return submissionSchema.parse(response.data);
  },
  createDraft: async (input: { templateId: string; applicationId: string; checklistId: string; applicantId: string; file: File }) => {
    const data = new FormData();
    data.append('TemplateId', input.templateId);
    data.append('ApplicationId', input.applicationId);
    data.append('ChecklistId', input.checklistId);
    data.append('ApplicantId', input.applicantId);
    appendFile(data, input.file);
    const response = await api.post(documentPath('/api/v1/citizen/submissions/draft'), data, { headers: { 'Content-Type': undefined } });
    return saveSubmissionResultSchema.parse(response.data);
  },
  uploadFilledDocx: async (input: { templateId: string; applicationId: string; checklistId: string; applicantId: string; file: File }) => {
    const data = new FormData();
    data.append('TemplateId', input.templateId);
    data.append('ApplicationId', input.applicationId);
    data.append('ChecklistId', input.checklistId);
    data.append('ApplicantId', input.applicantId);
    appendFile(data, input.file);
    const response = await api.post(documentPath('/api/v1/citizen/submissions/upload-filled-docx'), data, { headers: { 'Content-Type': undefined } });
    return saveSubmissionResultSchema.parse(response.data);
  },
  updateDraft: async (submissionId: string, applicantId: string, file: File) => {
    const data = new FormData(); data.append('ApplicantId', applicantId); appendFile(data, file);
    const response = await api.put(documentPath(`/api/v1/citizen/submissions/${submissionId}/draft`), data, { headers: { 'Content-Type': undefined } });
    return saveSubmissionResultSchema.parse(response.data);
  },
  submitDraft: async (submissionId: string, applicantId: string) => {
    const response = await api.post(documentPath(`/api/v1/citizen/submissions/${submissionId}/submit`), { applicantId });
    return saveSubmissionResultSchema.parse(response.data);
  },
  downloadSubmission: (submissionId: string, applicantId: string, signal?: AbortSignal) =>
    binaryRequest(`/api/v1/citizen/submissions/${submissionId}/download-docx?applicantId=${encodeURIComponent(applicantId)}`, signal),
  uploadSupportingDocument: async (input: { applicationId: string; checklistId: string; submissionType?: string | null; documentCopyType?: string | null; quantity: number; file: File }) => {
    const data = new FormData();
    data.append('ChecklistId', input.checklistId);
    data.append('Quantity', String(input.quantity));
    if (input.submissionType) data.append('SubmissionType', input.submissionType);
    if (input.documentCopyType) data.append('DocumentCopyType', input.documentCopyType);
    appendFile(data, input.file);
    const response = await api.post(documentPath(`/api/v1/applications/${input.applicationId}/supporting-documents`), data, { headers: { 'Content-Type': undefined } });
    return supportingDocumentSchema.parse(response.data);
  },
  listSupportingDocuments: async (applicationId: string, signal?: AbortSignal) => {
    const response = await api.get(documentPath(`/api/v1/applications/${applicationId}/supporting-documents`), { signal });
    return z.array(supportingDocumentSchema).parse(response.data);
  },
  deleteSupportingDocument: (documentId: string) => api.delete(documentPath(`/api/v1/supporting-documents/${documentId}`)),
  downloadSupportingDocument: (documentId: string, signal?: AbortSignal) => binaryRequest(`/api/v1/supporting-documents/${documentId}/download`, signal),
  previewSupportingDocument: (documentId: string, signal?: AbortSignal) => binaryRequest(`/api/v1/supporting-documents/${documentId}/preview`, signal),
  generatePdf: async (applicationId: string, submissionId: string, documentType = 'ORIGINAL_SUBMISSION') => {
    const data = new FormData(); data.append('SubmissionId', submissionId); data.append('DocumentType', documentType);
    const response = await api.post(documentPath(`/api/v1/applications/${applicationId}/generate-pdf`), data, { headers: { 'Content-Type': undefined } });
    return generatedDocumentSchema.parse(response.data);
  },
  listGeneratedDocuments: async (applicationId: string, signal?: AbortSignal, submissionId?: string) => {
    const response = await api.get(documentPath(`/api/v1/applications/${applicationId}/generated-documents`), { signal, params: { submissionId } });
    return z.array(generatedDocumentSchema).parse(response.data);
  },
  downloadGeneratedDocument: (documentId: string, signal?: AbortSignal) => binaryRequest(`/api/v1/generated-documents/${documentId}/download`, signal),
  getApprovedQr: async (applicationId: string, signal?: AbortSignal) => {
    const response = await api.get(documentPath(`/api/v1/applications/${applicationId}/approved-qr`), { signal });
    return approvedQrSchema.parse(response.data);
  },
  downloadApprovedQr: (applicationId: string, signal?: AbortSignal) => binaryRequest(`/api/v1/applications/${applicationId}/approved-qr/image`, signal),
  officerListSubmissions: async (applicationId: string, signal?: AbortSignal) => {
    const response = await api.get(documentPath(`/api/v1/officer/submissions/by-application/${applicationId}`), { signal });
    return z.array(submissionSchema).refine(items => items.every(item => item.applicationId?.toLowerCase() === applicationId.toLowerCase()), 'Danh sách bản khai không khớp hồ sơ.').parse(response.data);
  },
  officerDownloadSubmission: (submissionId: string, signal?: AbortSignal) => binaryRequest(`/api/v1/officer/submissions/${submissionId}/download-docx`, signal),
  officerAnnotateSubmission: async (submissionId: string, file: File) => {
    const issue = validateDocumentFile(file, true);
    if (issue) throw new Error(issue);
    const data = new FormData(); appendFile(data, file);
    const response = await api.put(documentPath(`/api/v1/officer/submissions/${submissionId}/annotate-docx`), data, { headers: { 'Content-Type': undefined } });
    return saveSubmissionResultSchema.parse(response.data);
  },
  officerRequestRevision: async (submissionId: string, comment: string) => {
    const value = z.string().trim().min(1).max(4000).parse(comment);
    const response = await api.post(documentPath(`/api/v1/officer/submissions/${submissionId}/request-revision`), { comment: value });
    return parseOfficerDecision(response.data, submissionId);
  },
  officerConfirmReadiness: async (submissionId: string) => {
    const response = await api.post(documentPath(`/api/v1/officer/submissions/${submissionId}/confirm-readiness`), {});
    return parseOfficerDecision(response.data, submissionId);
  },
};

export function validateDocumentFile(file: File, docxOnly = false): string | null {
  if (!file.size) return 'Tệp đã chọn không có nội dung.';
  if (file.size > DOCUMENT_MAX_BYTES) return 'Tệp vượt quá giới hạn 20 MiB.';
  const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
  if (docxOnly ? extension !== 'docx' : !SUPPORTING_EXTENSIONS.includes(extension as typeof SUPPORTING_EXTENSIONS[number]))
    return docxOnly ? 'Vui lòng chọn tệp DOCX.' : 'Chỉ hỗ trợ PDF, JPG, JPEG, PNG, DOC và DOCX.';
  return null;
}

export function documentFormError(error: unknown): string {
  if (error instanceof z.ZodError) return 'Dữ liệu tài liệu từ máy chủ không đúng định dạng.';
  if (axios.isAxiosError(error)) {
    const body = error.response?.data;
    const code = body && typeof body === 'object' ? body.code : undefined;
    const messages: Record<string, string> = {
      'document.draft_exists': 'Mục này đã có bản khai. Vui lòng cập nhật bản hiện có.',
      'document.application_locked': 'Trạng thái hồ sơ hiện tại không cho phép sửa tài liệu.',
      'document.template_mismatch': 'Biểu mẫu không đúng với mục giấy tờ của hồ sơ.',
      'document.legacy_unlinked': 'Bản khai cũ chưa liên kết với hồ sơ này.',
      'document.concurrent_edit': 'Bản khai vừa được thay đổi. Vui lòng tải lại rồi thử lại.',
      'document.workflow_unavailable': 'Chưa thể xác minh hồ sơ với dịch vụ tiền kiểm.',
      'document.storage_unavailable': 'Kho lưu trữ tài liệu tạm thời không phản hồi.',
      'document.blob_upload_failed': 'Kho lưu trữ chưa thể lưu tệp Word. Vui lòng thử lại sau hoặc liên hệ quản trị viên.',
      'document.empty_file': 'Tệp đã chọn không có nội dung.',
      'document.invalid_docx_file': 'Tệp DOCX không hợp lệ hoặc bị hỏng. Vui lòng kiểm tra lại bằng Word.',
      'document.file_too_large': 'Tệp vượt quá giới hạn 20 MiB.',
      'document.pdf_render_failed': 'Chưa thể tạo PDF. Vui lòng thử lại sau.',
      'document.qr_not_found': 'Giấy tờ đã sẵn sàng nhưng chưa có mã QR. Bạn có thể tạo PDF từ bản khai sẵn sàng rồi tải lại mã QR.',
      'document.concurrent_update': 'Dữ liệu vừa thay đổi. Vui lòng tải lại hồ sơ.',
      'document.sync_unavailable': 'Chưa đồng bộ được trạng thái bản khai. Vui lòng tải lại trước khi thử tiếp.',
      'document.application_not_approved': 'Hồ sơ thuộc luồng cũ, chưa được xác nhận giấy tờ sẵn sàng.',
      'document.application_not_ready': 'Hồ sơ chưa được xác nhận giấy tờ sẵn sàng để tải PDF.',
      'document.readiness_invalid': 'Hồ sơ thiếu thông tin cán bộ xác nhận. Vui lòng liên hệ đơn vị phụ trách.',
      'document.workflow_review_failed': 'Chưa thực hiện được quyết định. Kiểm tra quyền thụ lý, trạng thái và nhận xét còn mở.',
      'document.workflow_decision_rejected': 'Chưa thể quyết định hồ sơ. Vui lòng kiểm tra trạng thái, quyền thụ lý và nhận xét còn mở.',
    };
    if (typeof code === 'string' && messages[code]) return messages[code];
    if (body && typeof body === 'object') {
      for (const key of ['detail', 'message', 'title']) {
        if (typeof body[key] === 'string' && body[key].trim()) return body[key];
      }
    }
    if (error.response?.status === 403) return 'Bạn không có quyền thao tác với tài liệu này.';
    if (error.response?.status === 404) return 'Không tìm thấy tài liệu yêu cầu.';
  }
  if (error instanceof Error && !axios.isAxiosError(error)) return error.message;
  return 'Không thể xử lý tài liệu. Vui lòng kiểm tra kết nối và thử lại.';
}

export function submissionStatusLabel(status: string) {
  return ({ Draft: 'Nháp đã lưu', Submitted: 'Đã chốt', RevisionRequested: 'Cần sửa', Approved: 'Đã duyệt', ReadyForDownload: 'Giấy tờ sẵn sàng' } as Record<string, string>)[status] ?? 'Chưa xác định';
}

export function safeDocumentLink(value: string) {
  try { const url = new URL(value); return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password ? url.href : undefined; }
  catch { return undefined; }
}

export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob); const link = document.createElement('a');
  link.href = url; link.download = fileName; document.body.appendChild(link); link.click(); link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
