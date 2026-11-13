import { useEffect, useState } from 'react';
import { Plus } from '@phosphor-icons/react';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Modal } from '@/components/ui';
import { workScheduleApi, type WeekEntry } from '@/lib/api/workSchedules';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { OperationError, QueryState, fieldClass, useStaffDirectory, useStaffOperation, useStaffQuery } from './shared';

const time = z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/);
const schema = z.object({ entries: z.array(z.object({ day: z.number().int().min(0).max(6), start: time, end: time, officerId: z.guid() })).max(200) }).superRefine((v, ctx) => {
  v.entries.forEach((r, i) => { if (r.start.padEnd(8, ':00') === r.end.padEnd(8, ':00')) ctx.addIssue({ code: 'custom', path: ['entries', i, 'end'], message: 'Giờ bắt đầu và kết thúc phải khác nhau.' }); });
});
const days = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
export function ScheduleWeekPattern({ onClose }: { onClose: () => void }) {
  const query = useStaffQuery(['week-pattern'], signal => workScheduleApi.week(signal));
  const [dirty, setDirty] = useState(false), [busy, setBusy] = useState(false);
  const guard = useUnsavedChanges(dirty, busy);
  return <Modal open title="Giờ làm lặp lại hằng tuần" description="Dùng khi nhiều tuần có cùng giờ làm. Lưu thiết lập ở đây chưa thay đổi lịch của cán bộ." className="sm:max-w-4xl" onOpenChange={v => !v && guard.requestClose(onClose)}><QueryState query={query} />{query.data && <Fields entries={query.data.entries} version={query.data.version} onClose={onClose} onDirty={setDirty} onBusy={setBusy} />}{guard.confirmation}</Modal>;
}
function Fields({ entries, version, onClose, onDirty, onBusy }: { entries: WeekEntry[]; version: number; onClose: () => void; onDirty: (dirty: boolean) => void; onBusy: (busy: boolean) => void }) {
  const [baseVersion] = useState(version);
  const directory = useStaffDirectory(true), operation = useStaffOperation();
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), defaultValues: { entries } });
  const array = useFieldArray({ control: form.control, name: 'entries' });
  useEffect(() => onDirty(form.formState.isDirty), [form.formState.isDirty, onDirty]);
  useEffect(() => onBusy(operation.busy), [operation.busy, onBusy]);
  const submit = form.handleSubmit(async v => { await operation.run(() => workScheduleApi.saveWeek(baseVersion, v.entries.map(e => ({ ...e, start: e.start.length === 5 ? e.start + ':00' : e.start, end: e.end.length === 5 ? e.end + ':00' : e.end }))), onClose); });
  return <form onSubmit={e => void submit(e)} noValidate className="space-y-4"><QueryState query={directory} /><fieldset disabled={operation.busy || operation.review} className="space-y-3">{array.fields.map((row, i) => <div key={row.id} className="staff-editor-row"><label className="staff-field">Cán bộ<select className={fieldClass} {...form.register(`entries.${i}.officerId`)}><option value="">Chọn cán bộ</option>{directory.data?.filter(o => o.isActive && o.roles.includes('FRONT_DESK_OFFICER') && !o.roles.includes('MANAGER')).map(o => <option key={o.id} value={o.id}>{o.fullName || o.username}</option>)}</select></label><label className="staff-field">Ngày<select className={fieldClass} {...form.register(`entries.${i}.day`, { valueAsNumber: true })}>{days.map((d, value) => <option key={d} value={value}>{d}</option>)}</select></label><label className="staff-field">Từ giờ<input type="time" step="1" className={fieldClass} {...form.register(`entries.${i}.start`)} /></label><label className="staff-field">Đến giờ<input type="time" step="1" className={fieldClass} {...form.register(`entries.${i}.end`)} /></label><Button type="button" variant="outline" aria-label={`Xóa dòng ${i + 1}`} onClick={() => array.remove(i)}>Xóa</Button></div>)}<Button type="button" variant="outline" disabled={array.fields.length >= 200} onClick={() => array.append({ day: 1, start: '08:00:00', end: '17:00:00', officerId: '' })}><Plus size={16} weight="bold" aria-hidden="true" />Thêm giờ làm</Button></fieldset>{form.formState.errors.entries && <p role="alert" className="text-sm text-red-800">Kiểm tra cán bộ, ngày và giờ; tối đa 200 dòng, giờ đầu/cuối phải khác nhau.</p>}<OperationError operation={operation} /><Button type="submit" disabled={operation.busy || operation.review || directory.isError || directory.isPending}>Lưu thiết lập</Button></form>;
}
