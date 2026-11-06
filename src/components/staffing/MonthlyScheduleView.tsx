import { useEffect, useRef, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Modal } from '@/components/ui';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { workScheduleApi, type ScheduleDayOff, type ScheduleRevision, type ScheduleSlot } from '@/lib/api/workSchedules';
import { staffingApi } from '@/lib/api/staffing';
import { calendarDate, calendarDays, replaceScheduleDays, sameDaysOff, sameSchedule, scheduleDay, scheduleTime } from '@/lib/scheduleCalendar';
import { validatePeriod, vietnamIso, vietnamLocal } from '@/lib/staffingValidation';
import { OperationError, QueryState, StaffPeriod, fieldClass, useStaffAccess, useStaffDirectory, useStaffOperation, useStaffQuery } from './shared';
import { ScheduleWeekPattern } from './ScheduleWeekPattern';

type MonthData = Awaited<ReturnType<typeof workScheduleApi.month>> & { carry?: ScheduleSlot[] };
const weekdays = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ nhật'];
const currentMonth = () => vietnamLocal(new Date().toISOString()).slice(0, 7);
const nextDate = (day: string) => new Date(Date.parse(day + 'T12:00:00Z') + 86400000).toISOString().slice(0, 10);

export function MonthlyScheduleView({ onRequestChange }: { onRequestChange: (slot: ScheduleSlot) => void }) {
  const { manager, user } = useStaffAccess();
  const directory = useStaffDirectory(manager);
  const [officerId, setOfficer] = useState(manager ? '' : user!.id);
  const [month, setMonth] = useState(currentMonth);
  const [generation, setGeneration] = useState(0);
  const [dirty, setDirty] = useState(false), [busy, setBusy] = useState(false);
  const guard = useUnsavedChanges(dirty, busy);
  const officers = directory.data?.filter(o => o.isActive && o.roles.includes('FRONT_DESK_OFFICER') && !o.roles.includes('MANAGER')) || [];
  const name = (id: string) => directory.data?.find(o => o.id === id)?.fullName || directory.data?.find(o => o.id === id)?.username || (id === user?.id ? 'Bạn' : id);
  const change = (action: () => void) => guard.requestClose(() => { setDirty(false); action(); });
  const move = (delta: number) => {
    const value = new Date(Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5, 7)) - 1 + delta, 1)).toISOString().slice(0, 7);
    if (value >= '2000-01' && value <= '2099-12') change(() => setMonth(value));
  };
  return <div className="space-y-5">
    <div className="schedule-controls">
      {manager && <label className="staff-field">1. Chọn cán bộ<select className={fieldClass} value={officerId} disabled={busy || directory.isPending || directory.isError} onChange={e => change(() => setOfficer(e.target.value))}><option value="">Chọn cán bộ cần xếp lịch</option>{officers.map(o => <option key={o.id} value={o.id}>{o.fullName || o.username}</option>)}</select></label>}
      <div className="staff-field"><span>{manager ? '2. Chọn tháng' : 'Tháng làm việc'}</span><div className="flex gap-2"><select aria-label="Tháng làm việc" className={fieldClass} value={month.slice(5, 7)} disabled={busy || !officerId} onChange={e => { const value = e.target.value; change(() => setMonth(month.slice(0, 5) + value)); }}>{Array.from({ length: 12 }, (_, i) => <option key={i} value={String(i + 1).padStart(2, '0')}>Tháng {i + 1}</option>)}</select><select aria-label="Năm làm việc" className={fieldClass} value={month.slice(0, 4)} disabled={busy || !officerId} onChange={e => { const value = e.target.value; change(() => setMonth(value + month.slice(4))); }}>{Array.from({ length: 100 }, (_, i) => <option key={i} value={2000 + i}>{2000 + i}</option>)}</select></div></div>
      <Button variant="outline" disabled={!officerId || busy} onClick={() => change(() => setGeneration(g => g + 1))}>Lấy lịch mới</Button>
    </div>
    {manager && <QueryState query={directory} />}
    {!officerId ? <div className="staff-state"><p className="font-semibold">Chọn cán bộ để xem và xếp lịch tháng.</p><p>Mặc định là ngày làm. Tick Nghỉ để chọn ngày nghỉ; bấm ngày làm để đặt giờ.</p></div> : <CalendarLoader key={`${officerId}:${month}:${generation}`} officerId={officerId} month={month + '-01'} name={name} onDirty={setDirty} onBusy={setBusy} onRequestChange={onRequestChange} onPublished={() => { setDirty(false); setBusy(false); setGeneration(g => g + 1); }} move={move} />}
    {guard.confirmation}
  </div>;
}

function CalendarLoader(props: BoardProps & { month: string }) {
  const query = useStaffQuery(['month', props.month], async signal => {
    const start = vietnamIso(props.month + 'T00:00');
    const [data, shifts] = await Promise.all([workScheduleApi.month(props.month, signal), staffingApi.shifts(start, vietnamIso(nextDate(props.month) + 'T00:00'), signal)]);
    // Previous-month overnight shifts are context only; never include them in this month's save payload.
    const carry = shifts.filter(s => !s.cancelledAtUtc && Date.parse(s.startsAtUtc) < Date.parse(start) && Date.parse(s.endsAtUtc) > Date.parse(start)).map(s => {
      if (s.version === undefined) throw new Error('Ca từ tháng trước thiếu phiên bản. Vui lòng lấy lịch mới.');
      return { shiftId: s.id, officerId: s.officerId, startsAt: s.startsAtUtc, endsAt: s.endsAtUtc, shiftVersion: s.version };
    });
    return { ...data, carry };
  });
  const [ready, setReady] = useState(false);
  useEffect(() => { if (query.isFetchedAfterMount && !query.isError) setReady(true); }, [query.isFetchedAfterMount, query.isError]);
  // Start from a fresh response, but keep the editor mounted if a later background read fails.
  return <><QueryState query={{ ...query, isPending: !ready && !query.isError }} />{ready && query.data && <CalendarBoard {...props} initial={query.data} />}</>;
}
type BoardProps = { officerId: string; month: string; name: (id: string) => string; onDirty: (v: boolean) => void; onBusy: (v: boolean) => void; onPublished: () => void; onRequestChange: (s: ScheduleSlot) => void; move: (n: number) => void };
function CalendarBoard({ initial, officerId, month, name, onDirty, onBusy, onPublished, onRequestChange, move }: BoardProps & { initial: MonthData }) {
  const { manager, officer, can, user } = useStaffAccess();
  const [base] = useState(initial);
  const [useOfficial, setUseOfficial] = useState(false), [resetDraft, setResetDraft] = useState(false);
  const stale = Boolean(base.draft && base.draft.baseFingerprint !== base.baseFingerprint && !useOfficial);
  const [editing, setEditing] = useState(!base.isPublished);
  const source = manager && editing && base.draft && !stale && !useOfficial ? base.draft.slots : base.slots;
  const sourceDays = manager && editing && base.draft && !stale && !useOfficial ? base.draft.daysOff : base.daysOff;
  const withinDeadline = base.canEdit && (!base.isPublished || Date.now() <= Date.parse(base.editDeadlineUtc));
  const draftRef = useRef<ScheduleRevision | null>(base.draft);
  const [persisted, setPersisted] = useState({ slots: source, daysOff: sourceDays });
  const [changes, setChanges] = useState(new Map<string, ScheduleSlot[]>());
  const [restDays, setRestDays] = useState(new Set(sourceDays.filter(d => d.officerId === officerId).map(d => d.date)));
  const restBackup = useRef(new Map<string, ScheduleSlot[]>());
  const [selected, setSelected] = useState<string>();
  const [viewDay, setViewDay] = useState<string>();
  const [editor, setEditor] = useState<string>();
  const [confirm, setConfirm] = useState(false), [ack, setAck] = useState(false), [allowClosure, setAllowClosure] = useState(false);
  const [reason, setReason] = useState(`Xếp lịch tháng ${month.slice(5, 7)}/${month.slice(0, 4)} cho ${name(officerId)}`);
  const [week, setWeek] = useState(false), [history, setHistory] = useState(false), [copyFrom, setCopyFrom] = useState('');
  const operation = useStaffOperation();
  const saved = useRef<{ revisionId: string; expectedVersion: number; allowClosure: boolean; reason: string } | null>(null);
  const attempted = useRef(false);
  const slots = [...source.filter(s => s.officerId !== officerId || !changes.has(scheduleDay(s.startsAt))), ...Array.from(changes.values()).flat()];
  const personal = slots.filter(s => s.officerId === officerId);
  const daysOff: ScheduleDayOff[] = [...sourceDays.filter(d => d.officerId !== officerId), ...Array.from(restDays).map(date => ({ officerId, date }))];
  const dirty = !sameSchedule(slots, persisted.slots) || !sameDaysOff(daysOff, persisted.daysOff) || useOfficial;
  const days = calendarDays(month);
  const today = vietnamLocal(new Date().toISOString()).slice(0, 10);
  const daySlots = (day: string) => personal.filter(s => scheduleDay(s.startsAt) === day).sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt));
  const incoming = (day: string) => [...personal, ...(base.carry || []).filter(s => s.officerId === officerId)].filter(s => scheduleDay(s.startsAt) < day && Date.parse(s.endsAt) > Date.parse(day + 'T00:00:00+07:00'));
  const dayLeave = (day: string) => base.leaves.some(l => l.officerId === officerId && Date.parse(l.startsAtUtc) < Date.parse(nextDate(day) + 'T00:00:00+07:00') && Date.parse(l.endsAtUtc) > Date.parse(day + 'T00:00:00+07:00'));
  const fullDayLeave = (day: string) => base.leaves.some(l => l.officerId === officerId && Date.parse(l.startsAtUtc) <= Date.parse(day + 'T00:00:00+07:00') && Date.parse(l.endsAtUtc) >= Date.parse(nextDate(day) + 'T00:00:00+07:00'));
  const isRestDay = (day: string) => restDays.has(day) || fullDayLeave(day) || base.closures.some(c => c.closureDate === day);
  const locked = (day: string) => day < today || daySlots(day).some(s => Date.parse(s.startsAt) <= Date.now());
  const editable = manager && can('workflow.staffing.manage') && editing && withinDeadline && !operation.busy && !operation.review && !stale;
  const affected = Array.from(new Set([...base.slots, ...slots, ...base.daysOff, ...daysOff].map(s => s.officerId))).filter(id => !sameSchedule(base.slots.filter(s => s.officerId === id), slots.filter(s => s.officerId === id)) || !sameDaysOff(base.daysOff.filter(d => d.officerId === id), daysOff.filter(d => d.officerId === id)));
  const closureWork = slots.some(s => !base.slots.some(old => sameSchedule([old], [s])) && base.closures.some(c => c.closureDate >= scheduleDay(s.startsAt) && c.closureDate <= scheduleDay(new Date(Date.parse(s.endsAt) - 1).toISOString())));
  const describe = (s: ScheduleSlot) => `${calendarDate(scheduleDay(s.startsAt))} · ${scheduleTime(s.startsAt)}–${scheduleTime(s.endsAt)}${scheduleDay(s.endsAt) !== scheduleDay(s.startsAt) ? ' (qua ngày hôm sau)' : ''}`;
  useEffect(() => onDirty(dirty), [dirty, onDirty]);
  useEffect(() => onBusy(operation.busy), [operation.busy, onBusy]);
  const putDay = (day: string, rows: ScheduleSlot[]) => {
    setChanges(prev => { const next = new Map(prev); if (sameSchedule(source.filter(s => s.officerId === officerId && scheduleDay(s.startsAt) === day), rows)) next.delete(day); else next.set(day, rows); return next; });
    if (rows.length) setRestDays(prev => { const next = new Set(prev); next.delete(day); return next; });
    setEditor(undefined); setSelected(day);
  };
  const persistDraft = async (nextSlots: ScheduleSlot[], nextDays: ScheduleDayOff[]) => {
    const latest = await workScheduleApi.month(month);
    if (!latest.canEdit || (latest.isPublished && Date.now() > Date.parse(latest.editDeadlineUtc))) throw new Error('Lịch đã hết hạn sửa. Hãy lấy lịch mới.');
    if (latest.baseFingerprint !== base.baseFingerprint || (latest.draft?.version ?? 0) !== (draftRef.current?.version ?? 0) || latest.draft?.id !== draftRef.current?.id) throw new Error('Người khác vừa sửa lịch tháng này. Nội dung được giữ lại; hãy lấy lịch mới để đối chiếu.');
    if (draftRef.current && !useOfficial && sameSchedule(draftRef.current.slots, nextSlots) && sameDaysOff(draftRef.current.daysOff, nextDays) && draftRef.current.reason === reason.trim()) return draftRef.current;
    if (attempted.current) throw new Error('Chưa xác định lần lưu trước. Lấy lịch mới để kiểm tra bản đã lưu trên hệ thống.');
    attempted.current = true;
    const revision = await workScheduleApi.saveMonth(month, { expectedVersion: draftRef.current?.version ?? 0, baseFingerprint: base.baseFingerprint, slots: nextSlots, daysOff: nextDays, reason });
    draftRef.current = revision; attempted.current = false;
    setPersisted({ slots: nextSlots, daysOff: nextDays });
    return revision;
  };
  const toggleRest = (day: string, checked: boolean) => {
    if (!editable) return;
    const rows = checked ? [] : restBackup.current.get(day) || [];
    if (checked) restBackup.current.set(day, daySlots(day));
    else restBackup.current.delete(day);
    const nextSlots = replaceScheduleDays(slots, officerId, new Map([[day, rows]]));
    const nextDays = [...daysOff.filter(d => d.officerId !== officerId || d.date !== day), ...(checked ? [{ officerId, date: day }] : [])];
    putDay(day, rows);
    setRestDays(prev => { const next = new Set(prev); if (checked) next.add(day); else next.delete(day); return next; });
    void operation.run(() => persistDraft(nextSlots, nextDays));
  };
  const publish = () => operation.run(async () => {
    if (!saved.current && base.slots.some(old => Date.parse(old.startsAt) <= Date.now() && !slots.some(s => sameSchedule([old], [s])))) throw new Error('Có ca đã bắt đầu trong lúc chỉnh lịch. Lấy lịch mới để kiểm tra.');
    if (saved.current) {
      const latest = await workScheduleApi.month(month);
      if (!latest.draft && sameSchedule(latest.slots, slots) && sameDaysOff(latest.daysOff, daysOff)) return;
      if (latest.baseFingerprint !== base.baseFingerprint || latest.draft?.id !== saved.current.revisionId || latest.draft.version !== saved.current.expectedVersion) throw new Error('Lịch đã thay đổi. Chọn Lấy lịch mới để kiểm tra.');
    } else {
      const revision = await persistDraft(slots, daysOff);
      saved.current = { revisionId: revision.id, expectedVersion: revision.version, allowClosure, reason };
    }
    const receipt = await workScheduleApi.publish(month, saved.current!);
    if (!sameDaysOff(receipt.daysOff, daysOff)) throw new Error('Máy chủ chưa xác nhận đủ ngày nghỉ đã công bố. Lấy lịch mới để kiểm tra.');
  }, onPublished, true);
  const fill = (from?: string) => operation.run(async () => {
    const preview = await workScheduleApi.preview(month, from);
    if (preview.baseFingerprint !== base.baseFingerprint) throw new Error('Lịch chính thức đã thay đổi. Hãy lấy lịch mới.');
    if (preview.conflicts.length) throw new Error('Không thể điền giờ vì bản xem trước có xung đột. Kiểm tra thiết lập tuần hoặc tháng nguồn.');
    const grouped = new Map<string, ScheduleSlot[]>();
    preview.slots.filter(s => s.officerId === officerId && Date.parse(s.startsAt) > Date.now()).forEach(s => { const day = scheduleDay(s.startsAt); if (!locked(day)) grouped.set(day, [...(grouped.get(day) || []), s]); });
    // Utility only fills untouched empty days, never replaces a manually edited day.
    setChanges(prev => { const result = new Map(prev); for (const [day, rows] of grouped) if (!result.has(day) && !isRestDay(day) && !daySlots(day).length) result.set(day, rows); return result; });
  }, undefined, false, true);
  const padding = (new Date(month + 'T12:00:00Z').getUTCDay() + 6) % 7;
  return <div className="space-y-5">
    {manager && base.isPublished && <section className="staff-card space-y-3" aria-label="Trạng thái lịch"><h3>Lịch tháng đã công bố · {editing ? 'Đang sửa' : 'Chỉ xem'}</h3><p className="text-sm">Hạn sửa: {new Date(base.editDeadlineUtc).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hourCycle: 'h23' })} (giờ Việt Nam), đủ 24 giờ trước ngày 1.</p>{!withinDeadline ? <p className="text-sm text-red-800">Đã hết hạn sửa. Lịch tháng được khóa.</p> : !editing && can('workflow.staffing.manage') && <Button onClick={() => { const resume = base.draft && base.draft.baseFingerprint === base.baseFingerprint ? base.draft : base; setRestDays(new Set(resume.daysOff.filter(d => d.officerId === officerId).map(d => d.date))); setPersisted({ slots: resume.slots, daysOff: resume.daysOff }); setEditing(true); }}>Sửa lịch</Button>}{editing && <p className="text-sm">Sửa xong cần công bố lại để thông báo cho cán bộ.</p>}</section>}
    {stale && editing && withinDeadline && <div role="alert" className="staff-note"><p>Bản đang soạn trên hệ thống dựa trên lịch cũ. Bạn đang xem lịch chính thức; cần lập lại bản soạn trước khi sửa.</p><Button variant="outline" onClick={() => setResetDraft(true)}>Bắt đầu lại từ lịch chính thức</Button></div>}
    <div className="schedule-board">
      <div className="schedule-month-heading"><Button variant="outline" aria-label="Tháng trước" disabled={operation.busy || month === '2000-01-01'} onClick={() => move(-1)}>‹</Button><div><h3>Tháng {Number(month.slice(5, 7))} / {month.slice(0, 4)}</h3><p>{name(officerId)}</p></div><Button variant="outline" aria-label="Tháng sau" disabled={operation.busy || month === '2099-12-01'} onClick={() => move(1)}>›</Button></div>
      <p className="px-4 py-3 text-sm text-slate-600">{manager ? 'Không tick là ngày làm. Tick Nghỉ để chọn ngày nghỉ; bấm ngày để đặt giờ.' : 'Bấm ngày để xem giờ làm.'} Giờ Việt Nam, định dạng 24 giờ.</p>
      <div className="schedule-weekdays">{weekdays.map((day, i) => <div key={day}><span className="hidden sm:inline">{day}</span><span className="sm:hidden">{i === 6 ? 'CN' : `T${i + 2}`}</span></div>)}</div>
      <div className="schedule-grid" aria-label="Bảng lịch tháng">
        {Array.from({ length: padding }, (_, i) => <div key={`blank${i}`} className="schedule-blank" aria-hidden="true" />)}
        {days.map(day => { const rows = daySlots(day), prior = incoming(day), leave = dayLeave(day), closure = base.closures.some(c => c.closureDate === day), past = locked(day), rest = isRestDay(day); return <div key={day} className={`schedule-cell ${rest ? 'is-rest-day' : 'is-work-day'} ${selected === day ? 'is-selected' : ''} ${day === today ? 'is-today' : ''} ${past ? 'is-past' : ''}`}>
          <button type="button" className="schedule-date" aria-label={`Ngày ${calendarDate(day)}${(rows.length + prior.length) ? `, ${rows.length + prior.length} ca` : rest ? ', ngày nghỉ' : ', ngày làm, chưa đặt giờ'}`} aria-pressed={selected === day} onClick={() => { setSelected(day); if (editable && !past) setEditor(day); else setViewDay(day); }}><span className="schedule-number">{Number(day.slice(-2))}</span><span className="schedule-hours">{rows.map(s => <span key={s.shiftId} className="schedule-range"><span>{scheduleTime(s.startsAt)}</span><span className="schedule-range-separator">–</span><span>{scheduleTime(s.endsAt)}{scheduleDay(s.endsAt) !== day ? ' (+1)' : ''}</span></span>)}</span><span className={`schedule-label ${leave || closure ? 'has-event' : ''}`}>{leave ? 'Có nghỉ phép' : closure ? 'Nghỉ / lễ chung' : rest ? 'Ngày nghỉ' : rows.length ? `${rows.length} ca` : 'Chưa đặt giờ'}</span>{past && <span className="schedule-past">Chỉ xem</span>}</button>
          {!!prior.length && <span className="schedule-label has-event px-1">Có ca từ hôm trước</span>}
          {manager && <label className="schedule-rest"><input type="checkbox" aria-label={`Nghỉ ngày ${calendarDate(day)}`} checked={rest} disabled={!editable || past || !!prior.length || closure || fullDayLeave(day)} onChange={e => toggleRest(day, e.target.checked)} /><span>Nghỉ</span></label>}
        </div>; })}
        {Array.from({ length: (7 - ((padding + days.length) % 7)) % 7 }, (_, i) => <div key={`tail${i}`} className="schedule-blank" aria-hidden="true" />)}
      </div>
    </div>
    <p className="text-sm text-slate-600">Ngày làm màu xanh nhạt, ngày nghỉ / lễ màu đỏ nhạt. Ngày làm chưa đặt giờ chưa có ca chính thức. Ngày lễ chung và nghỉ phép cả ngày được đánh dấu theo hệ thống.</p>
    {manager && <p className="text-sm text-slate-600">Tick / bỏ tick Nghỉ được tự động lưu vào bản đang soạn. Cán bộ nhận lịch mới sau khi bạn công bố.</p>}
    {selected && !viewDay && <section className="staff-card space-y-3" aria-label="Chi tiết ngày"><h3>Ngày {calendarDate(selected)} · {name(officerId)}</h3>{locked(selected) && <p className="staff-note">Ngày đã qua hoặc có ca đã bắt đầu. Chỉ xem, không sửa hoặc xóa lịch sử.</p>}{[...incoming(selected), ...daySlots(selected)].length ? [...incoming(selected), ...daySlots(selected)].map(s => <div key={s.shiftId} className="space-y-2">{scheduleDay(s.startsAt) !== selected && <p className="text-sm">Ca từ ngày {calendarDate(scheduleDay(s.startsAt))}. Muốn sửa ca này, chọn ngày bắt đầu trên lịch.</p>}<StaffPeriod start={s.startsAt} end={s.endsAt} />{officer && can('workflow.leave.request') && Date.parse(s.startsAt) > Date.now() && <Button variant="outline" onClick={() => onRequestChange(s)}>Đề nghị đổi giờ ca</Button>}</div>) : <p>Không có ca làm trong ngày này.</p>}{editable && !locked(selected) && <Button variant="outline" onClick={() => setEditor(selected)}>Đặt giờ làm</Button>}</section>}
    <OperationError operation={operation} />
    {viewDay && <Modal open title={`Lịch ngày ${calendarDate(viewDay)}`} description={name(officerId)} onOpenChange={v => !v && setViewDay(undefined)}><div className="space-y-4">{locked(viewDay) && <p className="staff-note">Ngày đã qua hoặc có ca đã bắt đầu. Chỉ xem, không sửa hoặc xóa lịch sử.</p>}{dayLeave(viewDay) && <p>Có thời gian nghỉ phép đã được duyệt trong ngày.</p>}{base.closures.some(c => c.closureDate === viewDay) && <p>Ngày nghỉ / lễ chung của phường.</p>}{[...incoming(viewDay), ...daySlots(viewDay)].map(s => <div key={s.shiftId} className="space-y-2"><StaffPeriod start={s.startsAt} end={s.endsAt} />{officer && can('workflow.leave.request') && Date.parse(s.startsAt) > Date.now() && <Button variant="outline" onClick={() => { setViewDay(undefined); onRequestChange(s); }}>Đề nghị đổi giờ ca</Button>}</div>)}{!incoming(viewDay).length && !daySlots(viewDay).length && <p>Không có ca làm trong ngày này.</p>}</div></Modal>}
    {manager && can('workflow.staffing.manage') && <section className="schedule-publish" aria-label="Công bố lịch"><div><h3>Hoàn tất lịch tháng</h3><p>{personal.length} ca · {new Set(personal.map(s => scheduleDay(s.startsAt))).size} ngày làm việc của {name(officerId)}.</p><p>{affected.length ? `${affected.length} cán bộ có lịch thay đổi. Chưa gửi lịch mới cho cán bộ.` : 'Lịch đang hiển thị giống lịch đã công bố.'}</p></div><Button disabled={!editable || !affected.length} onClick={() => { setAck(false); setAllowClosure(false); setConfirm(true); }}>Xác nhận công bố lịch</Button>{operation.review && <p className="text-sm">Chưa xác nhận công bố thành công. Các giờ bạn chọn vẫn được giữ. {saved.current ? <Button variant="outline" disabled={operation.busy} onClick={() => void publish()}>Kiểm tra và thử công bố lại</Button> : 'Chọn Lấy lịch mới để kiểm tra bản đã lưu trên hệ thống trước khi tiếp tục.'}</p>}</section>}
    {officer && can('workflow.leave.request') && <Button disabled={operation.busy || operation.review || (!personal.length && !base.daysOff.some(d => d.officerId === officerId))} onClick={() => void operation.run(() => workScheduleApi.confirm(month, base.baseFingerprint))}>Xác nhận đã xem lịch</Button>}
    {manager && can('workflow.staffing.manage') && <details className="staff-card"><summary className="cursor-pointer font-semibold">Tiện ích xếp lịch</summary><div className="mt-4 flex flex-wrap items-end gap-3"><Button variant="outline" disabled={!editable} onClick={() => setWeek(true)}>Thiết lập giờ hằng tuần</Button><Button variant="outline" disabled={!editable} onClick={() => void fill()}>Điền ngày trống từ giờ hằng tuần</Button><label className="staff-field">Tháng muốn sao chép<input type="month" className={fieldClass} min="2000-01" max="2099-12" value={copyFrom} onChange={e => setCopyFrom(e.target.value)} /></label><Button variant="outline" disabled={!editable || !/^20\d{2}-(0[1-9]|1[0-2])$/.test(copyFrom) || copyFrom === month.slice(0, 7)} onClick={() => void fill(copyFrom + '-01')}>Điền ngày trống từ tháng này</Button><Button variant="outline" onClick={() => setHistory(true)}>Xem các lần công bố</Button></div><p className="mt-3 text-sm text-slate-600">Chỉ điền ngày trống chưa chỉnh của cán bộ đang chọn. Sao chép theo số ngày trong tháng. Kiểm tra giờ trên lịch trước khi công bố.</p></details>}
    {editor && <DayEditor day={editor} rows={daySlots(editor)} all={[...slots, ...(base.carry || [])]} data={{ ...base, daysOff }} officerId={officerId} name={name(officerId)} onSave={rows => putDay(editor, rows)} onClose={() => setEditor(undefined)} />}
    {confirm && <Modal open title="Công bố lịch tháng?" description="Lịch sau khi công bố sẽ hiển thị cho cán bộ. Kiểm tra các thay đổi trước khi xác nhận." onOpenChange={v => { if (!v && !operation.busy) setConfirm(false); }}><div className="space-y-4"><p>Các cán bộ có lịch thay đổi:</p><p className="staff-note">Sau khi công bố, hệ thống tạo thông báo lịch mới cho từng cán bộ bị ảnh hưởng.</p><div className="space-y-3">{affected.map(id => <section key={id} className="rounded-lg border border-slate-200 p-3"><h3 className="font-semibold">{name(id)} · {slots.filter(s => s.officerId === id).length} ca sau công bố</h3><ul className="mt-2 space-y-1 text-sm">{base.daysOff.filter(d => d.officerId === id && !daysOff.some(row => row.officerId === id && row.date === d.date)).map(d => <li key={`old-rest-${d.date}`}>Đổi sang ngày làm: {calendarDate(d.date)}</li>)}{daysOff.filter(d => d.officerId === id && !base.daysOff.some(row => row.officerId === id && row.date === d.date)).map(d => <li key={`rest-${d.date}`}>Ngày nghỉ: {calendarDate(d.date)}</li>)}{base.slots.filter(s => s.officerId === id && !slots.some(row => sameSchedule([row], [s]))).map(s => <li key={`old${s.shiftId}`} className="text-red-800">Bỏ giờ cũ: {describe(s)}</li>)}{slots.filter(s => s.officerId === id && !base.slots.some(row => sameSchedule([row], [s]))).map(s => <li key={s.shiftId} className="text-emerald-800">Giờ mới: {describe(s)}</li>)}</ul></section>)}</div>{base.draft && !useOfficial && <p className="staff-note">Đã ghép cả bản đang soạn trên hệ thống. Công bố áp dụng cho toàn bộ các cán bộ liệt kê ở trên.</p>}<label className="staff-field">Ghi chú công bố<textarea maxLength={2000} className={fieldClass} disabled={operation.busy || operation.review} value={reason} onChange={e => setReason(e.target.value)} /></label>{closureWork && <label className="flex gap-2"><input type="checkbox" checked={allowClosure} disabled={operation.busy || operation.review} onChange={e => setAllowClosure(e.target.checked)} />Tôi xác nhận bố trí ca trong ngày nghỉ / lễ chung.</label>}<label className="flex gap-2"><input type="checkbox" checked={ack} disabled={operation.busy || operation.review} onChange={e => setAck(e.target.checked)} />Tôi đã kiểm tra giờ làm và các cán bộ có lịch thay đổi.</label><OperationError operation={operation} /><div className="flex flex-wrap gap-3"><Button variant="outline" disabled={operation.busy} onClick={() => setConfirm(false)}>Quay lại lịch</Button><Button disabled={operation.busy || operation.review || !ack || !reason.trim() || (closureWork && !allowClosure)} onClick={() => void publish()}>{operation.busy ? 'Đang công bố…' : 'Công bố lịch'}</Button></div></div></Modal>}
    {week && <ScheduleWeekPattern onClose={() => setWeek(false)} />}{history && <ScheduleHistory month={month} onClose={() => setHistory(false)} />}
    {resetDraft && <Modal open title="Lập lại lịch đang soạn?" description="Thao tác này bỏ toàn bộ thay đổi chưa công bố trong bản soạn cũ của phường, kể cả của cán bộ khác. Lịch chính thức được giữ nguyên." onOpenChange={v => !v && setResetDraft(false)} footer={<><Button variant="outline" onClick={() => setResetDraft(false)}>Quay lại</Button><Button onClick={() => { setUseOfficial(true); setResetDraft(false); }}>Dùng lịch chính thức</Button></>}><p>Kiểm tra lại lịch mới trước khi công bố. Bản trên hệ thống chỉ được thay thế khi bạn xác nhận công bố.</p></Modal>}
    {manager && base.confirmations.length > 0 && <p className="text-sm text-slate-600">Đã xem lịch: {base.confirmations.filter(c => c.confirmedAtUtc).length}/{base.confirmations.length} cán bộ.</p>}
    {!manager && user?.id !== officerId && <p role="alert">Không thể sửa lịch cán bộ khác.</p>}
  </div>;
}

const hourSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Chọn giờ hợp lệ.');
const daySchema = z.object({ rows: z.array(z.object({ shiftId: z.string(), shiftVersion: z.number(), start: hourSchema, end: hourSchema, next: z.boolean() })).min(1, 'Thêm ít nhất một ca hoặc chọn Nghỉ trên lịch.').max(20, 'Tối đa 20 ca mỗi ngày.') });
function DayEditor({ day, rows, all, data, officerId, name, onSave, onClose }: { day: string; rows: ScheduleSlot[]; all: ScheduleSlot[]; data: MonthData; officerId: string; name: string; onSave: (s: ScheduleSlot[]) => void; onClose: () => void }) {
  const form = useForm<z.infer<typeof daySchema>>({ resolver: zodResolver(daySchema), defaultValues: { rows: rows.length ? rows.map(s => ({ shiftId: s.shiftId, shiftVersion: s.shiftVersion, start: scheduleTime(s.startsAt), end: scheduleTime(s.endsAt), next: scheduleDay(s.endsAt) !== day })) : [{ shiftId: crypto.randomUUID(), shiftVersion: 0, start: '08:00', end: '17:00', next: false }] } });
  const array = useFieldArray({ control: form.control, name: 'rows' });
  const guard = useUnsavedChanges(form.formState.isDirty);
  const submit = form.handleSubmit(v => {
    const result: ScheduleSlot[] = [];
    for (const r of v.rows) {
      const startsAt = `${day}T${r.start}`, endsAt = `${r.next ? nextDate(day) : day}T${r.end}`;
      const error = validatePeriod({ startsAt, endsAt }, true);
      if (error) { form.setError('root', { message: error }); return; }
      const original = rows.find(s => s.shiftId === r.shiftId);
      result.push(original && scheduleTime(original.startsAt) === r.start && scheduleTime(original.endsAt) === r.end && (scheduleDay(original.endsAt) !== day) === r.next ? original : { shiftId: r.shiftId, shiftVersion: r.shiftVersion, officerId, startsAt: vietnamIso(startsAt), endsAt: vietnamIso(endsAt) });
    }
    let merged: ScheduleSlot[];
    try { merged = replaceScheduleDays(all, officerId, new Map([[day, result]])); } catch (e) { form.setError('root', { message: (e as Error).message }); return; }
    const personal = merged.filter(s => s.officerId === officerId).sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt));
    if (personal.some((s, i) => i > 0 && Date.parse(s.startsAt) < Date.parse(personal[i - 1].endsAt))) { form.setError('root', { message: 'Các ca làm bị trùng giờ. Kiểm tra cả ca qua ngày hôm sau.' }); return; }
    if (result.some(s => data.daysOff.some(d => d.officerId === officerId && d.date !== day && Date.parse(s.startsAt) < Date.parse(nextDate(d.date) + 'T00:00:00+07:00') && Date.parse(s.endsAt) > Date.parse(d.date + 'T00:00:00+07:00')))) { form.setError('root', { message: 'Giờ làm trùng ngày nghỉ đã chọn.' }); return; }
    if (result.some(s => data.leaves.some(l => l.officerId === officerId && Date.parse(l.startsAtUtc) < Date.parse(s.endsAt) && Date.parse(l.endsAtUtc) > Date.parse(s.startsAt)))) { form.setError('root', { message: 'Giờ làm trùng với thời gian nghỉ phép đã duyệt.' }); return; }
    if (merged.filter(s => scheduleDay(s.startsAt).slice(0, 7) === day.slice(0, 7)).length > 500) { form.setError('root', { message: 'Lịch phường vượt quá 500 ca trong tháng.' }); return; }
    onSave(result);
  });
  return <Modal open title={`Giờ làm ngày ${calendarDate(day)}`} description={`${name} · Giờ Việt Nam (24 giờ). Chọn xong rồi công bố bên dưới lịch tháng.`} onOpenChange={v => !v && guard.requestClose(onClose)}><form onSubmit={e => void submit(e)} className="space-y-4" noValidate>{array.fields.map((r, i) => <div key={r.id} className="schedule-time-row"><label className="staff-field">Từ giờ<input type="time" className={fieldClass} {...form.register(`rows.${i}.start`)} /></label><label className="staff-field">Đến giờ<input type="time" className={fieldClass} {...form.register(`rows.${i}.end`)} /></label><label className="flex items-center gap-2 text-sm"><input type="checkbox" {...form.register(`rows.${i}.next`)} />Kết thúc ngày hôm sau</label><Button variant="outline" type="button" aria-label={`Bỏ ca ${i + 1}`} onClick={() => array.remove(i)}>Bỏ ca</Button></div>)}<Button type="button" variant="outline" disabled={array.fields.length >= 20} onClick={() => array.append({ shiftId: crypto.randomUUID(), shiftVersion: 0, start: '13:00', end: '17:00', next: false })}>Thêm ca trong ngày</Button>{(form.formState.errors.root || form.formState.errors.rows) && <p role="alert" className="text-sm text-red-800">{form.formState.errors.root?.message || form.formState.errors.rows?.message || 'Kiểm tra giờ của từng ca.'}</p>}<div className="flex flex-wrap gap-3"><Button type="button" variant="outline" onClick={() => guard.requestClose(onClose)}>Quay lại</Button><Button type="submit">Áp dụng vào lịch</Button></div></form>{guard.confirmation}</Modal>;
}
function ScheduleHistory({ month, onClose }: { month: string; onClose: () => void }) {
  const query = useStaffQuery(['schedule-history', month], signal => workScheduleApi.history(month, signal));
  return <Modal open title="Các lần công bố lịch" onOpenChange={v => !v && onClose()}><QueryState query={query} empty={!query.data?.length} /><div className="space-y-3">{query.data?.map(r => <article key={r.id} className="staff-card"><h3>{r.status === 'BASELINE' ? 'Dữ liệu ban đầu' : 'Lịch đã công bố'}</h3><p>{r.reason}</p><p>{r.slots.length} ca{r.publishedAtUtc ? ` · ${new Date(r.publishedAtUtc).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}` : ''}</p></article>)}</div></Modal>;
}
