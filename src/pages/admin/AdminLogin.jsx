import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import AuthLayout from '../../components/AuthLayout.jsx';
import PasswordInput from '../../components/PasswordInput.jsx';
import OtpStep from '../../components/OtpStep.jsx';
import Field from '../../components/Field.jsx';
import { useAdmin } from './AdminAuth.jsx';

// /admin/login — Workard super admins only: password, then a code by email
export default function AdminLogin() {
  const { status, startLogin, verify } = useAdmin();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [challenge, setChallenge] = useState(null);

  if (status === 'in') return <Navigate to="/admin" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      setChallenge(await startLogin({ email: form.email.trim(), password: form.password }));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (challenge) {
    return (
      <AuthLayout title="Check your email" subtitle="Enter the code we sent to finish logging in to the admin area.">
        <OtpStep
          challenge={challenge}
          resendPath="/api/admin/auth/resend"
          submitLabel="Verify & open admin"
          onBack={() => setChallenge(null)}
          onSubmit={async (code) => {
            await verify(challenge.challengeToken, code);
            navigate('/admin', { replace: true });
          }}
        />
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Workard admin" subtitle="For the Workard team only.">
      <form className="form" onSubmit={submit} noValidate>
        {error && <div className="form__alert" role="alert"><AlertCircle size={18} /> {error}</div>}
        <Field label="Email address" name="email">
          <input id="email" type="email" className="field__input" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </Field>
        <Field label="Password" name="password">
          <PasswordInput id="password" autoComplete="current-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </Field>
        <button type="submit" className="btn btn--primary btn--block form__submit" disabled={busy}>
          {busy ? <span className="form__spinner" /> : <>Continue <ArrowRight size={18} /></>}
        </button>
        <p className="login__secure"><ShieldCheck size={14} /> Every log-in also needs a code from your email.</p>
      </form>
    </AuthLayout>
  );
}
