import { CheckCircle2, ChevronLeft, ChevronRight, CircleDashed, Clock3, TriangleAlert } from 'lucide-react';
import Avatar from './Avatar.jsx';
import { formatDate, fullName } from '../utils/format.js';
import './StandupBoard.css';

// Same fixed person colours as the project board (names are always shown with them)
const PERSON_COLORS = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#6250d6', '#e34948'];

function TaskGroup({ icon: Icon, title, tasks, tone }) {
  if (!tasks.length) return null;
  return (
    <div className={`standup__group standup__group--${tone}`}>
      <h4><Icon size={14} /> {title} <span>{tasks.length}</span></h4>
      <ul>
        {tasks.map((t) => (
          <li key={t.id}>
            {t.project_color && <i style={{ background: t.project_color }} title={t.project_name} />}
            <span>{t.title}</span>
            {t.due_date && <small>{formatDate(t.due_date)}</small>}
          </li>
        ))}
      </ul>
    </div>
  );
}

// Stand-up: everyone's tasks, one person at a time ("focus") or all at once.
// focus = employee id being presented (null = everyone); onFocus changes it.
export default function StandupBoard({ data, focus, onFocus, compact }) {
  const people = data.people;
  const index = people.findIndex((p) => p.id === focus);
  const shown = focus ? people.filter((p) => p.id === focus) : people;
  const step = (n) => {
    const next = people[(Math.max(index, 0) + n + people.length) % people.length];
    onFocus?.(next.id);
  };

  return (
    <div className={`standup ${compact ? 'standup--compact' : ''}`}>
      <header className="standup__head">
        <div>
          <strong>Stand-up{data.projectName && ` · ${data.projectName}`}</strong>
          <small className="muted">Done since {formatDate(data.since)} · doing now · up next</small>
        </div>
        {onFocus && people.length > 1 && (
          <div className="standup__nav">
            <button type="button" className="icon-btn" onClick={() => step(-1)} aria-label="Previous person"><ChevronLeft size={18} /></button>
            <button type="button" className={`standup__all ${!focus ? 'is-on' : ''}`} onClick={() => onFocus(null)}>Everyone</button>
            <button type="button" className="icon-btn" onClick={() => step(1)} aria-label="Next person"><ChevronRight size={18} /></button>
          </div>
        )}
      </header>
      {onFocus && (
        <div className="standup__people">
          {people.map((p, i) => (
            <button key={p.id} type="button" className={`standup__chip ${focus === p.id ? 'is-on' : ''}`} style={{ '--person': PERSON_COLORS[i % PERSON_COLORS.length] }} onClick={() => onFocus(p.id)}>
              <Avatar name={fullName(p)} src={p.photo_url} size={22} />
              {p.first_name}
              {p.joined && <span className="standup__here" title="In the meeting" />}
            </button>
          ))}
        </div>
      )}
      <div className="standup__cards">
        {shown.map((p) => {
          const i = people.indexOf(p);
          const nothing = !p.done.length && !p.doing.length && !p.overdue.length && !p.upNext.length;
          return (
            <section key={p.id} className="standup__card" style={{ '--person': PERSON_COLORS[i % PERSON_COLORS.length] }}>
              <header>
                <Avatar name={fullName(p)} src={p.photo_url} size={30} />
                <strong>{fullName(p)}</strong>
                <span className="standup__counts">
                  <span title="Done">✓ {p.done.length}</span>
                  <span title="In progress">● {p.doing.length}</span>
                  {p.overdue.length > 0 && <span className="is-late" title="Overdue">! {p.overdue.length}</span>}
                </span>
              </header>
              {nothing && <p className="muted standup__none">No tasks to talk about.</p>}
              <TaskGroup icon={CheckCircle2} title="Done" tasks={p.done} tone="done" />
              <TaskGroup icon={Clock3} title="Doing" tasks={p.doing} tone="doing" />
              <TaskGroup icon={TriangleAlert} title="Overdue" tasks={p.overdue} tone="late" />
              <TaskGroup icon={CircleDashed} title="Up next" tasks={p.upNext} tone="next" />
            </section>
          );
        })}
      </div>
    </div>
  );
}
