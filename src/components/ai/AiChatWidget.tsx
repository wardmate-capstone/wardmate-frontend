import React, { useState, useRef, useEffect } from 'react';
import {
  PaperPlaneTilt,
  X,
  ArrowsClockwise,
  User,
  Copy,
  Check,
} from '@phosphor-icons/react';
import { aiOcrApi } from '@/lib/api/aiOcr';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: Date;
}

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

export const AiChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: 'Xin chào! Tôi là trợ lý hỗ trợ thủ tục hành chính WardMate.\nTôi có thể giải đáp về quy trình chuẩn bị giấy tờ, thành phần hồ sơ và thời hạn giải quyết thủ tục tại cấp Xã/Phường. Bạn đang cần chuẩn bị hồ sơ gì?',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
    setMessages([
      {
        id: String(Date.now()),
        sender: 'assistant',
        text: 'Đã tạo cuộc hội thoại mới. Bạn có thể chọn câu hỏi gợi ý bên dưới hoặc nhập nội dung cần tư vấn.',
        timestamp: new Date(),
      },
    ]);
  };

  const hasUserMessages = messages.some((m) => m.sender === 'user');

  return (
    <aside aria-label="Trợ lý hỗ trợ thủ tục" className="fixed bottom-6 right-6 z-40">
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2.5 rounded-full bg-red-800 px-4 py-3 text-white shadow-xl hover:bg-red-900 hover:scale-105 active:scale-95 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-red-200"
          aria-label="Mở trợ lý hỗ trợ thủ tục"
        >
          <div className="relative grid size-7 place-items-center rounded-full bg-white/20">
            <User size={18} weight="bold" />
            <span className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full bg-emerald-400 ring-2 ring-red-800" />
          </div>
          <span className="text-xs font-bold tracking-wide">Trợ lý Một cửa</span>
        </button>
      )}

      {/* Floating Chat Window */}
      {isOpen && (
        <section
          aria-label="Cửa sổ hội thoại trợ lý ảo"
          className="flex h-[520px] w-[350px] sm:w-[400px] flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        >
          {/* Minimalist Header */}
          <div className="flex items-center justify-between border-b border-red-900 bg-red-800 px-4 py-3 text-white">
            <div className="flex items-center gap-2.5">
              <div className="relative grid size-8 place-items-center rounded-full bg-white/15 text-white">
                <User size={18} weight="bold" />
                <span className="absolute bottom-0 right-0 size-2 rounded-full bg-emerald-400 ring-1.5 ring-red-800" />
              </div>
              <div>
                <h3 className="text-xs font-bold leading-tight">Trợ lý Một cửa</h3>
                <span className="text-[10px] text-red-200 flex items-center gap-1">
                  <span className="size-1.5 rounded-full bg-emerald-400" />
                  Trực tuyến • Hỗ trợ thủ tục
                </span>
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

          {/* Messages List */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3 bg-slate-50/60 text-xs">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'assistant' && (
                  <div className="grid size-6 shrink-0 place-items-center rounded-full bg-red-100 text-red-800 mt-0.5">
                    <User size={13} weight="bold" />
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

                  {/* Quick Suggestions below initial welcome message */}
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

                  {/* Copy button */}
                  {msg.sender === 'assistant' && msg.id !== 'welcome' && (
                    <div className="mt-2 flex items-center justify-end border-t border-slate-100 pt-1 text-[10px] text-slate-400">
                      <button
                        type="button"
                        onClick={() => handleCopy(msg.id, msg.text)}
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
                <div className="grid size-6 shrink-0 place-items-center rounded-full bg-red-100 text-red-800">
                  <User size={13} weight="bold" />
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

            <div ref={messagesEndRef} />
          </div>

          {/* Minimalist Input Box */}
          <div className="border-t border-slate-200 bg-white p-2.5 space-y-1">
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
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Nhập câu hỏi cần tư vấn..."
                disabled={loading}
                className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-100 disabled:bg-slate-100"
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || loading}
                className="grid size-8 shrink-0 place-items-center rounded-xl bg-red-800 text-white disabled:opacity-40 hover:bg-red-900 transition-colors shadow-2xs"
                aria-label="Gửi tin nhắn"
              >
                <PaperPlaneTilt size={15} weight="fill" />
              </button>
            </form>
            <p className="text-[10px] text-slate-400 text-center">
              Thông tin tư vấn mang tính tham khảo hướng dẫn chuẩn bị hồ sơ.
            </p>
          </div>
        </section>
      )}
    </aside>
  );
};
