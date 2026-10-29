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
            "Dịch vụ AI OCR chưa được ủy quyền hoặc cấu hình xác thực trên server chưa sẵn sàng (HTTP 401). Phiên đăng nhập của bạn vẫn an toàn; vui lòng thử lại sau hoặc nhập thông tin thủ công.",
          );
        }
        if (status === 413) {
          throw new Error(
            "Kích thước ảnh vượt quá giới hạn cho phép (tối đa 8MB mỗi ảnh, tổng yêu cầu 17MB).",
          );
        }
        if (status === 415) {
          throw new Error(
            "Định dạng tệp không được hỗ trợ. Vui lòng tải ảnh CCCD định dạng PNG hoặc JPEG (HTTP 415).",
          );
        }
        if (status === 429) {
          throw new Error(
            "Hệ thống AI đang bận hoặc bạn thao tác quá nhanh (HTTP 429). Vui lòng đợi 1 phút trước khi quét lại.",
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
        { signal, suppressSessionExpiry: true },
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
    "Dịch vụ trợ lý chưa sẵn sàng. Vui lòng thử lại sau.",
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
    const code = aiErrorCode(error);
    if (code && aiErrorMessages[code]) return aiErrorMessages[code];
    const status = error.response?.status;
    if (status === 401)
      return "Phiên đăng nhập chưa hợp lệ với dịch vụ AI (HTTP 401). Vui lòng đăng nhập lại.";
    if (status === 403) return aiErrorMessages["knowledge.forbidden"];
    if (status === 429)
      return "Bạn thao tác quá nhanh. Vui lòng đợi khoảng 1 phút rồi thử lại.";
    if (!error.response)
      return "Không kết nối được dịch vụ AI. Vui lòng kiểm tra mạng và thử lại.";
    const title = (error.response.data as { title?: string } | undefined)
      ?.title;
    if (title?.trim()) return title;
    return `Dịch vụ AI tạm thời chưa phản hồi (HTTP ${status}). Vui lòng thử lại sau.`;
  }
  return error instanceof Error
    ? error.message
    : "Không thể thực hiện thao tác.";
}
