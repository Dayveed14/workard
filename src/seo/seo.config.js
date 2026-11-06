// Single source of truth for page SEO — used by the browser (useSeo)
// and at build time (scripts/prerender.js) so crawlers and link previews get real tags.

export const SITE_URL = (import.meta.env?.VITE_SITE_URL || 'https://workard.com').replace(/\/$/, '');
export const SITE_NAME = 'Workard';
export const DEFAULT_IMAGE = '/og-image.png';

export const pages = {
  '/': {
    title: 'Workard — HR, Attendance, CRM, Invoicing & Business Operations Software in Nigeria',
    description:
      'Workard is the digital operations centre for your business. Manage employees, verified clock-in and attendance, leave, customers, invoices, expenses and business calls — in one platform built for Nigerian companies, small and large.',
    keywords:
      'HR software Nigeria, attendance software Nigeria, staff clock in app, leave management, employee management software, invoicing software Nigeria, business management software, cloud phone system Nigeria',
  },
  '/login': {
    title: 'Log in — Workard',
    description: 'Log in to your Workard account to manage your team, attendance, leave and business operations.',
  },
  '/signup': {
    title: 'Create your account — Workard',
    description:
      'Choose a Starter, Business or Enterprise plan and set up your organisation on Workard: employees, verified clock-in, onboarding, payroll and more.',
  },
  '/forgot-password': {
    title: 'Reset your password — Workard',
    description: 'Reset your Workard password.',
    noindex: true,
  },
};

// Logged-in pages: titled, never indexed
const APP_TITLES = {
  '/dashboard': 'Dashboard',
  '/employees': 'Employees',
  '/attendance': 'Attendance',
  '/leave': 'Leave',
  '/settings': 'Settings',
  '/customers': 'Customers',
  '/invoices': 'Invoices',
  '/finance': 'Finance',
  '/payroll': 'Payroll',
  '/payslips': 'Payslips',
  '/billing': 'Plan & billing',
  '/onboarding': 'Onboarding',
  '/tasks': 'Tasks',
  '/reviews': 'Performance reviews',
  '/i': 'Invoice',
  '/invite': 'Accept invitation',
  '/meetings': 'Meetings',
  '/projects': 'Projects',
  '/resources': 'Resources',
  '/requests': 'Requests',
  '/announcements': 'Announcements',
  '/performance': 'Team performance',
  '/feedback': 'Feedback', // the private follow-up link for anonymous feedback
};

export const notFound = {
  title: 'Page not found — Workard',
  description: 'The page you are looking for does not exist.',
  noindex: true,
};

function appMeta(pathname) {
  const prefix = Object.keys(APP_TITLES).find((p) => pathname === p || pathname.startsWith(`${p}/`));
  return prefix ? { title: `${APP_TITLES[prefix]} — Workard`, description: 'Workard', noindex: true } : null;
}

export function getSeo(rawPathname) {
  const pathname = rawPathname.replace(/\/$/, '') || '/'; // "/login/" → "/login"
  const meta = pages[pathname] || appMeta(pathname) || notFound;
  return {
    ...meta,
    canonical: `${SITE_URL}${pathname === '/' ? '' : pathname}`,
    image: `${SITE_URL}${DEFAULT_IMAGE}`,
  };
}

// Structured data for the home page (Google rich results)
export const homeJsonLd = [
  {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/apple-touch-icon.png`,
    slogan: 'Run Your Business. Grow Smarter.',
  },
  {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: SITE_NAME,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web, Android, iOS',
    description: pages['/'].description,
    url: SITE_URL,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'NGN' },
  },
];

// Builds the <head> tags as an HTML string (used by the prerender script)
export function renderHeadTags(pathname, faq) {
  const s = getSeo(pathname);
  const esc = (v) => String(v).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  const tags = [
    `<title>${esc(s.title)}</title>`,
    `<meta name="description" content="${esc(s.description)}" />`,
    s.keywords ? `<meta name="keywords" content="${esc(s.keywords)}" />` : '',
    `<meta name="robots" content="${s.noindex ? 'noindex, nofollow' : 'index, follow'}" />`,
    `<link rel="canonical" href="${s.canonical}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="${SITE_NAME}" />`,
    `<meta property="og:title" content="${esc(s.title)}" />`,
    `<meta property="og:description" content="${esc(s.description)}" />`,
    `<meta property="og:url" content="${s.canonical}" />`,
    `<meta property="og:image" content="${s.image}" />`,
    `<meta property="og:locale" content="en_NG" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(s.title)}" />`,
    `<meta name="twitter:description" content="${esc(s.description)}" />`,
    `<meta name="twitter:image" content="${s.image}" />`,
  ];
  if (pathname === '/') {
    const ld = [...homeJsonLd];
    if (faq) {
      ld.push({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faq.map((f) => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      });
    }
    tags.push(
      `<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>`
    );
  }
  return tags.filter(Boolean).join('\n    ');
}
