import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowRight, Check } from 'lucide-react';
import AuthLayout from '../components/AuthLayout.jsx';
import PasswordInput from '../components/PasswordInput.jsx';
import OtpStep from '../components/OtpStep.jsx';
import Field from '../components/Field.jsx';
import PasswordRules, { passwordIsValid } from '../components/PasswordRules.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../api/client.js';
import { PLANS } from '../config/plans.js';
import { formatMoney } from '../utils/format.js';
import './Register.css';

const initial = { fullName: '', organizationName: '', email: '', phone: '', size: '', password: '', plan: 'business' };

// Step 1: details → Step 2: 6-digit code from email
export default function Register() {
  const { startRegister, verifyOtp } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(initial);
  const [agree, setAgree] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [challenge, setChallenge] = useState(null);
  // Is billing switched on (server: BILLING_ENABLED)? Off → no plan to choose, Workard is free.
  const [billing, setBilling] = useState({ enabled: false, trialDays: 14 });

  useEffect(() => {
    api('/api/billing/config').then(setBilling).catch(() => {});
  }, []);

  // /signup?plan=starter (from the home page pricing) picks that plan.
  // Read after the first render so the prerendered page and the browser match.
  useEffect(() => {
    const plan = new URLSearchParams(window.location.search).get('plan');
    if (PLANS.some((p) => p.id === plan)) setForm((f) => ({ ...f, plan }));
  }, []);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((er) => ({ ...er, [name]: undefined }));
  };

  const validate = () => {
    const next = {};
    if (form.fullName.trim().length < 2) next.fullName = 'Enter your full name';
    if (form.organizationName.trim().length < 2) next.organizationName = 'Enter your business name';
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) next.email = 'Enter a valid email address';
    if (form.phone && !/^\+?[0-9\s-]{7,20}$/.test(form.phone.trim())) next.phone = 'Enter a valid phone number';
    if (!passwordIsValid(form.password)) next.password = 'Password does not meet the requirements';
    if (!agree) next.agree = 'Please accept the Privacy Policy to continue';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!validate()) return;
    setSubmitting(true);
    try {
      setChallenge(
        await startRegister({
          fullName: form.fullName.trim(),
          organizationName: form.organizationName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          size: form.size,
          password: form.password,
          plan: billing.enabled ? form.plan : undefined,
        })
      );
    } catch (err) {
      setErrors(err.errors || {});
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Verified → straight into the app (free, or on the free trial — they pay later from Billing)
  const onVerify = async (code) => {
    await verifyOtp(challenge.challengeToken, code);
    navigate('/dashboard', { replace: true });
  };

  if (challenge) {
    return (
      <AuthLayout title="Verify your email" subtitle="One last step — confirm this email belongs to you.">
        <OtpStep challenge={challenge} onSubmit={onVerify} submitLabel="Verify & continue" />
      </AuthLayout>
    );
  }

  const input = (name, props = {}) => (
    <input
      id={name}
      name={name}
      className="field__input"
      value={form[name]}
      onChange={onChange}
      aria-invalid={!!errors[name]}
      {...props}
    />
  );

  return (
    <AuthLayout
      title="Create your account"
      subtitle={
        billing.enabled
          ? `Try any plan free for ${billing.trialDays} days — no card needed. Pay monthly or yearly when you’re ready.`
          : 'Set up your organisation in a minute. Workard is free during early access.'
      }
      footer={
        <>
          Already have an account? <Link to="/login">Log in</Link>
        </>
      }
    >
      <form className="form" onSubmit={onSubmit} noValidate>
        {formError && (
          <div className="form__alert" role="alert">
            <AlertCircle size={18} /> {formError}
          </div>
        )}

        {billing.enabled && (
        <fieldset className="plan-pick">
          <legend className="field__label">Plan — {billing.trialDays} days free, then monthly or yearly</legend>
          {PLANS.map((p) => (
            <label key={p.id} className={`plan-pick__option ${form.plan === p.id ? 'is-on' : ''}`}>
              <input type="radio" name="plan" value={p.id} checked={form.plan === p.id} onChange={onChange} />
              <span className="plan-pick__name">
                {p.name}
                {form.plan === p.id && <Check size={14} />}
              </span>
              <strong>{formatMoney(p.prices.monthly, { decimals: false })}</strong>
              <small>/ month</small>
            </label>
          ))}
          {errors.plan && <span className="field__error">{errors.plan}</span>}
          <p className="plan-pick__note">
            {PLANS.find((p) => p.id === form.plan)?.items.slice(0, 3).join(' · ')}. <Link to="/#pricing">Compare plans</Link>
          </p>
        </fieldset>
        )}

        <Field label="Full name" name="fullName" error={errors.fullName}>
          {input('fullName', { placeholder: 'Ada Okafor', autoComplete: 'name' })}
        </Field>

        <div className="form__row">
          <Field label="Business name" name="organizationName" error={errors.organizationName}>
            {input('organizationName', { placeholder: 'Ada Fashion House', autoComplete: 'organization' })}
          </Field>
          <Field label="Team size" name="size" optional>
            <select id="size" name="size" className="field__input" value={form.size} onChange={onChange}>
              <option value="">Select</option>
              <option value="1-10">1–10</option>
              <option value="11-50">11–50</option>
              <option value="51-200">51–200</option>
              <option value="201-500">201–500</option>
              <option value="500+">500+</option>
            </select>
          </Field>
        </div>

        <div className="form__row">
          <Field label="Work email" name="email" error={errors.email}>
            {input('email', { type: 'email', placeholder: 'you@business.com', autoComplete: 'email' })}
          </Field>
          <Field label="Phone" name="phone" error={errors.phone} optional>
            {input('phone', { type: 'tel', placeholder: '0803 000 0000', autoComplete: 'tel' })}
          </Field>
        </div>

        <Field label="Password" name="password" error={errors.password}>
          <PasswordInput
            id="password"
            name="password"
            placeholder="Create a password"
            autoComplete="new-password"
            value={form.password}
            onChange={onChange}
          />
          <PasswordRules password={form.password} />
        </Field>

        <Field name="agree" error={errors.agree}>
          <label className="form__check">
            <input
              type="checkbox"
              checked={agree}
              onChange={(e) => {
                setAgree(e.target.checked);
                if (errors.agree) setErrors((er) => ({ ...er, agree: undefined }));
              }}
            />
            <span>
              I agree to Workard’s <a href="/privacy" target="_blank" rel="noreferrer">Privacy Policy</a>.
            </span>
          </label>
        </Field>

        <button type="submit" className="btn btn--success btn--block form__submit" disabled={submitting}>
          {submitting ? <span className="form__spinner" aria-label="Creating account" /> : <>Continue <ArrowRight size={18} /></>}
        </button>
      </form>
    </AuthLayout>
  );
}
