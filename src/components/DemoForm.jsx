import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import Field from './Field.jsx';
import { api } from '../api/client.js';
import './DemoForm.css';

const SIZES = ['1-10', '11-50', '51-200', '201-500', '500+'];

// "Book a demo" on the home page → the super admins' Demo requests inbox (and their email)
export default function DemoForm() {
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', company: '', companySize: '', message: '', website: '' });
  const [errors, setErrors] = useState({});
  const [done, setDone] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await api('/api/site/demo-requests', { method: 'POST', body: { ...form, companySize: form.companySize || null } });
      setDone(r.message);
    } catch (err) {
      setErrors(err.errors || { fullName: err.message });
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="demo-form demo-form--done" role="status">
        <CheckCircle2 size={36} />
        <h3>Request received</h3>
        <p>{done}</p>
      </div>
    );
  }

  return (
    <form className="demo-form form" onSubmit={submit} noValidate>
      <div className="form__row">
        <Field label="Your name" name="demo-name" error={errors.fullName}>
          <input id="demo-name" className="field__input" autoComplete="name" value={form.fullName} onChange={set('fullName')} />
        </Field>
        <Field label="Work email" name="demo-email" error={errors.email}>
          <input id="demo-email" type="email" className="field__input" autoComplete="email" value={form.email} onChange={set('email')} />
        </Field>
      </div>
      <div className="form__row">
        <Field label="Phone" name="demo-phone" optional error={errors.phone}>
          <input id="demo-phone" type="tel" className="field__input" autoComplete="tel" value={form.phone} onChange={set('phone')} />
        </Field>
        <Field label="Company" name="demo-company" optional>
          <input id="demo-company" className="field__input" autoComplete="organization" value={form.company} onChange={set('company')} />
        </Field>
      </div>
      <Field label="How many staff?" name="demo-size" optional>
        <select id="demo-size" className="field__input" value={form.companySize} onChange={set('companySize')}>
          <option value="">Choose…</option>
          {SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </Field>
      <Field label="Anything we should know?" name="demo-message" optional>
        <textarea id="demo-message" rows={3} className="field__input" value={form.message} maxLength={1000} onChange={set('message')} placeholder="e.g. 3 branches, we want payroll and clock-in" />
      </Field>
      {/* Hidden from people; bots fill it in and are ignored */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="demo-form__trap" value={form.website} onChange={set('website')} aria-hidden="true" />
      <button type="submit" className="btn btn--primary btn--block" disabled={busy}>{busy ? 'Sending…' : 'Book my demo'}</button>
    </form>
  );
}
