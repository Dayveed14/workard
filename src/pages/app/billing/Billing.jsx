import { useEffect, useState } from 'react';
import { AlertTriangle, Check, CreditCard, Lock, ShieldCheck } from 'lucide-react';
import PageHeader from '../../../components/PageHeader.jsx';
import Badge from '../../../components/Badge.jsx';
import { api } from '../../../api/client.js';
import { useApi } from '../../../hooks/useApi.js';
import { useAuth } from '../../../context/AuthContext.jsx';
import { useToast } from '../../../context/ToastContext.jsx';
import { PLANS } from '../../../config/plans.js';
import { formatDate, formatDateTime, formatMoney } from '../../../utils/format.js';
import './Billing.css';

const KIND_LABELS = { new: 'First year', renewal: 'Renewal', upgrade: 'Upgrade' };

// Plan & billing. Also the page everyone lands on while the plan is unpaid or expired.
export default function Billing() {
  const toast = useToast();
  const { organization } = useAuth();
  const { data, loading } = useApi('/api/billing');
  const [chosen, setChosen] = useState(null);
  const [busy, setBusy] = useState(false);

  // Pre-select the plan picked on the sign-up page (?plan=…), else the current one
  useEffect(() => {
    if (!data || chosen) return;
    const fromUrl = new URLSearchParams(window.location.search).get('plan');
    setChosen(PLANS.some((p) => p.id === fromUrl) ? fromUrl : data.subscription.plan);
  }, [data, chosen]);

  if (loading || !data) return <div className="page-loader"><span className="page-loader__spinner" /></div>;

  const { subscription: sub, isOwner, plans, payments } = data;
  const locked = !sub.usable;
  const needsNewYear = ['pending_payment', 'expired', 'grace'].includes(sub.status);

  const pay = async (planId) => {
    setBusy(true);
    try {
      const { authorizationUrl } = await api('/api/billing/checkout', { method: 'POST', body: { plan: planId } });
      window.location.assign(authorizationUrl); // Paystack's secure payment page
    } catch (err) {
      toast.error(err.message);
      setBusy(false);
    }
  };

  const title =
    sub.status === 'pending_payment'
      ? `Activate ${organization?.name}`
      : sub.status === 'expired'
        ? 'Your plan has expired'
        : 'Plan & billing';

  return (
    <div className="billing">
      <PageHeader
        title={title}
        subtitle={
          sub.status === 'pending_payment'
            ? 'Choose your plan and pay for the year to start using Workard.'
            : 'Your Workard plan, renewals and payments.'
        }
      />

      {sub.isLegacy && (
        <div className="billing__notice billing__notice--green">
          <ShieldCheck size={18} /> Your organisation was set up before plans started, so it keeps full access to everything at no charge.
        </div>
      )}
      {sub.status === 'grace' && (
        <div className="billing__notice billing__notice--amber">
          <AlertTriangle size={18} /> Your year ended on {formatDate(sub.periodEnd)}. Renew within the next few days to avoid losing access.
        </div>
      )}
      {sub.status === 'expired' && (
        <div className="billing__notice billing__notice--red">
          <Lock size={18} /> Your plan ended on {formatDate(sub.periodEnd)}. Workard is locked until the owner renews — your data is safe.
        </div>
      )}
      {locked && !isOwner && (
        <div className="billing__notice">
          <Lock size={18} /> Only the owner of {organization?.name} can pay. Ask them to finish this step, then refresh this page.
        </div>
      )}

      {!sub.isLegacy && sub.status !== 'pending_payment' && (
        <section className="card card__body billing__current">
          <div>
            <span className="muted">Current plan</span>
            <h2>{sub.planName}</h2>
          </div>
          <div>
            <span className="muted">{sub.status === 'active' ? 'Paid until' : 'Ended'}</span>
            <strong>{formatDate(sub.periodEnd)}</strong>
            {sub.status === 'active' && <small className={sub.daysLeft <= 30 ? 'billing__soon' : 'muted'}>{sub.daysLeft} days left</small>}
          </div>
          <Badge status={sub.status === 'active' ? 'active' : sub.status === 'grace' ? 'pending' : 'overdue'}>
            {sub.status === 'active' ? 'Active' : sub.status === 'grace' ? 'Renew now' : 'Expired'}
          </Badge>
        </section>
      )}

      {!sub.isLegacy && (
        <div className="billing__plans">
          {plans.map((p) => {
            const info = PLANS.find((x) => x.id === p.id);
            const q = p.quote;
            const isCurrent = p.id === sub.plan && !needsNewYear;
            const selectable = needsNewYear && isOwner;
            return (
              <article
                key={p.id}
                className={`billing__plan ${info.featured ? 'billing__plan--featured' : ''} ${selectable && chosen === p.id ? 'is-chosen' : ''}`}
                onClick={() => selectable && setChosen(p.id)}
              >
                {isCurrent && <span className="billing__tag">Your plan</span>}
                {!isCurrent && info.featured && <span className="billing__tag billing__tag--blue">Most popular</span>}
                <h3>{p.name}</h3>
                <p className="billing__price">
                  {formatMoney(p.priceKobo, { decimals: false })} <small>/ year</small>
                </p>
                <p className="muted billing__tagline">{info.tagline}</p>
                <ul>
                  {info.items.map((item) => (
                    <li key={item}><Check size={15} /> {item}</li>
                  ))}
                </ul>

                {isOwner && q && (
                  <div className="billing__action">
                    {needsNewYear ? (
                      <label className="billing__radio">
                        <input type="radio" name="plan" checked={chosen === p.id} onChange={() => setChosen(p.id)} />
                        <span>{chosen === p.id ? 'Selected' : 'Choose'}</span>
                      </label>
                    ) : q.allowed ? (
                      <button type="button" className="btn btn--primary btn--block" disabled={busy} onClick={() => pay(p.id)}>
                        {q.kind === 'upgrade' ? `Upgrade — pay ${formatMoney(q.amountKobo, { decimals: false })}` : `Renew for ${formatMoney(q.amountKobo, { decimals: false })}`}
                      </button>
                    ) : (
                      <p className="billing__reason">{q.reason}</p>
                    )}
                    {q.kind === 'upgrade' && q.allowed && !needsNewYear && (
                      <small className="muted">Only the difference for the {q.daysLeft} days left in your year.</small>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      {needsNewYear && isOwner && chosen && !sub.isLegacy && (
        <div className="billing__paybar card">
          <div>
            <strong>{plans.find((p) => p.id === chosen).name} — one year</strong>
            <span className="muted">Paid securely on Paystack (card, bank transfer or USSD). You’ll come straight back here.</span>
          </div>
          <button type="button" className="btn btn--success btn--lg" disabled={busy} onClick={() => pay(chosen)}>
            <CreditCard size={18} /> {busy ? 'Opening Paystack…' : `Pay ${formatMoney(plans.find((p) => p.id === chosen).quote?.amountKobo ?? 0, { decimals: false })}`}
          </button>
        </div>
      )}

      {isOwner && payments.length > 0 && (
        <section className="card billing__history">
          <header className="card__header"><h2>Payments</h2></header>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr><th>Date</th><th>Plan</th><th>For</th><th>Amount</th><th>Covers</th><th>Status</th></tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td>{formatDateTime(p.paid_at || p.created_at)}</td>
                    <td>{PLANS.find((x) => x.id === p.plan)?.name}</td>
                    <td>{KIND_LABELS[p.kind]}</td>
                    <td>{formatMoney(p.amount_kobo)}</td>
                    <td className="muted">{p.period_start ? `${formatDate(p.period_start)} – ${formatDate(p.period_end)}` : '—'}</td>
                    <td><Badge status={p.status === 'paid' ? 'paid' : p.status === 'failed' ? 'failed' : 'pending'}>{p.status === 'initiated' ? 'Not completed' : p.status === 'paid' ? 'Paid' : 'Failed'}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
