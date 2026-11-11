import { useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Ban, Check, Paperclip, Pencil, Play, Plus, RotateCcw, Trash2, X } from 'lucide-react';
import Badge from '../../../components/Badge.jsx';
import Avatar from '../../../components/Avatar.jsx';
import EmptyState from '../../../components/EmptyState.jsx';
import TaskModal from '../../../components/TaskModal.jsx';
import CommentBox, { CommentText } from './CommentBox.jsx';
import { api } from '../../../api/client.js';
import { useApi } from '../../../hooks/useApi.js';
import { useToast } from '../../../context/ToastContext.jsx';
import { TASK_PRIORITIES, TASK_STATUSES, dueLabel, formatDate, formatDateTime } from '../../../utils/format.js';
import './TaskDetail.css';

export default function TaskDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { data: task, loading, error, setData, reload } = useApi(`/api/tasks/${id}`);
  const [editing, setEditing] = useState(false);
  const [newItem, setNewItem] = useState('');
  const [busy, setBusy] = useState(false);
  const fileInput = useRef(null);

  if (loading && !task) return <div className="page-loader"><span className="page-loader__spinner" /></div>;
  if (error) return <EmptyState title="Task not available" text={error} action={<Link to="/tasks" className="btn btn--outline">Back to tasks</Link>} />;

  // Runs an API call, then updates part of the task with the result
  const run = async (fn, merge, message) => {
    setBusy(true);
    try {
      const result = await fn();
      setData((t) => merge(t, result));
      if (message) toast.success(message);
      return true;
    } catch (err) {
      toast.error(err.message);
      return false;
    } finally {
      setBusy(false);
    }
  };

  const setStatus = (status, message) =>
    run(() => api(`/api/tasks/${id}/status`, { method: 'PATCH', body: { status } }), (_, t) => t, message);

  // Ticks straight away (feels instant on slow networks), then saves; undone if saving fails
  const toggleItem = async (item) => {
    const isDone = !item.is_done;
    setData((t) => ({ ...t, checklist: t.checklist.map((c) => (c.id === item.id ? { ...c, is_done: isDone ? 1 : 0 } : c)) }));
    try {
      await api(`/api/tasks/checklist/${item.id}`, { method: 'PATCH', body: { isDone } });
    } catch (err) {
      toast.error(err.message);
      reload();
    }
  };

  const removeItem = (item) =>
    run(() => api(`/api/tasks/checklist/${item.id}`, { method: 'DELETE' }), (t, checklist) => ({ ...t, checklist }));

  const addItem = async (e) => {
    e.preventDefault();
    if (!newItem.trim()) return;
    const ok = await run(
      () => api(`/api/tasks/${id}/checklist`, { method: 'POST', body: { text: newItem.trim() } }),
      (t, checklist) => ({ ...t, checklist })
    );
    if (ok) setNewItem('');
  };

  const addComment = ({ body, mentionUserIds }) =>
    run(
      () => api(`/api/tasks/${id}/comments`, { method: 'POST', body: { body, mentionUserIds } }),
      (t, comments) => ({ ...t, comments })
    );

  const upload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    await run(() => api(`/api/tasks/${id}/attachments`, { method: 'POST', formData: fd }), (t, attachments) => ({ ...t, attachments }), 'File added');
    e.target.value = '';
  };

  const removeFile = (a) =>
    window.confirm(`Remove ${a.file_name}?`) &&
    run(() => api(`/api/tasks/attachments/${a.id}`, { method: 'DELETE' }), (t, attachments) => ({ ...t, attachments }));

  const remove = async () => {
    if (!window.confirm('Delete this task for good?')) return;
    try {
      await api(`/api/tasks/${id}`, { method: 'DELETE' });
      toast.success('Task deleted');
      navigate('/tasks');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const open = task.status === 'todo' || task.status === 'in_progress';
  const due = dueLabel(task.due_date, task.status);
  const doneCount = task.checklist.filter((c) => c.is_done).length;

  return (
    <div className="task-detail">
      <div className="task-detail__bar">
        <Link to="/tasks" className="link-btn"><ArrowLeft size={16} /> Tasks</Link>
      </div>

      <div className="task-detail__layout">
        <div className="task-detail__main">
          <section className="card card__body">
            <div className="task-detail__title">
              <h1>{task.title}</h1>
              <Badge status={task.status}>{TASK_STATUSES[task.status]}</Badge>
            </div>

            <div className="task-detail__actions">
              {task.canWork && task.status === 'todo' && (
                <button type="button" className="btn btn--outline btn--sm" disabled={busy} onClick={() => setStatus('in_progress', 'Started')}>
                  <Play size={16} /> Start
                </button>
              )}
              {task.canWork && open && (
                <button type="button" className="btn btn--success btn--sm" disabled={busy} onClick={() => setStatus('done', 'Done — nice work')}>
                  <Check size={16} /> Mark done
                </button>
              )}
              {task.canWork && !open && (
                <button type="button" className="btn btn--outline btn--sm" disabled={busy} onClick={() => setStatus('todo', 'Task reopened')}>
                  <RotateCcw size={16} /> Reopen
                </button>
              )}
              {task.canManage && (
                <>
                  <button type="button" className="btn btn--outline btn--sm" onClick={() => setEditing(true)}><Pencil size={16} /> Edit</button>
                  {open && (
                    <button type="button" className="btn btn--ghost btn--sm" disabled={busy} onClick={() => setStatus('cancelled', 'Task cancelled')}>
                      <Ban size={16} /> Cancel task
                    </button>
                  )}
                  <button type="button" className="btn btn--ghost btn--sm task-detail__danger" onClick={remove}><Trash2 size={16} /> Delete</button>
                </>
              )}
            </div>

            {task.description ? <p className="task-detail__description">{task.description}</p> : <p className="muted">No details added.</p>}
          </section>

          <section className="card">
            <header className="card__header">
              <h2>Checklist {task.checklist.length > 0 && <span className="muted">{doneCount}/{task.checklist.length}</span>}</h2>
            </header>
            {task.checklist.length > 0 && (
              <div className="task-detail__progress" aria-hidden="true">
                <span style={{ width: `${(doneCount / task.checklist.length) * 100}%` }} />
              </div>
            )}
            <ul className="task-detail__checklist">
              {task.checklist.map((item) => (
                <li key={item.id} className={item.is_done ? 'is-done' : ''}>
                  <label>
                    <input type="checkbox" checked={!!item.is_done} disabled={!task.canWork} onChange={() => toggleItem(item)} />
                    <span>{item.text}</span>
                  </label>
                  {task.canWork && (
                    <button type="button" className="icon-btn" onClick={() => removeItem(item)} aria-label={`Remove ${item.text}`}><X size={14} /></button>
                  )}
                </li>
              ))}
            </ul>
            {task.canWork && (
              <form className="task-detail__add" onSubmit={addItem}>
                <input className="field__input" placeholder="Add a step" value={newItem} onChange={(e) => setNewItem(e.target.value)} aria-label="New checklist step" />
                <button type="submit" className="btn btn--outline btn--sm" disabled={!newItem.trim()}><Plus size={16} /> Add</button>
              </form>
            )}
          </section>

          <section className="card">
            <header className="card__header"><h2>Comments</h2></header>
            <ul className="task-detail__comments">
              {task.comments.length === 0 && <li className="muted">No comments yet — ask a question or post an update.</li>}
              {task.comments.map((c) => (
                <li key={c.id}>
                  <Avatar name={c.author_name || '?'} size={30} />
                  <div>
                    <p><strong>{c.author_name || 'Someone'}</strong> <span className="muted">{formatDateTime(c.created_at)}</span></p>
                    <p className="task-detail__comment-body"><CommentText comment={c} people={task.mentionable || []} /></p>
                  </div>
                </li>
              ))}
            </ul>
            <CommentBox people={task.mentionable || []} busy={busy} onPost={addComment} />
          </section>
        </div>

        <aside className="task-detail__side">
          <section className="card card__body">
            <dl className="task-detail__facts">
              <dt>{task.assignees?.length > 1 ? 'People' : 'For'}</dt>
              <dd className="task-detail__people">
                {(task.assignees?.length ? task.assignees : [{ id: task.assigned_employee_id, first_name: task.first_name, last_name: task.last_name, photo_url: task.photo_url, is_lead: true }]).map((a) => (
                  <span key={a.id} className="task-detail__person">
                    <Avatar name={`${a.first_name} ${a.last_name}`} src={a.photo_url} size={26} />
                    <Link to={`/employees/${a.id}`}>{a.first_name} {a.last_name}</Link>
                    {a.is_lead && task.assignees?.length > 1 && <small className="muted">lead</small>}
                  </span>
                ))}
              </dd>
              {task.project_id && (
                <>
                  <dt>Project</dt>
                  <dd><Link to={`/projects/${task.project_id}`}>{task.project_name}</Link></dd>
                </>
              )}
              <dt>Due</dt>
              <dd className={`task-detail__due--${due.tone}`}>{task.due_date ? `${formatDate(task.due_date)}${due.tone !== 'none' ? ` · ${due.text.split(' ·')[0]}` : ''}` : '—'}</dd>
              <dt>Priority</dt>
              <dd>{['urgent', 'high'].includes(task.priority) ? <Badge status={task.priority} /> : TASK_PRIORITIES[task.priority]}</dd>
              {task.customer_id && (
                <>
                  <dt>Customer</dt>
                  <dd><Link to={`/customers/${task.customer_id}`}>{task.customer_name}</Link></dd>
                </>
              )}
              <dt>Set by</dt>
              <dd>{task.recurring_task_id ? 'Repeats automatically' : task.created_by_name || '—'}</dd>
              <dt>Created</dt>
              <dd>{formatDateTime(task.created_at)}</dd>
              {task.completed_at && (
                <>
                  <dt>Done</dt>
                  <dd>{formatDateTime(task.completed_at)}</dd>
                </>
              )}
            </dl>
          </section>

          <section className="card">
            <header className="card__header">
              <h2>Files</h2>
              {task.canWork && (
                <>
                  <button type="button" className="link-btn" onClick={() => fileInput.current.click()} disabled={busy}><Paperclip size={14} /> Add</button>
                  <input ref={fileInput} type="file" hidden onChange={upload} accept=".pdf,.doc,.docx,image/*" />
                </>
              )}
            </header>
            <ul className="task-detail__files">
              {task.attachments.length === 0 && <li className="muted">No files.</li>}
              {task.attachments.map((a) => (
                <li key={a.id}>
                  <a href={a.file_url} target="_blank" rel="noreferrer"><Paperclip size={14} /> {a.file_name}</a>
                  {task.canWork && <button type="button" className="icon-btn" onClick={() => removeFile(a)} aria-label="Remove file"><X size={14} /></button>}
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>

      {editing && <TaskModal task={task} onClose={() => setEditing(false)} onSaved={() => reload()} />}
    </div>
  );
}
