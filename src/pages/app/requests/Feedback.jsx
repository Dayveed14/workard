import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Copy, EyeOff, Lightbulb, MessageSquareWarning, MessagesSquare, Send, UserRound } from 'lucide-react';
import Modal from '../../../components/Modal.jsx';
import Field from '../../../components/Field.jsx';
import Badge from '../../../components/Badge.jsx';
import EmptyState from '../../../components/EmptyState.jsx';
import PageHeader from '../../../components/PageHeader.jsx';
import { api } from '../../../api/client.js';
import { useApi } from '../../../hooks/useApi.js';
import { useToast } from '../../../context/ToastContext.jsx';
import { formatDate, timeAgo } from '../../../utils/format.js';
import { FEEDBACK_BADGE, FEEDBACK_CATEGORIES, FEEDBACK_STATUS } from './requestBits.jsx';

const ICONS = { job: UserRound, complaint: MessageSquareWarning, suggestion: Lightbulb };

function SendFeedbackModal({ onSent, onClose }) {
  const [form, setForm] = useState({ category: 'suggestion', subject: '', body: '', isAnonymous: false });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [privateLink, setPrivateLink] = useState(null);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    setBusy(true);
    try {
      const r = await api('/api/requests/feedback', { method: 'POST', body: form });
      onSent();
      if (r.privateLink) setPrivateLink(`${window.location.origin}${r.privateLink}`);
      else onClose();
    } catch (err) {
      setErrors(err.errors || { body: err.message });
    } finally {
      setBusy(false);
    }
  };

  // Anonymous: show the private link once — it's the only way back to the replies
  if (privateLink) {
    return (
      <Modal title="Sent anonymously" size="sm" onClose={onClose} footer={<button type="button" className="btn btn--primary" onClick={onClose}>Done</button>}>
        <p>Your name isn’t attached to it — not even Workard knows it was you. To read replies and answer them, keep this private link:</p>
        <div className="fb__link">
          <input className="field__input" readOnly value={privateLink} onFocus={(e) => e.target.select()} />
          <button type="button" className="btn btn--outline btn--sm" onClick={() => navigator.clipboard?.writeText(privateLink)}><Copy size={15} /> Copy</button>
        </div>
        <p className="muted fb__note">It won’t be shown again, and it isn’t listed under “My feedback” (that would link it to you).</p>
      </Modal>
    );
  }

  return (
    <Modal
      title="Send feedback"
      size="sm"
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn--ghost" onClick={onClose}>Cancel</button>
          <button type="button" className="btn btn--primary" disabled={busy} onClick={submit}><Send size={15} /> {busy ? 'Sending…' : 'Send'}</button>
        </>
      }
    >
      <div className="fb__types" role="radiogroup" aria-label="Type">
        {Object.entries(FEEDBACK_CATEGORIES).map(([id, label]) => {
          const Icon = ICONS[id];
          return (
            <button key={id} type="button" role="radio" aria-checked={form.category === id} className={`fb__type ${form.category === id ? 'is-on' : ''}`} onClick={() => set('category', id)}>
              <Icon size={18} /> {label}
            </button>
          );
        })}
      </div>
      <Field label="Subject" name="subject" error={errors.subject}>
        <input id="subject" className="field__input" value={form.subject} onChange={(e) => set('subject', e.target.value)} />
      </Field>
      <Field label="Tell us more" name="body" error={errors.body}>
        <textarea id="body" rows={5} className="field__input" value={form.body} onChange={(e) => set('body', e.target.value)} />
      </Field>
      <label className="fb__anon">
        <input type="checkbox" checked={form.isAnonymous} onChange={(e) => set('isAnonymous', e.target.checked)} />
        <span>
          <strong><EyeOff size={15} /> Send anonymously</strong>
          <small>Your name is never stored. You’ll get a private link to follow the replies.</small>
        </span>
      </label>
    </Modal>
  );
}

// The conversation on one piece of feedback (by id, or by an anonymous private link)
export function FeedbackThread({ id, token, manager, onChanged, onClose }) {
  const toast = useToast();
  const path = token ? `/api/requests/feedback/private/${token}` : `/api/requests/feedback/${id}`;
  const { data, setData, error } = useApi(path);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);

  const send = async (status) => {
    setBusy(true);
    try {
      const url = token ? `/api/requests/feedback/private/${token}/replies` : `/api/requests/feedback/${id}/replies`;
      setData(await api(url, { method: 'POST', body: { body: text, ...(status ? { status } : {}) } }));
      setText('');
      onChanged?.();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (error) return <EmptyState icon={MessagesSquare} title="Feedback not found" text="This link may be wrong." />;
  if (!data) return <div className="page-loader"><span className="page-loader__spinner" /></div>;

  return (
    <div className="fb-thread">
      <header className="fb-thread__head">
        <Badge status={FEEDBACK_BADGE[data.status]}>{FEEDBACK_STATUS[data.status]}</Badge>
        <span className="muted">{FEEDBACK_CATEGORIES[data.category]} · {data.is_anonymous ? 'Anonymous' : data.sender_name} · {formatDate(data.created_at)}</span>
      </header>
      <h3>{data.subject}</h3>
      <p className="fb-thread__body">{data.body}</p>
      <ul className="fb-thread__replies">
        {data.replies.map((r) => (
          <li key={r.id} className={r.from_sender ? 'is-sender' : ''}>
            <strong>{r.from_sender ? (data.is_anonymous ? 'Sender (anonymous)' : data.sender_name) : r.author_name}</strong>
            <span className="muted"> · {timeAgo(r.created_at)}</span>
            <p>{r.body}</p>
          </li>
        ))}
      </ul>
      <textarea className="field__input" rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder="Write a reply…" aria-label="Reply" />
      <div className="row-actions fb-thread__actions">
        {manager && data.status !== 'resolved' && <button type="button" className="btn btn--outline btn--sm" disabled={busy} onClick={() => send('resolved')}>{text ? 'Reply & mark resolved' : 'Mark resolved'}</button>}
        {onClose && <button type="button" className="btn btn--ghost btn--sm" onClick={onClose}>Close</button>}
        <button type="button" className="btn btn--primary btn--sm" disabled={busy || !text.trim()} onClick={() => send()}><Send size={14} /> Reply</button>
      </div>
    </div>
  );
}

function FeedbackList({ items, onOpen, showSender }) {
  return (
    <ul className="req-list">
      {items.map((f) => {
        const Icon = ICONS[f.category];
        return (
          <li key={f.id} className="req-row req-row--click" onClick={() => onOpen(f.id)}>
            <span className={`fb__icon fb__icon--${f.category}`}><Icon size={18} /></span>
            <div className="req-row__main">
              <strong>{f.subject}</strong>
              <span className="muted">
                {FEEDBACK_CATEGORIES[f.category]}{showSender && ` · ${f.is_anonymous ? 'Anonymous' : f.sender_name}`} · {formatDate(f.created_at)}
                {f.reply_count > 0 && ` · ${f.reply_count} repl${f.reply_count === 1 ? 'y' : 'ies'}`}
              </span>
            </div>
            <Badge status={FEEDBACK_BADGE[f.status]}>{FEEDBACK_STATUS[f.status]}</Badge>
          </li>
        );
      })}
    </ul>
  );
}

// "Feedback" tab: send feedback, see your named ones
export function MyFeedback() {
  const { data, reload } = useApi('/api/requests/feedback/mine');
  const [sending, setSending] = useState(false);
  const [open, setOpen] = useState(() => Number(new URLSearchParams(window.location.search).get('open')) || null);
  return (
    <>
      <div className="req-ask">
        <button type="button" className="card req-ask__card" onClick={() => setSending(true)}>
          <span className="req-ask__icon req-ask__icon--fb"><MessagesSquare size={22} /></span>
          <span>
            <strong>Send feedback, a complaint or a suggestion</strong>
            <small>About your job or the company — anonymously if you prefer</small>
          </span>
        </button>
      </div>
      <section className="card">
        <header className="card__header"><h2>My feedback</h2></header>
        {!data && <div className="page-loader"><span className="page-loader__spinner" /></div>}
        {data?.length === 0 && <EmptyState icon={MessagesSquare} title="Nothing sent yet" text="Feedback you send with your name shows here with any replies. Anonymous feedback is only reachable through its private link." />}
        {data?.length > 0 && <FeedbackList items={data} onOpen={setOpen} />}
      </section>
      {sending && <SendFeedbackModal onSent={reload} onClose={() => setSending(false)} />}
      {open && (
        <Modal title="Feedback" onClose={() => setOpen(null)}>
          <FeedbackThread id={open} onChanged={reload} onClose={() => setOpen(null)} />
        </Modal>
      )}
    </>
  );
}

// "Staff feedback" tab for HR / the owner (feedback.manage)
export function FeedbackInbox() {
  const [status, setStatus] = useState('');
  const { data, reload } = useApi(`/api/requests/feedback/inbox${status ? `?status=${status}` : ''}`);
  const [open, setOpen] = useState(() => Number(new URLSearchParams(window.location.search).get('open')) || null);
  return (
    <section className="card">
      <header className="card__header">
        <h2>Staff feedback</h2>
        <select className="field__input fb__filter" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status">
          <option value="">All</option>
          {Object.entries(FEEDBACK_STATUS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </header>
      {!data && <div className="page-loader"><span className="page-loader__spinner" /></div>}
      {data?.length === 0 && <EmptyState icon={MessagesSquare} title="No feedback here" text="Feedback, complaints and suggestions from staff arrive here. Anonymous ones never show who sent them." />}
      {data?.length > 0 && <FeedbackList items={data} onOpen={setOpen} showSender />}
      {open && (
        <Modal title="Staff feedback" onClose={() => setOpen(null)}>
          <FeedbackThread id={open} manager onChanged={reload} onClose={() => setOpen(null)} />
        </Modal>
      )}
    </section>
  );
}

// /feedback/:token — the anonymous sender's private link
export function PrivateFeedback() {
  const { token } = useParams();
  useEffect(() => window.scrollTo(0, 0), []);
  return (
    <div className="req">
      <PageHeader title="Your anonymous feedback" subtitle="Only people with this link can open this page. Your name is not attached." />
      <div className="card card__body"><FeedbackThread token={token} /></div>
      <p className="muted"><Link to="/requests?tab=feedback">← Requests</Link></p>
    </div>
  );
}
