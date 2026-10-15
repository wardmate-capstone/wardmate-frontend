import { fileURLToPath, URL } from 'node:url';
import { defineConfig, loadEnv, type ProxyOptions } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

function proxyTo(target?: string): ProxyOptions | undefined {
  const normalized = target?.trim().replace(/\/+$/, '');
  if (!normalized) return undefined;
  return { target: normalized, changeOrigin: true, secure: true, headers: { Origin: normalized } };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const iam = proxyTo(env.VITE_API_BASE_URL);
  const catalog = proxyTo(env.VITE_CATALOG_API_URL);
  const workflow = proxyTo(env.VITE_WORKFLOW_API_URL);
  const documentForm = proxyTo(env.VITE_DOCUMENT_FORM_API_URL);
  const proxy: Record<string, ProxyOptions> = {};

  if (documentForm) {
    proxy['/api/v1/citizen/submissions'] = documentForm;
    proxy['/api/v1/officer/submissions'] = documentForm;
    proxy['/api/v1/supporting-documents'] = documentForm;
    proxy['/api/v1/generated-documents'] = documentForm;
    proxy['^/api/v1/applications/[^/]+/(contents|supporting-documents|generate-pdf|generated-documents)$'] = documentForm;
    proxy['/api/v1/form-templates'] = documentForm;
  }
  if (catalog) {
    proxy['/api/v1/procedures'] = catalog;
    proxy['/api/v1/procedure-manager'] = catalog;
  }
  if (workflow) {
    proxy['/api/v1/officer/applications'] = workflow;
    proxy['/api/v1/applications'] = workflow;
  }
  if (iam) proxy['/api'] = iam;

  return {
    plugins: [react(), tailwindcss()],
    server: { host: 'localhost', port: 5173, strictPort: true, proxy },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'charts': ['recharts'],
            'icons': ['@phosphor-icons/react', 'lucide-react'],
          },
        },
      },
    },
    resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  };
});
