import { useState, useRef, useEffect } from 'react';
import { UploadSimple, FileDoc, Warning, X } from '@phosphor-icons/react';
import { Button, Modal } from '@/components/ui';
import { toast } from '@/components/ui/Toast';
import {
  createFormTemplate,
  uploadFormTemplateDocx,
  formTemplateErrorMessage,
} from '@/lib/api/formTemplates';

export interface DirectTemplateUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialCode?: string;
  initialName?: string;
  onSuccess: (template: { id: string; code: string; title: string }) => void | Promise<void>;
}

export function DirectTemplateUploadModal({
  open,
  onOpenChange,
  initialCode = '',
  initialName = '',
  onSuccess,
}: DirectTemplateUploadModalProps) {
  const [code, setCode] = useState(initialCode);
  const [title, setTitle] = useState(initialName);
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Đồng bộ lại khi mở modal hoặc thay đổi props
  useEffect(() => {
    if (open) {
      setCode(initialCode.trim().toUpperCase());
      setTitle(initialName.trim());
      setFile(null);
      setErrorMessage('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [open, initialCode, initialName]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) {
      setFile(null);
      return;
    }
    const name = selected.name.toLowerCase();
    if (!name.endsWith('.docx') && !name.endsWith('.doc')) {
      setErrorMessage('Chỉ chấp nhận tệp văn bản Word (.docx, .doc).');
      setFile(null);
      return;
    }
    if (selected.size > 20 * 1024 * 1024) {
      setErrorMessage('Kích thước tệp vượt quá giới hạn 20 MB.');
      setFile(null);
      return;
    }
    setErrorMessage('');
    setFile(selected);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.trim().toUpperCase();
    const cleanTitle = title.trim();

    if (!cleanCode) {
      setErrorMessage('Vui lòng nhập mã biểu mẫu.');
      return;
    }
    if (!cleanTitle) {
      setErrorMessage('Vui lòng nhập tên biểu mẫu.');
      return;
    }
    if (!file) {
      setErrorMessage('Vui lòng chọn tệp Word (.docx) mẫu để tải lên.');
      return;
    }

    setSubmitting(true);
    setErrorMessage('');

    try {
      // Bước 1: Tạo metadata mẫu trong kho
      const created = await createFormTemplate({
        code: cleanCode,
        title: cleanTitle,
      });

      // Bước 2: Tải file Word lên kho mẫu
      await uploadFormTemplateDocx(created.id, file);

      // Bước 3: Thông báo và liên kết vào biểu mẫu
      toast.success(`Đã tạo phôi và tải tệp DOCX thành công cho "${cleanTitle}".`);
      await onSuccess({
        id: created.id,
        code: cleanCode,
        title: cleanTitle,
      });

      onOpenChange(false);
    } catch (err) {
      const msg = formTemplateErrorMessage(err);
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={(next) => {
        if (!submitting) onOpenChange(next);
      }}
      title="Tạo phôi & Tải tệp DOCX trực tiếp"
      description="Khởi tạo phôi biểu mẫu vào kho dữ liệu và tải tệp Word (.docx) để liên kết vào thủ tục này."
      className="sm:max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-900">
            <Warning size={16} className="mt-0.5 shrink-0 text-red-600" weight="fill" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="sm:col-span-1">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Mã biểu mẫu <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              required
              maxLength={50}
              placeholder="VD: DON_01"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              disabled={submitting}
              className="w-full h-9 px-3 text-xs font-mono font-bold uppercase bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tên biểu mẫu <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              required
              maxLength={255}
              placeholder="VD: Đơn xin cấp bản sao trích lục"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={submitting}
              className="w-full h-9 px-3 text-xs font-medium bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Tệp Word mẫu gốc (.docx) <span className="text-red-600">*</span>
          </label>
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`group flex min-h-[90px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-4 text-center transition-colors ${
              file
                ? 'border-emerald-300 bg-emerald-50/40 hover:border-emerald-400'
                : 'border-slate-300 bg-slate-50/60 hover:border-red-400 hover:bg-red-50/30'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".docx,.doc,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword"
              onChange={handleFileChange}
              disabled={submitting}
              className="sr-only"
            />
            {file ? (
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800">
                <FileDoc size={20} className="text-emerald-700 shrink-0" weight="fill" />
                <span className="truncate max-w-[280px]">{file.name}</span>
                <span className="text-[11px] text-slate-500">({(file.size / 1024).toFixed(0)} KB)</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="p-1 text-slate-400 hover:text-red-600 rounded-full"
                  title="Xóa tệp đã chọn"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="flex items-center justify-center gap-1.5 text-xs font-medium text-slate-700 group-hover:text-red-900">
                  <UploadSimple size={18} className="text-slate-500 group-hover:text-red-700" />
                  <span>Bấm vào đây để chọn tệp .docx</span>
                </div>
                <p className="text-[11px] text-slate-400">Tối đa 20 MB. Tệp sẽ được lưu vào kho phôi mẫu để dùng lại.</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            size="small"
            disabled={submitting}
            onClick={() => onOpenChange(false)}
          >
            Hủy
          </Button>
          <Button
            type="submit"
            size="small"
            variant="primary"
            loading={submitting}
            disabled={submitting}
          >
            <UploadSimple size={16} aria-hidden />
            Tải lên & Liên kết
          </Button>
        </div>
      </form>
    </Modal>
  );
}

