import { useEffect, useState } from 'react';
import { AlertTriangle, Check, CreditCard, Gift, Lock, RefreshCw, ShieldCheck, Undo2 } from 'lucide-react';
import PageHeader from '../../../components/PageHeader.jsx';
import Badge from '../../../components/Badge.jsx';
import IntervalToggle from '../../../components/IntervalToggle.jsx';
import { api } from '../../../api/client.js';
import { useApi } from '../../../hooks/useApi.js';
import { useAuth } from '../../../context/AuthContext.jsx';
import { useToast } from '../../../context/ToastContext.jsx';
import { PLANS, perMonthKobo } from '../../../config/plans.js';
import { formatDate, formatDateTime, formatMoney } from '../../../utils/format.js';
import './Billing.css';

const KIND_LABELS = { new: 'First payment', renewal: 'Renewal', upgrade: 'Upgrade', auto_renewal: 'Automatic renewal' };
const INTERVAL_WORD = { monthly: 'month', yearly: 'year' };
const naira = (kobo) => formatMoney(kobo, { decimals: false });

// The day after a date ("renews on")
const dayAfter = (date) => {
  const d = new Date(`${date}T12:00:00`);
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
};

// Staff only see whether the app is usable — the plan is the owner's business
function StaffView({ sub }) {
  const { organization } = useAuth();
  return (
    <div className="billing">
      <PageHeader title="Plan & billing" subtitle={organization?.name} />
      <div className={`billing__notice ${sub.usable ? '' : 'billing__notice--red'}`}>
        <Lock size={18} />
        {sub.usable
          ? `Only the owner of ${organization?.name} manages the plan and payments.`
          : `${organization?.name}’s Workard plan needs attention. Please ask the owner to sort it out, then refresh this page.`}
      </div>
    </div>
  );
}

// Plan & billing (owner). Also the page the owner lands on while the plan is unpaid or expired.
export default function Billing() {
  const toast = useToast();
  const { organization } = useAuth();
  const { data, setData, loading } = useApi('/api/billing');
  const [chosen, setChosen] = useState(null);
  const [interval, setInterval] = useState('monthly');
  const [busy, setBusy] = useState(false);

  // Pre-select the plan picked on the sign-up page (?plan=…), else the current one
  useEffect(() => {
    if (!data?.isOwner || chosen) return;
    const fromUrl = new URLSearchParams(window.location.search).get('plan');
    setChosen(PLANS.some((p) => p.id === fromUrl) ? fromUrl : data.subscription.plan);
    if (data.subscription.interval) setInterval(data.subscription.interval);
  }, [data, chosen]);

  if (loading || !data) return <div className="page-loader"><span className="page-loader__spinner" /></div>;
  if (!data.isOwner) return <StaffView sub={data.subscription} />;

  const { subscription: sub, plans, payments } = data;
  const onTrial = sub.status === 'trial' || sub.status === 'trial_ended';
  const isFree = sub.status === 'free'; // billing switched off (early access)
  const needsPayment = onTrial || ['expired', 'grace'].includes(sub.status);
  const isPaid = !sub.isLegacy && !isFree && !onTrial;
  const days = (n) => `${n} day${n === 1 ? '' : 's'}`;

  const run = async (fn, success) => {
    setBusy(true);
    try {
      const result = await fn();
      if (result?.subscription) setData(result);
      if (success) toast.success(success);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const pay = async (planId) => {
    setBusy(true);
    try {
      const { authorizationUrl } = await api('/api/billing/checkout', { method: 'POST', body: { plan: planId, interval } });
      window.location.assign(authorizationUrl); // Paystack's secure payment page
    } catch (err) {
      toast.error(err.message);
      setBusy(false);
    }
  };

  const schedule = (planId) =>
    run(() => api('/api/billing/change', { method: 'POST', body: { plan: planId, interval } }), 'Change saved — it starts with your next period');
  const undoChange = () => run(() => api('/api/billing/change', { method: 'DELETE' }), 'Change cancelled');
  const autoRenew = (on) => run(() => api('/api/billing/auto-renew', { method: 'POST', body: { on } }), on ? 'Automatic renewal is on' : 'Automatic renewal is off');
  const changeCard = () =>
    run(async () => {
      const { link } = await api('/api/billing/card-link');
      window.open(link, '_blank', 'noopener');
    });

  const title = sub.status === 'trial_ended' ? 'Your free trial has ended' : sub.status === 'expired' ? 'Your plan has expired' : 'Plan & billing';
  const chosenPlan = plans.find((p) => p.id === chosen);

  return (
    <div className="billing">
      <PageHeader
        title={title}
        subtitle={
          needsPayment && sub.status !== 'trial'
            ? 'Choose your plan and pay to keep using Workard — your data is safe.'
            : 'Your Workard plan, renewals and payments.'
        }
      />

      {sub.isLegacy && (
        <div className="billing__notice billing__notice--green">
          <ShieldCheck size={18} /> Your organisation was set up before plans started, so it keeps full access to everything at no charge.
        </div>
      )}
      {isFree && (
        <div className="billing__notice billing__notice--green">
          <Gift size={18} /> Workard is free during early access — {organization?.name} has every feature at no charge. Before paid plans start you’ll get a free trial and plenty of notice.
        </div>
      )}
      {sub.status === 'trial' && (
        <div className="billing__notice billing__notice--blue">
          <Gift size={18} /> You’re on a free trial of {sub.planName} — {days(sub.daysLeft + 1)} left (until {formatDate(sub.periodEnd)}). Pay any time; your paid period starts the day you pay.
        </div>
      )}
      {sub.status === 'trial_ended' && (
        <div className="billing__notice billing__notice--red">
          <Lock size={18} /> Your free trial ended on {formatDate(sub.periodEnd)}. Workard is locked for your team until you pay — everything you set up is kept.
        </div>
      )}
      {sub.status === 'grace' && (
        <div className="billing__notice billing__notice--amber">
          <AlertTriangle size={18} /> Your plan ended on {formatDate(sub.periodEnd)} and wasn’t renewed. Pay within the next few days to avoid losing access.
        </div>
      )}
      {sub.status === 'expired' && (
        <div className="billing__notice billing__notice--red">
          <Lock size={18} /> Your plan ended on {formatDate(sub.periodEnd)}. Workard is locked for your team until you pay — your data is safe.
        </div>
      )}
      {sub.renewalProblem && (
        <div className="billing__notice billing__notice--amber">
          <AlertTriangle size={18} /> {sub.renewalProblem}
          {sub.canManageCard && <button type="button" className="link-btn" onClick={changeCard}>Update card</button>}
        </div>
      )}

      {isPaid && (
        <section className="card card__body billing__current">
          <div>
            <span className="muted">Current plan</span>
            <h2>{sub.planName} <small className="muted">· {sub.interval === 'yearly' ? 'yearly' : 'monthly'}</small></h2>
          </div>
          <div>
            <span className="muted">{sub.status !== 'active' ? 'Ended' : sub.autoRenew ? 'Renews automatically on' : 'Ends on'}</span>
            <strong>{formatDate(sub.status === 'active' && sub.autoRenew ? dayAfter(sub.periodEnd) : sub.periodEnd)}</strong>
            {sub.status === 'active' && <small className={sub.daysLeft <= 7 ? 'billing__soon' : 'muted'}>{days(sub.daysLeft + 1)} left in this {INTERVAL_WORD[sub.interval]}</small>}
          </div>
          <div className="billing__current-actions">
            {sub.status === 'active' && (
              <label className="billing__switch">
                <input type="checkbox" checked={sub.autoRenew} disabled={busy} onChange={(e) => autoRenew(e.target.checked)} />
                <span><RefreshCw size={14} /> Automatic renewal</span>
              </label>
            )}
            {sub.canManageCard && (
              <button type="button" className="btn btn--outline btn--sm" disabled={busy} onClick={changeCard}>
                <CreditCard size={15} /> Change card
              </button>
            )}
          </div>
          {sub.nextPlan && (
            <p className="billing__next">
              From {formatDate(dayAfter(sub.periodEnd))}: <strong>{PLANS.find((p) => p.id === sub.nextPlan)?.name}, {sub.nextInterval}</strong>.
              <button type="button" className="link-btn" disabled={busy} onClick={undoChange}><Undo2 size={14} /> Undo</button>
            </p>
          )}
        </section>
      )}

      {!sub.isLegacy && !isFree && (
        <>
          <div className="billing__toggle">
            <IntervalToggle value={interval} onChange={setInterval} />
          </div>
          <div className="billing__plans">
            {plans.map((p) => {
              const info = PLANS.find((x) => x.id === p.id);
              const q = p.quotes?.[interval];
              const isCurrent = isPaid && sub.status === 'active' && p.id === sub.plan && interval === sub.interval;
              return (
                <article
                  key={p.id}
                  className={`billing__plan ${info.featured ? 'billing__plan--featured' : ''} ${needsPayment && chosen === p.id ? 'is-chosen' : ''}`}
                  onClick={() => needsPayment && setChosen(p.id)}
                >
                  {isCurrent && <span className="billing__tag">Your plan</span>}
                  {!isCurrent && info.featured && <span className="billing__tag billing__tag--blue">Most popular</span>}
                  <h3>{p.name}</h3>
                  <p className="billing__price">
                    {naira(perMonthKobo(info, interval))} <small>/ month</small>
                  </p>
                  <p className="muted billing__billed">
                    {interval === 'yearly' ? `${naira(p.prices.yearly)} billed once a year` : 'billed monthly'}
                  </p>
                  <p className="muted billing__tagline">{info.tagline}</p>
                  <ul>
                    {info.items.map((item) => (
                      <li key={item}><Check size={15} /> {item}</li>
                    ))}
                  </ul>

                  {q && (
                    <div className="billing__action">
                      {needsPayment ? (
                        <label className="billing__radio">
                          <input type="radio" name="plan" checked={chosen === p.id} onChange={() => setChosen(p.id)} />
                          <span>{chosen === p.id ? 'Selected' : 'Choose'}</span>
                        </label>
                      ) : !q.allowed ? (
                        <p className="billing__reason">{q.reason}</p>
                      ) : q.kind === 'upgrade' ? (
                        <>
                          <button type="button" className="btn btn--primary btn--block" disabled={busy} onClick={() => pay(p.id)}>
                            Upgrade — pay {naira(q.amountKobo)} now
                          </button>
                          <small className="muted">Only the difference for the {days(q.daysLeft)} left in this {INTERVAL_WORD[sub.interval]}.</small>
                        </>
                      ) : (
                        <>
                          <button type="button" className="btn btn--outline btn--block" disabled={busy || (sub.nextPlan === p.id && sub.nextInterval === interval)} onClick={() => schedule(p.id)}>
                            {sub.nextPlan === p.id && sub.nextInterval === interval ? 'Scheduled' : `Switch from ${formatDate(q.startsOn)}`}
                          </button>
                          <small className="muted">Nothing to pay now. {naira(q.nextAmountKobo)} will be charged on {formatDate(q.startsOn)}.</small>
                        </>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </>
      )}

      {needsPayment && chosenPlan && !sub.isLegacy && !isFree && (
        <div className="billing__paybar card">
          <div>
            <strong>{chosenPlan.name} — {interval === 'yearly' ? 'one year' : 'one month'}</strong>
            <span className="muted">Paid securely on Paystack by card. Your card is charged again automatically each {INTERVAL_WORD[interval]} — turn it off any time.</span>
          </div>
          <button type="button" className="btn btn--success btn--lg" disabled={busy} onClick={() => pay(chosen)}>
            <CreditCard size={18} /> {busy ? 'Opening Paystack…' : `Pay ${naira(chosenPlan.quotes?.[interval]?.amountKobo ?? 0)}`}
          </button>
        </div>
      )}

      {payments.length > 0 && (
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
                    <td>{PLANS.find((x) => x.id === p.plan)?.name}{p.billing_interval && <span className="muted"> · {p.billing_interval}</span>}</td>
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
