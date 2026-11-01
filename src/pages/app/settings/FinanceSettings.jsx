import { useEffect, useState } from 'react';
import { Eye, EyeOff, Pencil, Plus } from 'lucide-react';
import Field from '../../../components/Field.jsx';
import Badge from '../../../components/Badge.jsx';
import { api } from '../../../api/client.js';
import { useApi } from '../../../hooks/useApi.js';
import { useToast } from '../../../context/ToastContext.jsx';

// Invoice numbering, bank details that print on invoices, and income/expense categories
export default function FinanceSettings() {
  const toast = useToast();
  const { data: settings } = useApi('/api/invoices/settings');
  const { data: categories, reload: reloadCategories } = useApi('/api/finance/categories');
  const [form, setForm] = useState(null);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [newCat, setNewCat] = useState({ type: 'expense', name: '' });

  useEffect(() => {
    if (settings) {
      setForm({
        prefix: settings.prefix,
        defaultDueDays: settings.default_due_days,
        defaultTaxRate: Number(settings.default_tax_rate),
        bankName: settings.bank_name || '',
        accountName: settings.account_name || '',
        accountNumber: settings.account_number || '',
        footerNote: settings.footer_note || '',
      });
    }
  }, [settings]);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api('/api/invoices/settings', { method: 'PUT', body: form });
      toast.success('Invoice settings saved');
      setErrors({});
    } catch (err) {
      setErrors(err.errors || {});
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const addCategory = async (e) => {
    e.preventDefault();
    if (!newCat.name.trim()) return;
    try {
      await api('/api/finance/categories', { method: 'POST', body: newCat });
      toast.success('Category added');
      setNewCat((c) => ({ ...c, name: '' }));
      reloadCategories();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const updateCategory = async (c, changes) => {
    try {
      await api(`/api/finance/categories/${c.id}`, { method: 'PUT', body: { name: c.name, isActive: !!c.is_active, ...changes } });
      reloadCategories();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const input = (name, label, props = {}, optional = true) => (
    <Field label={label} name={name} error={errors[name]} optional={optional}>
      <input id={name} name={name} className="field__input" value={form[name]} onChange={onChange} {...props} />
    </Field>
  );

  return (
    <div className="settings__grid">
      {form && (
        <form className="card" onSubmit={save}>
          <header className="card__header"><h2>Invoices</h2></header>
          <div className="card__body form form--flush">
            <div className="form__row form__row--3">
              {input('prefix', 'Number prefix', { placeholder: 'INV-' }, false)}
              {input('defaultDueDays', 'Due after (days)', { type: 'number', min: 0 }, false)}
              {input('defaultTaxRate', 'Default VAT (%)', { type: 'number', min: 0, step: '0.01' }, false)}
            </div>
            <p className="muted">Next invoice: <strong>{form.prefix}{String(settings.next_number).padStart(4, '0')}</strong></p>

            <p className="form__section">Bank details (printed on every invoice)</p>
            <div className="form__row">
              {input('bankName', 'Bank', { placeholder: 'e.g. United Bank for Africa' })}
              {input('accountNumber', 'Account number', { inputMode: 'numeric', maxLength: 10 })}
            </div>
            {input('accountName', 'Account name')}
            <Field label="Footer note" name="footerNote" optional hint="e.g. RC number, payment terms">
              <textarea id="footerNote" name="footerNote" className="field__input" value={form.footerNote} onChange={onChange} />
            </Field>
            <div>
              <button type="submit" className="btn btn--primary" disabled={busy}>{busy ? 'Saving…' : 'Save invoice settings'}</button>
            </div>
          </div>
        </form>
      )}

      <section className="card">
        <header className="card__header"><h2>Income & expense categories</h2></header>
        <ul className="settings__list">
          {(categories || []).map((c) => (
            <li key={c.id}>
              <span className="settings__list-text">
                <strong>{c.name}</strong>
                <span>{c.entry_count} entr{Number(c.entry_count) === 1 ? 'y' : 'ies'}</span>
              </span>
              <Badge tone={c.type === 'income' ? 'blue' : 'amber'}>{c.type === 'income' ? 'Income' : 'Expense'}</Badge>
              {!c.is_active && <Badge tone="gray">Hidden</Badge>}
              <button
                type="button"
                className="icon-btn"
                aria-label="Rename"
                onClick={() => {
                  const name = window.prompt('Rename category', c.name);
                  if (name && name.trim() !== c.name) updateCategory(c, { name: name.trim() });
                }}
              >
                <Pencil size={16} />
              </button>
              <button type="button" className="icon-btn" aria-label={c.is_active ? 'Hide' : 'Show'} onClick={() => updateCategory(c, { isActive: !c.is_active })}>
                {c.is_active ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </li>
          ))}
        </ul>
        <form className="settings__inline" onSubmit={addCategory}>
          <select className="field__input" value={newCat.type} onChange={(e) => setNewCat((c) => ({ ...c, type: e.target.value }))} aria-label="Category type" style={{ width: 130 }}>
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
          <input className="field__input" placeholder="New category" value={newCat.name} onChange={(e) => setNewCat((c) => ({ ...c, name: e.target.value }))} aria-label="New category name" />
          <button type="submit" className="btn btn--primary btn--sm"><Plus size={16} /> Add</button>
        </form>
      </section>
    </div>
  );
}
