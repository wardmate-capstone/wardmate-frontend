import { useState } from 'react';
import { ChatCircleText, ThumbsDown, ThumbsUp } from '@phosphor-icons/react';
import { Badge, EmptyState, ErrorAlert, ListSkeleton, Pagination, RefreshButton, Select } from '@/components/ui';
import { aiError, chatFeedbackReasons, type ChatFeedbackItem } from '@/lib/api/aiOcr';
import { useChatFeedbackList } from '@/hooks/useAiKnowledge';
import { formatDateTime } from '@/components/ai/KnowledgeModals';

const PAGE_SIZE = 20;
const reasonLabel = (value?: string | null) => chatFeedbackReasons.find((r) => r.value === value)?.label ?? value ?? '';

type Filter = 'unhelpful' | 'helpful' | 'all';
const FILTERS: { value: Filter; label: string }[] = [
  { value: 'unhelpful', label: 'Chưa hài lòng' },
  { value: 'helpful', label: 'Hữu ích' },
  { value: 'all', label: 'Tất cả đánh giá' },
];

/** Một đánh giá: câu hỏi, câu trả lời (thu gọn, bấm để xem đủ), lý do và góp ý của người dân */
function FeedbackCard({ item }: { item: ChatFeedbackItem }) {
  const [expanded, setExpanded] = useState(false);
  const long = item.answer.length > 320;
  return (
    <li className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-center gap-2">
        {item.helpful
          ? <Badge className="px-2.5 py-0.5 text-xs" variant="success"><ThumbsUp size={12} weight="fill" aria-hidden="true" /> Hữu ích</Badge>
          : <Badge className="px-2.5 py-0.5 text-xs" variant="danger"><ThumbsDown size={12} weight="fill" aria-hidden="true" /> Chưa hài lòng</Badge>}
        {!item.helpful && item.reason && <Badge className="px-2.5 py-0.5 text-xs" variant="warning">{reasonLabel(item.reason)}</Badge>}
        {!item.grounded && <Badge className="px-2.5 py-0.5 text-xs" variant="neutral">Không có nguồn trong kho kiến thức</Badge>}
        {item.needsClarification && <Badge className="px-2.5 py-0.5 text-xs" variant="neutral">Chatbot đang hỏi lại</Badge>}
        <time className="ml-auto text-xs text-slate-500" dateTime={item.ratedAt}>{formatDateTime(item.ratedAt)}</time>
      </div>
      <div className="space-y-1">
        <p className="text-xs font-semibold text-slate-500">Câu hỏi của người dân</p>
        <p className="text-sm font-semibold text-slate-900">{item.question?.trim() || <span className="font-normal italic text-slate-400">Không lưu câu hỏi</span>}</p>
      </div>
      <div className="space-y-1">
        <p className="text-xs font-semibold text-slate-500">Câu trả lời của chatbot</p>
        <p className={`whitespace-pre-wrap break-words text-sm leading-6 text-slate-700 ${!expanded && long ? 'line-clamp-4' : ''}`}>{item.answer}</p>
        {long && (
          <button type="button" onClick={() => setExpanded((v) => !v)} className="text-xs font-semibold text-red-800 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-800 focus-visible:ring-offset-2">
            {expanded ? 'Thu gọn' : 'Xem đầy đủ'}
          </button>
        )}
      </div>
      {item.comment?.trim() && (
        <blockquote className="rounded-lg border-l-4 border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-950">
          <span className="block text-xs font-semibold text-amber-800">Góp ý của người dân</span>
          {item.comment}
        </blockquote>
      )}
    </li>
  );
}

/**
 * CHAT-FEEDBACK-01: quản lý kho kiến thức xem câu trả lời chatbot bị đánh giá chưa tốt,
 * để biết cần bổ sung hoặc sửa tài liệu nguồn nào.
 */
export function ChatFeedbackView() {
  const [filter, setFilter] = useState<Filter>('unhelpful');
  const [page, setPage] = useState(1);
  const helpful = filter === 'all' ? undefined : filter === 'helpful';
  const list = useChatFeedbackList({ helpful, pageNumber: page, pageSize: PAGE_SIZE });

  return (
    <section className="admin-card !mt-0" aria-labelledby="chat-feedback-title">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5">
        <div className="min-w-0">
          <h2 id="chat-feedback-title" className="text-base font-bold text-slate-950">Đánh giá chatbot</h2>
          <p className="mt-0.5 text-xs text-slate-500">Người dân đánh giá câu trả lời của trợ lý AI. Dùng để biết câu hỏi nào cần bổ sung hoặc sửa tài liệu nguồn.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            aria-label="Lọc đánh giá"
            containerClassName="w-full sm:w-44"
            value={filter}
            onChange={(e) => { setFilter(e.target.value as Filter); setPage(1); }}
          >
            {FILTERS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
          </Select>
          <RefreshButton loading={list.isFetching} onClick={() => void list.refetch()} />
        </div>
      </div>

      <div className="p-5">
        {list.isError ? (
          <ErrorAlert retrying={list.isFetching} onRetry={() => void list.refetch()}>{aiError(list.error)}</ErrorAlert>
        ) : list.isPending ? (
          <ListSkeleton rows={3} />
        ) : list.data.items.length === 0 ? (
          <EmptyState
            icon={ChatCircleText}
            title={filter === 'unhelpful' ? 'Chưa có đánh giá chưa hài lòng.' : 'Chưa có đánh giá nào.'}
            description="Khi người dân bấm 👍/👎 dưới câu trả lời của chatbot, đánh giá sẽ hiện tại đây."
          />
        ) : (
          <ul className="space-y-3">
            {list.data.items.map((item) => <FeedbackCard key={item.messageId} item={item} />)}
          </ul>
        )}
      </div>

      {list.data && list.data.totalCount > 0 && (
        <Pagination
          className="border-t border-slate-100 px-5 py-3"
          label="Phân trang đánh giá chatbot"
          page={page}
          total={list.data.totalCount}
          pageSize={PAGE_SIZE}
          unit="đánh giá"
          disabled={list.isFetching}
          onPageChange={setPage}
        />
      )}
    </section>
  );
}
