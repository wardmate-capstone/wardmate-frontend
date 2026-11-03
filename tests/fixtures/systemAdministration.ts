import type { Page } from '@playwright/test';
import { authReply, mockWorkspaceAuth } from './auth';

export const eventId = 'aaaaaaaa-0000-0000-0000-000000000001';
export const auditId = 'aaaaaaaa-0000-0000-0000-000000000002';
export const actorId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
export const auditEvent = {
  eventId, source: 'workflow', schema: 'public', entity: 'applications', entityKey: { id: eventId }, action: 'UPDATE',
  before: { status: 'SUBMITTED', comment: '[REDACTED]' }, after: { status: 'UNDER_REVIEW', comment: '[REDACTED]' },
  actorId: null, clientIp: null, traceId: 'trace-audit-test', occurredAtUtc: '2026-11-03T01:30:00Z',
};
export const settingAudit = {
  id: auditId, actorId, action: 'system.setting.updated', entityKey: 'analytics.lookbackDays', previousValue: 7,
  newValue: 14, version: 1, reason: 'Điều chỉnh kỳ tổng hợp kiểm thử', clientIp: null, traceId: 'trace-setting-test', occurredAtUtc: '2026-11-03T02:30:00Z',
};
export async function mockSystemAdministration(page: Page, permissions?: string[]) {
  await mockWorkspaceAuth(page, ['IT_ADMIN'], permissions);
  const state = {
    requests: [] as { method: string; path: string; query: Record<string, string>; body: unknown }[],
    setting: { key: 'analytics.lookbackDays', value: 7, version: 0, updatedBy: null as string | null, updatedAtUtc: null as string | null },
    listError: '', detailError: false, wrongDetail: false, wrongPage: false, invalidResponse: false,
    conflict: false, failAfterSave: false, validationError: false, empty: false,
  };
  await page.route('http://localhost:5000/api/v1/system/**', async route => {
    const request = route.request();
    if (request.method() === 'OPTIONS') return authReply(route, { status: 204 });
    const url = new URL(request.url());
    const path = url.pathname;
    const method = request.method();
    const body = request.postData() ? request.postDataJSON() : null;
    state.requests.push({ method, path, query: Object.fromEntries(url.searchParams), body });
    if (path.endsWith('/settings/analytics.lookbackDays') && method === 'PUT') {
      if (state.conflict) {
        state.setting = { ...state.setting, value: 21, version: 1, updatedBy: actorId, updatedAtUtc: '2026-11-03T02:00:00Z' };
        return authReply(route, { status: 409, json: { code: 'system.setting_conflict' } });
      }
      if (state.validationError) return authReply(route, { status: 400, json: { errors: { Reason: ['Lý do cần rõ nội dung điều chỉnh.'] } } });
      state.setting = { ...state.setting, value: body.value, version: state.setting.version + 1, updatedBy: actorId, updatedAtUtc: '2026-11-03T02:00:00Z' };
      if (state.failAfterSave) return authReply(route, { status: 503, json: {} });
      return authReply(route, { json: state.setting });
    }
    if (path.endsWith('/settings')) return authReply(route, { json: [state.setting] });
    if (path.endsWith('/settings/analytics.lookbackDays')) return authReply(route, { json: state.setting });
    const business = path.includes('audit-events');
    const detail = /\/[0-9a-f-]{36}$/.test(path);
    if (detail) {
      if (state.detailError) return authReply(route, { status: 404, json: { code: business ? 'audit.not_found' : 'system.audit_not_found' } });
      return authReply(route, { json: business ? { ...auditEvent, eventId: state.wrongDetail ? auditId : path.split('/').at(-1) } : settingAudit });
    }
    if (state.listError) return authReply(route, { status: state.listError === 'analytics.forbidden' ? 403 : 503, json: { code: state.listError } });
    if (state.invalidResponse) return authReply(route, { json: { items: null } });
    const pageNumber = Number(url.searchParams.get('page') || 1);
    const pageSize = Number(url.searchParams.get('pageSize') || 20);
    const items = state.empty ? [] : business ? Array.from({ length: pageNumber === 1 ? pageSize : 1 }, (_, index) => ({ ...auditEvent, eventId: `aaaaaaaa-0000-0000-0000-${String((pageNumber - 1) * pageSize + index + 1).padStart(12, '0')}` })) : [settingAudit];
    return authReply(route, { json: { items, page: state.wrongPage ? pageNumber + 1 : pageNumber, pageSize, totalCount: state.empty ? 0 : business ? pageSize + 1 : 1, coverage: null, unassignedDeadlines: null } });
  });
  return state;
}
