import { useState } from 'react';
import { Banknote, HandCoins, PiggyBank } from 'lucide-react';
import Modal from '../../../components/Modal.jsx';
import Field from '../../../components/Field.jsx';
import Badge from '../../../components/Badge.jsx';
import EmptyState from '../../../components/EmptyState.jsx';
import Avatar from '../../../components/Avatar.jsx';
import { api } from '../../../api/client.js';
import { useApi } from '../../../hooks/useApi.js';
import { useToast } from '../../../context/ToastContext.jsx';
import { formatDate, formatMoney, fullName } from '../../../utils/format.js';
import { STATUS_BADGE, STATUS_LABELS, TYPE_LABELS, previewPlan } from './requestBits.jsx';

const naira = (kobo) => formatMoney(kobo, { decimals: false });

// Ask for a salary advance or a loan, with the repayment worked out as you type
function AskModal({ type, limits, onDone, onClose }) {
  const toast = useToast();
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const max = limits[type].maxKobo;
  const kobo = Math.round(Number(amount || 0) * 100);
  const plan = previewPlan(limits[type], kobo);

  const submit = async () => {
    setBusy(true);
    try {
      await api('/api/requests', { method: 'POST', body: { type, amount: Number(amount), reason } });
      toast.success('Sent to your line manager');
      onDone();
      onClose();
    } catch (err) {
      setErrors(err.errors || { amount: err.message });
      setBusy(false);
    }
  };

  return (
    <Modal
      title={type === 'loan' ? 'Ask for a staff loan' : 'Ask for a salary advance'}
      size="sm"
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn--ghost" onClick={onClose}>Cancel</button>
          <button type="button" className="btn btn--primary" disabled={busy || !kobo} onClick={submit}>{busy ? 'Sending…' : 'Send request'}</button>
        </>
      }
    >
      <p className="muted req__intro">
        {type === 'loan'
          ? `Up to ${naira(max)} (${limits.loan.maxPercent}% of a year’s basic pay${limits.loan.ceilingKobo ? `, at most ${naira(limits.loan.ceilingKobo)}` : ''}, less any open loans). Repaid over ${plan.months} month${plan.months === 1 ? '' : 's'} from your salary${plan.ratePct ? `, with ${plan.ratePct}% flat interest` : ', no interest'}.`
          : `Up to ${naira(max)} (${limits.advance.maxPercent}% of a month’s basic pay). ${plan.months === 1 ? 'Taken back in full from your next salary' : `Taken back over your next ${plan.months} salaries`}${plan.ratePct ? `, with ${plan.ratePct}% interest` : ' — no interest'}.`}
      </p>
      <Field label="Amount (₦)" name="amount" error={errors.amount}>
        <input id="amount" type="number" min="1" step="1" inputMode="numeric" className="field__input" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={type === 'loan' ? 'e.g. 500000' : 'e.g. 100000'} autoFocus />
      </Field>
      {kobo > 0 && (
        <dl className={`req__plan ${kobo > max ? 'is-over' : ''}`}>
          <div><dt>You receive</dt><dd>{naira(kobo)}</dd></div>
          {plan.ratePct > 0 && <div><dt>Interest ({plan.ratePct}%)</dt><dd>{naira(plan.total - kobo)}</dd></div>}
          <div><dt>You repay</dt><dd>{naira(plan.total)}</dd></div>
          <div><dt>{plan.months === 1 ? 'From your next salary' : 'From each salary'}</dt><dd><strong>{naira(plan.monthly)}</strong>{plan.months > 1 && ` × ${plan.months}`}</dd></div>
        </dl>
      )}
      <Field label="What’s it for?" name="reason" error={errors.reason}>
        <textarea id="reason" rows={3} className="field__input" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Only your line manager and the payroll team see this" />
      </Field>
    </Modal>
  );
}

// One request as a row (shared by mine / approvals / payouts)
function RequestRow({ r, showPerson, actions }) {
  const repaidPct = Number(r.total_repayable_kobo) ? Math.round((Number(r.repaid_kobo) / Number(r.total_repayable_kobo)) * 100) : 0;
  return (
    <li className="req-row">
      {showPerson && (
        <span className="person">
          <Avatar name={fullName(r)} src={r.photo_url} size={34} />
          <span><strong>{fullName(r)}</strong><span>{formatDate(r.created_at)}</span></span>
        </span>
      )}
      <div className="req-row__main">
        <strong>{TYPE_LABELS[r.type]} · {naira(r.amount_kobo)}</strong>
        <span className="muted">
          Repay {naira(r.total_repayable_kobo)}{r.months > 1 ? ` at ${naira(r.monthly_deduction_kobo)}/month` : ' from the next salary'}
          {!showPerson && ` · asked ${formatDate(r.created_at)}`}
        </span>
        {r.reason && <span className="req-row__reason">“{r.reason}”</span>}
        {r.decision_note && <span className="muted">{r.decided_by_name}: {r.decision_note}</span>}
        {['paid_out', 'repaid'].includes(r.status) && (
          <span className="req-row__progress" title={`${repaidPct}% repaid`}>
            <span className="req-row__bar"><span style={{ width: `${repaidPct}%` }} /></span>
            {naira(r.repaid_kobo)} of {naira(r.total_repayable_kobo)} repaid
          </span>
        )}
      </div>
      <Badge status={STATUS_BADGE[r.status]}>{STATUS_LABELS[r.status]}</Badge>
      {actions && <div className="row-actions">{actions}</div>}
    </li>
  );
}

export function MyMoneyRequests() {
  const toast = useToast();
  const { data: limits, reload: reloadLimits } = useApi('/api/requests/limits');
  const { data, reload } = useApi('/api/requests?view=mine');
  const [asking, setAsking] = useState(null);
  const refresh = () => { reload(); reloadLimits(); };

  const cancel = async (r) => {
    try {
      await api(`/api/requests/${r.id}/cancel`, { method: 'POST' });
      refresh();
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (!limits || !data) return <div className="page-loader"><span className="page-loader__spinner" /></div>;
  const noSalary = !limits.basicMonthlyKobo;

  return (
    <>
      <div className="req-ask">
        <button type="button" className="card req-ask__card" disabled={noSalary || !limits.advance.enabled || limits.advance.open} onClick={() => setAsking('advance')}>
          <span className="req-ask__icon"><Banknote size={22} /></span>
          <span>
            <strong>Salary advance</strong>
            <small>
              {!limits.advance.enabled
                ? 'Not offered by your company'
                : limits.advance.open
                  ? 'You already have one open'
                  : `Up to ${naira(limits.advance.maxKobo)} · ${limits.advance.months === 1 ? 'back from your next salary' : `back over ${limits.advance.months} salaries`}`}
            </small>
          </span>
        </button>
        <button type="button" className="card req-ask__card" disabled={noSalary || !limits.loan.enabled || !limits.loan.maxKobo} onClick={() => setAsking('loan')}>
          <span className="req-ask__icon req-ask__icon--loan"><PiggyBank size={22} /></span>
          <span>
            <strong>Staff loan</strong>
            <small>
              {limits.loan.enabled
                ? `Up to ${naira(limits.loan.maxKobo)} · ${limits.loan.months} month${limits.loan.months === 1 ? '' : 's'} · ${limits.loan.interestRateBp / 100}% flat`
                : 'Not offered by your company'}
            </small>
          </span>
        </button>
      </div>
      {noSalary && <p className="muted">Your salary isn’t set up in payroll yet, so you can’t ask for an advance or loan. Ask HR.</p>}

      <section className="card">
        <header className="card__header"><h2>My requests</h2></header>
        {data.length === 0 ? (
          <EmptyState icon={HandCoins} title="Nothing yet" text="Your salary advances and loans — and how much is left to repay — show here." />
        ) : (
          <ul className="req-list">
            {data.map((r) => (
              <RequestRow key={r.id} r={r} actions={r.status === 'pending' && <button type="button" className="btn btn--ghost btn--sm" onClick={() => cancel(r)}>Cancel</button>} />
            ))}
          </ul>
        )}
      </section>
      {asking && <AskModal type={asking} limits={limits} onDone={refresh} onClose={() => setAsking(null)} />}
    </>
  );
}

// Line managers approve or reject
export function Approvals({ data, reload }) {
  const toast = useToast();
  const [deciding, setDeciding] = useState(null);
  const [note, setNote] = useState('');

  const decide = async () => {
    try {
      await api(`/api/requests/${deciding.r.id}/decision`, { method: 'PATCH', body: { decision: deciding.decision, note } });
      toast.success(deciding.decision === 'approved' ? 'Approved — the payroll team will pay it out' : 'Rejected');
      setDeciding(null);
      setNote('');
      reload();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <section className="card">
      <header className="card__header"><h2>From the people who report to you</h2></header>
      {data.length === 0 ? (
        <EmptyState icon={HandCoins} title="No requests" text="When someone who reports to you asks for an advance or a loan, you approve it here." />
      ) : (
        <ul className="req-list">
          {data.map((r) => (
            <RequestRow
              key={r.id}
              r={r}
              showPerson
              actions={r.canDecide && (
                <>
                  <button type="button" className="btn btn--outline btn--sm" onClick={() => setDeciding({ r, decision: 'rejected' })}>Reject</button>
                  <button type="button" className="btn btn--success btn--sm" onClick={() => setDeciding({ r, decision: 'approved' })}>Approve</button>
                </>
              )}
            />
          ))}
        </ul>
      )}
      {deciding && (
        <Modal
          title={deciding.decision === 'approved' ? 'Approve request' : 'Reject request'}
          size="sm"
          onClose={() => setDeciding(null)}
          footer={
            <>
              <button type="button" className="btn btn--ghost" onClick={() => setDeciding(null)}>Cancel</button>
              <button type="button" className={`btn ${deciding.decision === 'approved' ? 'btn--success' : 'btn--danger'}`} onClick={decide}>
                {deciding.decision === 'approved' ? 'Approve' : 'Reject'}
              </button>
            </>
          }
        >
          <p className="req__intro">
            {fullName(deciding.r)} — {TYPE_LABELS[deciding.r.type].toLowerCase()} of {naira(deciding.r.amount_kobo)}, repaid at {naira(deciding.r.monthly_deduction_kobo)} {deciding.r.months > 1 ? `a month for ${deciding.r.months} months` : 'from the next salary'}.
          </p>
          <Field label="Note to them" name="note" optional>
            <textarea id="note" rows={3} className="field__input" value={note} onChange={(e) => setNote(e.target.value)} />
          </Field>
        </Modal>
      )}
    </section>
  );
}

// The payroll team pays approved requests out, then repayments start automatically
export function Payouts() {
  const toast = useToast();
  const { data, reload } = useApi('/api/requests?view=payouts');
  const payOut = async (r) => {
    if (!window.confirm(`Have you sent ${naira(r.amount_kobo)} to ${fullName(r)}? Repayments start with the next payroll.`)) return;
    try {
      await api(`/api/requests/${r.id}/paid-out`, { method: 'POST' });
      toast.success('Marked as paid out');
      reload();
    } catch (err) {
      toast.error(err.message);
    }
  };
  if (!data) return <div className="page-loader"><span className="page-loader__spinner" /></div>;
  return (
    <section className="card">
      <header className="card__header"><h2>Approved advances & loans</h2></header>
      {data.length === 0 ? (
        <EmptyState icon={HandCoins} title="Nothing to pay out" text="Approved requests appear here. Send the money, then mark it paid out — repayments come off payroll automatically." />
      ) : (
        <ul className="req-list">
          {data.map((r) => (
            <RequestRow key={r.id} r={r} showPerson actions={r.status === 'approved' && <button type="button" className="btn btn--primary btn--sm" onClick={() => payOut(r)}>Mark as paid out</button>} />
          ))}
        </ul>
      )}
    </section>
  );
}
