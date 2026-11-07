import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Eye, LifeBuoy } from 'lucide-react';
import BackLink from '../../components/BackLink.jsx';
import Badge from '../../components/Badge.jsx';
import Field from '../../components/Field.jsx';
import { api } from '../../api/client.js';
import { useApi } from '../../hooks/useApi.js';
import { useToast } from '../../context/ToastContext.jsx';
import { formatDate, formatDateTime, formatMoney, timeAgo, todayString } from '../../utils/format.js';
import { CompanyBadge } from './adminBits.jsx';

const addDays = (date, n) => {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

// /admin/companies/:id — one company: account, usage (counts only) and what an admin can do
export default function AdminCompany() {
  const { id } = useParams();
  const toast = useToast();
  const { data: c, setData } = useApi(`/api/admin/companies/${id}`);
  const [days, setDays] = useState(14);
  const [plan, setPlan] = useState({ plan: 'business', interval: 'monthly', periodEnd: addDays(todayString(), 30) });
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  const run = async (path, body, message) => {
    setBusy(true);
    try {
      setData(await api(`/api/admin/companies/${id}/${path}`, { method: 'POST', body }));
      toast.success(message);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const openSupport = async () => {
    try {
      await api(`/api/admin/companies/${id}/support`, { method: 'POST' });
      window.location.assign('/dashboard'); // the company's app, read-only, in this browser
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (!c) return <div className="page-loader"><span className="page-loader__spinner" /></div>;
  const onTrial = ['trial', 'trial_ended'].includes(c.status);

  return (
    <>
      <BackLink fallback="/admin/companies" label="Companies" />
      <header className="card adm-company__head">
        <div>
          <h1>{c.name}</h1>
          <p className="muted">{[c.industry, c.size && `${c.size} staff`, `joined ${formatDate(c.createdAt)}`].filter(Boolean).join(' · ')}</p>
          <p style={{ marginTop: 8 }}><CompanyBadge status={c.status} /> <Badge tone="blue">{c.planName}{c.interval ? `, ${c.interval}` : ''}</Badge></p>
        </div>
        {c.owner && (
          <div>
            <span className="adm-sub">Owner</span>
            <strong>{c.owner.name}</strong>
            <span className="adm-sub"><a href={`mailto:${c.owner.email}`}>{c.owner.email}</a>{c.owner.phone && ` · ${c.owner.phone}`}</span>
          </div>
        )}
      </header>

      {c.suspendedAt && <p className="adm-warn" style={{ marginBottom: 16 }}>Suspended {formatDateTime(c.suspendedAt)}: {c.suspendedReason}</p>}
      {c.renewalProblem && <p className="adm-warn" style={{ marginBottom: 16 }}>Last renewal failed: {c.renewalProblem}</p>}

      <div className="adm-two">
        <section className="card">
          <header className="card__header"><h2>Account</h2></header>
          <dl className="adm-facts">
            <div><dt>{onTrial ? 'Trial ends' : 'Paid until'}</dt><dd>{c.periodEnd ? formatDate(c.periodEnd) : '—'}</dd></div>
            <div><dt>Days left</dt><dd>{c.daysLeft ?? '—'}</dd></div>
            {!onTrial && <div><dt>Card saved</dt><dd>{c.hasCard ? 'Yes' : 'No'}</dd></div>}
            {!onTrial && <div><dt>Auto-renew</dt><dd>{c.autoRenew ? 'On' : 'Off'}</dd></div>}
            <div><dt>Paid in total</dt><dd>{formatMoney(c.paidTotalKobo, { decimals: false })}</dd></div>
            <div><dt>Last active</dt><dd>{c.lastActive ? timeAgo(c.lastActive) : 'never'}</dd></div>
          </dl>
        </section>
        <section className="card">
          <header className="card__header"><h2>Usage</h2><span className="muted">counts only</span></header>
          <dl className="adm-facts">
            <div><dt>Active staff</dt><dd>{c.employees}</dd></div>
            <div><dt>Logged in (30 days)</dt><dd>{c.usage.activeUsers30}</dd></div>
            <div><dt>Branches</dt><dd>{c.usage.branches}</dd></div>
            <div><dt>Customers</dt><dd>{c.usage.customers}</dd></div>
            <div><dt>Invoices</dt><dd>{c.usage.invoices}</dd></div>
            <div><dt>Payroll runs</dt><dd>{c.usage.payrollRuns}</dd></div>
            <div><dt>Tasks</dt><dd>{c.usage.tasks}</dd></div>
            <div><dt>Meetings</dt><dd>{c.usage.meetings}</dd></div>
          </dl>
        </section>
      </div>

      <div className="adm-two">
        <section className="card">
          <header className="card__header"><h2>Change the account</h2></header>
          <div className="adm-actions">
            {onTrial && (
              <div>
                <h3>More trial days</h3>
                <div className="adm-inline">
                  <select className="field__input" value={days} onChange={(e) => setDays(Number(e.target.value))} aria-label="Days">
                    {[7, 14, 30, 60].map((d) => <option key={d} value={d}>{d} days</option>)}
                  </select>
                  <button type="button" className="btn btn--outline" disabled={busy} onClick={() => run('extend-trial', { days }, `Trial extended by ${days} days`)}>Extend trial</button>
                </div>
              </div>
            )}
            <div>
              <h3>Put on a plan (no payment)</h3>
              <p className="muted" style={{ fontSize: '0.85rem', marginBottom: 8 }}>For deals, refunds or free months. Paystack isn’t changed — a company with a saved card keeps its own renewal date there.</p>
              <div className="adm-inline">
                <select className="field__input" value={plan.plan} onChange={(e) => setPlan({ ...plan, plan: e.target.value })} aria-label="Plan">
                  <option value="starter">Starter</option><option value="business">Business</option><option value="enterprise">Enterprise</option>
                </select>
                <select className="field__input" value={plan.interval} onChange={(e) => setPlan({ ...plan, interval: e.target.value })} aria-label="Interval">
                  <option value="monthly">Monthly</option><option value="yearly">Yearly</option>
                </select>
                <input type="date" className="field__input" min={todayString()} value={plan.periodEnd} onChange={(e) => setPlan({ ...plan, periodEnd: e.target.value })} aria-label="Until" />
                <button type="button" className="btn btn--outline" disabled={busy} onClick={() => run('plan', plan, 'Plan set')}>Set plan</button>
              </div>
            </div>
            <div>
              <h3>Billing</h3>
              {c.status === 'exempt' ? (
                <button type="button" className="btn btn--outline" disabled={busy} onClick={() => run('exempt', { exempt: false }, 'Billed normally again')}>Bill normally again</button>
              ) : (
                <button type="button" className="btn btn--outline" disabled={busy} onClick={() => window.confirm(`Make ${c.name} free — never billed, every feature?`) && run('exempt', { exempt: true }, 'Exempt from billing')}>Exempt from billing (free)</button>
              )}
            </div>
            <div>
              <h3>{c.suspendedAt ? 'Suspension' : 'Suspend'}</h3>
              {c.suspendedAt ? (
                <button type="button" className="btn btn--primary" disabled={busy} onClick={() => run('restore', undefined, 'Suspension lifted — the owner was emailed')}>Lift suspension</button>
              ) : (
                <>
                  <Field label="Reason (emailed to the owner)" name="reason">
                    <input id="reason" className="field__input" value={reason} maxLength={255} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Unpaid invoice — please call us" />
                  </Field>
                  <button type="button" className="btn btn--danger" style={{ marginTop: 8 }} disabled={busy || reason.trim().length < 5} onClick={() => window.confirm(`Suspend ${c.name}? Nobody in it can use Workard until you lift it.`) && run('suspend', { reason }, 'Suspended — the owner was emailed')}>
                    Suspend company
                  </button>
                </>
              )}
            </div>
          </div>
        </section>

        <div className="adm-side">
          <section className="card">
            <header className="card__header"><h2><LifeBuoy size={16} /> Support access</h2></header>
            <div className="adm-actions">
              {c.supportAccess ? (
                <>
                  <p className="adm-ok">The owner allowed support until <strong>{formatDateTime(c.supportAccess.expiresAt)}</strong>{c.supportAccess.reason && <> — “{c.supportAccess.reason}”</>}.</p>
                  <button type="button" className="btn btn--primary" onClick={openSupport}><Eye size={16} /> Open (read-only)</button>
                  <p className="muted" style={{ fontSize: '0.85rem' }}>Opens their Workard in this browser. You can look, not change. The owner is told.</p>
                </>
              ) : (
                <p className="muted">Closed. Only the owner can open it, in Settings → Workard support. Until then you see counts only.</p>
              )}
            </div>
          </section>
          <section className="card">
            <header className="card__header"><h2>Payments</h2></header>
            {c.payments.length === 0 ? <p className="adm-empty">No payments.</p> : (
              <ul className="adm-list">
                {c.payments.map((p) => (
                  <li key={p.id}>
                    <span>{formatDate(p.created_at)} · {p.plan} {p.billing_interval || ''} <span className="muted">({p.kind.replace('_', ' ')})</span></span>
                    <span><strong>{formatMoney(p.amount_kobo, { decimals: false })}</strong> <Badge status={p.status === 'initiated' ? 'pending' : p.status}>{p.status}</Badge></span>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section className="card">
            <header className="card__header"><h2>Admin changes</h2></header>
            {c.adminLog.length === 0 ? <p className="adm-empty">None yet.</p> : (
              <ul className="adm-list">
                {c.adminLog.map((l) => <li key={l.id}><span>{l.details || l.action}</span><span className="muted">{l.admin_name} · {timeAgo(l.created_at)}</span></li>)}
              </ul>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
