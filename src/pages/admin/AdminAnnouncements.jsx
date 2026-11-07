import { useState } from 'react';
import PageHeader from '../../components/PageHeader.jsx';
import Field from '../../components/Field.jsx';
import { api } from '../../api/client.js';
import { useApi } from '../../hooks/useApi.js';
import { useToast } from '../../context/ToastContext.jsx';
import { formatDateTime } from '../../utils/format.js';

const AUDIENCES = { all: 'Every company owner', trial: 'Owners on a trial', paying: 'Owners who pay' };

// /admin/announcements — a message from Workard to company owners (bell, and email if ticked)
export default function AdminAnnouncements() {
  const toast = useToast();
  const { data, reload } = useApi('/api/admin/announcements');
  const [form, setForm] = useState({ title: '', body: '', audience: 'all', sendEmail: false });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  const send = async () => {
    if (!window.confirm(`Send to ${AUDIENCES[form.audience].toLowerCase()}${form.sendEmail ? ', by email too' : ''}?`)) return;
    setBusy(true);
    try {
      const r = await api('/api/admin/announcements', { method: 'POST', body: form });
      toast.success(`Sent to ${r.sentTo} owner${r.sentTo === 1 ? '' : 's'}`);
      setForm({ title: '', body: '', audience: 'all', sendEmail: false });
      setErrors({});
      reload();
    } catch (err) {
      setErrors(err.errors || {});
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader title="Announcements" subtitle="Tell company owners about maintenance, new features or changes." />
      <section className="card card__body" style={{ marginBottom: 16 }}>
        <div className="form form--flush">
          <Field label="Title" name="title" error={errors.title}>
            <input id="title" className="field__input" value={form.title} maxLength={200} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Maintenance on Saturday night" />
          </Field>
          <Field label="Message" name="body" error={errors.body}>
            <textarea id="body" rows={4} className="field__input" value={form.body} maxLength={2000} onChange={(e) => setForm({ ...form, body: e.target.value })} />
          </Field>
          <div className="form__row">
            <Field label="Who gets it" name="audience">
              <select id="audience" className="field__input" value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })}>
                {Object.entries(AUDIENCES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </Field>
          </div>
          <label className="form__check">
            <input type="checkbox" checked={form.sendEmail} onChange={(e) => setForm({ ...form, sendEmail: e.target.checked })} /> Email it as well (otherwise just the bell in Workard)
          </label>
          <div><button type="button" className="btn btn--primary" disabled={busy} onClick={send}>Send</button></div>
        </div>
      </section>
      <section className="card">
        <header className="card__header"><h2>Sent</h2></header>
        {!data?.length ? <p className="adm-empty">Nothing sent yet.</p> : (
          <ul className="adm-list">
            {data.map((a) => (
              <li key={a.id}>
                <span><strong>{a.title}</strong><span className="adm-sub">{a.body.slice(0, 140)}{a.body.length > 140 && '…'}</span></span>
                <span className="muted">{AUDIENCES[a.audience]} · {a.sent_to} owner{a.sent_to === 1 ? '' : 's'}{a.emailed ? ' · emailed' : ''} · {a.created_by_name}, {formatDateTime(a.created_at)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
