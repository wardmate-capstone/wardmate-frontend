import { useRef, useState } from 'react';
import { CircleNotch, ThumbsDown, ThumbsUp } from '@phosphor-icons/react';
import { aiError, aiOcrApi, chatFeedbackReasons, type ChatFeedbackReason } from '@/lib/api/aiOcr';
import { cn } from '@/lib/utils';

/**
 * Đánh giá một câu trả lời của chatbot (CHAT-FEEDBACK-01).
 * 👍 gửi ngay; 👎 mở khung chọn lý do + góp ý rồi mới gửi. Đánh giá lại thì server ghi đè.
 */
export function ChatFeedbackControls({ messageId, value, onRated }: {
  messageId: string;
  /** Đánh giá hiện tại: true 👍, false 👎, null/undefined chưa đánh giá */
  value?: boolean | null;
  onRated: (helpful: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ChatFeedbackReason | null>(null);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState<'up' | 'down' | null>(null);
  const [error, setError] = useState('');
  const [thanks, setThanks] = useState(false);
  const lock = useRef(false);

  const send = async (helpful: boolean) => {
    if (lock.current) return;
    lock.current = true;
    setBusy(helpful ? 'up' : 'down');
    setError('');
    try {
      await aiOcrApi.chatFeedback(messageId, { helpful, reason: helpful ? null : reason, comment: helpful ? null : comment });
      onRated(helpful);
      setOpen(false);
      setThanks(true);
    } catch (err) {
      setError(aiError(err));
    } finally {
      lock.current = false;
      setBusy(null);
    }
  };

  const iconButton = (active: boolean) => cn(
    'inline-flex size-11 items-center justify-center rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-800 disabled:opacity-50',
    active ? 'bg-red-50 text-red-800' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700',
  );

  return (
    <div className="w-full">
      <div className="flex items-center justify-end gap-1">
        {thanks && !open && <span className="mr-1 text-[10px] font-medium text-emerald-600" role="status">Cảm ơn bạn đã góp ý</span>}
        <button
          type="button"
          className={iconButton(value === true)}
          aria-pressed={value === true}
          aria-label="Câu trả lời hữu ích"
          title="Hữu ích"
          disabled={busy !== null}
          onClick={() => void send(true)}
        >
          {busy === 'up' ? <CircleNotch size={13} className="animate-spin" aria-hidden="true" /> : <ThumbsUp size={13} weight={value === true ? 'fill' : 'regular'} aria-hidden="true" />}
        </button>
        <button
          type="button"
          className={iconButton(value === false || open)}
          aria-pressed={value === false}
          aria-expanded={open}
          aria-label="Câu trả lời chưa đúng"
          title="Chưa đúng"
          disabled={busy !== null}
          onClick={() => { setOpen((v) => !v); setError(''); setThanks(false); }}
        >
          <ThumbsDown size={13} weight={value === false ? 'fill' : 'regular'} aria-hidden="true" />
        </button>
      </div>

      {open && (
        <div className="mt-2 space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-left">
          <p className="text-[11px] font-semibold text-slate-700">Câu trả lời chưa tốt ở điểm nào?</p>
          <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Lý do chưa hài lòng">
            {chatFeedbackReasons.map((r) => (
              <button
                key={r.value}
                type="button"
                role="radio"
                aria-checked={reason === r.value}
                disabled={busy !== null}
                onClick={() => setReason(reason === r.value ? null : r.value)}
                className={cn(
                  'rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-800',
                  reason === r.value ? 'border-red-800 bg-red-50 text-red-900' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100',
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
          <label className="block">
            <span className="sr-only">Góp ý thêm</span>
            <textarea
              rows={2}
              maxLength={1000}
              disabled={busy !== null}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Góp ý thêm (không bắt buộc), ví dụ: Tôi hỏi về lệ phí"
              className="w-full resize-none rounded-md border border-slate-200 bg-white p-2 text-[11px] text-slate-800 placeholder:text-slate-400 focus:border-red-600 focus:outline-none focus:ring-4 focus:ring-red-100"
            />
          </label>
          {error && <p role="alert" className="text-[11px] text-red-700">{error}</p>}
          <div className="flex justify-end gap-1.5">
            <button type="button" onClick={() => setOpen(false)} disabled={busy !== null} className="rounded-md px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-100">
              Hủy
            </button>
            <button
              type="button"
              onClick={() => void send(false)}
              disabled={busy !== null}
              className="inline-flex items-center gap-1 rounded-md bg-red-700 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-red-800 disabled:opacity-60"
            >
              {busy === 'down' && <CircleNotch size={11} className="animate-spin" aria-hidden="true" />}
              Gửi góp ý
            </button>
          </div>
        </div>
      )}
      {error && !open && <p role="alert" className="mt-1 text-[10px] text-red-700">{error}</p>}
    </div>
  );
}
