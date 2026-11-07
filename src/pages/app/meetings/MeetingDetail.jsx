import { useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CalendarDays, CalendarX, Clock, Pencil, Repeat, RotateCcw, Trash2, Video } from 'lucide-react';
import EmptyState from '../../../components/EmptyState.jsx';
import Avatar from '../../../components/Avatar.jsx';
import MeetingModal from '../../../components/MeetingModal.jsx';
import StandupBoard from '../../../components/StandupBoard.jsx';
import { api } from '../../../api/client.js';
import { useApi } from '../../../hooks/useApi.js';
import { useToast } from '../../../context/ToastContext.jsx';
import { formatDate, fullName, todayString } from '../../../utils/format.js';
import { JoinButton } from './Meetings.jsx';
import './Meetings.css';

export default function MeetingDetail() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { data, setData, error } = useApi(`/api/meetings/${id}`);
  const date = params.get('date') || data?.nextDate;
  const { data: standup } = useApi(data?.is_standup && date ? `/api/meetings/${id}/standup?date=${date}` : null);
  const [editing, setEditing] = useState(false);

  if (error)
    return (
      <div className="meet">
        <EmptyState icon={Video} title="Meeting not found" text="It may have been cancelled, or you’re not invited." />
      </div>
    );
  if (!data)
    return (
      <div className="page-loader">
        <span className="page-loader__spinner" />
      </div>
    );

  const cancel = async () => {
    if (!window.confirm(`Cancel “${data.title}”${data.repeat_rule !== 'none' ? ' — every date' : ''}? Everyone invited is told.`)) return;
    try {
      await api(`/api/meetings/${data.id}`, { method: 'DELETE' });
      toast.success('Meeting cancelled');
      navigate('/meetings');
    } catch (err) {
      toast.error(err.message);
    }
  };

  // This date's start time (weekly meetings can start at a different time each day)
  const timeFor = (d) => data.upcoming.find((u) => u.date === d)?.time || String(data.starts_at).slice(11, 16);
  const occ = date && {
    meetingId: data.id,
    date,
    startsAt: `${date} ${timeFor(date)}`,
    durationMinutes: data.duration_minutes,
  };
  const repeats = data.repeat_rule !== 'none';

  const skip = async (d, off) => {
    if (off && !window.confirm(`Cancel ${data.title} on ${formatDate(d)} only? Everyone invited is told; the other dates stay.`)) return;
    try {
      const updated = await api(
        off ? `/api/meetings/${data.id}/skip` : `/api/meetings/${data.id}/skip?date=${d}`,
        off ? { method: 'POST', body: { date: d } } : { method: 'DELETE' }
      );
      setData(updated);
      toast.success(off ? `${formatDate(d)} cancelled` : `${formatDate(d)} is back on`);
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="meet meet-detail">
      <Link to="/meetings" className="link-btn res__back">
        <ArrowLeft size={16} /> Meetings
      </Link>
      <header className="card meet-detail__head">
        <div>
          <h1>{data.title}</h1>
          <p className="meet-detail__facts">
            <span>
              <CalendarDays size={15} /> {date ? formatDate(date) : 'No more dates'}
            </span>
            <span>
              <Clock size={15} /> {date ? timeFor(date) : String(data.starts_at).slice(11, 16)} · {data.duration_minutes} min
            </span>
            {repeats && (
              <span>
                <Repeat size={15} /> {data.repeatText}
                {data.repeat_until && ` until ${formatDate(data.repeat_until)}`}
              </span>
            )}
          </p>
          <p className="muted">
            {data.audience_name ? `For ${data.audience_name}` : 'For invited people'} · set up by {data.created_by_name}
            {data.project_name && (
              <>
                {' '}
                · project <Link to={`/projects/${data.project_id}`}>{data.project_name}</Link>
              </>
            )}
          </p>
          {data.description && <p className="meet-detail__agenda">{data.description}</p>}
        </div>
        <div className="row-actions">
          {occ && <JoinButton occ={occ} />}
          {data.canEdit && (
            <button type="button" className="btn btn--outline" onClick={() => setEditing(true)}>
              <Pencil size={16} /> Edit
            </button>
          )}
          {data.canEdit && (
            <button type="button" className="icon-btn" onClick={cancel} aria-label="Cancel meeting">
              <Trash2 size={18} />
            </button>
          )}
        </div>
        {!data.videoReady && <p className="meet-detail__warn">Video isn’t switched on for this Workard yet — ask the admin to add the LiveKit keys.</p>}
      </header>

      <div className="meet-detail__body">
        <div className="meet-detail__side">
          <section className="card">
            <header className="card__header">
              <h2>People ({data.people.length})</h2>
            </header>
            <ul className="meet-detail__people">
              {data.people.map((p) => (
                <li key={p.id} className="person">
                  <Avatar name={fullName(p)} src={p.photo_url} size={30} />
                  <span>
                    <strong>{fullName(p)}</strong>
                  </span>
                </li>
              ))}
            </ul>
          </section>
          {repeats && (
            <section className="card">
              <header className="card__header">
                <h2>Coming up</h2>
              </header>
              <ul className="meet-dates">
                {data.upcoming.map((u) => (
                  <li key={u.date} className={u.date === date ? 'is-current' : ''}>
                    <Link to={`/meetings/${data.id}?date=${u.date}`}>
                      {formatDate(u.date)} · {u.time}
                    </Link>
                    {data.canEdit && (
                      <button type="button" className="link-btn meet-dates__skip" onClick={() => skip(u.date, true)}>
                        <CalendarX size={14} /> Cancel this date
                      </button>
                    )}
                  </li>
                ))}
                {data.skippedDates
                  ?.filter((d) => d >= todayString())
                  .map((d) => (
                    <li key={d} className="is-skipped">
                      <span>
                        <s>{formatDate(d)}</s> · cancelled
                      </span>
                      {data.canEdit && (
                        <button type="button" className="link-btn meet-dates__skip" onClick={() => skip(d, false)}>
                          <RotateCcw size={14} /> Bring back
                        </button>
                      )}
                    </li>
                  ))}
              </ul>
            </section>
          )}
        </div>
        {standup && (
          <section className="card card__body">
            <StandupBoard data={standup} />
          </section>
        )}
      </div>
      {editing && (
        <MeetingModal
          meeting={data}
          onClose={() => setEditing(false)}
          onSaved={(m) => {
            setData(m);
            setEditing(false);
          }}
        />
      )}
    </div>
  );
}
