import React from 'react';
import { useAuthStore } from '@/stores/authStore';
import { ListSkeleton, Skeleton, EmptyState } from '@/components/ui';
import {
  ArrowsClockwise,
  CalendarBlank,
  CaretRight,
  ChatsCircle,
  CheckCircle,
  Clock,
  WarningCircle,
} from '@phosphor-icons/react';
import type { OfficerApplication, OfficerSection } from '@/types/officer';

interface OfficerDashboardViewProps {
  applications: OfficerApplication[];
  onSelectSection: (section: OfficerSection) => void;
  onOpenApplicationReview: (app: OfficerApplication) => void;
  onQuickPreview: (app: OfficerApplication) => void;
  isLoading?: boolean;
}

type TaskKind = 'overdue' | 'resubmitted' | 'due-soon';

const DUE_SOON_MS = 24 * 60 * 60 * 1000;
const TASK_LIMIT = 5;

const TASK_BADGE: Record<TaskKind, { label: string; className: string; icon: typeof Clock }> = {
  overdue: { label: 'Quá hạn', className: 'bg-red-50 text-red-700 border-red-200', icon: WarningCircle },
  resubmitted: { label: 'Công dân gửi lại', className: 'bg-sky-50 text-sky-700 border-sky-200', icon: ArrowsClockwise },
  'due-soon': { label: 'Sắp đến hạn', className: 'bg-amber-50 text-amber-800 border-amber-200', icon: Clock },
};

// Các trạng thái cán bộ còn phải xử lý tiền kiểm (dùng để xét hạn xử lý)
const ACTIVE_STATUSES = new Set(['SUBMITTED_FOR_REVIEW', 'UNDER_REVIEW', 'RESUBMITTED']);

function formatRemaining(dueAtUtc?: string | null): string | null {
  if (!dueAtUtc) return null;
  const diff = Date.parse(dueAtUtc) - Date.now();
  if (Number.isNaN(diff)) return null;
  const abs = Math.abs(diff);
  const hours = Math.floor(abs / 3_600_000);
  const text = hours >= 24 ? `${Math.floor(hours / 24)} ngày` : hours >= 1 ? `${hours} giờ` : `${Math.max(1, Math.floor(abs / 60_000))} phút`;
  return diff < 0 ? `Quá hạn ${text}` : `Còn ${text}`;
}

function relativeTime(utc?: string | null, fallback?: string): string {
  const time = utc ? Date.parse(utc) : NaN;
  if (Number.isNaN(time)) return fallback ?? '';
  const minutes = Math.floor((Date.now() - time) / 60_000);
  if (minutes < 1) return 'Vừa xong';
  if (minutes < 60) return `${minutes} phút trước`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)} giờ trước`;
  return `${Math.floor(minutes / 1440)} ngày trước`;
}

export const OfficerDashboardView: React.FC<OfficerDashboardViewProps> = ({
  applications,
  onSelectSection,
  onOpenApplicationReview,
  onQuickPreview,
  isLoading = false,
}) => {
  const user = useAuthStore((state) => state.user);
  const myId = user?.id?.toLowerCase();
  const isMine = (app: OfficerApplication) => Boolean(myId && app.assignedOfficerId?.toLowerCase() === myId);

  const count = (status: OfficerApplication['status']) => applications.filter((a) => a.status === status).length;
  const stats: { label: string; value: number; hint: string; section: OfficerSection }[] = [
    { label: 'Chờ tiền kiểm', value: count('SUBMITTED_FOR_REVIEW'), hint: 'Công dân đã gửi, chưa kiểm tra', section: 'apps-pending' },
    { label: 'Đang kiểm tra', value: count('UNDER_REVIEW'), hint: 'Đã nhận xử lý', section: 'apps-reviewing' },
    { label: 'Công dân đã gửi lại', value: count('RESUBMITTED'), hint: 'Sau khi được yêu cầu bổ sung', section: 'apps-resubmitted' },
    { label: 'Giấy tờ sẵn sàng', value: count('DOCUMENTS_READY'), hint: 'Đã xác nhận đủ giấy tờ', section: 'apps-approved' },
  ];

  // Việc cần làm ngay: quá hạn → công dân gửi lại (hồ sơ mình phụ trách) → sắp đến hạn trong 24 giờ
  const tasks = applications
    .map((app) => {
      const due = app.dueAtUtc ? Date.parse(app.dueAtUtc) : NaN;
      const active = ACTIVE_STATUSES.has(app.status);
      let kind: TaskKind | null = null;
      if (active && app.urgency === 'overdue') kind = 'overdue';
      else if (app.status === 'RESUBMITTED' && isMine(app)) kind = 'resubmitted';
      else if (active && !Number.isNaN(due) && due - Date.now() <= DUE_SOON_MS) kind = 'due-soon';
      return kind ? { app, kind, due } : null;
    })
    .filter((x): x is { app: OfficerApplication; kind: TaskKind; due: number } => x !== null)
    .sort((a, b) => {
      const order: Record<TaskKind, number> = { overdue: 0, resubmitted: 1, 'due-soon': 2 };
      return order[a.kind] - order[b.kind] || (a.due || Infinity) - (b.due || Infinity);
    });

  // Hàng đợi chưa ai nhận: hồ sơ chờ tiền kiểm chưa có cán bộ phụ trách
  const unassigned = applications.filter((a) => a.status === 'SUBMITTED_FOR_REVIEW' && !a.assignedOfficerId);

  const shortcuts: { label: string; hint: string; icon: typeof Clock; section: OfficerSection }[] = [
    { label: 'Lịch ca làm', hint: 'Xem ca trực của bạn', icon: CalendarBlank, section: 'shifts' },
    { label: 'Nghỉ phép cá nhân', hint: 'Gửi và theo dõi đơn nghỉ', icon: Clock, section: 'leaves' },
    { label: 'Hộp thư tham vấn', hint: 'Trao đổi với lãnh đạo', icon: ChatsCircle, section: 'consultations' },
  ];

  return (
    <div className="space-y-6">
      {/* Lời chào đã chuyển lên tiêu đề trang (OfficerPage). Dải chỉ số giống Admin; mỗi ô bấm được để mở danh sách. */}
      <section className="admin-card kpi-strip" aria-label="Chỉ số hồ sơ">
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

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* Việc cần làm ngay */}
        <section aria-labelledby="priority-action-heading" className="admin-card self-start">
          <div className="admin-card-heading">
            <div>
              <h2 id="priority-action-heading">Việc cần làm ngay ({tasks.length})</h2>
            </div>
            <button type="button" onClick={() => onSelectSection('apps-all')}>Xem tất cả</button>
          </div>

          {isLoading ? (
            <div className="p-5"><ListSkeleton rows={3} /></div>
          ) : tasks.length === 0 ? (
            <EmptyState icon={CheckCircle} title="Không có việc gấp" description="Chưa có hồ sơ quá hạn, sắp đến hạn hoặc công dân vừa gửi lại." />
          ) : (
            <ul className="divide-y divide-slate-100">
              {tasks.slice(0, TASK_LIMIT).map(({ app, kind }) => {
                const badge = TASK_BADGE[kind];
                const BadgeIcon = badge.icon;
                const remaining = formatRemaining(app.dueAtUtc);
                return (
                  <li key={app.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-bold ${badge.className}`}>
                          <BadgeIcon size={12} weight="bold" aria-hidden />
                          {badge.label}
                        </span>
                        <span className="font-mono text-xs text-slate-500">{app.applicationNumber}</span>
                      </div>
                      <p className="mt-1 truncate text-sm font-semibold text-slate-900">{app.procedureName}</p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {app.citizen.fullName}
                        {remaining && <><span className="mx-1.5 text-slate-300">·</span><span className={kind === 'overdue' ? 'font-semibold text-red-700' : ''}>{remaining}</span></>}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => onQuickPreview(app)}
                        className="ws-row-btn"
                      >
                        Xem nhanh
                      </button>
                      <button
                        type="button"
                        onClick={() => onOpenApplicationReview(app)}
                        className="ws-row-btn is-primary"
                      >
                        Xử lý
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          {!isLoading && tasks.length > TASK_LIMIT && (
            <p className="border-t border-slate-100 px-5 py-3 text-xs text-slate-500">Còn {tasks.length - TASK_LIMIT} việc khác. Bấm "Xem tất cả" để mở danh sách.</p>
          )}
        </section>

        <div className="space-y-6">
          {/* Hàng đợi chưa nhận */}
          <section aria-labelledby="unassigned-heading" className="admin-card">
            <div className="admin-card-heading">
              <div>
                <h2 id="unassigned-heading">Hàng đợi chưa nhận</h2>
              </div>
              {!isLoading && <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">{unassigned.length} hồ sơ</span>}
            </div>
            {isLoading ? (
              <div className="p-4"><ListSkeleton rows={2} /></div>
            ) : unassigned.length === 0 ? (
              <EmptyState title="Không có hồ sơ chờ nhận." />
            ) : (
              <>
                <ul className="divide-y divide-slate-100">
                  {unassigned.slice(0, 3).map((app) => (
                    <li key={app.id}>
                      <button
                        type="button"
                        onClick={() => onOpenApplicationReview(app)}
                        className="group flex w-full items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-slate-50"
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-slate-900">{app.procedureName}</span>
                          <span className="mt-0.5 block text-xs text-slate-500">
                            <span className="font-mono">{app.applicationNumber}</span>
                            <span className="mx-1.5 text-slate-300">·</span>
                            {relativeTime(app.submittedAtUtc, app.submittedAt)}
                          </span>
                        </span>
                        <CaretRight size={16} className="shrink-0 text-slate-300 group-hover:text-red-700" aria-hidden />
                      </button>
                    </li>
                  ))}
                </ul>
                <div className="border-t border-slate-100 p-3">
                  <button
                    type="button"
                    onClick={() => onSelectSection('apps-pending')}
                    className="w-full rounded-lg py-2 text-sm font-bold text-red-800 transition hover:bg-red-50"
                  >
                    Mở hàng đợi chờ tiền kiểm
                  </button>
                </div>
              </>
            )}
          </section>

          {/* Lối tắt */}
          <section aria-labelledby="shortcut-heading" className="admin-card">
            <div className="admin-card-heading">
              <div>
                <h2 id="shortcut-heading">Lối tắt</h2>
              </div>
            </div>
            <div className="space-y-1 p-3">
              {shortcuts.map(({ label, hint, icon: Icon, section }) => (
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
                  <CaretRight size={16} className="shrink-0 text-slate-300 group-hover:text-red-700" aria-hidden />
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
