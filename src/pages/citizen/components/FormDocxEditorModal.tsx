import { useState, useRef, useEffect } from 'react';
import {
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
  Sparkle,
  FileDoc,
  MagnifyingGlassPlus,
  MagnifyingGlassMinus,
  Table,
  ListBullets,
  ListNumbers,
  TextT,
  ArrowsOut,
  ArrowsIn,
  X,
} from '@phosphor-icons/react';
import { toast } from '@/components/ui/Toast';
import type { ChecklistItem } from '@/lib/procedureContent';
import type { UserProfileDto } from '@/types/profile';

interface FormDocxEditorModalProps {
  open: boolean;
  onClose: () => void;
  item: ChecklistItem | null;
  procedureName: string;
  userProfile?: UserProfileDto | null;
}

export function FormDocxEditorModal({
  open,
  onClose,
  item,
  procedureName,
  userProfile,
}: FormDocxEditorModalProps) {
  const [zoom, setZoom] = useState<number>(100);
  const [, setIsSaved] = useState<boolean>(true);
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

  // Tính năng Auto-fill từ User Profile (CCCD/VNeID Mức 2)
  const handleAutoFill = () => {
    if (!editorRef.current) return;

    if (!userProfile) {
      toast.warning('Chưa có dữ liệu hồ sơ cá nhân để tự động điền.');
      return;
    }

    let count = 0;

    // 1. Họ và tên
    if (userProfile.fullName) {
      editorRef.current.querySelectorAll('.fill-citizen-name').forEach((el) => {
        el.textContent = userProfile.fullName.toUpperCase();
        count++;
      });
    }

    // 2. Ngày sinh
    if (userProfile.dateOfBirth) {
      editorRef.current.querySelectorAll('.fill-citizen-dob').forEach((el) => {
        // Đổi YYYY-MM-DD sang DD/MM/YYYY nếu cần
        const parts = userProfile.dateOfBirth!.split('-');
        el.textContent = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : userProfile.dateOfBirth!;
        count++;
      });
    }

    // 3. Giới tính
    if (userProfile.gender) {
      editorRef.current.querySelectorAll('.fill-citizen-gender').forEach((el) => {
        el.textContent = userProfile.gender!;
        count++;
      });
    }

    // 4. Số CCCD
    if (userProfile.identityNumber) {
      editorRef.current.querySelectorAll('.fill-citizen-id').forEach((el) => {
        el.textContent = userProfile.identityNumber!;
        count++;
      });
    }

    // 5. Địa chỉ thường trú / tạm trú
    const address = userProfile.permanentAddress || userProfile.temporaryAddress;
    if (address) {
      editorRef.current.querySelectorAll('.fill-citizen-address').forEach((el) => {
        el.textContent = address;
        count++;
      });
    }

    // 6. Số điện thoại
    if (userProfile.phoneNumber) {
      editorRef.current.querySelectorAll('.fill-citizen-phone').forEach((el) => {
        el.textContent = userProfile.phoneNumber!;
        count++;
      });
    }

    setIsSaved(false);
    updateWordCount();
    toast.success(`Đã tự động điền ${count} mục thông tin từ định danh cá nhân VNeID`);
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

  const displayName = userProfile?.fullName || 'NGUYỄN VĂN AN';

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
              <span className="hidden sm:inline-block rounded bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-slate-300">
                A4 · Chuẩn thể thức NĐ 30/2020/NĐ-CP
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handlePrint}
              className="hidden sm:inline-flex items-center gap-1 rounded px-2.5 py-1 text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
              title="In biểu mẫu (Ctrl+P)"
            >
              <Printer size={15} />
              <span>In ấn</span>
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center gap-1 rounded bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
              title="Tải tệp định dạng .docx"
            >
              <DownloadSimple size={15} />
              <span className="hidden sm:inline">Tải .docx</span>
            </button>

            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="grid size-7 place-items-center rounded text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
              title={isFullscreen ? 'Thu nhỏ cửa sổ' : 'Toàn màn hình'}
            >
              {isFullscreen ? <ArrowsIn size={16} /> : <ArrowsOut size={16} />}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="grid size-7 place-items-center rounded text-slate-400 hover:bg-red-900/80 hover:text-white transition-colors ml-1"
              title="Đóng trình soạn thảo"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ==================== 2. RIBBON TABS & ACTIONS ==================== */}
        <div className="border-b border-slate-200 bg-white shadow-2xs shrink-0">
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
                title="Tự động điền họ tên, CCCD, ngày sinh, địa chỉ từ tài khoản cá nhân vào biểu mẫu"
              >
                <Sparkle size={14} weight="fill" className="text-amber-600" />
                <span>Tự động điền từ Hồ sơ cá nhân / VNeID</span>
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="inline-flex items-center gap-1 rounded-lg bg-emerald-700 px-3 py-1 text-xs font-bold text-white hover:bg-emerald-800 transition-colors shadow-2xs"
                title="Lưu biểu mẫu"
              >
                <FloppyDisk size={14} weight="bold" />
                <span>Lưu văn bản</span>
              </button>
            </div>
          </div>

          {/* Toolbar Ribbon Controls */}
          <div className="flex flex-wrap items-center gap-2 p-2 px-3 text-xs bg-white min-h-[44px]">
            {activeTab === 'home' && (
              <>
                {/* Font selector */}
                <select
                  aria-label="Phông chữ"
                  defaultValue="Times New Roman"
                  onChange={(e) => applyFormat('fontName', e.target.value)}
                  className="rounded-md border border-slate-300 bg-slate-50 px-2 py-1 text-xs text-slate-800 font-serif focus:bg-white"
                >
                  <option value="Times New Roman">Times New Roman (Chuẩn văn bản)</option>
                  <option value="Arial">Arial</option>
                  <option value="Calibri">Calibri</option>
                </select>

                {/* Font size */}
                <select
                  aria-label="Cỡ chữ"
                  defaultValue="3"
                  onChange={(e) => applyFormat('fontSize', e.target.value)}
                  className="rounded-md border border-slate-300 bg-slate-50 px-2 py-1 text-xs text-slate-800 focus:bg-white"
                >
                  <option value="1">10 pt</option>
                  <option value="2">12 pt</option>
                  <option value="3">14 pt (Chuẩn NĐ 30)</option>
                  <option value="4">16 pt</option>
                  <option value="5">18 pt</option>
                </select>

                <div className="h-5 w-px bg-slate-200 mx-1" />

                {/* Text Formatting */}
                <div className="flex items-center gap-0.5 rounded-lg border border-slate-200 bg-slate-50/80 p-0.5">
                  <button
                    type="button"
                    onClick={() => applyFormat('bold')}
                    className="grid size-7 place-items-center rounded text-slate-800 hover:bg-white hover:shadow-2xs"
                    title="In đậm (Ctrl+B)"
                  >
                    <TextB size={15} weight="bold" />
                  </button>
                  <button
                    type="button"
                    onClick={() => applyFormat('italic')}
                    className="grid size-7 place-items-center rounded text-slate-800 hover:bg-white hover:shadow-2xs"
                    title="In nghiêng (Ctrl+I)"
                  >
                    <TextItalic size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => applyFormat('underline')}
                    className="grid size-7 place-items-center rounded text-slate-800 hover:bg-white hover:shadow-2xs"
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
              </div>
            )}

            {activeTab === 'layout' && (
              <div className="flex items-center gap-4 text-slate-700">
                <span>Khổ giấy: <strong>A4 (210 x 297 mm)</strong></span>
                <span>Lề trên: <strong>20 mm</strong></span>
                <span>Lề dưới: <strong>20 mm</strong></span>
                <span>Lề trái: <strong>30 mm</strong></span>
                <span>Lề phải: <strong>15 mm</strong></span>
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
                  {displayName}
                </span>
              </p>

              <p>
                <strong>2. Ngày, tháng, năm sinh: </strong>
                <span className="fill-citizen-dob font-medium">
                  {userProfile?.dateOfBirth || '...... / ...... / ............'}
                </span>
                <strong className="ml-10">Giới tính: </strong>
                <span className="fill-citizen-gender font-medium">
                  {userProfile?.gender || '............'}
                </span>
              </p>

              <p>
                <strong>3. Số Căn cước công dân / Định danh cá nhân: </strong>
                <span className="fill-citizen-id font-mono font-bold text-slate-800">
                  {userProfile?.identityNumber || '....................................'}
                </span>
              </p>

              <p>
                <strong>4. Nơi cư trú hiện tại (thường trú / tạm trú): </strong>
                <span className="fill-citizen-address font-medium">
                  {userProfile?.permanentAddress || userProfile?.temporaryAddress || '....................................................................................................'}
                </span>
              </p>

              <p>
                <strong>5. Số điện thoại liên hệ: </strong>
                <span className="fill-citizen-phone font-medium">
                  {userProfile?.phoneNumber || '....................................'}
                </span>
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
                  <p className="fill-citizen-name font-bold uppercase tracking-wide">{displayName}</p>
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
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setZoom(Math.max(50, zoom - 10))}
              className="p-1 hover:text-slate-900"
              title="Thu nhỏ"
            >
              <MagnifyingGlassMinus size={14} />
            </button>
            <span className="w-10 text-center font-mono font-medium">{zoom}%</span>
            <button
              type="button"
              onClick={() => setZoom(Math.min(150, zoom + 10))}
              className="p-1 hover:text-slate-900"
              title="Phóng to"
            >
              <MagnifyingGlassPlus size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
