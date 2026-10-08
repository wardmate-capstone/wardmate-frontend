export type WorkspaceId = 'citizen' | 'officer' | 'manager' | 'procedure-manager' | 'admin';

const workspaceRules: Record<WorkspaceId, { roles: string[]; permissions: string[] }> = {
  citizen: { roles: ['REGISTERED_CITIZEN'], permissions: ['document.submissions.'] },
  officer: { roles: ['FRONT_DESK_OFFICER'], permissions: [] },
  manager: { roles: ['MANAGER'], permissions: [] },
  'procedure-manager': { roles: ['PROCEDURE_MANAGER'], permissions: ['procedure.manage', 'procedure.create', 'procedure.update', 'procedure.publish', 'procedure.status', 'document.templates.'] },
  admin: { roles: ['IT_ADMIN'], permissions: ['iam.accounts.', 'iam.wards.', 'iam.rbac.', 'iam.audit.', 'iam.manage'] },
};

export function hasAnyPermission(userPermissions: string[], required: string[]) {
  return required.some(rule => userPermissions.some(permission => rule.endsWith('.') ? permission.startsWith(rule) : permission === rule));
}

export function canAccessWorkspace(workspace: WorkspaceId, roles: string[], permissions: string[]) {
  const rule = workspaceRules[workspace];
  return rule.roles.some(role => roles.includes(role)) || hasAnyPermission(permissions, rule.permissions);
}

export function canAccessItem(roles: string[], permissions: string[], requiredPermissions?: string[], fallbackRoles?: string[]) {
  return (!requiredPermissions?.length && !fallbackRoles?.length)
    || (!!requiredPermissions?.length && hasAnyPermission(permissions, requiredPermissions))
    || (!!fallbackRoles?.length && fallbackRoles.some(role => roles.includes(role)));
}
