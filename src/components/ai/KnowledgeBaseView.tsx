import { useEffect, useId, useState } from 'react';
import { ArrowsClockwise, Books, ChartBar, ChatCircleText, FilePdf, MagnifyingGlass, Plus } from '@phosphor-icons/react';
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
import './knowledge.css';

const PAGE_SIZE = 20;
const selectClass = 'min-h-12 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-800 focus:border-red-600 focus:outline-none focus:ring-4 focus:ring-red-100';

type Tab = 'documents' | 'feedback' | 'usage' | 'search';
// Mỗi tab là một việc: quản lý nguồn (mặc định), xem đánh giá, theo dõi hạn mức, kiểm tra chất lượng nguồn (có phí).
const TABS = [
  { id: 'documents', label: 'Tài liệu nguồn', icon: Books },
  { id: 'feedback', label: 'Đánh giá chatbot', icon: ChatCircleText },
  { id: 'usage', label: 'Lượt dùng AI', icon: ChartBar },
  { id: 'search', label: 'Tìm thử nguồn', icon: MagnifyingGlass },
] as const;

/** Trạng thái hiển thị duy nhất của tài liệu: ngừng dùng ưu tiên, sau đó là trạng thái chuẩn bị cho AI. */
function documentStatus(doc: KnowledgeDocumentSummary) {
  if (!doc.isActive) return { label: 'Ngừng dùng', variant: 'neutral' as const };
  return statusLabels[doc.status] ?? { label: doc.status, variant: 'neutral' as const };
}

/** Dải tình trạng gọn: hai công tắc, bốn con số, sức chứa; hướng dẫn bật chỉ hiện khi còn tắt. */
function IndexStatusCard() {
  const status = useKnowledgeIndexStatus();
  const data = status.data;
  const used = data && data.maxIndexedChunks > 0 ? Math.min(100, Math.round((data.searchableChunks / data.maxIndexedChunks) * 100)) : null;
  return (
    <section className="admin-card kb-status" aria-labelledby="knowledge-index-status">
      <header>
        <h2 id="knowledge-index-status">Tình trạng sẵn sàng cho trợ lý AI</h2>
        {data && (
          <div className="flex flex-wrap gap-2">
            <Badge variant={data.embeddingEnabled ? 'success' : 'neutral'}>Chuẩn bị tài liệu cho AI: {data.embeddingEnabled ? 'Đang bật' : 'Đang tắt'}</Badge>
            <Badge variant={data.ragEnabled ? 'success' : 'neutral'}>Trả lời theo nguồn: {data.ragEnabled ? 'Đang bật' : 'Đang tắt'}</Badge>
          </div>
        )}
      </header>
      {status.isPending ? (
        <p role="status" className="kb-muted">Đang tải tình trạng…</p>
      ) : status.isError || !data ? (
        <ErrorAlert retrying={status.isFetching} onRetry={() => void status.refetch()}>{aiError(status.error)}</ErrorAlert>
      ) : (
        <>
          <dl className="kb-status-stats">
            <div><dt>Sẵn sàng</dt><dd>{data.embedded.toLocaleString('vi-VN')}</dd></div>
            <div><dt>Đang chuẩn bị cho AI</dt><dd>{data.chunked.toLocaleString('vi-VN')}</dd></div>
            <div className={data.embeddingFailed > 0 ? 'is-alert' : undefined}><dt>Lỗi chuẩn bị cho AI</dt><dd>{data.embeddingFailed.toLocaleString('vi-VN')}</dd></div>
            <div><dt>Ngừng dùng</dt><dd>{data.inactive.toLocaleString('vi-VN')}</dd></div>
            <div className="kb-capacity">
              <dt>Đoạn tìm kiếm được</dt>
              <dd>{data.searchableChunks.toLocaleString('vi-VN')}<span> / {data.maxIndexedChunks.toLocaleString('vi-VN')}</span></dd>
              {used != null && <div className="kb-bar" role="progressbar" aria-label="Sức chứa kho tìm kiếm" aria-valuenow={used} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${used}%` }} className={used >= 90 ? 'is-high' : undefined} /></div>}
            </div>
          </dl>
          {!data.ragEnabled && (
            <details className="kb-guide">
              <summary>Cách bật trả lời theo nguồn</summary>
              <ol>
                <li>Nhập văn bản/FAQ, tải PDF hoặc đồng bộ thủ tục.</li>
                <li>Bật chuẩn bị dữ liệu cho AI và chờ tài liệu chuyển sang “Sẵn sàng tìm kiếm”.</li>
                <li>Dùng tab “Tìm thử nguồn” để kiểm tra đoạn văn trả về.</li>
                <li>Bật trả lời theo nguồn.</li>
              </ol>
              <p>Các công tắc do bộ phận vận hành hệ thống cấu hình, không bật được từ màn này.</p>
            </details>
          )}
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
      <p className="mt-1 text-xs text-slate-500">Trả về các đoạn trong kho gần nhất với câu hỏi, xếp từ khớp nhất, giống cách trợ lý AI tìm nguồn trước khi trả lời. Nên thử bằng câu người dân hay hỏi.</p>
      <p className="mt-2 text-xs font-medium text-amber-800">Mỗi lần bấm “Tìm thử” gọi dịch vụ AI và có tính phí.</p>
      <form noValidate onSubmit={run} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="grid flex-1 gap-2">
          <label htmlFor={`${id}-query`} className="text-sm font-semibold text-slate-800">Câu hỏi thử</label>
          <input id={`${id}-query`} value={query} maxLength={1000} onChange={(e) => setQuery(e.target.value)} placeholder="Ví dụ: đăng ký khai sinh cần giấy tờ gì"
            aria-invalid={Boolean(validation)} className={`${selectClass} w-full`} />
        </div>
        <div className="grid gap-2">
          <label htmlFor={`${id}-topk`} className="text-sm font-semibold text-slate-800">Số đoạn trả về</label>
          <select id={`${id}-topk`} value={topK} onChange={(e) => setTopK(Number(e.target.value))} className={selectClass}>
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <Button type="submit" loading={search.isPending}><MagnifyingGlass size={16} aria-hidden="true" /> Tìm thử</Button>
      </form>
      {validation && <p role="alert" className="mt-2 text-xs font-medium text-red-700">{validation}</p>}
      {search.isError && <ErrorAlert className="mt-3">{aiError(search.error)}</ErrorAlert>}
      {search.isSuccess && (
        search.data.length === 0 ? (
          <p className="mt-4 text-sm text-slate-600">Không có đoạn nào đạt ngưỡng liên quan. Trợ lý sẽ trả lời rằng chưa có thông tin phù hợp.</p>
        ) : (
          <ol className="mt-4 grid gap-3" aria-label="Kết quả tìm thử">
            {search.data.map((hit) => (
              <li key={hit.chunkId} className="rounded-lg border border-slate-200 p-3 text-sm">
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
  const [tab, setTab] = useState<Tab>('documents');

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

  return (
    <div className="space-y-5">
      <div role="tablist" aria-label="Dữ liệu kiến thức AI" className="kb-tabs">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            id={`knowledge-tab-${id}`}
            aria-selected={tab === id}
            aria-controls={`knowledge-panel-${id}`}
            onClick={() => setTab(id)}
          >
            <Icon size={16} aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>

      <div role="tabpanel" id={`knowledge-panel-${tab}`} aria-labelledby={`knowledge-tab-${tab}`} className="space-y-5">
        {tab === 'feedback' && <ChatFeedbackView />}
        {tab === 'usage' && <AiUsageCard />}
        {tab === 'search' && <SearchTestPanel />}

        {tab === 'documents' && <>
          <IndexStatusCard />

          <section className="admin-card admin-table-card !mt-0" aria-labelledby="knowledge-documents-title">
            <div className="kb-docs-head">
              <div>
                <h2 id="knowledge-documents-title">Tài liệu nguồn</h2>
                {documents.data && <p>{documents.data.totalCount.toLocaleString('vi-VN')} tài liệu{filtered ? ' khớp bộ lọc' : ''}</p>}
              </div>
              <div className="kb-docs-actions">
                <Button size="toolbar" onClick={() => setCreatingText(true)}><Plus size={16} weight="bold" aria-hidden="true" /> Thêm văn bản/FAQ</Button>
                <Button size="small" variant="outline" onClick={() => setUploadingPdf(true)}><FilePdf size={16} aria-hidden="true" /> Tải PDF</Button>
                <div role="group" aria-label="Đồng bộ thủ tục" className="kb-sync">
                  <span><ArrowsClockwise size={15} aria-hidden="true" /> Đồng bộ thủ tục</span>
                  <Button size="small" variant="outline" aria-label="Đồng bộ một thủ tục" onClick={() => setSyncingOne(true)}>Một thủ tục</Button>
                  <Button size="small" variant="outline" aria-label="Đồng bộ tất cả thủ tục" onClick={() => setSyncingAll(true)}>Tất cả</Button>
                </div>
              </div>
            </div>
            <div className="kb-docs-filters">
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
                    <th scope="col">Trạng thái</th>
                    <th scope="col" className="text-right">Số đoạn</th>
                    <th scope="col">Cập nhật</th>
                    <th scope="col" className="text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.isPending ? (
                    <TableSkeletonRows columns={5} rows={5} columnWidths={['w-56', 'w-28', 'ml-auto w-10', 'w-28', 'ml-auto w-32']} lastCellClassName="text-right" />
                  ) : documents.data?.items.length === 0 ? (
                    <tr>
                      <td colSpan={5}>
                        {filtered
                          ? <EmptyState title="Không có tài liệu khớp bộ lọc." description="Thử đổi loại nguồn, trạng thái hoặc từ khóa tìm kiếm." />
                          : <EmptyState title="Kho kiến thức chưa có tài liệu." description="Hãy đồng bộ thủ tục hoặc thêm văn bản/FAQ." />}
                      </td>
                    </tr>
                  ) : documents.data?.items.map((doc) => {
                    const status = documentStatus(doc);
                    const editable = doc.sourceType !== 'PROCEDURE';
                    // Chuẩn bị lại cho AI chỉ cần khi tài liệu đang dùng mà chưa sẵn sàng (chờ hoặc lỗi).
                    const needsReindex = doc.isActive && doc.status !== 'EMBEDDED';
                    return (
                      <tr key={doc.id}>
                        <td className="max-w-[320px]">
                          <button type="button" onClick={() => setViewingId(doc.id)} className="kb-doc-title">{doc.title}</button>
                          <span className="kb-doc-source">{sourceTypeLabels[doc.sourceType] ?? doc.sourceType}</span>
                        </td>
                        <td><Badge variant={status.variant}>{status.label}</Badge></td>
                        <td className="text-right tabular-nums">{doc.chunkCount.toLocaleString('vi-VN')}</td>
                        <td className="whitespace-nowrap">{formatDateTime(doc.updatedAt)}</td>
                        <td>
                          <div className="kb-row-actions">
                            {editable && <Button size="small" variant="ghost" onClick={() => setEditingId(doc.id)} aria-label={`Sửa ${doc.title}`}>Sửa</Button>}
                            {needsReindex && <Button size="small" variant="ghost" onClick={() => setAction({ action: 'reindex', doc })} aria-label={`Chuẩn bị lại cho AI ${doc.title}`}>Chuẩn bị lại cho AI</Button>}
                            <Button size="small" variant="ghost" onClick={() => setAction({ action: doc.isActive ? 'deactivate' : 'activate', doc })} aria-label={`${doc.isActive ? 'Ngừng dùng' : 'Dùng lại'} ${doc.title}`}>
                              {doc.isActive ? 'Ngừng dùng' : 'Dùng lại'}
                            </Button>
                            <details className="kb-more">
                              <summary aria-label={`Thao tác khác cho ${doc.title}`}>Khác</summary>
                              <Button size="small" variant="ghost" onClick={() => setAction({ action: 'rechunk', doc })} aria-label={`Chia lại nội dung ${doc.title}`}>Chia lại nội dung</Button>
                              {!needsReindex && <Button size="small" variant="ghost" onClick={() => setAction({ action: 'reindex', doc })} aria-label={`Chuẩn bị lại cho AI ${doc.title}`}>Chuẩn bị lại cho AI</Button>}
                            </details>
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
        </>}
      </div>

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
