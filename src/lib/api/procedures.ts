import axios from 'axios';
import { z } from 'zod';
import { api } from './index';

export const categorySchema = z.object({ id: z.number().int().positive(), categoryName: z.string(), description: z.string().nullish() });
const stepSchema = z.object({ stepOrder: z.number(), stepName: z.string(), executor: z.string(), actionDetails: z.string() });
export const contentSchema = z.object({
  decisionNumber: z.string(), receivingAddress: z.string(),
  submissionMethods: z.array(z.object({ methodName: z.string(), feeAmount: z.number(), feeUnit: z.string(), estimatedDays: z.number(), note: z.string().nullish() })),
  legalReferences: z.array(z.object({ documentNumber: z.string(), documentName: z.string(), issueDate: z.string().nullish(), authority: z.string() })),
  results: z.array(z.string()), cases: z.array(z.object({ caseCode: z.string(), caseName: z.string(), steps: z.array(stepSchema) })),
});
export const checklistSchema = z.array(z.object({ checklistId: z.string(), caseCode: z.string().nullish(), submissionType: z.enum(['NOP', 'XUAT_TRINH']), itemName: z.string(), documentCopyType: z.enum(['ORIGINAL', 'CERTIFIED_COPY', 'REGULAR_COPY']), quantity: z.number().positive(), conditionNote: z.string().nullish(), isMandatory: z.boolean() }));
export const formsSchema = z.array(z.object({ formTemplateId: z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i).nullish(), caseCode: z.string().nullish(), formCode: z.string(), formName: z.string(), formType: z.enum(['ONLINE_INTERACTIVE', 'DOCX_TEMPLATE']), quantity: z.number().positive(), isMandatory: z.boolean() }));
export const procedureInputSchema = z.object({
  procedureCode: z.string().trim().min(1).max(50), categoryId: z.number().int().positive(), title: z.string().trim().min(10).max(500),
  issuingAuthority: z.string().nullish(), executingAgency: z.string().nullish(),
  levelOfImplementation: z.string().min(1).max(50), targetAudience: z.string().min(1).max(255),
  feeSummary: z.string().min(1).max(255), processingTimeSummary: z.string().min(1).max(255),
  originalPdfUrl: z.string().nullish(), pdfFileName: z.string().nullish(),
  contentPayload: contentSchema, checklistSchema: checklistSchema.nullish(), formDefinitions: formsSchema.nullish(),
});
export const detailSchema = procedureInputSchema.extend({ id: z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i), categoryName: z.string(), isActive: z.boolean(), createdAt: z.string(), updatedAt: z.string() });
const summarySchema = z.object({ id: z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i), procedureCode: z.string(), title: z.string(), categoryName: z.string(), levelOfImplementation: z.string(), feeSummary: z.string(), processingTimeSummary: z.string(), originalPdfUrl: z.string().nullish(), updatedAt: z.string(), isActive: z.boolean().optional(), versionCount: z.number().optional(), createdAt: z.string().optional() });
const pagedSchema = z.object({ items: z.array(summarySchema), currentPage: z.number(), totalPages: z.number(), totalCount: z.number(), pageSize: z.number(), hasPrevious: z.boolean(), hasNext: z.boolean() });
const draftSummarySchema = z.object({ id: z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i), status: z.enum(['Queued', 'Processing', 'NeedsReview', 'Failed', 'Published']), pdfFileName: z.string(), failureCode: z.string().nullish(), revision: z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i), publishedProcedureId: z.string().nullish(), createdAt: z.string(), updatedAt: z.string() });
const draftSchema = draftSummarySchema.extend({ payload: z.record(z.string(), z.unknown()), warnings: z.array(z.string()), extractedText: z.string() });
const extractionSchema = z.object({ payload: z.record(z.string(), z.unknown()), warnings: z.array(z.string()), extractedText: z.string() });
const versionSchema = z.object({ id: z.string(), versionNumber: z.number(), decisionNumber: z.string().nullish(), effectiveDate: z.string(), snapshotData: z.record(z.string(), z.unknown()), createdAt: z.string(), originalPdfUrl: z.string().nullish(), pdfFileName: z.string().nullish() });
const documentFormSchema = z.object({ id: z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i), formCode: z.string(), formName: z.string(), formType: z.enum(['ONLINE_INTERACTIVE', 'DOCX_TEMPLATE']) });
export type Category = z.infer<typeof categorySchema>;
export type ProcedureInput = z.infer<typeof procedureInputSchema>;
export type ProcedureDetail = z.infer<typeof detailSchema>;
export type ProcedureSummary = z.infer<typeof summarySchema>;
export type ProcedurePage = z.infer<typeof pagedSchema>;
export type ProcedureDraft = z.infer<typeof draftSchema>;
export type DraftSummary = z.infer<typeof draftSummarySchema>;
export type Extraction = z.infer<typeof extractionSchema>;
export type ProcedureVersion = z.infer<typeof versionSchema>;
export type DocumentFormOption = z.infer<typeof documentFormSchema>;
export type ProcedureQuery = { keyword?: string; categoryId?: number; pageNumber?: number; pageSize?: number; isActive?: boolean; levelOfImplementation?: string; sortBy?: string; isAscending?: boolean };
const manager = '/api/v1/procedure-manager/procedures';
const drafts = '/api/v1/procedure-manager/drafts';
export const procedureApi = {
  categories: async (signal?: AbortSignal) => z.array(categorySchema).parse((await api.get('/api/v1/procedures/categories', { skipAuth: true, signal })).data),
  list: async (query: ProcedureQuery, managed = false, signal?: AbortSignal) => pagedSchema.parse((await api.get(managed ? manager : '/api/v1/procedures', { params: query, skipAuth: !managed, signal })).data),
  detail: async (id: string, signal?: AbortSignal) => detailSchema.parse((await api.get(`/api/v1/procedures/${encodeURIComponent(id)}`, { skipAuth: true, signal })).data),
  managerDetail: async (id: string, signal?: AbortSignal) => detailSchema.parse((await api.get(`${manager}/${encodeURIComponent(id)}`, { signal })).data),
  create: async (input: ProcedureInput) => detailSchema.parse((await api.post(manager, input)).data),
  update: async (id: string, input: ProcedureInput, decisionNumber: string, effectiveDate: string) => detailSchema.parse((await api.put(`${manager}/${id}`, { ...input, decisionNumber, effectiveDate })).data),
  publish: async (input: ProcedureInput) => detailSchema.parse((await api.post(`${manager}/publish`, input)).data),
  status: async (id: string, isActive: boolean, reason: string) => { await api.patch(`${manager}/${id}/status`, { isActive, reason }); },
  versions: async (id: string, signal?: AbortSignal) => z.array(versionSchema).parse((await api.get(`${manager}/${id}/versions`, { signal })).data),
  rollback: async (id: string, versionNumber: number, input: { reason: string; decisionNumber: string; effectiveDate: string }) => detailSchema.parse((await api.post(`${manager}/${id}/versions/${versionNumber}/rollback`, input)).data),
  versionSource: async (id: string, versionId: string) => sourceLink((await api.get(`${manager}/${id}/versions/${versionId}/source`)).data),
  createCategory: async (input: { categoryName: string; description?: string | null }) => categorySchema.parse((await api.post('/api/v1/procedure-manager/categories', input)).data),
  updateCategory: async (id: number, input: { categoryName: string; description?: string | null }) => categorySchema.parse((await api.put(`/api/v1/procedure-manager/categories/${id}`, input)).data),
  deleteCategory: async (id: number) => { await api.delete(`/api/v1/procedure-manager/categories/${id}`); },
  drafts: async (page: number, signal?: AbortSignal) => z.array(draftSummarySchema).parse((await api.get(drafts, { params: { page, pageSize: 10 }, signal })).data),
  draft: async (id: string, signal?: AbortSignal) => draftSchema.parse((await api.get(`${drafts}/${id}`, { signal })).data),
  upload: async (file: File) => draftSchema.parse((await api.post(drafts, pdfForm(file), { timeout: 120000 })).data),
  preview: async (file: File, signal?: AbortSignal) => extractionSchema.parse((await api.post(`${drafts}/extract-preview`, pdfForm(file), { timeout: 600000, signal })).data),
  saveDraft: async (id: string, revision: string, payload: Record<string, unknown>) => draftSchema.parse((await api.put(`${drafts}/${id}`, { revision, payload })).data),
  retryDraft: async (id: string, revision: string) => draftSchema.parse((await api.post(`${drafts}/${id}/retry`, { revision })).data),
  publishDraft: async (id: string, revision: string) => detailSchema.parse((await api.post(`${drafts}/${id}/publish`, { revision, confirmed: true })).data),
  deleteDraft: async (id: string) => { await api.delete(`${drafts}/${id}`); },
  documentForms: async (searchCode = '', signal?: AbortSignal) => z.array(documentFormSchema).parse((await api.get('/api/v1/procedure-manager/document-forms', { params: { page: 1, pageSize: 50, searchCode: searchCode || undefined }, signal })).data),
  source: async (id: string, draft = false) => {
    return sourceLink((await api.get(draft ? `${drafts}/${id}/source` : `/api/v1/procedures/${id}/source`, { skipAuth: !draft })).data);
  },
};
function sourceLink(value: unknown) {
  const data = z.object({ url: z.string().url(), expiresInSeconds: z.number().positive() }).parse(value);
  const url = new URL(data.url);
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) throw new Error('Đường dẫn PDF không hợp lệ.');
  return data;
}
function pdfForm(file: File) {
  if (!file.name.toLowerCase().endsWith('.pdf') || file.size < 5 || file.size > 20 * 1024 * 1024) throw new Error('Chọn file PDF tối đa 20 MB.');
  const form = new FormData(); form.append('file', file); return form;
}
export function procedureError(error: unknown): string {
  if (error instanceof z.ZodError) return 'Một số thông tin chưa hợp lệ. Vui lòng kiểm tra lại các trường đã nhập.';
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    const details = data?.errors && typeof data.errors === 'object' ? Object.entries(data.errors).map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(' ') : String(value)}`).join('\n') : '';
    return [typeof data?.title === 'string' ? data.title : error.response?.status === 404 ? 'Không tìm thấy thủ tục đang hoạt động.' : 'Không thể kết nối dịch vụ thủ tục. Vui lòng thử lại.', details].filter(Boolean).join('\n');
  }
  return error instanceof Error ? error.message : 'Không thể thực hiện thao tác.';
}
