import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowRight } from 'lucide-react';
import AuthLayout from '../components/AuthLayout.jsx';
import PasswordInput from '../components/PasswordInput.jsx';
import OtpStep from '../components/OtpStep.jsx';
import Field from '../components/Field.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import './Login.css';

// Step 1: email + password → Step 2: 6-digit code from email
export default function Login() {
  const { startLogin, verifyOtp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [challenge, setChallenge] = useState(null);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((er) => ({ ...er, [name]: undefined }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    const next = {};
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) next.email = 'Enter a valid email address';
    if (!form.password) next.password = 'Enter your password';
    setErrors(next);
    if (Object.keys(next).length) return;

    setSubmitting(true);
    try {
      setChallenge(await startLogin({ email: form.email.trim(), password: form.password }));
    } catch (err) {
      setErrors(err.errors || {});
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const onVerify = async (code) => {
    await verifyOtp(challenge.challengeToken, code);
    navigate(location.state?.from || '/dashboard', { replace: true });
  };

  if (challenge) {
    return (
      <AuthLayout
        title={challenge.purpose === 'signup' ? 'Verify your email' : 'Check your email'}
        subtitle={
          challenge.purpose === 'signup'
            ? 'Your email isn’t verified yet. Enter the code to finish setting up.'
            : 'For your security, enter the code we just sent you.'
        }
      >
        <OtpStep challenge={challenge} onSubmit={onVerify} onBack={() => setChallenge(null)} submitLabel="Verify & log in" />
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Log in to your Workard account."
      footer={
        <>
          New to Workard? <Link to="/signup">Create a free account</Link>
        </>
      }
    >
      <form className="form" onSubmit={onSubmit} noValidate>
        {formError && (
          <div className="form__alert" role="alert">
            <AlertCircle size={18} /> {formError}
          </div>
        )}

        <Field label="Email address" name="email" error={errors.email}>
          <input
            id="email"
            name="email"
            type="email"
            className="field__input"
            placeholder="you@business.com"
            autoComplete="email"
            value={form.email}
            onChange={onChange}
            aria-invalid={!!errors.email}
          />
        </Field>

        <Field label="Password" name="password" error={errors.password}>
          <PasswordInput
            id="password"
            name="password"
            placeholder="Your password"
            autoComplete="current-password"
            value={form.password}
            onChange={onChange}
            aria-invalid={!!errors.password}
          />
        </Field>

        <Link to="/forgot-password" className="login__forgot">
          Forgot password?
        </Link>

        <button type="submit" className="btn btn--primary btn--block form__submit" disabled={submitting}>
          {submitting ? <span className="form__spinner" aria-label="Checking" /> : <>Continue <ArrowRight size={18} /></>}
        </button>

        <p className="login__secure">We’ll email you a 6-digit code to confirm it’s you.</p>
      </form>
    </AuthLayout>
  );
}
