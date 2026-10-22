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

    const response = await api.post(aiPath('/api/v1/ai-ocr/cccd/extract'), data, {
      signal,
      headers: { 'Content-Type': undefined },
    });

    return cccdExtractionSchema.parse(response.data);
  },

  chat: async (input: ChatMessageInput, signal?: AbortSignal): Promise<ChatCompletionDto> => {
    const response = await api.post(
      aiPath('/api/v1/ai/chat/completions'),
      {
        message: input.message.trim(),
        conversationId: input.conversationId || null,
        wardCode: input.wardCode || 'WARD_001',
      },
      { signal },
    );

    return chatCompletionSchema.parse(response.data);
  },
};
