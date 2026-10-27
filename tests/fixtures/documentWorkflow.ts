import type { Page } from '@playwright/test';
import { authReply, mockWorkspaceAuth } from './auth';
import { mockCatalog } from './procedures';
import { createPreviewDocx } from './formTemplateDocx';

export const documentIds = {
  application: '10000000-0000-4000-8000-000000000001', checklist: '10000000-0000-4000-8000-000000000002',
  template: '10000000-0000-4000-8000-000000000003', submission: '10000000-0000-4000-8000-000000000004',
  citizen: '10000000-0000-4000-8000-000000000005', officer: '10000000-0000-4000-8000-000000000006',
  supporting: '10000000-0000-4000-8000-000000000007', evidence: '10000000-0000-4000-8000-000000000008',
};
const time = '2026-10-16T01:00:00Z';
export async function mockDocumentWorkflow(page: Page, actor: 'citizen' | 'officer' = 'citizen', status = 'DRAFT') {
  await mockWorkspaceAuth(page, [actor === 'citizen' ? 'REGISTERED_CITIZEN' : 'FRONT_DESK_OFFICER']);
  await mockCatalog(page);
  const docx = await createPreviewDocx();
  const state = { actor, status, version: status === 'DRAFT' ? 0 : 1, submissionStatus: '', checklistStatus: 'PENDING', evidenceQuantity: 0, failChot: false, failPatch: false, failComment: false, failDecision: false, withoutForm: false, qr: false,
    writes: [] as { path: string; body: string }[], reads: [] as string[], comments: [] as Record<string, unknown>[], pdfs: [] as Record<string, unknown>[] };
  const checklists = () => [
    { id: documentIds.checklist, code: 'TO_KHAI', title: 'Tờ khai thử nghiệm', formTemplateId: documentIds.template, quantity: 1, submissionType: 'NOP', documentCopyType: 'ORIGINAL', sortOrder: 1, isRequired: true, status: state.checklistStatus, createdAt: time, updatedAt: time },
    { id: documentIds.evidence, code: 'GIAY_TO', title: 'Giấy tờ thử nghiệm', formTemplateId: null, quantity: 2, submissionType: 'NOP', documentCopyType: 'ORIGINAL', sortOrder: 2, isRequired: true, status: state.evidenceQuantity >= 2 ? 'COMPLETED' : 'PENDING', createdAt: time, updatedAt: time },
  ].filter(x => !state.withoutForm || x.id !== documentIds.checklist);
  const app = () => ({ id: documentIds.application, applicationCode: 'HS-TEST-01', userId: documentIds.citizen, procedureId: documentIds.template, procedureTitle: 'Thủ tục thử nghiệm', caseCode: null, wardCode: 'WARD_A', status: state.status, formData: { applicantName: 'Người kiểm thử', 'a/b~c': 'Giá trị kiểm thử' }, checklists: checklists(), history: [], resubmitCount: Math.max(0, state.version - 1), currentVersionNumber: state.version, assignedOfficerId: state.status === 'DRAFT' ? null : documentIds.officer, createdAt: time, updatedAt: time });
  const submission = () => ({ id: documentIds.submission, templateId: documentIds.template, applicationId: documentIds.application, checklistId: documentIds.checklist, applicantId: documentIds.citizen, fileName: 'to-khai.docx', fileSizeBytes: docx.length, status: state.submissionStatus, createdAt: time, updatedAt: time });
  const saved = () => ({ submissionId: documentIds.submission, status: state.submissionStatus, fileName: 'to-khai.docx', fileSizeBytes: docx.length, updatedAt: time });
  await page.route('**/api/v1/**', async route => {
    const request = route.request(); const url = new URL(request.url()); const path = url.pathname; const method = request.method();
    if (method === 'OPTIONS') return authReply(route, { status: 204 });
    if (path.endsWith('/users/me')) return authReply(route, { json: { id: state.actor === 'citizen' ? documentIds.citizen : documentIds.officer, username: 'demo', email: 'demo@example.test', roles: [state.actor === 'citizen' ? 'REGISTERED_CITIZEN' : 'FRONT_DESK_OFFICER'], permissions: ['document.submissions.read', 'document.submissions.write', 'document.submissions.submit'], profile: { fullName: 'Người kiểm thử' } } });
    if (!path.includes('/applications') && !path.includes('/submissions') && !path.includes('/supporting-documents') && !path.includes('/generated-documents')) return route.fallback();
    const reply = (json: unknown, status = 200) => authReply(route, { json, status });
    if (method === 'GET') {
      state.reads.push(path);
      if (path.endsWith('/approved-qr/image')) return authReply(route, { body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==', 'base64'), contentType: 'image/png' });
      if (path.endsWith('/approved-qr')) return state.qr ? reply({ id: documentIds.supporting, applicationId: documentIds.application, submissionId: documentIds.submission, qrCodeValue: 'https://example.test/verify/HS-TEST-01', generatedAt: time }) : reply({ code: 'document.qr_not_found' }, 404);
      if (path.endsWith('/contents')) return reply({ applicationId: documentIds.application, submissions: state.submissionStatus ? [{ ...submission(), fileExists: true, quantity: 1 }] : [], supportingDocuments: state.evidenceQuantity ? [{ id: documentIds.supporting, checklistId: documentIds.evidence, fileName: 'giay-to.pdf', status: 'Uploaded', fileExists: true, submissionType: 'NOP', documentCopyType: 'ORIGINAL', quantity: state.evidenceQuantity }] : [] });
      if (path.includes('/by-application/')) return reply(state.submissionStatus ? [submission()] : []);
      if (path.endsWith('/download-docx')) return authReply(route, { body: docx, contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      if (path.endsWith('/download')) return authReply(route, { body: Buffer.from('%PDF-1.4\n%%EOF'), contentType: 'application/pdf' });
      if (path.endsWith('/generated-documents')) return reply(state.pdfs.filter(x => !url.searchParams.get('submissionId') || x.submissionId === url.searchParams.get('submissionId')));
      if (path.endsWith('/comments')) return reply(state.comments.filter(x => !url.searchParams.get('versionNumber') || x.versionNumber === Number(url.searchParams.get('versionNumber'))));
      if (path.endsWith('/versions')) return reply(Array.from({ length: state.version }, (_, i) => ({ id: documentIds.supporting, versionNumber: i + 1, submittedBy: documentIds.citizen, submittedAt: time, snapshotData: {} })));
      if (path.endsWith('/diff')) return reply([]);
      if (path.endsWith('/pending')) return reply({ items: ['SUBMITTED', 'UNDER_REVIEW'].includes(state.status) ? [app()] : [], page: 1, pageSize: 50, total: ['SUBMITTED', 'UNDER_REVIEW'].includes(state.status) ? 1 : 0 });
      if (path.endsWith('/applications')) return reply({ items: [app()], page: 1, pageSize: 50, total: 1 });
      return reply(app());
    }
    state.writes.push({ path, body: request.postDataBuffer()?.toString() || '' });
    if (path.endsWith('/annotate-docx')) return reply(saved());
    if (path.endsWith('/draft') || path.endsWith('/upload-filled-docx')) { state.submissionStatus = 'Draft'; return reply(saved(), method === 'POST' ? 201 : 200); }
    if (path.includes('/citizen/submissions/') && path.endsWith('/submit')) {
      if (state.failChot) { state.failChot = false; return reply({ code: 'document.storage_unavailable' }, 503); }
      state.submissionStatus = 'Submitted'; return reply(saved());
    }
    if (path.includes('/checklists/')) {
      if (state.failPatch) { state.failPatch = false; return reply({ code: 'application.documents_unavailable' }, 503); }
      state.checklistStatus = request.postDataJSON().status; return reply(app());
    }
    if (path.endsWith('/supporting-documents')) {
      const match = /name="Quantity"\r\n\r\n(\d+)/.exec(request.postDataBuffer()?.toString() || '');
      state.evidenceQuantity += Number(match?.[1] || 0);
      return reply({ id: documentIds.supporting, applicationId: documentIds.application, checklistId: documentIds.evidence, fileName: 'giay-to.pdf', createdAtUtc: time, quantity: Number(match?.[1] || 1) }, 201);
    }
    if (path.endsWith('/comments')) {
      if (state.failComment) return reply({ code: 'application.invalid_target' }, 400);
      state.comments.push({ id: documentIds.evidence, applicationVersionId: documentIds.supporting, ...request.postDataJSON(), officerId: documentIds.officer, status: 'OPEN', createdAt: time, updatedAt: time });
    } else if (path.endsWith('/request-revision')) state.status = 'NEED_REVISION';
    else if (path.endsWith('/resubmit')) { state.status = 'SUBMITTED'; state.version++; state.comments.forEach(x => { x.status = 'RESOLVED'; }); }
    else if (path.endsWith('/assign')) state.status = 'UNDER_REVIEW';
    else if (path.endsWith('/confirm-readiness')) {
      if (state.failDecision) return reply({ code: 'application.invalid_status' }, 409);
      state.status = 'DOCUMENTS_READY'; state.submissionStatus = 'ReadyForDownload';
    } else if (path.endsWith('/submit')) { state.status = 'SUBMITTED'; state.version = 1; }
    else if (path.endsWith('/generate-pdf')) {
      state.qr = true; const pdf = { id: documentIds.supporting, applicationId: documentIds.application, submissionId: documentIds.submission, documentType: 'ORIGINAL_SUBMISSION', createdAtUtc: time }; state.pdfs.push(pdf); return reply(pdf);
    } else if (method === 'DELETE') { state.evidenceQuantity = 0; return authReply(route, { status: 204 }); }
    if (path.includes('/officer/submissions/') && /request-revision|confirm-readiness/.test(path)) return reply({ submissionId: path.split('/').at(-2), message: 'Workflow đã cập nhật hồ sơ.' });
    return reply({ application: app(), currentVersionNumber: state.version, resubmitCount: Math.max(0, state.version - 1), assignedOfficerId: documentIds.officer });
  });
  return state;
}
