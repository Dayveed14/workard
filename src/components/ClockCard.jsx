import { useEffect, useState } from 'react';
import { AlertTriangle, LogIn, LogOut, MapPin, MessageSquare, Wifi } from 'lucide-react';
import ExplainModal from './ExplainModal.jsx';
import { api } from '../api/client.js';
import { useApi } from '../hooks/useApi.js';
import { useToast } from '../context/ToastContext.jsx';
import { explainDeadline, formatDate, formatHours, formatTime, shortTime, timeLeft } from '../utils/format.js';
import './ClockCard.css';

// Asks the browser for the device location. Resolves with null if refused or unavailable.
function getLocation() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy),
        }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  });
}

export default function ClockCard({ onChange }) {
  const toast = useToast();
  const { data, loading, error, reload } = useApi('/api/me/attendance/today');
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(new Date());
  const [explaining, setExplaining] = useState(null); // the record being explained

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  if (loading) return <div className="clock-card clock-card--loading" />;
  if (error) {
    return (
      <div className="clock-card">
        <p className="muted">{error}</p>
      </div>
    );
  }

  const { record, branch, toExplain = [] } = data;
  // Older flags (e.g. yesterday's) still waiting for the employee's side
  const olderToExplain = toExplain.filter((r) => r.id !== record?.id);
  const todayLeft = record?.review_status === 'pending' ? timeLeft(explainDeadline(record), now) : null;

  const clockIn = async () => {
    setBusy(true);
    try {
      const coords = branch?.needsLocation ? await getLocation() : null;
      if (branch?.needsLocation && !coords) {
        toast.error('Location was not shared — your clock-in will be flagged for review.');
      }
      const res = await api('/api/me/attendance/clock-in', { method: 'POST', body: coords || {} });
      res.record.is_flagged ? toast.error(res.message) : toast.success(res.message);
      await reload();
      onChange?.();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const clockOut = async () => {
    setBusy(true);
    try {
      const res = await api('/api/me/attendance/clock-out', { method: 'POST' });
      toast.success(res.message);
      await reload();
      onChange?.();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const workedSoFar = record && !record.clock_out_at
    ? Math.round((now - new Date(record.clock_in_at.replace(' ', 'T'))) / 60000)
    : record?.minutes_worked;

  return (
    <>
    <div className="clock-card">
      <div className="clock-card__time">
        <span>{now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
        <strong>{now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</strong>
        {branch && (
          <small>
            {branch.name} · {shortTime(branch.workStart)}–{shortTime(branch.workEnd)}
          </small>
        )}
      </div>

      <div className="clock-card__status">
        {!record && <p>You haven’t clocked in today.</p>}
        {record && (
          <ul>
            <li>
              <span>Clocked in</span>
              <strong>
                {formatTime(record.clock_in_at)} {record.is_late ? <em className="clock-card__late">Late</em> : null}
              </strong>
            </li>
            <li>
              <span>Clocked out</span>
              <strong>{record.clock_out_at ? formatTime(record.clock_out_at) : '—'}</strong>
            </li>
            <li>
              <span>{record.clock_out_at ? 'Worked' : 'So far'}</span>
              <strong>{formatHours(workedSoFar)}</strong>
            </li>
          </ul>
        )}
        {record?.review_status === 'pending' && (
          <div className="clock-card__flag">
            <AlertTriangle size={16} />
            <div>
              <p>Flagged for review: {record.flag_reason}</p>
              {record.explanation_response ? (
                <p className="clock-card__said">
                  You {record.explanation_response === 'dispute' ? 'disputed it' : 'explained'}: “{record.explanation_reason}” — waiting for your manager.
                </p>
              ) : todayLeft ? (
                <button type="button" className="clock-card__explain" onClick={() => setExplaining(record)}>
                  <MessageSquare size={14} /> Explain · {todayLeft}
                </button>
              ) : (
                <p className="clock-card__said">Sent to your manager without your explanation.</p>
              )}
            </div>
          </div>
        )}
        {record?.is_late === 1 && !record.is_flagged && (
          record.explanation_reason ? (
            <p className="clock-card__note">Your reason for being late: “{record.explanation_reason}”</p>
          ) : (
            <button type="button" className="clock-card__explain clock-card__explain--quiet" onClick={() => setExplaining(record)}>
              <MessageSquare size={14} /> Add a reason for being late
            </button>
          )
        )}
        {olderToExplain.map((r) => (
          <div key={r.id} className="clock-card__flag">
            <AlertTriangle size={16} />
            <div>
              <p>Your clock-in on {formatDate(r.work_date)} was flagged: {r.flag_reason}</p>
              <button type="button" className="clock-card__explain" onClick={() => setExplaining(r)}>
                <MessageSquare size={14} /> Explain · {timeLeft(r.explain_deadline, now) || 'time’s up'}
              </button>
            </div>
          </div>
        ))}
        {record?.review_status === 'rejected' && (
          <p className="clock-card__flag">
            <AlertTriangle size={16} /> Clock-in rejected{record.review_note ? `: ${record.review_note}` : ''}
          </p>
        )}
      </div>

      <div className="clock-card__action">
        {!record && (
          <button type="button" className="btn btn--success btn--lg btn--block" onClick={clockIn} disabled={busy}>
            <LogIn size={18} /> {busy ? 'Checking…' : 'Clock in'}
          </button>
        )}
        {record && !record.clock_out_at && (
          <button type="button" className="btn btn--outline btn--lg btn--block" onClick={clockOut} disabled={busy}>
            <LogOut size={18} /> Clock out
          </button>
        )}
        {record?.clock_out_at && <p className="clock-card__done">Done for today 👋</p>}
        {branch && branch.policy !== 'none' && branch.policy !== undefined && !record && (
          <p className="clock-card__checks">
            <span>Verified by</span>
            {['location', 'either', 'both'].includes(branch.policy) && (
              <span>
                <MapPin size={14} /> Location
              </span>
            )}
            {['wifi', 'either', 'both'].includes(branch.policy) && (
              <span>
                <Wifi size={14} /> Office Wi-Fi
              </span>
            )}
          </p>
        )}
      </div>
    </div>
    {/* Outside the dark card so the modal keeps its normal colours */}
    {explaining && (
      <ExplainModal
        record={explaining}
        onDone={() => { reload(); onChange?.(); }}
        onClose={() => setExplaining(null)}
      />
    )}
    </>
  );
}
