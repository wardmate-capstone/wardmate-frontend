import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  PaperPlaneTilt,
  X,
  ArrowsClockwise,
  User,
  Copy,
  Check,
  ClockCounterClockwise,
  Plus,
  CaretLeft,
  SignIn,
} from '@phosphor-icons/react';
import { aiOcrApi, AiChatError, type ChatSession } from '@/lib/api/aiOcr';
import { useQuery } from '@tanstack/react-query';
import { authClient, getPublicWards } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { copyToClipboard } from '@/lib/clipboard';
import { Link, useLocation } from 'react-router-dom';
import { toast } from '@/components/ui';
import { BrandMark } from '@/components/brand/BrandMark';
import { ChatFeedbackControls } from '@/components/ai/ChatFeedbackControls';
import { clearGuestChat, GUEST_CHAT_KEY, loadGuestChat, saveGuestChat, type ChatMessage } from '@/lib/guestChatStorage';

const WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome',
  sender: 'assistant',
  text: 'Xin chào! Tôi là trợ lý hỗ trợ thủ tục hành chính WardMate.\nTôi có thể giải đáp về quy trình chuẩn bị giấy tờ, thành phần hồ sơ và thời hạn giải quyết thủ tục tại cấp Xã/Phường. Bạn đang cần chuẩn bị hồ sơ gì?',
  timestamp: new Date(),
};

const QUICK_SUGGESTIONS = [
  {
    label: 'Đăng ký kết hôn',
    query: 'Thủ tục đăng ký kết hôn tại UBND cấp xã/phường cần chuẩn bị những giấy tờ gì của cả hai bên?',
  },
  {
    label: 'Khai sinh cho con',
    query: 'Thủ tục đăng ký khai sinh lần đầu cho con gồm những giấy tờ bắt buộc nào và nộp ở đâu?',
  },
  {
    label: 'Sao y chứng thực CCCD',
    query: 'Bản sao y công chứng CCCD gắn chip có cần mang bản gốc đối chiếu không và có thời hạn bao lâu?',
  },
  {
    label: 'Quy trình tiền kiểm hồ sơ',
    query: 'Quy trình chuẩn bị và tiền kiểm hồ sơ trên WardMate trước khi ra UBND phường gồm các bước nào?',
  },
];

function formatChatTime(date: Date | string | number | undefined | null): string {
  if (!date) return '';
  try {
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

function generateGuestAssistantAnswer(query: string, wardName?: string): string {
  const q = query.toLowerCase();
  const wardText = wardName ? ` tại ${wardName}` : '';

  if (q.includes('cccd') || q.includes('căn cước') || q.includes('định danh')) {
    return `Chào bạn! Để thực hiện cấp, đổi Thẻ Căn cước công dân${wardText}, bạn cần chuẩn bị:
1. Thẻ CCCD cũ (nếu có để đổi/thu hồi).
2. Tài khoản định danh điện tử VNeID mức độ 2 hoặc giấy tờ tùy thân hợp lệ.
3. Địa điểm nộp: Bộ phận Tiếp nhận và Trả kết quả Một cửa hoặc Công an quận/huyện.
4. Thời hạn giải quyết: Thông thường từ 7 đến 15 ngày làm việc.

💡 Gợi ý: Bạn có thể Đăng nhập tài khoản WardMate để được hỗ trợ tiền kiểm tra ảnh CCCD và điền biểu mẫu tự động.`;
  }

  if (q.includes('kết hôn') || q.includes('hôn nhân') || q.includes('độc thân')) {
    return `Chào bạn! Để thực hiện thủ tục Đăng ký kết hôn${wardText}, hai bên nam nữ cần chuẩn bị:
1. Tờ khai đăng ký kết hôn (theo mẫu quy định).
2. Giấy xác nhận tình trạng hôn nhân do UBND cấp xã nơi thường trú cấp (nếu không cư trú tại địa phương nộp hồ sơ).
3. CCCD / Hộ chiếu còn thời hạn của hai bên.
4. Nơi nộp: UBND xã/phường nơi cư trú của một trong hai bên.
5. Thời hạn giải quyết: Trong ngày làm việc nếu hồ sơ đầy đủ, hợp lệ.

💡 Cả hai bạn cần cùng có mặt khi ký Giấy chứng nhận kết hôn tại UBND xã/phường.`;
  }

  if (q.includes('khai sinh') || q.includes('giấy khai sinh')) {
    return `Chào bạn! Hồ sơ Đăng ký khai sinh${wardText} gồm có:
1. Tờ khai đăng ký khai sinh (theo mẫu).
2. Bản chính Giấy chứng sinh do cơ sở y tế cấp.
3. Giấy chứng nhận kết hôn của cha mẹ (nếu đã kết hôn).
4. CCCD và giấy tờ cư trú của người đi khai sinh.
5. Thời hạn giải quyết: Trong ngày làm việc (áp dụng cả liên thông thủ tục Khai sinh - Thường trú - BHYT trẻ em).

💡 Đăng nhập WardMate để trải nghiệm dịch vụ điền tờ khai và chuẩn bị giấy tờ trực tuyến.`;
  }

  if (q.includes('chứng thực') || q.includes('sao y') || q.includes('bản sao')) {
    return `Chào bạn! Thủ tục Chứng thực bản sao từ bản chính${wardText}:
1. Mang bản chính giấy tờ, văn bản cần chứng thực.
2. Bản photocopy cần chứng thực (hoặc nhờ photocopy tại Bộ phận Một cửa).
3. Thời hạn giải quyết: Trong ngày làm việc; hồ sơ số lượng lớn có thể hẹn trả vào ngày làm việc tiếp theo.

💡 Bạn có thể quét kiểm tra chất lượng tệp bằng tính năng Tiền kiểm AI của WardMate.`;
  }

  if (q.includes('quy trình') || q.includes('tiền kiểm') || q.includes('chuẩn bị')) {
    return `Chào bạn! Quy trình chuẩn bị và tiền kiểm hồ sơ trên WardMate gồm 4 bước:
1. Chọn thủ tục hành chính cần làm tại UBND cấp xã/phường.
2. Điền thông tin vào các tờ khai trực tuyến được hướng dẫn từng trường.
3. Tải lên tệp giấy tờ đính kèm và bấm "Kiểm tra sơ bộ bằng AI" để phát hiện trước các lỗi mờ, lóa hoặc thiếu trang.
4. Nộp hồ sơ và theo dõi tiến độ phản hồi từ cán bộ Một cửa.

💡 Bạn có thể Đăng nhập để lưu tiến độ chuẩn bị hồ sơ bất kỳ lúc nào.`;
  }

  return `Chào bạn! Trợ lý ảo WardMate luôn sẵn sàng hỗ trợ tư vấn thủ tục hành chính${wardText}.
Bạn có thể tra cứu chi tiết danh mục hồ sơ, biểu mẫu và mức phí tại mục "Thủ tục hành chính" trên cổng dịch vụ.

💡 Mẹo: Bạn có thể Đăng nhập để AI ghi nhớ lịch sử hội thoại, chuẩn bị hồ sơ và tiền kiểm tra giấy tờ tự động.`;
}

const KNOWN_WARDS: Record<string, string> = {
  BEN_NGHE: 'Phường Bến Nghé',
  DA_KAO: 'Phường Đa Kao',
  WARD_001: 'Phường Bến Nghé',
  WARD_002: 'Phường Đa Kao',
};

function getWardDisplayName(code?: string | null, wardsList?: Array<{ code: string; name: string }>): string {
  if (!code) return 'Phường Bến Nghé';
  const clean = code.trim();
  const matched = wardsList?.find(w => w.code.toLowerCase() === clean.toLowerCase());
  if (matched?.name) return matched.name;
  const upper = clean.toUpperCase();
  if (KNOWN_WARDS[upper]) return KNOWN_WARDS[upper];
  return clean.replace(/_/g, ' ');
}

export const AiChatWidget: React.FC = () => {
  const userId = useAuthStore(state => state.status === 'authenticated' ? state.user?.id : undefined);
  return <ChatPanel key={userId ?? 'guest'} authenticated={Boolean(userId)} />;
};

function ChatPanel({ authenticated }: { authenticated: boolean }) {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'chat' | 'history'>('chat');
  const [initialGuest] = useState(() => authenticated ? null : loadGuestChat());
  const [messages, setMessages] = useState<ChatMessage[]>(() => initialGuest?.messages ?? [{ ...WELCOME_MESSAGE, timestamp: new Date() }]);
  const [expiresAt, setExpiresAt] = useState<number | null>(initialGuest?.expiresAt ?? null);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(initialGuest?.conversationId ?? null);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [wardCode, setWardCode] = useState(initialGuest?.wardCode ?? '');
  const wards = useQuery({
    queryKey: ['wards', 'public'],
    queryFn: getPublicWards,
    enabled: isOpen,
    staleTime: 5 * 60_000,
  });
  const requestRef = useRef<AbortController | null>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  function persistGuest(nextMessages: ChatMessage[], id: string | null, selectedWard: string) {
    setExpiresAt(saveGuestChat(nextMessages, id, Date.now(), selectedWard)?.expiresAt ?? null);
  }

  useEffect(() => {
    if (authenticated) return;
    const restoreOrExpire = () => {
      const stored = loadGuestChat();
      if (stored && stored.expiresAt > Date.now()) {
        if (stored.expiresAt !== expiresAt) {
          setMessages(stored.messages); setConversationId(stored.conversationId); setExpiresAt(stored.expiresAt);
          if (stored.wardCode) setWardCode(stored.wardCode);
        }
        return;
      }
      if (expiresAt === null || expiresAt > Date.now()) return;
      requestRef.current?.abort(); requestRef.current = null;
      setLoading(false); setMessages([{ ...WELCOME_MESSAGE, timestamp: new Date() }]);
      setConversationId(null); setExpiresAt(null); setError(null);
    };
    const timer = expiresAt === null ? undefined : window.setTimeout(restoreOrExpire, Math.max(0, expiresAt - Date.now()));
    const onStorage = (event: StorageEvent) => { if (event.key === GUEST_CHAT_KEY || event.key === null) restoreOrExpire(); };
    window.addEventListener('focus', restoreOrExpire);
    document.addEventListener('visibilitychange', restoreOrExpire);
    window.addEventListener('storage', onStorage);
    return () => {
      if (timer !== undefined) window.clearTimeout(timer);
      window.removeEventListener('focus', restoreOrExpire);
      document.removeEventListener('visibilitychange', restoreOrExpire);
      window.removeEventListener('storage', onStorage);
    };
  }, [authenticated, expiresAt]);

  useEffect(() => {
    if (!wardCode && wards.data && wards.data.length > 0) {
      setWardCode(wards.data[0].code);
    }
  }, [wards.data, wardCode]);

  // History state
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [quotaNotice, setQuotaNotice] = useState<{
    type: 'guest_quota_exceeded' | 'guest_limit_reached' | 'user_quota_exceeded';
    message: string;
  } | null>(null);

  useEffect(() => {
    if (authenticated) {
      setQuotaNotice(null);
    }
  }, [authenticated]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && viewMode === 'chat') {
      scrollToBottom();
    }
  }, [isOpen, messages, viewMode]);

  useEffect(() => {
    if (isOpen) {
      if (viewMode === 'chat') inputRef.current?.focus();
    }
  }, [isOpen, viewMode]);

  useEffect(() => () => requestRef.current?.abort(), []);

  const handleCopy = async (id: string, text: string) => {
    if (await copyToClipboard(text, 'Đã sao chép câu trả lời.')) {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text || requestRef.current) return;

    let targetWardCode = wardCode;
    if (!targetWardCode && wards.data && wards.data.length > 0) {
      targetWardCode = wards.data[0].code;
      setWardCode(targetWardCode);
    }

    if (!wards.data?.some(ward => ward.code === targetWardCode)) {
      if (authenticated) {
        setError('Vui lòng chọn phường/xã trước khi gửi câu hỏi.');
        return;
      }
      // Khách vãng lai: không chặn tư vấn nếu danh sách phường đang tải
      targetWardCode = 'WARD_001';
    }

    if (text.length > 4000) {
      setError('Câu hỏi không được vượt quá 4.000 ký tự.');
      return;
    }

    const userMessage: ChatMessage = {
      id: String(Date.now()),
      sender: 'user',
      text,
      timestamp: new Date(),
    };

    const expired = !authenticated && expiresAt !== null && expiresAt <= Date.now();
    const activeConversationId = expired ? null : conversationId;
    if (expired) { clearGuestChat(); setConversationId(null); }
    const nextMessages = [...(expired ? [{ ...WELCOME_MESSAGE, timestamp: new Date() }] : messages), userMessage];
    setMessages(nextMessages);
    if (!authenticated) persistGuest(nextMessages, activeConversationId, targetWardCode);
    setInputValue('');
    setError(null);
    setLoading(true);

    const controller = new AbortController();
    requestRef.current = controller;

    try {
      if (authenticated) {
        await authClient.restoreSession().catch(() => {});
      }

      const res = await aiOcrApi.chat({
        message: text,
        conversationId: activeConversationId,
        wardCode: targetWardCode,
      }, controller.signal);
      if (controller.signal.aborted) return;

      if (res.conversationId) {
        setConversationId(res.conversationId);
      }

      const assistantMessage: ChatMessage = {
        id: String(Date.now() + 1),
        sender: 'assistant',
        text: res.answer,
        timestamp: new Date(),
        // CHAT-QUALITY-01: hỏi lại / gợi ý câu hỏi; messageId để đánh giá câu trả lời
        messageId: res.messageId ?? undefined,
        needsClarification: res.needsClarification,
        suggestedQuestions: res.suggestedQuestions,
      };

      const finalMessages = [...nextMessages, assistantMessage];
      setMessages(finalMessages);
      if (!authenticated) persistGuest(finalMessages, res.conversationId || activeConversationId, targetWardCode);
    } catch (err: unknown) {
      if (controller.signal.aborted) return;
      const msg = err instanceof Error ? err.message : '';
      const code = err instanceof AiChatError ? err.code : undefined;
      const status = err instanceof AiChatError ? err.status : undefined;

      const isGuestQuotaExceeded =
        code === 'ai.guest_quota_exceeded' ||
        msg.includes('chưa đăng nhập') ||
        (status === 429 && !authenticated && (msg.includes('lượt') || msg.includes('hôm nay')));

      const isGuestLimitReached = code === 'ai.guest_limit_reached';

      const isUserQuotaExceeded =
        code === 'ai.quota_exceeded' ||
        code === 'ai.daily_limit_reached' ||
        (status === 429 && authenticated && (msg.includes('30 lượt') || msg.includes('hôm nay')));

      const isTooManyRequests =
        (status === 429 || code === 'ai.provider_busy') &&
        !isGuestQuotaExceeded &&
        !isGuestLimitReached &&
        !isUserQuotaExceeded;

      if (isGuestQuotaExceeded) {
        const quotaText =
          msg.includes('Bạn đã hỏi') || msg.includes('đăng nhập')
            ? msg
            : 'Bạn đã hỏi 10 lượt hôm nay khi chưa đăng nhập. Vui lòng đăng nhập để hỏi tiếp hoặc thử lại vào ngày mai.';
        const assistantMessage: ChatMessage = {
          id: String(Date.now() + 1),
          sender: 'assistant',
          text: `${quotaText}\n\n💡 Đăng nhập tài khoản công dân để được hỏi thêm (30 lượt mỗi ngày), lưu lại lịch sử tư vấn và kiểm tra sơ bộ giấy tờ bằng AI.`,
          timestamp: new Date(),
        };
        const finalMessages = [...nextMessages, assistantMessage];
        setMessages(finalMessages);
        setQuotaNotice({
          type: 'guest_quota_exceeded',
          message: quotaText,
        });
        if (!authenticated) persistGuest(finalMessages, activeConversationId, targetWardCode);
        return;
      }

      if (isGuestLimitReached) {
        const limitText =
          msg.includes('Lượt hỏi đáp cho khách') || msg.includes('hết')
            ? msg
            : 'Lượt hỏi đáp cho khách hôm nay đã hết. Vui lòng đăng nhập để tiếp tục hoặc thử lại vào ngày mai.';
        const assistantMessage: ChatMessage = {
          id: String(Date.now() + 1),
          sender: 'assistant',
          text: `${limitText}\n\n💡 Bạn có thể đăng nhập tài khoản công dân để tiếp tục gửi câu hỏi tới trợ lý AI.`,
          timestamp: new Date(),
        };
        const finalMessages = [...nextMessages, assistantMessage];
        setMessages(finalMessages);
        setQuotaNotice({
          type: 'guest_limit_reached',
          message: limitText,
        });
        if (!authenticated) persistGuest(finalMessages, activeConversationId, targetWardCode);
        return;
      }

      if (isUserQuotaExceeded) {
        const userLimitText = msg.includes('30 lượt')
          ? msg
          : 'Bạn đã dùng hết 30 lượt AI hôm nay. Vui lòng thử lại vào ngày mai.';
        const assistantMessage: ChatMessage = {
          id: String(Date.now() + 1),
          sender: 'assistant',
          text: `${userLimitText}\n\nHạn mức hỏi đáp sẽ được làm mới tự động vào 00:00 ngày mai.`,
          timestamp: new Date(),
        };
        const finalMessages = [...nextMessages, assistantMessage];
        setMessages(finalMessages);
        setQuotaNotice({
          type: 'user_quota_exceeded',
          message: userLimitText,
        });
        return;
      }

      if (isTooManyRequests) {
        setMessages(prev => prev.filter(message => message.id !== userMessage.id));
        setInputValue(text);
        setError(msg || 'Hệ thống AI đang quá tải hoặc bạn đang gửi tin nhắn quá nhanh. Vui lòng chờ giây lát rồi gửi lại.');
        return;
      }

      const isOfflineOrUnavailable =
        msg.includes('503') ||
        msg.includes('chat.database_unavailable') ||
        msg.includes('ai.provider_unavailable') ||
        msg.includes('Database chat') ||
        msg.includes('Failed to fetch') ||
        msg.includes('NetworkError') ||
        msg.includes('Không kết nối');

      if (!authenticated && isOfflineOrUnavailable) {
        const selectedWard = wards.data?.find(w => w.code === targetWardCode);
        const fallbackAnswer = generateGuestAssistantAnswer(text, selectedWard?.name);
        const assistantMessage: ChatMessage = {
          id: String(Date.now() + 1),
          sender: 'assistant',
          text: `${fallbackAnswer}\n\n*(Lưu ý: Trợ lý AI đang tạm gián đoạn. Dưới đây là hướng dẫn tham khảo, không phải câu trả lời trực tiếp của AI.)*`,
          timestamp: new Date(),
        };
        const finalMessages = [...nextMessages, assistantMessage];
        setMessages(finalMessages);
        if (!authenticated) persistGuest(finalMessages, activeConversationId, targetWardCode);
        return;
      }
      setMessages(prev => prev.filter(message => message.id !== userMessage.id));
      setInputValue(text);
      setError(msg || 'Có lỗi khi kết nối trợ lý AI. Vui lòng thử lại sau.');
    } finally {
      if (requestRef.current === controller) {
        requestRef.current = null;
        setLoading(false);
      }
    }
  };

  const handleResetConversation = () => {
    requestRef.current?.abort();
    requestRef.current = null;
    setLoading(false);
    setConversationId(null);
    setError(null);
    setQuotaNotice(null);
    setViewMode('chat');
    setMessages([WELCOME_MESSAGE]);
    if (!authenticated) { clearGuestChat(); setExpiresAt(null); }
  };

  const loadSessions = useCallback(async () => {
    if (!authenticated) return;
    setLoadingSessions(true);
    setSessionError(null);
    try {
      const res = await aiOcrApi.chatSessions(1, 20);
      setSessions(res.items);
    } catch {
      setSessionError('Chưa tải được danh sách phiên hội thoại.');
    } finally {
      setLoadingSessions(false);
    }
  }, [authenticated]);

  const handleToggleHistory = () => {
    if (viewMode === 'history') {
      setViewMode('chat');
    } else {
      setViewMode('history');
      void loadSessions();
    }
  };

  const handleSelectSession = async (session: ChatSession) => {
    setLoading(true);
    setError(null);
    try {
      const res = await aiOcrApi.chatMessages(session.id, 1, 50);
      const mapped: ChatMessage[] = res.items.map(m => {
        const role = (m.role || '').trim().toLowerCase();
        const isAssistant = role === 'assistant' || role === 'model' || role === 'bot';
        return {
          id: m.id,
          sender: isAssistant ? 'assistant' : 'user',
          text: m.content,
          timestamp: new Date(m.createdAt),
          ...(isAssistant ? {
            messageId: m.id,
            needsClarification: m.needsClarification,
            suggestedQuestions: m.suggestedQuestions,
            feedbackHelpful: m.feedbackHelpful ?? null,
          } : {}),
        };
      });

      setMessages(
        mapped.length > 0
          ? mapped
          : [
              {
                id: 'empty',
                sender: 'assistant',
                text: 'Phiên này chưa có tin nhắn lưu lại.',
                timestamp: new Date(session.createdAt),
              },
            ]
      );
      setConversationId(session.id);
      if (session.wardCode) {
        const matched = wards.data?.find(w => w.code.toLowerCase() === session.wardCode.toLowerCase());
        setWardCode(matched ? matched.code : session.wardCode);
      }
      setViewMode('chat');
      requestAnimationFrame(() => scrollToBottom());
    } catch {
      setError('Không thể tải nội dung phiên hội thoại này.');
    } finally {
      setLoading(false);
    }
  };

  const hasUserMessages = messages.some((m) => m.sender === 'user');
  // Nút gợi ý chỉ hiện ở câu trả lời mới nhất để khung chat gọn và người dân không bấm nhầm gợi ý cũ
  const lastAssistantId = [...messages].reverse().find((m) => m.sender === 'assistant')?.id;
  const markRated = (id: string, helpful: boolean) => {
    const next = messages.map((m) => (m.id === id ? { ...m, feedbackHelpful: helpful } : m));
    setMessages(next);
    if (!authenticated) persistGuest(next, conversationId, wardCode || 'WARD_001');
  };

  return (
    <div role="region" aria-label="Trợ lý hỗ trợ thủ tục" className="fixed bottom-3 right-3 z-40 sm:bottom-6 sm:right-6" onKeyDown={event => {
      if (event.key === 'Escape' && isOpen) {
        event.stopPropagation();
        setIsOpen(false);
        requestAnimationFrame(() => toggleRef.current?.focus());
      }
    }}>
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          ref={toggleRef}
          type="button"
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2.5 rounded-full bg-red-800 p-3 sm:px-4 text-white shadow-xl hover:bg-red-900 hover:scale-105 active:scale-95 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-red-200"
          aria-label="Mở trợ lý hỗ trợ thủ tục"
        >
          <div className="relative grid size-7 place-items-center rounded-full bg-white/20">
            <BrandMark size={28} className="size-7 object-contain" />
            <span className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full bg-emerald-400 ring-2 ring-red-800" />
          </div>
          <span className="hidden text-xs font-bold tracking-wide sm:inline">Hỏi Đáp AI</span>
        </button>
      )}

      {/* Floating Chat Window */}
      {isOpen && (
        <section
          aria-label="Cửa sổ hội thoại trợ lý ảo"
          className="flex h-[min(520px,calc(100dvh-24px))] w-[calc(100vw-24px)] max-w-[400px] flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-red-900 bg-red-800 px-4 py-3 text-white">
            <div className="flex items-center gap-2.5">
              {viewMode === 'history' ? (
                <button
                  type="button"
                  onClick={() => setViewMode('chat')}
                  className="grid size-7 place-items-center rounded-md hover:bg-white/10 text-white transition-colors"
                  title="Quay lại cuộc trò chuyện"
                  aria-label="Quay lại cuộc trò chuyện"
                >
                  <CaretLeft size={18} weight="bold" />
                </button>
              ) : (
                <div className="relative grid size-8 place-items-center rounded-full bg-white/15 text-white">
                  <BrandMark size={28} className="size-7 object-contain" />
                  <span className="absolute bottom-0 right-0 size-2 rounded-full bg-emerald-400 ring-1.5 ring-red-800" />
                </div>
              )}
              <div>
                <h3 className="text-xs font-bold leading-tight">
                  {viewMode === 'history' ? 'Lịch sử hội thoại' : 'Trợ lý Một cửa'}
                </h3>
                <span className="text-[10px] text-red-200 flex items-center gap-1">
                  <span className="size-1.5 rounded-full bg-emerald-400" />
                  {viewMode === 'history' ? 'Các phiên đã trao đổi' : 'AI hỗ trợ chuẩn bị hồ sơ'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={authenticated ? handleToggleHistory : () => toast.info('Vui lòng đăng nhập để lưu trữ và xem lại các phiên hội thoại trước đó.')}
                className={`grid size-7 place-items-center rounded-md transition-colors ${
                  viewMode === 'history'
                    ? 'bg-white/20 text-white'
                    : 'hover:bg-white/10 text-red-100'
                }`}
                title={authenticated ? (viewMode === 'history' ? 'Quay lại trò chuyện' : 'Xem lịch sử hội thoại') : 'Đăng nhập để xem lịch sử'}
                aria-label="Lịch sử hội thoại"
              >
                <ClockCounterClockwise size={16} />
              </button>
              {viewMode === 'chat' && (
                <button
                  type="button"
                  onClick={handleResetConversation}
                  className="grid size-7 place-items-center rounded-md hover:bg-white/10 text-red-100 transition-colors"
                  title="Tạo cuộc trò chuyện mới"
                  aria-label="Tạo cuộc trò chuyện mới"
                >
                  <Plus size={17} weight="bold" />
                </button>
              )}
              <button
                type="button"
                onClick={() => { setIsOpen(false); requestAnimationFrame(() => toggleRef.current?.focus()); }}
                className="grid size-7 place-items-center rounded-md hover:bg-white/10 text-red-100 transition-colors"
                title="Đóng cửa sổ chat"
                aria-label="Đóng cửa sổ chat"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Body Content */}
          {viewMode === 'history' ? (
            /* History View */
            <div className="min-h-0 flex-1 overflow-y-auto p-3.5 space-y-2.5 bg-slate-50 text-xs">
              <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                <span className="font-semibold text-slate-700">Các phiên gần đây</span>
                <button
                  type="button"
                  onClick={handleResetConversation}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-700 hover:text-red-800"
                >
                  <Plus size={13} weight="bold" />
                  <span>Phiên mới</span>
                </button>
              </div>

              {loadingSessions && (
                <div className="py-8 text-center text-slate-500">
                  <ArrowsClockwise size={20} className="animate-spin mx-auto text-red-700 mb-2" />
                  <span>Đang tải danh sách phiên...</span>
                </div>
              )}

              {sessionError && (
                <div className="p-3 rounded-xl bg-red-50 text-red-700 border border-red-200">
                  {sessionError}
                </div>
              )}

              {!loadingSessions && !sessionError && sessions.length === 0 && (
                <div className="py-8 text-center text-slate-500">
                  <p>Chưa có phiên trò chuyện nào được lưu.</p>
                  <button
                    type="button"
                    onClick={handleResetConversation}
                    className="mt-2 text-xs font-semibold text-red-700 hover:underline"
                  >
                    Bắt đầu cuộc trò chuyện đầu tiên
                  </button>
                </div>
              )}

              {!loadingSessions && sessions.map(s => {
                const isCurrent = s.id === conversationId;
                const dateStr = new Date(s.createdAt).toLocaleString('vi-VN', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                });
                return (
                  <button
                    key={s.id}
                    type="button"
                    disabled={loading}
                    onClick={() => void handleSelectSession(s)}
                    className={`w-full text-left p-3 rounded-xl border transition-all ${
                      isCurrent
                        ? 'border-red-600 bg-red-50/60 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-slate-900">{dateStr}</span>
                      {isCurrent && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800">
                          Đang mở
                        </span>
                      )}
                    </div>
                    <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-500">
                      <span className="font-medium text-slate-700 flex items-center gap-1">
                        <span className="text-red-700">📍</span>
                        <span>{getWardDisplayName(s.wardCode, wards.data)}</span>
                      </span>
                      <span className="text-red-700 font-semibold hover:underline">Mở lại →</span>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            /* Normal Chat View */
            <>
              <div className="border-b border-slate-200 px-3 py-2 text-xs bg-slate-50/40">
                <label htmlFor="ai-chat-ward" className="font-semibold text-slate-700">Phường/xã cần tư vấn</label>
                <select
                  id="ai-chat-ward"
                  value={wardCode}
                  disabled={loading || wards.isPending || wards.isError}
                  onChange={event => { setWardCode(event.target.value); handleResetConversation(); }}
                  className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-2 text-slate-800 focus:outline-red-700"
                >
                  <option value="">Chọn phường/xã</option>
                  {wards.data?.map(ward => <option key={ward.id} value={ward.code}>{ward.name}</option>)}
                </select>
                {wards.isPending && <p role="status" className="text-[11px] text-slate-500 mt-1">Đang tải phường/xã...</p>}
                {wards.isError && <p role="alert" className="text-[11px] text-red-700 mt-1">Chưa tải được phường/xã. <button type="button" className="underline font-semibold" onClick={() => void wards.refetch()}>Thử lại</button></p>}
                {!wards.isPending && !wards.isError && !wards.data?.length && <p role="status" className="text-[11px] text-slate-500 mt-1">Chưa có phường/xã để tư vấn.</p>}
              </div>

              {/* Messages List */}
              <div role="log" aria-label="Nội dung hội thoại" aria-live="polite" className="min-h-0 flex-1 overflow-y-auto p-3.5 space-y-3 bg-slate-50/60 text-xs">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.sender === 'assistant' && (
                      <div
                        className="grid size-6 shrink-0 place-items-center rounded-full bg-red-800 text-white shadow-xs ring-1 ring-red-900/20 mt-0.5"
                        title="Cán bộ hỗ trợ Một cửa"
                      >
                        <BrandMark size={20} className="size-5 object-contain" />
                      </div>
                    )}
                    <div
                      className={`max-w-[85%] rounded-2xl p-3 leading-relaxed whitespace-pre-wrap break-words ${
                        msg.sender === 'user'
                          ? 'bg-red-800 text-white rounded-br-xs'
                          : 'bg-white text-slate-800 border border-slate-200 shadow-2xs rounded-bl-xs'
                      }`}
                    >
                      <p>{msg.text}</p>
                      {msg.sender === 'user' && msg.timestamp && (
                        <div className="mt-1 text-right text-[10px] text-red-200/90 font-medium select-none">
                          {formatChatTime(msg.timestamp)}
                        </div>
                      )}

                      {/* Quick Suggestions */}
                      {msg.id === 'welcome' && !hasUserMessages && (
                        <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-1.5">
                          <p className="text-[10px] font-semibold text-slate-500">Gợi ý câu hỏi phổ biến:</p>
                          <div className="flex flex-col gap-1.5">
                            {QUICK_SUGGESTIONS.map((s, idx) => (
                              <button
                                key={idx}
                                type="button"
                                disabled={loading}
                                onClick={() => void handleSend(s.query)}
                                className="text-left text-[11px] text-red-800 bg-red-50/70 hover:bg-red-100/80 border border-red-100 rounded-lg px-2.5 py-1.5 transition-colors font-medium"
                              >
                                • {s.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* CHAT-QUALITY-01: lựa chọn trả lời nhanh khi chatbot hỏi lại, hoặc câu hỏi tiếp theo */}
                      {msg.sender === 'assistant' && msg.id === lastAssistantId && !!msg.suggestedQuestions?.length && (
                        <div className="mt-3 space-y-1.5 border-t border-slate-100 pt-2.5 whitespace-normal">
                          <p className="text-[10px] font-semibold text-slate-500">
                            {msg.needsClarification ? 'Chọn trường hợp của bạn:' : 'Câu hỏi tiếp theo:'}
                          </p>
                          <div className="flex flex-col gap-1.5">
                            {msg.suggestedQuestions.map((question) => (
                              <button
                                key={question}
                                type="button"
                                disabled={loading}
                                onClick={() => void handleSend(question)}
                                className="rounded-lg border border-red-100 bg-red-50/70 px-2.5 py-1.5 text-left text-[11px] font-medium text-red-800 transition-colors hover:bg-red-100/80 disabled:opacity-60"
                              >
                                {question}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Assistant message footer: timestamp & copy */}
                      {msg.sender === 'assistant' && (
                        <div className="mt-2 flex flex-wrap items-center justify-between gap-1 border-t border-slate-100 pt-1 text-[10px] text-slate-400 whitespace-normal">
                          <span className="select-none">{formatChatTime(msg.timestamp)}</span>
                          {msg.id !== 'welcome' ? (
                            <button
                              type="button"
                              onClick={() => void handleCopy(msg.id, msg.text)}
                              className="inline-flex items-center gap-1 hover:text-slate-700 font-medium transition-colors"
                              title="Sao chép câu trả lời"
                            >
                              {copiedId === msg.id ? (
                                <>
                                  <Check size={12} className="text-emerald-600" />
                                  <span className="text-emerald-600 font-bold">Đã sao chép</span>
                                </>
                              ) : (
                                <>
                                  <Copy size={12} />
                                  <span>Sao chép</span>
                                </>
                              )}
                            </button>
                          ) : <span />}
                          {/* CHAT-FEEDBACK-01: 👍/👎 dưới câu trả lời có mã trên server */}
                          {msg.messageId && (
                            <ChatFeedbackControls
                              messageId={msg.messageId}
                              value={msg.feedbackHelpful}
                              onRated={(helpful) => markRated(msg.id, helpful)}
                            />
                          )}
                        </div>
                      )}
                    </div>
                    {msg.sender === 'user' && (
                      <div className="grid size-6 shrink-0 place-items-center rounded-full bg-slate-200 text-slate-700 mt-0.5">
                        <User size={13} weight="bold" />
                      </div>
                    )}
                  </div>
                ))}

                {loading && (
                  <div className="flex gap-2 justify-start items-center">
                    <div
                      className="grid size-6 shrink-0 place-items-center rounded-full bg-red-800 text-white shadow-xs ring-1 ring-red-900/20"
                      title="Cán bộ hỗ trợ Một cửa"
                    >
                      <BrandMark size={20} className="size-5 object-contain" />
                    </div>
                    <div className="rounded-2xl rounded-bl-xs bg-white border border-slate-200 p-2.5 shadow-2xs flex items-center gap-1.5">
                      <span className="size-1.5 rounded-full bg-red-700 animate-bounce" />
                      <span className="size-1.5 rounded-full bg-red-700 animate-bounce [animation-delay:0.2s]" />
                      <span className="size-1.5 rounded-full bg-red-700 animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                )}

                {error && (
                  <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-2.5 text-[11px] text-red-800">
                    {error}
                  </div>
                )}

                {quotaNotice && (
                  <div role="status" className="rounded-xl border border-amber-200 bg-amber-50/90 p-3 space-y-2.5 shadow-2xs">
                    <div className="flex items-start gap-2.5">
                      <div className="size-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
                        <SignIn size={16} weight="bold" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-bold text-amber-950">
                          {quotaNotice.type === 'guest_quota_exceeded'
                            ? 'Đã đạt giới hạn 10 câu hỏi miễn phí cho khách'
                            : quotaNotice.type === 'guest_limit_reached'
                            ? 'Hệ thống đã đạt giới hạn lượt hỏi cho khách'
                            : 'Đã dùng hết 30 lượt hỏi hôm nay'}
                        </h4>
                        <p className="mt-0.5 text-[11px] leading-relaxed text-amber-900/90">
                          {quotaNotice.type === 'guest_quota_exceeded' || quotaNotice.type === 'guest_limit_reached'
                            ? 'Đăng nhập tài khoản công dân để được hỏi thêm (30 lượt mỗi ngày), lưu lại lịch sử tư vấn và kiểm tra sơ bộ giấy tờ bằng AI.'
                            : 'Hạn mức hỏi đáp sẽ được làm mới tự động vào ngày mai.'}
                        </p>
                      </div>
                    </div>
                    {(quotaNotice.type === 'guest_quota_exceeded' || quotaNotice.type === 'guest_limit_reached') && (
                      <div className="pt-0.5 flex flex-wrap items-center gap-2">
                        <Link
                          to={'/dang-nhap?returnTo=' + encodeURIComponent(location.pathname + location.search + location.hash)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-800 text-white rounded-lg text-xs font-semibold hover:bg-red-900 transition-colors shadow-2xs"
                        >
                          <SignIn size={13} weight="bold" />
                          <span>Đăng nhập ngay</span>
                        </Link>
                        <Link
                          to="/dang-ky"
                          className="text-xs text-red-800 font-semibold hover:underline px-2 py-1"
                        >
                          Tạo tài khoản mới
                        </Link>
                      </div>
                    )}
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Minimalist Input Box */}
              {quotaNotice && (quotaNotice.type === 'guest_quota_exceeded' || quotaNotice.type === 'guest_limit_reached') ? (
                <div className="border-t border-amber-200 bg-amber-50/70 p-3 space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-amber-950">Đã hết 10 câu hỏi miễn phí hôm nay</p>
                      <p className="text-[11px] text-amber-900/90 leading-snug">Vui lòng đăng nhập để tiếp tục trò chuyện.</p>
                    </div>
                    <Link
                      to={'/dang-nhap?returnTo=' + encodeURIComponent(location.pathname + location.search + location.hash)}
                      className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-800 text-white rounded-lg text-xs font-semibold hover:bg-red-900 transition-colors shadow-2xs"
                    >
                      <SignIn size={14} weight="bold" />
                      <span>Đăng nhập</span>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="border-t border-slate-200 bg-white p-2.5 space-y-1.5">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      void handleSend();
                    }}
                    className="flex items-center gap-2"
                  >
                    <input
                      ref={inputRef}
                      type="text"
                      aria-label="Câu hỏi cho trợ lý"
                      maxLength={4000}
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder={loading ? 'Trợ lý đang suy nghĩ và trả lời...' : 'Nhập câu hỏi cần tư vấn...'}
                      disabled={loading}
                      className="min-w-0 min-h-11 flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-100 disabled:bg-slate-100 disabled:text-slate-500"
                    />
                    <button
                      type="submit"
                      disabled={!inputValue.trim() || loading}
                      className="grid size-11 shrink-0 place-items-center rounded-xl bg-red-800 text-white disabled:opacity-40 hover:bg-red-900 transition-colors shadow-2xs"
                      aria-label="Gửi tin nhắn"
                    >
                      {loading ? (
                        <ArrowsClockwise size={15} className="animate-spin" />
                      ) : (
                        <PaperPlaneTilt size={15} weight="fill" />
                      )}
                    </button>
                  </form>
                  {!authenticated ? (
                    <p className="text-[10px] text-slate-500 text-center flex flex-wrap items-center justify-center gap-1">
                      <span className="inline-block px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-medium">Chế độ khách · Lưu trên trình duyệt trong 24 giờ</span>
                      <span>·</span>
                      <Link
                        to={'/dang-nhap?returnTo=' + encodeURIComponent(location.pathname + location.search + location.hash)}
                        className="text-red-700 font-semibold hover:underline"
                      >
                        Đăng nhập
                      </Link>
                      <span>để lưu lịch sử hỏi đáp và kiểm tra sơ bộ giấy tờ bằng AI</span>
                    </p>
                  ) : (
                    <p className="text-[10px] text-slate-400 text-center">
                      Thông tin tư vấn mang tính tham khảo hướng dẫn chuẩn bị hồ sơ.
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </section>
      )}
    </div>
  );
}
