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
  documentType: z.string(),
  pdfBlobUrl: z.string().nullish(),
  createdAtUtc: z.string(),
});

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
    return applicationContentsSchema.parse(response.data);
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
  generatePdf: async (applicationId: string, submissionId: string, documentType = 'ORIGINAL_SUBMISSION') => {
    const data = new FormData(); data.append('SubmissionId', submissionId); data.append('DocumentType', documentType);
    const response = await api.post(documentPath(`/api/v1/applications/${applicationId}/generate-pdf`), data, { headers: { 'Content-Type': undefined } });
    return generatedDocumentSchema.parse(response.data);
  },
  listGeneratedDocuments: async (applicationId: string, signal?: AbortSignal) => {
    const response = await api.get(documentPath(`/api/v1/applications/${applicationId}/generated-documents`), { signal });
    return z.array(generatedDocumentSchema).parse(response.data);
  },
  downloadGeneratedDocument: (documentId: string, signal?: AbortSignal) => binaryRequest(`/api/v1/generated-documents/${documentId}/download`, signal),
  officerDownloadSubmission: (submissionId: string, signal?: AbortSignal) => binaryRequest(`/api/v1/officer/submissions/${submissionId}/download-docx`, signal),
  officerAnnotateSubmission: async (submissionId: string, file: File) => {
    const data = new FormData(); appendFile(data, file);
    const response = await api.put(documentPath(`/api/v1/officer/submissions/${submissionId}/annotate-docx`), data, { headers: { 'Content-Type': undefined } });
    return saveSubmissionResultSchema.parse(response.data);
  },
  officerRequestRevision: (submissionId: string, comment: string) => api.post(documentPath(`/api/v1/officer/submissions/${submissionId}/request-revision`), { comment }),
  officerApprove: (submissionId: string) => api.post(documentPath(`/api/v1/officer/submissions/${submissionId}/approve`), {}),
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
      'document.pdf_render_failed': 'Chưa thể tạo PDF. Vui lòng thử lại sau.',
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
  return error instanceof Error ? error.message : 'Không thể xử lý tài liệu. Vui lòng thử lại.';
}

export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob); const link = document.createElement('a');
  link.href = url; link.download = fileName; document.body.appendChild(link); link.click(); link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
