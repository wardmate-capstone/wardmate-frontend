import axios, { type AxiosAdapter } from 'axios';
import { createJwtClient } from './createJwtClient';
import { redirectToLogin } from '../authRedirect';
import { useAuthStore, type CurrentUser } from '@/stores/authStore';
import type { UserProfileDto, ProfileInput } from '@/types/profile';
import { configuredServiceOrigins, serviceUrls } from './serviceUrls';
export type { UserProfileDto, ProfileInput };

const baseURL = serviceUrls.iam;
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
};
// Chỉ các request /auth/* đọc hoặc xoay cookie refresh (Path=/api/v1/auth) mới cần khoá Web Lock.
// Khoá cả request nghiệp vụ sẽ biến mọi lời gọi IAM thành tuần tự (kể cả giữa các tab).
const authCookieConfig = { ...cookieConfig, adapter: cookieAdapter };

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
  allowedOrigins: configuredServiceOrigins,
  refreshAccessToken: async (transport) => {
    const response = await transport.post('/api/v1/auth/refresh-token', undefined, authCookieConfig);
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
  const response = await api.post('/api/v1/auth/register', payload, { ...authCookieConfig, skipAuth: true });
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
  loginPending = api.post('/api/v1/auth/login', payload, { ...authCookieConfig, skipAuth: true })
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
  logoutPending = api.post('/api/v1/auth/revoke-token', undefined, authCookieConfig)
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
  // Chỉ dùng để ưu tiên hiển thị; dữ liệu sai định dạng thì coi như chưa gán lĩnh vực.
  const assignedCategories = Array.isArray(data.assignedCategories)
    ? data.assignedCategories.filter((id): id is number => Number.isInteger(id) && id > 0)
    : [];
  useAuthStore.setState({ status: 'authenticated', user: { ...data, assignedCategories }, error: null, expired: false });
}

/**
 * Đồng bộ lại lĩnh vực phụ trách mà không bắt đăng nhập lại: Manager đổi lĩnh vực thì IAM áp dụng ngay
 * cho bộ lọc server, còn nhãn "Ngoài lĩnh vực" ở FE dựa vào danh sách lưu trong store.
 */
export async function refreshAssignedCategories(): Promise<number[]> {
  const version = sessionVersion;
  const { data } = await api.get<CurrentUser>('/api/v1/users/me', cookieConfig);
  const state = useAuthStore.getState();
  if (version !== sessionVersion || state.status !== 'authenticated' || !state.user || data?.id !== state.user.id) {
    return state.user?.assignedCategories ?? [];
  }
  const assignedCategories = Array.isArray(data.assignedCategories)
    ? data.assignedCategories.filter((id): id is number => Number.isInteger(id) && id > 0)
    : [];
  const current = state.user.assignedCategories ?? [];
  if (current.length !== assignedCategories.length || current.some((id, i) => id !== assignedCategories[i])) {
    useAuthStore.setState({ user: { ...state.user, assignedCategories } });
  }
  return assignedCategories;
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
  // Hồ sơ có thể đã bị xoá (PUT trả iam.profile_not_found) thì tạo mới bằng POST.
  const response = await api.put<UserProfileDto>('/api/v1/users/me/profile', payload, cookieConfig)
    .catch((error: unknown) => {
      if (iamErrorCode(error) !== 'iam.profile_not_found') throw error;
      return api.post<UserProfileDto>('/api/v1/users/me/profile', payload, cookieConfig);
    });
  if (owner && useAuthStore.getState().user === owner) useAuthStore.setState({ user: { ...owner, profile: response.data } });
  return response.data;
}

export async function deleteMyProfile(): Promise<void> {
  const owner = useAuthStore.getState().user;
  await api.delete('/api/v1/users/me/profile', cookieConfig);
  if (owner && useAuthStore.getState().user === owner) useAuthStore.setState({ user: { ...owner, profile: null } });
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

export async function changePassword(payload: ChangePasswordRequest): Promise<{ message: string }> {
  const response = await api.post<{ message: string }>('/api/v1/users/me/change-password', payload, cookieConfig);
  clearSession();
  channel?.postMessage('logout');
  return response.data;
}

/**
 * OTP mật khẩu qua kênh EMAIL (SMS chưa triển khai). BE trả cùng thông báo dù tài khoản có tồn tại hay không.
 * - FORGOT_PASSWORD: ẩn danh (quên mật khẩu).
 * - CHANGE_PASSWORD: phải gửi kèm Bearer; BE chỉ cho đổi mật khẩu của chính người đang đăng nhập.
 */
export type PasswordOtpPurpose = 'FORGOT_PASSWORD' | 'CHANGE_PASSWORD';

export async function requestPasswordOtp(emailOrUsername: string, purpose: PasswordOtpPurpose = 'FORGOT_PASSWORD'): Promise<{ message: string }> {
  const response = await api.post<{ message?: string }>('/api/v1/auth/password-otp/request',
    { emailOrUsername, channel: 'EMAIL', purpose },
    { ...authCookieConfig, skipAuth: purpose === 'FORGOT_PASSWORD' });
  return { message: response.data?.message || 'Nếu tài khoản hợp lệ, mã xác thực đã được gửi tới email đăng ký.' };
}

export interface ResetPasswordWithOtpRequest {
  emailOrUsername: string;
  otp: string;
  newPassword: string;
  confirmNewPassword: string;
}

export async function resetPasswordWithOtp(payload: ResetPasswordWithOtpRequest, purpose: PasswordOtpPurpose = 'FORGOT_PASSWORD'): Promise<{ message: string }> {
  const response = await api.post<{ message?: string }>('/api/v1/auth/password-otp/verify-and-change',
    { ...payload, purpose },
    { ...authCookieConfig, skipAuth: purpose === 'FORGOT_PASSWORD' });
  // BE đã thu hồi phiên và xoá cookie refresh; đồng bộ trạng thái nếu tab này đang đăng nhập.
  clearSession();
  channel?.postMessage('logout');
  return { message: response.data?.message || 'Đổi mật khẩu thành công. Vui lòng đăng nhập lại.' };
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

export async function getAccount(userId: string): Promise<AccountItem> {
  const response = await api.get<AccountItem>(`/api/v1/accounts/${userId}`, cookieConfig);
  return response.data;
}

export async function updateAccountStatus(userId: string, isActive: boolean): Promise<void> {
  await api.put(`/api/v1/accounts/${userId}/status`, { isActive }, cookieConfig);
}

// -----------------------------------------------------------
// ADMIN — Profiles API (/api/v1/users/{userId}/profile)
// -----------------------------------------------------------
export async function getAdminProfile(userId: string): Promise<UserProfileDto> {
  const response = await api.get<UserProfileDto>(`/api/v1/users/${userId}/profile`, cookieConfig);
  return response.data;
}

export async function createAdminProfile(userId: string, payload: ProfileInput): Promise<UserProfileDto> {
  const response = await api.post<UserProfileDto>(`/api/v1/users/${userId}/profile`, payload, cookieConfig);
  return response.data;
}

export async function updateAdminProfile(userId: string, payload: ProfileInput): Promise<UserProfileDto> {
  const response = await api.put<UserProfileDto>(`/api/v1/users/${userId}/profile`, payload, cookieConfig);
  return response.data;
}

/** Cập nhật hồ sơ người dùng; nếu hồ sơ chưa tồn tại (đã bị xoá) thì tạo mới. */
export async function saveAdminProfile(userId: string, payload: ProfileInput): Promise<UserProfileDto> {
  try {
    return await updateAdminProfile(userId, payload);
  } catch (error) {
    if (iamErrorCode(error) !== 'iam.profile_not_found') throw error;
    return createAdminProfile(userId, payload);
  }
}

export async function deleteAdminProfile(userId: string): Promise<void> {
  await api.delete(`/api/v1/users/${userId}/profile`, cookieConfig);
}

// -----------------------------------------------------------
// ADMIN & MANAGER — Staff Administration & Wards (API 54-58)
// -----------------------------------------------------------
export interface ManagedRoleDto {
  id: number;
  roleName: string;
}

export interface ManagedUserDto {
  id: string;
  username: string;
  email: string;
  isActive: boolean;
  wardId?: string | null;
  wardName?: string | null;
  wardCode?: string | null;
  profile?: UserProfileDto | null;
  roles: ManagedRoleDto[];
}

export interface ManagedUserPage {
  items: ManagedUserDto[];
  page: number;
  pageSize: number;
  total: number;
}

export interface WardDto {
  id: string;
  code: string;
  name: string;
}

export interface DirectoryUserDto {
  id: string;
  username: string;
  email: string;
  fullName?: string | null;
  identityNumber?: string | null;
  isActive: boolean;
  wardCode?: string | null;
  roles: string[];
  assignedCategories: number[];
}

export interface DirectoryPage {
  items: DirectoryUserDto[];
  page: number;
  pageSize: number;
  total: number;
}

export interface DirectoryFilter {
  search?: string;
  role?: string;
  wardCode?: string;
  assignedCategory?: number;
  page?: number;
  pageSize?: number;
}

export interface CreateFrontDeskInput {
  username: string;
  email: string;
  password: string;
  fullName: string;
  wardId?: string | null;
}

export interface CreateWardInput {
  code: string;
  name: string;
}

export async function createFrontDeskAccount(payload: CreateFrontDeskInput): Promise<ManagedUserDto> {
  const response = await api.post<ManagedUserDto>('/api/v1/accounts/front-desk', payload, cookieConfig);
  return response.data;
}

export type StaffAccountRole = 'FRONT_DESK_OFFICER' | 'MANAGER' | 'PROCEDURE_MANAGER';

const staffAccountPaths: Record<StaffAccountRole, string> = {
  FRONT_DESK_OFFICER: '/api/v1/accounts/front-desk',
  MANAGER: '/api/v1/accounts/manager',
  PROCEDURE_MANAGER: '/api/v1/accounts/procedure-manager',
};

/** IT_ADMIN tạo tài khoản cán bộ; vai trò được BE gán theo endpoint. */
export async function createStaffAccount(role: StaffAccountRole, payload: CreateFrontDeskInput): Promise<ManagedUserDto> {
  const response = await api.post<ManagedUserDto>(staffAccountPaths[role], payload, cookieConfig);
  return response.data;
}

export async function getWards(): Promise<WardDto[]> {
  const response = await api.get<WardDto[]>('/api/v1/accounts/wards', cookieConfig);
  return response.data;
}

export async function getPublicWards(): Promise<WardDto[]> {
  const response = await api.get<{ value?: WardDto[] } | WardDto[]>('/api/v1/wards', { ...cookieConfig, skipAuth: true });
  if (Array.isArray(response.data)) return response.data;
  return response.data?.value ?? [];
}

export async function getManagerOfficers(filter: DirectoryFilter = {}): Promise<DirectoryPage> {
  const response = await api.get<DirectoryPage>('/api/v1/manager/officers', {
    ...cookieConfig,
    params: filter,
  });
  return response.data;
}

export async function getAdminUsers(filter: DirectoryFilter = {}): Promise<DirectoryPage> {
  const response = await api.get<DirectoryPage>('/api/v1/admin/users', {
    ...cookieConfig,
    params: filter,
  });
  return response.data;
}

export async function assignOfficerCategories(userId: string, categories: number[]): Promise<void> {
  const sanitized = Array.from(new Set(categories))
    .filter(id => Number.isInteger(id) && id > 0)
    .slice(0, 100);
  await api.put(`/api/v1/manager/officers/${userId}/categories`, { categories: sanitized }, cookieConfig);
}

// IAM-CATEGORY-01: BE kiểm tra ID lĩnh vực với Catalog trước khi lưu.
export function officerCategoryError(error: unknown): string {
  const code = iamErrorCode(error);
  if (code === 'iam.invalid_categories') return 'Có lĩnh vực không còn tồn tại trong danh mục thủ tục. Vui lòng tải lại danh sách lĩnh vực rồi chọn lại.';
  if (code === 'iam.catalog_unavailable') return 'Chưa kiểm tra được danh mục lĩnh vực (dịch vụ thủ tục không phản hồi). Thay đổi chưa được lưu, vui lòng thử lại sau.';
  return authErrorMessage(error);
}

export async function createWard(payload: CreateWardInput): Promise<WardDto> {
  const response = await api.post<WardDto>('/api/v1/accounts/wards', payload, cookieConfig);
  return response.data;
}

export async function assignUserWard(userId: string, wardId: string | null): Promise<void> {
  await api.put(`/api/v1/accounts/${userId}/ward`, { wardId }, cookieConfig);
}


/** Mã lỗi IAM trong ProblemDetails (`code`), ví dụ `iam.otp_invalid`. */
export function iamErrorCode(error: unknown): string | undefined {
  if (!axios.isAxiosError(error)) return undefined;
  const data = error.response?.data as { code?: unknown; extensions?: { code?: unknown } } | undefined;
  const code = data?.code ?? data?.extensions?.code;
  return typeof code === 'string' ? code : undefined;
}

// Thông báo theo mã lỗi IAM; ưu tiên hơn thông báo chung theo HTTP status.
const iamErrorMessages: Record<string, string> = {
  'iam.invalid_credentials': 'Tên đăng nhập/email hoặc mật khẩu không đúng.',
  'iam.forbidden': 'Bạn không có quyền thực hiện thao tác này hoặc tài khoản nằm ngoài phạm vi quản lý của bạn.',
  'iam.csrf_rejected': 'Yêu cầu xác thực bị từ chối. Vui lòng kiểm tra cấu hình truy cập với quản trị viên.',
  'iam.user_not_found': 'Không tìm thấy tài khoản.',
  'iam.user_unavailable': 'Tài khoản không còn khả dụng. Vui lòng đăng nhập lại.',
  'iam.ward_not_found': 'Phường/xã không tồn tại hoặc đã bị xoá.',
  'iam.ward_required': 'Vui lòng chọn phường/xã cho tài khoản này.',
  'iam.ward_exists': 'Mã phường/xã đã tồn tại.',
  'iam.duplicate_account': 'Tên đăng nhập hoặc email đã được sử dụng.',
  'iam.self_disable': 'Bạn không thể tự khoá tài khoản của mình.',
  'iam.otp_invalid': 'Mã xác thực không đúng hoặc đã hết hạn.',
  'iam.otp_limit': 'Bạn đã yêu cầu mã xác thực quá số lần cho phép trong ngày. Vui lòng thử lại sau.',
  'iam.otp_rate_limited': 'Bạn thao tác quá nhiều lần. Vui lòng chờ khoảng 1 phút rồi thử lại.',
  'iam.email_unavailable': 'Hệ thống chưa gửi được email lúc này. Vui lòng thử lại sau.',
  'iam.current_password_invalid': 'Mật khẩu hiện tại không chính xác.',
  'iam.password_unchanged': 'Mật khẩu mới không được trùng với mật khẩu hiện tại.',
  'iam.concurrent_update': 'Tài khoản vừa được cập nhật ở nơi khác. Vui lòng thử lại.',
  'iam.profile_not_found': 'Không tìm thấy hồ sơ người dùng.',
  'iam.profile_exists': 'Hồ sơ người dùng đã tồn tại.',
  'iam.profile_conflict': 'Hồ sơ vừa được thay đổi ở nơi khác. Vui lòng tải lại rồi thử lại.',
  'iam.profile_changed': 'Hồ sơ vừa được thay đổi ở nơi khác. Vui lòng tải lại rồi thử lại.',
};

export function authErrorMessage(error: unknown): string {
  if (axios.isCancel(error)) return 'Phiên đăng nhập đã thay đổi. Vui lòng thử lại.';
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    if (!status) return 'Không thể kết nối máy chủ. Vui lòng kiểm tra kết nối và thử lại.';
    const code = iamErrorCode(error);
    if (code && iamErrorMessages[code]) return iamErrorMessages[code];
    if (status === 401) return 'Thông tin đăng nhập không đúng hoặc phiên đã hết hạn.';
    if (status === 403) return 'Yêu cầu xác thực bị từ chối. Vui lòng kiểm tra cấu hình truy cập với quản trị viên.';
    if (status === 404) return 'Không tìm thấy thông tin hồ sơ.';
    if (status === 429) return 'Bạn thao tác quá nhiều lần. Vui lòng chờ rồi thử lại.';
    if (status >= 500) return 'Máy chủ đang gặp sự cố. Vui lòng thử lại sau.';
    const data = error.response?.data;
    const errors = data?.errors && typeof data.errors === 'object'
      ? Object.entries(data.errors).map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(' ') : String(value)}`).join('\n')
      : '';
    const detail: unknown = data?.detail ?? data?.title;
    if (typeof detail === 'string' && detail.trim()) {
      return [detail.slice(0, 500), errors].filter(Boolean).join('\n');
    }
    if (status === 409) return 'Tên đăng nhập hoặc email đã được sử dụng.';
    return errors || 'Thông tin chưa hợp lệ. Vui lòng kiểm tra lại các trường đã nhập.';
  }
  return error instanceof Error ? error.message : 'Không thể hoàn tất xác thực. Vui lòng thử lại.';
}
export { createJwtClient, type JwtClientOptions } from './createJwtClient';

