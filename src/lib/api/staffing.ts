import { z } from 'zod';
import { api } from './index';
import { servicePath, serviceUrls } from './serviceUrls';

const id = z.string().uuid();
const version = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
export const dispatchSchema = z.object({ id, applicationCode: z.string().nullish(), procedureId: id, procedureTitle: z.string(), status: z.string(), assignedOfficerId: id.nullish(), assignmentVersion: version, procedureCategoryId: z.number().int().nullish() });
const candidateSchema = z.object({ officerId: id, fullName: z.string().nullish(), eligible: z.boolean(), activeApplicationCount: z.number().int(), blockingReasons: z.array(z.string()) });
const assignmentSchema = z.object({ id, applicationId: id, fromOfficerId: id.nullish(), toOfficerId: id, actorId: id, version, reasonCode: z.string(), reason: z.string(), createdAt: z.string(), action: z.string() });
const page = <T extends z.ZodType>(item: T) => z.object({ items: z.array(item), page: z.number().int(), pageSize: z.number().int(), total: z.number().int() });
const manager = '/api/v1/manager/applications';
async function get<T extends z.ZodType>(path: string, schema: T, params?: Record<string, unknown>, signal?: AbortSignal): Promise<z.infer<T>> {
  return schema.parse((await api.get(servicePath(serviceUrls.workflow, path), { params, signal })).data);
}
async function post<T extends z.ZodType>(path: string, schema: T, input: unknown): Promise<z.infer<T>> {
  return schema.parse((await api.post(servicePath(serviceUrls.workflow, path), input)).data);
}
export type DispatchApplication = z.infer<typeof dispatchSchema>;
export type AssignmentInput = { officerId: string; expectedAssignmentVersion: number; reasonCode: string; reason: string };
export const staffingApi = {
  applications: (p: number, signal?: AbortSignal) => get(manager, page(dispatchSchema), { page: p, pageSize: 20 }, signal),
  candidates: (app: string, signal?: AbortSignal) => get(`${manager}/${app}/assignment-candidates`, z.array(candidateSchema), undefined, signal),
  assign: (app: string, input: AssignmentInput) => post(`${manager}/${app}/assignments`, assignmentSchema, input),
  assignments: (app: string, signal?: AbortSignal) => get(`${manager}/${app}/assignments`, z.array(assignmentSchema), undefined, signal),
};
