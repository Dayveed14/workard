import { useNavigate } from 'react-router-dom';
import { Check, CheckSquare, MessageSquare, Repeat, ListTodo } from 'lucide-react';
import Badge from './Badge.jsx';
import EmptyState from './EmptyState.jsx';
import Avatar from './Avatar.jsx';
import AvatarStack from './AvatarStack.jsx';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { dueLabel } from '../utils/format.js';
import './TaskList.css';

// A list of tasks. Your own open tasks get a round "done" button.
//   showAssignee → show who each task is for (team views)
export default function TaskList({ tasks, showAssignee = false, onChange, emptyText, compact = false }) {
  const navigate = useNavigate();
  const toast = useToast();
  const { employee } = useAuth();

  const complete = async (e, task) => {
    e.stopPropagation();
    try {
      await api(`/api/tasks/${task.id}/status`, { method: 'PATCH', body: { status: task.status === 'done' ? 'todo' : 'done' } });
      toast.success(task.status === 'done' ? 'Task reopened' : 'Done — nice work');
      onChange?.();
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (!tasks?.length) {
    return <EmptyState icon={ListTodo} title="No tasks here" text={compact ? undefined : emptyText || 'Tasks you create or are given show up here.'} />;
  }

  return (
    <ul className={`task-list ${compact ? 'task-list--compact' : ''}`}>
      {tasks.map((t) => {
        const due = dueLabel(t.due_date, t.status);
        const mine = (t.assignees || []).some((a) => a.id === employee?.id) || t.assigned_employee_id === employee?.id;
        const closed = t.status === 'done' || t.status === 'cancelled';
        return (
          <li key={t.id} className={closed ? 'is-closed' : ''} onClick={() => navigate(`/tasks/${t.id}`)}>
            {mine && t.status !== 'cancelled' ? (
              <button
                type="button"
                className={`task-list__tick ${t.status === 'done' ? 'is-done' : ''}`}
                onClick={(e) => complete(e, t)}
                aria-label={t.status === 'done' ? `Reopen ${t.title}` : `Mark ${t.title} done`}
              >
                <Check size={14} />
              </button>
            ) : (
              <span className="task-list__tick task-list__tick--blank" />
            )}

            <div className="task-list__main">
              <strong>{t.title}</strong>
              <span className="task-list__meta">
                {showAssignee && (
                  <span className="task-list__who">
                    {t.assignees?.length ? <AvatarStack people={t.assignees} size={18} showNames /> : <><Avatar name={`${t.first_name} ${t.last_name}`} src={t.photo_url} size={18} /> {t.first_name} {t.last_name}</>}
                  </span>
                )}
                {!showAssignee && t.assignees?.length > 1 && <AvatarStack people={t.assignees} size={18} />}
                {t.project_name && <span className="task-list__project" style={{ '--project': t.project_color }}>{t.project_name}</span>}
                {t.customer_name && <span>{t.customer_name}</span>}
                {Number(t.checklist_total) > 0 && (
                  <span><CheckSquare size={13} /> {t.checklist_done}/{t.checklist_total}</span>
                )}
                {Number(t.comment_count) > 0 && (
                  <span><MessageSquare size={13} /> {t.comment_count}</span>
                )}
                {t.recurring_task_id && <span title="Repeating task"><Repeat size={13} /></span>}
              </span>
            </div>

            <div className="task-list__side">
              {['urgent', 'high'].includes(t.priority) && !closed && <Badge status={t.priority} />}
              {t.status === 'in_progress' && <Badge status="in_progress" />}
              {t.status === 'cancelled' && <Badge status="cancelled" />}
              <span className={`task-list__due task-list__due--${due.tone}`}>{due.text}</span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
