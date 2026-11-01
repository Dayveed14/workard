import { useEffect, useState } from 'react';
import Field from '../../../components/Field.jsx';
import { api } from '../../../api/client.js';
import { useApi } from '../../../hooks/useApi.js';
import { useAuth } from '../../../context/AuthContext.jsx';
import { useToast } from '../../../context/ToastContext.jsx';

export default function GeneralSettings() {
  const toast = useToast();
  const { reloadSession } = useAuth();
  const { data } = useApi('/api/organization');
  const [form, setForm] = useState({ name: '', industry: '', size: '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (data) setForm({ name: data.name, industry: data.industry || '', size: data.size || '' });
  }, [data]);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api('/api/organization', { method: 'PATCH', body: form });
      await reloadSession();
      toast.success('Organisation updated');
      setErrors({});
    } catch (err) {
      setErrors(err.errors || {});
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="card settings__narrow" onSubmit={save}>
      <div className="card__body form form--flush">
        <Field label="Organisation name" name="name" error={errors.name}>
          <input id="name" name="name" className="field__input" value={form.name} onChange={onChange} />
        </Field>
        <div className="form__row">
          <Field label="Industry" name="industry" optional>
            <input id="industry" name="industry" className="field__input" placeholder="e.g. Retail" value={form.industry} onChange={onChange} />
          </Field>
          <Field label="Team size" name="size" optional>
            <select id="size" name="size" className="field__input" value={form.size} onChange={onChange}>
              <option value="">Select</option>
              {['1-10', '11-50', '51-200', '201-500', '500+'].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
        </div>
        <div>
          <button type="submit" className="btn btn--primary" disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</button>
        </div>
      </div>
    </form>
  );
}
