import { SITE_NAME, SITE_URL } from './seo.config.js';

// Page tags for one blog post (Google, WhatsApp / social previews) — used by the
// post page in the browser and by the prerender script at build time.
export function postSeo(post) {
  const title = `${post.seoTitle || post.title} — ${SITE_NAME}`;
  const description = post.seoDescription || post.excerpt || '';
  return {
    title,
    description,
    image: post.coverUrl && /^https?:/.test(post.coverUrl) ? post.coverUrl : undefined,
    type: 'article',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: post.title,
      description,
      image: post.coverUrl && /^https?:/.test(post.coverUrl) ? [post.coverUrl] : undefined,
      datePublished: String(post.publishedAt).replace(' ', 'T'),
      dateModified: String(post.updatedAt || post.publishedAt).replace(' ', 'T'),
      author: { '@type': 'Person', name: post.authorName },
      publisher: { '@type': 'Organization', name: SITE_NAME, logo: { '@type': 'ImageObject', url: `${SITE_URL}/apple-touch-icon.png` } },
      mainEntityOfPage: `${SITE_URL}/blog/${post.slug}`,
    },
  };
}
