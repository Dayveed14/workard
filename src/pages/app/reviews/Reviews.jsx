import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ClipboardCheck, Play, Settings } from 'lucide-react';
import PageHeader from '../../../components/PageHeader.jsx';
import Tabs from '../../../components/Tabs.jsx';
import Badge from '../../../components/Badge.jsx';
import Modal from '../../../components/Modal.jsx';
import EmptyState from '../../../components/EmptyState.jsx';
import { api, toQuery } from '../../../api/client.js';
import { useApi } from '../../../hooks/useApi.js';
import { useAuth } from '../../../context/AuthContext.jsx';
import { useToast } from '../../../context/ToastContext.jsx';
import { REVIEW_STATUS_LABELS, periodLabel, scoreLabel } from '../../../utils/format.js';
import './Reviews.css';

// The last few periods for the period picker ("2026-11", or "2026-Q4" when quarterly)
function recentPeriods(current, frequency) {
  const list = [];
  if (frequency === 'quarterly') {
    let [y, q] = [Number(current.slice(0, 4)), Number(current.slice(-1))];
    for (let i = 0; i < 6; i += 1) {
      list.push(`${y}-Q${q}`);
      q -= 1;
      if (q === 0) [y, q] = [y - 1, 4];
    }
  } else {
    const [y, m] = current.split('-').map(Number);
    for (let i = 0; i < 12; i += 1) {
      const d = new Date(y, m - 1 - i, 1);
      list.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }
  }
  return list;
}

function ScoreCell({ score }) {
  if (!score) return <span className="muted">—</span>;
  return (
    <span className="reviews__score">
      <strong>{Number(score).toFixed(1)}</strong> <span className="muted">{scoreLabel(score)}</span>
    </span>
  );
}

function ReviewTable({ reviews, showPerson }) {
  const navigate = useNavigate();
  return (
    <div className="table-wrap">
      <table className="table table--clickable">
        <thead>
          <tr>{showPerson && <th>Employee</th>}<th>Period</th><th>Stage</th><th>Score</th><th>Reviewer</th></tr>
        </thead>
        <tbody>
          {reviews.map((r) => (
            <tr key={r.id} onClick={() => navigate(`/reviews/${r.id}`)}>
              {showPerson && (
                <td>
                  <div className="person">
                    <span><strong>{r.first_name} {r.last_name}</strong><span>{r.job_title || '—'}</span></span>
                  </div>
                </td>
              )}
              <td>{periodLabel(r.period)}</td>
              <td><Badge status={r.status}>{REVIEW_STATUS_LABELS[r.status]}</Badge></td>
              <td><ScoreCell score={r.overall_score} /></td>
              <td className="muted">{r.reviewer_name || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Choose who to start a review for in this period
function StartModal({ period, onClose, onStarted }) {
  const toast = useToast();
  const { data: people } = useApi(`/api/reviews/reviewables${toQuery({ period })}`);
  const [chosen, setChosen] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (people && chosen === null) setChosen(people.filter((p) => !p.review).map((p) => p.id));
  }, [people, chosen]);

  const toggle = (id) => setChosen((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]));

  const start = async () => {
    setBusy(true);
    try {
      const r = await api('/api/reviews/start', { method: 'POST', body: { period, employeeIds: chosen } });
      toast.success(`${r.created} review(s) started${r.skipped.length ? ` · ${r.skipped.length} already started` : ''}`);
      onStarted();
      onClose();
    } catch (err) {
      toast.error(err.message);
      setBusy(false);
    }
  };

  return (
    <Modal
      title={`Start reviews — ${periodLabel(period)}`}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn--ghost" onClick={onClose}>Cancel</button>
          <button type="button" className="btn btn--primary" onClick={start} disabled={busy || !chosen?.length}>
            Start {chosen?.length || 0} review(s)
          </button>
        </>
      }
    >
      {!people && <div className="page-loader"><span className="page-loader__spinner" /></div>}
      {people?.length === 0 && <p className="muted">There’s nobody for you to review. Reviews are for people in your scope, or who report to you.</p>}
      {people?.length > 0 && (
        <ul className="reviews__pick">
          {people.map((p) => (
            <li key={p.id}>
              <label className={p.review ? 'is-started' : ''}>
                <input type="checkbox" disabled={!!p.review} checked={Boolean(p.review || chosen?.includes(p.id))} onChange={() => toggle(p.id)} />
                <span>
                  <strong>{p.first_name} {p.last_name}</strong>
                  <small>{[p.job_title, p.department_name].filter(Boolean).join(' · ') || '—'}</small>
                </span>
                {p.review && <Badge status={p.review.status}>{REVIEW_STATUS_LABELS[p.review.status]}</Badge>}
              </label>
            </li>
          ))}
        </ul>
      )}
      <p className="muted reviews__pick-note">Each person is emailed to rate themselves first (if self-assessment is on in Settings → Reviews).</p>
    </Modal>
  );
}

function TeamReviews({ settings, canStart }) {
  const [period, setPeriod] = useState(settings.currentPeriod);
  const [starting, setStarting] = useState(false);
  const { data: reviews, loading, reload } = useApi(`/api/reviews${toQuery({ view: 'team', period })}`);
  const team = reviews?.filter((r) => r.status !== 'cancelled');

  const counts = (team || []).reduce((acc, r) => ({ ...acc, [r.status]: (acc[r.status] || 0) + 1 }), {});
  const scored = (team || []).filter((r) => r.overall_score);
  const average = scored.length ? scored.reduce((s, r) => s + Number(r.overall_score), 0) / scored.length : null;

  return (
    <>
      <div className="toolbar reviews__bar">
        <select className="field__input" value={period} onChange={(e) => setPeriod(e.target.value)} aria-label="Period">
          {recentPeriods(settings.currentPeriod, settings.frequency).map((p) => <option key={p} value={p}>{periodLabel(p)}</option>)}
        </select>
        <div className="reviews__summary">
          <span><strong>{team?.length ?? '…'}</strong> reviews</span>
          <span><strong>{(counts.self_review || 0) + (counts.manager_review || 0)}</strong> in progress</span>
          <span><strong>{counts.completed || 0}</strong> completed</span>
          {average && <span>Average <strong>{average.toFixed(1)}</strong> / 5</span>}
        </div>
        {canStart && (
          <button type="button" className="btn btn--primary" onClick={() => setStarting(true)}>
            <Play size={18} /> Start reviews
          </button>
        )}
      </div>
      <div className="card">
        {loading && !reviews && <div className="page-loader"><span className="page-loader__spinner" /></div>}
        {team?.length === 0 && (
          <EmptyState icon={ClipboardCheck} title={`No reviews for ${periodLabel(period)}`} text={canStart ? 'Press “Start reviews” to begin this period’s reviews for your team.' : undefined} />
        )}
        {team?.length > 0 && <ReviewTable reviews={team} showPerson />}
      </div>
      {starting && <StartModal period={period} onClose={() => setStarting(false)} onStarted={reload} />}
    </>
  );
}

export default function Reviews() {
  const { can, canAny, employee } = useAuth();
  const [params, setParams] = useSearchParams();
  const { data: settings } = useApi('/api/reviews/settings');
  const { data: mine } = useApi(employee ? '/api/reviews?view=mine' : null);
  const { data: reviewables } = useApi(settings ? `/api/reviews/reviewables?period=${settings.currentPeriod}` : null);

  if (!settings) return <div className="page-loader"><span className="page-loader__spinner" /></div>;

  const canStart = (reviewables?.length || 0) > 0;
  const showTeam = canStart || canAny('reviews.view', 'reviews.manage');
  const tabs = [
    employee && { id: 'mine', label: 'My reviews', count: mine?.filter((r) => ['self_review', 'acknowledgement'].includes(r.status)).length || undefined },
    showTeam && { id: 'team', label: 'Team reviews' },
  ].filter(Boolean);
  const tab = tabs.some((t) => t.id === params.get('tab')) ? params.get('tab') : tabs[0]?.id;

  return (
    <>
      <PageHeader
        title="Performance reviews"
        subtitle={`${settings.frequency === 'quarterly' ? 'Quarterly' : 'Monthly'} reviews: rate, discuss and agree goals — with attendance and task numbers alongside.`}
        actions={can('reviews.setup') && <Link to="/settings?tab=reviews" className="btn btn--outline"><Settings size={18} /> Review settings</Link>}
      />
      {tabs.length > 1 && <Tabs tabs={tabs} active={tab} onChange={(id) => setParams({ tab: id })} />}
      {tab === 'mine' && (
        <div className="card">
          {!mine && <div className="page-loader"><span className="page-loader__spinner" /></div>}
          {mine?.length === 0 && <EmptyState icon={ClipboardCheck} title="No reviews yet" text="When your manager starts a review, it shows here and you’ll get an email." />}
          {mine?.length > 0 && <ReviewTable reviews={mine.filter((r) => r.status !== 'cancelled')} />}
        </div>
      )}
      {tab === 'team' && <TeamReviews settings={settings} canStart={canStart} />}
    </>
  );
}
