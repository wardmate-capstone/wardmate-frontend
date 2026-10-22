import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  ChatTeardropDots,
  PaperPlaneTilt,
  X,
  Sparkle,
  ArrowsClockwise,
  User,
  WarningCircle,
  Copy,
  Check,
  Lightbulb,
  CaretRight,
} from '@phosphor-icons/react';
import { aiOcrApi } from '@/lib/api/aiOcr';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: Date;
}

type PromptCategory = 'ALL' | 'VITAL' | 'MARRIAGE' | 'AUTH' | 'PROC';

interface PromptItem {
  id: string;
  category: PromptCategory;
  label: string;
  query: string;
  badge?: string;
}

const PROMPT_CATEGORIES: Array<{ key: PromptCategory; label: string }> = [
  { key: 'ALL', label: 'Tất cả' },
  { key: 'VITAL', label: 'Hộ tịch' },
  { key: 'MARRIAGE', label: 'Hôn nhân' },
  { key: 'AUTH', label: 'Chứng thực' },
  { key: 'PROC', label: 'Quy trình' },
];

const CURATED_PROMPTS: PromptItem[] = [
  {
    id: 'p-1',
    category: 'VITAL',
    label: 'Khai sinh cho con',
    query: 'Thủ tục đăng ký khai sinh lần đầu cho con gồm những giấy tờ bắt buộc nào và nộp ở đâu?',
    badge: 'Phổ biến',
  },
  {
    id: 'p-2',
    category: 'VITAL',
    label: 'Khai tử đúng hạn',
    query: 'Thủ tục đăng ký khai tử cần mang theo các loại giấy tờ nào và thời hạn quy định là bao lâu?',
    badge: 'Cần gấp',
  },
  {
    id: 'p-3',
    category: 'VITAL',
    label: 'Cấp trích lục khai sinh',
    query: 'Xin cấp bản sao trích lục khai sinh bị mất cần giấy tờ gì, thời gian xử lý và lệ phí bao nhiêu?',
  },
  {
    id: 'p-4',
    category: 'MARRIAGE',
    label: 'Đăng ký kết hôn',
    query: 'Hồ sơ đăng ký kết hôn tại UBND cấp xã/phường cần chuẩn bị những giấy tờ gì của cả hai bên?',
    badge: 'Phổ biến',
  },
  {
    id: 'p-5',
    category: 'MARRIAGE',
    label: 'Xác nhận độc thân',
    query: 'Xin cấp Giấy xác nhận tình trạng hôn nhân (độc thân) cần điều kiện gì và giải quyết trong bao lâu?',
  },
  {
    id: 'p-6',
    category: 'AUTH',
    label: 'Sao y chứng thực CCCD',
    query: 'Bản sao y công chứng CCCD gắn chip có cần mang bản gốc đối chiếu không và có thời hạn bao lâu?',
    badge: 'Hay gặp',
  },
  {
    id: 'p-7',
    category: 'AUTH',
    label: 'Chứng thực chữ ký ủy quyền',
    query: 'Thủ tục chứng thực chữ ký trên giấy ủy quyền cần lưu ý những điều kiện gì tại UBND phường?',
  },
  {
    id: 'p-8',
    category: 'PROC',
    label: 'Quy trình tiền kiểm hồ sơ',
    query: 'Quy trình chuẩn bị và tiền kiểm hồ sơ trên WardMate trước khi ra UBND phường gồm các bước nào?',
    badge: 'Hướng dẫn',
  },
  {
    id: 'p-9',
    category: 'PROC',
    label: 'Giấy tờ sẵn sàng nộp phường',
    query: 'Khi hồ sơ tiền kiểm chuyển sang trạng thái "Giấy tờ sẵn sàng", tôi cần mang gì đến nộp tại Bộ phận Một cửa?',
  },
  {
    id: 'p-10',
    category: 'PROC',
    label: 'Khắc phục khi Cần bổ sung',
    query: 'Nếu hồ sơ bị cán bộ yêu cầu bổ sung chỉnh sửa (Need Revision), tôi cần thao tác cập nhật lại như thế nào?',
  },
];

export const AiChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: 'Xin chào! Tôi là trợ lý ảo hỗ trợ thủ tục hành chính WardMate.\nTôi có thể giải đáp về quy trình chuẩn bị giấy tờ, thành phần hồ sơ và thời hạn giải quyết thủ tục tại cấp Xã/Phường. Bạn đang cần chuẩn bị hồ sơ gì?',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Prompt Library Drawer / Toggle
  const [showPromptLibrary, setShowPromptLibrary] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<PromptCategory>('ALL');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredPrompts = useMemo(() => {
    if (selectedCategory === 'ALL') return CURATED_PROMPTS;
    return CURATED_PROMPTS.filter((p) => p.category === selectedCategory);
  }, [selectedCategory]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      inputRef.current?.focus();
    }
  }, [isOpen, messages]);

  const handleCopy = (id: string, text: string) => {
    void navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text || loading) return;

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

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setError(null);
    setLoading(true);

    try {
      const res = await aiOcrApi.chat({
        message: text,
        conversationId,
        wardCode: 'WARD_001',
      });

      if (res.conversationId) {
        setConversationId(res.conversationId);
      }

      const assistantMessage: ChatMessage = {
        id: String(Date.now() + 1),
        sender: 'assistant',
        text: res.answer,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Có lỗi khi kết nối trợ lý AI. Vui lòng thử lại sau.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResetConversation = () => {
    setConversationId(null);
    setError(null);
    setShowPromptLibrary(true);
    setMessages([
      {
        id: String(Date.now()),
        sender: 'assistant',
        text: 'Đã tạo cuộc hội thoại mới. Bạn có thể chọn câu hỏi mẫu bên dưới hoặc nhập nội dung cần tư vấn.',
        timestamp: new Date(),
      },
    ]);
  };

  return (
    <aside aria-label="Trợ lý ảo hỗ trợ thủ tục" className="fixed bottom-6 right-6 z-40">
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2.5 rounded-full bg-red-800 px-4 py-3 text-white shadow-xl hover:bg-red-900 hover:scale-105 active:scale-95 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-red-200"
          aria-label="Mở trợ lý ảo AI hỏi đáp thủ tục"
        >
          <div className="relative">
            <ChatTeardropDots size={24} weight="fill" />
            <span className="absolute -top-1 -right-1 size-2.5 rounded-full bg-gold-400 animate-pulse" />
          </div>
          <span className="text-xs font-bold tracking-wide">Hỏi đáp AI</span>
        </button>
      )}

      {/* Floating Chat Window */}
      {isOpen && (
        <section
          aria-label="Cửa sổ hội thoại trợ lý ảo"
          className="flex h-[560px] w-[360px] sm:w-[420px] flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 bg-linear-to-r from-red-800 to-red-900 px-4 py-3 text-white">
            <div className="flex items-center gap-2.5">
              <div className="grid size-8 place-items-center rounded-lg bg-white/10 text-gold-300">
                <Sparkle size={18} weight="fill" />
              </div>
              <div>
                <h3 className="text-xs font-bold leading-tight flex items-center gap-1.5">
                  <span>Trợ lý thủ tục WardMate</span>
                  <span className="text-[9px] font-semibold bg-gold-400 text-red-950 px-1.5 py-0.2 rounded-full">
                    AI Tư vấn
                  </span>
                </h3>
                <span className="text-[10px] text-red-200 block">Hỗ trợ tiền kiểm & tra cứu 24/7</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleResetConversation}
                className="grid size-7 place-items-center rounded-md hover:bg-white/10 text-red-100 transition-colors"
                title="Làm mới cuộc trò chuyện"
                aria-label="Làm mới cuộc trò chuyện"
              >
                <ArrowsClockwise size={16} />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="grid size-7 place-items-center rounded-md hover:bg-white/10 text-red-100 transition-colors"
                title="Đóng cửa sổ chat"
                aria-label="Đóng cửa sổ chat"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Legal disclaimer */}
          <div className="bg-amber-50 px-3 py-1.5 text-[10px] text-amber-800 border-b border-amber-100 flex items-center justify-between gap-1.5">
            <div className="flex items-center gap-1.5 min-w-0">
              <WarningCircle size={14} className="shrink-0 text-amber-600" />
              <span className="truncate">Tư vấn tiền kiểm chuẩn bị hồ sơ. Không gửi mật khẩu hoặc CCCD.</span>
            </div>
            <button
              type="button"
              onClick={() => setShowPromptLibrary((prev) => !prev)}
              className="text-[10px] font-bold text-red-800 hover:underline shrink-0 flex items-center gap-0.5"
            >
              <Lightbulb size={12} weight="fill" />
              <span>{showPromptLibrary ? 'Ẩn mẫu' : 'Gợi ý'}</span>
            </button>
          </div>

          {/* Prompt Library Drawer (Inspired by prompts.chat) */}
          {showPromptLibrary && (
            <div className="border-b border-slate-200 bg-slate-50/80 p-2.5 transition-all">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                  <Lightbulb size={12} className="text-amber-500" weight="fill" />
                  <span>Kho câu hỏi mẫu hành chính</span>
                </span>
                <span className="text-[9px] text-slate-400">Nhấn để gửi ngay</span>
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
                {PROMPT_CATEGORIES.map((cat) => (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => setSelectedCategory(cat.key)}
                    className={`text-[10px] px-2 py-0.5 rounded-full font-medium whitespace-nowrap transition-colors ${
                      selectedCategory === cat.key
                        ? 'bg-red-800 text-white font-bold shadow-2xs'
                        : 'bg-white text-slate-600 hover:bg-slate-200/70 border border-slate-200/80'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Prompt Chips Carousel */}
              <div className="mt-1.5 flex flex-col gap-1 max-h-24 overflow-y-auto pr-1">
                {filteredPrompts.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    disabled={loading}
                    onClick={() => void handleSend(p.query)}
                    className="flex items-center justify-between text-left text-[11px] text-slate-700 bg-white hover:bg-red-50 hover:text-red-900 hover:border-red-200 border border-slate-200/80 rounded-lg px-2.5 py-1.5 transition-colors group shadow-2xs"
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      {p.badge && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded-full font-bold bg-red-100 text-red-800 shrink-0">
                          {p.badge}
                        </span>
                      )}
                      <span className="font-semibold truncate">{p.label}:</span>
                      <span className="text-slate-500 truncate text-[10px]">{p.query}</span>
                    </div>
                    <CaretRight size={12} className="shrink-0 text-slate-400 group-hover:text-red-700 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages List */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3 bg-slate-50/50 text-xs">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'assistant' && (
                  <div className="grid size-7 shrink-0 place-items-center rounded-full bg-red-100 text-red-800">
                    <Sparkle size={14} weight="fill" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-2xl p-3 leading-relaxed whitespace-pre-wrap break-words ${
                    msg.sender === 'user'
                      ? 'bg-red-800 text-white rounded-br-xs'
                      : 'bg-white text-slate-800 border border-slate-200/80 shadow-2xs rounded-bl-xs'
                  }`}
                >
                  <p>{msg.text}</p>

                  {/* 1-Click Copy Assistant Output (from prompts.chat pattern) */}
                  {msg.sender === 'assistant' && msg.id !== 'welcome' && (
                    <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-1.5 text-[10px] text-slate-400">
                      <span className="text-[9px]">Tư vấn AI WardMate</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(msg.id, msg.text)}
                        className="inline-flex items-center gap-1 hover:text-slate-700 font-medium transition-colors"
                        title="Sao chép toàn bộ câu trả lời"
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
                    </div>
                  )}
                </div>
                {msg.sender === 'user' && (
                  <div className="grid size-7 shrink-0 place-items-center rounded-full bg-slate-200 text-slate-700">
                    <User size={14} weight="bold" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-2.5 justify-start">
                <div className="grid size-7 shrink-0 place-items-center rounded-full bg-red-100 text-red-800">
                  <Sparkle size={14} weight="fill" />
                </div>
                <div className="rounded-2xl rounded-bl-xs bg-white border border-slate-200 p-3 shadow-2xs flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-red-700 animate-bounce" />
                  <span className="size-2 rounded-full bg-red-700 animate-bounce [animation-delay:0.2s]" />
                  <span className="size-2 rounded-full bg-red-700 animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            )}

            {error && (
              <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-2.5 text-[11px] text-red-800">
                {error}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void handleSend();
            }}
            className="border-t border-slate-200 bg-white p-2.5 flex items-center gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Nhập câu hỏi hoặc chọn mẫu ở trên..."
              disabled={loading}
              className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-100 disabled:bg-slate-100"
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || loading}
              className="grid size-9 shrink-0 place-items-center rounded-xl bg-red-800 text-white disabled:opacity-40 hover:bg-red-900 transition-colors shadow-2xs"
              aria-label="Gửi tin nhắn"
            >
              <PaperPlaneTilt size={16} weight="fill" />
            </button>
          </form>
        </section>
      )}
    </aside>
  );
};
