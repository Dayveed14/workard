// Data baked into a prerendered page at build time (scripts/prerender.js puts it in
// window.__WK_DATA__), so the blog and prices show at once — for people and for Google.
// After the page opens, components still fetch the latest from the API.
let data = (typeof window !== 'undefined' && window.__WK_DATA__) || {};

export function setPreloaded(next) {
  data = next || {};
}

export const getPreloaded = (key) => data[key];
