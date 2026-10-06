import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: 'localhost',
    port: 5173,
    strictPort: true,
    proxy: {
      '/api/v1/procedures': {
        target: 'https://wardmate-procedure-catalog.blackmeadow-a2f12767.japaneast.azurecontainerapps.io',
        changeOrigin: true,
        secure: false,
      },
      '/api/v1/procedure-manager': {
        target: 'https://wardmate-procedure-catalog.blackmeadow-a2f12767.japaneast.azurecontainerapps.io',
        changeOrigin: true,
        secure: false,
      },
      '/api': {
        target: 'https://wardmate-iam.blackmeadow-a2f12767.japaneast.azurecontainerapps.io',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
});
