import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarDays, Columns3, Pencil, Plus, Trash2, Users, Video } from 'lucide-react';
import EmptyState from '../../../components/EmptyState.jsx';
import Avatar from '../../../components/Avatar.jsx';
import AvatarStack from '../../../components/AvatarStack.jsx';
import TaskModal from '../../../components/TaskModal.jsx';
import MeetingModal from '../../../components/MeetingModal.jsx';
import { api } from '../../../api/client.js';
import { useApi } from '../../../hooks/useApi.js';
import { useToast } from '../../../context/ToastContext.jsx';
import { formatDate, fullName } from '../../../utils/format.js';
import { ProjectModal, ProgressBar } from './Projects.jsx';
import './Projects.css';

const COLUMNS = [
  { id: 'todo', label: 'To do' },
  { id: 'in_progress', label: 'In progress' },
  { id: 'done', label: 'Done' },
];

// Each person gets a colour (fixed order, by name) — their name is always shown beside it
const PERSON_COLORS = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#6250d6', '#e34948'];

const isLate = (t) => t.status !== 'done' && t.due_date && t.due_date < new Date().toISOString().slice(0, 10);

function TaskCard({ task, colorOf, onMove }) {
  const navigate = useNavigate();
  const lead = task.assignees[0];
  return (
    <li className="board-card" style={{ '--person': colorOf(lead?.id) }} onClick={() => navigate(`/tasks/${task.id}`)}>
      <strong>{task.title}</strong>
      <span className="board-card__meta">
        <AvatarStack people={task.assignees} size={20} showNames />
        {task.due_date && <span className={isLate(task) ? 'board-card__late' : ''}><CalendarDays size={12} /> {formatDate(task.due_date)}</span>}
      </span>
      {onMove && (
        <span className="board-card__move" onClick={(e) => e.stopPropagation()}>
          {COLUMNS.filter((c) => c.id !== task.status).map((c) => (
            <button key={c.id} type="button" onClick={() => onMove(task, c.id)}>→ {c.label}</button>
          ))}
        </span>
      )}
    </li>
  );
}

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { data, reload, error } = useApi(`/api/projects/${id}`);
  const { data: groups } = useApi('/api/projects/groups');
  const [view, setView] = useState('board');
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(false);
  const [meeting, setMeeting] = useState(false);

  // Colour per person, in a fixed order (by name)
  const colorOf = useMemo(() => {
    const order = (data?.people || []).map((p) => p.id);
    return (personId) => PERSON_COLORS[Math.max(0, order.indexOf(personId)) % PERSON_COLORS.length];
  }, [data]);

  if (error) return <div className="proj"><EmptyState title="Project not found" text="It may have been removed, or it isn’t shared with you." /></div>;
  if (!data) return <div className="page-loader"><span className="page-loader__spinner" /></div>;

  const tasks = data.tasks.filter((t) => t.status !== 'cancelled');
  const move = async (task, status) => {
    try {
      await api(`/api/tasks/${task.id}/status`, { method: 'PATCH', body: { status } });
      reload();
    } catch (err) {
      toast.error(err.message);
    }
  };
  const remove = async () => {
    if (!window.confirm(`Delete “${data.name}”? Its tasks are kept.`)) return;
    await api(`/api/projects/${data.id}`, { method: 'DELETE' });
    navigate('/projects');
  };

  return (
    <div className="proj proj-detail" style={{ '--project': data.color }}>
      <Link to="/projects" className="link-btn res__back"><ArrowLeft size={16} /> Projects</Link>
      <header className="proj-detail__head card">
        <div>
          <h1>{data.name}</h1>
          <p className="muted">
            {data.audience_name}{data.due_date && ` · finish by ${formatDate(data.due_date)}`}{data.status !== 'active' && ` · ${data.status}`}
          </p>
          {data.description && <p>{data.description}</p>}
        </div>
        <div className="proj-detail__progress">
          <ProgressBar done={Number(data.task_done)} total={Number(data.task_total)} color={data.color} />
          <span className="muted">{data.task_done} of {data.task_total} tasks done{Number(data.task_overdue) > 0 && ` · ${data.task_overdue} overdue`}</span>
        </div>
        <div className="row-actions">
          <button type="button" className="btn btn--primary" onClick={() => setAdding(true)}><Plus size={16} /> Add task</button>
          <button type="button" className="btn btn--outline" onClick={() => setMeeting(true)}><Video size={16} /> Schedule stand-up</button>
          {data.canManage && <button type="button" className="btn btn--outline" onClick={() => setEditing(true)}><Pencil size={16} /> Edit</button>}
          {data.canManage && <button type="button" className="icon-btn" onClick={remove} aria-label="Delete project"><Trash2 size={18} /></button>}
        </div>
      </header>

      <div className="res__chips proj__filter">
        <button type="button" className={view === 'board' ? 'is-on' : ''} onClick={() => setView('board')}><Columns3 size={14} /> Board</button>
        <button type="button" className={view === 'people' ? 'is-on' : ''} onClick={() => setView('people')}><Users size={14} /> By person</button>
      </div>

      {tasks.length === 0 && <div className="card"><EmptyState title="No tasks yet" text="Add the first task — you can put several people on one task." /></div>}

      {tasks.length > 0 && view === 'board' && (
        <div className="board">
          {COLUMNS.map((col) => {
            const list = tasks.filter((t) => t.status === col.id);
            return (
              <section key={col.id} className={`board__col board__col--${col.id}`}>
                <h2>{col.label} <span className="att__count">{list.length}</span></h2>
                <ul>{list.map((t) => <TaskCard key={t.id} task={t} colorOf={colorOf} onMove={move} />)}</ul>
              </section>
            );
          })}
        </div>
      )}

      {tasks.length > 0 && view === 'people' && (
        <div className="lanes">
          {data.people.filter((p) => p.todo + p.in_progress + p.done > 0).map((p) => {
            const mine = tasks.filter((t) => t.assignees.some((a) => a.id === p.id));
            const total = p.todo + p.in_progress + p.done;
            return (
              <section key={p.id} className="lane card" style={{ '--person': colorOf(p.id) }}>
                <header className="lane__head">
                  <Avatar name={fullName(p)} src={p.photo_url} size={36} />
                  <div>
                    <strong>{fullName(p)}</strong>
                    <span className="muted">{p.done}/{total} done{p.overdue > 0 && ` · ${p.overdue} overdue`}</span>
                  </div>
                  <ProgressBar done={p.done} total={total} color={colorOf(p.id)} />
                </header>
                <ul className="lane__tasks">
                  {mine.map((t) => (
                    <li key={t.id} className={`lane__task lane__task--${t.status}`} onClick={() => navigate(`/tasks/${t.id}`)}>
                      <span className="lane__status">{COLUMNS.find((c) => c.id === t.status)?.label}</span>
                      <span className="lane__title">{t.title}</span>
                      {t.assignees.length > 1 && <AvatarStack people={t.assignees.filter((a) => a.id !== p.id)} size={18} />}
                      {t.due_date && <span className={`lane__due ${isLate(t) ? 'board-card__late' : ''}`}>{formatDate(t.due_date)}</span>}
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}

      {meeting && (
        <MeetingModal
          preset={{
            title: `${data.name} stand-up`,
            group: `${data.audience_type}:${data.audience_id ?? ''}`,
            projectId: data.id,
            isStandup: true,
            repeat: 'weekdays',
            time: '09:00',
            durationMinutes: 15,
            inviteeIds: data.people.map((p) => p.id),
          }}
          onClose={() => setMeeting(false)}
          onSaved={(m) => navigate(`/meetings/${m.id}`)}
        />
      )}
      {adding && <TaskModal task={null} projectId={data.id} onClose={() => setAdding(false)} onSaved={reload} />}
      {editing && <ProjectModal project={data} groups={groups || []} onClose={() => setEditing(false)} onSaved={() => { setEditing(false); reload(); }} />}
    </div>
  );
}
