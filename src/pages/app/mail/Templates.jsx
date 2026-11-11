import { useState } from 'react';
import { FileText, Pencil, Plus, Trash2 } from 'lucide-react';
import Modal from '../../../components/Modal.jsx';
import Field from '../../../components/Field.jsx';
import EmptyState from '../../../components/EmptyState.jsx';
import Badge from '../../../components/Badge.jsx';
import RichTextEditor from '../../../components/RichTextEditor.jsx';
import { api } from '../../../api/client.js';
import { useApi } from '../../../hooks/useApi.js';
import { useAuth } from '../../../context/AuthContext.jsx';
import { useToast } from '../../../context/ToastContext.jsx';

const GAPS = ['{customer name}', '{contact name}', '{invoice number}', '{amount due}', '{due date}', '{invoice link}', '{employee name}', '{my name}', '{company name}'];

function TemplateModal({ template, onClose, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState({
    name: template?.name || '',
    subject: template?.subject || '',
    bodyHtml: template?.body_html || '',
    isShared: Boolean(template?.is_shared),
  });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    try {
      await api(template ? `/api/mail/templates/${template.id}` : '/api/mail/templates', { method: template ? 'PUT' : 'POST', body: form });
      toast.success('Template saved');
      onSaved();
      onClose();
    } catch (err) {
      setErrors(err.errors || {});
      toast.error(err.message);
      setBusy(false);
    }
  };

  return (
    <Modal
      title={template ? 'Edit template' : 'New template'}
      size="lg"
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn--ghost" onClick={onClose}>Cancel</button>
          <button type="button" className="btn btn--primary" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save template'}</button>
        </>
      }
    >
      <div className="form form--flush">
        <div className="form__row">
          <Field label="Name" name="name" error={errors.name}>
            <input id="name" className="field__input" value={form.name} placeholder="e.g. Payment reminder" onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </Field>
          <Field label="Subject" name="subject" error={errors.subject}>
            <input id="subject" className="field__input" value={form.subject} placeholder="Reminder: {invoice number}" onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} />
          </Field>
        </div>
        <RichTextEditor value={form.bodyHtml} onChange={(html) => setForm((f) => ({ ...f, bodyHtml: html }))} placeholder="Dear {contact name}, …" />
        <p className="muted templates__gaps">Gaps you can use (filled in when you pick the template): {GAPS.map((g) => <code key={g}>{g}</code>)}</p>
        <label className="form__check">
          <input type="checkbox" checked={form.isShared} onChange={(e) => setForm((f) => ({ ...f, isShared: e.target.checked }))} />
          Share with everyone in the company
        </label>
      </div>
    </Modal>
  );
}

// Mail → Templates: mine and the company's shared ones. Only the creator edits a template.
export default function Templates() {
  const { user } = useAuth();
  const toast = useToast();
  const { data, reload } = useApi('/api/mail/templates');
  const [editing, setEditing] = useState(null); // { template } | { template: null }

  const remove = async (t) => {
    if (!window.confirm(`Delete the “${t.name}” template?`)) return;
    try {
      await api(`/api/mail/templates/${t.id}`, { method: 'DELETE' });
      reload();
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (!data) return <div className="page-loader"><span className="page-loader__spinner" /></div>;
  return (
    <>
      <div className="toolbar">
        <p className="muted">Reusable emails. Pick one while writing and the gaps fill in for that customer or invoice.</p>
        <button type="button" className="btn btn--primary" onClick={() => setEditing({ template: null })}><Plus size={18} /> New template</button>
      </div>
      {!data.length ? (
        <div className="card"><EmptyState icon={FileText} title="No templates yet" text="e.g. “Payment reminder” or “Welcome to the team”." /></div>
      ) : (
        <div className="templates">
          {data.map((t) => (
            <article key={t.id} className="card card__body templates__item">
              <header>
                <h3>{t.name}</h3>
                <Badge tone={t.is_shared ? 'blue' : 'gray'}>{t.is_shared ? 'Shared' : 'Only me'}</Badge>
              </header>
              <p className="templates__subject">{t.subject}</p>
              <small className="muted">by {t.created_by_name}</small>
              {Number(t.created_by) === Number(user?.id) && (
                <div className="row-actions">
                  <button type="button" className="btn btn--outline btn--sm" onClick={() => setEditing({ template: t })}><Pencil size={15} /> Edit</button>
                  <button type="button" className="icon-btn" onClick={() => remove(t)} aria-label={`Delete ${t.name}`}><Trash2 size={16} /></button>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
      {editing && <TemplateModal template={editing.template} onClose={() => setEditing(null)} onSaved={reload} />}
    </>
  );
}
