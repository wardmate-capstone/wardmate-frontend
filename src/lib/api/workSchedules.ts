import axios from 'axios';
import { z } from 'zod';
import { api } from './index';
import { leaveSchema } from './staffing';
import { servicePath, serviceUrls } from './serviceUrls';
import { sameDaysOff } from '../scheduleCalendar';

const guid = z.guid();
const natural = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
const time = z.string().refine(v => Number.isFinite(Date.parse(v)), 'Ngày giờ máy chủ không hợp lệ.');
const date = z.iso.date();
const hash = z.string().regex(/^[a-f\d]{64}$/i);
const monthSchema = date.refine(v => v.endsWith('-01') && Number(v.slice(0, 4)) >= 2000 && Number(v.slice(0, 4)) <= 2099);
const reason = z.string().trim().min(1, 'Vui lòng nhập lý do.').max(2000, 'Lý do tối đa 2.000 ký tự.');
const period = { startsAt: time, endsAt: time, reason };
const page = <T extends z.ZodType>(item: T) => z.object({ items: z.array(item), page: z.number().int().positive(), pageSize: z.number().int().positive(), total: natural });
const path = (suffix: string) => servicePath(serviceUrls.workflow, '/api/v1/staffing' + suffix);
function sameId<T extends { id: string }>(value: T, id: string): T {
  if (value.id.toLowerCase() !== id.toLowerCase()) throw new Error('Phản hồi không khớp dữ liệu yêu cầu. Vui lòng tải lại.');
  return value;
}
async function read<T extends z.ZodType>(suffix: string, schema: T, signal?: AbortSignal, params?: Record<string, unknown>): Promise<z.infer<T>> {
  return schema.parse((await api.get(path(suffix), { signal, params })).data);
}
async function write<T extends z.ZodType>(method: 'post' | 'put' | 'patch' | 'delete', suffix: string, data: unknown, schema: T, key?: string): Promise<z.infer<T>> {
  return schema.parse((await api.request({ method, url: path(suffix), data, headers: key ? { 'Idempotency-Key': guid.parse(key) } : undefined })).data);
}
export const draftSchema = z.object({
  id: guid, version: natural, metadataVersion: natural, templateVersionId: guid,
  startsAtUtc: time, endsAtUtc: time, reason: z.string(), documentRevisionId: guid.nullable(), submittedLeaveId: guid.nullable(), updatedAtUtc: time,
});
export type LeaveDraft = z.infer<typeof draftSchema>;
export const slotSchema = z.object({ shiftId: guid, officerId: guid, startsAt: time, endsAt: time, shiftVersion: natural });
export type ScheduleSlot = z.infer<typeof slotSchema>;
const dayOffSchema = z.object({ officerId: guid, date });
export type ScheduleDayOff = z.infer<typeof dayOffSchema>;
const revisionSchema = z.object({ id: guid, month: date, status: z.enum(['DRAFT', 'PUBLISHED', 'BASELINE']), version: natural, baseFingerprint: hash.or(z.literal('')),
  actorId: guid, reason: z.string(), publishedAtUtc: time.nullable(), slots: z.array(slotSchema), daysOff: z.array(dayOffSchema).default([]) })
  .refine(r => r.status === 'BASELINE' || r.baseFingerprint.length === 64, 'Phiên bản lịch thiếu dấu xác minh.');
export type ScheduleRevision = z.infer<typeof revisionSchema>;
const monthlySchema = z.object({ month: date, slots: z.array(slotSchema), baseFingerprint: hash, draft: revisionSchema.nullable(),
  daysOff: z.array(dayOffSchema), isPublished: z.boolean(), canEdit: z.boolean(), editDeadlineUtc: time,
  leaves: z.array(z.object({ id: guid, officerId: guid, startsAtUtc: time, endsAtUtc: time })),
  closures: z.array(z.object({ id: guid, closureDate: date, wardCode: z.string().nullable() })),
  confirmations: z.array(z.object({ officerId: guid, confirmedAtUtc: time.nullable() })),
});
const weekEntrySchema = z.object({ day: z.number().int().min(0).max(6), start: z.string().regex(/^\d{2}:\d{2}:\d{2}(\.\d+)?$/), end: z.string().regex(/^\d{2}:\d{2}:\d{2}(\.\d+)?$/), officerId: guid });
export type WeekEntry = z.infer<typeof weekEntrySchema>;
const weekSchema = z.object({ version: natural, entries: z.array(weekEntrySchema).max(200) });
const changeSchema = z.object({ id: guid, shiftId: guid, officerId: guid, wardCode: z.string(), originalStart: time, originalEnd: time, originalVersion: natural,
  proposedStart: time, proposedEnd: time, reason: z.string(), status: z.enum(['PENDING', 'APPROVED', 'REJECTED']), decidedBy: guid.nullable(), decidedAtUtc: time.nullable(), decisionReason: z.string().nullable() });
export type ShiftChange = z.infer<typeof changeSchema>;
const capabilitiesSchema = z.object({ wordRequired: z.boolean(), templateConfigured: z.boolean(), maxDocxBytes: z.number().int().positive() });
export type LeaveCapabilities = z.infer<typeof capabilitiesSchema>;
export const leaveDetailSchema = z.object({ leave: leaveSchema, hasSubmittedDocx: z.boolean(), submittedRevisionId: guid.nullable(), sha256: hash.nullable() });

export async function staffingDocx(suffix: string, signal?: AbortSignal, expectedHash?: string | null) {
  let blob: Blob;
  try {
    blob = (await api.get<Blob>(path(suffix), { responseType: 'blob', signal })).data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data instanceof Blob) {
      try { error.response.data = JSON.parse(await error.response.data.text()); } catch { /* Keep original response and HTTP status. */ }
    }
    throw error;
  }
  const bytes = new Uint8Array(await blob.arrayBuffer());
  if (bytes.length < 4 || bytes[0] !== 0x50 || bytes[1] !== 0x4b) throw new Error('Máy chủ chưa trả về tệp Word hợp lệ. Vui lòng tải lại.');
  if (expectedHash) {
    const digest = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))).map(b => b.toString(16).padStart(2, '0')).join('');
    if (digest.toLowerCase() !== expectedHash.toLowerCase()) throw new Error('Tệp Word không khớp bản đã lưu. Vui lòng tải lại.');
  }
  return { blob, fileName: 'don-xin-nghi.docx' };
}
export const workScheduleApi = {
  capabilities: (signal?: AbortSignal) => read('/capabilities', capabilitiesSchema, signal),
  template: (signal?: AbortSignal) => read('/leave-templates/current', z.object({ versionId: guid, sha256: hash }), signal),
  templateDocx: (id: string, sha256: string, signal?: AbortSignal) => staffingDocx(`/leave-templates/${guid.parse(id)}/docx`, signal, sha256),
  drafts: (p: number, signal?: AbortSignal) => read('/leave-drafts', page(draftSchema), signal, { page: p, pageSize: 20 }),
  draft: async (id: string, signal?: AbortSignal) => sameId(await read(`/leave-drafts/${guid.parse(id)}`, draftSchema, signal), id),
  createDraft: (input: { startsAt: string; endsAt: string; reason: string; templateVersionId: string }, key: string) => write('post', '/leave-drafts', z.object({ ...period, templateVersionId: guid }).parse(input), draftSchema, key),
  editDraft: async (id: string, input: { startsAt: string; endsAt: string; reason: string; expectedVersion: number }) => {
    const result = sameId(await write('patch', `/leave-drafts/${guid.parse(id)}`, z.object({ ...period, expectedVersion: natural }).parse(input), draftSchema), id);
    if (result.version <= input.expectedVersion || result.submittedLeaveId) throw new Error('Máy chủ chưa xác nhận phiên bản nháp mới. Đọc lại trạng thái.'); return result;
  },
  deleteDraft: async (id: string, version: number) => sameId(await write('delete', `/leave-drafts/${guid.parse(id)}?expectedVersion=${natural.parse(version)}`, undefined, draftSchema), id),
  draftDocx: (id: string, signal?: AbortSignal) => staffingDocx(`/leave-drafts/${guid.parse(id)}/docx`, signal),
  saveDocx: async (draft: LeaveDraft, file: File, maxBytes: number) => {
    if (!file.name.toLowerCase().endsWith('.docx') || !file.size || file.size > maxBytes) throw new Error('Chỉ nhận DOCX không rỗng trong giới hạn dung lượng cho phép.');
    const body = new FormData(); body.append('file', file); body.append('expectedVersion', String(draft.version)); body.append('metadataVersion', String(draft.metadataVersion));
    const result = draftSchema.parse((await api.put(path(`/leave-drafts/${draft.id}/docx`), body, { headers: { 'Content-Type': undefined } })).data);
    sameId(result, draft.id);
    if (result.version <= draft.version || result.metadataVersion !== draft.metadataVersion || !result.documentRevisionId || result.documentRevisionId === draft.documentRevisionId || result.submittedLeaveId) throw new Error('Máy chủ chưa xác nhận bản Word mới. Giữ nội dung và đọc lại trạng thái.');
    return result;
  },
  submit: (draft: LeaveDraft, key: string) => write('post', `/leave-drafts/${guid.parse(draft.id)}/submit`, z.object({ expectedVersion: natural, documentRevisionId: guid, metadataVersion: natural }).parse({ expectedVersion: draft.version, documentRevisionId: draft.documentRevisionId, metadataVersion: draft.metadataVersion }),
    z.object({ leaveId: guid, status: z.literal('PENDING'), version: natural, submittedAtUtc: time }), key),
  leaveDetail: async (id: string, signal?: AbortSignal) => {
    const result = await read(`/leaves/${guid.parse(id)}`, leaveDetailSchema, signal); sameId(result.leave, id); return result;
  },
  submittedDocx: (id: string, sha256?: string | null, signal?: AbortSignal) => staffingDocx(`/leaves/${guid.parse(id)}/submitted-docx`, signal, sha256),
  shiftImpact: (id: string, signal?: AbortSignal) => read(`/leaves/${guid.parse(id)}/shift-impact`, z.array(z.object({ shiftId: guid, shiftStartsAtUtc: time, shiftEndsAtUtc: time, overlapStartsAtUtc: time, overlapEndsAtUtc: time })), signal),
  month: async (month: string, signal?: AbortSignal) => {
    const result = await read(`/schedules/${monthSchema.parse(month)}`, monthlySchema, signal).catch(error => {
      if (error instanceof z.ZodError) throw new Error('API lịch chưa trả đủ dữ liệu ngày nghỉ và quyền sửa lịch. Cần cập nhật BE trước khi sử dụng.');
      throw error;
    });
    if (result.month !== month) throw new Error('Lịch máy chủ trả về không đúng tháng đang xem.'); return result;
  },
  week: (signal?: AbortSignal) => read('/week-pattern', weekSchema, signal),
  saveWeek: (version: number, entries: WeekEntry[]) => write('put', '/week-pattern', z.object({ expectedVersion: natural, entries: z.array(weekEntrySchema).max(200) }).parse({ expectedVersion: version, entries }), weekSchema),
  preview: async (month: string, copyFrom?: string, signal?: AbortSignal) => {
    const result = await read(`/schedules/${monthSchema.parse(month)}/preview`, z.object({ month: date, slots: z.array(slotSchema), closures: z.array(date), conflicts: z.array(z.string()), baseFingerprint: hash }), signal, copyFrom ? { copyFrom: monthSchema.parse(copyFrom) } : undefined);
    if (result.month !== month) throw new Error('Bản xem trước không khớp tháng đã chọn.'); return result;
  },
  saveMonth: async (month: string, input: { expectedVersion: number; baseFingerprint: string; slots: ScheduleSlot[]; reason: string; daysOff: ScheduleDayOff[] }) => {
    const result = await write('put', `/schedules/${monthSchema.parse(month)}/draft`, z.object({ expectedVersion: natural, baseFingerprint: hash, slots: z.array(slotSchema).max(500), reason, daysOff: z.array(dayOffSchema).max(3100) }).parse(input), revisionSchema);
    if (result.month !== month || result.status !== 'DRAFT' || result.version !== input.expectedVersion + 1 || result.baseFingerprint !== input.baseFingerprint || !sameDaysOff(result.daysOff, input.daysOff)) throw new Error('Máy chủ chưa xác nhận đúng bản nháp tháng. Vui lòng đọc lại lịch.'); return result;
  },
  publish: async (month: string, input: { revisionId: string; expectedVersion: number; allowClosure: boolean; reason: string }) => {
    const result = sameId(await write('post', `/schedules/${monthSchema.parse(month)}/publish`, z.object({ revisionId: guid, expectedVersion: natural, allowClosure: z.boolean(), reason }).parse(input), revisionSchema), input.revisionId);
    if (result.month !== month || result.status !== 'PUBLISHED' || result.version !== input.expectedVersion + 1) throw new Error('Máy chủ chưa xác nhận công bố đúng bản lịch. Vui lòng đọc lại.'); return result;
  },
  history: (month: string, signal?: AbortSignal) => read(`/schedules/${monthSchema.parse(month)}/history`, z.array(revisionSchema), signal),
  confirm: (month: string, fingerprint: string) => write('post', `/schedules/${monthSchema.parse(month)}/confirm`, { fingerprint: hash.parse(fingerprint) }, z.object({ id: guid, officerId: guid, month: date, fingerprint: hash, confirmedAtUtc: time })),
  changes: (p: number, signal?: AbortSignal) => read('/shift-change-requests', page(changeSchema), signal, { page: p, pageSize: 20 }),
  requestChange: (input: { shiftId: string; expectedVersion: number; startsAt: string; endsAt: string; reason: string }) => write('post', '/shift-change-requests', z.object({ shiftId: guid, expectedVersion: natural, ...period }).parse(input), changeSchema),
  decideChange: async (id: string, decision: 'APPROVED' | 'REJECTED', text: string) => sameId(await write('post', `/shift-change-requests/${guid.parse(id)}/decision`, { decision, reason: reason.parse(text) }, changeSchema), id),
};
