import assert from 'node:assert/strict';
import { createServer as createHttpServer } from 'node:http';
import { createServer, loadConfigFromFile } from 'vite';

// Exercise Vite's real proxy matching, including URL query strings. No Azure calls.
const targets = [];
let vite;
try {
  for (const name of ['iam', 'catalog', 'workflow', 'document', 'analytics']) {
    const server = createHttpServer(async (request, response) => {
      const chunks = []; for await (const chunk of request) chunks.push(chunk);
      response.setHeader('Content-Type', 'application/json');
      response.end(JSON.stringify({ service: name, path: request.url, method: request.method, key: request.headers['idempotency-key'], contentType: request.headers['content-type'], body: Buffer.concat(chunks).toString('utf8') }));
    });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    targets.push({ server, name, url: `http://127.0.0.1:${server.address().port}` });
  }
  const env = {
    VITE_API_BASE_URL: targets[0].url,
    VITE_CATALOG_API_URL: targets[1].url,
    VITE_WORKFLOW_API_URL: targets[2].url,
    VITE_DOCUMENT_FORM_API_URL: targets[3].url,
    VITE_ANALYTICS_API_URL: targets[4].url,
    VITE_USE_API_PROXY: 'true',
  };
  Object.assign(process.env, env);
  const loaded = await loadConfigFromFile({ command: 'serve', mode: 'development' });
  assert.ok(loaded, 'Vite config must load');
  vite = await createServer({ ...loaded.config, configFile: false, logLevel: 'error', server: { ...loaded.config.server, host: '127.0.0.1', port: 0, strictPort: false } });
  await vite.listen();
  const base = `http://127.0.0.1:${vite.httpServer.address().port}`;
  const cases = [
    ['/api/analytics-system/api/v1/system/health/services', 'document'],
    ['/api/analytics-system/api/v1/system/health/services/iam', 'document'],
    ['/api/analytics-system/api/v1/system/health/history?service=iam&page=2&pageSize=20', 'document'],
    ['/api/analytics-system/api/v1/system/health/check-now', 'document', 'POST'],
    ['/api/analytics-system/api/v1/system/backups?service=iam&status=Succeeded&page=1&pageSize=20', 'document'],
    ['/api/analytics-system/api/v1/system/backups', 'document', 'POST'],
    ['/api/analytics-system/api/v1/system/backups/11111111-1111-1111-1111-111111111111', 'document'],
    ['/api/analytics-system/api/v1/system/backups/11111111-1111-1111-1111-111111111111/verify', 'document', 'POST'],
    ['/api/v1/admin/notification-deliveries/11111111-1111-1111-1111-111111111111', 'analytics'],
    ['/api/analytics-system/api/v1/system/settings', 'document'],
    ['/api/analytics-system/api/v1/system/settings/analytics.lookbackDays', 'document'],
    ['/api/analytics-system/api/v1/system/settings/analytics.lookbackDays', 'document', 'PUT'],
    ['/api/analytics-system/api/v1/system/audit-logs?from=2026-11-02T17%3A00%3A00.000Z&page=2&pageSize=20', 'document'],
    ['/api/analytics-system/api/v1/system/audit-logs/11111111-1111-1111-1111-111111111111', 'document'],
    ['/api/analytics-system/api/v1/system/audit-events?source=workflow&entity=applications&page=1&pageSize=20', 'document'],
    ['/api/analytics-system/api/v1/system/audit-events/11111111-1111-1111-1111-111111111111', 'document'],
    ['/api/v1/analytics/overview?from=2026-10-01&to=2026-10-23', 'analytics'],
    ['/api/v1/analytics/jobs/rebuild', 'analytics'],
    ['/api/v1/analytics/jobs/123', 'analytics'],
    ['/api/v1/citizen/feedback/app', 'analytics'],
    ['/api/v1/admin/notification-deliveries?page=1&pageSize=20', 'analytics'],
    ['/api/v1/applications/app/contents', 'document'],
    ['/api/analytics-system/hubs/notifications/negotiate?negotiateVersion=1', 'document'],
    ['/api/v1/applications/app/approved-qr', 'document'],
    ['/api/v1/applications/app/approved-qr/image', 'document'],
    ['/api/v1/applications/app/generated-documents', 'document'],
    ['/api/v1/applications/app/generated-documents?submissionId=form', 'document'],
    ['/api/v1/applications/app/generate-pdf', 'document'],
    ['/api/v1/officer/submissions/by-application/app', 'document'],
    // AI OCR falls back to the DocumentForm/gateway origin when VITE_AI_OCR_API_URL is unset.
    ['/api/v1/ai/chat/sessions?pageNumber=1', 'document'],
    ['/api/v1/ai/knowledge/documents?pageNumber=1&pageSize=20', 'document'],
    ['/api/v1/ai/knowledge/index-status', 'document'],
    ['/api/v1/applications/app', 'workflow'],
    ['/api/v1/applications/app/submit', 'workflow'],
    ['/api/v1/officer/applications/pending?Page=1', 'workflow'],
    ['/api/v1/officer/applications/app/release', 'workflow'],
    ['/api/v1/manager/applications/app/assignee', 'workflow'],
    ['/api/v1/manager/applications/assignment-summary', 'workflow'],
    ['/api/v1/staffing/capabilities', 'workflow'],
    ['/api/v1/staffing/leave-drafts?page=1&pageSize=20', 'workflow'],
    ['/api/v1/staffing/leave-templates/current', 'workflow'],
    ['/api/v1/staffing/schedules/2026-11-01/preview?copyFrom=2026-10-01', 'workflow'],
    ['/api/v1/staffing/shift-change-requests?page=1&pageSize=20', 'workflow'],
    ['/api/v1/officer/activity?page=1&pageSize=20', 'workflow'],
    ['/api/v1/manager/officers?assignedCategory=1', 'iam'],
    ['/api/v1/procedures?pageNumber=1', 'catalog'],
    ['/api/v1/users/me', 'iam'],
    ['/api/v1/auth/password-otp/request', 'iam'],
    ['/api/v1/accounts/manager', 'iam'],
    ['/api/v1/admin/users?role=MANAGER', 'iam'],
  ];
  for (const [path, service, method = 'GET'] of cases) {
    const response = await fetch(base + path, { method });
    assert.equal(response.status, 200, path);
    const result = await response.json();
    assert.equal(result.service, service, path);
    assert.equal(result.path, path, 'Proxy must preserve request path and query');
    assert.equal(result.method, method, 'Proxy must preserve HTTP method');
  }
  const key = '11111111-1111-4111-8111-111111111111';
  const create = await (await fetch(base + '/api/v1/staffing/leave-drafts', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': key }, body: '{"reason":"proxy-check"}' })).json();
  assert.equal(create.service, 'workflow'); assert.equal(create.key, key); assert.equal(create.body, '{"reason":"proxy-check"}');
  const patch = await (await fetch(base + '/api/v1/staffing/leave-drafts/draft', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: '{"expectedVersion":2}' })).json();
  assert.equal(patch.service, 'workflow'); assert.equal(patch.method, 'PATCH'); assert.equal(patch.body, '{"expectedVersion":2}');
  const file = new FormData(); file.append('file', new Blob(['PK-proxy-fixture']), 'don-nghi.docx'); file.append('expectedVersion', '2'); file.append('metadataVersion', '1');
  const upload = await (await fetch(base + '/api/v1/staffing/leave-drafts/draft/docx', { method: 'PUT', body: file })).json();
  assert.equal(upload.service, 'workflow'); assert.match(upload.contentType, /^multipart\/form-data; boundary=/); assert.match(upload.body, /name="file"/); assert.match(upload.body, /PK-proxy-fixture/); assert.match(upload.body, /name="metadataVersion"/);
  console.log(`PASS: ${cases.length} real Vite proxy routes + 3 request/header/body preservation checks`);
} finally {
  await vite?.close();
  await Promise.all(targets.map(({ server }) => new Promise(resolve => { server.closeAllConnections(); server.close(resolve); })));
}
