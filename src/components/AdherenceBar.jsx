import { ATTENDANCE_PARTS } from './AdherenceDonut.jsx';
import './AdherenceBar.css';

// A thin bar split into on time / late / absent / on leave — for list rows.
// No text on it: the figures sit beside it in the row.
export function AdherenceBar({ data }) {
  const total = ATTENDANCE_PARTS.reduce((sum, p) => sum + data[p.key], 0);
  if (!total) return <span className="adh-bar adh-bar--empty" aria-hidden="true" />;
  return (
    <span className="adh-bar" role="img" aria-label={ATTENDANCE_PARTS.map((p) => `${p.label} ${data[p.key]}`).join(', ')}>
      {ATTENDANCE_PARTS.filter((p) => data[p.key] > 0).map((p) => (
        <span
          key={p.key}
          style={{ flexGrow: data[p.key], background: p.color }}
          title={`${p.label}: ${data[p.key]} day${data[p.key] === 1 ? '' : 's'}`}
        />
      ))}
    </span>
  );
}

// A small ring showing one percentage (adherence) — colour follows how good it is
export function AdherenceRing({ value, size = 40 }) {
  const stroke = 5;
  const r = (size - stroke) / 2;
  const C = 2 * Math.PI * r;
  const tone = value === null ? 'none' : value >= 90 ? 'good' : value >= 75 ? 'ok' : 'poor';
  return (
    <span className={`adh-ring adh-ring--${tone}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" className="adh-ring__track" strokeWidth={stroke} />
        {value > 0 && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            className="adh-ring__fill"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${(value / 100) * C} ${C}`}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        )}
      </svg>
      <strong>{value === null ? '—' : `${value}`}</strong>
    </span>
  );
}
