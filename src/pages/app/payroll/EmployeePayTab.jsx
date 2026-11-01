import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, BadgeCheck, Plus, Trash2 } from 'lucide-react';
import Field from '../../../components/Field.jsx';
import { api } from '../../../api/client.js';
import { useApi } from '../../../hooks/useApi.js';
import { useAuth } from '../../../context/AuthContext.jsx';
import { useToast } from '../../../context/ToastContext.jsx';
import { formatMoney } from '../../../utils/format.js';
import './EmployeePayTab.css';

const toNaira = (kobo) => (kobo ? Number(kobo) / 100 : '');

// The "Pay" tab on an employee profile: salary, extras, bank & pension details,
// and a live preview of a normal month's payslip (worked out by the server).
export default function EmployeePayTab({ employeeId }) {
  const toast = useToast();
  const { can } = useAuth();
  const canEdit = Boolean(can('payroll.manage'));
  const { data, loading, setData } = useApi(`/api/employees/${employeeId}/pay`);
  const { data: settings } = useApi('/api/payroll/settings');
  const { data: banks } = useApi(settings?.paystackConnected && canEdit ? '/api/payroll/banks' : null);

  const [form, setForm] = useState(null);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    if (!data) return;
    const p = data.pay || {};
    setForm({
      basic: toNaira(p.basic_kobo),
      housing: toNaira(p.housing_kobo),
      transport: toNaira(p.transport_kobo),
      annualRent: toNaira(p.annual_rent_kobo),
      nhfOptIn: !!p.nhf_opt_in,
      bankName: p.bank_name || '',
      bankCode: p.bank_code || '',
      accountNumber: p.account_number || '',
      accountName: p.account_name || '',
      pfaName: p.pfa_name || '',
      pensionPin: p.pension_pin || '',
      taxId: p.tax_id || '',
      items: data.items.map((i) => ({ type: i.type, name: i.name, amount: toNaira(i.amount_kobo) })),
    });
  }, [data]);

  if (loading || !form) return <div className="page-loader"><span className="page-loader__spinner" /></div>;

  const set = (name, value) => setForm((f) => ({ ...f, [name]: value }));
  const onChange = (e) => set(e.target.name, e.target.type === 'checkbox' ? e.target.checked : e.target.value);
  const setItem = (i, name, value) => set('items', form.items.map((item, x) => (x === i ? { ...item, [name]: value } : item)));

  const chooseBank = (code) => {
    const bank = banks?.find((b) => b.code === code);
    setForm((f) => ({ ...f, bankCode: code, bankName: bank?.name || '' }));
  };

  // Asks Paystack for the account holder's name, so salaries don't go to a wrong account
  const verify = async () => {
    setVerifying(true);
    try {
      const res = await api('/api/payroll/verify-account', { method: 'POST', body: { accountNumber: form.accountNumber, bankCode: form.bankCode } });
      set('accountName', res.accountName);
      toast.success(`Account belongs to ${res.accountName}`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setVerifying(false);
    }
  };

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const body = { ...form, items: form.items.filter((i) => i.name.trim() && Number(i.amount) > 0) };
      setData(await api(`/api/employees/${employeeId}/pay`, { method: 'PUT', body }));
      toast.success('Pay details saved');
      setErrors({});
    } catch (err) {
      setErrors(err.errors || {});
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const money = (name, label, props = {}) => (
    <Field label={label} name={name} error={errors[name]} optional={props.optional}>
      <input id={name} name={name} type="number" min="0" step="0.01" className="field__input" value={form[name]} onChange={onChange} disabled={!canEdit} placeholder="0.00" />
    </Field>
  );
  const text = (name, label, props = {}) => (
    <Field label={label} name={name} error={errors[name]} optional>
      <input id={name} name={name} className="field__input" value={form[name]} onChange={onChange} disabled={!canEdit} {...props} />
    </Field>
  );

  const pv = data.preview;

  return (
    <div className="emp-pay">
      <form className="card card__body form form--flush" onSubmit={save}>
        {error && <div className="form__alert"><AlertCircle size={18} /> {error}</div>}

        <p className="form__section">Monthly salary (₦)</p>
        <div className="form__row form__row--3">
          {money('basic', 'Basic')}
          {money('housing', 'Housing')}
          {money('transport', 'Transport')}
        </div>

        <p className="form__section">Extra monthly allowances & deductions</p>
        {form.items.length === 0 && <p className="muted">None — e.g. a phone allowance or a staff loan repayment.</p>}
        {form.items.map((item, i) => (
          <div key={i} className="emp-pay__item">
            <select className="field__input" value={item.type} onChange={(e) => setItem(i, 'type', e.target.value)} disabled={!canEdit} aria-label="Type">
              <option value="allowance">Allowance (+)</option>
              <option value="deduction">Deduction (−)</option>
            </select>
            <input className="field__input" placeholder="e.g. Phone allowance" value={item.name} onChange={(e) => setItem(i, 'name', e.target.value)} disabled={!canEdit} aria-label="Name" />
            <input className="field__input" type="number" min="0" step="0.01" placeholder="₦" value={item.amount} onChange={(e) => setItem(i, 'amount', e.target.value)} disabled={!canEdit} aria-label="Amount" />
            {canEdit && (
              <button type="button" className="icon-btn" onClick={() => set('items', form.items.filter((_, x) => x !== i))} aria-label="Remove">
                <Trash2 size={16} />
              </button>
            )}
          </div>
        ))}
        {canEdit && (
          <button type="button" className="btn btn--outline btn--sm emp-pay__add" onClick={() => set('items', [...form.items, { type: 'allowance', name: '', amount: '' }])}>
            <Plus size={16} /> Add allowance or deduction
          </button>
        )}

        <p className="form__section">Tax & pension</p>
        <div className="form__row form__row--3">
          {money('annualRent', 'Rent paid per year', { optional: true })}
          {text('taxId', 'Tax ID (TIN)')}
          {text('pfaName', 'Pension fund (PFA)', { placeholder: 'e.g. Stanbic IBTC Pensions' })}
        </div>
        <div className="form__row">
          {text('pensionPin', 'Pension PIN', { placeholder: 'PEN…' })}
          <label className="form__check emp-pay__nhf">
            <input type="checkbox" name="nhfOptIn" checked={form.nhfOptIn} onChange={onChange} disabled={!canEdit} />
            <span>Contributes to the National Housing Fund{settings && !settings.nhfEnabled && ' (NHF is off in payroll settings)'}</span>
          </label>
        </div>
        <p className="muted emp-pay__hint">Rent gives tax relief of 20% of the rent, up to ₦500,000 a year. Keep the receipt or lease on file.</p>

        <p className="form__section">Salary account</p>
        <div className="form__row form__row--3">
          {banks ? (
            <Field label="Bank" name="bankCode" error={errors.bankCode}>
              <select id="bankCode" className="field__input" value={form.bankCode} onChange={(e) => chooseBank(e.target.value)} disabled={!canEdit}>
                <option value="">Choose bank</option>
                {banks.map((b) => <option key={b.code} value={b.code}>{b.name}</option>)}
              </select>
            </Field>
          ) : (
            text('bankName', 'Bank', { placeholder: 'e.g. GTBank' })
          )}
          {text('accountNumber', 'Account number', { inputMode: 'numeric', maxLength: 10 })}
          {text('accountName', 'Account name')}
        </div>
        {banks && canEdit && (
          <div className="settings__helper">
            <button type="button" className="btn btn--outline btn--sm" onClick={verify} disabled={verifying || form.accountNumber.length !== 10 || !form.bankCode}>
              <BadgeCheck size={16} /> {verifying ? 'Checking…' : 'Check account name'}
            </button>
            <span className="muted">Confirms the account with the bank before any salary is sent.</span>
          </div>
        )}
        {!banks && settings && !settings.paystackConnected && (
          <p className="muted emp-pay__hint">
            To pay salaries automatically, connect Paystack in <Link to="/settings?tab=payroll">Settings → Payroll</Link> — then choose the bank from a list here.
          </p>
        )}

        {canEdit && (
          <div>
            <button type="submit" className="btn btn--primary" disabled={busy}>{busy ? 'Saving…' : 'Save pay details'}</button>
          </div>
        )}
      </form>

      <aside className="card emp-pay__preview">
        <header className="card__header"><h2>A normal month</h2></header>
        {pv ? (
          <dl className="card__body">
            <dt>Gross pay</dt><dd>{formatMoney(pv.gross)}</dd>
            <dt>PAYE tax</dt><dd>−{formatMoney(pv.paye)}</dd>
            <dt>Pension ({settings?.pensionEmployeeRate ?? 8}%)</dt><dd>−{formatMoney(pv.pensionEmployee)}</dd>
            {pv.nhf > 0 && (<><dt>NHF</dt><dd>−{formatMoney(pv.nhf)}</dd></>)}
            {pv.otherDeductions > 0 && (<><dt>Other deductions</dt><dd>−{formatMoney(pv.otherDeductions)}</dd></>)}
            <dt className="emp-pay__net">Take-home</dt><dd className="emp-pay__net">{formatMoney(pv.net)}</dd>
            <dt className="muted">Employer pension</dt><dd className="muted">{formatMoney(pv.pensionEmployer)}</dd>
            <dt className="muted">Cost to company</dt><dd className="muted">{formatMoney(pv.gross + pv.pensionEmployer)}</dd>
          </dl>
        ) : (
          <p className="card__body muted">Save a salary to see the take-home pay.</p>
        )}
        <p className="emp-pay__rules">Nigeria Tax Act 2025 rates (from Jan 2026). Rates are set in the server’s payroll rules file.</p>
      </aside>
    </div>
  );
}
