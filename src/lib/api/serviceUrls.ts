function normalize(value: string | undefined) {
  return value?.trim().replace(/\/+$/, '') ?? '';
}

const env = (import.meta as unknown as { env?: Record<string, string> }).env ?? {};
const useApiProxy = env.VITE_USE_API_PROXY === 'true';

export const serviceUrls = {
  iam: useApiProxy ? '' : normalize(env.VITE_API_BASE_URL),
  // Analytics chỉ đi qua gateway (YARP định tuyến /api/v1/analytics, /api/v1/citizen/feedback); IAM không có các route này.
  analytics: useApiProxy ? '' : normalize(env.VITE_ANALYTICS_API_URL || env.VITE_DOCUMENT_FORM_API_URL),
  catalog: useApiProxy ? '' : normalize(env.VITE_CATALOG_API_URL),
  workflow: useApiProxy ? '' : normalize(env.VITE_WORKFLOW_API_URL),
  documentForm: useApiProxy ? '' : normalize(env.VITE_DOCUMENT_FORM_API_URL),
  aiOcr: useApiProxy ? '' : normalize(env.VITE_AI_OCR_API_URL || env.VITE_DOCUMENT_FORM_API_URL),
};

export function servicePath(baseUrl: string, path: string) {
  return baseUrl ? `${baseUrl}${path}` : path;
}

// Gateway Azure hỗ trợ prefix này; route ngắn /api/v1/system hiện trả 404.
// Dùng origin Gateway như hub thông báo, kể cả khi Analytics được cấu hình gọi trực tiếp.
export function systemAdministrationPath(route: string) {
  return servicePath(serviceUrls.documentForm, '/api/analytics-system/api/v1/system/' + route);
}

export const configuredServiceOrigins = Object.values(serviceUrls)
  .filter(Boolean)
  .map((url) => new URL(url).origin);
