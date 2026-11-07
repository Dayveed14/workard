import { useEffect, useState } from 'react';
import PageHeader from '../../components/PageHeader.jsx';
import Field from '../../components/Field.jsx';
import { api } from '../../api/client.js';
import { useApi } from '../../hooks/useApi.js';
import { useToast } from '../../context/ToastContext.jsx';
import { formatMoney } from '../../utils/format.js';

const toNaira = (kobo) => String(Math.round(kobo / 100));
const toKobo = (naira) => Math.round(Number(String(naira).replace(/[^\d.]/g, '')) * 100);

// /admin/prices — plan prices and trial length, changed without a deploy
export default function AdminPricing() {
  const toast = useToast();
  const { data, setData } = useApi('/api/admin/pricing');
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (data) setForm({ trialDays: data.trialDays, prices: Object.fromEntries(data.plans.map((p) => [p.id, { monthly: toNaira(p.prices.monthly), yearly: toNaira(p.prices.yearly) }])) });
  }, [data]);

  if (!data || !form) return <div className="page-loader"><span className="page-loader__spinner" /></div>;
  const setPrice = (id, interval, v) => setForm((f) => ({ ...f, prices: { ...f.prices, [id]: { ...f.prices[id], [interval]: v } } }));

  const save = async () => {
    setBusy(true);
    try {
      const prices = Object.fromEntries(Object.entries(form.prices).map(([id, p]) => [id, { monthly: toKobo(p.monthly), yearly: toKobo(p.yearly) }]));
      setData({ ...(await api('/api/admin/pricing', { method: 'PUT', body: { prices, trialDays: Number(form.trialDays) } })), rebuildConfigured: data.rebuildConfigured });
      toast.success('Prices saved — new payments use them now');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const reset = async () => {
    if (!window.confirm('Go back to the prices and trial length in the code (config/plans.js)?')) return;
    setData({ ...(await api('/api/admin/pricing', { method: 'DELETE' })), rebuildConfigured: data.rebuildConfigured });
    toast.success('Back to the defaults');
  };

  return (
    <>
      <PageHeader title="Prices & trial" subtitle="What new customers pay. No deploy needed." />
      <section className="card card__body">
        <div className="table-wrap">
          <table className="adm-prices">
            <thead><tr><th>Plan</th><th>Monthly (₦)</th><th>Yearly — whole year (₦)</th><th>Yearly works out at</th></tr></thead>
            <tbody>
              {data.plans.map((p) => {
                const monthly = toKobo(form.prices[p.id].monthly);
                const yearly = toKobo(form.prices[p.id].yearly);
                const saving = monthly ? Math.round((1 - yearly / (monthly * 12)) * 100) : 0;
                return (
                  <tr key={p.id}>
                    <td><strong>{p.name}</strong><span className="adm-sub">default {formatMoney(p.defaults.monthly, { decimals: false })} / {formatMoney(p.defaults.yearly, { decimals: false })}</span></td>
                    <td><input className="field__input" inputMode="numeric" value={form.prices[p.id].monthly} onChange={(e) => setPrice(p.id, 'monthly', e.target.value)} aria-label={`${p.name} monthly`} /></td>
                    <td><input className="field__input" inputMode="numeric" value={form.prices[p.id].yearly} onChange={(e) => setPrice(p.id, 'yearly', e.target.value)} aria-label={`${p.name} yearly`} /></td>
                    <td>{formatMoney(Math.round(yearly / 12), { decimals: false })} / month<span className="adm-sub">{saving > 0 ? `saves ${saving}%` : saving < 0 ? 'costs MORE than monthly' : 'same as monthly'}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="form__row" style={{ marginTop: 18, maxWidth: 420 }}>
          <Field label="Free trial (days)" name="trialDays" hint={`Default ${data.defaultTrialDays}. Applies to companies that sign up from now on.`}>
            <input id="trialDays" type="number" min={1} max={90} className="field__input" value={form.trialDays} onChange={(e) => setForm({ ...form, trialDays: e.target.value })} />
          </Field>
        </div>
        <ul className="adm-notes">
          <li>New prices apply to new payments straight away (sign-up, upgrades, renewals people start themselves).</li>
          <li>Companies already paying by card keep paying their old price until they change plan — Paystack keeps their subscription as it is.</li>
          <li>
            {data.rebuildConfigured
              ? 'The website is rebuilt automatically (about a minute) so the home page shows the new prices.'
              : 'The home page loads the new prices when it opens. Add VERCEL_DEPLOY_HOOK_URL on the server to also rebuild the website automatically.'}
          </li>
          {!data.billingEnabled && <li><strong>Billing is switched off</strong> (BILLING_ENABLED=false) — nobody is charged yet.</li>}
        </ul>
        <div className="row-actions" style={{ marginTop: 16 }}>
          <button type="button" className="btn btn--primary" disabled={busy} onClick={save}>Save prices</button>
          <button type="button" className="btn btn--outline" onClick={reset}>Back to defaults</button>
        </div>
      </section>
    </>
  );
}
