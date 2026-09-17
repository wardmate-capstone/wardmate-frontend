import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  use: {
    baseURL: 'http://127.0.0.1:4317',
    channel: 'msedge',
    headless: true,
  },
  webServer: {
    command: 'node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 4317 --strictPort',
    url: 'http://127.0.0.1:4317',
    reuseExistingServer: false,
  },
});
