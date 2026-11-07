import { useEffect, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import Field from '../../../components/Field.jsx';
import { api } from '../../../api/client.js';
import { useApi } from '../../../hooks/useApi.js';
import { useAuth } from '../../../context/AuthContext.jsx';
import { useToast } from '../../../context/ToastContext.jsx';
import { formatMoney } from '../../../utils/format.js';

// Settings → Loans & advances: this company's own rules.
// Every company starts on the defaults (loans up to 100% of a year's basic pay, 12 months, 5% flat;
// advances up to one month's basic, back from the next salary) and can change them here.
// Changes apply to NEW requests — loans already taken keep the terms they were given.
const toForm = (r) => ({
  loansEnabled: r.loansEnabled,
  loanMaxPercent: r.loanMaxPercent,
  loanMaxNaira: r.loanMaxKobo ? String(r.loanMaxKobo / 100) : '',
  loanMonths: r.loanMonths,
  loanInterestPercent: r.loanInterestBp / 100,
  advancesEnabled: r.advancesEnabled,
  advanceMaxPercent: r.advanceMaxPercent,
  advanceMonths: r.advanceMonths,
  advanceInterestPercent: r.advanceInterestBp / 100,
});

// What a loan looks like under these rules, for someone on ₦200,000 basic a month
function Example({ form }) {
  const basic = 200_000;
  const cap = Math.min((basic * 12 * Number(form.loanMaxPercent || 0)) / 100, form.loanMaxNaira ? Number(form.loanMaxNaira) : Infinity);
  const total = cap * (1 + Number(form.loanInterestPercent || 0) / 100);
  const months = Math.max(1, Number(form.loanMonths || 1));
  return (
    <p className="loan-example">
      Example: someone on <strong>{formatMoney(basic * 100, { decimals: false })}</strong> basic a month can borrow up to{' '}
      <strong>{formatMoney(cap * 100, { decimals: false })}</strong>, and repays {formatMoney(total * 100, { decimals: false })} —{' '}
      <strong>{formatMoney(Math.ceil(total / months) * 100, { decimals: false })}</strong> a month for {months} month{months === 1 ? '' : 's'}.
    </p>
  );
}

export default function LoanSettings() {
  const toast = useToast();
  const { can } = useAuth();
  const canManage = Boolean(can('payroll.manage'));
  const { data, setData } = useApi('/api/requests/settings');
  const [form, setForm] = useState(null);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (data) setForm(toForm(data));
  }, [data]);

  if (!form) return <div className="page-loader"><span className="page-loader__spinner" /></div>;
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      setData(await api('/api/requests/settings', { method: 'PUT', body: form }));
      setErrors({});
      toast.success('Saved — new requests use these rules');
    } catch (err) {
      setErrors(err.errors || {});
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const reset = async () => {
    if (!window.confirm('Go back to the default rules? (100% of a year’s basic, 12 months, 5% flat; advances up to one month’s basic)')) return;
    setData(await api('/api/requests/settings', { method: 'DELETE' }));
    setErrors({});
    toast.success('Back to the defaults');
  };

  const d = data.defaults;
  return (
    <form className="settings__grid" onSubmit={save}>
      <section className="card card__body form form--flush">
        <h2 className="settings__title">Staff loans</h2>
        <label className="form__check">
          <input type="checkbox" checked={form.loansEnabled} onChange={set('loansEnabled')} disabled={!canManage} /> Staff can ask for loans
        </label>
        {form.loansEnabled && (
          <>
            <div className="form__row">
              <Field label="Up to (% of a year’s basic pay)" name="loanMaxPercent" error={errors.loanMaxPercent} hint={`Default ${d.loanMaxPercent}%. All open loans together.`}>
                <input id="loanMaxPercent" type="number" min="1" max="500" className="field__input" value={form.loanMaxPercent} onChange={set('loanMaxPercent')} disabled={!canManage} />
              </Field>
              <Field label="But never more than (₦)" name="loanMaxNaira" optional error={errors.loanMaxNaira} hint="Leave empty for no fixed ceiling.">
                <input id="loanMaxNaira" type="number" min="1000" step="1000" className="field__input" value={form.loanMaxNaira} onChange={set('loanMaxNaira')} disabled={!canManage} placeholder="No ceiling" />
              </Field>
            </div>
            <div className="form__row">
              <Field label="Tenor (months)" name="loanMonths" error={errors.loanMonths} hint={`Default ${d.loanMonths}. Repaid through payroll.`}>
                <input id="loanMonths" type="number" min="1" max="60" className="field__input" value={form.loanMonths} onChange={set('loanMonths')} disabled={!canManage} />
              </Field>
              <Field label="Interest (% flat)" name="loanInterestPercent" error={errors.loanInterestPercent} hint={`Default ${d.loanInterestBp / 100}%. 0 = no interest.`}>
                <input id="loanInterestPercent" type="number" min="0" max="100" step="0.01" className="field__input" value={form.loanInterestPercent} onChange={set('loanInterestPercent')} disabled={!canManage} />
              </Field>
            </div>
            <Example form={form} />
          </>
        )}
      </section>

      <section className="card card__body form form--flush">
        <h2 className="settings__title">Salary advances</h2>
        <label className="form__check">
          <input type="checkbox" checked={form.advancesEnabled} onChange={set('advancesEnabled')} disabled={!canManage} /> Staff can ask for salary advances
        </label>
        {form.advancesEnabled && (
          <>
            <Field label="Up to (% of a month’s basic pay)" name="advanceMaxPercent" error={errors.advanceMaxPercent} hint={`Default ${d.advanceMaxPercent}%. One open advance at a time.`}>
              <input id="advanceMaxPercent" type="number" min="1" max="100" className="field__input" value={form.advanceMaxPercent} onChange={set('advanceMaxPercent')} disabled={!canManage} />
            </Field>
            <div className="form__row">
              <Field label="Taken back over (months)" name="advanceMonths" error={errors.advanceMonths} hint={`Default ${d.advanceMonths} — the next salary.`}>
                <input id="advanceMonths" type="number" min="1" max="6" className="field__input" value={form.advanceMonths} onChange={set('advanceMonths')} disabled={!canManage} />
              </Field>
              <Field label="Interest (%)" name="advanceInterestPercent" error={errors.advanceInterestPercent} hint="Default 0%.">
                <input id="advanceInterestPercent" type="number" min="0" max="100" step="0.01" className="field__input" value={form.advanceInterestPercent} onChange={set('advanceInterestPercent')} disabled={!canManage} />
              </Field>
            </div>
          </>
        )}
        <p className="muted loan-note">
          “Basic pay” is basic only — no housing, transport, allowances or bonuses. Changes apply to new requests; loans and advances already taken keep their terms.
          {data.isDefault ? ' You’re using the default rules.' : ''}
        </p>
        {canManage ? (
          <div className="row-actions">
            <button type="submit" className="btn btn--primary" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
            {!data.isDefault && <button type="button" className="btn btn--outline" onClick={reset}><RotateCcw size={15} /> Back to defaults</button>}
          </div>
        ) : (
          <p className="muted">Only people who manage payroll can change these.</p>
        )}
      </section>
    </form>
  );
}
