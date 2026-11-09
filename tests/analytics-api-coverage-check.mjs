import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

// Compare a freshly downloaded public OpenAPI file with FE adapters and their UI consumers.
// Usage: node tests/analytics-api-coverage-check.mjs path/to/swagger.json
assert.ok(process.argv[2], 'Pass the downloaded Analytics OpenAPI JSON path.');
const spec = JSON.parse((await readFile(process.argv[2], 'utf8')).replace(/^\uFEFF/, ''));
const clients = [
  ['analytics', 'analyticsApi', [
    ['GET', 'analytics/overview', 'overview'], ['GET', 'analytics/trends', 'trends'],
    ['GET', 'analytics/procedures', 'procedures'], ['GET', 'analytics/officers', 'officers'],
    ['GET', 'analytics/feedback/summary', 'summary'], ['GET', 'analytics/feedback', 'feedback'],
    ['POST', 'analytics/jobs/rebuild', 'rebuild'], ['GET', 'analytics/jobs/{jobId}', 'job'],
    ['GET', 'citizen/feedback/{applicationId}', 'getFeedback'], ['POST', 'citizen/feedback/{applicationId}', 'createFeedback'],
  ]],
  ['systemAdministration', 'systemAdministrationApi', [
    ['GET', 'system/settings', 'settings'], ['GET', 'system/settings/{key}', 'setting'],
    ['PUT', 'system/settings/{key}', 'update'], ['GET', 'system/audit-logs', 'audits'],
    ['GET', 'system/audit-logs/{id}', 'audit'], ['GET', 'system/audit-events', 'events'], ['GET', 'system/audit-events/{id}', 'event'],
  ]],
  ['systemOperations', 'systemOperationsApi', [
    ['GET', 'system/health/services', 'services'], ['GET', 'system/health/services/{serviceName}', 'service'],
    ['POST', 'system/health/check-now', 'checkNow'], ['GET', 'system/health/history', 'history'],
    ['GET', 'system/backups', 'backups'], ['POST', 'system/backups', 'create'],
    ['GET', 'system/backups/{id}', 'backup'], ['POST', 'system/backups/{id}/verify', 'verify'],
  ]],
  ['notificationAdmin', 'notificationAdminApi', [
    ['GET', 'admin/notification-deliveries', 'list'], ['GET', 'admin/notification-deliveries/{id}', 'get'],
    ['GET', 'admin/notification-deliveries/{id}/audit', 'audit'], ['POST', 'admin/notification-deliveries/{id}/replay', 'replay'],
  ]],
];
async function sources(directory) {
  const result = [];
  for (const item of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, item.name);
    if (item.isDirectory()) result.push(...await sources(path));
    else if (/\.tsx?$/.test(item.name)) result.push({ path, text: await readFile(path, 'utf8') });
  }
  return result;
}
const ui = (await Promise.all(['src/components', 'src/pages', 'src/hooks'].map(sources))).flat();
const mapped = new Set();
for (const [module, symbol, operations] of clients) {
  const adapter = await readFile(`src/lib/api/${module}.ts`, 'utf8');
  for (const [method, route, member] of operations) {
    const key = `${method} /api/v1/${route}`;
    assert.ok(!mapped.has(key), `Duplicate mapping: ${key}`);
    mapped.add(key);
    assert.match(adapter, new RegExp(`\\b${member}\\s*:`), `Missing adapter for ${key}`);
    assert.ok(ui.some(source => {
      const imported = source.text.match(new RegExp(`import\\s*\\{[^}]*\\b${symbol}(?:\\s+as\\s+(\\w+))?`));
      return imported && new RegExp(`\\b${imported[1] || symbol}\\.${member}\\b`).test(source.text);
    }), `Missing UI/hook consumer for ${symbol}.${member}: ${key}`);
  }
}
const documented = new Set();
let serviceRoot = 0;
for (const [path, item] of Object.entries(spec.paths)) {
  for (const method of Object.keys(item)) {
    if (!['get', 'post', 'put', 'patch', 'delete', 'options', 'head'].includes(method)) continue;
    if (path === '/' && method === 'get') { serviceRoot++; continue; }
    documented.add(`${method.toUpperCase()} ${path}`);
  }
}
assert.deepEqual([...mapped].sort(), [...documented].sort(), 'OpenAPI and FE mappings differ; review missing or removed endpoints.');
assert.equal(serviceRoot, 1, 'Review the service-identification endpoint separately.');
console.log(`PASS: ${mapped.size}/${documented.size} Analytics operations mapped to existing adapters and UI/hook consumers; GET / is service identification.`);
console.log('Static coverage only. Authenticated behavior, payloads and error handling require the related integration tests.');
