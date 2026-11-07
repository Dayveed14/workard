import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import AuthLayout from '../../components/AuthLayout.jsx';
import PasswordInput from '../../components/PasswordInput.jsx';
import PasswordRules from '../../components/PasswordRules.jsx';
import Field from '../../components/Field.jsx';
import { api } from '../../api/client.js';
import { useApi } from '../../hooks/useApi.js';

// /admin/setup/:token — a new super admin chooses their password (link from the email)
export default function AdminSetup() {
  const { token } = useParams();
  const { data, error } = useApi(`/api/admin/auth/setup/${token}`);
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api(`/api/admin/auth/setup/${token}`, { method: 'POST', body: { password } });
      setDone(true);
    } catch (err) {
      setErrors(err.errors?.password ? err.errors : { password: err.message });
    } finally {
      setBusy(false);
    }
  };

  if (error) {
    return (
      <AuthLayout title="Link expired" subtitle={error}>
        <Link to="/admin/login" className="btn btn--outline btn--block">Go to admin log-in</Link>
      </AuthLayout>
    );
  }
  if (done) {
    return (
      <AuthLayout title="You’re all set" subtitle="Your password is saved.">
        <p className="admin-setup__ok"><CheckCircle2 size={18} /> Log in with your email, your new password and the code we email you.</p>
        <Link to="/admin/login" className="btn btn--primary btn--block">Log in</Link>
      </AuthLayout>
    );
  }
  return (
    <AuthLayout title="Welcome to Workard admin" subtitle={data ? `Choose a password for ${data.email}.` : ' '}>
      <form className="form" onSubmit={submit} noValidate>
        {errors.form && <div className="form__alert"><AlertCircle size={18} /> {errors.form}</div>}
        <Field label="New password" name="password" error={errors.password}>
          <PasswordInput id="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        <PasswordRules password={password} />
        <button type="submit" className="btn btn--primary btn--block form__submit" disabled={busy || !data}>Save password</button>
      </form>
    </AuthLayout>
  );
}
