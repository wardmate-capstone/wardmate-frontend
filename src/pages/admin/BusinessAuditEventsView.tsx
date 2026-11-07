import { useState } from 'react';
import { Badge, Button, Modal } from '@/components/ui';
import { useSystemAdministration } from '@/hooks/useSystemAdministration';
import { auditSources, emptyAuditFilters, systemAdministrationApi as api, type AuditFilters } from '@/lib/api/systemAdministration';
import { AuditFilterForm, AuditMetadata, AuditPagination, auditTime, copyAudit, JsonAuditBlock, SystemRequestStatus } from './SystemAuditShared';

const actions: Record<string, string> = { INSERT: 'Thêm mới', UPDATE: 'Cập nhật', DELETE: 'Xóa' };
export function BusinessAuditEventsView() {
  const [filters, setFilters] = useState<AuditFilters>({ ...emptyAuditFilters });
  const [page, setPage] = useState(1);
  const [pageSize, setSize] = useState(20);
  const [id, setId] = useState('');
  const query = { ...filters, page, pageSize };
  const list = useSystemAdministration('events', query, signal => api.events(query, signal));
  const detail = useSystemAdministration('event', id, signal => api.event(id, signal), !!id);
  const selected = !detail.isError ? detail.data : undefined;
  return <section className="admin-card min-w-0 space-y-5 p-4 sm:p-6">
    <div className="flex flex-wrap items-start justify-between gap-4"><div className="space-y-2"><h2 className="text-lg font-bold">Nhật ký nghiệp vụ toàn hệ thống</h2><p className="text-sm text-slate-600">Theo dõi thay đổi dữ liệu do các dịch vụ gửi về. Sự kiện có thể xuất hiện chậm sau khi thao tác hoàn tất.</p></div><Button variant="outline" loading={list.isFetching} onClick={() => void list.refetch()}>Làm mới</Button></div>
    <AuditFilterForm business onApply={value => { setFilters(value); setPage(1); }} />
    <SystemRequestStatus pending={list.isPending} error={list.error} fetching={list.isFetching} retry={() => void list.refetch()} />
    {!list.isError && list.data && <><div className="overflow-x-auto"><table className="w-full text-left text-sm [&_th]:whitespace-nowrap [&_th]:p-3 [&_td]:p-3 [&_tr]:border-b [&_tr]:border-slate-100"><thead><tr><th>Thời điểm</th><th>Nguồn</th><th>Thực thể</th><th>Hành động</th><th>Người thực hiện</th><th>Thao tác</th></tr></thead><tbody>{list.data.items.map(row => <tr key={row.eventId}><td className="whitespace-nowrap">{auditTime(row.occurredAtUtc)}</td><td>{auditSources[row.source as keyof typeof auditSources] ?? row.source}</td><td>{row.entity}</td><td><Badge variant={row.action === 'DELETE' ? 'danger' : row.action === 'INSERT' ? 'success' : 'info'}>{actions[row.action] ?? row.action}</Badge></td><td className="max-w-48 break-all">{row.actorId ?? 'Không có thông tin người thực hiện'}</td><td><Button variant="outline" size="small" aria-label={`Chi tiết sự kiện ${row.eventId}`} onClick={() => setId(row.eventId)}>Chi tiết</Button></td></tr>)}</tbody></table></div>
      {list.data.items.length === 0 && <p className="py-6 text-center text-sm text-slate-600">Không có sự kiện phù hợp với bộ lọc.</p>}
      <AuditPagination page={page} pageSize={pageSize} total={list.data.totalCount} busy={list.isFetching} onPage={setPage} onSize={value => { setSize(value); setPage(1); }} /></>}
    <Modal open={!!id} onOpenChange={open => { if (!open) setId(''); }} title="Chi tiết sự kiện nghiệp vụ" description="Dữ liệu nhạy cảm đã được ẩn tại nguồn. Nhật ký không phải bản sao để khôi phục tài liệu." className="sm:max-w-4xl">
      <SystemRequestStatus pending={detail.isPending} error={detail.error} retry={() => void detail.refetch()} />
      {selected && <div className="space-y-5"><AuditMetadata><div><dt>Mã sự kiện</dt><dd>{selected.eventId}</dd></div><div><dt>Thời điểm</dt><dd>{auditTime(selected.occurredAtUtc)}</dd></div><div><dt>Nguồn / Thực thể / Hành động</dt><dd>{selected.source} / {selected.schema}.{selected.entity} / {actions[selected.action] ?? selected.action}</dd></div><div><dt>Người thực hiện</dt><dd>{selected.actorId ?? 'Không có thông tin người thực hiện'}</dd></div><div><dt>Địa chỉ IP</dt><dd>{selected.clientIp ?? 'Không có thông tin'}</dd></div><div><dt>Mã tra cứu</dt><dd>{selected.traceId ?? 'Không có thông tin'}</dd></div></AuditMetadata>
        <JsonAuditBlock title="Định danh thực thể" value={selected.entityKey} /><p className="text-sm text-slate-600">[Đã ẩn]: Dữ liệu nhạy cảm.</p><div className="grid min-w-0 gap-4 md:grid-cols-2"><JsonAuditBlock title="Trước thay đổi" value={selected.before} /><JsonAuditBlock title="Sau thay đổi" value={selected.after} /></div><details><summary className="cursor-pointer text-sm font-semibold">Xem dữ liệu gốc</summary><JsonAuditBlock title="Dữ liệu sự kiện" value={selected} /></details><Button variant="outline" onClick={() => void copyAudit(selected)}>Sao chép dữ liệu</Button></div>}
    </Modal>
  </section>;
}
