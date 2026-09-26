import { test, expect } from '@playwright/test';
import { AxiosError, type AxiosAdapter, type InternalAxiosRequestConfig } from 'axios';
import { createJwtClient } from '../src/lib/api/createJwtClient';
import { safeReturnTo, sessionExpiredUrl } from '../src/lib/authRedirect';

const baseURL = 'https://api.example.test';
function response(config: InternalAxiosRequestConfig, status = 200) {
  return { config, status, statusText: String(status), headers: {}, data: { ok: true } };
}
function failure(config: InternalAxiosRequestConfig, status = 401) {
  return new AxiosError('HTTP error', 'ERR_BAD_RESPONSE', config, undefined, response(config, status));
}
const denied: AxiosAdapter = async (config) => { throw failure(config); };
function gate() {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => { resolve = done; });
  return { promise, resolve };
}

test('parallel 401 responses share one refresh and retry with the new JWT', async () => {
  let refreshes = 0;
  let requests = 0;
  const client = createJwtClient({ baseURL, refreshAccessToken: async () => {
    refreshes++;
    await new Promise((resolve) => setTimeout(resolve, 20));
    return 'new-token';
  } });
  client.setAccessToken('old-token');
  client.api.defaults.adapter = async (config) => {
    requests++;
    if (config.headers.get('Authorization') === 'Bearer old-token') throw failure(config);
    expect(config.headers.get('Authorization')).toBe('Bearer new-token');
    return response(config);
  };
  await Promise.all([client.api.get('/a'), client.api.get('/b'), client.api.get('/c')]);
  expect(refreshes).toBe(1);
  expect(requests).toBe(6);
});

test('late 401 reuses completed refresh', async () => {
  let refreshes = 0;
  const late = gate();
  const started = gate();
  const client = createJwtClient({ baseURL, refreshAccessToken: async () => { refreshes++; return 'new'; } });
  client.setAccessToken('old');
  client.api.defaults.adapter = async (config) => {
    if (config.headers.get('Authorization') === 'Bearer old') {
      if (config.url === '/late') { started.resolve(); await late.promise; }
      throw failure(config);
    }
    return response(config);
  };
  const delayed = client.api.get('/late');
  await started.promise;
  await client.api.get('/first');
  late.resolve();
  await delayed;
  expect(refreshes).toBe(1);
});

test('invalid refresh expires session once for concurrent requests', async () => {
  let expired = 0;
  let refreshes = 0;
  const client = createJwtClient({ baseURL, onSessionExpired: () => { expired++; },
    refreshAccessToken: async (transport) => {
      refreshes++;
      transport.defaults.adapter = denied;
      return (await transport.post('/refresh')).data.accessToken;
    } });
  client.setAccessToken('old');
  client.api.defaults.adapter = denied;
  const results = await Promise.allSettled([client.api.get('/a'), client.api.get('/b')]);
  expect(results.every((result) => result.status === 'rejected')).toBe(true);
  expect(expired).toBe(1);
  expect(refreshes).toBe(1);
});

test('second 401 stops after one retry and expires the session', async () => {
  let requests = 0;
  let expired = 0;
  const client = createJwtClient({ baseURL, refreshAccessToken: async () => 'new', onSessionExpired: () => { expired++; } });
  client.setAccessToken('old');
  client.api.defaults.adapter = async (config) => { requests++; throw failure(config); };
  await expect(client.api.get('/private')).rejects.toBeInstanceOf(AxiosError);
  expect(requests).toBe(2);
  expect(expired).toBe(1);
});

test('public requests and 403 errors do not refresh or redirect', async () => {
  let refreshes = 0;
  let expired = 0;
  const client = createJwtClient({ baseURL, refreshAccessToken: async () => { refreshes++; return 'new'; }, onSessionExpired: () => { expired++; } });
  client.setAccessToken('old');
  client.api.defaults.adapter = async (config) => {
    if (config.skipAuth) expect(config.headers.has('Authorization')).toBe(false);
    throw failure(config, config.skipAuth ? 401 : 403);
  };
  await expect(client.api.post('/login', {}, { skipAuth: true })).rejects.toBeInstanceOf(AxiosError);
  await expect(client.api.get('/forbidden')).rejects.toBeInstanceOf(AxiosError);
  expect(refreshes).toBe(0);
  expect(expired).toBe(0);
});

test('temporary refresh failure keeps session and permits a later refresh', async () => {
  let refreshes = 0;
  let expired = 0;
  const client = createJwtClient({ baseURL, onSessionExpired: () => { expired++; }, refreshAccessToken: async () => {
    refreshes++;
    if (refreshes === 1) throw new AxiosError('Network unavailable', 'ERR_NETWORK');
    return 'new';
  } });
  client.setAccessToken('old');
  client.api.defaults.adapter = async (config) => {
    if (config.headers.get('Authorization') === 'Bearer old') throw failure(config);
    return response(config);
  };
  await expect(client.api.get('/a')).rejects.toThrow('Network unavailable');
  await client.api.get('/b');
  expect(refreshes).toBe(2);
  expect(expired).toBe(0);
});

test('logout during refresh cannot restore the old session', async () => {
  const ready = gate();
  const finish = gate();
  let calls = 0;
  const client = createJwtClient({ baseURL, refreshAccessToken: async () => { ready.resolve(); await finish.promise; return 'stale'; } });
  client.setAccessToken('old');
  client.api.defaults.adapter = async (config) => { calls++; throw failure(config); };
  const result = client.api.get('/private').catch((error) => error);
  await ready.promise;
  client.clearSession();
  finish.resolve();
  expect((await result).code).toBe('ERR_CANCELED');
  expect(calls).toBe(1);
});

test('aborted request is not retried after refresh', async () => {
  const ready = gate();
  const finish = gate();
  const controller = new AbortController();
  let calls = 0;
  const client = createJwtClient({ baseURL, refreshAccessToken: async () => { ready.resolve(); await finish.promise; return 'new'; } });
  client.api.defaults.adapter = async (config) => { calls++; throw failure(config); };
  const result = client.api.get('/private', { signal: controller.signal }).catch((error) => error);
  await ready.promise;
  controller.abort();
  finish.resolve();
  expect((await result).code).toBe('ERR_CANCELED');
  expect(calls).toBe(1);
});

test('missing configuration and foreign origins never dispatch requests', async () => {
  let calls = 0;
  for (const client of [createJwtClient({ baseURL: '' }), createJwtClient({ baseURL })]) {
    client.setAccessToken('secret');
    client.api.defaults.adapter = async (config) => { calls++; return response(config); };
    await expect(client.api.get('https://foreign.test/private')).rejects.toThrow();
  }
  expect(calls).toBe(0);
});

test('redirect preserves a safe local destination and rejects external/auth URLs', () => {
  const path = '/officer/ho-so?status=pending#detail';
  expect(safeReturnTo(path)).toBe(path);
  const url = new URL(sessionExpiredUrl(path), 'https://wardmate.test');
  expect(url.pathname).toBe('/dang-nhap');
  expect(url.searchParams.get('returnTo')).toBe(path);
  for (const unsafe of ['https://evil.test', '//evil.test', '/\\evil.test', '/dang-nhap', '/dang-ky', null]) {
    expect(safeReturnTo(unsafe)).toBe('/');
  }
});
