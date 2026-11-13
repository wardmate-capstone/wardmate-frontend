import { z } from 'zod';
import { api } from './index';
import { servicePath, serviceUrls } from './serviceUrls';

const id = z.guid();
const version = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
// Bỏ dấu tiếng Việt và chữ hoa để tìm kiếm không phân biệt cách gõ
const foldText = (value: string) => value.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();
export const dispatchSchema = z.object({ id, applicationCode: z.string().nullish(), procedureId: id, procedureTitle: z.string(), status: z.string(), assignedOfficerId: id.nullish(), assignedOfficerName: z.string().nullish(), assignmentVersion: version, procedureCategoryId: z.number().int().nullish() });
const candidateSchema = z.object({ officerId: id, fullName: z.string().nullish(), eligible: z.boolean(), activeApplicationCount: z.number().int(), blockingReasons: z.array(z.string()) });
const assignmentSchema = z.object({ id, applicationId: id, fromOfficerId: id.nullish(), toOfficerId: id, actorId: id, version, reason: z.string().nullish(), createdAt: z.string(), action: z.string(), fromOfficerName: z.string().nullish(), toOfficerName: z.string().nullish(), actorName: z.string().nullish() });
const shiftSchema = z.object({ id, officerId: id, wardCode: z.string(), startsAtUtc: z.string(), endsAtUtc: z.string(), version: version.optional(), cancelledAtUtc: z.string().nullish(), cancellationReason: z.string().nullish() });
export const leaveSchema = z.object({ id, officerId: id, wardCode: z.string(), startsAtUtc: z.string(), endsAtUtc: z.string(), reason: z.string(), status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED']), version, decisionReason: z.string().nullish() });
const historySchema = z.object({ id, actorId: id, version, fromStatus: z.string(), toStatus: z.string(), reason: z.string(), createdAtUtc: z.string() });
// Tham vấn: specialistId null khi cán bộ phụ trách vừa gửi yêu cầu (PENDING_DISPATCH), chờ Manager chọn người tư vấn (STAFFING-01)
const consultationSchema = z.object({ id, applicationId: id, specialistId: id.nullish(), requestedBy: id, applicationVersion: version, assignmentVersion: version, question: z.string(), answer: z.string().nullish(), status: z.string(), version, createdAtUtc: z.string(), answeredAtUtc: z.string().nullish(), closedAtUtc: z.string().nullish(), closedBy: id.nullish(), closeReason: z.string().nullish(), applicationCode: z.string().nullish(), specialistName: z.string().nullish(), requestedByName: z.string().nullish(), closedByName: z.string().nullish(), dispatchedBy: id.nullish(), dispatchedAtUtc: z.string().nullish(), decision: z.string().nullish(), willingToTakeOver: z.boolean().nullish() });
const specialistCandidateSchema = z.object({ officerId: id, fullName: z.string().nullish(), assignedCategories: z.array(z.number().int()).nullish(), eligible: z.boolean(), blockingReasons: z.array(z.string()) });
const page = <T extends z.ZodType>(item: T) => z.object({ items: z.array(item), page: z.number().int(), pageSize: z.number().int(), total: z.number().int() });
const root = '/api/v1/staffing';
const manager = '/api/v1/manager/applications';
const consult = (applicationId: string) => `/api/v1/applications/${applicationId}/consultations`;
async function get<T extends z.ZodType>(path: string, schema: T, params?: Record<string, unknown>, signal?: AbortSignal): Promise<z.infer<T>> {
  return schema.parse((await api.get(servicePath(serviceUrls.workflow, path), { params, signal })).data);
}
async function post<T extends z.ZodType>(path: string, schema: T, input: unknown): Promise<z.infer<T>> {
  return schema.parse((await api.post(servicePath(serviceUrls.workflow, path), input)).data);
}
export type DispatchApplication = z.infer<typeof dispatchSchema>;
export type Consultation = z.infer<typeof consultationSchema>;
export type SpecialistCandidate = z.infer<typeof specialistCandidateSchema>;
export type ConsultationDecision = 'DECLINE_REQUEST' | 'KEEP_ASSIGNEE' | 'TRANSFER_TO_SPECIALIST';
export type Leave = z.infer<typeof leaveSchema>;
export type Shift = z.infer<typeof shiftSchema>;
export type AssignmentInput = { officerId: string; expectedAssignmentVersion: number; reason: string };
export const staffingApi = {
  applications: (p: number, signal?: AbortSignal, pageSize = 20) => get(manager, page(dispatchSchema), { page: p, pageSize }, signal),
  // BE trả danh sách điều phối theo CreatedAt tăng dần và chưa có tham số sắp xếp.
  // Để hồ sơ mới nhất lên đầu: lấy tổng số, đọc đúng khối 100 mục chứa trang cần xem rồi đảo ngược.
  applicationsNewestFirst: async (p: number, signal?: AbortSignal, pageSize = 20) => {
    const block = 100;
    const first = await get(manager, page(dispatchSchema), { page: 1, pageSize: block }, signal);
    const end = first.total - (p - 1) * pageSize;
    if (end <= 0) return { ...first, items: [], page: p, pageSize };
    const start = Math.max(0, end - pageSize);
    const rows: DispatchApplication[] = [];
    for (let b = Math.floor(start / block); b <= Math.floor((end - 1) / block); b++) {
      const data = b === 0 ? first : await get(manager, page(dispatchSchema), { page: b + 1, pageSize: block }, signal);
      data.items.forEach((item, i) => { const index = b * block + i; if (index >= start && index < end) rows.push(item); });
    }
    return { items: rows.reverse(), page: p, pageSize, total: first.total };
  },
  // BE chưa có tham số tìm kiếm: đọc đủ danh sách trong phường (100 mục/lần), lọc theo mã hồ sơ,
  // tên thủ tục, tên cán bộ phụ trách (không phân biệt dấu), mới nhất lên đầu rồi phân trang ở FE.
  searchApplications: async (term: string, p: number, signal?: AbortSignal, pageSize = 20) => {
    const block = 100;
    const all: DispatchApplication[] = [];
    for (let n = 1; ; n++) {
      const data = await get(manager, page(dispatchSchema), { page: n, pageSize: block }, signal);
      all.push(...data.items);
      if (!data.items.length || all.length >= data.total) break;
    }
    const words = foldText(term).split(/\s+/).filter(Boolean);
    const matched = all.filter(app => {
      const text = foldText([app.applicationCode, app.procedureTitle, app.assignedOfficerName].filter(Boolean).join(' '));
      return words.every(w => text.includes(w));
    }).reverse();
    return { items: matched.slice((p - 1) * pageSize, p * pageSize), page: p, pageSize, total: matched.length };
  },
  candidates: (app: string, signal?: AbortSignal) => get(`${manager}/${app}/assignment-candidates`, z.array(candidateSchema), undefined, signal),
  assign: (app: string, input: AssignmentInput) => post(`${manager}/${app}/assignments`, assignmentSchema, input),
  assignments: (app: string, signal?: AbortSignal) => get(`${manager}/${app}/assignments`, z.array(assignmentSchema), undefined, signal),
  shifts: (from: string, to: string, signal?: AbortSignal) => get(`${root}/shifts`, z.array(shiftSchema), { from, to }, signal),
  createShift: (input: { officerId: string; startsAt: string; endsAt: string }) => post(`${root}/shifts`, shiftSchema, input),
  cancelShift: (shift: string, reason: string) => post(`${root}/shifts/${shift}/cancel`, shiftSchema, { reason }),
  leaves: (from: string, to: string, signal?: AbortSignal) => get(`${root}/leaves`, z.array(leaveSchema), { from, to }, signal),
  requestLeave: (input: { startsAt: string; endsAt: string; reason: string }) => post(`${root}/leaves`, leaveSchema, input),
  decide: (leave: string, expectedVersion: number, decision: string, reason: string) => post(`${root}/leaves/${leave}/decision`, leaveSchema, { expectedVersion, decision, reason }),
  impact: (leave: string, signal?: AbortSignal) => get(`${root}/leaves/${leave}/impact`, z.array(dispatchSchema), undefined, signal),
  leaveHistory: (leave: string, signal?: AbortSignal) => get(`${root}/leaves/${leave}/history`, z.array(historySchema), undefined, signal),
  inbox: (p: number, signal?: AbortSignal, status?: string) => get(`${root}/consultations`, page(consultationSchema), { page: p, pageSize: 20, status: status || undefined }, signal),
  consultations: (app: string, signal?: AbortSignal) => get(consult(app), z.array(consultationSchema), undefined, signal),
  createConsultation: (app: string, input: { specialistId: string; expectedAssignmentVersion: number; question: string }) => post(consult(app), consultationSchema, input),
  // Cán bộ đang phụ trách hồ sơ gửi yêu cầu tham vấn; Manager chọn người tư vấn sau
  requestConsultation: (app: string, input: { expectedAssignmentVersion: number; question: string }) => post(`${consult(app)}/requests`, consultationSchema, input),
  specialistCandidates: (app: string, signal?: AbortSignal) => get(`${consult(app)}/specialist-candidates`, z.array(specialistCandidateSchema), undefined, signal),
  dispatchConsultation: (item: Consultation, specialistId: string) => post(`${consult(item.applicationId)}/${item.id}/dispatch`, consultationSchema, { expectedVersion: item.version, specialistId }),
  answer: (item: Consultation, text: string, willingToTakeOver = false) => post(`${consult(item.applicationId)}/${item.id}/answer`, consultationSchema, { expectedVersion: item.version, text, willingToTakeOver }),
  // decision bỏ trống = đóng tham vấn đang mở (luồng cũ); TRANSFER_TO_SPECIALIST cần assignmentVersion hiện tại của hồ sơ
  close: (item: Consultation, text: string, decision?: ConsultationDecision, expectedAssignmentVersion?: number) => post(`${consult(item.applicationId)}/${item.id}/close`, consultationSchema, { expectedVersion: item.version, text, ...(decision ? { decision } : {}), ...(decision === 'TRANSFER_TO_SPECIALIST' ? { expectedAssignmentVersion } : {}) }),
  documentAccess: (app: string, signal?: AbortSignal) => get(`${consult(app)}/document-access`, z.object({ allowed: z.boolean(), applicationId: id, version }), undefined, signal),
};
