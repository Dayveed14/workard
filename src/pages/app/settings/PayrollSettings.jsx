import { useEffect, useState } from 'react';
import { CheckCircle2, Copy, KeyRound, Unplug } from 'lucide-react';
import Field from '../../../components/Field.jsx';
import { api } from '../../../api/client.js';
import { useApi } from '../../../hooks/useApi.js';
import { useAuth } from '../../../context/AuthContext.jsx';
import { useToast } from '../../../context/ToastContext.jsx';

// Statutory deductions (PAYE, pension, NHF) and the business's own Paystack account for paying salaries
export default function PayrollSettings() {
  const toast = useToast();
  const { can } = useAuth();
  const { data: settings, setData } = useApi('/api/payroll/settings');
  const [form, setForm] = useState(null);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [secretKey, setSecretKey] = useState('');
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    if (settings) {
      setForm({
        payDay: settings.payDay,
        payeEnabled: settings.payeEnabled,
        pensionEnabled: settings.pensionEnabled,
        pensionEmployeeRate: settings.pensionEmployeeRate,
        pensionEmployerRate: settings.pensionEmployerRate,
        nhfEnabled: settings.nhfEnabled,
        nhfRate: settings.nhfRate,
      });
    }
  }, [settings]);

  if (!form) return <div className="page-loader"><span className="page-loader__spinner" /></div>;

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
  const canManage = Boolean(can('payroll.manage'));
  const canConnect = Boolean(can('payroll.approve'));

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      setData(await api('/api/payroll/settings', { method: 'PUT', body: form }));
      toast.success('Payroll settings saved');
      setErrors({});
    } catch (err) {
      setErrors(err.errors || {});
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const connect = async (e) => {
    e.preventDefault();
    setConnecting(true);
    try {
      setData(await api('/api/payroll/settings/paystack', { method: 'POST', body: { secretKey: secretKey.trim() } }));
      setSecretKey('');
      toast.success('Paystack connected');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setConnecting(false);
    }
  };

  const disconnect = async () => {
    if (!window.confirm('Disconnect Paystack? You can still pay salaries by bank upload.')) return;
    try {
      setData(await api('/api/payroll/settings/paystack', { method: 'DELETE' }));
      toast.success('Paystack disconnected');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const copyWebhook = async () => {
    try {
      await navigator.clipboard.writeText(settings.webhookUrl);
      toast.success('Webhook URL copied');
    } catch {
      toast.error('Could not copy — select the text and copy it');
    }
  };

  const rate = (name, label) => (
    <Field label={label} name={name} error={errors[name]}>
      <input id={name} name={name} type="number" min="0" max="100" step="0.01" className="field__input" value={form[name]} onChange={onChange} disabled={!canManage} />
    </Field>
  );

  return (
    <div className="settings__grid">
      <form className="card card__body form form--flush" onSubmit={save}>
        <h2 className="settings__title">Deductions</h2>
        <Field label="Usual pay day" name="payDay" error={errors.payDay} hint="Day of the month salaries are paid">
          <input id="payDay" name="payDay" type="number" min="1" max="31" className="field__input" value={form.payDay} onChange={onChange} disabled={!canManage} />
        </Field>

        <label className="form__check">
          <input type="checkbox" name="payeEnabled" checked={form.payeEnabled} onChange={onChange} disabled={!canManage} />
          <span>Deduct PAYE tax (Nigeria Tax Act 2025 bands)</span>
        </label>

        <label className="form__check">
          <input type="checkbox" name="pensionEnabled" checked={form.pensionEnabled} onChange={onChange} disabled={!canManage} />
          <span>Contributory pension (required by law for 3 or more staff)</span>
        </label>
        {form.pensionEnabled && (
          <div className="form__row">
            {rate('pensionEmployeeRate', 'Employee rate (%)')}
            {rate('pensionEmployerRate', 'Employer rate (%)')}
          </div>
        )}

        <label className="form__check">
          <input type="checkbox" name="nhfEnabled" checked={form.nhfEnabled} onChange={onChange} disabled={!canManage} />
          <span>National Housing Fund — only for staff who opt in on their Pay tab</span>
        </label>
        {form.nhfEnabled && rate('nhfRate', 'NHF rate (% of basic)')}

        <p className="muted">Pension is worked out on basic + housing + transport. Minimum-wage earners pay no PAYE.</p>
        {canManage && (
          <div>
            <button type="submit" className="btn btn--primary" disabled={busy}>{busy ? 'Saving…' : 'Save settings'}</button>
          </div>
        )}
      </form>

      <section className="card card__body form form--flush">
        <h2 className="settings__title">Pay salaries with Paystack</h2>
        {settings.paystackConnected ? (
          <>
            <p className="settings__connected">
              <CheckCircle2 size={18} /> Connected — secret key ending <strong>{settings.paystackKeyLast4}</strong>
            </p>
            <p className="muted">Approved payrolls can be sent straight from your Paystack balance to each person’s bank account.</p>
          </>
        ) : (
          <p className="muted">
            Use your <strong>own</strong> Paystack account. The money goes from your Paystack balance to your staff — Workard never holds it.
            Without Paystack you can still download a bank schedule and upload it to your bank.
          </p>
        )}

        <ol className="settings__steps">
          <li>In Paystack, go to <strong>Settings → Preferences</strong> and turn off <em>“Confirm transfers before sending”</em> (OTP), so bulk transfers can go through.</li>
          <li>
            In <strong>Settings → API Keys & Webhooks</strong>, set the webhook URL to:
            <div className="settings__copy">
              <code>{settings.webhookUrl}</code>
              <button type="button" className="icon-btn" onClick={copyWebhook} aria-label="Copy webhook URL"><Copy size={16} /></button>
            </div>
            This is how Paystack tells Workard each salary arrived.
          </li>
          <li>Copy your <strong>secret key</strong> and paste it below. It’s stored encrypted and never shown again.</li>
        </ol>

        {canConnect ? (
          settings.paystackConnected ? (
            <div className="settings__helper">
              <button type="button" className="btn btn--outline btn--sm settings__danger" onClick={disconnect}><Unplug size={16} /> Disconnect</button>
              <span className="muted">To change the key, disconnect and connect again.</span>
            </div>
          ) : (
            <form onSubmit={connect} className="settings__inline-form">
              <input
                className="field__input"
                type="password"
                autoComplete="off"
                placeholder="sk_live_…"
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                aria-label="Paystack secret key"
              />
              <button type="submit" className="btn btn--primary" disabled={connecting || !secretKey.trim()}>
                <KeyRound size={16} /> {connecting ? 'Checking…' : 'Connect'}
              </button>
            </form>
          )
        ) : (
          <p className="muted">Only someone who can approve payroll (e.g. the Owner) can connect Paystack.</p>
        )}
      </section>
    </div>
  );
}
