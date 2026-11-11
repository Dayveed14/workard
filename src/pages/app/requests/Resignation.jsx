import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, DoorOpen } from 'lucide-react';
import Modal from '../../../components/Modal.jsx';
import Field from '../../../components/Field.jsx';
import { Progress } from '../onboarding/Onboarding.jsx';
import { StatusBadge, timeLeft } from '../offboarding/offboardingBits.jsx';
import { api } from '../../../api/client.js';
import { useApi } from '../../../hooks/useApi.js';
import { useToast } from '../../../context/ToastContext.jsx';
import { formatDate, todayString } from '../../../utils/format.js';

const addDays = (days) => {
  const d = new Date();
  d.setDate(d.getDate() + Number(days));
  return todayString(d);
};

// Requests → Resignation: the employee resigns, which starts their notice period.
// HR is told and sends an offboarding checklist (handover note, documents, company items).
export default function Resignation() {
  const toast = useToast();
  const { data, setData } = useApi('/api/offboarding/mine');
  const [asking, setAsking] = useState(false);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  if (!data) return <div className="page-loader"><span className="page-loader__spinner" /></div>;
  const o = data.offboarding;

  const resign = async () => {
    setBusy(true);
    try {
      const result = await api('/api/offboarding/resign', { method: 'POST', body: { reason } });
      setData({ ...data, offboarding: result });
      setAsking(false);
      toast.success(`Your ${data.noticeDays}-day notice period has started`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (o) {
    const termination = o.exit_type === 'termination';
    const done = o.items.filter((i) => i.done_at).length;
    return (
      <section className="card card__body off-mine">
        <div className="off-mine__head">
          <DoorOpen size={22} />
          <div>
            <h2>{termination ? 'Your exit steps' : 'Your notice period has started'}</h2>
            <p className="muted">
              Last day <strong>{formatDate(o.last_day)}</strong> · {timeLeft(o.ends_at)}
            </p>
          </div>
          <StatusBadge status={o.status} />
        </div>
        {o.template_name ? (
          <>
            <p>HR has sent your offboarding checklist. Please finish your steps {termination ? 'within the 24 hours' : 'before your last day'}.</p>
            <Progress done={done} total={o.items.length} />
          </>
        ) : (
          <p>HR has been told. They’ll send you a short offboarding checklist — handover note, company documents and items to return.</p>
        )}
        <Link to={`/offboarding/${o.id}`} className="btn btn--primary off-mine__open">
          {o.template_name ? 'Open my checklist' : 'View details'} <ArrowRight size={16} />
        </Link>
      </section>
    );
  }

  return (
    <>
      <section className="card card__body off-mine">
        <div className="off-mine__head">
          <DoorOpen size={22} />
          <div>
            <h2>Resign</h2>
            <p className="muted">Leaving the company? Tell HR here. Your notice period is <strong>{data.noticeDays} days</strong>.</p>
          </div>
        </div>
        <ol className="off-mine__steps">
          <li>Your notice period starts the day you resign — your last day would be <strong>{formatDate(addDays(data.noticeDays))}</strong>.</li>
          <li>HR sends you an offboarding checklist: a handover note, company documents and items to return.</li>
          <li>You tick the steps off before your last day. Your Workard access ends after it.</li>
        </ol>
        <p className="muted">Changed your mind? You can withdraw your resignation while your notice period is running.</p>
        <button type="button" className="btn btn--outline off-mine__open" onClick={() => setAsking(true)}><DoorOpen size={16} /> I want to resign</button>
      </section>

      {asking && (
        <Modal
          title="Resign"
          size="sm"
          onClose={() => setAsking(false)}
          footer={
            <>
              <button type="button" className="btn btn--ghost" onClick={() => setAsking(false)}>Cancel</button>
              <button type="button" className="btn btn--danger" disabled={busy} onClick={resign}>{busy ? 'Sending…' : 'Start my notice period'}</button>
            </>
          }
        >
          <p style={{ marginBottom: 14 }}>
            Your {data.noticeDays}-day notice period starts today. Your last day will be <strong>{formatDate(addDays(data.noticeDays))}</strong>, and HR will be told straight away.
          </p>
          <Field label="Anything you’d like HR to know?" name="reason" optional>
            <textarea id="reason" rows={4} className="field__input" value={reason} maxLength={2000} onChange={(e) => setReason(e.target.value)} placeholder="e.g. I’m moving to another city" />
          </Field>
        </Modal>
      )}
    </>
  );
}
