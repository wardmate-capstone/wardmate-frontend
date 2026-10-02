import { useState, useRef, useEffect } from 'react';
import {
  X,
  Printer,
  DownloadSimple,
  FloppyDisk,
  TextB,
  TextItalic,
  TextUnderline,
  TextStrikethrough,
  TextAlignLeft,
  TextAlignCenter,
  TextAlignRight,
  TextAlignJustify,
  ArrowCounterClockwise,
  ArrowClockwise,
  Sparkle,
  FileDoc,
  MagnifyingGlassPlus,
  MagnifyingGlassMinus,
  CheckCircle,
  Table,
  ListBullets,
  ListNumbers,
  TextT,
  ArrowsOut,
  ArrowsIn,
} from '@phosphor-icons/react';
import { toast } from '@/components/ui/Toast';
import type { ChecklistItem } from '@/lib/procedureContent';

interface FormDocxEditorModalProps {
  open: boolean;
  onClose: () => void;
  item: ChecklistItem | null;
  procedureName: string;
  citizenName?: string;
}

export function FormDocxEditorModal({
  open,
  onClose,
  item,
  procedureName,
  citizenName = 'NGUYỄN VĂN AN',
}: FormDocxEditorModalProps) {
  const [zoom, setZoom] = useState<number>(100);
  const [isSaved, setIsSaved] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'home' | 'insert' | 'layout'>('home');
  const [wordCount, setWordCount] = useState<number>(245);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open || !item) return null;

  const applyFormat = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    setIsSaved(false);
    updateWordCount();
  };

  const updateWordCount = () => {
    if (editorRef.current) {
      const text = editorRef.current.innerText || '';
      const words = text.trim().split(/\s+/).filter(Boolean).length;
      setWordCount(words);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSave = () => {
    setIsSaved(true);
    toast.success('Đã lưu nội dung biểu mẫu thành công vào hồ sơ trực tuyến!');
  };

  const handleDownload = () => {
    toast.success(`Đang đóng gói và tải xuống tệp ${item.itemName}.docx`);
  };

  const handleAutoFill = () => {
    if (editorRef.current) {
      const nameElements = editorRef.current.querySelectorAll('.fill-citizen-name');
      nameElements.forEach((el) => {
        el.textContent = citizenName.toUpperCase();
      });
      setIsSaved(false);
      updateWordCount();
      toast.success(`Đã tự động trích xuất & điền thông tin định danh VNeID: ${citizenName}`);
    }
  };

  const handleInsertTable = () => {
    const tableHtml = `
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0; border: 1px solid #cbd5e1;">
        <thead>
          <tr style="background-color: #f8fafc;">
            <th style="border: 1px solid #cbd5e1; padding: 8px 12px; font-weight: bold; text-align: center; width: 60px;">STT</th>
            <th style="border: 1px solid #cbd5e1; padding: 8px 12px; font-weight: bold; text-align: left;">Tên tài liệu / Nội dung</th>
            <th style="border: 1px solid #cbd5e1; padding: 8px 12px; font-weight: bold; text-align: center; width: 120px;">Số bản</th>
            <th style="border: 1px solid #cbd5e1; padding: 8px 12px; font-weight: bold; text-align: left;">Ghi chú</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="border: 1px solid #cbd5e1; padding: 8px 12px; text-align: center;">01</td>
            <td style="border: 1px solid #cbd5e1; padding: 8px 12px;">Bản chính giấy tờ liên quan</td>
            <td style="border: 1px solid #cbd5e1; padding: 8px 12px; text-align: center;">01 bản chính</td>
            <td style="border: 1px solid #cbd5e1; padding: 8px 12px;">Đối chiếu tại Một cửa</td>
          </tr>
        </tbody>
      </table>
      <p><br/></p>
    `;
    document.execCommand('insertHTML', false, tableHtml);
    setIsSaved(false);
    updateWordCount();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="editor-title"
      className={`fixed inset-0 z-50 flex flex-col bg-slate-900/85 backdrop-blur-sm animate-in fade-in duration-150 ${
        isFullscreen ? 'p-0' : 'p-2 sm:p-4'
      }`}
    >
      <div className="flex h-full w-full flex-col overflow-hidden rounded-xl border border-slate-700 bg-slate-100 shadow-2xl">
        {/* ==================== 1. WINDOW TITLEBAR ==================== */}
        <div className="flex h-11 shrink-0 items-center justify-between border-b border-slate-800 bg-slate-900 px-3.5 text-white">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="grid size-7 place-items-center rounded bg-red-700 text-white shadow-xs">
              <FileDoc size={18} weight="fill" />
            </span>
            <div className="flex items-center gap-2 min-w-0">
              <h1 id="editor-title" className="text-xs font-bold text-slate-100 truncate max-w-xs sm:max-w-md">
                {item.itemName}
              </h1>
              <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono text-slate-300">
                .docx
              </span>
              <span className="hidden sm:inline-block text-slate-500">|</span>
              <span className="hidden sm:inline-block text-[11px] text-slate-400 truncate max-w-xs">
                {procedureName}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {isSaved ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-950/80 px-2 py-0.5 text-[11px] font-medium text-emerald-300 border border-emerald-800/60">
                <CheckCircle size={13} weight="bold" /> Đã lưu đám mây
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-950/80 px-2 py-0.5 text-[11px] font-medium text-amber-300 border border-amber-800/60 animate-pulse">
                Chưa lưu thay đổi...
              </span>
            )}

            <button
              type="button"
              onClick={() => setIsFullscreen((prev) => !prev)}
              aria-label={isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}
              className="grid size-7 place-items-center rounded text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
              title={isFullscreen ? 'Thu nhỏ cửa sổ' : 'Phóng toàn màn hình'}
            >
              {isFullscreen ? <ArrowsIn size={15} /> : <ArrowsOut size={15} />}
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng trình soạn thảo"
              className="grid size-7 place-items-center rounded text-slate-400 hover:bg-red-700 hover:text-white transition-colors ml-1"
            >
              <X size={17} weight="bold" />
            </button>
          </div>
        </div>

        {/* ==================== 2. RIBBON TABS & ACTIONS ==================== */}
        <div className="border-b border-slate-200 bg-white shadow-2xs shrink-0">
          {/* Menu Tab Bar */}
          <div className="flex items-center justify-between border-b border-slate-200/80 px-3 bg-slate-50 text-xs">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setActiveTab('home')}
                className={`px-3 py-2 font-bold transition-colors border-b-2 ${
                  activeTab === 'home'
                    ? 'border-red-700 text-red-900 bg-white'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                Trang đầu (Home)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('insert')}
                className={`px-3 py-2 font-bold transition-colors border-b-2 ${
                  activeTab === 'insert'
                    ? 'border-red-700 text-red-900 bg-white'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                Chèn (Insert)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('layout')}
                className={`px-3 py-2 font-bold transition-colors border-b-2 ${
                  activeTab === 'layout'
                    ? 'border-red-700 text-red-900 bg-white'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                Bố cục trang A4
              </button>
            </div>

            {/* Quick Actions bên phải */}
            <div className="flex items-center gap-2 py-1">
              <button
                type="button"
                onClick={handleAutoFill}
                className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-900 hover:bg-amber-100 transition-colors shadow-2xs"
                title="Tự động trích xuất họ tên, CCCD, địa chỉ từ tài khoản VNeID vào biểu mẫu"
              >
                <Sparkle size={14} weight="fill" className="text-amber-600" />
                <span>Điền VNeID</span>
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="inline-flex items-center gap-1 rounded-lg bg-emerald-700 px-3 py-1 text-xs font-bold text-white hover:bg-emerald-800 transition-colors shadow-2xs"
                title="Lưu biểu mẫu"
              >
                <FloppyDisk size={14} weight="bold" />
                <span>Lưu</span>
              </button>
              <button
                type="button"
                onClick={handleDownload}
                className="inline-flex items-center gap-1 rounded-lg bg-red-800 px-3 py-1 text-xs font-bold text-white hover:bg-red-900 transition-colors shadow-2xs"
                title="Tải tệp tin DOCX về máy tính"
              >
                <DownloadSimple size={14} weight="bold" />
                <span>Tải .DOCX</span>
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="grid size-7 place-items-center rounded border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
                title="In văn bản (Ctrl+P)"
              >
                <Printer size={15} />
              </button>
            </div>
          </div>

          {/* Ribbon Toolbar Content */}
          <div className="flex flex-wrap items-center gap-2 p-2 sm:px-4 text-xs">
            {activeTab === 'home' && (
              <>
                {/* Undo / Redo */}
                <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50/80 p-0.5">
                  <button
                    type="button"
                    onClick={() => applyFormat('undo')}
                    className="grid size-7 place-items-center rounded text-slate-700 hover:bg-white hover:shadow-2xs"
                    title="Hoàn tác (Ctrl+Z)"
                  >
                    <ArrowCounterClockwise size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => applyFormat('redo')}
                    className="grid size-7 place-items-center rounded text-slate-700 hover:bg-white hover:shadow-2xs"
                    title="Làm lại (Ctrl+Y)"
                  >
                    <ArrowClockwise size={15} />
                  </button>
                </div>

                {/* Font Selector & Size */}
                <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50/80 p-1">
                  <select
                    defaultValue="Times New Roman"
                    onChange={(e) => applyFormat('fontName', e.target.value)}
                    className="h-7 rounded border border-slate-200 bg-white px-2 font-medium text-slate-800 outline-none hover:border-slate-300"
                  >
                    <option value="Times New Roman">Times New Roman</option>
                    <option value="Arial">Arial</option>
                    <option value="Be Vietnam Pro">Be Vietnam Pro</option>
                  </select>

                  <select
                    defaultValue="3"
                    onChange={(e) => applyFormat('fontSize', e.target.value)}
                    className="h-7 rounded border border-slate-200 bg-white px-2 font-medium text-slate-800 outline-none hover:border-slate-300"
                  >
                    <option value="2">11 pt</option>
                    <option value="3">13 pt (Chuẩn DVC)</option>
                    <option value="4">14 pt (Nghị định 30)</option>
                    <option value="5">16 pt (Tiêu đề)</option>
                    <option value="6">18 pt</option>
                  </select>
                </div>

                {/* Text Styling: B, I, U, S */}
                <div className="flex items-center gap-0.5 rounded-lg border border-slate-200 bg-slate-50/80 p-0.5">
                  <button
                    type="button"
                    onClick={() => applyFormat('bold')}
                    className="grid size-7 place-items-center rounded font-bold text-slate-800 hover:bg-white hover:shadow-2xs"
                    title="In đậm (Ctrl+B)"
                  >
                    <TextB size={15} weight="bold" />
                  </button>
                  <button
                    type="button"
                    onClick={() => applyFormat('italic')}
                    className="grid size-7 place-items-center rounded italic text-slate-800 hover:bg-white hover:shadow-2xs"
                    title="In nghiêng (Ctrl+I)"
                  >
                    <TextItalic size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => applyFormat('underline')}
                    className="grid size-7 place-items-center rounded underline text-slate-800 hover:bg-white hover:shadow-2xs"
                    title="Gạch chân (Ctrl+U)"
                  >
                    <TextUnderline size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => applyFormat('strikeThrough')}
                    className="grid size-7 place-items-center rounded text-slate-800 hover:bg-white hover:shadow-2xs"
                    title="Gạch ngang"
                  >
                    <TextStrikethrough size={15} />
                  </button>
                </div>

                {/* Paragraph Alignment */}
                <div className="flex items-center gap-0.5 rounded-lg border border-slate-200 bg-slate-50/80 p-0.5">
                  <button
                    type="button"
                    onClick={() => applyFormat('justifyLeft')}
                    className="grid size-7 place-items-center rounded text-slate-700 hover:bg-white hover:shadow-2xs"
                    title="Căn trái"
                  >
                    <TextAlignLeft size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => applyFormat('justifyCenter')}
                    className="grid size-7 place-items-center rounded text-slate-700 hover:bg-white hover:shadow-2xs"
                    title="Căn giữa"
                  >
                    <TextAlignCenter size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => applyFormat('justifyRight')}
                    className="grid size-7 place-items-center rounded text-slate-700 hover:bg-white hover:shadow-2xs"
                    title="Căn phải"
                  >
                    <TextAlignRight size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => applyFormat('justifyFull')}
                    className="grid size-7 place-items-center rounded text-slate-700 hover:bg-white hover:shadow-2xs"
                    title="Căn đều hai bên"
                  >
                    <TextAlignJustify size={15} />
                  </button>
                </div>

                {/* Lists */}
                <div className="flex items-center gap-0.5 rounded-lg border border-slate-200 bg-slate-50/80 p-0.5">
                  <button
                    type="button"
                    onClick={() => applyFormat('insertUnorderedList')}
                    className="grid size-7 place-items-center rounded text-slate-700 hover:bg-white hover:shadow-2xs"
                    title="Danh sách dấu chấm"
                  >
                    <ListBullets size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => applyFormat('insertOrderedList')}
                    className="grid size-7 place-items-center rounded text-slate-700 hover:bg-white hover:shadow-2xs"
                    title="Danh sách số"
                  >
                    <ListNumbers size={15} />
                  </button>
                </div>

                {/* Clear format */}
                <button
                  type="button"
                  onClick={() => applyFormat('removeFormat')}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-slate-600 hover:bg-slate-50 transition-colors"
                  title="Xóa định dạng đang chọn"
                >
                  <TextT size={14} />
                  <span>Xóa định dạng</span>
                </button>
              </>
            )}

            {activeTab === 'insert' && (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleInsertTable}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-bold text-slate-800 shadow-2xs hover:bg-slate-50 transition-colors"
                >
                  <Table size={16} className="text-red-700" />
                  <span>Chèn bảng danh mục giấy tờ</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const hrHtml = '<hr style="border: 0; border-top: 1px solid #cbd5e1; margin: 16px 0;"/><p><br/></p>';
                    document.execCommand('insertHTML', false, hrHtml);
                    setIsSaved(false);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <span>Đường kẻ phân cách</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const signHtml = `
                      <div style="display: flex; justify-content: flex-end; margin-top: 32px; text-align: center;">
                        <div style="width: 250px;">
                          <p style="font-style: italic; font-size: 13px;">Hà Nội, ngày ... tháng ... năm ...</p>
                          <p style="font-weight: bold; margin-top: 4px;">NGƯỜI LÀM ĐƠN</p>
                          <p style="font-size: 11px; font-style: italic; color: #64748b;">(Ký và ghi rõ họ tên)</p>
                          <div style="height: 70px;"></div>
                          <p style="font-weight: bold; text-transform: uppercase;">${citizenName}</p>
                        </div>
                      </div>
                    `;
                    document.execCommand('insertHTML', false, signHtml);
                    setIsSaved(false);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <span>Chèn ô chữ ký chuẩn</span>
                </button>
              </div>
            )}

            {activeTab === 'layout' && (
              <div className="flex items-center gap-3 text-xs text-slate-600">
                <span className="font-semibold text-slate-800">Khổ giấy chuẩn: <strong>A4 (210 x 297 mm)</strong></span>
                <span className="text-slate-300">|</span>
                <span>Căn lề chuẩn Nghị định 30/2020/NĐ-CP: <strong>Trên: 20mm · Dưới: 20mm · Trái: 30mm · Phải: 15mm</strong></span>
              </div>
            )}
          </div>
        </div>

        {/* ==================== 3. RULER BAR ==================== */}
        <div className="hidden sm:flex h-5 shrink-0 items-center justify-between border-b border-slate-200 bg-slate-200/60 px-12 text-[9px] font-mono text-slate-400 select-none">
          <span>|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|</span>
          <span>Thước đo căn lề Nghị định 30/2020/NĐ-CP</span>
        </div>

        {/* ==================== 4. DOCUMENT CANVAS (TRANG GIẤY A4 SOẠN THẢO) ==================== */}
        <div className="relative flex-1 overflow-auto bg-slate-300/70 p-4 sm:p-10 flex justify-center">
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            onInput={() => {
              setIsSaved(false);
              updateWordCount();
            }}
            style={{
              transform: `scale(${zoom / 100})`,
              transformOrigin: 'top center',
              fontFamily: '"Times New Roman", Times, serif',
            }}
            className="w-full max-w-[820px] min-h-[1160px] bg-white px-10 py-12 sm:px-16 sm:py-16 text-slate-900 shadow-2xl rounded-xs outline-none transition-transform selection:bg-red-100 selection:text-red-900"
          >
            {/* Header Quốc hiệu - Tiêu ngữ */}
            <div className="text-center space-y-1 mb-8">
              <p className="font-bold text-sm sm:text-base tracking-wider uppercase">
                CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
              </p>
              <p className="font-bold text-sm sm:text-base">
                Độc lập - Tự do - Hạnh phúc
              </p>
              <div className="mx-auto w-36 border-b border-slate-800 pt-0.5" />
            </div>

            {/* Tiêu đề tờ khai */}
            <div className="text-center my-6 space-y-2">
              <h2 className="text-xl sm:text-2xl font-bold uppercase tracking-tight text-slate-950">
                {item.itemName}
              </h2>
              <p className="italic text-sm sm:text-base text-slate-700">
                Kính gửi: Bộ phận Một cửa - Ủy ban nhân dân Phường tiếp nhận giải quyết
              </p>
            </div>

            {/* Phần nội dung khai thông tin cá nhân */}
            <div className="space-y-4 text-[14px] leading-relaxed mt-8">
              <p>
                <strong>1. Họ, chữ đệm, tên người yêu cầu: </strong>
                <span className="fill-citizen-name font-bold uppercase underline decoration-dotted decoration-red-400">
                  {citizenName}
                </span>
              </p>

              <p>
                <strong>2. Ngày, tháng, năm sinh: </strong>
                <span>15/08/1992</span>
                <strong className="ml-10">Giới tính: </strong>
                <span>Nam</span>
              </p>

              <p>
                <strong>3. Số Căn cước công dân / Định danh cá nhân: </strong>
                <span className="font-mono font-bold text-slate-800">001092008921</span>
              </p>

              <p>
                <strong>4. Nơi cư trú hiện tại (thường trú / tạm trú): </strong>
                <span>Số 124 đường Trần Phú, Phường Hàng Mã, Quận Hoàn Kiếm, TP. Hà Nội</span>
              </p>

              <p>
                <strong>5. Số điện thoại liên hệ: </strong>
                <span>0912 345 678</span>
                <strong className="ml-10">Địa chỉ Email: </strong>
                <span>nguyenvanan.citizen@gmail.com</span>
              </p>

              <p className="pt-2">
                <strong>6. Nội dung đề nghị Quý cơ quan giải quyết: </strong>
              </p>
              <div className="rounded-lg border border-slate-300 p-4 bg-slate-50/60 min-h-[100px] leading-relaxed">
                Kính đề nghị Ủy ban nhân dân phường xem xét, kiểm tra và giải quyết thủ tục: <strong>{procedureName}</strong> theo đúng quy định hiện hành của pháp luật. Tôi xin cam đoan các thông tin kê khai trên là hoàn toàn chính xác, trung thực và hoàn toàn chịu trách nhiệm trước pháp luật về tính pháp lý của giấy tờ kèm theo.
              </div>

              <p className="pt-3">
                <strong>7. Danh mục thành phần giấy tờ, tài liệu kèm theo đơn: </strong>
              </p>
              <ul className="list-disc pl-6 space-y-1.5">
                <li>Bản chính tờ khai điện tử đã hoàn thiện thông tin.</li>
                <li>Bản sao Căn cước công dân gắn chip / Dữ liệu định danh điện tử VNeID Mức độ 2.</li>
                <li>Các giấy tờ chuyên môn liên quan theo từng trường hợp cụ thể.</li>
              </ul>

              {/* Phần chữ ký cuối trang chuẩn thể thức văn bản */}
              <div className="grid grid-cols-2 pt-12 text-center text-sm">
                <div></div>
                <div className="space-y-1">
                  <p className="italic text-xs sm:text-sm">
                    Hà Nội, ngày {new Date().getDate()} tháng {new Date().getMonth() + 1} năm {new Date().getFullYear()}
                  </p>
                  <p className="font-bold text-sm uppercase">NGƯỜI KÊ KHAI ĐƠN</p>
                  <p className="text-xs italic text-slate-500">(Ký và ghi rõ họ tên)</p>
                  <div className="h-24 flex items-center justify-center">
                    <span className="text-xs italic text-slate-400 font-mono">[Chữ ký số / Ký tay]</span>
                  </div>
                  <p className="fill-citizen-name font-bold uppercase tracking-wide">{citizenName}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ==================== 5. BOTTOM STATUS BAR ==================== */}
        <div className="flex h-8 shrink-0 items-center justify-between border-t border-slate-200 bg-white px-4 text-[11px] text-slate-600 select-none">
          <div className="flex items-center gap-4">
            <span className="font-medium">Trang 1 / 1 (Khổ A4)</span>
            <span className="text-slate-300">|</span>
            <span>Số từ: <strong>{wordCount}</strong> từ</span>
            <span className="text-slate-300">|</span>
            <span className="hidden sm:inline-block">Tiếng Việt (Vietnam)</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(60, z - 10))}
              className="grid size-6 place-items-center rounded hover:bg-slate-100"
              title="Thu nhỏ"
            >
              <MagnifyingGlassMinus size={13} />
            </button>
            <input
              type="range"
              min={60}
              max={150}
              step={5}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-20 sm:w-28 accent-red-700 h-1"
            />
            <span className="w-10 text-right font-mono font-semibold">{zoom}%</span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(150, z + 10))}
              className="grid size-6 place-items-center rounded hover:bg-slate-100"
              title="Phóng to"
            >
              <MagnifyingGlassPlus size={13} />
            </button>
            <button
              type="button"
              onClick={() => setZoom(100)}
              className="grid size-6 place-items-center rounded hover:bg-slate-100 ml-1 text-slate-500"
              title="Khôi phục zoom 100%"
            >
              <ArrowCounterClockwise size={12} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

