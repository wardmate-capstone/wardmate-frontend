import type { Page } from '@playwright/test';
import { authReply, mockWorkspaceAuth } from './auth';

export const operationId = 'cccccccc-0000-0000-0000-000000000001';
export const otherOperationId = 'cccccccc-0000-0000-0000-000000000002';
export const observation = { id: operationId, serviceName: 'iam', status: 'Healthy', httpStatus: 200, responseTimeMs: 45, errorCode: null, checkedAtUtc: '2026-11-03T08:00:00Z' };
export const backup = { id: operationId, serviceName: 'iam', status: 'Succeeded', sizeBytes: 2048, sha256: 'a'.repeat(64), requestedBy: null, reason: 'Sao lưu kiểm thử', createdAtUtc: '2026-11-03T08:00:00Z', startedAtUtc: '2026-11-03T08:00:01Z', completedAtUtc: '2026-11-03T08:00:10Z' as string | null, verifiedAtUtc: null as string | null, restoreTestedAtUtc: null, errorCode: null as string | null };
export async function mockSystemOperations(page: Page) {
  await mockWorkspaceAuth(page, ['IT_ADMIN']);
  const state = { requests: [] as { path: string; method: string; query: Record<string, string>; body: unknown }[],
    error: '', verifyError: '', wrongId: false, wrongService: false, empty: false, backup: { ...backup },
    autoProgress: false, backupReads: 0, createError: '', checkStatus: 202, pageMismatch: false };
  await page.route('http://localhost:5000/api/v1/system/**', async route => {
    const request = route.request(); if (request.method() === 'OPTIONS') return authReply(route, { status: 204 });
    const url = new URL(request.url()), path = url.pathname, method = request.method();
    const body = request.postData() ? request.postDataJSON() : null;
    state.requests.push({ path, method, query: Object.fromEntries(url.searchParams), body });
    if (state.error) return authReply(route, { status: state.error === 'analytics.forbidden' ? 403 : 503, json: { code: state.error } });
    if (path.endsWith('/health/check-now')) return authReply(route, { status: state.checkStatus, json: { requestId: operationId, status: 'Queued' } });
    if (path.endsWith('/health/services')) return authReply(route, { json: state.empty ? [] : [observation, { ...observation, id: '00000000-0000-0000-0000-000000000000', serviceName: 'new-service', status: 'Unknown', httpStatus: null, responseTimeMs: 0, errorCode: 'not_checked', checkedAtUtc: '0001-01-01T00:00:00Z' }, { ...observation, id: otherOperationId, serviceName: 'catalog', status: 'Unknown', errorCode: 'stale_observation' }] });
    if (path.includes('/health/services/')) return authReply(route, { json: { ...observation, serviceName: state.wrongService ? 'another' : path.split('/').at(-1) } });
    if (path.endsWith('/verify')) {
      if (state.verifyError) { state.backup.errorCode = 'checksum_mismatch'; return authReply(route, { status: 400, json: { code: state.verifyError } }); }
      state.backup = { ...state.backup, status: 'Verified', verifiedAtUtc: '2026-11-03T08:01:00Z' };
      return authReply(route, { json: { ...state.backup, id: state.wrongId ? otherOperationId : operationId } });
    }
    if (path.endsWith('/backups') && method === 'POST') {
      if (state.createError) return authReply(route, { status: state.createError === 'system.backup_in_progress' ? 409 : 503, json: { code: state.createError } });
      state.backup = { ...state.backup, serviceName: body.serviceName, reason: body.reason, status: 'Queued', completedAtUtc: null };
      return authReply(route, { status: 202, json: state.backup });
    }
    if (/\/backups\/[0-9a-f-]{36}$/.test(path)) {
      state.backupReads++;
      if (state.autoProgress && state.backup.status !== 'Verified') state.backup.status = state.backupReads < 2 ? 'Queued' : state.backupReads < 3 ? 'Running' : 'Succeeded';
      return authReply(route, { json: { ...state.backup, id: state.wrongId ? otherOperationId : operationId } });
    }
    const pageNumber = Number(url.searchParams.get('page') || 1), pageSize = Number(url.searchParams.get('pageSize') || 20);
    return authReply(route, { json: { items: state.empty ? [] : [path.endsWith('/history') ? observation : state.backup], totalCount: state.empty ? 0 : 1, page: state.pageMismatch ? pageNumber + 1 : pageNumber, pageSize } });
  });
  return state;
}
