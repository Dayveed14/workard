import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { getSeo } from './seo.config.js';

function upsert(selector, create, attr, value) {
  let el = document.head.querySelector(selector);
  if (!el) {
    el = create();
    document.head.appendChild(el);
  }
  el.setAttribute(attr, value);
}

const meta = (key, keyAttr, value) =>
  upsert(
    `meta[${keyAttr}="${key}"]`,
    () => {
      const m = document.createElement('meta');
      m.setAttribute(keyAttr, key);
      return m;
    },
    'content',
    value
  );

// Keeps <title>, description, canonical and Open Graph tags in sync on client-side navigation
export function useSeo() {
  const { pathname } = useLocation();
  // A page with its own tags (a blog post) tells us when they're ready
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const bump = () => setVersion((v) => v + 1);
    window.addEventListener('workard:seo', bump);
    return () => window.removeEventListener('workard:seo', bump);
  }, []);

  useEffect(() => {
    const s = getSeo(pathname);
    document.title = s.title;
    meta('description', 'name', s.description);
    meta('robots', 'name', s.noindex ? 'noindex, nofollow' : 'index, follow');
    meta('og:title', 'property', s.title);
    meta('og:description', 'property', s.description);
    meta('og:url', 'property', s.canonical);
    meta('og:image', 'property', s.image);
    meta('og:type', 'property', s.type || 'website');
    meta('twitter:title', 'name', s.title);
    meta('twitter:description', 'name', s.description);
    upsert(
      'link[rel="canonical"]',
      () => {
        const l = document.createElement('link');
        l.rel = 'canonical';
        return l;
      },
      'href',
      s.canonical
    );
  }, [pathname, version]);
}
