import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Scan,
  UploadSimple,
  CheckCircle,
  WarningCircle,
  ArrowRight,
  ShieldCheck,
  X,
  ArrowsOut,
  ArrowsIn,
  Eye,
  Trash,
  MagnifyingGlassPlus,
  MagnifyingGlassMinus,
  ArrowClockwise,
  Info,
  PencilSimple,
  Sparkle,
} from '@phosphor-icons/react';
import { Modal, Button } from '@/components/ui';
import { aiOcrApi, type CccdExtractionDto } from '@/lib/api/aiOcr';
import { toast } from '@/components/ui/Toast';

export interface CccdOcrScanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApplyExtractedData: (data: CccdExtractionDto) => void;
}

interface LightboxState {
  url: string;
  title: string;
  initialRotation: number;
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
  const [frontRotation, setFrontRotation] = useState<number>(0);
  const [backRotation, setBackRotation] = useState<number>(0);

  // Portal-based Lightbox state
  const [lightboxImage, setLightboxImage] = useState<LightboxState | null>(null);
  const [lightboxRotation, setLightboxRotation] = useState<number>(0);
  const [lightboxZoom, setLightboxZoom] = useState<number>(1);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CccdExtractionDto | null>(null);

  // Manual fallback entry mode if AI service is unavailable or returns 401
  const [manualMode, setManualMode] = useState(false);
  const [manualForm, setManualForm] = useState<CccdExtractionDto>({
    citizenId: '',
    fullName: '',
    dateOfBirth: '',
    gender: '',
    placeOfOrigin: '',
    placeOfResidence: '',
  });

  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);
  const scanRequest = useRef<AbortController | null>(null);

  useEffect(() => () => scanRequest.current?.abort(), []);

  useEffect(() => {
    if (!open) scanRequest.current?.abort();
  }, [open]);

  const cancelScan = () => {
    scanRequest.current?.abort();
    scanRequest.current = null;
    setLoading(false);
  };

  const resetState = () => {
    cancelScan();
    setFrontFile(null);
    setBackFile(null);
    if (frontPreview) URL.revokeObjectURL(frontPreview);
    if (backPreview) URL.revokeObjectURL(backPreview);
    setFrontPreview(null);
    setBackPreview(null);
    setFrontRotation(0);
    setBackRotation(0);
    setLightboxImage(null);
    setLightboxRotation(0);
    setLightboxZoom(1);
    setResult(null);
    setError(null);
    setLoading(false);
    setManualMode(false);
    setManualForm({
      citizenId: '',
      fullName: '',
      dateOfBirth: '',
      gender: '',
      placeOfOrigin: '',
      placeOfResidence: '',
    });
  };

  const handleClose = (newOpen: boolean) => {
    if (!newOpen) {
      resetState();
    }
    onOpenChange(newOpen);
  };

  // Close lightbox on Escape key
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && lightboxImage) {
        setLightboxImage(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [lightboxImage]);

  const handleFrontChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    cancelScan();
    setFrontFile(null);
    setResult(null);
    if (frontPreview) URL.revokeObjectURL(frontPreview);
    setFrontPreview(null);

    if (!file.size) {
      setError('Ảnh mặt trước không có nội dung. Vui lòng chọn ảnh khác.');
      return;
    }

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
    setFrontRotation(0);
    setFrontPreview(URL.createObjectURL(file));
  };

  const handleBackChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    cancelScan();
    setBackFile(null);
    setResult(null);
    if (backPreview) URL.revokeObjectURL(backPreview);
    setBackPreview(null);

    if (!file.size) {
      setError('Ảnh mặt sau không có nội dung. Vui lòng chọn ảnh khác.');
      return;
    }

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
    setBackRotation(0);
    setBackPreview(URL.createObjectURL(file));
  };

  const openLightbox = (url: string, title: string, currentRotation: number) => {
    setLightboxRotation(currentRotation);
    setLightboxZoom(1);
    setLightboxImage({
      url,
      title,
      initialRotation: currentRotation,
    });
  };

  const handleScan = async () => {
    if (scanRequest.current) return;
    if (!frontFile) {
      setError('Vui lòng chọn ảnh mặt trước của Căn cước công dân.');
      return;
    }

    setLoading(true);
    setError(null);
    const controller = new AbortController();
    scanRequest.current = controller;

    try {
      const data = await aiOcrApi.extractCccd(frontFile, backFile || undefined, controller.signal);
      if (controller.signal.aborted) return;
      setResult(data);
      toast.success('Bóc tách thông tin CCCD thành công!');
    } catch (err: unknown) {
      if (controller.signal.aborted) return;
      const message = err instanceof Error ? err.message : 'Không thể bóc tách CCCD. Vui lòng thử lại với ảnh rõ nét hơn.';
      setError(message);
    } finally {
      if (scanRequest.current === controller) {
        scanRequest.current = null;
        setLoading(false);
      }
    }
  };

  const handleApply = (dataToApply?: CccdExtractionDto) => {
    const finalData = dataToApply || result;
    if (!finalData) return;
    onApplyExtractedData(finalData);
    toast.success('Đã điền thông tin từ CCCD vào biểu mẫu!');
    handleClose(false);
  };

  const handleApplyManual = () => {
    if (!manualForm.citizenId?.trim() && !manualForm.fullName?.trim()) {
      setError('Vui lòng nhập ít nhất Số CCCD hoặc Họ và tên để áp dụng.');
      return;
    }
    handleApply(manualForm);
  };

  return (
    <>
      <Modal
        open={open}
        onOpenChange={handleClose}
        title="Quét thông tin Căn cước công dân (AI OCR)"
        description="Tự động bóc tách thông tin từ ảnh chụp thẻ CCCD để điền nhanh hồ sơ và thông tin cá nhân."
        className="sm:max-w-2xl"
      >
        <div className="space-y-4 text-xs">
          {/* Banner lưu ý bảo mật */}
          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-amber-900">
            <ShieldCheck size={20} className="shrink-0 text-amber-700 mt-0.5" weight="duotone" />
            <div className="leading-relaxed">
              <strong>Bảo vệ dữ liệu cá nhân:</strong> Ảnh CCCD chỉ được xử lý tạm thời để trích xuất văn bản và <strong>không lưu trữ vào hệ thống cơ sở dữ liệu</strong>. Vui lòng đối chiếu lại thông tin trước khi nộp hồ sơ.
            </div>
          </div>

          {/* Banner thông báo lỗi nếu có */}
          {error && (
            <div role="alert" className="space-y-2.5 rounded-xl border border-amber-300 bg-amber-50/90 p-3.5 text-amber-950 shadow-2xs">
              <div className="flex items-start gap-2.5">
                <WarningCircle size={18} className="shrink-0 mt-0.5 text-amber-600" weight="fill" />
                <div className="space-y-1">
                  <div className="text-xs font-semibold leading-relaxed">{error}</div>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-amber-200/80 text-[11px]">
                <span className="text-slate-600 flex items-center gap-1">
                  <Info size={14} className="text-slate-500 shrink-0" />
                  Phiên đăng nhập của bạn vẫn an toàn, không bị ảnh hưởng.
                </span>
                <div className="flex items-center gap-2">
                  {!manualMode && (
                    <button
                      type="button"
                      onClick={() => {
                        setManualMode(true);
                        setError(null);
                      }}
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-600 hover:bg-amber-700 text-white transition-colors shadow-2xs flex items-center gap-1 cursor-pointer"
                    >
                      <PencilSimple size={13} weight="bold" />
                      <span>Nhập thông tin nhanh từ ảnh</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleClose(false)}
                    className="font-medium text-slate-700 hover:text-slate-950 underline underline-offset-2 transition-colors cursor-pointer"
                  >
                    Đóng và điền thủ công
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* CHẾ ĐỘ 1: TẢI ẢNH VÀ QUÉT (KHI CHƯA CÓ KẾT QUẢ VÀ CHƯA BẬT MANUAL) */}
          {!result && !manualMode && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Card Mặt trước */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800">
                      Mặt trước thẻ CCCD <span className="text-red-600">*</span>
                    </span>
                    {frontFile && (
                      <span className="text-[10px] text-slate-500 font-mono">
                        {(frontFile.size / (1024 * 1024)).toFixed(1)}MB
                      </span>
                    )}
                  </div>
                  <input
                    ref={frontInputRef}
                    type="file"
                    aria-label="Ảnh CCCD mặt trước"
                    accept="image/jpeg,image/png,image/jpg"
                    className="hidden"
                    onChange={handleFrontChange}
                  />
                  {frontPreview ? (
                    <div className="relative rounded-2xl border border-slate-700/20 bg-slate-950 overflow-hidden flex items-center justify-center p-2.5 h-60 w-full shadow-inner group">
                      {/* Image container with rotation */}
                      <div
                        className="relative flex items-center justify-center transition-transform duration-200 h-full w-full"
                        style={{
                          transform: `rotate(${frontRotation}deg)`,
                          transformOrigin: 'center center',
                        }}
                      >
                        <img
                          src={frontPreview}
                          alt="CCCD Mặt trước"
                          className="max-h-[190px] max-w-[95%] w-auto object-contain rounded-lg shadow-md transition-transform duration-200 group-hover:scale-[1.02] cursor-pointer"
                          onClick={() => openLightbox(frontPreview, 'Ảnh mặt trước Căn cước công dân', frontRotation)}
                        />
                      </div>

                      {/* Top badges & controls */}
                      <div className="absolute top-2 left-2 flex items-center gap-1.5 z-10">
                        <span className="rounded-md bg-slate-900/85 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-xs border border-white/10">
                          Mặt trước
                        </span>
                      </div>

                      <div className="absolute top-2 right-2 flex items-center gap-1 z-10">
                        <button
                          type="button"
                          onClick={() => setFrontRotation((r) => (r + 90) % 360)}
                          className="size-7 rounded-lg bg-slate-900/85 text-white hover:text-amber-300 flex items-center justify-center hover:bg-slate-800 transition-colors shadow-sm border border-white/10 cursor-pointer"
                          title="Xoay 90 độ"
                        >
                          <ArrowClockwise size={13} weight="bold" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openLightbox(frontPreview, 'Ảnh mặt trước Căn cước công dân', frontRotation)}
                          className="size-7 rounded-lg bg-slate-900/85 text-white flex items-center justify-center hover:bg-slate-800 transition-colors shadow-sm border border-white/10 cursor-pointer"
                          title="Xem ảnh kích thước đầy đủ (100%)"
                        >
                          <ArrowsOut size={13} weight="bold" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            cancelScan();
                            setFrontFile(null);
                            setFrontPreview(null);
                            setFrontRotation(0);
                          }}
                          className="size-7 rounded-lg bg-slate-900/85 text-white hover:text-red-400 flex items-center justify-center hover:bg-slate-800 transition-colors shadow-sm border border-white/10 cursor-pointer"
                          title="Xóa và chọn lại ảnh khác"
                        >
                          <Trash size={13} weight="bold" />
                        </button>
                      </div>

                      {/* Bottom hint button */}
                      <button
                        type="button"
                        onClick={() => openLightbox(frontPreview, 'Ảnh mặt trước Căn cước công dân', frontRotation)}
                        className="absolute bottom-2 inset-x-2 rounded-lg bg-slate-900/80 py-1 px-2 text-[10px] text-white/90 font-medium text-center backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 cursor-pointer z-10"
                      >
                        <MagnifyingGlassPlus size={12} weight="bold" />
                        <span>Nhấp để phóng to toàn màn hình</span>
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => frontInputRef.current?.click()}
                      className="flex flex-col items-center justify-center gap-2.5 h-60 w-full rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-red-50/40 hover:border-red-400 transition-all p-4 text-center cursor-pointer group"
                    >
                      <div className="grid size-12 place-items-center rounded-2xl bg-red-100 text-red-700 group-hover:scale-110 transition-transform">
                        <UploadSimple size={24} weight="bold" />
                      </div>
                      <div>
                        <span className="font-semibold text-slate-800 block text-xs group-hover:text-red-800 transition-colors">Tải ảnh mặt trước</span>
                        <span className="text-[10px] text-slate-500 block mt-0.5">Hỗ trợ JPG, PNG (tối đa 8MB)</span>
                        <span className="text-[10px] text-slate-400 block mt-1">Chụp đủ 4 góc, rõ nét chữ và số</span>
                      </div>
                    </button>
                  )}
                </div>

                {/* Card Mặt sau */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800">
                      Mặt sau thẻ CCCD <span className="text-slate-400 font-normal">(Tùy chọn)</span>
                    </span>
                    {backFile && (
                      <span className="text-[10px] text-slate-500 font-mono">
                        {(backFile.size / (1024 * 1024)).toFixed(1)}MB
                      </span>
                    )}
                  </div>
                  <input
                    ref={backInputRef}
                    type="file"
                    aria-label="Ảnh CCCD mặt sau"
                    accept="image/jpeg,image/png,image/jpg"
                    className="hidden"
                    onChange={handleBackChange}
                  />
                  {backPreview ? (
                    <div className="relative rounded-2xl border border-slate-700/20 bg-slate-950 overflow-hidden flex items-center justify-center p-2.5 h-60 w-full shadow-inner group">
                      <div
                        className="relative flex items-center justify-center transition-transform duration-200 h-full w-full"
                        style={{
                          transform: `rotate(${backRotation}deg)`,
                          transformOrigin: 'center center',
                        }}
                      >
                        <img
                          src={backPreview}
                          alt="CCCD Mặt sau"
                          className="max-h-[190px] max-w-[95%] w-auto object-contain rounded-lg shadow-md transition-transform duration-200 group-hover:scale-[1.02] cursor-pointer"
                          onClick={() => openLightbox(backPreview, 'Ảnh mặt sau Căn cước công dân', backRotation)}
                        />
                      </div>

                      <div className="absolute top-2 left-2 flex items-center gap-1.5 z-10">
                        <span className="rounded-md bg-slate-900/85 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-xs border border-white/10">
                          Mặt sau
                        </span>
                      </div>

                      <div className="absolute top-2 right-2 flex items-center gap-1 z-10">
                        <button
                          type="button"
                          onClick={() => setBackRotation((r) => (r + 90) % 360)}
                          className="size-7 rounded-lg bg-slate-900/85 text-white hover:text-amber-300 flex items-center justify-center hover:bg-slate-800 transition-colors shadow-sm border border-white/10 cursor-pointer"
                          title="Xoay 90 độ"
                        >
                          <ArrowClockwise size={13} weight="bold" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openLightbox(backPreview, 'Ảnh mặt sau Căn cước công dân', backRotation)}
                          className="size-7 rounded-lg bg-slate-900/85 text-white flex items-center justify-center hover:bg-slate-800 transition-colors shadow-sm border border-white/10 cursor-pointer"
                          title="Xem ảnh kích thước đầy đủ (100%)"
                        >
                          <ArrowsOut size={13} weight="bold" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            cancelScan();
                            setBackFile(null);
                            setBackPreview(null);
                            setBackRotation(0);
                          }}
                          className="size-7 rounded-lg bg-slate-900/85 text-white hover:text-red-400 flex items-center justify-center hover:bg-slate-800 transition-colors shadow-sm border border-white/10 cursor-pointer"
                          title="Xóa và chọn lại ảnh khác"
                        >
                          <Trash size={13} weight="bold" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => openLightbox(backPreview, 'Ảnh mặt sau Căn cước công dân', backRotation)}
                        className="absolute bottom-2 inset-x-2 rounded-lg bg-slate-900/80 py-1 px-2 text-[10px] text-white/90 font-medium text-center backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 cursor-pointer z-10"
                      >
                        <MagnifyingGlassPlus size={12} weight="bold" />
                        <span>Nhấp để phóng to toàn màn hình</span>
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => backInputRef.current?.click()}
                      className="flex flex-col items-center justify-center gap-2.5 h-60 w-full rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-red-50/40 hover:border-red-400 transition-all p-4 text-center cursor-pointer group"
                    >
                      <div className="grid size-12 place-items-center rounded-2xl bg-slate-100 text-slate-600 group-hover:scale-110 group-hover:bg-red-100 group-hover:text-red-700 transition-all">
                        <UploadSimple size={24} weight="bold" />
                      </div>
                      <div>
                        <span className="font-semibold text-slate-800 block text-xs group-hover:text-red-800 transition-colors">Tải ảnh mặt sau</span>
                        <span className="text-[10px] text-slate-500 block mt-0.5">Không bắt buộc • Tối đa 8MB</span>
                        <span className="text-[10px] text-slate-400 block mt-1">Hỗ trợ nhận diện nơi thường trú/ngày cấp</span>
                      </div>
                    </button>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setManualMode(true)}
                  className="text-xs font-semibold text-slate-600 hover:text-red-800 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <PencilSimple size={15} />
                  <span>Điền thông tin thủ công</span>
                </button>

                <div className="flex items-center gap-2">
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
            </div>
          )}

          {/* CHẾ ĐỘ 2: NHẬP NHANH THỦ CÔNG KÈM ẢNH ĐỐI CHIẾU */}
          {!result && manualMode && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Thanh ảnh thu nhỏ để đối chiếu khi gõ */}
              {(frontPreview || backPreview) && (
                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-900/5 border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-700 shrink-0">Ảnh đối chiếu:</span>
                  <div className="flex items-center gap-2">
                    {frontPreview && (
                      <button
                        type="button"
                        onClick={() => openLightbox(frontPreview, 'Ảnh mặt trước Căn cước công dân', frontRotation)}
                        className="relative group rounded-lg overflow-hidden border border-slate-300 hover:border-red-500 transition-colors shrink-0 cursor-pointer"
                        title="Xem ảnh mặt trước to"
                      >
                        <img src={frontPreview} alt="Mặt trước" className="h-10 w-16 object-cover" />
                        <span className="absolute inset-0 bg-black/40 text-white text-[8px] font-semibold flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          Xem to
                        </span>
                      </button>
                    )}
                    {backPreview && (
                      <button
                        type="button"
                        onClick={() => openLightbox(backPreview, 'Ảnh mặt sau Căn cước công dân', backRotation)}
                        className="relative group rounded-lg overflow-hidden border border-slate-300 hover:border-red-500 transition-colors shrink-0 cursor-pointer"
                        title="Xem ảnh mặt sau to"
                      >
                        <img src={backPreview} alt="Mặt sau" className="h-10 w-16 object-cover" />
                        <span className="absolute inset-0 bg-black/40 text-white text-[8px] font-semibold flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          Xem to
                        </span>
                      </button>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500 ml-auto italic">
                    Nhấp vào ảnh để phóng to đối chiếu
                  </span>
                </div>
              )}

              <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                    <PencilSimple size={16} className="text-red-700" weight="bold" />
                    Điền nhanh thông tin CCCD
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Đối chiếu trực tiếp từ ảnh chụp
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                      Số Căn cước công dân (12 số) <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      maxLength={12}
                      value={manualForm.citizenId || ''}
                      onChange={(e) => setManualForm({ ...manualForm, citizenId: e.target.value.replace(/\D/g, '') })}
                      placeholder="Ví dụ: 080204013474"
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                      Họ và tên <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      value={manualForm.fullName || ''}
                      onChange={(e) => setManualForm({ ...manualForm, fullName: e.target.value.toUpperCase() })}
                      placeholder="Ví dụ: NGUYỄN TRUNG NGHĨA"
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 uppercase"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                      Ngày sinh (YYYY-MM-DD hoặc DD/MM/YYYY)
                    </label>
                    <input
                      type="text"
                      value={manualForm.dateOfBirth || ''}
                      onChange={(e) => setManualForm({ ...manualForm, dateOfBirth: e.target.value })}
                      placeholder="Ví dụ: 2004-08-10 hoặc 10/08/2004"
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                      Giới tính
                    </label>
                    <select
                      value={manualForm.gender || ''}
                      onChange={(e) => setManualForm({ ...manualForm, gender: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 bg-white"
                    >
                      <option value="">Chưa cập nhật</option>
                      <option value="Nam">Nam</option>
                      <option value="Nữ">Nữ</option>
                      <option value="Khác">Khác</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                      Quê quán / Nơi sinh
                    </label>
                    <input
                      type="text"
                      value={manualForm.placeOfOrigin || ''}
                      onChange={(e) => setManualForm({ ...manualForm, placeOfOrigin: e.target.value })}
                      placeholder="Ví dụ: Thạnh Lợi, Bến Lức, Long An"
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                      Nơi thường trú
                    </label>
                    <input
                      type="text"
                      value={manualForm.placeOfResidence || ''}
                      onChange={(e) => setManualForm({ ...manualForm, placeOfResidence: e.target.value })}
                      placeholder="Ví dụ: Ấp 6, Thạnh Lợi, Bến Lức, Long An"
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <Button
                  variant="outline"
                  size="small"
                  onClick={() => setManualMode(false)}
                >
                  Quay lại quét AI
                </Button>
                <Button
                  variant="primary"
                  size="small"
                  onClick={handleApplyManual}
                  className="gap-1.5"
                >
                  <span>Áp dụng vào biểu mẫu</span>
                  <ArrowRight size={16} weight="bold" />
                </Button>
              </div>
            </div>
          )}

          {/* CHẾ ĐỘ 3: HIỂN THỊ KẾT QUẢ AI ĐÃ NHẬN DIỆN THÀNH CÔNG */}
          {result && (
            <div className="space-y-4">
              {/* Ảnh đã tải để đối chiếu trực quan */}
              {frontPreview && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/5 border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-700 shrink-0">Ảnh đã quét:</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openLightbox(frontPreview, 'Ảnh mặt trước Căn cước công dân', frontRotation)}
                      className="relative group rounded-lg overflow-hidden border border-slate-300 hover:border-red-500 transition-colors shrink-0 cursor-pointer"
                      title="Nhấp để xem ảnh mặt trước đầy đủ"
                    >
                      <img src={frontPreview} alt="Mặt trước" className="h-12 w-20 object-cover" />
                      <span className="absolute inset-0 bg-black/40 text-white text-[9px] font-semibold flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        Xem lớn
                      </span>
                      <span className="absolute bottom-0 left-0 right-0 bg-slate-900/70 text-white text-[8px] text-center py-0.5">
                        Mặt trước
                      </span>
                    </button>

                    {backPreview && (
                      <button
                        type="button"
                        onClick={() => openLightbox(backPreview, 'Ảnh mặt sau Căn cước công dân', backRotation)}
                        className="relative group rounded-lg overflow-hidden border border-slate-300 hover:border-red-500 transition-colors shrink-0 cursor-pointer"
                        title="Nhấp để xem ảnh mặt sau đầy đủ"
                      >
                        <img src={backPreview} alt="Mặt sau" className="h-12 w-20 object-cover" />
                        <span className="absolute inset-0 bg-black/40 text-white text-[9px] font-semibold flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          Xem lớn
                        </span>
                        <span className="absolute bottom-0 left-0 right-0 bg-slate-900/70 text-white text-[8px] text-center py-0.5">
                          Mặt sau
                        </span>
                      </button>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500 ml-auto italic hidden sm:inline">
                    Nhấp vào ảnh để mở to đối chiếu với thông tin
                  </span>
                </div>
              )}

              <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-emerald-200/60 pb-2">
                  <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                    <CheckCircle size={18} weight="fill" className="text-emerald-600" />
                    Kết quả nhận diện CCCD (AI OCR)
                  </span>
                  {result.confidenceScore != null && (
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                      <Sparkle size={12} weight="fill" className="text-amber-600" />
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
                  onClick={() => handleApply()}
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

      {/* LIGHTBOX HOÀN CHỈNH RENDER QUA REACT PORTAL TRỰC TIẾP LÊN DOCUMENT.BODY (Z-[9999]) */}
      {typeof document !== 'undefined' && lightboxImage && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[9999] flex flex-col bg-slate-950/95 backdrop-blur-md p-4 animate-in fade-in duration-150 select-none"
          onClick={() => setLightboxImage(null)}
        >
          {/* Top Bar / Header */}
          <div
            className="flex items-center justify-between w-full max-w-5xl mx-auto pb-3 text-white border-b border-white/10 shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2">
              <Eye size={18} weight="bold" className="text-red-400" />
              <span className="text-sm font-semibold text-white/95">{lightboxImage.title}</span>
            </div>

            {/* Toolbar: Xoay, Zoom, Đặt lại, Đóng */}
            <div className="flex items-center gap-1.5 bg-slate-900/90 px-2 py-1 rounded-xl border border-white/10">
              <button
                type="button"
                onClick={() => setLightboxRotation((prev) => (prev + 90) % 360)}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                title="Xoay 90 độ theo chiều kim đồng hồ"
              >
                <ArrowClockwise size={15} weight="bold" />
                <span className="hidden sm:inline">Xoay 90°</span>
              </button>

              <div className="h-4 w-px bg-white/20 mx-0.5" />

              <button
                type="button"
                onClick={() => setLightboxZoom((z) => Math.max(0.5, Math.round((z - 0.25) * 100) / 100))}
                className="p-1.5 text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer disabled:opacity-40"
                title="Thu nhỏ (-)"
                disabled={lightboxZoom <= 0.5}
              >
                <MagnifyingGlassMinus size={16} weight="bold" />
              </button>

              <span className="text-xs font-mono font-medium text-white/80 min-w-[40px] text-center">
                {Math.round(lightboxZoom * 100)}%
              </span>

              <button
                type="button"
                onClick={() => setLightboxZoom((z) => Math.min(3, Math.round((z + 0.25) * 100) / 100))}
                className="p-1.5 text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer disabled:opacity-40"
                title="Phóng to (+)"
                disabled={lightboxZoom >= 3}
              >
                <MagnifyingGlassPlus size={16} weight="bold" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setLightboxZoom(1);
                  setLightboxRotation(lightboxImage.initialRotation || 0);
                }}
                className="p-1.5 text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                title="Đặt lại kích thước gốc"
              >
                <ArrowsIn size={16} weight="bold" />
              </button>

              <div className="h-4 w-px bg-white/20 mx-0.5" />

              <button
                type="button"
                onClick={() => setLightboxImage(null)}
                className="p-1.5 text-white hover:bg-red-600 rounded-lg transition-colors cursor-pointer"
                title="Đóng (Esc)"
              >
                <X size={18} weight="bold" />
              </button>
            </div>
          </div>

          {/* Main Image Viewport */}
          <div
            className="flex-1 w-full max-w-5xl mx-auto flex items-center justify-center overflow-auto p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) setLightboxImage(null);
            }}
          >
            <div
              className="relative transition-transform duration-200 ease-out flex items-center justify-center"
              style={{
                transform: `scale(${lightboxZoom}) rotate(${lightboxRotation}deg)`,
                transformOrigin: 'center center',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={lightboxImage.url}
                alt={lightboxImage.title}
                className="max-h-[75vh] w-auto max-w-[85vw] object-contain rounded-xl shadow-2xl ring-1 ring-white/15"
              />
            </div>
          </div>

          {/* Footer hint */}
          <div
            className="text-center text-[11px] text-white/60 py-2 border-t border-white/10 shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <span>
              Ảnh hiển thị 100% kích thước gốc không bị cắt góc. Nhấn <kbd className="px-1.5 py-0.5 bg-white/10 rounded font-mono text-[10px] text-white">Esc</kbd> hoặc nhấp vùng tối để quay lại.
            </span>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};
