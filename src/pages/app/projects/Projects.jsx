import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CalendarDays, FolderKanban, Plus } from 'lucide-react';
import PageHeader from '../../../components/PageHeader.jsx';
import EmptyState from '../../../components/EmptyState.jsx';
import Modal from '../../../components/Modal.jsx';
import Field from '../../../components/Field.jsx';
import { api } from '../../../api/client.js';
import { useApi } from '../../../hooks/useApi.js';
import { useAuth } from '../../../context/AuthContext.jsx';
import { formatDate } from '../../../utils/format.js';
import './Projects.css';

// Project colours (same validated categorical palette as the charts)
export const PROJECT_COLORS = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#6250d6', '#e34948'];
const groupValue = (g) => `${g.type}:${g.id ?? ''}`;

export function ProjectModal({ project, groups, onSaved, onClose }) {
  const [form, setForm] = useState({
    name: project?.name || '',
    description: project?.description || '',
    group: groups?.[0] ? groupValue(groups[0]) : '',
    color: project?.color || PROJECT_COLORS[0],
    dueDate: project?.due_date || '',
    status: project?.status || 'active',
  });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    setBusy(true);
    try {
      const { group, ...rest } = form;
      let saved;
      if (project) {
        saved = await api(`/api/projects/${project.id}`, { method: 'PATCH', body: rest });
      } else {
        const [audienceType, audienceId] = group.split(':');
        const { status: _s, ...fields } = rest;
        saved = await api('/api/projects', { method: 'POST', body: { ...fields, audienceType, audienceId: audienceId ? Number(audienceId) : null } });
      }
      onSaved(saved);
    } catch (err) {
      setErrors(err.errors || { name: err.message });
      setBusy(false);
    }
  };

  return (
    <Modal title={project ? 'Edit project' : 'New project'} size="sm" onClose={onClose} footer={
      <>
        <button type="button" className="btn btn--ghost" onClick={onClose}>Cancel</button>
        <button type="button" className="btn btn--primary" disabled={busy} onClick={save}>{busy ? 'Saving…' : 'Save'}</button>
      </>
    }>
      <Field label="Name" name="name" error={errors.name}>
        <input id="name" className="field__input" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Lekki store launch" autoFocus />
      </Field>
      {!project && (
        <Field label="Whose project" name="group" error={errors.audience || errors.audienceId}>
          <select id="group" className="field__input" value={form.group} onChange={(e) => set('group', e.target.value)}>
            {groups.map((g) => <option key={groupValue(g)} value={groupValue(g)}>{g.label}</option>)}
          </select>
        </Field>
      )}
      <Field label="What it’s for" name="description" optional>
        <textarea id="description" rows={2} className="field__input" value={form.description} onChange={(e) => set('description', e.target.value)} />
      </Field>
      <div className="form__row">
        <Field label="Finish by" name="dueDate" optional>
          <input id="dueDate" type="date" className="field__input" value={form.dueDate} onChange={(e) => set('dueDate', e.target.value)} />
        </Field>
        {project && (
          <Field label="Status" name="status">
            <select id="status" className="field__input" value={form.status} onChange={(e) => set('status', e.target.value)}>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="archived">Archived</option>
            </select>
          </Field>
        )}
      </div>
      <div className="field">
        <span className="field__label">Colour</span>
        <div className="proj__colors">
          {PROJECT_COLORS.map((c) => (
            <button key={c} type="button" className={`proj__color ${form.color === c ? 'is-on' : ''}`} style={{ background: c }} onClick={() => set('color', c)} aria-label={`Colour ${c}`} />
          ))}
        </div>
      </div>
    </Modal>
  );
}

export function ProgressBar({ done, total, color }) {
  const pct = total ? Math.round((done / total) * 100) : 0;
  return (
    <span className="proj-progress" title={`${done} of ${total} tasks done`}>
      <span className="proj-progress__track"><span style={{ width: `${pct}%`, background: color }} /></span>
      <span className="proj-progress__label">{pct}%</span>
    </span>
  );
}

// Projects: tasks grouped for a team or department, with progress
export default function Projects() {
  const { can } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState('active');
  const { data } = useApi(`/api/projects?status=${status}`);
  const { data: groups } = useApi(can('projects.manage') ? '/api/projects/groups' : null);
  const [creating, setCreating] = useState(false);

  return (
    <div className="proj">
      <PageHeader
        title="Projects"
        subtitle="Group your team’s tasks and see everyone’s progress at a glance."
        actions={groups?.length > 0 && <button type="button" className="btn btn--primary" onClick={() => setCreating(true)}><Plus size={16} /> New project</button>}
      />
      <div className="res__chips proj__filter">
        {[['active', 'Active'], ['completed', 'Completed'], ['archived', 'Archived']].map(([v, l]) => (
          <button key={v} type="button" className={status === v ? 'is-on' : ''} onClick={() => setStatus(v)}>{l}</button>
        ))}
      </div>
      {!data && <div className="page-loader"><span className="page-loader__spinner" /></div>}
      {data?.length === 0 && (
        <div className="card"><EmptyState icon={FolderKanban} title={`No ${status} projects`} text="Projects your team is part of — or has tasks in — show up here." /></div>
      )}
      <div className="proj__grid">
        {data?.map((p) => (
          <Link key={p.id} to={`/projects/${p.id}`} className="card proj-card" style={{ '--project': p.color }}>
            <span className="proj-card__name">{p.name}</span>
            <span className="muted proj-card__group">{p.audience_name}</span>
            {p.description && <span className="proj-card__desc">{p.description}</span>}
            <ProgressBar done={Number(p.task_done)} total={Number(p.task_total)} color={p.color} />
            <span className="proj-card__stats">
              <span>{p.task_done}/{p.task_total} done</span>
              {Number(p.task_in_progress) > 0 && <span>{p.task_in_progress} in progress</span>}
              {Number(p.task_overdue) > 0 && <span className="proj-card__late">{p.task_overdue} overdue</span>}
              {p.due_date && <span><CalendarDays size={13} /> {formatDate(p.due_date)}</span>}
            </span>
          </Link>
        ))}
      </div>
      {creating && <ProjectModal groups={groups} onClose={() => setCreating(false)} onSaved={(p) => navigate(`/projects/${p.id}`)} />}
    </div>
  );
}
