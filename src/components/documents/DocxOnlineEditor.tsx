import { useEffect, useRef, useState } from 'react';
import {
  DocxEditor,
  runToolbarCommand,
  toolbarCommandState,
  type DocxEditorRef,
  type Editor,
  type ChromeSlotId,
  type EditorSnapshot,
} from '@docx-editor.dev/react';
import { packagedFonts } from '@docx-editor.dev/fonts';
import '@docx-editor.dev/core/styles/editor.css';
import {
  ArrowLeft,
  ArrowUUpLeft,
  ArrowUUpRight,
  TextB,
  TextItalic,
  TextUnderline,
  TextStrikethrough,
  TextAlignLeft,
  TextAlignCenter,
  TextAlignRight,
  TextAlignJustify,
  ListBullets,
  ListNumbers,
  FileDoc,
  DownloadSimple,
  FloppyDisk,
  Table,
  X,
  SidebarSimple,
  CheckCircle,
  Warning,
  Info,
} from '@phosphor-icons/react';
import { Button } from '@/components/ui';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { documentFormError, downloadBlob, validateDocumentFile } from '@/lib/api/documentForms';

const fonts = packagedFonts();

const tools: { id: ChromeSlotId; label: string; icon: typeof TextB }[] = [
  { id: 'history.undo', label: 'Hoàn tác', icon: ArrowUUpLeft },
  { id: 'history.redo', label: 'Làm lại', icon: ArrowUUpRight },
  { id: 'text.bold', label: 'In đậm', icon: TextB },
  { id: 'text.italic', label: 'In nghiêng', icon: TextItalic },
  { id: 'text.underline', label: 'Gạch chân', icon: TextUnderline },
  { id: 'text.strike', label: 'Gạch ngang', icon: TextStrikethrough },
  { id: 'alignment.left', label: 'Căn trái', icon: TextAlignLeft },
  { id: 'alignment.center', label: 'Căn giữa', icon: TextAlignCenter },
  { id: 'alignment.right', label: 'Căn phải', icon: TextAlignRight },
  { id: 'alignment.justify', label: 'Căn đều', icon: TextAlignJustify },
  { id: 'list.bullet', label: 'Danh sách dấu đầu dòng', icon: ListBullets },
  { id: 'list.numbered', label: 'Danh sách đánh số', icon: ListNumbers },
];

const selectClass =
  'min-h-9 max-w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs sm:text-sm text-slate-800 shadow-2xs focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-100 disabled:opacity-50';

const vi = {
  editor: {
    documentContent: 'Nội dung tài liệu',
    documentViewport: 'Các trang tài liệu',
    previewContent: 'Xem trước thay đổi',
    showDocumentOutline: 'Mục lục tài liệu',
    linkCopied: 'Đã sao chép liên kết',
    fontSubstitutionNotice: 'Đang dùng phông thay thế: {fonts}',
  },
  common: {
    cancel: 'Hủy',
    apply: 'Áp dụng',
    close: 'Đóng',
    comment: 'Bình luận',
    dismiss: 'Đóng thông báo',
  },
  headerFooter: {
    chromeAriaLabel: 'Chỉnh sửa đầu trang và chân trang',
    header: 'Đầu trang',
    footer: 'Chân trang',
    firstPageHeader: 'Đầu trang đầu tiên',
    firstPageFooter: 'Chân trang đầu tiên',
    evenPageHeader: 'Đầu trang chẵn',
    evenPageFooter: 'Chân trang chẵn',
    sameAsPrevious: 'Giống phần trước',
    sameAsPreviousHint: 'Thay đổi cũng áp dụng cho các trang của phần trước.',
    options: 'Tùy chọn',
    differentFirstPage: 'Trang đầu khác biệt',
    differentOddEven: 'Trang chẵn lẻ khác nhau',
    differentOddEvenHint: 'Áp dụng cho toàn bộ tài liệu.',
    linkToPrevious: 'Liên kết phần trước',
    unlinkFromPrevious: 'Hủy liên kết phần trước',
    headerDistance: 'Khoảng cách đầu trang',
    footerDistance: 'Khoảng cách chân trang',
    removeHeader: 'Xóa đầu trang',
    removeFooter: 'Xóa chân trang',
    insertPageNumber: 'Chèn số trang hiện tại',
    insertTotalPages: 'Chèn tổng số trang',
    insertSectionPages: 'Chèn số trang của phần',
    insertPageXofY: 'Chèn trang X trên Y',
  },
  image: {
    unsupportedFormat: 'Định dạng ảnh chưa hỗ trợ ({format})',
    nonPictureGraphic: 'Đồ họa chưa hỗ trợ ({kind})',
    missingResource: 'Không tìm thấy ảnh',
    externalResource: 'Chưa tải ảnh bên ngoài',
    invalidResource: 'Ảnh không hợp lệ',
    contentMismatch: 'Nội dung ảnh không khớp định dạng',
    decodeFailed: 'Không đọc được ảnh',
    resourceLimit: 'Ảnh vượt giới hạn kích thước',
    pendingResource: 'Đang tải ảnh',
  },
};

export interface DocxOnlineEditorProps {
  sourceKey: string;
  title: string;
  subtitle?: string;
  load: (signal: AbortSignal) => Promise<{ blob: Blob; fileName: string }>;
  onSave?: (file: File) => Promise<void>;
  onClose: () => void;
  readOnly?: boolean;
  author: string;
  referenceData?: { label: string; value: string }[];
}

export default function DocxOnlineEditor({
  sourceKey,
  title,
  subtitle,
  load,
  onSave,
  onClose,
  readOnly = false,
  author,
  referenceData,
}: DocxOnlineEditorProps) {
  const editorRef = useRef<DocxEditorRef>(null);
  const loader = useRef(load);
  const unsubscribe = useRef<(() => void)[]>([]);
  const lock = useRef(false);
  const revision = useRef(0);
  const [bytes, setBytes] = useState<Uint8Array>();
  const [name, setName] = useState('ban-khai.docx');
  const [snapshot, setSnapshot] = useState<EditorSnapshot>();
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [retry, setRetry] = useState(0);
  const [zoom, setZoom] = useState<number | 'fit'>('fit');
  const [tab, setTab] = useState<'home' | 'insert' | 'layout'>('home');
  const [compatibilityWarning, setCompatibilityWarning] = useState(false);
  const [showReferenceDrawer, setShowReferenceDrawer] = useState(Boolean(referenceData && referenceData.length > 0));

  const guard = useUnsavedChanges(dirty, busy);

  useEffect(() => {
    loader.current = load;
  }, [load]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    setBytes(undefined);
    setSnapshot(undefined);
    setDirty(false);
    setSaved(false);
    setCompatibilityWarning(false);

    void loader
      .current(controller.signal)
      .then(async (file) => {
        const fileName = file.fileName.toLowerCase().endsWith('.docx') ? file.fileName : 'ban-khai.docx';
        const issue = validateDocumentFile(new File([file.blob], fileName), true);
        if (issue) throw new Error(issue);
        const data = new Uint8Array(await file.blob.arrayBuffer());
        if (!controller.signal.aborted) {
          setName(fileName);
          setBytes(data);
        }
      })
      .catch((err) => {
        if (!controller.signal.aborted) setError(documentFormError(err));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => {
      controller.abort();
      unsubscribe.current.forEach((dispose) => dispose());
      unsubscribe.current = [];
    };
  }, [sourceKey, retry]);

  function ready(editor: Editor) {
    unsubscribe.current.forEach((dispose) => dispose());
    const update = () => setSnapshot(editor.snapshot());
    update();
    unsubscribe.current = [
      editor.on('selectionChange', update),
      editor.on('change', update),
      editor.on('error', () => {
        if (editor.snapshot().parseError) {
          setError('Không mở được tài liệu. Hãy tải DOCX về để kiểm tra bằng Word.');
        } else {
          setCompatibilityWarning(true);
        }
      }),
    ];
  }

  async function exportFile() {
    const data = await editorRef.current?.save();
    if (!data) throw new Error('Tài liệu chưa sẵn sàng. Vui lòng chờ rồi thử lại.');
    const file = new File([data], name, {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
    const issue = validateDocumentFile(file, true);
    if (issue) throw new Error(issue);
    return file;
  }

  async function save() {
    if (lock.current || readOnly || !onSave) return;
    lock.current = true;
    setBusy(true);
    setError('');
    const savingRevision = revision.current;
    try {
      await onSave(await exportFile());
      if (savingRevision === revision.current) setDirty(false);
      setSaved(true);
    } catch (err) {
      setError(documentFormError(err));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }

  async function download() {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError('');
    try {
      const file = await exportFile();
      downloadBlob(file, file.name);
    } catch (err) {
      setError(documentFormError(err));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }

  const engine = editorRef.current?.getEditor() ?? null;
  const editable = !readOnly && !busy && Boolean(snapshot?.editable);

  return (
    <div
      className="fixed inset-0 z-[10000] flex flex-col bg-slate-900/40 backdrop-blur-none text-slate-900 select-none overflow-hidden animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          guard.requestClose(onClose);
        }
      }}
    >
      {/* ======================================================== */}
      {/* 1. TOP APPLICATION STUDIO BAR                            */}
      {/* ======================================================== */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-3 sm:px-5 shadow-2xs z-20">
        {/* Left: Back button + File Title + Status Pill */}
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <Button
            variant="ghost"
            size="small"
            onClick={() => guard.requestClose(onClose)}
            aria-label="Đóng hộp thoại"
            className="gap-1 px-2 text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            title="Quay lại hồ sơ"
          >
            <ArrowLeft size={18} weight="bold" />
            <span className="hidden sm:inline font-semibold">Quay lại</span>
          </Button>

          <div className="h-5 w-px bg-slate-200" aria-hidden="true" />

          <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-red-50 text-red-800">
            <FileDoc size={22} weight="fill" />
          </div>

          <div className="min-w-0 max-w-[200px] sm:max-w-xs md:max-w-md lg:max-w-lg">
            <h1 className="truncate text-xs sm:text-sm font-bold text-slate-900" title={name}>
              {name}
            </h1>
            <p className="truncate text-[11px] text-slate-500">
              {subtitle ? `${subtitle} · ` : ''}Tác giả: <span className="font-medium text-slate-700">{author}</span>
            </p>
          </div>

          {/* Status badge pill */}
          <div className="hidden md:flex items-center">
            {busy && (
              <span role="status" className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                <span className="size-2 rounded-full bg-blue-600 animate-pulse" />
                <span>Đang xử lý…</span>
              </span>
            )}
            {!busy && dirty && (
              <span role="status" className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-900">
                <span className="size-2 rounded-full bg-amber-500 animate-ping" />
                <span>Có thay đổi chưa lưu</span>
              </span>
            )}
            {!busy && !dirty && saved && (
              <span role="status" className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                <CheckCircle size={14} weight="bold" />
                <span>Đã lưu vào hồ sơ</span>
              </span>
            )}
            {!busy && !dirty && !saved && readOnly && (
              <span role="status" className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                Chỉ xem
              </span>
            )}
          </div>

          {/* Save to Dossier (Office Quick Access placement - avoids top-right toast interception) */}
          {!readOnly && onSave && (
            <Button
              size="small"
              variant="primary"
              disabled={!editable}
              loading={busy}
              onClick={() => void save()}
              className="gap-1.5 text-xs font-bold shadow-xs bg-red-800 hover:bg-red-900 ml-1"
              title="Lưu tệp vào hồ sơ (Ctrl + S)"
            >
              <FloppyDisk size={16} weight="bold" />
              <span>Lưu vào hồ sơ</span>
            </Button>
          )}
        </div>

        {/* Right: Actions (Shortcut hint, Reference toggle, Download, Close) */}
        <div className="flex shrink-0 items-center gap-2">
          {/* Quick keyboard hint */}
          {!readOnly && (
            <span className="hidden xl:inline text-xs text-slate-600 mr-1">
              Nhấn <kbd className="rounded border border-slate-300 bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-slate-700 shadow-2xs">Ctrl + S</kbd> để lưu
            </span>
          )}

          {/* Reference panel toggle */}
          {referenceData && referenceData.length > 0 && (
            <Button
              size="small"
              variant={showReferenceDrawer ? 'primary' : 'outline'}
              onClick={() => setShowReferenceDrawer(!showReferenceDrawer)}
              className="gap-1.5 text-xs"
              title="Mở bảng thông tin đối chiếu của hồ sơ"
            >
              <SidebarSimple size={16} weight="bold" />
              <span className="hidden lg:inline">Đối chiếu thông tin</span>
            </Button>
          )}

          {/* Download DOCX */}
          <Button
            size="small"
            variant="outline"
            disabled={!bytes || busy || Boolean(snapshot?.parseError)}
            onClick={() => void download()}
            className="gap-1.5 text-xs"
            title="Tải tệp Word về máy"
          >
            <DownloadSimple size={16} />
            <span className="hidden sm:inline">Tải DOCX</span>
          </Button>

          <div className="h-5 w-px bg-slate-200 hidden sm:block" aria-hidden="true" />

          {/* Close X button */}
          <button
            type="button"
            onClick={() => guard.requestClose(onClose)}
            aria-label="Thoát không gian soạn thảo"
            title="Đóng"
            className="grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <X size={18} weight="bold" />
          </button>
        </div>
      </header>

      {/* ======================================================== */}
      {/* 2. OFFICE RIBBON FORMATTING TOOLBAR                      */}
      {/* ======================================================== */}
      {!readOnly && (
        <div className="flex shrink-0 flex-col border-b border-slate-200 bg-white shadow-2xs z-10">
          {/* Ribbon Tabs */}
          <nav aria-label="Nhóm công cụ soạn thảo" className="flex shrink-0 gap-1 border-b border-slate-100 px-4">
            {(
              [
                { id: 'home', label: 'Trang đầu (Văn bản)' },
                { id: 'insert', label: 'Chèn (Bảng & Ngắt trang)' },
                { id: 'layout', label: 'Bố trí (Trang in A4)' },
              ] as const
            ).map((item) => (
              <button
                key={item.id}
                type="button"
                aria-pressed={tab === item.id}
                onClick={() => setTab(item.id)}
                className="min-h-9 border-b-2 border-transparent px-3 text-xs sm:text-sm font-semibold text-slate-600 transition-colors hover:text-slate-900 focus-visible:outline-red-700 aria-pressed:border-red-700 aria-pressed:text-red-800"
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Ribbon Actions */}
          <div
            role="toolbar"
            aria-label="Định dạng văn bản"
            className="flex min-h-12 flex-wrap items-center gap-1.5 bg-slate-50/80 px-4 py-1.5 overflow-x-auto"
          >
            {tab === 'home' && (
              <>
                {/* Font Family */}
                <select
                  aria-label="Phông chữ"
                  className={selectClass}
                  disabled={!editable}
                  value={snapshot?.formatting?.fontFamily ?? ''}
                  onChange={(e) => {
                    runToolbarCommand(engine, 'font.family', e.target.value);
                    engine?.focus();
                  }}
                >
                  <option value="">Phông chữ mặc định</option>
                  {Array.from(
                    new Set([
                      'Times New Roman',
                      'Arial',
                      'Calibri',
                      'Cambria',
                      'Courier New',
                      ...(snapshot?.formatting?.fontFamily ? [snapshot.formatting.fontFamily] : []),
                    ])
                  ).map((font) => (
                    <option key={font}>{font}</option>
                  ))}
                </select>

                {/* Font Size */}
                <select
                  aria-label="Cỡ chữ"
                  className={selectClass}
                  disabled={!editable}
                  value={snapshot?.formatting?.fontSizePt ?? ''}
                  onChange={(e) => {
                    runToolbarCommand(engine, 'font.size', Number(e.target.value) * 2);
                    engine?.focus();
                  }}
                >
                  <option value="">Cỡ chữ</option>
                  {Array.from(
                    new Set([
                      8,
                      9,
                      10,
                      11,
                      12,
                      13,
                      14,
                      16,
                      18,
                      20,
                      24,
                      28,
                      36,
                      ...(snapshot?.formatting?.fontSizePt ? [snapshot.formatting.fontSizePt] : []),
                    ])
                  )
                    .sort((a, b) => a - b)
                    .map((size) => (
                      <option key={size}>{size} pt</option>
                    ))}
                </select>

                <div className="h-6 w-px bg-slate-300 mx-1 shrink-0" aria-hidden="true" />

                {/* Text Formatting Icons */}
                {tools.map((tool) => {
                  const state = toolbarCommandState(engine, tool.id);
                  const Icon = tool.icon;
                  return (
                    <button
                      key={tool.id}
                      type="button"
                      aria-label={tool.label}
                      title={tool.label}
                      aria-pressed={state.active}
                      disabled={!editable || !state.enabled}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        runToolbarCommand(engine, tool.id);
                        engine?.focus();
                      }}
                      className="grid size-8 shrink-0 place-items-center rounded-lg text-slate-700 hover:bg-slate-200 focus-visible:outline-2 focus-visible:outline-red-700 disabled:opacity-40 aria-pressed:bg-red-100 aria-pressed:text-red-900 transition-colors"
                    >
                      <Icon size={18} aria-hidden />
                    </button>
                  );
                })}
              </>
            )}

            {tab === 'insert' && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="small"
                  disabled={!editable}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    const result = engine?.exec({ type: 'insertTable', rows: 2, cols: 2 });
                    if (result && !result.ok) {
                      setError('Chưa thể chèn bảng tại vị trí này. Hãy đặt con trỏ vào một đoạn văn khác.');
                    }
                    engine?.focus();
                  }}
                  className="gap-1.5 text-xs bg-white"
                >
                  <Table size={16} />
                  <span>Chèn bảng 2 × 2</span>
                </Button>

                <Button
                  variant="outline"
                  size="small"
                  disabled={!editable}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    runToolbarCommand(engine, 'insert.pageBreak');
                    engine?.focus();
                  }}
                  className="text-xs bg-white"
                >
                  <span>Ngắt trang</span>
                </Button>
              </div>
            )}

            {tab === 'layout' && (
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                  <span>Hướng giấy:</span>
                  <select
                    aria-label="Hướng giấy"
                    className={selectClass}
                    disabled={!editable}
                    value={snapshot?.pageSetup?.orientation ?? 'portrait'}
                    onChange={(e) => {
                      engine?.exec({ type: 'setPageSetup', orientation: e.target.value as 'portrait' | 'landscape' });
                      engine?.focus();
                    }}
                  >
                    <option value="portrait">Trang dọc (Portrait)</option>
                    <option value="landscape">Trang ngang (Landscape)</option>
                  </select>
                </label>

                <Button
                  variant="outline"
                  size="small"
                  disabled={!editable}
                  onClick={() => {
                    engine?.exec({
                      type: 'setPageSetup',
                      pageWidth: 11906,
                      pageHeight: 16838,
                      orientation: 'portrait',
                    });
                    engine?.focus();
                  }}
                  className="text-xs bg-white"
                >
                  <span>Khổ A4 chuẩn</span>
                </Button>

                <Button
                  variant="outline"
                  size="small"
                  disabled={!editable}
                  onClick={() => {
                    engine?.exec({
                      type: 'setPageSetup',
                      marginTop: 1440,
                      marginRight: 1440,
                      marginBottom: 1440,
                      marginLeft: 1440,
                    });
                    engine?.focus();
                  }}
                  className="text-xs bg-white"
                >
                  <span>Lề đều 2,54 cm</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Warnings & Messages */}
      {error && (
        <div
          role="alert"
          className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-red-200 bg-red-50 px-4 py-2 text-xs sm:text-sm font-medium text-red-800"
        >
          <div className="flex items-center gap-2">
            <Warning size={16} weight="bold" className="shrink-0 text-red-700" />
            <p>{error}</p>
          </div>
          {!bytes && (
            <Button size="small" variant="outline" onClick={() => setRetry((x) => x + 1)}>
              Thử tải lại
            </Button>
          )}
        </div>
      )}

      {snapshot?.hasReviewContent && (
        <div className="flex shrink-0 items-center gap-2 border-b border-amber-200 bg-amber-50 px-4 py-1.5 text-xs text-amber-900">
          <Info size={16} weight="bold" className="shrink-0 text-amber-700" />
          <p>Tài liệu có bình luận hoặc theo dõi thay đổi. Để đọc đầy đủ các bình luận gốc, bạn có thể tải DOCX và mở bằng Word.</p>
        </div>
      )}

      {compatibilityWarning && (
        <div className="flex shrink-0 items-center gap-2 border-b border-amber-200 bg-amber-50/80 px-4 py-1.5 text-xs text-amber-900">
          <Info size={16} className="shrink-0 text-amber-700" />
          <p>Một số chi tiết đồ họa có thể hiển thị khác biệt so với Microsoft Word. Hãy đối chiếu bản in hoặc bản tải về trước khi chốt hồ sơ.</p>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. MAIN WORKSPACE CANVAS + OPTIONAL REFERENCE DRAWER     */}
      {/* ======================================================== */}
      <div className="relative flex flex-1 min-h-0 bg-slate-200/90 overflow-hidden">
        {/* Editor Main Canvas */}
        <main
          className="relative flex-1 min-h-0 h-full overflow-hidden"
          aria-label="Vùng soạn thảo DOCX khổ lớn"
          onKeyDownCapture={(event) => {
            if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
              event.preventDefault();
              event.stopPropagation();
              if (!readOnly) void save();
            }
          }}
        >
          {loading && (
            <div className="flex h-full flex-col items-center justify-center gap-3 bg-slate-100 text-slate-600">
              <div className="size-8 animate-spin rounded-full border-3 border-red-800 border-t-transparent" />
              <p className="text-sm font-semibold">Đang tải và dựng bản Word lên bàn làm việc…</p>
            </div>
          )}

          {bytes && (
            <DocxEditor
              key={`${sourceKey}-${retry}`}
              ref={editorRef}
              document={bytes}
              fonts={fonts}
              locale="vi-VN"
              i18n={vi}
              author={author}
              chrome={false}
              menu={false}
              contextMenu={false}
              hyperlinkPopup={false}
              openFailure={false}
              mode={readOnly || busy ? 'view' : 'edit'}
              zoom={zoom === 'fit' ? undefined : zoom / 100}
              zoomMode={zoom === 'fit' ? 'auto' : { type: 'fixed' }}
              onReady={ready}
              onChange={(change) => {
                if (!change.source) {
                  revision.current++;
                  setDirty(true);
                  setSaved(false);
                }
              }}
              className="h-full w-full"
            />
          )}

          {snapshot?.parseError && (
            <div
              role="alert"
              className="absolute inset-x-4 top-4 rounded-xl border border-red-300 bg-red-50 p-4 shadow-lg text-sm text-red-800 space-y-2"
            >
              <p className="font-bold">Không thể hiển thị tệp DOCX này trên Web.</p>
              <p>Tệp có thể bị mã hóa hoặc cấu trúc không tương thích. Hãy đóng trình soạn thảo và tải tệp về để mở bằng Microsoft Word.</p>
            </div>
          )}
        </main>

        {/* Collapsible Reference Side Drawer */}
        {referenceData && referenceData.length > 0 && showReferenceDrawer && (
          <aside
            aria-label="Thông tin đối chiếu của hồ sơ"
            className="w-80 shrink-0 border-l border-slate-300 bg-white shadow-xl flex flex-col min-h-0 z-20 animate-in slide-in-from-right duration-200"
          >
            <div className="flex h-12 shrink-0 items-center justify-between border-b border-slate-200 px-4 bg-slate-50">
              <div className="flex items-center gap-2">
                <SidebarSimple size={18} weight="bold" className="text-red-800" />
                <h3 className="text-xs sm:text-sm font-bold text-slate-900">Thông tin đối chiếu</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowReferenceDrawer(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200"
                aria-label="Đóng bảng đối chiếu"
              >
                <X size={16} weight="bold" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
              <div className="rounded-xl bg-amber-50/80 border border-amber-200 p-3 space-y-1 text-amber-900">
                <p className="font-bold flex items-center gap-1.5">
                  <Info size={14} weight="bold" />
                  <span>Hướng dẫn tiền kiểm:</span>
                </p>
                <p className="leading-relaxed">
                  Đối chiếu từng thông tin của người nộp bên dưới với các trường trong tờ khai Word. Nếu phát hiện thông tin sai lệch, hãy sửa hoặc bôi màu ghi chú trước khi lưu.
                </p>
              </div>

              <div className="space-y-3 divide-y divide-slate-100">
                {referenceData.map((field, idx) => (
                  <div key={idx} className={idx > 0 ? 'pt-2.5' : ''}>
                    <dt className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">
                      {field.label}
                    </dt>
                    <dd className="mt-0.5 break-words font-semibold text-slate-900 text-xs sm:text-sm">
                      {field.value || 'Chưa có dữ liệu'}
                    </dd>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* ======================================================== */}
      {/* 4. BOTTOM STATUS BAR                                     */}
      {/* ======================================================== */}
      <footer className="flex h-9 shrink-0 flex-wrap items-center justify-between gap-2 border-t border-slate-200 bg-white px-4 text-xs text-slate-600 z-20">
        <div className="flex items-center gap-3">
          <span className="font-medium text-slate-700">
            Trang {snapshot?.page.current ?? 0} / {snapshot?.page.total ?? 0}
          </span>
          <span className="text-slate-300" aria-hidden="true">|</span>
          <span>{readOnly ? 'Chế độ: Chỉ đọc' : 'Chế độ: Soạn thảo & Chú thích trực tuyến'}</span>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 text-[11px] sm:text-xs">
            <span className="text-slate-500">Thu phóng:</span>
            <select
              aria-label="Thu phóng tài liệu"
              className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-red-600"
              value={zoom}
              onChange={(e) => setZoom(e.target.value === 'fit' ? 'fit' : Number(e.target.value))}
            >
              <option value="fit">Vừa chiều rộng</option>
              {[50, 75, 100, 125, 150, 200].map((val) => (
                <option key={val} value={val}>
                  {val}%
                </option>
              ))}
            </select>
          </label>
        </div>
      </footer>

      {/* Confirmation modal on unsaved close */}
      {guard.confirmation}
    </div>
  );
}
