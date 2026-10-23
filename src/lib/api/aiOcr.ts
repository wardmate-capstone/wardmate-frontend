import axios from 'axios';
import { z } from 'zod';
import { api } from './index';
import { servicePath, serviceUrls } from './serviceUrls';

const aiPath = (path: string) => servicePath(serviceUrls.aiOcr, path);

export const cccdExtractionSchema = z.object({
  citizenId: z.string().nullish(),
  fullName: z.string().nullish(),
  dateOfBirth: z.string().nullish(),
  gender: z.string().nullish(),
  nationality: z.string().nullish(),
  placeOfOrigin: z.string().nullish(),
  placeOfResidence: z.string().nullish(),
  dateOfExpiry: z.string().nullish(),
  confidenceScore: z.number().nullish(),
});

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
  wardCode?: string | null;
}

export const aiOcrApi = {
  extractCccd: async (frontImage: File, backImage?: File, signal?: AbortSignal): Promise<CccdExtractionDto> => {
    const data = new FormData();
    data.append('frontImage', frontImage);
    if (backImage) {
      data.append('backImage', backImage);
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
        if (status === 404 || status === 502 || status === 503) {
          throw new Error(`Dịch vụ AI OCR tạm thời chưa sẵn sàng (HTTP ${status}). Vui lòng nhập thông tin vào biểu mẫu hoặc thử lại sau.`);
        }
        const serverMsg = (err.response?.data as { title?: string; detail?: string })?.title ||
                          (err.response?.data as { message?: string })?.message;
        if (serverMsg) throw new Error(serverMsg);
      }
      throw err;
    }
  },

  chat: async (input: ChatMessageInput, signal?: AbortSignal): Promise<ChatCompletionDto> => {
    try {
      const response = await api.post(
        aiPath('/api/v1/ai/chat/completions'),
        {
          message: input.message.trim(),
          conversationId: input.conversationId || null,
          wardCode: input.wardCode || 'WARD_001',
        },
        { signal, suppressSessionExpiry: true },
      );

      return chatCompletionSchema.parse(response.data);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        if (status === 401) {
          throw new Error('Trợ lý AI chưa được xác thực (HTTP 401). Vui lòng thử lại sau.');
        }
      }
      throw err;
    }
  },
};
