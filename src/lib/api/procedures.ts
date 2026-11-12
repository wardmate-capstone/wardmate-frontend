import axios from 'axios';
import { z } from 'zod';
import { api } from './index';
import { servicePath, serviceUrls } from './serviceUrls';

export const categorySchema = z.object({ id: z.number().int().positive(), categoryName: z.string(), description: z.string().nullish() });
/** Trần độ dài BE đã chốt (BE-H, 10/11/2026) — dùng chung cho validate và bộ đếm ký tự. */
export const PROCEDURE_LIMITS = { title: 1000, procedureCode: 100, levelOfImplementation: 255, decisionNumber: 255, singleLine: 10000, sectionTitle: 255, sections: 50, fees: 100, formCodes: 20, listItems: 100, totalContent: 500000 } as const;
const stepSchema = z.object({ stepOrder: z.number(), stepName: z.string(), executor: z.string(), actionDetails: z.string() });
// Loại bản giấy tờ; OTHER dùng kèm quantityText ("bản chụp", "bản dịch có công chứng"...)
export const documentCopyTypes = ['ORIGINAL', 'CERTIFIED_COPY', 'REGULAR_COPY', 'OTHER'] as const;
const copyTypeSchema = z.enum(documentCopyTypes);
const textList = z.array(z.string()).nullish();
// Phí nhiều mức (BE-H B.1): amount null khi chỉ có tỷ lệ % hoặc "theo quy định"
export const feeItemSchema = z.object({ kind: z.string().nullish(), amount: z.number().nullish(), percent: z.number().nullish(), unit: z.string().nullish(), description: z.string().nullish(), caseCode: z.string().nullish() });
export const processingTimeUnits = ['WORKING_DAY', 'DAY', 'HOUR', 'MINUTE'] as const;
export const processingTimeSchema = z.object({ value: z.number().nullish(), unit: z.string().nullish(), text: z.string().nullish() });
export const submissionMethodSchema = z.object({
  methodName: z.string(), feeUnit: z.string().nullish(), note: z.string().nullish(),
  // null = không rõ / chỉ ghi bằng chữ / không quy định thời hạn
  feeAmount: z.number().nullish(), estimatedDays: z.number().nullish(),
  caseCode: z.string().nullish(), fees: z.array(feeItemSchema).nullish(), feeText: z.string().nullish(), processingTime: processingTimeSchema.nullish(),
});
export const resultDetailSchema = z.object({ name: z.string(), code: z.string().nullish(), validity: z.string().nullish(), note: z.string().nullish() });
export const additionalSectionSchema = z.object({ title: z.string(), content: z.string() });
// BE chỉ bắt buộc mã, tên, lĩnh vực: các chuỗi khác có thể null, các mảng có thể rỗng; trường BE-H không có thì BE bỏ khỏi JSON
export const contentSchema = z.object({
  decisionNumber: z.string().nullish(), receivingAddress: z.string().nullish(),
  submissionMethods: z.array(submissionMethodSchema),
  // Căn cứ pháp lý theo Cổng DVC chỉ cần tên văn bản + mã văn bản
  legalReferences: z.array(z.object({ documentNumber: z.string().nullish(), documentName: z.string().nullish(), issueDate: z.string().nullish(), authority: z.string().nullish() })),
  results: z.array(z.string()), cases: z.array(z.object({ caseCode: z.string(), caseName: z.string(), steps: z.array(stepSchema) })),
  procedureType: z.string().nullish(), levels: textList,
  competentAuthorities: textList, executingAgencies: textList, authorizedAgencies: textList, coordinatingAgencies: textList,
  requirements: z.string().nullish(), receivingAddresses: textList, resultDetails: z.array(resultDetailSchema).nullish(),
  keywords: textList, description: z.string().nullish(),
  stepsText: z.string().nullish(), commonSteps: z.array(stepSchema).nullish(),
  additionalSections: z.array(additionalSectionSchema).nullish(),
});
export const copyRequirementSchema = z.object({ documentCopyType: copyTypeSchema, quantity: z.number().int().positive().max(2147483647) });
export const checklistSchema = z.array(z.object({
  checklistId: z.string(), caseCode: z.string().nullish(), submissionType: z.enum(['NOP', 'XUAT_TRINH']), itemName: z.string(),
  // null khi giấy tờ cần nhiều loại bản (copyRequirements) hoặc không quy định
  documentCopyType: copyTypeSchema.nullish(), quantity: z.number().int().positive().max(2147483647),
  copyRequirements: z.array(copyRequirementSchema).nullish(),
  conditionNote: z.string().nullish(), isMandatory: z.boolean(),
  quantityText: z.string().nullish(), note: z.string().nullish(),
  // Cột "Mẫu đơn, tờ khai" của Cổng DVC: mã các formDefinitions gắn với giấy tờ này
  formCodes: z.array(z.string()).nullish(),
}));
export const formsSchema = z.array(z.object({ formTemplateId: z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i).refine(val => val !== '00000000-0000-0000-0000-000000000000', { message: 'Mã template không được là GUID rỗng' }).nullish(), caseCode: z.string().nullish(), formCode: z.string(), formName: z.string(), formType: z.enum(['ONLINE_INTERACTIVE', 'DOCX_TEMPLATE']), quantity: z.number().int().positive().max(2147483647), isMandatory: z.boolean() }));
export const checklistUpdateInputSchema = z.object({
  expectedUpdatedAt: z.string(),
  decisionNumber: z.string().trim().min(1).max(PROCEDURE_LIMITS.decisionNumber),
  effectiveDate: z.string(),
  items: checklistSchema,
});
export const procedureInputSchema = z.object({
  procedureCode: z.string().trim().min(1).max(PROCEDURE_LIMITS.procedureCode), categoryId: z.number().int().positive(), title: z.string().trim().min(1).max(PROCEDURE_LIMITS.title),
  issuingAuthority: z.string().nullish(), executingAgency: z.string().nullish(),
  levelOfImplementation: z.string().max(PROCEDURE_LIMITS.levelOfImplementation).nullish(), targetAudience: z.string().max(PROCEDURE_LIMITS.singleLine).nullish(),
  // Để trống: BE tự tóm tắt từ các cách nộp (contentPayload.submissionMethods)
  feeSummary: z.string().max(PROCEDURE_LIMITS.singleLine).nullish(), processingTimeSummary: z.string().max(PROCEDURE_LIMITS.singleLine).nullish(),
  originalPdfUrl: z.string().nullish(), pdfFileName: z.string().nullish(),
  contentPayload: contentSchema, checklistSchema: checklistSchema.nullish(), formDefinitions: formsSchema.nullish(),
});
export const detailSchema = procedureInputSchema.extend({ id: z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i), categoryName: z.string(), isActive: z.boolean(), createdAt: z.string(), updatedAt: z.string(),
  // PROC-UNPUBLISH-01: thời điểm công khai lần đầu; null = người dân chưa từng thấy (được phép hủy xuất bản)
  firstPublishedAt: z.string().nullish() });
const summarySchema = z.object({ id: z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i), procedureCode: z.string(), title: z.string(), categoryName: z.string(), levelOfImplementation: z.string().nullish(), feeSummary: z.string().nullish(), processingTimeSummary: z.string().nullish(), originalPdfUrl: z.string().nullish(), updatedAt: z.string(), isActive: z.boolean().optional(), versionCount: z.number().optional(), createdAt: z.string().optional() });
const pagedSchema = z.object({ items: z.array(summarySchema), currentPage: z.number(), totalPages: z.number(), totalCount: z.number(), pageSize: z.number(), hasPrevious: z.boolean(), hasNext: z.boolean() });
const draftSummarySchema = z.object({ id: z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i), status: z.enum(['Queued', 'Processing', 'NeedsReview', 'Failed', 'Published']), pdfFileName: z.string(), failureCode: z.string().nullish(), revision: z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i), publishedProcedureId: z.string().nullish(), createdAt: z.string(), updatedAt: z.string() });
const draftSchema = draftSummarySchema.extend({ payload: z.record(z.string(), z.unknown()), warnings: z.array(z.string()), extractedText: z.string() });
const extractionSchema = z.object({ payload: z.record(z.string(), z.unknown()), warnings: z.array(z.string()), extractedText: z.string() });
const versionSchema = z.object({ id: z.string(), versionNumber: z.number(), decisionNumber: z.string().nullish(), effectiveDate: z.string(), snapshotData: z.record(z.string(), z.unknown()), createdAt: z.string(), originalPdfUrl: z.string().nullish(), pdfFileName: z.string().nullish() });
const documentFormSchema = z.object({ id: z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i), formCode: z.string(), formName: z.string(), formType: z.enum(['ONLINE_INTERACTIVE', 'DOCX_TEMPLATE']) });
export type Category = z.infer<typeof categorySchema>;
export type ProcedureInput = z.infer<typeof procedureInputSchema>;
export type ChecklistUpdateInput = z.infer<typeof checklistUpdateInputSchema>;
export type ProcedureDetail = z.infer<typeof detailSchema>;
export type ProcedureSummary = z.infer<typeof summarySchema>;
export type ProcedurePage = z.infer<typeof pagedSchema>;
export type ProcedureDraft = z.infer<typeof draftSchema>;
export type DraftSummary = z.infer<typeof draftSummarySchema>;
export type Extraction = z.infer<typeof extractionSchema>;
export type ProcedureVersion = z.infer<typeof versionSchema>;
export type DocumentFormOption = z.infer<typeof documentFormSchema>;
export type ProcedureQuery = { keyword?: string; categoryId?: number; pageNumber?: number; pageSize?: number; isActive?: boolean; levelOfImplementation?: string; sortBy?: string; isAscending?: boolean };
const catalogPath = (path: string) => servicePath(serviceUrls.catalog, path);
const manager = catalogPath('/api/v1/procedure-manager/procedures');
const drafts = catalogPath('/api/v1/procedure-manager/drafts');
type CopyRow = { documentCopyType?: string | null; quantity?: number | null; copyRequirements?: { documentCopyType: string; quantity: number }[] | null };
/**
 * PROC-02b: BE trả 400 nếu dòng có copyRequirements mà documentCopyType/quantity gửi kèm mâu thuẫn.
 * - Không có copyRequirements: gửi như cũ.
 * - Một dòng copyRequirements mà ô loại bản/số lượng đơn đã bị sửa: cập nhật copyRequirements theo ô mới.
 * - Còn lại: chỉ gửi copyRequirements, bỏ hai ô cũ để BE tự suy ra.
 */
export function normalizeChecklistForSave<T extends CopyRow>(items: T[] | null | undefined): Record<string, unknown>[] | null | undefined {
  if (!items) return items;
  return items.map(item => {
    const { copyRequirements, documentCopyType, quantity, ...rest } = item;
    if (!copyRequirements?.length) return { ...rest, documentCopyType, quantity };
    const single = copyRequirements.length === 1 ? copyRequirements[0] : undefined;
    if (single && documentCopyType && quantity && (documentCopyType !== single.documentCopyType || quantity !== single.quantity))
      return { ...rest, copyRequirements: [{ documentCopyType, quantity }] };
    return { ...rest, copyRequirements };
  });
}
const withNormalizedChecklist = <T extends { checklistSchema?: CopyRow[] | null }>(input: T) => ({ ...input, checklistSchema: normalizeChecklistForSave(input.checklistSchema) });

function toDateOnlyString(value: string): string {
  const trimmed = value.trim();
  const match = /^(\d{4}-\d{2}-\d{2})/.exec(trimmed);
  if (match) return match[1];
  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }
  return trimmed;
}

export const procedureApi = {
  categories: async (signal?: AbortSignal) => z.array(categorySchema).parse((await api.get(catalogPath('/api/v1/procedures/categories'), { skipAuth: true, signal })).data),
  featured: async (signal?: AbortSignal) => z.array(summarySchema).parse((await api.get(catalogPath('/api/v1/procedures/featured'), { skipAuth: true, signal })).data),
  list: async (query: ProcedureQuery, managed = false, signal?: AbortSignal) => pagedSchema.parse((await api.get(managed ? manager : catalogPath('/api/v1/procedures'), { params: query, skipAuth: !managed, signal })).data),
  detail: async (id: string, signal?: AbortSignal) => detailSchema.parse((await api.get(catalogPath(`/api/v1/procedures/${encodeURIComponent(id)}`), { skipAuth: true, signal })).data),
  managerDetail: async (id: string, signal?: AbortSignal) => detailSchema.parse((await api.get(`${manager}/${encodeURIComponent(id)}`, { signal })).data),
  // isActive mặc định false: thủ tục tạo ở trạng thái ẩn, bật công khai sau bằng API status
  create: async (input: ProcedureInput, isActive = false) => detailSchema.parse((await api.post(manager, { ...withNormalizedChecklist(input), isActive })).data),
  // API 32a: gắn/thay PDF gốc cho thủ tục nhập tay (mỗi lần gắn tạo thêm một phiên bản)
  uploadSource: async (id: string, file: File) => detailSchema.parse((await api.post(`${manager}/${encodeURIComponent(id)}/source`, pdfForm(file), { timeout: 120000, headers: { 'Content-Type': undefined } })).data),
  update: async (id: string, input: ProcedureInput, decisionNumber: string, effectiveDate: string) =>
    detailSchema.parse((await api.put(`${manager}/${id}`, { ...withNormalizedChecklist(input), decisionNumber, effectiveDate: toDateOnlyString(effectiveDate) })).data),
  updateChecklist: async (id: string, input: ChecklistUpdateInput) =>
    detailSchema.parse((await api.put(`${manager}/${encodeURIComponent(id)}/checklist`, { ...input, items: normalizeChecklistForSave(input.items), effectiveDate: toDateOnlyString(input.effectiveDate) })).data),
  publish: async (input: ProcedureInput) => detailSchema.parse((await api.post(`${manager}/publish`, withNormalizedChecklist(input))).data),
  status: async (id: string, isActive: boolean, reason: string) => { await api.patch(`${manager}/${id}/status`, { isActive, reason }); },
  // API 36b: hủy xuất bản thủ tục chưa từng công khai — xóa hẳn thủ tục, bản nháp nguồn quay về NeedsReview
  unpublish: async (id: string) => { await api.post(`${manager}/${encodeURIComponent(id)}/unpublish`); },
  versions: async (id: string, signal?: AbortSignal) => z.array(versionSchema).parse((await api.get(`${manager}/${id}/versions`, { signal })).data),
  rollback: async (id: string, versionNumber: number, input: { reason: string; decisionNumber: string; effectiveDate: string }) =>
    detailSchema.parse((await api.post(`${manager}/${id}/versions/${versionNumber}/rollback`, { ...input, effectiveDate: toDateOnlyString(input.effectiveDate) })).data),
  versionSource: async (id: string, versionId: string) => sourceLink((await api.get(`${manager}/${id}/versions/${versionId}/source`)).data),
  createCategory: async (input: { categoryName: string; description?: string | null }) => categorySchema.parse((await api.post(catalogPath('/api/v1/procedure-manager/categories'), input)).data),
  updateCategory: async (id: number, input: { categoryName: string; description?: string | null }) => categorySchema.parse((await api.put(catalogPath(`/api/v1/procedure-manager/categories/${id}`), input)).data),
  deleteCategory: async (id: number) => { await api.delete(catalogPath(`/api/v1/procedure-manager/categories/${id}`)); },
  drafts: async (page: number, signal?: AbortSignal) => z.array(draftSummarySchema).parse((await api.get(drafts, { params: { page, pageSize: 10 }, signal })).data),
  draft: async (id: string, signal?: AbortSignal) => draftSchema.parse((await api.get(`${drafts}/${id}`, { signal })).data),
  upload: async (file: File) => draftSchema.parse((await api.post(drafts, pdfForm(file), { timeout: 120000 })).data),
  preview: async (file: File, signal?: AbortSignal) => extractionSchema.parse((await api.post(`${drafts}/extract-preview`, pdfForm(file), { timeout: 600000, signal })).data),
  saveDraft: async (id: string, revision: string, payload: Record<string, unknown>) => draftSchema.parse((await api.put(`${drafts}/${id}`, { revision, payload })).data),
  retryDraft: async (id: string, revision: string) => draftSchema.parse((await api.post(`${drafts}/${id}/retry`, { revision })).data),
  publishDraft: async (id: string, revision: string) => detailSchema.parse((await api.post(`${drafts}/${id}/publish`, { revision, confirmed: true })).data),
  deleteDraft: async (id: string) => { await api.delete(`${drafts}/${id}`); },
  documentForms: async (searchCode = '', page = 1, pageSize = 50, signal?: AbortSignal) =>
    z.array(documentFormSchema).parse(
      (
        await api.get(catalogPath('/api/v1/procedure-manager/document-forms'), {
          params: { page, pageSize, searchCode: searchCode || undefined },
          signal,
        })
      ).data
    ),
  source: async (id: string, draft = false) => {
    return sourceLink((await api.get(draft ? `${drafts}/${id}/source` : catalogPath(`/api/v1/procedures/${id}/source`), { skipAuth: !draft })).data);
  },
  // API 32b: màn quản trị xem PDF hiện tại kể cả khi thủ tục đang ẩn (API công khai chỉ phục vụ thủ tục công khai)
  managerSource: async (id: string) => sourceLink((await api.get(`${manager}/${encodeURIComponent(id)}/source`)).data),
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
    const details = data?.errors && typeof data.errors === 'object'
      ? Object.entries(data.errors).map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(' ') : String(value)}`).join('\n')
      : '';
    const mainMessage = typeof data?.detail === 'string' && data.detail.trim()
      ? data.detail
      : typeof data?.title === 'string' && data.title.trim()
        ? data.title
        : error.response?.status === 404
          ? 'Không tìm thấy thủ tục đang hoạt động.'
          : 'Không thể kết nối dịch vụ thủ tục. Vui lòng thử lại.';
    return [mainMessage, details].filter(Boolean).join('\n');
  }
  return error instanceof Error ? error.message : 'Không thể thực hiện thao tác.';
}
