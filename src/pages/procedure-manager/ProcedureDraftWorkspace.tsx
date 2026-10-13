import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  ArrowClockwise,
  ArrowLeft,
  ArrowsIn,
  ArrowsOut,
  ArrowSquareOut,
  CheckCircle,
  FilePdf,
  Info,
  StopCircle,
  Trash,
  UploadSimple,
  Warning,
} from "@phosphor-icons/react";
import { Button, ConfirmDeleteModal, Modal, TableSkeleton } from "@/components/ui";
import { ProcedureFeedback } from "@/components/ui/ProcedureFeedback";
import {
  procedureApi,
  procedureError,
  type Category,
  type ProcedureDraft,
  type Extraction,
} from "@/lib/api/procedures";
import { useProcedureQuery } from "@/hooks/useProcedureQuery";
import { ProcedureApiEditor, validateProcedure } from "./ProcedureApiEditor";
import { toast } from "@/components/ui/Toast";
import { useAuthStore } from "@/stores/authStore";

const labels: Record<string, string> = {
  Queued: "Chờ đọc PDF",
  Processing: "Đang đọc PDF",
  NeedsReview: "Cần đối soát",
  Failed: "Đọc PDF thất bại",
  Published: "Đã xuất bản",
};
const statusStyles: Record<string, string> = {
  Queued: "bg-blue-50 text-blue-700 ring-blue-200",
  Processing: "bg-amber-50 text-amber-800 ring-amber-200",
  NeedsReview: "bg-orange-50 text-orange-800 ring-orange-200",
  Failed: "bg-red-50 text-red-700 ring-red-200",
  Published: "bg-emerald-50 text-emerald-700 ring-emerald-200",
};
const fileSize = (bytes: number) =>
  bytes < 1024 * 1024
    ? `${Math.ceil(bytes / 1024)} KB`
    : `${(bytes / 1024 / 1024).toFixed(1)} MB`;

function ExtractionWarningBanner({ warnings }: { warnings: string[] }) {
  if (!warnings || warnings.length === 0) return null;

  return (
    <div className="space-y-2.5">
      {warnings.map((text, i) => {
        const isError = /429|502|503|504|401|403|quota|hạn mức|không thể|thất bại|lỗi/i.test(text);
        const isNotice = /trang|kiểm tra|đối soát|ít chữ|trống/i.test(text);

        return (
          <div
            key={i}
            className={`flex items-start gap-3 rounded-xl border p-3.5 text-sm leading-6 ${
              isError
                ? "border-red-200 bg-red-50/90 text-red-900"
                : isNotice
                  ? "border-amber-200 bg-amber-50/90 text-amber-900"
                  : "border-slate-200 bg-slate-50 text-slate-800"
            }`}
          >
            {isError ? (
              <Warning size={20} className="mt-0.5 shrink-0 text-red-600" weight="fill" />
            ) : isNotice ? (
              <Warning size={20} className="mt-0.5 shrink-0 text-amber-600" weight="fill" />
            ) : (
              <Info size={20} className="mt-0.5 shrink-0 text-slate-600" weight="fill" />
            )}
            <div className="min-w-0 flex-1">
              <span className="font-medium">{text}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
export function PdfSource({
  id,
  draft = false,
  versionId,
}: {
  id: string;
  draft?: boolean;
  versionId?: string;
}) {
  const [source, setSource] = useState<{ url: string; expires: number }>();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const fetchPdf = useCallback(async () => {
    setBusy(true);
    setError("");
    try {
      const result = versionId
        ? await procedureApi.versionSource(id, versionId)
        : await procedureApi.source(id, draft);
      setSource({
        url: result.url,
        expires: Date.now() + result.expiresInSeconds * 1000,
      });
    } catch (e) {
      setError(procedureError(e));
    } finally {
      setBusy(false);
    }
  }, [id, draft, versionId]);

  useEffect(() => {
    setSource(undefined);
    setError("");
    void fetchPdf();
  }, [fetchPdf]);

  useEffect(() => {
    if (!source) return;
    const timeout = window.setTimeout(
      () => setSource(undefined),
      Math.max(0, source.expires - Date.now()),
    );
    return () => window.clearTimeout(timeout);
  }, [source]);

  return (
    <section
      className={`flex flex-col bg-white overflow-hidden transition-all ${
        isFullscreen
          ? "fixed inset-4 z-50 rounded-2xl shadow-2xl ring-1 ring-slate-900/10"
          : "h-full w-full"
      }`}
    >
      <div className="flex h-10 shrink-0 items-center justify-between border-b border-slate-200 bg-slate-50/90 px-3.5 py-1.5">
        <span className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
          
        </span>
        <div className="flex items-center gap-1.5">
          {source && (
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-100 hover:text-slate-950 transition-colors"
              title="Mở tệp PDF trong tab mới của trình duyệt"
            >
              <ArrowSquareOut size={14} className="text-slate-600" />
              <span>Mở tab mới</span>
            </a>
          )}
          <Button
            size="small"
            variant="ghost"
            className="h-7 px-1.5 text-slate-600 hover:bg-slate-200"
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? "Thu nhỏ lại" : "Phóng to toàn màn hình"}
          >
            {isFullscreen ? <ArrowsIn size={14} /> : <ArrowsOut size={14} />}
          </Button>
        </div>
      </div>
      <div className="flex-1 min-h-0 bg-slate-100">
        <ProcedureFeedback error={error} retry={() => void fetchPdf()} />
        {source ? (
          <iframe
            title="PDF nguồn thủ tục"
            src={source.url}
            referrerPolicy="no-referrer"
            className="h-full w-full border-0 bg-white"
          />
        ) : !busy && !error ? (
          <div className="flex h-full items-center justify-center text-sm text-slate-500">
            Chưa có liên kết tệp PDF
          </div>
        ) : null}
      </div>
    </section>
  );
}

export function ProcedureDraftWorkspace({
  categories,
  onPublished,
  onPendingChange,
}: {
  categories: Category[];
  onPublished: () => void;
  onPendingChange: (pending: boolean) => void;
}) {
  const permissions = useAuthStore((state) => state.user?.permissions ?? []);
  const can = (permission: string) => permissions.includes(permission);
  const [params, setParams] = useSearchParams();
  const id = params.get("draft");
  const [page, setPage] = useState(1);
  const list = useProcedureQuery(
    useCallback(
      (signal: AbortSignal) => procedureApi.drafts(page, signal),
      [page],
    ),
  );
  const [draft, setDraft] = useState<ProcedureDraft>();
  const [payload, setPayload] = useState<Record<string, unknown>>({});
  const [preview, setPreview] = useState<Extraction>();
  const [file, setFile] = useState<File>();
  const [uploadMode, setUploadMode] = useState<"draft" | "preview">("draft");
  const [previewConfirmed, setPreviewConfirmed] = useState(false);
  const [pdfUrl, setPdfUrl] = useState("");
  const [previewMode, setPreviewMode] = useState<"pdf" | "text">("pdf");
  const [busy, setBusy] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [reload, setReload] = useState(0);
  const [fullscreenPreviewPdf, setFullscreenPreviewPdf] = useState(false);
  const [showWarningsModal, setShowWarningsModal] = useState(false);
  const [deleting, setDeleting] = useState<{ id: string; name: string }>();
  const previewController = useRef<AbortController | null>(null);
  const fileInput = useRef<HTMLInputElement | null>(null);
  const lock = useRef(false);
  useEffect(() => {
    onPendingChange(dirty || busy || deleteBusy);
    return () => onPendingChange(false);
  }, [dirty, busy, deleteBusy, onPendingChange]);
  useEffect(() => () => previewController.current?.abort(), []);
  useEffect(() => {
    if (!file) {
      setPdfUrl("");
      return;
    }
    const url = URL.createObjectURL(file);
    setPdfUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  useEffect(() => {
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    setDraft(undefined);
    setError("");
    setConfirmed(false);
    setDirty(false);
    if (!id) {
      setLoading(false);
      return () => controller.abort();
    }
    setLoading(true);
    const load = async () => {
      try {
        const next = await procedureApi.draft(id, controller.signal);
        if (controller.signal.aborted) return;
        setDraft(next);
        setPayload(next.payload);
        setLoading(false);
        if (["Queued", "Processing"].includes(next.status))
          timer = setTimeout(load, 4000);
      } catch (e) {
        if (!controller.signal.aborted) {
          setError(procedureError(e));
          setLoading(false);
        }
      }
    };
    void load();
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [id, reload]);
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  const resetUpload = () => {
    previewController.current?.abort();
    previewController.current = null;
    setPreviewing(false);
    setPreview(undefined);
    setPreviewMode("pdf");
    setPreviewConfirmed(false);
    setFile(undefined);
    if (fileInput.current) fileInput.current.value = "";
  };
  const select = (next?: string) => {
    resetUpload();
    const query = new URLSearchParams(params);
    if (next) query.set("draft", next);
    else query.delete("draft");
    setParams(query);
  };
  const run = async (action: () => Promise<void>) => {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      await action();
    } catch (e) {
      setError(procedureError(e));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  const handleDeleteDraft = async () => {
    if (!deleting || deleteBusy) return;
    setDeleteBusy(true);
    setDeleteError("");
    try {
      await procedureApi.deleteDraft(deleting.id);
      const wasOpen = id === deleting.id;
      setDeleting(undefined);
      if (wasOpen) select();
      list.refresh();
      toast.success("Đã xóa bản nháp thành công.");
    } catch (e) {
      const msg = procedureError(e);
      setDeleteError(msg);
      toast.error(msg);
    } finally {
      setDeleteBusy(false);
    }
  };
  const editable = draft && can("procedure.drafts.update") && ["NeedsReview", "Failed"].includes(draft.status);

  if (id) {
    return (
      <div className="flex h-screen flex-col overflow-hidden bg-slate-100">
        <ProcedureFeedback loading={loading} />
        {!draft && !loading && (
          <div className="flex h-full flex-col items-center justify-center p-6 text-center">
            <p className="mb-4 text-slate-600">Không tìm thấy hoặc không thể tải bản nháp.</p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => select()}>
                <ArrowLeft size={16} /> Quay lại danh sách
              </Button>
              <Button variant="outline" onClick={() => setReload((v) => v + 1)}>
                <ArrowClockwise size={16} /> Thử tải lại
              </Button>
            </div>
          </div>
        )}

        {draft && (
          <>
            {/* Studio Top Navigation Bar */}
            <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6 z-20 shadow-xs">
              <div className="flex items-center gap-3 min-w-0">
                <Button
                  variant="ghost"
                  size="small"
                  className="h-9 px-2 text-slate-700 hover:bg-slate-100"
                  disabled={busy}
                  onClick={() => {
                    if (dirty && !window.confirm("Bạn có thay đổi chưa lưu. Bạn có chắc chắn muốn thoát về danh sách?")) {
                      return;
                    }
                    select();
                  }}
                  title="Quay lại danh sách bản nháp"
                >
                  <ArrowLeft size={16} />
                  <span className="hidden sm:inline font-semibold">Danh sách bản nháp</span>
                </Button>

                <div className="h-4 w-px bg-slate-200 hidden sm:block" />

                <div className="flex items-center gap-2 min-w-0">
                  <FilePdf size={20} className="text-red-700 shrink-0" weight="fill" />
                  <span className="truncate text-sm font-bold text-slate-900 max-w-[200px] md:max-w-md" title={draft.pdfFileName}>
                    {draft.pdfFileName}
                  </span>
                  <span className={`hidden sm:inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${statusStyles[draft.status] ?? "bg-slate-100 text-slate-700 ring-slate-200"}`}>
                    {labels[draft.status] ?? draft.status}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {/* Nút xem cảnh báo AI (nếu có) */}
                {(draft.warnings.length > 0 || draft.failureCode) && (
                  <Button
                    size="small"
                    variant="outline"
                    className="h-9 gap-1.5 border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100"
                    onClick={() => setShowWarningsModal(true)}
                  >
                    <Warning size={16} className="text-amber-600" weight="fill" />
                    <span>{draft.warnings.length} lưu ý từ AI</span>
                  </Button>
                )}

                {dirty && (
                  <span className="hidden md:inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800 ring-1 ring-amber-200">
                    <span className="size-1.5 rounded-full bg-amber-600 animate-pulse" />
                    Chưa lưu thay đổi
                  </span>
                )}

                {can("procedure.drafts.delete") && (
                  <Button
                    size="small"
                    variant="ghost"
                    className="h-9 text-slate-500 hover:bg-red-50 hover:text-red-700"
                    disabled={busy || dirty}
                    onClick={() => {
                      setDeleting({ id: draft.id, name: draft.pdfFileName });
                      setDeleteError("");
                    }}
                    title="Xóa bản nháp và tệp PDF"
                  >
                    <Trash size={16} />
                  </Button>
                )}
              </div>
            </header>

            {/* Split Screen Workspace - 50/50 Dual Pane */}
            <div className="flex flex-1 min-h-0 divide-x divide-slate-200">
              {/* Left Column: PDF Source (50%) */}
              <div className="flex w-1/2 flex-col min-w-0 bg-slate-900 overflow-hidden">
                <PdfSource id={draft.id} draft />
              </div>

              {/* Right Column: Procedure Form Editor (50%) */}
              <div className="flex w-1/2 flex-col min-w-0 bg-white overflow-hidden relative">
                {/* Scrollable Form Body */}
                <div className="flex-1 overflow-y-auto px-6 py-5">
                  <div className="mx-auto max-w-4xl space-y-6">
                    <ProcedureApiEditor
                      value={payload}
                      onChange={(next) => {
                        setPayload(next);
                        setDirty(true);
                        setConfirmed(false);
                      }}
                      categories={categories}
                      disabled={!editable || busy}
                    />

                    <div className="mt-8 border-t border-slate-100 pt-4">
                      <details className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                        <summary className="cursor-pointer text-xs font-bold uppercase tracking-wider text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700">
                          Văn bản nhận diện từ PDF (AI OCR Text)
                        </summary>
                        <pre className="mt-3 max-h-60 overflow-auto whitespace-pre-wrap break-words rounded-lg border border-slate-200 bg-slate-950 p-3 font-mono text-xs text-slate-100">
                          {draft.extractedText || "Chưa nhận diện được nội dung."}
                        </pre>
                      </details>
                    </div>
                  </div>
                </div>

                {/* Sticky Action Footer */}
                {editable && (
                  <div className="shrink-0 border-t border-slate-200 bg-white/95 px-6 py-3.5 backdrop-blur-xs shadow-lg z-10">
                    <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-4">
                      <label className="flex cursor-pointer items-center gap-2 select-none text-xs text-slate-700">
                        <input
                          type="checkbox"
                          className="size-4 rounded border-slate-300 text-red-700 focus:ring-red-600"
                          checked={confirmed}
                          disabled={busy}
                          onChange={(e) => setConfirmed(e.target.checked)}
                        />
                        <span>Tôi đã đối soát kỹ thông tin với bản PDF gốc và xác nhận tính chuẩn xác.</span>
                      </label>
                      <div className="flex items-center gap-2.5">
                        <Button
                          variant="ghost"
                          size="small"
                          disabled={!dirty || busy}
                          onClick={() => {
                            if (window.confirm("Hủy mọi thay đổi chưa lưu và khôi phục nội dung ban đầu?")) {
                              setPayload(draft.payload);
                              setDirty(false);
                              setConfirmed(false);
                            }
                          }}
                        >
                          Hủy thay đổi
                        </Button>
                        {draft.status === "Failed" && can("procedure.drafts.extract") && (
                          <Button
                            disabled={busy || dirty}
                            variant="outline"
                            size="small"
                            onClick={() =>
                              void run(async () => {
                                await procedureApi.retryDraft(
                                  draft.id,
                                  draft.revision,
                                );
                                setReload((v) => v + 1);
                              })
                            }
                          >
                            <ArrowClockwise size={14} /> Thử đọc lại PDF
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="small"
                          disabled={!dirty || busy}
                          loading={busy}
                          onClick={() =>
                            void run(async () => {
                              const next = await procedureApi.saveDraft(
                                draft.id,
                                draft.revision,
                                payload,
                              );
                              setDraft(next);
                              setPayload(next.payload);
                              setDirty(false);
                              toast.success("Đã lưu bản nháp thành công.");
                            })
                          }
                        >
                          Lưu bản nháp
                        </Button>
                        {can("procedure.drafts.update") && can("procedure.drafts.publish") && (
                          <Button
                            size="small"
                            disabled={!confirmed || busy}
                            loading={busy}
                            onClick={() =>
                              void run(async () => {
                                validateProcedure(payload);
                                const saved = await procedureApi.saveDraft(
                                  draft.id,
                                  draft.revision,
                                  payload,
                                );
                                setDraft(saved);
                                setPayload(saved.payload);
                                setDirty(false);
                                try {
                                  await procedureApi.publishDraft(
                                    saved.id,
                                    saved.revision,
                                  );
                                } catch (e) {
                                  const latest = await procedureApi
                                    .draft(saved.id)
                                    .catch(() => undefined);
                                  if (latest?.status !== "Published") throw e;
                                }
                                toast.success("Đã xuất bản thủ tục thành công.");
                                setReload((v) => v + 1);
                                onPublished?.();
                              })
                            }
                          >
                            Xác nhận xuất bản
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {draft && (
          <Modal
            open={showWarningsModal}
            onOpenChange={setShowWarningsModal}
            title="Lưu ý đối soát từ AI"
            description={`Tài liệu: ${draft.pdfFileName}`}
          >
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              {draft.failureCode && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-900 flex items-start gap-2.5">
                  <Warning size={18} className="shrink-0 text-red-600 mt-0.5" weight="fill" />
                  <span>Không đọc được PDF ({draft.failureCode}). Bạn có thể nhập tay hoặc thử đọc lại.</span>
                </div>
              )}
              <ExtractionWarningBanner warnings={draft.warnings} />
              <div className="mt-4 flex justify-end">
                <Button size="small" variant="outline" onClick={() => setShowWarningsModal(false)}>
                  Đã hiểu và tiếp tục
                </Button>
              </div>
            </div>
          </Modal>
        )}
        <ConfirmDeleteModal
          open={!!deleting}
          onOpenChange={(open) => {
            if (!open && !deleteBusy) setDeleting(undefined);
          }}
          title="Xóa bản nháp thủ tục"
          itemName={deleting?.name}
          description="Tệp PDF nguồn và dữ liệu bản nháp sẽ bị xóa vĩnh viễn."
          loading={deleteBusy}
          onConfirm={() => void handleDeleteDraft()}
        >
          <ProcedureFeedback error={deleteError} />
        </ConfirmDeleteModal>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">PDF và bản nháp thủ tục</h1>
      <ProcedureFeedback error={error} />
        <>
          <section className="admin-card overflow-hidden">
            <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white px-4 py-3 sm:px-5">
              <div className="flex items-start gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-800 ring-1 ring-red-100">
                  <FilePdf size={20} weight="duotone" />
                </span>
                <div>
                  <h2 className="text-sm font-bold text-slate-950">Tạo bản nháp từ PDF</h2>
                </div>
              </div>
            </div>
            <div className="space-y-3 p-4 sm:p-5">
              <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Cách xử lý PDF">
                <button type="button" role="radio" aria-checked={uploadMode === "draft"} onClick={() => { setUploadMode("draft"); setPreview(undefined); setPreviewConfirmed(false); }} className={`min-h-24 rounded-xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 ${uploadMode === "draft" ? "border-red-300 bg-red-50 ring-1 ring-red-200" : "border-slate-200 bg-white hover:border-slate-300"}`}>
                  <span className="flex items-center justify-between gap-2"><strong className="text-sm text-slate-950">Tạo bản nháp có PDF gốc</strong><span className="rounded-full bg-red-900 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">Khuyến nghị</span></span>
                  <span className="mt-1.5 block text-xs leading-5 text-slate-600">Lưu tệp để kiểm tra, chỉnh sửa và công khai sau.</span>
                </button>
                <button type="button" role="radio" aria-checked={uploadMode === "preview"} onClick={() => setUploadMode("preview")} className={`min-h-24 rounded-xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 ${uploadMode === "preview" ? "border-amber-300 bg-amber-50 ring-1 ring-amber-200" : "border-slate-200 bg-white hover:border-slate-300"}`}>
                  <strong className="text-sm text-slate-950">Xem và nhận diện nội dung</strong>
                  <span className="mt-1.5 block text-xs leading-5 text-slate-600">{can("procedure.publish") ? "Kiểm tra nội dung và công khai ngay. Tệp PDF sẽ không được lưu." : "Xem tài liệu và nội dung nhận diện. Bạn chưa có quyền công khai thủ tục."}</span>
                </button>
              </div>
              <label className={`group flex min-h-20 cursor-pointer items-center gap-3 rounded-xl border border-dashed px-4 py-3 transition focus-within:border-red-700 focus-within:ring-4 focus-within:ring-red-100 ${file ? "border-red-300 bg-red-50/40" : "border-slate-300 bg-slate-50/60 hover:border-red-300 hover:bg-red-50/30"}`}>
                <input
                  ref={fileInput}
                  className="sr-only"
                  aria-label="PDF mô tả thủ tục (tối đa 20 MB)"
                  type="file"
                  accept=".pdf,application/pdf"
                  disabled={busy || (!can("procedure.drafts.upload") && !can("procedure.drafts.extract"))}
                  onChange={(event) => {
                    setFile(event.target.files?.[0]);
                    setPreview(undefined);
                    setPreviewMode("pdf");
                    setPreviewConfirmed(false);
                  }}
                />
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white text-red-800 shadow-sm ring-1 ring-slate-200"><UploadSimple size={21} weight="duotone" /></span>
                <span className="min-w-0 text-left">
                  <span className="block truncate text-sm font-bold text-slate-900">{file ? file.name : "Chọn tệp PDF từ máy"}</span>
                  <span className="mt-0.5 block text-xs text-slate-500">{file ? `${fileSize(file.size)} · Bấm để chọn tệp khác` : "PDF tối đa 20 MB"}</span>
                </span>
              </label>
            <div>
              {uploadMode === "draft" && can("procedure.drafts.upload") && <Button
                disabled={!file}
                loading={busy}
                className="min-h-11 w-full justify-center"
                onClick={() =>
                  void run(async () => {
                    const result = await procedureApi.upload(file!);
                    select(result.id);
                    list.refresh();
                    toast.success("Đã lưu PDF và tạo bản nháp.");
                  })
                }
              >
                Tạo bản nháp và lưu PDF
              </Button>}
              {uploadMode === "preview" && can("procedure.drafts.extract") && (
                <div className="space-y-2">
                  <Button
                    disabled={!file || busy || previewing}
                    loading={previewing}
                    className="min-h-11 w-full justify-center"
                    onClick={() =>
                      void run(async () => {
                        const controller = new AbortController();
                        previewController.current = controller;
                        setPreviewing(true);
                        try {
                          setPreview(await procedureApi.preview(file!, controller.signal));
                        } finally {
                          if (previewController.current === controller) previewController.current = null;
                          setPreviewing(false);
                        }
                      })
                    }
                  >
                    {previewing ? "Đang nhận diện qua AI..." : "Xem và nhận diện PDF"}
                  </Button>
                  {previewing && (
                    <div className="flex items-center justify-between gap-3 rounded-xl border border-blue-200 bg-blue-50/80 p-3 text-xs text-blue-900">
                      <div className="flex items-center gap-2">
                        <span className="size-2 animate-pulse rounded-full bg-blue-600" aria-hidden="true" />
                        <span>Đang trích xuất văn bản PDF và phân tích cấu trúc thủ tục bằng AI...</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="small"
                        className="h-8 text-xs text-blue-800 hover:bg-blue-100"
                        onClick={() => previewController.current?.abort()}
                      >
                        <StopCircle size={15} /> Dừng
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
            {preview && (
              <section className="overflow-hidden rounded-2xl border border-amber-200 bg-amber-50/30">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-200 bg-amber-50 px-4 py-3">
                  <div className="flex items-center gap-2"><CheckCircle size={20} className="text-amber-800" weight="fill" /><h2 className="font-bold text-slate-950">Kết quả nhận diện AI</h2></div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-amber-900 ring-1 ring-amber-200">Chưa lưu bản nháp</span>
                </div>
                <div className="space-y-4 p-4">
                <ExtractionWarningBanner warnings={preview.warnings} />
                <div className="inline-flex rounded-xl bg-slate-100 p-1 text-sm font-semibold" role="tablist" aria-label="Nội dung xem trước PDF">
                  <button type="button" role="tab" aria-selected={previewMode === "pdf"} onClick={() => setPreviewMode("pdf")} className={`min-h-10 rounded-lg px-4 transition ${previewMode === "pdf" ? "bg-white text-red-900 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}>PDF gốc</button>
                  <button type="button" role="tab" aria-selected={previewMode === "text"} onClick={() => setPreviewMode("text")} className={`min-h-10 rounded-lg px-4 transition ${previewMode === "text" ? "bg-white text-red-900 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}>Văn bản nhận diện</button>
                </div>
                {previewMode === "pdf" && pdfUrl ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-600">
                      <span>Xem trực tiếp nội dung PDF đã tải lên:</span>
                      <div className="flex items-center gap-2">
                        <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold text-red-800 hover:underline">
                          <ArrowsOut size={13} /> Mở tab mới
                        </a>
                        <Button
                          type="button"
                          variant="ghost"
                          size="small"
                          className="h-7 text-xs"
                          onClick={() => setFullscreenPreviewPdf(!fullscreenPreviewPdf)}
                        >
                          {fullscreenPreviewPdf ? <ArrowsIn size={14} /> : <ArrowsOut size={14} />}
                          <span>{fullscreenPreviewPdf ? "Thu nhỏ" : "Toàn màn hình"}</span>
                        </Button>
                      </div>
                    </div>
                    <div className={fullscreenPreviewPdf ? "fixed inset-4 z-50 rounded-2xl bg-white p-3 shadow-2xl ring-1 ring-slate-900/10" : ""}>
                      {fullscreenPreviewPdf && (
                        <div className="mb-2 flex justify-end">
                          <Button size="small" variant="outline" onClick={() => setFullscreenPreviewPdf(false)}>
                            <ArrowsIn size={14} /> Đóng toàn màn hình
                          </Button>
                        </div>
                      )}
                      <iframe
                        title="Tệp PDF đang xem"
                        src={pdfUrl}
                        className={`w-full rounded-xl border border-slate-200 bg-white ${fullscreenPreviewPdf ? "h-[calc(100%-40px)]" : "h-[75vh] min-h-[500px]"}`}
                      />
                    </div>
                  </div>
                ) : (
                  <pre className="max-h-96 overflow-auto whitespace-pre-wrap break-words rounded-xl border border-slate-200 bg-slate-950 p-4 font-mono text-xs leading-6 text-slate-100">{preview.extractedText}</pre>
                )}
                <details open className="rounded-xl border border-slate-200 bg-white">
                  <summary className="cursor-pointer px-4 py-3 text-sm font-bold text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-red-700">Kiểm tra thông tin đã nhận diện</summary>
                  <div className="border-t border-slate-200 p-4"><ProcedureApiEditor value={preview.payload} onChange={(payload) => { setPreview({ ...preview, payload }); setPreviewConfirmed(false); }} categories={categories} disabled={!can("procedure.publish") || busy} /></div>
                </details>
                {can("procedure.publish") && (
                  <div className="space-y-3 rounded-xl border border-red-200 bg-red-50/60 p-4">
                    <p className="text-sm leading-6 text-red-950"><strong>Kiểm tra kỹ trước khi công khai.</strong> Nếu trùng mã thủ tục, nội dung hiện tại sẽ được thay bằng nội dung này.</p>
                    <label className="flex items-start gap-3 text-sm font-medium text-slate-800"><input type="checkbox" className="mt-1" checked={previewConfirmed} disabled={busy} onChange={(event) => setPreviewConfirmed(event.target.checked)} /><span>Tôi đã kiểm tra nội dung và đồng ý công khai.</span></label>
                    <Button disabled={!previewConfirmed || busy} loading={busy} onClick={() => void run(async () => { const data = validateProcedure(preview.payload); await procedureApi.publish(data); toast.success("Đã công khai thủ tục."); resetUpload(); onPublished(); })}>Công khai thủ tục</Button>
                  </div>
                )}
                </div>
              </section>
            )}
            </div>
          </section>
          <ProcedureFeedback
            error={list.error}
            retry={list.refresh}
          />
          {list.loading ? <TableSkeleton columns={3} /> : <div className="admin-card overflow-hidden">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="font-bold text-slate-950">Bản nháp gần đây</h2>
            </div>
            <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr>
                  <th className="p-4">PDF</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {list.data?.map((row) => (
                  <tr key={row.id} className="border-t">
                    <td className="p-4 font-medium text-slate-900">
                      {row.pdfFileName}
                    </td>
                    <td>
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${statusStyles[row.status] ?? "bg-slate-100 text-slate-700 ring-slate-200"}`}>
                        {labels[row.status] ?? row.status}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        {can("procedure.drafts.read") && <Button
                          size="small"
                          variant="outline"
                          onClick={() => select(row.id)}
                        >
                          Mở bản nháp
                        </Button>}
                        {can("procedure.drafts.delete") && <Button
                          size="small"
                          variant="ghost"
                          className="text-slate-600 hover:bg-red-50 hover:text-red-700"
                          onClick={() => {
                            setDeleting({ id: row.id, name: row.pdfFileName });
                            setDeleteError("");
                          }}
                        >
                          <Trash size={15} /> Xóa
                        </Button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {list.data?.length === 0 && (
              <div className="px-5 py-12 text-center"><FilePdf size={32} className="mx-auto text-slate-300" /><p className="mt-3 font-semibold text-slate-700">Chưa có bản nháp</p></div>
            )}
            </div>
          </div>}
          {!list.loading && <div className="flex items-center gap-3">
            <Button
              variant="outline"
              disabled={page === 1 || list.loading}
              onClick={() => setPage((value) => value - 1)}
            >
              Trước
            </Button>
            <span>Trang {page}</span>
            <Button
              variant="outline"
              disabled={list.loading || (list.data?.length ?? 0) < 10}
              onClick={() => setPage((value) => value + 1)}
            >
              Sau
            </Button>
          </div>}
        </>








      <ConfirmDeleteModal
        open={!!deleting}
        onOpenChange={(open) => {
          if (!open && !deleteBusy) setDeleting(undefined);
        }}
        title="Xóa bản nháp thủ tục"
        itemName={deleting?.name}
        description="Tệp PDF nguồn và dữ liệu bản nháp sẽ bị xóa vĩnh viễn."
        loading={deleteBusy}
        onConfirm={() => void handleDeleteDraft()}
      >
        <ProcedureFeedback error={deleteError} />
      </ConfirmDeleteModal>
    </div>
  );
}
