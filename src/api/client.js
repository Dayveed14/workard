// One function for every API call.
//   api('/api/employees')                          → GET
//   api('/api/employees', { method: 'POST', body }) → JSON body
//   api('/api/employees/1/documents', { method: 'POST', formData }) → file upload
// Cookies (JWT) are sent automatically. If the 15-minute access token has expired,
// it quietly refreshes once and retries.

// Empty = call this same site (/api/...). On Vercel, vercel.json forwards /api to Render,
// so the login cookie belongs to workard.com and works on iPhones/Safari too.
// A localhost address is ignored in production builds (it can only be a leftover dev setting).
const rawApiUrl = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const API_URL = import.meta.env.PROD && /localhost|127\.0\.0\.1/.test(rawApiUrl) ? '' : rawApiUrl;

export class ApiError extends Error {
  constructor(message, status, errors, code) {
    super(message);
    this.status = status;
    this.errors = errors || {};
    this.code = code; // e.g. 'PLAN_UPGRADE_REQUIRED', 'PLAN_LIMIT'
  }
}

let refreshPromise = null;

function refreshSession() {
  // If several requests expire at once, refresh only once
  if (!refreshPromise) {
    refreshPromise = fetch(`${API_URL}/api/auth/refresh`, { method: 'POST', credentials: 'include' })
      .then((r) => r.ok)
      .catch(() => false)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

const NO_REFRESH = ['/api/auth/login', '/api/auth/register', '/api/auth/refresh', '/api/auth/verify-otp'];

export async function api(path, { method = 'GET', body, formData, retry = true } = {}) {
  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      credentials: 'include',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: formData || (body ? JSON.stringify(body) : undefined),
    });
  } catch {
    throw new ApiError('Cannot reach the server. Check your connection and try again.', 0);
  }

  if (res.status === 401 && retry && !NO_REFRESH.includes(path)) {
    if (await refreshSession()) return api(path, { method, body, formData, retry: false });
  }

  const data = await res.json().catch(() => ({}));
  // Plan unpaid or expired while the app is open → go to the billing page
  if (res.status === 402 && typeof window !== 'undefined' && !window.location.pathname.startsWith('/billing')) {
    window.location.assign('/billing');
  }
  if (!res.ok) throw new ApiError(data.message || 'Something went wrong', res.status, data.errors, data.code);
  return data;
}

// Turns { search: 'a', page: 2, empty: '' } into "?search=a&page=2"
export function toQuery(params) {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') q.set(k, v);
  });
  const s = q.toString();
  return s ? `?${s}` : '';
}
