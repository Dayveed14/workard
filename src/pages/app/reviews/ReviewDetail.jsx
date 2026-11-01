import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Ban, CheckCircle2, FastForward, Save, Send } from 'lucide-react';
import Badge from '../../../components/Badge.jsx';
import EmptyState from '../../../components/EmptyState.jsx';
import { api } from '../../../api/client.js';
import { useApi } from '../../../hooks/useApi.js';
import { useToast } from '../../../context/ToastContext.jsx';
import { REVIEW_STATUS_LABELS, formatDate, formatHours, periodLabel, scoreLabel } from '../../../utils/format.js';
import './ReviewDetail.css';

const RATING_WORDS = { 1: 'Unsatisfactory', 2: 'Needs improvement', 3: 'Meets expectations', 4: 'Exceeds expectations', 5: 'Outstanding' };

const STEPS = [
  { id: 'self_review', label: 'Self-assessment' },
  { id: 'manager_review', label: 'Manager review' },
  { id: 'acknowledgement', label: 'Employee confirms' },
  { id: 'completed', label: 'Done' },
];

// 1–5 buttons. Read-only when onChange is not given.
function RatingPicker({ value, onChange, label }) {
  if (!onChange) {
    return value ? <span className="rating rating--static" title={RATING_WORDS[value]}>{value}</span> : <span className="muted">—</span>;
  }
  return (
    <div className="rating" role="radiogroup" aria-label={label}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          title={RATING_WORDS[n]}
          className={value === n ? 'is-on' : ''}
          onClick={() => onChange(n)}
        >
          {n}
        </button>
      ))}
    </div>
  );
}

// Weighted score out of 5 from the ratings on screen (matches the server's sum)
function liveScore(rows, field) {
  const rated = rows.filter((r) => r[field]);
  const w = rated.reduce((s, r) => s + r.weight, 0);
  return w ? rated.reduce((s, r) => s + r[field] * r.weight, 0) / w : null;
}

function Facts({ facts }) {
  if (!facts) return <p className="card__body muted">This period hasn’t started yet.</p>;
  const t = facts.tasks;
  const rows = [
    ['Working days', facts.workingDays],
    ['Days clocked in', facts.daysPresent],
    ['Days on leave', facts.leaveDays],
    ['Not clocked in', facts.absentDays, facts.absentDays > 0 ? 'warn' : ''],
    ['Late arrivals', facts.late, facts.late > 0 ? 'warn' : ''],
    ['Flagged clock-ins', facts.flagged, facts.flagged > 0 ? 'warn' : ''],
    ['Average day', facts.avgMinutesWorked ? formatHours(facts.avgMinutesWorked) : '—'],
  ];
  const taskRows = [
    ['Tasks due', t.assigned],
    ['Done', t.done],
    ['Done on time', t.assigned ? `${t.onTime} (${Math.round((t.onTime / t.assigned) * 100)}%)` : '—'],
    ['Still open', t.stillOpen, t.stillOpen > 0 ? 'warn' : ''],
  ];
  const list = (items) => (
    <dl className="review-facts">
      {items.map(([label, value, tone]) => (
        <div key={label} className={tone ? `is-${tone}` : ''}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
  return (
    <div className="card__body">
      <p className="review-facts__title">Attendance</p>
      {list(rows)}
      <p className="review-facts__title">Tasks</p>
      {list(taskRows)}
      <p className="muted review-facts__note">Up to {formatDate(facts.upTo)}. “Not clocked in” can include public holidays.</p>
    </div>
  );
}

export default function ReviewDetail() {
  const { id } = useParams();
  const toast = useToast();
  const { data: review, loading, error, setData } = useApi(`/api/reviews/${id}`);
  const [rows, setRows] = useState([]);
  const [text, setText] = useState({ selfSummary: '', managerSummary: '', goals: '', comment: '' });
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (!review) return;
    setRows(review.scores.map((s) => ({ ...s, comment: s.comment || '' })));
    setText({
      selfSummary: review.self_summary || '',
      managerSummary: review.manager_summary || '',
      goals: review.goals || '',
      comment: review.employee_comment || '',
    });
  }, [review]);

  if (loading && !review) return <div className="page-loader"><span className="page-loader__spinner" /></div>;
  if (error) return <EmptyState title="Review not available" text={error} action={<Link to="/reviews" className="btn btn--outline">Back to reviews</Link>} />;

  const mode = review.canSelfReview ? 'self' : review.canManagerReview ? 'manager' : review.canAcknowledge ? 'acknowledge' : 'read';
  const setRow = (scoreId, field, value) => setRows((list) => list.map((r) => (r.id === scoreId ? { ...r, [field]: value } : r)));
  const onText = (e) => setText((t) => ({ ...t, [e.target.name]: e.target.value }));

  const call = async (path, method, body, message) => {
    setBusy(true);
    setFormError('');
    try {
      setData(await api(`/api/reviews/${id}/${path}`, { method, body }));
      if (message) toast.success(message);
    } catch (err) {
      setFormError(err.message);
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const saveSelf = (submit) =>
    call('self', 'PUT', { scores: rows.map((r) => ({ id: r.id, rating: r.self_rating })), summary: text.selfSummary, submit }, submit ? 'Self-assessment handed in' : 'Draft saved');

  const saveManager = (submit) => {
    if (submit && !window.confirm('Submit this review? The employee will see it and can no longer change it.')) return;
    call(
      'manager',
      'PUT',
      { scores: rows.map((r) => ({ id: r.id, rating: r.manager_rating, comment: r.comment })), summary: text.managerSummary, goals: text.goals, submit },
      submit ? 'Review submitted — the employee has been emailed' : 'Draft saved'
    );
  };

  const stepIndex = STEPS.findIndex((s) => s.id === review.status);
  const score = mode === 'manager' ? liveScore(rows, 'manager_rating') : review.overall_score ? Number(review.overall_score) : null;
  const totalWeight = rows.reduce((s, r) => s + r.weight, 0);

  return (
    <div className="review">
      <div className="review__bar">
        <Link to={review.isEmployee ? '/reviews?tab=mine' : '/reviews?tab=team'} className="link-btn"><ArrowLeft size={16} /> Reviews</Link>
      </div>

      <header className="review__head">
        <div>
          <h1>{review.first_name} {review.last_name}</h1>
          <p className="muted">{review.job_title ? `${review.job_title} · ` : ''}{periodLabel(review.period)}</p>
        </div>
        <Badge status={review.status}>{REVIEW_STATUS_LABELS[review.status]}</Badge>
      </header>

      {review.status !== 'cancelled' && (
        <ol className="review__steps">
          {STEPS.map((s, i) => (
            <li key={s.id} className={i < stepIndex || review.status === 'completed' ? 'is-done' : i === stepIndex ? 'is-active' : ''}>
              {s.label}
            </li>
          ))}
        </ol>
      )}

      {mode === 'self' && <div className="review__notice">Rate yourself honestly on each item (1–5) and add a few words about the period. Your manager sees this once you hand it in.</div>}
      {mode === 'manager' && review.self_submitted_at === null && <div className="review__notice">There is no self-assessment for this review.</div>}
      {mode === 'acknowledge' && <div className="review__notice review__notice--amber">Your manager has finished your review. Read it, add a comment if you like, and confirm.</div>}
      {review.status === 'self_review' && review.isManager && (
        <div className="review__notice">
          Waiting for {review.first_name} to rate themselves.
          <button type="button" className="link-btn" disabled={busy} onClick={() => window.confirm('Skip the self-assessment and write the review now?') && call('skip-self', 'POST', undefined, 'Self-assessment skipped')}>
            <FastForward size={14} /> Skip it
          </button>
        </div>
      )}
      {formError && <div className="form__alert"><AlertCircle size={18} /> {formError}</div>}

      <div className="review__layout">
        <div className="review__main">
          <section className="card">
            <header className="card__header"><h2>Ratings</h2><span className="muted">1 = unsatisfactory · 5 = outstanding</span></header>
            <div className="table-wrap">
              <table className="table review__table">
                <thead>
                  <tr><th>What’s rated</th><th>Weight</th><th>Self</th><th>Manager</th></tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id}>
                      <td>
                        <strong>{r.name}</strong>
                        {mode === 'manager' ? (
                          <input className="field__input review__comment" placeholder="Comment (optional)" value={r.comment} onChange={(e) => setRow(r.id, 'comment', e.target.value)} aria-label={`Comment on ${r.name}`} />
                        ) : (
                          r.comment && <p className="review__row-comment">{r.comment}</p>
                        )}
                      </td>
                      <td className="muted">{Math.round((r.weight / totalWeight) * 100)}%</td>
                      <td><RatingPicker value={r.self_rating} label={`Self rating for ${r.name}`} onChange={mode === 'self' ? (v) => setRow(r.id, 'self_rating', v) : null} /></td>
                      <td><RatingPicker value={r.manager_rating} label={`Manager rating for ${r.name}`} onChange={mode === 'manager' ? (v) => setRow(r.id, 'manager_rating', v) : null} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="card card__body review__texts">
            <div>
              <h3>{review.isEmployee ? 'How the period went (you)' : 'Employee’s view'}</h3>
              {mode === 'self' ? (
                <textarea name="selfSummary" rows={4} className="field__input" value={text.selfSummary} onChange={onText} placeholder="What went well, what was hard, what help you need" />
              ) : (
                <p className="review__para">{review.self_summary || <span className="muted">—</span>}</p>
              )}
            </div>
            <div>
              <h3>Manager’s summary</h3>
              {mode === 'manager' ? (
                <textarea name="managerSummary" rows={4} className="field__input" value={text.managerSummary} onChange={onText} placeholder="Strengths, what to improve, examples" />
              ) : (
                <p className="review__para">{review.manager_summary || <span className="muted">—</span>}</p>
              )}
            </div>
            <div>
              <h3>Goals for next period</h3>
              {mode === 'manager' ? (
                <textarea name="goals" rows={3} className="field__input" value={text.goals} onChange={onText} placeholder="e.g. Open 3 new accounts; no late arrivals" />
              ) : (
                <p className="review__para">{review.goals || <span className="muted">—</span>}</p>
              )}
            </div>
            {(mode === 'acknowledge' || review.employee_comment) && (
              <div>
                <h3>Employee’s comment</h3>
                {mode === 'acknowledge' ? (
                  <textarea name="comment" rows={3} className="field__input" value={text.comment} onChange={onText} placeholder="Optional: anything you’d like on record" />
                ) : (
                  <p className="review__para">{review.employee_comment}</p>
                )}
              </div>
            )}

            <div className="review__buttons">
              {mode === 'self' && (
                <>
                  <button type="button" className="btn btn--outline" disabled={busy} onClick={() => saveSelf(false)}><Save size={16} /> Save draft</button>
                  <button type="button" className="btn btn--primary" disabled={busy} onClick={() => saveSelf(true)}><Send size={16} /> Hand in</button>
                </>
              )}
              {mode === 'manager' && (
                <>
                  <button type="button" className="btn btn--outline" disabled={busy} onClick={() => saveManager(false)}><Save size={16} /> Save draft</button>
                  <button type="button" className="btn btn--primary" disabled={busy} onClick={() => saveManager(true)}><Send size={16} /> Submit review</button>
                </>
              )}
              {mode === 'acknowledge' && (
                <button type="button" className="btn btn--success" disabled={busy} onClick={() => call('acknowledge', 'POST', { comment: text.comment }, 'Thanks — review confirmed')}>
                  <CheckCircle2 size={16} /> I’ve read it — confirm
                </button>
              )}
              {review.canCancel && (
                <button type="button" className="btn btn--ghost review__cancel" disabled={busy} onClick={() => window.confirm('Cancel this review? You can start a new one for the same period.') && call('cancel', 'POST', undefined, 'Review cancelled')}>
                  <Ban size={16} /> Cancel review
                </button>
              )}
            </div>
          </section>
        </div>

        <aside className="review__side">
          <section className="card card__body review__overall">
            <span className="muted">Overall score</span>
            <strong>{score ? score.toFixed(2) : '—'}</strong>
            <span>{score ? scoreLabel(score) : review.isEmployee && !['acknowledgement', 'completed'].includes(review.status) ? 'Shown when your manager submits' : 'Not rated yet'}</span>
            {review.selfScore && <small className="muted">Self-assessment: {Number(review.selfScore).toFixed(2)}</small>}
            {review.reviewer_name && <small className="muted">Reviewed by {review.reviewer_name}</small>}
          </section>
          <section className="card">
            <header className="card__header"><h2>The facts</h2></header>
            <Facts facts={review.facts} />
          </section>
        </aside>
      </div>
    </div>
  );
}
