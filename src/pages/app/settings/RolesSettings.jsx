import { useState } from 'react';
import { AlertCircle, Lock, Pencil, Plus, Trash2, Users } from 'lucide-react';
import Modal from '../../../components/Modal.jsx';
import Field from '../../../components/Field.jsx';
import Badge from '../../../components/Badge.jsx';
import { api } from '../../../api/client.js';
import { useApi } from '../../../hooks/useApi.js';
import { useToast } from '../../../context/ToastContext.jsx';
import { SCOPE_LABELS } from '../../../utils/format.js';

// Permission matrix: tick a permission, then choose WHOSE records it applies to
function RoleModal({ role, catalog, onClose, onSaved }) {
  const toast = useToast();
  const readOnly = role?.isOwner;
  const [form, setForm] = useState({
    name: role?.name || '',
    description: role?.description || '',
    permissions: { ...(role?.permissions || {}) },
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const modules = [...new Set(catalog.permissions.map((p) => p.module))];

  const toggle = (p, checked) =>
    setForm((f) => {
      const permissions = { ...f.permissions };
      if (checked) permissions[p.key] = p.scoped ? 'own' : 'all';
      else delete permissions[p.key];
      return { ...f, permissions };
    });

  const setScope = (key, scope) => setForm((f) => ({ ...f, permissions: { ...f.permissions, [key]: scope } }));

  const save = async () => {
    setBusy(true);
    setError('');
    try {
      await api(role ? `/api/roles/${role.id}` : '/api/roles', { method: role ? 'PUT' : 'POST', body: form });
      toast.success('Role saved');
      onSaved();
      onClose();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <Modal
      title={role ? (readOnly ? role.name : `Edit ${role.name}`) : 'New role'}
      size="lg"
      onClose={onClose}
      footer={
        readOnly ? (
          <button type="button" className="btn btn--primary" onClick={onClose}>Close</button>
        ) : (
          <>
            <button type="button" className="btn btn--ghost" onClick={onClose}>Cancel</button>
            <button type="button" className="btn btn--primary" onClick={save} disabled={busy}>Save role</button>
          </>
        )
      }
    >
      <div className="form form--flush">
        {error && <div className="form__alert"><AlertCircle size={18} /> {error}</div>}
        {readOnly && (
          <div className="form__alert form__alert--info"><Lock size={18} /> The Owner role always has full access and can’t be changed.</div>
        )}
        <div className="form__row">
          <Field label="Role name" name="name">
            <input id="name" className="field__input" disabled={readOnly} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </Field>
          <Field label="Description" name="description" optional>
            <input id="description" className="field__input" disabled={readOnly} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </Field>
        </div>

        <p className="muted">
          Everyone can always clock in, request leave and see their own profile. “Applies to” controls whose records
          the role can see — e.g. <strong>Team</strong> = only the teams they supervise.
        </p>

        <table className="perm-table">
          <tbody>
            {modules.map((m) => (
              <FragmentRows key={m} module={m}>
                {catalog.permissions
                  .filter((p) => p.module === m)
                  .map((p) => {
                    const scope = form.permissions[p.key];
                    return (
                      <tr key={p.key}>
                        <td>
                          <label className="form__check">
                            <input type="checkbox" disabled={readOnly} checked={Boolean(scope)} onChange={(e) => toggle(p, e.target.checked)} />
                            <span>{p.label}</span>
                          </label>
                        </td>
                        <td>
                          {scope && p.scoped && (
                            <select className="field__input" disabled={readOnly} value={scope} onChange={(e) => setScope(p.key, e.target.value)} aria-label={`${p.label} applies to`}>
                              {catalog.scopes.map((s) => <option key={s} value={s}>{SCOPE_LABELS[s]}</option>)}
                            </select>
                          )}
                        </td>
                      </tr>
                    );
                  })}
              </FragmentRows>
            ))}
          </tbody>
        </table>
      </div>
    </Modal>
  );
}

function FragmentRows({ module, children }) {
  return (
    <>
      <tr><th colSpan={2}>{module}</th></tr>
      {children}
    </>
  );
}

export default function RolesSettings() {
  const toast = useToast();
  const { data: roles, reload } = useApi('/api/roles');
  const { data: catalog } = useApi('/api/roles/permissions');
  const [editing, setEditing] = useState(null);

  const remove = async (r) => {
    if (!window.confirm(`Delete the ${r.name} role?`)) return;
    try {
      await api(`/api/roles/${r.id}`, { method: 'DELETE' });
      toast.success('Role deleted');
      reload();
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (!roles || !catalog) return <div className="page-loader"><span className="page-loader__spinner" /></div>;

  return (
    <>
      <div className="toolbar">
        <button type="button" className="btn btn--primary" onClick={() => setEditing('new')}><Plus size={18} /> New role</button>
      </div>
      <div className="roles">
        {roles.map((r) => (
          <article key={r.id} className="card role-card">
            <header>
              <h3>{r.name}</h3>
              {r.isOwner ? <Badge tone="blue">Full access</Badge> : r.isSystem ? <Badge tone="gray">Built-in</Badge> : <Badge tone="green">Custom</Badge>}
            </header>
            <p>{r.description || `${Object.keys(r.permissions).length} permission(s)`}</p>
            <footer>
              <span><Users size={14} /> {r.memberCount} member(s)</span>
              <span className="row-actions">
                <button type="button" className="icon-btn" onClick={() => setEditing(r)} aria-label="Edit"><Pencil size={16} /></button>
                {!r.isSystem && (
                  <button type="button" className="icon-btn" onClick={() => remove(r)} aria-label="Delete"><Trash2 size={16} /></button>
                )}
              </span>
            </footer>
          </article>
        ))}
      </div>
      {editing && (
        <RoleModal role={editing === 'new' ? null : editing} catalog={catalog} onClose={() => setEditing(null)} onSaved={reload} />
      )}
    </>
  );
}
