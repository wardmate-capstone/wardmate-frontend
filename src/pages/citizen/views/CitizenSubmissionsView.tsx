import { lazy, Suspense, useMemo, useState } from 'react';
import {
  FileDoc,
  MagnifyingGlass,
  ArrowClockwise,
  Eye,
  Folder,
  Clock,
  ChatCircleDots,
  WarningCircle,
} from '@phosphor-icons/react';
import { Button, ListSkeleton } from '@/components/ui';
import { useAuthStore } from '@/stores/authStore';
import { useCitizenSubmissions } from '@/hooks/useDocumentForms';
import {
  documentFormApi,
  documentFormError,
  submissionStatusLabel,
  type UserSubmissionDto,
} from '@/lib/api/documentForms';

const DocxOnlineEditor = lazy(() => import('@/components/documents/DocxOnlineEditor'));

/**
 * Làm sạch tên file biểu mẫu để thân thiện với người dùng:
 * 1. Cắt bỏ tiền tố mã băm GUID 32 hex ở đầu (vd: `dccb6f4a..._don-nhap.docx` -> `don-nhap.docx`)
 * 2. Loại bỏ đuôi kép `.docx.docx` -> `.docx`
 */
function cleanSubmissionFileName(rawName: string): string {
  if (!rawName) return 'Tờ khai chưa đặt tên.docx';
  let name = rawName.replace(/^[a-f0-9]{32}_/i, '');
  name = name.replace(/(\.docx)+$/i, '.docx');
  if (!name.toLowerCase().endsWith('.docx') && !name.toLowerCase().endsWith('.doc')) {
    name = `${name}.docx`;
  }
  return name;
}

function getSubmissionBadge(status: string) {
  switch (status) {
    case 'Draft':
      return {
        label: 'Nháp đã lưu',
        className: 'bg-slate-100 text-slate-700 border-slate-200',
        dot: 'bg-slate-400',
      };
    case 'Submitted':
      return {
        label: 'Đã chốt',
        className: 'bg-sky-50 text-sky-700 border-sky-200',
        dot: 'bg-sky-500',
      };
    case 'RevisionRequested':
      return {
        label: 'Cần chỉnh sửa',
        className: 'bg-amber-50 text-amber-800 border-amber-200',
        dot: 'bg-amber-500',
      };
    case 'ReadyForDownload':
      return {
        label: 'Giấy tờ sẵn sàng',
        className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        dot: 'bg-emerald-500',
      };
    case 'Approved':
      return {
        label: 'Đã duyệt',
        className: 'bg-teal-50 text-teal-700 border-teal-200',
        dot: 'bg-teal-500',
      };
    default:
      return {
        label: submissionStatusLabel(status),
        className: 'bg-slate-100 text-slate-600 border-slate-200',
        dot: 'bg-slate-400',
      };
  }
}

export function CitizenSubmissionsView({
  onOpenApplication,
}: {
  onOpenApplication: (id: string) => Promise<void>;
}) {
  const user = useAuthStore((s) => s.user);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selected, setSelected] = useState<UserSubmissionDto>();
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState('');

  const query = useCitizenSubmissions(user?.id, true, { page, pageSize: 20, status });

  // Lọc tìm kiếm theo tên tờ khai client-side
  const filteredItems = useMemo(() => {
    if (!query.data?.items) return [];
    if (!searchTerm.trim()) return query.data.items;
    const term = searchTerm.toLowerCase().trim();
    return query.data.items.filter((item) => {
      const cleanName = cleanSubmissionFileName(item.fileName).toLowerCase();
      const rawName = item.fileName.toLowerCase();
      return cleanName.includes(term) || rawName.includes(term);
    });
  }, [query.data?.items, searchTerm]);

  return (
    <section className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
      {/* Tiêu đề ẩn hỗ trợ trợ năng (Accessibility) tránh trùng lặp thị giác với H1 trang */}
      <h2 className="sr-only">Danh sách tờ khai</h2>

      {/* Thanh công cụ tìm kiếm, lọc & làm mới */}
      <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2.5">
          {/* Ô tìm kiếm theo tên biểu mẫu */}
          <div className="relative min-w-[220px] flex-1 max-w-sm">
            <MagnifyingGlass
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm theo tên tờ khai..."
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-7 text-xs font-medium text-slate-800 placeholder-slate-400 outline-none transition focus:border-red-600 focus:bg-white focus:ring-1 focus:ring-red-600"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-xs text-slate-400 hover:text-slate-600"
                title="Xóa từ khóa"
              >
                ×
              </button>
            )}
          </div>

          {/* Lọc theo trạng thái */}
          <div className="flex items-center gap-1.5">
            <label htmlFor="submission-status-filter" className="sr-only">
              Trạng thái bản khai
            </label>
            <select
              id="submission-status-filter"
              aria-label="Trạng thái bản khai"
              className="h-10 cursor-pointer rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none hover:border-slate-300 focus:border-red-600 focus:ring-1 focus:ring-red-600"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Tất cả trạng thái</option>
              {['Draft', 'Submitted', 'RevisionRequested', 'ReadyForDownload'].map(
                (value) => (
                  <option key={value} value={value}>
                    {submissionStatusLabel(value)}
                  </option>
                )
              )}
            </select>
          </div>

          {/* Nút xóa bộ lọc */}
          {(status || searchTerm) && (
            <button
              type="button"
              onClick={() => {
                setStatus('');
                setSearchTerm('');
                setPage(1);
              }}
              className="px-2 text-xs font-semibold text-red-700 hover:text-red-800 hover:underline"
            >
              Xóa bộ lọc
            </button>
          )}
        </div>

        {/* Số lượng tờ khai & Nút làm mới */}
        <div className="flex items-center gap-2.5 self-end sm:self-center">
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
            {query.isPending ? 'Đang tải…' : `${query.data?.totalCount ?? 0} tờ khai`}
          </span>
          <Button
            variant="outline"
            size="small"
            disabled={query.isFetching}
            onClick={() => void query.refetch()}
            className="gap-1.5 rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50"
          >
            <ArrowClockwise
              size={14}
              className={query.isFetching ? 'animate-spin text-red-700' : 'text-slate-500'}
            />
            <span>{query.isFetching ? 'Đang tải…' : 'Làm mới'}</span>
          </Button>
        </div>
      </div>

      {error && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800">
          {error}
        </p>
      )}

      {query.isPending ? (
        <div className="py-2">
          <ListSkeleton rows={3} />
        </div>
      ) : query.isError ? (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-800">
          <p>{documentFormError(query.error)}</p>
          <Button variant="outline" size="small" className="mt-2" onClick={() => void query.refetch()}>
            Thử tải lại bản khai
          </Button>
        </div>
      ) : (
        <>
          {/* Trạng thái danh sách rỗng */}
          {!filteredItems.length && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <FileDoc size={32} weight="duotone" />
              </div>
              <h3 className="mt-3.5 text-sm font-bold text-slate-800">Chưa có tờ khai phù hợp</h3>
              <p className="mt-1 max-w-sm text-xs text-slate-500">
                {searchTerm || status
                  ? 'Không tìm thấy tờ khai nào khớp với bộ lọc hiện tại. Vui lòng thử tìm từ khóa khác.'
                  : 'Bạn chưa có bản khai trực tuyến nào. Khi bắt đầu kê khai thủ tục, các biểu mẫu sẽ được lưu tại đây.'}
              </p>
              {(searchTerm || status) && (
                <Button
                  variant="outline"
                  size="small"
                  className="mt-4 gap-1.5 border-slate-200 text-xs"
                  onClick={() => {
                    setSearchTerm('');
                    setStatus('');
                    setPage(1);
                  }}
                >
                  Xóa bộ lọc
                </Button>
              )}
            </div>
          )}

          {/* Danh sách thẻ tờ khai */}
          <div className="space-y-3">
            {filteredItems.map((item) => {
              const badge = getSubmissionBadge(item.status);
              const cleanName = cleanSubmissionFileName(item.fileName);

              return (
                <article
                  key={item.id}
                  className="group relative flex flex-col gap-4 rounded-xl border border-slate-200/80 bg-white p-4 shadow-2xs transition-all hover:border-slate-300 hover:shadow-xs sm:flex-row sm:items-center sm:justify-between"
                >
                  {/* Cột thông tin tờ khai */}
                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 border border-blue-100 shadow-2xs group-hover:scale-105 transition-transform">
                      <FileDoc size={24} weight="duotone" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="break-all text-sm font-bold text-slate-900 group-hover:text-red-700 transition-colors">
                          {cleanName}
                        </h3>
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold border ${badge.className}`}
                        >
                          <span className={`size-1.5 rounded-full ${badge.dot}`} />
                          {badge.label}
                        </span>
                      </div>

                      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
                        <span className="inline-flex items-center gap-1">
                          <Clock size={13} className="text-slate-400" />
                          {new Date(item.updatedAt || item.createdAt).toLocaleString('vi-VN')}
                        </span>
                        {item.fileSizeBytes > 0 && (
                          <span className="text-slate-400">
                            · {(item.fileSizeBytes / 1024).toFixed(0)} KB
                          </span>
                        )}
                      </div>

                      {item.officerComment && (
                        <div className="mt-2.5 flex items-start gap-2 rounded-lg border border-amber-200/80 bg-amber-50/70 p-2.5 text-xs text-amber-900">
                          <ChatCircleDots size={16} className="shrink-0 text-amber-700 mt-0.5" />
                          <div>
                            <span className="font-bold">Ghi chú cán bộ: </span>
                            <span className="whitespace-pre-wrap">{item.officerComment}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Cột nút hành động */}
                  <div className="flex flex-wrap items-center gap-2 self-end sm:self-center shrink-0">
                    <Button
                      size="small"
                      className="gap-1.5 bg-red-700 hover:bg-red-800 text-white font-semibold shadow-2xs"
                      onClick={() => setSelected(item)}
                    >
                      <Eye size={15} weight="bold" />
                      <span>Xem bản khai</span>
                    </Button>

                    {item.applicationId ? (
                      <Button
                        variant="outline"
                        size="small"
                        disabled={opening}
                        className="gap-1.5 border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                        onClick={async () => {
                          setOpening(true);
                          setError('');
                          try {
                            await onOpenApplication(item.applicationId!);
                          } catch (err) {
                            setError(documentFormError(err));
                          } finally {
                            setOpening(false);
                          }
                        }}
                      >
                        <Folder size={15} />
                        <span>Mở hồ sơ liên quan</span>
                      </Button>
                    ) : (
                      <p className="flex items-center gap-1 px-1 text-xs font-medium text-amber-700">
                        <WarningCircle size={14} className="shrink-0" />
                        <span>Bản khai cũ chưa liên kết hồ sơ.</span>
                      </p>
                    )}
                  </div>
                </article>
              );
            })}
          </div>

          {/* Phân trang dưới đáy */}
          {query.data && query.data.totalPages > 1 && (
            <nav
              aria-label="Phân trang bản khai"
              className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 text-xs"
            >
              <p className="font-medium text-slate-600">
                {query.data.totalCount} tờ khai · Trang {page}/{Math.max(1, query.data.totalPages)}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="small"
                  disabled={page <= 1}
                  onClick={() => setPage((x) => x - 1)}
                  className="rounded-lg border-slate-200 text-slate-700 disabled:opacity-40"
                >
                  Bản khai trước
                </Button>
                <Button
                  variant="outline"
                  size="small"
                  disabled={page >= query.data.totalPages}
                  onClick={() => setPage((x) => x + 1)}
                  className="rounded-lg border-slate-200 text-slate-700 disabled:opacity-40"
                >
                  Bản khai sau
                </Button>
              </div>
            </nav>
          )}
        </>
      )}

      {/* WardMate DOCX Studio Modal */}
      {selected && user && (
        <Suspense
          fallback={
            <div
              className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-900/60 backdrop-blur-sm text-white"
              role="status"
              aria-label="Đang mở DOCX Studio"
            >
              <div className="flex flex-col items-center gap-3 rounded-2xl bg-slate-800/90 px-6 py-5 shadow-2xl border border-slate-700">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
                <p className="text-sm font-medium">Đang khởi tạo WardMate DOCX Studio…</p>
              </div>
            </div>
          }
        >
          <DocxOnlineEditor
            sourceKey={selected.id}
            title={cleanSubmissionFileName(selected.fileName)}
            subtitle="Xem nội dung tờ khai trực tuyến"
            author={user.profile?.fullName || user.username}
            readOnly
            onClose={() => setSelected(undefined)}
            load={async (signal) => {
              await documentFormApi.getSubmission(selected.id, user.id, signal);
              return documentFormApi.downloadSubmission(selected.id, user.id, signal);
            }}
          />
        </Suspense>
      )}
    </section>
  );
}
