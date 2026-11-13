import { useState } from 'react';
import { Button, Modal, RefreshButton } from '@/components/ui';
import { useSystemAdministration } from '@/hooks/useSystemAdministration';
import { emptyAuditFilters, systemAdministrationApi as api, type AuditFilters } from '@/lib/api/systemAdministration';
import { AuditFilterForm, AuditMetadata, AuditPagination, auditTime, SystemRequestStatus } from './SystemAuditShared';

export function SystemAuditLogsView() {
  const [filters, setFilters] = useState<AuditFilters>({ ...emptyAuditFilters });
  const [page, setPage] = useState(1);
  const [pageSize, setSize] = useState(20);
  const [id, setId] = useState('');
  const query = { ...filters, page, pageSize };
  const list = useSystemAdministration('audits', query, signal => api.audits(query, signal));
  const detail = useSystemAdministration('audit', id, signal => api.audit(id, signal), !!id);
  const selected = !detail.isError ? detail.data : undefined;
  return <section className="admin-card min-w-0 space-y-5 p-4 sm:p-6"><div className="flex flex-wrap items-center justify-between gap-4"><h2 className="text-lg font-bold">Nhật ký thay đổi cấu hình</h2><RefreshButton loading={list.isFetching} onClick={() => void list.refetch()} /></div>
    <AuditFilterForm onApply={value => { setFilters(value); setPage(1); }} />
    <SystemRequestStatus pending={list.isPending} error={list.error} fetching={list.isFetching} retry={() => void list.refetch()} />
    {!list.isError && list.data && <><div className="admin-table-wrap"><table><thead><tr><th>Thời điểm</th><th>Tham số</th><th>Giá trị cũ → mới</th><th>Phiên bản</th><th>Người thực hiện</th><th>Lý do</th><th>Thao tác</th></tr></thead><tbody>{list.data.items.map(row => <tr key={row.id}><td className="whitespace-nowrap">{auditTime(row.occurredAtUtc)}</td><td>{row.entityKey}</td><td>{row.previousValue ?? 'Chưa có'} → {row.newValue}</td><td>{row.version}</td><td className="max-w-48 break-all">{row.actorId}</td><td className="min-w-48 whitespace-pre-wrap break-words">{row.reason}</td><td><Button variant="outline" size="small" aria-label={`Chi tiết nhật ký ${row.id}`} onClick={() => setId(row.id)}>Chi tiết</Button></td></tr>)}</tbody></table></div>{list.data.items.length === 0 && <p className="py-6 text-center text-sm text-slate-600">Không có nhật ký cấu hình phù hợp với bộ lọc.</p>}
      <AuditPagination page={page} pageSize={pageSize} total={list.data.totalCount} busy={list.isFetching} onPage={setPage} onSize={value => { setSize(value); setPage(1); }} /></>}
    <Modal open={!!id} onOpenChange={open => { if (!open) setId(''); }} title="Chi tiết thay đổi cấu hình" description="Thông tin thay đổi được lưu cùng lần cập nhật cấu hình."><SystemRequestStatus pending={detail.isPending} error={detail.error} retry={() => void detail.refetch()} />{selected && <AuditMetadata>
      <div><dt>Mã nhật ký</dt><dd>{selected.id}</dd></div><div><dt>Thời điểm</dt><dd>{auditTime(selected.occurredAtUtc)}</dd></div><div><dt>Hành động</dt><dd>{selected.action === 'system.setting.updated' ? 'Cập nhật cấu hình' : selected.action}</dd></div><div><dt>Tham số</dt><dd>{selected.entityKey}</dd></div><div><dt>Giá trị cũ → mới</dt><dd>{selected.previousValue ?? 'Chưa có'} → {selected.newValue}</dd></div><div><dt>Phiên bản</dt><dd>{selected.version}</dd></div><div><dt>Lý do</dt><dd className="whitespace-pre-wrap">{selected.reason}</dd></div><div><dt>Người thực hiện</dt><dd>{selected.actorId}</dd></div><div><dt>Địa chỉ IP</dt><dd>{selected.clientIp ?? 'Không có thông tin'}</dd></div><div><dt>Mã tra cứu</dt><dd>{selected.traceId || 'Không có thông tin'}</dd></div>
    </AuditMetadata>}</Modal>
  </section>;
}
