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

// ---------- Data from the API: today's prices + every published blog post ----------
// Set WORKARD_API_URL on Vercel if the API isn't at the default address.
// If the API can't be reached, the site still builds (prices from config/plans.js, no post pages).
const apiUrl = (process.env.WORKARD_API_URL || process.env.VITE_API_URL || 'https://workardapi.onrender.com').replace(/\/$/, '');
let site = { plans: null, trialDays: null, posts: [] };
try {
  const res = await fetch(`${apiUrl}/api/site/build`, { signal: AbortSignal.timeout(45_000) }); // a sleeping Render server takes ~30s to wake
  if (res.ok) site = await res.json();
  console.log(`  site data from ${apiUrl}: ${site.posts.length} blog post(s)`);
} catch (err) {
  console.log(`  ⚠ could not load site data from ${apiUrl} (${err.message}) — building without blog posts`);
}

const lightPost = ({ post }) => ({ id: post.id, slug: post.slug, title: post.title, excerpt: post.excerpt, coverUrl: post.coverUrl, category: post.category, publishedAt: post.publishedAt });
const common = { plans: site.plans, trialDays: site.trialDays, posts: site.posts.slice(0, 3).map(lightPost) };
const categories = [...new Set(site.posts.map((p) => p.post.category).filter(Boolean))].sort().map((name) => ({ name, count: site.posts.filter((p) => p.post.category === name).length }));
const blogPage = { posts: site.posts.slice(0, 12).map(lightPost), total: site.posts.length, page: 1, pages: Math.max(1, Math.ceil(site.posts.length / 12)), categories };

const postRoutes = site.posts.map((p) => `/blog/${p.post.slug}`);
const routes = ['/', '/login', '/signup', '/privacy', '/blog', ...postRoutes];

const dataFor = (url) => {
  if (url === '/blog') return { ...common, blog: blogPage };
  if (url.startsWith('/blog/')) {
    const found = site.posts.find((p) => `/blog/${p.post.slug}` === url);
    return { ...common, [`post:${found.post.slug}`]: found };
  }
  return common;
};

for (const url of routes) {
  const data = dataFor(url);
  const { html, head } = render(url, data);
  // The same data goes into the page, so the browser starts from exactly what was built
  const dataScript = `<script>window.__WK_DATA__=${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`;
  const page = template
    .replace('<!--app-head-->', `${head}\n    ${dataScript}`)
    // Tag the page with the URL it was built for — main.jsx only hydrates when they match
    .replace('<div id="root">', `<div id="root" data-prerendered="${url}">`)
    .replace('<!--app-html-->', html);

  if (url === '/') {
    fs.writeFileSync(path.join(dist, 'index.html'), page);
  } else {
    // login/index.html AND login.html, so any static host finds it at /login
    fs.mkdirSync(path.join(dist, url.slice(1)), { recursive: true });
    fs.writeFileSync(path.join(dist, url.slice(1), 'index.html'), page);
    fs.mkdirSync(path.dirname(path.join(dist, `${url.slice(1)}.html`)), { recursive: true });
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
const siteUrl = (process.env.VITE_SITE_URL || 'https://workard.com').replace(/\/$/, '');
const today = new Date().toISOString().slice(0, 10);
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes
  .map(
    (u) => `  <url>
    <loc>${siteUrl}${u === '/' ? '/' : u}</loc>
    <lastmod>${(site.posts.find((p) => `/blog/${p.post.slug}` === u)?.post.updatedAt || today).slice(0, 10)}</lastmod>
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
