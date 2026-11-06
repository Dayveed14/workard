import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CalendarDays, ChevronLeft, ChevronRight, Plus, Video } from 'lucide-react';
import PageHeader from '../../../components/PageHeader.jsx';
import EmptyState from '../../../components/EmptyState.jsx';
import MeetingModal from '../../../components/MeetingModal.jsx';
import { useApi } from '../../../hooks/useApi.js';
import { formatDate, todayString } from '../../../utils/format.js';
import { joinState, hhmm } from './meetingTime.js';
import './Meetings.css';

const iso = (d) => d.toLocaleDateString('en-CA');
const addDays = (date, n) => { const d = new Date(`${date}T12:00:00`); d.setDate(d.getDate() + n); return iso(d); };

function JoinButton({ occ, small }) {
  const navigate = useNavigate();
  const s = joinState(occ);
  if (s.state === 'over') return <span className="muted meet__ended">Ended</span>;
  if (s.state === 'later') return small ? null : <span className="muted">Opens at {hhmm(new Date(s.start.getTime() - 15 * 60_000))}</span>;
  return (
    <button type="button" className={`btn btn--success ${small ? 'btn--sm' : ''}`} onClick={() => navigate(`/meetings/${occ.meetingId}/room?date=${occ.date}`)}>
      <Video size={15} /> {s.state === 'live' ? 'Join now' : 'Join'}
    </button>
  );
}

// A month of meetings: a dot + title per meeting, today highlighted
function MonthCalendar({ month, setMonth, items }) {
  const first = new Date(`${month}-01T12:00:00`);
  const start = addDays(iso(first), -((first.getDay() + 6) % 7)); // Monday first
  const days = Array.from({ length: 42 }, (_, i) => addDays(start, i));
  const today = todayString();
  const label = first.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  const shift = (n) => { const d = new Date(first); d.setMonth(d.getMonth() + n); setMonth(iso(d).slice(0, 7)); };

  return (
    <section className="card meet-cal">
      <header className="meet-cal__head">
        <button type="button" className="icon-btn" onClick={() => shift(-1)} aria-label="Previous month"><ChevronLeft size={18} /></button>
        <h2>{label}</h2>
        <button type="button" className="icon-btn" onClick={() => shift(1)} aria-label="Next month"><ChevronRight size={18} /></button>
      </header>
      <div className="meet-cal__grid" role="grid">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => <span key={d} className="meet-cal__dow">{d}</span>)}
        {days.map((d) => {
          const list = items.filter((m) => m.date === d);
          return (
            <div key={d} className={`meet-cal__day ${d.slice(0, 7) !== month ? 'is-out' : ''} ${d === today ? 'is-today' : ''}`}>
              <span className="meet-cal__num">{Number(d.slice(8))}</span>
              {list.slice(0, 3).map((m) => (
                <Link key={`${m.meetingId}-${m.date}`} to={`/meetings/${m.meetingId}?date=${m.date}`} className={`meet-cal__item ${m.isStandup ? 'is-standup' : ''}`} title={`${m.startsAt.slice(11, 16)} ${m.title}`}>
                  {m.startsAt.slice(11, 16)} {m.title}
                </Link>
              ))}
              {list.length > 3 && <span className="meet-cal__more">+{list.length - 3} more</span>}
            </div>
          );
        })}
      </div>
    </section>
  );
}

// Meetings: upcoming list + month calendar
export default function Meetings() {
  const navigate = useNavigate();
  const today = todayString();
  const [month, setMonth] = useState(today.slice(0, 7));
  const [scheduling, setScheduling] = useState(false);
  const { data: upcoming } = useApi(`/api/meetings?from=${today}&to=${addDays(today, 6)}`);
  const calFrom = addDays(`${month}-01`, -7);
  const { data: cal } = useApi(`/api/meetings?from=${calFrom}&to=${addDays(`${month}-01`, 42)}`);

  const byDay = useMemo(() => {
    const map = new Map();
    for (const m of upcoming || []) {
      if (joinState(m).state === 'over') continue;
      if (!map.has(m.date)) map.set(m.date, []);
      map.get(m.date).push(m);
    }
    return [...map.entries()];
  }, [upcoming]);

  const dayLabel = (d) => (d === today ? 'Today' : d === addDays(today, 1) ? 'Tomorrow' : formatDate(d));

  return (
    <div className="meet">
      <PageHeader
        title="Meetings"
        subtitle="Stand-ups, team and company meetings — join by video right here."
        actions={<button type="button" className="btn btn--primary" onClick={() => setScheduling(true)}><Plus size={16} /> Schedule meeting</button>}
      />
      <div className="meet__layout">
        <section className="card meet-up">
          <header className="card__header"><h2><CalendarDays size={18} /> Next 7 days</h2></header>
          {!upcoming && <div className="page-loader"><span className="page-loader__spinner" /></div>}
          {upcoming && byDay.length === 0 && <EmptyState icon={Video} title="No meetings coming up" text="Meetings you’re invited to — or your team’s — show here." />}
          {byDay.map(([date, list]) => (
            <div key={date} className="meet-up__day">
              <h3>{dayLabel(date)}</h3>
              <ul>
                {list.map((m) => (
                  <li key={`${m.meetingId}-${m.date}`}>
                    <Link to={`/meetings/${m.meetingId}?date=${m.date}`} className="meet-up__item">
                      <span className="meet-up__time">{m.startsAt.slice(11, 16)}</span>
                      <span className="meet-up__text">
                        <strong>{m.title}</strong>
                        <small className="muted">
                          {m.audienceName || 'Invited people'} · {m.durationMinutes} min
                          {m.isStandup ? ' · stand-up' : m.repeat !== 'none' ? ' · repeats' : ''}
                        </small>
                      </span>
                    </Link>
                    <JoinButton occ={m} small />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
        <MonthCalendar month={month} setMonth={setMonth} items={cal || []} />
      </div>
      {scheduling && <MeetingModal onClose={() => setScheduling(false)} onSaved={(m) => navigate(`/meetings/${m.id}`)} />}
    </div>
  );
}

export { JoinButton };
