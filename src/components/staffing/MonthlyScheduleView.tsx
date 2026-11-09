import { useEffect, useRef, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axios from 'axios';
import { Button, Modal } from '@/components/ui';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { workScheduleApi, type ScheduleRevision, type ScheduleSlot } from '@/lib/api/workSchedules';
import { staffingApi } from '@/lib/api/staffing';
import { calendarDate, calendarDays, replaceScheduleDays, sameSchedule, scheduleDay, scheduleTime } from '@/lib/scheduleCalendar';
import { validatePeriod, vietnamIso, vietnamLocal } from '@/lib/staffingValidation';
import { OperationError, QueryState, StaffPeriod, fieldClass, useStaffAccess, useStaffDirectory, useStaffOperation, useStaffQuery } from './shared';
import { ScheduleWeekPattern } from './ScheduleWeekPattern';
import { defaultStaffSchedule, defaultWorkingHours } from '@/lib/defaultStaffSchedule';

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
    {!officerId ? <div className="staff-state"><p className="font-semibold">Chọn cán bộ để xem và xếp lịch tháng.</p><p>Bấm ngày để đặt giờ. Ngày chưa có ca không được xem là ngày nghỉ.</p></div> : <CalendarLoader key={`${officerId}:${month}:${generation}`} officerId={officerId} officerIds={officers.map(o => o.id)} month={month + '-01'} name={name} onDirty={setDirty} onBusy={setBusy} onRequestChange={onRequestChange} onPublished={() => { setDirty(false); setBusy(false); setGeneration(g => g + 1); }} move={move} />}
    {guard.confirmation}
  </div>;
}

function CalendarLoader(props: BoardProps & { month: string }) {
  const { manager } = useStaffAccess();
  const query = useStaffQuery(['month', props.month], async signal => {
    const start = vietnamIso(props.month + 'T00:00');
    const nextMonth = nextDate(calendarDays(props.month).at(-1)!);
    const end = vietnamIso(nextMonth + 'T00:00');
    const [data, shifts] = await Promise.all([workScheduleApi.month(props.month, signal), staffingApi.shifts(start, vietnamIso(nextDate(nextMonth) + 'T00:00'), signal)]);
    // Boundary shifts are context only, including next month's shifts that may overlap an overnight edit.
    const carry = shifts.filter(s => !s.cancelledAtUtc && (Date.parse(s.startsAtUtc) < Date.parse(start) || Date.parse(s.startsAtUtc) >= Date.parse(end))).map(s => {
      if (s.version === undefined) throw new Error('Lịch tháng bên cạnh chưa tải đủ. Vui lòng bấm Lấy lịch mới.');
      return { shiftId: s.id, officerId: s.officerId, startsAt: s.startsAtUtc, endsAt: s.endsAtUtc, shiftVersion: s.version };
    });
    return { ...data, carry };
  });
  const [ready, setReady] = useState(false);
  useEffect(() => { if (query.isFetchedAfterMount && !query.isError) setReady(true); }, [query.isFetchedAfterMount, query.isError]);
  // Start from a fresh response, but keep the editor mounted if a later background read fails.
  return <><QueryState query={{ ...query, isPending: !ready && !query.isError }} />{ready && query.data && <CalendarBoard key={manager ? 'manager' : `${query.data.baseFingerprint}:${query.data.confirmations.find(c => c.officerId === props.officerId)?.confirmedAtUtc ?? ''}`} {...props} initial={query.data} />}</>;
}
type BoardProps = { officerId: string; officerIds: string[]; month: string; name: (id: string) => string; onDirty: (v: boolean) => void; onBusy: (v: boolean) => void; onPublished: () => void; onRequestChange: (s: ScheduleSlot) => void; move: (n: number) => void };
function CalendarBoard({ initial, officerId, officerIds, month, name, onDirty, onBusy, onPublished, onRequestChange, move }: BoardProps & { initial: MonthData }) {
  const { manager, officer, can, user } = useStaffAccess();
  const [base] = useState(initial);
  const [confirmedFingerprint, setConfirmedFingerprint] = useState<string>();
  const confirmed = confirmedFingerprint === base.baseFingerprint || base.confirmations.some(c => c.officerId === officerId && Boolean(c.confirmedAtUtc));
  const [useOfficial, setUseOfficial] = useState(false), [resetDraft, setResetDraft] = useState(false);
  const stale = Boolean(base.draft && base.draft.baseFingerprint !== base.baseFingerprint && !useOfficial);
  const source = manager && base.draft && !stale && !useOfficial ? base.draft.slots : base.slots;
  const draftRef = useRef<ScheduleRevision | null>(base.draft);
  const [persisted, setPersisted] = useState(source);
  const [defaultSlots, setDefaultSlots] = useState<ScheduleSlot[]>([]);
  const [defaultNotice, setDefaultNotice] = useState('');
  const [changes, setChanges] = useState(new Map<string, ScheduleSlot[]>());
  const [selected, setSelected] = useState<string>();
  const [viewDay, setViewDay] = useState<string>();
  const [editor, setEditor] = useState<string>();
  const [confirm, setConfirm] = useState(false), [ack, setAck] = useState(false), [allowClosure, setAllowClosure] = useState(false);
  const [reason, setReason] = useState(`Xếp lịch tháng ${month.slice(5, 7)}/${month.slice(0, 4)} cho ${name(officerId)}`);
  const [week, setWeek] = useState(false), [history, setHistory] = useState(false);
  const [copyYear, setCopyYear] = useState(month.slice(0, 4)), [copyMonth, setCopyMonth] = useState('');
  const [fillNotice, setFillNotice] = useState('');
  const copyFrom = copyMonth ? `${copyYear}-${copyMonth}` : '';
  const operation = useStaffOperation();
  const saved = useRef<{ revisionId: string; expectedVersion: number; allowClosure: boolean; reason: string } | null>(null);
  const attempted = useRef(false);
  const slots = [...[...source, ...defaultSlots].filter(s => s.officerId !== officerId || !changes.has(scheduleDay(s.startsAt))), ...Array.from(changes.values()).flat()];
  const personal = slots.filter(s => s.officerId === officerId);
  const dirty = !sameSchedule(slots, persisted) || useOfficial;
  const days = calendarDays(month);
  const today = vietnamLocal(new Date().toISOString()).slice(0, 10);
  const daySlots = (day: string) => personal.filter(s => scheduleDay(s.startsAt) === day).sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt));
  const incoming = (day: string) => [...personal, ...(base.carry || []).filter(s => s.officerId === officerId)].filter(s => scheduleDay(s.startsAt) < day && Date.parse(s.endsAt) > Date.parse(day + 'T00:00:00+07:00'));
  const dayLeave = (day: string) => base.leaves.some(l => l.officerId === officerId && Date.parse(l.startsAtUtc) < Date.parse(nextDate(day) + 'T00:00:00+07:00') && Date.parse(l.endsAtUtc) > Date.parse(day + 'T00:00:00+07:00'));
  const fullDayLeave = (day: string) => base.leaves.some(l => l.officerId === officerId && Date.parse(l.startsAtUtc) <= Date.parse(day + 'T00:00:00+07:00') && Date.parse(l.endsAtUtc) >= Date.parse(nextDate(day) + 'T00:00:00+07:00'));
  const isRestDay = (day: string) => fullDayLeave(day) || base.closures.some(c => c.closureDate === day);
  const locked = (day: string) => day < today || daySlots(day).some(s => Date.parse(s.startsAt) <= Date.now());
  const editable = manager && can('workflow.staffing.manage') && !operation.busy && !operation.review && !stale;
  const affected = Array.from(new Set([...base.slots, ...slots].map(s => s.officerId))).filter(id => !sameSchedule(base.slots.filter(s => s.officerId === id), slots.filter(s => s.officerId === id)));
  const closureWork = slots.some(s => !base.slots.some(old => sameSchedule([old], [s])) && base.closures.some(c => c.closureDate >= scheduleDay(s.startsAt) && c.closureDate <= scheduleDay(new Date(Date.parse(s.endsAt) - 1).toISOString())));
  const describe = (s: ScheduleSlot) => `${calendarDate(scheduleDay(s.startsAt))} · ${scheduleTime(s.startsAt)}–${scheduleTime(s.endsAt)}${scheduleDay(s.endsAt) !== scheduleDay(s.startsAt) ? ' (qua ngày hôm sau)' : ''}`;
  useEffect(() => onDirty(dirty), [dirty, onDirty]);
  useEffect(() => onBusy(operation.busy), [operation.busy, onBusy]);
  const putDay = (day: string, rows: ScheduleSlot[]) => {
    setChanges(prev => { const next = new Map(prev); if (sameSchedule(source.filter(s => s.officerId === officerId && scheduleDay(s.startsAt) === day), rows)) next.delete(day); else next.set(day, rows); return next; });
    setEditor(undefined); setSelected(day);
  };
  const persistDraft = async (nextSlots: ScheduleSlot[]) => {
    const latest = await workScheduleApi.month(month);
    if (latest.baseFingerprint !== base.baseFingerprint || (latest.draft?.version ?? 0) !== (draftRef.current?.version ?? 0) || latest.draft?.id !== draftRef.current?.id) throw new Error('Người khác vừa sửa lịch tháng này. Nội dung được giữ lại; hãy lấy lịch mới để đối chiếu.');
    if (draftRef.current && !useOfficial && sameSchedule(draftRef.current.slots, nextSlots) && draftRef.current.reason === reason.trim()) return draftRef.current;
    if (attempted.current) throw new Error('Chưa xác định lần lưu trước. Lấy lịch mới để kiểm tra bản đã lưu trên hệ thống.');
    attempted.current = true;
    let revision: ScheduleRevision;
    try {
      revision = await workScheduleApi.saveMonth(month, { expectedVersion: draftRef.current?.version ?? 0, baseFingerprint: base.baseFingerprint, slots: nextSlots, reason });
    } catch (error) {
      // A validation rejection did not save anything. Let the manager correct and submit again.
      if (axios.isAxiosError(error) && error.response?.status === 400) attempted.current = false;
      throw error;
    }
    draftRef.current = revision; attempted.current = false;
    setPersisted(nextSlots);
    return revision;
  };
  const publish = () => operation.run(async () => {
    if (!saved.current && base.slots.some(old => Date.parse(old.startsAt) <= Date.now() && !slots.some(s => sameSchedule([old], [s])))) throw new Error('Có ca đã bắt đầu trong lúc chỉnh lịch. Lấy lịch mới để kiểm tra.');
    if (saved.current) {
      const latest = await workScheduleApi.month(month);
      if (!latest.draft && sameSchedule(latest.slots, slots)) return;
      if (latest.baseFingerprint !== base.baseFingerprint || latest.draft?.id !== saved.current.revisionId || latest.draft.version !== saved.current.expectedVersion) throw new Error('Lịch đã thay đổi. Chọn Lấy lịch mới để kiểm tra.');
    } else {
      const revision = await persistDraft(slots);
      saved.current = { revisionId: revision.id, expectedVersion: revision.version, allowClosure, reason };
    }
    try {
      await workScheduleApi.publish(month, saved.current!);
    } catch (error) {
      // Keep the fixed payload only when the result is uncertain; a 400 permits corrections.
      if (axios.isAxiosError(error) && error.response?.status === 400) saved.current = null;
      throw error;
    }
  }, onPublished, true);
  const fill = (from?: string) => {
    setFillNotice('');
    return operation.run(async () => {
    const preview = await workScheduleApi.preview(month, from);
    if (preview.baseFingerprint !== base.baseFingerprint) throw new Error('Lịch chính thức đã thay đổi. Hãy lấy lịch mới.');
    if (preview.conflicts.length) throw new Error('Không thể điền giờ vì bản xem trước có xung đột. Kiểm tra thiết lập tuần hoặc tháng nguồn.');
    const grouped = new Map<string, ScheduleSlot[]>();
    preview.slots.filter(s => s.officerId === officerId && Date.parse(s.startsAt) > Date.now()).forEach(s => { const day = scheduleDay(s.startsAt); if (!locked(day)) grouped.set(day, [...(grouped.get(day) || []), s]); });
    // Utility only fills untouched empty days, never replaces a manually edited day.
    const count = Array.from(grouped.keys()).filter(day => !changes.has(day) && !isRestDay(day) && !daySlots(day).length).length;
    setChanges(prev => { const result = new Map(prev); for (const [day, rows] of grouped) if (!result.has(day) && !isRestDay(day) && !daySlots(day).length) result.set(day, rows); return result; });
    return count;
  }, count => setFillNotice(count ? `Đã điền giờ cho ${count} ngày trống. Kiểm tra trên lịch rồi lưu nháp hoặc công bố.` : 'Không có ngày trống phù hợp để điền. Kiểm tra giờ tuần hoặc lịch tháng nguồn.'), false, true);
  };
  const padding = (new Date(month + 'T12:00:00Z').getUTCDay() + 6) % 7;
  return <div className="space-y-5">
    {!manager && <p className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600"><strong className="text-slate-900">Khung giờ mặc định: </strong>{defaultWorkingHours} Lịch bên dưới là các ca đã được công bố.</p>}
    {stale && <div role="alert" className="staff-note"><p>Bản đang soạn trên hệ thống dựa trên lịch cũ. Bạn đang xem lịch chính thức; cần lập lại bản soạn trước khi sửa.</p><Button variant="outline" onClick={() => setResetDraft(true)}>Bắt đầu lại từ lịch chính thức</Button></div>}
    {manager && can('workflow.staffing.manage') && (
        <section aria-label="Lịch mặc định cho tất cả cán bộ" className="space-y-3 rounded-xl border border-red-100 bg-red-50/40 p-4">
          <h4 className="font-semibold">Lịch mặc định cho tất cả cán bộ</h4>
          <p className="text-sm text-slate-700">{defaultWorkingHours}</p>
          <p className="text-sm text-slate-600">Áp dụng cho {officerIds.length} cán bộ trong tháng {Number(month.slice(5, 7))}/{month.slice(0, 4)}. Giữ ngày đã có ca hoặc đã chỉnh; bỏ qua Chủ nhật, ngày lễ và buổi có nghỉ phép được duyệt. Chỉ thêm ca chưa bắt đầu.</p>
          <Button disabled={!editable || !officerIds.length} onClick={() => { setDefaultNotice(''); void operation.run(async () => {
            const additions = defaultStaffSchedule(month, officerIds, slots, base.leaves, base.closures, { editedDays: Array.from(changes.keys(), day => ({ officerId, day })), carry: base.carry });
            setDefaultSlots(prev => [...prev, ...additions]);
            return additions.length;
          }, count => setDefaultNotice(count ? `Đã điền ${count} ca mặc định. Kiểm tra lịch rồi bấm Xác nhận công bố lịch để áp dụng cho cán bộ.` : 'Không có ca mặc định cần thêm. Các ngày đã có lịch hoặc không đủ điều kiện được giữ nguyên.'), false, true); }}>Điền lịch mặc định cho tất cả cán bộ</Button>
        {defaultNotice && <p role="status" className="text-sm font-medium text-blue-900">{defaultNotice}</p>}</section>
    )}
    <div className="schedule-board">
      <div className="schedule-month-heading"><Button variant="outline" aria-label="Tháng trước" disabled={operation.busy || month === '2000-01-01'} onClick={() => move(-1)}>‹</Button><div><h3>Tháng {Number(month.slice(5, 7))} / {month.slice(0, 4)}</h3><p>{name(officerId)}</p></div><Button variant="outline" aria-label="Tháng sau" disabled={operation.busy || month === '2099-12-01'} onClick={() => move(1)}>›</Button></div>
      <p className="px-4 py-3 text-sm text-slate-600">{manager ? 'Bấm ngày để đặt hoặc bỏ ca. Chỉ thay đổi ca chưa bắt đầu.' : 'Bấm ngày để xem giờ làm.'} Giờ Việt Nam, định dạng 24 giờ.</p>
      <div className="schedule-weekdays">{weekdays.map((day, i) => <div key={day}><span className="hidden sm:inline">{day}</span><span className="sm:hidden">{i === 6 ? 'CN' : `T${i + 2}`}</span></div>)}</div>
      <div className="schedule-grid" aria-label="Bảng lịch tháng">
        {Array.from({ length: padding }, (_, i) => <div key={`blank${i}`} className="schedule-blank" aria-hidden="true" />)}
        {days.map(day => { const rows = daySlots(day), prior = incoming(day), leave = dayLeave(day), closure = base.closures.some(c => c.closureDate === day), past = locked(day), rest = isRestDay(day); return <div key={day} className={`schedule-cell ${rest ? 'is-rest-day' : rows.length || prior.length ? 'is-work-day' : ''} ${selected === day ? 'is-selected' : ''} ${day === today ? 'is-today' : ''} ${past ? 'is-past' : ''}`}>
          <button type="button" className="schedule-date" aria-label={`Ngày ${calendarDate(day)}${(rows.length + prior.length) ? `, ${rows.length + prior.length} ca` : rest ? ', ngày nghỉ' : ', chưa có ca'}`} aria-pressed={selected === day} onClick={() => { setSelected(day); if (editable && !past) setEditor(day); else setViewDay(day); }}><span className="schedule-number">{Number(day.slice(-2))}</span><span className="schedule-hours">{rows.map(s => <span key={s.shiftId} className="schedule-range"><span>{scheduleTime(s.startsAt)}</span><span className="schedule-range-separator">–</span><span>{scheduleTime(s.endsAt)}{scheduleDay(s.endsAt) !== day ? ' (+1)' : ''}</span></span>)}</span><span className={`schedule-label ${leave || closure ? 'has-event' : ''}`}>{leave ? 'Có nghỉ phép' : closure ? 'Nghỉ / lễ chung' : rest ? 'Ngày nghỉ' : rows.length ? `${rows.length} ca` : 'Chưa có ca'}</span>{past && <span className="schedule-past">Chỉ xem</span>}</button>
          {!!prior.length && <span className="schedule-label has-event px-1">Có ca từ hôm trước</span>}
        </div>; })}
        {Array.from({ length: (7 - ((padding + days.length) % 7)) % 7 }, (_, i) => <div key={`tail${i}`} className="schedule-blank" aria-hidden="true" />)}
      </div>
    </div>
    <p className="text-sm text-slate-600">Ngày có ca màu xanh nhạt; ngày nghỉ / lễ chung và nghỉ phép cả ngày màu đỏ nhạt. Ngày trống là chưa có ca, không mặc định là ngày nghỉ.</p>
    {manager && <p className="text-sm text-slate-600">Thay đổi giờ chưa tự động lưu. Lưu bản nháp để tiếp tục sau; công bố để áp dụng lịch cho cán bộ. Ca đã bắt đầu được giữ nguyên.</p>}
    {selected && !viewDay && <section className="staff-card space-y-3" aria-label="Chi tiết ngày"><h3>Ngày {calendarDate(selected)} · {name(officerId)}</h3>{locked(selected) && <p className="staff-note">Ngày đã qua hoặc có ca đã bắt đầu. Chỉ xem, không sửa hoặc xóa lịch sử.</p>}{[...incoming(selected), ...daySlots(selected)].length ? [...incoming(selected), ...daySlots(selected)].map(s => <div key={s.shiftId} className="space-y-2">{scheduleDay(s.startsAt) !== selected && <p className="text-sm">Ca từ ngày {calendarDate(scheduleDay(s.startsAt))}. Muốn sửa ca này, chọn ngày bắt đầu trên lịch.</p>}<StaffPeriod start={s.startsAt} end={s.endsAt} />{officer && can('workflow.leave.request') && Date.parse(s.startsAt) > Date.now() && <Button variant="outline" onClick={() => onRequestChange(s)}>Đề nghị đổi giờ ca</Button>}</div>) : <p>Không có ca làm trong ngày này.</p>}{editable && !locked(selected) && <Button variant="outline" onClick={() => setEditor(selected)}>Đặt giờ làm</Button>}</section>}
    <OperationError operation={operation} />
    {viewDay && <Modal open title={`Lịch ngày ${calendarDate(viewDay)}`} description={name(officerId)} onOpenChange={v => !v && setViewDay(undefined)}><div className="space-y-4">{locked(viewDay) && <p className="staff-note">Ngày đã qua hoặc có ca đã bắt đầu. Chỉ xem, không sửa hoặc xóa lịch sử.</p>}{dayLeave(viewDay) && <p>Có thời gian nghỉ phép đã được duyệt trong ngày.</p>}{base.closures.some(c => c.closureDate === viewDay) && <p>Ngày nghỉ / lễ chung của phường.</p>}{[...incoming(viewDay), ...daySlots(viewDay)].map(s => <div key={s.shiftId} className="space-y-2"><StaffPeriod start={s.startsAt} end={s.endsAt} />{officer && can('workflow.leave.request') && Date.parse(s.startsAt) > Date.now() && <Button variant="outline" onClick={() => { setViewDay(undefined); onRequestChange(s); }}>Đề nghị đổi giờ ca</Button>}</div>)}{!incoming(viewDay).length && !daySlots(viewDay).length && <p>Không có ca làm trong ngày này.</p>}</div></Modal>}
    {manager && can('workflow.staffing.manage') && <section className="schedule-publish" aria-label="Công bố lịch"><div><h3>Hoàn tất lịch tháng</h3><p>{personal.length} ca · {new Set(personal.map(s => scheduleDay(s.startsAt))).size} ngày làm việc của {name(officerId)}.</p><p>{affected.length ? `${affected.length} cán bộ có lịch thay đổi. Chưa gửi lịch mới cho cán bộ.` : 'Lịch đang hiển thị giống lịch đã công bố.'}</p></div><Button variant="outline" disabled={!editable || !dirty} onClick={() => void operation.run(() => persistDraft(slots))}>Lưu bản nháp</Button><Button disabled={!editable || !affected.length} onClick={() => { setAck(false); setAllowClosure(false); setConfirm(true); }}>Xác nhận công bố lịch</Button>{operation.review && <p className="text-sm">Chưa xác nhận công bố thành công. Các giờ bạn chọn vẫn được giữ. {saved.current ? <Button variant="outline" disabled={operation.busy} onClick={() => void publish()}>Kiểm tra và thử công bố lại</Button> : 'Chọn Lấy lịch mới để kiểm tra bản đã lưu trên hệ thống trước khi tiếp tục.'}</p>}</section>}
    {officer && can('workflow.leave.request') && !confirmed && <Button disabled={operation.busy || operation.review || !personal.length} onClick={() => void operation.run(async () => {
      const receipt = await workScheduleApi.confirm(month, base.baseFingerprint);
      if (receipt.officerId !== officerId || receipt.month !== month || receipt.fingerprint !== base.baseFingerprint) throw new Error('Kết quả xác nhận không khớp lịch đang xem. Hãy lấy lịch mới để kiểm tra.');
      return receipt;
    }, receipt => setConfirmedFingerprint(receipt.fingerprint))}>Xác nhận đã xem lịch</Button>}
    {manager && can('workflow.staffing.manage') && <details className="staff-card">
      <summary className="cursor-pointer rounded font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500">Tiện ích xếp lịch</summary>
      <div className="mt-4 space-y-4">

        <p className="text-sm text-slate-600">Điền nhanh lịch cho <strong className="text-slate-800">{name(officerId)}</strong> · Tháng {Number(month.slice(5, 7))}/{month.slice(0, 4)}.</p>
        <div className="grid gap-4 lg:grid-cols-2">
          <section aria-labelledby="schedule-week-tools" className="flex min-w-0 flex-col gap-3 rounded-xl border border-slate-200 p-4">
            <div className="space-y-1"><h4 id="schedule-week-tools" className="font-semibold">Dùng giờ hằng tuần</h4><p className="text-sm text-slate-600">Lặp lại giờ làm theo từng thứ trong tuần cho tháng đang xem.</p></div>
            <div className="mt-auto flex flex-wrap gap-2 pt-2">
              <Button variant="outline" disabled={!editable} onClick={() => setWeek(true)}>Thiết lập giờ tuần</Button>
              <Button disabled={!editable} onClick={() => void fill()}>Điền theo giờ tuần</Button>
            </div>
          </section>
          <section aria-labelledby="schedule-copy-tools" className="min-w-0 space-y-3 rounded-xl border border-slate-200 p-4">
            <div className="space-y-1"><h4 id="schedule-copy-tools" className="font-semibold">Sao chép từ tháng khác</h4><p className="text-sm text-slate-600">Ví dụ: ca ngày 10 của tháng nguồn được điền vào ngày 10 của tháng đang xem.</p></div>
            <div className="grid grid-cols-2 gap-3">
              <label className="staff-field">Tháng nguồn<select className={fieldClass} value={copyMonth} disabled={!editable} onChange={e => { setCopyMonth(e.target.value); setFillNotice(''); }}><option value="">Chọn tháng</option>{Array.from({ length: 12 }, (_, i) => <option key={i} value={String(i + 1).padStart(2, '0')}>Tháng {i + 1}</option>)}</select></label>
              <label className="staff-field">Năm nguồn<select className={fieldClass} value={copyYear} disabled={!editable} onChange={e => { setCopyYear(e.target.value); setFillNotice(''); }}>{Array.from({ length: 100 }, (_, i) => <option key={i} value={2000 + i}>{2000 + i}</option>)}</select></label>
            </div>
            <p id="schedule-copy-hint" className="text-xs text-slate-500">{!copyMonth ? 'Chọn tháng có lịch bạn muốn dùng lại.' : copyFrom === month.slice(0, 7) ? 'Chọn tháng nguồn khác tháng đang xem.' : `Từ tháng ${Number(copyMonth)}/${copyYear} → tháng ${Number(month.slice(5, 7))}/${month.slice(0, 4)}.`}</p>
            <Button variant="outline" aria-describedby="schedule-copy-hint" disabled={!editable || !copyMonth || copyFrom === month.slice(0, 7)} onClick={() => void fill(copyFrom + '-01')}>Sao chép vào ngày trống</Button>
          </section>
        </div>
        {fillNotice && <p role="status" className="rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-900">{fillNotice}</p>}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-3"><p className="max-w-2xl text-sm text-slate-600">Chỉ điền ngày trống chưa chỉnh; giữ ca đã có, bỏ qua ngày nghỉ/lễ và ngày đã qua. Chưa tự lưu hoặc công bố.</p><Button variant="outline" size="small" onClick={() => setHistory(true)}>Lịch sử công bố</Button></div>
      </div>
    </details>}
    {editor && <DayEditor day={editor} rows={daySlots(editor)} all={[...slots, ...(base.carry || [])]} data={base} officerId={officerId} name={name(officerId)} onSave={rows => putDay(editor, rows)} onClose={() => setEditor(undefined)} />}
    {confirm && <Modal open title="Công bố lịch tháng?" description="Lịch sau khi công bố sẽ hiển thị cho cán bộ. Kiểm tra các thay đổi trước khi xác nhận." onOpenChange={v => { if (!v && !operation.busy) setConfirm(false); }}><div className="space-y-4"><p>Các cán bộ có lịch thay đổi:</p><p className="staff-note">Sau khi công bố, hệ thống tạo thông báo lịch mới cho từng cán bộ bị ảnh hưởng.</p><div className="space-y-3">{affected.map(id => <section key={id} className="rounded-lg border border-slate-200 p-3"><h3 className="font-semibold">{name(id)} · {slots.filter(s => s.officerId === id).length} ca sau công bố</h3><ul className="mt-2 space-y-1 text-sm">{base.slots.filter(s => s.officerId === id && !slots.some(row => sameSchedule([row], [s]))).map(s => <li key={`old${s.shiftId}`} className="text-red-800">Bỏ giờ cũ: {describe(s)}</li>)}{slots.filter(s => s.officerId === id && !base.slots.some(row => sameSchedule([row], [s]))).map(s => <li key={s.shiftId} className="text-emerald-800">Giờ mới: {describe(s)}</li>)}</ul></section>)}</div>{base.draft && !useOfficial && <p className="staff-note">Đã ghép cả bản đang soạn trên hệ thống. Công bố áp dụng cho toàn bộ các cán bộ liệt kê ở trên.</p>}<label className="staff-field">Ghi chú công bố<textarea maxLength={2000} className={fieldClass} disabled={operation.busy || operation.review} value={reason} onChange={e => setReason(e.target.value)} /></label>{closureWork && <label className="flex gap-2"><input type="checkbox" checked={allowClosure} disabled={operation.busy || operation.review} onChange={e => setAllowClosure(e.target.checked)} />Tôi xác nhận bố trí ca trong ngày nghỉ / lễ chung.</label>}<label className="flex gap-2"><input type="checkbox" checked={ack} disabled={operation.busy || operation.review} onChange={e => setAck(e.target.checked)} />Tôi đã kiểm tra giờ làm và các cán bộ có lịch thay đổi.</label><OperationError operation={operation} /><div className="flex flex-wrap gap-3"><Button variant="outline" disabled={operation.busy} onClick={() => setConfirm(false)}>Quay lại lịch</Button><Button disabled={operation.busy || operation.review || !ack || !reason.trim() || (closureWork && !allowClosure)} onClick={() => void publish()}>{operation.busy ? 'Đang công bố…' : 'Công bố lịch'}</Button></div></div></Modal>}
    {week && <ScheduleWeekPattern onClose={() => setWeek(false)} />}{history && <ScheduleHistory month={month} onClose={() => setHistory(false)} />}
    {resetDraft && <Modal open title="Lập lại lịch đang soạn?" description="Thao tác này bỏ toàn bộ thay đổi chưa công bố trong bản soạn cũ của phường, kể cả của cán bộ khác. Lịch chính thức được giữ nguyên." onOpenChange={v => !v && setResetDraft(false)} footer={<><Button variant="outline" onClick={() => setResetDraft(false)}>Quay lại</Button><Button onClick={() => { setUseOfficial(true); setResetDraft(false); }}>Dùng lịch chính thức</Button></>}><p>Kiểm tra lại lịch mới trước khi công bố. Bản trên hệ thống chỉ được thay thế khi bạn xác nhận công bố.</p></Modal>}
    {manager && base.confirmations.length > 0 && <p className="text-sm text-slate-600">Đã xem lịch: {base.confirmations.filter(c => c.confirmedAtUtc).length}/{base.confirmations.length} cán bộ.</p>}
    {!manager && user?.id !== officerId && <p role="alert">Không thể sửa lịch cán bộ khác.</p>}
  </div>;
}

const hourSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Chọn giờ hợp lệ.');
const daySchema = z.object({ rows: z.array(z.object({ shiftId: z.string(), shiftVersion: z.number(), start: hourSchema, end: hourSchema, next: z.boolean() })).max(20, 'Tối đa 20 ca mỗi ngày.') });
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
    if (result.some(s => data.leaves.some(l => l.officerId === officerId && Date.parse(l.startsAtUtc) < Date.parse(s.endsAt) && Date.parse(l.endsAtUtc) > Date.parse(s.startsAt)))) { form.setError('root', { message: 'Giờ làm trùng với thời gian nghỉ phép đã duyệt.' }); return; }
    if (merged.filter(s => scheduleDay(s.startsAt).slice(0, 7) === day.slice(0, 7)).length > 500) { form.setError('root', { message: 'Lịch phường vượt quá 500 ca trong tháng.' }); return; }
    onSave(result);
  });
  return <Modal open title={`Giờ làm ngày ${calendarDate(day)}`} description={`${name} · Giờ Việt Nam (24 giờ). Bỏ hết ca để xóa ca của ngày này. Thay đổi áp dụng sau khi công bố.`} onOpenChange={v => !v && guard.requestClose(onClose)}><form onSubmit={e => void submit(e)} className="space-y-4" noValidate>{array.fields.map((r, i) => <div key={r.id} className="schedule-time-row"><label className="staff-field">Từ giờ<input type="time" className={fieldClass} {...form.register(`rows.${i}.start`)} /></label><label className="staff-field">Đến giờ<input type="time" className={fieldClass} {...form.register(`rows.${i}.end`)} /></label><label className="flex items-center gap-2 text-sm"><input type="checkbox" {...form.register(`rows.${i}.next`)} />Kết thúc ngày hôm sau</label><Button variant="outline" type="button" aria-label={`Bỏ ca ${i + 1}`} onClick={() => array.remove(i)}>Bỏ ca</Button></div>)}<Button type="button" variant="outline" disabled={array.fields.length >= 20} onClick={() => array.append({ shiftId: crypto.randomUUID(), shiftVersion: 0, start: '13:00', end: '17:00', next: false })}>Thêm ca trong ngày</Button>{(form.formState.errors.root || form.formState.errors.rows) && <p role="alert" className="text-sm text-red-800">{form.formState.errors.root?.message || form.formState.errors.rows?.message || 'Kiểm tra giờ của từng ca.'}</p>}<div className="flex flex-wrap gap-3"><Button type="button" variant="outline" onClick={() => guard.requestClose(onClose)}>Quay lại</Button><Button type="submit">Áp dụng vào lịch</Button></div></form>{guard.confirmation}</Modal>;
}
function ScheduleHistory({ month, onClose }: { month: string; onClose: () => void }) {
  const query = useStaffQuery(['schedule-history', month], signal => workScheduleApi.history(month, signal));
  return <Modal open title="Các lần công bố lịch" onOpenChange={v => !v && onClose()}><QueryState query={query} empty={!query.data?.length} /><div className="space-y-3">{query.data?.map(r => <article key={r.id} className="staff-card"><h3>{r.status === 'BASELINE' ? 'Dữ liệu ban đầu' : 'Lịch đã công bố'}</h3><p>{r.reason}</p><p>{r.slots.length} ca{r.publishedAtUtc ? ` · ${new Date(r.publishedAtUtc).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}` : ''}</p></article>)}</div></Modal>;
}
