import { useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Badge, Button, Input, Modal, TableSkeletonRows, toast } from '@/components/ui';
import { useAuthStore } from '@/stores/authStore';
import { useSystemAdministration } from '@/hooks/useSystemAdministration';
import { notificationAdminApi as api, notificationAdminError, deliveryStates, deliveryFilterSchema, deliveryReplaySchema, emptyDeliveryFilters, type DeliveryAdminDto, type DeliveryFilters } from '@/lib/api/notificationAdmin';
import { AuditMetadata, auditTime } from './SystemAuditShared';
import { copyToClipboard } from '@/lib/clipboard';

const channels: Record<string, string> = { EMAIL: 'Thư điện tử (Email)', IN_APP: 'Thông báo ứng dụng', SMS: 'Tin nhắn SMS (đã ngừng dùng)' };
function DeliveryStatus({ state }: { state: string }) {
  return <Badge variant={state === 'Sent' ? 'success' : state === 'Dead' || state === 'Blocked' ? 'danger' : state === 'Pending' || state === 'Dispatching' ? 'warning' : 'neutral'}>{deliveryStates[state as keyof typeof deliveryStates] ?? state}</Badge>;
}
function DeliveryError({ error, retry }: { error: unknown; retry?: () => void }) {
  return error ? <div role="alert" className="space-y-3 rounded-xl bg-red-50 p-4 text-sm text-red-900"><p>{notificationAdminError(error)}</p>{retry && <Button variant="outline" onClick={retry}>Thử lại</Button>}</div> : null;
}
function canReplay(row: DeliveryAdminDto) { return (row.state === 'Dead' || row.state === 'Blocked') && row.channel !== 'SMS'; }

function DeliveryDetail({ id, onClose }: { id: string; onClose: () => void }) {
  const [page, setPage] = useState(1);
  const detail = useSystemAdministration('delivery-detail', id, signal => api.get(id, signal));
  const audits = useSystemAdministration('delivery-audit', { id, page }, signal => api.audit(id, page, 20, signal));
  const row = !detail.isError ? detail.data : undefined;
  return <Modal open onOpenChange={open => { if (!open) onClose(); }} title="Chi tiết lượt phát thông báo" description="Chi tiết và lịch sử mới nhất của lượt phát."><div className="space-y-5 text-sm">
    {detail.isPending && <p role="status">Đang tải chi tiết…</p>}<DeliveryError error={detail.error} retry={() => void detail.refetch()} />
    {row && <AuditMetadata><div><dt>Mã lượt phát</dt><dd>{row.id}</dd></div><div><dt>Mã thông báo</dt><dd>{row.notificationId}</dd></div><div><dt>Kênh phát</dt><dd>{channels[row.channel] ?? row.channel}</dd></div><div><dt>Trạng thái</dt><dd><DeliveryStatus state={row.state} /></dd></div><div><dt>Số lần thử</dt><dd>{row.attempts}</dd></div><div><dt>Phiên bản</dt><dd>{row.revision}</dd></div><div><dt>Nhà cung cấp</dt><dd>{row.provider ?? 'Không có thông tin'}</dd></div><div><dt>Mã yêu cầu nhà cung cấp</dt><dd>{row.providerRequestId}</dd></div><div><dt>Mã tin nhắn nhà cung cấp</dt><dd>{row.externalMessageId ?? 'Chưa có'}</dd></div><div><dt>Đã gửi lúc</dt><dd>{auditTime(row.sentAt ?? null)}</dd></div><div><dt>Lần thử tiếp theo</dt><dd>{auditTime(row.nextAttemptAt)}</dd></div><div><dt>Cập nhật</dt><dd>{auditTime(row.updatedAt)}</dd></div><div><dt>Mã lỗi</dt><dd>{row.errorCode ?? 'Không có'}</dd></div></AuditMetadata>}
    <section className="space-y-3"><h3 className="font-semibold">Lịch sử kiểm toán</h3>{audits.isPending && <p role="status">Đang tải lịch sử…</p>}<DeliveryError error={audits.error} retry={() => void audits.refetch()} />{!audits.isError && audits.data && <>{audits.data.map(audit => <article key={audit.id} className="space-y-2 rounded-xl border border-slate-200 p-3"><p className="font-semibold">{audit.action === 'REPLAY' ? 'Yêu cầu gửi lại' : audit.action} · {auditTime(audit.createdAt)}</p><p>{deliveryStates[audit.beforeState as keyof typeof deliveryStates] ?? audit.beforeState} → {deliveryStates[audit.afterState as keyof typeof deliveryStates] ?? audit.afterState}</p><p className="break-words">Lý do: {audit.reason}</p><p className="break-all text-slate-600">Người thực hiện: {audit.actorId}</p></article>)}{!audits.data.length && <p>Chưa có bản ghi trên trang này.</p>}<div className="flex flex-wrap items-center gap-3"><span>Trang lịch sử {page}</span><Button variant="outline" size="small" disabled={page <= 1 || audits.isFetching} onClick={() => setPage(value => value - 1)}>Lịch sử trước</Button><Button variant="outline" size="small" disabled={audits.data.length < 20 || page >= 1000000 || audits.isFetching} onClick={() => setPage(value => value + 1)}>Lịch sử sau</Button></div><p className="text-slate-600">Mỗi trang hiện tối đa 20 dòng lịch sử.</p></>}</section>
  </div></Modal>;
}

function ReplayDialog({ id, onClose }: { id: string; onClose: () => void }) {
  const userId = useAuthStore(state => state.user?.id);
  const cache = useQueryClient();
  const detail = useSystemAdministration('delivery-replay-detail', id, signal => api.get(id, signal));
  const form = useForm<{ reason: string; acknowledgeDuplicateRisk: boolean }>({ resolver: zodResolver(deliveryReplaySchema), defaultValues: { reason: '', acknowledgeDuplicateRisk: false } });
  const lock = useRef(false);
  const [needsRead, setNeedsRead] = useState(false);
  const replay = useMutation({ mutationFn: (input: { reason: string; acknowledgeDuplicateRisk: boolean }) => {
    const current = detail.data;
    if (!current || !canReplay(current)) throw new Error('Lượt phát không còn ở trạng thái có thể gửi lại.');
    return api.replay(id, { ...input, expectedRevision: current.revision });
  }, retry: false });
  async function send(input: { reason: string; acknowledgeDuplicateRisk: boolean }) {
    if (lock.current || needsRead) return;
    const currentUser = useAuthStore.getState().user;
    if (!currentUser || currentUser.id !== userId || !currentUser.roles.includes('IT_ADMIN') || !currentUser.permissions.includes('notifications.deliveries.manage')) return;
    lock.current = true;
    try {
      await replay.mutateAsync(input);
      if (useAuthStore.getState().user?.id !== userId) return;
      toast.info('Đã xếp hàng gửi lại. Chưa có xác nhận thông báo đã tới người nhận.'); onClose();
    } catch { setNeedsRead(true); }
    finally {
      if (useAuthStore.getState().user?.id === userId) await cache.invalidateQueries({ predicate: query => query.queryKey[0] === 'system-administration' && query.queryKey[1] === userId && String(query.queryKey[2]).startsWith('delivery-') && query.queryKey[2] !== 'delivery-replay-detail' });
      lock.current = false;
    }
  }
  const ready = !detail.isError && !detail.isFetching && !!detail.data && canReplay(detail.data);
  return <Modal open onOpenChange={open => { if (!open && !replay.isPending) onClose(); }} title="Thử gửi lại thông báo" description="Chỉ gửi lại lượt phát đã ngừng thử hoặc bị chặn, không hỗ trợ kênh SMS."><form noValidate onSubmit={form.handleSubmit(send)} className="space-y-4"><div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"><h3 className="font-bold">Cảnh báo gửi lặp thông báo</h3><p>Nếu người nhận đã nhận được thông báo trước đó, thao tác này có thể gửi thêm một thông báo tương tự.</p></div>
    {detail.isFetching && <p role="status">Đang đọc trạng thái mới nhất…</p>}<DeliveryError error={detail.error} retry={() => void detail.refetch()} />{detail.data && !detail.isError && <p className="text-sm">Trạng thái hiện tại: {deliveryStates[detail.data.state as keyof typeof deliveryStates] ?? detail.data.state}</p>}{!ready && !detail.isFetching && !detail.isError && <p role="alert">Lượt phát này không đủ điều kiện gửi lại.</p>}
    <fieldset disabled={replay.isPending} className="space-y-4"><Input label="Lý do gửi lại" required {...form.register('reason')} error={form.formState.errors.reason?.message} hint="5–500 ký tự, không xuống dòng hoặc dùng ký tự điều khiển." /><label className="flex gap-3 text-sm"><input type="checkbox" {...form.register('acknowledgeDuplicateRisk')} aria-invalid={!!form.formState.errors.acknowledgeDuplicateRisk} aria-describedby="replay-ack-error" />Tôi hiểu và xác nhận rủi ro gửi trùng thông báo.</label>{form.formState.errors.acknowledgeDuplicateRisk && <p id="replay-ack-error" role="alert" className="text-sm text-red-800">{form.formState.errors.acknowledgeDuplicateRisk.message}</p>}</fieldset>
    <DeliveryError error={replay.error} />{needsRead && <div className="space-y-3 text-sm"><p>Kết quả gửi có thể đã được lưu. Đọc lại trạng thái và kiểm tra lịch sử trước khi chủ động gửi tiếp. Lý do đã nhập được giữ lại.</p><Button variant="outline" loading={detail.isFetching} onClick={async () => { const result = await detail.refetch(); if (!result.isError) { setNeedsRead(false); replay.reset(); } }}>Đọc lại lượt phát</Button></div>}
    <div className="flex flex-wrap justify-end gap-3"><Button variant="outline" disabled={replay.isPending} onClick={onClose}>Hủy bỏ</Button><Button type="submit" loading={replay.isPending} disabled={!ready || needsRead}>Xác nhận gửi lại</Button></div></form></Modal>;
}

export function NotificationDeliveriesView() {
  const user = useAuthStore(state => state.user);
  const allowed = !!user?.roles.includes('IT_ADMIN') && user.permissions.includes('notifications.deliveries.read');
  const manage = allowed && !!user?.permissions.includes('notifications.deliveries.manage');
  const [filters, setFilters] = useState<DeliveryFilters>({ ...emptyDeliveryFilters });
  const [page, setPage] = useState(1);
  const [id, setId] = useState('');
  const [replayId, setReplayId] = useState('');
  const form = useForm<DeliveryFilters>({ resolver: zodResolver(deliveryFilterSchema), defaultValues: emptyDeliveryFilters });
  const query = { ...filters, page, pageSize: 15 };
  const list = useSystemAdministration('delivery-list', query, signal => api.list(query, signal), allowed);
  if (!allowed) return <p role="alert">Bạn cần vai trò quản trị và quyền đọc lịch sử phát thông báo để sử dụng chức năng này.</p>;
  return <section className="admin-card min-w-0 space-y-5 p-4 sm:p-6"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-bold">Lịch sử phát thông báo</h2><Button variant="outline" loading={list.isFetching} onClick={() => void list.refetch()}>Làm mới</Button></div>
    <form noValidate onSubmit={form.handleSubmit(value => { setFilters(value); setPage(1); })} className="space-y-4"><div className="grid gap-4 sm:grid-cols-2"><div className="grid gap-2"><label htmlFor="delivery-state" className="text-sm font-semibold">Trạng thái lượt phát</label><select id="delivery-state" {...form.register('state')} className="min-h-12 rounded-xl border border-slate-300 bg-white px-3 text-base"><option value="">Nhóm cần xử lý (mặc định)</option>{Object.entries(deliveryStates).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div><div className="grid gap-2"><label htmlFor="delivery-channel" className="text-sm font-semibold">Kênh thông báo</label><select id="delivery-channel" {...form.register('channel')} className="min-h-12 rounded-xl border border-slate-300 bg-white px-3 text-base"><option value="">Tất cả kênh</option>{Object.entries(channels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div><Input label="Mã thông báo" {...form.register('notificationId')} error={form.formState.errors.notificationId?.message} hint="Mã GUID, để trống nếu không lọc." /><Input label="Mã tin nhắn nhà cung cấp" {...form.register('externalMessageId')} error={form.formState.errors.externalMessageId?.message} /></div><div className="flex flex-wrap gap-3"><Button type="submit">Áp dụng</Button><Button variant="outline" onClick={() => { form.reset(emptyDeliveryFilters); setFilters({ ...emptyDeliveryFilters }); setPage(1); }}>Xóa bộ lọc</Button></div><p className="text-sm text-slate-600">Khi chưa chọn trạng thái, hệ thống chỉ hiển thị nhóm cần xử lý: ngừng thử, bị chặn, không xác định và đang điều phối.</p></form>
    <DeliveryError error={list.error} retry={() => void list.refetch()} /><div className="admin-table-wrap overflow-x-auto"><table className="w-full text-left text-sm [&_th]:whitespace-nowrap [&_th]:p-3 [&_td]:p-3 [&_tr]:border-b [&_tr]:border-slate-100"><thead><tr><th>Mã lượt phát</th><th>Kênh</th><th>Trạng thái</th><th>Số lần thử</th><th>Cập nhật</th><th>Mã lỗi</th><th>Thao tác</th></tr></thead><tbody>{list.isPending ? <TableSkeletonRows columns={7} rows={5} columnWidths={['w-32', 'w-32', 'w-28', 'w-12', 'w-32', 'w-32', 'w-28']} /> : !list.isError && list.data?.items.map(row => <tr key={row.id}><td><span title={row.id}>{row.id.slice(0, 8)}...</span><Button variant="ghost" size="small" aria-label={`Sao chép mã lượt phát ${row.id}`} onClick={() => void copyToClipboard(row.id, 'Đã sao chép mã lượt phát.')}>Sao chép</Button></td><td>{channels[row.channel] ?? row.channel}</td><td><DeliveryStatus state={row.state} /></td><td>{row.attempts}</td><td className="whitespace-nowrap">{auditTime(row.updatedAt)}</td><td className="max-w-48 break-words">{row.errorCode ?? 'Không có'}</td><td><div className="flex gap-2"><Button variant="outline" size="small" aria-label={`Chi tiết lượt phát ${row.id}`} onClick={() => setId(row.id)}>Chi tiết</Button>{manage && canReplay(row) && <Button variant="outline" size="small" aria-label="Replay" onClick={() => setReplayId(row.id)}>Gửi lại</Button>}</div></td></tr>)}</tbody></table></div>
    {!list.isError && list.data && <>{!list.data.items.length && <p className="py-5 text-center text-sm text-slate-600">Không có lượt phát phù hợp.</p>}<div className="flex flex-wrap items-center justify-between gap-3 text-sm"><p>Trang {page} · Tổng {list.data.total} lượt phát</p><div className="flex gap-3"><Button variant="outline" disabled={page <= 1 || list.isFetching} onClick={() => setPage(value => value - 1)}>Trước</Button><Button variant="outline" disabled={page * 15 >= list.data.total || list.isFetching} onClick={() => setPage(value => value + 1)}>Sau</Button></div></div></>}
    {id && <DeliveryDetail key={id} id={id} onClose={() => setId('')} />}{replayId && manage && <ReplayDialog key={replayId} id={replayId} onClose={() => setReplayId('')} />}
  </section>;
}
