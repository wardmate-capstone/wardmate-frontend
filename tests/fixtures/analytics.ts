import type { Page } from '@playwright/test';
import { authReply } from './auth';
export const analyticsIds = { procedure: '10000000-0000-4000-8000-000000000003', officer: '11111111-1111-4111-8111-111111111111', application: '10000000-0000-4000-8000-000000000001', feedback: '10000000-0000-4000-8000-000000000009' };
export const savedFeedback = { id: analyticsIds.feedback, applicationId: analyticsIds.application, rating: 5, comment: 'Hỗ trợ tận tình', createdAtUtc: '2026-10-20T01:00:00Z' };
export async function mockAnalytics(page: Page) {
  const requests: { path: string; method: string; body: unknown; query: URLSearchParams }[] = [];
  const state = { requests, fail: '', empty: false, malformed: false, wrongPeriod: false, wrongPage: false, duplicateDay: false, jobState: 'Succeeded', saved: false, conflict: false, wrongApplication: false, postCount: 0 };
  await page.route('**/api/v1/analytics/**', async route => {
    if (route.request().method() === 'OPTIONS') return authReply(route, { status: 204 });
    const url = new URL(route.request().url()); const path = url.pathname; const method = route.request().method();
    requests.push({ path, method, query: url.searchParams, body: method === 'POST' ? route.request().postDataJSON() : null });
    if (state.fail) return authReply(route, { status: state.fail === 'analytics.forbidden' ? 403 : 503, json: { code: state.fail, title: state.fail === 'analytics.forbidden' ? 'Không có phạm vi phường phù hợp.' : 'Chức năng chưa được bật.' } });
    if (state.malformed) return authReply(route, { json: { unexpected: true } });
    const from = url.searchParams.get('from') || '2026-10-01'; const to = url.searchParams.get('to') || '2026-10-23';
    const totals = { receivedCount: 12, readyCount: 8, revisionRequestedCount: 3, resubmittedCount: 2, cancelledCount: 1, legacyApprovedCount: 0, legacyRejectedCount: 0 };
    const coverage = { from: state.wrongPeriod ? '2000-01-01' : from, to, missingDates: [from], oldestSourceAtUtc: null, latestRefreshAtUtc: null, timeZone: 'Asia/Ho_Chi_Minh' };
    const deadlines = { completedOnTime: 0, completedLate: 0, completedMissingDeadline: 8, completedNotApplicable: 0, completedSampleCount: 0, openOverdue: 2, openMissingDeadline: 1, openNotApplicable: 0, openPaused: 0, asOfUtc: '2026-10-23T01:00:00Z', onTimeRate: null, lateRate: null };
    if (state.empty) {
      for (const key of Object.keys(totals) as Array<keyof typeof totals>) totals[key] = 0;
      deadlines.completedMissingDeadline = 0; deadlines.openOverdue = 0; deadlines.openMissingDeadline = 0;
    }
    const paged = (items: unknown[]) => ({ items, page: state.wrongPage ? 999 : Number(url.searchParams.get('page') || 1), pageSize: Number(url.searchParams.get('pageSize') || 20), totalCount: 21, coverage, unassignedDeadlines: deadlines });
    let json: unknown;
    if (path.endsWith('/overview')) json = { totals, coverage, onTimeRate: null, lateRate: null, timelinessStatus: 'NO_KNOWN_COMPLETED_DEADLINES', deadlines };
    else if (path.endsWith('/trends')) {
      const length = (Date.parse(to) - Date.parse(from)) / 86400000 + 1;
      const items = Array.from({ length }, (_, index) => ({ date: new Date(Date.parse(from) + index * 86400000).toISOString().slice(0, 10), totals, deadlines }));
      if (state.duplicateDay && items.length > 1) items[1].date = items[0].date;
      json = { items, coverage, currentBacklog: deadlines };
    }
    else if (path.endsWith('/procedures')) json = paged([{ procedureId: analyticsIds.procedure, totals, deadlines }]);
    else if (path.endsWith('/officers')) json = paged([{ officerId: analyticsIds.officer, readyCount: 8, revisionRequestedCount: 3, durationSampleCount: 2, averageElapsedMinutes: 45, deadlines }]);
    else if (path.endsWith('/feedback/summary')) json = { totalCount: state.empty ? 0 : 1, averageRating: state.empty ? null : 5, satisfactionRate: state.empty ? null : 100, ratingCounts: { '1': 0, '2': 0, '3': 0, '4': 0, '5': state.empty ? 0 : 1 } };
    else if (path.endsWith('/feedback')) json = paged([savedFeedback]);
    else if (path.endsWith('/rebuild')) return authReply(route, { status: 202, json: { jobId: '123' } });
    else json = { jobId: path.split('/').pop(), state: state.jobState, createdAtUtc: '2026-10-23T01:00:00Z' };
    return authReply(route, { json });
  });
  await page.route('**/api/v1/citizen/feedback/*', async route => {
    if (route.request().method() === 'OPTIONS') return authReply(route, { status: 204 });
    const reply = { ...savedFeedback, applicationId: state.wrongApplication ? analyticsIds.procedure : analyticsIds.application };
    if (route.request().method() === 'GET') return authReply(route, state.saved ? { json: reply } : { status: 404, json: { code: 'feedback.not_found' } });
    state.postCount++;
    const body = route.request().postDataJSON();
    requests.push({ path: new URL(route.request().url()).pathname, method: 'POST', body, query: new URLSearchParams() });
    if (state.conflict) { state.saved = true; return authReply(route, { status: 409, json: { code: 'feedback.already_exists', title: 'Hồ sơ đã được đánh giá.' } }); }
    state.saved = true;
    return authReply(route, { status: 201, json: { ...reply, ...body } });
  });
  return state;
}
