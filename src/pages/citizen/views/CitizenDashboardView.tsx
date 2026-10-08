import {
  Clock,
  WarningCircle,
  CheckCircle,
  SealCheck,
  MagnifyingGlass,
  NotePencil,
  Folder,
  QrCode,
  CaretDown,
  ShieldCheck,
} from '@phosphor-icons/react';
import type { CitizenDossier, CitizenSectionId } from '../types';
import { getStatusBadgeClass } from '../types';

interface CitizenDashboardViewProps {
  dossiers: CitizenDossier[];
  onSelectSection: (id: CitizenSectionId) => void;
  onOpenFeedback: (procedure: string, code?: string) => void;
}

export function CitizenDashboardView({
  dossiers,
  onSelectSection,
  onOpenFeedback,
}: CitizenDashboardViewProps) {
  const pendingCount = dossiers.filter((d) => d.status === 'Chờ tiền kiểm').length;
  const revisionCount = dossiers.filter((d) => d.status === 'Cần chỉnh sửa').length;
  const approvedCount = dossiers.filter((d) => d.status === 'Đã duyệt').length;
  const completedCount = dossiers.filter((d) => d.status === 'Đã hoàn thành').length;

  const stats = [
    { label: 'Hồ sơ đang xử lý', value: `${pendingCount + revisionCount}`, icon: Clock, tone: 'info' },
    { label: 'Cần bổ sung gấp', value: `${revisionCount}`, icon: WarningCircle, tone: 'danger' },
    { label: 'Đã duyệt tiền kiểm', value: `${approvedCount}`, icon: CheckCircle, tone: 'warning' },
    { label: 'Đã hoàn tất thủ tục', value: `${completedCount}`, icon: SealCheck, tone: 'success' },
  ];

  const quickShortcuts = [
    { id: 'procedures' as CitizenSectionId, title: 'Tra cứu thủ tục', icon: MagnifyingGlass },
    { id: 'dossiers_draft' as CitizenSectionId, title: 'Hồ sơ bản nháp', icon: NotePencil },
    { id: 'dossiers_all' as CitizenSectionId, title: 'Hồ sơ của tôi', icon: Folder },
    { id: 'qr_code' as CitizenSectionId, title: 'Mã QR nộp hồ sơ', icon: QrCode },
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
            <strong>{value}</strong>
          </article>
        ))}
      </section>

      {/* Biểu đồ xu hướng */}
      <CitizenUsageChart />

      {/* Phím tắt thao tác nhanh */}
      <section className="admin-card admin-module-card">
        <div className="admin-card-heading">
          <div>
            <h2>Tiện ích nộp & Chuẩn bị hồ sơ</h2>
          </div>
        </div>
        <div className="admin-module-grid">
          {quickShortcuts.map(({ id, title, icon: Icon }) => (
            <button key={id} type="button" onClick={() => onSelectSection(id)}>
              <span>
                <Icon size={22} weight="duotone" />
              </span>
              <div>
                <strong>{title}</strong>
              </div>
              <CaretDown size={16} />
            </button>
          ))}
        </div>
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
                  {dossier.status === 'Đã hoàn thành' && (
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
                <span>Tiền kiểm trực tuyến giúp bạn chuẩn bị đủ 100% giấy tờ trước khi mang bản gốc đến đối chiếu tại Một cửa.</span>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg border border-slate-100 bg-slate-50 p-3">
              <QrCode size={20} className="shrink-0 text-red-700 mt-0.5" />
              <div>
                <strong className="block text-slate-900 font-bold">Quét mã QR tại Ki-ốt</strong>
                <span>Xuất trình mã QR hồ sơ đã duyệt để lấy số thứ tự ưu tiên tại UBND phường.</span>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg border border-slate-100 bg-slate-50 p-3">
              <Clock size={20} className="shrink-0 text-sky-600 mt-0.5" />
              <div>
                <strong className="block text-slate-900 font-bold">Giờ làm việc tiếp nhận</strong>
                <span>Sáng: 07:30 – 11:30 | Chiều: 13:30 – 17:00 (Từ Thứ Hai đến Thứ Sáu, Thứ Bảy làm việc buổi sáng).</span>
              </div>
            </div>
          </div>
        </article>
      </section>
    </>
  );
}

function CitizenUsageChart() {
  return (
    <section className="admin-card admin-chart-card" aria-labelledby="citizen-chart-title">
      <div className="admin-chart-heading">
        <div>
          <h2 id="citizen-chart-title">Nhật ký tra cứu &amp; Tiến độ chuẩn bị hồ sơ</h2>
        </div>
      </div>
      <div className="flex items-center justify-center py-12 text-sm text-slate-400 italic">
        ⚠️ API thống kê hoạt động công dân sẽ được tích hợp sau.
      </div>
    </section>
  );
}
