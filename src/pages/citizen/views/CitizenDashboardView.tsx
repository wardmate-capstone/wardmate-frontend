import { WarningCircle, ArrowRight } from '@phosphor-icons/react';
import type { CitizenDossier, CitizenSectionId } from '../types';
import { getStatusBadgeClass, QR_ELIGIBLE_STATUSES } from '../types';
import { Skeleton, ListSkeleton } from '@/components/ui';

interface CitizenDashboardViewProps {
  dossiers: CitizenDossier[];
  onSelectSection: (id: CitizenSectionId) => void;
  onOpenFeedback: (procedure: string, code?: string) => void;
  isLoading?: boolean;
}


/**
 * Đọc chuỗi giờ Việt Nam đã định dạng: "dd/MM/yyyy HH:mm" (hiện tại) hoặc "HH:mm dd/MM/yyyy" (cũ).
 * Trả về mốc thời gian (ms) hoặc NaN nếu không đọc được.
 */
function parseVnDateTime(value: string): number {
  const dateFirst = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2}))?$/);
  const timeFirst = value.match(/^(\d{1,2}):(\d{2})\s+(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  const [dd, mo, yyyy, hh, mm] = dateFirst
    ? [dateFirst[1], dateFirst[2], dateFirst[3], dateFirst[4] ?? '0', dateFirst[5] ?? '0'].map(Number)
    : timeFirst ? [timeFirst[3], timeFirst[4], timeFirst[5], timeFirst[1], timeFirst[2]].map(Number) : [];
  if (yyyy === undefined) return Number.NaN;
  // Chuỗi đã là giờ Việt Nam (UTC+07).
  return Date.UTC(yyyy, mo - 1, dd, hh - 7, mm);
}

// Trả về thời gian tương đối, nếu không đọc được thì giữ nguyên chuỗi gốc
function formatRelative(value: string): string {
  const time = parseVnDateTime(value);
  if (Number.isNaN(time)) return value;
  const diffMinutes = Math.floor((Date.now() - time) / 60000);
  if (diffMinutes < 0) return value;
  if (diffMinutes < 1) return 'Vừa xong';
  if (diffMinutes < 60) return `${diffMinutes} phút trước`;
  if (diffMinutes < 60 * 24) return `${Math.floor(diffMinutes / 60)} giờ trước`;
  const days = Math.floor(diffMinutes / (60 * 24));
  return days <= 7 ? `${days} ngày trước` : value.split(/\s+/).find(part => part.includes('/')) ?? value;
}

export function CitizenDashboardView({
  dossiers,
  onSelectSection,
  onOpenFeedback,
  isLoading = false,
}: CitizenDashboardViewProps) {
  const pendingCount = dossiers.filter((d) => d.status === 'Chờ tiền kiểm' || d.status === 'Đã gửi lại').length;
  const revisionCount = dossiers.filter((d) => d.status === 'Cần chỉnh sửa').length;
  const approvedCount = dossiers.filter((d) => d.status === 'Giấy tờ sẵn sàng').length;
  // M-17: đã tiếp nhận tại quầy là bước cuối trên WardMate nên tính vào "Đã hoàn tất".
  const completedCount = dossiers.filter((d) => d.status === 'Đã hoàn thành' || d.status === 'Đã tiếp nhận tại quầy').length;
  // L-17: "Hồ sơ gần đây" hiện giờ cập nhật thì phải xếp theo giờ cập nhật (mới nhất trước).
  const recent = [...dossiers].sort((a, b) => (parseVnDateTime(b.updatedAt) || 0) - (parseVnDateTime(a.updatedAt) || 0)).slice(0, 5);

  // Giữ nguyên cách đếm hiện có; chỉ thêm dòng giải thích dưới mỗi số.
  const stats: { label: string; value: number; hint: string; section: CitizenSectionId }[] = [
    { label: 'Hồ sơ đang xử lý', value: pendingCount + revisionCount, hint: 'Chờ kiểm tra hoặc cần sửa', section: 'dossiers_pending' },
    { label: 'Cần chỉnh sửa', value: revisionCount, hint: 'Cán bộ yêu cầu chỉnh sửa', section: 'dossiers_need_revision' },
    { label: 'Giấy tờ sẵn sàng', value: approvedCount, hint: 'Mang giấy tờ, mã QR đến phường', section: 'dossiers_approved' },
    { label: 'Đã hoàn tất', value: completedCount, hint: 'Đã tiếp nhận tại quầy', section: 'dossiers_all' },
  ];

  return (
    <div className="space-y-5">
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
      {/* Dải chỉ số giống Admin; mỗi ô bấm được để mở danh sách tương ứng (nút phủ cả ô, giữ dl/dt/dd cho trình đọc màn hình). */}
      <section className="admin-card kpi-strip" aria-label="Chỉ số hồ sơ của tôi">
        <dl>
          {stats.map(({ label, value, hint, section }) => (
            <div key={label} className="is-link">
              <dt>{label}</dt>
              <dd className="kpi-value">{isLoading ? <Skeleton className="h-7 w-12 rounded" aria-label={`Đang tải số liệu ${label}`} /> : value}</dd>
              <dd className="kpi-hint">{hint}</dd>
              <button type="button" className="kpi-cover" onClick={() => onSelectSection(section)} aria-label={isLoading ? `Xem ${label.toLowerCase()}` : `Xem ${label.toLowerCase()}: ${value}`} />
            </div>
          ))}
        </dl>
      </section>

      <section>
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
              {recent.map((dossier) => (
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
                        className="ws-row-btn is-attention"
                        onClick={() => onSelectSection('dossiers_need_revision')}
                      >
                        Bổ sung ngay
                      </button>
                    )}
                    {['Giấy tờ sẵn sàng', 'Đã tiếp nhận tại quầy'].includes(dossier.status) && (
                      <button
                        type="button"
                        className="ws-row-btn"
                        onClick={() => onOpenFeedback(dossier.procedureName, dossier.code)}
                      >
                        Đánh giá
                      </button>
                    )}
                    {QR_ELIGIBLE_STATUSES.includes(dossier.status) && (
                      <button
                        type="button"
                        className="ws-row-btn"
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
        {/* Khối "Thao tác nhanh" đã bỏ: Tờ khai và Mã QR có trên menu/dòng hồ sơ; "Nộp hồ sơ mới" là nút chính đầu trang. */}
      </section>
    </div>
  );
}
