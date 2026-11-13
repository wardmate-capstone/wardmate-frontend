import { useEffect, useRef, useState } from 'react';
import { Plus } from '@phosphor-icons/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Input, Modal, toast, RefreshButton } from '@/components/ui';
import { useAuthStore } from '@/stores/authStore';
import { useSystemAdministration } from '@/hooks/useSystemAdministration';
import { createBackupSchema, emptyOperationsFilters, systemOperationsApi as api, type CreateBackup, type OperationsFilters } from '@/lib/api/systemOperations';
import { systemError } from '@/lib/api/systemAdministration';
import { AuditMetadata, AuditPagination, auditTime, SystemRequestStatus } from './SystemAuditShared';
import { OperationBadge, OperationsFilter, serviceLabel, BACKUP_SERVICES } from './SystemOperationsShared';

const verifyNotice = 'Xác minh kiểm tra kích thước, mã SHA-256 và việc đọc được đầy đủ tệp sao lưu. Kết quả này không thay thế việc thử khôi phục dữ liệu.';
function fileSize(value: number | null) { return value === null ? 'Chưa có' : value < 1024 ? `${value} B` : value < 1048576 ? `${(value / 1024).toFixed(1)} KB` : `${(value / 1048576).toFixed(1)} MB`; }
function CreateBackupDialog({ onClose, onCreated, services }: { onClose: () => void; onCreated: (id: string) => void; services: string[] }) {
  const userId = useAuthStore(state => state.user?.id);
  const form = useForm<CreateBackup>({ resolver: zodResolver(createBackupSchema), defaultValues: { serviceName: '', reason: '' } });
  const mutation = useMutation({ mutationFn: api.create, retry: false });
  const lock = useRef(false);
  async function create(input: CreateBackup) {
    if (lock.current) return;
    lock.current = true;
    try {
      const result = await mutation.mutateAsync(input);
      if (useAuthStore.getState().user?.id !== userId) return;
      toast.info('Đã xếp hàng sao lưu. Bản sao lưu chưa hoàn tất.'); onCreated(result.id);
    } catch { /* Keep entered data and show server error. */ }
    finally { lock.current = false; }
  }
  return <Modal open onOpenChange={open => { if (!open && !mutation.isPending) onClose(); }} title="Tạo bản sao lưu" description="Yêu cầu được xử lý nền cho dịch vụ đã được cấu hình sao lưu."><form noValidate onSubmit={form.handleSubmit(create)} className="space-y-4"><fieldset disabled={mutation.isPending} className="space-y-4"><div><Input id="backup-service" label="Dịch vụ cần sao lưu" required list="backup-service-options" placeholder="Chọn gợi ý hoặc nhập mã dịch vụ" {...form.register('serviceName')} error={form.formState.errors.serviceName?.message} hint="Gợi ý không phải danh sách đã bật sao lưu. Bạn có thể nhập mã khác do bộ phận vận hành cung cấp; máy chủ sẽ kiểm tra cấu hình." /><datalist id="backup-service-options">{[...new Set([...services, ...BACKUP_SERVICES])].map(name => <option key={name} value={name}>{serviceLabel(name)}</option>)}</datalist></div><Input label="Lý do sao lưu" required {...form.register('reason')} error={form.formState.errors.reason?.message} hint="Từ 3 đến 500 ký tự sau khi bỏ khoảng trắng đầu và cuối." /></fieldset>{mutation.error && <p role="alert" className="text-sm text-red-800">{systemError(mutation.error)} Nếu kết nối bị gián đoạn, hãy kiểm tra danh sách trước khi chủ động gửi lại.</p>}<div className="flex flex-wrap justify-end gap-3"><Button variant="outline" disabled={mutation.isPending} onClick={onClose}>Hủy</Button><Button type="submit" loading={mutation.isPending}>Xếp hàng sao lưu</Button></div></form></Modal>;
}

function BackupDetail({ id, onClose }: { id: string; onClose: () => void }) {
  const userId = useAuthStore(state => state.user?.id);
  const cache = useQueryClient();
  const detail = useSystemAdministration('backup', id, signal => api.backup(id, signal));
  const [polls, setPolls] = useState(0);
  const [confirm, setConfirm] = useState(false);
  const [needsRefresh, setNeedsRefresh] = useState(false);
  const lock = useRef(false);
  const verify = useMutation({ mutationFn: async () => {
    const latest = await api.backup(id);
    if (latest.status !== 'Succeeded' && latest.status !== 'Verified') throw new Error('Bản sao lưu chưa ở trạng thái có thể xác minh. Hãy tải lại chi tiết.');
    return api.verify(id);
  }, retry: false });
  const row = !detail.isError ? detail.data : undefined;
  const active = row?.status === 'Queued' || row?.status === 'Running';
  useEffect(() => {
    if (!active || detail.isFetching || detail.isError || polls >= 20) return;
    const timer = window.setTimeout(() => { setPolls(count => count + 1); void detail.refetch(); }, 3000);
    return () => window.clearTimeout(timer);
  }, [active, detail.isFetching, detail.isError, detail.dataUpdatedAt, detail.refetch, polls]);
  async function verifyNow() {
    if (lock.current || needsRefresh) return;
    lock.current = true;
    try {
      await verify.mutateAsync();
      if (useAuthStore.getState().user?.id !== userId) return;
      toast.success('Đã xác minh tính toàn vẹn tệp sao lưu.'); setConfirm(false);
    } catch {
      setNeedsRefresh(true); setConfirm(false);
    }
    finally {
      if (useAuthStore.getState().user?.id === userId) await cache.invalidateQueries({ predicate: query => query.queryKey[0] === 'system-administration' && query.queryKey[1] === userId && String(query.queryKey[2]).startsWith('backup') });
      lock.current = false;
    }
  }
  async function refreshDetail() {
    const result = await detail.refetch();
    if (!result.isError) { setNeedsRefresh(false); setConfirm(false); verify.reset(); }
  }
  return <Modal open onOpenChange={open => { if (!open && !verify.isPending) onClose(); }} title="Chi tiết bản sao lưu" description="Trạng thái và các mốc xử lý của bản sao lưu."><div className="space-y-4"><SystemRequestStatus pending={detail.isPending} error={detail.error} retry={() => void refreshDetail()} />
    {row && <><AuditMetadata><div><dt>Mã bản sao lưu</dt><dd>{row.id}</dd></div><div><dt>Dịch vụ</dt><dd>{serviceLabel(row.serviceName)}</dd></div><div><dt>Trạng thái</dt><dd><OperationBadge status={row.status} backup /></dd></div><div><dt>Lý do</dt><dd>{row.reason}</dd></div><div><dt>Người yêu cầu</dt><dd>{row.requestedBy ?? 'Không có thông tin'}</dd></div><div><dt>Kích thước</dt><dd>{fileSize(row.sizeBytes)}</dd></div><div><dt>Mã SHA-256</dt><dd>{row.sha256 ?? 'Chưa có'}</dd></div><div><dt>Tạo lúc</dt><dd>{auditTime(row.createdAtUtc)}</dd></div><div><dt>Bắt đầu</dt><dd>{auditTime(row.startedAtUtc)}</dd></div><div><dt>Hoàn thành</dt><dd>{auditTime(row.completedAtUtc)}</dd></div><div><dt>Xác minh lúc</dt><dd>{auditTime(row.verifiedAtUtc)}</dd></div><div><dt>Thử khôi phục lúc</dt><dd>{row.restoreTestedAtUtc ? auditTime(row.restoreTestedAtUtc) : 'Chưa có thông tin thử khôi phục'}</dd></div><div><dt>Mã lỗi</dt><dd>{row.errorCode ?? 'Không có'}</dd></div></AuditMetadata>
      {active && <p role="status" className="text-sm text-slate-600">Bản sao lưu đang được xử lý nền. {polls < 20 ? 'Đang theo dõi trạng thái tự động.' : 'Đã dừng theo dõi tự động; bạn có thể làm mới để kiểm tra tiếp.'}</p>}
      <RefreshButton label="Làm mới chi tiết" loading={detail.isFetching} disabled={verify.isPending} onClick={() => void refreshDetail()} />
      <p className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">{verifyNotice}</p>
      {(row.status === 'Succeeded' || row.status === 'Verified') && !confirm && <Button variant="outline" disabled={needsRefresh || detail.isFetching || verify.isPending} onClick={() => { verify.reset(); setConfirm(true); }}>Yêu cầu xác minh</Button>}
      {confirm && <div className="space-y-3 rounded-xl border border-slate-300 p-4"><h3 className="font-semibold">Xác nhận gửi yêu cầu kiểm tra tệp</h3><p className="text-sm text-slate-600">Thao tác có thể mất vài phút tùy kích thước tệp. Hãy giữ cửa sổ này mở trong lúc kiểm tra.</p><div className="flex flex-wrap gap-3"><Button variant="outline" disabled={verify.isPending} onClick={() => setConfirm(false)}>Hủy xác minh</Button><Button loading={verify.isPending} onClick={() => void verifyNow()}>Xác nhận yêu cầu</Button></div></div>}
      {verify.isPending && <p role="status" className="text-sm text-slate-600">Đang xác minh tệp sao lưu. Chưa có kết quả kiểm tra.</p>}
    </>}{verify.error && <p role="alert" className="text-sm text-red-800">{systemError(verify.error)} Không tự gửi lại yêu cầu; hãy đọc lại chi tiết trước khi thử tiếp.</p>}</div></Modal>;
}

export function SystemBackupsView() {
  const [filters, setFilters] = useState<OperationsFilters>({ ...emptyOperationsFilters });
  const [page, setPage] = useState(1);
  const [pageSize, setSize] = useState(20);
  const [create, setCreate] = useState(false);
  const [id, setId] = useState('');
  const query = { ...filters, page, pageSize };
  const list = useSystemAdministration('backups', query, signal => api.backups(query, signal));
  return <section className="admin-card min-w-0 space-y-5 p-4 sm:p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div className="space-y-2"><h2 className="text-lg font-bold">Sao lưu dữ liệu</h2><p className="max-w-2xl text-sm text-slate-600">Quản lý yêu cầu sao lưu theo từng dịch vụ. Xếp hàng thành công chưa có nghĩa bản sao lưu đã được tạo xong.</p></div><div className="flex flex-wrap gap-3"><RefreshButton label="Làm mới danh sách" loading={list.isFetching} onClick={() => void list.refetch()} /><Button size="toolbar" onClick={() => setCreate(true)}><Plus size={16} weight="bold" aria-hidden="true" />Tạo bản sao lưu</Button></div></div>
    <OperationsFilter backup services={[...new Set(list.data?.items.map(item => item.serviceName) ?? [])]} onApply={value => { setFilters(value); setPage(1); }} />
    <SystemRequestStatus pending={list.isPending} error={list.error} retry={() => void list.refetch()} />
    {!list.isError && list.data && <><div className="admin-table-wrap"><table><thead><tr><th>Dịch vụ</th><th>Trạng thái</th><th>Kích thước</th><th>Tạo lúc</th><th>Hoàn thành</th><th>Thao tác</th></tr></thead><tbody>{list.data.items.map(row => <tr key={row.id}><td>{serviceLabel(row.serviceName)}</td><td><OperationBadge status={row.status} backup /></td><td>{fileSize(row.sizeBytes)}</td><td className="whitespace-nowrap">{auditTime(row.createdAtUtc)}</td><td className="whitespace-nowrap">{auditTime(row.completedAtUtc)}</td><td><Button variant="outline" size="small" aria-label={`Chi tiết bản sao lưu ${row.id}`} onClick={() => setId(row.id)}>Chi tiết</Button></td></tr>)}</tbody></table></div>{list.data.items.length === 0 && <p className="py-5 text-center text-sm text-slate-600">Không có bản sao lưu phù hợp.</p>}<AuditPagination page={page} pageSize={pageSize} total={list.data.totalCount} busy={list.isFetching} onPage={setPage} onSize={value => { setSize(value); setPage(1); }} /></>}
    {create && <CreateBackupDialog services={list.data?.items.map(item => item.serviceName) ?? []} onClose={() => setCreate(false)} onCreated={value => { setCreate(false); setId(value); void list.refetch(); }} />}{id && <BackupDetail key={id} id={id} onClose={() => setId('')} />}
  </section>;
}
