import { useState } from 'react';
import { MessageSquareWarning, ThumbsUp } from 'lucide-react';
import Modal from './Modal.jsx';
import Field from './Field.jsx';
import { api } from '../api/client.js';
import { useToast } from '../context/ToastContext.jsx';
import { explainDeadline, formatDate, formatTime, timeLeft } from '../utils/format.js';
import './ExplainModal.css';

// The employee's side of a clock-in.
//   Flagged → "That's right, here's why" or "This is wrong" + what happened (goes to their manager)
//   Late    → just the reason
export default function ExplainModal({ record, onDone, onClose }) {
  const toast = useToast();
  const flagged = record.review_status === 'pending';
  const [response, setResponse] = useState(flagged ? '' : 'accept');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const left = flagged ? timeLeft(explainDeadline(record)) : null;

  const submit = async () => {
    if (!response) return setError('Choose whether the flag is right');
    if (reason.trim().length < 5) return setError('Tell us what happened (at least a few words)');
    setBusy(true);
    try {
      const updated = await api(`/api/me/attendance/${record.id}/explanation`, { method: 'POST', body: { response, reason } });
      toast.success(flagged ? 'Sent to your manager' : 'Reason saved');
      onDone?.(updated);
      onClose();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <Modal
      title={flagged ? 'Explain this clock-in' : 'Reason for being late'}
      size="sm"
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn--ghost" onClick={onClose}>Cancel</button>
          <button type="button" className="btn btn--primary" onClick={submit} disabled={busy}>
            {busy ? 'Sending…' : flagged ? 'Send to my manager' : 'Save reason'}
          </button>
        </>
      }
    >
      <p className="explain__context">
        {formatDate(record.work_date)} · clocked in at {formatTime(record.clock_in_at)}
        {flagged && <><br /><strong>Flagged:</strong> {record.flag_reason}</>}
      </p>

      {flagged && (
        <>
          <div className="explain__choices" role="radiogroup" aria-label="Is the flag right?">
            <button type="button" role="radio" aria-checked={response === 'accept'} className={`explain__choice ${response === 'accept' ? 'is-on' : ''}`} onClick={() => { setResponse('accept'); setError(''); }}>
              <ThumbsUp size={18} />
              <strong>That’s right</strong>
              <span>I wasn’t at the office — here’s why</span>
            </button>
            <button type="button" role="radio" aria-checked={response === 'dispute'} className={`explain__choice ${response === 'dispute' ? 'is-on' : ''}`} onClick={() => { setResponse('dispute'); setError(''); }}>
              <MessageSquareWarning size={18} />
              <strong>This is wrong</strong>
              <span>I was where I should be</span>
            </button>
          </div>
          <p className="explain__deadline">
            {left ? `${left} to explain. After that it goes to your manager without your side.` : 'The time to explain has passed.'}
          </p>
        </>
      )}

      <Field label="What happened?" name="reason" error={error}>
        <textarea
          id="reason"
          className="field__input"
          rows={4}
          maxLength={1000}
          placeholder={flagged ? 'e.g. I was at the client’s office in Wuse for a delivery' : 'e.g. Heavy traffic on the airport road'}
          value={reason}
          onChange={(e) => { setReason(e.target.value); setError(''); }}
        />
      </Field>
    </Modal>
  );
}
