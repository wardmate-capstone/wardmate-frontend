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

// Only production builds with a configured site token load Analytics.
const analyticsToken = import.meta.env.VITE_CLOUDFLARE_WEB_ANALYTICS_TOKEN?.trim();
if (import.meta.env.PROD && analyticsToken) {
  const script = document.createElement('script');
  script.type = 'module';
  script.async = true;
  script.src = 'https://static.cloudflareinsights.com/beacon.min.js';
  script.dataset.cfBeacon = JSON.stringify({ token: analyticsToken });
  document.head.appendChild(script);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryProvider><App /></QueryProvider>
    {import.meta.env.PROD && <Analytics />}
  </StrictMode>,
);
