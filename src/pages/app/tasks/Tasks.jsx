import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Pencil, Plus, Repeat, Search, Trash2 } from 'lucide-react';
import PageHeader from '../../../components/PageHeader.jsx';
import Tabs from '../../../components/Tabs.jsx';
import Badge from '../../../components/Badge.jsx';
import EmptyState from '../../../components/EmptyState.jsx';
import TaskList from '../../../components/TaskList.jsx';
import TaskModal from '../../../components/TaskModal.jsx';
import RecurringTaskModal from './RecurringTaskModal.jsx';
import { api, toQuery } from '../../../api/client.js';
import { useApi } from '../../../hooks/useApi.js';
import { useAuth } from '../../../context/AuthContext.jsx';
import { useToast } from '../../../context/ToastContext.jsx';
import { formatDate, repeatLabel } from '../../../utils/format.js';
import './Tasks.css';

// One list of tasks with filters. view = mine | created | team
function TaskView({ view, people }) {
  const [filters, setFilters] = useState({ status: 'open', due: '', assigneeId: '', search: '', page: 1 });
  const [searchText, setSearchText] = useState('');
  const { data, loading, reload } = useApi(`/api/tasks${toQuery({ view, ...filters })}`);
  const setFilter = (name, value) => setFilters((f) => ({ ...f, [name]: value, page: 1 }));

  return (
    <>
      <form className="toolbar" onSubmit={(e) => { e.preventDefault(); setFilter('search', searchText.trim()); }}>
        <input
          className="field__input toolbar__search"
          placeholder="Search tasks"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          onBlur={() => setFilter('search', searchText.trim())}
          aria-label="Search tasks"
        />
        <button type="submit" className="btn btn--outline" aria-label="Search"><Search size={18} /></button>
        <select className="field__input" value={filters.status} onChange={(e) => setFilter('status', e.target.value)} aria-label="Status">
          <option value="open">Open</option>
          <option value="in_progress">In progress</option>
          <option value="done">Done</option>
          <option value="cancelled">Cancelled</option>
          <option value="">All</option>
        </select>
        <select className="field__input" value={filters.due} onChange={(e) => setFilter('due', e.target.value)} aria-label="Due">
          <option value="">Any due date</option>
          <option value="overdue">Overdue</option>
          <option value="today">Due today</option>
          <option value="week">Next 7 days</option>
        </select>
        {view !== 'mine' && people?.length > 1 && (
          <select className="field__input" value={filters.assigneeId} onChange={(e) => setFilter('assigneeId', e.target.value)} aria-label="Person">
            <option value="">Everyone</option>
            {people.map((p) => <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>)}
          </select>
        )}
      </form>

      <div className="card">
        {loading && !data ? (
          <div className="page-loader"><span className="page-loader__spinner" /></div>
        ) : (
          <TaskList
            tasks={data?.tasks}
            showAssignee={view !== 'mine'}
            onChange={reload}
            emptyText={view === 'created' ? 'Tasks you give to other people show up here.' : undefined}
          />
        )}
        {data?.pages > 1 && (
          <div className="pagination">
            <span>Page {data.page} of {data.pages} · {data.total} tasks</span>
            <div>
              <button type="button" className="btn btn--outline btn--sm" disabled={data.page <= 1} onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}>Previous</button>
              <button type="button" className="btn btn--outline btn--sm" disabled={data.page >= data.pages} onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}>Next</button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// Tasks that repeat on a schedule (daily / weekly / monthly)
function RepeatingTasks({ people }) {
  const toast = useToast();
  const { data, loading, reload } = useApi('/api/tasks/recurring');
  const [modal, setModal] = useState(null); // { item } | { item: null }

  const remove = async (r) => {
    if (!window.confirm(`Stop "${r.title}" from repeating? Tasks already made are kept.`)) return;
    try {
      await api(`/api/tasks/recurring/${r.id}`, { method: 'DELETE' });
      toast.success('Repeating task removed');
      reload();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <>
      <div className="toolbar tasks__repeat-bar">
        <p className="muted">Workard creates these tasks automatically on the right day and emails the person each morning.</p>
        <button type="button" className="btn btn--primary" onClick={() => setModal({ item: null })}>
          <Repeat size={18} /> New repeating task
        </button>
      </div>
      <div className="card">
        {loading && !data && <div className="page-loader"><span className="page-loader__spinner" /></div>}
        {data?.length === 0 && (
          <EmptyState icon={Repeat} title="No repeating tasks" text="e.g. “Submit cash report” every Friday, or “Restock count” on the 1st of every month." />
        )}
        {data?.length > 0 && (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr><th>Task</th><th>For</th><th>Repeats</th><th>Next</th><th /></tr>
              </thead>
              <tbody>
                {data.map((r) => (
                  <tr key={r.id} className={r.is_active ? '' : 'tasks__paused'}>
                    <td>
                      <strong>{r.title}</strong>
                      {['urgent', 'high'].includes(r.priority) && <> <Badge status={r.priority} /></>}
                    </td>
                    <td>{r.first_name} {r.last_name}</td>
                    <td>{repeatLabel(r)}</td>
                    <td>{r.is_active ? formatDate(r.next_run_on) : <Badge tone="gray">Paused</Badge>}</td>
                    <td>
                      <div className="row-actions">
                        <button type="button" className="icon-btn" onClick={() => setModal({ item: r })} aria-label="Edit"><Pencil size={16} /></button>
                        <button type="button" className="icon-btn" onClick={() => remove(r)} aria-label="Delete"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {modal && <RecurringTaskModal item={modal.item} people={people} onClose={() => setModal(null)} onSaved={reload} />}
    </>
  );
}

export default function Tasks() {
  const navigate = useNavigate();
  const { employee } = useAuth();
  const [params, setParams] = useSearchParams();
  const { data: counts } = useApi('/api/tasks/counts');
  const { data: people } = useApi('/api/tasks/assignees');
  const [creating, setCreating] = useState(false);

  const managesPeople = (people || []).some((p) => p.id !== employee?.id);
  const tabs = [
    { id: 'mine', label: 'My tasks', count: counts?.mine.overdue + counts?.mine.dueToday || undefined },
    managesPeople && { id: 'created', label: 'I assigned' },
    counts?.team && { id: 'team', label: 'Team', count: counts.team.overdue || undefined },
    { id: 'repeating', label: 'Repeating' },
  ].filter(Boolean);
  const tab = tabs.some((t) => t.id === params.get('tab')) ? params.get('tab') : 'mine';

  return (
    <>
      <PageHeader
        title="Tasks"
        subtitle={
          counts
            ? `${counts.mine.open} open · ${counts.mine.dueToday} due today · ${counts.mine.overdue} overdue`
            : 'Your work, and the work you hand out.'
        }
        actions={
          <button type="button" className="btn btn--primary" onClick={() => setCreating(true)}>
            <Plus size={18} /> New task
          </button>
        }
      />
      <Tabs tabs={tabs} active={tab} onChange={(id) => setParams({ tab: id })} />
      {tab === 'repeating' ? <RepeatingTasks people={people} /> : <TaskView key={tab} view={tab} people={people} />}
      {creating && <TaskModal task={null} onClose={() => setCreating(false)} onSaved={(t) => navigate(`/tasks/${t.id}`)} />}
    </>
  );
}

