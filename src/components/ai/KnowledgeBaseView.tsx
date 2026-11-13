import { useEffect, useId, useState } from 'react';
import { ArrowsClockwise, Books, ChatCircleText, FilePdf, MagnifyingGlass, Plus } from '@phosphor-icons/react';
import { ChatFeedbackView } from '@/components/ai/ChatFeedbackView';
import { Badge, Button, TableSkeletonRows, SearchInput, Select, Pagination, EmptyState, ErrorAlert } from '@/components/ui';
import { aiError, type KnowledgeDocumentSummary } from '@/lib/api/aiOcr';
import {
  useCanManageKnowledge,
  useKnowledgeDocuments,
  useKnowledgeIndexStatus,
  useKnowledgeSearch,
} from '@/hooks/useAiKnowledge';
import {
  formatDateTime,
  KnowledgeActionModal,
  KnowledgeCreateTextModal,
  KnowledgeDetailModal,
  KnowledgeEditModal,
  KnowledgePdfModal,
  ProcedureSyncModal,
  SyncAllModal,
  sourceTypeLabels,
  statusLabels,
  type KnowledgeAction,
} from './KnowledgeModals';
import { AiUsageCard } from './AiUsageCard';

const PAGE_SIZE = 20;
const selectClass = 'min-h-12 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-800 focus:border-red-500 focus:outline-none focus:ring-4 focus:ring-red-100';

function IndexStatusCard() {
  const status = useKnowledgeIndexStatus();
  const data = status.data;
  return (
    <section className="admin-card p-5" aria-labelledby="knowledge-index-status">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="knowledge-index-status" className="text-base font-bold text-slate-950">Tình trạng sẵn sàng cho trợ lý AI</h2>
        {data && (
          <div className="flex flex-wrap gap-2">
            <Badge variant={data.embeddingEnabled ? 'success' : 'neutral'}>Tạo vector: {data.embeddingEnabled ? 'Đang bật' : 'Đang tắt'}</Badge>
            <Badge variant={data.ragEnabled ? 'success' : 'neutral'}>Trả lời theo nguồn: {data.ragEnabled ? 'Đang bật' : 'Đang tắt'}</Badge>
          </div>
        )}
      </div>
      {status.isPending ? (
        <p role="status" className="mt-3 text-sm text-slate-600">Đang tải tình trạng…</p>
      ) : status.isError || !data ? (
        <ErrorAlert className="mt-3" retrying={status.isFetching} onRetry={() => void status.refetch()}>{aiError(status.error)}</ErrorAlert>
      ) : (
        <>
          <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {([
              ['Đang dùng', data.activeDocuments],
              ['Đang chuẩn bị cho AI', data.chunked],
              ['Sẵn sàng', data.embedded],
              ['Lỗi chuẩn bị cho AI', data.embeddingFailed],
              ['Ngừng dùng', data.inactive],
              ['Đoạn tìm kiếm được', `${data.searchableChunks.toLocaleString('vi-VN')}/${data.maxIndexedChunks.toLocaleString('vi-VN')}`],
            ] as const).map(([label, value]) => (
              <div key={label} className="rounded-xl bg-slate-50 p-3">
                <dt className="text-xs text-slate-500">{label}</dt>
                <dd className="text-lg font-bold text-slate-900">{value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-xs leading-5 text-slate-500">
            Thứ tự bật: (1) nhập hoặc đồng bộ tài liệu → (2) bật chuẩn bị dữ liệu cho AI và chờ tài liệu “Sẵn sàng” → (3) tìm thử để kiểm tra nguồn → (4) bật trả lời theo nguồn.
            Các công tắc do bộ phận vận hành hệ thống cấu hình, không bật được từ màn này.
          </p>
        </>
      )}
    </section>
  );
}

function SearchTestPanel() {
  const id = useId();
  const [query, setQuery] = useState('');
  const [topK, setTopK] = useState(5);
  const [validation, setValidation] = useState('');
  const search = useKnowledgeSearch();

  const run = (event: React.FormEvent) => {
    event.preventDefault();
    const text = query.trim();
    if (text.length < 2 || text.length > 1000) { setValidation('Câu hỏi cần từ 2 đến 1.000 ký tự.'); return; }
    setValidation('');
    search.mutate({ query: text, topK });
  };

  return (
    <section className="admin-card p-5" aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`} className="text-base font-bold text-slate-950">Tìm thử nguồn</h2>
      <p className="mt-1 text-xs text-amber-800">Mỗi lần bấm “Tìm thử” sẽ gọi dịch vụ AI và có tính phí. Chỉ dùng để kiểm tra chất lượng nguồn.</p>
      <form noValidate onSubmit={run} className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="grid flex-1 gap-2">
          <label htmlFor={`${id}-query`} className="text-sm font-semibold text-slate-800">Câu hỏi thử</label>
          <input id={`${id}-query`} value={query} maxLength={1000} onChange={(e) => setQuery(e.target.value)} placeholder="Ví dụ: đăng ký khai sinh cần giấy tờ gì"
            aria-invalid={Boolean(validation)} className={`${selectClass} w-full`} />
        </div>
        <div className="grid gap-2">
          <label htmlFor={`${id}-topk`} className="text-sm font-semibold text-slate-800">Số kết quả</label>
          <select id={`${id}-topk`} value={topK} onChange={(e) => setTopK(Number(e.target.value))} aria-describedby={`${id}-topk-hint`} className={selectClass}>
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <Button type="submit" loading={search.isPending}><MagnifyingGlass size={16} aria-hidden="true" /> Tìm thử</Button>
      </form>
      {/* Giải thích topK: số đoạn văn khớp nhất trả về, không phải câu trả lời hay phép đếm */}
      <p id={`${id}-topk-hint`} className="mt-2 text-xs leading-5 text-slate-500">
        Hiển thị các đoạn văn trong kho có nội dung gần nhất với câu hỏi, xếp từ khớp nhất xuống, giống cách trợ lý AI tìm nguồn trước khi trả lời. Nên thử bằng câu hỏi người dân hay hỏi; công cụ không đếm hay tổng hợp dữ liệu.
      </p>
      {validation && <p role="alert" className="mt-2 text-xs font-medium text-red-700">{validation}</p>}
      {search.isError && <ErrorAlert className="mt-3">{aiError(search.error)}</ErrorAlert>}
      {search.isSuccess && (
        search.data.length === 0 ? (
          <p className="mt-3 text-sm text-slate-600">Không có đoạn nào đạt ngưỡng liên quan. Trợ lý sẽ trả lời rằng chưa có thông tin phù hợp.</p>
        ) : (
          <ol className="mt-3 grid gap-3" aria-label="Kết quả tìm thử">
            {search.data.map((hit) => (
              <li key={hit.chunkId} className="rounded-xl border border-slate-200 p-3 text-sm">
                <p className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span className="font-bold text-red-800">#{hit.rank}</span>
                  <span className="font-semibold text-slate-800">{hit.title}</span>
                  {hit.heading && <span>· {hit.heading}</span>}
                  <span>· Độ khớp {hit.score.toFixed(2)}</span>
                </p>
                <p className="mt-1 line-clamp-4 whitespace-pre-wrap text-slate-700">{hit.content}</p>
              </li>
            ))}
          </ol>
        )
      )}
    </section>
  );
}

export function KnowledgeBaseView() {
  const canManage = useCanManageKnowledge();
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [sourceType, setSourceType] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [page, setPage] = useState(1);
  const [creatingText, setCreatingText] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [syncingOne, setSyncingOne] = useState(false);
  const [syncingAll, setSyncingAll] = useState(false);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [action, setAction] = useState<{ action: KnowledgeAction; doc: KnowledgeDocumentSummary } | null>(null);
  // Hai tab: quản lý tài liệu nguồn và xem đánh giá chatbot của người dân (CHAT-FEEDBACK-01)
  const [tab, setTab] = useState<'documents' | 'feedback'>('documents');

  useEffect(() => {
    const timer = setTimeout(() => { setSearch(searchInput.trim()); setPage(1); }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const documents = useKnowledgeDocuments({
    search: search || undefined,
    sourceType: sourceType || undefined,
    isActive: activeFilter === '' ? undefined : activeFilter === 'true',
    pageNumber: page,
    pageSize: PAGE_SIZE,
  });
  const filtered = Boolean(search || sourceType || activeFilter);

  if (!canManage) {
    return (
      <section className="admin-card p-6">
        <h2 className="text-lg font-bold text-slate-950">Bạn chưa có quyền quản lý dữ liệu kiến thức AI</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">Chức năng này cần quyền Quản lý dữ liệu kiến thức AI. Liên hệ quản trị hệ thống nếu bạn cần quản lý nguồn cho trợ lý AI.</p>
      </section>
    );
  }

  const tabs = [
    { id: 'documents', label: 'Tài liệu kiến thức', icon: Books },
    { id: 'feedback', label: 'Đánh giá chatbot', icon: ChatCircleText },
  ] as const;
  const tabBar = (
    <div role="tablist" aria-label="Dữ liệu kiến thức AI" className="flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-white p-1">
      {tabs.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          role="tab"
          id={`knowledge-tab-${id}`}
          aria-selected={tab === id}
          aria-controls={`knowledge-panel-${id}`}
          onClick={() => setTab(id)}
          className={`inline-flex h-10 items-center gap-1.5 rounded-lg px-4 text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-800 ${tab === id ? 'bg-red-50 text-red-900' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
        >
          <Icon size={16} aria-hidden="true" />
          {label}
        </button>
      ))}
    </div>
  );

  if (tab === 'feedback') {
    return (
      <div className="space-y-5">
        {tabBar}
        <div role="tabpanel" id="knowledge-panel-feedback" aria-labelledby="knowledge-tab-feedback">
          <ChatFeedbackView />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {tabBar}
      <IndexStatusCard />
      <AiUsageCard />

      <section className="admin-card admin-table-card !mt-0" aria-labelledby="knowledge-documents-title">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5">
          <h2 id="knowledge-documents-title" className="text-base font-bold text-slate-950">Tài liệu nguồn</h2>
          <div className="flex flex-wrap gap-2">
            <Button size="toolbar" onClick={() => setCreatingText(true)}><Plus size={16} weight="bold" aria-hidden="true" /> Thêm văn bản/FAQ</Button>
            <Button size="small" variant="outline" onClick={() => setUploadingPdf(true)}><FilePdf size={16} aria-hidden="true" /> Tải PDF</Button>
            <Button size="small" variant="outline" onClick={() => setSyncingOne(true)}><ArrowsClockwise size={16} aria-hidden="true" /> Đồng bộ thủ tục</Button>
            <Button size="small" variant="outline" onClick={() => setSyncingAll(true)}>Đồng bộ tất cả</Button>
          </div>
        </div>
        <div className="grid gap-3 border-b border-slate-100 p-5 md:grid-cols-[1fr_auto_auto]">
          <SearchInput value={searchInput} maxLength={200} onChange={(e) => setSearchInput(e.target.value)} onClear={() => setSearchInput('')}
            placeholder="Tìm theo tiêu đề hoặc nguồn" aria-label="Tìm tài liệu" />
          <Select value={sourceType} onChange={(e) => { setSourceType(e.target.value); setPage(1); }} aria-label="Lọc loại nguồn">
            <option value="">Mọi loại nguồn</option>
            {Object.entries(sourceTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </Select>
          <Select value={activeFilter} onChange={(e) => { setActiveFilter(e.target.value); setPage(1); }} aria-label="Lọc trạng thái sử dụng">
            <option value="">Đang dùng và ngừng dùng</option>
            <option value="true">Đang dùng</option>
            <option value="false">Ngừng dùng</option>
          </Select>
        </div>

        {documents.isError && (
          <ErrorAlert className="m-5" retrying={documents.isFetching} onRetry={() => void documents.refetch()}>{aiError(documents.error)}</ErrorAlert>
        )}

        <div className="admin-table-wrap">
          <table>
            <thead>
              <tr>
                <th scope="col">Tiêu đề</th>
                <th scope="col">Loại nguồn</th>
                <th scope="col">Trạng thái</th>
                <th scope="col">Sử dụng</th>
                <th scope="col">Số đoạn</th>
                <th scope="col">Cập nhật</th>
                <th scope="col" className="sticky right-0 bg-slate-50 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {documents.isPending ? (
                <TableSkeletonRows
                  columns={7}
                  rows={5}
                  columnWidths={['w-56', 'w-28', 'w-24', 'w-20', 'w-20', 'w-28', 'ml-auto w-24']}
                  lastCellClassName="sticky right-0 bg-white text-right"
                />
              ) : documents.data?.items.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    {filtered
                      ? <EmptyState title="Không có tài liệu khớp bộ lọc." description="Thử đổi loại nguồn, trạng thái hoặc từ khóa tìm kiếm." />
                      : <EmptyState title="Kho kiến thức chưa có tài liệu." description="Hãy đồng bộ thủ tục hoặc thêm văn bản/FAQ." />}
                  </td>
                </tr>
              ) : documents.data?.items.map((doc) => {
                const status = statusLabels[doc.status];
                const editable = doc.sourceType !== 'PROCEDURE';
                return (
                  <tr key={doc.id}>
                    <td className="max-w-[280px]">
                      <button type="button" onClick={() => setViewingId(doc.id)} className="text-left font-semibold text-slate-900 hover:text-red-800 hover:underline">
                        {doc.title}
                      </button>
                    </td>
                    <td>{sourceTypeLabels[doc.sourceType] ?? doc.sourceType}</td>
                    <td><Badge className="text-xs" variant={status?.variant ?? 'neutral'}>{status?.label ?? doc.status}</Badge></td>
                    <td><Badge className="text-xs" variant={doc.isActive ? 'success' : 'neutral'}>{doc.isActive ? 'Đang dùng' : 'Ngừng dùng'}</Badge></td>
                    <td>{doc.chunkCount}</td>
                    <td className="whitespace-nowrap">{formatDateTime(doc.updatedAt)}</td>
                    <td className="sticky right-0 bg-white">
                      <div className="flex justify-end gap-1 whitespace-nowrap">
                        <Button size="small" variant="ghost" onClick={() => setViewingId(doc.id)} aria-label={`Xem ${doc.title}`}>Xem</Button>
                        {editable && <Button size="small" variant="ghost" onClick={() => setEditingId(doc.id)} aria-label={`Sửa ${doc.title}`}>Sửa</Button>}
                        <Button size="small" variant="ghost" onClick={() => setAction({ action: doc.isActive ? 'deactivate' : 'activate', doc })} aria-label={`${doc.isActive ? 'Ngừng dùng' : 'Dùng lại'} ${doc.title}`}>
                          {doc.isActive ? 'Ngừng dùng' : 'Dùng lại'}
                        </Button>
                        <Button size="small" variant="ghost" onClick={() => setAction({ action: 'rechunk', doc })} aria-label={`Chia lại nội dung ${doc.title}`}>Chia lại</Button>
                        <Button size="small" variant="ghost" onClick={() => setAction({ action: 'reindex', doc })} aria-label={`Chuẩn bị lại cho AI ${doc.title}`}>Chuẩn bị lại cho AI</Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {documents.data && documents.data.totalCount > 0 && (
          <Pagination
            className="border-t border-slate-100 px-5 py-3"
            label="Phân trang kho tri thức"
            page={page}
            total={documents.data.totalCount}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
            unit="tài liệu"
          />
        )}
      </section>

      <SearchTestPanel />

      <KnowledgeCreateTextModal open={creatingText} onOpenChange={setCreatingText} />
      <KnowledgePdfModal open={uploadingPdf} onOpenChange={setUploadingPdf} />
      <ProcedureSyncModal open={syncingOne} onOpenChange={setSyncingOne} />
      <SyncAllModal open={syncingAll} onOpenChange={setSyncingAll} />
      <KnowledgeDetailModal documentId={viewingId} onClose={() => setViewingId(null)} />
      <KnowledgeEditModal documentId={editingId} onClose={() => setEditingId(null)} />
      <KnowledgeActionModal target={action} onClose={() => setAction(null)} />
    </div>
  );
}
