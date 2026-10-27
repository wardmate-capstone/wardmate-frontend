import axios from 'axios';
import { z } from 'zod';
import { api } from './index';
import { servicePath, serviceUrls } from './serviceUrls';

const aiPath = (path: string) => servicePath(serviceUrls.aiOcr, path);

export const cccdExtractionSchema = z.preprocess((val) => {
  if (!val || typeof val !== 'object') return val;
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
}, z.object({
  citizenId: z.string().nullish(),
  fullName: z.string().nullish(),
  dateOfBirth: z.string().nullish(),
  gender: z.string().nullish(),
  nationality: z.string().nullish(),
  placeOfOrigin: z.string().nullish(),
  placeOfResidence: z.string().nullish(),
  dateOfExpiry: z.string().nullish(),
  confidenceScore: z.number().nullish(),
}));

export type CccdExtractionDto = z.infer<typeof cccdExtractionSchema>;

export const chatCompletionSchema = z.object({
  conversationId: z.string(),
  answer: z.string(),
  relatedProcedures: z.array(z.unknown()).nullish(),
});

export type ChatCompletionDto = z.infer<typeof chatCompletionSchema>;

export interface ChatMessageInput {
  message: string;
  conversationId?: string | null;
  wardCode: string;
}

export const chatInputSchema = z.object({
  message: z.string().trim().min(1, 'Vui lòng nhập câu hỏi.').max(4000, 'Câu hỏi không được vượt quá 4.000 ký tự.'),
  conversationId: z.string().uuid('Mã cuộc hội thoại không hợp lệ.').refine(value => value !== '00000000-0000-0000-0000-000000000000', 'Mã cuộc hội thoại không hợp lệ.').nullish(),
  wardCode: z.string().trim().regex(/^[A-Za-z0-9_-]{1,50}$/, 'Vui lòng chọn phường/xã hợp lệ.'),
});

export const aiOcrApi = {
  extractCccd: async (frontImage: File, backImage?: File, signal?: AbortSignal): Promise<CccdExtractionDto> => {
    const data = new FormData();
    data.append('frontImage', frontImage, frontImage.name);
    if (backImage) {
      data.append('backImage', backImage, backImage.name);
    }

    try {
      const response = await api.post(aiPath('/api/v1/ai-ocr/cccd/extract'), data, {
        signal,
        suppressSessionExpiry: true,
        headers: { 'Content-Type': undefined },
      });

      return cccdExtractionSchema.parse(response.data);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        if (status === 401) {
          throw new Error('Dịch vụ AI OCR chưa được ủy quyền hoặc cấu hình xác thực trên server chưa sẵn sàng (HTTP 401). Phiên đăng nhập của bạn vẫn an toàn; vui lòng thử lại sau hoặc nhập thông tin thủ công.');
        }
        if (status === 413) {
          throw new Error('Kích thước ảnh vượt quá giới hạn cho phép (tối đa 8MB mỗi ảnh, tổng yêu cầu 17MB).');
        }
        if (status === 415) {
          throw new Error('Định dạng tệp không được hỗ trợ. Vui lòng tải ảnh CCCD định dạng PNG hoặc JPEG (HTTP 415).');
        }
        if (status === 429) {
          throw new Error('Hệ thống AI đang bận hoặc bạn thao tác quá nhanh (HTTP 429). Vui lòng đợi 1 phút trước khi quét lại.');
        }
        if (status === 404 || status === 502 || status === 503 || status === 504) {
          throw new Error(`Dịch vụ AI OCR tạm thời chưa phản hồi hoặc chưa sẵn sàng (HTTP ${status}). Vui lòng nhập thông tin vào biểu mẫu hoặc thử lại sau.`);
        }
        const serverMsg = (err.response?.data as { title?: string; detail?: string })?.title ||
                          (err.response?.data as { message?: string })?.message;
        if (serverMsg) throw new Error(serverMsg);
      }
      throw err;
    }
  },

  chat: async (input: ChatMessageInput, signal?: AbortSignal): Promise<ChatCompletionDto> => {
    const validation = chatInputSchema.safeParse(input);
    if (!validation.success) throw new Error(validation.error.issues[0].message);
    const body = validation.data;
    try {
      const response = await api.post(
        aiPath('/api/v1/ai/chat/completions'),
        { ...body, conversationId: body.conversationId ?? null },
        { signal, suppressSessionExpiry: true },
      );

      return chatCompletionSchema.parse(response.data);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        if (status === 401) {
          throw new Error('Trợ lý AI chưa được xác thực (HTTP 401). Vui lòng thử lại sau.');
        }
        if (status === 429) throw new Error('Trợ lý đang nhận quá nhiều yêu cầu. Vui lòng chờ rồi thử lại.');
        if (!status || status >= 500) throw new Error('Chưa thể kết nối trợ lý AI. Câu hỏi được giữ lại để bạn thử lại.');
        const title = err.response?.data?.title;
        if (typeof title === 'string' && title.trim()) throw new Error(title.slice(0, 500));
      }
      throw err;
    }
  },
};
