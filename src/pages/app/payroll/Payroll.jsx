import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertTriangle, Banknote, Play, Settings } from 'lucide-react';
import PageHeader from '../../../components/PageHeader.jsx';
import Badge from '../../../components/Badge.jsx';
import EmptyState from '../../../components/EmptyState.jsx';
import { api } from '../../../api/client.js';
import { useApi } from '../../../hooks/useApi.js';
import { useAuth } from '../../../context/AuthContext.jsx';
import { useToast } from '../../../context/ToastContext.jsx';
import { PAYROLL_STATUS_LABELS, formatMoney, monthLabel, todayString } from '../../../utils/format.js';
import './Payroll.css';

// List of monthly payroll runs + "run payroll for <month>"
export default function Payroll() {
  const { can } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const { data, loading } = useApi('/api/payroll');
  const [period, setPeriod] = useState(todayString().slice(0, 7));
  const [busy, setBusy] = useState(false);

  const start = async () => {
    setBusy(true);
    try {
      const run = await api('/api/payroll', { method: 'POST', body: { period } });
      toast.success(`Payroll for ${monthLabel(period)} prepared`);
      navigate(`/payroll/${run.id}`);
    } catch (err) {
      toast.error(err.message);
      setBusy(false);
    }
  };

  if (loading || !data) return <div className="page-loader"><span className="page-loader__spinner" /></div>;
  const { runs, settings, missingPay } = data;

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
          </div>
          <div className="payroll__start-form">
            <input type="month" className="field__input" value={period} onChange={(e) => setPeriod(e.target.value)} aria-label="Month" />
            <button type="button" className="btn btn--primary" onClick={start} disabled={busy}>
              <Play size={18} /> {busy ? 'Working it out…' : `Prepare ${monthLabel(period, true)}`}
            </button>
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
                <tr><th>Month</th><th>Staff</th><th>Gross</th><th>PAYE</th><th>Net pay</th><th>Status</th></tr>
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
