import { X, Printer, FilePdf } from '@phosphor-icons/react';
import type { ChecklistItem } from '@/lib/procedureContent';

interface FormPreviewModalProps {
  open: boolean;
  onClose: () => void;
  item: ChecklistItem | null;
  procedureName: string;
  onOpenEdit?: (item: ChecklistItem) => void;
}

export function FormPreviewModal({
  open,
  onClose,
  item,
  procedureName,
  onOpenEdit,
}: FormPreviewModalProps) {
  if (!open || !item) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="preview-modal-title"
      className="fixed inset-0 z-50 flex flex-col bg-slate-900/80 backdrop-blur-xs animate-in fade-in duration-200"
    >
      {/* Header */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-700 bg-slate-900 px-4 text-white shadow-md">
        <div className="flex items-center gap-3">
          <div className="grid size-9 place-items-center rounded-lg bg-sky-700 text-white font-bold text-sm shadow-xs">
            <FilePdf size={20} weight="bold" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 id="preview-modal-title" className="text-sm font-bold text-slate-100 max-w-md truncate">
                Xem trước: {item.itemName}
              </h1>
              <span className="rounded bg-sky-800/60 px-2 py-0.5 text-[11px] font-mono text-sky-200">
                Bản mẫu chuẩn
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Thủ tục: {procedureName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onOpenEdit && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenEdit(item);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-red-700 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-red-600 transition-colors"
            >
              Chuyển sang Soạn thảo
            </button>
          )}

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            title="In văn bản"
          >
            <Printer size={18} />
          </button>

          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng xem trước"
            className="inline-grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X size={20} weight="bold" />
          </button>
        </div>
      </header>

      {/* Trang A4 Preview */}
      <div className="flex-1 overflow-auto bg-slate-300 p-6 sm:p-10 flex justify-center">
        <div
          style={{ fontFamily: '"Times New Roman", Times, serif' }}
          className="w-full max-w-[800px] min-h-[1100px] bg-white p-12 sm:p-16 text-slate-900 shadow-2xl rounded-xs"
        >
          {/* Header Quốc hiệu - Tiêu ngữ */}
          <div className="text-center space-y-1 mb-8">
            <p className="font-bold text-sm tracking-wider uppercase">
              CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
            </p>
            <p className="font-bold text-sm underline underline-offset-4">
              Độc lập - Tự do - Hạnh phúc
            </p>
          </div>

          {/* Tiêu đề tờ khai */}
          <div className="text-center my-6 space-y-2">
            <h2 className="text-xl font-bold uppercase tracking-tight">
              {item.itemName}
            </h2>
            <p className="italic text-sm text-slate-600">
              Kính gửi: Bộ phận Tiếp nhận và Trả kết quả UBND Phường / Xã
            </p>
          </div>

          {/* Nội dung mẫu */}
          <div className="space-y-4 text-[14px] leading-relaxed mt-8">
            <p><strong>1. Họ và tên người yêu cầu: </strong> ....................................................................................................</p>
            <p><strong>2. Ngày, tháng, năm sinh: </strong> ..... / ..... / ......... <strong>Giới tính: </strong> ..........................................</p>
            <p><strong>3. Số CCCD / Số định danh cá nhân: </strong> ....................................................................................</p>
            <p><strong>4. Nơi đăng ký thường trú: </strong> .......................................................................................................</p>
            <p><strong>5. Nơi ở hiện tại: </strong> .........................................................................................................................</p>
            <p><strong>6. Số điện thoại: </strong> ..................................................... <strong>Email: </strong> ...................................................</p>
            
            <p className="pt-3"><strong>7. Nội dung yêu cầu giải quyết thủ tục: </strong></p>
            <div className="rounded border border-dashed border-slate-300 p-4 min-h-[100px] text-slate-500 italic bg-slate-50">
              (Ghi rõ mục đích, yêu cầu cụ thể đối với thủ tục: {procedureName})
            </div>

            <p className="pt-3"><strong>8. Danh mục tài liệu đính kèm theo hồ sơ: </strong></p>
            <p>- Giấy tờ nhân thân (CCCD / VNeID Mức 2);</p>
            <p>- Các giấy tờ, tài liệu liên quan theo quy định.</p>

            {/* Chữ ký */}
            <div className="grid grid-cols-2 pt-16 text-center text-sm">
              <div></div>
              <div className="space-y-1">
                <p className="italic">......, ngày ..... tháng ..... năm 202...</p>
                <p className="font-bold">NGƯỜI LÀM ĐƠN</p>
                <p className="text-xs italic text-slate-500">(Ký và ghi rõ họ tên)</p>
                <div className="h-24" />
                <p className="italic text-slate-400">....................................................</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
