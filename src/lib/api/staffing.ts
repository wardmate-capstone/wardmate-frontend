import { z } from 'zod';
import { api } from './index';
import { servicePath, serviceUrls } from './serviceUrls';

const id = z.string().uuid();
const version = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
export const dispatchSchema = z.object({ id, applicationCode: z.string().nullish(), procedureId: id, procedureTitle: z.string(), status: z.string(), assignedOfficerId: id.nullish(), assignmentVersion: version, procedureCategoryId: z.number().int().nullish() });
const candidateSchema = z.object({ officerId: id, fullName: z.string().nullish(), eligible: z.boolean(), activeApplicationCount: z.number().int(), blockingReasons: z.array(z.string()) });
const assignmentSchema = z.object({ id, applicationId: id, fromOfficerId: id.nullish(), toOfficerId: id, actorId: id, version, reasonCode: z.string(), reason: z.string(), createdAt: z.string(), action: z.string() });
const shiftSchema = z.object({ id, officerId: id, wardCode: z.string(), startsAtUtc: z.string(), endsAtUtc: z.string(), cancelledAtUtc: z.string().nullish(), cancellationReason: z.string().nullish() });
const leaveSchema = z.object({ id, officerId: id, wardCode: z.string(), startsAtUtc: z.string(), endsAtUtc: z.string(), reason: z.string(), status: z.string(), version, decisionReason: z.string().nullish() });
const historySchema = z.object({ id, actorId: id, version, fromStatus: z.string(), toStatus: z.string(), reason: z.string(), createdAtUtc: z.string() });
const page = <T extends z.ZodType>(item: T) => z.object({ items: z.array(item), page: z.number().int(), pageSize: z.number().int(), total: z.number().int() });
const root = '/api/v1/staffing';
const manager = '/api/v1/manager/applications';
async function get<T extends z.ZodType>(path: string, schema: T, params?: Record<string, unknown>, signal?: AbortSignal): Promise<z.infer<T>> {
  return schema.parse((await api.get(servicePath(serviceUrls.workflow, path), { params, signal })).data);
}
async function post<T extends z.ZodType>(path: string, schema: T, input: unknown): Promise<z.infer<T>> {
  return schema.parse((await api.post(servicePath(serviceUrls.workflow, path), input)).data);
}
export type DispatchApplication = z.infer<typeof dispatchSchema>;
export type Leave = z.infer<typeof leaveSchema>;
export type Shift = z.infer<typeof shiftSchema>;
export type AssignmentInput = { officerId: string; expectedAssignmentVersion: number; reasonCode: string; reason: string };
export const staffingApi = {
  applications: (p: number, signal?: AbortSignal) => get(manager, page(dispatchSchema), { page: p, pageSize: 20 }, signal),
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
};
