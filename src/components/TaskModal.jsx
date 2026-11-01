import { useState } from 'react';
import { AlertCircle, Plus, X } from 'lucide-react';
import Modal from './Modal.jsx';
import Field from './Field.jsx';
import { api } from '../api/client.js';
import { useApi } from '../hooks/useApi.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { TASK_PRIORITIES, todayString } from '../utils/format.js';
import './TaskModal.css';

// Create a task (task = null) or edit one. `customerId` links a new task to a customer.
export default function TaskModal({ task, customerId, defaultAssigneeId, onClose, onSaved }) {
  const toast = useToast();
  const { employee } = useAuth();
  const { data: people } = useApi('/api/tasks/assignees');
  const isEdit = Boolean(task);

  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    assignedEmployeeId: task?.assigned_employee_id || defaultAssigneeId || employee?.id || '',
    dueDate: task?.due_date || '',
    priority: task?.priority || 'normal',
  });
  const [checklist, setChecklist] = useState(['']);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const body = isEdit
        ? form
        : { ...form, customerId: customerId || '', checklist: checklist.map((c) => c.trim()).filter(Boolean) };
      const saved = await api(isEdit ? `/api/tasks/${task.id}` : '/api/tasks', { method: isEdit ? 'PATCH' : 'POST', body });
      toast.success(isEdit ? 'Task updated' : 'Task created');
      onSaved(saved);
      onClose();
    } catch (err) {
      setErrors(err.errors || {});
      setError(err.message);
      setBusy(false);
    }
  };

  const others = (people || []).filter((p) => p.id !== employee?.id);

  return (
    <Modal
      title={isEdit ? 'Edit task' : 'New task'}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn--ghost" onClick={onClose}>Cancel</button>
          <button type="submit" form="task-form" className="btn btn--primary" disabled={busy}>
            {busy ? 'Saving…' : isEdit ? 'Save changes' : 'Create task'}
          </button>
        </>
      }
    >
      <form id="task-form" className="form form--flush" onSubmit={save} noValidate>
        {error && <div className="form__alert"><AlertCircle size={18} /> {error}</div>}

        <Field label="What needs doing?" name="title" error={errors.title}>
          <input id="title" name="title" className="field__input" value={form.title} onChange={onChange} placeholder="e.g. Send November stock count" autoFocus />
        </Field>

        <div className="form__row form__row--3">
          <Field
            label="For"
            name="assignedEmployeeId"
            error={errors.assignedEmployeeId}
            hint={people && others.length === 0 ? 'No one else to choose yet' : undefined}
          >
            <select id="assignedEmployeeId" name="assignedEmployeeId" className="field__input" value={form.assignedEmployeeId} onChange={onChange} disabled={!people}>
              {employee && <option value={employee.id}>Me</option>}
              {others.map((p) => (
                <option key={p.id} value={p.id}>{p.first_name} {p.last_name}{p.job_title ? ` — ${p.job_title}` : ''}</option>
              ))}
            </select>
          </Field>
          <Field label="Due" name="dueDate" error={errors.dueDate} optional>
            <input id="dueDate" name="dueDate" type="date" min={isEdit ? undefined : todayString()} className="field__input" value={form.dueDate} onChange={onChange} />
          </Field>
          <Field label="Priority" name="priority">
            <select id="priority" name="priority" className="field__input" value={form.priority} onChange={onChange}>
              {Object.entries(TASK_PRIORITIES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </Field>
        </div>

        <Field label="Details" name="description" error={errors.description} optional>
          <textarea id="description" name="description" rows={3} className="field__input" value={form.description} onChange={onChange} />
        </Field>

        {!isEdit && (
          <div className="task-modal__checklist">
            <span className="field__label">Checklist <span className="field__optional">Optional</span></span>
            {checklist.map((item, i) => (
              <div key={i} className="task-modal__check-row">
                <input
                  className="field__input"
                  value={item}
                  placeholder={`Step ${i + 1}`}
                  aria-label={`Checklist step ${i + 1}`}
                  onChange={(e) => setChecklist((list) => list.map((x, j) => (j === i ? e.target.value : x)))}
                />
                {checklist.length > 1 && (
                  <button type="button" className="icon-btn" aria-label="Remove step" onClick={() => setChecklist((list) => list.filter((_, j) => j !== i))}>
                    <X size={16} />
                  </button>
                )}
              </div>
            ))}
            <button type="button" className="link-btn" onClick={() => setChecklist((list) => [...list, ''])}>
              <Plus size={14} /> Add step
            </button>
          </div>
        )}
      </form>
    </Modal>
  );
}
