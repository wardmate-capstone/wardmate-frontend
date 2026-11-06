import { createHash, randomUUID } from 'node:crypto';
import JSZip from 'jszip';
import type { Page } from '@playwright/test';
import { authReply, mockWorkspaceAuth } from './auth';
import { mockAnalytics } from './analytics';
import { mockCatalog } from './procedures';
import { createPreviewDocx } from './formTemplateDocx';

export const scheduleIds = { officer: '11111111-1111-4111-8111-111111111111', officer2: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', manager: '22222222-2222-4222-8222-222222222222', draft: '33333333-3333-4333-8333-333333333333', template: '44444444-4444-4444-8444-444444444444', revision: '55555555-5555-4555-8555-555555555555', leave: '66666666-6666-4666-8666-666666666666', shift: '77777777-7777-4777-8777-777777777777', monthly: '88888888-8888-4888-8888-888888888888', change: '99999999-9999-4999-8999-999999999999' };
const ids = scheduleIds;
export async function mockWorkSchedules(page: Page, manager = false) {
  await page.clock.setFixedTime(new Date('2026-11-06T02:00:00Z'));
  const roles = manager ? ['MANAGER'] : ['FRONT_DESK_OFFICER'];
  const permissions = ['iam.profile.read', 'workflow.staffing.read', 'workflow.queue.read', 'workflow.consultation.read', ...(manager ? ['workflow.staffing.manage', 'workflow.dispatch.read', 'workflow.dispatch.write'] : ['workflow.leave.request', 'workflow.consultation.respond'])];
  await mockWorkspaceAuth(page, roles, permissions); await mockCatalog(page); await mockAnalytics(page);
  await page.route('**/api/v1/users/me', route => authReply(route, { json: { id: manager ? ids.manager : ids.officer, username: manager ? 'manager.test' : 'officer.test', email: 'test@example.test', profile: { fullName: 'Tài khoản kiểm thử' }, roles, permissions, wardId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', assignedCategories: [1] } }));
  await page.route('**/api/v1/manager/officers?*', route => authReply(route, { json: { items: [ids.officer, ids.officer2].map((id, i) => ({ id, username: `officer.test${i}`, email: 'test@example.test', fullName: i ? 'Cán bộ thứ hai' : 'Cán bộ kiểm thử', roles: ['FRONT_DESK_OFFICER'], isActive: true, wardCode: 'P01', assignedCategories: [1] })), page: 1, pageSize: 100, total: 2 } }));
  const zip = await JSZip.loadAsync(await createPreviewDocx());
  zip.file('word/document.xml', (await zip.file('word/document.xml')!.async('string')).replace(/<w:hyperlink[\s\S]*?<\/w:hyperlink>/g, ''));
  zip.file('word/_rels/document.xml.rels', '<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"/>');
  const templateBytes = await zip.generateAsync({ type: 'nodebuffer' });
  let bytes = templateBytes;
  const digest = (b: Buffer) => createHash('sha256').update(b).digest('hex').toUpperCase();
  const state = {
    requests: [] as { method: string; path: string; query: string; body: unknown; key?: string }[],
    wordRequired: true, templateConfigured: true, uploadFail: false, createTimeout: false, submitTimeout: false,
    conflict: false, draftCreated: false, deleted: false, submitted: false, version: 0, metadataVersion: 1, documentRevisionId: ids.revision,
    startsAtUtc: '2026-11-07T01:00:00Z', endsAtUtc: '2026-11-07T05:00:00Z', reason: 'Nghỉ giải quyết việc gia đình', status: 'PENDING', leaveVersion: 0,
    daysOff: [] as { officerId: string; date: string }[], isPublished: false, canEdit: true, editDeadlineUtc: '2026-10-30T17:00:00Z',
    fingerprint: 'A'.repeat(64), draft: null as null | Record<string, unknown>, weekVersion: 0, week: [] as unknown[],
    changes: [] as Record<string, unknown>[], submittedBytes: undefined as Buffer | undefined,
    slots: [{ shiftId: ids.shift, officerId: ids.officer, startsAt: '2026-11-07T01:00:00+00:00', endsAt: '2026-11-07T05:00:00+00:00', shiftVersion: 3 }],
  };
  const draft = () => ({ id: ids.draft, version: state.version, metadataVersion: state.metadataVersion, templateVersionId: ids.template, startsAtUtc: state.startsAtUtc, endsAtUtc: state.endsAtUtc, reason: state.reason, documentRevisionId: state.documentRevisionId, submittedLeaveId: state.submitted ? ids.leave : null, updatedAtUtc: '2026-11-06T02:00:00Z' });
  const leave = () => ({ id: ids.leave, officerId: ids.officer, wardCode: 'P01', startsAtUtc: state.startsAtUtc, endsAtUtc: state.endsAtUtc, reason: state.reason, status: state.status, version: state.leaveVersion });
  const createKeys = new Map<string, string>(); const submitKeys = new Map<string, string>();
  await page.route('**/api/v1/staffing/**', async route => {
    const request = route.request(); const url = new URL(request.url()); const path = url.pathname; const method = request.method();
    if (method === 'OPTIONS') return authReply(route, { status: 204 });
    const json = () => request.postDataJSON();
    const body = request.headers()['content-type']?.includes('application/json') ? json() : undefined;
    state.requests.push({ method, path, query: url.search, body, key: request.headers()['idempotency-key'] });
    const ok = (value: unknown) => authReply(route, { json: value });
    const fail = (code: string, status = 409) => authReply(route, { status, json: { code, title: code, traceId: 'mock-trace' } });
    const docx = (b = bytes) => authReply(route, { body: b, contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    if (path.endsWith('/capabilities')) return ok({ wordRequired: state.wordRequired, templateConfigured: state.templateConfigured, maxDocxBytes: 10485760 });
    if (path.endsWith('/leave-templates/current')) return state.templateConfigured ? ok({ versionId: ids.template, sha256: digest(templateBytes) }) : fail('leave.template_unavailable', 503);
    if (path.includes('/leave-templates/') && path.endsWith('/docx')) return docx(templateBytes);
    if (path.endsWith('/leave-drafts') && method === 'POST') {
      const key = request.headers()['idempotency-key']; if (!key) return fail('leave.invalid_input', 400);
      if (createKeys.has(key) && createKeys.get(key) !== JSON.stringify(body)) return fail('leave.key_conflict');
      createKeys.set(key, JSON.stringify(body)); state.draftCreated = true;
      state.reason = body.reason; state.startsAtUtc = body.startsAt; state.endsAtUtc = body.endsAt;
      if (state.createTimeout) { state.createTimeout = false; return fail('leave.storage_unavailable', 503); }
      return ok(draft());
    }
    if (path.endsWith('/leave-drafts') && method === 'GET') return ok({ items: state.draftCreated && !state.deleted && !state.submitted ? [draft()] : [], page: 1, pageSize: 20, total: state.draftCreated && !state.deleted && !state.submitted ? 1 : 0 });
    if (path.endsWith(`/leave-drafts/${ids.draft}`)) {
      if (method === 'DELETE') { state.deleted = true; return ok(draft()); }
      if (method === 'PATCH') { if (body.expectedVersion !== state.version) return fail('leave.version_conflict'); state.startsAtUtc = body.startsAt; state.endsAtUtc = body.endsAt; state.reason = body.reason; state.version++; state.metadataVersion++; }
      return ok(draft());
    }
    if (path.endsWith(`/leave-drafts/${ids.draft}/docx`)) {
      if (method === 'PUT') {
        if (state.uploadFail) return fail('leave.storage_unavailable', 503);
        const raw = request.postDataBuffer()!; const boundary = request.headers()['content-type'].split('boundary=')[1];
        const field = raw.indexOf(Buffer.from('name="file"')); const start = raw.indexOf(Buffer.from('\r\n\r\n'), field) + 4; const end = raw.indexOf(Buffer.from(`\r\n--${boundary}`), start);
        if (field < 0 || end <= start) return fail('leave.invalid_docx', 415);
        bytes = raw.subarray(start, end); state.version++; state.documentRevisionId = randomUUID(); return ok(draft());
      }
      return docx();
    }
    if (path.endsWith(`/leave-drafts/${ids.draft}/submit`)) {
      const key = request.headers()['idempotency-key']; if (!key) return fail('leave.invalid_input', 400);
      if (submitKeys.has(key) && submitKeys.get(key) !== JSON.stringify(body)) return fail('leave.key_conflict');
      if (!submitKeys.has(key) && (body.expectedVersion !== state.version || body.metadataVersion !== state.metadataVersion || state.version === 0)) return fail('leave.revision_required');
      submitKeys.set(key, JSON.stringify(body)); state.submitted = true; state.submittedBytes = bytes;
      if (state.submitTimeout) { state.submitTimeout = false; return fail('leave.storage_unavailable', 503); }
      return ok({ leaveId: ids.leave, status: 'PENDING', version: 0, submittedAtUtc: '2026-11-06T02:00:00Z' });
    }
    if (path.endsWith('/leaves') && method === 'POST') { if (state.wordRequired) return fail('staffing.word_required'); state.submitted = true; return ok(leave()); }
    if (path.endsWith('/leaves')) return ok(state.submitted ? [leave()] : []);
    if (path.endsWith(`/leaves/${ids.leave}`)) return ok({ leave: leave(), hasSubmittedDocx: Boolean(state.submittedBytes), submittedRevisionId: state.submittedBytes ? state.documentRevisionId : null, sha256: state.submittedBytes ? digest(state.submittedBytes) : null });
    if (path.endsWith('/submitted-docx')) return docx(state.submittedBytes ?? bytes);
    if (path.endsWith('/shift-impact')) return ok([{ shiftId: ids.shift, shiftStartsAtUtc: '2026-11-07T01:00:00Z', shiftEndsAtUtc: '2026-11-07T05:00:00Z', overlapStartsAtUtc: state.startsAtUtc, overlapEndsAtUtc: state.endsAtUtc }]);
    if (path.includes('/leaves/') && path.endsWith('/impact')) return ok([]);
    if (path.includes('/leaves/') && path.endsWith('/history')) return ok([]);
    if (path.includes('/leaves/') && path.endsWith('/decision')) { if (body.expectedVersion !== state.leaveVersion) return fail('staffing.version_or_status'); state.status = body.decision; state.leaveVersion++; return ok(leave()); }
    if (path.endsWith('/week-pattern')) { if (method === 'PUT') { state.week = body.entries; state.weekVersion++; } return ok({ version: state.weekVersion, entries: state.week }); }
    if (path.endsWith('/preview')) return ok({ month: '2026-11-01', slots: state.slots, closures: [], conflicts: [], baseFingerprint: state.fingerprint });
    if (path.endsWith('/draft')) { if (state.conflict) return fail('schedule.changed'); state.draft = { id: ids.monthly, month: '2026-11-01', status: 'DRAFT', version: Number(state.draft?.version ?? 0) + 1, baseFingerprint: body.baseFingerprint, actorId: ids.manager, reason: body.reason, publishedAtUtc: null, slots: body.slots, daysOff: body.daysOff ?? [] }; return ok(state.draft); }
    if (path.endsWith('/publish')) { if (state.conflict) return fail('schedule.changed'); const result = { ...state.draft, status: 'PUBLISHED', version: Number(state.draft!.version) + 1, publishedAtUtc: '2026-11-06T02:00:00Z' }; state.slots = state.draft!.slots as typeof state.slots; state.daysOff = state.draft!.daysOff as typeof state.daysOff; state.isPublished = true; state.canEdit = false; state.draft = null; return ok(result); }
    if (path.includes('/schedules/') && path.endsWith('/history')) return ok([{ id: ids.monthly, month: '2026-11-01', status: 'BASELINE', version: 1, baseFingerprint: '', actorId: '00000000-0000-0000-0000-000000000000', reason: 'Dữ liệu ban đầu', publishedAtUtc: null, slots: state.slots }]);
    if (path.endsWith('/confirm')) return ok({ id: ids.monthly, officerId: ids.officer, month: '2026-11-01', fingerprint: body.fingerprint, confirmedAtUtc: '2026-11-06T02:00:00Z' });
    if (/\/schedules\/\d{4}-\d{2}-01$/.test(path)) return ok({ month: path.split('/').at(-1), slots: state.slots, baseFingerprint: state.fingerprint, draft: manager ? state.draft : null, leaves: [], closures: [], daysOff: state.daysOff, isPublished: state.isPublished, canEdit: manager && state.canEdit, editDeadlineUtc: state.editDeadlineUtc, confirmations: [{ officerId: ids.officer, confirmedAtUtc: null }] });
    if (path.endsWith('/shift-change-requests') && method === 'POST') { const value = { id: ids.change, shiftId: ids.shift, officerId: ids.officer, wardCode: 'P01', originalStart: state.slots[0].startsAt, originalEnd: state.slots[0].endsAt, originalVersion: 3, proposedStart: body.startsAt, proposedEnd: body.endsAt, reason: body.reason, status: 'PENDING', decidedBy: null, decidedAtUtc: null, decisionReason: null }; state.changes.push(value); return ok(value); }
    if (path.endsWith('/shift-change-requests')) return ok({ items: state.changes, page: 1, pageSize: 20, total: state.changes.length });
    if (path.includes('/shift-change-requests/') && path.endsWith('/decision')) { const value = state.changes[0]; Object.assign(value, { status: body.decision, decisionReason: body.reason }); return ok(value); }
    if (path.endsWith('/shifts')) return ok(state.slots.map(s => ({ id: s.shiftId, officerId: s.officerId, wardCode: 'P01', startsAtUtc: s.startsAt, endsAtUtc: s.endsAt, version: s.shiftVersion })));
    return fail('mock.unhandled', 404);
  });
  return state;
}
