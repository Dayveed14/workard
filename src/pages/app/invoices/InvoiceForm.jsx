import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AlertCircle, Plus, Trash2 } from 'lucide-react';
import PageHeader from '../../../components/PageHeader.jsx';
import Field from '../../../components/Field.jsx';
import CustomerModal from '../../../components/CustomerModal.jsx';
import { api } from '../../../api/client.js';
import { useApi } from '../../../hooks/useApi.js';
import { useAuth } from '../../../context/AuthContext.jsx';
import { useToast } from '../../../context/ToastContext.jsx';
import { calculateTotals, formatMoney, todayString } from '../../../utils/format.js';
import './InvoiceForm.css';

const blankItem = () => ({ description: '', quantity: 1, unitPrice: '' });

function addDays(date, days) {
  const d = new Date(`${date}T12:00:00`);
  d.setDate(d.getDate() + Number(days || 0));
  return d.toISOString().slice(0, 10);
}

// /invoices/new  and  /invoices/:id/edit
export default function InvoiceForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { can } = useAuth();

  const { data: customers, reload: reloadCustomers } = useApi('/api/customers/options');
  const { data: settings } = useApi('/api/invoices/settings');
  const { data: existing } = useApi(isEdit ? `/api/invoices/${id}` : null);

  const [form, setForm] = useState({
    customerId: params.get('customerId') || '',
    issueDate: todayString(),
    dueDate: '',
    items: [blankItem()],
    discount: '',
    taxRate: '',
    notes: '',
  });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [addingCustomer, setAddingCustomer] = useState(false);

  // New invoice: fill defaults from settings (due date, VAT)
  useEffect(() => {
    if (!isEdit && settings) {
      setForm((f) => ({
        ...f,
        dueDate: f.dueDate || addDays(f.issueDate, settings.default_due_days),
        taxRate: f.taxRate === '' ? Number(settings.default_tax_rate) || '' : f.taxRate,
      }));
    }
  }, [settings, isEdit]);

  // Editing: load the invoice into the form (kobo → naira)
  useEffect(() => {
    if (existing) {
      setForm({
        customerId: existing.customer_id,
        issueDate: existing.issue_date,
        dueDate: existing.due_date,
        items: existing.items.map((i) => ({ description: i.description, quantity: Number(i.quantity), unitPrice: i.unit_price_kobo / 100 })),
        discount: existing.discount_kobo ? existing.discount_kobo / 100 : '',
        taxRate: Number(existing.tax_rate) || '',
        notes: existing.notes || '',
      });
    }
  }, [existing]);

  const set = (name, value) => setForm((f) => ({ ...f, [name]: value }));
  const setItem = (index, name, value) =>
    setForm((f) => ({ ...f, items: f.items.map((item, i) => (i === index ? { ...item, [name]: value } : item)) }));

  const totals = calculateTotals(form.items, form.discount, form.taxRate);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    const body = {
      ...form,
      discount: form.discount || 0,
      taxRate: form.taxRate || 0,
      items: form.items.filter((i) => i.description.trim() || i.unitPrice),
    };
    try {
      const saved = await api(isEdit ? `/api/invoices/${id}` : '/api/invoices', { method: isEdit ? 'PUT' : 'POST', body });
      toast.success(isEdit ? 'Invoice updated' : `Invoice ${saved.invoice_number} created`);
      navigate(`/invoices/${saved.id}`);
    } catch (err) {
      setErrors(err.errors || {});
      setFormError(err.message);
      setSaving(false);
    }
  };

  if (isEdit && !existing) return <div className="page-loader"><span className="page-loader__spinner" /></div>;

  return (
    <>
      <PageHeader title={isEdit ? `Edit ${existing.invoice_number}` : 'New invoice'} subtitle={isEdit ? undefined : 'The invoice number is given automatically when you save.'} />

      <form className="inv-form" onSubmit={save} noValidate>
        <div className="card card__body form form--flush">
          {formError && <div className="form__alert"><AlertCircle size={18} /> {formError}</div>}

          <div className="form__row form__row--3">
            <Field label="Customer" name="customerId" error={errors.customerId}>
              <select id="customerId" className="field__input" value={form.customerId} onChange={(e) => set('customerId', e.target.value)}>
                <option value="">Choose a customer</option>
                {(customers || []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              {can('customers.manage') && (
                <button type="button" className="link-btn inv-form__new-customer" onClick={() => setAddingCustomer(true)}>
                  <Plus size={14} /> New customer
                </button>
              )}
            </Field>
            <Field label="Issue date" name="issueDate" error={errors.issueDate}>
              <input id="issueDate" type="date" className="field__input" value={form.issueDate} onChange={(e) => set('issueDate', e.target.value)} />
            </Field>
            <Field label="Due date" name="dueDate" error={errors.dueDate}>
              <input id="dueDate" type="date" className="field__input" min={form.issueDate} value={form.dueDate} onChange={(e) => set('dueDate', e.target.value)} />
            </Field>
          </div>

          <div>
            <table className="inv-form__items">
              <thead>
                <tr><th>Description</th><th>Qty</th><th>Unit price (₦)</th><th>Amount</th><th /></tr>
              </thead>
              <tbody>
                {form.items.map((item, i) => (
                  <tr key={i}>
                    <td>
                      <input className="field__input" placeholder="What are you charging for?" value={item.description} onChange={(e) => setItem(i, 'description', e.target.value)} aria-label={`Item ${i + 1} description`} />
                    </td>
                    <td>
                      <input className="field__input" type="number" min="0" step="any" value={item.quantity} onChange={(e) => setItem(i, 'quantity', e.target.value)} aria-label={`Item ${i + 1} quantity`} />
                    </td>
                    <td>
                      <input className="field__input" type="number" min="0" step="0.01" placeholder="0.00" value={item.unitPrice} onChange={(e) => setItem(i, 'unitPrice', e.target.value)} aria-label={`Item ${i + 1} price`} />
                    </td>
                    <td className="inv-form__line">{formatMoney(Math.round(Number(item.quantity || 0) * Math.round(Number(item.unitPrice || 0) * 100)))}</td>
                    <td>
                      {form.items.length > 1 && (
                        <button type="button" className="icon-btn" onClick={() => set('items', form.items.filter((_, x) => x !== i))} aria-label="Remove item">
                          <Trash2 size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {errors.items && <p className="field__error">{errors.items}</p>}
            <button type="button" className="btn btn--outline btn--sm inv-form__add" onClick={() => set('items', [...form.items, blankItem()])}>
              <Plus size={16} /> Add item
            </button>
          </div>

          <div className="inv-form__bottom">
            <Field label="Notes for the customer" name="notes" optional>
              <textarea id="notes" className="field__input" placeholder="e.g. Thank you for your business" value={form.notes} onChange={(e) => set('notes', e.target.value)} />
            </Field>

            <div className="inv-form__totals">
              <div className="form__row">
                <Field label="Discount (₦)" name="discount" optional>
                  <input id="discount" type="number" min="0" step="0.01" className="field__input" value={form.discount} onChange={(e) => set('discount', e.target.value)} />
                </Field>
                <Field label="Tax / VAT (%)" name="taxRate" optional>
                  <input id="taxRate" type="number" min="0" max="100" step="0.01" className="field__input" placeholder="e.g. 7.5" value={form.taxRate} onChange={(e) => set('taxRate', e.target.value)} />
                </Field>
              </div>
              <dl>
                <dt>Subtotal</dt><dd>{formatMoney(totals.subtotal)}</dd>
                {totals.discount > 0 && (<><dt>Discount</dt><dd>−{formatMoney(totals.discount)}</dd></>)}
                {totals.tax > 0 && (<><dt>Tax ({form.taxRate}%)</dt><dd>{formatMoney(totals.tax)}</dd></>)}
                <dt className="inv-form__grand">Total</dt><dd className="inv-form__grand">{formatMoney(totals.total)}</dd>
              </dl>
            </div>
          </div>
        </div>

        <footer className="inv-form__footer">
          <button type="button" className="btn btn--ghost" onClick={() => navigate(-1)}>Cancel</button>
          <button type="submit" className="btn btn--primary" disabled={saving}>{saving ? 'Saving…' : isEdit ? 'Save changes' : 'Save invoice'}</button>
        </footer>
      </form>

      {addingCustomer && (
        <CustomerModal
          customer={null}
          onClose={() => setAddingCustomer(false)}
          onSaved={async (c) => {
            await reloadCustomers();
            set('customerId', c.id);
          }}
        />
      )}
    </>
  );
}
