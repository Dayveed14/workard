import { useState } from 'react';
import { Pencil, Plus } from 'lucide-react';
import Modal from '../../../components/Modal.jsx';
import Field from '../../../components/Field.jsx';
import Badge from '../../../components/Badge.jsx';
import { api } from '../../../api/client.js';
import { useApi } from '../../../hooks/useApi.js';
import { useToast } from '../../../context/ToastContext.jsx';

function LeaveTypeModal({ type, onClose, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState({
    name: type?.name || '',
    daysPerYear: type?.days_per_year ?? 10,
    isPaid: type ? !!type.is_paid : true,
    isActive: type ? !!type.is_active : true,
  });
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    try {
      await api(type ? `/api/organization/leave-types/${type.id}` : '/api/organization/leave-types', {
        method: type ? 'PUT' : 'POST',
        body: { ...form, daysPerYear: Number(form.daysPerYear) },
      });
      toast.success('Leave type saved');
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.message);
      setBusy(false);
    }
  };

  return (
    <Modal
      title={type ? `Edit ${type.name}` : 'Add leave type'}
      size="sm"
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn--ghost" onClick={onClose}>Cancel</button>
          <button type="button" className="btn btn--primary" onClick={save} disabled={busy}>Save</button>
        </>
      }
    >
      <div className="form form--flush">
        <Field label="Name" name="name">
          <input id="name" className="field__input" placeholder="e.g. Maternity leave" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        </Field>
        <Field label="Working days per year" name="daysPerYear">
          <input id="daysPerYear" type="number" min="0" max="365" className="field__input" value={form.daysPerYear} onChange={(e) => setForm((f) => ({ ...f, daysPerYear: e.target.value }))} />
        </Field>
        <label className="form__check">
          <input type="checkbox" checked={form.isPaid} onChange={(e) => setForm((f) => ({ ...f, isPaid: e.target.checked }))} />
          <span>Paid leave</span>
        </label>
        <label className="form__check">
          <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} />
          <span>Employees can request this</span>
        </label>
      </div>
    </Modal>
  );
}

export default function LeaveTypesSettings() {
  const { data, reload } = useApi('/api/organization/structure');
  const [editing, setEditing] = useState(null);

  return (
    <>
      <div className="toolbar">
        <button type="button" className="btn btn--primary" onClick={() => setEditing('new')}><Plus size={18} /> Add leave type</button>
      </div>
      <div className="card settings__narrow">
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Leave type</th><th>Days / year</th><th>Paid</th><th>Status</th><th /></tr></thead>
            <tbody>
              {data?.leaveTypes.map((t) => (
                <tr key={t.id}>
                  <td><strong>{t.name}</strong></td>
                  <td>{t.days_per_year}</td>
                  <td>{t.is_paid ? 'Yes' : 'No'}</td>
                  <td>{t.is_active ? <Badge status="active" /> : <Badge tone="gray">Hidden</Badge>}</td>
                  <td className="row-actions">
                    <button type="button" className="icon-btn" onClick={() => setEditing(t)} aria-label="Edit"><Pencil size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {editing && <LeaveTypeModal type={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onSaved={reload} />}
    </>
  );
}
