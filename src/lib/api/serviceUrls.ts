function normalize(value: string | undefined) {
  return value?.trim().replace(/\/+$/, '') ?? '';
}

const env = (import.meta as unknown as { env?: Record<string, string> }).env ?? {};
const useApiProxy = env.VITE_USE_API_PROXY === 'true';

export const serviceUrls = {
  iam: useApiProxy ? '' : normalize(env.VITE_API_BASE_URL),
  analytics: useApiProxy ? '' : normalize(env.VITE_ANALYTICS_API_URL || env.VITE_API_BASE_URL),
  catalog: useApiProxy ? '' : normalize(env.VITE_CATALOG_API_URL),
  workflow: useApiProxy ? '' : normalize(env.VITE_WORKFLOW_API_URL),
  documentForm: useApiProxy ? '' : normalize(env.VITE_DOCUMENT_FORM_API_URL),
  aiOcr: useApiProxy ? '' : normalize(env.VITE_AI_OCR_API_URL || env.VITE_DOCUMENT_FORM_API_URL),
};

export function servicePath(baseUrl: string, path: string) {
  return baseUrl ? `${baseUrl}${path}` : path;
}

export const configuredServiceOrigins = Object.values(serviceUrls)
  .filter(Boolean)
  .map((url) => new URL(url).origin);
