import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import PageHeader from '../../components/PageHeader.jsx';
import Field from '../../components/Field.jsx';
import Badge from '../../components/Badge.jsx';
import { api } from '../../api/client.js';
import { useApi } from '../../hooks/useApi.js';
import { useToast } from '../../context/ToastContext.jsx';
import { formatDate, timeAgo } from '../../utils/format.js';
import { useAdmin } from './AdminAuth.jsx';

// /admin/admins — Workard's super admins. Everyone here has the same rights.
export default function AdminAdmins() {
  const toast = useToast();
  const { admin: me } = useAdmin();
  const { data, reload } = useApi('/api/admin/admins');
  const [form, setForm] = useState({ fullName: '', email: '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  const add = async () => {
    setBusy(true);
    try {
      const r = await api('/api/admin/admins', { method: 'POST', body: form });
      toast.success(r.setupLink ? 'Added — they’ve been emailed a link to set their password' : 'Added — they log in with their usual Workard password');
      setForm({ fullName: '', email: '' });
      setErrors({});
      reload();
    } catch (err) {
      setErrors(err.errors || { email: err.message });
    } finally {
      setBusy(false);
    }
  };

  const remove = async (a) => {
    if (!window.confirm(`Remove ${a.full_name} as a super admin? Their normal Workard account (if any) stays.`)) return;
    try {
      await api(`/api/admin/admins/${a.user_id}`, { method: 'DELETE' });
      toast.success('Removed');
      reload();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <>
      <PageHeader title="Super admins" subtitle="Everyone here can do everything in the admin area — add only people you trust." />
      <section className="card card__body" style={{ marginBottom: 16 }}>
        <div className="form form--flush">
          <div className="form__row">
            <Field label="Name" name="fullName" error={errors.fullName}>
              <input id="fullName" className="field__input" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
            </Field>
            <Field label="Email" name="email" error={errors.email}>
              <input id="email" type="email" className="field__input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </Field>
          </div>
          <div><button type="button" className="btn btn--primary" disabled={busy} onClick={add}>Add super admin</button></div>
        </div>
      </section>
      <section className="card">
        {!data ? <div className="page-loader"><span className="page-loader__spinner" /></div> : (
          <ul className="adm-list">
            {data.map((a) => (
              <li key={a.user_id}>
                <span>
                  <strong>{a.full_name}</strong> {a.user_id === me?.id && <Badge tone="blue">You</Badge>} {Boolean(a.setup_pending) && <Badge tone="amber">Hasn’t set a password yet</Badge>}
                  <span className="adm-sub">{a.email} · added {formatDate(a.created_at)}{a.added_by_name && ` by ${a.added_by_name}`} · last log-in {a.last_login_at ? timeAgo(a.last_login_at) : 'never'}</span>
                </span>
                {a.user_id !== me?.id && <button type="button" className="icon-btn" onClick={() => remove(a)} aria-label={`Remove ${a.full_name}`}><Trash2 size={17} /></button>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
