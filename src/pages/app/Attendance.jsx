import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { BarChart3, Check, Flag, Hourglass, MapPin, ShieldCheck, Wifi, X } from 'lucide-react';
import PageHeader from '../../components/PageHeader.jsx';
import Tabs from '../../components/Tabs.jsx';
import ClockCard from '../../components/ClockCard.jsx';
import MonthAttendance from '../../components/MonthAttendance.jsx';
import Avatar from '../../components/Avatar.jsx';
import Badge from '../../components/Badge.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import ReviewModal from '../../components/ReviewModal.jsx';
import AdherenceDonut, { ATTENDANCE_PARTS, AdherenceTrend } from '../../components/AdherenceDonut.jsx';
import { AdherenceBar, AdherenceRing } from '../../components/AdherenceBar.jsx';
import { api } from '../../api/client.js';
import { useApi } from '../../hooks/useApi.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { EXPLANATION_LABELS, formatDate, formatTime, fullName, monthLabel, timeLeft, todayString } from '../../utils/format.js';
import './Attendance.css';

// Monthly adherence for everyone the viewer can see — worst first, so the people
// who need a conversation are at the top. Bars compare people; the donut sums up the team.
function Monthly() {
  const navigate = useNavigate();
  const [month, setMonth] = useState(todayString().slice(0, 7));
  const { data, loading } = useApi(`/api/attendance/monthly?month=${month}`);

  return (
    <>
      <div className="att__toolbar">
        <input type="month" className="field__input" value={month} max={todayString().slice(0, 7)} onChange={(e) => setMonth(e.target.value)} aria-label="Month" />
        {data && data.holidays > 0 && <span className="muted">{data.holidays} public holiday{data.holidays === 1 ? '' : 's'} not counted</span>}
      </div>

      {loading && !data && <div className="page-loader"><span className="page-loader__spinner" /></div>}
      {data && (
        <>
          <AdherenceDonut data={{ ...data.team, holidays: 0, upTo: data.upTo }} title={`Everyone, ${monthLabel(month)}`} />

          <div className="card">
            {data.people.length === 0 ? (
              <EmptyState icon={BarChart3} title="No one to show" />
            ) : (
              <>
                <div className="att-month__legend" aria-hidden="true">
                  {ATTENDANCE_PARTS.map((p) => (
                    <span key={p.key}><i style={{ background: p.color }} /> {p.label}</span>
                  ))}
                  <span className="att-month__legend-note">Sorted by on-time %, lowest first</span>
                </div>
                <ul className="att-month">
                  {data.people.map((p) => (
                    <li key={p.employeeId} onClick={() => navigate(`/employees/${p.employeeId}?tab=attendance`)}>
                      <div className="person att-month__person">
                        <Avatar name={`${p.firstName} ${p.lastName}`} src={p.photoUrl} size={36} />
                        <span>
                          <strong>{p.firstName} {p.lastName}</strong>
                          <span>{[p.jobTitle, p.departmentName].filter(Boolean).join(' · ') || '—'}</span>
                        </span>
                      </div>
                      <div className="att-month__score">
                        <AdherenceRing value={p.adherence} />
                        <span>
                          <span className="att-month__pct">{p.adherence === null ? 'No days yet' : 'on time'}</span>
                          <AdherenceTrend current={p.adherence} previous={p.previousAdherence} />
                        </span>
                      </div>
                      <div className="att-month__bar">
                        <AdherenceBar data={p} />
                        <span className="att-month__figures">
                          {p.onTime} on time · {p.late} late · {p.absent} absent{p.onLeave > 0 && ` · ${p.onLeave} on leave`}
                          {p.flagged > 0 && <span className="att-month__flag"><Flag size={12} /> {p.flagged} flagged</span>}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </>
      )}
    </>
  );
}

// Daily register for the people the viewer can see
function Register() {
  const [date, setDate] = useState(todayString());
  const { data, loading, error } = useApi(`/api/attendance?date=${date}`);

  return (
    <>
      <div className="att__toolbar">
        <input type="date" className="field__input" value={date} max={todayString()} onChange={(e) => setDate(e.target.value)} aria-label="Date" />
        {data && (
          <div className="att__chips">
            <span className="att__chip att__chip--green">{data.summary.present} present</span>
            <span className="att__chip att__chip--amber">{data.summary.late} late</span>
            <span className="att__chip att__chip--blue">{data.summary.onLeave} on leave</span>
            <span className="att__chip att__chip--red">{data.summary.absent} absent</span>
            {data.summary.flagged > 0 && <span className="att__chip att__chip--red">{data.summary.flagged} flagged</span>}
          </div>
        )}
      </div>

      <div className="card">
        {loading && <div className="page-loader"><span className="page-loader__spinner" /></div>}
        {error && <p className="card__body">{error}</p>}
        {data && data.register.length === 0 && <EmptyState title="No employees to show" />}
        {data && data.register.length > 0 && (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr><th>Employee</th><th>Department</th><th>In</th><th>Out</th><th>Checks</th><th>Status</th></tr>
              </thead>
              <tbody>
                {data.register.map((r) => (
                  <tr key={r.employee_id}>
                    <td>
                      <Link to={`/employees/${r.employee_id}`} className="person">
                        <Avatar name={fullName(r)} src={r.photo_url} size={32} />
                        <span>
                          <strong>{fullName(r)}</strong>
                          <span>{r.job_title || '—'}</span>
                        </span>
                      </Link>
                    </td>
                    <td>{r.department_name || <span className="muted">—</span>}</td>
                    <td>{formatTime(r.clock_in_at)}</td>
                    <td>{formatTime(r.clock_out_at)}</td>
                    <td>
                      {r.attendance_id ? (
                        <span className="att__checks">
                          {r.location_ok !== null && (
                            <span className={r.location_ok ? 'ok' : 'bad'} title={r.distance_m !== null ? `${r.distance_m} m from office` : 'No location'}>
                              <MapPin size={14} />
                            </span>
                          )}
                          {r.wifi_ok !== null && (
                            <span className={r.wifi_ok ? 'ok' : 'bad'} title={`IP ${r.clock_in_ip}`}>
                              <Wifi size={14} />
                            </span>
                          )}
                          {r.location_ok === null && r.wifi_ok === null && <span className="muted">—</span>}
                        </span>
                      ) : (
                        <span className="muted">—</span>
                      )}
                    </td>
                    <td>
                      <Badge status={r.status}>{r.status === 'on_leave' ? r.leave_type : undefined}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

// Clock-ins that failed the location / Wi-Fi check.
// The employee gets 24 hours to give their side; then it is "ready" for a decision.
// Your own clock-ins never appear here.
function FlagRow({ r, onReview }) {
  const ready = r.stage === 'ready';
  const response = r.explanation_response || (ready ? 'no_response' : null);
  return (
    <li>
      <div className="person">
        <Avatar name={fullName(r)} size={36} />
        <span>
          <strong>{fullName(r)}</strong>
          <span>{formatDate(r.work_date)} at {formatTime(r.clock_in_at)} · {r.branch_name || 'No branch'}</span>
        </span>
      </div>
      <div className="att__flag-body">
        <p className="att__reason">{r.flag_reason}</p>
        {ready ? (
          <div className={`att__said att__said--${response}`}>
            <strong>{EXPLANATION_LABELS[response]}</strong>
            {r.explanation_reason && <p>“{r.explanation_reason}”</p>}
          </div>
        ) : (
          <p className="att__waiting">
            <Hourglass size={14} /> Waiting for {r.first_name} to explain · {timeLeft(r.explain_deadline) || 'any moment now'}
          </p>
        )}
      </div>
      {ready && (
        <div className="row-actions">
          <button type="button" className="btn btn--outline btn--sm" onClick={() => onReview({ record: r, decision: 'rejected' })}>
            <X size={16} /> Reject
          </button>
          <button type="button" className="btn btn--success btn--sm" onClick={() => onReview({ record: r, decision: 'approved' })}>
            <Check size={16} /> Approve
          </button>
        </div>
      )}
    </li>
  );
}

function Flagged({ onReviewed }) {
  const toast = useToast();
  const { data, loading, reload } = useApi('/api/attendance/flagged');
  const [review, setReview] = useState(null);

  const submit = async ({ decision, note }) => {
    try {
      await api(`/api/attendance/${review.record.id}/review`, { method: 'PATCH', body: { decision, note } });
      toast.success(decision === 'approved' ? 'Clock-in approved' : 'Clock-in rejected');
      reload();
      onReviewed?.();
    } catch (err) {
      toast.error(err.message);
      throw err;
    }
  };

  if (loading) return <div className="page-loader"><span className="page-loader__spinner" /></div>;
  if (!data?.length) {
    return (
      <div className="card">
        <EmptyState icon={ShieldCheck} title="Nothing to review" text="Clock-ins that fail the location or office Wi-Fi check will appear here once the employee has explained (or 24 hours pass)." />
      </div>
    );
  }

  const ready = data.filter((r) => r.stage === 'ready');
  const waiting = data.filter((r) => r.stage !== 'ready');

  return (
    <>
      <section className="card att__flag-group">
        <header className="card__header">
          <h2>Ready for your decision <span className="att__count">{ready.length}</span></h2>
        </header>
        {ready.length === 0 ? (
          <p className="card__body muted">Nothing yet — flags land here when the employee explains, or after 24 hours.</p>
        ) : (
          <ul className="att__flagged">{ready.map((r) => <FlagRow key={r.id} r={r} onReview={setReview} />)}</ul>
        )}
      </section>

      {waiting.length > 0 && (
        <section className="card att__flag-group">
          <header className="card__header">
            <h2>Waiting for the employee <span className="att__count">{waiting.length}</span></h2>
          </header>
          <ul className="att__flagged">{waiting.map((r) => <FlagRow key={r.id} r={r} />)}</ul>
        </section>
      )}

      {review && (
        <ReviewModal
          title={review.decision === 'approved' ? 'Approve clock-in' : 'Reject clock-in'}
          decision={review.decision}
          summary={
            review.decision === 'approved'
              ? `${fullName(review.record)} will count as present on ${formatDate(review.record.work_date)}.`
              : `${fullName(review.record)} will count as absent on ${formatDate(review.record.work_date)}.`
          }
          onSubmit={submit}
          onClose={() => setReview(null)}
        />
      )}
    </>
  );
}

export default function Attendance() {
  const { can, employee } = useAuth();
  const [params, setParams] = useSearchParams();
  const { data: flagged, reload: reloadFlagged } = useApi(can('attendance.review') ? '/api/attendance/flagged' : null);

  const tabs = [
    ...(employee ? [{ id: 'mine', label: 'My attendance' }] : []),
    ...(can('attendance.view') ? [{ id: 'register', label: 'Daily register' }, { id: 'monthly', label: 'Monthly' }] : []),
    ...(can('attendance.review') ? [{ id: 'flagged', label: 'Flagged', count: flagged?.filter((r) => r.stage === 'ready').length }] : []),
  ];
  const tab = tabs.some((t) => t.id === params.get('tab')) ? params.get('tab') : tabs[0]?.id;

  return (
    <>
      <PageHeader title="Attendance" subtitle="Clock in and out, and see who’s at work." />
      <Tabs tabs={tabs} active={tab} onChange={(id) => setParams({ tab: id })} />

      {tab === 'mine' && (
        <>
          <ClockCard />
          <h2 className="att__subheading">This month</h2>
          <MonthAttendance basePath="/api/me/attendance" />
        </>
      )}
      {tab === 'register' && <Register />}
      {tab === 'monthly' && <Monthly />}
      {tab === 'flagged' && <Flagged onReviewed={reloadFlagged} />}
      {!tabs.length && <EmptyState title="Your account isn’t linked to an employee profile" />}
    </>
  );
}
