import {
  Clock,
  WarningCircle,
  CheckCircle,
  SealCheck,
  QrCode,
  ShieldCheck,
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

  const stats = [
    { label: 'Hồ sơ đang xử lý', value: `${pendingCount + revisionCount}`, icon: Clock, tone: 'info' },
    { label: 'Cần bổ sung gấp', value: `${revisionCount}`, icon: WarningCircle, tone: 'danger' },
    { label: 'Giấy tờ sẵn sàng', value: `${approvedCount}`, icon: CheckCircle, tone: 'warning' },
    { label: 'Đã hoàn tất thủ tục', value: `${completedCount}`, icon: SealCheck, tone: 'success' },
  ];

  return (
    <>
      {/* 4 Thẻ chỉ số */}
      <section className="admin-stat-grid" aria-label="Chỉ số hồ sơ của tôi">
        {stats.map(({ label, value, icon: Icon, tone }) => (
          <article key={label} className={`admin-stat-card is-${tone}`}>
            <div>
              <span>
                <Icon size={24} weight="duotone" />
              </span>
              <small>{label}</small>
            </div>
            {isLoading ? (
              <Skeleton
                className="mt-4 h-9 w-16 rounded-lg"
                aria-label={`Đang tải số liệu ${label}`}
              />
            ) : (
              <strong>{value}</strong>
            )}
          </article>
        ))}
      </section>

      {/* 2 Khối thông tin: Hồ sơ gần đây & Lưu ý hướng dẫn */}
      <section className="admin-insight-grid">
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
            <p className="p-5 text-xs text-slate-500">Chưa có hồ sơ gần đây.</p>
          ) : (
            <div className="divide-y divide-slate-100 px-5">
              {dossiers.slice(0, 4).map((dossier) => (
                <div key={dossier.code} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3.5">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <strong className="text-xs text-slate-900">{dossier.code}</strong>
                      <span className={`admin-status-badge ${getStatusBadgeClass(dossier.status)}`}>
                        {dossier.status}
                      </span>
                    </div>
                    <p className="mt-1 text-sm font-semibold text-slate-800 truncate">{dossier.procedureName}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Cập nhật: {dossier.updatedAt}</p>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
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
                    <button
                      type="button"
                      className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-bold text-slate-600 hover:bg-slate-50"
                      onClick={() => onSelectSection('qr_code')}
                    >
                      Xem QR
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </article>

        {/* Khối Hướng dẫn Một cửa */}
        <article className="admin-card">
          <div className="admin-card-heading">
            <div>
              <h2>Lưu ý khi đến UBND Phường</h2>
            </div>
          </div>
          <div className="p-5 space-y-3.5 text-xs text-slate-600 leading-relaxed">
            <div className="flex items-start gap-3 rounded-lg border border-slate-100 bg-slate-50 p-3">
              <ShieldCheck size={20} className="shrink-0 text-emerald-600 mt-0.5" />
              <div>
                <strong className="block text-slate-900 font-bold">Đối chiếu giấy tờ gốc</strong>
                <span>Kiểm tra danh mục giấy tờ và mang bản gốc theo yêu cầu để cơ quan có thẩm quyền đối chiếu.</span>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg border border-slate-100 bg-slate-50 p-3">
              <QrCode size={20} className="shrink-0 text-red-700 mt-0.5" />
              <div>
                <strong className="block text-slate-900 font-bold">Mã QR hồ sơ tiền kiểm</strong>
                <span>Mở mục Mã QR hồ sơ để kiểm tra mã đã được cấp. Thực hiện tiếp nhận theo hướng dẫn của cơ quan có thẩm quyền.</span>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg border border-slate-100 bg-slate-50 p-3">
              <Clock size={20} className="shrink-0 text-sky-600 mt-0.5" />
              <div>
                <strong className="block text-slate-900 font-bold">Giờ làm việc tiếp nhận</strong>
                <span>Kiểm tra lịch làm việc được công bố của phường/xã tiếp nhận trước khi đến.</span>
              </div>
            </div>
          </div>
        </article>
      </section>
    </>
  );
}
