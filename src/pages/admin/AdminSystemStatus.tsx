import { ArrowRight } from '@phosphor-icons/react';
import { useSystemAdministration } from '@/hooks/useSystemAdministration';
import { backupStates, emptyOperationsFilters, healthStates, systemOperationsApi as api } from '@/lib/api/systemOperations';
import { formatDateTime } from '@/lib/dateFormat';
import { serviceLabel } from './SystemOperationsShared';

/** Màu trạng thái luôn đi kèm nhãn chữ (không dùng màu đơn lẻ). */
const healthTone: Record<string, string> = { Healthy: '#0ca30c', Degraded: '#fab219', Unhealthy: '#d03b3b' };
const backupTone: Record<string, string> = { Succeeded: '#0ca30c', Verified: '#0ca30c', Failed: '#d03b3b', Queued: '#a8a7a0', Running: '#a8a7a0' };

function Status({ tone, label }: { tone?: string; label: string }) {
  return <span className="ws-status">{tone ? <span aria-hidden="true" className="ws-dot" style={{ backgroundColor: tone }} /> : <span aria-hidden="true" className="ws-dot is-empty" />}{label}</span>;
}

function PanelLink({ label, onClick }: { label: string; onClick: () => void }) {
  return <footer><button type="button" className="ws-link" onClick={onClick}>{label} <ArrowRight size={14} aria-hidden="true" /></button></footer>;
}

/**
 * Khối "Cần chú ý" trên Tổng quan Admin: thay cho lưới lối tắt trùng menu.
 * Chỉ đọc dữ liệu giám sát dịch vụ và sao lưu đã có; không thêm API.
 */
export function AdminSystemStatus({ onSelect }: { onSelect: (section: 'integrations' | 'backup') => void }) {
  const services = useSystemAdministration('health-services', null, signal => api.services(signal));
  const backups = useSystemAdministration('overview-latest-backup', null, signal => api.backups({ ...emptyOperationsFilters, page: 1, pageSize: 1 }, signal));
  const rows = services.data ?? [];
  const healthy = rows.filter(row => row.status === 'Healthy').length;
  const latest = backups.data?.items[0];

  return <div className="ws-panels">
    <section className="admin-card ws-panel" aria-busy={services.isPending}>
      <header><h2>Tình trạng dịch vụ</h2><p>{services.isSuccess ? `${healthy}/${rows.length} dịch vụ hoạt động tốt ở lần đo gần nhất` : 'Lần đo gần nhất của từng dịch vụ'}</p></header>
      <div className="ws-panel-body">
        {services.isPending && <p className="ws-muted">Đang tải…</p>}
        {services.isError && <p role="alert" className="ws-muted">Chưa tải được tình trạng dịch vụ. <button type="button" className="ws-link" onClick={() => void services.refetch()}>Thử lại</button></p>}
        {services.isSuccess && (rows.length ? <dl>{rows.map(row => <div className="ws-row" key={row.serviceName}>
          <dt>{serviceLabel(row.serviceName)}</dt>
          <dd><Status tone={healthTone[row.status]} label={healthStates[row.status as keyof typeof healthStates] ?? row.status} /></dd>
        </div>)}</dl> : <p className="ws-muted">Chưa có dịch vụ nào được cấu hình đo.</p>)}
      </div>
      <PanelLink label="Giám sát dịch vụ" onClick={() => onSelect('integrations')} />
    </section>

    <section className="admin-card ws-panel" aria-busy={backups.isPending}>
      <header><h2>Sao lưu gần nhất</h2><p>Yêu cầu sao lưu mới nhất trên toàn hệ thống</p></header>
      <div className="ws-panel-body">
        {backups.isPending && <p className="ws-muted">Đang tải…</p>}
        {backups.isError && <p role="alert" className="ws-muted">Chưa tải được lịch sử sao lưu. <button type="button" className="ws-link" onClick={() => void backups.refetch()}>Thử lại</button></p>}
        {backups.isSuccess && (latest ? <dl>
          <div className="ws-row"><dt>Dịch vụ</dt><dd>{serviceLabel(latest.serviceName)}</dd></div>
          <div className="ws-row"><dt>Trạng thái</dt><dd><Status tone={backupTone[latest.status]} label={backupStates[latest.status as keyof typeof backupStates] ?? latest.status} /></dd></div>
          <div className="ws-row"><dt>Tạo lúc</dt><dd>{formatDateTime(latest.createdAtUtc)}</dd></div>
          <div className="ws-row"><dt>Hoàn thành</dt><dd>{latest.completedAtUtc ? formatDateTime(latest.completedAtUtc) : 'Chưa hoàn thành'}</dd></div>
        </dl> : <p className="ws-muted">Chưa có bản sao lưu nào.</p>)}
      </div>
      <PanelLink label="Sao lưu dữ liệu" onClick={() => onSelect('backup')} />
    </section>
  </div>;
}
