import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  QrCode,
  CheckCircle,
  Copy,
  DownloadSimple,
  ArrowSquareOut,
  Folder,
  MagnifyingGlass,
  FileText,
} from '@phosphor-icons/react';
import { Button } from '@/components/ui';
import { useAuthStore } from '@/stores/authStore';
import { useApprovedQr } from '@/hooks/useDocumentForms';
import {
  documentFormApi,
  downloadBlob,
  safeDocumentLink,
} from '@/lib/api/documentForms';
import { copyToClipboard } from '@/lib/clipboard';
import type { CitizenDossier, CitizenSectionId } from '../types';

interface CitizenQrCodeViewProps {
  dossiers: CitizenDossier[];
  onOpenDossierDetail?: (dossier: CitizenDossier) => void;
  onSelectSection?: (id: CitizenSectionId) => void;
}

/**
 * Xử lý an toàn chuỗi ngày giờ từ CitizenDossier:
 * Do `updatedAt` / `createdAt` có thể đã được định dạng sẵn từ adapter (vd: "10:18 23/10/2026")
 * nên không thể parse trực tiếp bằng `new Date(string)` gây lỗi Invalid Date.
 */
function renderDossierDate(raw?: string): string {
  if (!raw || raw === '—') return '';
  if (raw.includes('/')) {
    const parts = raw.trim().split(/\s+/);
    const datePart = parts.find((p) => p.includes('/'));
    return datePart || raw;
  }
  try {
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return raw;
    return d.toLocaleDateString('vi-VN');
  } catch {
    return raw;
  }
}

export function CitizenQrCodeView({
  dossiers,
  onOpenDossierDetail,
  onSelectSection,
}: CitizenQrCodeViewProps) {
  const eligible = dossiers.filter((d) => d.id && d.status === 'Giấy tờ sẵn sàng');
  const [selectedId, setSelectedId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const selected = eligible.find((d) => d.id === selectedId) ?? eligible[0];

  // Lọc danh sách hồ sơ sẵn sàng khi người dùng tìm kiếm (khi có nhiều hồ sơ)
  const filteredEligible = useMemo(() => {
    if (!searchQuery.trim()) return eligible;
    const q = searchQuery.toLowerCase().trim();
    return eligible.filter(
      (d) =>
        d.code.toLowerCase().includes(q) ||
        d.procedureName.toLowerCase().includes(q) ||
        (d.field && d.field.toLowerCase().includes(q))
    );
  }, [eligible, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Tiêu đề ẩn hỗ trợ trợ năng */}
      <h2 className="sr-only">Mã QR đối soát hồ sơ điện tử</h2>


      {!eligible.length ? (
        /* Empty State */
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-xs">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-100">
            <QrCode size={32} weight="duotone" />
          </div>
          <h3 className="mt-4 text-base font-bold text-slate-800">Chưa có mã QR đối soát</h3>
          <p className="mx-auto mt-1.5 max-w-md text-xs text-slate-500 leading-relaxed">
            Mã QR tra cứu chỉ được tự động tạo sau khi hồ sơ của bạn được cán bộ tiền kiểm phê duyệt và chuyển sang trạng thái{' '}
            <strong className="text-slate-700">"Giấy tờ sẵn sàng"</strong>.
          </p>
          {onSelectSection && (
            <div className="mt-5">
              <Button
                variant="outline"
                size="small"
                onClick={() => onSelectSection('dossiers_all')}
                className="gap-1.5 border-slate-200 text-xs text-slate-700 hover:bg-slate-50"
              >
                <Folder size={15} />
                <span>Kiểm tra danh sách hồ sơ</span>
              </Button>
            </div>
          )}
        </div>
      ) : (
        /* Bố cục Master-Detail Chuẩn Web Desktop: Danh sách bên trái - Chi tiết mã QR bên phải */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* CỘT TRÁI (Master List - 4 cột trên Desktop): Danh mục hồ sơ sẵn sàng */}
          <div className="lg:col-span-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs space-y-3">
            {/* Header cột danh sách */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-red-700" weight="bold" />
                <span className="text-xs font-bold text-slate-900">Danh mục hồ sơ sẵn sàng</span>
              </div>
              <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-[11px] font-bold text-red-700 border border-red-200/60">
                {eligible.length} mã QR
              </span>
            </div>

            {/* Ô tìm kiếm nhanh khi có từ 3 hồ sơ trở lên */}
            {eligible.length >= 3 && (
              <div className="relative">
                <MagnifyingGlass
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm theo mã hoặc tên thủ tục..."
                  className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50/50 pl-8 pr-7 text-xs outline-none transition focus:border-red-600 focus:bg-white focus:ring-1 focus:ring-red-600"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs p-1"
                  >
                    ×
                  </button>
                )}
              </div>
            )}

            {/* Danh sách thẻ hồ sơ (Có scrollbar mượt mà khi có 5-10+ hồ sơ) */}
            <div className="space-y-2 max-h-[560px] overflow-y-auto pr-1">
              {!filteredEligible.length ? (
                <p className="py-6 text-center text-xs text-slate-500">
                  Không tìm thấy hồ sơ khớp với từ khóa.
                </p>
              ) : (
                filteredEligible.map((d) => {
                  const isSelected = d.id === selected?.id;
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => setSelectedId(d.id!)}
                      className={`group flex w-full text-left flex-col gap-1 rounded-xl p-3 text-xs transition-all border cursor-pointer ${
                        isSelected
                          ? 'border-red-600 bg-red-50/40 shadow-2xs'
                          : 'border-slate-200/70 bg-white hover:border-slate-300 hover:bg-slate-50/60'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <strong
                          className={`font-mono font-bold text-xs ${
                            isSelected ? 'text-red-800' : 'text-slate-900 group-hover:text-red-700'
                          }`}
                        >
                          {d.code}
                        </strong>
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                          <CheckCircle size={11} weight="fill" />
                          Sẵn sàng
                        </span>
                      </div>

                      <p className="font-semibold text-slate-700 line-clamp-2 mt-0.5 leading-snug">
                        {d.procedureName}
                      </p>

                      <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                        <span>{d.field || 'Hành chính công'}</span>
                        <span>{renderDossierDate(d.updatedAt || d.createdAt)}</span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* CỘT PHẢI (Detail View - 8 cột trên Desktop): Thẻ hiển thị mã QR & Chi tiết đối soát */}
          <div className="lg:col-span-8">
            {selected?.id && (
              <ApprovedQr
                key={selected.id}
                dossier={selected}
                applicationId={selected.id}
                onOpenDossierDetail={onOpenDossierDetail}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ApprovedQr({
  dossier,
  applicationId,
  onOpenDossierDetail,
}: {
  dossier: CitizenDossier;
  applicationId: string;
  onOpenDossierDetail?: (dossier: CitizenDossier) => void;
}) {
  const userId = useAuthStore((s) => s.user?.id);
  const qr = useApprovedQr(applicationId);

  const binaryQuery = useQuery({
    queryKey: ['document-binary', userId, `qr-${applicationId}`, qr.data?.id],
    queryFn: ({ signal }) => documentFormApi.downloadApprovedQr(applicationId, signal),
    enabled: Boolean(userId && qr.data?.id),
    gcTime: 0,
  });

  const blobUrl = useMemo(() => {
    if (!binaryQuery.data?.blob) return '';
    return URL.createObjectURL(binaryQuery.data.blob);
  }, [binaryQuery.data?.blob]);

  useEffect(() => {
    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [blobUrl]);

  // URL tra cứu mã QR: ưu tiên server qrCodeValue, nếu chưa có thì dùng link tra cứu chuẩn theo mã hồ sơ
  const lookupValue =
    (qr.data?.qrCodeValue ? safeDocumentLink(qr.data.qrCodeValue) : null) ||
    `${window.location.origin}/citizen?section=dossiers_all&dossierCode=${encodeURIComponent(dossier.code)}`;

  // Ảnh mã QR: ưu tiên ảnh từ backend, nếu backend chưa sinh thì sinh trực tiếp mã QR tra cứu
  const qrImageSrc =
    blobUrl ||
    `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(lookupValue)}&margin=8`;

  const downloadFileName = `Ma-QR-${dossier.code}.png`;

  async function handleDownload() {
    if (binaryQuery.data?.blob) {
      downloadBlob(binaryQuery.data.blob, downloadFileName);
      return;
    }
    try {
      const res = await fetch(qrImageSrc);
      const blob = await res.blob();
      downloadBlob(blob, downloadFileName);
    } catch {
      window.open(qrImageSrc, '_blank');
    }
  }

  const generatedTime = qr.data?.generatedAt
    ? new Date(qr.data.generatedAt).toLocaleString('vi-VN')
    : renderDossierDate(dossier.updatedAt || dossier.createdAt) || 'Hồ sơ đã sẵn sàng';

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
      {/* Header Thẻ Chi Tiết */}
      <div className="border-b border-slate-100 bg-slate-50/50 p-5 sm:p-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Mã hồ sơ đối soát
          </span>
          <div className="flex items-center gap-2 mt-0.5">
            <strong className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-mono">
              {dossier.code}
            </strong>
            <button
              type="button"
              onClick={() => void copyToClipboard(dossier.code, 'Đã sao chép mã hồ sơ.')}
              title="Sao chép mã hồ sơ"
              className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
            >
              <Copy size={15} weight="bold" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 border border-emerald-200">
            <CheckCircle size={14} weight="fill" className="text-emerald-600" />
            Giấy tờ sẵn sàng
          </span>
        </div>
      </div>

      {/* Nội dung chính: Khung QR & Thuộc tính hồ sơ */}
      <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
        {/* Khung mã QR sắc nét chuẩn desktop */}
        <div className="md:col-span-5 flex flex-col items-center">
          <div className="rounded-2xl border-2 border-slate-200/80 bg-white p-3.5 shadow-sm transition hover:shadow-md">
            <img
              src={qrImageSrc}
              alt={`ma-qr-${applicationId}.png`}
              className="size-52 sm:size-56 object-contain"
            />
          </div>

          <p className="mt-3 text-center text-xs font-medium text-slate-500">
            Quét mã tại quầy Một cửa UBND để đối chiếu hồ sơ
          </p>

          {lookupValue && (
            <a
              href={lookupValue}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 text-center text-[11px] text-red-700 hover:text-red-800 underline max-w-xs truncate"
            >
              Mở liên kết tra cứu trong mã QR
            </a>
          )}
        </div>

        {/* Thông tin đối soát chi tiết */}
        <div className="md:col-span-7 space-y-4">
          <div>
            <span className="text-xs font-semibold text-slate-400">Thủ tục hành chính</span>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-0.5 leading-snug">
              {dossier.procedureName}
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
              <span className="text-[11px] text-slate-400 font-medium">Lĩnh vực</span>
              <p className="text-xs font-bold text-slate-800 mt-0.5">
                {dossier.field || 'Hành chính công'}
              </p>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
              <span className="text-[11px] text-slate-400 font-medium">Thời gian cấp mã</span>
              <p className="text-xs font-bold text-slate-800 font-mono mt-0.5">
                {generatedTime}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Chân Thẻ: Bộ nút hành động */}
      <div className="border-t border-slate-100 bg-slate-50/80 p-4 sm:px-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="small"
            aria-label={`Tải xuống ${downloadFileName.toLowerCase()}`}
            className="gap-1.5 bg-red-700 hover:bg-red-800 text-white font-semibold text-xs shadow-2xs"
            onClick={handleDownload}
          >
            <DownloadSimple size={15} weight="bold" />
            <span>Tải xuống</span>
          </Button>
        </div>

        {onOpenDossierDetail && (
          <Button
            variant="outline"
            size="small"
            className="gap-1.5 border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 text-xs"
            onClick={() => onOpenDossierDetail(dossier)}
          >
            <ArrowSquareOut size={15} />
            <span>Xem chi tiết hồ sơ</span>
          </Button>
        )}
      </div>
    </div>
  );
}
