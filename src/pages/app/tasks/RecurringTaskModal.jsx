import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import Modal from '../../../components/Modal.jsx';
import Field from '../../../components/Field.jsx';
import { api } from '../../../api/client.js';
import { useAuth } from '../../../context/AuthContext.jsx';
import { useToast } from '../../../context/ToastContext.jsx';
import { TASK_PRIORITIES, WEEKDAYS, repeatLabel } from '../../../utils/format.js';

// Set up (or edit) a task that Workard creates automatically on a schedule
export default function RecurringTaskModal({ item, people, onClose, onSaved }) {
  const toast = useToast();
  const { employee } = useAuth();
  const [form, setForm] = useState({
    title: item?.title || '',
    description: item?.description || '',
    assignedEmployeeId: item?.assigned_employee_id || employee?.id || '',
    priority: item?.priority || 'normal',
    frequency: item?.frequency || 'weekly',
    weekday: item?.weekday || 5,
    monthDay: item?.month_day || 1,
    isActive: item ? !!item.is_active : true,
  });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const onChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const body = {
        ...form,
        weekday: form.frequency === 'weekly' ? form.weekday : '',
        monthDay: form.frequency === 'monthly' ? form.monthDay : '',
      };
      await api(item ? `/api/tasks/recurring/${item.id}` : '/api/tasks/recurring', { method: item ? 'PUT' : 'POST', body });
      toast.success(item ? 'Repeating task updated' : `Repeating task set up — ${repeatLabel(body).toLowerCase()}`);
      onSaved();
      onClose();
    } catch (err) {
      setErrors(err.errors || {});
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <Modal
      title={item ? 'Edit repeating task' : 'New repeating task'}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn--ghost" onClick={onClose}>Cancel</button>
          <button type="submit" form="recurring-form" className="btn btn--primary" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
        </>
      }
    >
      <form id="recurring-form" className="form form--flush" onSubmit={save} noValidate>
        {error && <div className="form__alert"><AlertCircle size={18} /> {error}</div>}
        <Field label="Task" name="title" error={errors.title}>
          <input id="title" name="title" className="field__input" value={form.title} onChange={onChange} placeholder="e.g. Submit weekly cash report" />
        </Field>
        <div className="form__row">
          <Field label="For" name="assignedEmployeeId" error={errors.assignedEmployeeId}>
            <select id="assignedEmployeeId" name="assignedEmployeeId" className="field__input" value={form.assignedEmployeeId} onChange={onChange}>
              {(people || []).map((p) => (
                <option key={p.id} value={p.id}>{p.id === employee?.id ? 'Me' : `${p.first_name} ${p.last_name}`}</option>
              ))}
            </select>
          </Field>
          <Field label="Priority" name="priority">
            <select id="priority" name="priority" className="field__input" value={form.priority} onChange={onChange}>
              {Object.entries(TASK_PRIORITIES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </Field>
        </div>
        <div className="form__row">
          <Field label="Repeats" name="frequency" error={errors.frequency}>
            <select id="frequency" name="frequency" className="field__input" value={form.frequency} onChange={onChange}>
              <option value="daily">Every working day (Mon–Fri)</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </Field>
          {form.frequency === 'weekly' && (
            <Field label="On" name="weekday" error={errors.weekday}>
              <select id="weekday" name="weekday" className="field__input" value={form.weekday} onChange={onChange}>
                {Object.entries(WEEKDAYS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </Field>
          )}
          {form.frequency === 'monthly' && (
            <Field label="Day of the month" name="monthDay" error={errors.monthDay} hint="29–31 use the last day in shorter months">
              <input id="monthDay" name="monthDay" type="number" min="1" max="31" className="field__input" value={form.monthDay} onChange={onChange} />
            </Field>
          )}
        </div>
        <Field label="Details" name="description" optional>
          <textarea id="description" name="description" rows={3} className="field__input" value={form.description} onChange={onChange} />
        </Field>
        {item && (
          <label className="form__check">
            <input type="checkbox" name="isActive" checked={form.isActive} onChange={onChange} />
            <span>Active (untick to pause it)</span>
          </label>
        )}
      </form>
    </Modal>
  );
}
