import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertTriangle, Banknote, Copy, Play, Settings } from 'lucide-react';
import PageHeader from '../../../components/PageHeader.jsx';
import Badge from '../../../components/Badge.jsx';
import EmptyState from '../../../components/EmptyState.jsx';
import { api } from '../../../api/client.js';
import { useApi } from '../../../hooks/useApi.js';
import { useAuth } from '../../../context/AuthContext.jsx';
import { useToast } from '../../../context/ToastContext.jsx';
import { PAYROLL_STATUS_LABELS, formatMoney, monthLabel, todayString } from '../../../utils/format.js';
import './Payroll.css';

// "2026-11" → "2026-12"
function nextMonth(month) {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(y, m, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// List of monthly payroll runs + "run payroll for <month>"
export default function Payroll() {
  const { can } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const { data, loading } = useApi('/api/payroll');
  const [period, setPeriod] = useState(todayString().slice(0, 7));
  const [copy, setCopy] = useState(true);
  const [busy, setBusy] = useState(false);

  const runs = data?.runs || [];
  const active = runs.filter((r) => r.status !== 'cancelled');
  // The latest month before the one being prepared — what "copy" copies from
  const source = active.filter((r) => r.period < period).sort((a, b) => b.period.localeCompare(a.period))[0];
  const taken = (month) => active.some((r) => r.period === month);

  // Start on the month after the latest payroll (if that's not in the past)
  useEffect(() => {
    if (!active.length) return;
    const latest = active.reduce((a, b) => (a.period > b.period ? a : b)).period;
    const thisMonth = todayString().slice(0, 7);
    setPeriod(nextMonth(latest) > thisMonth ? nextMonth(latest) : thisMonth);
  }, [data]); // eslint-disable-line react-hooks/exhaustive-deps

  const prepare = async (month, copyFrom) => {
    setBusy(true);
    try {
      const run = await api('/api/payroll', { method: 'POST', body: { period: month, copyFrom: copyFrom || null } });
      toast.success(`Payroll for ${monthLabel(month)} prepared${copyFrom ? ' — copied from the month before' : ''}`);
      navigate(`/payroll/${run.id}`);
    } catch (err) {
      toast.error(err.message);
      setBusy(false);
    }
  };

  if (loading || !data) return <div className="page-loader"><span className="page-loader__spinner" /></div>;
  const { settings, missingPay } = data;

  return (
    <>
      <PageHeader
        title="Payroll"
        subtitle="Work out salaries, PAYE and pension, get it approved, and pay your team."
        actions={can('payroll.manage') && (
          <Link to="/settings?tab=payroll" className="btn btn--outline"><Settings size={18} /> Payroll settings</Link>
        )}
      />

      {can('payroll.manage') && (
        <section className="card payroll__start">
          <div>
            <h2>Run payroll</h2>
            <p className="muted">
              Uses each person’s salary from their profile, takes off unpaid leave, and works out PAYE
              {settings.pensionEnabled && ', pension'}{settings.nhfEnabled && ', NHF'}. Nothing is paid until it’s approved.
            </p>
            <p className="muted payroll__kept">
              Salaries, bank details, TIN and pension details are saved on each employee’s <strong>Pay</strong> tab —
              enter them once and every month uses them.
            </p>
          </div>
          <div className="payroll__start-form">
            <div className="payroll__start-row">
              <input type="month" className="field__input" value={period} onChange={(e) => setPeriod(e.target.value)} aria-label="Month" />
              <button type="button" className="btn btn--primary" onClick={() => prepare(period, copy && source ? source.id : null)} disabled={busy}>
                <Play size={18} /> {busy ? 'Working it out…' : `Prepare ${monthLabel(period, true)}`}
              </button>
            </div>
            {source && (
              <label className="payroll__copy">
                <input type="checkbox" checked={copy} onChange={(e) => setCopy(e.target.checked)} />
                Copy bonuses &amp; one-off deductions from {monthLabel(source.period)}
              </label>
            )}
          </div>
        </section>
      )}

      {missingPay.length > 0 && (
        <div className="payroll__warning">
          <AlertTriangle size={18} />
          <span>
            <strong>{missingPay.length} active employee(s) have no salary set</strong> and won’t be paid:{' '}
            {missingPay.slice(0, 6).map((m, i) => (
              <span key={m.id}>
                {i > 0 && ', '}
                <Link to={`/employees/${m.id}?tab=pay`}>{m.first_name} {m.last_name}</Link>
              </span>
            ))}
            {missingPay.length > 6 && ` and ${missingPay.length - 6} more`}
          </span>
        </div>
      )}

      <div className="card">
        {runs.length === 0 ? (
          <EmptyState icon={Banknote} title="No payroll yet" text="Set salaries on each employee’s Pay tab, then prepare your first payroll above." />
        ) : (
          <div className="table-wrap">
            <table className="table table--clickable">
              <thead>
                <tr><th>Month</th><th>Staff</th><th>Gross</th><th>PAYE</th><th>Net pay</th><th>Status</th>{can('payroll.manage') && <th aria-label="Copy" />}</tr>
              </thead>
              <tbody>
                {runs.map((r) => (
                  <tr key={r.id} onClick={() => navigate(`/payroll/${r.id}`)} className={r.status === 'cancelled' ? 'payroll__cancelled' : ''}>
                    <td><strong>{monthLabel(r.period)}</strong></td>
                    <td>{r.employee_count}</td>
                    <td>{formatMoney(r.gross_kobo)}</td>
                    <td>{formatMoney(r.paye_kobo)}</td>
                    <td><strong>{formatMoney(r.net_kobo)}</strong></td>
                    <td>
                      <Badge status={r.status}>{PAYROLL_STATUS_LABELS[r.status]}</Badge>
                      {Number(r.failed_count) > 0 && <Badge status="failed">{r.failed_count} failed</Badge>}
                    </td>
                    {can('payroll.manage') && (
                      <td className="payroll__copy-cell">
                        {r.status !== 'cancelled' && !taken(nextMonth(r.period)) && (
                          <button
                            type="button"
                            className="btn btn--outline btn--sm"
                            disabled={busy}
                            title={`New payroll for ${monthLabel(nextMonth(r.period))} with this month’s bonuses & deductions`}
                            onClick={(e) => { e.stopPropagation(); prepare(nextMonth(r.period), r.id); }}
                          >
                            <Copy size={15} /> Copy to {monthLabel(nextMonth(r.period), true)}
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
