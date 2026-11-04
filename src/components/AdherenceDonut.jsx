import { useState } from 'react';
import { ArrowDownRight, ArrowUpRight, Flag } from 'lucide-react';
import { formatDate } from '../utils/format.js';
import './AdherenceDonut.css';

// The four parts of a month, in a fixed order (and colour) everywhere in Workard
export const ATTENDANCE_PARTS = [
  { key: 'onTime', label: 'On time', color: 'var(--att-ontime)' },
  { key: 'late', label: 'Late', color: 'var(--att-late)' },
  { key: 'absent', label: 'Absent', color: 'var(--att-absent)' },
  { key: 'onLeave', label: 'On leave', color: 'var(--att-leave)' },
];

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

// Change vs last month, as a small arrow + points
export function AdherenceTrend({ current, previous }) {
  if (current === null || current === undefined || previous === null || previous === undefined) return null;
  const diff = current - previous;
  if (diff === 0) return <span className="adh-trend adh-trend--flat">same as last month</span>;
  const up = diff > 0;
  return (
    <span className={`adh-trend ${up ? 'adh-trend--up' : 'adh-trend--down'}`} title={`Last month: ${previous}%`}>
      {up ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />} {Math.abs(diff)} pts vs last month
    </span>
  );
}

// One person's month as a donut: the slices are their working days,
// the centre shows adherence (on time ÷ days they were expected in).
// Hovering a slice or a legend row shows that part in the centre.
export default function AdherenceDonut({ data, previous, title = 'This month at a glance' }) {
  const [active, setActive] = useState(null);
  const total = ATTENDANCE_PARTS.reduce((sum, p) => sum + data[p.key], 0);

  const size = 168;
  const stroke = 20;
  const r = (size - stroke) / 2;
  const C = 2 * Math.PI * r;
  const gap = total > 1 ? 2 : 0; // a 2px surface gap between slices
  let offset = 0;
  const slices = ATTENDANCE_PARTS.filter((p) => data[p.key] > 0).map((p) => {
    const length = (data[p.key] / total) * C;
    const slice = { ...p, dash: Math.max(length - gap, 0.5), offset };
    offset += length;
    return slice;
  });

  const shown = active ? ATTENDANCE_PARTS.find((p) => p.key === active) : null;
  // Shares are of the days they were EXPECTED in (leave isn't), so "On time %" matches the centre
  const share = (key) => (data.expected ? Math.round((data[key] / data.expected) * 100) : 0);
  const summary = ATTENDANCE_PARTS.map((p) => `${p.label} ${data[p.key]}`).join(', ');

  return (
    <section className="card adh-donut">
      <header className="adh-donut__head">
        <h2>{title}</h2>
        <AdherenceTrend current={data.adherence} previous={previous} />
      </header>

      {total === 0 ? (
        <p className="muted adh-donut__empty">No working days to count yet this month.</p>
      ) : (
        <div className="adh-donut__body">
          <div className="adh-donut__chart">
            <svg
              width={size}
              height={size}
              viewBox={`0 0 ${size} ${size}`}
              role="img"
              aria-label={`Attendance: ${data.adherence ?? 0}% on time. ${summary} working days.`}
            >
              <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--gray)" strokeWidth={stroke} opacity="0.35" />
              <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
                {slices.map((s) => (
                  <circle
                    key={s.key}
                    cx={size / 2}
                    cy={size / 2}
                    r={r}
                    fill="none"
                    stroke={s.color}
                    strokeWidth={stroke}
                    strokeDasharray={`${s.dash} ${C - s.dash}`}
                    strokeDashoffset={-s.offset}
                    className={`adh-donut__slice ${active && active !== s.key ? 'is-dim' : ''}`}
                    onMouseEnter={() => setActive(s.key)}
                    onMouseLeave={() => setActive(null)}
                  >
                    <title>{`${s.label}: ${plural(data[s.key], 'day')}${s.key === 'onLeave' ? ' (not counted)' : ` (${share(s.key)}%)`}`}</title>
                  </circle>
                ))}
              </g>
            </svg>
            <div className="adh-donut__centre" aria-hidden="true">
              {shown ? (
                <>
                  <strong>{data[shown.key]}</strong>
                  <span>{shown.label.toLowerCase()} {data[shown.key] === 1 ? 'day' : 'days'}</span>
                </>
              ) : (
                <>
                  <strong>{data.adherence ?? '—'}{data.adherence !== null && <small>%</small>}</strong>
                  <span>on time</span>
                </>
              )}
            </div>
          </div>

          <div className="adh-donut__side">
            <ul className="adh-legend">
              {ATTENDANCE_PARTS.map((p) => (
                <li key={p.key}>
                  <button
                    type="button"
                    className={active === p.key ? 'is-active' : ''}
                    onMouseEnter={() => setActive(p.key)}
                    onMouseLeave={() => setActive(null)}
                    onFocus={() => setActive(p.key)}
                    onBlur={() => setActive(null)}
                  >
                    <span className="adh-legend__swatch" style={{ background: p.color }} />
                    <span className="adh-legend__label">{p.label}</span>
                    <strong>{data[p.key]}</strong>
                    <span className="adh-legend__share">{p.key === 'onLeave' ? 'not counted' : `${share(p.key)}%`}</span>
                  </button>
                </li>
              ))}
            </ul>
            <p className="adh-donut__note">
              {plural(data.expected, 'working day')} expected{data.holidays > 0 && ` · ${plural(data.holidays, 'public holiday')} not counted`}
              {data.upTo && ` · up to ${formatDate(data.upTo)}`}
            </p>
            {data.flagged > 0 && (
              <p className="adh-donut__flag"><Flag size={14} /> {plural(data.flagged, 'clock-in')} flagged for review</p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
