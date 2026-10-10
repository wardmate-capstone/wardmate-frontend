import type { Page, Route } from '@playwright/test';
import type { ProcedureDetail } from '../../src/lib/api/procedures';

export const procedureId = '07000000-0000-0000-0000-000000000001';
export const draftId = '07000000-0000-0000-0000-000000000002';
export const initialRevision = '07000000-0000-0000-0000-000000000003';
export const savedRevision = '07000000-0000-0000-0000-000000000004';
export const formTemplateId = '07000000-0000-0000-0000-000000000005';
export const sampleProcedure: ProcedureDetail = {
  id: procedureId, categoryId: 1, categoryName: 'Hộ tịch', procedureCode: 'TEST-KS', title: 'Đăng ký khai sinh từ API',
  levelOfImplementation: 'Cấp Xã', targetAudience: 'Công dân Việt Nam', feeSummary: 'Theo nội dung đối soát', processingTimeSummary: 'Trong ngày', isActive: true,
  issuingAuthority: 'Cơ quan ban hành kiểm thử', executingAgency: 'Cơ quan thực hiện kiểm thử',
  originalPdfUrl: 'https://example.test/source.pdf', pdfFileName: 'khai-sinh.pdf',
  contentPayload: { decisionNumber: 'TEST-QD', receivingAddress: 'Địa chỉ trong dữ liệu kiểm thử',
    submissionMethods: [{ methodName: 'Trực tiếp', feeAmount: 0, feeUnit: 'VND', estimatedDays: 1, note: 'Áp dụng theo điều kiện nguồn' }],
    legalReferences: [{ documentNumber: 'TEST-VB', documentName: '<script>Văn bản kiểm thử</script>', authority: '', issueDate: null }],
    results: ['Giấy khai sinh'], cases: [{ caseCode: 'A', caseName: 'Trường hợp A', steps: [{ stepOrder: 1, stepName: 'Kiểm tra hồ sơ', executor: 'Cán bộ', actionDetails: 'Đối chiếu giấy tờ' }] }, { caseCode: 'B', caseName: 'Trường hợp B', steps: [] }],
  },
  checklistSchema: [{ checklistId: 'CHUNG', itemName: 'Giấy tờ dùng chung', submissionType: 'XUAT_TRINH', documentCopyType: 'ORIGINAL', quantity: 1, isMandatory: true }, { checklistId: 'A1', caseCode: 'A', itemName: 'Giấy chứng sinh', submissionType: 'NOP', documentCopyType: 'ORIGINAL', quantity: 1, isMandatory: true }, { checklistId: 'B1', caseCode: 'B', itemName: 'Giấy tờ trường hợp B', submissionType: 'NOP', documentCopyType: 'CERTIFIED_COPY', quantity: 1, isMandatory: true }],
  formDefinitions: [{ formCode: 'TK', formName: 'Tờ khai từ API', formType: 'DOCX_TEMPLATE', quantity: 1, isMandatory: false }],
  createdAt: '2026-10-01T00:00:00Z', updatedAt: '2026-10-06T00:00:00Z',
};
export function catalogReply(route: Route, options: Parameters<Route['fulfill']>[0]) {
  return route.fulfill({ ...options, headers: { 'access-control-allow-origin': route.request().headers().origin || 'http://127.0.0.1:4317', 'access-control-allow-credentials': 'true', 'access-control-allow-headers': 'Content-Type,Authorization,X-CSRF-Protection', 'access-control-allow-methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS' } });
}
export async function mockCatalog(page: Page) {
  const state = {
    detail: structuredClone(sampleProcedure), listError: false, conflict: false, failPublishResponse: false,
    draftStatus: 'NeedsReview', revision: initialRevision, draftReads: 0, queued: false,
    categoryDelay: 0, draftListDelay: 0, procedureListDelay: 0,
    requests: [] as { method: string; path: string; query: URLSearchParams; body: Record<string, unknown> | null; authorization?: string }[],
  };
  await page.route('**/api/v1/procedure*/**', handler);
  await page.route('**/api/v1/procedures?*', handler);
  await page.route('**/api/v1/procedures', handler);
  async function handler(route: Route) {
    const request = route.request(); const url = new URL(request.url()); const path = url.pathname; const method = request.method();
    if (method === 'OPTIONS') return catalogReply(route, { status: 204 });
    const body = request.headers()['content-type']?.includes('application/json') ? request.postDataJSON() as Record<string, unknown> : null;
    state.requests.push({ method, path, query: url.searchParams, body, authorization: request.headers().authorization });
    const reply = (json: unknown, status = 200) => catalogReply(route, { status, json });
    const draft = () => ({ id: draftId, status: state.draftStatus, pdfFileName: 'khai-sinh.pdf', payload: state.detail, warnings: ['Cần đối soát PDF gốc.'], extractedText: 'Văn bản PDF kiểm thử', revision: state.revision, createdAt: state.detail.createdAt, updatedAt: state.detail.updatedAt, ...(state.draftStatus === 'Published' ? { publishedProcedureId: procedureId } : {}) });
    if (path.endsWith('/source')) return reply({ url: 'https://example.test/source.pdf', expiresInSeconds: 600 });
    if (path === '/api/v1/procedures/categories') {
      if (state.categoryDelay) await new Promise(resolve => setTimeout(resolve, state.categoryDelay));
      return reply([{ id: 1, categoryName: 'Hộ tịch' }, { id: 2, categoryName: 'Chứng thực' }]);
    }
    if (path === '/api/v1/procedure-manager/categories' && method === 'POST') return reply({ id: 3, ...body }, 201);
    if (path.startsWith('/api/v1/procedure-manager/categories/') && method === 'PUT') return reply({ id: Number(path.split('/').at(-1)), ...body });
    if (path.startsWith('/api/v1/procedure-manager/categories/') && method === 'DELETE') return catalogReply(route, { status: 204 });
    if (path.endsWith('/document-forms')) return reply([{ id: formTemplateId, formCode: 'BM-01', formName: 'Tờ khai điện tử', formType: 'ONLINE_INTERACTIVE' }]);
    if (path.endsWith('/extract-preview')) return reply({ payload: state.detail, warnings: ['Chỉ đọc thử, chưa lưu.'], extractedText: 'Nội dung đọc thử từ PDF' });
    if (path.endsWith('/drafts')) {
      if (method === 'POST') { state.draftStatus = state.queued ? 'Queued' : 'NeedsReview'; return reply(draft(), 202); }
      if (state.draftListDelay) await new Promise(resolve => setTimeout(resolve, state.draftListDelay));
      return reply(url.searchParams.get('page') === '2' ? [] : [draft()]);
    }
    if (path.includes('/drafts/')) {
      if (method === 'DELETE') return catalogReply(route, { status: 204 });
      if (path.endsWith('/retry')) { state.draftStatus = 'Queued'; state.queued = true; return reply(draft()); }
      if (path.endsWith('/publish')) {
        if (body?.revision !== state.revision) return reply({ title: 'Revision không hợp lệ.' }, 409);
        state.draftStatus = 'Published';
        if (state.failPublishResponse) return route.abort('failed');
        return reply(state.detail);
      }
      if (method === 'PUT') {
        if (state.conflict) return reply({ title: 'Bản nháp đã thay đổi. Vui lòng tải lại.', code: 'draft.conflict' }, 409);
        state.revision = savedRevision; return reply(draft());
      }
      state.draftReads++;
      if (state.queued && ['Queued', 'Processing'].includes(state.draftStatus) && state.draftReads > 1) state.draftStatus = 'NeedsReview';
      return reply(draft());
    }
    if (path.endsWith('/versions')) return reply([{ id: draftId, versionNumber: 1, decisionNumber: 'TEST-QD', effectiveDate: '2026-10-01', snapshotData: state.detail, createdAt: state.detail.createdAt, pdfFileName: 'khai-sinh-v1.pdf' }]);
    if (path.endsWith('/rollback')) { state.detail = { ...state.detail, ...(state.detail as ProcedureDetail) }; return reply(state.detail); }
    if (path.endsWith('/status')) { state.detail.isActive = body?.isActive === true; return reply({ id: procedureId, isActive: state.detail.isActive, reason: body?.reason, updatedAt: state.detail.updatedAt }); }
    if (method === 'POST' || method === 'PUT') { state.detail = { ...state.detail, ...body } as ProcedureDetail; return reply(state.detail, method === 'POST' && !path.endsWith('/publish') ? 201 : 200); }
    if (path.endsWith('/procedures')) {
      if (state.procedureListDelay) await new Promise(resolve => setTimeout(resolve, state.procedureListDelay));
      if (state.listError) return reply({ title: 'Dịch vụ tạm thời không khả dụng.' }, 503);
      const active = url.searchParams.get('isActive'); const keyword = (url.searchParams.get('keyword') ?? '').toLowerCase();
      const category = url.searchParams.get('categoryId'); const pageNumber = Number(url.searchParams.get('pageNumber') ?? '1');
      const size = Number(url.searchParams.get('pageSize') ?? '10');
      const matches = (!active || (active === 'true') === state.detail.isActive) && (!category || category === '1') && (!keyword || ['khai sinh', 'dang ky', 'đăng ký'].some(word => keyword.includes(word)));
      const totalCount = matches ? 6 : 0;
      const count = Math.min(size, Math.max(0, totalCount - (pageNumber - 1) * size));
      const items = Array.from({ length: count }, (_, index) => ({ ...state.detail, id: index === 0 ? procedureId : `07000000-0000-0000-0000-${String(index + 10).padStart(12, '0')}`, title: index === 0 ? state.detail.title : `Thủ tục API số ${index + 1}`, versionCount: 1 }));
      return reply({ items, currentPage: pageNumber, pageSize: size, totalCount, totalPages: Math.ceil(totalCount / size), hasPrevious: pageNumber > 1, hasNext: pageNumber * size < totalCount });
    }
    if (path === `/api/v1/procedures/${procedureId}` && state.detail.isActive) return reply(state.detail);
    if (path === `/api/v1/procedure-manager/procedures/${procedureId}`) return reply(state.detail);
    return reply({ title: 'Không tìm thấy thủ tục đang hoạt động.' }, 404);
  }
  return state;
}
