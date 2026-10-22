import React, { useState, useRef } from 'react';
import {
  Scan,
  UploadSimple,
  CheckCircle,
  WarningCircle,
  ArrowRight,
  ShieldCheck,
  X,
} from '@phosphor-icons/react';
import { Modal, Button } from '@/components/ui';
import { aiOcrApi, type CccdExtractionDto } from '@/lib/api/aiOcr';
import { toast } from '@/components/ui/Toast';

export interface CccdOcrScanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApplyExtractedData: (data: CccdExtractionDto) => void;
}

export const CccdOcrScanModal: React.FC<CccdOcrScanModalProps> = ({
  open,
  onOpenChange,
  onApplyExtractedData,
}) => {
  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);
  const [frontPreview, setFrontPreview] = useState<string | null>(null);
  const [backPreview, setBackPreview] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CccdExtractionDto | null>(null);

  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setFrontFile(null);
    setBackFile(null);
    if (frontPreview) URL.revokeObjectURL(frontPreview);
    if (backPreview) URL.revokeObjectURL(backPreview);
    setFrontPreview(null);
    setBackPreview(null);
    setResult(null);
    setError(null);
    setLoading(false);
  };

  const handleClose = (newOpen: boolean) => {
    if (!newOpen) {
      resetState();
    }
    onOpenChange(newOpen);
  };

  const handleFrontChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
      setError('Ảnh mặt trước phải có định dạng JPEG hoặc PNG.');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setError('Kích thước ảnh mặt trước không được vượt quá 8MB.');
      return;
    }

    setError(null);
    setFrontFile(file);
    if (frontPreview) URL.revokeObjectURL(frontPreview);
    setFrontPreview(URL.createObjectURL(file));
  };

  const handleBackChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
      setError('Ảnh mặt sau phải có định dạng JPEG hoặc PNG.');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setError('Kích thước ảnh mặt sau không được vượt quá 8MB.');
      return;
    }

    setError(null);
    setBackFile(file);
    if (backPreview) URL.revokeObjectURL(backPreview);
    setBackPreview(URL.createObjectURL(file));
  };

  const handleScan = async () => {
    if (!frontFile) {
      setError('Vui lòng chọn ảnh mặt trước của Căn cước công dân.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await aiOcrApi.extractCccd(frontFile, backFile || undefined);
      setResult(data);
      toast.success('Bóc tách thông tin CCCD thành công!');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Không thể bóc tách CCCD. Vui lòng thử lại với ảnh rõ nét hơn.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (!result) return;
    onApplyExtractedData(result);
    toast.success('Đã điền thông tin từ CCCD vào biểu mẫu!');
    handleClose(false);
  };

  return (
    <Modal
      open={open}
      onOpenChange={handleClose}
      title="Quét thông tin Căn cước công dân (AI OCR)"
      description="Tự động bóc tách thông tin từ ảnh chụp thẻ CCCD để điền nhanh hồ sơ và thông tin cá nhân."
      className="sm:max-w-2xl"
    >
      <div className="space-y-5 text-xs">
        {/* Banner lưu ý bảo mật */}
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-amber-900">
          <ShieldCheck size={20} className="shrink-0 text-amber-700 mt-0.5" weight="duotone" />
          <div className="leading-relaxed">
            <strong>Bảo vệ dữ liệu cá nhân:</strong> Ảnh CCCD chỉ được xử lý tạm thời để trích xuất văn bản và <strong>không lưu trữ vào hệ thống cơ sở dữ liệu</strong>. Vui lòng đối chiếu lại thông tin trước khi nộp hồ sơ.
          </div>
        </div>

        {error && (
          <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3 text-red-800">
            <WarningCircle size={18} className="shrink-0 mt-0.5 text-red-600" weight="fill" />
            <div className="text-xs font-medium leading-relaxed">{error}</div>
          </div>
        )}

        {!result ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Mặt trước */}
              <div className="space-y-2">
                <span className="block font-semibold text-slate-800">
                  Mặt trước thẻ CCCD <span className="text-red-600">*</span>
                </span>
                <input
                  ref={frontInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/jpg"
                  className="hidden"
                  onChange={handleFrontChange}
                />
                {frontPreview ? (
                  <div className="relative rounded-xl border border-slate-200 bg-slate-50 overflow-hidden group">
                    <img
                      src={frontPreview}
                      alt="CCCD Mặt trước"
                      className="h-40 w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setFrontFile(null);
                        setFrontPreview(null);
                      }}
                      className="absolute top-2 right-2 size-7 rounded-full bg-slate-900/70 text-white flex items-center justify-center hover:bg-slate-900"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => frontInputRef.current?.click()}
                    className="flex flex-col items-center justify-center gap-2 h-40 w-full rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-red-50/30 hover:border-red-400 transition-colors p-4 text-center cursor-pointer"
                  >
                    <div className="grid size-10 place-items-center rounded-full bg-red-100 text-red-700">
                      <UploadSimple size={20} weight="bold" />
                    </div>
                    <div>
                      <span className="font-semibold text-slate-800 block text-xs">Tải ảnh mặt trước</span>
                      <span className="text-[10px] text-slate-500">JPG, PNG tối đa 8MB</span>
                    </div>
                  </button>
                )}
              </div>

              {/* Mặt sau */}
              <div className="space-y-2">
                <span className="block font-semibold text-slate-800">
                  Mặt sau thẻ CCCD <span className="text-slate-400 font-normal">(Tùy chọn)</span>
                </span>
                <input
                  ref={backInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/jpg"
                  className="hidden"
                  onChange={handleBackChange}
                />
                {backPreview ? (
                  <div className="relative rounded-xl border border-slate-200 bg-slate-50 overflow-hidden group">
                    <img
                      src={backPreview}
                      alt="CCCD Mặt sau"
                      className="h-40 w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setBackFile(null);
                        setBackPreview(null);
                      }}
                      className="absolute top-2 right-2 size-7 rounded-full bg-slate-900/70 text-white flex items-center justify-center hover:bg-slate-900"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => backInputRef.current?.click()}
                    className="flex flex-col items-center justify-center gap-2 h-40 w-full rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-red-50/30 hover:border-red-400 transition-colors p-4 text-center cursor-pointer"
                  >
                    <div className="grid size-10 place-items-center rounded-full bg-slate-100 text-slate-600">
                      <UploadSimple size={20} weight="bold" />
                    </div>
                    <div>
                      <span className="font-semibold text-slate-800 block text-xs">Tải ảnh mặt sau</span>
                      <span className="text-[10px] text-slate-500">JPG, PNG tối đa 8MB</span>
                    </div>
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                variant="outline"
                size="small"
                onClick={() => handleClose(false)}
                disabled={loading}
              >
                Hủy bỏ
              </Button>
              <Button
                variant="primary"
                size="small"
                disabled={!frontFile}
                loading={loading}
                onClick={handleScan}
                className="gap-1.5"
              >
                <Scan size={16} weight="bold" />
                <span>Bắt đầu quét AI</span>
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-emerald-200/60 pb-2">
                <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                  <CheckCircle size={18} weight="fill" className="text-emerald-600" />
                  Kết quả nhận diện CCCD
                </span>
                {result.confidenceScore != null && (
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    Độ tin cậy: {(result.confidenceScore * 100).toFixed(0)}%
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 block text-[11px]">Số CCCD:</span>
                  <strong className="font-mono text-slate-900 text-sm">{result.citizenId || '—'}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Họ và tên:</span>
                  <strong className="text-slate-900 text-sm uppercase">{result.fullName || '—'}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Ngày sinh:</span>
                  <span className="font-medium text-slate-800">{result.dateOfBirth || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Giới tính:</span>
                  <span className="font-medium text-slate-800">{result.gender || '—'}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-500 block text-[11px]">Quê quán / Nơi sinh:</span>
                  <span className="font-medium text-slate-800">{result.placeOfOrigin || '—'}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-500 block text-[11px]">Nơi thường trú:</span>
                  <span className="font-medium text-slate-800">{result.placeOfResidence || '—'}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <Button
                variant="outline"
                size="small"
                onClick={resetState}
              >
                Quét ảnh khác
              </Button>
              <Button
                variant="primary"
                size="small"
                onClick={handleApply}
                className="gap-1.5"
              >
                <span>Sử dụng thông tin này</span>
                <ArrowRight size={16} weight="bold" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
