import { useEffect, useMemo, useState } from 'react';
import { formatDate, formatDateTime } from '@/lib/dateFormat';
import { useQuery } from '@tanstack/react-query';
import {
  QrCode,
  CheckCircle,
  Copy,
  DownloadSimple,
  ArrowSquareOut,
  Folder,
  FileText,
} from '@phosphor-icons/react';
import { Button, toast, SearchInput, ErrorAlert } from '@/components/ui';
import { useAuthStore } from '@/stores/authStore';
import axios from 'axios';
import { useApplicationContents, useApprovedQr, useDocumentMutations } from '@/hooks/useDocumentForms';
import {
  documentFormApi,
  documentFormError,
  downloadBlob,
  safeDocumentLink,
} from '@/lib/api/documentForms';
import { copyToClipboard } from '@/lib/clipboard';
import type { CitizenDossier, CitizenSectionId } from '../types';

interface CitizenQrCodeViewProps {
  dossiers: CitizenDossier[];
  onOpenDossierDetail?: (dossier: CitizenDossier) => void;
  onSelectSection?: (id: CitizenSectionId) => void;
  /** Hồ sơ được chọn sẵn khi mở từ nút "Mã QR" ở danh sách */
  initialSelectedId?: string;
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
    return formatDate(d);
  } catch {
    return raw;
  }
}

export function CitizenQrCodeView({
  dossiers,
  onOpenDossierDetail,
  onSelectSection,
  initialSelectedId,
}: CitizenQrCodeViewProps) {
  const eligible = dossiers.filter((d) => d.id && d.status === 'Giấy tờ sẵn sàng');
  const [selectedId, setSelectedId] = useState(initialSelectedId ?? '');
  useEffect(() => { if (initialSelectedId) setSelectedId(initialSelectedId); }, [initialSelectedId]);
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
      <h2 className="sr-only">Mã QR đối chiếu hồ sơ</h2>


      {!eligible.length ? (
        /* Empty State */
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-xs">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-100">
            <QrCode size={32} weight="duotone" />
          </div>
          <h3 className="mt-4 text-base font-bold text-slate-800">Chưa có mã QR hồ sơ</h3>
          <p className="mx-auto mt-1.5 max-w-md text-xs text-slate-500 leading-relaxed">
            Sau khi hồ sơ chuyển sang trạng thái{' '}
            <strong className="text-slate-700">"Giấy tờ sẵn sàng"</strong>, bạn có thể mở hồ sơ và tạo PDF để nhận mã QR từ hệ thống.
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
              <SearchInput
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onClear={() => setSearchQuery('')}
                placeholder="Tìm theo mã hoặc tên thủ tục..."
              />
            )}

            {/* Danh sách thẻ hồ sơ: khung cố định khoảng 3 thẻ, phần còn lại cuộn xuống */}
            <div className="max-h-[340px] space-y-2 overflow-y-auto overscroll-contain pr-1.5 [scrollbar-color:var(--color-slate-300)_transparent] [scrollbar-width:thin]">
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

  // Tạo và thu hồi URL ảnh trong cùng một effect; nếu tạo bằng useMemo thì StrictMode thu hồi mất URL đang dùng → ảnh trắng
  const [blobUrl, setBlobUrl] = useState('');
  useEffect(() => {
    const blob = binaryQuery.data?.blob;
    if (!blob) { setBlobUrl(''); return; }
    const url = URL.createObjectURL(blob);
    setBlobUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [binaryQuery.data?.blob]);

  const lookupValue = qr.data?.qrCodeValue ? safeDocumentLink(qr.data.qrCodeValue) : null;

  const downloadFileName = `Ma-QR-${dossier.code}.png`;

  function handleDownload() {
    if (binaryQuery.data?.blob) {
      downloadBlob(binaryQuery.data.blob, downloadFileName);
      return;
    }
  }

  const generatedTime = qr.data?.generatedAt
    ? formatDateTime(qr.data.generatedAt)
    : 'Chưa có thông tin';

  if (qr.isPending || (qr.isSuccess && binaryQuery.isPending)) {
    return <div role="status" className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">Đang tải mã QR từ hệ thống...</div>;
  }

  // Backend chỉ sinh mã QR khi tạo PDF bộ giấy tờ sẵn sàng; chưa tạo PDF thì API trả 404 document.qr_not_found
  if (qr.isError && isQrNotCreated(qr.error)) {
    return <QrNotCreated applicationId={applicationId} dossier={dossier} onOpenDossierDetail={onOpenDossierDetail} />;
  }

  if (qr.isError || binaryQuery.isError || !blobUrl) {
    const error = qr.isError ? qr.error : binaryQuery.error;
    return <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
      <p role="alert" className="text-sm text-slate-700">{error ? documentFormError(error) : 'Chưa tải được ảnh mã QR từ hệ thống.'}</p>
      {/* Hiện mã lỗi backend để đối chiếu khi báo lỗi (ví dụ 404 document.application_not_found) */}
      {errorCode(error) && <p className="font-mono text-xs text-slate-500">Mã lỗi: {errorCode(error)}</p>}
      <div className="flex flex-wrap gap-3">
        <Button variant="outline" onClick={() => { if (qr.isError) void qr.refetch(); else void binaryQuery.refetch(); }}>Tải lại mã QR</Button>
        {onOpenDossierDetail && <Button onClick={() => onOpenDossierDetail(dossier)}>Xem chi tiết hồ sơ</Button>}
      </div>
      <p className="text-xs text-slate-500">Tiền kiểm không thay thế việc tiếp nhận hồ sơ chính thức tại UBND cấp xã/phường. Cán bộ sẽ đối chiếu giấy tờ khi bạn đến.</p>
    </div>;
  }

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
      {/* Header Thẻ Chi Tiết */}
      <div className="border-b border-slate-100 bg-slate-50/50 p-5 sm:p-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Mã hồ sơ
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
              src={blobUrl}
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

function isQrNotCreated(error: unknown) {
  if (!axios.isAxiosError(error) || error.response?.status !== 404) return false;
  const body = error.response.data;
  return Boolean(body && typeof body === 'object' && (body as { code?: string }).code === 'document.qr_not_found');
}

/** Hồ sơ đã sẵn sàng nhưng chưa có mã QR: cho tạo PDF (kèm mã QR) ngay tại đây */
function QrNotCreated({ applicationId, dossier, onOpenDossierDetail }: {
  applicationId: string;
  dossier: CitizenDossier;
  onOpenDossierDetail?: (dossier: CitizenDossier) => void;
}) {
  const contents = useApplicationContents(applicationId);
  const { generatePdf } = useDocumentMutations();
  const [error, setError] = useState('');
  // Tờ khai đã được cán bộ xác nhận sẵn sàng và còn tệp để kết xuất
  const ready = contents.data?.submissions.find(x => ['ReadyForDownload', 'Approved'].includes(x.status) && x.fileExists);
  async function create() {
    if (!ready || generatePdf.isPending) return;
    setError('');
    try {
      await generatePdf.mutateAsync({ applicationId, submissionId: ready.id });
      toast.success('Đã tạo PDF và mã QR cho hồ sơ.');
    } catch (err) {
      setError(documentFormError(err));
    }
  }
  return <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
    <div className="flex items-start gap-3">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-amber-100 bg-amber-50 text-amber-600"><QrCode size={22} weight="duotone" aria-hidden="true" /></span>
      <div>
        <h3 className="font-bold text-slate-900">Hồ sơ chưa có mã QR</h3>
        <p className="mt-1 text-sm leading-6 text-slate-600">Mã QR được tạo cùng bản PDF của tờ khai đã sẵn sàng. Bấm nút bên dưới để tạo PDF và mã QR cho hồ sơ <strong className="text-slate-800">{dossier.code}</strong>.</p>
      </div>
    </div>
    {contents.isPending && <p role="status" className="text-sm text-slate-500">Đang kiểm tra tờ khai…</p>}
    {contents.isError && <p role="alert" className="text-sm text-red-800">{documentFormError(contents.error)}</p>}
    {/* Backend chỉ sinh QR khi kết xuất PDF từ tờ khai DOCX đã sẵn sàng; báo rõ từng trường hợp không tạo được */}
    {contents.isSuccess && !ready && <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-sm leading-6 text-amber-900">
      {!contents.data.submissions.length
        ? 'Hồ sơ này không có tờ khai điện tử (Word) nên hệ thống chưa tạo được mã QR. Bạn vẫn mang giấy tờ đến Bộ phận Một cửa như bình thường.'
        : contents.data.submissions.some(x => x.status === 'Draft')
          ? 'Tờ khai của hồ sơ chưa được xác nhận nên chưa tạo được PDF và mã QR. Vui lòng mở chi tiết hồ sơ để kiểm tra tờ khai.'
          : !contents.data.submissions.some(x => x.fileExists)
            ? 'Không tìm thấy tệp tờ khai trong kho lưu trữ nên chưa tạo được PDF và mã QR.'
            : 'Tờ khai chưa được cán bộ xác nhận sẵn sàng nên chưa tạo được PDF và mã QR.'}
    </p>}
    {error && <ErrorAlert>{error}</ErrorAlert>}
    <div className="flex flex-wrap gap-3">
      {ready && <Button onClick={() => void create()} loading={generatePdf.isPending}>Tạo PDF và mã QR</Button>}
      {onOpenDossierDetail && <Button variant="outline" onClick={() => onOpenDossierDetail(dossier)}>Xem chi tiết hồ sơ</Button>}
    </div>
    <p className="text-xs text-slate-500">Tiền kiểm không thay thế việc tiếp nhận hồ sơ chính thức tại UBND cấp xã/phường. Cán bộ sẽ đối chiếu giấy tờ khi bạn đến.</p>
  </div>;
}

function errorCode(error: unknown) {
  if (!axios.isAxiosError(error)) return '';
  const body = error.response?.data;
  const code = body && typeof body === 'object' ? (body as { code?: string }).code : undefined;
  return [error.response?.status, code].filter(Boolean).join(' · ');
}
