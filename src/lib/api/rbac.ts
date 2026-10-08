import axios from 'axios';
import { z } from 'zod';
import { api } from './index';

const permissionSchema = z.object({ id: z.number().int().positive(), permissionCode: z.string(), permissionName: z.string(), module: z.string() });
const roleSchema: z.ZodType<Role> = z.object({ id: z.number().int().positive(), roleName: z.string(), description: z.string().nullish(), isSystem: z.boolean(), permissions: z.array(permissionSchema) });
const auditSchema = z.object({ id: z.string(), actorUserId: z.string(), action: z.string(), targetUserId: z.string().nullish(), roleId: z.number().int().positive().nullish(), permissionId: z.number().int().positive().nullish(), details: z.string(), createdAt: z.string() });
const page = <T extends z.ZodTypeAny>(item: T) => z.object({ items: z.array(item), page: z.number().int().positive(), pageSize: z.number().int().positive(), total: z.number().int().nonnegative() });

export type Permission = z.infer<typeof permissionSchema>;
export type Role = { id: number; roleName: string; description?: string | null; isSystem: boolean; permissions: Permission[] };
export type AuditLog = z.infer<typeof auditSchema>;
export type RbacPage<T> = { items: T[]; page: number; pageSize: number; total: number };
export type RoleInput = { roleName: string; description?: string | null };

const base = '/api/v1/rbac';
export const rbacApi = {
  roles: async (pageNumber = 1, pageSize = 20, signal?: AbortSignal): Promise<RbacPage<Role>> => page(roleSchema).parse((await api.get(`${base}/roles`, { params: { page: pageNumber, pageSize }, signal })).data),
  role: async (roleId: number, signal?: AbortSignal) => roleSchema.parse((await api.get(`${base}/roles/${roleId}`, { signal })).data),
  createRole: async (input: RoleInput) => roleSchema.parse((await api.post(`${base}/roles`, input)).data),
  updateRole: async (roleId: number, input: RoleInput) => roleSchema.parse((await api.put(`${base}/roles/${roleId}`, input)).data),
  deleteRole: async (roleId: number) => { await api.delete(`${base}/roles/${roleId}`); },
  permissions: async (signal?: AbortSignal) => z.array(permissionSchema).parse((await api.get(`${base}/permissions`, { signal })).data),
  grantPermission: async (roleId: number, permissionId: number) => { await api.put(`${base}/roles/${roleId}/permissions/${permissionId}`); },
  revokePermission: async (roleId: number, permissionId: number) => { await api.delete(`${base}/roles/${roleId}/permissions/${permissionId}`); },
  userRoles: async (userId: string, signal?: AbortSignal) => z.array(roleSchema).parse((await api.get(`${base}/users/${userId}/roles`, { signal })).data),
  grantUserRole: async (userId: string, roleId: number) => { await api.put(`${base}/users/${userId}/roles/${roleId}`); },
  revokeUserRole: async (userId: string, roleId: number) => { await api.delete(`${base}/users/${userId}/roles/${roleId}`); },
  audit: async (pageNumber = 1, pageSize = 20, signal?: AbortSignal): Promise<RbacPage<AuditLog>> => page(auditSchema).parse((await api.get(`${base}/audit-logs`, { params: { page: pageNumber, pageSize }, signal })).data),
};

export function rbacError(error: unknown): string {
  if (error instanceof z.ZodError) return 'Dữ liệu phân quyền từ máy chủ không đúng định dạng.';
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    const message = data?.detail ?? data?.title;
    if (typeof message === 'string' && message.trim()) return message.slice(0, 500);
    if (error.response?.status === 403) return 'Bạn không có quyền quản trị vai trò và phân quyền.';
    if (error.response?.status === 409) return 'Thao tác bị từ chối do ràng buộc an toàn phân quyền.';
    if (!error.response) return 'Không thể kết nối dịch vụ IAM.';
  }
  return error instanceof Error ? error.message : 'Không thể hoàn tất thao tác phân quyền.';
}
