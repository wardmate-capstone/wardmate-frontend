import {
  Clock,
  WarningCircle,
  CheckCircle,
  SealCheck,
  CaretRight,
  FilePlus,
  FileText,
  QrCode,
  ArrowRight,
} from '@phosphor-icons/react';
import type { CitizenDossier, CitizenSectionId } from '../types';
import { getStatusBadgeClass } from '../types';
import { Skeleton, ListSkeleton } from '@/components/ui';

interface CitizenDashboardViewProps {
  dossiers: CitizenDossier[];
  onSelectSection: (id: CitizenSectionId) => void;
  onOpenFeedback: (procedure: string, code?: string) => void;
  isLoading?: boolean;
}

// Mã QR chỉ được sinh sau khi cán bộ duyệt tiền kiểm → chỉ hiện nút "Xem QR" cho các trạng thái này
const QR_ELIGIBLE_STATUSES: CitizenDossier['status'][] = ['Giấy tờ sẵn sàng', 'Đã duyệt', 'Đã tiếp nhận tại quầy', 'Đã hoàn thành'];

// updatedAt có dạng "HH:mm dd/MM/yyyy"; trả về thời gian tương đối, nếu không đọc được thì giữ nguyên chuỗi gốc
function formatRelative(value: string): string {
  const match = value.match(/^(\d{1,2}):(\d{2})\s+(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return value;
  const [, hh, mm, dd, mo, yyyy] = match.map(Number);
  const diffMinutes = Math.floor((Date.now() - new Date(yyyy, mo - 1, dd, hh, mm).getTime()) / 60000);
  if (diffMinutes < 0) return value;
  if (diffMinutes < 1) return 'Vừa xong';
  if (diffMinutes < 60) return `${diffMinutes} phút trước`;
  if (diffMinutes < 60 * 24) return `${Math.floor(diffMinutes / 60)} giờ trước`;
  const days = Math.floor(diffMinutes / (60 * 24));
  return days <= 7 ? `${days} ngày trước` : value.split(/\s+/)[1];
}

export function CitizenDashboardView({
  dossiers,
  onSelectSection,
  onOpenFeedback,
  isLoading = false,
}: CitizenDashboardViewProps) {
  const pendingCount = dossiers.filter((d) => d.status === 'Chờ tiền kiểm').length;
  const revisionCount = dossiers.filter((d) => d.status === 'Cần chỉnh sửa').length;
  const approvedCount = dossiers.filter((d) => d.status === 'Giấy tờ sẵn sàng').length;
  const completedCount = dossiers.filter((d) => d.status === 'Đã hoàn thành').length;

  const stats: { label: string; value: number; icon: typeof Clock; tone: string; section: CitizenSectionId }[] = [
    { label: 'Hồ sơ đang xử lý', value: pendingCount + revisionCount, icon: Clock, tone: 'info', section: 'dossiers_pending' },
    { label: 'Cần bổ sung gấp', value: revisionCount, icon: WarningCircle, tone: 'danger', section: 'dossiers_need_revision' },
    { label: 'Giấy tờ sẵn sàng', value: approvedCount, icon: CheckCircle, tone: 'warning', section: 'dossiers_approved' },
    { label: 'Đã hoàn tất thủ tục', value: completedCount, icon: SealCheck, tone: 'success', section: 'dossiers_all' },
  ];

  const quickActions: { label: string; hint: string; icon: typeof Clock; section: CitizenSectionId }[] = [
    { label: 'Chuẩn bị hồ sơ mới', hint: 'Chọn thủ tục cần làm', icon: FilePlus, section: 'procedures' },
    { label: 'Tờ khai của tôi', hint: 'Xem và tiếp tục điền', icon: FileText, section: 'submissions' },
    { label: 'Mã QR hồ sơ', hint: 'Hồ sơ đã được duyệt tiền kiểm', icon: QrCode, section: 'qr_code' },
  ];

  return (
    <div className="mt-5 space-y-5">
      {/* Banner nhắc việc: chỉ hiện khi có hồ sơ cán bộ yêu cầu chỉnh sửa */}
      {!isLoading && revisionCount > 0 && (
        <div role="status" className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 sm:flex-row sm:items-center">
          <WarningCircle size={22} weight="duotone" className="shrink-0 text-amber-600" aria-hidden />
          <p className="flex-1 text-sm text-amber-950">
            Bạn có <strong>{revisionCount} hồ sơ</strong> cần chỉnh sửa theo yêu cầu của cán bộ tiền kiểm.
          </p>
          <button
            type="button"
            className="inline-flex h-9 items-center gap-1.5 self-start rounded-lg bg-amber-600 px-3.5 text-sm font-bold text-white transition hover:bg-amber-700 sm:self-auto"
            onClick={() => onSelectSection('dossiers_need_revision')}
          >
            Bổ sung ngay <ArrowRight size={16} weight="bold" aria-hidden />
          </button>
        </div>
      )}

      {/* 4 Thẻ chỉ số — bấm để mở danh sách tương ứng */}
      <section className="admin-stat-grid mt-0!" aria-label="Chỉ số hồ sơ của tôi">
        {stats.map(({ label, value, icon: Icon, tone, section }) => (
          <button
            key={label}
            type="button"
            onClick={() => onSelectSection(section)}
            className={`admin-stat-card is-${tone} w-full text-left transition hover:border-red-200 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-800 focus-visible:ring-offset-2`}
          >
            <div>
              <span>
                <Icon size={24} weight="duotone" aria-hidden />
              </span>
              <small>{label}</small>
            </div>
            {isLoading ? (
              <Skeleton className="mt-4 h-9 w-16 rounded-lg" aria-label={`Đang tải số liệu ${label}`} />
            ) : (
              <strong>{value}</strong>
            )}
          </button>
        ))}
      </section>

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        {/* Hồ sơ gần đây */}
        <article className="admin-card">
          <div className="admin-card-heading">
            <div>
              <h2>Hồ sơ gần đây của bạn</h2>
            </div>
            <button type="button" onClick={() => onSelectSection('dossiers_all')}>
              Xem tất cả
            </button>
          </div>

          {isLoading ? (
            <div className="p-4">
              <ListSkeleton rows={3} />
            </div>
          ) : !dossiers.length ? (
            <div className="p-8 text-center">
              <p className="text-sm text-slate-500">Bạn chưa có hồ sơ nào.</p>
              <button
                type="button"
                className="mt-3 text-sm font-bold text-red-800 hover:underline"
                onClick={() => onSelectSection('procedures')}
              >
                Chọn thủ tục để bắt đầu chuẩn bị
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100 px-5">
              {dossiers.slice(0, 5).map((dossier) => (
                <li key={dossier.code} className="flex flex-col gap-2.5 py-3.5 sm:flex-row sm:items-center sm:gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">{dossier.procedureName}</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      <span className="font-mono">{dossier.code}</span>
                      <span className="mx-1.5 text-slate-300">·</span>
                      <span title={dossier.updatedAt}>{formatRelative(dossier.updatedAt)}</span>
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <span className={`admin-status-badge ${getStatusBadgeClass(dossier.status)}`}>
                      {dossier.status}
                    </span>
                    {dossier.status === 'Cần chỉnh sửa' && (
                      <button
                        type="button"
                        className="rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-800 hover:bg-amber-100"
                        onClick={() => onSelectSection('dossiers_need_revision')}
                      >
                        Bổ sung ngay
                      </button>
                    )}
                    {['Giấy tờ sẵn sàng', 'Đã tiếp nhận tại quầy'].includes(dossier.status) && (
                      <button
                        type="button"
                        className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-200"
                        onClick={() => onOpenFeedback(dossier.procedureName, dossier.code)}
                      >
                        Đánh giá
                      </button>
                    )}
                    {QR_ELIGIBLE_STATUSES.includes(dossier.status) && (
                      <button
                        type="button"
                        className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-bold text-slate-600 hover:bg-slate-50"
                        onClick={() => onSelectSection('qr_code')}
                      >
                        Xem QR
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </article>

        {/* Thao tác nhanh */}
        <article className="admin-card self-start">
          <div className="admin-card-heading">
            <div>
              <h2>Thao tác nhanh</h2>
            </div>
          </div>
          <div className="space-y-1 p-3">
            {quickActions.map(({ label, hint, icon: Icon, section }) => (
              <button
                key={label}
                type="button"
                onClick={() => onSelectSection(section)}
                className="group flex w-full items-center gap-3 rounded-lg p-2.5 text-left transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-800 focus-visible:ring-offset-2"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-red-50 text-red-800">
                  <Icon size={20} weight="duotone" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-slate-900">{label}</span>
                  <span className="block truncate text-xs text-slate-500">{hint}</span>
                </span>
                <CaretRight size={16} className="shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-red-700" aria-hidden />
              </button>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
