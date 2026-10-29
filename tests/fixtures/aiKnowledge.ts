import type { Page, Route } from '@playwright/test';
import { authReply } from './auth';
import { procedureId } from './procedures';

export const docId = '0a000000-0000-0000-0000-000000000001';
export const pdfDocId = '0a000000-0000-0000-0000-000000000002';
export const procedureDocId = '0a000000-0000-0000-0000-000000000003';
export const revisionA = '0a000000-0000-0000-0000-0000000000a1';
export const revisionB = '0a000000-0000-0000-0000-0000000000b2';
export const sessionId = '0a000000-0000-0000-0000-0000000000c1';
const now = '2026-10-24T03:00:00Z';

export const citation = {
  index: 1, documentId: procedureDocId, title: 'Đăng ký khai sinh từ API', sourceType: 'PROCEDURE', procedureId,
  chunkId: '0a000000-0000-0000-0000-0000000000d1', heading: 'Thành phần hồ sơ', score: 0.8123,
};

function summary(overrides: Record<string, unknown>) {
  return {
    id: docId, title: 'Hỏi đáp khai sinh', sourceType: 'FAQ', procedureId: null, sourceReference: null, sourceVersion: null,
    status: 'EMBEDDED', isActive: true, chunkCount: 2, contentLength: 120, revision: revisionA,
    createdAt: now, updatedAt: now, chunkedAt: now, ...overrides,
  };
}

function detail(base: ReturnType<typeof summary>) {
  return {
    ...base, chunkingVersion: 'v1', content: 'Hỏi: Cần mang gì?\nĐáp: Mang tờ khai và giấy chứng sinh.', contentSha256: 'abc',
    createdBy: '0a000000-0000-0000-0000-0000000000e1', updatedBy: '0a000000-0000-0000-0000-0000000000e1', warnings: null,
    embeddingModel: 'gemini-embedding-001@768', embeddingAttempts: 0, nextEmbeddingAt: null, embeddingError: null, embeddedAt: now,
  };
}

export type AiRequest = { method: string; path: string; query: URLSearchParams; body: unknown };

/** Mock AIOCR (chat + knowledge) on the test service origin. Register after mockWorkspaceAuth so it takes precedence. */
export async function mockAi(page: Page) {
  const state = {
    documents: [
      summary({}),
      summary({ id: pdfDocId, title: 'Hướng dẫn PDF', sourceType: 'PDF_FILE', status: 'EMBEDDING_FAILED', sourceReference: 'huong-dan.pdf' }),
      summary({ id: procedureDocId, title: 'Đăng ký khai sinh từ API', sourceType: 'PROCEDURE', procedureId, isActive: false, status: 'CHUNKED' }),
    ],
    updateConflict: false,
    syncAllResult: { scanned: 3, created: 1, updated: 1, unchanged: 0, deactivated: 0, failed: 1, complete: false, failedProcedureIds: [procedureId] },
    chatReply: { conversationId: sessionId, answer: 'Bạn cần tờ khai và giấy chứng sinh [1].', relatedProcedures: [{ procedureId, title: 'Đăng ký khai sinh từ API' }], citations: [citation], grounded: true } as Record<string, unknown>,
    chatError: null as null | { status: number; code: string },
    requests: [] as AiRequest[],
  };

  await page.route('http://localhost:5000/api/v1/ai/**', async (route: Route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    const method = request.method();
    if (method === 'OPTIONS') return authReply(route, { status: 204 });
    const json = request.headers()['content-type']?.includes('application/json');
    state.requests.push({ method, path, query: url.searchParams, body: json ? request.postDataJSON() : null });

    if (path === '/api/v1/ai/chat/completions') {
      if (state.chatError) return authReply(route, { status: state.chatError.status, json: { title: 'Lỗi', status: state.chatError.status, code: state.chatError.code } });
      return authReply(route, { json: state.chatReply });
    }
    if (path === '/api/v1/ai/chat/sessions') {
      return authReply(route, { json: { items: [{ id: sessionId, wardCode: 'WARD_001', createdAt: now }], pageNumber: 1, pageSize: 20, totalCount: 1 } });
    }
    if (path === `/api/v1/ai/chat/sessions/${sessionId}/messages`) {
      return authReply(route, { json: { items: [
        { id: 'm1', role: 'User', content: 'Khai sinh cần gì?', createdAt: now, citations: null },
        { id: 'm2', role: 'Assistant', content: 'Cần giấy chứng sinh [1].', createdAt: now, citations: [citation] },
      ], pageNumber: 1, pageSize: 50, totalCount: 2 } });
    }

    const kb = '/api/v1/ai/knowledge';
    if (path === `${kb}/index-status`) {
      return authReply(route, { json: { embeddingEnabled: true, ragEnabled: false, embeddingSignature: 'gemini-embedding-001@768', activeDocuments: 2, chunked: 0, embedded: 1, embeddingFailed: 1, inactive: 1, searchableChunks: 2, maxIndexedChunks: 20000, minScore: 0.55, topK: 5 } });
    }
    if (path === `${kb}/documents` && method === 'GET') {
      return authReply(route, { json: { items: state.documents, pageNumber: 1, pageSize: 20, totalCount: state.documents.length } });
    }
    if (path === `${kb}/documents` && method === 'POST') {
      const body = request.postDataJSON() as { title: string; sourceType: string };
      const created = summary({ id: '0a000000-0000-0000-0000-000000000009', title: body.title, sourceType: body.sourceType, status: 'CHUNKED' });
      state.documents.unshift(created);
      return authReply(route, { status: 201, json: detail(created) });
    }
    const docMatch = new RegExp(`^${kb}/documents/([0-9a-f-]+)(/.*)?$`).exec(path);
    if (docMatch) {
      const doc = state.documents.find((d) => d.id === docMatch[1]);
      if (!doc) return authReply(route, { status: 404, json: { title: 'Không tìm thấy', code: 'knowledge.not_found' } });
      const suffix = docMatch[2] ?? '';
      if (suffix === '' && method === 'GET') return authReply(route, { json: detail(doc) });
      if (suffix === '/chunks') {
        return authReply(route, { json: { items: [{ id: 'c1', chunkIndex: 0, heading: 'Hỏi đáp', content: 'Đáp: Mang tờ khai.', charCount: 18, contentSha256: 'x' }], pageNumber: 1, pageSize: 20, totalCount: 1 } });
      }
      if (suffix === '' && method === 'PUT') {
        if (state.updateConflict) return authReply(route, { status: 409, json: { title: 'Xung đột', code: 'knowledge.revision_conflict' } });
        const body = request.postDataJSON() as { title: string };
        Object.assign(doc, { title: body.title, revision: revisionB });
        return authReply(route, { json: detail(doc) });
      }
      if (suffix === '/activation') {
        const body = request.postDataJSON() as { isActive: boolean };
        Object.assign(doc, { isActive: body.isActive, revision: revisionB });
        return authReply(route, { json: detail(doc) });
      }
      if (suffix === '/rechunk' || suffix === '/reindex') {
        Object.assign(doc, { status: 'CHUNKED', revision: revisionB });
        return authReply(route, { json: detail(doc) });
      }
    }
    if (path === `${kb}/search`) {
      return authReply(route, { json: [{ rank: 1, documentId: docId, title: 'Hỏi đáp khai sinh', sourceType: 'FAQ', procedureId: null, chunkId: 'c1', heading: 'Hỏi đáp', content: 'Đáp: Mang tờ khai.', score: 0.77 }] });
    }
    if (path === `${kb}/procedures/sync`) return authReply(route, { json: state.syncAllResult });
    if (path.startsWith(`${kb}/procedures/`) && path.endsWith('/sync')) {
      return authReply(route, { json: { outcome: 'UPDATED', document: state.documents[2] } });
    }
    return authReply(route, { status: 404, json: { title: 'Không có mock', code: 'test.unmocked' } });
  });
  return state;
}
