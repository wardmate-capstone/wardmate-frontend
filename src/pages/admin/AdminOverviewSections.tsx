import { ArrowRight, CheckCircle } from '@phosphor-icons/react';
import { useQuery } from '@tanstack/react-query';
import { useSystemAdministration } from '@/hooks/useSystemAdministration';
import { useAiUsage, useCanManageKnowledge, useKnowledgeIndexStatus } from '@/hooks/useAiKnowledge';
import { backupStates, emptyOperationsFilters, healthStates, systemOperationsApi as api } from '@/lib/api/systemOperations';
import { notificationAdminApi } from '@/lib/api/notificationAdmin';
import { vietnamToday } from '@/lib/calendarRules';
import { formatDateTime } from '@/lib/dateFormat';
import { useAuthStore } from '@/stores/authStore';
import { serviceLabel } from './SystemOperationsShared';

export type OverviewTarget = 'integrations' | 'backup' | 'knowledge' | 'notification-deliveries';

const num = (value: number) => value.toLocaleString('vi-VN');
const STALE_BACKUP_DAYS = 7;
const AI_QUOTA_WARNING = 80;
/** Màu trạng thái luôn đi kèm nhãn chữ (không dùng màu đơn lẻ). */
const tone = { good: '#0ca30c', warning: '#fab219', critical: '#d03b3b', neutral: '#a8a7a0' } as const;
const healthTone: Record<string, string> = { Healthy: tone.good, Degraded: tone.warning, Unhealthy: tone.critical };
const backupTone: Record<string, string> = { Succeeded: tone.good, Verified: tone.good, Failed: tone.critical, Queued: tone.neutral, Running: tone.neutral };

function Dot({ color }: { color?: string }) {
  return color ? <span aria-hidden="true" className="ws-dot" style={{ backgroundColor: color }} /> : <span aria-hidden="true" className="ws-dot is-empty" />;
}

/**
 * Dữ liệu cho Tổng quan Admin, chỉ từ API sẵn có. Mỗi nguồn chỉ gọi khi tài khoản có quyền tương ứng
 * (IT_ADMIN cho dịch vụ/sao lưu; knowledge.manage cho AI; notifications.deliveries.read cho thông báo).
 */
export function useAdminOverviewData() {
  const user = useAuthStore(state => state.user);
  const isAdmin = !!user?.roles.includes('IT_ADMIN');
  const canAi = useCanManageKnowledge();
  const canDeliveries = isAdmin && !!user?.permissions.includes('notifications.deliveries.read');
  const today = vietnamToday();

  const services = useSystemAdministration('health-services', null, signal => api.services(signal));
  const backups = useSystemAdministration('overview-latest-backup', null, signal => api.backups({ ...emptyOperationsFilters, page: 1, pageSize: 1 }, signal));
  const aiUsage = useAiUsage(today, today);
  const aiIndex = useKnowledgeIndexStatus();
  const deliveryCount = (state: 'Dead' | 'Blocked') => ({
    queryKey: ['admin-overview', user?.id, 'deliveries', state],
    queryFn: ({ signal }: { signal: AbortSignal }) => notificationAdminApi.list({ state, page: 1, pageSize: 1 }, signal).then(page => page.total),
    enabled: canDeliveries, retry: false,
  });
  const deadDeliveries = useQuery(deliveryCount('Dead'));
  const blockedDeliveries = useQuery(deliveryCount('Blocked'));
  return { isAdmin, canAi, canDeliveries, services, backups, aiUsage, aiIndex, deadDeliveries, blockedDeliveries };
}
type OverviewData = ReturnType<typeof useAdminOverviewData>;

/** Dải chỉ số vận hành: dịch vụ, lượt AI hôm nay (khi có quyền), tài khoản, đơn vị. */
export function AdminKpiStrip({ data, userCount, wardTotal }: { data: OverviewData; userCount?: number; wardTotal?: number }) {
  const rows = data.services.data ?? [];
  const healthy = rows.filter(row => row.status === 'Healthy').length;
  const usage = data.aiUsage.data;
  const percent = usage && usage.dailyRequestsTotal > 0 ? Math.round((usage.usedToday / usage.dailyRequestsTotal) * 100) : null;
  const items: { label: string; value: string; hint: string }[] = [];
  if (data.isAdmin) items.push({
    label: 'Dịch vụ hoạt động tốt',
    value: data.services.isSuccess ? `${num(healthy)}/${num(rows.length)}` : '—',
    hint: data.services.isSuccess ? 'Ở lần đo gần nhất' : data.services.isError ? 'Chưa tải được tình trạng' : 'Đang tải',
  });
  if (data.canAi) items.push({
    label: 'Lượt AI hôm nay',
    value: usage ? `${num(usage.usedToday)}/${num(usage.dailyRequestsTotal)}` : '—',
    hint: percent != null ? `${percent}% hạn mức ngày` : data.aiUsage.isError ? 'Chưa tải được lượt dùng' : 'Đang tải',
  });
  items.push({
    label: 'Tài khoản nội bộ',
    value: userCount !== undefined ? num(userCount) : '—',
    hint: userCount !== undefined ? 'Cán bộ, quản lý và quản trị viên' : 'Chưa tải được danh sách tài khoản',
  });
  items.push({
    label: 'Đơn vị Phường / Xã',
    value: wardTotal !== undefined ? num(wardTotal) : '—',
    hint: wardTotal !== undefined ? 'Đơn vị đã khai báo trong hệ thống' : 'Chưa tải được danh sách đơn vị',
  });
  return <section className={`admin-card kpi-strip${items.length === 3 ? ' is-3' : ''}`} aria-label="Chỉ số vận hành">
    <dl>{items.map(item => <div key={item.label}>
      <dt>{item.label}</dt>
      <dd className="kpi-value">{item.value}</dd>
      <dd className="kpi-hint">{item.hint}</dd>
    </div>)}</dl>
  </section>;
}

type Attention = { key: string; severity: 'critical' | 'warning' | 'unknown'; text: string; target: OverviewTarget; action: string };

/** Ghép danh sách việc cần xử lý từ các nguồn; nguồn chưa tải được ghi rõ "chưa kiểm tra được" thay vì im lặng. */
function attentionItems(data: OverviewData): { items: Attention[]; checking: boolean } {
  const items: Attention[] = [];
  let checking = false;
  if (data.isAdmin) {
    if (data.services.isPending) checking = true;
    else if (data.services.isError) items.push({ key: 'services-unknown', severity: 'unknown', text: 'Chưa kiểm tra được tình trạng dịch vụ.', target: 'integrations', action: 'Giám sát dịch vụ' });
    else for (const row of data.services.data ?? []) {
      if (row.status === 'Unhealthy' || row.status === 'Degraded') items.push({
        key: `service-${row.serviceName}`, severity: row.status === 'Unhealthy' ? 'critical' : 'warning',
        text: `${serviceLabel(row.serviceName)}: ${healthStates[row.status as keyof typeof healthStates]} (đo lúc ${formatDateTime(row.checkedAtUtc)})`,
        target: 'integrations', action: 'Giám sát dịch vụ',
      });
    }
    if (data.backups.isPending) checking = true;
    else if (data.backups.isError) items.push({ key: 'backup-unknown', severity: 'unknown', text: 'Chưa kiểm tra được lịch sử sao lưu.', target: 'backup', action: 'Sao lưu dữ liệu' });
    else {
      const latest = data.backups.data?.items[0];
      const ageDays = latest ? (Date.now() - Date.parse(latest.createdAtUtc)) / 86_400_000 : null;
      if (!latest) items.push({ key: 'backup-none', severity: 'warning', text: 'Chưa có bản sao lưu nào.', target: 'backup', action: 'Sao lưu dữ liệu' });
      else if (latest.status === 'Failed') items.push({ key: 'backup-failed', severity: 'critical', text: `Sao lưu ${serviceLabel(latest.serviceName)} thất bại (tạo lúc ${formatDateTime(latest.createdAtUtc)}).`, target: 'backup', action: 'Sao lưu dữ liệu' });
      else if (ageDays != null && ageDays > STALE_BACKUP_DAYS) items.push({ key: 'backup-stale', severity: 'warning', text: `Đã ${Math.floor(ageDays)} ngày chưa có yêu cầu sao lưu mới (gần nhất ${formatDateTime(latest.createdAtUtc)}).`, target: 'backup', action: 'Sao lưu dữ liệu' });
    }
  }
  if (data.canAi) {
    if (data.aiIndex.isPending || data.aiUsage.isPending) checking = true;
    const failed = data.aiIndex.data?.embeddingFailed ?? 0;
    if (failed > 0) items.push({ key: 'ai-failed', severity: 'warning', text: `${num(failed)} tài liệu kiến thức lỗi chuẩn bị cho AI, trợ lý chưa dùng được các tài liệu này.`, target: 'knowledge', action: 'Dữ liệu kiến thức AI' });
    const usage = data.aiUsage.data;
    if (usage && usage.dailyRequestsTotal > 0) {
      const percent = Math.round((usage.usedToday / usage.dailyRequestsTotal) * 100);
      if (percent >= AI_QUOTA_WARNING) items.push({ key: 'ai-quota', severity: percent >= 100 ? 'critical' : 'warning', text: `Lượt AI hôm nay đã dùng ${num(usage.usedToday)}/${num(usage.dailyRequestsTotal)} (${percent}% hạn mức).`, target: 'knowledge', action: 'Dữ liệu kiến thức AI' });
    }
  }
  if (data.canDeliveries) {
    if (data.deadDeliveries.isPending || data.blockedDeliveries.isPending) checking = true;
    if (data.deadDeliveries.isError || data.blockedDeliveries.isError) items.push({ key: 'deliveries-unknown', severity: 'unknown', text: 'Chưa kiểm tra được tình trạng phát thông báo.', target: 'notification-deliveries', action: 'Phát thông báo' });
    const dead = data.deadDeliveries.data ?? 0;
    const blocked = data.blockedDeliveries.data ?? 0;
    if (dead > 0) items.push({ key: 'deliveries-dead', severity: 'critical', text: `${num(dead)} thông báo gửi thất bại và đã ngừng thử lại.`, target: 'notification-deliveries', action: 'Phát thông báo' });
    if (blocked > 0) items.push({ key: 'deliveries-blocked', severity: 'warning', text: `${num(blocked)} thông báo bị chặn.`, target: 'notification-deliveries', action: 'Phát thông báo' });
  }
  const order = { critical: 0, warning: 1, unknown: 2 };
  items.sort((a, b) => order[a.severity] - order[b.severity]);
  return { items, checking };
}

/** Khối "Cần xử lý": chỉ liệt kê vấn đề đang có; không có gì thì một dòng "Hệ thống đang ổn". */
export function AdminAttention({ data, onSelect }: { data: OverviewData; onSelect: (target: OverviewTarget) => void }) {
  const { items, checking } = attentionItems(data);
  const severityColor = { critical: tone.critical, warning: tone.warning, unknown: undefined };
  const severityLabel = { critical: 'Nghiêm trọng', warning: 'Cần chú ý', unknown: 'Chưa kiểm tra được' };
  return <section className="admin-card ws-panel attention-panel" aria-labelledby="admin-attention-title" aria-busy={checking}>
    <header>
      <h2 id="admin-attention-title">Cần xử lý{items.length > 0 && <span className="attention-count">{items.length}</span>}</h2>
      <p>Vấn đề đang có ở dịch vụ, sao lưu, trợ lý AI và phát thông báo</p>
    </header>
    <div className="ws-panel-body">
      {items.length > 0 ? <ul className="attention-list">{items.map(item => <li key={item.key}>
        <span className="ws-status"><Dot color={severityColor[item.severity]} /><span className="sr-only">{severityLabel[item.severity]}: </span>{item.text}</span>
        <button type="button" className="ws-link" onClick={() => onSelect(item.target)}>{item.action} <ArrowRight size={14} aria-hidden="true" /></button>
      </li>)}</ul>
        : checking ? <p className="ws-muted" role="status">Đang kiểm tra…</p>
          : <p className="attention-ok" role="status"><CheckCircle size={18} weight="fill" aria-hidden="true" /> Hệ thống đang ổn, không có việc cần xử lý.</p>}
      {items.length > 0 && checking && <p className="ws-muted" role="status">Đang kiểm tra thêm…</p>}
    </div>
  </section>;
}

/** Tình trạng từng dịch vụ ở lần đo gần nhất, kèm một dòng về lần sao lưu gần nhất. */
export function AdminServicesPanel({ data, onSelect }: { data: OverviewData; onSelect: (target: OverviewTarget) => void }) {
  if (!data.isAdmin) return null;
  const rows = data.services.data ?? [];
  const latest = data.backups.data?.items[0];
  return <section className="admin-card ws-panel" aria-labelledby="admin-services-title" aria-busy={data.services.isPending}>
    <header><h2 id="admin-services-title">Tình trạng dịch vụ</h2><p>Lần đo gần nhất của từng dịch vụ</p></header>
    <div className="ws-panel-body">
      {data.services.isPending && <p className="ws-muted">Đang tải…</p>}
      {data.services.isError && <p role="alert" className="ws-muted">Chưa tải được tình trạng dịch vụ. <button type="button" className="ws-link" onClick={() => void data.services.refetch()}>Thử lại</button></p>}
      {data.services.isSuccess && (rows.length ? <dl>{rows.map(row => <div className="ws-row" key={row.serviceName}>
        <dt>{serviceLabel(row.serviceName)}</dt>
        <dd><span className="ws-status"><Dot color={healthTone[row.status]} />{healthStates[row.status as keyof typeof healthStates] ?? row.status}</span></dd>
      </div>)}</dl> : <p className="ws-muted">Chưa có dịch vụ nào được cấu hình đo.</p>)}
      {data.backups.isSuccess && <p className="services-backup">
        <span>Sao lưu gần nhất:</span>{' '}
        {latest ? <span className="ws-status"><Dot color={backupTone[latest.status]} />{serviceLabel(latest.serviceName)} · {backupStates[latest.status as keyof typeof backupStates] ?? latest.status} · {formatDateTime(latest.createdAtUtc)}</span> : 'chưa có'}
      </p>}
    </div>
    <footer>
      <button type="button" className="ws-link" onClick={() => onSelect('integrations')}>Giám sát dịch vụ <ArrowRight size={14} aria-hidden="true" /></button>
      <button type="button" className="ws-link" onClick={() => onSelect('backup')}>Sao lưu dữ liệu <ArrowRight size={14} aria-hidden="true" /></button>
    </footer>
  </section>;
}
