import { useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CalendarDays, Clock, Pencil, Repeat, Trash2, Video } from 'lucide-react';
import EmptyState from '../../../components/EmptyState.jsx';
import Avatar from '../../../components/Avatar.jsx';
import MeetingModal, { REPEAT_LABELS } from '../../../components/MeetingModal.jsx';
import StandupBoard from '../../../components/StandupBoard.jsx';
import { api } from '../../../api/client.js';
import { useApi } from '../../../hooks/useApi.js';
import { useToast } from '../../../context/ToastContext.jsx';
import { formatDate, fullName } from '../../../utils/format.js';
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

  if (error) return <div className="meet"><EmptyState icon={Video} title="Meeting not found" text="It may have been cancelled, or you’re not invited." /></div>;
  if (!data) return <div className="page-loader"><span className="page-loader__spinner" /></div>;

  const cancel = async () => {
    if (!window.confirm(`Cancel “${data.title}”${data.repeat_rule !== 'none' ? ' (every date)' : ''}? Everyone invited is told.`)) return;
    try {
      await api(`/api/meetings/${data.id}`, { method: 'DELETE' });
      toast.success('Meeting cancelled');
      navigate('/meetings');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const occ = date && { meetingId: data.id, date, startsAt: `${date} ${String(data.starts_at).slice(11, 16)}`, durationMinutes: data.duration_minutes };

  return (
    <div className="meet meet-detail">
      <Link to="/meetings" className="link-btn res__back"><ArrowLeft size={16} /> Meetings</Link>
      <header className="card meet-detail__head">
        <div>
          <h1>{data.title}</h1>
          <p className="meet-detail__facts">
            <span><CalendarDays size={15} /> {date ? formatDate(date) : 'No more dates'}</span>
            <span><Clock size={15} /> {String(data.starts_at).slice(11, 16)} · {data.duration_minutes} min</span>
            {data.repeat_rule !== 'none' && <span><Repeat size={15} /> {REPEAT_LABELS[data.repeat_rule]}{data.repeat_until && ` until ${formatDate(data.repeat_until)}`}</span>}
          </p>
          <p className="muted">
            {data.audience_name ? `For ${data.audience_name}` : 'For invited people'} · set up by {data.created_by_name}
            {data.project_name && <> · project <Link to={`/projects/${data.project_id}`}>{data.project_name}</Link></>}
          </p>
          {data.description && <p className="meet-detail__agenda">{data.description}</p>}
        </div>
        <div className="row-actions">
          {occ && <JoinButton occ={occ} />}
          {data.canEdit && <button type="button" className="btn btn--outline" onClick={() => setEditing(true)}><Pencil size={16} /> Edit</button>}
          {data.canEdit && <button type="button" className="icon-btn" onClick={cancel} aria-label="Cancel meeting"><Trash2 size={18} /></button>}
        </div>
        {!data.videoReady && <p className="meet-detail__warn">Video isn’t switched on for this Workard yet — ask the admin to add the LiveKit keys.</p>}
      </header>

      <div className="meet-detail__body">
        <section className="card">
          <header className="card__header"><h2>People ({data.people.length})</h2></header>
          <ul className="meet-detail__people">
            {data.people.map((p) => (
              <li key={p.id} className="person">
                <Avatar name={fullName(p)} src={p.photo_url} size={30} />
                <span><strong>{fullName(p)}</strong></span>
              </li>
            ))}
          </ul>
        </section>
        {standup && (
          <section className="card card__body">
            <StandupBoard data={standup} />
          </section>
        )}
      </div>
      {editing && <MeetingModal meeting={data} onClose={() => setEditing(false)} onSaved={(m) => { setData(m); setEditing(false); }} />}
    </div>
  );
}
