// Exercise the real ActionForm in isolation. No accounts, tokens, API fixtures or backend requests.
import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';
const html = `<!doctype html><html lang="vi"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head><body><div id="root"></div><script type="module">
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ActionForm } from '/src/components/staffing/shared.tsx';
import '/src/styles/globals.css';
const root = createRoot(document.getElementById('root'));
const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
function Form({ mode }) {
  const [options, setOptions] = useState([{ value: 'available', label: 'Lựa chọn kiểm tra' }]);
  const [closed, setClosed] = useState(false);
  window.removeSelection = () => setOptions([]);
  return closed ? React.createElement('p', {}, 'Đã đóng biểu mẫu') : React.createElement(ActionForm, {
    title: 'Kiểm tra biểu mẫu',
    fields: [{ name: 'officerId', label: 'Lựa chọn', type: 'select', options }, { name: 'reason', label: 'Lý do', type: 'textarea', max: 500 }],
    submit: async () => {
      window.submitCount++;
      if (mode === 'uncertain') throw new Error('Chưa xác định được kết quả thao tác.');
      if (mode === 'pending') await new Promise(resolve => { window.completeSubmission = resolve; });
    },
    onClose: () => setClosed(true),
  });
}
window.mountForm = mode => { window.submitCount = 0; root.render(React.createElement(QueryClientProvider, { client }, React.createElement(Form, { mode, key: mode }))); };
window.mountForm('validation');
</script></body></html>`;
const server = await createServer({
  configFile: false,
  cacheDir: 'test-results/.vite-staffing-form-isolated',
  optimizeDeps: { entries: [], esbuildOptions: { target: 'es2022' } },
  resolve: { alias: { '@': fileURLToPath(new URL('../src', import.meta.url)) } },
  plugins: [react(), tailwindcss(), {
    name: 'staffing-form-check',
    configureServer(vite) {
      vite.middlewares.use('/__staffing-form-check', async (request, response, next) => {
        if (request.url?.includes('html-proxy')) return next();
        try {
          response.setHeader('Content-Type', 'text/html; charset=utf-8');
          response.end(await vite.transformIndexHtml('/__staffing-form-check', html));
        } catch (error) { next(error); }
      });
    },
  }],
  server: { host: '127.0.0.1', port: 0, strictPort: false, open: false },
});
let browser;
let checks = 0;
try {
  await server.listen();
  browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage({ viewport: { width: 360, height: 800 } });
  let apiRequests = 0;
  const runtimeErrors = [];
  await page.route(url => url.pathname.startsWith('/api/'), route => route.abort());
  page.on('request', request => { if (new URL(request.url()).pathname.startsWith('/api/')) apiRequests++; });
  page.on('pageerror', error => { runtimeErrors.push(error.message); console.error('Browser error:', error.message); });
  page.on('console', message => { if (message.type() === 'error') console.error('Browser console:', message.text()); });
  await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/__staffing-form-check`);
  await page.getByRole('dialog', { name: 'Kiểm tra biểu mẫu' }).waitFor();
  await page.getByRole('button', { name: 'Xác nhận', exact: true }).click();
  await page.getByRole('alert').filter({ hasText: 'Vui lòng nhập thông tin.' }).first().waitFor();
  assert.equal(await page.evaluate(() => window.submitCount), 0); checks++;
  assert.ok(await page.getByLabel('Lý do').getAttribute('aria-describedby')); checks++;
  await page.getByLabel('Lựa chọn', { exact: false }).selectOption('available');
  await page.getByLabel('Lý do').fill('Kiểm tra lựa chọn thay đổi');
  await page.evaluate(() => window.removeSelection());
  await page.getByRole('button', { name: 'Xác nhận', exact: true }).click();
  await page.getByRole('alert').filter({ hasText: 'Lựa chọn không còn hợp lệ' }).waitFor();
  assert.equal(await page.evaluate(() => window.submitCount), 0); checks++;
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true); checks++;
  await page.screenshot({ path: 'test-results/staffing-validation-mobile.png' });

  await page.evaluate(() => window.mountForm('uncertain'));
  await page.getByLabel('Lựa chọn', { exact: false }).selectOption('available');
  await page.getByLabel('Lý do').fill('Kiểm tra kết quả chưa xác định');
  await page.getByRole('button', { name: 'Xác nhận', exact: true }).click();
  await page.getByRole('alert').filter({ hasText: 'Đóng hộp thoại và kiểm tra dữ liệu mới nhất' }).waitFor();
  assert.equal(await page.getByRole('button', { name: 'Xác nhận', exact: true }).isDisabled(), true); checks++;
  assert.equal(await page.evaluate(() => window.submitCount), 1); checks++;

  await page.evaluate(() => window.mountForm('pending'));
  await page.getByLabel('Lựa chọn', { exact: false }).selectOption('available');
  await page.getByLabel('Lý do').fill('Kiểm tra gửi lặp');
  await page.getByRole('button', { name: 'Xác nhận', exact: true }).click({ clickCount: 2 });
  await page.getByRole('button', { name: 'Đang lưu…', exact: true }).waitFor();
  assert.equal(await page.evaluate(() => window.submitCount), 1); checks++;
  await page.keyboard.press('Escape');
  assert.equal(await page.getByRole('dialog').isVisible(), true); checks++;
  await page.evaluate(() => window.completeSubmission());
  await page.getByText('Đã đóng biểu mẫu', { exact: true }).waitFor();
  checks++;
  assert.equal(apiRequests, 0); checks++;
  assert.deepEqual(runtimeErrors, []); checks++;
  console.log(`${checks}/${checks} isolated form interaction checks passed in Edge; 0 API requests. Not an authenticated workflow test.`);
} finally {
  await browser?.close();
  await server.close();
}
