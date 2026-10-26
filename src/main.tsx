import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Analytics } from '@vercel/analytics/react';
import { App } from '@/app/App';
import { QueryProvider } from '@/app/QueryProvider';
import '@fontsource/be-vietnam-pro/300.css';
import '@fontsource/be-vietnam-pro/400.css';
import '@fontsource/be-vietnam-pro/500.css';
import '@fontsource/be-vietnam-pro/600.css';
import '@fontsource/be-vietnam-pro/700.css';
import '@fontsource/be-vietnam-pro/800.css';
import '@/styles/globals.css';


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryProvider><App /></QueryProvider>
    {import.meta.env.PROD && <Analytics />}
  </StrictMode>,
);
