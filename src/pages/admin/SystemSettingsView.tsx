import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Input, Modal, toast, RefreshButton, textareaClass } from '@/components/ui';
import { useSystemAdministration } from '@/hooks/useSystemAdministration';
import { useAuthStore } from '@/stores/authStore';
import { settingFormSchema, settingKey, systemAdministrationApi as api, systemError, systemErrorCode, type SettingForm, type SystemSetting } from '@/lib/api/systemAdministration';
import { auditTime, SystemRequestStatus } from './SystemAuditShared';

function SettingEditor({ initial, onSaved, onBusy }: { initial: SystemSetting; onSaved: () => void; onBusy: (busy: boolean) => void }) {
  const [snapshot, setSnapshot] = useState(initial);
  const [needsRead, setNeedsRead] = useState(false);
  const [reading, setReading] = useState(false);
  const [readError, setReadError] = useState<unknown>(null);
  const [pendingFocus, setPendingFocus] = useState<'value' | 'reason' | null>(null);
  const lock = useRef(false);
  const userId = useAuthStore(state => state.user?.id);
  const cache = useQueryClient();
  const form = useForm<SettingForm>({ resolver: zodResolver(settingFormSchema), defaultValues: { value: String(initial.value), reason: '' } });
  const mutation = useMutation({ mutationFn: api.update, retry: false });
  const reason = form.watch('reason');
  useEffect(() => {
    if (!pendingFocus || mutation.isPending || reading) return;
    const timer = window.setTimeout(() => { form.setFocus(pendingFocus); setPendingFocus(null); }, 0);
    return () => window.clearTimeout(timer);
  }, [pendingFocus, mutation.isPending, reading, form]);
  async function invalidate() {
    await cache.invalidateQueries({ predicate: query => query.queryKey[0] === 'system-administration'
      && query.queryKey[1] === userId && query.queryKey[2] !== 'setting' });
  }
  async function save(values: SettingForm) {
    if (lock.current || needsRead || useAuthStore.getState().user?.id !== userId || !useAuthStore.getState().user?.roles.includes('IT_ADMIN')) return;
    lock.current = true; onBusy(true); setPendingFocus(null);
    try {
      await mutation.mutateAsync({ value: Number(values.value), reason: values.reason, expectedVersion: snapshot.version });
      if (useAuthStore.getState().user?.id !== userId) return;
      await invalidate();
      toast.success('Đã lưu cấu hình hệ thống.'); onSaved();
    } catch (error) {
      if (useAuthStore.getState().user?.id !== userId) return;
      const uncertain = !axios.isAxiosError(error) || !error.response || error.response.status >= 500;
      setNeedsRead(uncertain || systemErrorCode(error) === 'system.setting_conflict' || axios.isAxiosError(error) && error.response?.status === 409);
      if (axios.isAxiosError(error) && error.response?.data?.errors) {
        for (const [key, messages] of Object.entries(error.response.data.errors)) {
          const field = key.replace(/^\$\./, '').toLowerCase();
          if ((field === 'value' || field === 'reason') && Array.isArray(messages)) {
            form.setError(field, { message: messages.filter(item => typeof item === 'string').join(' ') || 'Vui lòng kiểm tra thông tin.' });
            setPendingFocus(current => current ?? field);
          }
        }
      }
      await invalidate();
    } finally { lock.current = false; onBusy(false); }
  }
  async function readLatest() {
    if (lock.current) return;
    lock.current = true; setReading(true); setReadError(null); onBusy(true);
    try {
      const latest = await api.setting();
      if (useAuthStore.getState().user?.id !== userId) return;
      setSnapshot(latest); setNeedsRead(false); mutation.reset();
      toast.info('Đã đọc cấu hình mới nhất. Kiểm tra giá trị đang nhập trước khi lưu lại.');
    } catch (error) { setReadError(error); }
    finally { lock.current = false; setReading(false); onBusy(false); }
  }
  return <form noValidate onSubmit={form.handleSubmit(save)} className="space-y-4">
    <p className="rounded-xl bg-slate-50 p-3 text-sm">Giá trị đang đối chiếu: <strong>{snapshot.value} ngày</strong> · Phiên bản {snapshot.version}. Thay đổi áp dụng cho lần tổng hợp tiếp theo.</p>
    <fieldset disabled={mutation.isPending || reading} className="space-y-4">
      <Input label="Số ngày mới" type="number" min={1} max={366} step={1} required {...form.register('value')} error={form.formState.errors.value?.message} hint="Số nguyên từ 1 đến 366 ngày, tính cả ngày hiện tại." />
      <div className="grid gap-2"><label htmlFor="system-setting-reason" className="text-sm font-semibold">Lý do thay đổi <span aria-hidden="true">*</span></label><textarea id="system-setting-reason" rows={4} required {...form.register('reason')} aria-invalid={!!form.formState.errors.reason} aria-describedby="system-setting-reason-help system-setting-reason-error" className={textareaClass} /><p id="system-setting-reason-help" className="text-sm text-slate-600">{reason.trim().length}/500 ký tự · Từ 3 đến 500 ký tự sau khi bỏ khoảng trắng đầu và cuối.</p>{form.formState.errors.reason && <p role="alert" id="system-setting-reason-error" className="text-sm text-red-800">{form.formState.errors.reason.message}</p>}</div>
    </fieldset>
    {mutation.error && <p role="alert" className="text-sm text-red-800">{systemError(mutation.error)}</p>}
    {needsRead && <div className="space-y-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950"><p>Cần đọc lại cấu hình và kiểm tra lịch sử trước khi lưu tiếp. Nếu kết nối gián đoạn, thay đổi có thể đã được lưu. Nội dung bạn nhập vẫn được giữ để đối chiếu.</p><Button variant="outline" loading={reading} onClick={() => void readLatest()}>Đọc lại cấu hình</Button></div>}
    {!!readError && <p role="alert" className="text-sm text-red-800">{systemError(readError)}</p>}
    <div className="flex flex-wrap justify-end gap-3"><Button variant="outline" disabled={mutation.isPending || reading} onClick={onSaved}>Hủy</Button><Button type="submit" loading={mutation.isPending} disabled={needsRead || reading}>Lưu thay đổi</Button></div>
  </form>;
}

function SettingDialog({ onClose }: { onClose: () => void }) {
  const detail = useSystemAdministration('setting', settingKey, signal => api.setting(signal));
  const [busy, setBusy] = useState(false);
  return <Modal open onOpenChange={open => { if (!open && !busy) onClose(); }} title="Chỉnh sửa cấu hình thống kê" description="Điều chỉnh số ngày tác vụ định kỳ tổng hợp lại dữ liệu; không tự chạy tác vụ ngay.">
    <SystemRequestStatus pending={detail.isPending || detail.isFetching} error={detail.error} retry={() => void detail.refetch()} />
    {!detail.isFetching && !detail.isError && detail.data && <SettingEditor initial={detail.data} onSaved={onClose} onBusy={setBusy} />}
  </Modal>;
}

export function SystemSettingsView({ onHistory }: { onHistory: () => void }) {
  const settings = useSystemAdministration('settings', null, signal => api.settings(signal));
  const [editing, setEditing] = useState(false);
  return <section className="admin-card min-w-0 space-y-5 p-4 sm:p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div className="max-w-2xl space-y-2"><h2 className="text-lg font-bold">Tham số vận hành</h2><p className="text-sm text-slate-600">Số ngày tổng hợp lại thống kê là khoảng dữ liệu mà tác vụ định kỳ đọc lại, tính cả ngày hiện tại. Tham số này không thay đổi thời gian lưu nhật ký hoặc hồ sơ.</p></div><RefreshButton loading={settings.isFetching} onClick={() => void settings.refetch()} /></div>
    <SystemRequestStatus pending={settings.isPending} fetching={settings.isFetching} error={settings.error} retry={() => void settings.refetch()} />
    {!settings.isError && settings.data && <div className="admin-table-wrap"><table><thead><tr><th>Tham số</th><th>Giá trị hiện tại</th><th>Phiên bản</th><th>Cập nhật gần nhất</th><th>Thao tác</th></tr></thead><tbody>{settings.data.map(row => <tr key={row.key}><td className="min-w-56"><p className="font-semibold">Số ngày tổng hợp lại thống kê</p><p className="mt-1 text-slate-600">{row.key}</p></td><td className="whitespace-nowrap">{row.value} ngày</td><td>{row.version}</td><td className="min-w-48">{row.updatedAtUtc ? <><p>{auditTime(row.updatedAtUtc)}</p><p className="mt-1 break-all text-slate-600">{row.updatedBy ?? 'Không có thông tin người cập nhật'}</p></> : 'Đang dùng giá trị mặc định'}</td><td><Button variant="outline" size="small" onClick={() => setEditing(true)}>Chỉnh sửa</Button></td></tr>)}</tbody></table>{settings.data.length === 0 && <p className="py-5 text-center">Chưa có tham số cấu hình.</p>}</div>}
    <Button variant="outline" onClick={onHistory}>Xem lịch sử thay đổi</Button>
    {editing && <SettingDialog onClose={() => setEditing(false)} />}
  </section>;
}
