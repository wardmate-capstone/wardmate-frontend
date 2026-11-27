import { ProcedureValidationError, type ProcedureIssue } from '@/lib/procedureValidation';
import { draftPublishIssues, issuesFromServerErrors, prepareDraftPayloadForPublish } from '@/lib/draftPublishChecks';
import { formatDateTime } from '@/lib/dateFormat';
import axios from "axios";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQueries, useQueryClient } from "@tanstack/react-query";
import {
  ArrowArcLeft,
  ArrowClockwise,
  ArrowLeft,
  ArrowsIn,
  ArrowsOut,
  ArrowSquareOut,
  CheckCircle,
  FilePdf,
  StopCircle,
  Trash,
  UploadSimple,
  Warning,
} from "@phosphor-icons/react";
import { Button, ConfirmDeleteModal, Modal, Skeleton, ErrorAlert } from "@/components/ui";
import { ProcedureFeedback } from "@/components/ui/ProcedureFeedback";
import {
  procedureApi,
  procedureError,
  type Category,
  type ProcedureDetail,
  type ProcedureDraft,
  type Extraction,
} from "@/lib/api/procedures";
import { useProcedureQuery } from "@/hooks/useProcedureQuery";
import { ProcedureApiEditor, validateProcedure } from "./ProcedureApiEditor";
import { toast } from "@/components/ui/Toast";
import { useAuthStore } from "@/stores/authStore";

/** WF-CASE-01 / AI-02b: chỉ hiện cảnh báo bóc tách về giấy tờ và trường hợp (các lưu ý AI khác đã bỏ vì khó hiểu). */
const caseExtractionNotes = (warnings?: string[] | null) =>
  (warnings ?? []).filter(w => /^(checklistSchema|contentPayload\.cases):/.test(w));

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

export function PdfSource({
  id,
  draft = false,
  versionId,
  allowFullscreen = true,
  uploadable = false,
  manager = false,
  onUploaded,
}: {
  id: string;
  draft?: boolean;
  versionId?: string;
  allowFullscreen?: boolean;
  /** Cho Procedure Manager gắn/thay PDF gốc (API 32a) cho thủ tục nhập tay */
  uploadable?: boolean;
  /** Màn quản trị: đọc PDF qua API 32b (cả thủ tục đang ẩn) */
  manager?: boolean;
  onUploaded?: () => void;
}) {
  const [source, setSource] = useState<{ url: string; expires: number }>();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  // Thủ tục nhập tay chưa từng gắn PDF: BE trả 404 draft.source_not_found
  const [missing, setMissing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const canUpload = uploadable && !draft && !versionId;

  const fetchPdf = useCallback(async () => {
    setBusy(true);
    setError("");
    setMissing(false);
    try {
      const result = versionId
        ? await procedureApi.versionSource(id, versionId)
        : manager && !draft
          ? await procedureApi.managerSource(id)
          : await procedureApi.source(id, draft);
      setSource({
        url: result.url,
        expires: Date.now() + result.expiresInSeconds * 1000,
      });
    } catch (e) {
      if (!draft && !versionId && axios.isAxiosError(e) && e.response?.status === 404 && (e.response.data as { code?: string } | undefined)?.code === "draft.source_not_found") setMissing(true);
      else setError(procedureError(e));
    } finally {
      setBusy(false);
    }
  }, [id, draft, versionId, manager]);

  const uploadPdf = async (file: File) => {
    if (uploading) return;
    setUploading(true);
    setUploadError("");
    try {
      await procedureApi.uploadSource(id, file);
      toast.success("Đã gắn PDF gốc cho thủ tục và lưu thêm một phiên bản.");
      onUploaded?.();
      await fetchPdf();
    } catch (e) {
      setUploadError(procedureError(e));
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  };

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
          {canUpload && (
            <input
              ref={fileInput}
              type="file"
              accept="application/pdf,.pdf"
              className="sr-only"
              tabIndex={-1}
              aria-hidden="true"
              onChange={(e) => { const file = e.target.files?.[0]; if (file) void uploadPdf(file); }}
            />
          )}
          {canUpload && source && (
            <Button
              size="small"
              variant="ghost"
              className="h-7 px-2 text-xs text-slate-700 hover:bg-slate-200"
              loading={uploading}
              onClick={() => fileInput.current?.click()}
              title="Tải PDF khác để thay PDF gốc (lưu thêm một phiên bản)"
            >
              <UploadSimple size={14} aria-hidden="true" />
              Thay PDF
            </Button>
          )}
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
          {allowFullscreen && <Button
            size="small"
            variant="ghost"
            className="h-7 px-1.5 text-slate-600 hover:bg-slate-200"
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? "Thu nhỏ lại" : "Phóng to toàn màn hình"}
            aria-label={isFullscreen ? "Thu nhỏ lại" : "Phóng to toàn màn hình"}
          >
            {isFullscreen ? <ArrowsIn size={14} /> : <ArrowsOut size={14} />}
          </Button>}
        </div>
      </div>
      <div className="flex-1 min-h-0 bg-slate-100">
        <ProcedureFeedback error={error} retry={() => void fetchPdf()} />
        {uploadError && source && (
          <ErrorAlert className="m-3">{uploadError}</ErrorAlert>
        )}
        {missing ? (
          <div className="flex h-full min-h-56 flex-col items-center justify-center gap-3 p-6 text-center">
            <span className="grid size-12 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-500">
              <FilePdf size={26} weight="duotone" aria-hidden="true" />
            </span>
            <div className="max-w-md space-y-1">
              <p className="font-semibold text-slate-900">Thủ tục chưa có PDF gốc</p>
              <p className="text-sm leading-6 text-slate-600">
                {canUpload
                  ? "Thủ tục này được nhập tay nên chưa có văn bản nguồn. Tải PDF gốc (tối đa 20 MB) để cán bộ đối chiếu khi xử lý hồ sơ."
                  : "Thủ tục này được nhập tay nên chưa có văn bản nguồn để xem."}
              </p>
            </div>
            {uploadError && (
              <ErrorAlert className="max-w-md">{uploadError}</ErrorAlert>
            )}
            {canUpload && (
              <Button loading={uploading} onClick={() => fileInput.current?.click()}>
                <UploadSimple size={18} aria-hidden="true" />
                Tải PDF gốc
              </Button>
            )}
          </div>
        ) : source ? (
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

function normalizeDraftPayload(rawPayload: Record<string, unknown>): Record<string, unknown> {
  if (!rawPayload || typeof rawPayload !== 'object') return rawPayload;
  const forms = (rawPayload as { formDefinitions?: unknown[] }).formDefinitions;
  if (!Array.isArray(forms)) return rawPayload;
  const formDefinitions = forms.map((f: unknown) => {
    const item = (f && typeof f === 'object' ? f : {}) as Record<string, unknown>;
    return {
      ...item,
      formType: item.formType === 'ONLINE_INTERACTIVE' ? 'ONLINE_INTERACTIVE' : 'DOCX_TEMPLATE',
      formTemplateId: item.formTemplateId || null,
    };
  });
  const result: Record<string, unknown> = { ...rawPayload, formDefinitions };
  if (Array.isArray(rawPayload.checklistSchema)) result.checklistSchema = relinkChecklistFormCodes(rawPayload.checklistSchema, formDefinitions);
  return result;
}

/**
 * Sửa liên kết giấy tờ ↔ biểu mẫu bị lệch hoa/thường.
 * Bản nháp cũ khi tạo phôi DOCX bị đổi mã biểu mẫu sang chữ hoa ("Mẫu số 3" → "MẪU SỐ 3") trong khi
 * giấy tờ vẫn giữ mã gốc, nên báo "không có ở tab Biểu mẫu". Chỉ đổi khi khớp đúng một mã (không phân biệt hoa thường).
 */
function relinkChecklistFormCodes(checklist: unknown, forms: Record<string, unknown>[]): unknown {
  if (!Array.isArray(checklist)) return checklist;
  const codes = [...new Set(forms.map(f => f.formCode).filter((c): c is string => typeof c === 'string' && c.length > 0))];
  const fold = (code: string) => code.trim().toLocaleUpperCase('vi');
  let changed = false;
  const next = checklist.map((row: unknown) => {
    const item = (row && typeof row === 'object' ? row : {}) as Record<string, unknown>;
    if (!Array.isArray(item.formCodes)) return row;
    const formCodes = item.formCodes.map((code: unknown) => {
      if (typeof code !== 'string' || codes.includes(code)) return code;
      const matches = codes.filter(c => fold(c) === fold(code));
      if (matches.length !== 1) return code;
      changed = true;
      return matches[0];
    });
    return { ...item, formCodes: [...new Set(formCodes)] };
  });
  return changed ? next : checklist;
}

export function ProcedureDraftWorkspace({
  categories,
  onPublished,
  onPendingChange,
  onOpenProcedure,
}: {
  categories: Category[];
  /** Thủ tục vừa xuất bản (undefined nếu chỉ xác nhận được qua trạng thái bản nháp) */
  onPublished: (published?: ProcedureDetail) => void;
  onPendingChange: (pending: boolean) => void;
  /** Mở màn chi tiết thủ tục để công khai / hủy xuất bản */
  onOpenProcedure?: (procedure: ProcedureDetail) => void;
}) {
  const permissions = useAuthStore((state) => state.user?.permissions ?? []);
  const can = (permission: string) => permissions.includes(permission);
  /**
   * PROC-UNPUBLISH-01: xuất bản không còn tự công khai. Thủ tục mới ở trạng thái ẩn,
   * người quản lý phải bấm "Mở công khai" ở màn chi tiết; trùng mã thì giữ nguyên trạng thái cũ.
   */
  const notifyPublished = (published: ProcedureDetail | undefined, forms: unknown) => {
    const rows = Array.isArray(forms) ? (forms as Array<{ formTemplateId?: unknown; formName?: string }>) : [];
    const unlinked = rows.filter((f) => !f.formTemplateId);
    const sampleNames = unlinked.map(f => f.formName ? `"${f.formName}"` : '').filter(Boolean).slice(0, 2);
    const formsNote = unlinked.length
      ? ` Có ${unlinked.length} biểu mẫu chưa gắn tệp phôi DOCX${sampleNames.length ? `: ${sampleNames.join(', ')}${unlinked.length > 2 ? '...' : ''}` : ''}; bổ sung sau tại "Danh sách biểu mẫu".`
      : '';
    const message = published?.isActive
      ? `Đã xuất bản và cập nhật thủ tục đang công khai.${formsNote}`
      : `Đã xuất bản, chưa công khai. Người dân chưa thấy thủ tục này cho tới khi bạn bấm "Mở công khai" ở màn chi tiết thủ tục.${formsNote}`;
    const action = published && onOpenProcedure ? { label: 'Mở thủ tục', onClick: () => onOpenProcedure(published) } : undefined;
    const options = { duration: 10000, action };
    if (unlinked.length) toast.warning(message, options);
    else toast.success(message, options);
  };
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
  const [preferredUploadMode, setPreferredUploadMode] = useState<"draft" | "preview">("draft");
  const canUpload = can("procedure.drafts.upload");
  const canPreview = can("procedure.drafts.extract");
  const uploadMode = canUpload && canPreview ? preferredUploadMode : canUpload ? "draft" : "preview";
  const [previewConfirmed, setPreviewConfirmed] = useState(false);
  const [pdfUrl, setPdfUrl] = useState("");
  const [previewMode, setPreviewMode] = useState<"pdf" | "text">("pdf");
  const [busy, setBusy] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [publishingDraft, setPublishingDraft] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [validationError, setValidationError] = useState<ProcedureValidationError | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [reload, setReload] = useState(0);
  const [fullscreenPreviewPdf, setFullscreenPreviewPdf] = useState(false);
  const [deleting, setDeleting] = useState<{ id: string; name: string }>();
  // PROC-UNPUBLISH-01: hủy xuất bản ngay từ danh sách bản nháp
  const queryClient = useQueryClient();
  const [unpublishing, setUnpublishing] = useState<{ procedureId: string; name: string }>();
  const [unpublishBusy, setUnpublishBusy] = useState(false);
  const [unpublishError, setUnpublishError] = useState("");
  // Tải trạng thái thủ tục của các bản nháp đã xuất bản (tối đa 10 dòng/trang) để biết dòng nào hủy xuất bản được
  const publishedIds = [...new Set((list.data ?? []).filter((row) => row.status === "Published" && row.publishedProcedureId).map((row) => row.publishedProcedureId!))];
  const publishedDetails = useQueries({
    queries: publishedIds.map((procedureId) => ({
      queryKey: ["procedure-manager-detail", procedureId],
      queryFn: ({ signal }: { signal: AbortSignal }) => procedureApi.managerDetail(procedureId, signal),
      enabled: can("procedure.publish"),
      retry: false,
      staleTime: 0, // luôn lấy trạng thái mới khi quay lại danh sách (có thể vừa công khai ở màn chi tiết)
    })),
  });
  const publishedState = (procedureId?: string | null) => {
    if (!procedureId) return undefined;
    const detail = publishedDetails[publishedIds.indexOf(procedureId)]?.data;
    if (!detail) return undefined;
    return {
      detail,
      canUnpublish: !detail.isActive && !detail.firstPublishedAt,
      label: detail.isActive ? "Đang công khai" : detail.firstPublishedAt ? "Đã ẩn" : "Chưa công khai",
    };
  };
  const handleUnpublish = async () => {
    if (!unpublishing || unpublishBusy) return;
    setUnpublishBusy(true);
    setUnpublishError("");
    try {
      await procedureApi.unpublish(unpublishing.procedureId);
      setUnpublishing(undefined);
      toast.success("Đã hủy xuất bản. Bản nháp đã quay về trạng thái chờ đối soát.");
      list.refresh();
      onPublished?.();
    } catch (e) {
      // 409 procedure.already_public: thủ tục vừa được công khai → tải lại trạng thái để ẩn nút
      setUnpublishError(procedureError(e));
    } finally {
      void queryClient.invalidateQueries({ queryKey: ["procedure-manager-detail", unpublishing.procedureId] });
      setUnpublishBusy(false);
    }
  };
  const [confirmLeaveOpen, setConfirmLeaveOpen] = useState(false);
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
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
    setValidationError(null);
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
        setPayload(normalizeDraftPayload(next.payload));
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
  const chooseFile = (next?: File) => {
    setFile(next);
    setPreview(undefined);
    setPreviewMode("pdf");
    setPreviewConfirmed(false);
  };
  const resetUpload = () => {
    setValidationError(null);
    previewController.current?.abort();
    previewController.current = null;
    setPreviewing(false);
    chooseFile();
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
      if (e instanceof ProcedureValidationError) setValidationError(e);
      // Lỗi dữ liệu: chỉ nói số mục cần điền; danh sách chi tiết (bấm để tới đúng ô) nằm trong phần nội dung
      const msg = e instanceof ProcedureValidationError
        ? `Chưa thể lưu hoặc xuất bản. Cần điền hoặc sửa ${e.issues.length} mục: ${e.issues.slice(0, 5).map(issue => issue.label).join('; ')}${e.issues.length > 5 ? '…' : ''}. Bấm vào từng mục trong danh sách màu đỏ để tới đúng ô.`
        : procedureError(e);
      setError(msg);
      toast.error(msg);
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
                    if (dirty) {
                      setConfirmLeaveOpen(true);
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
                {/* Lưu ý AI đã bỏ (khó hiểu với người dùng); chỉ giữ báo lỗi khi AI không đọc được PDF.
                    Thông tin bắt buộc còn thiếu vẫn bị chặn ở bước kiểm tra khi xuất bản. */}
                {draft.failureCode && (
                  <span
                    role="status"
                    title={`Mã lỗi: ${draft.failureCode}`}
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 text-xs font-semibold text-red-800"
                  >
                    <Warning size={16} className="text-red-600" weight="fill" />
                    Không đọc được PDF, hãy nhập tay
                  </span>
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
                    <ProcedureFeedback error={error} />
                    <ProcedureApiEditor validationError={validationError}
                      extractionNotes={caseExtractionNotes(draft.warnings)}
                      value={payload}
                      onChange={(next) => {
                        setPayload(next);
                        setDirty(true);
                        setConfirmed(false);
                        if (error) setError("");
                      }}
                      categories={categories}
                      disabled={!editable || busy}
                      onTemplateCreated={async (newTemplate, updatedForms) => {
                        const updatedPayload = { ...payload, formDefinitions: updatedForms };
                        setPayload(updatedPayload);
                        try {
                          const next = await procedureApi.saveDraft(
                            draft.id,
                            draft.revision,
                            updatedPayload,
                          );
                          setDraft(next);
                          setPayload(next.payload);
                          setDirty(false);
                          toast.success(`Đã tạo phôi và tự động lưu vào bản nháp cho biểu mẫu "${newTemplate.title}".`);
                        } catch {
                          setDirty(true);
                        }
                      }}
                    />

                    <div className="mt-8 border-t border-slate-100 pt-4">
                      <details className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                        <summary className="cursor-pointer text-xs font-bold uppercase tracking-wider text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-800 focus-visible:ring-offset-2">
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
                    <div className="mx-auto flex max-w-4xl flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                      <label className={`flex min-w-0 cursor-pointer items-start gap-2 rounded-lg px-2 py-1.5 select-none text-xs ${confirmed ? "bg-emerald-50 text-emerald-900" : "text-slate-700"}`}>
                        <input
                          type="checkbox"
                          className="mt-0.5 size-4 shrink-0 rounded border-slate-300 accent-red-700 focus:border-red-600 focus:outline-none focus:ring-4 focus:ring-red-100"
                          checked={confirmed}
                          disabled={busy}
                          onChange={(e) => setConfirmed(e.target.checked)}
                        />
                        <span>Tôi đã đối soát kỹ thông tin với bản PDF gốc và xác nhận tính chuẩn xác.</span>
                      </label>
                      <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="small"
                          className="text-slate-600"
                          disabled={!dirty || busy}
                          onClick={() => {
                            setConfirmResetOpen(true);
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
                          loading={savingDraft}
                          onClick={() =>
                            void run(async () => {
                              setSavingDraft(true);
                              try {
                                const next = await procedureApi.saveDraft(
                                  draft.id,
                                  draft.revision,
                                  payload,
                                );
                                setDraft(next);
                                setPayload(next.payload);
                                setDirty(false);
                                toast.success("Đã lưu bản nháp thành công.");
                              } finally {
                                setSavingDraft(false);
                              }
                            })
                          }
                        >
                          Lưu bản nháp
                        </Button>
                        {(can("procedure.drafts.publish") || can("procedure.publish")) && (
                          <Button
                            size="small"
                            disabled={busy}
                            loading={publishingDraft}
                            onClick={() => {
                              if (!confirmed) {
                                toast.warning("Vui lòng tích chọn xác nhận đã đối soát nội dung với tệp PDF gốc trước khi xuất bản.");
                                return;
                              }
                              void run(async () => {
                                setPublishingDraft(true);
                                try {
                                  // Lấy số ngày/số tiền từ chính dữ liệu đã nhập; thiếu thì chỉ rõ ô cần điền, không gửi lên BE
                                  const prepared = prepareDraftPayloadForPublish(normalizeDraftPayload(payload));
                                  let validated: ReturnType<typeof validateProcedure> | undefined;
                                  let pending: ProcedureIssue[] = [];
                                  try {
                                    validated = validateProcedure(prepared);
                                  } catch (e) {
                                    if (!(e instanceof ProcedureValidationError)) throw e;
                                    pending = e.issues;
                                  }
                                  pending = [...pending, ...draftPublishIssues(prepared).filter(issue => !pending.some(x => x.path === issue.path))];
                                  if (pending.length || !validated) throw new ProcedureValidationError(pending);
                                  const saved = await procedureApi.saveDraft(
                                    draft.id,
                                    draft.revision,
                                    validated as unknown as Record<string, unknown>,
                                  );
                                  setDraft(saved);
                                  setPayload(saved.payload);
                                  setDirty(false);
                                  let published: ProcedureDetail | undefined;
                                  try {
                                    published = await procedureApi.publishDraft(
                                      saved.id,
                                      saved.revision,
                                    );
                                  } catch (e) {
                                    // 400 thiếu dữ liệu: đổi khóa kỹ thuật của BE thành mục dễ hiểu chỉ tới đúng ô
                                    const serverErrors = axios.isAxiosError(e) && e.response?.status === 400 ? (e.response.data as { errors?: Record<string, unknown> } | undefined)?.errors : undefined;
                                    if (serverErrors && Object.keys(serverErrors).length) throw new ProcedureValidationError(issuesFromServerErrors(serverErrors, saved.payload));
                                    const latest = await procedureApi
                                      .draft(saved.id)
                                      .catch(() => undefined);
                                    if (latest?.status !== "Published") throw e;
                                  }
                                  notifyPublished(published, (payload as { formDefinitions?: unknown }).formDefinitions);
                                  select();
                                  list.refresh();
                                  onPublished?.(published);
                                } finally {
                                  setPublishingDraft(false);
                                }
                              });
                            }}
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

        {/* Modal xác nhận thoát về danh sách khi có thay đổi chưa lưu */}
        <Modal
          open={confirmLeaveOpen}
          onOpenChange={setConfirmLeaveOpen}
          title="Bỏ thay đổi chưa lưu?"
          description="Các thông tin bạn vừa chỉnh sửa trên bản nháp sẽ không được lưu nếu bạn quay lại danh sách."
          footer={
            <>
              <Button variant="outline" onClick={() => setConfirmLeaveOpen(false)}>
                Tiếp tục chỉnh sửa
              </Button>
              <Button
                className="bg-red-700 text-white hover:bg-red-800"
                onClick={() => {
                  setConfirmLeaveOpen(false);
                  select();
                }}
              >
                Rời khỏi và bỏ thay đổi
              </Button>
            </>
          }
        >
          <p className="text-sm text-slate-600 leading-relaxed">
            Bạn có thể bấm <strong>Lưu bản nháp</strong> trước khi rời đi để giữ lại các thông tin đã đối soát.
          </p>
        </Modal>

        {/* Modal xác nhận hủy thay đổi và khôi phục nội dung ban đầu */}
        <Modal
          open={confirmResetOpen}
          onOpenChange={setConfirmResetOpen}
          title="Khôi phục nội dung ban đầu?"
          description="Toàn bộ nội dung bạn vừa chỉnh sửa sẽ bị hủy và khôi phục về dữ liệu trích xuất ban đầu từ tệp PDF gốc."
          footer={
            <>
              <Button variant="outline" onClick={() => setConfirmResetOpen(false)}>
                Tiếp tục chỉnh sửa
              </Button>
              <Button
                className="bg-red-700 text-white hover:bg-red-800"
                onClick={() => {
                  if (draft) {
                    setPayload(draft.payload);
                    setDirty(false);
                    setConfirmed(false);
                    setConfirmResetOpen(false);
                    toast.info("Đã khôi phục nội dung ban đầu của bản nháp.");
                  }
                }}
              >
                Xác nhận hủy thay đổi
              </Button>
            </>
          }
        >
          <p className="text-sm text-slate-600 leading-relaxed">
            Thao tác này sẽ đặt lại tất cả các trường thông tin về trạng thái trích xuất ban đầu.
          </p>
        </Modal>
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
    <div className="@container/drafts min-w-0 space-y-5">
      <div className="admin-page-heading">
        <div>
          <h1>PDF và bản nháp</h1>
          <p>Tạo bản nháp từ PDF quyết định công bố hoặc xem trước nội dung AI nhận diện.</p>
        </div>
      </div>
      <ProcedureFeedback error={error} />
      {(canUpload || canPreview) && (
        <section className="admin-card overflow-hidden" aria-labelledby="create-draft-title">
          <div className="border-b border-slate-200 px-4 py-3.5 sm:px-5">
            <h2 id="create-draft-title" className="text-[15px] font-semibold text-slate-950">Xử lý tệp PDF</h2>
          </div>
          <div className="grid gap-5 p-4 sm:p-5 @min-[44rem]/drafts:grid-cols-2">
            <fieldset className="min-w-0">
              <legend className="mb-2 text-xs font-semibold text-slate-700">Cách xử lý PDF</legend>
              <div className="grid gap-2">
                {([
                  { value: "draft", label: "Tạo bản nháp có PDF gốc", hint: "Lưu PDF để đối soát và chỉnh sửa sau.", allowed: canUpload },
                  { value: "preview", label: "Xem và nhận diện nội dung", hint: "Đọc nội dung bằng AI, không lưu tệp PDF.", allowed: canPreview },
                ] as const).filter((mode) => mode.allowed).map((mode) => (
                  <label key={mode.value} className="relative flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2.5 transition hover:border-slate-300 has-checked:border-red-300 has-checked:bg-red-50 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-red-700 has-[:disabled]:cursor-default">
                    <input
                      type="radio"
                      name="pdf-processing-mode"
                      className="mt-0.5 size-4 shrink-0 accent-red-700"
                      checked={uploadMode === mode.value}
                      disabled={busy}
                      aria-label={mode.label}
                      onChange={() => {
                        setPreferredUploadMode(mode.value);
                        if (mode.value === "draft") {
                          setPreview(undefined);
                          setPreviewConfirmed(false);
                        }
                      }}
                    />
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-slate-900">{mode.label}</span>
                      <span className="mt-0.5 block text-xs leading-5 text-slate-600">{mode.hint}</span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="flex min-w-0 flex-col gap-2">
              <p className="text-xs font-semibold text-slate-700">Tệp PDF</p>
              <label
                onDragOver={(event) => { event.preventDefault(); if (!busy) setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={(event) => {
                  event.preventDefault();
                  setDragging(false);
                  const dropped = event.dataTransfer.files?.[0];
                  if (!dropped || busy) return;
                  chooseFile(dropped);
                }}
                className={`relative flex min-h-24 flex-1 cursor-pointer items-center gap-3 rounded-lg border-2 border-dashed p-4 transition focus-within:ring-2 focus-within:ring-red-700 has-[:disabled]:cursor-default ${dragging || file ? "border-red-300 bg-red-50/50" : "border-slate-300 bg-slate-50 hover:border-red-300 hover:bg-red-50/30"}`}
              >
                <input
                  ref={fileInput}
                  className="sr-only"
                  aria-label="PDF mô tả thủ tục (tối đa 20 MB)"
                  type="file"
                  accept=".pdf,application/pdf"
                  disabled={busy}
                  onChange={(event) => chooseFile(event.target.files?.[0])}
                />
                <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-white text-red-800 ring-1 ring-slate-200" aria-hidden="true">
                  {file ? <FilePdf size={22} weight="duotone" /> : <UploadSimple size={22} weight="duotone" />}
                </span>
                <span className="min-w-0 text-left">
                  <span className="block text-sm font-semibold text-slate-900 [overflow-wrap:anywhere]">{file ? file.name : "Chọn tệp PDF từ máy"}</span>
                  <span className="mt-0.5 block text-xs leading-5 text-slate-600">{file ? `${fileSize(file.size)} · Bấm hoặc kéo tệp khác để thay` : "Hoặc kéo thả vào đây · Tối đa 20 MB"}</span>
                </span>
              </label>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50/70 px-4 py-3 sm:px-5">
            <p className="text-xs text-slate-600" role="status">
              {previewing ? "Đang trích xuất và phân tích nội dung PDF bằng AI…" : file ? "Đã chọn tệp PDF" : "Chọn tệp PDF để tiếp tục."}
            </p>
            <div className="ml-auto flex w-full flex-wrap justify-end gap-2 sm:w-auto">
              {previewing && (
                <Button variant="outline" size="toolbar" onClick={() => previewController.current?.abort()}>
                  <StopCircle size={16} aria-hidden="true" /> Dừng
                </Button>
              )}
              {uploadMode === "draft" ? (
                <Button
                  disabled={!file}
                  loading={busy}
                  className="w-full sm:w-auto"
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
                </Button>
              ) : (
                <Button
                  disabled={!file || busy}
                  loading={previewing}
                  className="w-full sm:w-auto"
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
              )}
            </div>
          </div>
        </section>
      )}
      {preview && (
        <section className="overflow-hidden rounded-2xl border border-amber-200 bg-amber-50/30">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-200 bg-amber-50 px-4 py-3">
            <div className="flex items-center gap-2"><CheckCircle size={20} className="text-amber-800" weight="fill" /><h2 className="text-[15px] font-semibold text-slate-950">Kết quả nhận diện AI</h2></div>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-amber-900 ring-1 ring-amber-200">Chưa lưu bản nháp</span>
          </div>
          <div className="space-y-4 p-4">
            <div className="inline-flex flex-wrap rounded-xl bg-slate-100 p-1 text-sm font-semibold" role="tablist" aria-label="Nội dung xem trước PDF">
              <button type="button" role="tab" aria-selected={previewMode === "pdf"} onClick={() => setPreviewMode("pdf")} className={`min-h-10 rounded-lg px-4 transition ${previewMode === "pdf" ? "bg-white text-red-900 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}>PDF gốc</button>
              <button type="button" role="tab" aria-selected={previewMode === "text"} onClick={() => setPreviewMode("text")} className={`min-h-10 rounded-lg px-4 transition ${previewMode === "text" ? "bg-white text-red-900 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}>Văn bản nhận diện</button>
            </div>
            {previewMode === "pdf" && pdfUrl ? (
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
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
              <summary className="cursor-pointer px-4 py-3 text-sm font-bold text-slate-800 focus-visible:ring-inset focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-800 focus-visible:ring-offset-2">Kiểm tra thông tin đã nhận diện</summary>
              <div className="border-t border-slate-200 p-4">
                <ProcedureApiEditor
                  validationError={validationError}
                  extractionNotes={caseExtractionNotes(preview.warnings)}
                  value={preview.payload}
                  onChange={(payload) => { setPreview({ ...preview, payload }); setPreviewConfirmed(false); }}
                  categories={categories}
                  disabled={!can("procedure.publish") || busy}
                />
              </div>
            </details>
            {can("procedure.publish") && (
              <div className="space-y-3 rounded-xl border border-red-200 bg-red-50/60 p-4">
                <p className="text-sm leading-6 text-red-950"><strong>Kiểm tra kỹ trước khi xuất bản.</strong> Thủ tục mới được lưu ở trạng thái ẩn, chỉ công khai khi bạn bấm "Mở công khai". Nếu trùng mã thủ tục, nội dung hiện tại sẽ được thay bằng nội dung này.</p>
                <label className="flex items-start gap-3 text-sm font-medium text-slate-800"><input type="checkbox" className="mt-1" checked={previewConfirmed} disabled={busy} onChange={(event) => setPreviewConfirmed(event.target.checked)} /><span>Tôi đã kiểm tra nội dung và đồng ý xuất bản.</span></label>
                <Button disabled={!previewConfirmed || busy} loading={busy} onClick={() => void run(async () => {
                  const data = validateProcedure(normalizeDraftPayload(preview.payload));
                  const published = await procedureApi.publish(data);
                  notifyPublished(published, (preview.payload as { formDefinitions?: unknown }).formDefinitions);
                  resetUpload();
                  onPublished(published);
                })}>Xuất bản thủ tục</Button>
              </div>
            )}
          </div>
        </section>
      )}
      <ProcedureFeedback error={list.error} retry={list.refresh} />
      <section className="admin-card overflow-hidden" aria-labelledby="recent-drafts-title">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-3.5 sm:px-5">
          <h2 id="recent-drafts-title" className="text-[15px] font-semibold text-slate-950">Bản nháp gần đây</h2>
          {!list.loading && !!list.data?.length && <span className="text-xs text-slate-600">{list.data.length} bản nháp · Trang {page}</span>}
        </div>
        {(list.loading || !!list.data?.length) && (
          <div role="table" aria-labelledby="recent-drafts-title" aria-busy={list.loading} className="[--draft-columns:minmax(0,1fr)_9rem_20rem]">
            <div role="rowgroup" className="sr-only @min-[44rem]/drafts:not-sr-only">
              <div role="row" className="grid grid-cols-(--draft-columns) gap-4 border-b border-slate-200 bg-slate-50 px-5 py-2.5 text-xs font-semibold text-slate-600">
                <div role="columnheader">Tệp PDF</div>
                <div role="columnheader">Trạng thái</div>
                <div role="columnheader">Thao tác</div>
              </div>
            </div>
            <div role="rowgroup" className="divide-y divide-slate-100">
              {list.loading ? (
                Array.from({ length: 4 }, (_, index) => (
                  <div key={index} role="row" aria-hidden="true" className="grid items-center gap-3 px-4 py-3 sm:px-5 @min-[44rem]/drafts:grid-cols-(--draft-columns) @min-[44rem]/drafts:gap-4">
                    <Skeleton className="h-10 w-48 max-w-full" />
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-10 w-28" />
                  </div>
                ))
              ) : list.data?.map((row) => {
                const state = publishedState(row.publishedProcedureId);

                return (
                  <div key={row.id} role="row" className="grid min-w-0 items-center gap-2.5 px-4 py-3 transition-colors hover:bg-slate-50/70 sm:px-5 @min-[44rem]/drafts:grid-cols-(--draft-columns) @min-[44rem]/drafts:gap-4">
                    <div role="cell" className="flex min-w-0 items-center gap-3">
                      <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-red-50 text-red-700" aria-hidden="true">
                        <FilePdf size={21} weight="duotone" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium leading-5 text-slate-900 [overflow-wrap:anywhere] @min-[44rem]/drafts:truncate" title={row.pdfFileName}>{row.pdfFileName}</p>
                        <p className="mt-0.5 text-xs leading-4 text-slate-600">Cập nhật {formatDateTime(row.updatedAt)}</p>
                      </div>
                    </div>
                    <div role="cell" className="flex min-w-0 flex-wrap items-center gap-1.5 @min-[44rem]/drafts:min-h-11 @min-[44rem]/drafts:flex-col @min-[44rem]/drafts:items-start @min-[44rem]/drafts:gap-1">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold leading-4 ring-1 ring-inset ${statusStyles[row.status] ?? "bg-slate-100 text-slate-700 ring-slate-200"}`}>
                        {labels[row.status] ?? row.status}
                      </span>
                      {state && (
                        <span className={`inline-flex items-center gap-1.5 text-xs leading-4 ${state.detail.isActive ? "text-emerald-700" : "text-slate-600"}`}>
                          <span className={`size-1.5 shrink-0 rounded-full ${state.detail.isActive ? "bg-emerald-500" : "bg-slate-400"}`} aria-hidden="true" />
                          {state.label}
                        </span>
                      )}
                    </div>
                    <div role="cell" className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-center gap-2 @min-[44rem]/drafts:grid-cols-[7rem_minmax(0,1fr)_3.75rem]">
                      {can("procedure.drafts.read") && (
                        <Button size="toolbar" variant="outline" className="col-start-1 row-start-1 min-w-0 px-2 text-center" onClick={() => select(row.id)}>
                          Mở bản nháp
                        </Button>
                      )}
                      {can("procedure.publish") && state?.canUnpublish && (
                        <Button
                          size="toolbar"
                          variant="dangerGhost"
                          className="col-start-2 row-start-1 min-w-0 px-1 text-center"
                          onClick={() => {
                            setUnpublishing({ procedureId: row.publishedProcedureId!, name: state.detail.title });
                            setUnpublishError("");
                          }}
                        >
                          <ArrowArcLeft size={15} className="hidden shrink-0 @min-[44rem]/drafts:block" aria-hidden="true" />
                          Hủy xuất bản
                        </Button>
                      )}
                      {can("procedure.drafts.delete") && (
                        <Button
                          size="toolbar"
                          variant="ghost"
                          className="col-start-3 row-start-1 px-2 text-slate-600 hover:bg-red-50 hover:text-red-700"
                          aria-label={`Xóa bản nháp ${row.pdfFileName}`}
                          onClick={() => {
                            setDeleting({ id: row.id, name: row.pdfFileName });
                            setDeleteError("");
                          }}
                        >
                          <Trash size={16} className="shrink-0" aria-hidden="true" />
                          Xóa
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {!list.loading && list.data?.length === 0 && (
          <div className="px-5 py-10 text-center">
            <FilePdf size={32} className="mx-auto text-slate-400" aria-hidden="true" />
            <p className="mt-3 font-semibold text-slate-700">Chưa có bản nháp</p>
            {canUpload && <p className="mt-1 text-xs text-slate-600">Tải tệp PDF ở phần trên để tạo bản nháp đầu tiên.</p>}
          </div>
        )}
        {!list.loading && (page > 1 || (list.data?.length ?? 0) >= 10) && (
          <div className="flex items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 text-[13px] text-slate-600 sm:px-5">
            <Button variant="outline" size="small" disabled={page === 1 || list.loading} onClick={() => setPage((value) => value - 1)}>
              Trước
            </Button>
            <span>Trang {page}</span>
            <Button variant="outline" size="small" disabled={list.loading || (list.data?.length ?? 0) < 10} onClick={() => setPage((value) => value + 1)}>
              Sau
            </Button>
          </div>
        )}
      </section>

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
      <ConfirmDeleteModal
        open={!!unpublishing}
        onOpenChange={(open) => {
          if (!open && !unpublishBusy) setUnpublishing(undefined);
        }}
        title="Hủy xuất bản thủ tục"
        itemName={unpublishing?.name}
        description="Thủ tục chưa từng công khai này và lịch sử phiên bản của nó sẽ bị xóa hẳn. Bản nháp quay về trạng thái chờ đối soát để bạn sửa, xuất bản lại hoặc xóa."
        warningNote="Không thể hoàn tác thao tác này."
        confirmLabel="Hủy xuất bản"
        loading={unpublishBusy}
        onConfirm={() => void handleUnpublish()}
      >
        <ProcedureFeedback error={unpublishError} />
      </ConfirmDeleteModal>
    </div>
  );
}
