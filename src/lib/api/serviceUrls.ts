function normalize(value: string | undefined) {
  return value?.trim().replace(/\/+$/, '') ?? '';
}

const useApiProxy = import.meta.env.VITE_USE_API_PROXY === 'true';

export const serviceUrls = {
  iam: useApiProxy ? '' : normalize(import.meta.env.VITE_API_BASE_URL),
  catalog: useApiProxy ? '' : normalize(import.meta.env.VITE_CATALOG_API_URL),
  workflow: useApiProxy ? '' : normalize(import.meta.env.VITE_WORKFLOW_API_URL),
  documentForm: useApiProxy ? '' : normalize(import.meta.env.VITE_DOCUMENT_FORM_API_URL),
};

export function servicePath(baseUrl: string, path: string) {
  return baseUrl ? `${baseUrl}${path}` : path;
}

export const configuredServiceOrigins = Object.values(serviceUrls)
  .filter(Boolean)
  .map((url) => new URL(url).origin);
