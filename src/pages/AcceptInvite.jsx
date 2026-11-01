import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, ArrowRight } from 'lucide-react';
import AuthLayout from '../components/AuthLayout.jsx';
import PasswordInput from '../components/PasswordInput.jsx';
import Field from '../components/Field.jsx';
import PasswordRules, { passwordIsValid } from '../components/PasswordRules.jsx';
import { useApi } from '../hooks/useApi.js';
import { useAuth } from '../context/AuthContext.jsx';

// /invite/:token — an employee sets up their login from the emailed link
export default function AcceptInvite() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { acceptInvite } = useAuth();
  const { data: invite, loading, error: loadError } = useApi(`/api/invites/${token}`);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (loading) return <div className="page-loader"><span className="page-loader__spinner" /></div>;

  if (loadError) {
    return (
      <AuthLayout title="Invitation not valid" subtitle={loadError}>
        <p className="auth__footer">
          Ask your administrator to send a new invite, or <Link to="/login">log in</Link>.
        </p>
      </AuthLayout>
    );
  }

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!invite.hasAccount && !passwordIsValid(password)) {
      return setError('Choose a password that meets the requirements');
    }
    setBusy(true);
    setError('');
    try {
      await acceptInvite(token, { password });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.errors?.password || err.message);
      setBusy(false);
    }
  };

  return (
    <AuthLayout
      title={`Join ${invite.organizationName}`}
      subtitle={`Hi ${invite.firstName}, you’ve been invited to Workard as ${invite.email}.`}
    >
      <form className="form" onSubmit={onSubmit} noValidate>
        {error && (
          <div className="form__alert" role="alert">
            <AlertCircle size={18} /> {error}
          </div>
        )}
        {invite.hasAccount && (
          <div className="form__alert form__alert--info">
            You already have a Workard account. Enter its password to join this organisation.
          </div>
        )}
        <Field label={invite.hasAccount ? 'Your Workard password' : 'Create a password'} name="password">
          <PasswordInput
            id="password"
            placeholder="Password"
            autoComplete={invite.hasAccount ? 'current-password' : 'new-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {!invite.hasAccount && <PasswordRules password={password} />}
        </Field>
        <button type="submit" className="btn btn--success btn--block form__submit" disabled={busy}>
          {busy ? <span className="form__spinner" aria-label="Joining" /> : <>Accept & continue <ArrowRight size={18} /></>}
        </button>
      </form>
    </AuthLayout>
  );
}
