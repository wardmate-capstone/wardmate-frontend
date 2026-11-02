import axios from "axios";
import { z } from "zod";
import { api } from "./index";
import { servicePath, serviceUrls } from "./serviceUrls";

const aiPath = (path: string) => servicePath(serviceUrls.aiOcr, path);

export const cccdExtractionSchema = z.preprocess(
  (val) => {
    if (!val || typeof val !== "object") return val;
    const obj = val as Record<string, unknown>;
    return {
      citizenId: obj.citizenId ?? obj.CitizenId,
      fullName: obj.fullName ?? obj.FullName,
      dateOfBirth: obj.dateOfBirth ?? obj.DateOfBirth,
      gender: obj.gender ?? obj.Gender,
      nationality: obj.nationality ?? obj.Nationality,
      placeOfOrigin: obj.placeOfOrigin ?? obj.PlaceOfOrigin,
      placeOfResidence: obj.placeOfResidence ?? obj.PlaceOfResidence,
      dateOfExpiry: obj.dateOfExpiry ?? obj.DateOfExpiry,
      confidenceScore: obj.confidenceScore ?? obj.ConfidenceScore,
    };
  },
  z.object({
    citizenId: z.string().nullish(),
    fullName: z.string().nullish(),
    dateOfBirth: z.string().nullish(),
    gender: z.string().nullish(),
    nationality: z.string().nullish(),
    placeOfOrigin: z.string().nullish(),
    placeOfResidence: z.string().nullish(),
    dateOfExpiry: z.string().nullish(),
    confidenceScore: z.number().nullish(),
  }),
);

export type CccdExtractionDto = z.infer<typeof cccdExtractionSchema>;

export const documentVerificationSchema = z.object({
  isValid: z.boolean(),
  documentTypeDetected: z.string(),
  qualityIssues: z.array(z.string()),
  confidence: z.number(),
  checklistId: z.string().nullish(),
  expectedType: z.string().nullish(),
});

export type DocumentVerificationDto = z.infer<typeof documentVerificationSchema>;

export interface VerifyDocumentInput {
  applicationId: string;
  documentId: string;
  expectedType?: string | null;
}

export const dossierAssistFileSchema = z.object({
  kind: z.string(), // "SUBMISSION" | "SUPPORTING_DOCUMENT"
  id: z.string(),
  checklistId: z.string().nullish(),
  checklistTitle: z.string().nullish(),
  fileName: z.string(),
  analyzed: z.boolean(),
  skipReason: z.string().nullish(),
});

export const dossierAssistExtractedFieldSchema = z.object({
  name: z.string(),
  value: z.string().nullish(),
  source: z.string().nullish(),
});

export const dossierAssistCrossCheckSchema = z.object({
  field: z.string(),
  valueInForm: z.string().nullish(),
  valueInDocument: z.string().nullish(),
  sourceDocument: z.string().nullish(),
  result: z.enum(['MATCH', 'MISMATCH', 'NOT_FOUND']),
  note: z.string().nullish(),
});

export const dossierAssistResultSchema = z.object({
  applicationId: z.string(),
  analyzedAt: z.string(),
  applicationStatus: z.string(),
  model: z.string().nullish(),
  overallAssessment: z.enum(['NO_ISSUES_FOUND', 'NEEDS_ATTENTION', 'INSUFFICIENT_DATA']),
  summary: z.string(),
  files: z.array(dossierAssistFileSchema),
  extractedFields: z.array(dossierAssistExtractedFieldSchema),
  crossChecks: z.array(dossierAssistCrossCheckSchema),
  missingItems: z.array(z.string()),
  issues: z.array(z.string()),
  suggestedComment: z.string().nullish(),
  disclaimer: z.string(),
});

export type DossierAssistResultDto = z.infer<typeof dossierAssistResultSchema>;
export type DossierAssistCrossCheckDto = z.infer<typeof dossierAssistCrossCheckSchema>;

export interface DossierAssistInput {
  includeSubmissions?: boolean;
  includeSupportingDocuments?: boolean;
}

export const knowledgeSourceTypes = [
  "PROCEDURE",
  "MANUAL_TEXT",
  "FAQ",
  "PDF_FILE",
] as const;
export type KnowledgeSourceType = (typeof knowledgeSourceTypes)[number];

// [n] in a grounded answer refers to citations[].index; score is for administrators, never shown to citizens.
export const chatCitationSchema = z.object({
  index: z.number().int().positive(),
  documentId: z.string(),
  title: z.string(),
  sourceType: z.string(),
  procedureId: z.string().nullish(),
  chunkId: z.string(),
  heading: z.string().nullish(),
  score: z.number(),
});
export type ChatCitation = z.infer<typeof chatCitationSchema>;

const relatedProcedureSchema = z.object({
  procedureId: z.string(),
  title: z.string(),
});
export type RelatedProcedure = z.infer<typeof relatedProcedureSchema>;
// BE returns [] when RAG is off; drop unknown shapes instead of failing the whole answer.
const relatedProceduresSchema = z
  .array(z.unknown())
  .nullish()
  .transform((items) =>
    (items ?? []).flatMap((item) => {
      const parsed = relatedProcedureSchema.safeParse(item);
      return parsed.success ? [parsed.data] : [];
    }),
  );

export const chatCompletionSchema = z.object({
  conversationId: z.string(),
  answer: z.string(),
  relatedProcedures: relatedProceduresSchema,
  citations: z.array(chatCitationSchema).nullish(),
  grounded: z
    .boolean()
    .nullish()
    .transform((value) => value ?? false),
});

export type ChatCompletionDto = z.infer<typeof chatCompletionSchema>;

function pageSchema<T extends z.ZodTypeAny>(item: T) {
  return z.object({
    items: z.array(item),
    pageNumber: z.number(),
    pageSize: z.number(),
    totalCount: z.number(),
  });
}

const chatSessionSchema = z.object({
  id: z.string(),
  wardCode: z.string(),
  createdAt: z.string(),
});
const chatHistoryMessageSchema = z.object({
  id: z.string(),
  role: z.string(),
  content: z.string(),
  createdAt: z.string(),
  citations: z.array(chatCitationSchema).nullish(),
});
const chatSessionPageSchema = pageSchema(chatSessionSchema);
const chatMessagePageSchema = pageSchema(chatHistoryMessageSchema);
export type ChatSession = z.infer<typeof chatSessionSchema>;
export type ChatHistoryMessage = z.infer<typeof chatHistoryMessageSchema>;

export interface ChatMessageInput {
  message: string;
  conversationId?: string | null;
  wardCode?: string | null;
}

const knowledgeSummaryFields = {
  id: z.string(),
  title: z.string(),
  sourceType: z.string(),
  procedureId: z.string().nullish(),
  sourceReference: z.string().nullish(),
  sourceVersion: z.string().nullish(),
  status: z.string(),
  isActive: z.boolean(),
  chunkCount: z.number(),
  revision: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  chunkedAt: z.string().nullish(),
};
const knowledgeSummarySchema = z.object({
  ...knowledgeSummaryFields,
  contentLength: z.number(),
});
const knowledgeDocumentSchema = z.object({
  ...knowledgeSummaryFields,
  chunkingVersion: z.string(),
  content: z.string(),
  contentSha256: z.string(),
  createdBy: z.string(),
  updatedBy: z.string(),
  warnings: z.array(z.string()).nullish(),
  embeddingModel: z.string().nullish(),
  embeddingAttempts: z.number().nullish(),
  nextEmbeddingAt: z.string().nullish(),
  embeddingError: z.string().nullish(),
  embeddedAt: z.string().nullish(),
});
const knowledgeChunkSchema = z.object({
  id: z.string(),
  chunkIndex: z.number(),
  heading: z.string().nullish(),
  content: z.string(),
  charCount: z.number(),
  contentSha256: z.string(),
});
const knowledgeIndexStatusSchema = z.object({
  embeddingEnabled: z.boolean(),
  ragEnabled: z.boolean(),
  embeddingSignature: z.string(),
  activeDocuments: z.number(),
  chunked: z.number(),
  embedded: z.number(),
  embeddingFailed: z.number(),
  inactive: z.number(),
  searchableChunks: z.number(),
  maxIndexedChunks: z.number(),
  minScore: z.number(),
  topK: z.number(),
});
const knowledgeSearchHitSchema = z.object({
  rank: z.number(),
  documentId: z.string(),
  title: z.string(),
  sourceType: z.string(),
  procedureId: z.string().nullish(),
  chunkId: z.string(),
  heading: z.string().nullish(),
  content: z.string(),
  score: z.number(),
});
const procedureSyncSchema = z.object({
  outcome: z.enum(["CREATED", "UPDATED", "UNCHANGED", "DEACTIVATED"]),
  document: knowledgeSummarySchema.nullish(),
});
const procedureSyncAllSchema = z.object({
  scanned: z.number(),
  created: z.number(),
  updated: z.number(),
  unchanged: z.number(),
  deactivated: z.number(),
  failed: z.number(),
  complete: z.boolean(),
  failedProcedureIds: z.array(z.string()),
});
const knowledgePageSchema = pageSchema(knowledgeSummarySchema);
const knowledgeChunkPageSchema = pageSchema(knowledgeChunkSchema);

export type KnowledgeDocumentSummary = z.infer<typeof knowledgeSummarySchema>;
export type KnowledgeDocument = z.infer<typeof knowledgeDocumentSchema>;
export type KnowledgeChunk = z.infer<typeof knowledgeChunkSchema>;
export type KnowledgeIndexStatus = z.infer<typeof knowledgeIndexStatusSchema>;
export type KnowledgeSearchHit = z.infer<typeof knowledgeSearchHitSchema>;
export type ProcedureSyncResult = z.infer<typeof procedureSyncSchema>;
export type ProcedureSyncAllResult = z.infer<typeof procedureSyncAllSchema>;
export type KnowledgeListQuery = {
  search?: string;
  sourceType?: string;
  isActive?: boolean;
  procedureId?: string;
  pageNumber?: number;
  pageSize?: number;
};

export const KNOWLEDGE_PDF_MAX_BYTES = 10 * 1024 * 1024;
const knowledgeBase = "/api/v1/ai/knowledge";
const kb = (path: string) => aiPath(knowledgeBase + path);

export const aiOcrApi = {
  extractCccd: async (
    frontImage: File,
    backImage?: File,
    signal?: AbortSignal,
  ): Promise<CccdExtractionDto> => {
    const data = new FormData();
    data.append("frontImage", frontImage, frontImage.name);
    if (backImage) {
      data.append("backImage", backImage, backImage.name);
    }

    try {
      const response = await api.post(
        aiPath("/api/v1/ai-ocr/cccd/extract"),
        data,
        {
          signal,
          suppressSessionExpiry: true,
          headers: { "Content-Type": undefined },
        },
      );

      return cccdExtractionSchema.parse(response.data);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        if (status === 401) {
          throw new Error(
            "Dịch vụ nhận diện giấy tờ tự động tạm thời chưa sẵn sàng. Bạn vui lòng thử lại sau hoặc nhập thông tin thủ công vào biểu mẫu.",
          );
        }
        if (status === 413) {
          throw new Error(
            "Kích thước ảnh vượt quá giới hạn cho phép (tối đa 8MB mỗi ảnh, tổng yêu cầu 17MB).",
          );
        }
        if (status === 415) {
          throw new Error(
            "Định dạng tệp không được hỗ trợ. Vui lòng tải ảnh CCCD định dạng PNG hoặc JPEG.",
          );
        }
        if (status === 429) {
          throw new Error(
            "Hệ thống đang tiếp nhận nhiều lượt xử lý. Vui lòng đợi trong giây lát rồi thử lại.",
          );
        }
        if (
          status === 404 ||
          status === 502 ||
          status === 503 ||
          status === 504
        ) {
          throw new Error(
            `Dịch vụ AI OCR tạm thời chưa phản hồi hoặc chưa sẵn sàng (HTTP ${status}). Vui lòng nhập thông tin vào biểu mẫu hoặc thử lại sau.`,
          );
        }
        const serverMsg =
          (err.response?.data as { title?: string; detail?: string })?.title ||
          (err.response?.data as { message?: string })?.message;
        if (serverMsg) throw new Error(serverMsg);
      }
      throw err;
    }
  },

  chat: async (
    input: ChatMessageInput,
    signal?: AbortSignal,
  ): Promise<ChatCompletionDto> => {
    try {
      const response = await api.post(
        aiPath("/api/v1/ai/chat/completions"),
        {
          message: input.message.trim(),
          conversationId: input.conversationId || null,
          wardCode: input.wardCode || "WARD_001",
        },
        { signal, suppressSessionExpiry: true, timeout: 35000 },
      );

      return chatCompletionSchema.parse(response.data);
    } catch (err: unknown) {
      throw new Error(aiError(err));
    }
  },

  chatSessions: async (pageNumber = 1, pageSize = 20, signal?: AbortSignal) =>
    chatSessionPageSchema.parse(
      (
        await api.get(aiPath("/api/v1/ai/chat/sessions"), {
          params: { pageNumber, pageSize },
          signal,
          suppressSessionExpiry: true,
        })
      ).data,
    ),

  chatMessages: async (
    sessionId: string,
    pageNumber = 1,
    pageSize = 50,
    signal?: AbortSignal,
  ) =>
    chatMessagePageSchema.parse(
      (
        await api.get(
          aiPath(
            `/api/v1/ai/chat/sessions/${encodeURIComponent(sessionId)}/messages`,
          ),
          {
            params: { pageNumber, pageSize },
            signal,
            suppressSessionExpiry: true,
          },
        )
      ).data,
    ),
  verifyDocument: async (
    input: VerifyDocumentInput,
    signal?: AbortSignal,
  ): Promise<DocumentVerificationDto> => {
    try {
      const response = await api.post(
        aiPath("/api/v1/ai-ocr/documents/verify"),
        {
          applicationId: input.applicationId,
          documentId: input.documentId,
          expectedType: input.expectedType || undefined,
        },
        { signal, suppressSessionExpiry: true, timeout: 35000 },
      );
      return documentVerificationSchema.parse(response.data);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        const code = (err.response?.data)?.code;
        if (code === "chat.database_unavailable" || status === 502 || status === 503 || status === 504) {
          throw new Error("Hệ thống tiền kiểm AI đang được bảo trì hoặc nâng cấp máy chủ. Bạn vui lòng đối soát giấy tờ trực tiếp để tiếp tục xử lý hồ sơ.");
        }
        if (code === "ai.checklist_required") {
          throw new Error("Giấy tờ chưa được liên kết với mục trong hồ sơ. Vui lòng tải lại trang.");
        }
        if (code === "ai.checklist_mismatch") {
          throw new Error("Không tìm thấy mục giấy tờ tương ứng trong danh mục hồ sơ.");
        }
        if (status === 401 || status === 403) {
          throw new Error("Bạn không có quyền thực hiện kiểm tra giấy tờ này.");
        }
        if (code === "ai.document_not_found" || status === 404) {
          throw new Error(
            "Không tìm thấy tệp giấy tờ này trong hồ sơ hoặc bạn chưa được phân quyền truy cập. Vui lòng tải lại trang hoặc kiểm tra lại file đã đính kèm."
          );
        }
        if (status === 413) {
          throw new Error("Kích thước tệp quá lớn để quét tự động (tối đa 8 MB). Vui lòng nén nhỏ ảnh hoặc đối soát trực tiếp.");
        }
        if (status === 429) {
          throw new Error("Hệ thống đang tiếp nhận nhiều yêu cầu. Vui lòng đợi trong giây lát rồi thử lại.");
        }
        const serverMsg =
          (err.response?.data)?.title ||
          (err.response?.data)?.message;
        if (serverMsg) throw new Error(serverMsg);
      }
      throw err;
    }
  },
  dossierAssist: async (
    applicationId: string,
    input?: DossierAssistInput,
    signal?: AbortSignal,
  ): Promise<DossierAssistResultDto> => {
    try {
      const response = await api.post(
        aiPath(`/api/v1/ai-ocr/applications/${applicationId}/dossier-assist`),
        input ?? { includeSubmissions: true, includeSupportingDocuments: true },
        { signal, timeout: 65000 },
      );
      return dossierAssistResultSchema.parse(response.data);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        const code = err.response?.data?.code;
        const retryHeader = err.response?.headers?.['retry-after'] || err.response?.headers?.['Retry-After'];
        const bodyRetry = err.response?.data?.retryAfter;
        const retryAfterSec = retryHeader ? parseInt(String(retryHeader), 10) : (typeof bodyRetry === 'number' ? bodyRetry : undefined);

        if (status === 429 && code === 'ai.provider_busy') {
          const waitTime = !isNaN(retryAfterSec ?? NaN) && (retryAfterSec ?? 0) > 0 ? `${retryAfterSec} giây` : 'chốc lát';
          const errorObj = new Error(`Dịch vụ AI đang bận hoặc quá tải hạn mức. Vui lòng thử lại sau ${waitTime}.`);
          Object.assign(errorObj, { retryAfter: retryAfterSec, code: 'ai.provider_busy' });
          throw errorObj;
        }
        if (code === 'ai.not_assigned_officer' || status === 403) {
          throw new Error('Chỉ cán bộ đang trực tiếp thụ lý hồ sơ mới có quyền dùng AI hỗ trợ kiểm tra.');
        }
        if (code === 'ai.application_not_under_review' || status === 409) {
          throw new Error('Hồ sơ cần được cán bộ tiếp nhận (đang thụ lý) trước khi dùng trợ lý AI kiểm tra.');
        }
        if (code === 'ai.dossier_empty' || status === 422) {
          throw new Error('Hồ sơ chưa có tệp bản khai hoặc tài liệu nào hỗ trợ để AI phân tích.');
        }
        if (code === 'ai.output_truncated' || status === 502) {
          throw new Error('Nội dung hồ sơ quá dài khiến câu trả lời bị cắt. Hãy thử kiểm tra từng phần (chỉ bản khai hoặc chỉ giấy tờ).');
        }
        if (status === 503 && code === 'ai.provider_unavailable') {
          throw new Error('Dịch vụ Gemini AI tạm thời không phản hồi. Vui lòng thử lại sau.');
        }
        const title = err.response?.data?.title;
        if (title) throw new Error(title);
      }
      throw err;
    }
  },
};

export const knowledgeApi = {
  list: async (query: KnowledgeListQuery, signal?: AbortSignal) =>
    knowledgePageSchema.parse(
      (await api.get(kb("/documents"), { params: query, signal })).data,
    ),
  get: async (id: string, signal?: AbortSignal) =>
    knowledgeDocumentSchema.parse(
      (await api.get(kb(`/documents/${encodeURIComponent(id)}`), { signal }))
        .data,
    ),
  chunks: async (
    id: string,
    pageNumber = 1,
    pageSize = 20,
    signal?: AbortSignal,
  ) =>
    knowledgeChunkPageSchema.parse(
      (
        await api.get(kb(`/documents/${encodeURIComponent(id)}/chunks`), {
          params: { pageNumber, pageSize },
          signal,
        })
      ).data,
    ),
  createText: async (input: {
    title: string;
    sourceType: "MANUAL_TEXT" | "FAQ";
    content: string;
    procedureId?: string | null;
  }) =>
    knowledgeDocumentSchema.parse(
      (
        await api.post(kb("/documents"), {
          ...input,
          procedureId: input.procedureId || null,
        })
      ).data,
    ),
  uploadPdf: async (input: {
    file: File;
    title?: string;
    procedureId?: string | null;
  }) => {
    if (
      !input.file.name.toLowerCase().endsWith(".pdf") ||
      input.file.size > KNOWLEDGE_PDF_MAX_BYTES
    ) {
      throw new Error("Chỉ nhận file PDF tối đa 10 MB.");
    }
    const data = new FormData();
    data.append("file", input.file, input.file.name);
    if (input.title?.trim()) data.append("title", input.title.trim());
    if (input.procedureId) data.append("procedureId", input.procedureId);
    // Let the browser set the multipart boundary.
    return knowledgeDocumentSchema.parse(
      (
        await api.post(kb("/documents/pdf"), data, {
          headers: { "Content-Type": undefined },
          timeout: 120000,
        })
      ).data,
    );
  },
  update: async (
    id: string,
    input: { expectedRevision: string; title: string; content?: string | null },
  ) =>
    knowledgeDocumentSchema.parse(
      (await api.put(kb(`/documents/${encodeURIComponent(id)}`), input)).data,
    ),
  setActive: async (
    id: string,
    input: { expectedRevision: string; isActive: boolean },
  ) =>
    knowledgeDocumentSchema.parse(
      (
        await api.post(
          kb(`/documents/${encodeURIComponent(id)}/activation`),
          input,
        )
      ).data,
    ),
  rechunk: async (id: string, expectedRevision: string) =>
    knowledgeDocumentSchema.parse(
      (
        await api.post(kb(`/documents/${encodeURIComponent(id)}/rechunk`), {
          expectedRevision,
        })
      ).data,
    ),
  reindex: async (id: string, expectedRevision: string) =>
    knowledgeDocumentSchema.parse(
      (
        await api.post(kb(`/documents/${encodeURIComponent(id)}/reindex`), {
          expectedRevision,
        })
      ).data,
    ),
  indexStatus: async (signal?: AbortSignal) =>
    knowledgeIndexStatusSchema.parse(
      (await api.get(kb("/index-status"), { signal })).data,
    ),
  // Each call creates a paid embedding on the server; only call on explicit user action.
  search: async (query: string, topK: number) =>
    z
      .array(knowledgeSearchHitSchema)
      .parse((await api.post(kb("/search"), { query, topK })).data),
  syncProcedure: async (procedureId: string) =>
    procedureSyncSchema.parse(
      (
        await api.post(
          kb(`/procedures/${encodeURIComponent(procedureId)}/sync`),
        )
      ).data,
    ),
  syncAll: async () =>
    procedureSyncAllSchema.parse(
      (await api.post(kb("/procedures/sync"), undefined, { timeout: 600000 }))
        .data,
    ),
};

const aiErrorMessages: Record<string, string> = {
  "knowledge.validation":
    "Thông tin gửi lên chưa hợp lệ. Vui lòng kiểm tra lại.",
  "knowledge.not_found":
    "Không tìm thấy tài liệu. Có thể tài liệu đã thay đổi; vui lòng tải lại danh sách.",
  "knowledge.revision_conflict":
    "Tài liệu vừa được người khác cập nhật. Hãy tải lại để xem bản mới nhất trước khi thao tác.",
  "knowledge.source_not_editable":
    "Không sửa trực tiếp được nguồn này. Với thủ tục, hãy sửa thủ tục rồi đồng bộ lại.",
  "knowledge.no_change": "Tài liệu đã ở đúng trạng thái này.",
  "knowledge.procedure_not_found":
    "Không tìm thấy thủ tục đang áp dụng trong danh mục.",
  "knowledge.content_too_long": "Nội dung quá dài (tối đa 200.000 ký tự).",
  "knowledge.too_many_chunks":
    "Nội dung chia ra quá nhiều đoạn (tối đa 500). Hãy tách thành nhiều tài liệu.",
  "knowledge.empty_content":
    "Nội dung trống hoặc quá ngắn sau khi chuẩn hóa (cần ít nhất 20 ký tự).",
  "knowledge.pdf_too_large": "File PDF vượt quá 10 MB.",
  "knowledge.pdf_invalid": "File tải lên không phải PDF hợp lệ.",
  "knowledge.pdf_no_text":
    "PDF không có lớp chữ (có thể là bản scan). Hệ thống chỉ đọc được PDF có chữ.",
  "knowledge.pdf_unreadable":
    "Không đọc được nội dung PDF. Vui lòng kiểm tra lại file.",
  "knowledge.pdf_page_limit": "PDF phải có từ 1 đến 100 trang.",
  "knowledge.catalog_unavailable":
    "Chưa kết nối được danh mục thủ tục. Vui lòng thử lại sau.",
  "knowledge.catalog_invalid_response":
    "Danh mục thủ tục trả dữ liệu không hợp lệ. Vui lòng thử lại sau.",
  "knowledge.catalog_not_configured":
    "Dịch vụ AI chưa được cấu hình kết nối danh mục thủ tục.",
  "knowledge.forbidden":
    "Bạn chưa có quyền quản lý dữ liệu kiến thức AI (knowledge.manage).",
  "knowledge.iam_unavailable":
    "Chưa xác minh được quyền truy cập. Vui lòng thử lại sau.",
  "knowledge.database_unavailable": "Cơ sở dữ liệu kiến thức AI chưa sẵn sàng.",
  "knowledge.embedding_disabled":
    "Máy chủ chưa bật tạo vector (embedding), nên chưa tìm kiếm theo nguồn được.",
  "knowledge.embedding_not_configured":
    "Máy chủ chưa cấu hình dịch vụ tạo vector.",
  "knowledge.embedding_unavailable":
    "Dịch vụ tìm nguồn tạm thời không phản hồi. Vui lòng thử lại sau.",
  "knowledge.embedding_invalid":
    "Dịch vụ tìm nguồn trả kết quả không hợp lệ. Vui lòng thử lại sau.",
  "knowledge.index_too_large":
    "Kho kiến thức vượt giới hạn tìm kiếm của máy chủ.",
  "chat.invalid_input": "Câu hỏi chưa hợp lệ. Vui lòng nhập lại.",
  "chat.busy":
    "Trợ lý đang trả lời câu trước. Vui lòng chờ hoàn tất rồi gửi tiếp.",
  "chat.ward_mismatch":
    "Cuộc trò chuyện này thuộc phường khác. Hãy tạo cuộc trò chuyện mới.",
  "chat.not_found": "Không tìm thấy cuộc trò chuyện của bạn.",
  "chat.database_unavailable":
    "Trợ lý AI tạm thời không truy cập được cơ sở dữ liệu. Vui lòng thử lại sau.",
  "ai.guest_quota_exceeded":
    "Bạn đã hết lượt hỏi hôm nay. Đăng nhập để hỏi tiếp.",
  "ai.guest_limit_reached":
    "Hệ thống đã hết lượt cho khách hôm nay. Đăng nhập hoặc thử lại ngày mai.",
  "ai.quota_exceeded":
    "Bạn đã dùng hết 30 lượt hôm nay, thử lại ngày mai.",
  "ai.daily_limit_reached":
    "Trợ lý AI tạm hết lượt hôm nay. Vui lòng thử lại ngày mai.",
  "ai.output_truncated":
    "Câu hỏi quá rộng, hãy hỏi cụ thể hơn.",
  "ai.provider_unavailable":
    "Trợ lý AI tạm thời không phản hồi. Vui lòng thử lại sau.",
  "ai.provider_busy":
    "Google Gemini đang quá tải hoặc tạm hết hạn mức phút. Vui lòng chờ đếm ngược rồi thử lại.",
  "ai.dossier_empty":
    "Hồ sơ chưa có tệp bản khai hoặc tài liệu nào hỗ trợ để AI phân tích.",
  "ai.not_assigned_officer":
    "Chỉ cán bộ đang trực tiếp thụ lý hồ sơ mới có quyền dùng AI hỗ trợ kiểm tra.",
  "ai.application_not_under_review":
    "Hồ sơ cần được cán bộ tiếp nhận (đang thụ lý) trước khi dùng trợ lý AI kiểm tra.",
  "ai.workflow_not_configured":
    "Hệ thống AI chưa cấu hình kết nối tới dịch vụ quản lý hồ sơ.",
  "ai.document_service_not_configured":
    "Hệ thống AI chưa cấu hình kết nối tới dịch vụ tài liệu.",
  "ai.document_not_found":
    "Giấy tờ không thuộc danh mục tài liệu minh chứng của hồ sơ này.",
  "ai.document_access_failed":
    "Dịch vụ tài liệu không phản hồi hoặc từ chối quyền truy cập.",
  "ai.timeout": "Trợ lý phản hồi quá lâu. Vui lòng thử lại.",
  "ai.dependency_unavailable":
    "Dịch vụ trợ lý tạm thời không kết nối được. Vui lòng thử lại sau.",
  "ai.invalid_response":
    "Dịch vụ trợ lý trả dữ liệu không hợp lệ. Vui lòng thử lại sau.",
};

export function aiErrorCode(error: unknown): string | undefined {
  if (!axios.isAxiosError(error)) return undefined;
  const data = error.response?.data as
    | { code?: string; extensions?: { code?: string } }
    | undefined;
  return data?.code ?? data?.extensions?.code;
}

export function aiError(error: unknown): string {
  if (error instanceof z.ZodError)
    return "Dịch vụ AI trả dữ liệu không đúng định dạng.";
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { code?: string; title?: string; traceId?: string } | undefined;
    const code = aiErrorCode(error);
    const traceId = data?.traceId;
    const traceSuffix = traceId ? ` (Mã tra cứu hỗ trợ: ${traceId})` : '';

    if (code && aiErrorMessages[code]) return `${aiErrorMessages[code]}${traceSuffix}`;
    const status = error.response?.status;
    if (status === 401)
      return "Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại để tiếp tục.";
    if (status === 403) return `${aiErrorMessages["knowledge.forbidden"]}${traceSuffix}`;
    if (status === 409 && code === "chat.busy") return aiErrorMessages["chat.busy"];
    if (status === 429)
      return "Vui lòng chờ một chút rồi gửi lại. Bạn đang thao tác quá nhanh.";
    if (!error.response)
      return "Không kết nối được dịch vụ hỗ trợ. Vui lòng kiểm tra mạng và thử lại.";
    const title = data?.title;
    if (title?.trim()) return `${title}${traceSuffix}`;
    return `Hệ thống hỗ trợ tạm thời chưa phản hồi. Vui lòng thử lại sau.${traceSuffix}`;
  }
  return error instanceof Error
    ? error.message
    : "Không thể thực hiện thao tác.";
}

export function getAiRetryAfterSeconds(error: unknown): number | null {
  if (axios.isAxiosError(error)) {
    const header = error.response?.headers?.['retry-after'] || error.response?.headers?.['Retry-After'];
    if (header) {
      const sec = parseInt(String(header), 10);
      if (!isNaN(sec) && sec > 0) return sec;
    }
    const bodyRetry = error.response?.data?.retryAfter;
    if (bodyRetry) {
      const sec = parseInt(String(bodyRetry), 10);
      if (!isNaN(sec) && sec > 0) return sec;
    }
  }
  if (error && typeof error === 'object' && 'retryAfter' in error) {
    const sec = Number((error as { retryAfter?: unknown }).retryAfter);
    if (!isNaN(sec) && sec > 0) return sec;
  }
  return null;
}
