// Turns the SPA into static HTML for public pages so Google, WhatsApp and
// social link previews see real content and per-page meta tags.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const ssrDir = path.join(root, 'dist-ssr');

const { render, renderHeadTags } = await import(pathToFileURL(path.join(ssrDir, 'entry-server.js')).href);
const template = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');

const routes = ['/', '/login', '/signup'];

for (const url of routes) {
  const { html, head } = render(url);
  const page = template
    .replace('<!--app-head-->', head)
    // Tag the page with the URL it was built for — main.jsx only hydrates when they match
    .replace('<div id="root">', `<div id="root" data-prerendered="${url}">`)
    .replace('<!--app-html-->', html);

  if (url === '/') {
    fs.writeFileSync(path.join(dist, 'index.html'), page);
  } else {
    // login/index.html AND login.html, so any static host finds it at /login
    fs.mkdirSync(path.join(dist, url.slice(1)), { recursive: true });
    fs.writeFileSync(path.join(dist, url.slice(1), 'index.html'), page);
    fs.writeFileSync(path.join(dist, `${url.slice(1)}.html`), page);
  }
  console.log(`  prerendered ${url}`);
}

// SPA fallback shell for app routes (dashboard etc.) — no prerendered markup, noindex
const shell = template
  .replace('<!--app-head-->', renderHeadTags('/dashboard'))
  .replace('<!--app-html-->', '');
fs.writeFileSync(path.join(dist, 'app.html'), shell);
console.log('  wrote SPA fallback → dist/app.html');

// Sitemap
const site = (process.env.VITE_SITE_URL || 'https://workard.com').replace(/\/$/, '');
const today = new Date().toISOString().slice(0, 10);
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes
  .map(
    (u) => `  <url>
    <loc>${site}${u === '/' ? '/' : u}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${u === '/' ? 'weekly' : 'monthly'}</changefreq>
    <priority>${u === '/' ? '1.0' : '0.6'}</priority>
  </url>`
  )
  .join('\n')}
</urlset>
`;
fs.writeFileSync(path.join(dist, 'sitemap.xml'), sitemap);
console.log('  wrote dist/sitemap.xml');

fs.rmSync(ssrDir, { recursive: true, force: true });
