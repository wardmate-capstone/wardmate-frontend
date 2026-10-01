import axios, { AxiosError, CanceledError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';

declare module 'axios' {
  interface AxiosRequestConfig {
    /** Public/login requests never attach a JWT or trigger refresh. */
    skipAuth?: boolean;
    /** Internal metadata. Do not set these fields in application code. */
    _jwt?: { session: number; tokenVersion: number; retried: boolean };
  }
}
export type JwtClientOptions = {
  baseURL: string;
  /** Use the separate transport supplied here to avoid refresh recursion.
   * The backend adapter must validate its response and return an access token.
   * Cookie or JSON refresh credentials are handled by that adapter.
   */
  refreshAccessToken?: (transport: AxiosInstance) => Promise<string>;
  onSessionExpired?: () => void;
  isRefreshSessionExpired?: (error: unknown) => boolean;
  timeout?: number;
};

export function createJwtClient(options: JwtClientOptions) {
  const config = { baseURL: options.baseURL, timeout: options.timeout ?? 15000 };
  const api = axios.create(config);
  const authTransport = axios.create(config);
  let token: string | null = null;
  let session = 0;
  let tokenVersion = 0;
  let pending: { session: number; promise: Promise<void> } | undefined;

  function setAccessToken(value: string | null) {
    if (value !== null && !value.trim()) throw new Error('Access token must not be empty.');
    session++;
    tokenVersion++;
    token = value;
    pending = undefined;
  }
  function expire(expectedSession: number) {
    if (session !== expectedSession) return;
    setAccessToken(null);
    options.onSessionExpired?.();
  }
  function refresh(expectedSession: number) {
    if (pending?.session === expectedSession) return pending.promise;
    const promise = Promise.resolve().then(async () => {
      const nextToken = await options.refreshAccessToken!(authTransport);
      if (session !== expectedSession) throw new CanceledError('Session changed during refresh.');
      if (typeof nextToken !== 'string' || !nextToken.trim()) {
        throw new Error('Refresh adapter did not return a valid access token.');
      }
      token = nextToken;
      tokenVersion++;
    }).catch((error: unknown) => {
      // A connection/server error should allow a later retry, not sign the user out.
      if (options.isRefreshSessionExpired ? options.isRefreshSessionExpired(error)
        : axios.isAxiosError(error) && [401, 403].includes(error.response?.status ?? 0)) {
        expire(expectedSession);
      }
      throw error;
    }).finally(() => {
      if (pending?.promise === promise) pending = undefined;
    });
    pending = { session: expectedSession, promise };
    return promise;
  }

  api.interceptors.request.use((request) => {
    if (!options.baseURL.trim()) throw new Error('API chưa được cấu hình.');
    // This instance is for one backend only; never send JWTs to an arbitrary host.
    const root = new URL(options.baseURL, typeof location === 'undefined' ? 'http://localhost' : location.origin);
    const target = new URL(api.getUri(request), root);
    if (target.origin !== root.origin) throw new Error('API request must use the configured backend origin.');
    if (request.skipAuth) {
      request.headers.delete('Authorization');
      return request;
    }
    if (request._jwt && request._jwt.session !== session) throw new CanceledError('Session changed.');
    request._jwt = { session, tokenVersion, retried: request._jwt?.retried ?? false };
    if (token) request.headers.set('Authorization', 'Bearer ' + token);
    else request.headers.delete('Authorization');
    return request;
  });

  api.interceptors.response.use((response) => response, async (error: unknown) => {
    if (!axios.isAxiosError(error) || error.response?.status !== 401 || !error.config || error.config.skipAuth) throw error;
    const request: InternalAxiosRequestConfig = error.config;
    const sent = request._jwt;
    if (!sent || sent.session !== session || request.signal?.aborted) throw error;
    if (sent.retried) {
      expire(sent.session);
      throw error;
    }
    if (!options.refreshAccessToken) {
      // No backend contract yet: never invent a refresh endpoint.
      if (token) expire(sent.session);
      throw error;
    }
    request._jwt = { ...sent, retried: true };
    // A late 401 from the old token can reuse a refresh that already completed.
    if (sent.tokenVersion === tokenVersion) await refresh(sent.session);
    if (request.signal?.aborted || sent.session !== session) throw new CanceledError('Request canceled or session changed.');
    return api.request(request);
  });

  return {
    api,
    hasAccessToken: () => token !== null,
    setAccessToken,
    clearSession: () => setAccessToken(null),
  };
}
export { AxiosError };
