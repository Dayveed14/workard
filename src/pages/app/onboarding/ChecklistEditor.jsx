import { useEffect, useState } from 'react';
import { AlertCircle, Plus, Trash2 } from 'lucide-react';
import Modal from '../../../components/Modal.jsx';
import Field from '../../../components/Field.jsx';
import { api } from '../../../api/client.js';
import { useToast } from '../../../context/ToastContext.jsx';

const blankItem = (owner) => ({ title: '', description: '', owner, dueDay: 0 });

// Create or edit an onboarding checklist (template)
export default function ChecklistEditor({ templateId, onClose, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState(
    templateId ? null : { name: '', description: '', suits: 'staff', items: [blankItem('new_joiner'), blankItem('hr')] }
  );
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!templateId) return;
    api(`/api/onboarding/templates/${templateId}`)
      .then((t) =>
        setForm({
          name: t.name,
          description: t.description || '',
          suits: t.suits,
          items: t.items.map((i) => ({ title: i.title, description: i.description || '', owner: i.owner, dueDay: i.due_day })),
        })
      )
      .catch((err) => setError(err.message));
  }, [templateId]);

  const setItem = (index, name, value) =>
    setForm((f) => ({ ...f, items: f.items.map((item, i) => (i === index ? { ...item, [name]: value } : item)) }));

  const save = async () => {
    setBusy(true);
    setError('');
    try {
      const body = { ...form, items: form.items.filter((i) => i.title.trim()) };
      await api(templateId ? `/api/onboarding/templates/${templateId}` : '/api/onboarding/templates', {
        method: templateId ? 'PUT' : 'POST',
        body,
      });
      toast.success('Checklist saved');
      onSaved();
      onClose();
    } catch (err) {
      setError(Object.values(err.errors || {})[0] || err.message);
      setBusy(false);
    }
  };

  const section = (owner, title, hint) => (
    <div className="ob-editor__section">
      <p className="form__section">{title}</p>
      <p className="muted ob-editor__hint">{hint}</p>
      {form.items.map((item, i) =>
        item.owner !== owner ? null : (
          <div key={i} className="ob-editor__row">
            <input className="field__input" value={item.title} placeholder="What needs doing" onChange={(e) => setItem(i, 'title', e.target.value)} aria-label="Item" />
            <label className="ob-editor__day">
              <span>Day</span>
              <input className="field__input" type="number" min="0" max="365" value={item.dueDay} onChange={(e) => setItem(i, 'dueDay', e.target.value)} aria-label="Due on day" />
            </label>
            <button type="button" className="icon-btn" onClick={() => setForm((f) => ({ ...f, items: f.items.filter((_, j) => j !== i) }))} aria-label="Remove item">
              <Trash2 size={16} />
            </button>
          </div>
        )
      )}
      <button type="button" className="link-btn" onClick={() => setForm((f) => ({ ...f, items: [...f.items, blankItem(owner)] }))}>
        <Plus size={14} /> Add item
      </button>
    </div>
  );

  return (
    <Modal
      title={templateId ? 'Edit checklist' : 'New checklist'}
      size="lg"
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn--ghost" onClick={onClose}>Cancel</button>
          <button type="button" className="btn btn--primary" disabled={busy || !form} onClick={save}>{busy ? 'Saving…' : 'Save checklist'}</button>
        </>
      }
    >
      {!form ? (
        <div className="page-loader"><span className="page-loader__spinner" /></div>
      ) : (
        <div className="form form--flush">
          {error && <div className="form__alert"><AlertCircle size={18} /> {error}</div>}
          <div className="form__row">
            <Field label="Name" name="name">
              <input id="name" className="field__input" value={form.name} placeholder="e.g. New sales rep" onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </Field>
            <Field label="Best for" name="suits" hint="Suggested automatically when you onboard someone">
              <select id="suits" className="field__input" value={form.suits} onChange={(e) => setForm((f) => ({ ...f, suits: e.target.value }))}>
                <option value="staff">Staff</option>
                <option value="managers">Managers & supervisors</option>
                <option value="everyone">Everyone</option>
              </select>
            </Field>
          </div>
          <Field label="Description" name="description" optional>
            <input id="description" className="field__input" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </Field>
          {section('new_joiner', 'Steps for the new joiner', 'They tick these off themselves. “Day” = days after their first day (0 = first day).')}
          {section('hr', 'Steps for HR / the owner', 'e.g. create their work email, welcome meeting, ID card. Only HR or the owner ticks these.')}
        </div>
      )}
    </Modal>
  );
}
