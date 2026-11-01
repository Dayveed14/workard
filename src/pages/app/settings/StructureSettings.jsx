import { useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import Modal from '../../../components/Modal.jsx';
import Field from '../../../components/Field.jsx';
import EmptyState from '../../../components/EmptyState.jsx';
import { api } from '../../../api/client.js';
import { useApi } from '../../../hooks/useApi.js';
import { useToast } from '../../../context/ToastContext.jsx';

function TeamModal({ team, structure, onClose, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState({
    name: team?.name || '',
    departmentId: team?.department_id || '',
    supervisorEmployeeId: team?.supervisor_employee_id || '',
  });
  const [busy, setBusy] = useState(false);
  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const save = async () => {
    setBusy(true);
    try {
      await api(team ? `/api/organization/teams/${team.id}` : '/api/organization/teams', { method: team ? 'PUT' : 'POST', body: form });
      toast.success(team ? 'Team updated' : 'Team added');
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.message);
      setBusy(false);
    }
  };

  return (
    <Modal
      title={team ? `Edit ${team.name}` : 'Add team'}
      size="sm"
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn--ghost" onClick={onClose}>Cancel</button>
          <button type="button" className="btn btn--primary" onClick={save} disabled={busy}>Save team</button>
        </>
      }
    >
      <div className="form form--flush">
        <Field label="Team name" name="name">
          <input id="name" name="name" className="field__input" placeholder="e.g. Field Sales" value={form.name} onChange={onChange} />
        </Field>
        <Field label="Department" name="departmentId" optional>
          <select id="departmentId" name="departmentId" className="field__input" value={form.departmentId} onChange={onChange}>
            <option value="">None</option>
            {structure.departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </Field>
        <Field label="Supervisor" name="supervisorEmployeeId" optional hint="A supervisor with the Team Supervisor role sees and approves for this team.">
          <select id="supervisorEmployeeId" name="supervisorEmployeeId" className="field__input" value={form.supervisorEmployeeId} onChange={onChange}>
            <option value="">None</option>
            {structure.employees.map((e) => <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>)}
          </select>
        </Field>
      </div>
    </Modal>
  );
}

export default function StructureSettings() {
  const toast = useToast();
  const { data, reload } = useApi('/api/organization/structure');
  const [newDept, setNewDept] = useState('');
  const [editingTeam, setEditingTeam] = useState(null);

  if (!data) return <div className="page-loader"><span className="page-loader__spinner" /></div>;

  const run = async (fn, message) => {
    try {
      await fn();
      toast.success(message);
      reload();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const addDept = (e) => {
    e.preventDefault();
    if (!newDept.trim()) return;
    run(() => api('/api/organization/departments', { method: 'POST', body: { name: newDept.trim() } }), 'Department added').then(() => setNewDept(''));
  };

  const renameDept = (d) => {
    const name = window.prompt('Rename department', d.name);
    if (name && name.trim() !== d.name) run(() => api(`/api/organization/departments/${d.id}`, { method: 'PUT', body: { name: name.trim() } }), 'Department renamed');
  };

  const deleteDept = (d) => {
    if (window.confirm(`Delete ${d.name}? Employees in it will have no department.`)) {
      run(() => api(`/api/organization/departments/${d.id}`, { method: 'DELETE' }), 'Department deleted');
    }
  };

  const deleteTeam = (t) => {
    if (window.confirm(`Delete ${t.name}?`)) run(() => api(`/api/organization/teams/${t.id}`, { method: 'DELETE' }), 'Team deleted');
  };

  return (
    <div className="settings__grid">
      <section className="card">
        <header className="card__header"><h2>Departments</h2></header>
        {data.departments.length === 0 ? (
          <EmptyState title="No departments yet" text="e.g. Sales, Operations, Finance" />
        ) : (
          <ul className="settings__list">
            {data.departments.map((d) => (
              <li key={d.id}>
                <span className="settings__list-text">
                  <strong>{d.name}</strong>
                  <span>{d.employee_count} employee(s)</span>
                </span>
                <button type="button" className="icon-btn" onClick={() => renameDept(d)} aria-label="Rename"><Pencil size={16} /></button>
                <button type="button" className="icon-btn" onClick={() => deleteDept(d)} aria-label="Delete"><Trash2 size={16} /></button>
              </li>
            ))}
          </ul>
        )}
        <form className="settings__inline" onSubmit={addDept}>
          <input className="field__input" placeholder="New department name" value={newDept} onChange={(e) => setNewDept(e.target.value)} aria-label="New department name" />
          <button type="submit" className="btn btn--primary btn--sm"><Plus size={16} /> Add</button>
        </form>
      </section>

      <section className="card">
        <header className="card__header">
          <h2>Teams</h2>
          <button type="button" className="btn btn--primary btn--sm" onClick={() => setEditingTeam('new')}><Plus size={16} /> Add team</button>
        </header>
        {data.teams.length === 0 ? (
          <EmptyState title="No teams yet" text="Teams group people under a supervisor." />
        ) : (
          <ul className="settings__list">
            {data.teams.map((t) => (
              <li key={t.id}>
                <span className="settings__list-text">
                  <strong>{t.name}</strong>
                  <span>
                    {[t.department_name, t.supervisor_name ? `Supervisor: ${t.supervisor_name}` : 'No supervisor', `${t.employee_count} member(s)`]
                      .filter(Boolean)
                      .join(' · ')}
                  </span>
                </span>
                <button type="button" className="icon-btn" onClick={() => setEditingTeam(t)} aria-label="Edit"><Pencil size={16} /></button>
                <button type="button" className="icon-btn" onClick={() => deleteTeam(t)} aria-label="Delete"><Trash2 size={16} /></button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {editingTeam && (
        <TeamModal team={editingTeam === 'new' ? null : editingTeam} structure={data} onClose={() => setEditingTeam(null)} onSaved={reload} />
      )}
    </div>
  );
}
