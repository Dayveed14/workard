import { useEffect, useState } from 'react';
import { AlertCircle, Plus, Trash2 } from 'lucide-react';
import Modal from '../../../components/Modal.jsx';
import Field from '../../../components/Field.jsx';
import { api } from '../../../api/client.js';
import { useToast } from '../../../context/ToastContext.jsx';

const blankItem = (owner) => ({ title: '', description: '', owner, dueDay: 0, asksForNote: false });

// Wording for the two kinds of checklist (same editor, same tables)
const KINDS = {
  onboarding: {
    suits: [['staff', 'Staff'], ['managers', 'Managers & supervisors'], ['everyone', 'Everyone']],
    defaultSuits: 'staff',
    suitsHint: 'Suggested automatically when you onboard someone',
    person: ['Steps for the new joiner', 'They tick these off themselves. “Day” = days after their first day (0 = first day).'],
    hr: ['Steps for HR / the owner', 'e.g. create their work email, welcome meeting, ID card. Only HR or the owner ticks these.'],
    placeholder: 'e.g. New sales rep',
  },
  offboarding: {
    suits: [['resignation', 'Resignations (notice period)'], ['termination', 'Exits within 24 hours'], ['everyone', 'Any exit']],
    defaultSuits: 'resignation',
    suitsHint: 'Suggested automatically when someone leaves',
    person: ['Steps for the person leaving', 'They tick these off themselves. “Day” = days after their notice starts — never later than their last day. Tick “Note” when they must write something (e.g. a handover note).'],
    hr: ['Steps for HR / the owner', 'e.g. exit interview, collect the laptop, remove email access, final pay. Only HR or the owner ticks these.'],
    placeholder: 'e.g. Resignation — sales staff',
  },
};

// Create or edit a checklist (template). kind: 'onboarding' (joining) or 'offboarding' (leaving)
export default function ChecklistEditor({ templateId, kind = 'onboarding', onClose, onSaved }) {
  const toast = useToast();
  const words = KINDS[kind];
  const [form, setForm] = useState(
    templateId ? null : { name: '', description: '', suits: words.defaultSuits, items: [blankItem('new_joiner'), blankItem('hr')] }
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
          items: t.items.map((i) => ({ title: i.title, description: i.description || '', owner: i.owner, dueDay: i.due_day, asksForNote: Boolean(i.asks_for_note) })),
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
      const body = { ...form, kind, items: form.items.filter((i) => i.title.trim()) };
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
          <div key={i} className={`ob-editor__row${kind === 'offboarding' && owner === 'new_joiner' ? ' ob-editor__row--note' : ''}`}>
            <input className="field__input" value={item.title} placeholder="What needs doing" onChange={(e) => setItem(i, 'title', e.target.value)} aria-label="Item" />
            <label className="ob-editor__day">
              <span>Day</span>
              <input className="field__input" type="number" min="0" max="365" value={item.dueDay} onChange={(e) => setItem(i, 'dueDay', e.target.value)} aria-label="Due on day" />
            </label>
            {kind === 'offboarding' && owner === 'new_joiner' && (
              <label className="ob-editor__note" title="They must write something when ticking it (e.g. the handover note, or what they returned)">
                <input type="checkbox" checked={item.asksForNote} onChange={(e) => setItem(i, 'asksForNote', e.target.checked)} /> Note
              </label>
            )}
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
              <input id="name" className="field__input" value={form.name} placeholder={words.placeholder} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </Field>
            <Field label="Best for" name="suits" hint={words.suitsHint}>
              <select id="suits" className="field__input" value={form.suits} onChange={(e) => setForm((f) => ({ ...f, suits: e.target.value }))}>
                {words.suits.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Description" name="description" optional>
            <input id="description" className="field__input" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </Field>
          {section('new_joiner', ...words.person)}
          {section('hr', ...words.hr)}
        </div>
      )}
    </Modal>
  );
}
