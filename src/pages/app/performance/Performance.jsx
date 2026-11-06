import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BarChart3, ClipboardCheck, Clock, ListChecks, Trophy } from 'lucide-react';
import PageHeader from '../../../components/PageHeader.jsx';
import StatCard from '../../../components/StatCard.jsx';
import Avatar from '../../../components/Avatar.jsx';
import EmptyState from '../../../components/EmptyState.jsx';
import { useApi } from '../../../hooks/useApi.js';
import { monthLabel, todayString } from '../../../utils/format.js';
import '../../../components/IntervalToggle.css';
import './Performance.css';

// Same categorical order as projects & stand-ups (validated for colour-blind readers)
const PERSON_COLORS = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#6250d6'];
const OTHERS_COLOR = '#94a3b8';

// The three parts of someone's work, in a fixed order and colour everywhere on this page
const TASK_PARTS = [
  { key: 'onTime', label: 'Done on time', color: 'var(--att-ontime)' },
  { key: 'late', label: 'Done late', color: 'var(--att-late)' },
  { key: 'overdue', label: 'Overdue', color: 'var(--att-absent)' },
];

const fullName = (p) => `${p.firstName} ${p.lastName}`;
const pctText = (v) => (v === null || v === undefined ? '—' : `${v}%`);
const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

// A small hover label that follows the mouse (every bar and slice has one)
function useTip() {
  const [tip, setTip] = useState(null);
  const bind = (text) => ({
    onMouseMove: (e) => setTip({ text, x: e.clientX, y: e.clientY }),
    onMouseLeave: () => setTip(null),
  });
  const node = tip && (
    <div className="perf-tip" style={{ left: tip.x + 14, top: tip.y + 14 }} role="status">{tip.text}</div>
  );
  return { bind, node };
}

// Team performance — each person's input, from the CEO's / manager's angle
export default function Performance() {
  const [month, setMonth] = useState(todayString().slice(0, 7));
  const [months, setMonths] = useState(1);
  const { data, loading, error } = useApi(`/api/performance?month=${month}&months=${months}`);
  const { bind, node: tip } = useTip();

  const range = data && (months === 1 ? monthLabel(month) : `${monthLabel(data.months[0], true)} – ${monthLabel(month)}`);

  return (
    <>
      <PageHeader title="Team performance" subtitle="Who is delivering, who is on time, and how each person’s work adds up." />

      <div className="perf-filters">
        <input type="month" className="field__input" value={month} max={todayString().slice(0, 7)} onChange={(e) => e.target.value && setMonth(e.target.value)} aria-label="Month" />
        <div className="interval-toggle" role="radiogroup" aria-label="How many months">
          {[1, 3, 6].map((n) => (
            <button key={n} type="button" role="radio" aria-checked={months === n} className={months === n ? 'is-on' : ''} onClick={() => setMonths(n)}>
              {n === 1 ? 'Month' : `${n} months`}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="form-error">{error}</p>}
      {loading && !data && <div className="page-loader"><span className="page-loader__spinner" /></div>}

      {data && data.people.length === 0 && (
        <div className="card"><EmptyState icon={BarChart3} title="No one to show" text="There are no active employees you can see yet." /></div>
      )}

      {data && data.people.length > 0 && (
        <div className={loading ? 'perf is-loading' : 'perf'}>
          <div className="perf-stats">
            <StatCard icon={Trophy} label="Team score" value={data.team.score === null ? '—' : data.team.score} hint={`out of 100 · ${range}`} />
            <StatCard icon={ListChecks} tone="green" label="Tasks done" value={data.team.done} hint={`${pctText(data.team.delivery)} on time · ${data.team.overdue} overdue`} />
            <StatCard icon={Clock} tone="amber" label="Attendance" value={pctText(data.team.attendance)} hint="days in on time" />
            <StatCard icon={ClipboardCheck} tone="gray" label="Average review" value={data.team.review === null ? '—' : `${data.team.review} / 5`} hint={data.team.dealsWon ? `${plural(data.team.dealsWon, 'deal')} won` : 'finished reviews only'} />
          </div>

          <div className="perf-grid">
            <WorkBars people={data.people} bind={bind} />
            <ShareDonut people={data.people} total={data.team.done} bind={bind} />
          </div>

          <ScoreBars people={data.people} bind={bind} />
          <PerformanceTable people={data.people} showDeals={data.team.dealsWon > 0} />
        </div>
      )}
      {tip}
    </>
  );
}

// Each person's tasks as one bar: on time · late · overdue. Most work first.
function WorkBars({ people, bind }) {
  const rows = [...people]
    .map((p) => ({ ...p, total: p.tasks.done + p.tasks.overdue }))
    .sort((a, b) => b.total - a.total || a.firstName.localeCompare(b.firstName));
  const max = Math.max(1, ...rows.map((r) => r.total));

  return (
    <section className="card perf-card">
      <header className="perf-card__head">
        <h2>Who’s doing the work</h2>
        <Legend items={TASK_PARTS} />
      </header>
      {rows.every((r) => !r.total) ? (
        <p className="muted perf-empty">No tasks were finished or missed in this period.</p>
      ) : (
        <ul className="perf-bars">
          {rows.map((r) => (
            <li key={r.employeeId}>
              <Link to={`/employees/${r.employeeId}`} className="perf-bars__name">{fullName(r)}</Link>
              <span className="perf-bars__track">
                {r.total > 0 && (
                  <span className="perf-bars__fill" style={{ width: `${(r.total / max) * 100}%` }}>
                    {TASK_PARTS.filter((part) => r.tasks[part.key] > 0).map((part) => (
                      <span
                        key={part.key}
                        style={{ flexGrow: r.tasks[part.key], background: part.color }}
                        {...bind(`${fullName(r)} — ${part.label}: ${plural(r.tasks[part.key], 'task')}`)}
                      />
                    ))}
                  </span>
                )}
              </span>
              <span className="perf-bars__value">{r.tasks.done} done{r.tasks.overdue > 0 && <em> · {r.tasks.overdue} overdue</em>}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// Share of all finished tasks: the top 7 people, then everyone else together
function ShareDonut({ people, total, bind }) {
  const [active, setActive] = useState(null);
  const ranked = people.filter((p) => p.tasks.done > 0).sort((a, b) => b.tasks.done - a.tasks.done);
  const top = ranked.slice(0, PERSON_COLORS.length).map((p, i) => ({ key: p.employeeId, label: fullName(p), value: p.tasks.done, color: PERSON_COLORS[i] }));
  const rest = ranked.slice(PERSON_COLORS.length).reduce((sum, p) => sum + p.tasks.done, 0);
  const slices = rest ? [...top, { key: 'rest', label: `Everyone else (${ranked.length - top.length})`, value: rest, color: OTHERS_COLOR }] : top;

  const size = 200;
  const stroke = 30;
  const r = (size - stroke - 8) / 2; // room for the hovered slice to grow
  const C = 2 * Math.PI * r;
  const gap = slices.length > 1 ? 2 : 0;
  let offset = 0;
  const arcs = slices.map((s) => {
    const length = (s.value / total) * C;
    const arc = { ...s, dash: Math.max(length - gap, 0.5), offset };
    offset += length;
    return arc;
  });
  const shown = slices.find((s) => s.key === active);
  const share = (v) => Math.round((v / total) * 100);

  return (
    <section className="card perf-card">
      <header className="perf-card__head">
        <h2>Share of work done</h2>
        <span className="muted">finished tasks</span>
      </header>
      {!total ? (
        <p className="muted perf-empty">No finished tasks in this period yet.</p>
      ) : (
        <div className="perf-donut">
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={slices.map((s) => `${s.label} ${share(s.value)}%`).join(', ')}>
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f1f5f9" strokeWidth={stroke} />
            {arcs.map((a) => (
              <circle
                key={a.key}
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke={a.color}
                strokeWidth={active === a.key ? stroke + 6 : stroke}
                strokeDasharray={`${a.dash} ${C}`}
                strokeDashoffset={-a.offset}
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
                onMouseEnter={() => setActive(a.key)}
                onMouseLeave={() => setActive(null)}
                {...bind(`${a.label}: ${plural(a.value, 'task')} (${share(a.value)}%)`)}
              />
            ))}
            <text x="50%" y="47%" textAnchor="middle" className="perf-donut__big">{shown ? `${share(shown.value)}%` : total}</text>
            <text x="50%" y="60%" textAnchor="middle" className="perf-donut__small">{shown ? shown.label.split(' (')[0] : 'tasks done'}</text>
          </svg>
          <ul className="perf-donut__legend">
            {slices.map((s) => (
              <li key={s.key} className={active === s.key ? 'is-active' : ''} onMouseEnter={() => setActive(s.key)} onMouseLeave={() => setActive(null)}>
                <span className="perf-swatch" style={{ background: s.color }} />
                <span className="perf-donut__name">{s.label}</span>
                <strong>{share(s.value)}%</strong>
                <span className="muted">{s.value}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

// Overall score per person, best first. One colour: the length is the message.
function ScoreBars({ people, bind }) {
  const scored = people.filter((p) => p.score !== null);
  const unscored = people.length - scored.length;
  return (
    <section className="card perf-card">
      <header className="perf-card__head">
        <h2>Performance score</h2>
        <span className="muted">out of 100</span>
      </header>
      {scored.length === 0 ? (
        <p className="muted perf-empty">Nothing to score yet — no tasks, attendance or reviews in this period.</p>
      ) : (
        <ul className="perf-bars perf-bars--score">
          {scored.map((p) => (
            <li key={p.employeeId}>
              <Link to={`/employees/${p.employeeId}`} className="perf-bars__name">
                <Avatar name={fullName(p)} src={p.photoUrl} size={26} />
                {fullName(p)}
              </Link>
              <span className="perf-bars__track">
                <span
                  className="perf-bars__fill perf-bars__fill--score"
                  style={{ width: `${Math.max(p.score, 1)}%` }}
                  {...bind(`${fullName(p)}: ${p.score} — tasks on time ${pctText(p.delivery)}, attendance ${pctText(p.attendance.rate)}, review ${p.review === null ? '—' : `${p.review}/5`}`)}
                />
              </span>
              <strong className="perf-bars__value">{p.score}</strong>
            </li>
          ))}
        </ul>
      )}
      <p className="perf-note">
        Score = the average of <strong>tasks done on time</strong> (out of everything due), <strong>attendance on time</strong> and the{' '}
        <strong>review score</strong> — only the parts that exist for that person.
        {unscored > 0 && ` ${plural(unscored, 'person')} with nothing to score yet ${unscored === 1 ? 'is' : 'are'} left out.`}
      </p>
    </section>
  );
}

// The same numbers as a table (for reading exact figures, and for screen readers)
function PerformanceTable({ people, showDeals }) {
  const navigate = useNavigate();
  return (
    <section className="card">
      <div className="table-wrap">
        <table className="table table--clickable perf-table">
          <thead>
            <tr>
              <th>Person</th><th>Score</th><th>Tasks done</th><th>On time</th><th>Overdue</th><th>Attendance</th><th>Review</th>
              {showDeals && <th>Deals won</th>}
            </tr>
          </thead>
          <tbody>
            {people.map((p) => (
              <tr key={p.employeeId} onClick={() => navigate(`/employees/${p.employeeId}`)}>
                <td>
                  <span className="perf-table__person">
                    <Avatar name={fullName(p)} src={p.photoUrl} size={30} />
                    <span><strong>{fullName(p)}</strong><small className="muted">{p.jobTitle || p.departmentName || ''}</small></span>
                  </span>
                </td>
                <td><strong>{p.score ?? '—'}</strong></td>
                <td>{p.tasks.done}</td>
                <td>{pctText(p.delivery)}</td>
                <td className={p.tasks.overdue ? 'perf-table__bad' : ''}>{p.tasks.overdue}</td>
                <td>{pctText(p.attendance.rate)}</td>
                <td>{p.review === null ? '—' : `${p.review} / 5`}</td>
                {showDeals && <td>{p.dealsWon}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Legend({ items }) {
  return (
    <ul className="perf-legend">
      {items.map((i) => (
        <li key={i.key}><span className="perf-swatch" style={{ background: i.color }} />{i.label}</li>
      ))}
    </ul>
  );
}
