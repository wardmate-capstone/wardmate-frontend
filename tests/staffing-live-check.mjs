// Read-only integration check against a running, real Workflow + gateway + Vite.
// No login, generated accounts, fixture responses, or application writes.
// Run: STAFFING_OPENAPI_URL=http://127.0.0.1:5003/swagger/v1/swagger.json
//      STAFFING_API_ORIGIN=http://127.0.0.1:5173 node tests/staffing-live-check.mjs
import assert from 'node:assert/strict';

const origin = process.env.STAFFING_API_ORIGIN;
const openApiUrl = process.env.STAFFING_OPENAPI_URL;
assert(origin && openApiUrl, 'Set STAFFING_API_ORIGIN and STAFFING_OPENAPI_URL to running real services.');
const response = await fetch(openApiUrl);
assert.equal(response.status, 200, 'The real OpenAPI definition must be accessible.');
const spec = await response.json();
const routes = Object.entries(spec.paths).flatMap(([path, methods]) => {
  if (!(path.startsWith('/api/v1/staffing/') || path.includes('/consultations') || path === '/api/v1/manager/applications' || path.includes('/assignment-candidates') || path.endsWith('/assignments'))) return [];
  return Object.entries(methods).filter(([method]) => ['get', 'post'].includes(method)).map(([method, operation]) => ({ path, method, operation }));
});
assert.equal(routes.length, 18, 'Expected all 18 staffing operations in actual OpenAPI.');
for (const { path, method, operation } of routes) {
  assert(operation.security?.length || spec.security?.length, `${method} ${path} must require authentication`);
  // These IDs select no stored data: the real auth boundary must reject before any handler runs.
  const resolved = path.replace(/\{[^}]+\}/g, '00000000-0000-0000-0000-000000000000');
  const result = await fetch(new URL(resolved, origin), {
    method: method.toUpperCase(),
    headers: { 'Content-Type': 'application/json' },
    ...(method === 'post' ? { body: '{}' } : {}),
    redirect: 'manual',
  });
  assert.equal(result.status, 401, `${method} ${path} should return real Workflow 401, not a proxy 404/502/HTML response`);
  assert.match(result.headers.get('content-type') ?? '', /application\/problem\+json/);
  const problem = await result.json();
  assert.equal(problem.code, 'auth.unauthorized');
  console.log(`PASS ${method.toUpperCase()} ${path}: actual Workflow auth boundary reached`);
}
console.log('18/18 real OpenAPI + unauthenticated proxy checks passed. Authenticated workflows were not tested.');
