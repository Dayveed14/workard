import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowRight } from 'lucide-react';
import AuthLayout from '../components/AuthLayout.jsx';
import PasswordInput from '../components/PasswordInput.jsx';
import OtpStep from '../components/OtpStep.jsx';
import Field from '../components/Field.jsx';
import PasswordRules, { passwordIsValid } from '../components/PasswordRules.jsx';
import { api } from '../api/client.js';
import { useToast } from '../context/ToastContext.jsx';

// Step 1: email → Step 2: code + new password
export default function ForgotPassword() {
  const navigate = useNavigate();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [challenge, setChallenge] = useState(null);

  const requestCode = async (e) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError('Enter a valid email address');
    setBusy(true);
    setError('');
    try {
      setChallenge(await api('/api/auth/forgot-password', { method: 'POST', body: { email: email.trim() } }));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const reset = async (code) => {
    if (!passwordIsValid(password)) throw new Error('Choose a new password that meets the requirements');
    await api('/api/auth/reset-password', {
      method: 'POST',
      body: { challengeToken: challenge.challengeToken, code, password },
    });
    toast.success('Password updated. Log in with your new password.');
    navigate('/login', { replace: true });
  };

  if (challenge) {
    return (
      <AuthLayout title="Set a new password" subtitle="Enter the code from your email and choose a new password.">
        <OtpStep challenge={challenge} onSubmit={reset} onBack={() => setChallenge(null)} submitLabel="Reset password">
          <Field label="New password" name="password">
            <PasswordInput
              id="password"
              placeholder="Create a new password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <PasswordRules password={password} />
          </Field>
        </OtpStep>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Forgot your password?"
      subtitle="Enter your email and we’ll send you a code to reset it."
      footer={
        <>
          Remembered it? <Link to="/login">Log in</Link>
        </>
      }
    >
      <form className="form" onSubmit={requestCode} noValidate>
        {error && (
          <div className="form__alert" role="alert">
            <AlertCircle size={18} /> {error}
          </div>
        )}
        <Field label="Email address" name="email">
          <input
            id="email"
            type="email"
            className="field__input"
            placeholder="you@business.com"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        <button type="submit" className="btn btn--primary btn--block form__submit" disabled={busy}>
          {busy ? <span className="form__spinner" aria-label="Sending" /> : <>Send code <ArrowRight size={18} /></>}
        </button>
      </form>
    </AuthLayout>
  );
}
