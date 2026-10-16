import assert from 'node:assert/strict';
import { createServer as createHttpServer } from 'node:http';
import { createServer, loadConfigFromFile } from 'vite';

// Exercise Vite's real proxy matching, including URL query strings. No Azure calls.
const targets = [];
let vite;
try {
  for (const name of ['iam', 'catalog', 'workflow', 'document']) {
    const server = createHttpServer((request, response) => {
      response.setHeader('Content-Type', 'application/json');
      response.end(JSON.stringify({ service: name, path: request.url }));
    });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    targets.push({ server, name, url: `http://127.0.0.1:${server.address().port}` });
  }
  const env = {
    VITE_API_BASE_URL: targets[0].url,
    VITE_CATALOG_API_URL: targets[1].url,
    VITE_WORKFLOW_API_URL: targets[2].url,
    VITE_DOCUMENT_FORM_API_URL: targets[3].url,
    VITE_USE_API_PROXY: 'true',
  };
  Object.assign(process.env, env);
  const loaded = await loadConfigFromFile({ command: 'serve', mode: 'development' });
  assert.ok(loaded, 'Vite config must load');
  vite = await createServer({ ...loaded.config, configFile: false, logLevel: 'error', server: { ...loaded.config.server, host: '127.0.0.1', port: 0, strictPort: false } });
  await vite.listen();
  const base = `http://127.0.0.1:${vite.httpServer.address().port}`;
  const cases = [
    ['/api/v1/applications/app/contents', 'document'],
    ['/api/v1/applications/app/approved-qr', 'document'],
    ['/api/v1/applications/app/approved-qr/image', 'document'],
    ['/api/v1/applications/app/generated-documents', 'document'],
    ['/api/v1/applications/app/generated-documents?submissionId=form', 'document'],
    ['/api/v1/applications/app/generate-pdf', 'document'],
    ['/api/v1/officer/submissions/by-application/app', 'document'],
    ['/api/v1/applications/app', 'workflow'],
    ['/api/v1/applications/app/submit', 'workflow'],
    ['/api/v1/officer/applications/pending?Page=1', 'workflow'],
    ['/api/v1/procedures?pageNumber=1', 'catalog'],
    ['/api/v1/users/me', 'iam'],
  ];
  for (const [path, service] of cases) {
    const response = await fetch(base + path);
    assert.equal(response.status, 200, path);
    const result = await response.json();
    assert.equal(result.service, service, path);
    assert.equal(result.path, path, 'Proxy must preserve request path and query');
  }
  console.log(`PASS: ${cases.length} real Vite proxy routes`);
} finally {
  await vite?.close();
  await Promise.all(targets.map(({ server }) => new Promise(resolve => { server.closeAllConnections(); server.close(resolve); })));
}
