import Badge from '../../../components/Badge.jsx';

// Small shared pieces for the offboarding pages
export const EXIT_TYPES = { resignation: 'Resignation', termination: 'Exit within 24 hours' };

export const STATUS = {
  notice: { label: 'Needs a checklist', tone: 'amber' },
  in_progress: { label: 'Offboarding', tone: 'blue' },
  exited: { label: 'Left', tone: 'gray' },
  withdrawn: { label: 'Withdrawn', tone: 'gray' },
  cancelled: { label: 'Called off', tone: 'gray' },
};

export function StatusBadge({ status }) {
  const s = STATUS[status] || { label: status, tone: 'gray' };
  return <Badge tone={s.tone}>{s.label}</Badge>;
}

const toDate = (v) => new Date(String(v).replace(' ', 'T'));

// "12 days left" / "5 hours left" / "ended"
export function timeLeft(endsAt) {
  const ms = toDate(endsAt) - Date.now();
  if (ms <= 0) return 'ended';
  const hours = ms / 3600_000;
  if (hours < 48) return `${Math.max(1, Math.round(hours))} hour${Math.round(hours) === 1 ? '' : 's'} left`;
  const days = Math.floor(hours / 24);
  return `${days} days left`;
}

// "Wed 14 Nov, 17:30" for a due time
export function dueText(dueAt) {
  if (!dueAt) return 'No due date';
  const d = toDate(dueAt);
  const overdue = d < new Date();
  const text = d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  const time = d.getHours() === 23 && d.getMinutes() >= 59 ? '' : `, ${d.toTimeString().slice(0, 5)}`;
  return { text: `${overdue ? 'Overdue · ' : 'Due '}${text}${time}`, overdue };
}
