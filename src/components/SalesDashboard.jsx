import { useState } from 'react';
import { TrendingUp } from 'lucide-react';
import EmptyState from './EmptyState.jsx';
import { useApi } from '../hooks/useApi.js';
import { monthLabel } from '../utils/format.js';
import './SalesDashboard.css';

// The three monthly series, in a fixed order and colour
const SERIES = [
  { key: 'newLeads', label: 'New leads', color: 'var(--stage-lead)' },
  { key: 'won', label: 'Won', color: 'var(--stage-customer)' },
  { key: 'lost', label: 'Lost', color: 'var(--stage-lost)' },
];

const pct = (v) => (v === null || v === undefined ? '—' : `${v}%`);

// A headline number with a one-line explanation
function Tile({ label, value, hint }) {
  return (
    <div className="sales-tile">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{hint}</small>
    </div>
  );
}

// Funnel: of everyone who came in as a lead, how far they got. Bars share one scale (the leads).
function Funnel({ funnel }) {
  const steps = [
    { key: 'leads', label: 'Came in as leads', color: 'var(--stage-lead)' },
    { key: 'prospects', label: 'Became prospects', color: 'var(--stage-prospect)' },
    { key: 'customers', label: 'Became customers', color: 'var(--stage-customer)' },
    { key: 'lost', label: 'Lost', color: 'var(--stage-lost)' },
  ];
  const top = Math.max(1, funnel.leads);
  return (
    <ul className="sales-funnel">
      {steps.map((s) => {
        const value = funnel[s.key];
        const share = funnel.leads ? Math.round((value / funnel.leads) * 100) : 0;
        return (
          <li key={s.key} title={`${s.label}: ${value} (${share}% of leads)`}>
            <span className="sales-funnel__label">{s.label}</span>
            <span className="sales-funnel__track">
              <span className="sales-funnel__bar" style={{ width: `${(value / top) * 100}%`, background: s.color }} />
            </span>
            <span className="sales-funnel__value">
              <strong>{value}</strong> {s.key !== 'leads' && <span>{share}%</span>}
            </span>
          </li>
        );
      })}
      <li className="sales-funnel__open">{funnel.open} still open (lead or prospect)</li>
    </ul>
  );
}

// Grouped bars per month: new leads, won, lost. Hover a bar for its number.
function MonthlyBars({ months }) {
  const [hover, setHover] = useState(null); // { month, key }
  const max = Math.max(1, ...months.flatMap((m) => SERIES.map((s) => m[s.key])));
  const ticks = max <= 5 ? Array.from({ length: max + 1 }, (_, i) => i) : [0, Math.round(max / 2), max];
  const H = 160;

  return (
    <div className="sales-bars">
      <div className="sales-bars__legend">
        {SERIES.map((s) => (
          <span key={s.key}><i style={{ background: s.color }} /> {s.label}</span>
        ))}
      </div>
      <div className="sales-bars__plot" style={{ height: H + 24 }}>
        <div className="sales-bars__grid" style={{ height: H }}>
          {ticks.slice().reverse().map((t) => (
            <span key={t} style={{ bottom: `${(t / max) * 100}%` }}><em>{t}</em></span>
          ))}
        </div>
        <div className="sales-bars__groups">
          {months.map((m) => (
            <div key={m.month} className="sales-bars__group">
              <div className="sales-bars__marks" style={{ height: H }}>
                {SERIES.map((s) => {
                  const on = hover?.month === m.month && hover?.key === s.key;
                  return (
                    <span
                      key={s.key}
                      className={`sales-bars__bar ${hover && !on ? 'is-dim' : ''}`}
                      style={{ height: `${(m[s.key] / max) * 100}%`, background: s.color }}
                      onMouseEnter={() => setHover({ month: m.month, key: s.key })}
                      onMouseLeave={() => setHover(null)}
                    >
                      {on && <span className="sales-bars__tip">{s.label}: <strong>{m[s.key]}</strong></span>}
                    </span>
                  );
                })}
              </div>
              <span className="sales-bars__month">{monthLabel(m.month, true)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function SalesDashboard() {
  const [months, setMonths] = useState(6);
  const [asTable, setAsTable] = useState(false);
  const { data, loading, error } = useApi(`/api/customers/sales?months=${months}`);

  if (loading && !data) return <div className="page-loader"><span className="page-loader__spinner" /></div>;
  if (error) return <p className="form__alert">{error}</p>;
  const empty = data.funnel.leads === 0 && data.totals.won === 0 && data.totals.lost === 0;

  return (
    <div className="sales">
      <div className="att__toolbar sales__toolbar">
        <select className="field__input" value={months} onChange={(e) => setMonths(Number(e.target.value))} aria-label="Period">
          <option value={3}>Last 3 months</option>
          <option value={6}>Last 6 months</option>
          <option value={12}>Last 12 months</option>
        </select>
        <span className="muted">Counting customers handled by the people you can see</span>
      </div>

      <div className="sales-tiles">
        <Tile label="Win rate" value={pct(data.winRate)} hint={`${data.totals.won} won · ${data.totals.lost} lost`} />
        <Tile label="Lead → customer" value={pct(data.conversion)} hint={`${data.funnel.customers} of ${data.funnel.leads} new leads`} />
        <Tile label="Time to win" value={data.avgDaysToWin === null ? '—' : `${data.avgDaysToWin} days`} hint="average, lead to customer" />
        <Tile label="Open pipeline" value={data.pipeline.lead + data.pipeline.prospect} hint={`${data.pipeline.lead} leads · ${data.pipeline.prospect} prospects`} />
      </div>

      {empty ? (
        <div className="card">
          <EmptyState icon={TrendingUp} title="No pipeline yet" text="Add customers as leads, move them to prospect, and mark them customer or lost — this page fills in as you go." />
        </div>
      ) : (
        <div className="sales-grid">
          <section className="card card__body">
            <h2 className="sales__title">Funnel</h2>
            <p className="muted sales__sub">Everyone added as a lead since {monthLabel(data.from.slice(0, 7))}</p>
            <Funnel funnel={data.funnel} />
          </section>

          <section className="card card__body">
            <header className="sales__head">
              <div>
                <h2 className="sales__title">Month by month</h2>
                <p className="muted sales__sub">New leads, deals won and deals lost</p>
              </div>
              <button type="button" className="link-btn" onClick={() => setAsTable((t) => !t)}>{asTable ? 'Show chart' : 'Show as table'}</button>
            </header>
            {asTable ? (
              <table className="table">
                <thead><tr><th>Month</th>{SERIES.map((s) => <th key={s.key}>{s.label}</th>)}</tr></thead>
                <tbody>
                  {data.months.map((m) => (
                    <tr key={m.month}><td>{monthLabel(m.month)}</td>{SERIES.map((s) => <td key={s.key}>{m[s.key]}</td>)}</tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <MonthlyBars months={data.months} />
            )}
          </section>

          <section className="card sales-grid__wide">
            <header className="card__header"><h2 className="sales__title">Where customers come from</h2></header>
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>Lead source</th><th>Leads</th><th>Became customers</th><th>Lost</th><th>Conversion</th></tr></thead>
                <tbody>
                  {data.sources.map((s) => (
                    <tr key={s.source}>
                      <td><strong>{s.source}</strong></td>
                      <td>{s.leads}</td>
                      <td>{s.customers}</td>
                      <td>{s.lost}</td>
                      <td>
                        <span className="sales-conv">
                          <span className="sales-conv__track"><span style={{ width: `${s.conversion || 0}%` }} /></span>
                          {pct(s.conversion)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
