// Display helpers. Dates from the API look like "2026-11-02" or "2026-11-02 08:05:00".

const toDate = (value) => (value ? new Date(String(value).replace(' ', 'T')) : null);

export function formatDate(value) {
  const d = toDate(value);
  return d ? d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
}

export function formatTime(value) {
  const d = toDate(value);
  return d ? d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '—';
}

export function formatDateTime(value) {
  const d = toDate(value);
  return d ? `${formatDate(value)}, ${formatTime(value)}` : '—';
}

export function formatHours(minutes) {
  if (minutes === null || minutes === undefined) return '—';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${String(m).padStart(2, '0')}m`;
}

// "08:00:00" → "08:00"
export const shortTime = (t) => (t ? t.slice(0, 5) : '');

export const fullName = (e) => (e ? `${e.first_name ?? e.firstName ?? ''} ${e.last_name ?? e.lastName ?? ''}`.trim() : '');

export function initials(name) {
  return (name || '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');
}

// Local "today" (or any date) as YYYY-MM-DD
export function todayString(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export const EMPLOYMENT_TYPES = {
  full_time: 'Full-time',
  part_time: 'Part-time',
  contract: 'Contract',
  intern: 'Intern',
};

export const DOCUMENT_CATEGORIES = {
  contract: 'Contract',
  offer_letter: 'Offer letter',
  identification: 'ID',
  certificate: 'Certificate',
  medical: 'Medical',
  other: 'Other',
};

export const CLOCK_IN_POLICIES = {
  none: 'No check',
  location: 'Location only',
  wifi: 'Office Wi-Fi only',
  either: 'Location OR office Wi-Fi',
  both: 'Location AND office Wi-Fi',
};

export const SCOPE_LABELS = {
  own: 'Own',
  team: 'Team',
  department: 'Department',
  branch: 'Branch',
  all: 'Everyone',
};

// ---------- Money (Phase 2) ----------
// The API sends money in KOBO (whole numbers). 125050 → "₦1,250.50"
export function formatMoney(kobo, { decimals = true } = {}) {
  const naira = Number(kobo || 0) / 100;
  return `₦${naira.toLocaleString('en-NG', {
    minimumFractionDigits: decimals ? 2 : 0,
    maximumFractionDigits: decimals ? 2 : 0,
  })}`;
}

// Short form for cards: 1250000000 → "₦12.5m"
export function formatMoneyShort(kobo) {
  const naira = Number(kobo || 0) / 100;
  const abs = Math.abs(naira);
  if (abs >= 1e9) return `₦${(naira / 1e9).toFixed(1)}bn`;
  if (abs >= 1e6) return `₦${(naira / 1e6).toFixed(1)}m`;
  if (abs >= 1e3) return `₦${(naira / 1e3).toFixed(0)}k`;
  return `₦${naira.toFixed(0)}`;
}

// Same maths as the server (utils/money.js) so the form shows the exact total
export function calculateTotals(items, discountNaira, taxRate) {
  const toKobo = (n) => Math.round(Number(n || 0) * 100);
  const subtotal = items.reduce((sum, i) => sum + Math.round(Number(i.quantity || 0) * toKobo(i.unitPrice)), 0);
  const discount = Math.min(toKobo(discountNaira), subtotal);
  const tax = Math.round(((subtotal - discount) * Number(taxRate || 0)) / 100);
  return { subtotal, discount, tax, total: subtotal - discount + tax };
}

// "2026-11" → "November 2026"
export function monthLabel(month, short = false) {
  const [y, m] = month.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-GB', { month: short ? 'short' : 'long', year: short ? undefined : 'numeric' });
}

// A random id sent with money forms so a double-click can't save twice
export const newRequestId = () =>
  (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`);

export const PAYMENT_METHODS = {
  transfer: 'Bank transfer',
  cash: 'Cash',
  pos: 'POS',
  card: 'Card',
  cheque: 'Cheque',
  other: 'Other',
};

export const CUSTOMER_STAGES = {
  lead: 'Lead',
  prospect: 'Prospect',
  customer: 'Customer',
  lost: 'Lost',
  inactive: 'Inactive',
};

export const ACTIVITY_TYPES = {
  note: 'Note',
  call: 'Call',
  meeting: 'Meeting',
  email: 'Email',
  enquiry: 'Enquiry',
  complaint: 'Complaint',
};

// ---------- Payroll (Phase 3) ----------
export const PAYROLL_STATUS_LABELS = {
  draft: 'Draft',
  approved: 'Approved — ready to pay',
  processing: 'Paying…',
  paid: 'Paid',
  cancelled: 'Cancelled',
};

// Downloads rows as a CSV file (opens fine in Excel)
export function downloadCsv(filename, header, rows) {
  const csv = [header, ...rows].map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ---------- Tasks & reviews (Phase 3B) ----------
export const TASK_STATUSES = { todo: 'To do', in_progress: 'In progress', done: 'Done', cancelled: 'Cancelled' };
export const TASK_PRIORITIES = { urgent: 'Urgent', high: 'High', normal: 'Normal', low: 'Low' };
export const WEEKDAYS = { 1: 'Monday', 2: 'Tuesday', 3: 'Wednesday', 4: 'Thursday', 5: 'Friday', 6: 'Saturday', 7: 'Sunday' };

// "Every working day" / "Every Friday" / "Monthly on the 1st"
export function repeatLabel(r) {
  if (r.frequency === 'daily') return 'Every working day';
  if (r.frequency === 'weekly') return `Every ${WEEKDAYS[r.weekday]}`;
  const d = Number(r.month_day ?? r.monthDay);
  const suffix = d === 1 || d === 21 || d === 31 ? 'st' : d === 2 || d === 22 ? 'nd' : d === 3 || d === 23 ? 'rd' : 'th';
  return `Monthly on the ${d}${suffix}${d >= 29 ? ' (or last day)' : ''}`;
}

// When a task is due, in words: "Overdue · 3 Nov", "Today", "Tomorrow", "Fri 7 Nov"
export function dueLabel(date, status) {
  if (!date) return { text: 'No due date', tone: 'none' };
  const today = todayString();
  const open = status === 'todo' || status === 'in_progress';
  const d = new Date(`${date}T00:00:00`);
  const short = d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  if (open && date < today) return { text: `Overdue · ${short}`, tone: 'overdue' };
  if (date === today) return { text: 'Today', tone: open ? 'today' : 'none' };
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (date === todayString(tomorrow)) return { text: 'Tomorrow', tone: 'none' };
  return { text: short, tone: 'none' };
}

export const REVIEW_STATUS_LABELS = {
  self_review: 'Self-assessment',
  manager_review: 'Manager review',
  acknowledgement: 'Waiting for confirmation',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

// "2026-11" → "November 2026", "2026-Q4" → "Oct–Dec 2026 (Q4)"
export function periodLabel(period) {
  const q = /^(\d{4})-Q([1-4])$/.exec(period || '');
  if (!q) return monthLabel(period);
  const names = ['Jan–Mar', 'Apr–Jun', 'Jul–Sep', 'Oct–Dec'];
  return `${names[Number(q[2]) - 1]} ${q[1]} (Q${q[2]})`;
}

// Score out of 5 → words, used on reviews
export function scoreLabel(score) {
  const s = Number(score);
  if (!score) return '';
  if (s >= 4.5) return 'Outstanding';
  if (s >= 3.5) return 'Exceeds expectations';
  if (s >= 2.5) return 'Meets expectations';
  if (s >= 1.5) return 'Needs improvement';
  return 'Unsatisfactory';
}

// ---------- Flagged clock-ins ----------
// The employee has 24 hours from clock-in to explain a flag
export const EXPLAIN_HOURS = 24;

export function explainDeadline(record) {
  return new Date(new Date(String(record.clock_in_at).replace(' ', 'T')).getTime() + EXPLAIN_HOURS * 3600 * 1000);
}

// "5h left", "40 min left" or null once it has passed
export function timeLeft(deadline, now = new Date()) {
  const minutes = Math.floor((new Date(deadline) - now) / 60000);
  if (minutes <= 0) return null;
  return minutes >= 60 ? `${Math.floor(minutes / 60)}h left` : `${minutes} min left`;
}

export const EXPLANATION_LABELS = {
  accept: 'Accepted the flag',
  dispute: 'Disputes the flag',
  no_response: 'No response in 24 hours',
};

// ---------- Brand colours ----------
// Black or white text — whichever reads better on this background colour
export function textOn(hex) {
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex || '');
  if (!m) return '#ffffff';
  const [r, g, b] = m.slice(1).map((h) => {
    const c = parseInt(h, 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  // contrast against white vs against near-black
  return (1.05 / (luminance + 0.05)) >= ((luminance + 0.05) / 0.0625) ? '#ffffff' : '#0f172a';
}

// "just now", "5 min ago", "3 h ago", "yesterday", then the date
export function timeAgo(value) {
  if (!value) return '';
  const then = new Date(String(value).replace(' ', 'T'));
  const minutes = Math.floor((Date.now() - then) / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  if (hours < 48) return 'yesterday';
  return formatDate(value);
}
