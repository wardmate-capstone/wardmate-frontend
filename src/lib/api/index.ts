import axios, { type AxiosAdapter } from 'axios';
import { createJwtClient } from './createJwtClient';
import { redirectToLogin } from '../authRedirect';
import { useAuthStore, type CurrentUser } from '@/stores/authStore';
import type { UserProfileDto, ProfileInput } from '@/types/profile';
export type { UserProfileDto, ProfileInput };

const baseURL = import.meta.env.VITE_API_BASE_URL ?? '';
// Serialize cookie rotation with login/revoke across same-origin tabs. Tokens never enter storage.
const browserAdapter = axios.getAdapter(axios.defaults.adapter);
const cookieAdapter: AxiosAdapter = (config) => {
  const send = () => browserAdapter(config);
  // ponytail: without Web Locks only this tab's refresh is deduplicated; use a supported browser for multi-tab auth.
  return typeof navigator !== 'undefined' && navigator.locks
    ? navigator.locks.request('wardmate-auth:' + baseURL, send)
    : send();
};
const cookieConfig = {
  withCredentials: true,
  headers: { 'X-CSRF-Protection': '1' },
  adapter: cookieAdapter,
};

function readAccessToken(data: unknown): string {
  if (!data || typeof data !== 'object'
    || !('accessToken' in data) || typeof data.accessToken !== 'string' || !data.accessToken.trim()
    || !('tokenType' in data) || data.tokenType !== 'Bearer'
    || !('accessTokenExpiresAt' in data) || typeof data.accessTokenExpiresAt !== 'string'
    || !Number.isFinite(Date.parse(data.accessTokenExpiresAt)) || Date.parse(data.accessTokenExpiresAt) <= Date.now()
    || !('refreshTokenExpiresAt' in data) || typeof data.refreshTokenExpiresAt !== 'string'
    || !Number.isFinite(Date.parse(data.refreshTokenExpiresAt)) || Date.parse(data.refreshTokenExpiresAt) <= Date.now()) {
    throw new Error('Phản hồi xác thực không hợp lệ. Vui lòng thử lại.');
  }
  return data.accessToken;
}

export const authClient = createJwtClient({
  baseURL,
  refreshAccessToken: async (transport) => {
    const response = await transport.post('/api/v1/auth/refresh-token', undefined, cookieConfig);
    return readAccessToken(response.data);
  },
  // A CSRF rejection is a configuration/security error, not an expired session.
  isRefreshSessionExpired: (error) => axios.isAxiosError(error) && error.response?.status === 401,
  onSessionExpired: () => {
    clearSession();
    useAuthStore.setState({ expired: true });
    if (!bootstrapping) redirectToLogin();
  },
});
export const api = authClient.api;

const channel = typeof window !== 'undefined' && typeof BroadcastChannel !== 'undefined'
  ? new BroadcastChannel('wardmate-auth:' + baseURL) : null;
let sessionVersion = 0;
let bootstrapping = false;

function clearSession() {
  sessionVersion++;
  authClient.clearSession();
  useAuthStore.setState({ status: 'anonymous', user: null, error: null, expired: false });
}
if (channel) channel.onmessage = (event: MessageEvent<unknown>) => {
  if (event.data === 'login' || event.data === 'logout') {
    clearSession();
    if (event.data === 'login') void restoreSession();
  }
};
import.meta.hot?.dispose(() => channel?.close());

export type RegisterRequest = { username: string; email: string; password: string; fullName: string };
export type LoginRequest = { usernameOrEmail: string; password: string };

export async function register(payload: RegisterRequest) {
  const response = await api.post('/api/v1/auth/register', payload, { ...cookieConfig, skipAuth: true });
  if (response.status !== 201 || !response.data || typeof response.data.id !== 'string' || !response.data.id.trim()) {
    throw new Error('Phản hồi đăng ký không hợp lệ. Vui lòng thử đăng nhập hoặc liên hệ hỗ trợ.');
  }
  // Registration does not establish a session.
}

let loginPending: Promise<void> | undefined;
export function login(payload: LoginRequest): Promise<void> {
  if (loginPending) return Promise.reject(new Error('Đang đăng nhập. Vui lòng chờ hoàn tất.'));
  if (logoutPending) return Promise.reject(new Error('Đang đăng xuất. Vui lòng chờ hoàn tất.'));
  clearSession();
  useAuthStore.setState({ status: 'restoring' });
  const version = sessionVersion;
  loginPending = api.post('/api/v1/auth/login', payload, { ...cookieConfig, skipAuth: true })
    .then(async (response) => {
      if (version !== sessionVersion) throw new axios.CanceledError('Session changed.');
      authClient.setAccessToken(readAccessToken(response.data));
      channel?.postMessage('login');
      await loadCurrentUser(version);
    }).catch((error: unknown) => {
      if (version === sessionVersion) useAuthStore.setState({ status: authClient.hasAccessToken() ? 'error' : 'anonymous', error: authErrorMessage(error) });
      throw error;
    }).finally(() => { loginPending = undefined; });
  return loginPending;
}

let logoutPending: Promise<void> | undefined;
export function logout(): Promise<void> {
  if (logoutPending) return logoutPending;
  if (loginPending) return Promise.reject(new Error('Đang đăng nhập. Vui lòng chờ hoàn tất.'));
  logoutPending = api.post('/api/v1/auth/revoke-token', undefined, cookieConfig)
    .then((response) => {
      if (response.status !== 204) throw new Error('Máy chủ chưa xác nhận thu hồi phiên. Vui lòng thử lại.');
      clearSession();
      channel?.postMessage('logout');
    }).finally(() => { logoutPending = undefined; });
  return logoutPending;
}

async function loadCurrentUser(version: number) {
  const { data } = await api.get<CurrentUser>('/api/v1/users/me', cookieConfig);
  if (version !== sessionVersion) throw new axios.CanceledError('Session changed.');
  if (!data || typeof data.id !== 'string' || !Array.isArray(data.roles) || !data.roles.every(role => typeof role === 'string')
    || !Array.isArray(data.permissions) || !data.permissions.every(permission => typeof permission === 'string')) {
    throw new Error('Thông tin tài khoản không hợp lệ. Vui lòng thử lại.');
  }
  useAuthStore.setState({ status: 'authenticated', user: data, error: null, expired: false });
}

let restorePending: { version: number; promise: Promise<boolean> } | undefined;
export function restoreSession(): Promise<boolean> {
  if (loginPending) return loginPending.then(() => true, () => false);
  if (logoutPending) return logoutPending.then(() => false, () => false);
  if (useAuthStore.getState().status === 'authenticated') return Promise.resolve(true);
  if (restorePending?.version === sessionVersion) return restorePending.promise;
  const version = sessionVersion;
  bootstrapping = true;
  useAuthStore.setState({ status: 'restoring', error: null });
  const promise = authClient.restoreSession()
    .then(async () => {
      if (version !== sessionVersion) throw new axios.CanceledError('Session changed.');
      await loadCurrentUser(version);
      return true;
    })
    .catch((error: unknown) => {
      if (version === sessionVersion && !axios.isCancel(error)) {
        useAuthStore.setState({ status: 'error', user: null, error: authErrorMessage(error) });
      }
      return false;
    })
    .finally(() => {
      if (restorePending?.promise === promise) {
        restorePending = undefined;
        bootstrapping = false;
      }
    });
  restorePending = { version, promise };
  return promise;
}

export async function getMyProfile(): Promise<UserProfileDto> {
  const response = await api.get<UserProfileDto>('/api/v1/users/me/profile', cookieConfig);
  return response.data;
}

export async function updateMyProfile(payload: ProfileInput): Promise<UserProfileDto> {
  const owner = useAuthStore.getState().user;
  const response = await api.put<UserProfileDto>('/api/v1/users/me/profile', payload, cookieConfig);
  if (owner && useAuthStore.getState().user === owner) useAuthStore.setState({ user: { ...owner, profile: response.data } });
  return response.data;
}

// -----------------------------------------------------------
// ADMIN — Accounts API
// -----------------------------------------------------------
export interface AccountItem {
  id: string;
  username: string;
  email: string;
  isActive: boolean;
  createdAt: string;
}

export interface AccountListResponse {
  items: AccountItem[];
  page: number;
  pageSize: number;
  total: number;
}

export async function getAccounts(page = 1, pageSize = 20): Promise<AccountListResponse> {
  const response = await api.get<AccountListResponse>('/api/v1/accounts', {
    ...cookieConfig,
    params: { page, pageSize },
  });
  return response.data;
}

export async function getAccount(userId: string): Promise<AccountItem> {
  const response = await api.get<AccountItem>(`/api/v1/accounts/${userId}`, cookieConfig);
  return response.data;
}

export async function updateAccountStatus(userId: string, isActive: boolean): Promise<void> {
  await api.put(`/api/v1/accounts/${userId}/status`, { isActive }, cookieConfig);
}

export function authErrorMessage(error: unknown): string {
  if (axios.isCancel(error)) return 'Phiên đăng nhập đã thay đổi. Vui lòng thử lại.';
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    if (!status) return 'Không thể kết nối máy chủ. Vui lòng kiểm tra kết nối và thử lại.';
    if (status === 401) return 'Thông tin đăng nhập không đúng hoặc phiên đã hết hạn.';
    if (status === 403) return 'Yêu cầu xác thực bị từ chối. Vui lòng kiểm tra cấu hình truy cập với quản trị viên.';
    if (status === 404) return 'Không tìm thấy thông tin hồ sơ.';
    if (status === 429) return 'Bạn thao tác quá nhiều lần. Vui lòng chờ rồi thử lại.';
    if (status >= 500) return 'Máy chủ đang gặp sự cố. Vui lòng thử lại sau.';
    const detail: unknown = error.response?.data?.detail;
    if (typeof detail === 'string' && detail.trim()) return detail.slice(0, 500);
    if (status === 409) return 'Tên đăng nhập hoặc email đã được sử dụng.';
    return 'Thông tin chưa hợp lệ. Vui lòng kiểm tra lại các trường đã nhập.';
  }
  return error instanceof Error ? error.message : 'Không thể hoàn tất xác thực. Vui lòng thử lại.';
}
export { createJwtClient, type JwtClientOptions } from './createJwtClient';

