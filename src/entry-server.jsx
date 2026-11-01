import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import App from './App.jsx';
import { renderHeadTags } from './seo/seo.config.js';
import { faq } from './data/homeContent.js';

// Used only at build time by scripts/prerender.js
export function render(url) {
  const html = renderToString(
    <StrictMode>
      <StaticRouter location={url}>
        <ToastProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </ToastProvider>
      </StaticRouter>
    </StrictMode>
  );
  return { html, head: renderHeadTags(url, faq) };
}

export { renderHeadTags };
