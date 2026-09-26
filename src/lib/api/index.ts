import { createJwtClient } from './createJwtClient';
import { redirectToLogin } from '../authRedirect';

// No requests are made on startup. Connect refreshAccessToken once the API contract is available.
export const authClient = createJwtClient({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '',
  onSessionExpired: redirectToLogin,
});
export const api = authClient.api;
export { createJwtClient, type JwtClientOptions } from './createJwtClient';
