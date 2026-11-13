import { z } from 'zod';

export const GUEST_CHAT_KEY = 'wardmate_guest_chat_v2';
export const GUEST_CHAT_TTL = 24 * 60 * 60 * 1000;
const legacyMessagesKey = 'wardmate_guest_chat_messages';
const legacyConversationKey = 'wardmate_guest_conv_id';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: Date;
  /** CHAT-QUALITY-01/CHAT-FEEDBACK-01: mã câu trả lời trên server (để đánh giá) */
  messageId?: string;
  /** Chatbot đang hỏi lại để hiểu đúng nhu cầu */
  needsClarification?: boolean;
  /** Gợi ý câu hỏi tiếp theo hoặc lựa chọn trả lời nhanh (≤ 4) */
  suggestedQuestions?: string[];
  /** Đánh giá đã gửi: true 👍, false 👎 */
  feedbackHelpful?: boolean | null;
}
const messageSchema = z.object({
  id: z.string().min(1).max(200), sender: z.enum(['user', 'assistant']), text: z.string().max(64000),
  timestamp: z.string().datetime({ offset: true }),
  messageId: z.string().min(1).max(200).optional(),
  needsClarification: z.boolean().optional(),
  suggestedQuestions: z.array(z.string().max(500)).max(4).optional(),
  feedbackHelpful: z.boolean().nullable().optional(),
}).transform(message => ({ ...message, timestamp: new Date(message.timestamp) }));
const sessionSchema = z.object({
  version: z.literal(2), updatedAt: z.number().int().nonnegative(), expiresAt: z.number().int().nonnegative(),
  conversationId: z.string().min(1).max(200).nullable(), messages: z.array(messageSchema).min(1).max(100),
  wardCode: z.string().min(1).max(200).nullable().default(null),
});
export type GuestChatSession = z.infer<typeof sessionSchema>;

export function clearGuestChat() {
  try { for (const key of [GUEST_CHAT_KEY, legacyMessagesKey, legacyConversationKey]) localStorage.removeItem(key); }
  catch { /* Chat in memory remains available when browser storage is disabled. */ }
}
export function saveGuestChat(messages: ChatMessage[], conversationId: string | null, now = Date.now(), wardCode: string | null = null): GuestChatSession | null {
  if (!messages.some(message => message.sender === 'user')) { clearGuestChat(); return null; }
  const session: GuestChatSession = { version: 2, messages: messages.slice(-100), conversationId, wardCode, updatedAt: now, expiresAt: now + GUEST_CHAT_TTL };
  try {
    localStorage.setItem(GUEST_CHAT_KEY, JSON.stringify(session));
    localStorage.removeItem(legacyMessagesKey); localStorage.removeItem(legacyConversationKey);
  } catch { /* Retain the same expiration in memory even if persistence fails. */ }
  return session;
}
export function loadGuestChat(now = Date.now()): GuestChatSession | null {
  try {
    const raw = localStorage.getItem(GUEST_CHAT_KEY);
    if (raw) {
      const parsed = sessionSchema.safeParse(JSON.parse(raw));
      if (parsed.success && parsed.data.updatedAt <= now && parsed.data.expiresAt === parsed.data.updatedAt + GUEST_CHAT_TTL
        && parsed.data.expiresAt > now && parsed.data.messages.some(message => message.sender === 'user')) return parsed.data;
      clearGuestChat(); return null;
    }
    // Old versions had no expiration. Only migrate a valid, recent timestamp, never start a fresh 24h period on reload.
    const old = localStorage.getItem(legacyMessagesKey);
    if (old) {
      const messages = z.array(messageSchema).min(1).max(100).parse(JSON.parse(old));
      const updatedAt = Math.max(...messages.map(message => message.timestamp.getTime()));
      const conversationId = z.string().min(1).max(200).nullable().parse(localStorage.getItem(legacyConversationKey));
      if (updatedAt <= now && updatedAt + GUEST_CHAT_TTL > now) return saveGuestChat(messages, conversationId, updatedAt);
    }
    clearGuestChat();
  } catch { clearGuestChat(); }
  return null;
}
