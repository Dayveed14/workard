// Meeting repeats — the same rules as the server's utils/repeat.js, used here to
// preview the next dates while someone fills in the form.

export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0]; // Monday first

const toDate = (s) => new Date(`${s}T12:00:00Z`);
const iso = (d) => d.toISOString().slice(0, 10);
const addDays = (s, n) => { const d = toDate(s); d.setUTCDate(d.getUTCDate() + n); return iso(d); };
const weekday = (s) => toDate(s).getUTCDay();
const daysBetween = (a, b) => Math.round((toDate(b) - toDate(a)) / 86_400_000);
const monday = (s) => addDays(s, -((weekday(s) + 6) % 7));
const lastDay = (y, m) => new Date(Date.UTC(y, m, 0)).getUTCDate();

function isOn(r, date) {
  const every = Math.max(1, Number(r.every) || 1);
  const day = weekday(date);
  if (r.repeat === 'daily') return daysBetween(r.date, date) % every === 0;
  if (r.repeat === 'weekdays') return day !== 0 && day !== 6;
  if (r.repeat === 'weekly') return r.days.some((d) => d.day === day) && (daysBetween(monday(r.date), monday(date)) / 7) % every === 0;
  if (r.repeat === 'monthly') {
    const [fy, fm, fd] = r.date.split('-').map(Number);
    const [y, m, d] = date.split('-').map(Number);
    return ((y - fy) * 12 + (m - fm)) % every === 0 && d === Math.min(fd, lastDay(y, m));
  }
  return false;
}

// r = { date, time, repeat, every, days: [{ day, time }], until } → [{ date, time }, …]
export function nextDates(r, count = 5) {
  if (!r.date) return [];
  if (r.repeat === 'none') return [{ date: r.date, time: r.time }];
  const out = [];
  for (let d = r.date, i = 0; out.length < count && i < 800 && (!r.until || d <= r.until); d = addDays(d, 1), i += 1) {
    if (isOn(r, d)) out.push({ date: d, time: (r.repeat === 'weekly' && r.days.find((x) => x.day === weekday(d))?.time) || r.time });
  }
  return out;
}
