import React from 'react';
import { X, Eye, FileText, DownloadSimple } from '@phosphor-icons/react';

interface DocumentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: {
    name: string;
    url: string;
    type: string;
    size?: string;
  } | null;
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  isOpen,
  onClose,
  file,
}) => {
  if (!isOpen || !file) return null;

  const isImage = file.type.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif)$/i.test(file.name);
  const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative flex flex-col w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-red-100 text-red-800">
              <Eye size={20} weight="bold" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-slate-900 truncate max-w-md">
                {file.name}
              </h3>
              <p className="text-xs text-slate-500">
                {file.type || 'Tệp đính kèm'} {file.size ? `· ${file.size}` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={file.url}
              download={file.name}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors shadow-2xs"
            >
              <DownloadSimple size={15} weight="bold" />
              <span>Tải về</span>
            </a>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
            >
              <X size={20} weight="bold" />
            </button>
          </div>
        </div>

        {/* Preview Content */}
        <div className="flex-1 overflow-auto p-6 flex items-center justify-center bg-slate-100/70 min-h-[400px]">
          {isImage ? (
            <img
              src={file.url}
              alt={file.name}
              className="max-h-[70vh] max-w-full object-contain rounded-xl shadow-md border border-slate-200"
            />
          ) : isPdf ? (
            <iframe
              src={file.url}
              title={file.name}
              className="w-full h-[70vh] rounded-xl border border-slate-300 bg-white"
            />
          ) : (
            <div className="text-center p-8 bg-white rounded-2xl border border-slate-200 shadow-xs max-w-sm">
              <FileText size={48} className="mx-auto text-slate-400 mb-3" />
              <p className="text-sm font-semibold text-slate-800">Không thể xem trước tệp này trực tiếp</p>
              <p className="text-xs text-slate-500 mt-1 mb-4">
                Vui lòng tải tệp về máy để xem nội dung chi tiết.
              </p>
              <a
                href={file.url}
                download={file.name}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-800 text-white text-xs font-bold hover:bg-red-900 transition-all shadow-sm"
              >
                <DownloadSimple size={16} weight="bold" /> Tải về máy
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
