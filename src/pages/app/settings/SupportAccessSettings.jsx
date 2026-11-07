import { useState } from 'react';
import { LifeBuoy, ShieldCheck } from 'lucide-react';
import Field from '../../../components/Field.jsx';
import { api } from '../../../api/client.js';
import { useApi } from '../../../hooks/useApi.js';
import { useToast } from '../../../context/ToastContext.jsx';
import { formatDateTime } from '../../../utils/format.js';

// Owner only: let Workard support look around this account (read-only) for a few hours.
// Without this, Workard can see your plan and how many people use it — never your records.
export default function SupportAccessSettings() {
  const toast = useToast();
  const { data, setData, loading } = useApi('/api/support-access');
  const [hours, setHours] = useState(4);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  const run = async (request, message) => {
    setBusy(true);
    try {
      setData(await request());
      toast.success(message);
      setReason('');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (loading || !data) return <div className="page-loader"><span className="page-loader__spinner" /></div>;
  const active = data.active;

  return (
    <div className="support-access-wrap">
      <section className="card card__body support-access">
        <h2><LifeBuoy size={20} /> Workard support access</h2>
        <p className="muted">
          Workard can’t see your employees, payroll, customers or invoices. If you need help with something, you can let our support team look around
          — <strong>read-only</strong> (they can’t change anything) and only for the time you choose. Every visit shows in your activity log and bell.
        </p>

        {active ? (
          <div className="support-access__open">
            <ShieldCheck size={20} />
            <div>
              <strong>Open until {formatDateTime(active.expires_at)}</strong>
              {active.reason && <p className="muted">“{active.reason}”</p>}
            </div>
            <button type="button" className="btn btn--danger" disabled={busy} onClick={() => run(() => api('/api/support-access', { method: 'DELETE' }), 'Support access closed')}>
              Close now
            </button>
          </div>
        ) : (
          <div className="form form--flush support-access__form">
            <div className="form__row">
              <Field label="For" name="hours">
                <select id="hours" className="field__input" value={hours} onChange={(e) => setHours(Number(e.target.value))}>
                  {data.hours.map((h) => <option key={h} value={h}>{h === 1 ? '1 hour' : h < 24 ? `${h} hours` : `${h / 24} day${h === 24 ? '' : 's'}`}</option>)}
                </select>
              </Field>
              <Field label="What do you need help with?" name="reason" optional>
                <input id="reason" className="field__input" value={reason} maxLength={255} onChange={(e) => setReason(e.target.value)} placeholder="e.g. payroll totals look wrong" />
              </Field>
            </div>
            <button type="button" className="btn btn--primary" disabled={busy} onClick={() => run(() => api('/api/support-access', { method: 'POST', body: { hours, reason } }), 'Support can look around now')}>
              Let Workard support in
            </button>
          </div>
        )}
      </section>

      {data.visits.length > 0 && (
        <section className="card">
          <header className="card__header"><h2>Support visits</h2></header>
          <ul className="support-access__visits">
            {data.visits.map((v, i) => (
              <li key={i}><strong>{v.who}</strong> looked around (read-only) · {formatDateTime(v.created_at)}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
