import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  use: {
    baseURL: 'http://127.0.0.1:4317',
    channel: 'msedge',
    headless: true,
  },
  webServer: {
    // Auth tests intercept this origin; never use the real API from the developer's .env.
    env: {
      VITE_API_BASE_URL: 'http://localhost:5000',
      VITE_CATALOG_API_URL: 'http://localhost:5000',
      VITE_WORKFLOW_API_URL: 'http://localhost:5000',
      VITE_DOCUMENT_FORM_API_URL: 'http://localhost:5000',
      VITE_USE_API_PROXY: 'false',
    },
    command: 'node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 4317 --strictPort',
    url: 'http://127.0.0.1:4317',
    reuseExistingServer: false,
  },
});
