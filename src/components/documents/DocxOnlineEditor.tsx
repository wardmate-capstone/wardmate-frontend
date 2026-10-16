import { useEffect, useRef, useState } from 'react';
import { DocxEditor, runToolbarCommand, toolbarCommandState, type DocxEditorRef, type Editor, type ChromeSlotId, type EditorSnapshot } from '@docx-editor.dev/react';
import { packagedFonts } from '@docx-editor.dev/fonts';
import '@docx-editor.dev/core/styles/editor.css';
import { ArrowUUpLeft, ArrowUUpRight, TextB, TextItalic, TextUnderline, TextStrikethrough, TextAlignLeft, TextAlignCenter, TextAlignRight, TextAlignJustify, ListBullets, ListNumbers, FileDoc, DownloadSimple, FloppyDisk, Table } from '@phosphor-icons/react';
import { Button, Modal } from '@/components/ui';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { documentFormError, downloadBlob, validateDocumentFile } from '@/lib/api/documentForms';

const fonts = packagedFonts();
const tools: { id: ChromeSlotId; label: string; icon: typeof TextB }[] = [
  { id: 'history.undo', label: 'Hoàn tác', icon: ArrowUUpLeft }, { id: 'history.redo', label: 'Làm lại', icon: ArrowUUpRight },
  { id: 'text.bold', label: 'In đậm', icon: TextB }, { id: 'text.italic', label: 'In nghiêng', icon: TextItalic },
  { id: 'text.underline', label: 'Gạch chân', icon: TextUnderline }, { id: 'text.strike', label: 'Gạch ngang', icon: TextStrikethrough },
  { id: 'alignment.left', label: 'Căn trái', icon: TextAlignLeft }, { id: 'alignment.center', label: 'Căn giữa', icon: TextAlignCenter },
  { id: 'alignment.right', label: 'Căn phải', icon: TextAlignRight }, { id: 'alignment.justify', label: 'Căn đều', icon: TextAlignJustify },
  { id: 'list.bullet', label: 'Danh sách dấu đầu dòng', icon: ListBullets }, { id: 'list.numbered', label: 'Danh sách đánh số', icon: ListNumbers },
];
const selectClass = 'min-h-11 max-w-full rounded-lg border border-slate-200 bg-white px-2 text-sm disabled:opacity-50';
const vi = {
  editor: { documentContent: 'Nội dung tài liệu', documentViewport: 'Các trang tài liệu', previewContent: 'Xem trước thay đổi', showDocumentOutline: 'Mục lục tài liệu', linkCopied: 'Đã sao chép liên kết', fontSubstitutionNotice: 'Đang dùng phông thay thế: {fonts}' },
  common: { cancel: 'Hủy', apply: 'Áp dụng', close: 'Đóng', comment: 'Bình luận', dismiss: 'Đóng thông báo' },
  headerFooter: { chromeAriaLabel: 'Chỉnh sửa đầu trang và chân trang', header: 'Đầu trang', footer: 'Chân trang', firstPageHeader: 'Đầu trang đầu tiên', firstPageFooter: 'Chân trang đầu tiên', evenPageHeader: 'Đầu trang chẵn', evenPageFooter: 'Chân trang chẵn', sameAsPrevious: 'Giống phần trước', sameAsPreviousHint: 'Thay đổi cũng áp dụng cho các trang của phần trước.', options: 'Tùy chọn', differentFirstPage: 'Trang đầu khác biệt', differentOddEven: 'Trang chẵn lẻ khác nhau', differentOddEvenHint: 'Áp dụng cho toàn bộ tài liệu.', linkToPrevious: 'Liên kết phần trước', unlinkFromPrevious: 'Hủy liên kết phần trước', headerDistance: 'Khoảng cách đầu trang', footerDistance: 'Khoảng cách chân trang', removeHeader: 'Xóa đầu trang', removeFooter: 'Xóa chân trang', insertPageNumber: 'Chèn số trang hiện tại', insertTotalPages: 'Chèn tổng số trang', insertSectionPages: 'Chèn số trang của phần', insertPageXofY: 'Chèn trang X trên Y' },
  image: { unsupportedFormat: 'Định dạng ảnh chưa hỗ trợ ({format})', nonPictureGraphic: 'Đồ họa chưa hỗ trợ ({kind})', missingResource: 'Không tìm thấy ảnh', externalResource: 'Chưa tải ảnh bên ngoài', invalidResource: 'Ảnh không hợp lệ', contentMismatch: 'Nội dung ảnh không khớp định dạng', decodeFailed: 'Không đọc được ảnh', resourceLimit: 'Ảnh vượt giới hạn kích thước', pendingResource: 'Đang tải ảnh' },
};

export default function DocxOnlineEditor({ sourceKey, title, load, onSave, onClose, readOnly = false, author }: {
  sourceKey: string; title: string; load: (signal: AbortSignal) => Promise<{ blob: Blob; fileName: string }>;
  onSave?: (file: File) => Promise<void>; onClose: () => void; readOnly?: boolean; author: string;
}) {
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
  const guard = useUnsavedChanges(dirty, busy);
  useEffect(() => { loader.current = load; }, [load]);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError(''); setBytes(undefined); setSnapshot(undefined); setDirty(false); setSaved(false); setCompatibilityWarning(false);
    void loader.current(controller.signal).then(async file => {
      const fileName = file.fileName.toLowerCase().endsWith('.docx') ? file.fileName : 'ban-khai.docx';
      const issue = validateDocumentFile(new File([file.blob], fileName), true);
      if (issue) throw new Error(issue);
      const data = new Uint8Array(await file.blob.arrayBuffer());
      if (!controller.signal.aborted) { setName(fileName); setBytes(data); }
    }).catch(err => { if (!controller.signal.aborted) setError(documentFormError(err)); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => { controller.abort(); unsubscribe.current.forEach(dispose => dispose()); unsubscribe.current = []; };
  }, [sourceKey, retry]);

  function ready(editor: Editor) {
    unsubscribe.current.forEach(dispose => dispose());
    const update = () => setSnapshot(editor.snapshot());
    update();
    unsubscribe.current = [editor.on('selectionChange', update), editor.on('change', update), editor.on('error', () => {
      if (editor.snapshot().parseError) setError('Không mở được tài liệu. Hãy tải DOCX về để kiểm tra bằng Word.');
      else setCompatibilityWarning(true);
    })];
  }
  async function exportFile() {
    const data = await editorRef.current?.save();
    if (!data) throw new Error('Tài liệu chưa sẵn sàng. Vui lòng chờ rồi thử lại.');
    const file = new File([data], name, { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    const issue = validateDocumentFile(file, true);
    if (issue) throw new Error(issue);
    return file;
  }
  async function save() {
    if (lock.current || readOnly || !onSave) return;
    lock.current = true; setBusy(true); setError('');
    const savingRevision = revision.current;
    try { await onSave(await exportFile()); if (savingRevision === revision.current) setDirty(false); setSaved(true); }
    catch (err) { setError(documentFormError(err)); }
    finally { lock.current = false; setBusy(false); }
  }
  async function download() {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError('');
    try { const file = await exportFile(); downloadBlob(file, file.name); }
    catch (err) { setError(documentFormError(err)); }
    finally { lock.current = false; setBusy(false); }
  }
  const engine = editorRef.current?.getEditor() ?? null;
  const editable = !readOnly && !busy && Boolean(snapshot?.editable);
  return <>
    <Modal open onOpenChange={open => { if (!open) guard.requestClose(onClose); }} title={title} description="Soạn thảo trực tuyến · Tệp Word của hồ sơ tiền kiểm" className="sm:inset-3 sm:left-3 sm:top-3 sm:h-[calc(100dvh-1.5rem)] sm:max-h-none sm:w-auto sm:max-w-none sm:translate-x-0 sm:translate-y-0" bodyClassName="flex flex-col overflow-hidden p-0">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3">
        <div className="flex min-w-0 items-center gap-3"><FileDoc size={28} className="shrink-0 text-red-800" aria-hidden /><div className="min-w-0"><p className="truncate font-semibold">{name}</p><p role="status" className="text-xs text-slate-500">{busy ? 'Đang xử lý…' : readOnly ? 'Chỉ xem' : dirty ? 'Có thay đổi chưa lưu' : saved ? 'Đã lưu vào hồ sơ' : 'Chưa có thay đổi'}</p></div></div>
        <div className="flex flex-wrap gap-2"><Button size="small" variant="outline" disabled={!bytes || busy || Boolean(snapshot?.parseError)} onClick={() => void download()}><DownloadSimple size={18} aria-hidden />Tải DOCX</Button>{!readOnly && onSave && <Button size="small" disabled={!editable} loading={busy} onClick={() => void save()}><FloppyDisk size={18} aria-hidden />Lưu vào hồ sơ</Button>}</div>
      </div>
      {!readOnly && <nav aria-label="Công cụ soạn thảo" className="flex shrink-0 gap-1 border-b bg-white px-3">{([{ id: 'home', label: 'Trang đầu' }, { id: 'insert', label: 'Chèn' }, { id: 'layout', label: 'Bố trí' }] as const).map(item => <button key={item.id} type="button" aria-pressed={tab === item.id} onClick={() => setTab(item.id)} className="min-h-11 border-b-2 border-transparent px-4 text-sm font-semibold text-slate-600 focus-visible:outline-red-700 aria-pressed:border-red-700 aria-pressed:text-red-800">{item.label}</button>)}</nav>}
      {!readOnly && <div role="toolbar" aria-label="Định dạng văn bản" className="flex min-h-16 shrink-0 flex-wrap items-center gap-1 border-b border-slate-200 bg-slate-50 p-2">
        {tab === 'home' && <>
        <select aria-label="Phông chữ" className={selectClass} disabled={!editable} value={snapshot?.formatting?.fontFamily ?? ''} onChange={e => { runToolbarCommand(engine, 'font.family', e.target.value); engine?.focus(); }}><option value="">Phông chữ</option>{Array.from(new Set(['Times New Roman', 'Arial', 'Calibri', 'Cambria', 'Courier New', ...(snapshot?.formatting?.fontFamily ? [snapshot.formatting.fontFamily] : [])])).map(font => <option key={font}>{font}</option>)}</select>
        <select aria-label="Cỡ chữ" className={selectClass} disabled={!editable} value={snapshot?.formatting?.fontSizePt ?? ''} onChange={e => { runToolbarCommand(engine, 'font.size', Number(e.target.value) * 2); engine?.focus(); }}><option value="">Cỡ chữ</option>{Array.from(new Set([8, 9, 10, 11, 12, 13, 14, 16, 18, 20, 24, 28, 36, ...(snapshot?.formatting?.fontSizePt ? [snapshot.formatting.fontSizePt] : [])])).sort((a,b) => a-b).map(size => <option key={size}>{size}</option>)}</select>
        {tools.map(tool => { const state = toolbarCommandState(engine, tool.id); const Icon = tool.icon; return <button key={tool.id} type="button" aria-label={tool.label} title={tool.label} aria-pressed={state.active} disabled={!editable || !state.enabled} onMouseDown={e => e.preventDefault()} onClick={() => { runToolbarCommand(engine, tool.id); engine?.focus(); }} className="grid min-h-11 min-w-11 place-items-center rounded-lg text-slate-700 hover:bg-slate-200 focus-visible:outline-2 focus-visible:outline-red-700 disabled:opacity-40 aria-pressed:bg-red-100 aria-pressed:text-red-900"><Icon size={20} aria-hidden /></button>; })}
        </>}
        {tab === 'insert' && <>
        <Button variant="ghost" size="small" disabled={!editable} onMouseDown={e => e.preventDefault()} onClick={() => { const result = engine?.exec({ type: 'insertTable', rows: 2, cols: 2 }); if (result && !result.ok) setError('Chưa thể chèn bảng tại vị trí này. Hãy đặt con trỏ vào một đoạn văn khác.'); engine?.focus(); }}><Table size={18} aria-hidden />Chèn bảng 2 × 2</Button>
        <Button variant="ghost" size="small" disabled={!editable} onMouseDown={e => e.preventDefault()} onClick={() => { runToolbarCommand(engine, 'insert.pageBreak'); engine?.focus(); }}>Ngắt trang</Button>
        </>}
        {tab === 'layout' && <>
          <label className="flex items-center gap-2 px-2 text-sm">Hướng giấy<select aria-label="Hướng giấy" className={selectClass} disabled={!editable} value={snapshot?.pageSetup?.orientation ?? 'portrait'} onChange={e => { engine?.exec({ type: 'setPageSetup', orientation: e.target.value as 'portrait' | 'landscape' }); engine?.focus(); }}><option value="portrait">Dọc</option><option value="landscape">Ngang</option></select></label>
          <Button variant="ghost" size="small" disabled={!editable} onClick={() => { engine?.exec({ type: 'setPageSetup', pageWidth: 11906, pageHeight: 16838, orientation: 'portrait' }); engine?.focus(); }}>Khổ A4</Button>
          <Button variant="ghost" size="small" disabled={!editable} onClick={() => { engine?.exec({ type: 'setPageSetup', marginTop: 1440, marginRight: 1440, marginBottom: 1440, marginLeft: 1440 }); engine?.focus(); }}>Lề đều 2,54 cm</Button>
        </>}
      </div>}
      {error && <div role="alert" className="flex flex-wrap items-center gap-2 border-b border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800"><p>{error}</p>{!bytes && <Button size="small" variant="outline" onClick={() => setRetry(x => x + 1)}>Thử tải lại</Button>}</div>}
      {snapshot?.hasReviewContent && <p className="border-b bg-amber-50 px-4 py-2 text-sm text-amber-900">Tài liệu có bình luận hoặc theo dõi thay đổi. Để đọc đầy đủ bình luận, hãy mở DOCX bằng Word.</p>}
      {compatibilityWarning && <p role="status" className="border-b bg-amber-50 px-4 py-2 text-xs text-amber-900">Một số chi tiết tài liệu có thể hiển thị khác Word. Hãy đối chiếu bản tải về trước khi chốt.</p>}
      <div className="relative min-h-0 flex-1 bg-slate-200" aria-label="Vùng soạn thảo DOCX" onKeyDownCapture={event => { if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') { event.preventDefault(); event.stopPropagation(); if (!readOnly) void save(); } }}>
        {loading && <p role="status" className="p-6 text-sm">Đang tải bản Word đã lưu…</p>}
        {bytes && <DocxEditor key={`${sourceKey}-${retry}`} ref={editorRef} document={bytes} fonts={fonts} locale="vi-VN" i18n={vi} author={author} chrome={false} menu={false} contextMenu={false} hyperlinkPopup={false} openFailure={false} mode={readOnly || busy ? 'view' : 'edit'} zoom={zoom === 'fit' ? undefined : zoom / 100} zoomMode={zoom === 'fit' ? 'auto' : { type: 'fixed' }} onReady={ready} onChange={change => { if (!change.source) { revision.current++; setDirty(true); setSaved(false); } }} className="h-full" />}
        {snapshot?.parseError && <p role="alert" className="absolute inset-x-0 top-0 bg-red-50 p-4 text-sm text-red-800">Không mở được DOCX. Hãy đóng editor và kiểm tra tệp bằng Word.</p>}
      </div>
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-slate-200 bg-white px-4 py-2 text-xs text-slate-600"><span>Trang {snapshot?.page.current ?? 0} / {snapshot?.page.total ?? 0} · {readOnly ? 'Chỉ xem' : 'Chỉnh sửa'}</span><label className="flex items-center gap-2">Thu phóng<select aria-label="Thu phóng tài liệu" className={selectClass} value={zoom} onChange={e => setZoom(e.target.value === 'fit' ? 'fit' : Number(e.target.value))}><option value="fit">Vừa chiều rộng</option>{[50, 75, 100, 125, 150, 200].map(value => <option key={value} value={value}>{value}%</option>)}</select></label></div>
    </Modal>
    {guard.confirmation}
  </>;
}
