import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import App from './App.jsx';
import { renderHeadTags } from './seo/seo.config.js';
import { faq } from './data/homeContent.js';
import { setPreloaded } from './data/preload.js';
import { setSeoOverride } from './seo/seo.config.js';
import { postSeo } from './seo/blogSeo.js';

// Used only at build time by scripts/prerender.js.
// data = what the page shows straight away (prices, blog posts) — see data/preload.js
export function render(url, data = {}) {
  setPreloaded(data);
  const slug = url.startsWith('/blog/') ? url.slice(6) : null;
  if (slug && data[`post:${slug}`]) setSeoOverride(url, postSeo(data[`post:${slug}`].post));
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
