import { useEffect, useRef, useState } from 'react';
import { AlertCircle, ArrowLeft, MailCheck } from 'lucide-react';
import { api } from '../api/client.js';
import './OtpStep.css';

// The "enter the 6-digit code we emailed you" step.
// Used for sign up, log in and password reset.
//   onSubmit(code) → do the verification (throw an error to show it)
export default function OtpStep({ challenge, onSubmit, onBack, submitLabel = 'Verify', children }) {
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(60);
  const inputs = useRef([]);

  useEffect(() => {
    inputs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const code = digits.join('');

  const setDigit = (i, value) => {
    const clean = value.replace(/\D/g, '');
    if (clean.length > 1) {
      // Pasted the whole code
      const next = clean.slice(0, 6).split('');
      setDigits([...next, ...Array(6 - next.length).fill('')]);
      inputs.current[Math.min(next.length, 5)]?.focus();
      return;
    }
    const next = [...digits];
    next[i] = clean;
    setDigits(next);
    if (clean && i < 5) inputs.current[i + 1]?.focus();
  };

  const onKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) inputs.current[i - 1]?.focus();
  };

  const submit = async (e) => {
    e.preventDefault();
    if (code.length !== 6) return setError('Enter the 6-digit code');
    setBusy(true);
    setError('');
    try {
      await onSubmit(code);
    } catch (err) {
      setError(err.message);
      setBusy(false);
      if (err.status === 400) {
        setDigits(['', '', '', '', '', '']);
        inputs.current[0]?.focus();
      }
    }
  };

  const resend = async () => {
    setError('');
    try {
      await api('/api/auth/resend-otp', { method: 'POST', body: { challengeToken: challenge.challengeToken } });
      setCooldown(60);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <form className="form otp" onSubmit={submit} noValidate>
      <div className="otp__sent">
        <MailCheck size={20} />
        <span>
          We sent a 6-digit code to <strong>{challenge.email}</strong>. It expires in 10 minutes.
        </span>
      </div>

      {error && (
        <div className="form__alert" role="alert">
          <AlertCircle size={18} /> {error}
        </div>
      )}

      <div className="otp__inputs" aria-label="Verification code">
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => (inputs.current[i] = el)}
            className="otp__digit"
            inputMode="numeric"
            autoComplete={i === 0 ? 'one-time-code' : 'off'}
            maxLength={i === 0 ? 6 : 1}
            value={d}
            onChange={(e) => setDigit(i, e.target.value)}
            onKeyDown={(e) => onKeyDown(i, e)}
            aria-label={`Digit ${i + 1}`}
          />
        ))}
      </div>

      {children}

      <button type="submit" className="btn btn--primary btn--block form__submit" disabled={busy}>
        {busy ? <span className="form__spinner" aria-label="Verifying" /> : submitLabel}
      </button>

      <div className="otp__links">
        {onBack && (
          <button type="button" className="link-btn" onClick={onBack}>
            <ArrowLeft size={16} /> Back
          </button>
        )}
        <button type="button" className="link-btn" onClick={resend} disabled={cooldown > 0}>
          {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
        </button>
      </div>
    </form>
  );
}
