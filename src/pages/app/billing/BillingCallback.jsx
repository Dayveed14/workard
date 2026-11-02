import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle } from 'lucide-react';
import { api } from '../../../api/client.js';
import { useAuth } from '../../../context/AuthContext.jsx';
import './Billing.css';

// Paystack sends the owner back here: /billing/callback?reference=wkbill_…
// We ask the server to check the payment with Paystack (it never trusts this page's word).
export default function BillingCallback() {
  const navigate = useNavigate();
  const { reloadSession } = useAuth();
  const [state, setState] = useState({ phase: 'checking' }); // checking | paid | failed | pending

  useEffect(() => {
    const reference = new URLSearchParams(window.location.search).get('reference');
    if (!reference) {
      setState({ phase: 'failed', message: 'No payment reference was returned.' });
      return undefined;
    }
    let tries = 0;
    let timer;
    const check = async () => {
      tries += 1;
      try {
        const r = await api('/api/billing/verify', { method: 'POST', body: { reference } });
        if (r.status === 'paid') {
          await reloadSession();
          setState({ phase: 'paid' });
          timer = setTimeout(() => navigate('/dashboard', { replace: true }), 2500);
        } else if (r.status === 'failed') {
          setState({ phase: 'failed', message: 'The payment was not completed. No money was taken.' });
        } else if (tries < 6) {
          setState({ phase: 'pending' }); // Paystack still processing (e.g. bank transfer)
          timer = setTimeout(check, 3000);
        } else {
          setState({ phase: 'pending', final: true });
        }
      } catch (err) {
        setState({ phase: 'failed', message: err.message });
      }
    };
    check();
    return () => clearTimeout(timer);
  }, [navigate, reloadSession]);

  return (
    <div className="billing-callback card card__body">
      {state.phase === 'checking' && (
        <>
          <span className="page-loader__spinner" />
          <h1>Confirming your payment…</h1>
        </>
      )}
      {state.phase === 'pending' && (
        <>
          <span className="page-loader__spinner" />
          <h1>Waiting for Paystack</h1>
          <p className="muted">
            {state.final
              ? 'It’s taking longer than usual (bank transfers can take a few minutes). We’ll activate your plan as soon as Paystack confirms — you can refresh this page.'
              : 'Your bank is still confirming the payment…'}
          </p>
        </>
      )}
      {state.phase === 'paid' && (
        <>
          <CheckCircle2 size={48} className="billing-callback__ok" />
          <h1>Payment received — you’re all set</h1>
          <p className="muted">Your plan is active for the next year. Taking you to your dashboard…</p>
          <Link to="/dashboard" className="btn btn--primary">Go to dashboard</Link>
        </>
      )}
      {state.phase === 'failed' && (
        <>
          <XCircle size={48} className="billing-callback__bad" />
          <h1>Payment not completed</h1>
          <p className="muted">{state.message}</p>
          <Link to="/billing" className="btn btn--primary">Try again</Link>
        </>
      )}
    </div>
  );
}
