import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Modal, StatGridSkeleton, toast } from '@/components/ui';
import { useAuthStore } from '@/stores/authStore';
import { useSystemAdministration } from '@/hooks/useSystemAdministration';
import { systemOperationsApi as api, emptyOperationsFilters, type OperationsFilters } from '@/lib/api/systemOperations';
import { systemError } from '@/lib/api/systemAdministration';
import { AuditMetadata, AuditPagination, auditTime, SystemRequestStatus } from './SystemAuditShared';
import { hasObservation, OperationBadge, OperationsFilter } from './SystemOperationsShared';

export function ServiceHealthView() {
  const userId = useAuthStore(state => state.user?.id);
  const cache = useQueryClient();
  const latest = useSystemAdministration('health-services', null, signal => api.services(signal));
  const [service, setService] = useState('');
  const detail = useSystemAdministration('health-service', service, signal => api.service(service, signal), !!service);
  const [filters, setFilters] = useState<OperationsFilters>({ ...emptyOperationsFilters });
  const [page, setPage] = useState(1);
  const [pageSize, setSize] = useState(20);
  const query = { ...filters, page, pageSize };
  const history = useSystemAdministration('health-history', query, signal => api.history(query, signal));
  const check = useMutation({ mutationFn: api.checkNow, retry: false });
  const [refreshAt, setRefreshAt] = useState(0);
  const [checking, setChecking] = useState(false);
  const [requestId, setRequestId] = useState('');
  useEffect(() => {
    if (!refreshAt) return;
    const timer = window.setTimeout(() => {
      void cache.invalidateQueries({ predicate: item => item.queryKey[0] === 'system-administration' && item.queryKey[1] === userId && String(item.queryKey[2]).startsWith('health-') });
      setRefreshAt(0);
    }, Math.max(0, refreshAt - Date.now()));
    return () => window.clearTimeout(timer);
  }, [refreshAt, cache, userId]);
  async function checkNow() {
    if (checking) return;
    setChecking(true);
    try {
      const result = await check.mutateAsync();
      if (useAuthStore.getState().user?.id !== userId) return;
      setRequestId(result.requestId); setRefreshAt(Date.now() + 3000);
      toast.info('Đã xếp hàng kiểm tra dịch vụ. Kết quả sẽ được làm mới sau ít giây.');
    } catch { /* Error is shown beside the action. Never retry POST automatically. */ }
    finally { setChecking(false); }
  }
  const selected = !detail.isError ? detail.data : undefined;
  return <div className="min-w-0 space-y-5"><section className="admin-card space-y-5 p-4 sm:p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div className="space-y-2"><h2 className="text-lg font-bold">Giám sát dịch vụ</h2><p className="max-w-2xl text-sm text-slate-600">Trạng thái từ lần đo gần nhất của các dịch vụ đã được cấu hình. Kết quả cũ hoặc chưa có phép đo được hiển thị riêng.</p></div><div className="flex flex-wrap gap-3"><Button variant="outline" loading={latest.isFetching} onClick={() => void latest.refetch()}>Làm mới trạng thái</Button><Button loading={checking} disabled={!!refreshAt} onClick={() => void checkNow()}>Kiểm tra ngay</Button></div></div>
      {check.error && <p role="alert" className="text-sm text-red-800">{systemError(check.error)} Hãy làm mới trạng thái trước khi chủ động gửi yêu cầu khác.</p>}
      {requestId && <p role="status" className="break-all rounded-xl bg-amber-50 p-3 text-sm text-amber-950">Đã xếp hàng yêu cầu {requestId}. {refreshAt ? 'Đang chờ làm mới kết quả.' : 'Đã yêu cầu làm mới dữ liệu.'} Chưa có xác nhận hoàn tất riêng cho yêu cầu này; hãy đối chiếu thời điểm đo.</p>}
      {latest.isPending ? <StatGridSkeleton count={4} /> : <SystemRequestStatus pending={false} error={latest.error} retry={() => void latest.refetch()} />}
      {!latest.isError && latest.data && <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{latest.data.map(row => <article key={row.serviceName} className="min-w-0 space-y-3 rounded-xl border border-slate-200 p-4"><h3 className="break-all font-semibold">{row.serviceName}</h3><OperationBadge status={row.status} />{hasObservation(row) ? <div className="space-y-1 text-sm text-slate-600"><p>Phản hồi: {row.responseTimeMs} ms · HTTP {row.httpStatus ?? 'Chưa có'}</p><p>Đo lúc: {auditTime(row.checkedAtUtc)}</p></div> : <p className="text-sm text-slate-600">Chưa có kết quả kiểm tra.</p>}{row.errorCode === 'stale_observation' && <p className="text-sm text-amber-900">Kết quả đã cũ, cần kiểm tra lại.</p>}<Button variant="outline" size="small" aria-label={`Chi tiết dịch vụ ${row.serviceName}`} onClick={() => setService(row.serviceName)}>Xem chi tiết</Button></article>)}</div>}
      {!latest.isError && latest.data?.length === 0 && <p className="text-sm text-slate-600">Chưa có dịch vụ được cấu hình giám sát.</p>}
    </section><section className="admin-card min-w-0 space-y-5 p-4 sm:p-6"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-bold">Lịch sử kiểm tra dịch vụ</h2><Button variant="outline" loading={history.isFetching} onClick={() => void history.refetch()}>Làm mới lịch sử</Button></div><OperationsFilter services={latest.data?.map(row => row.serviceName)} onApply={value => { setFilters(value); setPage(1); }} />
      <SystemRequestStatus pending={history.isPending} error={history.error} retry={() => void history.refetch()} />
      {!history.isError && history.data && <><div className="overflow-x-auto"><table className="w-full text-left text-sm [&_th]:whitespace-nowrap [&_th]:p-3 [&_td]:p-3 [&_tr]:border-b [&_tr]:border-slate-100"><thead><tr><th>Dịch vụ</th><th>Trạng thái</th><th>Thời gian phản hồi</th><th>HTTP</th><th>Thời điểm đo</th><th>Mã lỗi</th></tr></thead><tbody>{history.data.items.map(row => <tr key={row.id}><td>{row.serviceName}</td><td><OperationBadge status={row.status} /></td><td>{hasObservation(row) ? `${row.responseTimeMs} ms` : 'Chưa đo'}</td><td>{row.httpStatus ?? 'Chưa có'}</td><td className="whitespace-nowrap">{hasObservation(row) ? auditTime(row.checkedAtUtc) : 'Chưa có kết quả'}</td><td>{row.errorCode ?? 'Không có'}</td></tr>)}</tbody></table></div>{history.data.items.length === 0 && <p className="py-5 text-center text-sm text-slate-600">Không có lịch sử phù hợp.</p>}<AuditPagination page={page} pageSize={pageSize} total={history.data.totalCount} busy={history.isFetching} onPage={setPage} onSize={value => { setSize(value); setPage(1); }} /></>}
    </section><Modal open={!!service} onOpenChange={open => { if (!open) setService(''); }} title="Chi tiết giám sát dịch vụ" description="Kết quả đo do máy chủ cung cấp."><SystemRequestStatus pending={detail.isPending} error={detail.error} retry={() => void detail.refetch()} />{selected && <AuditMetadata><div><dt>Dịch vụ</dt><dd>{selected.serviceName}</dd></div><div><dt>Trạng thái</dt><dd><OperationBadge status={selected.status} /></dd></div><div><dt>Thời điểm đo</dt><dd>{hasObservation(selected) ? auditTime(selected.checkedAtUtc) : 'Chưa có kết quả'}</dd></div><div><dt>Thời gian phản hồi</dt><dd>{hasObservation(selected) ? `${selected.responseTimeMs} ms` : 'Chưa đo'}</dd></div><div><dt>HTTP</dt><dd>{selected.httpStatus ?? 'Chưa có'}</dd></div><div><dt>Mã lỗi</dt><dd>{selected.errorCode ?? 'Không có'}</dd></div></AuditMetadata>}</Modal></div>;
}
